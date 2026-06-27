import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import JalaliDatePicker from '../JalaliDatePicker';
import { formatJalaliDateLong } from '../../utils/dateUtils';
import {
  fetchSubordinates, createTask,
  clearCreateSuccess, clearTaskError,
} from '../../features/task/taskSlice';
import AssigneePickerPanel, { AssigneeChip } from './AssigneePickerPanel';
import { FaTimes, FaSpinner, FaUserPlus, FaChevronLeft, FaPaperclip, FaCalendarAlt, FaPlus, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import TimeInput from '../TimeInput';

const TASK_TYPE_OPTIONS = [
  { value: 'PAYROLL_FORM', label: 'تکمیل فرم حقوق' },
  { value: 'PURCHASE', label: 'خرید/تدارکات' },
  { value: 'REPORT', label: 'گزارش‌دهی' },
];

const URGENCY_OPTIONS = [
  { value: 'LOW', label: 'کم' },
  { value: 'MEDIUM', label: 'متوسط' },
  { value: 'HIGH', label: 'زیاد' },
  { value: 'CRITICAL', label: 'بحرانی' },
];

const TaskCreateModal = ({ onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const subordinates = useSelector(s => s.task.subordinates);
  const loadingSubordinates = useSelector(s => s.task.loadingSubordinates);
  const creating = useSelector(s => s.task.creating);
  const createSuccess = useSelector(s => s.task.createSuccess);
  const error = useSelector(s => s.task.error);

  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const [title, setTitle] = useState('');
  const [taskType, setTaskType] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [note, setNote] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  
  // ✅ validation errors
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(fetchSubordinates());
    return () => { 
      dispatch(clearTaskError()); 
      dispatch(clearCreateSuccess()); 
    };
  }, [dispatch]);

  useEffect(() => { 
    if (createSuccess) {
      // ✅ نمایش موفقیت کوتاه قبل از بستن
      setTimeout(() => onSuccess(), 800);
    }
  }, [createSuccess, onSuccess]);

  const selectedEmps = useMemo(
    () => subordinates.filter(e => selectedIds.includes(e.user_id)),
    [subordinates, selectedIds]
  );

  // ✅ Validation قبل از submit
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!title.trim()) {
      errors.title = 'عنوان ماموریت الزامی است';
    } else if (title.trim().length < 3) {
      errors.title = 'عنوان باید حداقل ۳ کاراکتر باشد';
    }
    
    if (!taskType) {
      errors.taskType = 'انتخاب دسته‌بندی الزامی است';
    }
    
    if (selectedIds.length === 0) {
      errors.assignees = 'حداقل یک مسئول باید انتخاب شود';
    }

    if (files.length > 0) {
      const maxSize = 20 * 1024 * 1024; // 20MB
      const oversizedFiles = files.filter(f => f.size > maxSize);
      if (oversizedFiles.length > 0) {
        errors.files = `فایل ${oversizedFiles[0].name} بیشتر از ۲۰ مگابایت است`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, taskType, selectedIds, files]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // ✅ پاک کردن خطاهای قبلی
    setValidationErrors({});
    dispatch(clearTaskError());

    // ✅ اعتبارسنجی
    if (!validateForm()) {
      return;
    }

    let deadlineIso = null;
    if (deadline) {
      const timePart = deadlineTime || '23:59';
      deadlineIso = `${deadline}T${timePart}`;
    }

    dispatch(createTask({
      title: title.trim(),
      task_type: taskType,
      assignee_ids: selectedIds,
      note: note.trim(),
      send_sms: sendSms,
      files,
      deadline: deadlineIso,
      urgency,  // ✅ فیکس typo
    }));
  }, [dispatch, title, taskType, selectedIds, deadline, deadlineTime, note, sendSms, files, urgency, validateForm]);

  const handleRemoveAssignee = useCallback(
    (id) => {
      setSelectedIds(p => p.filter(i => i !== id));
      // ✅ پاک کردن خطای مسئولان اگه حداقل یکی انتخاب شد
      if (selectedIds.length > 1) {
        setValidationErrors(prev => {
          const { assignees, ...rest } = prev;
          return rest;
        });
      }
    },
    [selectedIds.length]
  );

  const handleRemoveFile = useCallback(
    (index) => setFiles(prev => prev.filter((_, j) => j !== index)),
    []
  );

  const handleFilesChange = useCallback(
    (e) => {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      // ✅ پاک کردن خطای فایل
      setValidationErrors(prev => {
        const { files, ...rest } = prev;
        return rest;
      });
    },
    []
  );

  const handleDeadlineChange = useCallback(
    (e) => setDeadline(e.target.value),
    []
  );

  const closePicker = useCallback(() => setPickerOpen(false), []);

  // ✅ Parse backend errors
  const parseBackendError = (err) => {
    if (!err) return null;
    
    // اگه رشته JSON بود
    try {
      const parsed = JSON.parse(err);
      if (parsed.detail) return parsed.detail;
      if (parsed.title) return `عنوان: ${parsed.title[0]}`;
      if (parsed.task_type) return `دسته‌بندی: ${parsed.task_type[0]}`;
      if (parsed.assignee_ids) return `مسئولان: ${parsed.assignee_ids[0]}`;
      return JSON.stringify(parsed);
    } catch {
      return err;
    }
  };

  const backendError = parseBackendError(error);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

      <div
        className={`relative flex w-full sm:w-auto h-full max-h-[90dvh] rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300 ${
          isDark ? 'bg-slate-900 border-blue-700' : 'bg-white border-gray-200'
        }`}
      >
        {/* پنل فرم */}
        <div className={`flex flex-col w-full sm:w-[460px] h-full transition-all overflow-hidden ${pickerOpen ? 'hidden sm:flex' : 'flex'}`}>

          <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
            isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'
          }`}>
            <h2 className={`font-bold text-base flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                <FaPlus size={14} />
              </div>
              ایجاد ماموریت جدید
            </h2>
            <button
              onClick={onClose}
              disabled={creating}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition border ${
                creating ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-slate-700 bg-slate-800/70 border-slate-700'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 bg-gray-50 border-gray-200'
              }`}
            >
              <FaTimes size={14} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className={`flex flex-col flex-1 min-h-0 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
              
              {/* ✅ Success message */}
              {createSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2 animate-fadeIn">
                  <FaCheckCircle size={16} />
                  <span>ماموریت با موفقیت ایجاد شد!</span>
                </div>
              )}

              {/* ✅ Backend error */}
              {backendError && !creating && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                  <FaExclamationTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium mb-1">خطا در ایجاد ماموریت</div>
                    <div className="text-xs opacity-90">{backendError}</div>
                  </div>
                </div>
              )}

              {/* عنوان */}
              <div>
                <label className={`block text-xs mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  عنوان ماموریت <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (validationErrors.title) {
                      setValidationErrors(prev => {
                        const { title, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  placeholder="مثال: بررسی گزارشات مالی آذر"
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none transition-colors shadow-inner ${
                    validationErrors.title
                      ? 'border-red-500 focus:border-red-500'
                      : 'focus:border-blue-500'
                  } ${
                    isDark
                      ? 'bg-slate-800 text-white border-slate-700 placeholder-gray-500'
                      : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'
                  }`}
                />
                {validationErrors.title && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={10} />
                    {validationErrors.title}
                  </p>
                )}
              </div>

              {/* نوع */}
              <div>
                <label className={`block text-xs mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  دسته‌بندی <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={taskType}
                    onChange={e => {
                      setTaskType(e.target.value);
                      if (validationErrors.taskType) {
                        setValidationErrors(prev => {
                          const { taskType, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none transition-colors appearance-none shadow-inner ${
                      validationErrors.taskType
                        ? 'border-red-500 focus:border-red-500'
                        : 'focus:border-blue-500'
                    } ${
                      isDark
                        ? 'bg-slate-800 text-white border-slate-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  >
                    <option value="" className={isDark ? 'text-gray-400' : 'text-gray-500'}>انتخاب کنید...</option>
                    {TASK_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <FaChevronLeft className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none -rotate-90 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={12} />
                </div>
                {validationErrors.taskType && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={10} />
                    {validationErrors.taskType}
                  </p>
                )}
              </div>
              
              <div>
                <label className={`block text-xs mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  فوریت
                </label>
                <div className="relative">
                  <select
                    value={urgency}
                    onChange={e => setUrgency(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 transition-colors appearance-none shadow-inner ${
                      isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  >
                    {URGENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <FaChevronLeft className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none -rotate-90 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={12} />
                </div>
              </div>

              {/* مسئولان */}
              <div>
                <label className={`block text-xs mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  مسئولان انجام <span className="text-red-400">*</span>
                </label>
                {selectedEmps.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedEmps.map(emp => (
                      <AssigneeChip key={emp.user_id} emp={emp} onRemove={handleRemoveAssignee} />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPickerOpen(v => !v)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
                    validationErrors.assignees
                      ? 'border-red-500'
                      : pickerOpen
                      ? 'bg-blue-900/30 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : isDark
                      ? 'bg-slate-800 border-dashed border-slate-600 hover:border-slate-500 text-gray-400'
                      : 'bg-white border-dashed border-gray-300 hover:border-gray-400 text-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FaUserPlus size={14} className={pickerOpen ? 'text-blue-500' : (isDark ? 'text-gray-500' : 'text-gray-400')} />
                    <span>{selectedIds.length === 0 ? 'افزودن شخص مسئول...' : 'ویرایش لیست افراد'}</span>
                  </div>
                  <FaChevronLeft size={12} className={`transition-transform duration-300 ${pickerOpen ? '-rotate-90' : ''}`} />
                </button>
                {validationErrors.assignees && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={10} />
                    {validationErrors.assignees}
                  </p>
                )}
              </div>

              {/* مهلت */}
              <div className={`p-4 rounded-xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <label className={`flex items-center gap-2 text-xs mb-4 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <FaCalendarAlt className="text-blue-400" />
                  مهلت نهایی انجام کار
                </label>

                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <JalaliDatePicker
                      name="deadline"
                      value={deadline}
                      onChange={handleDeadlineChange}
                      className={`w-full text-sm rounded-xl px-3 py-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'}`}
                      placeholder="انتخاب تاریخ"
                      modal={true}
                    />
                  </div>

                  <div className={`w-full rounded-xl border p-3 flex flex-col gap-2 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                    <span className={`text-[11px] block text-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      انتخاب زمان (ساعت و دقیقه)
                    </span>
                    <div className="w-full flex items-center justify-center overflow-hidden" dir="ltr">
                      <TimeInput value={deadlineTime} onChange={setDeadlineTime} />
                    </div>
                  </div>
                </div>

                {deadline && (
                  <p className="text-xs text-green-500 mt-3 text-center bg-green-500/10 py-1.5 rounded-lg border border-green-500/30">
                    {formatJalaliDateLong(deadline)}
                  </p>
                )}
              </div>

              {/* یادداشت */}
              <div>
                <label className={`block text-xs mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>توضیحات تکمیلی</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="یادداشت یا توضیح کوتاه..."
                  className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 transition-colors resize-none shadow-inner ${
                    isDark
                      ? 'bg-slate-800 text-white border-slate-700 placeholder-gray-500'
                      : 'bg-white text-gray-900 border-gray-300 placeholder-gray-400'
                  }`}
                />
              </div>

              {/* فایل */}
              <div>
                <label className={`block text-xs mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  فایل ضمیمه (اختیاری)
                  <span className="text-gray-500 mr-1">(حداکثر ۲۰ مگابایت)</span>
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    multiple
                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xlsx"
                    onChange={handleFilesChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border border-dashed rounded-xl px-4 py-4 text-sm flex flex-col items-center justify-center gap-2 transition-colors ${
                    validationErrors.files
                      ? 'border-red-500'
                      : isDark
                      ? 'bg-slate-800 border-slate-600 text-gray-400 group-hover:border-blue-500 group-hover:text-blue-400'
                      : 'bg-white border-gray-300 text-gray-600 group-hover:border-blue-500 group-hover:text-blue-600'
                  }`}>
                    <FaPaperclip size={18} />
                    <span>برای انتخاب فایل کلیک کنید یا اینجا رها کنید</span>
                  </div>
                </div>
                {validationErrors.files && (
                  <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationTriangle size={10} />
                    {validationErrors.files}
                  </p>
                )}

                {files.length > 0 && (
                  <div className={`flex flex-wrap gap-2 mt-3 p-3 rounded-xl border ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className={`text-xs border px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm ${
                          isDark ? 'bg-slate-700 border-slate-600 text-gray-300' : 'bg-gray-50 border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="truncate max-w-[120px]">{f.name}</span>
                        <span className="text-gray-500">({(f.size / 1024).toFixed(0)} KB)</span>
                        <button type="button" onClick={() => handleRemoveFile(i)} className={`${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'} transition-colors`}>
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SMS */}
              <div
                onClick={() => setSendSms(v => !v)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  sendSms
                    ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.05)]'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <div className={`text-sm font-bold ${sendSms ? 'text-green-500' : (isDark ? 'text-gray-300' : 'text-gray-800')}`}>
                    اطلاع‌رسانی پیامکی
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>ارسال پیامک به گوشی اشخاص مسئول</div>
                </div>
                <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${sendSms ? 'bg-green-500' : (isDark ? 'bg-slate-600' : 'bg-gray-300')}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${sendSms ? 'left-1' : 'right-1'}`} />
                </div>
              </div>
            </div>

            {/* ✅ دکمه‌ها با لودینگ حرفه‌ای */}
            <div className={`px-5 py-4 border-t flex gap-3 shrink-0 z-10 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <button
                type="button"
                onClick={onClose}
                disabled={creating}
                className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors border ${
                  creating ? 'opacity-50 cursor-not-allowed' : ''
                } ${
                  isDark
                    ? 'bg-slate-700 hover:bg-slate-600 text-gray-300 border-slate-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
                }`}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={creating || !title.trim() || !taskType || selectedIds.length === 0}
                className={`flex-[2] rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2 relative overflow-hidden ${
                  creating
                    ? 'bg-blue-700 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'
                } ${
                  (!title.trim() || !taskType || selectedIds.length === 0) && !creating
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                } text-white`}
              >
                {creating ? (
                  <>
                    {/* ✅ لودینگ حرفه‌ای */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 animate-shimmer bg-[length:200%_100%]" />
                    <FaSpinner className="animate-spin relative z-10" size={16} />
                    <span className="relative z-10">در حال ایجاد ماموریت...</span>
                  </>
                ) : (
                  'تایید و ایجاد ماموریت'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* پنل picker */}
        <div className={`flex-col w-full sm:w-[360px] h-full border-r transition-all duration-300 ease-out z-10 ${
          isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'
        } ${pickerOpen ? 'flex' : 'hidden'}`}>
          <div className={`sm:hidden p-3 border-b flex items-center gap-2 shrink-0 ${
            isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'
          }`}>
            <button
              type="button"
              onClick={closePicker}
              className="flex items-center gap-1.5 text-blue-500 text-sm font-medium px-3 py-2 hover:bg-blue-500/10 bg-blue-500/10 rounded-lg transition-colors"
            >
              <FaChevronLeft size={10} className="rotate-180" /> بازگشت به فرم
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AssigneePickerPanel
              subordinates={subordinates}
              loading={loadingSubordinates}
              selectedIds={selectedIds}
              onChange={setSelectedIds}
              onClose={closePicker}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCreateModal;
