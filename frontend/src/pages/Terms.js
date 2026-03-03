import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const Terms = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Términos de Servicio' : 'Terms of Service'}
      subtitle={isEs ? 'Fecha efectiva: 1 de enero de 2026' : 'Effective Date: January 1, 2026'}
      icon="terms"
    >
      <p><strong>{isEs ? 'Empresa' : 'Company'}:</strong> TeacherHubPro, LLC</p>
      <p><strong>{isEs ? 'Sitio web' : 'Website'}:</strong> https://teacherhubpro.com</p>

      <h2>{isEs ? '1. Descripción General' : '1. Overview'}</h2>
      <p>
        {isEs 
          ? 'Estos Términos de Servicio ("Términos") rigen el acceso y uso de la plataforma TeacherHubPro ("Plataforma"), operada por TeacherHubPro, LLC ("Empresa", "nosotros" o "nuestro").'
          : 'These Terms of Service ("Terms") govern access to and use of the TeacherHubPro platform ("Platform"), operated by TeacherHubPro, LLC ("Company," "we," "us," or "our").'}
      </p>
      <p>
        {isEs 
          ? 'Al acceder o usar la Plataforma, usted acepta estar sujeto a estos Términos.'
          : 'By accessing or using the Platform, you agree to be bound by these Terms.'}
      </p>

      <h2>{isEs ? '2. Servicios' : '2. Services'}</h2>
      <p>
        {isEs 
          ? 'TeacherHubPro es una plataforma de Software como Servicio (SaaS) basada en suscripción que proporciona:'
          : 'TeacherHubPro is a subscription-based Software-as-a-Service (SaaS) platform providing:'}
      </p>
      <ul>
        <li>{isEs ? 'Herramientas digitales de planificación de lecciones' : 'Digital lesson planning tools'}</li>
        <li>{isEs ? 'Seguimiento académico y gestión del aula' : 'Academic tracking and classroom management'}</li>
        <li>{isEs ? 'Herramientas educativas asistidas por IA' : 'AI-assisted educational tools'}</li>
        <li>{isEs ? 'Recursos de aprendizaje interactivo' : 'Interactive learning resources'}</li>
        <li>{isEs ? 'Funciones administrativas institucionales' : 'Institutional administrative features'}</li>
      </ul>
      <p>
        {isEs 
          ? 'Nos reservamos el derecho de modificar o descontinuar funciones en cualquier momento.'
          : 'We reserve the right to modify or discontinue features at any time.'}
      </p>

      <h2>{isEs ? '3. Elegibilidad' : '3. Eligibility'}</h2>
      <p>{isEs ? 'Los usuarios deben:' : 'Users must:'}</p>
      <ul>
        <li>{isEs ? 'Tener al menos 18 años de edad' : 'Be at least 18 years old'}</li>
        <li>{isEs ? 'Proporcionar información de registro precisa' : 'Provide accurate registration information'}</li>
        <li>{isEs ? 'Mantener la seguridad de la cuenta' : 'Maintain account security'}</li>
      </ul>
      <p>
        {isEs 
          ? 'Las instituciones son responsables del uso por parte del personal autorizado.'
          : 'Institutions are responsible for authorized personnel usage.'}
      </p>

      <h2>{isEs ? '4. Responsabilidad de la Cuenta' : '4. Account Responsibility'}</h2>
      <p>{isEs ? 'Los usuarios son responsables de:' : 'Users are responsible for:'}</p>
      <ul>
        <li>{isEs ? 'Mantener la confidencialidad de las credenciales de inicio de sesión' : 'Maintaining confidentiality of login credentials'}</li>
        <li>{isEs ? 'Toda la actividad bajo su cuenta' : 'All activity under their account'}</li>
        <li>{isEs ? 'Garantizar el cumplimiento de las leyes de educación aplicables' : 'Ensuring compliance with applicable education laws'}</li>
      </ul>

      <h2>{isEs ? '5. Suscripción y Facturación' : '5. Subscription & Billing'}</h2>
      <ul>
        <li>{isEs ? 'Las suscripciones pueden ser mensuales o anuales' : 'Subscriptions may be monthly or annual'}</li>
        <li>{isEs ? 'Los pagos se procesan a través de Stripe' : 'Payments processed via Stripe'}</li>
        <li>{isEs ? 'Las suscripciones se renuevan automáticamente a menos que se cancelen' : 'Subscriptions auto-renew unless canceled'}</li>
        <li>{isEs ? 'Las tarifas no son reembolsables a menos que lo exija la ley' : 'Fees are non-refundable unless required by law'}</li>
      </ul>
      <p>
        {isEs 
          ? 'Los contratos empresariales pueden regirse por acuerdos escritos separados.'
          : 'Enterprise contracts may be governed by separate written agreements.'}
      </p>

      <h2>{isEs ? '6. Uso Aceptable' : '6. Acceptable Use'}</h2>
      <p>{isEs ? 'Los usuarios aceptan no:' : 'Users agree not to:'}</p>
      <ul>
        <li>{isEs ? 'Usar la Plataforma ilegalmente' : 'Use the Platform unlawfully'}</li>
        <li>{isEs ? 'Subir contenido malicioso' : 'Upload malicious content'}</li>
        <li>{isEs ? 'Realizar ingeniería inversa de la Plataforma' : 'Reverse engineer the Platform'}</li>
        <li>{isEs ? 'Usar herramientas de IA para generar contenido dañino o ilegal' : 'Use AI tools to generate harmful or unlawful content'}</li>
      </ul>

      <h2>{isEs ? '7. Propiedad Intelectual' : '7. Intellectual Property'}</h2>
      <p>
        {isEs 
          ? 'Toda la marca, software y sistemas propietarios son propiedad de TeacherHubPro, LLC.'
          : 'All branding, software, and proprietary systems are owned by TeacherHubPro, LLC.'}
      </p>
      <p>
        {isEs 
          ? 'Los usuarios conservan la propiedad de su contenido subido pero otorgan una licencia limitada para procesamiento y visualización dentro de la Plataforma.'
          : 'Users retain ownership of their uploaded content but grant a limited license for processing and display within the Platform.'}
      </p>

      <h2>{isEs ? '8. Descargo de Responsabilidad de IA' : '8. AI Disclaimer'}</h2>
      <p>
        {isEs 
          ? 'Los resultados de IA pueden contener inexactitudes. Los educadores deben revisar todo el contenido generado por IA antes de su uso en el aula.'
          : 'AI outputs may contain inaccuracies. Educators must review all AI-generated content before classroom use.'}
      </p>

      <h2>{isEs ? '9. Datos y Privacidad' : '9. Data & Privacy'}</h2>
      <p>
        {isEs 
          ? 'El uso de la Plataforma se rige por nuestra Política de Privacidad.'
          : 'Use of the Platform is governed by our Privacy Policy.'}
      </p>

      <h2>{isEs ? '10. Limitación de Responsabilidad' : '10. Limitation of Liability'}</h2>
      <p>
        {isEs 
          ? 'TeacherHubPro no es responsable de daños indirectos o consecuentes. La responsabilidad máxima no excederá el monto pagado en los 12 meses anteriores.'
          : 'TeacherHubPro is not liable for indirect or consequential damages. Maximum liability shall not exceed the amount paid in the preceding 12 months.'}
      </p>

      <h2>{isEs ? '11. Ley Aplicable' : '11. Governing Law'}</h2>
      <p>
        {isEs 
          ? 'Regido por las leyes de los Estados Unidos y el Estado Libre Asociado de Puerto Rico.'
          : 'Governed by the laws of the United States and the Commonwealth of Puerto Rico.'}
      </p>

      <h2>{isEs ? '12. Contacto' : '12. Contact'}</h2>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default Terms;
