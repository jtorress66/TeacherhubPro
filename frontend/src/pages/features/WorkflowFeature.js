import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';
import FeatureDetailPage from '../components/marketing/FeatureDetailPage';

const WorkflowFeature = () => {
  const relatedFeatures = [
    { icon: Calendar, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'benefitLessonPlanningTitle', descKey: 'benefitLessonPlanningDesc', link: '/features/lesson-planning' },
    { icon: BookOpen, iconColor: 'bg-blue-100 text-blue-600', titleKey: 'benefitGradebookTitle', descKey: 'benefitGradebookDesc', link: '/features/gradebook' },
    { icon: ClipboardCheck, iconColor: 'bg-teal-100 text-teal-600', titleKey: 'benefitAttendanceTitle', descKey: 'benefitAttendanceDesc', link: '/features/attendance' }
  ];

  return (
    <FeatureDetailPage
      featureKey="Workflow"
      icon={Users}
      iconColor="bg-green-100 text-green-600"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default WorkflowFeature;
