import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchLetterDetail, updateLetter, fetchAllPersonnel, fetchOrganizations, fetchLetters } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaChevronLeft, FaChevronDown, FaExclamationTriangle, FaCalendarAlt, FaUserEdit } from 'react-icons/fa';
import JalaliDatePicker from '../../components/JalaliDatePicker'; 
import logo from '../../assets/ario.png';

const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel?.find(p => String(p.id) === String(value));
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

    const filtered = personnel?.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.position_title && p.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const inputClass = `w-full p-2 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'}`;

    return (
        <div className="relative" ref={wrapperRef}>
            <input type="text" className={inputClass} placeholder={placeholder} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); if (e.target.value === '') onChange(''); }} onFocus={() => setIsOpen(true)} />
            <FaChevronDown className="absolute left-3 top-3 text-gray-400 pointer-events-none text-xs" />
            
            {isOpen && (
                <ul className={`absolute z-10 w-full mt-1 max-h-52 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <li className={`p-2 cursor-pointer text-sm font-bold opacity-70 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`} onClick={() => { onChange(''); setIsOpen(false); }}>-- نامشخص / ثبت دستی در پایین --</li>
                    {filtered.map(emp => (
                        <li key={emp.id} className={`p-2 cursor-pointer text-sm border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`} onClick={() => { onChange(emp.id.toString()); setSearchTerm(`${emp.name} - ${emp.position_title || 'بدون سمت'}`); setIsOpen(false); }}>
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-[10px] opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && (<li className="p-2 text-sm opacity-50 text-center">موردی یافت نشد</li>)}
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

const SecretariatEditScreen = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { userInfo } = useSelector((state) => state.userLogin);
    
    const isLevelZeroOrAdmin = userInfo?.is_admin || (userInfo?.employee?.position?.hierarchy_level === 0);
    const myEmployeeId = userInfo?.employee?.id ? String(userInfo.employee.id) : '';
    
    const { activeLetter, allPersonnel, organizations, letters: lettersData } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : (lettersData?.results || []);

    const [updating, setUpdating] = useState(false);
    
    const [formData, setFormData] = useState({
        subject: '', letter_type: 'INTERNAL', status: 'PENDING', original_number: '', original_date: '',
        destination_indicator: '', destination_date: '', delivery_responsible: '', internal_sender: '',
        external_sender: '', internal_receiver: '', external_receiver: '', receiver_persons: '', 
        manual_sender_name: '', manual_receiver_name: '', urgency: 'NORMAL', confidentiality: 'NORMAL',
        has_physical_copy: true, physical_archive_location: '', attachment_note: '', contract_number: '',
        reference_number: '', reference_letter: '', cc_text: '', internal_cc_receivers: [], body: '',
    });

    useEffect(() => {
        dispatch(fetchAllPersonnel());
        dispatch(fetchOrganizations()); 
        dispatch(fetchLetterDetail(id));
        if (!lettersList || lettersList.length === 0) dispatch(fetchLetters({}));
    }, [dispatch, id]);

    useEffect(() => {
        if (activeLetter && String(activeLetter.id) === String(id)) {
            setFormData({
                subject: activeLetter.subject || '',
                letter_type: activeLetter.letter_type || 'INTERNAL',
                status: activeLetter.status || 'PENDING',
                original_number: activeLetter.original_number || '',
                original_date: activeLetter.original_date || '',
                destination_indicator: activeLetter.destination_indicator || '',
                destination_date: activeLetter.destination_date || '',
                delivery_responsible: activeLetter.delivery_responsible ? String(activeLetter.delivery_responsible) : '',
                
                internal_sender: activeLetter.internal_sender ? String(activeLetter.internal_sender) : (activeLetter.letter_type === 'INTERNAL' ? myEmployeeId : ''),
                external_sender: activeLetter.external_sender_detail?.name || '',
                internal_receiver: activeLetter.internal_receiver ? String(activeLetter.internal_receiver) : '',
                external_receiver: activeLetter.external_receiver_detail?.name || '',
                
                receiver_persons: activeLetter.receiver_persons || '', 
                manual_sender_name: activeLetter.manual_sender_name || '', 
                manual_receiver_name: activeLetter.manual_receiver_name || '', 
                urgency: activeLetter.urgency || 'NORMAL',
                confidentiality: activeLetter.confidentiality || 'NORMAL',
                has_physical_copy: activeLetter.has_physical_copy ?? true,
                physical_archive_location: activeLetter.physical_archive_location || '',
                attachment_note: activeLetter.attachment_note || '',
                contract_number: activeLetter.contract_number || '',
                reference_number: activeLetter.reference_number || '',
                reference_letter: activeLetter.reference_letter_detail?.id ? String(activeLetter.reference_letter_detail.id) : '',
                cc_text: activeLetter.cc_text || '',
                internal_cc_receivers: activeLetter.internal_cc_receivers ? activeLetter.internal_cc_receivers.map(String) : [], 
                body: activeLetter.body || '',
            });
        }
    }, [activeLetter, id, myEmployeeId]);

    const handleTypeChange = (newType) => {
        setFormData(prev => ({ 
            ...prev, 
            letter_type: newType,
            internal_sender: newType === 'INTERNAL' ? prev.internal_sender : '', 
            external_sender: '', 
            internal_receiver: '', 
            external_receiver: '',
            destination_indicator: newType !== 'OUTGOING' ? '' : prev.destination_indicator,
            destination_date: newType !== 'OUTGOING' ? '' : prev.destination_date,
            delivery_responsible: newType !== 'OUTGOING' ? '' : prev.delivery_responsible
        }));
    };

    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        if (newStatus === 'APPROVED' || newStatus === 'ISSUED' || newStatus === 'PENDING') {
            setFormData({
                ...formData,
                status: newStatus,
                destination_indicator: '',
                destination_date: ''
            });
            toast('بازگشت به وضعیت قبلی: فیلدهای ثبت مقصد پاک شدند.', { icon: '🔄' });
        } else {
            setFormData({ ...formData, status: newStatus });
        }
    };

    const handleMultiSelectChange = (e) => {
        const values = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({ ...formData, internal_cc_receivers: values });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.subject) return toast.error('موضوع الزامی است');
        
        if (formData.status === 'ISSUED' && formData.letter_type === 'OUTGOING' && !formData.delivery_responsible) {
            return toast.error('لطفاً مسئول خروج (پیک) را مشخص کنید.');
        }

        const fd = new FormData();
        Object.keys(formData).forEach(key => {
            if (Array.isArray(formData[key])) {
                formData[key].forEach(val => fd.append(key, val));
            } else if (formData[key] !== null && formData[key] !== undefined) {
                fd.append(key, formData[key]);
            }
        });

        setUpdating(true);
        dispatch(updateLetter({ id, payload: fd })).unwrap()
            .then(() => {
                toast.success('تغییرات نامه ذخیره شد');
                navigate(`/secretariat/${id}`);
            })
            .catch(err => toast.error(err || 'خطا در ویرایش'))
            .finally(() => setUpdating(false));
    };

    const inputClass = `w-full p-2 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'}`;

    if (!activeLetter || String(activeLetter.id) !== String(id)) {
        return <div className="text-center py-20 font-bold opacity-60">در حال خواندن اطلاعات پرونده...</div>;
    }

    if (!isLevelZeroOrAdmin && activeLetter.status !== 'PENDING') {
        return (
            <div className="max-w-2xl mx-auto p-8 mt-16 rounded-3xl border shadow-xl text-center transition-all border-red-200 bg-red-50 dark:bg-slate-800 dark:border-red-900/50">
                <FaExclamationTriangle className="mx-auto text-6xl text-red-500 mb-6 drop-shadow-md" />
                <h2 className="text-2xl font-black mb-3 text-red-700 dark:text-red-400">عدم دسترسی به ویرایش</h2>
                <p className="text-sm font-bold opacity-80 mb-8 text-red-600 dark:text-red-300 leading-loose">
                    این مکاتبه از مرحله ثبت اولیه عبور کرده و تایید یا صادر شده است.<br/>
                    شما به عنوان نگارنده، دیگر مجاز به تغییر اطلاعات آن نیستید.<br/>
                    <span className="text-xs opacity-75">(در صورت نیاز به تغییرات، لطفاً به مدیریت اطلاع دهید)</span>
                </p>
                <button onClick={() => navigate(-1)} className="px-8 py-3 rounded-xl bg-gray-600 text-white font-black text-sm transition-transform active:scale-95 hover:bg-gray-700 shadow-lg">
                    بازگشت به پرونده
                </button>
            </div>
        );
    }

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
                <Link to={`/secretariat/${id}`} className="text-blue-500 hover:text-blue-700 transition">نامه {activeLetter.indicator_number}</Link>
                <FaChevronLeft className="text-[9px]" />
                <span>ویرایش اطلاعات</span>
            </div>

            <div className="flex flex-col items-center justify-center relative mb-5 mt-1">
                <DirectionalLogo type={formData.letter_type} colorName={currentTypeConfig.color} />
                <h2 className={`text-xl mt-3 font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    ویرایش مکاتبه (اندیکاتور: {activeLetter.indicator_number})
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* اطلاعات ثابت (تاریخ، فرستنده داخلی قفل شده) */}
                <div className={`p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row gap-6 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/50 border-blue-200/50'}`}>
                    {formData.letter_type === 'INTERNAL' && (
                        <div className="flex-1 flex flex-col justify-center">
                            <label className="block mb-1.5 text-[11px] font-bold opacity-80 flex items-center gap-1 text-purple-600 dark:text-purple-400">
                                <FaUserEdit /> فرستنده ثبت شده
                            </label>
                            <div className={`p-2 rounded-lg text-center font-bold text-xs border bg-white/50 dark:bg-gray-900/50 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-800'}`}>
                                {activeLetter?.internal_sender_name || 'نامشخص'}
                            </div>
                        </div>
                    )}
                    
                    <div className={`flex-1 ${formData.letter_type === 'INTERNAL' ? 'border-t md:border-t-0 md:border-r border-blue-200/50 dark:border-slate-700 pt-3 md:pt-0 md:pr-4' : ''} flex flex-col justify-center`}>
                        <label className="block mb-1.5 text-[11px] font-bold opacity-80 flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <FaCalendarAlt /> تاریخ ثبت اولیه
                        </label>
                        <div className={`p-2 rounded-lg text-center font-bold text-xs border bg-white/50 dark:bg-gray-900/50 ${isDark ? 'border-gray-700 text-gray-300' : 'border-gray-200 text-gray-800'}`}>
                            {new Date(activeLetter?.created_at || Date.now()).toLocaleDateString('fa-IR')}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col shadow-sm rounded-xl">
                    <div className={`h-1.5 w-full rounded-t-xl transition-all duration-500 bg-gradient-to-r from-${currentTypeConfig.color}-400 to-${currentTypeConfig.color}-600`} />
                    <div className={`p-4 rounded-b-xl border border-t-0 ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                        <h3 className="font-bold text-sm mb-3 border-b border-gray-200 dark:border-gray-700 pb-2 opacity-80">ماهیت و وضعیت</h3>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                            <div>
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

                            {isLevelZeroOrAdmin && (
                                <div className="flex flex-col gap-2">
                                    <label className="block text-xs font-black opacity-80 text-rose-600 flex justify-between">
                                        وضعیت نامه (دسترسی مدیریت)
                                        {(formData.status === 'PENDING' || formData.status === 'APPROVED' || formData.status === 'ISSUED') && activeLetter.status === 'REGISTERED' && (
                                            <span className="text-orange-500 flex items-center gap-1 text-[9px]"><FaExclamationTriangle/> بازگشت وضعیت</span>
                                        )}
                                    </label>
                                    <select className={`${inputClass} font-bold py-2.5 bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800/50`} value={formData.status} onChange={handleStatusChange}>
                                        <option value="PENDING">در انتظار تایید</option>
                                        <option value="APPROVED">تایید شده (آماده صدور)</option>
                                        <option value="ISSUED">صادر شده (در دست پیک)</option>
                                        <option value="REGISTERED">تکمیل شده (ثبت در مقصد)</option>
                                        <option value="REJECTED">رد شده</option>
                                    </select>
                                    
                                    {formData.letter_type === 'OUTGOING' && (formData.status === 'ISSUED' || formData.status === 'REGISTERED') && (
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">پیک:</span>
                                            <SearchablePersonnelSelect personnel={allPersonnel} value={formData.delivery_responsible} onChange={(val) => setFormData({ ...formData, delivery_responsible: val })} placeholder="انتخاب پرسنل..." isDark={isDark} />
                                        </div>
                                    )}
                                </div>
                            )}
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
                            <label className="block mb-1 text-[10px] font-bold opacity-80">عنوان و سمت گیرنده ( دپارتمان یا سازمان )</label>
                            <textarea rows="1" className={inputClass} value={formData.manual_receiver_name} onChange={(e) => setFormData({ ...formData, manual_receiver_name: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80"> اسم ذکر شده در محل امضا</label>
                            <textarea rows="1" className={inputClass} value={formData.manual_sender_name} onChange={(e) => setFormData({ ...formData, manual_sender_name: e.target.value })}></textarea>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block mb-1 text-[10px] font-bold opacity-80">اسامی اشخاص گیرنده </label>
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
                                {lettersList?.filter(l => l.id !== parseInt(id)).map(l => (<option key={l.id} value={l.id}>نامه {l.indicator_number}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">عطف به (شماره دستی)</label>
                            <input type="text" dir="rtl" className={`${inputClass} text-right font-mono text-xs`} value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">پیوست (متن)</label>
                            <input type="text" className={inputClass} value={formData.attachment_note} onChange={(e) => setFormData({ ...formData, attachment_note: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <div className="mb-4">
                        <label className="block mb-1 text-xs font-bold opacity-80">متن یا چکیده نامه</label>
                        <textarea rows="6" className={`${inputClass} leading-loose`} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-3 rounded-lg bg-gray-500/5 border border-gray-500/10">
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">رونوشت کاغذی (تایپ متن زیر نامه)</label>
                            <textarea rows="2" className={inputClass} value={formData.cc_text} onChange={(e) => setFormData({ ...formData, cc_text: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-[10px] font-bold opacity-80">ارسال رونوشت سیستمی</label>
                            <select multiple className={`${inputClass} h-[58px]`} value={formData.internal_cc_receivers} onChange={handleMultiSelectChange}>
                                {allPersonnel?.map(emp => (<option key={emp.id} value={emp.id} className="text-xs py-0.5">{emp.name}</option>))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer text-[11px] font-bold opacity-80">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded text-blue-600" checked={formData.has_physical_copy} onChange={(e) => setFormData({ ...formData, has_physical_copy: e.target.checked })} />
                            نامه دارای نسخه فیزیکی است
                        </label>
                        {formData.has_physical_copy && (
                            <input type="text" placeholder="محل بایگانی زونکن..." className={`${inputClass} py-1.5`} value={formData.physical_archive_location} onChange={(e) => setFormData({ ...formData, physical_archive_location: e.target.value })} />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-4">
                    <button type="button" onClick={() => navigate(-1)} className="px-5 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 font-bold text-xs">انصراف</button>
                    <button type="submit" disabled={updating} className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-bold text-xs shadow-md transition-transform active:scale-95">
                        {updating ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default SecretariatEditScreen;