import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Gamepad2, Users, Play, Hash, Copy, CheckCircle2, XCircle,
  ArrowRight, ArrowLeft, Loader2, Trophy, Clock, BarChart3, Pause, StopCircle, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

const PlayToLearnHost = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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

  useEffect(() => {
    // Only fetch when auth is done loading and user exists
    if (!authLoading && user) {
      fetchSession();
    } else if (!authLoading && !user) {
      setLoading(false);
      setError('Not authenticated');
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [sessionId, authLoading, user]);

  // Fallback polling every 15 seconds (WebSocket handles real-time updates)
  // This ensures data consistency if WebSocket messages are missed
  useEffect(() => {
    let pollInterval;
    
    if (session?.status === 'ACTIVE') {
      pollInterval = setInterval(async () => {
        // Only poll if WebSocket is disconnected
        if (!wsConnected) {
          console.log('[Host] WebSocket disconnected, using fallback polling...');
          try {
            const res = await axios.get(`${API}/play-to-learn/sessions/${sessionId}`, { withCredentials: true });
            
            // De-duplicate and update players with their selected modes
            const participants = res.data.participants || [];
            const uniqueParticipants = participants.reduce((acc, p) => {
              const existingIdx = acc.findIndex(existing => 
                existing.nickname.toLowerCase() === p.nickname.toLowerCase()
              );
              if (existingIdx === -1) {
                acc.push(p);
              } else {
                // Merge data, keeping the most recent info
                acc[existingIdx] = { ...acc[existingIdx], ...p };
              }
              return acc;
            }, []);
            
            setPlayers(uniqueParticipants);
            
            // Update session if status changed
            if (res.data.status !== session?.status) {
              setSession(res.data);
            }
          } catch (err) {
            console.error('[Host] Polling error:', err);
          }
        }
      }, 15000); // Poll every 15 seconds as fallback
    }
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [session?.status, sessionId, wsConnected]);

  const fetchSession = async () => {
    try {
      const res = await axios.get(`${API}/play-to-learn/sessions/${sessionId}`, { withCredentials: true });
      setSession(res.data);
      
      // De-duplicate players by nickname (case-insensitive)
      const participants = res.data.participants || [];
      const uniqueParticipants = participants.reduce((acc, p) => {
        const existingIdx = acc.findIndex(existing => 
          existing.nickname.toLowerCase() === p.nickname.toLowerCase()
        );
        if (existingIdx === -1) {
          acc.push(p);
        } else {
          // Keep the one with higher score or more recent
          if ((p.score || 0) > (acc[existingIdx].score || 0)) {
            acc[existingIdx] = p;
          }
        }
        return acc;
      }, []);
      
      setPlayers(uniqueParticipants);
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
    console.log('[Host] WebSocket message:', data.type, data);
    switch (data.type) {
      case 'connected':
        setPlayers(data.participants || []);
        break;
      case 'player_joined':
        // Add new player with full data
        setPlayers(prev => {
          const exists = prev.some(p => p.participant_id === data.participant.participant_id || p.nickname === data.participant.nickname);
          if (exists) {
            return prev;
          }
          return [...prev, data.participant];
        });
        toast.success(`${data.participant.nickname} ${language === 'es' ? 'se unió' : 'joined'}!`);
        break;
      case 'player_disconnected':
        setPlayers(prev => prev.filter(p => p.participant_id !== data.participant_id));
        break;
      case 'player_mode_selected':
        // Update player's selected mode instantly via WebSocket
        setPlayers(prev => prev.map(p => 
          p.participant_id === data.participant_id 
            ? { ...p, selected_mode: data.selected_mode }
            : p
        ));
        toast.info(`${data.nickname} ${language === 'es' ? 'eligió' : 'chose'} ${data.selected_mode.replace('_', ' ')}`);
        break;
      case 'answer_submitted':
        // Update stats with real-time data from WebSocket
        setAnswersReceived(prev => prev + 1);
        if (data.is_correct) {
          setCorrectAnswers(prev => prev + 1);
        }
        // Update player with full stats from WebSocket message
        if (data.participant_id) {
          setPlayers(prev => prev.map(p => 
            p.participant_id === data.participant_id 
              ? { 
                  ...p, 
                  score: data.score ?? (p.score || 0) + (data.is_correct ? 1 : 0),
                  streak: data.streak ?? p.streak,
                  selected_mode: data.selected_mode ?? p.selected_mode,
                  answers: p.answers ? [...p.answers, { is_correct: data.is_correct }] : [{ is_correct: data.is_correct }]
                }
              : p
          ));
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
      await axios.post(`${API}/play-to-learn/sessions/${sessionId}/start`, {}, { withCredentials: true });
      
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
      const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/next-question`, {}, { withCredentials: true });
      
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

  const endGame = async () => {
    try {
      await axios.post(`${API}/play-to-learn/sessions/${sessionId}/complete`, {}, { withCredentials: true });
      setSession(prev => ({ ...prev, status: 'COMPLETE' }));
      toast.success(language === 'es' ? '¡Sesión finalizada!' : 'Session ended!');
    } catch (err) {
      // If complete endpoint doesn't exist, just mark as complete locally
      setSession(prev => ({ ...prev, status: 'COMPLETE' }));
      toast.success(language === 'es' ? '¡Sesión finalizada!' : 'Session ended!');
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
          {/* Back Button */}
          <Button
            onClick={() => navigate('/teacher/play-to-learn')}
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Volver' : 'Back'}
          </Button>

          {/* Header */}
          <div className="text-center py-4">
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
    // Sort players by score for leaderboard view
    const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const isAllModes = session?.game_type === 'all_modes';
    
    // For ALL_MODES sessions, show a player progress dashboard instead of quiz questions
    if (isAllModes) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header with back button */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/teacher/play-to-learn')}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                {language === 'es' ? 'Volver' : 'Back'}
              </Button>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <span className="text-white/60 text-sm">{wsConnected ? (language === 'es' ? 'Conectado' : 'Connected') : (language === 'es' ? 'Reconectando...' : 'Reconnecting...')}</span>
              </div>
            </div>

            {/* All Modes Dashboard Header */}
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className="bg-white/20 mb-2">ALL MODES</Badge>
                    <h1 className="text-2xl font-bold">
                      {language === 'es' ? 'Tablero de Progreso en Vivo' : 'Live Progress Dashboard'}
                    </h1>
                    <p className="text-white/70">
                      {language === 'es' ? 'Los estudiantes juegan a su propio ritmo con el modo que eligieron' : 'Students play at their own pace with their chosen mode'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{players.length}</div>
                    <div className="text-white/70">{language === 'es' ? 'Jugadores' : 'Players'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Stats Summary */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-blue-500/20 border-blue-400/30">
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto text-blue-400 mb-1" />
                  <div className="text-2xl font-bold text-white">{players.filter(p => p.selected_mode).length}</div>
                  <p className="text-blue-200 text-sm">{language === 'es' ? 'Jugando' : 'Playing'}</p>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/20 border-yellow-400/30">
                <CardContent className="p-4 text-center">
                  <Clock className="h-8 w-8 mx-auto text-yellow-400 mb-1" />
                  <div className="text-2xl font-bold text-white">{players.filter(p => !p.selected_mode).length}</div>
                  <p className="text-yellow-200 text-sm">{language === 'es' ? 'Eligiendo' : 'Choosing'}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-500/20 border-green-400/30">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-400 mb-1" />
                  <div className="text-2xl font-bold text-white">{answersReceived}</div>
                  <p className="text-green-200 text-sm">{language === 'es' ? 'Respuestas' : 'Answers'}</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-500/20 border-purple-400/30">
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 mx-auto text-purple-400 mb-1" />
                  <div className="text-2xl font-bold text-white">
                    {answersReceived > 0 ? Math.round((correctAnswers / answersReceived) * 100) : 0}%
                  </div>
                  <p className="text-purple-200 text-sm">{language === 'es' ? 'Precisión' : 'Accuracy'}</p>
                </CardContent>
              </Card>
            </div>

            {/* Player Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPlayers.map((player, idx) => {
                const answeredCount = player.answers?.length || 0;
                const correctCount = player.answers?.filter(a => a.is_correct)?.length || 0;
                const progress = answeredCount > 0 ? (answeredCount / totalQuestions) * 100 : 0;
                
                const modeColors = {
                  'quiz': 'from-purple-500 to-indigo-600',
                  'true_false': 'from-blue-500 to-cyan-600',
                  'fill_blank': 'from-orange-500 to-amber-600',
                  'matching': 'from-green-500 to-teal-600',
                  'flashcard': 'from-pink-500 to-rose-600',
                  'memory': 'from-violet-500 to-purple-600'
                };
                
                const modeNames = {
                  'quiz': language === 'es' ? 'Quiz' : 'Quiz',
                  'true_false': language === 'es' ? 'V/F' : 'T/F',
                  'fill_blank': language === 'es' ? 'Completar' : 'Fill',
                  'matching': language === 'es' ? 'Parejas' : 'Match',
                  'flashcard': language === 'es' ? 'Tarjetas' : 'Flash',
                  'memory': language === 'es' ? 'Memoria' : 'Memory'
                };
                
                return (
                  <Card 
                    key={player.participant_id || idx} 
                    className={`bg-white/10 backdrop-blur-xl border-white/20 ${idx === 0 ? 'ring-2 ring-yellow-400' : ''}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {idx === 0 && <Trophy className="h-5 w-5 text-yellow-400" />}
                          <span className="text-white font-semibold">{player.nickname}</span>
                        </div>
                        <span className="text-2xl font-bold text-white">{player.score || 0}</span>
                      </div>
                      
                      {/* Mode Badge */}
                      {player.selected_mode ? (
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${modeColors[player.selected_mode] || 'from-gray-500 to-gray-600'}`}>
                          <Gamepad2 className="h-3 w-3" />
                          {modeNames[player.selected_mode] || player.selected_mode}
                        </div>
                      ) : (
                        <Badge className="bg-white/20 text-white/60">
                          {language === 'es' ? '⏳ Eligiendo modo...' : '⏳ Choosing mode...'}
                        </Badge>
                      )}
                      
                      {/* Progress */}
                      {player.selected_mode && (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs text-white/60">
                            <span>{answeredCount} / {totalQuestions} {language === 'es' ? 'respondidas' : 'answered'}</span>
                            <span>{correctCount} {language === 'es' ? 'correctas' : 'correct'}</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                      )}
                      
                      {/* Streak indicator */}
                      {(player.streak || 0) > 1 && (
                        <div className="mt-2 flex items-center gap-1 text-orange-400 text-sm">
                          <span>🔥</span>
                          <span>{player.streak} {language === 'es' ? 'racha' : 'streak'}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {players.length === 0 && (
                <div className="col-span-full text-center py-12 text-white/50">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{language === 'es' ? 'Esperando que se unan jugadores...' : 'Waiting for players to join...'}</p>
                </div>
              )}
            </div>

            {/* End Game Button */}
            <div className="text-center">
              <Button
                onClick={endGame}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <StopCircle className="h-5 w-5 mr-2" />
                {language === 'es' ? 'Finalizar Sesión' : 'End Session'}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular single-mode game view (non-ALL_MODES)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header with back button */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/teacher/play-to-learn')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              {language === 'es' ? 'Volver' : 'Back'}
            </Button>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              <span className="text-white/60 text-sm">{wsConnected ? (language === 'es' ? 'Conectado' : 'Connected') : (language === 'es' ? 'Reconectando...' : 'Reconnecting...')}</span>
            </div>
          </div>

          {/* Progress Header */}
          <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {language === 'es' ? 'Pregunta' : 'Question'} {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                  <Badge className="bg-white/20">{session?.game_type?.toUpperCase()}</Badge>
                </div>
              </div>
              <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="h-2 bg-white/20" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Question and controls */}
            <div className="lg:col-span-2 space-y-4">
              {/* Current Question Display */}
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
                    {currentQuestion?.question || currentQuestion?.statement || (language === 'es' ? 'Cargando pregunta...' : 'Loading question...')}
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

            {/* Right column - Live player list */}
            <div className="space-y-4">
              <Card className="bg-white/10 backdrop-blur-xl border-white/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'es' ? 'Jugadores en Vivo' : 'Live Players'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {sortedPlayers.length === 0 ? (
                    <p className="text-white/50 text-center py-4">
                      {language === 'es' ? 'Esperando jugadores...' : 'Waiting for players...'}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sortedPlayers.map((player, idx) => (
                        <div
                          key={player.participant_id || idx}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            idx === 0 ? 'bg-yellow-500/20' :
                            idx === 1 ? 'bg-slate-300/20' :
                            idx === 2 ? 'bg-orange-500/20' :
                            'bg-white/5'
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                            idx === 0 ? 'bg-yellow-500 text-yellow-900' :
                            idx === 1 ? 'bg-slate-300 text-slate-700' :
                            idx === 2 ? 'bg-orange-500 text-orange-900' :
                            'bg-white/20 text-white'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="flex-1 text-white text-sm truncate">
                            {player.nickname}
                          </span>
                          <span className="text-white font-bold text-sm">
                            {player.score || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
