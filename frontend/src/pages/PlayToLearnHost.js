import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Gamepad2, Users, Play, Hash, Copy, CheckCircle2, XCircle,
  ArrowRight, Loader2, Trophy, Clock, BarChart3, Pause, StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

const PlayToLearnHost = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const language = user?.language || 'es';

  // Session state
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Players
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  
  // Game state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answersReceived, setAnswersReceived] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  // WebSocket
  const wsRef = useRef(null);
  const [wsConnected, setWsConnected] = useState(false);

  const getAuthHeaders = () => ({ Authorization: `Bearer ${token}` });

  useEffect(() => {
    if (token) {
      fetchSession();
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, token]);

  const fetchSession = async () => {
    try {
      const res = await axios.get(`${API}/play-to-learn/sessions/${sessionId}`, { headers: getAuthHeaders() });
      setSession(res.data);
      setPlayers(res.data.participants || []);
      setCurrentQuestionIndex(res.data.current_question_index || 0);
      
      // Connect WebSocket
      connectWebSocket();
    } catch (err) {
      setError(err.response?.data?.detail || 'Session not found');
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_URL}/api/play-to-learn/ws/${sessionId}?participant_id=host&role=host`);
    
    ws.onopen = () => {
      console.log('[Host] WebSocket connected');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    ws.onerror = (error) => {
      console.error('[Host] WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('[Host] WebSocket disconnected');
      setWsConnected(false);
    };
    
    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        setPlayers(data.participants || []);
        break;
      case 'player_joined':
        setPlayers(prev => [...prev, data.participant]);
        toast.success(`${data.participant.nickname} ${language === 'es' ? 'se unió' : 'joined'}!`);
        break;
      case 'player_disconnected':
        setPlayers(prev => prev.filter(p => p.participant_id !== data.participant_id));
        break;
      case 'answer_submitted':
        setAnswersReceived(prev => prev + 1);
        if (data.is_correct) {
          setCorrectAnswers(prev => prev + 1);
        }
        break;
      case 'game_complete':
        fetchSession(); // Refresh to get final results
        break;
      default:
        break;
    }
  };

  const startGame = async () => {
    try {
      await axios.post(`${API}/play-to-learn/sessions/${sessionId}/start`, {}, { headers: authHeaders });
      
      // Send via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'start_game' }));
      }
      
      setSession(prev => ({ ...prev, status: 'ACTIVE' }));
      toast.success(language === 'es' ? '¡Juego iniciado!' : 'Game started!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error starting game');
    }
  };

  const nextQuestion = async () => {
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/next-question`, {}, { headers: authHeaders });
      
      // Send via WebSocket
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'next_question' }));
      }
      
      if (res.data.status === 'COMPLETE') {
        setSession(prev => ({ ...prev, status: 'COMPLETE' }));
        toast.success(language === 'es' ? '¡Juego completado!' : 'Game complete!');
      } else {
        setCurrentQuestionIndex(res.data.current_question_index);
        setAnswersReceived(0);
        setCorrectAnswers(0);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error advancing question');
    }
  };

  const copyPIN = () => {
    if (session?.join_pin) {
      navigator.clipboard.writeText(session.join_pin);
      toast.success(language === 'es' ? 'PIN copiado' : 'PIN copied');
    }
  };

  const copyJoinLink = () => {
    const url = `${window.location.origin}/play-to-learn?pin=${session?.join_pin}`;
    navigator.clipboard.writeText(url);
    toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p className="text-white/70">{error}</p>
            <Button onClick={() => navigate('/teacher/play-to-learn')} className="mt-4">
              {language === 'es' ? 'Volver' : 'Go Back'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = session?.game_payload?.questions?.length || 0;
  const currentQuestion = session?.game_payload?.questions?.[currentQuestionIndex];

  // Lobby View
  if (session?.status === 'LOBBY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              {language === 'es' ? 'Sala de Espera' : 'Waiting Room'}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              <span className="text-white/60 text-sm">
                {wsConnected ? (language === 'es' ? 'Conectado' : 'Connected') : (language === 'es' ? 'Conectando...' : 'Connecting...')}
              </span>
            </div>
          </div>

          {/* PIN Display */}
          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
            <CardContent className="p-8 text-center">
              <p className="text-white/80 text-lg mb-2">
                {language === 'es' ? 'Únete en' : 'Join at'}: <span className="font-bold">play-to-learn</span>
              </p>
              <div className="flex items-center justify-center gap-4">
                <Hash className="h-8 w-8 text-white" />
                <span className="text-6xl font-mono font-bold text-white tracking-widest">
                  {session?.join_pin}
                </span>
                <Button
                  onClick={copyPIN}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <Copy className="h-5 w-5" />
                </Button>
              </div>
              <Button
                onClick={copyJoinLink}
                variant="ghost"
                size="sm"
                className="mt-4 text-white/80 hover:text-white hover:bg-white/20"
              >
                <Copy className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Copiar enlace' : 'Copy link'}
              </Button>
            </CardContent>
          </Card>

          {/* Players Grid */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'es' ? 'Jugadores' : 'Players'} ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {players.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{language === 'es' ? 'Esperando jugadores...' : 'Waiting for players...'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {players.map((player, idx) => (
                    <div
                      key={player.participant_id || idx}
                      className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-3 text-center text-white animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="w-10 h-10 mx-auto rounded-full bg-white/20 flex items-center justify-center text-lg font-bold mb-1">
                        {player.nickname?.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium truncate">{player.nickname}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Start Button */}
          <div className="text-center">
            <Button
              onClick={startGame}
              disabled={players.length === 0}
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xl px-12 py-8 disabled:opacity-50"
            >
              <Play className="h-6 w-6 mr-2" />
              {language === 'es' ? 'Iniciar Juego' : 'Start Game'}
            </Button>
            {players.length === 0 && (
              <p className="text-white/50 mt-2 text-sm">
                {language === 'es' ? 'Espera a que se unan jugadores' : 'Wait for players to join'}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Game View
  if (session?.status === 'ACTIVE') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Progress Header */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {language === 'es' ? 'Pregunta' : 'Question'} {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                <Badge className="bg-white/20">{session?.game_type?.toUpperCase()}</Badge>
              </div>
              <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-2 bg-white/20" />
            </CardContent>
          </Card>

          {/* Current Question Display */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardContent className="p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
                {currentQuestion?.question}
              </h2>
              
              {currentQuestion?.options && (
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {currentQuestion.options.map((option, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-r from-purple-500/50 to-pink-500/50 rounded-xl p-4 text-white text-center"
                    >
                      <span className="inline-block w-8 h-8 rounded-full bg-white/20 mr-2 text-sm font-bold leading-8">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-blue-500/20 border-blue-400/30">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-blue-400 mb-1" />
                <div className="text-2xl font-bold text-white">{players.length}</div>
                <p className="text-blue-200 text-sm">{language === 'es' ? 'Jugadores' : 'Players'}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/20 border-green-400/30">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-400 mb-1" />
                <div className="text-2xl font-bold text-white">{answersReceived}</div>
                <p className="text-green-200 text-sm">{language === 'es' ? 'Respuestas' : 'Answers'}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/20 border-yellow-400/30">
              <CardContent className="p-4 text-center">
                <Trophy className="h-8 w-8 mx-auto text-yellow-400 mb-1" />
                <div className="text-2xl font-bold text-white">
                  {answersReceived > 0 ? Math.round((correctAnswers / answersReceived) * 100) : 0}%
                </div>
                <p className="text-yellow-200 text-sm">{language === 'es' ? 'Precisión' : 'Accuracy'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Control Button */}
          <div className="text-center">
            <Button
              onClick={nextQuestion}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-xl px-12 py-6"
            >
              {currentQuestionIndex < totalQuestions - 1 ? (
                <>
                  {language === 'es' ? 'Siguiente Pregunta' : 'Next Question'}
                  <ArrowRight className="h-6 w-6 ml-2" />
                </>
              ) : (
                <>
                  {language === 'es' ? 'Terminar Juego' : 'End Game'}
                  <Trophy className="h-6 w-6 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Complete View
  if (session?.status === 'COMPLETE') {
    // Sort players by score for leaderboard
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-600 via-orange-600 to-red-600 p-4">
        <div className="max-w-3xl mx-auto space-y-6 py-8">
          <div className="text-center">
            <Trophy className="h-20 w-20 mx-auto text-white mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">
              {language === 'es' ? '¡Juego Completado!' : 'Game Complete!'}
            </h1>
          </div>

          {/* Leaderboard */}
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-center">
                {language === 'es' ? 'Tabla de Posiciones' : 'Leaderboard'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedPlayers.slice(0, 10).map((player, idx) => (
                  <div
                    key={player.participant_id || idx}
                    className={`flex items-center gap-4 p-3 rounded-xl ${
                      idx === 0 ? 'bg-yellow-500/30' :
                      idx === 1 ? 'bg-slate-300/30' :
                      idx === 2 ? 'bg-orange-600/30' :
                      'bg-white/10'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      idx === 0 ? 'bg-yellow-500 text-yellow-900' :
                      idx === 1 ? 'bg-slate-300 text-slate-700' :
                      idx === 2 ? 'bg-orange-500 text-orange-900' :
                      'bg-white/20 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="flex-1 font-medium text-white">{player.nickname}</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">{player.score || 0}</div>
                      <div className="text-xs text-white/60">
                        {language === 'es' ? 'puntos' : 'points'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-white/80 mb-1" />
                <div className="text-2xl font-bold text-white">{players.length}</div>
                <p className="text-white/60 text-sm">{language === 'es' ? 'Participantes' : 'Participants'}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto text-white/80 mb-1" />
                <div className="text-2xl font-bold text-white">{totalQuestions}</div>
                <p className="text-white/60 text-sm">{language === 'es' ? 'Preguntas' : 'Questions'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => navigate('/teacher/play-to-learn')}
              variant="outline"
              className="border-white/30 text-white hover:bg-white/20"
            >
              {language === 'es' ? 'Volver al Panel' : 'Back to Dashboard'}
            </Button>
          </div>

          {/* Session Debug Info */}
          <div className="text-center text-white/30 text-xs">
            <p>Session: {sessionId}</p>
            <p>Question Set: {session?.question_set_id}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PlayToLearnHost;
