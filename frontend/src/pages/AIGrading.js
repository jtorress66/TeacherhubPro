import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Brain, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Search,
  Filter,
  FileText,
  Users,
  Loader2,
  Sparkles,
  Eye,
  Check,
  X as XIcon,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AIGrading = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isEs = language === 'es';

  const [stats, setStats] = useState({
    total_assignments: 0,
    total_submissions: 0,
    pending_grading: 0,
    pending_review: 0,
    graded: 0
  });
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, pending_review, graded
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grading, setGrading] = useState(false);
  const [approving, setApproving] = useState(false);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, submissionsRes, assignmentsRes] = await Promise.all([
        fetch(`${API_URL}/api/ai-grading/stats`, { credentials: 'include' }),
        fetch(`${API_URL}/api/ai-grading/submissions`, { credentials: 'include' }),
        fetch(`${API_URL}/api/ai-grading/assignments`, { credentials: 'include' })
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
      if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(isEs ? 'Error al cargar datos' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  }, [isEs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get assignment title by ID
  const getAssignmentTitle = (assignmentId) => {
    const assignment = assignments.find(a => a.assignment_id === assignmentId);
    return assignment?.title || assignmentId;
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    const matchesFilter = filter === 'all' || sub.status === filter;
    const matchesSearch = 
      sub.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAssignmentTitle(sub.assignment_id).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // AI Grade a submission
  const handleAIGrade = async (submissionId, autoApprove = false) => {
    setGrading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-grading/submissions/${submissionId}/grade`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ auto_approve: autoApprove })
      });

      if (!res.ok) throw new Error('Grading failed');
      
      const result = await res.json();
      toast.success(isEs ? 'Calificación completada' : 'Grading complete');
      
      // Refresh data
      await fetchData();
      
      // If viewing this submission, update it
      if (selectedSubmission?.submission_id === submissionId) {
        const subRes = await fetch(`${API_URL}/api/ai-grading/submissions/${submissionId}`, {
          credentials: 'include'
        });
        if (subRes.ok) {
          const data = await subRes.json();
          setSelectedSubmission({ ...data.submission, assignment: data.assignment });
        }
      }
    } catch (error) {
      console.error('Grading error:', error);
      toast.error(isEs ? 'Error al calificar' : 'Grading failed');
    } finally {
      setGrading(false);
    }
  };

  // Approve/Adjust grade
  const handleApproveGrade = async (submissionId, finalScore, feedback) => {
    setApproving(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-grading/submissions/${submissionId}/approve`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          final_score: finalScore,
          teacher_feedback: feedback 
        })
      });

      if (!res.ok) throw new Error('Approval failed');
      
      toast.success(isEs ? 'Calificación aprobada' : 'Grade approved');
      await fetchData();
      setSelectedSubmission(null);
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(isEs ? 'Error al aprobar' : 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  // View submission details
  const handleViewSubmission = async (submissionId) => {
    try {
      const res = await fetch(`${API_URL}/api/ai-grading/submissions/${submissionId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSelectedSubmission({ ...data.submission, assignment: data.assignment });
    } catch (error) {
      console.error('Error:', error);
      toast.error(isEs ? 'Error al cargar detalles' : 'Error loading details');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: isEs ? 'Pendiente' : 'Pending' },
      grading: { color: 'bg-blue-100 text-blue-800', icon: Loader2, label: isEs ? 'Calificando' : 'Grading' },
      pending_review: { color: 'bg-purple-100 text-purple-800', icon: Eye, label: isEs ? 'Por Revisar' : 'Review' },
      graded: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: isEs ? 'Calificado' : 'Graded' },
      grading_failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: isEs ? 'Error' : 'Failed' }
    };
    const { color, icon: Icon, label } = config[status] || config.pending;
    return (
      <Badge className={cn('flex items-center gap-1', color)}>
        <Icon className={cn('w-3 h-3', status === 'grading' && 'animate-spin')} />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
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
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Brain className="w-7 h-7 text-violet-500" />
              {isEs ? 'Calificación con IA' : 'AI Grading'}
            </h1>
            <p className="text-slate-600 mt-1">
              {isEs 
                ? 'Revisa y califica tareas enviadas por estudiantes usando IA'
                : 'Review and grade student submissions using AI'}
            </p>
          </div>
          <Button 
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {isEs ? 'Actualizar' : 'Refresh'}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-violet-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-lg">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">{isEs ? 'Tareas' : 'Assignments'}</p>
                  <p className="text-2xl font-bold text-violet-700">{stats.total_assignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">{isEs ? 'Envíos' : 'Submissions'}</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total_submissions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">{isEs ? 'Pendientes' : 'Pending'}</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending_grading}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">{isEs ? 'Por Revisar' : 'To Review'}</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.pending_review}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">{isEs ? 'Calificados' : 'Graded'}</p>
                  <p className="text-2xl font-bold text-green-700">{stats.graded}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={isEs ? 'Buscar por estudiante o tarea...' : 'Search by student or assignment...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'pending_review', 'graded'].map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                {f === 'all' ? (isEs ? 'Todos' : 'All') :
                 f === 'pending' ? (isEs ? 'Pendientes' : 'Pending') :
                 f === 'pending_review' ? (isEs ? 'Por Revisar' : 'Review') :
                 (isEs ? 'Calificados' : 'Graded')}
              </Button>
            ))}
          </div>
        </div>

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {isEs ? 'Envíos de Estudiantes' : 'Student Submissions'}
            </CardTitle>
            <CardDescription>
              {isEs 
                ? `${filteredSubmissions.length} envíos encontrados`
                : `${filteredSubmissions.length} submissions found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>{isEs ? 'No hay envíos para mostrar' : 'No submissions to show'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubmissions.map((sub) => (
                  <div
                    key={sub.submission_id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-slate-900">{sub.student_name}</h4>
                        <StatusBadge status={sub.status} />
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {getAssignmentTitle(sub.assignment_id)}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {sub.final_score !== null && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{sub.final_score}</p>
                          <p className="text-xs text-slate-500">{isEs ? 'puntos' : 'points'}</p>
                        </div>
                      )}
                      {sub.ai_score !== null && sub.final_score === null && (
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">{sub.ai_score}</p>
                          <p className="text-xs text-slate-500">{isEs ? 'IA sugiere' : 'AI suggests'}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {sub.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleAIGrade(sub.submission_id)}
                            disabled={grading}
                            className="bg-violet-600 hover:bg-violet-700"
                          >
                            {grading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 mr-1" />
                                {isEs ? 'Calificar' : 'Grade'}
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewSubmission(sub.submission_id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {isEs ? 'Ver' : 'View'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Detail Modal */}
        {selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {selectedSubmission.student_name}
                  </CardTitle>
                  <CardDescription>
                    {selectedSubmission.assignment?.title || selectedSubmission.assignment_id}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSubmission(null)}
                >
                  <XIcon className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status and Score */}
                <div className="flex items-center gap-4">
                  <StatusBadge status={selectedSubmission.status} />
                  {selectedSubmission.ai_score !== null && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {isEs ? 'Puntuación IA' : 'AI Score'}: {selectedSubmission.ai_score}
                    </Badge>
                  )}
                  {selectedSubmission.final_score !== null && (
                    <Badge className="bg-green-100 text-green-800">
                      {isEs ? 'Puntuación Final' : 'Final Score'}: {selectedSubmission.final_score}
                    </Badge>
                  )}
                </div>

                {/* AI Feedback */}
                {selectedSubmission.ai_feedback && (
                  <div className="p-4 bg-violet-50 rounded-lg">
                    <h4 className="font-medium text-violet-800 mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      {isEs ? 'Retroalimentación de IA' : 'AI Feedback'}
                    </h4>
                    <p className="text-slate-700">{selectedSubmission.ai_feedback}</p>
                  </div>
                )}

                {/* Questions and Answers */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">
                    {isEs ? 'Respuestas del Estudiante' : 'Student Answers'}
                  </h4>
                  {selectedSubmission.assignment?.questions?.map((q, idx) => {
                    const answer = selectedSubmission.answers?.[q.question_id];
                    const qScore = selectedSubmission.ai_question_scores?.[q.question_id];
                    return (
                      <div key={q.question_id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="font-medium text-slate-900">
                            {idx + 1}. {q.question_text}
                          </p>
                          {qScore && (
                            <Badge className={qScore.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {qScore.score}/{qScore.max_points}
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-600 mt-2">
                          <span className="font-medium">{isEs ? 'Respuesta' : 'Answer'}:</span> {answer || (isEs ? 'Sin respuesta' : 'No answer')}
                        </p>
                        {qScore?.feedback && (
                          <p className="text-sm text-violet-600 mt-2 italic">
                            {qScore.feedback}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedSubmission.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => handleAIGrade(selectedSubmission.submission_id, false)}
                        disabled={grading}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        {grading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                        {isEs ? 'Calificar con IA' : 'Grade with AI'}
                      </Button>
                      <Button
                        onClick={() => handleAIGrade(selectedSubmission.submission_id, true)}
                        disabled={grading}
                        variant="outline"
                      >
                        {isEs ? 'Calificar y Aprobar Auto' : 'Grade & Auto-Approve'}
                      </Button>
                    </>
                  )}
                  {selectedSubmission.status === 'pending_review' && (
                    <Button
                      onClick={() => handleApproveGrade(
                        selectedSubmission.submission_id,
                        selectedSubmission.ai_score,
                        selectedSubmission.ai_feedback
                      )}
                      disabled={approving}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                      {isEs ? 'Aprobar Calificación IA' : 'Approve AI Grade'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSubmission(null)}
                  >
                    {isEs ? 'Cerrar' : 'Close'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AIGrading;
