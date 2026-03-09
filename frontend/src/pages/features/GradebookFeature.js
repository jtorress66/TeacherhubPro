import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const GradebookFeature = () => {
  const relatedFeatures = [
    { icon: ClipboardCheck, iconColor: 'bg-teal-100 text-teal-600', titleKey: 'benefitAttendanceTitle', descKey: 'benefitAttendanceDesc', link: '/features/attendance' },
    { icon: Calendar, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'benefitLessonPlanningTitle', descKey: 'benefitLessonPlanningDesc', link: '/features/lesson-planning' },
    { icon: Sparkles, iconColor: 'bg-rose-100 text-rose-600', titleKey: 'benefitAIToolsTitle', descKey: 'benefitAIToolsDesc', link: '/features/ai-tools' }
  ];

  return (
    <FeatureDetailPage
      featureKey="Gradebook"
      icon={BookOpen}
      iconColor="bg-blue-100 text-blue-600"
      heroImage="https://images.unsplash.com/photo-1553861542-15283bc1bcd2?w=800&h=600&fit=crop"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default GradebookFeature;
