import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const SecurityWhitepaper = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Documento de Seguridad' : 'Security Whitepaper'}
      subtitle={isEs ? 'Arquitectura y prácticas de seguridad' : 'Security architecture and practices'}
      icon="security"
    >
      <h2>{isEs ? 'Resumen Ejecutivo' : 'Executive Summary'}</h2>
      <p>
        {isEs 
          ? 'TeacherHubPro implementa un enfoque de seguridad integral diseñado para proteger los datos educativos. Este documento describe nuestra arquitectura de seguridad, prácticas y hoja de ruta.'
          : 'TeacherHubPro implements a comprehensive security approach designed to protect educational data. This document outlines our security architecture, practices, and roadmap.'}
      </p>

      <h2>{isEs ? 'Arquitectura' : 'Architecture'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'SaaS basado en la nube:' : 'Cloud-based SaaS:'}</strong>{' '}
          {isEs 
            ? 'Alojado en infraestructura de nube segura con redundancia incorporada.'
            : 'Hosted on secure cloud infrastructure with built-in redundancy.'}
        </li>
        <li>
          <strong>{isEs ? 'Encriptación HTTPS:' : 'HTTPS encryption:'}</strong>{' '}
          {isEs 
            ? 'Todas las comunicaciones están encriptadas usando TLS 1.2+.'
            : 'All communications are encrypted using TLS 1.2+.'}
        </li>
        <li>
          <strong>{isEs ? 'Almacenamiento seguro de base de datos:' : 'Secure database storage:'}</strong>{' '}
          {isEs 
            ? 'Los datos se almacenan en bases de datos seguras y gestionadas.'
            : 'Data is stored in secure, managed databases.'}
        </li>
      </ul>

      <h2>{isEs ? 'Seguridad de Pagos' : 'Payment Security'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Procesamiento compatible con PCI:' : 'PCI-compliant processing:'}</strong>{' '}
          {isEs 
            ? 'Todos los pagos son procesados por Stripe, un procesador de pagos certificado PCI DSS Nivel 1.'
            : 'All payments are processed by Stripe, a PCI DSS Level 1 certified payment processor.'}
        </li>
        <li>
          <strong>{isEs ? 'Sin almacenamiento de tarjetas:' : 'No card storage:'}</strong>{' '}
          {isEs 
            ? 'Nunca almacenamos números de tarjetas de crédito en nuestros servidores.'
            : 'We never store credit card numbers on our servers.'}
        </li>
      </ul>

      <h2>{isEs ? 'Controles de Acceso' : 'Access Controls'}</h2>
      <ul>
        <li>{isEs ? 'Control de acceso basado en roles (RBAC)' : 'Role-based access control (RBAC)'}</li>
        <li>{isEs ? 'Requisitos de fortaleza de contraseña' : 'Password strength requirements'}</li>
        <li>{isEs ? 'Expiración de sesión' : 'Session expiration'}</li>
        <li>{isEs ? 'Autenticación segura' : 'Secure authentication'}</li>
      </ul>

      <h2>{isEs ? 'Protección de Datos' : 'Data Protection'}</h2>
      <ul>
        <li>{isEs ? 'Encriptación de datos en tránsito' : 'Encryption of data in transit'}</li>
        <li>{isEs ? 'Copias de seguridad regulares' : 'Regular backups'}</li>
        <li>{isEs ? 'Separación de datos entre inquilinos' : 'Data segregation between tenants'}</li>
        <li>{isEs ? 'Procedimientos de eliminación de datos' : 'Data deletion procedures'}</li>
      </ul>

      <h2>{isEs ? 'Gestión de Vulnerabilidades' : 'Vulnerability Management'}</h2>
      <ul>
        <li>{isEs ? 'Actualizaciones regulares de software' : 'Regular software updates'}</li>
        <li>{isEs ? 'Gestión de dependencias' : 'Dependency management'}</li>
        <li>{isEs ? 'Revisión de código de seguridad' : 'Security code review'}</li>
      </ul>

      <h2>{isEs ? 'Hoja de Ruta de Seguridad' : 'Security Roadmap'}</h2>
      <p>
        {isEs 
          ? 'Las mejoras de seguridad planificadas incluyen:'
          : 'Planned security enhancements include:'}
      </p>
      <ul>
        <li>
          <strong>{isEs ? 'Auditorías de seguridad:' : 'Security audits:'}</strong>{' '}
          {isEs 
            ? 'Evaluaciones de seguridad regulares de terceros.'
            : 'Regular third-party security assessments.'}
        </li>
        <li>
          <strong>{isEs ? 'SSO Empresarial:' : 'Enterprise SSO:'}</strong>{' '}
          {isEs 
            ? 'Integración de inicio de sesión único para clientes empresariales.'
            : 'Single sign-on integration for enterprise customers.'}
        </li>
        <li>
          <strong>{isEs ? 'Registros de auditoría:' : 'Audit logs:'}</strong>{' '}
          {isEs 
            ? 'Registros detallados de actividad para cumplimiento.'
            : 'Detailed activity logging for compliance.'}
        </li>
        <li>
          <strong>{isEs ? 'Certificación SOC 2:' : 'SOC 2 certification:'}</strong>{' '}
          {isEs 
            ? 'Búsqueda planificada a medida que la empresa escala.'
            : 'Planned pursuit as company scales.'}
        </li>
      </ul>

      <h2>{isEs ? 'Informe de Vulnerabilidades' : 'Vulnerability Reporting'}</h2>
      <p>
        {isEs 
          ? 'Si descubre una vulnerabilidad de seguridad, por favor infórmela de manera responsable a:'
          : 'If you discover a security vulnerability, please report it responsibly to:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default SecurityWhitepaper;
