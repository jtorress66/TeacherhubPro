import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import LanguageSelector from '../components/LanguageSelector';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, user } = useAuth();
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  
  // Determine initial tab from URL query param
  const initialTab = searchParams.get('mode') === 'login' ? 'login' : 'register';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    email: '', 
    password: '', 
    name: '',
    language: language
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex flex-col">
      {/* Header */}
      <header className="py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
              data-testid="auth-logo"
            />
            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">TeacherHubPro</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <LanguageSelector variant="compact" dropdownPosition="down" />
            <Link to="/">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {activeTab === 'register' ? 'Start Your Free Trial' : 'Welcome Back'}
            </h1>
            <p className="text-slate-600">
              {activeTab === 'register' 
                ? 'Join thousands of teachers saving time every week' 
                : 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Auth Card */}
          <Card className="shadow-2xl border-0 bg-white overflow-hidden">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          {/* Benefits */}
          <div className="mt-8 space-y-3">
            {[
              'No credit card required',
              'Set up in under 2 minutes',
              'Full access to all features',
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="text-slate-600 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} TeacherHubPro. All rights reserved.
      </footer>
    </div>
  );
};

export default Auth;
