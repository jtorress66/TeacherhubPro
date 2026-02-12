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
import { toast } from 'sonner';
import { Plus, BookOpen, Save, Trash2, FileDown, Settings, FolderPlus } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_CATEGORIES = [
  { name: 'Homework', name_es: 'Tarea', weight: 25 },
  { name: 'Quiz', name_es: 'Prueba Corta', weight: 25 },
  { name: 'Test', name_es: 'Examen', weight: 30 },
  { name: 'Project', name_es: 'Proyecto', weight: 20 }
];

// GPA Scale Configuration (School's custom scale)
const GPA_SCALE = {
  // Letter grade ranges based on GPA
  getLetterGrade: (gpa) => {
    if (gpa >= 3.50) return 'A';
    if (gpa >= 2.50) return 'B';
    if (gpa >= 1.60) return 'C';
    if (gpa >= 0.80) return 'D';
    return 'F';
  },
  // Convert percentage to GPA (4.0 scale)
  percentageToGPA: (percentage) => {
    if (percentage === null || percentage === undefined || percentage === '-') return null;
    const pct = parseFloat(percentage);
    if (isNaN(pct)) return null;
    // Linear conversion: 100% = 4.0, 0% = 0.0
    return Math.max(0, Math.min(4.0, (pct / 100) * 4.0));
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
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState({});
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', name_es: '', weight: 10 });
  const [editingCategory, setEditingCategory] = useState(null);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    category_id: '',
    points: 100,
    due_date: '',
    description: ''
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API}/classes`, { withCredentials: true });
        setClasses(res.data);
        if (!selectedClass && res.data.length > 0) {
          setSelectedClass(res.data[0].class_id);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      }
    };
    fetchClasses();
  }, [selectedClass]);

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
    const letter = GPA_SCALE.getLetterGrade(gpa);
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
            <h1 className="text-3xl font-heading font-bold text-slate-800">{t('gradebook')}</h1>
            <p className="text-slate-500">{t('assignments')}</p>
          </div>
          <div className="flex gap-2">
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
                            {cat.name}
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

        {/* Class Selector */}
        <Card className="bg-white border-slate-100">
          <CardContent className="p-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full md:w-64" data-testid="gradebook-class-select">
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
          </CardContent>
        </Card>

        {/* Categories Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <Card key={cat.category_id} className="bg-white border-slate-100">
              <CardContent className="p-4">
                <p className="font-medium text-slate-800">{cat.name}</p>
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
                      <th className="text-center p-3 font-medium text-slate-700 min-w-20">
                        {language === 'es' ? 'Promedio' : 'Average'}
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
                          <Badge variant="outline" className="font-mono">
                            {calculateStudentAverage(student.student_id)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Gradebook;
