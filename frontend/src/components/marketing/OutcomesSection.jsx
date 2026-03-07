import { Zap, FolderOpen, Heart } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const OutcomesSection = ({ language = 'en' }) => {
  const { t } = useLanguage();

  const outcomes = [
    {
      icon: Zap,
      title: t('outcomePlanFaster'),
      description: t('outcomePlanFasterDesc'),
      gradient: 'from-amber-400 to-orange-500'
    },
    {
      icon: FolderOpen,
      title: t('outcomeStayOrganized'),
      description: t('outcomeStayOrganizedDesc'),
      gradient: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Heart,
      title: t('outcomeTeachConfidence'),
      description: t('outcomeTeachConfidenceDesc'),
      gradient: 'from-rose-400 to-pink-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {t('outcomeSectionTitle')}
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
