import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const BreachPolicy = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Política de Violación de Datos' : 'Data Breach Policy'}
      subtitle={isEs ? 'Protocolo de notificación y respuesta a violaciones' : 'Breach notification and response protocol'}
      icon="breach"
    >
      <h2>{isEs ? 'Definición de Violación de Datos' : 'Data Breach Definition'}</h2>
      <p>
        {isEs 
          ? 'Una violación de datos es un incidente de seguridad en el que datos personales sensibles, protegidos o confidenciales se copian, transmiten, ven, roban o utilizan por una persona no autorizada.'
          : 'A data breach is a security incident in which sensitive, protected, or confidential personal data is copied, transmitted, viewed, stolen, or used by an unauthorized individual.'}
      </p>

      <h2>{isEs ? 'Respuesta a Violación' : 'Breach Response'}</h2>

      <h3>{isEs ? '1. Investigación Inmediata' : '1. Immediate Investigation'}</h3>
      <ul>
        <li>{isEs ? 'Determinar el alcance y naturaleza de la violación' : 'Determine scope and nature of breach'}</li>
        <li>{isEs ? 'Identificar los datos afectados' : 'Identify affected data'}</li>
        <li>{isEs ? 'Evaluar el riesgo para las personas afectadas' : 'Assess risk to affected individuals'}</li>
        <li>{isEs ? 'Documentar hallazgos' : 'Document findings'}</li>
      </ul>

      <h3>{isEs ? '2. Cumplimiento de Notificación Legal' : '2. Legal Notification Compliance'}</h3>
      <p>
        {isEs 
          ? 'Cumplimos con todas las leyes aplicables de notificación de violación de datos, incluyendo:'
          : 'We comply with all applicable data breach notification laws, including:'}
      </p>
      <ul>
        <li>{isEs ? 'Leyes de notificación de violación estatales de EE.UU.' : 'U.S. state breach notification laws'}</li>
        <li>{isEs ? 'Requisitos de notificación de violación de GDPR (72 horas)' : 'GDPR breach notification requirements (72 hours)'}</li>
        <li>{isEs ? 'Regulaciones específicas de la industria' : 'Industry-specific regulations'}</li>
      </ul>

      <h3>{isEs ? '3. Mitigación y Remediación' : '3. Mitigation & Remediation'}</h3>
      <ul>
        <li>{isEs ? 'Contener la violación' : 'Contain the breach'}</li>
        <li>{isEs ? 'Parchear vulnerabilidades' : 'Patch vulnerabilities'}</li>
        <li>{isEs ? 'Mejorar los controles de seguridad' : 'Enhance security controls'}</li>
        <li>{isEs ? 'Proporcionar recursos a las personas afectadas' : 'Provide resources to affected individuals'}</li>
      </ul>

      <h2>{isEs ? 'Contenido de Notificación' : 'Notification Content'}</h2>
      <p>
        {isEs 
          ? 'Las notificaciones de violación incluirán:'
          : 'Breach notifications will include:'}
      </p>
      <ul>
        <li>{isEs ? 'Descripción del incidente' : 'Description of the incident'}</li>
        <li>{isEs ? 'Tipos de datos involucrados' : 'Types of data involved'}</li>
        <li>{isEs ? 'Pasos que estamos tomando' : 'Steps we are taking'}</li>
        <li>{isEs ? 'Acciones recomendadas para las personas afectadas' : 'Recommended actions for affected individuals'}</li>
        <li>{isEs ? 'Información de contacto para preguntas' : 'Contact information for questions'}</li>
      </ul>

      <h2>{isEs ? 'Cronograma de Notificación' : 'Notification Timeline'}</h2>
      <p>
        {isEs 
          ? 'Nos esforzamos por notificar a las partes afectadas lo antes posible después de descubrir una violación, y de conformidad con los requisitos legales aplicables.'
          : 'We strive to notify affected parties as soon as practicable after discovering a breach, and in compliance with applicable legal requirements.'}
      </p>

      <h2>{isEs ? 'Mejora Continua' : 'Continuous Improvement'}</h2>
      <p>
        {isEs 
          ? 'Después de cualquier incidente de violación:'
          : 'Following any breach incident:'}
      </p>
      <ul>
        <li>{isEs ? 'Realizamos una revisión exhaustiva' : 'We conduct a thorough review'}</li>
        <li>{isEs ? 'Actualizamos las medidas de seguridad según sea necesario' : 'Update security measures as needed'}</li>
        <li>{isEs ? 'Revisamos y mejoramos los procedimientos de respuesta' : 'Review and improve response procedures'}</li>
      </ul>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        {isEs 
          ? 'Para informar una sospecha de violación o para preguntas:'
          : 'To report a suspected breach or for questions:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default BreachPolicy;
