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
      heroImage="https://images.unsplash.com/photo-1652127691413-6cb8c0304aba?w=800&h=600&fit=crop"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default AIToolsFeature;
