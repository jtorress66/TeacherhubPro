import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  School, 
  Users, 
  FileText, 
  ArrowRight,
  X,
  Rocket,
  Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OnboardingBanner = ({ onComplete }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const res = await axios.get(`${API}/auth/onboarding-status`, { withCredentials: true });
      setOnboardingData(res.data);
      
      // Show welcome modal on first visit
      if (res.data.onboarding_status === 'not_started') {
        setShowWelcomeModal(true);
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await axios.put(`${API}/auth/onboarding-status`, {
        onboarding_status: 'dismissed'
      }, { withCredentials: true });
      setDismissed(true);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error dismissing onboarding:', error);
    }
  };

  const handleStartSetup = async () => {
    try {
      await axios.put(`${API}/auth/onboarding-status`, {
        onboarding_status: 'in_progress'
      }, { withCredentials: true });
      setShowWelcomeModal(false);
      navigate('/settings?onboarding=1');
    } catch (error) {
      console.error('Error updating onboarding:', error);
      navigate('/settings?onboarding=1');
    }
  };

  const handleCloseWelcome = async () => {
    try {
      await axios.put(`${API}/auth/onboarding-status`, {
        onboarding_status: 'in_progress'
      }, { withCredentials: true });
    } catch (error) {
      console.error('Error updating onboarding:', error);
    }
    setShowWelcomeModal(false);
  };

  if (loading || dismissed || !onboardingData?.show_onboarding) {
    return null;
  }

  const { setup_items, completed_count, total_count } = onboardingData;
  const progressPercent = (completed_count / total_count) * 100;

  const getIcon = (key) => {
    switch (key) {
      case 'school_info': return School;
      case 'first_class': return Users;
      case 'first_planner': return FileText;
      default: return Circle;
    }
  };

  const getLabel = (item) => {
    return language === 'es' ? item.label_es : item.label_en;
  };

  return (
    <>
      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-8 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {language === 'es' ? '¡Bienvenido a TeacherHubPro!' : 'Welcome to TeacherHubPro!'}
              </h2>
              <p className="text-cyan-100">
                {language === 'es' 
                  ? 'Tu asistente digital de enseñanza está listo' 
                  : 'Your digital teaching assistant is ready'}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 mb-6 text-center">
                {language === 'es' 
                  ? 'Para comenzar, configura la información de tu escuela, crea tus clases y tu primer plan de lección.'
                  : 'To get started, set up your school information, create your classes, and your first lesson plan.'}
              </p>

              {/* Quick setup steps preview */}
              <div className="space-y-3 mb-6">
                {Object.entries(setup_items).map(([key, item]) => {
                  const Icon = getIcon(key);
                  return (
                    <div 
                      key={key}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.completed 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {item.completed ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={item.completed ? 'text-green-700' : 'text-slate-600'}>
                        {getLabel(item)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleCloseWelcome}
                >
                  {language === 'es' ? 'Más tarde' : 'Later'}
                </Button>
                <Button 
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                  onClick={handleStartSetup}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Comenzar Configuración' : 'Start Setup'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Progress Card */}
      <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-white shadow-sm" data-testid="onboarding-banner">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Rocket className="h-5 w-5 text-cyan-600" />
                <h3 className="font-semibold text-slate-800">
                  {language === 'es' ? 'Completa tu configuración' : 'Complete Your Setup'}
                </h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-3">
                {language === 'es' 
                  ? 'Configura tu escuela y clases para aprovechar todas las funciones.'
                  : 'Set up your school and classes to unlock all features.'}
              </p>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>{completed_count} / {total_count} {language === 'es' ? 'completado' : 'completed'}</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Setup checklist */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(setup_items).map(([key, item]) => {
                  const Icon = getIcon(key);
                  return (
                    <button
                      key={key}
                      onClick={() => navigate(item.route)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                        item.completed 
                          ? 'bg-green-100 text-green-700 cursor-default' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-300 hover:bg-cyan-50'
                      }`}
                      disabled={item.completed}
                      data-testid={`onboarding-step-${key}`}
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                      <span>{getLabel(item)}</span>
                      {!item.completed && <ArrowRight className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dismiss button */}
            <button 
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title={language === 'es' ? 'Descartar' : 'Dismiss'}
              data-testid="dismiss-onboarding"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default OnboardingBanner;
