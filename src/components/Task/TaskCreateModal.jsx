// src/components/Task/TaskCreateModal.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchSubordinates, createTask,
    clearCreateSuccess, clearTaskError,
} from '../../features/task/taskSlice';
import AssigneePickerPanel, { AssigneeChip } from './AssigneePickerPanel';
import { FaTimes, FaSpinner, FaUserPlus, FaChevronLeft } from 'react-icons/fa';

const TASK_TYPE_OPTIONS = [
    { value: 'PAYROLL_FORM', label: 'تکمیل فرم حقوق' },
    { value: 'PURCHASE',     label: 'خرید/تدارکات' },
    { value: 'REPORT',       label: 'گزارش‌دهی' },
];

const TaskCreateModal = ({ onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const { subordinates, loadingSubordinates, creating, createSuccess, error } =
        useSelector(s => s.task);

    const [title,       setTitle]       = useState('');
    const [taskType,    setTaskType]    = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [note,        setNote]        = useState('');
    const [sendSms,     setSendSms]     = useState(false);
    const [pickerOpen,  setPickerOpen]  = useState(false);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        dispatch(fetchSubordinates());
        return () => { dispatch(clearTaskError()); dispatch(clearCreateSuccess()); };
    }, [dispatch]);

    useEffect(() => { if (createSuccess) onSuccess(); }, [createSuccess, onSuccess]);

    const selectedEmps = subordinates.filter(e => selectedIds.includes(e.user_id));

    const handleSubmit = e => {
        e.preventDefault();
        if (!title.trim() || !taskType || selectedIds.length === 0) return;
        dispatch(createTask({
            title:        title.trim(),
            task_type:    taskType,
            assignee_ids: selectedIds,
            note:         note.trim(),
            send_sms:     sendSms,
            files:        files,          // ✅ اضافه شد
        }));
    };

    return (
        // ── overlay: روی همه چیز از جمله header ──
        <div
            className="fixed inset-0 flex items-center justify-center p-4"
            style={{ zIndex: 9999 }}
        >
            {/* backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* ── Modal container — expand افقی ── */}
            <div
                className="relative flex flex-row-reverse rounded-2xl overflow-hidden shadow-2xl border border-gray-700 transition-all duration-300 ease-out"
                style={{
                    background: '#1e2533',
                    width: pickerOpen ? 'min(860px, 95vw)' : 'min(460px, 95vw)',
                    maxHeight: '90vh',
                    zIndex: 10000,
                }}
            >
                {/* ══ پنل راست: فرم ══ */}
                <div
                    className="flex flex-col flex-shrink-0 overflow-hidden"
                    style={{ width: 'min(460px, 95vw)', maxHeight: '90vh' }}
                >
                    {/* هدر */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
                        <h2 className="text-white font-bold text-base">ماموریت جدید</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700 transition"
                        >
                            <FaTimes size={15} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden flex-1">
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                            {/* عنوان */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                                    عنوان ماموریت *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="مثال: تکمیل فرم‌های حقوق آذر"
                                    className="w-full bg-gray-700/60 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-600 focus:outline-none focus:border-blue-500 transition"
                                    required
                                />
                            </div>

                            {/* نوع ماموریت */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                                    نوع ماموریت *
                                </label>
                                <select
                                    value={taskType}
                                    onChange={e => setTaskType(e.target.value)}
                                    className="w-full bg-gray-700/60 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-600 focus:outline-none focus:border-blue-500 transition"
                                    required
                                >
                                    <option value="">انتخاب کنید...</option>
                                    {TASK_TYPE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* انتخاب مسئولان */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                                    مسئولان *{' '}
                                    {selectedIds.length > 0 && (
                                        <span className="text-blue-400 font-normal">
                                            ({selectedIds.length} نفر)
                                        </span>
                                    )}
                                </label>

                                {/* chips */}
                                {selectedEmps.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {selectedEmps.map(emp => (
                                            <AssigneeChip
                                                key={emp.user_id}
                                                emp={emp}
                                                onRemove={id => setSelectedIds(p => p.filter(i => i !== id))}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* دکمه picker */}
                                <button
                                    type="button"
                                    onClick={() => setPickerOpen(v => !v)}
                                    className={`
                                        w-full flex items-center justify-between
                                        px-4 py-2.5 rounded-xl border text-sm transition
                                        ${pickerOpen
                                            ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                            : 'bg-gray-700/60 border-gray-600 hover:border-gray-500 text-gray-400'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <FaUserPlus size={13} />
                                        <span>
                                            {selectedIds.length === 0
                                                ? 'انتخاب افراد مسئول...'
                                                : 'ویرایش انتخاب'
                                            }
                                        </span>
                                    </div>
                                    <FaChevronLeft
                                        size={11}
                                        className={`transition-transform duration-300 ${pickerOpen ? '-rotate-180' : 'rotate-0'}`}
                                    />
                                </button>
                            </div>

                            {/* یادداشت */}
                            <div>
                                <label className="block text-gray-400 text-xs mb-1.5 font-medium">
                                    یادداشت (اختیاری)
                                </label>
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    rows={3}
                                    placeholder="توضیح کوتاه..."
                                    className="w-full bg-gray-700/60 text-white rounded-xl px-4 py-2.5 text-sm border border-gray-600 focus:outline-none focus:border-blue-500 transition resize-none"
                                />
                            </div>

                            {/* SMS toggle */}
                            <div
                                onClick={() => setSendSms(v => !v)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                                    sendSms
                                        ? 'bg-green-500/10 border-green-500/40'
                                        : 'bg-gray-700/60 border-gray-600 hover:border-gray-500'
                                }`}
                            >
                                <div>
                                    <div className={`text-sm font-medium ${sendSms ? 'text-green-400' : 'text-gray-300'}`}>
                                        ارسال پیامک
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        اطلاع‌رسانی به مسئولان از طریق پیامک
                                    </div>
                                </div>
                                <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${sendSms ? 'bg-green-500' : 'bg-gray-600'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${sendSms ? 'right-1' : 'left-1'}`} />
                                </div>
                            </div>
                            {/* ── فایل ضمیمه ── */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">
                                    فایل ضمیمه (اختیاری)
                                </label>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xlsx"
                                    onChange={e => setFiles(Array.from(e.target.files))}
                                    className="w-full text-xs text-gray-300 bg-gray-700 rounded-lg 
                                            border border-gray-600 px-3 py-2 
                                            file:mr-2 file:bg-blue-600 file:text-white 
                                            file:border-0 file:rounded file:px-2 file:py-1 file:text-xs
                                            cursor-pointer"
                                />
                                {files.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {files.map((f, i) => (
                                            <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}
                                                <button
                                                    type="button"
                                                    onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                                                    className="text-gray-500 hover:text-red-400"
                                                >×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>



                            {error && (
                                <div className="bg-red-500/20 border border-red-500/40 text-red-400 text-sm rounded-xl px-4 py-3">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* فوتر */}
                        <div className="px-5 py-4 border-t border-gray-700 flex gap-3 flex-shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl py-2.5 text-sm transition"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                disabled={creating || !title.trim() || !taskType || selectedIds.length === 0}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-medium transition flex items-center justify-center gap-2"
                            >
                                {creating
                                    ? <><FaSpinner className="animate-spin" /> ارسال...</>
                                    : 'ارسال ماموریت'
                                }
                            </button>
                        </div>
                    </form>
                </div>

                {/* ══ پنل چپ: Picker — expand از چپ ══ */}
                <div
                    className="flex-shrink-0 overflow-hidden transition-all duration-300 ease-out border-r border-gray-700/60"
                    style={{
                        width: pickerOpen ? '360px' : '0px',
                        opacity: pickerOpen ? 1 : 0,
                        maxHeight: '90vh',
                    }}
                >
                    <div style={{ width: '360px', height: '100%' }}>
                        <AssigneePickerPanel
                            subordinates={subordinates}
                            loading={loadingSubordinates}
                            selectedIds={selectedIds}
                            onChange={setSelectedIds}
                            onClose={() => setPickerOpen(false)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCreateModal;
