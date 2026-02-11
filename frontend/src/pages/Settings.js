import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { User, Globe, Shield, Save, Building2, Upload, Image } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [savingSchool, setSavingSchool] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [school, setSchool] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolLogo, setSchoolLogo] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
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
    };
    fetchSchool();
  }, [user?.school_id]);

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
      </div>
    </Layout>
  );
};

export default Settings;
