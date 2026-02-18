import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import axios from 'axios';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Users,
  Calendar,
  Sparkles,
  FileText,
  Download,
  CheckCircle2,
  SkipForward,
  Rocket,
  School,
  BookOpen,
  Bot,
  Layout
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OnboardingVideo = ({ language = 'en', onClose, onStartSetup }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const audioRef = useRef(null);
  const audioCacheRef = useRef({});
  const isPlayingRef = useRef(false);
  const currentStepRef = useRef(0);

  // Video scenes based on the script
  const scenes = [
    {
      id: 1,
      icon: Rocket,
      iconBg: 'from-cyan-500 to-blue-600',
      title: { 
        en: "Welcome to TeacherHubPro", 
        es: "Bienvenido a TeacherHubPro" 
      },
      content: {
        en: "Your AI-powered lesson planning and classroom management assistant.",
        es: "Tu asistente de planificación de lecciones y gestión del aula impulsado por IA."
      },
      narration: {
        en: "Welcome to TeacherHubPro — your AI-powered lesson planning and classroom management assistant. In the next few minutes, we'll set up your account so you can start creating weekly plans and exporting professional lesson plans.",
        es: "Bienvenido a TeacherHubPro — tu asistente de planificación de lecciones y gestión del aula impulsado por IA. En los próximos minutos, configuraremos tu cuenta para que puedas comenzar a crear planes semanales y exportar planes de lección profesionales."
      },
      tip: {
        en: "Complete these steps to get started",
        es: "Completa estos pasos para comenzar"
      },
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=500&fit=crop",
      duration: 10
    },
    {
      id: 2,
      icon: CheckCircle2,
      iconBg: 'from-emerald-500 to-green-600',
      title: { 
        en: "Three Quick Steps", 
        es: "Tres Pasos Rápidos" 
      },
      content: {
        en: "Setting up TeacherHubPro is quick and easy.",
        es: "Configurar TeacherHubPro es rápido y fácil."
      },
      narration: {
        en: "Setting up TeacherHubPro only takes three quick steps: First, add your school information. Second, create your first class. And third, create your first weekly planner. Let me walk you through each one.",
        es: "Configurar TeacherHubPro solo requiere tres pasos rápidos: Primero, agrega la información de tu escuela. Segundo, crea tu primera clase. Y tercero, crea tu primer planificador semanal. Déjame guiarte en cada uno."
      },
      steps: [
        { icon: School, label: { en: "Add School Info", es: "Agregar Info de Escuela" } },
        { icon: Users, label: { en: "Create First Class", es: "Crear Primera Clase" } },
        { icon: Calendar, label: { en: "Create First Planner", es: "Crear Primer Plan" } }
      ],
      image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&h=500&fit=crop",
      duration: 10
    },
    {
      id: 3,
      icon: Settings,
      iconBg: 'from-purple-500 to-pink-600',
      title: { 
        en: "Step 1: School Settings", 
        es: "Paso 1: Configuración de Escuela" 
      },
      content: {
        en: "Your school info appears on all exported lesson plans.",
        es: "La información de tu escuela aparece en todos los planes exportados."
      },
      narration: {
        en: "Let's begin with your school settings. This information will automatically appear on your exported lesson plans and PDFs. Add your school logo URL to brand your lesson plans. Enter your school name and address. Then add your school phone number and email. Click Save School to store your information. Your branding will now appear on all exported lesson plans.",
        es: "Comencemos con la configuración de tu escuela. Esta información aparecerá automáticamente en tus planes de lección exportados y PDFs. Agrega la URL del logo de tu escuela para personalizar tus planes. Ingresa el nombre y dirección de tu escuela. Luego agrega el número de teléfono y correo de tu escuela. Haz clic en Guardar Escuela para almacenar tu información. Tu marca ahora aparecerá en todos los planes exportados."
      },
      fields: [
        { icon: "🏫", label: { en: "School Logo URL", es: "URL del Logo" } },
        { icon: "📝", label: { en: "School Name", es: "Nombre de Escuela" } },
        { icon: "📍", label: { en: "Address", es: "Dirección" } },
        { icon: "📞", label: { en: "Phone & Email", es: "Teléfono y Correo" } }
      ],
      tip: {
        en: "💡 Your branding will appear on all exported lesson plans",
        es: "💡 Tu marca aparecerá en todos los planes exportados"
      },
      route: "/settings",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=500&fit=crop",
      duration: 35
    },
    {
      id: 4,
      icon: Users,
      iconBg: 'from-green-500 to-emerald-600',
      title: { 
        en: "Step 2: Create Your First Class", 
        es: "Paso 2: Crea Tu Primera Clase" 
      },
      content: {
        en: "Classes help organize your weekly plans and students.",
        es: "Las clases ayudan a organizar tus planes semanales y estudiantes."
      },
      narration: {
        en: "Next, let's create your first class. Classes help TeacherHubPro organize your weekly plans and students. Enter the class name. Choose the grade and section. Add the subject you teach. And set the school year or term. Click Save. Your class is now ready to use. You can add unlimited classes anytime.",
        es: "A continuación, creemos tu primera clase. Las clases ayudan a TeacherHubPro a organizar tus planes semanales y estudiantes. Ingresa el nombre de la clase. Elige el grado y sección. Agrega la materia que enseñas. Y establece el año escolar o término. Haz clic en Guardar. Tu clase ya está lista para usar. Puedes agregar clases ilimitadas en cualquier momento."
      },
      fields: [
        { icon: "📚", label: { en: "Class Name", es: "Nombre de Clase" } },
        { icon: "🎓", label: { en: "Grade & Section", es: "Grado y Sección" } },
        { icon: "📖", label: { en: "Subject", es: "Materia" } },
        { icon: "📅", label: { en: "School Year", es: "Año Escolar" } }
      ],
      tip: {
        en: "💡 You can add unlimited classes anytime",
        es: "💡 Puedes agregar clases ilimitadas en cualquier momento"
      },
      route: "/classes",
      image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=500&fit=crop",
      duration: 40
    },
    {
      id: 5,
      icon: Calendar,
      iconBg: 'from-orange-500 to-amber-600',
      title: { 
        en: "Step 3: Weekly Planner", 
        es: "Paso 3: Planificador Semanal" 
      },
      content: {
        en: "Create your first weekly lesson plan.",
        es: "Crea tu primer plan de lección semanal."
      },
      narration: {
        en: "Now you're ready to create your first weekly lesson plan. Select your class. Enter your unit and lesson title. Add the teacher name and choose your two-week date range. Write your weekly objective and skills. Then start building your lesson plan content.",
        es: "Ahora estás listo para crear tu primer plan de lección semanal. Selecciona tu clase. Ingresa tu unidad y título de lección. Agrega el nombre del maestro y elige tu rango de fechas de dos semanas. Escribe tu objetivo semanal y habilidades. Luego comienza a construir el contenido de tu plan de lección."
      },
      fields: [
        { icon: "📋", label: { en: "Select Class", es: "Seleccionar Clase" } },
        { icon: "📝", label: { en: "Unit & Title", es: "Unidad y Título" } },
        { icon: "📅", label: { en: "Date Range", es: "Rango de Fechas" } },
        { icon: "🎯", label: { en: "Objectives", es: "Objetivos" } }
      ],
      route: "/planner/new",
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=500&fit=crop",
      duration: 45
    },
    {
      id: 6,
      icon: Bot,
      iconBg: 'from-violet-500 to-purple-600',
      title: { 
        en: "AI Lesson Generation", 
        es: "Generación de Lecciones con IA" 
      },
      content: {
        en: "Let AI create lesson content instantly.",
        es: "Deja que la IA cree contenido de lección al instante."
      },
      narration: {
        en: "Need help creating lessons? Click Generate with AI to instantly create lesson content based on your class and topic. The AI will suggest objectives, activities, and assessments tailored to your grade level and subject.",
        es: "¿Necesitas ayuda creando lecciones? Haz clic en Generar con IA para crear contenido de lección instantáneamente basado en tu clase y tema. La IA sugerirá objetivos, actividades y evaluaciones adaptados a tu nivel de grado y materia."
      },
      tip: {
        en: "🤖 AI generates content based on your class and topic",
        es: "🤖 La IA genera contenido basado en tu clase y tema"
      },
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=500&fit=crop",
      duration: 20
    },
    {
      id: 7,
      icon: Download,
      iconBg: 'from-blue-500 to-cyan-600',
      title: { 
        en: "Templates & Export", 
        es: "Plantillas y Exportar" 
      },
      content: {
        en: "Save templates and export professional PDFs.",
        es: "Guarda plantillas y exporta PDFs profesionales."
      },
      narration: {
        en: "You can also use ready-made templates, duplicate last week's plan, and export professional PDFs ready to share with your school. Your school branding will automatically appear on every exported document.",
        es: "También puedes usar plantillas prediseñadas, duplicar el plan de la semana pasada y exportar PDFs profesionales listos para compartir con tu escuela. Tu marca de escuela aparecerá automáticamente en cada documento exportado."
      },
      features: [
        { icon: Layout, label: { en: "Ready-made Templates", es: "Plantillas Prediseñadas" } },
        { icon: FileText, label: { en: "Duplicate Plans", es: "Duplicar Planes" } },
        { icon: Download, label: { en: "Export to PDF", es: "Exportar a PDF" } }
      ],
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=500&fit=crop",
      duration: 20
    },
    {
      id: 8,
      icon: Sparkles,
      iconBg: 'from-cyan-500 to-blue-600',
      title: { 
        en: "You're Ready!", 
        es: "¡Estás Listo!" 
      },
      content: {
        en: "Start planning smarter with TeacherHubPro.",
        es: "Comienza a planificar de manera más inteligente con TeacherHubPro."
      },
      narration: {
        en: "That's it — you're ready to start planning smarter with TeacherHubPro. Let's begin your first lesson plan. Click Start Setup to configure your school settings now.",
        es: "Eso es todo — estás listo para comenzar a planificar de manera más inteligente con TeacherHubPro. Comencemos tu primer plan de lección. Haz clic en Comenzar Configuración para configurar tu escuela ahora."
      },
      tip: {
        en: "TeacherHubPro — Plan smarter. Teach better.",
        es: "TeacherHubPro — Planifica mejor. Enseña mejor."
      },
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop",
      duration: 10
    }
  ];

  // Update refs when state changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);

  // Track if we're in the middle of a play action to prevent double-trigger
  const isPlayingActionRef = useRef(false);

  // Handle audio playback
  const playNarration = async (stepIndex) => {
    if (isMuted) return;
    
    const scene = scenes[stepIndex];
    const text = scene.narration[language];
    const cacheKey = `${stepIndex}-${language}`;

    // Stop any current audio first
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Check cache first
    if (audioCacheRef.current[cacheKey]) {
      if (audioRef.current) {
        audioRef.current.src = audioCacheRef.current[cacheKey];
        try {
          await audioRef.current.play();
        } catch (e) {
          console.log('Audio play interrupted');
        }
      }
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/tts/generate`, {
        text: text,
        voice: language === 'es' ? 'nova' : 'alloy'
      }, { withCredentials: true });

      if (response.data.audio_url) {
        // Cache the audio
        audioCacheRef.current[cacheKey] = response.data.audio_url;
        
        // Only play if we're still on the same step and playing
        if (currentStepRef.current === stepIndex && audioRef.current && !isPaused) {
          audioRef.current.src = response.data.audio_url;
          try {
            await audioRef.current.play();
          } catch (e) {
            console.log('Audio play interrupted');
          }
        }
      }
    } catch (error) {
      console.error('TTS generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    if (isPlayingRef.current && !isPaused && currentStepRef.current < scenes.length - 1) {
      // Wait a moment before advancing
      setTimeout(() => {
        if (isPlayingRef.current && !isPaused) {
          const nextStep = currentStepRef.current + 1;
          setCurrentStep(nextStep);
          // Play narration for next step
          playNarration(nextStep);
        }
      }, 1000);
    } else if (currentStepRef.current >= scenes.length - 1) {
      setIsPlaying(false);
    }
  };

  // Only play narration when step changes AND we're already playing (not on initial play)
  useEffect(() => {
    // Skip if this is triggered by the initial play action
    if (isPlayingActionRef.current) {
      isPlayingActionRef.current = false;
      return;
    }
    // This handles manual step navigation while playing
    // (Note: audio ended auto-advance now handles its own playback)
  }, [currentStep]);

  const handlePlay = () => {
    isPlayingActionRef.current = true;
    setIsPlaying(true);
    setIsPaused(false);
    playNarration(currentStep);
  };

  const handlePause = () => {
    setIsPaused(true);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  const goToStep = (index) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentStep(index);
    if (isPlaying && !isPaused) {
      setTimeout(() => playNarration(index), 100);
    }
  };

  const nextStep = () => {
    if (currentStep < scenes.length - 1) {
      goToStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    }
  };

  const skipToEnd = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentStep(scenes.length - 1);
    setIsPlaying(false);
  };

  const scene = scenes[currentStep];
  const SceneIcon = scene.icon;
  const progress = ((currentStep + 1) / scenes.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden animate-scale-in">
        {/* Hidden audio element */}
        <audio 
          ref={audioRef} 
          onEnded={handleAudioEnded}
          preload="auto"
        />

        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${scene.iconBg} flex items-center justify-center`}>
              <SceneIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium text-slate-700">
              {language === 'es' ? 'Tutorial de Inicio' : 'Getting Started Tutorial'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">
              {currentStep + 1} / {scenes.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Video/Content Area */}
        <div className="relative">
          {/* Background Image */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${scene.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-br ${scene.iconBg} opacity-90`} />

          {/* Content */}
          <div className="relative z-10 p-8 text-white min-h-[320px] flex flex-col justify-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <SceneIcon className="h-8 w-8" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-3">
              {scene.title[language]}
            </h2>

            {/* Content */}
            <p className="text-white/90 text-center max-w-lg mx-auto mb-4">
              {scene.content[language]}
            </p>

            {/* Dynamic content based on scene type */}
            {scene.steps && (
              <div className="flex justify-center gap-4 mt-4">
                {scene.steps.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <StepIcon className="h-6 w-6" />
                      </div>
                      <span className="text-xs text-white/80">{step.label[language]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {scene.fields && (
              <div className="grid grid-cols-2 gap-3 mt-4 max-w-md mx-auto">
                {scene.fields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <span>{field.icon}</span>
                    <span className="text-sm">{field.label[language]}</span>
                  </div>
                ))}
              </div>
            )}

            {scene.features && (
              <div className="flex justify-center gap-4 mt-4">
                {scene.features.map((feature, idx) => {
                  const FeatureIcon = feature.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
                      <FeatureIcon className="h-4 w-4" />
                      <span className="text-sm">{feature.label[language]}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tip */}
            {scene.tip && (
              <div className="mt-4 text-center">
                <span className="inline-block bg-white/20 rounded-full px-4 py-1.5 text-sm backdrop-blur-sm">
                  {scene.tip[language]}
                </span>
              </div>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
                <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                <span className="text-xs">{language === 'es' ? 'Cargando audio...' : 'Loading audio...'}</span>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
              currentStep === 0 
                ? 'opacity-30 cursor-not-allowed bg-white/10' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          
          <button
            onClick={nextStep}
            disabled={currentStep === scenes.length - 1}
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all ${
              currentStep === scenes.length - 1 
                ? 'opacity-30 cursor-not-allowed bg-white/10' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-2 bg-slate-50">
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Controls */}
        <div className="p-4 bg-white border-t flex items-center justify-between">
          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            {!isPlaying ? (
              <Button
                onClick={handlePlay}
                className="bg-cyan-600 hover:bg-cyan-700"
                disabled={isLoading}
              >
                <Play className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Reproducir' : 'Play'}
              </Button>
            ) : isPaused ? (
              <Button
                onClick={handleResume}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Play className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Continuar' : 'Resume'}
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                variant="outline"
              >
                <Pause className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Pausar' : 'Pause'}
              </Button>
            )}

            <button
              onClick={toggleMute}
              className={`p-2 rounded-lg transition-colors ${
                isMuted ? 'bg-slate-200 text-slate-600' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <button
              onClick={skipToEnd}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              title={language === 'es' ? 'Saltar al final' : 'Skip to end'}
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>

          {/* Step Indicators */}
          <div className="flex gap-1.5">
            {scenes.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToStep(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentStep 
                    ? 'bg-cyan-600 w-6' 
                    : idx < currentStep 
                      ? 'bg-cyan-300' 
                      : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              {language === 'es' ? 'Más tarde' : 'Later'}
            </Button>
            <Button
              onClick={onStartSetup}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Comenzar' : 'Start Setup'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingVideo;
