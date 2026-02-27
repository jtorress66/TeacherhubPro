import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Clock, CheckCircle, ArrowRight, BookOpen, BarChart3, Users, 
  ClipboardList, Sparkles, Brain, Calendar, GraduationCap, Home, 
  Play, Target, Award
} from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from '../components/LanguageSelector';

// Animation hook for scroll reveal
const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
};

// Animated Section Component
const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    name: '',
    language: language
  });

  const handleGoogleLogin = () => {
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      toast.success('Welcome back!');
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
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Target audience data
  const targetAudience = [
    { icon: GraduationCap, label: 'Elementary Teachers' },
    { icon: BookOpen, label: 'Middle School Educators' },
    { icon: Target, label: 'High School Teachers' },
    { icon: Home, label: 'Homeschool Educators' },
    { icon: Award, label: 'Instructional Coaches' },
  ];

  // Outcomes data
  const outcomes = [
    'Faster weekly lesson planning',
    'Less time grading',
    'Better organization',
    'More classroom confidence',
    'More personal time after school',
  ];

  // Solution features
  const solutionFeatures = [
    { icon: Calendar, title: 'Generate structured lesson plans in minutes', color: 'emerald' },
    { icon: BarChart3, title: 'Track grades with an easy-to-use digital gradebook', color: 'blue' },
    { icon: ClipboardList, title: 'Record attendance quickly', color: 'purple' },
    { icon: Users, title: 'Organize class data in one dashboard', color: 'amber' },
    { icon: Brain, title: 'Use AI tools to speed up prep work', color: 'rose' },
  ];

  // How it works steps
  const howItWorksSteps = [
    { 
      step: '1', 
      title: 'Create Your Classes', 
      desc: 'Set up your classes and add students in seconds',
      icon: Users 
    },
    { 
      step: '2', 
      title: 'Generate Lessons with AI', 
      desc: 'Create comprehensive lesson plans with AI assistance',
      icon: Sparkles 
    },
    { 
      step: '3', 
      title: 'Manage Grades and Attendance Effortlessly', 
      desc: 'Track everything from one intuitive dashboard',
      icon: BarChart3 
    },
  ];

  const featureColors = {
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-100',
    purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-100',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
              data-testid="header-logo"
            />
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">TeacherHubPro</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#solution" 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              data-testid="nav-features"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              data-testid="nav-how-it-works"
            >
              How It Works
            </a>
            <Link 
              to="/pricing" 
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              data-testid="nav-pricing"
            >
              Pricing
            </Link>
          </nav>
          
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" dropdownPosition="down" />
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-6 shadow-sm hover:shadow-md transition-all"
              onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
              data-testid="header-cta"
            >
              Start Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 sm:pt-28 sm:pb-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 via-white to-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left - Main Copy */}
            <div className="text-center lg:text-left">
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-6 border border-emerald-100"
                style={{ animation: 'fadeInUp 0.6s ease-out' }}
              >
                <Clock className="h-4 w-4" />
                Built for busy teachers
              </div>
              
              <h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.15] mb-6"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}
              >
                Save <span className="text-emerald-600">5+ Hours</span> Every Week on Planning, Grading, and Classroom Admin
              </h1>
              
              <p 
                className="text-base sm:text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}
              >
                TeacherHubPro helps busy educators create lesson plans, manage grades, track attendance, and use AI to simplify daily classroom work — all in one place.
              </p>
              
              <div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
                style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}
              >
                <Button 
                  size="lg" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/50 transition-all group"
                  onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-primary-cta"
                >
                  Start Free — No Credit Card Required
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 h-12 sm:h-14 text-base sm:text-lg transition-all"
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                  data-testid="hero-secondary-cta"
                >
                  <Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div 
              className="hidden lg:block relative"
              style={{ animation: 'fadeInRight 0.8s ease-out 0.2s both' }}
            >
              <div className="relative">
                {/* Main Image with overlay cards */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1758685848226-eedca8f6bce7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHx0ZWFjaGVyJTIwY2xhc3Nyb29tJTIwbGFwdG9wJTIwZWR1Y2F0aW9uJTIwcHJvZmVzc2lvbmFsfGVufDB8fHx8MTc3MjIzMzIxN3ww&ixlib=rb-4.1.0&q=85"
                    alt="Teacher using TeacherHubPro"
                    className="w-full h-[400px] object-cover"
                    data-testid="hero-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent"></div>
                </div>

                {/* Floating card - Top Left */}
                <div 
                  className="absolute -top-4 -left-6 bg-white rounded-xl shadow-lg border border-slate-100 p-4 animate-float"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">Class Average</div>
                      <div className="text-lg font-bold text-slate-900">87%</div>
                    </div>
                  </div>
                </div>

                {/* Floating card - Bottom Right */}
                <div 
                  className="absolute -bottom-4 -right-6 bg-white rounded-xl shadow-lg border border-slate-100 p-4 animate-float"
                  style={{ animationDelay: '1.5s' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-medium">AI Generated</div>
                      <div className="text-lg font-bold text-slate-900">3 Lessons</div>
                    </div>
                  </div>
                </div>

                {/* Floating card - Middle Right */}
                <div 
                  className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white rounded-xl shadow-lg border border-slate-100 p-3 animate-float"
                  style={{ animationDelay: '0.75s' }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">Attendance saved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-900 text-white">
        <AnimatedSection className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
            Teaching Is More Than Teaching
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
            Between lesson planning, grading, attendance, reporting, and communication — most teachers spend hours every week on tasks that steal time from students and personal life.
          </p>
          <div className="border-t border-slate-700 pt-8 max-w-2xl mx-auto">
            <p className="text-xl sm:text-2xl font-semibold text-emerald-400 mb-2">
              You became a teacher to educate.
            </p>
            <p className="text-lg sm:text-xl text-slate-400">
              Not to drown in paperwork.
            </p>
          </div>
        </AnimatedSection>
      </section>

      {/* The Solution Section */}
      <section id="solution" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need. One Simple Platform.
            </h2>
            <p className="text-lg sm:text-xl text-slate-600">
              Less busywork. More teaching.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {solutionFeatures.map((feature, idx) => (
              <AnimatedSection key={idx} delay={idx * 100}>
                <div 
                  className="group flex items-start gap-4 p-5 sm:p-6 rounded-xl bg-slate-50 hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-200 transition-all duration-300 cursor-default"
                  data-testid={`feature-${idx}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${featureColors[feature.color]}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-medium text-base sm:text-lg leading-snug">{feature.title}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Real Outcomes Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-emerald-50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              What Teachers Experience
            </h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {outcomes.map((outcome, idx) => (
              <AnimatedSection key={idx} delay={idx * 75}>
                <div 
                  className="flex items-center gap-3 bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow border border-emerald-100"
                  data-testid={`outcome-${idx}`}
                >
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-700 font-medium text-sm sm:text-base">{outcome}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg sm:text-xl text-slate-600">
              You'll see value in minutes — not hours.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 sm:gap-10">
            {howItWorksSteps.map((item, idx) => (
              <AnimatedSection key={idx} delay={idx * 150} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center shadow-lg shadow-emerald-100">
                    <item.icon className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-9 sm:h-9 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm sm:text-base">{item.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Built For Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built Specifically for Educators
            </h2>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {targetAudience.map((audience, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-2 sm:gap-3 bg-white rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-sm border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all"
                  data-testid={`audience-${idx}`}
                >
                  <audience.icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                  <span className="text-slate-700 font-medium text-sm sm:text-base">{audience.label}</span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA + Auth Section */}
      <section id="get-started" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left - CTA Copy */}
            <AnimatedSection className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Ready to Simplify Your Teaching Life?
              </h2>
              <p className="text-lg sm:text-xl text-slate-600 mb-8">
                Start your free account today and experience how much time you can save this week.
              </p>

              <div className="space-y-3 sm:space-y-4 mb-8">
                {[
                  'No credit card required',
                  'Set up in under 2 minutes',
                  'Cancel anytime',
                  'Full access to all features',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 justify-center lg:justify-start">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-600 text-sm sm:text-base">{item}</span>
                  </div>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['M', 'J', 'L', 'A'].map((letter, i) => (
                    <div 
                      key={i} 
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">500+</span> teachers already using TeacherHubPro
                </div>
              </div>
            </AnimatedSection>

            {/* Right - Auth Form */}
            <AnimatedSection delay={150}>
              <Card className="shadow-2xl border-0 bg-white overflow-hidden">
                <CardContent className="p-0">
                  <Tabs defaultValue="register" className="w-full">
                    <TabsList className="w-full rounded-none border-b bg-slate-50 p-0 h-auto">
                      <TabsTrigger 
                        value="register"
                        className="flex-1 py-3.5 sm:py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500 font-medium text-sm sm:text-base transition-colors"
                        data-testid="register-tab"
                      >
                        Create Free Account
                      </TabsTrigger>
                      <TabsTrigger 
                        value="login" 
                        className="flex-1 py-3.5 sm:py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500 font-medium text-sm sm:text-base transition-colors"
                        data-testid="login-tab"
                      >
                        Sign In
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-6 sm:p-8">
                      {/* Google Auth */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 sm:h-12 mb-5 sm:mb-6 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
                        onClick={handleGoogleLogin}
                        data-testid="google-login-btn"
                      >
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>

                      <div className="relative mb-5 sm:mb-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-slate-500">or with email</span>
                        </div>
                      </div>

                      <TabsContent value="register" className="mt-0">
                        <form onSubmit={handleRegister} className="space-y-4">
                          <div>
                            <Label htmlFor="register-name" className="text-slate-700 text-sm">Full Name</Label>
                            <Input
                              id="register-name"
                              type="text"
                              value={registerForm.name}
                              onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                              placeholder="Your name"
                              className="mt-1.5 h-11 sm:h-12"
                              required
                              data-testid="register-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="register-email" className="text-slate-700 text-sm">Email</Label>
                            <Input
                              id="register-email"
                              type="email"
                              value={registerForm.email}
                              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                              placeholder="you@school.edu"
                              className="mt-1.5 h-11 sm:h-12"
                              required
                              data-testid="register-email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="register-password" className="text-slate-700 text-sm">Password</Label>
                            <Input
                              id="register-password"
                              type="password"
                              value={registerForm.password}
                              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                              placeholder="Create a password"
                              className="mt-1.5 h-11 sm:h-12"
                              required
                              data-testid="register-password"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base sm:text-lg shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all"
                            disabled={isLoading}
                            data-testid="register-submit"
                          >
                            {isLoading ? 'Creating account...' : 'Start Free Today'}
                          </Button>
                          <p className="text-xs text-center text-slate-500 mt-4">
                            By signing up, you agree to our{' '}
                            <Link to="/terms-of-use" className="text-emerald-600 hover:underline">Terms</Link>
                            {' '}and{' '}
                            <Link to="/privacy-policy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                          </p>
                        </form>
                      </TabsContent>

                      <TabsContent value="login" className="mt-0">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div>
                            <Label htmlFor="login-email" className="text-slate-700 text-sm">Email</Label>
                            <Input
                              id="login-email"
                              type="email"
                              value={loginForm.email}
                              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                              placeholder="you@school.edu"
                              className="mt-1.5 h-11 sm:h-12"
                              required
                              data-testid="login-email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="login-password" className="text-slate-700 text-sm">Password</Label>
                            <Input
                              id="login-password"
                              type="password"
                              value={loginForm.password}
                              onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                              className="mt-1.5 h-11 sm:h-12"
                              required
                              data-testid="login-password"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full h-11 sm:h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-base shadow-lg shadow-emerald-200/50 hover:shadow-xl transition-all"
                            disabled={isLoading}
                            data-testid="login-submit"
                          >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                          </Button>
                        </form>
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-12 px-4 sm:px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
                  alt="TeacherHubPro"
                  className="h-9 w-9 sm:h-10 sm:w-10 object-contain"
                />
                <span className="font-bold text-base sm:text-lg">TeacherHubPro</span>
              </div>
              <p className="text-slate-400 text-sm">
                Simplifying teaching, one classroom at a time.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#solution" className="hover:text-white transition-colors">Features</a></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-use" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} TeacherHubPro. All rights reserved.
          </div>
        </div>
      </footer>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;
