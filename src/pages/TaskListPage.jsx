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
  fetchAllTasksAdmin // 👈 اضافه شده
} from '../features/task/taskSlice';
import TaskWorkflowCreateModal from '../components/Task/TaskWorkflowCreateModal';
import AssigneePickerPanel, { AssigneeChip } from '../components/Task/AssigneePickerPanel';
import {
  FaInbox, FaPaperPlane, FaPlus, FaSpinner, FaClock, FaUser, FaChevronLeft,
  FaSearch, FaTimes, FaLayerGroup, FaBolt, FaLock, FaSitemap, FaTrash, FaAlignRight, FaPaperclip, FaArrowLeft, FaListUl
} from 'react-icons/fa';

const TASK_TYPE_LABELS = { PAYROLL_FORM: 'تکمیل فرم حقوق', PURCHASE: 'خرید/تدارکات', REPORT: 'گزارش‌دهی' };
const STATUS_COLORS = { PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/30', DONE: 'bg-green-500/10 text-green-500 border-green-500/30', REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30', CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/30' };
const STATUS_LABELS = { PENDING: 'در انتظار', IN_PROGRESS: 'در جریان', DONE: 'انجام شده', REJECTED: 'رد شده', CANCELLED: 'لغو شده' };
const URGENCY_LABELS = { LOW: 'کم', MEDIUM: 'متوسط', HIGH: 'زیاد', CRITICAL: 'بحرانی' };
const URGENCY_COLORS = { LOW: 'bg-gray-500/10 text-gray-400 border-gray-500/30', MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/30', HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30', CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30' };
const URGENCY_OPTIONS = [ { value: 'LOW', label: 'کم' }, { value: 'MEDIUM', label: 'متوسط' }, { value: 'HIGH', label: 'زیاد' }, { value: 'CRITICAL', label: 'بحرانی' } ];
const APPROVAL_RULES = [ { value: 'ANY_ASSIGNEE', label: 'تایید توسط یک نفر کافیست' }, { value: 'ALL_ASSIGNEES', label: 'تایید همه اجباری است' } ];
const APPROVER_RULES = [ { value: 'ALL_APPROVERS', label: 'تایید همه اجباری است' }, { value: 'ANY_APPROVER', label: 'تایید توسط یک نفر کافیست' } ];

const TaskListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'inbox';

  const { userInfo } = useSelector((state) => state.userLogin);
  const isAdmin = userInfo?.is_admin || userInfo?.is_staff || userInfo?.is_superuser;
  
  // 👈 اضافه شدن allTasks و loadingAllTasks
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
  
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateFormData, setTemplateFormData] = useState({ title: '', note: '', task_type: '', urgency: 'MEDIUM' });

  // === استیت‌های ورک‌فلو ===
  const [stages, setStages] = useState([
    { id: 'stage-1', stageName: 'مرحله ۱', description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS' }
  ]);
  const [activeElement, setActiveElement] = useState({ id: 'stage-1', type: 'STAGE' });

  // 👈 آپدیت افکت برای تب سوم
  useEffect(() => {
    if (userInfo) {
      if (activeTab === 'inbox') dispatch(fetchMyTaskInbox());
      else if (activeTab === 'sent') dispatch(fetchSentTasks());
      else if (activeTab === 'all' && isAdmin) dispatch(fetchAllTasksAdmin());
    }
  }, [dispatch, userInfo, activeTab, isAdmin]);

  useEffect(() => {
    if (showTemplatePanel) {
      if (templates.length === 0) dispatch(fetchTaskTemplates());
      if (taskTypes.length === 0) dispatch(fetchTaskTypes());
      if (subordinates?.length === 0) dispatch(fetchSubordinates());
    }
  }, [showTemplatePanel, dispatch, templates.length, taskTypes.length, subordinates?.length]);

  // 👈 بهینه‌سازی: تشخیص لیست و وضعیت لودینگ جاری
  const currentList = activeTab === 'inbox' ? inbox : activeTab === 'sent' ? sentTasks : (allTasks || []);
  const isListLoading = activeTab === 'inbox' ? loadingInbox : activeTab === 'sent' ? loadingSent : loadingAllTasks;

  // 👈 بهینه‌سازی: استفاده از useMemo برای فیلتر کردن (جلوگیری از افت پرفورمنس در لیست‌های طولانی)
  const filteredList = useMemo(() => {
    if (!search.trim()) return currentList;
    const s = search.toLowerCase();
    return currentList.filter((t) => 
      t.title?.toLowerCase().includes(s) || 
      t.note?.toLowerCase().includes(s) || 
      t.created_by_name?.toLowerCase().includes(s) || 
      (URGENCY_LABELS[t.urgency] || '').toLowerCase().includes(s)
    );
  }, [currentList, search]);

  const handleTabChange = (tab) => { setSearchParams({ tab }); setSearch(''); };
  const handleTaskClick = (taskId) => navigate(`/tasks/${taskId}`, { state: { returnTab: activeTab } });
  
  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setShowTemplatePanel(false);
    dispatch(fetchMyTaskInbox());
    dispatch(fetchSentTasks());
  };

  const handleSelectTemplate = (e) => {
    const tmplId = e.target.value;
    if (!tmplId) {
      setSelectedTemplate(null);
      setTemplateFormData({ title: '', note: '', task_type: '', urgency: 'MEDIUM' });
      setStages([{ id: 'stage-1', stageName: 'مرحله ۱', description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS' }]);
      return;
    }
    const tmpl = templates.find(t => t.id === parseInt(tmplId));
    setSelectedTemplate(tmpl);
    
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
            stageName: s.stage_name || '',
            description: s.description || '',
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

  const isFrozen = (field) => selectedTemplate?.template_data && selectedTemplate.template_data[field] !== undefined;
  const isStagesFrozen = isFrozen('workflow_stages');

  const handleAddStage = () => {
    if (isStagesFrozen) return;
    const newId = `stage-${Date.now()}`;
    setStages([...stages, { id: newId, stageName: `مرحله ${stages.length + 1}`, description: '', deadlineDate: '', deadlineTime: '23:59', requireFile: false, assignees: [], approvalRule: 'ANY_ASSIGNEE', nextStageApprovers: [], approverRule: 'ALL_APPROVERS' }]);
    setActiveElement({ id: newId, type: 'STAGE' });
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

  const getActiveStageNameForPicker = () => {
      const stage = stages.find(s => s.id === activeElement.id);
      if (!stage) return '';
      return activeElement.type === 'STAGE' ? stage.stageName : `تاییدیه بعد از ${stage.stageName}`;
  };

  const submitTemplateTask = async () => {
    if (!selectedTemplate) return;
    for (const stage of stages) {
      if (!stage.stageName.trim()) return alert('نام تمامی مراحل باید وارد شود.');
      if (stage.assignees.length === 0) return alert(`لطفاً برای ${stage.stageName} حداقل یک مسئول انتخاب کنید.`);
    }

    const allStageDeadlines = stages.filter(s => s.deadlineDate).map(s => `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00`).sort();
    const finalTaskDeadline = allStageDeadlines.length > 0 ? allStageDeadlines[allStageDeadlines.length - 1] : null;

    const finalPayload = {
      ...selectedTemplate.template_data,
      title: templateFormData.title,
      task_type: templateFormData.task_type,
      urgency: templateFormData.urgency,
      note: templateFormData.note,
      deadline: finalTaskDeadline,
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
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`} dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/30"><FaInbox size={18} /></div>
            ماموریت‌های من
          </h1>
          <div className="flex gap-2">
            {isAdmin && (
              <button onClick={() => { setShowTemplatePanel(!showTemplatePanel); setShowCreateModal(false); }} className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors font-bold border ${showTemplatePanel ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-900/30' : isDark ? 'bg-gray-800 text-purple-400 border-gray-700 hover:bg-gray-700' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}>
                <FaBolt size={14} /><span className="hidden sm:inline">اجرای سریع قالب</span>
              </button>
            )}
            <button onClick={() => { setShowCreateModal(true); setShowTemplatePanel(false); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/30">
              <FaPlus size={14} /><span className="hidden sm:inline">ماموریت جدید (کامل)</span>
            </button>
          </div>
        </div>

        {/* پنل قالب‌های سریع */}
        {showTemplatePanel && isAdmin && (
          <div className={`mb-6 p-4 rounded-xl border transition-all ${isDark ? 'bg-gray-800/90 border-purple-500/40 shadow-lg' : 'bg-white border-purple-200 shadow-md'}`}>
            <div className="flex items-center justify-between mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500"><FaLayerGroup size={12} /></div>
                <h2 className={`font-bold text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>انتخاب و اجرای سریع قالب</h2>
              </div>
              <button onClick={() => setShowTemplatePanel(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors" title="بستن">
                <FaTimes size={16} />
              </button>
            </div>
            
            <div className="flex flex-col w-full">
              {/* بخش بالا: انتخاب قالب */}
              <div className={`flex flex-col md:flex-row md:items-center gap-4 mb-5 pb-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="w-full md:w-1/3">
                  <label className="block text-sm mb-1.5 font-bold">قالب را انتخاب کنید</label>
                  <div className="flex items-center gap-2">
                      <select onChange={handleSelectTemplate} className={`flex-1 p-2.5 text-sm rounded-lg border outline-none cursor-pointer ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300'}`}>
                        <option value="">-- انتخاب قالب ذخیره شده --</option>
                        {templates?.map(t => <option key={t.id} value={t.id}>{t.template_name} {t.is_global ? '(عمومی)' : ''}</option>)}
                      </select>
                      
                      {selectedTemplate && isAdmin && (
                          <button
                              onClick={handleDeleteTemplate}
                              className={`shrink-0 p-3 rounded-lg border flex items-center justify-center transition-colors ${
                                  isDark ? 'border-red-900/50 bg-red-900/20 text-red-500 hover:bg-red-900/40' : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                              }`}
                              title="حذف این قالب"
                          >
                              <FaTrash size={14} />
                          </button>
                      )}
                  </div>
                </div>
                
                {selectedTemplate && (
                   <div className={`w-full md:w-2/3 flex items-center gap-2 p-3 rounded-lg border text-xs ${isDark ? 'bg-purple-900/20 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                      <FaLock size={14} className="shrink-0" />
                      <span>فیلدهای قفل‌شده غیرقابل تغییرند؛ فقط می‌توانید <strong>مسئولین</strong> و <strong>مهلت انجام</strong> مراحل را تعیین کنید.</span>
                   </div>
                )}
              </div>

              {/* بخش پایین: فرم اصلی */}
              <div className="w-full space-y-3">
                {selectedTemplate ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="flex items-center gap-1.5 text-xs mb-1.5 font-bold">عنوان ماموریت {isFrozen('title') && <FaLock className="text-purple-500 text-[10px]" />}</label>
                                <input type="text" value={templateFormData.title} onChange={(e) => setTemplateFormData({...templateFormData, title: e.target.value})} disabled={isFrozen('title')} className={`w-full p-2.5 text-sm rounded-lg border outline-none ${isFrozen('title') ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'}`} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs mb-1.5 font-bold">دسته‌بندی {isFrozen('task_type') && <FaLock className="text-purple-500 text-[10px]" />}</label>
                                    <select value={templateFormData.task_type} onChange={(e) => setTemplateFormData({...templateFormData, task_type: e.target.value})} disabled={isFrozen('task_type')} className={`w-full p-2.5 text-sm rounded-lg border outline-none ${isFrozen('task_type') ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'}`}>
                                        <option value="">انتخاب...</option>
                                        {taskTypes?.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs mb-1.5 font-bold">فوریت {isFrozen('urgency') && <FaLock className="text-purple-500 text-[10px]" />}</label>
                                    <select value={templateFormData.urgency} onChange={(e) => setTemplateFormData({...templateFormData, urgency: e.target.value})} disabled={isFrozen('urgency')} className={`w-full p-2.5 text-sm rounded-lg border outline-none ${isFrozen('urgency') ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'}`}>
                                        {URGENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* طراحی مراحل */}
                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-blue-500">
                                <FaSitemap size={14} /> طراحی/تخصیص مراحل {isStagesFrozen && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-lg ml-2">ساختار فریز شده</span>}
                            </h4>
                            
                            <div className="flex flex-col xl:flex-row gap-4 h-auto xl:h-[480px]">
                                {/* خط مونتاژ مراحل */}
                                <div className={`flex-1 overflow-x-auto overflow-y-auto pb-2 px-2 flex items-start gap-3 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-gray-200'}`}>
                                    {stages.map((stage, index) => (
                                        <React.Fragment key={stage.id}>
                                            <div
                                                onClick={() => setActiveElement({ id: stage.id, type: 'STAGE' })}
                                                className={`shrink-0 w-[300px] rounded-xl border-2 flex flex-col cursor-pointer shadow-sm my-2 transition-all
                                                ${activeElement.id === stage.id && activeElement.type === 'STAGE'
                                                    ? 'border-blue-500 ' + (isDark ? 'bg-slate-800' : 'bg-blue-50/30') 
                                                    : 'border-slate-600/50 ' + (isDark ? 'bg-slate-800/60' : 'bg-white')}`}
                                            >
                                                <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-black/5 rounded-t-lg">
                                                    <span className="text-sm font-bold text-gray-500">مرحله {index + 1}</span>
                                                    {!isStagesFrozen && stages.length > 1 && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveStage(stage.id); }} className="text-red-400 hover:text-red-500 p-1"><FaTrash size={14} /></button>
                                                    )}
                                                </div>
                                                <div className="p-4 flex flex-col gap-4 max-h-[380px] overflow-y-auto">
                                                    <input 
                                                        type="text" value={stage.stageName} onChange={e => updateStageField(stage.id, 'stageName', e.target.value)} disabled={isStagesFrozen}
                                                        placeholder="نام مرحله..." className={`w-full text-sm font-bold pb-2 border-b outline-none bg-transparent ${isStagesFrozen ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'text-white border-slate-600' : 'text-gray-900 border-gray-300'}`} 
                                                    />
                                                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                        <FaAlignRight className="text-gray-400 text-sm shrink-0" />
                                                        <input 
                                                            type="text" value={stage.description} onChange={e => updateStageField(stage.id, 'description', e.target.value)} disabled={isStagesFrozen}
                                                            placeholder="شرح وظیفه..." className={`w-full text-xs outline-none bg-transparent ${isStagesFrozen ? 'opacity-70 cursor-not-allowed text-gray-500' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <label className={`flex-1 flex items-center justify-center px-1.5 py-2.5 rounded-lg border transition-colors ${stage.requireFile ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : (isDark ? 'bg-slate-900/50 border-slate-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500')} ${isStagesFrozen ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                            <input type="checkbox" checked={stage.requireFile} onChange={e => updateStageField(stage.id, 'requireFile', e.target.checked)} disabled={isStagesFrozen} className="hidden" />
                                                            <FaPaperclip size={12} className="mr-1" /><span className="text-xs font-bold">فایل اجباری</span>
                                                        </label>
                                                        <select value={stage.approvalRule} onChange={e => updateStageField(stage.id, 'approvalRule', e.target.value)} disabled={isStagesFrozen} className={`flex-[2] text-xs px-2 py-2.5 rounded-lg border outline-none ${isStagesFrozen ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-white border-gray-300 text-gray-700'}`}>
                                                            {APPROVAL_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                        </select>
                                                    </div>
                                                    
                                                    <div className="flex flex-col gap-1.5 mt-1">
                                                        <span className="text-xs font-bold text-gray-500">مهلت انجام (اختیاری):</span>
                                                        <div className="flex gap-2">
                                                            <div className={`flex-1 rounded-lg border transition-colors focus-within:border-blue-500 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                                <JalaliDatePicker
                                                                    value={stage.deadlineDate}
                                                                    onChange={(e) => updateStageField(stage.id, 'deadlineDate', e.target ? e.target.value : e)}
                                                                    placeholder="انتخاب تاریخ"
                                                                    className={`w-full px-3 py-2.5 text-xs outline-none bg-transparent ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                                                                />
                                                            </div>
                                                            <div className={`w-[110px] rounded-lg border transition-colors focus-within:border-blue-500 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                                <input 
                                                                    type="time" 
                                                                    value={stage.deadlineTime} 
                                                                    onChange={(e) => updateStageField(stage.id, 'deadlineTime', e.target.value)} 
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
                                                                return emp ? <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'STAGE', id)} /> : <span key={empId} className="text-xs">کاربر {empId}</span>;
                                                            })}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center justify-center px-2 self-center my-2">
                                                <div 
                                                    onClick={() => setActiveElement({ id: stage.id, type: 'LINK' })}
                                                    className={`w-44 min-h-[150px] rounded-xl border-2 flex flex-col items-center p-3 cursor-pointer transition-all ${
                                                        activeElement.id === stage.id && activeElement.type === 'LINK'
                                                        ? 'border-orange-500 bg-orange-500/10' : 'border-dashed border-orange-500/50 bg-orange-500/5'
                                                    }`}
                                                >
                                                    <span className="text-xs font-bold text-orange-500 mb-2">تاییدیه (اختیاری)</span>
                                                    <select value={stage.approverRule} onChange={(e) => updateStageField(stage.id, 'approverRule', e.target.value)} disabled={isStagesFrozen} onClick={e => e.stopPropagation()} className={`w-full text-xs p-2 mb-3 rounded-lg border outline-none ${isStagesFrozen ? 'opacity-70 cursor-not-allowed' : ''} ${isDark ? 'bg-slate-900 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                                        {APPROVER_RULES.map(rule => <option key={rule.value} value={rule.value}>{rule.label}</option>)}
                                                    </select>
                                                    <div className="flex-1 flex flex-col gap-2 w-full items-center justify-center">
                                                        {stage.nextStageApprovers.length === 0 ? (
                                                            <div className="text-orange-500/40 flex flex-col items-center"><FaArrowLeft size={16} className="mb-1" /><span className="text-xs">مستقیم</span></div>
                                                        ) : (
                                                            <div className="w-full flex flex-wrap gap-1.5 items-center justify-center">
                                                                {stage.nextStageApprovers.map(empId => {
                                                                    const emp = subordinates?.find(e => e.user_id === empId);
                                                                    return emp ? <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'LINK', id)} /> : <span key={empId} className="text-xs">کاربر {empId}</span>;
                                                                })}
                                                                <FaArrowLeft size={12} className="text-orange-500 mt-2" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                    {!isStagesFrozen && (
                                        <div className="shrink-0 flex items-center pl-2 self-stretch my-2">
                                            <button onClick={handleAddStage} className={`w-[60px] h-full min-h-[150px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${isDark ? 'border-slate-700 hover:border-blue-500 text-slate-500' : 'border-gray-300 hover:border-blue-500 text-gray-400'}`}>
                                                <FaPlus size={20} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className={`w-full xl:w-[320px] shrink-0 border rounded-xl overflow-hidden shadow-sm ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                                    <AssigneePickerPanel
                                        subordinates={subordinates || []}
                                        loading={loadingSubordinates}
                                        selectedIds={activeSelectedIds}
                                        onChange={handleAssigneeChange}
                                        activeStageName={getActiveStageNameForPicker()}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm mb-1.5 font-bold">توضیحات کلی ماموریت {isFrozen('note') && <FaLock className="text-purple-500 text-xs inline" />}</label>
                            <textarea rows={2} value={templateFormData.note} onChange={(e) => setTemplateFormData({...templateFormData, note: e.target.value})} disabled={isFrozen('note')} className={`w-full p-3 text-sm rounded-lg border outline-none resize-none ${isFrozen('note') ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-900 border-gray-600' : 'bg-white border-gray-300'}`} />
                        </div>

                        <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700 mt-3">
                            <button onClick={submitTemplateTask} disabled={creating || !templateFormData.title || !templateFormData.task_type} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-sm rounded-lg font-bold shadow-md disabled:opacity-50">
                                {creating ? <FaSpinner className="animate-spin" /> : <FaBolt size={14} />} ایجاد سریع ماموریت
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[150px] opacity-50">
                        <FaLayerGroup size={40} className="mb-4 text-gray-400" />
                        <p className="text-base font-bold">ابتدا یک قالب را انتخاب کنید</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================= تب‌ها ======================= */}
        <div className={`flex gap-2 mb-6 p-1.5 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <button
            onClick={() => handleTabChange('inbox')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FaInbox size={16} />
            <span>دریافتی</span>
            {inbox.length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {inbox.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('sent')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FaPaperPlane size={16} />
            <span>ارسالی</span>
            {sentTasks.length > 0 && (
              <span className={`${isDark ? 'bg-gray-600' : 'bg-gray-300 text-gray-800'} text-xs px-2 py-0.5 rounded-full font-bold`}>
                {sentTasks.length}
              </span>
            )}
          </button>

          {/* 👈 تب اضافه شده برای ادمین (کل سازمان) */}
          {isAdmin && (
            <button
              onClick={() => handleTabChange('all')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : isDark
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FaListUl size={16} />
              <span>کل سازمان (ادمین)</span>
              {allTasks?.length > 0 && (
                <span className={`${isDark ? 'bg-gray-600' : 'bg-gray-300 text-gray-800'} text-xs px-2 py-0.5 rounded-full font-bold`}>
                  {allTasks.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* جستجو */}
        <div className="mb-6">
          <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 transition-colors ${
            isDark ? 'bg-gray-800 border-gray-700 focus-within:border-blue-500' : 'bg-white border-gray-300 focus-within:border-blue-500'
          }`}>
            <FaSearch className={`${isDark ? 'text-gray-500' : 'text-gray-400'} shrink-0`} size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، توضیحات یا سازنده..."
              className={`bg-transparent text-sm flex-1 outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </div>

        {/* لیست task‌ها (با استفاده از متغیر ایزوله شده isListLoading) */}
        {isListLoading ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-blue-500 text-4xl" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <FaInbox size={32} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {search.trim()
                ? 'نتیجه‌ای یافت نشد'
                : activeTab === 'inbox'
                ? 'ماموریت دریافتی وجود ندارد'
                : activeTab === 'sent'
                ? 'ماموریت ارسالی وجود ندارد'
                : 'هیچ ماموریتی در سازمان ثبت نشده است'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {search.trim() ? 'عبارت دیگری را جستجو کنید' : 'لیست مورد نظر در حال حاضر خالی است.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className={`border rounded-2xl p-5 cursor-pointer transition-all group ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-lg hover:shadow-blue-900/10'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
              <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base mb-2 transition-colors leading-tight ${isDark ? 'text-gray-100 group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                      <span className={`text-xs font-normal ml-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>عنوان:</span>
                      {task.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border ${STATUS_COLORS[task.status] || ''}`}>
                        <span className="font-normal opacity-75">وضعیت:</span>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                      
                      <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border ${
                        isDark ? 'text-gray-300 bg-gray-900 border-gray-700' : 'text-gray-700 bg-gray-100 border-gray-300'
                      }`}>
                        <span className="font-normal opacity-75">نوع:</span>
                        {task.task_type_label || TASK_TYPE_LABELS[task.task_type] || task.task_type || 'بدون دسته‌بندی'}
                      </span>
                      
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${URGENCY_COLORS[task.urgency] || ''}`}>
                        فوریت: {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                      </span>
                    </div>
                  </div>
                  <FaChevronLeft className={`transition-colors shrink-0 mt-1 ${isDark ? 'text-gray-600 group-hover:text-blue-500' : 'text-gray-400 group-hover:text-blue-600'}`} />
                </div>

                {task.note && (
                  <>
                    <div className={`w-1/2 my-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>
                    <p className={`text-sm mb-3 line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {task.note}
                    </p>
                  </>
                )}
                
                <div className={`flex flex-wrap items-center gap-4 text-xs mt-4 pt-3 border-t ${isDark ? 'border-gray-700/50 text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                  {task.created_by_name && (
                    <div className="flex items-center gap-1.5">
                      <FaUser className={isDark ? 'text-gray-500' : 'text-gray-400'} size={12} />
                      <span>آمر: <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{task.created_by_name}</span></span>
                    </div>
                  )}

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
                  
                  {task.active_assignees?.length > 0 && (
                    <div className="flex items-center gap-1.5 mr-auto bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 rounded-md text-yellow-600 dark:text-yellow-500 font-bold">
                      <span className="text-[10px] animate-pulse">●</span>
                      <span>{task.active_assignees.length} نفر در انتظار اقدام</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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