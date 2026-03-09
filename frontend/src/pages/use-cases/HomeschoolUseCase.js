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
      relatedFeatures={relatedFeatures}
    />
  );
};

export default HomeschoolUseCase;
