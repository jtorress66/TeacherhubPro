import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import MarketingLayout from './MarketingLayout';

const FeatureDetailPage = ({ 
  featureKey,
  icon: Icon,
  iconColor = 'bg-lime-100 text-lime-600',
  heroImage,
  relatedFeatures = []
}) => {
  const { t } = useLanguage();

  // Get translated content using feature key
  const title = t(`feature${featureKey}Title`);
  const subtitle = t(`feature${featureKey}Subtitle`);
  const description = t(`feature${featureKey}Description`);
  const benefits = [
    t(`feature${featureKey}Benefit1`),
    t(`feature${featureKey}Benefit2`),
    t(`feature${featureKey}Benefit3`),
    t(`feature${featureKey}Benefit4`)
  ].filter(b => b && !b.includes('feature'));
  
  const howItWorks = [
    t(`feature${featureKey}HowItWorks1`),
    t(`feature${featureKey}HowItWorks2`),
    t(`feature${featureKey}HowItWorks3`)
  ].filter(h => h && !h.includes('feature'));

  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 via-white to-lime-50/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link 
            to="/features" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToFeatures')}
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Content */}
            <div>
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${iconColor} flex items-center justify-center mb-6`}>
                <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                {title}
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 mb-6 sm:mb-8">
                {subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    className="w-full sm:w-auto bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold px-6 sm:px-8"
                    data-testid="feature-start-trial-btn"
                  >
                    {t('startFreeTrial')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Hero image */}
            <div className="relative">
              <div className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
                {heroImage ? (
                  <img 
                    src={heroImage} 
                    alt={title}
                    className="w-full h-64 sm:h-80 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className={`w-full h-64 sm:h-80 ${iconColor.replace('text-', 'bg-').replace('-600', '-50')} flex items-center justify-center`}>
                    <Icon className={`w-16 h-16 sm:w-24 sm:h-24 ${iconColor.split(' ')[1]}`} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      {benefits.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 sm:mb-12 text-center">
              {t('keyBenefits')}
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 sm:gap-4 bg-white rounded-xl p-4 sm:p-6 border border-slate-200"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-lime-100 flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-4 h-4 text-lime-600" />
                  </div>
                  <p className="text-sm sm:text-base text-slate-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      {howItWorks.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 sm:mb-12 text-center">
              {t('howItWorks')}
            </h2>
            
            <div className="space-y-4 sm:space-y-6">
              {howItWorks.map((step, index) => (
                <div key={index} className="flex items-start gap-4 sm:gap-6">
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm sm:text-base">
                    {index + 1}
                  </div>
                  <p className="text-sm sm:text-base text-slate-700 pt-1 sm:pt-2">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-lime-50 via-white to-emerald-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
            {t('readyToGetStarted')}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-10 max-w-2xl mx-auto">
            {t('featureCTASubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 sm:px-8"
              >
                {t('startFreeTrial')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-8"
              >
                {t('viewPricing')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Related Features */}
      {relatedFeatures.length > 0 && (
        <section className="py-12 sm:py-16 lg:py-20 bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center">
              {t('exploreOtherFeatures')}
            </h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {relatedFeatures.map((feature, index) => (
                <Link 
                  key={index}
                  to={feature.link}
                  className="group bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50 hover:border-lime-500/50 transition-all"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${feature.iconColor} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-xs sm:text-sm text-slate-400">{t(feature.descKey)}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </MarketingLayout>
  );
};

export default FeatureDetailPage;
