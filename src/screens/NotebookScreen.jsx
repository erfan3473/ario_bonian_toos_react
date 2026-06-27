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

// استایل سفارشی برای اسکرول‌بار شبیه به حاشیه دفتر کلاسور (دو تم)
const getCustomScrollbarStyle = (isDark) => `
  .notebook-scrollbar::-webkit-scrollbar {
      width: 22px;
  }
  .notebook-scrollbar::-webkit-scrollbar-track {
      background-color: ${isDark ? '#1e1f20' : '#f3f4f6'};
      background-image: radial-gradient(circle at 11px center, ${isDark ? '#0a0a0b' : '#d1d5db'} 4px, transparent 5px);
      background-size: 100% 28px;
      border-right: 2px solid ${isDark ? '#2a2b2f' : '#e5e7eb'};
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${isDark ? '#4b5563' : '#9ca3af'};
      border-radius: 12px;
      border: 5px solid transparent;
      background-clip: padding-box;
      box-shadow: inset 0 0 0 1px ${isDark ? '#6b7280' : '#d1d5db'};
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: #3b82f6;
      box-shadow: inset 0 0 0 1px ${isDark ? '#93c5fd' : '#60a5fa'};
  }
  .notebook-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: ${isDark ? '#4b5563 #1e1f20' : '#9ca3af #f3f4f6'};
  }
`;

const CodeBlock = ({ language, value, isDark }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={`my-4 rounded-xl border overflow-hidden shadow-md whitespace-normal ${
                isDark ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white border-gray-300'
            }`}
            dir="ltr"
        >
            <div
                className={`flex justify-between items-center px-4 py-2 text-xs font-sans ${
                    isDark ? 'bg-[#2d2d2d] text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
            >
                <span className="uppercase tracking-wider font-semibold">{language || 'text'}</span>
                <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1 transition-colors focus:outline-none ${
                        isDark ? 'hover:text-white' : 'hover:text-gray-900'
                    }`}
                >
                    {copied ? <><i className="fas fa-check text-green-500"></i> Copied!</> : <><i className="fas fa-copy"></i> Copy code</>}
                </button>
            </div>
            <div className="p-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    customStyle={{ background: 'transparent', padding: 0, margin: 0 }}
                    wrapLines={true}
                    wrapLongLines={true}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const NotebookScreen = () => {
    const dispatch = useDispatch();
    const { notebooks, currentEntries, loading } = useSelector((state) => state.notebook);
    const mode = useSelector((state) => state.theme?.mode || 'dark');
    const isDark = mode === 'dark';

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
                                    <img
                                        key={idx}
                                        src={file.file}
                                        alt="media"
                                        className={`rounded-2xl max-w-full max-h-96 object-cover border shadow-sm ${
                                            isDark ? 'border-gray-700' : 'border-gray-300'
                                        }`}
                                    />
                                ) : file.file_type === 'VIDEO' ? (
                                    <video
                                        key={idx}
                                        controls
                                        className={`rounded-2xl max-w-full max-h-96 border shadow-sm ${
                                            isDark ? 'border-gray-700' : 'border-gray-300'
                                        }`}
                                    >
                                        <source src={file.file} type="video/mp4" />
                                    </video>
                                ) : (
                                    <a
                                        key={idx}
                                        href={file.file}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 border px-4 py-3 rounded-xl transition ${
                                            isDark
                                                ? 'bg-[#1e1f20] border-gray-700 text-blue-400 hover:bg-gray-800'
                                                : 'bg-gray-50 border-gray-300 text-blue-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <i className="fas fa-file-download text-lg"></i> دانلود ضمیمه
                                    </a>
                                )
                            ))}
                        </div>
                    )}

                    {entry.content && (
                        <div
                            className={`prose max-w-none leading-relaxed text-[15px] sm:text-base break-words whitespace-pre-wrap ${
                                isDark ? 'prose-invert text-gray-200' : 'text-gray-800'
                            }`}
                            dir="auto"
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    code({ inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <CodeBlock
                                                language={match[1]}
                                                value={String(children).replace(/\n$/, '')}
                                                isDark={isDark}
                                            />
                                        ) : (
                                            <code
                                                className={`px-1.5 py-0.5 rounded-md text-sm border mx-1 ${
                                                    isDark
                                                        ? 'bg-[#2a2b2f] text-blue-300 border-gray-700'
                                                        : 'bg-gray-100 text-blue-700 border-gray-300'
                                                }`}
                                                {...props}
                                            >
                                                {children}
                                            </code>
                                        );
                                    },
                                    a({ node, ...props }) {
                                        return (
                                            <a
                                                {...props}
                                                className={isDark ? 'text-blue-400 hover:underline' : 'text-blue-600 hover:underline'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            />
                                        );
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
        <div
            className={`flex h-[calc(100vh-[120px])] md:h-[calc(100vh-100px)] md:rounded-2xl overflow-hidden md:shadow-2xl md:border font-sans -mx-4 md:mx-0 ${
                isDark
                    ? 'bg-[#131314] text-gray-100 border-gray-800'
                    : 'bg-gray-50 text-gray-900 border-gray-200'
            }`}
        >
            {/* تزریق استایل اسکرول‌بار به صفحه */}
            <style>{getCustomScrollbarStyle(isDark)}</style>

            {/* Sidebar */}
            <div className={`${activeNotebook ? 'hidden md:flex' : 'flex'} w-full md:w-64 border-l flex-col shrink-0 transition-all duration-300 ${
                isDark ? 'bg-[#1e1f20] border-gray-800' : 'bg-white border-gray-200'
            }`}>
                <div className={`p-5 font-bold text-lg border-b flex items-center gap-2 ${
                    isDark ? 'border-gray-800' : 'border-gray-200'
                }`}>
                    <i className="fas fa-book-open text-blue-500"></i>
                    دفترچه‌ها
                </div>

                <form onSubmit={handleCreateNotebook} className={`p-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
                    <div className="relative">
                        <input
                            type="text"
                            value={newNotebookTitle}
                            onChange={(e) => setNewNotebookTitle(e.target.value)}
                            placeholder="دفترچه جدید..."
                            className={`w-full py-2.5 pl-10 pr-4 rounded-xl text-sm border focus:border-blue-500 focus:outline-none transition-all ${
                                isDark
                                    ? 'bg-[#131314] text-white border-gray-700'
                                    : 'bg-gray-50 text-gray-900 border-gray-300'
                            }`}
                        />
                        <button
                            type="submit"
                            className={`absolute left-2 top-1/2 transform -translate-y-1/2 ${
                                isDark ? 'text-gray-400 hover:text-blue-500' : 'text-gray-500 hover:text-blue-600'
                            }`}
                        >
                            <i className="fas fa-plus"></i>
                        </button>
                    </div>
                </form>

                <div className="overflow-y-auto flex-1 p-3 space-y-1 notebook-scrollbar pl-1">
                    {loading && notebooks.length === 0 ? (
                        <p className={`text-center mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>در حال بارگذاری...</p>
                    ) : notebooks.length === 0 ? (
                        <p className={`text-center mt-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>دفترچه‌ای وجود ندارد.</p>
                    ) : (
                        notebooks.map(nb => (
                            <button
                                key={nb.id}
                                onClick={() => handleSelectNotebook(nb)}
                                className={`w-full text-right p-3 rounded-xl transition-all flex items-center justify-between group border-r-2 ${
                                    activeNotebook?.id === nb.id
                                        ? 'bg-blue-500/10 text-blue-500 font-semibold border-blue-500'
                                        : isDark
                                            ? 'hover:bg-[#2a2b2f] text-gray-300 border-transparent'
                                            : 'hover:bg-gray-100 text-gray-700 border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-3 truncate">
                                    <i className={`fas fa-hashtag text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                                    <span className="truncate">{nb.title}</span>
                                </div>
                                <i className={`fas fa-chevron-left text-xs md:hidden ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* صفحه اصلی یادداشت‌ها */}
            <div className={`${!activeNotebook ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative min-w-0 ${
                isDark ? 'bg-[#131314]' : 'bg-gray-50'
            }`}>
                {activeNotebook ? (
                    <>
                        {/* هدر صفحه */}
                        <div className={`px-3 py-3 md:px-6 md:py-4 md:bg-transparent border-b flex items-center gap-3 z-10 shrink-0 sticky top-0 shadow-sm md:shadow-none min-h-[60px] ${
                            isDark ? 'bg-[#1e1f20] border-gray-800/50' : 'bg-white border-gray-200'
                        }`}>
                            <button
                                onClick={handleBackToList}
                                className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors border shadow-sm ${
                                    isDark
                                        ? 'bg-gray-800/50 hover:bg-gray-700 text-blue-400 border-gray-700/50'
                                        : 'bg-gray-100 hover:bg-gray-200 text-blue-600 border-gray-300'
                                }`}
                            >
                                <i className="fas fa-chevron-right text-sm"></i>
                                <span className="text-sm font-medium">دفترچه‌ها</span>
                            </button>

                            <div className={`flex-1 min-w-0 border-r md:border-none pr-3 md:pr-0 ${
                                isDark ? 'border-gray-700' : 'border-gray-300'
                            }`}>
                                <h2
                                    className={`font-semibold text-base md:text-lg truncate ${
                                        isDark ? 'text-gray-200' : 'text-gray-900'
                                    }`}
                                    title={activeNotebook.title}
                                >
                                    {activeNotebook.title}
                                </h2>
                            </div>
                        </div>

                        <div className={`flex-1 overflow-y-auto min-h-0 flex flex-col scroll-smooth notebook-scrollbar pl-1 ${
                            isDark ? 'bg-[#131314]' : 'bg-gray-50'
                        }`}>
                            {currentEntries.map((entry) => (
                                <NoteBubble key={entry.id} entry={entry} />
                            ))}
                            <div ref={endOfNotesRef} className="pb-8 pt-4"></div>
                        </div>

                        <div className={`p-3 md:p-4 shrink-0 ${
                            isDark ? 'bg-[#1e1f20] md:bg-gradient-to-t md:from-[#131314] md:via-[#131314] md:to-transparent'
                                   : 'bg-white md:bg-gradient-to-t md:from-gray-50 md:via-gray-50 md:to-transparent border-t border-gray-200 md:border-t-0'
                        }`}>
                            <div className="max-w-4xl mx-auto">
                                {selectedFile && (
                                    <div className={`mb-2 flex items-center gap-2 border w-max px-3 py-1.5 rounded-lg text-xs md:text-sm shadow-lg ${
                                        isDark
                                            ? 'bg-[#2a2b2f] border-gray-700 text-gray-200'
                                            : 'bg-gray-100 border-gray-300 text-gray-800'
                                    }`}>
                                        <i className="fas fa-paperclip text-blue-500"></i>
                                        <span className="truncate max-w-[150px] md:max-w-[200px]">{selectedFile.name}</span>
                                        <button
                                            onClick={() => setSelectedFile(null)}
                                            className={`transition ml-2 ${
                                                isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                                            }`}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                )}

                                <form
                                    onSubmit={handleSendMessage}
                                    className={`relative flex items-end border rounded-2xl md:rounded-3xl shadow-lg overflow-hidden transition-colors ${
                                        isDark
                                            ? 'bg-[#2a2b2f] md:bg-[#1e1f20] border-gray-700 focus-within:border-gray-500'
                                            : 'bg-white border-gray-300 focus-within:border-blue-400'
                                    }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current.click()}
                                        className={`p-3 md:p-4 transition-colors shrink-0 ${
                                            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
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
                                        className={`flex-1 bg-transparent py-3 md:py-4 px-1 focus:outline-none resize-none max-h-32 md:max-h-48 overflow-y-auto leading-relaxed text-sm md:text-base [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
                                            isDark ? 'text-gray-100 placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                                        }`}
                                        dir="auto"
                                        rows="1"
                                    />

                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() && !selectedFile}
                                        className={`p-3 md:p-4 transition-colors shrink-0 ${
                                            (!inputText.trim() && !selectedFile)
                                                ? (isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 cursor-not-allowed')
                                                : 'text-blue-500 hover:text-blue-400'
                                        }`}
                                    >
                                        <i className="fas fa-paper-plane text-lg md:text-xl"></i>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={`hidden md:flex flex-1 items-center justify-center flex-col gap-4 ${
                        isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                        <i className={`fas fa-book text-6xl ${isDark ? 'text-gray-800' : 'text-gray-300'}`}></i>
                        <p className="text-lg">یک دفترچه از منوی کناری انتخاب کنید</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotebookScreen;
