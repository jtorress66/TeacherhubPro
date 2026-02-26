import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Gamepad2, Users, Zap, Brain, Trophy, Play, CheckCircle2, XCircle,
  Clock, Target, Sparkles, RefreshCw, ArrowRight, Loader2, Timer, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

const PlayToLearnGame = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Session & participant info
  const [participantId, setParticipantId] = useState(searchParams.get('participant') || '');
  const [nickname, setNickname] = useState(decodeURIComponent(searchParams.get('nickname') || ''));
  const [language, setLanguage] = useState('en'); // Default to English
  
  // Session state
  const [session, setSession] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Join flow for self-paced
  const [needsToJoin, setNeedsToJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  
  // Mode selection
  const [showModeSelection, setShowModeSelection] = useState(false);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState('');
  
  // Score tracking
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [answers, setAnswers] = useState([]);
  
  // Timer
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  
  // Game completion
  const [gameComplete, setGameComplete] = useState(false);
  const [results, setResults] = useState(null);
  
  // Matching game specific state
  const [matchingSelected, setMatchingSelected] = useState({ term: null, definition: null });
  const [matchedPairs, setMatchedPairs] = useState([]);
  
  // Flashcard state
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  
  // Time attack state
  const [typedAnswer, setTypedAnswer] = useState('');
  
  // WebSocket for live mode
  const wsRef = useRef(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [lobbyPlayers, setLobbyPlayers] = useState([]);

  // Fetch session on mount
  useEffect(() => {
    fetchSession();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId]);

  // Timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const fetchSession = async () => {
    try {
      const res = await axios.get(`${API}/play-to-learn/sessions/${sessionId}`);
      setSession(res.data);
      setIsLiveMode(res.data.mode === 'LIVE');
      
      // Fetch assignment to get language setting
      try {
        const assignmentRes = await axios.get(`${API}/play-to-learn/assignments/${res.data.assignment_id}`);
        setAssignment(assignmentRes.data);
        // Set language from assignment
        setLanguage(assignmentRes.data.language || 'en');
      } catch (assignErr) {
        console.log('Could not fetch assignment details');
      }
      
      // Check if this is an "all_modes" session where student should pick
      const isAllModes = res.data.game_type === 'all_modes' || 
                         (res.data.allowed_game_types && res.data.allowed_game_types.length > 1);
      
      if (res.data.mode === 'LIVE' && res.data.status === 'LOBBY') {
        connectWebSocket();
        setLobbyPlayers(res.data.participants || []);
      } else if (res.data.mode === 'SELF_PACED' || res.data.status === 'ACTIVE') {
        // For self-paced, check if we need to join first
        if (!participantId && res.data.mode === 'SELF_PACED') {
          // Auto-join with a generated nickname if none provided
          await autoJoinSession(res.data, isAllModes);
        } else if (isAllModes && res.data.game_type === 'all_modes') {
          // Show mode selection if "all_modes" and student hasn't selected yet
          setShowModeSelection(true);
        } else {
          setGameStarted(true);
          startQuestion();
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching session:', err);
      setError(err.response?.data?.detail || 'Session not found');
    } finally {
      setLoading(false);
    }
  };

  const autoJoinSession = async (sessionData, shouldShowModeSelection = false) => {
    // Generate a nickname if not provided
    const playerNickname = nickname || `Player_${Math.random().toString(36).substring(2, 7)}`;
    setNickname(playerNickname);
    
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/join`, {
        nickname: playerNickname,
        pin: sessionData.join_pin
      });
      
      setParticipantId(res.data.participant_id);
      
      // Check if student should select mode
      const allowedModes = res.data.allowed_game_types || sessionData.allowed_game_types || [];
      const isAllModes = sessionData.game_type === 'all_modes' || allowedModes.length > 1;
      
      if (isAllModes && sessionData.game_type === 'all_modes') {
        setShowModeSelection(true);
      } else {
        setGameStarted(true);
        startQuestion();
      }
    } catch (err) {
      console.error('Error auto-joining session:', err);
      // Show join form if auto-join fails
      setNeedsToJoin(true);
    }
  };

  const handleManualJoin = async () => {
    if (!nickname.trim()) {
      toast.error(language === 'en' ? 'Enter your name' : 'Ingresa tu nombre');
      return;
    }
    
    setJoining(true);
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/join`, {
        nickname: nickname.trim(),
        pin: session?.join_pin
      });
      
      setParticipantId(res.data.participant_id);
      setNeedsToJoin(false);
      
      // Check if student should select mode
      const allowedModes = res.data.allowed_game_types || session?.allowed_game_types || [];
      const isAllModes = session?.game_type === 'all_modes' || allowedModes.length > 1;
      
      if (isAllModes && session?.game_type === 'all_modes') {
        setShowModeSelection(true);
      } else {
        setGameStarted(true);
        startQuestion();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error joining');
    } finally {
      setJoining(false);
    }
  };

  const connectWebSocket = () => {
    const ws = new WebSocket(`${WS_URL}/api/play-to-learn/ws/${sessionId}?participant_id=${participantId}&role=player`);
    
    ws.onopen = () => {
      console.log('[PTL] WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };
    
    ws.onclose = () => {
      console.log('[PTL] WebSocket disconnected');
    };
    
    wsRef.current = ws;
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        setLobbyPlayers(data.participants || []);
        break;
      case 'player_joined':
        setLobbyPlayers(prev => [...prev, data.participant]);
        toast.success(`${data.participant.nickname} joined!`);
        break;
      case 'player_disconnected':
        setLobbyPlayers(prev => prev.filter(p => p.participant_id !== data.participant_id));
        break;
      case 'game_started':
        setGameStarted(true);
        setCurrentQuestionIndex(data.current_question_index || 0);
        startQuestion();
        break;
      case 'next_question':
        setCurrentQuestionIndex(data.current_question_index);
        resetQuestionState();
        startQuestion();
        break;
      case 'game_complete':
        handleGameComplete();
        break;
      case 'answer_result':
        handleAnswerResult(data);
        break;
      default:
        break;
    }
  };

  const startQuestion = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTypedAnswer('');
    setFlashcardFlipped(false);
    startTimeRef.current = Date.now();
    
    const gameType = session?.game_type;
    const timeLimit = gameType === 'time_attack' ? 15 : 30;
    setTimeLeft(timeLimit);
    setTimerActive(true);
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setTypedAnswer('');
    setFlashcardFlipped(false);
    clearInterval(timerRef.current);
    setTimerActive(false);
  };

  const handleTimeUp = () => {
    if (!showFeedback) {
      submitAnswer(null, true);
    }
  };

  const submitAnswer = async (answer, isTimeout = false) => {
    if (showFeedback) return;
    
    setTimerActive(false);
    clearInterval(timerRef.current);
    
    const timeTaken = Date.now() - (startTimeRef.current || Date.now());
    const questions = session?.game_payload?.questions || [];
    const currentQ = questions[currentQuestionIndex];
    
    if (!currentQ) return;
    
    try {
      const res = await axios.post(
        `${API}/play-to-learn/sessions/${sessionId}/submit-answer?participant_id=${participantId}`,
        {
          item_id: currentQ.item_id,
          answer: answer || '',
          time_taken_ms: timeTaken
        }
      );
      
      handleAnswerResult(res.data);
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Still show feedback on error
      setShowFeedback(true);
      setIsCorrect(false);
    }
  };

  const handleAnswerResult = (result) => {
    setShowFeedback(true);
    setIsCorrect(result.is_correct);
    setExplanation(result.explanation || '');
    setScore(result.score || score);
    setStreak(result.streak || 0);
    setBestStreak(prev => Math.max(prev, result.streak || 0));
    
    setAnswers(prev => [...prev, {
      questionIndex: currentQuestionIndex,
      isCorrect: result.is_correct,
      correctAnswer: result.correct_answer
    }]);
    
    if (result.is_correct) {
      toast.success(language === 'es' ? '¡Correcto!' : 'Correct!');
    } else {
      toast.error(language === 'es' ? 'Incorrecto' : 'Incorrect');
    }
  };

  const nextQuestion = () => {
    const questions = session?.game_payload?.questions || [];
    
    if (currentQuestionIndex >= questions.length - 1) {
      handleGameComplete();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
      startQuestion();
    }
  };

  const handleGameComplete = async () => {
    setGameComplete(true);
    
    // Use local tracking as primary source
    const questions = session?.game_payload?.questions || [];
    const cards = session?.game_payload?.cards || [];
    const totalQ = questions.length || cards.length;
    
    // Calculate local results first
    const localResults = {
      score: score,
      total_questions: totalQ,
      accuracy_percent: totalQ > 0 ? Math.round((score / totalQ) * 100) : 0,
      best_streak: bestStreak,
      average_response_time_ms: totalTime > 0 && answers.length > 0 ? Math.round(totalTime / answers.length) : 0,
      missed_count: totalQ - score
    };
    
    // Try to submit to server
    if (participantId) {
      try {
        const res = await axios.post(
          `${API}/play-to-learn/sessions/${sessionId}/complete?participant_id=${participantId}`
        );
        // Merge server results with local tracking (prefer local for accuracy)
        setResults({
          ...res.data,
          score: localResults.score,
          accuracy_percent: localResults.accuracy_percent,
          best_streak: localResults.best_streak
        });
      } catch (err) {
        console.error('Error completing session:', err);
        setResults(localResults);
      }
    } else {
      setResults(localResults);
    }
  };

  const playAgain = async () => {
    // Create a new session with the same assignment and game type
    toast.info(language === 'en' ? 'Creating new game...' : 'Creando nuevo juego...');
    
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions`, {
        assignment_id: session?.assignment_id,
        game_type: session?.game_type,
        mode: 'SELF_PACED'
      }, { withCredentials: true });
      
      // Navigate to the new session
      navigate(`/play-to-learn/game/${res.data.session_id}`);
      window.location.reload(); // Force reload to reset state
    } catch (err) {
      toast.error(language === 'en' ? 'Error creating new game' : 'Error al crear nuevo juego');
    }
  };

  const tryDifferentMode = () => {
    // Show mode selection instead of navigating away
    setShowModeSelection(true);
    setGameComplete(false);
  };

  const selectNewMode = async (newGameType) => {
    toast.info(language === 'en' ? 'Creating new game...' : 'Creando nuevo juego...');
    
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions`, {
        assignment_id: session?.assignment_id,
        game_type: newGameType,
        mode: 'SELF_PACED'
      }, { withCredentials: true });
      
      // Navigate to the new session
      navigate(`/play-to-learn/game/${res.data.session_id}`);
      window.location.reload(); // Force reload to reset state
    } catch (err) {
      toast.error(language === 'en' ? 'Error creating new game' : 'Error al crear nuevo juego');
    }
  };

  // Handle matching game
  const handleMatchingSelect = (type, item) => {
    if (matchedPairs.includes(item.item_id)) return;
    
    if (type === 'term') {
      setMatchingSelected(prev => ({ ...prev, term: item }));
    } else {
      setMatchingSelected(prev => ({ ...prev, definition: item }));
    }
  };

  // Check matching pair
  useEffect(() => {
    if (matchingSelected.term && matchingSelected.definition) {
      const pairs = session?.game_payload?.pairs || [];
      const isMatch = pairs.some(
        p => p.term_id === matchingSelected.term.item_id && 
             p.definition_id === matchingSelected.definition.item_id
      );
      
      if (isMatch) {
        setMatchedPairs(prev => [...prev, matchingSelected.term.item_id, matchingSelected.definition.item_id]);
        setScore(prev => prev + 1);
        setStreak(prev => prev + 1);
        toast.success(language === 'es' ? '¡Correcto!' : 'Correct!');
      } else {
        setStreak(0);
        toast.error(language === 'es' ? 'Intenta de nuevo' : 'Try again');
      }
      
      setTimeout(() => setMatchingSelected({ term: null, definition: null }), 300);
    }
  }, [matchingSelected]);

  // Check if matching complete
  useEffect(() => {
    const pairs = session?.game_payload?.pairs || [];
    if (session?.game_type === 'matching' && matchedPairs.length === pairs.length * 2) {
      handleGameComplete();
    }
  }, [matchedPairs]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-white animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardContent className="p-8 text-center">
            <XCircle className="h-16 w-16 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold mb-2">{language === 'en' ? 'Error' : 'Error'}</h2>
            <p className="text-white/70">{error}</p>
            <Button onClick={() => navigate('/play-to-learn')} className="mt-4">
              {language === 'en' ? 'Back to Home' : 'Volver al Inicio'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Need to join (enter nickname)
  if (needsToJoin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <Gamepad2 className="h-12 w-12 mx-auto text-yellow-400 mb-2" />
            <CardTitle>{language === 'en' ? 'Enter Your Name' : 'Ingresa tu Nombre'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={language === 'en' ? 'Your nickname...' : 'Tu nombre...'}
              className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
              onKeyPress={(e) => e.key === 'Enter' && handleManualJoin()}
            />
            <Button
              onClick={handleManualJoin}
              disabled={joining || !nickname.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
            >
              {joining ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              {language === 'en' ? 'Start Playing' : 'Comenzar a Jugar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mode selection screen
  if (showModeSelection) {
    const gameModes = [
      { id: 'quiz', icon: Brain, name: language === 'en' ? 'Classic Quiz' : 'Quiz Clásico', color: 'from-purple-500 to-indigo-600', desc: language === 'en' ? 'Multiple choice questions' : 'Preguntas de opción múltiple' },
      { id: 'time_attack', icon: Zap, name: language === 'en' ? 'Time Attack' : 'Ataque de Tiempo', color: 'from-orange-500 to-red-600', desc: language === 'en' ? 'Answer quickly!' : '¡Responde rápido!' },
      { id: 'matching', icon: Target, name: language === 'en' ? 'Matching' : 'Emparejamiento', color: 'from-green-500 to-teal-600', desc: language === 'en' ? 'Connect pairs' : 'Conecta pares' },
      { id: 'flashcard', icon: Sparkles, name: language === 'en' ? 'Flashcards' : 'Tarjetas Flash', color: 'from-pink-500 to-rose-600', desc: language === 'en' ? 'Study cards' : 'Tarjetas de estudio' },
      { id: 'true_false', icon: CheckCircle2, name: language === 'en' ? 'True/False' : 'Verdadero/Falso', color: 'from-blue-500 to-cyan-600', desc: language === 'en' ? 'Is it true?' : '¿Es verdadero?' },
      { id: 'fill_blank', icon: Target, name: language === 'en' ? 'Fill in Blank' : 'Completar', color: 'from-amber-500 to-yellow-600', desc: language === 'en' ? 'Complete sentences' : 'Completa oraciones' },
      { id: 'word_search', icon: Target, name: language === 'en' ? 'Word Search' : 'Sopa de Letras', color: 'from-emerald-500 to-green-600', desc: language === 'en' ? 'Find words' : 'Encuentra palabras' },
      { id: 'memory', icon: Brain, name: language === 'en' ? 'Memory Game' : 'Juego de Memoria', color: 'from-violet-500 to-purple-600', desc: language === 'en' ? 'Match cards' : 'Empareja cartas' }
    ];
    
    // Filter to allowed modes if available
    const allowedModes = session?.allowed_game_types || assignment?.allowed_game_types || ['quiz', 'time_attack', 'matching', 'flashcard', 'true_false', 'fill_blank', 'word_search', 'memory'];
    const availableModes = gameModes.filter(m => allowedModes.includes(m.id));
    
    // Check if this is initial selection (game_type is 'all_modes') or post-game selection
    const isInitialSelection = session?.game_type === 'all_modes';
    
    // Function to handle initial mode selection
    const handleInitialModeSelect = async (modeId) => {
      toast.info(language === 'en' ? 'Loading game...' : 'Cargando juego...');
      try {
        const res = await axios.post(`${API}/play-to-learn/sessions/${sessionId}/select-mode`, {
          game_type: modeId,
          participant_id: participantId
        });
        
        // Update session with new payload
        setSession(prev => ({
          ...prev,
          game_type: modeId,
          game_payload: res.data.game_payload
        }));
        
        setShowModeSelection(false);
        setGameStarted(true);
        startQuestion();
      } catch (err) {
        toast.error(err.response?.data?.detail || 'Error selecting mode');
      }
    };
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <Sparkles className="h-12 w-12 mx-auto text-yellow-400 mb-2" />
            <CardTitle className="text-2xl">
              {language === 'en' ? 'Choose How to Play!' : '¡Elige Cómo Jugar!'}
            </CardTitle>
            <p className="text-white/70 text-sm mt-2">
              {assignment?.topic || session?.topic || ''}
            </p>
            {nickname && (
              <Badge className="mt-2 bg-purple-500/50">{nickname}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {availableModes.map((mode) => (
                <Button
                  key={mode.id}
                  onClick={() => isInitialSelection ? handleInitialModeSelect(mode.id) : selectNewMode(mode.id)}
                  className={`w-full bg-gradient-to-r ${mode.color} py-8 flex-col h-auto gap-1 hover:scale-105 transition-transform`}
                  disabled={!isInitialSelection && mode.id === session?.game_type}
                >
                  <mode.icon className="h-8 w-8" />
                  <span className="text-sm font-bold">{mode.name}</span>
                  <span className="text-xs opacity-80">{mode.desc}</span>
                </Button>
              ))}
            </div>
            {!isInitialSelection && (
              <Button
                variant="ghost"
                onClick={() => {
                  setShowModeSelection(false);
                  setGameComplete(true);
                }}
                className="w-full text-white/70 hover:text-white hover:bg-white/10 mt-4"
              >
                {language === 'en' ? 'Back to Results' : 'Volver a Resultados'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lobby state (Live mode waiting)
  if (isLiveMode && !gameStarted && session?.status === 'LOBBY') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <Gamepad2 className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
            <CardTitle className="text-2xl">
              {language === 'es' ? 'Sala de Espera' : 'Waiting Room'}
            </CardTitle>
            <p className="text-white/70">
              {language === 'es' ? 'Esperando que el maestro inicie el juego...' : 'Waiting for teacher to start the game...'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/70">{language === 'es' ? 'Jugadores:' : 'Players:'}</span>
                <Badge className="bg-purple-500">{lobbyPlayers.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lobbyPlayers.map((player, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                      {player.nickname?.charAt(0).toUpperCase()}
                    </div>
                    <span>{player.nickname}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-2 mt-4">
                <Loader2 className="h-4 w-4 animate-spin text-white/50" />
                <span className="text-white/50 text-sm">
                  {language === 'es' ? 'Conectado' : 'Connected'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (gameComplete && results) {
    const accuracyColor = results.accuracy_percent >= 80 ? 'text-green-400' : 
                         results.accuracy_percent >= 60 ? 'text-yellow-400' : 'text-red-400';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-white/10 backdrop-blur-xl border-white/20 text-white overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-2" />
            <h1 className="text-3xl font-bold">
              {language === 'es' ? '¡Completado!' : 'Complete!'}
            </h1>
          </div>
          
          <CardContent className="p-6 space-y-6">
            {/* Score */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {results.score}/{results.total_questions}
              </div>
              <div className={`text-2xl font-semibold ${accuracyColor}`}>
                {results.accuracy_percent}% {language === 'es' ? 'Precisión' : 'Accuracy'}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Flame className="h-8 w-8 mx-auto text-orange-400 mb-1" />
                <div className="text-2xl font-bold">{results.best_streak || bestStreak}</div>
                <div className="text-sm text-white/70">{language === 'es' ? 'Mejor Racha' : 'Best Streak'}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <Timer className="h-8 w-8 mx-auto text-blue-400 mb-1" />
                <div className="text-2xl font-bold">
                  {Math.round((results.average_response_time_ms || 0) / 1000)}s
                </div>
                <div className="text-sm text-white/70">{language === 'es' ? 'Tiempo Promedio' : 'Avg Time'}</div>
              </div>
            </div>
            
            {/* Areas to practice */}
            {results.missed_count > 0 && (
              <div className="bg-red-500/20 rounded-xl p-4">
                <p className="text-sm text-center">
                  {language === 'es' 
                    ? `${results.missed_count} pregunta(s) para repasar`
                    : `${results.missed_count} question(s) to review`}
                </p>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={playAgain}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 py-6 text-lg"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                {language === 'es' ? 'Jugar de Nuevo' : 'Play Again'}
              </Button>
              
              <Button
                onClick={tryDifferentMode}
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/10 py-6"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {language === 'es' ? 'Probar Otro Modo' : 'Try Different Mode'}
              </Button>
              
              <Button
                onClick={() => navigate('/play-to-learn')}
                variant="ghost"
                className="w-full text-white/70 hover:text-white hover:bg-white/10"
              >
                {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main game view
  const questions = session?.game_payload?.questions || [];
  const cards = session?.game_payload?.cards || [];
  const currentQ = questions[currentQuestionIndex];
  const currentCard = cards[currentQuestionIndex];
  const totalQuestions = questions.length || cards.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 py-4 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Progress Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20">{session?.game_type?.toUpperCase()}</Badge>
                <span className="font-medium">{nickname}</span>
              </div>
              <span className="text-sm">{currentQuestionIndex + 1} / {totalQuestions}</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
            <div className="flex items-center justify-between mt-2 text-sm">
              <div className="flex items-center gap-4">
                <span><Trophy className="h-4 w-4 inline mr-1" /> {score}</span>
                <span><Flame className="h-4 w-4 inline mr-1" /> {streak}</span>
              </div>
              {timerActive && (
                <div className={`flex items-center gap-1 ${timeLeft <= 5 ? 'text-red-300 animate-pulse' : ''}`}>
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{timeLeft}s</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Game Content */}
        <Card className="border-2 border-purple-300/30 bg-white/5 backdrop-blur-xl">
          <CardContent className="p-6 min-h-[400px]">
            {/* Quiz Mode */}
            {session?.game_type === 'quiz' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-purple-500/50 text-white">
                    {language === 'es' ? 'Pregunta' : 'Question'} {currentQuestionIndex + 1}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.question}
                  </h3>
                </div>
                
                <div className="grid gap-3">
                  {currentQ.options?.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrectAnswer = option === currentQ.correct_answer;
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (!showFeedback) {
                            setSelectedAnswer(option);
                            submitAnswer(option);
                          }
                        }}
                        disabled={showFeedback}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all text-white ${
                          showFeedback
                            ? isCorrectAnswer
                              ? 'border-green-400 bg-green-500/30'
                              : isSelected
                              ? 'border-red-400 bg-red-500/30'
                              : 'border-white/20 opacity-50'
                            : 'border-white/30 hover:border-purple-400 hover:bg-purple-500/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            showFeedback
                              ? isCorrectAnswer
                                ? 'bg-green-400 text-green-900'
                                : isSelected
                                ? 'bg-red-400 text-red-900'
                                : 'bg-white/20'
                              : 'bg-white/20'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 font-medium">{option}</span>
                          {showFeedback && isCorrectAnswer && (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          )}
                          {showFeedback && isSelected && !isCorrectAnswer && (
                            <XCircle className="h-5 w-5 text-red-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {showFeedback && (
                  <div className="space-y-4">
                    {explanation && (
                      <div className="bg-white/10 rounded-xl p-4 text-white/80 text-sm">
                        {explanation}
                      </div>
                    )}
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'} <Trophy className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Time Attack Mode */}
            {session?.game_type === 'time_attack' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Zap className="h-10 w-10 mx-auto text-orange-400 mb-2" />
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.question}
                  </h3>
                </div>
                
                {!showFeedback ? (
                  <div className="flex gap-2">
                    <Input
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder={language === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
                      className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && typedAnswer.trim()) {
                          setSelectedAnswer(typedAnswer);
                          submitAnswer(typedAnswer);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={() => {
                        setSelectedAnswer(typedAnswer);
                        submitAnswer(typedAnswer);
                      }}
                      disabled={!typedAnswer.trim()}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`text-center p-4 rounded-xl ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-2" />
                      ) : (
                        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
                      )}
                      <p className="text-white font-medium">
                        {language === 'es' ? 'Respuesta correcta:' : 'Correct answer:'} {currentQ.correct_answer}
                      </p>
                    </div>
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-500 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'}</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Matching Mode */}
            {session?.game_type === 'matching' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white text-center">
                  {language === 'es' ? 'Empareja los términos' : 'Match the terms'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Terms */}
                  <div className="space-y-2">
                    <p className="text-sm text-white/70 text-center">
                      {language === 'es' ? 'Términos' : 'Terms'}
                    </p>
                    {session.game_payload?.terms?.map((term, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMatchingSelect('term', term)}
                        disabled={matchedPairs.includes(term.item_id)}
                        className={`w-full p-3 rounded-lg border-2 text-sm text-white transition-all ${
                          matchedPairs.includes(term.item_id)
                            ? 'bg-green-500/30 border-green-400 opacity-60'
                            : matchingSelected.term?.item_id === term.item_id
                            ? 'bg-purple-500/30 border-purple-400'
                            : 'border-white/30 hover:border-purple-400'
                        }`}
                      >
                        {term.text}
                      </button>
                    ))}
                  </div>
                  {/* Definitions */}
                  <div className="space-y-2">
                    <p className="text-sm text-white/70 text-center">
                      {language === 'es' ? 'Definiciones' : 'Definitions'}
                    </p>
                    {session.game_payload?.definitions?.map((def, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMatchingSelect('definition', def)}
                        disabled={matchedPairs.includes(def.item_id)}
                        className={`w-full p-3 rounded-lg border-2 text-sm text-white transition-all ${
                          matchedPairs.includes(def.item_id)
                            ? 'bg-green-500/30 border-green-400 opacity-60'
                            : matchingSelected.definition?.item_id === def.item_id
                            ? 'bg-pink-500/30 border-pink-400'
                            : 'border-white/30 hover:border-pink-400'
                        }`}
                      >
                        {def.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Flashcard Mode */}
            {session?.game_type === 'flashcard' && currentCard && (
              <div className="flex flex-col items-center space-y-6">
                <div 
                  onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                  className="w-full max-w-md h-64 cursor-pointer perspective-1000"
                >
                  <div 
                    className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                      flashcardFlipped ? 'rotate-y-180' : ''
                    }`}
                    style={{ 
                      transformStyle: 'preserve-3d',
                      transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* Front */}
                    <div 
                      className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 flex flex-col items-center justify-center text-white shadow-lg"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <p className="text-sm uppercase tracking-wider mb-2 opacity-70">
                        {language === 'es' ? 'Término' : 'Term'}
                      </p>
                      <p className="text-xl font-bold text-center">{currentCard.front}</p>
                      <p className="text-sm mt-4 opacity-70">
                        {language === 'es' ? '(Toca para voltear)' : '(Tap to flip)'}
                      </p>
                    </div>
                    {/* Back */}
                    <div 
                      className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 p-6 flex flex-col items-center justify-center text-white shadow-lg"
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                      <p className="text-sm uppercase tracking-wider mb-2 opacity-70">
                        {language === 'es' ? 'Definición' : 'Definition'}
                      </p>
                      <p className="text-xl font-bold text-center">{currentCard.back}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => {
                      setScore(prev => prev);
                      setStreak(0);
                      nextQuestion();
                    }}
                    variant="outline"
                    className="border-red-400 text-red-400 hover:bg-red-500/20"
                  >
                    {language === 'es' ? 'No lo sabía' : "Didn't know"}
                  </Button>
                  <Button 
                    onClick={() => {
                      setScore(prev => prev + 1);
                      setStreak(prev => prev + 1);
                      setBestStreak(prev => Math.max(prev, streak + 1));
                      nextQuestion();
                    }}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {language === 'es' ? '¡Lo sabía!' : 'Got it!'}
                  </Button>
                </div>
              </div>
            )}

            {/* True/False Mode */}
            {session?.game_type === 'true_false' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-cyan-500/50 text-white">
                    {language === 'es' ? 'Verdadero o Falso' : 'True or False'}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.statement || currentQ.question}
                  </h3>
                </div>
                
                {!showFeedback ? (
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        setSelectedAnswer('true');
                        submitAnswer('true');
                      }}
                      className="bg-green-500 hover:bg-green-600 py-8 px-12 text-xl"
                    >
                      <CheckCircle2 className="h-6 w-6 mr-2" />
                      {language === 'es' ? 'Verdadero' : 'True'}
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedAnswer('false');
                        submitAnswer('false');
                      }}
                      className="bg-red-500 hover:bg-red-600 py-8 px-12 text-xl"
                    >
                      <XCircle className="h-6 w-6 mr-2" />
                      {language === 'es' ? 'Falso' : 'False'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`text-center p-4 rounded-xl ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-2" />
                      ) : (
                        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
                      )}
                      <p className="text-white font-medium">
                        {language === 'es' ? 'Respuesta correcta:' : 'Correct answer:'} {currentQ.is_true ? (language === 'es' ? 'Verdadero' : 'True') : (language === 'es' ? 'Falso' : 'False')}
                      </p>
                    </div>
                    {explanation && (
                      <div className="bg-white/10 rounded-xl p-4 text-white/80 text-sm">
                        {explanation}
                      </div>
                    )}
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'} <Trophy className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Fill in the Blank Mode */}
            {session?.game_type === 'fill_blank' && currentQ && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-orange-500/50 text-white">
                    {language === 'es' ? 'Completar' : 'Fill in the Blank'}
                  </Badge>
                  <h3 className="text-xl md:text-2xl font-semibold text-white">
                    {currentQ.sentence || currentQ.question}
                  </h3>
                  {currentQ.hint && (
                    <p className="text-white/60 mt-2 text-sm">
                      {language === 'es' ? 'Pista:' : 'Hint:'} {currentQ.hint}
                    </p>
                  )}
                </div>
                
                {!showFeedback ? (
                  <div className="flex gap-2 max-w-md mx-auto">
                    <Input
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      placeholder={language === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
                      className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && typedAnswer.trim()) {
                          setSelectedAnswer(typedAnswer);
                          submitAnswer(typedAnswer);
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      onClick={() => {
                        setSelectedAnswer(typedAnswer);
                        submitAnswer(typedAnswer);
                      }}
                      disabled={!typedAnswer.trim()}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`text-center p-4 rounded-xl ${isCorrect ? 'bg-green-500/30' : 'bg-red-500/30'}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-400 mb-2" />
                      ) : (
                        <XCircle className="h-12 w-12 mx-auto text-red-400 mb-2" />
                      )}
                      <p className="text-white font-medium">
                        {language === 'es' ? 'Respuesta correcta:' : 'Correct answer:'} {currentQ.blank_answer || currentQ.correct_answer}
                      </p>
                    </div>
                    {explanation && (
                      <div className="bg-white/10 rounded-xl p-4 text-white/80 text-sm">
                        {explanation}
                      </div>
                    )}
                    <Button
                      onClick={nextQuestion}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 py-6"
                    >
                      {currentQuestionIndex < totalQuestions - 1 ? (
                        <>{language === 'es' ? 'Siguiente' : 'Next'} <ArrowRight className="ml-2 h-5 w-5" /></>
                      ) : (
                        <>{language === 'es' ? 'Ver Resultados' : 'See Results'} <Trophy className="ml-2 h-5 w-5" /></>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Word Search Mode */}
            {session?.game_type === 'word_search' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-green-500/50 text-white">
                    {language === 'es' ? 'Sopa de Letras' : 'Word Search'}
                  </Badge>
                  <p className="text-white/80">
                    {language === 'es' ? 'Encuentra las palabras ocultas' : 'Find the hidden words'}
                  </p>
                </div>
                
                {/* Words to find */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {session.game_payload?.words?.map((word, idx) => (
                    <Badge 
                      key={idx} 
                      className={`text-sm py-1 px-3 ${
                        matchedPairs.includes(word) 
                          ? 'bg-green-500/50 line-through' 
                          : 'bg-white/20'
                      }`}
                    >
                      {word}
                    </Badge>
                  ))}
                </div>

                {/* Hints */}
                <div className="space-y-2 max-w-md mx-auto">
                  <p className="text-white/60 text-sm text-center">
                    {language === 'es' ? 'Pistas:' : 'Hints:'}
                  </p>
                  {session.game_payload?.hints?.slice(0, 4).map((hint, idx) => (
                    <div key={idx} className="bg-white/10 rounded-lg p-2 text-sm text-white/80">
                      • {hint.hint}
                    </div>
                  ))}
                </div>

                {/* Word input */}
                <div className="flex gap-2 max-w-md mx-auto">
                  <Input
                    value={typedAnswer}
                    onChange={(e) => setTypedAnswer(e.target.value.toUpperCase())}
                    placeholder={language === 'es' ? 'Escribe una palabra...' : 'Type a word...'}
                    className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50 uppercase"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && typedAnswer.trim()) {
                        const word = typedAnswer.trim().toUpperCase();
                        if (session.game_payload?.words?.includes(word) && !matchedPairs.includes(word)) {
                          setMatchedPairs(prev => [...prev, word]);
                          setScore(prev => prev + 1);
                          setStreak(prev => prev + 1);
                          toast.success(language === 'es' ? '¡Encontrado!' : 'Found!');
                          
                          // Check if all words found
                          if (matchedPairs.length + 1 >= session.game_payload?.words?.length) {
                            handleGameComplete();
                          }
                        } else if (matchedPairs.includes(word)) {
                          toast.info(language === 'es' ? 'Ya encontrada' : 'Already found');
                        } else {
                          toast.error(language === 'es' ? 'No está en la lista' : 'Not in the list');
                          setStreak(0);
                        }
                        setTypedAnswer('');
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      const word = typedAnswer.trim().toUpperCase();
                      if (session.game_payload?.words?.includes(word) && !matchedPairs.includes(word)) {
                        setMatchedPairs(prev => [...prev, word]);
                        setScore(prev => prev + 1);
                        setStreak(prev => prev + 1);
                        toast.success(language === 'es' ? '¡Encontrado!' : 'Found!');
                        
                        if (matchedPairs.length + 1 >= session.game_payload?.words?.length) {
                          handleGameComplete();
                        }
                      }
                      setTypedAnswer('');
                    }}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-center text-white/60 text-sm">
                  {matchedPairs.length} / {session.game_payload?.words?.length || 0} {language === 'es' ? 'encontradas' : 'found'}
                </p>
              </div>
            )}

            {/* Sequence Mode */}
            {session?.game_type === 'sequence' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-violet-500/50 text-white">
                    {language === 'es' ? 'Ordenar' : 'Sequence'}
                  </Badge>
                  <p className="text-white/80">
                    {language === 'es' ? 'Ordena los elementos correctamente' : 'Put the items in the correct order'}
                  </p>
                </div>
                
                {/* Items to order */}
                <div className="space-y-2 max-w-md mx-auto">
                  {(session.game_payload?.shuffled_order || []).map((itemId, idx) => {
                    const item = session.game_payload?.items?.find(i => i.item_id === itemId);
                    return (
                      <div
                        key={itemId}
                        className="flex items-center gap-3 bg-white/10 border-2 border-white/30 rounded-xl p-4 text-white"
                      >
                        <span className="w-8 h-8 rounded-full bg-violet-500/50 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{item?.text}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="text-center">
                  <Button
                    onClick={() => {
                      // Simple check - in a real implementation you'd have drag-and-drop
                      toast.info(language === 'es' ? 'Arrastra para reordenar (próximamente)' : 'Drag to reorder (coming soon)');
                      // For now, auto-complete with partial score
                      handleGameComplete();
                    }}
                    className="bg-violet-500 hover:bg-violet-600"
                  >
                    {language === 'es' ? 'Verificar Orden' : 'Check Order'}
                  </Button>
                </div>
              </div>
            )}

            {/* Memory Game Mode */}
            {session?.game_type === 'memory' && (
              <div className="space-y-6">
                <div className="text-center">
                  <Badge className="mb-4 bg-pink-500/50 text-white">
                    {language === 'es' ? 'Memoria' : 'Memory Game'}
                  </Badge>
                  <p className="text-white/80">
                    {language === 'es' ? 'Encuentra los pares' : 'Find the matching pairs'}
                  </p>
                </div>
                
                {/* Memory cards grid */}
                <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto">
                  {session.game_payload?.pairs?.flatMap((pair, idx) => [
                    { id: `${pair.pair_id}_a`, text: pair.card_a, pairId: pair.pair_id },
                    { id: `${pair.pair_id}_b`, text: pair.card_b, pairId: pair.pair_id }
                  ]).sort(() => Math.random() - 0.5).map((card, idx) => {
                    const isMatched = matchedPairs.includes(card.pairId);
                    const isSelected = matchingSelected.term?.id === card.id || matchingSelected.definition?.id === card.id;
                    
                    return (
                      <button
                        key={card.id}
                        onClick={() => {
                          if (isMatched) return;
                          
                          if (!matchingSelected.term) {
                            setMatchingSelected({ term: card, definition: null });
                          } else if (matchingSelected.term.id !== card.id) {
                            // Check if match
                            if (matchingSelected.term.pairId === card.pairId) {
                              setMatchedPairs(prev => [...prev, card.pairId]);
                              setScore(prev => prev + 1);
                              setStreak(prev => prev + 1);
                              toast.success(language === 'es' ? '¡Par encontrado!' : 'Match found!');
                              
                              if (matchedPairs.length + 1 >= session.game_payload?.pairs?.length) {
                                setTimeout(() => handleGameComplete(), 500);
                              }
                            } else {
                              setStreak(0);
                              toast.error(language === 'es' ? 'No es par' : 'Not a match');
                            }
                            setTimeout(() => setMatchingSelected({ term: null, definition: null }), 300);
                          }
                        }}
                        disabled={isMatched}
                        className={`aspect-square rounded-lg p-2 text-xs font-medium transition-all ${
                          isMatched
                            ? 'bg-green-500/30 border-green-400 text-green-200'
                            : isSelected
                            ? 'bg-pink-500/50 border-pink-400 text-white'
                            : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                        } border-2`}
                      >
                        {isMatched || isSelected ? card.text : '?'}
                      </button>
                    );
                  })}
                </div>

                <p className="text-center text-white/60 text-sm">
                  {matchedPairs.length} / {session.game_payload?.pairs?.length || 0} {language === 'es' ? 'pares encontrados' : 'pairs found'}
                </p>
              </div>
            )}

            {/* Fallback for unknown game types */}
            {!['quiz', 'time_attack', 'matching', 'flashcard', 'true_false', 'fill_blank', 'word_search', 'sequence', 'memory'].includes(session?.game_type) && (
              <div className="text-center text-white/60 py-12">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>{language === 'es' ? 'Modo de juego no soportado' : 'Game mode not supported'}: {session?.game_type}</p>
                <Button onClick={() => navigate('/play-to-learn')} className="mt-4">
                  {language === 'es' ? 'Volver' : 'Go Back'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session info footer */}
        <div className="text-center text-white/40 text-xs">
          <p>Session: {sessionId?.substring(0, 15)}... | QS: {session?.question_set_id?.substring(0, 10)}...</p>
        </div>
      </div>
    </div>
  );
};

export default PlayToLearnGame;
