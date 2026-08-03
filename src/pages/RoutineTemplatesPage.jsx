import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchTemplates, createTemplate, updateTemplate, deleteTemplate, 
    fetchSelectorPositions, fetchSelectorUsers 
} from '../features/routine/routineSlice';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
    FaPlus, FaListAlt, FaTimes, FaCheckSquare, FaChevronDown, 
    FaClock, FaArrowRight, FaCalendar, FaTrash, FaSave, FaUserTie 
} from 'react-icons/fa';

import RoutineTemplateCard from '../components/routine/RoutineTemplateCard'; 
import JalaliDatePicker from '../components/common/JalaliDatePicker';

const WEEK_DAYS = [
    { value: 0, label: 'شنبه' },
    { value: 1, label: 'یکشنبه' },
    { value: 2, label: 'دوشنبه' },
    { value: 3, label: 'سه‌شنبه' },
    { value: 4, label: 'چهارشنبه' },
    { value: 5, label: 'پنج‌شنبه' },
    { value: 6, label: 'جمعه' },
];

const TABS = [
    { id: 'ALL', label: 'همه' },
    { id: 'DAILY', label: 'روزانه' },
    { id: 'WEEKLY', label: 'هفتگی' },
    { id: 'MONTHLY', label: 'ماهانه' },
    { id: 'YEARLY', label: 'سالانه' }
];

const initialFormData = {
    title: '',
    period: 'DAILY',
    schedule_day_of_month: 1,
    schedule_date: '', 
    reminder_time: '09:00',
    difficulty: 'MEDIUM',
    trigger_mode: 'HYBRID', 
    target_user: '',
    target_position: '',
    checklists: [{ title: '', order: 1, target_days: [] }] 
};

const RoutineTemplatesPage = () => {
    const dispatch = useDispatch();
    const { templates, templateLoading, selectorPositions, selectorUsers, error } = useSelector((state) => state.routine);
    
    const { userInfo } = useSelector((state) => state.userLogin);
    const { user: userProfile } = useSelector((state) => state.userDetails);
    const currentUser = userProfile && Object.keys(userProfile).length > 0 ? userProfile : userInfo;
    
    const isAdmin = currentUser?.is_admin || false;
    const userRole = currentUser?.employee?.position?.report_type || "UNKNOWN";
    const allowedRolesForRoutine = ['MANAGING_COUNCIL', 'TECHNICAL_OFFICE', 'PROJECT_MANAGER'];
    const isManager = isAdmin || allowedRolesForRoutine.includes(userRole);

    const mode = useSelector((state) => state.theme?.mode || "dark");
    const isDark = mode === "dark";

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [activeTab, setActiveTab] = useState('ALL');
    const [userSearch, setUserSearch] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [positionSearch, setPositionSearch] = useState('');
    const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);

    const userRef = useRef(null);
    const positionRef = useRef(null);
    
    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        dispatch(fetchTemplates());
        if (isManager) {
            dispatch(fetchSelectorPositions());
            dispatch(fetchSelectorUsers());
        }
    }, [dispatch, isManager]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userRef.current && !userRef.current.contains(event.target)) setUserDropdownOpen(false);
            if (positionRef.current && !positionRef.current.contains(event.target)) setPositionDropdownOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const filteredUsers = selectorUsers?.filter(user => 
        user.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.username?.toLowerCase().includes(userSearch.toLowerCase())
    );
    const filteredPositions = selectorPositions?.filter(pos => 
        pos.title?.toLowerCase().includes(positionSearch.toLowerCase())
    );

    const selectedUserLabel = selectorUsers?.find(u => u.id === parseInt(formData.target_user))?.display_name || '-- برنامه شخصی (برای خودم) --';
    const selectedPositionLabel = selectorPositions?.find(p => p.id === parseInt(formData.target_position))?.title || '-- انتخاب سمت سازمانی --';

    const filteredTemplates = useMemo(() => {
        if (!templates) return [];
        if (activeTab === 'ALL') return templates;
        return templates.filter(tpl => tpl.period === activeTab);
    }, [templates, activeTab]);

    const handlePeriodChange = (newPeriod) => {
        let updatedChecklists = [...formData.checklists];
        if (newPeriod === 'WEEKLY') {
            updatedChecklists = updatedChecklists.map(c => ({
                ...c, target_days: c.target_days?.length ? c.target_days : [0] 
            }));
        } else {
            updatedChecklists = updatedChecklists.map(c => ({...c, target_days: []}));
        }
        setFormData({...formData, period: newPeriod, checklists: updatedChecklists});
    };

    const handleAddChecklist = () => {
        setFormData({ ...formData, checklists: [...formData.checklists, { title: '', order: formData.checklists.length + 1, target_days: [] }] });
    };

    const handleAddChecklistToDay = (dayValue) => {
        setFormData({ ...formData, checklists: [...formData.checklists, { title: '', order: formData.checklists.length + 1, target_days: [dayValue] }] });
    };

    const handleChecklistChange = (index, value) => {
        const newChecklists = [...formData.checklists];
        newChecklists[index].title = value;
        setFormData({ ...formData, checklists: newChecklists });
    };

    const handleRemoveChecklist = (index) => {
        const newChecklists = formData.checklists.filter((_, i) => i !== index);
        setFormData({ ...formData, checklists: newChecklists });
    };

    const handleOpenNewForm = () => {
        setEditingId(null);
        setFormData(initialFormData);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
    };

    const handleEditTemplate = (tpl) => {
        setEditingId(tpl.id);
        setFormData({
            title: tpl.title,
            period: tpl.period,
            schedule_day_of_month: tpl.schedule_day_of_month || 1,
            schedule_date: tpl.schedule_value ? `1403-${tpl.schedule_value.replace('-', '/')}` : '',
            reminder_time: tpl.reminder_time ? tpl.reminder_time.substring(0, 5) : '09:00',
            difficulty: tpl.difficulty || 'MEDIUM',
            trigger_mode: tpl.trigger_mode || 'HYBRID',
            target_user: tpl.target_user ? tpl.target_user.toString() : '',
            target_position: tpl.target_position ? tpl.target_position.toString() : '',
            checklists: tpl.checklists?.length 
                ? tpl.checklists.map(c => ({ ...c, target_days: c.target_days || [] })) 
                : [{ title: '', order: 1, target_days: [] }]
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteTemplate = (id) => {
        if(window.confirm('آیا از حذف این الگو اطمینان دارید؟')) {
            dispatch(deleteTemplate(id))
                .unwrap()
                .then(() => toast.success('الگو با موفقیت حذف شد.'))
                .catch(err => toast.error(err || 'خطا در حذف الگو.'));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.title.trim()) return toast.error("عنوان الگو الزامی است.");
        if (formData.period === 'YEARLY' && !formData.schedule_date) return toast.error("تاریخ اجرای سالانه الزامی است.");

        const cleanChecklists = formData.checklists.filter(c => c.title.trim() !== '');
        if (cleanChecklists.length === 0) return toast.error("حداقل یک وظیفه وارد کنید.");

        let finalDaysOfWeek = [];
        if (formData.period === 'WEEKLY') {
            const daysSet = new Set();
            cleanChecklists.forEach(c => {
                if (c.target_days) c.target_days.forEach(d => daysSet.add(d));
            });
            finalDaysOfWeek = Array.from(daysSet).sort();
            if (finalDaysOfWeek.length === 0) return toast.error("حداقل یک وظیفه برای یکی از روزهای هفته تعریف کنید.");
        }

        let finalScheduleValue = null;
        if (formData.period === 'YEARLY' && formData.schedule_date) {
            const dateParts = formData.schedule_date.replace(/\//g, '-');
            finalScheduleValue = dateParts.length > 5 ? dateParts.substring(dateParts.length - 5) : dateParts; 
        }

        const payload = {
            ...formData,
            schedule_days_of_week: finalDaysOfWeek,
            schedule_day_of_month: formData.period === 'MONTHLY' ? parseInt(formData.schedule_day_of_month) : null,
            schedule_value: finalScheduleValue, 
            reminder_time: formData.trigger_mode === 'CHECKOUT_BASED' ? null : formData.reminder_time,
            checklists: cleanChecklists,
            target_user: formData.target_user ? parseInt(formData.target_user) : null,
            target_position: formData.target_position ? parseInt(formData.target_position) : null,
        };
        
        delete payload.schedule_date;

        setIsSubmitting(true);
        try {
            const actionToDispatch = editingId 
                ? updateTemplate({ id: editingId, templateData: payload }) 
                : createTemplate(payload);

            const resultAction = await dispatch(actionToDispatch);
            
            if (!resultAction.error) {
                toast.success(editingId ? 'تغییرات الگو ذخیره شد.' : 'الگو با موفقیت ایجاد شد!');
                handleCloseForm();
                dispatch(fetchTemplates());
            } else {
                toast.error(resultAction.payload || 'خطا در برقراری ارتباط.');
            }
        } catch (error) {
            toast.error('خطا در ارتباط با سرور.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in p-2 md:p-4 text-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h1 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <FaListAlt className="text-indigo-500" /> مدیریت الگوهای گردش کار
                </h1>
                
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link to="/routines" className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'}`}>
                        <FaArrowRight size={12} /> بازگشت
                    </Link>
                    {!showForm && (
                        <button onClick={handleOpenNewForm} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-sm">
                            <FaPlus size={12} /> الگوی جدید
                        </button>
                    )}
                </div>
            </div>

            {showForm && (
                <div className={`mb-6 rounded-xl border shadow-lg overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-4 py-3 flex justify-between items-center border-b ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-2">
                            <FaCalendar className="text-indigo-500" />
                            <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {editingId ? 'ویرایش برنامه روتین' : 'طراحی برنامه روتین جدید'}
                            </h2>
                        </div>
                        <button onClick={handleCloseForm} className={`p-1.5 rounded-md transition ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-800'}`}>
                            <FaTimes size={14} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} id="routine-form" className="p-4 space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                                <h3 className={`font-semibold flex items-center gap-2 pb-2 border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
                                    <FaListAlt className="text-blue-500" /> اطلاعات پایه
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 sm:col-span-1 space-y-1">
                                        <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>عنوان روتین <span className="text-red-500">*</span></label>
                                        <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className={`w-full p-2 text-sm rounded-lg border focus:ring-1 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`} placeholder="عنوان..." />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 space-y-1">
                                        <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>درجه سختی</label>
                                        <select value={formData.difficulty} onChange={(e) => setFormData({...formData, difficulty: e.target.value})} className={`w-full p-2 text-sm rounded-lg border focus:ring-1 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}>
                                            <option value="EASY">آسان</option>
                                            <option value="MEDIUM">متوسط</option>
                                            <option value="HARD">سخت</option>
                                            <option value="EXPERT">بسیار سخت</option>
                                        </select>
                                    </div>
                                </div>

                                {isManager && (
                                    <div className="pt-2">
                                        <h4 className={`text-xs font-semibold mb-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <FaUserTie className="text-indigo-400" /> تخصیص هدف
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="relative" ref={userRef}>
                                                <div onClick={() => !formData.target_position && setUserDropdownOpen(!userDropdownOpen)} className={`w-full p-2 rounded-lg border flex justify-between items-center cursor-pointer transition text-xs ${formData.target_position ? (isDark ? 'bg-gray-800/50 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200') : (isDark ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-300')}`}>
                                                    <span className="truncate">{selectedUserLabel}</span>
                                                    <FaChevronDown size={10} className={`transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                                {userDropdownOpen && (
                                                    <div className={`absolute z-20 w-full mt-1 rounded-lg shadow-xl border p-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}>
                                                        <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="جستجو..." className={`w-full px-2 py-1 text-xs rounded border mb-2 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                                                        <div className="max-h-32 overflow-y-auto text-xs custom-scrollbar">
                                                            <div onClick={() => { setFormData({...formData, target_user: ''}); setUserDropdownOpen(false); }} className={`p-1.5 rounded cursor-pointer mb-1 ${isDark ? 'hover:bg-gray-600' : 'hover:bg-indigo-50'}`}>-- برنامه شخصی --</div>
                                                            {filteredUsers?.map(user => (
                                                                <div key={user.id} onClick={() => { setFormData({...formData, target_user: user.id.toString()}); setUserDropdownOpen(false); }} className={`p-1.5 rounded cursor-pointer ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                                                                    {user.display_name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="relative" ref={positionRef}>
                                                <div onClick={() => !formData.target_user && setPositionDropdownOpen(!positionDropdownOpen)} className={`w-full p-2 rounded-lg border flex justify-between items-center cursor-pointer transition text-xs ${formData.target_user ? (isDark ? 'bg-gray-800/50 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200') : (isDark ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600' : 'bg-white border-gray-300')}`}>
                                                    <span className="truncate">{selectedPositionLabel}</span>
                                                    <FaChevronDown size={10} className={`transition-transform ${positionDropdownOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                                {positionDropdownOpen && (
                                                    <div className={`absolute z-20 w-full mt-1 rounded-lg shadow-xl border p-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200'}`}>
                                                        <input type="text" value={positionSearch} onChange={(e) => setPositionSearch(e.target.value)} placeholder="جستجو..." className={`w-full px-2 py-1 text-xs rounded border mb-2 ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`} />
                                                        <div className="max-h-32 overflow-y-auto text-xs custom-scrollbar">
                                                            <div onClick={() => { setFormData({...formData, target_position: ''}); setPositionDropdownOpen(false); }} className={`p-1.5 rounded cursor-pointer mb-1 ${isDark ? 'hover:bg-gray-600' : 'hover:bg-indigo-50'}`}>-- بدون سمت --</div>
                                                            {filteredPositions?.map(pos => (
                                                                <div key={pos.id} onClick={() => { setFormData({...formData, target_position: pos.id.toString()}); setPositionDropdownOpen(false); }} className={`p-1.5 rounded cursor-pointer ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}>
                                                                    {pos.title}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className={`p-4 rounded-xl border space-y-4 ${isDark ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                                <h3 className={`font-semibold flex items-center gap-2 pb-2 border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
                                    <FaClock className="text-emerald-500" /> بازه زمانی و اجرای روتین
                                </h3>
                                
                                <div className="flex bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-lg">
                                    {[ { id: 'DAILY', label: 'روزانه' }, { id: 'WEEKLY', label: 'هفتگی' }, { id: 'MONTHLY', label: 'ماهانه' }, { id: 'YEARLY', label: 'سالانه' } ].map(p => (
                                        <button key={p.id} type="button" onClick={() => handlePeriodChange(p.id)} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${formData.period === p.id ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-800 shadow-sm') : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                            {p.label}
                                        </button>
                                    ))}
                                </div>

                                {formData.period === 'MONTHLY' && (
                                    <div className="space-y-2">
                                        <label className={`text-xs font-semibold flex items-center justify-start ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            <span>انتخاب روز اجرا در ماه :</span>
                                            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                                ماه جاری: {new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(new Date())}
                                            </span>
                                        </label>
                                        <div className="grid grid-cols-7 gap-1">
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, schedule_day_of_month: day})}
                                                    className={`py-1 text-xs font-medium rounded transition-all ${
                                                        formData.schedule_day_of_month === day 
                                                        ? 'bg-indigo-600 text-white shadow-md' 
                                                        : (isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 border border-gray-200')
                                                    }`}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formData.period === 'YEARLY' && (
                                    <div className="space-y-1 relative">
                                        <label className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>تاریخ اجرا در سال</label>
                                        <JalaliDatePicker name="schedule_date" value={formData.schedule_date} onChange={(e) => setFormData({...formData, schedule_date: e.target.value})} placeholder="انتخاب روز و ماه" inputClassName={`w-full p-2 text-sm pl-10 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-gray-700 border-gray-200">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-gray-500">یادآوری</label>
                                        <input type="time" disabled={formData.trigger_mode === 'CHECKOUT_BASED'} value={formData.reminder_time} onChange={(e) => setFormData({...formData, reminder_time: e.target.value})} className={`w-full p-1.5 text-xs rounded border dir-ltr ${formData.trigger_mode === 'CHECKOUT_BASED' ? 'opacity-50' : ''} ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-semibold text-gray-500">نوع تریگر</label>
                                        <select value={formData.trigger_mode} onChange={(e) => setFormData({...formData, trigger_mode: e.target.value})} className={`w-full p-1.5 text-[10px] rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`}>
                                            <option value="HYBRID">ترکیبی</option>
                                            <option value="CHECKOUT_BASED">خروج</option>
                                            <option value="TIME_BASED">ساعت</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-900/30 border-gray-700' : 'bg-gray-50/50 border-gray-200'}`}>
                            <h3 className={`font-semibold flex items-center justify-between gap-2 pb-3 mb-3 border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
                                <div className="flex items-center gap-2">
                                    <FaCheckSquare className="text-amber-500" /> 
                                    {formData.period === 'WEEKLY' ? 'جدول برنامه‌ریزی هفتگی' : 'چک‌لیست وظایف'}
                                </div>
                            </h3>

                            {formData.period === 'WEEKLY' ? (
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x w-full">
                                    {WEEK_DAYS.map(day => {
                                        const itemsInDay = formData.checklists.map((item, idx) => ({...item, originalIndex: idx})).filter(c => c.target_days?.includes(day.value));
                                        return (
                                            <div key={day.value} className={`min-w-[220px] snap-center rounded-xl border flex flex-col ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                                                <div className={`p-2 border-b flex justify-between items-center text-xs ${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-100 bg-gray-50'} rounded-t-xl`}>
                                                    <span className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{day.label}</span>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-gray-900 text-gray-400' : 'bg-white border text-gray-500'}`}>
                                                        {itemsInDay.length} تسک
                                                    </span>
                                                </div>
                                                <div className="p-2 flex-1 space-y-2 min-h-[100px]">
                                                    {itemsInDay.map((item) => (
                                                        <div key={item.originalIndex} className={`flex items-start gap-1 p-1.5 rounded-lg border group ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                                            <textarea rows="1" value={item.title} onChange={(e) => handleChecklistChange(item.originalIndex, e.target.value)} placeholder="شرح..." className={`flex-1 w-full text-xs resize-none focus:outline-none bg-transparent overflow-hidden ${isDark ? 'text-gray-200' : 'text-gray-800'}`} />
                                                            <button type="button" onClick={() => handleRemoveChecklist(item.originalIndex)} className="text-red-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <FaTrash size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => handleAddChecklistToDay(day.value)} className={`w-full py-1.5 rounded-lg border border-dashed flex items-center justify-center gap-1 text-xs transition-colors ${isDark ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                                                        <FaPlus size={10} /> افزودن
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-2 max-w-2xl">
                                    {formData.checklists.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold shrink-0 ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
                                            <input type="text" value={item.title} onChange={(e) => handleChecklistChange(idx, e.target.value)} placeholder="شرح وظیفه..." className={`flex-1 p-2 text-sm rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300'}`} required />
                                            {formData.checklists.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveChecklist(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                                    <FaTrash size={12} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <button type="button" onClick={handleAddChecklist} className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg mt-2 ${isDark ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                        <FaPlus size={10} /> سطر جدید
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                form="routine-form" 
                                type="submit" 
                                disabled={isSubmitting}
                                className="px-5 py-2 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm shadow-md transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    <>
                                        <FaSave /> {editingId ? 'ذخیره تغییرات' : 'ذخیره الگو'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {!templateLoading && templates?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 custom-scrollbar">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                activeTab === tab.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : (isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 shadow-sm')
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            )}

            {templateLoading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
            ) : filteredTemplates?.length === 0 ? (
                <div className={`text-center py-8 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    هیچ الگویی در این دسته‌بندی یافت نشد.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
                    {filteredTemplates.map((tpl) => (
                        <RoutineTemplateCard 
                            key={tpl.id} 
                            tpl={tpl} 
                            isDark={isDark} 
                            onEdit={handleEditTemplate}
                            onDelete={handleDeleteTemplate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoutineTemplatesPage;