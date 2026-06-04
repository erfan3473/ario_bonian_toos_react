import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadTaskFile, forwardStep } from '../../features/task/taskSlice';
import axiosInstance from '../../api/axiosInstance';
import {
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaClock, FaUser,
    FaPaperclip, FaFileImage, FaFileAudio, FaFileVideo, FaFile,
    FaUpload, FaSpinner, FaDownload, FaTimes, FaSearch, FaChevronRight
} from 'react-icons/fa';

// ── constants ──
const TASK_TYPE_LABELS = {
    PAYROLL_FORM: 'تکمیل فرم حقوق',
    PURCHASE:     'خرید/تدارکات',
    REPORT:       'گزارش‌دهی',
};

const STATUS_COLORS = {
    PENDING:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DONE:        'bg-green-500/10 text-green-400 border-green-500/20',
    REJECTED:    'bg-red-500/10 text-red-400 border-red-500/20',
    CANCELLED:   'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const STATUS_LABELS = {
    PENDING:     'در انتظار',
    IN_PROGRESS: 'در جریان',
    DONE:        'انجام شده',
    REJECTED:    'رد شده',
    CANCELLED:   'لغو شده',
};

const STEP_STATE_CONFIG = {
    PENDING:            { label: 'در انتظار',      color: 'text-yellow-400', icon: <FaClock /> },
    APPROVED:           { label: 'تایید شد',        color: 'text-green-400',  icon: <FaCheckCircle /> },
    REJECTED_FORWARDED: { label: 'رد و ارجاع',      color: 'text-orange-400', icon: <FaArrowLeft /> },
    REJECTED:           { label: 'رد شد',           color: 'text-red-400',    icon: <FaTimesCircle /> },
    FORWARDED:          { label: 'ارجاع شد',        color: 'text-blue-400',   icon: <FaArrowLeft /> },
    COMPLETED:          { label: 'خاتمه',           color: 'text-gray-400',   icon: <FaCheckCircle /> },
};

const ACTION_LABELS = {
    CREATE:   'ایجاد کرد',
    FORWARD:  'ارجاع داد',
    APPROVE:  'تایید کرد',
    REJECT:   'رد کرد',
    COMPLETE: 'خاتمه داد',
    COMMENT:  'یادداشت گذاشت',
};

const FILE_ICONS = {
    IMAGE: <FaFileImage className="text-blue-400"   />,
    AUDIO: <FaFileAudio className="text-purple-400" />,
    VIDEO: <FaFileVideo className="text-pink-400"   />,
    FILE:  <FaFile      className="text-gray-400"   />,
};

const stepDotColor = (state) => {
    if (state === 'PENDING')  return 'border-yellow-400 bg-[#1e1f20]';
    if (state === 'APPROVED') return 'border-green-400 bg-green-500';
    if (state === 'REJECTED' || state === 'REJECTED_FORWARDED') return 'border-red-400 bg-red-500';
    return 'border-gray-600 bg-gray-600';
};

// ── مودال تایید / رد ──
const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose }) => {
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handle = async () => {
        setLoading(true);
        setError('');
        try {
            await onConfirm(note);
        } catch (err) {
            setError(err.response?.data?.detail || 'خطا در انجام عملیات');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-[#1e1f20] border border-gray-700 rounded-2xl p-5 w-full max-w-sm shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">{message}</p>
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="یادداشت یا دلیل (اختیاری)..."
                    rows={3}
                    className="w-full bg-[#131314] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 resize-none mb-4 placeholder-gray-600"
                />
                {error && <div className="bg-red-900/20 text-red-400 text-xs p-3 rounded-lg mb-4">{error}</div>}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl py-3 text-sm font-medium transition-colors border border-gray-700">
                        انصراف
                    </button>
                    <button onClick={handle} disabled={loading} className={`flex-1 ${confirmClass} text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}>
                        {loading ? <FaSpinner className="animate-spin" /> : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── مودال ارجاع ──
const ForwardModal = ({ taskId, onSuccess, onClose }) => {
    const dispatch = useDispatch();
    const { forwarding } = useSelector(s => s.task);

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [note, setNote] = useState('');
    const [sendSms, setSendSms] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        axiosInstance.get('/tasks/subordinates/')
            .then(r => setList(r.data))
            .catch(() => setError('خطا در بارگیری لیست پرسنل'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = list.filter(e =>
        !search.trim() ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.position_title || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selected) return;
        setError('');
        const result = await dispatch(forwardStep({
            taskId,
            to_user_id: selected.user_id,
            note,
            send_sms: sendSms,
        }));
        if (forwardStep.fulfilled.match(result)) {
            onSuccess();
        } else {
            setError(result.payload || 'خطا در ارجاع ماموریت');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#1e1f20] border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* هدر */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                    <h3 className="text-white font-bold">ارجاع ماموریت</h3>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center transition-colors border border-gray-700">
                        <FaTimes size={12} />
                    </button>
                </div>

                {/* جستجو */}
                <div className="p-4 border-b border-gray-800 bg-[#1e1f20]">
                    <div className="flex items-center gap-2 bg-[#131314] border border-gray-700 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                        <FaSearch className="text-gray-500 shrink-0" size={14} />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجوی نام یا سمت..."
                            className="bg-transparent text-white text-sm flex-1 outline-none placeholder-gray-600"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white">
                                <FaTimes size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* لیست */}
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                    {loading ? (
                        <div className="flex justify-center py-10 text-blue-500"><FaSpinner className="animate-spin text-2xl" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-10">شخصی یافت نشد.</div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filtered.map(emp => {
                                const isSelected = selected?.user_id === emp.user_id;
                                return (
                                    <div key={emp.user_id} onClick={() => setSelected(emp)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-colors border ${isSelected ? 'bg-blue-900/20 border-blue-500/40' : 'bg-transparent border-transparent hover:bg-gray-800/50'}`}>
                                        {emp.avatar_url ? (
                                            <img src={emp.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-700" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-sm text-blue-400 font-bold shrink-0 border border-blue-500/30">
                                                {emp.name?.[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${isSelected ? 'text-blue-400' : 'text-gray-200'}`}>{emp.name}</div>
                                            {emp.position_title && <div className="text-xs text-gray-500 truncate mt-0.5">{emp.position_title}</div>}
                                        </div>
                                        {isSelected && <FaCheckCircle className="text-blue-500 shrink-0" size={16} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* فوتر: یادداشت + SMS + دکمه */}
                <div className="p-4 border-t border-gray-800 bg-[#1e1f20] rounded-b-2xl space-y-3 shrink-0">
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="یادداشت ارجاع (اختیاری)..."
                        rows={2}
                        className="w-full bg-[#131314] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 resize-none placeholder-gray-600"
                    />

                    <div onClick={() => setSendSms(v => !v)} className="flex items-center justify-between p-3 rounded-xl border border-gray-800 bg-[#131314] cursor-pointer">
                        <span className="text-sm text-gray-300">ارسال پیامک اطلاع‌رسانی</span>
                        <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${sendSms ? 'bg-blue-500' : 'bg-gray-700'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${sendSms ? 'left-1' : 'right-1'}`} />
                        </div>
                    </div>

                    {error && <div className="text-red-400 text-xs text-center p-2 bg-red-900/20 rounded-lg">{error}</div>}

                    <button onClick={handleSubmit} disabled={!selected || forwarding} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-gray-500 text-white rounded-xl py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                        {forwarding ? <FaSpinner className="animate-spin" /> : null}
                        {selected ? `ارجاع ماموریت به ${selected.name}` : 'یک شخص را انتخاب کنید'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════
// کامپوننت اصلی Detail Panel
// ════════════════════════════════════════════
const TaskDetailPanel = ({ taskData, currentUserId, onRefresh, onBack }) => {
    const dispatch = useDispatch();
    const { uploadingFile } = useSelector(s => s.task);
    const fileInputRef = useRef();

    const [modal, setModal] = useState(null); 

    const { task, steps, logs, files = [] } = taskData;

    const myPendingStep = steps?.find(
        s => s.to_user_id === currentUserId && s.state === 'PENDING'
    );

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        dispatch(uploadTaskFile({ taskId: task.id, file }));
        e.target.value = '';
    };

    const handleApprove = async (note) => {
        await axiosInstance.post(`/tasks/${task.id}/approve/`, { note });
        setModal(null);
        onRefresh();
    };

    const handleReject = async (note) => {
        await axiosInstance.post(`/tasks/${task.id}/reject/`, { note });
        setModal(null);
        onRefresh();
    };

    return (
        <div className="h-full flex flex-col bg-[#131314] overflow-hidden">

            {/* ── هدر ── */}
            <div className="px-5 py-4 border-b border-gray-800 bg-[#1e1f20] flex-shrink-0 z-10 shadow-sm">
                
                {/* دکمه بازگشت در موبایل + وضعیت */}
                <div className="flex items-center gap-3 mb-3">
                    {onBack && (
                        <button onClick={onBack} className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 rounded-lg text-blue-400 hover:bg-gray-700 transition-colors border border-gray-700">
                            <FaChevronRight size={12} />
                            <span className="text-sm font-medium">بازگشت</span>
                        </button>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${STATUS_COLORS[task.status] || ''}`}>
                        {STATUS_LABELS[task.status] || task.status}
                    </span>
                    <span className="text-xs text-gray-500 font-medium bg-[#131314] px-2.5 py-1 rounded-md border border-gray-800">
                        {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                    </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-gray-100 font-bold text-lg mb-2 leading-tight">{task.title}</h2>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-400">
                            {task.created_by_name && (
                                <div className="flex items-center gap-1.5">
                                    <FaUser className="text-gray-500" />
                                    <span>سازنده: <span className="text-gray-200">{task.created_by_name}</span></span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <FaClock className="text-gray-500" />
                                <span>{new Date(task.created_at).toLocaleDateString('fa-IR')}</span>
                            </div>
                        </div>

                        {task.note && (
                            <div className="mt-3 p-3 bg-[#131314] border border-gray-800 rounded-xl text-gray-300 text-sm leading-relaxed">
                                {task.note}
                            </div>
                        )}
                    </div>
                </div>

                {task.active_assignees?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-800">
                        <span className="text-xs text-gray-500 font-medium">مسئولین فعلی:</span>
                        {task.active_assignees.map(a => (
                            <span key={a.step_id} className="text-[11px] font-medium bg-yellow-900/20 border border-yellow-500/30 text-yellow-400 px-2.5 py-1 rounded-lg">
                                {a.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* ✅ دکمه‌های اقدام — اکشن مورد نیاز */}
                {myPendingStep && (
                    <div className="mt-4 p-4 bg-blue-900/10 border border-blue-500/30 rounded-2xl shadow-inner">
                        <p className="text-blue-400 text-sm mb-3 font-semibold flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                            </span>
                            اقدام شما برای این مرحله نیاز است
                        </p>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                            <button onClick={() => setModal('approve')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-900/20">
                                <FaCheckCircle /> تایید
                            </button>
                            <button onClick={() => setModal('forward')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
                                <FaArrowLeft /> ارجاع
                            </button>
                            <button onClick={() => setModal('reject')} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
                                <FaTimesCircle /> رد کردن
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── محتوا ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">

                {/* فایل‌های ضمیمه */}
                <div className="bg-[#1e1f20] rounded-2xl p-4 border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-300 text-sm font-bold flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center"><FaPaperclip size={12} className="text-blue-400" /></div>
                            فایل‌های ضمیمه ({files.length})
                        </h3>
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className="flex items-center gap-2 text-xs bg-[#131314] border border-gray-700 hover:border-blue-500 text-gray-300 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium">
                            {uploadingFile ? <><FaSpinner className="animate-spin" size={12} /> در حال آپلود...</> : <><FaUpload size={12} /> افزودن فایل</>}
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} />
                    </div>

                    {files.length === 0 ? (
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-700 hover:border-gray-600 bg-[#131314] rounded-xl p-6 text-center text-gray-500 text-sm cursor-pointer transition-colors">
                            <FaUpload size={24} className="mx-auto mb-2 opacity-40 text-blue-400" />
                            <p>فایلی ضمیمه نشده است. برای آپلود کلیک کنید.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {files.map(f => (
                                <div key={f.id} className="flex items-center gap-3 p-3 bg-[#131314] rounded-xl border border-gray-800 hover:border-gray-700 transition-colors group">
                                    {f.preview_type === 'image' && f.thumbnail
                                        ? <img src={f.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-gray-700" />
                                        : <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center text-xl shrink-0 border border-gray-700">{FILE_ICONS[f.file_type] || FILE_ICONS.FILE}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="text-gray-200 text-sm font-medium truncate group-hover:text-blue-400 transition-colors">{f.file?.split('/').pop() || 'فایل'}</div>
                                        <div className="text-gray-500 text-[11px] mt-1 truncate">{f.uploaded_by_name} · {new Date(f.uploaded_at).toLocaleDateString('fa-IR')}</div>
                                    </div>
                                    <a href={f.file} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-600 transition-colors shrink-0">
                                        <FaDownload size={12} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Timeline مراحل */}
                <div>
                    <h3 className="text-gray-300 text-sm font-bold flex items-center gap-2 mb-5">
                        <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center"><FaUser size={12} className="text-purple-400" /></div>
                        مراحل گردش کار
                    </h3>
                    {!steps?.length ? (
                        <p className="text-gray-500 text-sm bg-[#1e1f20] p-4 rounded-xl border border-gray-800">مرحله‌ای ثبت نشده است.</p>
                    ) : (
                        <div className="relative mr-2">
                            {/* خط عمودی تایم‌لاین */}
                            <div className="absolute right-3.5 top-2 bottom-2 w-0.5 bg-gray-800 rounded-full" />
                            <div className="space-y-4">
                                {steps.map(step => {
                                    const cfg = STEP_STATE_CONFIG[step.state] || { label: step.state, color: 'text-gray-400', icon: <FaUser /> };
                                    const isMe = step.to_user_id === currentUserId;
                                    return (
                                        <div key={step.id} className="flex items-start gap-4 pr-9 relative">
                                            {/* نقطه تایم‌لاین */}
                                            <div className={`absolute right-1.5 top-4 w-4 h-4 rounded-full border-4 ${stepDotColor(step.state)} z-10 shadow-sm`} />
                                            
                                            <div className={`flex-1 p-4 rounded-2xl border transition-colors ${isMe && step.state === 'PENDING' ? 'bg-blue-900/10 border-blue-500/30' : 'bg-[#1e1f20] border-gray-800'}`}>
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#131314] border border-gray-800 ${cfg.color}`}>
                                                            {cfg.icon} {cfg.label}
                                                        </span>
                                                        {isMe && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full shadow-sm">شما</span>}
                                                    </div>
                                                    <span className="text-[11px] text-gray-500 bg-[#131314] px-2 py-0.5 rounded-full border border-gray-800">مرحله {step.step_index}</span>
                                                </div>
                                                
                                                <div className="text-sm text-gray-300 mt-3 flex items-center gap-2 flex-wrap">
                                                    {step.from_user_id && (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="text-gray-500 text-xs">از:</span>
                                                            <span className="bg-gray-800 px-2 py-1 rounded-md text-xs">{step.from_user_name || `کاربر ${step.from_user_id}`}</span>
                                                            <FaArrowLeft size={10} className="text-gray-600 mx-1" />
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="text-gray-500 text-xs">به:</span>
                                                        <span className="bg-gray-800 px-2 py-1 rounded-md text-xs font-medium text-white">{step.to_user_name || `کاربر ${step.to_user_id}`}</span>
                                                    </span>
                                                </div>

                                                {step.note?.trim() && (
                                                    <div className="mt-3 p-3 bg-[#131314] border border-gray-800 rounded-xl text-gray-400 text-sm relative">
                                                        <div className="absolute top-0 right-3 -mt-2 bg-[#131314] px-1 text-[10px] text-gray-500">یادداشت</div>
                                                        {step.note}
                                                    </div>
                                                )}
                                                
                                                {step.acted_at && (
                                                    <div className="text-[11px] text-gray-500 mt-3 flex items-center gap-1">
                                                        <FaClock size={10} />
                                                        تغییر در: {new Date(step.acted_at).toLocaleDateString('fa-IR')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* تاریخچه رویدادها */}
                <div>
                    <h3 className="text-gray-300 text-sm font-bold flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center"><FaClock size={12} className="text-green-400" /></div>
                        تاریخچه سیستمی
                    </h3>
                    {!logs?.length ? (
                        <p className="text-gray-500 text-sm bg-[#1e1f20] p-4 rounded-xl border border-gray-800">رویدادی ثبت نشده است.</p>
                    ) : (
                        <div className="bg-[#1e1f20] rounded-2xl p-4 border border-gray-800 space-y-3">
                            {logs.map((log, index) => (
                                <div key={log.id} className={`flex items-start gap-3 text-sm ${index !== logs.length - 1 ? 'pb-3 border-b border-gray-800' : ''}`}>
                                    <div className="w-2 h-2 rounded-full bg-gray-600 mt-1.5 shrink-0" />
                                    <div className="flex-1 text-gray-400 leading-relaxed">
                                        <span className="text-gray-200 font-medium">
                                            {log.actor_name || `کاربر ${log.actor_id}`}
                                        </span>
                                        {' '}<span className="text-blue-400">{ACTION_LABELS[log.action] || log.action}</span>
                                        {log.note && <span className="text-gray-500 italic"> — "{log.note}"</span>}
                                        <div className="text-[11px] text-gray-600 mt-1">
                                            {new Date(log.created_at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── مودال‌ها ── */}
            {modal === 'approve' && (
                <ConfirmModal
                    title="تایید و خاتمه مرحله"
                    message={`با تایید این مرحله، مسئولیت شما در ماموریت «${task.title}» به پایان می‌رسد.`}
                    confirmLabel="تایید و ثبت"
                    confirmClass="bg-green-600 hover:bg-green-700"
                    onConfirm={handleApprove}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'reject' && (
                <ConfirmModal
                    title="رد کردن ماموریت"
                    message={`آیا از رد کردن ماموریت «${task.title}» اطمینان دارید؟ این کار به سازنده اطلاع داده می‌شود.`}
                    confirmLabel="تایید و رد ماموریت"
                    confirmClass="bg-red-600 hover:bg-red-700"
                    onConfirm={handleReject}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'forward' && (
                <ForwardModal
                    taskId={task.id}
                    onSuccess={() => { setModal(null); onRefresh(); }}
                    onClose={() => setModal(null)}
                />
            )}
        </div>
    );
};

export default TaskDetailPanel;
