import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, Calendar, Users, ClipboardList, CheckCircle, Globe } from 'lucide-react';
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
    { icon: BookOpen, title: language === 'es' ? 'Exportar PDF' : 'PDF Export', desc: language === 'es' ? 'Exporta planes en el formato de tu escuela' : "Export plans in your school's format" }
  ];

  return (
    <div className="min-h-screen paper-bg">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-slate-700" />
            <span className="text-2xl font-heading font-bold text-slate-800">TeacherHub</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/pricing">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex"
                data-testid="nav-pricing-btn"
              >
                {language === 'es' ? 'Precios' : 'Pricing'}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-2"
              data-testid="language-toggle"
            >
              <Globe className="h-4 w-4" />
              {language === 'es' ? 'EN' : 'ES'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left - Content */}
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-slate-800 tracking-tight leading-tight">
              {language === 'es' 
                ? 'Tu planificador digital de confianza' 
                : 'Your trusted digital planner'}
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              {language === 'es'
                ? 'Reemplaza tu planificador de papel con una solución digital que se siente familiar. Planifica lecciones, toma asistencia y administra notas en un solo lugar.'
                : 'Replace your paper planner with a digital solution that feels familiar. Plan lessons, take attendance, and manage grades in one place.'}
            </p>
            
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {features.map((feature, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm">
                  <feature.icon className="h-5 w-5 text-lime-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{feature.title}</p>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Auth Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-md shadow-lg border-slate-100">
              <CardHeader className="text-center pb-2">
                <CardTitle className="font-heading text-2xl">{language === 'es' ? 'Comenzar' : 'Get Started'}</CardTitle>
                <CardDescription>
                  {language === 'es' ? 'Inicia sesión o crea una cuenta' : 'Sign in or create an account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google Login */}
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-3 h-11"
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

      {/* Hero Image Section */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MDV8MHwxfHNlYXJjaHwzfHx0ZWFjaGVyJTIwY2xhc3Nyb29tJTIwaGFwcHl8ZW58MHx8fHwxNzcwNzY0MjMyfDA&ixlib=rb-4.1.0&q=85&w=1200"
            alt="Classroom"
            className="w-full h-64 md:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <p className="text-xl md:text-2xl font-heading font-semibold">
              {language === 'es' 
                ? 'Diseñado por maestros, para maestros'
                : 'Designed by teachers, for teachers'}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-lime-400" />
                <span className="text-sm">{language === 'es' ? 'Fácil de usar' : 'Easy to use'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-lime-400" />
                <span className="text-sm">{language === 'es' ? 'Bilingüe' : 'Bilingual'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-lime-400" />
                <span className="text-sm">{language === 'es' ? 'Exportar PDF' : 'PDF Export'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-800 mb-4">
            {language === 'es' ? 'Planes y Precios' : 'Plans & Pricing'}
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {language === 'es' 
              ? 'Comienza con 7 días gratis. Cancela en cualquier momento.' 
              : 'Start with a 7-day free trial. Cancel anytime.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative bg-white ${plan.popular ? 'ring-2 ring-lime-500 shadow-lg' : 'border-slate-200'}`}
              data-testid={`landing-plan-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-lime-500 text-white shadow">
                    {language === 'es' ? 'Más Popular' : 'Most Popular'}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2 pt-6">
                <div className="mx-auto mb-3 p-3 rounded-full bg-slate-100">
                  <plan.icon className="h-6 w-6 text-slate-700" />
                </div>
                <CardTitle className="text-xl font-heading">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-bold text-slate-800">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                
                {plan.savings && (
                  <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">
                    {plan.savings}
                  </Badge>
                )}
                
                <ul className="space-y-2 text-left text-sm mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-lime-600 hover:bg-lime-700' : ''}`}
                  onClick={() => {
                    // Scroll to the auth card at the top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  data-testid={`landing-cta-${plan.id}`}
                >
                  {language === 'es' ? 'Comenzar Gratis' : 'Start Free'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          {language === 'es' 
            ? '¿Necesitas un plan para tu distrito escolar? ' 
            : 'Need a plan for your school district? '}
          <a href="mailto:support@teacherhub.com" className="text-lime-600 hover:underline">
            {language === 'es' ? 'Contáctanos' : 'Contact us'}
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-slate-500 text-sm">
          <p>© 2024 TeacherHub. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
