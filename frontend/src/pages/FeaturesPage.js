import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';
import { FeaturesGroups, FeaturesSummary, CTASection } from '../components/marketing';

const FeaturesPage = () => {
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isEs = language === 'es';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="TeacherHubPro" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-slate-900">TeacherHubPro</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm font-medium text-slate-900">
                {t('features') || (isEs ? 'Funciones' : 'Features')}
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                {t('pricing') || (isEs ? 'Precios' : 'Pricing')}
              </Link>
              <Link to="/trust" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                {t('trustCenter') || (isEs ? 'Confianza' : 'Trust')}
              </Link>
              <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                {t('contact') || (isEs ? 'Contacto' : 'Contact')}
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSelector />
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm">
                  {t('login') || (isEs ? 'Iniciar Sesión' : 'Log In')}
                </Button>
              </Link>
              <Link to="/auth" className="hidden sm:block">
                <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900">
                  {t('startFree') || (isEs ? 'Comenzar Gratis' : 'Start Free')}
                  <ArrowRight className="ml-1 w-4 h-4" />
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
                <Link to="/features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">
                  {t('features') || (isEs ? 'Funciones' : 'Features')}
                </Link>
                <Link to="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">
                  {t('pricing') || (isEs ? 'Precios' : 'Pricing')}
                </Link>
                <Link to="/trust" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">
                  {t('trustCenter') || (isEs ? 'Confianza' : 'Trust')}
                </Link>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium">
                  {t('contact') || (isEs ? 'Contacto' : 'Contact')}
                </Link>
                <div className="pt-4 border-t flex flex-col gap-3">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t('login') || (isEs ? 'Iniciar Sesión' : 'Log In')}
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900">
                      {t('startFree') || (isEs ? 'Comenzar Gratis' : 'Start Free')}
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
              {t('featuresHeroTitle') || (isEs ? 'Herramientas poderosas diseñadas para profesores' : 'Powerful tools built for teachers')}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              {t('featuresHeroSubtitle') || (isEs 
                ? 'TeacherHubPro reúne las herramientas esenciales que los educadores necesitan para planificar, organizar, crear y gestionar el trabajo del aula más eficientemente.'
                : 'TeacherHubPro brings together the essential tools educators need to plan, organize, create, and manage classroom work more efficiently.')}
            </p>
            <div className="mt-8">
              <Link to="/auth">
                <Button size="lg" className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-semibold px-8">
                  {t('startFreeTrial') || (isEs ? 'Comenzar Prueba Gratis' : 'Start Free Trial')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Groups */}
        <section className="py-8 bg-slate-50">
          <FeaturesGroups language={language} />
        </section>

        {/* What This Means For You */}
        <FeaturesSummary language={language} />

        {/* Final CTA */}
        <CTASection 
          language={language}
          headline={t('featuresCTATitle') || (isEs ? 'Descubre cómo TeacherHubPro se adapta a tu día de enseñanza' : 'See how TeacherHubPro fits into your teaching day')}
          subheadline={t('featuresCTASubtitle') || (isEs ? 'Explora la plataforma y descubre una mejor manera de planificar, organizar y enseñar.' : 'Explore the platform and discover a better way to plan, organize, and teach.')}
          primaryCTA={t('startFreeTrial') || (isEs ? 'Comenzar Prueba Gratis' : 'Start Free Trial')}
          primaryLink="/auth"
          secondaryCTA={t('viewPricing') || (isEs ? 'Ver Precios' : 'View Pricing')}
          secondaryLink="/pricing"
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img 
                  src="/logo.png" 
                  alt="TeacherHubPro" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-lg font-bold">TeacherHubPro</span>
              </Link>
              <p className="text-sm text-slate-400">
                {t('footerTagline') || (isEs ? 'El espacio de trabajo más inteligente para profesores.' : 'The smarter workspace for teachers.')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('product') || (isEs ? 'Producto' : 'Product')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/features" className="hover:text-white">{t('features') || (isEs ? 'Funciones' : 'Features')}</Link></li>
                <li><Link to="/pricing" className="hover:text-white">{t('pricing') || (isEs ? 'Precios' : 'Pricing')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('resources') || (isEs ? 'Recursos' : 'Resources')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/help" className="hover:text-white">{t('helpCenter') || (isEs ? 'Centro de Ayuda' : 'Help Center')}</Link></li>
                <li><Link to="/contact" className="hover:text-white">{t('contact') || (isEs ? 'Contacto' : 'Contact')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('legal') || (isEs ? 'Legal' : 'Legal')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy-policy" className="hover:text-white">{t('privacyPolicy') || (isEs ? 'Privacidad' : 'Privacy')}</Link></li>
                <li><Link to="/terms-of-use" className="hover:text-white">{t('termsOfUse') || (isEs ? 'Términos' : 'Terms')}</Link></li>
                <li><Link to="/trust" className="hover:text-white">{t('trustCenter') || (isEs ? 'Confianza' : 'Trust')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} TeacherHubPro. {t('allRightsReserved') || (isEs ? 'Todos los derechos reservados.' : 'All rights reserved.')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
