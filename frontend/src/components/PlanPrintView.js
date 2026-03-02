import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

const ACTIVITY_LABELS = {
  brainstorming: { en: 'Brain storming', es: 'Lluvia de ideas' },
  buildingBackground: { en: 'Building background', es: 'Conocimiento previo' },
  vocabularyDevelopment: { en: 'Vocabulary development', es: 'Vocabulario' },
  readPages: { en: 'Read pages ___', es: 'Leer páginas ___' },
  guidedReading: { en: 'Guided/choral reading', es: 'Lectura guiada/coral' },
  oralQuestions: { en: 'Oral comprehension Qs', es: 'Preguntas orales' },
  comprehensionQuestions: { en: 'Comprehension Qs', es: 'Preguntas comprensión' },
  exercisePractice: { en: 'Exercise practice', es: 'Práctica ejercicio' },
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
            margin: 0.15in 0.2in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { 
            height: 100%;
            width: 100%;
          }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            font-size: 7pt;
            line-height: 1.05;
            color: #000;
          }
          
          /* Page container - fills entire print page */
          .page {
            width: 100%;
            height: 100vh;
            display: flex;
            flex-direction: column;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden;
          }
          .page:last-child { page-break-after: avoid; }
          
          /* Header - very compact */
          .header {
            text-align: center;
            padding-bottom: 2px;
            margin-bottom: 3px;
            border-bottom: 1.5px solid #333;
            flex-shrink: 0;
          }
          .header-logo {
            height: 28px;
            object-fit: contain;
            margin-bottom: 1px;
          }
          .school-name {
            font-size: 10pt;
            font-weight: bold;
            margin: 1px 0;
          }
          .school-info {
            font-size: 6.5pt;
            color: #333;
          }
          .plan-title {
            font-size: 9pt;
            font-weight: bold;
            margin-top: 1px;
          }
          
          /* Info row - compact */
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            margin-bottom: 3px;
            border-bottom: 1px solid #999;
            font-size: 7.5pt;
            flex-shrink: 0;
          }
          .info-row strong { font-weight: bold; }
          
          /* Objective box - compact */
          .objective-box {
            border: 1px solid #000;
            padding: 3px 5px;
            margin-bottom: 3px;
            font-size: 7.5pt;
            flex-shrink: 0;
          }
          .objective-box strong {
            font-weight: bold;
            text-decoration: underline;
          }
          
          /* Skills box - compact */
          .skills-box {
            border: 1px solid #000;
            padding: 3px 5px;
            margin-bottom: 4px;
            font-size: 6.5pt;
            flex-shrink: 0;
          }
          .skills-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 1px;
          }
          .skills-list {
            margin-left: 10px;
          }
          .skills-list li {
            margin-bottom: 0;
          }
          
          /* Table wrapper - CRITICAL: grows to fill remaining page space */
          .table-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            overflow: hidden;
          }
          
          /* Main table - fills wrapper height */
          table.main-grid {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 6.5pt;
          }
          table.main-grid th,
          table.main-grid td {
            border: 1px solid #000;
            padding: 1px 2px;
            vertical-align: top;
            word-wrap: break-word;
            overflow: hidden;
          }
          table.main-grid th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 7.5pt;
            padding: 2px;
          }
          
          /* Column widths */
          .col-label { width: 8%; }
          .col-day { width: 18.4%; }
          
          /* Day header cell */
          .day-header {
            font-weight: bold;
            font-size: 8pt;
          }
          .eca-line {
            font-size: 5.5pt;
            margin-top: 1px;
          }
          
          /* Row label cell */
          .row-label {
            font-weight: bold;
            font-size: 6pt;
            background: #f5f5f5;
            line-height: 1.1;
          }
          
          /* Checkbox styling */
          .chk {
            display: inline-block;
            width: 6px;
            height: 6px;
            border: 1px solid #000;
            margin-right: 1px;
            vertical-align: middle;
            text-align: center;
            font-size: 4pt;
            line-height: 4px;
          }
          .chk.checked {
            background: #000;
            color: #fff;
          }
          
          /* Activity/Material items */
          .item-row {
            font-size: 6pt;
            line-height: 1.15;
            margin-bottom: 0;
          }
          
          /* DOK levels - compact with descriptions */
          .dok-item {
            font-size: 5.5pt;
            line-height: 1.1;
            margin-bottom: 1px;
          }
          .dok-title {
            font-weight: bold;
          }
          .dok-desc {
            font-size: 5pt;
            color: #333;
            display: inline;
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
            html, body { 
              height: 100%; 
              width: 100%;
              overflow: hidden;
            }
            body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .page { 
              height: 100vh !important;
              page-break-after: always;
              page-break-inside: avoid;
            }
            .page:last-child { page-break-after: avoid; }
            .table-wrapper {
              flex: 1;
              min-height: 0;
            }
            table.main-grid {
              height: 100%;
            }
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
      
      {/* CRITICAL: Table wrapper with flex-grow to fill remaining page space */}
      <div className="table-wrapper">
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
            
            {/* Type of Taxonomy Row - WITH FULL DESCRIPTIONS LIKE REFERENCE IMAGE */}
            <tr>
              <td className="row-label">
                Type of<br/>Taxonomy:<br/>Webb (2005)<br/>Levels
              </td>
              {days.map((day, i) => (
                <td key={i}>
                  <div className="dok-item">
                    <Chk checked={day.dok_levels?.includes(1)} /> <span className="dok-title">Level 1: Memory Thought</span>
                    <span className="dok-desc">(Knowledge in or the same way as learned)</span>
                  </div>
                  <div className="dok-item">
                    <Chk checked={day.dok_levels?.includes(2)} /> <span className="dok-title">Level 2: Processing</span>
                    <span className="dok-desc">(Requires some basic mental reasoning, something beyond memory)</span>
                  </div>
                  <div className="dok-item">
                    <Chk checked={day.dok_levels?.includes(3)} /> <span className="dok-title">Level 3: Thinking Strategic</span>
                    <span className="dok-desc">(Demonstrate knowledge based on complex and abstract cognitive demand)</span>
                  </div>
                  <div className="dok-item">
                    <Chk checked={day.dok_levels?.includes(4)} /> <span className="dok-title">Level 4: Thinking Thought Extended</span>
                    <span className="dok-desc">(Extends knowledge to broader contexts)</span>
                  </div>
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
                        {matType === 'other' && material?.checked && material?.notes && (
                          <span style={{fontStyle:'italic'}}>: {material.notes}</span>
                        )}
                      </div>
                    );
                  })}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
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
