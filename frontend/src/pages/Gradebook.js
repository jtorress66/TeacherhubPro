import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Plus, BookOpen, Save, Trash2, FileDown, Settings, FolderPlus, List, Pencil, Sparkles, Brain, Copy, ExternalLink, Loader2 } from 'lucide-react';

const API = `${window.location.origin}/api`;

const DEFAULT_CATEGORIES = [
  { name: 'Homework', name_es: 'Tarea', weight: 25 },
  { name: 'Quiz', name_es: 'Prueba Corta', weight: 25 },
  { name: 'Test', name_es: 'Examen', weight: 30 },
  { name: 'Project', name_es: 'Proyecto', weight: 20 }
];

// GPA Scale Configuration (School's custom scale)
const GPA_SCALE = {
  // Letter grade ranges based on percentage (standard scale)
  getLetterGrade: (percentage) => {
    if (percentage === null || percentage === undefined) return '-';
    const pct = parseFloat(percentage);
    if (isNaN(pct)) return '-';
    if (pct >= 90) return 'A';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  },
  // Convert percentage to GPA (4.0 scale)
  percentageToGPA: (percentage) => {
    if (percentage === null || percentage === undefined || percentage === '-') return null;
    const pct = parseFloat(percentage);
    if (isNaN(pct)) return null;
    // Standard GPA conversion
    if (pct >= 90) return 4.0;
    if (pct >= 80) return 3.0;
    if (pct >= 70) return 2.0;
    if (pct >= 60) return 1.0;
    return 0.0;
  },
  // Get color for letter grade
  getGradeColor: (letter) => {
    switch (letter) {
      case 'A': return 'bg-green-100 text-green-800 border-green-200';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'F': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  }
};

const Gradebook = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAssignmentList, setShowAssignmentList] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', name_es: '', weight: 10 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    category_id: '',
    points: 100,
    due_date: '',
    description: ''
  });
  
  // AI Assignment Generation State
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiAssignment, setAiAssignment] = useState(null);
  const [aiRequest, setAiRequest] = useState({
    topic: '',
    subject: 'Math',
    grade_level: '5',
    question_types: ['multiple_choice', 'short_answer'],
    num_questions: 5,
    difficulty: 'medium',
    additional_instructions: ''
  });
  const [aiAssignments, setAiAssignments] = useState([]);
  const [savingAI, setSavingAI] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classesRes, semestersRes] = await Promise.all([
          axios.get(`${API}/classes`, { withCredentials: true }),
          axios.get(`${API}/semesters`, { withCredentials: true })
        ]);
        
        setClasses(classesRes.data);
        setSemesters(semestersRes.data);
        
        // Set active semester as default
        const activeSem = semestersRes.data.find(s => s.is_active);
        if (activeSem) {
          setSelectedSemester(activeSem.semester_id);
        } else if (semestersRes.data.length > 0) {
          setSelectedSemester(semestersRes.data[0].semester_id);
        }
        
        if (!selectedClass && classesRes.data.length > 0) {
          setSelectedClass(classesRes.data[0].class_id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchInitialData();
  }, []);

  // Filter classes by semester
  const filteredClasses = selectedSemester 
    ? classes.filter(c => c.semester_id === selectedSemester || !c.semester_id)
    : classes;

  useEffect(() => {
    if (!selectedClass) {
      setLoading(false);
      return;
    }

    const fetchGradebook = async () => {
      setLoading(true);
      try {
        // Fetch categories
        const categoriesRes = await axios.get(`${API}/classes/${selectedClass}/categories`, { withCredentials: true });
        let cats = categoriesRes.data;
        
        // Create default categories if none exist
        if (cats.length === 0) {
          for (const cat of DEFAULT_CATEGORIES) {
            const res = await axios.post(`${API}/classes/${selectedClass}/categories`, {
              name: language === 'es' ? cat.name_es : cat.name,
              weight_percent: cat.weight
            }, { withCredentials: true });
            cats.push(res.data);
          }
        }
        setCategories(cats);

        // Fetch full gradebook data
        const gradebookRes = await axios.get(`${API}/gradebook/${selectedClass}`, { withCredentials: true });
        setStudents(gradebookRes.data.students);
        setAssignments(gradebookRes.data.assignments);
        setGrades(gradebookRes.data.grades);
      } catch (error) {
        console.error('Error fetching gradebook:', error);
        toast.error(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchGradebook();
  }, [selectedClass, t, language]);

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.category_id) {
      toast.error(language === 'es' ? 'Completa los campos requeridos' : 'Complete required fields');
      return;
    }

    try {
      const res = await axios.post(`${API}/assignments`, {
        ...newAssignment,
        class_id: selectedClass
      }, { withCredentials: true });
      
      setAssignments(prev => [...prev, res.data]);
      setShowNewAssignment(false);
      setNewAssignment({ title: '', category_id: '', points: 100, due_date: '', description: '' });
      toast.success(language === 'es' ? 'Tarea creada' : 'Assignment created');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  // Handle editing an assignment
  const handleEditAssignment = async () => {
    if (!editingAssignment) return;
    try {
      await axios.put(`${API}/assignments/${editingAssignment.assignment_id}`, {
        title: editingAssignment.title,
        category_id: editingAssignment.category_id,
        points: editingAssignment.points,
        due_date: editingAssignment.due_date,
        description: editingAssignment.description
      }, { withCredentials: true });
      
      setAssignments(prev => prev.map(a => 
        a.assignment_id === editingAssignment.assignment_id ? editingAssignment : a
      ));
      setEditingAssignment(null);
      toast.success(language === 'es' ? 'Tarea actualizada' : 'Assignment updated');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  // Handle deleting an assignment
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm(language === 'es' ? '¿Eliminar esta tarea?' : 'Delete this assignment?')) return;
    try {
      await axios.delete(`${API}/assignments/${assignmentId}`, { withCredentials: true });
      setAssignments(prev => prev.filter(a => a.assignment_id !== assignmentId));
      toast.success(language === 'es' ? 'Tarea eliminada' : 'Assignment deleted');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleGradeChange = async (studentId, assignmentId, value) => {
    const score = value === '' ? null : parseFloat(value);
    const key = `${studentId}_${assignmentId}`;
    
    setGrades(prev => ({
      ...prev,
      [key]: { ...prev[key], score, status: score !== null ? 'graded' : 'pending' }
    }));

    // Debounced save
    try {
      await axios.post(`${API}/grades/bulk`, {
        assignment_id: assignmentId,
        grades: [{
          student_id: studentId,
          score,
          status: score !== null ? 'graded' : 'pending'
        }]
      }, { withCredentials: true });
    } catch (error) {
      console.error('Grade save error:', error);
    }
  };

  // Calculate student's weighted average percentage
  const calculateStudentAverage = (studentId) => {
    let totalWeighted = 0;
    let totalWeight = 0;

    categories.forEach(cat => {
      const catAssignments = assignments.filter(a => a.category_id === cat.category_id);
      let catTotal = 0;
      let catMax = 0;

      catAssignments.forEach(assignment => {
        const key = `${studentId}_${assignment.assignment_id}`;
        const grade = grades[key];
        if (grade?.score !== null && grade?.score !== undefined) {
          catTotal += grade.score;
          catMax += assignment.points;
        }
      });

      if (catMax > 0) {
        const catPercent = (catTotal / catMax) * 100;
        totalWeighted += catPercent * (cat.weight_percent / 100);
        totalWeight += cat.weight_percent;
      }
    });

    if (totalWeight === 0) return null;
    return (totalWeighted * (100 / totalWeight));
  };

  // Get full grade info for a student (percentage, GPA, letter)
  const getStudentGradeInfo = (studentId) => {
    const percentage = calculateStudentAverage(studentId);
    if (percentage === null) {
      return { percentage: '-', gpa: '-', letter: '-', color: 'bg-slate-100 text-slate-600' };
    }
    const gpa = GPA_SCALE.percentageToGPA(percentage);
    const letter = GPA_SCALE.getLetterGrade(percentage); // Use percentage directly for letter grade
    const color = GPA_SCALE.getGradeColor(letter);
    return {
      percentage: percentage.toFixed(1),
      gpa: gpa.toFixed(2),
      letter,
      color
    };
  };

  // Category management functions
  const handleAddCategory = async () => {
    if (!newCategory.name || !selectedClass) return;
    try {
      const res = await axios.post(`${API}/classes/${selectedClass}/categories`, {
        name: newCategory.name,
        name_es: newCategory.name_es || newCategory.name,
        weight_percent: newCategory.weight
      }, { withCredentials: true });
      setCategories([...categories, res.data]);
      setNewCategory({ name: '', name_es: '', weight: 10 });
      toast.success(language === 'es' ? 'Categoría creada' : 'Category created');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error creating category');
    }
  };

  const handleUpdateCategory = async (categoryId, updates) => {
    try {
      await axios.put(`${API}/categories/${categoryId}`, updates, { withCredentials: true });
      setCategories(categories.map(c => 
        c.category_id === categoryId ? { ...c, ...updates } : c
      ));
      setEditingCategory(null);
      toast.success(language === 'es' ? 'Categoría actualizada' : 'Category updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error updating category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    const catAssignments = assignments.filter(a => a.category_id === categoryId);
    if (catAssignments.length > 0) {
      toast.error(language === 'es' 
        ? 'No se puede eliminar una categoría con asignaciones' 
        : 'Cannot delete category with assignments');
      return;
    }
    try {
      await axios.delete(`${API}/categories/${categoryId}`, { withCredentials: true });
      setCategories(categories.filter(c => c.category_id !== categoryId));
      toast.success(language === 'es' ? 'Categoría eliminada' : 'Category deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error deleting category');
    }
  };

  // AI Assignment Generation Functions
  const handleAIGenerate = async () => {
    if (!aiRequest.topic.trim()) {
      toast.error(language === 'es' ? 'Ingresa un tema' : 'Enter a topic');
      return;
    }
    
    setAiGenerating(true);
    try {
      const response = await axios.post(`${API}/ai-grading/generate-assignment`, {
        ...aiRequest,
        language: language
      }, { withCredentials: true });
      
      setAiAssignment(response.data);
      toast.success(language === 'es' ? 'Tarea generada con IA' : 'AI Assignment generated');
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error(language === 'es' ? 'Error al generar tarea' : 'Failed to generate assignment');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveAIAssignment = async () => {
    if (!aiAssignment || !selectedClass) {
      toast.error(language === 'es' ? 'Selecciona una clase' : 'Select a class');
      return;
    }
    
    if (!newAssignment.category_id) {
      toast.error(language === 'es' ? 'Selecciona una categoría' : 'Select a category');
      return;
    }
    
    setSavingAI(true);
    try {
      const response = await axios.post(`${API}/ai-grading/assignments`, {
        class_id: selectedClass,
        category_id: newAssignment.category_id,
        title: aiAssignment.title,
        description: aiAssignment.description,
        instructions: aiAssignment.instructions,
        questions: aiAssignment.questions,
        points: aiAssignment.total_points || 100,
        due_date: newAssignment.due_date || null,
        grade_level: aiRequest.grade_level,
        grading_mode: 'ai_suggest',
        ai_generated: true
      }, { withCredentials: true });
      
      // Get the student link
      const publicLink = `${window.location.origin}/assignment/${response.data.public_token}`;
      
      toast.success(
        <div>
          <p className="font-medium">{language === 'es' ? '¡Tarea creada!' : 'Assignment created!'}</p>
          <p className="text-sm mt-1">{language === 'es' ? 'Enlace copiado al portapapeles' : 'Link copied to clipboard'}</p>
        </div>
      );
      
      // Copy link to clipboard
      navigator.clipboard.writeText(publicLink);
      
      // Reset and close
      setAiAssignment(null);
      setShowAIGenerator(false);
      setAiRequest({
        topic: '',
        subject: 'Math',
        grade_level: '5',
        question_types: ['multiple_choice', 'short_answer'],
        num_questions: 5,
        difficulty: 'medium',
        additional_instructions: ''
      });
      
      // Fetch updated AI assignments
      fetchAIAssignments();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(language === 'es' ? 'Error al guardar' : 'Failed to save');
    } finally {
      setSavingAI(false);
    }
  };

  const fetchAIAssignments = async () => {
    try {
      const response = await axios.get(`${API}/ai-grading/assignments${selectedClass ? `?class_id=${selectedClass}` : ''}`, {
        withCredentials: true
      });
      setAiAssignments(response.data);
    } catch (error) {
      console.error('Error fetching AI assignments:', error);
    }
  };

  // Fetch AI assignments when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchAIAssignments();
    }
  }, [selectedClass]);

  const copyStudentLink = (token) => {
    const link = `${window.location.origin}/assignment/${token}`;
    navigator.clipboard.writeText(link);
    toast.success(language === 'es' ? 'Enlace copiado' : 'Link copied');
  };

  // Calculate total weight percentage
  const totalWeight = categories.reduce((sum, cat) => sum + (cat.weight_percent || 0), 0);

  if (loading && classes.length === 0) {
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
            <h1 className="text-3xl font-heading font-bold text-slate-800">
              {language === 'es' ? 'Tareas y Calificaciones' : 'Assignments & Gradebook'}
            </h1>
            <p className="text-slate-500">{t('assignments')}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowCategoryManager(true)} data-testid="manage-categories-btn">
              <FolderPlus className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Categorías' : 'Categories'}
            </Button>
            <Button variant="outline" onClick={() => setShowAssignmentList(true)} data-testid="view-assignments-btn">
              <List className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Ver Tareas' : 'View Assignments'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowAIGenerator(true)} 
              className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 hover:from-violet-600 hover:to-purple-600"
              data-testid="ai-assignment-btn"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {language === 'es' ? 'Crear con IA' : 'Create with AI'}
            </Button>
            <Dialog open={showNewAssignment} onOpenChange={setShowNewAssignment}>
              <DialogTrigger asChild>
                <Button data-testid="new-assignment-btn">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createAssignment')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('createAssignment')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{t('title')}</Label>
                    <Input 
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                      data-testid="assignment-title-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('category')}</Label>
                    <Select 
                      value={newAssignment.category_id}
                      onValueChange={(v) => setNewAssignment(prev => ({ ...prev, category_id: v }))}
                    >
                      <SelectTrigger data-testid="assignment-category-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.category_id} value={cat.category_id}>
                            {language === 'es' ? cat.name_es : cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('points')}</Label>
                      <Input 
                        type="number"
                        value={newAssignment.points}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, points: parseFloat(e.target.value) }))}
                        data-testid="assignment-points-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('dueDate')}</Label>
                      <Input 
                        type="date"
                        value={newAssignment.due_date}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                        data-testid="assignment-due-date-input"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateAssignment} className="w-full" data-testid="create-assignment-submit">
                    {t('save')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Assignment List Dialog */}
        <Dialog open={showAssignmentList} onOpenChange={setShowAssignmentList}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{language === 'es' ? 'Lista de Tareas' : 'Assignment List'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-4">
              {assignments.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  {language === 'es' ? 'No hay tareas creadas' : 'No assignments created'}
                </p>
              ) : (
                assignments.map(assignment => {
                  const category = categories.find(c => c.category_id === assignment.category_id);
                  return (
                    <div 
                      key={assignment.assignment_id} 
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{assignment.title}</div>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {language === 'es' ? category?.name_es : category?.name}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {assignment.points} {language === 'es' ? 'pts' : 'points'}
                          </span>
                          {assignment.due_date && (
                            <span className="text-sm text-slate-500">
                              {new Date(assignment.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingAssignment({...assignment})}
                          data-testid={`edit-assignment-${assignment.assignment_id}`}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                          data-testid={`delete-assignment-${assignment.assignment_id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'es' ? 'Editar Tarea' : 'Edit Assignment'}</DialogTitle>
            </DialogHeader>
            {editingAssignment && (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{t('title')}</Label>
                  <Input 
                    value={editingAssignment.title}
                    onChange={(e) => setEditingAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('category')}</Label>
                  <Select 
                    value={editingAssignment.category_id}
                    onValueChange={(v) => setEditingAssignment(prev => ({ ...prev, category_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.category_id} value={cat.category_id}>
                          {language === 'es' ? cat.name_es : cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('points')}</Label>
                    <Input 
                      type="number"
                      value={editingAssignment.points}
                      onChange={(e) => setEditingAssignment(prev => ({ ...prev, points: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('dueDate')}</Label>
                    <Input 
                      type="date"
                      value={editingAssignment.due_date || ''}
                      onChange={(e) => setEditingAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleEditAssignment} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {t('save')}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingAssignment(null)}>
                    {language === 'es' ? 'Cancelar' : 'Cancel'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Semester and Class Selector */}
        <Card className="bg-white border-slate-100">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Semester Selector */}
              {semesters.length > 0 && (
                <div className="flex-1">
                  <Label className="text-sm text-slate-500 mb-1.5 block">
                    {language === 'es' ? 'Semestre' : 'Semester'}
                  </Label>
                  <Select value={selectedSemester || "all"} onValueChange={(v) => setSelectedSemester(v === "all" ? "" : v)}>
                    <SelectTrigger className="w-full" data-testid="gradebook-semester-select">
                      <SelectValue placeholder={language === 'es' ? 'Todos los semestres' : 'All semesters'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{language === 'es' ? 'Todos los semestres' : 'All semesters'}</SelectItem>
                      {semesters.map(sem => (
                        <SelectItem key={sem.semester_id} value={sem.semester_id}>
                          {language === 'es' ? sem.name_es || sem.name : sem.name}
                          {sem.is_active && (
                            <span className="ml-2 text-green-600 text-xs">(Activo)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Class Selector */}
              <div className="flex-1">
                <Label className="text-sm text-slate-500 mb-1.5 block">
                  {language === 'es' ? 'Clase' : 'Class'}
                </Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-full" data-testid="gradebook-class-select">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar clase' : 'Select class'} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map(cls => (
                      <SelectItem key={cls.class_id} value={cls.class_id}>
                        {cls.name} ({cls.grade}-{cls.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Semester Indicator */}
            {selectedSemester && semesters.find(s => s.semester_id === selectedSemester) && (
              <div className="mt-3 p-2 bg-green-50 border border-green-100 rounded-lg">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                  {language === 'es' ? 'Trabajando en:' : 'Working on:'} {' '}
                  <strong>{semesters.find(s => s.semester_id === selectedSemester)?.name}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Categories Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <Card key={cat.category_id} className="bg-white border-slate-100">
              <CardContent className="p-4">
                <p className="font-medium text-slate-800">{language === 'es' ? cat.name_es || cat.name : cat.name}</p>
                <p className="text-sm text-slate-500">{cat.weight_percent}% {language === 'es' ? 'del total' : 'of total'}</p>
                <Badge variant="secondary" className="mt-2">
                  {assignments.filter(a => a.category_id === cat.category_id).length} {t('assignments').toLowerCase()}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>


        {/* Grade Grid */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('gradeEntry')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64 w-full" />
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>{language === 'es' ? 'No hay estudiantes' : 'No students'}</p>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>{language === 'es' ? 'No hay tareas' : 'No assignments'}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowNewAssignment(true)}
                >
                  {t('createAssignment')}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 font-medium text-slate-700 sticky left-0 bg-white min-w-48">
                        {t('students')}
                      </th>
                      {assignments.map(assignment => (
                        <th key={assignment.assignment_id} className="text-center p-3 font-medium text-slate-700 min-w-24">
                          <div className="truncate max-w-24" title={assignment.title}>
                            {assignment.title}
                          </div>
                          <div className="text-xs text-slate-500 font-normal">
                            {assignment.points} pts
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-3 font-medium text-slate-700 min-w-28">
                        <div>{language === 'es' ? 'Nota' : 'Grade'}</div>
                        <div className="text-xs text-slate-500 font-normal">GPA</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.student_id} className="border-b border-slate-100 hover:bg-stone-50">
                        <td className="p-3 sticky left-0 bg-white">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                              <span className="text-xs font-medium text-slate-600">
                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                              </span>
                            </div>
                            <span className="font-medium text-slate-800">
                              {student.first_name} {student.last_name}
                            </span>
                          </div>
                        </td>
                        {assignments.map(assignment => {
                          const key = `${student.student_id}_${assignment.assignment_id}`;
                          const grade = grades[key];
                          return (
                            <td key={assignment.assignment_id} className="p-2 text-center">
                              <Input 
                                type="number"
                                min="0"
                                max={assignment.points}
                                step="0.5"
                                value={grade?.score ?? ''}
                                onChange={(e) => handleGradeChange(student.student_id, assignment.assignment_id, e.target.value)}
                                className="w-16 mx-auto text-center text-sm h-8"
                                data-testid={`grade-${student.student_id}-${assignment.assignment_id}`}
                              />
                            </td>
                          );
                        })}
                        <td className="p-3 text-center">
                          {(() => {
                            const gradeInfo = getStudentGradeInfo(student.student_id);
                            return (
                              <div className="flex flex-col items-center gap-1">
                                <Badge className={`font-bold text-sm px-3 py-1 ${gradeInfo.color}`}>
                                  {gradeInfo.letter}
                                </Badge>
                                <div className="text-xs text-slate-500 font-mono">
                                  {gradeInfo.gpa !== '-' ? `${gradeInfo.gpa} GPA` : '-'}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {gradeInfo.percentage !== '-' ? `${gradeInfo.percentage}%` : ''}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Manager Dialog */}
        <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {language === 'es' ? 'Gestionar Categorías de Calificación' : 'Manage Grade Categories'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* GPA Scale Reference */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-sm text-slate-700 mb-2">
                  {language === 'es' ? 'Escala de Calificaciones' : 'Grade Scale'}
                </h4>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-green-100 text-green-800 rounded p-2">
                    <div className="font-bold">A</div>
                    <div>4.00 - 3.50</div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 rounded p-2">
                    <div className="font-bold">B</div>
                    <div>3.49 - 2.50</div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 rounded p-2">
                    <div className="font-bold">C</div>
                    <div>2.49 - 1.60</div>
                  </div>
                  <div className="bg-orange-100 text-orange-800 rounded p-2">
                    <div className="font-bold">D</div>
                    <div>1.59 - 0.80</div>
                  </div>
                  <div className="bg-red-100 text-red-800 rounded p-2">
                    <div className="font-bold">F</div>
                    <div>0.79 - 0</div>
                  </div>
                </div>
              </div>

              {/* Existing Categories */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-slate-700">
                    {language === 'es' ? 'Categorías Actuales' : 'Current Categories'}
                  </h4>
                  <Badge variant={totalWeight === 100 ? 'default' : 'destructive'}>
                    {language === 'es' ? 'Peso Total' : 'Total Weight'}: {totalWeight}%
                  </Badge>
                </div>
                
                {categories.map(cat => (
                  <div key={cat.category_id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                    {editingCategory === cat.category_id ? (
                      <>
                        <Input
                          value={cat.name}
                          onChange={(e) => setCategories(categories.map(c => 
                            c.category_id === cat.category_id ? { ...c, name: e.target.value } : c
                          ))}
                          className="flex-1"
                          placeholder="Category name"
                        />
                        <Input
                          value={cat.name_es || ''}
                          onChange={(e) => setCategories(categories.map(c => 
                            c.category_id === cat.category_id ? { ...c, name_es: e.target.value } : c
                          ))}
                          className="flex-1"
                          placeholder="Nombre en español"
                        />
                        <Input
                          type="number"
                          value={cat.weight_percent}
                          onChange={(e) => setCategories(categories.map(c => 
                            c.category_id === cat.category_id ? { ...c, weight_percent: parseInt(e.target.value) || 0 } : c
                          ))}
                          className="w-20"
                          min="0"
                          max="100"
                        />
                        <span className="text-slate-500">%</span>
                        <Button size="sm" onClick={() => handleUpdateCategory(cat.category_id, {
                          name: cat.name,
                          name_es: cat.name_es,
                          weight_percent: cat.weight_percent
                        })}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>
                          {language === 'es' ? 'Cancelar' : 'Cancel'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className="font-medium">{language === 'es' ? cat.name_es : cat.name}</div>
                          <div className="text-xs text-slate-500">
                            {assignments.filter(a => a.category_id === cat.category_id).length} {language === 'es' ? 'asignaciones' : 'assignments'}
                          </div>
                        </div>
                        <Badge variant="outline">{cat.weight_percent}%</Badge>
                        <Button size="sm" variant="ghost" onClick={() => setEditingCategory(cat.category_id)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteCategory(cat.category_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}

                {categories.length === 0 && (
                  <p className="text-center text-slate-500 py-4">
                    {language === 'es' ? 'No hay categorías. Crea una para comenzar.' : 'No categories. Create one to get started.'}
                  </p>
                )}
              </div>

              {/* Add New Category */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-700 mb-3">
                  {language === 'es' ? 'Agregar Nueva Categoría' : 'Add New Category'}
                </h4>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder={language === 'es' ? 'Nombre (inglés)' : 'Name (English)'}
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder={language === 'es' ? 'Nombre (español)' : 'Name (Spanish)'}
                    value={newCategory.name_es}
                    onChange={(e) => setNewCategory({ ...newCategory, name_es: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="%"
                    value={newCategory.weight}
                    onChange={(e) => setNewCategory({ ...newCategory, weight: parseInt(e.target.value) || 0 })}
                    className="w-20"
                    min="0"
                    max="100"
                  />
                  <span className="text-slate-500">%</span>
                  <Button onClick={handleAddCategory} disabled={!newCategory.name}>
                    <Plus className="h-4 w-4 mr-2" />
                    {language === 'es' ? 'Agregar' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Assignment Generator Dialog */}
        <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-500" />
                {language === 'es' ? 'Generar Tarea con IA' : 'Generate Assignment with AI'}
              </DialogTitle>
            </DialogHeader>
            
            {!aiAssignment ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Tema *' : 'Topic *'}</Label>
                  <Input
                    value={aiRequest.topic}
                    onChange={(e) => setAiRequest({...aiRequest, topic: e.target.value})}
                    placeholder={language === 'es' ? 'Ej: Fracciones, Revolución Americana...' : 'E.g., Fractions, American Revolution...'}
                    data-testid="ai-topic-input"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Materia' : 'Subject'}</Label>
                    <Select value={aiRequest.subject} onValueChange={(v) => setAiRequest({...aiRequest, subject: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Math">{language === 'es' ? 'Matemáticas' : 'Math'}</SelectItem>
                        <SelectItem value="Science">{language === 'es' ? 'Ciencias' : 'Science'}</SelectItem>
                        <SelectItem value="English">{language === 'es' ? 'Inglés' : 'English'}</SelectItem>
                        <SelectItem value="History">{language === 'es' ? 'Historia' : 'History'}</SelectItem>
                        <SelectItem value="Geography">{language === 'es' ? 'Geografía' : 'Geography'}</SelectItem>
                        <SelectItem value="Art">{language === 'es' ? 'Arte' : 'Art'}</SelectItem>
                        <SelectItem value="Music">{language === 'es' ? 'Música' : 'Music'}</SelectItem>
                        <SelectItem value="Other">{language === 'es' ? 'Otro' : 'Other'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Grado' : 'Grade Level'}</Label>
                    <Select value={aiRequest.grade_level} onValueChange={(v) => setAiRequest({...aiRequest, grade_level: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="K">Kindergarten</SelectItem>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                          <SelectItem key={g} value={String(g)}>{language === 'es' ? `Grado ${g}` : `Grade ${g}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Dificultad' : 'Difficulty'}</Label>
                    <Select value={aiRequest.difficulty} onValueChange={(v) => setAiRequest({...aiRequest, difficulty: v})}>
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
                  <Label>{language === 'es' ? 'Tipos de Preguntas' : 'Question Types'}</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'multiple_choice', label: language === 'es' ? 'Opción Múltiple' : 'Multiple Choice' },
                      { value: 'short_answer', label: language === 'es' ? 'Respuesta Corta' : 'Short Answer' },
                      { value: 'essay', label: language === 'es' ? 'Ensayo' : 'Essay' },
                      { value: 'true_false', label: language === 'es' ? 'Verdadero/Falso' : 'True/False' },
                      { value: 'fill_blank', label: language === 'es' ? 'Completar' : 'Fill Blank' },
                      { value: 'matching', label: language === 'es' ? 'Emparejar' : 'Matching' }
                    ].map(type => (
                      <Badge
                        key={type.value}
                        variant={aiRequest.question_types.includes(type.value) ? 'default' : 'outline'}
                        className={`cursor-pointer ${aiRequest.question_types.includes(type.value) ? 'bg-violet-500' : ''}`}
                        onClick={() => {
                          const types = aiRequest.question_types.includes(type.value)
                            ? aiRequest.question_types.filter(t => t !== type.value)
                            : [...aiRequest.question_types, type.value];
                          setAiRequest({...aiRequest, question_types: types});
                        }}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Número de Preguntas' : 'Number of Questions'}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={aiRequest.num_questions}
                      onChange={(e) => setAiRequest({...aiRequest, num_questions: parseInt(e.target.value) || 5})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === 'es' ? 'Categoría' : 'Category'}</Label>
                    <Select value={newAssignment.category_id} onValueChange={(v) => setNewAssignment({...newAssignment, category_id: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === 'es' ? 'Seleccionar...' : 'Select...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.category_id} value={cat.category_id}>
                            {language === 'es' ? cat.name_es || cat.name : cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Instrucciones Adicionales (opcional)' : 'Additional Instructions (optional)'}</Label>
                  <Textarea
                    value={aiRequest.additional_instructions}
                    onChange={(e) => setAiRequest({...aiRequest, additional_instructions: e.target.value})}
                    placeholder={language === 'es' ? 'Ej: Enfocarse en problemas de palabra...' : 'E.g., Focus on word problems...'}
                    rows={2}
                  />
                </div>

                <Button
                  onClick={handleAIGenerate}
                  disabled={aiGenerating || !aiRequest.topic || aiRequest.question_types.length === 0}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  data-testid="generate-ai-assignment-btn"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'es' ? 'Generando...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Generar Tarea' : 'Generate Assignment'}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-violet-50 rounded-lg">
                  <h3 className="font-bold text-lg text-violet-900">{aiAssignment.title}</h3>
                  <p className="text-violet-700 mt-1">{aiAssignment.description}</p>
                  <p className="text-sm text-violet-600 mt-2"><strong>{language === 'es' ? 'Instrucciones:' : 'Instructions:'}</strong> {aiAssignment.instructions}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">{language === 'es' ? 'Preguntas Generadas' : 'Generated Questions'} ({aiAssignment.questions?.length})</h4>
                  {aiAssignment.questions?.map((q, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{idx + 1}. {q.question_text}</p>
                        <Badge variant="outline">{q.points} pts</Badge>
                      </div>
                      <Badge className="mt-2 bg-slate-200 text-slate-700">{q.question_type.replace('_', ' ')}</Badge>
                      {q.options && (
                        <div className="mt-2 space-y-1">
                          {q.options.map((opt, oidx) => (
                            <p key={oidx} className={`text-sm pl-4 ${opt.is_correct ? 'text-green-600 font-medium' : 'text-slate-600'}`}>
                              {String.fromCharCode(65 + oidx)}. {opt.text} {opt.is_correct && '✓'}
                            </p>
                          ))}
                        </div>
                      )}
                      {q.correct_answer && (
                        <p className="text-sm text-green-600 mt-2">{language === 'es' ? 'Respuesta:' : 'Answer:'} {q.correct_answer}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>{language === 'es' ? 'Fecha de Entrega (opcional)' : 'Due Date (optional)'}</Label>
                  <Input
                    type="date"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAiAssignment(null)}
                    className="flex-1"
                  >
                    {language === 'es' ? 'Regenerar' : 'Regenerate'}
                  </Button>
                  <Button
                    onClick={handleSaveAIAssignment}
                    disabled={savingAI || !newAssignment.category_id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="save-ai-assignment-btn"
                  >
                    {savingAI ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {language === 'es' ? 'Guardar y Obtener Enlace' : 'Save & Get Student Link'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Assignments Section */}
        {aiAssignments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-500" />
                {language === 'es' ? 'Tareas con IA' : 'AI Assignments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiAssignments.map(assignment => (
                  <div 
                    key={assignment.assignment_id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg border border-violet-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{assignment.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                        <span>{assignment.questions?.length || 0} {language === 'es' ? 'preguntas' : 'questions'}</span>
                        <span>•</span>
                        <span>{assignment.submission_count || 0} {language === 'es' ? 'envíos' : 'submissions'}</span>
                        <span>•</span>
                        <span>{assignment.graded_count || 0} {language === 'es' ? 'calificados' : 'graded'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyStudentLink(assignment.public_token)}
                        data-testid={`copy-link-${assignment.assignment_id}`}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        {language === 'es' ? 'Copiar Enlace' : 'Copy Link'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/assignment/${assignment.public_token}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        {language === 'es' ? 'Ver' : 'View'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate('/ai-grading')}
                        className="bg-violet-600 hover:bg-violet-700"
                      >
                        <Brain className="w-4 h-4 mr-1" />
                        {language === 'es' ? 'Calificar' : 'Grade'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Gradebook;
