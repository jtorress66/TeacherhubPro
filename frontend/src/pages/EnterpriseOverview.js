import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  ArrowLeft, Shield, Lock, Cpu, Building, CheckCircle, 
  Download, FileText, Server, Users, Globe
} from 'lucide-react';

const EnterpriseOverview = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 print:hidden">
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
            <Button onClick={() => window.print()} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {isEs ? 'Descargar PDF' : 'Download PDF'}
            </Button>
            <Link to="/trust" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
              {isEs ? 'Centro de Confianza' : 'Trust Center'}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4 print:hidden">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-16 w-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">
            {isEs ? 'Resumen de Seguridad Empresarial' : 'Enterprise Security Overview'}
          </h1>
          <p className="text-slate-600">TeacherHubPro</p>
        </div>

        {/* Company Overview */}
        <section className="mb-10">
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {isEs ? 'Descripción de la Empresa' : 'Company Overview'}
          </h2>
          <p className="text-slate-600">
            {isEs 
              ? 'TeacherHubPro es una plataforma SaaS para educadores que proporciona herramientas de planificación impulsadas por IA y herramientas de gestión del aula. Nuestra misión es empoderar a los maestros con tecnología que ahorra tiempo y mejora los resultados de los estudiantes.'
              : 'TeacherHubPro is a SaaS platform for educators providing AI-powered planning and classroom management tools. Our mission is to empower teachers with technology that saves time and improves student outcomes.'}
          </p>
        </section>

        {/* Compliance Alignment */}
        <section className="mb-10">
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            {isEs ? 'Alineación de Cumplimiento' : 'Compliance Alignment'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-slate-800">{isEs ? 'Soporte FERPA' : 'FERPA Support'}</h3>
                <p className="text-sm text-slate-500">{isEs ? 'Protección de registros educativos' : 'Educational records protection'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-slate-800">{isEs ? 'Soporte COPPA' : 'COPPA Support'}</h3>
                <p className="text-sm text-slate-500">{isEs ? 'Privacidad infantil en línea' : 'Children\'s online privacy'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-slate-800">{isEs ? 'Marco GDPR' : 'GDPR Framework'}</h3>
                <p className="text-sm text-slate-500">{isEs ? 'Derechos de datos de la UE' : 'EU data rights'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-slate-800">{isEs ? 'DPA Disponible' : 'DPA Available'}</h3>
                <p className="text-sm text-slate-500">{isEs ? 'Acuerdo de procesamiento de datos' : 'Data processing addendum'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-slate-800">{isEs ? 'Política de Uso Aceptable' : 'Acceptable Use Policy'}</h3>
                <p className="text-sm text-slate-500">{isEs ? 'Directrices de uso' : 'Usage guidelines'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-slate-800">{isEs ? 'Gobernanza de IA Responsable' : 'Responsible AI Governance'}</h3>
                <p className="text-sm text-slate-500">{isEs ? 'Uso ético de la IA' : 'Ethical AI use'}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Data Protection Commitments */}
        <section className="mb-10">
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {isEs ? 'Compromisos de Protección de Datos' : 'Data Protection Commitments'}
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{isEs ? 'Sin venta de datos de estudiantes' : 'No sale of student data'}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{isEs ? 'Sin publicidad dirigida' : 'No targeted advertising'}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{isEs ? 'Conexiones HTTPS encriptadas' : 'Encrypted HTTPS connections'}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{isEs ? 'Infraestructura de nube segura' : 'Secure cloud infrastructure'}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{isEs ? 'Controles de acceso basados en roles' : 'Role-based access controls'}</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{isEs ? 'Pagos compatibles con PCI de Stripe' : 'Stripe PCI-compliant payments'}</span>
            </li>
          </ul>
        </section>

        {/* Security Practices */}
        <section className="mb-10">
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            {isEs ? 'Prácticas de Seguridad' : 'Security Practices'}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{isEs ? 'Plan de Respuesta a Incidentes' : 'Incident Response Plan'}</h3>
              <p className="text-sm text-slate-600">{isEs ? 'Procedimientos documentados para manejo de incidentes' : 'Documented procedures for incident handling'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{isEs ? 'Política de Notificación de Brechas' : 'Breach Notification Policy'}</h3>
              <p className="text-sm text-slate-600">{isEs ? 'Notificación oportuna según lo requerido por ley' : 'Timely notification as required by law'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{isEs ? 'Plan de Continuidad del Negocio' : 'Business Continuity Plan'}</h3>
              <p className="text-sm text-slate-600">{isEs ? 'Redundancia y procedimientos de recuperación' : 'Redundancy and recovery procedures'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{isEs ? 'Gestión de Riesgos de Proveedores' : 'Vendor Risk Management'}</h3>
              <p className="text-sm text-slate-600">{isEs ? 'Acuerdos de protección de datos con terceros' : 'Third-party data protection agreements'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{isEs ? 'Hoja de Ruta SOC 2' : 'SOC 2 Roadmap'}</h3>
              <p className="text-sm text-slate-600">{isEs ? 'Búsqueda planificada de certificación' : 'Planned certification pursuit'}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-2">{isEs ? 'Compromiso de SLA' : 'SLA Commitment'}</h3>
              <p className="text-sm text-slate-600">{isEs ? '99% de disponibilidad objetivo' : '99% uptime target'}</p>
            </div>
          </div>
        </section>

        {/* SLA */}
        <section className="mb-10">
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {isEs ? 'Acuerdo de Nivel de Servicio' : 'Service Level Agreement'}
          </h2>
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-primary mb-2">99%</p>
                <p className="text-slate-600">
                  {isEs ? 'Objetivo de disponibilidad mensual' : 'Monthly uptime target'}
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  {isEs ? 'Redundancia de infraestructura • Alojamiento seguro' : 'Infrastructure redundancy • Secure hosting'}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Contact */}
        <section className="text-center border-t pt-8">
          <h2 className="text-xl font-heading font-bold text-slate-800 mb-4">
            {isEs ? 'Contacto' : 'Contact'}
          </h2>
          <p className="text-slate-600 mb-2">
            <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
              support@teacherhubpro.com
            </a>
          </p>
          <p className="text-slate-500">
            <a href="https://teacherhubpro.com" className="text-primary hover:underline">
              www.teacherhubpro.com
            </a>
          </p>
        </section>
      </main>

      {/* Print Footer */}
      <footer className="hidden print:block text-center text-sm text-slate-500 py-4 border-t">
        © 2026 TeacherHubPro, LLC. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
      </footer>
    </div>
  );
};

export default EnterpriseOverview;
