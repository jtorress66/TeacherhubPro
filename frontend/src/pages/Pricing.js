import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { toast } from 'sonner';
import { Check, Star, Users, Building, Crown, Loader2, BookOpen, ArrowLeft, ArrowRight, AlertCircle, Menu, X } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { PricingValueBar, PricingComparison, PricingFAQ, CTASection } from '../components/marketing';

const API = `${window.location.origin}/api`;

const Pricing = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [teacherCount, setTeacherCount] = useState(10);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isEs = language === 'es';
  const trialExpired = location.state?.trialExpired;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${API}/subscription/status`, { withCredentials: true });
        setSubscriptionStatus(res.data);
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      }
    };
    if (user) {
      fetchStatus();
    }
  }, [user]);

  const plans = [
    {
      id: 'individual_monthly',
      name: isEs ? 'Individual Mensual' : 'Individual Monthly',
      bestFor: isEs ? 'Mejor para profesores que quieren flexibilidad' : 'Best for teachers who want flexibility',
      price: '$9.99',
      period: isEs ? '/mes' : '/month',
      description: isEs 
        ? 'Accede a planificación de lecciones, libro de calificaciones, asistencia, herramientas de IA y funciones de productividad en una suscripción.'
        : 'Access lesson planning, gradebook, attendance tracking, AI tools, and classroom productivity features in one subscription.',
      icon: Star,
      features: [
        isEs ? 'Planificador de lecciones' : 'Lesson Planner',
        isEs ? 'Control de asistencia' : 'Attendance Tracker',
        isEs ? 'Libro de calificaciones' : 'Digital Gradebook',
        isEs ? 'Herramientas de IA incluidas' : 'AI Tools Included',
        isEs ? 'Exportación PDF' : 'PDF Export',
        isEs ? 'Soporte por email' : 'Email Support',
      ],
      popular: false,
      color: 'bg-white border-slate-200'
    },
    {
      id: 'individual_yearly',
      name: isEs ? 'Individual Anual' : 'Individual Annual',
      bestFor: isEs ? 'Mejor valor para educadores comprometidos' : 'Best value for committed educators',
      price: '$79',
      period: isEs ? '/año' : '/year',
      savings: isEs ? 'Ahorra $40' : 'Save $40',
      description: isEs 
        ? 'Ahorra más con facturación anual mientras mantienes acceso completo a las herramientas de enseñanza y planificación de TeacherHubPro.'
        : "Save more with annual billing while keeping full access to TeacherHubPro's teaching and planning tools.",
      icon: Crown,
      features: [
        isEs ? 'Todo lo del plan mensual' : 'Everything in Monthly',
        isEs ? 'Soporte prioritario' : 'Priority Support',
        isEs ? '2 meses gratis' : '2 Months Free',
        isEs ? 'Acceso anticipado a funciones' : 'Early Access to Features',
      ],
      popular: true,
      color: 'bg-lime-50 border-lime-300'
    },
    {
      id: 'school',
      name: isEs ? 'Plan Escolar' : 'School Plan',
      bestFor: isEs ? 'Mejor para escuelas y equipos educativos' : 'Best for schools and educational teams',
      price: '$6',
      period: isEs ? '/profesor/mes' : '/teacher/month',
      billedYearly: true,
      minTeachers: 10,
      description: isEs 
        ? 'Apoya a múltiples educadores con una plataforma centralizada diseñada para optimizar planificación, organización y colaboración.'
        : 'Support multiple educators with a centralized platform designed to streamline planning, organization, and collaboration.',
      icon: Users,
      features: [
        isEs ? 'Todo lo individual' : 'All Individual Features',
        isEs ? 'Panel de administrador' : 'Admin Dashboard',
        isEs ? 'Marca de escuela' : 'School Branding',
        isEs ? 'Importación masiva' : 'Bulk Import',
        isEs ? 'Reportes escolares' : 'School Reports',
        isEs ? 'Gestión de usuarios' : 'User Management',
      ],
      popular: false,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'district',
      name: isEs ? 'Plan Distrito' : 'District Plan',
      bestFor: isEs ? 'Mejor para distritos escolares grandes' : 'Best for large school districts',
      price: '$4',
      period: isEs ? '/profesor/mes' : '/teacher/month',
      billedYearly: true,
      minTeachers: 100,
      description: isEs 
        ? 'Solución completa para distritos con análisis avanzado y soporte dedicado.'
        : 'Complete solution for districts with advanced analytics and dedicated support.',
      icon: Building,
      features: [
        isEs ? 'Todo lo del plan escolar' : 'All School Features',
        isEs ? 'Análisis de distrito' : 'District Analytics',
        isEs ? 'Integración SSO' : 'SSO Integration',
        isEs ? 'Soporte dedicado' : 'Dedicated Support',
        isEs ? 'Entrenamiento personalizado' : 'Custom Training',
        isEs ? 'Acceso API' : 'API Access',
      ],
      popular: false,
      color: 'bg-purple-50 border-purple-200'
    }
  ];

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoadingCheckout(true);
    setSelectedPlan(planId);

    try {
      const quantity = ['school', 'district'].includes(planId) ? teacherCount : 1;
      
      const res = await axios.post(`${API}/subscription/checkout`, {
        plan_id: planId,
        quantity: quantity,
        origin_url: window.location.origin
      }, { withCredentials: true });

      if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Error creating checkout session');
    } finally {
      setLoadingCheckout(false);
      setSelectedPlan(null);
    }
  };

  const calculateSchoolPrice = (planId, count) => {
    if (planId === 'school') {
      return (6 * count * 12).toLocaleString();
    } else if (planId === 'district') {
      return (4 * count * 12).toLocaleString();
    }
    return 0;
  };

  const pricingContent = (
    <>
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
            {isEs ? 'Precios simples para profesores y educadores' : 'Simple pricing for teachers and educators'}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            {isEs 
              ? 'Elige el plan que se adapte a tu flujo de trabajo de enseñanza. Cada plan incluye las herramientas principales de TeacherHubPro y soporte de IA integrado.'
              : "Choose the plan that fits your teaching workflow. Every plan includes TeacherHubPro's core tools and built-in AI support."}
          </p>
          
          {/* Status Badge */}
          {subscriptionStatus && (
            <div className="mt-6">
              {subscriptionStatus.status === 'admin' && (
                <Badge className="bg-purple-100 text-purple-800 text-sm px-4 py-1">
                  {isEs ? 'Cuenta de Administrador - Acceso Completo' : 'Admin Account - Full Access'}
                </Badge>
              )}
              {subscriptionStatus.status === 'trialing' && (
                <Badge className="bg-amber-100 text-amber-800 text-sm px-4 py-1">
                  {isEs ? 'Prueba Gratis' : 'Free Trial'}: {subscriptionStatus.days_left} {isEs ? 'días restantes' : 'days remaining'}
                </Badge>
              )}
              {subscriptionStatus.status === 'active' && (
                <Badge className="bg-green-100 text-green-800 text-sm px-4 py-1">
                  {isEs ? 'Suscripción Activa' : 'Active Subscription'}: {subscriptionStatus.plan}
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Trial Expired Alert */}
      {trialExpired && (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 -mt-8 mb-8">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {isEs ? 'Tu prueba gratis ha expirado. Por favor selecciona un plan para continuar usando TeacherHubPro.' : 'Your free trial has expired. Please select a plan to continue using TeacherHubPro.'}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Teacher Count for School Plans */}
      <div className="mx-auto max-w-md px-4 sm:px-6 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {isEs ? 'Número de profesores' : 'Number of teachers'} ({isEs ? 'para planes escolares' : 'for school plans'})
          </label>
          <Input
            type="number"
            min="10"
            value={teacherCount}
            onChange={(e) => setTeacherCount(Math.max(10, parseInt(e.target.value) || 10))}
            className="w-full"
            data-testid="teacher-count-input"
          />
          <p className="text-xs text-slate-500 mt-1">
            {isEs ? 'Mínimo 10 profesores para planes escolares' : 'Minimum 10 teachers for school plans'}
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-lime-500 shadow-lg' : 'shadow-sm'} hover:shadow-lg transition-shadow`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-lime-500 text-white shadow-md">
                      {isEs ? 'Mejor Valor' : 'Best Value'}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-2 pt-6">
                  <div className="mx-auto mb-3 p-3 rounded-xl bg-white shadow-sm border border-slate-100">
                    <plan.icon className="h-6 w-6 text-slate-700" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">{plan.name}</CardTitle>
                  <p className="text-xs font-medium text-lime-600 mt-1">{plan.bestFor}</p>
                </CardHeader>
                
                <CardContent className="text-center pt-4">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">{plan.period}</span>
                  </div>
                  
                  {plan.savings && (
                    <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">
                      {plan.savings}
                    </Badge>
                  )}
                  
                  {plan.billedYearly && (
                    <div className="text-sm text-slate-600 mb-4">
                      {isEs ? 'Facturado anualmente' : 'Billed annually'}
                      {['school', 'district'].includes(plan.id) && (
                        <div className="font-semibold text-slate-800 mt-1">
                          {teacherCount >= plan.minTeachers ? (
                            <>
                              {teacherCount} {isEs ? 'profesores' : 'teachers'}: ${calculateSchoolPrice(plan.id, teacherCount)}/{isEs ? 'año' : 'year'}
                            </>
                          ) : (
                            <span className="text-amber-600">
                              {isEs ? 'Mínimo' : 'Minimum'} {plan.minTeachers} {isEs ? 'profesores' : 'teachers'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <p className="text-sm text-slate-600 mb-6 min-h-[60px]">
                    {plan.description}
                  </p>
                  
                  <ul className="space-y-2 text-left text-sm mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-lime-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <Button 
                    className={`w-full font-semibold ${plan.popular ? 'bg-lime-500 hover:bg-lime-600 text-slate-900' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={
                      loadingCheckout || 
                      (subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === plan.id) ||
                      (['school', 'district'].includes(plan.id) && teacherCount < plan.minTeachers)
                    }
                    data-testid={`subscribe-btn-${plan.id}`}
                  >
                    {loadingCheckout && selectedPlan === plan.id ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {isEs ? 'Procesando...' : 'Processing...'}</>
                    ) : !user ? (
                      isEs ? 'Comenzar Prueba Gratis' : 'Start Free Trial'
                    ) : subscriptionStatus?.status === 'admin' ? (
                      isEs ? 'Probar Checkout' : 'Test Checkout'
                    ) : subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === plan.id ? (
                      isEs ? 'Plan Actual' : 'Current Plan'
                    ) : (
                      isEs ? 'Comenzar Prueba Gratis' : 'Start Free Trial'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Value Reassurance Bar */}
      <section className="py-8 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <PricingValueBar language={language} />
        </div>
      </section>

      {/* Why It's Worth It */}
      <PricingComparison language={language} />

      {/* FAQ */}
      <PricingFAQ language={language} />

      {/* Final CTA */}
      <CTASection 
        language={language}
        headline={isEs ? 'Elige un plan y comienza a ahorrar tiempo' : 'Choose a plan and start saving time'}
        subheadline={isEs ? 'Obtén las herramientas que necesitas para planificar, organizar y enseñar más eficientemente.' : 'Get the tools you need to plan, organize, and teach more efficiently.'}
        primaryCTA={isEs ? 'Comenzar Prueba Gratis' : 'Start Free Trial'}
        primaryLink="/auth"
        variant="dark"
      />

      {/* Trial Info */}
      <div className="py-8 bg-slate-900 text-center">
        <p className="text-sm text-slate-400">
          {isEs 
            ? 'Todas las suscripciones incluyen 7 días de prueba gratis. No se cobra hasta que termine la prueba.' 
            : 'All subscriptions include a 7-day free trial. No charge until trial ends.'}
        </p>
      </div>
    </>
  );

  // Public Pricing Page (unauthenticated)
  const PublicPricingPage = () => (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">TeacherHubPro</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                {isEs ? 'Funciones' : 'Features'}
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-900">
                {isEs ? 'Precios' : 'Pricing'}
              </Link>
              <Link to="/trust" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                {isEs ? 'Confianza' : 'Trust'}
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  {isEs ? 'Iniciar Sesión' : 'Log In'}
                </Button>
              </Link>
              <Link to="/auth" className="hidden sm:block">
                <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900">
                  {isEs ? 'Comenzar Gratis' : 'Start Free'}
                </Button>
              </Link>
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <nav className="flex flex-col gap-4">
                <Link to="/features" onClick={() => setMobileMenuOpen(false)}>{isEs ? 'Funciones' : 'Features'}</Link>
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>{isEs ? 'Precios' : 'Pricing'}</Link>
                <Link to="/trust" onClick={() => setMobileMenuOpen(false)}>{isEs ? 'Confianza' : 'Trust'}</Link>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900">
                    {isEs ? 'Comenzar Gratis' : 'Start Free'}
                  </Button>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>{pricingContent}</main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-lime-400 to-lime-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">TeacherHubPro</span>
          </Link>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} TeacherHubPro. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );

  // Return appropriate version
  if (user) {
    return <Layout>{pricingContent}</Layout>;
  }
  
  return <PublicPricingPage />;
};

export default Pricing;
