import { 
  Calendar, FileText, Presentation,
  BookOpen, ClipboardCheck, FolderOpen,
  Sparkles, Wand2, Zap,
  Users, Settings, Link2
} from 'lucide-react';

const FeaturesGroups = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const featureGroups = [
    {
      heading: isEs ? 'Planifica con menos esfuerzo' : 'Plan with less effort',
      features: [
        {
          icon: Calendar,
          title: isEs ? 'Planificación de Lecciones' : 'Lesson Planning',
          description: isEs 
            ? 'Crea lecciones organizadas más rápido con estructuras reutilizables y soporte de IA.'
            : 'Create organized lessons faster with reusable structures and AI support.'
        },
        {
          icon: FileText,
          title: isEs ? 'Plantillas y Reutilización' : 'Templates and Reusability',
          description: isEs 
            ? 'Ahorra tiempo construyendo sobre trabajo previo en lugar de recrear materiales desde cero.'
            : 'Save time by building on previous work instead of recreating materials from scratch.'
        },
        {
          icon: Presentation,
          title: isEs ? 'Materiales de Clase' : 'Classroom Materials',
          description: isEs 
            ? 'Genera recursos, ejercicios y contenido instruccional más eficientemente.'
            : 'Generate resources, prompts, and instructional content more efficiently.'
        }
      ]
    },
    {
      heading: isEs ? 'Mantente al día con la gestión del aula' : 'Stay on top of classroom management',
      features: [
        {
          icon: BookOpen,
          title: isEs ? 'Libro de Calificaciones' : 'Gradebook',
          description: isEs 
            ? 'Registra el rendimiento de los estudiantes en un flujo de trabajo más limpio y fácil.'
            : 'Track student performance in a cleaner, easier workflow.'
        },
        {
          icon: ClipboardCheck,
          title: isEs ? 'Asistencia' : 'Attendance',
          description: isEs 
            ? 'Registra y revisa la asistencia sin depender de sistemas separados.'
            : 'Record and review attendance without relying on separate systems.'
        },
        {
          icon: FolderOpen,
          title: isEs ? 'Herramientas de Organización' : 'Organization Tools',
          description: isEs 
            ? 'Mantén información importante de enseñanza en un solo lugar para acceso más rápido.'
            : 'Keep important teaching information in one place for faster access.'
        }
      ]
    },
    {
      heading: isEs ? 'Usa IA como asistente de enseñanza' : 'Use AI as a teaching assistant',
      features: [
        {
          icon: Sparkles,
          title: isEs ? 'Soporte de IA para Lecciones' : 'AI Lesson Support',
          description: isEs 
            ? 'Genera ideas de lecciones, ejercicios y ayuda de planificación en segundos.'
            : 'Generate lesson ideas, prompts, and planning help in seconds.'
        },
        {
          icon: Wand2,
          title: isEs ? 'Creación de Contenido' : 'Content Creation',
          description: isEs 
            ? 'Crea materiales educativos más rápido con asistencia de IA integrada.'
            : 'Create educational materials faster with built-in AI assistance.'
        },
        {
          icon: Zap,
          title: isEs ? 'Aumento de Productividad' : 'Productivity Boost',
          description: isEs 
            ? 'Reduce el trabajo repetitivo y libera más tiempo para enseñar.'
            : 'Reduce repetitive work and free up more time for teaching.'
        }
      ]
    },
    {
      heading: isEs ? 'Construido para educadores reales' : 'Built for real educators',
      features: [
        {
          icon: Users,
          title: isEs ? 'Diseño Amigable para Profesores' : 'Teacher-Friendly Design',
          description: isEs 
            ? 'Flujos de trabajo simples y claros que apoyan la enseñanza diaria.'
            : 'Simple, clear workflows that support everyday teaching.'
        },
        {
          icon: Settings,
          title: isEs ? 'Casos de Uso Flexibles' : 'Flexible Use Cases',
          description: isEs 
            ? 'Útil para profesores de aula, educadores en casa, tutores y escuelas.'
            : 'Useful for classroom teachers, homeschool educators, tutors, and schools.'
        },
        {
          icon: Link2,
          title: isEs ? 'Experiencia Conectada' : 'Connected Experience',
          description: isEs 
            ? 'Une múltiples partes del flujo de trabajo de enseñanza en una plataforma.'
            : 'Bring multiple parts of the teaching workflow into one platform.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-20">
      {featureGroups.map((group, groupIndex) => (
        <section key={groupIndex} className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-10 text-center">
              {group.heading}
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              {group.features.map((feature, featureIndex) => (
                <div 
                  key={featureIndex}
                  className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-lg hover:border-slate-300 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-lime-100 to-emerald-100 flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-lime-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default FeaturesGroups;
