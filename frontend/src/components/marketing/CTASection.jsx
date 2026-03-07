import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const CTASection = ({ 
  language = 'en',
  headline,
  subheadline,
  primaryCTA,
  primaryLink = '/auth',
  secondaryCTA,
  secondaryLink,
  variant = 'default' // 'default' | 'dark' | 'gradient'
}) => {
  const { t } = useLanguage();

  const bgClasses = {
    default: 'bg-gradient-to-br from-lime-50 via-white to-emerald-50',
    dark: 'bg-slate-900',
    gradient: 'bg-gradient-to-r from-lime-500 to-emerald-500'
  };

  const textClasses = {
    default: 'text-slate-900',
    dark: 'text-white',
    gradient: 'text-slate-900'
  };

  const subTextClasses = {
    default: 'text-slate-600',
    dark: 'text-slate-300',
    gradient: 'text-slate-700'
  };

  return (
    <section className={`py-20 ${bgClasses[variant]}`}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className={`text-3xl sm:text-4xl font-bold ${textClasses[variant]} mb-6`}>
          {headline || t('landingCTATitle')}
        </h2>
        <p className={`text-lg ${subTextClasses[variant]} mb-10 max-w-2xl mx-auto`}>
          {subheadline || t('landingCTASubtitle')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={primaryLink}>
            <Button 
              size="lg" 
              className={`w-full sm:w-auto px-8 py-6 text-lg font-semibold shadow-lg transition-all ${
                variant === 'dark' 
                  ? 'bg-lime-500 hover:bg-lime-400 text-slate-900 shadow-lime-500/25' 
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/25'
              }`}
              data-testid="cta-primary-btn"
            >
              {primaryCTA || t('startFreeTrial')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          {(secondaryCTA || secondaryLink) && (
            <Link to={secondaryLink || '/pricing'}>
              <Button 
                variant="outline" 
                size="lg"
                className={`w-full sm:w-auto px-8 py-6 text-lg ${
                  variant === 'dark' 
                    ? 'border-slate-600 text-white hover:bg-slate-800' 
                    : 'border-slate-300 hover:bg-white/50'
                }`}
                data-testid="cta-secondary-btn"
              >
                {secondaryCTA || t('viewPricing')}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default CTASection;
