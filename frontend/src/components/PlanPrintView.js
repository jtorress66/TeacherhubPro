import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

const ACTIVITY_LABELS = {
  brainstorming: { en: 'Brain storming', es: 'Lluvia de ideas' },
  buildingBackground: { en: 'Building background', es: 'Conocimiento previo' },
  vocabularyDevelopment: { en: 'Vocabulary development', es: 'Desarrollo vocabulario' },
  readPages: { en: 'Read pages ___ from the book.', es: 'Leer páginas ___' },
  guidedReading: { en: 'Students will do guided and choral reading.', es: 'Lectura guiada/coral' },
  oralQuestions: { en: 'The teacher ask oral questions to demonstrate comprehension', es: 'Preguntas orales' },
  comprehensionQuestions: { en: 'Students answer comprehension questions', es: 'Preguntas comprensión' },
  exercisePractice: { en: 'Work on an exercise practice:', es: 'Práctica ejercicio' },
  other: { en: 'Other:', es: 'Otro:' }
};

const MATERIAL_LABELS = {
  book: { en: 'Book', es: 'Libro' },
  notebook: { en: 'Notebook', es: 'Cuaderno' },
  teachersGuide: { en: "Teacher's Guide", es: 'Guía del Maestro' },
  testQuiz: { en: 'Test, quiz', es: 'Prueba, examen' },
  dictionary: { en: 'Dictionary', es: 'Diccionario' },
  handouts: { en: 'Handouts', es: 'Hojas de trabajo' },
  other: { en: 'Others:', es: 'Otros:' }
};

const DAY_LABELS = {
  monday: { en: 'Monday', es: 'Lunes' },
  tuesday: { en: 'Tuesday', es: 'Martes' },
  wednesday: { en: 'Wednesday', es: 'Miércoles' },
  thursday: { en: 'Thursday', es: 'Jueves' },
  friday: { en: 'Friday', es: 'Viernes' }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '_____';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
  }
  return dateStr;
};

// Print-ready CSS for the exported PDF
const PRINT_CSS = `
@page {
  size: 8.5in 11in;
  margin: 0.25in;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: Arial, sans-serif;
  font-size: 6pt;
  line-height: 1.1;
  color: #000;
}

.page {
  width: 8in;
  height: 10.5in;
  overflow: hidden;
  page-break-after: always;
}
.page:last-child { page-break-after: avoid; }

.header { text-align: center; margin-bottom: 3pt; }
.header img { height: 28px; }
.header .name { font-size: 9pt; font-weight: bold; }
.header .info { font-size: 5pt; }

.date-line { font-size: 6pt; border-bottom: 1pt solid #000; padding: 2pt 0; margin-bottom: 3pt; }

.obj-box, .skills-box { border: 1pt solid #000; padding: 2pt 3pt; margin-bottom: 3pt; font-size: 6pt; }
.obj-box b, .skills-box b { text-decoration: underline; }
.skills-box ol { margin: 1pt 0 0 12pt; padding: 0; }
.skills-box li { margin: 0; }

.tbl { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 5pt; }
.tbl th, .tbl td { border: 1pt solid #000; padding: 1pt; vertical-align: top; }
.tbl th { background: #ddd; font-size: 5.5pt; text-align: center; }
.tbl .lbl { width: 10%; background: #f0f0f0; font-weight: bold; }
.tbl .day { width: 18%; }
.day-hdr { font-weight: bold; font-size: 6pt; }
.eca { font-size: 4pt; }
.theme { text-align: center; font-weight: bold; font-size: 6pt; }
.chk { display: inline-block; width: 5pt; height: 5pt; border: 0.5pt solid #000; margin-right: 1pt; vertical-align: middle; text-align: center; font-size: 3pt; line-height: 4pt; }
.chk.x::after { content: "X"; font-weight: bold; }
.itm { display: block; font-size: 4.5pt; line-height: 1.05; margin-bottom: 0.3pt; }
.dok { font-size: 4pt; line-height: 1; }

/* Page 2 */
.title { font-size: 10pt; font-weight: bold; text-align: center; margin: 4pt 0; }
.info-row { display: flex; justify-content: space-between; border: 1pt solid #000; padding: 3pt; margin-bottom: 5pt; font-size: 6pt; }
.std-row { display: flex; gap: 5pt; margin-bottom: 5pt; }
.std-col { flex: 1; border: 2pt solid #000; padding: 3pt; }
.std-hdr { font-weight: bold; font-size: 7pt; border-bottom: 2pt solid #000; padding-bottom: 2pt; margin-bottom: 3pt; }
.std-itm { font-size: 6pt; margin-bottom: 1pt; }
.exp-box { border: 1pt solid #000; padding: 3pt; margin-top: 4pt; min-height: 35pt; font-size: 6pt; }
.exp-box b { text-decoration: underline; }
.int-sec { border: 1pt solid #000; padding: 4pt; margin-bottom: 6pt; font-size: 6pt; }
.int-items { display: flex; flex-wrap: wrap; gap: 6pt; margin-top: 2pt; }
.sigs { display: flex; justify-content: space-between; margin-top: 12pt; }
.sig { width: 45%; border-top: 1pt solid #000; padding-top: 3pt; text-align: center; font-size: 6pt; }

@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`;

export const PlanPrintView = ({ plan, classInfo, school: propSchool, onClose }) => {
  const { language } = useLanguage();
  const { school: contextSchool } = useSchool();
  const printRef = useRef();
  const lang = language === 'es' ? 'es' : 'en';
  const school = propSchool || contextSchool;

  const getWeekDays = (weekIndex) => {
    const weekDays = plan.days?.filter(d => d.week_index === weekIndex) || [];
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((dayName, i) => {
      const existingDay = weekDays[i] || plan.days?.[weekIndex === 1 ? i : i + 5];
      return {
        date: existingDay?.date || '',
        day_name: existingDay?.day_name || dayName,
        theme: existingDay?.theme || '',
        dok_levels: existingDay?.dok_levels || [],
        eca: existingDay?.eca || { E: false, C: false, A: false },
        activities: existingDay?.activities || [],
        materials: existingDay?.materials || [],
        notes: existingDay?.notes || ''
      };
    });
  };

  const planDays = getWeekDays(1);
  const planDaysWeek2 = getWeekDays(2);

  const getStandardsForWeek = (weekIndex) => plan.standards?.filter(s => s.week_index === weekIndex) || [];
  const getExpectationForWeek = (weekIndex) => plan.expectations?.find(e => e.week_index === weekIndex)?.content || plan.expectations?.find(e => e.week_index === weekIndex)?.text || '';

  // Checkbox - inline styled for both preview and print
  const Chk = ({ checked }) => (
    <span style={{
      display: 'inline-block',
      width: '6px',
      height: '6px',
      border: '1px solid #000',
      marginRight: '2px',
      verticalAlign: 'middle',
      textAlign: 'center',
      fontSize: '5px',
      lineHeight: '5px',
      fontWeight: 'bold'
    }}>{checked ? 'X' : ''}</span>
  );

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Plan - ${plan.unit || 'Lesson'}</title><style>${PRINT_CSS}</style></head><body>${printContent.innerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  // Inline styles for preview (mirrors print styles)
  const pageStyle = { width: '8in', minHeight: '10.5in', overflow: 'hidden', fontFamily: 'Arial, sans-serif', fontSize: '8px', lineHeight: '1.15', color: '#000', padding: '8px' };
  const headerStyle = { textAlign: 'center', marginBottom: '4px' };
  const dateLineStyle = { fontSize: '8px', borderBottom: '1px solid #000', padding: '2px 0', marginBottom: '4px' };
  const boxStyle = { border: '1px solid #000', padding: '3px 4px', marginBottom: '4px', fontSize: '8px' };
  const tableStyle = { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '7px' };
  const thStyle = { border: '1px solid #000', padding: '2px', background: '#ddd', fontWeight: 'bold', textAlign: 'center', fontSize: '7px' };
  const tdStyle = { border: '1px solid #000', padding: '2px', verticalAlign: 'top', fontSize: '6px', lineHeight: '1.1' };
  const lblStyle = { ...tdStyle, width: '10%', background: '#f5f5f5', fontWeight: 'bold' };
  const itemStyle = { display: 'block', fontSize: '6px', lineHeight: '1.1', marginBottom: '1px' };
  const dokStyle = { display: 'block', fontSize: '5.5px', lineHeight: '1.05', marginBottom: '0.5px' };

  const WeekPage = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <div className="page" style={pageStyle}>
      <div className="header" style={headerStyle}>
        {school?.logo_url && <img src={school.logo_url} alt="" style={{ height: '32px' }} />}
        <div className="name" style={{ fontSize: '11px', fontWeight: 'bold' }}>{school?.name || 'School Name'}</div>
        {school?.address && <div className="info" style={{ fontSize: '7px' }}>{school.address}</div>}
        <div className="info" style={{ fontSize: '7px' }}>{school?.phone && `Tel. ${school.phone}`}{school?.email && ` | ${school.email}`}</div>
      </div>
      
      <div className="date-line" style={dateLineStyle}>
        <b>Date:</b> From {formatDate(weekStart)} To {formatDate(weekEnd)}{weekNum === 2 && ' (Week 2)'}
      </div>
      
      <div className="obj-box" style={boxStyle}>
        <b style={{ textDecoration: 'underline' }}>Objective of the week:</b> {objective || '___________________________________________'}
      </div>
      
      <div className="skills-box" style={boxStyle}>
        <b style={{ textDecoration: 'underline' }}>Skills of the week:</b>
        <ol style={{ margin: '2px 0 0 16px', padding: 0 }}>
          {(skills?.filter(s => s).length > 0) ? skills.filter(s => s).slice(0, 4).map((s, i) => <li key={i}>{s}</li>) : [1,2,3,4].map(i => <li key={i}>_______________________________________</li>)}
        </ol>
      </div>
      
      <table className="tbl" style={tableStyle}>
        <thead>
          <tr>
            <th className="lbl" style={{ ...thStyle, width: '10%' }}></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} className="day" style={{ ...thStyle, width: '18%' }}>
                <div className="day-hdr" style={{ fontWeight: 'bold', fontSize: '8px' }}>{DAY_LABELS[day][lang]}</div>
                <div className="eca" style={{ fontSize: '6px', marginTop: '1px' }}>
                  <Chk checked={days[idx]?.eca?.E} />E <Chk checked={days[idx]?.eca?.C} />C <Chk checked={days[idx]?.eca?.A} />A
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="lbl" style={lblStyle}>Day Theme</td>
            {days.map((d, i) => <td key={i} className="theme" style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '8px' }}>{d.theme || ''}</td>)}
          </tr>
          <tr>
            <td className="lbl" style={lblStyle}>Type of<br/>Taxonomy:<br/>Webb (2005)<br/>Levels</td>
            {days.map((d, i) => (
              <td key={i} style={tdStyle}>
                <span style={dokStyle}><Chk checked={d.dok_levels?.includes(1)} /> Level 1: Memory Thought (Knowledge in or the same way as learned)</span>
                <span style={dokStyle}><Chk checked={d.dok_levels?.includes(2)} /> Level 2: Processing (Requires some basic mental reasoning, something beyond memory)</span>
                <span style={dokStyle}><Chk checked={d.dok_levels?.includes(3)} /> Level 3: Thinking Strategic (Demonstrate knowledge based on complex and abstract cognitive demand)</span>
                <span style={dokStyle}><Chk checked={d.dok_levels?.includes(4)} /> Level 4: Thinking Thought Extended (extends knowledge to broader contexts)</span>
              </td>
            ))}
          </tr>
          <tr>
            <td className="lbl" style={lblStyle}>Activities</td>
            {days.map((d, i) => (
              <td key={i} style={tdStyle}>
                {Object.keys(ACTIVITY_LABELS).map(act => {
                  const a = d.activities?.find(x => x.activity_type === act);
                  return <span key={act} style={itemStyle}><Chk checked={a?.checked} /> {ACTIVITY_LABELS[act][lang]}{act === 'other' && a?.checked && a?.notes && ` ${a.notes}`}</span>;
                })}
              </td>
            ))}
          </tr>
          <tr>
            <td className="lbl" style={lblStyle}>Materials</td>
            {days.map((d, i) => (
              <td key={i} style={tdStyle}>
                {Object.keys(MATERIAL_LABELS).map(mat => {
                  const m = d.materials?.find(x => x.material_type === mat);
                  return <span key={mat} style={itemStyle}><Chk checked={m?.checked} /> {MATERIAL_LABELS[mat][lang]}{mat === 'other' && m?.checked && m?.notes && ` ${m.notes}`}</span>;
                })}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  const StandardsPage = () => (
    <div className="page" style={pageStyle}>
      <div className="header" style={headerStyle}>
        {school?.logo_url && <img src={school.logo_url} alt="" style={{ height: '32px' }} />}
        <div className="name" style={{ fontSize: '11px', fontWeight: 'bold' }}>{school?.name || 'School Name'}</div>
        {school?.address && <div className="info" style={{ fontSize: '7px' }}>{school.address}</div>}
        <div className="info" style={{ fontSize: '7px' }}>{school?.phone && `Tel. ${school.phone}`}{school?.email && ` | ${school.email}`}</div>
      </div>
      
      <div className="title" style={{ fontSize: '12px', fontWeight: 'bold', textAlign: 'center', margin: '6px 0' }}>Teacher's Planning</div>
      
      <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #000', padding: '4px', marginBottom: '8px', fontSize: '9px' }}>
        <div>
          <div><b>Unit:</b> {plan.unit || '_____'}</div>
          <div><b>Story:</b> {plan.story || '_____'}</div>
          <div><b>Teacher:</b> {plan.teacher_name || '_____'}</div>
          <div><b>Grade:</b> {classInfo?.grade || ''}-{classInfo?.section || ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <b>Date</b><br/>
          From: {formatDate(plan.week_start)} To: {formatDate(plan.week_end)}
          {(plan.week2_start || plan.week2_end) && <><br/>From: {formatDate(plan.week2_start)} To: {formatDate(plan.week2_end)}</>}
        </div>
      </div>

      <div className="std-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
        {[1, 2].map(week => (
          <div key={week} className="std-col" style={{ flex: 1, border: '2px solid #000', padding: '4px' }}>
            <div className="std-hdr" style={{ fontWeight: 'bold', fontSize: '10px', borderBottom: '2px solid #000', paddingBottom: '3px', marginBottom: '4px' }}>
              Standard: {week === 1 ? 'First' : 'Second'} Week
            </div>
            {[
              { key: 'listeningAndSpeaking', label: 'Listening/Speaking' },
              { key: 'foundationalSkills', label: 'Foundational Skills' },
              { key: 'reading', label: 'Reading' },
              { key: 'writing', label: 'Writing' },
              { key: 'language', label: 'Language' }
            ].map(({ key, label }) => {
              const std = getStandardsForWeek(week).find(s => s.domain === key);
              return (
                <div key={key} className="std-itm" style={{ fontSize: '8px', marginBottom: '2px' }}>
                  <Chk checked={std?.codes?.length > 0} /> <b>{label}</b>{std?.codes?.length > 0 && ` ${std.codes.join(', ')}`}
                </div>
              );
            })}
            <div className="exp-box" style={{ border: '1px solid #000', padding: '4px', marginTop: '6px', minHeight: '45px', fontSize: '8px' }}>
              <b style={{ textDecoration: 'underline' }}>Expectations:</b>
              <div style={{ marginTop: '3px' }}>{getExpectationForWeek(week)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="int-sec" style={{ border: '1px solid #000', padding: '6px', marginBottom: '10px', fontSize: '9px' }}>
        <b>Integration with other subjects:</b>
        <div className="int-items" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
          {[
            { key: 'mathematics', label: 'Mathematics' },
            { key: 'spanish', label: 'Spanish' },
            { key: 'socialStudies', label: 'Social Studies' },
            { key: 'science', label: 'Science' },
            { key: 'health', label: 'Health' },
            { key: 'art', label: 'Art' },
            { key: 'physicalEducation', label: 'Physical Education' },
            { key: 'religion', label: 'Religion' }
          ].map(({ key, label }) => (
            <span key={key}><Chk checked={plan.subject_integration?.includes(key)} /> {label}</span>
          ))}
        </div>
      </div>

      <div className="sigs" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <div className="sig" style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '4px', textAlign: 'center', fontSize: '9px' }}>Teacher's Signature / Date</div>
        <div className="sig" style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '4px', textAlign: 'center', fontSize: '9px' }}>Principal's Signature / Date</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="print-preview-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="font-heading font-semibold text-lg">{lang === 'es' ? 'Vista Previa de Impresión' : 'Print Preview'}</h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2" data-testid="print-btn"><Printer className="h-4 w-4" />{lang === 'es' ? 'Imprimir' : 'Print'}</Button>
            <Button variant="outline" onClick={onClose} data-testid="close-preview-btn"><X className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="p-6 bg-slate-200">
          <div ref={printRef}>
            <div className="bg-white shadow mb-6 mx-auto" style={{ width: '8in', minHeight: '10.5in', padding: '0.25in' }}>
              <WeekPage days={planDays} weekNum={1} weekStart={plan.week_start} weekEnd={plan.week_end} objective={plan.objective} skills={plan.skills} />
            </div>

            {(plan.week2_start || plan.week2_end) && (
              <div className="bg-white shadow mb-6 mx-auto" style={{ width: '8in', minHeight: '10.5in', padding: '0.25in' }}>
                <WeekPage days={planDaysWeek2} weekNum={2} weekStart={plan.week2_start} weekEnd={plan.week2_end} objective={plan.objective_week2} skills={plan.skills_week2} />
              </div>
            )}

            <div className="bg-white shadow mx-auto" style={{ width: '8in', minHeight: '10.5in', padding: '0.25in' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
