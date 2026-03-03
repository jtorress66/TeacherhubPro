import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const SLA = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Acuerdo de Nivel de Servicio (SLA)' : 'Service Level Agreement (SLA)'}
      subtitle={isEs ? 'Compromisos de disponibilidad y rendimiento' : 'Availability and performance commitments'}
      icon="sla"
    >
      <h2>{isEs ? 'Disponibilidad Objetivo' : 'Target Availability'}</h2>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <p className="text-2xl font-bold text-amber-800">99%</p>
        <p className="text-amber-700">
          {isEs 
            ? 'Tiempo de actividad mensual (excluyendo mantenimiento programado)'
            : 'Monthly uptime (excluding scheduled maintenance)'}
        </p>
      </div>

      <h2>{isEs ? 'Definición de Disponibilidad' : 'Availability Definition'}</h2>
      <p>
        {isEs 
          ? 'Disponibilidad significa que los usuarios autenticados pueden acceder a las funcionalidades principales de la plataforma TeacherHubPro.'
          : 'Availability means authenticated users can access core functionalities of the TeacherHubPro platform.'}
      </p>

      <h2>{isEs ? 'Exclusiones' : 'Exclusions'}</h2>
      <p>
        {isEs 
          ? 'El siguiente tiempo de inactividad no cuenta para el cálculo de disponibilidad:'
          : 'The following downtime does not count toward availability calculation:'}
      </p>
      <ul>
        <li>{isEs ? 'Mantenimiento programado (notificado con al menos 24 horas de anticipación)' : 'Scheduled maintenance (notified at least 24 hours in advance)'}</li>
        <li>{isEs ? 'Eventos de fuerza mayor' : 'Force majeure events'}</li>
        <li>{isEs ? 'Problemas causados por factores fuera de nuestro control' : 'Issues caused by factors outside our control'}</li>
        <li>{isEs ? 'Interrupciones de proveedores externos' : 'Third-party provider outages'}</li>
      </ul>

      <h2>{isEs ? 'Respuesta a Incidentes' : 'Incident Response'}</h2>
      <p>
        {isEs 
          ? 'Cuando se identifica un incidente de servicio:'
          : 'When a service incident is identified:'}
      </p>
      <ul>
        <li>
          <strong>{isEs ? 'Investigación inmediata:' : 'Immediate investigation:'}</strong>{' '}
          {isEs 
            ? 'Nuestro equipo investiga y trabaja para resolver el problema.'
            : 'Our team investigates and works to resolve the issue.'}
        </li>
        <li>
          <strong>{isEs ? 'Comunicación:' : 'Communication:'}</strong>{' '}
          {isEs 
            ? 'Proporcionamos actualizaciones cuando es necesario para incidentes significativos.'
            : 'We provide updates when required for significant incidents.'}
        </li>
        <li>
          <strong>{isEs ? 'Medidas correctivas:' : 'Corrective measures:'}</strong>{' '}
          {isEs 
            ? 'Implementamos correcciones y medidas preventivas.'
            : 'We implement fixes and preventive measures.'}
        </li>
      </ul>

      <h2>{isEs ? 'Ventana de Mantenimiento' : 'Maintenance Window'}</h2>
      <p>
        {isEs 
          ? 'El mantenimiento programado generalmente se realiza durante horas de bajo tráfico y se notifica con anticipación a través de:'
          : 'Scheduled maintenance is typically performed during low-traffic hours and notified in advance via:'}
      </p>
      <ul>
        <li>{isEs ? 'Notificación en la aplicación' : 'In-app notification'}</li>
        <li>{isEs ? 'Correo electrónico a administradores (para cuentas empresariales)' : 'Email to administrators (for enterprise accounts)'}</li>
      </ul>

      <h2>{isEs ? 'Soporte' : 'Support'}</h2>
      <p>
        {isEs 
          ? 'El soporte está disponible a través de:'
          : 'Support is available via:'}
      </p>
      <ul>
        <li>
          <strong>Email:</strong>{' '}
          <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
            support@teacherhubpro.com
          </a>
        </li>
        <li>{isEs ? 'Centro de ayuda en la aplicación' : 'In-app help center'}</li>
      </ul>

      <h2>{isEs ? 'Acuerdos Empresariales' : 'Enterprise Agreements'}</h2>
      <p>
        {isEs 
          ? 'Los clientes empresariales pueden negociar SLAs personalizados con compromisos de disponibilidad mejorados, tiempos de respuesta de soporte dedicados y términos de crédito de servicio.'
          : 'Enterprise customers may negotiate custom SLAs with enhanced availability commitments, dedicated support response times, and service credit terms.'}
      </p>
      <p>
        {isEs 
          ? 'Contáctenos para discutir acuerdos empresariales:'
          : 'Contact us to discuss enterprise agreements:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default SLA;
