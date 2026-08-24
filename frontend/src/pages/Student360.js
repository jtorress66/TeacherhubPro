import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import {
  ArrowLeft, GraduationCap, CalendarCheck, FileWarning, Sparkles,
  StickyNote, Trash2, Loader2, CheckCircle, XCircle, Clock, AlertCircle,
  ClipboardList, TrendingUp, BookOpen
} from 'lucide-react';

const API = `${window.location.origin}/api`;

const gradeColor = (pct) => {
  if (pct === null || pct === undefined) return 'text-slate-500';
  if (pct >= 90) return 'text-green-600';
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 70) return 'text-amber-600';
  return 'text-red-600';
};

const ATT_STYLES = {
  absent: { icon: XCircle, badge: 'bg-red-50 text-red-700 border-red-200' },
  tardy: { icon: Clock, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  excused: { icon: AlertCircle, badge: 'bg-blue-50 text-blue-700 border-blue-200' }
};

export default function Student360() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const es = language === 'es';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState(null);
  const [insightDate, setInsightDate] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    try {
      const [res360, resInsight] = await Promise.all([
        axios.get(`${API}/students/${studentId}/360`, { withCredentials: true }),
        axios.get(`${API}/students/${studentId}/insight`, { withCredentials: true })
      ]);
      setData(res360.data);
      setInsight(resInsight.data.insight);
      setInsightDate(resInsight.data.generated_at);
    } catch (e) {
      toast.error(es ? 'Error al cargar el estudiante' : 'Failed to load student');
    } finally {
      setLoading(false);
    }
  }, [studentId, es]);

  useEffect(() => { load(); }, [load]);

  const generateInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await axios.post(`${API}/students/${studentId}/insight`, {}, { withCredentials: true });
      setInsight(res.data.insight);
      setInsightDate(res.data.generated_at);
      toast.success(es ? 'Análisis generado' : 'Insight generated');
    } catch (e) {
      toast.error(es ? 'Error al generar el análisis' : 'Failed to generate insight');
    } finally {
      setInsightLoading(false);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await axios.post(`${API}/students/${studentId}/notes`, { content: newNote.trim() }, { withCredentials: true });
      setNewNote('');
      await load();
      toast.success(es ? 'Nota guardada' : 'Note saved');
    } catch (e) {
      toast.error(es ? 'Error al guardar la nota' : 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      await axios.delete(`${API}/students/${studentId}/notes/${noteId}`, { withCredentials: true });
      await load();
      toast.success(es ? 'Nota eliminada' : 'Note deleted');
    } catch (e) {
      toast.error(es ? 'Error al eliminar' : 'Failed to delete');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-slate-600">{es ? 'Estudiante no encontrado' : 'Student not found'}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)} data-testid="back-button">
            <ArrowLeft className="h-4 w-4 mr-2" />{es ? 'Volver' : 'Go Back'}
          </Button>
        </div>
      </Layout>
    );
  }

  const { student, class: cls, stats, notes, timeline, missing_assignments } = data;

  return (
    <Layout>
      <div className="space-y-6" data-testid="student-360-page">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)} data-testid="back-button" title={es ? 'Volver' : 'Go Back'}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-lg font-semibold text-white">
                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900" data-testid="student-name">
                {student.first_name} {student.last_name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
                <BookOpen className="h-3.5 w-3.5" />
                <span>{cls.name}</span>
                {student.student_number && <span>· #{student.student_number}</span>}
                {student.accommodations && <Badge variant="outline" className="text-xs">IEP</Badge>}
              </div>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card data-testid="card-grade-average">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{es ? 'Promedio General' : 'Grade Average'}</p>
                  <p className={`text-3xl font-bold ${gradeColor(stats.grade_average)}`}>
                    {stats.grade_average !== null ? `${stats.grade_average}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.graded_count} {es ? 'de' : 'of'} {stats.total_assignments} {es ? 'tareas calificadas' : 'assignments graded'}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-attendance-rate">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{es ? 'Asistencia' : 'Attendance Rate'}</p>
                  <p className={`text-3xl font-bold ${gradeColor(stats.attendance_rate)}`}>
                    {stats.attendance_rate !== null ? `${stats.attendance_rate}%` : '—'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {stats.attendance_counts.absent} {es ? 'ausencias' : 'absences'} · {stats.attendance_counts.tardy} {es ? 'tardanzas' : 'tardies'}
                  </p>
                </div>
                <CalendarCheck className="h-8 w-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-missing-assignments">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{es ? 'Tareas Faltantes' : 'Missing Assignments'}</p>
                  <p className={`text-3xl font-bold ${stats.missing_count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {stats.missing_count}
                  </p>
                  {missing_assignments.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-48">
                      {missing_assignments.slice(0, 2).map(m => m.title).join(', ')}
                    </p>
                  )}
                </div>
                <FileWarning className="h-8 w-8 text-slate-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insight */}
        <Card className="border-indigo-100 bg-indigo-50/40" data-testid="ai-insight-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                {es ? 'Análisis de IA' : 'AI Insight'}
                {insightDate && (
                  <span className="text-xs font-normal text-slate-400">
                    {new Date(insightDate).toLocaleDateString()}
                  </span>
                )}
              </CardTitle>
              <Button size="sm" onClick={generateInsight} disabled={insightLoading} data-testid="generate-insight-btn">
                {insightLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {insight ? (es ? 'Regenerar' : 'Regenerate') : (es ? 'Generar Análisis' : 'Generate Insight')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {insight ? (
              <div className="text-sm text-slate-700 prose prose-sm prose-slate max-w-none" data-testid="insight-text">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {es
                  ? 'Genera un resumen con tendencias de calificaciones, patrones de asistencia y próximos pasos sugeridos.'
                  : 'Generate a summary of grade trends, attendance patterns, and suggested next steps for this student.'}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <Card className="lg:col-span-2" data-testid="timeline-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                {es ? 'Línea de Tiempo' : 'Timeline'}
                <span className="text-xs font-normal text-slate-400">({timeline.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-slate-500 py-8 text-center">
                  {es ? 'Sin actividad todavía. Las calificaciones, asistencia y notas aparecerán aquí.' : 'No activity yet. Grades, attendance, and notes will appear here.'}
                </p>
              ) : (
                <div className="relative space-y-0 max-h-[600px] overflow-y-auto pr-2">
                  {timeline.map((ev, i) => {
                    let icon, content;
                    if (ev.type === 'grade') {
                      icon = <GraduationCap className="h-4 w-4 text-slate-600" />;
                      content = (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{ev.title}</p>
                            {ev.comment && <p className="text-xs text-slate-500 italic">"{ev.comment}"</p>}
                          </div>
                          {ev.score !== null && ev.score !== undefined ? (
                            <span className={`text-sm font-semibold ${gradeColor(ev.percentage)}`}>
                              {ev.score}/{ev.points} ({ev.percentage}%)
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-xs">{ev.status}</Badge>
                          )}
                        </div>
                      );
                    } else if (ev.type === 'attendance') {
                      const style = ATT_STYLES[ev.status] || ATT_STYLES.excused;
                      const StatusIcon = style.icon;
                      icon = <StatusIcon className="h-4 w-4 text-slate-600" />;
                      const label = es
                        ? { absent: 'Ausente', tardy: 'Tardanza', excused: 'Excusado' }[ev.status]
                        : ev.status.charAt(0).toUpperCase() + ev.status.slice(1);
                      content = (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`text-xs ${style.badge}`}>{label}</Badge>
                          {ev.minutes_late && <span className="text-xs text-slate-500">{ev.minutes_late} min</span>}
                          {ev.note && <span className="text-xs text-slate-500 italic">"{ev.note}"</span>}
                        </div>
                      );
                    } else if (ev.type === 'assignment_due') {
                      icon = <ClipboardList className="h-4 w-4 text-slate-600" />;
                      content = (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm text-slate-700">
                            {es ? 'Entrega:' : 'Due:'} <span className="font-medium">{ev.title}</span>
                          </p>
                          {ev.graded ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Badge variant="outline" className="text-xs text-slate-500">{es ? 'sin calificar' : 'ungraded'}</Badge>
                          )}
                        </div>
                      );
                    } else {
                      icon = <StickyNote className="h-4 w-4 text-amber-600" />;
                      content = <p className="text-sm text-slate-700">{ev.content}</p>;
                    }
                    return (
                      <div key={i} className="flex gap-3 pb-4 relative" data-testid={`timeline-event-${i}`}>
                        <div className="flex flex-col items-center">
                          <div className="h-8 w-8 rounded-full bg-stone-100 border border-slate-200 flex items-center justify-center shrink-0">
                            {icon}
                          </div>
                          {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-1">
                          <p className="text-xs text-slate-400 mb-0.5">{ev.date}</p>
                          {content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card data-testid="notes-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-amber-600" />
                {es ? 'Notas del Maestro' : 'Teacher Notes'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={es ? 'Escribe una nota privada sobre este estudiante...' : 'Write a private note about this student...'}
                  rows={3}
                  data-testid="new-note-input"
                />
                <Button onClick={addNote} disabled={savingNote || !newNote.trim()} size="sm" className="w-full" data-testid="add-note-btn">
                  {savingNote ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <StickyNote className="h-4 w-4 mr-2" />}
                  {es ? 'Agregar Nota' : 'Add Note'}
                </Button>
              </div>
              {notes.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  {es ? 'Sin notas todavía' : 'No notes yet'}
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {notes.map((note) => (
                    <div key={note.note_id} className="p-3 rounded-lg bg-amber-50/60 border border-amber-100 group" data-testid={`note-${note.note_id}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap flex-1">{note.content}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                          onClick={() => deleteNote(note.note_id)}
                          data-testid={`delete-note-${note.note_id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{(note.created_at || '').slice(0, 10)}</p>
                    </div>
                  ))}
                </div>
              )}
              {student.notes && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">{es ? 'Nota del perfil' : 'Profile note'}</p>
                  <p className="text-sm text-slate-600">{student.notes}</p>
                </div>
              )}
              {student.accommodations && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-medium text-slate-500 mb-1">{es ? 'Acomodos' : 'Accommodations'}</p>
                  <p className="text-sm text-slate-600">{student.accommodations}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
