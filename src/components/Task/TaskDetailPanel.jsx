import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    uploadTaskFile, addTaskComment, returnTaskStep, freezeTaskTemplate, 
    fetchSubordinates, editTask, fetchTaskTypes 
} from '../../features/task/taskSlice';
import axiosInstance from '../../api/axiosInstance';
import moment from 'moment-jalaali';
import {
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaClock, FaUser,
    FaPaperclip, FaUpload, FaSpinner, FaDownload, FaChevronRight,
    FaRegComment, FaPaperPlane, FaSitemap, FaAlignRight, FaUndo, 
    FaSnowflake, FaAddressCard, FaTimes, FaEdit, FaPlus, FaTrash
} from 'react-icons/fa';
import JalaliDatePicker from '../common/JalaliDatePicker';

import { 
    STATUS_COLORS, STATUS_LABELS, STEP_STATE_CONFIG, 
    URGENCY_LABELS, URGENCY_COLORS, ACTION_LABELS, FILE_ICONS
} from './taskConstants'; 
import { ConfirmModal, ForwardModal, ReturnModal } from './TaskModals';
import TaskSmsSection from './TaskSmsSection';
import AssigneePickerPanel, { AssigneeChip } from './AssigneePickerPanel';

const APPROVAL_RULES = [ { value: 'ANY_ASSIGNEE', label: 'تایید توسط یک نفر کافیست' }, { value: 'ALL_ASSIGNEES', label: 'تایید همه اجباری است' } ];
const APPROVER_RULES = [ { value: 'ALL_APPROVERS', label: 'تایید همه اجباری است' }, { value: 'ANY_APPROVER', label: 'تایید توسط یک نفر کافیست' } ];

const TaskDetailPanel = ({ taskData, currentUserId, onRefresh, onBack }) => {
    const dispatch = useDispatch();
    
    const userInfo = useSelector((state) => state.userLogin?.userInfo);
    // 👈 اضافه شد: بررسی نقش ادمین برای نمایش دکمه فریز
    const isAdmin = userInfo?.is_admin || userInfo?.is_staff || userInfo?.is_superuser;

    const { uploadingFile, addingComment, freezingTemplate, subordinates, loadingSubordinates, editingTask, taskTypes } = useSelector(s => s.task);

    const [commentNote, setCommentNote] = useState('');
    const [commentFiles, setCommentFiles] = useState([]);
    const [commentError, setCommentError] = useState('');
    const [commentSuccess, setCommentSuccess] = useState(false); 
    const commentFileRef = useRef();
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';
    const fileInputRef = useRef();

    const [modal, setModal] = useState(null);
    const [templateModal, setTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');
    
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactSelectedIds, setContactSelectedIds] = useState([]);
    
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({ title: '', note: '', urgency: 'MEDIUM', task_type: '', deadlineDate: '', deadlineTime: '23:59' });
    const [editStages, setEditStages] = useState([]);
    const [activeEditElement, setActiveEditElement] = useState({ id: null, type: 'STAGE' });

    const [freezeOptions, setFreezeOptions] = useState({
        title: true, task_type: true, urgency: true, stages: true, assignees: true
    });

    const { task, logs, files = [] } = taskData;
    const stages = task?.stages || []; 
    const currentActiveStage = stages.find(s => s.status === 'ACTIVE');
    const activeStageName = currentActiveStage ? (currentActiveStage.stage_name || `مرحله ${currentActiveStage.step_index}`) : null;
    let myPendingAction = null;
    let pendingActionContext = { type: null, name: '', require_file: false, rolesText: '' };
    let isWaitingForAssignees = false;

    const isCreatorOrAdmin = Number(task.created_by_id) === Number(currentUserId) || isAdmin;

    useEffect(() => {
        if ((showContactModal || showEditModal) && (!subordinates || subordinates.length === 0)) {
            dispatch(fetchSubordinates());
        }
    }, [showContactModal, showEditModal, subordinates, dispatch]);

    const handleAppendContacts = () => {
        const selectedEmps = subordinates?.filter(emp => contactSelectedIds.includes(emp.user_id)) || [];
        if (selectedEmps.length > 0) {
            const text = selectedEmps.map(emp => `👤 ${emp.name} - 📞 ${emp.phone || 'ثبت نشده'}`).join('\n');
            setCommentNote(prev => prev + (prev ? '\n\n' : '') + '--- اطلاعات تماس ---\n' + text + '\n-------------------\n');
        }
        setShowContactModal(false);
        setContactSelectedIds([]);
    };

    const openEditModal = () => {
        if (!taskTypes || taskTypes.length === 0) dispatch(fetchTaskTypes());
        if (!subordinates || subordinates.length === 0) dispatch(fetchSubordinates());

        const [dDate, dTime] = task.deadline ? moment(task.deadline).format('YYYY-MM-DD HH:mm').split(' ') : ['', '23:59'];
        
        setEditData({
            title: task.title || '',
            note: task.note || '',
            urgency: task.urgency || 'MEDIUM',
            task_type: task.task_type || '',
            deadlineDate: dDate,
            deadlineTime: dTime,
        });

        const loadedStages = stages.map((s, idx) => {
            const [sDate, sTime] = s.deadline ? moment(s.deadline).format('YYYY-MM-DD HH:mm').split(' ') : ['', '23:59'];
            return {
                id: s.id, 
                stageName: s.stage_name || `مرحله ${idx + 1}`,
                description: s.description || '',
                deadlineDate: sDate,
                deadlineTime: sTime,
                requireFile: !!s.require_file,
                assignees: s.assignees?.map(a => a.user || a.user_id) || [],
                approvalRule: s.approval_rule || 'ANY_ASSIGNEE',
                nextStageApprovers: s.intermediate_approvers_details?.map(ap => ap.id) || [],
                approverRule: s.approver_rule || 'ALL_APPROVERS'
            };
        });

        setEditStages(loadedStages);
        if (loadedStages.length > 0) {
            setActiveEditElement({ id: loadedStages[0].id, type: 'STAGE' });
        }
        setShowEditModal(true);
    };

    const handleAddEditStage = () => {
        const newId = `new-${Date.now()}`;
        const newStage = {
            id: newId, stageName: `مرحله ${editStages.length + 1}`, description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS'
        };
        setEditStages([...editStages, newStage]);
        setActiveEditElement({ id: newId, type: 'STAGE' });
    };

    const handleRemoveEditStage = (id) => {
        if (editStages.length === 1) return alert('حداقل وجود یک مرحله الزامی است.');
        const updated = editStages.filter(s => s.id !== id);
        setEditStages(updated);
        if (activeEditElement.id === id) setActiveEditElement({ id: updated[0].id, type: 'STAGE' });
    };

    const updateEditStageField = (id, field, value) => {
        setEditStages(editStages.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleEditAssigneeChange = (selectedIds) => {
        setEditStages(editStages.map(s => {
            if (s.id === activeEditElement.id) {
                if (activeEditElement.type === 'STAGE') return { ...s, assignees: selectedIds };
                return { ...s, nextStageApprovers: selectedIds };
            }
            return s;
        }));
    };

    const handleRemoveEditAssignee = (stageId, type, empIdToRemove) => {
        setEditStages(editStages.map(s => {
            if (s.id === stageId) {
                if (type === 'STAGE') return { ...s, assignees: s.assignees.filter(id => id !== empIdToRemove) };
                return { ...s, nextStageApprovers: s.nextStageApprovers.filter(id => id !== empIdToRemove) };
            }
            return s;
        }));
    };

    const activeEditSelectedIds = useMemo(() => {
        const stage = editStages.find(s => s.id === activeEditElement.id);
        if (!stage) return [];
        return activeEditElement.type === 'STAGE' ? stage.assignees : stage.nextStageApprovers;
    }, [activeEditElement, editStages]);

    const getActiveStageNameForEditPicker = () => {
        const stage = editStages.find(s => s.id === activeEditElement.id);
        if (!stage) return '';
        return activeEditElement.type === 'STAGE' ? stage.stageName : `تاییدیه بعد از ${stage.stageName}`;
    };

    const submitEditTask = async () => {
        if (!editData.title.trim()) return alert("عنوان الزامی است.");
        for (const s of editStages) {
            if (!s.stageName.trim()) return alert("نام تمامی مراحل باید وارد شود.");
            if (s.assignees.length === 0) return alert(`لطفاً برای ${s.stageName} حداقل یک مسئول انتخاب کنید.`);
        }

        let finalDeadline = null;
        if (editData.deadlineDate) {
            finalDeadline = `${editData.deadlineDate}T${editData.deadlineTime || '23:59'}:00`;
        }

        const payload = {
            title: editData.title,
            note: editData.note,
            urgency: editData.urgency,
            task_type: editData.task_type,
            deadline: finalDeadline,
            workflow_stages: editStages.map((s, idx) => ({
                id: s.id,
                step_index: idx + 1,
                stage_name: s.stageName,
                description: s.description,
                deadline: s.deadlineDate ? `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00` : null,
                require_file: s.requireFile,
                assignee_ids: s.assignees,
                approval_rule: s.approvalRule,
                intermediate_approvers: s.nextStageApprovers,
                approver_rule: s.approverRule
            }))
        };

        const res = await dispatch(editTask({ taskId: task.id, payload }));
        if (!res.error) {
            setShowEditModal(false);
            onRefresh();
        } else {
            alert(res.payload || 'خطا در ویرایش');
        }
    };

    if (stages && stages.length > 0) {
        for (const stage of stages) {
            if (stage.status !== 'ACTIVE') continue;

            let assigneesDone = false;
            if (stage.approval_rule === 'ANY_ASSIGNEE') {
                assigneesDone = stage.assignees?.some(a => a.state === 'APPROVED');
            } else if (stage.approval_rule === 'ALL_ASSIGNEES') {
                assigneesDone = stage.assignees?.every(a => !['PENDING', 'IN_PROGRESS'].includes(a.state));
            } else {
                assigneesDone = stage.assignees?.length === 0;
            }

            const assigneeRecord = stage.assignees?.find(a => (Number(a.user_id) === Number(currentUserId) || Number(a.user) === Number(currentUserId)));
            const approverRecord = stage.approval_records?.find(a => Number(a.user) === Number(currentUserId));

            let currentRoles = [];
            let assigneePending = assigneeRecord && ['PENDING', 'IN_PROGRESS'].includes(assigneeRecord.state);
            let approverPending = approverRecord && ['PENDING', 'RESUBMITTED', 'RETURNED'].includes(approverRecord.status);

            if (assigneeRecord) currentRoles.push('مجری');
            if (approverRecord) currentRoles.push('تاییدکننده میانی');
            
            const rolesText = currentRoles.length > 0 ? currentRoles.join(' و ') : '';

            if (assigneePending) {
                myPendingAction = assigneeRecord;
                pendingActionContext = {
                    type: 'STAGE',
                    name: stage.stage_name || `مرحله ${stage.step_index || 1}`,
                    require_file: stage.require_file,
                    rolesText: rolesText
                };
                break;
            }

            if (approverPending) {
                if (assigneesDone) {
                    myPendingAction = approverRecord;
                    pendingActionContext = {
                        type: 'APPROVER',
                        name: `تاییدیه میانی: ${stage.stage_name || `مرحله ${stage.step_index || 1}`}`,
                        require_file: false,
                        rolesText: rolesText
                    };
                } else {
                    isWaitingForAssignees = true;
                    pendingActionContext = { rolesText: rolesText };
                }
                break;
            }
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

    const handleReturn = async (targetIds, note) => {
        if (!targetIds || targetIds.length === 0) return alert('لطفاً حداقل یک مجری را انتخاب کنید.');
        try {
            await dispatch(returnTaskStep({ taskId: task.id, target_user_ids: targetIds, note })).unwrap();
            setModal(null);
            onRefresh();
        } catch (err) {
            alert(typeof err === 'string' ? err : err?.message || 'خطای سرور در برگشت دادن کار');
        }
    };

    const handleAddComment = async () => {
        if (!commentNote.trim() && commentFiles.length === 0) return;
        setCommentError('');
        setCommentSuccess(false);

        const result = await dispatch(addTaskComment({ taskId: task.id, note: commentNote.trim(), files: commentFiles }));
        if (addTaskComment.fulfilled.match(result)) {
            setCommentNote('');
            setCommentFiles([]);
            setCommentSuccess(true);
            setTimeout(() => setCommentSuccess(false), 4000);
        } else {
            setCommentError(result.payload || 'خطا در ثبت یادداشت');
        }
    };

    const handleSaveAsTemplate = async () => {
        if (!templateName.trim()) return alert('لطفاً یک نام برای قالب وارد کنید.');

        let mappedStages = [];
        if (freezeOptions.stages) {
            mappedStages = stages.map(s => ({
                stage_name: s.stage_name, description: s.description, approval_rule: s.approval_rule, approver_rule: s.approver_rule, require_file: s.require_file,
                assignees: freezeOptions.assignees ? (s.assignees?.map(a => ({ id: a.user || a.user_id, name: a.user_name })) || []) : [],
                intermediate_approvers: freezeOptions.assignees ? (s.intermediate_approvers_details?.map(ap => ({ id: ap.id, name: ap.name })) || []) : []
            }));
        }

        const templateData = {
            ...(freezeOptions.title && { title: task.title }),
            ...(freezeOptions.task_type && { task_type: task.task_type }),
            ...(freezeOptions.urgency && { urgency: task.urgency }),
            ...(freezeOptions.stages && { workflow_stages: mappedStages }),
            project_id: task.project?.id || null
        };

        const result = await dispatch(freezeTaskTemplate({ templateName, templateData, isGlobal: false }));
        if (freezeTaskTemplate.fulfilled.match(result)) {
            setTemplateModal(false);
            setTemplateName('');
            setFreezeOptions({ title: true, task_type: true, urgency: true, stages: true, assignees: true });
            alert('ماموریت با موفقیت به عنوان قالب فریز شد.');
        } else {
            alert(result.payload || 'خطا در ذخیره قالب.');
        }
    };

    return (
        <div className={`h-full flex flex-col overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-white'}`}>

        {/* ── هدر ── */}
        <div className={`px-5 py-4 border-b flex-shrink-0 z-10 shadow-sm relative ${isDark ? 'border-zinc-700 bg-zinc-900' : 'border-gray-300 bg-white'}`}>
            <div className="absolute top-4 left-5 flex items-center gap-2 z-20">
                {isCreatorOrAdmin && (
                    <button
                        onClick={openEditModal}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                            isDark
                                ? 'bg-blue-600/25 text-blue-300 border-blue-500/55 hover:bg-blue-600/40 hover:border-blue-400/70'
                                : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400'
                        }`}
                    >
                        <FaEdit size={12} />
                        ویرایش
                    </button>
                )}
                {/* 👈 دکمه فریز داخل شرط isAdmin قرار گرفت */}
                {isAdmin && (
                    <button
                        onClick={() => setTemplateModal(true)}
                        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-sm border transition-colors ${
                            isDark
                                ? 'bg-purple-600/25 text-purple-300 border-purple-500/55 hover:bg-purple-600/40 hover:border-purple-400/70'
                                : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100 hover:border-purple-400'
                        }`}
                    >
                        <FaSnowflake size={12} />
                        فریز
                    </button>
                )}
            </div>

            <div className="relative mb-3 mt-8 sm:mt-0">
                <div className="px-2 lg:px-48 text-center">
                    <h2 className={`font-bold text-lg mb-2 leading-tight ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        <span className={`text-xs font-normal ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>عنوان:</span>
                        {task.title}
                    </h2>
                    {task.note && (
                        <>
                            <div className={`w-2/3 mx-auto my-3 border-t ${isDark ? 'border-zinc-700' : 'border-gray-400'}`}></div>
                            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {task.note}
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {task.created_by_name && (
                    <div className="flex items-center gap-1.5">
                        <FaUser className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        <span>آمر: <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{task.created_by_name}</span></span>
                    </div>
                )}
                <div className="flex items-center gap-1.5">
                    <FaClock className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                    <span>تاریخ ایجاد: <span dir="ltr" className={isDark ? 'text-gray-200' : 'text-gray-800'}>{moment(task.created_at).format('jYYYY/jMM/jDD - HH:mm')}</span></span>
                </div>
                {task.deadline && (
                    <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                        <FaClock />
                        <span>مهلت: {moment(task.deadline).format('jYYYY/jMM/jDD - HH:mm')}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                {onBack && (
                    <button onClick={onBack} className={`lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-sm transition-colors border ${isDark ? 'bg-zinc-800 text-blue-400 hover:bg-zinc-700 border-zinc-600' : 'bg-gray-100 text-blue-600 hover:bg-gray-200 border-gray-300'}`}>
                        <FaChevronRight size={12} />
                        <span className="text-sm font-medium">بازگشت</span>
                    </button>
                )}
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-sm border ${STATUS_COLORS[task.status] || ''}`}>
                    <span className="font-normal opacity-75">وضعیت کلی:</span>
                    {STATUS_LABELS[task.status] || task.status}
                </span>
                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-sm border ${isDark ? 'text-zinc-300 bg-zinc-800/60 border-zinc-600' : 'text-gray-700 bg-gray-100 border-gray-300'}`}>
                    <span className="font-normal opacity-75">نوع ماموریت:</span>
                    {task.task_type_label || task.task_type || 'بدون دسته‌بندی'}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-sm border ${URGENCY_COLORS[task.urgency] || URGENCY_COLORS.MEDIUM}`}>
                    فوریت: {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                </span>

                {currentActiveStage && !['DONE', 'REJECTED', 'CANCELLED'].includes(task.status) && (
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-sm border ${isDark ? 'text-blue-300 bg-blue-900/40 border-blue-700/50' : 'text-blue-700 bg-blue-50 border-blue-300'}`}>
                        <span className="font-normal opacity-75">مرحله جاری:</span>
                        <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold ${isDark ? 'bg-blue-800 text-blue-100' : 'bg-blue-200 text-blue-800'}`}>
                            {currentActiveStage.step_index}
                        </span>
                        <span>{currentActiveStage.stage_name || 'بدون عنوان'}</span>
                    </span>
                )}
            </div>
            
            {isWaitingForAssignees && !myPendingAction && (
                <div className="mt-4 p-4 bg-orange-500/15 border border-orange-500/50 rounded-sm">
                    <div className="flex items-center gap-2">
                        <FaClock className="text-orange-400 text-lg shrink-0" />
                        <div className="flex flex-col">
                            <span className="text-orange-400 text-xs font-bold mb-1">نقش شما: {pendingActionContext.rolesText}</span>
                            <p className="text-orange-300 text-sm font-semibold">
                                {pendingActionContext.rolesText.includes('مجری') ? 'شما کار خود را انجام داده‌اید. منتظر بمانید تا سایر مجریان نیز تمام کنند.' : 'لطفاً منتظر بمانید تا مجریان کارشان را به اتمام برسانند.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {myPendingAction && (
                <div className="mt-4 p-4 bg-blue-500/15 border border-blue-500/50 rounded-sm">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-blue-400 text-[11px] font-bold bg-blue-500/15 px-2 py-0.5 rounded-sm border border-blue-500/30 w-fit">نقش شما: {pendingActionContext.rolesText}</span>
                            <p className="text-blue-300 text-sm font-semibold">اقدام شما برای «{pendingActionContext.name}» نیاز است</p>
                        </div>
                        {pendingActionContext.require_file && (
                            <span className="flex items-center gap-1 text-[10px] bg-red-300/20 text-yellow-100/ px-2 py-1 rounded-sm border border-yellow-500/40 font-bold"><FaPaperclip /> ارسال فایل الزامیست</span>
                        )}
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
                        <button onClick={() => setModal('approve')} className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm py-2.5 rounded-sm transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-green-900/40"><FaCheckCircle /> تایید</button>
                        {pendingActionContext.type !== 'APPROVER' && (
                            <button onClick={() => setModal('forward')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-sm transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40"><FaArrowLeft /> ارجاع</button>
                        )}
                        {pendingActionContext.type === 'APPROVER' && (
                            <button onClick={() => setModal('return')} className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-sm py-2.5 rounded-sm transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40"><FaUndo /> برگشت جهت اصلاح</button>
                        )}
                        <button onClick={() => setModal('reject')} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm py-2.5 rounded-sm transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-red-900/40"><FaTimesCircle /> رد کردن</button>
                    </div>
                </div>
            )}
        </div>

            {/* ── محتوا ── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">

                <div className={`rounded-sm p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}><FaPaperclip size={12} className="text-blue-500" /></div>
                            فایل‌های ضمیمه اصلی ({files.length})
                        </h3>
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} className={`flex items-center gap-2 text-xs border px-3 py-2 rounded-sm transition-colors font-medium ${isDark ? 'bg-slate-950 border-slate-700 hover:border-blue-500 text-gray-300' : 'bg-white border-gray-300 hover:border-blue-400 text-gray-700'}`}>
                            {uploadingFile ? <><FaSpinner className="animate-spin" size={12} /> در حال آپلود...</> : <><FaUpload size={12} /> افزودن فایل</>}
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                    </div>

                    {files.length === 0 ? (
                        <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-sm p-6 text-center text-sm cursor-pointer transition-colors ${isDark ? 'border-slate-700 hover:border-slate-600 bg-slate-950 text-gray-500' : 'border-gray-300 hover:border-gray-400 bg-gray-50 text-gray-500'}`}>
                            <FaUpload size={24} className="mx-auto mb-2 opacity-40 text-blue-500" />
                            <p>فایلی ضمیمه نشده است. برای آپلود کلیک کنید.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {files.map(f => (
                                <div key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border group ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                                    {f.preview_type === 'image' && f.thumbnail ? <img src={f.thumbnail} alt="" className={`w-12 h-12 rounded-sm object-cover shrink-0 border ${isDark ? 'border-slate-700' : 'border-gray-300'}`} /> : <div className={`w-12 h-12 rounded-sm flex items-center justify-center text-xl shrink-0 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}>{FILE_ICONS[f.file_type] || FILE_ICONS.FILE}</div>}
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{f.file?.split('/').pop() || 'فایل'}</div>
                                        <div className="text-gray-500 text-[11px] mt-1 truncate">{f.uploaded_by_name} · {new Date(f.uploaded_at).toLocaleDateString('fa-IR')}</div>
                                    </div>
                                    <a href={f.file} target="_blank" rel="noreferrer" className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDark ? 'bg-slate-800 text-gray-400 hover:bg-blue-600 hover:text-white' : 'bg-white text-gray-500 hover:bg-blue-600 hover:text-white border border-gray-300'}`}><FaDownload size={12} /></a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}><FaSitemap size={52} /></div>
                        خط مونتاژ گردش کار
                    </h3>

                    {stages && stages.length > 0 ? (
                        <div className={`w-full pb-4 pt-4 px-4 flex flex-wrap items-start justify-center gap-y-12 gap-x-6 min-h-[400px] ${isDark ? 'bg-slate-900/50 rounded-sm border border-slate-800' : 'bg-gray-100/50 rounded-sm border border-gray-200'}`}>
                            {stages.map((stage, index) => {
                                const isStageCompleted = stage.status === 'COMPLETED';
                                const isStageActive = stage.status === 'ACTIVE';
                                const isStageRejected = stage.status === 'REJECTED'; 

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
                                } else if (isStageRejected) {
                                    cardClasses = isDark ? "border-red-600/50 bg-slate-900" : "border-red-500 bg-white";
                                    headerClasses = isDark ? "bg-red-900/20 border-red-800/50 text-red-400" : "bg-red-50 border-red-200 text-red-700";
                                    stateBadge = "رد شده";
                                    badgeColor = "bg-red-500 text-white shadow-lg shadow-red-500/30";
                                }

                                return (
                                    <React.Fragment key={stage.id}>
                                        <div className={`shrink-0 w-full sm:w-[280px] rounded-2xl border-2 flex flex-col transition-all shadow-sm ${cardClasses}`}>
                                            <div className={`p-3 border-b flex justify-between items-center rounded-t-xl ${headerClasses}`}>
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${badgeColor}`}>{stage.step_index || (index + 1)}</span>
                                                    <span className="text-sm font-bold truncate max-w-[120px]" title={stage.stage_name}>{stage.stage_name || `مرحله ${stage.step_index || (index + 1)}`}</span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>{stateBadge}</span>
                                            </div>

                                            <div className="p-4 flex flex-col gap-3 max-h-[350px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                                                {stage.description && (
                                                    <div className={`flex items-start gap-2 px-2 py-2 rounded-lg border text-[11px] ${isDark ? 'bg-slate-900/50 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                                        <FaAlignRight className="text-gray-400 text-xs mt-0.5 shrink-0" />
                                                        <p className="leading-relaxed">{stage.description}</p>
                                                    </div>
                                                )}
                                                {stage.deadline && (
                                                    <div className={`flex flex-col gap-1.5 p-2 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center gap-1.5">
                                                            <FaClock className={`${isStageActive ? 'text-orange-500' : 'text-gray-400'} text-xs`} />
                                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>مهلت انجام:</span>
                                                        </div>
                                                        <div className={`text-[11px] text-center font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{moment(stage.deadline).format('jYYYY/jMM/jDD - HH:mm')}</div>
                                                    </div>
                                                )}
                                                <div className="flex gap-2">
                                                    {stage.require_file && (
                                                        <div className={`flex-1 flex items-center justify-center gap-1 px-1 py-1.5 rounded-lg border ${isDark ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-yellow-50 border-yellow-200 text-yellow-600'}`}>
                                                            <FaPaperclip size={10} /><span className="text-[10px] font-bold">الزام فایل</span>
                                                        </div>
                                                    )}
                                                    <div className={`flex-1 flex items-center justify-center px-1 py-1.5 rounded-lg border text-[10px] font-medium text-center ${isDark ? 'bg-slate-800 border-slate-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                                                        {stage.approval_rule === 'ALL_ASSIGNEES' ? 'تایید همه اجباری' : 'تایید یک نفر کافیست'}
                                                    </div>
                                                </div>

                                                <div className="mt-1 flex-1 flex flex-col gap-2">
                                                    <span className={`text-[10px] font-medium border-b pb-1 ${isDark ? 'border-slate-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>مسئولین:</span>
                                                    {stage.assignees?.map((assignee, idx) => {
                                                        const cfg = STEP_STATE_CONFIG[assignee.state] || { label: assignee.state, color: 'text-gray-500', icon: <FaUser /> };
                                                        const isMe = Number(assignee.user || assignee.user_id) === Number(currentUserId);
                                                        return (
                                                            <div key={assignee.id || idx} className={`flex flex-col gap-1.5 p-2 rounded-xl border transition-colors ${isMe && assignee.state === 'PENDING' ? 'bg-blue-500/10 border-blue-500/50 shadow-sm' : isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className={`w-6 h-6 flex items-center justify-center rounded-md text-[10px] ${cfg.color} ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>{cfg.icon}</div>
                                                                        <div className="flex flex-col">
                                                                            <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{assignee.user_name || `کاربر ${assignee.user || assignee.user_id}`}</span>
                                                                            <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{cfg.label}</span>
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

                                        {(index < stages.length - 1 || (stage.intermediate_approvers_details && stage.intermediate_approvers_details.length > 0)) && (
                                            <div className="shrink-0 flex flex-col items-center justify-center self-center px-2 min-w-[90px] xl:w-auto">
                                                {stage.intermediate_approvers_details && stage.intermediate_approvers_details.length > 0 && (
                                                    <div className="flex flex-col items-center mb-2 gap-1.5">
                                                        <span className={`text-[9px] font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{index === stages.length - 1 ? 'تایید نهایی:' : 'تایید میانی:'}</span>
                                                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded border ${isDark ? 'bg-slate-800 border-slate-700 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>{stage.approver_rule === 'ALL_APPROVERS' ? 'تایید همه اجباری' : 'تایید یک نفر کافیست'}</span>
                                                        <div className="flex flex-col gap-1 items-center">
                                                            {stage.intermediate_approvers_details.map((approver, i) => {
                                                                const isApproverMe = Number(approver.id) === Number(currentUserId);
                                                                
                                                                let statusColor = "text-gray-500";
                                                                let statusLabel = "در انتظار";
                                                                
                                                                if(approver.status === 'APPROVED') { statusColor = "text-green-500"; statusLabel = "تایید شد"; }
                                                                else if(approver.status === 'REJECTED') { statusColor = "text-red-500"; statusLabel = "رد شد"; }
                                                                else if(approver.status === 'PENDING') { statusColor = "text-blue-500"; statusLabel = "در انتظار"; }
                                                                else if(approver.status === 'RETURNED') { statusColor = "text-orange-500"; statusLabel = "برگشت خورده"; }
                                                                else if(approver.status === 'RESUBMITTED') { statusColor = "text-purple-500"; statusLabel = "اصلاح شده"; }
                                                                else if(approver.status === 'FORWARDED') { statusColor = "text-teal-500"; statusLabel = "ارجاع شده"; }
                                                                else if(approver.status === 'SKIPPED') { statusColor = "text-gray-400"; statusLabel = "گذر شده"; }
                                                                
                                                                return (
                                                                    <div key={approver.id || i} className={`flex flex-col items-start gap-1 px-2 py-1.5 rounded-md border shadow-sm text-[10px] font-medium whitespace-nowrap transition-colors ${isApproverMe && approver.status === 'PENDING' ? 'border-blue-500/50 bg-blue-500/10' : isDark ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}`}>
                                                                        <div className="flex items-center gap-1.5">
                                                                            <FaUser size={9} className={statusColor} />
                                                                            <span>{approver.name || `کاربر ${approver.id}`}</span>
                                                                            {isApproverMe && <span className="text-[8px] bg-blue-500 text-white px-1 rounded ml-1">شما</span>}
                                                                        </div>
                                                                        <div className={`text-[9px] font-bold mt-0.5 ${statusColor}`}>{statusLabel}</div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                {index < stages.length - 1 && (
                                                    <div className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-full border-2 border-dashed mt-1 ${isDark ? 'border-slate-700 text-slate-500 bg-slate-800/30' : 'border-gray-300 text-gray-400 bg-gray-50'}`}><FaArrowLeft size={16} /></div>
                                                )}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    ) : (
                        <p className={`text-sm p-4 rounded-xl border ${isDark ? 'text-gray-500 bg-slate-900 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>مرحله‌ای ثبت نشده است.</p>
                    )}
                </div>

                {/* ── تاریخچه سیستمی ── */}
                <div>
                    <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}><FaClock size={12} className="text-green-500" /></div>
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
                                        <div className="text-[11px] text-gray-500 mt-1">{new Date(log.created_at).toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' })}</div>
                                        
                                        {log.files && log.files.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {log.files.map(f => (
                                                    <a key={f.id} href={f.file} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-md border dark:border-slate-700 text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                                        {FILE_ICONS[f.file_type] || <FaPaperclip className="text-gray-400" />}
                                                        <span className="text-blue-500 dark:text-blue-400 truncate max-w-[120px]">{f.file.split('/').pop()}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── ثبت یادداشت و پیامک ── */}
                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}><FaRegComment size={12} className="text-indigo-400" /></div>
                        ثبت یادداشت
                    </h3>

                    {commentFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {commentFiles.map((f, i) => (
                                <div key={i} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                    <span className="truncate max-w-[100px]">{f.name}</span>
                                    <FaTimes className="cursor-pointer text-red-400 hover:text-red-500" onClick={() => setCommentFiles(commentFiles.filter((_, idx) => idx !== i))} />
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea
                        value={commentNote}
                        onChange={e => setCommentNote(e.target.value)}
                        placeholder="یادداشت، توضیح یا سؤال..."
                        rows={3}
                        className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 resize-none mb-3 ${isDark ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'}`}
                    />
                    
                    <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        ref={commentFileRef} 
                        onChange={(e) => {
                            if (e.target.files) {
                                setCommentFiles(Array.from(e.target.files));
                            }
                            e.target.value = ''; 
                        }} 
                    />

                    <div className="flex gap-2">
                        <button onClick={handleAddComment} disabled={addingComment || (!commentNote.trim() && commentFiles.length === 0)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
                            {addingComment ? <FaSpinner className="animate-spin" size={14} /> : <FaPaperPlane size={12} />} ثبت یادداشت
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => commentFileRef.current?.click()}
                            title="ضمیمه فایل به یادداشت"
                            className={`px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border ${isDark ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                            <FaPaperclip size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowContactModal(true)}
                            title="ضمیمه کردن شماره تماس پرسنل"
                            className={`px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border ${isDark ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                            <FaAddressCard size={18} />
                        </button>
                    </div>
                </div>

                <TaskSmsSection assignLogs={taskData.assign_sms_logs} reminderLogs={taskData.reminder_sms_logs} onRefresh={onRefresh} />
            </div>

            {modal === 'approve' && <ConfirmModal title="تایید و خاتمه مرحله" message={pendingActionContext.require_file ? `آیا از ارسال فایل‌های لازم اطمینان دارید؟ با تایید، این مرحله خاتمه می‌یابد.` : `با تایید این مرحله، مسئولیت شما به پایان می‌رسد.`} confirmLabel="تایید و ثبت" confirmClass="bg-green-600 hover:bg-green-700" onConfirm={handleApprove} onClose={() => setModal(null)} />}
            {modal === 'reject' && <ConfirmModal title="رد کردن ماموریت" message={`آیا از رد کردن این گردش کار اطمینان دارید؟`} confirmLabel="تایید و رد ماموریت" confirmClass="bg-red-600 hover:bg-red-700" onConfirm={handleReject} onClose={() => setModal(null)} />}
            {modal === 'forward' && <ForwardModal taskId={task.id} onSuccess={() => { setModal(null); onRefresh(); }} onClose={() => setModal(null)} />}
            {modal === 'return' && <ReturnModal title="برگشت دادن به مجریان" assignees={stages.find(s => s.status === 'ACTIVE')?.assignees || []} onConfirm={handleReturn} onClose={() => setModal(null)} />}
            
            {templateModal && isAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm p-6 rounded-2xl shadow-xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>ذخیره به عنوان الگو</h3>
                        <input type="text" placeholder="فریز خرید سیمان" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-purple-500 mb-4 ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`} />
                        <div className={`mb-6 p-4 rounded-xl border space-y-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                            <p className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>کدام اطلاعات فریز شوند؟</p>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={freezeOptions.title} onChange={(e) => setFreezeOptions({...freezeOptions, title: e.target.checked})} className="rounded text-blue-600" /><span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>عنوان ماموریت</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={freezeOptions.task_type} onChange={(e) => setFreezeOptions({...freezeOptions, task_type: e.target.checked})} className="rounded text-blue-600" /><span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>نوع ماموریت</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={freezeOptions.urgency} onChange={(e) => setFreezeOptions({...freezeOptions, urgency: e.target.checked})} className="rounded text-blue-600" /><span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>سطح فوریت</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={freezeOptions.stages} onChange={(e) => setFreezeOptions({...freezeOptions, stages: e.target.checked})} className="rounded text-blue-600" /><span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ساختار مراحل (گردش کار)</span></label>
                            {freezeOptions.stages && (
                                <label className="flex items-center gap-2 cursor-pointer mr-6"><input type="checkbox" checked={freezeOptions.assignees} onChange={(e) => setFreezeOptions({...freezeOptions, assignees: e.target.checked})} className="rounded text-purple-600" /><span className={`text-sm ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>حفظ افراد منتصب در مراحل</span></label>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleSaveAsTemplate} disabled={freezingTemplate} className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm py-2.5 rounded-xl transition-colors font-medium flex justify-center items-center gap-2">{freezingTemplate ? <FaSpinner className="animate-spin" /> : 'ذخیره قالب'}</button>
                            <button onClick={() => { setTemplateModal(false); setTemplateName(''); setFreezeOptions({ title: true, task_type: true, urgency: true, stages: true, assignees: true }); }} disabled={freezingTemplate} className={`flex-1 text-sm py-2.5 rounded-xl transition-colors font-medium border ${isDark ? 'border-slate-700 text-gray-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>انصراف</button>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال کامل ویرایش پرونده + خط مونتاژ گردش کار */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className={`w-full max-w-5xl my-6 p-6 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                        
                        <div className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <FaEdit className="text-blue-500" /> ویرایش کامل پرونده و گردش کار
                            </h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-red-500 p-1"><FaTimes size={18} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto py-4 space-y-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>عنوان ماموریت</label>
                                    <input 
                                        type="text" 
                                        value={editData.title} 
                                        onChange={e => setEditData({...editData, title: e.target.value})} 
                                        className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`} 
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>نوع ماموریت</label>
                                        <select 
                                            value={editData.task_type} 
                                            onChange={e => setEditData({...editData, task_type: e.target.value})} 
                                            className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                                        >
                                            <option value="">بدون دسته‌بندی</option>
                                            {taskTypes?.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>سطح فوریت</label>
                                        <select 
                                            value={editData.urgency} 
                                            onChange={e => setEditData({...editData, urgency: e.target.value})} 
                                            className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                                        >
                                            <option value="LOW">کم</option>
                                            <option value="MEDIUM">متوسط</option>
                                            <option value="HIGH">زیاد</option>
                                            <option value="CRITICAL">بحرانی</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                                <h4 className="font-bold text-xs mb-3 flex items-center gap-2 text-blue-500">
                                    <FaSitemap size={14} /> طراحی و ویرایش مراحل گردش کار
                                </h4>
                                
                                <div className="flex flex-col xl:flex-row gap-4 h-auto xl:h-[480px]">
                                    <div className={`flex-1 overflow-x-auto overflow-y-auto pb-2 px-2 flex items-start gap-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                                        {editStages.map((stage, index) => (
                                            <React.Fragment key={stage.id}>
                                                <div
                                                    onClick={() => setActiveEditElement({ id: stage.id, type: 'STAGE' })}
                                                    className={`shrink-0 w-[300px] rounded-xl border-2 flex flex-col cursor-pointer shadow-sm my-2 transition-all
                                                    ${activeEditElement.id === stage.id && activeEditElement.type === 'STAGE'
                                                        ? 'border-blue-500 ' + (isDark ? 'bg-slate-800' : 'bg-blue-50/30') 
                                                        : 'border-slate-600/50 ' + (isDark ? 'bg-slate-800/60' : 'bg-white')}`}
                                                >
                                                    <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-black/5 rounded-t-lg">
                                                        <span className="text-sm font-bold text-gray-500">مرحله {index + 1}</span>
                                                        {editStages.length > 1 && (
                                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveEditStage(stage.id); }} className="text-red-400 hover:text-red-500 p-1"><FaTrash size={14} /></button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="p-4 flex flex-col gap-4 max-h-[380px] overflow-y-auto">
                                                        <input 
                                                            type="text" value={stage.stageName} onChange={e => updateEditStageField(stage.id, 'stageName', e.target.value)}
                                                            placeholder="نام مرحله..." className={`w-full text-sm font-bold pb-2 border-b outline-none bg-transparent ${isDark ? 'text-white border-slate-600' : 'text-gray-900 border-gray-300'}`} 
                                                        />
                                                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                            <FaAlignRight className="text-gray-400 text-sm shrink-0" />
                                                            <input 
                                                                type="text" value={stage.description} onChange={e => updateEditStageField(stage.id, 'description', e.target.value)}
                                                                placeholder="شرح وظیفه..." className={`w-full text-xs outline-none bg-transparent ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <label className={`flex-1 flex items-center justify-center px-1.5 py-2.5 rounded-lg border transition-colors ${stage.requireFile ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : (isDark ? 'bg-slate-900/50 border-slate-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-500')} cursor-pointer`}>
                                                                <input type="checkbox" checked={stage.requireFile} onChange={e => updateEditStageField(stage.id, 'requireFile', e.target.checked)} className="hidden" />
                                                                <FaPaperclip size={12} className="mr-1" /><span className="text-xs font-bold">فایل اجباری</span>
                                                            </label>
                                                            <select value={stage.approvalRule} onChange={e => updateEditStageField(stage.id, 'approvalRule', e.target.value)} className={`flex-[2] text-xs px-2 py-2.5 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
                                                                {APPROVAL_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                            </select>
                                                        </div>
                                                        
                                                        {/* 👈 فیلدهای تاریخ و ساعت (قفل برداشته شد + رفع باگ رویداد e) */}
                                                        <div className="flex flex-col gap-1.5 mt-1">
                                                            <span className="text-xs font-bold text-gray-500">مهلت انجام (اختیاری):</span>
                                                            <div className="flex gap-2">
                                                                <div className={`flex-1 rounded-lg border transition-colors focus-within:border-blue-500 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                                    <JalaliDatePicker
                                                                        value={stage.deadlineDate}
                                                                        onChange={(e) => updateEditStageField(stage.id, 'deadlineDate', e.target ? e.target.value : e)}
                                                                        placeholder="انتخاب تاریخ"
                                                                        className={`w-full px-3 py-2.5 text-xs outline-none bg-transparent ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                                                                    />
                                                                </div>
                                                                <div className={`w-[110px] rounded-lg border transition-colors focus-within:border-blue-500 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                                    <input 
                                                                        type="time" 
                                                                        value={stage.deadlineTime} 
                                                                        onChange={(e) => updateEditStageField(stage.id, 'deadlineTime', e.target.value)} 
                                                                        className={`w-full px-2 py-2.5 text-xs outline-none bg-transparent ${isDark ? 'text-gray-200 [color-scheme:dark]' : 'text-gray-800'}`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mt-2 flex-1 flex flex-col gap-2">
                                                            <span className="text-xs font-bold text-gray-500">مسئولین:</span>
                                                            {stage.assignees.length === 0 ? (
                                                                <div className="flex-1 min-h-[50px] flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-500/30 rounded-lg p-2">بدون مسئول</div>
                                                            ) : (
                                                                <div className="flex flex-wrap gap-1.5">
                                                                {stage.assignees.map(empId => {
                                                                    const emp = subordinates?.find(e => e.user_id === empId);
                                                                    return emp ? <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveEditAssignee(stage.id, 'STAGE', id)} /> : <span key={empId} className="text-xs">کاربر {empId}</span>;
                                                                })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 flex items-center justify-center px-2 self-center my-2">
                                                    <div 
                                                        onClick={() => setActiveEditElement({ id: stage.id, type: 'LINK' })}
                                                        className={`w-40 min-h-[140px] rounded-xl border-2 flex flex-col items-center p-3 cursor-pointer transition-all ${
                                                            activeEditElement.id === stage.id && activeEditElement.type === 'LINK' // ✅ اصلاح شد
                                                            ? 'border-orange-500 bg-orange-500/10' : 'border-dashed border-orange-500/50 bg-orange-500/5'
                                                        }`}
                                                    >
                                                        <span className="text-xs font-bold text-orange-500 mb-2">تاییدیه (اختیاری)</span>
                                                        <select value={stage.approverRule} onChange={(e) => updateEditStageField(stage.id, 'approverRule', e.target.value)} onClick={e => e.stopPropagation()} className={`w-full text-xs p-1.5 mb-3 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                                            {APPROVER_RULES.map(rule => <option key={rule.value} value={rule.value}>{rule.label}</option>)}
                                                        </select>
                                                        <div className="flex-1 flex flex-col gap-2 w-full items-center justify-center">
                                                            {stage.nextStageApprovers.length === 0 ? (
                                                                <div className="text-orange-500/40 flex flex-col items-center"><FaArrowLeft size={16} className="mb-1" /><span className="text-xs">مستقیم</span></div>
                                                            ) : (
                                                                <div className="w-full flex flex-wrap gap-1.5 items-center justify-center">
                                                                    {stage.nextStageApprovers.map(empId => {
                                                                        const emp = subordinates?.find(e => e.user_id === empId);
                                                                        return emp ? <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveEditAssignee(stage.id, 'LINK', id)} /> : <span key={empId} className="text-xs">کاربر {empId}</span>;
                                                                    })}
                                                                    <FaArrowLeft size={12} className="text-orange-500 mt-2" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        ))}
                                        
                                        <div className="shrink-0 flex items-center pl-2 self-stretch my-2">
                                            <button onClick={handleAddEditStage} className={`w-[60px] h-full min-h-[150px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${isDark ? 'border-slate-700 hover:border-blue-500 text-slate-500' : 'border-gray-300 hover:border-blue-500 text-gray-400'}`}>
                                                <FaPlus size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`w-full xl:w-[320px] shrink-0 border rounded-xl overflow-hidden shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                                        <AssigneePickerPanel
                                            subordinates={subordinates || []}
                                            loading={loadingSubordinates}
                                            selectedIds={activeEditSelectedIds}
                                            onChange={handleEditAssigneeChange}
                                            activeStageName={getActiveStageNameForEditPicker()}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1">
                                        <label className={`text-xs font-bold mb-1.5 block flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <FaClock /> مهلت نهایی پرونده (اختیاری)
                                        </label>
                                        <JalaliDatePicker
                                            value={editData.deadlineDate}
                                            onChange={(e) => setEditData({...editData, deadlineDate: e.target ? e.target.value : e})}
                                            placeholder="تاریخ"
                                            className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                                        />
                                    </div>
                                    <div className="w-24">
                                        <input 
                                            type="time" 
                                            value={editData.deadlineTime} 
                                            onChange={e => setEditData({...editData, deadlineTime: e.target.value})} 
                                            className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>توضیحات کلی</label>
                                    <textarea 
                                        rows={2}
                                        value={editData.note} 
                                        onChange={e => setEditData({...editData, note: e.target.value})} 
                                        className={`w-full p-2.5 text-sm rounded-lg border outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-slate-950 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`} 
                                    />
                                </div>
                            </div>

                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700 shrink-0">
                            <button 
                                onClick={submitEditTask} 
                                disabled={editingTask} 
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm py-2.5 rounded-lg transition-colors font-bold flex justify-center items-center gap-2"
                            >
                                {editingTask ? <FaSpinner className="animate-spin" /> : 'تایید و ثبت تغییرات'}
                            </button>
                            <button 
                                onClick={() => setShowEditModal(false)} 
                                disabled={editingTask} 
                                className={`flex-1 text-sm py-2.5 rounded-lg transition-colors font-bold border ${isDark ? 'border-slate-700 text-gray-300 hover:bg-slate-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm flex flex-col h-[500px] rounded-2xl shadow-xl overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                        <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                            <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>ضمیمه اطلاعات تماس</h3>
                            <button onClick={() => { setShowContactModal(false); setContactSelectedIds([]); }} className="text-gray-500 hover:text-red-500 transition-colors"><FaTimes /></button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <AssigneePickerPanel subordinates={subordinates || []} loading={loadingSubordinates} selectedIds={contactSelectedIds} onChange={setContactSelectedIds} />
                        </div>
                        <div className={`p-3 border-t flex gap-2 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                            <button onClick={handleAppendContacts} disabled={contactSelectedIds.length === 0} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white py-2.5 rounded-lg text-sm font-medium transition-colors">تایید و درج در متن</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TaskDetailPanel;