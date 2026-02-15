import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, Calendar, Users, ClipboardList, CheckCircle, Globe, BarChart3, Mail } from 'lucide-react';
import { toast } from 'sonner';

const Landing = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    name: '',
    language: language
  });

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success(t('success'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({
        ...registerForm,
        role: 'teacher',
        language: language
      });
      toast.success(t('success'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Calendar, title: language === 'es' ? 'Planificador Semanal' : 'Weekly Planner', desc: language === 'es' ? 'Planifica tus lecciones como en tu planificador de papel' : 'Plan lessons just like your paper planner' },
    { icon: Users, title: language === 'es' ? 'Asistencia Fácil' : 'Easy Attendance', desc: language === 'es' ? 'Toma asistencia rápidamente desde cualquier dispositivo' : 'Take attendance quickly from any device' },
    { icon: ClipboardList, title: language === 'es' ? 'Cuaderno de Notas' : 'Gradebook', desc: language === 'es' ? 'Administra tareas y notas eficientemente' : 'Manage assignments and grades efficiently' },
    { icon: BookOpen, title: language === 'es' ? 'Exportar PDF' : 'PDF Export', desc: language === 'es' ? 'Exporta planes en el formato de tu escuela' : "Export plans in your school's format" },
    { icon: BarChart3, title: language === 'es' ? 'Generar Reportes' : 'Generate Reports', desc: language === 'es' ? 'Crea reportes de asistencia, calificaciones y progreso estudiantil' : 'Create attendance, grades, and student progress reports' },
    { icon: Mail, title: language === 'es' ? 'Portal para Padres' : 'Parent Portal', desc: language === 'es' ? 'Envía enlaces seguros a los padres para ver el progreso de sus hijos' : 'Send secure links to parents to view their child\'s progress' }
  ];

  return (
    <div className="min-h-screen hero-gradient">
      {/* Header */}
      <header className="border-b border-slate-200/50 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-center items-center relative">
          {/* Centered Logo and Name */}
          <div className="flex items-center gap-4">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/3f72aedc-992b-4d25-83bd-5bb47e46011f/images/0f969775d262b8ea24538b15f4cc9cbeaf4a878afa90805ec86f8619b9caac6c.png"
              alt="TeacherHubPro Logo"
              className="h-24 w-24 object-contain"
            />
            <span className="text-2xl font-heading font-bold text-slate-800">TeacherHubPro</span>
          </div>
          {/* Right side buttons */}
          <div className="absolute right-6 flex items-center gap-4">
            <Link to="/pricing">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex hover:bg-green-50 hover:text-green-700"
                data-testid="nav-pricing-btn"
              >
                {language === 'es' ? 'Precios' : 'Pricing'}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2 hover:bg-slate-100"
              data-testid="language-toggle"
            >
              <Globe className="h-4 w-4" />
              {language === 'es' ? 'EN' : 'ES'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left - Content */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              {language === 'es' ? '7 días de prueba gratis' : '7-day free trial'}
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-slate-800 tracking-tight leading-[1.1]">
              {language === 'es' 
                ? 'Tu planificador digital ' 
                : 'Your trusted '}
              <span className="gradient-text">{language === 'es' ? 'de confianza' : 'digital planner'}</span>
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg">
              {language === 'es'
                ? 'Reemplaza tu planificador de papel con una solución digital que se siente familiar. Planifica lecciones, toma asistencia y administra notas en un solo lugar.'
                : 'Replace your paper planner with a digital solution that feels familiar. Plan lessons, take attendance, and manage grades in one place.'}
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4 stagger-children">
              {features.map((feature, i) => (
                <div 
                  key={i} 
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/80 border border-slate-100 shadow-sm card-hover animate-fade-in opacity-0"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="p-2 rounded-lg bg-green-100">
                    <feature.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{feature.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Auth Card */}
          <div className="flex justify-center animate-scale-in">
            <Card className="w-full max-w-md shadow-2xl border-slate-100/50 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="font-heading text-2xl">{language === 'es' ? 'Comenzar' : 'Get Started'}</CardTitle>
                <CardDescription>
                  {language === 'es' ? 'Inicia sesión o crea una cuenta' : 'Sign in or create an account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Google Login */}
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-3 h-12 hover:bg-slate-50 hover:border-slate-300 transition-colors"
                  onClick={handleGoogleLogin}
                  data-testid="google-login-btn"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {t('signInWithGoogle')}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-500">{t('orContinueWith')}</span>
                  </div>
                </div>

                {/* Tabs for Login/Register */}
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" data-testid="login-tab">{t('login')}</TabsTrigger>
                    <TabsTrigger value="register" data-testid="register-tab">{t('register')}</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="space-y-4 mt-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t('email')}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="teacher@school.edu"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          data-testid="login-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">{t('password')}</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                          data-testid="login-password"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-submit">
                        {isLoading ? t('loading') : t('login')}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4 mt-4">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-name">{t('name')}</Label>
                        <Input
                          id="register-name"
                          placeholder={language === 'es' ? 'Nombre completo' : 'Full name'}
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                          data-testid="register-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-email">{t('email')}</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="teacher@school.edu"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                          required
                          data-testid="register-email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-password">{t('password')}</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                          required
                          data-testid="register-password"
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading} data-testid="register-submit">
                        {isLoading ? t('loading') : t('register')}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Image Section with Two Images */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-6 rounded-2xl overflow-hidden shadow-2xl">
          {/* First Image - Students learning */}
          <div className="relative group">
            <img 
              src="https://images.unsplash.com/photo-1681487097558-8856c9212cb0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwyfHx0dXRvciUyMHRlYWNoaW5nJTIwc21hbGwlMjBncm91cCUyMGNoaWxkcmVuJTIwYm9va3N8ZW58MHx8fHwxNzcwODY2Njk4fDA&ixlib=rb-4.1.0&q=85"
              alt="Students learning"
              className="w-full h-72 md:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-xl md:text-2xl font-heading font-semibold">
                {language === 'es' 
                  ? 'Aprendizaje efectivo'
                  : 'Effective learning'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm">{language === 'es' ? 'Fácil de usar' : 'Easy to use'}</span>
              </div>
            </div>
          </div>
          
          {/* Second Image - Teacher in classroom */}
          <div className="relative group">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/3f72aedc-992b-4d25-83bd-5bb47e46011f/images/76820941c89ae8cb85c96adec53aa25a00f80d4ac778cce72182a17404b8dc91.png"
              alt="Teacher in classroom"
              className="w-full h-72 md:h-80 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-xl md:text-2xl font-heading font-semibold">
                {language === 'es' 
                  ? 'Diseñado para maestros'
                  : 'Designed for teachers'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-sm">{language === 'es' ? 'Bilingüe' : 'Bilingual'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature badges below images */}
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <div className="flex items-center gap-2 bg-white shadow-md rounded-full px-5 py-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-slate-700">{language === 'es' ? 'Exportar PDF' : 'PDF Export'}</span>
          </div>
          <div className="flex items-center gap-2 bg-white shadow-md rounded-full px-5 py-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-slate-700">{language === 'es' ? 'Portal para Padres' : 'Parent Portal'}</span>
          </div>
          <div className="flex items-center gap-2 bg-white shadow-md rounded-full px-5 py-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-slate-700">{language === 'es' ? 'Reportes' : 'Reports'}</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 decorative-dots opacity-10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
            {language === 'es' ? '¿Listo para comenzar?' : 'Ready to get started?'}
          </h2>
          <p className="text-slate-300 mb-8 text-lg max-w-xl mx-auto">
            {language === 'es' 
              ? 'Únete a miles de maestros que ya transformaron su forma de planificar.' 
              : 'Join thousands of teachers who have transformed how they plan.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/pricing">
              <Button size="lg" className="bg-green-600 hover:bg-green-500 text-white shadow-lg btn-glow px-8 h-12" data-testid="cta-pricing-btn">
                {language === 'es' ? 'Ver Planes y Precios' : 'View Plans & Pricing'}
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white/10 h-12 px-8"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {language === 'es' ? 'Comenzar Gratis' : 'Start Free'}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-6">
            {/* Footer Links */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
              <Link to="/contact" className="text-slate-500 hover:text-slate-700 transition-colors">
                {language === 'es' ? 'Contacto' : 'Contact'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/privacy-policy" className="text-slate-500 hover:text-slate-700 transition-colors">
                {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/help" className="text-slate-500 hover:text-slate-700 transition-colors">
                {language === 'es' ? 'Ayuda' : 'Help'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/terms-of-use" className="text-slate-500 hover:text-slate-700 transition-colors">
                {language === 'es' ? 'Términos de Uso' : 'Terms of Use'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/cookies-policy" className="text-slate-500 hover:text-slate-700 transition-colors">
                {language === 'es' ? 'Política de Cookies' : 'Cookies Policy'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/accessibility" className="text-slate-500 hover:text-slate-700 transition-colors">
                {language === 'es' ? 'Accesibilidad' : 'Accessibility'}
              </Link>
            </div>
            
            {/* Logo and Copyright */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <img 
                  src="https://static.prod-images.emergentagent.com/jobs/3f72aedc-992b-4d25-83bd-5bb47e46011f/images/0f969775d262b8ea24538b15f4cc9cbeaf4a878afa90805ec86f8619b9caac6c.png"
                  alt="TeacherHubPro Logo"
                  className="h-10 w-10 object-contain"
                />
                <span className="font-heading font-bold text-slate-800">TeacherHubPro</span>
              </div>
              <p className="text-slate-500 text-sm">© 2026 TeacherHubPro. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
