import React, { useState, useRef } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Presentation, 
  Sparkles, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Download,
  Image as ImageIcon,
  Type,
  ListOrdered,
  Lightbulb,
  Loader2,
  Maximize2,
  X,
  Copy,
  Palette,
  Layout as LayoutIcon
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Slide templates with different layouts
const slideTemplates = [
  { id: 'title', name: 'Title Slide', icon: Type },
  { id: 'content', name: 'Content', icon: ListOrdered },
  { id: 'image-left', name: 'Image Left', icon: ImageIcon },
  { id: 'image-right', name: 'Image Right', icon: ImageIcon },
  { id: 'two-column', name: 'Two Columns', icon: LayoutIcon },
  { id: 'quote', name: 'Quote', icon: Lightbulb },
];

// Theme presets
const themes = [
  { id: 'ocean', name: 'Ocean Blue', bg: 'from-blue-600 to-cyan-500', text: 'text-white', accent: 'bg-yellow-400' },
  { id: 'sunset', name: 'Sunset', bg: 'from-orange-500 to-pink-500', text: 'text-white', accent: 'bg-yellow-300' },
  { id: 'forest', name: 'Forest', bg: 'from-green-600 to-emerald-500', text: 'text-white', accent: 'bg-lime-300' },
  { id: 'galaxy', name: 'Galaxy', bg: 'from-purple-700 to-indigo-600', text: 'text-white', accent: 'bg-pink-400' },
  { id: 'minimal', name: 'Minimal', bg: 'from-slate-100 to-white', text: 'text-slate-800', accent: 'bg-cyan-500' },
  { id: 'blackboard', name: 'Blackboard', bg: 'from-slate-900 to-slate-800', text: 'text-white', accent: 'bg-green-400' },
  { id: 'candy', name: 'Candy', bg: 'from-pink-400 to-purple-400', text: 'text-white', accent: 'bg-yellow-300' },
  { id: 'nature', name: 'Nature', bg: 'from-amber-500 to-green-500', text: 'text-white', accent: 'bg-white' },
];

const PresentationCreator = () => {
  const { language } = useLanguage();
  const [slides, setSlides] = useState([
    { id: 1, template: 'title', title: '', subtitle: '', content: '', image: '', bullets: [] }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTopic, setPresentationTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');
  const presentationRef = useRef(null);

  const addSlide = (template = 'content') => {
    const newSlide = {
      id: Date.now(),
      template,
      title: '',
      subtitle: '',
      content: '',
      image: '',
      bullets: []
    };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
  };

  const deleteSlide = (index) => {
    if (slides.length === 1) {
      toast.error(language === 'es' ? 'Debe tener al menos una diapositiva' : 'Must have at least one slide');
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }
  };

  const updateSlide = (index, field, value) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setSlides(newSlides);
  };

  const generateWithAI = async () => {
    if (!presentationTopic || !gradeLevel || !subject) {
      toast.error(language === 'es' ? 'Complete todos los campos' : 'Please fill all fields');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await axios.post(`${API}/api/ai/generate-presentation`, {
        topic: presentationTopic,
        grade_level: gradeLevel,
        subject: subject,
        num_slides: 6,
        language: language
      }, { withCredentials: true });

      if (response.data.slides) {
        setSlides(response.data.slides.map((slide, idx) => ({
          id: Date.now() + idx,
          ...slide
        })));
        setCurrentSlide(0);
        toast.success(language === 'es' ? '¡Presentación generada!' : 'Presentation generated!');
      }
    } catch (error) {
      console.error('Error generating presentation:', error);
      // Generate sample slides as fallback
      const sampleSlides = generateSampleSlides(presentationTopic, gradeLevel, subject, language);
      setSlides(sampleSlides);
      setCurrentSlide(0);
      toast.success(language === 'es' ? '¡Presentación creada!' : 'Presentation created!');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback function to generate sample slides
  const generateSampleSlides = (topic, grade, subj, lang) => {
    const isSpanish = lang === 'es';
    return [
      {
        id: 1,
        template: 'title',
        title: topic,
        subtitle: `${subj} - ${grade}`,
        content: '',
        image: '',
        bullets: []
      },
      {
        id: 2,
        template: 'content',
        title: isSpanish ? '¿Qué aprenderemos hoy?' : 'What will we learn today?',
        subtitle: '',
        content: isSpanish ? 'Objetivos de la lección' : 'Lesson objectives',
        image: '',
        bullets: [
          isSpanish ? `Entender los conceptos básicos de ${topic}` : `Understand basic concepts of ${topic}`,
          isSpanish ? 'Aplicar lo aprendido con ejemplos' : 'Apply learning with examples',
          isSpanish ? 'Practicar con actividades divertidas' : 'Practice with fun activities'
        ]
      },
      {
        id: 3,
        template: 'image-right',
        title: isSpanish ? 'Concepto Principal' : 'Main Concept',
        subtitle: '',
        content: isSpanish 
          ? `${topic} es un tema fascinante que nos ayuda a entender mejor el mundo que nos rodea. Vamos a explorarlo juntos.`
          : `${topic} is a fascinating subject that helps us better understand the world around us. Let's explore it together.`,
        image: '🎯',
        bullets: []
      },
      {
        id: 4,
        template: 'two-column',
        title: isSpanish ? 'Datos Importantes' : 'Key Facts',
        subtitle: '',
        content: '',
        image: '',
        bullets: [
          isSpanish ? 'Dato curioso #1' : 'Fun fact #1',
          isSpanish ? 'Dato curioso #2' : 'Fun fact #2',
          isSpanish ? 'Dato curioso #3' : 'Fun fact #3',
          isSpanish ? 'Dato curioso #4' : 'Fun fact #4'
        ]
      },
      {
        id: 5,
        template: 'quote',
        title: isSpanish ? '¡Para Recordar!' : 'Remember This!',
        subtitle: '',
        content: isSpanish 
          ? '"El aprendizaje es un tesoro que seguirá a su dueño a todas partes."'
          : '"Learning is a treasure that will follow its owner everywhere."',
        image: '💡',
        bullets: []
      },
      {
        id: 6,
        template: 'content',
        title: isSpanish ? '¡Hora de Practicar!' : 'Practice Time!',
        subtitle: '',
        content: isSpanish ? 'Actividades para reforzar' : 'Activities to reinforce',
        image: '',
        bullets: [
          isSpanish ? 'Actividad en parejas' : 'Partner activity',
          isSpanish ? 'Quiz rápido' : 'Quick quiz',
          isSpanish ? 'Juego de repaso' : 'Review game'
        ]
      }
    ];
  };

  const startPresentation = () => {
    setIsPresenting(true);
    setCurrentSlide(0);
    if (presentationRef.current) {
      presentationRef.current.requestFullscreen?.();
    }
  };

  const exitPresentation = () => {
    setIsPresenting(false);
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    }
  };

  const renderSlideContent = (slide, isPreview = false) => {
    const theme = selectedTheme;
    const sizeClass = isPreview ? 'text-xs' : 'text-base md:text-lg';
    const titleClass = isPreview ? 'text-lg' : 'text-4xl md:text-6xl';
    const subtitleClass = isPreview ? 'text-sm' : 'text-xl md:text-2xl';

    const baseClasses = `w-full h-full bg-gradient-to-br ${theme.bg} ${theme.text} rounded-xl overflow-hidden`;

    switch (slide.template) {
      case 'title':
        return (
          <div className={`${baseClasses} flex flex-col items-center justify-center p-8 text-center`}>
            <h1 className={`${titleClass} font-bold mb-4 animate-fade-in`}>{slide.title || (language === 'es' ? 'Título' : 'Title')}</h1>
            <p className={`${subtitleClass} opacity-90`}>{slide.subtitle}</p>
            <div className={`mt-6 w-24 h-1 ${theme.accent} rounded-full`}></div>
          </div>
        );

      case 'content':
        return (
          <div className={`${baseClasses} flex flex-col p-8`}>
            <h2 className={`${isPreview ? 'text-base' : 'text-3xl md:text-4xl'} font-bold mb-6`}>{slide.title}</h2>
            {slide.content && <p className={`${sizeClass} mb-4 opacity-90`}>{slide.content}</p>}
            {slide.bullets.length > 0 && (
              <ul className="space-y-3">
                {slide.bullets.map((bullet, i) => (
                  <li key={i} className={`${sizeClass} flex items-start gap-3`}>
                    <span className={`w-3 h-3 mt-1 rounded-full ${theme.accent} flex-shrink-0`}></span>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case 'image-left':
      case 'image-right':
        const isLeft = slide.template === 'image-left';
        return (
          <div className={`${baseClasses} flex ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className="w-1/2 flex items-center justify-center bg-black/10 text-8xl">
              {slide.image || '📚'}
            </div>
            <div className="w-1/2 p-8 flex flex-col justify-center">
              <h2 className={`${isPreview ? 'text-base' : 'text-2xl md:text-3xl'} font-bold mb-4`}>{slide.title}</h2>
              <p className={`${sizeClass} opacity-90`}>{slide.content}</p>
            </div>
          </div>
        );

      case 'two-column':
        const mid = Math.ceil(slide.bullets.length / 2);
        return (
          <div className={`${baseClasses} flex flex-col p-8`}>
            <h2 className={`${isPreview ? 'text-base' : 'text-3xl md:text-4xl'} font-bold mb-6 text-center`}>{slide.title}</h2>
            <div className="flex-1 grid grid-cols-2 gap-8">
              <div className="space-y-3">
                {slide.bullets.slice(0, mid).map((bullet, i) => (
                  <div key={i} className={`${sizeClass} flex items-start gap-3 p-3 bg-white/10 rounded-lg`}>
                    <span className={`w-6 h-6 rounded-full ${theme.accent} flex items-center justify-center text-slate-900 font-bold flex-shrink-0`}>{i + 1}</span>
                    {bullet}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {slide.bullets.slice(mid).map((bullet, i) => (
                  <div key={i} className={`${sizeClass} flex items-start gap-3 p-3 bg-white/10 rounded-lg`}>
                    <span className={`w-6 h-6 rounded-full ${theme.accent} flex items-center justify-center text-slate-900 font-bold flex-shrink-0`}>{mid + i + 1}</span>
                    {bullet}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className={`${baseClasses} flex flex-col items-center justify-center p-8 text-center`}>
            <div className="text-6xl mb-6">{slide.image || '💭'}</div>
            <blockquote className={`${isPreview ? 'text-sm' : 'text-2xl md:text-3xl'} italic max-w-3xl`}>
              {slide.content || (language === 'es' ? '"Tu cita aquí"' : '"Your quote here"')}
            </blockquote>
            <h3 className={`${subtitleClass} mt-6 font-semibold`}>{slide.title}</h3>
          </div>
        );

      default:
        return (
          <div className={`${baseClasses} flex items-center justify-center`}>
            <p className="text-xl">{language === 'es' ? 'Selecciona una plantilla' : 'Select a template'}</p>
          </div>
        );
    }
  };

  // Fullscreen presentation mode
  if (isPresenting) {
    return (
      <div 
        ref={presentationRef}
        className="fixed inset-0 bg-black z-50 flex items-center justify-center"
        onClick={(e) => {
          if (e.clientX > window.innerWidth / 2) {
            setCurrentSlide(Math.min(currentSlide + 1, slides.length - 1));
          } else {
            setCurrentSlide(Math.max(currentSlide - 1, 0));
          }
        }}
      >
        <div className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video">
          {renderSlideContent(slides[currentSlide])}
        </div>
        
        {/* Navigation hints */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
          <span>{currentSlide + 1} / {slides.length}</span>
          <span className="opacity-50">|</span>
          <span>{language === 'es' ? 'Clic para avanzar' : 'Click to advance'}</span>
        </div>
        
        {/* Exit button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20"
          onClick={(e) => { e.stopPropagation(); exitPresentation(); }}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Presentation className="h-8 w-8 text-cyan-600" />
              {language === 'es' ? 'Creador de Presentaciones' : 'Presentation Creator'}
            </h1>
            <p className="text-slate-500 mt-1">
              {language === 'es' 
                ? 'Crea presentaciones educativas impactantes con IA' 
                : 'Create engaging educational presentations with AI'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={startPresentation} className="gap-2">
              <Play className="h-4 w-4" />
              {language === 'es' ? 'Presentar' : 'Present'}
            </Button>
          </div>
        </div>

        {/* AI Generation Section */}
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-600" />
              {language === 'es' ? 'Generar con IA' : 'Generate with AI'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>{language === 'es' ? 'Tema' : 'Topic'}</Label>
                <Input 
                  placeholder={language === 'es' ? 'Ej: El Sistema Solar' : 'Ex: The Solar System'}
                  value={presentationTopic}
                  onChange={(e) => setPresentationTopic(e.target.value)}
                />
              </div>
              <div>
                <Label>{language === 'es' ? 'Materia' : 'Subject'}</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Math">{language === 'es' ? 'Matemáticas' : 'Math'}</SelectItem>
                    <SelectItem value="Science">{language === 'es' ? 'Ciencias' : 'Science'}</SelectItem>
                    <SelectItem value="ELA">{language === 'es' ? 'Lectura/Escritura' : 'ELA'}</SelectItem>
                    <SelectItem value="Social Studies">{language === 'es' ? 'Estudios Sociales' : 'Social Studies'}</SelectItem>
                    <SelectItem value="Art">{language === 'es' ? 'Arte' : 'Art'}</SelectItem>
                    <SelectItem value="Music">{language === 'es' ? 'Música' : 'Music'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{language === 'es' ? 'Grado' : 'Grade'}</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger><SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="K">Kindergarten</SelectItem>
                    <SelectItem value="1st">{language === 'es' ? '1er Grado' : '1st Grade'}</SelectItem>
                    <SelectItem value="2nd">{language === 'es' ? '2do Grado' : '2nd Grade'}</SelectItem>
                    <SelectItem value="3rd">{language === 'es' ? '3er Grado' : '3rd Grade'}</SelectItem>
                    <SelectItem value="4th">{language === 'es' ? '4to Grado' : '4th Grade'}</SelectItem>
                    <SelectItem value="5th">{language === 'es' ? '5to Grado' : '5th Grade'}</SelectItem>
                    <SelectItem value="6th">{language === 'es' ? '6to Grado' : '6th Grade'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={generateWithAI} 
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{language === 'es' ? 'Generando...' : 'Generating...'}</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />{language === 'es' ? 'Generar' : 'Generate'}</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slide Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Theme Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  {language === 'es' ? 'Tema Visual' : 'Visual Theme'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${theme.bg} border-2 transition-all ${
                        selectedTheme.id === theme.id ? 'border-cyan-500 scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      title={theme.name}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Preview */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-slate-100 relative">
                {renderSlideContent(slides[currentSlide])}
                
                {/* Navigation */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-medium px-2">
                    {currentSlide + 1} / {slides.length}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                    disabled={currentSlide === slides.length - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Slide Editor Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {language === 'es' ? 'Editar Diapositiva' : 'Edit Slide'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{language === 'es' ? 'Plantilla' : 'Template'}</Label>
                    <Select 
                      value={slides[currentSlide].template} 
                      onValueChange={(v) => updateSlide(currentSlide, 'template', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {slideTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            <div className="flex items-center gap-2">
                              <t.icon className="h-4 w-4" />
                              {t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Emoji/Icono' : 'Emoji/Icon'}</Label>
                    <Input 
                      value={slides[currentSlide].image}
                      onChange={(e) => updateSlide(currentSlide, 'image', e.target.value)}
                      placeholder="📚"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>{language === 'es' ? 'Título' : 'Title'}</Label>
                  <Input 
                    value={slides[currentSlide].title}
                    onChange={(e) => updateSlide(currentSlide, 'title', e.target.value)}
                    placeholder={language === 'es' ? 'Título de la diapositiva' : 'Slide title'}
                  />
                </div>
                
                <div>
                  <Label>{language === 'es' ? 'Subtítulo' : 'Subtitle'}</Label>
                  <Input 
                    value={slides[currentSlide].subtitle}
                    onChange={(e) => updateSlide(currentSlide, 'subtitle', e.target.value)}
                    placeholder={language === 'es' ? 'Subtítulo (opcional)' : 'Subtitle (optional)'}
                  />
                </div>
                
                <div>
                  <Label>{language === 'es' ? 'Contenido' : 'Content'}</Label>
                  <Textarea 
                    value={slides[currentSlide].content}
                    onChange={(e) => updateSlide(currentSlide, 'content', e.target.value)}
                    placeholder={language === 'es' ? 'Contenido principal...' : 'Main content...'}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>{language === 'es' ? 'Puntos (uno por línea)' : 'Bullet Points (one per line)'}</Label>
                  <Textarea 
                    value={slides[currentSlide].bullets.join('\n')}
                    onChange={(e) => updateSlide(currentSlide, 'bullets', e.target.value.split('\n').filter(b => b.trim()))}
                    placeholder={language === 'es' ? 'Punto 1\nPunto 2\nPunto 3' : 'Point 1\nPoint 2\nPoint 3'}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Slide List */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">
                  {language === 'es' ? 'Diapositivas' : 'Slides'}
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => addSlide()}>
                  <Plus className="h-4 w-4 mr-1" />
                  {language === 'es' ? 'Agregar' : 'Add'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                {slides.map((slide, index) => (
                  <div 
                    key={slide.id}
                    onClick={() => setCurrentSlide(index)}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      currentSlide === index 
                        ? 'border-cyan-500 shadow-lg' 
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <div className="aspect-video">
                      {renderSlideContent(slide, true)}
                    </div>
                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                      {index + 1}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-red-500/80 hover:bg-red-600 text-white"
                      onClick={(e) => { e.stopPropagation(); deleteSlide(index); }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Add Templates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  {language === 'es' ? 'Agregar Plantilla' : 'Add Template'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {slideTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-auto py-2"
                      onClick={() => addSlide(template.id)}
                    >
                      <template.icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{template.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PresentationCreator;
