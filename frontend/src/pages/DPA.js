import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const DPA = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Acuerdo de Procesamiento de Datos (DPA)' : 'Data Processing Addendum (DPA)'}
      subtitle={isEs ? 'Para instituciones educativas' : 'For educational institutions'}
      icon="dpa"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 font-medium">
          {isEs ? 'Institución = Controlador de Datos' : 'Institution = Data Controller'}
        </p>
        <p className="text-blue-800 font-medium">
          {isEs ? 'TeacherHubPro = Procesador de Datos' : 'TeacherHubPro = Data Processor'}
        </p>
      </div>

      <h2>{isEs ? 'Alcance del Procesamiento' : 'Scope of Processing'}</h2>
      <p>
        {isEs 
          ? 'Procesamos datos únicamente para proporcionar servicios educativos contratados.'
          : 'We process data solely to provide contracted educational services.'}
      </p>

      <h2>{isEs ? 'Tipos de Datos Procesados' : 'Types of Data Processed'}</h2>
      <ul>
        <li>{isEs ? 'Información del educador (nombre, correo electrónico, escuela)' : 'Educator information (name, email, school)'}</li>
        <li>{isEs ? 'Datos de estudiantes según lo proporcione el educador' : 'Student data as provided by educator'}</li>
        <li>{isEs ? 'Contenido educativo (planes de lecciones, calificaciones, asistencia)' : 'Educational content (lesson plans, grades, attendance)'}</li>
        <li>{isEs ? 'Datos de uso para mejora del servicio' : 'Usage data for service improvement'}</li>
      </ul>

      <h2>{isEs ? 'Controles de Seguridad' : 'Security Controls'}</h2>
      <ul>
        <li>{isEs ? 'Encriptación en tránsito (HTTPS/TLS)' : 'Encryption in transit (HTTPS/TLS)'}</li>
        <li>{isEs ? 'Alojamiento seguro en la nube' : 'Secure cloud hosting'}</li>
        <li>{isEs ? 'Acuerdos de protección de datos con proveedores' : 'Vendor data protection agreements'}</li>
        <li>{isEs ? 'Controles de acceso basados en roles' : 'Role-based access controls'}</li>
        <li>{isEs ? 'Auditorías de seguridad regulares' : 'Regular security audits'}</li>
      </ul>

      <h2>{isEs ? 'Subprocesadores' : 'Sub-processors'}</h2>
      <p>
        {isEs 
          ? 'Podemos utilizar subprocesadores para proporcionar servicios. Todos los subprocesadores están sujetos a obligaciones de protección de datos equivalentes.'
          : 'We may use sub-processors to provide services. All sub-processors are subject to equivalent data protection obligations.'}
      </p>

      <h2>{isEs ? 'Retención de Datos' : 'Data Retention'}</h2>
      <p>
        {isEs 
          ? 'Los datos se eliminan dentro de un plazo razonable después de la terminación del contrato, a menos que se requiera retención por ley.'
          : 'Data deleted within reasonable timeframe after contract termination, unless retention required by law.'}
      </p>

      <h2>{isEs ? 'Notificación de Violación de Datos' : 'Data Breach Notification'}</h2>
      <p>
        {isEs 
          ? 'Notificaremos a la institución de cualquier violación de datos dentro de las 72 horas posteriores a su descubrimiento.'
          : 'We will notify the institution of any data breach within 72 hours of discovery.'}
      </p>

      <h2>{isEs ? 'Derechos del Interesado' : 'Data Subject Rights'}</h2>
      <p>
        {isEs 
          ? 'Ayudaremos a la institución a responder a las solicitudes de los interesados relacionadas con el acceso, rectificación o eliminación de datos personales.'
          : 'We will assist the institution in responding to data subject requests related to access, rectification, or deletion of personal data.'}
      </p>

      <h2>{isEs ? 'Solicitar DPA Firmado' : 'Request Signed DPA'}</h2>
      <p>
        {isEs 
          ? 'Para solicitar un DPA firmado para su institución, contáctenos en:'
          : 'To request a signed DPA for your institution, contact us at:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default DPA;
