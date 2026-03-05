import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Gamepad2, Plus, Play, Users, Zap, Brain, Trophy, Target, Sparkles,
  Clock, Settings, Trash2, Copy, ExternalLink, BarChart3, Loader2,
  ChevronRight, Hash, RefreshCw, CheckCircle2, StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const API = `${window.location.origin}/api`;

const PlayToLearnTeacher = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  
  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  
  // Sessions
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  
  // Create assignment form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    subject: '',
    grade_level: '',
    topic: '',
    standard: '',
    difficulty: 'medium',
    item_count: 10,
    allowed_game_types: ['quiz', 'time_attack', 'matching', 'flashcard', 'true_false', 'fill_blank', 'word_search', 'memory'],
    language: 'en'
  });
  
  // Host session
  const [hostingAssignment, setHostingAssignment] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState('quiz');
  const [selectedMode, setSelectedMode] = useState('LIVE');
  const [creatingSession, setCreatingSession] = useState(false);
  
  // Share link dialog
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareInfo, setShareInfo] = useState(null);
  
  // Insights
  const [selectedInsightAssignment, setSelectedInsightAssignment] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Update language when user loads
  useEffect(() => {
    if (user?.language) {
      setLanguage(user.language);
    }
  }, [user]);

  useEffect(() => {
    // Only fetch when auth is done loading and user exists
    if (!authLoading && user) {
      fetchAssignments();
      fetchSessions();
    } else if (!authLoading && !user) {
      // Not logged in - stop loading
      setLoadingAssignments(false);
      setLoadingSessions(false);
    }
  }, [authLoading, user]);

  const fetchAssignments = async () => {
    try {
      const res = await axios.get(`${API}/play-to-learn/assignments`, { withCredentials: true });
      setAssignments(res.data.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/play-to-learn/teacher/sessions`, { withCredentials: true });
      setSessions(res.data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const createAssignment = async () => {
    if (!newAssignment.subject || !newAssignment.grade_level || !newAssignment.topic) {
      toast.error(language === 'es' ? 'Completa los campos requeridos' : 'Complete required fields');
      return;
    }

    setCreating(true);
    try {
      await axios.post(`${API}/play-to-learn/assignments`, newAssignment, { withCredentials: true });
      toast.success(language === 'es' ? '¡Asignación creada!' : 'Assignment created!');
      setShowCreateForm(false);
      setNewAssignment({
        subject: '',
        grade_level: '',
        topic: '',
        standard: '',
        difficulty: 'medium',
        item_count: 10,
        allowed_game_types: ['quiz', 'time_attack', 'matching', 'flashcard'],
        language: 'es'
      });
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error creating assignment');
    } finally {
      setCreating(false);
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar esta asignación?' : 'Delete this assignment?')) {
      return;
    }

    try {
      await axios.delete(`${API}/play-to-learn/assignments/${assignmentId}`, { withCredentials: true });
      toast.success(language === 'es' ? 'Asignación eliminada' : 'Assignment deleted');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error deleting assignment');
    }
  };

  const fetchInsights = async (assignmentId) => {
    setLoadingInsights(true);
    try {
      const res = await axios.get(`${API}/play-to-learn/insights/${assignmentId}`, { withCredentials: true });
      setInsights(res.data);
      setSelectedInsightAssignment(assignmentId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error fetching insights');
    } finally {
      setLoadingInsights(false);
    }
  };

  const createSession = async (assignment) => {
    setCreatingSession(true);
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions`, {
        assignment_id: assignment.assignment_id,
        game_type: selectedGameType,
        mode: selectedMode
      }, { withCredentials: true });

      toast.success(language === 'es' ? '¡Sesión creada!' : 'Session created!');
      
      // Log for anti-repeat verification
      console.log('[Play to Learn] Session Created:');
      console.log('  session_id:', res.data.session_id);
      console.log('  question_set_id:', res.data.question_set_id);
      console.log('  variant_seed:', res.data.variant_seed);
      console.log('  item_ids:', res.data.item_ids?.slice(0, 3), '...');
      
      if (selectedMode === 'LIVE') {
        // Navigate to host dashboard
        navigate(`/teacher/play-to-learn/host/${res.data.session_id}`);
      } else {
        // For self-paced, show the share dialog
        const joinUrl = `${window.location.origin}/play-to-learn/game/${res.data.session_id}`;
        setShareInfo({
          sessionId: res.data.session_id,
          joinUrl: joinUrl,
          pin: res.data.join_pin,
          gameType: selectedGameType,
          topic: assignment.topic
        });
        setShowShareDialog(true);
        fetchSessions();
      }
      
      setHostingAssignment(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error creating session');
    } finally {
      setCreatingSession(false);
    }
  };

  const copyJoinLink = (sessionId, pin) => {
    const url = pin 
      ? `${window.location.origin}/play-to-learn?pin=${pin}`
      : `${window.location.origin}/play-to-learn/game/${sessionId}`;
    navigator.clipboard.writeText(url);
    toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar esta sesión?' : 'Delete this session?')) {
      return;
    }

    try {
      await axios.delete(`${API}/play-to-learn/sessions/${sessionId}`, { withCredentials: true });
      toast.success(language === 'es' ? 'Sesión eliminada' : 'Session deleted');
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error deleting session');
    }
  };

  const closeSession = async (sessionId) => {
    if (!window.confirm(language === 'es' ? '¿Cerrar esta sesión?' : 'Close this session?')) {
      return;
    }

    try {
      await axios.post(`${API}/play-to-learn/sessions/${sessionId}/close`, {}, { withCredentials: true });
      toast.success(language === 'es' ? 'Sesión cerrada' : 'Session closed');
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error closing session');
    }
  };

  const gameModeIcons = {
    quiz: Brain,
    time_attack: Zap,
    matching: Target,
    flashcard: Sparkles,
    true_false: CheckCircle2,
    fill_blank: Hash,
    sequence: BarChart3,
    word_search: Target,
    memory: Brain
  };

  const gameModeNames = {
    quiz: language === 'es' ? 'Quiz Clásico' : 'Classic Quiz',
    time_attack: language === 'es' ? 'Ataque de Tiempo' : 'Time Attack',
    matching: language === 'es' ? 'Emparejamiento' : 'Matching',
    flashcard: language === 'es' ? 'Tarjetas Flash' : 'Flashcards',
    true_false: language === 'es' ? 'Verdadero/Falso' : 'True/False',
    fill_blank: language === 'es' ? 'Completar' : 'Fill in Blank',
    sequence: language === 'es' ? 'Ordenar' : 'Sequence',
    word_search: language === 'es' ? 'Sopa de Letras' : 'Word Search',
    memory: language === 'es' ? 'Memoria' : 'Memory Game'
  };

  const statusColors = {
    LOBBY: 'bg-yellow-500',
    ACTIVE: 'bg-green-500',
    COMPLETE: 'bg-slate-500'
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Gamepad2 className="h-7 w-7 text-purple-600" />
              {language === 'es' ? 'Jugar y Aprender' : 'Play to Learn'}
            </h1>
            <p className="text-slate-500">
              {language === 'es' 
                ? 'Crea y gestiona experiencias de juego interactivas'
                : 'Create and manage interactive game experiences'}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === 'es' ? 'Nueva Asignación' : 'New Assignment'}
          </Button>
        </div>

        {/* Quick Start Guide - Updated for clarity */}
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">1</div>
                <span>{language === 'es' ? 'Crear Asignación' : 'Create Assignment'}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-purple-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">2</div>
                <span>{language === 'es' ? 'Iniciar Sesión' : 'Start Session'}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-purple-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">3</div>
                <span>{language === 'es' ? 'Compartir PIN/Enlace' : 'Share PIN/Link'}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-purple-400" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">✓</div>
                <span>{language === 'es' ? '¡Estudiantes Juegan!' : 'Students Play!'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assignments">
              {language === 'es' ? 'Asignaciones' : 'Assignments'}
            </TabsTrigger>
            <TabsTrigger value="sessions">
              {language === 'es' ? 'Sesiones' : 'Sessions'}
            </TabsTrigger>
            <TabsTrigger value="insights">
              {language === 'es' ? 'Estadísticas' : 'Insights'}
            </TabsTrigger>
          </TabsList>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            {loadingAssignments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : assignments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gamepad2 className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">
                    {language === 'es' ? 'No hay asignaciones' : 'No assignments yet'}
                  </h3>
                  <p className="text-slate-400 mb-4">
                    {language === 'es' 
                      ? 'Crea tu primera asignación de práctica'
                      : 'Create your first practice assignment'}
                  </p>
                  <Button onClick={() => setShowCreateForm(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Crear Asignación' : 'Create Assignment'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignments.map((assignment) => (
                  <Card key={assignment.assignment_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{assignment.topic}</CardTitle>
                          <p className="text-sm text-slate-500">
                            {assignment.subject} • {assignment.grade_level}
                          </p>
                        </div>
                        <Badge variant="outline">{assignment.difficulty}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {assignment.allowed_game_types?.map((type) => {
                          const Icon = gameModeIcons[type] || Brain;
                          return (
                            <Badge key={type} variant="secondary" className="text-xs">
                              <Icon className="h-3 w-3 mr-1" />
                              {gameModeNames[type]}
                            </Badge>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{assignment.item_count} {language === 'es' ? 'preguntas' : 'questions'}</span>
                        <span>{new Date(assignment.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => setHostingAssignment(assignment)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          {language === 'es' ? 'Iniciar' : 'Start'}
                        </Button>
                        <Button
                          onClick={() => deleteAssignment(assignment.assignment_id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            {loadingSessions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-600">
                    {language === 'es' ? 'No hay sesiones' : 'No sessions yet'}
                  </h3>
                  <p className="text-slate-400">
                    {language === 'es' 
                      ? 'Las sesiones aparecerán aquí cuando inicies un juego'
                      : 'Sessions will appear here when you start a game'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => {
                  const Icon = gameModeIcons[session.game_type] || Brain;
                  return (
                    <Card key={session.session_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{gameModeNames[session.game_type]}</span>
                                <Badge className={statusColors[session.status]}>{session.status}</Badge>
                                <Badge variant="outline">{session.mode}</Badge>
                              </div>
                              <p className="text-sm text-slate-500">
                                {session.participants?.length || 0} {language === 'es' ? 'participantes' : 'participants'}
                                {session.join_pin && (
                                  <span className="ml-2">
                                    <Hash className="h-3 w-3 inline" /> PIN: {session.join_pin}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {session.status === 'LOBBY' && (
                              <Button
                                onClick={() => navigate(`/teacher/play-to-learn/host/${session.session_id}`)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Users className="h-4 w-4 mr-1" />
                                {language === 'es' ? 'Ver Lobby' : 'View Lobby'}
                              </Button>
                            )}
                            {session.status === 'ACTIVE' && (
                              <Button
                                onClick={() => closeSession(session.session_id)}
                                size="sm"
                                variant="outline"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <StopCircle className="h-4 w-4 mr-1" />
                                {language === 'es' ? 'Cerrar' : 'Close'}
                              </Button>
                            )}
                            <Button
                              onClick={() => copyJoinLink(session.session_id, session.join_pin)}
                              variant="outline"
                              size="sm"
                              title={language === 'es' ? 'Copiar enlace' : 'Copy link'}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {session.status !== 'COMPLETE' && (
                              <Button
                                onClick={() => navigate(`/teacher/play-to-learn/host/${session.session_id}`)}
                                variant="outline"
                                size="sm"
                                title={language === 'es' ? 'Abrir' : 'Open'}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteSession(session.session_id)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title={language === 'es' ? 'Eliminar' : 'Delete'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="space-y-6">
              {/* Assignment Selector */}
              <Card>
                <CardContent className="pt-6">
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {language === 'es' ? 'Selecciona una Asignación' : 'Select an Assignment'}
                  </label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedInsightAssignment || ''} 
                      onValueChange={(value) => fetchInsights(value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={language === 'es' ? 'Elegir asignación...' : 'Choose assignment...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments.map((a) => (
                          <SelectItem key={a.assignment_id} value={a.assignment_id}>
                            {a.topic} ({a.subject})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedInsightAssignment && (
                      <Button 
                        variant="outline" 
                        onClick={() => fetchInsights(selectedInsightAssignment)}
                        disabled={loadingInsights}
                      >
                        <RefreshCw className={`h-4 w-4 ${loadingInsights ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Insights Display */}
              {loadingInsights ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-purple-500" />
                    <p className="mt-2 text-slate-500">{language === 'es' ? 'Cargando...' : 'Loading...'}</p>
                  </CardContent>
                </Card>
              ) : insights ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                      <CardContent className="pt-6 text-center">
                        <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                        <div className="text-3xl font-bold text-purple-700">{insights.total_participants}</div>
                        <p className="text-purple-600 text-sm">{language === 'es' ? 'Participantes' : 'Participants'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <CardContent className="pt-6 text-center">
                        <Gamepad2 className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                        <div className="text-3xl font-bold text-blue-700">{insights.total_sessions}</div>
                        <p className="text-blue-600 text-sm">{language === 'es' ? 'Sesiones' : 'Sessions'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
                      <CardContent className="pt-6 text-center">
                        <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                        <div className="text-3xl font-bold text-green-700">{insights.total_answers}</div>
                        <p className="text-green-600 text-sm">{language === 'es' ? 'Respuestas' : 'Answers'}</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                      <CardContent className="pt-6 text-center">
                        <Trophy className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                        <div className="text-3xl font-bold text-yellow-700">{insights.overall_accuracy_percent}%</div>
                        <p className="text-yellow-600 text-sm">{language === 'es' ? 'Precisión' : 'Accuracy'}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Game Type Breakdown */}
                  {insights.game_type_breakdown && Object.keys(insights.game_type_breakdown).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {language === 'es' ? 'Modos de Juego Usados' : 'Game Modes Used'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(insights.game_type_breakdown).map(([mode, count]) => (
                            <Badge key={mode} variant="secondary" className="px-3 py-1">
                              {mode.replace('_', ' ').toUpperCase()}: {count} {language === 'es' ? 'sesiones' : 'sessions'}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Most Missed Items */}
                  {insights.most_missed_items && insights.most_missed_items.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Target className="h-5 w-5 text-red-500" />
                          {language === 'es' ? 'Preguntas Más Difíciles' : 'Most Challenging Questions'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {insights.most_missed_items.map((item, idx) => (
                            <div key={item.item_id} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                              <span className="text-sm text-slate-700">
                                {language === 'es' ? 'Pregunta' : 'Question'} {item.item_id.slice(-4)}
                              </span>
                              <Badge variant="destructive">
                                {item.miss_count} {language === 'es' ? 'errores' : 'misses'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* No Data State */}
                  {insights.total_participants === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <BarChart3 className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                        <p className="text-slate-500">
                          {language === 'es' 
                            ? 'Aún no hay datos. Los estudiantes necesitan completar juegos primero.'
                            : 'No data yet. Students need to complete games first.'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BarChart3 className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-600">
                      {language === 'es' ? 'Estadísticas de Práctica' : 'Practice Insights'}
                    </h3>
                    <p className="text-slate-400 max-w-md mx-auto mt-2">
                      {language === 'es' 
                        ? 'Selecciona una asignación arriba para ver las estadísticas de participación.'
                        : 'Select an assignment above to view participation stats.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Assignment Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle>{language === 'es' ? 'Nueva Asignación de Práctica' : 'New Practice Assignment'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {language === 'es' ? 'Materia *' : 'Subject *'}
                    </label>
                    <Input
                      value={newAssignment.subject}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder={language === 'es' ? 'Ej: Matemáticas' : 'e.g., Math'}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {language === 'es' ? 'Grado *' : 'Grade Level *'}
                    </label>
                    <Input
                      value={newAssignment.grade_level}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, grade_level: e.target.value }))}
                      placeholder={language === 'es' ? 'Ej: 5to Grado' : 'e.g., 5th Grade'}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    {language === 'es' ? 'Tema *' : 'Topic *'}
                  </label>
                  <Input
                    value={newAssignment.topic}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder={language === 'es' ? 'Ej: Fracciones' : 'e.g., Fractions'}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    {language === 'es' ? 'Estándar (opcional)' : 'Standard (optional)'}
                  </label>
                  <Input
                    value={newAssignment.standard}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, standard: e.target.value }))}
                    placeholder="e.g., CCSS.MATH.5.NF.A.1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {language === 'es' ? 'Dificultad' : 'Difficulty'}
                    </label>
                    <Select
                      value={newAssignment.difficulty}
                      onValueChange={(value) => setNewAssignment(prev => ({ ...prev, difficulty: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{language === 'es' ? 'Fácil' : 'Easy'}</SelectItem>
                        <SelectItem value="medium">{language === 'es' ? 'Medio' : 'Medium'}</SelectItem>
                        <SelectItem value="hard">{language === 'es' ? 'Difícil' : 'Hard'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      {language === 'es' ? '# de Preguntas' : '# of Questions'}
                    </label>
                    <Select
                      value={newAssignment.item_count.toString()}
                      onValueChange={(value) => setNewAssignment(prev => ({ ...prev, item_count: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {language === 'es' ? 'Modos de Juego Permitidos' : 'Allowed Game Modes'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(gameModeNames).map((mode) => {
                      const Icon = gameModeIcons[mode];
                      const isSelected = newAssignment.allowed_game_types.includes(mode);
                      return (
                        <Button
                          key={mode}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setNewAssignment(prev => ({
                              ...prev,
                              allowed_game_types: isSelected
                                ? prev.allowed_game_types.filter(t => t !== mode)
                                : [...prev.allowed_game_types, mode]
                            }));
                          }}
                          className={isSelected ? 'bg-purple-600' : ''}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {gameModeNames[mode]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={createAssignment}
                    disabled={creating}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {language === 'es' ? 'Crear' : 'Create'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Host Session Modal */}
        {hostingAssignment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{language === 'es' ? 'Iniciar Sesión de Práctica' : 'Start Practice Session'}</CardTitle>
                <p className="text-sm text-slate-500">{hostingAssignment.topic}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {language === 'es' ? 'Modo de Juego' : 'Game Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* All Modes option - let students choose */}
                    {hostingAssignment.allowed_game_types?.length > 1 && (
                      <Button
                        variant={selectedGameType === 'all_modes' ? 'default' : 'outline'}
                        onClick={() => setSelectedGameType('all_modes')}
                        className={`col-span-2 ${selectedGameType === 'all_modes' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'border-dashed border-2'}`}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {language === 'es' ? '🎲 Todos los Modos (Estudiante Elige)' : '🎲 All Modes (Student Chooses)'}
                      </Button>
                    )}
                    {hostingAssignment.allowed_game_types?.map((mode) => {
                      const Icon = gameModeIcons[mode];
                      return (
                        <Button
                          key={mode}
                          variant={selectedGameType === mode ? 'default' : 'outline'}
                          onClick={() => setSelectedGameType(mode)}
                          className={selectedGameType === mode ? 'bg-purple-600' : ''}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {gameModeNames[mode]}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {language === 'es' ? 'Tipo de Sesión' : 'Session Type'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedMode === 'LIVE' ? 'default' : 'outline'}
                      onClick={() => setSelectedMode('LIVE')}
                      className={selectedMode === 'LIVE' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'En Vivo' : 'Live'}
                    </Button>
                    <Button
                      variant={selectedMode === 'SELF_PACED' ? 'default' : 'outline'}
                      onClick={() => setSelectedMode('SELF_PACED')}
                      className={selectedMode === 'SELF_PACED' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'A Su Ritmo' : 'Self-Paced'}
                    </Button>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                  {selectedMode === 'LIVE' ? (
                    <>
                      <Users className="h-4 w-4 inline mr-1 text-green-600" />
                      {language === 'es' 
                        ? 'Se generará un PIN para que los estudiantes se unan. Tú controlas el avance.'
                        : 'A PIN will be generated for students to join. You control the pace.'}
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 inline mr-1 text-blue-600" />
                      {language === 'es' 
                        ? 'Los estudiantes juegan a su propio ritmo. Comparte el enlace.'
                        : 'Students play at their own pace. Share the link.'}
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setHostingAssignment(null)}
                    className="flex-1"
                  >
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={() => createSession(hostingAssignment)}
                    disabled={creatingSession}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {creatingSession ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {language === 'es' ? 'Iniciar' : 'Start'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Share Link Dialog */}
        {showShareDialog && shareInfo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="text-center border-b">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">
                  {language === 'es' ? '¡Juego Listo para Compartir!' : 'Game Ready to Share!'}
                </CardTitle>
                <p className="text-slate-500">{shareInfo.topic}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Game Link */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    {language === 'es' ? 'Enlace del Juego' : 'Game Link'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={shareInfo.joinUrl}
                      readOnly
                      className="flex-1 bg-slate-50"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(shareInfo.joinUrl);
                        toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
                      }}
                      variant="outline"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* PIN if available */}
                {shareInfo.pin && (
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">
                      PIN
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-lg py-3 px-4 text-center font-mono text-2xl tracking-widest">
                        {shareInfo.pin}
                      </div>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(shareInfo.pin);
                          toast.success('PIN copied');
                        }}
                        variant="outline"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t pt-4 mt-4 flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      window.open(shareInfo.joinUrl, '_blank');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Abrir Juego' : 'Open Game'}
                  </Button>
                  <Button
                    onClick={() => setShowShareDialog(false)}
                    variant="outline"
                    className="w-full"
                  >
                    {language === 'es' ? 'Cerrar' : 'Close'}
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

export default PlayToLearnTeacher;
