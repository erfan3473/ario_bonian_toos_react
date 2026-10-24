import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment-jalaali';
import { fetchSubordinates, createTask, clearCreateSuccess, clearTaskError, fetchTaskTypes, createTaskType } from '../../features/task/taskSlice';
import AssigneePickerPanel, { AssigneeChip } from './AssigneePickerPanel';
import JalaliDatePicker from '../common/JalaliDatePicker';
import VoiceInputButton from '../common/VoiceInputButton';
import { 
  FaTimes, FaSpinner, FaArrowLeft, FaPlus, FaCheckCircle, 
  FaTrash, FaSitemap, FaPaperclip, FaClock, FaAlignRight, 
  FaInfoCircle, FaCheck, FaCog, FaUserPlus, FaChevronLeft 
} from 'react-icons/fa';

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'کم' },
  { value: 'MEDIUM', label: 'متوسط' },
  { value: 'HIGH', label: 'زیاد' },
  { value: 'CRITICAL', label: 'بحرانی' },
];

const APPROVAL_RULES = [
    { value: 'ANY_ASSIGNEE', label: 'تایید توسط یک نفر کافیست' },
    { value: 'ALL_ASSIGNEES', label: 'تایید همه اجباری است' },
];
const APPROVER_RULES = [
    { value: 'ALL_APPROVERS', label: 'تایید همه اجباری است' },
    { value: 'ANY_APPROVER', label: 'تایید توسط یک نفر کافیست' },
];

const TaskWorkflowCreateModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();
  
  const subordinates = useSelector(s => s.task.subordinates);
  const loadingSubordinates = useSelector(s => s.task.loadingSubordinates);
  const creating = useSelector(s => s.task.creating);
  const createSuccess = useSelector(s => s.task.createSuccess);
  const taskTypeOptions = useSelector(s => s.task.taskTypes || []);
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  // --- استیت کنترل مراحل (تب‌بندی 3 مرحله‌ای) ---
  const [currentStep, setCurrentStep] = useState(1); // 1: اطلاعات پایه، 2: گردش کار و مراحل، 3: تنظیمات و پیوست
  const [pickerOpenMobile, setPickerOpenMobile] = useState(false); // کنترل نمایش پنل پرسنل در موبایل

  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('');
  const [note, setNote] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [files, setFiles] = useState([]);
  const [urgency, setUrgency] = useState('MEDIUM');
  const [validationErrors, setValidationErrors] = useState({});
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [isAddingType, setIsAddingType] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState('');
  
  const [stages, setStages] = useState([
      { 
          id: Date.now(), 
          stageName: 'مرحله ۱', 
          description: '', 
          deadlineDate: '', 
          deadlineTime: '23:59', 
          requireFile: false,
          assignees: [], 
          approvalRule: 'ANY_ASSIGNEE', 
          nextStageApprovers: [], 
          approverRule: 'ALL_APPROVERS'
      }
  ]);
  
  const [activeElement, setActiveElement] = useState({ id: stages[0].id, type: 'STAGE' }); 

  useEffect(() => {
    dispatch(fetchSubordinates());
    dispatch(fetchTaskTypes());
    return () => { 
        dispatch(clearTaskError()); 
        dispatch(clearCreateSuccess()); 
    };
  }, [dispatch]);

  useEffect(() => { 
    if (createSuccess) setTimeout(() => onSuccess(), 800);
  }, [createSuccess, onSuccess]);

  // --- اعتبارسنجی گام‌به‌گام ---
  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!title.trim()) errors.title = 'عنوان ماموریت الزامی است';
      else if (title.trim().length < 3) errors.title = 'عنوان باید حداقل ۳ کاراکتر باشد';
      if (!taskType) errors.taskType = 'انتخاب دسته‌بندی الزامی است';
    } else if (step === 2) {
      stages.forEach((stage, index) => {
        if (stage.assignees.length === 0) {
          errors[`stage_${stage.id}`] = `مسئولین مرحله ${index + 1} خالی است`;
        }
      });
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setPickerOpenMobile(false);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setPickerOpenMobile(false);
  };

  const handleAddStage = () => {
      const newId = Date.now();
      setStages(prev => [...prev, { 
          id: newId, 
          stageName: `مرحله ${prev.length + 1}`, 
          description: '',
          deadlineDate: '',
          deadlineTime: '23:59',
          requireFile: false,
          assignees: [], 
          approvalRule: 'ANY_ASSIGNEE', 
          nextStageApprovers: [], 
          approverRule: 'ALL_APPROVERS'
      }]);
      setActiveElement({ id: newId, type: 'STAGE' });
  };

  const handleRemoveStage = (id) => {
      if (stages.length === 1) return;
      const newStages = stages.filter(s => s.id !== id);
      setStages(newStages);
      if (activeElement.id === id) setActiveElement({ id: newStages[0].id, type: 'STAGE' });
  };

  const updateStageField = (id, field, value) => {
      setStages(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
    
  const handleRemoveAssignee = (stageId, type, empIdToRemove) => {
      setStages(prev => prev.map(s => {
          if (s.id === stageId) {
              if (type === 'STAGE') {
                  return { ...s, assignees: s.assignees.filter(id => id !== empIdToRemove) };
              } else {
                  return { ...s, nextStageApprovers: s.nextStageApprovers.filter(id => id !== empIdToRemove) };
              }
          }
          return s;
      }));
  };

  const handleDrop = (e, stageId, targetType) => {
      e.preventDefault();
      const empId = parseInt(e.dataTransfer.getData('empId'), 10);
      if (!empId) return;

      setStages(prev => prev.map(s => {
          if (s.id === stageId) {
              if (targetType === 'STAGE' && !s.assignees.includes(empId)) {
                  return { ...s, assignees: [...s.assignees, empId] };
              } else if (targetType === 'LINK' && !s.nextStageApprovers.includes(empId)) {
                  return { ...s, nextStageApprovers: [...s.nextStageApprovers, empId] };
              }
          }
          return s;
      }));
      
      setActiveElement({ id: stageId, type: targetType });
      
      if (targetType === 'STAGE') {
          setValidationErrors(prev => { const errs = { ...prev }; delete errs[`stage_${stageId}`]; return errs; });
      }
  };

  const handleAssigneeChange = (newSelectedIds) => {
      if (!activeElement.id) return;
      
      setStages(prev => prev.map(s => {
          if (s.id === activeElement.id) {
              if (activeElement.type === 'STAGE') {
                  return { ...s, assignees: newSelectedIds };
              } else {
                  return { ...s, nextStageApprovers: newSelectedIds };
              }
          }
          return s;
      }));

      if (activeElement.type === 'STAGE' && newSelectedIds.length > 0) {
          setValidationErrors(prev => { const e = { ...prev }; delete e[`stage_${activeElement.id}`]; return e; });
      }
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

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    const allStageDeadlines = stages
        .filter(s => s.deadlineDate)
        .map(s => `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00`)
        .sort();
    
    const finalTaskDeadline = allStageDeadlines.length > 0 ? allStageDeadlines[allStageDeadlines.length - 1] : null;

    const payload = {
      title: title.trim(), 
      task_type: taskType, 
      urgency, 
      note: note.trim(), 
      send_sms: sendSms, 
      files,
      deadline: finalTaskDeadline,
      save_as_template: saveAsTemplate, 
      template_title: templateTitle,
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
    dispatch(createTask(payload));
  }, [dispatch, title, taskType, stages, note, sendSms, files, urgency, saveAsTemplate, templateTitle]);
 
  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4 z-[9999]" dir="rtl">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className={`relative flex flex-col md:flex-row w-full max-w-[98vw] lg:max-w-[1200px] h-[96dvh] md:h-[92dvh] rounded-2xl overflow-hidden shadow-2xl border-[2px] ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-gray-50 border-blue-500'}`}>
          
          {/* بخش فرم اصلی (اگر در موبایل پنل پرسنل باز باشد، مخفی می‌شود تا شلوغ نشود) */}
          <div className={`flex flex-col flex-1 overflow-hidden ${pickerOpenMobile ? 'hidden md:flex' : 'flex'}`}>
             
             {/* هدر و خط زمانی (Stepper Header) */}
             <div className={`px-3 md:px-6 py-3 md:py-4 border-b shrink-0 z-20 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <h2 className={`font-bold text-xs md:text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500"><FaSitemap size={12} /></div>
                    ایجاد گردش کار شناور
                  </h2>
                  <button onClick={onClose} disabled={creating} className={`p-1.5 md:p-2 rounded-full transition border ${isDark ? 'text-gray-400 hover:text-white border-slate-700 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100 border-gray-200'}`}><FaTimes size={13} /></button>
                </div>

                {/* گوی‌های خط زمانی (Stepper Navigation) */}
                <div className="flex items-center justify-between relative max-w-sm mx-auto px-2">
                  <div className={`absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 z-0 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`} />
                  
                  {/* تب 1 */}
                  <div onClick={() => setCurrentStep(1)} className="relative z-10 flex flex-col items-center cursor-pointer">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep === 1 ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : currentStep > 1 ? 'bg-green-600 text-white' : isDark ? 'bg-slate-800 text-gray-400 border border-slate-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > 1 ? <FaCheck size={10} /> : '۱'}
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-medium mt-1 ${currentStep === 1 ? 'text-blue-500 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>پایه</span>
                  </div>

                  {/* تب 2 */}
                  <div onClick={() => validateStep(1) && setCurrentStep(2)} className="relative z-10 flex flex-col items-center cursor-pointer">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep === 2 ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : currentStep > 2 ? 'bg-green-600 text-white' : isDark ? 'bg-slate-800 text-gray-400 border border-slate-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > 2 ? <FaCheck size={10} /> : '۲'}
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-medium mt-1 ${currentStep === 2 ? 'text-blue-500 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>مراحل</span>
                  </div>

                  {/* تب 3 */}
                  <div onClick={() => (validateStep(1) && validateStep(2)) && setCurrentStep(3)} className="relative z-10 flex flex-col items-center cursor-pointer">
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      currentStep === 3 ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' : isDark ? 'bg-slate-800 text-gray-400 border border-slate-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      ۳
                    </div>
                    <span className={`text-[10px] md:text-[11px] font-medium mt-1 ${currentStep === 3 ? 'text-blue-500 font-bold' : isDark ? 'text-gray-400' : 'text-gray-600'}`}>پیوست</span>
                  </div>
                </div>
            </div>
             
            {/* بدنه اسکرول‌شونده */}
            <div dir="ltr" className={`flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? '[&::-webkit-scrollbar-thumb]:bg-slate-700' : '[&::-webkit-scrollbar-thumb]:bg-gray-300'}`}>
               <div dir="rtl" className="p-3 md:p-6 space-y-4 md:space-y-6 min-h-full">

                {createSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-xs md:text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-fadeIn">
                    <FaCheckCircle size={15} /> ماموریت با موفقیت ایجاد شد!
                </div>
                )}

                {/* ════════ تب اول: اطلاعات پایه ════════ */}
                {currentStep === 1 && (
                  <div className={`p-4 md:p-5 rounded-2xl border space-y-4 animate-fadeIn ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-700/30">
                          <FaInfoCircle className="text-blue-500" size={15} />
                          <h3 className={`font-bold text-xs md:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>مشخصات کلی و هویت ماموریت</h3>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 md:gap-4">
                          <div className="lg:col-span-2">
                              <div className="flex items-center justify-between mb-1.5">
                                  <label className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                      عنوان ماموریت <span className="text-red-400">*</span>
                                  </label>
                                  <VoiceInputButton 
                                      value={title} 
                                      onChange={val => {
                                          setTitle(val);
                                          setValidationErrors(prev => ({...prev, title: ''}));
                                      }}
                                  />
                              </div>
                              <input 
                                type="text" 
                                value={title} 
                                onChange={e => { setTitle(e.target.value); setValidationErrors(prev => ({...prev, title: ''})); }} 
                                placeholder="مثال: پردازش فاکتورهای انبار" 
                                className={`w-full rounded-xl px-3.5 py-2.5 md:py-3 text-xs md:text-sm border focus:outline-none focus:border-blue-500 ${validationErrors.title ? 'border-red-500' : ''} ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`} 
                              />
                              {validationErrors.title && <p className="text-[11px] text-red-400 mt-1">{validationErrors.title}</p>}
                          </div>
                          
                          <div className="lg:col-span-2">
                              <label className={`block text-xs mb-1.5 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  دسته‌بندی <span className="text-red-400">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                  {!isAddingType ? (
                                      <>
                                          <select 
                                              value={taskType} 
                                              onChange={e => { setTaskType(e.target.value); setValidationErrors(prev => ({...prev, taskType: ''})); }} 
                                              className={`flex-1 rounded-xl px-3.5 py-2.5 md:py-3 text-xs md:text-sm border focus:outline-none focus:border-blue-500 ${validationErrors.taskType ? 'border-red-500' : ''} ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                                          >
                                              <option value="">انتخاب دسته‌بندی...</option>
                                              {taskTypeOptions.map(t => (
                                                  <option key={t.id} value={t.id}>{t.label}</option>
                                              ))}
                                          </select>
                                          <button 
                                              type="button" 
                                              onClick={() => setIsAddingType(true)}
                                              className={`p-2.5 md:p-3 rounded-xl border flex items-center justify-center transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-blue-600 hover:bg-blue-50'}`}
                                              title="افزودن دسته‌بندی جدید"
                                          >
                                              <FaPlus size={13} />
                                          </button>
                                      </>
                                  ) : (
                                      <>
                                          <input 
                                              type="text" 
                                              value={newTypeLabel} 
                                              onChange={e => setNewTypeLabel(e.target.value)} 
                                              placeholder="عنوان جدید..." 
                                              className={`flex-1 rounded-xl px-3.5 py-2.5 md:py-3 text-xs md:text-sm border focus:outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                                              autoFocus
                                          />
                                          <button 
                                              type="button"
                                              onClick={() => {
                                                  if (newTypeLabel.trim()) {
                                                      dispatch(createTaskType(newTypeLabel.trim())).then((res) => {
                                                          if(res.payload && res.payload.id) setTaskType(res.payload.id);
                                                      });
                                                      setIsAddingType(false);
                                                      setNewTypeLabel('');
                                                  }
                                              }}
                                              className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500"
                                          >
                                              <FaCheckCircle size={15} />
                                          </button>
                                          <button 
                                              type="button"
                                              onClick={() => { setIsAddingType(false); setNewTypeLabel(''); }}
                                              className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500"
                                          >
                                              <FaTimes size={15} />
                                          </button>
                                      </>
                                  )}
                              </div>
                              {validationErrors.taskType && <p className="text-[11px] text-red-400 mt-1">{validationErrors.taskType}</p>}
                          </div>

                          <div className="lg:col-span-4">
                              <label className={`block text-xs mb-1.5 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>فوریت</label>
                              <select value={urgency} onChange={e => setUrgency(e.target.value)} className={`w-full rounded-xl px-3.5 py-2.5 md:py-3 text-xs md:text-sm border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                                  {URGENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                          </div>
                      </div>

                      <div>
                          <div className="flex items-center justify-between mb-1.5">
                              <label className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  توضیحات کلی ماموریت
                              </label>
                              <VoiceInputButton 
                                  value={note} 
                                  onChange={val => setNote(val)} 
                              />
                          </div>
                          <textarea 
                              value={note} 
                              onChange={e => setNote(e.target.value)} 
                              placeholder="توضیحات و جزئیات کلی ماموریت (تایپ کنید یا صحبت کنید)..." 
                              rows={3}
                              className={`w-full rounded-xl px-3.5 py-2.5 text-xs md:text-sm border focus:outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                          />
                      </div>
                  </div>
                )}

                {/* ════════ تب دوم: خط مونتاژ گردش کار ════════ */}
                {currentStep === 2 && (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-500/10 border border-blue-500/30 p-3 rounded-xl">
                      <h3 className={`font-bold text-xs md:text-sm flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                          <FaSitemap /> طراحی مراحل و تعیین مسئولین
                      </h3>
                      {/* دکمه مخصوص موبایل برای باز کردن پنل پرسنل */}
                      <button
                        type="button"
                        onClick={() => setPickerOpenMobile(true)}
                        className="md:hidden flex items-center justify-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm"
                      >
                        <FaUserPlus size={12} />
                        <span>انتخاب پرسنل برای این مرحله</span>
                      </button>
                    </div>

                    <div className={`w-full overflow-x-auto pb-4 pt-2 px-3 flex items-start gap-3 min-h-[380px] ${isDark ? 'bg-slate-900/50 rounded-2xl border border-slate-800' : 'bg-gray-100/50 rounded-2xl border border-gray-200'}`}>
                        {stages.map((stage, index) => (
                            <React.Fragment key={stage.id}>
                                <div
                                  onClick={() => setActiveElement({ id: stage.id, type: 'STAGE' })}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => handleDrop(e, stage.id, 'STAGE')}
                                  className={`shrink-0 w-[260px] md:w-[280px] rounded-2xl border-2 flex flex-col transition-all cursor-pointer shadow-md
                                  ${activeElement.id === stage.id && activeElement.type === 'STAGE'
                                      ? 'border-blue-500 shadow-blue-500/20 ' + (isDark ? 'bg-slate-800' : 'bg-white') 
                                      : 'border-dashed border-slate-600 hover:border-blue-400 ' + (isDark ? 'bg-slate-800/60' : 'bg-white')}`}
                                >
                                    <div className="p-2.5 md:p-3 border-b border-slate-700/50 flex justify-between items-center bg-black/5 rounded-t-xl">
                                        <span className={`text-xs md:text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مرحله {index + 1}</span>
                                        {stages.length > 1 && (
                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveStage(stage.id); }} className="text-red-400 hover:text-red-500 p-1"><FaTrash size={11} /></button>
                                        )}
                                    </div>
                                    
                                    <div className={`p-3 md:p-4 flex flex-col gap-2.5 max-h-[340px] overflow-y-auto [&::-webkit-scrollbar]:w-1`}>
                                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-700/50">
                                            <input 
                                              type="text" 
                                              value={stage.stageName} 
                                              onChange={e => updateStageField(stage.id, 'stageName', e.target.value)} 
                                              placeholder="نام مرحله..." 
                                              className={`w-full text-xs md:text-sm font-bold outline-none bg-transparent ${isDark ? 'text-white' : 'text-gray-900'}`} 
                                            />
                                            <VoiceInputButton 
                                                value={stage.stageName} 
                                                onChange={val => updateStageField(stage.id, 'stageName', val)}
                                            />
                                        </div>

                                        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                            <FaAlignRight className="text-[11px] shrink-0 opacity-70" />
                                            <input 
                                                type="text" 
                                                value={stage.description} 
                                                onChange={e => updateStageField(stage.id, 'description', e.target.value)} 
                                                placeholder="شرح وظیفه مرحله..." 
                                                className="w-full text-[11px] md:text-xs outline-none bg-transparent"
                                            />
                                            <VoiceInputButton 
                                                value={stage.description} 
                                                onChange={val => updateStageField(stage.id, 'description', val)}
                                            />
                                        </div>
                                      
                                        <div className={`flex flex-col gap-1.5 p-2 rounded-xl border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                          <div className="flex items-center gap-1.5">
                                            <FaClock className={`text-[11px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                            <span className={`text-[11px] font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مهلت انجام</span>
                                          </div>
                                          <div className="flex gap-1.5">
                                            <div className="flex-1">
                                                <JalaliDatePicker
                                                    name="deadlineDate"
                                                    value={stage.deadlineDate}
                                                    onChange={(e) => updateStageField(stage.id, 'deadlineDate', e.target ? e.target.value : e)}
                                                    inputClassName={`w-full text-[11px] p-1.5 rounded-lg outline-none border ${isDark ? 'bg-slate-700 border-slate-600 placeholder:text-slate-400' : 'bg-gray-100 border-gray-300'}`}
                                                    placeholder="تاریخ"
                                                    modal={true}
                                                />
                                            </div>
                                            <input 
                                              type="time"
                                              value={stage.deadlineTime} 
                                              onChange={e => updateStageField(stage.id, 'deadlineTime', e.target.value)} 
                                              className={`w-[70px] text-[11px] p-1.5 rounded-lg outline-none border ${isDark ? 'bg-slate-700 border-slate-600 [color-scheme:dark]' : 'bg-gray-100 border-gray-300'}`}
                                            />
                                          </div>
                                        </div>

                                        <div className="flex gap-1.5">
                                            <label className={`flex-1 flex items-center justify-center px-1 py-1.5 rounded-xl border cursor-pointer select-none text-[11px] font-bold ${stage.requireFile ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : isDark ? 'bg-slate-900/50 border-slate-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                <input type="checkbox" checked={stage.requireFile} onChange={e => updateStageField(stage.id, 'requireFile', e.target.checked)} className="hidden" />
                                                <FaPaperclip size={9} className="mr-1" />
                                                <span>الزام فایل</span>
                                            </label>
                                            <select 
                                                value={stage.approvalRule} 
                                                onChange={e => updateStageField(stage.id, 'approvalRule', e.target.value)} 
                                                className={`flex-1 text-[11px] p-1.5 rounded-xl border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                                            >
                                                {APPROVAL_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                        </div>
                                      
                                        <div className="mt-1 flex-1 flex flex-col gap-1.5">
                                            <span className={`text-[11px] font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مسئولین مرحله:</span>
                                            {stage.assignees.length === 0 ? (
                                                <div className="flex-1 min-h-[50px] flex items-center justify-center text-center text-[11px] text-gray-500 border-2 border-dashed border-gray-500/30 rounded-xl p-2">
                                                    <span>کسی انتخاب نشده</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                  {stage.assignees.map(empId => {
                                                      const emp = subordinates.find(e => e.user_id === empId);
                                                      if (!emp) return null;
                                                      return <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'STAGE', id)} />;
                                                  })}
                                                </div>
                                            )}
                                            {validationErrors[`stage_${stage.id}`] && <p className="text-[10px] text-red-400 text-center">{validationErrors[`stage_${stage.id}`]}</p>}
                                        </div>
                                    </div>
                                </div>
                                  
                                <div className="shrink-0 flex items-center justify-center px-0.5 self-center">
                                    <div 
                                        onClick={() => setActiveElement({ id: stage.id, type: 'LINK' })}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleDrop(e, stage.id, 'LINK')}
                                        className={`w-36 md:w-42 min-h-[140px] rounded-2xl border-2 flex flex-col items-center p-2 cursor-pointer transition-all ${
                                            activeElement.id === stage.id && activeElement.type === 'LINK'
                                            ? 'border-orange-500 bg-orange-500/10 shadow-md'
                                            : 'border-dashed border-orange-500/50 hover:border-orange-400 bg-orange-500/5'
                                        }`}
                                    >
                                        <span className={`text-[11px] font-bold mb-1 text-center leading-tight ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>تاییدیه<br/>(اختیاری)</span>
                                        
                                        <div className="w-full mb-1.5">
                                            <select 
                                                value={stage.approverRule} 
                                                onChange={(e) => updateStageField(stage.id, 'approverRule', e.target.value)}
                                                onClick={(e) => e.stopPropagation()} 
                                                className={`w-full text-[10px] p-1 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
                                            >
                                                {APPROVER_RULES.map(rule => (
                                                    <option key={rule.value} value={rule.value}>{rule.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col gap-1 w-full items-center justify-center">
                                            {stage.nextStageApprovers.length === 0 ? (
                                                <div className="text-orange-500/40 flex flex-col items-center">
                                                    <FaArrowLeft size={16} className="mb-0.5" />
                                                    <span className="text-[10px] font-medium">مستقیم</span>
                                                </div>
                                            ) : (
                                                <div className="w-full flex flex-wrap gap-1 items-center justify-center">
                                                    {stage.nextStageApprovers.map(empId => {
                                                        const emp = subordinates.find(e => e.user_id === empId);
                                                        if (!emp) return null;
                                                        return <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'LINK', id)} />;
                                                    })}
                                                    <FaArrowLeft size={12} className="text-orange-500 mt-1" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                        
                        <div className="shrink-0 flex items-center pl-1 self-stretch">
                          <button onClick={handleAddStage} className={`w-[70px] h-full min-h-[280px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${isDark ? 'border-slate-700 hover:border-blue-500 text-slate-500 bg-slate-800/30' : 'border-gray-300 hover:border-blue-500 text-gray-400 bg-white'}`}>
                              <FaPlus size={20} />
                              <span className="text-[11px] font-bold text-center">افزودن<br/>مرحله</span>
                          </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ════════ تب سوم: تنظیمات و پیوست‌ها ════════ */}
                {currentStep === 3 && (
                  <div className={`p-4 md:p-5 rounded-2xl border space-y-5 animate-fadeIn ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-700/30">
                          <FaCog className="text-blue-500" size={15} />
                          <h3 className={`font-bold text-xs md:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>تنظیمات جانبی و اطلاع‌رسانی</h3>
                      </div>

                      <div>
                          <label className={`block text-xs mb-1.5 font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              فایل‌های ضمیمه <span className="text-gray-400 text-[10px] font-normal">(حداکثر ۲۰ مگابایت)</span>
                          </label>
                          <div className="relative group">
                              <input
                                  type="file"
                                  multiple
                                  accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xlsx"
                                  onChange={(e) => setFiles(Array.from(e.target.files))}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className={`w-full border border-dashed rounded-xl px-4 py-5 text-xs md:text-sm flex flex-col items-center justify-center gap-2 transition-colors ${
                                  isDark ? 'bg-slate-800 border-slate-600 text-gray-400 group-hover:border-blue-500' : 'bg-white border-gray-300 text-gray-600 group-hover:border-blue-500'
                              }`}>
                                  <FaPaperclip size={18} className="text-blue-500" />
                                  <span>برای انتخاب فایل کلیک کنید یا رها کنید</span>
                              </div>
                          </div>

                          {files.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                  {files.map((f, i) => (
                                      <div key={i} className={`text-xs border px-3 py-1.5 rounded-xl flex items-center gap-2 ${isDark ? 'bg-slate-800 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'}`}>
                                          <span className="truncate max-w-[130px]">{f.name}</span>
                                          <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-500">
                                              <FaTimes size={10} />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </div>

                      <div
                          onClick={() => setSendSms(!sendSms)}
                          className={`flex items-center justify-between p-3.5 md:p-4 rounded-xl border cursor-pointer transition-all ${
                              sendSms ? 'bg-green-500/10 border-green-500/50' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                          }`}
                      >
                          <div>
                              <div className={`text-xs md:text-sm font-bold ${sendSms ? 'text-green-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                  اطلاع‌رسانی پیامکی خودکار
                              </div>
                              <div className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ارسال پیامک اطلاع‌رسانی به شماره موبایل پرسنل مسئول</div>
                          </div>
                          <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${sendSms ? 'bg-green-500' : isDark ? 'bg-slate-700' : 'bg-gray-300'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${sendSms ? 'left-1' : 'right-1'}`} />
                          </div>
                      </div>
                  </div>
                )}

                </div>
             </div>

             {/* فوتر دکمه‌های ناوبری (قبلی، بعدی، ثبت) */}
             <div className={`px-3 md:px-6 py-3 md:py-4 border-t flex items-center justify-between gap-3 shrink-0 z-10 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                {currentStep > 1 ? (
                  <button type="button" onClick={handlePrev} className={`w-24 md:w-28 rounded-xl py-2.5 md:py-3 text-xs md:text-sm font-medium border transition-colors ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    مرحله قبل
                  </button>
                ) : (
                  <button type="button" onClick={onClose} className={`w-24 md:w-28 rounded-xl py-2.5 md:py-3 text-xs md:text-sm font-medium border transition-colors ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    انصراف
                  </button>
                )}

                {currentStep < 3 ? (
                  <button type="button" onClick={handleNext} className="flex-1 max-w-[180px] md:max-w-[200px] rounded-xl py-2.5 md:py-3 text-xs md:text-sm font-bold transition-all bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                    <span>مرحله بعد</span>
                    <FaArrowLeft size={11} />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={creating} className="flex-1 max-w-[200px] md:max-w-[220px] rounded-xl py-2.5 md:py-3 text-xs md:text-sm font-bold transition-all bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50">
                      {creating ? <><FaSpinner className="animate-spin" /> در حال ایجاد...</> : <><FaCheck size={13} /> ثبت نهایی ماموریت</>}
                  </button>
                )}
             </div>
          </div>
          
          {/* پنل سمت راست: انتخابگر پرسنل */}
          <div className={`w-full h-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-r z-20 shadow-lg transition-all ${
            currentStep === 2 ? (pickerOpenMobile ? 'flex absolute inset-0 md:relative' : 'hidden md:flex') : 'hidden'
          } ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <div className="flex flex-col w-full h-full">
              {pickerOpenMobile && (
                <div className="md:hidden p-3 border-b flex items-center justify-between bg-blue-600 text-white">
                  <span className="text-xs font-bold">انتخاب پرسنل (مرحله جاری)</span>
                  <button onClick={() => setPickerOpenMobile(false)} className="p-1 bg-white/20 rounded-lg">
                    <FaTimes size={14} />
                  </button>
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <AssigneePickerPanel
                  subordinates={subordinates}
                  loading={loadingSubordinates}
                  selectedIds={activeSelectedIds}
                  onChange={handleAssigneeChange}
                  onClose={() => setPickerOpenMobile(false)}
                  activeStageName={getActiveStageNameForPicker()}
                />
              </div>
            </div>
          </div>

      </div>
    </div>
  );
};

export default TaskWorkflowCreateModal;