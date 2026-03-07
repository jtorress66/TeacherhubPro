import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { 
  ArrowRight, Shield, FileText, HelpCircle,
  Mail, Menu, X
} from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

// Import marketing components
import {
  HeroSection,
  TrustBar,
  BenefitGrid,
  OutcomesSection,
  SocialProofSection,
  UseCasesSection,
  CTASection
} from '../components/marketing';

const Landing = () => {
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isEs = language === 'es';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="TeacherHubPro" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-slate-900">TeacherHubPro</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t('navFeatures')}
              </Link>
              <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t('navPricing')}
              </Link>
              <Link to="/trust" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t('navTrust')}
              </Link>
              <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                {t('navContact')}
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-3">
              <LanguageSelector />
              
              <Link to="/auth" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  {t('navLogin')}
                </Button>
              </Link>
              
              <Link to="/auth" className="hidden sm:block">
                <Button size="sm" className="bg-lime-500 hover:bg-lime-600 text-slate-900 font-medium shadow-sm">
                  {t('navStartFree')}
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>

              {/* Mobile menu button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <nav className="flex flex-col gap-4">
                <Link 
                  to="/features" 
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('navFeatures')}
                </Link>
                <Link 
                  to="/pricing" 
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('navPricing')}
                </Link>
                <Link 
                  to="/trust" 
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('navTrust')}
                </Link>
                <Link 
                  to="/contact" 
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t('navContact')}
                </Link>
                <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t('navLogin')}
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900">
                      {t('navStartFree')}
                    </Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection language={language} />

        {/* 2. Trust Bar */}
        <TrustBar language={language} />

        {/* 3. Benefit Grid */}
        <BenefitGrid language={language} />

        {/* 4. Outcomes Section */}
        <OutcomesSection language={language} />

        {/* 5. Social Proof Section */}
        <SocialProofSection language={language} />

        {/* 6. Use Cases Section */}
        <UseCasesSection language={language} />

        {/* 7. Final CTA */}
        <CTASection 
          language={language}
          headline={isEs ? 'Comienza a simplificar tu flujo de trabajo de enseñanza hoy' : 'Start simplifying your teaching workflow today'}
          subheadline={isEs ? 'Únete a los educadores que usan TeacherHubPro para ahorrar tiempo, mantenerse organizados y trabajar más inteligentemente con IA.' : 'Join educators using TeacherHubPro to save time, stay organized, and work smarter with AI.'}
          primaryCTA={isEs ? 'Comenzar Prueba Gratis' : 'Start Free Trial'}
          primaryLink="/auth"
          secondaryCTA={isEs ? 'Ver Precios' : 'View Pricing'}
          secondaryLink="/pricing"
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img 
                  src="/logo.png" 
                  alt="TeacherHubPro" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-lg font-bold">TeacherHubPro</span>
              </Link>
              <p className="text-sm text-slate-400 mb-4">
                {t('footerTagline')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('footerProduct')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/features" className="hover:text-white transition-colors">{t('footerFeatures')}</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">{t('footerPricing')}</Link></li>
                <li><Link to="/integrations" className="hover:text-white transition-colors">{t('footerIntegrations')}</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('footerResources')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/help" className="hover:text-white transition-colors">{t('footerHelpCenter')}</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">{t('footerContact')}</Link></li>
              </ul>
            </div>

            {/* Trust */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('footerTrust')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/trust" className="hover:text-white transition-colors">{t('footerTrustCenter')}</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">{t('footerPrivacy')}</Link></li>
                <li><Link to="/terms-of-use" className="hover:text-white transition-colors">{t('footerTerms')}</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('footerLegal')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/cookies-policy" className="hover:text-white transition-colors">{t('footerCookies')}</Link></li>
                <li><Link to="/accessibility" className="hover:text-white transition-colors">{t('footerAccessibility')}</Link></li>
              </ul>
            </div>
          </div>

          {/* Support notice */}
          <div className="border-t border-slate-800 pt-8 mb-8">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <HelpCircle className="w-4 h-4" />
              <span>{t('footerSupportNotice')}</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} TeacherHubPro. {t('footerAllRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
