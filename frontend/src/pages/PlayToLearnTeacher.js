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
  ChevronRight, Hash, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PlayToLearnTeacher = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [language, setLanguage] = useState('es');
  
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
    allowed_game_types: ['quiz', 'time_attack', 'matching', 'flashcard'],
    language: 'es'
  });
  
  // Host session
  const [hostingAssignment, setHostingAssignment] = useState(null);
  const [selectedGameType, setSelectedGameType] = useState('quiz');
  const [selectedMode, setSelectedMode] = useState('LIVE');
  const [creatingSession, setCreatingSession] = useState(false);

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
      await axios.post(`${API}/play-to-learn/assignments`, newAssignment, { headers: getAuthHeaders() });
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
      await axios.delete(`${API}/play-to-learn/assignments/${assignmentId}`, { headers: getAuthHeaders() });
      toast.success(language === 'es' ? 'Asignación eliminada' : 'Assignment deleted');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error deleting assignment');
    }
  };

  const createSession = async (assignment) => {
    setCreatingSession(true);
    try {
      const res = await axios.post(`${API}/play-to-learn/sessions`, {
        assignment_id: assignment.assignment_id,
        game_type: selectedGameType,
        mode: selectedMode
      }, { headers: getAuthHeaders() });

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
        // For self-paced, show the join link
        const joinUrl = `${window.location.origin}/play-to-learn/game/${res.data.session_id}`;
        navigator.clipboard.writeText(joinUrl);
        toast.success(language === 'es' ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard');
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

  const gameModeIcons = {
    quiz: Brain,
    time_attack: Zap,
    matching: Target,
    flashcard: Sparkles
  };

  const gameModeNames = {
    quiz: language === 'es' ? 'Quiz' : 'Quiz',
    time_attack: language === 'es' ? 'Ataque de Tiempo' : 'Time Attack',
    matching: language === 'es' ? 'Emparejamiento' : 'Matching',
    flashcard: language === 'es' ? 'Tarjetas Flash' : 'Flashcards'
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
              Play to Learn
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
                            <Button
                              onClick={() => copyJoinLink(session.session_id, session.join_pin)}
                              variant="outline"
                              size="sm"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {session.status !== 'COMPLETE' && (
                              <Button
                                onClick={() => navigate(`/teacher/play-to-learn/host/${session.session_id}`)}
                                variant="outline"
                                size="sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
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
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600">
                  {language === 'es' ? 'Estadísticas de Práctica' : 'Practice Insights'}
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mt-2">
                  {language === 'es' 
                    ? 'Aquí verás estadísticas de participación y áreas de práctica. Sin calificaciones.'
                    : 'View participation stats and practice areas here. No grades.'}
                </p>
              </CardContent>
            </Card>
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
      </div>
    </Layout>
  );
};

export default PlayToLearnTeacher;
