import React, { useState, useRef, useCallback } from 'react';
import Layout from '../components/Layout';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
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
  Image as ImageIcon,
  Type,
  ListOrdered,
  Lightbulb,
  Loader2,
  X,
  Palette,
  Layout as LayoutIcon,
  Upload,
  Link,
  Search,
  HelpCircle,
  BookOpen,
  MousePointer,
  Wand2,
  Eye,
  Settings2,
  CheckCircle2,
  ArrowRight,
  FileImage,
  Globe
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Slide templates
const slideTemplates = [
  { id: 'title', name: 'Title Slide', nameEs: 'Título', icon: Type },
  { id: 'content', name: 'Content', nameEs: 'Contenido', icon: ListOrdered },
  { id: 'image-left', name: 'Image Left', nameEs: 'Imagen Izq.', icon: ImageIcon },
  { id: 'image-right', name: 'Image Right', nameEs: 'Imagen Der.', icon: ImageIcon },
  { id: 'full-image', name: 'Full Image', nameEs: 'Imagen Grande', icon: FileImage },
  { id: 'two-column', name: 'Two Columns', nameEs: 'Dos Columnas', icon: LayoutIcon },
  { id: 'quote', name: 'Quote', nameEs: 'Cita', icon: Lightbulb },
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

// Stock image categories for education
const stockCategories = [
  { id: 'classroom', name: 'Classroom', nameEs: 'Aula' },
  { id: 'science', name: 'Science', nameEs: 'Ciencias' },
  { id: 'math', name: 'Math', nameEs: 'Matemáticas' },
  { id: 'nature', name: 'Nature', nameEs: 'Naturaleza' },
  { id: 'technology', name: 'Technology', nameEs: 'Tecnología' },
  { id: 'books', name: 'Books', nameEs: 'Libros' },
  { id: 'art', name: 'Art', nameEs: 'Arte' },
  { id: 'sports', name: 'Sports', nameEs: 'Deportes' },
];

const PresentationCreator = () => {
  const { language } = useLanguage();
  const [slides, setSlides] = useState([
    { id: 1, template: 'title', title: '', subtitle: '', content: '', image: '', imageType: 'emoji', bullets: [] }
  ]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTopic, setPresentationTopic] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageSearch, setImageSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef(null);
  const presentationRef = useRef(null);

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      toast.error(language === 'es' 
        ? 'Formato no soportado. Use: JPEG, PNG, GIF, WebP, AVIF' 
        : 'Unsupported format. Use: JPEG, PNG, GIF, WebP, AVIF');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === 'es' ? 'Imagen muy grande (máx 5MB)' : 'Image too large (max 5MB)');
      return;
    }

    // Convert to base64 for local storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      updateSlide(currentSlide, 'image', base64);
      updateSlide(currentSlide, 'imageType', 'uploaded');
      setShowImagePicker(false);
      toast.success(language === 'es' ? '¡Imagen agregada!' : 'Image added!');
    };
    reader.readAsDataURL(file);
  }, [currentSlide, language]);

  // Handle image URL
  const handleImageUrl = () => {
    if (!imageUrl.trim()) return;
    
    // Basic URL validation
    try {
      new URL(imageUrl);
      updateSlide(currentSlide, 'image', imageUrl);
      updateSlide(currentSlide, 'imageType', 'url');
      setShowImagePicker(false);
      setImageUrl('');
      toast.success(language === 'es' ? '¡Imagen agregada!' : 'Image added!');
    } catch {
      toast.error(language === 'es' ? 'URL inválida' : 'Invalid URL');
    }
  };

  // Search stock images (using Unsplash)
  const searchStockImages = async (query) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      // Use Unsplash source for demo (free, no API key needed)
      const results = [];
      const searchTerms = query.toLowerCase().split(' ');
      
      // Generate placeholder results using Unsplash source
      for (let i = 0; i < 8; i++) {
        results.push({
          id: i,
          url: `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}&sig=${Date.now() + i}`,
          thumb: `https://source.unsplash.com/200x150/?${encodeURIComponent(query)}&sig=${Date.now() + i}`,
          alt: query
        });
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(language === 'es' ? 'Error al buscar imágenes' : 'Error searching images');
    } finally {
      setIsSearching(false);
    }
  };

  // Select stock image
  const selectStockImage = (url) => {
    updateSlide(currentSlide, 'image', url);
    updateSlide(currentSlide, 'imageType', 'stock');
    setShowImagePicker(false);
    setSearchResults([]);
    setImageSearch('');
    toast.success(language === 'es' ? '¡Imagen agregada!' : 'Image added!');
  };

  const addSlide = (template = 'content') => {
    const newSlide = {
      id: Date.now(),
      template,
      title: '',
      subtitle: '',
      content: '',
      image: '',
      imageType: 'emoji',
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
      const response = await axios.post(`${API}/api/ai/presentation/generate`, {
        topic: presentationTopic,
        grade_level: gradeLevel,
        subject: subject,
        num_slides: 6,
        language: language,
        theme: selectedTheme.id
      }, { withCredentials: true });

      if (response.data.slides) {
        setSlides(response.data.slides.map((slide, idx) => ({
          id: Date.now() + idx,
          imageType: slide.imageType || 'emoji',
          ...slide
        })));
        setCurrentSlide(0);
        toast.success(language === 'es' ? '¡Presentación generada con IA!' : 'AI Presentation generated!');
      }
    } catch (error) {
      console.error('Error generating presentation:', error);
      if (error.response?.status === 403) {
        toast.error(language === 'es' 
          ? 'Necesitas una suscripción activa para usar IA' 
          : 'You need an active subscription to use AI');
      } else {
        // Fallback to sample slides
        const sampleSlides = generateSampleSlides(presentationTopic, gradeLevel, subject, language);
        setSlides(sampleSlides);
        setCurrentSlide(0);
        toast.info(language === 'es' ? '¡Presentación de ejemplo creada!' : 'Sample presentation created!');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSampleSlides = (topic, grade, subj, lang) => {
    const isSpanish = lang === 'es';
    return [
      {
        id: 1, template: 'title', imageType: 'emoji',
        title: topic,
        subtitle: `${subj} - ${grade}`,
        content: '', image: '', bullets: []
      },
      {
        id: 2, template: 'content', imageType: 'emoji',
        title: isSpanish ? '¿Qué aprenderemos hoy?' : 'What will we learn today?',
        subtitle: '', content: isSpanish ? 'Objetivos de la lección' : 'Lesson objectives',
        image: '', bullets: [
          isSpanish ? `Entender los conceptos básicos de ${topic}` : `Understand basic concepts of ${topic}`,
          isSpanish ? 'Aplicar lo aprendido con ejemplos' : 'Apply learning with examples',
          isSpanish ? 'Practicar con actividades divertidas' : 'Practice with fun activities'
        ]
      },
      {
        id: 3, template: 'image-right', imageType: 'emoji',
        title: isSpanish ? 'Concepto Principal' : 'Main Concept',
        subtitle: '',
        content: isSpanish 
          ? `${topic} es un tema fascinante que nos ayuda a entender mejor el mundo que nos rodea.`
          : `${topic} is a fascinating subject that helps us better understand the world around us.`,
        image: '🎯', bullets: []
      },
      {
        id: 4, template: 'two-column', imageType: 'emoji',
        title: isSpanish ? 'Datos Importantes' : 'Key Facts',
        subtitle: '', content: '', image: '',
        bullets: [
          isSpanish ? 'Dato curioso #1' : 'Fun fact #1',
          isSpanish ? 'Dato curioso #2' : 'Fun fact #2',
          isSpanish ? 'Dato curioso #3' : 'Fun fact #3',
          isSpanish ? 'Dato curioso #4' : 'Fun fact #4'
        ]
      },
      {
        id: 5, template: 'quote', imageType: 'emoji',
        title: isSpanish ? '¡Para Recordar!' : 'Remember This!',
        subtitle: '',
        content: isSpanish 
          ? '"El aprendizaje es un tesoro que seguirá a su dueño a todas partes."'
          : '"Learning is a treasure that will follow its owner everywhere."',
        image: '💡', bullets: []
      },
      {
        id: 6, template: 'content', imageType: 'emoji',
        title: isSpanish ? '¡Hora de Practicar!' : 'Practice Time!',
        subtitle: '', content: isSpanish ? 'Actividades para reforzar' : 'Activities to reinforce',
        image: '', bullets: [
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

  // Render image based on type
  const renderImage = (slide, isLarge = false) => {
    const sizeClass = isLarge ? 'w-full h-full' : 'w-full h-full';
    
    if (!slide.image) {
      return <span className="text-6xl">📚</span>;
    }

    if (slide.imageType === 'emoji' || slide.image.length <= 4) {
      return <span className={isLarge ? 'text-9xl' : 'text-6xl'}>{slide.image}</span>;
    }

    return (
      <img 
        src={slide.image} 
        alt={slide.title || 'Slide image'}
        className={`${sizeClass} object-cover`}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
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
            <h1 className={`${titleClass} font-bold mb-4`}>{slide.title || (language === 'es' ? 'Título' : 'Title')}</h1>
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
            <div className="w-1/2 flex items-center justify-center bg-black/20 overflow-hidden">
              {renderImage(slide, !isPreview)}
            </div>
            <div className="w-1/2 p-8 flex flex-col justify-center">
              <h2 className={`${isPreview ? 'text-base' : 'text-2xl md:text-3xl'} font-bold mb-4`}>{slide.title}</h2>
              <p className={`${sizeClass} opacity-90`}>{slide.content}</p>
            </div>
          </div>
        );

      case 'full-image':
        return (
          <div className={`${baseClasses} relative`}>
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              {renderImage(slide, true)}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-end p-8 bg-gradient-to-t from-black/70 to-transparent">
              <h2 className={`${isPreview ? 'text-base' : 'text-3xl md:text-4xl'} font-bold text-white text-center mb-2`}>{slide.title}</h2>
              {slide.content && <p className={`${sizeClass} text-white/90 text-center`}>{slide.content}</p>}
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

  // Help Modal Content
  const HelpContent = () => (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Getting Started */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-700">
          <BookOpen className="h-5 w-5" />
          {language === 'es' ? 'Cómo Empezar' : 'Getting Started'}
        </h3>
        <div className="bg-cyan-50 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <p className="text-sm">
              {language === 'es' 
                ? 'Ingresa el tema, materia y grado en "Generar con IA" y haz clic en Generar para crear una presentación automáticamente.'
                : 'Enter the topic, subject and grade in "Generate with AI" and click Generate to create a presentation automatically.'}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <p className="text-sm">
              {language === 'es' 
                ? 'O crea manualmente agregando diapositivas con el botón "Agregar" y seleccionando plantillas.'
                : 'Or create manually by adding slides with the "Add" button and selecting templates.'}
            </p>
          </div>
        </div>
      </div>

      {/* Adding Images */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-700">
          <ImageIcon className="h-5 w-5" />
          {language === 'es' ? 'Agregar Imágenes' : 'Adding Images'}
        </h3>
        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Upload className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{language === 'es' ? 'Subir desde tu dispositivo' : 'Upload from your device'}</p>
              <p className="text-xs text-slate-600">
                {language === 'es' 
                  ? 'Formatos: JPEG, PNG, GIF, WebP, AVIF (máx 5MB)'
                  : 'Formats: JPEG, PNG, GIF, WebP, AVIF (max 5MB)'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Link className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{language === 'es' ? 'Pegar URL de imagen' : 'Paste image URL'}</p>
              <p className="text-xs text-slate-600">
                {language === 'es' 
                  ? 'Usa cualquier enlace directo a una imagen de internet'
                  : 'Use any direct link to an image from the internet'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Search className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">{language === 'es' ? 'Buscar imágenes gratuitas' : 'Search free images'}</p>
              <p className="text-xs text-slate-600">
                {language === 'es' 
                  ? 'Busca fotos de alta calidad de Unsplash directamente en la app'
                  : 'Search high-quality photos from Unsplash directly in the app'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Templates */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-700">
          <LayoutIcon className="h-5 w-5" />
          {language === 'es' ? 'Plantillas de Diapositivas' : 'Slide Templates'}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {slideTemplates.map((t) => (
            <div key={t.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <t.icon className="h-4 w-4 text-slate-600" />
              <span className="text-sm">{language === 'es' ? t.nameEs : t.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Presenting */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-700">
          <Play className="h-5 w-5" />
          {language === 'es' ? 'Presentar' : 'Presenting'}
        </h3>
        <div className="bg-green-50 rounded-lg p-4 space-y-2 text-sm">
          <p>• {language === 'es' ? 'Haz clic en "Presentar" para modo pantalla completa' : 'Click "Present" for fullscreen mode'}</p>
          <p>• {language === 'es' ? 'Clic derecho de la pantalla = siguiente diapositiva' : 'Click right side = next slide'}</p>
          <p>• {language === 'es' ? 'Clic izquierdo de la pantalla = diapositiva anterior' : 'Click left side = previous slide'}</p>
          <p>• {language === 'es' ? 'Presiona X o ESC para salir' : 'Press X or ESC to exit'}</p>
        </div>
      </div>

      {/* Tips */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-700">
          <Lightbulb className="h-5 w-5" />
          {language === 'es' ? 'Consejos Pro' : 'Pro Tips'}
        </h3>
        <div className="bg-amber-50 rounded-lg p-4 space-y-2 text-sm">
          <p>✨ {language === 'es' ? 'Usa GIFs animados para captar la atención de los estudiantes' : 'Use animated GIFs to capture students attention'}</p>
          <p>🎨 {language === 'es' ? 'Cambia el tema para diferentes materias o estados de ánimo' : 'Change themes for different subjects or moods'}</p>
          <p>📝 {language === 'es' ? 'Mantén el texto breve - máx 6 palabras por punto' : 'Keep text brief - max 6 words per bullet'}</p>
          <p>🖼️ {language === 'es' ? 'Usa imágenes grandes y claras para mejor visibilidad' : 'Use large, clear images for better visibility'}</p>
        </div>
      </div>
    </div>
  );

  // Image Picker Modal
  const ImagePickerModal = () => (
    <Dialog open={showImagePicker} onOpenChange={setShowImagePicker}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-cyan-600" />
            {language === 'es' ? 'Agregar Imagen' : 'Add Image'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              {language === 'es' ? 'Subir' : 'Upload'}
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-2">
              <Link className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              {language === 'es' ? 'Buscar' : 'Search'}
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div 
              className="border-2 border-dashed border-cyan-300 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-cyan-500 mb-4" />
              <p className="font-medium text-slate-700">
                {language === 'es' ? 'Haz clic para seleccionar imagen' : 'Click to select image'}
              </p>
              <p className="text-sm text-slate-500 mt-2">
                JPEG, PNG, GIF, WebP, AVIF • {language === 'es' ? 'Máx 5MB' : 'Max 5MB'}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/avif"
              className="hidden"
              onChange={handleFileUpload}
            />
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'URL de la imagen' : 'Image URL'}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button onClick={handleImageUrl} className="bg-cyan-600 hover:bg-cyan-700">
                  {language === 'es' ? 'Agregar' : 'Add'}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                {language === 'es' 
                  ? 'Pega el enlace directo a cualquier imagen de internet'
                  : 'Paste the direct link to any image from the internet'}
              </p>
            </div>
          </TabsContent>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={language === 'es' ? 'Buscar imágenes...' : 'Search images...'}
                value={imageSearch}
                onChange={(e) => setImageSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStockImages(imageSearch)}
              />
              <Button 
                onClick={() => searchStockImages(imageSearch)} 
                disabled={isSearching}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Quick category buttons */}
            <div className="flex flex-wrap gap-2">
              {stockCategories.map((cat) => (
                <Button
                  key={cat.id}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImageSearch(cat.id);
                    searchStockImages(cat.id);
                  }}
                >
                  {language === 'es' ? cat.nameEs : cat.name}
                </Button>
              ))}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {searchResults.map((img) => (
                  <img
                    key={img.id}
                    src={img.thumb}
                    alt={img.alt}
                    className="w-full h-20 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all"
                    onClick={() => selectStockImage(img.url)}
                  />
                ))}
              </div>
            )}
            
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {language === 'es' ? 'Imágenes de Unsplash - Gratis para uso educativo' : 'Images from Unsplash - Free for educational use'}
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );

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
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 px-4 py-2 rounded-full text-white text-sm">
          <span>{currentSlide + 1} / {slides.length}</span>
          <span className="opacity-50">|</span>
          <span>{language === 'es' ? 'Clic para avanzar' : 'Click to advance'}</span>
        </div>
        
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
            <Dialog open={showHelp} onOpenChange={setShowHelp}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {language === 'es' ? 'Ayuda' : 'Help'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-cyan-600" />
                    {language === 'es' ? 'Cómo Usar el Creador de Presentaciones' : 'How to Use Presentation Creator'}
                  </DialogTitle>
                </DialogHeader>
                <HelpContent />
              </DialogContent>
            </Dialog>
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
                              {language === 'es' ? t.nameEs : t.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{language === 'es' ? 'Imagen' : 'Image'}</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={slides[currentSlide].imageType === 'emoji' ? slides[currentSlide].image : ''}
                        onChange={(e) => {
                          updateSlide(currentSlide, 'image', e.target.value);
                          updateSlide(currentSlide, 'imageType', 'emoji');
                        }}
                        placeholder="📚"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setShowImagePicker(true)}
                        title={language === 'es' ? 'Agregar imagen' : 'Add image'}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    {slides[currentSlide].imageType !== 'emoji' && slides[currentSlide].image && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {language === 'es' ? 'Imagen agregada' : 'Image added'}
                      </p>
                    )}
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
                <div className="grid grid-cols-2 gap-2">
                  {slideTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      className="flex flex-col h-auto py-2"
                      onClick={() => addSlide(template.id)}
                    >
                      <template.icon className="h-4 w-4 mb-1" />
                      <span className="text-xs">{language === 'es' ? template.nameEs : template.name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Picker Modal */}
      <ImagePickerModal />
    </Layout>
  );
};

export default PresentationCreator;
