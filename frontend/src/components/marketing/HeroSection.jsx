import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowRight, Clock, Play } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const HeroSection = ({ language = 'en' }) => {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-lime-50/30 pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-100/40 via-transparent to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div className="text-center lg:text-left">
            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              {t('heroTitle')}
            </h1>
            
            {/* Subheadline */}
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {t('heroSubtitle')}
            </p>
            
            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold px-8 py-6 text-lg shadow-lg shadow-lime-500/25 hover:shadow-xl hover:shadow-lime-500/30 transition-all"
                  data-testid="hero-start-trial-btn"
                >
                  {t('startFreeTrial')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/features">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:w-auto border-slate-300 hover:bg-slate-50 px-8 py-6 text-lg"
                  data-testid="hero-see-how-btn"
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t('seeHowItWorks')}
                </Button>
              </Link>
            </div>
            
            {/* Supporting line */}
            <p className="mt-6 text-sm text-slate-500">
              {t('heroSupportingText')}
            </p>
          </div>
          
          {/* Right: Visual */}
          <div className="relative">
            {/* Main dashboard mockup */}
            <div className="relative rounded-2xl bg-white shadow-2xl shadow-slate-900/10 border border-slate-200/60 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center">
                  <span className="text-xs text-slate-400 font-medium">TeacherHubPro Dashboard</span>
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-slate-50 to-white">
                {/* Mini dashboard preview */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">{t('dashboardLessons')}</div>
                    <div className="text-xl font-bold text-slate-800">24</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">{t('dashboardStudents')}</div>
                    <div className="text-xl font-bold text-slate-800">86</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm">
                    <div className="text-xs text-slate-500 mb-1">{t('dashboardAvgGrade')}</div>
                    <div className="text-xl font-bold text-lime-600">B+</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-gradient-to-r from-lime-100 to-lime-50 rounded-lg border border-lime-200/50" />
                  <div className="h-8 bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg border border-blue-200/50" />
                  <div className="h-8 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg border border-purple-200/50" />
                </div>
              </div>
            </div>
            
            {/* Floating stat badge */}
            <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-lime-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">5+</div>
                <div className="text-sm text-slate-600">
                  {t('hoursSavedPerWeek')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
