import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { 
  Building2, Users, BookOpen, GraduationCap, Calendar, 
  Plus, Edit, Trash2, Key, Loader2, Search, Upload,
  Palette, Shield, ChevronRight, BarChart3, School, CalendarDays,
  FileSpreadsheet, Download, AlertCircle, CheckCircle2, Link2, ExternalLink
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminPanel = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [schools, setSchools] = useState([]);
  const [users, setUsers] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [schoolDialog, setSchoolDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [semesterDialog, setSemesterDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingSemester, setEditingSemester] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [schoolForm, setSchoolForm] = useState({
    name: '', address: '', phone: '', email: '', logo_url: '',
    primary_color: '#65A30D', secondary_color: '#334155', accent_color: '#F59E0B', font_family: 'Manrope'
  });
  const [userForm, setUserForm] = useState({
    email: '', name: '', password: '', school_id: '', role: 'teacher'
  });
  const [semesterForm, setSemesterForm] = useState({
    name: '', name_es: '', start_date: '', end_date: '', year_term: '2024-2025', is_active: false
  });
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk Import states
  const [bulkImportType, setBulkImportType] = useState('teachers'); // 'teachers' or 'students'
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [csvErrors, setCsvErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [selectedSchoolForImport, setSelectedSchoolForImport] = useState('');
  const [selectedClassForImport, setSelectedClassForImport] = useState('');
  const [classesForSchool, setClassesForSchool] = useState([]);

  useEffect(() => {
    if (user?.role !== 'super_admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, schoolsRes, usersRes, semestersRes] = await Promise.all([
        axios.get(`${API}/super-admin/overview`, { withCredentials: true }),
        axios.get(`${API}/super-admin/schools`, { withCredentials: true }),
        axios.get(`${API}/super-admin/users`, { withCredentials: true }),
        axios.get(`${API}/semesters`, { withCredentials: true })
      ]);
      setOverview(overviewRes.data);
      setSchools(schoolsRes.data.schools || []);
      setUsers(usersRes.data.users || []);
      setSemesters(semestersRes.data || []);
    } catch (error) {
      toast.error('Error loading admin data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Semester handlers
  const openSemesterDialog = (semester = null) => {
    if (semester) {
      setEditingSemester(semester);
      setSemesterForm({
        name: semester.name,
        name_es: semester.name_es || '',
        start_date: semester.start_date,
        end_date: semester.end_date,
        year_term: semester.year_term,
        is_active: semester.is_active
      });
    } else {
      setEditingSemester(null);
      setSemesterForm({
        name: '', name_es: '', start_date: '', end_date: '', year_term: '2024-2025', is_active: false
      });
    }
    setSemesterDialog(true);
  };

  const saveSemester = async () => {
    setSaving(true);
    try {
      if (editingSemester) {
        await axios.put(`${API}/semesters/${editingSemester.semester_id}`, semesterForm, { withCredentials: true });
        toast.success(language === 'es' ? 'Semestre actualizado' : 'Semester updated');
      } else {
        await axios.post(`${API}/semesters`, semesterForm, { withCredentials: true });
        toast.success(language === 'es' ? 'Semestre creado' : 'Semester created');
      }
      setSemesterDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    } finally {
      setSaving(false);
    }
  };

  const deleteSemester = async (semesterId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar este semestre?' : 'Delete this semester?')) return;
    try {
      await axios.delete(`${API}/semesters/${semesterId}`, { withCredentials: true });
      toast.success(language === 'es' ? 'Semestre eliminado' : 'Semester deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    }
  };

  const toggleSemesterActive = async (semester) => {
    try {
      await axios.put(`${API}/semesters/${semester.semester_id}`, {
        is_active: !semester.is_active
      }, { withCredentials: true });
      fetchData();
      toast.success(language === 'es' ? 'Estado actualizado' : 'Status updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    }
  };

  // School handlers
  const openSchoolDialog = (school = null) => {
    if (school) {
      setEditingSchool(school);
      setSchoolForm({
        name: school.name || '',
        address: school.address || '',
        phone: school.phone || '',
        email: school.email || '',
        logo_url: school.logo_url || '',
        primary_color: school.branding?.primary_color || '#65A30D',
        secondary_color: school.branding?.secondary_color || '#334155',
        accent_color: school.branding?.accent_color || '#F59E0B',
        font_family: school.branding?.font_family || 'Manrope'
      });
    } else {
      setEditingSchool(null);
      setSchoolForm({
        name: '', address: '', phone: '', email: '', logo_url: '',
        primary_color: '#65A30D', secondary_color: '#334155', accent_color: '#F59E0B', font_family: 'Manrope'
      });
    }
    setSchoolDialog(true);
  };

  const saveSchool = async () => {
    setSaving(true);
    try {
      if (editingSchool) {
        await axios.put(`${API}/super-admin/schools/${editingSchool.school_id}`, schoolForm, { withCredentials: true });
        toast.success(language === 'es' ? 'Escuela actualizada' : 'School updated');
      } else {
        await axios.post(`${API}/super-admin/schools`, schoolForm, { withCredentials: true });
        toast.success(language === 'es' ? 'Escuela creada' : 'School created');
      }
      setSchoolDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error saving school');
    } finally {
      setSaving(false);
    }
  };

  const deleteSchool = async (schoolId) => {
    if (!confirm(language === 'es' ? '¿Eliminar esta escuela?' : 'Delete this school?')) return;
    try {
      await axios.delete(`${API}/super-admin/schools/${schoolId}`, { withCredentials: true });
      toast.success(language === 'es' ? 'Escuela eliminada' : 'School deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error deleting school');
    }
  };

  // User handlers
  const openUserDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        email: user.email || '',
        name: user.name || '',
        password: '',
        school_id: user.school_id || '',
        role: user.role || 'teacher'
      });
    } else {
      setEditingUser(null);
      setUserForm({ email: '', name: '', password: '', school_id: '', role: 'teacher' });
    }
    setUserDialog(true);
  };

  const saveUser = async () => {
    setSaving(true);
    try {
      if (editingUser) {
        const updateData = { ...userForm };
        delete updateData.password; // Don't send password on edit
        await axios.put(`${API}/super-admin/users/${editingUser.user_id}`, updateData, { withCredentials: true });
        toast.success(language === 'es' ? 'Usuario actualizado' : 'User updated');
      } else {
        await axios.post(`${API}/super-admin/users`, userForm, { withCredentials: true });
        toast.success(language === 'es' ? 'Usuario creado' : 'User created');
      }
      setUserDialog(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error saving user');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm(language === 'es' ? '¿Eliminar este usuario?' : 'Delete this user?')) return;
    try {
      await axios.delete(`${API}/super-admin/users/${userId}`, { withCredentials: true });
      toast.success(language === 'es' ? 'Usuario eliminado' : 'User deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error deleting user');
    }
  };

  const resetPassword = async (userId) => {
    try {
      const res = await axios.post(`${API}/super-admin/users/${userId}/reset-password`, {}, { withCredentials: true });
      toast.success(
        <div>
          <p>{language === 'es' ? 'Contraseña restablecida' : 'Password reset'}</p>
          <p className="font-mono text-sm mt-1">{res.data.temporary_password}</p>
        </div>,
        { duration: 10000 }
      );
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error resetting password');
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.school_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800 flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              {language === 'es' ? 'Panel de Super Admin' : 'Super Admin Panel'}
            </h1>
            <p className="text-slate-500 mt-1">
              {language === 'es' ? 'Gestiona escuelas, usuarios y configuración de la plataforma' : 'Manage schools, users, and platform settings'}
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
            Super Admin
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border flex-wrap">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Resumen' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Escuelas' : 'Schools'}</span>
            </TabsTrigger>
            <TabsTrigger value="semesters" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Semestres' : 'Semesters'}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Usuarios' : 'Users'}</span>
            </TabsTrigger>
            <TabsTrigger value="bulk-import" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Importar CSV' : 'Bulk Import'}</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'Integraciones' : 'Integrations'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-100">
                      <Building2 className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-800">{overview?.stats?.total_schools || 0}</p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Escuelas' : 'Schools'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-100">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-800">{overview?.stats?.total_users || 0}</p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Usuarios' : 'Users'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-100">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-800">{overview?.stats?.total_classes || 0}</p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Clases' : 'Classes'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-100">
                      <GraduationCap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-800">{overview?.stats?.total_students || 0}</p>
                      <p className="text-sm text-slate-500">{language === 'es' ? 'Estudiantes' : 'Students'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Schools Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{language === 'es' ? 'Escuelas' : 'Schools'}</span>
                  <Button size="sm" onClick={() => { setActiveTab('schools'); openSchoolDialog(); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Nueva Escuela' : 'New School'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {schools.length > 0 ? (
                  <div className="space-y-3">
                    {schools.slice(0, 5).map(school => (
                      <div 
                        key={school.school_id}
                        className="flex items-center justify-between p-4 rounded-xl border bg-slate-50/50 hover:bg-slate-100/50 transition-colors cursor-pointer"
                        onClick={() => setActiveTab('schools')}
                      >
                        <div className="flex items-center gap-4">
                          {school.logo_url ? (
                            <img src={school.logo_url} alt={school.name} className="h-12 w-12 object-contain rounded-lg border bg-white p-1" />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center">
                              <School className="h-6 w-6 text-slate-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{school.name}</p>
                            <p className="text-sm text-slate-500">
                              {school.user_count} {language === 'es' ? 'usuarios' : 'users'} • {school.class_count} {language === 'es' ? 'clases' : 'classes'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-8">
                    {language === 'es' ? 'No hay escuelas. Crea una para comenzar.' : 'No schools yet. Create one to get started.'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schools Tab */}
          <TabsContent value="schools" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{language === 'es' ? 'Gestión de Escuelas' : 'School Management'}</h2>
              <Button onClick={() => openSchoolDialog()} data-testid="new-school-btn">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Nueva Escuela' : 'New School'}
              </Button>
            </div>

            <div className="grid gap-4">
              {schools.map(school => (
                <Card key={school.school_id} className="bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {school.logo_url ? (
                          <img src={school.logo_url} alt={school.name} className="h-16 w-16 object-contain rounded-xl border bg-white p-2" />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center">
                            <School className="h-8 w-8 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">{school.name}</h3>
                          <p className="text-sm text-slate-500">{school.address || 'No address'}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-slate-600">{school.phone || 'No phone'}</span>
                            <span className="text-slate-600">{school.email || 'No email'}</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Badge variant="secondary">{school.user_count} {language === 'es' ? 'usuarios' : 'users'}</Badge>
                            <Badge variant="secondary">{school.class_count} {language === 'es' ? 'clases' : 'classes'}</Badge>
                            <Badge variant="secondary">{school.student_count} {language === 'es' ? 'estudiantes' : 'students'}</Badge>
                          </div>
                          {/* Branding Preview */}
                          <div className="flex items-center gap-2 mt-3">
                            <span className="text-xs text-slate-500">{language === 'es' ? 'Colores:' : 'Colors:'}</span>
                            <div 
                              className="h-5 w-5 rounded-full border" 
                              style={{ backgroundColor: school.branding?.primary_color || '#65A30D' }}
                              title="Primary"
                            />
                            <div 
                              className="h-5 w-5 rounded-full border" 
                              style={{ backgroundColor: school.branding?.secondary_color || '#334155' }}
                              title="Secondary"
                            />
                            <div 
                              className="h-5 w-5 rounded-full border" 
                              style={{ backgroundColor: school.branding?.accent_color || '#F59E0B' }}
                              title="Accent"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openSchoolDialog(school)} data-testid={`edit-school-${school.school_id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => deleteSchool(school.school_id)} data-testid={`delete-school-${school.school_id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {schools.length === 0 && (
                <Card className="bg-slate-50">
                  <CardContent className="p-12 text-center">
                    <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">{language === 'es' ? 'No hay escuelas registradas' : 'No schools registered'}</p>
                    <Button className="mt-4" onClick={() => openSchoolDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Crear Primera Escuela' : 'Create First School'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Semesters Tab */}
          <TabsContent value="semesters" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{language === 'es' ? 'Gestión de Semestres' : 'Semester Management'}</h2>
              <Button onClick={() => openSemesterDialog()} data-testid="new-semester-btn">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Nuevo Semestre' : 'New Semester'}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {semesters.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <p>{language === 'es' ? 'No hay semestres. Crea uno para comenzar.' : 'No semesters. Create one to get started.'}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {semesters.map(semester => (
                      <div key={semester.semester_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${semester.is_active ? 'bg-green-100' : 'bg-slate-100'}`}>
                            <CalendarDays className={`h-5 w-5 ${semester.is_active ? 'text-green-600' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800">
                                {language === 'es' ? semester.name_es || semester.name : semester.name}
                              </p>
                              {semester.is_active && (
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  {language === 'es' ? 'Activo' : 'Active'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {new Date(semester.start_date).toLocaleDateString()} - {new Date(semester.end_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-slate-400">{semester.year_term}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {language === 'es' ? 'Activo' : 'Active'}
                            </span>
                            <Switch 
                              checked={semester.is_active}
                              onCheckedChange={() => toggleSemesterActive(semester)}
                            />
                          </div>
                          <Button variant="outline" size="sm" onClick={() => openSemesterDialog(semester)} data-testid={`edit-semester-${semester.semester_id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => deleteSemester(semester.semester_id)}
                            data-testid={`delete-semester-${semester.semester_id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-100">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <CalendarDays className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      {language === 'es' ? 'Sobre los Semestres' : 'About Semesters'}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {language === 'es' 
                        ? 'Los semestres organizan las clases, calificaciones y reportes. Solo un semestre puede estar activo a la vez. Los maestros verán el semestre activo por defecto.'
                        : 'Semesters organize classes, grades, and reports. Only one semester can be active at a time. Teachers will see the active semester by default.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={language === 'es' ? 'Buscar usuarios...' : 'Search users...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => openUserDialog()} data-testid="new-user-btn">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Nuevo Usuario' : 'New User'}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-slate-600">{language === 'es' ? 'Usuario' : 'User'}</th>
                        <th className="text-left p-4 font-medium text-slate-600">{language === 'es' ? 'Escuela' : 'School'}</th>
                        <th className="text-left p-4 font-medium text-slate-600">{language === 'es' ? 'Rol' : 'Role'}</th>
                        <th className="text-right p-4 font-medium text-slate-600">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.user_id} className="border-b hover:bg-slate-50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium">
                                {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{u.name || 'No name'}</p>
                                <p className="text-sm text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-slate-600">{u.school_name || 'No school'}</td>
                          <td className="p-4">
                            <Badge className={
                              u.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                              u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-800'
                            }>
                              {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Teacher'}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => resetPassword(u.user_id)} title="Reset Password" data-testid={`reset-password-${u.user_id}`}>
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openUserDialog(u)} data-testid={`edit-user-${u.user_id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {u.role !== 'super_admin' && (
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => deleteUser(u.user_id)} data-testid={`delete-user-${u.user_id}`}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {filteredUsers.length === 0 && (
                  <div className="p-12 text-center">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">{language === 'es' ? 'No se encontraron usuarios' : 'No users found'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Import Tab */}
          <TabsContent value="bulk-import" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">{language === 'es' ? 'Importación Masiva CSV' : 'Bulk CSV Import'}</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {language === 'es' 
                    ? 'Importe maestros o estudiantes usando un archivo CSV' 
                    : 'Import teachers or students using a CSV file'}
                </p>
              </div>
            </div>

            {/* Import Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'es' ? 'Tipo de Importación' : 'Import Type'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      bulkImportType === 'teachers' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setBulkImportType('teachers')}
                  >
                    <Users className={`h-8 w-8 mb-2 ${bulkImportType === 'teachers' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <p className="font-medium">{language === 'es' ? 'Maestros' : 'Teachers'}</p>
                    <p className="text-sm text-slate-500">
                      {language === 'es' ? 'Crear cuentas de maestros para una escuela' : 'Create teacher accounts for a school'}
                    </p>
                  </button>
                  <button
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      bulkImportType === 'students' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setBulkImportType('students')}
                  >
                    <GraduationCap className={`h-8 w-8 mb-2 ${bulkImportType === 'students' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <p className="font-medium">{language === 'es' ? 'Estudiantes' : 'Students'}</p>
                    <p className="text-sm text-slate-500">
                      {language === 'es' ? 'Agregar estudiantes a una clase' : 'Add students to a class'}
                    </p>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* School/Class Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{language === 'es' ? 'Destino' : 'Destination'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{language === 'es' ? 'Escuela' : 'School'} *</Label>
                  <Select 
                    value={selectedSchoolForImport} 
                    onValueChange={async (v) => {
                      setSelectedSchoolForImport(v);
                      setSelectedClassForImport('');
                      if (bulkImportType === 'students' && v) {
                        try {
                          const res = await axios.get(`${API}/super-admin/schools/${v}/classes`, { withCredentials: true });
                          setClassesForSchool(res.data.classes || []);
                        } catch (e) {
                          setClassesForSchool([]);
                        }
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar escuela' : 'Select school'} />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map(s => (
                        <SelectItem key={s.school_id} value={s.school_id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {bulkImportType === 'students' && (
                  <div>
                    <Label>{language === 'es' ? 'Clase' : 'Class'} *</Label>
                    <Select 
                      value={selectedClassForImport} 
                      onValueChange={setSelectedClassForImport}
                      disabled={!selectedSchoolForImport}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar clase' : 'Select class'} />
                      </SelectTrigger>
                      <SelectContent>
                        {classesForSchool.map(c => (
                          <SelectItem key={c.class_id} value={c.class_id}>{c.name} - {c.grade_level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CSV Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{language === 'es' ? 'Archivo CSV' : 'CSV File'}</span>
                  <Button variant="outline" size="sm" onClick={() => {
                    const template = bulkImportType === 'teachers'
                      ? 'name,email,password\nJohn Doe,john@school.edu,temp123\nJane Smith,jane@school.edu,temp456'
                      : 'first_name,last_name,student_number,email,date_of_birth,gender\nJohn,Doe,STU001,john@students.edu,2015-05-15,M\nJane,Smith,STU002,jane@students.edu,2015-08-20,F';
                    const blob = new Blob([template], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${bulkImportType}_template.csv`;
                    a.click();
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Descargar Plantilla' : 'Download Template'}
                  </Button>
                </CardTitle>
                <CardDescription>
                  {bulkImportType === 'teachers' 
                    ? (language === 'es' ? 'Columnas requeridas: name, email, password' : 'Required columns: name, email, password')
                    : (language === 'es' ? 'Columnas requeridas: first_name, last_name, student_number' : 'Required columns: first_name, last_name, student_number')
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-slate-400 transition-colors"
                  onClick={() => document.getElementById('csv-file-input').click()}
                >
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setCsvFile(file);
                        setCsvErrors([]);
                        setImportResults(null);
                        // Parse CSV
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target.result;
                          const lines = text.split('\n').filter(line => line.trim());
                          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                          const data = [];
                          const errors = [];
                          
                          for (let i = 1; i < lines.length; i++) {
                            const values = lines[i].split(',').map(v => v.trim());
                            const row = {};
                            headers.forEach((h, idx) => row[h] = values[idx] || '');
                            
                            // Validate required fields
                            if (bulkImportType === 'teachers') {
                              if (!row.name || !row.email) {
                                errors.push(`Row ${i}: Missing name or email`);
                              }
                            } else {
                              if (!row.first_name || !row.last_name) {
                                errors.push(`Row ${i}: Missing first_name or last_name`);
                              }
                            }
                            data.push(row);
                          }
                          setCsvData(data);
                          setCsvErrors(errors);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">
                    {csvFile ? csvFile.name : (language === 'es' ? 'Haga clic para seleccionar archivo CSV' : 'Click to select CSV file')}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    {language === 'es' ? 'o arrastre y suelte aquí' : 'or drag and drop here'}
                  </p>
                </div>

                {/* CSV Preview */}
                {csvData.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-700">
                        {language === 'es' ? 'Vista Previa' : 'Preview'}: {csvData.length} {language === 'es' ? 'registros' : 'records'}
                      </p>
                      {csvErrors.length > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {csvErrors.length} {language === 'es' ? 'errores' : 'errors'}
                        </Badge>
                      )}
                    </div>
                    
                    {csvErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-800 mb-2">{language === 'es' ? 'Errores encontrados:' : 'Errors found:'}</p>
                        <ul className="text-sm text-red-600 space-y-1">
                          {csvErrors.slice(0, 5).map((err, i) => <li key={i}>• {err}</li>)}
                          {csvErrors.length > 5 && <li>... {language === 'es' ? `y ${csvErrors.length - 5} más` : `and ${csvErrors.length - 5} more`}</li>}
                        </ul>
                      </div>
                    )}

                    <div className="border rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            {Object.keys(csvData[0] || {}).map(key => (
                              <th key={key} className="p-2 text-left font-medium text-slate-600 border-b">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 10).map((row, i) => (
                            <tr key={i} className="border-b hover:bg-slate-50">
                              {Object.values(row).map((val, j) => (
                                <td key={j} className="p-2 text-slate-700">{val || '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {csvData.length > 10 && (
                      <p className="text-sm text-slate-500 text-center">
                        {language === 'es' ? `Mostrando 10 de ${csvData.length} registros` : `Showing 10 of ${csvData.length} records`}
                      </p>
                    )}
                  </div>
                )}

                {/* Import Results */}
                {importResults && (
                  <div className={`p-4 rounded-lg ${importResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {importResults.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <p className={`font-medium ${importResults.success ? 'text-green-800' : 'text-red-800'}`}>
                        {importResults.message}
                      </p>
                    </div>
                    {importResults.details && (
                      <p className="text-sm text-slate-600">{importResults.details}</p>
                    )}
                  </div>
                )}

                {/* Import Button */}
                <Button 
                  className="w-full"
                  disabled={
                    importing || 
                    csvData.length === 0 || 
                    csvErrors.length > 0 || 
                    !selectedSchoolForImport ||
                    (bulkImportType === 'students' && !selectedClassForImport)
                  }
                  onClick={async () => {
                    setImporting(true);
                    try {
                      const endpoint = bulkImportType === 'teachers' 
                        ? `${API}/super-admin/bulk-import/teachers`
                        : `${API}/super-admin/bulk-import/students`;
                      
                      const payload = {
                        school_id: selectedSchoolForImport,
                        class_id: bulkImportType === 'students' ? selectedClassForImport : undefined,
                        data: csvData
                      };
                      
                      const res = await axios.post(endpoint, payload, { withCredentials: true });
                      setImportResults({
                        success: true,
                        message: language === 'es' ? '¡Importación exitosa!' : 'Import successful!',
                        details: `${res.data.imported_count} ${bulkImportType} ${language === 'es' ? 'importados' : 'imported'}`
                      });
                      setCsvFile(null);
                      setCsvData([]);
                      fetchData();
                    } catch (error) {
                      setImportResults({
                        success: false,
                        message: language === 'es' ? 'Error en la importación' : 'Import failed',
                        details: error.response?.data?.detail || error.message
                      });
                    } finally {
                      setImporting(false);
                    }
                  }}
                >
                  {importing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {language === 'es' ? 'Importando...' : 'Importing...'}</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> {language === 'es' ? 'Importar Datos' : 'Import Data'}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">{language === 'es' ? 'Integraciones Disponibles' : 'Available Integrations'}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {language === 'es' 
                  ? 'Conecte servicios externos para mejorar la experiencia de sus clientes' 
                  : 'Connect external services to enhance your customers\' experience'}
              </p>
            </div>

            <div className="grid gap-4">
              {/* Google Classroom Integration */}
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-white shadow-sm border">
                      <svg className="h-10 w-10" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 text-lg">Google Classroom</h3>
                        <Badge className="bg-green-100 text-green-800">
                          {language === 'es' ? 'Disponible' : 'Available'}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-4">
                        {language === 'es' 
                          ? 'Sincronice clases, estudiantes y calificaciones con Google Classroom. Los clientes pueden conectar su propia cuenta de Google Classroom.'
                          : 'Sync classes, students, and grades with Google Classroom. Customers can connect their own Google Classroom account.'}
                      </p>
                      <div className="bg-white rounded-lg p-4 border mb-4">
                        <p className="font-medium text-slate-700 mb-2">{language === 'es' ? 'Características:' : 'Features:'}</p>
                        <ul className="text-sm text-slate-600 space-y-1">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {language === 'es' ? 'Importar clases y listas de estudiantes' : 'Import classes and student rosters'}
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {language === 'es' ? 'Sincronizar tareas y calificaciones' : 'Sync assignments and grades'}
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {language === 'es' ? 'Autenticación OAuth segura' : 'Secure OAuth authentication'}
                          </li>
                        </ul>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {language === 'es' ? 'Ver Documentación' : 'View Documentation'}
                        </Button>
                        <p className="text-sm text-slate-500">
                          {language === 'es' 
                            ? 'El cliente debe proporcionar sus credenciales de Google Cloud'
                            : 'Customer must provide their Google Cloud credentials'}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Future Integrations Placeholder */}
              <Card className="border-dashed border-2 bg-slate-50/50">
                <CardContent className="p-6 text-center">
                  <Link2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-medium text-slate-600">
                    {language === 'es' ? 'Más Integraciones Próximamente' : 'More Integrations Coming Soon'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {language === 'es' 
                      ? 'Canvas, Schoology, Microsoft Teams, y más'
                      : 'Canvas, Schoology, Microsoft Teams, and more'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Integration Request */}
            <Card className="bg-purple-50 border-purple-100">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Link2 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-800">
                      {language === 'es' ? '¿Necesita una integración específica?' : 'Need a specific integration?'}
                    </p>
                    <p className="text-sm text-purple-700 mt-1">
                      {language === 'es' 
                        ? 'Contáctenos para solicitar integraciones personalizadas para sus clientes.'
                        : 'Contact us to request custom integrations for your customers.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* School Dialog */}
        <Dialog open={schoolDialog} onOpenChange={setSchoolDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? (language === 'es' ? 'Editar Escuela' : 'Edit School') : (language === 'es' ? 'Nueva Escuela' : 'New School')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {language === 'es' ? 'Información Básica' : 'Basic Information'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>{language === 'es' ? 'Nombre de la Escuela' : 'School Name'} *</Label>
                    <Input 
                      value={schoolForm.name} 
                      onChange={(e) => setSchoolForm({...schoolForm, name: e.target.value})}
                      placeholder={language === 'es' ? 'Nombre de la escuela' : 'School name'}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>{language === 'es' ? 'Dirección' : 'Address'}</Label>
                    <Input 
                      value={schoolForm.address} 
                      onChange={(e) => setSchoolForm({...schoolForm, address: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Teléfono' : 'Phone'}</Label>
                    <Input 
                      value={schoolForm.phone} 
                      onChange={(e) => setSchoolForm({...schoolForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={schoolForm.email} 
                      onChange={(e) => setSchoolForm({...schoolForm, email: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>{language === 'es' ? 'URL del Logo' : 'Logo URL'}</Label>
                    <Input 
                      value={schoolForm.logo_url} 
                      onChange={(e) => setSchoolForm({...schoolForm, logo_url: e.target.value})}
                      placeholder="https://..."
                    />
                    {schoolForm.logo_url && (
                      <div className="mt-2 p-4 bg-slate-50 rounded-lg">
                        <img src={schoolForm.logo_url} alt="Logo preview" className="h-16 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Branding */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-slate-800 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {language === 'es' ? 'Personalización de Marca' : 'Branding Customization'}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>{language === 'es' ? 'Color Primario' : 'Primary Color'}</Label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="color" 
                        value={schoolForm.primary_color}
                        onChange={(e) => setSchoolForm({...schoolForm, primary_color: e.target.value})}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input 
                        value={schoolForm.primary_color}
                        onChange={(e) => setSchoolForm({...schoolForm, primary_color: e.target.value})}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Color Secundario' : 'Secondary Color'}</Label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="color" 
                        value={schoolForm.secondary_color}
                        onChange={(e) => setSchoolForm({...schoolForm, secondary_color: e.target.value})}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input 
                        value={schoolForm.secondary_color}
                        onChange={(e) => setSchoolForm({...schoolForm, secondary_color: e.target.value})}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Color de Acento' : 'Accent Color'}</Label>
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="color" 
                        value={schoolForm.accent_color}
                        onChange={(e) => setSchoolForm({...schoolForm, accent_color: e.target.value})}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input 
                        value={schoolForm.accent_color}
                        onChange={(e) => setSchoolForm({...schoolForm, accent_color: e.target.value})}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>{language === 'es' ? 'Familia de Fuente' : 'Font Family'}</Label>
                  <Select value={schoolForm.font_family} onValueChange={(v) => setSchoolForm({...schoolForm, font_family: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manrope">Manrope (Default)</SelectItem>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Preview */}
                <div className="p-4 rounded-xl border" style={{ 
                  backgroundColor: schoolForm.secondary_color + '10',
                  borderColor: schoolForm.primary_color + '40'
                }}>
                  <p className="text-sm text-slate-500 mb-2">{language === 'es' ? 'Vista previa:' : 'Preview:'}</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: schoolForm.primary_color }}>
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold" style={{ color: schoolForm.secondary_color, fontFamily: schoolForm.font_family }}>
                      {schoolForm.name || 'School Name'}
                    </span>
                    <Badge style={{ backgroundColor: schoolForm.accent_color, color: 'white' }}>
                      {language === 'es' ? 'Activo' : 'Active'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSchoolDialog(false)} data-testid="school-dialog-cancel">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button onClick={saveSchool} disabled={saving || !schoolForm.name} data-testid="school-dialog-save">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'es' ? 'Guardar' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Dialog */}
        <Dialog open={userDialog} onOpenChange={setUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? (language === 'es' ? 'Editar Usuario' : 'Edit User') : (language === 'es' ? 'Nuevo Usuario' : 'New User')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label>{language === 'es' ? 'Nombre' : 'Name'} *</Label>
                <Input 
                  value={userForm.name} 
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={userForm.email} 
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              {!editingUser && (
                <div>
                  <Label>{language === 'es' ? 'Contraseña' : 'Password'} *</Label>
                  <Input 
                    type="password"
                    value={userForm.password} 
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                  />
                </div>
              )}
              <div>
                <Label>{language === 'es' ? 'Escuela' : 'School'} *</Label>
                <Select value={userForm.school_id} onValueChange={(v) => setUserForm({...userForm, school_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar escuela' : 'Select school'} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.school_id} value={s.school_id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'es' ? 'Rol' : 'Role'}</Label>
                <Select value={userForm.role} onValueChange={(v) => setUserForm({...userForm, role: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">{language === 'es' ? 'Maestro' : 'Teacher'}</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">{language === 'es' ? 'Super Admin (Plataforma)' : 'Super Admin (Platform)'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialog(false)} data-testid="user-dialog-cancel">
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                onClick={saveUser} 
                disabled={saving || !userForm.name || !userForm.email || !userForm.school_id || (!editingUser && !userForm.password)}
                data-testid="user-dialog-save"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'es' ? 'Guardar' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Semester Dialog */}
        <Dialog open={semesterDialog} onOpenChange={setSemesterDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-green-600" />
                {editingSemester 
                  ? (language === 'es' ? 'Editar Semestre' : 'Edit Semester')
                  : (language === 'es' ? 'Nuevo Semestre' : 'New Semester')
                }
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Nombre (Inglés)' : 'Name (English)'}</Label>
                  <Input 
                    value={semesterForm.name}
                    onChange={(e) => setSemesterForm({...semesterForm, name: e.target.value})}
                    placeholder="Semester 1"
                    data-testid="semester-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Nombre (Español)' : 'Name (Spanish)'}</Label>
                  <Input 
                    value={semesterForm.name_es}
                    onChange={(e) => setSemesterForm({...semesterForm, name_es: e.target.value})}
                    placeholder="Semestre 1"
                    data-testid="semester-name-es-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Fecha de Inicio' : 'Start Date'}</Label>
                  <Input 
                    type="date"
                    value={semesterForm.start_date}
                    onChange={(e) => setSemesterForm({...semesterForm, start_date: e.target.value})}
                    data-testid="semester-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Fecha de Fin' : 'End Date'}</Label>
                  <Input 
                    type="date"
                    value={semesterForm.end_date}
                    onChange={(e) => setSemesterForm({...semesterForm, end_date: e.target.value})}
                    data-testid="semester-end-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'es' ? 'Año Escolar' : 'School Year'}</Label>
                <Select 
                  value={semesterForm.year_term} 
                  onValueChange={(v) => setSemesterForm({...semesterForm, year_term: v})}
                >
                  <SelectTrigger data-testid="semester-year-term">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                    <SelectItem value="2025-2026">2025-2026</SelectItem>
                    <SelectItem value="2026-2027">2026-2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <Switch 
                  id="is-active"
                  checked={semesterForm.is_active}
                  onCheckedChange={(checked) => setSemesterForm({...semesterForm, is_active: checked})}
                />
                <div>
                  <Label htmlFor="is-active" className="cursor-pointer">
                    {language === 'es' ? 'Semestre Activo' : 'Active Semester'}
                  </Label>
                  <p className="text-xs text-slate-500">
                    {language === 'es' 
                      ? 'Los maestros verán este semestre por defecto'
                      : 'Teachers will see this semester by default'}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSemesterDialog(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                onClick={saveSemester} 
                disabled={saving || !semesterForm.name || !semesterForm.start_date || !semesterForm.end_date}
                data-testid="semester-dialog-save"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'es' ? 'Guardar' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminPanel;
