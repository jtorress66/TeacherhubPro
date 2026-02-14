import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';

const CookiesPolicy = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

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
          {isEs ? 'Política de Cookies' : 'Cookies Policy'}
        </h1>
        <p className="text-slate-500 mb-8">{isEs ? 'Última actualización: Febrero 2026' : 'Last updated: February 2026'}</p>

        <div className="prose prose-slate max-w-none">
          <h2>{isEs ? '¿Qué son las Cookies?' : 'What are Cookies?'}</h2>
          <p>
            {isEs 
              ? 'Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestro sitio web. Nos ayudan a proporcionar una mejor experiencia de usuario.'
              : 'Cookies are small text files that are stored on your device when you visit our website. They help us provide a better user experience.'}
          </p>

          <h2>{isEs ? 'Tipos de Cookies que Usamos' : 'Types of Cookies We Use'}</h2>
          
          <h3>{isEs ? 'Cookies Esenciales' : 'Essential Cookies'}</h3>
          <p>
            {isEs
              ? 'Estas cookies son necesarias para el funcionamiento del sitio. Incluyen cookies de sesión que mantienen su inicio de sesión activo.'
              : 'These cookies are necessary for the site to function. They include session cookies that keep you logged in.'}
          </p>

          <h3>{isEs ? 'Cookies de Funcionalidad' : 'Functionality Cookies'}</h3>
          <p>
            {isEs
              ? 'Estas cookies recuerdan sus preferencias, como el idioma seleccionado y la configuración de visualización.'
              : 'These cookies remember your preferences, such as selected language and display settings.'}
          </p>

          <h3>{isEs ? 'Cookies de Análisis' : 'Analytics Cookies'}</h3>
          <p>
            {isEs
              ? 'Usamos estas cookies para entender cómo los usuarios interactúan con nuestro sitio, lo que nos ayuda a mejorarlo.'
              : 'We use these cookies to understand how users interact with our site, which helps us improve it.'}
          </p>

          <h2>{isEs ? 'Cookies que Utilizamos' : 'Cookies We Use'}</h2>
          <table className="w-full border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 text-left">{isEs ? 'Nombre' : 'Name'}</th>
                <th className="border border-slate-200 p-2 text-left">{isEs ? 'Propósito' : 'Purpose'}</th>
                <th className="border border-slate-200 p-2 text-left">{isEs ? 'Duración' : 'Duration'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 p-2">session_id</td>
                <td className="border border-slate-200 p-2">{isEs ? 'Mantener sesión activa' : 'Keep session active'}</td>
                <td className="border border-slate-200 p-2">{isEs ? 'Sesión' : 'Session'}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">language</td>
                <td className="border border-slate-200 p-2">{isEs ? 'Preferencia de idioma' : 'Language preference'}</td>
                <td className="border border-slate-200 p-2">1 {isEs ? 'año' : 'year'}</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">sm_credentials</td>
                <td className="border border-slate-200 p-2">{isEs ? 'Credenciales SM Aprendizaje' : 'SM Aprendizaje credentials'}</td>
                <td className="border border-slate-200 p-2">{isEs ? 'Persistente' : 'Persistent'}</td>
              </tr>
            </tbody>
          </table>

          <h2>{isEs ? 'Gestionar Cookies' : 'Managing Cookies'}</h2>
          <p>
            {isEs
              ? 'Puede controlar y eliminar cookies a través de la configuración de su navegador. Tenga en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad del sitio.'
              : 'You can control and delete cookies through your browser settings. Note that disabling certain cookies may affect site functionality.'}
          </p>

          <h2>{isEs ? 'Almacenamiento Local' : 'Local Storage'}</h2>
          <p>
            {isEs
              ? 'También utilizamos almacenamiento local del navegador para guardar preferencias y datos temporales. Esto funciona de manera similar a las cookies pero permite almacenar más información.'
              : 'We also use browser local storage to save preferences and temporary data. This works similarly to cookies but allows storing more information.'}
          </p>

          <h2>{isEs ? 'Contacto' : 'Contact'}</h2>
          <p>
            {isEs
              ? 'Si tiene preguntas sobre nuestra política de cookies, contáctenos en:'
              : 'If you have questions about our cookies policy, contact us at:'}
          </p>
          <p>
            <strong>Email:</strong> privacy@teacherhubpro.com
          </p>
        </div>
      </main>
    </div>
  );
};

export default CookiesPolicy;
