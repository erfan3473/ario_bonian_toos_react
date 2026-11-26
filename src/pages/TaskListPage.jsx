import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import JalaliDatePicker from '../components/common/JalaliDatePicker';
import moment from 'moment-jalaali';
import {
  fetchMyTaskInbox,
  fetchSentTasks,
  fetchTaskTemplates,
  deleteTaskTemplate,
  createTask,
  fetchTaskTypes,
  fetchSubordinates,
  fetchAllTasksAdmin,
  deleteTask,
} from '../features/task/taskSlice';
import TaskWorkflowCreateModal from '../components/Task/TaskWorkflowCreateModal';
import AssigneePickerPanel, { AssigneeChip } from '../components/Task/AssigneePickerPanel';
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUturnRightIcon,
  BarsArrowDownIcon,
  BoltIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ClockIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  InboxIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  PlusIcon,
  QueueListIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  TrashIcon,
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const TASK_TYPE_LABELS = {
  PAYROLL_FORM: 'تکمیل فرم حقوق',
  PURCHASE: 'خرید / تدارکات',
  REPORT: 'گزارش‌دهی',
};

const STATUS_LABELS = {
  PENDING: 'در انتظار',
  IN_PROGRESS: 'در جریان',
  DONE: 'انجام شده',
  REJECTED: 'رد شده',
  CANCELLED: 'لغو شده',
};

const TAB_TITLES = {
  inbox: 'ماموریت‌های دریافتی',
  sent: 'ماموریت‌های ارسالی',
  expired: 'ماموریت‌های منقضی‌شده',
  completed: 'ماموریت‌های اتمام‌یافته',
  cancelled: 'ماموریت‌های لغوشده',
  all: 'کل ماموریت‌های سازمان',
};

const getStatusBadgeClass = (status, isDark) => {
  const map = {
    PENDING: isDark
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      : 'bg-amber-50 text-amber-800 border-amber-600/35',
    IN_PROGRESS: isDark
      ? 'bg-sky-400/15 text-sky-300 border-sky-400/40'
      : 'bg-sky-50 text-sky-800 border-sky-600/35',
    DONE: isDark
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
      : 'bg-emerald-50 text-emerald-800 border-emerald-600/35',
    REJECTED: isDark
      ? 'bg-red-500/15 text-red-300 border-red-500/40'
      : 'bg-red-50 text-red-700 border-red-600/35',
    CANCELLED: isDark
      ? 'bg-slate-500/15 text-slate-400 border-slate-500/35'
      : 'bg-slate-100 text-slate-600 border-slate-400/40',
  };
  return (
    map[status] ||
    (isDark
      ? 'bg-slate-500/15 text-slate-300 border-slate-500/30'
      : 'bg-slate-100 text-slate-700 border-slate-300')
  );
};

const getUrgencyBadgeClass = (urgency, isDark) => {
  const map = {
    LOW: isDark
      ? 'bg-slate-500/15 text-slate-300 border-slate-500/35'
      : 'bg-slate-100 text-slate-700 border-slate-400/35',
    MEDIUM: isDark
      ? 'bg-sky-400/15 text-sky-300 border-sky-400/35'
      : 'bg-sky-50 text-sky-800 border-sky-600/30',
    HIGH: isDark
      ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
      : 'bg-amber-50 text-amber-800 border-amber-600/35',
    CRITICAL: isDark
      ? 'bg-red-500/15 text-red-300 border-red-500/45'
      : 'bg-red-50 text-red-700 border-red-600/40',
  };
  return map[urgency] || map.MEDIUM;
};

const ASSIGNEE_STATE_CONFIG = {
  PENDING: { label: 'در انتظار اقدام', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  IN_PROGRESS: { label: 'در حال انجام', color: 'text-sky-400 bg-sky-400/10 border-sky-400/30' },
  APPROVED: { label: 'انجام داد / تایید', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  REJECTED: { label: 'رد کرد', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  FORWARDED: { label: 'ارجاع داد', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  SKIPPED: { label: 'عبور مرحله', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
};

const APPROVER_STATUS_CONFIG = {
  PENDING: { label: 'در انتظار تایید', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  APPROVED: { label: 'تایید کرد', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  REJECTED: { label: 'رد کرد', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  RETURNED: { label: 'برگشت داد', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  RESUBMITTED: { label: 'اصلاح شده', color: 'text-purple-400 bg-purple-500/10 border-purple-500/30' },
  FORWARDED: { label: 'ارجاع داد', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30' },
  SKIPPED: { label: 'گذر شده', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
};

const URGENCY_LABELS = { LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'زیاد', CRITICAL: 'بحرانی' };

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'کم' },
  { value: 'MEDIUM', label: 'متوسط' },
  { value: 'HIGH', label: 'زیاد' },
  { value: 'CRITICAL', label: 'بحرانی' },
];

const APPROVER_RULES = [
  { value: 'ALL_APPROVERS', label: 'تایید همه اجباری است' },
  { value: 'ANY_APPROVER', label: 'تایید توسط یک نفر کافیست' },
];

const URGENCY_WEIGHT = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const AVATAR_BG_COLORS = [
  'bg-sky-700',
  'bg-emerald-700',
  'bg-amber-700',
  'bg-slate-600',
  'bg-cyan-700',
  'bg-indigo-700',
];

const isTaskExpired = (task) => {
  if (!task?.deadline) return false;
  if (task.status === 'DONE' || task.status === 'CANCELLED') return false;
  return new Date(task.deadline) < new Date();
};

const CornerBrackets = ({ accent = 'cyan', isDark = true }) => {
  const accentMap = {
    cyan: isDark ? 'border-sky-400/60' : 'border-sky-600/60',
    amber: isDark ? 'border-amber-400/60' : 'border-amber-600/60',
    emerald: isDark ? 'border-emerald-400/60' : 'border-emerald-600/60',
    danger: isDark ? 'border-red-400/60' : 'border-red-600/60',
  };
  const colorClass = accentMap[accent] || accentMap.cyan;

  return (
    <>
      <span aria-hidden="true" className={`pointer-events-none absolute top-0 start-0 w-2 h-2 border-t border-s ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute top-0 end-0 w-2 h-2 border-t border-e ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 start-0 w-2 h-2 border-b border-s ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 end-0 w-2 h-2 border-b border-e ${colorClass}`} />
    </>
  );
};

const TacticalAvatar = ({ user, isDark, roleLabel = '', size = 'w-6 h-6 text-[10px]' }) => {
  const initial = user?.name ? user.name.trim()[0] : '؟';
  const colorIndex = (user?.id || 1) % AVATAR_BG_COLORS.length;
  const bgColor = AVATAR_BG_COLORS[colorIndex];

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        title={`${user.name} ${roleLabel ? `(${roleLabel})` : ''}`}
        className={`${size} rounded-[2px] object-cover border shrink-0 ${
          isDark ? 'border-slate-400/35' : 'border-slate-900/20'
        }`}
      />
    );
  }

  return (
    <div
      title={`${user?.name || 'نامشخص'} ${roleLabel ? `(${roleLabel})` : ''}`}
      className={`${size} rounded-[2px] flex items-center justify-center font-bold text-white border shrink-0 ${bgColor} ${
        isDark ? 'border-tactical-canvas' : 'border-white'
      }`}
    >
      {initial}
    </div>
  );
};

const TaskListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inbox';

  const { userInfo } = useSelector((state) => state.userLogin);
  const isAdmin = userInfo?.is_admin || userInfo?.is_staff || userInfo?.is_superuser;

  const {
    inbox,
    sentTasks,
    allTasks,
    loadingInbox,
    loadingSent,
    loadingAllTasks,
    templates,
    creating,
    taskTypes,
    subordinates,
    loadingSubordinates,
  } = useSelector((state) => state.task);

  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [templateStep, setTemplateStep] = useState(1);
  const [pickerOpenMobile, setPickerOpenMobile] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_desc');

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFormData, setTemplateFormData] = useState({
    title: '',
    note: '',
    task_type: '',
    urgency: 'MEDIUM',
  });
  const [templateSendSms, setTemplateSendSms] = useState(false);
  const [stages, setStages] = useState([
    {
      id: 'stage-1',
      stageName: 'مرحله ۱',
      description: '',
      deadlineDate: '',
      deadlineTime: '23:59',
      requireFile: false,
      assignees: [],
      approvalRule: 'ANY_ASSIGNEE',
      nextStageApprovers: [],
      approverRule: 'ALL_APPROVERS',
    },
  ]);
  const [activeElement, setActiveElement] = useState({ id: 'stage-1', type: 'STAGE' });

  const isFrozen = (field) =>
    selectedTemplate?.template_data && selectedTemplate.template_data[field] !== undefined;
  const isStagesFrozen = isFrozen('workflow_stages');

  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdown(null);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        if (pickerOpenMobile) {
          setPickerOpenMobile(false);
        } else if (showTemplatePanel) {
          setShowTemplatePanel(false);
        }
      }
    };
    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pickerOpenMobile, showTemplatePanel]);

  useEffect(() => {
    if (userInfo) {
      if (activeTab === 'inbox') {
        dispatch(fetchMyTaskInbox());
      } else if (activeTab === 'sent') {
        dispatch(fetchSentTasks());
      } else if (activeTab === 'completed' || activeTab === 'cancelled') {
        dispatch(fetchMyTaskInbox());
        dispatch(fetchSentTasks());
        if (isAdmin) dispatch(fetchAllTasksAdmin());
      } else if (activeTab === 'expired') {
        if (isAdmin) {
          dispatch(fetchAllTasksAdmin());
        } else {
          dispatch(fetchMyTaskInbox());
          dispatch(fetchSentTasks());
        }
      } else if (activeTab === 'all' && isAdmin) {
        dispatch(fetchAllTasksAdmin());
      }
    }
  }, [dispatch, userInfo, activeTab, isAdmin]);

  useEffect(() => {
    if (showTemplatePanel) {
      if (templates?.length === 0) dispatch(fetchTaskTemplates());
      if (taskTypes?.length === 0) dispatch(fetchTaskTypes());
      if (subordinates?.length === 0) dispatch(fetchSubordinates());
    }
  }, [showTemplatePanel, dispatch, templates?.length, taskTypes?.length, subordinates?.length]);

  const activeInboxTasks = useMemo(() => {
    return (inbox || []).filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
  }, [inbox]);

  const activeSentTasks = useMemo(() => {
    return (sentTasks || []).filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
  }, [sentTasks]);

  const completedTasks = useMemo(() => {
    const map = new Map();
    const sourcePool =
      isAdmin && allTasks?.length > 0 ? allTasks : [...(inbox || []), ...(sentTasks || [])];
    sourcePool.forEach((t) => {
      if (t.status === 'DONE') map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [inbox, sentTasks, allTasks, isAdmin]);

  const cancelledTasks = useMemo(() => {
    const map = new Map();
    const sourcePool =
      isAdmin && allTasks?.length > 0 ? allTasks : [...(inbox || []), ...(sentTasks || [])];
    sourcePool.forEach((t) => {
      if (t.status === 'CANCELLED') map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [inbox, sentTasks, allTasks, isAdmin]);

  const expiredTasks = useMemo(() => {
    const map = new Map();
    const sourcePool =
      isAdmin && allTasks?.length > 0 ? allTasks : [...(inbox || []), ...(sentTasks || [])];
    sourcePool.forEach((t) => {
      if (isTaskExpired(t)) {
        map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [inbox, sentTasks, allTasks, isAdmin]);

  const currentList = useMemo(() => {
    if (activeTab === 'inbox') return activeInboxTasks;
    if (activeTab === 'sent') return activeSentTasks;
    if (activeTab === 'completed') return completedTasks;
    if (activeTab === 'expired') return expiredTasks;
    if (activeTab === 'cancelled') return cancelledTasks;
    return allTasks || [];
  }, [
    activeTab,
    activeInboxTasks,
    activeSentTasks,
    completedTasks,
    expiredTasks,
    cancelledTasks,
    allTasks,
  ]);

  const isListLoading =
    activeTab === 'inbox'
      ? loadingInbox
      : activeTab === 'sent'
      ? loadingSent
      : activeTab === 'completed'
      ? loadingInbox || loadingSent || (isAdmin && loadingAllTasks)
      : activeTab === 'cancelled'
      ? loadingInbox || loadingSent || (isAdmin && loadingAllTasks)
      : activeTab === 'expired'
      ? isAdmin
        ? loadingAllTasks
        : loadingInbox || loadingSent
      : loadingAllTasks;

  const processedList = useMemo(() => {
    let result = [...currentList];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title?.toLowerCase().includes(s) ||
          t.note?.toLowerCase().includes(s) ||
          t.created_by_name?.toLowerCase().includes(s) ||
          (URGENCY_LABELS[t.urgency] || '').toLowerCase().includes(s)
      );
    }

    if (!['completed', 'cancelled', 'expired'].includes(activeTab) && statusFilter !== 'ALL') {
      result = result.filter((t) => t.status === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'created_desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'created_asc') return new Date(a.created_at) - new Date(b.created_at);

      if (sortBy === 'deadline_asc') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (sortBy === 'deadline_desc') {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(b.deadline) - new Date(a.deadline);
      }

      if (sortBy === 'urgency_desc') {
        return (URGENCY_WEIGHT[b.urgency] || 0) - (URGENCY_WEIGHT[a.urgency] || 0);
      }
      if (sortBy === 'urgency_asc') {
        return (URGENCY_WEIGHT[a.urgency] || 0) - (URGENCY_WEIGHT[b.urgency] || 0);
      }

      return 0;
    });

    return result;
  }, [currentList, search, statusFilter, sortBy, activeTab]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setSearch('');
    setStatusFilter('ALL');
    setOpenDropdown(null);
  };

  const handleTaskClick = (taskId) =>
    navigate(`/tasks/${taskId}`, { state: { returnTab: activeTab } });

  const handleDeleteTask = async (e, taskId, taskTitle) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `آیا از حذف ماموریت «${taskTitle}» اطمینان کامل دارید؟ این عملیات غیرقابل بازگشت است.`
      )
    ) {
      return;
    }
    setDeletingId(taskId);
    await dispatch(deleteTask(taskId));
    setDeletingId(null);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setShowTemplatePanel(false);
    dispatch(fetchMyTaskInbox());
    dispatch(fetchSentTasks());
    if (isAdmin) dispatch(fetchAllTasksAdmin());
  };

  const validateTemplateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!selectedTemplate) errors.template = 'انتخاب قالب الزامی است';
      if (!templateFormData.title.trim()) errors.title = 'عنوان ماموریت الزامی است';
    } else if (step === 2) {
      stages.forEach((s, idx) => {
        if (!isStagesFrozen && !s.stageName.trim())
          errors[`stageName_${s.id}`] = `نام مرحله ${toPersianDigits(idx + 1)} الزامی است`;
        if (s.assignees.length === 0)
          errors[`stage_${s.id}`] = `مسئولین مرحله ${toPersianDigits(idx + 1)} خالی است`;
      });
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTemplateNext = () => {
    if (validateTemplateStep(templateStep)) {
      setTemplateStep((prev) => Math.min(prev + 1, 3));
      setPickerOpenMobile(false);
    }
  };

  const handleTemplatePrev = () => {
    setTemplateStep((prev) => Math.max(prev - 1, 1));
    setPickerOpenMobile(false);
  };

  const handleSelectTemplate = (e) => {
    const tmplId = e.target.value;
    setTemplateSendSms(false);
    if (!tmplId) {
      setSelectedTemplate(null);
      setTemplateFormData({ title: '', note: '', task_type: '', urgency: 'MEDIUM' });
      setStages([
        {
          id: 'stage-1',
          stageName: 'مرحله ۱',
          description: '',
          deadlineDate: '',
          deadlineTime: '23:59',
          requireFile: false,
          assignees: [],
          approvalRule: 'ANY_ASSIGNEE',
          nextStageApprovers: [],
          approverRule: 'ALL_APPROVERS',
        },
      ]);
      return;
    }
    const tmpl = templates.find((t) => t.id === parseInt(tmplId));
    setSelectedTemplate(tmpl);
    setTemplateStep(1);
    setValidationErrors({});

    if (tmpl && tmpl.template_data) {
      setTemplateFormData({
        title: tmpl.template_data.title || tmpl.template_name || '',
        task_type: tmpl.template_data.task_type || '',
        urgency: tmpl.template_data.urgency || 'MEDIUM',
        note: tmpl.template_data.note || '',
      });

      if (tmpl.template_data.workflow_stages && tmpl.template_data.workflow_stages.length > 0) {
        const loadedStages = tmpl.template_data.workflow_stages.map((s, idx) => ({
          id: `stage-${Date.now()}-${idx}`,
          stageName: s.stage_name || s.name || '',
          description: s.description || s.stage_description || s.desc || s.note || '',
          deadlineDate: s.deadline ? s.deadline.split('T')[0] : '',
          deadlineTime: s.deadline ? s.deadline.split('T')[1].substring(0, 5) : '23:59',
          requireFile: s.require_file || false,
          assignees: (s.assignee_ids || s.assignees || []).map((a) =>
            typeof a === 'object' && a !== null ? a.id || a.user_id : a
          ),
          nextStageApprovers: (s.intermediate_approvers || []).map((a) =>
            typeof a === 'object' && a !== null ? a.id || a.user_id : a
          ),
          approvalRule: s.approval_rule || 'ANY_ASSIGNEE',
          approverRule: s.approver_rule || 'ALL_APPROVERS',
        }));
        setStages(loadedStages);
        setActiveElement({ id: loadedStages[0].id, type: 'STAGE' });
      } else {
        setStages([
          {
            id: `stage-${Date.now()}`,
            stageName: 'مرحله ۱',
            description: '',
            deadlineDate: '',
            deadlineTime: '23:59',
            requireFile: false,
            assignees: [],
            approvalRule: 'ANY_ASSIGNEE',
            nextStageApprovers: [],
            approverRule: 'ALL_APPROVERS',
          },
        ]);
      }
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (window.confirm(`آیا از حذف قالب «${selectedTemplate.template_name}» اطمینان دارید؟`)) {
      await dispatch(deleteTaskTemplate(selectedTemplate.id));
      setSelectedTemplate(null);
      setTemplateFormData({ title: '', note: '', task_type: '', urgency: 'MEDIUM' });
      setStages([
        {
          id: 'stage-1',
          stageName: 'مرحله ۱',
          description: '',
          deadlineDate: '',
          deadlineTime: '23:59',
          requireFile: false,
          assignees: [],
          approvalRule: 'ANY_ASSIGNEE',
          nextStageApprovers: [],
          approverRule: 'ALL_APPROVERS',
        },
      ]);
    }
  };

  const handleRemoveStage = (id) => {
    if (isStagesFrozen || stages.length === 1) return;
    const newStages = stages.filter((s) => s.id !== id);
    setStages(newStages);
    if (activeElement.id === id) setActiveElement({ id: newStages[0].id, type: 'STAGE' });
  };

  const updateStageField = (id, field, value) => {
    if (
      isStagesFrozen &&
      !['assignees', 'nextStageApprovers', 'deadlineDate', 'deadlineTime'].includes(field)
    )
      return;
    setStages(stages.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleAssigneeChange = (selectedIds) => {
    setStages(
      stages.map((s) => {
        if (s.id === activeElement.id) {
          if (activeElement.type === 'STAGE') return { ...s, assignees: selectedIds };
          return { ...s, nextStageApprovers: selectedIds };
        }
        return s;
      })
    );
  };

  const handleRemoveAssignee = (stageId, type, empIdToRemove) => {
    setStages(
      stages.map((s) => {
        if (s.id === stageId) {
          if (type === 'STAGE')
            return { ...s, assignees: s.assignees.filter((id) => id !== empIdToRemove) };
          return {
            ...s,
            nextStageApprovers: s.nextStageApprovers.filter((id) => id !== empIdToRemove),
          };
        }
        return s;
      })
    );
  };

  const activeSelectedIds = useMemo(() => {
    const stage = stages.find((s) => s.id === activeElement.id);
    if (!stage) return [];
    return activeElement.type === 'STAGE' ? stage.assignees : stage.nextStageApprovers;
  }, [activeElement, stages]);

  const activeStage = useMemo(() => {
    return stages.find((s) => s.id === activeElement.id);
  }, [stages, activeElement.id]);

  const getActiveStageNameForPicker = () => {
    if (!activeStage) return '';
    return activeElement.type === 'STAGE'
      ? activeStage.stageName
      : `تاییدیه بعد از ${activeStage.stageName}`;
  };

  const getActiveStageDescriptionForPicker = () => {
    if (!activeStage) return '';
    return activeElement.type === 'STAGE' ? activeStage.description || '' : '';
  };

  const submitTemplateTask = async () => {
    if (!validateTemplateStep(1) || !validateTemplateStep(2)) {
      setTemplateStep(1);
      return;
    }

    const allStageDeadlines = stages
      .filter((s) => s.deadlineDate)
      .map((s) => `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00`)
      .sort();
    const finalTaskDeadline =
      allStageDeadlines.length > 0 ? allStageDeadlines[allStageDeadlines.length - 1] : null;

    const finalPayload = {
      ...selectedTemplate.template_data,
      title: templateFormData.title.trim(),
      task_type: templateFormData.task_type,
      urgency: templateFormData.urgency,
      note: templateFormData.note.trim(),
      deadline: finalTaskDeadline,
      send_sms: templateSendSms,
      workflow_stages: stages.map((s, idx) => ({
        step_index: idx + 1,
        stage_name: s.stageName,
        description: s.description,
        deadline: s.deadlineDate ? `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00` : null,
        require_file: s.requireFile,
        assignee_ids: s.assignees,
        approval_rule: s.approvalRule,
        intermediate_approvers: s.nextStageApprovers,
        approver_rule: s.approverRule,
      })),
    };

    const res = await dispatch(createTask(finalPayload));
    if (!res.error) {
      handleCreateSuccess();
      setSelectedTemplate(null);
      setTemplateStep(1);
      setTemplateSendSms(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setSortBy('created_desc');
  };

  const hasActiveFilters =
    search !== '' ||
    (!['completed', 'cancelled', 'expired'].includes(activeTab) && statusFilter !== 'ALL') ||
    sortBy !== 'created_desc';

  const toggleDropdown = (e, taskId, type) => {
    e.stopPropagation();
    if (openDropdown?.taskId === taskId && openDropdown?.type === type) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown({ taskId, type });
    }
  };

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-tactical-lightSurface';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  const inputBase = `w-full h-9 px-3 text-xs sm:text-sm rounded-[2px] border focus:outline-none transition-colors tracking-normal ${
    isDark
      ? 'bg-tactical-canvas border-slate-400/20 text-slate-100 placeholder-slate-500 focus:border-sky-400'
      : 'bg-slate-50 border-slate-900/20 text-slate-900 placeholder-slate-400 focus:border-sky-600'
  }`;

  const tabsConfig = [
    {
      id: 'inbox',
      label: 'دریافتی',
      icon: InboxIcon,
      count: activeInboxTasks.length,
      accent: 'cyan',
      show: true,
    },
    {
      id: 'sent',
      label: 'ارسالی',
      icon: PaperAirplaneIcon,
      count: activeSentTasks.length,
      accent: 'cyan',
      show: true,
    },
    {
      id: 'expired',
      label: 'منقضی شده',
      icon: ExclamationTriangleIcon,
      count: expiredTasks.length,
      accent: 'danger',
      show: true,
    },
    {
      id: 'completed',
      label: 'اتمام یافته',
      icon: CheckCircleIcon,
      count: completedTasks.length,
      accent: 'emerald',
      show: true,
    },
    {
      id: 'cancelled',
      label: 'لغو شده',
      icon: NoSymbolIcon,
      count: cancelledTasks.length,
      accent: 'slate',
      show: true,
    },
    {
      id: 'all',
      label: 'کل سازمان',
      icon: QueueListIcon,
      count: allTasks?.length || 0,
      accent: 'amber',
      show: isAdmin,
    },
  ];

  return (
    <div
      className={`relative min-h-screen transition-colors duration-200 ${
        isDark
          ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
          : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
      }`}
      dir="rtl"
    >
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 tactical-scanlines"
        />
      )}

      {/* نوار مسیر و وضعیت */}
      <div
        className={`relative z-10 border-b ${borderHairline} ${
          isDark ? 'bg-tactical-surface1/95' : 'bg-white/95'
        } backdrop-blur-sm`}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-10 flex items-center justify-between gap-3 text-[11px] tracking-normal">
          <nav aria-label="مسیر صفحه" className="flex items-center gap-1.5 min-w-0 font-medium">
            <Link
              to="/"
              className={`transition-colors ${
                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
              }`}
            >
              پایگاه اصلی
            </Link>
            <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
            <span className={textSecondary}>ماموریت‌ها</span>
            <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
            <span className={`font-semibold truncate ${textPrimary}`}>
              {TAB_TITLES[activeTab] || 'کارتابل ماموریت‌ها'}
            </span>
          </nav>

          <span
            className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[11px] font-medium tabular-nums shrink-0 ${
              activeTab === 'expired'
                ? isDark
                  ? 'border-red-500/40 bg-red-500/10 text-red-400'
                  : 'border-red-600/35 bg-red-50 text-red-700'
                : isDark
                ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                : 'border-sky-600/30 bg-sky-50 text-sky-700'
            }`}
          >
            تعداد ماموریت‌ها: {toPersianDigits(processedList.length)} مورد
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* سرصفحه اصلی فرماندهی ماموریت‌ها */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div
          className={`relative border rounded-[2px] ${surfacePanel} ${
            activeTab === 'expired'
              ? isDark
                ? 'border-red-500/40'
                : 'border-red-600/35'
              : borderHairline
          }`}
        >
          <CornerBrackets accent={activeTab === 'expired' ? 'danger' : 'cyan'} isDark={isDark} />

          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  activeTab === 'expired'
                    ? isDark
                      ? 'bg-red-500/10 border-red-500/45 text-red-400'
                      : 'bg-red-50 border-red-600/40 text-red-700'
                    : isDark
                    ? 'bg-sky-400/10 border-sky-400/40 text-sky-400'
                    : 'bg-sky-50 border-sky-600/35 text-sky-700'
                }`}
              >
                <InboxIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={`text-lg sm:text-xl font-bold tracking-normal ${textPrimary}`}>
                    ماموریت‌های من
                  </h1>
                  <span
                    className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-medium tracking-normal ${
                      isDark
                        ? 'border-slate-400/20 bg-tactical-surface2 text-slate-400'
                        : 'border-slate-900/15 bg-slate-100 text-slate-600'
                    }`}
                  >
                    مدیریت و پیگیری گردش کار اداری
                  </span>
                </div>
                <p className={`text-xs mt-1 tabular-nums tracking-normal ${textSecondary}`}>
                  بخش فعال: <strong className={textPrimary}>{TAB_TITLES[activeTab]}</strong> | نمایش{' '}
                  <strong className={textPrimary}>{toPersianDigits(processedList.length)}</strong> از{' '}
                  <strong className={textPrimary}>{toPersianDigits(currentList.length)}</strong> پرونده
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/tasks/templates')}
                    className={`flex-1 sm:flex-initial h-9 px-3 rounded-[2px] border text-xs font-semibold inline-flex items-center justify-center gap-1.5 tracking-normal transition-colors ${
                      isDark
                        ? 'bg-tactical-surface2 border-amber-400/35 text-amber-300 hover:bg-amber-400/15'
                        : 'bg-amber-50 border-amber-600/35 text-amber-800 hover:bg-amber-100'
                    }`}
                    title="تنظیمات قالب‌ها"
                  >
                    <Cog6ToothIcon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">تنظیمات قالب</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplatePanel(!showTemplatePanel);
                      setShowCreateModal(false);
                    }}
                    className={`flex-1 sm:flex-initial h-9 px-3 rounded-[2px] border text-xs font-semibold inline-flex items-center justify-center gap-1.5 tracking-normal transition-colors ${
                      showTemplatePanel
                        ? isDark
                          ? 'bg-amber-400 border-amber-400 text-slate-950'
                          : 'bg-amber-600 border-amber-700 text-white'
                        : isDark
                        ? 'bg-tactical-surface2 border-slate-400/25 text-slate-200 hover:border-amber-400/50 hover:text-amber-300'
                        : 'bg-white border-slate-900/20 text-slate-800 hover:border-amber-600/50 hover:text-amber-800'
                    }`}
                  >
                    <BoltIcon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">اجرای قالب</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(true);
                  setShowTemplatePanel(false);
                }}
                className={`flex-1 sm:flex-initial h-9 px-4 rounded-[2px] font-semibold text-xs inline-flex items-center justify-center gap-1.5 tracking-normal transition-colors ${
                  isDark
                    ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                <PlusIcon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">ماموریت جدید</span>
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* مودال ۳ مرحله‌ای اجرای قالب فریز‌شده */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {showTemplatePanel && isAdmin && (
          <div
            onClick={() => setShowTemplatePanel(false)}
            className="fixed inset-0 z-[1050] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full max-w-4xl max-h-[92vh] sm:max-h-[86vh] rounded-[2px] border flex flex-col shadow-2xl overflow-hidden ${
                isDark
                  ? 'bg-tactical-surface1 border-amber-400/45 text-slate-100'
                  : 'bg-white border-amber-600/45 text-slate-900'
              }`}
            >
              <CornerBrackets accent="amber" isDark={isDark} />

              {/* هدر مودال */}
              <div
                className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${borderHairline} ${
                  isDark ? 'bg-tactical-surface2' : 'bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-[2px] border flex items-center justify-center ${
                      isDark
                        ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                        : 'bg-white border-amber-600/35 text-amber-700'
                    }`}
                  >
                    <RectangleStackIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-xs sm:text-sm tracking-normal">
                      انتخاب و اجرای سریع قالب فریز‌شده
                    </h2>
                    <span className={`text-[10px] tracking-normal ${textSecondary}`}>
                      گام {toPersianDigits(templateStep)} از ۳
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplatePanel(false)}
                  className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"
                  aria-label="بستن پنجره"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
                {/* استپر ۳ مرحله‌ای */}
                <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto">
                  {[
                    { num: 1, label: 'انتخاب و پایه', clickable: true },
                    { num: 2, label: 'مراحل و پرسنل', clickable: () => validateTemplateStep(1) },
                    {
                      num: 3,
                      label: 'توضیحات و ثبت',
                      clickable: () => validateTemplateStep(1) && validateTemplateStep(2),
                    },
                  ].map((s) => {
                    const isCurrent = templateStep === s.num;
                    const isDone = templateStep > s.num;
                    return (
                      <button
                        key={s.num}
                        type="button"
                        onClick={() => {
                          if (s.clickable === true || s.clickable()) setTemplateStep(s.num);
                        }}
                        className={`p-2 rounded-[2px] border flex items-center justify-center gap-2 text-xs font-semibold tracking-normal transition-colors ${
                          isCurrent
                            ? isDark
                              ? 'bg-amber-400/15 border-amber-400/60 text-amber-300'
                              : 'bg-amber-50 border-amber-600/60 text-amber-900'
                            : isDone
                            ? isDark
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-emerald-50 border-emerald-600/35 text-emerald-800'
                            : isDark
                            ? 'bg-tactical-canvas border-slate-400/15 text-slate-400'
                            : 'bg-slate-50 border-slate-900/15 text-slate-500'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-[2px] inline-flex items-center justify-center text-[10px] font-bold tabular-nums shrink-0 ${
                            isCurrent
                              ? isDark
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-amber-600 text-white'
                              : isDone
                              ? isDark
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-emerald-600 text-white'
                              : isDark
                              ? 'bg-tactical-surface2 text-slate-400'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isDone ? <CheckIcon className="w-3 h-3" /> : toPersianDigits(s.num)}
                        </span>
                        <span className="truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* گام ۱ */}
                {templateStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className={`block text-xs mb-1.5 font-semibold tracking-normal ${textSecondary}`}>
                        قالب را انتخاب کنید <span className="text-red-400">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          onChange={handleSelectTemplate}
                          value={selectedTemplate?.id || ''}
                          className={`${inputBase} flex-1 h-10 ${
                            validationErrors.template ? 'border-red-500' : ''
                          }`}
                        >
                          <option value="">انتخاب قالب ذخیره‌شده...</option>
                          {templates?.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.template_name} {t.is_global ? '(عمومی)' : ''}
                            </option>
                          ))}
                        </select>

                        {selectedTemplate && isAdmin && (
                          <button
                            type="button"
                            onClick={handleDeleteTemplate}
                            className={`shrink-0 h-10 w-10 rounded-[2px] border flex items-center justify-center transition-colors ${
                              isDark
                                ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                : 'border-red-600/35 bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title="حذف قالب"
                            aria-label="حذف قالب"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {validationErrors.template && (
                        <p className="text-[11px] text-red-400 mt-1 tracking-normal">
                          {validationErrors.template}
                        </p>
                      )}
                    </div>

                    {selectedTemplate ? (
                      <>
                        <div
                          className={`flex items-center gap-2 p-3 rounded-[2px] border text-xs tracking-normal ${
                            isDark
                              ? 'bg-amber-400/10 border-amber-400/35 text-amber-300'
                              : 'bg-amber-50 border-amber-600/30 text-amber-800'
                          }`}
                        >
                          <LockClosedIcon className="w-4 h-4 shrink-0" />
                          <span>
                            فیلدهای قفل‌شده غیرقابل تغییر هستند؛ سایر اطلاعات پایه را تنظیم نمایید.
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div>
                            <label className={`flex items-center gap-1.5 text-xs mb-1.5 font-semibold tracking-normal ${textSecondary}`}>
                              عنوان ماموریت{' '}
                              {isFrozen('title') && <LockClosedIcon className="w-3.5 h-3.5 text-amber-400" />}
                              <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={templateFormData.title}
                              onChange={(e) =>
                                setTemplateFormData({ ...templateFormData, title: e.target.value })
                              }
                              disabled={isFrozen('title')}
                              className={`${inputBase} h-10 ${
                                isFrozen('title') ? 'opacity-50 cursor-not-allowed' : ''
                              } ${validationErrors.title ? 'border-red-500' : ''}`}
                            />
                            {validationErrors.title && (
                              <p className="text-[11px] text-red-400 mt-1 tracking-normal">
                                {validationErrors.title}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={`flex items-center gap-1.5 text-xs mb-1.5 font-semibold tracking-normal ${textSecondary}`}>
                                دسته‌بندی{' '}
                                {isFrozen('task_type') && (
                                  <LockClosedIcon className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </label>
                              <select
                                value={templateFormData.task_type}
                                onChange={(e) =>
                                  setTemplateFormData({
                                    ...templateFormData,
                                    task_type: e.target.value,
                                  })
                                }
                                disabled={isFrozen('task_type')}
                                className={`${inputBase} h-10 ${
                                  isFrozen('task_type') ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                <option value="">انتخاب دسته‌بندی...</option>
                                {taskTypes && taskTypes.length > 0
                                  ? taskTypes.map((type) => (
                                      <option
                                        key={type.id || type.code}
                                        value={type.code || type.id}
                                      >
                                        {type.title || type.name || type.label}
                                      </option>
                                    ))
                                  : Object.entries(TASK_TYPE_LABELS).map(([val, label]) => (
                                      <option key={val} value={val}>
                                        {label}
                                      </option>
                                    ))}
                              </select>
                            </div>

                            <div>
                              <label className={`flex items-center gap-1.5 text-xs mb-1.5 font-semibold tracking-normal ${textSecondary}`}>
                                فوریت{' '}
                                {isFrozen('urgency') && (
                                  <LockClosedIcon className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </label>
                              <select
                                value={templateFormData.urgency}
                                onChange={(e) =>
                                  setTemplateFormData({
                                    ...templateFormData,
                                    urgency: e.target.value,
                                  })
                                }
                                disabled={isFrozen('urgency')}
                                className={`${inputBase} h-10 ${
                                  isFrozen('urgency') ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                              >
                                {URGENCY_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className={`flex flex-col items-center justify-center py-12 rounded-[2px] border border-dashed ${borderHairline} ${textSecondary}`}
                      >
                        <RectangleStackIcon className="w-10 h-10 mb-2.5 opacity-30" />
                        <p className="text-xs sm:text-sm font-semibold tracking-normal">
                          لطفاً ابتدا یک قالب از فهرست بالا انتخاب نمایید.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* گام ۲ */}
                {templateStep === 2 && selectedTemplate && (
                  <div className="space-y-3">
                    <div
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-[2px] border ${
                        isDark
                          ? 'bg-amber-400/10 border-amber-400/35'
                          : 'bg-amber-50 border-amber-600/30'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 tracking-normal">
                        <h4
                          className={`font-bold text-xs sm:text-sm flex items-center gap-2 ${
                            isDark ? 'text-amber-300' : 'text-amber-900'
                          }`}
                        >
                          <Squares2X2Icon className="w-4 h-4 shrink-0" />
                          <span>تخصیص پرسنل و مهلت مراحل</span>
                          {isStagesFrozen && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-[2px] border ${
                                isDark
                                  ? 'bg-tactical-canvas border-amber-400/35 text-amber-300'
                                  : 'bg-white border-amber-600/30 text-amber-800'
                              }`}
                            >
                              ساختار قفل‌شده
                            </span>
                          )}
                        </h4>
                        <span className={`text-[11px] ${textSecondary}`}>
                          بخش انتخاب‌شده:{' '}
                          <strong className={textPrimary}>{getActiveStageNameForPicker()}</strong>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPickerOpenMobile(true)}
                        className={`md:hidden h-9 px-3 rounded-[2px] text-xs font-semibold inline-flex items-center justify-center gap-1.5 tracking-normal ${
                          isDark
                            ? 'bg-sky-400 text-slate-950'
                            : 'bg-sky-600 text-white'
                        }`}
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        <span>انتخاب پرسنل برای «{getActiveStageNameForPicker()}»</span>
                      </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 h-auto xl:h-[450px]">
                      <div
                        className={`hidden md:flex w-[280px] lg:w-[300px] shrink-0 border rounded-[2px] overflow-hidden ${borderHairline} ${
                          isDark ? 'bg-tactical-canvas' : 'bg-white'
                        }`}
                      >
                        <AssigneePickerPanel
                          subordinates={subordinates || []}
                          loading={loadingSubordinates}
                          selectedIds={activeSelectedIds}
                          onChange={handleAssigneeChange}
                          activeStageName={getActiveStageNameForPicker()}
                          activeStageDescription={getActiveStageDescriptionForPicker()}
                        />
                      </div>

                      <div
                        className={`flex-1 overflow-x-auto overflow-y-auto pb-2 px-2.5 flex items-start gap-3 rounded-[2px] border ${borderHairline} ${
                          isDark ? 'bg-tactical-canvas/60' : 'bg-slate-50'
                        }`}
                      >
                        {stages.map((stage, index) => {
                          const isStageSelected =
                            activeElement.id === stage.id && activeElement.type === 'STAGE';
                          const isLinkSelected =
                            activeElement.id === stage.id && activeElement.type === 'LINK';

                          return (
                            <React.Fragment key={stage.id}>
                              <div
                                onClick={() => setActiveElement({ id: stage.id, type: 'STAGE' })}
                                className={`shrink-0 w-[275px] sm:w-[290px] rounded-[2px] border flex flex-col cursor-pointer my-2 transition-colors ${
                                  isStageSelected
                                    ? isDark
                                      ? 'border-sky-400 bg-tactical-surface1'
                                      : 'border-sky-600 bg-white'
                                    : isDark
                                    ? 'border-slate-400/20 bg-tactical-surface1/70 hover:border-slate-400/40'
                                    : 'border-slate-900/15 bg-white hover:border-slate-900/35'
                                }`}
                              >
                                <div
                                  className={`px-3 py-2 border-b flex justify-between items-center ${borderHairline} ${
                                    isStageSelected
                                      ? isDark
                                        ? 'bg-sky-400/15'
                                        : 'bg-sky-50'
                                      : surfaceHeader
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 text-xs font-bold tracking-normal">
                                    <span className={textSecondary}>
                                      مرحله {toPersianDigits(index + 1)}:
                                    </span>
                                    <span className={isDark ? 'text-sky-300' : 'text-sky-800'}>
                                      {stage.stageName}
                                    </span>
                                  </div>
                                  {!isStagesFrozen && stages.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveStage(stage.id);
                                      }}
                                      className="text-red-400 hover:text-red-500 p-1"
                                      aria-label="حذف مرحله"
                                    >
                                      <TrashIcon className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                <div className="p-3 flex flex-col gap-2.5 max-h-[370px] overflow-y-auto">
                                  <div
                                    className={`p-2.5 rounded-[2px] border text-xs ${borderHairline} ${
                                      isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className={`text-[10px] font-semibold flex items-center gap-1 tracking-normal ${textSecondary}`}>
                                        <DocumentTextIcon className="w-3.5 h-3.5 text-sky-400" />
                                        توضیحات و شرح مرحله:
                                      </span>
                                      {isStagesFrozen && (
                                        <LockClosedIcon className="w-3 h-3 text-amber-400" />
                                      )}
                                    </div>
                                    {isStagesFrozen ? (
                                      <p
                                        className={`text-xs leading-6 max-h-24 overflow-y-auto tracking-normal ${
                                          stage.description ? textPrimary : 'text-slate-500'
                                        }`}
                                      >
                                        {stage.description ||
                                          'توضیحی برای این مرحله ثبت نشده است.'}
                                      </p>
                                    ) : (
                                      <textarea
                                        rows={2}
                                        value={stage.description}
                                        onChange={(e) =>
                                          updateStageField(stage.id, 'description', e.target.value)
                                        }
                                        placeholder="توضیحات و دستورالعمل این مرحله..."
                                        className={`w-full p-2 text-xs rounded-[2px] border outline-none resize-none tracking-normal ${
                                          isDark
                                            ? 'bg-tactical-surface1 border-slate-400/20 text-slate-100'
                                            : 'bg-white border-slate-900/20 text-slate-900'
                                        }`}
                                      />
                                    )}
                                  </div>

                                  <div
                                    className={`flex flex-col gap-1.5 p-2.5 rounded-[2px] border ${borderHairline} ${
                                      isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                                      <span className="text-[11px] font-semibold tracking-normal">
                                        مهلت انجام مرحله
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <JalaliDatePicker
                                          value={stage.deadlineDate}
                                          onChange={(e) =>
                                            updateStageField(
                                              stage.id,
                                              'deadlineDate',
                                              e?.target ? e.target.value : e
                                            )
                                          }
                                          placeholder="تاریخ"
                                          inputClassName={`w-full h-8 px-2 text-xs rounded-[2px] border outline-none ${
                                            isDark
                                              ? 'bg-tactical-surface1 border-slate-400/25 text-slate-100'
                                              : 'bg-white border-slate-900/20 text-slate-900'
                                          }`}
                                          modal={true}
                                        />
                                      </div>
                                      <input
                                        type="time"
                                        value={stage.deadlineTime}
                                        onChange={(e) =>
                                          updateStageField(stage.id, 'deadlineTime', e.target.value)
                                        }
                                        className={`w-20 h-8 px-1.5 text-xs rounded-[2px] border outline-none dir-ltr text-center ${
                                          isDark
                                            ? 'bg-tactical-surface1 text-slate-100 border-slate-400/25 [color-scheme:dark]'
                                            : 'bg-white text-slate-900 border-slate-900/20'
                                        }`}
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-0.5 flex-1 flex flex-col gap-1.5">
                                    <span className={`text-[11px] font-semibold tracking-normal ${textSecondary}`}>
                                      مسئولین مرحله:
                                    </span>
                                    {stage.assignees.length === 0 ? (
                                      <div className="min-h-[44px] flex items-center justify-center text-xs text-red-400 border border-dashed border-red-500/40 rounded-[2px] p-2 bg-red-500/5 tracking-normal">
                                        بدون مسئول (اجباری)
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {stage.assignees.map((empId) => {
                                          const emp = subordinates?.find(
                                            (e) => e.user_id === empId
                                          );
                                          return emp ? (
                                            <AssigneeChip
                                              key={empId}
                                              emp={emp}
                                              onRemove={(id) =>
                                                handleRemoveAssignee(stage.id, 'STAGE', id)
                                              }
                                            />
                                          ) : (
                                            <span key={empId} className="text-xs tabular-nums">
                                              کاربر {toPersianDigits(empId)}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}
                                    {validationErrors[`stage_${stage.id}`] && (
                                      <p className="text-[10px] text-red-400 text-center font-semibold tracking-normal">
                                        {validationErrors[`stage_${stage.id}`]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* باکس تاییدیه میانی */}
                              <div className="shrink-0 flex items-center justify-center px-1 self-center my-2">
                                <div
                                  onClick={() => setActiveElement({ id: stage.id, type: 'LINK' })}
                                  className={`w-36 sm:w-40 min-h-[140px] rounded-[2px] border flex flex-col items-center p-2.5 cursor-pointer transition-colors ${
                                    isLinkSelected
                                      ? isDark
                                        ? 'border-amber-400 bg-amber-400/15'
                                        : 'border-amber-600 bg-amber-50'
                                      : isDark
                                      ? 'border-dashed border-amber-400/45 bg-amber-400/5 hover:border-amber-400/70'
                                      : 'border-dashed border-amber-600/45 bg-amber-50/40 hover:border-amber-600/70'
                                  }`}
                                >
                                  <span
                                    className={`text-[11px] font-bold mb-1.5 tracking-normal ${
                                      isDark ? 'text-amber-300' : 'text-amber-800'
                                    }`}
                                  >
                                    تاییدیه (اختیاری)
                                  </span>
                                  <select
                                    value={stage.approverRule}
                                    onChange={(e) =>
                                      updateStageField(stage.id, 'approverRule', e.target.value)
                                    }
                                    disabled={isStagesFrozen}
                                    onClick={(e) => e.stopPropagation()}
                                    className={`w-full text-[10px] p-1.5 mb-2 rounded-[2px] border outline-none tracking-normal ${
                                      isDark
                                        ? 'bg-tactical-canvas border-amber-400/35 text-amber-300'
                                        : 'bg-white border-amber-600/30 text-amber-800'
                                    }`}
                                  >
                                    {APPROVER_RULES.map((rule) => (
                                      <option key={rule.value} value={rule.value}>
                                        {rule.label}
                                      </option>
                                    ))}
                                  </select>

                                  <div className="flex-1 flex flex-col gap-1.5 w-full items-center justify-center">
                                    {stage.nextStageApprovers.length === 0 ? (
                                      <div className="text-amber-400/60 flex flex-col items-center">
                                        <ArrowLeftIcon className="w-4 h-4 mb-0.5" />
                                        <span className="text-[10px] tracking-normal">
                                          انتقال مستقیم
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="w-full flex flex-wrap gap-1 items-center justify-center">
                                        {stage.nextStageApprovers.map((empId) => {
                                          const emp = subordinates?.find(
                                            (e) => e.user_id === empId
                                          );
                                          return emp ? (
                                            <AssigneeChip
                                              key={empId}
                                              emp={emp}
                                              onRemove={(id) =>
                                                handleRemoveAssignee(stage.id, 'LINK', id)
                                              }
                                            />
                                          ) : (
                                            <span key={empId} className="text-xs tabular-nums">
                                              کاربر {toPersianDigits(empId)}
                                            </span>
                                          );
                                        })}
                                        <ArrowLeftIcon className="w-3.5 h-3.5 text-amber-400 mt-1" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* گام ۳ */}
                {templateStep === 3 && selectedTemplate && (
                  <div
                    className={`p-4 rounded-[2px] border space-y-4 ${borderHairline} ${
                      isDark ? 'bg-tactical-canvas/60' : 'bg-slate-50'
                    }`}
                  >
                    <div className={`flex items-center gap-2 pb-2 border-b ${borderHairline}`}>
                      <Cog6ToothIcon
                        className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                      />
                      <h4 className={`font-bold text-xs sm:text-sm tracking-normal ${textPrimary}`}>
                        توضیحات تکمیلی و تایید نهایی
                      </h4>
                    </div>

                    <div>
                      <label className={`flex items-center gap-1.5 text-xs mb-1.5 font-semibold tracking-normal ${textSecondary}`}>
                        توضیحات کلی ماموریت{' '}
                        {isFrozen('note') && <LockClosedIcon className="w-3.5 h-3.5 text-amber-400" />}
                      </label>
                      <textarea
                        rows={3}
                        value={templateFormData.note}
                        onChange={(e) =>
                          setTemplateFormData({ ...templateFormData, note: e.target.value })
                        }
                        disabled={isFrozen('note')}
                        className={`w-full p-3 text-xs sm:text-sm rounded-[2px] border outline-none resize-none tracking-normal ${
                          isFrozen('note') ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          isDark
                            ? 'bg-tactical-surface1 border-slate-400/20 text-slate-100 focus:border-sky-400'
                            : 'bg-white border-slate-900/20 text-slate-900 focus:border-sky-600'
                        }`}
                      />
                    </div>

                    <div
                      onClick={() => setTemplateSendSms((v) => !v)}
                      className={`flex items-center justify-between p-3.5 rounded-[2px] border cursor-pointer transition-colors select-none ${
                        templateSendSms
                          ? isDark
                            ? 'bg-emerald-500/15 border-emerald-500/45'
                            : 'bg-emerald-50 border-emerald-600/40'
                          : isDark
                          ? 'bg-tactical-surface1 border-slate-400/20'
                          : 'bg-white border-slate-900/15'
                      }`}
                    >
                      <div className="tracking-normal">
                        <div
                          className={`text-xs sm:text-sm font-bold ${
                            templateSendSms
                              ? isDark
                                ? 'text-emerald-300'
                                : 'text-emerald-800'
                              : textPrimary
                          }`}
                        >
                          ارسال پیامک اطلاع‌رسانی
                        </div>
                        <div className={`text-[11px] mt-0.5 ${textSecondary}`}>
                          ارسال پیامک انتساب ماموریت به مسئولین و ناظران مرحله اول
                        </div>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-[2px] border transition-colors relative shrink-0 ${
                          templateSendSms
                            ? 'bg-emerald-500 border-emerald-400'
                            : isDark
                            ? 'bg-tactical-canvas border-slate-400/30'
                            : 'bg-slate-200 border-slate-400'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-[1px] transition-all ${
                            templateSendSms ? 'start-0.5' : 'end-0.5'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* فوتر مودال */}
              <div
                className={`px-4 py-3 border-t flex items-center justify-between gap-3 shrink-0 ${borderHairline} ${surfaceHeader}`}
              >
                {templateStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleTemplatePrev}
                    className={`h-9 px-4 rounded-[2px] text-xs font-semibold border tracking-normal transition-colors ${
                      isDark
                        ? 'bg-tactical-surface1 text-slate-300 border-slate-400/25 hover:bg-tactical-hover'
                        : 'bg-white text-slate-700 border-slate-900/20 hover:bg-slate-100'
                    }`}
                  >
                    مرحله قبل
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowTemplatePanel(false)}
                    className={`h-9 px-4 rounded-[2px] text-xs font-semibold border tracking-normal transition-colors ${
                      isDark
                        ? 'bg-tactical-surface1 text-slate-300 border-slate-400/25 hover:bg-tactical-hover'
                        : 'bg-white text-slate-700 border-slate-900/20 hover:bg-slate-100'
                    }`}
                  >
                    انصراف
                  </button>
                )}

                {templateStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleTemplateNext}
                    className={`h-9 px-5 rounded-[2px] text-xs font-semibold inline-flex items-center justify-center gap-2 tracking-normal transition-colors ${
                      isDark
                        ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <span>مرحله بعد</span>
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitTemplateTask}
                    disabled={creating}
                    className={`h-9 px-5 rounded-[2px] text-xs font-semibold inline-flex items-center justify-center gap-2 tracking-normal transition-colors disabled:opacity-50 ${
                      isDark
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {creating ? (
                      <>
                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                        <span>در حال ایجاد...</span>
                      </>
                    ) : (
                      <>
                        <BoltIcon className="w-4 h-4" />
                        <span>ایجاد سریع ماموریت</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* نوار تب‌های ماموریت و کنسول فیلتر و جستجو */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className={`relative border rounded-[2px] ${surfacePanel} ${borderHairline}`}>
          <CornerBrackets accent="cyan" isDark={isDark} />

          {/* نوار تب‌ها */}
          <div
            className={`flex overflow-x-auto no-scrollbar border-b ${borderHairline} ${surfaceHeader}`}
          >
            {tabsConfig
              .filter((t) => t.show)
              .map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;

                let activeStyle = isDark
                  ? 'border-b-sky-400 bg-sky-400/10 text-sky-300'
                  : 'border-b-sky-600 bg-white text-sky-800';
                if (tab.accent === 'danger') {
                  activeStyle = isDark
                    ? 'border-b-red-400 bg-red-500/15 text-red-300'
                    : 'border-b-red-600 bg-red-50 text-red-700';
                } else if (tab.accent === 'emerald') {
                  activeStyle = isDark
                    ? 'border-b-emerald-400 bg-emerald-500/15 text-emerald-300'
                    : 'border-b-emerald-600 bg-emerald-50 text-emerald-800';
                } else if (tab.accent === 'amber') {
                  activeStyle = isDark
                    ? 'border-b-amber-400 bg-amber-400/15 text-amber-300'
                    : 'border-b-amber-600 bg-amber-50 text-amber-800';
                } else if (tab.accent === 'slate') {
                  activeStyle = isDark
                    ? 'border-b-slate-300 bg-slate-500/20 text-slate-200'
                    : 'border-b-slate-700 bg-slate-200/70 text-slate-900';
                }

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex-1 min-w-[115px] h-11 px-3 inline-flex items-center justify-center gap-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap tracking-normal ${
                      isSelected
                        ? activeStyle
                        : `border-b-transparent ${
                            tab.accent === 'danger'
                              ? isDark
                                ? 'text-red-400/80 hover:bg-red-500/10 hover:text-red-300'
                                : 'text-red-600 hover:bg-red-50/70'
                              : isDark
                              ? 'text-slate-400 hover:bg-tactical-hover hover:text-slate-100'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold tabular-nums leading-none border ${
                          tab.accent === 'danger'
                            ? isDark
                              ? 'bg-red-500/20 border-red-400/40 text-red-300'
                              : 'bg-red-100 border-red-400 text-red-700'
                            : isSelected
                            ? isDark
                              ? 'bg-tactical-canvas/70 border-current/30'
                              : 'bg-slate-100 border-slate-900/15'
                            : isDark
                            ? 'bg-tactical-canvas border-slate-400/20 text-slate-300'
                            : 'bg-white border-slate-900/15 text-slate-700'
                        }`}
                      >
                        {toPersianDigits(tab.count)}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>

          {/* ردیف فیلترها و جستجو */}
          <div className="p-3.5 sm:p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="جستجو در عنوان، توضیحات، نام آمر یا سطح فوریت..."
                  className={`${inputBase} h-10 ps-3 pe-9`}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 transition-colors"
                    aria-label="پاک کردن جستجو"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                ) : (
                  <MagnifyingGlassIcon className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div
                  className={`grid ${
                    ['completed', 'cancelled', 'expired'].includes(activeTab)
                      ? 'grid-cols-1'
                      : 'grid-cols-2'
                  } gap-2 flex-1 md:flex md:items-center`}
                >
                  {!['completed', 'cancelled', 'expired'].includes(activeTab) && (
                    <div
                      className={`h-10 flex items-center gap-1.5 px-2.5 rounded-[2px] border text-xs font-semibold min-w-0 ${
                        isDark
                          ? 'bg-tactical-canvas border-slate-400/20 text-slate-300'
                          : 'bg-slate-50 border-slate-900/20 text-slate-700'
                      }`}
                    >
                      <FunnelIcon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isDark ? 'text-sky-400' : 'text-sky-700'
                        }`}
                      />
                      <span className="shrink-0 text-[11px] tracking-normal">وضعیت:</span>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent border-0 focus:ring-0 outline-none cursor-pointer py-0 pe-5 ps-1 font-bold flex-1 min-w-0 truncate text-xs tracking-normal"
                      >
                        <option value="ALL" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                          همه وضعیت‌ها
                        </option>
                        <option value="PENDING" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                          در انتظار
                        </option>
                        <option value="IN_PROGRESS" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                          در جریان
                        </option>
                        {activeTab === 'all' && (
                          <option value="DONE" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                            انجام شده
                          </option>
                        )}
                        <option value="REJECTED" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                          رد شده
                        </option>
                      </select>
                    </div>
                  )}

                  <div
                    className={`h-10 flex items-center gap-1.5 px-2.5 rounded-[2px] border text-xs font-semibold min-w-0 ${
                      isDark
                        ? 'bg-tactical-canvas border-slate-400/20 text-slate-300'
                        : 'bg-slate-50 border-slate-900/20 text-slate-700'
                    }`}
                  >
                    <BarsArrowDownIcon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isDark ? 'text-amber-400' : 'text-amber-600'
                      }`}
                    />
                    <span className="shrink-0 text-[11px] tracking-normal">ترتیب:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent border-0 focus:ring-0 outline-none cursor-pointer py-0 pe-5 ps-1 font-bold flex-1 min-w-0 truncate text-xs tracking-normal"
                    >
                      <optgroup label="تاریخ ایجاد" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                        <option value="created_desc">جدیدترین ایجاد</option>
                        <option value="created_asc">قدیمی‌ترین ایجاد</option>
                      </optgroup>
                      <optgroup label="مهلت اقدام" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                        <option value="deadline_asc">نزدیک‌ترین مهلت</option>
                        <option value="deadline_desc">دورترین مهلت</option>
                      </optgroup>
                      <optgroup label="سطح فوریت" className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                        <option value="urgency_desc">بیشترین فوریت</option>
                        <option value="urgency_asc">کمترین فوریت</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`shrink-0 h-10 w-10 rounded-[2px] border inline-flex items-center justify-center transition-colors ${
                      isDark
                        ? 'border-slate-400/25 bg-tactical-surface2 text-slate-300 hover:border-sky-400/50 hover:text-sky-300'
                        : 'border-slate-900/20 bg-slate-50 text-slate-600 hover:border-sky-600/50 hover:text-sky-800'
                    }`}
                    title="بازنشانی فیلترها"
                    aria-label="بازنشانی فیلترها"
                  >
                    <ArrowUturnRightIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div
              className={`flex flex-wrap items-center justify-between gap-2 text-[11px] pt-2 border-t ${borderHairline} ${textSecondary} tracking-normal`}
            >
              <span className="tabular-nums">
                نمایش <strong className={textPrimary}>{toPersianDigits(processedList.length)}</strong>{' '}
                از مجموع <strong className={textPrimary}>{toPersianDigits(currentList.length)}</strong>{' '}
                ماموریت
              </span>
              {activeTab === 'expired' && (
                <span className="text-red-400 font-semibold inline-flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                  ماموریت‌های گذشته از مهلت قانونی
                </span>
              )}
              {activeTab === 'completed' && (
                <span className={isDark ? 'text-emerald-400 font-semibold' : 'text-emerald-700 font-semibold'}>
                  پرونده‌های تکمیل‌شده و مختومه
                </span>
              )}
              {activeTab === 'cancelled' && (
                <span className="font-semibold">ماموریت‌های لغوشده</span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* فهرست پرونده‌های ماموریت (کارت‌های یکی‌درمیان تاکتیکی) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {isListLoading ? (
          <div className={`border rounded-[2px] overflow-hidden ${surfacePanel} ${borderHairline}`}>
            <div className={`h-0.5 w-full ${isDark ? 'bg-sky-400/20' : 'bg-sky-600/20'} overflow-hidden`}>
              <div
                className={`h-full w-1/2 animate-shimmer ${
                  isDark
                    ? 'bg-gradient-to-r from-transparent via-sky-400 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-sky-600 to-transparent'
                }`}
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="p-4 space-y-2.5">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className={`h-24 rounded-[2px] border animate-pulse ${
                    isDark
                      ? 'bg-tactical-surface2/60 border-slate-400/10'
                      : 'bg-slate-100 border-slate-900/10'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : processedList.length === 0 ? (
          <div
            className={`relative text-center py-16 px-4 rounded-[2px] border ${surfacePanel} ${borderHairline}`}
          >
            <CornerBrackets accent="cyan" isDark={isDark} />
            <div
              className={`w-14 h-14 rounded-[2px] border flex items-center justify-center mx-auto mb-3 ${borderHairline} ${surfaceHeader}`}
            >
              {activeTab === 'completed' ? (
                <CheckCircleIcon className="w-7 h-7 opacity-40" />
              ) : activeTab === 'expired' ? (
                <ExclamationTriangleIcon className="w-7 h-7 text-red-400/60" />
              ) : activeTab === 'cancelled' ? (
                <NoSymbolIcon className="w-7 h-7 opacity-40" />
              ) : (
                <InboxIcon className="w-7 h-7 opacity-40" />
              )}
            </div>
            <h3 className={`text-sm sm:text-base font-bold mb-1.5 tracking-normal ${textPrimary}`}>
              {hasActiveFilters
                ? 'هیچ ماموریتی با فیلترهای انتخابی یافت نشد'
                : activeTab === 'inbox'
                ? 'ماموریت دریافتی فعالی وجود ندارد'
                : activeTab === 'sent'
                ? 'ماموریت ارسالی در جریانی وجود ندارد'
                : activeTab === 'completed'
                ? 'هیچ ماموریت تکمیل‌شده‌ای ثبت نشده است'
                : activeTab === 'expired'
                ? 'هیچ ماموریت منقضی‌شده‌ای وجود ندارد'
                : activeTab === 'cancelled'
                ? 'هیچ ماموریت لغوشده‌ای وجود ندارد'
                : 'هیچ ماموریتی در سازمان ثبت نشده است'}
            </h3>
            <p className={`text-xs tracking-normal ${textSecondary}`}>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className={`underline font-semibold mt-1 ${
                    isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
                  }`}
                >
                  پاکسازی فیلترها و مشاهده مجدد فهرست
                </button>
              ) : (
                'فهرست مورد نظر در حال حاضر خالی است.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-6">
            {processedList.map((task, idx) => {
              const expired = isTaskExpired(task);
              const isEven = idx % 2 === 0;

              const cardStyle = expired
                ? isDark
                  ? 'bg-red-950/20 border-red-500/45 border-s-red-500 hover:border-red-400 hover:bg-red-950/30'
                  : 'bg-red-50/60 border-red-500/45 border-s-red-600 hover:border-red-600'
                : task.status === 'DONE'
                ? isEven
                  ? isDark
                    ? 'bg-tactical-surface1 border-slate-400/20 border-s-emerald-400/75 hover:bg-tactical-hover hover:border-emerald-400/50'
                    : 'bg-white border-slate-900/15 border-s-emerald-600/75 hover:bg-emerald-50/30'
                  : isDark
                  ? 'bg-tactical-surface2/85 border-slate-400/20 border-s-emerald-400/60 hover:bg-tactical-hover hover:border-emerald-400/50'
                  : 'bg-slate-50 border-slate-900/15 border-s-emerald-600/60 hover:bg-emerald-50/30'
                : isEven
                ? isDark
                  ? 'bg-tactical-surface1 border-slate-400/20 border-s-sky-400/70 hover:bg-tactical-hover hover:border-sky-400/50'
                  : 'bg-white border-slate-900/15 border-s-sky-600/70 hover:bg-sky-50/35'
                : isDark
                ? 'bg-tactical-surface2/85 border-slate-400/25 border-s-amber-400/70 hover:bg-tactical-hover hover:border-sky-400/50'
                : 'bg-slate-100/75 border-slate-900/20 border-s-amber-600/70 hover:bg-sky-50/35';

              return (
                <article
                  key={task.id}
                  onClick={() => handleTaskClick(task.id)}
                  className={`relative border border-s-[3px] rounded-[2px] cursor-pointer transition-colors duration-150 group ${cardStyle}`}
                >
                  {/* نوار سرصفحه پرونده ماموریت */}
                  <div
                    className={`px-3.5 py-2 border-b flex flex-wrap items-center justify-between gap-2 ${borderHairline} ${
                      expired
                        ? isDark
                          ? 'bg-red-950/30'
                          : 'bg-red-100/50'
                        : isDark
                        ? 'bg-tactical-canvas/45'
                        : 'bg-slate-50/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-[2px] border text-[10px] font-bold tabular-nums ${
                          isDark
                            ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300'
                            : 'bg-white border-slate-900/15 text-slate-700'
                        }`}
                      >
                        {toPersianDigits(idx + 1)}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[2px] border tracking-normal ${getStatusBadgeClass(
                          task.status,
                          isDark
                        )}`}
                      >
                        <span className="opacity-70">وضعیت:</span>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-[2px] border tracking-normal ${
                          isDark
                            ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300'
                            : 'bg-white border-slate-900/15 text-slate-700'
                        }`}
                      >
                        <span className="opacity-70">نوع:</span>
                        {task.task_type_label ||
                          TASK_TYPE_LABELS[task.task_type] ||
                          task.task_type ||
                          'عمومی'}
                      </span>

                      <span
                        className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-[2px] border tracking-normal ${getUrgencyBadgeClass(
                          task.urgency,
                          isDark
                        )}`}
                      >
                        فوریت: {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                      </span>

                      {expired && (
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-[2px] border tracking-normal ${
                            isDark
                              ? 'bg-red-500/20 text-red-300 border-red-400/50'
                              : 'bg-red-100 text-red-700 border-red-500/50'
                          }`}
                        >
                          <ExclamationTriangleIcon className="w-3 h-3 shrink-0" />
                          منقضی شده
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAdmin && activeTab === 'all' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTask(e, task.id, task.title)}
                          disabled={deletingId === task.id}
                          className={`p-1.5 rounded-[2px] border transition-colors ${
                            isDark
                              ? 'border-red-500/35 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-red-600/30 bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title="حذف ماموریت"
                          aria-label="حذف ماموریت"
                        >
                          {deletingId === task.id ? (
                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <TrashIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                      <ChevronLeftIcon
                        className={`w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5 ${
                          isDark
                            ? 'text-slate-500 group-hover:text-sky-400'
                            : 'text-slate-400 group-hover:text-sky-700'
                        }`}
                      />
                    </div>
                  </div>

                  {/* بدنه عنوان و شرح ماموریت */}
                  <div className="p-3.5 sm:p-4">
                    <h3
                      className={`font-bold text-sm sm:text-[15px] leading-6 tracking-normal transition-colors ${
                        isDark
                          ? 'text-slate-100 group-hover:text-sky-300'
                          : 'text-slate-900 group-hover:text-sky-800'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.note && (
                      <p
                        className={`text-xs sm:text-[13px] mt-1.5 line-clamp-2 leading-6 tracking-normal ${textSecondary}`}
                      >
                        {task.note}
                      </p>
                    )}

                    {/* نوار پایینی: تاریخ‌ها، آمر، مجریان و تاییدکنندگان */}
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 text-xs mt-3 pt-2.5 border-t ${borderHairline}`}
                    >
                      {/* تاریخ ایجاد و مهلت نهایی */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] tracking-normal">
                        <div className={`inline-flex items-center gap-1.5 ${textSecondary}`}>
                          <ClockIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>ایجاد:</span>
                          <span dir="ltr" className={`font-semibold tabular-nums ${textPrimary}`}>
                            {toPersianDigits(
                              moment(task.created_at).format('jYYYY/jMM/jDD - HH:mm')
                            )}
                          </span>
                        </div>

                        {task.deadline && (
                          <div
                            className={`inline-flex items-center gap-1.5 font-semibold ${
                              expired
                                ? isDark
                                  ? 'text-red-400'
                                  : 'text-red-600'
                                : isDark
                                ? 'text-amber-400'
                                : 'text-amber-700'
                            }`}
                          >
                            <ClockIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>مهلت نهایی:</span>
                            <span dir="ltr" className="tabular-nums">
                              {toPersianDigits(
                                moment(task.deadline).format('jYYYY/jMM/jDD - HH:mm')
                              )}
                            </span>
                            {expired && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-[2px] border ${
                                  isDark
                                    ? 'bg-red-500/15 border-red-500/35'
                                    : 'bg-red-50 border-red-500/35'
                                }`}
                              >
                                گذشته
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* آمر، مجریان و تاییدکنندگان */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ms-auto sm:ms-0">
                        {task.created_by_name && (
                          <div
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] border ${
                              isDark
                                ? 'bg-tactical-canvas border-slate-400/20'
                                : 'bg-slate-50 border-slate-900/15'
                            }`}
                          >
                            <TacticalAvatar
                              user={{
                                id: task.created_by_id,
                                name: task.created_by_name,
                                avatar_url: task.created_by_avatar,
                              }}
                              isDark={isDark}
                              roleLabel="آمر"
                              size="w-5 h-5 text-[9px]"
                            />
                            <div className="flex items-center gap-1 text-[11px] tracking-normal">
                              <span className={textSecondary}>آمر:</span>
                              <span className={`font-semibold truncate max-w-[95px] ${textPrimary}`}>
                                {task.created_by_name}
                              </span>
                            </div>
                          </div>
                        )}

                        {task.assignees_list && task.assignees_list.length > 0 && (
                          <div className="relative">
                            <div
                              onClick={(e) => toggleDropdown(e, task.id, 'assignees')}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] border cursor-pointer select-none transition-colors ${
                                openDropdown?.taskId === task.id &&
                                openDropdown?.type === 'assignees'
                                  ? isDark
                                    ? 'border-sky-400 bg-sky-400/15'
                                    : 'border-sky-600 bg-sky-100'
                                  : isDark
                                  ? 'bg-sky-400/10 border-sky-400/30 hover:border-sky-400/60'
                                  : 'bg-sky-50 border-sky-600/30 hover:bg-sky-100/70'
                              }`}
                            >
                              <span
                                className={`text-[10px] font-bold tracking-normal ${
                                  isDark ? 'text-sky-300' : 'text-sky-800'
                                }`}
                              >
                                مجریان ({toPersianDigits(task.assignees_list.length)})
                              </span>
                              <div className="flex items-center -space-x-1 space-x-reverse">
                                {task.assignees_list.slice(0, 3).map((user, uIdx) => (
                                  <TacticalAvatar
                                    key={`${user.id}-${uIdx}`}
                                    user={user}
                                    isDark={isDark}
                                    roleLabel="مجری"
                                    size="w-5 h-5 text-[9px]"
                                  />
                                ))}
                                {task.assignees_list.length > 3 && (
                                  <div
                                    className={`w-5 h-5 rounded-[2px] flex items-center justify-center text-[9px] font-bold border tabular-nums ${
                                      isDark
                                        ? 'bg-tactical-surface2 text-sky-300 border-sky-400/35'
                                        : 'bg-white text-sky-800 border-sky-600/35'
                                    }`}
                                  >
                                    +{toPersianDigits(task.assignees_list.length - 3)}
                                  </div>
                                )}
                              </div>
                              <ChevronDownIcon
                                className={`w-3 h-3 transition-transform ${
                                  isDark ? 'text-sky-400' : 'text-sky-700'
                                } ${
                                  openDropdown?.taskId === task.id &&
                                  openDropdown?.type === 'assignees'
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </div>

                            {openDropdown?.taskId === task.id &&
                              openDropdown?.type === 'assignees' && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute end-0 bottom-full mb-2 w-72 rounded-[2px] border shadow-2xl z-50 text-right overflow-hidden ${
                                    isDark
                                      ? 'bg-tactical-surface1 border-sky-400/45 text-slate-100 shadow-black/75'
                                      : 'bg-white border-sky-600/45 text-slate-900 shadow-slate-900/15'
                                  }`}
                                >
                                  <div
                                    className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-bold tracking-normal ${borderHairline} ${surfaceHeader}`}
                                  >
                                    <span
                                      className={`flex items-center gap-1.5 ${
                                        isDark ? 'text-sky-300' : 'text-sky-800'
                                      }`}
                                    >
                                      <UserIcon className="w-3.5 h-3.5" />
                                      مجریان پرونده ({toPersianDigits(task.assignees_list.length)})
                                    </span>
                                    <span className={`text-[10px] font-medium ${textSecondary}`}>
                                      مرحله و وضعیت
                                    </span>
                                  </div>

                                  <div className="p-2 max-h-52 overflow-y-auto space-y-1.5">
                                    {task.assignees_list.map((u, i) => {
                                      const stCfg = ASSIGNEE_STATE_CONFIG[u.state] || {
                                        label: u.state,
                                        color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
                                      };
                                      return (
                                        <div
                                          key={i}
                                          className={`flex items-center justify-between p-2 rounded-[2px] border text-xs gap-2 ${borderHairline} ${
                                            isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <TacticalAvatar
                                              user={u}
                                              isDark={isDark}
                                              size="w-6 h-6 text-[10px]"
                                            />
                                            <div className="flex flex-col min-w-0 tracking-normal">
                                              <span className="font-bold text-xs truncate">
                                                {u.name}
                                              </span>
                                              <span className={`text-[10px] truncate ${textSecondary}`}>
                                                {u.stage_name}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end shrink-0">
                                            <span
                                              className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-[2px] border tracking-normal ${stCfg.color}`}
                                            >
                                              {stCfg.label}
                                            </span>
                                            {u.acted_at && (
                                              <span
                                                dir="ltr"
                                                className={`text-[9px] tabular-nums mt-0.5 ${textSecondary}`}
                                              >
                                                {toPersianDigits(
                                                  moment(u.acted_at).format('jMM/jDD HH:mm')
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {task.approvers_list && task.approvers_list.length > 0 && (
                          <div className="relative">
                            <div
                              onClick={(e) => toggleDropdown(e, task.id, 'approvers')}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-[2px] border cursor-pointer select-none transition-colors ${
                                openDropdown?.taskId === task.id &&
                                openDropdown?.type === 'approvers'
                                  ? isDark
                                    ? 'border-amber-400 bg-amber-400/15'
                                    : 'border-amber-600 bg-amber-100'
                                  : isDark
                                  ? 'bg-amber-400/10 border-amber-400/30 hover:border-amber-400/60'
                                  : 'bg-amber-50 border-amber-600/30 hover:bg-amber-100/70'
                              }`}
                            >
                              <span
                                className={`text-[10px] font-bold tracking-normal ${
                                  isDark ? 'text-amber-300' : 'text-amber-800'
                                }`}
                              >
                                تاییدکنندگان ({toPersianDigits(task.approvers_list.length)})
                              </span>
                              <div className="flex items-center -space-x-1 space-x-reverse">
                                {task.approvers_list.slice(0, 3).map((user, uIdx) => (
                                  <TacticalAvatar
                                    key={`${user.id}-${uIdx}`}
                                    user={user}
                                    isDark={isDark}
                                    roleLabel="ناظر"
                                    size="w-5 h-5 text-[9px]"
                                  />
                                ))}
                                {task.approvers_list.length > 3 && (
                                  <div
                                    className={`w-5 h-5 rounded-[2px] flex items-center justify-center text-[9px] font-bold border tabular-nums ${
                                      isDark
                                        ? 'bg-tactical-surface2 text-amber-300 border-amber-400/35'
                                        : 'bg-white text-amber-800 border-amber-600/35'
                                    }`}
                                  >
                                    +{toPersianDigits(task.approvers_list.length - 3)}
                                  </div>
                                )}
                              </div>
                              <ChevronDownIcon
                                className={`w-3 h-3 transition-transform ${
                                  isDark ? 'text-amber-400' : 'text-amber-700'
                                } ${
                                  openDropdown?.taskId === task.id &&
                                  openDropdown?.type === 'approvers'
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </div>

                            {openDropdown?.taskId === task.id &&
                              openDropdown?.type === 'approvers' && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className={`absolute end-0 bottom-full mb-2 w-72 rounded-[2px] border shadow-2xl z-50 text-right overflow-hidden ${
                                    isDark
                                      ? 'bg-tactical-surface1 border-amber-400/45 text-slate-100 shadow-black/75'
                                      : 'bg-white border-amber-600/45 text-slate-900 shadow-slate-900/15'
                                  }`}
                                >
                                  <div
                                    className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-bold tracking-normal ${borderHairline} ${surfaceHeader}`}
                                  >
                                    <span
                                      className={`flex items-center gap-1.5 ${
                                        isDark ? 'text-amber-300' : 'text-amber-800'
                                      }`}
                                    >
                                      <CheckCircleIcon className="w-3.5 h-3.5" />
                                      ناظران و تاییدکنندگان ({toPersianDigits(task.approvers_list.length)})
                                    </span>
                                    <span className={`text-[10px] font-medium ${textSecondary}`}>
                                      مرحله و وضعیت
                                    </span>
                                  </div>

                                  <div className="p-2 max-h-52 overflow-y-auto space-y-1.5">
                                    {task.approvers_list.map((u, i) => {
                                      const apCfg = APPROVER_STATUS_CONFIG[u.status] || {
                                        label: u.status,
                                        color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
                                      };
                                      return (
                                        <div
                                          key={i}
                                          className={`flex items-center justify-between p-2 rounded-[2px] border text-xs gap-2 ${borderHairline} ${
                                            isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <TacticalAvatar
                                              user={u}
                                              isDark={isDark}
                                              size="w-6 h-6 text-[10px]"
                                            />
                                            <div className="flex flex-col min-w-0 tracking-normal">
                                              <span className="font-bold text-xs truncate">
                                                {u.name}
                                              </span>
                                              <span className={`text-[10px] truncate ${textSecondary}`}>
                                                {u.stage_name}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="flex flex-col items-end shrink-0">
                                            <span
                                              className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-[2px] border tracking-normal ${apCfg.color}`}
                                            >
                                              {apCfg.label}
                                            </span>
                                            {u.acted_at && (
                                              <span
                                                dir="ltr"
                                                className={`text-[9px] tabular-nums mt-0.5 ${textSecondary}`}
                                              >
                                                {toPersianDigits(
                                                  moment(u.acted_at).format('jMM/jDD HH:mm')
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {(!task.assignees_list || task.assignees_list.length === 0) &&
                          task.active_assignees?.length > 0 && (
                            <div
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] border text-[10px] font-semibold tracking-normal ${
                                isDark
                                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-300'
                                  : 'bg-amber-50 border-amber-600/35 text-amber-800'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span className="tabular-nums">
                                {toPersianDigits(task.active_assignees.length)} نفر در انتظار
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* مودال انتخاب پرسنل در موبایل */}
      {pickerOpenMobile && (
        <div className="fixed inset-0 z-[1060] bg-black/80 backdrop-blur-sm flex flex-col justify-end md:hidden">
          <div
            className={`w-full h-[90vh] max-h-[90vh] rounded-t-[2px] flex flex-col overflow-hidden shadow-2xl border-t ${
              isDark
                ? 'bg-tactical-surface1 border-sky-400/40'
                : 'bg-white border-sky-600/40'
            }`}
          >
            <AssigneePickerPanel
              subordinates={subordinates || []}
              loading={loadingSubordinates}
              selectedIds={activeSelectedIds}
              onChange={handleAssigneeChange}
              onClose={() => setPickerOpenMobile(false)}
              onConfirm={() => setPickerOpenMobile(false)}
              activeStageName={getActiveStageNameForPicker()}
              activeStageDescription={getActiveStageDescriptionForPicker()}
            />
          </div>
        </div>
      )}

      {showCreateModal && (
        <TaskWorkflowCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
};

export default TaskListPage;