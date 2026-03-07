import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';

const BenefitGrid = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const benefits = [
    {
      icon: Calendar,
      title: isEs ? 'Planificación de Lecciones' : 'Lesson Planning',
      description: isEs 
        ? 'Crea planes de lección organizados y reutilizables en menos tiempo con plantillas integradas y soporte de IA.'
        : 'Create organized, reusable lesson plans in less time with built-in templates and AI support.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: BookOpen,
      title: isEs ? 'Libro de Calificaciones' : 'Gradebook',
      description: isEs 
        ? 'Registra el progreso de los estudiantes con un libro de calificaciones limpio y sencillo diseñado para el uso real en el aula.'
        : 'Track student progress with a clean, simple gradebook built for real classroom use.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: ClipboardCheck,
      title: isEs ? 'Control de Asistencia' : 'Attendance Tracking',
      description: isEs 
        ? 'Gestiona la asistencia rápidamente y mantén los registros de clase organizados sin papeleo extra.'
        : 'Manage attendance quickly and keep class records organized without extra paperwork.',
      color: 'bg-teal-100 text-teal-600'
    },
    {
      icon: Sparkles,
      title: isEs ? 'Herramientas de IA para Enseñanza' : 'AI Teaching Tools',
      description: isEs 
        ? 'Genera ideas de lecciones, actividades, ejercicios de escritura, materiales de clase y más en segundos.'
        : 'Generate lesson ideas, activities, writing prompts, classroom materials, and more in seconds.',
      color: 'bg-rose-100 text-rose-600'
    },
    {
      icon: Presentation,
      title: isEs ? 'Presentaciones y Recursos' : 'Presentations and Resources',
      description: isEs 
        ? 'Crea materiales para clase más rápido y mantén todo conectado en un solo flujo de trabajo.'
        : 'Build materials for class faster and keep everything connected in one workflow.',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      icon: Users,
      title: isEs ? 'Flujo de Trabajo para Profesores' : 'Teacher-Friendly Workflow',
      description: isEs 
        ? 'Diseñado para educadores que necesitan herramientas prácticas, no software complejo.'
        : 'Designed for educators who need practical tools, not complex software.',
      color: 'bg-green-100 text-green-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {isEs ? 'Todo lo que los profesores necesitan, en un solo lugar' : 'Everything teachers need, in one place'}
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {isEs 
              ? 'Deja de cambiar entre documentos, hojas de cálculo y herramientas desconectadas. TeacherHubPro reúne tu flujo de trabajo principal en una plataforma simple.'
              : 'Stop switching between documents, spreadsheets, and disconnected tools. TeacherHubPro brings your core teaching workflow into one simple platform.'}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl ${benefit.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitGrid;
