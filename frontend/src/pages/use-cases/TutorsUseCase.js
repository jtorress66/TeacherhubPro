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
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/d4f2f4c611311c9d69cce2eb99dad71a22876cd80ad8a892759c1344361823b2.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default TutorsUseCase;
