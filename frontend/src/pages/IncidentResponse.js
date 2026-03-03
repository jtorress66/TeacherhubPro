import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const IncidentResponse = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Política de Respuesta a Incidentes' : 'Incident Response Policy'}
      subtitle={isEs ? 'Procedimientos de manejo de incidentes de seguridad' : 'Security incident handling procedures'}
      icon="incident"
    >
      <h2>{isEs ? 'Resumen' : 'Overview'}</h2>
      <p>
        {isEs 
          ? 'Esta política describe el enfoque de TeacherHubPro para identificar, responder y recuperarse de incidentes de seguridad.'
          : 'This policy outlines TeacherHubPro\'s approach to identifying, responding to, and recovering from security incidents.'}
      </p>

      <h2>{isEs ? '1. Identificación' : '1. Identification'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Sistemas de monitoreo:' : 'Monitoring systems:'}</strong>{' '}
          {isEs 
            ? 'Implementamos monitoreo continuo para detectar actividad inusual.'
            : 'We implement continuous monitoring to detect unusual activity.'}
        </li>
        <li>
          <strong>{isEs ? 'Registro:' : 'Logging:'}</strong>{' '}
          {isEs 
            ? 'Los eventos del sistema se registran para investigación y análisis.'
            : 'System events are logged for investigation and analysis.'}
        </li>
        <li>
          <strong>{isEs ? 'Informes de usuarios:' : 'User reports:'}</strong>{' '}
          {isEs 
            ? 'Los usuarios pueden informar problemas de seguridad sospechosos.'
            : 'Users can report suspected security issues.'}
        </li>
      </ul>

      <h2>{isEs ? '2. Contención' : '2. Containment'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Investigación inmediata:' : 'Immediate investigation:'}</strong>{' '}
          {isEs 
            ? 'Investigamos rápidamente los incidentes potenciales.'
            : 'We quickly investigate potential incidents.'}
        </li>
        <li>
          <strong>{isEs ? 'Aislamiento:' : 'Isolation:'}</strong>{' '}
          {isEs 
            ? 'Los sistemas afectados se aíslan para prevenir la propagación.'
            : 'Affected systems are isolated to prevent spread.'}
        </li>
        <li>
          <strong>{isEs ? 'Preservación de evidencia:' : 'Evidence preservation:'}</strong>{' '}
          {isEs 
            ? 'Se recopila y preserva evidencia para el análisis.'
            : 'Evidence is collected and preserved for analysis.'}
        </li>
      </ul>

      <h2>{isEs ? '3. Erradicación' : '3. Eradication'}</h2>
      <ul>
        <li>{isEs ? 'Análisis de causa raíz' : 'Root cause analysis'}</li>
        <li>{isEs ? 'Eliminación de amenazas' : 'Threat removal'}</li>
        <li>{isEs ? 'Parcheo de vulnerabilidades' : 'Vulnerability patching'}</li>
        <li>{isEs ? 'Verificación del sistema' : 'System verification'}</li>
      </ul>

      <h2>{isEs ? '4. Recuperación' : '4. Recovery'}</h2>
      <ul>
        <li>{isEs ? 'Restauración del sistema' : 'System restoration'}</li>
        <li>{isEs ? 'Monitoreo de recurrencia' : 'Monitoring for recurrence'}</li>
        <li>{isEs ? 'Retorno gradual a operaciones normales' : 'Gradual return to normal operations'}</li>
      </ul>

      <h2>{isEs ? '5. Notificación' : '5. Notification'}</h2>
      <p>
        {isEs 
          ? 'Proporcionamos notificación oportuna según lo requerido por ley:'
          : 'We provide prompt notice as required by law:'}
      </p>
      <ul>
        <li>
          <strong>{isEs ? 'Usuarios afectados:' : 'Affected users:'}</strong>{' '}
          {isEs 
            ? 'Notificados si sus datos pueden haber sido comprometidos.'
            : 'Notified if their data may have been compromised.'}
        </li>
        <li>
          <strong>{isEs ? 'Instituciones:' : 'Institutions:'}</strong>{' '}
          {isEs 
            ? 'Clientes empresariales notificados según el acuerdo.'
            : 'Enterprise customers notified per agreement.'}
        </li>
        <li>
          <strong>{isEs ? 'Reguladores:' : 'Regulators:'}</strong>{' '}
          {isEs 
            ? 'Notificación a las autoridades según lo requerido por la ley aplicable.'
            : 'Notification to authorities as required by applicable law.'}
        </li>
      </ul>

      <h2>{isEs ? '6. Lecciones Aprendidas' : '6. Lessons Learned'}</h2>
      <ul>
        <li>{isEs ? 'Revisión post-incidente' : 'Post-incident review'}</li>
        <li>{isEs ? 'Actualización de procedimientos' : 'Procedure updates'}</li>
        <li>{isEs ? 'Mejoras de seguridad' : 'Security enhancements'}</li>
        <li>{isEs ? 'Documentación' : 'Documentation'}</li>
      </ul>

      <h2>{isEs ? 'Informar un Incidente' : 'Report an Incident'}</h2>
      <p>
        {isEs 
          ? 'Si sospecha un incidente de seguridad, contáctenos inmediatamente:'
          : 'If you suspect a security incident, contact us immediately:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default IncidentResponse;
