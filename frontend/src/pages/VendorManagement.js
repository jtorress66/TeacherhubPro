import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const VendorManagement = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Gestión de Riesgos de Proveedores' : 'Vendor Risk Management'}
      subtitle={isEs ? 'Gestión de riesgos de terceros' : 'Third-party risk management'}
      icon="vendor"
    >
      <h2>{isEs ? 'Resumen' : 'Overview'}</h2>
      <p>
        {isEs 
          ? 'TeacherHubPro gestiona cuidadosamente las relaciones con proveedores externos para proteger los datos de los usuarios y mantener la calidad del servicio.'
          : 'TeacherHubPro carefully manages relationships with third-party vendors to protect user data and maintain service quality.'}
      </p>

      <h2>{isEs ? 'Proveedores Principales' : 'Key Vendors'}</h2>
      <p>
        {isEs 
          ? 'Trabajamos con proveedores selectos para proporcionar nuestros servicios:'
          : 'We work with select vendors to provide our services:'}
      </p>
      <ul>
        <li>
          <strong>{isEs ? 'Alojamiento en la nube:' : 'Cloud hosting:'}</strong>{' '}
          {isEs 
            ? 'Infraestructura de nube segura y escalable.'
            : 'Secure, scalable cloud infrastructure.'}
        </li>
        <li>
          <strong>{isEs ? 'Procesamiento de pagos (Stripe):' : 'Payment processing (Stripe):'}</strong>{' '}
          {isEs 
            ? 'Procesamiento de pagos seguro compatible con PCI.'
            : 'PCI-compliant secure payment processing.'}
        </li>
        <li>
          <strong>{isEs ? 'Proveedores de correo electrónico:' : 'Email providers:'}</strong>{' '}
          {isEs 
            ? 'Servicios de correo electrónico transaccional.'
            : 'Transactional email services.'}
        </li>
        <li>
          <strong>{isEs ? 'Analítica:' : 'Analytics:'}</strong>{' '}
          {isEs 
            ? 'Herramientas de análisis de uso para mejorar nuestros servicios.'
            : 'Usage analytics tools to improve our services.'}
        </li>
        <li>
          <strong>{isEs ? 'Servicios de IA:' : 'AI services:'}</strong>{' '}
          {isEs 
            ? 'Proveedores de IA reputados para funciones asistidas por IA.'
            : 'Reputable AI providers for AI-assisted features.'}
        </li>
      </ul>

      <h2>{isEs ? 'Acuerdos de Protección de Datos' : 'Data Protection Agreements'}</h2>
      <p>
        {isEs 
          ? 'Todos los proveedores que manejan datos de usuarios están sujetos a:'
          : 'All vendors handling user data are subject to:'}
      </p>
      <ul>
        <li>{isEs ? 'Acuerdos de protección de datos' : 'Data protection agreements'}</li>
        <li>{isEs ? 'Requisitos de confidencialidad' : 'Confidentiality requirements'}</li>
        <li>{isEs ? 'Estándares de seguridad' : 'Security standards'}</li>
        <li>{isEs ? 'Restricciones de uso de datos' : 'Data use restrictions'}</li>
      </ul>

      <h2>{isEs ? 'Proceso de Selección de Proveedores' : 'Vendor Selection Process'}</h2>
      <p>
        {isEs 
          ? 'Antes de seleccionar un proveedor, evaluamos:'
          : 'Before selecting a vendor, we evaluate:'}
      </p>
      <ul>
        <li>{isEs ? 'Prácticas de seguridad' : 'Security practices'}</li>
        <li>{isEs ? 'Postura de privacidad' : 'Privacy posture'}</li>
        <li>{isEs ? 'Alineación de cumplimiento' : 'Compliance alignment'}</li>
        <li>{isEs ? 'Historial y reputación' : 'Track record and reputation'}</li>
        <li>{isEs ? 'Estabilidad financiera' : 'Financial stability'}</li>
      </ul>

      <h2>{isEs ? 'Monitoreo Continuo' : 'Ongoing Monitoring'}</h2>
      <p>
        {isEs 
          ? 'Monitoreamos continuamente a los proveedores para:'
          : 'We continuously monitor vendors for:'}
      </p>
      <ul>
        <li>{isEs ? 'Cumplimiento con los acuerdos' : 'Compliance with agreements'}</li>
        <li>{isEs ? 'Incidentes de seguridad' : 'Security incidents'}</li>
        <li>{isEs ? 'Calidad del servicio' : 'Service quality'}</li>
        <li>{isEs ? 'Cambios en las prácticas' : 'Changes in practices'}</li>
      </ul>

      <h2>{isEs ? 'Derechos de Auditoría' : 'Audit Rights'}</h2>
      <p>
        {isEs 
          ? 'Mantenemos el derecho de auditar las prácticas de los proveedores según sea necesario para garantizar el cumplimiento de nuestros requisitos de seguridad y privacidad.'
          : 'We maintain the right to audit vendor practices as needed to ensure compliance with our security and privacy requirements.'}
      </p>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        {isEs 
          ? 'Para preguntas sobre nuestras prácticas de gestión de proveedores:'
          : 'For questions about our vendor management practices:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default VendorManagement;
