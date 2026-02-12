import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Users, BookOpen, Trash2, Edit, ChevronRight, Upload, Link, Copy, ExternalLink, Mail, Calendar, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Classes = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [showNewClass, setShowNewClass] = useState(false);
  const [showNewStudent, setShowNewStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [newClass, setNewClass] = useState({
    name: '',
    grade: '',
    section: '',
    subject: '',
    year_term: '2024-2025'
  });
  
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    student_number: '',
    email: '',
    parent_email: '',
    notes: '',
    accommodations: ''
  });

  const [portalDialog, setPortalDialog] = useState({ 
    open: false, 
    student: null, 
    token: null, 
    loading: false,
    expiresAt: null,
    parentEmail: '',
    expiresDays: 30,
    sendingEmail: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, semestersRes] = await Promise.all([
          axios.get(`${API}/classes`, { withCredentials: true }),
          axios.get(`${API}/semesters`, { withCredentials: true })
        ]);
        
        setClasses(classesRes.data);
        setSemesters(semestersRes.data);
        
        // Find active semester
        const active = semestersRes.data.find(s => s.is_active);
        if (active) setActiveSemester(active);
        
        if (classId) {
          const cls = classesRes.data.find(c => c.class_id === classId);
          if (cls) {
            setSelectedClass(cls);
            fetchStudents(classId);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('error'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId, t]);

  const fetchStudents = async (id) => {
    try {
      const res = await axios.get(`${API}/classes/${id}/students`, { withCredentials: true });
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateClass = async () => {
    if (!newClass.name || !newClass.grade || !newClass.section) {
      toast.error(language === 'es' ? 'Completa los campos requeridos' : 'Complete required fields');
      return;
    }

    try {
      const res = await axios.post(`${API}/classes`, newClass, { withCredentials: true });
      setClasses(prev => [...prev, res.data]);
      setShowNewClass(false);
      setNewClass({ name: '', grade: '', section: '', subject: '', year_term: '2024-2025' });
      toast.success(language === 'es' ? 'Clase creada' : 'Class created');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await axios.delete(`${API}/classes/${id}`, { withCredentials: true });
      setClasses(prev => prev.filter(c => c.class_id !== id));
      if (selectedClass?.class_id === id) {
        setSelectedClass(null);
        setStudents([]);
        navigate('/classes');
      }
      toast.success(language === 'es' ? 'Clase eliminada' : 'Class deleted');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleCreateStudent = async () => {
    if (!newStudent.first_name || !newStudent.last_name) {
      toast.error(language === 'es' ? 'Nombre y apellido requeridos' : 'First and last name required');
      return;
    }

    try {
      const res = await axios.post(`${API}/classes/${selectedClass.class_id}/students`, newStudent, { withCredentials: true });
      setStudents(prev => [...prev, res.data]);
      setShowNewStudent(false);
      setNewStudent({ first_name: '', last_name: '', student_number: '', email: '', parent_email: '', notes: '', accommodations: '' });
      toast.success(language === 'es' ? 'Estudiante agregado' : 'Student added');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    try {
      await axios.put(`${API}/students/${editingStudent.student_id}`, {
        first_name: editingStudent.first_name,
        last_name: editingStudent.last_name,
        student_number: editingStudent.student_number,
        email: editingStudent.email,
        parent_email: editingStudent.parent_email,
        notes: editingStudent.notes,
        accommodations: editingStudent.accommodations
      }, { withCredentials: true });
      
      setStudents(prev => prev.map(s => s.student_id === editingStudent.student_id ? editingStudent : s));
      setEditingStudent(null);
      toast.success(language === 'es' ? 'Estudiante actualizado' : 'Student updated');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDeleteStudent = async (studentId) => {
    try {
      await axios.delete(`${API}/students/${studentId}`, { withCredentials: true });
      setStudents(prev => prev.filter(s => s.student_id !== studentId));
      toast.success(language === 'es' ? 'Estudiante eliminado' : 'Student deleted');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const generatePortalLink = async (student) => {
    const parentEmail = student.parent_email || '';
    setPortalDialog({ 
      open: true, 
      student, 
      token: null, 
      loading: true,
      expiresAt: null,
      parentEmail,
      expiresDays: 30,
      sendingEmail: false
    });
    try {
      const res = await axios.post(`${API}/students/${student.student_id}/portal-token?expires_days=30`, {}, { withCredentials: true });
      const fullUrl = `${window.location.origin}/portal/${res.data.token}`;
      setPortalDialog(prev => ({ 
        ...prev, 
        token: fullUrl, 
        loading: false,
        expiresAt: res.data.expires_at
      }));
    } catch (error) {
      toast.error(language === 'es' ? 'Error al generar enlace' : 'Error generating link');
      setPortalDialog(prev => ({ ...prev, open: false, loading: false }));
    }
  };

  const copyPortalLink = () => {
    if (portalDialog.token) {
      navigator.clipboard.writeText(portalDialog.token);
      toast.success(language === 'es' ? 'Enlace copiado!' : 'Link copied!');
    }
  };

  const sendPortalEmail = async () => {
    if (!portalDialog.parentEmail || !portalDialog.student) return;
    
    setPortalDialog(prev => ({ ...prev, sendingEmail: true }));
    try {
      await axios.post(`${API}/portal/email`, {
        student_id: portalDialog.student.student_id,
        parent_email: portalDialog.parentEmail,
        expires_days: portalDialog.expiresDays
      }, { withCredentials: true });
      
      toast.success(
        language === 'es' 
          ? `Email enviado a ${portalDialog.parentEmail}` 
          : `Email sent to ${portalDialog.parentEmail}`
      );
      setPortalDialog(prev => ({ ...prev, sendingEmail: false }));
    } catch (error) {
      toast.error(language === 'es' ? 'Error al enviar email' : 'Error sending email');
      setPortalDialog(prev => ({ ...prev, sendingEmail: false }));
    }
  };

  const selectClass = (cls) => {
    setSelectedClass(cls);
    fetchStudents(cls.class_id);
    navigate(`/classes/${cls.class_id}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
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
            <h1 className="text-3xl font-heading font-bold text-slate-800">{t('classes')}</h1>
            <p className="text-slate-500">{language === 'es' ? 'Gestiona tus clases y estudiantes' : 'Manage your classes and students'}</p>
          </div>
          <Dialog open={showNewClass} onOpenChange={setShowNewClass}>
            <DialogTrigger asChild>
              <Button data-testid="new-class-btn">
                <Plus className="h-4 w-4 mr-2" />
                {t('addClass')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('addClass')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t('className')}</Label>
                  <Input 
                    value={newClass.name}
                    onChange={(e) => setNewClass(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={language === 'es' ? 'Ej: English' : 'Ex: English'}
                    data-testid="class-name-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('grade')}</Label>
                    <Input 
                      value={newClass.grade}
                      onChange={(e) => setNewClass(prev => ({ ...prev, grade: e.target.value }))}
                      placeholder="4"
                      data-testid="class-grade-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('section')}</Label>
                    <Input 
                      value={newClass.section}
                      onChange={(e) => setNewClass(prev => ({ ...prev, section: e.target.value }))}
                      placeholder="A"
                      data-testid="class-section-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('subject')}</Label>
                  <Input 
                    value={newClass.subject}
                    onChange={(e) => setNewClass(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={language === 'es' ? 'Inglés' : 'English'}
                    data-testid="class-subject-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('yearTerm')}</Label>
                  <Input 
                    value={newClass.year_term}
                    onChange={(e) => setNewClass(prev => ({ ...prev, year_term: e.target.value }))}
                    placeholder="2024-2025"
                    data-testid="class-year-input"
                  />
                </div>
                <Button onClick={handleCreateClass} className="w-full" data-testid="create-class-submit">
                  {t('save')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Classes List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-heading font-semibold text-slate-700">{t('classes')}</h2>
            {classes.length === 0 ? (
              <Card className="bg-white border-slate-100">
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-slate-500">{language === 'es' ? 'No hay clases' : 'No classes yet'}</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowNewClass(true)}
                  >
                    {t('addClass')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {classes.map(cls => (
                  <Card 
                    key={cls.class_id}
                    className={`bg-white border cursor-pointer transition-all hover:shadow-md ${
                      selectedClass?.class_id === cls.class_id ? 'border-slate-400 shadow-md' : 'border-slate-100'
                    }`}
                    onClick={() => selectClass(cls)}
                    data-testid={`class-card-${cls.class_id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{cls.name}</p>
                          <p className="text-sm text-slate-500">
                            {cls.grade}-{cls.section} • {cls.year_term}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Students List */}
          <div className="lg:col-span-2">
            {selectedClass ? (
              <Card className="bg-white border-slate-100">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {selectedClass.name} - {t('students')}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {selectedClass.grade}-{selectedClass.section}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showNewStudent} onOpenChange={setShowNewStudent}>
                      <DialogTrigger asChild>
                        <Button size="sm" data-testid="add-student-btn">
                          <Plus className="h-4 w-4 mr-2" />
                          {t('addStudent')}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{t('addStudent')}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>{t('firstName')}</Label>
                              <Input 
                                value={newStudent.first_name}
                                onChange={(e) => setNewStudent(prev => ({ ...prev, first_name: e.target.value }))}
                                data-testid="student-first-name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>{t('lastName')}</Label>
                              <Input 
                                value={newStudent.last_name}
                                onChange={(e) => setNewStudent(prev => ({ ...prev, last_name: e.target.value }))}
                                data-testid="student-last-name"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>{t('studentNumber')}</Label>
                            <Input 
                              value={newStudent.student_number}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, student_number: e.target.value }))}
                              data-testid="student-number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('email')}</Label>
                            <Input 
                              type="email"
                              value={newStudent.email}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, email: e.target.value }))}
                              data-testid="student-email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('parentEmail')}</Label>
                            <Input 
                              type="email"
                              value={newStudent.parent_email}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, parent_email: e.target.value }))}
                              data-testid="student-parent-email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('accommodations')}</Label>
                            <Textarea 
                              value={newStudent.accommodations}
                              onChange={(e) => setNewStudent(prev => ({ ...prev, accommodations: e.target.value }))}
                              data-testid="student-accommodations"
                            />
                          </div>
                          <Button onClick={handleCreateStudent} className="w-full" data-testid="create-student-submit">
                            {t('save')}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {language === 'es' 
                              ? 'Esta acción eliminará la clase y todos sus estudiantes.'
                              : 'This will delete the class and all its students.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteClass(selectedClass.class_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t('delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-500">{language === 'es' ? 'No hay estudiantes' : 'No students yet'}</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setShowNewStudent(true)}
                      >
                        {t('addStudent')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {students.map((student, index) => (
                        <div 
                          key={student.student_id}
                          className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-slate-100"
                          data-testid={`student-row-${student.student_id}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-500 w-6">{index + 1}</span>
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-slate-600">
                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {student.first_name} {student.last_name}
                              </p>
                              {student.student_number && (
                                <p className="text-xs text-slate-500">{student.student_number}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {student.accommodations && (
                              <Badge variant="outline" className="text-xs">IEP</Badge>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => generatePortalLink(student)}
                              title={language === 'es' ? 'Portal de Padres' : 'Parent Portal'}
                            >
                              <Link className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setEditingStudent(student)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteStudent(student.student_id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {t('delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white border-slate-100">
                <CardContent className="py-20 text-center">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 text-lg">
                    {language === 'es' ? 'Selecciona una clase para ver sus estudiantes' : 'Select a class to view its students'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Student Dialog */}
        <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('edit')} {t('students')}</DialogTitle>
            </DialogHeader>
            {editingStudent && (
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('firstName')}</Label>
                    <Input 
                      value={editingStudent.first_name}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev, first_name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('lastName')}</Label>
                    <Input 
                      value={editingStudent.last_name}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev, last_name: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('studentNumber')}</Label>
                  <Input 
                    value={editingStudent.student_number || ''}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, student_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('accommodations')}</Label>
                  <Textarea 
                    value={editingStudent.accommodations || ''}
                    onChange={(e) => setEditingStudent(prev => ({ ...prev, accommodations: e.target.value }))}
                  />
                </div>
                <Button onClick={handleUpdateStudent} className="w-full">
                  {t('save')}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Parent Portal Link Dialog */}
        <Dialog open={portalDialog.open} onOpenChange={(open) => !open && setPortalDialog({ open: false, student: null, token: null, loading: false })}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-green-600" />
                {language === 'es' ? 'Portal de Padres' : 'Parent Portal'}
              </DialogTitle>
            </DialogHeader>
            
            {portalDialog.student && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500 mb-1">
                    {language === 'es' ? 'Estudiante' : 'Student'}
                  </p>
                  <p className="font-medium text-slate-800">
                    {portalDialog.student.first_name} {portalDialog.student.last_name}
                  </p>
                </div>

                {portalDialog.loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-slate-500 mt-2">
                      {language === 'es' ? 'Generando enlace...' : 'Generating link...'}
                    </p>
                  </div>
                ) : portalDialog.token && (
                  <>
                    <div className="space-y-2">
                      <Label>{language === 'es' ? 'Enlace de acceso' : 'Access Link'}</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={portalDialog.token}
                          readOnly
                          className="font-mono text-xs"
                          data-testid="portal-link-input"
                        />
                        <Button variant="outline" size="icon" onClick={copyPortalLink} data-testid="copy-portal-link-btn">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        {language === 'es' 
                          ? 'Comparta este enlace con los padres del estudiante. El portal es de solo lectura.'
                          : 'Share this link with the student\'s parents. The portal is read-only.'}
                      </p>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPortalDialog({ open: false, student: null, token: null, loading: false })}>
                        {language === 'es' ? 'Cerrar' : 'Close'}
                      </Button>
                      <Button onClick={() => window.open(portalDialog.token, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {language === 'es' ? 'Abrir Portal' : 'Open Portal'}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Classes;
