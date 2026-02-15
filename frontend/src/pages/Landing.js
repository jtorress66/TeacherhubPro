import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, Calendar, Users, ClipboardList, CheckCircle, Globe, BarChart3, Mail, Palette, Shield, Building2, Sparkles, ArrowRight, FileText, GraduationCap, School, Printer } from 'lucide-react';
import { toast } from 'sonner';

const Landing = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    name: '',
    language: language
  });

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = () => {
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

  // Floating animated cards data
  const floatingCards = [
    { label: language === 'es' ? 'Planificación' : 'Lesson Plan', value: 'Unit 5 - Week 3', color: 'bg-green-500', delay: '0s' },
    { label: language === 'es' ? 'Asistencia' : 'Attendance', value: '28/30', color: 'bg-blue-500', delay: '0.5s' },
    { label: language === 'es' ? 'Calificaciones' : 'Grades', value: 'A (95%)', color: 'bg-purple-500', delay: '1s' },
    { label: language === 'es' ? 'PDF Listo' : 'PDF Ready', value: language === 'es' ? 'Exportar' : 'Export', color: 'bg-orange-500', delay: '1.5s' },
  ];

  const partnerSchools = [
    { name: 'Academia San José', icon: School },
    { name: 'Colegio Santa María', icon: GraduationCap },
    { name: 'Instituto Bilingüe', icon: Building2 },
    { name: 'Escuela Montessori', icon: BookOpen },
    { name: 'Colegio San Juan', icon: School },
    { name: 'Academia del Valle', icon: GraduationCap },
  ];

  const featureShowcase = [
    {
      title: language === 'es' ? 'Planifica más rápido' : 'Plan faster',
      desc: language === 'es' 
        ? 'Crea planes de lección semanales en segundos con nuestro formato intuitivo.' 
        : 'Create weekly lesson plans in seconds with our intuitive format.',
      visual: (
        <div className="bg-white rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">{language === 'es' ? 'Semana 1' : 'Week 1'}</div>
              <div className="text-xs text-slate-500">Feb 10 - Feb 14</div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 text-xs">
            {['L', 'M', 'Mi', 'J', 'V'].map((day, i) => (
              <div key={i} className="bg-green-50 p-2 rounded text-center">
                <div className="font-semibold text-green-700">{day}</div>
                <div className="w-full h-1 bg-green-400 rounded mt-1"></div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: language === 'es' ? 'Tu marca, tu estilo' : 'Your brand, your style',
      desc: language === 'es' 
        ? 'Personaliza con el logo y colores de tu escuela en todos los documentos.' 
        : 'Customize with your school\'s logo and colors on all documents.',
      visual: (
        <div className="bg-white rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">Colegio San José</div>
              <div className="text-xs text-slate-500">{language === 'es' ? 'Marca personalizada' : 'Custom branding'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500"></div>
            <div className="w-8 h-8 rounded-full bg-purple-500"></div>
            <div className="w-8 h-8 rounded-full bg-green-500"></div>
            <div className="flex-1 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"></div>
          </div>
        </div>
      )
    },
    {
      title: language === 'es' ? 'Exporta profesionalmente' : 'Export professionally',
      desc: language === 'es' 
        ? 'Genera PDFs listos para imprimir con el formato exacto de tu escuela.' 
        : 'Generate print-ready PDFs with your school\'s exact format.',
      visual: (
        <div className="bg-white rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <span className="font-semibold text-slate-800">lesson_plan.pdf</span>
            </div>
            <Printer className="h-5 w-5 text-slate-400" />
          </div>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-3 bg-slate-50">
            <div className="h-2 w-3/4 bg-slate-300 rounded mb-2"></div>
            <div className="h-2 w-1/2 bg-slate-300 rounded mb-3"></div>
            <div className="grid grid-cols-5 gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-green-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/3f72aedc-992b-4d25-83bd-5bb47e46011f/images/0f969775d262b8ea24538b15f4cc9cbeaf4a878afa90805ec86f8619b9caac6c.png"
              alt="TeacherHubPro Logo"
              className="h-16 w-16 object-contain"
            />
            <span className="text-xl font-bold text-slate-800">TeacherHubPro</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              {language === 'es' ? 'Funciones' : 'Features'}
            </a>
            <a href="#customization" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              {language === 'es' ? 'Personalización' : 'Customization'}
            </a>
            <Link to="/pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              {language === 'es' ? 'Precios' : 'Pricing'}
            </Link>
            <a href="#get-started" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              {language === 'es' ? 'Iniciar sesión' : 'Log in'}
            </a>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-1"
              data-testid="language-toggle"
            >
              <Globe className="h-4 w-4" />
              {language === 'es' ? 'EN' : 'ES'}
            </Button>
            <Button 
              size="sm" 
              className="bg-slate-900 hover:bg-slate-800 text-white"
              onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
            >
              {language === 'es' ? 'Comenzar' : 'Get started'}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {language === 'es' ? 'Diseñado para maestros' : 'Built for teachers'}
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                {language === 'es' ? (
                  <>El planificador <span className="text-green-600">digital</span> para tu escuela</>
                ) : (
                  <>The <span className="text-green-600">digital</span> planner for your school</>
                )}
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-lg">
                {language === 'es' 
                  ? 'TeacherHubPro te ayuda a planificar, dar seguimiento y reportar de forma rápida y segura con el formato de tu escuela.' 
                  : 'TeacherHubPro helps you plan, track, and report quickly and securely with your school\'s format.'}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-14 text-lg"
                  onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
                >
                  {language === 'es' ? 'Comenzar gratis' : 'Start free'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="px-8 h-14 text-lg border-slate-300">
                    {language === 'es' ? 'Ver precios' : 'View pricing'}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Animated Visual */}
            <div className="relative z-10 hidden lg:block">
              <div className="relative w-full h-[500px]">
                {/* Floating cards animation */}
                {floatingCards.map((card, index) => (
                  <div 
                    key={index}
                    className="absolute bg-white rounded-xl shadow-xl p-4 animate-float"
                    style={{
                      top: `${20 + (index * 20)}%`,
                      left: `${10 + (index * 15)}%`,
                      animationDelay: card.delay,
                      zIndex: floatingCards.length - index
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                        {index === 0 && <Calendar className="h-5 w-5 text-white" />}
                        {index === 1 && <Users className="h-5 w-5 text-white" />}
                        {index === 2 && <BarChart3 className="h-5 w-5 text-white" />}
                        {index === 3 && <FileText className="h-5 w-5 text-white" />}
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">{card.label}</div>
                        <div className="font-semibold text-slate-800">{card.value}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Main planner mockup */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 bg-white rounded-2xl shadow-2xl p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold text-slate-800">TeacherHubPro</span>
                    </div>
                    <div className="w-8 h-8 bg-slate-100 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    <div className="grid grid-cols-5 gap-2 mt-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-green-50 rounded-lg border border-green-100"></div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1 h-10 bg-green-500 rounded-lg"></div>
                      <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by Schools - Logo Carousel */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-slate-500 mb-8">
            {language === 'es' ? 'Usado por escuelas en Puerto Rico y más' : 'Used by schools in Puerto Rico and beyond'}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60">
            {partnerSchools.map((school, index) => (
              <div key={index} className="flex items-center gap-2 text-slate-600">
                <school.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{school.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase - Interactive */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'es' ? 'Todo lo que necesitas' : 'Everything you need'}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {language === 'es' 
                ? 'Desde planificación hasta reportes, TeacherHubPro simplifica tu trabajo diario.' 
                : 'From planning to reports, TeacherHubPro simplifies your daily work.'}
            </p>
          </div>

          {/* Feature Cards - Animated */}
          <div className="grid md:grid-cols-3 gap-8">
            {featureShowcase.map((feature, index) => (
              <div 
                key={index}
                className={`transition-all duration-500 ${activeFeature === index ? 'scale-105' : 'scale-100 opacity-80'}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="mb-6">
                  {feature.visual}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customization Section */}
      <section id="customization" className="py-24 px-6 bg-gradient-to-b from-slate-900 to-slate-800 text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-green-400 text-sm font-medium mb-6">
                <Palette className="h-4 w-4" />
                {language === 'es' ? 'Personalización total' : 'Full customization'}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {language === 'es' 
                  ? 'Tu escuela, tu marca, tu plataforma' 
                  : 'Your school, your brand, your platform'}
              </h2>
              
              <p className="text-xl text-slate-300 mb-8">
                {language === 'es'
                  ? 'Cada escuela tiene su identidad. TeacherHubPro se adapta completamente a la tuya.'
                  : 'Every school has its identity. TeacherHubPro fully adapts to yours.'}
              </p>

              <div className="space-y-4">
                {[
                  { icon: Building2, text: language === 'es' ? 'Logo de tu escuela en todos los documentos' : 'Your school logo on all documents' },
                  { icon: Palette, text: language === 'es' ? 'Colores personalizados que coinciden con tu marca' : 'Custom colors that match your brand' },
                  { icon: FileText, text: language === 'es' ? 'Formatos de PDF exactos de tu escuela' : 'Your school\'s exact PDF formats' },
                  { icon: Shield, text: language === 'es' ? 'Panel de administración centralizado' : 'Centralized admin dashboard' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-green-400" />
                    </div>
                    <span className="text-slate-200">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Demo */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 text-slate-900">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <School className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold">Colegio San José</div>
                    <div className="text-sm text-slate-500">{language === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}</div>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">{language === 'es' ? 'Maestro' : 'Teacher'}</div>
                      <div className="font-medium">María González</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{language === 'es' ? 'Grado' : 'Grade'}</div>
                      <div className="font-medium">4-A</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-5 gap-1">
                    {['L', 'M', 'Mi', 'J', 'V'].map((day, i) => (
                      <div key={i} className="bg-blue-50 p-3 rounded text-center text-xs font-medium text-blue-700">
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {language === 'es' ? 'Tu logo aquí' : 'Your logo here'}
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {language === 'es' ? 'Tus colores' : 'Your colors'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section id="get-started" className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-blue-50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text and Benefits */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {language === 'es' ? '7 días gratis' : '7 days free'}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                {language === 'es' ? 'Comienza hoy' : 'Get started today'}
              </h2>
              
              <p className="text-xl text-slate-600 mb-8">
                {language === 'es' 
                  ? 'Únete a miles de maestros que ya transformaron su planificación.' 
                  : 'Join thousands of teachers who have transformed their planning.'}
              </p>

              {/* Benefits list */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: CheckCircle, text: language === 'es' ? 'Sin tarjeta de crédito requerida' : 'No credit card required' },
                  { icon: CheckCircle, text: language === 'es' ? 'Configuración en 2 minutos' : 'Setup in 2 minutes' },
                  { icon: CheckCircle, text: language === 'es' ? 'Cancela en cualquier momento' : 'Cancel anytime' },
                  { icon: CheckCircle, text: language === 'es' ? 'Soporte en español e inglés' : 'Support in Spanish & English' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 justify-center lg:justify-start">
                    <item.icon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-600">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                      {['M', 'J', 'L', 'A'][i]}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">500+</span> {language === 'es' ? 'maestros activos' : 'active teachers'}
                </div>
              </div>
            </div>

            {/* Right - Auth Card */}
            <div>
              <Card className="shadow-2xl border-0 overflow-hidden bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="w-full rounded-none border-b bg-slate-50/80 p-0 h-auto">
                      <TabsTrigger 
                        value="login" 
                        className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-green-500 font-medium"
                        data-testid="login-tab"
                      >
                        {language === 'es' ? 'Iniciar sesión' : 'Sign in'}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register"
                        className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-green-500 font-medium"
                        data-testid="register-tab"
                      >
                        {language === 'es' ? 'Crear cuenta' : 'Create account'}
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-8">
                      {/* Google Auth Button */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 mb-6 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
                        onClick={handleGoogleLogin}
                        data-testid="google-login-btn"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
                      </Button>

                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-500">
                        {language === 'es' ? 'o con email' : 'or with email'}
                      </span>
                    </div>
                  </div>

                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email" className="text-slate-700">{language === 'es' ? 'Correo electrónico' : 'Email'}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                          placeholder="tu@email.com"
                          className="mt-1 h-12"
                          required
                          data-testid="login-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="login-password" className="text-slate-700">{language === 'es' ? 'Contraseña' : 'Password'}</Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                          className="mt-1 h-12"
                          required
                          data-testid="login-password"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white"
                        disabled={isLoading}
                        data-testid="login-submit"
                      >
                        {isLoading ? '...' : (language === 'es' ? 'Iniciar sesión' : 'Sign in')}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-0">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Label htmlFor="register-name" className="text-slate-700">{language === 'es' ? 'Nombre completo' : 'Full name'}</Label>
                        <Input
                          id="register-name"
                          value={registerForm.name}
                          onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                          className="mt-1 h-12"
                          required
                          data-testid="register-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-email" className="text-slate-700">{language === 'es' ? 'Correo electrónico' : 'Email'}</Label>
                        <Input
                          id="register-email"
                          type="email"
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                          placeholder="tu@email.com"
                          className="mt-1 h-12"
                          required
                          data-testid="register-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="register-password" className="text-slate-700">{language === 'es' ? 'Contraseña' : 'Password'}</Label>
                        <Input
                          id="register-password"
                          type="password"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                          className="mt-1 h-12"
                          required
                          data-testid="register-password"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
                        disabled={isLoading}
                        data-testid="register-submit"
                      >
                        {isLoading ? '...' : (language === 'es' ? 'Crear cuenta gratis' : 'Create free account')}
                      </Button>
                    </form>
                  </TabsContent>
                </div>
              </Tabs>
                </CardContent>
              </Card>
            </div>
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
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <img 
                  src="https://static.prod-images.emergentagent.com/jobs/3f72aedc-992b-4d25-83bd-5bb47e46011f/images/0f969775d262b8ea24538b15f4cc9cbeaf4a878afa90805ec86f8619b9caac6c.png"
                  alt="TeacherHubPro Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="font-semibold text-slate-800">TeacherHubPro</span>
              </div>
              <span className="text-slate-300 hidden md:inline">•</span>
              <div className="text-sm text-slate-500">
                © 2026 TeacherHubPro. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
