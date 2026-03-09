import { Link } from 'react-router-dom';
import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const BenefitGrid = ({ language = 'en' }) => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Calendar,
      title: t('benefitLessonPlanningTitle'),
      description: t('benefitLessonPlanningDesc'),
      color: 'bg-purple-100 text-purple-600',
      link: '/features/lesson-planning'
    },
    {
      icon: BookOpen,
      title: t('benefitGradebookTitle'),
      description: t('benefitGradebookDesc'),
      color: 'bg-blue-100 text-blue-600',
      link: '/features/gradebook'
    },
    {
      icon: ClipboardCheck,
      title: t('benefitAttendanceTitle'),
      description: t('benefitAttendanceDesc'),
      color: 'bg-teal-100 text-teal-600',
      link: '/features/attendance'
    },
    {
      icon: Sparkles,
      title: t('benefitAIToolsTitle'),
      description: t('benefitAIToolsDesc'),
      color: 'bg-rose-100 text-rose-600',
      link: '/features/ai-tools'
    },
    {
      icon: Presentation,
      title: t('benefitPresentationsTitle'),
      description: t('benefitPresentationsDesc'),
      color: 'bg-amber-100 text-amber-600',
      link: '/features/presentations'
    },
    {
      icon: Users,
      title: t('benefitWorkflowTitle'),
      description: t('benefitWorkflowDesc'),
      color: 'bg-green-100 text-green-600',
      link: '/features/workflow'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            {t('benefitSectionTitle')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto px-4">
            {t('benefitSectionSubtitle')}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {benefits.map((benefit, index) => (
            <Link 
              key={index}
              to={benefit.link}
              className="group relative bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-100 transition-all duration-300 cursor-pointer"
              data-testid={`benefit-card-${index}`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${benefit.color} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <benefit.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2 sm:mb-3 group-hover:text-lime-700 transition-colors">
                {benefit.title}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-4">
                {benefit.description}
              </p>
              <div className="flex items-center text-sm font-medium text-lime-600 group-hover:text-lime-700 transition-colors">
                {t('learnMore')}
                <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitGrid;
