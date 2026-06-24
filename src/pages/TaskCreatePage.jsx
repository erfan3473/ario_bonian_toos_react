// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import JalaliDatePicker from '../components/JalaliDatePicker';     
// import { formatJalaliDateLong } from '../utils/dateUtils';
// import {
//     fetchSubordinates, createTask,
//     clearCreateSuccess, clearTaskError,
// } from '../features/task/taskSlice';
// import AssigneePickerPanel, { AssigneeChip } from '../components/Task/AssigneePickerPanel';
// import { FaTimes, FaSpinner, FaUserPlus, FaChevronLeft, FaPaperclip, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
// import TimeInput from '../components/TimeInput';

// const TASK_TYPE_OPTIONS = [
//     { value: 'PAYROLL_FORM', label: 'تکمیل فرم حقوق' },
//     { value: 'PURCHASE',     label: 'خرید/تدارکات' },
//     { value: 'REPORT',       label: 'گزارش‌دهی' },
// ];

// const TaskCreatePage = () => {
//     const dispatch = useDispatch();
//     const navigate = useNavigate();
//     const { subordinates, loadingSubordinates, creating, createSuccess, error } = useSelector(s => s.task);

//     const [title, setTitle] = useState('');
//     const [taskType, setTaskType] = useState('');
//     const [selectedIds, setSelectedIds] = useState([]);
//     const [note, setNote] = useState('');
//     const [sendSms, setSendSms] = useState(false);
//     const [pickerOpen, setPickerOpen] = useState(false);
//     const [files, setFiles] = useState([]);
//     const [deadline, setDeadline] = useState('');
//     const [deadlineTime, setDeadlineTime] = useState(''); 

//     useEffect(() => {
//         dispatch(fetchSubordinates());
//         return () => { 
//             dispatch(clearTaskError()); 
//             dispatch(clearCreateSuccess()); 
//         };
//     }, [dispatch]);

//     // ✅ وقتی موفق شد، بازگشت به لیست
//     useEffect(() => { 
//         if (createSuccess) {
//             navigate('/tasks?tab=inbox');
//         }
//     }, [createSuccess, navigate]);

//     const selectedEmps = subordinates.filter(e => selectedIds.includes(e.user_id));

//     const handleSubmit = e => {
//         e.preventDefault();
//         if (!title.trim() || !taskType || selectedIds.length === 0) return;

//         let deadlineIso = null;
//         if (deadline) {
//             const timePart = deadlineTime || '23:59';
//             deadlineIso = `${deadline}T${timePart}`;
//         }

//         dispatch(createTask({
//             title: title.trim(),
//             task_type: taskType,
//             assignee_ids: selectedIds,
//             note: note.trim(),
//             send_sms: sendSms,
//             files,
//             deadline: deadlineIso,
//         }));
//     };

//     const handleBack = () => {
//         navigate(-1); // برگشت به صفحه قبلی
//     };

//     return (
//         <div className="min-h-screen bg-[#131314] text-white" dir="rtl">
//             <div className="container mx-auto px-4 py-6 max-w-6xl">
                
//                 {/* هدر */}
//                 <div className="flex items-center gap-4 mb-6">
//                     <button
//                         onClick={handleBack}
//                         className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition bg-[#1e1f20] border border-gray-700"
//                     >
//                         <FaChevronRight size={16} />
//                     </button>
//                     <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
//                             📝
//                         </div>
//                         ایجاد ماموریت جدید
//                     </h1>
//                 </div>

//                 {/* محتوا: فرم در سمت راست، پیکر در چپ */}
//                 <div className="flex gap-6">
                    
//                     {/* فرم اصلی */}
//                     <div className={`flex-1 transition-all ${pickerOpen ? 'hidden lg:block' : 'block'}`}>
//                         <form onSubmit={handleSubmit} className="bg-[#1e1f20] rounded-2xl border border-gray-800 p-6 space-y-6">
                            
//                             {/* عنوان */}
//                             <div>
//                                 <label className="block text-gray-300 text-sm mb-2 font-medium">عنوان ماموریت <span className="text-red-400">*</span></label>
//                                 <input
//                                     type="text"
//                                     value={title}
//                                     onChange={e => setTitle(e.target.value)}
//                                     placeholder="مثال: بررسی گزارشات مالی آذر"
//                                     className="w-full bg-[#131314] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
//                                     required
//                                 />
//                             </div>

//                             {/* نوع */}
//                             <div>
//                                 <label className="block text-gray-300 text-sm mb-2 font-medium">دسته‌بندی <span className="text-red-400">*</span></label>
//                                 <select
//                                     value={taskType}
//                                     onChange={e => setTaskType(e.target.value)}
//                                     className="w-full bg-[#131314] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
//                                     required
//                                 >
//                                     <option value="">انتخاب کنید...</option>
//                                     {TASK_TYPE_OPTIONS.map(opt => (
//                                         <option key={opt.value} value={opt.value}>{opt.label}</option>
//                                     ))}
//                                 </select>
//                             </div>

//                             {/* مسئولان */}
//                             <div>
//                                 <label className="block text-gray-300 text-sm mb-2 font-medium">
//                                     مسئولان انجام <span className="text-red-400">*</span>
//                                 </label>
//                                 {selectedEmps.length > 0 && (
//                                     <div className="flex flex-wrap gap-2 mb-3">
//                                         {selectedEmps.map(emp => (
//                                             <AssigneeChip 
//                                                 key={emp.user_id} 
//                                                 emp={emp} 
//                                                 onRemove={id => setSelectedIds(p => p.filter(i => i !== id))} 
//                                             />
//                                         ))}
//                                     </div>
//                                 )}
//                                 <button
//                                     type="button"
//                                     onClick={() => setPickerOpen(v => !v)}
//                                     className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all ${
//                                         pickerOpen 
//                                             ? 'bg-blue-900/30 border-blue-500/50 text-blue-400' 
//                                             : 'bg-[#131314] border-dashed border-gray-600 hover:border-gray-500 text-gray-400'
//                                     }`}
//                                 >
//                                     <div className="flex items-center gap-2">
//                                         <FaUserPlus size={14} />
//                                         <span>{selectedIds.length === 0 ? 'افزودن شخص مسئول...' : 'ویرایش لیست افراد'}</span>
//                                     </div>
//                                     <FaChevronLeft size={12} className={`transition-transform ${pickerOpen ? '-rotate-90' : ''}`} />
//                                 </button>
//                             </div>

//                             {/* مهلت */}
//                             <div className="bg-[#131314] p-4 rounded-xl border border-gray-700">
//                                 <label className="flex items-center gap-2 text-gray-300 text-sm mb-3 font-medium">
//                                     <FaCalendarAlt className="text-blue-400" />
//                                     مهلت نهایی
//                                 </label>
//                                 <div className="space-y-3">
//                                     <JalaliDatePicker
//                                         name="deadline"
//                                         value={deadline}
//                                         onChange={e => setDeadline(e.target.value)}
//                                         className="w-full text-sm bg-[#1e1f20] border border-gray-700 rounded-xl px-3 py-2"
//                                         placeholder="انتخاب تاریخ"
//                                     />
//                                     <div dir="ltr">
//                                         <TimeInput value={deadlineTime} onChange={setDeadlineTime} />
//                                     </div>
//                                 </div>
//                                 {deadline && <p className="text-xs text-green-400 mt-2 text-center">{formatJalaliDateLong(deadline)}</p>}
//                             </div>

//                             {/* یادداشت */}
//                             <div>
//                                 <label className="block text-gray-300 text-sm mb-2 font-medium">توضیحات</label>
//                                 <textarea
//                                     value={note}
//                                     onChange={e => setNote(e.target.value)}
//                                     rows={3}
//                                     placeholder="توضیحات تکمیلی..."
//                                     className="w-full bg-[#131314] text-white rounded-xl px-4 py-3 text-sm border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder-gray-600"
//                                 />
//                             </div>

//                             {/* فایل */}
//                             <div>
//                                 <label className="block text-gray-300 text-sm mb-2 font-medium">فایل ضمیمه</label>
//                                 <div className="relative group">
//                                     <input
//                                         type="file"
//                                         multiple
//                                         onChange={e => setFiles(Array.from(e.target.files))}
//                                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
//                                     />
//                                     <div className="w-full bg-[#131314] border border-dashed border-gray-600 rounded-xl px-4 py-4 text-sm flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:border-blue-500 group-hover:text-blue-400 transition-colors">
//                                         <FaPaperclip size={18} />
//                                         <span>کلیک یا رها کنید</span>
//                                     </div>
//                                 </div>
//                                 {files.length > 0 && (
//                                     <div className="flex flex-wrap gap-2 mt-3">
//                                         {files.map((f, i) => (
//                                             <div key={i} className="text-xs bg-[#131314] border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
//                                                 <span className="truncate max-w-[120px]">{f.name}</span>
//                                                 <button 
//                                                     type="button" 
//                                                     onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} 
//                                                     className="text-gray-500 hover:text-red-400"
//                                                 >
//                                                     <FaTimes size={10} />
//                                                 </button>
//                                             </div>
//                                         ))}
//                                     </div>
//                                 )}
//                             </div>

//                             {/* پیامک */}
//                             <div 
//                                 onClick={() => setSendSms(v => !v)} 
//                                 className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
//                                     sendSms 
//                                         ? 'bg-green-900/20 border-green-500/50' 
//                                         : 'bg-[#131314] border-gray-700 hover:border-gray-600'
//                                 }`}
//                             >
//                                 <div>
//                                     <div className={`text-sm font-bold ${sendSms ? 'text-green-400' : 'text-gray-300'}`}>
//                                         اطلاع‌رسانی پیامکی
//                                     </div>
//                                     <div className="text-xs text-gray-500 mt-1">ارسال SMS به افراد</div>
//                                 </div>
//                                 <div className={`w-12 h-6 rounded-full transition-colors relative ${sendSms ? 'bg-green-500' : 'bg-gray-700'}`}>
//                                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sendSms ? 'left-1' : 'right-1'}`} />
//                                 </div>
//                             </div>

//                             {error && (
//                                 <div className="bg-red-900/20 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 text-center">
//                                     {error}
//                                 </div>
//                             )}

//                             {/* دکمه‌ها */}
//                             <div className="flex gap-3 pt-4">
//                                 <button 
//                                     type="button" 
//                                     onClick={handleBack} 
//                                     className="flex-1 bg-gray-700 hover:bg-gray-600 text-white rounded-xl py-3 text-sm font-medium transition-colors"
//                                 >
//                                     انصراف
//                                 </button>
//                                 <button 
//                                     type="submit" 
//                                     disabled={creating || !title.trim() || !taskType || selectedIds.length === 0} 
//                                     className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-gray-400 text-white rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
//                                 >
//                                     {creating ? (
//                                         <>
//                                             <FaSpinner className="animate-spin" /> 
//                                             در حال ارسال...
//                                         </>
//                                     ) : (
//                                         'ایجاد ماموریت'
//                                     )}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>

//                     {/* پنل picker */}
//                     {pickerOpen && (
//                         <div className="w-full lg:w-96 bg-[#1e1f20] rounded-2xl border border-gray-800 overflow-hidden">
//                             <AssigneePickerPanel
//                                 subordinates={subordinates}
//                                 loading={loadingSubordinates}
//                                 selectedIds={selectedIds}
//                                 onChange={setSelectedIds}
//                                 onClose={() => setPickerOpen(false)}
//                             />
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default TaskCreatePage;
