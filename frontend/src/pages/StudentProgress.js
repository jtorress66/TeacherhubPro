import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Brain, TrendingUp, Clock, Award, Target, BookOpen, 
  Calculator, FileText, TreePine, ChevronRight, Loader2,
  BarChart3, Calendar, Star, Trophy, Sparkles, ArrowLeft,
  CheckCircle2, Circle, Flame, Zap, Download, Printer, Share2, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StudentProgress = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { studentId } = useParams();
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(studentId || '');
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [sharingLink, setSharingLink] = useState(false);
  const [portalLink, setPortalLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [portalLanguage, setPortalLanguage] = useState('es');
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const portalLanguages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
  ];

  const subjects = [
    { id: 'math', name: language === 'es' ? 'Matemáticas' : 'Mathematics', icon: Calculator, color: 'blue' },
    { id: 'language', name: language === 'es' ? 'Lenguaje' : 'Language Arts', icon: FileText, color: 'purple' },
    { id: 'science', name: language === 'es' ? 'Ciencias' : 'Science', icon: TreePine, color: 'green' },
    { id: 'reading', name: language === 'es' ? 'Lectura' : 'Reading', icon: BookOpen, color: 'amber' },
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchProgress(selectedStudent);
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`, { withCredentials: true });
      setStudents(response.data);
      if (response.data.length > 0 && !selectedStudent) {
        setSelectedStudent(response.data[0].student_id);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async (studentId) => {
    setLoadingProgress(true);
    try {
      const response = await axios.get(`${API}/adaptive-learning/dashboard/${studentId}`, { 
        withCredentials: true 
      });
      setProgressData(response.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Set empty progress data if not found
      setProgressData({
        student: students.find(s => s.student_id === studentId) || {},
        subjects: [],
        total_lessons_completed: 0,
        total_time_spent: 0,
        current_streak: 0,
        achievements: []
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  const generateParentLink = async (selectedLang = portalLanguage) => {
    if (!selectedStudent) return;
    
    setSharingLink(true);
    setShowLanguageSelector(false);
    try {
      const response = await axios.post(
        `${API}/students/${selectedStudent}/homeschool-portal-token`,
        { language: selectedLang },
        { withCredentials: true }
      );
      
      const baseUrl = window.location.origin;
      const fullLink = `${baseUrl}${response.data.portal_url}`;
      setPortalLink(fullLink);
      setPortalLanguage(selectedLang);
      toast.success(language === 'es' ? 'Enlace generado' : 'Link generated');
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error(language === 'es' ? 'Error al generar enlace' : 'Error generating link');
    } finally {
      setSharingLink(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const getSubjectInfo = (subjectId) => {
    return subjects.find(s => s.id === subjectId) || subjects[0];
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', accent: 'bg-blue-500', border: 'border-blue-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', accent: 'bg-purple-500', border: 'border-purple-200' },
      green: { bg: 'bg-green-100', text: 'text-green-700', accent: 'bg-green-500', border: 'border-green-200' },
      amber: { bg: 'bg-amber-100', text: 'text-amber-700', accent: 'bg-amber-500', border: 'border-amber-200' },
    };
    return colors[color] || colors.blue;
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getLevelLabel = (level) => {
    const labels = {
      1: language === 'es' ? 'Principiante' : 'Beginner',
      2: language === 'es' ? 'Básico' : 'Basic',
      3: language === 'es' ? 'Intermedio' : 'Intermediate',
      4: language === 'es' ? 'Avanzado' : 'Advanced',
      5: language === 'es' ? 'Experto' : 'Expert',
    };
    return labels[level] || labels[1];
  };

  const downloadProgressReport = () => {
    if (!progressData) return;
    
    const student = students.find(s => s.student_id === selectedStudent);
    const studentName = student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Student';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${language === 'es' ? 'Reporte de Progreso' : 'Progress Report'} - ${studentName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            color: #1e293b;
            line-height: 1.6;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding: 30px;
            background: linear-gradient(135deg, #7c3aed, #2563eb);
            border-radius: 16px;
            color: white;
          }
          .header h1 { font-size: 28px; margin-bottom: 8px; }
          .header p { opacity: 0.9; }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .stat-card {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
          }
          .stat-card .value { font-size: 32px; font-weight: 700; color: #7c3aed; }
          .stat-card .label { font-size: 14px; color: #64748b; margin-top: 4px; }
          .subject-section {
            margin-bottom: 25px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
          }
          .subject-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
          }
          .subject-name { font-size: 18px; font-weight: 600; }
          .level-badge {
            padding: 4px 12px;
            background: #e9d5ff;
            color: #7c3aed;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
          }
          .progress-bar {
            height: 12px;
            background: #e2e8f0;
            border-radius: 6px;
            overflow: hidden;
            margin: 10px 0;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #7c3aed, #2563eb);
            border-radius: 6px;
          }
          .subject-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-top: 15px;
          }
          .subject-stat { text-align: center; }
          .subject-stat .value { font-size: 20px; font-weight: 600; color: #1e293b; }
          .subject-stat .label { font-size: 12px; color: #64748b; }
          .footer {
            margin-top: 40px;
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 12px;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #7c3aed;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
          }
          @media print {
            .print-btn { display: none; }
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ ${language === 'es' ? 'Imprimir' : 'Print'}</button>
        
        <div class="header">
          <h1>📊 ${language === 'es' ? 'Reporte de Progreso' : 'Progress Report'}</h1>
          <p>${studentName} - ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="value">${progressData.total_lessons_completed || 0}</div>
            <div class="label">${language === 'es' ? 'Lecciones Completadas' : 'Lessons Completed'}</div>
          </div>
          <div class="stat-card">
            <div class="value">${formatTime(progressData.total_time_spent || 0)}</div>
            <div class="label">${language === 'es' ? 'Tiempo Total' : 'Total Time'}</div>
          </div>
          <div class="stat-card">
            <div class="value">${progressData.subjects?.length || 0}</div>
            <div class="label">${language === 'es' ? 'Materias Activas' : 'Active Subjects'}</div>
          </div>
          <div class="stat-card">
            <div class="value">${progressData.current_streak || 0}</div>
            <div class="label">${language === 'es' ? 'Racha de Días' : 'Day Streak'}</div>
          </div>
        </div>
        
        ${progressData.subjects?.map(subject => {
          const subjectInfo = getSubjectInfo(subject.subject);
          const completionRate = subject.total_lessons > 0 
            ? Math.round((subject.completed_lessons / subject.total_lessons) * 100) 
            : 0;
          return `
            <div class="subject-section">
              <div class="subject-header">
                <span class="subject-name">${subjectInfo.name}</span>
                <span class="level-badge">${getLevelLabel(subject.current_level)}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${completionRate}%"></div>
              </div>
              <div class="subject-stats">
                <div class="subject-stat">
                  <div class="value">${subject.completed_lessons}/${subject.total_lessons}</div>
                  <div class="label">${language === 'es' ? 'Lecciones' : 'Lessons'}</div>
                </div>
                <div class="subject-stat">
                  <div class="value">${completionRate}%</div>
                  <div class="label">${language === 'es' ? 'Completado' : 'Complete'}</div>
                </div>
                <div class="subject-stat">
                  <div class="value">${formatTime(subject.time_spent || 0)}</div>
                  <div class="label">${language === 'es' ? 'Tiempo' : 'Time'}</div>
                </div>
              </div>
            </div>
          `;
        }).join('') || `<p style="text-align: center; color: #64748b; padding: 40px;">${language === 'es' ? 'No hay datos de progreso aún' : 'No progress data yet'}</p>`}
        
        <div class="footer">
          <p>📚 ${language === 'es' ? 'Generado por' : 'Generated by'} TeacherHubPro - ${language === 'es' ? 'Aprendizaje Adaptativo' : 'Adaptive Learning'}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  const student = students.find(s => s.student_id === selectedStudent);
  const studentName = student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || '';

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              {language === 'es' ? 'Progreso del Estudiante' : 'Student Progress'}
            </h1>
            <p className="text-slate-500 mt-1">
              {language === 'es' 
                ? 'Panel de seguimiento del aprendizaje adaptativo' 
                : 'Adaptive learning progress dashboard'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={() => navigate('/adaptive-learning')}
              className="border-purple-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Volver a Aprendizaje' : 'Back to Learning'}
            </Button>
            {selectedStudent && (
              <Button
                variant="outline"
                onClick={generateParentLink}
                disabled={sharingLink}
                className="border-green-200 text-green-700 hover:bg-green-50"
                data-testid="share-with-parent-btn"
              >
                {sharingLink ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                {language === 'es' ? 'Compartir con Padre' : 'Share with Parent'}
              </Button>
            )}
            {progressData && (
              <Button
                onClick={downloadProgressReport}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                data-testid="download-progress-report"
              >
                <Download className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Descargar Reporte' : 'Download Report'}
              </Button>
            )}
          </div>
        </div>

        {/* Parent Portal Link */}
        {portalLink && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-green-100">
                  <Share2 className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    {language === 'es' ? 'Enlace del Portal para Padres' : 'Parent Portal Link'}
                  </p>
                  <p className="text-xs text-slate-500 truncate max-w-md">{portalLink}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                  className="border-green-300"
                >
                  {copied ? (
                    <><Check className="h-4 w-4 mr-1 text-green-600" /> {language === 'es' ? 'Copiado' : 'Copied'}</>
                  ) : (
                    <><Copy className="h-4 w-4 mr-1" /> {language === 'es' ? 'Copiar' : 'Copy'}</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {language === 'es' 
                  ? 'Los padres pueden usar este enlace para ver el progreso sin necesidad de crear una cuenta.' 
                  : 'Parents can use this link to view progress without creating an account.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Student Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">
                {language === 'es' ? 'Seleccionar Estudiante:' : 'Select Student:'}
              </label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger className="w-[280px]" data-testid="student-progress-selector">
                  <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                </SelectTrigger>
                <SelectContent>
                  {students.map(s => (
                    <SelectItem key={s.student_id} value={s.student_id}>
                      {s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loadingProgress ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : progressData ? (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-200 mb-3">
                    <CheckCircle2 className="h-6 w-6 text-purple-700" />
                  </div>
                  <p className="text-3xl font-bold text-purple-700">
                    {progressData.total_lessons_completed || 0}
                  </p>
                  <p className="text-sm text-purple-600">
                    {language === 'es' ? 'Lecciones Completadas' : 'Lessons Completed'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-200 mb-3">
                    <Clock className="h-6 w-6 text-blue-700" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {formatTime(progressData.total_time_spent || 0)}
                  </p>
                  <p className="text-sm text-blue-600">
                    {language === 'es' ? 'Tiempo de Estudio' : 'Study Time'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-200 mb-3">
                    <Flame className="h-6 w-6 text-amber-700" />
                  </div>
                  <p className="text-3xl font-bold text-amber-700">
                    {progressData.current_streak || 0}
                  </p>
                  <p className="text-sm text-amber-600">
                    {language === 'es' ? 'Racha de Días' : 'Day Streak'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-5 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-200 mb-3">
                    <Trophy className="h-6 w-6 text-green-700" />
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    {progressData.achievements?.length || 0}
                  </p>
                  <p className="text-sm text-green-600">
                    {language === 'es' ? 'Logros' : 'Achievements'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subject Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  {language === 'es' ? 'Progreso por Materia' : 'Progress by Subject'}
                </CardTitle>
                <CardDescription>
                  {language === 'es' 
                    ? 'Rendimiento detallado en cada área de estudio' 
                    : 'Detailed performance in each study area'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {progressData.subjects?.length > 0 ? (
                  progressData.subjects.map(subject => {
                    const subjectInfo = getSubjectInfo(subject.subject);
                    const colors = getColorClasses(subjectInfo.color);
                    const completionRate = subject.total_lessons > 0 
                      ? Math.round((subject.completed_lessons / subject.total_lessons) * 100) 
                      : 0;
                    const Icon = subjectInfo.icon;
                    
                    return (
                      <div 
                        key={subject.subject} 
                        className={`p-5 rounded-xl border ${colors.border} ${colors.bg} bg-opacity-30`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${colors.bg}`}>
                              <Icon className={`h-6 w-6 ${colors.text}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-800">{subjectInfo.name}</h4>
                              <p className="text-sm text-slate-500">
                                {language === 'es' ? 'Nivel' : 'Level'}: {getLevelLabel(subject.current_level)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${colors.bg} ${colors.text}`}>
                              <Star className="h-3 w-3 mr-1" />
                              {language === 'es' ? 'Nivel' : 'Level'} {subject.current_level}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              {language === 'es' ? 'Progreso General' : 'Overall Progress'}
                            </span>
                            <span className="font-medium text-slate-800">{completionRate}%</span>
                          </div>
                          <Progress value={completionRate} className="h-3" />
                          
                          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-800">
                                {subject.completed_lessons}
                              </p>
                              <p className="text-xs text-slate-500">
                                {language === 'es' ? 'Completadas' : 'Completed'}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-800">
                                {subject.total_lessons - subject.completed_lessons}
                              </p>
                              <p className="text-xs text-slate-500">
                                {language === 'es' ? 'Pendientes' : 'Remaining'}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-2xl font-bold text-slate-800">
                                {formatTime(subject.time_spent || 0)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {language === 'es' ? 'Tiempo' : 'Time'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                      {language === 'es' ? 'Sin Datos de Progreso' : 'No Progress Data'}
                    </h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                      {language === 'es' 
                        ? 'Este estudiante aún no ha comenzado ninguna ruta de aprendizaje adaptativo.' 
                        : 'This student hasn\'t started any adaptive learning paths yet.'}
                    </p>
                    <Button 
                      onClick={() => navigate('/adaptive-learning')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Comenzar Aprendizaje' : 'Start Learning'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements Section */}
            {progressData.achievements?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    {language === 'es' ? 'Logros Desbloqueados' : 'Achievements Unlocked'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {progressData.achievements.map((achievement, idx) => (
                      <div 
                        key={idx}
                        className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-200 flex items-center justify-center mb-2">
                          <Award className="h-6 w-6 text-amber-700" />
                        </div>
                        <p className="font-semibold text-slate-800 text-center text-sm">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-slate-500 text-center">
                          {achievement.earned_at}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {language === 'es' ? 'Actividad Reciente' : 'Recent Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressData.recent_activity?.length > 0 ? (
                  <div className="space-y-3">
                    {progressData.recent_activity.map((activity, idx) => {
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
                            <p className="text-sm text-slate-500">{subjectInfo.name}</p>
                          </div>
                          <p className="text-sm text-slate-400">{activity.completed_at}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    {language === 'es' 
                      ? 'No hay actividad reciente' 
                      : 'No recent activity'}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <Brain className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {language === 'es' ? 'Selecciona un Estudiante' : 'Select a Student'}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {language === 'es' 
                  ? 'Elige un estudiante del menú superior para ver su progreso en el aprendizaje adaptativo.' 
                  : 'Choose a student from the dropdown above to view their adaptive learning progress.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default StudentProgress;
