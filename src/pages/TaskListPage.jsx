import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  deleteTask
} from '../features/task/taskSlice';
import TaskWorkflowCreateModal from '../components/Task/TaskWorkflowCreateModal';
import AssigneePickerPanel, { AssigneeChip } from '../components/Task/AssigneePickerPanel';
import {
  FaInbox, FaPaperPlane, FaPlus, FaSpinner, FaClock, FaUser, FaChevronLeft,
  FaSearch, FaTimes, FaLayerGroup, FaBolt, FaLock, FaSitemap, FaTrash, 
  FaArrowLeft, FaListUl, FaFilter, FaSortAmountDown, FaUndo, FaChevronDown,
  FaCheckCircle, FaCheck, FaCog, FaUserPlus, FaFileAlt
} from 'react-icons/fa';

const TASK_TYPE_LABELS = { PAYROLL_FORM: 'تکمیل فرم حقوق', PURCHASE: 'خرید/تدارکات', REPORT: 'گزارش‌دهی' };
const STATUS_COLORS = { PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/30', DONE: 'bg-green-500/10 text-green-500 border-green-500/30', REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30', CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/30' };
const STATUS_LABELS = { PENDING: 'در انتظار', IN_PROGRESS: 'در جریان', DONE: 'انجام شده', REJECTED: 'رد شده', CANCELLED: 'لغو شده' };

const ASSIGNEE_STATE_CONFIG = {
  PENDING: { label: 'در انتظار اقدام', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  IN_PROGRESS: { label: 'در حال انجام', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  APPROVED: { label: 'انجام داد / تایید', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  REJECTED: { label: 'رد کرد', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  FORWARDED: { label: 'ارجاع داد', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  SKIPPED: { label: 'عبور مرحله', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
};

const APPROVER_STATUS_CONFIG = {
  PENDING: { label: 'در انتظار تایید', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  APPROVED: { label: 'تایید کرد', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  REJECTED: { label: 'رد کرد', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
  RETURNED: { label: 'برگشت داد', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  RESUBMITTED: { label: 'اصلاح شده', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  FORWARDED: { label: 'ارجاع داد', color: 'text-teal-500 bg-teal-500/10 border-teal-500/20' },
  SKIPPED: { label: 'گذر شده', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
};

const URGENCY_LABELS = { LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'زیاد', CRITICAL: 'بحرانی' };
const URGENCY_COLORS = { LOW: 'bg-gray-500/10 text-gray-400 border-gray-500/30', MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/30', HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30', CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30' };
const URGENCY_OPTIONS = [ { value: 'LOW', label: 'کم' }, { value: 'MEDIUM', label: 'متوسط' }, { value: 'HIGH', label: 'زیاد' }, { value: 'CRITICAL', label: 'بحرانی' } ];
const APPROVER_RULES = [ { value: 'ALL_APPROVERS', label: 'تایید همه اجباری است' }, { value: 'ANY_APPROVER', label: 'تایید توسط یک نفر کافیست' } ];

const URGENCY_WEIGHT = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const AVATAR_BG_COLORS = [
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600', 
  'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600'
];

const CircleAvatar = ({ user, isDark, roleLabel = '', size = 'w-6 h-6 text-[9px]' }) => {
  const initial = user?.name ? user.name.trim()[0] : '?';
  const colorIndex = (user?.id || 1) % AVATAR_BG_COLORS.length;
  const bgColor = AVATAR_BG_COLORS[colorIndex];

  if (user?.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        title={`${user.name} ${roleLabel ? `(${roleLabel})` : ''}`}
        className={`${size} rounded-full object-cover border-2 shadow-sm shrink-0 ${
          isDark ? 'border-gray-800' : 'border-white'
        }`}
      />
    );
  }

  return (
    <div
      title={`${user.name} ${roleLabel ? `(${roleLabel})` : ''}`}
      className={`${size} rounded-full flex items-center justify-center font-bold text-white border-2 shadow-sm shrink-0 ${bgColor} ${
        isDark ? 'border-gray-800' : 'border-white'
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
    inbox, sentTasks, allTasks, 
    loadingInbox, loadingSent, loadingAllTasks, 
    templates, creating, taskTypes, subordinates, loadingSubordinates 
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
  const [templateFormData, setTemplateFormData] = useState({ title: '', note: '', task_type: '', urgency: 'MEDIUM' });
  const [templateSendSms, setTemplateSendSms] = useState(false);
  const [stages, setStages] = useState([
    { id: 'stage-1', stageName: 'مرحله ۱', description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS' }
  ]);
  const [activeElement, setActiveElement] = useState({ id: 'stage-1', type: 'STAGE' });

  const isFrozen = (field) => selectedTemplate?.template_data && selectedTemplate.template_data[field] !== undefined;
  const isStagesFrozen = isFrozen('workflow_stages');

  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdown(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (userInfo) {
      if (activeTab === 'inbox') {
        dispatch(fetchMyTaskInbox());
      } else if (activeTab === 'sent') {
        dispatch(fetchSentTasks());
      } else if (activeTab === 'completed') {
        dispatch(fetchMyTaskInbox());
        dispatch(fetchSentTasks());
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
    return (inbox || []).filter(t => t.status !== 'DONE');
  }, [inbox]);

  const activeSentTasks = useMemo(() => {
    return (sentTasks || []).filter(t => t.status !== 'DONE');
  }, [sentTasks]);

  const completedTasks = useMemo(() => {
    const map = new Map();
    (inbox || []).forEach(t => {
      if (t.status === 'DONE') map.set(t.id, t);
    });
    (sentTasks || []).forEach(t => {
      if (t.status === 'DONE') map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [inbox, sentTasks]);

  const currentList = useMemo(() => {
    if (activeTab === 'inbox') return activeInboxTasks;
    if (activeTab === 'sent') return activeSentTasks;
    if (activeTab === 'completed') return completedTasks;
    return allTasks || [];
  }, [activeTab, activeInboxTasks, activeSentTasks, completedTasks, allTasks]);

  const isListLoading = 
    activeTab === 'inbox' ? loadingInbox : 
    activeTab === 'sent' ? loadingSent : 
    activeTab === 'completed' ? (loadingInbox || loadingSent) : 
    loadingAllTasks;

  const processedList = useMemo(() => {
    let result = [...currentList];

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((t) => 
        t.title?.toLowerCase().includes(s) || 
        t.note?.toLowerCase().includes(s) || 
        t.created_by_name?.toLowerCase().includes(s) || 
        (URGENCY_LABELS[t.urgency] || '').toLowerCase().includes(s)
      );
    }

    if (activeTab !== 'completed' && statusFilter !== 'ALL') {
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
   
  const handleTaskClick = (taskId) => navigate(`/tasks/${taskId}`, { state: { returnTab: activeTab } });
   
  const handleDeleteTask = async (e, taskId, taskTitle) => {
    e.stopPropagation();
    if (!window.confirm(`آیا از حذف ماموریت «${taskTitle}» اطمینان کامل دارید؟ این عملیات غیرقابل بازگشت است.`)) {
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
        if (!isStagesFrozen && !s.stageName.trim()) errors[`stageName_${s.id}`] = `نام مرحله ${idx + 1} الزامی است`;
        if (s.assignees.length === 0) errors[`stage_${s.id}`] = `مسئولین مرحله ${idx + 1} خالی است`;
      });
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTemplateNext = () => {
    if (validateTemplateStep(templateStep)) {
      setTemplateStep(prev => Math.min(prev + 1, 3));
      setPickerOpenMobile(false);
    }
  };

  const handleTemplatePrev = () => {
    setTemplateStep(prev => Math.max(prev - 1, 1));
    setPickerOpenMobile(false);
  };

  const handleSelectTemplate = (e) => {
    const tmplId = e.target.value;
    setTemplateSendSms(false);
    if (!tmplId) {
      setSelectedTemplate(null);
      setTemplateFormData({ title: '', note: '', task_type: '', urgency: 'MEDIUM' });
      setStages([{ id: 'stage-1', stageName: 'مرحله ۱', description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS' }]);
      return;
    }
    const tmpl = templates.find(t => t.id === parseInt(tmplId));
    setSelectedTemplate(tmpl);
    setTemplateStep(1);
    setValidationErrors({});
     
    if (tmpl && tmpl.template_data) {
      setTemplateFormData({
        title: tmpl.template_data.title || tmpl.template_name || '',
        task_type: tmpl.template_data.task_type || '',
        urgency: tmpl.template_data.urgency || 'MEDIUM',
        note: tmpl.template_data.note || ''
      });
       
      if (tmpl.template_data.workflow_stages && tmpl.template_data.workflow_stages.length > 0) {
        const loadedStages = tmpl.template_data.workflow_stages.map((s, idx) => ({
          id: `stage-${Date.now()}-${idx}`,
          stageName: s.stage_name || s.name || '',
          description: s.description || s.stage_description || s.desc || s.note || '',
          deadlineDate: s.deadline ? s.deadline.split('T')[0] : '',
          deadlineTime: s.deadline ? s.deadline.split('T')[1].substring(0,5) : '23:59',
          requireFile: s.require_file || false,
          assignees: (s.assignee_ids || s.assignees || []).map(a => typeof a === 'object' && a !== null ? (a.id || a.user_id) : a),
          nextStageApprovers: (s.intermediate_approvers || []).map(a => typeof a === 'object' && a !== null ? (a.id || a.user_id) : a),
          approvalRule: s.approval_rule || 'ANY_ASSIGNEE',
          approverRule: s.approver_rule || 'ALL_APPROVERS'
        }));
        setStages(loadedStages);
        setActiveElement({ id: loadedStages[0].id, type: 'STAGE' });
      } else {
        setStages([{ id: `stage-${Date.now()}`, stageName: 'مرحله ۱', description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS' }]);
      }
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (window.confirm(`آیا از حذف قالب "${selectedTemplate.template_name}" اطمینان دارید؟`)) {
      await dispatch(deleteTaskTemplate(selectedTemplate.id));
      setSelectedTemplate(null);
      setTemplateFormData({ title: '', note: '', task_type: '', urgency: 'MEDIUM' });
      setStages([{ id: 'stage-1', stageName: 'مرحله ۱', description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS' }]);
    }
  };

  const handleRemoveStage = (id) => {
    if (isStagesFrozen || stages.length === 1) return;
    const newStages = stages.filter(s => s.id !== id);
    setStages(newStages);
    if (activeElement.id === id) setActiveElement({ id: newStages[0].id, type: 'STAGE' });
  };

  const updateStageField = (id, field, value) => {
    if (isStagesFrozen && !['assignees', 'nextStageApprovers', 'deadlineDate', 'deadlineTime'].includes(field)) return;
    setStages(stages.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleAssigneeChange = (selectedIds) => {
    setStages(stages.map(s => {
      if (s.id === activeElement.id) {
        if (activeElement.type === 'STAGE') return { ...s, assignees: selectedIds };
        return { ...s, nextStageApprovers: selectedIds };
      }
      return s;
    }));
  };

  const handleRemoveAssignee = (stageId, type, empIdToRemove) => {
    setStages(stages.map(s => {
      if (s.id === stageId) {
        if (type === 'STAGE') return { ...s, assignees: s.assignees.filter(id => id !== empIdToRemove) };
        return { ...s, nextStageApprovers: s.nextStageApprovers.filter(id => id !== empIdToRemove) };
      }
      return s;
    }));
  };

  const activeSelectedIds = useMemo(() => {
    const stage = stages.find(s => s.id === activeElement.id);
    if (!stage) return [];
    return activeElement.type === 'STAGE' ? stage.assignees : stage.nextStageApprovers;
  }, [activeElement, stages]);

  const activeStage = useMemo(() => {
    return stages.find(s => s.id === activeElement.id);
  }, [stages, activeElement.id]);

  const getActiveStageNameForPicker = () => {
    if (!activeStage) return '';
    return activeElement.type === 'STAGE' ? activeStage.stageName : `تاییدیه بعد از ${activeStage.stageName}`;
  };

  const getActiveStageDescriptionForPicker = () => {
    if (!activeStage) return '';
    return activeElement.type === 'STAGE' ? (activeStage.description || '') : '';
  };

  const submitTemplateTask = async () => {
    if (!validateTemplateStep(1) || !validateTemplateStep(2)) {
      setTemplateStep(1);
      return;
    }

    const allStageDeadlines = stages.filter(s => s.deadlineDate).map(s => `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00`).sort();
    const finalTaskDeadline = allStageDeadlines.length > 0 ? allStageDeadlines[allStageDeadlines.length - 1] : null;

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
        approver_rule: s.approverRule
      }))
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

  const hasActiveFilters = search !== '' || (activeTab !== 'completed' && statusFilter !== 'ALL') || sortBy !== 'created_desc';

  const toggleDropdown = (e, taskId, type) => {
    e.stopPropagation();
    if (openDropdown?.taskId === taskId && openDropdown?.type === type) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown({ taskId, type });
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`} dir="rtl">
      <div className="container mx-auto px-3 sm:px-4 py-6 max-w-6xl">
        {/* هدر صفحه: اصلاح سایز عنوان و نمایش متن دکمه‌ها در گوشی */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          
          {/* عنوان ماموریت‌های من (جمع‌وجور در موبایل) */}
          <h1 className="text-base sm:text-2xl font-bold flex items-center gap-2">
            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-900/30 shrink-0">
              <FaInbox className="text-xs sm:text-lg" />
            </div>
            <span>ماموریت‌های من</span>
          </h1>

          {/* دکمه‌های عملیاتی (نمایش هم‌زمان آیکون و متن با چیدمان واکنش‌گرا در گوشی) */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {isAdmin && (
              <>
                {/* دکمه تنظیمات قالب */}
                <button 
                  onClick={() => navigate('/tasks/templates')} 
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl transition-all font-bold text-[10px] sm:text-xs border shrink-0 ${
                    isDark ? 'bg-gray-800 text-purple-300 border-purple-500/30 hover:bg-gray-700' : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                  }`}
                  title="تنظیمات قالب‌ها"
                >
                  <FaCog size={11} className="text-purple-400 shrink-0" />
                  <span className="whitespace-nowrap">تنظیمات قالب</span>
                </button>

                {/* دکمه اجرای قالب */}
                <button 
                  onClick={() => { setShowTemplatePanel(!showTemplatePanel); setShowCreateModal(false); }} 
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl transition-all font-bold text-[10px] sm:text-xs border shrink-0 ${
                    showTemplatePanel 
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-900/30' 
                      : isDark ? 'bg-gray-800 text-purple-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
                  }`}
                >
                  <FaBolt size={11} className="shrink-0" />
                  <span className="whitespace-nowrap">
                    اجرای قالب<span className="hidden md:inline"> فریز شده</span>
                  </span>
                </button>
              </>
            )}

            {/* دکمه ماموریت جدید */}
            <button 
              onClick={() => { setShowCreateModal(true); setShowTemplatePanel(false); }} 
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-xs shadow-md shadow-blue-900/30 shrink-0 transition-all"
            >
              <FaPlus size={11} className="shrink-0" />
              <span className="whitespace-nowrap">
                ماموریت جدید<span className="hidden md:inline"> (کامل)</span>
              </span>
            </button>
          </div>

        </div>

        {/* پنل اجرای قالب‌های فریز‌شده */}
        {/* مودال اجرای قالب‌های فریز‌شده با پس‌زمینه مات و حالت باتم‌شیت در موبایل */}
        {showTemplatePanel && isAdmin && (
          <div 
            onClick={() => setShowTemplatePanel(false)}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-4xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl border flex flex-col shadow-2xl overflow-hidden transition-all ${
                isDark ? 'bg-slate-900 border-purple-500/40 text-white' : 'bg-white border-purple-200 text-gray-900'
              }`}
            >
              {/* هدر مودال همراه با دستگیره کشویی موبایل و ضربدر دایره‌ای */}
              <div className="flex flex-col border-b border-gray-200 dark:border-slate-800 shrink-0">
                {/* خط نشانگر کشویی برای موبایل */}
                <div className="sm:hidden w-10 h-1 bg-gray-400/40 rounded-full mx-auto mt-2" />
                
                <div className="flex items-center justify-between p-3.5 sm:p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                      <FaLayerGroup size={13} />
                    </div>
                    <h2 className={`font-bold text-xs sm:text-base ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                      انتخاب و اجرای سریع قالب فریز‌شده
                    </h2>
                  </div>

                  {/* 🌟 دایره شیک دور دکمه ضربدر */}
                  <button 
                    onClick={() => setShowTemplatePanel(false)} 
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border shadow-sm ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-red-500/20 border-slate-700 hover:border-red-500/40 text-gray-300 hover:text-red-400' 
                        : 'bg-gray-100 hover:bg-red-50 border-gray-300 hover:border-red-300 text-gray-500 hover:text-red-500'
                    }`}
                    title="بستن"
                  >
                    <FaTimes size={13} />
                  </button>
                </div>
              </div>

              {/* بدنه اسکرول‌پذیر مودال */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-purple-500/30">
                {/* Stepper */}
                <div className="flex items-center justify-between relative max-w-sm mx-auto px-2 mb-6">
                  <div className={`absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 z-0 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`} />
                  
                  <div onClick={() => setTemplateStep(1)} className="relative z-10 flex flex-col items-center cursor-pointer">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      templateStep === 1 ? 'bg-purple-600 text-white ring-4 ring-purple-600/20' : templateStep > 1 ? 'bg-green-600 text-white' : isDark ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {templateStep > 1 ? <FaCheck size={10} /> : '۱'}
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-medium mt-1 ${templateStep === 1 ? 'text-purple-400 font-bold' : 'text-gray-400'}`}>انتخاب و پایه</span>
                  </div>

                  <div onClick={() => validateTemplateStep(1) && setTemplateStep(2)} className="relative z-10 flex flex-col items-center cursor-pointer">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      templateStep === 2 ? 'bg-purple-600 text-white ring-4 ring-purple-600/20' : templateStep > 2 ? 'bg-green-600 text-white' : isDark ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {templateStep > 2 ? <FaCheck size={10} /> : '۲'}
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-medium mt-1 ${templateStep === 2 ? 'text-purple-400 font-bold' : 'text-gray-400'}`}>مراحل</span>
                  </div>

                  <div onClick={() => (validateTemplateStep(1) && validateTemplateStep(2)) && setTemplateStep(3)} className="relative z-10 flex flex-col items-center cursor-pointer">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      templateStep === 3 ? 'bg-purple-600 text-white ring-4 ring-purple-600/20' : isDark ? 'bg-slate-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                    }`}>
                      ۳
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-medium mt-1 ${templateStep === 3 ? 'text-purple-400 font-bold' : 'text-gray-400'}`}>توضیحات و ثبت</span>
                  </div>
                </div>

                <div className="flex flex-col w-full">
                  {templateStep === 1 && (
                    <div className="space-y-4">
                      <div className="w-full">
                        <label className="block text-xs mb-1.5 font-bold">قالب را انتخاب کنید <span className="text-red-400">*</span></label>
                        <div className="flex items-center gap-2">
                          <select 
                            onChange={handleSelectTemplate} 
                            value={selectedTemplate?.id || ''} 
                            className={`flex-1 p-3 text-sm rounded-xl border outline-none cursor-pointer ${validationErrors.template ? 'border-red-500' : ''} ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}
                          >
                            <option value="">-- انتخاب قالب ذخیره شده --</option>
                            {templates?.map(t => <option key={t.id} value={t.id}>{t.template_name} {t.is_global ? '(عمومی)' : ''}</option>)}
                          </select>
                           
                          {selectedTemplate && isAdmin && (
                            <button
                              onClick={handleDeleteTemplate}
                              className={`shrink-0 p-3.5 rounded-xl border flex items-center justify-center transition-colors ${
                                isDark ? 'border-red-900/50 bg-red-900/20 text-red-500 hover:bg-red-900/40' : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                              }`}
                              title="حذف این قالب"
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </div>
                        {validationErrors.template && <p className="text-[11px] text-red-400 mt-1">{validationErrors.template}</p>}
                      </div>

                      {selectedTemplate ? (
                        <>
                          <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${isDark ? 'bg-purple-900/20 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                            <FaLock size={14} className="shrink-0" />
                            <span>فیلدهای قفل‌شده غیرقابل تغییرند؛ فقط می‌توانید اطلاعات پایه را تنظیم کنید.</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="flex items-center gap-1.5 text-xs mb-1.5 font-bold">
                                عنوان ماموریت {isFrozen('title') && <FaLock className="text-purple-500 text-[10px]" />} <span className="text-red-400">*</span>
                              </label>
                              <input 
                                type="text" 
                                value={templateFormData.title} 
                                onChange={(e) => setTemplateFormData({...templateFormData, title: e.target.value})} 
                                disabled={isFrozen('title')} 
                                className={`w-full p-3 text-sm rounded-xl border outline-none ${isFrozen('title') ? 'opacity-50 cursor-not-allowed' : ''} ${validationErrors.title ? 'border-red-500' : ''} ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300'}`} 
                              />
                              {validationErrors.title && <p className="text-[11px] text-red-400 mt-1">{validationErrors.title}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="flex items-center gap-1.5 text-xs mb-1.5 font-bold">
                                  دسته‌بندی {isFrozen('task_type') && <FaLock className="text-purple-500 text-[10px]" />}
                                </label>
                                <select 
                                  value={templateFormData.task_type} 
                                  onChange={(e) => setTemplateFormData({...templateFormData, task_type: e.target.value})} 
                                  disabled={isFrozen('task_type')} 
                                  className={`w-full p-3 text-sm rounded-xl border outline-none ${isFrozen('task_type') ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                >
                                  <option value="">-- انتخاب دسته‌بندی --</option>
                                  {taskTypes && taskTypes.length > 0 ? (
                                    taskTypes.map((type) => (
                                      <option key={type.id || type.code} value={type.code || type.id}>
                                        {type.title || type.name || type.label}
                                      </option>
                                    ))
                                  ) : (
                                    Object.entries(TASK_TYPE_LABELS).map(([val, label]) => (
                                      <option key={val} value={val}>{label}</option>
                                    ))
                                  )}
                                </select>
                              </div>
                              <div>
                                <label className="flex items-center gap-1.5 text-xs mb-1.5 font-bold">
                                  فوریت {isFrozen('urgency') && <FaLock className="text-purple-500 text-[10px]" />}
                                </label>
                                <select 
                                  value={templateFormData.urgency} 
                                  onChange={(e) => setTemplateFormData({...templateFormData, urgency: e.target.value})} 
                                  disabled={isFrozen('urgency')} 
                                  className={`w-full p-3 text-sm rounded-xl border outline-none ${isFrozen('urgency') ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                                >
                                  {URGENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 opacity-50">
                          <FaLayerGroup size={36} className="mb-3 text-gray-400" />
                          <p className="text-sm font-bold">لطفاً ابتدا یک قالب از لیست بالا انتخاب کنید</p>
                        </div>
                      )}
                    </div>
                  )}

                  {templateStep === 2 && selectedTemplate && (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-500/10 border border-purple-500/30 p-2.5 sm:p-3 rounded-xl">
                        <div className="flex flex-col gap-0.5">
                          <h4 className={`font-bold text-xs md:text-sm flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                            <FaSitemap /> تخصیص پرسنل و مهلت مراحل {isStagesFrozen && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg ml-2">ساختار فریز شده</span>}
                          </h4>
                          <span className="text-[11px] text-gray-400">
                            مرحله جاری: <strong className="text-purple-400 font-bold">{getActiveStageNameForPicker()} (مرحله انتخاب شده)</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPickerOpenMobile(true)}
                          className="md:hidden flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all"
                        >
                          <FaUserPlus size={13} />
                          <span>انتخاب پرسنل برای «{getActiveStageNameForPicker()}»</span>
                        </button>
                      </div>

                      <div className="flex flex-col md:flex-row gap-3 h-auto xl:h-[460px]">
                        <div className={`hidden md:flex w-[280px] lg:w-[300px] shrink-0 border rounded-xl overflow-hidden shadow-sm ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                          <AssigneePickerPanel
                            subordinates={subordinates || []}
                            loading={loadingSubordinates}
                            selectedIds={activeSelectedIds}
                            onChange={handleAssigneeChange}
                            activeStageName={getActiveStageNameForPicker()}
                            activeStageDescription={getActiveStageDescriptionForPicker()}
                          />
                        </div>

                        <div className={`flex-1 overflow-x-auto overflow-y-auto pb-2 px-2 flex items-start gap-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                          {stages.map((stage, index) => (
                            <React.Fragment key={stage.id}>
                              <div
                                onClick={() => setActiveElement({ id: stage.id, type: 'STAGE' })}
                                className={`shrink-0 w-[275px] sm:w-[290px] rounded-xl border-2 flex flex-col cursor-pointer shadow-sm my-2 transition-all ${
                                  activeElement.id === stage.id && activeElement.type === 'STAGE'
                                    ? `border-purple-500 shadow-purple-500/20 ${isDark ? 'bg-slate-800' : 'bg-blue-50/30'}`
                                    : `border-slate-600/50 ${isDark ? 'bg-slate-800/60' : 'bg-white'}`
                                }`}
                              >
                                <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-black/5 rounded-t-lg">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-bold text-gray-400">مرحله {index + 1}:</span>
                                    <span className="text-sm font-bold text-purple-400">{stage.stageName}</span>
                                    {activeElement.id === stage.id && activeElement.type === 'STAGE' && (
                                      <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold border border-purple-500/30">
                                        مرحله انتخاب شده
                                      </span>
                                    )}
                                  </div>
                                  {!isStagesFrozen && stages.length > 1 && (
                                    <button onClick={(e) => { e.stopPropagation(); handleRemoveStage(stage.id); }} className="text-red-400 hover:text-red-500 p-1"><FaTrash size={14} /></button>
                                  )}
                                </div>

                                <div className="p-3.5 flex flex-col gap-2.5 max-h-[380px] overflow-y-auto [&::-webkit-scrollbar]:w-1">
                                  <div className={`p-2.5 rounded-xl border text-xs ${isDark ? 'bg-slate-900/60 border-slate-700/80' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                                        <FaFileAlt size={10} className="text-purple-400" />
                                        توضیحات و شرح مرحله:
                                      </span>
                                      {isStagesFrozen && <FaLock className="text-purple-400 text-[9px]" title="شرح مرحله فریز شده است" />}
                                    </div>
                                    {isStagesFrozen ? (
                                      <p className={`text-xs leading-relaxed max-h-24 overflow-y-auto ${stage.description ? (isDark ? 'text-gray-200 font-medium' : 'text-gray-800 font-medium') : 'text-gray-500 italic'}`}>
                                        {stage.description || 'توضیحی برای این مرحله از قبل ثبت نشده است.'}
                                      </p>
                                    ) : (
                                      <textarea
                                        rows={2}
                                        value={stage.description}
                                        onChange={(e) => updateStageField(stage.id, 'description', e.target.value)}
                                        placeholder="توضیحات و دستورالعمل این مرحله..."
                                        className={`w-full p-2 text-xs rounded-lg border outline-none resize-none ${
                                          isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                                        }`}
                                      />
                                    )}
                                  </div>

                                  <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-1.5">
                                      <FaClock className="text-xs text-gray-400" />
                                      <span className="text-xs font-bold">مهلت انجام مرحله</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <div className="flex-1">
                                        <JalaliDatePicker
                                          value={stage.deadlineDate}
                                          onChange={(e) => updateStageField(stage.id, 'deadlineDate', e?.target ? e.target.value : e)}
                                          placeholder="تاریخ"
                                          inputClassName={`w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}
                                          modal={true}
                                        />
                                      </div>
                                      <input 
                                        type="time" 
                                        value={stage.deadlineTime} 
                                        onChange={e => updateStageField(stage.id, 'deadlineTime', e.target.value)} 
                                        className={`w-20 px-2 py-1.5 text-xs rounded-lg border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700 [color-scheme:dark]' : 'bg-white border-gray-300'}`}
                                      />
                                    </div>
                                  </div>

                                  <div className="mt-1 flex-1 flex flex-col gap-2">
                                    <span className="text-xs font-bold text-gray-500">مسئولین مرحله:</span>
                                    {stage.assignees.length === 0 ? (
                                      <div className="flex-1 min-h-[45px] flex items-center justify-center text-xs text-red-400 border border-dashed border-red-500/30 rounded-xl p-2 bg-red-500/5">بدون مسئول (اجباری)</div>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5">
                                        {stage.assignees.map(empId => {
                                          const emp = subordinates?.find(e => e.user_id === empId);
                                          return emp ? <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'STAGE', id)} /> : <span key={empId} className="text-xs">کاربر {empId}</span>;
                                        })}
                                      </div>
                                    )}
                                    {validationErrors[`stage_${stage.id}`] && <p className="text-[10px] text-red-400 text-center font-bold">{validationErrors[`stage_${stage.id}`]}</p>}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center justify-center px-1 self-center my-2">
                                <div 
                                  onClick={() => setActiveElement({ id: stage.id, type: 'LINK' })}
                                  className={`w-36 sm:w-40 min-h-[140px] rounded-xl border-2 flex flex-col items-center p-2.5 cursor-pointer transition-all ${
                                    activeElement.id === stage.id && activeElement.type === 'LINK'
                                      ? 'border-orange-500 bg-orange-500/10' : 'border-dashed border-orange-500/50 bg-orange-500/5'
                                  }`}
                                >
                                  <span className="text-[11px] font-bold text-orange-500 mb-1">تاییدیه (اختیاری)</span>
                                  <select 
                                    value={stage.approverRule} 
                                    onChange={(e) => updateStageField(stage.id, 'approverRule', e.target.value)} 
                                    disabled={isStagesFrozen} 
                                    onClick={e => e.stopPropagation()} 
                                    className={`w-full text-[10px] p-1.5 mb-2 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
                                  >
                                    {APPROVER_RULES.map(rule => <option key={rule.value} value={rule.value}>{rule.label}</option>)}
                                  </select>

                                  <div className="flex-1 flex flex-col gap-1.5 w-full items-center justify-center">
                                    {stage.nextStageApprovers.length === 0 ? (
                                      <div className="text-orange-500/40 flex flex-col items-center">
                                        <FaArrowLeft size={14} className="mb-0.5" />
                                        <span className="text-[10px]">مستقیم</span>
                                      </div>
                                    ) : (
                                      <div className="w-full flex flex-wrap gap-1 items-center justify-center">
                                        {stage.nextStageApprovers.map(empId => {
                                          const emp = subordinates?.find(e => e.user_id === empId);
                                          return emp ? <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'LINK', id)} /> : <span key={empId} className="text-xs">کاربر {empId}</span>;
                                        })}
                                        <FaArrowLeft size={11} className="text-orange-500 mt-1" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {templateStep === 3 && selectedTemplate && (
                    <div className={`p-4 md:p-5 rounded-2xl border space-y-4 animate-fadeIn ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-2 pb-2 border-b border-gray-700/30">
                            <FaCog className="text-purple-500" size={15} />
                            <h4 className={`font-bold text-xs md:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>توضیحات تکمیلی و تایید نهایی</h4>
                        </div>

                        <div>
                            <label className="block text-xs mb-1.5 font-bold">توضیحات کلی ماموریت {isFrozen('note') && <FaLock className="text-purple-500 text-xs inline" />}</label>
                            <textarea rows={3} value={templateFormData.note} onChange={(e) => setTemplateFormData({...templateFormData, note: e.target.value})} disabled={isFrozen('note')} className={`w-full p-3 text-sm rounded-xl border outline-none resize-none ${isFrozen('note') ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300'}`} />
                        </div>

                        <div
                            onClick={() => setTemplateSendSms(v => !v)}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all select-none ${
                                templateSendSms
                                    ? 'bg-green-500/10 border-green-500/50'
                                    : isDark
                                    ? 'bg-slate-800 border-slate-700'
                                    : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                            <div>
                                <div className={`text-xs md:text-sm font-bold ${templateSendSms ? 'text-green-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                    ارسال پیامک اطلاع‌رسانی
                                </div>
                                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    ارسال پیامک انتساب ماموریت به مسئولین و ناظران مرحله اول
                                </div>
                            </div>
                            <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${templateSendSms ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${templateSendSms ? 'left-1' : 'right-1'}`} />
                            </div>
                        </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ناوبری استپر (فوتر چسبان مودال) */}
              <div className={`px-4 py-3 border-t flex items-center justify-between gap-3 shrink-0 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                {templateStep > 1 ? (
                  <button type="button" onClick={handleTemplatePrev} className={`w-28 rounded-xl py-2.5 text-xs font-bold border transition-colors ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    مرحله قبل
                  </button>
                ) : (
                  <button type="button" onClick={() => setShowTemplatePanel(false)} className={`w-28 rounded-xl py-2.5 text-xs font-bold border transition-colors ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    انصراف
                  </button>
                )}

                {templateStep < 3 ? (
                  <button type="button" onClick={handleTemplateNext} className="flex-1 max-w-[180px] rounded-xl py-2.5 text-xs font-bold transition-all bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20">
                    <span>مرحله بعد</span>
                    <FaArrowLeft size={11} />
                  </button>
                ) : (
                  <button onClick={submitTemplateTask} disabled={creating} className="flex-1 max-w-[200px] rounded-xl py-2.5 text-xs font-bold transition-all bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50">
                    {creating ? <><FaSpinner className="animate-spin" /> در حال ایجاد...</> : <><FaBolt size={13} /> ایجاد سریع ماموریت</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        )} 

        {/* سربرگ‌ها / Tabs */}
        <div className={`flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 mb-6 p-1.5 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <button
            onClick={() => handleTabChange('inbox')}
            className={`flex-1 min-w-[105px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-lg transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FaInbox size={15} />
            <span>دریافتی</span>
            {activeInboxTasks.length > 0 && (
              <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold">
                {activeInboxTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('sent')}
            className={`flex-1 min-w-[105px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-lg transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FaPaperPlane size={14} />
            <span>ارسالی</span>
            {activeSentTasks.length > 0 && (
              <span className={`${isDark ? 'bg-gray-600' : 'bg-gray-300 text-gray-800'} text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold`}>
                {activeSentTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('completed')}
            className={`flex-1 min-w-[105px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-lg transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FaCheckCircle size={14} />
            <span>اتمام یافته</span>
            {completedTasks.length > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold">
                {completedTasks.length}
              </span>
            )}
          </button>

          {isAdmin && (
            <button
              onClick={() => handleTabChange('all')}
              className={`flex-1 min-w-[115px] sm:min-w-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:py-3 rounded-lg transition-all font-medium text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FaListUl size={14} />
              <span>کل سازمان</span>
              {allTasks?.length > 0 && (
                <span className={`${isDark ? 'bg-gray-600' : 'bg-gray-300 text-gray-800'} text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold`}>
                  {allTasks.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* فیلترها و جستجو */}
        <div className={`p-3.5 sm:p-4 rounded-2xl border mb-6 space-y-3 ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3 items-stretch md:items-center">
            
            <div className={`flex-1 flex items-center gap-2 border rounded-xl px-3.5 py-2.5 transition-colors ${
              isDark ? 'bg-gray-900 border-gray-700 focus-within:border-blue-500' : 'bg-gray-50 border-gray-300 focus-within:border-blue-500'
            }`}>
              <FaSearch className={`${isDark ? 'text-gray-500' : 'text-gray-400'} shrink-0`} size={13} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجو در عنوان، توضیحات یا نام آمر..."
                className={`bg-transparent text-xs sm:text-sm flex-1 outline-none min-w-0 ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors shrink-0`}
                >
                  <FaTimes size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className={`grid ${activeTab === 'completed' ? 'grid-cols-1' : 'grid-cols-2'} gap-2 flex-1 md:flex md:items-center`}>
                
                {activeTab !== 'completed' && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs font-semibold min-w-0 ${
                    isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'
                  }`}>
                    <FaFilter className="text-blue-500 shrink-0" size={11} />
                    <span className="shrink-0 text-[11px] sm:text-xs">وضعیت:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-transparent outline-none cursor-pointer pr-0.5 font-bold flex-1 min-w-0 truncate text-[11px] sm:text-xs"
                    >
                      <option value="ALL" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>همه وضعیت‌ها</option>
                      <option value="PENDING" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>در انتظار</option>
                      <option value="IN_PROGRESS" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>در جریان</option>
                      {activeTab === 'all' && (
                        <option value="DONE" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>انجام شده</option>
                      )}
                      <option value="REJECTED" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>رد شده</option>
                      <option value="CANCELLED" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>لغو شده</option>
                    </select>
                  </div>
                )}

                <div className={`flex items-center gap-1.5 px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs font-semibold min-w-0 ${
                  isDark ? 'bg-gray-900 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'
                }`}>
                  <FaSortAmountDown className="text-purple-500 shrink-0" size={11} />
                  <span className="shrink-0 text-[11px] sm:text-xs">ترتیب:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer pr-0.5 font-bold flex-1 min-w-0 truncate text-[11px] sm:text-xs"
                  >
                    <optgroup label="تاریخ ایجاد" className={isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}>
                      <option value="created_desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>جدیدترین ایجاد</option>
                      <option value="created_asc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>قدیمی‌ترین ایجاد</option>
                    </optgroup>
                    <optgroup label="فوریت" className={isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}>
                      <option value="urgency_desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>بیشترین فوریت</option>
                      <option value="urgency_asc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>کمترین فوریت</option>
                    </optgroup>
                    <optgroup label="مهلت اقدام (ددلاین)" className={isDark ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}>
                      <option value="deadline_asc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>نزدیک‌ترین مهلت</option>
                      <option value="deadline_desc" className={isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>دورترین مهلت</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className={`shrink-0 p-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center ${
                    isDark 
                      ? 'border-gray-700 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'border-gray-300 bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="بازنشانی فیلترها"
                >
                  <FaUndo size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
            <span>نمایش <strong>{processedList.length}</strong> از مجموع <strong>{currentList.length}</strong> ماموریت</span>
            {activeTab !== 'completed' && statusFilter !== 'ALL' && (
              <span className="text-blue-500 font-bold">فیلتر وضعیت: {STATUS_LABELS[statusFilter]}</span>
            )}
            {activeTab === 'completed' && (
              <span className="text-emerald-500 font-bold">تمام ماموریت‌های خاتمه‌یافته</span>
            )}
          </div>
        </div>

        {/* لیست نمایش ماموریت‌ها */}
        {isListLoading ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-blue-500 text-4xl" />
          </div>
        ) : processedList.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
              {activeTab === 'completed' ? (
                <FaCheckCircle size={32} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
              ) : (
                <FaInbox size={32} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
              )}
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {hasActiveFilters
                ? 'هیچ ماموریتی با فیلترهای انتخابی یافت نشد'
                : activeTab === 'inbox'
                ? 'ماموریت دریافتی فعالی وجود ندارد'
                : activeTab === 'sent'
                ? 'ماموریت ارسالی در جریانی وجود ندارد'
                : activeTab === 'completed'
                ? 'هیچ ماموریت تکمیل‌شده‌ای ثبت نشده است'
                : 'هیچ ماموریتی در سازمان ثبت نشده است'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {hasActiveFilters ? (
                <button onClick={resetFilters} className="text-blue-500 underline font-bold mt-2">
                  پاکسازی فیلترها و مشاهده مجدد
                </button>
              ) : 'لیست مورد نظر در حال حاضر خالی است.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {processedList.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className={`border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all group relative ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-lg hover:shadow-blue-900/10'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm sm:text-base mb-2 transition-colors leading-tight ${isDark ? 'text-gray-100 group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                      <span className={`text-xs font-normal ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>عنوان:</span>
                      {task.title}
                    </h3>
                     
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                      <span className={`flex items-center gap-1 text-[11px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border ${STATUS_COLORS[task.status] || ''}`}>
                        <span className="font-normal opacity-75">وضعیت:</span>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                       
                      <span className={`flex items-center gap-1 text-[11px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border ${
                        isDark ? 'text-gray-300 bg-gray-900 border-gray-700' : 'text-gray-700 bg-gray-100 border-gray-300'
                      }`}>
                        <span className="font-normal opacity-75">نوع:</span>
                        {task.task_type_label || TASK_TYPE_LABELS[task.task_type] || task.task_type || 'بدون دسته‌بندی'}
                      </span>
                       
                      <span className={`text-[11px] sm:text-xs font-medium px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border ${URGENCY_COLORS[task.urgency] || ''}`}>
                        فوریت: {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAdmin && activeTab === 'all' && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(e, task.id, task.title)}
                        disabled={deletingId === task.id}
                        className={`p-2 rounded-xl border transition-colors ${
                          isDark 
                            ? 'border-red-900/40 bg-red-900/20 text-red-400 hover:bg-red-800/40 hover:border-red-600' 
                            : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                        title="حذف ماموریت"
                      >
                        {deletingId === task.id ? <FaSpinner className="animate-spin" size={13} /> : <FaTrash size={13} />}
                      </button>
                    )}
                    <FaChevronLeft className={`transition-colors shrink-0 mt-1 ${isDark ? 'text-gray-600 group-hover:text-blue-500' : 'text-gray-400 group-hover:text-blue-600'}`} />
                  </div>
                </div>

                {task.note && (
                  <>
                    <div className={`w-1/2 my-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>
                    <p className={`text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.note}
                    </p>
                  </>
                )}
                 
                <div className={`flex flex-wrap items-center justify-between gap-4 text-xs mt-4 pt-3 border-t ${isDark ? 'border-gray-700/50 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-1.5">
                      <FaClock className={isDark ? 'text-gray-500' : 'text-gray-400'} size={12} />
                      <span>تاریخ ایجاد: <span dir="ltr" className={isDark ? 'text-gray-200' : 'text-gray-800'}>{moment(task.created_at).format('jYYYY/jMM/jDD - HH:mm')}</span></span>
                    </div>
                     
                    {task.deadline && (
                      <div className="flex items-center gap-1.5 text-orange-500 font-medium">
                        <FaClock size={12} />
                        <span>مهلت نهایی: <span dir="ltr">{moment(task.deadline).format('jYYYY/jMM/jDD - HH:mm')}</span></span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mr-auto sm:mr-0">
                    {task.created_by_name && (
                      <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                        isDark ? 'bg-gray-900/80 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <CircleAvatar 
                          user={{ id: task.created_by_id, name: task.created_by_name, avatar_url: task.created_by_avatar }} 
                          isDark={isDark} 
                          roleLabel="آمر"
                          size="w-6 h-6 text-[9px]"
                        />
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] text-gray-400">آمر:</span>
                          <span className={`text-[11px] font-bold truncate max-w-[90px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {task.created_by_name}
                          </span>
                        </div>
                      </div>
                    )}

                    {task.assignees_list && task.assignees_list.length > 0 && (
                      <div className="relative">
                        <div 
                          onClick={(e) => toggleDropdown(e, task.id, 'assignees')}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${
                            openDropdown?.taskId === task.id && openDropdown?.type === 'assignees'
                              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-500/10'
                              : isDark 
                              ? 'bg-blue-950/25 border-blue-900/40 hover:bg-blue-900/30' 
                              : 'bg-blue-50/70 border-blue-200 hover:bg-blue-100/70'
                          }`}
                        >
                          <span className="text-[10px] text-blue-500 font-bold">مجریان:</span>
                          <div className="flex items-center -space-x-1.5 space-x-reverse overflow-hidden py-0.5">
                            {task.assignees_list.slice(0, 3).map((user, idx) => (
                              <CircleAvatar key={`${user.id}-${idx}`} user={user} isDark={isDark} roleLabel="مجری" size="w-5 h-5 text-[8px]" />
                            ))}
                            {task.assignees_list.length > 3 && (
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border shadow-sm shrink-0 z-10 ${
                                isDark ? 'bg-blue-900 text-blue-200 border-gray-800' : 'bg-blue-200 text-blue-800 border-white'
                              }`}>
                                +{task.assignees_list.length - 3}
                              </div>
                            )}
                          </div>
                          <FaChevronDown size={9} className={`text-blue-500 transition-transform ${openDropdown?.taskId === task.id && openDropdown?.type === 'assignees' ? 'rotate-180' : ''}`} />
                        </div>

                        {openDropdown?.taskId === task.id && openDropdown?.type === 'assignees' && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute left-0 bottom-full mb-2 w-72 rounded-2xl p-3 shadow-2xl border z-50 text-right backdrop-blur-md ${
                              isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                              <span className="font-bold text-xs flex items-center gap-1.5 text-blue-500">
                                <FaUser size={10} /> مجریان پرونده ({task.assignees_list.length})
                              </span>
                              <span className="text-[9px] text-gray-400">مرحله و اقدام</span>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-blue-500/30">
                              {task.assignees_list.map((u, i) => {
                                const stCfg = ASSIGNEE_STATE_CONFIG[u.state] || { label: u.state, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
                                return (
                                  <div key={i} className={`flex items-center justify-between p-2 rounded-xl border text-xs gap-2 ${
                                    isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <CircleAvatar user={u} isDark={isDark} size="w-7 h-7 text-[10px]" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-xs truncate">{u.name}</span>
                                        <span className="text-[10px] text-gray-400 truncate">{u.stage_name}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${stCfg.color}`}>
                                        {stCfg.label}
                                      </span>
                                      {u.acted_at && (
                                        <span className="text-[8px] text-gray-400 mt-0.5">
                                          {moment(u.acted_at).format('jMM/jDD HH:mm')}
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
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${
                            openDropdown?.taskId === task.id && openDropdown?.type === 'approvers'
                              ? 'ring-2 ring-purple-500 border-purple-500 bg-purple-500/10'
                              : isDark 
                              ? 'bg-purple-950/25 border-purple-900/40 hover:bg-purple-900/30' 
                              : 'bg-purple-50/70 border-purple-200 hover:bg-purple-100/70'
                          }`}
                        >
                          <span className="text-[10px] text-purple-500 font-bold">تاییدکنندگان:</span>
                          <div className="flex items-center -space-x-1.5 space-x-reverse overflow-hidden py-0.5">
                            {task.approvers_list.slice(0, 3).map((user, idx) => (
                              <CircleAvatar key={`${user.id}-${idx}`} user={user} isDark={isDark} roleLabel="ناظر" size="w-5 h-5 text-[8px]" />
                            ))}
                            {task.approvers_list.length > 3 && (
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold border shadow-sm shrink-0 z-10 ${
                                isDark ? 'bg-purple-900 text-purple-200 border-gray-800' : 'bg-purple-200 text-purple-800 border-white'
                              }`}>
                                +{task.approvers_list.length - 3}
                              </div>
                            )}
                          </div>
                          <FaChevronDown size={9} className={`text-purple-500 transition-transform ${openDropdown?.taskId === task.id && openDropdown?.type === 'approvers' ? 'rotate-180' : ''}`} />
                        </div>

                        {openDropdown?.taskId === task.id && openDropdown?.type === 'approvers' && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className={`absolute left-0 bottom-full mb-2 w-72 rounded-2xl p-3 shadow-2xl border z-50 text-right backdrop-blur-md ${
                              isDark ? 'bg-slate-900/95 border-slate-700 text-white' : 'bg-white/95 border-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/50 dark:border-gray-700/50">
                              <span className="font-bold text-xs flex items-center gap-1.5 text-purple-500">
                                <FaCheckCircle size={10} /> ناظران و تاییدکنندگان ({task.approvers_list.length})
                              </span>
                              <span className="text-[9px] text-gray-400">مرحله و وضعیت</span>
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-purple-500/30">
                              {task.approvers_list.map((u, i) => {
                                const apCfg = APPROVER_STATUS_CONFIG[u.status] || { label: u.status, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
                                return (
                                  <div key={i} className={`flex items-center justify-between p-2 rounded-xl border text-xs gap-2 ${
                                    isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                      <CircleAvatar user={u} isDark={isDark} size="w-7 h-7 text-[10px]" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-xs truncate">{u.name}</span>
                                        <span className="text-[10px] text-gray-400 truncate">{u.stage_name}</span>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${apCfg.color}`}>
                                        {apCfg.label}
                                      </span>
                                      {u.acted_at && (
                                        <span className="text-[8px] text-gray-400 mt-0.5">
                                          {moment(u.acted_at).format('jMM/jDD HH:mm')}
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

                    {(!task.assignees_list || task.assignees_list.length === 0) && task.active_assignees?.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 rounded-md text-yellow-600 dark:text-yellow-500 font-bold">
                        <span className="text-[10px] animate-pulse">●</span>
                        <span>{task.active_assignees.length} نفر در انتظار</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🌟 پنل مودال تمام‌صفحه اختصاصی موبایل برای انتخاب پرسنل بدون فشرده‌شدن در کارت */}
      {pickerOpenMobile && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-end md:hidden">
          <div 
            className={`w-full h-[90vh] max-h-[90vh] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl border-t ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'
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