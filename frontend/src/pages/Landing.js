import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { BookOpen, Calendar, Users, ClipboardList, CheckCircle, Globe, BarChart3, Mail, Palette, Shield, Building2, Sparkles, ArrowRight, FileText, GraduationCap, School, Printer, Bot, Zap, Brain, FileQuestion, Lightbulb, Target, Wand2, Star, Layers, Copy, CalendarDays, Link2, ExternalLink, Home, Heart, Download, Volume2, Headphones, Eye, Lock, Compass, TreePine, Telescope } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from '../components/LanguageSelector';

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
    { label: t('landingAiLessonPlan'), value: 'Unit 5 - Week 3', color: 'bg-cyan-500', delay: '0s' },
    { label: t('landingPresentations'), value: '🎯 6 slides', color: 'bg-purple-500', delay: '0.5s' },
    { label: t('landingGrades'), value: 'A (95%)', color: 'bg-blue-500', delay: '1s' },
    { label: t('attendance'), value: '28/30', color: 'bg-green-500', delay: '1.5s' },
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
      title: t('landingPlanFaster'),
      desc: t('landingPlanFasterDesc'),
      visual: (
        <div className="bg-white rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">{t('landingWeek1')}</div>
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
      title: t('landingYourBrand'),
      desc: t('landingYourBrandDesc'),
      visual: (
        <div className="bg-white rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <School className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-800">{t('landingYourSchool')}</div>
              <div className="text-xs text-slate-500">{t('landingCustomBranding')}</div>
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
      title: t('landingExportPro'),
      desc: t('landingExportProDesc'),
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
      title: t('landingAiAssistantTitle'),
      desc: t('landingAiAssistantDesc'),
      visual: (
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-2xl p-6 transform hover:scale-105 transition-all duration-500 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">{t('landingAiAssistant')}</div>
              <div className="text-xs text-white/70">{t('landingPoweredBy')}</div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <Zap className="h-4 w-4" />
              <span>{t('landingLessonPlans')}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <Brain className="h-4 w-4" />
              <span>{t('landingQuizzesTests')}</span>
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
              <span className="text-[10px] sm:text-xs font-medium text-cyan-600 hidden sm:block">{t('landingDigitalClassroom')}</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {t('landingFeatures')}
            </a>
            <a href="#ai-assistant" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {t('landingAiAssistant')}
            </a>
            <a href="#homeschool" className="text-sm font-medium text-slate-700 hover:text-amber-600 transition-colors">
              {t('landingHomeschool')}
            </a>
            <a href="#integrations" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {t('landingIntegrations')}
            </a>
            <a href="#customization" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {t('landingCustomization')}
            </a>
            <Link to="/pricing" className="text-sm font-medium text-slate-700 hover:text-cyan-600 transition-colors">
              {t('landingPricing')}
            </Link>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="compact" dropdownPosition="down" />
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-md text-xs sm:text-sm px-3 sm:px-4"
              onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
            >
              <span className="hidden sm:inline">{t('landingGetStarted')}</span>
              <span className="sm:hidden">{t('landingStart')}</span>
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
                {t('landingBuiltForTeachers')}
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
                {t('landingHeroTitle').split(' ').map((word, i) => 
                  word.toLowerCase() === 'complete' || word.toLowerCase() === 'completa' || word.toLowerCase() === 'complète' || word.toLowerCase() === 'completa' || word.toLowerCase() === 'komplettes' || word.toLowerCase() === 'completa' || word.toLowerCase() === '完整的' 
                    ? <span key={i} className="text-cyan-600">{word} </span> 
                    : word + ' '
                )}
              </h1>
              
              <p className="text-xl text-slate-600 mb-8 max-w-lg">
                {t('landingHeroSubtitle')}
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 h-14 text-lg"
                  onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
                >
                  {t('landingStartFree')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="px-8 h-14 text-lg border-slate-300 text-slate-800 hover:text-slate-900 hover:bg-slate-100">
                    {t('landingViewPricing')}
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
            {t('landingUsedBySchools')}
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
              {t('landingEverythingYouNeed')}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t('landingEverythingDesc')}
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
                      <div className="text-xl font-bold">{t('landingAiTeachingAssistant')}</div>
                      <div className="text-sm text-white/70 flex items-center gap-2">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                        Claude Sonnet 4.5
                      </div>
                    </div>
                  </div>
                  
                  {/* Demo chat interface */}
                  <div className="space-y-3 mb-6">
                    <div className="bg-white/10 rounded-lg p-3 text-sm backdrop-blur-sm">
                      <div className="text-white/60 text-xs mb-1">{t('landingYouAsked')}</div>
                      {t('landingAiQuestion')}
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 text-sm backdrop-blur-sm">
                      <div className="text-white/60 text-xs mb-1 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> 
                        {t('landingAiResponse')}
                      </div>
                      {t('landingAiAnswer')}
                    </div>
                  </div>

                  {/* Tool buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: BookOpen, label: t('landingLessonPlans') },
                      { icon: FileQuestion, label: t('landingQuizzes') },
                      { icon: ClipboardList, label: t('landingWorksheets') },
                      { icon: Lightbulb, label: t('landingIdeas') },
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
                {t('landingNewAi')}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                {t('landingAiAssistantToTeach')}
              </h2>
              
              <p className="text-xl text-slate-600 mb-8">
                {t('landingAiAssistantDesc2')}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Target, text: t('landingAlignedStandards') },
                  { icon: Zap, text: t('landingGenerateSeconds') },
                  { icon: Globe, text: t('landingBilingual') },
                  { icon: Brain, text: t('landingPoweredBy') },
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
                  {t('landingTryItFree')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Shield className="h-4 w-4" />
                  {t('landingIncludedSubscription')}
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
              {t('landingAdvancedAiFeatures')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t('landingIntelligentPlanning')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('landingAiPlanningDesc')}
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
                {t('landingGenerateFullWeek')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('landingGenerateFullWeekDesc')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">5 {t('landingDays')}</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{t('landingProgression')}</span>
              </div>
            </div>

            {/* Feature 2: Daily AI Suggestions */}
            <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Lightbulb className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('landingDailySuggestions')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('landingDailySuggestionsDesc')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{t('landingMonFri')}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{t('landingContextual')}</span>
              </div>
            </div>

            {/* Feature 3: AI Templates */}
            <div className="group bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 hover:shadow-xl hover:border-amber-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Layers className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('landingReusableTemplates')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('landingReusableTemplatesDesc')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">{t('landingSave')}</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">{t('landingClone')}</span>
              </div>
            </div>

            {/* Feature 4: Starter Templates */}
            <div className="group bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-100 hover:shadow-xl hover:border-cyan-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('landing5StarterTemplates')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('landing5StarterTemplatesDesc')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{t('landingMath')}</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{t('landingELA')}</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">{t('landingScience')}</span>
              </div>
            </div>

            {/* Feature 5: Customize Templates */}
            <div className="group bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border border-pink-100 hover:shadow-xl hover:border-pink-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Copy className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('landingAiCustomize')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('landingAiCustomizeDesc')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">{t('landingNewTopic')}</span>
                <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded text-xs">{t('landingSameStructure')}</span>
              </div>
            </div>

            {/* Feature 6: Template of the Week */}
            <div className="group bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border border-violet-100 hover:shadow-xl hover:border-violet-300 transition-all duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('landingTemplateOfWeek')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('landingTemplateOfWeekDesc')}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">{t('landingWeeklyRotation')}</span>
                <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded text-xs">{t('landingTips')}</span>
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
              {t('landingTryAiFree7Days')}
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
                {t('landingNewAiPresentations')}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                {t('landingCreatePresentations')}
              </h2>
              
              <p className="text-xl text-white/90 mb-8 max-w-lg">
                {t('landingPresentationsDesc')}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Wand2, title: t('landingAiGenerate'), desc: t('landingAiGenerateDesc') },
                  { icon: Palette, title: t('landing8VisualThemes'), desc: t('landing8VisualThemesDesc') },
                  { icon: FileText, title: t('landingSaveAndLoad'), desc: t('landingSaveAndLoadDesc') },
                  { icon: Printer, title: t('landingDownloadHtml'), desc: t('landingDownloadHtmlDesc') },
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
                {t('landingCreateFirstPresentation')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Right - Visual Demo */}
            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                {/* Fake presentation preview */}
                <div className="bg-gradient-to-br from-purple-700 to-indigo-600 rounded-xl aspect-video mb-4 flex flex-col items-center justify-center text-white p-6">
                  <span className="text-6xl mb-4">🌌</span>
                  <h3 className="text-2xl font-bold text-center">{t('landingTheSolarSystem')}</h3>
                  <p className="text-white/70 text-sm mt-2">{t('landingScienceGrade')}</p>
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
                  <span className="px-3 py-1 bg-white/10 rounded-full">{t('landingTransitionsEnabled')}</span>
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
                {t('landingFullCustomization')}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                {t('landingSchoolBrandingTitle')}
              </h2>
              
              <p className="text-xl text-slate-300 mb-8">
                {t('landingSchoolBrandingDesc')}
                  ? 'Cada escuela tiene su identidad. TeacherHubPro se adapta completamente a la tuya.'
                  : 'Every school has its identity. TeacherHubPro fully adapts to yours.'}
              </p>

              <div className="space-y-4">
                {[
                  { icon: Building2, text: t('landingSchoolLogoAll') },
                  { icon: Palette, text: t('landingCustomColorsMatch') },
                  { icon: FileText, text: t('landingPdfFormats') },
                  { icon: Shield, text: t('landingCentralizedAdmin') },
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
                    <div className="text-xl font-bold">{t('landingYourSchool')}</div>
                    <div className="text-sm text-slate-500">{t('landingTeachersPlanning')}</div>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">{t('teacher')}</div>
                      <div className="font-medium">María González</div>
                    </div>
                    <div>
                      <div className="text-slate-500">{t('grade')}</div>
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
                {t('landingYourLogoHere')}
              </div>
              <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                {t('landingYourColors')}
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
              {t('landingIntegrations')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t('landingConnectFavorite')}
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t('landingConnectFavoriteDesc')}
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
                        {t('landingAvailable')}
                      </span>
                    </div>
                    <p className="text-lg text-slate-600">
                      {t('landingMostPopular')}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      icon: Users,
                      title: t('landingImportClasses'),
                      desc: t('landingImportClassesDesc')
                    },
                    {
                      icon: BarChart3,
                      title: t('landingSyncGrades'),
                      desc: t('landingSyncGradesDesc')
                    },
                    {
                      icon: Shield,
                      title: t('landingSecurePrivate'),
                      desc: t('landingSecurePrivateDesc')
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
                    <span className="text-sm">{t('landingSetupMinutes')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{t('landingNoExtraCost')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">{t('landingSupportIncluded')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon Integrations */}
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-slate-700 mb-6">
              {t('landingComingSoon')}
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
              {t('landingNeedIntegration')}
            </h3>
            <p className="text-slate-600 mb-4">
              {t('landingNeedIntegrationDesc')}
            </p>
            <Button 
              variant="outline" 
              className="bg-white hover:bg-slate-50 text-slate-800"
              onClick={() => navigate('/contact')}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('landingRequestIntegration')}
            </Button>
          </div>
        </div>
      </section>

      {/* Homeschool Section */}
      <section id="homeschool" className="py-24 px-6 bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">
              <Home className="h-4 w-4" />
              {t('landingHomeschool')}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              {t('landingPerfectHomeschool')}
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('landingHomeschoolCompleteDesc')}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Adaptive Learning */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 w-fit mb-4">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t('landingAdaptiveLearning')}
              </h3>
              <p className="text-slate-600 mb-3">
                {t('landingAdaptiveLearningDesc')}
              </p>
              <div className="flex items-center gap-2 text-purple-600 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                {t('landingAiPowered')}
              </div>
            </div>

            {/* Parent Dashboard */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 w-fit mb-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t('landingParentDashboard')}
              </h3>
              <p className="text-slate-600 mb-3">
                {t('landingParentDashboardDesc')} 
                  : 'Comprehensive analytics, attendance tracking, and detailed reports to manage progress.'}
              </p>
              <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                <Eye className="h-4 w-4" />
                {t('landingFullVisibility')}
              </div>
            </div>

            {/* Flexible Curriculum */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 w-fit mb-4">
                <Layers className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t('landingFlexibleCurriculum')}
              </h3>
              <p className="text-slate-600 mb-3">
                {t('landingFlexibleCurriculumDesc2')}
              </p>
              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <Wand2 className="h-4 w-4" />
                {t('landing100Customizable')}
              </div>
            </div>

            {/* Offline Downloads */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 w-fit mb-4">
                <Download className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t('landingDownloadAndLearn')}
              </h3>
              <p className="text-slate-600 mb-3">
                {t('landingDownloadAndLearnDesc')}
              </p>
              <div className="flex items-center gap-2 text-orange-600 text-sm font-medium">
                <FileText className="h-4 w-4" />
                {t('landingPdfExport')}
              </div>
            </div>

            {/* Text-to-Speech */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 w-fit mb-4">
                <Volume2 className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t('landingTextToSpeech')}
              </h3>
              <p className="text-slate-600 mb-3">
                {t('landingTextToSpeechDesc2')}
              </p>
              <div className="flex items-center gap-2 text-rose-600 text-sm font-medium">
                <Headphones className="h-4 w-4" />
                {t('landingAudioLearning')}
              </div>
            </div>

            {/* Safe Content */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-100 hover:shadow-xl transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100 w-fit mb-4">
                <Lock className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {t('landingSafeContent')}
              </h3>
              <p className="text-slate-600 mb-3">
                {t('landingSafeContentDesc2')}
              </p>
              <div className="flex items-center gap-2 text-slate-600 text-sm font-medium">
                <Shield className="h-4 w-4" />
                {t('landingParentalControl')}
              </div>
            </div>
          </div>

          {/* Subject Modules */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">
              {t('landingSubjectModules')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, name: t('landingMathematics'), color: 'text-blue-600 bg-blue-50' },
                { icon: FileText, name: t('landingLanguageArts'), color: 'text-purple-600 bg-purple-50' },
                { icon: TreePine, name: t('landingScience'), color: 'text-green-600 bg-green-50' },
                { icon: Telescope, name: t('landingAstronomy'), color: 'text-indigo-600 bg-indigo-50' },
                { icon: Globe, name: t('landingGeography'), color: 'text-teal-600 bg-teal-50' },
                { icon: Compass, name: t('landingHistory'), color: 'text-amber-600 bg-amber-50' },
                { icon: Palette, name: t('landingArt'), color: 'text-pink-600 bg-pink-50' },
                { icon: Heart, name: t('landingPhysicalEd'), color: 'text-red-600 bg-red-50' },
              ].map((subject, idx) => (
                <div key={idx} className={`flex items-center gap-3 p-4 rounded-xl ${subject.color.split(' ')[1]}`}>
                  <subject.icon className={`h-6 w-6 ${subject.color.split(' ')[0]}`} />
                  <span className="font-medium text-slate-700">{subject.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 h-14 text-lg shadow-lg"
              onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
            >
              <Home className="h-5 w-5 mr-2" />
              {t('landingStartHomeschooling')}
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
                {t('landing7DaysFree')}
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                {t('landingGetStartedToday')}
              </h2>
              
              <p className="text-xl text-slate-600 mb-8">
                {t('landingStartYourJourney')}
              </p>

              {/* Benefits list */}
              <div className="space-y-4 mb-8">
                {[
                  { icon: CheckCircle, text: t('landingNoCreditCard') },
                  { icon: CheckCircle, text: t('landingSetup2Min') },
                  { icon: CheckCircle, text: t('landingCancelAnytime') },
                  { icon: CheckCircle, text: t('landingSupportBilingual') },
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
                  <span className="font-semibold text-slate-800">500+</span> {t('landingActiveTeachers')}
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
                        {t('landingSignIn')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register"
                        className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-cyan-500 font-medium"
                        data-testid="register-tab"
                      >
                        {t('landingCreateAccountTab')}
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
                        {t('landingContinueGoogle')}
                      </Button>

                      <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-slate-500">
                        {t('landingOrWithEmail')}
                      </span>
                    </div>
                  </div>

                  <TabsContent value="login" className="mt-0">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="login-email" className="text-slate-700">{t('landingEmail')}</Label>
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
                        <Label htmlFor="login-password" className="text-slate-700">{t('landingPassword')}</Label>
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
                        {isLoading ? '...' : t('landingSignIn')}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register" className="mt-0">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div>
                        <Label htmlFor="register-name" className="text-slate-700">{t('landingFullNameLabel')}</Label>
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
                        <Label htmlFor="register-email" className="text-slate-700">{t('landingEmail')}</Label>
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
                        <Label htmlFor="register-password" className="text-slate-700">{t('landingPassword')}</Label>
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
                        {isLoading ? '...' : t('landingCreateFreeAccount')}
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
                {t('landingContact')}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/privacy-policy" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {t('landingPrivacyPolicy')}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/help" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {t('landingHelp')}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/terms-of-use" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {t('landingTermsOfUse')}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/cookies-policy" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {t('landingCookiesPolicy')}
              </Link>
              <span className="text-slate-300">•</span>
              <Link to="/accessibility" className="text-slate-500 hover:text-cyan-600 transition-colors">
                {t('landingAccessibility')}
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
                © 2026 TeacherHubPro. {t('landingAllRightsReserved')}
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
