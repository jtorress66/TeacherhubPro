import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  ArrowLeft, Shield, FileText, Scale, Lock, Globe, Server, 
  AlertTriangle, Users, Cpu, Clock, Database, Building, 
  CheckCircle, Download, ExternalLink
} from 'lucide-react';

const TrustCenter = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const complianceCards = [
    {
      title: isEs ? 'Términos de Servicio' : 'Terms of Service',
      description: isEs ? 'Términos y condiciones de uso' : 'Terms and conditions of use',
      icon: Scale,
      link: '/terms',
      color: 'blue'
    },
    {
      title: isEs ? 'Política de Privacidad' : 'Privacy Policy',
      description: isEs ? 'Cómo protegemos sus datos' : 'How we protect your data',
      icon: Lock,
      link: '/privacy',
      color: 'green'
    },
    {
      title: isEs ? 'Acuerdo de Procesamiento de Datos' : 'Data Processing Addendum',
      description: isEs ? 'DPA para instituciones' : 'DPA for institutions',
      icon: FileText,
      link: '/dpa',
      color: 'purple'
    },
    {
      title: isEs ? 'Declaración FERPA' : 'FERPA Statement',
      description: isEs ? 'Cumplimiento educativo de EE.UU.' : 'U.S. educational compliance',
      icon: Building,
      link: '/ferpa',
      color: 'indigo'
    },
    {
      title: isEs ? 'Declaración COPPA' : 'COPPA Statement',
      description: isEs ? 'Protección de privacidad infantil' : 'Children\'s privacy protection',
      icon: Users,
      link: '/coppa',
      color: 'pink'
    },
    {
      title: isEs ? 'Declaración GDPR' : 'GDPR Statement',
      description: isEs ? 'Derechos de datos de la UE' : 'EU data rights',
      icon: Globe,
      link: '/gdpr',
      color: 'cyan'
    },
    {
      title: isEs ? 'Acuerdo de Nivel de Servicio' : 'Service Level Agreement',
      description: isEs ? 'Compromisos de disponibilidad' : 'Uptime commitments',
      icon: Clock,
      link: '/sla',
      color: 'amber'
    },
    {
      title: isEs ? 'Documento de Seguridad' : 'Security Whitepaper',
      description: isEs ? 'Arquitectura y prácticas de seguridad' : 'Security architecture & practices',
      icon: Server,
      link: '/security-whitepaper',
      color: 'red'
    },
    {
      title: isEs ? 'Gobernanza de IA' : 'AI Governance',
      description: isEs ? 'Uso responsable de la IA' : 'Responsible AI use',
      icon: Cpu,
      link: '/ai-governance',
      color: 'violet'
    },
    {
      title: isEs ? 'Respuesta a Incidentes' : 'Incident Response',
      description: isEs ? 'Procedimientos de manejo de incidentes' : 'Incident handling procedures',
      icon: AlertTriangle,
      link: '/incident-response',
      color: 'orange'
    },
    {
      title: isEs ? 'Política de Violación de Datos' : 'Data Breach Policy',
      description: isEs ? 'Protocolo de notificación de brechas' : 'Breach notification protocol',
      icon: AlertTriangle,
      link: '/breach-policy',
      color: 'rose'
    },
    {
      title: isEs ? 'Continuidad del Negocio' : 'Business Continuity',
      description: isEs ? 'Plan de recuperación ante desastres' : 'Disaster recovery plan',
      icon: Database,
      link: '/business-continuity',
      color: 'teal'
    },
    {
      title: isEs ? 'Gestión de Proveedores' : 'Vendor Management',
      description: isEs ? 'Gestión de riesgos de terceros' : 'Third-party risk management',
      icon: Building,
      link: '/vendor-management',
      color: 'slate'
    },
    {
      title: isEs ? 'Política de Uso Aceptable' : 'Acceptable Use Policy',
      description: isEs ? 'Directrices de uso de la plataforma' : 'Platform usage guidelines',
      icon: CheckCircle,
      link: '/acceptable-use',
      color: 'emerald'
    },
    {
      title: isEs ? 'Preparación SOC 2' : 'SOC 2 Readiness',
      description: isEs ? 'Alineación con principios de confianza' : 'Trust principles alignment',
      icon: Shield,
      link: '/soc2',
      color: 'sky'
    }
  ];

  const trustBadges = [
    { label: isEs ? 'Alineado con FERPA' : 'FERPA Aligned', color: 'bg-blue-100 text-blue-700' },
    { label: isEs ? 'Compatible con COPPA' : 'COPPA Aware', color: 'bg-pink-100 text-pink-700' },
    { label: isEs ? 'Listo para GDPR' : 'GDPR Ready', color: 'bg-green-100 text-green-700' },
    { label: isEs ? 'Pagos PCI Seguros' : 'PCI Secure Payments', color: 'bg-purple-100 text-purple-700' },
    { label: isEs ? 'IA Responsable' : 'Responsible AI', color: 'bg-amber-100 text-amber-700' }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    violet: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-600',
    rose: 'bg-rose-100 text-rose-600',
    teal: 'bg-teal-100 text-teal-600',
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    sky: 'bg-sky-100 text-sky-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold text-slate-900">TeacherHubPro</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            {isEs ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 py-16">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-primary font-medium">
                {isEs ? 'Centro de Confianza' : 'Trust Center'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-4">
              {isEs 
                ? 'Confianza y Cumplimiento en TeacherHubPro' 
                : 'Trust & Compliance at TeacherHubPro'}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              {isEs 
                ? 'Seguridad, privacidad y transparencia diseñadas para instituciones educativas modernas.'
                : 'Security, privacy, and transparency designed for modern educational institutions.'}
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/security-whitepaper">
                <Button size="lg" className="gap-2">
                  <FileText className="h-5 w-5" />
                  {isEs ? 'Ver Documento de Seguridad' : 'View Security Whitepaper'}
                </Button>
              </Link>
              <Link to="/enterprise-overview">
                <Button size="lg" variant="outline" className="gap-2">
                  <Download className="h-5 w-5" />
                  {isEs ? 'Descargar Resumen Empresarial' : 'Download Enterprise Overview'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-wrap justify-center gap-3">
              {trustBadges.map((badge, index) => (
                <span 
                  key={index}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Our Commitments */}
        <section className="py-12 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-heading font-bold text-slate-800 text-center mb-8">
              {isEs ? 'Nuestros Compromisos' : 'Our Commitments'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-6 text-center">
                  <Lock className="h-10 w-10 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-800 mb-2">
                    {isEs ? 'Sin Venta de Datos' : 'No Data Sales'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {isEs 
                      ? 'Nunca vendemos datos de usuarios ni estudiantes a terceros.'
                      : 'We never sell user or student data to third parties.'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6 text-center">
                  <Shield className="h-10 w-10 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-800 mb-2">
                    {isEs ? 'Conexiones Encriptadas' : 'Encrypted Connections'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {isEs 
                      ? 'Todas las comunicaciones están protegidas con encriptación HTTPS.'
                      : 'All communications are protected with HTTPS encryption.'}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="pt-6 text-center">
                  <Cpu className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-slate-800 mb-2">
                    {isEs ? 'IA Responsable' : 'Responsible AI'}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {isEs 
                      ? 'Los educadores mantienen supervisión completa de las herramientas de IA.'
                      : 'Educators maintain full oversight of AI tools.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Compliance Documents Grid */}
        <section className="py-12 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-heading font-bold text-slate-800 text-center mb-8">
              {isEs ? 'Documentos de Cumplimiento' : 'Compliance Documents'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {complianceCards.map((card, index) => (
                <Link key={index} to={card.link}>
                  <Card className="h-full hover:shadow-lg transition-shadow hover:border-primary/50 cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${colorClasses[card.color]}`}>
                          <card.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-800 mb-1">{card.title}</h3>
                          <p className="text-sm text-slate-500">{card.description}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise CTA */}
        <section className="py-16 bg-primary/5">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-heading font-bold text-slate-800 mb-4">
              {isEs ? '¿Necesita Documentación Empresarial?' : 'Need Enterprise Documentation?'}
            </h2>
            <p className="text-slate-600 mb-6">
              {isEs 
                ? 'Contáctenos para obtener DPAs personalizados, revisiones de seguridad y documentación de cumplimiento para su distrito.'
                : 'Contact us for custom DPAs, security reviews, and compliance documentation for your district.'}
            </p>
            <Link to="/contact">
              <Button size="lg" className="gap-2">
                {isEs ? 'Contactar Ventas Empresariales' : 'Contact Enterprise Sales'}
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
            <Link to="/terms" className="hover:text-primary">{isEs ? 'Términos' : 'Terms'}</Link>
            <Link to="/privacy" className="hover:text-primary">{isEs ? 'Privacidad' : 'Privacy'}</Link>
            <Link to="/contact" className="hover:text-primary">{isEs ? 'Contacto' : 'Contact'}</Link>
            <a href="mailto:support@teacherhubpro.com" className="hover:text-primary">support@teacherhubpro.com</a>
          </div>
          <p className="text-center text-slate-400 text-sm mt-4">
            © 2026 TeacherHubPro, LLC. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrustCenter;
