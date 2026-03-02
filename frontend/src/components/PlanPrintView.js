import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

const ACTIVITY_LABELS = {
  brainstorming: { en: 'Brainstorming', es: 'Lluvia de ideas' },
  buildingBackground: { en: 'Building background', es: 'Conocimiento previo' },
  vocabularyDevelopment: { en: 'Vocabulary dev.', es: 'Vocabulario' },
  readPages: { en: 'Read pages', es: 'Leer páginas' },
  guidedReading: { en: 'Guided reading', es: 'Lectura guiada' },
  oralQuestions: { en: 'Oral comp. Qs', es: 'Preguntas orales' },
  comprehensionQuestions: { en: 'Comprehension Qs', es: 'Preguntas comp.' },
  exercisePractice: { en: 'Exercise practice', es: 'Práctica' },
  other: { en: 'Other', es: 'Otro' }
};

const MATERIAL_LABELS = {
  book: { en: 'Book', es: 'Libro' },
  notebook: { en: 'Notebook', es: 'Cuaderno' },
  teachersGuide: { en: "Teacher's Guide", es: 'Guía Maestro' },
  testQuiz: { en: 'Test/Quiz', es: 'Prueba' },
  dictionary: { en: 'Dictionary', es: 'Diccionario' },
  handouts: { en: 'Handouts', es: 'Hojas trabajo' },
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
          /* CRITICAL: Force exact page dimensions */
          @page { 
            size: 11in 8.5in; /* Landscape letter */
            margin: 0.15in;
          }
          
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          html, body {
            width: 100%;
            height: 100%;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7pt;
            line-height: 1.15;
            color: #000;
          }
          
          /* ========================================
             PAGE: CSS GRID - GUARANTEED SINGLE PAGE
             ======================================== */
          .page {
            width: 10.7in;
            height: 8.2in; /* Exact height minus margins */
            display: grid;
            grid-template-rows: auto auto auto auto minmax(0, 1fr);
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden; /* CRITICAL: Clip any overflow */
          }
          .page:last-child { page-break-after: avoid; }
          
          /* HEADER - Fixed height */
          .header {
            text-align: center;
            padding-bottom: 2px;
            border-bottom: 1.5pt solid #333;
          }
          .header-logo {
            height: 24px;
            object-fit: contain;
          }
          .school-name {
            font-size: 9pt;
            font-weight: bold;
            margin: 0;
          }
          .school-info {
            font-size: 5.5pt;
            color: #333;
          }
          .plan-title {
            font-size: 8pt;
            font-weight: bold;
            margin-top: 1px;
          }
          
          /* INFO ROW - Fixed height */
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 2px 0;
            border-bottom: 1px solid #999;
            font-size: 6.5pt;
          }
          .info-row strong { font-weight: bold; }
          
          /* OBJECTIVE BOX - Fixed height */
          .objective-box {
            border: 1px solid #000;
            padding: 2px 3px;
            margin: 2px 0;
            font-size: 6.5pt;
          }
          .objective-box strong {
            font-weight: bold;
            text-decoration: underline;
          }
          
          /* SKILLS BOX - Fixed height */
          .skills-box {
            border: 1px solid #000;
            padding: 2px 3px;
            margin-bottom: 2px;
            font-size: 6pt;
          }
          .skills-title {
            font-weight: bold;
            text-decoration: underline;
          }
          .skills-list {
            margin: 0 0 0 10px;
            padding: 0;
          }
          .skills-list li {
            margin: 0;
          }
          
          /* ========================================
             MAIN TABLE - FILLS REMAINING SPACE
             Uses CSS Grid for precise row distribution
             ======================================== */
          .table-container {
            display: grid;
            grid-template-rows: auto repeat(4, minmax(0, 1fr)); /* Header + 4 equal rows */
            border: 1px solid #000;
            min-height: 0; /* Critical for grid item sizing */
            overflow: hidden;
          }
          
          /* Table header row */
          .table-header {
            display: grid;
            grid-template-columns: 9% repeat(5, 1fr);
            border-bottom: 1px solid #000;
            background: #e8e8e8;
          }
          .table-header > div {
            border-right: 1px solid #000;
            padding: 2px;
            text-align: center;
            font-weight: bold;
            font-size: 6.5pt;
          }
          .table-header > div:last-child { border-right: none; }
          
          /* Table content rows */
          .table-row {
            display: grid;
            grid-template-columns: 9% repeat(5, 1fr);
            border-bottom: 1px solid #000;
            min-height: 0;
            overflow: hidden;
          }
          .table-row:last-child { border-bottom: none; }
          
          .table-row > div {
            border-right: 1px solid #000;
            padding: 1px 2px;
            overflow: hidden;
            min-height: 0;
            font-size: 5.5pt;
          }
          .table-row > div:last-child { border-right: none; }
          
          /* Row label cell */
          .row-label {
            font-weight: bold;
            font-size: 5pt !important;
            background: #f5f5f5;
            display: flex;
            align-items: flex-start;
            line-height: 1.1;
          }
          
          /* Day theme cell */
          .theme-cell {
            text-align: center;
            font-weight: bold;
            font-size: 7pt !important;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          /* DOK/Activity/Material cells */
          .content-cell {
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          /* Checkbox */
          .chk {
            display: inline-block;
            width: 5px;
            height: 5px;
            border: 0.5pt solid #000;
            margin-right: 1px;
            vertical-align: middle;
            text-align: center;
            font-size: 3.5pt;
            line-height: 4px;
          }
          .chk.checked {
            background: #000;
          }
          
          /* Item row (DOK/Activity/Material) */
          .item-row {
            font-size: 5.5pt;
            line-height: 1.1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          /* ECA line in header */
          .eca-line {
            font-size: 5pt;
          }
          
          /* ===== STANDARDS PAGE ===== */
          .page.standards-page {
            grid-template-rows: auto auto 1fr auto auto;
          }
          
          .standards-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 10px 0;
          }
          .standards-week {
            border: 1px solid #000;
            padding: 8px;
          }
          .standards-title {
            font-weight: bold;
            font-size: 10pt;
            border-bottom: 1.5pt solid #000;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .standard-row {
            font-size: 9pt;
            margin-bottom: 4px;
          }
          .expectations-box {
            border: 1px solid #000;
            padding: 6px;
            margin-top: 10px;
            min-height: 60px;
            font-size: 9pt;
          }
          
          .integration-section {
            border: 1px solid #000;
            padding: 8px;
            margin: 10px 0;
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
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 12px;
          }
          .sig-line {
            width: 40%;
            border-top: 1px solid #000;
            padding-top: 6px;
            text-align: center;
            font-size: 9pt;
          }
          
          @media print {
            html, body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
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

  // Checkbox component
  const Chk = ({ checked }) => (
    <span className={`chk ${checked ? 'checked' : ''}`} />
  );

  // Weekly Plan Page - CSS Grid based layout (GUARANTEED SINGLE PAGE)
  const WeeklyPlanPage = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <div className="page">
      {/* HEADER */}
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
      
      {/* INFO ROW */}
      <div className="info-row">
        <span><strong>Unit:</strong> {plan.unit || '_____'} &nbsp; <strong>Story:</strong> {plan.story || '_____'}</span>
        <span><strong>Teacher:</strong> {plan.teacher_name || '_____'} &nbsp; <strong>Grade:</strong> {classInfo?.grade || ''}-{classInfo?.section || ''}</span>
        <span><strong>Date:</strong> From {formatDate(weekStart)} To {formatDate(weekEnd)}</span>
      </div>
      
      {/* OBJECTIVE */}
      <div className="objective-box">
        <strong>Objective:</strong> {objective || '_____'}
      </div>
      
      {/* SKILLS */}
      <div className="skills-box">
        <span className="skills-title">Skills:</span>
        <ol className="skills-list">
          {(skills || []).filter(s => s).length > 0 ? (
            skills.filter(s => s).map((skill, i) => (
              <li key={i}>{skill}</li>
            ))
          ) : (
            <>
              <li>_________________________</li>
              <li>_________________________</li>
            </>
          )}
        </ol>
      </div>
      
      {/* MAIN TABLE - CSS GRID CONTAINER */}
      <div className="table-container">
        {/* Table Header */}
        <div className="table-header">
          <div></div>
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
            <div key={day}>
              <div>{DAY_LABELS[day][lang]}</div>
              <div className="eca-line">
                <Chk checked={days[idx]?.eca?.E} />E{' '}
                <Chk checked={days[idx]?.eca?.C} />C{' '}
                <Chk checked={days[idx]?.eca?.A} />A
              </div>
            </div>
          ))}
        </div>
        
        {/* Day Theme Row */}
        <div className="table-row">
          <div className="row-label">Day Theme</div>
          {days.map((day, i) => (
            <div key={i} className="theme-cell">{day.theme || ''}</div>
          ))}
        </div>
        
        {/* DOK Levels Row */}
        <div className="table-row">
          <div className="row-label">Webb Taxonomy Levels</div>
          {days.map((day, i) => (
            <div key={i} className="content-cell">
              <div className="item-row"><Chk checked={day.dok_levels?.includes(1)} /> Lv1: Memory</div>
              <div className="item-row"><Chk checked={day.dok_levels?.includes(2)} /> Lv2: Processing</div>
              <div className="item-row"><Chk checked={day.dok_levels?.includes(3)} /> Lv3: Strategic</div>
              <div className="item-row"><Chk checked={day.dok_levels?.includes(4)} /> Lv4: Extended</div>
            </div>
          ))}
        </div>
        
        {/* Activities Row */}
        <div className="table-row">
          <div className="row-label">Activities</div>
          {days.map((day, i) => (
            <div key={i} className="content-cell">
              {Object.keys(ACTIVITY_LABELS).map(actType => {
                const activity = day.activities?.find(a => a.activity_type === actType);
                return (
                  <div key={actType} className="item-row">
                    <Chk checked={activity?.checked} /> {ACTIVITY_LABELS[actType][lang]}
                    {actType === 'other' && activity?.checked && activity?.notes && (
                      <span>: {activity.notes}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        
        {/* Materials Row */}
        <div className="table-row">
          <div className="row-label">Materials</div>
          {days.map((day, i) => (
            <div key={i} className="content-cell">
              {Object.keys(MATERIAL_LABELS).map(matType => {
                const material = day.materials?.find(m => m.material_type === matType);
                return (
                  <div key={matType} className="item-row">
                    <Chk checked={material?.checked} /> {MATERIAL_LABELS[matType][lang]}
                    {matType === 'other' && material?.checked && material?.notes && (
                      <span>: {material.notes}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Standards Page (Page B)
  const StandardsPage = () => (
    <div className="page standards-page">
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
      <div className="info-row" style={{marginBottom: '10px', fontSize: '9pt'}}>
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

      {/* Standards Grid */}
      <div className="standards-grid">
        <div className="standards-week">
          <div className="standards-title">Standard: First Week</div>
          {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
            const standard = getStandardsForWeek(1).find(s => s.domain === domain);
            return (
              <div key={domain} className="standard-row">
                <Chk checked={standard?.codes?.length > 0} />
                <strong> {STANDARD_LABELS[domain][lang]}</strong>
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
                <strong> {STANDARD_LABELS[domain][lang]}</strong>
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
              {subject === 'mathematics' ? ' Mathematics' :
               subject === 'spanish' ? ' Spanish' :
               subject === 'socialStudies' ? ' Social Studies' :
               subject === 'science' ? ' Science' :
               subject === 'health' ? ' Health' :
               subject === 'art' ? ' Art' :
               subject === 'physicalEducation' ? ' Physical Education' :
               ' Religion'}
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
