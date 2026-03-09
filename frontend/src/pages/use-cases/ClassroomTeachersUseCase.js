import { GraduationCap, Home, Users, Building } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const ClassroomTeachersUseCase = () => {
  const relatedFeatures = [
    { icon: Home, iconColor: 'bg-teal-100 text-teal-600', titleKey: 'useCaseHomeschoolTitle', descKey: 'useCaseHomeschoolDesc', link: '/use-cases/homeschool' },
    { icon: Users, iconColor: 'bg-amber-100 text-amber-600', titleKey: 'useCaseTutorsTitle', descKey: 'useCaseTutorsDesc', link: '/use-cases/tutors' },
    { icon: Building, iconColor: 'bg-blue-100 text-blue-600', titleKey: 'useCaseSchoolsTitle', descKey: 'useCaseSchoolsDesc', link: '/use-cases/schools' }
  ];

  return (
    <FeatureDetailPage
      featureKey="ClassroomTeachers"
      icon={GraduationCap}
      iconColor="bg-purple-100 text-purple-600"
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/8d9115998b6703d635009d339aa4714f3dece50cef2cb36dc8b647d8ab8f03af.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default ClassroomTeachersUseCase;
