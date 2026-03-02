import { useRef, useEffect, useState } from 'react';
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

// Generate print-ready CSS - this is critical for matching the reference
const generatePrintStyles = () => `
  /* CRITICAL: Letter Portrait - 8.5 x 11 inches */
  @page {
    size: 8.5in 11in;
    margin: 0.3in;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: Arial, sans-serif;
    font-size: 6pt;
    line-height: 1.15;
    color: #000;
  }
  
  .print-page {
    width: 7.9in;
    min-height: 10.4in;
    max-height: 10.4in;
    overflow: hidden;
    page-break-after: always;
    padding: 0;
  }
  .print-page:last-child {
    page-break-after: avoid;
  }
  
  /* === HEADER === */
  .print-header {
    text-align: center;
    margin-bottom: 4pt;
    padding-bottom: 2pt;
    border-bottom: 1px solid #000;
  }
  .print-header img {
    height: 32px;
    margin-bottom: 2px;
  }
  .school-name {
    font-size: 10pt;
    font-weight: bold;
    margin: 0;
  }
  .school-info {
    font-size: 6pt;
    margin: 1px 0;
  }
  
  /* === DATE LINE === */
  .date-line {
    font-size: 7pt;
    padding: 2pt 0;
    border-bottom: 1px solid #000;
    margin-bottom: 4pt;
  }
  
  /* === OBJECTIVE BOX === */
  .objective-box {
    border: 1px solid #000;
    padding: 2pt 4pt;
    margin-bottom: 4pt;
    font-size: 6.5pt;
    min-height: 18pt;
  }
  .objective-box b {
    text-decoration: underline;
  }
  
  /* === SKILLS BOX === */
  .skills-box {
    border: 1px solid #000;
    padding: 2pt 4pt;
    margin-bottom: 4pt;
    font-size: 6.5pt;
  }
  .skills-box b {
    text-decoration: underline;
  }
  .skills-box ol {
    margin: 1pt 0 0 12pt;
    padding: 0;
  }
  .skills-box li {
    margin: 0;
    line-height: 1.2;
  }
  
  /* === MAIN TABLE - CRITICAL SECTION === */
  .plan-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 5.5pt;
  }
  
  .plan-table th,
  .plan-table td {
    border: 1px solid #000;
    padding: 1pt 2pt;
    vertical-align: top;
    text-align: left;
  }
  
  .plan-table th {
    background-color: #e8e8e8;
    font-weight: bold;
    text-align: center;
    font-size: 6pt;
  }
  
  /* Column widths: Label column + 5 day columns */
  .col-label {
    width: 11%;
  }
  .col-day {
    width: 17.8%;
  }
  
  /* Day header cell */
  .day-header {
    font-weight: bold;
    font-size: 6.5pt;
  }
  .eca-line {
    font-size: 5pt;
    margin-top: 1pt;
  }
  
  /* Row label styling */
  .row-label {
    background-color: #f5f5f5;
    font-weight: bold;
    font-size: 5.5pt;
    vertical-align: top;
  }
  
  /* Theme row - centered, bold */
  .theme-cell {
    text-align: center;
    font-weight: bold;
    font-size: 6.5pt;
    vertical-align: middle;
  }
  
  /* Checkbox styling - matching reference exactly */
  .chk {
    display: inline-block;
    width: 6pt;
    height: 6pt;
    border: 0.5pt solid #000;
    margin-right: 1pt;
    vertical-align: middle;
    text-align: center;
    line-height: 5pt;
    font-size: 4pt;
    font-weight: bold;
  }
  .chk.x::after {
    content: "X";
  }
  
  /* Content items in table cells */
  .item {
    font-size: 5.5pt;
    line-height: 1.15;
    margin-bottom: 0.5pt;
    display: block;
  }
  
  /* DOK/Taxonomy items - slightly smaller */
  .dok-item {
    font-size: 5pt;
    line-height: 1.1;
    margin-bottom: 0.5pt;
  }
  
  /* === STANDARDS PAGE (Page 2) === */
  .page-title {
    font-size: 11pt;
    font-weight: bold;
    text-align: center;
    margin: 6pt 0;
  }
  
  .info-grid {
    display: flex;
    justify-content: space-between;
    border: 1px solid #000;
    padding: 4pt;
    margin-bottom: 8pt;
    font-size: 7pt;
  }
  
  .standards-row {
    display: flex;
    gap: 8pt;
    margin-bottom: 8pt;
  }
  
  .standard-col {
    flex: 1;
    border: 2px solid #000;
    padding: 4pt;
  }
  
  .standard-title {
    font-weight: bold;
    font-size: 8pt;
    border-bottom: 2px solid #000;
    padding-bottom: 3pt;
    margin-bottom: 4pt;
  }
  
  .standard-item {
    font-size: 7pt;
    margin-bottom: 2pt;
  }
  
  .expectations-box {
    border: 1px solid #000;
    padding: 4pt;
    margin-top: 6pt;
    min-height: 50pt;
    font-size: 7pt;
  }
  .expectations-box b {
    text-decoration: underline;
  }
  
  .integration-section {
    border: 1px solid #000;
    padding: 6pt;
    margin-bottom: 10pt;
    font-size: 7pt;
  }
  .integration-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8pt;
    margin-top: 3pt;
  }
  
  .signatures {
    display: flex;
    justify-content: space-between;
    margin-top: 20pt;
  }
  .sig-line {
    width: 45%;
    border-top: 1px solid #000;
    padding-top: 4pt;
    text-align: center;
    font-size: 7pt;
  }
  
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
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

  const getStandardsForWeek = (weekIndex) => {
    return plan.standards?.filter(s => s.week_index === weekIndex) || [];
  };

  const getExpectationForWeek = (weekIndex) => {
    return plan.expectations?.find(e => e.week_index === weekIndex)?.content || 
           plan.expectations?.find(e => e.week_index === weekIndex)?.text || '';
  };

  // Checkbox component - renders as proper checkbox
  const Chk = ({ checked }) => (
    <span className={`chk ${checked ? 'x' : ''}`} />
  );

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Lesson Plan - ${plan.unit || 'Plan'}</title>
  <style>${generatePrintStyles()}</style>
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

  // Weekly Plan Page - matches reference "Teachers Planner A.jpeg"
  const WeeklyPlanPage = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <div className="print-page">
      {/* Header */}
      <div className="print-header">
        {school?.logo_url && <img src={school.logo_url} alt="" />}
        <div className="school-name">{school?.name || 'School Name'}</div>
        {school?.address && <div className="school-info">{school.address}</div>}
        <div className="school-info">
          {school?.phone && `Tel. ${school.phone}`}
          {school?.email && ` | ${school.email}`}
        </div>
      </div>
      
      {/* Date Line */}
      <div className="date-line">
        <b>Date:</b> From {formatDate(weekStart)} To {formatDate(weekEnd)}
        {weekNum === 2 && ' (Week 2)'}
      </div>
      
      {/* Objective */}
      <div className="objective-box">
        <b>Objective of the week:</b> {objective || '______________________________________________________'}
      </div>
      
      {/* Skills */}
      <div className="skills-box">
        <b>Skills of the week:</b>
        <ol>
          {(skills && skills.filter(s => s).length > 0) ? (
            skills.filter(s => s).slice(0, 4).map((skill, i) => <li key={i}>{skill}</li>)
          ) : (
            <>
              <li>_____________________________________________</li>
              <li>_____________________________________________</li>
              <li>_____________________________________________</li>
              <li>_____________________________________________</li>
            </>
          )}
        </ol>
      </div>
      
      {/* Main Weekly Table */}
      <table className="plan-table">
        <thead>
          <tr>
            <th className="col-label"></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} className="col-day">
                <div className="day-header">{DAY_LABELS[day][lang]}</div>
                <div className="eca-line">
                  <Chk checked={days[idx]?.eca?.E} />E&nbsp;
                  <Chk checked={days[idx]?.eca?.C} />C&nbsp;
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
          
          {/* Type of Taxonomy / Webb Levels Row */}
          <tr>
            <td className="row-label">
              Type of<br/>Taxonomy:<br/>Webb (2005)<br/>Levels
            </td>
            {days.map((day, i) => (
              <td key={i}>
                <span className="dok-item"><Chk checked={day.dok_levels?.includes(1)} /> Level 1: Memory Thought<br/>(Knowledge in or the same way as learned)</span>
                <span className="dok-item"><Chk checked={day.dok_levels?.includes(2)} /> Level 2: Processing<br/>(Requires some basic mental reasoning, something beyond memory)</span>
                <span className="dok-item"><Chk checked={day.dok_levels?.includes(3)} /> Level 3: Thinking Strategic<br/>(Demonstrate knowledge based on complex and abstract cognitive demand)</span>
                <span className="dok-item"><Chk checked={day.dok_levels?.includes(4)} /> Level 4: Thinking Thought Extended<br/>(extends knowledge to broader contexts)</span>
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
                    <span key={actType} className="item">
                      <Chk checked={activity?.checked} /> {ACTIVITY_LABELS[actType][lang]}
                      {actType === 'other' && activity?.checked && activity?.notes && ` ${activity.notes}`}
                    </span>
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
                    <span key={matType} className="item">
                      <Chk checked={material?.checked} /> {MATERIAL_LABELS[matType][lang]}
                      {matType === 'other' && material?.checked && material?.notes && ` ${material.notes}`}
                    </span>
                  );
                })}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Standards Page - matches reference "Teachers Planner B.jpeg"
  const StandardsPage = () => (
    <div className="print-page">
      {/* Header */}
      <div className="print-header">
        {school?.logo_url && <img src={school.logo_url} alt="" />}
        <div className="school-name">{school?.name || 'School Name'}</div>
        {school?.address && <div className="school-info">{school.address}</div>}
        <div className="school-info">
          {school?.phone && `Tel. ${school.phone}`}
          {school?.email && ` | ${school.email}`}
        </div>
      </div>
      
      <div className="page-title">Teacher's Planning</div>
      
      {/* Info Grid */}
      <div className="info-grid">
        <div>
          <div><b>Unit:</b> {plan.unit || '_____'}</div>
          <div><b>Story:</b> {plan.story || '_____'}</div>
          <div><b>Teacher:</b> {plan.teacher_name || '_____'}</div>
          <div><b>Grade:</b> {classInfo?.grade || ''}-{classInfo?.section || ''}</div>
        </div>
        <div style={{textAlign: 'right'}}>
          <b>Date</b><br/>
          From: {formatDate(plan.week_start)} To: {formatDate(plan.week_end)}
          {(plan.week2_start || plan.week2_end) && (
            <><br/>From: {formatDate(plan.week2_start)} To: {formatDate(plan.week2_end)}</>
          )}
        </div>
      </div>

      {/* Standards - Two Column */}
      <div className="standards-row">
        <div className="standard-col">
          <div className="standard-title">Standard: First Week</div>
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
                <b> {label}</b>
                {standard?.codes?.length > 0 && ` ${standard.codes.join(', ')}`}
              </div>
            );
          })}
          <div className="expectations-box">
            <b>Expectations:</b>
            <div style={{marginTop: '3pt'}}>{getExpectationForWeek(1)}</div>
          </div>
        </div>
        
        <div className="standard-col">
          <div className="standard-title">Standard: Second Week</div>
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
                <b> {label}</b>
                {standard?.codes?.length > 0 && ` ${standard.codes.join(', ')}`}
              </div>
            );
          })}
          <div className="expectations-box">
            <b>Expectations:</b>
            <div style={{marginTop: '3pt'}}>{getExpectationForWeek(2)}</div>
          </div>
        </div>
      </div>

      {/* Integration */}
      <div className="integration-section">
        <b>Integration with other subjects:</b>
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="print-preview-modal">
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
            <Button variant="outline" onClick={onClose} data-testid="close-preview-btn">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview container - styled to show pages */}
        <div className="p-4 bg-slate-200">
          <div ref={printRef}>
            {/* Week 1 */}
            <div className="bg-white shadow mb-4 mx-auto" style={{ width: '8.5in', height: '11in', padding: '0.3in', overflow: 'hidden' }}>
              <WeeklyPlanPage
                days={planDays}
                weekNum={1}
                weekStart={plan.week_start}
                weekEnd={plan.week_end}
                objective={plan.objective}
                skills={plan.skills}
              />
            </div>

            {/* Week 2 (if exists) */}
            {(plan.week2_start || plan.week2_end) && (
              <div className="bg-white shadow mb-4 mx-auto" style={{ width: '8.5in', height: '11in', padding: '0.3in', overflow: 'hidden' }}>
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
            <div className="bg-white shadow mx-auto" style={{ width: '8.5in', height: '11in', padding: '0.3in', overflow: 'hidden' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
