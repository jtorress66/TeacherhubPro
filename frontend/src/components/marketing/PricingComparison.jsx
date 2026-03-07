import { CheckCircle, Calendar, Sparkles, BookOpen, Users, Layout, Layers } from 'lucide-react';

const PricingComparison = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const valuePoints = [
    {
      icon: Calendar,
      text: isEs ? 'Planificación de lecciones en un solo lugar' : 'Lesson planning in one place'
    },
    {
      icon: Sparkles,
      text: isEs ? 'Soporte de IA integrado' : 'Built-in AI support'
    },
    {
      icon: BookOpen,
      text: isEs ? 'Flujo de trabajo de calificaciones y asistencia' : 'Grade and attendance workflow'
    },
    {
      icon: Users,
      text: isEs ? 'Diseño enfocado en profesores' : 'Teacher-focused design'
    },
    {
      icon: Layout,
      text: isEs ? 'Organización más fácil' : 'Easier organization'
    },
    {
      icon: Layers,
      text: isEs ? 'Una suscripción en vez de varias herramientas dispersas' : 'One subscription instead of several scattered tools'
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            {isEs ? 'Una mejor alternativa a las herramientas desconectadas' : 'A better alternative to disconnected tools'}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            {isEs 
              ? 'TeacherHubPro ayuda a reducir la necesidad de manejar múltiples aplicaciones, documentos, hojas de cálculo y sistemas de planificación. En lugar de armar tu flujo de trabajo manualmente, obtienes una plataforma diseñada para apoyar cómo los educadores realmente trabajan.'
              : 'TeacherHubPro helps reduce the need to juggle multiple apps, documents, spreadsheets, and planning systems. Instead of piecing your workflow together manually, you get one platform designed to support how educators actually work.'}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {valuePoints.map((point, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-lime-100 flex items-center justify-center">
                <point.icon className="w-5 h-5 text-lime-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {point.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingComparison;
