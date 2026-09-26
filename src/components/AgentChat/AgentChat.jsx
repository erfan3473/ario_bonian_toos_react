// src/components/AgentChat/AgentChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axiosInstance';

const AgentChat = ({ currentPage = "کارتابل و امور اداری" }) => {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'سلام! من دستیار هوشمند شما هستم. کارتابل را بررسی کنم؟' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('در حال پردازش...');
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 👈 منطق جدید و بدون باگ برای فرمان صوتی
  const toggleRecording = () => {
    // اگر در حال ضبط است، متوقف کن
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // شروع ضبط جدید
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متاسفانه مرورگر شما از قابلیت فرمان صوتی پشتیبانی نمی‌کند. لطفا از Chrome استفاده کنید.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.interimResults = true;
    recognition.continuous = false; // به محض سکوت کاربر متوقف می‌شود

    recognition.onstart = () => {
      setIsRecording(true);
      setInput(''); // پاک کردن متن قبلی
    };

    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(currentTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userMessage = input;
    const currentHistory = messages
      .filter(m => m.sender !== 'system')
      .map(m => ({ role: m.sender, content: m.text }));

    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    const loadingSteps = [
      'در حال تحلیل درخواست شما...',
      'در حال فراخوانی ابزارها و جستجو...',
      'در حال پردازش اطلاعات مکانی و کارتابل...',
      'در حال تدوین پاسخ نهایی...'
    ];
    let stepIndex = 0;
    setLoadingText(loadingSteps[0]);

    const intervalId = setInterval(() => {
      stepIndex++;
      if (stepIndex < loadingSteps.length) {
        setLoadingText(loadingSteps[stepIndex]);
      }
    }, 2500);

    try {
      const response = await api.post('/ai-agent/chat/', { 
        message: userMessage,
        current_page: currentPage,
        chat_history: currentHistory
      });

      clearInterval(intervalId);
      setMessages(prev => [...prev, { sender: 'ai', text: response.data.reply }]);
    } catch (error) {
      console.error('Agent Error:', error);
      clearInterval(intervalId);
      setMessages(prev => [...prev, { sender: 'ai', text: '❌ متاسفانه در ارتباط با سرور هوش مصنوعی مشکلی پیش آمد.' }]);
    } finally {
      clearInterval(intervalId);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-3xl mx-auto bg-[#f8fafc] rounded-2xl shadow-2xl border border-gray-200 font-sans overflow-hidden" dir="rtl">
      
      {/* 👈 هدر با طراحی مدرن و گرادیانت */}
      <div className="bg-gradient-to-l from-blue-700 to-indigo-600 p-4 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">هوش مصنوعی ۸پا</h2>
            <span className="text-blue-100 text-xs font-medium opacity-90">دستیار هوشمند مستقر در ERP</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="text-xs font-medium bg-red-500/90 text-white px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              در حال شنیدن
            </span>
          )}
          <span className="flex items-center gap-1 text-xs font-medium bg-white/20 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            آنلاین
          </span>
        </div>
      </div>

      {/* 👈 بخش پیام‌ها با پدینگ بهتر و فاصله‌گذاری استاندارد */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10 bg-slate-50">
        {messages.map((msg, index) => (
          // در RTL: justify-start یعنی سمت راست (کاربر)، justify-end یعنی سمت چپ (سیستم)
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className={`relative max-w-[85%] sm:max-w-[75%] p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* نشانگر در حال تایپ... */}
        {isLoading && (
          <div className="flex justify-end">
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3 max-w-[85%]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <span className="text-xs font-medium text-slate-500 animate-pulse">{loadingText}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 👈 نوار ابزار پایین کاملاً بازطراحی شده */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className={`flex items-end gap-2 p-2 rounded-2xl border transition-all duration-300 ${
            isRecording ? 'bg-red-50 border-red-200 shadow-inner' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md'
        }`}>
          
          {/* دکمه میکروفون با انیمیشن‌های حرفه‌ای */}
          <div className="relative">
            {isRecording && (
              <div className="absolute inset-0 bg-red-400 rounded-full animate-ping opacity-75"></div>
            )}
            <button
              onClick={toggleRecording}
              type="button"
              className={`relative p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
                isRecording 
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 transform scale-105' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-blue-600 shadow-sm border border-slate-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>

          {/* باکس متن منعطف */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isRecording ? "در حال شنیدن صدای شما..." : "درخواست خود را بنویسید یا از میکروفون استفاده کنید..."}
            className={`flex-1 max-h-32 min-h-[48px] bg-transparent border-none resize-none px-3 py-3 text-sm focus:ring-0 leading-relaxed ${
              isRecording ? 'text-red-700 placeholder-red-400' : 'text-slate-800 placeholder-slate-400'
            }`}
            rows="1"
            style={{ outline: 'none', boxShadow: 'none' }}
          />

          {/* دکمه ارسال (Icon Button) */}
          <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
              !input.trim() || isLoading
                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:scale-105'
            }`}
          >
            {isLoading ? (
              <svg className="animate-spin h-6 w-6 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform -rotate-90">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;