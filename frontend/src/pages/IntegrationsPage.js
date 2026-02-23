import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  BookOpen, Link2, Share2, Download, Upload, Calendar,
  FileText, Mail, CreditCard, Shield, CheckCircle2,
  ArrowRight, Zap, Globe, Smartphone
} from 'lucide-react';

const IntegrationsPage = () => {
  const { language } = useLanguage();
  const isSpanish = language === 'es';

  const integrations = [
    {
      name: 'Google Classroom',
      description: isSpanish 
        ? 'Comparte juegos y actividades directamente con tus estudiantes en Google Classroom.'
        : 'Share games and activities directly with your students on Google Classroom.',
      icon: '📚',
      status: isSpanish ? 'Disponible' : 'Available',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      name: 'PDF Export',
      description: isSpanish 
        ? 'Exporta planes de lección, boletas y reportes a PDF de alta calidad.'
        : 'Export lesson plans, report cards, and reports to high-quality PDF.',
      icon: '📄',
      status: isSpanish ? 'Disponible' : 'Available',
      color: 'bg-red-100 text-red-700'
    },
    {
      name: isSpanish ? 'Calendario' : 'Calendar',
      description: isSpanish 
        ? 'Sincroniza tus planes con Google Calendar, Apple Calendar u Outlook.'
        : 'Sync your plans with Google Calendar, Apple Calendar, or Outlook.',
      icon: '📅',
      status: isSpanish ? 'Disponible' : 'Available',
      color: 'bg-green-100 text-green-700'
    },
    {
      name: isSpanish ? 'Notificaciones por Email' : 'Email Notifications',
      description: isSpanish 
        ? 'Envía reportes y notificaciones automáticas a padres por correo electrónico.'
        : 'Send automatic reports and notifications to parents via email.',
      icon: '📧',
      status: isSpanish ? 'Disponible' : 'Available',
      color: 'bg-purple-100 text-purple-700'
    },
    {
      name: 'Stripe',
      description: isSpanish 
        ? 'Procesamiento de pagos seguro para suscripciones y gestión de escuelas.'
        : 'Secure payment processing for subscriptions and school management.',
      icon: '💳',
      status: isSpanish ? 'Disponible' : 'Available',
      color: 'bg-indigo-100 text-indigo-700'
    },
    {
      name: isSpanish ? 'Importación CSV' : 'CSV Import',
      description: isSpanish 
        ? 'Importa listas de estudiantes y datos desde archivos CSV o Excel.'
        : 'Import student lists and data from CSV or Excel files.',
      icon: '📊',
      status: isSpanish ? 'Disponible' : 'Available',
      color: 'bg-emerald-100 text-emerald-700'
    }
  ];

  const upcomingIntegrations = [
    {
      name: 'Microsoft Teams',
      description: isSpanish 
        ? 'Integración completa con Microsoft Teams for Education.'
        : 'Full integration with Microsoft Teams for Education.',
      icon: '💼'
    },
    {
      name: 'Canvas LMS',
      description: isSpanish 
        ? 'Sincroniza calificaciones y asignaciones con Canvas.'
        : 'Sync grades and assignments with Canvas.',
      icon: '🎓'
    },
    {
      name: 'Schoology',
      description: isSpanish 
        ? 'Conecta tu aula con el ecosistema de Schoology.'
        : 'Connect your classroom with the Schoology ecosystem.',
      icon: '🏫'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: isSpanish ? 'Ahorra Tiempo' : 'Save Time',
      description: isSpanish 
        ? 'Automatiza tareas repetitivas con integraciones inteligentes.'
        : 'Automate repetitive tasks with smart integrations.'
    },
    {
      icon: Link2,
      title: isSpanish ? 'Conecta Todo' : 'Connect Everything',
      description: isSpanish 
        ? 'Un solo lugar para todas tus herramientas educativas.'
        : 'One place for all your educational tools.'
    },
    {
      icon: Shield,
      title: isSpanish ? 'Seguro y Privado' : 'Secure & Private',
      description: isSpanish 
        ? 'Todas las integraciones siguen estrictos estándares de privacidad.'
        : 'All integrations follow strict privacy standards.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">TeacherHubPro</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/features" className="text-slate-600 hover:text-slate-900 hidden sm:block">
                {isSpanish ? 'Características' : 'Features'}
              </Link>
              <Link to="/">
                <Button>{isSpanish ? 'Comenzar' : 'Get Started'}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-6">
            <Link2 className="h-4 w-4" />
            {isSpanish ? 'Integraciones' : 'Integrations'}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            {isSpanish ? 'Conecta con tus ' : 'Connect with Your '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {isSpanish ? 'Herramientas Favoritas' : 'Favorite Tools'}
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
            {isSpanish 
              ? 'TeacherHubPro se integra con las plataformas educativas más populares para que puedas trabajar de manera más eficiente.'
              : 'TeacherHubPro integrates with the most popular educational platforms so you can work more efficiently.'}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex p-4 rounded-full bg-indigo-100 mb-4">
                  <benefit.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-slate-800">{benefit.title}</h3>
                <p className="text-slate-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Available Integrations */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {isSpanish ? 'Integraciones Disponibles' : 'Available Integrations'}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isSpanish 
                ? 'Todas estas integraciones están listas para usar hoy mismo.'
                : 'All these integrations are ready to use today.'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, idx) => (
              <Card key={idx} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-4xl">{integration.icon}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${integration.color}`}>
                      {integration.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{integration.name}</h3>
                  <p className="text-slate-600 text-sm">{integration.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Google Classroom Highlight */}
      <section className="py-16 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                {isSpanish ? 'Compartir con Google Classroom' : 'Share to Google Classroom'}
              </h2>
              <p className="text-blue-100 mb-6">
                {isSpanish 
                  ? 'Comparte juegos educativos y actividades directamente con tus estudiantes. Sin necesidad de configuración complicada - simplemente haz clic y comparte.'
                  : 'Share educational games and activities directly with your students. No complicated setup needed - just click and share.'}
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  isSpanish ? 'Un clic para compartir' : 'One-click sharing',
                  isSpanish ? 'Compatible con cualquier escuela' : 'Works with any school',
                  isSpanish ? 'Sin problemas de firewall' : 'No firewall issues',
                  isSpanish ? 'Los estudiantes acceden fácilmente' : 'Students access easily'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📚</span>
                  <div>
                    <p className="font-semibold text-slate-800">Google Classroom</p>
                    <p className="text-sm text-slate-500">{isSpanish ? 'Compartir juego' : 'Share game'}</p>
                  </div>
                </div>
                <div className="bg-slate-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-600 font-medium">{isSpanish ? 'Juego: Trivia de Matemáticas' : 'Game: Math Trivia'}</p>
                  <p className="text-xs text-slate-500">https://teacherhubpro.com/play-game/...</p>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Share2 className="h-4 w-4 mr-2" />
                  {isSpanish ? 'Compartir con Clase' : 'Share to Class'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Integrations */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {isSpanish ? 'Próximamente' : 'Coming Soon'}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isSpanish 
                ? 'Estamos trabajando en más integraciones para mejorar tu experiencia.'
                : 'We\'re working on more integrations to improve your experience.'}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {upcomingIntegrations.map((integration, idx) => (
              <Card key={idx} className="border-slate-200 border-dashed">
                <CardContent className="p-6 text-center">
                  <span className="text-4xl block mb-4">{integration.icon}</span>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{integration.name}</h3>
                  <p className="text-slate-500 text-sm">{integration.description}</p>
                  <span className="inline-block mt-4 text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-full">
                    {isSpanish ? 'En desarrollo' : 'In development'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <Globe className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {isSpanish ? '¿Necesitas una integración personalizada?' : 'Need a Custom Integration?'}
          </h2>
          <p className="text-slate-600 mb-8">
            {isSpanish 
              ? 'Contáctanos para discutir integraciones personalizadas para tu escuela o distrito.'
              : 'Contact us to discuss custom integrations for your school or district.'}
          </p>
          <Link to="/contact">
            <Button variant="outline" size="lg">
              {isSpanish ? 'Contactar Equipo' : 'Contact Team'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {isSpanish ? 'Comienza a Conectar Hoy' : 'Start Connecting Today'}
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            {isSpanish 
              ? 'Todas las integraciones incluidas en tu suscripción de TeacherHubPro.'
              : 'All integrations included in your TeacherHubPro subscription.'}
          </p>
          <Link to="/">
            <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
              {isSpanish ? 'Comenzar Prueba Gratuita' : 'Start Free Trial'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">TeacherHubPro</span>
          </div>
          <p className="text-slate-400 mb-6">
            {isSpanish ? 'Tu aula digital todo-en-uno' : 'Your all-in-one digital classroom'}
          </p>
          <div className="flex justify-center gap-6 text-sm text-slate-400">
            <Link to="/features" className="hover:text-white">{isSpanish ? 'Características' : 'Features'}</Link>
            <Link to="/privacy-policy" className="hover:text-white">{isSpanish ? 'Privacidad' : 'Privacy'}</Link>
            <Link to="/contact" className="hover:text-white">{isSpanish ? 'Contacto' : 'Contact'}</Link>
          </div>
          <p className="text-slate-500 text-sm mt-6">© {new Date().getFullYear()} TeacherHubPro</p>
        </div>
      </footer>
    </div>
  );
};

export default IntegrationsPage;
