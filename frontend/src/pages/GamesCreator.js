import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Progress } from '../components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Gamepad2, Sparkles, Brain, Target, Puzzle, Trophy, 
  HelpCircle, CheckCircle2, Loader2, Play, Share2, Copy,
  Shuffle, Grid3X3, ListChecks, MessageSquare, Zap, Star,
  BookOpen, GraduationCap, ChevronRight, RefreshCw, Download,
  Search, LayoutGrid, GripVertical, BarChart3, Medal, Users, Clock, Link2, X,
  Volume2, VolumeX, Timer, Award, Flame
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Sound effects using Web Audio API
const useGameSounds = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const playSound = useCallback((type) => {
    if (!soundEnabled) return;
    
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      switch(type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.4);
          break;
        case 'wrong':
          oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
          oscillator.frequency.setValueAtTime(150, audioCtx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
          break;
        case 'click':
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.05);
          break;
        case 'complete':
          // Victory fanfare
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);
            osc.start(audioCtx.currentTime + i * 0.15);
            osc.stop(audioCtx.currentTime + i * 0.15 + 0.3);
          });
          break;
        case 'flip':
          oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
          oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.05);
          gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.1);
          break;
        default:
          break;
      }
    } catch (e) {
      console.log('Sound not available');
    }
  }, [soundEnabled]);
  
  return { playSound, soundEnabled, setSoundEnabled };
};

const GamesCreator = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { playSound, soundEnabled, setSoundEnabled } = useGameSounds();
  
  // All state declarations must be at the top, before any useEffect
  const [activeTab, setActiveTab] = useState('create');
  const [generating, setGenerating] = useState(false);
  const [lessonContent, setLessonContent] = useState('');
  const [gameType, setGameType] = useState('quiz');
  const [gradeLevel, setGradeLevel] = useState('3-5');
  const [subject, setSubject] = useState('math');
  const [questionCount, setQuestionCount] = useState('5');
  const [generatedGame, setGeneratedGame] = useState(null);
  const [savedGames, setSavedGames] = useState([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [playingGame, setPlayingGame] = useState(null);
  const [gameProgress, setGameProgress] = useState({ current: 0, score: 0, streak: 0, bestStreak: 0, answers: [] });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedGameForLeaderboard, setSelectedGameForLeaderboard] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [gameTimer, setGameTimer] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Game-specific state (must be at top level, not after conditional returns)
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [matchingSelected, setMatchingSelected] = useState({ left: null, right: null });
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [shuffledRight, setShuffledRight] = useState([]);
  const [wordSearchFound, setWordSearchFound] = useState([]);
  const [crosswordAnswers, setCrosswordAnswers] = useState({});
  const [dragDropOrder, setDragDropOrder] = useState([]);
  const [draggingItem, setDraggingItem] = useState(null);
  const [shareLink, setShareLink] = useState('');

  // Game timer effect
  useEffect(() => {
    let interval;
    if (playingGame && !showResult && !showNameInput) {
      interval = setInterval(() => {
        setGameTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playingGame, showResult, showNameInput]);

  // Confetti effect
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const gameTypes = [
    { 
      id: 'quiz', 
      name: language === 'es' ? 'Quiz de Opción Múltiple' : 'Multiple Choice Quiz',
      icon: HelpCircle,
      description: language === 'es' ? 'Preguntas con opciones de respuesta' : 'Questions with answer options',
      color: 'blue'
    },
    { 
      id: 'matching', 
      name: language === 'es' ? 'Juego de Emparejamiento' : 'Matching Game',
      icon: Puzzle,
      description: language === 'es' ? 'Conecta conceptos relacionados' : 'Connect related concepts',
      color: 'purple'
    },
    { 
      id: 'fill_blanks', 
      name: language === 'es' ? 'Completar Espacios' : 'Fill in the Blanks',
      icon: MessageSquare,
      description: language === 'es' ? 'Completa las oraciones' : 'Complete the sentences',
      color: 'green'
    },
    { 
      id: 'true_false', 
      name: language === 'es' ? 'Verdadero o Falso' : 'True or False',
      icon: CheckCircle2,
      description: language === 'es' ? 'Decide si es verdadero o falso' : 'Decide if true or false',
      color: 'amber'
    },
    { 
      id: 'flashcards', 
      name: language === 'es' ? 'Tarjetas de Memoria' : 'Flashcards',
      icon: Grid3X3,
      description: language === 'es' ? 'Tarjetas para memorizar' : 'Cards for memorization',
      color: 'pink'
    },
    { 
      id: 'word_search', 
      name: language === 'es' ? 'Sopa de Letras' : 'Word Search',
      icon: Search,
      description: language === 'es' ? 'Encuentra palabras escondidas' : 'Find hidden words in the grid',
      color: 'cyan'
    },
    { 
      id: 'crossword', 
      name: language === 'es' ? 'Crucigrama' : 'Crossword',
      icon: LayoutGrid,
      description: language === 'es' ? 'Resuelve el crucigrama' : 'Solve the crossword puzzle',
      color: 'indigo'
    },
    { 
      id: 'drag_drop', 
      name: language === 'es' ? 'Arrastrar y Soltar' : 'Drag and Drop',
      icon: GripVertical,
      description: language === 'es' ? 'Ordena o clasifica elementos' : 'Sort or categorize items',
      color: 'rose'
    },
  ];

  const gradeLevels = [
    { id: 'k-2', name: language === 'es' ? 'Kínder - 2do' : 'K-2nd Grade', emoji: '🌱' },
    { id: '3-5', name: language === 'es' ? '3ro - 5to' : '3rd-5th Grade', emoji: '🌿' },
    { id: '6-8', name: language === 'es' ? '6to - 8vo' : '6th-8th Grade', emoji: '🌳' },
    { id: '9-12', name: language === 'es' ? '9no - 12vo' : '9th-12th Grade', emoji: '🎓' },
  ];

  const subjects = [
    { id: 'math', name: language === 'es' ? 'Matemáticas' : 'Mathematics', icon: '📐', color: 'blue' },
    { id: 'english', name: language === 'es' ? 'Inglés / Lenguaje' : 'English / Language Arts', icon: '📚', color: 'purple' },
    { id: 'science', name: language === 'es' ? 'Ciencias' : 'Science', icon: '🔬', color: 'green' },
    { id: 'social_studies', name: language === 'es' ? 'Estudios Sociales' : 'Social Studies', icon: '🌍', color: 'amber' },
    { id: 'history', name: language === 'es' ? 'Historia' : 'History', icon: '📜', color: 'orange' },
    { id: 'geography', name: language === 'es' ? 'Geografía' : 'Geography', icon: '🗺️', color: 'teal' },
    { id: 'art', name: language === 'es' ? 'Arte' : 'Art', icon: '🎨', color: 'pink' },
    { id: 'music', name: language === 'es' ? 'Música' : 'Music', icon: '🎵', color: 'indigo' },
    { id: 'pe', name: language === 'es' ? 'Educación Física' : 'Physical Education', icon: '⚽', color: 'red' },
    { id: 'other', name: language === 'es' ? 'Otro' : 'Other', icon: '📝', color: 'slate' },
  ];

  useEffect(() => {
    fetchSavedGames();
    fetchAnalytics();
  }, []);

  // Initialize shuffled items for matching games (must be at top level)
  useEffect(() => {
    if (playingGame?.game_type === 'matching' && playingGame?.questions) {
      const rightItems = playingGame.questions.map(q => q.match || q.correct_answer);
      setShuffledRight([...rightItems].sort(() => Math.random() - 0.5));
      setMatchedPairs([]);
    }
  }, [playingGame]);

  // Check for match when both selected (matching game)
  useEffect(() => {
    if (matchingSelected.left && matchingSelected.right && playingGame?.game_type === 'matching') {
      const leftQ = playingGame.questions.find(q => 
        (q.question || q.term || q.left) === matchingSelected.left.text
      );
      const correctAnswer = leftQ?.correct_answer || leftQ?.match || leftQ?.right;
      
      if (matchingSelected.right.text === correctAnswer) {
        // Correct match
        setMatchedPairs(prev => [...prev, matchingSelected.left.text, matchingSelected.right.text]);
        setGameProgress(prev => ({ ...prev, score: prev.score + 1 }));
        toast.success(language === 'es' ? '¡Correcto!' : 'Correct!');
      } else {
        toast.error(language === 'es' ? 'Intenta de nuevo' : 'Try again');
      }
      
      setTimeout(() => setMatchingSelected({ left: null, right: null }), 300);
    }
  }, [matchingSelected, playingGame, language]);

  // Check if matching game complete
  useEffect(() => {
    if (playingGame?.game_type === 'matching' && matchedPairs.length > 0 && 
        matchedPairs.length === playingGame.questions.length * 2) {
      setShowResult(true);
      if (playingGame.game_id && playerName) {
        submitScore(playingGame, gameProgress.score, playingGame.questions.length);
      }
    }
  }, [matchedPairs, playingGame, playerName, gameProgress.score]);

  const fetchSavedGames = async () => {
    try {
      const res = await axios.get(`${API}/games`, { withCredentials: true });
      setSavedGames(res.data || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoadingGames(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API}/games/analytics`, { withCredentials: true });
      setAnalytics(res.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchLeaderboard = async (gameId) => {
    try {
      const res = await axios.get(`${API}/games/${gameId}/leaderboard`);
      setLeaderboard(res.data || []);
      setSelectedGameForLeaderboard(gameId);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const submitScore = async (game, score, totalQuestions) => {
    const timeTaken = gameStartTime ? Math.floor((Date.now() - gameStartTime) / 1000) : 0;
    try {
      await axios.post(`${API}/games/${game.game_id}/score`, {
        player_name: playerName || 'Anonymous',
        score: score,
        total_questions: totalQuestions,
        time_taken: timeTaken
      });
      fetchLeaderboard(game.game_id);
      fetchAnalytics();
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const generateGame = async () => {
    if (!lessonContent.trim()) {
      toast.error(language === 'es' ? 'Ingrese el contenido de la lección' : 'Enter lesson content');
      return;
    }

    setGenerating(true);
    try {
      const res = await axios.post(`${API}/games/generate`, {
        content: lessonContent,
        game_type: gameType,
        grade_level: gradeLevel,
        subject: subject,
        question_count: parseInt(questionCount),
        language: language
      }, { withCredentials: true });
      
      setGeneratedGame(res.data);
      toast.success(language === 'es' ? '¡Juego generado!' : 'Game generated!');
    } catch (error) {
      console.error('Error generating game:', error);
      const errorMsg = error.response?.data?.detail || 'Error generating game';
      toast.error(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const saveGame = async () => {
    if (!generatedGame) return;
    
    try {
      const res = await axios.post(`${API}/games/save`, generatedGame, { withCredentials: true });
      toast.success(language === 'es' ? '¡Juego guardado!' : 'Game saved!');
      fetchSavedGames();
      setActiveTab('library');
    } catch (error) {
      console.error('Error saving game:', error);
      toast.error(language === 'es' ? 'Error al guardar' : 'Error saving');
    }
  };

  const startGame = (game, isPreview = false) => {
    if (!isPreview && game.game_id) {
      // For saved games, show name input first
      setShowNameInput(true);
      setPlayingGame(game);
    } else {
      // For preview, start immediately
      setPlayingGame(game);
      setGameProgress({ current: 0, score: 0, answers: [] });
      setSelectedAnswer(null);
      setShowResult(false);
      setGameStartTime(Date.now());
    }
  };

  const startGameWithName = () => {
    setShowNameInput(false);
    setGameProgress({ current: 0, score: 0, answers: [] });
    setSelectedAnswer(null);
    setShowResult(false);
    setGameStartTime(Date.now());
    if (playingGame?.game_id) {
      fetchLeaderboard(playingGame.game_id);
    }
  };

  const handleAnswer = (answer, correctAnswer) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === correctAnswer;
    
    // Play sound effect
    if (isCorrect) {
      playSound('correct');
    } else {
      playSound('wrong');
    }
    
    setTimeout(() => {
      setGameProgress(prev => ({
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score,
        streak: isCorrect ? prev.streak + 1 : 0,
        bestStreak: isCorrect ? Math.max(prev.bestStreak, prev.streak + 1) : prev.bestStreak,
        answers: [...prev.answers, { answer, correct: isCorrect }]
      }));
      
      if (gameProgress.current < playingGame.questions.length - 1) {
        setGameProgress(prev => ({ ...prev, current: prev.current + 1 }));
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
        setShowConfetti(true);
        playSound('complete');
        // Submit score if this is a saved game (has game_id)
        if (playingGame.game_id && playerName) {
          const finalScore = isCorrect ? gameProgress.score + 1 : gameProgress.score;
          submitScore(playingGame, finalScore, playingGame.questions.length);
        }
        // Save progress
        saveGameProgress();
      }
    }, 1000);
  };

  const saveGameProgress = async () => {
    if (!playingGame?.game_id) return;
    try {
      await axios.post(`${API}/games/${playingGame.game_id}/progress`, {
        current_question: gameProgress.current,
        score: gameProgress.score,
        answers: gameProgress.answers,
        started_at: gameStartTime
      }, { withCredentials: true });
    } catch (error) {
      console.log('Progress save error:', error);
    }
  };

  const resetGame = () => {
    setGameProgress({ current: 0, score: 0, streak: 0, bestStreak: 0, answers: [] });
    setSelectedAnswer(null);
    setShowResult(false);
    setGameStartTime(Date.now());
    setGameTimer(0);
    setShowConfetti(false);
  };

  const exitGame = () => {
    setPlayingGame(null);
    setShowNameInput(false);
    setPlayerName('');
    resetGame();
    setGameTimer(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getShareLink = (gameId) => {
    return `${window.location.origin}/play-game/${gameId}`;
  };

  const copyShareLink = (gameId) => {
    navigator.clipboard.writeText(getShareLink(gameId));
    toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
  };

  // Name input screen
  if (showNameInput && playingGame) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {playingGame.title}
              </h2>
              <p className="text-slate-600 mb-6">
                {language === 'es' ? 'Ingresa tu nombre para el ranking' : 'Enter your name for the leaderboard'}
              </p>
              <Input
                placeholder={language === 'es' ? 'Tu nombre' : 'Your name'}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="mb-4 text-center"
                data-testid="player-name-input"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={exitGame} className="flex-1">
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </Button>
                <Button 
                  onClick={startGameWithName}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  data-testid="start-game-btn"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Jugar' : 'Play'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Render different game types
  const renderGameContent = () => {
    const currentQ = playingGame.questions[gameProgress.current];
    const gameType = playingGame.game_type;

    // Quiz / Multiple Choice / True-False
    if (gameType === 'quiz' || gameType === 'true_false') {
      return (
        <div className="grid gap-3">
          {currentQ.options?.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQ.correct_answer;
            const showFeedback = selectedAnswer !== null;
            
            return (
              <button
                key={idx}
                onClick={() => !selectedAnswer && handleAnswer(option, currentQ.correct_answer)}
                disabled={selectedAnswer !== null}
                data-testid={`option-${idx}`}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  showFeedback
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : isSelected
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 opacity-50'
                    : 'border-slate-200 hover:border-purple-400 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    showFeedback
                      ? isCorrect
                        ? 'bg-green-200 text-green-700'
                        : isSelected
                        ? 'bg-red-200 text-red-700'
                        : 'bg-slate-200 text-slate-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 font-medium">{option}</span>
                  {showFeedback && isCorrect && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      );
    }

    // Flashcards
    if (gameType === 'flashcards') {
      return (
        <div className="flex flex-col items-center">
          <div 
            onClick={() => setFlashcardFlipped(!flashcardFlipped)}
            className="w-full max-w-md h-64 cursor-pointer perspective-1000"
            data-testid="flashcard"
          >
            <div className={`relative w-full h-full transition-all duration-500 transform-style-preserve-3d ${
              flashcardFlipped ? 'rotate-y-180' : ''
            }`}
            style={{ transformStyle: 'preserve-3d', transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              {/* Front - Question */}
              <div 
                className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 p-6 flex flex-col items-center justify-center text-white shadow-lg"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-sm uppercase tracking-wider mb-2 opacity-70">
                  {language === 'es' ? 'Pregunta' : 'Question'}
                </p>
                <p className="text-xl font-bold text-center">{currentQ.question || currentQ.front || currentQ.term}</p>
                <p className="text-sm mt-4 opacity-70">
                  {language === 'es' ? '(Toca para voltear)' : '(Tap to flip)'}
                </p>
              </div>
              
              {/* Back - Answer */}
              <div 
                className="absolute w-full h-full rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 p-6 flex flex-col items-center justify-center text-white shadow-lg"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <p className="text-sm uppercase tracking-wider mb-2 opacity-70">
                  {language === 'es' ? 'Respuesta' : 'Answer'}
                </p>
                <p className="text-xl font-bold text-center">{currentQ.correct_answer || currentQ.back || currentQ.definition}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setFlashcardFlipped(false);
                handleAnswer('incorrect', 'correct');
              }}
              className="border-red-300 text-red-600 hover:bg-red-50"
              data-testid="flashcard-wrong"
            >
              {language === 'es' ? 'No lo sabía' : "Didn't know"}
            </Button>
            <Button 
              onClick={() => {
                setFlashcardFlipped(false);
                handleAnswer('correct', 'correct');
              }}
              className="bg-green-600 hover:bg-green-700"
              data-testid="flashcard-correct"
            >
              {language === 'es' ? '¡Lo sabía!' : 'Got it!'}
            </Button>
          </div>
        </div>
      );
    }

    // Fill in the Blanks
    if (gameType === 'fill_blanks') {
      const checkFillBlank = () => {
        const userAnswer = fillBlankAnswer.trim().toLowerCase();
        const correctAnswer = (currentQ.correct_answer || currentQ.answer || '').toLowerCase();
        const isCorrect = userAnswer === correctAnswer || 
                         correctAnswer.includes(userAnswer) || 
                         userAnswer.includes(correctAnswer);
        handleAnswer(isCorrect ? 'correct' : 'incorrect', 'correct');
        setFillBlankAnswer('');
      };

      return (
        <div className="space-y-6">
          <div className="text-center p-6 bg-slate-50 rounded-xl">
            <p className="text-xl text-slate-700">
              {(currentQ.question || currentQ.sentence || '').replace(/___+|_blank_/gi, 
                '<span class="inline-block min-w-[100px] border-b-2 border-purple-400 mx-1"></span>'
              ).split('<span').map((part, idx) => 
                idx === 0 ? part : <span key={idx} className="inline-block min-w-[100px] border-b-2 border-purple-400 mx-1 text-purple-600 font-bold">{fillBlankAnswer || '___'}</span>
              )}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Input
              value={fillBlankAnswer}
              onChange={(e) => setFillBlankAnswer(e.target.value)}
              placeholder={language === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
              className="flex-1"
              data-testid="fill-blank-input"
              onKeyPress={(e) => e.key === 'Enter' && fillBlankAnswer.trim() && checkFillBlank()}
            />
            <Button 
              onClick={checkFillBlank}
              disabled={!fillBlankAnswer.trim()}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="fill-blank-submit"
            >
              {language === 'es' ? 'Verificar' : 'Check'}
            </Button>
          </div>
          
          {currentQ.hint && (
            <p className="text-sm text-slate-500 text-center">
              <span className="font-medium">{language === 'es' ? 'Pista:' : 'Hint:'}</span> {currentQ.hint}
            </p>
          )}
        </div>
      );
    }

    // Matching Game
    if (gameType === 'matching') {
      const leftItems = playingGame.questions.map(q => ({ 
        id: q.question || q.term || q.left,
        text: q.question || q.term || q.left 
      }));
      const rightItems = shuffledRight.map((item, idx) => ({ 
        id: idx, 
        text: item 
      }));

      const handleMatchClick = (side, item) => {
        if (matchedPairs.includes(item.text)) return;
        
        if (side === 'left') {
          setMatchingSelected({ ...matchingSelected, left: item });
        } else {
          setMatchingSelected({ ...matchingSelected, right: item });
        }
      };

      return (
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 text-center mb-2">
              {language === 'es' ? 'Términos' : 'Terms'}
            </p>
            {leftItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleMatchClick('left', item)}
                disabled={matchedPairs.includes(item.text)}
                data-testid={`match-left-${idx}`}
                className={`w-full p-3 rounded-lg border-2 text-sm transition-all ${
                  matchedPairs.includes(item.text)
                    ? 'bg-green-50 border-green-300 text-green-700 opacity-60'
                    : matchingSelected.left?.text === item.text
                    ? 'bg-purple-100 border-purple-400'
                    : 'border-slate-200 hover:border-purple-300'
                }`}
              >
                {item.text}
              </button>
            ))}
          </div>
          
          {/* Right Column */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 text-center mb-2">
              {language === 'es' ? 'Definiciones' : 'Definitions'}
            </p>
            {rightItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleMatchClick('right', item)}
                disabled={matchedPairs.includes(item.text)}
                data-testid={`match-right-${idx}`}
                className={`w-full p-3 rounded-lg border-2 text-sm transition-all ${
                  matchedPairs.includes(item.text)
                    ? 'bg-green-50 border-green-300 text-green-700 opacity-60'
                    : matchingSelected.right?.text === item.text
                    ? 'bg-pink-100 border-pink-400'
                    : 'border-slate-200 hover:border-pink-300'
                }`}
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Word Search - Generate grid with actual letters
    if (gameType === 'word_search') {
      const words = playingGame.questions.map(q => (q.word || q.question || q.term || '').toUpperCase());
      
      // Generate word search grid if not provided
      const generateGrid = () => {
        const gridSize = 12;
        const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
        const directions = [[0,1], [1,0], [1,1], [0,-1], [-1,0], [-1,-1], [1,-1], [-1,1]];
        
        // Place words
        words.forEach(word => {
          const wordArr = word.split('');
          let placed = false;
          let attempts = 0;
          
          while (!placed && attempts < 100) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const startRow = Math.floor(Math.random() * gridSize);
            const startCol = Math.floor(Math.random() * gridSize);
            
            // Check if word fits
            let canPlace = true;
            for (let i = 0; i < wordArr.length; i++) {
              const newRow = startRow + (dir[0] * i);
              const newCol = startCol + (dir[1] * i);
              if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
                canPlace = false;
                break;
              }
              if (grid[newRow][newCol] !== '' && grid[newRow][newCol] !== wordArr[i]) {
                canPlace = false;
                break;
              }
            }
            
            if (canPlace) {
              for (let i = 0; i < wordArr.length; i++) {
                grid[startRow + (dir[0] * i)][startCol + (dir[1] * i)] = wordArr[i];
              }
              placed = true;
            }
            attempts++;
          }
        });
        
        // Fill empty cells with random letters
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') {
              grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
            }
          }
        }
        return grid;
      };
      
      const grid = playingGame.grid || generateGrid();

      const handleCellClick = (row, col) => {
        // Simple word marking - toggle cell selection
        const cellKey = `${row}-${col}`;
        if (wordSearchFound.includes(cellKey)) {
          setWordSearchFound(wordSearchFound.filter(k => k !== cellKey));
        } else {
          setWordSearchFound([...wordSearchFound, cellKey]);
        }
      };

      return (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl">
            <p className="text-sm font-medium text-slate-600 mb-3">
              {language === 'es' ? 'Encuentra estas palabras:' : 'Find these words:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {words.map((word, idx) => (
                <Badge key={idx} variant="outline" className="px-3 py-1 text-base">
                  {word}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Word Grid */}
          <div className="flex justify-center overflow-x-auto">
            <div 
              className="inline-grid gap-1 p-4 bg-white rounded-xl border-2 border-slate-200" 
              style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 12}, 1fr)` }}
            >
              {grid.map((row, rowIdx) => 
                row.map((letter, colIdx) => {
                  const cellKey = `${rowIdx}-${colIdx}`;
                  const isSelected = wordSearchFound.includes(cellKey);
                  return (
                    <button
                      key={cellKey}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      className={`w-8 h-8 flex items-center justify-center font-mono font-bold rounded cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-purple-500 text-white' 
                          : 'text-slate-700 bg-slate-50 hover:bg-purple-100'
                      }`}
                      data-testid={`word-cell-${rowIdx}-${colIdx}`}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setWordSearchFound([])}>
              {language === 'es' ? 'Reiniciar' : 'Reset'}
            </Button>
            <Button onClick={() => setShowResult(true)} className="bg-purple-600 hover:bg-purple-700">
              {language === 'es' ? 'Terminé' : 'I\'m Done'}
            </Button>
          </div>
        </div>
      );
    }

    // Crossword - Interactive grid with input
    if (gameType === 'crossword') {
      const acrossClues = playingGame.questions.filter((_, i) => i % 2 === 0);
      const downClues = playingGame.questions.filter((_, i) => i % 2 === 1);
      
      const handleCrosswordInput = (clueIdx, value) => {
        setCrosswordAnswers({ ...crosswordAnswers, [clueIdx]: value.toUpperCase() });
      };

      const checkCrosswordAnswers = () => {
        let correct = 0;
        playingGame.questions.forEach((q, idx) => {
          const answer = crosswordAnswers[idx] || '';
          const correctAnswer = (q.correct_answer || q.answer || '').toUpperCase();
          if (answer === correctAnswer) correct++;
        });
        setGameProgress(prev => ({ ...prev, score: correct }));
        setShowResult(true);
      };

      return (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Clues & Input */}
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                  <ChevronRight className="h-4 w-4" />
                  {language === 'es' ? 'Horizontal' : 'Across'}
                </p>
                <div className="space-y-3">
                  {acrossClues.map((q, idx) => {
                    const actualIdx = idx * 2;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-sm font-bold text-blue-600 mt-2">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 mb-1">{q.clue || q.question}</p>
                          <Input
                            value={crosswordAnswers[actualIdx] || ''}
                            onChange={(e) => handleCrosswordInput(actualIdx, e.target.value)}
                            placeholder={`${(q.correct_answer || '').length} ${language === 'es' ? 'letras' : 'letters'}`}
                            className="uppercase font-mono"
                            maxLength={(q.correct_answer || '').length + 2}
                            data-testid={`crossword-across-${idx}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-xl">
                <p className="font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 rotate-90" />
                  {language === 'es' ? 'Vertical' : 'Down'}
                </p>
                <div className="space-y-3">
                  {downClues.map((q, idx) => {
                    const actualIdx = idx * 2 + 1;
                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-sm font-bold text-purple-600 mt-2">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700 mb-1">{q.clue || q.question}</p>
                          <Input
                            value={crosswordAnswers[actualIdx] || ''}
                            onChange={(e) => handleCrosswordInput(actualIdx, e.target.value)}
                            placeholder={`${(q.correct_answer || '').length} ${language === 'es' ? 'letras' : 'letters'}`}
                            className="uppercase font-mono"
                            maxLength={(q.correct_answer || '').length + 2}
                            data-testid={`crossword-down-${idx}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Visual Hint */}
            <div className="bg-slate-50 p-4 rounded-xl">
              <p className="text-sm font-medium text-slate-600 mb-4">
                {language === 'es' ? 'Respuestas hasta ahora:' : 'Your answers so far:'}
              </p>
              <div className="space-y-2">
                {playingGame.questions.map((q, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Badge variant="outline" className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-purple-50'}>
                      {idx % 2 === 0 ? 'A' : 'D'}{Math.floor(idx/2) + 1}
                    </Badge>
                    <span className="font-mono text-lg tracking-wider">
                      {(crosswordAnswers[idx] || '').padEnd((q.correct_answer || '').length, '_').split('').join(' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setCrosswordAnswers({})}>
              {language === 'es' ? 'Limpiar' : 'Clear'}
            </Button>
            <Button onClick={checkCrosswordAnswers} className="bg-purple-600 hover:bg-purple-700">
              {language === 'es' ? 'Verificar Respuestas' : 'Check Answers'}
            </Button>
          </div>
        </div>
      );
    }

    // Drag and Drop - Full implementation with reordering
    if (gameType === 'drag_drop') {
      // Initialize drag order if empty
      const items = currentQ.items || currentQ.options || [];
      if (dragDropOrder.length === 0 && items.length > 0) {
        // Shuffle items initially
        const shuffled = [...items].sort(() => Math.random() - 0.5);
        setDragDropOrder(shuffled);
      }
      
      const displayItems = dragDropOrder.length > 0 ? dragDropOrder : items;

      const handleDragStart = (idx) => {
        setDraggingItem(idx);
      };

      const handleDragOver = (e, idx) => {
        e.preventDefault();
        if (draggingItem === null || draggingItem === idx) return;
        
        const newOrder = [...displayItems];
        const draggedItem = newOrder[draggingItem];
        newOrder.splice(draggingItem, 1);
        newOrder.splice(idx, 0, draggedItem);
        setDragDropOrder(newOrder);
        setDraggingItem(idx);
      };

      const handleDragEnd = () => {
        setDraggingItem(null);
      };

      const checkDragDropOrder = () => {
        const correctOrder = currentQ.correct_order || items;
        const isCorrect = displayItems.every((item, idx) => item === correctOrder[idx]);
        handleAnswer(isCorrect ? 'correct' : 'incorrect', 'correct');
        setDragDropOrder([]);
      };

      return (
        <div className="space-y-6">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="text-amber-800 font-medium mb-2">
              {language === 'es' ? '📋 Instrucciones:' : '📋 Instructions:'}
            </p>
            <p className="text-slate-600">
              {currentQ.instruction || currentQ.question || (language === 'es' 
                ? 'Arrastra los elementos para ordenarlos correctamente' 
                : 'Drag the items to put them in the correct order')}
            </p>
          </div>
          
          <div className="space-y-2">
            {displayItems.map((item, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`p-4 bg-white rounded-lg border-2 cursor-move transition-all flex items-center gap-3 ${
                  draggingItem === idx 
                    ? 'border-purple-500 bg-purple-50 shadow-lg scale-102' 
                    : 'border-slate-200 hover:border-purple-300 hover:shadow-sm'
                }`}
                data-testid={`drag-item-${idx}`}
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <GripVertical className="h-5 w-5" />
                  <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                </div>
                <span className="flex-1 text-slate-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => {
              const shuffled = [...items].sort(() => Math.random() - 0.5);
              setDragDropOrder(shuffled);
            }}>
              <Shuffle className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Mezclar' : 'Shuffle'}
            </Button>
            <Button onClick={checkDragDropOrder} className="bg-purple-600 hover:bg-purple-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Verificar Orden' : 'Check Order'}
            </Button>
          </div>
        </div>
      );
    }

    // Default fallback - render as quiz
    return (
      <div className="grid gap-3">
        {(currentQ.options || [currentQ.correct_answer, 'Other Option A', 'Other Option B']).map((option, idx) => (
          <button
            key={idx}
            onClick={() => !selectedAnswer && handleAnswer(option, currentQ.correct_answer)}
            disabled={selectedAnswer !== null}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedAnswer === option
                ? option === currentQ.correct_answer
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-slate-200 hover:border-purple-400'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  };

  if (playingGame && !showNameInput) {
    const currentQ = playingGame.questions?.[gameProgress.current];
    const totalQuestions = playingGame.questions?.length || 1;
    const progress = ((gameProgress.current + 1) / totalQuestions) * 100;

    if (showResult) {
      const percentage = Math.round((gameProgress.score / totalQuestions) * 100);
      return (
        <Layout>
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">
                  {percentage >= 80 ? '🏆' : percentage >= 60 ? '⭐' : '💪'}
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                  {language === 'es' ? '¡Juego Completado!' : 'Game Complete!'}
                </h2>
                <p className="text-xl text-slate-600 mb-6">
                  {playerName && <span className="font-semibold">{playerName}, </span>}
                  {language === 'es' ? 'Tu puntuación:' : 'Your score:'} {gameProgress.score}/{totalQuestions}
                </p>
                <div className="w-full bg-slate-200 rounded-full h-4 mb-6">
                  <div 
                    className={`h-4 rounded-full ${percentage >= 80 ? 'bg-green-500' : percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className="text-lg text-slate-600 mb-8">
                  {percentage >= 80 
                    ? (language === 'es' ? '¡Excelente trabajo!' : 'Excellent work!')
                    : percentage >= 60 
                    ? (language === 'es' ? '¡Buen trabajo!' : 'Good job!')
                    : (language === 'es' ? '¡Sigue practicando!' : 'Keep practicing!')}
                </p>
                
                {/* Leaderboard in Results */}
                {leaderboard.length > 0 && (
                  <div className="mb-6 text-left">
                    <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      {language === 'es' ? 'Ranking' : 'Leaderboard'}
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {leaderboard.slice(0, 5).map((entry, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            entry.player_name === playerName ? 'bg-purple-100 border border-purple-300' : 'bg-slate-50'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-400 text-white' : 
                            idx === 1 ? 'bg-slate-400 text-white' : 
                            idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="flex-1 font-medium text-sm">{entry.player_name}</span>
                          <span className="text-sm text-slate-600">{entry.score}/{entry.total_questions}</span>
                          <span className="text-xs text-slate-400">{entry.time_taken}s</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center gap-4">
                  <Button onClick={resetGame} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Jugar de Nuevo' : 'Play Again'}
                  </Button>
                  <Button onClick={exitGame} className="bg-purple-600 hover:bg-purple-700">
                    {language === 'es' ? 'Volver' : 'Back'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>
      );
    }

    // Skip progress header for matching game (it has its own progress)
    const showProgressHeader = playingGame.game_type !== 'matching';

    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress Header */}
          {showProgressHeader && (
            <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{playingGame.title}</span>
                  <span className="text-sm">
                    {gameProgress.current + 1} / {totalQuestions}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-white rounded-full h-2 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span>{language === 'es' ? 'Puntuación:' : 'Score:'} {gameProgress.score}</span>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={exitGame}>
                    {language === 'es' ? 'Salir' : 'Exit'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Game Card */}
          <Card className="border-2 border-purple-200">
            <CardContent className="p-8">
              {/* Question/Prompt - Skip for matching */}
              {playingGame.game_type !== 'matching' && currentQ && (
                <div className="text-center mb-8">
                  <Badge className="mb-4 bg-purple-100 text-purple-700">
                    {gameTypes.find(t => t.id === playingGame.game_type)?.name || 
                     (language === 'es' ? 'Pregunta' : 'Question')} {gameProgress.current + 1}
                  </Badge>
                  {playingGame.game_type !== 'flashcards' && playingGame.game_type !== 'word_search' && playingGame.game_type !== 'crossword' && (
                    <h3 className="text-2xl font-semibold text-slate-800">
                      {currentQ.question || currentQ.prompt || currentQ.clue}
                    </h3>
                  )}
                </div>
              )}

              {/* Matching game header */}
              {playingGame.game_type === 'matching' && (
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{playingGame.title}</h3>
                    <p className="text-slate-500">
                      {language === 'es' ? 'Empareja los términos con sus definiciones' : 'Match the terms with their definitions'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-purple-100 text-purple-700">
                      {matchedPairs.length / 2} / {playingGame.questions.length}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={exitGame}>
                      {language === 'es' ? 'Salir' : 'Exit'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Render game-specific content */}
              {renderGameContent()}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800 flex items-center gap-3">
              <Gamepad2 className="h-8 w-8 text-purple-600" />
              {language === 'es' ? 'Creador de Juegos Educativos' : 'Educational Games Creator'}
            </h1>
            <p className="text-slate-500 mt-1">
              {language === 'es' 
                ? 'Convierte lecciones y tareas en juegos interactivos para estudiantes' 
                : 'Convert lessons and assignments into interactive games for students'}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Impulsado por IA' : 'AI-Powered'}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-xl">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {language === 'es' ? 'Crear Juego' : 'Create Game'}
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {language === 'es' ? 'Mis Juegos' : 'My Games'}
              {savedGames.length > 0 && (
                <Badge variant="secondary" className="ml-1">{savedGames.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {language === 'es' ? 'Analíticas' : 'Analytics'}
            </TabsTrigger>
          </TabsList>

          {/* Create Tab */}
          <TabsContent value="create" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    {language === 'es' ? 'Contenido de la Lección' : 'Lesson Content'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'es' 
                      ? 'Pegue el contenido de la lección o tarea que desea convertir en juego' 
                      : 'Paste the lesson or assignment content you want to convert into a game'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={language === 'es' 
                      ? 'Pegue aquí el contenido de su lección, tarea o material educativo...' 
                      : 'Paste your lesson, assignment, or educational material here...'}
                    value={lessonContent}
                    onChange={(e) => setLessonContent(e.target.value)}
                    className="min-h-[200px]"
                    data-testid="lesson-content-input"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        {language === 'es' ? 'Materia' : 'Subject'}
                      </label>
                      <Select value={subject} onValueChange={setSubject}>
                        <SelectTrigger data-testid="subject-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(s => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <span>{s.icon}</span>
                                {s.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        {language === 'es' ? 'Nivel de Grado' : 'Grade Level'}
                      </label>
                      <Select value={gradeLevel} onValueChange={setGradeLevel}>
                        <SelectTrigger data-testid="grade-level-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gradeLevels.map(g => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.emoji} {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        {language === 'es' ? 'Tipo de Juego' : 'Game Type'}
                      </label>
                      <Select value={gameType} onValueChange={setGameType}>
                        <SelectTrigger data-testid="game-type-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {gameTypes.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        {language === 'es' ? 'Número de Preguntas' : 'Number of Questions'}
                      </label>
                      <Select value={questionCount} onValueChange={setQuestionCount}>
                        <SelectTrigger data-testid="question-count-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 {language === 'es' ? 'preguntas' : 'questions'}</SelectItem>
                          <SelectItem value="5">5 {language === 'es' ? 'preguntas' : 'questions'}</SelectItem>
                          <SelectItem value="10">10 {language === 'es' ? 'preguntas' : 'questions'}</SelectItem>
                          <SelectItem value="15">15 {language === 'es' ? 'preguntas' : 'questions'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={generateGame}
                    disabled={generating || !lessonContent.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    data-testid="generate-game-btn"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {language === 'es' ? 'Generando...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {language === 'es' ? 'Generar Juego' : 'Generate Game'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Game Types Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-purple-600" />
                    {language === 'es' ? 'Tipos de Juegos Disponibles' : 'Available Game Types'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gameTypes.map(type => {
                    const Icon = type.icon;
                    return (
                      <div 
                        key={type.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          gameType === type.id 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-slate-200 hover:border-purple-300'
                        }`}
                        onClick={() => setGameType(type.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${type.color}-100`}>
                            <Icon className={`h-5 w-5 text-${type.color}-600`} />
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-800">{type.name}</h4>
                            <p className="text-sm text-slate-500">{type.description}</p>
                          </div>
                          {gameType === type.id && (
                            <CheckCircle2 className="h-5 w-5 text-purple-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Generated Game Preview */}
            {generatedGame && (
              <Card className="border-2 border-green-200 bg-green-50/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        {language === 'es' ? '¡Juego Generado!' : 'Game Generated!'}
                      </CardTitle>
                      <CardDescription>{generatedGame.title}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => startGame(generatedGame)}
                        className="border-green-300"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {language === 'es' ? 'Previsualizar' : 'Preview'}
                      </Button>
                      <Button onClick={saveGame} className="bg-green-600 hover:bg-green-700">
                        {language === 'es' ? 'Guardar Juego' : 'Save Game'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{generatedGame.questions?.length || 0}</p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Preguntas' : 'Questions'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {gameTypes.find(t => t.id === generatedGame.game_type)?.name || generatedGame.game_type}
                      </p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Tipo' : 'Type'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-amber-600">
                        {subjects.find(s => s.id === generatedGame.subject)?.icon || '📝'}
                      </p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Materia' : 'Subject'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-2xl font-bold text-green-600">
                        {gradeLevels.find(g => g.id === generatedGame.grade_level)?.emoji || '🎓'}
                      </p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Grado' : 'Grade'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-6">
            {/* Share Link Banner */}
            {shareLink && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Link2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-green-700">
                      {language === 'es' ? 'Enlace para estudiantes:' : 'Student link:'}
                    </p>
                    <p className="text-sm text-green-600 truncate">{shareLink}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink);
                      toast.success(language === 'es' ? '¡Copiado!' : 'Copied!');
                    }}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Copiar' : 'Copy'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setShareLink('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {loadingGames ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
              </div>
            ) : savedGames.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedGames.map(game => (
                  <Card key={game.game_id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                          {gameTypes.find(t => t.id === game.game_type)?.icon && (
                            <Gamepad2 className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {subjects.find(s => s.id === game.subject)?.icon || '📝'}
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {gradeLevels.find(g => g.id === game.grade_level)?.emoji || '🎓'}
                          </Badge>
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-1">{game.title}</h4>
                      <p className="text-sm text-slate-500 mb-2">
                        {game.questions?.length || 0} {language === 'es' ? 'preguntas' : 'questions'}
                      </p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {gameTypes.find(t => t.id === game.game_type)?.name}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {subjects.find(s => s.id === game.subject)?.name || game.subject}
                        </Badge>
                      </div>
                      <div className="flex gap-2 mb-2">
                        <Button 
                          size="sm" 
                          onClick={() => startGame(game)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {language === 'es' ? 'Jugar' : 'Play'}
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="w-full border-green-300 text-green-700 hover:bg-green-50"
                        onClick={() => {
                          const link = getShareLink(game.game_id);
                          setShareLink(link);
                          navigator.clipboard.writeText(link);
                          toast.success(language === 'es' ? '¡Enlace copiado!' : 'Link copied!');
                        }}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        {language === 'es' ? 'Obtener enlace para estudiantes' : 'Get student link'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <Gamepad2 className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    {language === 'es' ? 'Sin Juegos Guardados' : 'No Saved Games'}
                  </h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    {language === 'es' 
                      ? 'Crea tu primer juego educativo en la pestaña "Crear Juego"' 
                      : 'Create your first educational game in the "Create Game" tab'}
                  </p>
                  <Button onClick={() => setActiveTab('create')}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Crear Juego' : 'Create Game'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-200 mb-3">
                    <Gamepad2 className="h-6 w-6 text-purple-700" />
                  </div>
                  <p className="text-3xl font-bold text-purple-700">
                    {analytics?.total_games || savedGames.length}
                  </p>
                  <p className="text-sm text-purple-600">
                    {language === 'es' ? 'Juegos Creados' : 'Games Created'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-200 mb-3">
                    <Users className="h-6 w-6 text-blue-700" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {analytics?.total_plays || 0}
                  </p>
                  <p className="text-sm text-blue-600">
                    {language === 'es' ? 'Veces Jugado' : 'Times Played'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-200 mb-3">
                    <Target className="h-6 w-6 text-green-700" />
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    {analytics?.average_score || 0}%
                  </p>
                  <p className="text-sm text-green-600">
                    {language === 'es' ? 'Promedio' : 'Average Score'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-200 mb-3">
                    <Trophy className="h-6 w-6 text-amber-700" />
                  </div>
                  <p className="text-3xl font-bold text-amber-700">
                    {analytics?.unique_players || 0}
                  </p>
                  <p className="text-sm text-amber-600">
                    {language === 'es' ? 'Jugadores Únicos' : 'Unique Players'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Game Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  {language === 'es' ? 'Rendimiento por Juego' : 'Game Performance'}
                </CardTitle>
                <CardDescription>
                  {language === 'es' 
                    ? 'Estadísticas detalladas de cada juego' 
                    : 'Detailed statistics for each game'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics?.game_stats?.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.game_stats.map((game, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-800">{game.title}</h4>
                            <p className="text-sm text-slate-500">
                              {gameTypes.find(t => t.id === game.game_type)?.name}
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => fetchLeaderboard(game.game_id)}
                          >
                            <Trophy className="h-4 w-4 mr-1" />
                            {language === 'es' ? 'Ranking' : 'Leaderboard'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <p className="text-xl font-bold text-purple-600">{game.play_count || 0}</p>
                            <p className="text-xs text-slate-500">{language === 'es' ? 'Partidas' : 'Plays'}</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-blue-600">{game.unique_players || 0}</p>
                            <p className="text-xs text-slate-500">{language === 'es' ? 'Jugadores' : 'Players'}</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-green-600">{game.avg_score || 0}%</p>
                            <p className="text-xs text-slate-500">{language === 'es' ? 'Promedio' : 'Avg Score'}</p>
                          </div>
                          <div>
                            <p className="text-xl font-bold text-amber-600">{game.best_score || 0}%</p>
                            <p className="text-xs text-slate-500">{language === 'es' ? 'Mejor' : 'Best'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : savedGames.length > 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {language === 'es' 
                        ? 'Las estadísticas aparecerán cuando los estudiantes jueguen' 
                        : 'Statistics will appear when students play'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Gamepad2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">
                      {language === 'es' 
                        ? 'Crea tu primer juego para ver analíticas' 
                        : 'Create your first game to see analytics'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard Modal/Card */}
            {selectedGameForLeaderboard && (
              <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      {language === 'es' ? 'Tabla de Clasificación' : 'Leaderboard'}
                    </CardTitle>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setSelectedGameForLeaderboard(null)}
                    >
                      ✕
                    </Button>
                  </div>
                  <CardDescription>
                    {savedGames.find(g => g.game_id === selectedGameForLeaderboard)?.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leaderboard.length > 0 ? (
                    <div className="space-y-2">
                      {leaderboard.map((entry, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-4 p-3 rounded-lg bg-white border"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            idx === 0 ? 'bg-amber-400 text-white' : 
                            idx === 1 ? 'bg-slate-400 text-white' : 
                            idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{entry.player_name}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(entry.played_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">
                              {Math.round((entry.score / entry.total_questions) * 100)}%
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.score}/{entry.total_questions} • {entry.time_taken}s
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Medal className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        {language === 'es' 
                          ? 'Aún no hay puntuaciones' 
                          : 'No scores yet'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default GamesCreator;
