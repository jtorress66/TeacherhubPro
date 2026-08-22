import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { 
  Sparkles, Calendar, BookOpen, FileText, ClipboardCheck, Mail, 
  Play, CheckCircle2, Clock, AlertCircle, ChevronRight, Loader2,
  Edit, Eye, Send, Trash2, RefreshCw, Bell, Wand2
} from 'lucide-react';

const PrepAgent = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  
  // Get API URL - handle both development and production
  const API = process.env.REACT_APP_BACKEND_URL 
    ? `${process.env.REACT_APP_BACKEND_URL}/api`
    : `${window.location.origin}/api`;
  
  // State
  const [classes, setClasses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [activeTab, setActiveTab] = useState('lessons');
  const [showEmailEditor, setShowEmailEditor] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    prompt: '',
    class_id: '',
    week_start: new Date().toISOString().split('T')[0],
    num_days: 5,
    include_quiz: true,
    include_presentations: true,
    include_worksheets: true,
    include_calendar: true,
    include_parent_email: true,
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);
  
  // Poll for updates
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        fetchBatchesUpdate();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [loading, selectedBatch]);

  const fetchData = async () => {
    try {
      const [classesRes, batchesRes, notifRes] = await Promise.all([
        axios.get(`${API}/classes`, { withCredentials: true }),
        axios.get(`${API}/prep-agent/batches`, { withCredentials: true }),
        axios.get(`${API}/prep-agent/notifications`, { withCredentials: true })
      ]);
      setClasses(classesRes.data);
      setBatches(batchesRes.data);
      setNotifications(notifRes.data.filter(n => !n.read));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchesUpdate = async () => {
    try {
      const res = await axios.get(`${API}/prep-agent/batches`, { withCredentials: true });
      setBatches(res.data);
      
      // Update selectedBatch if it exists in the new data
      setSelectedBatch(prev => {
        if (!prev) return null;
        const updated = res.data.find(b => b.batch_id === prev.batch_id);
        if (updated && updated.status !== prev.status) {
          if (updated.status === 'completed') {
            toast.success(language === 'es' ? '¡Preparación semanal lista!' : 'Weekly prep is ready!');
          }
          return updated;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const createBatch = async () => {
    if (!formData.prompt.trim()) {
      toast.error(language === 'es' ? 'Ingresa tu solicitud de preparación' : 'Enter your prep request');
      return;
    }
    if (!formData.class_id) {
      toast.error(language === 'es' ? 'Selecciona una clase' : 'Select a class');
      return;
    }

    setCreating(true);
    try {
      const res = await axios.post(`${API}/prep-agent/batches`, formData, { withCredentials: true });
      setBatches(prev => [res.data, ...prev]);
      setSelectedBatch(res.data);
      setFormData(prev => ({ ...prev, prompt: '' }));
      toast.success(language === 'es' ? 'Agente de preparación iniciado' : 'Prep agent started');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al iniciar el agente' : 'Failed to start agent');
    } finally {
      setCreating(false);
    }
  };

  const publishBatch = async () => {
    if (!selectedBatch) return;
    
    try {
      const publishRequest = {
        publish_lessons: true,
        publish_presentations: true,
        publish_worksheets: true,
        publish_quiz: true,
        publish_calendar: true,
        send_parent_email: formData.include_parent_email,
        parent_email_content: emailContent || selectedBatch.parent_email?.content
      };
      
      await axios.post(`${API}/prep-agent/batches/${selectedBatch.batch_id}/publish`, publishRequest, { withCredentials: true });
      toast.success(language === 'es' ? '¡Todo publicado exitosamente!' : 'Everything published successfully!');
      fetchBatchesUpdate();
      setSelectedBatch(null);
    } catch (error) {
      toast.error(language === 'es' ? 'Error al publicar' : 'Failed to publish');
    }
  };

  const deleteBatch = async (batchId) => {
    if (!confirm(language === 'es' ? '¿Eliminar esta preparación?' : 'Delete this prep batch?')) return;
    
    try {
      await axios.delete(`${API}/prep-agent/batches/${batchId}`, { withCredentials: true });
      setBatches(prev => prev.filter(b => b.batch_id !== batchId));
      if (selectedBatch?.batch_id === batchId) setSelectedBatch(null);
      toast.success(language === 'es' ? 'Eliminado' : 'Deleted');
    } catch (error) {
      toast.error(language === 'es' ? 'Error al eliminar' : 'Failed to delete');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      case 'published': return 'bg-blue-100 text-blue-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'published': return <Send className="h-4 w-4" />;
      default: return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getProgressPercent = (batch) => {
    if (batch.status === 'completed' || batch.status === 'published') return 100;
    if (batch.status === 'failed') return 0;
    return (batch.current_step / batch.total_steps) * 100;
  };

  const getClassName = (classId) => {
    const cls = classes.find(c => c.class_id === classId);
    return cls ? `${cls.name} (${cls.grade}-${cls.section})` : 'Unknown';
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
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
              <Wand2 className="h-8 w-8 text-violet-600" />
              {language === 'es' ? 'Agente de Preparación Semanal' : 'Weekly Prep Agent'}
            </h1>
            <p className="text-slate-500 mt-1">
              {language === 'es' 
                ? 'Automatiza toda tu preparación del domingo por la noche con un solo prompt'
                : 'Automate your entire Sunday night prep with a single prompt'}
            </p>
          </div>
          
          {notifications.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {notifications.length} {language === 'es' ? 'listo' : 'ready'}
            </Badge>
          )}
        </div>

        {/* Create New Batch */}
        <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              {language === 'es' ? 'Nueva Preparación Semanal' : 'New Weekly Prep'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Describe qué necesitas preparar y el agente generará todo automáticamente'
                : 'Describe what you need to prep and the agent will generate everything automatically'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>{language === 'es' ? 'Tu Solicitud' : 'Your Request'}</Label>
                <Textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder={language === 'es' 
                    ? 'Ej: Prepara la próxima semana para Unidad 3 de Historia (Guerra Civil), alineado con estándares del currículo'
                    : 'Ex: Prep next week for Unit 3 History (Civil War), matching state curriculum standards'}
                  className="h-24 bg-white"
                  data-testid="prep-prompt-input"
                />
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Clase' : 'Class'}</Label>
                  <Select value={formData.class_id} onValueChange={(v) => setFormData(prev => ({ ...prev, class_id: v }))}>
                    <SelectTrigger data-testid="prep-class-select">
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls.class_id} value={cls.class_id}>
                          {cls.name} ({cls.grade}-{cls.section})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Semana Comienza' : 'Week Starts'}</Label>
                  <Input
                    type="date"
                    value={formData.week_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, week_start: e.target.value }))}
                    className="bg-white"
                    data-testid="prep-week-start-input"
                  />
                </div>
              </div>
            </div>
            
            {/* Options */}
            <div className="flex flex-wrap gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox 
                  checked={formData.include_presentations}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, include_presentations: c }))}
                  data-testid="prep-presentations-checkbox"
                />
                {language === 'es' ? 'Presentaciones' : 'Presentations'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox 
                  checked={formData.include_worksheets}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, include_worksheets: c }))}
                  data-testid="prep-worksheets-checkbox"
                />
                {language === 'es' ? 'Hojas de Trabajo' : 'Worksheets'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox 
                  checked={formData.include_quiz}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, include_quiz: c }))}
                  data-testid="prep-quiz-checkbox"
                />
                {language === 'es' ? 'Quiz del Viernes' : 'Friday Quiz'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox 
                  checked={formData.include_calendar}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, include_calendar: c }))}
                  data-testid="prep-calendar-checkbox"
                />
                {language === 'es' ? 'Eventos de Calendario' : 'Calendar Events'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox 
                  checked={formData.include_parent_email}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, include_parent_email: c }))}
                  data-testid="prep-parent-email-checkbox"
                />
                {language === 'es' ? 'Email a Padres' : 'Parent Email'}
              </label>
            </div>
            
            <Button 
              onClick={createBatch} 
              disabled={creating || !formData.prompt || !formData.class_id}
              className="w-full md:w-auto bg-violet-600 hover:bg-violet-700"
              data-testid="start-prep-btn"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {language === 'es' ? 'Iniciar Agente de Preparación' : 'Start Prep Agent'}
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Batch List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-heading font-semibold text-slate-800">
              {language === 'es' ? 'Mis Preparaciones' : 'My Prep Batches'}
            </h2>
            
            {batches.length === 0 ? (
              <Card className="bg-white">
                <CardContent className="py-10 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">
                    {language === 'es' ? 'No hay preparaciones aún' : 'No prep batches yet'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {batches.map(batch => (
                  <Card 
                    key={batch.batch_id}
                    className={`bg-white cursor-pointer transition-all hover:shadow-md ${
                      selectedBatch?.batch_id === batch.batch_id ? 'ring-2 ring-violet-500' : ''
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                    data-testid={`batch-card-${batch.batch_id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-slate-800 line-clamp-1 flex-1">
                          {batch.prompt.slice(0, 40)}...
                        </p>
                        <Badge className={`ml-2 ${getStatusColor(batch.status)}`}>
                          {getStatusIcon(batch.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-500 mb-2">
                        {getClassName(batch.class_id)} • {batch.week_start}
                      </p>
                      
                      {batch.status !== 'completed' && batch.status !== 'published' && batch.status !== 'failed' && (
                        <div className="space-y-1">
                          <Progress value={getProgressPercent(batch)} className="h-1.5" />
                          <p className="text-xs text-slate-500">{batch.progress_message}</p>
                        </div>
                      )}
                      
                      {batch.status === 'completed' && (
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          {language === 'es' ? 'Listo para revisar' : 'Ready for review'}
                        </div>
                      )}
                      
                      {batch.status === 'published' && (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Send className="h-3 w-3" />
                          {language === 'es' ? 'Publicado' : 'Published'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Batch Detail View */}
          <div className="lg:col-span-2">
            {selectedBatch ? (
              <Card className="bg-white">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedBatch.prompt.slice(0, 60)}...</CardTitle>
                      <CardDescription>
                        {getClassName(selectedBatch.class_id)} • {language === 'es' ? 'Semana del' : 'Week of'} {selectedBatch.week_start}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedBatch.status === 'completed' && (
                        <Button onClick={publishBatch} className="bg-green-600 hover:bg-green-700" data-testid="publish-btn">
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {language === 'es' ? 'Aprobar y Publicar' : 'Approve & Publish'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBatch(selectedBatch.batch_id)}
                        data-testid="delete-selected-batch-btn"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {selectedBatch.status === 'completed' || selectedBatch.status === 'published' ? (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="w-full justify-start border-b rounded-none bg-slate-50 px-4">
                        <TabsTrigger value="lessons" className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {language === 'es' ? 'Lecciones' : 'Lessons'} ({selectedBatch.lesson_plans?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="presentations" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {language === 'es' ? 'Presentaciones' : 'Slides'} ({selectedBatch.presentations?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="quiz" className="flex items-center gap-2">
                          <ClipboardCheck className="h-4 w-4" />
                          Quiz
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {language === 'es' ? 'Calendario' : 'Calendar'}
                        </TabsTrigger>
                        <TabsTrigger value="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="p-4 max-h-[500px] overflow-y-auto">
                        <TabsContent value="lessons" className="mt-0 space-y-4">
                          {selectedBatch.lesson_plans?.map((plan, idx) => (
                            <Card key={idx} className="border-slate-200">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <Badge variant="outline" className="mb-1">Day {plan.day}</Badge>
                                    <h4 className="font-semibold">{plan.title}</h4>
                                  </div>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{plan.objective}</p>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div><span className="font-medium">Warm-up:</span> {plan.warm_up?.slice(0, 50)}...</div>
                                  <div><span className="font-medium">Closure:</span> {plan.closure?.slice(0, 50)}...</div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="presentations" className="mt-0 space-y-4">
                          {selectedBatch.presentations?.map((pres, idx) => (
                            <Card key={idx} className="border-slate-200">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <Badge variant="outline" className="mb-1">Day {pres.day}</Badge>
                                    <h4 className="font-semibold">{pres.title}</h4>
                                  </div>
                                  <Badge>{pres.slides?.length || 0} slides</Badge>
                                </div>
                                <div className="flex gap-2 overflow-x-auto py-2">
                                  {pres.slides?.slice(0, 4).map((slide, sIdx) => (
                                    <div key={sIdx} className="flex-shrink-0 w-24 h-16 bg-slate-100 rounded text-xs p-1 overflow-hidden">
                                      <p className="font-medium truncate">{slide.title}</p>
                                    </div>
                                  ))}
                                  {pres.slides?.length > 4 && (
                                    <div className="flex-shrink-0 w-24 h-16 bg-slate-50 rounded flex items-center justify-center text-xs text-slate-500">
                                      +{pres.slides.length - 4} more
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="quiz" className="mt-0">
                          {selectedBatch.quiz ? (
                            <Card className="border-slate-200">
                              <CardContent className="p-4">
                                <h4 className="font-semibold mb-2">{selectedBatch.quiz.title}</h4>
                                <p className="text-sm text-slate-600 mb-4">{selectedBatch.quiz.instructions}</p>
                                <div className="space-y-3">
                                  {selectedBatch.quiz.questions?.slice(0, 3).map((q, idx) => (
                                    <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                                      <p className="text-sm font-medium">Q{q.number}: {q.question}</p>
                                      {q.options && (
                                        <div className="mt-1 text-xs text-slate-500">
                                          {q.options.join(' • ')}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {selectedBatch.quiz.questions?.length > 3 && (
                                    <p className="text-sm text-slate-500">
                                      +{selectedBatch.quiz.questions.length - 3} more questions
                                    </p>
                                  )}
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between text-sm">
                                  <span>Total: {selectedBatch.quiz.total_points} points</span>
                                  <span>Time: {selectedBatch.quiz.time_limit}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ) : (
                            <p className="text-slate-500 text-center py-8">
                              {language === 'es' ? 'No se generó quiz' : 'No quiz generated'}
                            </p>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="calendar" className="mt-0">
                          <div className="space-y-2">
                            {selectedBatch.calendar_events?.map((event, idx) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className={`w-2 h-2 rounded-full ${event.type === 'quiz' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{event.title}</p>
                                  <p className="text-xs text-slate-500">{event.date}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">{event.type}</Badge>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="email" className="mt-0">
                          {selectedBatch.parent_email ? (
                            <div className="space-y-4">
                              <div>
                                <Label className="text-sm font-medium">Subject</Label>
                                <p className="text-sm bg-slate-50 p-2 rounded">{selectedBatch.parent_email.subject}</p>
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium">Content</Label>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setEmailContent(selectedBatch.parent_email.content);
                                    setShowEmailEditor(true);
                                  }}>
                                    <Edit className="h-4 w-4 mr-1" /> Edit
                                  </Button>
                                </div>
                                <div className="text-sm bg-slate-50 p-3 rounded whitespace-pre-line max-h-48 overflow-y-auto">
                                  {emailContent || selectedBatch.parent_email.content}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-slate-500 text-center py-8">
                              {language === 'es' ? 'No se generó email' : 'No email generated'}
                            </p>
                          )}
                        </TabsContent>
                      </div>
                    </Tabs>
                  ) : (
                    <div className="p-8 text-center">
                      {selectedBatch.status === 'failed' ? (
                        <>
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                          <p className="text-red-600 font-medium mb-2">
                            {language === 'es' ? 'La preparación falló' : 'Prep failed'}
                          </p>
                          <p className="text-sm text-slate-500">{selectedBatch.error}</p>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-12 w-12 mx-auto mb-4 text-violet-500 animate-spin" />
                          <p className="font-medium text-slate-800 mb-2">{selectedBatch.progress_message}</p>
                          <Progress value={getProgressPercent(selectedBatch)} className="max-w-xs mx-auto" />
                          <p className="text-sm text-slate-500 mt-2">
                            Step {selectedBatch.current_step} of {selectedBatch.total_steps}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white">
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 text-lg mb-2">
                    {language === 'es' ? 'Selecciona una preparación para ver los detalles' : 'Select a prep batch to view details'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {language === 'es' 
                      ? 'O crea una nueva preparación arriba'
                      : 'Or create a new prep batch above'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Email Editor Dialog */}
      <Dialog open={showEmailEditor} onOpenChange={setShowEmailEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{language === 'es' ? 'Editar Email para Padres' : 'Edit Parent Email'}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            className="min-h-[300px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailEditor(false)}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button onClick={() => setShowEmailEditor(false)}>
              {language === 'es' ? 'Guardar' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default PrepAgent;
