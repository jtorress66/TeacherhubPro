import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

// School header matching paper format
const SchoolHeader = () => (
  <div className="text-center mb-4 border-b-2 border-black pb-3">
    <div className="flex items-center justify-center gap-4">
      <div className="text-xs">
        <div className="font-bold text-sm">Colegio De La Inmaculada Concepción</div>
        <div>P.O. Box 3400</div>
        <div>Manatí, Puerto Rico 00674</div>
        <div>Tel. (787) 854-2079 / (787)854-5265</div>
        <div>Cicmanati@outlook.com</div>
      </div>
    </div>
    <div className="font-bold text-lg mt-2">Teacher's Planning</div>
  </div>
);

// DOK Level descriptions
const DOK_DESCRIPTIONS = {
  1: { en: 'Level 1: Memory Thought (Knowledge in or the same way as learned)', es: 'Nivel 1: Pensamiento de Memoria (Conocimiento de la misma manera aprendida)' },
  2: { en: 'Level 2: Processing (Requires some basic mental reasoning, something beyond memory)', es: 'Nivel 2: Procesamiento (Requiere razonamiento mental básico, algo más allá de memoria)' },
  3: { en: 'Level 3: Thinking Strategic (Demonstrate knowledge based on complex and abstract cognitive demand)', es: 'Nivel 3: Pensamiento Estratégico (Demostrar conocimiento basado en demanda cognitiva compleja y abstracta)' },
  4: { en: 'Level 4: Thinking Thought Extended (extends knowledge to broader contexts)', es: 'Nivel 4: Pensamiento Extendido (extiende conocimiento a contextos más amplios)' }
};

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

export const PlanPrintView = ({ plan, classInfo, onClose }) => {
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
          @page { size: letter; margin: 0.5in; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.3; }
          .page { page-break-after: always; }
          .page:last-child { page-break-after: avoid; }
          .header { text-align: center; border-bottom: 2px solid black; padding-bottom: 8px; margin-bottom: 10px; }
          .header h1 { font-size: 11pt; margin-top: 5px; }
          .header .school-name { font-size: 12pt; font-weight: bold; }
          .header .school-info { font-size: 8pt; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; border: 1px solid black; }
          .info-box { padding: 5px; border: 1px solid black; }
          .info-box label { font-weight: bold; font-size: 8pt; }
          .objective-box { border: 1px solid black; padding: 8px; margin-bottom: 10px; }
          .objective-box h3 { font-size: 9pt; font-weight: bold; border-bottom: 1px solid black; margin-bottom: 5px; }
          .skills-list { margin-left: 15px; }
          .week-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8pt; }
          .week-table th, .week-table td { border: 1px solid black; padding: 3px; vertical-align: top; }
          .week-table th { background: #f0f0f0; font-size: 8pt; }
          .day-header { font-weight: bold; text-align: center; }
          .checkbox { display: inline-block; width: 10px; height: 10px; border: 1px solid black; margin-right: 3px; vertical-align: middle; }
          .checkbox.checked { background: black; }
          .checkbox.checked::after { content: '✓'; color: white; font-size: 8px; display: block; text-align: center; line-height: 10px; }
          .dok-section { font-size: 7pt; }
          .dok-item { margin-bottom: 2px; }
          .standards-section { border: 1px solid black; margin-bottom: 10px; }
          .standards-header { display: grid; grid-template-columns: 1fr 1fr; }
          .standards-week { padding: 5px; border: 1px solid black; }
          .standards-week h4 { font-size: 9pt; font-weight: bold; border-bottom: 1px solid black; margin-bottom: 5px; }
          .standard-row { display: flex; gap: 5px; margin-bottom: 3px; font-size: 8pt; }
          .expectations-box { border: 1px solid black; padding: 5px; margin-top: 5px; min-height: 40px; }
          .integration-section { border: 1px solid black; padding: 5px; margin-top: 10px; font-size: 8pt; }
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-auto">
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

        {/* Print Content */}
        <div ref={printRef} className="p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt' }}>
          {/* Page 1: Header Info + Daily Plan */}
          <div className="page">
            <SchoolHeader />
            
            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid black', marginBottom: '10px' }}>
              <div style={{ padding: '8px', borderRight: '1px solid black' }}>
                <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
                <div><strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {classInfo?.teacher_name || '_____'}</div>
                <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div style={{ padding: '8px' }}>
                <div><strong>Date</strong></div>
                <div>From: {plan.week_start || '_____'} To: {plan.week_end || '_____'}</div>
              </div>
            </div>

            {/* Objective */}
            <div style={{ border: '1px solid black', padding: '8px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', marginBottom: '5px' }}>
                Objective of the week:
              </div>
              <div>{plan.objective || '_____'}</div>
            </div>

            {/* Skills */}
            <div style={{ border: '1px solid black', padding: '8px', marginBottom: '10px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', marginBottom: '5px' }}>
                Skills of the week:
              </div>
              <ol style={{ marginLeft: '20px' }}>
                {(plan.skills || []).filter(s => s).map((skill, i) => (
                  <li key={i}>{skill}</li>
                ))}
              </ol>
            </div>

            {/* Daily Plan Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '3px', width: '12%' }}></th>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(day => (
                    <th key={day} style={{ border: '1px solid black', padding: '3px', textAlign: 'center', background: '#f0f0f0' }}>
                      {DAY_LABELS[day][lang]}
                      <br />
                      <small>RE [ ]C [ ]A</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Day Theme Row */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold' }}>Day Theme</td>
                  {(plan.days || []).map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '3px', textAlign: 'center' }}>
                      {day.theme || ''}
                    </td>
                  ))}
                </tr>
                
                {/* DOK Levels Row */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold', fontSize: '6pt' }}>
                    Type of Taxonomy: Webb (2005) Levels
                  </td>
                  {(plan.days || []).map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '2px', fontSize: '6pt' }}>
                      {[1, 2, 3, 4].map(level => (
                        <div key={level} style={{ marginBottom: '2px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '8px', 
                            height: '8px', 
                            border: '1px solid black',
                            background: day.dok_levels?.includes(level) ? 'black' : 'white',
                            marginRight: '3px',
                            verticalAlign: 'middle'
                          }}></span>
                          <span style={{ fontSize: '5pt' }}>Level {level}</span>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Activities Row */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold' }}>Activities</td>
                  {(plan.days || []).map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '2px', fontSize: '6pt' }}>
                      {Object.keys(ACTIVITY_LABELS).map(actType => {
                        const activity = day.activities?.find(a => a.activity_type === actType);
                        return (
                          <div key={actType} style={{ marginBottom: '1px' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              width: '7px', 
                              height: '7px', 
                              border: '1px solid black',
                              background: activity?.checked ? 'black' : 'white',
                              marginRight: '2px',
                              verticalAlign: 'middle'
                            }}></span>
                            <span style={{ fontSize: '5pt' }}>{ACTIVITY_LABELS[actType][lang]}</span>
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>

                {/* Materials Row */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold' }}>Materials</td>
                  {(plan.days || []).map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '2px', fontSize: '6pt' }}>
                      {Object.keys(MATERIAL_LABELS).map(matType => {
                        const material = day.materials?.find(m => m.material_type === matType);
                        return (
                          <div key={matType} style={{ marginBottom: '1px' }}>
                            <span style={{ 
                              display: 'inline-block', 
                              width: '7px', 
                              height: '7px', 
                              border: '1px solid black',
                              background: material?.checked ? 'black' : 'white',
                              marginRight: '2px',
                              verticalAlign: 'middle'
                            }}></span>
                            <span style={{ fontSize: '5pt' }}>{MATERIAL_LABELS[matType][lang]}</span>
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 2: Standards and Expectations */}
          <div className="page" style={{ pageBreakBefore: 'always' }}>
            <SchoolHeader />
            
            {/* Standards Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black' }}>
              {/* First Week */}
              <div style={{ borderRight: '1px solid black', padding: '8px' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', marginBottom: '8px' }}>
                  Standard: First Week
                </div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(1).find(s => s.domain === domain);
                  return (
                    <div key={domain} style={{ marginBottom: '5px', fontSize: '8pt' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '8px', 
                        height: '8px', 
                        border: '1px solid black',
                        background: standard?.codes?.length > 0 ? 'black' : 'white',
                        marginRight: '5px',
                        verticalAlign: 'middle'
                      }}></span>
                      <strong>{STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{ border: '1px solid black', padding: '5px', marginTop: '10px', minHeight: '60px' }}>
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '5px' }}>{getExpectationForWeek(1)}</div>
                </div>
              </div>

              {/* Second Week */}
              <div style={{ padding: '8px' }}>
                <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', marginBottom: '8px' }}>
                  Standard: Second Week
                </div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(2).find(s => s.domain === domain);
                  return (
                    <div key={domain} style={{ marginBottom: '5px', fontSize: '8pt' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        width: '8px', 
                        height: '8px', 
                        border: '1px solid black',
                        background: standard?.codes?.length > 0 ? 'black' : 'white',
                        marginRight: '5px',
                        verticalAlign: 'middle'
                      }}></span>
                      <strong>{STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{ border: '1px solid black', padding: '5px', marginTop: '10px', minHeight: '60px' }}>
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '5px' }}>{getExpectationForWeek(2)}</div>
                </div>
              </div>
            </div>

            {/* Integration Section */}
            <div style={{ border: '1px solid black', padding: '8px', marginTop: '15px' }}>
              <strong>Integration with other subjects:</strong>
              <div style={{ marginTop: '5px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
                  <span key={subject} style={{ fontSize: '8pt' }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: '8px', 
                      height: '8px', 
                      border: '1px solid black',
                      background: plan.subject_integration?.includes(subject) ? 'black' : 'white',
                      marginRight: '3px',
                      verticalAlign: 'middle'
                    }}></span>
                    {subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                ))}
              </div>
            </div>

            {/* Signature Section */}
            <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px' }}>
              <div style={{ borderTop: '1px solid black', paddingTop: '5px', textAlign: 'center' }}>
                Teacher's Signature / Date
              </div>
              <div style={{ borderTop: '1px solid black', paddingTop: '5px', textAlign: 'center' }}>
                Principal's Signature / Date
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
