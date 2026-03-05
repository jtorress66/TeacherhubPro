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
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';
import { Calendar, FileDown, Printer, Users, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const API = `${window.location.origin}/api`;

const AttendanceReports = () => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await axios.get(`${API}/classes`, { withCredentials: true });
        setClasses(res.data);
        if (res.data.length > 0) {
          setSelectedClass(res.data[0].class_id);
        }
      } catch (error) {
        console.error('Error fetching classes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchReport();
    }
  }, [selectedClass, startDate, endDate]);

  const fetchReport = async () => {
    setLoadingReport(true);
    try {
      const res = await axios.get(`${API}/attendance/report/${selectedClass}`, {
        params: { start_date: startDate, end_date: endDate },
        withCredentials: true
      });
      setReportData(res.data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error(t('error'));
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateOverallStats = () => {
    if (!reportData?.report) return { present: 0, absent: 0, tardy: 0, excused: 0, total: 0 };
    
    return reportData.report.reduce((acc, student) => ({
      present: acc.present + (student.present || 0),
      absent: acc.absent + (student.absent || 0),
      tardy: acc.tardy + (student.tardy || 0),
      excused: acc.excused + (student.excused || 0),
      total: acc.total + (student.total_days || 0)
    }), { present: 0, absent: 0, tardy: 0, excused: 0, total: 0 });
  };

  const getAttendanceRate = (student) => {
    if (!student.total_days || student.total_days === 0) return 0;
    return ((student.present / student.total_days) * 100).toFixed(1);
  };

  const selectedClassData = classes.find(c => c.class_id === selectedClass);
  const overallStats = calculateOverallStats();
  const totalPossible = overallStats.total;
  const overallRate = totalPossible > 0 ? ((overallStats.present / totalPossible) * 100).toFixed(1) : 0;

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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800">
              {language === 'es' ? 'Reportes de Asistencia' : 'Attendance Reports'}
            </h1>
            <p className="text-slate-500">
              {language === 'es' ? 'Análisis detallado por período' : 'Detailed analysis by period'}
            </p>
          </div>
          <Button onClick={handlePrint} className="gap-2" data-testid="print-report-btn">
            <Printer className="h-4 w-4" />
            {language === 'es' ? 'Imprimir' : 'Print'}
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-white border-slate-100 no-print">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>{t('classes')}</Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger data-testid="report-class-select">
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
              <div className="space-y-2">
                <Label>{t('from')}</Label>
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="report-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('to')}</Label>
                <Input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="report-end-date"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={fetchReport} className="w-full" data-testid="generate-report-btn">
                  {language === 'es' ? 'Generar Reporte' : 'Generate Report'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Print Header */}
        <div className="print-only hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold">Attendance Report</h1>
          <p>{selectedClassData?.name} ({selectedClassData?.grade}-{selectedClassData?.section})</p>
          <p className="text-sm">{startDate} to {endDate}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700">{overallStats.present}</p>
                <p className="text-sm text-green-600">{t('present')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-700">{overallStats.absent}</p>
                <p className="text-sm text-red-600">{t('absent')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold text-amber-700">{overallStats.tardy}</p>
                <p className="text-sm text-amber-600">{t('tardy')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-700">{overallStats.excused}</p>
                <p className="text-sm text-blue-600">{t('excused')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-lime-50 border-lime-200">
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-lime-600" />
              <div>
                <p className="text-2xl font-bold text-lime-700">{overallRate}%</p>
                <p className="text-sm text-lime-600">{language === 'es' ? 'Tasa' : 'Rate'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student Detail Table */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'es' ? 'Detalle por Estudiante' : 'Student Detail'}
              {selectedClassData && (
                <Badge variant="secondary">
                  {selectedClassData.name} - {selectedClassData.grade}-{selectedClassData.section}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingReport ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !reportData?.report || reportData.report.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>{language === 'es' ? 'No hay datos de asistencia para este período' : 'No attendance data for this period'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left p-3 font-medium text-slate-700">#</th>
                      <th className="text-left p-3 font-medium text-slate-700">{t('students')}</th>
                      <th className="text-center p-3 font-medium text-slate-700">{t('present')}</th>
                      <th className="text-center p-3 font-medium text-slate-700">{t('absent')}</th>
                      <th className="text-center p-3 font-medium text-slate-700">{t('tardy')}</th>
                      <th className="text-center p-3 font-medium text-slate-700">{t('excused')}</th>
                      <th className="text-center p-3 font-medium text-slate-700">
                        {language === 'es' ? 'Total Días' : 'Total Days'}
                      </th>
                      <th className="text-center p-3 font-medium text-slate-700">
                        {language === 'es' ? 'Tasa' : 'Rate'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.report.map((student, index) => {
                      const rate = getAttendanceRate(student);
                      const rateColor = rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-amber-600' : 'text-red-600';
                      
                      return (
                        <tr key={student.student_id} className="border-b border-slate-100 hover:bg-stone-50">
                          <td className="p-3 text-slate-500">{index + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-slate-600">
                                  {student.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </span>
                              </div>
                              <span className="font-medium text-slate-800">{student.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded bg-green-100 text-green-700 font-medium">
                              {student.present || 0}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-medium">
                              {student.absent || 0}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-medium">
                              {student.tardy || 0}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 font-medium">
                              {student.excused || 0}
                            </span>
                          </td>
                          <td className="p-3 text-center text-slate-600">{student.total_days || 0}</td>
                          <td className="p-3 text-center">
                            <span className={`font-bold ${rateColor}`}>{rate}%</span>
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
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
      `}</style>
    </Layout>
  );
};

export default AttendanceReports;
