import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  School, 
  Users, 
  FileText, 
  ArrowRight,
  X,
  Rocket,
  Sparkles,
  Play,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Settings,
  BookOpen,
  Calendar
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Video walkthrough slides (animated tutorial)
const walkthroughSlides = [
  {
    id: 1,
    title_en: "Welcome to TeacherHubPro",
    title_es: "Bienvenido a TeacherHubPro",
    description_en: "Your all-in-one digital teaching assistant. Let's get you set up in just a few minutes!",
    description_es: "Tu asistente digital de enseñanza todo en uno. ¡Te ayudamos a configurar en minutos!",
    icon: Rocket,
    color: "from-cyan-500 to-blue-500",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop"
  },
  {
    id: 2,
    title_en: "Step 1: School Settings",
    title_es: "Paso 1: Configuración de Escuela",
    description_en: "Add your school name, logo, and contact info. This appears on all your printed materials.",
    description_es: "Agrega el nombre de tu escuela, logo e información de contacto. Aparecerá en todos tus materiales impresos.",
    icon: Settings,
    color: "from-purple-500 to-pink-500",
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop"
  },
  {
    id: 3,
    title_en: "Step 2: Create Classes",
    title_es: "Paso 2: Crear Clases",
    description_en: "Set up your classes with subjects, grade levels, and schedules. Add students for attendance tracking.",
    description_es: "Configura tus clases con materias, grados y horarios. Agrega estudiantes para el control de asistencia.",
    icon: Users,
    color: "from-green-500 to-emerald-500",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop"
  },
  {
    id: 4,
    title_en: "Step 3: Plan Your Lessons",
    title_es: "Paso 3: Planifica tus Lecciones",
    description_en: "Create weekly lesson plans with our easy-to-use planner. Use AI to generate content instantly!",
    description_es: "Crea planes de lección semanales con nuestro planificador fácil de usar. ¡Usa IA para generar contenido al instante!",
    icon: BookOpen,
    color: "from-orange-500 to-amber-500",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=400&fit=crop"
  },
  {
    id: 5,
    title_en: "You're Ready!",
    title_es: "¡Estás Listo!",
    description_en: "That's it! Explore AI presentations, attendance tracking, gradebook, and more. Happy teaching!",
    description_es: "¡Eso es todo! Explora presentaciones con IA, control de asistencia, libro de notas y más. ¡Feliz enseñanza!",
    icon: Sparkles,
    color: "from-cyan-500 to-cyan-600",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop"
  }
];

const OnboardingBanner = ({ onComplete }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeTab, setActiveTab] = useState('video'); // 'video' or 'checklist'
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  // Auto-advance slides when playing
  useEffect(() => {
    let interval;
    if (isPlaying && showWelcomeModal) {
      interval = setInterval(() => {
        setCurrentSlide(prev => {
          if (prev >= walkthroughSlides.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 4000); // 4 seconds per slide
    }
    return () => clearInterval(interval);
  }, [isPlaying, showWelcomeModal]);

  const fetchOnboardingStatus = async () => {
    try {
      const res = await axios.get(`${API}/auth/onboarding-status`, { withCredentials: true });
      setOnboardingData(res.data);
      
      // Show welcome modal on first visit
      if (res.data.onboarding_status === 'not_started') {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await axios.put(`${API}/auth/onboarding-status`, {
        onboarding_status: 'dismissed'
      }, { withCredentials: true });
      setDismissed(true);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
    }
  };

  const handleStartSetup = async () => {
    try {
      await axios.put(`${API}/auth/onboarding-status`, {
        onboarding_status: 'in_progress'
      }, { withCredentials: true });
      setShowWelcomeModal(false);
      navigate('/settings?onboarding=1');
    } catch (error) {
      console.error('Error updating onboarding:', error);
      navigate('/settings?onboarding=1');
    }
  };

  const handleCloseWelcome = async () => {
    try {
      await axios.put(`${API}/auth/onboarding-status`, {
        onboarding_status: 'in_progress'
      }, { withCredentials: true });
    } catch (error) {
      console.error('Error updating onboarding:', error);
    }
    setShowWelcomeModal(false);
  };

  const nextSlide = () => {
    if (currentSlide < walkthroughSlides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (loading || dismissed || !onboardingData?.show_onboarding) {
    return null;
  }

  const { setup_items, completed_count, total_count } = onboardingData;
  const progressPercent = (completed_count / total_count) * 100;

  const getIcon = (key) => {
    switch (key) {
      case 'school_info': return School;
      case 'first_class': return Users;
      case 'first_planner': return FileText;
      default: return Circle;
    }
  };

  const getLabel = (item) => {
    return language === 'es' ? item.label_es : item.label_en;
  };

  const slide = walkthroughSlides[currentSlide];
  const SlideIcon = slide.icon;

  return (
    <>
      {/* Welcome Modal with Video Walkthrough */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in">
            {/* Tab Switcher */}
            <div className="flex border-b bg-slate-50">
              <button
                onClick={() => setActiveTab('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'video' 
                    ? 'bg-white text-cyan-600 border-b-2 border-cyan-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Play className="h-4 w-4" />
                {language === 'es' ? 'Ver Tutorial' : 'Watch Tutorial'}
              </button>
              <button
                onClick={() => setActiveTab('checklist')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-medium transition-colors ${
                  activeTab === 'checklist' 
                    ? 'bg-white text-cyan-600 border-b-2 border-cyan-600' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ListChecks className="h-4 w-4" />
                {language === 'es' ? 'Lista de Pasos' : 'Setup Checklist'}
              </button>
            </div>

            {/* Video/Slideshow Tab */}
            {activeTab === 'video' && (
              <div className="relative">
                {/* Slide Content */}
                <div className={`bg-gradient-to-br ${slide.color} p-8 text-white relative overflow-hidden`}>
                  {/* Background Image with Overlay */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `url(${slide.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <SlideIcon className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">
                      {language === 'es' ? slide.title_es : slide.title_en}
                    </h2>
                    <p className="text-white/90 max-w-md mx-auto">
                      {language === 'es' ? slide.description_es : slide.description_en}
                    </p>
                  </div>

                  {/* Slide Navigation */}
                  <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                    <button
                      onClick={prevSlide}
                      disabled={currentSlide === 0}
                      className={`p-2 rounded-full transition-all ${
                        currentSlide === 0 
                          ? 'opacity-30 cursor-not-allowed' 
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {/* Slide Indicators */}
                    <div className="flex gap-2">
                      {walkthroughSlides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentSlide 
                              ? 'bg-white w-6' 
                              : 'bg-white/40 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={nextSlide}
                      disabled={currentSlide === walkthroughSlides.length - 1}
                      className={`p-2 rounded-full transition-all ${
                        currentSlide === walkthroughSlides.length - 1 
                          ? 'opacity-30 cursor-not-allowed' 
                          : 'bg-white/20 hover:bg-white/30'
                      }`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="p-4 bg-slate-50 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {currentSlide + 1} / {walkthroughSlides.length}
                  </span>
                  <button
                    onClick={togglePlay}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isPlaying 
                        ? 'bg-slate-200 text-slate-700' 
                        : 'bg-cyan-600 text-white hover:bg-cyan-700'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <span className="w-3 h-3 bg-current rounded-sm" />
                        {language === 'es' ? 'Pausar' : 'Pause'}
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        {language === 'es' ? 'Reproducir' : 'Play'}
                      </>
                    )}
                  </button>
                  <span className="text-sm text-slate-500">
                    ~{Math.ceil((walkthroughSlides.length - currentSlide) * 4 / 60)} min
                  </span>
                </div>
              </div>
            )}

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
              <>
                {/* Header with gradient */}
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 text-white text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Rocket className="h-7 w-7" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">
                    {language === 'es' ? '¡Bienvenido a TeacherHubPro!' : 'Welcome to TeacherHubPro!'}
                  </h2>
                  <p className="text-cyan-100 text-sm">
                    {language === 'es' 
                      ? 'Completa estos pasos para comenzar' 
                      : 'Complete these steps to get started'}
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Quick setup steps */}
                  <div className="space-y-3 mb-6">
                    {Object.entries(setup_items).map(([key, item]) => {
                      const Icon = getIcon(key);
                      return (
                        <div 
                          key={key}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                            item.completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-slate-50 border-slate-200 hover:border-cyan-300 cursor-pointer'
                          }`}
                          onClick={() => !item.completed && navigate(item.route)}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            item.completed ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                          }`}>
                            {item.completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <span className={`font-medium ${item.completed ? 'text-green-700' : 'text-slate-700'}`}>
                              {getLabel(item)}
                            </span>
                            {!item.completed && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {language === 'es' ? 'Click para completar' : 'Click to complete'}
                              </p>
                            )}
                          </div>
                          {!item.completed && <ArrowRight className="h-4 w-4 text-slate-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="p-4 bg-white border-t flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCloseWelcome}
              >
                {language === 'es' ? 'Explorar Primero' : 'Explore First'}
              </Button>
              <Button 
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                onClick={handleStartSetup}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Comenzar Configuración' : 'Start Setup'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Progress Card */}
      <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-white shadow-sm" data-testid="onboarding-banner">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-cyan-600" />
                <h3 className="font-semibold text-slate-800">
                  {language === 'es' ? 'Completa tu configuración' : 'Complete Your Setup'}
                </h3>
                <button
                  onClick={() => setShowWelcomeModal(true)}
                  className="ml-2 text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  {language === 'es' ? 'Ver tutorial' : 'Watch tutorial'}
                </button>
              </div>
              
              <p className="text-sm text-slate-600 mb-3">
                {language === 'es' 
                  ? 'Configura tu escuela y clases para aprovechar todas las funciones.'
                  : 'Set up your school and classes to unlock all features.'}
              </p>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{completed_count} / {total_count} {language === 'es' ? 'completado' : 'completed'}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Setup checklist */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(setup_items).map(([key, item]) => {
                  const Icon = getIcon(key);
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(item.route)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                        item.completed 
                          ? 'bg-green-100 text-green-700 cursor-default' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50'
                      }`}
                      disabled={item.completed}
                      data-testid={`onboarding-step-${key}`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span>{getLabel(item)}</span>
                      {!item.completed && <ArrowRight className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dismiss button */}
            <button 
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title={language === 'es' ? 'Descartar' : 'Dismiss'}
              data-testid="dismiss-onboarding"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default OnboardingBanner;
