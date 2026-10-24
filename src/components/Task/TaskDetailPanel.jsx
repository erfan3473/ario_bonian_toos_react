import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    uploadTaskFile, addTaskComment, returnTaskStep, freezeTaskTemplate, 
    fetchSubordinates, editTask, fetchTaskTypes 
} from '../../features/task/taskSlice';
import axiosInstance from '../../api/axiosInstance';
import moment from 'moment-jalaali';
import {
    FaCheckCircle, FaTimesCircle, FaArrowLeft, FaArrowDown, FaClock, FaUser,
    FaPaperclip, FaUpload, FaSpinner, FaDownload, FaChevronRight,
    FaRegComment, FaPaperPlane, FaSitemap, FaAlignRight, FaUndo, 
    FaSnowflake, FaAddressCard, FaTimes, FaEdit, FaPlus, FaTrash,
    FaSun, FaMoon, FaLock, FaCheck, FaInfoCircle, FaCog, FaUserPlus
} from 'react-icons/fa';
import JalaliDatePicker from '../common/JalaliDatePicker';

import sarbargImg from '../../assets/sarbarg-style-2.png';

import { 
    STATUS_COLORS, STATUS_LABELS, STEP_STATE_CONFIG, 
    URGENCY_LABELS, URGENCY_COLORS, ACTION_LABELS, FILE_ICONS
} from './taskConstants'; 
import { ConfirmModal, ForwardModal, ReturnModal } from './TaskModals';
import TaskSmsSection from './TaskSmsSection';
import AssigneePickerPanel, { AssigneeChip, Avatar } from './AssigneePickerPanel';

const APPROVAL_RULES = [ 
    { value: 'ANY_ASSIGNEE', label: 'تایید توسط یک نفر کافیست' }, 
    { value: 'ALL_ASSIGNEES', label: 'تایید همه اجباری است' } 
];
const APPROVER_RULES = [ 
    { value: 'ALL_APPROVERS', label: 'تایید همه اجباری است' }, 
    { value: 'ANY_APPROVER', label: 'تایید توسط یک نفر کافیست' } 
];

const ASSIGNEE_STATE_OPTIONS = [
    { value: 'PENDING', label: 'در انتظار اقدام' },
    { value: 'IN_PROGRESS', label: 'در حال انجام' },
    { value: 'APPROVED', label: 'تایید / انجام شد' },
    { value: 'REJECTED', label: 'رد شد' },
    { value: 'FORWARDED', label: 'ارجاع داده شد' },
    { value: 'SKIPPED', label: 'گذر شده' },
];

const APPROVER_STATUS_OPTIONS = [
    { value: 'PENDING', label: 'در انتظار اقدام' },
    { value: 'FORWARDED', label: 'ارجاع داده شد' },
    { value: 'RETURNED', label: 'برگشت به مرحله قبل' },
    { value: 'RESUBMITTED', label: 'بررسی مجدد' },
    { value: 'APPROVED', label: 'تایید شد' },
    { value: 'REJECTED', label: 'رد شد' },
    { value: 'SKIPPED', label: 'رد شده/غیرفعال' },
];

const UserAvatar = ({ avatarUrl, name = '', size = 'w-6 h-6 text-[10px]', className = '' }) => {
    const initial = name ? name.trim()[0] : '?';
    if (avatarUrl) {
        return (
            <img 
                src={avatarUrl} 
                alt={name} 
                className={`${size} rounded-full object-cover shrink-0 border border-gray-300 dark:border-gray-600 shadow-sm ${className}`} 
            />
        );
    }
    return (
        <div className={`${size} rounded-full flex items-center justify-center font-bold shrink-0 bg-blue-600 text-white shadow-sm ${className}`}>
            {initial}
        </div>
    );
};

const formatJalaliFullDateTime = (dateStr) => {
    if (!dateStr) return null;
    const m = moment(dateStr);
    const hour = m.hour();
    const isMorning = hour >= 4 && hour < 12;
    const timeOfDay = isMorning ? 'صبحگاه' : (hour >= 12 && hour < 18 ? 'عصرگاه' : 'شامگاه');
    const Icon = isMorning ? FaSun : FaMoon;
    const iconColor = isMorning ? 'text-amber-500' : 'text-indigo-400';

    return {
        numeric: m.format('jYYYY/jMM/jDD - HH:mm'),
        textual: `${m.format('dddd jD jMMMM')} - ساعت ${m.format('HH:mm')} (${timeOfDay})`,
        Icon,
        iconColor
    };
};

const TaskDetailPanel = ({ taskData, currentUserId, onRefresh, onBack }) => {
    const dispatch = useDispatch();

    const userInfo = useSelector((state) => state.userLogin?.userInfo);
    const isAdmin = userInfo?.is_admin || userInfo?.is_staff || userInfo?.is_superuser;

    const { uploadingFile, addingComment, freezingTemplate, subordinates, loadingSubordinates, editingTask, taskTypes } = useSelector(s => s.task);

    const myEmployeeRecord = subordinates?.find(e => e.user_id === currentUserId);
    const isBoard = myEmployeeRecord?.hierarchy_level === 0;
    const isAdminOrBoard = isAdmin || isBoard;

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
    
    // 🌟 استیت‌های استپر برای ویرایش کامل و شبیه به مودال ایجاد
    const [currentEditStep, setCurrentEditStep] = useState(1);
    const [pickerOpenMobile, setPickerOpenMobile] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const [editData, setEditData] = useState({ 
        title: '', note: '', urgency: 'MEDIUM', task_type: '', status: 'PENDING', deadlineDate: '', deadlineTime: '23:59' 
    });
    const [editStages, setEditStages] = useState([]);
    const [activeEditElement, setActiveEditElement] = useState({ id: null, type: 'STAGE' });
    const [editSendSms, setEditSendSms] = useState(false);

    // 🌟 گزینه‌های فریز قالب
    const [freezeOptions, setFreezeOptions] = useState({
        title: true, task_type: true, urgency: true, note: true, stages: true, assignees: true
    });

    const { task, logs = [], files = [] } = taskData;
    const stages = task?.stages || []; 

    const creatorEmployee = useMemo(() => {
        return subordinates?.find(e => e.user_id === task?.created_by_id);
    }, [subordinates, task?.created_by_id]);

    let myPendingAction = null;
    let pendingActionContext = { type: null, name: '', require_file: false, rolesText: '' };
    let isWaitingForAssignees = false;

    const isCreatorOrAdmin = Number(task.created_by_id) === Number(currentUserId) || isAdminOrBoard;

    useEffect(() => {
        if ((showContactModal || showEditModal || !subordinates?.length) && (!subordinates || subordinates.length === 0)) {
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

    const validateEditStep = (step) => {
        const errors = {};
        if (step === 1) {
            if (!editData.title.trim()) errors.title = 'عنوان ماموریت الزامی است';
            else if (editData.title.trim().length < 3) errors.title = 'عنوان باید حداقل ۳ کاراکتر باشد';
            if (!editData.task_type) errors.taskType = 'انتخاب دسته‌بندی الزامی است';
        } else if (step === 2) {
            editStages.forEach((s, idx) => {
                if (!s.stageName.trim()) errors[`stageName_${s.id}`] = `نام مرحله ${idx + 1} الزامی است`;
                if (s.assignees.length === 0) errors[`stage_${s.id}`] = `مسئولین مرحله ${idx + 1} خالی است`;
            });
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleEditNext = () => {
        if (validateEditStep(currentEditStep)) {
            setCurrentEditStep(prev => Math.min(prev + 1, 3));
            setPickerOpenMobile(false);
        }
    };

    const handleEditPrev = () => {
        setCurrentEditStep(prev => Math.max(prev - 1, 1));
        setPickerOpenMobile(false);
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
            status: task.status || 'PENDING',
            deadlineDate: dDate,
            deadlineTime: dTime,
        });
        setEditSendSms(false);
        setCurrentEditStep(1);
        setValidationErrors({});

        const loadedStages = stages.map((s, idx) => {
            const [sDate, sTime] = s.deadline ? moment(s.deadline).format('YYYY-MM-DD HH:mm').split(' ') : ['', '23:59'];

            const initialAssigneeStates = {};
            (s.assignees || []).forEach(a => {
                const uid = a.user || a.user_id;
                if (uid) initialAssigneeStates[uid] = a.state || 'PENDING';
            });

            const initialApproverStatuses = {};
            (s.intermediate_approvers_details || s.approval_records || []).forEach(ap => {
                const uid = ap.id || ap.user || ap.user_id;
                if (uid) initialApproverStatuses[uid] = ap.status || 'PENDING';
            });

            return {
                id: s.id, 
                stageName: s.stage_name || `مرحله ${idx + 1}`,
                description: s.description || '',
                deadlineDate: sDate,
                deadlineTime: sTime,
                status: s.status || 'PENDING',
                requireFile: !!s.require_file,
                assignees: s.assignees?.map(a => a.user || a.user_id) || [],
                assigneeStates: initialAssigneeStates,
                approvalRule: s.approval_rule || 'ANY_ASSIGNEE',
                nextStageApprovers: s.intermediate_approvers_details?.map(ap => ap.id) || [],
                approverStatuses: initialApproverStatuses,
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
            id: newId, 
            stageName: `مرحله ${editStages.length + 1}`, 
            description: '', 
            deadlineDate: '', 
            deadlineTime: '23:59', 
            status: 'PENDING', 
            requireFile: false, 
            assignees: [], 
            assigneeStates: {},
            approvalRule: 'ANY_ASSIGNEE', 
            nextStageApprovers: [], 
            approverStatuses: {},
            approverRule: 'ALL_APPROVERS'
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
                if (activeEditElement.type === 'STAGE') {
                    const newStates = { ...(s.assigneeStates || {}) };
                    selectedIds.forEach(uid => {
                        if (!newStates[uid]) newStates[uid] = 'PENDING';
                    });
                    return { ...s, assignees: selectedIds, assigneeStates: newStates };
                } else {
                    const newStatuses = { ...(s.approverStatuses || {}) };
                    selectedIds.forEach(uid => {
                        if (!newStatuses[uid]) newStatuses[uid] = 'PENDING';
                    });
                    return { ...s, nextStageApprovers: selectedIds, approverStatuses: newStatuses };
                }
            }
            return s;
        }));
    };

    const handleRemoveEditAssignee = (stageId, type, empIdToRemove) => {
        setEditStages(editStages.map(s => {
            if (s.id === stageId) {
                if (type === 'STAGE') {
                    const newStates = { ...(s.assigneeStates || {}) };
                    delete newStates[empIdToRemove];
                    return { ...s, assignees: s.assignees.filter(id => id !== empIdToRemove), assigneeStates: newStates };
                } else {
                    const newStatuses = { ...(s.approverStatuses || {}) };
                    delete newStatuses[empIdToRemove];
                    return { ...s, nextStageApprovers: s.nextStageApprovers.filter(id => id !== empIdToRemove), approverStatuses: newStatuses };
                }
            }
            return s;
        }));
    };

    const updateAssigneeState = (stageId, userId, newState) => {
        setEditStages(editStages.map(s => {
            if (s.id === stageId) {
                return {
                    ...s,
                    assigneeStates: {
                        ...(s.assigneeStates || {}),
                        [userId]: newState
                    }
                };
            }
            return s;
        }));
    };

    const updateApproverStatus = (stageId, userId, newStatus) => {
        setEditStages(editStages.map(s => {
            if (s.id === stageId) {
                return {
                    ...s,
                    approverStatuses: {
                        ...(s.approverStatuses || {}),
                        [userId]: newStatus
                    }
                };
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
        if (!validateEditStep(1) || !validateEditStep(2)) {
            setCurrentEditStep(1);
            return;
        }

        let finalDeadline = null;
        if (editData.deadlineDate) {
            finalDeadline = `${editData.deadlineDate}T${editData.deadlineTime || '23:59'}:00`;
        }

        const payload = {
            title: editData.title.trim(),
            note: editData.note.trim(),
            urgency: editData.urgency,
            task_type: editData.task_type,
            status: editData.status,
            deadline: finalDeadline,
            send_sms: editSendSms,
            workflow_stages: editStages.map((s, idx) => ({
                id: s.id,
                step_index: idx + 1,
                stage_name: s.stageName,
                description: s.description,
                deadline: s.deadlineDate ? `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00` : null,
                status: s.status,
                require_file: s.requireFile,
                assignee_ids: s.assignees,
                assignee_states: s.assigneeStates || {},
                intermediate_approvers: s.nextStageApprovers,
                approver_statuses: s.approverStatuses || {},
                approval_rule: s.approvalRule,
                approver_rule: s.approverRule
            }))
        };

        const res = await dispatch(editTask({ taskId: task.id, payload }));
        if (!res.error) {
            setShowEditModal(false);
            setEditSendSms(false);
            if (onRefresh) onRefresh();
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
        dispatch(uploadTaskFile({ taskId: task.id, file })).then(() => {
            if (onRefresh) onRefresh();
        });
        e.target.value = '';
    };

    const handleApprove = async (note) => {
        await axiosInstance.post(`/tasks/${task.id}/approve/`, { note });
        setModal(null);
        if (onRefresh) onRefresh();
    };

    const handleReject = async (note) => {
        await axiosInstance.post(`/tasks/${task.id}/reject/`, { note });
        setModal(null);
        if (onRefresh) onRefresh();
    };

    const handleReturn = async (targetIds, note) => {
        if (!targetIds || targetIds.length === 0) return alert('لطفاً حداقل یک مجری را انتخاب کنید.');
        try {
            await dispatch(returnTaskStep({ taskId: task.id, target_user_ids: targetIds, note })).unwrap();
            setModal(null);
            if (onRefresh) onRefresh();
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
            setTimeout(() => setCommentSuccess(false), 3000);
            if (onRefresh) onRefresh();
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
            ...(freezeOptions.note && { note: task.note }),
            ...(freezeOptions.stages && { workflow_stages: mappedStages }),
            project_id: task.project?.id || null
        };

        const result = await dispatch(freezeTaskTemplate({ templateName, templateData, isGlobal: false }));
        if (freezeTaskTemplate.fulfilled.match(result)) {
            setTemplateModal(false);
            setTemplateName('');
            setFreezeOptions({ title: true, task_type: true, urgency: true, note: true, stages: true, assignees: true });
            alert('ماموریت با موفقیت به عنوان قالب فریز شد.');
        } else {
            alert(result.payload || 'خطا در ذخیره قالب.');
        }
    };

    return (
        <div className={`h-full flex flex-col overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-gray-100'}`}>

            {/* نوار ابزار بالای برگه - جمع‌وجور و متناسب‌شده برای موبایل */}
            <div className={`px-2.5 sm:px-6 py-2 sm:py-3 border-b flex-shrink-0 z-20 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-gray-200 bg-white'}`}>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    {onBack && (
                        <button onClick={onBack} className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-sm transition-colors border text-[11px] sm:text-xs font-semibold ${isDark ? 'bg-zinc-800 text-blue-400 hover:bg-zinc-700 border-zinc-600' : 'bg-gray-100 text-blue-600 hover:bg-gray-200 border-gray-300'}`}>
                            <FaChevronRight size={10} />
                            <span>بازگشت</span>
                        </button>
                    )}
                    <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-sm border ${STATUS_COLORS[task.status] || ''}`}>
                        <span className="font-normal opacity-75">وضعیت:</span>
                        {STATUS_LABELS[task.status] || task.status}
                    </span>

                    {/* فریز شدن سطح فوریت */}
                    <span className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-sm border transition-all duration-300 ${
                        templateModal && freezeOptions.urgency 
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400 font-black' 
                            : URGENCY_COLORS[task.urgency] || URGENCY_COLORS.MEDIUM
                    }`}>
                        {templateModal && freezeOptions.urgency && <FaLock size={8} className="inline ml-1 text-cyan-400" />}
                        فوریت: {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                    </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                    {isCreatorOrAdmin && (
                        <button
                            onClick={openEditModal}
                            className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-sm border transition-colors ${
                                isDark
                                    ? 'bg-blue-600/25 text-blue-300 border-blue-500/55 hover:bg-blue-600/40'
                                    : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                            }`}
                        >
                            <FaEdit size={11} />
                            ویرایش
                        </button>
                    )}
                    {isAdminOrBoard && (
                        <button
                            onClick={() => setTemplateModal(true)}
                            className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-sm border transition-colors ${
                                isDark
                                    ? 'bg-purple-600/25 text-purple-300 border-purple-500/55 hover:bg-purple-600/40'
                                    : 'bg-purple-50 text-purple-700 border-purple-300 hover:bg-purple-100'
                            }`}
                        >
                            <FaSnowflake size={11} />
                            فریز قالب
                        </button>
                    )}
                </div>
            </div>

            {/* بخش اسکرول‌شونده - کاهش پدینگ‌ها و فاصله‌ها در موبایل */}
            <div className="flex-1 overflow-y-auto p-1.5 sm:p-4 md:p-6 space-y-3 sm:space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">

                {/* بنرهای اقدام در انتظار */}
                {isWaitingForAssignees && !myPendingAction && (
                    <div className="p-2.5 sm:p-4 bg-orange-500/15 border border-orange-500/50 rounded-sm">
                        <div className="flex items-center gap-2">
                            <FaClock className="text-orange-400 text-sm sm:text-lg shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-orange-400 text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1">نقش شما: {pendingActionContext.rolesText}</span>
                                <p className="text-orange-300 text-xs sm:text-sm font-semibold">
                                    {pendingActionContext.rolesText.includes('مجری') ? 'شما کار خود را انجام داده‌اید. منتظر بمانید تا سایر مجریان نیز تمام کنند.' : 'لطفاً منتظر بمانید تا مجریان کارشان را به اتمام برسانند.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {myPendingAction && (
                    <div className="p-2.5 sm:p-4 bg-blue-500/15 border border-blue-500/50 rounded-sm">
                        <div className="flex items-center justify-between mb-2.5 sm:mb-3 flex-wrap gap-1.5 sm:gap-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-blue-400 text-[10px] sm:text-[11px] font-bold bg-blue-500/15 px-1.5 sm:px-2 py-0.5 rounded-sm border border-blue-500/30 w-fit">نقش شما: {pendingActionContext.rolesText}</span>
                                <p className="text-blue-300 text-xs sm:text-sm font-semibold">اقدام شما برای «{pendingActionContext.name}» نیاز است</p>
                            </div>
                            {pendingActionContext.require_file && (
                                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-red-300/20 text-yellow-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-sm border border-yellow-500/40 font-bold"><FaPaperclip size={9} /> ارسال فایل الزامیست</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:flex gap-1.5 sm:gap-3">
                            <button onClick={() => setModal('approve')} className="sm:flex-1 bg-green-600 hover:bg-green-500 text-white text-xs sm:text-sm py-1.5 sm:py-2 px-2 rounded-sm transition-colors font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"><FaCheckCircle size={12} /> تایید</button>
                            {pendingActionContext.type !== 'APPROVER' && (
                                <button onClick={() => setModal('forward')} className="sm:flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm py-1.5 sm:py-2 px-2 rounded-sm transition-colors font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"><FaArrowLeft size={11} /> ارجاع</button>
                            )}
                            {pendingActionContext.type === 'APPROVER' && (
                                <button onClick={() => setModal('return')} className="sm:flex-1 bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm py-1.5 sm:py-2 px-2 rounded-sm transition-colors font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"><FaUndo size={11} /> برگشت جهت اصلاح</button>
                            )}
                            <button onClick={() => setModal('reject')} className="sm:flex-1 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm py-1.5 sm:py-2 px-2 rounded-sm transition-colors font-medium flex items-center justify-center gap-1.5 sm:gap-2 shadow-sm"><FaTimesCircle size={12} /> رد کردن</button>
                        </div>
                    </div>
                )}

                {/* ── 🌟 برگه رسمی ماموریت: بهینه‌سازی کامل فاصله از لبه‌ها در موبایل و حفظ ابعاد A4 در دسکتاپ/چاپ ── */}
                <div className="w-full overflow-x-auto flex justify-center py-0.5 sm:py-4 print:p-0 print:m-0 print:overflow-visible">
                    <div 
                        id="task-a4-sheet"
                        className="relative bg-white text-gray-900 flex flex-col justify-between shadow-2xl border print:shadow-none print:border-none rounded-sm select-text w-full max-w-[210mm] box-border bg-no-repeat bg-top
                        min-h-[460px] sm:min-h-[680px] md:min-h-[297mm] print:min-h-[297mm]
                        pt-[68px] sm:pt-[110px] md:pt-[48mm] print:pt-[48mm]
                        pb-6 sm:pb-12 md:pb-[25mm] print:pb-[25mm]
                        px-3 sm:px-8 md:px-[22mm] print:px-[22mm]
                        bg-[length:100%_100%] md:bg-[length:100%_297mm] print:bg-[length:100%_297mm]"
                        style={{ 
                            minWidth: 'min(100%, 210mm)',
                            backgroundImage: `url(${sarbargImg})`,
                        }}
                    >
                        {/* ۱. بلوک متادیتای اداری بالای برگه */}
                        <div className="flex justify-between items-start text-[10px] sm:text-xs text-gray-800 pb-2 sm:pb-3 mb-2.5 sm:mb-4 border-b border-gray-300 gap-2 sm:gap-4">
                            {/* راست: صادرکننده، نوع، فوریت و مهلت اقدام */}
                            <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <span className="font-bold text-gray-600">صادرکننده / آمر:</span>
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        <UserAvatar 
                                            avatarUrl={creatorEmployee?.avatar_url} 
                                            name={task.created_by_name || 'سیستم'} 
                                            size="w-4 h-4 text-[8px] sm:w-5 sm:h-5 sm:text-[9px]"
                                        />
                                        <strong className="text-gray-900 truncate">{task.created_by_name || 'سیستم'}</strong>
                                    </div>
                                </div>

                                {/* 🌟 نمایش نوع (دسته‌بندی) ماموریت در سربرگ */}
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <span className="font-bold text-gray-600">نوع ماموریت:</span>
                                    <span className={`text-[9px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded border transition-all duration-300 ${
                                        templateModal && freezeOptions.task_type 
                                            ? 'bg-cyan-100 border-cyan-400 text-cyan-950 shadow-[0_0_8px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400' 
                                            : 'bg-gray-100 border-gray-200 text-gray-900 font-bold'
                                    }`}>
                                        {templateModal && freezeOptions.task_type && <FaLock size={8} className="inline ml-1 text-cyan-600" />}
                                        {task.task_type_label || task.task_type || 'بدون دسته‌بندی'}
                                    </span>
                                </div>

                                {/* 🌟 نمایش سطح فوریت در سربرگ */}
                                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                                    <span className="font-bold text-gray-600">سطح فوریت:</span>
                                    <span className={`text-[9px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded font-black border transition-all duration-300 ${
                                        templateModal && freezeOptions.urgency 
                                            ? 'bg-cyan-100 border-cyan-400 text-cyan-950 shadow-[0_0_8px_rgba(6,182,212,0.4)] ring-1 ring-cyan-400' 
                                            : URGENCY_COLORS[task.urgency] || ''
                                    }`}>
                                        {templateModal && freezeOptions.urgency && <FaLock size={8} className="inline ml-1 text-cyan-600" />}
                                        {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                                    </span>
                                </div>

                                {task.deadline && (
                                    <div className="text-orange-600 font-bold flex items-center gap-1 text-[10px] sm:text-xs">
                                        <FaClock size={10} className="shrink-0" />
                                        <span>مهلت اقدام:</span>
                                        <span dir="ltr">{moment(task.deadline).format('jYYYY/jMM/jDD - HH:mm')}</span>
                                    </div>
                                )}
                            </div>

                            {/* چپ: شماره، تاریخ کامل و پیوست */}
                            <div className="flex flex-col items-end text-left shrink-0 text-[9px] sm:text-[11px] space-y-0.5 sm:space-y-1 max-w-[46%] sm:max-w-none" dir="ltr">
                                <div className="w-full text-left">
                                    <span className="font-sans font-bold">شماره:</span> {task.id}
                                </div>

                                {(() => {
                                    const dt = formatJalaliFullDateTime(task.created_at);
                                    if (!dt) return null;
                                    const TimeIcon = dt.Icon;
                                    return (
                                        <>
                                            <div className="w-full text-left whitespace-nowrap">
                                                <span className="font-sans font-bold">تاریخ:</span> {dt.numeric}
                                            </div>
                                            <div className="text-[8px] sm:text-[10px] text-gray-500 flex items-center justify-start gap-1 font-sans w-full text-left">
                                                <TimeIcon className={`${dt.iconColor} shrink-0`} size={9} />
                                                <span className="truncate">{dt.textual}</span>
                                            </div>
                                        </>
                                    );
                                })()}

                                <div className="w-full text-left">
                                    <span className="font-sans font-bold">پیوست:</span> {files.length > 0 ? `${files.length} مورد` : 'ندارد'}
                                </div>
                            </div>
                        </div>

                        {/* ۲. بدنه اصلی برگه نامه (موضوع و متن توضیحات) */}
                        <div className="space-y-2.5 sm:space-y-4">
                            {/* فریز موضوع */}
                            <h2 className={`text-xs sm:text-base font-black leading-snug sm:leading-normal pr-1.5 sm:pr-2 transition-all duration-300 ${
                                templateModal && freezeOptions.title 
                                    ? 'border-r-4 border-cyan-500 bg-cyan-100/90 p-2 sm:p-2.5 rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.4)] ring-2 ring-cyan-400 text-cyan-950 font-black' 
                                    : 'text-gray-900 border-r-3 sm:border-r-4 border-blue-600'
                            }`}>
                                {templateModal && freezeOptions.title && <FaLock size={11} className="inline ml-1 text-cyan-600" />}
                                موضوع: {task.title}
                            </h2>

                            {/* فریز توضیحات */}
                            <div className={`transition-all duration-300 ${
                                templateModal && freezeOptions.note 
                                    ? 'border-2 border-cyan-400 bg-cyan-50/90 p-2.5 sm:p-4 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] relative' 
                                    : ''
                            }`}>
                                {templateModal && freezeOptions.note && (
                                    <div className="absolute top-1.5 left-1.5 text-[9px] sm:text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 font-sans shadow font-bold">
                                        <FaLock size={8} /> فریز توضیحات
                                    </div>
                                )}
                                {task.note ? (
                                    <div className="text-xs sm:text-sm leading-6 sm:leading-8 text-gray-800 text-justify whitespace-pre-line font-medium pt-1 sm:pt-2">
                                        {task.note}
                                    </div>
                                ) : (
                                    <p className="text-[11px] sm:text-xs text-gray-400 italic">بدون توضیحات تکمیلی.</p>
                                )}
                            </div>
                        </div>

                        {/* ── 🌟 خط مونتاژ گردش کار ── */}
                        <div className={`my-3.5 sm:my-6 pt-2.5 sm:pt-4 border-t transition-all duration-300 ${
                            templateModal && freezeOptions.stages 
                                ? 'border-2 border-cyan-400 bg-cyan-50/70 p-2.5 sm:p-4 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.35)] relative' 
                                : 'border-gray-200'
                        }`}>
                            {templateModal && freezeOptions.stages && (
                                <div className="flex items-center justify-between mb-2.5 sm:mb-3 bg-cyan-600 text-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow">
                                    <span className="text-[10px] sm:text-xs font-bold flex items-center gap-1.5">
                                        <FaLock size={10} /> فریز ساختار مراحل {freezeOptions.assignees ? '(به همراه پرسنل انتصابی)' : '(فقط قالب مراحل)'}
                                    </span>
                                </div>
                            )}
                            
                            <h3 className="font-bold text-[11px] sm:text-xs mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 text-blue-700">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm flex items-center justify-center bg-blue-100 text-blue-600">
                                    <FaSitemap size={10} />
                                </div>
                                خط مونتاژ گردش کار و مراحل اقدام
                            </h3>

                            {stages && stages.length > 0 ? (
                                <div className="w-full pb-2.5 sm:pb-4 pt-2 sm:pt-3 px-2 sm:px-3 flex flex-wrap items-start justify-center gap-y-2.5 sm:gap-y-8 gap-x-3 sm:gap-x-4 bg-gray-50/80 rounded-sm border border-gray-200">
                                    {stages.map((stage, index) => {
                                        const isStageCompleted = stage.status === 'COMPLETED';
                                        const isStageActive = stage.status === 'ACTIVE';
                                        const isStageRejected = stage.status === 'REJECTED'; 

                                        let cardClasses = "border-gray-300 border-dashed bg-white";
                                        let headerClasses = "bg-gray-100 text-gray-600 border-gray-200";
                                        let stateBadge = "در انتظار";
                                        let badgeColor = "bg-gray-200 text-gray-700";

                                        if (isStageCompleted) {
                                            cardClasses = "border-green-500 bg-white shadow-sm";
                                            headerClasses = "bg-green-50 border-green-200 text-green-700";
                                            stateBadge = "تکمیل شده";
                                            badgeColor = "bg-green-500 text-white";
                                        } else if (isStageActive) {
                                            cardClasses = "border-blue-500 shadow-md shadow-blue-500/10 bg-white";
                                            headerClasses = "bg-blue-50 border-blue-200 text-blue-700";
                                            stateBadge = "در جریان";
                                            badgeColor = "bg-blue-500 text-white shadow-sm";
                                        } else if (isStageRejected) {
                                            cardClasses = "border-red-500 bg-white shadow-sm";
                                            headerClasses = "bg-red-50 border-red-200 text-red-700";
                                            stateBadge = "رد شده";
                                            badgeColor = "bg-red-500 text-white";
                                        }

                                        return (
                                            <React.Fragment key={stage.id}>
                                                <div className={`shrink-0 w-full sm:w-[240px] rounded-sm border-2 flex flex-col transition-all text-xs ${cardClasses}`}>
                                                    <div className={`p-2 sm:p-2.5 border-b flex justify-between items-center rounded-t-sm ${headerClasses}`}>
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className={`w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${badgeColor}`}>{stage.step_index || (index + 1)}</span>
                                                            <span className="font-bold text-[11px] sm:text-xs truncate" title={stage.stage_name}>{stage.stage_name || `مرحله ${stage.step_index || (index + 1)}`}</span>
                                                        </div>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${badgeColor}`}>{stateBadge}</span>
                                                    </div>

                                                    <div className="p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2.5 max-h-[260px] sm:max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                                                        {stage.description && (
                                                            <div className="flex items-start gap-1.5 px-2 py-1 sm:py-1.5 rounded-sm border text-[10px] sm:text-[11px] bg-white border-gray-200 text-gray-700">
                                                                <FaAlignRight className="text-gray-400 text-[10px] mt-0.5 shrink-0" />
                                                                <p className="leading-relaxed">{stage.description}</p>
                                                            </div>
                                                        )}
                                                        {stage.deadline && (
                                                            <div className="flex items-center justify-between sm:flex-col sm:items-stretch gap-1 p-1.5 sm:p-2 rounded-sm border bg-white border-gray-200">
                                                                <div className="flex items-center gap-1">
                                                                    <FaClock className={`${isStageActive ? 'text-orange-500' : 'text-gray-400'} text-[10px] sm:text-xs`} />
                                                                    <span className="text-[10px] sm:text-[11px] font-medium text-gray-700">مهلت:</span>
                                                                </div>
                                                                <div className="text-[10px] text-center font-medium text-gray-600" dir="ltr">{moment(stage.deadline).format('jYYYY/jMM/jDD - HH:mm')}</div>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-1.5">
                                                            {stage.require_file && (
                                                                <div className="flex-1 flex items-center justify-center gap-1 px-1 py-0.5 sm:py-1 rounded-sm border bg-yellow-50 border-yellow-200 text-yellow-700 text-[9px] sm:text-[10px] font-bold">
                                                                    <FaPaperclip size={8} /><span>الزام فایل</span>
                                                                </div>
                                                            )}
                                                            <div className="flex-1 flex items-center justify-center px-1 py-0.5 sm:py-1 rounded-sm border text-[9px] font-medium text-center bg-gray-100 border-gray-200 text-gray-700">
                                                                {stage.approval_rule === 'ALL_ASSIGNEES' ? 'تایید همه' : 'تایید یک نفر'}
                                                            </div>
                                                        </div>

                                                        {/* لیست مسئولین همراه با آواتار دایره‌ای */}
                                                        <div className="mt-0.5 sm:mt-1 flex-1 flex flex-col gap-1 sm:gap-1.5">
                                                            <span className="text-[9px] sm:text-[10px] font-bold border-b pb-0.5 sm:pb-1 border-gray-200 text-gray-600">مسئولین:</span>
                                                            {stage.assignees?.map((assignee, idx) => {
                                                                const cfg = STEP_STATE_CONFIG[assignee.state] || { label: assignee.state, color: 'text-gray-500', icon: <FaUser /> };
                                                                const isMe = Number(assignee.user || assignee.user_id) === Number(currentUserId);
                                                                
                                                                const empRecord = subordinates?.find(e => e.user_id === (assignee.user || assignee.user_id));
                                                                const avatarSrc = assignee.avatar_url || empRecord?.avatar_url;

                                                                return (
                                                                    <div key={assignee.id || idx} className={`flex flex-col gap-0.5 sm:gap-1 p-1 sm:p-1.5 rounded-sm border transition-colors ${isMe && assignee.state === 'PENDING' ? 'bg-blue-50 border-blue-400' : 'bg-white border-gray-200'}`}>
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <UserAvatar 
                                                                                    avatarUrl={avatarSrc} 
                                                                                    name={assignee.user_name} 
                                                                                    size="w-5 h-5 text-[8px] sm:w-6 sm:h-6 sm:text-[9px]"
                                                                                />
                                                                                <div className="flex flex-col min-w-0">
                                                                                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-800 truncate">{assignee.user_name || `کاربر ${assignee.user || assignee.user_id}`}</span>
                                                                                    <span className={`text-[8px] flex items-center gap-1 ${cfg.color}`}>
                                                                                        {cfg.icon}
                                                                                        <span>{cfg.label}</span>
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            {isMe && <span className="text-[8px] font-bold bg-blue-500 text-white px-1 py-0.5 rounded-sm">شما</span>}
                                                                        </div>
                                                                        {(assignee.acted_at || assignee.note) && (
                                                                            <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t text-[8px] border-gray-100 text-gray-500">
                                                                                {assignee.acted_at && <span>{new Date(assignee.acted_at).toLocaleDateString('fa-IR')}</span>}
                                                                                {assignee.note && <FaRegComment title={`یادداشت: ${assignee.note}`} className="text-blue-500 cursor-help" />}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* تاییدکنندگان میانی با آواتار */}
                                                {(index < stages.length - 1 || (stage.intermediate_approvers_details && stage.intermediate_approvers_details.length > 0)) && (
                                                    <div className="w-full sm:w-auto shrink-0 flex flex-col items-center justify-center self-center px-1 py-0.5 sm:py-0">
                                                        {stage.intermediate_approvers_details && stage.intermediate_approvers_details.length > 0 && (
                                                            <div className="flex flex-col items-center mb-1 sm:mb-1.5 gap-1">
                                                                <span className="text-[9px] font-bold text-indigo-700">{index === stages.length - 1 ? 'تایید نهایی:' : 'تایید میانی:'}</span>
                                                                <div className="flex flex-wrap sm:flex-col gap-1 items-center justify-center">
                                                                    {stage.intermediate_approvers_details.map((approver, i) => {
                                                                        const isApproverMe = Number(approver.id) === Number(currentUserId);
                                                                        let statusColor = "text-gray-500";
                                                                        let statusLabel = "در انتظار";
                                                                        if (approver.status === 'APPROVED') { statusColor = "text-green-600"; statusLabel = "تایید شد"; }
                                                                        else if (approver.status === 'REJECTED') { statusColor = "text-red-600"; statusLabel = "رد شد"; }
                                                                        else if (approver.status === 'PENDING') { statusColor = "text-blue-600"; statusLabel = "در انتظار"; }
                                                                        else if (approver.status === 'RETURNED') { statusColor = "text-orange-600"; statusLabel = "برگشت خورده"; }
                                                                        else if (approver.status === 'RESUBMITTED') { statusColor = "text-purple-600"; statusLabel = "اصلاح شده"; }
                                                                        else if (approver.status === 'FORWARDED') { statusColor = "text-teal-600"; statusLabel = "ارجاع شده"; }
                                                                        else if (approver.status === 'SKIPPED') { statusColor = "text-gray-400"; statusLabel = "گذر شده"; }

                                                                        const empApprover = subordinates?.find(e => e.user_id === approver.id);
                                                                        const approverAvatar = approver.avatar_url || empApprover?.avatar_url;

                                                                        return (
                                                                            <div key={approver.id || i} className={`flex flex-col items-start gap-0.5 px-1.5 py-1 rounded-sm border shadow-sm text-[9px] font-medium whitespace-nowrap bg-indigo-50 border-indigo-200 text-indigo-800 ${isApproverMe && approver.status === 'PENDING' ? 'border-blue-500 bg-blue-50' : ''}`}>
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <UserAvatar 
                                                                                        avatarUrl={approverAvatar} 
                                                                                        name={approver.name} 
                                                                                        size="w-4 h-4 text-[7px] sm:w-5 sm:h-5 sm:text-[8px]"
                                                                                    />
                                                                                    <span className="font-semibold">{approver.name || `کاربر ${approver.id}`}</span>
                                                                                    {isApproverMe && <span className="text-[7px] bg-blue-500 text-white px-1 rounded-sm">شما</span>}
                                                                                </div>
                                                                                <div className={`text-[8px] font-bold ${statusColor} pr-5 sm:pr-6`}>{statusLabel}</div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {index < stages.length - 1 && (
                                                            <>
                                                                <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-400 bg-white"><FaArrowLeft size={11} /></div>
                                                                <div className="flex sm:hidden items-center justify-center w-5 h-5 rounded-full border border-dashed border-gray-300 text-gray-400 bg-white"><FaArrowDown size={9} /></div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[11px] sm:text-xs p-2.5 sm:p-3 rounded-sm border bg-gray-50 border-gray-200 text-gray-500">مرحله‌ای برای گردش کار تعریف نشده است.</p>
                            )}
                        </div>

                        {/* ۳. فایل‌های پیوست اصلی در پاورقی برگه نامه */}
                        <div className="mt-4 sm:mt-8 pt-2.5 sm:pt-4 border-t border-dashed border-gray-400 shrink-0">
                            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                                <span className="text-[11px] sm:text-xs font-bold text-gray-700 flex items-center gap-1 sm:gap-1.5">
                                    <FaPaperclip className="text-blue-600" size={11} />
                                    فایل‌های ضمیمه اصلی ({files.length})
                                </span>

                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={uploadingFile} 
                                    className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200 transition-colors"
                                >
                                    {uploadingFile ? <FaSpinner className="animate-spin" size={9} /> : <FaUpload size={9} />}
                                    افزودن ضمیمه
                                </button>
                                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                            </div>

                            {files.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                                    {files.map(f => (
                                        <div key={f.id} className="flex items-center justify-between p-1.5 sm:p-2 rounded bg-gray-50 border border-gray-200 text-[11px] sm:text-xs">
                                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                                {FILE_ICONS[f.file_type] || <FaPaperclip className="text-gray-400 shrink-0" />}
                                                <span className="truncate max-w-[180px] sm:max-w-[150px] font-medium text-gray-800">{f.file?.split('/').pop()}</span>
                                            </div>
                                            <a href={f.file} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-blue-600 p-1 shrink-0">
                                                <FaDownload size={11} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[10px] sm:text-[11px] text-gray-400 italic">فایلی ضمیمه نشده است.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── تاریخچه سیستمی (همراه با عکس نویسنده لاگ) ── */}
                <div>
                    <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4 px-1 sm:px-0 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}><FaClock size={11} className="text-green-500" /></div>
                        تاریخچه سیستمی
                    </h3>
                    {!logs?.length ? (
                        <p className={`text-xs sm:text-sm p-3 sm:p-4 rounded-sm border ${isDark ? 'text-gray-500 bg-slate-900 border-slate-800' : 'text-gray-500 bg-gray-50 border-gray-200'}`}>رویدادی ثبت نشده است.</p>
                    ) : (
                        <div className={`rounded-sm p-2.5 sm:p-4 border space-y-2.5 sm:space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                            {logs.map((log, index) => {
                                const actorDisplayName = log.actor_name || (log.actor_id ? `کاربر ${log.actor_id}` : 'کاربر نامشخص');
                                const logDate = log.created_at ? new Date(log.created_at) : null;
                                const isValidDate = logDate && !isNaN(logDate.getTime());
                                
                                const actorEmp = subordinates?.find(e => e.user_id === log.actor_id);

                                return (
                                    <div key={log.id || index} className={`flex items-start gap-2 sm:gap-3 text-xs sm:text-sm ${index !== logs.length - 1 ? `pb-2.5 sm:pb-3 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}` : ''}`}>
                                        <UserAvatar 
                                            avatarUrl={actorEmp?.avatar_url} 
                                            name={actorDisplayName} 
                                            size="w-6 h-6 text-[9px] sm:w-7 sm:h-7 sm:text-[10px]"
                                            className="mt-0.5"
                                        />
                                        <div className={`flex-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                            <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{actorDisplayName}</span>
                                            {' '}
                                            <span className="text-blue-500">{ACTION_LABELS[log.action] || log.action}</span>
                                            {log.note && <span className="text-gray-500 italic"> — "{log.note}"</span>}
                                            <div className="text-[10px] sm:text-[11px] text-gray-500 mt-0.5 sm:mt-1">
                                                {isValidDate 
                                                    ? logDate.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit', year: 'numeric', month: 'numeric', day: 'numeric' })
                                                    : 'لحظاتی پیش'}
                                            </div>

                                            {log.files && log.files.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                                                    {log.files.map(f => (
                                                        <a key={f.id} href={f.file} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded-sm border dark:border-slate-700 text-[10px] hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                                            {FILE_ICONS[f.file_type] || <FaPaperclip className="text-gray-400" />}
                                                            <span className="text-blue-500 dark:text-blue-400 truncate max-w-[120px]">{f.file?.split('/').pop()}</span>
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── ثبت یادداشت و پیامک ── */}
                <div className={`rounded-sm p-2.5 sm:p-4 border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                    <h3 className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 mb-2.5 sm:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-sm flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}><FaRegComment size={11} className="text-indigo-400" /></div>
                        ثبت یادداشت
                    </h3>

                    {commentError && (
                        <div className="p-2 mb-2.5 sm:mb-3 rounded text-[11px] sm:text-xs bg-red-500/10 border border-red-500/30 text-red-500">
                            {commentError}
                        </div>
                    )}

                    {commentSuccess && (
                        <div className="p-2 mb-2.5 sm:mb-3 rounded text-[11px] sm:text-xs bg-green-500/10 border border-green-500/30 text-green-500">
                            یادداشت شما با موفقیت ثبت شد.
                        </div>
                    )}

                    {commentFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2.5 sm:mb-3">
                            {commentFiles.map((f, i) => (
                                <div key={i} className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-sm border ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
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
                        className={`w-full rounded-sm px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border focus:outline-none focus:border-blue-500 resize-none mb-2 sm:mb-3 ${isDark ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'}`}
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

                    <div className="flex gap-1.5 sm:gap-2">
                        <button onClick={handleAddComment} disabled={addingComment || (!commentNote.trim() && commentFiles.length === 0)} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm py-2 sm:py-2.5 rounded-sm transition-colors font-medium flex items-center justify-center gap-1.5 sm:gap-2">
                            {addingComment ? <FaSpinner className="animate-spin" size={13} /> : <FaPaperPlane size={11} />} ثبت یادداشت
                        </button>

                        <button
                            type="button"
                            onClick={() => commentFileRef.current?.click()}
                            title="ضمیمه فایل به یادداشت"
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-sm transition-colors flex items-center justify-center border ${isDark ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                            <FaPaperclip className="text-sm sm:text-lg" />
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowContactModal(true)}
                            title="ضمیمه کردن شماره تماس پرسنل"
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-sm transition-colors flex items-center justify-center border ${isDark ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                            <FaAddressCard className="text-sm sm:text-lg" />
                        </button>
                    </div>
                </div>

                <TaskSmsSection assignLogs={taskData.assign_sms_logs} reminderLogs={taskData.reminder_sms_logs} onRefresh={onRefresh} />
            </div>

            {modal === 'approve' && <ConfirmModal title="تایید و خاتمه مرحله" message={pendingActionContext.require_file ? `آیا از ارسال فایل‌های لازم اطمینان دارید؟ با تایید، این مرحله خاتمه می‌یابد.` : `با تایید این مرحله، مسئولیت شما به پایان می‌رسد.`} confirmLabel="تایید و ثبت" confirmClass="bg-green-600 hover:bg-green-700" onConfirm={handleApprove} onClose={() => setModal(null)} />}
            {modal === 'reject' && <ConfirmModal title="رد کردن ماموریت" message={`آیا از رد کردن این گردش کار اطمینان دارید؟`} confirmLabel="تایید و رد ماموریت" confirmClass="bg-red-600 hover:bg-red-700" onConfirm={handleReject} onClose={() => setModal(null)} />}
            {modal === 'forward' && <ForwardModal taskId={task.id} onSuccess={() => { setModal(null); if (onRefresh) onRefresh(); }} onClose={() => setModal(null)} />}
            {modal === 'return' && <ReturnModal title="برگشت دادن به مجریان" assignees={stages.find(s => s.status === 'ACTIVE')?.assignees || []} onConfirm={handleReturn} onClose={() => setModal(null)} />}

            {/* ── 🌟 مودال ویرایش کامل پرونده و گردش کار به صورت استپر چند مرحله‌ای ── */}
            {showEditModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-1.5 sm:p-2 md:p-4" dir="rtl">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                    
                    <div className={`relative flex flex-col md:flex-row w-full max-w-[98vw] lg:max-w-[1200px] h-[96dvh] md:h-[92dvh] rounded-2xl overflow-hidden shadow-2xl border-[2px] ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-gray-50 border-blue-500'}`}>
                        
                        {/* بخش فرم ویرایش اصلی */}
                        <div className={`flex flex-col flex-1 overflow-hidden ${pickerOpenMobile ? 'hidden md:flex' : 'flex'}`}>
                           
                           {/* هدر و استپر مراحل ویرایش */}
                           <div className={`px-3 md:px-6 py-2.5 md:py-4 border-b shrink-0 z-20 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                             <div className="flex items-center justify-between mb-2.5 md:mb-4">
                               <h3 className={`font-bold text-xs md:text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                 <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500"><FaEdit size={12} /></div>
                                 ویرایش کامل پرونده و گردش کار
                               </h3>
                               <button onClick={() => setShowEditModal(false)} disabled={editingTask} className={`p-1.5 md:p-2 rounded-full transition border ${isDark ? 'text-gray-400 hover:text-white border-slate-700 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100 border-gray-200'}`}><FaTimes size={12} /></button>
                             </div>

                             {/* گوی‌های خط زمانی ویرایش */}
                             <div className="flex items-center justify-between relative max-w-sm mx-auto px-2">
                               <div className={`absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 z-0 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                               
                               <div onClick={() => setCurrentEditStep(1)} className="relative z-10 flex flex-col items-center cursor-pointer">
                                 <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[11px] md:text-xs transition-all ${
                                   currentEditStep === 1 ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : currentEditStep > 1 ? 'bg-green-600 text-white' : isDark ? 'bg-slate-800 text-gray-400 border border-slate-700' : 'bg-gray-200 text-gray-600'
                                 }`}>
                                   {currentEditStep > 1 ? <FaCheck size={9} /> : '۱'}
                                 </div>
                                 <span className={`text-[9px] md:text-[11px] font-medium mt-1 ${currentEditStep === 1 ? 'text-blue-500 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>پایه</span>
                               </div>

                               <div onClick={() => validateEditStep(1) && setCurrentEditStep(2)} className="relative z-10 flex flex-col items-center cursor-pointer">
                                 <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[11px] md:text-xs transition-all ${
                                   currentEditStep === 2 ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : currentEditStep > 2 ? 'bg-green-600 text-white' : isDark ? 'bg-slate-800 text-gray-400 border border-slate-700' : 'bg-gray-200 text-gray-600'
                                 }`}>
                                   {currentEditStep > 2 ? <FaCheck size={9} /> : '۲'}
                                 </div>
                                 <span className={`text-[9px] md:text-[11px] font-medium mt-1 ${currentEditStep === 2 ? 'text-blue-500 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>مراحل</span>
                               </div>

                               <div onClick={() => (validateEditStep(1) && validateEditStep(2)) && setCurrentEditStep(3)} className="relative z-10 flex flex-col items-center cursor-pointer">
                                 <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[11px] md:text-xs transition-all ${
                                   currentEditStep === 3 ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : isDark ? 'bg-slate-800 text-gray-400 border border-slate-700' : 'bg-gray-200 text-gray-600'
                                 }`}>
                                   ۳
                                 </div>
                                 <span className={`text-[9px] md:text-[11px] font-medium mt-1 ${currentEditStep === 3 ? 'text-blue-500 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>وضعیت و پیامک</span>
                               </div>
                             </div>
                           </div>
                           
                           {/* بدنه اسکرول‌شونده ویرایش */}
                           <div dir="ltr" className={`flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? '[&::-webkit-scrollbar-thumb]:bg-slate-700' : '[&::-webkit-scrollbar-thumb]:bg-gray-300'}`}>
                             <div dir="rtl" className="p-2.5 md:p-6 space-y-3 md:space-y-6 min-h-full">

                               {/* تب 1 ویرایش: اطلاعات پایه */}
                               {currentEditStep === 1 && (
                                 <div className={`p-3.5 md:p-5 rounded-2xl border space-y-3.5 md:space-y-4 animate-fadeIn ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                     <div className="flex items-center gap-2 pb-2 border-b border-gray-700/30">
                                         <FaInfoCircle className="text-blue-500" size={14} />
                                         <h4 className={`font-bold text-xs md:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>مشخصات اصلی پرونده</h4>
                                     </div>

                                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                                         <div className="lg:col-span-1">
                                             <label className={`block text-xs mb-1 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>عنوان ماموریت <span className="text-red-400">*</span></label>
                                             <input 
                                                 type="text" 
                                                 value={editData.title} 
                                                 onChange={e => { setEditData({...editData, title: e.target.value}); setValidationErrors(prev => ({...prev, title: ''})); }} 
                                                 className={`w-full rounded-xl px-3 py-2 md:py-3 text-xs md:text-sm border focus:outline-none focus:border-blue-500 ${validationErrors.title ? 'border-red-500' : ''} ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`} 
                                             />
                                             {validationErrors.title && <p className="text-[10px] text-red-400 mt-1">{validationErrors.title}</p>}
                                         </div>

                                         <div>
                                             <label className={`block text-xs mb-1 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>نوع ماموریت <span className="text-red-400">*</span></label>
                                             <select 
                                                 value={editData.task_type} 
                                                 onChange={e => { setEditData({...editData, task_type: e.target.value}); setValidationErrors(prev => ({...prev, taskType: ''})); }} 
                                                 className={`w-full rounded-xl px-3 py-2 md:py-3 text-xs md:text-sm border focus:outline-none focus:border-blue-500 ${validationErrors.taskType ? 'border-red-500' : ''} ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                                             >
                                                 <option value="">بدون دسته‌بندی</option>
                                                 {taskTypes?.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                             </select>
                                             {validationErrors.taskType && <p className="text-[10px] text-red-400 mt-1">{validationErrors.taskType}</p>}
                                         </div>

                                         <div>
                                             <label className={`block text-xs mb-1 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>سطح فوریت</label>
                                             <select 
                                                 value={editData.urgency} 
                                                 onChange={e => setEditData({...editData, urgency: e.target.value})} 
                                                 className={`w-full rounded-xl px-3 py-2 md:py-3 text-xs md:text-sm border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                                             >
                                                 <option value="LOW">کم</option>
                                                 <option value="MEDIUM">متوسط</option>
                                                 <option value="HIGH">زیاد</option>
                                                 <option value="CRITICAL">بحرانی</option>
                                             </select>
                                         </div>
                                     </div>

                                     <div>
                                         <label className={`block text-xs mb-1 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>توضیحات کلی</label>
                                         <textarea 
                                             rows={3}
                                             value={editData.note} 
                                             onChange={e => setEditData({...editData, note: e.target.value})} 
                                             className={`w-full rounded-xl px-3 py-2 text-xs md:text-sm border outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`} 
                                         />
                                     </div>
                                 </div>
                               )}

                               {/* تب 2 ویرایش: طراحی مراحل و پرسنل */}
                               {currentEditStep === 2 && (
                                 <div className="space-y-3 animate-fadeIn">
                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-500/10 border border-blue-500/30 p-2.5 md:p-3 rounded-xl">
                                       <h4 className={`font-bold text-xs md:text-sm flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                           <FaSitemap /> طراحی و مدیریت مراحل گردش کار
                                       </h4>
                                       <button
                                         type="button"
                                         onClick={() => setPickerOpenMobile(true)}
                                         className="md:hidden flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                                       >
                                         <FaUserPlus size={11} />
                                         <span>انتخاب پرسنل برای این مرحله</span>
                                       </button>
                                     </div>

                                     <div className={`w-full overflow-x-auto pb-4 pt-2 px-2.5 md:px-3 flex items-start gap-2.5 md:gap-3 min-h-[360px] ${isDark ? 'bg-slate-900/50 rounded-2xl border border-slate-800' : 'bg-gray-100/50 rounded-2xl border border-gray-200'}`}>
                                         {editStages.map((stage, index) => (
                                             <React.Fragment key={stage.id}>
                                                 <div
                                                     onClick={() => setActiveEditElement({ id: stage.id, type: 'STAGE' })}
                                                     className={`shrink-0 w-[240px] md:w-[290px] rounded-2xl border-2 flex flex-col cursor-pointer shadow-md transition-all
                                                     ${activeEditElement.id === stage.id && activeEditElement.type === 'STAGE'
                                                         ? 'border-blue-500 shadow-blue-500/20 ' + (isDark ? 'bg-slate-800' : 'bg-white') 
                                                         : 'border-slate-600/50 ' + (isDark ? 'bg-slate-800/60' : 'bg-white')}`}
                                                 >
                                                     <div className="p-2 md:p-3 border-b border-slate-700/50 flex justify-between items-center bg-black/5 rounded-t-xl">
                                                         <span className={`text-xs md:text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مرحله {index + 1}</span>
                                                         {editStages.length > 1 && (
                                                             <button onClick={(e) => { e.stopPropagation(); handleRemoveEditStage(stage.id); }} className="text-red-400 hover:text-red-500 p-1"><FaTrash size={11} /></button>
                                                         )}
                                                     </div>

                                                     <div className="p-2.5 md:p-4 flex flex-col gap-2.5 md:gap-3 max-h-[340px] md:max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:w-1">
                                                         <input 
                                                             type="text" value={stage.stageName} onChange={e => updateEditStageField(stage.id, 'stageName', e.target.value)}
                                                             placeholder="نام مرحله..." className={`w-full text-xs md:text-sm font-bold pb-1 border-b outline-none bg-transparent ${isDark ? 'text-white border-slate-600' : 'text-gray-900 border-gray-300'}`} 
                                                         />
                                                         <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                                             <FaAlignRight className="text-[10px]" />
                                                             <input 
                                                                 type="text" value={stage.description} onChange={e => updateEditStageField(stage.id, 'description', e.target.value)}
                                                                 placeholder="شرح وظیفه..." className="w-full text-[11px] md:text-xs outline-none bg-transparent"
                                                             />
                                                         </div>
                                                         <div className="flex gap-1.5">
                                                             <label className={`flex-1 flex items-center justify-center px-1.5 py-1.5 rounded-xl border text-[10px] md:text-[11px] font-bold cursor-pointer select-none ${stage.requireFile ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : isDark ? 'bg-slate-900/50 border-slate-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                                 <input type="checkbox" checked={stage.requireFile} onChange={e => updateEditStageField(stage.id, 'requireFile', e.target.checked)} className="hidden" />
                                                                 <FaPaperclip size={9} className="mr-1" /><span>فایل اجباری</span>
                                                             </label>
                                                             <select value={stage.approvalRule} onChange={e => updateEditStageField(stage.id, 'approvalRule', e.target.value)} className={`flex-1 text-[10px] md:text-[11px] p-1.5 rounded-xl border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'}`}>
                                                                 {APPROVAL_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                             </select>
                                                         </div>

                                                         {isAdminOrBoard && (
                                                             <div className="flex flex-col gap-1">
                                                                 <span className="text-[10px] md:text-[11px] font-bold text-gray-500">وضعیت کل مرحله:</span>
                                                                 <select 
                                                                     value={stage.status} 
                                                                     onChange={e => updateEditStageField(stage.id, 'status', e.target.value)}
                                                                     className={`w-full text-[10px] md:text-[11px] px-2 py-1.5 rounded-xl border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}
                                                                 >
                                                                     <option value="PENDING">در صف انتظار</option>
                                                                     <option value="ACTIVE">در حال انجام (فعال)</option>
                                                                     <option value="COMPLETED">تکمیل شده</option>
                                                                     <option value="REJECTED">رد شده</option>
                                                                 </select>
                                                             </div>
                                                         )}

                                                         <div className={`flex flex-col gap-1.5 p-2 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                           <div className="flex items-center gap-1.5">
                                                             <FaClock className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                                             <span className={`text-[10px] md:text-[11px] font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مهلت انجام</span>
                                                           </div>
                                                           <div className="flex gap-1.5">
                                                             <div className="flex-1">
                                                                 <JalaliDatePicker
                                                                     value={stage.deadlineDate}
                                                                     onChange={(e) => updateEditStageField(stage.id, 'deadlineDate', e.target ? e.target.value : e)}
                                                                     placeholder="تاریخ"
                                                                     inputClassName={`w-full text-[10px] md:text-[11px] p-1.5 rounded-lg outline-none border ${isDark ? 'bg-slate-700 border-slate-600 placeholder:text-slate-400' : 'bg-gray-100 border-gray-300'}`}
                                                                     modal={true}
                                                                 />
                                                             </div>
                                                             <input 
                                                                 type="time" 
                                                                 value={stage.deadlineTime} 
                                                                 onChange={(e) => updateEditStageField(stage.id, 'deadlineTime', e.target.value)} 
                                                                 className={`w-[66px] md:w-[70px] text-[10px] md:text-[11px] p-1.5 rounded-lg outline-none border ${isDark ? 'bg-slate-700 border-slate-600 [color-scheme:dark]' : 'bg-gray-100 border-gray-300'}`}
                                                             />
                                                           </div>
                                                         </div>

                                                         <div className="mt-1 flex-1 flex flex-col gap-1.5">
                                                             <span className="text-[10px] md:text-[11px] font-bold text-gray-500">مسئولین و وضعیت فردی:</span>
                                                             {stage.assignees.length === 0 ? (
                                                                 <div className="flex-1 min-h-[40px] flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-500/30 rounded-xl p-2">بدون مسئول</div>
                                                             ) : (
                                                                 <div className="flex flex-col gap-1.5">
                                                                     {stage.assignees.map(empId => {
                                                                         const emp = subordinates?.find(e => e.user_id === empId);
                                                                         return (
                                                                             <div key={empId} className={`flex items-center justify-between p-1.5 rounded-xl border gap-1 ${isDark ? 'bg-slate-900/80 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                                                 <div className="flex items-center gap-1 min-w-0 flex-1">
                                                                                     <Avatar emp={emp || { name: `کاربر ${empId}`, user_id: empId }} size="sm" />
                                                                                     <span className="text-[11px] font-bold truncate">{emp?.name || `کاربر ${empId}`}</span>
                                                                                 </div>
                                                                                 {isAdminOrBoard ? (
                                                                                     <select
                                                                                         value={stage.assigneeStates?.[empId] || 'PENDING'}
                                                                                         onChange={(e) => updateAssigneeState(stage.id, empId, e.target.value)}
                                                                                         onClick={(e) => e.stopPropagation()}
                                                                                         className={`text-[9px] font-semibold py-0.5 px-1 rounded-lg border outline-none ${
                                                                                             isDark ? 'bg-slate-800 text-gray-200 border-slate-600' : 'bg-white text-gray-800 border-gray-300'
                                                                                         }`}
                                                                                     >
                                                                                         {ASSIGNEE_STATE_OPTIONS.map(opt => (
                                                                                             <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                                         ))}
                                                                                     </select>
                                                                                 ) : (
                                                                                     <span className="text-[9px] text-gray-400 font-medium">
                                                                                         {ASSIGNEE_STATE_OPTIONS.find(o => o.value === (stage.assigneeStates?.[empId] || 'PENDING'))?.label}
                                                                                     </span>
                                                                                 )}
                                                                                 <button
                                                                                     type="button"
                                                                                     onClick={(e) => { e.stopPropagation(); handleRemoveEditAssignee(stage.id, 'STAGE', empId); }}
                                                                                     className="text-red-400 hover:text-red-500 p-1"
                                                                                 >
                                                                                     <FaTimes size={9} />
                                                                                 </button>
                                                                             </div>
                                                                         );
                                                                     })}
                                                                 </div>
                                                             )}
                                                             {validationErrors[`stage_${stage.id}`] && <p className="text-[10px] text-red-400 text-center">{validationErrors[`stage_${stage.id}`]}</p>}
                                                         </div>
                                                     </div>
                                                 </div>

                                                 <div className="shrink-0 flex items-center justify-center px-0.5 self-center">
                                                     <div 
                                                         onClick={() => setActiveEditElement({ id: stage.id, type: 'LINK' })}
                                                         className={`w-32 md:w-42 min-h-[130px] rounded-2xl border-2 flex flex-col items-center p-2 cursor-pointer transition-all ${
                                                             activeEditElement.id === stage.id && activeEditElement.type === 'LINK'
                                                             ? 'border-orange-500 bg-orange-500/10 shadow-md' : 'border-dashed border-orange-500/50 bg-orange-500/5'
                                                         }`}
                                                     >
                                                         <span className="text-[10px] md:text-[11px] font-bold text-orange-500 mb-1 text-center">تاییدیه (اختیاری)</span>
                                                         <select value={stage.approverRule} onChange={(e) => updateEditStageField(stage.id, 'approverRule', e.target.value)} onClick={e => e.stopPropagation()} className={`w-full text-[9px] md:text-[10px] p-1 mb-2 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                                             {APPROVER_RULES.map(rule => <option key={rule.value} value={rule.value}>{rule.label}</option>)}
                                                         </select>

                                                         <div className="flex-1 flex flex-col gap-1 w-full items-center justify-center">
                                                             {stage.nextStageApprovers.length === 0 ? (
                                                                 <div className="text-orange-500/40 flex flex-col items-center"><FaArrowLeft size={14} className="mb-0.5" /><span className="text-[9px] md:text-[10px]">مستقیم</span></div>
                                                             ) : (
                                                                 <div className="w-full flex flex-wrap gap-1 items-center justify-center">
                                                                     {stage.nextStageApprovers.map(empId => {
                                                                         const emp = subordinates?.find(e => e.user_id === empId);
                                                                         return emp ? <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveEditAssignee(stage.id, 'LINK', id)} /> : <span key={empId} className="text-xs">کاربر {empId}</span>;
                                                                     })}
                                                                     <FaArrowLeft size={11} className="text-orange-500 mt-1" />
                                                                 </div>
                                                             )}
                                                         </div>
                                                     </div>
                                                 </div>
                                             </React.Fragment>
                                         ))}

                                         <div className="shrink-0 flex items-center pl-1 self-stretch">
                                             <button onClick={handleAddEditStage} className={`w-[60px] md:w-[70px] h-full min-h-[260px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${isDark ? 'border-slate-700 hover:border-blue-500 text-slate-500 bg-slate-800/30' : 'border-gray-300 hover:border-blue-500 text-gray-400 bg-white'}`}>
                                                 <FaPlus size={18} />
                                                 <span className="text-[10px] md:text-[11px] font-bold text-center">افزودن<br/>مرحله</span>
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                               )}

                               {/* تب 3 ویرایش: وضعیت کلی، مهلت و پیامک */}
                               {currentEditStep === 3 && (
                                 <div className={`p-3.5 md:p-5 rounded-2xl border space-y-4 md:space-y-5 animate-fadeIn ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                     <div className="flex items-center gap-2 pb-2 border-b border-gray-700/30">
                                         <FaCog className="text-blue-500" size={14} />
                                         <h4 className={`font-bold text-xs md:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>وضعیت پرونده، ددلاین کلی و پیامک</h4>
                                     </div>

                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 md:gap-4">
                                         <div>
                                             <label className={`text-xs font-bold mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                 وضعیت کلی پرونده {isAdminOrBoard ? '' : '(فقط مدیران)'}
                                             </label>
                                             <select 
                                                 value={editData.status} 
                                                 onChange={e => setEditData({...editData, status: e.target.value})} 
                                                 disabled={!isAdminOrBoard}
                                                 className={`w-full p-2.5 md:p-3 text-xs md:text-sm rounded-xl border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'} ${!isAdminOrBoard ? 'opacity-50 cursor-not-allowed' : ''}`}
                                             >
                                                 <option value="PENDING">در انتظار انجام</option>
                                                 <option value="IN_PROGRESS">در حال انجام</option>
                                                 <option value="DONE">انجام شده</option>
                                                 <option value="REJECTED">رد شده</option>
                                                 <option value="CANCELLED">لغو شده</option>
                                             </select>
                                         </div>

                                         <div>
                                             <label className={`text-xs font-bold mb-1.5 block flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                 <FaClock /> مهلت نهایی کلی پرونده
                                             </label>
                                             <div className="flex gap-2">
                                                 <div className={`flex-1 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                                                     <JalaliDatePicker
                                                         value={editData.deadlineDate}
                                                         onChange={(e) => setEditData({...editData, deadlineDate: e.target ? e.target.value : e})}
                                                         placeholder="تاریخ"
                                                         inputClassName="w-full px-3 py-2 md:py-2.5 text-xs outline-none bg-transparent"
                                                         modal={true}
                                                     />
                                                 </div>
                                                 <input 
                                                     type="time" 
                                                     value={editData.deadlineTime} 
                                                     onChange={e => setEditData({...editData, deadlineTime: e.target.value})} 
                                                     className={`w-24 px-2 py-2 md:py-2.5 text-xs rounded-xl border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 [color-scheme:dark]' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                                                 />
                                             </div>
                                         </div>
                                     </div>

                                     {/* تاگل ارسال پیامک */}
                                     <div
                                         onClick={() => setEditSendSms(v => !v)}
                                         className={`flex items-center justify-between p-3 md:p-4 rounded-xl border cursor-pointer transition-all ${
                                             editSendSms
                                                 ? 'bg-green-500/10 border-green-500/50'
                                                 : isDark
                                                 ? 'bg-slate-800 border-slate-700'
                                                 : 'bg-gray-50 border-gray-200'
                                         }`}
                                     >
                                         <div>
                                             <div className={`text-xs md:text-sm font-bold ${editSendSms ? 'text-green-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                                 ارسال مجدد پیامک اطلاع‌رسانی
                                             </div>
                                             <div className={`text-[10px] md:text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                 ارسال پیامک یادآوری/اطلاع‌رسانی به مسئولین مرحله فعال
                                             </div>
                                         </div>
                                         <div className={`w-10 h-5 md:w-11 md:h-6 rounded-full transition-colors relative flex-shrink-0 ${editSendSms ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
                                             <div className={`absolute top-0.5 md:top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${editSendSms ? 'left-0.5 md:left-1' : 'right-0.5 md:right-1'}`} />
                                         </div>
                                     </div>
                                 </div>
                               )}

                             </div>
                           </div>

                           {/* فوتر دکمه‌های ناوبری ویرایش */}
                           <div className={`px-3 md:px-6 py-2.5 md:py-4 border-t flex items-center justify-between gap-2.5 shrink-0 z-10 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                             {currentEditStep > 1 ? (
                               <button type="button" onClick={handleEditPrev} className={`w-20 md:w-28 rounded-xl py-2 md:py-3 text-xs md:text-sm font-medium border transition-colors ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                 مرحله قبل
                               </button>
                             ) : (
                               <button type="button" onClick={() => setShowEditModal(false)} className={`w-20 md:w-28 rounded-xl py-2 md:py-3 text-xs md:text-sm font-medium border transition-colors ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                 انصراف
                               </button>
                             )}

                             {currentEditStep < 3 ? (
                               <button type="button" onClick={handleEditNext} className="flex-1 max-w-[160px] md:max-w-[200px] rounded-xl py-2 md:py-3 text-xs md:text-sm font-bold transition-all bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                                 <span>مرحله بعد</span>
                                 <FaArrowLeft size={10} />
                               </button>
                             ) : (
                               <button onClick={submitEditTask} disabled={editingTask} className="flex-1 max-w-[180px] md:max-w-[220px] rounded-xl py-2 md:py-3 text-xs md:text-sm font-bold transition-all bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                                   {editingTask ? <><FaSpinner className="animate-spin" /> در حال ذخیره...</> : <><FaCheck size={12} /> تایید و ثبت تغییرات</>}
                               </button>
                             )}
                           </div>
                        </div>
                        
                        {/* 🌟 پنل سمت راست انتخابگر پرسنل در حالت ویرایش */}
                        <div className={`w-full h-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-r z-20 shadow-lg transition-all ${
                          currentEditStep === 2 ? (pickerOpenMobile ? 'flex absolute inset-0 md:relative' : 'hidden md:flex') : 'hidden'
                        } ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                          <div className="flex flex-col w-full h-full">
                            {pickerOpenMobile && (
                              <div className="md:hidden p-2.5 border-b flex items-center justify-between bg-blue-600 text-white">
                                <span className="text-xs font-bold">انتخاب پرسنل (مرحله جاری)</span>
                                <button onClick={() => setPickerOpenMobile(false)} className="p-1 bg-white/20 rounded-lg">
                                  <FaTimes size={13} />
                                </button>
                              </div>
                            )}
                            <div className="flex-1 overflow-hidden">
                              <AssigneePickerPanel
                                subordinates={subordinates || []}
                                loading={loadingSubordinates}
                                selectedIds={activeEditSelectedIds}
                                onChange={handleEditAssigneeChange}
                                onClose={() => setPickerOpenMobile(false)}
                                activeStageName={getActiveStageNameForEditPicker()}
                              />
                            </div>
                          </div>
                        </div>

                    </div>
                </div>
            )}

            {showContactModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-sm flex flex-col h-[460px] sm:h-[500px] rounded-sm shadow-xl overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                        <div className={`p-3 sm:p-4 border-b flex justify-between items-center ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                            <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>ضمیمه اطلاعات تماس</h3>
                            <button onClick={() => { setShowContactModal(false); setContactSelectedIds([]); }} className="text-gray-500 hover:text-red-500 transition-colors"><FaTimes /></button>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            <AssigneePickerPanel subordinates={subordinates || []} loading={loadingSubordinates} selectedIds={contactSelectedIds} onChange={setContactSelectedIds} />
                        </div>
                        <div className={`p-2.5 sm:p-3 border-t flex gap-2 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                            <button onClick={handleAppendContacts} disabled={contactSelectedIds.length === 0} className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-500 disabled:cursor-not-allowed text-white py-2 sm:py-2.5 rounded-sm text-xs sm:text-sm font-medium transition-colors">تایید و درج در متن</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 🌟 پنل شیشه‌ای فریز قالب ── */}
            {templateModal && isAdminOrBoard && (
                <div className="fixed inset-0 z-[99999] pointer-events-none flex items-end md:items-center justify-center md:justify-end p-2 md:p-6 bg-black/10">
                    <div className={`pointer-events-auto w-full md:w-96 max-h-[82vh] md:max-h-[90vh] p-3.5 md:p-5 shadow-2xl rounded-2xl md:rounded-3xl flex flex-col justify-between overflow-y-auto border-2 md:border-4 transition-all duration-300 backdrop-blur-md ${
                        isDark 
                            ? 'bg-slate-900/75 border-cyan-400 text-white shadow-cyan-950/40' 
                            : 'bg-white/75 border-cyan-500 text-gray-900 shadow-cyan-500/20'
                    }`}>
                        <div>
                            {/* هدر پنل فریز شیشه‌ای */}
                            <div className="flex items-center justify-between mb-3 pb-2.5 border-b-2 border-cyan-500/40">
                                <h3 className="text-xs md:text-sm font-black flex items-center gap-2 text-cyan-400 tracking-wide uppercase">
                                    <FaSnowflake className="text-cyan-400" /> پنل مدیریت فریز قالب
                                </h3>
                                <button onClick={() => setTemplateModal(false)} className="p-1.5 rounded-xl bg-transparent border-2 border-cyan-500/60 text-cyan-400 hover:bg-cyan-500/20 font-bold transition-colors">
                                    <FaTimes size={12} />
                                </button>
                            </div>

                            <p className="text-[10px] md:text-[11px] font-bold opacity-90 mb-3 leading-relaxed">
                                با فعال‌سازی هر چک‌باکس، بخش مربوطه روی برگه A4 زیرین به صورت <strong className="text-cyan-400 font-black">یخی و قفل‌شده</strong> نمایش داده می‌شود:
                            </p>

                            <div className="space-y-1.5 md:space-y-2 mb-4">
                                <input 
                                    type="text" 
                                    placeholder="نام قالب (مثلا: فرآیند خرید انبار)..." 
                                    value={templateName} 
                                    onChange={(e) => setTemplateName(e.target.value)} 
                                    className={`w-full rounded-xl px-3 py-2 md:px-4 md:py-3 text-xs font-black border-2 outline-none transition-all ${
                                        isDark 
                                            ? 'bg-transparent border-cyan-400/70 text-white placeholder-gray-300 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30' 
                                            : 'bg-transparent border-cyan-600 text-gray-900 placeholder-gray-600 focus:border-cyan-700 focus:ring-2 focus:ring-cyan-500/30'
                                    }`} 
                                />

                                {[
                                    { key: 'title', label: 'فریز موضوع (عنوان ماموریت)' },
                                    { key: 'task_type', label: 'فریز نوع و دسته‌بندی' },
                                    { key: 'urgency', label: 'فریز سطح فوریت' },
                                    { key: 'note', label: 'فریز توضیحات متنی (Note)' },
                                    { key: 'stages', label: 'فریز ساختار مراحل (Workflow)' },
                                ].map(item => (
                                    <label key={item.key} className={`flex items-center justify-between p-2.5 md:p-3 rounded-xl border-2 transition-all cursor-pointer font-black text-[11px] md:text-xs ${
                                        freezeOptions[item.key] 
                                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                                            : isDark ? 'bg-transparent border-slate-600 text-gray-300' : 'bg-transparent border-gray-400 text-gray-700'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <FaLock size={11} className={freezeOptions[item.key] ? 'text-cyan-400' : 'text-gray-400'} />
                                            <span>{item.label}</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={freezeOptions[item.key]} 
                                            onChange={(e) => setFreezeOptions({...freezeOptions, [item.key]: e.target.checked})} 
                                            className="w-4 h-4 rounded text-cyan-500 accent-cyan-500 cursor-pointer" 
                                        />
                                    </label>
                                ))}

                                {freezeOptions.stages && (
                                    <label className={`flex items-center justify-between p-2.5 md:p-3 mr-3 rounded-xl border-2 transition-all cursor-pointer font-black text-[11px] md:text-xs ${
                                        freezeOptions.assignees 
                                            ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                            : isDark ? 'bg-transparent border-slate-600 text-gray-300' : 'bg-transparent border-gray-400 text-gray-700'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <FaSnowflake size={10} className={freezeOptions.assignees ? 'text-blue-400' : 'text-gray-400'} />
                                            <span className="text-[10px] md:text-[11px]">حفظ پرسنل انتصاب‌شده در مراحل</span>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            checked={freezeOptions.assignees} 
                                            onChange={(e) => setFreezeOptions({...freezeOptions, assignees: e.target.checked})} 
                                            className="w-4 h-4 rounded text-blue-500 accent-blue-500 cursor-pointer" 
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* دکمه‌های شیشه‌ای پایینی */}
                        <div className="flex gap-2 pt-2.5 border-t-2 border-cyan-500/40">
                            <button 
                                onClick={handleSaveAsTemplate} 
                                disabled={freezingTemplate} 
                                className="flex-1 bg-transparent hover:bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 text-xs py-2.5 md:py-3 rounded-xl transition-all font-black flex justify-center items-center gap-2 shadow-sm"
                            >
                                {freezingTemplate ? <FaSpinner className="animate-spin" /> : <><FaSnowflake /> ثبت و ذخیره قالب</>}
                            </button>
                            <button 
                                onClick={() => { setTemplateModal(false); setTemplateName(''); }} 
                                disabled={freezingTemplate} 
                                className="px-3.5 text-xs py-2.5 md:py-3 rounded-xl transition-colors font-black border-2 border-gray-400/60 bg-transparent hover:bg-gray-500/20"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TaskDetailPanel;