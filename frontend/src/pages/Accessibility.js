import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Check } from 'lucide-react';

const Accessibility = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const features = [
    {
      title: isEs ? 'Navegación por Teclado' : 'Keyboard Navigation',
      description: isEs 
        ? 'Todas las funciones principales son accesibles mediante el teclado.'
        : 'All main features are accessible via keyboard.'
    },
    {
      title: isEs ? 'Compatibilidad con Lectores de Pantalla' : 'Screen Reader Compatibility',
      description: isEs
        ? 'El sitio está optimizado para trabajar con tecnologías de asistencia.'
        : 'The site is optimized to work with assistive technologies.'
    },
    {
      title: isEs ? 'Contraste de Colores' : 'Color Contrast',
      description: isEs
        ? 'Mantenemos proporciones de contraste adecuadas para facilitar la lectura.'
        : 'We maintain adequate contrast ratios for easy reading.'
    },
    {
      title: isEs ? 'Texto Escalable' : 'Scalable Text',
      description: isEs
        ? 'El texto puede aumentarse hasta un 200% sin pérdida de funcionalidad.'
        : 'Text can be enlarged up to 200% without loss of functionality.'
    },
    {
      title: isEs ? 'Etiquetas Descriptivas' : 'Descriptive Labels',
      description: isEs
        ? 'Todos los formularios e imágenes tienen etiquetas descriptivas.'
        : 'All forms and images have descriptive labels.'
    },
    {
      title: isEs ? 'Soporte Bilingüe' : 'Bilingual Support',
      description: isEs
        ? 'La aplicación está disponible en español e inglés.'
        : 'The application is available in Spanish and English.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            {isEs ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-heading font-bold text-slate-800 mb-2">
          {isEs ? 'Declaración de Accesibilidad' : 'Accessibility Statement'}
        </h1>
        <p className="text-slate-500 mb-8">{isEs ? 'Última actualización: Febrero 2026' : 'Last updated: February 2026'}</p>

        <div className="prose prose-slate max-w-none mb-12">
          <h2>{isEs ? 'Nuestro Compromiso' : 'Our Commitment'}</h2>
          <p>
            {isEs 
              ? 'TeacherHubPro está comprometido a garantizar que nuestra plataforma sea accesible para todos los usuarios, incluyendo personas con discapacidades. Nos esforzamos continuamente por mejorar la experiencia del usuario y aplicar los estándares de accesibilidad relevantes.'
              : 'TeacherHubPro is committed to ensuring our platform is accessible to all users, including people with disabilities. We continually strive to improve the user experience and apply relevant accessibility standards.'}
          </p>

          <h2>{isEs ? 'Estándares de Conformidad' : 'Conformance Standards'}</h2>
          <p>
            {isEs
              ? 'Nos esforzamos por cumplir con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1 nivel AA. Estas pautas explican cómo hacer que el contenido web sea más accesible para personas con discapacidades.'
              : 'We strive to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible for people with disabilities.'}
          </p>
        </div>

        {/* Accessibility Features */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            {isEs ? 'Características de Accesibilidad' : 'Accessibility Features'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-green-100 rounded-full mt-0.5">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-800 mb-1">{feature.title}</h3>
                    <p className="text-sm text-slate-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="prose prose-slate max-w-none">
          <h2>{isEs ? 'Limitaciones Conocidas' : 'Known Limitations'}</h2>
          <p>
            {isEs
              ? 'Aunque nos esforzamos por garantizar la accesibilidad de TeacherHubPro, puede haber algunas limitaciones. Estamos trabajando activamente para mejorar estas áreas:'
              : 'While we strive to ensure accessibility of TeacherHubPro, there may be some limitations. We are actively working to improve these areas:'}
          </p>
          <ul>
            <li>{isEs ? 'Algunas gráficas pueden necesitar descripciones alternativas más detalladas' : 'Some charts may need more detailed alternative descriptions'}</li>
            <li>{isEs ? 'Los documentos PDF exportados pueden tener accesibilidad limitada' : 'Exported PDF documents may have limited accessibility'}</li>
          </ul>

          <h2>{isEs ? 'Retroalimentación' : 'Feedback'}</h2>
          <p>
            {isEs
              ? 'Agradecemos sus comentarios sobre la accesibilidad de TeacherHubPro. Si encuentra barreras de accesibilidad, por favor contáctenos:'
              : 'We welcome your feedback on the accessibility of TeacherHubPro. If you encounter accessibility barriers, please contact us:'}
          </p>
          <p>
            <strong>Email:</strong> accessibility@teacherhubpro.com<br />
            <strong>{isEs ? 'Teléfono' : 'Phone'}:</strong> +1 (787) 555-0123
          </p>
          <p>
            {isEs
              ? 'Intentamos responder a las solicitudes de retroalimentación de accesibilidad dentro de 5 días hábiles.'
              : 'We try to respond to accessibility feedback requests within 5 business days.'}
          </p>
        </div>
      </main>
    </div>
  );
};

export default Accessibility;
