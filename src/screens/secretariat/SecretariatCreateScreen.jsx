import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createLetter, clearCreateSuccess, fetchAllPersonnel, fetchOrganizations, fetchLetters } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { 
    FaTrashAlt, FaChevronDown, FaChevronLeft, 
    FaTimes, FaPaperclip, FaCheck, FaBuilding,
    FaMapMarkerAlt, FaPhoneAlt, FaMobileAlt, FaGlobe, FaEnvelope,
    FaArrowRight
} from 'react-icons/fa';
import JalaliDatePicker from '../../components/JalaliDatePicker'; 
import VoiceInputButton from '../../components/common/VoiceInputButton';
import logo from '../../assets/ario.png';
import QRCode from 'react-qr-code';

const DRAFT_KEY = 'secretariat_create_draft';

// تبدیل اعداد انگلیسی به فارسی
const toPersianDigits = (str) => {
    if (!str) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[0-9]/g, x => persianDigits[x]);
};

// نمایش استاندارد شماره‌های ترکیبی
const renderFormattedNumber = (numStr) => {
    if (!numStr) return null;
    const str = String(numStr);
    if (str.includes('/')) {
        const parts = str.split('/');
        return (
            <span className="inline-flex items-center gap-[3px] font-mono text-[11px] sm:text-[13px] font-black" dir="ltr">
                <span>{parts[0]}</span>
                <span className="text-gray-400 opacity-60">/</span>
                <span>{parts[1]}</span>
                {parts[2] !== undefined && (
                    <>
                        <span className="text-gray-400 opacity-60">/</span>
                        <span>{parts[2]}</span>
                    </>
                )}
            </span>
        );
    }
    return <span dir="ltr">{numStr}</span>;
};

// کامپوننت انتخاب سازمان سازگار با iOS و لمسی
const SearchableOrgSelect = ({ organizations, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setSearchTerm(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const filtered = organizations?.filter(org => 
        org.name?.toLowerCase().includes((searchTerm || '').toLowerCase())
    ) || [];

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <input
                type="text"
                className="w-full bg-white/95 dark:bg-gray-800 p-2 text-xs sm:text-sm rounded-lg border border-indigo-200 dark:border-indigo-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400 font-bold transition"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    onChange(e.target.value);
                    setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
            />
            <FaChevronDown className="absolute left-3 top-3 text-gray-400 pointer-events-none text-xs" />
            
            {isOpen && (
                <ul className={`absolute z-40 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-xl ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    {filtered.map(org => (
                        <li 
                            key={org.id}
                            className={`p-2.5 cursor-pointer text-xs sm:text-sm border-b transition ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-indigo-50'}`}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                onChange(org.name);
                                setSearchTerm(org.name);
                                setIsOpen(false);
                            }}
                            onClick={() => {
                                onChange(org.name);
                                setSearchTerm(org.name);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-bold">{org.name}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="p-2.5 text-xs opacity-60 text-center">
                            {searchTerm ? `سازمان جدید: "${searchTerm}"` : 'موردی یافت نشد'}
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel?.find(p => String(p.id) === String(value));
            if (selected) {
                setSearchTerm(`${selected.name} (${selected.position_title || 'بدون سمت'})`);
            }
        } else {
            setSearchTerm('');
        }
    }, [value, personnel]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const filtered = personnel?.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.position_title && p.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const inputClass = `w-full p-2 text-xs sm:text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'}`;

    return (
        <div className="relative w-full" ref={wrapperRef}>
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
            <FaChevronDown className="absolute left-2.5 top-3 text-gray-400 pointer-events-none text-xs" />
            
            {isOpen && (
                <ul className={`absolute z-40 w-full mt-1 max-h-48 sm:max-h-52 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <li 
                        className={`p-2 cursor-pointer text-xs sm:text-sm font-bold opacity-70 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        onClick={() => { onChange(''); setIsOpen(false); }}
                    >
                        -- نامشخص / انتخاب نشده --
                    </li>
                    {filtered.map(emp => (
                        <li 
                            key={emp.id}
                            className={`p-2 cursor-pointer text-xs sm:text-sm border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
                            onClick={() => {
                                onChange(emp.id.toString());
                                setSearchTerm(`${emp.name} (${emp.position_title || 'بدون سمت'})`);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-[10px] opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="p-2 text-xs sm:text-sm opacity-50 text-center">موردی یافت نشد</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const MultiSelectSearchable = ({ personnel, selectedValues, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    const filtered = personnel?.filter(p => 
        !selectedValues.includes(String(p.id)) &&
        (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         (p.position_title && p.position_title.toLowerCase().includes(searchTerm.toLowerCase())))
    ) || [];

    const handleSelect = (empId) => {
        onChange([...selectedValues, String(empId)]);
        setSearchTerm('');
    };

    const handleRemove = (empId, e) => {
        e.stopPropagation();
        onChange(selectedValues.filter(id => id !== String(empId)));
    };

    const inputClass = `w-full min-h-[36px] p-1.5 flex flex-wrap gap-1.5 items-center rounded-lg border focus-within:ring-2 transition cursor-text ${isDark ? 'bg-gray-800 border-gray-700 focus-within:ring-blue-500' : 'bg-white border-gray-300 focus-within:ring-blue-400'}`;

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className={inputClass} onClick={() => setIsOpen(true)}>
                {selectedValues.map(val => {
                    const emp = personnel?.find(p => String(p.id) === String(val));
                    if (!emp) return null;
                    return (
                        <span key={val} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[11px] font-bold border border-blue-200 dark:border-blue-800">
                            {emp.name}
                            <FaTimes className="cursor-pointer opacity-70 hover:opacity-100 text-[10px]" onClick={(e) => handleRemove(val, e)} />
                        </span>
                    );
                })}
                
                <input 
                    type="text" 
                    className={`flex-1 min-w-[100px] outline-none bg-transparent text-xs p-0.5 ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} 
                    placeholder={selectedValues.length === 0 ? placeholder : 'جستجوی بیشتر...'} 
                    value={searchTerm} 
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }} 
                    onFocus={() => setIsOpen(true)} 
                />
                <FaChevronDown className="absolute left-2.5 top-2.5 text-gray-400 pointer-events-none text-xs" />
            </div>
            
            {isOpen && (
                <ul className={`absolute z-30 w-full mt-1 max-h-44 sm:max-h-48 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    {filtered.map(emp => (
                        <li key={emp.id} className={`p-2 cursor-pointer text-xs border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`} onClick={() => handleSelect(emp.id)}>
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-[10px] opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && (<li className="p-3 text-xs opacity-50 text-center font-bold">موردی یافت نشد یا انتخاب شده است</li>)}
                </ul>
            )}
        </div>
    );
};

const DirectionalLogo = ({ type, colorName }) => {
    const isOutward = type === 'OUTGOING';
    const isInternal = type === 'INTERNAL';
    const isDocument = type === 'DOCUMENT';

    const colorMaps = {
        green: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-600 dark:text-green-400' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400' },
        slate: { bg: 'bg-slate-100 dark:bg-slate-900/40', border: 'border-slate-500', text: 'text-slate-600 dark:text-slate-400' },
    };
    const theme = colorMaps[colorName] || colorMaps.purple;

    return (
        <div className={`relative w-10 h-10 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-xl shadow-sm border-2 transition-all duration-500 ${theme.bg} ${theme.border}`}>
            <img src={logo} alt="لوگو" className="w-6 h-6 sm:w-7 sm:h-7 object-contain z-10 relative" />
            <div className={`absolute inset-0 z-20 transition-transform duration-700 ease-in-out ${isInternal ? 'rotate-45' : isOutward ? 'rotate-90' : isDocument ? 'rotate-180' : 'rotate-0'}`}>
                {[0, 90, 180, 270].map((rotation, i) => (
                    <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" className={`transition-all duration-500 drop-shadow-sm ${theme.text} -mt-1.5 ${!isInternal && !isOutward && !isDocument ? 'rotate-180' : 'rotate-0'}`}>
                            {isInternal || isDocument ? (
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

    // مرحله ۱: انتخاب نوع مکاتبه | مرحله ۲: نگارش روی برگه نامه
    const [step, setStep] = useState(replyData ? 2 : 1);

    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { userInfo } = useSelector((state) => state.userLogin);
    
    // دسترسی انحصاری برای فیلدهای ثبت فیزیکی: صرفاً مسئول دبیرخانه / بایگانی
    const isArchiveOfficer = Boolean(userInfo?.employee?.position?.can_archive_letters);

    const myEmployeeId = userInfo?.employee?.id ? String(userInfo.employee.id) : '';
    const myName = userInfo?.employee?.name || (userInfo?.first_name ? `${userInfo.first_name} ${userInfo.last_name}` : userInfo?.username || 'شما');

    const { creating, error, allPersonnel, organizations, letters: lettersData } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : (lettersData?.results || []);

    const bossEmployee = allPersonnel?.find(emp => emp.code_meli === '54123');

    const [attachments, setAttachments] = useState(null);
    const [formData, setFormData] = useState({
        subject: '', letter_type: 'INTERNAL', indicator_number: '', original_number: '', original_date: '',
        destination_indicator: '', destination_date: '', internal_sender: '', external_sender: '', internal_receiver: '',
        external_receiver: '', receiver_persons: '', manual_sender_name: '', manual_receiver_name: '', 
        urgency: 'NORMAL', confidentiality: 'NORMAL', has_physical_copy: true, physical_archive_location: '',
        attachment_note: '', contract_number: '', reference_number: '', reference_letter: '', cc_text: '', internal_cc_receivers: [], body: ''
    });

    const generateIndicator = (type) => {
        const prefix = type === 'INTERNAL' ? 'INT' : type === 'INCOMING' ? 'INC' : type === 'DOCUMENT' ? 'DOC' : 'OUT';
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const datePart = new Date().toLocaleDateString('fa-IR').replace(/\//g, '');
        return `${prefix}-${toPersianDigits(datePart)}-${toPersianDigits(randomCode)}`;
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
            setStep(2);
            toast('فرم در حالت پاسخ به نامه تنظیم شد', { icon: '📝' });
        } else {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    if (parsedDraft.letter_type === 'INTERNAL' || parsedDraft.letter_type === 'DOCUMENT') {
                        parsedDraft.internal_sender = myEmployeeId;
                    }
                    setFormData({ ...parsedDraft, indicator_number: generateIndicator(parsedDraft.letter_type || 'INTERNAL') });
                    // اگر پیش‌نویس دارای موضوع یا بدنه بود، مستقیم به مرحله ۲ برود
                    if (parsedDraft.subject || parsedDraft.body) {
                        setStep(2);
                        toast('فرم ناتمام قبلی بازیابی شد', { icon: '♻', duration: 2500 });
                    }
                } catch (err) { 
                    setFormData(prev => ({ ...prev, indicator_number: generateIndicator('INTERNAL'), internal_sender: myEmployeeId })); 
                }
            } else { 
                setFormData(prev => ({ ...prev, indicator_number: generateIndicator('INTERNAL'), internal_sender: myEmployeeId })); 
            }
        }
    }, [dispatch, replyData, myEmployeeId]);

    useEffect(() => {
        if (formData.letter_type === 'OUTGOING' && bossEmployee && formData.internal_sender !== String(bossEmployee.id)) {
            setFormData(prev => ({ ...prev, internal_sender: String(bossEmployee.id) }));
        }
    }, [bossEmployee, formData.letter_type, formData.internal_sender]);

    useEffect(() => {
        if (formData.indicator_number && !replyData && step === 2) {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        }
    }, [formData, replyData, step]);

    const handleClearDraft = () => {
        if (window.confirm('آیا از پاک کردن کامل فرم مطمئن هستید؟ تمام اطلاعات تایپ شده حذف خواهند شد.')) {
            localStorage.removeItem(DRAFT_KEY);
            setStep(1);
            setFormData({
                subject: '', letter_type: 'INTERNAL', indicator_number: generateIndicator('INTERNAL'), original_number: '', original_date: '',
                destination_indicator: '', destination_date: '', internal_sender: myEmployeeId, external_sender: '', internal_receiver: '',
                external_receiver: '', receiver_persons: '', manual_sender_name: '', manual_receiver_name: '', 
                urgency: 'NORMAL', confidentiality: 'NORMAL', has_physical_copy: true, physical_archive_location: '',
                attachment_note: '', contract_number: '', reference_number: '', reference_letter: '', cc_text: '', internal_cc_receivers: [], body: ''
            });
            navigate('/secretariat/create', { replace: true, state: {} }); 
        }
    };

    const handleTypeChange = (newType) => {
        let newInternalSender = '';
        if (newType === 'INTERNAL' || newType === 'DOCUMENT') newInternalSender = myEmployeeId;
        else if (newType === 'OUTGOING') newInternalSender = bossEmployee ? String(bossEmployee.id) : '';

        setFormData(prev => ({ 
            ...prev, 
            letter_type: newType, 
            indicator_number: generateIndicator(newType),
            internal_sender: newInternalSender, 
            external_sender: '', 
            internal_receiver: '', 
            external_receiver: '',
            destination_indicator: newType !== 'OUTGOING' ? '' : prev.destination_indicator,
            destination_date: newType !== 'OUTGOING' ? '' : prev.destination_date
        }));
    };

    const handleInitialTypeSelect = (selectedType) => {
        handleTypeChange(selectedType);
        setStep(2);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.subject) return toast.error('موضوع نامه الزامی است');

        const activeIndicator = formData.indicator_number || generateIndicator(formData.letter_type);

        const fd = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'indicator_number') {
                fd.append('indicator_number', activeIndicator);
            } else if (Array.isArray(formData[key])) {
                formData[key].forEach(val => fd.append(key, val));
            } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
                fd.append(key, formData[key]);
            }
        });

        if (attachments && attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) fd.append('attachments', attachments[i]);
        }

        dispatch(createLetter(fd)).unwrap()
            .then((createdLetter) => {
                localStorage.removeItem(DRAFT_KEY);
                const finalIndicator = createdLetter?.indicator_number || activeIndicator;
                toast.success(
                    `نامه شما با شماره پیگیری ؛ ${renderFormattedNumber(finalIndicator) ? finalIndicator : toPersianDigits(finalIndicator)} ؛ قابل دسترس است`,
                    { duration: 6000, icon: '📮' }
                );
                dispatch(clearCreateSuccess());
                navigate('/secretariat');
            })
            .catch((err) => {
                if (typeof err === 'string' && err.includes('اندیکاتور')) {
                    setFormData(prev => ({ ...prev, indicator_number: generateIndicator(prev.letter_type) }));
                }
                toast.error(err || 'خطا در ثبت مکاتبه');
            });
    };

    const typeConfigs = {
        'INCOMING': { color: 'green', text: 'وارده' },
        'OUTGOING': { color: 'orange', text: 'صادره' },
        'INTERNAL': { color: 'purple', text: 'داخلی' },
        'DOCUMENT': { color: 'slate', text: 'سند / مدرک' }
    };
    const currentTypeConfig = typeConfigs[formData.letter_type] || typeConfigs['INTERNAL'];

    const incomingOrg = organizations?.find(o => o.name?.trim().toLowerCase() === formData.external_sender?.trim().toLowerCase());

    return (
        <div className="w-full max-w-[210mm] mx-auto p-2 sm:p-4 space-y-3">

            {/* نوار راهبری بالا */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold opacity-80 pb-0.5">
                <div className="flex items-center gap-1.5">
                    <Link to="/secretariat" className="text-blue-500 hover:text-blue-700 transition">دبیرخانه</Link>
                    <FaChevronLeft className="text-[9px]" />
                    {step === 1 ? (
                        <span>انتخاب نوع مکاتبه (مرحله ۱ از ۲)</span>
                    ) : (
                        <span>نگارش مکاتبه (مرحله ۲ از ۲)</span>
                    )}
                </div>
                {step === 2 && (
                    <button 
                        type="button" 
                        onClick={handleClearDraft}
                        className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold transition-colors"
                    >
                        <FaTrashAlt size={10} /> <span>پاک کردن فرم</span>
                    </button>
                )}
            </div>

            {error && <div className="bg-red-100 text-red-700 p-2 rounded-lg text-xs font-bold text-center">{error}</div>}

            {/* 🌟 مرحله ۱: انتخاب اولیه نوع مکاتبه 🌟 */}
            {step === 1 ? (
                <div className={`p-4 sm:p-8 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} space-y-6 text-center animate-fadeIn`}>
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <img src={logo} alt="لوگو" className="h-14 sm:h-16 object-contain" />
                        <h2 className={`text-base sm:text-xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            ثبت مکاتبه جدید در دبیرخانه
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 max-w-md">
                            لطفاً جهت آغاز فرآیند نگارش، ابتدا نوع مکاتبه مورد نظر خود را انتخاب نمایید:
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto pt-2">
                        
                        {/* گزینه ۱: داخلی */}
                        <button
                            type="button"
                            onClick={() => handleInitialTypeSelect('INTERNAL')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50/50 dark:border-purple-900/50 dark:hover:bg-purple-950/30 transition-all text-right group shadow-sm hover:shadow"
                        >
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                                🏢
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-sm text-purple-950 dark:text-purple-300">مکاتبه داخلی</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">نامه‌نگاری رسمی میان پرسنل و واحدهای شرکت</p>
                            </div>
                            <FaArrowRight className="text-purple-400 group-hover:translate-x-[-4px] transition-transform text-xs shrink-0" />
                        </button>

                        {/* گزینه ۲: وارده */}
                        <button
                            type="button"
                            onClick={() => handleInitialTypeSelect('INCOMING')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 hover:border-green-500 hover:bg-green-50/50 dark:border-green-900/50 dark:hover:bg-green-950/30 transition-all text-right group shadow-sm hover:shadow"
                        >
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                                📥
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-sm text-green-950 dark:text-green-300">نامه وارده</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">دریافتی از سازمان‌ها، شرکت‌ها یا اشخاص بیرونی</p>
                            </div>
                            <FaArrowRight className="text-green-400 group-hover:translate-x-[-4px] transition-transform text-xs shrink-0" />
                        </button>

                        {/* گزینه ۳: صادره */}
                        <button
                            type="button"
                            onClick={() => handleInitialTypeSelect('OUTGOING')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50/50 dark:border-orange-900/50 dark:hover:bg-orange-950/30 transition-all text-right group shadow-sm hover:shadow"
                        >
                            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                                📤
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-sm text-orange-950 dark:text-orange-300">نامه صادره</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">نامه‌های خروجی رسمی شرکت به ارگان‌ها و سازمان‌ها</p>
                            </div>
                            <FaArrowRight className="text-orange-400 group-hover:translate-x-[-4px] transition-transform text-xs shrink-0" />
                        </button>

                        {/* گزینه ۴: اسناد */}
                        <button
                            type="button"
                            onClick={() => handleInitialTypeSelect('DOCUMENT')}
                            className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-300 hover:border-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 transition-all text-right group shadow-sm hover:shadow"
                        >
                            <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                                📁
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-sm text-slate-900 dark:text-slate-200">اسناد و مدارک</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5 truncate">ثبت و بایگانی قراردادها، نقشه‌ها و پرونده‌ها</p>
                            </div>
                            <FaArrowRight className="text-slate-400 group-hover:translate-x-[-4px] transition-transform text-xs shrink-0" />
                        </button>
                    </div>
                </div>
            ) : (
                /* 🌟 مرحله ۲: فرم نگارش نامه روی برگه استاندارد 🌟 */
                <form onSubmit={handleSubmit} className="space-y-3 animate-fadeIn">
                    
                    {/* نوار بالایی فشرده: عنوان فرم با دراپ‌داون ویرایش آنی ماهیت + دراپ‌داون‌های هم‌اندازه فوریت و محرمانگی */}
                    <div className={`p-2.5 sm:p-3 rounded-xl border flex flex-col md:flex-row flex-wrap items-center justify-between gap-3 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        
                        {/* عنوان با امکان تغییر دراپ‌داون ماهیت نامه */}
                        <div className="flex items-center gap-2.5 w-full md:w-auto justify-center md:justify-start">
                            <DirectionalLogo type={formData.letter_type} colorName={currentTypeConfig.color} />
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h2 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                    {replyData ? 'ثبت پاسخ نامه' : 'ثبت مکاتبه'}
                                </h2>
                                
                                {/* دراپ‌داون ویرایش آنی نوع نامه در عنوان */}
                                <div className="relative inline-block">
                                    <select
                                        value={formData.letter_type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                        className={`text-xs sm:text-sm font-black rounded-lg border px-2.5 py-1 outline-none cursor-pointer transition shadow-sm ${
                                            formData.letter_type === 'INTERNAL' ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800' :
                                            formData.letter_type === 'INCOMING' ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800' :
                                            formData.letter_type === 'OUTGOING' ? 'bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' :
                                            'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700'
                                        }`}
                                        title="برای ویرایش نوع نامه کلیک کنید"
                                    >
                                        <option value="INTERNAL">🏢 داخلی</option>
                                        <option value="INCOMING">📥 وارده</option>
                                        <option value="OUTGOING">📤 صادره</option>
                                        <option value="DOCUMENT">📁 اسناد</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* دراپ‌داون‌های فوریت و محرمانگی */}
                        <div className="flex items-center justify-center md:justify-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0 border-gray-100 dark:border-gray-700">
                            
                            <div className="flex-1 sm:flex-initial sm:w-36 min-w-0 flex items-center justify-between gap-1 bg-gray-50 dark:bg-gray-800/80 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 shrink-0">فوریت:</span>
                                <select 
                                    className="w-full min-w-0 bg-transparent text-xs font-bold outline-none text-gray-800 dark:text-white cursor-pointer text-center" 
                                    value={formData.urgency} 
                                    onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                                >
                                    <option value="NORMAL">عادی</option>
                                    <option value="URGENT">فوری</option>
                                    <option value="VERY_URGENT">خیلی فوری</option>
                                </select>
                            </div>

                            <div className="flex-1 sm:flex-initial sm:w-36 min-w-0 flex items-center justify-between gap-1 bg-gray-50 dark:bg-gray-800/80 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 shrink-0">محرمانگی:</span>
                                <select 
                                    className="w-full min-w-0 bg-transparent text-xs font-bold outline-none text-gray-800 dark:text-white cursor-pointer text-center" 
                                    value={formData.confidentiality} 
                                    onChange={(e) => setFormData({ ...formData, confidentiality: e.target.value })}
                                >
                                    <option value="NORMAL">عادی</option>
                                    <option value="CONFIDENTIAL">محرمانه</option>
                                    <option value="SECRET">سری</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 🌟 برگه رسمی استاندارد A4 🌟 */}
                    <div className="w-full flex justify-center py-0.5">
                        <div 
                            id="letter-a4-sheet"
                            className="w-full bg-white text-gray-900 flex flex-col justify-between shadow-2xl border border-gray-300 rounded-xl sm:rounded-sm p-3.5 sm:p-5 md:p-[14mm] min-h-[auto] md:min-h-[297mm] box-border transition-all"
                            style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}
                        >
                            <div className="flex-1 flex flex-col">
                                
                                {/* ۱. هدر رسمی نامه */}
                                <div className="flex justify-between items-start pb-2 relative shrink-0 gap-1.5 sm:gap-3">
                                    
                                    {/* ستون راست هدر: لوگوی رسمی یا اطلاعات فرستنده خارجی برای نامه وارده */}
                                    <div className="flex flex-col items-center justify-start w-1/3 text-center">
                                        {formData.letter_type === 'INCOMING' ? (
                                            <>
                                                <div className="mb-1 flex items-center justify-center h-10 sm:h-12 md:h-16 w-10 sm:w-12 md:w-16 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                                    {incomingOrg?.logo ? (
                                                        <img src={incomingOrg.logo} alt={incomingOrg.name} className="h-full w-full object-contain p-1" />
                                                    ) : (
                                                        <FaBuilding className="text-xl sm:text-2xl md:text-3xl text-gray-500 dark:text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="font-bold text-[10px] sm:text-xs md:text-sm text-center leading-tight">
                                                    <span>{formData.external_sender || 'سازمان خارجی (فرستنده)'}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="mb-1 flex justify-center">
                                                    <img src={logo} alt="لوگو" className="h-10 sm:h-12 md:h-16 object-contain" />
                                                </div>
                                                <div className="font-bold text-[10px] sm:text-xs md:text-sm text-center leading-tight">
                                                    <span>
                                                        {formData.letter_type === 'OUTGOING' 
                                                            ? 'شرکت آریو بنیان توس' 
                                                            : (bossEmployee ? `${bossEmployee.name}` : 'شرکت آریو بنیان توس')}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* عبارت به نام خدا در وسط */}
                                    <div className="w-1/3 pt-1.5 sm:pt-3 flex justify-center items-center text-center">
                                        <span className="font-bold text-sm sm:text-lg md:text-xl tracking-widest text-black">به نام خدا</span>
                                    </div>

                                    {/* شماره، تاریخ، پیوست و بارکد QR در سمت چپ */}
                                    <div className="flex items-start justify-end gap-1.5 sm:gap-2.5 w-1/3 text-black">
                                        {isArchiveOfficer && (
                                            <div className="flex flex-col text-[10px] sm:text-xs md:text-sm font-bold items-end space-y-1 sm:space-y-1.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="opacity-80 font-normal text-[10px] sm:text-xs">شماره: </span>
                                                    <input 
                                                        type="text" 
                                                        dir="rtl" 
                                                        placeholder="شماره دستی..." 
                                                        className="w-20 sm:w-28 text-center font-mono font-black text-[10px] sm:text-xs bg-gray-50 border border-gray-300 hover:border-blue-500 focus:border-blue-600 focus:bg-white outline-none px-1 py-0.5 rounded transition" 
                                                        value={formData.original_number} 
                                                        onChange={(e) => setFormData({ ...formData, original_number: toPersianDigits(e.target.value) })} 
                                                        title="شماره چاپی دستی / ثبت اصلی"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <span className="opacity-80 font-normal text-[10px] sm:text-xs">تاریخ: </span>
                                                    <div className="w-20 sm:w-24">
                                                        <JalaliDatePicker 
                                                            name="original_date" 
                                                            value={formData.original_date} 
                                                            onChange={(e) => setFormData({ ...formData, original_date: e.target.value })} 
                                                            placeholder={toPersianDigits(new Date().toLocaleDateString('fa-IR'))}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <span className="opacity-80 font-normal text-[10px] sm:text-xs">پیوست: </span>
                                                    <input 
                                                        type="text" 
                                                        placeholder="ندارد / دارد..." 
                                                        className="w-16 sm:w-24 text-center text-[10px] sm:text-xs bg-gray-50 border border-gray-300 hover:border-blue-500 focus:border-blue-600 focus:bg-white outline-none px-1 py-0.5 rounded transition" 
                                                        value={formData.attachment_note} 
                                                        onChange={(e) => setFormData({ ...formData, attachment_note: e.target.value })} 
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* بارکد QR شناسه موقت */}
                                        <div className="p-0.5 sm:p-1 bg-white border border-gray-300 rounded shadow-sm shrink-0 flex items-center justify-center">
                                            <QRCode
                                                value={`ARIO-${formData.indicator_number || 'DRAFT'}`}
                                                size={38}
                                                level="M"
                                                fgColor="#000000"
                                                bgColor="#FFFFFF"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* خط جداکننده زیر هدر نامه */}
                                <div className="w-full my-2 sm:my-3 shrink-0">
                                    <div className="border-b-2 sm:border-b-4 border-gray-400 w-full"></div>
                                </div>

                                {/* ۲. مشخصات مخاطب و موضوع */}
                                <div className="space-y-2.5 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base leading-relaxed text-black shrink-0 relative">
                                    
                                    {/* اطلاعات مقصد (گیرنده) / اطلاعات مبدأ */}
                                    {(formData.letter_type === 'OUTGOING' || formData.letter_type === 'INTERNAL' || formData.letter_type === 'DOCUMENT') && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 p-1.5 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/40">
                                            <span className="text-[11px] sm:text-xs font-bold text-indigo-700 shrink-0">
                                                {formData.letter_type === 'DOCUMENT' ? 'مخاطب مرتبط سیستمی:' : 'اطلاعات مقصد (گیرنده):'}
                                            </span>
                                            <div className="flex-1 w-full">
                                                {formData.letter_type === 'OUTGOING' ? (
                                                    <SearchableOrgSelect 
                                                        organizations={organizations}
                                                        value={formData.external_receiver}
                                                        onChange={(val) => setFormData(prev => ({ ...prev, external_receiver: val }))}
                                                        placeholder="انتخاب یا جستجوی نام سازمان گیرنده..."
                                                        isDark={isDark}
                                                    />
                                                ) : (
                                                    <SearchablePersonnelSelect 
                                                        personnel={allPersonnel} 
                                                        value={formData.internal_receiver} 
                                                        onChange={(val) => setFormData({ ...formData, internal_receiver: val })} 
                                                        placeholder="انتخاب پرسنل گیرنده از لیست همکاران..." 
                                                        isDark={false} 
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {formData.letter_type === 'INCOMING' && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 p-1.5 rounded-lg border border-dashed border-green-200 bg-green-50/40">
                                            <span className="text-[11px] sm:text-xs font-bold text-green-700 shrink-0">اطلاعات مبدأ (فرستنده خارجی):</span>
                                            <div className="flex-1 w-full">
                                                <SearchableOrgSelect 
                                                    organizations={organizations}
                                                    value={formData.external_sender}
                                                    onChange={(val) => setFormData(prev => ({ ...prev, external_sender: val }))}
                                                    placeholder="انتخاب یا جستجوی نام سازمان فرستنده..."
                                                    isDark={isDark}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* فیلد مستقل: سمت و عناوین گیرنده */}
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 w-full pt-1">
                                        <span className="text-xs sm:text-sm font-bold text-gray-700 shrink-0">به:</span>
                                        <textarea 
                                            rows="1" 
                                            placeholder="جناب آقای / سرکار خانم ... (سمت و عناوین گیرنده)" 
                                            className="w-full bg-transparent border-b border-dashed border-gray-400 hover:border-blue-500 focus:border-blue-600 focus:bg-blue-50/20 font-bold text-sm sm:text-base md:text-lg text-gray-900 outline-none transition py-0.5 px-1 resize-none" 
                                            value={formData.manual_receiver_name} 
                                            onChange={(e) => setFormData({ ...formData, manual_receiver_name: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* فیلد مستقل: اشخاص گیرنده اسامی */}
                                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 w-full text-xs sm:text-sm">
                                        <span className="text-[10px] sm:text-xs opacity-75 shrink-0">اشخاص گیرنده:</span>
                                        <textarea 
                                            rows="1" 
                                            placeholder="اشخاص گیرنده اسامی (توضیحات تکمیلی یا اسامی همکاران گیرنده)..." 
                                            className="w-full bg-transparent border-b border-dashed border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:bg-blue-50/20 text-xs sm:text-sm font-bold text-gray-800 outline-none transition py-0.5 px-1 resize-none leading-relaxed" 
                                            value={formData.receiver_persons} 
                                            onChange={(e) => setFormData({ ...formData, receiver_persons: e.target.value })}
                                        ></textarea>
                                    </div>

                                    {/* موضوع اصلی نامه / سند با دکمه ویس‌اینپوت */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 mt-1.5 w-full border-b border-dashed border-gray-300 focus-within:border-blue-500 focus-within:bg-blue-50/20 rounded px-1 transition">
                                        <span className="text-xs sm:text-sm font-bold opacity-80 shrink-0">موضوع: <span className="text-red-500">*</span></span>
                                        <input 
                                            type="text" 
                                            required 
                                            placeholder="موضوع اصلی نامه را بنویسید..." 
                                            className="flex-1 bg-transparent font-bold text-sm sm:text-base md:text-lg text-gray-900 outline-none py-1 min-w-0" 
                                            value={formData.subject} 
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })} 
                                        />
                                        <VoiceInputButton 
                                            value={formData.subject} 
                                            onChange={(val) => setFormData(prev => ({ ...prev, subject: val }))} 
                                            size="sm"
                                        />
                                    </div>

                                    {/* ردیف عطف و شماره قرارداد مرتبط */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-1 border-t border-gray-100 text-xs">
                                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                            <span className="opacity-80 font-bold shrink-0">عطف به:</span>
                                            <select 
                                                className="bg-transparent border-b border-dashed border-gray-300 text-xs py-0.5 outline-none font-bold max-w-[160px] sm:max-w-none truncate" 
                                                value={formData.reference_letter} 
                                                onChange={(e) => setFormData({ ...formData, reference_letter: e.target.value })}
                                            >
                                                <option value="">مستقل (بدون ارتباط)</option>
                                                {lettersList?.map(l => (<option key={l.id} value={l.id}>نامه {l.indicator_number}</option>))}
                                            </select>
                                            <span className="opacity-40">|</span>
                                            <input 
                                                type="text" 
                                                dir="rtl" 
                                                placeholder="عطف به (شماره دستی)..." 
                                                className="w-28 sm:w-36 bg-transparent border-b border-dashed border-gray-300 text-xs font-mono text-center outline-none" 
                                                value={formData.reference_number} 
                                                onChange={(e) => setFormData({ ...formData, reference_number: toPersianDigits(e.target.value) })} 
                                            />
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <span className="opacity-80 font-bold">شماره قرارداد:</span>
                                            <input 
                                                type="text" 
                                                dir="rtl" 
                                                placeholder="شماره قرارداد..." 
                                                className="w-24 sm:w-32 bg-transparent border-b border-dashed border-gray-300 text-xs font-mono text-center outline-none" 
                                                value={formData.contract_number} 
                                                onChange={(e) => setFormData({ ...formData, contract_number: toPersianDigits(e.target.value) })} 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ۳. متن یا چکیده نامه / سند با هدر مستقل و دکمه ویس‌اینپوت */}
                                <div className="flex-1 my-2 flex flex-col min-h-[220px] sm:min-h-[260px] relative">
                                    <div className="flex items-center justify-between mb-1.5 px-1">
                                        <span className="text-[11px] sm:text-xs font-bold text-gray-600">متن نامه:</span>
                                        <VoiceInputButton 
                                            value={formData.body} 
                                            onChange={(val) => setFormData(prev => ({ ...prev, body: val }))} 
                                            size="sm"
                                        />
                                    </div>
                                    <textarea 
                                        rows="9" 
                                        placeholder="با سلام و احترام،&#10;&#10;متن یا چکیده نامه / سند را در این کادر بنویسید..." 
                                        className="text-justify leading-relaxed sm:leading-loose flex-1 text-xs sm:text-sm md:text-base whitespace-pre-wrap font-medium text-black bg-transparent border border-dashed border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:bg-blue-50/10 rounded-xl p-2.5 sm:p-3 outline-none transition resize-none placeholder:text-gray-400" 
                                        value={formData.body} 
                                        onChange={(e) => setFormData({ ...formData, body: e.target.value })} 
                                    ></textarea>
                                </div>

                                {/* ۴. ردیف پایینی شامل رونوشت و ستون امضا */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end pb-2 relative text-black avoid-break mt-auto shrink-0 pt-3 gap-3 sm:gap-4">
                                    
                                    {/* رونوشت (سمت راست پایین) */}
                                    <div className="w-full sm:w-1/2 text-xs">
                                        <div className="border-t border-gray-400 pt-2 w-full">
                                            <strong className="block mb-1 text-xs">رونوشت:</strong>
                                            <textarea 
                                                rows="2" 
                                                placeholder="رونوشت کاغذی (تایپ متن زیر نامه)..." 
                                                className="w-full bg-transparent border-b border-dashed border-gray-300 hover:border-blue-400 focus:border-blue-500 text-xs outline-none p-1 rounded resize-none" 
                                                value={formData.cc_text} 
                                                onChange={(e) => setFormData({ ...formData, cc_text: e.target.value })} 
                                            ></textarea>
                                            
                                            <div className="mt-1.5">
                                                <label className="block text-[10px] opacity-70 mb-0.5">ارسال رونوشت سیستمی:</label>
                                                <MultiSelectSearchable 
                                                    personnel={allPersonnel} 
                                                    selectedValues={formData.internal_cc_receivers} 
                                                    onChange={(vals) => setFormData({ ...formData, internal_cc_receivers: vals })} 
                                                    placeholder="جستجو و انتخاب پرسنل..." 
                                                    isDark={false} 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ستون امضا (سمت چپ پایین) */}
                                    <div className="w-full sm:w-1/3 flex flex-col items-center text-center relative p-2.5 rounded-lg border border-dashed border-gray-300 bg-gray-50/40">
                                        <span className="mb-2 text-xs sm:text-sm font-bold w-full text-center text-gray-800">
                                            مهر و امضا
                                        </span>
                                        
                                        <div className="h-6 sm:h-8 w-full"></div>

                                        <div className="w-full">
                                            <label className="block text-[10px] sm:text-[11px] font-bold text-gray-600 mb-1">
                                                نام نوشته شده در محل امضا:
                                            </label>
                                            <input 
                                                type="text" 
                                                placeholder={formData.letter_type === 'OUTGOING' ? (bossEmployee?.name || 'مدیرعامل') : myName} 
                                                className="w-full text-center font-bold text-xs sm:text-sm bg-white border border-gray-300 hover:border-blue-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-400 text-blue-950 outline-none px-2 py-1.5 rounded-lg transition shadow-sm" 
                                                value={formData.manual_sender_name} 
                                                onChange={(e) => setFormData({ ...formData, manual_sender_name: e.target.value })} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ۵. پاورقی رسمی اطلاعات شرکت (تنها در نامه‌های غیر وارده نمایش داده می‌شود) */}
                            {formData.letter_type !== 'INCOMING' && (
                                <div className="w-full pt-2 avoid-break mt-auto shrink-0 border-t border-gray-200">
                                    <div className="border-t-[2px] sm:border-t-[3px] border-gray-400 pt-2 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-3 text-gray-800">
                                        <div className="relative flex items-center justify-center p-1 bg-white border border-gray-300 rounded-lg shrink-0">
                                            <QRCode
                                                value="https://www.ariobonyantoos.com/"
                                                size={54}
                                                level="H"
                                                fgColor="#000000"
                                                bgColor="#FFFFFF"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-4 h-4 bg-white rounded border border-gray-200 flex items-center justify-center p-0.5">
                                                    <img src={logo} alt="لوگو" className="w-full h-full object-contain" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col text-center sm:text-right text-[9px] sm:text-[10px] font-bold space-y-0.5">
                                            <div className="flex items-center justify-center sm:justify-end gap-1.5">
                                                <span>مشهد، هاشمیه ۵۱، پلاک ۱۳۶</span>
                                                <FaMapMarkerAlt size={9} className="text-cyan-600" />
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-end gap-1.5">
                                                <span className="font-mono" dir="ltr">051 - 376 17880 | 376 46801</span>
                                                <FaPhoneAlt size={9} className="text-cyan-600" />
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-end gap-1.5">
                                                <span className="font-mono" dir="ltr">0910 555 0268 - 0915 255 3010</span>
                                                <FaMobileAlt size={9} className="text-cyan-600" />
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-end gap-1.5">
                                                <span className="font-mono">ariobonyantoos@gmail.com</span>
                                                <FaEnvelope size={9} className="text-cyan-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* کارت ۴: آپلود ضمائم و نسخه فیزیکی */}
                    <div className={`p-3 sm:p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-xl bg-blue-50/50 dark:bg-slate-900/50 border border-blue-200 dark:border-slate-700">
                            <label className="block mb-1.5 text-xs font-bold opacity-80 text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                                <FaPaperclip /> آپلود اسکن نامه و ضمائم
                            </label>
                            <input type="file" multiple onChange={(e) => setAttachments(e.target.files)} className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer" />
                        </div>        

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-center p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold opacity-80">
                                <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={formData.has_physical_copy} onChange={(e) => setFormData({ ...formData, has_physical_copy: e.target.checked })} />
                                دارای نسخه فیزیکی (کاغذی) است
                            </label>
                            {formData.has_physical_copy && (
                                <input type="text" placeholder="محل بایگانی زونکن (مثلا: زونکن قراردادهای الف)" className="w-full p-2 text-xs sm:text-sm rounded-lg border focus:ring-2 focus:outline-none transition bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white" value={formData.physical_archive_location} onChange={(e) => setFormData({ ...formData, physical_archive_location: e.target.value })} />
                            )}
                        </div>
                    </div>

                    {/* دکمه‌های نهایی ثبت و انصراف */}
                    <div className="flex justify-end gap-2.5 pt-1 pb-6">
                        <button 
                            type="button" 
                            onClick={() => {
                                if (!replyData) setStep(1);
                                else navigate(-1);
                            }} 
                            className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-lg bg-gray-500 text-white hover:bg-gray-600 font-bold text-xs sm:text-sm transition"
                        >
                            {replyData ? 'انصراف' : 'تغییر نوع مکاتبه'}
                        </button>
                        <button type="submit" disabled={creating} className="px-6 py-2 sm:px-8 sm:py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-bold text-xs sm:text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-1.5">
                            <FaCheck /> {creating ? 'در حال ثبت...' : 'ثبت پیش‌نویس نامه'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default SecretariatCreateScreen;