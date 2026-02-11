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

// Checkbox component
const Checkbox = ({ checked }) => (
  <span style={{
    display: 'inline-block',
    width: '8px',
    height: '8px',
    border: '1px solid black',
    background: checked ? 'black' : 'white',
    verticalAlign: 'middle',
    marginRight: '3px'
  }}></span>
);

export const PlanPrintView = ({ plan, classInfo, school, onClose }) => {
  const { language } = useLanguage();
  const printRef = useRef();
  const lang = language === 'es' ? 'es' : 'en';

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
            margin: 0.25in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; }
          .page {
            width: 100%;
            height: 100%;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .page:last-child { page-break-after: avoid; }
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

  // Header component with inline styles
  const Header = () => (
    <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '5px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        {school?.logo_url && <img src={school.logo_url} alt="Logo" style={{ height: '35px' }} />}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>{school?.name || 'Colegio De La Inmaculada Concepción'}</div>
          <div style={{ fontSize: '8pt' }}>{school?.address || 'P.O. Box 3400, Manatí, Puerto Rico 00674'}</div>
          <div style={{ fontSize: '8pt' }}>{school?.phone ? `Tel. ${school.phone}` : 'Tel. (787) 854-2079 / (787)854-5265'}</div>
          <div style={{ fontSize: '8pt' }}>{school?.email || 'Cicmanati@outlook.com'}</div>
        </div>
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '12pt', marginTop: '5px' }}>Teacher's Planning</div>
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

        {/* Print Content */}
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', padding: '10px', background: 'white' }}>
          
          {/* ===== PAGE 1: Daily Plan ===== */}
          <div className="page" style={{ fontSize: '8pt', lineHeight: '1.2' }}>
            <Header />
            
            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '6px' }}>
              <div style={{ padding: '5px', borderRight: '1px solid black', fontSize: '9pt' }}>
                <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
                <div><strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
                <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div style={{ padding: '5px', fontSize: '9pt' }}>
                <div><strong>Date</strong></div>
                <div>From: {plan.week_start || '_____'} To: {plan.week_end || '_____'}</div>
              </div>
            </div>

            {/* Objective */}
            <div style={{ border: '1px solid black', padding: '5px', marginBottom: '6px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', marginBottom: '3px', fontSize: '9pt' }}>
                Objective of the week:
              </div>
              <div style={{ fontSize: '8pt' }}>{plan.objective || '_____'}</div>
            </div>

            {/* Skills */}
            <div style={{ border: '1px solid black', padding: '5px', marginBottom: '6px' }}>
              <div style={{ fontWeight: 'bold', borderBottom: '1px solid black', marginBottom: '3px', fontSize: '9pt' }}>
                Skills of the week:
              </div>
              <ol style={{ marginLeft: '15px', fontSize: '8pt' }}>
                {(plan.skills || []).filter(s => s).map((skill, i) => (
                  <li key={i} style={{ marginBottom: '1px' }}>{skill}</li>
                ))}
              </ol>
            </div>

            {/* Daily Plan Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '3px', width: '12%', background: '#f0f0f0', fontSize: '7pt' }}></th>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, dayIdx) => (
                    <th key={day} style={{ border: '1px solid black', padding: '3px', width: '17.6%', background: '#f0f0f0', textAlign: 'center', fontSize: '8pt' }}>
                      {DAY_LABELS[day][lang]}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '2px', fontSize: '7pt' }}>
                        {['E', 'C', 'A'].map(eca => (
                          <span key={eca}>
                            {eca}<Checkbox checked={planDays[dayIdx]?.eca?.[eca]} />
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
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold', fontSize: '7pt' }}>Day Theme</td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '3px', textAlign: 'center', fontSize: '7pt' }}>
                      {day.theme || ''}
                    </td>
                  ))}
                </tr>
                
                {/* DOK Levels */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold', fontSize: '6pt' }}>
                    Type of Taxonomy: Webb (2005) Levels
                  </td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '2px', fontSize: '6pt' }}>
                      {[1, 2, 3, 4].map(level => (
                        <div key={level} style={{ marginBottom: '1px' }}>
                          <Checkbox checked={day.dok_levels?.includes(level)} /> Level {level}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Activities */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold', fontSize: '7pt' }}>Activities</td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '2px', fontSize: '6pt' }}>
                      {Object.keys(ACTIVITY_LABELS).map(actType => {
                        const activity = day.activities?.find(a => a.activity_type === actType);
                        return (
                          <div key={actType} style={{ marginBottom: '1px', lineHeight: '1.1' }}>
                            <Checkbox checked={activity?.checked} /> {ACTIVITY_LABELS[actType][lang]}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>

                {/* Materials */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '3px', fontWeight: 'bold', fontSize: '7pt' }}>Materials</td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '2px', fontSize: '6pt' }}>
                      {Object.keys(MATERIAL_LABELS).map(matType => {
                        const material = day.materials?.find(m => m.material_type === matType);
                        return (
                          <div key={matType} style={{ marginBottom: '1px', lineHeight: '1.1' }}>
                            <Checkbox checked={material?.checked} /> {MATERIAL_LABELS[matType][lang]}
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
          <div className="page" style={{ pageBreakBefore: 'always', fontSize: '9pt', lineHeight: '1.3' }}>
            <Header />
            
            {/* Unit Info repeated */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '10px' }}>
              <div style={{ padding: '6px', borderRight: '1px solid black', fontSize: '9pt' }}>
                <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
                <div><strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
                <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div style={{ padding: '6px', fontSize: '9pt' }}>
                <div><strong>Date</strong></div>
                <div>From: {plan.week_start || '_____'} To: {plan.week_end || '_____'}</div>
              </div>
            </div>

            {/* Standards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '15px' }}>
              {/* First Week */}
              <div style={{ padding: '10px', borderRight: '1px solid black' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10pt', borderBottom: '1px solid black', marginBottom: '10px', paddingBottom: '3px' }}>
                  Standard: First Week
                </div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(1).find(s => s.domain === domain);
                  return (
                    <div key={domain} style={{ marginBottom: '6px', fontSize: '9pt' }}>
                      <Checkbox checked={standard?.codes?.length > 0} />
                      <strong> {STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{ border: '1px solid black', padding: '8px', marginTop: '12px', minHeight: '80px' }}>
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '5px' }}>{getExpectationForWeek(1)}</div>
                </div>
              </div>

              {/* Second Week */}
              <div style={{ padding: '10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '10pt', borderBottom: '1px solid black', marginBottom: '10px', paddingBottom: '3px' }}>
                  Standard: Second Week
                </div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(2).find(s => s.domain === domain);
                  return (
                    <div key={domain} style={{ marginBottom: '6px', fontSize: '9pt' }}>
                      <Checkbox checked={standard?.codes?.length > 0} />
                      <strong> {STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{ border: '1px solid black', padding: '8px', marginTop: '12px', minHeight: '80px' }}>
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '5px' }}>{getExpectationForWeek(2)}</div>
                </div>
              </div>
            </div>

            {/* Integration Section */}
            <div style={{ border: '1px solid black', padding: '10px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '10px' }}>Integration with other subjects:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '9pt' }}>
                {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
                  <span key={subject}>
                    <Checkbox checked={plan.subject_integration?.includes(subject)} />
                    {' '}{subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}
                  </span>
                ))}
              </div>
            </div>

            {/* Signature Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', marginTop: '50px' }}>
              <div style={{ borderTop: '1px solid black', paddingTop: '5px', textAlign: 'center', fontSize: '9pt' }}>
                Teacher's Signature / Date
              </div>
              <div style={{ borderTop: '1px solid black', paddingTop: '5px', textAlign: 'center', fontSize: '9pt' }}>
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
