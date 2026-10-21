import React, { useState, useEffect, useRef, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';

import { 
    FaFileDownload, FaBookOpen, FaPlus, 
    FaHashtag, FaChevronLeft, FaChevronRight, FaPaperclip, 
    FaTimes, FaPlusCircle, FaPaperPlane, FaBook, FaFolderOpen,
    FaEdit, FaTrash, FaCog, FaSpinner, FaSearch, FaFont,
    FaAlignLeft, FaAlignRight
} from 'react-icons/fa';

import { 
    fetchNotebooks, fetchNoteEntries, createNoteEntry, createNotebook, 
    editNoteEntry, deleteNoteEntry, updateNotebook, deleteNotebook 
} from '../features/notebook/notebookSlice';

const getCustomScrollbarStyle = (isDark) => `
  .notebook-scrollbar::-webkit-scrollbar {
      width: 5px;
  }
  .notebook-scrollbar::-webkit-scrollbar-track {
      background-color: transparent;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${isDark ? '#374151' : '#D1D5DB'};
      border-radius: 10px;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: ${isDark ? '#4B5563' : '#9CA3AF'};
  }
  
  /* رنگ‌های دارک‌مود نوار ابزار */
  .quill-dark .ql-toolbar {
      background-color: #1F2937;
      border-color: #374151;
  }
  .quill-dark .ql-toolbar .ql-stroke { stroke: #9CA3AF; }
  .quill-dark .ql-toolbar .ql-fill { fill: #9CA3AF; }
  .quill-dark .ql-toolbar .ql-picker { color: #D1D5DB; }
  .quill-dark .ql-picker-options { 
      background-color: #111827 !important; 
      border-color: #374151 !important; 
  }
  .quill-dark .ql-picker-item { color: #E5E7EB !important; }
  .quill-dark .ql-container {
      border-color: #374151;
      color: #F3F4F6;
  }
  .quill-dark .ql-editor.ql-blank::before { color: #6B7280; }

  /* ساختار منعطف و ضد سرریز ادیتور */
  .custom-quill-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      position: relative;
      overflow: hidden;
  }
  .custom-quill-container .ql-container {
      flex: 1 1 0%;
      display: flex;
      flex-direction: column;
      min-height: 0;
      border: none !important;
      position: relative;
      overflow: hidden !important;
  }
  .custom-quill-container .ql-editor {
      flex: 1 1 0%;
      overflow-y: auto;
      font-size: 0.95rem;
      line-height: 1.7;
      padding: 12px 16px;
  }
  
  /* رفع باگ سرریز پلیس‌هولدر هنگام فشرده شدن کادر */
  .custom-quill-container .ql-editor.ql-blank::before {
      max-height: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      pointer-events: none;
      right: 16px;
      left: 16px;
      font-style: normal;
  }

  .custom-quill-container .ql-toolbar {
      border-top: none !important;
      border-left: none !important;
      border-right: none !important;
      border-bottom: 1px solid ${isDark ? '#374151' : '#E5E7EB'} !important;
      flex-shrink: 0;
  }

  /* هوشمندسازی جهت متن (حل مشکل فارسی و انگلیسی همزمان) */
  .ql-editor p,
  .ql-editor h1,
  .ql-editor h2,
  .ql-editor h3,
  .ql-editor li,
  .ql-editor blockquote {
      unicode-bidi: plaintext !important;
      text-align: start !important;
  }

  /* اجبار به چپ‌چین یا راست‌چین بر اساس کلاس‌های تنظیمی */
  .ql-editor .ql-align-left,
  .ql-editor.force-ltr p,
  .ql-editor.force-ltr {
      direction: ltr !important;
      text-align: left !important;
  }
  .ql-editor .ql-align-right,
  .ql-editor.force-rtl p,
  .ql-editor.force-rtl {
      direction: rtl !important;
      text-align: right !important;
  }
  .ql-editor .ql-align-center {
      text-align: center !important;
  }
  .ql-editor .ql-align-justify {
      text-align: justify !important;
  }

  /* استایل اختصاصی بلوک کد برای دستورات کنسول و ترمینال مثل داکر */
  .ql-editor pre.ql-syntax,
  .ql-editor pre {
      direction: ltr !important;
      text-align: left !important;
      background-color: ${isDark ? '#111827' : '#1E293B'} !important;
      color: #38BDF8 !important;
      border: 1px solid ${isDark ? '#374151' : '#334155'} !important;
      border-radius: 8px !important;
      padding: 12px 14px !important;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
      font-size: 0.85rem !important;
      line-height: 1.5 !important;
  }

  /* اسکرول افقی نوار ابزار در صفحات کوچک */
  @media (max-width: 768px) {
      .custom-quill-container .ql-toolbar {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          white-space: nowrap;
          padding: 6px 4px;
          -webkit-overflow-scrolling: touch;
      }
      .custom-quill-container .ql-toolbar::-webkit-scrollbar {
          height: 2px;
      }
      .custom-quill-container .ql-toolbar::-webkit-scrollbar-thumb {
          background-color: ${isDark ? '#4B5563' : '#D1D5DB'};
      }
      .custom-quill-container .ql-toolbar .ql-formats {
          margin-right: 4px !important;
          display: inline-flex !important;
          flex-shrink: 0;
      }
  }

  .hide-quill-toolbar .ql-toolbar {
      display: none !important;
  }
`;

const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        [{ 'size': ['small', false, 'large'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],          
        [{ 'align': ['', 'center', 'right', 'justify'] }],                      
        [{ 'direction': 'rtl' }],                         
        [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
        ['link', 'blockquote', 'code-block'],
        ['clean']                                         
    ]
};

const NoteBubble = memo(({ entry, isDark, userInfo, isAdmin, onEdit, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(entry.content || '');
    const [isSaving, setIsSaving] = useState(false);

    const isAuthor = userInfo?.id === entry.user;
    const canEditOrDelete = isAuthor || isAdmin;

    const handleSaveEdit = () => {
        if (editContent !== entry.content) {
            setIsSaving(true);
            onEdit(entry.id, editContent, () => {
                setIsSaving(false);
                setIsEditing(false);
            }).catch(() => setIsSaving(false));
        } else {
            setIsEditing(false);
        }
    };

    return (
        <div className="w-full flex justify-center py-2.5 px-3 md:px-8 group relative">
            <div className={`w-full max-w-5xl p-4 md:p-6 rounded-2xl shadow-sm border transition-colors relative ${
                isDark ? 'bg-gray-800/90 border-gray-700/80 shadow-black/20' : 'bg-white border-gray-200/90 shadow-gray-200/50'
            }`}>
                
                {canEditOrDelete && !isEditing && (
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 bg-gray-900/70 p-1.5 rounded-xl backdrop-blur-md z-10">
                        <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-blue-400 p-1.5 transition-colors" title="ویرایش">
                            <FaEdit className="text-xs" />
                        </button>
                        <button onClick={() => onDelete(entry.id)} className="text-gray-300 hover:text-red-400 p-1.5 transition-colors" title="حذف">
                            <FaTrash className="text-xs" />
                        </button>
                    </div>
                )}

                {entry.media && entry.media.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-3">
                        {entry.media.map((file, idx) => (
                            file.file_type === 'IMAGE' ? (
                                <img key={idx} src={file.file} alt="media" className={`rounded-xl max-w-full max-h-80 object-cover border shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                            ) : file.file_type === 'VIDEO' ? (
                                <video key={idx} controls className={`rounded-xl max-w-full max-h-80 border shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <source src={file.file} type="video/mp4" />
                                </video>
                            ) : (
                                <a key={idx} href={file.file} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 border px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm ${isDark ? 'bg-gray-700/50 border-gray-600 text-blue-400 hover:bg-gray-700' : 'bg-gray-50 border-gray-300 text-blue-600 hover:bg-gray-100'}`}>
                                    <FaFileDownload /> دانلود فایل ضمیمه
                                </a>
                            )
                        ))}
                    </div>
                )}

                {isEditing ? (
                    <div className="mt-2 relative z-20">
                        <div className={`mb-3 rounded-xl overflow-hidden border ${isDark ? 'quill-dark border-gray-600' : 'bg-white border-gray-300'}`}>
                            <ReactQuill 
                                theme="snow"
                                value={editContent}
                                onChange={setEditContent}
                                modules={quillModules}
                                className="w-full" 
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsEditing(false)} disabled={isSaving} className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>انصراف</button>
                            <button onClick={handleSaveEdit} disabled={isSaving} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors shadow-sm min-w-[100px] flex items-center justify-center">
                                {isSaving ? <FaSpinner className="animate-spin text-sm" /> : 'ذخیره تغییرات'}
                            </button>
                        </div>
                    </div>
                ) : (
                    entry.content && (
                        <div className={`ql-snow w-full ${isDark ? 'quill-dark' : ''}`}>
                            <div 
                                className={`ql-editor !p-0 max-w-none break-words whitespace-pre-wrap leading-relaxed [&_img]:max-w-full [&_img]:rounded-xl ${
                                    isDark ? 'text-gray-200' : 'text-gray-800'
                                }`} 
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(entry.content) }}
                            />
                        </div>
                    )
                )}
            </div>
        </div>
    );
});

const NotebookScreen = () => {
    const dispatch = useDispatch();
    const { notebooks, currentEntries, loading } = useSelector((state) => state.notebook);
    const mode = useSelector((state) => state.theme?.mode || 'dark');
    
    const { userInfo } = useSelector((state) => state.userLogin);
    const isAdmin = userInfo?.is_admin; 
    
    const isDark = mode === 'dark';

    const [activeNotebook, setActiveNotebook] = useState(null);
    const [inputText, setInputText] = useState('');
    
    const [newNotebookTitle, setNewNotebookTitle] = useState('');
    const [newNotebookType, setNewNotebookType] = useState('PERSONAL');

    const [isEditingNotebook, setIsEditingNotebook] = useState(false);
    const [editNbTitle, setEditNbTitle] = useState('');
    const [editNbType, setEditNbType] = useState('PERSONAL');

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const [isSending, setIsSending] = useState(false);
    const [isCreatingNb, setIsCreatingNb] = useState(false);
    const [isUpdatingNb, setIsUpdatingNb] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const endOfNotesRef = useRef(null);
    const quillRef = useRef(null);
    
    const prevEntriesLengthRef = useRef(0);
    const currentNotebookIdRef = useRef(null);

    const [showFormatting, setShowFormatting] = useState(true);
    const [editorDirection, setEditorDirection] = useState('auto'); // 'auto', 'ltr', 'rtl'

    // مقداردهی اولیه ارتفاع بخش تایپ (با حداقل ارتفاع مطمئن 170 پیکسل)
    const [inputHeight, setInputHeight] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('notebook_input_height_v2');
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 170 && parsed <= 600) return parsed;
            }
            return window.innerWidth < 768 ? 220 : 250;
        }
        return 230;
    });

    const isDraggingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(230);

    useEffect(() => { dispatch(fetchNotebooks()); }, [dispatch]);

    useEffect(() => {
        if (notebooks.length > 0) {
            const savedNotebookId = localStorage.getItem('activeNotebookId');
            if (savedNotebookId) {
                const foundNotebook = notebooks.find(nb => String(nb.id) === savedNotebookId);
                if (foundNotebook) {
                    setActiveNotebook(foundNotebook);
                } else {
                    setActiveNotebook(null);
                    localStorage.removeItem('activeNotebookId');
                }
            }
        } else if (!loading && notebooks.length === 0) {
            setActiveNotebook(null);
            localStorage.removeItem('activeNotebookId');
        }
    }, [notebooks, loading]);

    useEffect(() => {
        if (activeNotebook) {
            dispatch(fetchNoteEntries(activeNotebook.id));
            setIsEditingNotebook(false);
            setSearchQuery('');
            setIsSearchOpen(false);
        }
    }, [activeNotebook, dispatch]);

    useEffect(() => {
        const isNewNotebook = activeNotebook?.id !== currentNotebookIdRef.current;
        const isNewMessageAdded = currentEntries.length > prevEntriesLengthRef.current;

        if ((isNewNotebook || isNewMessageAdded) && !searchQuery) {
            setTimeout(() => {
                endOfNotesRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }

        prevEntriesLengthRef.current = currentEntries.length;
        currentNotebookIdRef.current = activeNotebook?.id;
    }, [currentEntries, activeNotebook, searchQuery]);

    // منطق تغییر اندازه درگبل با ماوس و لمس
    const handleDividerMouseDown = (e) => {
        e.preventDefault();
        isDraggingRef.current = true;
        startYRef.current = e.clientY;
        startHeightRef.current = inputHeight;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'row-resize';

        const handleMouseMove = (moveEvent) => {
            if (!isDraggingRef.current) return;
            const delta = startYRef.current - moveEvent.clientY;
            const maxHeight = Math.min(window.innerHeight * 0.75, 600);
            // حداقل ارتفاع 165 پیکسل در نظر گرفته شده تا مانع سرریز عناصر روی دکمه‌ها شود
            const newHeight = Math.max(165, Math.min(startHeightRef.current + delta, maxHeight));
            setInputHeight(newHeight);
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            setInputHeight((curr) => {
                localStorage.setItem('notebook_input_height_v2', String(curr));
                return curr;
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleDividerTouchStart = (e) => {
        if (!e.touches?.[0]) return;
        isDraggingRef.current = true;
        startYRef.current = e.touches[0].clientY;
        startHeightRef.current = inputHeight;

        const handleTouchMove = (moveEvent) => {
            if (!isDraggingRef.current || !moveEvent.touches?.[0]) return;
            if (moveEvent.cancelable) moveEvent.preventDefault();
            const delta = startYRef.current - moveEvent.touches[0].clientY;
            const maxHeight = Math.min(window.innerHeight * 0.75, 600);
            const newHeight = Math.max(165, Math.min(startHeightRef.current + delta, maxHeight));
            setInputHeight(newHeight);
        };

        const handleTouchEnd = () => {
            isDraggingRef.current = false;
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            setInputHeight((curr) => {
                localStorage.setItem('notebook_input_height_v2', String(curr));
                return curr;
            });
        };

        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
    };

    // سوئیچ سریع جهت نوشتار (فارسی / انگلیسی)
    const toggleDirectionMode = () => {
        const nextMode = editorDirection === 'ltr' ? 'rtl' : 'ltr';
        setEditorDirection(nextMode);
        const editor = quillRef.current?.getEditor();
        if (editor) {
            editor.format('direction', nextMode === 'rtl' ? 'rtl' : false);
            editor.format('align', nextMode === 'rtl' ? 'right' : 'left');
        }
    };

    const handleSelectNotebook = (nb) => {
        setActiveNotebook(nb);
        localStorage.setItem('activeNotebookId', nb.id);
    };

    const handleBackToList = () => {
        setActiveNotebook(null);
        localStorage.removeItem('activeNotebookId');
    };

    const isInputEmpty = !inputText.replace(/<[^>]*>/g, '').trim() && !selectedFile;

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (isInputEmpty || !activeNotebook) return;

        setIsSending(true);
        const formData = new FormData();
        formData.append('content', inputText);
        if (selectedFile) formData.append('file', selectedFile);

        dispatch(createNoteEntry({ notebookId: activeNotebook.id, formData })).then((action) => {
            setIsSending(false);
            if (action.meta.requestStatus !== 'fulfilled') {
                alert('خطا در ارسال پیام: ' + (action.payload || 'مسیر یافت نشد.'));
            } else {
                setInputText('');
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setSearchQuery('');
                setIsSearchOpen(false);
            }
        });
    };

    const handleCreateNotebook = (e) => {
        e.preventDefault();
        if (!newNotebookTitle.trim()) return;
        
        setIsCreatingNb(true);
        dispatch(createNotebook({ title: newNotebookTitle, notebook_type: newNotebookType })).then((action) => {
            setIsCreatingNb(false);
            if (action.meta.requestStatus !== 'fulfilled') {
                alert('خطا در ساخت دفترچه: ' + (action.payload || 'مسیر یافت نشد.'));
            } else {
                setNewNotebookTitle('');
                setNewNotebookType('PERSONAL'); 
            }
        });
    };

    const handleStartEditNotebook = () => {
        setEditNbTitle(activeNotebook.title);
        setEditNbType(activeNotebook.notebook_type);
        setIsEditingNotebook(true);
    };

    const handleSaveNotebookUpdate = () => {
        if (!editNbTitle.trim()) return;
        
        setIsUpdatingNb(true);
        dispatch(updateNotebook({
            notebookId: activeNotebook.id,
            data: { title: editNbTitle, notebook_type: editNbType }
        })).then((action) => {
            setIsUpdatingNb(false);
            if(action.meta.requestStatus === 'fulfilled') {
                setActiveNotebook(action.payload);
                setIsEditingNotebook(false);
            } else {
                alert('خطا در ویرایش دفترچه: مسیر یافت نشد یا دسترسی ندارید.');
            }
        });
    };

    const handleDeleteNotebook = () => {
        if (window.confirm('آیا از حذف این دفترچه و تمام محتویات آن اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
            dispatch(deleteNotebook(activeNotebook.id)).then((action) => {
                if (action.meta.requestStatus === 'fulfilled') {
                    handleBackToList();
                } else {
                    alert('خطا در حذف دفترچه: مسیر یافت نشد.');
                }
            });
        }
    };

    const handleEditNote = (entryId, newContent, onSuccess) => {
        return dispatch(editNoteEntry({ entryId, content: newContent })).then((action) => {
            if (action.meta.requestStatus === 'fulfilled') {
                if(onSuccess) onSuccess();
            } else {
                alert('خطا در ویرایش پیام.');
                throw new Error('Edit failed');
            }
        });
    };

    const handleDeleteNote = (entryId) => {
        if (window.confirm('آیا از حذف این یادداشت/بایگانی مطمئن هستید؟')) {
            dispatch(deleteNoteEntry(entryId)).then((action) => {
                if (action.meta.requestStatus !== 'fulfilled') {
                    alert('خطا در حذف پیام: مسیر یافت نشد یا دسترسی ندارید.');
                }
            });
        }
    };

    const stripHTML = (html) => (html || '').replace(/<[^>]*>?/gm, '');

    const filteredEntries = currentEntries.filter(entry => 
        stripHTML(entry.content).toLowerCase().includes(searchQuery.toLowerCase())
    );

    const canManageNotebook = activeNotebook && (isAdmin || activeNotebook.user === userInfo?.id);

    return (
        /* ساختار Edge-to-Edge بدون فاصله‌های خالی و مطابق با استانداردهای مدرن دسکتاپ و موبایل */
        <div className={`h-[100dvh] w-full flex flex-col overflow-hidden transition-colors duration-200 ${
            isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            <style>{getCustomScrollbarStyle(isDark)}</style>
            
            <div className="flex h-full w-full overflow-hidden">
                
                {/* پنل کناری دفترچه‌ها */}
                <div className={`${activeNotebook ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col shrink-0 transition-colors duration-200 border-l ${
                    isDark ? 'bg-gray-900/90 border-gray-800' : 'bg-white border-gray-200 shadow-sm'
                }`}>
                    <div className={`p-4 md:p-5 font-black text-lg border-b flex items-center justify-between ${
                        isDark ? 'border-gray-800 text-white' : 'border-gray-100 text-gray-800'
                    }`}>
                        <div className="flex items-center gap-2.5">
                            <FaBookOpen className="text-blue-500 text-xl" />
                            <span>مدیریت دفترچه‌ها</span>
                        </div>
                    </div>

                    <form onSubmit={handleCreateNotebook} className={`p-3.5 border-b flex flex-col gap-2.5 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                        {isAdmin && (
                            <div className="flex items-center gap-4 px-1">
                                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                    <input type="radio" value="PERSONAL" checked={newNotebookType === 'PERSONAL'} onChange={(e) => setNewNotebookType(e.target.value)} className="accent-blue-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>دفترچه شخصی</span>
                                </label>
                                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                    <input type="radio" value="COMPANY" checked={newNotebookType === 'COMPANY'} onChange={(e) => setNewNotebookType(e.target.value)} className="accent-yellow-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>بایگانی شرکتی</span>
                                </label>
                            </div>
                        )}
                        <div className="relative">
                            <input 
                                type="text" 
                                value={newNotebookTitle} 
                                onChange={(e) => setNewNotebookTitle(e.target.value)} 
                                placeholder="نام دفترچه جدید..." 
                                className={`w-full py-2.5 pl-10 pr-3.5 rounded-xl text-xs font-bold border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                                    isDark ? 'bg-gray-800/80 text-white border-gray-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'
                                }`} 
                            />
                            <button type="submit" disabled={isCreatingNb} className={`absolute left-1.5 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-blue-600' : 'text-gray-400 hover:text-white hover:bg-blue-500'} ${isCreatingNb ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isCreatingNb ? <FaSpinner className="animate-spin text-xs" /> : <FaPlus className="text-xs" />}
                            </button>
                        </div>
                    </form>

                    <div className="overflow-y-auto flex-1 p-2.5 space-y-1.5 notebook-scrollbar">
                        {loading && notebooks.length === 0 ? (
                            <p className={`text-center mt-6 font-bold text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>در حال بارگذاری...</p>
                        ) : notebooks.length === 0 ? (
                            <div className={`text-center mt-12 font-bold flex flex-col items-center gap-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                <FaFolderOpen className="text-3xl opacity-40" />
                                <p className="text-xs">دفترچه‌ای وجود ندارد.</p>
                            </div>
                        ) : (
                            notebooks.map(nb => (
                                <button
                                    key={nb.id}
                                    onClick={() => handleSelectNotebook(nb)}
                                    className={`w-full text-right px-3.5 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-between group border relative overflow-hidden ${
                                        activeNotebook?.id === nb.id
                                            ? isDark 
                                                ? 'bg-blue-900/30 text-blue-400 border-blue-500/40' 
                                                : 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm'
                                            : isDark
                                                ? 'bg-gray-800/40 hover:bg-gray-800 text-gray-300 border-transparent hover:border-gray-700'
                                                : 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent'
                                    }`}
                                >
                                    {nb.notebook_type === 'COMPANY' && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-500 rounded-r-lg"></div>
                                    )}
                                    <div className="flex items-center gap-2.5 truncate">
                                        <FaHashtag className={activeNotebook?.id === nb.id ? 'text-blue-500' : isDark ? 'text-gray-600' : 'text-gray-400'} />
                                        <span className="truncate">{nb.title}</span>
                                        {nb.notebook_type === 'COMPANY' ? (
                                            <span className="text-[9px] bg-yellow-500/15 text-yellow-600 px-1.5 py-0.5 rounded-md shrink-0">شرکتی</span>
                                        ) : (
                                            <span className="text-[9px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md shrink-0">شخصی</span>
                                        )}
                                    </div>
                                    <FaChevronLeft className={`text-[10px] md:hidden shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* صفحه اصلی یادداشت‌ها */}
                <div className={`${!activeNotebook ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative min-w-0 h-full overflow-hidden ${
                    isDark ? 'bg-gray-950' : 'bg-gray-100/50'
                }`}>
                    {activeNotebook ? (
                        <>
                            {/* هدر یکپارچه و تمیز بالا */}
                            <div className={`px-4 py-3 md:px-6 border-b flex items-center justify-between z-10 shrink-0 h-16 transition-colors ${
                                isDark ? 'bg-gray-900/90 backdrop-blur border-gray-800' : 'bg-white/90 backdrop-blur border-gray-200'
                            }`}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <button
                                        onClick={handleBackToList}
                                        className={`md:hidden flex items-center justify-center p-2 rounded-xl border ${
                                            isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-800 border-gray-200'
                                        }`}
                                    >
                                        <FaChevronRight className="text-xs" />
                                    </button>

                                    {isEditingNotebook ? (
                                        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                                            <input type="text" value={editNbTitle} onChange={e => setEditNbTitle(e.target.value)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 md:w-56 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'}`} />
                                            {isAdmin && (
                                                <div className="flex items-center gap-2 bg-gray-800/20 px-2.5 py-1 rounded-lg border border-gray-500/20">
                                                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                                                        <input type="radio" value="PERSONAL" checked={editNbType === 'PERSONAL'} onChange={(e) => setEditNbType(e.target.value)} className="accent-blue-500" />
                                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>شخصی</span>
                                                    </label>
                                                    <label className="flex items-center gap-1 text-[11px] cursor-pointer">
                                                        <input type="radio" value="COMPANY" checked={editNbType === 'COMPANY'} onChange={(e) => setEditNbType(e.target.value)} className="accent-yellow-500" />
                                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>شرکتی</span>
                                                    </label>
                                                </div>
                                            )}
                                            <button onClick={handleSaveNotebookUpdate} disabled={isUpdatingNb} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center min-w-[60px]">
                                                {isUpdatingNb ? <FaSpinner className="animate-spin" /> : 'ذخیره'}
                                            </button>
                                            <button onClick={() => setIsEditingNotebook(false)} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>لغو</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 min-w-0">
                                            <h2 className={`font-black text-lg md:text-xl truncate flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`} title={activeNotebook.title}>
                                                <FaHashtag className="text-blue-500 opacity-80 shrink-0 text-base" />
                                                <span className="truncate">{activeNotebook.title}</span>
                                            </h2>
                                            {activeNotebook.notebook_type === 'COMPANY' ? (
                                                <span className="bg-yellow-500/15 text-yellow-600 border border-yellow-500/30 text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0">بایگانی شرکت</span>
                                            ) : (
                                                <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-lg font-bold shrink-0">دفترچه شخصی</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {!isEditingNotebook && (
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <div className="flex items-center">
                                            {isSearchOpen ? (
                                                <div className={`flex items-center px-2.5 py-1 rounded-lg border transition-all ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                                                    <input 
                                                        type="text" 
                                                        placeholder="جستجو در پیام‌ها..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        autoFocus
                                                        className={`bg-transparent border-none focus:outline-none text-xs w-28 md:w-44 ${isDark ? 'text-white' : 'text-gray-900'}`}
                                                    />
                                                    <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-gray-400 hover:text-red-500 mr-1.5">
                                                        <FaTimes className="text-xs" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => setIsSearchOpen(true)} className={`p-2 rounded-xl transition-colors ${isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`} title="جستجو">
                                                    <FaSearch className="text-sm" />
                                                </button>
                                            )}
                                        </div>

                                        {canManageNotebook && (
                                            <>
                                                <button onClick={handleStartEditNotebook} className={`p-2 rounded-xl transition-colors ${isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-500 hover:text-blue-600 hover:bg-gray-100'}`} title="ویرایش نام دفترچه">
                                                    <FaCog className="text-sm" />
                                                </button>
                                                <button onClick={handleDeleteNotebook} className={`p-2 rounded-xl transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800' : 'text-gray-500 hover:text-red-600 hover:bg-gray-100'}`} title="حذف دفترچه">
                                                    <FaTrash className="text-sm" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* محوطه نمایش پیام‌ها */}
                            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col scroll-smooth notebook-scrollbar">
                                {filteredEntries.length > 0 ? (
                                    filteredEntries.map((entry) => (
                                        <NoteBubble 
                                            key={entry.id} 
                                            entry={entry} 
                                            isDark={isDark} 
                                            userInfo={userInfo}
                                            isAdmin={isAdmin}
                                            onEdit={handleEditNote}
                                            onDelete={handleDeleteNote}
                                        />
                                    ))
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-400 text-xs mt-10">
                                        یادداشتی وجود ندارد یا نتیجه‌ای یافت نشد.
                                    </div>
                                )}
                                <div ref={endOfNotesRef} className="pb-6"></div>
                            </div>

                            {/* دیوایدر درگبل شیک و بدون پرش */}
                            <div
                                onMouseDown={handleDividerMouseDown}
                                onTouchStart={handleDividerTouchStart}
                                className={`w-full h-3 cursor-row-resize flex items-center justify-center select-none transition-colors border-t border-b shrink-0 z-10 ${
                                    isDark 
                                        ? 'bg-gray-900 hover:bg-blue-900/30 border-gray-800 hover:border-blue-500/40' 
                                        : 'bg-gray-200/70 hover:bg-blue-100 border-gray-300 hover:border-blue-300'
                                }`}
                                title="برای تنظیم ارتفاع کادر به بالا یا پایین بکشید"
                            >
                                <div className={`w-12 h-1 rounded-full transition-colors ${
                                    isDark ? 'bg-gray-700' : 'bg-gray-400'
                                }`} />
                            </div>

                            {/* پنل تایپ با ارتفاع دینامیک و جلوگیری ۱۰۰٪ از سرریز عناصر روی دکمه‌ها */}
                            <div 
                                style={{ height: `${inputHeight}px` }} 
                                className={`p-2.5 md:p-4 shrink-0 transition-colors flex flex-col ${
                                    isDark ? 'bg-gray-950' : 'bg-white'
                                }`}
                            >
                                <div className="max-w-5xl w-full mx-auto flex flex-col h-full min-h-0 relative">
                                    {selectedFile && (
                                        <div className={`mb-2 shrink-0 flex items-center gap-2 border w-max px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                                            isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'
                                        }`}>
                                            <FaPaperclip className="text-blue-500" />
                                            <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                                            <button type="button" onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-red-500 mr-1">
                                                <FaTimes />
                                            </button>
                                        </div>
                                    )}

                                    <form 
                                        onSubmit={handleSendMessage} 
                                        className={`flex-1 min-h-0 flex flex-col border rounded-2xl shadow-sm overflow-hidden transition-colors ${
                                            isDark ? 'bg-gray-900 border-gray-800 focus-within:border-blue-500/60' : 'bg-white border-gray-300 focus-within:border-blue-500'
                                        }`}
                                    >
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} 
                                            className="hidden" 
                                        />

                                        {/* ادیتور متنی مجهز به کلاس هوشمند چپ‌چین/راست‌چین */}
                                        <div className={`flex-1 min-h-0 flex flex-col ${isDark ? 'quill-dark' : ''} ${!showFormatting ? 'hide-quill-toolbar' : ''}`}>
                                            <ReactQuill 
                                                ref={quillRef}
                                                theme="snow"
                                                value={inputText}
                                                onChange={setInputText}
                                                modules={quillModules}
                                                placeholder="یادداشت خود را بنویسید (فارسی یا انگلیسی)..."
                                                className={`custom-quill-container ${editorDirection === 'ltr' ? 'force-ltr' : editorDirection === 'rtl' ? 'force-rtl' : ''}`}
                                            />
                                        </div>

                                        {/* نوار ابزارهای پایین: پس‌زمینه سالید و لایه z-20 مانع رد شدن پلیس‌هولدر و متن می‌شود */}
                                        <div className={`p-2 px-3 flex items-center justify-between border-t shrink-0 relative z-20 ${
                                            isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'
                                        }`}>
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => fileInputRef.current.click()} 
                                                    className={`p-2 rounded-xl transition-colors ${
                                                        isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                    }`}
                                                    title="پیوست فایل"
                                                >
                                                    <FaPaperclip className="text-sm" />
                                                </button>
                                                
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowFormatting(prev => !prev)} 
                                                    className={`p-2 px-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold ${
                                                        showFormatting 
                                                            ? 'bg-blue-600/15 text-blue-500 border border-blue-500/30' 
                                                            : isDark 
                                                                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                                                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                                    }`}
                                                    title={showFormatting ? "پنهان‌سازی نوار ابزار" : "نمایش ابزارهای نگارش"}
                                                >
                                                    <FaFont className="text-xs" />
                                                    <span className="hidden sm:inline">ابزارها</span>
                                                </button>

                                                {/* سوئیچر سریع جهت نوشتار LTR / RTL */}
                                                <button 
                                                    type="button" 
                                                    onClick={toggleDirectionMode} 
                                                    className={`p-2 px-2.5 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold ${
                                                        editorDirection === 'ltr' 
                                                            ? 'bg-emerald-600/15 text-emerald-500 border border-emerald-500/30' 
                                                            : isDark 
                                                                ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' 
                                                                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                                    }`}
                                                    title="تغییر جهت چپ‌چین (انگلیسی) / راست‌چین (فارسی)"
                                                >
                                                    {editorDirection === 'ltr' ? <FaAlignLeft className="text-xs" /> : <FaAlignRight className="text-xs" />}
                                                    <span className="hidden sm:inline">{editorDirection === 'ltr' ? 'انگلیسی (LTR)' : 'فارسی (RTL)'}</span>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="submit" 
                                                    disabled={isInputEmpty || isSending} 
                                                    className={`px-4 py-2 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 ${
                                                        isInputEmpty || isSending 
                                                            ? (isDark ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') 
                                                            : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95'
                                                    }`}
                                                >
                                                    <span>ارسال</span>
                                                    {isSending ? <FaSpinner className="text-xs animate-spin" /> : <FaPaperPlane className="text-xs" />}
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={`hidden md:flex flex-1 items-center justify-center flex-col gap-4 ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
                            <div className={`p-8 rounded-full border-2 border-dashed ${isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
                                <FaBook className={`text-6xl ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                            </div>
                            <p className={`text-sm font-bold ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>برای شروع، یک دفترچه را از منوی کناری انتخاب کنید</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotebookScreen;