import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

// ایمپورت‌های جدید برای پشتیبانی از فرمول‌های ریاضی
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // فایل CSS ضروری برای نمایش صحیح فرمول‌ها

import { fetchNotebooks, fetchNoteEntries, createNoteEntry, createNotebook } from '../features/notebook/notebookSlice'; 

// استایل سفارشی برای اسکرول‌بار شبیه به حاشیه دفتر کلاسور
const customScrollbarStyle = `
  .notebook-scrollbar::-webkit-scrollbar {
      width: 22px;
  }
  .notebook-scrollbar::-webkit-scrollbar-track {
      background-color: #1e1f20;
      /* ایجاد افکت سوراخ‌های پانچ شده دفتر */
      background-image: radial-gradient(circle at 11px center, #0a0a0b 4px, transparent 5px);
      background-size: 100% 28px;
      border-right: 2px solid #2a2b2f;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb {
      /* طراحی دستگیره شبیه گیره یا شیرازه */
      background-color: #4b5563;
      border-radius: 12px;
      border: 5px solid transparent;
      background-clip: padding-box;
      box-shadow: inset 0 0 0 1px #6b7280;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #3b82f6;
      box-shadow: inset 0 0 0 1px #93c5fd;
  }
  /* برای فایرفاکس */
  .notebook-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: #4b5563 #1e1f20;
  }
`;

const CodeBlock = ({ language, value }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="my-4 bg-[#1e1e1e] rounded-xl border border-gray-700 overflow-hidden shadow-md whitespace-normal" dir="ltr">
            <div className="flex justify-between items-center bg-[#2d2d2d] px-4 py-2 text-xs text-gray-300 font-sans">
                <span className="uppercase tracking-wider font-semibold">{language || 'text'}</span>
                <button onClick={handleCopy} className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none">
                    {copied ? <><i className="fas fa-check text-green-400"></i> Copied!</> : <><i className="fas fa-copy"></i> Copy code</>}
                </button>
            </div>
            <div className="p-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <SyntaxHighlighter style={vscDarkPlus} language={language} PreTag="div" customStyle={{ background: 'transparent', padding: 0, margin: 0 }} wrapLines={true} wrapLongLines={true}>
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const NotebookScreen = () => {
    const dispatch = useDispatch();
    const { notebooks, currentEntries, loading } = useSelector((state) => state.notebook);
    
    const [activeNotebook, setActiveNotebook] = useState(null);
    const [inputText, setInputText] = useState('');
    const [newNotebookTitle, setNewNotebookTitle] = useState(''); 
    
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const endOfNotesRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => { dispatch(fetchNotebooks()); }, [dispatch]);

    useEffect(() => {
        if (notebooks.length > 0) {
            const savedNotebookId = localStorage.getItem('activeNotebookId');
            if (savedNotebookId) {
                const foundNotebook = notebooks.find(nb => String(nb.id) === savedNotebookId);
                if (foundNotebook) setActiveNotebook(foundNotebook);
            }
        }
    }, [notebooks]);

    useEffect(() => {
        if (activeNotebook) dispatch(fetchNoteEntries(activeNotebook.id));
    }, [activeNotebook, dispatch]);

    useEffect(() => {
        endOfNotesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentEntries]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
        }
    }, [inputText]);

    const handleSelectNotebook = (nb) => {
        setActiveNotebook(nb);
        localStorage.setItem('activeNotebookId', nb.id);
    };

    const handleBackToList = () => {
        setActiveNotebook(null);
        localStorage.removeItem('activeNotebookId');
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if ((!inputText.trim() && !selectedFile) || !activeNotebook) return;

        const formData = new FormData();
        formData.append('content', inputText);
        if (selectedFile) formData.append('file', selectedFile);

        dispatch(createNoteEntry({ notebookId: activeNotebook.id, formData }));
        
        setInputText('');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleCreateNotebook = (e) => {
        e.preventDefault();
        if (!newNotebookTitle.trim()) return;
        dispatch(createNotebook(newNotebookTitle));
        setNewNotebookTitle('');
    };

    const NoteBubble = ({ entry }) => {
        return (
            <div className="w-full flex justify-center py-4">
                <div className="w-full max-w-3xl md:max-w-4xl px-4 flex flex-col">
                    {entry.media && entry.media.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-3">
                            {entry.media.map((file, idx) => (
                                file.file_type === 'IMAGE' ? (
                                    <img key={idx} src={file.file} alt="media" className="rounded-2xl max-w-full max-h-96 object-cover border border-gray-700 shadow-sm" />
                                ) : file.file_type === 'VIDEO' ? (
                                    <video key={idx} controls className="rounded-2xl max-w-full max-h-96 border border-gray-700 shadow-sm">
                                        <source src={file.file} type="video/mp4" />
                                    </video>
                                ) : (
                                    <a key={idx} href={file.file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#1e1f20] border border-gray-700 px-4 py-3 rounded-xl text-blue-400 hover:bg-gray-800 transition">
                                        <i className="fas fa-file-download text-lg"></i> دانلود ضمیمه
                                    </a>
                                )
                            ))}
                        </div>
                    )}
                    {entry.content && (
                        <div className="prose prose-invert max-w-none text-gray-200 leading-relaxed text-[15px] sm:text-base break-words whitespace-pre-wrap" dir="auto">
                            <ReactMarkdown
                                /* اضافه شدن پلاگین‌های ریاضی به رندر کننده مارک‌داون */
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                                        ) : (
                                            <code className="bg-[#2a2b2f] px-1.5 py-0.5 rounded-md text-sm text-blue-300 border border-gray-700 mx-1" {...props}>{children}</code>
                                        );
                                    },
                                    a({node, ...props}) {
                                        return <a {...props} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" />;
                                    }
                                }}
                            >
                                {entry.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-[120px])] md:h-[calc(100vh-100px)] bg-[#131314] text-gray-100 md:rounded-2xl overflow-hidden md:shadow-2xl md:border border-gray-800 font-sans -mx-4 md:mx-0">
            {/* تزریق استایل اسکرول‌بار به صفحه */}
            <style>{customScrollbarStyle}</style>

            {/* Sidebar */}
            <div className={`${activeNotebook ? 'hidden md:flex' : 'flex'} w-full md:w-64 bg-[#1e1f20] border-l border-gray-800 flex-col shrink-0 transition-all duration-300`}>
                <div className="p-5 font-bold text-lg border-b border-gray-800 flex items-center gap-2">
                    <i className="fas fa-book-open text-blue-500"></i>
                    دفترچه‌ها
                </div>
                <form onSubmit={handleCreateNotebook} className="p-3 border-b border-gray-800">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={newNotebookTitle}
                            onChange={(e) => setNewNotebookTitle(e.target.value)}
                            placeholder="دفترچه جدید..." 
                            className="w-full bg-[#131314] text-white py-2.5 pl-10 pr-4 rounded-xl text-sm border border-gray-700 focus:border-blue-500 focus:outline-none transition-all"
                        />
                        <button type="submit" className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500">
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                </form>
                
                {/* اسکرول‌بار کلاسور برای لیست دفترچه‌ها */}
                <div className="overflow-y-auto flex-1 p-3 space-y-1 notebook-scrollbar pl-1">
                    {loading && notebooks.length === 0 ? (
                        <p className="text-center text-gray-500 mt-4 text-sm">در حال بارگذاری...</p>
                    ) : notebooks.length === 0 ? (
                        <p className="text-center text-gray-500 mt-4 text-sm">دفترچه‌ای وجود ندارد.</p>
                    ) : (
                        notebooks.map(nb => (
                            <button
                                key={nb.id}
                                onClick={() => handleSelectNotebook(nb)}
                                className={`w-full text-right p-3 rounded-xl transition-all flex items-center justify-between group ${
                                    activeNotebook?.id === nb.id 
                                        ? 'bg-[#2a2b2f] text-blue-400 font-semibold border-r-2 border-blue-500' 
                                        : 'hover:bg-[#2a2b2f] text-gray-300 border-r-2 border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <i className="fas fa-hashtag text-gray-500 text-sm"></i>
                                    <span className="truncate">{nb.title}</span>
                                </div>
                                <i className="fas fa-chevron-left text-gray-600 text-xs md:hidden"></i>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* صفحه اصلی یادداشت‌ها */}
            <div className={`${!activeNotebook ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative min-w-0 bg-[#131314]`}>
                {activeNotebook ? (
                    <>
                        {/* هدر صفحه */}
                        <div className="px-3 py-3 md:px-6 md:py-4 bg-[#1e1f20] md:bg-transparent border-b border-gray-800/50 flex items-center gap-3 z-10 shrink-0 sticky top-0 shadow-sm md:shadow-none min-h-[60px]">
                            <button 
                                onClick={handleBackToList} 
                                className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-gray-800/50 hover:bg-gray-700 text-blue-400 rounded-lg transition-colors border border-gray-700/50 shadow-sm"
                            >
                                <i className="fas fa-chevron-right text-sm"></i>
                                <span className="text-sm font-medium">دفترچه‌ها</span>
                            </button>

                            <div className="flex-1 min-w-0 border-r md:border-none border-gray-700 pr-3 md:pr-0">
                                <h2 className="font-semibold text-base md:text-lg text-gray-200 truncate" title={activeNotebook.title}>
                                    {activeNotebook.title}
                                </h2>
                            </div>
                        </div>

                        {/* اختصاص کلاس اسکرول دفترچه‌ای به بخش پیام‌ها */}
                        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col scroll-smooth notebook-scrollbar pl-1 bg-[#131314]">
                            {currentEntries.map((entry, index) => (
                                <NoteBubble key={entry.id} entry={entry} />
                            ))}
                            <div ref={endOfNotesRef} className="pb-8 pt-4"></div>
                        </div>

                        <div className="p-3 md:p-4 bg-[#1e1f20] md:bg-gradient-to-t md:from-[#131314] md:via-[#131314] md:to-transparent shrink-0">
                            <div className="max-w-4xl mx-auto">
                                {selectedFile && (
                                    <div className="mb-2 flex items-center gap-2 bg-[#2a2b2f] border border-gray-700 w-max px-3 py-1.5 rounded-lg text-xs md:text-sm shadow-lg">
                                        <i className="fas fa-paperclip text-blue-400"></i>
                                        <span className="truncate max-w-[150px] md:max-w-[200px]">{selectedFile.name}</span>
                                        <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-400 transition ml-2">
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}

                                <form onSubmit={handleSendMessage} className="relative flex items-end bg-[#2a2b2f] md:bg-[#1e1f20] border border-gray-700 rounded-2xl md:rounded-3xl shadow-lg overflow-hidden focus-within:border-gray-500 transition-colors">
                                    <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
                                    
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="p-3 md:p-4 text-gray-400 hover:text-gray-200 transition-colors shrink-0">
                                        <i className="fas fa-plus-circle text-lg md:text-xl"></i>
                                    </button>

                                    <textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        placeholder="پیام خود را بنویسید... (برای نوشتن فرمول از $$ استفاده کنید)"
                                        className="flex-1 bg-transparent text-gray-100 py-3 md:py-4 px-1 focus:outline-none resize-none max-h-32 md:max-h-48 overflow-y-auto leading-relaxed text-sm md:text-base [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                                        dir="auto"
                                        rows="1"
                                    />
                                    
                                    <button type="submit" disabled={!inputText.trim() && !selectedFile} className={`p-3 md:p-4 transition-colors shrink-0 ${(!inputText.trim() && !selectedFile) ? 'text-gray-600 cursor-not-allowed' : 'text-blue-500 hover:text-blue-400'}`}>
                                        <i className="fas fa-paper-plane text-lg md:text-xl"></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="hidden md:flex flex-1 items-center justify-center text-gray-500 flex-col gap-4">
                        <i className="fas fa-book text-6xl text-gray-800"></i>
                        <p className="text-lg">یک دفترچه از منوی کناری انتخاب کنید</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotebookScreen;
