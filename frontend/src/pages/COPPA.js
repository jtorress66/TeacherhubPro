import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const COPPA = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Declaración COPPA' : 'COPPA Statement'}
      subtitle={isEs ? 'Ley de Protección de la Privacidad Infantil en Línea' : 'Children\'s Online Privacy Protection Act'}
      icon="coppa"
    >
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4 mb-6">
        <p className="text-pink-800 font-medium">
          {isEs 
            ? 'TeacherHubPro está diseñado principalmente para educadores adultos. Cuando los estudiantes menores de 13 años utilizan la plataforma, las escuelas actúan como autoridad de consentimiento.'
            : 'TeacherHubPro is designed primarily for adult educators. When students under 13 use the platform, schools act as the consenting authority.'}
        </p>
      </div>

      <h2>{isEs ? '¿Qué es COPPA?' : 'What is COPPA?'}</h2>
      <p>
        {isEs 
          ? 'COPPA (Ley de Protección de la Privacidad Infantil en Línea) es una ley federal de EE.UU. que impone requisitos a operadores de sitios web y servicios en línea dirigidos a niños menores de 13 años, o que recopilan información personal de niños menores de 13 años.'
          : 'COPPA (Children\'s Online Privacy Protection Act) is a U.S. federal law that imposes requirements on operators of websites and online services directed to children under 13, or that collect personal information from children under 13.'}
      </p>

      <h2>{isEs ? 'Nuestro Enfoque' : 'Our Approach'}</h2>
      <p>
        {isEs 
          ? 'Si TeacherHubPro es utilizado por estudiantes menores de 13 años:'
          : 'If TeacherHubPro is used by students under 13:'}
      </p>
      <ul>
        <li>
          <strong>{isEs ? 'Las escuelas como autoridad de consentimiento:' : 'Schools as consent authority:'}</strong>{' '}
          {isEs 
            ? 'Las escuelas pueden dar consentimiento en nombre de los padres para la recopilación de información de estudiantes para fines educativos.'
            : 'Schools may consent on behalf of parents for the collection of student information for educational purposes.'}
        </li>
        <li>
          <strong>{isEs ? 'Solo fines educativos:' : 'Educational purposes only:'}</strong>{' '}
          {isEs 
            ? 'Los datos se utilizan únicamente para proporcionar servicios educativos.'
            : 'Data is used solely to provide educational services.'}
        </li>
        <li>
          <strong>{isEs ? 'Sin publicidad dirigida:' : 'No targeted advertising:'}</strong>{' '}
          {isEs 
            ? 'No utilizamos datos de estudiantes para publicidad dirigida.'
            : 'We do not use student data for targeted advertising.'}
        </li>
        <li>
          <strong>{isEs ? 'Sin venta de datos:' : 'No data sales:'}</strong>{' '}
          {isEs 
            ? 'Nunca vendemos información personal de niños.'
            : 'We never sell children\'s personal information.'}
        </li>
      </ul>

      <h2>{isEs ? 'Información que Podemos Recopilar' : 'Information We May Collect'}</h2>
      <p>
        {isEs 
          ? 'Cuando los estudiantes utilizan la plataforma a través de sus maestros, podemos recopilar:'
          : 'When students use the platform through their teachers, we may collect:'}
      </p>
      <ul>
        <li>{isEs ? 'Nombre del estudiante (según lo proporcione el maestro)' : 'Student name (as provided by teacher)'}</li>
        <li>{isEs ? 'Trabajo y progreso educativo' : 'Educational work and progress'}</li>
        <li>{isEs ? 'Respuestas de evaluación' : 'Assessment responses'}</li>
      </ul>

      <h2>{isEs ? 'Derechos de los Padres' : 'Parent Rights'}</h2>
      <p>
        {isEs 
          ? 'Los padres tienen derecho a:'
          : 'Parents have the right to:'}
      </p>
      <ul>
        <li>{isEs ? 'Revisar la información personal de su hijo' : 'Review their child\'s personal information'}</li>
        <li>{isEs ? 'Solicitar la eliminación de la información de su hijo' : 'Request deletion of their child\'s information'}</li>
        <li>{isEs ? 'Rechazar la recopilación adicional' : 'Refuse further collection'}</li>
      </ul>
      <p>
        {isEs 
          ? 'Los padres deben contactar primero a la escuela de su hijo, ya que la escuela controla los datos de los estudiantes.'
          : 'Parents should first contact their child\'s school, as the school controls student data.'}
      </p>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        {isEs 
          ? 'Para preguntas sobre nuestras prácticas COPPA:'
          : 'For questions about our COPPA practices:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default COPPA;
