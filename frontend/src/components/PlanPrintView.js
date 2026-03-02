import { useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSchool } from '../contexts/SchoolContext';
import { Button } from './ui/button';
import { Printer, X } from 'lucide-react';

const ACTIVITY_LABELS = {
  brainstorming: { en: 'Brainstorming', es: 'Lluvia de ideas' },
  buildingBackground: { en: 'Building background', es: 'Conocimiento previo' },
  vocabularyDevelopment: { en: 'Vocabulary dev.', es: 'Vocabulario' },
  readPages: { en: 'Read pages', es: 'Leer páginas' },
  guidedReading: { en: 'Guided reading', es: 'Lectura guiada' },
  oralQuestions: { en: 'Oral comp. Qs', es: 'Preguntas orales' },
  comprehensionQuestions: { en: 'Comprehension Qs', es: 'Preguntas comp.' },
  exercisePractice: { en: 'Exercise practice', es: 'Práctica' },
  other: { en: 'Other', es: 'Otro' }
};

const MATERIAL_LABELS = {
  book: { en: 'Book', es: 'Libro' },
  notebook: { en: 'Notebook', es: 'Cuaderno' },
  teachersGuide: { en: "Teacher's Guide", es: 'Guía Maestro' },
  testQuiz: { en: 'Test/Quiz', es: 'Prueba' },
  dictionary: { en: 'Dictionary', es: 'Diccionario' },
  handouts: { en: 'Handouts', es: 'Hojas trabajo' },
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

// Inline styles object for consistency between preview and print
const styles = {
  // Page container - exact landscape letter dimensions
  page: {
    width: '10.5in',
    height: '8in',
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: '7pt',
    lineHeight: '1.2',
    color: '#000',
    overflow: 'hidden',
    pageBreakAfter: 'always',
    boxSizing: 'border-box',
  },
  // Header section - compact
  header: {
    textAlign: 'center',
    paddingBottom: '3px',
    borderBottom: '1.5pt solid #333',
    marginBottom: '3px',
  },
  headerLogo: {
    height: '26px',
    objectFit: 'contain',
  },
  schoolName: {
    fontSize: '11pt',
    fontWeight: 'bold',
    margin: 0,
  },
  schoolInfo: {
    fontSize: '6pt',
    color: '#333',
  },
  planTitle: {
    fontSize: '10pt',
    fontWeight: 'bold',
    marginTop: '2px',
  },
  // Info row - compact
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '3px 0',
    borderBottom: '1px solid #999',
    fontSize: '7pt',
    marginBottom: '3px',
  },
  // Objective box - compact with overflow hidden
  objectiveBox: {
    border: '1px solid #000',
    padding: '3px 5px',
    marginBottom: '3px',
    fontSize: '6.5pt',
    lineHeight: '1.2',
    maxHeight: '36px',
    overflow: 'hidden',
  },
  // Skills box - compact with overflow hidden
  skillsBox: {
    border: '1px solid #000',
    padding: '3px 5px',
    marginBottom: '4px',
    fontSize: '6pt',
    lineHeight: '1.15',
    maxHeight: '55px',
    overflow: 'hidden',
  },
  skillsList: {
    margin: '0 0 0 12px',
    padding: 0,
  },
  // Table - COMPACT
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  th: {
    border: '1px solid #000',
    padding: '3px 2px',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '7pt',
    background: '#e8e8e8',
    verticalAlign: 'middle',
  },
  td: {
    border: '1px solid #000',
    padding: '2px 3px',
    verticalAlign: 'top',
    fontSize: '6pt',
  },
  rowLabel: {
    fontWeight: 'bold',
    fontSize: '5.5pt',
    background: '#f5f5f5',
    width: '8%',
    verticalAlign: 'top',
    padding: '2px 3px',
  },
  themeCell: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '6.5pt',
    verticalAlign: 'middle',
    padding: '3px 2px',
    lineHeight: '1.15',
  },
  // Checkbox
  checkbox: (checked) => ({
    display: 'inline-block',
    width: '6px',
    height: '6px',
    border: '0.5pt solid #000',
    marginRight: '2px',
    verticalAlign: 'middle',
    background: checked ? '#000' : '#fff',
  }),
  // Item row - compact
  itemRow: {
    fontSize: '6pt',
    lineHeight: '1.25',
    marginBottom: '1px',
  },
  ecaLine: {
    fontSize: '5pt',
    marginTop: '2px',
  },
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
          @page { 
            size: 11in 8.5in;
            margin: 0;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body {
            width: 100%;
            height: 100%;
          }
          /* Each print-page is one physical page */
          .print-page {
            width: 11in !important;
            height: 8.5in !important;
            padding: 0.2in !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            page-break-inside: avoid;
            overflow: hidden !important;
          }
          .print-page:last-child {
            page-break-after: avoid;
          }
          @media print {
            html, body { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .print-page {
              margin-bottom: 0 !important;
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

  // Checkbox component with inline style
  const Chk = ({ checked }) => (
    <span style={styles.checkbox(checked)} />
  );

  // Weekly Plan Page with all inline styles - COMPACT layout
  const WeeklyPlanPage = ({ days, weekNum, weekStart, weekEnd, objective, skills }) => (
    <div style={styles.page} className="page-break">
      {/* HEADER */}
      <div style={styles.header}>
        {school?.logo_url && (
          <img src={school.logo_url} alt="Logo" style={styles.headerLogo} />
        )}
        <div style={styles.schoolName}>{school?.name || 'School Name'}</div>
        <div style={styles.schoolInfo}>
          {school?.address && <span>{school.address}</span>}
          {school?.phone && <span> | Tel. {school.phone}</span>}
          {school?.email && <span> | {school.email}</span>}
        </div>
        <div style={styles.planTitle}>
          {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
          {weekNum === 2 && <span style={{marginLeft: '10px'}}>(Week 2)</span>}
        </div>
      </div>
      
      {/* INFO ROW */}
      <div style={styles.infoRow}>
        <span><strong>Unit:</strong> {plan.unit || '_____'} &nbsp; <strong>Story:</strong> {plan.story || '_____'}</span>
        <span><strong>Teacher:</strong> {plan.teacher_name || '_____'} &nbsp; <strong>Grade:</strong> {classInfo?.grade || ''}-{classInfo?.section || ''}</span>
        <span><strong>Date:</strong> From {formatDate(weekStart)} To {formatDate(weekEnd)}</span>
      </div>
      
      {/* OBJECTIVE */}
      <div style={styles.objectiveBox}>
        <strong style={{textDecoration: 'underline'}}>Objective:</strong> {objective || '_____'}
      </div>
      
      {/* SKILLS */}
      <div style={styles.skillsBox}>
        <span style={{fontWeight: 'bold', textDecoration: 'underline'}}>Skills:</span>
        <ol style={styles.skillsList}>
          {(skills || []).filter(s => s).length > 0 ? (
            skills.filter(s => s).map((skill, i) => (
              <li key={i}>{skill}</li>
            ))
          ) : (
            <>
              <li>_________________________</li>
              <li>_________________________</li>
            </>
          )}
        </ol>
      </div>
      
      {/* MAIN TABLE - COMPACT, no stretching */}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{...styles.th, ...styles.rowLabel}}></th>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map((day, idx) => (
              <th key={day} style={{...styles.th, width: '18.2%'}}>
                <div>{DAY_LABELS[day][lang]}</div>
                <div style={styles.ecaLine}>
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
            <td style={styles.rowLabel}>Day Theme</td>
            {days.map((day, i) => (
              <td key={i} style={{...styles.td, ...styles.themeCell}}>{day.theme || ''}</td>
            ))}
          </tr>
          
          {/* DOK Levels Row */}
          <tr>
            <td style={styles.rowLabel}>Webb Taxonomy Levels</td>
            {days.map((day, i) => (
              <td key={i} style={styles.td}>
                <div style={styles.itemRow}><Chk checked={day.dok_levels?.includes(1)} /> Lv1: Memory</div>
                <div style={styles.itemRow}><Chk checked={day.dok_levels?.includes(2)} /> Lv2: Processing</div>
                <div style={styles.itemRow}><Chk checked={day.dok_levels?.includes(3)} /> Lv3: Strategic</div>
                <div style={styles.itemRow}><Chk checked={day.dok_levels?.includes(4)} /> Lv4: Extended</div>
              </td>
            ))}
          </tr>
          
          {/* Activities Row */}
          <tr>
            <td style={styles.rowLabel}>Activities</td>
            {days.map((day, i) => (
              <td key={i} style={styles.td}>
                {Object.keys(ACTIVITY_LABELS).map(actType => {
                  const activity = day.activities?.find(a => a.activity_type === actType);
                  return (
                    <div key={actType} style={styles.itemRow}>
                      <Chk checked={activity?.checked} /> {ACTIVITY_LABELS[actType][lang]}
                      {actType === 'other' && activity?.checked && activity?.notes && (
                        <span>: {activity.notes}</span>
                      )}
                    </div>
                  );
                })}
              </td>
            ))}
          </tr>
          
          {/* Materials Row */}
          <tr>
            <td style={styles.rowLabel}>Materials</td>
            {days.map((day, i) => (
              <td key={i} style={styles.td}>
                {Object.keys(MATERIAL_LABELS).map(matType => {
                  const material = day.materials?.find(m => m.material_type === matType);
                  return (
                    <div key={matType} style={styles.itemRow}>
                      <Chk checked={material?.checked} /> {MATERIAL_LABELS[matType][lang]}
                      {matType === 'other' && material?.checked && material?.notes && (
                        <span>: {material.notes}</span>
                      )}
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

  // Standards Page
  const StandardsPage = () => (
    <div style={{...styles.page, pageBreakAfter: 'avoid'}} className="page-break">
      {/* Header */}
      <div style={styles.header}>
        {school?.logo_url && (
          <img src={school.logo_url} alt="Logo" style={styles.headerLogo} />
        )}
        <div style={styles.schoolName}>{school?.name || 'School Name'}</div>
        <div style={styles.schoolInfo}>
          {school?.address && <span>{school.address}</span>}
          {school?.phone && <span> | Tel. {school.phone}</span>}
          {school?.email && <span> | {school.email}</span>}
        </div>
        <div style={styles.planTitle}>
          {lang === 'es' ? 'Planificación del Maestro' : "Teacher's Planning"}
        </div>
      </div>
      
      {/* Info Row */}
      <div style={{...styles.infoRow, marginBottom: '10px', fontSize: '9pt'}}>
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
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', margin: '10px 0', flex: 1}}>
        <div style={{border: '1px solid #000', padding: '8px'}}>
          <div style={{fontWeight: 'bold', fontSize: '10pt', borderBottom: '1.5pt solid #000', paddingBottom: '4px', marginBottom: '8px'}}>
            Standard: First Week
          </div>
          {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
            const standard = getStandardsForWeek(1).find(s => s.domain === domain);
            return (
              <div key={domain} style={{fontSize: '9pt', marginBottom: '4px'}}>
                <Chk checked={standard?.codes?.length > 0} />
                <strong> {STANDARD_LABELS[domain][lang]}</strong>
                {standard?.codes?.length > 0 && (
                  <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>
                )}
              </div>
            );
          })}
          <div style={{border: '1px solid #000', padding: '6px', marginTop: '10px', minHeight: '60px', fontSize: '9pt'}}>
            <strong>Expectations:</strong>
            <div style={{marginTop: '4px'}}>{getExpectationForWeek(1)}</div>
          </div>
        </div>
        
        <div style={{border: '1px solid #000', padding: '8px'}}>
          <div style={{fontWeight: 'bold', fontSize: '10pt', borderBottom: '1.5pt solid #000', paddingBottom: '4px', marginBottom: '8px'}}>
            Standard: Second Week
          </div>
          {['listeningAndSpeaking', 'foundationalSkills', 'reading', 'writing', 'language'].map(domain => {
            const standard = getStandardsForWeek(2).find(s => s.domain === domain);
            return (
              <div key={domain} style={{fontSize: '9pt', marginBottom: '4px'}}>
                <Chk checked={standard?.codes?.length > 0} />
                <strong> {STANDARD_LABELS[domain][lang]}</strong>
                {standard?.codes?.length > 0 && (
                  <span style={{marginLeft: '8px'}}>{standard.codes.join(', ')}</span>
                )}
              </div>
            );
          })}
          <div style={{border: '1px solid #000', padding: '6px', marginTop: '10px', minHeight: '60px', fontSize: '9pt'}}>
            <strong>Expectations:</strong>
            <div style={{marginTop: '4px'}}>{getExpectationForWeek(2)}</div>
          </div>
        </div>
      </div>

      {/* Integration */}
      <div style={{border: '1px solid #000', padding: '8px', margin: '10px 0', fontSize: '9pt'}}>
        <div style={{fontWeight: 'bold', marginBottom: '6px'}}>Integration with other subjects:</div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
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
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '12px'}}>
        <div style={{width: '40%', borderTop: '1px solid #000', paddingTop: '6px', textAlign: 'center', fontSize: '9pt'}}>
          Teacher's Signature / Date
        </div>
        <div style={{width: '40%', borderTop: '1px solid #000', paddingTop: '6px', textAlign: 'center', fontSize: '9pt'}}>
          Principal's Signature / Date
        </div>
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
            <div className="bg-white shadow-lg mb-6 mx-auto print-page" style={{ width: '11in', height: '8.5in', padding: '0.2in', overflow: 'hidden' }}>
              <WeeklyPlanPage
                days={planDays}
                weekNum={1}
                weekStart={plan.week_start}
                weekEnd={plan.week_end}
                objective={plan.objective}
                skills={plan.skills}
              />
            </div>

            {/* Page 2: Week 2 (if exists) */}
            {(plan.week2_start || plan.week2_end) && (
              <div className="bg-white shadow-lg mb-6 mx-auto print-page" style={{ width: '11in', height: '8.5in', padding: '0.2in', overflow: 'hidden' }}>
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
            <div className="bg-white shadow-lg mx-auto print-page" style={{ width: '11in', height: '8.5in', padding: '0.2in', overflow: 'hidden' }}>
              <StandardsPage />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanPrintView;
