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
    /* PORTRAIT LETTER - Matching Reference Images */
    @page {
      size: Letter portrait;
      margin: 0.4in 0.3in;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 8pt;
      line-height: 1.2;
    }
    
    /* Each page */
    .page {
      width: 100%;
      page-break-after: always;
    }
    .page:last-child {
      page-break-after: avoid;
    }
    
    /* HEADER - Compact like reference */
    .header {
      text-align: center;
      margin-bottom: 8px;
    }
    .header img {
      height: 40px;
      margin-bottom: 2px;
    }
    .school-name {
      font-size: 12pt;
      font-weight: bold;
    }
    .school-address {
      font-size: 7pt;
    }
    .school-contact {
      font-size: 7pt;
    }
    
    /* Date line */
    .date-line {
      border-bottom: 1px solid #000;
      padding: 4px 0;
      margin-bottom: 6px;
      font-size: 8pt;
    }
    
    /* Objective box */
    .objective-box {
      border: 1px solid #000;
      padding: 4px 6px;
      margin-bottom: 6px;
      font-size: 8pt;
      min-height: 30px;
    }
    .objective-box strong {
      text-decoration: underline;
    }
    
    /* Skills box */
    .skills-box {
      border: 1px solid #000;
      padding: 4px 6px;
      margin-bottom: 8px;
      font-size: 8pt;
    }
    .skills-box strong {
      text-decoration: underline;
    }
    .skills-box ol {
      margin: 2px 0 0 16px;
      padding: 0;
    }
    .skills-box li {
      margin: 1px 0;
    }
    
    /* MAIN TABLE - Matching reference exactly */
    .main-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      table-layout: fixed;
    }
    .main-table th,
    .main-table td {
      border: 1px solid #000;
      padding: 2px 3px;
      vertical-align: top;
    }
    .main-table th {
      background: #e0e0e0;
      font-weight: bold;
      text-align: center;
      font-size: 8pt;
    }
    
    /* Column widths */
    .col-label { width: 12%; }
    .col-day { width: 17.6%; }
    
    /* Day header with ECA checkboxes */
    .day-header {
      font-weight: bold;
      font-size: 8pt;
    }
    .eca-row {
      font-size: 6pt;
      margin-top: 2px;
    }
    
    /* Row label cell */
    .row-label {
      font-weight: bold;
      font-size: 7pt;
      background: #f5f5f5;
      text-align: left;
      vertical-align: top;
    }
    
    /* Theme cell */
    .theme-cell {
      text-align: center;
      font-weight: bold;
      font-size: 8pt;
      vertical-align: middle;
      min-height: 20px;
    }
    
    /* Checkbox styling - matching reference */
    .chk {
      display: inline-block;
      width: 8px;
      height: 8px;
      border: 1px solid #000;
      margin-right: 2px;
      vertical-align: middle;
      font-size: 6pt;
      text-align: center;
      line-height: 6px;
    }
    .chk.checked::after {
      content: "X";
      font-weight: bold;
    }
    
    /* Item rows in cells */
    .item-row {
      font-size: 6.5pt;
      line-height: 1.3;
      margin-bottom: 1px;
    }
    
    /* ===== STANDARDS PAGE (Page B) ===== */
    .info-grid {
      display: flex;
      justify-content: space-between;
      border: 1px solid #000;
      padding: 6px;
      margin-bottom: 10px;
    }
    .info-left {
      font-size: 9pt;
    }
    .info-right {
      font-size: 9pt;
      text-align: right;
    }
    
    /* Standards two-column layout */
    .standards-container {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }
    .standards-week {
      flex: 1;
      border: 2px solid #000;
      padding: 8px;
    }
    .standards-title {
      font-weight: bold;
      font-size: 10pt;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .standard-item {
      font-size: 9pt;
      margin-bottom: 3px;
    }
    .expectations-box {
      border: 1px solid #000;
      padding: 6px;
      margin-top: 8px;
      min-height: 80px;
      font-size: 9pt;
    }
    .expectations-box strong {
      text-decoration: underline;
    }
    
    /* Integration section */
    .integration-section {
      border: 1px solid #000;
      padding: 8px;
      margin-bottom: 15px;
      font-size: 9pt;
    }
    .integration-items {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 4px;
    }
    
    /* Signatures */
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
      padding-top: 10px;
    }
    .sig-line {
      width: 45%;
      border-top: 1px solid #000;
      padding-top: 6px;
      text-align: center;
      font-size: 9pt;
    }
    
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
    }, 300);
  };

  // Checkbox component matching reference
  const Chk = ({ checked }) => (
    <span className={`chk ${checked ? 'checked' : ''}`} />
  );

  // Weekly Plan Page - Matching "Techers Planner A.jpeg"
  const WeeklyPlanPage = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <div className="page">
      {/* Header */}
      <div className="header">
        {school?.logo_url && <img src={school.logo_url} alt="" />}
        <div className="school-name">{school?.name || 'School Name'}</div>
        <div className="school-address">{school?.address || ''}</div>
        <div className="school-contact">
          {school?.phone && `Tel. ${school.phone}`}
          {school?.email && ` | ${school.email}`}
        </div>
      </div>
      
      {/* Date line */}
      <div className="date-line">
        <strong>Date:</strong> From {formatDate(weekStart)} To {formatDate(weekEnd)}
        {weekNum === 2 && ' (Week 2)'}
      </div>
      
      {/* Objective */}
      <div className="objective-box">
        <strong>Objective of the week:</strong> {objective || ''}
      </div>
      
      {/* Skills */}
      <div className="skills-box">
        <strong>Skills of the week:</strong>
        <ol>
          {(skills || []).filter(s => s).length > 0 ? (
            skills.filter(s => s).map((skill, i) => <li key={i}>{skill}</li>)
          ) : (
            <>
              <li>______________________________________</li>
              <li>______________________________________</li>
              <li>______________________________________</li>
              <li>______________________________________</li>
            </>
          )}
        </ol>
      </div>
      
      {/* Main Table - Matching reference layout */}
      <table className="main-table">
        <thead>
          <tr>
            <th className="col-label"></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} className="col-day">
                <div className="day-header">{DAY_LABELS[day][lang]}</div>
                <div className="eca-row">
                  <Chk checked={days[idx]?.eca?.E} />E{' '}
                  <Chk checked={days[idx]?.eca?.C} />C{' '}
                  <Chk checked={days[idx]?.eca?.A} />A
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Day Theme */}
          <tr>
            <td className="row-label">Day Theme</td>
            {days.map((day, i) => (
              <td key={i} className="theme-cell">{day.theme || ''}</td>
            ))}
          </tr>
          
          {/* Type of Taxonomy */}
          <tr>
            <td className="row-label">
              Type of<br/>Taxonomy:<br/>Webb (2005)<br/>Levels
            </td>
            {days.map((day, i) => (
              <td key={i}>
                <div className="item-row"><Chk checked={day.dok_levels?.includes(1)} /> Level 1: Memory Thought<br/>(Knowledge in or the same way as learned)</div>
                <div className="item-row"><Chk checked={day.dok_levels?.includes(2)} /> Level 2: Processing<br/>(Requires some basic mental reasoning, something beyond memory)</div>
                <div className="item-row"><Chk checked={day.dok_levels?.includes(3)} /> Level 3: Thinking Strategic<br/>(Demonstrate knowledge based on complex and abstract cognitive demand)</div>
                <div className="item-row"><Chk checked={day.dok_levels?.includes(4)} /> Level 4: Thinking Thought Extended<br/>(extends knowledge to broader contexts)</div>
              </td>
            ))}
          </tr>
          
          {/* Activities */}
          <tr>
            <td className="row-label">Activities</td>
            {days.map((day, i) => (
              <td key={i}>
                {Object.keys(ACTIVITY_LABELS).map(actType => {
                  const activity = day.activities?.find(a => a.activity_type === actType);
                  return (
                    <div key={actType} className="item-row">
                      <Chk checked={activity?.checked} /> {ACTIVITY_LABELS[actType][lang]}
                      {actType === 'other' && activity?.checked && activity?.notes && ` ${activity.notes}`}
                    </div>
                  );
                })}
              </td>
            ))}
          </tr>
          
          {/* Materials */}
          <tr>
            <td className="row-label">Materials</td>
            {days.map((day, i) => (
              <td key={i}>
                {Object.keys(MATERIAL_LABELS).map(matType => {
                  const material = day.materials?.find(m => m.material_type === matType);
                  return (
                    <div key={matType} className="item-row">
                      <Chk checked={material?.checked} /> {MATERIAL_LABELS[matType][lang]}
                      {matType === 'other' && material?.checked && material?.notes && ` ${material.notes}`}
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

  // Standards Page - Matching "Teachers Planner B.jpeg"
  const StandardsPage = () => (
    <div className="page">
      {/* Header */}
      <div className="header">
        {school?.logo_url && <img src={school.logo_url} alt="" />}
        <div className="school-name">{school?.name || 'School Name'}</div>
        <div className="school-address">{school?.address || ''}</div>
        <div className="school-contact">
          {school?.phone && `Tel. ${school.phone}`}
          {school?.email && ` | ${school.email}`}
        </div>
        <div style={{fontWeight: 'bold', fontSize: '11pt', marginTop: '4px'}}>Teacher's Planning</div>
      </div>
      
      {/* Info Grid */}
      <div className="info-grid">
        <div className="info-left">
          <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
          <div><strong>Story:</strong> {plan.story || '_____'}</div>
          <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
          <div><strong>Grade:</strong> {classInfo?.grade || ''}-{classInfo?.section || ''}</div>
        </div>
        <div className="info-right">
          <strong>Date</strong><br/>
          From: {formatDate(plan.week_start)} To: {formatDate(plan.week_end)}
          {(plan.week2_start || plan.week2_end) && (
            <><br/>From: {formatDate(plan.week2_start)} To: {formatDate(plan.week2_end)}</>
          )}
        </div>
      </div>

      {/* Standards - Two Column Layout */}
      <div className="standards-container">
        <div className="standards-week">
          <div className="standards-title">Standard: First Week</div>
          {[
            { key: 'listeningAndSpeaking', label: 'Listening/Speaking' },
            { key: 'foundationalSkills', label: 'Foundational Skills' },
            { key: 'reading', label: 'Reading' },
            { key: 'writing', label: 'Writing' },
            { key: 'language', label: 'Language' }
          ].map(({ key, label }) => {
            const standard = getStandardsForWeek(1).find(s => s.domain === key);
            return (
              <div key={key} className="standard-item">
                <Chk checked={standard?.codes?.length > 0} />
                <strong> {label}</strong>
                {standard?.codes?.length > 0 && ` ${standard.codes.join(', ')}`}
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
          {[
            { key: 'listeningAndSpeaking', label: 'Listening/Speaking' },
            { key: 'foundationalSkills', label: 'Foundational Skills' },
            { key: 'reading', label: 'Reading' },
            { key: 'writing', label: 'Writing' },
            { key: 'language', label: 'Language' }
          ].map(({ key, label }) => {
            const standard = getStandardsForWeek(2).find(s => s.domain === key);
            return (
              <div key={key} className="standard-item">
                <Chk checked={standard?.codes?.length > 0} />
                <strong> {label}</strong>
                {standard?.codes?.length > 0 && ` ${standard.codes.join(', ')}`}
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
        <div className="integration-items">
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
            <span key={key}>
              <Chk checked={plan.subject_integration?.includes(key)} /> {label}
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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-auto">
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

        <div className="p-4 bg-slate-200">
          <div ref={printRef}>
            {/* Week 1 Page */}
            <div className="bg-white shadow mb-4 mx-auto p-4" style={{ width: '8.5in', minHeight: '11in' }}>
              <WeeklyPlanPage
                days={planDays}
                weekNum={1}
                weekStart={plan.week_start}
                weekEnd={plan.week_end}
                objective={plan.objective}
                skills={plan.skills}
              />
            </div>

            {/* Week 2 Page (if exists) */}
            {(plan.week2_start || plan.week2_end) && (
              <div className="bg-white shadow mb-4 mx-auto p-4" style={{ width: '8.5in', minHeight: '11in' }}>
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

            {/* Standards Page */}
            <div className="bg-white shadow mx-auto p-4" style={{ width: '8.5in', minHeight: '11in' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
