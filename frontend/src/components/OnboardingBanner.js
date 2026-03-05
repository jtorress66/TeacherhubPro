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
  Sparkles,
  Play
} from 'lucide-react';
import OnboardingVideo from './OnboardingVideo';

const API = `${window.location.origin}/api`;

const OnboardingBanner = ({ onComplete }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [showVideoTutorial, setShowVideoTutorial] = useState(false);

  useEffect(() => {
    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const res = await axios.get(`${API}/auth/onboarding-status`, { withCredentials: true });
      setOnboardingData(res.data);
      
      // Show video tutorial on first visit
      if (res.data.onboarding_status === 'not_started') {
        setShowVideoTutorial(true);
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
      setShowVideoTutorial(false);
      navigate('/settings?onboarding=1');
    } catch (error) {
      console.error('Error updating onboarding:', error);
      navigate('/settings?onboarding=1');
    }
  };

  const handleCloseVideo = async () => {
    try {
      await axios.put(`${API}/auth/onboarding-status`, {
        onboarding_status: 'in_progress'
      }, { withCredentials: true });
    } catch (error) {
      console.error('Error updating onboarding:', error);
    }
    setShowVideoTutorial(false);
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
      {/* Video Tutorial Modal */}
      {showVideoTutorial && (
        <OnboardingVideo 
          language={language}
          onClose={handleCloseVideo}
          onStartSetup={handleStartSetup}
        />
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
                <button
                  onClick={() => setShowVideoTutorial(true)}
                  className="ml-2 text-xs text-cyan-600 hover:text-cyan-700 flex items-center gap-1 bg-cyan-50 px-2 py-1 rounded-full"
                >
                  <Play className="h-3 w-3" />
                  {language === 'es' ? 'Ver tutorial con audio' : 'Watch audio tutorial'}
                </button>
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
