import { GraduationCap, Home, Users, Building } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const HomeschoolUseCase = () => {
  const relatedFeatures = [
    { icon: GraduationCap, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'useCaseClassroomTitle', descKey: 'useCaseClassroomDesc', link: '/use-cases/classroom-teachers' },
    { icon: Users, iconColor: 'bg-amber-100 text-amber-600', titleKey: 'useCaseTutorsTitle', descKey: 'useCaseTutorsDesc', link: '/use-cases/tutors' },
    { icon: Building, iconColor: 'bg-blue-100 text-blue-600', titleKey: 'useCaseSchoolsTitle', descKey: 'useCaseSchoolsDesc', link: '/use-cases/schools' }
  ];

  return (
    <FeatureDetailPage
      featureKey="Homeschool"
      icon={Home}
      iconColor="bg-teal-100 text-teal-600"
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/72ce9fb5ddc7fb8402e2640f5fbf6de0072bee3dddd6b602754033de3f46c5f6.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default HomeschoolUseCase;
