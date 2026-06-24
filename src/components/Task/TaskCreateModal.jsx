import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import JalaliDatePicker from '../JalaliDatePicker';
import { formatJalaliDateLong } from '../../utils/dateUtils';
import {
    fetchSubordinates, createTask,
    clearCreateSuccess, clearTaskError,
} from '../../features/task/taskSlice';
import AssigneePickerPanel, { AssigneeChip } from './AssigneePickerPanel';
import { FaTimes, FaSpinner, FaUserPlus, FaChevronLeft, FaPaperclip, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import TimeInput from '../TimeInput';

const TASK_TYPE_OPTIONS = [
    { value: 'PAYROLL_FORM', label: 'تکمیل فرم حقوق' },
    { value: 'PURCHASE',     label: 'خرید/تدارکات' },
    { value: 'REPORT',       label: 'گزارش‌دهی' },
];

const TaskCreateModal = ({ onClose, onSuccess }) => {
    const dispatch = useDispatch();

    // ✅ selectorهای جداگانه:
    // هر کدام مستقل subscribe می‌شوند، پس تغییر یک فیلد دیگرِ state.task
    // باعث re-render این کامپوننت نمی‌شود.
    const subordinates       = useSelector(s => s.task.subordinates);
    const loadingSubordinates = useSelector(s => s.task.loadingSubordinates);
    const creating           = useSelector(s => s.task.creating);
    const createSuccess      = useSelector(s => s.task.createSuccess);
    const error              = useSelector(s => s.task.error);

    const [title, setTitle] = useState('');
    const [taskType, setTaskType] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [note, setNote] = useState('');
    const [sendSms, setSendSms] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [deadline, setDeadline] = useState('');
    const [deadlineTime, setDeadlineTime] = useState('');

    useEffect(() => {
        dispatch(fetchSubordinates());
        return () => { dispatch(clearTaskError()); dispatch(clearCreateSuccess()); };
    }, [dispatch]);

    useEffect(() => { if (createSuccess) onSuccess(); }, [createSuccess, onSuccess]);

    // ✅ فقط وقتی subordinates یا selectedIds عوض شود دوباره محاسبه می‌شود،
    // نه با هر keystroke در title/note/...
    const selectedEmps = useMemo(
        () => subordinates.filter(e => selectedIds.includes(e.user_id)),
        [subordinates, selectedIds]
    );

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        if (!title.trim() || !taskType || selectedIds.length === 0) return;

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
        }));
    }, [dispatch, title, taskType, selectedIds, deadline, deadlineTime, note, sendSms, files]);

    // ✅ هندلرهای پایدار تا به فرزندان (chip / picker) reference جدید ندهند
    const handleRemoveAssignee = useCallback(
        (id) => setSelectedIds(p => p.filter(i => i !== id)),
        []
    );

    const handleRemoveFile = useCallback(
        (index) => setFiles(prev => prev.filter((_, j) => j !== index)),
        []
    );

    const handleFilesChange = useCallback(
        (e) => setFiles(Array.from(e.target.files)),
        []
    );

    const handleDeadlineChange = useCallback(
        (e) => setDeadline(e.target.value),
        []
    );

    const closePicker = useCallback(() => setPickerOpen(false), []);

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />

            {/* Modal Container */}
            <div className="relative flex w-full sm:w-auto h-full max-h-[90dvh] bg-[#1e1f20] rounded-2xl overflow-hidden shadow-2xl border border-gray-700 transition-all duration-300">

                {/* ══ پنل راست: فرم ══ */}
                <div className={`flex flex-col w-full sm:w-[460px] h-full transition-all overflow-hidden ${pickerOpen ? 'hidden sm:flex' : 'flex'}`}>

                    {/* هدر */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-[#1e1f20] shrink-0">
                        <h2 className="text-white font-bold text-base flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                                <FaPlus size={14} />
                            </div>
                            ایجاد ماموریت جدید
                        </h2>
                        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition bg-gray-800/50 border border-gray-700">
                            <FaTimes size={14} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 bg-[#131314]">

                        {/* محتوای قابل اسکرول */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">

                            {/* عنوان */}
                            <div>
                                <label className="block text-gray-300 text-xs mb-2 font-medium">عنوان ماموریت <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="مثال: بررسی گزارشات مالی آذر"
                                    className="w-full bg-[#1e1f20] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600 shadow-inner"
                                    required
                                />
                            </div>

                            {/* نوع ماموریت */}
                            <div>
                                <label className="block text-gray-300 text-xs mb-2 font-medium">دسته‌بندی <span className="text-red-400">*</span></label>
                                <div className="relative">
                                    <select
                                        value={taskType}
                                        onChange={e => setTaskType(e.target.value)}
                                        className="w-full bg-[#1e1f20] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors appearance-none shadow-inner"
                                        required
                                    >
                                        <option value="" className="text-gray-500">انتخاب کنید...</option>
                                        {TASK_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <FaChevronLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none -rotate-90" size={12} />
                                </div>
                            </div>

                            {/* انتخاب مسئولان */}
                            <div>
                                <label className="block text-gray-300 text-xs mb-2 font-medium">
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
                                        pickerOpen ? 'bg-blue-900/30 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#1e1f20] border-dashed border-gray-600 hover:border-gray-500 text-gray-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FaUserPlus size={14} className={pickerOpen ? 'text-blue-500' : 'text-gray-500'} />
                                        <span>{selectedIds.length === 0 ? 'افزودن شخص مسئول...' : 'ویرایش لیست افراد'}</span>
                                    </div>
                                    <FaChevronLeft size={12} className={`transition-transform duration-300 ${pickerOpen ? '-rotate-90' : ''}`} />
                                </button>
                            </div>

                            {/* فیلد مهلت */}
                            <div className="bg-[#1e1f20] p-4 rounded-xl border border-gray-800 shadow-sm">
                                <label className="flex items-center gap-2 text-gray-300 text-xs mb-4 font-medium">
                                    <FaCalendarAlt className="text-blue-400" />
                                    مهلت نهایی انجام کار
                                </label>

                                <div className="flex flex-col gap-4">
                                    {/* ردیف اول: تقویم */}
                                    <div className="w-full">
                                        <JalaliDatePicker
                                            name="deadline"
                                            value={deadline}
                                            onChange={handleDeadlineChange}
                                            className="w-full text-sm bg-[#131314] border border-gray-700 rounded-xl px-3 py-2"
                                            placeholder="انتخاب تاریخ"
                                            modal={true}
                                        />
                                    </div>

                                    {/* ردیف دوم: ساعت */}
                                    <div className="w-full bg-[#131314] rounded-xl border border-gray-700 p-3 flex flex-col gap-2">
                                        <span className="text-[11px] text-gray-500 block text-center">انتخاب زمان (ساعت و دقیقه)</span>
                                        <div
                                            className="w-full flex items-center justify-center overflow-hidden"
                                            dir="ltr"
                                        >
                                            <TimeInput
                                                value={deadlineTime}
                                                onChange={setDeadlineTime}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {deadline && <p className="text-xs text-green-400 mt-3 text-center bg-green-900/10 py-1.5 rounded-lg border border-green-900/30">{formatJalaliDateLong(deadline)}</p>}
                            </div>

                            {/* یادداشت */}
                            <div>
                                <label className="block text-gray-300 text-xs mb-2 font-medium">توضیحات تکمیلی</label>
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="یادداشت یا توضیح کوتاه..."
                                    className="w-full bg-[#1e1f20] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-gray-600 shadow-inner"
                                />
                            </div>

                            {/* فایل ضمیمه */}
                            <div>
                                <label className="block text-gray-300 text-xs mb-2 font-medium">فایل ضمیمه (اختیاری)</label>
                                <div className="relative group">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xlsx"
                                        onChange={handleFilesChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-full bg-[#1e1f20] border border-dashed border-gray-600 rounded-xl px-4 py-4 text-sm flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:border-blue-500 group-hover:text-blue-400 transition-colors">
                                        <FaPaperclip size={18} />
                                        <span>برای انتخاب فایل کلیک کنید یا اینجا رها کنید</span>
                                    </div>
                                </div>
                                {files.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 bg-[#1e1f20] p-3 rounded-xl border border-gray-800">
                                        {files.map((f, i) => (
                                            <div key={i} className="text-xs bg-[#2a2b2f] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                                                <span className="truncate max-w-[120px]">{f.name}</span>
                                                <button type="button" onClick={() => handleRemoveFile(i)} className="text-gray-500 hover:text-red-400 transition-colors"><FaTimes size={10} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* پیامک */}
                            <div onClick={() => setSendSms(v => !v)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${sendSms ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'bg-[#1e1f20] border-gray-800 hover:border-gray-700'}`}>
                                <div>
                                    <div className={`text-sm font-bold ${sendSms ? 'text-green-400' : 'text-gray-300'}`}>اطلاع‌رسانی پیامکی</div>
                                    <div className="text-xs text-gray-500 mt-1">ارسال پیامک به گوشی اشخاص مسئول</div>
                                </div>
                                <div className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${sendSms ? 'bg-green-500' : 'bg-gray-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${sendSms ? 'left-1' : 'right-1'}`} />
                                </div>
                            </div>

                            {error && <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 text-center">{error}</div>}
                        </div>

                        {/* فوتر چسبان در پایین */}
                        <div className="px-5 py-4 bg-[#1e1f20] border-t border-gray-800 flex gap-3 shrink-0 z-10">
                            <button type="button" onClick={onClose} className="flex-1 bg-[#2a2b2f] hover:bg-gray-700 text-gray-300 rounded-xl py-3 text-sm font-medium transition-colors border border-gray-700">انصراف</button>
                            <button type="submit" disabled={creating || !title.trim() || !taskType || selectedIds.length === 0} className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-gray-400 text-white rounded-xl py-3 text-sm font-medium transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                                {creating ? <><FaSpinner className="animate-spin" /> در حال ارسال...</> : 'تایید و ایجاد ماموریت'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* ══ پنل چپ: Picker انتخاب کارمند ══ */}
                <div className={`flex-col w-full sm:w-[360px] h-full border-r border-gray-800 bg-[#1a1b1e] transition-all duration-300 ease-out z-10 ${pickerOpen ? 'flex' : 'hidden'}`}>
                    <div className="sm:hidden p-3 border-b border-gray-800 bg-[#1e1f20] flex items-center gap-2 shrink-0">
                        <button type="button" onClick={closePicker} className="flex items-center gap-1.5 text-blue-400 text-sm font-medium px-3 py-2 hover:bg-blue-900/30 bg-blue-900/20 rounded-lg transition-colors">
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
