import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Printer, FileText, Users, AlertCircle, Edit2, Save } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SubstitutePacket = () => {
  const { t, language } = useLanguage();
  const printRef = useRef();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [packetData, setPacketData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Editable fields
  const [editableData, setEditableData] = useState({
    mainOfficeExt: 'Ext. 100',
    nurseExt: 'Ext. 105',
    dailyRoutines: '',
    emergencyProcedures: '',
    additionalNotes: ''
  });

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

  const generatePacket = async () => {
    if (!selectedClass) return;
    
    setGenerating(true);
    try {
      const [classRes, studentsRes, plansRes] = await Promise.all([
        axios.get(`${API}/classes/${selectedClass}`, { withCredentials: true }),
        axios.get(`${API}/classes/${selectedClass}/students`, { withCredentials: true }),
        axios.get(`${API}/plans?class_id=${selectedClass}`, { withCredentials: true })
      ]);

      const today = new Date();
      const currentPlan = plansRes.data.find(p => {
        if (!p.week_start) return false;
        const start = new Date(p.week_start);
        const end = p.week_end ? new Date(p.week_end) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        return today >= start && today <= end;
      }) || plansRes.data[0];

      setPacketData({
        classInfo: classRes.data,
        students: studentsRes.data,
        currentPlan: currentPlan,
        generatedAt: new Date().toISOString()
      });
      
      // Reset editable fields
      setEditableData({
        mainOfficeExt: 'Ext. 100',
        nurseExt: 'Ext. 105',
        dailyRoutines: '',
        emergencyProcedures: '',
        additionalNotes: ''
      });
    } catch (error) {
      console.error('Error generating packet:', error);
      toast.error(t('error'));
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
        <title>Substitute Packet - ${packetData?.classInfo?.name || 'Class'}</title>
        <style>
          @page { size: letter; margin: 0.5in; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; }
          .page { page-break-after: always; padding: 20px; }
          .page:last-child { page-break-after: avoid; }
          .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 15px; }
          .header h1 { font-size: 18pt; margin-bottom: 5px; }
          .header h2 { font-size: 14pt; font-weight: normal; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14pt; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-box { padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
          .info-box label { font-weight: bold; display: block; margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
          .student-row { page-break-inside: avoid; }
          .alert-box { background: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
          .seating-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-top: 10px; }
          .seat { border: 1px solid #333; padding: 8px; text-align: center; min-height: 50px; font-size: 9pt; }
          .notes-area { border: 1px solid #333; min-height: 100px; padding: 10px; margin-top: 10px; white-space: pre-wrap; }
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
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const getDayName = (dayKey) => {
    const days = {
      monday: language === 'es' ? 'Lunes' : 'Monday',
      tuesday: language === 'es' ? 'Martes' : 'Tuesday',
      wednesday: language === 'es' ? 'Miércoles' : 'Wednesday',
      thursday: language === 'es' ? 'Jueves' : 'Thursday',
      friday: language === 'es' ? 'Viernes' : 'Friday'
    };
    return days[dayKey] || dayKey;
  };

  const handleFieldChange = (field, value) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
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
            <h1 className="text-3xl font-heading font-bold text-slate-800">
              {language === 'es' ? 'Paquete para Sustituto' : 'Substitute Packet'}
            </h1>
            <p className="text-slate-500">
              {language === 'es' 
                ? 'Genera un paquete completo para maestros sustitutos' 
                : 'Generate a complete packet for substitute teachers'}
            </p>
          </div>
        </div>

        {/* Generator */}
        <Card className="bg-white border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {language === 'es' ? 'Generar Paquete' : 'Generate Packet'}
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Selecciona una clase para generar el paquete con planes, lista de estudiantes y notas importantes'
                : 'Select a class to generate the packet with plans, student roster, and important notes'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 flex-wrap">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full md:w-64" data-testid="packet-class-select">
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
              <Button 
                onClick={generatePacket} 
                disabled={generating || !selectedClass}
                data-testid="generate-packet-btn"
              >
                {generating ? t('loading') : (language === 'es' ? 'Generar Paquete' : 'Generate Packet')}
              </Button>
            </div>
            {/* Action buttons shown after generating */}
            {packetData && (
              <div className="flex gap-3 mt-4 pt-4 border-t">
                <Button 
                  onClick={() => setIsEditing(!isEditing)} 
                  variant={isEditing ? "default" : "outline"} 
                  className="gap-2"
                  data-testid="edit-packet-btn"
                >
                  {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                  {isEditing 
                    ? (language === 'es' ? 'Listo' : 'Done')
                    : (language === 'es' ? 'Editar Paquete' : 'Edit Packet')}
                </Button>
                <Button onClick={handlePrint} variant="outline" className="gap-2" data-testid="print-packet-btn">
                  <Printer className="h-4 w-4" />
                  {language === 'es' ? 'Imprimir' : 'Print'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Packet Preview */}
        {packetData && (
          <Card className="bg-white border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                {language === 'es' ? 'Vista Previa del Paquete' : 'Packet Preview'}
                {isEditing && (
                  <Badge variant="secondary" className="ml-2">
                    {language === 'es' ? 'Modo Edición' : 'Edit Mode'}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div ref={printRef} className="space-y-6 p-4 bg-white">
                {/* Page 1: Cover & Class Info */}
                <div className="page border border-slate-200 rounded-lg p-6">
                  <div className="header text-center border-b-2 border-black pb-4 mb-6">
                    <h1 className="text-2xl font-bold">SUBSTITUTE TEACHER PACKET</h1>
                    <h2 className="text-lg mt-2">{packetData.classInfo?.name}</h2>
                    <p className="text-sm text-slate-600">
                      Grade {packetData.classInfo?.grade}-{packetData.classInfo?.section}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Generated: {new Date(packetData.generatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Emergency Info - Editable */}
                  <div className="alert-box bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
                    <div className="flex items-center gap-2 font-bold text-amber-800 mb-2">
                      <AlertCircle className="h-5 w-5" />
                      {language === 'es' ? 'Información de Emergencia' : 'Emergency Information'}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>{language === 'es' ? 'Oficina Principal' : 'Main Office'}:</strong>{' '}
                        {isEditing ? (
                          <Input 
                            value={editableData.mainOfficeExt}
                            onChange={(e) => handleFieldChange('mainOfficeExt', e.target.value)}
                            className="inline-block w-32 h-8 ml-2"
                            data-testid="main-office-input"
                          />
                        ) : (
                          <span>{editableData.mainOfficeExt}</span>
                        )}
                      </div>
                      <div>
                        <strong>{language === 'es' ? 'Enfermería' : 'Nurse'}:</strong>{' '}
                        {isEditing ? (
                          <Input 
                            value={editableData.nurseExt}
                            onChange={(e) => handleFieldChange('nurseExt', e.target.value)}
                            className="inline-block w-32 h-8 ml-2"
                            data-testid="nurse-ext-input"
                          />
                        ) : (
                          <span>{editableData.nurseExt}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Class Schedule */}
                  <div className="section mb-6">
                    <h3 className="section-title text-lg font-bold border-b pb-2 mb-3">
                      {language === 'es' ? 'Información de la Clase' : 'Class Information'}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="info-box p-3 border rounded">
                        <label className="font-bold">{language === 'es' ? 'Materia' : 'Subject'}</label>
                        <span>{packetData.classInfo?.subject || 'N/A'}</span>
                      </div>
                      <div className="info-box p-3 border rounded">
                        <label className="font-bold">{language === 'es' ? 'Año Escolar' : 'School Year'}</label>
                        <span>{packetData.classInfo?.year_term}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Page 2: Current Week's Plan */}
                <div className="page border border-slate-200 rounded-lg p-6" style={{ pageBreakBefore: 'always' }}>
                  <h3 className="section-title text-lg font-bold border-b pb-2 mb-4">
                    {language === 'es' ? 'Plan de la Semana Actual' : "Current Week's Plan"}
                  </h3>
                  
                  {packetData.currentPlan ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="info-box p-3 border rounded">
                          <label className="font-bold">{language === 'es' ? 'Unidad' : 'Unit'}</label>
                          <span>{packetData.currentPlan.unit || 'N/A'}</span>
                        </div>
                        <div className="info-box p-3 border rounded">
                          <label className="font-bold">{language === 'es' ? 'Historia' : 'Story'}</label>
                          <span>{packetData.currentPlan.story || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="info-box p-3 border rounded">
                        <label className="font-bold">{language === 'es' ? 'Objetivo de la Semana' : 'Week Objective'}</label>
                        <p className="mt-1">{packetData.currentPlan.objective || 'N/A'}</p>
                      </div>

                      {/* Daily Activities */}
                      <div>
                        <label className="font-bold block mb-2">{language === 'es' ? 'Actividades Diarias' : 'Daily Activities'}</label>
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr>
                              <th className="border p-2 bg-slate-100">{language === 'es' ? 'Día' : 'Day'}</th>
                              <th className="border p-2 bg-slate-100">{language === 'es' ? 'Tema' : 'Theme'}</th>
                              <th className="border p-2 bg-slate-100">{language === 'es' ? 'Notas' : 'Notes'}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(packetData.currentPlan.days || []).map((day, i) => (
                              <tr key={i}>
                                <td className="border p-2 font-medium">{getDayName(day.day_name)}</td>
                                <td className="border p-2">{day.theme || '-'}</td>
                                <td className="border p-2">{day.notes || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">
                      {language === 'es' ? 'No hay plan disponible para esta semana' : 'No plan available for this week'}
                    </p>
                  )}
                </div>

                {/* Page 3: Student Roster */}
                <div className="page border border-slate-200 rounded-lg p-6" style={{ pageBreakBefore: 'always' }}>
                  <h3 className="section-title text-lg font-bold border-b pb-2 mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'es' ? 'Lista de Estudiantes' : 'Student Roster'} ({packetData.students?.length || 0})
                  </h3>
                  
                  {packetData.students?.length > 0 ? (
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="border p-2 bg-slate-100 w-8">#</th>
                          <th className="border p-2 bg-slate-100">{language === 'es' ? 'Nombre' : 'Name'}</th>
                          <th className="border p-2 bg-slate-100">{language === 'es' ? 'Notas Especiales' : 'Special Notes'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {packetData.students.map((student, i) => (
                          <tr key={student.student_id} className="student-row">
                            <td className="border p-2 text-center">{i + 1}</td>
                            <td className="border p-2 font-medium">
                              {student.first_name} {student.last_name}
                              {student.student_number && (
                                <span className="text-xs text-slate-500 ml-2">({student.student_number})</span>
                              )}
                            </td>
                            <td className="border p-2">
                              {student.accommodations && (
                                <Badge variant="outline" className="mr-1 text-xs">IEP</Badge>
                              )}
                              {student.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-slate-500 italic">
                      {language === 'es' ? 'No hay estudiantes registrados' : 'No students registered'}
                    </p>
                  )}
                </div>

                {/* Page 4: Seating Chart */}
                <div className="page border border-slate-200 rounded-lg p-6" style={{ pageBreakBefore: 'always' }}>
                  <h3 className="section-title text-lg font-bold border-b pb-2 mb-4">
                    {language === 'es' ? 'Diagrama del Salón' : 'Seating Chart'}
                  </h3>
                  
                  <div className="border-2 border-slate-300 p-4 mb-4 text-center bg-slate-100">
                    <strong>{language === 'es' ? 'PIZARRA / FRENTE' : 'BOARD / FRONT'}</strong>
                  </div>

                  <div className="seating-grid grid grid-cols-5 gap-2">
                    {packetData.students?.slice(0, 25).map((student, i) => (
                      <div key={student.student_id} className="seat border p-2 text-center text-xs min-h-12">
                        {student.first_name}<br/>{student.last_name}
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 25 - (packetData.students?.length || 0)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="seat border p-2 text-center text-xs min-h-12 bg-slate-50">
                        -
                      </div>
                    ))}
                  </div>
                </div>

                {/* Page 5: Notes - EDITABLE */}
                <div className="page border border-slate-200 rounded-lg p-6" style={{ pageBreakBefore: 'always' }}>
                  <h3 className="section-title text-lg font-bold border-b pb-2 mb-4">
                    {language === 'es' ? 'Notas para el Sustituto' : 'Notes for Substitute'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="font-bold block mb-2">{language === 'es' ? 'Rutinas Diarias' : 'Daily Routines'}:</label>
                      {isEditing ? (
                        <Textarea 
                          value={editableData.dailyRoutines}
                          onChange={(e) => handleFieldChange('dailyRoutines', e.target.value)}
                          className="min-h-24"
                          placeholder={language === 'es' ? 'Ingrese las rutinas diarias...' : 'Enter daily routines...'}
                          data-testid="daily-routines-input"
                        />
                      ) : (
                        <div className="notes-area border p-3 min-h-24 bg-slate-50 whitespace-pre-wrap">
                          {editableData.dailyRoutines || (language === 'es' ? '(Sin información)' : '(No information)')}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-bold block mb-2">{language === 'es' ? 'Procedimientos de Emergencia' : 'Emergency Procedures'}:</label>
                      {isEditing ? (
                        <Textarea 
                          value={editableData.emergencyProcedures}
                          onChange={(e) => handleFieldChange('emergencyProcedures', e.target.value)}
                          className="min-h-24"
                          placeholder={language === 'es' ? 'Ingrese los procedimientos de emergencia...' : 'Enter emergency procedures...'}
                          data-testid="emergency-procedures-input"
                        />
                      ) : (
                        <div className="notes-area border p-3 min-h-24 bg-slate-50 whitespace-pre-wrap">
                          {editableData.emergencyProcedures || (language === 'es' ? '(Sin información)' : '(No information)')}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="font-bold block mb-2">{language === 'es' ? 'Estudiantes con Necesidades Especiales' : 'Students with Special Needs'}:</label>
                      <div className="notes-area border p-3 min-h-24 bg-slate-50">
                        {packetData.students?.filter(s => s.accommodations).map(s => (
                          <div key={s.student_id} className="mb-1">
                            • <strong>{s.first_name} {s.last_name}:</strong> {s.accommodations}
                          </div>
                        ))}
                        {!packetData.students?.some(s => s.accommodations) && (
                          <span className="text-slate-400">{language === 'es' ? '(Ninguno)' : '(None)'}</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold block mb-2">{language === 'es' ? 'Notas Adicionales' : 'Additional Notes'}:</label>
                      {isEditing ? (
                        <Textarea 
                          value={editableData.additionalNotes}
                          onChange={(e) => handleFieldChange('additionalNotes', e.target.value)}
                          className="min-h-24"
                          placeholder={language === 'es' ? 'Ingrese notas adicionales...' : 'Enter additional notes...'}
                          data-testid="additional-notes-input"
                        />
                      ) : (
                        <div className="notes-area border p-3 min-h-24 bg-slate-50 whitespace-pre-wrap">
                          {editableData.additionalNotes || (language === 'es' ? '(Sin información)' : '(No information)')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default SubstitutePacket;
