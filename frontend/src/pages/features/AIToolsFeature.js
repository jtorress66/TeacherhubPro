import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const AIToolsFeature = () => {
  const relatedFeatures = [
    { icon: Calendar, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'benefitLessonPlanningTitle', descKey: 'benefitLessonPlanningDesc', link: '/features/lesson-planning' },
    { icon: Presentation, iconColor: 'bg-amber-100 text-amber-600', titleKey: 'benefitPresentationsTitle', descKey: 'benefitPresentationsDesc', link: '/features/presentations' },
    { icon: Users, iconColor: 'bg-green-100 text-green-600', titleKey: 'benefitWorkflowTitle', descKey: 'benefitWorkflowDesc', link: '/features/workflow' }
  ];

  return (
    <FeatureDetailPage
      featureKey="AITools"
      icon={Sparkles}
      iconColor="bg-rose-100 text-rose-600"
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/8adfde28a7a2046536969350fed6692334ec6e1607acf56bb9b75d30e8d710ac.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default AIToolsFeature;
