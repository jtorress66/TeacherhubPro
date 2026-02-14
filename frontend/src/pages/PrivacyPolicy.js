import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
          {isEs ? 'Política de Privacidad' : 'Privacy Policy'}
        </h1>
        <p className="text-slate-500 mb-8">{isEs ? 'Última actualización: Febrero 2026' : 'Last updated: February 2026'}</p>

        <div className="prose prose-slate max-w-none">
          <h2>{isEs ? '1. Información que Recopilamos' : '1. Information We Collect'}</h2>
          <p>
            {isEs 
              ? 'Recopilamos información que usted nos proporciona directamente, como nombre, correo electrónico, información de la escuela y datos relacionados con la enseñanza (planes de lección, calificaciones, asistencia).'
              : 'We collect information you provide directly to us, such as name, email, school information, and teaching-related data (lesson plans, grades, attendance).'}
          </p>

          <h2>{isEs ? '2. Cómo Usamos su Información' : '2. How We Use Your Information'}</h2>
          <p>
            {isEs
              ? 'Usamos la información recopilada para proporcionar, mantener y mejorar nuestros servicios, procesar transacciones y enviar comunicaciones relacionadas con el servicio.'
              : 'We use the information we collect to provide, maintain, and improve our services, process transactions, and send service-related communications.'}
          </p>

          <h2>{isEs ? '3. Compartir Información' : '3. Information Sharing'}</h2>
          <p>
            {isEs
              ? 'No vendemos ni compartimos su información personal con terceros para fines de marketing. Solo compartimos información cuando es necesario para proporcionar nuestros servicios o cuando lo exige la ley.'
              : 'We do not sell or share your personal information with third parties for marketing purposes. We only share information when necessary to provide our services or when required by law.'}
          </p>

          <h2>{isEs ? '4. Seguridad de Datos' : '4. Data Security'}</h2>
          <p>
            {isEs
              ? 'Implementamos medidas de seguridad estándar de la industria para proteger su información, incluyendo encriptación, servidores seguros y controles de acceso.'
              : 'We implement industry-standard security measures to protect your information, including encryption, secure servers, and access controls.'}
          </p>

          <h2>{isEs ? '5. Retención de Datos' : '5. Data Retention'}</h2>
          <p>
            {isEs
              ? 'Retenemos su información mientras su cuenta esté activa o según sea necesario para proporcionar servicios. Puede solicitar la eliminación de sus datos en cualquier momento.'
              : 'We retain your information as long as your account is active or as needed to provide services. You can request deletion of your data at any time.'}
          </p>

          <h2>{isEs ? '6. Sus Derechos' : '6. Your Rights'}</h2>
          <p>
            {isEs
              ? 'Tiene derecho a acceder, corregir o eliminar su información personal. Contáctenos en support@teacherhubpro.com para ejercer estos derechos.'
              : 'You have the right to access, correct, or delete your personal information. Contact us at support@teacherhubpro.com to exercise these rights.'}
          </p>

          <h2>{isEs ? '7. Contacto' : '7. Contact Us'}</h2>
          <p>
            {isEs
              ? 'Si tiene preguntas sobre esta política de privacidad, contáctenos en:'
              : 'If you have questions about this privacy policy, contact us at:'}
          </p>
          <p>
            <strong>Email:</strong> support@teacherhubpro.com<br />
            <strong>{isEs ? 'Teléfono' : 'Phone'}:</strong> +1 (787) 555-0123
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
