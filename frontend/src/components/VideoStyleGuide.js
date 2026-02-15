import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  CheckCircle2,
  Bot,
  FileText,
  Printer,
  SkipForward
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VideoStyleGuide = ({ language, run, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioCache, setAudioCache] = useState({});
  const [autoPlay, setAutoPlay] = useState(true); // Auto-play enabled by default
  const [isPaused, setIsPaused] = useState(false);
  const audioRef = useRef(null);
  const hasStartedRef = useRef(false);

  // Comprehensive workflow guide content - Updated with new AI features
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
        en: "I'll guide you through setting up your digital classroom. This audio tour will automatically walk you through everything. Sit back and listen!",
        es: "Te guiaré para configurar tu aula digital. Este recorrido de audio te llevará automáticamente por todo. ¡Siéntate y escucha!"
      },
      narration: {
        en: "Welcome to TeacherHubPro! I'll be your guide today. This audio tour will automatically walk you through the complete workflow to set up your digital classroom. Just sit back, relax, and listen as I explain each feature. Let's begin!",
        es: "¡Bienvenido a TeacherHubPro! Seré tu guía hoy. Este recorrido de audio te llevará automáticamente por el flujo completo para configurar tu aula digital. Solo siéntate, relájate y escucha mientras explico cada función. ¡Comencemos!"
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
        en: "First, create your classes. Go to 'Classes' in the sidebar, click 'Add Class', and enter the class name, subject, and grade level.",
        es: "Primero, crea tus clases. Ve a 'Clases' en la barra lateral, haz clic en 'Agregar Clase' e ingresa el nombre, materia y nivel de grado."
      },
      narration: {
        en: "Step one is creating your classes. This is the foundation of everything else. Go to Classes in the sidebar, click Add Class, and enter the class name, subject, and grade level. You need classes before you can create lesson plans, take attendance, or record grades.",
        es: "El primer paso es crear tus clases. Esta es la base de todo lo demás. Ve a Clases en la barra lateral, haz clic en Agregar Clase e ingresa el nombre, materia y nivel de grado. Necesitas clases antes de poder crear planes de lección, tomar asistencia o registrar calificaciones."
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
        en: "After creating a class, add your students. Click on a class, then 'Add Student'. Enter their name, student ID, and parent email.",
        es: "Después de crear una clase, agrega tus estudiantes. Haz clic en una clase, luego 'Agregar Estudiante'. Ingresa su nombre, ID y correo de los padres."
      },
      narration: {
        en: "Step two is adding your students. Click on a class, then select Add Student. Enter their name, student ID, and importantly, their parent's email address. This email is used later when you want to share grades and attendance reports with parents through the parent portal.",
        es: "El segundo paso es agregar tus estudiantes. Haz clic en una clase, luego selecciona Agregar Estudiante. Ingresa su nombre, ID de estudiante y, muy importante, el correo electrónico de los padres. Este correo se usa después para compartir calificaciones y reportes de asistencia a través del portal de padres."
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
        en: "Create lesson plans in the Planner. Select a class, choose a week, and fill in objectives and activities. Use AI to generate plans instantly!",
        es: "Crea planes de lección en el Planificador. Selecciona una clase, elige una semana y completa objetivos y actividades. ¡Usa la IA para generar planes al instante!"
      },
      narration: {
        en: "Now the fun part - creating lesson plans! Go to the Planner section, select your class, choose the week, and fill in your objectives and activities. Here's a tip: you can use AI to generate entire week plans instantly, or get AI suggestions for each day. Save your best plans as templates to reuse later!",
        es: "¡Ahora la parte divertida - crear planes de lección! Ve a la sección Planificador, selecciona tu clase, elige la semana y completa tus objetivos y actividades. Un consejo: puedes usar la IA para generar planes semanales completos al instante, o recibir sugerencias de IA para cada día. ¡Guarda tus mejores planes como plantillas para reutilizar!"
      }
    },
    {
      icon: Bot,
      iconBg: 'from-violet-400 to-purple-600',
      image: '🤖',
      title: {
        en: "Step 4: AI Teaching Assistant",
        es: "Paso 4: Asistente de IA"
      },
      content: {
        en: "Meet your AI co-teacher! Generate lesson plans, quizzes, worksheets, and summaries aligned with Common Core and PR CORE standards.",
        es: "¡Conoce a tu co-maestro de IA! Genera planes de lección, exámenes, hojas de trabajo y resúmenes alineados con Common Core y PR CORE."
      },
      narration: {
        en: "Meet your AI Teaching Assistant! Go to AI Assistant in the sidebar to access powerful tools. You can generate complete lesson plans, quizzes, worksheets, topic summaries, and activity ideas. Everything is aligned with Common Core and Puerto Rico CORE standards. You can also chat with the AI for teaching ideas anytime you need inspiration.",
        es: "¡Conoce a tu Asistente de Enseñanza con IA! Ve a Asistente de IA en la barra lateral para acceder a herramientas poderosas. Puedes generar planes de lección completos, exámenes, hojas de trabajo, resúmenes de temas e ideas de actividades. Todo está alineado con los estándares Common Core y PR CORE. También puedes chatear con la IA para ideas de enseñanza cuando necesites inspiración."
      }
    },
    {
      icon: FileText,
      iconBg: 'from-indigo-400 to-indigo-600',
      image: '📋',
      title: {
        en: "Step 5: Templates & Quick Week",
        es: "Paso 5: Plantillas y Semana Rápida"
      },
      content: {
        en: "Save your best lesson plans as templates! Use 'Generate Full Week' to create a complete 5-day plan with AI, or browse starter templates.",
        es: "¡Guarda tus mejores planes como plantillas! Usa 'Generar Semana Completa' para crear un plan de 5 días con IA, o explora plantillas de inicio."
      },
      narration: {
        en: "Templates are a huge time saver! When you create a great lesson plan, save it as a template to reuse later. We also provide starter templates for different subjects and grade levels. Use the Generate Full Week button in the Planner to create a complete 5-day lesson plan with AI in seconds. Check the Template of the Week on your dashboard for inspiration!",
        es: "¡Las plantillas son un gran ahorro de tiempo! Cuando creas un excelente plan de lección, guárdalo como plantilla para reutilizar después. También proporcionamos plantillas de inicio para diferentes materias y niveles. Usa el botón Generar Semana Completa en el Planificador para crear un plan de 5 días con IA en segundos. ¡Revisa la Plantilla de la Semana en tu panel para inspiración!"
      }
    },
    {
      icon: Printer,
      iconBg: 'from-emerald-400 to-green-600',
      image: '🖨️',
      title: {
        en: "Step 6: Print & Export PDF",
        es: "Paso 6: Imprimir y Exportar PDF"
      },
      content: {
        en: "Export any AI-generated content as PDF! Print quizzes, worksheets, and lesson plans with professional formatting.",
        es: "¡Exporta cualquier contenido de IA como PDF! Imprime exámenes, hojas de trabajo y planes con formato profesional."
      },
      narration: {
        en: "Need to print your materials? Every piece of content generated by the AI Assistant has a print button. Click it to open a professionally formatted version that you can print directly or save as a PDF. It includes your school branding, metadata like subject and grade level, and clean formatting perfect for the classroom.",
        es: "¿Necesitas imprimir tus materiales? Cada contenido generado por el Asistente de IA tiene un botón de impresión. Haz clic para abrir una versión con formato profesional que puedes imprimir directamente o guardar como PDF. Incluye tu marca escolar, metadatos como materia y nivel de grado, y formato limpio perfecto para el aula."
      }
    },
    {
      icon: ClipboardCheck,
      iconBg: 'from-teal-400 to-teal-600',
      image: '✅',
      title: {
        en: "Step 7: Take Attendance",
        es: "Paso 7: Toma Asistencia"
      },
      content: {
        en: "Taking attendance is quick and easy. Go to 'Attendance', select your class and date, then mark each student with one click.",
        es: "Tomar asistencia es rápido y fácil. Ve a 'Asistencia', selecciona tu clase y fecha, luego marca cada estudiante con un clic."
      },
      narration: {
        en: "Taking attendance is super quick. Go to the Attendance section, select your class and today's date, then simply click to mark each student as present, absent, or tardy. You can generate attendance reports anytime to see patterns and identify students who may need extra support.",
        es: "Tomar asistencia es súper rápido. Ve a la sección Asistencia, selecciona tu clase y la fecha de hoy, luego simplemente haz clic para marcar cada estudiante como presente, ausente o tardío. Puedes generar reportes de asistencia en cualquier momento para ver patrones e identificar estudiantes que necesiten apoyo extra."
      }
    },
    {
      icon: BookOpen,
      iconBg: 'from-rose-400 to-rose-600',
      image: '📊',
      title: {
        en: "Step 8: Record Grades",
        es: "Paso 8: Registra Calificaciones"
      },
      content: {
        en: "Use the Gradebook to track student progress. Create assignment categories, add assignments, and enter grades. GPAs are calculated automatically.",
        es: "Usa el Libro de Calificaciones para seguir el progreso. Crea categorías de tareas, agrega asignaciones e ingresa notas. Los promedios se calculan automáticamente."
      },
      narration: {
        en: "The Gradebook helps you track student progress throughout the semester. First, set up your grading categories like Homework, Tests, and Projects with their percentage weights. Then add assignments and enter grades. The system automatically calculates GPAs and letter grades using your school's grading scale.",
        es: "El Libro de Calificaciones te ayuda a seguir el progreso de los estudiantes durante el semestre. Primero, configura tus categorías de calificación como Tareas, Exámenes y Proyectos con sus pesos porcentuales. Luego agrega asignaciones e ingresa notas. El sistema calcula automáticamente promedios y letras usando la escala de tu escuela."
      }
    },
    {
      icon: Mail,
      iconBg: 'from-cyan-400 to-cyan-600',
      image: '📧',
      title: {
        en: "Step 9: Share with Parents",
        es: "Paso 9: Comparte con Padres"
      },
      content: {
        en: "Keep parents informed! Click 'Send Portal Link' next to any student. Parents receive a secure link to view grades and attendance.",
        es: "¡Mantén informados a los padres! Haz clic en 'Enviar Enlace' junto a cualquier estudiante. Los padres reciben un enlace seguro para ver notas y asistencia."
      },
      narration: {
        en: "Communication with parents is essential for student success. From the Classes page, click Send Portal Link next to any student. This sends an email to the parent with a secure link where they can view their child's grades, attendance records, and assignments. The link expires after a set number of days for security.",
        es: "La comunicación con los padres es esencial para el éxito de los estudiantes. Desde la página de Clases, haz clic en Enviar Enlace del Portal junto a cualquier estudiante. Esto envía un correo al padre con un enlace seguro donde pueden ver las calificaciones, registros de asistencia y tareas de su hijo. El enlace expira después de un número determinado de días por seguridad."
      }
    },
    {
      icon: Briefcase,
      iconBg: 'from-orange-400 to-orange-600',
      image: '💼',
      title: {
        en: "Bonus: Substitute Packets",
        es: "Extra: Paquetes para Sustitutos"
      },
      content: {
        en: "Going to be absent? Generate a comprehensive substitute packet with class info, lesson plans, and emergency contacts in one click!",
        es: "¿Vas a estar ausente? ¡Genera un paquete completo para el sustituto con información de clase, planes y contactos de emergencia en un clic!"
      },
      narration: {
        en: "Here's a bonus feature that teachers love! When you need to be absent, go to Substitute Packets. With one click, generate a comprehensive packet with all your class information, the current lesson plan, seating charts, emergency contacts, and special notes for the substitute teacher. Print it or email it instantly!",
        es: "¡Aquí hay una función extra que les encanta a los maestros! Cuando necesites estar ausente, ve a Paquetes para Sustitutos. Con un clic, genera un paquete completo con toda la información de tu clase, el plan de lección actual, diagramas de asientos, contactos de emergencia y notas especiales para el maestro sustituto. ¡Imprímelo o envíalo por correo al instante!"
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
        en: "That's the complete workflow! Classes → Students → Plans → AI Tools → Attendance → Grades → Parents. You can restart this guide anytime!",
        es: "¡Ese es el flujo completo! Clases → Estudiantes → Planes → Herramientas IA → Asistencia → Notas → Padres. ¡Puedes reiniciar esta guía cuando quieras!"
      },
      narration: {
        en: "Congratulations! You now know the complete TeacherHubPro workflow. Remember: First create classes, add students, create lesson plans with AI help, take attendance, record grades, and share with parents. Don't forget to explore the AI Assistant for generating quizzes, worksheets, and more. You can restart this guide anytime from your dashboard. Happy teaching!",
        es: "¡Felicitaciones! Ahora conoces el flujo completo de TeacherHubPro. Recuerda: Primero crea clases, agrega estudiantes, crea planes de lección con ayuda de IA, toma asistencia, registra calificaciones y comparte con los padres. No olvides explorar el Asistente de IA para generar exámenes, hojas de trabajo y más. Puedes reiniciar esta guía cuando quieras desde tu panel. ¡Feliz enseñanza!"
      }
    }
  ];

  const lang = language || 'en';
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  // Generate and play audio for current step
  const playNarration = useCallback(async () => {
    if (isMuted || isPaused) return;
    
    const cacheKey = `${currentStep}-${lang}`;
    
    // Check cache first
    if (audioCache[cacheKey]) {
      if (audioRef.current) {
        audioRef.current.src = audioCache[cacheKey];
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.log('Audio play failed:', e);
        }
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

        if (audioRef.current && !isPaused) {
          audioRef.current.src = response.data.audio_url;
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (e) {
            console.log('Audio play failed:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error generating narration:', error);
      // If TTS fails, auto-advance after a delay
      if (autoPlay && !isPaused) {
        setTimeout(() => {
          if (!isLast) {
            setCurrentStep(prev => prev + 1);
          }
        }, 5000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, lang, audioCache, step, isMuted, isPaused, autoPlay, isLast]);

  // Auto-play audio when step changes (or on initial load)
  useEffect(() => {
    if (run && autoPlay && !isPaused) {
      // Small delay to ensure component is ready
      const timer = setTimeout(() => {
        playNarration();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, run, autoPlay, isPaused, playNarration]);

  // Handle audio end - auto-advance to next step
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => {
        setIsPlaying(false);
        // Auto-advance to next step when audio ends
        if (autoPlay && !isPaused && !isLast) {
          setTimeout(() => {
            setCurrentStep(prev => prev + 1);
          }, 1000); // 1 second pause between steps
        } else if (isLast) {
          // On last step, show completion state
          setIsPlaying(false);
        }
      };
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [autoPlay, isPaused, isLast]);

  const togglePause = () => {
    if (isPaused) {
      // Resume
      setIsPaused(false);
      if (audioRef.current && audioRef.current.src) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        playNarration();
      }
    } else {
      // Pause
      setIsPaused(true);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleNext = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if (isLast) {
      localStorage.setItem('teacherhubpro_guide_completed', 'true');
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
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
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">
              {currentStep + 1} / {steps.length}
            </span>
            {/* Auto-play indicator */}
            {autoPlay && !isPaused && (
              <span className="flex items-center gap-1 text-xs text-lime-600 bg-lime-50 px-2 py-1 rounded-full">
                <span className="w-2 h-2 bg-lime-500 rounded-full animate-pulse" />
                {lang === 'es' ? 'Auto-reproducción' : 'Auto-playing'}
              </span>
            )}
          </div>
          
          {/* Audio controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePause}
              disabled={isLoading}
              className={`gap-2 ${isPaused ? 'text-lime-600 hover:text-lime-700' : 'text-orange-600 hover:text-orange-700'}`}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-lime-600 border-t-transparent rounded-full animate-spin" />
              ) : isPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              {isPaused 
                ? (lang === 'es' ? 'Reanudar' : 'Resume') 
                : (lang === 'es' ? 'Pausar' : 'Pause')
              }
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-gray-400 hover:text-gray-600"
              title={isMuted ? (lang === 'es' ? 'Activar sonido' : 'Unmute') : (lang === 'es' ? 'Silenciar' : 'Mute')}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleNext}
              className="text-gray-400 hover:text-gray-600"
              title={lang === 'es' ? 'Saltar paso' : 'Skip step'}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <button
            onClick={handleSkip}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title={lang === 'es' ? 'Cerrar guía' : 'Close guide'}
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Playing indicator */}
        {isPlaying && (
          <div className="px-6 py-2 bg-lime-50 border-b border-lime-100">
            <div className="flex items-center gap-2 text-lime-700 text-sm">
              <div className="flex gap-1">
                <span className="w-1 h-4 bg-lime-500 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-4 bg-lime-500 rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-4 bg-lime-500 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
              <span>{lang === 'es' ? 'Reproduciendo narración...' : 'Playing narration...'}</span>
            </div>
          </div>
        )}

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
            <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
              {['Classes', 'Students', 'Plans', 'AI', 'Print', 'Attend', 'Grades', 'Parents'].map((item, idx) => (
                <React.Fragment key={item}>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    idx < currentStep 
                      ? 'bg-lime-100 text-lime-700' 
                      : idx === currentStep 
                        ? 'bg-lime-500 text-white' 
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {lang === 'es' 
                      ? ['Clases', 'Estudiantes', 'Planes', 'IA', 'PDF', 'Asist.', 'Notas', 'Padres'][idx]
                      : item
                    }
                  </span>
                  {idx < 7 && <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Step indicator dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    setIsPlaying(false);
                  }
                  setCurrentStep(index);
                }}
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
              {lang === 'es' ? 'Salir' : 'Exit'}
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
