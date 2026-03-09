import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const LessonPlanningFeature = () => {
  const relatedFeatures = [
    { icon: BookOpen, iconColor: 'bg-blue-100 text-blue-600', titleKey: 'benefitGradebookTitle', descKey: 'benefitGradebookDesc', link: '/features/gradebook' },
    { icon: Sparkles, iconColor: 'bg-rose-100 text-rose-600', titleKey: 'benefitAIToolsTitle', descKey: 'benefitAIToolsDesc', link: '/features/ai-tools' },
    { icon: Presentation, iconColor: 'bg-amber-100 text-amber-600', titleKey: 'benefitPresentationsTitle', descKey: 'benefitPresentationsDesc', link: '/features/presentations' }
  ];

  return (
    <FeatureDetailPage
      featureKey="LessonPlanning"
      icon={Calendar}
      iconColor="bg-purple-100 text-purple-600"
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/e4aff08e20075ec9f63aa67464ef279ce164368d974dc6264bca00ab46e5db89.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default LessonPlanningFeature;
