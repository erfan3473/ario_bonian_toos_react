import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createLetter, clearCreateSuccess, fetchAllPersonnel, fetchOrganizations, fetchLetters } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaMagic, FaTrashAlt, FaChevronDown, FaChevronLeft, FaCalendarAlt, FaHashtag, FaUserEdit } from 'react-icons/fa';
import JalaliDatePicker from '../../components/JalaliDatePicker'; 
import logo from '../../assets/ario.png';

const DRAFT_KEY = 'secretariat_create_draft';

const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel.find(p => String(p.id) === String(value));
            if (selected) setSearchTerm(`${selected.name} - ${selected.position_title || 'بدون سمت'}`);
        } else {
            setSearchTerm('');
        }
    }, [value, personnel]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = personnel.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.position_title && p.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const inputClass = `w-full p-2 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'}`;

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                className={inputClass}
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === '') onChange('');
                }}
                onFocus={() => setIsOpen(true)}
            />
            <FaChevronDown className="absolute left-3 top-3 text-gray-400 pointer-events-none text-xs" />
            
            {isOpen && (
                <ul className={`absolute z-10 w-full mt-1 max-h-52 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <li 
                        className={`p-2 cursor-pointer text-sm font-bold opacity-70 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        onClick={() => { onChange(''); setIsOpen(false); }}
                    >
                        -- نامشخص / ثبت دستی در پایین --
                    </li>
                    {filtered.map(emp => (
                        <li 
                            key={emp.id}
                            className={`p-2 cursor-pointer text-sm border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
                            onClick={() => {
                                onChange(emp.id.toString());
                                setSearchTerm(`${emp.name} - ${emp.position_title || 'بدون سمت'}`);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-[10px] opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="p-2 text-sm opacity-50 text-center">موردی یافت نشد</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const DirectionalLogo = ({ type, colorName }) => {
    const isOutward = type === 'OUTGOING';
    const isInternal = type === 'INTERNAL';

    const colorMaps = {
        green: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-600 dark:text-green-400' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    };
    const theme = colorMaps[colorName] || colorMaps.purple;

    return (
        <div className={`relative w-16 h-16 shrink-0 flex items-center justify-center rounded-2xl shadow-sm border-2 transition-all duration-500 ${theme.bg} ${theme.border}`}>
            <img src={logo} alt="لوگو" className="w-10 h-10 object-contain z-10 relative" />
            <div className={`absolute inset-0 z-20 transition-transform duration-700 ease-in-out ${isInternal ? 'rotate-45' : isOutward ? 'rotate-90' : 'rotate-0'}`}>
                {[0, 90, 180, 270].map((rotation, i) => (
                    <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" className={`transition-all duration-500 drop-shadow-sm ${theme.text} -mt-3 ${!isInternal && !isOutward ? 'rotate-180' : 'rotate-0'}`}>
                            {isInternal ? (
                                <><path d="M 22 22 A 18 18 0 0 0 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><path d="M 12 12 L 6 6 L 12 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></>
                            ) : (
                                <><path d="M 12 23 Q 22 14, 12 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><path d="M 6 9 L 12 3 L 18 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-40 12 3)" /></>
                            )}
                        </svg>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SecretariatCreateScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); 
    const replyData = location.state?.replyTo; 

    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { userInfo } = useSelector((state) => state.userLogin);
    const isLevelZeroOrAdmin = userInfo?.is_admin || (userInfo?.employee?.position?.hierarchy_level === 0);

    // 🚀 واکشی اطلاعات پرسنلی شخص لاگین شده
    const myEmployeeId = userInfo?.employee?.id ? String(userInfo.employee.id) : '';
    const myName = userInfo?.employee?.name || (userInfo?.first_name ? `${userInfo.first_name} ${userInfo.last_name}` : userInfo?.username || 'شما');

    const { creating, createSuccess, error, allPersonnel, organizations, letters: lettersData } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : (lettersData?.results || []);

    const [attachments, setAttachments] = useState(null);
    const [formData, setFormData] = useState({
        subject: '', letter_type: 'INTERNAL', indicator_number: '', original_number: '', original_date: '',
        destination_indicator: '', destination_date: '', internal_sender: '', external_sender: '', internal_receiver: '',
        external_receiver: '', receiver_persons: '', manual_sender_name: '', manual_receiver_name: '', 
        urgency: 'NORMAL', confidentiality: 'NORMAL', has_physical_copy: true, physical_archive_location: '',
        attachment_note: '', contract_number: '', reference_number: '', reference_letter: '', cc_text: '', internal_cc_receivers: [], 
    });

    const formalDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date());

    const generateIndicator = (type) => {
        const prefix = type === 'INTERNAL' ? 'INT' : type === 'INCOMING' ? 'INC' : 'OUT';
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const datePart = new Date().toLocaleDateString('fa-IR').replace(/\//g, '');
        return `${prefix}-${datePart}-${randomCode}`;
    };

    useEffect(() => {
        dispatch(fetchAllPersonnel());
        dispatch(fetchOrganizations()); 
        if (!lettersList || lettersList.length === 0) dispatch(fetchLetters({}));
        
        if (replyData) {
            setFormData(prev => ({
                ...prev, letter_type: 'OUTGOING', indicator_number: generateIndicator('OUTGOING'),
                subject: `پاسخ به: ${replyData.subject}`, reference_number: replyData.indicator, reference_letter: replyData.id,
            }));
            toast('فرم در حالت پاسخ به نامه تنظیم شد', { icon: '📝' });
        } else {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    // در صورت داخلی بودن حتما فرستنده را به شخص جاری تغییر می‌دهیم
                    if (parsedDraft.letter_type === 'INTERNAL') parsedDraft.internal_sender = myEmployeeId;
                    
                    setFormData({ ...parsedDraft, indicator_number: generateIndicator(parsedDraft.letter_type || 'INTERNAL') });
                    toast('فرم ناتمام قبلی بازیابی شد', { icon: '♻', duration: 3000 });
                } catch (err) { setFormData(prev => ({ ...prev, indicator_number: generateIndicator('INTERNAL'), internal_sender: myEmployeeId })); }
            } else { setFormData(prev => ({ ...prev, indicator_number: generateIndicator('INTERNAL'), internal_sender: myEmployeeId })); }
        }
    }, [dispatch, replyData, myEmployeeId]);

    useEffect(() => {
        if (formData.indicator_number && !replyData) localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, [formData, replyData]);

    useEffect(() => {
        if (createSuccess) {
            localStorage.removeItem(DRAFT_KEY);
            toast.success('مکاتبه با موفقیت ثبت شد');
            dispatch(clearCreateSuccess());
            navigate('/secretariat');
        }
    }, [createSuccess, dispatch, navigate]);

    const handleClearDraft = () => {
        if (window.confirm('آیا از پاک کردن کامل فرم مطمئن هستید؟ تمام اطلاعات تایپ شده حذف خواهند شد.')) {
            localStorage.removeItem(DRAFT_KEY);
            navigate('/secretariat/create', { replace: true, state: {} }); 
            window.location.reload(); 
        }
    };

    // 🚀 تغییر منطق: تنظیم اتوماتیک فرستنده به خود شخص برای نامه داخلی
    const handleTypeChange = (newType) => {
        setFormData(prev => ({ 
            ...prev, 
            letter_type: newType, 
            indicator_number: generateIndicator(newType),
            internal_sender: newType === 'INTERNAL' ? myEmployeeId : '', 
            external_sender: '', 
            internal_receiver: '', 
            external_receiver: '',
            destination_indicator: newType !== 'OUTGOING' ? '' : prev.destination_indicator,
            destination_date: newType !== 'OUTGOING' ? '' : prev.destination_date
        }));
    };

    const handleMultiSelectChange = (e) => {
        const values = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({ ...formData, internal_cc_receivers: values });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.indicator_number) return toast.error('موضوع و شماره اندیکاتور الزامی است');

        const fd = new FormData();
        Object.keys(formData).forEach(key => {
            if (Array.isArray(formData[key])) {
                formData[key].forEach(val => fd.append(key, val));
            } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
                fd.append(key, formData[key]);
            }
        });

        if (attachments && attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) fd.append('attachments', attachments[i]);
        }
        dispatch(createLetter(fd));
    };

    const inputClass = `w-full p-2 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'}`;

    const typeConfigs = {
        'INCOMING': { color: 'green', text: 'وارده' },
        'OUTGOING': { color: 'orange', text: 'صادره' },
        'INTERNAL': { color: 'purple', text: 'داخلی' }
    };
    const currentTypeConfig = typeConfigs[formData.letter_type] || typeConfigs['INTERNAL'];

    return (
        <div className="max-w-5xl mx-auto p-3 relative">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold mb-3 opacity-80">
                <Link to="/secretariat" className="text-blue-500 hover:text-blue-700 transition">دبیرخانه</Link>
                <FaChevronLeft className="text-[9px]" />
                <span>ثبت پیش‌نویس مکاتبه</span>
            </div>

            <div className="flex flex-col items-center justify-center relative mb-5 mt-1">
                <DirectionalLogo type={formData.letter_type} colorName={currentTypeConfig.color} />
                <h2 className={`text-xl mt-3 font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {replyData ? 'ثبت پاسخ نامه' : `ثبت مکاتبه ${currentTypeConfig.text}`}
                </h2>
                <button 
                    type="button" 
                    onClick={handleClearDraft}
                    className="absolute left-0 top-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold transition-colors"
                >
                    <FaTrashAlt /> <span className="hidden sm:inline">پاک کردن فرم</span>
                </button>
            </div>
            {error && <div className="bg-red-100 text-red-700 p-2 mb-3 rounded-lg text-xs font-bold text-center">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 🚀 اطلاعات سیستمی و ثابت (شماره، تاریخ، فرستنده داخلی) */}
                <div className={`p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row gap-6 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/50 border-blue-200/50'}`}>
                    <div className="flex-1">
                        <label className="block mb-1.5 text-[11px] font-bold opacity-80 flex justify-between items-center text-blue-600 dark:text-blue-400">
                            <span className="flex items-center gap-1"><FaHashtag /> شناسه پیگیری موقت</span>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, indicator_number: generateIndicator(formData.letter_type) }))} className="text-blue-500 hover:text-blue-700 flex items-center gap-1 transition bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                                <FaMagic /> <span className="hidden sm:inline">تولید مجدد</span>
                            </button>
                        </label>
                        <input type="text" dir="ltr" className={`${inputClass} font-mono font-black text-left bg-white/50 dark:bg-gray-900/50 cursor-not-allowed border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 tracking-widest`} value={formData.indicator_number} readOnly />
                    </div>

                    {/* 🚀 فیلد ثابت اطلاعات فرستنده (فقط برای نامه داخلی نمایش داده می‌شود) */}
                    {formData.letter_type === 'INTERNAL' && (
                        <div className="flex-1 border-t md:border-t-0 md:border-r border-blue-200/50 dark:border-slate-700 pt-3 md:pt-0 md:pr-6 flex flex-col justify-center">
                            <label className="block mb-1.5 text-[11px] font-bold opacity-80 flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                <FaUserEdit /> فرستنده (شما)
                            </label>
                            <div className={`p-2 rounded-lg text-center font-bold text-xs border bg-white/50 dark:bg-gray-900/50 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-800'}`}>
                                {myName}
                            </div>
                        </div>
                    )}
                    
                    <div className="w-full md:w-64 border-t md:border-t-0 md:border-r border-blue-200/50 dark:border-slate-700 pt-3 md:pt-0 md:pr-4 flex flex-col justify-center">
                        <label className="block mb-1.5 text-[11px] font-bold opacity-80 flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <FaCalendarAlt /> تاریخ تشکیل پرونده
                        </label>
                        <div className={`p-2 rounded-lg text-center font-bold text-xs border bg-white/50 dark:bg-gray-900/50 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-800'}`}>
                            مورخ {formalDate}
                        </div>
                    </div>
                </div>

                {/* باکس ماهیت و دسترسی */}
                <div className="flex flex-col shadow-sm rounded-xl">
                    <div className={`h-1.5 w-full rounded-t-xl transition-all duration-500 bg-gradient-to-r from-${currentTypeConfig.color}-400 to-${currentTypeConfig.color}-600`} />
                    <div className={`p-4 rounded-b-xl border border-t-0 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                        <h3 className="font-bold text-sm mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 opacity-80">ماهیت و دسترسی</h3>
                        
                        <div className="mb-4">
                            <label className="block mb-2 text-xs font-black opacity-80 text-center md:text-right">نوع مکاتبه (ماهیت)</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => handleTypeChange('INTERNAL')} className={`py-2 rounded-lg font-bold text-xs transition-all duration-300 border-2 flex items-center justify-center gap-1.5 ${formData.letter_type === 'INTERNAL' ? 'bg-purple-100 border-purple-500 text-purple-700 shadow-md dark:bg-purple-900/40 dark:text-purple-300' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}>
                                    <span className="text-base">🏢</span> داخلی
                                </button>
                                <button type="button" onClick={() => handleTypeChange('INCOMING')} className={`py-2 rounded-lg font-bold text-xs transition-all duration-300 border-2 flex items-center justify-center gap-1.5 ${formData.letter_type === 'INCOMING' ? 'bg-green-100 border-green-500 text-green-700 shadow-md dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}>
                                    <span className="text-base">📥</span> وارده
                                </button>
                                <button type="button" onClick={() => handleTypeChange('OUTGOING')} className={`py-2 rounded-lg font-bold text-xs transition-all duration-300 border-2 flex items-center justify-center gap-1.5 ${formData.letter_type === 'OUTGOING' ? 'bg-orange-100 border-orange-500 text-orange-700 shadow-md dark:bg-orange-900/40 dark:text-orange-300' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}>
                                    <span className="text-base">📤</span> صادره
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div>
                                <label className="block mb-1 text-[11px] font-bold opacity-80">فوریت ارجاع</label>
                                <select className={inputClass} value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
                                    <option value="NORMAL">عادی</option>
                                    <option value="URGENT">فوری</option>
                                    <option value="VERY_URGENT">خیلی فوری</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-[11px] font-bold opacity-80">سطح محرمانگی</label>
                                <select className={inputClass} value={formData.confidentiality} onChange={(e) => setFormData({ ...formData, confidentiality: e.target.value })}>
                                    <option value="NORMAL">عادی</option>
                                    <option value="CONFIDENTIAL">محرمانه</option>
                                    <option value="SECRET">سری</option>
                                </select>
                            </div>
                        </div>

                        {isLevelZeroOrAdmin && (
                            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 p-3 rounded-lg border ${formData.letter_type === 'OUTGOING' ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
                                <div className="md:col-span-4 border-b border-black/10 dark:border-white/10 pb-1 mb-1">
                                    <h4 className="text-[11px] font-bold opacity-80">مدیریت بایگانی فیزیکی</h4>
                                </div>
                                <div>
                                    <label className="block mb-1 text-[10px] font-bold opacity-80">شماره چاپی دستی</label>
                                    <input type="text" dir="rtl" placeholder="مثلاً ۱۴۰۵/۱۲۴/م" className={`${inputClass} text-right font-mono text-xs`} value={formData.original_number} onChange={(e) => setFormData({ ...formData, original_number: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <JalaliDatePicker name="original_date" label="تاریخ نامه کاغذی" value={formData.original_date} onChange={(e) => setFormData({ ...formData, original_date: e.target.value })} placeholder="انتخاب تاریخ" />
                                </div>
                                {formData.letter_type === 'OUTGOING' && (
                                    <>
                                        <div>
                                            <label className="block mb-1 text-[10px] font-bold opacity-80 text-indigo-700 dark:text-indigo-400">شماره دریافت در مقصد</label>
                                            <input type="text" dir="rtl" className={`${inputClass} text-right font-mono border-indigo-300 dark:border-indigo-700 text-xs`} value={formData.destination_indicator} onChange={(e) => setFormData({ ...formData, destination_indicator: e.target.value })} />
                                        </div>
                                        <div className="relative">
                                            <JalaliDatePicker name="destination_date" label="تاریخ تحویل به مقصد" value={formData.destination_date} onChange={(e) => setFormData({ ...formData, destination_date: e.target.value })} placeholder="انتخاب تاریخ" />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className={`p-4 rounded-xl border shadow-sm transition-all duration-500 ${
                    formData.letter_type === 'INCOMING' ? (isDark ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50/50 border-green-200') :
                    formData.letter_type === 'OUTGOING' ? (isDark ? 'bg-orange-900/10 border-orange-800/50' : 'bg-orange-50/50 border-orange-200') :
                    (isDark ? 'bg-purple-900/10 border-purple-800/50' : 'bg-purple-50/50 border-purple-200')
                }`}>
                    <h3 className="font-bold text-sm mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 opacity-80">ارتباطات و موضوع</h3>
                    <datalist id="org-list">{organizations?.map(org => (<option key={org.id} value={org.name} />))}</datalist>

                    {/* 🚀 فیلد فرستنده فقط برای نامه‌های غیر داخلی (وارده و صادره) نمایش داده می‌شود */}
                    <div className={`grid grid-cols-1 ${formData.letter_type === 'INTERNAL' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-4 mb-4`}>
                        {formData.letter_type !== 'INTERNAL' && (
                            <div className={`space-y-2 p-3 rounded-lg border ${formData.letter_type === 'INCOMING' ? 'bg-white dark:bg-gray-800 shadow-sm border-green-300' : 'bg-black/5 border-transparent'}`}>
                                <span className={`text-[11px] font-bold opacity-80 block ${formData.letter_type === 'INCOMING' ? 'text-green-600' : 'text-blue-600'}`}>اطلاعات مبدأ (فرستنده)</span>
                                {formData.letter_type === 'INCOMING' ? (
                                    <input type="text" list="org-list" placeholder="نام سازمان..." className={inputClass} value={formData.external_sender} onChange={(e) => setFormData({ ...formData, external_sender: e.target.value })} />
                                ) : (
                                    <SearchablePersonnelSelect personnel={allPersonnel} value={formData.internal_sender} onChange={(val) => setFormData({ ...formData, internal_sender: val })} placeholder="انتخاب پرسنل..." isDark={isDark} />
                                )}
                            </div>
                        )}

                        <div className={`space-y-2 p-3 rounded-lg border ${formData.letter_type === 'OUTGOING' ? 'bg-white dark:bg-gray-800 shadow-sm border-orange-300' : 'bg-black/5 border-transparent'}`}>
                            <span className={`text-[11px] font-bold opacity-80 block ${formData.letter_type === 'OUTGOING' ? 'text-orange-600' : 'text-indigo-600'}`}>اطلاعات مقصد (گیرنده)</span>
                            {formData.letter_type === 'OUTGOING' ? (
                                <input type="text" list="org-list" placeholder="نام سازمان..." className={inputClass} value={formData.external_receiver} onChange={(e) => setFormData({ ...formData, external_receiver: e.target.value })} />
                            ) : (
                                <SearchablePersonnelSelect personnel={allPersonnel} value={formData.internal_receiver} onChange={(val) => setFormData({ ...formData, internal_receiver: val })} placeholder="انتخاب پرسنل..." isDark={isDark} />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">سمت و عناوین گیرنده</label>
                            <textarea rows="1" className={inputClass} value={formData.manual_receiver_name} onChange={(e) => setFormData({ ...formData, manual_receiver_name: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">نام نوشته شده در محل امضا</label>
                            <textarea rows="1" className={inputClass} value={formData.manual_sender_name} onChange={(e) => setFormData({ ...formData, manual_sender_name: e.target.value })}></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block mb-1 text-[10px] font-bold opacity-80"> اشخاص گیرنده اسامی</label>
                            <textarea rows="1" className={inputClass} value={formData.receiver_persons} onChange={(e) => setFormData({ ...formData, receiver_persons: e.target.value })}></textarea>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-3">
                            <label className="block mb-1 text-xs font-bold opacity-80 text-blue-600">موضوع اصلی نامه <span className="text-red-500">*</span></label>
                            <input type="text" className={`${inputClass} font-bold text-sm py-2.5 border-blue-300 dark:border-blue-700`} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">عطف به نامه ...</label>
                            <select className={inputClass} value={formData.reference_letter} onChange={(e) => setFormData({ ...formData, reference_letter: e.target.value })}>
                                <option value="">مستقل (بدون ارتباط)</option>
                                {lettersList?.map(l => (<option key={l.id} value={l.id}>نامه {l.indicator_number}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">عطف به (شماره دستی)</label>
                            <input type="text" dir="rtl" className={`${inputClass} text-right font-mono text-xs`} value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">پیوست (متن روی سربرگ)</label>
                            <input type="text" className={inputClass} value={formData.attachment_note} onChange={(e) => setFormData({ ...formData, attachment_note: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <div className="mb-4">
                        <label className="block mb-1 text-xs font-bold opacity-80">متن یا چکیده نامه</label>
                        <textarea rows="6" className={inputClass} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-lg bg-gray-500/5 border border-gray-500/10">
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">رونوشت کاغذی (تایپ متن زیر نامه)</label>
                            <textarea rows="3" placeholder="مثال: رونوشت به واحد مالی جهت اطلاع" className={inputClass} value={formData.cc_text} onChange={(e) => setFormData({ ...formData, cc_text: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">ارسال رونوشت سیستمی (نگه داشتن Ctrl برای چند انتخاب)</label>
                            <select multiple className={`${inputClass} h-[84px]`} value={formData.internal_cc_receivers} onChange={handleMultiSelectChange}>
                                {allPersonnel?.map(emp => (
                                    <option key={`cc-${emp.id}`} value={emp.id}>
                                        {emp.name} - {emp.position_title || 'بدون سمت'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-5 p-4 rounded-xl bg-blue-50/50 dark:bg-slate-900/50 border border-blue-200 dark:border-slate-700">
                        <label className="block mb-2 text-sm font-bold opacity-80 text-blue-700 dark:text-blue-400">آپلود اسکن نامه و ضمائم</label>
                        <input type="file" multiple onChange={(e) => setAttachments(e.target.files)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer" />
                    </div>        

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold opacity-80">
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={formData.has_physical_copy} onChange={(e) => setFormData({ ...formData, has_physical_copy: e.target.checked })} />
                            نامه دارای نسخه فیزیکی (کاغذی) است
                        </label>
                        {formData.has_physical_copy && (
                            <input type="text" placeholder="محل بایگانی زونکن (مثلا: زونکن قراردادهای الف)" className={inputClass} value={formData.physical_archive_location} onChange={(e) => setFormData({ ...formData, physical_archive_location: e.target.value })} />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-6">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg bg-gray-500 text-white hover:bg-gray-600 font-bold text-sm">انصراف</button>
                    <button type="submit" disabled={creating} className="px-8 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-bold text-sm shadow-lg transition-transform active:scale-95">
                        {creating ? 'در حال ثبت...' : 'ثبت پیش‌نویس نامه'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default SecretariatCreateScreen;