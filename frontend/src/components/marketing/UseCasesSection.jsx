import { Link } from 'react-router-dom';
import { GraduationCap, Home, Users, Building, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const UseCasesSection = ({ language = 'en' }) => {
  const { t } = useLanguage();

  const useCases = [
    {
      icon: GraduationCap,
      title: t('useCaseClassroomTitle'),
      description: t('useCaseClassroomDesc'),
      gradient: 'from-purple-500 to-indigo-600',
      link: '/use-cases/classroom-teachers'
    },
    {
      icon: Home,
      title: t('useCaseHomeschoolTitle'),
      description: t('useCaseHomeschoolDesc'),
      gradient: 'from-teal-500 to-cyan-600',
      link: '/use-cases/homeschool'
    },
    {
      icon: Users,
      title: t('useCaseTutorsTitle'),
      description: t('useCaseTutorsDesc'),
      gradient: 'from-amber-500 to-orange-600',
      link: '/use-cases/tutors'
    },
    {
      icon: Building,
      title: t('useCaseSchoolsTitle'),
      description: t('useCaseSchoolsDesc'),
      gradient: 'from-blue-500 to-indigo-600',
      link: '/use-cases/schools'
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
            {t('useCaseSectionTitle')}
          </h2>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {useCases.map((useCase, index) => (
            <Link 
              key={index}
              to={useCase.link}
              className="group relative bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 hover:border-lime-400 hover:shadow-xl hover:shadow-lime-100 transition-all duration-300 text-center cursor-pointer"
              data-testid={`usecase-card-${index}`}
            >
              <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <useCase.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-slate-900 mb-2 sm:mb-3 group-hover:text-lime-700 transition-colors">
                {useCase.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3 sm:mb-4 hidden sm:block">
                {useCase.description}
              </p>
              <div className="flex items-center justify-center text-xs sm:text-sm font-medium text-lime-600 group-hover:text-lime-700 transition-colors">
                {t('learnMore')}
                <ArrowRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
