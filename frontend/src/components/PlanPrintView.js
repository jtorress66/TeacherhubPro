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

// Checkbox component - Compact
const Checkbox = ({ checked }) => (
  <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    border: '1px solid black',
    background: checked ? '#000' : '#fff',
    verticalAlign: 'middle',
    marginRight: '2px',
    position: 'relative'
  }}>
    {checked && <span style={{ position: 'absolute', top: '-2px', left: '0px', fontSize: '7px', color: 'white' }}>✓</span>}
  </span>
);

export const PlanPrintView = ({ plan, classInfo, school: propSchool, onClose }) => {
  const { language } = useLanguage();
  const { school: contextSchool, branding } = useSchool();
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
    return plan.expectations?.find(e => e.week_index === weekIndex)?.text || '';
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
          body { 
            font-family: Arial, sans-serif; 
            font-size: 7pt;
            line-height: 1.1;
          }
          .print-page {
            width: 100%;
            height: 7.5in;
            max-height: 7.5in;
            overflow: hidden;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .print-page:last-child { page-break-after: avoid; }
          .preview-wrapper { display: contents; }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            table-layout: fixed;
            page-break-inside: avoid;
          }
          td, th { 
            border: 1px solid black; 
            padding: 1px 2px; 
            vertical-align: top; 
            word-wrap: break-word;
            overflow: hidden;
            font-size: 7pt;
            line-height: 1.1;
          }
          tr { page-break-inside: avoid; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-page { height: auto; max-height: 7.5in; overflow: hidden; }
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

  // Header - Compact version
  const Header = () => (
    <div style={{ textAlign: 'center', marginBottom: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '2px' }}>
        {school?.logo_url && (
          <img src={school.logo_url} alt="Logo" style={{ height: '35px', objectFit: 'contain' }} />
        )}
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{school?.name || 'My School'}</div>
          <div style={{ fontSize: '7pt' }}>{school?.address || 'School Address'}</div>
          <div style={{ fontSize: '7pt' }}>
            {school?.phone ? `Tel. ${school.phone}` : ''} {school?.email ? `| ${school.email}` : ''}
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '10pt', marginTop: '2px' }}>
        {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
      </div>
    </div>
  );

  // Week Daily Plan Content
  const WeekPageContent = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <>
      <Header />
      
      {/* Info Box */}
      <table style={{ marginBottom: '3px' }}>
        <tbody>
          <tr>
            <td style={{ width: '60%', padding: '2px 4px', fontSize: '7pt' }}>
              <strong>Unit:</strong> {plan.unit || '_____'} | <strong>Story:</strong> {plan.story || '_____'} | <strong>Teacher:</strong> {plan.teacher_name || '_____'} | <strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}
            </td>
            <td style={{ width: '40%', padding: '2px 4px', fontSize: '7pt' }}>
              <strong>Date:</strong> From {formatDate(weekStart)} To {formatDate(weekEnd)}
              {weekNum === 2 && <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>(Week 2)</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Objective */}
      <table style={{ marginBottom: '3px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '2px 4px', fontSize: '7pt' }}>
              <strong>Objective of the week:</strong> {objective || '_____'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Skills */}
      <table style={{ marginBottom: '3px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '2px 4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '7pt', borderBottom: '1px solid black', paddingBottom: '2px', marginBottom: '2px' }}>
                Skills of the week:
              </div>
              <ol style={{ marginLeft: '15px', fontSize: '6.5pt', lineHeight: '1.15' }}>
                {(skills || []).filter(s => s).map((skill, i) => (
                  <li key={i} style={{ marginBottom: '0px' }}>{skill}</li>
                ))}
                {(!skills || skills.filter(s => s).length === 0) && (
                  <>
                    <li>_____</li>
                    <li>_____</li>
                    <li>_____</li>
                    <li>_____</li>
                  </>
                )}
              </ol>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Main Table */}
      <table style={{ fontSize: '6pt' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ width: '11%', padding: '2px', fontSize: '6.5pt' }}></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} style={{ width: '17.8%', textAlign: 'center', padding: '2px', fontSize: '6.5pt' }}>
                <div style={{ fontWeight: 'bold' }}>{DAY_LABELS[day][lang]}</div>
                <div style={{ marginTop: '1px', fontSize: '6pt' }}>
                  E <Checkbox checked={days[idx]?.eca?.E} />
                  {' '}C <Checkbox checked={days[idx]?.eca?.C} />
                  {' '}A <Checkbox checked={days[idx]?.eca?.A} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '2px', fontSize: '6.5pt' }}>Day Theme</td>
            {days.map((day, i) => (
              <td key={i} style={{ textAlign: 'center', padding: '2px', fontSize: '6.5pt' }}>{day.theme || ''}</td>
            ))}
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '2px', fontSize: '5.5pt', lineHeight: '1.1' }}>
              Type of Taxonomy:<br/>Webb (2005) Levels
            </td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '1px', fontSize: '5.5pt', lineHeight: '1.15' }}>
                <Checkbox checked={day.dok_levels?.includes(1)} />Level 1<br/>
                <Checkbox checked={day.dok_levels?.includes(2)} />Level 2<br/>
                <Checkbox checked={day.dok_levels?.includes(3)} />Level 3<br/>
                <Checkbox checked={day.dok_levels?.includes(4)} />Level 4
              </td>
            ))}
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '2px', fontSize: '6.5pt' }}>Activities</td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '1px', fontSize: '5.5pt', lineHeight: '1.1' }}>
                {Object.keys(ACTIVITY_LABELS).map(actType => {
                  const activity = day.activities?.find(a => a.activity_type === actType);
                  return (
                    <div key={actType}>
                      <Checkbox checked={activity?.checked} />{ACTIVITY_LABELS[actType][lang]}
                      {actType === 'other' && activity?.checked && activity?.notes && (
                        <span style={{ fontStyle: 'italic' }}>: {activity.notes}</span>
                      )}
                    </div>
                  );
                })}
              </td>
            ))}
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '2px', fontSize: '6.5pt' }}>Materials</td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '1px', fontSize: '5.5pt', lineHeight: '1.15' }}>
                {Object.keys(MATERIAL_LABELS).map(matType => {
                  const material = day.materials?.find(m => m.material_type === matType);
                  return (
                    <div key={matType}><Checkbox checked={material?.checked} />{MATERIAL_LABELS[matType][lang]}</div>
                  );
                })}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </>
  );

  // Standards Page Content - Compact version
  const StandardsPageContent = () => (
    <>
      <Header />
      
      {/* Unit Info */}
      <table style={{ marginBottom: '4px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', padding: '2px 4px', fontSize: '7pt', lineHeight: '1.2' }}>
              <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
              <div><strong>Story:</strong> {plan.story || '_____'}</div>
              <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
              <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
            </td>
            <td style={{ width: '50%', padding: '2px 4px', fontSize: '7pt', lineHeight: '1.2' }}>
              <div><strong>Date</strong></div>
              <div>From: {formatDate(plan.week_start)} To: {formatDate(plan.week_end)}</div>
              {(plan.week2_start || plan.week2_end) && (
                <div>From: {formatDate(plan.week2_start)} To: {formatDate(plan.week2_end)}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Standards Grid */}
      <table style={{ marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', padding: '4px 6px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', borderBottom: '1px solid black', marginBottom: '3px', paddingBottom: '2px' }}>
                Standard: First Week
              </div>
              {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                const standard = getStandardsForWeek(1).find(s => s.domain === domain);
                return (
                  <div key={domain} style={{ marginBottom: '2px', fontSize: '6.5pt', lineHeight: '1.15' }}>
                    <Checkbox checked={standard?.codes?.length > 0} />
                    {' '}<strong>{STANDARD_LABELS[domain][lang]}</strong>
                    {standard?.codes?.length > 0 && (
                      <span style={{ marginLeft: '4px' }}>{standard.codes.join(', ')}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ border: '1px solid black', padding: '4px', marginTop: '4px', minHeight: '40px' }}>
                <strong style={{ fontSize: '6.5pt' }}>Expectations:</strong>
                <div style={{ marginTop: '2px', fontSize: '6.5pt', lineHeight: '1.15' }}>{getExpectationForWeek(1)}</div>
              </div>
            </td>
            <td style={{ width: '50%', padding: '4px 6px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '8pt', borderBottom: '1px solid black', marginBottom: '3px', paddingBottom: '2px' }}>
                Standard: Second Week
              </div>
              {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                const standard = getStandardsForWeek(2).find(s => s.domain === domain);
                return (
                  <div key={domain} style={{ marginBottom: '2px', fontSize: '6.5pt', lineHeight: '1.15' }}>
                    <Checkbox checked={standard?.codes?.length > 0} />
                    {' '}<strong>{STANDARD_LABELS[domain][lang]}</strong>
                    {standard?.codes?.length > 0 && (
                      <span style={{ marginLeft: '4px' }}>{standard.codes.join(', ')}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ border: '1px solid black', padding: '4px', marginTop: '4px', minHeight: '40px' }}>
                <strong style={{ fontSize: '6.5pt' }}>Expectations:</strong>
                <div style={{ marginTop: '2px', fontSize: '6.5pt', lineHeight: '1.15' }}>{getExpectationForWeek(2)}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Integration */}
      <table style={{ marginBottom: '6px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '4px 6px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '3px', fontSize: '7pt' }}>Integration with other subjects:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '6.5pt' }}>
                {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
                  <span key={subject}>
                    <Checkbox checked={plan.subject_integration?.includes(subject)} />
                    {' '}{subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '6px' }}>
        <div style={{ borderTop: '1px solid black', paddingTop: '5px', width: '40%', textAlign: 'center', fontSize: '9pt' }}>
          Teacher's Signature / Date
        </div>
        <div style={{ borderTop: '1px solid black', paddingTop: '5px', width: '40%', textAlign: 'center', fontSize: '9pt' }}>
          Principal's Signature / Date
        </div>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
        {/* Toolbar */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="font-heading font-semibold text-lg">
            {language === 'es' ? 'Vista de Impresión (Horizontal)' : 'Print Preview (Landscape)'}
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

        {/* Print Content - This is what gets printed */}
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', padding: '20px', background: '#e5e5e5' }}>
          
          {/* Page 1: Week 1 */}
          <div className="preview-wrapper" style={{ background: 'white', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <div className="print-page" style={{ fontSize: '9pt' }}>
              <WeekPageContent 
                days={planDays}
                weekNum={1}
                weekStart={plan.week_start}
                weekEnd={plan.week_end}
                objective={plan.objective}
                skills={plan.skills}
              />
            </div>
          </div>

          {/* Page 2: Week 2 (if exists) */}
          {(plan.week2_start || plan.week2_end) && (
            <div className="preview-wrapper" style={{ background: 'white', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <div className="print-page" style={{ fontSize: '9pt' }}>
                <WeekPageContent 
                  days={planDaysWeek2}
                  weekNum={2}
                  weekStart={plan.week2_start}
                  weekEnd={plan.week2_end}
                  objective={plan.objective_week2 || plan.objective}
                  skills={(plan.skills_week2 && plan.skills_week2.some(s => s)) ? plan.skills_week2 : plan.skills}
                />
              </div>
            </div>
          )}

          {/* Page 3: Standards */}
          <div className="preview-wrapper" style={{ background: 'white', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            <div className="print-page" style={{ fontSize: '9pt' }}>
              <StandardsPageContent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
