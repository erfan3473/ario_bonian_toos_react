// src/components/AgentChat/AgentChat.jsx
import React, { useState, useRef, useEffect } from 'react';
import api from '../../api/axiosInstance';

const AgentChat = () => {
  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('ai_session_id') || null);
  
  const [messages, setMessages] = useState(() => {
    const existingSession = sessionStorage.getItem('ai_session_id');
    return [
      { 
        sender: 'ai', 
        text: existingSession 
          ? 'ادامه مکالمه قبلی... در خدمت شما هستم.' 
          : 'سلام! من دستیار هوشمند شما هستم. کارتابل را بررسی کنم؟' 
      }
    ];
  });

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

  const handleNewChat = () => {
    sessionStorage.removeItem('ai_session_id');
    setSessionId(null);
    setMessages([{ sender: 'ai', text: 'حافظه پاک شد. مکالمه جدیدی را شروع کنید. در خدمت شما هستم.' }]);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متاسفانه مرورگر شما از قابلیت فرمان صوتی پشتیبانی نمی‌کند. لطفا از Chrome استفاده کنید.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsRecording(true);
      setInput(''); 
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
        session_id: sessionId
      });

      clearInterval(intervalId);
      
      // 👈 ثبت پیام هوش مصنوعی به همراه دیتای دیباگ
      setMessages(prev => [...prev, { 
        sender: 'ai', 
        text: response.data.reply,
        debugData: response.data.debug_data
      }]);
      
      if (response.data.session_id) {
        setSessionId(response.data.session_id);
        sessionStorage.setItem('ai_session_id', response.data.session_id);
      }
      
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
      
      {/* هدر چت */}
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
          <button 
            onClick={handleNewChat}
            title="مکالمه جدید (پاک‌کردن حافظه موقت)"
            className="flex items-center gap-1 text-xs font-medium bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            چت جدید
          </button>

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

      {/* بدنه چت */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10 bg-slate-50">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}>
            <div className={`relative max-w-[85%] sm:max-w-[75%] p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
            }`}>
              {msg.text}
            </div>

            {/* 👈 پنل ترمینال دیباگ پایان‌نامه */}
            {/* 👈 پنل ترمینال دیباگ پایان‌نامه */}
            {msg.sender === 'ai' && msg.debugData && msg.debugData.route_info && (
              <details className="mt-1 w-full max-w-[85%] sm:max-w-[75%] cursor-pointer group">
                <summary className="text-[10px] text-slate-400 font-mono hover:text-blue-500 transition-colors list-none flex items-center gap-1 opacity-60 hover:opacity-100 mt-1 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 group-open:rotate-90 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  [Thesis Debug]: Routing & Tool Logs ({msg.debugData.latency}s)
                </summary>
                
                <div className="mt-2 bg-slate-900 rounded-lg p-3 text-left shadow-inner border border-slate-700 mx-2" dir="ltr">
                  <div className="text-[11px] font-mono text-green-400 mb-2 border-b border-slate-700 pb-1">
                    &gt; ROUTER DECISION:
                  </div>
                  <div className="text-[10px] font-mono text-slate-300 ml-2 leading-relaxed">
                    <span className="text-pink-400">Layer:</span> {msg.debugData.route_info.layer} <br/>
                    <span className="text-pink-400">Model:</span> {msg.debugData.route_info.model_name} <br/>
                    <span className="text-pink-400">Reason:</span> {msg.debugData.route_info.reason} <br/>
                    <span className="text-pink-400">Router Latency:</span> {msg.debugData.route_info.routing_latency_ms} ms
                  </div>
                  
                  {msg.debugData.tools_used && msg.debugData.tools_used.length > 0 && (
                    <>
                      <div className="text-[11px] font-mono text-cyan-400 mt-3 mb-2 border-b border-slate-700 pb-1">
                        &gt; TOOLS EXECUTED ({msg.debugData.tools_used.length}):
                      </div>
                      {msg.debugData.tools_used.map((tool, idx) => (
                        <div key={idx} className="text-[10px] font-mono text-slate-300 ml-2 mb-2 bg-slate-800 p-2 rounded border border-slate-700 break-all">
                          <span className="text-yellow-400">Tool:</span> {tool.tool_name} <br/>
                          <span className="text-yellow-400">Args:</span> {JSON.stringify(tool.args)}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        ))}
        
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

      {/* ورودی متن */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className={`flex items-end gap-2 p-2 rounded-2xl border transition-all duration-300 ${
            isRecording ? 'bg-red-50 border-red-200 shadow-inner' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md'
        }`}>
          
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