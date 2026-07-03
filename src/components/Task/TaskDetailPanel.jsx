import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadTaskFile, addTaskComment } from '../../features/task/taskSlice';
import axiosInstance from '../../api/axiosInstance';
import {
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaClock, FaUser,
    FaPaperclip, FaUpload, FaSpinner, FaDownload, FaChevronRight,
    FaRegComment, FaPaperPlane
} from 'react-icons/fa';

// وارد کردن ماژول‌های جدا شده
import { 
    TASK_TYPE_LABELS, STATUS_COLORS, STATUS_LABELS, STEP_STATE_CONFIG, 
    URGENCY_LABELS, URGENCY_COLORS, ACTION_LABELS, FILE_ICONS, stepDotColor 
} from './taskConstants';
import { ConfirmModal, ForwardModal } from './TaskModals';
import TaskSmsSection from './TaskSmsSection';

const TaskDetailPanel = ({ taskData, currentUserId, onRefresh, onBack }) => {
    const dispatch = useDispatch();
    const { uploadingFile, addingComment } = useSelector(s => s.task);

    const [commentNote, setCommentNote] = useState('');
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentError, setCommentError] = useState('');
    const [commentSuccess, setCommentSuccess] = useState(false); 
    const commentFileRef = useRef();
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';
    const fileInputRef = useRef();

    const [modal, setModal] = useState(null);

    const { task, steps, logs, files = [] } = taskData;

    const myPendingStep = steps?.find(s => Number(s.to_user_id) === Number(currentUserId) && s.state === 'PENDING');

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

    const handleAddComment = async () => {
        if (!commentNote.trim() && commentFiles.length === 0) return;
        setCommentError('');
        setCommentSuccess(false);

        const result = await dispatch(addTaskComment({
            taskId: task.id,
            note: commentNote.trim(),
            files: commentFiles,
        }));

        if (addTaskComment.fulfilled.match(result)) {
            setCommentNote('');
            setCommentFiles([]);
            setCommentSuccess(true);
            setTimeout(() => setCommentSuccess(false), 4000); // محو خودکار پیام موفقیت بعد از ۴ ثانیه
        } else {
            setCommentError(result.payload || 'خطا در ثبت یادداشت');
        }
    };

    return (
        <div className={`h-full flex flex-col overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-white'}`}>

            {/* ── هدر ── */}
            <div className={`px-5 py-4 border-b flex-shrink-0 z-10 shadow-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center gap-3 mb-3">
                    {onBack && (
                        <button onClick={onBack} className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border ${isDark ? 'bg-slate-800 text-blue-400 hover:bg-slate-700 border-slate-700' : 'bg-gray-100 text-blue-600 hover:bg-gray-200 border-gray-300'}`}>
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

                {/* فایل‌های ضمیمه عمومی تسک */}
                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                                <FaPaperclip size={12} className="text-blue-500" />
                            </div>
                            فایل‌های ضمیمه ({files.length})
                        </h3>
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className={`flex items-center gap-2 text-xs border px-3 py-2 rounded-lg transition-colors disabled:opacity-50 font-medium ${isDark ? 'bg-slate-950 border-slate-700 hover:border-blue-500 text-gray-300' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700'}`}>
                            {uploadingFile ? <><FaSpinner className="animate-spin" size={12} /> در حال آپلود...</> : <><FaUpload size={12} /> افزودن فایل</>}
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx" onChange={handleFileSelect} />
                    </div>

                    {files.length === 0 ? (
                        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center text-sm cursor-pointer transition-colors ${isDark ? 'border-slate-700 hover:border-slate-600 bg-slate-950 text-gray-500' : 'border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-500'}`}>
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
                                        <div className={`text-sm font-medium truncate transition-colors ${isDark ? 'text-gray-200 group-hover:text-blue-400' : 'text-gray-800 group-hover:text-blue-600'}`}>{f.file?.split('/').pop() || 'فایل'}</div>
                                        <div className="text-gray-500 text-[11px] mt-1 truncate">{f.uploaded_by_name} · {new Date(f.uploaded_at).toLocaleDateString('fa-IR')}</div>
                                    </div>
                                    <a href={f.file} target="_blank" rel="noreferrer" className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${isDark ? 'bg-slate-800 text-gray-400 hover:text-white hover:bg-blue-600' : 'bg-white text-gray-500 hover:text-white hover:bg-blue-600 border border-gray-300'}`}>
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
                        <p className={`text-sm p-4 rounded-xl border ${isDark ? 'text-gray-500 bg-slate-900 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>مرحله‌ای ثبت نشده است.</p>
                    ) : (
                        <div className="relative mr-2">
                            <div className={`absolute right-3.5 top-2 bottom-2 w-0.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                            <div className="space-y-4">
                                {steps.map(step => {
                                    const cfg = STEP_STATE_CONFIG[step.state] || { label: step.state, color: 'text-gray-500', icon: <FaUser /> };
                                    const isMe = Number(step.to_user_id) === Number(currentUserId);
                                    return (
                                        <div key={step.id} className="flex items-start gap-4 pr-9 relative">
                                            <div className={`absolute right-1.5 top-4 w-4 h-4 rounded-full border-4 ${stepDotColor(step.state, isDark)} z-10 shadow-sm`} />
                                            <div className={`flex-1 p-4 rounded-2xl border transition-colors ${isMe && step.state === 'PENDING' ? 'bg-blue-500/10 border-blue-500/30' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
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
                                                            <span className={`${isDark ? 'bg-slate-800 text-gray-200' : 'bg-gray-100 text-gray-700'} px-2 py-1 rounded-md text-xs`}>{step.from_user_name || `کاربر ${step.from_user_id}`}</span>
                                                            <FaArrowLeft size={10} className="text-gray-500 mx-1" />
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="text-gray-500 text-xs">به:</span>
                                                        <span className={`${isDark ? 'bg-slate-800 text-white' : 'bg-gray-100 text-gray-900'} px-2 py-1 rounded-md text-xs font-medium`}>{step.to_user_name || `کاربر ${step.to_user_id}`}</span>
                                                    </span>
                                                </div>
                                                {step.note?.trim() && (
                                                    <div className={`mt-3 p-3 border rounded-xl text-sm relative ${isDark ? 'bg-slate-950 border-slate-800 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                        <div className={`absolute top-0 right-3 -mt-2 px-1 text-[10px] ${isDark ? 'bg-slate-950 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>یادداشت</div>
                                                        {step.note}
                                                    </div>
                                                )}
                                                {step.acted_at && (
                                                    <div className="text-[11px] text-gray-500 mt-3 flex items-center gap-1">
                                                        <FaClock size={10} /> تغییر در: {new Date(step.acted_at).toLocaleDateString('fa-IR')}
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
                        <p className={`text-sm p-4 rounded-xl border ${isDark ? 'text-gray-500 bg-slate-900 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>رویدادی ثبت نشده است.</p>
                    ) : (
                        <div className={`rounded-2xl p-4 border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                            {logs.map((log, index) => (
                                <div key={log.id} className={`flex items-start gap-3 text-sm ${index !== logs.length - 1 ? `pb-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}` : ''}`}>
                                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isDark ? 'bg-slate-600' : 'bg-gray-300'}`} />
                                    <div className={`flex-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{log.actor_name || `کاربر ${log.actor_id}`}</span>
                                        {' '}
                                        <span className="text-blue-500">{ACTION_LABELS[log.action] || log.action}</span>
                                        {log.note && <span className="text-gray-500 italic"> — "{log.note}"</span>}
                                        
                                        {/* ── نمایش فایل‌های ضمیمه‌شده به این کامنت خاص ── */}
                                        {log.files && log.files.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                                {log.files.map(f => (
                                                    <div key={f.id} className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-colors ${isDark ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                            <FaPaperclip size={10} className="text-blue-400 shrink-0" />
                                                            <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {f.file?.split('/').pop() || 'فایل ضمیمه'}
                                                            </span>
                                                        </div>
                                                        <a href={f.file} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600 font-medium shrink-0 mr-2 flex items-center gap-1">
                                                            <FaDownload size={10} /> دریافت
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="text-[11px] text-gray-500 mt-1">
                                            {new Date(log.created_at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── ثبت یادداشت جدید ── */}
                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <FaRegComment size={12} className="text-indigo-400" />
                        </div>
                        ثبت یادداشت
                    </h3>

                    <textarea
                        value={commentNote}
                        onChange={e => setCommentNote(e.target.value)}
                        placeholder="یادداشت، توضیح یا سؤال..."
                        rows={3}
                        className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 resize-none mb-3 ${isDark ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'}`}
                    />

                    {/* فایل‌های انتخاب‌شده قبل از آپلود */}
                    {commentFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {commentFiles.map((f, i) => (
                                <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'bg-slate-800 border-slate-700 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                                    <FaPaperclip size={10} className="text-blue-400" />
                                    <span className="max-w-[120px] truncate">{f.name}</span>
                                    <button onClick={() => setCommentFiles(prev => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 ml-1">
                                        <FaTimesCircle size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {commentSuccess && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-500 text-xs p-3 rounded-lg mb-3">
                            <FaCheckCircle size={13} />
                            یادداشت با موفقیت ثبت شد.
                        </div>
                    )}
                    {commentError && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-500 text-xs p-3 rounded-lg mb-3">
                            <FaTimesCircle size={13} />
                            {commentError}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => commentFileRef.current?.click()}
                            className={`flex items-center gap-2 text-xs border px-3 py-2.5 rounded-xl transition-colors font-medium ${isDark ? 'bg-slate-950 border-slate-700 hover:border-blue-500 text-gray-400' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-600'}`}
                        >
                            <FaPaperclip size={12} /> ضمیمه
                        </button>
                        {/* 🔴 فیکس: صفت accept کاملاً حذف شد تا هر نوع فرمتی بدون محدودیت قابل انتخاب باشد */}
                        <input
                            ref={commentFileRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={e => {
                                setCommentFiles(prev => [...prev, ...Array.from(e.target.files)]);
                                e.target.value = '';
                            }}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={addingComment || (!commentNote.trim() && commentFiles.length === 0)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                        >
                            {addingComment ? <FaSpinner className="animate-spin" size={14} /> : <FaPaperPlane size={12} />}
                            ثبت یادداشت
                        </button>
                    </div>
                </div>

                {/* فراخوانی کامپوننت وضعیت پیامک */}
                <TaskSmsSection 
                    assignLogs={taskData.assign_sms_logs} 
                    reminderLogs={taskData.reminder_sms_logs} 
                    onRefresh={onRefresh} 
                />
                
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