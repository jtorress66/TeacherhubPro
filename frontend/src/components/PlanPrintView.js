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

// Checkbox component matching paper format
const Checkbox = ({ checked }) => (
  <span style={{
    display: 'inline-block',
    width: '10px',
    height: '10px',
    border: '1px solid black',
    background: checked ? '#000' : '#fff',
    verticalAlign: 'middle',
    marginRight: '3px',
    position: 'relative'
  }}>
    {checked && <span style={{ position: 'absolute', top: '-1px', left: '1px', fontSize: '9px', color: 'white' }}>✓</span>}
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
            size: landscape;
            margin: 0.25in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 9pt;
          }
          .print-page {
            width: 100%;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .print-page:last-child { page-break-after: avoid; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid black; padding: 3px 4px; vertical-align: top; }
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

  // Header matching the reference exactly
  const Header = () => (
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '5px' }}>
        {school?.logo_url && (
          <img src={school.logo_url} alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
        )}
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '14pt' }}>{school?.name || 'Colegio De La Inmaculada Concepción'}</div>
          <div style={{ fontSize: '9pt' }}>{school?.address || 'P.O. Box 3400, Manatí, Puerto Rico 00674'}</div>
          <div style={{ fontSize: '9pt' }}>
            Tel. {school?.phone || '(787) 854-2079'} / {school?.phone || '(787)854-5265'} | {school?.email || 'Cicmanati@outlook.com'}
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '14pt', marginTop: '8px' }}>
        {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
      </div>
    </div>
  );

  // Week Daily Plan Page - matching reference layout exactly
  const renderWeekPage = (days, weekNum, weekStart, weekEnd, objective, skills) => (
    <div className="print-page" style={{ fontSize: '9pt' }}>
      <Header />
      
      {/* Info Box - Two columns like reference */}
      <table style={{ marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ width: '60%', padding: '6px 10px', fontSize: '10pt' }}>
              <strong>Unit:</strong> {plan.unit || '_____'} | <strong>Story:</strong> {plan.story || '_____'}<br/>
              <strong>Teacher:</strong> {plan.teacher_name || '_____'} | <strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}
            </td>
            <td style={{ width: '40%', padding: '6px 10px', fontSize: '10pt' }}>
              <strong>Date:</strong> From {weekStart || '_____'} To {weekEnd || '_____'}
              {weekNum === 2 && <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>(Week 2)</span>}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Objective */}
      <table style={{ marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 10px', fontSize: '10pt' }}>
              <strong>Objective of the week:</strong> {objective || '_____'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Skills */}
      <table style={{ marginBottom: '8px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '6px 10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '6px' }}>
                Skills of the week:
              </div>
              <ol style={{ marginLeft: '20px', fontSize: '9pt' }}>
                {(skills || []).filter(s => s).map((skill, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{skill}</li>
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

      {/* Main Daily Table - Full width like reference */}
      <table style={{ fontSize: '8pt' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ width: '12%', padding: '6px', fontSize: '9pt' }}></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} style={{ width: '17.6%', textAlign: 'center', padding: '6px', fontSize: '9pt' }}>
                <div style={{ fontWeight: 'bold' }}>{DAY_LABELS[day][lang]}</div>
                <div style={{ marginTop: '4px', fontSize: '9pt' }}>
                  E <Checkbox checked={days[idx]?.eca?.E} />
                  {'  '}C <Checkbox checked={days[idx]?.eca?.C} />
                  {'  '}A <Checkbox checked={days[idx]?.eca?.A} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Day Theme */}
          <tr>
            <td style={{ fontWeight: 'bold', padding: '5px', fontSize: '9pt' }}>Day Theme</td>
            {days.map((day, i) => (
              <td key={i} style={{ textAlign: 'center', padding: '5px', fontSize: '9pt' }}>{day.theme || ''}</td>
            ))}
          </tr>
          
          {/* DOK Levels */}
          <tr>
            <td style={{ fontWeight: 'bold', padding: '5px', fontSize: '8pt' }}>
              Type of Taxonomy:<br/>Webb (2005) Levels
            </td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '4px', fontSize: '8pt', lineHeight: '1.4' }}>
                <Checkbox checked={day.dok_levels?.includes(1)} />Level 1<br/>
                <Checkbox checked={day.dok_levels?.includes(2)} />Level 2<br/>
                <Checkbox checked={day.dok_levels?.includes(3)} />Level 3<br/>
                <Checkbox checked={day.dok_levels?.includes(4)} />Level 4
              </td>
            ))}
          </tr>

          {/* Activities */}
          <tr>
            <td style={{ fontWeight: 'bold', padding: '5px', fontSize: '9pt' }}>Activities</td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '4px', fontSize: '7.5pt', lineHeight: '1.35' }}>
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

          {/* Materials */}
          <tr>
            <td style={{ fontWeight: 'bold', padding: '5px', fontSize: '9pt' }}>Materials</td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '4px', fontSize: '8pt', lineHeight: '1.4' }}>
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
    </div>
  );

  // Standards Page
  const renderStandardsPage = () => (
    <div className="print-page" style={{ fontSize: '9pt' }}>
      <Header />
      
      {/* Unit Info */}
      <table style={{ marginBottom: '10px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', padding: '8px 10px', fontSize: '10pt' }}>
              <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
              <div><strong>Story:</strong> {plan.story || '_____'}</div>
              <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
              <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
            </td>
            <td style={{ width: '50%', padding: '8px 10px', fontSize: '10pt' }}>
              <div><strong>Date</strong></div>
              <div>From: To: {plan.week_start || '_____'} - {plan.week_end || '_____'}</div>
              {(plan.week2_start || plan.week2_end) && (
                <div>From: To: {plan.week2_start || '_____'} - {plan.week2_end || '_____'}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Standards Grid */}
      <table style={{ marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', padding: '10px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11pt', borderBottom: '2px solid black', marginBottom: '8px', paddingBottom: '4px' }}>
                Standard: First Week
              </div>
              {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                const standard = getStandardsForWeek(1).find(s => s.domain === domain);
                return (
                  <div key={domain} style={{ marginBottom: '4px', fontSize: '9pt' }}>
                    <Checkbox checked={standard?.codes?.length > 0} />
                    <strong>{STANDARD_LABELS[domain][lang]}</strong>
                    {standard?.codes?.length > 0 && (
                      <span style={{ marginLeft: '8px' }}>{standard.codes.join(', ')}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ border: '1px solid black', padding: '8px', marginTop: '12px', minHeight: '70px' }}>
                <strong>Expectations:</strong>
                <div style={{ marginTop: '5px' }}>{getExpectationForWeek(1)}</div>
              </div>
            </td>
            <td style={{ width: '50%', padding: '10px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11pt', borderBottom: '2px solid black', marginBottom: '8px', paddingBottom: '4px' }}>
                Standard: Second Week
              </div>
              {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                const standard = getStandardsForWeek(2).find(s => s.domain === domain);
                return (
                  <div key={domain} style={{ marginBottom: '4px', fontSize: '9pt' }}>
                    <Checkbox checked={standard?.codes?.length > 0} />
                    <strong>{STANDARD_LABELS[domain][lang]}</strong>
                    {standard?.codes?.length > 0 && (
                      <span style={{ marginLeft: '8px' }}>{standard.codes.join(', ')}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ border: '1px solid black', padding: '8px', marginTop: '12px', minHeight: '70px' }}>
                <strong>Expectations:</strong>
                <div style={{ marginTop: '5px' }}>{getExpectationForWeek(2)}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Integration */}
      <table style={{ marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '10px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10pt' }}>Integration with other subjects:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '9pt' }}>
                {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
                  <span key={subject}>
                    <Checkbox checked={plan.subject_integration?.includes(subject)} />
                    {subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', paddingTop: '15px' }}>
        <div style={{ borderTop: '1px solid black', paddingTop: '5px', width: '40%', textAlign: 'center', fontSize: '9pt' }}>
          Teacher's Signature / Date
        </div>
        <div style={{ borderTop: '1px solid black', paddingTop: '5px', width: '40%', textAlign: 'center', fontSize: '9pt' }}>
          Principal's Signature / Date
        </div>
      </div>
    </div>
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

        {/* Print Content - Preview */}
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', padding: '15px', background: 'white' }}>
          
          {/* Page 1: Week 1 Daily Plan */}
          {renderWeekPage(
            planDays, 
            1, 
            plan.week_start, 
            plan.week_end, 
            plan.objective, 
            plan.skills
          )}

          {/* Page 2: Week 2 Daily Plan (if exists) */}
          {(plan.week2_start || plan.week2_end) && renderWeekPage(
            planDaysWeek2, 
            2, 
            plan.week2_start, 
            plan.week2_end, 
            plan.objective_week2 || plan.objective, 
            (plan.skills_week2 && plan.skills_week2.some(s => s)) ? plan.skills_week2 : plan.skills
          )}

          {/* Page 3: Standards */}
          {renderStandardsPage()}
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
