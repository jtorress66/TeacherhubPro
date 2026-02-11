import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubscriptionSuccess = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      confirmSubscription(sessionId);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  const confirmSubscription = async (sessionId) => {
    try {
      const res = await axios.get(`${API}/subscription/success?session_id=${sessionId}`, { 
        withCredentials: true 
      });
      
      if (res.data.status === 'success') {
        setSubscription(res.data.subscription);
        setStatus('success');
      } else {
        setStatus('pending');
      }
    } catch (error) {
      console.error('Error confirming subscription:', error);
      setStatus('error');
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto mt-12">
        <Card className="text-center">
          <CardContent className="pt-8 pb-8">
            {status === 'loading' && (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-lime-600" />
                <h2 className="text-xl font-heading font-semibold">
                  {language === 'es' ? 'Confirmando tu suscripción...' : 'Confirming your subscription...'}
                </h2>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
                <h2 className="text-2xl font-heading font-bold text-green-600">
                  {language === 'es' ? '¡Suscripción Exitosa!' : 'Subscription Successful!'}
                </h2>
                <p className="text-slate-600">
                  {language === 'es' 
                    ? 'Tu cuenta ha sido activada. Disfruta de todas las funciones de TeacherHub.' 
                    : 'Your account has been activated. Enjoy all TeacherHub features.'}
                </p>
                {subscription && (
                  <div className="bg-slate-50 p-4 rounded-lg text-left text-sm">
                    <p><strong>{language === 'es' ? 'Plan' : 'Plan'}:</strong> {subscription.plan_id}</p>
                    <p><strong>{language === 'es' ? 'Estado' : 'Status'}:</strong> {subscription.status}</p>
                  </div>
                )}
                <Button onClick={() => navigate('/dashboard')} className="mt-4">
                  {language === 'es' ? 'Ir al Panel' : 'Go to Dashboard'}
                </Button>
              </div>
            )}

            {status === 'pending' && (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto text-amber-500" />
                <h2 className="text-xl font-heading font-semibold">
                  {language === 'es' ? 'Procesando pago...' : 'Processing payment...'}
                </h2>
                <p className="text-slate-600">
                  {language === 'es' 
                    ? 'Tu pago está siendo procesado. Esto puede tomar unos momentos.' 
                    : 'Your payment is being processed. This may take a moment.'}
                </p>
                <Button variant="outline" onClick={() => navigate('/dashboard')}>
                  {language === 'es' ? 'Continuar al Panel' : 'Continue to Dashboard'}
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="h-16 w-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-heading font-semibold text-red-600">
                  {language === 'es' ? 'Error de Suscripción' : 'Subscription Error'}
                </h2>
                <p className="text-slate-600">
                  {language === 'es' 
                    ? 'Hubo un problema con tu suscripción. Por favor intenta de nuevo.' 
                    : 'There was a problem with your subscription. Please try again.'}
                </p>
                <div className="space-x-2">
                  <Button variant="outline" onClick={() => navigate('/pricing')}>
                    {language === 'es' ? 'Ver Planes' : 'View Plans'}
                  </Button>
                  <Button onClick={() => navigate('/dashboard')}>
                    {language === 'es' ? 'Ir al Panel' : 'Go to Dashboard'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SubscriptionSuccess;
