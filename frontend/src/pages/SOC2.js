import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const SOC2 = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Preparación SOC 2' : 'SOC 2 Readiness'}
      subtitle={isEs ? 'Alineación con principios de servicio de confianza' : 'Trust service principles alignment'}
      icon="soc2"
    >
      <h2>{isEs ? '¿Qué es SOC 2?' : 'What is SOC 2?'}</h2>
      <p>
        {isEs 
          ? 'SOC 2 (Controles de Organización de Servicios 2) es un marco de auditoría desarrollado por el Instituto Americano de CPAs (AICPA) que evalúa los controles de las organizaciones de servicios relevantes para la seguridad, disponibilidad, integridad del procesamiento, confidencialidad y privacidad.'
          : 'SOC 2 (Service Organization Controls 2) is an auditing framework developed by the American Institute of CPAs (AICPA) that evaluates service organizations\' controls relevant to security, availability, processing integrity, confidentiality, and privacy.'}
      </p>

      <h2>{isEs ? 'Nuestra Alineación con los Principios de Confianza' : 'Our Trust Principles Alignment'}</h2>
      <p>
        {isEs 
          ? 'TeacherHubPro alinea sus prácticas con los cinco principios de servicio de confianza de SOC 2:'
          : 'TeacherHubPro aligns its practices with the five SOC 2 trust service principles:'}
      </p>

      <h3>{isEs ? '1. Seguridad' : '1. Security'}</h3>
      <ul>
        <li>{isEs ? 'Encriptación HTTPS para todas las comunicaciones' : 'HTTPS encryption for all communications'}</li>
        <li>{isEs ? 'Controles de acceso basados en roles' : 'Role-based access controls'}</li>
        <li>{isEs ? 'Autenticación segura' : 'Secure authentication'}</li>
        <li>{isEs ? 'Gestión de vulnerabilidades' : 'Vulnerability management'}</li>
      </ul>

      <h3>{isEs ? '2. Disponibilidad' : '2. Availability'}</h3>
      <ul>
        <li>{isEs ? 'Infraestructura de nube con redundancia' : 'Cloud infrastructure with redundancy'}</li>
        <li>{isEs ? 'Plan de continuidad del negocio' : 'Business continuity plan'}</li>
        <li>{isEs ? 'Compromiso de SLA del 99% de tiempo de actividad' : '99% uptime SLA commitment'}</li>
        <li>{isEs ? 'Procedimientos de respuesta a incidentes' : 'Incident response procedures'}</li>
      </ul>

      <h3>{isEs ? '3. Integridad del Procesamiento' : '3. Processing Integrity'}</h3>
      <ul>
        <li>{isEs ? 'Validación de datos' : 'Data validation'}</li>
        <li>{isEs ? 'Manejo de errores' : 'Error handling'}</li>
        <li>{isEs ? 'Monitoreo del sistema' : 'System monitoring'}</li>
        <li>{isEs ? 'Procesos de aseguramiento de calidad' : 'Quality assurance processes'}</li>
      </ul>

      <h3>{isEs ? '4. Confidencialidad' : '4. Confidentiality'}</h3>
      <ul>
        <li>{isEs ? 'Clasificación de datos' : 'Data classification'}</li>
        <li>{isEs ? 'Restricciones de acceso' : 'Access restrictions'}</li>
        <li>{isEs ? 'Acuerdos de protección de datos con proveedores' : 'Vendor data protection agreements'}</li>
        <li>{isEs ? 'Eliminación segura de datos' : 'Secure data disposal'}</li>
      </ul>

      <h3>{isEs ? '5. Privacidad' : '5. Privacy'}</h3>
      <ul>
        <li>{isEs ? 'Política de privacidad' : 'Privacy policy'}</li>
        <li>{isEs ? 'Mecanismos de consentimiento' : 'Consent mechanisms'}</li>
        <li>{isEs ? 'Derechos de acceso a datos' : 'Data access rights'}</li>
        <li>{isEs ? 'Alineación con FERPA, COPPA y GDPR' : 'FERPA, COPPA, and GDPR alignment'}</li>
      </ul>

      <h2>{isEs ? 'Estado Actual y Hoja de Ruta' : 'Current Status & Roadmap'}</h2>
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
        <p className="text-sky-800 font-medium">
          {isEs 
            ? 'TeacherHubPro actualmente alinea sus prácticas con los principios de SOC 2. La búsqueda formal de la certificación SOC 2 está planificada a medida que la empresa escala.'
            : 'TeacherHubPro currently aligns its practices with SOC 2 principles. Formal SOC 2 certification pursuit is planned as the company scales.'}
        </p>
      </div>

      <h2>{isEs ? 'Mejora Continua' : 'Continuous Improvement'}</h2>
      <p>
        {isEs 
          ? 'Estamos comprometidos con fortalecer continuamente nuestros controles y prácticas en preparación para la certificación SOC 2 formal.'
          : 'We are committed to continuously strengthening our controls and practices in preparation for formal SOC 2 certification.'}
      </p>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        {isEs 
          ? 'Para preguntas sobre nuestras prácticas de seguridad y cumplimiento:'
          : 'For questions about our security and compliance practices:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default SOC2;
