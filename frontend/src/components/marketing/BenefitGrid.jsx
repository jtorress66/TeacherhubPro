import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const BenefitGrid = ({ language = 'en' }) => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Calendar,
      title: t('benefitLessonPlanningTitle'),
      description: t('benefitLessonPlanningDesc'),
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: BookOpen,
      title: t('benefitGradebookTitle'),
      description: t('benefitGradebookDesc'),
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: ClipboardCheck,
      title: t('benefitAttendanceTitle'),
      description: t('benefitAttendanceDesc'),
      color: 'bg-teal-100 text-teal-600'
    },
    {
      icon: Sparkles,
      title: t('benefitAIToolsTitle'),
      description: t('benefitAIToolsDesc'),
      color: 'bg-rose-100 text-rose-600'
    },
    {
      icon: Presentation,
      title: t('benefitPresentationsTitle'),
      description: t('benefitPresentationsDesc'),
      color: 'bg-amber-100 text-amber-600'
    },
    {
      icon: Users,
      title: t('benefitWorkflowTitle'),
      description: t('benefitWorkflowDesc'),
      color: 'bg-green-100 text-green-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {t('benefitSectionTitle')}
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            {t('benefitSectionSubtitle')}
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
