import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, AlertCircle, Users, Save, FileDown } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUSES = [
  { value: 'present', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'absent', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'tardy', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'excused', icon: AlertCircle, color: 'text-blue-600 bg-blue-50 border-blue-200' }
];

const Attendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(searchParams.get('class') || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [existingSession, setExistingSession] = useState(null);

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
      } finally {
        setLoading(false);
      }
    };
    fetchClasses();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch students
        const studentsRes = await axios.get(`${API}/classes/${selectedClass}/students`, { withCredentials: true });
        setStudents(studentsRes.data);

        // Fetch existing attendance for this date
        const attendanceRes = await axios.get(`${API}/attendance`, { 
          params: { class_id: selectedClass, date: selectedDate },
          withCredentials: true 
        });
        
        const session = attendanceRes.data.find(s => s.date === selectedDate);
        setExistingSession(session);

        // Initialize records
        if (session) {
          setRecords(studentsRes.data.map(student => {
            const existing = session.records.find(r => r.student_id === student.student_id);
            return {
              student_id: student.student_id,
              status: existing?.status || 'present',
              minutes_late: existing?.minutes_late || 0,
              note: existing?.note || ''
            };
          }));
        } else {
          setRecords(studentsRes.data.map(student => ({
            student_id: student.student_id,
            status: 'present',
            minutes_late: 0,
            note: ''
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedClass, selectedDate, t]);

  const updateRecord = (studentId, field, value) => {
    setRecords(prev => prev.map(r => 
      r.student_id === studentId ? { ...r, [field]: value } : r
    ));
  };

  const markAllPresent = () => {
    setRecords(prev => prev.map(r => ({ ...r, status: 'present' })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/attendance`, {
        class_id: selectedClass,
        date: selectedDate,
        records
      }, { withCredentials: true });
      
      toast.success(language === 'es' ? 'Asistencia guardada' : 'Attendance saved');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusCounts = () => {
    const counts = { present: 0, absent: 0, tardy: 0, excused: 0 };
    records.forEach(r => counts[r.status]++);
    return counts;
  };

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

  const counts = getStatusCounts();
  const selectedClassData = classes.find(c => c.class_id === selectedClass);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-slate-800">{t('attendance')}</h1>
            <p className="text-slate-500">{t('takeAttendance')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllPresent} data-testid="mark-all-present">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('markAllPresent')}
            </Button>
            <Button onClick={handleSave} disabled={saving} data-testid="save-attendance">
              <Save className="h-4 w-4 mr-2" />
              {saving ? t('loading') : t('save')}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border-slate-100">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger data-testid="attendance-class-select">
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
              <div className="w-48">
                <Input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  data-testid="attendance-date"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATUSES.map(status => (
            <Card key={status.value} className={`${status.color} border`}>
              <CardContent className="p-4 flex items-center gap-3">
                <status.icon className="h-6 w-6" />
                <div>
                  <p className="text-2xl font-bold">{counts[status.value]}</p>
                  <p className="text-sm capitalize">{t(status.value)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Students List */}
        <Card className="bg-white border-slate-100">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedClassData?.name || t('students')} 
              <Badge variant="secondary">{students.length}</Badge>
            </CardTitle>
            {existingSession && (
              <Badge variant="outline" className="text-green-600">
                {language === 'es' ? 'Guardado' : 'Saved'}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>{language === 'es' ? 'No hay estudiantes en esta clase' : 'No students in this class'}</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate(`/classes/${selectedClass}`)}
                >
                  {t('addStudent')}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map((student, index) => {
                  const record = records.find(r => r.student_id === student.student_id);
                  return (
                    <div 
                      key={student.student_id}
                      className="flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-lg bg-stone-50 border border-slate-100"
                      data-testid={`student-row-${student.student_id}`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm text-slate-500 w-6">{index + 1}</span>
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {student.first_name} {student.last_name}
                          </p>
                          {student.student_number && (
                            <p className="text-xs text-slate-500">{student.student_number}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {STATUSES.map(status => (
                          <Button
                            key={status.value}
                            variant={record?.status === status.value ? 'default' : 'outline'}
                            size="sm"
                            className={record?.status === status.value ? status.color : ''}
                            onClick={() => updateRecord(student.student_id, 'status', status.value)}
                            data-testid={`status-${student.student_id}-${status.value}`}
                          >
                            <status.icon className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">{t(status.value)}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Attendance;
