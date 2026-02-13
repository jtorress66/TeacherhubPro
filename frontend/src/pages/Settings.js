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
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { toast } from 'sonner';
import { User, Globe, Shield, Save, Building2, Image, CreditCard, Crown, Users, UserCog, Loader2, CalendarDays, Plus, Edit, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [school, setSchool] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  
  // Admin management state
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(null);
  
  // Semester management state
  const [semesters, setSemesters] = useState([]);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [semesterDialog, setSemesterDialog] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [savingSemester, setSavingSemester] = useState(false);
  const [semesterForm, setSemesterForm] = useState({
    name: '', name_es: '', start_date: '', end_date: '', year_term: '2024-2025', is_active: false
  });

  useEffect(() => {
    const fetchData = async () => {
      // Fetch school data
      if (user?.school_id) {
        try {
          const res = await axios.get(`${API}/schools/${user.school_id}`, { withCredentials: true });
          setSchool(res.data);
          setSchoolName(res.data.name || '');
          setSchoolAddress(res.data.address || '');
          setSchoolPhone(res.data.phone || '');
          setSchoolEmail(res.data.email || '');
          setSchoolLogo(res.data.logo_url || '');
        } catch (error) {
          console.error('Error fetching school:', error);
        }
      }
      
      // Fetch subscription status
      try {
        const subRes = await axios.get(`${API}/subscription/status`, { withCredentials: true });
        setSubscriptionStatus(subRes.data);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
      
      // Fetch all users if admin
      if (user?.role === 'admin') {
        fetchAllUsers();
      }
      
      // Fetch semesters for all users
      fetchSemesters();
    };
    fetchData();
  }, [user?.school_id, user?.role]);

  const fetchSemesters = async () => {
    setLoadingSemesters(true);
    try {
      const res = await axios.get(`${API}/semesters`, { withCredentials: true });
      setSemesters(res.data || []);
    } catch (error) {
      console.error('Error fetching semesters:', error);
    } finally {
      setLoadingSemesters(false);
    }
  };

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
    setSavingSemester(true);
    try {
      if (editingSemester) {
        await axios.put(`${API}/semesters/${editingSemester.semester_id}`, semesterForm, { withCredentials: true });
        toast.success(language === 'es' ? 'Semestre actualizado' : 'Semester updated');
      } else {
        await axios.post(`${API}/semesters`, semesterForm, { withCredentials: true });
        toast.success(language === 'es' ? 'Semestre creado' : 'Semester created');
      }
      setSemesterDialog(false);
      fetchSemesters();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    } finally {
      setSavingSemester(false);
    }
  };

  const deleteSemester = async (semesterId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar este semestre?' : 'Delete this semester?')) return;
    try {
      await axios.delete(`${API}/semesters/${semesterId}`, { withCredentials: true });
      toast.success(language === 'es' ? 'Semestre eliminado' : 'Semester deleted');
      fetchSemesters();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    }
  };

  const toggleSemesterActive = async (semester) => {
    try {
      await axios.put(`${API}/semesters/${semester.semester_id}`, {
        is_active: !semester.is_active
      }, { withCredentials: true });
      fetchSemesters();
      toast.success(language === 'es' ? 'Estado actualizado' : 'Status updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error');
    }
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get(`${API}/admin/users`, { withCredentials: true });
      setAllUsers(res.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await axios.put(`${API}/admin/users/role`, {
        user_id: userId,
        role: newRole
      }, { withCredentials: true });
      
      // Update local state
      setAllUsers(prev => prev.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));
      
      toast.success(language === 'es' ? 'Rol actualizado' : 'Role updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || (language === 'es' ? 'Error al actualizar rol' : 'Error updating role'));
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, language });
      toast.success(language === 'es' ? 'Perfil actualizado' : 'Profile updated');
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchool = async () => {
    if (!user?.school_id) return;
    
    setSavingSchool(true);
    try {
      await axios.put(`${API}/schools/${user.school_id}`, {
        name: schoolName,
        address: schoolAddress,
        phone: schoolPhone,
        email: schoolEmail,
        logo_url: schoolLogo
      }, { withCredentials: true });
      toast.success(language === 'es' ? 'Escuela actualizada' : 'School updated');
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setSavingSchool(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-heading font-bold text-slate-800">{t('settings')}</h1>
          <p className="text-slate-500">{language === 'es' ? 'Configura tu cuenta' : 'Configure your account'}</p>
        </div>

        {/* Profile Settings */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <User className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{language === 'es' ? 'Perfil' : 'Profile'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Tu información personal' : 'Your personal information'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl font-medium text-slate-600">
                    {user?.name?.charAt(0) || 'T'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-slate-800">{user?.email}</p>
                <p className="text-sm text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>{t('name')}</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="settings-name-input"
              />
            </div>
            
            <Button onClick={handleSaveProfile} disabled={saving} data-testid="save-profile-btn">
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('loading') : t('save')}
            </Button>
          </CardContent>
        </Card>

        {/* School Settings */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{language === 'es' ? 'Escuela' : 'School'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Configuración de la escuela para PDF' : 'School settings for PDF export'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Preview & URL */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                {language === 'es' ? 'Logo de la Escuela (URL)' : 'School Logo (URL)'}
              </Label>
              <div className="flex gap-3 items-start">
                {schoolLogo && (
                  <div className="h-20 w-20 border rounded-lg bg-white p-1 flex items-center justify-center">
                    <img 
                      src={schoolLogo} 
                      alt="School Logo" 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  </div>
                )}
                <Input 
                  value={schoolLogo}
                  onChange={(e) => setSchoolLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="flex-1"
                  data-testid="school-logo-input"
                />
              </div>
              <p className="text-xs text-slate-500">
                {language === 'es' 
                  ? 'Ingresa la URL de la imagen del logo de tu escuela'
                  : 'Enter the URL of your school logo image'}
              </p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Nombre de la Escuela' : 'School Name'}</Label>
              <Input 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Colegio De La Inmaculada Concepción"
                data-testid="school-name-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Dirección' : 'Address'}</Label>
              <Input 
                value={schoolAddress}
                onChange={(e) => setSchoolAddress(e.target.value)}
                placeholder="P.O. Box 3400, Manatí, Puerto Rico 00674"
                data-testid="school-address-input"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Teléfono' : 'Phone'}</Label>
                <Input 
                  value={schoolPhone}
                  onChange={(e) => setSchoolPhone(e.target.value)}
                  placeholder="(787) 854-2079"
                  data-testid="school-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Correo' : 'Email'}</Label>
                <Input 
                  value={schoolEmail}
                  onChange={(e) => setSchoolEmail(e.target.value)}
                  placeholder="school@example.com"
                  data-testid="school-email-input"
                />
              </div>
            </div>
            
            <Button onClick={handleSaveSchool} disabled={savingSchool} data-testid="save-school-btn">
              <Save className="h-4 w-4 mr-2" />
              {savingSchool ? t('loading') : (language === 'es' ? 'Guardar Escuela' : 'Save School')}
            </Button>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-lime-100">
                <Globe className="h-5 w-5 text-lime-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{language === 'es' ? 'Idioma' : 'Language'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Preferencia de idioma' : 'Language preference'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">
                  {language === 'es' ? 'Español' : 'English'}
                </p>
                <p className="text-sm text-slate-500">
                  {language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">EN</span>
                <Switch 
                  checked={language === 'es'}
                  onCheckedChange={() => {
                    toggleLanguage();
                    toast.success(language === 'en' ? 'Idioma cambiado a español' : 'Language changed to English');
                  }}
                  data-testid="language-switch"
                />
                <span className="text-sm text-slate-500">ES</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{language === 'es' ? 'Cuenta' : 'Account'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Información de tu cuenta' : 'Your account information'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">{language === 'es' ? 'ID de Usuario' : 'User ID'}</span>
                <code className="text-sm bg-slate-100 px-2 py-1 rounded">{user?.user_id}</code>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">{language === 'es' ? 'ID de Escuela' : 'School ID'}</span>
                <code className="text-sm bg-slate-100 px-2 py-1 rounded">{user?.school_id || 'N/A'}</code>
              </div>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">{language === 'es' ? 'Rol' : 'Role'}</span>
                <span className="capitalize font-medium text-slate-800">{user?.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{language === 'es' ? 'Suscripción' : 'Subscription'}</CardTitle>
                <CardDescription>{language === 'es' ? 'Tu plan y estado de suscripción' : 'Your plan and subscription status'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {subscriptionStatus ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{language === 'es' ? 'Estado' : 'Status'}</span>
                  <Badge 
                    className={
                      subscriptionStatus.status === 'admin' ? 'bg-purple-100 text-purple-800' :
                      subscriptionStatus.status === 'active' ? 'bg-green-100 text-green-800' :
                      subscriptionStatus.status === 'trialing' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {subscriptionStatus.status === 'admin' && (language === 'es' ? 'Admin' : 'Admin')}
                    {subscriptionStatus.status === 'active' && (language === 'es' ? 'Activo' : 'Active')}
                    {subscriptionStatus.status === 'trialing' && (language === 'es' ? 'Prueba Gratis' : 'Free Trial')}
                    {subscriptionStatus.status === 'none' && (language === 'es' ? 'Sin Plan' : 'No Plan')}
                    {subscriptionStatus.status === 'trial_expired' && (language === 'es' ? 'Expirado' : 'Expired')}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">{language === 'es' ? 'Plan' : 'Plan'}</span>
                  <span className="font-medium text-slate-800 flex items-center gap-2">
                    {subscriptionStatus.plan === 'admin' && <Crown className="h-4 w-4 text-purple-500" />}
                    {subscriptionStatus.plan === 'free_trial' && (language === 'es' ? 'Prueba Gratis' : 'Free Trial')}
                    {subscriptionStatus.plan === 'individual_monthly' && (language === 'es' ? 'Mensual Individual' : 'Individual Monthly')}
                    {subscriptionStatus.plan === 'individual_yearly' && (language === 'es' ? 'Anual Individual' : 'Individual Yearly')}
                    {subscriptionStatus.plan === 'school' && (language === 'es' ? 'Plan Escolar' : 'School Plan')}
                    {subscriptionStatus.plan === 'district' && (language === 'es' ? 'Plan de Distrito' : 'District Plan')}
                    {subscriptionStatus.plan === 'admin' && (language === 'es' ? 'Acceso Admin' : 'Admin Access')}
                    {!subscriptionStatus.plan && 'N/A'}
                  </span>
                </div>
                
                {subscriptionStatus.days_left !== undefined && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{language === 'es' ? 'Días Restantes' : 'Days Remaining'}</span>
                      <span className="font-medium text-amber-600">{subscriptionStatus.days_left} {language === 'es' ? 'días' : 'days'}</span>
                    </div>
                  </>
                )}
                
                {subscriptionStatus.subscription?.current_period_end && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{language === 'es' ? 'Próxima Facturación' : 'Next Billing'}</span>
                      <span className="font-medium text-slate-800">
                        {new Date(subscriptionStatus.subscription.current_period_end).toLocaleDateString()}
                      </span>
                    </div>
                  </>
                )}
                
                <Separator />
                
                <div className="pt-2">
                  {subscriptionStatus.status !== 'admin' && (
                    <Button 
                      onClick={() => navigate('/pricing')} 
                      variant={subscriptionStatus.has_access ? "outline" : "default"}
                      className="w-full"
                      data-testid="manage-subscription-btn"
                    >
                      {subscriptionStatus.has_access 
                        ? (language === 'es' ? 'Cambiar Plan' : 'Change Plan')
                        : (language === 'es' ? 'Suscribirse' : 'Subscribe Now')}
                    </Button>
                  )}
                  {subscriptionStatus.status === 'admin' && (
                    <p className="text-sm text-center text-purple-600">
                      {language === 'es' 
                        ? 'Las cuentas de administrador tienen acceso completo sin pago' 
                        : 'Admin accounts have full access without payment'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-slate-500">{language === 'es' ? 'Cargando...' : 'Loading...'}</p>
            )}
          </CardContent>
        </Card>

        {/* Admin Management - Only visible to admins */}
        {user?.role === 'admin' && (
          <Card className="bg-white border-slate-100 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <UserCog className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {language === 'es' ? 'Gestión de Usuarios' : 'User Management'}
                    <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
                  </CardTitle>
                  <CardDescription>
                    {language === 'es' ? 'Gestionar roles de usuarios' : 'Manage user roles'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : allUsers.length > 0 ? (
                <div className="space-y-3">
                  {allUsers.map((u) => (
                    <div 
                      key={u.user_id} 
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
                      data-testid={`user-row-${u.user_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-medium shadow-sm">
                          {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.name || 'Unknown'}</p>
                          <p className="text-sm text-slate-500">{u.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {u.user_id === user?.user_id ? (
                          <Badge className="bg-purple-100 text-purple-800">
                            {language === 'es' ? 'Tú (Admin)' : 'You (Admin)'}
                          </Badge>
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(value) => handleUpdateUserRole(u.user_id, value)}
                            disabled={updatingRole === u.user_id}
                          >
                            <SelectTrigger 
                              className="w-32" 
                              data-testid={`role-select-${u.user_id}`}
                            >
                              {updatingRole === u.user_id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <SelectValue />
                              )}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="teacher">
                                <span className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {language === 'es' ? 'Maestro' : 'Teacher'}
                                </span>
                              </SelectItem>
                              <SelectItem value="admin">
                                <span className="flex items-center gap-2">
                                  <Crown className="h-4 w-4 text-purple-500" />
                                  Admin
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">
                  {language === 'es' ? 'No hay usuarios' : 'No users found'}
                </p>
              )}
              
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>{language === 'es' ? 'Nota:' : 'Note:'}</strong>{' '}
                  {language === 'es' 
                    ? 'Los usuarios con rol de Admin tienen acceso completo a todas las funciones sin necesidad de suscripción.'
                    : 'Users with Admin role have full access to all features without requiring a subscription.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Semester Management - Available to all users */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CalendarDays className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{language === 'es' ? 'Semestres' : 'Semesters'}</CardTitle>
                  <CardDescription>
                    {language === 'es' ? 'Administra los períodos académicos' : 'Manage academic periods'}
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => openSemesterDialog()} data-testid="new-semester-btn">
                <Plus className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Nuevo' : 'New'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSemesters ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            ) : semesters.length > 0 ? (
              <div className="space-y-3">
                {semesters.map(semester => (
                  <div key={semester.semester_id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${semester.is_active ? 'bg-green-100' : 'bg-slate-200'}`}>
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
                      <Button variant="outline" size="sm" onClick={() => openSemesterDialog(semester)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => deleteSemester(semester.semester_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 mb-4">
                  {language === 'es' ? 'No hay semestres. Crea uno para organizar tus clases y calificaciones.' : 'No semesters. Create one to organize your classes and grades.'}
                </p>
                <Button onClick={() => openSemesterDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Crear Primer Semestre' : 'Create First Semester'}
                </Button>
              </div>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>{language === 'es' ? 'Consejo:' : 'Tip:'}</strong>{' '}
                {language === 'es' 
                  ? 'El semestre activo se mostrará por defecto en el libro de calificaciones y reportes.'
                  : 'The active semester will be shown by default in the gradebook and reports.'}
              </p>
            </div>
          </CardContent>
        </Card>

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
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Nombre (Español)' : 'Name (Spanish)'}</Label>
                  <Input 
                    value={semesterForm.name_es}
                    onChange={(e) => setSemesterForm({...semesterForm, name_es: e.target.value})}
                    placeholder="Semestre 1"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Fecha de Fin' : 'End Date'}</Label>
                  <Input 
                    type="date"
                    value={semesterForm.end_date}
                    onChange={(e) => setSemesterForm({...semesterForm, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === 'es' ? 'Año Escolar' : 'School Year'}</Label>
                <Select 
                  value={semesterForm.year_term} 
                  onValueChange={(v) => setSemesterForm({...semesterForm, year_term: v})}
                >
                  <SelectTrigger>
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
                      ? 'Se mostrará por defecto en calificaciones y reportes'
                      : 'Will be shown by default in gradebook and reports'}
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
                disabled={savingSemester || !semesterForm.name || !semesterForm.start_date || !semesterForm.end_date}
              >
                {savingSemester && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'es' ? 'Guardar' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Settings;
