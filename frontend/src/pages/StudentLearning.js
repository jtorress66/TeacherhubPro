import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { 
  Brain, BookOpen, Calculator, FileText, TreePine, Loader2, 
  CheckCircle2, Clock, Award, Target, ChevronRight, Volume2, 
  ArrowLeft, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${window.location.origin}/api`;

const StudentLearning = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswerFeedback, setShowAnswerFeedback] = useState({});
  const [speaking, setSpeaking] = useState(false);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    fetchLearningData();
  }, [token]);

  const fetchLearningData = async () => {
    try {
      const res = await axios.get(`${API}/student-learning/${token}`);
      setData(res.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching learning data:', error);
      setError(error.response?.data?.detail || 'Error loading learning path');
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text) => {
    setSpeaking(true);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      speechSynthesis.speak(utterance);
    } else {
      setSpeaking(false);
      toast.error('Audio not available');
    }
  };

  const startLesson = (lesson) => {
    setCurrentLesson(lesson);
    setSelectedAnswers({});
    setShowAnswerFeedback({});
  };

  const handleAnswerSelect = (questionIdx, optionIdx, correctAnswer) => {
    const selectedOption = currentLesson.questions[questionIdx].options[optionIdx];
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIdx]: optionIdx
    });
    
    const isCorrect = selectedOption === correctAnswer;
    setShowAnswerFeedback({
      ...showAnswerFeedback,
      [questionIdx]: { selected: optionIdx, isCorrect }
    });
  };

  const markLessonComplete = async (lessonId) => {
    try {
      await axios.post(`${API}/student-learning/${token}/complete-lesson`, {
        lesson_id: lessonId
      });
      
      // Update local state
      if (data?.learning_path) {
        setData({
          ...data,
          learning_path: {
            ...data.learning_path,
            lessons: data.learning_path.lessons.map(l => 
              l.id === lessonId ? { ...l, completed: true } : l
            )
          }
        });
      }
      
      setCurrentLesson(null);
      toast.success(language === 'es' ? '¡Lección completada!' : 'Lesson completed!');
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error(language === 'es' ? 'Error al guardar progreso' : 'Error saving progress');
    }
  };

  const getSubjectIcon = (subject) => {
    const icons = {
      math: Calculator,
      language: BookOpen,
      science: TreePine,
      reading: FileText
    };
    return icons[subject] || Brain;
  };

  const getSubjectColor = (subject) => {
    const colors = {
      math: 'bg-blue-100 text-blue-700',
      language: 'bg-purple-100 text-purple-700',
      science: 'bg-green-100 text-green-700',
      reading: 'bg-amber-100 text-amber-700',
    };
    return colors[subject] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">😕</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {language === 'es' ? 'Enlace no válido' : 'Invalid Link'}
            </h2>
            <p className="text-slate-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const learningPath = data?.learning_path;
  const student = data?.student;
  const subject = data?.subject;
  const SubjectIcon = getSubjectIcon(subject);

  // Current lesson view
  if (currentLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Button 
            variant="outline" 
            onClick={() => setCurrentLesson(null)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Volver' : 'Back'}
          </Button>

          <Card className="border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-white">{currentLesson.title}</CardTitle>
                  <CardDescription className="text-white/80">{currentLesson.objective}</CardDescription>
                </div>
                <Badge className="bg-white/20 text-white">
                  <Clock className="h-3 w-3 mr-1" />
                  {currentLesson.duration || '15 min'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Lesson Content */}
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-slate-800">
                    {language === 'es' ? '📚 Contenido' : '📚 Content'}
                  </h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => speakText(currentLesson.content)}
                    disabled={speaking}
                    className="border-purple-200 text-purple-600"
                  >
                    <Volume2 className={`h-4 w-4 mr-2 ${speaking ? 'animate-pulse' : ''}`} />
                    {language === 'es' ? 'Escuchar' : 'Listen'}
                  </Button>
                </div>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{currentLesson.content}</p>
              </div>

              {/* Practice Questions */}
              {currentLesson.questions && currentLesson.questions.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                  <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    {language === 'es' ? '✏️ Práctica' : '✏️ Practice'}
                  </h4>
                  <div className="space-y-6">
                    {currentLesson.questions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <p className="font-medium text-slate-800 flex-1">{qIdx + 1}. {q.question}</p>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => speakText(q.question)}
                            disabled={speaking}
                          >
                            <Volume2 className={`h-4 w-4 ${speaking ? 'animate-pulse text-purple-500' : 'text-slate-400'}`} />
                          </Button>
                        </div>
                        {q.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedAnswers[qIdx] === optIdx;
                              const feedback = showAnswerFeedback[qIdx];
                              const showResult = feedback && feedback.selected === optIdx;
                              const isCorrect = opt === q.correct_answer;
                              
                              return (
                                <Button 
                                  key={optIdx} 
                                  variant="outline" 
                                  className={`justify-start text-left h-auto py-3 px-4 transition-all ${
                                    showResult
                                      ? isCorrect
                                        ? 'bg-green-100 border-green-500 text-green-700 ring-2 ring-green-500'
                                        : 'bg-red-100 border-red-500 text-red-700 ring-2 ring-red-500'
                                      : isSelected
                                        ? 'bg-purple-100 border-purple-500 text-purple-700 ring-2 ring-purple-400'
                                        : feedback && isCorrect
                                        ? 'bg-green-50 border-green-300 text-green-700'
                                        : 'hover:bg-slate-50 hover:border-purple-300'
                                  }`}
                                  onClick={() => !feedback && handleAnswerSelect(qIdx, optIdx, q.correct_answer)}
                                  disabled={!!feedback}
                                >
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0 ${
                                    showResult
                                      ? isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                      : isSelected ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <span className="flex-1">{opt}</span>
                                  {showResult && isCorrect && <CheckCircle2 className="h-5 w-5 ml-2 text-green-600" />}
                                </Button>
                              );
                            })}
                          </div>
                        )}
                        {showAnswerFeedback[qIdx] && (
                          <p className={`mt-3 text-sm font-medium ${
                            showAnswerFeedback[qIdx].isCorrect ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {showAnswerFeedback[qIdx].isCorrect 
                              ? (language === 'es' ? '¡Correcto! 🎉' : 'Correct! 🎉')
                              : (language === 'es' ? `Incorrecto. La respuesta es: ${q.correct_answer}` : `Incorrect. The answer is: ${q.correct_answer}`)}
                          </p>
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
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 px-8"
                  onClick={() => markLessonComplete(currentLesson.id)}
                >
                  <Award className="h-5 w-5 mr-2" />
                  {language === 'es' ? 'Marcar como Completado' : 'Mark as Complete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main learning path view
  const completedCount = learningPath?.lessons?.filter(l => l.completed).length || 0;
  const totalLessons = learningPath?.lessons?.length || 0;
  const progressPercent = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <SubjectIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {language === 'es' ? '¡Hola' : 'Hello'}, {student?.name || 'Student'}! 👋
                </h1>
                <p className="text-white/80">{learningPath?.title || 'Learning Path'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
                  <span>{completedCount}/{totalLessons}</span>
                </div>
                <Progress value={progressPercent} className="h-3 bg-white/20" />
              </div>
              <Badge className="bg-white/20 text-white text-lg px-4 py-2">
                {Math.round(progressPercent)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Language Toggle */}
        <div className="flex justify-end gap-2">
          <Button 
            variant={language === 'es' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('es')}
          >
            🇪🇸 Español
          </Button>
          <Button 
            variant={language === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLanguage('en')}
          >
            🇺🇸 English
          </Button>
        </div>

        {/* Lessons Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {learningPath?.lessons?.map((lesson, idx) => (
            <Card 
              key={lesson.id || idx} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                lesson.completed ? 'bg-green-50 border-green-200' : 'hover:border-purple-300'
              }`}
              onClick={() => !lesson.completed && startLesson(lesson)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${lesson.completed ? 'bg-green-100' : 'bg-slate-100'}`}>
                    {lesson.completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <Target className="h-6 w-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {language === 'es' ? `Lección ${idx + 1}` : `Lesson ${idx + 1}`}
                        </Badge>
                        <h4 className="font-semibold text-slate-800">{lesson.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{lesson.objective}</p>
                      </div>
                      {!lesson.completed && (
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline" className={getSubjectColor(subject)}>
                        <Clock className="h-3 w-3 mr-1" />
                        {lesson.duration || '15 min'}
                      </Badge>
                      {lesson.completed && (
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {language === 'es' ? 'Completado' : 'Completed'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completion Message */}
        {progressPercent === 100 && (
          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-8 text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h2 className="text-2xl font-bold mb-2">
                {language === 'es' ? '¡Felicitaciones!' : 'Congratulations!'}
              </h2>
              <p className="text-white/90">
                {language === 'es' 
                  ? 'Has completado todas las lecciones de esta ruta de aprendizaje.' 
                  : 'You have completed all lessons in this learning path.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-slate-400 text-sm">
          <p>Powered by TeacherHubPro 📚</p>
        </div>
      </div>
    </div>
  );
};

export default StudentLearning;
