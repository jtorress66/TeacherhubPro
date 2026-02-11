import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

const ACTIVITY_LABELS = {
  brainstorming: { en: 'Brain storming', es: 'Lluvia de ideas' },
  buildingBackground: { en: 'Building background', es: 'Construir conocimiento previo' },
  vocabularyDevelopment: { en: 'Vocabulary development', es: 'Desarrollo de vocabulario' },
  readPages: { en: 'Read pages ___ from the book', es: 'Leer páginas ___ del libro' },
  guidedReading: { en: 'Students will do guided and choral reading', es: 'Estudiantes harán lectura guiada y coral' },
  oralQuestions: { en: 'The teacher ask oral questions to demonstrate comprehension', es: 'El maestro hace preguntas orales para demostrar comprensión' },
  comprehensionQuestions: { en: 'Students answer comprehension questions', es: 'Estudiantes responden preguntas de comprensión' },
  exercisePractice: { en: 'Work on an exercise practice', es: 'Trabajar en práctica de ejercicio' },
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

export const PlanPrintView = ({ plan, classInfo, school, onClose }) => {
  const { language } = useLanguage();
  const printRef = useRef();
  const lang = language === 'es' ? 'es' : 'en';

  // Ensure we always have 5 days
  const planDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((dayName, i) => {
    const existingDay = plan.days?.[i];
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
            size: 11in 8.5in; 
            margin: 0.3in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 8pt; 
            line-height: 1.2;
          }
          .page {
            width: 10.4in;
            height: 7.9in;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden;
          }
          .page:last-child { page-break-after: avoid; }
          
          .header {
            text-align: center;
            border-bottom: 2px solid black;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          .header-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          .header img { height: 40px; width: auto; }
          .header .school-name { font-size: 12pt; font-weight: bold; }
          .header .school-info { font-size: 8pt; }
          .header .title { font-size: 14pt; font-weight: bold; margin-top: 5px; }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid black;
            margin-bottom: 6px;
          }
          .info-left { padding: 5px; border-right: 1px solid black; font-size: 9pt; }
          .info-right { padding: 5px; font-size: 9pt; }
          
          .objective-box, .skills-box {
            border: 1px solid black;
            padding: 5px;
            margin-bottom: 6px;
          }
          .section-title {
            font-weight: bold;
            border-bottom: 1px solid black;
            margin-bottom: 3px;
            font-size: 9pt;
          }
          .skills-list { margin-left: 15px; font-size: 8pt; }
          .skills-list li { margin-bottom: 1px; }
          
          .plan-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
            table-layout: fixed;
          }
          .plan-table th, .plan-table td {
            border: 1px solid black;
            padding: 2px 3px;
            vertical-align: top;
          }
          .plan-table th {
            background: #f0f0f0;
            font-size: 8pt;
            text-align: center;
          }
          .plan-table .label-cell {
            width: 12%;
            font-weight: bold;
            font-size: 7pt;
          }
          .plan-table .day-cell { width: 17.6%; }
          
          .eca-row { 
            display: flex; 
            justify-content: center; 
            gap: 4px; 
            margin-top: 2px;
            font-size: 7pt;
          }
          .checkbox {
            display: inline-block;
            width: 8px;
            height: 8px;
            border: 1px solid black;
            vertical-align: middle;
          }
          .checkbox.checked { background: black; }
          
          .activity-item, .material-item, .dok-item {
            margin-bottom: 1px;
            font-size: 6pt;
            line-height: 1.1;
          }
          
          /* Page 2 Styles */
          .standards-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            border: 1px solid black;
            margin-bottom: 10px;
          }
          .standards-week {
            padding: 8px;
          }
          .standards-week:first-child {
            border-right: 1px solid black;
          }
          .week-title {
            font-weight: bold;
            font-size: 10pt;
            border-bottom: 1px solid black;
            margin-bottom: 8px;
            padding-bottom: 3px;
          }
          .standard-item {
            margin-bottom: 5px;
            font-size: 9pt;
          }
          .expectations-box {
            border: 1px solid black;
            padding: 8px;
            margin-top: 10px;
            min-height: 80px;
          }
          
          .integration-section {
            border: 1px solid black;
            padding: 8px;
            margin-top: 12px;
          }
          .integration-section .title { font-weight: bold; font-size: 10pt; margin-bottom: 8px; }
          .integration-items { display: flex; flex-wrap: wrap; gap: 15px; font-size: 9pt; }
          
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
            margin-top: 40px;
          }
          .signature-line {
            border-top: 1px solid black;
            padding-top: 5px;
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
    }, 250);
  };

  const getStandardsForWeek = (weekIndex) => {
    return plan.standards?.filter(s => s.week_index === weekIndex) || [];
  };

  const getExpectationForWeek = (weekIndex) => {
    return plan.expectations?.find(e => e.week_index === weekIndex)?.text || '';
  };

  // Render school header
  const renderHeader = () => (
    <div className="header">
      <div className="header-content">
        {school?.logo_url && (
          <img src={school.logo_url} alt="School Logo" />
        )}
        <div>
          <div className="school-name">{school?.name || 'Colegio De La Inmaculada Concepción'}</div>
          <div className="school-info">{school?.address || 'P.O. Box 3400, Manatí, Puerto Rico 00674'}</div>
          <div className="school-info">{school?.phone ? `Tel. ${school.phone}` : 'Tel. (787) 854-2079 / (787)854-5265'}</div>
          <div className="school-info">{school?.email || 'Cicmanati@outlook.com'}</div>
        </div>
      </div>
      <div className="title">Teacher's Planning</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Toolbar */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="font-heading font-semibold text-lg">
            {language === 'es' ? 'Vista de Impresión' : 'Print Preview'}
          </h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2" data-testid="print-pdf-btn">
              <Printer className="h-4 w-4" />
              {language === 'es' ? 'Imprimir / PDF' : 'Print / PDF'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Print Content - Preview scaled to fit */}
        <div ref={printRef} className="p-4 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
          
          {/* ===== PAGE 1: Daily Plan ===== */}
          <div className="page">
            {renderHeader()}
            
            {/* Info Grid */}
            <div className="info-grid">
              <div className="info-left">
                <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
                <div><strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
                <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div className="info-right">
                <div><strong>Date</strong></div>
                <div>From: {plan.week_start || '_____'} To: {plan.week_end || '_____'}</div>
              </div>
            </div>

            {/* Objective */}
            <div className="objective-box">
              <div className="section-title">Objective of the week:</div>
              <div style={{ fontSize: '8pt' }}>{plan.objective || '_____'}</div>
            </div>

            {/* Skills */}
            <div className="skills-box">
              <div className="section-title">Skills of the week:</div>
              <ol className="skills-list">
                {(plan.skills || []).filter(s => s).map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ol>
            </div>

            {/* Daily Plan Table */}
            <table className="plan-table">
              <thead>
                <tr>
                  <th className="label-cell"></th>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, dayIdx) => (
                    <th key={day} className="day-cell">
                      {DAY_LABELS[day][lang]}
                      <div className="eca-row">
                        {['E', 'C', 'A'].map(eca => (
                          <span key={eca}>
                            {eca}
                            <span 
                              className={`checkbox ${planDays[dayIdx]?.eca?.[eca] ? 'checked' : ''}`}
                              style={{ marginLeft: '1px' }}
                            ></span>
                          </span>
                        ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Day Theme */}
                <tr>
                  <td className="label-cell">Day Theme</td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ textAlign: 'center', fontSize: '7pt' }}>{day.theme || ''}</td>
                  ))}
                </tr>
                
                {/* DOK Levels */}
                <tr>
                  <td className="label-cell" style={{ fontSize: '6pt' }}>Type of Taxonomy: Webb (2005) Levels</td>
                  {planDays.map((day, i) => (
                    <td key={i}>
                      {[1, 2, 3, 4].map(level => (
                        <div key={level} className="dok-item">
                          <span className={`checkbox ${day.dok_levels?.includes(level) ? 'checked' : ''}`}></span>
                          {' '}Level {level}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Activities */}
                <tr>
                  <td className="label-cell">Activities</td>
                  {planDays.map((day, i) => (
                    <td key={i}>
                      {Object.keys(ACTIVITY_LABELS).map(actType => {
                        const activity = day.activities?.find(a => a.activity_type === actType);
                        return (
                          <div key={actType} className="activity-item">
                            <span className={`checkbox ${activity?.checked ? 'checked' : ''}`}></span>
                            {' '}{ACTIVITY_LABELS[actType][lang]}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>

                {/* Materials */}
                <tr>
                  <td className="label-cell">Materials</td>
                  {planDays.map((day, i) => (
                    <td key={i}>
                      {Object.keys(MATERIAL_LABELS).map(matType => {
                        const material = day.materials?.find(m => m.material_type === matType);
                        return (
                          <div key={matType} className="material-item">
                            <span className={`checkbox ${material?.checked ? 'checked' : ''}`}></span>
                            {' '}{MATERIAL_LABELS[matType][lang]}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ===== PAGE 2: Standards ===== */}
          <div className="page" style={{ pageBreakBefore: 'always' }}>
            {renderHeader()}
            
            {/* Unit Info (repeated on page 2) */}
            <div className="info-grid">
              <div className="info-left">
                <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
                <div><strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
                <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div className="info-right">
                <div><strong>Date</strong></div>
                <div>From: {plan.week_start || '_____'} To: {plan.week_end || '_____'}</div>
              </div>
            </div>

            {/* Standards Grid */}
            <div className="standards-grid">
              {/* First Week */}
              <div className="standards-week">
                <div className="week-title">Standard: First Week</div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(1).find(s => s.domain === domain);
                  return (
                    <div key={domain} className="standard-item">
                      <span className={`checkbox ${standard?.codes?.length > 0 ? 'checked' : ''}`}></span>
                      {' '}<strong>{STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="expectations-box">
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '5px' }}>{getExpectationForWeek(1)}</div>
                </div>
              </div>

              {/* Second Week */}
              <div className="standards-week">
                <div className="week-title">Standard: Second Week</div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(2).find(s => s.domain === domain);
                  return (
                    <div key={domain} className="standard-item">
                      <span className={`checkbox ${standard?.codes?.length > 0 ? 'checked' : ''}`}></span>
                      {' '}<strong>{STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div className="expectations-box">
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '5px' }}>{getExpectationForWeek(2)}</div>
                </div>
              </div>
            </div>

            {/* Integration Section */}
            <div className="integration-section">
              <div className="title">Integration with other subjects:</div>
              <div className="integration-items">
                {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
                  <span key={subject}>
                    <span className={`checkbox ${plan.subject_integration?.includes(subject) ? 'checked' : ''}`}></span>
                    {' '}{subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                ))}
              </div>
            </div>

            {/* Signature Section */}
            <div className="signature-section">
              <div className="signature-line">Teacher's Signature / Date</div>
              <div className="signature-line">Principal's Signature / Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
