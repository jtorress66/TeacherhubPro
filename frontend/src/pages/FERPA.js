import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const FERPA = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Declaración FERPA' : 'FERPA Statement'}
      subtitle={isEs ? 'Ley de Derechos Educativos y Privacidad de la Familia' : 'Family Educational Rights and Privacy Act'}
      icon="ferpa"
    >
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <p className="text-green-800 font-medium">
          {isEs 
            ? 'TeacherHubPro actúa como un Funcionario Escolar con interés educativo legítimo.'
            : 'TeacherHubPro acts as a School Official with legitimate educational interest.'}
        </p>
      </div>

      <h2>{isEs ? '¿Qué es FERPA?' : 'What is FERPA?'}</h2>
      <p>
        {isEs 
          ? 'FERPA (Ley de Derechos Educativos y Privacidad de la Familia) es una ley federal de EE.UU. que protege la privacidad de los registros educativos de los estudiantes. Se aplica a todas las escuelas que reciben fondos del Departamento de Educación de EE.UU.'
          : 'FERPA (Family Educational Rights and Privacy Act) is a U.S. federal law that protects the privacy of student education records. It applies to all schools that receive funds from the U.S. Department of Education.'}
      </p>

      <h2>{isEs ? 'Nuestros Compromisos FERPA' : 'Our FERPA Commitments'}</h2>
      <p>{isEs ? 'TeacherHubPro se compromete a:' : 'TeacherHubPro commits to:'}</p>
      <ul>
        <li>
          <strong>{isEs ? 'No venta de datos de estudiantes:' : 'No sale of student data:'}</strong>{' '}
          {isEs 
            ? 'Nunca vendemos, alquilamos ni intercambiamos información de estudiantes.'
            : 'We never sell, rent, or trade student information.'}
        </li>
        <li>
          <strong>{isEs ? 'Uso limitado:' : 'Limited use:'}</strong>{' '}
          {isEs 
            ? 'Los datos de estudiantes se utilizan únicamente para proporcionar servicios educativos.'
            : 'Student data is used only to provide educational services.'}
        </li>
        <li>
          <strong>{isEs ? 'Salvaguardas razonables:' : 'Reasonable safeguards:'}</strong>{' '}
          {isEs 
            ? 'Implementamos medidas de seguridad técnicas y administrativas para proteger los datos.'
            : 'We implement technical and administrative security measures to protect data.'}
        </li>
        <li>
          <strong>{isEs ? 'Control del distrito:' : 'District control:'}</strong>{' '}
          {isEs 
            ? 'Las escuelas y distritos mantienen el control sobre los datos de sus estudiantes.'
            : 'Schools and districts maintain control over their student data.'}
        </li>
      </ul>

      <h2>{isEs ? 'Excepción de Funcionario Escolar' : 'School Official Exception'}</h2>
      <p>
        {isEs 
          ? 'Bajo FERPA, las escuelas pueden divulgar registros educativos sin consentimiento a "funcionarios escolares" con "interés educativo legítimo". TeacherHubPro califica como un funcionario escolar porque:'
          : 'Under FERPA, schools may disclose education records without consent to "school officials" with "legitimate educational interest." TeacherHubPro qualifies as a school official because:'}
      </p>
      <ul>
        <li>{isEs ? 'Proporcionamos servicios educativos en nombre de la escuela' : 'We provide educational services on behalf of the school'}</li>
        <li>{isEs ? 'Estamos bajo el control directo de la escuela con respecto al uso de datos' : 'We are under the direct control of the school regarding data use'}</li>
        <li>{isEs ? 'Usamos datos solo para el propósito para el cual fueron divulgados' : 'We use data only for the purpose for which it was disclosed'}</li>
        <li>{isEs ? 'Cumplimos con los requisitos de uso y redivulgación de FERPA' : 'We meet FERPA\'s use and re-disclosure requirements'}</li>
      </ul>

      <h2>{isEs ? 'Derechos de los Padres' : 'Parent Rights'}</h2>
      <p>
        {isEs 
          ? 'Los padres tienen derecho a:'
          : 'Parents have the right to:'}
      </p>
      <ul>
        <li>{isEs ? 'Inspeccionar y revisar los registros educativos de su hijo' : 'Inspect and review their child\'s education records'}</li>
        <li>{isEs ? 'Solicitar correcciones a los registros' : 'Request corrections to records'}</li>
        <li>{isEs ? 'Dar consentimiento para la divulgación (excepto las excepciones de FERPA)' : 'Consent to disclosure (except for FERPA exceptions)'}</li>
      </ul>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        {isEs 
          ? 'Para preguntas sobre nuestras prácticas FERPA:'
          : 'For questions about our FERPA practices:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default FERPA;
