import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { uploadTaskFile, addTaskComment } from '../../features/task/taskSlice';
import axiosInstance from '../../api/axiosInstance';
import moment from 'moment-jalaali';
import {
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaClock, FaUser,
    FaPaperclip, FaUpload, FaSpinner, FaDownload, FaChevronRight,
    FaRegComment, FaPaperPlane, FaSitemap, FaAlignRight
} from 'react-icons/fa';

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
    const stages = task?.stages || []; 

    let myPendingAction = null;
    let pendingActionContext = { type: null, name: '', require_file: false };

    // 🔴 حل مشکل: بررسی اکشن برای هم مسئولین و هم تاییدکنندگان میانی
    if (stages && stages.length > 0) {
        for (const stage of stages) {
            // ۱. بررسی مجریان اصلی (Assignees)
            const assignee = stage.assignees?.find(a => 
                (Number(a.user_id) === Number(currentUserId) || Number(a.user) === Number(currentUserId)) && 
                a.state === 'PENDING'
            );
            
            if (assignee) {
                myPendingAction = assignee;
                pendingActionContext = {
                    type: 'STAGE',
                    name: stage.stage_name || `مرحله ${stage.step_index || 1}`,
                    require_file: stage.require_file,
                };
                break;
            }

            // ۲. بررسی تاییدکنندگان میانی (Approvers)
            const approver = stage.approval_records?.find(a => 
                Number(a.user) === Number(currentUserId) && 
                a.status === 'PENDING'
            );
            
            if (approver) {
                myPendingAction = approver;
                pendingActionContext = {
                    type: 'APPROVER',
                    name: `تاییدیه میانی: ${stage.stage_name || `مرحله ${stage.step_index || 1}`}`,
                    require_file: false, // معمولا برای تایید میانی فایل الزامی نیست
                };
                break;
            }
        }
    }

    // فال‌بک به سیستم قدیمی
    if (!myPendingAction && steps && steps.length > 0) {
        const step = steps.find(s => 
            Number(s.to_user_id) === Number(currentUserId) && 
            s.state === 'PENDING'
        );
        if (step) {
            myPendingAction = step;
            pendingActionContext = {
                type: 'STEP',
                name: step.stage_name || `مرحله ${step.step_index}`,
                require_file: step.require_file,
            };
        }
    }

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
            setTimeout(() => setCommentSuccess(false), 4000);
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
                            
                            {task.deadline && (
                                <div className={`flex items-center gap-1.5 font-medium ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                    <FaClock />
                                    <span>مهلت کل: {moment(task.deadline).format('jYYYY/jMM/jDD - HH:mm')}</span>
                                </div>
                            )}
                        </div>
                        {task.note && (
                            <div className={`mt-3 p-3 border rounded-xl text-sm leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                {task.note}
                            </div>
                        )}
                    </div>
                </div>

                {myPendingAction && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <p className="text-blue-500 text-sm font-semibold">اقدام شما برای «{pendingActionContext.name}» نیاز است</p>
                            {pendingActionContext.require_file && (
                                <span className="flex items-center gap-1 text-[10px] bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded-md border border-yellow-500/30 font-bold">
                                    <FaPaperclip /> ارسال فایل الزامیست
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                            <button onClick={() => setModal('approve')} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-600/20">
                                <FaCheckCircle /> تایید
                            </button>
                            
                            {/* 🔴 تاییدکنندگان میانی امکان ارجاع ندارند، فقط مسئولین می‌توانند ارجاع دهند */}
                            {pendingActionContext.type !== 'APPROVER' && (
                                <button onClick={() => setModal('forward')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                                    <FaArrowLeft /> ارجاع
                                </button>
                            )}
                            
                            <button onClick={() => setModal('reject')} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-600/20">
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
                            فایل‌های ضمیمه اصلی ({files.length})
                        </h3>
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className={`flex items-center gap-2 text-xs border px-3 py-2 rounded-lg transition-colors font-medium ${isDark ? 'bg-slate-950 border-slate-700 hover:border-blue-500 text-gray-300' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700'}`}>
                            {uploadingFile ? <><FaSpinner className="animate-spin" size={12} /> در حال آپلود...</> : <><FaUpload size={12} /> افزودن فایل</>}
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                    </div>

                    {files.length === 0 ? (
                        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center text-sm cursor-pointer transition-colors ${isDark ? 'border-slate-700 hover:border-slate-600 bg-slate-950 text-gray-500' : 'border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-500'}`}>
                            <FaUpload size={24} className="mx-auto mb-2 opacity-40 text-blue-500" />
                            <p>فایلی ضمیمه نشده است. برای آپلود کلیک کنید.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {files.map(f => (
                                <div key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border group ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                                    {f.preview_type === 'image' && f.thumbnail
                                        ? <img src={f.thumbnail} alt="" className={`w-12 h-12 rounded-lg object-cover shrink-0 border ${isDark ? 'border-slate-700' : 'border-gray-300'}`} />
                                        : <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>{FILE_ICONS[f.file_type] || FILE_ICONS.FILE}</div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{f.file?.split('/').pop() || 'فایل'}</div>
                                        <div className="text-gray-500 text-[11px] mt-1 truncate">{f.uploaded_by_name} · {new Date(f.uploaded_at).toLocaleDateString('fa-IR')}</div>
                                    </div>
                                    <a href={f.file} target="_blank" rel="noreferrer" className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-slate-800 text-gray-400 hover:bg-blue-600 hover:text-white' : 'bg-white text-gray-500 hover:bg-blue-600 hover:text-white border border-gray-300'}`}>
                                        <FaDownload size={12} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── مراحل گردش کار (جدید + قدیم) ── */}
                <div>
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                            <FaSitemap size={12} />
                        </div>
                        خط مونتاژ گردش کار
                    </h3>

                    {stages && stages.length > 0 ? (
                        /* سیستم جدید افقی موازی (مونتاژ) */
                        <div className={`w-full overflow-x-auto pb-4 pt-2 px-4 flex items-start gap-4 min-h-[400px] ${isDark ? 'bg-slate-900/50 rounded-2xl border border-slate-800' : 'bg-gray-100/50 rounded-2xl border border-gray-200'} [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? '[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:bg-slate-900' : '[&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-gray-100'}`}>
                            {stages.map((stage, index) => {
                                const isStageCompleted = stage.status === 'COMPLETED';
                                const isStageActive = stage.status === 'ACTIVE';

                                let cardClasses = isDark ? "border-slate-700 bg-slate-900/60" : "border-gray-300 border-dashed bg-white";
                                let headerClasses = isDark ? "bg-slate-800 text-gray-400 border-slate-700/50" : "bg-gray-100 text-gray-600 border-gray-200";
                                let stateBadge = "در انتظار";
                                let badgeColor = isDark ? "bg-slate-700 text-gray-300" : "bg-gray-200 text-gray-700";

                                if (isStageCompleted) {
                                    cardClasses = isDark ? "border-green-600/50 bg-slate-900" : "border-green-500 bg-white";
                                    headerClasses = isDark ? "bg-green-900/20 border-green-800/50 text-green-400" : "bg-green-50 border-green-200 text-green-700";
                                    stateBadge = "تکمیل شده";
                                    badgeColor = "bg-green-500 text-white";
                                } else if (isStageActive) {
                                    cardClasses = isDark ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-slate-900" : "border-blue-500 shadow-lg shadow-blue-500/20 bg-white";
                                    headerClasses = isDark ? "bg-blue-900/20 border-blue-800/50 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-700";
                                    stateBadge = "در جریان";
                                    badgeColor = "bg-blue-500 text-white shadow-lg shadow-blue-500/30";
                                }

                                return (
                                    <React.Fragment key={stage.id}>
                                        <div className={`shrink-0 w-[280px] rounded-2xl border-2 flex flex-col transition-all shadow-sm ${cardClasses}`}>
                                            
                                            {/* هدر مرحله */}
                                            <div className={`p-3 border-b flex justify-between items-center rounded-t-xl ${headerClasses}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${badgeColor}`}>
                                                        {stage.step_index || (index + 1)}
                                                    </span>
                                                    <span className="text-sm font-bold truncate max-w-[120px]" title={stage.stage_name}>
                                                        {stage.stage_name || `مرحله ${stage.step_index || (index + 1)}`}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                                    {stateBadge}
                                                </span>
                                            </div>

                                            <div className="p-4 flex flex-col gap-3 max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                                                {/* توضیحات */}
                                                {stage.description && (
                                                    <div className={`flex items-start gap-2 px-2 py-2 rounded-lg border text-[11px] ${isDark ? 'bg-slate-900/50 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                        <FaAlignRight className="text-gray-400 text-xs mt-0.5 shrink-0" />
                                                        <p className="leading-relaxed">{stage.description}</p>
                                                    </div>
                                                )}

                                                {/* مهلت انجام */}
                                                {stage.deadline && (
                                                    <div className={`flex flex-col gap-1.5 p-2 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            <FaClock className={`${isStageActive ? 'text-orange-500' : 'text-gray-400'} text-xs`} />
                                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>مهلت انجام:</span>
                                                        </div>
                                                        <div className={`text-[11px] text-center font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                            {moment(stage.deadline).format('jYYYY/jMM/jDD - HH:mm')}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* الزام فایل و قانون */}
                                                <div className="flex gap-2">
                                                    {stage.require_file && (
                                                        <div className={`flex-1 flex items-center justify-center gap-1 px-1 py-1.5 rounded-lg border ${isDark ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                                                            <FaPaperclip size={10} />
                                                            <span className="text-[10px] font-bold">الزام فایل</span>
                                                        </div>
                                                    )}
                                                    <div className={`flex-1 flex items-center justify-center px-1 py-1.5 rounded-lg border text-[10px] font-medium text-center ${isDark ? 'bg-slate-800 border-slate-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                                                        {stage.approval_rule === 'ALL_ASSIGNEES' ? 'تایید همه اجباری' : 'تایید یک نفر کافیست'}
                                                    </div>
                                                </div>

                                                {/* لیست مسئولین */}
                                                <div className="mt-1 flex-1 flex flex-col gap-2">
                                                    <span className={`text-[10px] font-medium border-b pb-1 ${isDark ? 'border-slate-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>مسئولین:</span>
                                                    {stage.assignees?.map((assignee, idx) => {
                                                        const cfg = STEP_STATE_CONFIG[assignee.state] || { label: assignee.state, color: 'text-gray-500', icon: <FaUser /> };
                                                        const isMe = Number(assignee.user || assignee.user_id) === Number(currentUserId);
                                                        
                                                        return (
                                                            <div key={assignee.id || idx} className={`flex flex-col gap-1.5 p-2 rounded-xl border transition-colors ${isMe && assignee.state === 'PENDING' ? 'bg-blue-500/10 border-blue-500/50 shadow-sm' : isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-6 h-6 flex items-center justify-center rounded-md text-[10px] ${cfg.color} ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                                                                            {cfg.icon}
                                                                        </div>
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                                                                {assignee.user_name || `کاربر ${assignee.user || assignee.user_id}`}
                                                                            </span>
                                                                            <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                {cfg.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {isMe && <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded">شما</span>}
                                                                </div>
                                                                {(assignee.acted_at || assignee.note) && (
                                                                    <div className={`flex items-center justify-between mt-1 pt-1 border-t text-[9px] ${isDark ? 'border-slate-800 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                                                                        {assignee.acted_at && <span>{new Date(assignee.acted_at).toLocaleDateString('fa-IR')}</span>}
                                                                        {assignee.note && <FaRegComment title={`یادداشت: ${assignee.note}`} className="text-blue-400 cursor-help" />}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                            </div>
                                        </div>

                                        {/* رابط/فلش بین مراحل */}
                                        {index < stages.length - 1 && (
                                            <div className="shrink-0 flex flex-col items-center justify-center self-center px-2 min-w-[90px]">
                                                
                                                {/* نمایش تاییدکنندگان میانی (واسطه‌ها) */}
                                                {stage.intermediate_approvers_details && stage.intermediate_approvers_details.length > 0 && (
                                                    <div className="flex flex-col items-center mb-2 gap-1.5">
                                                        <span className={`text-[9px] font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                                            تایید میانی:
                                                        </span>
                                                        <div className="flex flex-col gap-1 items-center">
                                                            {stage.intermediate_approvers_details.map((approver, i) => {
                                                                const isApproverMe = Number(approver.id) === Number(currentUserId);
                                                                let statusColor = "text-gray-500";
                                                                if(approver.status === 'APPROVED') statusColor = "text-green-500";
                                                                if(approver.status === 'REJECTED') statusColor = "text-red-500";
                                                                if(approver.status === 'PENDING') statusColor = "text-blue-500";
                                                                
                                                                return (
                                                                    <div 
                                                                        key={approver.id || i} 
                                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border shadow-sm text-[10px] font-medium whitespace-nowrap transition-colors ${
                                                                            isApproverMe && approver.status === 'PENDING' 
                                                                            ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' 
                                                                            : isDark ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                                        }`}
                                                                    >
                                                                        <FaUser size={9} className={statusColor} />
                                                                        <span>{approver.name || `کاربر ${approver.id}`}</span>
                                                                        {isApproverMe && <span className="text-[8px] bg-blue-500 text-white px-1 rounded ml-1">شما</span>}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 border-dashed mt-1 ${isDark ? 'border-slate-700 text-slate-500 bg-slate-800/30' : 'border-gray-300 text-gray-400 bg-gray-50'}`}>
                                                    <FaArrowLeft size={16} />
                                                </div>
                                            </div>
                                        )}


                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ) : steps && steps.length > 0 ? (
                        /* سیستم قدیمی خطی (بدون تغییر) */
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
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-md border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'} ${cfg.color}`}>
                                                        {cfg.label}
                                                    </span>
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${isDark ? 'text-gray-300 bg-slate-950 border-slate-700' : 'text-gray-700 bg-white border-gray-300'}`}>
                                                        {step.stage_name || `مرحله ${step.step_index}`}
                                                    </span>
                                                </div>
                                                <div className={`text-sm mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    به: <strong>{step.to_user_name || `کاربر ${step.to_user_id}`}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className={`text-sm p-4 rounded-xl border ${isDark ? 'text-gray-500 bg-slate-900 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>مرحله‌ای ثبت نشده است.</p>
                    )}
                </div>

                {/* ── تاریخچه سیستمی ── */}
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
                                        <div className="text-[11px] text-gray-500 mt-1">
                                            {new Date(log.created_at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── ثبت یادداشت و پیامک ── */}
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
                    <div className="flex gap-2">
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
                    message={pendingActionContext.require_file ? `آیا از ارسال فایل‌های لازم اطمینان دارید؟ با تایید، این مرحله خاتمه می‌یابد.` : `با تایید این مرحله، مسئولیت شما به پایان می‌رسد.`}
                    confirmLabel="تایید و ثبت"
                    confirmClass="bg-green-600 hover:bg-green-700"
                    onConfirm={handleApprove}
                    onClose={() => setModal(null)}
                />
            )}
            {modal === 'reject' && (
                <ConfirmModal
                    title="رد کردن ماموریت"
                    message={`آیا از رد کردن این گردش کار اطمینان دارید؟`}
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