import { Shield, Sparkles, Lock, Users } from 'lucide-react';

const TrustBar = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const trustItems = [
    {
      icon: Users,
      text: isEs ? 'Diseñado para educadores modernos' : 'Built for modern educators'
    },
    {
      icon: Sparkles,
      text: isEs ? 'IA incluida en cada plan' : 'AI included in every plan'
    },
    {
      icon: Lock,
      text: isEs ? 'Seguro y fácil de usar' : 'Secure and easy to use'
    },
    {
      icon: Shield,
      text: isEs ? 'Reduce la carga administrativa' : 'Designed to reduce planning and admin workload'
    }
  ];

  return (
    <section className="bg-slate-900 py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {trustItems.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center md:justify-start gap-3 text-center md:text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-lime-500/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-lime-400" />
              </div>
              <span className="text-sm text-slate-300 font-medium leading-tight">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBar;
