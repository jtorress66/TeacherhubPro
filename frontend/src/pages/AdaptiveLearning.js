import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { 
  Brain, Sparkles, Target, TrendingUp, BookOpen, Calculator, 
  FileText, TreePine, Loader2, Play, CheckCircle2, Clock, 
  Award, Zap, ChevronRight, RefreshCw, Volume2, Download, Printer,
  BarChart3
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdaptiveLearning = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [learningPath, setLearningPath] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  const subjects = [
    { id: 'math', name: language === 'es' ? 'Matemáticas' : 'Mathematics', icon: Calculator, color: 'blue' },
    { id: 'language', name: language === 'es' ? 'Lenguaje' : 'Language Arts', icon: FileText, color: 'purple' },
    { id: 'science', name: language === 'es' ? 'Ciencias' : 'Science', icon: TreePine, color: 'green' },
    { id: 'reading', name: language === 'es' ? 'Lectura' : 'Reading', icon: BookOpen, color: 'amber' },
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/students`, { withCredentials: true });
      setStudents(res.data || []);
      if (res.data?.length > 0) {
        setSelectedStudent(res.data[0].student_id);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLearningPath = async () => {
    if (!selectedStudent) {
      toast.error(language === 'es' ? 'Seleccione un estudiante' : 'Select a student');
      return;
    }

    setGenerating(true);
    try {
      const res = await axios.post(`${API}/adaptive-learning/generate-path`, {
        student_id: selectedStudent,
        subject: selectedSubject,
        language: language
      }, { withCredentials: true });
      
      setLearningPath(res.data);
      toast.success(language === 'es' ? '¡Ruta de aprendizaje generada!' : 'Learning path generated!');
    } catch (error) {
      console.error('Error generating path:', error);
      toast.error(language === 'es' ? 'Error al generar ruta' : 'Error generating path');
    } finally {
      setGenerating(false);
    }
  };

  const startLesson = async (lesson) => {
    setCurrentLesson(lesson);
  };

  const speakText = async (text) => {
    setSpeaking(true);
    try {
      const res = await axios.post(`${API}/ai/tts`, {
        text: text,
        language: language
      }, { withCredentials: true, responseType: 'blob' });
      
      const audioUrl = URL.createObjectURL(res.data);
      const audio = new Audio(audioUrl);
      audio.onended = () => setSpeaking(false);
      audio.play();
    } catch (error) {
      console.error('TTS error:', error);
      setSpeaking(false);
    }
  };

  const markLessonComplete = async (lessonId) => {
    try {
      await axios.post(`${API}/adaptive-learning/complete-lesson`, {
        student_id: selectedStudent,
        lesson_id: lessonId,
        subject: selectedSubject
      }, { withCredentials: true });
      
      // Update local state
      if (learningPath) {
        setLearningPath({
          ...learningPath,
          lessons: learningPath.lessons.map(l => 
            l.id === lessonId ? { ...l, completed: true } : l
          )
        });
      }
      
      setCurrentLesson(null);
      toast.success(language === 'es' ? '¡Lección completada!' : 'Lesson completed!');
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const getSubjectColor = (subject) => {
    const colors = {
      math: 'bg-blue-100 text-blue-700 border-blue-200',
      language: 'bg-purple-100 text-purple-700 border-purple-200',
      science: 'bg-green-100 text-green-700 border-green-200',
      reading: 'bg-amber-100 text-amber-700 border-amber-200',
    };
    return colors[subject] || colors.math;
  };

  // PDF Download function for entire learning path
  const downloadLearningPathPDF = () => {
    if (!learningPath) return;
    
    const student = students.find(s => s.student_id === selectedStudent);
    const studentName = student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Student';
    const subjectInfo = subjects.find(s => s.id === selectedSubject);
    const subjectName = subjectInfo?.name || selectedSubject;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${learningPath.title} - ${studentName}</title>
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
            padding-bottom: 20px;
            border-bottom: 3px solid #a855f7;
          }
          .header h1 { 
            color: #7c3aed; 
            font-size: 28px; 
            margin-bottom: 8px;
          }
          .header p { color: #64748b; font-size: 14px; }
          .meta-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
          }
          .meta-item { text-align: center; }
          .meta-item .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .meta-item .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .lesson {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            page-break-inside: avoid;
          }
          .lesson-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 15px;
          }
          .lesson-number {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
          }
          .lesson-title { font-size: 18px; font-weight: 600; color: #1e293b; }
          .lesson-objective { 
            color: #64748b; 
            font-size: 14px; 
            margin-bottom: 15px;
            padding-left: 44px;
          }
          .lesson-content {
            background: #faf5ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          .lesson-content h4 { font-size: 14px; color: #7c3aed; margin-bottom: 8px; }
          .lesson-content p { font-size: 14px; color: #374151; }
          .questions {
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
          }
          .questions h4 { font-size: 14px; color: #2563eb; margin-bottom: 10px; }
          .question { margin-bottom: 12px; }
          .question p { font-weight: 500; margin-bottom: 6px; }
          .options { padding-left: 20px; }
          .options li { font-size: 13px; color: #475569; margin-bottom: 4px; }
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
            font-size: 14px;
          }
          .print-btn:hover { background: #6d28d9; }
          @media print {
            .print-btn { display: none; }
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ ${language === 'es' ? 'Imprimir / Guardar PDF' : 'Print / Save PDF'}</button>
        
        <div class="header">
          <h1>🧠 ${learningPath.title}</h1>
          <p>${learningPath.description || ''}</p>
        </div>
        
        <div class="meta-info">
          <div class="meta-item">
            <div class="label">${language === 'es' ? 'Estudiante' : 'Student'}</div>
            <div class="value">${studentName}</div>
          </div>
          <div class="meta-item">
            <div class="label">${language === 'es' ? 'Materia' : 'Subject'}</div>
            <div class="value">${subjectName}</div>
          </div>
          <div class="meta-item">
            <div class="label">${language === 'es' ? 'Nivel' : 'Level'}</div>
            <div class="value">${learningPath.level || 1}</div>
          </div>
        </div>
        
        ${learningPath.lessons?.map((lesson, idx) => `
          <div class="lesson">
            <div class="lesson-header">
              <div class="lesson-number">${idx + 1}</div>
              <div class="lesson-title">${lesson.title}</div>
            </div>
            <div class="lesson-objective">📎 ${lesson.objective || ''}</div>
            
            ${lesson.content ? `
              <div class="lesson-content">
                <h4>${language === 'es' ? 'Contenido' : 'Content'}</h4>
                <p>${lesson.content.replace(/\n/g, '<br>')}</p>
              </div>
            ` : ''}
            
            ${lesson.questions?.length ? `
              <div class="questions">
                <h4>✏️ ${language === 'es' ? 'Práctica' : 'Practice'}</h4>
                ${lesson.questions.map((q, qIdx) => `
                  <div class="question">
                    <p>${qIdx + 1}. ${q.question}</p>
                    ${q.options ? `
                      <ul class="options">
                        ${q.options.map((opt, oIdx) => `<li>${String.fromCharCode(65 + oIdx)}) ${opt}</li>`).join('')}
                      </ul>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        <div class="footer">
          <p>📚 ${language === 'es' ? 'Generado por' : 'Generated by'} TeacherHubPro - ${language === 'es' ? 'Aprendizaje Adaptativo' : 'Adaptive Learning'}</p>
          <p>${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // PDF Download for single lesson (offline access)
  const downloadLessonPDF = (lesson) => {
    const student = students.find(s => s.student_id === selectedStudent);
    const studentName = student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Student';
    const subjectInfo = subjects.find(s => s.id === selectedSubject);
    const subjectName = subjectInfo?.name || selectedSubject;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${lesson.title} - ${studentName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 40px; 
            color: #1e293b;
            line-height: 1.7;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            padding: 30px;
            background: linear-gradient(135deg, #a855f7, #ec4899);
            border-radius: 16px;
            color: white;
          }
          .header h1 { font-size: 28px; margin-bottom: 8px; }
          .header p { opacity: 0.9; font-size: 16px; }
          .meta {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
          }
          .meta-item { text-align: center; }
          .meta-item .label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .meta-item .value { font-size: 16px; font-weight: 600; color: #1e293b; }
          .content-section {
            margin-bottom: 30px;
            padding: 25px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
          }
          .content-section h2 {
            font-size: 18px;
            color: #7c3aed;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9d5ff;
          }
          .content-section p { font-size: 15px; color: #374151; }
          .questions-section {
            background: #eff6ff;
            padding: 25px;
            border-radius: 12px;
          }
          .questions-section h2 { color: #2563eb; margin-bottom: 20px; }
          .question {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          .question p { font-weight: 500; margin-bottom: 10px; }
          .options { padding-left: 20px; list-style: none; }
          .options li { 
            padding: 8px 0; 
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
          }
          .options li:last-child { border-bottom: none; }
          .footer {
            margin-top: 40px;
            text-align: center;
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
        <button class="print-btn" onclick="window.print()">🖨️ ${language === 'es' ? 'Imprimir / Guardar PDF' : 'Print / Save PDF'}</button>
        
        <div class="header">
          <h1>📖 ${lesson.title}</h1>
          <p>${lesson.objective || ''}</p>
        </div>
        
        <div class="meta">
          <div class="meta-item">
            <div class="label">${language === 'es' ? 'Estudiante' : 'Student'}</div>
            <div class="value">${studentName}</div>
          </div>
          <div class="meta-item">
            <div class="label">${language === 'es' ? 'Materia' : 'Subject'}</div>
            <div class="value">${subjectName}</div>
          </div>
          <div class="meta-item">
            <div class="label">${language === 'es' ? 'Duración' : 'Duration'}</div>
            <div class="value">${lesson.duration || '15 min'}</div>
          </div>
        </div>
        
        <div class="content-section">
          <h2>📚 ${language === 'es' ? 'Contenido de la Lección' : 'Lesson Content'}</h2>
          <p>${lesson.content?.replace(/\n/g, '<br>') || ''}</p>
        </div>
        
        ${lesson.questions?.length ? `
          <div class="questions-section">
            <h2>✏️ ${language === 'es' ? 'Preguntas de Práctica' : 'Practice Questions'}</h2>
            ${lesson.questions.map((q, idx) => `
              <div class="question">
                <p>${idx + 1}. ${q.question}</p>
                ${q.options ? `
                  <ul class="options">
                    ${q.options.map((opt, oIdx) => `<li>○ ${String.fromCharCode(65 + oIdx)}) ${opt}</li>`).join('')}
                  </ul>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>📚 ${language === 'es' ? 'Material generado por' : 'Material generated by'} TeacherHubPro</p>
          <p>${language === 'es' ? 'Para uso sin conexión' : 'For offline use'} - ${new Date().toLocaleDateString()}</p>
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800 flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-600" />
              {language === 'es' ? 'Aprendizaje Adaptativo' : 'Adaptive Learning'}
            </h1>
            <p className="text-slate-500 mt-1">
              {language === 'es' 
                ? 'IA que se adapta al ritmo de aprendizaje de cada estudiante' 
                : 'AI that adapts to each student\'s learning pace'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/student-progress')}
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
              data-testid="view-progress-dashboard"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Ver Progreso' : 'View Progress'}
            </Button>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Impulsado por IA' : 'AI-Powered'}
            </Badge>
          </div>
        </div>

        {/* Selection Panel */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'es' ? 'Configurar Ruta de Aprendizaje' : 'Configure Learning Path'}</CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Seleccione estudiante y materia para generar una ruta personalizada' 
                : 'Select student and subject to generate a personalized path'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Student Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  {language === 'es' ? 'Estudiante' : 'Student'}
                </label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar' : 'Select'} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(s => (
                      <SelectItem key={s.student_id} value={s.student_id}>
                        {s.name || `${s.first_name} ${s.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  {language === 'es' ? 'Materia' : 'Subject'}
                </label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center gap-2">
                          <s.icon className="h-4 w-4" />
                          {s.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <div className="flex items-end">
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={generateLearningPath}
                  disabled={generating || !selectedStudent}
                >
                  {generating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {language === 'es' ? 'Generando...' : 'Generating...'}</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> {language === 'es' ? 'Generar Ruta' : 'Generate Path'}</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Path Display */}
        {learningPath && !currentLesson && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {learningPath.title}
                    </h3>
                    <p className="text-slate-600 text-sm">{learningPath.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={downloadLearningPathPDF}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                      data-testid="download-learning-path-pdf"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Descargar PDF' : 'Download PDF'}
                    </Button>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {learningPath.lessons?.filter(l => l.completed).length || 0}/{learningPath.lessons?.length || 0}
                      </p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Completado' : 'Completed'}</p>
                    </div>
                  </div>
                </div>
                <Progress 
                  value={(learningPath.lessons?.filter(l => l.completed).length / learningPath.lessons?.length) * 100 || 0} 
                  className="h-3"
                />
              </CardContent>
            </Card>

            {/* Lessons Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {learningPath.lessons?.map((lesson, idx) => (
                <Card 
                  key={lesson.id || idx} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${lesson.completed ? 'bg-green-50 border-green-200' : ''}`}
                  onClick={() => !lesson.completed && startLesson(lesson)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${lesson.completed ? 'bg-green-100' : 'bg-slate-100'}`}>
                          {lesson.completed ? (
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                          ) : (
                            <Target className="h-6 w-6 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{lesson.title}</h4>
                          <p className="text-sm text-slate-500 mt-1">{lesson.objective}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="outline" className={getSubjectColor(selectedSubject)}>
                              <Clock className="h-3 w-3 mr-1" />
                              {lesson.duration || '15 min'}
                            </Badge>
                            <Badge variant="outline" className="bg-slate-50">
                              {language === 'es' ? `Nivel ${lesson.level || idx + 1}` : `Level ${lesson.level || idx + 1}`}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {!lesson.completed && (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Current Lesson View */}
        {currentLesson && (
          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{currentLesson.title}</CardTitle>
                  <CardDescription>{currentLesson.objective}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => downloadLessonPDF(currentLesson)}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    data-testid="download-lesson-pdf"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'PDF' : 'PDF'}
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentLesson(null)}>
                    {language === 'es' ? 'Volver' : 'Back'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Lesson Content */}
              <div className="prose max-w-none">
                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-800">
                      {language === 'es' ? 'Contenido de la Lección' : 'Lesson Content'}
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => speakText(currentLesson.content)}
                      disabled={speaking}
                    >
                      <Volume2 className={`h-4 w-4 mr-2 ${speaking ? 'animate-pulse' : ''}`} />
                      {language === 'es' ? 'Escuchar' : 'Listen'}
                    </Button>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{currentLesson.content}</p>
                </div>
              </div>

              {/* Practice Questions */}
              {currentLesson.questions && (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    {language === 'es' ? 'Práctica' : 'Practice'}
                  </h4>
                  <div className="space-y-4">
                    {currentLesson.questions.map((q, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4">
                        <p className="font-medium text-slate-800 mb-2">{q.question}</p>
                        {q.options && (
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => (
                              <Button 
                                key={optIdx} 
                                variant="outline" 
                                className="justify-start"
                              >
                                {opt}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  onClick={() => markLessonComplete(currentLesson.id)}
                >
                  <Award className="h-5 w-5 mr-2" />
                  {language === 'es' ? 'Marcar como Completado' : 'Mark as Complete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!learningPath && !loading && (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              <Brain className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">
                {language === 'es' ? 'Comienza el Aprendizaje Adaptativo' : 'Start Adaptive Learning'}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                {language === 'es' 
                  ? 'Selecciona un estudiante y materia, luego genera una ruta de aprendizaje personalizada con IA.' 
                  : 'Select a student and subject, then generate a personalized AI-powered learning path.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdaptiveLearning;
