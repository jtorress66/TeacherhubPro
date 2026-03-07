import { CheckCircle } from 'lucide-react';

const FeaturesSummary = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const summaryItems = [
    isEs ? 'Planifica más rápido' : 'Plan faster',
    isEs ? 'Reduce el trabajo administrativo repetitivo' : 'Reduce repetitive admin work',
    isEs ? 'Mantente organizado en las tareas de enseñanza' : 'Stay organized across teaching tasks',
    isEs ? 'Crea mejores materiales de clase en menos tiempo' : 'Create better classroom materials in less time',
    isEs ? 'Usa IA de manera práctica, no solo como un truco' : 'Use AI practically, not just as a gimmick'
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-lime-50 to-emerald-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
          {isEs ? 'Lo que TeacherHubPro te ayuda a hacer' : 'What TeacherHubPro helps you do'}
        </h2>
        
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {summaryItems.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 bg-white rounded-xl p-4 border border-lime-200 shadow-sm"
            >
              <CheckCircle className="w-6 h-6 text-lime-500 flex-shrink-0" />
              <span className="font-medium text-slate-800">
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSummary;
