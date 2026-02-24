import { useState, useEffect, useRef } from 'react';
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

const PlayGame = () => {
  const { gameId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [game, setGame] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameProgress, setGameProgress] = useState({ current: 0, score: 0 });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [language, setLanguage] = useState('es');
  const [regenerating, setRegenerating] = useState(false);
  
  // Timer state for tracking time taken
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

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  // Initialize shuffled items for matching games
  useEffect(() => {
    if (game?.game_type === 'matching' && game?.questions) {
      const rightItems = game.questions.map(q => q.match || q.correct_answer);
      setShuffledRight([...rightItems].sort(() => Math.random() - 0.5));
      setMatchedPairs([]);
    }
  }, [game]);

  // Check for match when both selected
  useEffect(() => {
    if (matchingSelected.left && matchingSelected.right && game) {
      const leftQ = game.questions.find(q => 
        (q.question || q.term || q.left) === matchingSelected.left.text
      );
      const correctAnswer = leftQ?.correct_answer || leftQ?.match || leftQ?.right;
      
      if (matchingSelected.right.text === correctAnswer) {
        setMatchedPairs([...matchedPairs, matchingSelected.left.text, matchingSelected.right.text]);
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
    if (game?.game_type === 'matching' && matchedPairs.length === game.questions.length * 2) {
      setShowResult(true);
      submitScore();
    }
  }, [matchedPairs]);

  const fetchGame = async () => {
    try {
      const res = await axios.get(`${API}/play-game/${gameId}`);
      setGame(res.data);
      setError(null);
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
    
    // Try to regenerate questions for anti-cheat
    let questionsToUse = game?.questions || [];
    
    try {
      const res = await axios.post(`${API}/games/${gameId}/regenerate-questions`, null, {
        params: { player_name: playerName }
      });
      
      if (res.data.regenerated && res.data.questions?.length > 0) {
        // Use the newly generated questions
        questionsToUse = res.data.questions;
        toast.success(language === 'es' ? '¡Nuevas preguntas generadas!' : 'New questions generated!');
      }
    } catch (error) {
      // If regeneration fails, continue with existing questions
      console.log('Question regeneration not available, using existing questions');
    }
    
    // Update game state with questions (new or existing) BEFORE starting
    setGame(prev => ({
      ...prev,
      questions: questionsToUse
    }));
    
    // Record start time for tracking how long the game takes
    startTimeRef.current = Date.now();
    
    // Now start the game
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
      
      if (gameProgress.current < game.questions.length - 1) {
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
      // Calculate actual time taken in seconds
      const timeTaken = startTimeRef.current 
        ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
        : 0;
      
      await axios.post(`${API}/games/${gameId}/score`, {
        player_name: playerName,
        score: gameProgress.score + (selectedAnswer === game.questions[gameProgress.current]?.correct_answer ? 1 : 0),
        total_questions: game.questions.length,
        time_taken: timeTaken
      });
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const resetGame = async () => {
    // Show loading state while regenerating
    setRegenerating(true);
    setShowResult(false);
    setSelectedAnswer(null);
    
    // Try to regenerate questions for the replay (anti-cheat)
    let newQuestions = game?.questions || [];
    
    try {
      const res = await axios.post(`${API}/games/${gameId}/regenerate-questions`, null, {
        params: { player_name: playerName }
      });
      
      if (res.data.regenerated && res.data.questions?.length > 0) {
        newQuestions = res.data.questions;
        toast.success(language === 'es' ? '¡Nuevas preguntas generadas!' : 'New questions generated!');
      }
    } catch (error) {
      console.log('Question regeneration not available, using existing questions');
    }
    
    // Update game with new questions
    setGame(prev => ({
      ...prev,
      questions: newQuestions
    }));
    
    // Reset all game state
    setGameProgress({ current: 0, score: 0 });
    setFlashcardFlipped(false);
    setFillBlankAnswer('');
    setMatchedPairs([]);
    setWordSearchFound([]);
    setCrosswordAnswers({});
    setDragDropOrder([]);
    
    // Reset timer for the new game
    startTimeRef.current = Date.now();
    
    // Re-shuffle matching game items with new questions
    if (game?.game_type === 'matching' && newQuestions) {
      const rightItems = newQuestions.map(q => q.match || q.correct_answer);
      setShuffledRight([...rightItems].sort(() => Math.random() - 0.5));
    }
    
    // Hide loading state
    setRegenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

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

  // Name input screen
  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gradient-to-br from-white to-purple-50 border-purple-200">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{game?.title}</h2>
            <p className="text-slate-600 mb-6">
              {game?.questions?.length} {language === 'es' ? 'preguntas' : 'questions'} • 
              {' '}{game?.difficulty}
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
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Play className="h-4 w-4 mr-2" />
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
    const totalQuestions = game.questions.length;
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
            <Button onClick={resetGame} className="bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Jugar de Nuevo' : 'Play Again'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Game play screen
  const currentQ = game.questions[gameProgress.current];
  const totalQuestions = game.questions.length;
  const progress = ((gameProgress.current + 1) / totalQuestions) * 100;

  const renderGameContent = () => {
    const gameType = game.game_type;

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

    // Matching - handled separately due to different UI
    if (gameType === 'matching') {
      const leftItems = game.questions.map(q => ({ 
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
                key={idx}
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
                key={idx}
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
              <span className="font-medium">{game.title}</span>
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
            {game.game_type !== 'matching' && (
              <div className="text-center mb-8">
                <Badge className="mb-4 bg-purple-100 text-purple-700">
                  {language === 'es' ? 'Pregunta' : 'Question'} {gameProgress.current + 1}
                </Badge>
                {game.game_type !== 'flashcards' && (
                  <h3 className="text-2xl font-semibold text-slate-800">
                    {currentQ.question || currentQ.prompt}
                  </h3>
                )}
              </div>
            )}
            {renderGameContent()}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>Powered by TeacherHubPro 🎮</p>
        </div>
      </div>
    </div>
  );
};

export default PlayGame;
