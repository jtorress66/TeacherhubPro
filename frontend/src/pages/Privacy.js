import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const Privacy = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Política de Privacidad' : 'Privacy Policy'}
      subtitle={isEs ? 'Última actualización: Enero 2026' : 'Last Updated: January 2026'}
      icon="privacy"
    >
      <p>
        {isEs 
          ? 'TeacherHubPro valora la privacidad y la protección de datos.'
          : 'TeacherHubPro values privacy and data protection.'}
      </p>

      <h2>{isEs ? 'Información que Recopilamos' : 'Information We Collect'}</h2>
      <ul>
        <li>{isEs ? 'Nombre y correo electrónico' : 'Name and email'}</li>
        <li>{isEs ? 'Información de facturación (procesada a través de Stripe)' : 'Billing information (processed via Stripe)'}</li>
        <li>{isEs ? 'Contenido educativo subido' : 'Educational content uploaded'}</li>
        <li>{isEs ? 'Análisis de uso' : 'Usage analytics'}</li>
        <li>{isEs ? 'Datos del dispositivo y navegador' : 'Device and browser data'}</li>
      </ul>
      <p className="font-semibold text-primary">
        {isEs ? 'No vendemos información personal.' : 'We do not sell personal information.'}
      </p>

      <h2>{isEs ? 'Uso de la Información' : 'Use of Information'}</h2>
      <ul>
        <li>{isEs ? 'Proporcionar y mejorar servicios' : 'Provide and improve services'}</li>
        <li>{isEs ? 'Procesar suscripciones' : 'Process subscriptions'}</li>
        <li>{isEs ? 'Brindar soporte' : 'Deliver support'}</li>
        <li>{isEs ? 'Mejorar la funcionalidad de IA' : 'Enhance AI functionality'}</li>
      </ul>

      <h2>{isEs ? 'Protección de Datos de Estudiantes' : 'Student Data Protection'}</h2>
      <ul>
        <li>{isEs ? 'No venta de datos de estudiantes' : 'No sale of student data'}</li>
        <li>{isEs ? 'No publicidad dirigida' : 'No targeted advertising'}</li>
        <li>{isEs ? 'Usado solo para proporcionar servicios' : 'Used only to provide services'}</li>
        <li>{isEs ? 'Los maestros son responsables del cumplimiento de FERPA' : 'Teachers responsible for FERPA compliance'}</li>
      </ul>

      <h2>{isEs ? 'Medidas de Seguridad' : 'Security Measures'}</h2>
      <ul>
        <li>{isEs ? 'Encriptación HTTPS' : 'HTTPS encryption'}</li>
        <li>{isEs ? 'Alojamiento en la nube seguro' : 'Secure cloud hosting'}</li>
        <li>{isEs ? 'Controles de acceso basados en roles' : 'Role-based access controls'}</li>
        <li>{isEs ? 'Acuerdos con proveedores' : 'Vendor agreements'}</li>
      </ul>

      <h2>{isEs ? 'Retención de Datos' : 'Data Retention'}</h2>
      <p>
        {isEs 
          ? 'Los datos se retienen mientras la cuenta permanezca activa y se eliminan a solicitud, sujeto a requisitos legales.'
          : 'Data retained while account remains active and deleted upon request, subject to legal requirements.'}
      </p>

      <h2>{isEs ? 'Sus Derechos' : 'Your Rights'}</h2>
      <p>
        {isEs 
          ? 'Tiene derecho a acceder, corregir o eliminar su información personal. Contáctenos en support@teacherhubpro.com para ejercer estos derechos.'
          : 'You have the right to access, correct, or delete your personal information. Contact us at support@teacherhubpro.com to exercise these rights.'}
      </p>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        <strong>Email:</strong>{' '}
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default Privacy;
