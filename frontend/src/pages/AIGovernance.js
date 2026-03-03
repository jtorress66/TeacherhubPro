import LegalLayout from '../components/LegalLayout';
import { useLanguage } from '../contexts/LanguageContext';

const AIGovernance = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  return (
    <LegalLayout 
      title={isEs ? 'Gobernanza de IA Responsable' : 'Responsible AI Governance'}
      subtitle={isEs ? 'Nuestro enfoque para el uso ético de la IA' : 'Our approach to ethical AI use'}
      icon="ai"
    >
      <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
        <p className="text-violet-800 font-medium text-lg">
          {isEs 
            ? 'La IA es Asistiva - Los educadores mantienen supervisión completa.'
            : 'AI is Assistive - Educators maintain full oversight.'}
        </p>
      </div>

      <h2>{isEs ? 'Principios de IA' : 'AI Principles'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Humano en el bucle:' : 'Human-in-the-loop:'}</strong>{' '}
          {isEs 
            ? 'Las herramientas de IA asisten a los educadores pero no los reemplazan. Los maestros siempre revisan y aprueban el contenido generado por IA.'
            : 'AI tools assist educators but do not replace them. Teachers always review and approve AI-generated content.'}
        </li>
        <li>
          <strong>{isEs ? 'Transparencia:' : 'Transparency:'}</strong>{' '}
          {isEs 
            ? 'Indicamos claramente cuándo el contenido es generado por IA.'
            : 'We clearly indicate when content is AI-generated.'}
        </li>
        <li>
          <strong>{isEs ? 'Solo fines educativos:' : 'Educational purposes only:'}</strong>{' '}
          {isEs 
            ? 'La IA se utiliza únicamente para apoyar los resultados de enseñanza y aprendizaje.'
            : 'AI is used solely to support teaching and learning outcomes.'}
        </li>
      </ul>

      <h2>{isEs ? 'Mitigación de Sesgos' : 'Bias Mitigation'}</h2>
      <p>
        {isEs 
          ? 'Tomamos medidas para minimizar el sesgo en los resultados de IA:'
          : 'We take steps to minimize bias in AI outputs:'}
      </p>
      <ul>
        <li>
          <strong>{isEs ? 'Proveedores de IA reputados:' : 'Reputable AI providers:'}</strong>{' '}
          {isEs 
            ? 'Utilizamos proveedores de IA establecidos con prácticas sólidas de IA responsable.'
            : 'We use established AI providers with strong responsible AI practices.'}
        </li>
        <li>
          <strong>{isEs ? 'Salvaguardas de contenido:' : 'Content safeguards:'}</strong>{' '}
          {isEs 
            ? 'Implementamos filtros para prevenir contenido inapropiado.'
            : 'We implement filters to prevent inappropriate content.'}
        </li>
        <li>
          <strong>{isEs ? 'Mecanismos de retroalimentación del usuario:' : 'User feedback mechanisms:'}</strong>{' '}
          {isEs 
            ? 'Los educadores pueden reportar resultados problemáticos de IA.'
            : 'Educators can report problematic AI outputs.'}
        </li>
      </ul>

      <h2>{isEs ? 'Uso de Datos en IA' : 'Data Use in AI'}</h2>
      <ul>
        <li>
          <strong>{isEs ? 'Sin venta de datos de estudiantes:' : 'No student data sales:'}</strong>{' '}
          {isEs 
            ? 'Los datos de estudiantes nunca se venden a proveedores de IA ni a terceros.'
            : 'Student data is never sold to AI providers or third parties.'}
        </li>
        <li>
          <strong>{isEs ? 'Procesamiento de IA seguro:' : 'Secure AI processing:'}</strong>{' '}
          {isEs 
            ? 'Las solicitudes de IA se procesan de forma segura sin almacenamiento de datos persistente.'
            : 'AI requests are processed securely without persistent data storage.'}
        </li>
        <li>
          <strong>{isEs ? 'Recopilación mínima de datos:' : 'Minimal data collection:'}</strong>{' '}
          {isEs 
            ? 'Solo se comparte con los servicios de IA la información necesaria para generar resultados.'
            : 'Only information necessary to generate outputs is shared with AI services.'}
        </li>
      </ul>

      <h2>{isEs ? 'Funciones de IA en TeacherHubPro' : 'AI Features in TeacherHubPro'}</h2>
      <p>
        {isEs 
          ? 'Nuestra IA asiste a los educadores con:'
          : 'Our AI assists educators with:'}
      </p>
      <ul>
        <li>{isEs ? 'Generación de planes de lecciones' : 'Lesson plan generation'}</li>
        <li>{isEs ? 'Creación de materiales educativos' : 'Educational materials creation'}</li>
        <li>{isEs ? 'Generación de preguntas de evaluación' : 'Assessment question generation'}</li>
        <li>{isEs ? 'Sugerencias de aprendizaje adaptativo' : 'Adaptive learning suggestions'}</li>
      </ul>
      <p>
        {isEs 
          ? 'Todos los resultados de IA deben ser revisados por los educadores antes de su uso en el aula.'
          : 'All AI outputs should be reviewed by educators before classroom use.'}
      </p>

      <h2>{isEs ? 'Mejora Continua' : 'Continuous Improvement'}</h2>
      <p>
        {isEs 
          ? 'Estamos comprometidos con mejorar continuamente nuestras prácticas de IA a través de:'
          : 'We are committed to continuously improving our AI practices through:'}
      </p>
      <ul>
        <li>{isEs ? 'Revisión regular de resultados de IA' : 'Regular review of AI outputs'}</li>
        <li>{isEs ? 'Incorporación de retroalimentación de educadores' : 'Incorporation of educator feedback'}</li>
        <li>{isEs ? 'Estar al día con las mejores prácticas de IA' : 'Staying current with AI best practices'}</li>
        <li>{isEs ? 'Actualización de políticas según evoluciona la tecnología' : 'Updating policies as technology evolves'}</li>
      </ul>

      <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
      <p>
        {isEs 
          ? 'Para preguntas o inquietudes sobre nuestro uso de IA:'
          : 'For questions or concerns about our AI use:'}
      </p>
      <p>
        <a href="mailto:support@teacherhubpro.com" className="text-primary hover:underline">
          support@teacherhubpro.com
        </a>
      </p>
    </LegalLayout>
  );
};

export default AIGovernance;
