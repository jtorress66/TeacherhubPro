import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Shield, FileText, Scale, Lock, Globe, Server, AlertTriangle, Users, Cpu, Clock, Database, Building, CheckCircle } from 'lucide-react';

// Icon mapping for compliance pages
const iconMap = {
  terms: Scale,
  privacy: Lock,
  trust: Shield,
  dpa: FileText,
  ferpa: Building,
  coppa: Users,
  gdpr: Globe,
  sla: Clock,
  security: Server,
  ai: Cpu,
  incident: AlertTriangle,
  breach: AlertTriangle,
  continuity: Database,
  vendor: Building,
  acceptable: CheckCircle,
  soc2: Shield
};

const LegalLayout = ({ title, subtitle, icon = 'terms', children }) => {
  const { language } = useLanguage();
  const Icon = iconMap[icon] || FileText;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold text-slate-900">TeacherHubPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/trust" className="text-sm text-primary hover:underline">
              {language === 'es' ? 'Centro de Confianza' : 'Trust Center'}
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
              {language === 'es' ? 'Volver al inicio' : 'Back to home'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800">{title}</h1>
            {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-slate max-w-none prose-headings:font-heading prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-lg prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-800">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            {language === 'es' 
              ? '¿Preguntas? Contáctenos en ' 
              : 'Questions? Contact us at '}
            <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
              support@teacherhubpro.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default LegalLayout;
