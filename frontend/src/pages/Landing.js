import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, Calendar, Users, ClipboardList, CheckCircle, Globe, BarChart3, Mail, Palette, Shield, Building2, Sparkles, ArrowRight, FileText, GraduationCap, School, Printer, Bot, Zap, Brain, FileQuestion, Lightbulb, Target, Wand2, Star, Layers, Copy, CalendarDays, Link2, ExternalLink } from 'lucide-react';
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
      setActiveFeature((prev) => (prev + 1) % 4);
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
    { label: language === 'es' ? 'Planificación IA' : 'AI Lesson Plan', value: 'Unit 5 - Week 3', color: 'bg-cyan-500', delay: '0s' },
    { label: language === 'es' ? 'Presentaciones' : 'Presentations', value: '🎯 6 slides', color: 'bg-purple-500', delay: '0.5s' },
    { label: language === 'es' ? 'Calificaciones' : 'Grades', value: 'A (95%)', color: 'bg-blue-500', delay: '1s' },
    { label: language === 'es' ? 'Asistencia' : 'Attendance', value: '28/30', color: 'bg-green-500', delay: '1.5s' },
  ];

  const partnerSchools = [
    { name: 'Valley High School', icon: School },
    { name: 'Riverside Academy', icon: GraduationCap },
    { name: 'Bilingual Institute', icon: Building2 },
    { name: 'Montessori School', icon: BookOpen },
    { name: 'Lincoln Elementary', icon: School },
    { name: 'Westside Prep', icon: GraduationCap },
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
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">{language === 'es' ? 'Semana 1' : 'Week 1'}</div>
              <div className="text-xs text-slate-500">Feb 10 - Feb 14</div>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-1 text-xs">
            {['L', 'M', 'Mi', 'J', 'V'].map((day, i) => (
              <div key={i} className="bg-cyan-50 p-2 rounded text-center">
                <div className="font-semibold text-cyan-700">{day}</div>
                <div className="w-full h-1 bg-cyan-400 rounded mt-1"></div>
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
              <div className="font-semibold text-slate-800">{language === 'es' ? 'Tu Escuela' : 'Your School'}</div>
              <div className="text-xs text-slate-500">{language === 'es' ? 'Marca personalizada' : 'Custom branding'}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500"></div>
            <div className="w-8 h-8 rounded-full bg-purple-500"></div>
            <div className="w-8 h-8 rounded-full bg-cyan-500"></div>
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
                <div key={i} className="h-8 bg-cyan-100 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: language === 'es' ? 'Asistente de IA' : 'AI Assistant',
      desc: language === 'es' 
        ? 'Genera materiales educativos basados en estándares nacionales al instante.' 
        : 'Generate educational materials based on national standards instantly.',
      visual: (
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">{language === 'es' ? 'Claude AI' : 'Claude AI'}</div>
              <div className="text-xs text-white/70">{language === 'es' ? 'Powered by Anthropic' : 'Powered by Anthropic'}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <Zap className="h-4 w-4" />
              <span>{language === 'es' ? 'Planes de lección' : 'Lesson plans'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <Brain className="h-4 w-4" />
              <span>{language === 'es' ? 'Quizzes y exámenes' : 'Quizzes & tests'}</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Minimal Header with Gradient */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-cyan-50/95 via-blue-50/90 to-white/95 backdrop-blur-lg border-b border-cyan-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 sm:gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-12 w-12 sm:h-24 sm:w-24 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-base sm:text-2xl font-bold text-slate-800">TeacherHubPro</span>
              <span className="text-[10px] sm:text-xs font-medium text-cyan-600 hidden sm:block">{language === 'es' ? 'Tu aula digital' : 'Your digital classroom'}</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {language === 'es' ? 'Funciones' : 'Features'}
            </a>
            <a href="#ai-assistant" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {language === 'es' ? 'Asistente IA' : 'AI Assistant'}
            </a>
            <a href="#ai-features" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {language === 'es' ? 'IA Avanzada' : 'Advanced AI'}
            </a>
            <a href="#integrations" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {language === 'es' ? 'Integraciones' : 'Integrations'}
            </a>
            <a href="#customization" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {language === 'es' ? 'Personalización' : 'Customization'}
            </a>
            <Link to="/pricing" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {language === 'es' ? 'Precios' : 'Pricing'}
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2"
              data-testid="language-toggle"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'es' ? 'EN' : 'ES'}</span>
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md text-xs sm:text-sm px-3 sm:px-4"
              onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="hidden sm:inline">{language === 'es' ? 'Comenzar - Iniciar sesión' : 'Get Started - Log In'}</span>
              <span className="sm:hidden">{language === 'es' ? 'Comenzar' : 'Start'}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Enhanced Gradient */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-gradient-to-br from-cyan-50/50 via-blue-50/30 to-transparent">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Text Content */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {language === 'es' ? 'Diseñado para maestros' : 'Built for teachers'}
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                {language === 'es' ? (
                  <>Tu aula <span className="text-cyan-600">completa</span> en una plataforma</>
                ) : (
                  <>Your <span className="text-cyan-600">complete</span> classroom in one platform</>
                )}
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-lg">
                {language === 'es' 
                  ? 'Planificación con IA, presentaciones interactivas, calificaciones, asistencia, y más. Todo lo que necesitas para enseñar mejor.' 
                  : 'AI-powered lesson planning, interactive presentations, gradebook, attendance, and more. Everything you need to teach better.'}
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
                  <Button size="lg" variant="outline" className="px-8 h-14 text-lg border-slate-300 text-slate-800 hover:text-slate-900 hover:bg-slate-100">
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
                      <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
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
                        <div key={i} className="h-16 bg-cyan-50 rounded-lg border border-cyan-100"></div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <div className="flex-1 h-10 bg-cyan-500 rounded-lg"></div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featureShowcase.map((feature, index) => (
              <div 
                key={index}
                className={`transition-all duration-500 ${activeFeature === index ? 'scale-105' : 'scale-100 opacity-80'}`}
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className="mb-6">
                  {feature.visual}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Teaching Assistant Section */}
      <section id="ai-assistant" className="py-24 px-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Visual Demo */}
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl shadow-2xl p-8 text-white relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Bot className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{language === 'es' ? 'Asistente de IA' : 'AI Teaching Assistant'}</div>
                      <div className="text-sm text-white/70 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                        Claude Sonnet 4.5
                      </div>
                    </div>
                  </div>
                  
                  {/* Demo chat interface */}
                  <div className="space-y-3 mb-6">
                    <div className="bg-white/10 rounded-lg p-3 text-sm backdrop-blur-sm">
                      <div className="text-white/60 text-xs mb-1">{language === 'es' ? 'Tú preguntaste:' : 'You asked:'}</div>
                      {language === 'es' 
                        ? '¿Cómo puedo enseñar fracciones equivalentes a 4to grado?' 
                        : 'How can I teach equivalent fractions to 4th grade?'}
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 text-sm backdrop-blur-sm">
                      <div className="text-white/60 text-xs mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> 
                        {language === 'es' ? 'Respuesta IA:' : 'AI Response:'}
                      </div>
                      {language === 'es' 
                        ? 'Aquí tienes un plan de lección basado en el estándar CCSS.MATH.4.NF.A.1 con actividades manipulativas...' 
                        : "Here's a lesson plan based on CCSS.MATH.4.NF.A.1 standard with hands-on activities..."}
                    </div>
                  </div>

                  {/* Tool buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: BookOpen, label: language === 'es' ? 'Planes de Lección' : 'Lesson Plans' },
                      { icon: FileQuestion, label: language === 'es' ? 'Quizzes' : 'Quizzes' },
                      { icon: ClipboardList, label: language === 'es' ? 'Hojas de Trabajo' : 'Worksheets' },
                      { icon: Lightbulb, label: language === 'es' ? 'Ideas' : 'Ideas' },
                    ].map((tool, i) => (
                      <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 text-sm backdrop-blur-sm">
                        <tool.icon className="h-4 w-4" />
                        {tool.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Text Content */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {language === 'es' ? 'Nuevo: Inteligencia Artificial' : 'New: Artificial Intelligence'}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                {language === 'es' 
                  ? 'Tu asistente de IA para enseñar mejor' 
                  : 'Your AI assistant to teach better'}
              </h2>
              
              <p className="text-xl text-slate-600 mb-8">
                {language === 'es'
                  ? 'Genera planes de lección, quizzes, resúmenes y actividades basadas en los estándares Common Core y Puerto Rico, al instante.'
                  : 'Generate lesson plans, quizzes, summaries, and activities based on Common Core and Puerto Rico standards, instantly.'}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Target, text: language === 'es' ? 'Alineado con Common Core y PR CORE' : 'Aligned with Common Core & PR CORE' },
                  { icon: Zap, text: language === 'es' ? 'Genera contenido en segundos' : 'Generate content in seconds' },
                  { icon: Globe, text: language === 'es' ? 'Bilingüe: Español e Inglés' : 'Bilingual: Spanish & English' },
                  { icon: Brain, text: language === 'es' ? 'Powered by Claude Sonnet 4.5' : 'Powered by Claude Sonnet 4.5' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="text-slate-700">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                  onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
                >
                  {language === 'es' ? 'Probar gratis' : 'Try it free'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="h-4 w-4" />
                  {language === 'es' ? 'Incluido en suscripción' : 'Included in subscription'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Showcase - Detailed */}
      <section id="ai-features" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 text-sm font-medium mb-4">
              <Wand2 className="h-4 w-4" />
              {language === 'es' ? 'Funciones de IA Avanzadas' : 'Advanced AI Features'}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'es' ? 'Planificación inteligente con IA' : 'Intelligent planning with AI'}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {language === 'es' 
                ? 'Desde generar un plan completo hasta sugerencias diarias, la IA te ayuda en cada paso.' 
                : 'From generating a complete plan to daily suggestions, AI helps you every step of the way.'}
            </p>
          </div>

          {/* AI Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Generate Full Week */}
            <div className="group bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100 hover:shadow-xl hover:border-purple-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CalendarDays className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'es' ? 'Genera Semana Completa' : 'Generate Full Week'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'es' 
                  ? 'Con un clic, genera actividades para los 5 días con progresión pedagógica: introducción → práctica → dominio → evaluación.'
                  : 'With one click, generate activities for all 5 days with pedagogical progression: intro → practice → mastery → assessment.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">5 {language === 'es' ? 'días' : 'days'}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{language === 'es' ? 'Progresión' : 'Progression'}</span>
              </div>
            </div>

            {/* Feature 2: Daily AI Suggestions */}
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'es' ? 'Sugerencias por Día' : 'Daily Suggestions'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'es' 
                  ? 'Cada día muestra su fase pedagógica (Introducción, Práctica, Dominio). Obtén sugerencias específicas para cada etapa.'
                  : 'Each day shows its pedagogical phase (Introduction, Practice, Mastery). Get specific suggestions for each stage.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{language === 'es' ? 'Lunes → Viernes' : 'Mon → Fri'}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{language === 'es' ? 'Contextual' : 'Contextual'}</span>
              </div>
            </div>

            {/* Feature 3: AI Templates */}
            <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 hover:shadow-xl hover:border-amber-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'es' ? 'Plantillas Reutilizables' : 'Reusable Templates'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'es' 
                  ? 'Guarda tus mejores planes como plantillas. Clona y personaliza para nuevos temas con un clic.'
                  : 'Save your best plans as templates. Clone and customize for new topics with one click.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">{language === 'es' ? 'Guardar' : 'Save'}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">{language === 'es' ? 'Clonar' : 'Clone'}</span>
              </div>
            </div>

            {/* Feature 4: Starter Templates */}
            <div className="group bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100 hover:shadow-xl hover:border-cyan-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'es' ? '5 Plantillas Iniciales' : '5 Starter Templates'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'es' 
                  ? 'Comienza inmediatamente con plantillas profesionales: Fracciones, Comprensión Lectora, Método Científico, Escritura y Multiplicación.'
                  : 'Start immediately with pro templates: Fractions, Reading Comprehension, Scientific Method, Writing, and Multiplication.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{language === 'es' ? 'Matemáticas' : 'Math'}</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{language === 'es' ? 'Lectura' : 'ELA'}</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{language === 'es' ? 'Ciencias' : 'Science'}</span>
              </div>
            </div>

            {/* Feature 5: Customize Templates */}
            <div className="group bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100 hover:shadow-xl hover:border-pink-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Copy className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'es' ? 'Adapta con IA' : 'AI Customize'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'es' 
                  ? 'Toma cualquier plantilla y adáptala a un nuevo tema. La IA mantiene la estructura exitosa mientras cambia el contenido.'
                  : 'Take any template and adapt it to a new topic. AI keeps the successful structure while changing the content.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">{language === 'es' ? 'Nuevo tema' : 'New topic'}</span>
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">{language === 'es' ? 'Misma estructura' : 'Same structure'}</span>
              </div>
            </div>

            {/* Feature 6: Template of the Week */}
            <div className="group bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100 hover:shadow-xl hover:border-violet-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {language === 'es' ? 'Plantilla de la Semana' : 'Template of the Week'}
              </h3>
              <p className="text-slate-600 mb-4">
                {language === 'es' 
                  ? 'Cada semana destacamos una plantilla diferente en tu dashboard con tips de personalización específicos.'
                  : 'Each week we spotlight a different template on your dashboard with specific customization tips.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">{language === 'es' ? 'Rotación semanal' : 'Weekly rotation'}</span>
                <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">{language === 'es' ? 'Tips' : 'Tips'}</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 shadow-lg"
              onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
            >
              <Wand2 className="h-5 w-5 mr-2" />
              {language === 'es' ? 'Prueba la IA gratis por 7 días' : 'Try AI free for 7 days'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* AI Presentation Creator Section - NEW */}
      <section className="py-24 px-6 bg-gradient-to-br from-cyan-600 via-blue-600 to-purple-600 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-purple-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                {language === 'es' ? '¡NUEVO! Presentaciones con IA' : 'NEW! AI Presentations'}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {language === 'es' 
                  ? 'Crea presentaciones que cautivan' 
                  : 'Create presentations that captivate'}
              </h2>
              
              <p className="text-xl text-white/90 mb-8 max-w-lg">
                {language === 'es' 
                  ? 'Genera presentaciones educativas completas con IA. Elige temas visuales, agrega imágenes, aplica transiciones y guarda para usar después.' 
                  : 'Generate complete educational presentations with AI. Choose visual themes, add images, apply transitions, and save for later use.'}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Wand2, title: language === 'es' ? 'Genera con IA' : 'AI Generate', desc: language === 'es' ? '6+ diapositivas en segundos' : '6+ slides in seconds' },
                  { icon: Palette, title: language === 'es' ? '8 Temas Visuales' : '8 Visual Themes', desc: language === 'es' ? 'Océano, Galaxia, Pizarra...' : 'Ocean, Galaxy, Blackboard...' },
                  { icon: FileText, title: language === 'es' ? 'Guardar y Cargar' : 'Save & Load', desc: language === 'es' ? 'Biblioteca personal' : 'Personal library' },
                  { icon: Printer, title: language === 'es' ? 'Descargar HTML' : 'Download HTML', desc: language === 'es' ? 'Usa sin internet' : 'Use offline' },
                ].map((feature, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/20 transition-all">
                    <feature.icon className="h-6 w-6 mb-2 text-cyan-300" />
                    <h4 className="font-semibold text-sm">{feature.title}</h4>
                    <p className="text-white/70 text-xs">{feature.desc}</p>
                  </div>
                ))}
              </div>

              <Button 
                size="lg" 
                className="bg-white text-cyan-700 hover:bg-white/90 px-8"
                onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
              >
                {language === 'es' ? 'Crear mi primera presentación' : 'Create my first presentation'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Right - Visual Demo */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {/* Fake presentation preview */}
                <div className="bg-gradient-to-br from-purple-700 to-indigo-600 rounded-xl aspect-video mb-4 flex flex-col items-center justify-center text-white p-6">
                  <span className="text-6xl mb-4">🌌</span>
                  <h3 className="text-2xl font-bold text-center">{language === 'es' ? 'El Sistema Solar' : 'The Solar System'}</h3>
                  <p className="text-white/70 text-sm mt-2">{language === 'es' ? 'Ciencias - 4to Grado' : 'Science - 4th Grade'}</p>
                </div>
                
                {/* Slide thumbnails */}
                <div className="grid grid-cols-6 gap-2">
                  {['🎯', '🌍', '☀️', '🌙', '🚀', '✨'].map((emoji, idx) => (
                    <div key={idx} className="bg-gradient-to-br from-purple-600 to-indigo-500 rounded aspect-video flex items-center justify-center text-xl">
                      {emoji}
                    </div>
                  ))}
                </div>
                
                {/* Transition indicator */}
                <div className="mt-4 flex items-center justify-center gap-2 text-white/70 text-sm">
                  <span className="px-3 py-1 bg-white/10 rounded-full">{language === 'es' ? '✨ Transiciones activadas' : '✨ Transitions enabled'}</span>
                </div>
              </div>
            </div>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-cyan-400 text-sm font-medium mb-6">
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
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-cyan-400" />
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
                    <div className="text-xl font-bold">{language === 'es' ? 'Tu Escuela' : 'Your School'}</div>
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
              <div className="absolute -top-4 -right-4 bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {language === 'es' ? 'Tu logo aquí' : 'Your logo here'}
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {language === 'es' ? 'Tus colores' : 'Your colors'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="py-24 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <Link2 className="h-4 w-4" />
              {language === 'es' ? 'Integraciones' : 'Integrations'}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {language === 'es' ? 'Conecta con tus plataformas favoritas' : 'Connect with your favorite platforms'}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {language === 'es' 
                ? 'TeacherHubPro se integra con las herramientas educativas que ya usas' 
                : 'TeacherHubPro integrates with the educational tools you already use'}
            </p>
          </div>

          {/* Main Integration - Google Classroom */}
          <div className="mb-12">
            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
              <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-green-50 border border-blue-100">
                    <svg className="h-16 w-16" viewBox="0 0 48 48">
                      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl md:text-3xl font-bold text-slate-900">Google Classroom</h3>
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
                        {language === 'es' ? 'Disponible' : 'Available'}
                      </span>
                    </div>
                    <p className="text-lg text-slate-600">
                      {language === 'es' 
                        ? 'Sincroniza tus clases, estudiantes y calificaciones directamente con Google Classroom' 
                        : 'Sync your classes, students, and grades directly with Google Classroom'}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      icon: Users,
                      title: language === 'es' ? 'Importar Clases' : 'Import Classes',
                      desc: language === 'es' ? 'Trae tus clases y listas de estudiantes automáticamente' : 'Bring your classes and student rosters automatically'
                    },
                    {
                      icon: BarChart3,
                      title: language === 'es' ? 'Sincronizar Calificaciones' : 'Sync Grades',
                      desc: language === 'es' ? 'Envía calificaciones a Google Classroom con un clic' : 'Send grades to Google Classroom with one click'
                    },
                    {
                      icon: Shield,
                      title: language === 'es' ? 'Seguro y Privado' : 'Secure & Private',
                      desc: language === 'es' ? 'Autenticación OAuth segura, tus datos protegidos' : 'Secure OAuth authentication, your data protected'
                    }
                  ].map((feature, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <feature.icon className="h-8 w-8 text-blue-600 mb-3" />
                      <h4 className="font-semibold text-slate-800 mb-1">{feature.title}</h4>
                      <p className="text-sm text-slate-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{language === 'es' ? 'Configuración en minutos' : 'Setup in minutes'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{language === 'es' ? 'Sin costo adicional' : 'No extra cost'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{language === 'es' ? 'Soporte incluido' : 'Support included'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Integrations */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-slate-700 mb-6">
              {language === 'es' ? 'Próximamente' : 'Coming Soon'}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { name: 'Canvas LMS', color: 'bg-red-50 border-red-200 text-red-700' },
                { name: 'Schoology', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { name: 'Microsoft Teams', color: 'bg-purple-50 border-purple-200 text-purple-700' },
                { name: 'Clever', color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
                { name: 'ClassLink', color: 'bg-green-50 border-green-200 text-green-700' },
              ].map((platform, idx) => (
                <div key={idx} className={`px-4 py-2 rounded-full border ${platform.color} text-sm font-medium`}>
                  {platform.name}
                </div>
              ))}
            </div>
          </div>

          {/* Integration Request CTA */}
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-6 md:p-8 text-center">
            <Link2 className="h-10 w-10 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {language === 'es' ? '¿Necesitas otra integración?' : 'Need another integration?'}
            </h3>
            <p className="text-slate-600 mb-4">
              {language === 'es' 
                ? 'Contáctanos para solicitar integraciones con otras plataformas educativas' 
                : 'Contact us to request integrations with other educational platforms'}
            </p>
            <Button 
              variant="outline" 
              className="bg-white hover:bg-slate-50 text-slate-800"
              onClick={() => navigate('/contact')}
            >
              <Mail className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Solicitar Integración' : 'Request Integration'}
            </Button>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section id="get-started" className="py-24 px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text and Benefits */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-100 text-cyan-700 text-sm font-medium mb-6">
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
                    <item.icon className="h-5 w-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-slate-600">{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Trust badge */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
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
                        className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-cyan-500 font-medium"
                        data-testid="login-tab"
                      >
                        {language === 'es' ? 'Iniciar sesión' : 'Sign in'}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register"
                        className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-cyan-500 font-medium"
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
                        className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 text-white"
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
      <footer className="border-t border-cyan-100 bg-gradient-to-r from-cyan-50/50 via-white to-blue-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col gap-6">
            {/* Footer Links */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
              <Link to="/contact" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {language === 'es' ? 'Contacto' : 'Contact'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/privacy-policy" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/help" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {language === 'es' ? 'Ayuda' : 'Help'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/terms-of-use" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {language === 'es' ? 'Términos de Uso' : 'Terms of Use'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/cookies-policy" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {language === 'es' ? 'Política de Cookies' : 'Cookies Policy'}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/accessibility" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {language === 'es' ? 'Accesibilidad' : 'Accessibility'}
              </Link>
            </div>
            
            {/* Logo and Copyright */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 border-t border-cyan-100/50">
              <div className="flex items-center gap-3">
                <img 
                  src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
                  alt="TeacherHubPro Logo"
                  className="h-10 w-10 object-contain"
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
