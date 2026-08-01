import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment-jalaali';
import axios from 'axios';
import { fetchSubordinates, createTask, clearCreateSuccess, clearTaskError, fetchTaskTypes, createTaskType, deleteTaskType } from '../../features/task/taskSlice';
import AssigneePickerPanel, { AssigneeChip } from './AssigneePickerPanel';
import JalaliDatePicker from '../common/JalaliDatePicker';
import { FaTimes, FaSpinner, FaArrowLeft, FaPlus, FaCheckCircle, FaTrash, FaSitemap, FaPaperclip, FaClock, FaAlignRight } from 'react-icons/fa';

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
  
  const { userInfo } = useSelector((state) => state.userLogin);
  
  const subordinates = useSelector(s => s.task.subordinates);
  const loadingSubordinates = useSelector(s => s.task.loadingSubordinates);
  const creating = useSelector(s => s.task.creating);
  const createSuccess = useSelector(s => s.task.createSuccess);
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('');
    
  const taskTypeOptions = useSelector(s => s.task.taskTypes);
  const loadingTypes = useSelector(s => s.task.loadingTypes);
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
          nextStageApprovers: [] ,
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
          nextStageApprovers: [] ,
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

  const validateForm = useCallback(() => {
    const errors = {};
    if (!title.trim()) errors.title = 'عنوان الزامی است';
    if (!taskType) errors.taskType = 'دسته‌بندی الزامی است';
    if (saveAsTemplate && !templateTitle.trim()) errors.templateTitle = 'عنوان الگو الزامی است';
    stages.forEach((stage, index) => {
        if (stage.assignees.length === 0) errors[`stage_${stage.id}`] = `مسئولین مرحله ${index + 1} خالی است`;
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, taskType, stages, saveAsTemplate, templateTitle]);

  
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      save_as_template: saveAsTemplate, template_title: templateTitle,
      workflow_stages: stages.map((s, idx) => ({
          step_index: idx + 1, 
          stage_name: s.stageName, 
          description: s.description,
          deadline: s.deadlineDate ? `${s.deadlineDate}T${s.deadlineTime || '23:59'}:00` : null,
          require_file: s.requireFile,
          assignee_ids: s.assignees, 
          approval_rule: s.approvalRule,
          intermediate_approvers: s.nextStageApprovers ,
          approver_rule: s.approverRule
      }))
    };
    dispatch(createTask(payload));
  }, [dispatch, title, taskType, stages, note, sendSms, files, urgency, saveAsTemplate, templateTitle, validateForm]);
 
  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 md:p-4 z-[9999]" dir="rtl">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div className={`relative flex flex-col md:flex-row w-full max-w-[95vw] lg:max-w-[1200px] h-[95dvh] rounded-ml overflow-hidden shadow-2xl border-[3px] ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-gray-50 border-blue-500'}`}>
          
          <div className="flex flex-col flex-1 overflow-hidden">
             <div className={`flex items-center justify-between px-4 md:px-6 py-4 border-b shrink-0 z-20 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                <h2 className={`font-bold text-sm md:text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500"><FaSitemap size={14} /></div>
                ایجاد گردش کار (Workflow)
                </h2>
                <button onClick={onClose} disabled={creating} className={`p-2 rounded-full transition border ${isDark ? 'text-gray-400 hover:text-white border-slate-700 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100 border-gray-200'}`}><FaTimes size={14} /></button>
            </div>
             
             {/* کادر زیر ویرایش شد: اسکرول‌بار اضافه شده و استایل‌دهی شد */}
            <div dir="ltr" className={`flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? '[&::-webkit-scrollbar-thumb]:bg-slate-700 hover:[&::-webkit-scrollbar-thumb]:bg-slate-600' : '[&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400'}`}>
               <div dir="rtl" className="p-4 md:p-6 space-y-6 min-h-full">

                {createSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm rounded-sm px-4 py-3 flex items-center gap-2 animate-fadeIn">
                    <FaCheckCircle size={16} /> ماموریت با موفقیت ایجاد شد!
                </div>
                )}
                
                <div className={`p-4 md:p-5 rounded-ml border space-y-4 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                            <label className={`block text-sm mb-2 font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>عنوان ماموریت <span className="text-red-400">*</span></label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: پردازش فاکتورها" className={`w-full rounded-sm px-4 py-2 text-sm border focus:outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`} />
                            {validationErrors.title && <p className="text-[10px] text-red-400 mt-1">{validationErrors.title}</p>}
                        </div>
                        <div className="lg:col-span-2">
                            <label className={`block text-sm mb-2 font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                دسته‌بندی <span className="text-red-400">*</span>
                            </label>
                            
                            <div className="flex items-center gap-2">
                                {!isAddingType ? (
                                    <>
                                        <select 
                                            value={taskType} 
                                            onChange={e => setTaskType(e.target.value)} 
                                            className={`flex-1 rounded-sm px-4 py-2 text-sm border focus:outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                                        >
                                            <option value="">انتخاب کنید...</option>
                                            {taskTypeOptions.map(t => (
                                                <option key={t.id} value={t.id}>{t.label}</option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button" 
                                            onClick={() => setIsAddingType(true)}
                                            className={`p-2.5 rounded-sm border flex items-center justify-center transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-white border-gray-300 text-blue-600 hover:bg-blue-50'}`}
                                            title="افزودن دسته‌بندی جدید"
                                        >
                                            <FaPlus size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <input 
                                            type="text" 
                                            value={newTypeLabel} 
                                            onChange={e => setNewTypeLabel(e.target.value)} 
                                            placeholder="عنوان دسته‌بندی جدید..." 
                                            className={`flex-1 rounded-sm px-4 py-2 text-sm border focus:outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                                            autoFocus
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                if (newTypeLabel.trim()) {
                                                    dispatch(createTaskType(newTypeLabel.trim())).then((res) => {
                                                        if(res.payload && res.payload.id) {
                                                            setTaskType(res.payload.id);
                                                        }
                                                    });
                                                    setIsAddingType(false);
                                                    setNewTypeLabel('');
                                                }
                                            }}
                                            className="p-2.5 rounded-sm bg-green-500/10 border border-green-500/30 text-green-500 hover:bg-green-500/20 transition-colors"
                                        >
                                            <FaCheckCircle size={16} />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => { setIsAddingType(false); setNewTypeLabel(''); }}
                                            className="p-2.5 rounded-sm bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-colors"
                                        >
                                            <FaTimes size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                            {validationErrors.taskType && <p className="text-red-400 text-xs mt-1">{validationErrors.taskType}</p>}
                        </div>

                        <div>
                            <label className={`block text-sm mb-2 font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>فوریت</label>
                            <select value={urgency} onChange={e => setUrgency(e.target.value)} className={`w-full rounded-sm px-4 py-2 text-sm border outline-none focus:border-blue-500 ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                                {URGENCY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="lg:col-span-4 mt-2">
                        <label className={`block text-sm mb-2 font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                            توضیحات کلی ماموریت
                        </label>
                        <textarea 
                            value={note} 
                            onChange={e => setNote(e.target.value)} 
                            placeholder="توضیحات و جزئیات کلی ماموریت را اینجا بنویسید..." 
                            rows={3}
                            className={`w-full rounded-sm px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 border-gray-300'}`}
                        />
                    </div>
                </div>

                <div>
                  <h3 className={`font-bold text-sm mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      <FaSitemap /> خط مونتاژ گردش کار
                  </h3>
                  <div className={`w-full overflow-x-auto pb-4 pt-2 px-4 flex items-start gap-3 min-h-[420px] ${isDark ? 'bg-slate-900/50 rounded-ml border border-slate-800' : 'bg-gray-100/50 rounded-ml border border-gray-200'}`}>
                      {stages.map((stage, index) => (
                          <React.Fragment key={stage.id}>
                              <div
                                onClick={() => setActiveElement({ id: stage.id, type: 'STAGE' })}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => handleDrop(e, stage.id, 'STAGE')}
                                className={`shrink-0 w-[280px] rounded-ml border-2 flex flex-col transition-all cursor-pointer shadow-lg
                                ${activeElement.id === stage.id && activeElement.type === 'STAGE'
                                    ? 'border-blue-500 shadow-blue-500/20 ' + (isDark ? 'bg-slate-800' : 'bg-white') 
                                    : 'border-dashed border-slate-600 hover:border-blue-400 ' + (isDark ? 'bg-slate-800/60' : 'bg-white')}`}
                              >
                                  <div className="p-3 border-b border-slate-700/50 flex justify-between items-center bg-black/5 rounded-t-xl">
                                      <span className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مرحله {index + 1}</span>
                                      {stages.length > 1 && (
                                          <button onClick={(e) => { e.stopPropagation(); handleRemoveStage(stage.id); }} className="text-red-400 hover:text-red-500 p-1"><FaTrash size={12} /></button>
                                      )}
                                  </div>
                                  
                                  <div className={`p-4 flex flex-col gap-3 max-h-[360px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full ${isDark ? '[&::-webkit-scrollbar-thumb]:bg-slate-600' : '[&::-webkit-scrollbar-thumb]:bg-gray-300'}`}>
                                      <input 
                                        type="text" 
                                        value={stage.stageName} 
                                        onChange={e => updateStageField(stage.id, 'stageName', e.target.value)} 
                                        placeholder="نام مرحله..." 
                                        className={`w-full text-sm font-bold pb-2 border-b outline-none bg-transparent transition-colors ${activeElement.id === stage.id && activeElement.type === 'STAGE' ? 'border-blue-500' : 'border-slate-600 focus:border-blue-400'} ${isDark ? 'text-white' : 'text-gray-900'}`} 
                                    />
                                    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-sm border ${isDark ? 'bg-slate-900/50 border-slate-700 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-800'}`}>
                                        <FaAlignRight className="text-[12px]" />
                                        <input 
                                            type="text" 
                                            value={stage.description} 
                                            onChange={e => updateStageField(stage.id, 'description', e.target.value)} 
                                            placeholder="شرح وظیفه این مرحله..." 
                                            className="w-full text-xs font-medium outline-none bg-transparent"
                                        />
                                    </div>
                                    
                                    <div className={`flex flex-col gap-1.5 p-2 rounded-sm border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                      <div className="flex items-center gap-1.5">
                                        <FaClock className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                                        <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مهلت انجام</span>
                                      </div>
                                      <div className="flex gap-2">
                                        <div className="flex-1">
                                            <JalaliDatePicker
                                                name="deadlineDate"
                                                value={stage.deadlineDate}
                                                onChange={(e) => updateStageField(stage.id, 'deadlineDate', e.target.value)}
                                                inputClassName={`w-full text-xs p-1.5 rounded-md outline-none border ${isDark ? 'bg-slate-700 border-slate-600 placeholder:text-slate-400' : 'bg-gray-100 border-gray-300'}`}
                                                placeholder="تاریخ مهلت"
                                            />
                                        </div>
                                        <input 
                                          type="time"
                                          value={stage.deadlineTime} 
                                          onChange={e => updateStageField(stage.id, 'deadlineTime', e.target.value)} 
                                          className={`w-[80px] text-xs p-1.5 rounded-md outline-none border ${isDark ? 'bg-slate-700 border-slate-600 [color-scheme:dark]' : 'bg-gray-100 border-gray-300'}`}
                                        />
                                      </div>
                                      {index > 0 && stages[index-1].deadlineDate && stage.deadlineDate && (
                                        <div className="text-[10px] text-center pt-1 mt-1 border-t border-dashed border-slate-600/50 text-gray-400">
                                            فاصله: {moment.duration(moment(stage.deadlineDate).diff(moment(stages[index - 1].deadlineDate))).humanize(true)}
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex gap-2">
                                        <label className={`flex-1 flex items-center justify-center px-1 py-1.5 rounded-sm border cursor-pointer select-none transition-colors ${stage.requireFile ? 'bg-blue-500/10 border-blue-500/50 text-blue-500' : (isDark ? 'bg-slate-900/50 border-slate-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500')}`}>
                                            <input type="checkbox" checked={stage.requireFile} onChange={e => updateStageField(stage.id, 'requireFile', e.target.checked)} className="hidden" />
                                            <FaPaperclip size={10} className="mr-1" />
                                            <span className="text-xs font-bold text-center">الزام فایل</span>
                                        </label>
                                        <select 
                                            value={stage.approvalRule} 
                                            onChange={e => updateStageField(stage.id, 'approvalRule', e.target.value)} 
                                            className={`flex-1 text-xs p-1.5 rounded-sm border outline-none ${isDark ? 'bg-slate-900 border-slate-700 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'}`}
                                        >
                                            {APPROVAL_RULES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="mt-1 flex-1 flex flex-col gap-2">
                                        <span className={`text-xs font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>مسئولین مرحله:</span>
                                        {stage.assignees.length === 0 ? (
                                            <div className="flex-1 min-h-[60px] flex flex-col items-center justify-center text-center text-xs text-gray-500 border-2 border-dashed border-gray-500/30 rounded-sm p-3">
                                                <span>کارمندی اضافه نشده</span>
                                            </div>
                                        ) : (
                                            stage.assignees.map(empId => {
                                                const emp = subordinates.find(e => e.user_id === empId);
                                                if (!emp) return null;
                                                return <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'STAGE', id)} />;
                                            })
                                        )}
                                        {validationErrors[`stage_${stage.id}`] && <p className="text-[10px] text-red-400 text-center">{validationErrors[`stage_${stage.id}`]}</p>}
                                    </div>
                                  </div>
                              </div>
                                
                                <div className="shrink-0 flex items-center justify-center px-1 self-center">
                                    <div 
                                        onClick={() => setActiveElement({ id: stage.id, type: 'LINK' })}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleDrop(e, stage.id, 'LINK')}
                                        className={`w-44 min-h-[150px] rounded-sm border-2 flex flex-col items-center p-2 cursor-pointer transition-all ${
                                            activeElement.id === stage.id && activeElement.type === 'LINK'
                                            ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20'
                                            : 'border-dashed border-orange-500/50 hover:border-orange-400 bg-orange-500/5'
                                        }`}
                                    >
                                        <span className={`text-xs font-bold mb-1 text-center leading-tight ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>تاییدیه<br/>(اختیاری)</span>
                                        
                                        <div className="w-full mb-2">
                                            <select 
                                                value={stage.approverRule} 
                                                onChange={(e) => updateStageField(stage.id, 'approverRule', e.target.value)}
                                                onClick={(e) => e.stopPropagation()} 
                                                className={`w-full text-xs p-1 rounded border outline-none ${isDark ? 'bg-slate-900 border-orange-500/30 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-700'}`}
                                            >
                                                {APPROVER_RULES.map(rule => (
                                                    <option key={rule.value} value={rule.value}>{rule.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col gap-1 w-full overflow-y-auto items-center justify-center">
                                            {stage.nextStageApprovers.length === 0 ? (
                                                <div className="text-orange-500/40 flex flex-col items-center">
                                                    <FaArrowLeft size={24} className="mb-1" />
                                                    <span className="text-xs font-medium">بدون تایید (مستقیم)</span>
                                                </div>
                                            ) : (
                                                <div className="w-full flex flex-col gap-1.5 items-center">
                                                    {stage.nextStageApprovers.map(empId => {
                                                        const emp = subordinates.find(e => e.user_id === empId);
                                                        if (!emp) return null;
                                                        return <AssigneeChip key={empId} emp={emp} onRemove={(id) => handleRemoveAssignee(stage.id, 'LINK', id)} />;
                                                    })}
                                                    <FaArrowLeft size={16} className="text-orange-500 mt-1" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                          </React.Fragment>
                      ))}
                      <div className="shrink-0 flex items-center pl-2 self-stretch">
                        <button onClick={handleAddStage} className={`w-[80px] h-full min-h-[300px] rounded-ml border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors ${isDark ? 'border-slate-700 hover:border-blue-500 hover:text-blue-400 text-slate-500 bg-slate-800/30' : 'border-gray-300 hover:border-blue-500 text-gray-400 bg-white'}`}>
                            <FaPlus size={24} />
                            <span className="text-xs font-bold leading-tight text-center">افزودن<br/>مرحله</span>
                        </button>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    <div className={`p-4 rounded-sm border flex flex-col justify-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <div onClick={() => setSendSms(!sendSms)} className={`flex items-center justify-between cursor-pointer p-2 rounded-sm transition ${sendSms ? 'bg-green-500/10' : ''}`}>
                            <span className={`text-sm font-bold ${sendSms ? 'text-green-500' : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>ارسال پیامک اطلاع‌رسانی</span>
                            <div className={`w-10 h-5 rounded-full relative transition-colors ${sendSms ? 'bg-green-500' : (isDark ? 'bg-slate-600' : 'bg-gray-300')}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sendSms ? 'left-0.5' : 'right-0.5'}`} />
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
             </div>
             <div className={`px-4 md:px-6 py-4 border-t flex gap-3 shrink-0 z-10 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <button type="button" onClick={onClose} className={`w-24 md:w-32 rounded-sm py-3 text-sm font-medium border transition-colors ${isDark ? 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>انصراف</button>
                <button onClick={handleSubmit} disabled={creating} className="flex-1 rounded-sm py-3 text-sm font-bold transition-all bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                    {creating ? <><FaSpinner className="animate-spin" /> در حال ایجاد...</> : 'ثبت گردش کار'}
                </button>
             </div>
          </div>
          
          <div className={`w-full h-[40vh] md:h-full md:w-[320px] shrink-0 border-t md:border-t-0 md:border-r z-10 shadow-lg ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
            <AssigneePickerPanel
              subordinates={subordinates}
              loading={loadingSubordinates}
              selectedIds={activeSelectedIds}
              onChange={handleAssigneeChange}
              onClose={onClose}
              activeStageName={getActiveStageNameForPicker()}
            />
        </div>
      </div>
    </div>
  );
};

export default TaskWorkflowCreateModal;
