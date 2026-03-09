import { GraduationCap, Home, Users, Building } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const SchoolsUseCase = () => {
  const relatedFeatures = [
    { icon: GraduationCap, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'useCaseClassroomTitle', descKey: 'useCaseClassroomDesc', link: '/use-cases/classroom-teachers' },
    { icon: Home, iconColor: 'bg-teal-100 text-teal-600', titleKey: 'useCaseHomeschoolTitle', descKey: 'useCaseHomeschoolDesc', link: '/use-cases/homeschool' },
    { icon: Users, iconColor: 'bg-amber-100 text-amber-600', titleKey: 'useCaseTutorsTitle', descKey: 'useCaseTutorsDesc', link: '/use-cases/tutors' }
  ];

  return (
    <FeatureDetailPage
      featureKey="Schools"
      icon={Building}
      iconColor="bg-blue-100 text-blue-600"
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/c8be25d87aab69a4e573fdc04883804ea754936479aada9258afdf675dfd031f.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default SchoolsUseCase;
