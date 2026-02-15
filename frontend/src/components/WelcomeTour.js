import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  Users,
  Calendar,
  ClipboardCheck,
  BookOpen,
  Mail,
  Briefcase,
  Sparkles,
  Bot,
  FileText,
  Printer
} from 'lucide-react';

const WelcomeTour = ({ language, run, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Bilingual tour content with icons - Updated with new AI features
  const steps = [
    {
      icon: Sparkles,
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
      title: {
        en: "Welcome to TeacherHubPro!",
        es: "¡Bienvenido a TeacherHubPro!"
      },
      content: {
        en: "Let's take a quick tour to help you get started. We'll show you the key features including our powerful AI assistant that will make your teaching life easier!",
        es: "¡Hagamos un recorrido rápido para ayudarte a comenzar! Te mostraremos las funciones clave incluyendo nuestro poderoso asistente de IA que hará tu vida docente más fácil."
      }
    },
    {
      icon: LayoutDashboard,
      iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
      title: {
        en: "Your Dashboard",
        es: "Tu Panel de Control"
      },
      content: {
        en: "This is your command center! See your classes at a glance, quick stats, Template of the Week suggestions, and easy navigation to all features.",
        es: "¡Este es tu centro de comando! Ve tus clases de un vistazo, estadísticas rápidas, sugerencias de plantillas de la semana y navegación fácil a todas las funciones."
      }
    },
    {
      icon: Users,
      iconBg: 'bg-gradient-to-br from-green-400 to-emerald-600',
      title: {
        en: "Manage Your Classes",
        es: "Administra tus Clases"
      },
      content: {
        en: "Create and organize your classes here. Add students, set grade levels, and keep everything organized by semester. You can even send portal links to parents!",
        es: "Crea y organiza tus clases aquí. Agrega estudiantes, establece niveles de grado y mantén todo organizado. ¡Puedes enviar enlaces del portal a los padres!"
      }
    },
    {
      icon: Calendar,
      iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
      title: {
        en: "Lesson Planner",
        es: "Planificador de Lecciones"
      },
      content: {
        en: "Plan your week with ease! Create detailed lesson plans with objectives and activities. Use AI to generate entire week plans or get daily suggestions instantly!",
        es: "¡Planifica tu semana con facilidad! Crea planes detallados con objetivos y actividades. ¡Usa la IA para generar planes semanales completos o sugerencias diarias al instante!"
      }
    },
    {
      icon: Bot,
      iconBg: 'bg-gradient-to-br from-violet-400 to-purple-600',
      title: {
        en: "AI Teaching Assistant",
        es: "Asistente de IA"
      },
      content: {
        en: "Meet your AI co-teacher! Generate lesson plans, quizzes, worksheets, and summaries aligned with Common Core and PR CORE standards. Chat with AI for teaching ideas anytime!",
        es: "¡Conoce a tu co-maestro de IA! Genera planes de lección, exámenes, hojas de trabajo y resúmenes alineados con Common Core y PR CORE. ¡Chatea con la IA para ideas de enseñanza!"
      }
    },
    {
      icon: FileText,
      iconBg: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
      title: {
        en: "Templates & Quick Week",
        es: "Plantillas y Semana Rápida"
      },
      content: {
        en: "Save your best lesson plans as templates to reuse anytime! Use 'Generate Full Week' to create a complete 5-day plan with AI, or browse starter templates for inspiration.",
        es: "¡Guarda tus mejores planes como plantillas para reutilizar! Usa 'Generar Semana Completa' para crear un plan de 5 días con IA, o explora plantillas de inicio para inspiración."
      }
    },
    {
      icon: Printer,
      iconBg: 'bg-gradient-to-br from-emerald-400 to-green-600',
      title: {
        en: "Print & Export PDF",
        es: "Imprimir y Exportar PDF"
      },
      content: {
        en: "Export any AI-generated content as a beautifully formatted PDF! Print quizzes, worksheets, and lesson plans directly from the AI Assistant with professional formatting.",
        es: "¡Exporta cualquier contenido generado por IA como un PDF bien formateado! Imprime exámenes, hojas de trabajo y planes de lección directamente desde el Asistente de IA."
      }
    },
    {
      icon: ClipboardCheck,
      iconBg: 'bg-gradient-to-br from-teal-400 to-teal-600',
      title: {
        en: "Quick Attendance",
        es: "Asistencia Rápida"
      },
      content: {
        en: "Take attendance in seconds! Mark students present, absent, or tardy with just one click. Generate attendance reports anytime you need them.",
        es: "¡Toma asistencia en segundos! Marca a los estudiantes como presentes, ausentes o tardíos con un solo clic. Genera reportes cuando los necesites."
      }
    },
    {
      icon: BookOpen,
      iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600',
      title: {
        en: "Gradebook & Reports",
        es: "Libro de Calificaciones"
      },
      content: {
        en: "Track student progress with our powerful gradebook. Add assignments by category, record grades, calculate GPAs, and generate beautiful reports.",
        es: "Sigue el progreso con nuestro libro de calificaciones. Agrega tareas por categoría, registra notas, calcula promedios y genera reportes."
      }
    },
    {
      icon: Mail,
      iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
      title: {
        en: "Parent Communication",
        es: "Comunicación con Padres"
      },
      content: {
        en: "Send secure portal links to parents so they can view their child's grades and attendance anytime! Just click 'Send Portal Link' on any student.",
        es: "¡Envía enlaces seguros a los padres para que vean las notas y asistencia de sus hijos! Solo haz clic en 'Enviar Enlace' en cualquier estudiante."
      }
    },
    {
      icon: Briefcase,
      iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      title: {
        en: "Substitute Packets",
        es: "Paquetes para Sustitutos"
      },
      content: {
        en: "Going to be absent? Generate comprehensive substitute teacher packets with class info, seating charts, lesson plans, and emergency contacts.",
        es: "¿Vas a estar ausente? Genera paquetes completos para sustitutos con información de clase, planes de lección y contactos de emergencia."
      }
    },
    {
      icon: Sparkles,
      iconBg: 'bg-gradient-to-br from-lime-400 to-green-600',
      title: {
        en: "You're All Set!",
        es: "¡Todo Listo!"
      },
      content: {
        en: "That's it! You're ready to start using TeacherHubPro. Don't forget to try the AI Assistant for lesson planning help. Happy teaching!",
        es: "¡Eso es todo! Estás listo para usar TeacherHubPro. No olvides probar el Asistente de IA para ayuda con planificación. ¡Feliz enseñanza!"
      }
    }
  ];

  const lang = language || 'en';
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('teacherhubpro_tour_completed', 'true');
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
    localStorage.setItem('teacherhubpro_tour_completed', 'true');
    onClose();
  };

  if (!run) return null;

  const IconComponent = step.icon;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-lime-500 to-green-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
          data-testid="tour-close-btn"
        >
          <X className="h-5 w-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="p-8 pt-6">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-2xl ${step.iconBg} shadow-lg`}>
              <IconComponent className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
            {step.title[lang]}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center leading-relaxed mb-8">
            {step.content[lang]}
          </p>

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'w-6 bg-lime-500' 
                    : index < currentStep 
                      ? 'bg-lime-300' 
                      : 'bg-gray-200'
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
              className="gap-2 bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700 text-white shadow-lg"
            >
              {isLast 
                ? (lang === 'es' ? '¡Empezar!' : "Let's Go!") 
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

export default WelcomeTour;
