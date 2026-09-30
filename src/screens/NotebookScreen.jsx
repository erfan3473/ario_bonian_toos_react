import React, { useState, useEffect, useRef, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import DOMPurify from 'dompurify';

import { 
    FaFileDownload, FaBookOpen, FaPlus, 
    FaHashtag, FaChevronLeft, FaChevronRight, FaPaperclip, 
    FaTimes, FaPlusCircle, FaPaperPlane, FaBook, FaFolderOpen,
    FaEdit, FaTrash, FaCog, FaSpinner
} from 'react-icons/fa';

import { 
    fetchNotebooks, fetchNoteEntries, createNoteEntry, createNotebook, 
    editNoteEntry, deleteNoteEntry, updateNotebook, deleteNotebook 
} from '../features/notebook/notebookSlice';

const getCustomScrollbarStyle = (isDark) => `
  .notebook-scrollbar::-webkit-scrollbar {
      width: 6px;
  }
  .notebook-scrollbar::-webkit-scrollbar-track {
      background-color: transparent;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb {
      background-color: ${isDark ? '#4B5563' : '#D1D5DB'};
      border-radius: 10px;
  }
  .notebook-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: ${isDark ? '#3B82F6' : '#60A5FA'};
  }
  
  /* رنگ‌های اختصاصی دارک‌مود */
  .quill-dark .ql-toolbar {
      background-color: #374151;
      border-color: #4B5563;
  }
  .quill-dark .ql-toolbar .ql-stroke { stroke: #D1D5DB; }
  .quill-dark .ql-toolbar .ql-fill { fill: #D1D5DB; }
  .quill-dark .ql-toolbar .ql-picker { color: #D1D5DB; }
  .quill-dark .ql-container {
      border-color: #4B5563;
      color: #F3F4F6;
  }
  .quill-dark .ql-editor.ql-blank::before { color: #9CA3AF; }
`;

// تنظیمات نوار ابزار ادیتور
const quillModules = {
    toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],          
        [{ 'align': [] }], // دادن آرایه خالی به Quill می‌گوید تمام گزینه‌های الاین (چپ، راست، وسط، جاستیفای) را بیاور                      
        [{ 'direction': 'rtl' }],                         
        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }], 
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
        <div className="w-full flex justify-center py-3 px-2 md:px-4 group relative">
            <div className={`w-full max-w-4xl p-5 md:p-6 rounded-2xl shadow-sm border transition-colors relative ${
                isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'
            }`}>
                
                {canEditOrDelete && !isEditing && (
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-gray-900/50 p-1.5 rounded-lg backdrop-blur-sm z-10">
                        <button onClick={() => setIsEditing(true)} className="text-gray-300 hover:text-blue-400 p-1 transition-colors" title="ویرایش">
                            <FaEdit />
                        </button>
                        <button onClick={() => onDelete(entry.id)} className="text-gray-300 hover:text-red-400 p-1 transition-colors" title="حذف">
                            <FaTrash />
                        </button>
                    </div>
                )}

                {entry.media && entry.media.length > 0 && (
                    <div className="mb-5 flex flex-wrap gap-4">
                        {entry.media.map((file, idx) => (
                            file.file_type === 'IMAGE' ? (
                                <img key={idx} src={file.file} alt="media" className={`rounded-xl max-w-full max-h-80 object-cover border shadow-sm ${isDark ? 'border-gray-600' : 'border-gray-200'}`} />
                            ) : file.file_type === 'VIDEO' ? (
                                <video key={idx} controls className={`rounded-xl max-w-full max-h-80 border shadow-sm ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <source src={file.file} type="video/mp4" />
                                </video>
                            ) : (
                                <a key={idx} href={file.file} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-3 border px-5 py-3 rounded-xl font-bold transition-colors shadow-sm ${isDark ? 'bg-gray-700/50 border-gray-600 text-blue-400 hover:bg-gray-700' : 'bg-gray-50 border-gray-300 text-blue-600 hover:bg-gray-100'}`}>
                                    <FaFileDownload className="text-xl" /> دانلود فایل ضمیمه
                                </a>
                            )
                        ))}
                    </div>
                )}

                {isEditing ? (
                    <div className="mt-2 relative z-20">
                        <div className={`mb-3 rounded-xl ${isDark ? 'quill-dark' : 'bg-white'}`}>
                            <ReactQuill 
                                theme="snow"
                                value={editContent}
                                onChange={setEditContent}
                                modules={quillModules}
                                className="w-full" 
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setIsEditing(false)} disabled={isSaving} className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>انصراف</button>
                            <button onClick={handleSaveEdit} disabled={isSaving} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors shadow-md min-w-[120px] flex items-center justify-center">
                                {isSaving ? <FaSpinner className="animate-spin text-lg" /> : 'ذخیره تغییرات'}
                            </button>
                        </div>
                    </div>
                ) : (
                    entry.content && (
                        /* 🔴 حذف کلاس‌های مخرب (مثل !p-0) برای یکسان‌سازی دقیق با ادیتور */
                        <div className={`ql-snow w-full ${isDark ? 'quill-dark' : ''}`}>
                            <div 
                                className={`ql-editor max-w-none break-words whitespace-pre-wrap [&_img]:max-w-full [&_img]:rounded-lg ${
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

    const [isSending, setIsSending] = useState(false);
    const [isCreatingNb, setIsCreatingNb] = useState(false);
    const [isUpdatingNb, setIsUpdatingNb] = useState(false);

    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);
    const endOfNotesRef = useRef(null);
    
    const prevEntriesLengthRef = useRef(0);
    const currentNotebookIdRef = useRef(null);

    useEffect(() => { dispatch(fetchNotebooks()); }, [dispatch]);

    useEffect(() => {
        // 🔴 حل نهایی مشکل پریدن دفترچه بعد از رفرش صفحه
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
        }
        // بخش else if کاملاً حذف شد تا دیتای localStorage قبل از رسیدن ریکوئست سرور پاک نشود!
    }, [notebooks]);

    useEffect(() => {
        if (activeNotebook) {
            dispatch(fetchNoteEntries(activeNotebook.id));
            setIsEditingNotebook(false); 
        }
    }, [activeNotebook, dispatch]);

    useEffect(() => {
        const isNewNotebook = activeNotebook?.id !== currentNotebookIdRef.current;
        const isNewMessageAdded = currentEntries.length > prevEntriesLengthRef.current;

        if (isNewNotebook || isNewMessageAdded) {
            setTimeout(() => {
                endOfNotesRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }

        prevEntriesLengthRef.current = currentEntries.length;
        currentNotebookIdRef.current = activeNotebook?.id;
    }, [currentEntries, activeNotebook]);

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

    const canManageNotebook = activeNotebook && (isAdmin || activeNotebook.user === userInfo?.id);

    return (
        <div className={`min-h-[85vh] p-2 md:p-6 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <style>{getCustomScrollbarStyle(isDark)}</style>
            
            <div className={`flex h-[calc(100vh-140px)] w-full max-w-7xl mx-auto rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border-2 ${
                isDark ? 'border-blue-700 bg-gray-800/40' : 'border-blue-600 bg-gray-100/50'
            }`}>
                
                {/* پنل کناری دفترچه‌ها */}
                <div className={`${activeNotebook ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col shrink-0 transition-colors duration-300 border-l ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className={`p-6 font-black text-xl border-b flex items-center gap-3 ${
                        isDark ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-800'
                    }`}>
                        <FaBookOpen className="text-blue-500 text-2xl" />
                        مدیریت دفترچه‌ها
                    </div>

                    <form onSubmit={handleCreateNotebook} className={`p-4 border-b flex flex-col gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        {isAdmin && (
                            <div className="flex items-center gap-5 px-1 mb-1">
                                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                                    <input type="radio" value="PERSONAL" checked={newNotebookType === 'PERSONAL'} onChange={(e) => setNewNotebookType(e.target.value)} className="w-4 h-4 accent-blue-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>دفترچه شخصی</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
                                    <input type="radio" value="COMPANY" checked={newNotebookType === 'COMPANY'} onChange={(e) => setNewNotebookType(e.target.value)} className="w-4 h-4 accent-yellow-500" />
                                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>بایگانی شرکتی</span>
                                </label>
                            </div>
                        )}
                        <div className="relative">
                            <input type="text" value={newNotebookTitle} onChange={(e) => setNewNotebookTitle(e.target.value)} placeholder="نام دفترچه جدید..." className={`w-full py-3 pl-12 pr-4 rounded-xl text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDark ? 'bg-gray-900 text-white border-gray-600 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-500'}`} />
                            <button type="submit" disabled={isCreatingNb} className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white hover:bg-blue-600' : 'text-gray-400 hover:text-white hover:bg-blue-500'} ${isCreatingNb ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isCreatingNb ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                            </button>
                        </div>
                    </form>

                    <div className="overflow-y-auto flex-1 p-3 space-y-2 notebook-scrollbar">
                        {loading && notebooks.length === 0 ? (
                            <p className={`text-center mt-6 font-bold text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>در حال بارگذاری...</p>
                        ) : notebooks.length === 0 ? (
                            <div className={`text-center mt-10 font-bold flex flex-col items-center gap-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <FaFolderOpen className="text-4xl opacity-50" />
                                <p>دفترچه‌ای وجود ندارد.</p>
                            </div>
                        ) : (
                            notebooks.map(nb => (
                                <button
                                    key={nb.id}
                                    onClick={() => handleSelectNotebook(nb)}
                                    className={`w-full text-right px-4 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-between group border relative overflow-hidden ${
                                        activeNotebook?.id === nb.id
                                            ? isDark 
                                                ? 'bg-blue-900/40 text-blue-400 border-blue-500/50 shadow-md' 
                                                : 'bg-blue-50 text-blue-700 border-blue-300 shadow-md'
                                            : isDark
                                                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700 hover:border-gray-600'
                                                : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {nb.notebook_type === 'COMPANY' && (
                                        <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-yellow-500 rounded-r-xl"></div>
                                    )}
                                    <div className="flex items-center gap-3 truncate">
                                        <FaHashtag className={activeNotebook?.id === nb.id ? 'text-blue-500' : isDark ? 'text-gray-500' : 'text-gray-400'} />
                                        <span className="truncate">{nb.title}</span>
                                        {nb.notebook_type === 'COMPANY' ? (
                                            <span className="text-[10px] bg-yellow-500/20 text-yellow-600 px-2 py-0.5 rounded-full ml-2 shrink-0">شرکتی</span>
                                        ) : (
                                            <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-500 px-2 py-0.5 rounded-full ml-2 shrink-0">شخصی</span>
                                        )}
                                    </div>
                                    <FaChevronLeft className={`text-xs md:hidden shrink-0 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* صفحه اصلی یادداشت‌ها */}
                <div className={`${!activeNotebook ? 'hidden md:flex' : 'flex'} flex-1 flex-col relative min-w-0 ${
                    isDark ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                    {activeNotebook ? (
                        <>
                            <div className={`px-4 py-3 md:px-6 md:py-4 border-b flex items-center justify-between z-10 shrink-0 sticky top-0 shadow-sm min-h-[70px] transition-colors ${
                                isDark ? 'bg-gray-900/95 backdrop-blur border-gray-700' : 'bg-white/95 backdrop-blur border-gray-200'
                            }`}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <button
                                        onClick={handleBackToList}
                                        className={`md:hidden flex items-center justify-center p-2.5 rounded-xl transition-colors border shadow-sm ${
                                            isDark ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
                                        }`}
                                    >
                                        <FaChevronRight className="text-sm" />
                                    </button>

                                    {isEditingNotebook ? (
                                        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
                                            <input type="text" value={editNbTitle} onChange={e => setEditNbTitle(e.target.value)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 md:w-60 ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`} />
                                            {isAdmin && (
                                                <div className="flex items-center gap-3 bg-gray-800/20 px-3 py-1.5 rounded-lg border border-gray-500/30">
                                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                        <input type="radio" value="PERSONAL" checked={editNbType === 'PERSONAL'} onChange={(e) => setEditNbType(e.target.value)} className="accent-blue-500" />
                                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>شخصی</span>
                                                    </label>
                                                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                        <input type="radio" value="COMPANY" checked={editNbType === 'COMPANY'} onChange={(e) => setEditNbType(e.target.value)} className="accent-yellow-500" />
                                                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>شرکتی</span>
                                                    </label>
                                                </div>
                                            )}
                                            <button onClick={handleSaveNotebookUpdate} disabled={isUpdatingNb} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center justify-center min-w-[70px]">
                                                {isUpdatingNb ? <FaSpinner className="animate-spin" /> : 'ذخیره'}
                                            </button>
                                            <button onClick={() => setIsEditingNotebook(false)} className={`px-3 py-1.5 rounded-lg text-sm font-bold border transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'}`}>لغو</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 min-w-0">
                                            <h2 className={`font-black text-xl md:text-2xl truncate flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`} title={activeNotebook.title}>
                                                <FaHashtag className="text-blue-500 opacity-70 shrink-0" />
                                                <span className="truncate">{activeNotebook.title}</span>
                                            </h2>
                                            {activeNotebook.notebook_type === 'COMPANY' ? (
                                                <span className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 text-xs px-2 py-1 rounded-lg font-bold shrink-0">بایگانی شرکت</span>
                                            ) : (
                                                <span className="bg-blue-500/10 text-blue-500 border border-blue-500/30 text-xs px-2 py-1 rounded-lg font-bold shrink-0">دفترچه شخصی</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {canManageNotebook && !isEditingNotebook && (
                                    <div className="flex items-center gap-1.5 mr-2">
                                        <button onClick={handleStartEditNotebook} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-800' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`} title="ویرایش دفترچه">
                                            <FaCog />
                                        </button>
                                        <button onClick={handleDeleteNotebook} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-800' : 'text-gray-500 hover:text-red-600 hover:bg-red-50'}`} title="حذف دفترچه">
                                            <FaTrash />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto min-h-0 flex flex-col scroll-smooth notebook-scrollbar pl-1">
                                {currentEntries.map((entry) => (
                                    <NoteBubble 
                                        key={entry.id} 
                                        entry={entry} 
                                        isDark={isDark} 
                                        userInfo={userInfo}
                                        isAdmin={isAdmin}
                                        onEdit={handleEditNote}
                                        onDelete={handleDeleteNote}
                                    />
                                ))}
                                <div ref={endOfNotesRef} className="pb-8 pt-4"></div>
                            </div>

                            <div className={`p-4 md:p-6 shrink-0 border-t transition-colors ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="max-w-4xl mx-auto relative">
                                    {selectedFile && (
                                        <div className={`mb-3 flex items-center gap-3 border w-max px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'}`}>
                                            <FaPaperclip className="text-blue-500" />
                                            <span className="truncate max-w-[150px] md:max-w-[250px]">{selectedFile.name}</span>
                                            <button onClick={() => setSelectedFile(null)} className={`transition-colors p-1 rounded-md ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700' : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'}`}>
                                                <FaTimes />
                                            </button>
                                        </div>
                                    )}

                                    <form onSubmit={handleSendMessage} className={`relative flex items-start flex-col sm:flex-row sm:items-end gap-3 border-2 rounded-2xl md:rounded-3xl shadow-sm p-2 transition-colors ${isDark ? 'bg-gray-800 border-gray-600 focus-within:border-blue-500/80' : 'bg-white border-gray-300 focus-within:border-blue-500/80'}`}>
                                        
                                        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])} className="hidden" />
                                        
                                        <div className={`w-full flex-1 ${isDark ? 'quill-dark' : 'bg-white'}`}>
                                            <ReactQuill 
                                                theme="snow"
                                                value={inputText}
                                                onChange={setInputText}
                                                modules={quillModules}
                                                placeholder="یادداشت خود را به صورت پیشرفته بنویسید..."
                                                className="w-full [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[100px] [&_.ql-editor]:max-h-[250px] [&_.ql-editor]:overflow-y-auto"
                                            />
                                        </div>

                                        <div className="flex gap-2 p-2 self-end sm:self-center shrink-0">
                                            <button type="button" onClick={() => fileInputRef.current.click()} className={`p-3 rounded-xl transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-blue-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-blue-600'}`}>
                                                <FaPlusCircle className="text-xl" />
                                            </button>
                                            <button type="submit" disabled={isInputEmpty || isSending} className={`p-3 w-12 flex items-center justify-center rounded-xl transition-colors ${isInputEmpty || isSending ? (isDark ? 'bg-gray-700 text-gray-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed') : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'}`}>
                                                {isSending ? <FaSpinner className="text-xl animate-spin" /> : <FaPaperPlane className="text-xl" />}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={`hidden md:flex flex-1 items-center justify-center flex-col gap-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                            <div className={`p-10 rounded-full border-4 border-dashed ${isDark ? 'bg-gray-800 bg-gray-800/30' : 'border-gray-200 bg-white'}`}>
                                <FaBook className={`text-7xl ${isDark ? 'text-gray-700' : 'text-gray-300'}`} />
                            </div>
                            <p className={`text-xl font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>برای شروع، یک دفترچه از پنل کناری انتخاب کنید</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotebookScreen;