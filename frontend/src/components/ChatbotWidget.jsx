import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, ChevronDown, User, ArrowRight } from "lucide-react";

const API_URL = process.env.REACT_APP_BACKEND_URL || "";

const ROLE_OPTIONS = [
  { label: "Teacher", value: "teacher" },
  { label: "Tutor", value: "tutor" },
  { label: "Homeschool Educator", value: "homeschool" },
  { label: "School Administrator", value: "administrator" },
  { label: "District / Enterprise", value: "district" },
  { label: "Other", value: "other" },
];

const INTEREST_OPTIONS = [
  { label: "Lesson Planning", value: "lesson_planning" },
  { label: "Grading & Gradebook", value: "grading" },
  { label: "AI Tools", value: "ai_tools" },
  { label: "Attendance", value: "attendance" },
  { label: "Pricing", value: "pricing" },
  { label: "School / District Solution", value: "school_solution" },
  { label: "Book a Demo", value: "demo" },
  { label: "General Questions", value: "general" },
];

function generateSessionId() {
  return "chat_" + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
}

const ChatbotWidget = () => {
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
      addBotMessage("Hi there! I'm Ed, your TeacherHubPro assistant. I can help you explore features, answer questions, or get you started with a free trial. Which best describes you?");
      setStep("role");
    }
  };

  const selectRole = async (role) => {
    setVisitorRole(role.value);
    setMessages(prev => [...prev, { role: "user", content: role.label }]);

    // Send to AI for context
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: `I am a ${role.label}.`,
          page_url: window.location.pathname,
          visitor_role: role.value
        })
      });
      const data = await res.json();
      addBotMessage(data.response || "Great! What are you most interested in today?");
    } catch {
      addBotMessage("Great! What are you most interested in today?");
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
          visitor_interest: interest.value
        })
      });
      const data = await res.json();
      addBotMessage(data.response);
    } catch {
      addBotMessage("I'd be happy to help with that! Feel free to ask me anything.");
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
          visitor_interest: visitorInterest
        })
      });
      const data = await res.json();
      addBotMessage(data.response);

      // After 3 exchanges, suggest lead capture if not already done
      if (messageCount >= 2 && !leadCaptured) {
        setTimeout(() => {
          addBotMessage("By the way, I'd love to make sure our team can follow up with you. Would you like to share your contact info? It only takes a moment.");
          setStep("lead_prompt");
        }, 1500);
      }
    } catch {
      addBotMessage("I'm sorry, I'm having trouble connecting. You can reach our team at the Contact page.");
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

      const isHighPriority = ["administrator", "district"].includes(visitorRole);
      if (isHighPriority) {
        addBotMessage(`Thank you, ${leadForm.first_name}! I've flagged your inquiry as a priority. Our team will reach out shortly to schedule a personalized demo. In the meantime, feel free to ask me anything else!`);
      } else {
        addBotMessage(`Thanks, ${leadForm.first_name}! You can start your free trial right now — no credit card needed. Just head to our signup page! Is there anything else I can help with?`);
      }
    } catch {
      addBotMessage("Sorry, I had trouble saving your info. You can reach us directly at the Contact page.");
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
            <p className="text-sm font-semibold leading-tight">Ed</p>
            <p className="text-[10px] text-teal-200 leading-tight">TeacherHubPro Assistant</p>
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
            {ROLE_OPTIONS.map(r => (
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
            {INTEREST_OPTIONS.map(i => (
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
              Sure, happy to!
            </button>
            <button
              onClick={() => { setStep("chat"); addBotMessage("No problem at all! Feel free to keep asking questions."); }}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Maybe later
            </button>
          </div>
        )}

        {/* Lead capture form */}
        {step === "lead_form" && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm" data-testid="chatbot-lead-form">
            <p className="text-xs text-slate-500">We'll use this info to follow up and help you get the most out of TeacherHubPro.</p>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="First name *" value={leadForm.first_name} onChange={e => setLeadForm(p => ({...p, first_name: e.target.value}))}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <input placeholder="Last name" value={leadForm.last_name} onChange={e => setLeadForm(p => ({...p, last_name: e.target.value}))}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            </div>
            <input placeholder="Email *" type="email" value={leadForm.email} onChange={e => setLeadForm(p => ({...p, email: e.target.value}))}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <input placeholder="School / Organization" value={leadForm.school_org} onChange={e => setLeadForm(p => ({...p, school_org: e.target.value}))}
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Role / Title" value={leadForm.role_title} onChange={e => setLeadForm(p => ({...p, role_title: e.target.value}))}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
              <input placeholder="Phone (optional)" value={leadForm.phone} onChange={e => setLeadForm(p => ({...p, phone: e.target.value}))}
                className="px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500" />
            </div>
            <button
              onClick={submitLead}
              disabled={!leadForm.first_name || !leadForm.email || isLoading}
              className="w-full py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              data-testid="chatbot-submit-lead"
            >
              {isLoading ? "Submitting..." : <>Submit <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-[10px] text-slate-400 text-center">By submitting, you consent to being contacted about TeacherHubPro.</p>
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
            placeholder="Type a message..."
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
