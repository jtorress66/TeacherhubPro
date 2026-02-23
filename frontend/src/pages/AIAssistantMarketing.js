import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Sparkles, BookOpen, Brain, Lightbulb, Wand2, 
  FileText, MessageSquare, Clock, CheckCircle2,
  ArrowRight, Zap, Target, Rocket
} from 'lucide-react';

const AIAssistantMarketing = () => {
  const { language } = useLanguage();
  const isSpanish = language === 'es';

  const capabilities = [
    {
      icon: FileText,
      title: isSpanish ? 'Generación de Planes' : 'Lesson Plan Generation',
      description: isSpanish 
        ? 'Crea planes de lección completos en segundos basados en tus objetivos y estándares.'
        : 'Create complete lesson plans in seconds based on your objectives and standards.'
    },
    {
      icon: Lightbulb,
      title: isSpanish ? 'Ideas de Actividades' : 'Activity Ideas',
      description: isSpanish
        ? 'Obtén sugerencias creativas de actividades adaptadas al nivel y tema de tus estudiantes.'
        : 'Get creative activity suggestions tailored to your students\' level and topic.'
    },
    {
      icon: MessageSquare,
      title: isSpanish ? 'Materiales de Clase' : 'Class Materials',
      description: isSpanish
        ? 'Genera hojas de trabajo, evaluaciones y recursos educativos personalizados.'
        : 'Generate worksheets, assessments, and personalized educational resources.'
    },
    {
      icon: Target,
      title: isSpanish ? 'Diferenciación' : 'Differentiation',
      description: isSpanish
        ? 'Adapta el contenido automáticamente para diferentes niveles de aprendizaje.'
        : 'Automatically adapt content for different learning levels and abilities.'
    },
    {
      icon: Brain,
      title: isSpanish ? 'Preguntas de Comprensión' : 'Comprehension Questions',
      description: isSpanish
        ? 'Genera preguntas de todos los niveles cognitivos según la taxonomía de Bloom.'
        : 'Generate questions at all cognitive levels according to Bloom\'s taxonomy.'
    },
    {
      icon: Wand2,
      title: isSpanish ? 'Mejora de Contenido' : 'Content Enhancement',
      description: isSpanish
        ? 'Mejora y enriquece tu contenido existente con sugerencias inteligentes.'
        : 'Improve and enrich your existing content with intelligent suggestions.'
    }
  ];

  const useCases = [
    {
      title: isSpanish ? 'Planificación Semanal' : 'Weekly Planning',
      description: isSpanish
        ? 'Genera un plan semanal completo en minutos, no horas.'
        : 'Generate a complete weekly plan in minutes, not hours.',
      time: isSpanish ? '5 min vs 2 horas' : '5 min vs 2 hours'
    },
    {
      title: isSpanish ? 'Creación de Exámenes' : 'Test Creation',
      description: isSpanish
        ? 'Crea evaluaciones balanceadas con diferentes tipos de preguntas.'
        : 'Create balanced assessments with different question types.',
      time: isSpanish ? '3 min vs 45 min' : '3 min vs 45 min'
    },
    {
      title: isSpanish ? 'Hojas de Trabajo' : 'Worksheet Design',
      description: isSpanish
        ? 'Diseña hojas de práctica personalizadas para cada tema.'
        : 'Design personalized practice sheets for every topic.',
      time: isSpanish ? '2 min vs 30 min' : '2 min vs 30 min'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
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
                <Button>{isSpanish ? 'Probar Gratis' : 'Try Free'}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {isSpanish ? 'Potenciado por IA' : 'AI-Powered'}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
                {isSpanish ? 'Tu Asistente de ' : 'Your '}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {isSpanish ? 'Enseñanza con IA' : 'AI Teaching Assistant'}
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                {isSpanish 
                  ? 'Deja que la inteligencia artificial te ayude a crear planes de lección, actividades y materiales en segundos. Más tiempo para enseñar, menos tiempo planificando.'
                  : 'Let artificial intelligence help you create lesson plans, activities, and materials in seconds. More time teaching, less time planning.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full sm:w-auto">
                    {isSpanish ? 'Comenzar Ahora' : 'Get Started Now'}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl p-8 shadow-xl">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                    </div>
                    <span className="font-semibold text-slate-800">{isSpanish ? 'Asistente IA' : 'AI Assistant'}</span>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-slate-100 rounded-lg p-3 text-sm text-slate-600">
                      {isSpanish ? '"Crea un plan de lección sobre fracciones para 4to grado"' : '"Create a lesson plan about fractions for 4th grade"'}
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-sm text-purple-700 border border-purple-200">
                      <p className="font-medium mb-2">{isSpanish ? 'Plan generado:' : 'Generated plan:'}</p>
                      <ul className="space-y-1 text-xs">
                        <li>✓ {isSpanish ? 'Objetivo: Comprender fracciones...' : 'Objective: Understand fractions...'}</li>
                        <li>✓ {isSpanish ? 'Actividad 1: Manipulativos...' : 'Activity 1: Manipulatives...'}</li>
                        <li>✓ {isSpanish ? 'Materiales: Círculos de fracciones...' : 'Materials: Fraction circles...'}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {isSpanish ? '¿Qué puede hacer el Asistente IA?' : 'What Can the AI Assistant Do?'}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isSpanish 
                ? 'Potenciado por la última tecnología de inteligencia artificial para ayudarte en cada aspecto de la enseñanza.'
                : 'Powered by the latest AI technology to help you with every aspect of teaching.'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, idx) => (
              <Card key={idx} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                    <cap.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{cap.title}</h3>
                  <p className="text-slate-600 text-sm">{cap.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Time Savings */}
      <section className="py-16 px-4 bg-gradient-to-br from-purple-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {isSpanish ? 'Ahorra Horas Cada Semana' : 'Save Hours Every Week'}
            </h2>
            <p className="text-purple-200 max-w-2xl mx-auto">
              {isSpanish 
                ? 'Compara el tiempo que gastas vs lo que puedes lograr con IA'
                : 'Compare the time you spend vs what you can achieve with AI'}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {useCases.map((useCase, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-purple-300" />
                  <span className="text-purple-300 text-sm font-medium">{useCase.time}</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">{useCase.title}</h3>
                <p className="text-purple-200 text-sm">{useCase.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-lg font-semibold">
                {isSpanish ? 'Promedio de ahorro: 5+ horas por semana' : 'Average savings: 5+ hours per week'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-full bg-purple-100 mb-6">
            <Rocket className="h-8 w-8 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {isSpanish ? 'Empieza a usar IA hoy mismo' : 'Start using AI today'}
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            {isSpanish 
              ? 'Incluido en todos los planes de TeacherHubPro sin costo adicional.'
              : 'Included in all TeacherHubPro plans at no extra cost.'}
          </p>
          <Link to="/">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
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

export default AIAssistantMarketing;
