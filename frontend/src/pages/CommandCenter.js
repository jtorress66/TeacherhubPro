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
import { Progress } from '../components/ui/progress';
import { 
  Calendar, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  Plus,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Clock,
  HelpCircle,
  PlayCircle,
  Sparkles,
  Star,
  Lightbulb,
  Wand2,
  ArrowRight,
  GraduationCap,
  TrendingDown,
  FileText,
  Bell,
  CheckCircle2,
  XCircle,
  Edit3,
  Target,
  Zap,
  CalendarDays,
  UserX,
  BookMarked
} from 'lucide-react';
import Layout from '../components/Layout';
import WelcomeTour from '../components/WelcomeTour';
import VideoStyleGuide from '../components/VideoStyleGuide';
import OnboardingBanner from '../components/OnboardingBanner';

const API = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : '/api';

const CommandCenter = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { school, branding } = useSchool();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runTour, setRunTour] = useState(false);
  const [runVideoGuide, setRunVideoGuide] = useState(false);

  useEffect(() => {
    const fetchCommandCenter = async () => {
      try {
        setError(null);
        const response = await axios.get(`${API}/command-center`, { withCredentials: true });
        setData(response.data);
      } catch (err) {
        console.error('Command Center fetch error:', err);
        setError(language === 'es' ? 'Error al cargar datos' : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchCommandCenter();
  }, []);

  const getRiskSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getRiskFactorLabel = (factor) => {
    const labels = {
      failing_grade: language === 'es' ? `Promedio: ${factor.value}%` : `Average: ${factor.value}%`,
      low_grade: language === 'es' ? `Promedio: ${factor.value}%` : `Average: ${factor.value}%`,
      missing_assignments: language === 'es' ? `${factor.value} tareas faltantes` : `${factor.value} missing`,
      high_absences: language === 'es' ? `${factor.value} ausencias` : `${factor.value} absences`,
      absences: language === 'es' ? `${factor.value} ausencias` : `${factor.value} absences`,
      frequent_tardies: language === 'es' ? `${factor.value} tardanzas` : `${factor.value} tardies`
    };
    return labels[factor.type] || factor.type;
  };

  const getRecommendationIcon = (iconName) => {
    const icons = {
      'clipboard-check': ClipboardCheck,
      'alert-triangle': AlertTriangle,
      'edit': Edit3,
      'calendar': Calendar
    };
    const Icon = icons[iconName] || Lightbulb;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96 lg:col-span-2" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </Layout>
    );
  }

  const stats = data?.stats || {};
  const today = data?.today || new Date().toISOString().split('T')[0];
  const dashboardSchool = data?.school || school;

  // Format time for display
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Onboarding Banner for New Users - Skip for Super Admin */}
        {user?.role !== 'super_admin' && <OnboardingBanner />}
        
        {/* Welcome Header */}
        <div 
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-2xl border shadow-sm"
          style={{ 
            background: `linear-gradient(135deg, white 0%, ${branding.primary_color}08 100%)`,
            borderColor: `${branding.primary_color}20`
          }}
        >
          <div className="flex items-center gap-4">
            {user?.role === 'super_admin' ? (
              <img 
                src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
                alt="TeacherHubPro" 
                className="h-14 w-14 rounded-xl shadow-md object-contain bg-white p-1"
              />
            ) : (
              <img 
                src={dashboardSchool?.logo_url || '/school-logo.jpg'} 
                alt={dashboardSchool?.name || 'School'} 
                className="h-14 w-14 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                data-testid="school-logo"
              />
            )}
            <div>
              {user?.role === 'super_admin' ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-600" data-testid="platform-admin-label">
                  Platform Admin
                </p>
              ) : dashboardSchool?.name && dashboardSchool.name !== 'My School' && (
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: branding.primary_color }} data-testid="school-name">
                  {dashboardSchool.name}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-slate-800">
                {language === 'es' ? '¡Hola' : 'Welcome'}, <span style={{ color: branding.primary_color }}>{user?.name?.split(' ')[0] || (language === 'es' ? 'Maestro' : 'Teacher')}</span>!
              </h1>
              <p className="text-slate-500 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {new Date(today).toLocaleDateString(language === 'es' ? 'es-PR' : 'en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setRunTour(true)}
              variant="outline"
              size="sm"
              className="gap-1.5"
              data-testid="start-tour-btn"
            >
              <HelpCircle className="h-4 w-4" />
              {language === 'es' ? 'Tour' : 'Tour'}
            </Button>
            <Button 
              onClick={() => navigate('/planner/new')} 
              size="sm"
              className="gap-1.5 shadow-md" 
              style={{ backgroundColor: branding.primary_color }}
              data-testid="new-plan-btn"
            >
              <Plus className="h-4 w-4" />
              {language === 'es' ? 'Nueva Lección' : 'New Lesson'}
            </Button>
          </div>
        </div>

        {/* Welcome Tour */}
        <WelcomeTour language={language} run={runTour} onClose={() => setRunTour(false)} />
        <VideoStyleGuide language={language} run={runVideoGuide} onClose={() => setRunVideoGuide(false)} />

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-white border-slate-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${branding.primary_color}15` }}>
                  <CalendarDays className="h-5 w-5" style={{ color: branding.primary_color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-classes-today">{stats.classes_today || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'Clases Hoy' : 'Classes Today'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100" data-testid="stat-attendance-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-attendance">
                    {stats.attendance_complete || 0}/{stats.classes_today || 0}
                  </p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'Asistencia' : 'Attendance'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100" data-testid="stat-to-grade-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50">
                  <Edit3 className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-to-grade">{stats.pending_grading || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'Por Calificar' : 'To Grade'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-slate-100" data-testid="stat-at-risk-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-red-50">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800" data-testid="stat-at-risk">{stats.at_risk_count || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'En Riesgo' : 'At Risk'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* TODAY'S SCHEDULE - Primary Focus */}
          <Card className="lg:col-span-2 bg-white border-slate-100 shadow-sm" data-testid="todays-schedule-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${branding.primary_color}15` }}>
                    <Clock className="h-5 w-5" style={{ color: branding.primary_color }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-heading">
                      {language === 'es' ? 'Horario de Hoy' : "Today's Schedule"}
                    </CardTitle>
                    <CardDescription>
                      {data?.schedule?.length || 0} {language === 'es' ? 'clases programadas' : 'classes scheduled'}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/classes')} className="text-slate-500">
                  {language === 'es' ? 'Ver Todas' : 'View All'} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data?.schedule?.length > 0 ? (
                <div className="space-y-3" data-testid="schedule-list">
                  {data.schedule.map((cls, index) => (
                    <div 
                      key={cls.class_id}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                        cls.attendance_taken 
                          ? 'bg-emerald-50/50 border-emerald-100' 
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                      onClick={() => navigate(`/attendance?class=${cls.class_id}`)}
                      data-testid={`schedule-item-${cls.class_id}`}
                    >
                      {/* Period/Time */}
                      <div className="flex-shrink-0 w-20 text-center">
                        {cls.period ? (
                          <div className="text-2xl font-bold" style={{ color: branding.primary_color }}>
                            P{cls.period}
                          </div>
                        ) : cls.start_time ? (
                          <div className="text-sm font-medium text-slate-600">
                            {formatTime(cls.start_time)}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">--</div>
                        )}
                        {cls.start_time && cls.end_time && (
                          <div className="text-xs text-slate-400">
                            {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                          </div>
                        )}
                      </div>
                      
                      {/* Divider */}
                      <div className="w-px h-12 bg-slate-200"></div>
                      
                      {/* Class Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-800 truncate">{cls.name}</h3>
                          {cls.subject && (
                            <Badge variant="secondary" className="text-xs">
                              {cls.subject}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {cls.student_count} {language === 'es' ? 'estudiantes' : 'students'}
                          </span>
                          <span>{cls.grade}-{cls.section}</span>
                        </div>
                      </div>
                      
                      {/* Attendance Status */}
                      <div className="flex-shrink-0">
                        {cls.attendance_taken ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 className="h-5 w-5" />
                            <span className="text-sm font-medium">{language === 'es' ? 'Tomada' : 'Done'}</span>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/attendance?class=${cls.class_id}`);
                            }}
                          >
                            <ClipboardCheck className="h-4 w-4 mr-1" />
                            {language === 'es' ? 'Tomar' : 'Take'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">{language === 'es' ? 'No hay clases hoy' : 'No classes today'}</p>
                  <p className="text-sm mt-1">{language === 'es' ? 'Disfruta tu día libre' : 'Enjoy your day off'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* AI RECOMMENDATIONS */}
            {data?.recommendations?.length > 0 && (
              <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-violet-100">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </div>
                    <CardTitle className="text-base font-heading">
                      {language === 'es' ? 'Recomendaciones' : 'AI Recommendations'}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.recommendations.slice(0, 3).map((rec, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-white/80 rounded-lg border border-violet-100 cursor-pointer hover:bg-white transition-colors"
                      onClick={() => navigate(rec.action_url)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-md ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                          rec.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {getRecommendationIcon(rec.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-800">{rec.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-white border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading">
                  {language === 'es' ? 'Acciones Rápidas' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1.5 hover:bg-slate-50"
                    onClick={() => navigate('/planner/new')}
                    data-testid="quick-new-plan"
                  >
                    <Calendar className="h-5 w-5 text-slate-600" />
                    <span className="text-xs">{language === 'es' ? 'Nueva Lección' : 'New Lesson'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1.5 hover:bg-slate-50"
                    onClick={() => navigate('/attendance')}
                    data-testid="quick-attendance"
                  >
                    <ClipboardCheck className="h-5 w-5 text-slate-600" />
                    <span className="text-xs">{language === 'es' ? 'Asistencia' : 'Attendance'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1.5 hover:bg-slate-50"
                    onClick={() => navigate('/gradebook')}
                    data-testid="quick-gradebook"
                  >
                    <BookOpen className="h-5 w-5 text-slate-600" />
                    <span className="text-xs">{language === 'es' ? 'Calificaciones' : 'Gradebook'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-3 flex flex-col gap-1.5 hover:bg-slate-50"
                    onClick={() => navigate('/prep-agent')}
                    data-testid="quick-prep-agent"
                  >
                    <Wand2 className="h-5 w-5 text-slate-600" />
                    <span className="text-xs">{language === 'es' ? 'Prep Agent' : 'Prep Agent'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Second Row - At Risk Students & Assignments to Grade */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* STUDENTS AT RISK */}
          <Card className="bg-white border-slate-100 shadow-sm" data-testid="students-at-risk-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-heading">
                      {language === 'es' ? 'Estudiantes en Riesgo' : 'Students at Risk'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'es' ? 'Basado en notas y asistencia' : 'Based on grades & attendance'}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {data?.at_risk_students?.length > 0 ? (
                <div className="space-y-3">
                  {data.at_risk_students.slice(0, 5).map((student) => (
                    <div 
                      key={student.student_id}
                      className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-800">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs text-slate-500">{student.class_name}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            student.risk_score >= 4 ? 'border-red-200 text-red-700 bg-red-50' :
                            student.risk_score >= 2 ? 'border-amber-200 text-amber-700 bg-amber-50' :
                            'border-blue-200 text-blue-700 bg-blue-50'
                          }`}
                        >
                          {student.risk_score >= 4 ? (language === 'es' ? 'Alto' : 'High') :
                           student.risk_score >= 2 ? (language === 'es' ? 'Medio' : 'Medium') :
                           (language === 'es' ? 'Bajo' : 'Low')}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {student.risk_factors.map((factor, idx) => (
                          <span 
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded-full border ${getRiskSeverityColor(factor.severity)}`}
                          >
                            {getRiskFactorLabel(factor)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                  <p className="font-medium">{language === 'es' ? '¡Todos van bien!' : 'All students on track!'}</p>
                  <p className="text-sm mt-1">
                    {language === 'es' ? 'No hay alertas de riesgo' : 'No risk alerts at this time'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ASSIGNMENTS TO GRADE */}
          <Card className="bg-white border-slate-100 shadow-sm" data-testid="assignments-to-grade-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <Edit3 className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-heading">
                      {language === 'es' ? 'Por Calificar' : 'Assignments to Grade'}
                    </CardTitle>
                    <CardDescription>
                      {stats.pending_grading || 0} {language === 'es' ? 'entregas pendientes' : 'submissions pending'}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/gradebook')} className="text-slate-500">
                  {language === 'es' ? 'Ver Todo' : 'View All'} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {data?.assignments_to_grade?.length > 0 ? (
                <div className="space-y-3" data-testid="assignments-to-grade-list">
                  {data.assignments_to_grade.slice(0, 5).map((assignment) => {
                    const isOverdue = assignment.due_date && assignment.due_date < today;
                    const progress = assignment.total_students > 0 
                      ? (assignment.graded_count / assignment.total_students) * 100 
                      : 0;
                    
                    return (
                      <div 
                        key={assignment.assignment_id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer hover:shadow-sm ${
                          isOverdue ? 'border-red-100 bg-red-50/30' : 'border-slate-100 hover:border-slate-200'
                        }`}
                        onClick={() => navigate('/gradebook')}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{assignment.title}</p>
                            <p className="text-xs text-slate-500">{assignment.class_name}</p>
                          </div>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs ml-2">
                              {language === 'es' ? 'Vencida' : 'Overdue'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={progress} className="flex-1 h-2" />
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {assignment.graded_count}/{assignment.total_students}
                          </span>
                        </div>
                        {assignment.due_date && (
                          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {language === 'es' ? 'Fecha límite:' : 'Due:'} {new Date(assignment.due_date).toLocaleDateString(language === 'es' ? 'es-PR' : 'en-US')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                  <p className="font-medium">{language === 'es' ? '¡Todo calificado!' : 'All caught up!'}</p>
                  <p className="text-sm mt-1">
                    {language === 'es' ? 'No hay tareas pendientes' : 'No pending assignments'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Lessons */}
        {data?.upcoming_lessons?.length > 0 && (
          <Card className="bg-white border-slate-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <BookMarked className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-heading">
                    {language === 'es' ? 'Próximas Lecciones' : 'Upcoming Lessons'}
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/planner')} className="text-slate-500">
                  {language === 'es' ? 'Ver Todas' : 'View All'} <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.upcoming_lessons.slice(0, 6).map((plan) => (
                  <div 
                    key={plan.plan_id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:shadow-sm transition-shadow"
                    onClick={() => navigate(`/planner/${plan.plan_id}`)}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-medium text-slate-800 truncate flex-1">
                        {plan.title || plan.unit || plan.lesson_topic || 'Untitled'}
                      </p>
                      <Badge variant="outline" className="text-xs ml-2">
                        {(plan.week_start || plan.lesson_date)?.slice(5)}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{plan.class_name}</p>
                    {plan.objective && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{plan.objective}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default CommandCenter;
