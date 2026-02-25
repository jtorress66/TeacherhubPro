import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Gamepad2, Users, Zap, Brain, Trophy, Play, ArrowRight, 
  Clock, Target, Sparkles, Hash, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PlayToLearnLanding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState('es');
  const [joinPin, setJoinPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  // Check if coming from a PIN link
  useEffect(() => {
    const pin = searchParams.get('pin');
    // Only set PIN if it's a valid 6-digit number (not "undefined" or null)
    if (pin && pin !== 'undefined' && pin !== 'null' && /^\d{6}$/.test(pin)) {
      setJoinPin(pin);
      setShowJoinForm(true);
      lookupPin(pin);
    }
  }, [searchParams]);

  const lookupPin = async (pin) => {
    try {
      const res = await axios.get(`${API}/play-to-learn/join/${pin}`);
      setSessionInfo(res.data);
    } catch (error) {
      toast.error(language === 'es' ? 'PIN no válido' : 'Invalid PIN');
      setShowJoinForm(false);
    }
  };

  const handleJoinByPin = async () => {
    if (!joinPin.trim() || joinPin.length !== 6) {
      toast.error(language === 'es' ? 'Ingresa un PIN de 6 dígitos' : 'Enter a 6-digit PIN');
      return;
    }

    setIsJoining(true);
    try {
      // First look up the session
      const lookupRes = await axios.get(`${API}/play-to-learn/join/${joinPin}`);
      setSessionInfo(lookupRes.data);
      setShowJoinForm(true);
    } catch (error) {
      toast.error(language === 'es' ? 'PIN no válido o sesión expirada' : 'Invalid PIN or session expired');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinSession = async () => {
    if (!nickname.trim()) {
      toast.error(language === 'es' ? 'Ingresa tu nombre' : 'Enter your nickname');
      return;
    }

    setIsJoining(true);
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions/${sessionInfo.session_id}/join`, {
        nickname: nickname.trim(),
        pin: joinPin
      });
      
      // Navigate to game with participant info
      navigate(`/play-to-learn/game/${sessionInfo.session_id}?participant=${res.data.participant_id}&nickname=${encodeURIComponent(nickname)}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error joining session');
    } finally {
      setIsJoining(false);
    }
  };

  const gameModes = [
    {
      id: 'quiz',
      icon: Brain,
      name: language === 'es' ? 'Quiz Clásico' : 'Classic Quiz',
      description: language === 'es' ? 'Preguntas de opción múltiple' : 'Multiple choice questions',
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'time_attack',
      icon: Zap,
      name: language === 'es' ? 'Ataque de Tiempo' : 'Time Attack',
      description: language === 'es' ? 'Responde rápido contra el reloj' : 'Answer quickly against the clock',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'matching',
      icon: Target,
      name: language === 'es' ? 'Emparejamiento' : 'Matching',
      description: language === 'es' ? 'Conecta términos y definiciones' : 'Connect terms and definitions',
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'flashcard',
      icon: Sparkles,
      name: language === 'es' ? 'Tarjetas Flash' : 'Flashcards',
      description: language === 'es' ? 'Estudia con tarjetas interactivas' : 'Study with interactive cards',
      color: 'from-pink-500 to-rose-600'
    },
    {
      id: 'true_false',
      icon: Brain,
      name: language === 'es' ? 'Verdadero/Falso' : 'True/False',
      description: language === 'es' ? 'Decide si es verdadero o falso' : 'Decide if statements are true or false',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'fill_blank',
      icon: Target,
      name: language === 'es' ? 'Completar' : 'Fill in Blank',
      description: language === 'es' ? 'Completa las oraciones' : 'Complete the sentences',
      color: 'from-amber-500 to-yellow-600'
    },
    {
      id: 'word_search',
      icon: Target,
      name: language === 'es' ? 'Sopa de Letras' : 'Word Search',
      description: language === 'es' ? 'Encuentra las palabras ocultas' : 'Find hidden words in the grid',
      color: 'from-emerald-500 to-green-600'
    },
    {
      id: 'memory',
      icon: Brain,
      name: language === 'es' ? 'Memoria' : 'Memory Game',
      description: language === 'es' ? 'Encuentra los pares de cartas' : 'Find matching card pairs',
      color: 'from-violet-500 to-purple-600'
    }
  ];

  // Join form view
  if (showJoinForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border-white/20 text-white">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center mb-4">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {language === 'es' ? '¡Únete al Juego!' : 'Join the Game!'}
            </CardTitle>
            {sessionInfo && (
              <div className="mt-2 space-y-1">
                <Badge className="bg-purple-500/50">{sessionInfo.topic}</Badge>
                <p className="text-sm text-white/70">{sessionInfo.subject}</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-white/70 block mb-2">
                {language === 'es' ? 'PIN del Juego' : 'Game PIN'}
              </label>
              <Input
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-2xl tracking-widest font-mono bg-white/10 border-white/30 text-white placeholder:text-white/50"
                maxLength={6}
              />
            </div>
            
            <div>
              <label className="text-sm text-white/70 block mb-2">
                {language === 'es' ? 'Tu Nombre' : 'Your Nickname'}
              </label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={language === 'es' ? 'Ingresa tu nombre...' : 'Enter your nickname...'}
                className="bg-white/10 border-white/30 text-white placeholder:text-white/50"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
              />
            </div>

            <Button
              onClick={handleJoinSession}
              disabled={isJoining || !nickname.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg py-6"
            >
              {isJoining ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              {language === 'es' ? '¡Entrar!' : 'Join!'}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                setShowJoinForm(false);
                setSessionInfo(null);
                setJoinPin('');
              }}
              className="w-full text-white/70 hover:text-white hover:bg-white/10"
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white/80 mb-6">
            <Gamepad2 className="h-5 w-5" />
            <span className="text-sm font-medium">Play to Learn</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {language === 'es' ? '¡Aprende Jugando!' : 'Learn by Playing!'}
          </h1>
          
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            {language === 'es' 
              ? 'Únete a juegos en vivo o practica a tu propio ritmo con experiencias interactivas al estilo Kahoot'
              : 'Join live games or practice at your own pace with Kahoot-style interactive experiences'}
          </p>
        </div>

        {/* Join by PIN Section */}
        <Card className="max-w-md mx-auto mb-12 bg-white/10 backdrop-blur-xl border-white/20">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <Hash className="h-10 w-10 mx-auto text-yellow-400 mb-2" />
              <h2 className="text-xl font-bold text-white">
                {language === 'es' ? '¿Tienes un PIN?' : 'Have a PIN?'}
              </h2>
              <p className="text-white/60 text-sm">
                {language === 'es' ? 'Ingresa el código para unirte' : 'Enter the code to join'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={joinPin}
                onChange={(e) => setJoinPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="text-center text-xl tracking-widest font-mono bg-white/10 border-white/30 text-white placeholder:text-white/30"
                maxLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinByPin()}
                data-testid="pin-input"
              />
              <Button
                onClick={handleJoinByPin}
                disabled={isJoining || joinPin.length !== 6}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-6"
              >
                {isJoining ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Game Modes */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            {language === 'es' ? 'Modos de Juego' : 'Game Modes'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {gameModes.map((mode) => (
              <Card 
                key={mode.id}
                className={`bg-gradient-to-br ${mode.color} border-0 overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 hover:shadow-2xl`}
              >
                <CardContent className="p-6 text-white">
                  <mode.icon className="h-10 w-10 mb-4" />
                  <h3 className="font-bold text-lg mb-1">{mode.name}</h3>
                  <p className="text-sm text-white/80">{mode.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto text-blue-400 mb-4" />
              <h3 className="font-bold text-white mb-2">
                {language === 'es' ? 'Juegos en Vivo' : 'Live Games'}
              </h3>
              <p className="text-white/60 text-sm">
                {language === 'es' 
                  ? 'Compite en tiempo real con tu clase'
                  : 'Compete in real-time with your class'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto text-green-400 mb-4" />
              <h3 className="font-bold text-white mb-2">
                {language === 'es' ? 'A Tu Ritmo' : 'Self-Paced'}
              </h3>
              <p className="text-white/60 text-sm">
                {language === 'es' 
                  ? 'Practica cuando quieras sin presión'
                  : 'Practice whenever you want without pressure'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-6 text-center">
              <Trophy className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
              <h3 className="font-bold text-white mb-2">
                {language === 'es' ? 'Sin Calificaciones' : 'No Grades'}
              </h3>
              <p className="text-white/60 text-sm">
                {language === 'es' 
                  ? 'Solo diversión y aprendizaje'
                  : 'Just fun and learning'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mt-8 gap-2">
          <Button
            variant={language === 'es' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('es')}
            className={language === 'es' ? 'bg-white/20' : 'bg-transparent border-white/30 text-white'}
          >
            🇪🇸 Español
          </Button>
          <Button
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
            className={language === 'en' ? 'bg-white/20' : 'bg-transparent border-white/30 text-white'}
          >
            🇺🇸 English
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlayToLearnLanding;
