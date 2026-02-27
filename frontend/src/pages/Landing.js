import { useState } from 'react';
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
  Shield, Play, ChevronRight, Target, Award, FileText
} from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from '../components/LanguageSelector';

const Landing = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { t, language } = useLanguage();
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

  // Target audience
  const targetAudience = [
    { icon: GraduationCap, label: 'Elementary Teachers' },
    { icon: BookOpen, label: 'Middle School Educators' },
    { icon: Target, label: 'High School Teachers' },
    { icon: Home, label: 'Homeschool Educators' },
    { icon: Award, label: 'Instructional Coaches' },
  ];

  // Real outcomes
  const outcomes = [
    'Faster weekly lesson planning',
    'Less time grading',
    'Better organization',
    'More confidence in classroom management',
    'More personal time after school',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
            <span className="text-xl sm:text-2xl font-bold text-slate-900">TeacherHubPro</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#solution" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
            <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" dropdownPosition="down" />
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6"
              onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
            >
              Start Free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Main Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
                <Clock className="h-4 w-4" />
                Built for busy teachers
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Save <span className="text-emerald-600">5+ Hours</span> Every Week on Planning, Grading, and Classroom Admin
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed">
                TeacherHubPro helps busy educators create lesson plans, manage grades, track attendance, and use AI to simplify daily classroom work — all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-14 text-lg shadow-lg shadow-emerald-200"
                  onClick={() => document.getElementById('get-started').scrollIntoView({ behavior: 'smooth' })}
                >
                  Start Free — No Credit Card Required
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 h-14 text-lg"
                  onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                >
                  <Play className="mr-2 h-5 w-5" />
                  See How It Works
                </Button>
              </div>
            </div>

            {/* Right - Visual */}
            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Main dashboard mockup */}
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 transform rotate-1">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Lesson Planner</div>
                      <div className="text-xs text-slate-500">Week of Feb 10-14</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                      <div key={i} className="bg-emerald-50 rounded-lg p-3 text-center">
                        <div className="text-xs font-medium text-emerald-700 mb-2">{day}</div>
                        <div className="h-2 bg-emerald-300 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-4 -left-8 bg-white rounded-xl shadow-lg border border-slate-100 p-4 transform -rotate-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Class Average</div>
                      <div className="font-bold text-slate-900">87%</div>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-8 bg-white rounded-xl shadow-lg border border-slate-100 p-4 transform rotate-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">AI Generated</div>
                      <div className="font-bold text-slate-900">3 Lessons</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="py-20 px-6 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Teaching Is More Than Teaching
          </h2>
          <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto">
            Between lesson planning, grading, attendance, reporting, and communication — most teachers spend hours every week on tasks that steal time from students and personal life.
          </p>
          <div className="border-t border-slate-700 pt-8">
            <p className="text-2xl font-semibold text-emerald-400 mb-2">
              You became a teacher to educate.
            </p>
            <p className="text-xl text-slate-400">
              Not to drown in paperwork.
            </p>
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section id="solution" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need. One Simple Platform.
            </h2>
            <p className="text-xl text-slate-600">
              Less busywork. More teaching.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: 'Generate structured lesson plans in minutes', color: 'emerald' },
              { icon: BarChart3, title: 'Track grades with an easy-to-use digital gradebook', color: 'blue' },
              { icon: ClipboardList, title: 'Record attendance quickly', color: 'purple' },
              { icon: Users, title: 'Organize class data in one dashboard', color: 'amber' },
              { icon: Brain, title: 'Use AI tools to speed up prep work', color: 'pink' },
            ].map((feature, idx) => {
              const colors = {
                emerald: 'bg-emerald-100 text-emerald-600',
                blue: 'bg-blue-100 text-blue-600',
                purple: 'bg-purple-100 text-purple-600',
                amber: 'bg-amber-100 text-amber-600',
                pink: 'bg-pink-100 text-pink-600',
              };
              return (
                <div key={idx} className="flex items-start gap-4 p-6 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[feature.color]}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-medium text-lg leading-snug">{feature.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real Outcomes Section */}
      <section className="py-20 px-6 bg-emerald-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              What Teachers Experience
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outcomes.map((outcome, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-xl p-5 shadow-sm">
                <CheckCircle className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-700 font-medium">{outcome}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-slate-600">
              You'll see value in minutes — not hours.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create Your Classes', desc: 'Set up your classes and students in seconds', icon: Users },
              { step: '2', title: 'Use AI to Build Lessons & Materials', desc: 'Generate comprehensive lesson plans with AI assistance', icon: Sparkles },
              { step: '3', title: 'Manage Grades and Attendance Effortlessly', desc: 'Track everything from one intuitive dashboard', icon: BarChart3 },
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                    <item.icon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built For Section */}
      <section className="py-20 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Built for:
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              If you manage students, you need a system that works for you.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {targetAudience.map((audience, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-sm border border-slate-200">
                <audience.icon className="h-5 w-5 text-emerald-600" />
                <span className="text-slate-700 font-medium">{audience.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA + Auth Section */}
      <section id="get-started" className="py-20 px-6 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - CTA Copy */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                Ready to simplify your teaching life?
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                Start your free account today and experience how much time you can save this week.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  'No credit card required',
                  'Set up in under 2 minutes',
                  'Cancel anytime',
                  'Full access to all features',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 justify-center lg:justify-start">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-600">{item}</span>
                  </div>
                ))}
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['M', 'J', 'L', 'A'].map((letter, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white flex items-center justify-center text-white text-sm font-bold">
                      {letter}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">500+</span> teachers already using TeacherHubPro
                </div>
              </div>
            </div>

            {/* Right - Auth Form */}
            <div>
              <Card className="shadow-xl border-0 bg-white">
                <CardContent className="p-0">
                  <Tabs defaultValue="register" className="w-full">
                    <TabsList className="w-full rounded-none border-b bg-slate-50 p-0 h-auto">
                      <TabsTrigger 
                        value="register"
                        className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500 font-medium"
                        data-testid="register-tab"
                      >
                        Create Free Account
                      </TabsTrigger>
                      <TabsTrigger 
                        value="login" 
                        className="flex-1 py-4 rounded-none data-[state=active]:bg-white data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-emerald-500 font-medium"
                        data-testid="login-tab"
                      >
                        Sign In
                      </TabsTrigger>
                    </TabsList>

                    <div className="p-8">
                      {/* Google Auth */}
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 mb-6 border-slate-300 hover:bg-slate-50"
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

                      <div className="relative mb-6">
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
                            <Label htmlFor="register-name" className="text-slate-700">Full Name</Label>
                            <Input
                              id="register-name"
                              type="text"
                              value={registerForm.name}
                              onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                              placeholder="Your name"
                              className="mt-1 h-12"
                              required
                              data-testid="register-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="register-email" className="text-slate-700">Email</Label>
                            <Input
                              id="register-email"
                              type="email"
                              value={registerForm.email}
                              onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                              placeholder="you@school.edu"
                              className="mt-1 h-12"
                              required
                              data-testid="register-email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="register-password" className="text-slate-700">Password</Label>
                            <Input
                              id="register-password"
                              type="password"
                              value={registerForm.password}
                              onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                              placeholder="Create a password"
                              className="mt-1 h-12"
                              required
                              data-testid="register-password"
                            />
                          </div>
                          <Button 
                            type="submit" 
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-lg"
                            disabled={isLoading}
                            data-testid="register-submit"
                          >
                            {isLoading ? 'Creating account...' : 'Start Free Today'}
                          </Button>
                          <p className="text-xs text-center text-slate-500 mt-4">
                            By signing up, you agree to our <Link to="/terms" className="text-emerald-600 hover:underline">Terms</Link> and <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>
                          </p>
                        </form>
                      </TabsContent>

                      <TabsContent value="login" className="mt-0">
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div>
                            <Label htmlFor="login-email" className="text-slate-700">Email</Label>
                            <Input
                              id="login-email"
                              type="email"
                              value={loginForm.email}
                              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                              placeholder="you@school.edu"
                              className="mt-1 h-12"
                              required
                              data-testid="login-email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="login-password" className="text-slate-700">Password</Label>
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
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
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
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
                  alt="TeacherHubPro"
                  className="h-10 w-10 object-contain"
                />
                <span className="font-bold text-lg">TeacherHubPro</span>
              </div>
              <p className="text-slate-400 text-sm">
                Simplifying teaching, one classroom at a time.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#solution" className="hover:text-white">Features</a></li>
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
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
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
