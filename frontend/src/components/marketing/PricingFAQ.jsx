import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const PricingFAQ = ({ language = 'en' }) => {
  const isEs = language === 'es';
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: isEs ? '¿Qué incluye cada plan?' : 'What is included in each plan?',
      answer: isEs 
        ? 'Cada plan incluye acceso a las herramientas principales de TeacherHubPro, incluyendo planificación de lecciones, funciones de organización del aula y soporte impulsado por IA.'
        : "Each plan includes access to TeacherHubPro's core teaching tools, including lesson planning, classroom organization features, and AI-powered support."
    },
    {
      question: isEs ? '¿Está incluida la IA?' : 'Is AI included?',
      answer: isEs 
        ? 'Sí. TeacherHubPro incluye funcionalidad de IA en la plataforma sin requerir compras separadas de IA para uso estándar.'
        : 'Yes. TeacherHubPro includes AI functionality in the platform without requiring separate AI purchases for standard usage.'
    },
    {
      question: isEs ? '¿Puedo cambiar de plan después?' : 'Can I switch plans later?',
      answer: isEs 
        ? 'Sí. Puedes actualizar o cambiar tu plan a medida que crecen tus necesidades.'
        : 'Yes. You can upgrade or change your plan as your needs grow.'
    },
    {
      question: isEs ? '¿Hay un plan para escuelas?' : 'Is there a plan for schools?',
      answer: isEs 
        ? 'Sí. TeacherHubPro ofrece opciones para escuelas y equipos educativos que necesitan acceso más amplio y soporte.'
        : 'Yes. TeacherHubPro offers options for schools and education teams that need broader access and support.'
    },
    {
      question: isEs ? '¿Pueden los educadores en casa usar TeacherHubPro?' : 'Can homeschool educators use TeacherHubPro?',
      answer: isEs 
        ? 'Sí. La plataforma funciona muy bien para planificación de educación en casa y organización educativa también.'
        : 'Yes. The platform works well for homeschool planning and educational organization too.'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10">
          {isEs ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-100 transition-colors"
              >
                <span className="font-semibold text-slate-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-500 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-48' : 'max-h-0'
                }`}
              >
                <p className="px-5 pb-5 text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingFAQ;
