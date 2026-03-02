import { useRef, useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

const ACTIVITY_LABELS = {
  brainstorming: { en: 'Brainstorming', es: 'Lluvia de ideas' },
  buildingBackground: { en: 'Building background', es: 'Conocimiento previo' },
  vocabularyDevelopment: { en: 'Vocabulary development', es: 'Vocabulario' },
  readPages: { en: 'Read pages', es: 'Leer páginas' },
  guidedReading: { en: 'Guided reading', es: 'Lectura guiada' },
  oralQuestions: { en: 'Oral comprehension Qs', es: 'Preguntas orales' },
  comprehensionQuestions: { en: 'Comprehension Qs', es: 'Preguntas comp.' },
  exercisePractice: { en: 'Exercise practice', es: 'Práctica' },
  other: { en: 'Other', es: 'Otro' }
};

const MATERIAL_LABELS = {
  book: { en: 'Book', es: 'Libro' },
  notebook: { en: 'Notebook', es: 'Cuaderno' },
  teachersGuide: { en: "Teacher's Guide", es: 'Guía del Maestro' },
  testQuiz: { en: 'Test/Quiz', es: 'Prueba' },
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
  const page1Ref = useRef();
  const page2Ref = useRef();
  const [page1TightLevel, setPage1TightLevel] = useState(0);
  const [page2TightLevel, setPage2TightLevel] = useState(0);
  const lang = language === 'es' ? 'es' : 'en';
  const school = propSchool || contextSchool;

  // Escalating overflow detection - keeps tightening until content fits
  const fitPages = useCallback(() => {
    // Check page 1
    if (page1Ref.current) {
      const page = page1Ref.current;
      const overflow = page.scrollHeight - page.clientHeight;
      console.log('Page 1 overflow px:', overflow, 'current level:', page1TightLevel);
      
      if (overflow > 5 && page1TightLevel < 3) {
        setPage1TightLevel(prev => prev + 1);
      }
    }
    
    // Check page 2
    if (page2Ref.current) {
      const page = page2Ref.current;
      const overflow = page.scrollHeight - page.clientHeight;
      console.log('Page 2 overflow px:', overflow, 'current level:', page2TightLevel);
      
      if (overflow > 5 && page2TightLevel < 3) {
        setPage2TightLevel(prev => prev + 1);
      }
    }
  }, [page1TightLevel, page2TightLevel]);

  // Run overflow detection multiple times to escalate if needed
  useEffect(() => {
    const timers = [
      setTimeout(fitPages, 50),
      setTimeout(fitPages, 150),
      setTimeout(fitPages, 300),
      setTimeout(fitPages, 500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [fitPages, page1TightLevel, page2TightLevel]);

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

  // Get tight class based on level
  const getTightClass = (level) => {
    if (level >= 3) return 'tight tight2 tight3';
    if (level >= 2) return 'tight tight2';
    if (level >= 1) return 'tight';
    return '';
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
          /* RESET */
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          /* TRUE US LETTER LANDSCAPE */
          @page { 
            size: letter landscape;
            margin: 0.5in;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.3;
          }
          
          /* FIXED PAGE CONTAINER - calc(11in - 1in) x calc(8.5in - 1in) */
          .print-page {
            width: 10in;
            height: 7.5in;
            overflow: hidden;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .print-page:last-child {
            page-break-after: avoid;
          }
          .print-page * {
            box-sizing: border-box;
          }
          
          /* HEADER */
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .header img { height: 30px; }
          .school-name { font-size: 12pt; font-weight: bold; }
          .school-info { font-size: 7pt; color: #333; }
          .plan-title { font-size: 11pt; font-weight: bold; margin-top: 2px; }
          
          /* INFO ROW */
          .info-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #999;
            padding: 4px 0;
            margin-bottom: 6px;
            font-size: 9pt;
          }
          
          /* OBJECTIVE & SKILLS BOXES */
          .objective-box, .skills-box {
            border: 1px solid #000;
            padding: 4px 6px;
            margin-bottom: 6px;
            font-size: 9pt;
            line-height: 1.3;
          }
          .skills-box ol {
            margin: 0 0 0 16px;
            padding: 0;
          }
          .skills-box li {
            margin: 0;
            padding: 0;
          }
          
          /* TABLE */
          table.main-table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            font-size: 8pt;
          }
          table.main-table th,
          table.main-table td {
            border: 1px solid #000;
            padding: 4px;
            vertical-align: top;
          }
          table.main-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
            font-size: 9pt;
          }
          table.main-table tr {
            page-break-inside: avoid;
          }
          
          .row-label {
            width: 9%;
            font-weight: bold;
            font-size: 7pt;
            background: #f5f5f5;
          }
          .day-col { width: 18.2%; }
          .theme-cell {
            text-align: center;
            font-weight: bold;
            font-size: 9pt;
          }
          
          .chk {
            display: inline-block;
            width: 8px;
            height: 8px;
            border: 1px solid #000;
            margin-right: 3px;
            vertical-align: middle;
          }
          .chk.checked { background: #000; }
          
          .item-row {
            font-size: 8pt;
            line-height: 1.4;
            margin-bottom: 2px;
          }
          .eca-line { font-size: 7pt; margin-top: 2px; }
          
          /* =============================================
             TIGHT MODE LEVEL 1 - Moderate compression
             ============================================= */
          .print-page.tight .header {
            padding-bottom: 2px;
            margin-bottom: 4px;
          }
          .print-page.tight .header img { height: 26px; }
          .print-page.tight .school-name { font-size: 11pt; }
          .print-page.tight .plan-title { font-size: 10pt; margin-top: 1px; }
          
          .print-page.tight .info-row {
            padding: 2px 0;
            margin-bottom: 4px;
            font-size: 8pt;
          }
          
          .print-page.tight .objective-box,
          .print-page.tight .skills-box {
            padding: 3px 5px;
            margin-bottom: 4px;
            font-size: 8pt;
            line-height: 1.2;
          }
          .print-page.tight .skills-box ol {
            margin-left: 14px;
          }
          
          .print-page.tight table.main-table th,
          .print-page.tight table.main-table td {
            padding: 3px;
          }
          .print-page.tight table.main-table th { font-size: 8pt; }
          .print-page.tight .item-row {
            font-size: 7.5pt;
            line-height: 1.3;
            margin-bottom: 1px;
          }
          .print-page.tight .theme-cell { font-size: 8pt; }
          .print-page.tight .row-label { font-size: 6.5pt; }
          .print-page.tight .eca-line { font-size: 6pt; margin-top: 1px; }
          
          /* =============================================
             TIGHT MODE LEVEL 2 - Strong compression
             ============================================= */
          .print-page.tight2 .header {
            padding-bottom: 1px;
            margin-bottom: 3px;
          }
          .print-page.tight2 .header img { height: 22px; }
          .print-page.tight2 .school-name { font-size: 10pt; }
          .print-page.tight2 .school-info { font-size: 6pt; }
          .print-page.tight2 .plan-title { font-size: 9pt; margin-top: 0; }
          
          .print-page.tight2 .info-row {
            padding: 1px 0;
            margin-bottom: 3px;
            font-size: 7.5pt;
          }
          
          .print-page.tight2 .objective-box,
          .print-page.tight2 .skills-box {
            padding: 2px 4px;
            margin-bottom: 3px;
            font-size: 7.5pt;
            line-height: 1.15;
          }
          .print-page.tight2 .skills-box ol {
            margin-left: 12px;
          }
          .print-page.tight2 .skills-box li {
            line-height: 1.15;
          }
          
          .print-page.tight2 table.main-table th,
          .print-page.tight2 table.main-table td {
            padding: 2px;
          }
          .print-page.tight2 table.main-table th { font-size: 7.5pt; }
          .print-page.tight2 .item-row {
            font-size: 7pt;
            line-height: 1.2;
            margin-bottom: 0;
          }
          .print-page.tight2 .theme-cell { font-size: 7.5pt; }
          .print-page.tight2 .row-label { font-size: 6pt; }
          .print-page.tight2 .eca-line { font-size: 5.5pt; margin-top: 0; }
          .print-page.tight2 .chk { width: 7px; height: 7px; margin-right: 2px; }
          
          /* =============================================
             TIGHT MODE LEVEL 3 - Maximum compression
             ============================================= */
          .print-page.tight3 .header {
            padding-bottom: 0;
            margin-bottom: 2px;
            border-bottom-width: 1px;
          }
          .print-page.tight3 .header img { height: 18px; }
          .print-page.tight3 .school-name { font-size: 9pt; }
          .print-page.tight3 .school-info { font-size: 5.5pt; }
          .print-page.tight3 .plan-title { font-size: 8pt; margin-top: 0; }
          
          .print-page.tight3 .info-row {
            padding: 1px 0;
            margin-bottom: 2px;
            font-size: 7pt;
          }
          
          .print-page.tight3 .objective-box,
          .print-page.tight3 .skills-box {
            padding: 1px 3px;
            margin-bottom: 2px;
            font-size: 7pt;
            line-height: 1.1;
          }
          .print-page.tight3 .skills-box ol {
            margin-left: 10px;
          }
          .print-page.tight3 .skills-box li {
            line-height: 1.1;
          }
          
          .print-page.tight3 table.main-table th,
          .print-page.tight3 table.main-table td {
            padding: 1px 2px;
            line-height: 1.1;
          }
          .print-page.tight3 table.main-table th { font-size: 7pt; }
          .print-page.tight3 .item-row {
            font-size: 6.5pt;
            line-height: 1.1;
            margin-bottom: 0;
          }
          .print-page.tight3 .theme-cell { font-size: 7pt; line-height: 1.1; }
          .print-page.tight3 .row-label { font-size: 5.5pt; }
          .print-page.tight3 .eca-line { font-size: 5pt; margin-top: 0; }
          .print-page.tight3 .chk { width: 6px; height: 6px; margin-right: 1px; }
          
          /* STANDARDS PAGE */
          .standards-grid {
            display: flex;
            gap: 20px;
            margin: 10px 0;
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
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .standard-row {
            font-size: 10pt;
            margin-bottom: 4px;
          }
          .expectations-box {
            border: 1px solid #000;
            padding: 8px;
            margin-top: 10px;
            min-height: 70px;
            font-size: 10pt;
          }
          .integration-section {
            border: 1px solid #000;
            padding: 10px;
            margin: 10px 0;
            font-size: 10pt;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
          }
          .sig-line {
            width: 40%;
            border-top: 1px solid #000;
            padding-top: 8px;
            text-align: center;
            font-size: 10pt;
          }
          
          @media print {
            html, body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact;
              margin: 0 !important;
              padding: 0 !important;
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

  // Weekly Plan Page
  const WeeklyPlanPage = ({ days, weekNum, weekStart, weekEnd, objective, skills, tightLevel, pageRef }) => {
    const tightClass = getTightClass(tightLevel);
    
    return (
      <div className={`print-page ${tightClass}`} ref={pageRef}>
        {/* Header */}
        <div className="header">
          {school?.logo_url && <img src={school.logo_url} alt="Logo" />}
          <div className="school-name">{school?.name || 'School Name'}</div>
          <div className="school-info">
            {school?.address && <span>{school.address}</span>}
            {school?.phone && <span> | Tel. {school.phone}</span>}
            {school?.email && <span> | {school.email}</span>}
          </div>
          <div className="plan-title">
            {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
            {weekNum === 2 && ' (Week 2)'}
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
          <strong style={{textDecoration: 'underline'}}>Objective:</strong> {objective || '_____'}
        </div>
        
        {/* Skills */}
        <div className="skills-box">
          <strong style={{textDecoration: 'underline'}}>Skills:</strong>
          <ol>
            {(skills || []).filter(s => s).length > 0 ? (
              skills.filter(s => s).map((skill, i) => <li key={i}>{skill}</li>)
            ) : (
              <>
                <li>_________________________</li>
                <li>_________________________</li>
              </>
            )}
          </ol>
        </div>
        
        {/* Main Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th className="row-label"></th>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
                <th key={day} className="day-col">
                  {DAY_LABELS[day][lang]}
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
                <td key={i} className="theme-cell">{day.theme || ''}</td>
              ))}
            </tr>
            
            {/* DOK Levels Row */}
            <tr>
              <td className="row-label">Webb Taxonomy Levels</td>
              {days.map((day, i) => (
                <td key={i}>
                  <div className="item-row"><Chk checked={day.dok_levels?.includes(1)} /> Level 1: Memory</div>
                  <div className="item-row"><Chk checked={day.dok_levels?.includes(2)} /> Level 2: Processing</div>
                  <div className="item-row"><Chk checked={day.dok_levels?.includes(3)} /> Level 3: Strategic</div>
                  <div className="item-row"><Chk checked={day.dok_levels?.includes(4)} /> Level 4: Extended</div>
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
                        {actType === 'other' && activity?.checked && activity?.notes && `: ${activity.notes}`}
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
                        {matType === 'other' && material?.checked && material?.notes && `: ${material.notes}`}
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
  };

  // Standards Page
  const StandardsPage = () => (
    <div className="print-page">
      {/* Header */}
      <div className="header">
        {school?.logo_url && <img src={school.logo_url} alt="Logo" />}
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
                {standard?.codes?.length > 0 && <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>}
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
                {standard?.codes?.length > 0 && <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>}
              </div>
            );
          })}
          <div className="expectations-box">
            <strong>Expectations:</strong>
            <div style={{marginTop: '4px'}}>{getExpectationForWeek(2)}</div>
          </div>
        </div>
      </div>

      {/* Integration */}
      <div className="integration-section">
        <strong>Integration with other subjects:</strong>
        <div style={{marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
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
        <div className="sig-line">Teacher's Signature / Date</div>
        <div className="sig-line">Principal's Signature / Date</div>
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
            {page1TightLevel > 0 && <span className="text-xs ml-2 text-orange-600">(Page 1: tight level {page1TightLevel})</span>}
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
          <div ref={printRef}>
            {/* Page 1: Week 1 */}
            <div className="bg-white shadow-lg mb-6 mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.5in', overflow: 'hidden' }}>
              <WeeklyPlanPage
                days={planDays}
                weekNum={1}
                weekStart={plan.week_start}
                weekEnd={plan.week_end}
                objective={plan.objective}
                skills={plan.skills}
                tightLevel={page1TightLevel}
                pageRef={page1Ref}
              />
            </div>

            {/* Page 2: Week 2 (if exists) */}
            {(plan.week2_start || plan.week2_end) && (
              <div className="bg-white shadow-lg mb-6 mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.5in', overflow: 'hidden' }}>
                <WeeklyPlanPage
                  days={planDaysWeek2}
                  weekNum={2}
                  weekStart={plan.week2_start}
                  weekEnd={plan.week2_end}
                  objective={plan.objective_week2}
                  skills={plan.skills_week2}
                  tightLevel={page2TightLevel}
                  pageRef={page2Ref}
                />
              </div>
            )}

            {/* Standards Page */}
            <div className="bg-white shadow-lg mx-auto" style={{ width: '11in', height: '8.5in', padding: '0.5in', overflow: 'hidden' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
