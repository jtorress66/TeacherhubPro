import { GraduationCap, Home, Users, Building } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const UseCasesSection = ({ language = 'en' }) => {
  const { t } = useLanguage();

  const useCases = [
    {
      icon: GraduationCap,
      title: t('useCaseClassroomTitle'),
      description: t('useCaseClassroomDesc'),
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      icon: Home,
      title: t('useCaseHomeschoolTitle'),
      description: t('useCaseHomeschoolDesc'),
      gradient: 'from-teal-500 to-cyan-600'
    },
    {
      icon: Users,
      title: t('useCaseTutorsTitle'),
      description: t('useCaseTutorsDesc'),
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: Building,
      title: t('useCaseSchoolsTitle'),
      description: t('useCaseSchoolsDesc'),
      gradient: 'from-blue-500 to-indigo-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {t('useCaseSectionTitle')}
          </h2>
        </div>

        {/* Use Cases Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 text-center"
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <useCase.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {useCase.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
