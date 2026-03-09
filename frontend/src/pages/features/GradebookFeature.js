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
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/bfdbd47244ff7560ec47551765e0af346961c25df30c91e601e66496ffb3ff15.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default GradebookFeature;
