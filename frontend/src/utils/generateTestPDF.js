import jsPDF from 'jspdf';

/**
 * Generate a formatted test PDF (Student Version or Answer Key)
 * @param {Object} testData - { title, description, questions, points, dueDate, teacherName, className }
 * @param {Object} options - { isAnswerKey: false }
 * @returns {jsPDF} doc instance
 */
export function generateTestPDF(testData, options = {}) {
  const { isAnswerKey = false } = options;
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPage = (needed = 20) => {
    if (y + needed > 260) {
      doc.addPage();
      y = 18;
    }
  };

  // ── Header ──
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(testData.title || 'Test', contentWidth);
  doc.text(titleLines, pageWidth / 2, y, { align: 'center' });
  y += titleLines.length * 8;

  // Answer Key banner
  if (isAnswerKey) {
    doc.setFillColor(220, 53, 69);
    doc.roundedRect(pageWidth / 2 - 28, y - 5, 56, 9, 2, 2, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ANSWER KEY', pageWidth / 2, y + 1, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    y += 10;
  }

  // Divider
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // ── Info Row ──
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (testData.teacherName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Teacher:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(testData.teacherName, margin + 18, y);
  }
  if (testData.className) {
    doc.setFont('helvetica', 'bold');
    doc.text('Class:', pageWidth / 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(testData.className, pageWidth / 2 + 14, y);
  }
  y += 6;

  if (testData.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(testData.dueDate, margin + 13, y);
  }

  const totalPts = testData.points || testData.questions?.reduce((s, q) => s + (q.points || 0), 0) || 0;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Points:', pageWidth / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(totalPts), pageWidth / 2 + 28, y);
  y += 8;

  // Student name line (student version only)
  if (!isAnswerKey) {
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(margin + 15, y + 1, pageWidth - margin, y + 1);
    y += 8;
  }

  // Description / Instructions
  if (testData.description) {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const descLines = doc.splitTextToSize(testData.description, contentWidth);
    doc.text(descLines, margin, y);
    y += descLines.length * 4.5 + 4;
  }

  // Divider before questions
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Questions ──
  const questions = testData.questions || [];
  questions.forEach((q, idx) => {
    checkPage(30);

    // Question number + text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const qLabel = `${idx + 1}. `;
    const labelW = doc.getTextWidth(qLabel);
    doc.text(qLabel, margin, y);

    doc.setFont('helvetica', 'normal');
    const qTextLines = doc.splitTextToSize(
      `${q.question_text || ''}  (${q.points || 0} pts)`,
      contentWidth - labelW - 2
    );
    doc.text(qTextLines, margin + labelW, y);
    y += qTextLines.length * 5.5 + 3;

    const indent = margin + 8;

    switch (q.question_type) {
      case 'multiple_choice': {
        const opts = q.options || [];
        opts.forEach((opt, oIdx) => {
          checkPage(8);
          const letter = String.fromCharCode(65 + oIdx);
          const cx = indent + 3;
          const cy = y - 1.2;

          if (isAnswerKey && opt.is_correct) {
            // Filled green circle
            doc.setFillColor(34, 139, 34);
            doc.circle(cx, cy, 2.8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(letter, cx, cy + 1, { align: 'center' });
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(`${opt.text || ''}`, indent + 9, y);
            doc.setFont('helvetica', 'normal');
          } else {
            // Empty circle
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.4);
            doc.circle(cx, cy, 2.8);
            doc.setFontSize(8);
            doc.text(letter, cx, cy + 1, { align: 'center' });
            doc.setFontSize(10);
            doc.text(`${opt.text || ''}`, indent + 9, y);
          }
          y += 7;
        });
        break;
      }

      case 'true_false': {
        checkPage(10);
        const opts = q.options || [{ text: 'True', is_correct: false }, { text: 'False', is_correct: false }];
        const trueOpt = opts[0];
        const falseOpt = opts[1];

        // True bubble
        const trueCorrect = isAnswerKey && trueOpt?.is_correct;
        if (trueCorrect) {
          doc.setFillColor(34, 139, 34);
          doc.circle(indent + 3, y - 1.2, 2.8, 'F');
        } else {
          doc.setDrawColor(100, 100, 100);
          doc.circle(indent + 3, y - 1.2, 2.8);
        }
        doc.setFontSize(10);
        doc.setFont('helvetica', trueCorrect ? 'bold' : 'normal');
        doc.text('True', indent + 9, y);

        // False bubble
        const falseCorrect = isAnswerKey && falseOpt?.is_correct;
        if (falseCorrect) {
          doc.setFillColor(34, 139, 34);
          doc.circle(indent + 38, y - 1.2, 2.8, 'F');
        } else {
          doc.setDrawColor(100, 100, 100);
          doc.circle(indent + 38, y - 1.2, 2.8);
        }
        doc.setFont('helvetica', falseCorrect ? 'bold' : 'normal');
        doc.text('False', indent + 44, y);
        doc.setFont('helvetica', 'normal');
        y += 8;
        break;
      }

      case 'short_answer': {
        checkPage(10);
        if (isAnswerKey && q.correct_answer) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(34, 139, 34);
          doc.text(`Answer: ${q.correct_answer}`, indent, y);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          y += 7;
        } else {
          doc.setFontSize(10);
          doc.text('Answer:', indent, y);
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.3);
          doc.line(indent + 17, y + 1, pageWidth - margin, y + 1);
          y += 9;
          // Second blank line
          doc.line(indent, y + 1, pageWidth - margin, y + 1);
          y += 7;
        }
        break;
      }

      case 'essay': {
        if (isAnswerKey) {
          doc.setFontSize(9);
          doc.setTextColor(128, 128, 128);
          doc.setFont('helvetica', 'italic');
          doc.text('(Graded manually by teacher)', indent, y);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          y += 7;
        } else {
          // Draw lined writing space
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.25);
          for (let i = 0; i < 8; i++) {
            checkPage(8);
            y += 7;
            doc.line(indent, y, pageWidth - margin, y);
          }
          doc.setDrawColor(0, 0, 0);
          y += 5;
        }
        break;
      }

      default:
        break;
    }

    y += 5; // spacing between questions
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.setTextColor(0, 0, 0);
  }

  return doc;
}

/**
 * Open test PDF in new browser tab for preview & print
 */
export function previewTestPDF(testData, options = {}) {
  const doc = generateTestPDF(testData, options);
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl, '_blank');
}

/**
 * Download test PDF
 */
export function downloadTestPDF(testData, options = {}) {
  const { isAnswerKey = false } = options;
  const doc = generateTestPDF(testData, options);
  const suffix = isAnswerKey ? '_answer_key' : '_student';
  const safeName = (testData.title || 'test').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
  doc.save(`${safeName}${suffix}.pdf`);
}
