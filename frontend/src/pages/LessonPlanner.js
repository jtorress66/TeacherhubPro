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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, Plus, Copy, FileDown, Save, Trash2, ChevronLeft, ChevronRight, Printer, BookOpen, Sparkles, Loader2, Wand2 } from 'lucide-react';

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
  const [school, setSchool] = useState(null);
  const [activeWeek, setActiveWeek] = useState(1); // Toggle between Week 1 and Week 2
  
  // AI Generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiGenerating, setAIGenerating] = useState(false);
  const [aiForm, setAIForm] = useState({
    subject: '',
    grade_level: '',
    topic: '',
    standards_framework: 'both',
    difficulty_level: 'medium',
    duration_minutes: 45
  });
  
  // Subject options for AI
  const AI_SUBJECTS = [
    { value: 'math', label: language === 'es' ? 'Matemáticas' : 'Mathematics' },
    { value: 'ela', label: language === 'es' ? 'Inglés/Lectura' : 'English/Reading' },
    { value: 'spanish', label: language === 'es' ? 'Español' : 'Spanish' },
    { value: 'science', label: language === 'es' ? 'Ciencias' : 'Science' },
    { value: 'social_studies', label: language === 'es' ? 'Estudios Sociales' : 'Social Studies' },
    { value: 'art', label: language === 'es' ? 'Arte' : 'Art' },
    { value: 'music', label: language === 'es' ? 'Música' : 'Music' },
    { value: 'physical_education', label: language === 'es' ? 'Educación Física' : 'Physical Education' }
  ];
  
  const GRADE_LEVELS = [
    { value: 'K', label: language === 'es' ? 'Kinder' : 'Kindergarten' },
    { value: '1', label: language === 'es' ? '1er Grado' : '1st Grade' },
    { value: '2', label: language === 'es' ? '2do Grado' : '2nd Grade' },
    { value: '3', label: language === 'es' ? '3er Grado' : '3rd Grade' },
    { value: '4', label: language === 'es' ? '4to Grado' : '4th Grade' },
    { value: '5', label: language === 'es' ? '5to Grado' : '5th Grade' },
    { value: '6', label: language === 'es' ? '6to Grado' : '6th Grade' },
    { value: '7', label: language === 'es' ? '7mo Grado' : '7th Grade' },
    { value: '8', label: language === 'es' ? '8vo Grado' : '8th Grade' },
    { value: '9', label: language === 'es' ? '9no Grado' : '9th Grade' },
    { value: '10', label: language === 'es' ? '10mo Grado' : '10th Grade' },
    { value: '11', label: language === 'es' ? '11mo Grado' : '11th Grade' },
    { value: '12', label: language === 'es' ? '12mo Grado' : '12th Grade' }
  ];
  
  // Form state
  const [formData, setFormData] = useState({
    class_id: '',
    week_start: '',
    week_end: '',
    week2_start: '',
    week2_end: '',
    unit: '',
    story: '',
    teacher_name: '',  // Teacher name field
    objective: '',
    objective_week2: '',
    skills: ['', '', '', ''],
    skills_week2: ['', '', '', ''],
    days: DAYS.map((day, i) => ({
      date: '',
      day_name: day,
      week_index: 1, // Week 1 days
      theme: '',
      dok_levels: [],
      eca: { E: false, C: false, A: false },  // Enrichment, Core, Assessment
      activities: ACTIVITY_TYPES.map(type => ({ activity_type: type, checked: false, notes: '' })),
      materials: MATERIAL_TYPES.map(type => ({ material_type: type, checked: false })),
      notes: ''
    })).concat(DAYS.map((day, i) => ({
      date: '',
      day_name: day,
      week_index: 2, // Week 2 days
      theme: '',
      dok_levels: [],
      eca: { E: false, C: false, A: false },
      activities: ACTIVITY_TYPES.map(type => ({ activity_type: type, checked: false, notes: '' })),
      materials: MATERIAL_TYPES.map(type => ({ material_type: type, checked: false })),
      notes: ''
    }))),
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
        const [classesRes, plansRes, dashboardRes] = await Promise.all([
          axios.get(`${API}/classes`, { withCredentials: true }),
          axios.get(`${API}/plans`, { withCredentials: true }),
          axios.get(`${API}/dashboard`, { withCredentials: true })
        ]);
        setClasses(classesRes.data);
        setPlans(plansRes.data);
        
        // Get school info from dashboard
        if (dashboardRes.data.school) {
          setSchool(dashboardRes.data.school);
        }

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
    // Create days for both weeks - Week 1 (indices 0-4) and Week 2 (indices 5-9)
    const loadWeekDays = (weekIndex) => {
      return DAYS.map((dayName, i) => {
        // For legacy plans, use indices 0-4. For new plans, filter by week_index
        const dayIndexInPlan = weekIndex === 1 ? i : i + 5;
        const existingDay = plan.days?.find(d => d.week_index === weekIndex && d.day_name?.toLowerCase() === dayName) 
          || plan.days?.[dayIndexInPlan];
        
        return {
          date: existingDay?.date || '',
          day_name: existingDay?.day_name || dayName,
          week_index: weekIndex,
          theme: existingDay?.theme || '',
          dok_levels: existingDay?.dok_levels || [],
          eca: existingDay?.eca || { E: false, C: false, A: false },
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
    };

    const week1Days = loadWeekDays(1);
    const week2Days = loadWeekDays(2);
    const allDays = [...week1Days, ...week2Days];

    setFormData({
      class_id: plan.class_id || '',
      week_start: plan.week_start || '',
      week_end: plan.week_end || '',
      week2_start: plan.week2_start || '',
      week2_end: plan.week2_end || '',
      unit: plan.unit || '',
      story: plan.story || '',
      teacher_name: plan.teacher_name || '',
      objective: plan.objective || '',
      objective_week2: plan.objective_week2 || '',
      skills: plan.skills?.length > 0 ? [...plan.skills, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      skills_week2: plan.skills_week2?.length > 0 ? [...plan.skills_week2, '', '', '', ''].slice(0, 4) : ['', '', '', ''],
      days: allDays,
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
        skills_week2: (formData.skills_week2 || []).filter(s => s.trim() !== ''),
        objective_week2: formData.objective_week2 || '',
        days: formData.days.map(day => ({
          ...day,
          activities: (day.activities || []).filter(a => a.checked),
          materials: (day.materials || []).filter(m => m.checked)
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

  const updateSkill = (index, value, week = 1) => {
    if (week === 1) {
      setFormData(prev => ({
        ...prev,
        skills: prev.skills.map((s, i) => i === index ? value : s)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        skills_week2: (prev.skills_week2 || ['', '', '', '']).map((s, i) => i === index ? value : s)
      }));
    }
  };

  // Get days filtered by current active week
  // Handles legacy plans that don't have week_index on days
  const getWeekDays = (week) => {
    // Check if days have week_index property
    const hasWeekIndex = formData.days.some(d => d.week_index !== undefined);
    
    if (hasWeekIndex) {
      // New format - filter by week_index
      return formData.days.filter(d => d.week_index === week);
    } else {
      // Legacy format - first 5 days are week 1, next 5 are week 2
      if (week === 1) {
        return formData.days.slice(0, 5);
      } else {
        // For legacy plans, week 2 returns empty or create empty days
        return formData.days.slice(5, 10).length > 0 
          ? formData.days.slice(5, 10) 
          : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => ({
              date: '',
              day_name: day,
              week_index: 2,
              theme: '',
              dok_levels: [],
              eca: { E: false, C: false, A: false },
              activities: [],
              materials: [],
              notes: ''
            }));
      }
    }
  };

  // Get day index in the full days array
  const getDayIndexInFullArray = (weekDayIndex) => {
    const weekDays = getWeekDays(activeWeek);
    if (!weekDays[weekDayIndex]) return -1;
    
    const targetDay = weekDays[weekDayIndex];
    const hasWeekIndex = formData.days.some(d => d.week_index !== undefined);
    
    if (hasWeekIndex) {
      return formData.days.findIndex(d => 
        d.day_name === targetDay.day_name && d.week_index === activeWeek
      );
    } else {
      // Legacy format
      return activeWeek === 1 ? weekDayIndex : weekDayIndex + 5;
    }
  };

  const updateDay = (dayIndex, field, value) => {
    // dayIndex is relative to the current week's days
    const fullIndex = getDayIndexInFullArray(dayIndex);
    if (fullIndex === -1) return;
    
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => 
        i === fullIndex ? { ...day, [field]: value } : day
      )
    }));
  };

  const toggleDokLevel = (dayIndex, level) => {
    const fullIndex = getDayIndexInFullArray(dayIndex);
    if (fullIndex === -1) return;
    
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== fullIndex) return day;
        const levels = (day.dok_levels || []).includes(level)
          ? day.dok_levels.filter(l => l !== level)
          : [...(day.dok_levels || []), level];
        return { ...day, dok_levels: levels };
      })
    }));
  };

  const toggleActivity = (dayIndex, activityIndex) => {
    const fullIndex = getDayIndexInFullArray(dayIndex);
    if (fullIndex === -1) return;
    
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== fullIndex) return day;
        return {
          ...day,
          activities: (day.activities || []).map((a, ai) => 
            ai === activityIndex ? { ...a, checked: !a.checked } : a
          )
        };
      })
    }));
  };

  const handleActivityNoteChange = (dayIndex, activityIndex, value) => {
    const fullIndex = getDayIndexInFullArray(dayIndex);
    if (fullIndex === -1) return;
    
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== fullIndex) return day;
        return {
          ...day,
          activities: (day.activities || []).map((a, ai) => 
            ai === activityIndex ? { ...a, notes: value } : a
          )
        };
      })
    }));
  };

  const toggleMaterial = (dayIndex, materialIndex) => {
    const fullIndex = getDayIndexInFullArray(dayIndex);
    if (fullIndex === -1) return;
    
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== fullIndex) return day;
        return {
          ...day,
          materials: (day.materials || []).map((m, mi) => 
            mi === materialIndex ? { ...m, checked: !m.checked } : m
          )
        };
      })
    }));
  };

  const handleMaterialNoteChange = (dayIndex, materialIndex, value) => {
    const fullIndex = getDayIndexInFullArray(dayIndex);
    if (fullIndex === -1) return;
    
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== fullIndex) return day;
        return {
          ...day,
          materials: (day.materials || []).map((m, mi) => 
            mi === materialIndex ? { ...m, notes: value } : m
          )
        };
      })
    }));
  };

  const toggleECA = (dayIndex, ecaType) => {
    const fullIndex = getDayIndexInFullArray(dayIndex);
    if (fullIndex === -1) return;
    
    setFormData(prev => ({
      ...prev,
      days: prev.days.map((day, i) => {
        if (i !== fullIndex) return day;
        return {
          ...day,
          eca: { ...(day.eca || {}), [ecaType]: !(day.eca || {})[ecaType] }
        };
      })
    }));
  };

  const updateStandard = (weekIndex, domain, value) => {
    setFormData(prev => {
      const existingIndex = prev.standards.findIndex(s => s.week_index === weekIndex && s.domain === domain);
      const newCodes = value.split(',').map(c => c.trim()).filter(c => c);
      
      if (existingIndex >= 0) {
        // Update existing standard
        return {
          ...prev,
          standards: prev.standards.map((s, i) => 
            i === existingIndex ? { ...s, codes: newCodes } : s
          )
        };
      } else {
        // Create new standard
        return {
          ...prev,
          standards: [...prev.standards, { week_index: weekIndex, domain: domain, codes: newCodes }]
        };
      }
    });
  };

  const updateExpectation = (weekIndex, text) => {
    setFormData(prev => {
      const existingIndex = prev.expectations.findIndex(e => e.week_index === weekIndex);
      
      if (existingIndex >= 0) {
        // Update existing expectation
        return {
          ...prev,
          expectations: prev.expectations.map((e, i) => 
            i === existingIndex ? { ...e, text } : e
          )
        };
      } else {
        // Create new expectation
        return {
          ...prev,
          expectations: [...prev.expectations, { week_index: weekIndex, text }]
        };
      }
    });
  };

  // AI Generation handler
  const handleAIGenerate = async () => {
    if (!aiForm.subject || !aiForm.grade_level || !aiForm.topic) {
      toast.error(language === 'es' ? 'Por favor completa todos los campos' : 'Please fill in all fields');
      return;
    }

    setAIGenerating(true);
    try {
      const response = await axios.post(`${API}/ai/generate`, {
        tool_type: 'lesson_plan',
        subject: aiForm.subject,
        grade_level: aiForm.grade_level,
        topic: aiForm.topic,
        standards_framework: aiForm.standards_framework,
        language: language,
        difficulty_level: aiForm.difficulty_level,
        duration_minutes: aiForm.duration_minutes,
        additional_instructions: language === 'es' 
          ? 'Genera un plan de lección semanal estructurado con objetivos, actividades diarias y materiales.'
          : 'Generate a structured weekly lesson plan with objectives, daily activities, and materials.'
      }, { withCredentials: true });

      // Parse the AI response and populate form fields
      const aiContent = response.data.content;
      
      // Extract objective from AI content (usually the first main section)
      const objectiveMatch = aiContent.match(/(?:Learning Objectives?|Objetivos?)[:\s]*([^\n]+)/i);
      const objective = objectiveMatch ? objectiveMatch[1].trim() : aiForm.topic;
      
      // Update form with AI-generated content
      setFormData(prev => ({
        ...prev,
        objective: objective,
        story: aiForm.topic,
        // Store the full AI content in notes for the first day
        days: prev.days.map((day, i) => {
          if (i === 0) {
            return {
              ...day,
              theme: aiForm.topic,
              notes: `--- ${language === 'es' ? 'Generado por IA' : 'AI Generated'} ---\n\n${aiContent.substring(0, 2000)}${aiContent.length > 2000 ? '...' : ''}`
            };
          }
          return day;
        })
      }));

      setShowAIModal(false);
      toast.success(language === 'es' 
        ? '¡Plan generado! Revisa y edita según necesites.' 
        : 'Plan generated! Review and edit as needed.');
      
    } catch (error) {
      console.error('AI generation error:', error);
      if (error.response?.status === 403) {
        toast.error(language === 'es' 
          ? 'Necesitas una suscripción activa para usar el asistente IA' 
          : 'You need an active subscription to use the AI assistant');
      } else {
        toast.error(language === 'es' ? 'Error al generar el plan' : 'Error generating plan');
      }
    } finally {
      setAIGenerating(false);
    }
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
            {planId === 'new' && (
              <p className="text-slate-500">{t('createPlan')}</p>
            )}
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
            school={school}
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
              
              <div className="space-y-2">
                <Label>{t('teacher')}</Label>
                <Input 
                  value={formData.teacher_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, teacher_name: e.target.value }))}
                  placeholder={language === 'es' ? 'Nombre del maestro' : 'Teacher name'}
                  data-testid="teacher-name-input"
                />
              </div>
            </div>
            
            {/* Two-Week Date Range - All in one compact section */}
            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <Label className="text-sm font-medium text-slate-700 mb-3 block">
                {language === 'es' ? 'Rango de Fechas (2 Semanas)' : 'Date Range (2 Weeks)'}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'es' ? 'Sem 1 - Desde' : 'Week 1 - From'}</Label>
                  <Input 
                    type="date"
                    value={formData.week_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, week_start: e.target.value }))}
                    className="text-sm"
                    data-testid="week-start-input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'es' ? 'Sem 1 - Hasta' : 'Week 1 - To'}</Label>
                  <Input 
                    type="date"
                    value={formData.week_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, week_end: e.target.value }))}
                    className="text-sm"
                    data-testid="week-end-input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'es' ? 'Sem 2 - Desde' : 'Week 2 - From'}</Label>
                  <Input 
                    type="date"
                    value={formData.week2_start}
                    onChange={(e) => setFormData(prev => ({ ...prev, week2_start: e.target.value }))}
                    className="text-sm"
                    data-testid="week2-start-input"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">{language === 'es' ? 'Sem 2 - Hasta' : 'Week 2 - To'}</Label>
                  <Input 
                    type="date"
                    value={formData.week2_end}
                    onChange={(e) => setFormData(prev => ({ ...prev, week2_end: e.target.value }))}
                    className="text-sm"
                    data-testid="week2-end-input"
                  />
                </div>
              </div>
            </div>

            {/* SM Aprendizaje Integration - Simple Direct Link */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-800">SM Aprendizaje</h4>
                  <p className="text-sm text-blue-600">
                    {language === 'es' 
                      ? 'Accede a recursos para planificar tus lecciones' 
                      : 'Access resources to help plan your lessons'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => window.open('https://loginsma.smaprendizaje.com', '_blank')}
                  data-testid="sm-aprendizaje-btn"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  {language === 'es' ? 'Ir a SM Aprendizaje' : 'Go to SM Aprendizaje'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objective & Skills - with Week Toggle */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">{t('objectiveOfWeek')}</CardTitle>
              {/* Week Toggle Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant={activeWeek === 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveWeek(1)}
                  className={activeWeek === 1 ? "bg-blue-600 hover:bg-blue-700" : ""}
                  data-testid="week1-objective-btn"
                >
                  {language === 'es' ? 'Semana 1' : 'Week 1'}
                </Button>
                <Button 
                  variant={activeWeek === 2 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveWeek(2)}
                  className={activeWeek === 2 ? "bg-green-600 hover:bg-green-700" : ""}
                  data-testid="week2-objective-btn"
                >
                  {language === 'es' ? 'Semana 2' : 'Week 2'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Week indicator badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              activeWeek === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {activeWeek === 1 
                ? (language === 'es' ? '📘 Semana 1' : '📘 Week 1')
                : (language === 'es' ? '📗 Semana 2' : '📗 Week 2')
              }
              {activeWeek === 1 && formData.week_start && formData.week_end && (
                <span className="ml-2 text-xs">({formData.week_start} - {formData.week_end})</span>
              )}
              {activeWeek === 2 && formData.week2_start && formData.week2_end && (
                <span className="ml-2 text-xs">({formData.week2_start} - {formData.week2_end})</span>
              )}
            </div>
            
            <Textarea 
              value={activeWeek === 1 ? formData.objective : formData.objective_week2}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                [activeWeek === 1 ? 'objective' : 'objective_week2']: e.target.value 
              }))}
              placeholder={language === 'es' 
                ? `Escribe el objetivo de la semana ${activeWeek}...` 
                : `Write the objective for week ${activeWeek}...`}
              className="min-h-24"
              data-testid="objective-input"
            />
            
            <div>
              <Label className="mb-2 block">{t('skillsOfWeek')}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(activeWeek === 1 ? formData.skills : formData.skills_week2).map((skill, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 w-4">{i + 1}.</span>
                    <Input 
                      value={skill}
                      onChange={(e) => updateSkill(i, e.target.value, activeWeek)}
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
              <div className="flex items-center gap-4">
                <CardTitle className="font-heading text-lg">{t('weeklyPlan')}</CardTitle>
                {/* Week indicator badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  activeWeek === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                }`}>
                  {activeWeek === 1 
                    ? (language === 'es' ? '📘 Semana 1' : '📘 Week 1')
                    : (language === 'es' ? '📗 Semana 2' : '📗 Week 2')
                  }
                </div>
              </div>
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
              
              {DAYS.map((day, dayIndex) => {
                // Get the current week's days
                const weekDays = getWeekDays(activeWeek);
                const currentDay = weekDays[dayIndex] || {};
                
                return (
                <TabsContent key={day} value={String(dayIndex)} className="space-y-4">
                  {/* Day Theme */}
                  <div className="space-y-2">
                    <Label>{t('dayTheme')}</Label>
                    <Input 
                      value={currentDay.theme || ''}
                      onChange={(e) => updateDay(dayIndex, 'theme', e.target.value)}
                      placeholder={language === 'es' ? 'Tema del día...' : 'Day theme...'}
                      data-testid={`day-theme-${dayIndex}`}
                    />
                  </div>

                  {/* E/C/A - Enrichment, Core, Assessment */}
                  <div className="space-y-2">
                    <Label>E / C / A</Label>
                    <div className="flex gap-4">
                      {[
                        { key: 'E', label: language === 'es' ? 'Enriquecimiento' : 'Enrichment' },
                        { key: 'C', label: language === 'es' ? 'Central' : 'Core' },
                        { key: 'A', label: language === 'es' ? 'Evaluación' : 'Assessment' }
                      ].map(({ key, label }) => (
                        <div 
                          key={key}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                            currentDay.eca?.[key]
                              ? 'bg-lime-50 border-lime-300 text-lime-800'
                              : 'bg-white border-slate-200 hover:bg-stone-50'
                          }`}
                          onClick={() => toggleECA(dayIndex, key)}
                          data-testid={`eca-${dayIndex}-${key}`}
                        >
                          <Checkbox checked={currentDay.eca?.[key] || false} />
                          <span className="font-medium">{key}</span>
                          <span className="text-xs text-slate-500 hidden sm:inline">({label})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* DOK Levels */}
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Niveles de Taxonomía (Webb 2005)' : 'Taxonomy Levels (Webb 2005)'}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {DOK_LEVELS.map((level) => (
                        <div 
                          key={level.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            (currentDay.dok_levels || []).includes(level.value)
                              ? 'bg-lime-50 border-lime-200'
                              : 'bg-white border-slate-200 hover:bg-stone-50'
                          }`}
                          onClick={() => toggleDokLevel(dayIndex, level.value)}
                        >
                          <Checkbox 
                            checked={(currentDay.dok_levels || []).includes(level.value)}
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
                        {(currentDay.activities || []).map((activity, ai) => (
                          <div 
                            key={activity.activity_type}
                            className={`flex flex-col gap-2 p-2 rounded border ${
                              activity.checked ? 'bg-lime-50 border-lime-200' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div 
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => toggleActivity(dayIndex, ai)}
                            >
                              <Checkbox 
                                checked={activity.checked}
                                data-testid={`activity-${dayIndex}-${ai}`}
                              />
                              <span className="text-sm">{t(activity.activity_type)}</span>
                            </div>
                            {/* Show text input for "Other" when checked */}
                            {activity.activity_type === 'other' && activity.checked && (
                              <Input
                                value={activity.notes || ''}
                                onChange={(e) => handleActivityNoteChange(dayIndex, ai, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={language === 'es' ? 'Especificar otra actividad...' : 'Specify other activity...'}
                                className="ml-6 text-sm"
                                data-testid={`activity-other-notes-${dayIndex}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Materials */}
                    <div className="space-y-2">
                      <Label>{t('materials')}</Label>
                      <div className="space-y-2">
                        {(currentDay.materials || []).map((material, mi) => (
                          <div 
                            key={material.material_type}
                            className={`flex flex-col gap-2 p-2 rounded border ${
                              material.checked ? 'bg-lime-50 border-lime-200' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div 
                              className="flex items-center gap-3 cursor-pointer"
                              onClick={() => toggleMaterial(dayIndex, mi)}
                            >
                              <Checkbox 
                                checked={material.checked}
                                data-testid={`material-${dayIndex}-${mi}`}
                              />
                              <span className="text-sm">{t(material.material_type)}</span>
                            </div>
                            {/* Show text input for "Other" when checked */}
                            {material.material_type === 'other' && material.checked && (
                              <Input
                                value={material.notes || ''}
                                onChange={(e) => handleMaterialNoteChange(dayIndex, mi, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={language === 'es' ? 'Especificar otro material...' : 'Specify other material...'}
                                className="ml-6 text-sm"
                                data-testid={`material-other-notes-${dayIndex}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>{t('notes')}</Label>
                    <Textarea 
                      value={currentDay.notes || ''}
                      onChange={(e) => updateDay(dayIndex, 'notes', e.target.value)}
                      placeholder={language === 'es' ? 'Notas adicionales...' : 'Additional notes...'}
                      data-testid={`day-notes-${dayIndex}`}
                    />
                  </div>
                </TabsContent>
              );
              })}
            </Tabs>
          </CardContent>
        </Card>

        {/* Standards */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">{t('standards')}</CardTitle>
              {/* Week indicator badge - synced with global activeWeek */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                activeWeek === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
              }`}>
                {activeWeek === 1 
                  ? (language === 'es' ? '📘 Semana 1' : '📘 Week 1')
                  : (language === 'es' ? '📗 Semana 2' : '📗 Week 2')
                }
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {STANDARD_DOMAINS.map(domain => {
                  const standard = formData.standards.find(s => s.week_index === activeWeek && s.domain === domain);
                  return (
                    <div key={domain} className="space-y-2">
                      <Label className="text-sm">{t(domain)}</Label>
                      <Input 
                        value={standard?.codes?.join(', ') || ''}
                        onChange={(e) => updateStandard(activeWeek, domain, e.target.value)}
                        placeholder="RF 4.3, 4.4, 4.4a..."
                        className="font-mono text-sm"
                        data-testid={`standard-${activeWeek}-${domain}`}
                      />
                    </div>
                  );
                })}
              </div>
              
              {/* Expectations */}
              <div className="space-y-2 mt-4">
                <Label>{t('expectations')}</Label>
                <Textarea 
                  value={formData.expectations.find(e => e.week_index === activeWeek)?.text || ''}
                  onChange={(e) => updateExpectation(activeWeek, e.target.value)}
                  placeholder={language === 'es' ? `Expectativas de la semana ${activeWeek}...` : `Week ${activeWeek} expectations...`}
                  className="min-h-20"
                  data-testid={`expectation-${activeWeek}`}
                />
              </div>
            </div>
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
