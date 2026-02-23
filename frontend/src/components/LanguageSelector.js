import { useState, useRef, useEffect } from 'react';
import { useLanguage, availableLanguages } from '../contexts/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LanguageSelector = ({ variant = 'default', showLabel = true }) => {
  const { language, setLanguage, getCurrentLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const currentLang = getCurrentLanguage();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    setLanguage(code);
    setIsOpen(false);
  };

  // Compact variant (just flags)
  if (variant === 'compact') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label={t('selectLanguage')}
        >
          <span className="text-xl">{currentLang.flag}</span>
          <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
            {availableLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 transition-colors ${
                  language === lang.code ? 'bg-purple-50 text-purple-700' : 'text-slate-700'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.nativeName}</span>
                {language === lang.code && <Check className="h-4 w-4 text-purple-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full variant with icon and label
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-label={t('selectLanguage')}
      >
        <Globe className="h-4 w-4 text-slate-500" />
        <span className="text-xl">{currentLang.flag}</span>
        {showLabel && <span className="text-sm text-slate-700">{currentLang.nativeName}</span>}
        <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-500 uppercase">{t('selectLanguage')}</p>
          </div>
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                language === lang.code ? 'bg-purple-50' : ''
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${language === lang.code ? 'text-purple-700' : 'text-slate-700'}`}>
                  {lang.nativeName}
                </p>
                <p className="text-xs text-slate-500">{lang.name}</p>
              </div>
              {language === lang.code && <Check className="h-4 w-4 text-purple-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
