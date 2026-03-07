import { GraduationCap, Home, Users, Building } from 'lucide-react';

const UseCasesSection = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const useCases = [
    {
      icon: GraduationCap,
      title: isEs ? 'Profesores de Aula' : 'Classroom Teachers',
      description: isEs 
        ? 'Gestiona planificación, calificaciones y organización diaria del aula en un solo lugar.'
        : 'Manage planning, grading, and daily classroom organization in one place.',
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      icon: Home,
      title: isEs ? 'Educadores en Casa' : 'Homeschool Educators',
      description: isEs 
        ? 'Crea flujos de trabajo flexibles para lecciones y mantén los planes de aprendizaje organizados.'
        : 'Create flexible lesson workflows and keep learning plans organized.',
      gradient: 'from-teal-500 to-cyan-600'
    },
    {
      icon: Users,
      title: isEs ? 'Tutores y Programas Pequeños' : 'Tutors and Small Learning Programs',
      description: isEs 
        ? 'Registra el trabajo de los estudiantes, planifica sesiones y crea recursos eficientemente.'
        : 'Track student work, plan sessions, and create resources efficiently.',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: Building,
      title: isEs ? 'Escuelas y Equipos' : 'Schools and Teams',
      description: isEs 
        ? 'Apoya a los educadores con una plataforma que mejora la consistencia y ahorra tiempo.'
        : 'Support educators with a platform that improves consistency and saves time.',
      gradient: 'from-blue-500 to-indigo-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {isEs ? 'Hecho para diferentes entornos de enseñanza' : 'Made for different teaching environments'}
          </h2>
        </div>

        {/* Use Cases Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <div 
              key={index}
              className="group relative bg-white rounded-2xl border border-slate-200 p-8 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 text-center"
            >
              <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <useCase.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                {useCase.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                {useCase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
