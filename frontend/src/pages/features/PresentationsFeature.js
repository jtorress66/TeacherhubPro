import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const PresentationsFeature = () => {
  const relatedFeatures = [
    { icon: Sparkles, iconColor: 'bg-rose-100 text-rose-600', titleKey: 'benefitAIToolsTitle', descKey: 'benefitAIToolsDesc', link: '/features/ai-tools' },
    { icon: Calendar, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'benefitLessonPlanningTitle', descKey: 'benefitLessonPlanningDesc', link: '/features/lesson-planning' },
    { icon: Users, iconColor: 'bg-green-100 text-green-600', titleKey: 'benefitWorkflowTitle', descKey: 'benefitWorkflowDesc', link: '/features/workflow' }
  ];

  return (
    <FeatureDetailPage
      featureKey="Presentations"
      icon={Presentation}
      iconColor="bg-amber-100 text-amber-600"
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/b7fbd0732729ad9a171864069a1c8a51ee31e35651494895551221199530ae0b.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default PresentationsFeature;
