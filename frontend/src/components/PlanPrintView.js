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

// Checkbox component
const Checkbox = ({ checked, size = 10 }) => (
  <span style={{
    display: 'inline-block',
    width: `${size}px`,
    height: `${size}px`,
    border: '1px solid black',
    background: checked ? 'black' : 'white',
    verticalAlign: 'middle',
    textAlign: 'center',
    lineHeight: `${size - 2}px`,
    fontSize: `${size - 1}px`,
    fontWeight: 'bold',
    color: 'white'
  }}>{checked ? '✓' : ''}</span>
);

export const PlanPrintView = ({ plan, classInfo, school: propSchool, onClose }) => {
  const { language } = useLanguage();
  const { school: contextSchool, branding } = useSchool();
  const printRef = useRef();
  const lang = language === 'es' ? 'es' : 'en';
  
  // Use prop school if provided, otherwise use context school
  const school = propSchool || contextSchool;

  // Get days filtered by week
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

  const planDays = getWeekDays(1); // Week 1 days
  const planDaysWeek2 = getWeekDays(2); // Week 2 days

  // Get school colors for PDF
  const primaryColor = school?.branding?.primary_color || branding?.primary_color || '#65A30D';
  const secondaryColor = school?.branding?.secondary_color || branding?.secondary_color || '#334155';
  const accentColor = school?.branding?.accent_color || branding?.accent_color || '#F59E0B';

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lesson Plan - ${plan.unit || 'Plan'}</title>
        <style>
          :root {
            --school-primary: ${primaryColor};
            --school-secondary: ${secondaryColor};
            --school-accent: ${accentColor};
          }
          @page { 
            size: 11in 8.5in; 
            margin: 0.2in 0.25in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; }
          .page {
            width: 100%;
            height: 8.1in;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden;
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

  // Header component - LARGER with school branding
  const Header = () => (
    <div style={{ 
      textAlign: 'center', 
      borderBottom: `3px solid ${primaryColor}`, 
      paddingBottom: '6px', 
      marginBottom: '10px' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' }}>
        {school?.logo_url && (
          <img 
            src={school.logo_url} 
            alt="Logo" 
            style={{ height: '52px', objectFit: 'contain' }} 
          />
        )}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '15pt', 
            color: secondaryColor 
          }}>
            {school?.name || 'School Name'}
          </div>
          {school?.address && (
            <div style={{ fontSize: '10pt', color: '#666' }}>{school.address}</div>
          )}
          <div style={{ fontSize: '10pt', color: '#666' }}>
            {school?.phone && `Tel. ${school.phone}`}
            {school?.phone && school?.email && ' | '}
            {school?.email}
          </div>
        </div>
      </div>
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: '15pt', 
        marginTop: '5px',
        color: primaryColor
      }}>
        {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
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

        {/* Print Content */}
        <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', padding: '4px', background: 'white' }}>
          
          {/* ===== PAGE 1: Week 1 Daily Plan ===== */}
          <div className="page" style={{ fontSize: '8pt', lineHeight: '1.2' }}>
            <Header />
            
            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '4px' }}>
              <div style={{ padding: '4px 6px', borderRight: '1px solid black', fontSize: '9pt' }}>
                <div><strong>Unit:</strong> {plan.unit || '_____'} | <strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {plan.teacher_name || '_____'} | <strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div style={{ padding: '4px 6px', fontSize: '9pt' }}>
                <div>
                  <strong>Date:</strong> From {plan.week_start || '_____'} To {plan.week_end || '_____'}
                </div>
              </div>
            </div>

            {/* Objective */}
            <div style={{ border: '1px solid black', padding: '4px 6px', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '9pt' }}>Objective of the week: </span>
              <span style={{ fontSize: '8pt' }}>{plan.objective || '_____'}</span>
            </div>

            {/* Skills - Numbered list */}
            <div style={{ border: '1px solid black', padding: '4px 6px', marginBottom: '4px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '9pt', borderBottom: '1px solid black', marginBottom: '3px', paddingBottom: '2px' }}>
                Skills of the week:
              </div>
              <ol style={{ marginLeft: '18px', fontSize: '8pt', marginTop: '2px', marginBottom: '2px' }}>
                {(plan.skills || []).filter(s => s).map((skill, i) => (
                  <li key={i} style={{ marginBottom: '1px' }}>{skill}</li>
                ))}
              </ol>
            </div>

            {/* Daily Plan Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7pt', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '3px', width: '12%', background: '#f0f0f0', fontSize: '7.5pt' }}></th>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, dayIdx) => (
                    <th key={day} style={{ border: '1px solid black', padding: '3px', width: '17.6%', background: '#f0f0f0', textAlign: 'center', fontSize: '8pt' }}>
                      {DAY_LABELS[day][lang]}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '2px', fontSize: '7pt' }}>
                        {['E', 'C', 'A'].map(eca => (
                          <span key={eca} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                            <span>{eca}</span>
                            <Checkbox checked={planDays[dayIdx]?.eca?.[eca]} size={8} />
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
                  <td style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold', fontSize: '9pt' }}>Day Theme</td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '5px', textAlign: 'center', fontSize: '9pt' }}>
                      {day.theme || ''}
                    </td>
                  ))}
                </tr>
                
                {/* DOK Levels */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', fontSize: '8pt' }}>
                    Type of Taxonomy: Webb (2005) Levels
                  </td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '4px', fontSize: '8pt' }}>
                      {[1, 2, 3, 4].map(level => (
                        <div key={level} style={{ marginBottom: '2px', lineHeight: '1.25' }}>
                          <Checkbox checked={day.dok_levels?.includes(level)} size={9} /> Level {level}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Activities */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', fontSize: '9pt' }}>Activities</td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '4px', fontSize: '7.5pt' }}>
                      {Object.keys(ACTIVITY_LABELS).map(actType => {
                        const activity = day.activities?.find(a => a.activity_type === actType);
                        return (
                          <div key={actType} style={{ marginBottom: '2px', lineHeight: '1.2' }}>
                            <Checkbox checked={activity?.checked} size={9} /> {ACTIVITY_LABELS[actType][lang]}
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
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', fontSize: '9pt' }}>Materials</td>
                  {planDays.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '4px', fontSize: '7.5pt' }}>
                      {Object.keys(MATERIAL_LABELS).map(matType => {
                        const material = day.materials?.find(m => m.material_type === matType);
                        return (
                          <div key={matType} style={{ marginBottom: '2px', lineHeight: '1.2' }}>
                            <Checkbox checked={material?.checked} size={9} /> {MATERIAL_LABELS[matType][lang]}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* ECA Legend */}
            <div style={{ marginTop: '8px', fontSize: '9pt', borderTop: '1px solid #999', paddingTop: '5px' }}>
              <strong>E/C/A:</strong> E = {ECA_LABELS.E[lang]}, C = {ECA_LABELS.C[lang]}, A = {ECA_LABELS.A[lang]}
            </div>
          </div>

          {/* ===== PAGE 2: Week 2 Daily Plan ===== */}
          {(plan.week2_start || plan.week2_end) && (
          <div className="page" style={{ pageBreakBefore: 'always', fontSize: '9.5pt', lineHeight: '1.3' }}>
            <Header />
            
            {/* Info Grid - Week 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '8px' }}>
              <div style={{ padding: '7px 10px', borderRight: '1px solid black', fontSize: '11pt' }}>
                <div><strong>Unit:</strong> {plan.unit || '_____'} | <strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {plan.teacher_name || '_____'} | <strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div style={{ padding: '7px 10px', fontSize: '11pt' }}>
                <div>
                  <strong>Date:</strong> From {plan.week2_start || '_____'} To {plan.week2_end || '_____'}
                  <span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#16a34a' }}>(Week 2)</span>
                </div>
              </div>
            </div>

            {/* Objective - Week 2 */}
            <div style={{ border: '1px solid black', padding: '7px 10px', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '11pt' }}>Objective of the week: </span>
              <span style={{ fontSize: '10pt' }}>{plan.objective_week2 || plan.objective || '_____'}</span>
            </div>

            {/* Skills - Week 2 */}
            <div style={{ border: '1px solid black', padding: '7px 10px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11pt', borderBottom: '1px solid black', marginBottom: '5px', paddingBottom: '3px' }}>
                Skills of the week:
              </div>
              <ol style={{ marginLeft: '22px', fontSize: '10pt' }}>
                {((plan.skills_week2 && plan.skills_week2.some(s => s)) ? plan.skills_week2 : plan.skills || []).filter(s => s).map((skill, i) => (
                  <li key={i} style={{ marginBottom: '3px' }}>{skill}</li>
                ))}
              </ol>
            </div>

            {/* Daily Plan Table - Week 2 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '5px', width: '13%', background: '#f0f0f0', fontSize: '9pt' }}></th>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, dayIdx) => (
                    <th key={day} style={{ border: '1px solid black', padding: '5px', width: '17.4%', background: '#f0f0f0', textAlign: 'center', fontSize: '10pt' }}>
                      {DAY_LABELS[day][lang]}
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '3px', fontSize: '9pt' }}>
                        {['E', 'C', 'A'].map(eca => (
                          <span key={eca} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span>{eca}</span>
                            <Checkbox checked={planDaysWeek2[dayIdx]?.eca?.[eca]} size={10} />
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
                  <td style={{ border: '1px solid black', padding: '5px', fontWeight: 'bold', fontSize: '9pt' }}>Day Theme</td>
                  {planDaysWeek2.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '5px', textAlign: 'center', fontSize: '9pt' }}>
                      {day.theme || ''}
                    </td>
                  ))}
                </tr>
                
                {/* DOK Levels */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', fontSize: '8pt' }}>
                    Type of Taxonomy: Webb (2005) Levels
                  </td>
                  {planDaysWeek2.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '4px', fontSize: '8pt' }}>
                      {[1, 2, 3, 4].map(level => (
                        <div key={level} style={{ marginBottom: '2px', lineHeight: '1.25' }}>
                          <Checkbox checked={day.dok_levels?.includes(level)} size={9} /> Level {level}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>

                {/* Activities */}
                <tr>
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', fontSize: '9pt' }}>Activities</td>
                  {planDaysWeek2.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '4px', fontSize: '7.5pt' }}>
                      {Object.keys(ACTIVITY_LABELS).map(actType => {
                        const activity = day.activities?.find(a => a.activity_type === actType);
                        return (
                          <div key={actType} style={{ marginBottom: '2px', lineHeight: '1.2' }}>
                            <Checkbox checked={activity?.checked} size={9} /> {ACTIVITY_LABELS[actType][lang]}
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
                  <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold', fontSize: '9pt' }}>Materials</td>
                  {planDaysWeek2.map((day, i) => (
                    <td key={i} style={{ border: '1px solid black', padding: '4px', fontSize: '7.5pt' }}>
                      {Object.keys(MATERIAL_LABELS).map(matType => {
                        const material = day.materials?.find(m => m.material_type === matType);
                        return (
                          <div key={matType} style={{ marginBottom: '2px', lineHeight: '1.2' }}>
                            <Checkbox checked={material?.checked} size={9} /> {MATERIAL_LABELS[matType][lang]}
                          </div>
                        );
                      })}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            {/* ECA Legend */}
            <div style={{ marginTop: '8px', fontSize: '9pt', borderTop: '1px solid #999', paddingTop: '5px' }}>
              <strong>E/C/A:</strong> E = {ECA_LABELS.E[lang]}, C = {ECA_LABELS.C[lang]}, A = {ECA_LABELS.A[lang]}
            </div>
          </div>
          )}

          {/* ===== PAGE 3: Standards ===== */}
          <div className="page" style={{ pageBreakBefore: 'always', fontSize: '11pt', lineHeight: '1.4' }}>
            <Header />
            
            {/* Unit Info with BOTH Date Ranges */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '14px', fontSize: '11pt' }}>
              <div style={{ padding: '10px 12px', borderRight: '1px solid black' }}>
                <div><strong>Unit:</strong> {plan.unit || '_____'}</div>
                <div><strong>Story:</strong> {plan.story || '_____'}</div>
                <div><strong>Teacher:</strong> {plan.teacher_name || '_____'}</div>
                <div><strong>Grade:</strong> {classInfo?.grade}-{classInfo?.section}</div>
              </div>
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Date</div>
                <div>From: To: {plan.week_start || '_____'} - {plan.week_end || '_____'}</div>
                {(plan.week2_start || plan.week2_end) && (
                  <div>From: To: {plan.week2_start || '_____'} - {plan.week2_end || '_____'}</div>
                )}
              </div>
            </div>

            {/* Standards Grid - LARGER */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid black', marginBottom: '14px' }}>
              {/* First Week */}
              <div style={{ padding: '12px', borderRight: '1px solid black' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12pt', borderBottom: '1px solid black', marginBottom: '12px', paddingBottom: '5px' }}>
                  Standard: First Week
                </div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(1).find(s => s.domain === domain);
                  return (
                    <div key={domain} style={{ marginBottom: '8px', fontSize: '11pt' }}>
                      <Checkbox checked={standard?.codes?.length > 0} size={11} />
                      <strong style={{ marginLeft: '5px' }}>{STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{ border: '1px solid black', padding: '10px', marginTop: '14px', minHeight: '100px' }}>
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '8px', fontSize: '10pt' }}>{getExpectationForWeek(1)}</div>
                </div>
              </div>

              {/* Second Week */}
              <div style={{ padding: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '12pt', borderBottom: '1px solid black', marginBottom: '12px', paddingBottom: '5px' }}>
                  Standard: Second Week
                </div>
                {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
                  const standard = getStandardsForWeek(2).find(s => s.domain === domain);
                  return (
                    <div key={domain} style={{ marginBottom: '8px', fontSize: '11pt' }}>
                      <Checkbox checked={standard?.codes?.length > 0} size={11} />
                      <strong style={{ marginLeft: '5px' }}>{STANDARD_LABELS[domain][lang]}</strong>
                      {standard?.codes?.length > 0 && (
                        <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                          {standard.codes.join(', ')}
                        </span>
                      )}
                    </div>
                  );
                })}
                <div style={{ border: '1px solid black', padding: '10px', marginTop: '14px', minHeight: '100px' }}>
                  <strong>Expectations:</strong>
                  <div style={{ marginTop: '8px', fontSize: '10pt' }}>{getExpectationForWeek(2)}</div>
                </div>
              </div>
            </div>

            {/* Integration Section - LARGER */}
            <div style={{ border: '1px solid black', padding: '12px' }}>
              <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '12px' }}>Integration with other subjects:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', fontSize: '11pt' }}>
                {['mathematics', 'spanish', 'socialStudies', 'science', 'health', 'art', 'physicalEducation', 'religion'].map(subject => (
                  <span key={subject} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <Checkbox checked={plan.subject_integration?.includes(subject)} size={11} />
                    <span>{subject.charAt(0).toUpperCase() + subject.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Signature Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '100px', marginTop: '45px' }}>
              <div style={{ borderTop: '1px solid black', paddingTop: '8px', textAlign: 'center', fontSize: '11pt' }}>
                Teacher's Signature / Date
              </div>
              <div style={{ borderTop: '1px solid black', paddingTop: '8px', textAlign: 'center', fontSize: '11pt' }}>
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
