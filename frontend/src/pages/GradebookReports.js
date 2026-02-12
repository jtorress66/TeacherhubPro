import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { FileDown, Printer, Users, TrendingUp, Award, BookOpen, BarChart3 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// GPA Scale (matching Gradebook.js)
const GPA_SCALE = {
  getLetterGrade: (gpa) => {
    if (gpa >= 3.50) return 'A';
    if (gpa >= 2.50) return 'B';
    if (gpa >= 1.60) return 'C';
    if (gpa >= 0.80) return 'D';
    return 'F';
  },
  percentageToGPA: (percentage) => {
    if (percentage === null || percentage === undefined) return null;
    const pct = parseFloat(percentage);
    if (isNaN(pct)) return null;
    return Math.max(0, Math.min(4.0, (pct / 100) * 4.0));
  },
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

const GradebookReports = () => {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classesRes, semestersRes] = await Promise.all([
          axios.get(`${API}/classes`, { withCredentials: true }),
          axios.get(`${API}/semesters`, { withCredentials: true })
        ]);
        
        setClasses(classesRes.data);
        setSemesters(semestersRes.data);
        
        // Set active semester
        const activeSem = semestersRes.data.find(s => s.is_active);
        if (activeSem) {
          setSelectedSemester(activeSem.semester_id);
        }
        
        if (classesRes.data.length > 0) {
          setSelectedClass(classesRes.data[0].class_id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter classes by semester
  const filteredClasses = selectedSemester 
    ? classes.filter(c => c.semester_id === selectedSemester || !c.semester_id)
    : classes;

  useEffect(() => {
    if (selectedClass) {
      fetchReport();
    }
  }, [selectedClass]);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await axios.get(`${API}/gradebook/report/${selectedClass}`, {
        withCredentials: true
      });
      setReportData(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error(language === 'es' ? 'Error al cargar el reporte' : 'Error loading report');
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStudentGradeInfo = (percentage) => {
    if (percentage === null || percentage === undefined) {
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

  const calculateClassStats = () => {
    if (!reportData?.students || reportData.students.length === 0) {
      return { avgGPA: 0, avgPercentage: 0, gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 } };
    }

    const studentsWithGrades = reportData.students.filter(s => s.average !== null);
    if (studentsWithGrades.length === 0) {
      return { avgGPA: 0, avgPercentage: 0, gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 } };
    }

    const totalPercentage = studentsWithGrades.reduce((sum, s) => sum + s.average, 0);
    const avgPercentage = totalPercentage / studentsWithGrades.length;
    const avgGPA = GPA_SCALE.percentageToGPA(avgPercentage);

    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    studentsWithGrades.forEach(s => {
      const gpa = GPA_SCALE.percentageToGPA(s.average);
      const letter = GPA_SCALE.getLetterGrade(gpa);
      gradeDistribution[letter]++;
    });

    return { avgGPA, avgPercentage, gradeDistribution };
  };

  const selectedClassData = classes.find(c => c.class_id === selectedClass);
  const classStats = calculateClassStats();

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
      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-600" />
              {language === 'es' ? 'Reporte de Calificaciones' : 'Gradebook Report'}
            </h1>
            <p className="text-slate-500">
              {language === 'es' ? 'Resumen de notas por estudiante' : 'Grade summary by student'}
            </p>
          </div>
          <Button onClick={handlePrint} className="gap-2" data-testid="print-gradebook-report-btn">
            <Printer className="h-4 w-4" />
            {language === 'es' ? 'Imprimir' : 'Print'}
          </Button>
        </div>

        {/* Filters */}
        <Card className="print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label>{language === 'es' ? 'Clase' : 'Class'}</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger data-testid="gradebook-report-class-select">
                    <SelectValue />
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
              <Button onClick={fetchReport} data-testid="refresh-gradebook-report-btn">
                {language === 'es' ? 'Actualizar' : 'Refresh'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">{language === 'es' ? 'Reporte de Calificaciones' : 'Gradebook Report'}</h1>
          <p className="text-lg">{selectedClassData?.name} ({selectedClassData?.grade}-{selectedClassData?.section})</p>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString()}</p>
        </div>

        {/* Class Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {classStats.avgGPA ? classStats.avgGPA.toFixed(2) : '-'}
                  </p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'GPA Promedio' : 'Class GPA'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Award className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {classStats.avgPercentage ? classStats.avgPercentage.toFixed(1) + '%' : '-'}
                  </p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'Promedio' : 'Average'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{reportData?.students?.length || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'Estudiantes' : 'Students'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{reportData?.total_assignments || 0}</p>
                  <p className="text-xs text-slate-500">{language === 'es' ? 'Tareas' : 'Assignments'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grade Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {language === 'es' ? 'Distribución de Notas' : 'Grade Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center flex-wrap">
              {['A', 'B', 'C', 'D', 'F'].map(letter => (
                <div key={letter} className="text-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${GPA_SCALE.getGradeColor(letter)}`}>
                    {classStats.gradeDistribution[letter]}
                  </div>
                  <p className="text-sm font-medium mt-1">{letter}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Student Report Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'es' ? 'Detalle por Estudiante' : 'Student Detail'}</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReport ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !reportData?.students || reportData.students.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>{language === 'es' ? 'No hay estudiantes en esta clase' : 'No students in this class'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 font-medium text-slate-700">
                        {language === 'es' ? 'Estudiante' : 'Student'}
                      </th>
                      <th className="text-center p-3 font-medium text-slate-700">
                        {language === 'es' ? 'Tareas Completadas' : 'Completed'}
                      </th>
                      <th className="text-center p-3 font-medium text-slate-700">
                        {language === 'es' ? 'Puntos' : 'Points'}
                      </th>
                      <th className="text-center p-3 font-medium text-slate-700">
                        {language === 'es' ? 'Porcentaje' : 'Percentage'}
                      </th>
                      <th className="text-center p-3 font-medium text-slate-700">GPA</th>
                      <th className="text-center p-3 font-medium text-slate-700">
                        {language === 'es' ? 'Nota' : 'Grade'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.students.map((student, index) => {
                      const gradeInfo = getStudentGradeInfo(student.average);
                      return (
                        <tr key={student.student_id} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-slate-50/50' : ''}`}>
                          <td className="p-3">
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
                          <td className="p-3 text-center">
                            <span className="text-slate-600">
                              {student.assignments_completed || 0} / {reportData.total_assignments || 0}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-slate-600">
                              {student.total_points?.toFixed(1) || 0} / {student.max_points?.toFixed(1) || 0}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono text-slate-700">{gradeInfo.percentage}%</span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono text-slate-700">{gradeInfo.gpa}</span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={`font-bold ${gradeInfo.color}`}>
                              {gradeInfo.letter}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GPA Scale Reference */}
        <Card className="print:hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">
              {language === 'es' ? 'Escala de Calificaciones' : 'Grade Scale Reference'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center text-xs">
              <span className="px-2 py-1 rounded bg-green-100 text-green-800">A: 4.00-3.50</span>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">B: 3.49-2.50</span>
              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">C: 2.49-1.60</span>
              <span className="px-2 py-1 rounded bg-orange-100 text-orange-800">D: 1.59-0.80</span>
              <span className="px-2 py-1 rounded bg-red-100 text-red-800">F: 0.79-0</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GradebookReports;
