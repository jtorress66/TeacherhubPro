import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const BusinessContinuity = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Plan de Continuidad del Negocio' : 'Business Continuity Plan'}
      subtitle={isEs ? 'Recuperación ante desastres y resiliencia' : 'Disaster recovery and resilience'}
      icon="continuity"
    >
      <h2>{isEs ? 'Resumen' : 'Overview'}</h2>
      <p>
        {isEs 
          ? 'TeacherHubPro mantiene un plan de continuidad del negocio para garantizar la disponibilidad del servicio y la protección de datos en caso de interrupciones.'
          : 'TeacherHubPro maintains a business continuity plan to ensure service availability and data protection in the event of disruptions.'}
      </p>

      <h2>{isEs ? 'Redundancia en la Nube' : 'Cloud Redundancy'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Arquitectura distribuida:' : 'Distributed architecture:'}</strong>{' '}
          {isEs 
            ? 'Nuestros servicios están distribuidos en múltiples zonas de disponibilidad.'
            : 'Our services are distributed across multiple availability zones.'}
        </li>
        <li>
          <strong>{isEs ? 'Balanceo de carga:' : 'Load balancing:'}</strong>{' '}
          {isEs 
            ? 'El tráfico se distribuye automáticamente para mantener el rendimiento.'
            : 'Traffic is automatically distributed to maintain performance.'}
        </li>
        <li>
          <strong>{isEs ? 'Conmutación por error:' : 'Failover:'}</strong>{' '}
          {isEs 
            ? 'Cambio automático a sistemas de respaldo en caso de falla.'
            : 'Automatic switching to backup systems in case of failure.'}
        </li>
      </ul>

      <h2>{isEs ? 'Sistemas de Respaldo' : 'Backup Systems'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Respaldos regulares de datos:' : 'Regular data backups:'}</strong>{' '}
          {isEs 
            ? 'Los datos se respaldan regularmente para prevenir pérdidas.'
            : 'Data is backed up regularly to prevent loss.'}
        </li>
        <li>
          <strong>{isEs ? 'Almacenamiento geográficamente separado:' : 'Geographically separated storage:'}</strong>{' '}
          {isEs 
            ? 'Los respaldos se almacenan en ubicaciones separadas.'
            : 'Backups are stored in separate locations.'}
        </li>
        <li>
          <strong>{isEs ? 'Pruebas de restauración:' : 'Restoration testing:'}</strong>{' '}
          {isEs 
            ? 'Probamos regularmente nuestros procedimientos de respaldo y restauración.'
            : 'We regularly test our backup and restoration procedures.'}
        </li>
      </ul>

      <h2>{isEs ? 'Protocolos de Recuperación ante Desastres' : 'Disaster Recovery Protocols'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Objetivos de tiempo de recuperación (RTO):' : 'Recovery Time Objectives (RTO):'}</strong>{' '}
          {isEs 
            ? 'Trabajamos para restaurar los servicios lo más rápido posible después de un incidente.'
            : 'We work to restore services as quickly as possible following an incident.'}
        </li>
        <li>
          <strong>{isEs ? 'Objetivos de punto de recuperación (RPO):' : 'Recovery Point Objectives (RPO):'}</strong>{' '}
          {isEs 
            ? 'Los datos se respaldan frecuentemente para minimizar la pérdida potencial de datos.'
            : 'Data is backed up frequently to minimize potential data loss.'}
        </li>
        <li>
          <strong>{isEs ? 'Plan de comunicación:' : 'Communication plan:'}</strong>{' '}
          {isEs 
            ? 'Procedimientos para notificar a usuarios e instituciones durante interrupciones.'
            : 'Procedures for notifying users and institutions during outages.'}
        </li>
      </ul>

      <h2>{isEs ? 'Tipos de Incidentes Cubiertos' : 'Incident Types Covered'}</h2>
      <ul>
        <li>{isEs ? 'Interrupciones del proveedor de nube' : 'Cloud provider outages'}</li>
        <li>{isEs ? 'Interrupciones de red' : 'Network disruptions'}</li>
        <li>{isEs ? 'Fallas de hardware' : 'Hardware failures'}</li>
        <li>{isEs ? 'Incidentes de ciberseguridad' : 'Cybersecurity incidents'}</li>
        <li>{isEs ? 'Desastres naturales que afectan los centros de datos' : 'Natural disasters affecting data centers'}</li>
      </ul>

      <h2>{isEs ? 'Pruebas y Mejora' : 'Testing & Improvement'}</h2>
      <p>
        {isEs 
          ? 'Revisamos y probamos regularmente nuestro plan de continuidad del negocio para asegurar que siga siendo efectivo y actualizado.'
          : 'We regularly review and test our business continuity plan to ensure it remains effective and up-to-date.'}
      </p>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        {isEs 
          ? 'Para preguntas sobre nuestra planificación de continuidad del negocio:'
          : 'For questions about our business continuity planning:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default BusinessContinuity;
