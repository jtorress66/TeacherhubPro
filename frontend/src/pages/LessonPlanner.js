import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { PlanPrintView } from '../components/PlanPrintView';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, Plus, Copy, FileDown, Save, Trash2, ChevronLeft, ChevronRight, Printer } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const ACTIVITY_TYPES = ['brainstorming', 'buildingBackground', 'vocabularyDevelopment', 'readPages', 'guidedReading', 'oralQuestions', 'comprehensionQuestions', 'exercisePractice', 'other'];
const MATERIAL_TYPES = ['book', 'notebook', 'teachersGuide', 'testQuiz', 'dictionary', 'handouts', 'other'];
const DOK_LEVELS = [
  { value: 1, key: 'level1Memory' },
  { value: 2, key: 'level2Processing' },
  { value: 3, key: 'level3Strategic' },
  { value: 4, key: 'level4Extended' }
];
const STANDARD_DOMAINS = ['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'];
const SUBJECT_INTEGRATION = ['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'];

const LessonPlanner = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const [searchParams] = useSearchParams();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activeDay, setActiveDay] = useState(0);
  const [showPrintView, setShowPrintView] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    class_id: '',
    week_start: '',
    week_end: '',
    unit: '',
    story: '',
    objective: '',
    skills: ['', '', '', ''],
    days: DAYS.map((day, i) => ({
      date: '',
      day_name: day,
      theme: '',
      dok_levels: [],
      activities: ACTIVITY_TYPES.map(type => ({ activity_type: type, checked: false, notes: '' })),
      materials: MATERIAL_TYPES.map(type => ({ material_type: type, checked: false })),
      notes: ''
    })),
    standards: [
      { week_index: 1, domain: 'listeningAndSpeaking', codes: [] },
      { week_index: 1, domain: 'foundationalSkills', codes: [] },
      { week_index: 1, domain: 'reading', codes: [] },
      { week_index: 1, domain: 'writing', codes: [] },
      { week_index: 1, domain: 'language', codes: [] },
      { week_index: 2, domain: 'listeningAndSpeaking', codes: [] },
      { week_index: 2, domain: 'foundationalSkills', codes: [] },
      { week_index: 2, domain: 'reading', codes: [] },
      { week_index: 2, domain: 'writing', codes: [] },
      { week_index: 2, domain: 'language', codes: [] }
    ],
    expectations: [
      { week_index: 1, text: '' },
      { week_index: 2, text: '' }
    ],
    subject_integration: [],
    is_template: false,
    template_name: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, plansRes] = await Promise.all([
          axios.get(`${API}/classes`, { withCredentials: true }),
          axios.get(`${API}/plans`, { withCredentials: true })
        ]);
        setClasses(classesRes.data);
        setPlans(plansRes.data);

        if (planId && planId !== 'new') {
          const planRes = await axios.get(`${API}/plans/${planId}`, { withCredentials: true });
          loadPlanToForm(planRes.data);
          setSelectedPlan(planRes.data);
        } else if (searchParams.get('class')) {
          setFormData(prev => ({ ...prev, class_id: searchParams.get('class') }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [planId, searchParams, t]);

  const loadPlanToForm = (plan) => {
    // Ensure we always have 5 days
    const loadedDays = DAYS.map((dayName, i) => {
      const existingDay = plan.days?.[i];
      return {
        date: existingDay?.date || '',
        day_name: existingDay?.day_name || dayName,
        theme: existingDay?.theme || '',
        dok_levels: existingDay?.dok_levels || [],
        activities: ACTIVITY_TYPES.map(type => {
          const existing = existingDay?.activities?.find(a => a.activity_type === type);
          return existing || { activity_type: type, checked: false, notes: '' };
        }),
        materials: MATERIAL_TYPES.map(type => {
          const existing = existingDay?.materials?.find(m => m.material_type === type);
          return existing || { material_type: type, checked: false };
        }),
        notes: existingDay?.notes || ''
      };
    });

    setFormData({
      class_id: plan.class_id || '',
      week_start: plan.week_start || '',
      week_end: plan.week_end || '',
      unit: plan.unit || '',
      story: plan.story || '',
      objective: plan.objective || '',
      skills: plan.skills?.length > 0 ? [...plan.skills, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      days: loadedDays,
      standards: plan.standards?.length > 0 ? plan.standards : [
        { week_index: 1, domain: 'listeningAndSpeaking', codes: [] },
        { week_index: 1, domain: 'foundationalSkills', codes: [] },
        { week_index: 1, domain: 'reading', codes: [] },
        { week_index: 1, domain: 'writing', codes: [] },
        { week_index: 1, domain: 'language', codes: [] },
        { week_index: 2, domain: 'listeningAndSpeaking', codes: [] },
        { week_index: 2, domain: 'foundationalSkills', codes: [] },
        { week_index: 2, domain: 'reading', codes: [] },
        { week_index: 2, domain: 'writing', codes: [] },
        { week_index: 2, domain: 'language', codes: [] }
      ],
      expectations: plan.expectations?.length > 0 ? plan.expectations : [
        { week_index: 1, text: '' },
        { week_index: 2, text: '' }
      ],
      subject_integration: plan.subject_integration || [],
      is_template: plan.is_template || false,
      template_name: plan.template_name || ''
    });
  };

  const handleSave = async () => {
    if (!formData.class_id) {
      toast.error(language === 'es' ? 'Selecciona una clase' : 'Select a class');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skills.filter(s => s.trim() !== ''),
        days: formData.days.map(day => ({
          ...day,
          activities: day.activities.filter(a => a.checked),
          materials: day.materials.filter(m => m.checked)
        })),
        standards: formData.standards.filter(s => s.codes.length > 0)
      };

      if (planId && planId !== 'new') {
        await axios.put(`${API}/plans/${planId}`, payload, { withCredentials: true });
        toast.success(language === 'es' ? 'Plan actualizado' : 'Plan updated');
      } else {
        const res = await axios.post(`${API}/plans`, payload, { withCredentials: true });
        toast.success(language === 'es' ? 'Plan creado' : 'Plan created');
        navigate(`/planner/${res.data.plan_id}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!planId || planId === 'new') return;
    
    try {
      const res = await axios.post(`${API}/plans/${planId}/duplicate`, {}, { withCredentials: true });
      toast.success(language === 'es' ? 'Plan duplicado' : 'Plan duplicated');
      navigate(`/planner/${res.data.plan_id}`);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDelete = async () => {
    if (!planId || planId === 'new') return;
    
    try {
      await axios.delete(`${API}/plans/${planId}`, { withCredentials: true });
      toast.success(language === 'es' ? 'Plan eliminado' : 'Plan deleted');
      navigate('/planner');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const updateSkill = (index, value) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => i === index ? value : s)
    }));
  };

  const updateDay = (dayIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === dayIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  const toggleDokLevel = (dayIndex, level) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== dayIndex) return day;
        const levels = day.dok_levels.includes(level)
          ? day.dok_levels.filter(l => l !== level)
          : [...day.dok_levels, level];
        return { ...day, dok_levels: levels };
      })
    }));
  };

  const toggleActivity = (dayIndex, activityIndex) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== dayIndex) return day;
        return {
          ...day,
          activities: day.activities.map((a, ai) => 
            ai === activityIndex ? { ...a, checked: !a.checked } : a
          )
        };
      })
    }));
  };

  const toggleMaterial = (dayIndex, materialIndex) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== dayIndex) return day;
        return {
          ...day,
          materials: day.materials.map((m, mi) => 
            mi === materialIndex ? { ...m, checked: !m.checked } : m
          )
        };
      })
    }));
  };

  const updateStandard = (weekIndex, domain, value) => {
    setFormData(prev => ({
      ...prev,
      standards: prev.standards.map(s => {
        if (s.week_index === weekIndex && s.domain === domain) {
          return { ...s, codes: value.split(',').map(c => c.trim()).filter(c => c) };
        }
        return s;
      })
    }));
  };

  const updateExpectation = (weekIndex, text) => {
    setFormData(prev => ({
      ...prev,
      expectations: prev.expectations.map(e => 
        e.week_index === weekIndex ? { ...e, text } : e
      )
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96 w-full" />
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
            <h1 className="text-3xl font-heading font-bold text-slate-800">{t('weeklyPlan')}</h1>
            <p className="text-slate-500">{planId === 'new' ? t('createPlan') : t('edit')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {planId !== 'new' && (
              <>
                <Button variant="outline" onClick={() => setShowPrintView(true)} data-testid="print-plan-btn">
                  <Printer className="h-4 w-4 mr-2" />
                  {t('exportPdf')}
                </Button>
                <Button variant="outline" onClick={handleDuplicate} data-testid="duplicate-plan-btn">
                  <Copy className="h-4 w-4 mr-2" />
                  {t('duplicateLastWeek')}
                </Button>
                <Button variant="outline" className="text-red-600" onClick={handleDelete} data-testid="delete-plan-btn">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('delete')}
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving} data-testid="save-plan-btn">
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('loading') : t('save')}
            </Button>
          </div>
        </div>

        {/* PDF Print View Modal */}
        {showPrintView && selectedPlan && (
          <PlanPrintView 
            plan={selectedPlan}
            classInfo={classes.find(c => c.class_id === selectedPlan.class_id)}
            onClose={() => setShowPrintView(false)}
          />
        )}

        {/* Plan Header Info */}
        <Card className="bg-white border-slate-100">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('classes')}</Label>
                <Select 
                  value={formData.class_id} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, class_id: v }))}
                >
                  <SelectTrigger data-testid="class-select">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar clase' : 'Select class'} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.class_id} value={cls.class_id}>
                        {cls.name} ({cls.grade}-{cls.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t('unit')}</Label>
                <Input 
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder={language === 'es' ? 'Ej: Unidad 1' : 'Ex: Unit 1'}
                  data-testid="unit-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('story')}</Label>
                <Input 
                  value={formData.story}
                  onChange={(e) => setFormData(prev => ({ ...prev, story: e.target.value }))}
                  placeholder={language === 'es' ? 'Título de la historia' : 'Story title'}
                  data-testid="story-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>{t('from')}</Label>
                  <Input 
                    type="date"
                    value={formData.week_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, week_start: e.target.value }))}
                    data-testid="week-start-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('to')}</Label>
                  <Input 
                    type="date"
                    value={formData.week_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, week_end: e.target.value }))}
                    data-testid="week-end-input"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objective & Skills */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">{t('objectiveOfWeek')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              value={formData.objective}
              onChange={(e) => setFormData(prev => ({ ...prev, objective: e.target.value }))}
              placeholder={language === 'es' ? 'Escribe el objetivo de la semana...' : 'Write the objective of the week...'}
              className="min-h-24"
              data-testid="objective-input"
            />
            
            <div>
              <Label className="mb-2 block">{t('skillsOfWeek')}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {formData.skills.map((skill, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 w-4">{i + 1}.</span>
                    <Input 
                      value={skill}
                      onChange={(e) => updateSkill(i, e.target.value)}
                      placeholder={language === 'es' ? 'Destreza...' : 'Skill...'}
                      data-testid={`skill-input-${i}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Plan Tabs */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">{t('weeklyPlan')}</CardTitle>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setActiveDay(Math.max(0, activeDay - 1))}
                  disabled={activeDay === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setActiveDay(Math.min(4, activeDay + 1))}
                  disabled={activeDay === 4}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={String(activeDay)} onValueChange={(v) => setActiveDay(Number(v))}>
              <TabsList className="grid grid-cols-5 mb-4">
                {DAYS.map((day, i) => (
                  <TabsTrigger 
                    key={day} 
                    value={String(i)}
                    className="text-xs md:text-sm"
                    data-testid={`day-tab-${day}`}
                  >
                    {t(day).slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {DAYS.map((day, dayIndex) => (
                <TabsContent key={day} value={String(dayIndex)} className="space-y-4">
                  {/* Day Theme */}
                  <div className="space-y-2">
                    <Label>{t('dayTheme')}</Label>
                    <Input 
                      value={formData.days[dayIndex].theme}
                      onChange={(e) => updateDay(dayIndex, 'theme', e.target.value)}
                      placeholder={language === 'es' ? 'Tema del día...' : 'Day theme...'}
                      data-testid={`day-theme-${dayIndex}`}
                    />
                  </div>
                  
                  {/* DOK Levels */}
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Niveles de Taxonomía (Webb 2005)' : 'Taxonomy Levels (Webb 2005)'}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {DOK_LEVELS.map((level) => (
                        <div 
                          key={level.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            formData.days[dayIndex].dok_levels.includes(level.value)
                              ? 'bg-lime-50 border-lime-200'
                              : 'bg-white border-slate-200 hover:bg-stone-50'
                          }`}
                          onClick={() => toggleDokLevel(dayIndex, level.value)}
                        >
                          <Checkbox 
                            checked={formData.days[dayIndex].dok_levels.includes(level.value)}
                            data-testid={`dok-${dayIndex}-${level.value}`}
                          />
                          <span className="text-sm">{t(level.key)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Activities */}
                    <div className="space-y-2">
                      <Label>{t('activities')}</Label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {formData.days[dayIndex].activities.map((activity, ai) => (
                          <div 
                            key={activity.activity_type}
                            className={`flex items-center gap-3 p-2 rounded border cursor-pointer ${
                              activity.checked ? 'bg-lime-50 border-lime-200' : 'bg-white border-slate-200'
                            }`}
                            onClick={() => toggleActivity(dayIndex, ai)}
                          >
                            <Checkbox 
                              checked={activity.checked}
                              data-testid={`activity-${dayIndex}-${ai}`}
                            />
                            <span className="text-sm">{t(activity.activity_type)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Materials */}
                    <div className="space-y-2">
                      <Label>{t('materials')}</Label>
                      <div className="space-y-2">
                        {formData.days[dayIndex].materials.map((material, mi) => (
                          <div 
                            key={material.material_type}
                            className={`flex items-center gap-3 p-2 rounded border cursor-pointer ${
                              material.checked ? 'bg-lime-50 border-lime-200' : 'bg-white border-slate-200'
                            }`}
                            onClick={() => toggleMaterial(dayIndex, mi)}
                          >
                            <Checkbox 
                              checked={material.checked}
                              data-testid={`material-${dayIndex}-${mi}`}
                            />
                            <span className="text-sm">{t(material.material_type)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>{t('notes')}</Label>
                    <Textarea 
                      value={formData.days[dayIndex].notes}
                      onChange={(e) => updateDay(dayIndex, 'notes', e.target.value)}
                      placeholder={language === 'es' ? 'Notas adicionales...' : 'Additional notes...'}
                      data-testid={`day-notes-${dayIndex}`}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Standards */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">{t('standards')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="1">
              <TabsList className="mb-4">
                <TabsTrigger value="1">{t('firstWeek')}</TabsTrigger>
                <TabsTrigger value="2">{t('secondWeek')}</TabsTrigger>
              </TabsList>
              
              {[1, 2].map(weekIndex => (
                <TabsContent key={weekIndex} value={String(weekIndex)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {STANDARD_DOMAINS.map(domain => {
                      const standard = formData.standards.find(s => s.week_index === weekIndex && s.domain === domain);
                      return (
                        <div key={domain} className="space-y-2">
                          <Label className="text-sm">{t(domain)}</Label>
                          <Input 
                            value={standard?.codes?.join(', ') || ''}
                            onChange={(e) => updateStandard(weekIndex, domain, e.target.value)}
                            placeholder="RF 4.3, 4.4, 4.4a..."
                            className="font-mono text-sm"
                            data-testid={`standard-${weekIndex}-${domain}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Expectations */}
                  <div className="space-y-2 mt-4">
                    <Label>{t('expectations')}</Label>
                    <Textarea 
                      value={formData.expectations.find(e => e.week_index === weekIndex)?.text || ''}
                      onChange={(e) => updateExpectation(weekIndex, e.target.value)}
                      placeholder={language === 'es' ? 'Expectativas de la semana...' : 'Week expectations...'}
                      className="min-h-20"
                      data-testid={`expectation-${weekIndex}`}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Subject Integration */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg">
              {language === 'es' ? 'Integración con otras materias' : 'Integration with other subjects'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_INTEGRATION.map(subject => (
                <Badge 
                  key={subject}
                  variant={formData.subject_integration.includes(subject) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      subject_integration: prev.subject_integration.includes(subject)
                        ? prev.subject_integration.filter(s => s !== subject)
                        : [...prev.subject_integration, subject]
                    }));
                  }}
                  data-testid={`subject-${subject}`}
                >
                  {t(subject)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LessonPlanner;
