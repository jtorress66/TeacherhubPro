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
      heroImage="https://images.unsplash.com/photo-1758685848208-e108b6af94cc?w=800&h=600&fit=crop"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default LessonPlanningFeature;
