import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, HelpCircle, MessageSquare, Send, Clock } from 'lucide-react';
import LanguageSelector from '../components/LanguageSelector';

const Contact = () => {
  const { t, language } = useLanguage();
  const isEs = language === 'es';
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const API_URL = window.location.origin;
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(isEs 
          ? 'Mensaje enviado. Nos pondremos en contacto pronto.' 
          : 'Message sent. We\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        toast.error(data.detail || (isEs ? 'Error al enviar mensaje' : 'Failed to send message'));
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error(isEs ? 'Error al enviar mensaje' : 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/logo.png"
              alt="TeacherHubPro Logo"
              className="h-10 w-10 object-contain"
            />
            <span className="text-xl font-bold text-slate-900">TeacherHubPro</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSelector />
            <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800">
              <ArrowLeft className="h-4 w-4" />
              {t('landingBackToHome') || (language === 'es' ? 'Volver al inicio' : 'Back to home')}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-3">
            {t('contactTitle')}
          </h1>
          <p className="text-slate-600 max-w-lg mx-auto">
            {isEs 
              ? '¿Tienes preguntas? Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.'
              : 'Have questions? We\'re here to help. Send us a message and we\'ll get back to you as soon as possible.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                {t('contactSendMessage')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contactName')}</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder={language === 'es' ? 'Tu nombre' : 'Your name'}
                    data-testid="contact-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('contactEmail')}</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    placeholder={language === 'es' ? 'tu@email.com' : 'you@email.com'}
                    data-testid="contact-email-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contactSubject')}</Label>
                  <Input 
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    required
                    placeholder={language === 'es' ? '¿En qué podemos ayudarte?' : 'How can we help?'}
                    data-testid="contact-subject-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contactMessage')}</Label>
                  <Textarea 
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    rows={5}
                    required
                    placeholder={language === 'es' ? 'Cuéntanos más detalles...' : 'Tell us more details...'}
                    data-testid="contact-message-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-lime-500 hover:bg-lime-600 text-slate-900 font-medium" 
                  disabled={submitting}
                  data-testid="contact-submit-btn"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {submitting 
                    ? (isEs ? 'Enviando...' : 'Sending...') 
                    : (isEs ? 'Enviar mensaje' : 'Send message')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-6">
            {/* Email Support */}
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {t('contactEmailSupport')}
                    </h3>
                    <a 
                      href="mailto:support@teacherhubpro.com" 
                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      data-testid="support-email-link"
                    >
                      support@teacherhubpro.com
                    </a>
                    <p className="text-sm text-slate-500 mt-1">
                      {isEs ? 'Para consultas generales y soporte técnico' : 'For general inquiries and technical support'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {isEs ? 'Tiempo de Respuesta' : 'Response Time'}
                    </h3>
                    <p className="text-slate-600">
                      {isEs ? 'Normalmente respondemos dentro de 24-48 horas' : 'We typically respond within 24-48 hours'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {isEs ? 'Lunes a Viernes' : 'Monday through Friday'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Center */}
            <Card className="border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {t('contactHelpCenter')}
                    </h3>
                    <p className="text-slate-600 mb-2">
                      {isEs ? 'Encuentra respuestas rápidas a preguntas frecuentes' : 'Find quick answers to common questions'}
                    </p>
                    <Link 
                      to="/help" 
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                    >
                      {isEs ? 'Visitar Centro de Ayuda →' : 'Visit Help Center →'}
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Notice */}
            <div className="bg-slate-100 rounded-lg p-4 text-center">
              <p className="text-sm text-slate-600">
                {isEs 
                  ? '¿Necesitas ayuda urgente? Nuestro equipo de soporte está comprometido a ayudarte a tener éxito en tu enseñanza.'
                  : 'Need urgent help? Our support team is committed to helping you succeed in your teaching.'}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-8 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <img 
              src="/logo.png"
              alt="TeacherHubPro"
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold text-slate-900">TeacherHubPro</span>
          </Link>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} TeacherHubPro. {isEs ? 'Todos los derechos reservados.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
