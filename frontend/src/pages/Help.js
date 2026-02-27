import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, BookOpen, Calendar, ClipboardCheck, Users, HelpCircle, Mail } from 'lucide-react';

const Help = () => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  const helpTopics = [
    {
      icon: Calendar,
      title: isEs ? 'Planificador de Lecciones' : 'Lesson Planner',
      description: isEs 
        ? 'Aprende a crear, editar y exportar planes de lección semanales.'
        : 'Learn how to create, edit, and export weekly lesson plans.',
      items: isEs 
        ? ['Crear un nuevo plan', 'Usar plantillas', 'Exportar a PDF', 'Copiar semanas']
        : ['Create a new plan', 'Use templates', 'Export to PDF', 'Copy weeks']
    },
    {
      icon: ClipboardCheck,
      title: isEs ? 'Asistencia' : 'Attendance',
      description: isEs
        ? 'Gestiona la asistencia diaria de tus estudiantes.'
        : 'Manage daily attendance for your students.',
      items: isEs
        ? ['Tomar asistencia', 'Ver reportes', 'Enviar a padres', 'Exportar datos']
        : ['Take attendance', 'View reports', 'Send to parents', 'Export data']
    },
    {
      icon: BookOpen,
      title: isEs ? 'Libro de Calificaciones' : 'Gradebook',
      description: isEs
        ? 'Registra y calcula calificaciones de estudiantes.'
        : 'Record and calculate student grades.',
      items: isEs
        ? ['Crear tareas', 'Ingresar calificaciones', 'Ver promedios', 'Generar reportes']
        : ['Create assignments', 'Enter grades', 'View averages', 'Generate reports']
    },
    {
      icon: Users,
      title: isEs ? 'Gestión de Clases' : 'Class Management',
      description: isEs
        ? 'Administra tus clases y listas de estudiantes.'
        : 'Manage your classes and student rosters.',
      items: isEs
        ? ['Crear clases', 'Agregar estudiantes', 'Editar información', 'Notas de acomodaciones']
        : ['Create classes', 'Add students', 'Edit information', 'Accommodation notes']
    }
  ];

  const faqs = [
    {
      q: isEs ? '¿Cómo exporto un plan de lección a PDF?' : 'How do I export a lesson plan to PDF?',
      a: isEs 
        ? 'Abre el plan de lección que deseas exportar y haz clic en "Exportar PDF" en la esquina superior derecha.'
        : 'Open the lesson plan you want to export and click "Export PDF" in the top right corner.'
    },
    {
      q: isEs ? '¿Puedo compartir calificaciones con los padres?' : 'Can I share grades with parents?',
      a: isEs
        ? 'Sí, ve a Reportes de Notas y usa la opción "Enviar a Padres" para generar enlaces seguros que puedes compartir.'
        : 'Yes, go to Grade Reports and use the "Send to Parents" option to generate secure links you can share.'
    },
    {
      q: isEs ? '¿Cómo cambio el idioma de la aplicación?' : 'How do I change the app language?',
      a: isEs
        ? 'Haz clic en el botón del idioma (ES/EN) en la barra lateral o en la configuración de tu cuenta.'
        : 'Click the language button (ES/EN) in the sidebar or in your account settings.'
    },
    {
      q: isEs ? '¿Mis datos están seguros?' : 'Is my data secure?',
      a: isEs
        ? 'Sí, usamos encriptación de nivel bancario y nunca compartimos tus datos con terceros.'
        : 'Yes, we use bank-level encryption and never share your data with third parties.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold text-slate-900">TeacherHubPro</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" />
            {isEs ? 'Volver al inicio' : 'Back to home'}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-heading font-bold text-slate-800 mb-2">
          {isEs ? 'Centro de Ayuda' : 'Help Center'}
        </h1>
        <p className="text-slate-500 mb-8">
          {isEs ? 'Encuentra respuestas y aprende a usar TeacherHubPro' : 'Find answers and learn how to use TeacherHubPro'}
        </p>

        {/* Help Topics */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">
            {isEs ? 'Guías por Módulo' : 'Module Guides'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {helpTopics.map((topic, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <topic.icon className="h-5 w-5 text-slate-600" />
                    </div>
                    {topic.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-sm mb-3">{topic.description}</p>
                  <ul className="space-y-1">
                    {topic.items.map((item, i) => (
                      <li key={i} className="text-sm text-slate-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <h3 className="font-medium text-slate-800 mb-2">{faq.q}</h3>
                  <p className="text-slate-600 text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {isEs ? '¿Necesitas más ayuda?' : 'Need more help?'}
                  </h3>
                  <p className="text-slate-600 text-sm mb-2">
                    {isEs 
                      ? 'Nuestro equipo de soporte está listo para ayudarte.'
                      : 'Our support team is ready to help you.'}
                  </p>
                  <Link to="/contact" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    {isEs ? 'Contactar soporte →' : 'Contact support →'}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Help;
