import { CheckCircle, Users, HeadphonesIcon, Workflow, Building } from 'lucide-react';

const SocialProofSection = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const trustPoints = [
    {
      icon: Users,
      text: isEs ? 'Diseñado específicamente para educadores' : 'Designed specifically for educators'
    },
    {
      icon: HeadphonesIcon,
      text: isEs ? 'Incluye recursos de soporte y ayuda guiada' : 'Includes support resources and guided help'
    },
    {
      icon: Workflow,
      text: isEs ? 'Construido para simplificar flujos de trabajo comunes de profesores' : 'Built to simplify common teacher workflows'
    },
    {
      icon: Building,
      text: isEs ? 'Adecuado para profesores individuales, educadores en casa y uso escolar' : 'Suitable for individual teachers, homeschool educators, and growing school use'
    }
  ];

  return (
    <section className="py-20 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {isEs ? 'Construido para apoyar el trabajo real del aula' : 'Built to support real classroom work'}
          </h2>
        </div>

        {/* Trust Points Grid */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {trustPoints.map((point, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-lime-500/10 flex items-center justify-center">
                <point.icon className="w-6 h-6 text-lime-400" />
              </div>
              <p className="text-slate-300 leading-relaxed pt-2">
                {point.text}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonial Placeholder */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 bg-slate-800/50 rounded-full px-6 py-3 border border-slate-700/50">
            <CheckCircle className="w-5 h-5 text-lime-400" />
            <span className="text-slate-300 text-sm">
              {isEs ? 'Recursos de ayuda disponibles • Centro de ayuda incluido' : 'Support resources available • Help center included'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;
