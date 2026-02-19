import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { 
  Brain, TrendingUp, Clock, Award, Target, BookOpen, 
  Calculator, FileText, TreePine, User, School, 
  CheckCircle2, AlertCircle, Trophy, Flame, Star,
  Download, Calendar, Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HomeschoolPortal = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const accessToken = token || searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [language, setLanguage] = useState('es');

  const subjects = [
    { id: 'math', name: { en: 'Mathematics', es: 'Matemáticas' }, icon: Calculator, color: 'blue' },
    { id: 'language', name: { en: 'Language Arts', es: 'Lenguaje' }, icon: FileText, color: 'purple' },
    { id: 'science', name: { en: 'Science', es: 'Ciencias' }, icon: TreePine, color: 'green' },
    { id: 'reading', name: { en: 'Reading', es: 'Lectura' }, icon: BookOpen, color: 'amber' },
  ];

  useEffect(() => {
    const fetchPortalData = async () => {
      if (!accessToken) {
        setError('No access token provided');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API}/homeschool-portal/${accessToken}`);
        setData(res.data);
        setLanguage(res.data.language || 'es');
      } catch (err) {
        console.error('Portal error:', err);
        setError(err.response?.data?.detail || 'Invalid or expired access link');
      } finally {
        setLoading(false);
      }
    };

    fetchPortalData();
  }, [accessToken]);

  const getSubjectInfo = (subjectId) => {
    return subjects.find(s => s.id === subjectId) || subjects[0];
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', accent: 'bg-blue-500' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', accent: 'bg-purple-500' },
      green: { bg: 'bg-green-100', text: 'text-green-700', accent: 'bg-green-500' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-700', accent: 'bg-amber-500' },
    };
    return colors[color] || colors.blue;
  };

  const formatTime = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLevelLabel = (level) => {
    const labels = {
      1: { en: 'Beginner', es: 'Principiante' },
      2: { en: 'Basic', es: 'Básico' },
      3: { en: 'Intermediate', es: 'Intermedio' },
      4: { en: 'Advanced', es: 'Avanzado' },
      5: { en: 'Expert', es: 'Experto' },
    };
    return labels[level]?.[language] || labels[1][language];
  };

  const t = (key) => {
    const translations = {
      overview: { en: 'Overview', es: 'Resumen' },
      subjects: { en: 'Subjects', es: 'Materias' },
      achievements: { en: 'Achievements', es: 'Logros' },
      activity: { en: 'Activity', es: 'Actividad' },
      lessonsCompleted: { en: 'Lessons Completed', es: 'Lecciones Completadas' },
      studyTime: { en: 'Study Time', es: 'Tiempo de Estudio' },
      dayStreak: { en: 'Day Streak', es: 'Racha de Días' },
      currentLevel: { en: 'Current Level', es: 'Nivel Actual' },
      progress: { en: 'Progress', es: 'Progreso' },
      completed: { en: 'Completed', es: 'Completado' },
      remaining: { en: 'Remaining', es: 'Pendientes' },
      noData: { en: 'No data available', es: 'Sin datos disponibles' },
      readOnly: { en: 'Read-Only Portal', es: 'Portal de Solo Lectura' },
      parentPortal: { en: 'Parent Portal', es: 'Portal de Padres' },
      adaptiveLearning: { en: 'Adaptive Learning Progress', es: 'Progreso de Aprendizaje Adaptativo' },
      recentActivity: { en: 'Recent Activity', es: 'Actividad Reciente' },
      noProgress: { en: 'No learning progress yet', es: 'Sin progreso de aprendizaje aún' },
      startLearning: { en: 'Student hasn\'t started adaptive learning yet.', es: 'El estudiante aún no ha comenzado el aprendizaje adaptativo.' }
    };
    return translations[key]?.[language] || key;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {language === 'es' ? 'Enlace Inválido' : 'Invalid Link'}
            </h2>
            <p className="text-slate-500">{error}</p>
            <p className="text-sm text-slate-400 mt-4">
              {language === 'es' 
                ? 'Por favor contacte al maestro para obtener un nuevo enlace de acceso.'
                : 'Please contact the teacher for a new access link.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { student, progress, school } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800">TeacherHubPro</h1>
                <p className="text-sm text-slate-500">{t('parentPortal')} - {t('adaptiveLearning')}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {t('readOnly')}
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Student Info Card */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{student?.name}</h2>
                <p className="text-purple-100">{school?.name || 'Homeschool'}</p>
              </div>
              <div className="text-center">
                <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-200 mb-2">
                <CheckCircle2 className="h-5 w-5 text-purple-700" />
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {progress?.total_lessons_completed || 0}
              </p>
              <p className="text-xs text-purple-600">{t('lessonsCompleted')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 mb-2">
                <Clock className="h-5 w-5 text-blue-700" />
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {formatTime(progress?.total_time_spent || 0)}
              </p>
              <p className="text-xs text-blue-600">{t('studyTime')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-200 mb-2">
                <Flame className="h-5 w-5 text-amber-700" />
              </div>
              <p className="text-2xl font-bold text-amber-700">
                {progress?.current_streak || 0}
              </p>
              <p className="text-xs text-amber-600">{t('dayStreak')}</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-5 text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-200 mb-2">
                <Trophy className="h-5 w-5 text-green-700" />
              </div>
              <p className="text-2xl font-bold text-green-700">
                {progress?.achievements?.length || 0}
              </p>
              <p className="text-xs text-green-600">{t('achievements')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="subjects" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subjects">{t('subjects')}</TabsTrigger>
            <TabsTrigger value="achievements">{t('achievements')}</TabsTrigger>
            <TabsTrigger value="activity">{t('activity')}</TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-4">
            {progress?.subjects?.length > 0 ? progress.subjects.map(subject => {
              const subjectInfo = getSubjectInfo(subject.subject);
              const colors = getColorClasses(subjectInfo.color);
              const completionRate = subject.total_lessons > 0 
                ? Math.round((subject.completed_lessons / subject.total_lessons) * 100) 
                : 0;
              const Icon = subjectInfo.icon;
              
              return (
                <Card key={subject.subject} className={`border-l-4 ${colors.accent}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${colors.bg}`}>
                          <Icon className={`h-6 w-6 ${colors.text}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">
                            {subjectInfo.name[language]}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {t('currentLevel')}: {getLevelLabel(subject.current_level)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${colors.bg} ${colors.text}`}>
                        <Star className="h-3 w-3 mr-1" />
                        Level {subject.current_level}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{t('progress')}</span>
                        <span className="font-medium text-slate-800">{completionRate}%</span>
                      </div>
                      <Progress value={completionRate} className="h-3" />
                      
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-800">{subject.completed_lessons}</p>
                          <p className="text-xs text-slate-500">{t('completed')}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-800">
                            {subject.total_lessons - subject.completed_lessons}
                          </p>
                          <p className="text-xs text-slate-500">{t('remaining')}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-bold text-slate-800">
                            {formatTime(subject.time_spent || 0)}
                          </p>
                          <p className="text-xs text-slate-500">{t('studyTime')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('noProgress')}</h3>
                  <p className="text-slate-500">{t('startLearning')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            {progress?.achievements?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {progress.achievements.map((achievement, idx) => (
                  <Card key={idx} className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                    <CardContent className="p-5 text-center">
                      <div className="w-14 h-14 rounded-full bg-amber-200 flex items-center justify-center mx-auto mb-3">
                        <Award className="h-7 w-7 text-amber-700" />
                      </div>
                      <h4 className="font-semibold text-slate-800">{achievement.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{achievement.earned_at}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {language === 'es' ? 'Sin logros aún' : 'No achievements yet'}
                  </h3>
                  <p className="text-slate-500">
                    {language === 'es' 
                      ? 'Completa lecciones para desbloquear logros.' 
                      : 'Complete lessons to unlock achievements.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {t('recentActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progress?.recent_activity?.length > 0 ? (
                  <div className="space-y-3">
                    {progress.recent_activity.map((activity, idx) => {
                      const subjectInfo = getSubjectInfo(activity.subject);
                      const colors = getColorClasses(subjectInfo.color);
                      
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 border"
                        >
                          <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <CheckCircle2 className={`h-4 w-4 ${colors.text}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{activity.lesson_title}</p>
                            <p className="text-sm text-slate-500">{subjectInfo.name[language]}</p>
                          </div>
                          <p className="text-sm text-slate-400">{activity.completed_at}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">{t('noData')}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-8 pb-4">
          <p>{language === 'es' ? 'Este portal es de solo lectura.' : 'This portal is read-only.'}</p>
          <p>{language === 'es' ? 'Contacte al maestro para cualquier pregunta.' : 'Contact the teacher for any questions.'}</p>
          <p className="mt-2 flex items-center justify-center gap-1">
            <Brain className="h-3 w-3" />
            Powered by TeacherHubPro
          </p>
        </div>
      </main>
    </div>
  );
};

export default HomeschoolPortal;
