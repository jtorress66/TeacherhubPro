import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  FileText, Printer, Download, Loader2, GraduationCap, 
  User, Calendar, School, Award, BookOpen, Clock,
  CheckCircle2, AlertCircle, TrendingUp, TrendingDown,
  Users, Search, Filter, ChevronRight, Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ReportCards = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [school, setSchool] = useState(null);
  const [semesters, setSemesters] = useState([]);
  
  // Selection state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [activeTab, setActiveTab] = useState('individual');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Batch generation state
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // Report card data
  const [reportData, setReportData] = useState(null);
  const [teacherComments, setTeacherComments] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    }
  }, [selectedClass]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, schoolsRes, semestersRes] = await Promise.all([
        axios.get(`${API}/classes`, { withCredentials: true }),
        axios.get(`${API}/schools`, { withCredentials: true }),
        axios.get(`${API}/semesters`, { withCredentials: true })
      ]);
      setClasses(classesRes.data || []);
      // Schools endpoint returns array, get first one (user's school)
      const schoolsData = schoolsRes.data || [];
      if (schoolsData.length > 0) {
        setSchool(schoolsData[0]);
      }
      setSemesters(semestersRes.data || []);
      
      // Set default semester to active one
      const activeSemester = semestersRes.data?.find(s => s.is_active);
      if (activeSemester) {
        setSelectedSemester(activeSemester.semester_id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(language === 'es' ? 'Error al cargar datos' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const res = await axios.get(`${API}/classes/${classId}/students`, { withCredentials: true });
      setStudents(res.data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const generateReportCard = async () => {
    if (!selectedStudent || !selectedClass) {
      toast.error(language === 'es' ? 'Seleccione un estudiante' : 'Select a student');
      return;
    }

    setGenerating(true);
    try {
      const res = await axios.get(
        `${API}/report-cards/generate?student_id=${selectedStudent}&class_id=${selectedClass}&semester_id=${selectedSemester}`,
        { withCredentials: true }
      );
      setReportData(res.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(language === 'es' ? 'Error al generar reporte' : 'Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${language === 'es' ? 'Boleta de Calificaciones' : 'Report Card'}</title>
        <style>
          @page { size: letter; margin: 0.5in; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11pt;
            line-height: 1.4;
            color: #333;
          }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .school-logo { max-height: 80px; margin-bottom: 10px; }
          .school-name { font-size: 18pt; font-weight: bold; margin: 5px 0; }
          .report-title { font-size: 14pt; color: #666; margin-top: 10px; }
          .student-info { display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: #f5f5f5; }
          .info-item { }
          .info-label { font-size: 9pt; color: #666; }
          .info-value { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f0f0f0; font-weight: bold; }
          .grade { text-align: center; font-weight: bold; }
          .grade-a { color: #16a34a; }
          .grade-b { color: #2563eb; }
          .grade-c { color: #ca8a04; }
          .grade-d { color: #ea580c; }
          .grade-f { color: #dc2626; }
          .gpa-section { text-align: center; padding: 15px; background: #f9f9f9; border-radius: 8px; margin: 15px 0; }
          .gpa-value { font-size: 24pt; font-weight: bold; color: #1e40af; }
          .attendance-section { margin: 15px 0; }
          .attendance-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
          .attendance-item { text-align: center; padding: 10px; background: #f5f5f5; border-radius: 5px; }
          .attendance-value { font-size: 18pt; font-weight: bold; }
          .attendance-label { font-size: 9pt; color: #666; }
          .comments-section { margin: 15px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
          .comments-title { font-weight: bold; margin-bottom: 10px; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature-line { width: 200px; border-top: 1px solid #333; padding-top: 5px; text-align: center; font-size: 10pt; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getGradeColor = (grade) => {
    if (grade >= 90) return 'grade-a';
    if (grade >= 80) return 'grade-b';
    if (grade >= 70) return 'grade-c';
    if (grade >= 60) return 'grade-d';
    return 'grade-f';
  };

  const getLetterGrade = (grade) => {
    if (grade >= 90) return 'A';
    if (grade >= 80) return 'B';
    if (grade >= 70) return 'C';
    if (grade >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800 flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              {language === 'es' ? 'Boletas de Calificaciones' : 'Report Cards'}
            </h1>
            <p className="text-slate-500 mt-1">
              {language === 'es' ? 'Generar e imprimir boletas de calificaciones' : 'Generate and print student report cards'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selection Panel */}
          <Card>
            <CardHeader>
              <CardTitle>{language === 'es' ? 'Seleccionar Estudiante' : 'Select Student'}</CardTitle>
              <CardDescription>
                {language === 'es' ? 'Elija la clase, estudiante y período' : 'Choose class, student, and period'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Semester Selection */}
              <div>
                <Label>{language === 'es' ? 'Semestre' : 'Semester'}</Label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger data-testid="semester-select">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar semestre' : 'Select semester'} />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map(sem => (
                      <SelectItem key={sem.semester_id} value={sem.semester_id}>
                        {language === 'es' ? sem.name_es || sem.name : sem.name}
                        {sem.is_active && ` (${language === 'es' ? 'Activo' : 'Active'})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Class Selection */}
              <div>
                <Label>{language === 'es' ? 'Clase' : 'Class'}</Label>
                <Select value={selectedClass} onValueChange={(v) => {
                  setSelectedClass(v);
                  setSelectedStudent('');
                  setReportData(null);
                }}>
                  <SelectTrigger data-testid="class-select">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar clase' : 'Select class'} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.class_id} value={cls.class_id}>
                        {cls.name} - {cls.grade_level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Student Selection */}
              <div>
                <Label>{language === 'es' ? 'Estudiante' : 'Student'}</Label>
                <Select 
                  value={selectedStudent} 
                  onValueChange={(v) => {
                    setSelectedStudent(v);
                    setReportData(null);
                  }}
                  disabled={!selectedClass}
                >
                  <SelectTrigger data-testid="student-select">
                    <SelectValue placeholder={language === 'es' ? 'Seleccionar estudiante' : 'Select student'} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(stu => (
                      <SelectItem key={stu.student_id} value={stu.student_id}>
                        {stu.name || `${stu.first_name} ${stu.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button 
                className="w-full"
                onClick={generateReportCard}
                disabled={!selectedStudent || !selectedClass || generating}
                data-testid="generate-report-btn"
              >
                {generating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {language === 'es' ? 'Generando...' : 'Generating...'}</>
                ) : (
                  <><FileText className="h-4 w-4 mr-2" /> {language === 'es' ? 'Generar Boleta' : 'Generate Report Card'}</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            {!reportData ? (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {language === 'es' 
                      ? 'Seleccione un estudiante para generar la boleta de calificaciones'
                      : 'Select a student to generate the report card'}
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{language === 'es' ? 'Vista Previa' : 'Preview'}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} data-testid="print-report-btn">
                      <Printer className="h-4 w-4 mr-2" />
                      {language === 'es' ? 'Imprimir' : 'Print'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Teacher Comments Input */}
                  <div className="mb-4">
                    <Label>{language === 'es' ? 'Comentarios del Maestro' : 'Teacher Comments'}</Label>
                    <Textarea 
                      value={teacherComments}
                      onChange={(e) => setTeacherComments(e.target.value)}
                      placeholder={language === 'es' ? 'Agregar comentarios sobre el desempeño del estudiante...' : 'Add comments about student performance...'}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* Report Card Preview */}
                  <div 
                    ref={printRef}
                    className="border rounded-lg p-6 bg-white"
                    style={{ minHeight: '600px' }}
                  >
                    {/* Header */}
                    <div className="header text-center border-b-2 border-slate-800 pb-4 mb-4">
                      {school?.logo_url && (
                        <img src={school.logo_url} alt="School Logo" className="school-logo mx-auto h-20 object-contain mb-2" />
                      )}
                      <h1 className="school-name text-xl font-bold">{school?.name || 'School Name'}</h1>
                      <p className="text-sm text-slate-600">{school?.address}</p>
                      <h2 className="report-title text-lg mt-2 text-slate-700">
                        {language === 'es' ? 'BOLETA DE CALIFICACIONES' : 'REPORT CARD'}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {semesters.find(s => s.semester_id === selectedSemester)?.name || ''}
                      </p>
                    </div>

                    {/* Student Info */}
                    <div className="student-info grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg mb-4">
                      <div>
                        <p className="info-label text-xs text-slate-500">{language === 'es' ? 'Nombre' : 'Name'}</p>
                        <p className="info-value font-semibold">{reportData.student?.name}</p>
                      </div>
                      <div>
                        <p className="info-label text-xs text-slate-500">{language === 'es' ? 'Grado' : 'Grade'}</p>
                        <p className="info-value font-semibold">{reportData.class?.grade_level}</p>
                      </div>
                      <div>
                        <p className="info-label text-xs text-slate-500">{language === 'es' ? 'Clase' : 'Class'}</p>
                        <p className="info-value font-semibold">{reportData.class?.name}</p>
                      </div>
                      <div>
                        <p className="info-label text-xs text-slate-500">{language === 'es' ? 'ID Estudiante' : 'Student ID'}</p>
                        <p className="info-value font-semibold">{reportData.student?.student_number || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Grades Table */}
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        {language === 'es' ? 'Calificaciones por Materia' : 'Grades by Subject'}
                      </h3>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border p-2 text-left">{language === 'es' ? 'Materia' : 'Subject'}</th>
                            <th className="border p-2 text-center">{language === 'es' ? 'Calificación' : 'Grade'}</th>
                            <th className="border p-2 text-center">{language === 'es' ? 'Letra' : 'Letter'}</th>
                            <th className="border p-2 text-center">{language === 'es' ? 'Puntos' : 'Points'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.grades?.length > 0 ? (
                            reportData.grades.map((grade, idx) => (
                              <tr key={idx}>
                                <td className="border p-2">{grade.category || grade.assignment_name || 'General'}</td>
                                <td className={`border p-2 text-center font-bold ${getGradeColor(grade.percentage || grade.grade)}`}>
                                  {(grade.percentage || grade.grade || 0).toFixed(1)}%
                                </td>
                                <td className={`border p-2 text-center font-bold ${getGradeColor(grade.percentage || grade.grade)}`}>
                                  {getLetterGrade(grade.percentage || grade.grade)}
                                </td>
                                <td className="border p-2 text-center">
                                  {grade.points_earned || grade.grade || 0} / {grade.points_possible || 100}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="border p-4 text-center text-slate-500">
                                {language === 'es' ? 'No hay calificaciones registradas' : 'No grades recorded'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* GPA Section */}
                    <div className="gpa-section bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 text-center">
                      <p className="text-sm text-slate-600 mb-1">{language === 'es' ? 'Promedio General (GPA)' : 'Grade Point Average (GPA)'}</p>
                      <p className="gpa-value text-3xl font-bold text-blue-700">
                        {reportData.gpa?.toFixed(2) || 'N/A'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {language === 'es' ? 'de 4.0' : 'of 4.0'}
                      </p>
                    </div>

                    {/* Attendance Section */}
                    <div className="attendance-section mb-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {language === 'es' ? 'Resumen de Asistencia' : 'Attendance Summary'}
                      </h3>
                      <div className="attendance-grid grid grid-cols-4 gap-3">
                        <div className="attendance-item bg-green-50 p-3 rounded-lg text-center">
                          <p className="attendance-value text-xl font-bold text-green-600">{reportData.attendance?.present || 0}</p>
                          <p className="attendance-label text-xs text-slate-600">{language === 'es' ? 'Presente' : 'Present'}</p>
                        </div>
                        <div className="attendance-item bg-red-50 p-3 rounded-lg text-center">
                          <p className="attendance-value text-xl font-bold text-red-600">{reportData.attendance?.absent || 0}</p>
                          <p className="attendance-label text-xs text-slate-600">{language === 'es' ? 'Ausente' : 'Absent'}</p>
                        </div>
                        <div className="attendance-item bg-amber-50 p-3 rounded-lg text-center">
                          <p className="attendance-value text-xl font-bold text-amber-600">{reportData.attendance?.tardy || 0}</p>
                          <p className="attendance-label text-xs text-slate-600">{language === 'es' ? 'Tardanza' : 'Tardy'}</p>
                        </div>
                        <div className="attendance-item bg-blue-50 p-3 rounded-lg text-center">
                          <p className="attendance-value text-xl font-bold text-blue-600">
                            {reportData.attendance?.rate?.toFixed(1) || 0}%
                          </p>
                          <p className="attendance-label text-xs text-slate-600">{language === 'es' ? 'Tasa' : 'Rate'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Teacher Comments */}
                    {teacherComments && (
                      <div className="comments-section border p-4 rounded-lg mb-4">
                        <h3 className="comments-title font-semibold mb-2">
                          {language === 'es' ? 'Comentarios del Maestro' : 'Teacher Comments'}
                        </h3>
                        <p className="text-slate-700 whitespace-pre-wrap">{teacherComments}</p>
                      </div>
                    )}

                    {/* Signatures */}
                    <div className="signature-section flex justify-between mt-8 pt-4">
                      <div className="signature-line border-t border-slate-400 w-48 pt-2 text-center">
                        <p className="text-sm text-slate-600">{language === 'es' ? 'Firma del Maestro' : 'Teacher Signature'}</p>
                      </div>
                      <div className="signature-line border-t border-slate-400 w-48 pt-2 text-center">
                        <p className="text-sm text-slate-600">{language === 'es' ? 'Firma del Director' : 'Principal Signature'}</p>
                      </div>
                      <div className="signature-line border-t border-slate-400 w-48 pt-2 text-center">
                        <p className="text-sm text-slate-600">{language === 'es' ? 'Firma del Padre/Tutor' : 'Parent/Guardian Signature'}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-6 pt-4 border-t text-xs text-slate-500">
                      <p>{language === 'es' ? 'Generado por TeacherHubPro' : 'Generated by TeacherHubPro'} • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportCards;
