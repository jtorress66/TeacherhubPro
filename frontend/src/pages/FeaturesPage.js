import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Calendar, BookOpen, ClipboardCheck, Users, FileText, 
  Sparkles, Brain, Gamepad2, Presentation, GraduationCap,
  BarChart3, Shield, Globe, Printer, Clock, CheckCircle2,
  ArrowRight, Star
} from 'lucide-react';

const FeaturesPage = () => {
  const { language } = useLanguage();
  const isSpanish = language === 'es';

  const features = [
    {
      icon: Calendar,
      title: isSpanish ? 'Planificador de Lecciones' : 'Lesson Planner',
      description: isSpanish 
        ? 'Crea planes semanales detallados con actividades, materiales y estándares. Exporta a PDF fácilmente.'
        : 'Create detailed weekly plans with activities, materials, and standards. Easy PDF export.',
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      icon: ClipboardCheck,
      title: isSpanish ? 'Control de Asistencia' : 'Attendance Tracking',
      description: isSpanish
        ? 'Registra asistencia diaria con un solo clic. Genera reportes automáticos y notifica a padres.'
        : 'Track daily attendance with a single click. Generate automatic reports and notify parents.',
      gradient: 'from-teal-500 to-cyan-600'
    },
    {
      icon: BookOpen,
      title: isSpanish ? 'Libro de Calificaciones' : 'Digital Gradebook',
      description: isSpanish
        ? 'Sistema completo de notas con cálculo automático de GPA, categorías de tareas y reportes.'
        : 'Complete grading system with automatic GPA calculation, assignment categories, and reports.',
      gradient: 'from-rose-500 to-pink-600'
    },
    {
      icon: Users,
      title: isSpanish ? 'Gestión de Clases' : 'Class Management',
      description: isSpanish
        ? 'Organiza clases, estudiantes y datos de contacto de padres en un solo lugar.'
        : 'Organize classes, students, and parent contact information in one place.',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: Sparkles,
      title: isSpanish ? 'Asistente IA' : 'AI Assistant',
      description: isSpanish
        ? 'Genera planes de lección, actividades y materiales con inteligencia artificial avanzada.'
        : 'Generate lesson plans, activities, and materials with advanced AI technology.',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      icon: Brain,
      title: isSpanish ? 'Aprendizaje Adaptativo' : 'Adaptive Learning',
      description: isSpanish
        ? 'Rutas de aprendizaje personalizadas que se adaptan al ritmo de cada estudiante.'
        : 'Personalized learning paths that adapt to each student\'s pace and progress.',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: Gamepad2,
      title: isSpanish ? 'Juegos Educativos' : 'Educational Games',
      description: isSpanish
        ? 'Crea juegos interactivos para reforzar el aprendizaje de manera divertida.'
        : 'Create interactive games to reinforce learning in a fun and engaging way.',
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      icon: Presentation,
      title: isSpanish ? 'Presentaciones' : 'Presentations',
      description: isSpanish
        ? 'Diseña presentaciones profesionales para tus clases con plantillas modernas.'
        : 'Design professional presentations for your classes with modern templates.',
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      icon: GraduationCap,
      title: isSpanish ? 'Boletas de Calificaciones' : 'Report Cards',
      description: isSpanish
        ? 'Genera boletas profesionales listas para imprimir con toda la información del estudiante.'
        : 'Generate professional report cards ready to print with all student information.',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      icon: FileText,
      title: isSpanish ? 'Paquete para Sustitutos' : 'Substitute Packet',
      description: isSpanish
        ? 'Crea paquetes completos para maestros sustitutos con toda la información necesaria.'
        : 'Create complete packets for substitute teachers with all necessary information.',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: BarChart3,
      title: isSpanish ? 'Reportes y Análisis' : 'Reports & Analytics',
      description: isSpanish
        ? 'Visualiza el progreso de tus estudiantes con gráficos y reportes detallados.'
        : 'Visualize student progress with detailed charts and comprehensive reports.',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: Globe,
      title: isSpanish ? 'Portal para Padres' : 'Parent Portal',
      description: isSpanish
        ? 'Los padres pueden ver calificaciones y asistencia de sus hijos en tiempo real.'
        : 'Parents can view their children\'s grades and attendance in real-time.',
      gradient: 'from-indigo-500 to-violet-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
                alt="TeacherHubPro Logo"
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-slate-800">TeacherHubPro</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/pricing" className="text-slate-600 hover:text-slate-900 hidden sm:block">
                {isSpanish ? 'Precios' : 'Pricing'}
              </Link>
              <Link to="/">
                <Button>{isSpanish ? 'Comenzar Gratis' : 'Start Free'}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-6">
            <Star className="h-4 w-4" />
            {isSpanish ? 'Todas las herramientas que necesitas' : 'All the tools you need'}
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
            {isSpanish ? 'Características Completas para ' : 'Complete Features for '}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {isSpanish ? 'Maestros Modernos' : 'Modern Teachers'}
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
            {isSpanish 
              ? 'TeacherHubPro combina planificación, calificaciones, asistencia e inteligencia artificial en una plataforma fácil de usar.'
              : 'TeacherHubPro combines planning, grading, attendance, and AI in one easy-to-use platform.'}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {isSpanish ? '¿Por qué elegir TeacherHubPro?' : 'Why Choose TeacherHubPro?'}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-emerald-100 mb-4">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{isSpanish ? 'Ahorra Tiempo' : 'Save Time'}</h3>
              <p className="text-slate-600">
                {isSpanish 
                  ? 'Automatiza tareas repetitivas y dedica más tiempo a enseñar.'
                  : 'Automate repetitive tasks and spend more time teaching.'}
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-blue-100 mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{isSpanish ? 'Seguro y Privado' : 'Secure & Private'}</h3>
              <p className="text-slate-600">
                {isSpanish 
                  ? 'Tus datos y los de tus estudiantes están protegidos con encriptación.'
                  : 'Your data and your students\' data are protected with encryption.'}
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex p-4 rounded-full bg-purple-100 mb-4">
                <Printer className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{isSpanish ? 'Imprime Fácilmente' : 'Easy Printing'}</h3>
              <p className="text-slate-600">
                {isSpanish 
                  ? 'Exporta cualquier documento a PDF listo para imprimir.'
                  : 'Export any document to print-ready PDF format.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {isSpanish ? '¿Listo para transformar tu aula?' : 'Ready to transform your classroom?'}
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            {isSpanish 
              ? 'Únete a miles de maestros que ya usan TeacherHubPro.'
              : 'Join thousands of teachers already using TeacherHubPro.'}
          </p>
          <Link to="/">
            <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
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
            <img 
              src="https://customer-assets.emergentagent.com/job_teachersuite/artifacts/swlef12w_ChatGPT%20Image%20Feb%2015%2C%202026%2C%2009_08_36%20PM.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold">TeacherHubPro</span>
          </div>
          <p className="text-slate-400 mb-6">
            {isSpanish ? 'Tu aula digital todo-en-uno' : 'Your all-in-one digital classroom'}
          </p>
          <div className="flex justify-center gap-6 text-sm text-slate-400">
            <Link to="/privacy-policy" className="hover:text-white">{isSpanish ? 'Privacidad' : 'Privacy'}</Link>
            <Link to="/terms-of-use" className="hover:text-white">{isSpanish ? 'Términos' : 'Terms'}</Link>
            <Link to="/contact" className="hover:text-white">{isSpanish ? 'Contacto' : 'Contact'}</Link>
          </div>
          <p className="text-slate-500 text-sm mt-6">© {new Date().getFullYear()} TeacherHubPro. {isSpanish ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
