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
import { Check, Star, Users, Building, Crown, Loader2, BookOpen, Globe, ArrowLeft, AlertCircle } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

const API = `${window.location.origin}/api`;

const Pricing = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [teacherCount, setTeacherCount] = useState(10);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  // Check if user was redirected due to trial expiration
  const trialExpired = location.state?.trialExpired;

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
      name: t('pricingIndividualMonthly'),
      price: '$9.99',
      period: '/' + t('pricingMonth'),
      description: t('pricingIndividualMonthlyDesc'),
      icon: Star,
      features: [
        t('pricingFeatureLessonPlanner'),
        t('pricingFeatureAttendanceTracker'),
        t('pricingFeatureGradebook'),
        t('pricingFeaturePdfExport'),
        t('pricingFeatureTemplates'),
        t('pricingFeatureEmailSupport'),
      ],
      popular: false,
      color: 'bg-slate-50 border-slate-200'
    },
    {
      id: 'individual_yearly',
      name: t('pricingIndividualYearly'),
      price: '$79',
      period: '/' + t('pricingYear'),
      savings: t('pricingSave') + ' $40',
      description: t('pricingIndividualYearlyDesc'),
      icon: Crown,
      features: [
        t('pricingFeatureEverythingMonthly'),
        t('pricingFeaturePrioritySupport'),
        t('pricingFeature2MonthsFree'),
        t('pricingFeatureEarlyAccess'),
      ],
      popular: true,
      color: 'bg-lime-50 border-lime-300'
    },
    {
      id: 'school',
      name: t('pricingSchoolPlanName'),
      price: '$6',
      period: '/' + t('pricingPerTeacher') + '/' + t('pricingMonth'),
      billedYearly: true,
      minTeachers: 10,
      description: t('pricingSchoolPlanDesc'),
      icon: Users,
      features: [
        t('pricingFeatureAllIndividual'),
        t('pricingFeatureAdminDashboard'),
        t('pricingFeatureSchoolBranding'),
        t('pricingFeatureBulkImport'),
        t('pricingFeatureSchoolReports'),
        t('pricingFeatureUserManagement'),
      ],
      popular: false,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      id: 'district',
      name: t('pricingDistrictPlanName'),
      price: '$4',
      period: '/' + t('pricingPerTeacher') + '/' + t('pricingMonth'),
      billedYearly: true,
      minTeachers: 100,
      description: t('pricingDistrictPlanDesc'),
      icon: Building,
      features: [
        t('pricingFeatureAllSchool'),
        t('pricingFeatureDistrictAnalytics'),
        t('pricingFeatureSsoIntegration'),
        t('pricingFeatureDedicatedSupport'),
        t('pricingFeatureCustomTraining'),
        t('pricingFeatureApiAccess'),
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

  // Public pricing page wrapper for unauthenticated users
  const PublicWrapper = ({ children }) => (
    <div className="min-h-screen paper-bg">
      {/* Header */}
      <header className="border-b border-cyan-100/50 bg-gradient-to-r from-cyan-50/95 via-blue-50/90 to-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 sm:gap-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-12 w-12 sm:h-20 sm:w-20 object-contain"
            />
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-bold text-slate-800">TeacherHubPro</span>
              <span className="text-xs font-medium text-cyan-600 hidden sm:block">{t('pricingYourDigitalClassroom') || 'Your digital classroom'}</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t('pricingBack') || 'Back'}</span>
              </Button>
            </Link>
            <LanguageSelector variant="compact" dropdownPosition="down" />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center text-slate-500 text-sm">
          <p>© 2026 TeacherHubPro. {t('pricingAllRightsReserved') || 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );

  const pricingContent = (
      <div className="space-y-6 sm:space-y-8">
        {/* Trial Expired Alert */}
        {trialExpired && (
          <Alert className="bg-amber-50 border-amber-200 max-w-2xl mx-auto">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              {t('pricingTrialExpired') || 'Your free trial has expired. Please select a plan to continue using TeacherHubPro.'}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-heading font-bold text-slate-800 mb-3 sm:mb-4">
            {t('pricingTitle')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            {t('pricingSubtitle')}
          </p>
          
          {/* Current Status */}
          {subscriptionStatus && (
            <div className="mt-4">
              {subscriptionStatus.status === 'admin' && (
                <Badge className="bg-purple-100 text-purple-800">
                  {t('pricingAdminAccount') || 'Admin Account - Full Access'}
                </Badge>
              )}
              {subscriptionStatus.status === 'trialing' && subscriptionStatus.plan === 'free_trial' && (
                <Badge className="bg-amber-100 text-amber-800">
                  {t('pricingFreeTrial')}: {subscriptionStatus.days_left} {t('pricingDaysRemaining')}
                </Badge>
              )}
              {subscriptionStatus.status === 'active' && (
                <Badge className="bg-green-100 text-green-800">
                  {t('pricingActiveSubscription')}: {subscriptionStatus.plan}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Teacher Count Selector for School/District */}
        <div className="max-w-md mx-auto bg-white p-4 rounded-lg border shadow-sm">
          <label className="block text-sm font-medium mb-2">
            {t('pricingNumberOfTeachers') || 'Number of teachers'} ({t('pricingForSchoolPlans') || 'for school plans'})
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
            {t('pricingMinTeachers')}
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
                    {t('pricingMostPopular')}
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2 p-3 rounded-full bg-white shadow-sm">
                  <plan.icon className="h-6 w-6 text-slate-700" />
                </div>
                <CardTitle className="text-xl font-heading text-slate-800">{plan.name}</CardTitle>
                <CardDescription className="text-sm text-slate-600">{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="text-center">
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
                    {t('pricingBilledAnnually')}
                    {['school', 'district'].includes(plan.id) && (
                      <div className="font-semibold text-slate-800 mt-1">
                        {teacherCount >= plan.minTeachers ? (
                          <>
                            {teacherCount} {t('pricingTeachers') || 'teachers'}: ${calculateSchoolPrice(plan.id, teacherCount)}/{t('pricingYear')}
                          </>
                        ) : (
                          <span className="text-amber-600">
                            {t('pricingMinimum')} {plan.minTeachers} {t('pricingTeachers') || 'teachers'}
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
                      <span className="text-slate-700">{feature}</span>
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
                    (subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === plan.id) ||
                    (['school', 'district'].includes(plan.id) && teacherCount < plan.minTeachers)
                  }
                  data-testid={`subscribe-btn-${plan.id}`}
                >
                  {loadingCheckout && selectedPlan === plan.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('pricingProcessing') || 'Processing...'}</>
                  ) : !user ? (
                    t('pricingSignUpFree')
                  ) : subscriptionStatus?.status === 'admin' ? (
                    t('pricingTestCheckout') || 'Test Checkout'
                  ) : subscriptionStatus?.status === 'active' && subscriptionStatus?.plan === plan.id ? (
                    t('pricingCurrentPlan')
                  ) : (
                    t('pricingGetStarted') || 'Start Free Trial'
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
              ? '¿Preguntas? Contáctanos en support@teacherhubpro.com' 
              : 'Questions? Contact us at support@teacherhubpro.com'}
          </p>
        </div>
      </div>
  );

  // Return appropriate wrapper based on authentication status
  if (user) {
    return <Layout>{pricingContent}</Layout>;
  }
  
  return <PublicWrapper>{pricingContent}</PublicWrapper>;
};

export default Pricing;
