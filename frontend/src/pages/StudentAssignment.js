import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  BookOpen,
  GraduationCap,
  Download,
  Paperclip,
  Plus,
  Trash2,
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

// Use window.location.origin for production compatibility
const API_URL = window.location.origin;

const StudentAssignment = () => {
  const { token } = useParams();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [answers, setAnswers] = useState({});
  // PDF answer fields for file-only assignments
  const [pdfAnswers, setPdfAnswers] = useState([{ id: 1, value: '' }]);

  // Fetch assignment
  useEffect(() => {
    const fetchAssignment = async () => {
      const apiUrl = `${API_URL}/api/ai-grading/student/${token}`;
      console.log('Fetching assignment from:', apiUrl);
      
      try {
        const res = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        console.log('Response status:', res.status);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Assignment not found or link has expired.');
          } else {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to load assignment: ${res.status}`);
          }
          return;
        }
        const data = await res.json();
        console.log('Assignment loaded:', data.title);
        setAssignment(data);
        
        // Initialize answers
        const initialAnswers = {};
        data.questions.forEach(q => {
          initialAnswers[q.question_id] = '';
        });
        setAnswers(initialAnswers);
      } catch (err) {
        console.error('Fetch error:', err);
        console.error('API URL was:', `${API_URL}/api/ai-grading/student/${token}`);
        setError(`Failed to load assignment. Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [token]);

  // Handle answer change
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Check if this is a PDF-only assignment (has attachments, no questions)
  const hasPdfAttachments = assignment?.attachments?.some(f => 
    f.filename?.toLowerCase().endsWith('.pdf') || f.content_type === 'application/pdf'
  );
  const isPdfOnlyAssignment = hasPdfAttachments && (!assignment?.questions || assignment.questions.length === 0);

  // Submit assignment
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!studentName.trim() || !studentEmail.trim()) {
      toast.error('Please enter your name and email');
      return;
    }

    let submissionAnswers = answers;

    if (isPdfOnlyAssignment) {
      // For PDF-only assignments, validate that at least one answer is filled
      const filledAnswers = pdfAnswers.filter(a => a.value.trim());
      if (filledAnswers.length === 0) {
        toast.error('Please provide at least one answer');
        return;
      }
      // Convert PDF answers to a dict keyed by answer number
      submissionAnswers = {};
      pdfAnswers.forEach(a => {
        if (a.value.trim()) {
          submissionAnswers[`answer_${a.id}`] = a.value.trim();
        }
      });
    } else {
      // Check if all questions are answered
      const questionList = assignment.questions || [];
      if (questionList.length === 0) return;
      
      const unanswered = questionList.filter(q => {
        const ans = answers[q.question_id];
        if (!ans) return true;
        // Matching questions store answers as objects
        if (q.question_type === 'matching') {
          return typeof ans !== 'object' || Object.keys(ans).length === 0;
        }
        return typeof ans === 'string' && !ans.trim();
      });
      if (unanswered.length > 0) {
        toast.error(`Please answer all questions (${unanswered.length} remaining)`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-grading/student/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_email: studentEmail,
          answers: submissionAnswers
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Submission failed');
      }

      setSubmitted(true);
      toast.success('Assignment submitted successfully!');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render question based on type
  const renderQuestion = (question, index) => {
    const { question_id, question_type, question_text, points, options, left_items, right_items, instructions } = question;

    return (
      <Card key={question_id} className="mb-4" data-testid={`question-${question_id}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">
              {index + 1}. {question_text}
            </CardTitle>
            <Badge variant="outline" className="ml-2 shrink-0">
              {points} pts
            </Badge>
          </div>
          {instructions && (
            <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100" data-testid={`question-instructions-${question_id}`}>
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-700">{instructions}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Multiple Choice */}
          {question_type === 'multiple_choice' && (
            <div className="space-y-2">
              {options?.map((opt, idx) => (
                <label
                  key={idx}
                  className={cn(
                    "flex items-center p-3 rounded-lg border cursor-pointer transition-colors",
                    answers[question_id] === opt.text 
                      ? "border-violet-500 bg-violet-50" 
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <input
                    type="radio"
                    name={question_id}
                    value={opt.text}
                    checked={answers[question_id] === opt.text}
                    onChange={(e) => handleAnswerChange(question_id, e.target.value)}
                    className="mr-3 w-4 h-4 text-violet-600"
                  />
                  <span className="text-slate-700">{opt.text}</span>
                </label>
              ))}
            </div>
          )}

          {/* True/False */}
          {question_type === 'true_false' && (
            <div className="flex gap-4">
              {['True', 'False'].map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex-1 flex items-center justify-center p-4 rounded-lg border cursor-pointer transition-colors",
                    answers[question_id] === opt 
                      ? "border-violet-500 bg-violet-50" 
                      : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <input
                    type="radio"
                    name={question_id}
                    value={opt}
                    checked={answers[question_id] === opt}
                    onChange={(e) => handleAnswerChange(question_id, e.target.value)}
                    className="mr-2 w-4 h-4 text-violet-600"
                  />
                  <span className="font-medium text-slate-700">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* Short Answer */}
          {question_type === 'short_answer' && (
            <Input
              value={answers[question_id] || ''}
              onChange={(e) => handleAnswerChange(question_id, e.target.value)}
              placeholder="Type your answer..."
              className="w-full"
            />
          )}

          {/* Fill in the Blank */}
          {question_type === 'fill_blank' && (
            <Input
              value={answers[question_id] || ''}
              onChange={(e) => handleAnswerChange(question_id, e.target.value)}
              placeholder="Fill in the blank..."
              className="w-full"
            />
          )}

          {/* Essay */}
          {question_type === 'essay' && (
            <Textarea
              value={answers[question_id] || ''}
              onChange={(e) => handleAnswerChange(question_id, e.target.value)}
              placeholder="Write your essay response..."
              className="w-full min-h-[200px]"
            />
          )}

          {/* Matching */}
          {question_type === 'matching' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-3">Match items from the left column to the right column</p>
              {left_items?.map((left, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="w-1/3 p-2 bg-slate-100 rounded">{left}</span>
                  <span className="text-slate-400">→</span>
                  <select
                    value={answers[question_id]?.[left] || ''}
                    onChange={(e) => {
                      const newMatches = { ...(answers[question_id] || {}), [left]: e.target.value };
                      handleAnswerChange(question_id, newMatches);
                    }}
                    className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                  >
                    <option value="">Select match...</option>
                    {right_items?.map((right, ridx) => (
                      <option key={ridx} value={right}>{right}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-600">Loading assignment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Assignment Not Found</h1>
            <p className="text-slate-600 mb-4">{error}</p>
            <p className="text-xs text-slate-400">API: {API_URL}</p>
            <p className="text-xs text-slate-400">Token: {token}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full" data-testid="submission-success">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Assignment Submitted!</h1>
            <p className="text-slate-600 mb-4">
              Your assignment has been submitted successfully. Your teacher will review and grade it soon.
            </p>
            <p className="text-sm text-slate-500">
              A confirmation has been sent to {studentEmail}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Assignment form
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Card className="mb-6" data-testid="assignment-header">
          <CardHeader>
            <div className="flex items-start gap-4">
              {assignment.school_logo_url ? (
                <img 
                  src={assignment.school_logo_url} 
                  alt={assignment.school_name || 'School'}
                  className="w-16 h-16 object-contain rounded-xl border bg-white p-1"
                  data-testid="school-logo"
                />
              ) : (
                <div className="p-3 bg-violet-100 rounded-xl">
                  <GraduationCap className="w-8 h-8 text-violet-600" />
                </div>
              )}
              <div className="flex-1">
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <CardDescription className="mt-1">
                  {assignment.school_name && <span className="font-medium">{assignment.school_name} — </span>}
                  {assignment.class_name}
                </CardDescription>
                {assignment.description && (
                  <p className="text-slate-600 mt-2">{assignment.description}</p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              {assignment.questions?.length > 0 && (
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="w-4 h-4" />
                  <span>{assignment.questions.length} questions</span>
                </div>
              )}
              {isPdfOnlyAssignment && (
                <div className="flex items-center gap-2 text-slate-600">
                  <FileText className="w-4 h-4" />
                  <span>PDF-based test</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <BookOpen className="w-4 h-4" />
                <span>{assignment.total_points} total points</span>
              </div>
              {assignment.due_date && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4" />
                  <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            {assignment.instructions && (
              <div className="mt-4 p-4 bg-violet-50 rounded-lg">
                <h4 className="font-medium text-violet-800 mb-2">Instructions</h4>
                <p className="text-slate-700">{assignment.instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* File Attachments - Inline PDF Viewer */}
        {assignment.attachments && assignment.attachments.length > 0 && (
          <Card className="mb-6" data-testid="assignment-attachments">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-slate-500" />
                {isPdfOnlyAssignment ? 'Test Document' : 'Attached Files'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignment.attachments.map((file, idx) => {
                  const isPdf = file.filename?.toLowerCase().endsWith('.pdf') || file.content_type === 'application/pdf';
                  const fileUrl = `${API_URL}${file.file_url}`;
                  
                  if (isPdf) {
                    return (
                      <div key={idx} data-testid={`pdf-viewer-${idx}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-red-500" />
                            {file.filename}
                          </p>
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </a>
                        </div>
                        <iframe
                          src={fileUrl}
                          title={file.filename}
                          className="w-full border rounded-lg bg-white"
                          style={{ height: '600px' }}
                          data-testid={`pdf-iframe-${idx}`}
                        />
                      </div>
                    );
                  }
                  
                  // Non-PDF files - show as download links
                  return (
                    <a
                      key={idx}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border hover:bg-slate-100 transition-colors"
                      data-testid={`attachment-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{file.filename}</p>
                          <p className="text-xs text-slate-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-slate-400" />
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* PDF-Only Answer Area */}
        {isPdfOnlyAssignment && (
          <Card className="mb-6" data-testid="pdf-answer-area">
            <CardHeader>
              <CardTitle className="text-lg">Your Answers</CardTitle>
              <CardDescription>Review the test document above and enter your answers below.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pdfAnswers.map((answer, idx) => (
                  <div key={answer.id} className="flex items-start gap-3" data-testid={`pdf-answer-row-${answer.id}`}>
                    <span className="mt-2 w-8 h-8 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 text-sm font-bold shrink-0">
                      {answer.id}
                    </span>
                    <Input
                      value={answer.value}
                      onChange={(e) => {
                        setPdfAnswers(prev => prev.map(a => 
                          a.id === answer.id ? { ...a, value: e.target.value } : a
                        ));
                      }}
                      placeholder={`Answer ${answer.id}...`}
                      className="flex-1"
                      data-testid={`pdf-answer-input-${answer.id}`}
                    />
                    {pdfAnswers.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-slate-400 hover:text-red-500"
                        onClick={() => setPdfAnswers(prev => prev.filter(a => a.id !== answer.id))}
                        data-testid={`pdf-answer-remove-${answer.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  const nextId = pdfAnswers.length > 0 ? Math.max(...pdfAnswers.map(a => a.id)) + 1 : 1;
                  setPdfAnswers(prev => [...prev, { id: nextId, value: '' }]);
                }}
                data-testid="pdf-add-answer-btn"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Answer
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Student Info Form */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6" data-testid="student-info-form">
            <CardHeader>
              <CardTitle className="text-lg">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studentName">Full Name *</Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    data-testid="student-name-input"
                  />
                </div>
                <div>
                  <Label htmlFor="studentEmail">Email *</Label>
                  <Input
                    id="studentEmail"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    data-testid="student-email-input"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {assignment.questions && assignment.questions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Questions</h2>
              {assignment.questions.map((q, idx) => renderQuestion(q, idx))}
            </div>
          )}

          {/* Submit Button - show for questions OR pdf-only assignments */}
          {((assignment.questions && assignment.questions.length > 0) || isPdfOnlyAssignment) && (
            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="bg-violet-600 hover:bg-violet-700"
                data-testid="submit-assignment-btn"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          )}

          {/* File-only assignment message (non-PDF or no submission expected) */}
          {(!assignment.questions || assignment.questions.length === 0) && !isPdfOnlyAssignment && (
            <Card className="mt-4">
              <CardContent className="pt-6 text-center text-slate-500">
                <p>This assignment has no online questions. Please review the attached files above.</p>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
};

export default StudentAssignment;
