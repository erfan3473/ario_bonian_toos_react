import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

const AgentChat = () => {
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { userInfo } = useSelector((state) => state.userLogin);

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
  const [loadingText, setLoadingText] = useState('در حال اتصال به سرور...');
  const [isRecording, setIsRecording] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const socketRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timeoutId: null });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ==========================================
  // منطق WebSocket
  // ==========================================
  useEffect(() => {
    let alive = true;

    const connect = () => {
      if (!alive) return;
      if (socketRef.current) socketRef.current.close();

      const token = userInfo?.access || userInfo?.token;
      
      if (!token) {
        setMessages(prev => [...prev, { sender: 'ai', text: '❌ لطفاً ابتدا وارد حساب کاربری خود شوید.' }]);
        return;
      }

      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const host = isLocal ? window.location.host : 'www.ariobonyantoos.com';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      
      const wsUrl = `${protocol}//${host}/ws/ai-agent/?token=${token}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!alive) return;
        console.log('🟢 AI Agent WebSocket connected!');
        setConnected(true);
        reconnectRef.current.attempts = 0; 
      };

      socket.onmessage = (event) => {
        if (!alive) return;
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'connection') {
                // اتصال اولیه تایید شد
            } else if (data.type === 'processing') {
                // آپدیت وضعیت زنده از سرور
                setLoadingText(data.message || 'هوش مصنوعی در حال تحلیل و پردازش...');
            } else if (data.type === 'final_reply') {
                setIsLoading(false);
                setMessages(prev => [...prev, { 
                  sender: 'ai', 
                  text: data.reply,
                  debugData: data.debug_data
                }]);
                
                if (data.session_id) {
                  setSessionId(data.session_id);
                  sessionStorage.setItem('ai_session_id', data.session_id);
                }
            } else if (data.type === 'error') {
                setIsLoading(false);
                setMessages(prev => [...prev, { sender: 'ai', text: data.message || '❌ خطایی رخ داد.' }]);
            }
        } catch (err) {
            console.error('Error parsing WS message:', err);
        }
      };

      socket.onclose = () => {
        if (alive) {
          console.warn('🟠 AI Agent WebSocket disconnected. Reconnecting...');
          setConnected(false);
          const timeout = Math.min(30000, 1000 * 2 ** reconnectRef.current.attempts++);
          reconnectRef.current.timeoutId = setTimeout(connect, timeout);
        }
      };

      socket.onerror = (error) => {
        console.error('🔴 WebSocket Error:', error);
        socket.close();
      };
    };

    if (userInfo) {
        connect();
    }

    return () => {
      alive = false;
      if (socketRef.current) socketRef.current.close();
      clearTimeout(reconnectRef.current.timeoutId);
    };
  }, [userInfo]);

  const handleNewChat = () => {
    sessionStorage.removeItem('ai_session_id');
    setSessionId(null);
    setMessages([{ sender: 'ai', text: 'حافظه پاک شد. مکالمه جدیدی را شروع کنید. در خدمت شما هستم.' }]);
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('متاسفانه مرورگر شما از قابلیت فرمان صوتی پشتیبانی نمی‌کند.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fa-IR';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => { setIsRecording(true); setInput(''); };
    recognition.onresult = (event) => {
      const currentTranscript = Array.from(event.results).map(result => result[0].transcript).join('');
      setInput(currentTranscript);
    };
    recognition.onerror = (event) => { console.error(event); setIsRecording(false); };
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const sendMessage = () => {
    if (!input.trim() || !connected) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    const userMessage = input;

    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);
    setLoadingText('در حال ارسال به سرور...');

    // ارسال به سوکت
    socketRef.current.send(JSON.stringify({
        message: userMessage,
        session_id: sessionId
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-[650px] w-full max-w-3xl mx-auto rounded-2xl shadow-2xl border font-sans overflow-hidden transition-colors ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-[#f8fafc] border-gray-200'
    }`} dir="rtl">
      
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
          <button onClick={handleNewChat} title="مکالمه جدید" className="flex items-center gap-1 text-xs font-medium bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors cursor-pointer mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            چت جدید
          </button>

          <span className="flex items-center gap-1 text-xs font-medium bg-white/20 text-white px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
            {connected ? 'آنلاین (Socket)' : 'آفلاین'}
          </span>
        </div>
      </div>

      {!connected && (
        <div className="bg-yellow-600/90 text-white text-xs font-bold py-1.5 px-4 text-center animate-pulse shadow-inner">
          ارتباط با سرور هوش مصنوعی قطع است. در حال اتصال مجدد...
        </div>
      )}

      {/* بدنه چت */}
      <div className={`flex-1 p-5 overflow-y-auto space-y-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10 ${
          isDark ? 'bg-gray-950' : 'bg-slate-50'
      }`}>
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}>
            <div className={`relative max-w-[85%] sm:max-w-[75%] p-4 text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl rounded-tr-sm' 
                : isDark 
                    ? 'bg-gray-800 text-gray-200 border border-gray-700 rounded-2xl rounded-tl-sm'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-2xl rounded-tl-sm'
            }`}>
              {msg.text}
            </div>

            {/* پنل ترمینال دیباگ */}
            {msg.sender === 'ai' && msg.debugData && msg.debugData.route_info && (
              <details className="mt-1 w-full max-w-[85%] sm:max-w-[75%] cursor-pointer group">
                <summary className={`text-[10px] font-mono transition-colors list-none flex items-center gap-1 opacity-60 hover:opacity-100 mt-1 mr-2 ${
                    isDark ? 'text-gray-400 hover:text-blue-400' : 'text-slate-500 hover:text-blue-600'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 group-open:rotate-90 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                  [Thesis Debug]: Routing & Tool Logs ({msg.debugData.latency}s)
                </summary>
                
                <div className="mt-2 bg-[#0d1117] rounded-lg p-3 text-left shadow-inner border border-gray-800 mx-2" dir="ltr">
                  <div className="text-[11px] font-mono text-green-400 mb-2 border-b border-gray-800 pb-1">
                    &gt; ROUTER DECISION:
                  </div>
                  <div className="text-[10px] font-mono text-gray-300 ml-2 leading-relaxed">
                    <span className="text-pink-400">Layer:</span> {msg.debugData.route_info.layer} <br/>
                    <span className="text-pink-400">Model:</span> {msg.debugData.route_info.model_name} <br/>
                    <span className="text-pink-400">Reason:</span> {msg.debugData.route_info.reason} <br/>
                    <span className="text-pink-400">Router Latency:</span> {msg.debugData.route_info.routing_latency_ms} ms
                  </div>
                  
                  {msg.debugData.token_usage && (
                    <div className="mt-3 border-t border-gray-800 pt-2">
                      <div className="text-[11px] font-mono text-purple-400 mb-1">
                        &gt; TOKEN USAGE (COST METRICS):
                      </div>
                      <div className="text-[10px] font-mono text-gray-300 ml-2 leading-relaxed">
                        <span className="text-purple-300">Prompt Tokens (IN):</span> {msg.debugData.token_usage.prompt_tokens} <br/>
                        <span className="text-purple-300">Completion Tokens (OUT):</span> {msg.debugData.token_usage.completion_tokens} <br/>
                        <span className="text-yellow-400 font-bold">Total Tokens:</span> {msg.debugData.token_usage.total_tokens} <br/>
                        <span className="text-green-400 font-bold bg-green-900/30 px-1 rounded inline-block mt-1">
                            Estimated Cost: ${parseFloat(msg.debugData.token_usage.estimated_cost_usd || 0).toFixed(6)}
                        </span>
                      </div>
                    </div>
                  )}

                  {msg.debugData.tools_used && msg.debugData.tools_used.length > 0 && (
                    <>
                      <div className="text-[11px] font-mono text-cyan-400 mt-3 mb-2 border-b border-gray-800 pb-1">
                        &gt; TOOLS EXECUTED ({msg.debugData.tools_used.length}):
                      </div>
                      {msg.debugData.tools_used.map((tool, idx) => (
                        <div key={idx} className="text-[10px] font-mono text-gray-300 ml-2 mb-2 bg-[#161b22] p-2 rounded border border-gray-800 break-all">
                          <span className="text-yellow-400">Tool:</span> {tool.tool_name} <br/>
                          <span className="text-yellow-400">Args:</span> {JSON.stringify(tool.args)}
                          
                          {/* 👈 بخش جدید: نمایش دیتای خام دیتابیس (Raw Output) */}
                          {tool.raw_output && (
                            <details className="mt-2 group/raw border-t border-gray-700 pt-1">
                              <summary className="text-[9px] text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-1 list-none w-max">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3 group-open/raw:rotate-90 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                  </svg>
                                  مشاهده دیتای خام (Raw Output)
                              </summary>
                              {/* فونت ساحل یا ویزیر برای متن‌های فارسی در نظر گرفته شده است */}
                              <div className="mt-1 p-2 bg-[#0d1117] rounded border border-gray-700 text-gray-400 max-h-48 overflow-y-auto whitespace-pre-wrap font-sans text-right leading-relaxed" dir="rtl">
                                {tool.raw_output}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {msg.debugData.token_usage?.raw_api_metadata && msg.debugData.token_usage.raw_api_metadata.length > 0 && (
                    <>
                      <div className="text-[11px] font-mono text-orange-400 mt-3 mb-2 border-b border-gray-800 pb-1">
                        &gt; RAW SERVER METADATA (LLM Trace):
                      </div>
                      <div className="text-[9px] font-mono text-gray-400 ml-2 bg-[#0d1117] p-2 rounded border border-gray-800 max-h-40 overflow-y-auto" dir="ltr">
                        <pre className="whitespace-pre-wrap break-words">
                          {JSON.stringify(msg.debugData.token_usage.raw_api_metadata, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        ))}
        
        {/* انیمیشن Loading */}
        {isLoading && (
          <div className="flex justify-end">
            <div className={`p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3 max-w-[85%] border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-100'
            }`}>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <span className={`text-xs font-medium animate-pulse ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                {loadingText}
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ورودی متن */}
      <div className={`p-4 border-t transition-colors ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'
      }`}>
        <div className={`flex items-end gap-2 p-2 rounded-2xl border transition-all duration-300 ${
            isRecording 
              ? (isDark ? 'bg-red-900/20 border-red-800 shadow-inner' : 'bg-red-50 border-red-200 shadow-inner')
              : (isDark 
                  ? 'bg-gray-800 border-gray-700 focus-within:border-blue-500 focus-within:bg-gray-800' 
                  : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md')
        }`}>
          
          <button onClick={toggleRecording} type="button" className={`relative p-3 rounded-full transition-all duration-300 flex items-center justify-center ${
            isRecording 
              ? 'bg-red-500 text-white shadow-lg transform scale-105' 
              : isDark 
                  ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-blue-400 shadow-sm border border-gray-600'
                  : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={!connected ? "در حال اتصال به سوکت..." : (isRecording ? "در حال شنیدن..." : "درخواست خود را بنویسید...")}
            disabled={!connected}
            className={`flex-1 max-h-32 min-h-[48px] bg-transparent border-none resize-none px-3 py-3 text-sm focus:ring-0 leading-relaxed ${
              isRecording 
                ? 'text-red-500' 
                : isDark ? 'text-gray-100 placeholder-gray-500' : 'text-slate-800 placeholder-slate-400'
            }`}
            rows="1"
            style={{ outline: 'none', boxShadow: 'none' }}
          />

          <button onClick={sendMessage} disabled={isLoading || !input.trim() || !connected} className={`p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
            !input.trim() || isLoading || !connected 
              ? (isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-slate-100 text-slate-300 cursor-not-allowed') 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform -rotate-90">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentChat;