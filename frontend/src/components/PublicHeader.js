import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { LogIn } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const PublicHeader = ({ showAuth = true }) => {
  const { t } = useLanguage();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
            alt="TeacherHubPro Logo"
            className="h-10 w-10 sm:h-11 sm:w-11 object-contain"
            data-testid="header-logo"
          />
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">TeacherHubPro</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <a 
            href="/#solution" 
            className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            data-testid="nav-features"
          >
            {t('landingFeatures') || 'Features'}
          </a>
          <a 
            href="/#how-it-works" 
            className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            data-testid="nav-how-it-works"
          >
            {t('landingSeeHowItWorks') || 'How It Works'}
          </a>
          <Link 
            to="/pricing" 
            className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
            data-testid="nav-pricing"
          >
            {t('landingPricing') || 'Pricing'}
          </Link>
        </nav>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector variant="compact" dropdownPosition="down" />
          {showAuth && (
            <>
              <Link to="/auth?mode=login">
                <Button 
                  variant="ghost"
                  className="text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 px-3 sm:px-4"
                  data-testid="header-login"
                >
                  <LogIn className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">{t('landingLogIn') || 'Log In'}</span>
                </Button>
              </Link>
              <Link to="/auth">
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 shadow-sm hover:shadow-md transition-all"
                  data-testid="header-cta"
                >
                  {t('landingStartFreeCta') || 'Start Free'}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
