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
            margin: 0.2in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, Helvetica, sans-serif; 
            font-size: 8pt;
            line-height: 1.2;
            color: #000;
          }
          
          /* PAGE CONTAINER - FILLS ENTIRE PAGE HEIGHT */
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
          
          /* Header */
          .header {
            text-align: center;
            padding-bottom: 3px;
            margin-bottom: 3px;
            border-bottom: 2px solid #333;
            flex-shrink: 0;
          }
          .header-logo {
            height: 30px;
            object-fit: contain;
            margin-bottom: 1px;
          }
          .school-name {
            font-size: 10pt;
            font-weight: bold;
            margin: 1px 0;
          }
          .school-info {
            font-size: 6pt;
            color: #333;
          }
          .plan-title {
            font-size: 9pt;
            font-weight: bold;
            margin-top: 2px;
          }
          
          /* Info row */
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            margin-bottom: 3px;
            border-bottom: 1px solid #999;
            font-size: 7pt;
            flex-shrink: 0;
          }
          .info-row strong { font-weight: bold; }
          
          /* Objective box */
          .objective-box {
            border: 1px solid #000;
            padding: 2px 4px;
            margin-bottom: 3px;
            font-size: 7pt;
            flex-shrink: 0;
          }
          .objective-box strong {
            font-weight: bold;
            text-decoration: underline;
          }
          
          /* Skills box */
          .skills-box {
            border: 1px solid #000;
            padding: 2px 4px;
            margin-bottom: 3px;
            font-size: 6pt;
            flex-shrink: 0;
          }
          .skills-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 1px;
          }
          .skills-list {
            margin-left: 12px;
          }
          .skills-list li {
            margin-bottom: 0px;
          }
          
          /* TABLE WRAPPER - GROWS TO FILL REMAINING SPACE */
          .table-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }
          
          /* Main table - FILLS wrapper height */
          table.main-grid {
            width: 100%;
            height: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 6pt;
          }
          table.main-grid th,
          table.main-grid td {
            border: 1px solid #000;
            padding: 2px 2px;
            vertical-align: top;
            word-wrap: break-word;
          }
          table.main-grid th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 7pt;
            padding: 2px;
          }
          
          /* Column widths */
          .col-label { width: 9%; }
          .col-day { width: 18.2%; }
          
          /* Day header */
          .day-header {
            font-weight: bold;
            font-size: 8pt;
          }
          .eca-line {
            font-size: 6pt;
            margin-top: 1px;
          }
          
          /* Row label */
          .row-label {
            font-weight: bold;
            font-size: 6pt;
            background: #f5f5f5;
          }
          
          /* Checkbox */
          .chk {
            display: inline-block;
            width: 7px;
            height: 7px;
            border: 1px solid #000;
            margin-right: 2px;
            vertical-align: middle;
            text-align: center;
            font-size: 4pt;
            line-height: 5px;
          }
          .chk.checked {
            background: #000;
            color: #fff;
          }
          
          /* DOK levels */
          .dok-item {
            font-size: 6pt;
            line-height: 1.05;
            margin-bottom: 0px;
          }
          
          /* Activity/Material items */
          .item-row {
            font-size: 6pt;
            line-height: 1.05;
            margin-bottom: 0px;
          }
          
          /* ===== STANDARDS PAGE (Page B) ===== */
          .standards-grid {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
          }
          .standards-week {
            flex: 1;
            border: 1px solid #000;
            padding: 10px;
          }
          .standards-title {
            font-weight: bold;
            font-size: 11pt;
            border-bottom: 2px solid #000;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .standard-row {
            font-size: 10pt;
            margin-bottom: 6px;
          }
          .expectations-box {
            border: 1px solid #000;
            padding: 8px;
            margin-top: 12px;
            min-height: 80px;
            font-size: 10pt;
          }
          
          /* Integration section */
          .integration-section {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 10pt;
          }
          .integration-title {
            font-weight: bold;
            margin-bottom: 8px;
          }
          .integration-items {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
          }
          
          /* Signatures */
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 15px;
          }
          .sig-line {
            width: 40%;
            border-top: 1px solid #000;
            padding-top: 8px;
            text-align: center;
            font-size: 10pt;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page { page-break-after: always; }
            .page:last-child { page-break-after: avoid; }
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

  // Checkbox component
  const Chk = ({ checked }) => (
    <span style={{
      display: 'inline-block',
      width: '8px',
      height: '8px',
      border: '1px solid #000',
      marginRight: '3px',
      verticalAlign: 'middle',
      textAlign: 'center',
      fontSize: '5pt',
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
      
      {/* TABLE WRAPPER - GROWS TO FILL REMAINING PAGE SPACE */}
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
              <td key={i} style={{textAlign: 'center', fontWeight: 'bold', fontSize: '8pt'}}>
                {day.theme || ''}
              </td>
            ))}
          </tr>
          
          {/* Type of Taxonomy Row - DOK Levels with SHORT descriptions */}
          <tr>
            <td className="row-label">
              Type of<br/>Taxonomy:<br/>Webb (2005)<br/>Levels
            </td>
            {days.map((day, i) => (
              <td key={i}>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(1)} /> Lv1: Memory <span style={{fontSize: '5pt', color: '#333'}}>(recall)</span></div>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(2)} /> Lv2: Processing <span style={{fontSize: '5pt', color: '#333'}}>(reasoning)</span></div>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(3)} /> Lv3: Strategic <span style={{fontSize: '5pt', color: '#333'}}>(complex)</span></div>
                <div className="dok-item"><Chk checked={day.dok_levels?.includes(4)} /> Lv4: Extended <span style={{fontSize: '5pt', color: '#333'}}>(broader)</span></div>
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
      <div className="info-row" style={{marginBottom: '15px'}}>
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

      {/* Standards Grid - Two Columns SIDE BY SIDE like reference image */}
      <div className="standards-grid" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
        <div className="standards-week" style={{ flex: 1, border: '1px solid #000', padding: '10px' }}>
          <div className="standards-title" style={{ fontWeight: 'bold', fontSize: '11pt', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '10px' }}>Standard: First Week</div>
          {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
            const standard = getStandardsForWeek(1).find(s => s.domain === domain);
            return (
              <div key={domain} className="standard-row" style={{ fontSize: '10pt', marginBottom: '6px' }}>
                <Chk checked={standard?.codes?.length > 0} />
                <strong>{STANDARD_LABELS[domain][lang]}</strong>
                {standard?.codes?.length > 0 && (
                  <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>
                )}
              </div>
            );
          })}
          <div className="expectations-box" style={{ border: '1px solid #000', padding: '8px', marginTop: '12px', minHeight: '80px', fontSize: '10pt' }}>
            <strong>Expectations:</strong>
            <div style={{marginTop: '6px'}}>{getExpectationForWeek(1)}</div>
          </div>
        </div>
        
        <div className="standards-week" style={{ flex: 1, border: '1px solid #000', padding: '10px' }}>
          <div className="standards-title" style={{ fontWeight: 'bold', fontSize: '11pt', borderBottom: '2px solid #000', paddingBottom: '6px', marginBottom: '10px' }}>Standard: Second Week</div>
          {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
            const standard = getStandardsForWeek(2).find(s => s.domain === domain);
            return (
              <div key={domain} className="standard-row" style={{ fontSize: '10pt', marginBottom: '6px' }}>
                <Chk checked={standard?.codes?.length > 0} />
                <strong>{STANDARD_LABELS[domain][lang]}</strong>
                {standard?.codes?.length > 0 && (
                  <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>
                )}
              </div>
            );
          })}
          <div className="expectations-box" style={{ border: '1px solid #000', padding: '8px', marginTop: '12px', minHeight: '80px', fontSize: '10pt' }}>
            <strong>Expectations:</strong>
            <div style={{marginTop: '6px'}}>{getExpectationForWeek(2)}</div>
          </div>
        </div>
      </div>

      {/* Integration with other subjects */}
      <div className="integration-section" style={{ border: '1px solid #000', padding: '10px', marginBottom: '15px', fontSize: '10pt' }}>
        <div className="integration-title" style={{ fontWeight: 'bold', marginBottom: '8px' }}>Integration with other subjects:</div>
        <div className="integration-items" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
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
            {/* Page 1: Week 1 Daily Plan - Fixed height with overflow hidden */}
            <div className="bg-white shadow-lg mb-6 mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.2in', overflow: 'hidden' }}>
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
              <div className="bg-white shadow-lg mb-6 mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.2in', overflow: 'hidden' }}>
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
            <div className="bg-white shadow-lg mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.2in', overflow: 'hidden' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
