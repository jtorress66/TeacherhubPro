import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

const ACTIVITY_LABELS = {
  brainstorming: { en: 'Brain storming', es: 'Lluvia de ideas' },
  buildingBackground: { en: 'Building background', es: 'Construir conocimiento previo' },
  vocabularyDevelopment: { en: 'Vocabulary development', es: 'Desarrollo de vocabulario' },
  readPages: { en: 'Read pages ___ from the book', es: 'Leer páginas ___ del libro' },
  guidedReading: { en: 'Students will do guided and choral reading', es: 'Lectura guiada y coral' },
  oralQuestions: { en: 'Teacher ask oral questions to demonstrate comprehension', es: 'Preguntas orales de comprensión' },
  comprehensionQuestions: { en: 'Students answer comprehension questions', es: 'Responder preguntas de comprensión' },
  exercisePractice: { en: 'Work on an exercise practice', es: 'Práctica de ejercicio' },
  other: { en: 'Other', es: 'Otro' }
};

const MATERIAL_LABELS = {
  book: { en: 'Book', es: 'Libro' },
  notebook: { en: 'Notebook', es: 'Cuaderno' },
  teachersGuide: { en: "Teacher's Guide", es: 'Guía del Maestro' },
  testQuiz: { en: 'Test, quiz', es: 'Prueba, examen' },
  dictionary: { en: 'Dictionary', es: 'Diccionario' },
  handouts: { en: 'Handouts', es: 'Hojas de trabajo' },
  other: { en: 'Others', es: 'Otros' }
};

const DAY_LABELS = {
  monday: { en: 'Monday', es: 'Lunes' },
  tuesday: { en: 'Tuesday', es: 'Martes' },
  wednesday: { en: 'Wednesday', es: 'Miércoles' },
  thursday: { en: 'Thursday', es: 'Jueves' },
  friday: { en: 'Friday', es: 'Viernes' }
};

const STANDARD_LABELS = {
  listeningAndSpeaking: { en: 'Listening/Speaking', es: 'Escuchar/Hablar' },
  foundationalSkills: { en: 'Foundational Skills', es: 'Destrezas Fundamentales' },
  reading: { en: 'Reading', es: 'Lectura' },
  writing: { en: 'Writing', es: 'Escritura' },
  language: { en: 'Language', es: 'Lenguaje' }
};

// Helper function to format date from YYYY-MM-DD to MM/DD/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return '_____';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${month}/${day}/${year}`;
  }
  return dateStr;
};

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

  const getStandardsForWeek = (weekIndex) => {
    return plan.standards?.filter(s => s.week_index === weekIndex) || [];
  };

  const getExpectationForWeek = (weekIndex) => {
    return plan.expectations?.find(e => e.week_index === weekIndex)?.content || 
           plan.expectations?.find(e => e.week_index === weekIndex)?.text || '';
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lesson Plan - ${plan.unit || 'Plan'}</title>
        <style>
          @page { 
            size: letter landscape;
            margin: 0.25in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            height: 100%;
          }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            font-size: 9pt;
            line-height: 1.2;
            color: #000;
          }
          .page {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .page:last-child { page-break-after: avoid; }
          
          /* Header styles */
          .header {
            text-align: center;
            margin-bottom: 8px;
            padding-bottom: 5px;
            border-bottom: 2px solid #333;
          }
          .header-logo {
            height: 45px;
            object-fit: contain;
            margin-bottom: 3px;
          }
          .school-name {
            font-size: 13pt;
            font-weight: bold;
            margin: 3px 0;
          }
          .school-info {
            font-size: 9pt;
            color: #333;
          }
          .plan-title {
            font-size: 12pt;
            font-weight: bold;
            margin-top: 5px;
          }
          
          /* Info row */
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #999;
            font-size: 10pt;
          }
          .info-row strong { font-weight: bold; }
          
          /* Objective box */
          .objective-box {
            border: 1px solid #000;
            padding: 6px 10px;
            margin-bottom: 8px;
            font-size: 10pt;
          }
          .objective-box strong {
            font-weight: bold;
            text-decoration: underline;
          }
          
          /* Skills box */
          .skills-box {
            border: 1px solid #000;
            padding: 6px 10px;
            margin-bottom: 10px;
            font-size: 9pt;
          }
          .skills-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 4px;
          }
          .skills-list {
            margin-left: 20px;
          }
          .skills-list li {
            margin-bottom: 1px;
          }
          
          /* Main table - fills remaining space */
          table.main-grid {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 8pt;
          }
          table.main-grid th,
          table.main-grid td {
            border: 1px solid #000;
            padding: 3px 4px;
            vertical-align: top;
            word-wrap: break-word;
          }
          table.main-grid th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 9pt;
            padding: 4px;
          }
          
          /* Column widths */
          .col-label { width: 11%; }
          .col-day { width: 17.8%; }
          
          /* Day header cell */
          .day-header {
            font-weight: bold;
            font-size: 10pt;
          }
          .eca-line {
            font-size: 7pt;
            margin-top: 2px;
          }
          
          /* Row label cell */
          .row-label {
            font-weight: bold;
            font-size: 7pt;
            background: #f5f5f5;
          }
          
          /* Checkbox styling */
          .chk {
            display: inline-block;
            width: 9px;
            height: 9px;
            border: 1px solid #000;
            margin-right: 2px;
            vertical-align: middle;
            text-align: center;
            font-size: 6pt;
            line-height: 7px;
          }
          .chk.checked {
            background: #000;
            color: #fff;
          }
          
          /* Activity/Material items - tighter spacing */
          .item-row {
            font-size: 7pt;
            line-height: 1.2;
            margin-bottom: 1px;
          }
          
          /* DOK levels - tighter */
          .dok-item {
            font-size: 7pt;
            line-height: 1.25;
            margin-bottom: 1px;
          }
          
          /* Standards page */
          .standards-grid {
            display: flex;
            gap: 15px;
            margin-bottom: 12px;
          }
          .standards-week {
            flex: 1;
            border: 1px solid #000;
            padding: 8px;
          }
          .standards-title {
            font-weight: bold;
            font-size: 10pt;
            border-bottom: 2px solid #000;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .standard-row {
            font-size: 8pt;
            margin-bottom: 4px;
          }
          .expectations-box {
            border: 1px solid #000;
            padding: 6px;
            margin-top: 10px;
            min-height: 50px;
          }
          
          /* Integration section */
          .integration-section {
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 15px;
            font-size: 9pt;
          }
          .integration-title {
            font-weight: bold;
            margin-bottom: 6px;
          }
          .integration-items {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
          }
          
          /* Signatures */
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 10px;
          }
          .sig-line {
            width: 40%;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
            font-size: 8pt;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { height: auto; }
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
    }, 300);
  };

  // Checkbox component - using inline styles for print compatibility
  const Chk = ({ checked }) => (
    <span style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      border: '1px solid #000',
      marginRight: '3px',
      verticalAlign: 'middle',
      textAlign: 'center',
      fontSize: '6pt',
      lineHeight: '6px',
      background: checked ? '#000' : '#fff',
      color: checked ? '#fff' : '#000'
    }}>
      {checked ? '✓' : ''}
    </span>
  );

  // Weekly Plan Page (Page A) - Matches user's "Techers Planner A.jpeg"
  const WeeklyPlanPage = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <div className="page">
      {/* Header */}
      <div className="header">
        {school?.logo_url && (
          <img src={school.logo_url} alt="Logo" className="header-logo" />
        )}
        <div className="school-name">{school?.name || 'School Name'}</div>
        <div className="school-info">
          {school?.address && <span>{school.address}</span>}
          {school?.phone && <span> | Tel. {school.phone}</span>}
          {school?.email && <span> | {school.email}</span>}
        </div>
        <div className="plan-title">
          {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
          {weekNum === 2 && <span style={{marginLeft: '10px'}}>(Week 2)</span>}
        </div>
      </div>
      
      {/* Info Row */}
      <div className="info-row">
        <span><strong>Unit:</strong> {plan.unit || '_____'} &nbsp; <strong>Story:</strong> {plan.story || '_____'}</span>
        <span><strong>Teacher:</strong> {plan.teacher_name || '_____'} &nbsp; <strong>Grade:</strong> {classInfo?.grade || ''}-{classInfo?.section || ''}</span>
        <span><strong>Date:</strong> From {formatDate(weekStart)} To {formatDate(weekEnd)}</span>
      </div>
      
      {/* Objective */}
      <div className="objective-box">
        <strong>Objective of the week:</strong> {objective || '_____'}
      </div>
      
      {/* Skills */}
      <div className="skills-box">
        <div className="skills-title">Skills of the week:</div>
        <ol className="skills-list">
          {(skills || []).filter(s => s).length > 0 ? (
            skills.filter(s => s).map((skill, i) => (
              <li key={i}>{skill}</li>
            ))
          ) : (
            <>
              <li>_________________________</li>
              <li>_________________________</li>
              <li>_________________________</li>
              <li>_________________________</li>
            </>
          )}
        </ol>
      </div>
      
      {/* Main Grid Table */}
      <table className="main-grid">
        <thead>
          <tr>
            <th className="col-label"></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} className="col-day">
                <div className="day-header">{DAY_LABELS[day][lang]}</div>
                <div className="eca-line">
                  <Chk checked={days[idx]?.eca?.E} />E{' '}
                  <Chk checked={days[idx]?.eca?.C} />C{' '}
                  <Chk checked={days[idx]?.eca?.A} />A
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Day Theme Row */}
          <tr>
            <td className="row-label">Day Theme</td>
            {days.map((day, i) => (
              <td key={i} style={{textAlign: 'center', fontWeight: 'bold', fontSize: '7pt'}}>
                {day.theme || ''}
              </td>
            ))}
          </tr>
          
          {/* Type of Taxonomy Row */}
          <tr>
            <td className="row-label">
              Type of<br/>Taxonomy:<br/>Webb (2005)<br/>Levels
            </td>
            {days.map((day, i) => (
              <td key={i}>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(1)} /> L1: Memory</div>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(2)} /> L2: Processing</div>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(3)} /> L3: Strategic</div>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(4)} /> L4: Extended</div>
              </td>
            ))}
          </tr>
          
          {/* Activities Row */}
          <tr>
            <td className="row-label">Activities</td>
            {days.map((day, i) => (
              <td key={i}>
                {Object.keys(ACTIVITY_LABELS).map(actType => {
                  const activity = day.activities?.find(a => a.activity_type === actType);
                  return (
                    <div key={actType} className="item-row">
                      <Chk checked={activity?.checked} /> {ACTIVITY_LABELS[actType][lang]}
                      {actType === 'other' && activity?.checked && activity?.notes && (
                        <span style={{fontStyle:'italic'}}>: {activity.notes}</span>
                      )}
                    </div>
                  );
                })}
              </td>
            ))}
          </tr>
          
          {/* Materials Row */}
          <tr>
            <td className="row-label">Materials</td>
            {days.map((day, i) => (
              <td key={i}>
                {Object.keys(MATERIAL_LABELS).map(matType => {
                  const material = day.materials?.find(m => m.material_type === matType);
                  return (
                    <div key={matType} className="item-row">
                      <Chk checked={material?.checked} /> {MATERIAL_LABELS[matType][lang]}
                    </div>
                  );
                })}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Standards Page (Page B) - Matches user's "Teachers Planner B.jpeg"
  const StandardsPage = () => (
    <div className="page">
      {/* Header */}
      <div className="header">
        {school?.logo_url && (
          <img src={school.logo_url} alt="Logo" className="header-logo" />
        )}
        <div className="school-name">{school?.name || 'School Name'}</div>
        <div className="school-info">
          {school?.address && <span>{school.address}</span>}
          {school?.phone && <span> | Tel. {school.phone}</span>}
          {school?.email && <span> | {school.email}</span>}
        </div>
        <div className="plan-title">
          {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
        </div>
      </div>
      
      {/* Info Row */}
      <div className="info-row" style={{marginBottom: '12px'}}>
        <div>
          <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
          <div><strong>Story:</strong> {plan.story || '_____'}</div>
          <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
          <div><strong>Grade:</strong> {classInfo?.grade || ''}-{classInfo?.section || ''}</div>
        </div>
        <div>
          <strong>Date</strong><br/>
          From: {formatDate(plan.week_start)} To: {formatDate(plan.week_end)}
          {(plan.week2_start || plan.week2_end) && (
            <><br/>From: {formatDate(plan.week2_start)} To: {formatDate(plan.week2_end)}</>
          )}
        </div>
      </div>

      {/* Standards Grid - Two Columns */}
      <div className="standards-grid">
        <div className="standards-week">
          <div className="standards-title">Standard: First Week</div>
          {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
            const standard = getStandardsForWeek(1).find(s => s.domain === domain);
            return (
              <div key={domain} className="standard-row">
                <Chk checked={standard?.codes?.length > 0} />
                <strong>{STANDARD_LABELS[domain][lang]}</strong>
                {standard?.codes?.length > 0 && (
                  <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>
                )}
              </div>
            );
          })}
          <div className="expectations-box">
            <strong>Expectations:</strong>
            <div style={{marginTop: '4px'}}>{getExpectationForWeek(1)}</div>
          </div>
        </div>
        
        <div className="standards-week">
          <div className="standards-title">Standard: Second Week</div>
          {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
            const standard = getStandardsForWeek(2).find(s => s.domain === domain);
            return (
              <div key={domain} className="standard-row">
                <Chk checked={standard?.codes?.length > 0} />
                <strong>{STANDARD_LABELS[domain][lang]}</strong>
                {standard?.codes?.length > 0 && (
                  <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>
                )}
              </div>
            );
          })}
          <div className="expectations-box">
            <strong>Expectations:</strong>
            <div style={{marginTop: '4px'}}>{getExpectationForWeek(2)}</div>
          </div>
        </div>
      </div>

      {/* Integration with other subjects */}
      <div className="integration-section">
        <div className="integration-title">Integration with other subjects:</div>
        <div className="integration-items">
          {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
            <span key={subject}>
              <Chk checked={plan.subject_integration?.includes(subject)} />
              {subject === 'mathematics' ? 'Mathematics' :
               subject === 'spanish' ? 'Spanish' :
               subject === 'socialStudies' ? 'Social Studies' :
               subject === 'science' ? 'Science' :
               subject === 'health' ? 'Health' :
               subject === 'art' ? 'Art' :
               subject === 'physicalEducation' ? 'Physical Education' :
               'Religion'}
            </span>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div className="signatures">
        <div className="sig-line">
          Teacher's Signature / Date
        </div>
        <div className="sig-line">
          Principal's Signature / Date
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-auto">
        {/* Toolbar */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="font-heading font-semibold text-lg">
            {lang === 'es' ? 'Vista Previa de Impresión' : 'Print Preview'}
          </h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2" data-testid="print-btn">
              <Printer className="h-4 w-4" />
              {lang === 'es' ? 'Imprimir' : 'Print'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Print Preview Container */}
        <div className="p-6 bg-slate-200">
          <div ref={printRef} className="preview-wrapper">
            {/* Page 1: Week 1 Daily Plan */}
            <div className="bg-white shadow-lg mb-6 mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.25in', overflow: 'hidden' }}>
              <WeeklyPlanPage
                days={planDays}
                weekNum={1}
                weekStart={plan.week_start}
                weekEnd={plan.week_end}
                objective={plan.objective}
                skills={plan.skills}
              />
            </div>

            {/* Page 2: Week 2 Daily Plan (if has week 2 data) */}
            {(plan.week2_start || plan.week2_end) && (
              <div className="bg-white shadow-lg mb-6 mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.25in', overflow: 'hidden' }}>
                <WeeklyPlanPage
                  days={planDaysWeek2}
                  weekNum={2}
                  weekStart={plan.week2_start}
                  weekEnd={plan.week2_end}
                  objective={plan.objective_week2}
                  skills={plan.skills_week2}
                />
              </div>
            )}

            {/* Page 3: Standards */}
            <div className="bg-white shadow-lg mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.25in', overflow: 'hidden' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
