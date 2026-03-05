import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { FileText, Plus, Copy, Trash2, Calendar, BookOpen } from 'lucide-react';

const API = `${window.location.origin}/api`;

const Templates = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedPlanForTemplate, setSelectedPlanForTemplate] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [recentPlans, setRecentPlans] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [templatesRes, classesRes, plansRes] = await Promise.all([
          axios.get(`${API}/templates`, { withCredentials: true }),
          axios.get(`${API}/classes`, { withCredentials: true }),
          axios.get(`${API}/plans?is_template=false`, { withCredentials: true })
        ]);
        setTemplates(templatesRes.data);
        setClasses(classesRes.data);
        setRecentPlans(plansRes.data.slice(0, 10));
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const getClassName = (classId) => {
    const cls = classes.find(c => c.class_id === classId);
    return cls ? `${cls.name} (${cls.grade}-${cls.section})` : '';
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error(language === 'es' ? 'Ingresa un nombre para la plantilla' : 'Enter a template name');
      return;
    }

    try {
      // Get the full plan data
      const planRes = await axios.get(`${API}/plans/${selectedPlanForTemplate.plan_id}`, { withCredentials: true });
      const planData = planRes.data;

      // Create template from plan
      const templateData = {
        ...planData,
        is_template: true,
        template_name: templateName,
        week_start: '',
        week_end: ''
      };
      delete templateData.plan_id;

      await axios.post(`${API}/plans`, templateData, { withCredentials: true });
      
      // Refresh templates
      const templatesRes = await axios.get(`${API}/templates`, { withCredentials: true });
      setTemplates(templatesRes.data);
      
      setShowSaveDialog(false);
      setTemplateName('');
      setSelectedPlanForTemplate(null);
      toast.success(language === 'es' ? 'Plantilla guardada' : 'Template saved');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(t('error'));
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      // Duplicate template as new plan
      const res = await axios.post(`${API}/plans/${template.plan_id}/duplicate`, {
        week_start: new Date().toISOString().split('T')[0]
      }, { withCredentials: true });
      
      toast.success(language === 'es' ? 'Plan creado desde plantilla' : 'Plan created from template');
      navigate(`/planner/${res.data.plan_id}`);
    } catch (error) {
      console.error('Error using template:', error);
      toast.error(t('error'));
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    try {
      await axios.delete(`${API}/plans/${templateId}`, { withCredentials: true });
      setTemplates(prev => prev.filter(t => t.plan_id !== templateId));
      toast.success(language === 'es' ? 'Plantilla eliminada' : 'Template deleted');
    } catch (error) {
      toast.error(t('error'));
    }
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
            <h1 className="text-3xl font-heading font-bold text-slate-800">
              {language === 'es' ? 'Galería de Plantillas' : 'Template Gallery'}
            </h1>
            <p className="text-slate-500">
              {language === 'es' ? 'Reutiliza tus planes de lección' : 'Reuse your lesson plans'}
            </p>
          </div>
        </div>

        {/* Save from existing plan section */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {language === 'es' ? 'Crear Plantilla desde Plan Existente' : 'Create Template from Existing Plan'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Selecciona un plan reciente para convertirlo en plantilla reutilizable' 
                : 'Select a recent plan to convert into a reusable template'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPlans.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>{language === 'es' ? 'No hay planes recientes' : 'No recent plans'}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate('/planner/new')}
                >
                  {t('createPlan')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentPlans.map(plan => (
                  <div 
                    key={plan.plan_id}
                    className="p-4 rounded-lg border border-slate-200 hover:border-slate-400 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedPlanForTemplate(plan);
                      setTemplateName(plan.unit || plan.story || '');
                      setShowSaveDialog(true);
                    }}
                    data-testid={`plan-to-template-${plan.plan_id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{plan.unit || 'Untitled'}</p>
                        <p className="text-sm text-slate-500">{plan.story}</p>
                        <p className="text-xs text-slate-400 mt-1">{getClassName(plan.class_id)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {plan.week_start?.slice(5, 10)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div>
          <h2 className="text-xl font-heading font-semibold text-slate-800 mb-4">
            {language === 'es' ? 'Mis Plantillas' : 'My Templates'} ({templates.length})
          </h2>
          
          {templates.length === 0 ? (
            <Card className="bg-white border-slate-100">
              <CardContent className="py-16 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <p className="text-slate-500 text-lg mb-2">
                  {language === 'es' ? 'No tienes plantillas guardadas' : "You don't have any saved templates"}
                </p>
                <p className="text-sm text-slate-400">
                  {language === 'es' 
                    ? 'Selecciona un plan arriba para crear tu primera plantilla' 
                    : 'Select a plan above to create your first template'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <Card 
                  key={template.plan_id}
                  className="bg-white border-slate-100 hover:shadow-md transition-shadow"
                  data-testid={`template-card-${template.plan_id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-lime-600" />
                        <h3 className="font-heading font-semibold text-slate-800">
                          {template.template_name || template.unit || 'Template'}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-sm text-slate-600 mb-2">{template.story}</p>
                    
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {template.objective || (language === 'es' ? 'Sin objetivo' : 'No objective')}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                        data-testid={`use-template-${template.plan_id}`}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {language === 'es' ? 'Usar' : 'Use'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {language === 'es' 
                                ? 'Esta acción eliminará la plantilla permanentemente.'
                                : 'This will permanently delete the template.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteTemplate(template.plan_id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {t('delete')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Save as Template Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Guardar como Plantilla' : 'Save as Template'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Nombre de la Plantilla' : 'Template Name'}</Label>
                <Input 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={language === 'es' ? 'Ej: Plan de Lectura Semanal' : 'Ex: Weekly Reading Plan'}
                  data-testid="template-name-input"
                />
              </div>
              {selectedPlanForTemplate && (
                <div className="p-3 bg-stone-50 rounded-lg text-sm">
                  <p className="font-medium">{selectedPlanForTemplate.unit}</p>
                  <p className="text-slate-500">{selectedPlanForTemplate.story}</p>
                </div>
              )}
              <Button onClick={handleSaveAsTemplate} className="w-full" data-testid="save-template-btn">
                {language === 'es' ? 'Guardar Plantilla' : 'Save Template'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Templates;
