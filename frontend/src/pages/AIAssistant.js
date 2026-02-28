import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Layout from '../components/Layout';
import ReactMarkdown from 'react-markdown';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  Sparkles, BookOpen, FileQuestion, FileText, Lightbulb, ClipboardList,
  MessageSquare, Send, Loader2, Copy, Download, Trash2, Save,
  GraduationCap, Target, Clock, ChevronRight, Bot, User, RefreshCw, Printer, FolderOpen
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AIAssistant = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [currentGenerationId, setCurrentGenerationId] = useState(() => {
    // Restore the current generation ID from sessionStorage
    return sessionStorage.getItem('ai_current_generation_id') || null;
  });
  const [generations, setGenerations] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSessionId, setChatSessionId] = useState('');
  const chatEndRef = useRef(null);

  // Generation form state
  const [genForm, setGenForm] = useState({
    tool_type: 'lesson_plan',
    subject: '',
    grade_level: '',
    topic: '',
    standards_framework: 'both',
    language: language,
    difficulty_level: 'medium',
    duration_minutes: 45,
    num_questions: 10,
    additional_instructions: ''
  });

  const tools = [
    { 
      id: 'lesson_plan', 
      name: language === 'es' ? 'Plan de Lección' : 'Lesson Plan',
      icon: BookOpen,
      desc: language === 'es' ? 'Genera planes de lección completos' : 'Generate complete lesson plans',
      color: 'text-green-600 bg-green-100'
    },
    { 
      id: 'quiz', 
      name: language === 'es' ? 'Examen/Quiz' : 'Quiz/Test',
      icon: FileQuestion,
      desc: language === 'es' ? 'Crea evaluaciones con respuestas' : 'Create assessments with answers',
      color: 'text-blue-600 bg-blue-100'
    },
    { 
      id: 'summary', 
      name: language === 'es' ? 'Resumen del Tema' : 'Topic Summary',
      icon: FileText,
      desc: language === 'es' ? 'Obtén resúmenes detallados' : 'Get detailed topic summaries',
      color: 'text-purple-600 bg-purple-100'
    },
    { 
      id: 'activities', 
      name: language === 'es' ? 'Ideas de Actividades' : 'Activity Ideas',
      icon: Lightbulb,
      desc: language === 'es' ? 'Actividades creativas para clase' : 'Creative classroom activities',
      color: 'text-orange-600 bg-orange-100'
    },
    { 
      id: 'worksheet', 
      name: language === 'es' ? 'Hoja de Trabajo' : 'Worksheet',
      icon: ClipboardList,
      desc: language === 'es' ? 'Genera hojas de práctica' : 'Generate practice worksheets',
      color: 'text-pink-600 bg-pink-100'
    }
  ];

  const subjects = [
    { value: 'math', label: language === 'es' ? 'Matemáticas' : 'Mathematics' },
    { value: 'ela', label: language === 'es' ? 'Inglés/Lectura' : 'English/Reading' },
    { value: 'spanish', label: language === 'es' ? 'Español' : 'Spanish' },
    { value: 'science', label: language === 'es' ? 'Ciencias' : 'Science' },
    { value: 'social_studies', label: language === 'es' ? 'Estudios Sociales' : 'Social Studies' },
    { value: 'art', label: language === 'es' ? 'Arte' : 'Art' },
    { value: 'music', label: language === 'es' ? 'Música' : 'Music' },
    { value: 'physical_education', label: language === 'es' ? 'Educación Física' : 'Physical Education' },
    { value: 'health', label: language === 'es' ? 'Salud' : 'Health' },
    { value: 'technology', label: language === 'es' ? 'Tecnología' : 'Technology' }
  ];

  const gradeLevels = [
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

  useEffect(() => {
    // Initialize chat session ID
    if (!chatSessionId) {
      setChatSessionId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    // Load user's generations
    loadGenerations();
  }, []);

  // Restore the current generation content when generations are loaded
  useEffect(() => {
    if (generations.length > 0 && currentGenerationId && !generatedContent) {
      const currentGen = generations.find(g => g.generation_id === currentGenerationId);
      if (currentGen) {
        setGeneratedContent(currentGen.content);
        setGenForm(prev => ({
          ...prev,
          tool_type: currentGen.tool_type,
          subject: currentGen.subject,
          grade_level: currentGen.grade_level,
          topic: currentGen.topic
        }));
      }
    } else if (generations.length > 0 && !generatedContent && !currentGenerationId) {
      // Load the most recent generation if no specific one is selected
      const mostRecent = generations[0];
      if (mostRecent) {
        setGeneratedContent(mostRecent.content);
        setCurrentGenerationId(mostRecent.generation_id);
        sessionStorage.setItem('ai_current_generation_id', mostRecent.generation_id);
        setGenForm(prev => ({
          ...prev,
          tool_type: mostRecent.tool_type,
          subject: mostRecent.subject,
          grade_level: mostRecent.grade_level,
          topic: mostRecent.topic
        }));
      }
    }
  }, [generations]);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadGenerations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/ai/generations`, {
        withCredentials: true
      });
      setGenerations(response.data);
    } catch (error) {
      console.error('Failed to load generations:', error);
    }
  };

  const handleGenerate = async () => {
    if (!genForm.subject || !genForm.grade_level || !genForm.topic) {
      toast.error(language === 'es' ? 'Por favor completa todos los campos requeridos' : 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setGeneratedContent('');

    try {
      const response = await axios.post(`${API_URL}/api/ai/generate`, genForm, {
        withCredentials: true
      });

      setGeneratedContent(response.data.content);
      // Save the generation ID for persistence
      if (response.data.generation_id) {
        setCurrentGenerationId(response.data.generation_id);
        sessionStorage.setItem('ai_current_generation_id', response.data.generation_id);
      }
      toast.success(language === 'es' ? '¡Contenido generado!' : 'Content generated!');
      loadGenerations();
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage, created_at: new Date().toISOString() }]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        message: userMessage,
        session_id: chatSessionId,
        language: language
      }, {
        withCredentials: true
      });

      setChatMessages(prev => [...prev, { role: 'assistant', content: response.data.content, created_at: response.data.created_at }]);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message);
      setChatMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'es' ? '¡Copiado!' : 'Copied!');
  };

  const handlePrint = (content, metadata = {}) => {
    // Get tool type label
    const toolLabels = {
      lesson_plan: language === 'es' ? 'Plan de Lección' : 'Lesson Plan',
      quiz: language === 'es' ? 'Examen/Quiz' : 'Quiz/Assessment',
      summary: language === 'es' ? 'Resumen del Tema' : 'Topic Summary',
      activities: language === 'es' ? 'Ideas de Actividades' : 'Activity Ideas',
      worksheet: language === 'es' ? 'Hoja de Trabajo' : 'Worksheet'
    };

    const toolType = metadata.tool_type || genForm.tool_type;
    const subject = metadata.subject || genForm.subject || '';
    const gradeLevel = metadata.grade_level || genForm.grade_level || '';
    const topic = metadata.topic || genForm.topic || '';
    const toolLabel = toolLabels[toolType] || toolType;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Convert markdown to HTML for printing (simple conversion)
    const htmlContent = content
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 16px; font-weight: 600; margin: 16px 0 8px 0; color: #1e293b;">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 style="font-size: 18px; font-weight: 600; margin: 20px 0 10px 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="font-size: 22px; font-weight: 700; margin: 24px 0 12px 0; color: #0f172a;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li style="margin: 4px 0; margin-left: 20px;">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li style="margin: 4px 0; margin-left: 20px; list-style-type: decimal;">$1</li>')
      .replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">')
      .replace(/\n\n/g, '</p><p style="margin: 12px 0;">')
      .replace(/\n/g, '<br>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${toolLabel} - ${topic || 'TeacherHubPro'}</title>
        <style>
          @media print {
            body { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print { display: none !important; }
            @page { margin: 0.75in; }
          }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #1e293b;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #10b981;
          }
          .header-left h1 {
            font-size: 24px;
            font-weight: 700;
            color: #10b981;
            margin: 0 0 4px 0;
          }
          .header-left p {
            font-size: 12px;
            color: #64748b;
            margin: 0;
          }
          .meta-info {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            background: #f8fafc;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 10pt;
          }
          .meta-item {
            display: flex;
            flex-direction: column;
          }
          .meta-label {
            font-weight: 600;
            color: #64748b;
            font-size: 9pt;
            text-transform: uppercase;
          }
          .meta-value {
            color: #1e293b;
          }
          .content {
            font-size: 11pt;
          }
          .content h1 { font-size: 18pt; color: #0f172a; margin: 20px 0 12px 0; }
          .content h2 { font-size: 14pt; color: #1e293b; margin: 18px 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          .content h3 { font-size: 12pt; color: #334155; margin: 14px 0 8px 0; }
          .content ul, .content ol { margin: 8px 0; padding-left: 24px; }
          .content li { margin: 4px 0; }
          .content p { margin: 10px 0; }
          .content hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
          .content strong { font-weight: 600; }
          .footer {
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 9pt;
            color: #94a3b8;
          }
          .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
          }
          .print-btn:hover { background: #059669; }
        </style>
      </head>
      <body>
        <button class="print-btn no-print" onclick="window.print()">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          ${language === 'es' ? 'Imprimir / Guardar PDF' : 'Print / Save PDF'}
        </button>

        <div class="header">
          <div class="header-left">
            <h1>TeacherHubPro</h1>
            <p>${language === 'es' ? 'Generado con Asistente de IA' : 'Generated with AI Assistant'}</p>
          </div>
          <div style="text-align: right; font-size: 10pt; color: #64748b;">
            <div style="font-weight: 600; color: #7c3aed;">${toolLabel}</div>
            <div>${new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        ${(subject || gradeLevel || topic) ? `
        <div class="meta-info">
          ${subject ? `<div class="meta-item"><span class="meta-label">${language === 'es' ? 'Materia' : 'Subject'}</span><span class="meta-value">${subject}</span></div>` : ''}
          ${gradeLevel ? `<div class="meta-item"><span class="meta-label">${language === 'es' ? 'Grado' : 'Grade'}</span><span class="meta-value">${gradeLevel}</span></div>` : ''}
          ${topic ? `<div class="meta-item"><span class="meta-label">${language === 'es' ? 'Tema' : 'Topic'}</span><span class="meta-value">${topic}</span></div>` : ''}
        </div>
        ` : ''}

        <div class="content">
          ${htmlContent}
        </div>

        <div class="footer">
          ${language === 'es' 
            ? 'Creado con TeacherHubPro - Asistente de IA para Maestros' 
            : 'Created with TeacherHubPro - AI Assistant for Teachers'}
          <br>
          © ${new Date().getFullYear()} TeacherHubPro
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    
    // Focus and trigger print after content loads
    printWindow.onload = () => {
      printWindow.focus();
    };
  };

  const startNewChat = () => {
    setChatMessages([]);
    setChatSessionId(`chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  };

  const selectedTool = tools.find(t => t.id === genForm.tool_type);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
            <Sparkles className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'es' ? 'Asistente de IA para Maestros' : 'AI Teaching Assistant'}
            </h1>
            <p className="text-white/80">
              {language === 'es' 
                ? 'Genera materiales basados en Estándares Nacionales, al instante.' 
                : 'Generate materials based on National Standards, instantly.'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{generations.length}</div>
            <div className="text-xs text-white/70">{language === 'es' ? 'Generaciones' : 'Generations'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">5</div>
            <div className="text-xs text-white/70">{language === 'es' ? 'Herramientas' : 'Tools'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">CC + PR</div>
            <div className="text-xs text-white/70">{language === 'es' ? 'Estándares' : 'Standards'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">ES/EN</div>
            <div className="text-xs text-white/70">{language === 'es' ? 'Bilingüe' : 'Bilingual'}</div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="generate" className="gap-2" data-testid="ai-generate-tab">
            <Sparkles className="h-4 w-4" />
            {language === 'es' ? 'Generar' : 'Generate'}
          </TabsTrigger>
          <TabsTrigger value="chat" className="gap-2" data-testid="ai-chat-tab">
            <MessageSquare className="h-4 w-4" />
            {language === 'es' ? 'Chat' : 'Chat'}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2" data-testid="ai-history-tab">
            <History className="h-4 w-4" />
            {language === 'es' ? 'Historial' : 'History'}
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Tool Selection & Form */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {language === 'es' ? 'Selecciona Herramienta' : 'Select Tool'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setGenForm({ ...genForm, tool_type: tool.id })}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        genForm.tool_type === tool.id 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tool.color}`}>
                        <tool.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-sm">{tool.name}</div>
                        <div className="text-xs text-slate-500">{tool.desc}</div>
                      </div>
                      {genForm.tool_type === tool.id && (
                        <ChevronRight className="h-4 w-4 ml-auto text-purple-500" />
                      )}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Form Fields */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedTool && <selectedTool.icon className="h-5 w-5" />}
                    {selectedTool?.name}
                  </CardTitle>
                  <CardDescription>{selectedTool?.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>{language === 'es' ? 'Materia *' : 'Subject *'}</Label>
                    <Select value={genForm.subject} onValueChange={(v) => setGenForm({ ...genForm, subject: v })}>
                      <SelectTrigger data-testid="ai-subject-select">
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{language === 'es' ? 'Grado *' : 'Grade Level *'}</Label>
                    <Select value={genForm.grade_level} onValueChange={(v) => setGenForm({ ...genForm, grade_level: v })}>
                      <SelectTrigger data-testid="ai-grade-select">
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {gradeLevels.map(g => (
                          <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{language === 'es' ? 'Tema *' : 'Topic *'}</Label>
                    <Input
                      value={genForm.topic}
                      onChange={(e) => setGenForm({ ...genForm, topic: e.target.value })}
                      placeholder={language === 'es' ? 'Ej: Fracciones equivalentes' : 'E.g., Equivalent fractions'}
                      data-testid="ai-topic-input"
                    />
                  </div>

                  <div>
                    <Label>{language === 'es' ? 'Estándares' : 'Standards Framework'}</Label>
                    <Select value={genForm.standards_framework} onValueChange={(v) => setGenForm({ ...genForm, standards_framework: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">{language === 'es' ? 'Ambos (CC + PR)' : 'Both (CC + PR)'}</SelectItem>
                        <SelectItem value="common_core">Common Core</SelectItem>
                        <SelectItem value="pr_core">Puerto Rico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{language === 'es' ? 'Dificultad' : 'Difficulty'}</Label>
                      <Select value={genForm.difficulty_level} onValueChange={(v) => setGenForm({ ...genForm, difficulty_level: v })}>
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
                    <div>
                      <Label>{language === 'es' ? 'Idioma' : 'Language'}</Label>
                      <Select value={genForm.language} onValueChange={(v) => setGenForm({ ...genForm, language: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {genForm.tool_type === 'lesson_plan' && (
                    <div>
                      <Label>{language === 'es' ? 'Duración (minutos)' : 'Duration (minutes)'}</Label>
                      <Input
                        type="number"
                        value={genForm.duration_minutes}
                        onChange={(e) => setGenForm({ ...genForm, duration_minutes: parseInt(e.target.value) || 45 })}
                      />
                    </div>
                  )}

                  {genForm.tool_type === 'quiz' && (
                    <div>
                      <Label>{language === 'es' ? 'Número de preguntas' : 'Number of questions'}</Label>
                      <Input
                        type="number"
                        value={genForm.num_questions}
                        onChange={(e) => setGenForm({ ...genForm, num_questions: parseInt(e.target.value) || 10 })}
                      />
                    </div>
                  )}

                  <div>
                    <Label>{language === 'es' ? 'Instrucciones adicionales' : 'Additional instructions'}</Label>
                    <Textarea
                      value={genForm.additional_instructions}
                      onChange={(e) => setGenForm({ ...genForm, additional_instructions: e.target.value })}
                      placeholder={language === 'es' ? 'Opcional: agregar detalles específicos...' : 'Optional: add specific details...'}
                      rows={2}
                    />
                  </div>

                  <Button 
                    onClick={handleGenerate} 
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                    disabled={isLoading}
                    data-testid="ai-generate-btn"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {language === 'es' ? 'Generando...' : 'Generating...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {language === 'es' ? 'Generar Contenido' : 'Generate Content'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Generated Content */}
            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 flex flex-row items-center justify-between flex-shrink-0">
                  <CardTitle className="text-lg">
                    {language === 'es' ? 'Contenido Generado' : 'Generated Content'}
                  </CardTitle>
                  {generatedContent && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(generatedContent)}
                        title={language === 'es' ? 'Copiar' : 'Copy'}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handlePrint(generatedContent)}
                        title={language === 'es' ? 'Imprimir / PDF' : 'Print / PDF'}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin mb-3" />
                      <p>{language === 'es' ? 'Generando contenido...' : 'Generating content...'}</p>
                    </div>
                  ) : generatedContent ? (
                    <div className="prose prose-sm max-w-none h-full max-h-[calc(100vh-400px)] min-h-[400px] overflow-y-auto bg-slate-50 p-4 rounded-lg">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <Target className="h-12 w-12 mb-3" />
                      <p className="text-center">
                        {language === 'es' 
                          ? 'El contenido generado aparecerá aquí' 
                          : 'Generated content will appear here'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-purple-600" />
                  {language === 'es' ? 'Chat con Asistente de IA' : 'Chat with AI Assistant'}
                </CardTitle>
                <CardDescription>
                  {language === 'es' 
                    ? 'Pregúntame sobre planificación, estándares, estrategias de enseñanza...' 
                    : 'Ask me about planning, standards, teaching strategies...'}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={startNewChat} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                {language === 'es' ? 'Nueva conversación' : 'New chat'}
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare className="h-16 w-16 mb-4" />
                  <p className="text-lg font-medium mb-2">
                    {language === 'es' ? '¡Hola! Soy tu asistente de IA.' : 'Hi! I\'m your AI assistant.'}
                  </p>
                  <p className="text-center max-w-md">
                    {language === 'es' 
                      ? 'Puedo ayudarte con planificación de lecciones, estrategias de enseñanza, y preguntas sobre estándares.' 
                      : 'I can help you with lesson planning, teaching strategies, and questions about standards.'}
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {[
                      language === 'es' ? '¿Cómo enseño fracciones?' : 'How do I teach fractions?',
                      language === 'es' ? 'Ideas para actividades de lectura' : 'Ideas for reading activities',
                      language === 'es' ? '¿Qué dice el estándar CCSS.MATH.4.NF?' : 'What does CCSS.MATH.4.NF say?',
                      language === 'es' ? 'Estrategias de diferenciación' : 'Differentiation strategies'
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(suggestion)}
                        className="text-left p-3 bg-slate-100 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-slate">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-slate-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </CardContent>
            <div className="border-t p-4">
              <form onSubmit={handleChat} className="flex gap-3">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={language === 'es' ? 'Escribe tu pregunta...' : 'Type your question...'}
                  className="flex-1"
                  disabled={isLoading}
                  data-testid="ai-chat-input"
                />
                <Button type="submit" disabled={isLoading || !chatInput.trim()} data-testid="ai-chat-send">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'es' ? 'Historial de Generaciones' : 'Generation History'}</CardTitle>
              <CardDescription>
                {language === 'es' 
                  ? 'Tus contenidos generados anteriormente' 
                  : 'Your previously generated content'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generations.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="h-12 w-12 mx-auto mb-3" />
                  <p>{language === 'es' ? 'No hay generaciones aún' : 'No generations yet'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generations.map((gen) => {
                    const tool = tools.find(t => t.id === gen.tool_type);
                    return (
                      <div
                        key={gen.generation_id}
                        className={`flex items-start gap-4 p-4 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer ${
                          currentGenerationId === gen.generation_id ? 'bg-purple-50 ring-1 ring-purple-200' : 'bg-slate-50'
                        }`}
                        onClick={() => {
                          setGeneratedContent(gen.content);
                          setCurrentGenerationId(gen.generation_id);
                          sessionStorage.setItem('ai_current_generation_id', gen.generation_id);
                          setGenForm(prev => ({
                            ...prev,
                            tool_type: gen.tool_type,
                            subject: gen.subject,
                            grade_level: gen.grade_level,
                            topic: gen.topic
                          }));
                          setActiveTab('generate');
                        }}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tool?.color || 'bg-slate-200'}`}>
                          {tool && <tool.icon className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{gen.topic}</div>
                          <div className="text-sm text-slate-500">
                            {tool?.name} • {gen.subject} • {gen.grade_level}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            {new Date(gen.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(gen.content); }}
                            title={language === 'es' ? 'Copiar' : 'Copy'}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              handlePrint(gen.content, {
                                tool_type: gen.tool_type,
                                subject: gen.subject,
                                grade_level: gen.grade_level,
                                topic: gen.topic
                              }); 
                            }}
                            title={language === 'es' ? 'Imprimir / PDF' : 'Print / PDF'}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
};

export default AIAssistant;
