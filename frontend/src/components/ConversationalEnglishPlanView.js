import React, { useRef } from 'react';
import { Button } from './ui/button';
import { X, Printer } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * Conversational English Lesson Plan Print View
 * Single-lesson format for Colegio Inmaculada de la Concepcion
 */
const ConversationalEnglishPlanView = ({ plan, classInfo, school, onClose }) => {
  const { language } = useLanguage();
  const printRef = useRef(null);
  const lang = plan?.language || language || 'en';

  // Helper function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '_____';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${month}/${day}/${year}`;
    }
    return dateStr;
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conversational English Lesson Plan</title>
        <style>
          @page { 
            size: letter portrait;
            margin: 0.4in; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt;
            line-height: 1.3;
          }
          .lesson-plan-container {
            width: 100%;
            max-width: 8in;
            margin: 0 auto;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
          }
          td, th { 
            border: 1px solid black; 
            padding: 6px 8px; 
            vertical-align: top; 
          }
          .title-cell {
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
            padding: 10px;
            width: 40px;
          }
          .header-label {
            font-weight: bold;
            font-size: 10pt;
          }
          .input-line {
            border-bottom: 1px solid black;
            min-height: 18px;
            display: inline-block;
            width: calc(100% - 80px);
            margin-left: 5px;
          }
          .large-box {
            min-height: 80px;
            border: 1px solid black;
            padding: 5px;
          }
          .medium-box {
            min-height: 60px;
            border: 1px solid black;
            padding: 5px;
          }
          .small-box {
            min-height: 40px;
            border: 1px solid black;
            padding: 5px;
          }
          .footer-note {
            text-align: right;
            font-size: 8pt;
            font-style: italic;
            margin-top: 10px;
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

  // Extract values from plan or use defaults
  // Note: LessonPlanner.js passes these fields directly: lesson_topic, learning_objectives, etc.
  const teacherName = plan?.teacher_name || classInfo?.teacher_name || '';
  const grade = classInfo?.grade || '';
  const section = classInfo?.section || '';
  const subject = plan?.subject || 'Conversational English';
  const lessonDateFrom = plan?.lesson_date || plan?.week_start || '';
  const lessonDateTo = plan?.lesson_date_end || plan?.week_end || '';
  const lessonTopic = plan?.lesson_topic || plan?.topic || plan?.story || '';
  const learningObjectives = plan?.learning_objectives || plan?.objective || '';
  const materialsNeeded = plan?.materials_text || '';
  const hookIntro = plan?.hook_intro || '';
  const learningGoal = plan?.learning_goal || '';
  const closure = plan?.closure || '';
  const testQuizDate = plan?.test_quiz_date || '';
  const additionalNotes = plan?.additional_notes || '';
  
  // Format date range for display
  const dateRangeDisplay = lessonDateTo 
    ? `${formatDate(lessonDateFrom)} - ${formatDate(lessonDateTo)}`
    : formatDate(lessonDateFrom);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Toolbar */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="font-heading font-semibold text-lg">
            {lang === 'es' ? 'Plan de Inglés Conversacional' : 'Conversational English Lesson Plan'}
          </h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2" data-testid="print-conv-english-btn">
              <Printer className="h-4 w-4" />
              {lang === 'es' ? 'Imprimir' : 'Print'}
            </Button>
            <Button variant="outline" onClick={onClose} data-testid="close-conv-english-btn">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Print Preview */}
        <div className="p-6 bg-slate-100">
          <div ref={printRef} className="bg-white shadow-lg mx-auto" style={{ width: '8.5in', minHeight: '11in', padding: '0.4in' }}>
            <div className="lesson-plan-container">
              {/* School Header */}
              <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                {school?.logo_url && (
                  <img src={school.logo_url} alt="Logo" style={{ height: '45px', objectFit: 'contain', marginBottom: '5px' }} />
                )}
                <div style={{ fontWeight: 'bold', fontSize: '12pt' }}>{school?.name || 'Colegio Inmaculada de la Concepcion'}</div>
                {school?.address && <div style={{ fontSize: '9pt' }}>{school.address}</div>}
              </div>

              {/* Main Layout Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {/* Row 1: LESSON PLAN title + Header fields */}
                  <tr>
                    <td rowSpan="3" style={{ 
                      writingMode: 'vertical-rl', 
                      textOrientation: 'mixed', 
                      transform: 'rotate(180deg)',
                      fontSize: '18pt',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      padding: '10px',
                      width: '45px',
                      border: '1px solid black',
                      verticalAlign: 'middle'
                    }}>
                      LESSON PLAN
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>Teacher:</span>
                      <span style={{ marginLeft: '10px' }}>{teacherName || '_____________________'}</span>
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px', width: '25%' }}>
                      <span style={{ fontWeight: 'bold' }}>Grade:</span>
                      <span style={{ marginLeft: '10px' }}>{grade}{section ? `-${section}` : ''}</span>
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px', width: '25%' }}>
                      <span style={{ fontWeight: 'bold' }}>Date:</span>
                      <span style={{ marginLeft: '10px' }}>{dateRangeDisplay || '_____________________'}</span>
                    </td>
                  </tr>
                  {/* Row 2: Subject */}
                  <tr>
                    <td colSpan="3" style={{ border: '1px solid black', padding: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>Subject:</span>
                      <span style={{ marginLeft: '10px' }}>{subject}</span>
                    </td>
                  </tr>
                  {/* Row 3: Lesson Topic */}
                  <tr>
                    <td colSpan="3" style={{ border: '1px solid black', padding: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>Lesson Topic:</span>
                      <span style={{ marginLeft: '10px' }}>{lessonTopic || '_____________________'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Learning Objectives */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '-1px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Learning Objective/s:</div>
                      <div style={{ minHeight: '30px', paddingLeft: '10px' }}>{learningObjectives}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Materials + Hook/Intro - Two columns */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '-1px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '8px', width: '50%', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Materials needed:</div>
                      <div style={{ minHeight: '80px', paddingLeft: '10px' }}>{materialsNeeded}</div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px', width: '50%', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Hook/Intro</div>
                      <div style={{ minHeight: '80px', paddingLeft: '10px' }}>{hookIntro}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Learning Goal */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '-1px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Learning Goal:</div>
                      <div style={{ minHeight: '100px', paddingLeft: '10px' }}>{learningGoal}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Closure */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '-1px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '8px' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Closure:</div>
                      <div style={{ minHeight: '60px', paddingLeft: '10px' }}>{closure}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Date of Test/Quiz + Additional Notes - Two columns */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '-1px' }}>
                <tbody>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '8px', width: '35%', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Date of Test/Quiz:</div>
                      <div style={{ paddingLeft: '10px' }}>{formatDate(testQuizDate)}</div>
                    </td>
                    <td style={{ border: '1px solid black', padding: '8px', width: '65%', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Additional Notes:</div>
                      <div style={{ minHeight: '40px', paddingLeft: '10px' }}>{additionalNotes}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Footer */}
              <div style={{ textAlign: 'right', fontSize: '8pt', fontStyle: 'italic', marginTop: '15px' }}>
                Subject to Change
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationalEnglishPlanView;
