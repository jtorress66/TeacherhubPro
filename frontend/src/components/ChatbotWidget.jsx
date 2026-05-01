import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, ChevronDown, User, ArrowRight } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

// Translations for chatbot UI (keyed by language code)
const CHATBOT_STRINGS = {
  en: {
    greeting: "Hi there! I'm Ed, your TeacherHubPro assistant. I can help you explore features, answer questions, or get you started with a free trial. Which best describes you?",
    interest_prompt: "Great! What are you most interested in today?",
    interest_fallback: "I'd be happy to help with that! Feel free to ask me anything.",
    lead_prompt: "By the way, I'd love to make sure our team can follow up with you. Would you like to share your contact info? It only takes a moment.",
    error_msg: "I'm sorry, I'm having trouble connecting. You can reach our team at the Contact page.",
    lead_accept: "Sure, happy to!",
    lead_decline: "No thanks",
    lead_success: "Thank you! Our team will be in touch. Is there anything else I can help with?",
    lead_error: "Sorry, there was an issue. You can reach us at our Contact page.",
    type_msg: "Type a message...",
    title: "Ed",
    subtitle: "TeacherHubPro Assistant",
    first_name: "First Name *",
    last_name: "Last Name",
    email: "Email *",
    school: "School / Organization",
    role_title: "Your Role",
    submit: "Submit",
    roles: ["Teacher", "Tutor", "Homeschool Educator", "School Administrator", "District / Enterprise", "Other"],
    interests: ["Lesson Planning", "Grading & Gradebook", "AI Tools", "Attendance", "Pricing", "School / District Solution", "Book a Demo", "General Questions"]
  },
  es: {
    greeting: "¡Hola! Soy Ed, tu asistente de TeacherHubPro. Puedo ayudarte a explorar funciones, responder preguntas o comenzar con una prueba gratuita. ¿Cuál te describe mejor?",
    interest_prompt: "¡Genial! ¿Qué te interesa más hoy?",
    interest_fallback: "¡Con gusto te ayudo! Pregúntame lo que quieras.",
    lead_prompt: "Por cierto, me encantaría que nuestro equipo pueda contactarte. ¿Te gustaría compartir tu información de contacto? Solo toma un momento.",
    error_msg: "Lo siento, tengo problemas de conexión. Puedes contactarnos en la página de Contacto.",
    lead_accept: "¡Claro, con gusto!",
    lead_decline: "No, gracias",
    lead_success: "¡Gracias! Nuestro equipo se pondrá en contacto. ¿Hay algo más en lo que pueda ayudarte?",
    lead_error: "Lo siento, hubo un problema. Puedes contactarnos en la página de Contacto.",
    type_msg: "Escribe un mensaje...",
    title: "Ed",
    subtitle: "Asistente de TeacherHubPro",
    first_name: "Nombre *",
    last_name: "Apellido",
    email: "Correo electrónico *",
    school: "Escuela / Organización",
    role_title: "Tu rol",
    submit: "Enviar",
    roles: ["Profesor(a)", "Tutor(a)", "Educador(a) en casa", "Administrador(a) escolar", "Distrito / Empresa", "Otro"],
    interests: ["Planificación de clases", "Calificaciones", "Herramientas de IA", "Asistencia", "Precios", "Solución escolar / distrito", "Agendar una demo", "Preguntas generales"]
  },
  fr: {
    greeting: "Bonjour ! Je suis Ed, votre assistant TeacherHubPro. Je peux vous aider à découvrir nos fonctionnalités, répondre à vos questions ou commencer un essai gratuit. Qu'est-ce qui vous décrit le mieux ?",
    interest_prompt: "Super ! Qu'est-ce qui vous intéresse le plus aujourd'hui ?",
    interest_fallback: "Je serai ravi de vous aider ! N'hésitez pas à me poser vos questions.",
    lead_prompt: "Au fait, j'aimerais m'assurer que notre équipe puisse vous recontacter. Souhaitez-vous partager vos coordonnées ? Cela ne prend qu'un instant.",
    error_msg: "Désolé, j'ai un problème de connexion. Vous pouvez nous joindre sur la page Contact.",
    lead_accept: "Bien sûr, avec plaisir !",
    lead_decline: "Non merci",
    lead_success: "Merci ! Notre équipe vous contactera. Puis-je vous aider avec autre chose ?",
    lead_error: "Désolé, il y a eu un problème. Vous pouvez nous contacter via la page Contact.",
    type_msg: "Écrivez un message...",
    title: "Ed",
    subtitle: "Assistant TeacherHubPro",
    first_name: "Prénom *",
    last_name: "Nom",
    email: "E-mail *",
    school: "École / Organisation",
    role_title: "Votre rôle",
    submit: "Envoyer",
    roles: ["Enseignant(e)", "Tuteur/Tutrice", "Éducateur à domicile", "Administrateur scolaire", "District / Entreprise", "Autre"],
    interests: ["Planification des cours", "Notes et bulletins", "Outils IA", "Présences", "Tarifs", "Solution école / district", "Réserver une démo", "Questions générales"]
  },
  pt: {
    greeting: "Olá! Sou o Ed, seu assistente TeacherHubPro. Posso ajudá-lo a explorar recursos, responder perguntas ou começar com um teste gratuito. O que melhor descreve você?",
    interest_prompt: "Ótimo! O que mais interessa você hoje?",
    interest_fallback: "Ficarei feliz em ajudar! Pergunte o que quiser.",
    lead_prompt: "A propósito, adoraria garantir que nossa equipe possa entrar em contato. Gostaria de compartilhar suas informações? Leva apenas um momento.",
    error_msg: "Desculpe, estou com problemas de conexão. Você pode nos contatar na página de Contato.",
    lead_accept: "Claro, com prazer!",
    lead_decline: "Não, obrigado",
    lead_success: "Obrigado! Nossa equipe entrará em contato. Posso ajudar com mais alguma coisa?",
    lead_error: "Desculpe, houve um problema. Você pode nos contatar na página de Contato.",
    type_msg: "Digite uma mensagem...",
    title: "Ed",
    subtitle: "Assistente TeacherHubPro",
    first_name: "Nome *",
    last_name: "Sobrenome",
    email: "E-mail *",
    school: "Escola / Organização",
    role_title: "Seu cargo",
    submit: "Enviar",
    roles: ["Professor(a)", "Tutor(a)", "Educador domiciliar", "Administrador escolar", "Distrito / Empresa", "Outro"],
    interests: ["Planejamento de aulas", "Notas e boletins", "Ferramentas de IA", "Frequência", "Preços", "Solução escolar / distrito", "Agendar uma demo", "Perguntas gerais"]
  },
  de: {
    greeting: "Hallo! Ich bin Ed, Ihr TeacherHubPro-Assistent. Ich kann Ihnen helfen, Funktionen zu entdecken, Fragen zu beantworten oder eine kostenlose Testversion zu starten. Was beschreibt Sie am besten?",
    interest_prompt: "Großartig! Was interessiert Sie heute am meisten?",
    interest_fallback: "Ich helfe Ihnen gerne! Fragen Sie mich einfach.",
    lead_prompt: "Übrigens, ich würde gerne sicherstellen, dass unser Team Sie kontaktieren kann. Möchten Sie Ihre Kontaktdaten teilen? Es dauert nur einen Moment.",
    error_msg: "Entschuldigung, ich habe Verbindungsprobleme. Sie können uns über die Kontaktseite erreichen.",
    lead_accept: "Klar, gerne!",
    lead_decline: "Nein, danke",
    lead_success: "Vielen Dank! Unser Team wird sich melden. Kann ich Ihnen noch bei etwas anderem helfen?",
    lead_error: "Entschuldigung, es gab ein Problem. Sie können uns über die Kontaktseite erreichen.",
    type_msg: "Nachricht eingeben...",
    title: "Ed",
    subtitle: "TeacherHubPro-Assistent",
    first_name: "Vorname *",
    last_name: "Nachname",
    email: "E-Mail *",
    school: "Schule / Organisation",
    role_title: "Ihre Rolle",
    submit: "Senden",
    roles: ["Lehrer/in", "Tutor/in", "Homeschool-Erzieher/in", "Schuladministrator/in", "Bezirk / Unternehmen", "Andere"],
    interests: ["Unterrichtsplanung", "Noten & Zeugnisse", "KI-Tools", "Anwesenheit", "Preise", "Schul-/Bezirkslösung", "Demo buchen", "Allgemeine Fragen"]
  },
  it: {
    greeting: "Ciao! Sono Ed, il tuo assistente TeacherHubPro. Posso aiutarti a esplorare le funzionalità, rispondere alle domande o iniziare una prova gratuita. Cosa ti descrive meglio?",
    interest_prompt: "Ottimo! Cosa ti interessa di più oggi?",
    interest_fallback: "Sarò felice di aiutarti! Chiedimi pure quello che vuoi.",
    lead_prompt: "A proposito, mi piacerebbe assicurarmi che il nostro team possa ricontattarti. Vuoi condividere i tuoi dati di contatto? Ci vuole solo un momento.",
    error_msg: "Mi dispiace, ho problemi di connessione. Puoi contattarci dalla pagina Contatti.",
    lead_accept: "Certo, volentieri!",
    lead_decline: "No, grazie",
    lead_success: "Grazie! Il nostro team ti contatterà. C'è altro in cui posso aiutarti?",
    lead_error: "Mi dispiace, c'è stato un problema. Puoi contattarci dalla pagina Contatti.",
    type_msg: "Scrivi un messaggio...",
    title: "Ed",
    subtitle: "Assistente TeacherHubPro",
    first_name: "Nome *",
    last_name: "Cognome",
    email: "E-mail *",
    school: "Scuola / Organizzazione",
    role_title: "Il tuo ruolo",
    submit: "Invia",
    roles: ["Insegnante", "Tutor", "Educatore domestico", "Amministratore scolastico", "Distretto / Azienda", "Altro"],
    interests: ["Pianificazione lezioni", "Voti e pagelle", "Strumenti IA", "Presenze", "Prezzi", "Soluzione scuola / distretto", "Prenota una demo", "Domande generali"]
  },
  zh: {
    greeting: "您好！我是 Ed，您的 TeacherHubPro 助手。我可以帮助您探索功能、回答问题或开始免费试用。哪个最能描述您？",
    interest_prompt: "太好了！您今天最感兴趣的是什么？",
    interest_fallback: "很乐意帮助您！请随时问我任何问题。",
    lead_prompt: "顺便说一下，我很希望我们的团队能跟进联系您。您愿意分享您的联系方式吗？只需要一会儿。",
    error_msg: "抱歉，连接出现问题。您可以通过联系页面与我们取得联系。",
    lead_accept: "好的，很乐意！",
    lead_decline: "不用了，谢谢",
    lead_success: "谢谢！我们的团队会与您联系。还有其他我可以帮助您的吗？",
    lead_error: "抱歉，出现了问题。您可以通过联系页面与我们联系。",
    type_msg: "输入消息...",
    title: "Ed",
    subtitle: "TeacherHubPro 助手",
    first_name: "名字 *",
    last_name: "姓氏",
    email: "电子邮件 *",
    school: "学校 / 组织",
    role_title: "您的角色",
    submit: "提交",
    roles: ["教师", "辅导员", "家庭教育者", "学校管理员", "学区 / 企业", "其他"],
    interests: ["课程规划", "成绩与成绩单", "AI 工具", "考勤", "价格", "学校/学区方案", "预约演示", "常见问题"]
  }
};

const ROLE_VALUES = ["teacher", "tutor", "homeschool", "administrator", "district", "other"];
const INTEREST_VALUES = ["lesson_planning", "grading", "ai_tools", "attendance", "pricing", "school_solution", "demo", "general"];

function generateSessionId() {
  return "chat_" + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
}

const ChatbotWidget = () => {
  const { language } = useLanguage();
  const str = CHATBOT_STRINGS[language] || CHATBOT_STRINGS.en;
  const roleOptions = str.roles.map((label, i) => ({ label, value: ROLE_VALUES[i] }));
  const interestOptions = str.interests.map((label, i) => ({ label, value: INTEREST_VALUES[i] }));

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem("thp_chat_session");
    return stored || generateSessionId();
  });
  const [step, setStep] = useState("greeting"); // greeting, role, interest, chat, lead_form, done
  const [visitorRole, setVisitorRole] = useState("");
  const [visitorInterest, setVisitorInterest] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [showBubblePulse, setShowBubblePulse] = useState(false);
  const [leadForm, setLeadForm] = useState({
    first_name: "", last_name: "", email: "", school_org: "",
    role_title: "", phone: "", interest: ""
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist session
  useEffect(() => {
    sessionStorage.setItem("thp_chat_session", sessionId);
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, step]);

  // Auto-greet after 5 seconds
  useEffect(() => {
    if (hasGreeted) return;
    const timer = setTimeout(() => {
      setShowBubblePulse(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasGreeted]);

  // Update greeting message when language changes
  useEffect(() => {
    if (messages.length > 0 && step === "role") {
      setMessages(prev => {
        const updated = [...prev];
        // Replace the first bot message (greeting) with current language
        if (updated[0] && updated[0].role === "bot") {
          updated[0] = { ...updated[0], content: str.greeting };
        }
        return updated;
      });
    }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && step === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  const addBotMessage = useCallback((text) => {
    setMessages(prev => [...prev, { role: "assistant", content: text }]);
  }, []);

  const openChat = () => {
    setIsOpen(true);
    setShowBubblePulse(false);
    if (!hasGreeted) {
      setHasGreeted(true);
      addBotMessage(str.greeting);
      setStep("role");
    }
  };

  const selectRole = async (role) => {
    setVisitorRole(role.value);
    setMessages(prev => [...prev, { role: "user", content: role.label }]);

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: `I am a ${role.label}.`,
          page_url: window.location.pathname,
          visitor_role: role.value,
          language: language
        })
      });
      const data = await res.json();
      addBotMessage(data.response || str.interest_prompt);
    } catch {
      addBotMessage(str.interest_prompt);
    }
    setIsLoading(false);
    setStep("interest");
  };

  const selectInterest = async (interest) => {
    setVisitorInterest(interest.value);
    setMessages(prev => [...prev, { role: "user", content: interest.label }]);

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: `I'm most interested in: ${interest.label}`,
          page_url: window.location.pathname,
          visitor_role: visitorRole,
          visitor_interest: interest.value,
          language: language
        })
      });
      const data = await res.json();
      addBotMessage(data.response);
    } catch {
      addBotMessage(str.interest_fallback);
    }
    setIsLoading(false);
    setStep("chat");
    setMessageCount(0);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setMessageCount(prev => prev + 1);
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          page_url: window.location.pathname,
          visitor_role: visitorRole,
          visitor_interest: visitorInterest,
          language: language
        })
      });
      const data = await res.json();
      addBotMessage(data.response);

      // After 3 exchanges, suggest lead capture if not already done
      if (messageCount >= 2 && !leadCaptured) {
        setTimeout(() => {
          addBotMessage(str.lead_prompt);
          setStep("lead_prompt");
        }, 1500);
      }
    } catch {
      addBotMessage(str.error_msg);
    }
    setIsLoading(false);
  };

  const submitLead = async () => {
    if (!leadForm.first_name || !leadForm.email) return;

    setIsLoading(true);
    try {
      // Build chat summary
      const summary = messages.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");

      await fetch(`${API_URL}/api/chatbot/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          session_id: sessionId,
          visitor_category: visitorRole,
          interest_category: visitorInterest,
          page_url: window.location.pathname,
          chat_summary: summary
        })
      });

      setLeadCaptured(true);
      setStep("chat");

      addBotMessage(str.lead_success);
    } catch {
      addBotMessage(str.lead_error);
      setStep("chat");
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Chat bubble (closed state)
  if (!isOpen) {
    return (
      <button
        onClick={openChat}
        data-testid="chatbot-bubble"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 flex items-center justify-center transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        {showBubblePulse && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
      data-testid="chatbot-window"
    >
      {/* Header */}
      <div className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-xs font-bold">Ed</div>
          <div>
            <p className="text-sm font-semibold leading-tight">{str.title}</p>
            <p className="text-[10px] text-teal-200 leading-tight">{str.subtitle}</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-teal-600 rounded" data-testid="chatbot-close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50" data-testid="chatbot-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-br-md"
                  : "bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm"
              }`}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Role selection buttons */}
        {step === "role" && !isLoading && (
          <div className="space-y-2 pt-1" data-testid="chatbot-role-options">
            {roleOptions.map(r => (
              <button
                key={r.value}
                onClick={() => selectRole(r)}
                className="block w-full text-left px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-teal-50 hover:border-teal-300 transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Interest selection buttons */}
        {step === "interest" && !isLoading && (
          <div className="grid grid-cols-2 gap-2 pt-1" data-testid="chatbot-interest-options">
            {interestOptions.map(i => (
              <button
                key={i.value}
                onClick={() => selectInterest(i)}
                className="px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-teal-50 hover:border-teal-300 transition-colors text-center"
              >
                {i.label}
              </button>
            ))}
          </div>
        )}

        {/* Lead prompt buttons */}
        {step === "lead_prompt" && !isLoading && (
          <div className="flex gap-2 pt-1" data-testid="chatbot-lead-prompt">
            <button
              onClick={() => setStep("lead_form")}
              className="flex-1 px-3 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              {str.lead_accept}
            </button>
            <button
              onClick={() => { setStep("chat"); }}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              {str.lead_decline}
            </button>
          </div>
        )}

        {/* Lead capture form */}
        {step === "lead_form" && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm" data-testid="chatbot-lead-form">
            <div className="grid grid-cols-2 gap-2">
              <input placeholder={str.first_name} value={leadForm.first_name} onChange={e => setLeadForm(p => ({...p, first_name: e.target.value}))}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <input placeholder={str.last_name} value={leadForm.last_name} onChange={e => setLeadForm(p => ({...p, last_name: e.target.value}))}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            </div>
            <input placeholder={str.email} type="email" value={leadForm.email} onChange={e => setLeadForm(p => ({...p, email: e.target.value}))}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <input placeholder={str.school} value={leadForm.school_org} onChange={e => setLeadForm(p => ({...p, school_org: e.target.value}))}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <input placeholder={str.role_title} value={leadForm.role_title} onChange={e => setLeadForm(p => ({...p, role_title: e.target.value}))}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <button
              onClick={submitLead}
              disabled={!leadForm.first_name || !leadForm.email || isLoading}
              className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              data-testid="chatbot-submit-lead"
            >
              {isLoading ? "..." : <>{str.submit} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:"0ms"}} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:"150ms"}} />
                <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{animationDelay:"300ms"}} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - only in chat mode */}
      {(step === "chat" || step === "lead_prompt") && (
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-3 py-2 flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={str.type_msg}
            className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
            disabled={isLoading}
            data-testid="chatbot-input"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-40 transition-colors"
            data-testid="chatbot-send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatbotWidget;
