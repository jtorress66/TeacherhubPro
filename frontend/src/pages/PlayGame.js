import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  Gamepad2, Loader2, Play, CheckCircle2, RefreshCw, Trophy,
  GripVertical, Shuffle, ChevronRight, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Generate unique session ID
const generateSessionId = () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Generate hash of questions for verification
const hashQuestions = (questions) => {
  if (!questions || questions.length === 0) return 'empty';
  const text = questions.map(q => q.question || q.term || '').join('|');
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};

const PlayGame = () => {
  const { gameId } = useParams();
  
  // Core state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameData, setGameData] = useState(null); // Original game data from server
  const [currentQuestions, setCurrentQuestions] = useState([]); // Current session's questions
  const [sessionId, setSessionId] = useState(generateSessionId());
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameProgress, setGameProgress] = useState({ current: 0, score: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [language, setLanguage] = useState('es');
  const [regenerating, setRegenerating] = useState(false);
  
  // Timer state
  const startTimeRef = useRef(null);
  
  // Game-specific state
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [matchingSelected, setMatchingSelected] = useState({ left: null, right: null });
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [shuffledRight, setShuffledRight] = useState([]);
  const [wordSearchFound, setWordSearchFound] = useState([]);
  const [crosswordAnswers, setCrosswordAnswers] = useState({});
  const [dragDropOrder, setDragDropOrder] = useState([]);
  const [draggingItem, setDraggingItem] = useState(null);

  // Fetch initial game data
  useEffect(() => {
    fetchGame();
  }, [gameId]);

  // Initialize matching game when questions change
  useEffect(() => {
    if (gameData?.game_type === 'matching' && currentQuestions.length > 0) {
      const rightItems = currentQuestions.map(q => q.match || q.correct_answer);
      setShuffledRight([...rightItems].sort(() => Math.random() - 0.5));
      setMatchedPairs([]);
    }
  }, [currentQuestions, sessionId]); // Re-run when session changes

  // Check for match
  useEffect(() => {
    if (matchingSelected.left && matchingSelected.right && currentQuestions.length > 0) {
      const leftQ = currentQuestions.find(q => 
        (q.question || q.term || q.left) === matchingSelected.left.text
      );
      const correctAnswer = leftQ?.correct_answer || leftQ?.match || leftQ?.right;
      
      if (matchingSelected.right.text === correctAnswer) {
        setMatchedPairs(prev => [...prev, matchingSelected.left.text, matchingSelected.right.text]);
        setGameProgress(prev => ({ ...prev, score: prev.score + 1 }));
        toast.success(language === 'es' ? '¡Correcto!' : 'Correct!');
      } else {
        toast.error(language === 'es' ? 'Intenta de nuevo' : 'Try again');
      }
      
      setTimeout(() => setMatchingSelected({ left: null, right: null }), 300);
    }
  }, [matchingSelected]);

  // Check if matching game is complete
  useEffect(() => {
    if (gameData?.game_type === 'matching' && currentQuestions.length > 0 && matchedPairs.length === currentQuestions.length * 2) {
      setShowResult(true);
      submitScore();
    }
  }, [matchedPairs]);

  const fetchGame = async () => {
    try {
      const res = await axios.get(`${API}/play-game/${gameId}`);
      setGameData(res.data);
      setCurrentQuestions(res.data.questions || []);
      setError(null);
      
      // Log initial load
      console.log(`[PlayGame] Initial load - Session: ${sessionId}`);
      console.log(`[PlayGame] Questions hash: ${hashQuestions(res.data.questions)}`);
      console.log(`[PlayGame] Question count: ${res.data.questions?.length || 0}`);
    } catch (error) {
      console.error('Error fetching game:', error);
      setError(error.response?.data?.detail || 'Game not found');
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (!playerName.trim()) {
      toast.error(language === 'es' ? 'Ingresa tu nombre' : 'Enter your name');
      return;
    }
    
    setRegenerating(true);
    
    // Generate new session ID for this play
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    console.log(`[PlayGame] Starting game - New Session: ${newSessionId}`);
    console.log(`[PlayGame] Old questions hash: ${hashQuestions(currentQuestions)}`);
    
    // Always try to regenerate questions for fresh gameplay
    try {
      const res = await axios.post(`${API}/games/${gameId}/regenerate-questions`, null, {
        params: { 
          player_name: playerName,
          session_id: newSessionId // Pass session ID to backend
        }
      });
      
      console.log(`[PlayGame] Regenerate response - regenerated: ${res.data.regenerated}`);
      
      if (res.data.regenerated && res.data.questions?.length > 0) {
        // FORCE new questions - create a new array reference
        const newQuestions = [...res.data.questions];
        setCurrentQuestions(newQuestions);
        
        console.log(`[PlayGame] NEW questions hash: ${hashQuestions(newQuestions)}`);
        console.log(`[PlayGame] First question: ${newQuestions[0]?.question?.substring(0, 50)}...`);
        
        toast.success(language === 'es' ? '¡Nuevas preguntas generadas!' : 'New questions generated!');
      } else {
        console.log(`[PlayGame] Using existing questions - regeneration not available`);
        console.log(`[PlayGame] Message: ${res.data.message}`);
      }
    } catch (error) {
      console.error('[PlayGame] Regeneration error:', error);
    }
    
    // Record start time
    startTimeRef.current = Date.now();
    
    // Start the game
    setRegenerating(false);
    setGameStarted(true);
    setGameProgress({ current: 0, score: 0 });
  };

  const handleAnswer = (answer, correctAnswer) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === correctAnswer;
    
    setTimeout(() => {
      setGameProgress(prev => ({
        ...prev,
        score: isCorrect ? prev.score + 1 : prev.score
      }));
      
      if (gameProgress.current < currentQuestions.length - 1) {
        setGameProgress(prev => ({ ...prev, current: prev.current + 1 }));
        setSelectedAnswer(null);
        setFlashcardFlipped(false);
        setFillBlankAnswer('');
      } else {
        setShowResult(true);
        submitScore();
      }
    }, 1000);
  };

  const submitScore = async () => {
    try {
      const timeTaken = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
        : 0;
      
      const finalScore = gameProgress.score + (selectedAnswer === currentQuestions[gameProgress.current]?.correct_answer ? 1 : 0);
      
      console.log(`[PlayGame] Submitting score - Session: ${sessionId}, Score: ${finalScore}, Time: ${timeTaken}s`);
      
      await axios.post(`${API}/games/${gameId}/score`, {
        player_name: playerName,
        score: finalScore,
        total_questions: currentQuestions.length,
        time_taken: timeTaken,
        session_id: sessionId
      });
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  // CRITICAL: Complete reset for Play Again
  // Shuffle array helper (Fisher-Yates algorithm)
  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, []);

  // Create variation in questions even without AI regeneration
  const createQuestionVariation = useCallback((questions, gameType) => {
    if (!questions || questions.length === 0) return [];
    
    // Deep clone and shuffle question order
    let varied = shuffleArray(questions.map(q => JSON.parse(JSON.stringify(q))));
    
    // For quiz and true_false games, also shuffle the options within each question
    if (gameType === 'quiz' || gameType === 'true_false') {
      varied = varied.map(q => {
        if (q.options && Array.isArray(q.options)) {
          // Shuffle options while keeping track of correct answer
          const correctAnswer = q.correct_answer;
          q.options = shuffleArray(q.options);
          // Ensure correct_answer still matches one of the options
          q.correct_answer = correctAnswer;
        }
        return q;
      });
    }
    
    // For matching games, the right side will be shuffled separately
    // For fill_blanks, question order is shuffled
    // For flashcards, card order is shuffled
    
    return varied;
  }, [shuffleArray]);

  const resetGame = useCallback(async () => {
    console.log(`[PlayGame] ========== PLAY AGAIN TRIGGERED ==========`);
    console.log(`[PlayGame] Old Session: ${sessionId}`);
    console.log(`[PlayGame] Old Questions Hash: ${hashQuestions(currentQuestions)}`);
    console.log(`[PlayGame] Old First Question: ${currentQuestions[0]?.question?.substring(0, 50)}...`);
    
    // Show loading state
    setRegenerating(true);
    setShowResult(false);
    
    // Generate NEW session ID - this is critical
    const newSessionId = generateSessionId();
    console.log(`[PlayGame] NEW Session: ${newSessionId}`);
    
    // Attempt to regenerate questions from backend
    let newQuestions = null;
    let aiRegenerationSucceeded = false;
    
    try {
      const res = await axios.post(`${API}/games/${gameId}/regenerate-questions`, null, {
        params: { 
          player_name: playerName,
          session_id: newSessionId,
          force_new: true,
          timestamp: Date.now() // Cache buster
        },
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log(`[PlayGame] Regenerate API Response:`);
      console.log(`  - regenerated: ${res.data.regenerated}`);
      console.log(`  - message: ${res.data.message}`);
      console.log(`  - questions count: ${res.data.questions?.length || 0}`);
      
      // ONLY use API questions if regeneration ACTUALLY succeeded
      if (res.data.regenerated === true && res.data.questions?.length > 0) {
        // AI successfully generated NEW questions
        newQuestions = res.data.questions.map(q => JSON.parse(JSON.stringify(q)));
        aiRegenerationSucceeded = true;
        
        console.log(`[PlayGame] AI Regeneration SUCCESS`);
        console.log(`[PlayGame] NEW Questions Hash: ${hashQuestions(newQuestions)}`);
        console.log(`[PlayGame] First NEW question: ${newQuestions[0]?.question?.substring(0, 60)}...`);
        
        toast.success(language === 'es' ? '¡Nuevas preguntas generadas por IA!' : 'New AI-generated questions!');
      } else {
        console.log(`[PlayGame] AI Regeneration NOT available: ${res.data.message}`);
      }
    } catch (error) {
      console.error('[PlayGame] Regeneration API error:', error);
    }
    
    // If AI regeneration failed, create variation from existing questions
    if (!aiRegenerationSucceeded) {
      console.log(`[PlayGame] Creating local variation from existing questions...`);
      
      // Get the ORIGINAL questions from gameData, not currentQuestions (which may already be shuffled)
      const originalQuestions = gameData?.questions || currentQuestions;
      newQuestions = createQuestionVariation(originalQuestions, gameData?.game_type);
      
      console.log(`[PlayGame] Local Variation Created`);
      console.log(`[PlayGame] NEW Questions Hash: ${hashQuestions(newQuestions)}`);
      console.log(`[PlayGame] First question (varied): ${newQuestions[0]?.question?.substring(0, 60)}...`);
      
      toast.info(language === 'es' ? '¡Preguntas reorganizadas!' : 'Questions reshuffled!');
    }
    
    // COMPLETE STATE RESET
    // 1. Update session ID FIRST
    setSessionId(newSessionId);
    
    // 2. Clear ALL game state completely
    setSelectedAnswer(null);
    setGameProgress({ current: 0, score: 0 });
    setFlashcardFlipped(false);
    setFillBlankAnswer('');
    setMatchedPairs([]);
    setMatchingSelected({ left: null, right: null });
    setWordSearchFound([]);
    setCrosswordAnswers({});
    setDragDropOrder([]);
    setDraggingItem(null);
    
    // 3. Set the new/varied questions
    if (newQuestions && newQuestions.length > 0) {
      setCurrentQuestions(newQuestions);
      
      // Re-shuffle for matching games
      if (gameData?.game_type === 'matching') {
        const rightItems = newQuestions.map(q => q.match || q.correct_answer);
        setShuffledRight(shuffleArray(rightItems));
      }
    }
    
    // 4. Reset timer
    startTimeRef.current = Date.now();
    
    // 5. Hide loading
    setRegenerating(false);
    
    console.log(`[PlayGame] ========== RESET COMPLETE ==========`);
    console.log(`[PlayGame] Final Session: ${newSessionId}`);
    console.log(`[PlayGame] Final Questions Hash: ${hashQuestions(newQuestions)}`);
    console.log(`[PlayGame] AI Used: ${aiRegenerationSucceeded}`);
  }, [gameId, playerName, currentQuestions, sessionId, gameData, language, createQuestionVariation, shuffleArray]);

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {language === 'es' ? 'Juego no encontrado' : 'Game not found'}
            </h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regenerating screen
  if (regenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {language === 'es' ? 'Generando nuevas preguntas...' : 'Generating new questions...'}
            </h2>
            <p className="text-slate-600">
              {language === 'es' ? 'Preparando tu nuevo desafío' : 'Preparing your new challenge'}
            </p>
            <p className="text-xs text-slate-400 mt-4">Session: {sessionId}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Name input screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-to-br from-white to-purple-50 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{gameData?.title}</h2>
            <p className="text-slate-600 mb-6">
              {currentQuestions.length} {language === 'es' ? 'preguntas' : 'questions'} • 
              {' '}{gameData?.difficulty || 'medium'}
            </p>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={language === 'es' ? 'Tu nombre' : 'Your name'}
              className="mb-4 text-center"
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
            />
            <Button 
              onClick={startGame}
              disabled={regenerating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {language === 'es' ? '¡Jugar!' : 'Play!'}
            </Button>
            <div className="flex justify-center gap-2 mt-4">
              <Button 
                variant={language === 'es' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('es')}
              >
                🇪🇸
              </Button>
              <Button 
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLanguage('en')}
              >
                🇺🇸
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (showResult) {
    const totalQuestions = currentQuestions.length;
    const percentage = Math.round((gameProgress.score / totalQuestions) * 100);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">
              {percentage >= 80 ? '🏆' : percentage >= 60 ? '⭐' : '💪'}
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">
              {language === 'es' ? '¡Juego Completado!' : 'Game Complete!'}
            </h2>
            <p className="text-xl text-slate-600 mb-6">
              <span className="font-semibold">{playerName}</span>, {language === 'es' ? 'tu puntuación:' : 'your score:'} {gameProgress.score}/{totalQuestions}
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
            
            {/* Session info for debugging */}
            <p className="text-xs text-slate-400 mb-4">
              Session: {sessionId} | Questions Hash: {hashQuestions(currentQuestions)}
            </p>
            
            <Button 
              onClick={resetGame}
              disabled={regenerating}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="play-again-button"
            >
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'es' ? 'Generando...' : 'Generating...'}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Jugar de Nuevo' : 'Play Again'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game play screen
  const currentQ = currentQuestions[gameProgress.current];
  const totalQuestions = currentQuestions.length;
  const progress = ((gameProgress.current + 1) / totalQuestions) * 100;

  if (!currentQ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-slate-600">Loading question...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderGameContent = () => {
    const gameType = gameData?.game_type;

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
                key={`${sessionId}-${gameProgress.current}-${idx}`}
                onClick={() => !selectedAnswer && handleAnswer(option, currentQ.correct_answer)}
                disabled={selectedAnswer !== null}
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
                  {showFeedback && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
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
            className="w-full max-w-md h-64 cursor-pointer"
          >
            <div 
              className="relative w-full h-full transition-all duration-500"
              style={{ transformStyle: 'preserve-3d', transform: flashcardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
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
            >
              {language === 'es' ? 'No lo sabía' : "Didn't know"}
            </Button>
            <Button 
              onClick={() => {
                setFlashcardFlipped(false);
                handleAnswer('correct', 'correct');
              }}
              className="bg-green-600 hover:bg-green-700"
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
        const isCorrect = userAnswer === correctAnswer || correctAnswer.includes(userAnswer);
        handleAnswer(isCorrect ? 'correct' : 'incorrect', 'correct');
        setFillBlankAnswer('');
      };

      return (
        <div className="space-y-6">
          <div className="text-center p-6 bg-slate-50 rounded-xl">
            <p className="text-xl text-slate-700">{currentQ.question || currentQ.sentence}</p>
          </div>
          <div className="flex gap-3">
            <Input
              value={fillBlankAnswer}
              onChange={(e) => setFillBlankAnswer(e.target.value)}
              placeholder={language === 'es' ? 'Escribe tu respuesta...' : 'Type your answer...'}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && fillBlankAnswer.trim() && checkFillBlank()}
            />
            <Button onClick={checkFillBlank} disabled={!fillBlankAnswer.trim()} className="bg-purple-600 hover:bg-purple-700">
              {language === 'es' ? 'Verificar' : 'Check'}
            </Button>
          </div>
        </div>
      );
    }

    // Matching
    if (gameType === 'matching') {
      const leftItems = currentQuestions.map(q => ({ 
        id: q.question || q.term || q.left,
        text: q.question || q.term || q.left 
      }));
      const rightItems = shuffledRight.map((item, idx) => ({ id: idx, text: item }));

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
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 text-center mb-2">
              {language === 'es' ? 'Términos' : 'Terms'}
            </p>
            {leftItems.map((item, idx) => (
              <button
                key={`${sessionId}-left-${idx}`}
                onClick={() => handleMatchClick('left', item)}
                disabled={matchedPairs.includes(item.text)}
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
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-500 text-center mb-2">
              {language === 'es' ? 'Definiciones' : 'Definitions'}
            </p>
            {rightItems.map((item, idx) => (
              <button
                key={`${sessionId}-right-${idx}`}
                onClick={() => handleMatchClick('right', item)}
                disabled={matchedPairs.includes(item.text)}
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

    // Default fallback
    return (
      <div className="text-center p-8">
        <p className="text-slate-500">
          {language === 'es' ? 'Tipo de juego no soportado' : 'Game type not supported'}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{gameData?.title}</span>
              <span className="text-sm">
                {gameProgress.current + 1} / {totalQuestions}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white rounded-full h-2 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-sm">
              <span>{language === 'es' ? 'Puntuación:' : 'Score:'} {gameProgress.score}</span>
              <span className="font-medium">{playerName}</span>
            </div>
          </CardContent>
        </Card>

        {/* Game Card */}
        <Card className="border-2 border-purple-200">
          <CardContent className="p-8">
            {gameData?.game_type !== 'matching' && (
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-purple-100 text-purple-700">
                  {language === 'es' ? 'Pregunta' : 'Question'} {gameProgress.current + 1}
                </Badge>
                {gameData?.game_type !== 'flashcards' && (
                  <h3 className="text-2xl font-semibold text-slate-800">
                    {currentQ.question || currentQ.prompt}
                  </h3>
                )}
              </div>
            )}
            {renderGameContent()}
          </CardContent>
        </Card>

        {/* Footer with session info */}
        <div className="text-center text-slate-400 text-xs">
          <p>Powered by TeacherHubPro 🎮</p>
          <p className="mt-1">Session: {sessionId.substring(0, 20)}...</p>
        </div>
      </div>
    </div>
  );
};

export default PlayGame;
