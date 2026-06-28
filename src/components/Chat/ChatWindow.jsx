import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChatMessages, addMessage, setSocketConnected } from '../../features/chat/chatSlice';

const ChatWindow = ({ chatId, onBack }) => {
  const dispatch = useDispatch();
  const { messages, loadingMessages } = useSelector((state) => state.chat);
  const { userInfo } = useSelector((state) => state.userLogin);
  
  const [inputText, setInputText] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  const chatMessages = messages[chatId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [chatMessages]);

  useEffect(() => { dispatch(fetchChatMessages(chatId)); }, [dispatch, chatId]);

  useEffect(() => {
    const token = userInfo?.access;
    if (!token) return;

    if (ws.current) ws.current.close();
   
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `wss://www.ariobonyantoos.com/ws/chat/${chatId}/?token=${token}`; 

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      dispatch(setSocketConnected(true));
      ws.current.pingInterval = setInterval(() => {
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') return;
      if (data.type === 'new_message' || data.type === 'broadcast_message') {
        const payload = data.payload || data;
        dispatch(addMessage(payload));
      }
    };

    ws.current.onclose = () => {
      dispatch(setSocketConnected(false));
      clearInterval(ws.current?.pingInterval);
    };

    return () => {
      if (ws.current) ws.current.close();
      clearInterval(ws.current?.pingInterval);
    };
  }, [chatId, userInfo, dispatch]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() || !ws.current) return;

    const payload = {
      type: 'send_message',
      message_type: 'TEXT',
      text: inputText.trim(),
      local_id: Date.now().toString()
    };

    ws.current.send(JSON.stringify(payload));
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="flex flex-col h-full bg-[#131314]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#1e1f20] border-b border-gray-800 flex items-center gap-3 shrink-0 min-h-[60px] shadow-sm">
        {/* دکمه بازگشت در موبایل */}
        <button 
          onClick={onBack}
          className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg text-blue-400 hover:bg-gray-700 transition-colors border border-gray-700"
        >
          <i className="fas fa-chevron-right text-sm"></i>
          <span className="text-sm font-medium">بازگشت</span>
        </button>

        <div className="flex-1 flex items-center justify-between">
            <span className="font-semibold text-gray-100">گفتگو #{chatId}</span>
            {loadingMessages && <i className="fas fa-spinner fa-spin text-blue-500"></i>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chatMessages.map((msg, index) => {
          // 🔴 جلوگیری از رندر پیام‌های ماموریت و پیام‌های خالی
          if (msg.message_type === 'TASK') return null;
          if (!msg.text || msg.text.trim() === '') return null;

          const isMe = msg.sender_id === userInfo?.id;
          return (
            <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed shadow-sm flex flex-col ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-[#2a2b2f] border border-gray-800 text-gray-200 rounded-bl-none'
                }`}
              >
                {!isMe && (
                   <span className="text-xs text-blue-400 font-bold mb-1.5 opacity-90">{msg.sender_name}</span>
                )}
                
                {/* 🔴 بخش مربوط به دیزاین ماموریت حذف شد و فقط متن چت نمایش داده می‌شود */}
                <span className="whitespace-pre-wrap break-words">{msg.text}</span>

                <span className={`text-[10px] mt-1.5 flex ${isMe ? 'justify-end text-blue-200' : 'justify-end text-gray-500'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>


      {/* Input */}
      <div className="p-3 md:p-4 bg-[#1e1f20] shrink-0 border-t border-gray-800">
          <form onSubmit={sendMessage} className="flex items-end bg-[#131314] border border-gray-700 rounded-2xl overflow-hidden focus-within:border-blue-500 transition-colors">
            <textarea
              ref={textareaRef}
              dir="auto"
              rows="1"
              className="flex-grow bg-transparent text-gray-100 px-4 py-3 md:py-4 focus:outline-none resize-none max-h-32 overflow-y-auto leading-relaxed [&::-webkit-scrollbar]:hidden"
              placeholder="پیام خود را بنویسید..."
              value={inputText}
              onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                  }
              }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`p-3 md:p-4 transition-colors shrink-0 ${!inputText.trim() ? 'text-gray-600 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}
            >
              <i className={`fas fa-paper-plane text-xl ${document.dir === 'rtl' ? 'rotate-180' : ''}`}></i>
            </button>
          </form>
      </div>
    </div>
  );
};

export default ChatWindow;
