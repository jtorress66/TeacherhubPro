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
      heroImage="https://images.unsplash.com/photo-1672917187338-7f81ecac3d3f?w=800&h=600&fit=crop"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default SchoolsUseCase;
