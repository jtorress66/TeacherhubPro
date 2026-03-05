import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Calendar, Plus, ChevronRight, FileDown, Copy } from 'lucide-react';

const API = `${window.location.origin}/api`;

const PlannerList = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, classesRes] = await Promise.all([
          axios.get(`${API}/plans`, { withCredentials: true }),
          axios.get(`${API}/classes`, { withCredentials: true })
        ]);
        setPlans(plansRes.data.filter(p => !p.is_template));
        setClasses(classesRes.data);
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getClassName = (classId) => {
    const cls = classes.find(c => c.class_id === classId);
    return cls ? `${cls.name} (${cls.grade}-${cls.section})` : 'Unknown';
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800">{t('planner')}</h1>
            <p className="text-slate-500">{language === 'es' ? 'Tus planes de lección' : 'Your lesson plans'}</p>
          </div>
          <Button onClick={() => navigate('/planner/new')} data-testid="new-plan-btn">
            <Plus className="h-4 w-4 mr-2" />
            {t('createPlan')}
          </Button>
        </div>

        {/* Plans Grid */}
        {plans.length === 0 ? (
          <Card className="bg-white border-slate-100">
            <CardContent className="py-20 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 text-lg mb-4">
                {language === 'es' ? 'No tienes planes de lección' : "You don't have any lesson plans"}
              </p>
              <Button onClick={() => navigate('/planner/new')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('createPlan')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map(plan => (
              <Card 
                key={plan.plan_id}
                className="bg-white border-slate-100 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/planner/${plan.plan_id}`)}
                data-testid={`plan-card-${plan.plan_id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-semibold text-slate-800">{plan.unit || 'Untitled'}</h3>
                      <p className="text-sm text-slate-500">{plan.story}</p>
                    </div>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {plan.week_start?.slice(5, 10)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                    {plan.objective || (language === 'es' ? 'Sin objetivo definido' : 'No objective defined')}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {getClassName(plan.class_id)}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PlannerList;
