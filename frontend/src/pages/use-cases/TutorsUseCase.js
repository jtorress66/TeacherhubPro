import { GraduationCap, Home, Users, Building } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const TutorsUseCase = () => {
  const relatedFeatures = [
    { icon: GraduationCap, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'useCaseClassroomTitle', descKey: 'useCaseClassroomDesc', link: '/use-cases/classroom-teachers' },
    { icon: Home, iconColor: 'bg-teal-100 text-teal-600', titleKey: 'useCaseHomeschoolTitle', descKey: 'useCaseHomeschoolDesc', link: '/use-cases/homeschool' },
    { icon: Building, iconColor: 'bg-blue-100 text-blue-600', titleKey: 'useCaseSchoolsTitle', descKey: 'useCaseSchoolsDesc', link: '/use-cases/schools' }
  ];

  return (
    <FeatureDetailPage
      featureKey="Tutors"
      icon={Users}
      iconColor="bg-amber-100 text-amber-600"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default TutorsUseCase;
