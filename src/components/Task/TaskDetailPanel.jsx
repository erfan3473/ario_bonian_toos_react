import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadTaskFile, forwardStep, refreshSmsStatus } from '../../features/task/taskSlice';
import axiosInstance from '../../api/axiosInstance';
import {
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaClock, FaUser,
    FaPaperclip, FaFileImage, FaFileAudio, FaFileVideo, FaFile,
    FaUpload, FaSpinner, FaDownload, FaTimes, FaSearch, FaChevronRight
} from 'react-icons/fa';

// ── constants ──
const TASK_TYPE_LABELS = {
    PAYROLL_FORM: 'تکمیل فرم حقوق',
    PURCHASE: 'خرید/تدارکات',
    REPORT: 'گزارش‌دهی',
};

const STATUS_COLORS = {
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    DONE: 'bg-green-500/10 text-green-500 border-green-500/30',
    REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30',
    CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

const STATUS_LABELS = {
    PENDING: 'در انتظار',
    IN_PROGRESS: 'در جریان',
    DONE: 'انجام شده',
    REJECTED: 'رد شده',
    CANCELLED: 'لغو شده',
};

const STEP_STATE_CONFIG = {
    PENDING: { label: 'در انتظار', color: 'text-yellow-500', icon: <FaClock /> },
    APPROVED: { label: 'تایید شد', color: 'text-green-500', icon: <FaCheckCircle /> },
    REJECTED_FORWARDED: { label: 'رد و ارجاع', color: 'text-orange-500', icon: <FaArrowLeft /> },
    REJECTED: { label: 'رد شد', color: 'text-red-500', icon: <FaTimesCircle /> },
    FORWARDED: { label: 'ارجاع شد', color: 'text-blue-500', icon: <FaArrowLeft /> },
    COMPLETED: { label: 'خاتمه', color: 'text-gray-500', icon: <FaCheckCircle /> },
};

const URGENCY_LABELS = {
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'زیاد',
  CRITICAL: 'بحرانی',
};

const URGENCY_COLORS = {
  LOW: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  MEDIUM: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  HIGH: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  CRITICAL: 'bg-red-500/10 text-red-500 border-red-500/30',
};

const ACTION_LABELS = {
    CREATE: 'ایجاد کرد',
    FORWARD: 'ارجاع داد',
    APPROVE: 'تایید کرد',
    REJECT: 'رد کرد',
    COMPLETE: 'خاتمه داد',
    COMMENT: 'یادداشت گذاشت',
};

const FILE_ICONS = {
    IMAGE: <FaFileImage className="text-blue-500" />,
    AUDIO: <FaFileAudio className="text-purple-500" />,
    VIDEO: <FaFileVideo className="text-pink-500" />,
    FILE: <FaFile className="text-gray-500" />,
};

const stepDotColor = (state, isDark) => {
    if (state === 'PENDING') return isDark ? 'border-yellow-400 bg-slate-800' : 'border-yellow-500 bg-white';
    if (state === 'APPROVED') return 'border-green-500 bg-green-500';
    if (state === 'REJECTED' || state === 'REJECTED_FORWARDED') return 'border-red-500 bg-red-500';
    return isDark ? 'border-slate-600 bg-slate-600' : 'border-gray-300 bg-gray-300';
};

// ── مودال تایید / رد ──
const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose }) => {
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

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
            <div className={`relative rounded-2xl p-5 w-full max-w-sm shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>

                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="یادداشت یا دلیل (اختیاری)..."
                    rows={3}
                    className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 resize-none mb-4 ${isDark
                            ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500'
                            : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'
                        }`}
                />

                {error && <div className="bg-red-500/10 text-red-500 text-xs p-3 rounded-lg mb-4">{error}</div>}

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors border ${isDark
                                ? 'bg-slate-800 hover:bg-slate-700 text-gray-300 border-slate-700'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                            }`}
                    >
                        انصراف
                    </button>
                    <button
                        onClick={handle}
                        disabled={loading}
                        className={`flex-1 ${confirmClass} text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
                    >
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
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

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
            <div className={`relative rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh] border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>

                {/* هدر */}
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>ارجاع ماموریت</h3>
                    <button
                        onClick={onClose}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${isDark
                                ? 'bg-slate-800 text-gray-400 hover:text-white border-slate-700'
                                : 'bg-gray-100 text-gray-500 hover:text-gray-900 border-gray-300'
                            }`}
                    >
                        <FaTimes size={12} />
                    </button>
                </div>

                {/* جستجو */}
                <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                        <FaSearch className={`${isDark ? 'text-gray-500' : 'text-gray-400'} shrink-0`} size={14} />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجوی نام یا سمت..."
                            className={`bg-transparent text-sm flex-1 outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}>
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
                                    <div
                                        key={emp.user_id}
                                        onClick={() => setSelected(emp)}
                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-colors border ${isSelected
                                                ? 'bg-blue-500/10 border-blue-500/40'
                                                : isDark
                                                    ? 'bg-transparent border-transparent hover:bg-slate-800/60'
                                                    : 'bg-transparent border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        {emp.avatar_url ? (
                                            <img src={emp.avatar_url} alt="" className={`w-10 h-10 rounded-full object-cover shrink-0 border ${isDark ? 'border-slate-700' : 'border-gray-300'}`} />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm text-blue-500 font-bold shrink-0 border border-blue-500/30">
                                                {emp.name?.[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${isSelected ? 'text-blue-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                                {emp.name}
                                            </div>
                                            {emp.position_title && (
                                                <div className="text-xs text-gray-500 truncate mt-0.5">{emp.position_title}</div>
                                            )}
                                        </div>
                                        {isSelected && <FaCheckCircle className="text-blue-500 shrink-0" size={16} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* فوتر */}
                <div className={`p-4 border-t rounded-b-2xl space-y-3 shrink-0 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="یادداشت ارجاع (اختیاری)..."
                        rows={2}
                        className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 resize-none ${isDark
                                ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500'
                                : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'
                            }`}
                    />

                    <div
                        onClick={() => setSendSms(v => !v)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${isDark ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-gray-50'}`}
                    >
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ارسال پیامک اطلاع‌رسانی</span>
                        <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${sendSms ? 'bg-blue-500' : isDark ? 'bg-slate-600' : 'bg-gray-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${sendSms ? 'left-1' : 'right-1'}`} />
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-xs text-center p-2 bg-red-500/10 rounded-lg">{error}</div>}

                    <button
                        onClick={handleSubmit}
                        disabled={!selected || forwarding}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-gray-400 text-white rounded-xl py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
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
    const { uploadingFile, refreshingSms } = useSelector(s => s.task);
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';
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
        <div className={`h-full flex flex-col overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-white'}`}>

            {/* ── هدر ── */}
            <div className={`px-5 py-4 border-b flex-shrink-0 z-10 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3 mb-3">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border ${isDark
                                    ? 'bg-slate-800 text-blue-400 hover:bg-slate-700 border-slate-700'
                                    : 'bg-gray-100 text-blue-600 hover:bg-gray-200 border-gray-300'
                                }`}
                        >
                            <FaChevronRight size={12} />
                            <span className="text-sm font-medium">بازگشت</span>
                        </button>
                    )}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${STATUS_COLORS[task.status] || ''}`}>
                        {STATUS_LABELS[task.status] || task.status}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${isDark ? 'text-gray-400 bg-slate-950 border-slate-800' : 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${URGENCY_COLORS[task.urgency] || URGENCY_COLORS.MEDIUM}`}>
                         فوریت: {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                    </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className={`font-bold text-lg mb-2 leading-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{task.title}</h2>

                        <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {task.created_by_name && (
                                <div className="flex items-center gap-1.5">
                                    <FaUser className="text-gray-500" />
                                    <span>سازنده: <span className={isDark ? 'text-gray-200' : 'text-gray-900'}>{task.created_by_name}</span></span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <FaClock className="text-gray-500" />
                                <span>{new Date(task.created_at).toLocaleDateString('fa-IR')}</span>
                            </div>
                        </div>

                        {task.note && (
                            <div className={`mt-3 p-3 border rounded-xl text-sm leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                {task.note}
                            </div>
                        )}
                    </div>
                </div>

                {task.active_assignees?.length > 0 && (
                    <div className={`flex flex-wrap items-center gap-2 mt-4 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
                        <span className="text-xs text-gray-500 font-medium">مسئولین فعلی:</span>
                        {task.active_assignees.map(a => (
                            <span key={a.step_id} className="text-[11px] font-medium bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 px-2.5 py-1 rounded-lg">
                                {a.name}
                            </span>
                        ))}
                    </div>
                )}

                {myPendingStep && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                        <p className="text-blue-500 text-sm mb-3 font-semibold">اقدام شما برای این مرحله نیاز است</p>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                            <button onClick={() => setModal('approve')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                                <FaCheckCircle /> تایید
                            </button>
                            <button onClick={() => setModal('forward')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                                <FaArrowLeft /> ارجاع
                            </button>
                            <button onClick={() => setModal('reject')} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                                <FaTimesCircle /> رد کردن
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── محتوا ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">

                {/* فایل‌های ضمیمه */}
                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                                <FaPaperclip size={12} className="text-blue-500" />
                            </div>
                            فایل‌های ضمیمه ({files.length})
                        </h3>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className={`flex items-center gap-2 text-xs border px-3 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium ${isDark
                                    ? 'bg-slate-950 border-slate-700 hover:border-blue-500 text-gray-300'
                                    : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700'
                                }`}
                        >
                            {uploadingFile ? <><FaSpinner className="animate-spin" size={12} /> در حال آپلود...</> : <><FaUpload size={12} /> افزودن فایل</>}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {files.length === 0 ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center text-sm cursor-pointer transition-colors ${isDark
                                    ? 'border-slate-700 hover:border-slate-600 bg-slate-950 text-gray-500'
                                    : 'border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-500'
                                }`}
                        >
                            <FaUpload size={24} className="mx-auto mb-2 opacity-40 text-blue-500" />
                            <p>فایلی ضمیمه نشده است. برای آپلود کلیک کنید.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {files.map(f => (
                                <div key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors group ${isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                                    {f.preview_type === 'image' && f.thumbnail
                                        ? <img src={f.thumbnail} alt="" className={`w-12 h-12 rounded-lg object-cover shrink-0 border ${isDark ? 'border-slate-700' : 'border-gray-300'}`} />
                                        : <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>{FILE_ICONS[f.file_type] || FILE_ICONS.FILE}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium truncate transition-colors ${isDark ? 'text-gray-200 group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'}`}>
                                            {f.file?.split('/').pop() || 'فایل'}
                                        </div>
                                        <div className="text-gray-500 text-[11px] mt-1 truncate">
                                            {f.uploaded_by_name} · {new Date(f.uploaded_at).toLocaleDateString('fa-IR')}
                                        </div>
                                    </div>
                                    <a
                                        href={f.file}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${isDark ? 'bg-slate-800 text-gray-400 hover:text-white hover:bg-blue-600' : 'bg-white text-gray-500 hover:text-white hover:bg-blue-600 border border-gray-300'}`}
                                    >
                                        <FaDownload size={12} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Timeline مراحل */}
                <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 mb-5 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <FaUser size={12} className="text-purple-500" />
                        </div>
                        مراحل گردش کار
                    </h3>
                    {!steps?.length ? (
                        <p className={`text-sm p-4 rounded-xl border ${isDark ? 'text-gray-500 bg-slate-900 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                            مرحله‌ای ثبت نشده است.
                        </p>
                    ) : (
                        <div className="relative mr-2">
                            <div className={`absolute right-3.5 top-2 bottom-2 w-0.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                            <div className="space-y-4">
                                {steps.map(step => {
                                    const cfg = STEP_STATE_CONFIG[step.state] || { label: step.state, color: 'text-gray-500', icon: <FaUser /> };
                                    const isMe = step.to_user_id === currentUserId;
                                    return (
                                        <div key={step.id} className="flex items-start gap-4 pr-9 relative">
                                            <div className={`absolute right-1.5 top-4 w-4 h-4 rounded-full border-4 ${stepDotColor(step.state, isDark)} z-10 shadow-sm`} />

                                            <div className={`flex-1 p-4 rounded-2xl border transition-colors ${isMe && step.state === 'PENDING'
                                                    ? 'bg-blue-500/10 border-blue-500/30'
                                                    : isDark
                                                        ? 'bg-slate-900 border-slate-800'
                                                        : 'bg-white border-gray-200'
                                                }`}
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs font-bold flex items-center gap-1.5 px-2 py-1 rounded-md border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'} ${cfg.color}`}>
                                                            {cfg.icon} {cfg.label}
                                                        </span>
                                                        {isMe && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">شما</span>}
                                                    </div>
                                                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${isDark ? 'text-gray-500 bg-slate-950 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                                                        مرحله {step.step_index}
                                                    </span>
                                                </div>

                                                <div className={`text-sm mt-3 flex items-center gap-2 flex-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {step.from_user_id && (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="text-gray-500 text-xs">از:</span>
                                                            <span className={`${isDark ? 'bg-slate-800 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-md text-xs`}>
                                                                {step.from_user_name || `کاربر ${step.from_user_id}`}
                                                            </span>
                                                            <FaArrowLeft size={10} className="text-gray-500 mx-1" />
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="text-gray-500 text-xs">به:</span>
                                                        <span className={`${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded-md text-xs font-medium`}>
                                                            {step.to_user_name || `کاربر ${step.to_user_id}`}
                                                        </span>
                                                    </span>
                                                </div>

                                                {step.note?.trim() && (
                                                    <div className={`mt-3 p-3 border rounded-xl text-sm relative ${isDark ? 'bg-slate-950 border-slate-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                        <div className={`absolute top-0 right-3 -mt-2 px-1 text-[10px] ${isDark ? 'bg-slate-950 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                                                            یادداشت
                                                        </div>
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
                    <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <FaClock size={12} className="text-green-500" />
                        </div>
                        تاریخچه سیستمی
                    </h3>
                    {!logs?.length ? (
                        <p className={`text-sm p-4 rounded-xl border ${isDark ? 'text-gray-500 bg-slate-900 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>
                            رویدادی ثبت نشده است.
                        </p>
                    ) : (
                        <div className={`rounded-2xl p-4 border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                            {logs.map((log, index) => (
                                <div key={log.id} className={`flex items-start gap-3 text-sm ${index !== logs.length - 1 ? `pb-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}` : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`} />
                                    <div className={`flex-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                            {log.actor_name || `کاربر ${log.actor_id}`}
                                        </span>
                                        {' '}
                                        <span className="text-blue-500">{ACTION_LABELS[log.action] || log.action}</span>
                                        {log.note && <span className="text-gray-500 italic"> — "{log.note}"</span>}
                                        <div className="text-[11px] text-gray-500 mt-1">
                                            {new Date(log.created_at).toLocaleString('fa-IR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                year: 'numeric',
                                                month: 'numeric',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {/* وضعیت ارسال پیامک */}
                {taskData.sms_logs && taskData.sms_logs.length > 0 && (
                    <div>
                        <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                                <FaPaperclip size={12} className="text-orange-500" />
                            </div>
                            وضعیت ارسال پیامک ({taskData.sms_logs.length})
                        </h3>
                        <div className={`rounded-2xl p-4 border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                            {taskData.sms_logs.map((sms, index) => {
                                const kindLabel = sms.kind === 'ASSIGN' ? 'ارجاع/ایجاد' : 'یادآوری';
                                const statusLabel =
                                    sms.delivery_status === 'SENT' ? 'ارسال شده به سامانه' :
                                    sms.delivery_status === 'DELIVERED' ? 'تحویل شد' :
                                    sms.delivery_status === 'FAILED' ? 'ناموفق' : 'نامشخص';
                                const statusColor =
                                    sms.delivery_status === 'DELIVERED' ? 'text-green-500' :
                                    sms.delivery_status === 'FAILED' ? 'text-red-500' :
                                    sms.delivery_status === 'SENT' ? 'text-yellow-500' : 'text-gray-500';

                                return (
                                    <div
                                        key={sms.id}
                                        className={`flex items-start gap-3 text-sm p-3 rounded-xl border ${
                                            index !== taskData.sms_logs.length - 1
                                                ? `mb-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}`
                                                : ''
                                        } ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}
                                    >
                                        <div className={`flex-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                                    {sms.to_user_name || 'کاربر نامشخص'}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-slate-800 border-slate-700 text-gray-400' : 'bg-white border-gray-300 text-gray-600'}`}>
                                                    {kindLabel}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} space-y-1`}>
                                                <div>شماره: {sms.phone}</div>
                                                <div>زمان ارسال: {new Date(sms.created_at).toLocaleString('fa-IR')}</div>
                                                {sms.checked_at && (
                                                    <div>آخرین بررسی: {new Date(sms.checked_at).toLocaleString('fa-IR')}</div>
                                                )}

                                            {sms.error && (
                                                <div className="text-red-500 text-xs mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                                                    خطا: {sms.error}
                                                </div>
                                            )}
                                            {/* دکمه استعلام فقط برای پیامک‌هایی که هنوز تعیین تکلیف نشده‌اند */}
                                            {(sms.delivery_status !== 'DELIVERED' && sms.delivery_status !== 'FAILED') && (
                                                <button
                                                    onClick={() => dispatch(refreshSmsStatus(sms.id))}
                                                    disabled={refreshingSms}
                                                    className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${isDark 
                                                        ? 'border-slate-700 bg-slate-800 text-blue-400 hover:bg-slate-700' 
                                                        : 'border-gray-300 bg-white text-blue-600 hover:bg-gray-100'}`}
                                                >
                                                    {refreshingSms ? <FaSpinner className="animate-spin" /> : <FaSearch size={10} />}
                                                    استعلام وضعیت پیامک
                                                </button>
                                            )}


                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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
