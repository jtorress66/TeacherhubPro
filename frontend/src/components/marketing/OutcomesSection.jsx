import { Zap, FolderOpen, Heart } from 'lucide-react';

const OutcomesSection = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const outcomes = [
    {
      icon: Zap,
      title: isEs ? 'Planifica más rápido' : 'Plan faster',
      description: isEs 
        ? 'Crea planes de lecciones, actividades de clase y materiales sin empezar desde cero cada vez.'
        : 'Build lesson plans, classroom activities, and materials without starting from scratch every time.',
      gradient: 'from-amber-400 to-orange-500'
    },
    {
      icon: FolderOpen,
      title: isEs ? 'Mantente organizado' : 'Stay organized',
      description: isEs 
        ? 'Mantén calificaciones, asistencia y recursos de enseñanza en un solo lugar en vez de dispersos en múltiples herramientas.'
        : 'Keep grades, attendance, and teaching resources in one place instead of scattered across multiple tools.',
      gradient: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Heart,
      title: isEs ? 'Enseña con confianza' : 'Teach with confidence',
      description: isEs 
        ? 'Usa IA y flujos de trabajo optimizados para reducir el estrés y mantener tu trabajo de aula en movimiento.'
        : 'Use AI and streamlined workflows to reduce stress and keep your classroom work moving.',
      gradient: 'from-rose-400 to-pink-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {isEs ? 'Menos tiempo en administración, más tiempo enseñando' : 'Spend less time on admin and more time teaching'}
          </h2>
        </div>

        {/* Outcomes */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {outcomes.map((outcome, index) => (
            <div key={index} className="text-center">
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${outcome.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                <outcome.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">
                {outcome.title}
              </h3>
              <p className="text-slate-600 leading-relaxed max-w-sm mx-auto">
                {outcome.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OutcomesSection;
