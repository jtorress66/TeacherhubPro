import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { ArrowRight, Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../LanguageSelector';

const MarketingLayout = ({ children }) => {
  const { t, language } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/logo.png" 
                alt="TeacherHubPro" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <span className="text-lg sm:text-xl font-bold text-slate-900">TeacherHubPro</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
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

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
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
                className="md:hidden p-2 text-slate-600 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
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
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <img 
                  src="/logo.png" 
                  alt="TeacherHubPro" 
                  className="w-10 h-10 object-contain"
                />
                <span className="text-lg font-bold">TeacherHubPro</span>
              </Link>
              <p className="text-sm text-slate-400">
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

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-sm">{t('footerLegal')}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/privacy-policy" className="hover:text-white transition-colors">{t('footerPrivacy')}</Link></li>
                <li><Link to="/terms-of-use" className="hover:text-white transition-colors">{t('footerTerms')}</Link></li>
                <li><Link to="/trust" className="hover:text-white transition-colors">{t('footerTrust')}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} TeacherHubPro. {t('footerAllRightsReserved')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingLayout;
