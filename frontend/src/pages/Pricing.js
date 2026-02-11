import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Check, Star, Users, Building, Crown, Loader2, BookOpen, Globe, ArrowLeft } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Pricing = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [teacherCount, setTeacherCount] = useState(10);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

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
      name: language === 'es' ? 'Mensual Individual' : 'Individual Monthly',
      price: '$9.99',
      period: language === 'es' ? '/mes' : '/month',
      description: language === 'es' ? 'Acceso completo para maestros individuales' : 'Full access for individual teachers',
      icon: Star,
      features: [
        language === 'es' ? 'Planificador de lecciones' : 'Lesson Planner',
        language === 'es' ? 'Seguimiento de asistencia' : 'Attendance Tracker',
        language === 'es' ? 'Cuaderno de notas' : 'Gradebook',
        language === 'es' ? 'Exportar a PDF' : 'PDF Export',
        language === 'es' ? 'Plantillas' : 'Templates',
        language === 'es' ? 'Soporte por email' : 'Email Support',
      ],
      popular: false,
      color: 'bg-slate-50 border-slate-200'
    },
    {
      id: 'individual_yearly',
      name: language === 'es' ? 'Anual Individual' : 'Individual Yearly',
      price: '$79',
      period: language === 'es' ? '/año' : '/year',
      savings: language === 'es' ? 'Ahorra $40' : 'Save $40',
      description: language === 'es' ? 'El mejor valor para maestros individuales' : 'Best value for individual teachers',
      icon: Crown,
      features: [
        language === 'es' ? 'Todo en Mensual' : 'Everything in Monthly',
        language === 'es' ? 'Soporte prioritario' : 'Priority Support',
        language === 'es' ? '2 meses gratis' : '2 months free',
        language === 'es' ? 'Actualizaciones anticipadas' : 'Early feature access',
      ],
      popular: true,
      color: 'bg-lime-50 border-lime-300'
    },
    {
      id: 'school',
      name: language === 'es' ? 'Plan Escolar' : 'School Plan',
      price: '$6',
      period: language === 'es' ? '/maestro/mes' : '/teacher/month',
      billedYearly: true,
      minTeachers: 10,
      description: language === 'es' ? 'Perfecto para escuelas pequeñas y medianas' : 'Perfect for small to medium schools',
      icon: Users,
      features: [
        language === 'es' ? 'Todo lo individual' : 'All Individual Features',
        language === 'es' ? 'Panel de administrador' : 'Admin Dashboard',
        language === 'es' ? 'Logo de la escuela' : 'School Branding',
        language === 'es' ? 'Importación masiva' : 'Bulk Import',
        language === 'es' ? 'Reportes escolares' : 'School Reports',
        language === 'es' ? 'Gestión de usuarios' : 'User Management',
      ],
      popular: false,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'district',
      name: language === 'es' ? 'Plan de Distrito' : 'District Plan',
      price: '$4',
      period: language === 'es' ? '/maestro/mes' : '/teacher/month',
      billedYearly: true,
      minTeachers: 100,
      description: language === 'es' ? 'Para distritos escolares grandes' : 'For large school districts',
      icon: Building,
      features: [
        language === 'es' ? 'Todo lo escolar' : 'All School Features',
        language === 'es' ? 'Analíticas de distrito' : 'District Analytics',
        language === 'es' ? 'Integración SSO' : 'SSO Integration',
        language === 'es' ? 'Soporte dedicado' : 'Dedicated Support',
        language === 'es' ? 'Capacitación personalizada' : 'Custom Training',
        language === 'es' ? 'API Access' : 'API Access',
      ],
      popular: false,
      color: 'bg-purple-50 border-purple-200'
    }
  ];

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/login');
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

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-heading font-bold text-slate-800 mb-4">
            {language === 'es' ? 'Elige tu Plan' : 'Choose Your Plan'}
          </h1>
          <p className="text-lg text-slate-600">
            {language === 'es' 
              ? 'Comienza con 7 días gratis. Cancela en cualquier momento.' 
              : 'Start with a 7-day free trial. Cancel anytime.'}
          </p>
          
          {/* Current Status */}
          {subscriptionStatus && (
            <div className="mt-4">
              {subscriptionStatus.status === 'admin' && (
                <Badge className="bg-purple-100 text-purple-800">
                  {language === 'es' ? 'Cuenta de Administrador - Acceso Completo' : 'Admin Account - Full Access'}
                </Badge>
              )}
              {subscriptionStatus.status === 'trialing' && subscriptionStatus.plan === 'free_trial' && (
                <Badge className="bg-amber-100 text-amber-800">
                  {language === 'es' 
                    ? `Período de prueba: ${subscriptionStatus.days_left} días restantes` 
                    : `Free Trial: ${subscriptionStatus.days_left} days remaining`}
                </Badge>
              )}
              {subscriptionStatus.status === 'active' && (
                <Badge className="bg-green-100 text-green-800">
                  {language === 'es' ? 'Suscripción Activa' : 'Active Subscription'}: {subscriptionStatus.plan}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Teacher Count Selector for School/District */}
        <div className="max-w-md mx-auto bg-white p-4 rounded-lg border shadow-sm">
          <label className="block text-sm font-medium mb-2">
            {language === 'es' ? 'Número de maestros (para planes escolares)' : 'Number of teachers (for school plans)'}
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
            {language === 'es' ? 'Mínimo 10 maestros para Plan Escolar, 100 para Distrito' : 'Minimum 10 teachers for School Plan, 100 for District'}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-lime-500' : ''}`}
              data-testid={`plan-card-${plan.id}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-lime-500 text-white">
                    {language === 'es' ? 'Más Popular' : 'Most Popular'}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2 p-3 rounded-full bg-white shadow-sm">
                  <plan.icon className="h-6 w-6 text-slate-700" />
                </div>
                <CardTitle className="text-xl font-heading">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                </div>
                
                {plan.savings && (
                  <Badge variant="secondary" className="mb-4 bg-green-100 text-green-800">
                    {plan.savings}
                  </Badge>
                )}
                
                {plan.billedYearly && (
                  <div className="text-sm text-slate-500 mb-4">
                    {language === 'es' ? 'Facturado anualmente' : 'Billed yearly'}
                    {['school', 'district'].includes(plan.id) && (
                      <div className="font-semibold text-slate-700 mt-1">
                        {teacherCount >= plan.minTeachers ? (
                          <>
                            {teacherCount} {language === 'es' ? 'maestros' : 'teachers'}: ${calculateSchoolPrice(plan.id, teacherCount)}/year
                          </>
                        ) : (
                          <span className="text-amber-600">
                            {language === 'es' ? `Mínimo ${plan.minTeachers} maestros` : `Minimum ${plan.minTeachers} teachers`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <ul className="space-y-2 text-left text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-lime-600 hover:bg-lime-700' : ''}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={
                    loadingCheckout || 
                    (subscriptionStatus?.status === 'admin') ||
                    (subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === plan.id) ||
                    (['school', 'district'].includes(plan.id) && teacherCount < plan.minTeachers)
                  }
                  data-testid={`subscribe-btn-${plan.id}`}
                >
                  {loadingCheckout && selectedPlan === plan.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {language === 'es' ? 'Procesando...' : 'Processing...'}</>
                  ) : subscriptionStatus?.status === 'admin' ? (
                    language === 'es' ? 'Acceso de Admin' : 'Admin Access'
                  ) : subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === plan.id ? (
                    language === 'es' ? 'Plan Actual' : 'Current Plan'
                  ) : (
                    language === 'es' ? 'Comenzar Prueba Gratis' : 'Start Free Trial'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="max-w-2xl mx-auto text-center text-sm text-slate-500">
          <p>
            {language === 'es' 
              ? 'Todas las suscripciones incluyen 7 días de prueba gratis. No se cobra hasta que termine la prueba.' 
              : 'All subscriptions include a 7-day free trial. No charge until trial ends.'}
          </p>
          <p className="mt-2">
            {language === 'es' 
              ? '¿Preguntas? Contáctanos en support@teacherhub.com' 
              : 'Questions? Contact us at support@teacherhub.com'}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Pricing;
