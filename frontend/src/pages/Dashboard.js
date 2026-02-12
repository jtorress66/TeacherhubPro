import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  Plus,
  AlertCircle,
  ChevronRight,
  Clock
} from 'lucide-react';
import Layout from '../components/Layout';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { school, branding } = useSchool();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get(`${API}/dashboard`, { withCredentials: true });
        setDashboardData(response.data);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const stats = dashboardData?.stats || {};
  const today = dashboardData?.today || new Date().toISOString().split('T')[0];
  const school = dashboardData?.school;

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Header with School Info */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 bg-gradient-to-br from-white to-green-50/50 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-5">
            {school?.logo_url && (
              <img 
                src={school.logo_url} 
                alt={school.name} 
                className="h-16 w-16 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                data-testid="school-logo"
              />
            )}
            <div>
              {school?.name && (
                <p className="text-sm text-green-600 font-semibold mb-1 uppercase tracking-wide" data-testid="school-name">
                  {school.name}
                </p>
              )}
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-slate-800">
                {t('welcome')}, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Teacher'}</span>!
              </h1>
              <p className="text-slate-500 mt-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(today).toLocaleDateString(language === 'es' ? 'es-PR' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => navigate('/planner/new')} 
              className="gap-2 bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5" 
              data-testid="new-plan-btn"
            >
              <Plus className="h-4 w-4" />
              {t('createPlan')}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
          <Card className="bg-white border-slate-100 card-hover animate-fade-in opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-100">
                  <BookOpen className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">{stats.total_classes || 0}</p>
                  <p className="text-sm text-slate-500">{t('totalClasses')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100 card-hover animate-fade-in opacity-0" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">{stats.total_students || 0}</p>
                  <p className="text-sm text-slate-500">{t('totalStudents')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100 card-hover animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100">
                  <Calendar className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">{stats.total_plans || 0}</p>
                  <p className="text-sm text-slate-500">{t('totalPlans')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100 card-hover animate-fade-in opacity-0" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800">
                    {stats.attendance_complete || 0}/{stats.total_classes || 0}
                  </p>
                  <p className="text-sm text-slate-500">{t('attendance')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attendance Pending */}
          <Card className="lg:col-span-1 bg-white border-slate-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">{t('attendancePending')}</CardTitle>
                <div className="p-2 rounded-lg bg-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData?.attendance_pending?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.attendance_pending.map((cls) => (
                    <div 
                      key={cls.class_id}
                      className="flex items-center justify-between p-4 rounded-xl bg-amber-50 border border-amber-100 cursor-pointer hover:bg-amber-100 hover:shadow-sm transition-all"
                      onClick={() => navigate(`/attendance?class=${cls.class_id}`)}
                      data-testid={`attendance-pending-${cls.class_id}`}
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{cls.name}</p>
                        <p className="text-sm text-slate-500">{cls.grade}-{cls.section}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="hover:bg-amber-200">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-lime-500" />
                  <p>{language === 'es' ? '¡Todo al día!' : 'All caught up!'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-1 bg-white border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => navigate('/planner/new')}
                  data-testid="quick-new-plan"
                >
                  <Calendar className="h-6 w-6 text-slate-600" />
                  <span className="text-xs">{t('createPlan')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => navigate('/attendance')}
                  data-testid="quick-attendance"
                >
                  <ClipboardCheck className="h-6 w-6 text-slate-600" />
                  <span className="text-xs">{t('takeAttendance')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => navigate('/gradebook')}
                  data-testid="quick-gradebook"
                >
                  <BookOpen className="h-6 w-6 text-slate-600" />
                  <span className="text-xs">{t('gradebook')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto py-4 flex flex-col gap-2"
                  onClick={() => navigate('/classes')}
                  data-testid="quick-classes"
                >
                  <Users className="h-6 w-6 text-slate-600" />
                  <span className="text-xs">{t('classes')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card className="lg:col-span-1 bg-white border-slate-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-heading">{t('upcomingAssignments')}</CardTitle>
                <Link to="/gradebook" className="text-sm text-slate-500 hover:text-slate-700">
                  {t('view')} →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {dashboardData?.upcoming_assignments?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.upcoming_assignments.slice(0, 5).map((assignment) => (
                    <div 
                      key={assignment.assignment_id}
                      className="flex items-start justify-between p-3 rounded-lg bg-stone-50 border border-slate-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 text-sm">{assignment.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString(language === 'es' ? 'es-PR' : 'en-US') : 'No date'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {assignment.points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>{t('noData')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Plans */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-heading">{t('recentPlans')}</CardTitle>
              <Link to="/planner" className="text-sm text-slate-500 hover:text-slate-700">
                {t('view')} →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.recent_plans?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardData.recent_plans.map((plan) => (
                  <div 
                    key={plan.plan_id}
                    className="p-4 rounded-lg bg-stone-50 border border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/planner/${plan.plan_id}`)}
                    data-testid={`plan-card-${plan.plan_id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-slate-800">{plan.unit || 'Untitled'}</p>
                        <p className="text-sm text-slate-500">{plan.story}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {plan.week_start?.slice(5)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                      {plan.objective || (language === 'es' ? 'Sin objetivo' : 'No objective')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>{t('noData')}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/planner/new')}
                >
                  {t('createPlan')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
