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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Calendar, Plus, Copy, FileDown, Save, Trash2, ChevronLeft, ChevronRight, Printer, BookOpen, Sparkles, Loader2, Wand2, FolderOpen, Star, Clock, Layers } from 'lucide-react';

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
  
  // AI Day Suggestions state
  const [aiDaySuggestions, setAiDaySuggestions] = useState({});
  const [aiDayLoading, setAiDayLoading] = useState(null); // Track which day is loading
  const [aiFullWeekLoading, setAiFullWeekLoading] = useState(false); // Full week generation
  
  // AI Templates state
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [starterTemplates, setStarterTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customizeLoading, setCustomizeLoading] = useState(false);
  const [templateTab, setTemplateTab] = useState('starters'); // 'starters' or 'my'
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    tags: ''
  });
  
  // Day sequence phases for AI context
  const DAY_PHASES = {
    0: { phase: 'introduction', label_es: 'Introducción', label_en: 'Introduction', focus: 'Hook students, activate prior knowledge, introduce key concepts' },
    1: { phase: 'guided_practice', label_es: 'Práctica Guiada', label_en: 'Guided Practice', focus: 'Model skills, guided practice with teacher support' },
    2: { phase: 'independent_practice', label_es: 'Práctica Independiente', label_en: 'Independent Practice', focus: 'Independent work, small group activities, peer collaboration' },
    3: { phase: 'mastery', label_es: 'Dominio', label_en: 'Mastery', focus: 'Application, extension activities, deeper understanding' },
    4: { phase: 'assessment', label_es: 'Evaluación', label_en: 'Assessment', focus: 'Formative/summative assessment, reflection, closure' }
  };
  
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

  // AI Day Suggestions handler
  const handleAIDaySuggestions = async (dayIndex) => {
    // Get context from the form
    const objective = activeWeek === 1 ? formData.objective : formData.objective_week2;
    const topic = formData.story || formData.unit;
    const dayPhase = DAY_PHASES[dayIndex];
    const selectedClass = classes.find(c => c.class_id === formData.class_id);
    
    if (!objective && !topic) {
      toast.error(language === 'es' 
        ? 'Primero agrega un objetivo o tema para generar sugerencias' 
        : 'Please add an objective or topic first to generate suggestions');
      return;
    }

    setAiDayLoading(dayIndex);
    
    try {
      const dayLabel = language === 'es' ? dayPhase.label_es : dayPhase.label_en;
      const dayName = t(DAYS[dayIndex]);
      
      const prompt = `Generate 3-4 specific classroom activities for Day ${dayIndex + 1} (${dayName}) of a lesson plan.

CONTEXT:
- Day Phase: ${dayLabel} (${dayPhase.phase})
- Focus for this day: ${dayPhase.focus}
- Lesson Objective: ${objective || 'Not specified'}
- Topic/Unit: ${topic || 'Not specified'}
${selectedClass ? `- Grade: ${selectedClass.grade}` : ''}
${selectedClass?.subject ? `- Subject: ${selectedClass.subject}` : ''}

REQUIREMENTS:
1. Activities should be appropriate for the "${dayPhase.phase}" phase of the week
2. Each activity should be 5-15 minutes
3. Include a mix of individual, pair, and group activities
4. Be specific and actionable (not generic)
5. Include any materials needed

FORMAT each activity as:
🎯 [Activity Name] (X minutes)
   Description: [Brief description]
   Materials: [List materials if needed]

${language === 'es' ? 'Please respond entirely in Spanish.' : 'Please respond in English.'}`;

      const response = await axios.post(`${API}/ai/chat`, {
        message: prompt,
        session_id: `day_suggestions_${formData.class_id || 'new'}_${Date.now()}`,
        language: language,
        context: `Lesson planning for ${topic || 'a new lesson'}`
      }, { withCredentials: true });

      setAiDaySuggestions(prev => ({
        ...prev,
        [dayIndex]: {
          content: response.data.content,
          timestamp: new Date().toISOString()
        }
      }));

      toast.success(language === 'es' 
        ? `Sugerencias para ${dayName} generadas` 
        : `Suggestions for ${dayName} generated`);
      
    } catch (error) {
      console.error('AI day suggestions error:', error);
      if (error.response?.status === 403) {
        toast.error(language === 'es' 
          ? 'Necesitas una suscripción activa para usar el asistente IA' 
          : 'You need an active subscription to use the AI assistant');
      } else {
        toast.error(language === 'es' ? 'Error al generar sugerencias' : 'Error generating suggestions');
      }
    } finally {
      setAiDayLoading(null);
    }
  };

  // Apply AI suggestion to notes
  const applyAISuggestionToNotes = (dayIndex) => {
    const suggestion = aiDaySuggestions[dayIndex];
    if (!suggestion) return;
    
    const currentNotes = getWeekDays(activeWeek)[dayIndex]?.notes || '';
    const newNotes = currentNotes 
      ? `${currentNotes}\n\n--- ${language === 'es' ? 'Sugerencias IA' : 'AI Suggestions'} ---\n${suggestion.content}`
      : `--- ${language === 'es' ? 'Sugerencias IA' : 'AI Suggestions'} ---\n${suggestion.content}`;
    
    updateDay(dayIndex, 'notes', newNotes);
    toast.success(language === 'es' ? 'Sugerencias aplicadas a las notas' : 'Suggestions applied to notes');
  };

  // Generate Full Week AI suggestions
  const handleAIFullWeek = async () => {
    const objective = activeWeek === 1 ? formData.objective : formData.objective_week2;
    const topic = formData.story || formData.unit;
    const selectedClass = classes.find(c => c.class_id === formData.class_id);
    
    if (!objective && !topic) {
      toast.error(language === 'es' 
        ? 'Primero agrega un objetivo o tema para generar el plan semanal' 
        : 'Please add an objective or topic first to generate the weekly plan');
      return;
    }

    setAiFullWeekLoading(true);
    
    try {
      const prompt = `Create a complete 5-day lesson plan with specific activities for each day, following a coherent learning progression.

LESSON CONTEXT:
- Objective: ${objective || 'Not specified'}
- Topic/Unit: ${topic || 'Not specified'}
${selectedClass ? `- Grade: ${selectedClass.grade}` : ''}
${selectedClass?.subject ? `- Subject: ${selectedClass.subject}` : ''}

WEEKLY STRUCTURE (follow this pedagogical progression):

**DAY 1 - INTRODUCTION:**
Focus: Hook students, activate prior knowledge, introduce key vocabulary and concepts
- Include an engaging opener/hook activity
- Pre-assessment or KWL chart
- Introduction of main concepts

**DAY 2 - GUIDED PRACTICE:**
Focus: Teacher modeling, think-alouds, guided practice with scaffolding
- Teacher demonstrates skills/concepts
- Guided practice with the whole class
- Check for understanding activities

**DAY 3 - INDEPENDENT PRACTICE:**
Focus: Student-centered activities, small groups, peer collaboration
- Centers or station activities
- Partner work
- Independent application

**DAY 4 - MASTERY & EXTENSION:**
Focus: Deepen understanding, challenge activities, real-world application
- Higher-order thinking activities
- Extension projects
- Cross-curricular connections

**DAY 5 - ASSESSMENT & REFLECTION:**
Focus: Formative/summative assessment, reflection, celebration of learning
- Assessment activity
- Student self-reflection
- Closure and preview of next unit

FORMAT each day as:
## [DAY NAME] - [PHASE]
🎯 **Activities:**
1. [Activity Name] (X min): [Description]
2. [Activity Name] (X min): [Description]
3. [Activity Name] (X min): [Description]

📚 **Materials:** [List key materials]

✅ **Success Criteria:** [How students show understanding]

---

${language === 'es' ? 'IMPORTANTE: Responde completamente en español.' : 'Please respond in English.'}`;

      const response = await axios.post(`${API}/ai/chat`, {
        message: prompt,
        session_id: `full_week_${formData.class_id || 'new'}_${Date.now()}`,
        language: language,
        context: `Full week lesson planning for ${topic || 'a new lesson'}`
      }, { withCredentials: true });

      const fullContent = response.data.content;
      
      // Parse the response and split by days
      const dayPatterns = [
        /##\s*(LUNES|MONDAY|DAY 1|DÍA 1)[^\n]*\n([\s\S]*?)(?=##\s*(MARTES|TUESDAY|DAY 2|DÍA 2)|$)/i,
        /##\s*(MARTES|TUESDAY|DAY 2|DÍA 2)[^\n]*\n([\s\S]*?)(?=##\s*(MIÉRCOLES|WEDNESDAY|DAY 3|DÍA 3)|$)/i,
        /##\s*(MIÉRCOLES|WEDNESDAY|DAY 3|DÍA 3)[^\n]*\n([\s\S]*?)(?=##\s*(JUEVES|THURSDAY|DAY 4|DÍA 4)|$)/i,
        /##\s*(JUEVES|THURSDAY|DAY 4|DÍA 4)[^\n]*\n([\s\S]*?)(?=##\s*(VIERNES|FRIDAY|DAY 5|DÍA 5)|$)/i,
        /##\s*(VIERNES|FRIDAY|DAY 5|DÍA 5)[^\n]*\n([\s\S]*?)$/i
      ];

      const newSuggestions = {};
      
      dayPatterns.forEach((pattern, index) => {
        const match = fullContent.match(pattern);
        if (match) {
          newSuggestions[index] = {
            content: match[2].trim(),
            timestamp: new Date().toISOString(),
            isFullWeek: true
          };
        }
      });

      // If parsing didn't work well, split by simple markers
      if (Object.keys(newSuggestions).length < 3) {
        // Fallback: split content roughly into 5 parts
        const sections = fullContent.split(/(?=##\s*(?:DAY|DÍA|LUNES|MARTES|MIÉRCOLES|JUEVES|VIERNES|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY))/i);
        sections.forEach((section, index) => {
          if (index < 5 && section.trim()) {
            newSuggestions[index] = {
              content: section.trim(),
              timestamp: new Date().toISOString(),
              isFullWeek: true
            };
          }
        });
      }

      // If still not enough, put everything in day 0 and partial content in others
      if (Object.keys(newSuggestions).length === 0) {
        const contentParts = fullContent.split('\n\n');
        const partSize = Math.ceil(contentParts.length / 5);
        for (let i = 0; i < 5; i++) {
          const start = i * partSize;
          const end = start + partSize;
          const dayContent = contentParts.slice(start, end).join('\n\n');
          if (dayContent.trim()) {
            newSuggestions[i] = {
              content: dayContent.trim(),
              timestamp: new Date().toISOString(),
              isFullWeek: true
            };
          }
        }
      }

      setAiDaySuggestions(newSuggestions);

      toast.success(language === 'es' 
        ? '¡Plan semanal completo generado! Revisa cada día.' 
        : 'Full weekly plan generated! Review each day.');
      
    } catch (error) {
      console.error('AI full week error:', error);
      if (error.response?.status === 403) {
        toast.error(language === 'es' 
          ? 'Necesitas una suscripción activa para usar el asistente IA' 
          : 'You need an active subscription to use the AI assistant');
      } else {
        toast.error(language === 'es' ? 'Error al generar el plan semanal' : 'Error generating weekly plan');
      }
    } finally {
      setAiFullWeekLoading(false);
    }
  };

  // Apply all AI suggestions to notes
  const applyAllSuggestionsToNotes = () => {
    Object.keys(aiDaySuggestions).forEach(dayIndex => {
      const suggestion = aiDaySuggestions[dayIndex];
      if (suggestion) {
        const idx = parseInt(dayIndex);
        const currentNotes = getWeekDays(activeWeek)[idx]?.notes || '';
        const newNotes = currentNotes 
          ? `${currentNotes}\n\n--- ${language === 'es' ? 'Sugerencias IA' : 'AI Suggestions'} ---\n${suggestion.content}`
          : `--- ${language === 'es' ? 'Sugerencias IA' : 'AI Suggestions'} ---\n${suggestion.content}`;
        updateDay(idx, 'notes', newNotes);
      }
    });
    toast.success(language === 'es' ? 'Todas las sugerencias aplicadas' : 'All suggestions applied');
  };

  // ==================== AI TEMPLATES ====================
  
  // Fetch templates
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      // Fetch both user templates and starter templates in parallel
      const [userResponse, starterResponse] = await Promise.all([
        axios.get(`${API}/ai/templates`, { withCredentials: true }),
        axios.get(`${API}/ai/templates/starters`)
      ]);
      setTemplates(userResponse.data);
      setStarterTemplates(starterResponse.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error(language === 'es' ? 'Error al cargar plantillas' : 'Error loading templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Save current AI suggestions as template
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast.error(language === 'es' ? 'El nombre es requerido' : 'Name is required');
      return;
    }

    if (Object.keys(aiDaySuggestions).length === 0) {
      toast.error(language === 'es' ? 'No hay sugerencias para guardar' : 'No suggestions to save');
      return;
    }

    try {
      const selectedClass = classes.find(c => c.class_id === formData.class_id);
      const days = {};
      Object.keys(aiDaySuggestions).forEach(key => {
        days[key] = aiDaySuggestions[key].content;
      });

      await axios.post(`${API}/ai/templates`, {
        name: templateForm.name,
        description: templateForm.description,
        subject: selectedClass?.subject || '',
        grade_level: selectedClass?.grade || '',
        original_topic: formData.story || formData.unit || formData.objective || '',
        tags: templateForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        days: days
      }, { withCredentials: true });

      toast.success(language === 'es' ? '¡Plantilla guardada!' : 'Template saved!');
      setShowSaveTemplateModal(false);
      setTemplateForm({ name: '', description: '', tags: '' });
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error(language === 'es' ? 'Error al guardar plantilla' : 'Error saving template');
    }
  };

  // Delete a template
  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar esta plantilla?' : 'Delete this template?')) {
      return;
    }

    try {
      await axios.delete(`${API}/ai/templates/${templateId}`, { withCredentials: true });
      setTemplates(prev => prev.filter(t => t.template_id !== templateId));
      toast.success(language === 'es' ? 'Plantilla eliminada' : 'Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error(language === 'es' ? 'Error al eliminar' : 'Error deleting');
    }
  };

  // Apply template directly (without customization)
  const handleApplyTemplate = async (template) => {
    try {
      const response = await axios.get(`${API}/ai/templates/${template.template_id}`, { withCredentials: true });
      const fullTemplate = response.data;
      
      // Convert days object to our format
      const newSuggestions = {};
      Object.keys(fullTemplate.days).forEach(key => {
        newSuggestions[parseInt(key)] = {
          content: fullTemplate.days[key],
          timestamp: new Date().toISOString(),
          isTemplate: true
        };
      });

      setAiDaySuggestions(newSuggestions);
      setShowTemplatesModal(false);
      toast.success(language === 'es' 
        ? `Plantilla "${template.name}" aplicada` 
        : `Template "${template.name}" applied`);
    } catch (error) {
      console.error('Error applying template:', error);
      toast.error(language === 'es' ? 'Error al aplicar plantilla' : 'Error applying template');
    }
  };

  // Customize template with new topic
  const handleCustomizeTemplate = async (newTopic) => {
    if (!selectedTemplate || !newTopic.trim()) {
      toast.error(language === 'es' ? 'Ingresa un nuevo tema' : 'Please enter a new topic');
      return;
    }

    setCustomizeLoading(true);
    try {
      const selectedClass = classes.find(c => c.class_id === formData.class_id);
      
      const response = await axios.post(`${API}/ai/templates/${selectedTemplate.template_id}/customize`, {
        new_topic: newTopic,
        new_grade: selectedClass?.grade || selectedTemplate.grade_level,
        new_subject: selectedClass?.subject || selectedTemplate.subject,
        language: language
      }, { withCredentials: true });

      // Apply customized content
      const newSuggestions = {};
      Object.keys(response.data.customized_days).forEach(key => {
        newSuggestions[parseInt(key)] = {
          content: response.data.customized_days[key].content,
          timestamp: new Date().toISOString(),
          isCustomized: true
        };
      });

      setAiDaySuggestions(newSuggestions);
      setShowTemplatesModal(false);
      setSelectedTemplate(null);
      toast.success(language === 'es' 
        ? '¡Plantilla personalizada aplicada!' 
        : 'Customized template applied!');
    } catch (error) {
      console.error('Error customizing template:', error);
      if (error.response?.status === 403) {
        toast.error(language === 'es' 
          ? 'Necesitas una suscripción activa' 
          : 'You need an active subscription');
      } else {
        toast.error(language === 'es' ? 'Error al personalizar' : 'Error customizing');
      }
    } finally {
      setCustomizeLoading(false);
    }
  };

  // Open templates modal
  const openTemplatesModal = () => {
    setShowTemplatesModal(true);
    fetchTemplates();
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
            {/* Templates Button */}
            <Button 
              variant="outline" 
              onClick={openTemplatesModal}
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
              data-testid="templates-btn"
            >
              <Layers className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Plantillas' : 'Templates'}
            </Button>
            
            {/* Save as Template Button (shown when there are AI suggestions) */}
            {Object.keys(aiDaySuggestions).length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowSaveTemplateModal(true)}
                className="border-green-200 text-green-700 hover:bg-green-50"
                data-testid="save-template-btn"
              >
                <Star className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Guardar plantilla' : 'Save Template'}
              </Button>
            )}
            
            {/* AI Generate Button */}
            <Button 
              variant="outline" 
              onClick={() => setShowAIModal(true)}
              className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-blue-100"
              data-testid="ai-generate-btn"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Generar con IA' : 'Generate with AI'}
            </Button>
            
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

        {/* AI Generation Modal */}
        <Dialog open={showAIModal} onOpenChange={setShowAIModal}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                {language === 'es' ? 'Generar Plan con IA' : 'Generate Plan with AI'}
              </DialogTitle>
              <DialogDescription>
                {language === 'es' 
                  ? 'Describe tu lección y la IA generará un plan basado en estándares.' 
                  : 'Describe your lesson and AI will generate a standards-based plan.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Materia' : 'Subject'}</Label>
                  <Select 
                    value={aiForm.subject} 
                    onValueChange={(v) => setAIForm(prev => ({ ...prev, subject: v }))}
                  >
                    <SelectTrigger data-testid="ai-modal-subject">
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_SUBJECTS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Grado' : 'Grade Level'}</Label>
                  <Select 
                    value={aiForm.grade_level} 
                    onValueChange={(v) => setAIForm(prev => ({ ...prev, grade_level: v }))}
                  >
                    <SelectTrigger data-testid="ai-modal-grade">
                      <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Tema de la Lección' : 'Lesson Topic'}</Label>
                <Input
                  value={aiForm.topic}
                  onChange={(e) => setAIForm(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder={language === 'es' ? 'Ej: Fracciones equivalentes' : 'E.g., Equivalent fractions'}
                  data-testid="ai-modal-topic"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Estándares' : 'Standards'}</Label>
                  <Select 
                    value={aiForm.standards_framework} 
                    onValueChange={(v) => setAIForm(prev => ({ ...prev, standards_framework: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">{language === 'es' ? 'CC + PR' : 'CC + PR'}</SelectItem>
                      <SelectItem value="common_core">Common Core</SelectItem>
                      <SelectItem value="pr_core">Puerto Rico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Dificultad' : 'Difficulty'}</Label>
                  <Select 
                    value={aiForm.difficulty_level} 
                    onValueChange={(v) => setAIForm(prev => ({ ...prev, difficulty_level: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">{language === 'es' ? 'Fácil' : 'Easy'}</SelectItem>
                      <SelectItem value="medium">{language === 'es' ? 'Medio' : 'Medium'}</SelectItem>
                      <SelectItem value="hard">{language === 'es' ? 'Difícil' : 'Hard'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Duración (minutos)' : 'Duration (minutes)'}</Label>
                <Input
                  type="number"
                  value={aiForm.duration_minutes}
                  onChange={(e) => setAIForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 45 }))}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowAIModal(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleAIGenerate} 
                disabled={aiGenerating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                data-testid="ai-modal-generate"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {language === 'es' ? 'Generando...' : 'Generating...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Generar Plan' : 'Generate Plan'}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Templates Browser Modal */}
        <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-600" />
                {language === 'es' ? 'Mis Plantillas de IA' : 'My AI Templates'}
              </DialogTitle>
              <DialogDescription>
                {language === 'es' 
                  ? 'Reutiliza planes de lección exitosos con nuevos temas' 
                  : 'Reuse successful lesson plans with new topics'}
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="h-[400px] pr-4">
              {templatesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">
                    {language === 'es' ? 'No tienes plantillas guardadas' : 'No saved templates'}
                  </p>
                  <p className="text-sm mt-1">
                    {language === 'es' 
                      ? 'Genera un plan semanal con IA y guárdalo como plantilla' 
                      : 'Generate a weekly plan with AI and save it as a template'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(template => (
                    <div 
                      key={template.template_id}
                      className={`p-4 rounded-lg border transition-all ${
                        selectedTemplate?.template_id === template.template_id
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedTemplate(
                            selectedTemplate?.template_id === template.template_id ? null : template
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-800">{template.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {template.days_count} {language === 'es' ? 'días' : 'days'}
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="text-sm text-slate-500 mt-1">{template.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            {template.subject && (
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {template.subject}
                              </span>
                            )}
                            {template.grade_level && (
                              <span>{language === 'es' ? 'Grado' : 'Grade'} {template.grade_level}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(template.created_at).toLocaleDateString()}
                            </span>
                            {template.use_count > 0 && (
                              <span>{template.use_count}x {language === 'es' ? 'usado' : 'used'}</span>
                            )}
                          </div>
                          {template.original_topic && (
                            <p className="text-xs text-slate-400 mt-1 italic">
                              {language === 'es' ? 'Tema original:' : 'Original topic:'} {template.original_topic}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.template_id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Customization panel when selected */}
                      {selectedTemplate?.template_id === template.template_id && (
                        <div className="mt-4 pt-4 border-t border-amber-200 space-y-3">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApplyTemplate(template)}
                              className="flex-1"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              {language === 'es' ? 'Aplicar tal cual' : 'Apply as-is'}
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">
                              {language === 'es' ? 'O personalizar para nuevo tema:' : 'Or customize for new topic:'}
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                id={`customize-topic-${template.template_id}`}
                                placeholder={language === 'es' ? 'Ej: Multiplicación de decimales' : 'E.g., Decimal multiplication'}
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={() => {
                                  const input = document.getElementById(`customize-topic-${template.template_id}`);
                                  handleCustomizeTemplate(input?.value || '');
                                }}
                                disabled={customizeLoading}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                {customizeLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Wand2 className="h-4 w-4 mr-1" />
                                    {language === 'es' ? 'Adaptar' : 'Adapt'}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTemplatesModal(false)}>
                {language === 'es' ? 'Cerrar' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save Template Modal */}
        <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-green-600" />
                {language === 'es' ? 'Guardar como Plantilla' : 'Save as Template'}
              </DialogTitle>
              <DialogDescription>
                {language === 'es' 
                  ? 'Guarda este plan para reutilizarlo con diferentes temas' 
                  : 'Save this plan to reuse with different topics'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Nombre de la plantilla *' : 'Template name *'}</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={language === 'es' ? 'Ej: Plan de Fracciones - 4to Grado' : 'E.g., Fractions Plan - 4th Grade'}
                  data-testid="template-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Descripción' : 'Description'}</Label>
                <Textarea
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={language === 'es' 
                    ? 'Describe brevemente qué hace exitosa esta estructura de lección...' 
                    : 'Briefly describe what makes this lesson structure successful...'}
                  className="h-20"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === 'es' ? 'Etiquetas (separadas por coma)' : 'Tags (comma separated)'}</Label>
                <Input
                  value={templateForm.tags}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder={language === 'es' ? 'Ej: matemáticas, fracciones, manipulativos' : 'E.g., math, fractions, hands-on'}
                />
              </div>
              
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
                <p className="font-medium mb-1">
                  {language === 'es' ? 'Se guardará:' : 'Will save:'}
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>{Object.keys(aiDaySuggestions).length} {language === 'es' ? 'días de actividades' : 'days of activities'}</li>
                  {formData.story && <li>{language === 'es' ? 'Tema:' : 'Topic:'} {formData.story}</li>}
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button onClick={handleSaveTemplate} className="bg-green-600 hover:bg-green-700">
                <Star className="h-4 w-4 mr-2" />
                {language === 'es' ? 'Guardar Plantilla' : 'Save Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
            <div className="flex items-center justify-between flex-wrap gap-3">
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
              <div className="flex items-center gap-2">
                {/* Generate Full Week Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIFullWeek}
                  disabled={aiFullWeekLoading}
                  className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-indigo-100"
                  data-testid="ai-full-week-btn"
                >
                  {aiFullWeekLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'es' ? 'Generando semana...' : 'Generating week...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Generar semana completa' : 'Generate Full Week'}
                    </>
                  )}
                </Button>
                
                {/* Apply All Button (shown when there are suggestions) */}
                {Object.keys(aiDaySuggestions).length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyAllSuggestionsToNotes}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    data-testid="apply-all-suggestions-btn"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {language === 'es' ? 'Aplicar todo' : 'Apply All'}
                  </Button>
                )}
                
                {/* Clear All Suggestions */}
                {Object.keys(aiDaySuggestions).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiDaySuggestions({})}
                    className="text-slate-500 hover:text-slate-700"
                    data-testid="clear-all-suggestions-btn"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                
                <div className="flex gap-1 ml-2">
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
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={String(activeDay)} onValueChange={(v) => setActiveDay(Number(v))}>
              <TabsList className="grid grid-cols-5 mb-4">
                {DAYS.map((day, i) => (
                  <TabsTrigger 
                    key={day} 
                    value={String(i)}
                    className={`text-xs md:text-sm relative ${aiDaySuggestions[i] ? 'pr-6' : ''}`}
                    data-testid={`day-tab-${day}`}
                  >
                    {t(day).slice(0, 3)}
                    {aiDaySuggestions[i] && (
                      <span className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {DAYS.map((day, dayIndex) => {
                // Get the current week's days
                const weekDays = getWeekDays(activeWeek);
                const currentDay = weekDays[dayIndex] || {};
                
                return (
                <TabsContent key={day} value={String(dayIndex)} className="space-y-4">
                  {/* Day Header with Phase Badge and AI Button */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          dayIndex === 0 ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          dayIndex === 4 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {language === 'es' ? DAY_PHASES[dayIndex].label_es : DAY_PHASES[dayIndex].label_en}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {language === 'es' ? DAY_PHASES[dayIndex].focus.split(',')[0] : DAY_PHASES[dayIndex].focus.split(',')[0]}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAIDaySuggestions(dayIndex)}
                      disabled={aiDayLoading === dayIndex}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      data-testid={`ai-suggest-day-${dayIndex}`}
                    >
                      {aiDayLoading === dayIndex ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          {language === 'es' ? 'Generando...' : 'Generating...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          {language === 'es' ? 'Sugerir actividades' : 'Suggest activities'}
                        </>
                      )}
                    </Button>
                  </div>

                  {/* AI Suggestions Panel (if available) */}
                  {aiDaySuggestions[dayIndex] && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">
                            {language === 'es' ? 'Sugerencias de IA' : 'AI Suggestions'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyAISuggestionToNotes(dayIndex)}
                            className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-100"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {language === 'es' ? 'Aplicar a notas' : 'Apply to notes'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAiDaySuggestions(prev => {
                              const newSuggestions = { ...prev };
                              delete newSuggestions[dayIndex];
                              return newSuggestions;
                            })}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {aiDaySuggestions[dayIndex].content}
                      </div>
                    </div>
                  )}

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
