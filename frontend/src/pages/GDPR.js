import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const GDPR = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Declaración GDPR' : 'GDPR Statement'}
      subtitle={isEs ? 'Reglamento General de Protección de Datos' : 'General Data Protection Regulation'}
      icon="gdpr"
    >
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
        <p className="text-cyan-800 font-medium">
          {isEs 
            ? 'TeacherHubPro respeta los derechos de privacidad de datos de los usuarios de la Unión Europea y el Espacio Económico Europeo.'
            : 'TeacherHubPro respects the data privacy rights of European Union and European Economic Area users.'}
        </p>
      </div>

      <h2>{isEs ? '¿Qué es GDPR?' : 'What is GDPR?'}</h2>
      <p>
        {isEs 
          ? 'GDPR (Reglamento General de Protección de Datos) es una regulación de la Unión Europea sobre protección de datos y privacidad. Otorga a los individuos control sobre sus datos personales.'
          : 'GDPR (General Data Protection Regulation) is a European Union regulation on data protection and privacy. It gives individuals control over their personal data.'}
      </p>

      <h2>{isEs ? 'Sus Derechos Bajo GDPR' : 'Your Rights Under GDPR'}</h2>
      <p>
        {isEs 
          ? 'Los usuarios tienen derecho a:'
          : 'Users have the right to:'}
      </p>
      <ul>
        <li>
          <strong>{isEs ? 'Acceso:' : 'Access:'}</strong>{' '}
          {isEs 
            ? 'Solicitar una copia de sus datos personales.'
            : 'Request a copy of your personal data.'}
        </li>
        <li>
          <strong>{isEs ? 'Rectificación:' : 'Rectification:'}</strong>{' '}
          {isEs 
            ? 'Corregir datos personales inexactos o incompletos.'
            : 'Correct inaccurate or incomplete personal data.'}
        </li>
        <li>
          <strong>{isEs ? 'Supresión:' : 'Erasure:'}</strong>{' '}
          {isEs 
            ? 'Solicitar la eliminación de sus datos personales ("derecho al olvido").'
            : 'Request deletion of your personal data ("right to be forgotten").'}
        </li>
        <li>
          <strong>{isEs ? 'Restricción:' : 'Restriction:'}</strong>{' '}
          {isEs 
            ? 'Limitar cómo procesamos sus datos.'
            : 'Limit how we process your data.'}
        </li>
        <li>
          <strong>{isEs ? 'Portabilidad de datos:' : 'Data portability:'}</strong>{' '}
          {isEs 
            ? 'Recibir sus datos en un formato estructurado y de uso común.'
            : 'Receive your data in a structured, commonly used format.'}
        </li>
        <li>
          <strong>{isEs ? 'Objeción:' : 'Object:'}</strong>{' '}
          {isEs 
            ? 'Oponerse al procesamiento de sus datos personales.'
            : 'Object to the processing of your personal data.'}
        </li>
      </ul>

      <h2>{isEs ? 'Base Legal para el Procesamiento' : 'Legal Basis for Processing'}</h2>
      <p>
        {isEs 
          ? 'Procesamos datos personales basándonos en:'
          : 'We process personal data based on:'}
      </p>
      <ul>
        <li>{isEs ? 'Cumplimiento de contrato (proporcionar nuestros servicios)' : 'Contract performance (providing our services)'}</li>
        <li>{isEs ? 'Intereses legítimos (mejorar nuestros servicios)' : 'Legitimate interests (improving our services)'}</li>
        <li>{isEs ? 'Consentimiento (cuando corresponda)' : 'Consent (where applicable)'}</li>
        <li>{isEs ? 'Obligaciones legales' : 'Legal obligations'}</li>
      </ul>

      <h2>{isEs ? 'Transferencias de Datos' : 'Data Transfers'}</h2>
      <p>
        {isEs 
          ? 'Los datos se procesan en los Estados Unidos. Implementamos salvaguardas apropiadas para transferencias internacionales de datos, incluyendo cláusulas contractuales estándar cuando corresponda.'
          : 'Data is processed in the United States. We implement appropriate safeguards for international data transfers, including standard contractual clauses where applicable.'}
      </p>

      <h2>{isEs ? 'Retención de Datos' : 'Data Retention'}</h2>
      <p>
        {isEs 
          ? 'Retenemos datos personales solo durante el tiempo necesario para los fines para los que fueron recopilados, o según lo requiera la ley.'
          : 'We retain personal data only as long as necessary for the purposes for which it was collected, or as required by law.'}
      </p>

      <h2>{isEs ? 'Ejercer Sus Derechos' : 'Exercising Your Rights'}</h2>
      <p>
        {isEs 
          ? 'Para ejercer cualquiera de sus derechos GDPR, contáctenos en:'
          : 'To exercise any of your GDPR rights, contact us at:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
      <p>
        {isEs 
          ? 'Responderemos a su solicitud dentro de 30 días.'
          : 'We will respond to your request within 30 days.'}
      </p>
    </LegalLayout>
  );
};

export default GDPR;
