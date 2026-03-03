import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const AcceptableUse = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Política de Uso Aceptable' : 'Acceptable Use Policy'}
      subtitle={isEs ? 'Directrices de uso de la plataforma' : 'Platform usage guidelines'}
      icon="acceptable"
    >
      <h2>{isEs ? 'Resumen' : 'Overview'}</h2>
      <p>
        {isEs 
          ? 'Esta Política de Uso Aceptable describe los usos permitidos y prohibidos de la plataforma TeacherHubPro. Al usar nuestros servicios, usted acepta cumplir con esta política.'
          : 'This Acceptable Use Policy outlines permitted and prohibited uses of the TeacherHubPro platform. By using our services, you agree to comply with this policy.'}
      </p>

      <h2>{isEs ? 'Usos Prohibidos' : 'Prohibited Uses'}</h2>
      <p>
        {isEs ? 'Los usuarios no deben:' : 'Users must not:'}
      </p>

      <h3>{isEs ? 'Contenido Malicioso' : 'Malicious Content'}</h3>
      <ul>
        <li>{isEs ? 'Subir virus, malware o código dañino' : 'Upload viruses, malware, or harmful code'}</li>
        <li>{isEs ? 'Distribuir spam o contenido no solicitado' : 'Distribute spam or unsolicited content'}</li>
        <li>{isEs ? 'Subir contenido ilegal, ofensivo o inapropiado' : 'Upload illegal, offensive, or inappropriate content'}</li>
      </ul>

      <h3>{isEs ? 'Acceso No Autorizado' : 'Unauthorized Access'}</h3>
      <ul>
        <li>{isEs ? 'Intentar acceder a cuentas o datos de otros usuarios' : 'Attempt to access other users\' accounts or data'}</li>
        <li>{isEs ? 'Eludir medidas de seguridad' : 'Circumvent security measures'}</li>
        <li>{isEs ? 'Realizar ingeniería inversa o descompilar el software' : 'Reverse engineer or decompile the software'}</li>
        <li>{isEs ? 'Probar vulnerabilidades sin autorización' : 'Test for vulnerabilities without authorization'}</li>
      </ul>

      <h3>{isEs ? 'Uso Indebido de IA' : 'AI Misuse'}</h3>
      <ul>
        <li>{isEs ? 'Usar herramientas de IA para generar contenido dañino, engañoso o ilegal' : 'Use AI tools to generate harmful, misleading, or illegal content'}</li>
        <li>{isEs ? 'Intentar hacer jailbreak o eludir las salvaguardas de IA' : 'Attempt to jailbreak or bypass AI safeguards'}</li>
        <li>{isEs ? 'Usar contenido generado por IA para engañar a otros' : 'Use AI-generated content to deceive others'}</li>
      </ul>

      <h3>{isEs ? 'Violaciones Legales' : 'Legal Violations'}</h3>
      <ul>
        <li>{isEs ? 'Violar cualquier ley o regulación aplicable' : 'Violate any applicable laws or regulations'}</li>
        <li>{isEs ? 'Infringir derechos de propiedad intelectual' : 'Infringe intellectual property rights'}</li>
        <li>{isEs ? 'Violar las leyes de privacidad de datos' : 'Violate data privacy laws'}</li>
        <li>{isEs ? 'Participar en actividades fraudulentas' : 'Engage in fraudulent activity'}</li>
      </ul>

      <h2>{isEs ? 'Usos Aceptables' : 'Acceptable Uses'}</h2>
      <p>
        {isEs 
          ? 'TeacherHubPro está diseñado para propósitos educativos legítimos, incluyendo:'
          : 'TeacherHubPro is designed for legitimate educational purposes, including:'}
      </p>
      <ul>
        <li>{isEs ? 'Planificación de lecciones y desarrollo curricular' : 'Lesson planning and curriculum development'}</li>
        <li>{isEs ? 'Seguimiento del progreso estudiantil' : 'Student progress tracking'}</li>
        <li>{isEs ? 'Gestión del aula' : 'Classroom management'}</li>
        <li>{isEs ? 'Comunicación con padres' : 'Parent communication'}</li>
        <li>{isEs ? 'Colaboración profesional entre educadores' : 'Professional collaboration among educators'}</li>
      </ul>

      <h2>{isEs ? 'Aplicación' : 'Enforcement'}</h2>
      <p>
        {isEs 
          ? 'Las violaciones de esta política pueden resultar en:'
          : 'Violations of this policy may result in:'}
      </p>
      <ul>
        <li>{isEs ? 'Advertencia' : 'Warning'}</li>
        <li>{isEs ? 'Suspensión temporal de la cuenta' : 'Temporary account suspension'}</li>
        <li>{isEs ? 'Terminación permanente de la cuenta' : 'Permanent account termination'}</li>
        <li>{isEs ? 'Reporte a las autoridades competentes' : 'Reporting to appropriate authorities'}</li>
      </ul>

      <h2>{isEs ? 'Reportar Violaciones' : 'Reporting Violations'}</h2>
      <p>
        {isEs 
          ? 'Si observa una violación de esta política, por favor repórtela a:'
          : 'If you observe a violation of this policy, please report it to:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default AcceptableUse;
