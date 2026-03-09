import { Calendar, BookOpen, ClipboardCheck, Sparkles, Presentation, Users } from 'lucide-react';
import FeatureDetailPage from '../../components/marketing/FeatureDetailPage';

const AttendanceFeature = () => {
  const relatedFeatures = [
    { icon: BookOpen, iconColor: 'bg-blue-100 text-blue-600', titleKey: 'benefitGradebookTitle', descKey: 'benefitGradebookDesc', link: '/features/gradebook' },
    { icon: Calendar, iconColor: 'bg-purple-100 text-purple-600', titleKey: 'benefitLessonPlanningTitle', descKey: 'benefitLessonPlanningDesc', link: '/features/lesson-planning' },
    { icon: Users, iconColor: 'bg-green-100 text-green-600', titleKey: 'benefitWorkflowTitle', descKey: 'benefitWorkflowDesc', link: '/features/workflow' }
  ];

  return (
    <FeatureDetailPage
      featureKey="Attendance"
      icon={ClipboardCheck}
      iconColor="bg-teal-100 text-teal-600"
      heroImage="https://static.prod-images.emergentagent.com/jobs/9651e3ca-5bf4-4d9b-b045-1d41a1fb3908/images/d6cc3e5c329a14e8f8a392628561b3a6744b22573b29e5beb395c21fed31ad72.png"
      relatedFeatures={relatedFeatures}
    />
  );
};

export default AttendanceFeature;
