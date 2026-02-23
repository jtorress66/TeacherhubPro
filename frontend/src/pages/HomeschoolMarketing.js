import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Home, BookOpen, Brain, TrendingUp, Gamepad2, Calendar,
  Users, Heart, CheckCircle2, ArrowRight, Star, Shield,
  Clock, Target, Award, Sparkles
} from 'lucide-react';

const HomeschoolMarketing = () => {
  const { language } = useLanguage();
  const isSpanish = language === 'es';

  const features = [
    {
      icon: Brain,
      title: isSpanish ? 'Aprendizaje Adaptativo' : 'Adaptive Learning',
      description: isSpanish 
        ? 'Rutas de aprendizaje personalizadas que se ajustan automáticamente al ritmo y nivel de cada niño.'
        : 'Personalized learning paths that automatically adjust to each child\'s pace and level.'
    },
    {
      icon: TrendingUp,
      title: isSpanish ? 'Seguimiento de Progreso' : 'Progress Tracking',
      description: isSpanish
        ? 'Visualiza el avance de tu hijo con gráficos claros y reportes detallados de sus logros.'
        : 'Visualize your child\'s progress with clear charts and detailed achievement reports.'
    },
    {
      icon: Gamepad2,
      title: isSpanish ? 'Juegos Educativos' : 'Educational Games',
      description: isSpanish
        ? 'Refuerza el aprendizaje con juegos interactivos que hacen la educación divertida.'
        : 'Reinforce learning with interactive games that make education fun and engaging.'
    },
    {
      icon: Calendar,
      title: isSpanish ? 'Planificación Flexible' : 'Flexible Planning',
      description: isSpanish
        ? 'Crea horarios personalizados que se adaptan a la vida de tu familia.'
        : 'Create personalized schedules that adapt to your family\'s lifestyle.'
    },
    {
      icon: BookOpen,
      title: isSpanish ? 'Currículo Personalizable' : 'Customizable Curriculum',
      description: isSpanish
        ? 'Adapta el contenido educativo según tus preferencias y objetivos de aprendizaje.'
        : 'Adapt educational content according to your preferences and learning goals.'
    },
    {
      icon: Users,
      title: isSpanish ? 'Portal Familiar' : 'Family Portal',
      description: isSpanish
        ? 'Todos los miembros de la familia pueden seguir el progreso desde cualquier dispositivo.'
        : 'All family members can track progress from any device.'
    }
  ];

  const testimonials = [
    {
      quote: isSpanish 
        ? 'TeacherHubPro ha transformado nuestra experiencia de homeschool. Mis hijos aman los juegos educativos.'
        : 'TeacherHubPro has transformed our homeschool experience. My kids love the educational games.',
      author: isSpanish ? 'María G., madre de 3' : 'Sarah M., mother of 3'
    },
    {
      quote: isSpanish 
        ? 'El aprendizaje adaptativo es increíble. Cada hijo avanza a su propio ritmo sin frustraciones.'
        : 'The adaptive learning is amazing. Each child progresses at their own pace without frustration.',
      author: isSpanish ? 'Roberto L., padre homeschooler' : 'Michael R., homeschool dad'
    }
  ];

  const benefits = [
    { icon: Clock, text: isSpanish ? 'Ahorra tiempo en planificación' : 'Save time on planning' },
    { icon: Target, text: isSpanish ? 'Aprendizaje personalizado' : 'Personalized learning' },
    { icon: Award, text: isSpanish ? 'Seguimiento de logros' : 'Achievement tracking' },
    { icon: Heart, text: isSpanish ? 'Diseñado para familias' : 'Designed for families' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
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
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-6">
                <Home className="h-4 w-4" />
                {isSpanish ? 'Educación en Casa' : 'Homeschool Edition'}
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
                {isSpanish ? 'Homeschool ' : 'Homeschool '}
                <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  {isSpanish ? 'Simplificado' : 'Made Simple'}
                </span>
              </h1>
              <p className="text-lg text-slate-600 mb-8">
                {isSpanish 
                  ? 'TeacherHubPro te brinda todas las herramientas para educar a tus hijos en casa de manera efectiva y organizada. Aprendizaje adaptativo, seguimiento de progreso y mucho más.'
                  : 'TeacherHubPro gives you all the tools to effectively and organizedly educate your children at home. Adaptive learning, progress tracking, and much more.'}
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700">
                    <benefit.icon className="h-5 w-5 text-amber-600" />
                    <span className="text-sm">{benefit.text}</span>
                  </div>
                ))}
              </div>
              <Link to="/">
                <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  {isSpanish ? 'Prueba Gratuita de 30 Días' : '30-Day Free Trial'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-lg">
                    <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
                    <p className="font-semibold text-slate-800">{isSpanish ? 'Progreso' : 'Progress'}</p>
                    <p className="text-2xl font-bold text-green-600">87%</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg">
                    <Award className="h-8 w-8 text-amber-500 mb-2" />
                    <p className="font-semibold text-slate-800">{isSpanish ? 'Logros' : 'Achievements'}</p>
                    <p className="text-2xl font-bold text-amber-600">12</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-lg col-span-2">
                    <div className="flex items-center gap-3 mb-3">
                      <Brain className="h-6 w-6 text-purple-500" />
                      <span className="font-semibold text-slate-800">{isSpanish ? 'Nivel Adaptado' : 'Adapted Level'}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {isSpanish ? 'Diseñado para Familias Homeschool' : 'Designed for Homeschool Families'}
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              {isSpanish 
                ? 'Todas las herramientas que necesitas para una educación en casa exitosa.'
                : 'All the tools you need for successful home education.'}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Adaptive Learning Highlight */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 rounded-full text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                {isSpanish ? 'Potenciado por IA' : 'AI-Powered'}
              </div>
              <h2 className="text-3xl font-bold mb-4">
                {isSpanish ? 'Aprendizaje que se Adapta a Cada Niño' : 'Learning That Adapts to Each Child'}
              </h2>
              <p className="text-amber-100 mb-6">
                {isSpanish 
                  ? 'Nuestro sistema de aprendizaje adaptativo utiliza inteligencia artificial para ajustar automáticamente la dificultad y el contenido según el progreso de cada estudiante.'
                  : 'Our adaptive learning system uses artificial intelligence to automatically adjust difficulty and content based on each student\'s progress.'}
              </p>
              <ul className="space-y-3">
                {[
                  isSpanish ? 'Identifica fortalezas y áreas de mejora' : 'Identifies strengths and areas for improvement',
                  isSpanish ? 'Ajusta la velocidad de aprendizaje' : 'Adjusts learning pace automatically',
                  isSpanish ? 'Refuerza conceptos según necesidad' : 'Reinforces concepts as needed',
                  isSpanish ? 'Celebra logros y mantiene la motivación' : 'Celebrates achievements and maintains motivation'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-200" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{isSpanish ? 'Matemáticas' : 'Mathematics'}</span>
                  <span className="text-amber-200">{isSpanish ? 'Nivel 4' : 'Level 4'}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div className="bg-white h-3 rounded-full" style={{width: '80%'}}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{isSpanish ? 'Lectura' : 'Reading'}</span>
                  <span className="text-amber-200">{isSpanish ? 'Nivel 5' : 'Level 5'}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div className="bg-white h-3 rounded-full" style={{width: '92%'}}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{isSpanish ? 'Ciencias' : 'Science'}</span>
                  <span className="text-amber-200">{isSpanish ? 'Nivel 3' : 'Level 3'}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div className="bg-white h-3 rounded-full" style={{width: '65%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {isSpanish ? 'Lo que Dicen las Familias' : 'What Families Say'}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 italic mb-4">"{testimonial.quote}"</p>
                  <p className="text-slate-500 font-medium">— {testimonial.author}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex p-4 rounded-full bg-amber-100 mb-6">
            <Home className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            {isSpanish ? 'Comienza tu Aventura Homeschool' : 'Start Your Homeschool Adventure'}
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            {isSpanish 
              ? 'Prueba todas las características gratis por 30 días. Sin compromiso.'
              : 'Try all features free for 30 days. No commitment required.'}
          </p>
          <Link to="/">
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
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

export default HomeschoolMarketing;
