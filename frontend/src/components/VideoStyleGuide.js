import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import axios from 'axios';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  BookOpen,
  Mail,
  Briefcase,
  Sparkles,
  GraduationCap,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VideoStyleGuide = ({ language, run, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioCache, setAudioCache] = useState({});
  const audioRef = useRef(null);

  // Comprehensive workflow guide content
  const steps = [
    {
      icon: Sparkles,
      iconBg: 'from-amber-400 to-orange-500',
      image: '🎓',
      title: {
        en: "Welcome to TeacherHubPro!",
        es: "¡Bienvenido a TeacherHubPro!"
      },
      content: {
        en: "I'll guide you through setting up your digital classroom. This quick tour will show you the essential workflow to get started. Let's begin!",
        es: "Te guiaré para configurar tu aula digital. Este recorrido rápido te mostrará el flujo de trabajo esencial. ¡Comencemos!"
      },
      narration: {
        en: "Welcome to TeacherHubPro! I'll be your guide today. This quick tour will show you the essential workflow to get your digital classroom up and running. Let's begin!",
        es: "¡Bienvenido a TeacherHubPro! Seré tu guía hoy. Este recorrido rápido te mostrará el flujo de trabajo esencial para poner en marcha tu aula digital. ¡Comencemos!"
      }
    },
    {
      icon: Users,
      iconBg: 'from-green-400 to-emerald-600',
      image: '👥',
      title: {
        en: "Step 1: Create Your Classes",
        es: "Paso 1: Crea tus Clases"
      },
      content: {
        en: "First, you need to create your classes. Go to 'Classes' in the sidebar, click 'Add Class', and enter the class name, subject, and grade level. You can also add students here.",
        es: "Primero, necesitas crear tus clases. Ve a 'Clases' en la barra lateral, haz clic en 'Agregar Clase' e ingresa el nombre, materia y nivel de grado. También puedes agregar estudiantes aquí."
      },
      narration: {
        en: "Step one is creating your classes. This is important because you need classes before you can create lesson plans, take attendance, or record grades. Go to Classes in the sidebar, click Add Class, and enter the class name, subject, and grade level. Don't forget to add your students!",
        es: "El primer paso es crear tus clases. Esto es importante porque necesitas clases antes de poder crear planes de lección, tomar asistencia o registrar calificaciones. Ve a Clases en la barra lateral, haz clic en Agregar Clase e ingresa el nombre, materia y nivel. ¡No olvides agregar a tus estudiantes!"
      },
      tip: {
        en: "💡 You must create classes first before using other features!",
        es: "💡 ¡Debes crear clases primero antes de usar otras funciones!"
      }
    },
    {
      icon: GraduationCap,
      iconBg: 'from-blue-400 to-blue-600',
      image: '🎒',
      title: {
        en: "Step 2: Add Your Students",
        es: "Paso 2: Agrega tus Estudiantes"
      },
      content: {
        en: "After creating a class, add your students. Click on a class, then 'Add Student'. Enter their name, student ID, and parent email for communication.",
        es: "Después de crear una clase, agrega tus estudiantes. Haz clic en una clase, luego 'Agregar Estudiante'. Ingresa su nombre, ID y correo de los padres."
      },
      narration: {
        en: "Step two is adding your students. After creating a class, click on it and select Add Student. Enter their name, student ID, and importantly, their parent's email address. This email is used later when you want to share grades and attendance with parents.",
        es: "El segundo paso es agregar tus estudiantes. Después de crear una clase, haz clic en ella y selecciona Agregar Estudiante. Ingresa su nombre, ID de estudiante y, muy importante, el correo electrónico de los padres. Este correo se usa después para compartir calificaciones y asistencia."
      }
    },
    {
      icon: Calendar,
      iconBg: 'from-purple-400 to-purple-600',
      image: '📅',
      title: {
        en: "Step 3: Create Lesson Plans",
        es: "Paso 3: Crea Planes de Lección"
      },
      content: {
        en: "Now you can create lesson plans! Go to 'Planner', select a class, choose a week, and fill in your daily objectives, activities, and materials.",
        es: "¡Ahora puedes crear planes de lección! Ve a 'Planificador', selecciona una clase, elige una semana y completa tus objetivos diarios, actividades y materiales."
      },
      narration: {
        en: "Now comes the fun part - creating lesson plans! Go to the Planner section, select which class you're planning for, choose the week, and fill in your daily objectives, activities, and materials. You can save your best plans as templates to reuse later.",
        es: "¡Ahora viene la parte divertida - crear planes de lección! Ve a la sección Planificador, selecciona la clase, elige la semana y completa tus objetivos diarios, actividades y materiales. Puedes guardar tus mejores planes como plantillas para reutilizar."
      }
    },
    {
      icon: ClipboardCheck,
      iconBg: 'from-teal-400 to-teal-600',
      image: '✅',
      title: {
        en: "Step 4: Take Attendance",
        es: "Paso 4: Toma Asistencia"
      },
      content: {
        en: "Taking attendance is quick and easy. Go to 'Attendance', select your class and date, then mark each student as Present, Absent, or Tardy with one click.",
        es: "Tomar asistencia es rápido y fácil. Ve a 'Asistencia', selecciona tu clase y fecha, luego marca cada estudiante como Presente, Ausente o Tardío con un clic."
      },
      narration: {
        en: "Taking attendance is super quick. Go to the Attendance section, select your class and today's date, then simply click to mark each student as present, absent, or tardy. You can generate attendance reports anytime to see patterns and trends.",
        es: "Tomar asistencia es súper rápido. Ve a la sección Asistencia, selecciona tu clase y la fecha de hoy, luego simplemente haz clic para marcar cada estudiante como presente, ausente o tardío. Puedes generar reportes de asistencia en cualquier momento."
      }
    },
    {
      icon: BookOpen,
      iconBg: 'from-rose-400 to-rose-600',
      image: '📊',
      title: {
        en: "Step 5: Record Grades",
        es: "Paso 5: Registra Calificaciones"
      },
      content: {
        en: "Use the Gradebook to track student progress. Create assignment categories, add assignments, and enter grades. The system automatically calculates GPAs.",
        es: "Usa el Libro de Calificaciones para seguir el progreso. Crea categorías de tareas, agrega asignaciones e ingresa notas. El sistema calcula promedios automáticamente."
      },
      narration: {
        en: "The Gradebook helps you track student progress. First, set up your grading categories like Homework, Tests, and Projects with their weights. Then add assignments and enter grades. The system automatically calculates GPAs and letter grades for you!",
        es: "El Libro de Calificaciones te ayuda a seguir el progreso de los estudiantes. Primero, configura tus categorías como Tareas, Exámenes y Proyectos con sus pesos. Luego agrega asignaciones e ingresa notas. ¡El sistema calcula promedios y letras automáticamente!"
      }
    },
    {
      icon: Mail,
      iconBg: 'from-cyan-400 to-cyan-600',
      image: '📧',
      title: {
        en: "Step 6: Share with Parents",
        es: "Paso 6: Comparte con Padres"
      },
      content: {
        en: "Keep parents informed! From the Classes page, click 'Send Portal Link' next to any student. Parents receive a secure link to view grades and attendance.",
        es: "¡Mantén informados a los padres! Desde la página de Clases, haz clic en 'Enviar Enlace' junto a cualquier estudiante. Los padres reciben un enlace seguro."
      },
      narration: {
        en: "Communication with parents is essential. From the Classes page, you can click Send Portal Link next to any student. This sends an email to the parent with a secure link where they can view their child's grades and attendance. The link expires after a set number of days for security.",
        es: "La comunicación con los padres es esencial. Desde la página de Clases, puedes hacer clic en Enviar Enlace del Portal junto a cualquier estudiante. Esto envía un correo al padre con un enlace seguro donde pueden ver las calificaciones y asistencia de su hijo."
      }
    },
    {
      icon: Briefcase,
      iconBg: 'from-orange-400 to-orange-600',
      image: '📋',
      title: {
        en: "Bonus: Substitute Packets",
        es: "Extra: Paquetes para Sustitutos"
      },
      content: {
        en: "Going to be absent? Generate a comprehensive substitute packet with all class info, seating charts, lesson plans, and emergency contacts in one click!",
        es: "¿Vas a estar ausente? ¡Genera un paquete completo para el sustituto con toda la información de clase, planes y contactos de emergencia en un clic!"
      },
      narration: {
        en: "Here's a bonus feature! When you need to be absent, go to Substitute Packets. With one click, you can generate a comprehensive packet with all your class information, the current lesson plan, emergency contacts, and special notes for the substitute teacher.",
        es: "¡Aquí hay una función extra! Cuando necesites estar ausente, ve a Paquetes para Sustitutos. Con un clic, puedes generar un paquete completo con toda la información de tu clase, el plan de lección actual, contactos de emergencia y notas especiales para el maestro sustituto."
      }
    },
    {
      icon: CheckCircle2,
      iconBg: 'from-lime-400 to-green-600',
      image: '🎉',
      title: {
        en: "You're Ready!",
        es: "¡Estás Listo!"
      },
      content: {
        en: "That's the complete workflow! Remember: Classes → Students → Plans → Attendance → Grades → Share with Parents. You can restart this guide anytime from the dashboard.",
        es: "¡Ese es el flujo completo! Recuerda: Clases → Estudiantes → Planes → Asistencia → Calificaciones → Compartir con Padres. Puedes reiniciar esta guía cuando quieras."
      },
      narration: {
        en: "Congratulations! You now know the complete TeacherHubPro workflow. Remember the order: First create classes, then add students, create lesson plans, take attendance, record grades, and share progress with parents. You can restart this guide anytime from the dashboard. Happy teaching!",
        es: "¡Felicitaciones! Ahora conoces el flujo completo de TeacherHubPro. Recuerda el orden: Primero crea clases, luego agrega estudiantes, crea planes de lección, toma asistencia, registra calificaciones y comparte el progreso con los padres. ¡Puedes reiniciar esta guía cuando quieras desde el panel. ¡Feliz enseñanza!"
      }
    }
  ];

  const lang = language || 'en';
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Generate and play audio for current step
  const playNarration = async () => {
    const cacheKey = `${currentStep}-${lang}`;
    
    // Check cache first
    if (audioCache[cacheKey]) {
      if (audioRef.current) {
        audioRef.current.src = audioCache[cacheKey];
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/tts/generate`, {
        text: step.narration[lang],
        language: lang
      }, { withCredentials: true });

      if (response.data.audio_url) {
        // Cache the audio
        setAudioCache(prev => ({
          ...prev,
          [cacheKey]: response.data.audio_url
        }));

        if (audioRef.current) {
          audioRef.current.src = response.data.audio_url;
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error generating narration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      playNarration();
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Stop audio when changing steps
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentStep]);

  // Handle audio end
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, []);

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('teacherhubpro_guide_completed', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    localStorage.setItem('teacherhubpro_guide_completed', 'true');
    onClose();
  };

  if (!run) return null;

  const IconComponent = step.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Hidden audio element */}
      <audio ref={audioRef} />
      
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-lime-500 via-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Header with controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          
          {/* Audio controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlay}
              disabled={isLoading}
              className="gap-2 text-lime-600 hover:text-lime-700 hover:bg-lime-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-lime-600 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isPlaying ? (lang === 'es' ? 'Pausar' : 'Pause') : (lang === 'es' ? 'Escuchar' : 'Listen')}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-gray-400 hover:text-gray-600"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>

          <button
            onClick={handleSkip}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Icon and emoji */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className={`p-5 rounded-2xl bg-gradient-to-br ${step.iconBg} shadow-lg`}>
                <IconComponent className="h-10 w-10 text-white" />
              </div>
              <span className="absolute -bottom-2 -right-2 text-3xl">{step.image}</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            {step.title[lang]}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center leading-relaxed mb-4">
            {step.content[lang]}
          </p>

          {/* Tip box if exists */}
          {step.tip && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm font-medium text-center">
                {step.tip[lang]}
              </p>
            </div>
          )}

          {/* Workflow indicator */}
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              {['Classes', 'Students', 'Plans', 'Attendance', 'Grades', 'Parents'].map((item, idx) => (
                <React.Fragment key={item}>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    idx < currentStep 
                      ? 'bg-lime-100 text-lime-700' 
                      : idx === currentStep 
                        ? 'bg-lime-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {lang === 'es' 
                      ? ['Clases', 'Estudiantes', 'Planes', 'Asistencia', 'Notas', 'Padres'][idx]
                      : item
                    }
                  </span>
                  {idx < 5 && <ArrowRight className="h-3 w-3 text-gray-300" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step indicator dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-8 bg-gradient-to-r from-lime-500 to-green-500' 
                    : index < currentStep 
                      ? 'w-2 bg-lime-300' 
                      : 'w-2 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={isFirst}
              className={`gap-2 ${isFirst ? 'invisible' : ''}`}
            >
              <ChevronLeft className="h-4 w-4" />
              {lang === 'es' ? 'Atrás' : 'Back'}
            </Button>

            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600"
            >
              {lang === 'es' ? 'Saltar' : 'Skip'}
            </Button>

            <Button
              onClick={handleNext}
              className="gap-2 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white shadow-lg px-6"
            >
              {isLast 
                ? (lang === 'es' ? '¡Comenzar!' : "Let's Start!") 
                : (lang === 'es' ? 'Siguiente' : 'Next')
              }
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoStyleGuide;
