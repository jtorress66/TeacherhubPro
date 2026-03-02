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

// Print CSS - CENTERED, fits on page
const PRINT_CSS = `
@page {
  size: 8.5in 11in;
  margin: 0.25in;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: Arial, sans-serif;
  font-size: 8pt;
  line-height: 1.25;
  color: #000;
}

.page {
  width: 8in;
  height: 10.5in;
  margin: 0 auto;
  overflow: hidden;
  page-break-after: always;
  display: flex;
  flex-direction: column;
}
.page:last-child { page-break-after: avoid; }

.header { text-align: center; margin-bottom: 5pt; }
.header img { height: 34px; }
.header .name { font-size: 11pt; font-weight: bold; }
.header .info { font-size: 7pt; }

.date-line { font-size: 8pt; border-bottom: 1pt solid #000; padding: 3pt 0; margin-bottom: 5pt; }

.obj-box { border: 1pt solid #000; padding: 5pt 6pt; margin-bottom: 5pt; font-size: 8pt; }
.skills-box { border: 1pt solid #000; padding: 5pt 6pt; margin-bottom: 6pt; font-size: 8pt; }
.obj-box b, .skills-box b { text-decoration: underline; }
.skills-box ol { margin: 3pt 0 0 16pt; padding: 0; }
.skills-box li { margin: 1pt 0; line-height: 1.3; }

.tbl { 
  width: 100%; 
  border-collapse: collapse; 
  table-layout: fixed; 
  font-size: 6.5pt;
  flex: 1;
}
.tbl th, .tbl td { 
  border: 1pt solid #000; 
  padding: 3pt 2pt; 
  vertical-align: top; 
}
.tbl th { 
  background: #e0e0e0; 
  font-size: 8pt; 
  text-align: center;
  padding: 5pt 2pt;
}
.tbl .lbl { 
  width: 10%; 
  background: #f5f5f5; 
  font-weight: bold;
  font-size: 7pt;
}
.tbl .day { width: 18%; }

.day-hdr { font-weight: bold; font-size: 9pt; }
.eca { font-size: 6pt; margin-top: 2pt; }
.theme { text-align: center; font-weight: bold; font-size: 8pt; vertical-align: middle; }

.chk { 
  display: inline-block; 
  width: 7pt; 
  height: 7pt; 
  border: 0.75pt solid #000; 
  margin-right: 2pt; 
  vertical-align: middle; 
  text-align: center; 
  font-size: 5pt; 
  line-height: 6pt; 
}
.chk.x::after { content: "X"; font-weight: bold; }

.itm { display: block; font-size: 6.5pt; line-height: 1.3; margin-bottom: 2pt; }
.dok { display: block; font-size: 6pt; line-height: 1.25; margin-bottom: 3pt; }

/* Page 2 */
.title { font-size: 12pt; font-weight: bold; text-align: center; margin: 8pt 0; }
.info-row { display: flex; justify-content: space-between; border: 1pt solid #000; padding: 8pt; margin-bottom: 10pt; font-size: 9pt; }
.std-row { display: flex; gap: 10pt; margin-bottom: 10pt; flex: 1; }
.std-col { flex: 1; border: 2pt solid #000; padding: 8pt; display: flex; flex-direction: column; }
.std-hdr { font-weight: bold; font-size: 10pt; border-bottom: 2pt solid #000; padding-bottom: 4pt; margin-bottom: 8pt; }
.std-itm { font-size: 8pt; margin-bottom: 5pt; line-height: 1.35; }
.exp-box { border: 1pt solid #000; padding: 6pt; margin-top: auto; min-height: 70pt; font-size: 8pt; }
.exp-box b { text-decoration: underline; }
.int-sec { border: 1pt solid #000; padding: 8pt; margin-bottom: 12pt; font-size: 9pt; }
.int-items { display: flex; flex-wrap: wrap; gap: 10pt; margin-top: 5pt; }
.sigs { display: flex; justify-content: space-between; margin-top: auto; padding-top: 20pt; }
.sig { width: 45%; border-top: 1pt solid #000; padding-top: 6pt; text-align: center; font-size: 8pt; }

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

  // Checkbox - sized to fit
  const Chk = ({ checked }) => (
    <span style={{
      display: 'inline-block',
      width: '9px',
      height: '9px',
      border: '1px solid #000',
      marginRight: '3px',
      verticalAlign: 'middle',
      textAlign: 'center',
      fontSize: '7px',
      lineHeight: '8px',
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

  // CENTERED inline styles - sized to fit all content on page
  const pageStyle = { 
    width: '8in', 
    height: '10.5in', 
    margin: '0 auto',
    overflow: 'hidden', 
    fontFamily: 'Arial, sans-serif', 
    fontSize: '9px', 
    lineHeight: '1.25', 
    color: '#000', 
    padding: '8px',
    display: 'flex',
    flexDirection: 'column'
  };
  const headerStyle = { textAlign: 'center', marginBottom: '6px' };
  const dateLineStyle = { fontSize: '9px', borderBottom: '1px solid #000', padding: '4px 0', marginBottom: '6px' };
  const objBoxStyle = { border: '1px solid #000', padding: '6px 8px', marginBottom: '6px', fontSize: '9px' };
  const skillsBoxStyle = { border: '1px solid #000', padding: '6px 8px', marginBottom: '8px', fontSize: '9px' };
  
  // Table fills remaining space
  const tableStyle = { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '7.5px', flex: 1 };
  const thStyle = { border: '1px solid #000', padding: '6px 3px', background: '#e0e0e0', fontWeight: 'bold', textAlign: 'center', fontSize: '9px' };
  const tdStyle = { border: '1px solid #000', padding: '4px 3px', verticalAlign: 'top', fontSize: '7.5px', lineHeight: '1.35' };
  const lblStyle = { ...tdStyle, width: '10%', background: '#f5f5f5', fontWeight: 'bold', fontSize: '8px' };
  const itemStyle = { display: 'block', fontSize: '7.5px', lineHeight: '1.4', marginBottom: '3px' };
  const dokStyle = { display: 'block', fontSize: '7px', lineHeight: '1.3', marginBottom: '4px' };

  const WeekPage = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <div className="page" style={pageStyle}>
      <div className="header" style={headerStyle}>
        {school?.logo_url && <img src={school.logo_url} alt="" style={{ height: '38px' }} />}
        <div className="name" style={{ fontSize: '13px', fontWeight: 'bold' }}>{school?.name || 'School Name'}</div>
        {school?.address && <div className="info" style={{ fontSize: '8px' }}>{school.address}</div>}
        <div className="info" style={{ fontSize: '8px' }}>{school?.phone && `Tel. ${school.phone}`}{school?.email && ` | ${school.email}`}</div>
      </div>
      
      <div className="date-line" style={dateLineStyle}>
        <b>Date:</b> From {formatDate(weekStart)} To {formatDate(weekEnd)}{weekNum === 2 && ' (Week 2)'}
      </div>
      
      <div className="obj-box" style={objBoxStyle}>
        <b style={{ textDecoration: 'underline' }}>Objective of the week:</b> {objective || '___________________________________________'}
      </div>
      
      <div className="skills-box" style={skillsBoxStyle}>
        <b style={{ textDecoration: 'underline' }}>Skills of the week:</b>
        <ol style={{ margin: '5px 0 0 18px', padding: 0 }}>
          {(skills?.filter(s => s).length > 0) ? skills.filter(s => s).slice(0, 4).map((s, i) => <li key={i} style={{ marginBottom: '2px' }}>{s}</li>) : [1,2,3,4].map(i => <li key={i} style={{ marginBottom: '2px' }}>_______________________________________</li>)}
        </ol>
      </div>
      
      {/* Table fills remaining space - CENTERED */}
      <table className="tbl" style={tableStyle}>
        <thead>
          <tr>
            <th className="lbl" style={{ ...thStyle, width: '10%' }}></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} className="day" style={{ ...thStyle, width: '18%' }}>
                <div className="day-hdr" style={{ fontWeight: 'bold', fontSize: '10px' }}>{DAY_LABELS[day][lang]}</div>
                <div className="eca" style={{ fontSize: '7px', marginTop: '3px' }}>
                  <Chk checked={days[idx]?.eca?.E} />E <Chk checked={days[idx]?.eca?.C} />C <Chk checked={days[idx]?.eca?.A} />A
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Day Theme Row */}
          <tr>
            <td className="lbl" style={lblStyle}>Day Theme</td>
            {days.map((d, i) => <td key={i} className="theme" style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold', fontSize: '9px', verticalAlign: 'middle' }}>{d.theme || ''}</td>)}
          </tr>
          
          {/* DOK Levels Row */}
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
          
          {/* Activities Row */}
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
          
          {/* Materials Row */}
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
        {school?.logo_url && <img src={school.logo_url} alt="" style={{ height: '38px' }} />}
        <div className="name" style={{ fontSize: '13px', fontWeight: 'bold' }}>{school?.name || 'School Name'}</div>
        {school?.address && <div className="info" style={{ fontSize: '8px' }}>{school.address}</div>}
        <div className="info" style={{ fontSize: '8px' }}>{school?.phone && `Tel. ${school.phone}`}{school?.email && ` | ${school.email}`}</div>
      </div>
      
      <div className="title" style={{ fontSize: '14px', fontWeight: 'bold', textAlign: 'center', margin: '10px 0' }}>Teacher's Planning</div>
      
      <div className="info-row" style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #000', padding: '10px', marginBottom: '12px', fontSize: '10px' }}>
        <div>
          <div style={{ marginBottom: '4px' }}><b>Unit:</b> {plan.unit || '_____'}</div>
          <div style={{ marginBottom: '4px' }}><b>Story:</b> {plan.story || '_____'}</div>
          <div style={{ marginBottom: '4px' }}><b>Teacher:</b> {plan.teacher_name || '_____'}</div>
          <div><b>Grade:</b> {classInfo?.grade || ''}-{classInfo?.section || ''}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <b>Date</b><br/>
          From: {formatDate(plan.week_start)} To: {formatDate(plan.week_end)}
          {(plan.week2_start || plan.week2_end) && <><br/>From: {formatDate(plan.week2_start)} To: {formatDate(plan.week2_end)}</>}
        </div>
      </div>

      {/* Standards columns */}
      <div className="std-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px', flex: 1 }}>
        {[1, 2].map(week => (
          <div key={week} className="std-col" style={{ flex: 1, border: '2px solid #000', padding: '10px', display: 'flex', flexDirection: 'column' }}>
            <div className="std-hdr" style={{ fontWeight: 'bold', fontSize: '12px', borderBottom: '2px solid #000', paddingBottom: '5px', marginBottom: '10px' }}>
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
                <div key={key} className="std-itm" style={{ fontSize: '10px', marginBottom: '7px', lineHeight: '1.4' }}>
                  <Chk checked={std?.codes?.length > 0} /> <b>{label}</b>{std?.codes?.length > 0 && ` ${std.codes.join(', ')}`}
                </div>
              );
            })}
            <div className="exp-box" style={{ border: '1px solid #000', padding: '8px', marginTop: 'auto', minHeight: '90px', fontSize: '10px' }}>
              <b style={{ textDecoration: 'underline' }}>Expectations:</b>
              <div style={{ marginTop: '6px' }}>{getExpectationForWeek(week)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="int-sec" style={{ border: '1px solid #000', padding: '10px', marginBottom: '14px', fontSize: '10px' }}>
        <b>Integration with other subjects:</b>
        <div className="int-items" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '8px' }}>
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
            <span key={key} style={{ fontSize: '10px' }}><Chk checked={plan.subject_integration?.includes(key)} /> {label}</span>
          ))}
        </div>
      </div>

      <div className="sigs" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px' }}>
        <div className="sig" style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '10px' }}>Teacher's Signature / Date</div>
        <div className="sig" style={{ width: '45%', borderTop: '1px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '10px' }}>Principal's Signature / Date</div>
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
            {/* Page wrapper centers content */}
            <div className="bg-white shadow mb-6 mx-auto" style={{ width: '8.5in', height: '11in', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <WeekPage days={planDays} weekNum={1} weekStart={plan.week_start} weekEnd={plan.week_end} objective={plan.objective} skills={plan.skills} />
            </div>

            {(plan.week2_start || plan.week2_end) && (
              <div className="bg-white shadow mb-6 mx-auto" style={{ width: '8.5in', height: '11in', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <WeekPage days={planDaysWeek2} weekNum={2} weekStart={plan.week2_start} weekEnd={plan.week2_end} objective={plan.objective_week2} skills={plan.skills_week2} />
              </div>
            )}

            <div className="bg-white shadow mx-auto" style={{ width: '8.5in', height: '11in', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
