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

const ECA_LABELS = {
  E: { en: 'Exploration', es: 'Exploración' },
  C: { en: 'Concept', es: 'Concepto' },
  A: { en: 'Application', es: 'Aplicación' }
};

// Compact checkbox - matching paper size
const Checkbox = ({ checked }) => (
  <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    border: '1px solid black',
    background: checked ? 'black' : 'white',
    verticalAlign: 'middle',
    marginRight: '2px'
  }}></span>
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

  const primaryColor = school?.branding?.primary_color || branding?.primary_color || '#65A30D';
  const secondaryColor = school?.branding?.secondary_color || branding?.secondary_color || '#334155';

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
            margin: 0.3in 0.4in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 8pt;
            line-height: 1.1;
          }
          .print-page {
            page-break-after: always;
            page-break-inside: avoid;
          }
          .print-page:last-child { page-break-after: avoid; }
          table { border-collapse: collapse; width: 100%; }
          td, th { border: 1px solid black; padding: 1px 2px; vertical-align: top; font-size: 7pt; }
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

  // Compact Header matching paper
  const Header = () => (
    <div style={{ textAlign: 'center', marginBottom: '4px', borderBottom: '2px solid black', paddingBottom: '4px' }}>
      {school?.logo_url && (
        <img src={school.logo_url} alt="Logo" style={{ height: '40px', marginBottom: '2px' }} />
      )}
      <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>{school?.name || 'School Name'}</div>
      {school?.address && <div style={{ fontSize: '7pt' }}>{school.address}</div>}
      <div style={{ fontSize: '7pt' }}>
        {school?.phone && `Tel. ${school.phone}`}
        {school?.phone && school?.email && ' | '}
        {school?.email}
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '10pt', marginTop: '4px' }}>
        {lang === 'es' ? "Planificación del Maestro" : "Teacher's Planning"}
      </div>
    </div>
  );

  // Render a single week's daily plan page
  const renderWeekPage = (days, weekNum, weekStart, weekEnd, objective, skills) => (
    <div className="print-page" style={{ fontSize: '8pt', lineHeight: '1.15' }}>
      <Header />
      
      {/* Date Range */}
      <div style={{ border: '1px solid black', padding: '2px 4px', marginBottom: '3px', fontWeight: 'bold', fontSize: '8pt' }}>
        Date: From {weekStart || '_____'} To {weekEnd || '_____'}
        {weekNum === 2 && <span style={{ marginLeft: '10px', color: '#16a34a' }}>(Week 2)</span>}
      </div>

      {/* Objective */}
      <div style={{ border: '1px solid black', padding: '2px 4px', marginBottom: '3px', fontSize: '8pt' }}>
        <strong>Objective of the week:</strong> {objective || '_____'}
      </div>

      {/* Skills */}
      <div style={{ border: '1px solid black', padding: '2px 4px', marginBottom: '3px', fontSize: '7pt' }}>
        <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '1px', marginBottom: '2px' }}>Skills of the week:</div>
        <ol style={{ marginLeft: '15px', marginTop: '1px' }}>
          {(skills || []).filter(s => s).map((skill, i) => (
            <li key={i} style={{ marginBottom: '1px' }}>{skill}</li>
          ))}
        </ol>
      </div>

      {/* Main Table - Very Compact */}
      <table style={{ fontSize: '6.5pt', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '13%' }} />
          <col style={{ width: '17.4%' }} />
          <col style={{ width: '17.4%' }} />
          <col style={{ width: '17.4%' }} />
          <col style={{ width: '17.4%' }} />
          <col style={{ width: '17.4%' }} />
        </colgroup>
        <thead>
          <tr style={{ background: '#f0f0f0' }}>
            <th style={{ padding: '2px', fontSize: '7pt' }}></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} style={{ textAlign: 'center', padding: '2px', fontSize: '7pt' }}>
                <div>{DAY_LABELS[day][lang]}</div>
                <div style={{ fontSize: '6pt', marginTop: '1px' }}>
                  {['E', 'C', 'A'].map(eca => (
                    <span key={eca} style={{ marginRight: '4px' }}>
                      {eca}<Checkbox checked={days[idx]?.eca?.[eca]} />
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
            <td style={{ fontWeight: 'bold', fontSize: '6.5pt', padding: '2px' }}>Day Theme</td>
            {days.map((day, i) => (
              <td key={i} style={{ textAlign: 'center', padding: '2px', fontSize: '6.5pt' }}>{day.theme || ''}</td>
            ))}
          </tr>
          
          {/* DOK Levels - Compact */}
          <tr>
            <td style={{ fontWeight: 'bold', fontSize: '6pt', padding: '2px', lineHeight: '1.0' }}>
              Type of Taxonomy:<br/>Webb (2005) Levels
            </td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '1px 2px', fontSize: '6pt', lineHeight: '1.1' }}>
                {[1, 2, 3, 4].map(level => (
                  <div key={level}><Checkbox checked={day.dok_levels?.includes(level)} /> Level {level}</div>
                ))}
              </td>
            ))}
          </tr>

          {/* Activities - Compact */}
          <tr>
            <td style={{ fontWeight: 'bold', fontSize: '6.5pt', padding: '2px' }}>Activities</td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '1px 2px', fontSize: '5.5pt', lineHeight: '1.05' }}>
                {Object.keys(ACTIVITY_LABELS).map(actType => {
                  const activity = day.activities?.find(a => a.activity_type === actType);
                  return (
                    <div key={actType}>
                      <Checkbox checked={activity?.checked} /> {ACTIVITY_LABELS[actType][lang]}
                      {actType === 'other' && activity?.checked && activity?.notes && (
                        <span style={{ fontStyle: 'italic' }}>: {activity.notes}</span>
                      )}
                    </div>
                  );
                })}
              </td>
            ))}
          </tr>

          {/* Materials - Compact */}
          <tr>
            <td style={{ fontWeight: 'bold', fontSize: '6.5pt', padding: '2px' }}>Materials</td>
            {days.map((day, i) => (
              <td key={i} style={{ padding: '1px 2px', fontSize: '6pt', lineHeight: '1.1' }}>
                {Object.keys(MATERIAL_LABELS).map(matType => {
                  const material = day.materials?.find(m => m.material_type === matType);
                  return (
                    <div key={matType}><Checkbox checked={material?.checked} /> {MATERIAL_LABELS[matType][lang]}</div>
                  );
                })}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  // Standards Page (Page 2 in paper format)
  const renderStandardsPage = () => (
    <div className="print-page" style={{ fontSize: '8pt', lineHeight: '1.2' }}>
      <Header />
      
      {/* Unit Info */}
      <table style={{ marginBottom: '6px', fontSize: '8pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', padding: '3px 5px' }}>
              <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
              <div><strong>Story:</strong> {plan.story || '_____'}</div>
              <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
              <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
            </td>
            <td style={{ width: '50%', padding: '3px 5px' }}>
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
      <table style={{ marginBottom: '8px', fontSize: '8pt' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', padding: '5px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', borderBottom: '1px solid black', marginBottom: '4px', paddingBottom: '2px' }}>
                Standard: First Week
              </div>
              {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                const standard = getStandardsForWeek(1).find(s => s.domain === domain);
                return (
                  <div key={domain} style={{ marginBottom: '2px' }}>
                    <Checkbox checked={standard?.codes?.length > 0} />
                    <strong style={{ marginLeft: '2px' }}>{STANDARD_LABELS[domain][lang]}</strong>
                    {standard?.codes?.length > 0 && (
                      <span style={{ marginLeft: '5px', fontSize: '7pt' }}>{standard.codes.join(', ')}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ border: '1px solid black', padding: '4px', marginTop: '6px', minHeight: '50px' }}>
                <strong>Expectations:</strong>
                <div style={{ marginTop: '2px', fontSize: '7pt' }}>{getExpectationForWeek(1)}</div>
              </div>
            </td>
            <td style={{ width: '50%', padding: '5px', verticalAlign: 'top' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', borderBottom: '1px solid black', marginBottom: '4px', paddingBottom: '2px' }}>
                Standard: Second Week
              </div>
              {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                const standard = getStandardsForWeek(2).find(s => s.domain === domain);
                return (
                  <div key={domain} style={{ marginBottom: '2px' }}>
                    <Checkbox checked={standard?.codes?.length > 0} />
                    <strong style={{ marginLeft: '2px' }}>{STANDARD_LABELS[domain][lang]}</strong>
                    {standard?.codes?.length > 0 && (
                      <span style={{ marginLeft: '5px', fontSize: '7pt' }}>{standard.codes.join(', ')}</span>
                    )}
                  </div>
                );
              })}
              <div style={{ border: '1px solid black', padding: '4px', marginTop: '6px', minHeight: '50px' }}>
                <strong>Expectations:</strong>
                <div style={{ marginTop: '2px', fontSize: '7pt' }}>{getExpectationForWeek(2)}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Integration */}
      <div style={{ border: '1px solid black', padding: '5px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Integration with other subjects:</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '8pt' }}>
          {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
            <span key={subject}>
              <Checkbox checked={plan.subject_integration?.includes(subject)} />
              <span style={{ marginLeft: '2px' }}>{subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '10px' }}>
        <div style={{ borderTop: '1px solid black', paddingTop: '3px', width: '40%', textAlign: 'center', fontSize: '8pt' }}>
          Teacher's Signature / Date
        </div>
        <div style={{ borderTop: '1px solid black', paddingTop: '3px', width: '40%', textAlign: 'center', fontSize: '8pt' }}>
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
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', padding: '10px', background: 'white' }}>
          
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

          {/* Page 3 (or 2): Standards */}
          {renderStandardsPage()}
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
