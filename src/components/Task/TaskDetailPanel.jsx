// src/components/Task/TaskDetailPanel.jsx — کامل نهایی

import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadTaskFile ,forwardStep} from '../../features/task/taskSlice';
import axiosInstance from '../../api/axiosInstance';
import {
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaClock, FaUser,
    FaPaperclip, FaFileImage, FaFileAudio, FaFileVideo, FaFile,
    FaUpload, FaSpinner, FaDownload, FaTimes, FaSearch,
} from 'react-icons/fa';

// ── constants ──
const TASK_TYPE_LABELS = {
    PAYROLL_FORM: 'تکمیل فرم حقوق',
    PURCHASE:     'خرید/تدارکات',
    REPORT:       'گزارش‌دهی',
};

const STATUS_COLORS = {
    PENDING:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    DONE:        'bg-green-500/20 text-green-400 border-green-500/30',
    REJECTED:    'bg-red-500/20 text-red-400 border-red-500/30',
    CANCELLED:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS = {
    PENDING:     'در انتظار',
    IN_PROGRESS: 'در حال انجام',
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
    if (state === 'PENDING')  return 'border-yellow-400 bg-gray-800';
    if (state === 'APPROVED') return 'border-green-400 bg-green-400';
    if (state === 'REJECTED' || state === 'REJECTED_FORWARDED') return 'border-red-400 bg-red-400';
    return 'border-gray-500 bg-gray-500';
};

// ── مودال تایید / رد ──
const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose }) => {
    const [note,    setNote]    = useState('');
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

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
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-5 w-[320px] shadow-2xl">
                <h3 className="text-white font-bold mb-1">{title}</h3>
                <p className="text-gray-400 text-sm mb-3">{message}</p>
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="یادداشت (اختیاری)..."
                    rows={2}
                    className="w-full bg-gray-700 text-white rounded-xl px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500 resize-none mb-3"
                />
                {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
                <div className="flex gap-2">
                    <button onClick={onClose}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl py-2 text-sm transition">
                        انصراف
                    </button>
                    <button onClick={handle} disabled={loading}
                        className={`flex-1 ${confirmClass} text-white rounded-xl py-2 text-sm font-medium transition flex items-center justify-center gap-1 disabled:opacity-50`}>
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

    const [list,     setList]     = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [search,   setSearch]   = useState('');
    const [selected, setSelected] = useState(null);
    const [note,     setNote]     = useState('');
    const [sendSms,  setSendSms]  = useState(false);
    const [error,    setError]    = useState('');

    React.useEffect(() => {
        axiosInstance.get('/tasks/subordinates/')
            .then(r => setList(r.data))
            .catch(() => setError('خطا در بارگیری لیست'))
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
            setError(result.payload || 'خطا در ارجاع');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-gray-800 border border-gray-700 rounded-2xl w-[320px] shadow-2xl overflow-hidden">

                {/* هدر */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <h3 className="text-white font-bold text-sm">ارجاع ماموریت</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <FaTimes size={14} />
                    </button>
                </div>

                {/* جستجو */}
                <div className="px-3 py-2 border-b border-gray-700">
                    <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                        <FaSearch className="text-gray-400 flex-shrink-0" size={12} />
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجو..."
                            className="bg-transparent text-white text-sm flex-1 outline-none placeholder-gray-500"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white">
                                <FaTimes size={11} />
                            </button>
                        )}
                    </div>
                </div>

                {/* لیست */}
                <div className="max-h-52 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-6 text-gray-500 text-sm gap-2">
                            <FaSpinner className="animate-spin" /> بارگیری...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-gray-600 text-sm py-6">نتیجه‌ای یافت نشد</div>
                    ) : (
                        filtered.map(emp => {
                            const isSelected = selected?.user_id === emp.user_id;
                            return (
                                <div
                                    key={emp.user_id}
                                    onClick={() => setSelected(emp)}
                                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition border-b border-gray-700/30 ${
                                        isSelected ? 'bg-blue-500/15' : 'hover:bg-gray-700/50'
                                    }`}
                                >
                                    {emp.avatar_url ? (
                                        <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                                            {emp.name?.[0]}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm truncate ${isSelected ? 'text-blue-300' : 'text-white'}`}>
                                            {emp.name}
                                        </div>
                                        {emp.position_title && (
                                            <div className="text-xs text-gray-400 truncate">{emp.position_title}</div>
                                        )}
                                    </div>
                                    {isSelected && <FaCheckCircle className="text-blue-400 flex-shrink-0" size={14} />}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* پایین: یادداشت + SMS + دکمه */}
                <div className="p-3 border-t border-gray-700 space-y-2">
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="یادداشت (اختیاری)..."
                        rows={2}
                        className="w-full bg-gray-700 text-white rounded-xl px-3 py-2 text-xs border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                    />

                    {/* تاگل SMS */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                            onClick={() => setSendSms(v => !v)}
                            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                                sendSms ? 'bg-blue-600' : 'bg-gray-600'
                            }`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                                sendSms ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                        </div>
                        <span className="text-xs text-gray-300">ارسال پیامک به مسئول</span>
                    </label>

                    {error && <p className="text-red-400 text-xs">{error}</p>}

                    <button
                        onClick={handleSubmit}
                        disabled={!selected || forwarding}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2 text-sm font-medium transition flex items-center justify-center gap-1"
                    >
                        {forwarding ? <FaSpinner className="animate-spin" /> : null}
                        {selected ? `ارجاع به ${selected.name}` : 'یک نفر انتخاب کنید'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// ════════════════════════════════════════════
// کامپوننت اصلی
// ════════════════════════════════════════════
const TaskDetailPanel = ({ taskData, currentUserId, onRefresh }) => {
    const dispatch = useDispatch();
    const { uploadingFile } = useSelector(s => s.task);
    const fileInputRef = useRef();

    const [modal, setModal] = useState(null); // null | 'approve' | 'reject' | 'forward'

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
        <div className="h-full flex flex-col overflow-hidden">

            {/* ── هدر ── */}
            <div className="p-5 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-white font-bold text-base mb-1 truncate">{task.title}</h2>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-400">
                                {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[task.status] || ''}`}>
                                {STATUS_LABELS[task.status] || task.status}
                            </span>
                        </div>
                        {task.created_by_name && (
                            <div className="text-xs text-gray-500 mt-1">
                                سازنده: <span className="text-gray-300">{task.created_by_name}</span>
                            </div>
                        )}
                        {task.note && (
                            <p className="text-gray-400 text-xs mt-1.5">{task.note}</p>
                        )}
                    </div>
                    <div className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">
                        {new Date(task.created_at).toLocaleDateString('fa-IR')}
                    </div>
                </div>

                {task.active_assignees?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 items-center">
                        <span className="text-xs text-gray-500 ml-1">مسئول فعلی:</span>
                        {task.active_assignees.map(a => (
                            <span key={a.step_id}
                                className="text-xs bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
                                {a.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* ✅ دکمه‌های اقدام — فعال */}
                {myPendingStep && (
                    <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                        <p className="text-blue-400 text-xs mb-2 font-medium">اقدام شما نیاز است:</p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setModal('approve')}
                                className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs py-2 rounded-lg transition font-medium"
                            >
                                ✓ تایید
                            </button>
                            <button
                                onClick={() => setModal('forward')}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs py-2 rounded-lg transition font-medium"
                            >
                                ↩ ارجاع
                            </button>
                            <button
                                onClick={() => setModal('reject')}
                                className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs py-2 rounded-lg transition font-medium"
                            >
                                ✕ رد
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── محتوا ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* فایل‌های ضمیمه */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <FaPaperclip size={11} />
                            فایل‌های ضمیمه ({files.length})
                        </h3>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingFile}
                            className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                        >
                            {uploadingFile
                                ? <><FaSpinner className="animate-spin" size={11} /> آپلود...</>
                                : <><FaUpload size={11} /> افزودن</>
                            }
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
                            className="border border-dashed border-gray-600 rounded-xl p-4 text-center text-gray-600 text-xs cursor-pointer hover:border-gray-500 transition"
                        >
                            <FaPaperclip size={18} className="mx-auto mb-1 opacity-30" />
                            فایلی ضمیمه نشده — کلیک کنید
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {files.map(f => (
                                <div key={f.id}
                                    className="flex items-center gap-3 p-2.5 bg-gray-700/40 rounded-xl border border-gray-700">
                                    {f.preview_type === 'image' && f.thumbnail
                                        ? <img src={f.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                        : <div className="text-lg flex-shrink-0">{FILE_ICONS[f.file_type] || FILE_ICONS.FILE}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white text-xs truncate">
                                            {f.file?.split('/').pop() || 'فایل'}
                                        </div>
                                        <div className="text-gray-500 text-xs mt-0.5">
                                            {f.uploaded_by_name} · {new Date(f.uploaded_at).toLocaleDateString('fa-IR')}
                                        </div>
                                    </div>
                                    <a href={f.file} target="_blank" rel="noreferrer"
                                        className="text-gray-400 hover:text-blue-400 transition p-1.5 flex-shrink-0">
                                        <FaDownload size={12} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Timeline مراحل */}
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-3 tracking-wider">
                        مراحل گردش ({steps?.length || 0})
                    </h3>
                    {!steps?.length ? (
                        <p className="text-gray-600 text-sm">مرحله‌ای ثبت نشده</p>
                    ) : (
                        <div className="relative">
                            <div className="absolute right-3 top-0 bottom-0 w-px bg-gray-700" />
                            <div className="space-y-3">
                                {steps.map(step => {
                                    const cfg = STEP_STATE_CONFIG[step.state] || {
                                        label: step.state, color: 'text-gray-400', icon: <FaUser />,
                                    };
                                    const isMe = step.to_user_id === currentUserId;
                                    return (
                                        <div key={step.id} className="flex items-start gap-3 pr-8 relative">
                                            <div className={`absolute right-1.5 mt-1 w-3 h-3 rounded-full border-2 ${stepDotColor(step.state)}`} />
                                            <div
                                                className={`flex-1 p-3 rounded-xl border ${
                                                    isMe && step.state === 'PENDING'
                                                        ? 'bg-blue-500/10 border-blue-500/30'
                                                        : 'border-gray-700'
                                                }`}
                                                style={{ background: isMe && step.state === 'PENDING' ? '' : 'rgba(55,65,81,0.4)' }}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs flex items-center gap-1 ${cfg.color}`}>
                                                            {cfg.icon} {cfg.label}
                                                        </span>
                                                        {isMe && (
                                                            <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                                                                شما
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-600">مرحله {step.step_index}</span>
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {step.from_user_id && (
                                                        <span>از: <span className="text-gray-300">
                                                            {step.from_user_name || `کاربر ${step.from_user_id}`}
                                                        </span> ← </span>
                                                    )}
                                                    <span>به: <span className="text-white">
                                                        {step.to_user_name || `کاربر ${step.to_user_id}`}
                                                    </span></span>
                                                </div>
                                                {step.note?.trim() && (
                                                    <p className="text-gray-500 text-xs mt-1 border-t border-gray-600/50 pt-1">
                                                        {step.note}
                                                    </p>
                                                )}
                                                {step.acted_at && (
                                                    <div className="text-xs text-gray-600 mt-1">
                                                        {new Date(step.acted_at).toLocaleDateString('fa-IR')}
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

                {/* تاریخچه */}
                <div>
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-3 tracking-wider">
                        تاریخچه ({logs?.length || 0})
                    </h3>
                    {!logs?.length ? (
                        <p className="text-gray-600 text-sm">رویدادی ثبت نشده</p>
                    ) : (
                        <div className="space-y-2">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-start gap-2 text-xs">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-600 mt-1.5 flex-shrink-0" />
                                    <div className="flex-1 text-gray-400">
                                        <span className="text-white">
                                            {log.actor_name || `کاربر ${log.actor_id}`}
                                        </span>
                                        {' '}{ACTION_LABELS[log.action] || log.action}
                                        {log.note && (
                                            <span className="text-gray-600"> — {log.note}</span>
                                        )}
                                        <span className="text-gray-700 mr-2">
                                            {new Date(log.created_at).toLocaleDateString('fa-IR')}
                                        </span>
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
                    title="تایید ماموریت"
                    message={`آیا ماموریت «${task.title}» را تایید می‌کنید؟`}
                    confirmLabel="✓ تایید"
                    confirmClass="bg-green-600 hover:bg-green-700"
                    onConfirm={handleApprove}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'reject' && (
                <ConfirmModal
                    title="رد ماموریت"
                    message={`آیا ماموریت «${task.title}» را رد می‌کنید؟`}
                    confirmLabel="✕ رد"
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
