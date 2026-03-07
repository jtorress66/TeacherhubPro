import { Sparkles, DollarSign, Users } from 'lucide-react';

const PricingValueBar = ({ language = 'en' }) => {
  const isEs = language === 'es';

  const items = [
    {
      icon: Sparkles,
      text: isEs ? 'IA incluida en cada plan' : 'AI included in every plan'
    },
    {
      icon: DollarSign,
      text: isEs ? 'Sin tarifas ocultas de plataforma' : 'No hidden platform fees'
    },
    {
      icon: Users,
      text: isEs ? 'Para educadores individuales y equipos' : 'Designed for individual educators and growing education teams'
    }
  ];

  return (
    <div className="bg-slate-100 py-6 rounded-2xl">
      <div className="flex flex-wrap justify-center gap-8 md:gap-16">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-lime-100 flex items-center justify-center">
              <item.icon className="w-5 h-5 text-lime-600" />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingValueBar;
