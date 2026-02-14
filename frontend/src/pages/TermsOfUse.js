import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';

const TermsOfUse = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            {isEs ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-heading font-bold text-slate-800 mb-2">
          {isEs ? 'Términos de Uso' : 'Terms of Use'}
        </h1>
        <p className="text-slate-500 mb-8">{isEs ? 'Última actualización: Febrero 2026' : 'Last updated: February 2026'}</p>

        <div className="prose prose-slate max-w-none">
          <h2>{isEs ? '1. Aceptación de Términos' : '1. Acceptance of Terms'}</h2>
          <p>
            {isEs 
              ? 'Al acceder y usar TeacherHubPro, usted acepta estar sujeto a estos términos de uso. Si no está de acuerdo con alguna parte de estos términos, no puede usar nuestro servicio.'
              : 'By accessing and using TeacherHubPro, you agree to be bound by these terms of use. If you do not agree to any part of these terms, you may not use our service.'}
          </p>

          <h2>{isEs ? '2. Descripción del Servicio' : '2. Description of Service'}</h2>
          <p>
            {isEs
              ? 'TeacherHubPro es una plataforma de gestión educativa que proporciona herramientas para planificación de lecciones, seguimiento de asistencia, gestión de calificaciones y otras funcionalidades relacionadas con la enseñanza.'
              : 'TeacherHubPro is an educational management platform that provides tools for lesson planning, attendance tracking, grade management, and other teaching-related functionalities.'}
          </p>

          <h2>{isEs ? '3. Cuentas de Usuario' : '3. User Accounts'}</h2>
          <p>
            {isEs
              ? 'Usted es responsable de mantener la confidencialidad de su cuenta y contraseña. Acepta notificarnos inmediatamente de cualquier uso no autorizado de su cuenta.'
              : 'You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized use of your account.'}
          </p>

          <h2>{isEs ? '4. Uso Aceptable' : '4. Acceptable Use'}</h2>
          <p>{isEs ? 'Usted acepta no:' : 'You agree not to:'}</p>
          <ul>
            <li>{isEs ? 'Usar el servicio para fines ilegales' : 'Use the service for illegal purposes'}</li>
            <li>{isEs ? 'Compartir su cuenta con terceros' : 'Share your account with third parties'}</li>
            <li>{isEs ? 'Intentar acceder a datos de otros usuarios' : 'Attempt to access other users\' data'}</li>
            <li>{isEs ? 'Cargar contenido malicioso o inapropiado' : 'Upload malicious or inappropriate content'}</li>
          </ul>

          <h2>{isEs ? '5. Propiedad Intelectual' : '5. Intellectual Property'}</h2>
          <p>
            {isEs
              ? 'El contenido que usted crea (planes de lección, materiales, etc.) sigue siendo de su propiedad. TeacherHubPro mantiene los derechos sobre la plataforma, diseño y tecnología subyacente.'
              : 'Content you create (lesson plans, materials, etc.) remains your property. TeacherHubPro retains rights to the platform, design, and underlying technology.'}
          </p>

          <h2>{isEs ? '6. Suscripciones y Pagos' : '6. Subscriptions and Payments'}</h2>
          <p>
            {isEs
              ? 'Algunas funciones requieren una suscripción paga. Los pagos se procesan de forma segura a través de Stripe. Las suscripciones se renuevan automáticamente a menos que se cancelen.'
              : 'Some features require a paid subscription. Payments are processed securely through Stripe. Subscriptions renew automatically unless cancelled.'}
          </p>

          <h2>{isEs ? '7. Terminación' : '7. Termination'}</h2>
          <p>
            {isEs
              ? 'Podemos suspender o terminar su acceso al servicio en cualquier momento por violación de estos términos. Usted puede cancelar su cuenta en cualquier momento desde la configuración.'
              : 'We may suspend or terminate your access to the service at any time for violation of these terms. You may cancel your account at any time from settings.'}
          </p>

          <h2>{isEs ? '8. Limitación de Responsabilidad' : '8. Limitation of Liability'}</h2>
          <p>
            {isEs
              ? 'TeacherHubPro se proporciona "tal cual". No garantizamos que el servicio será ininterrumpido o libre de errores. No seremos responsables por daños indirectos o consecuentes.'
              : 'TeacherHubPro is provided "as is". We do not guarantee the service will be uninterrupted or error-free. We shall not be liable for indirect or consequential damages.'}
          </p>

          <h2>{isEs ? '9. Cambios a los Términos' : '9. Changes to Terms'}</h2>
          <p>
            {isEs
              ? 'Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en esta página.'
              : 'We reserve the right to modify these terms at any time. Changes will take effect when posted on this page.'}
          </p>

          <h2>{isEs ? '10. Contacto' : '10. Contact'}</h2>
          <p>
            {isEs
              ? 'Para preguntas sobre estos términos, contáctenos en:'
              : 'For questions about these terms, contact us at:'}
          </p>
          <p>
            <strong>Email:</strong> legal@teacherhubpro.com
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsOfUse;
