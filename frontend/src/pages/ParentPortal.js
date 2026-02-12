import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { 
  BookOpen, Award, Calendar, TrendingUp, User, School, 
  CheckCircle, XCircle, Clock, AlertCircle, FileText, GraduationCap
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// GPA Scale
const GPA_SCALE = {
  getLetterGrade: (gpa) => {
    if (gpa >= 3.50) return 'A';
    if (gpa >= 2.50) return 'B';
    if (gpa >= 1.60) return 'C';
    if (gpa >= 0.80) return 'D';
    return 'F';
  },
  percentageToGPA: (percentage) => {
    if (percentage === null || percentage === undefined) return null;
    return Math.max(0, Math.min(4.0, (parseFloat(percentage) / 100) * 4.0));
  },
  getGradeColor: (letter) => {
    switch (letter) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }
};

const ParentPortal = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const accessToken = token || searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    const fetchPortalData = async () => {
      if (!accessToken) {
        setError('No access token provided');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API}/portal/${accessToken}`);
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

  const getGradeInfo = (percentage) => {
    if (percentage === null || percentage === undefined) {
      return { percentage: '-', gpa: '-', letter: '-', color: 'bg-slate-100 text-slate-600' };
    }
    const gpa = GPA_SCALE.percentageToGPA(percentage);
    const letter = GPA_SCALE.getLetterGrade(gpa);
    return {
      percentage: percentage.toFixed(1),
      gpa: gpa.toFixed(2),
      letter,
      color: GPA_SCALE.getGradeColor(letter)
    };
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'absent': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'tardy': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'excused': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50">
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

  const { student, school, classes } = data;
  const t = (key) => {
    const translations = {
      overview: { en: 'Overview', es: 'Resumen' },
      grades: { en: 'Grades', es: 'Calificaciones' },
      attendance: { en: 'Attendance', es: 'Asistencia' },
      assignments: { en: 'Assignments', es: 'Tareas' },
      gpa: { en: 'GPA', es: 'GPA' },
      grade: { en: 'Grade', es: 'Nota' },
      class: { en: 'Class', es: 'Clase' },
      present: { en: 'Present', es: 'Presente' },
      absent: { en: 'Absent', es: 'Ausente' },
      tardy: { en: 'Tardy', es: 'Tardanza' },
      excused: { en: 'Excused', es: 'Excusado' },
      attendanceRate: { en: 'Attendance Rate', es: 'Tasa de Asistencia' },
      upcomingAssignments: { en: 'Upcoming Assignments', es: 'Próximas Tareas' },
      recentGrades: { en: 'Recent Grades', es: 'Notas Recientes' },
      noData: { en: 'No data available', es: 'Sin datos disponibles' },
      readOnly: { en: 'Read-Only Portal', es: 'Portal de Solo Lectura' },
      studentPortal: { en: 'Student Portal', es: 'Portal del Estudiante' },
      due: { en: 'Due', es: 'Entrega' },
      points: { en: 'points', es: 'puntos' },
      score: { en: 'Score', es: 'Puntuación' },
      date: { en: 'Date', es: 'Fecha' },
      status: { en: 'Status', es: 'Estado' }
    };
    return translations[key]?.[language] || key;
  };

  // Calculate overall stats
  const overallGrade = classes?.length > 0 
    ? classes.reduce((sum, c) => sum + (c.average || 0), 0) / classes.filter(c => c.average).length
    : null;
  const overallGradeInfo = getGradeInfo(overallGrade);

  const totalAttendance = classes?.reduce((acc, c) => ({
    present: acc.present + (c.attendance?.present || 0),
    absent: acc.absent + (c.attendance?.absent || 0),
    tardy: acc.tardy + (c.attendance?.tardy || 0),
    excused: acc.excused + (c.attendance?.excused || 0),
    total: acc.total + (c.attendance?.total || 0)
  }), { present: 0, absent: 0, tardy: 0, excused: 0, total: 0 });

  const attendanceRate = totalAttendance.total > 0 
    ? ((totalAttendance.present / totalAttendance.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {school?.logo_url ? (
                <img src={school.logo_url} alt={school.name} className="h-12 w-12 object-contain" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <School className="h-6 w-6 text-green-600" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-slate-800">{school?.name || 'TeacherHubPro'}</h1>
                <p className="text-sm text-slate-500">{t('studentPortal')}</p>
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
        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{student?.first_name} {student?.last_name}</h2>
                <p className="text-green-100">{student?.grade || ''}</p>
              </div>
              {overallGrade && (
                <div className="text-center">
                  <div className={`h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-bold ${overallGradeInfo.color}`}>
                    {overallGradeInfo.letter}
                  </div>
                  <p className="text-sm text-green-100 mt-1">{overallGradeInfo.gpa} GPA</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-slate-800">{overallGradeInfo.gpa}</p>
              <p className="text-xs text-slate-500">{t('gpa')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Award className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-slate-800">{overallGradeInfo.percentage}%</p>
              <p className="text-xs text-slate-500">{t('grade')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-slate-800">{attendanceRate}%</p>
              <p className="text-xs text-slate-500">{t('attendanceRate')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-amber-600" />
              <p className="text-2xl font-bold text-slate-800">{classes?.length || 0}</p>
              <p className="text-xs text-slate-500">{language === 'es' ? 'Clases' : 'Classes'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="grades" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="grades">{t('grades')}</TabsTrigger>
            <TabsTrigger value="attendance">{t('attendance')}</TabsTrigger>
            <TabsTrigger value="assignments">{t('assignments')}</TabsTrigger>
          </TabsList>

          {/* Grades Tab */}
          <TabsContent value="grades" className="space-y-4">
            {classes?.length > 0 ? classes.map(cls => {
              const gradeInfo = getGradeInfo(cls.average);
              return (
                <Card key={cls.class_id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-800">{cls.name}</h3>
                        <p className="text-sm text-slate-500">{cls.subject || cls.grade}-{cls.section}</p>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-sm text-slate-500">{gradeInfo.percentage}%</p>
                          <p className="text-xs text-slate-400">{gradeInfo.gpa} GPA</p>
                        </div>
                        <Badge className={`text-lg font-bold px-4 py-2 ${gradeInfo.color}`}>
                          {gradeInfo.letter}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Recent grades for this class */}
                    {cls.recent_grades?.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-slate-500 mb-2">{t('recentGrades')}</p>
                        <div className="space-y-2">
                          {cls.recent_grades.slice(0, 3).map(grade => (
                            <div key={grade.assignment_id} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">{grade.title}</span>
                              <span className="font-mono text-slate-800">
                                {grade.score}/{grade.points} ({((grade.score/grade.points)*100).toFixed(0)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            }) : (
              <Card>
                <CardContent className="p-8 text-center text-slate-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p>{t('noData')}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            {/* Attendance Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{language === 'es' ? 'Resumen de Asistencia' : 'Attendance Summary'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-green-50">
                    <p className="text-2xl font-bold text-green-600">{totalAttendance.present}</p>
                    <p className="text-xs text-slate-500">{t('present')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <p className="text-2xl font-bold text-red-600">{totalAttendance.absent}</p>
                    <p className="text-xs text-slate-500">{t('absent')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-50">
                    <p className="text-2xl font-bold text-amber-600">{totalAttendance.tardy}</p>
                    <p className="text-xs text-slate-500">{t('tardy')}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <p className="text-2xl font-bold text-blue-600">{totalAttendance.excused}</p>
                    <p className="text-xs text-slate-500">{t('excused')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance by Class */}
            {classes?.map(cls => (
              <Card key={cls.class_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">{cls.name}</h3>
                    <Badge variant="outline">
                      {cls.attendance?.total > 0 
                        ? `${((cls.attendance.present / cls.attendance.total) * 100).toFixed(0)}%`
                        : '-'
                      }
                    </Badge>
                  </div>
                  
                  {cls.attendance_history?.length > 0 ? (
                    <div className="space-y-2">
                      {cls.attendance_history.slice(0, 5).map((record, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                          <span className="text-slate-600">{new Date(record.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            {getAttendanceIcon(record.status)}
                            <span className="capitalize text-slate-700">{t(record.status)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">{t('noData')}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            {/* Upcoming Assignments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-amber-500" />
                  {t('upcomingAssignments')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.upcoming_assignments?.length > 0 ? (
                  <div className="space-y-3">
                    {data.upcoming_assignments.map(assignment => (
                      <div key={assignment.assignment_id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div>
                          <p className="font-medium text-slate-800">{assignment.title}</p>
                          <p className="text-sm text-slate-500">{assignment.class_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-amber-600">
                            {t('due')}: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-slate-500">{assignment.points} {t('points')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-4">{t('noData')}</p>
                )}
              </CardContent>
            </Card>

            {/* All Assignments by Class */}
            {classes?.map(cls => (
              <Card key={cls.class_id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{cls.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {cls.assignments?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 text-slate-600">{language === 'es' ? 'Tarea' : 'Assignment'}</th>
                            <th className="text-center p-2 text-slate-600">{t('due')}</th>
                            <th className="text-center p-2 text-slate-600">{t('score')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cls.assignments.map(a => (
                            <tr key={a.assignment_id} className="border-b border-slate-100">
                              <td className="p-2 text-slate-800">{a.title}</td>
                              <td className="p-2 text-center text-slate-600">
                                {a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}
                              </td>
                              <td className="p-2 text-center">
                                {a.score !== null ? (
                                  <span className="font-mono">{a.score}/{a.points}</span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-4">{t('noData')}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 pt-8 pb-4">
          <p>{language === 'es' ? 'Este portal es de solo lectura.' : 'This portal is read-only.'}</p>
          <p>{language === 'es' ? 'Contacte al maestro para cualquier pregunta.' : 'Contact the teacher for any questions.'}</p>
        </div>
      </main>
    </div>
  );
};

export default ParentPortal;
