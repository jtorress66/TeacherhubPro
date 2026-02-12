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
import { toast } from 'sonner';
import { 
  Building2, Users, BookOpen, GraduationCap, Calendar, 
  Plus, Edit, Trash2, Key, Loader2, Search, Upload,
  Palette, Shield, ChevronRight, BarChart3, School
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
  const [activeTab, setActiveTab] = useState('overview');
  
  // Dialog states
  const [schoolDialog, setSchoolDialog] = useState(false);
  const [userDialog, setUserDialog] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [schoolForm, setSchoolForm] = useState({
    name: '', address: '', phone: '', email: '', logo_url: '',
    primary_color: '#65A30D', secondary_color: '#334155', accent_color: '#F59E0B', font_family: 'Manrope'
  });
  const [userForm, setUserForm] = useState({
    email: '', name: '', password: '', school_id: '', role: 'teacher'
  });
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');

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
      const [overviewRes, schoolsRes, usersRes] = await Promise.all([
        axios.get(`${API}/super-admin/overview`, { withCredentials: true }),
        axios.get(`${API}/super-admin/schools`, { withCredentials: true }),
        axios.get(`${API}/super-admin/users`, { withCredentials: true })
      ]);
      setOverview(overviewRes.data);
      setSchools(schoolsRes.data.schools || []);
      setUsers(usersRes.data.users || []);
    } catch (error) {
      toast.error('Error loading admin data');
      console.error(error);
    } finally {
      setLoading(false);
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
          <TabsList className="bg-white border">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {language === 'es' ? 'Resumen' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="schools" className="gap-2">
              <Building2 className="h-4 w-4" />
              {language === 'es' ? 'Escuelas' : 'Schools'}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {language === 'es' ? 'Usuarios' : 'Users'}
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
                              <Button variant="ghost" size="sm" onClick={() => resetPassword(u.user_id)} title="Reset Password">
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openUserDialog(u)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {u.role !== 'super_admin' && (
                                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => deleteUser(u.user_id)}>
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
                      placeholder="Escuela Inmaculada Concepción"
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
              <Button variant="outline" onClick={() => setSchoolDialog(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button onClick={saveSchool} disabled={saving || !schoolForm.name}>
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setUserDialog(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                onClick={saveUser} 
                disabled={saving || !userForm.name || !userForm.email || !userForm.school_id || (!editingUser && !userForm.password)}
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
