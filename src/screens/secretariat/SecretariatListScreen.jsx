import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    fetchLetters, 
    fetchAllPersonnel, 
    fetchLetterTypeSmsSettings, 
    updateLetterTypeSmsSettings 
} from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { 
    FaPlus, FaSearch, FaPaperclip, FaExclamationCircle, FaUserSecret, 
    FaInbox, FaChevronLeft, FaChevronDown, FaAngleRight, FaAngleLeft, 
    FaSortAmountDown, FaSortAmountUp, FaCheckCircle, FaTrash, 
    FaCog, FaTimes, FaCheck
} from 'react-icons/fa';

import logo from '../../assets/ario.png';

const HighlightedText = ({ text, highlight }) => {
    if (!highlight || !text) return <>{text}</>;
    const escaped = highlight.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fuzzyStr = escaped.replace(/[0-9۰-۹]/g, (match) => {
        const num = '0123456789۰۱۲۳۴۵۶۷۸۹'.indexOf(match) % 10;
        return `[${num}${String.fromCharCode(1776 + num)}]`;
    });
    const regex = new RegExp(`(${fuzzyStr})`, 'gi');
    const parts = text.toString().split(regex);
    return (
        <span>
            {parts.map((part, i) =>
                i % 2 === 1 ? (
                    <mark key={i} className="bg-yellow-300 text-gray-900 px-1 rounded-sm font-bold">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

// 🚀 کامپوننت فرمت‌دهی شماره‌های اسلش‌دار و اداری بر اساس الگوی استاندارد برگه رسمی
const renderFormattedNumber = (numStr, customClass = "text-[13px]", highlight = null) => {
    if (!numStr) return null;
    const str = String(numStr);
    if (str.includes('/')) {
        const parts = str.split('/');
        return (
            <span className={`inline-flex items-center gap-[3px] font-mono font-black ${customClass}`} dir="ltr">
                {parts.map((part, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-gray-400 dark:text-gray-500 opacity-60 font-normal">/</span>}
                        <span>{highlight ? <HighlightedText text={part} highlight={highlight} /> : part}</span>
                    </React.Fragment>
                ))}
            </span>
        );
    }
    return (
        <span dir="ltr" className={`font-mono font-bold ${customClass}`}>
            {highlight ? <HighlightedText text={str} highlight={highlight} /> : str}
        </span>
    );
};

const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel?.find((p) => String(p.id) === String(value));
            if (selected) {
                setSearchTerm(selected.position_title ? `${selected.name} (${selected.position_title})` : selected.name);
            }
        } else {
            setSearchTerm('');
        }
    }, [value, personnel]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = (personnel || []).filter(
        (p) =>
            p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.position_title && p.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const inputClass = `w-full py-2.5 px-4 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${
        isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
    }`;

    return (
        <div className="relative w-full md:w-64" ref={wrapperRef}>
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
            <FaChevronDown className="absolute left-3 top-3.5 text-gray-400 pointer-events-none text-xs" />

            {isOpen && (
                <ul
                    className={`absolute z-30 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-xl ${
                        isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                    <li
                        className={`p-2.5 cursor-pointer text-sm font-bold opacity-70 ${
                            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                            onChange('');
                            setSearchTerm('');
                            setIsOpen(false);
                        }}
                    >
                        -- همه فرستنده‌ها --
                    </li>
                    {filtered.map((emp) => (
                        <li
                            key={emp.id}
                            className={`p-2.5 cursor-pointer text-sm border-t ${
                                isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                                onChange(emp.id.toString());
                                setSearchTerm(emp.position_title ? `${emp.name} (${emp.position_title})` : emp.name);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-xs opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && <li className="p-3 text-sm opacity-50 text-center">موردی یافت نشد</li>}
                </ul>
            )}
        </div>
    );
};

const DirectionalLogo = ({ type, status }) => {
    const isOutward = type === 'OUTGOING';
    const isInternal = type === 'INTERNAL';
    const isDocument = type === 'DOCUMENT';
    const isDeleted = status === 'DELETED';

    const theme = isDeleted
        ? { bg: 'bg-red-100 dark:bg-red-900/30 grayscale', border: 'border-red-400', text: 'text-red-500 dark:text-red-400' }
        : type === 'INCOMING'
        ? { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-600 dark:text-green-400' }
        : type === 'OUTGOING'
        ? { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400' }
        : type === 'DOCUMENT'
        ? { bg: 'bg-slate-100 dark:bg-slate-900/40', border: 'border-slate-500', text: 'text-slate-600 dark:text-slate-400' }
        : { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400' };

    return (
        <div className={`relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 flex items-center justify-center rounded-xl shadow-sm border transition-all duration-500 ${theme.bg} ${theme.border}`}>
            <img src={logo} alt="لوگو" className="w-6 h-6 sm:w-7 sm:h-7 object-contain z-10 relative opacity-90" />
            <div className={`absolute inset-0 z-20 transition-transform duration-700 ease-in-out ${isInternal ? 'rotate-45' : isOutward ? 'rotate-90' : isDocument ? 'rotate-180' : 'rotate-0'}`}>
                {[0, 90, 180, 270].map((rotation, i) => (
                    <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            className={`transition-all duration-500 drop-shadow-sm ${theme.text} -mt-2.5 ${!isInternal && !isOutward && !isDocument ? 'rotate-180' : 'rotate-0'}`}
                        >
                            {isInternal || isDocument ? (
                                <>
                                    <path d="M 22 22 A 18 18 0 0 0 6 6" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                                    <path d="M 12 12 L 6 6 L 12 0" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                                </>
                            ) : (
                                <>
                                    <path d="M 12 23 Q 22 14, 12 3" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                                    <path d="M 6 9 L 12 3 L 18 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-40 12 3)" />
                                </>
                            )}
                        </svg>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SecretariatListScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); 
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    
    const { userInfo } = useSelector((state) => state.userLogin || {});
    const isBoardMember = Boolean(
        userInfo?.is_admin || 
        userInfo?.employee?.position?.hierarchy_level === 0 || 
        userInfo?.employee?.position?.code === 'MANAGING_COUNCIL'
    );

    const { letters: lettersData, loadingList, error, allPersonnel } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : (lettersData?.results || []);
    const totalCount = lettersData?.count || lettersList.length || 0;
    const totalPages = Math.ceil(totalCount / 12) || 1;

    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState(location.state?.filter || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [senderFilter, setSenderFilter] = useState('');
    const [ordering, setOrdering] = useState('desc'); 

    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchWrapperRef = useRef(null);

    const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
    const [smsActive, setSmsActive] = useState(true);
    const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
    const [loadingSettings, setLoadingSettings] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [personnelSearch, setPersonnelSearch] = useState('');

    const JALALI_YEARS = ['1401', '1402', '1403', '1404', '1405', '1406', '1407'];

    const handleFilterChange = (setter, value) => {
        setter(value);
        setPage(1); 
    };

    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedSearch(searchQuery); }, 600); 
        return () => { clearTimeout(handler); };
    }, [searchQuery]);

    useEffect(() => {
        dispatch(fetchAllPersonnel());
    }, [dispatch]);

    useEffect(() => {
        const params = { 
            search: debouncedSearch, 
            page: page, 
            jalali_year: selectedYear || null, 
            sender: senderFilter, 
            ordering: ordering 
        };
        if (filterType === 'DELETED') {
            params.status = 'DELETED';
        } else {
            params.type = filterType;
        }
        dispatch(fetchLetters(params));
    }, [dispatch, filterType, debouncedSearch, page, selectedYear, senderFilter, ordering]);

    useEffect(() => { setIsSearchOpen(false); }, [location.pathname]);

    useEffect(() => {
        const handleClickOutsideSearch = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideSearch);
        return () => document.removeEventListener('mousedown', handleClickOutsideSearch);
    }, []);

    const handleOpenSmsSettings = async () => {
        if (!filterType || filterType === 'DELETED') return;
        setLoadingSettings(true);
        try {
            const res = await dispatch(fetchLetterTypeSmsSettings(filterType)).unwrap();
            setSmsActive(res.is_active);
            setSelectedRecipientIds((res.recipient_ids || []).map(String));
            setIsSmsModalOpen(true);
        } catch (err) {
            toast.error(err || 'خطا در واکشی تنظیمات پیامک');
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleSaveSmsSettings = async () => {
        setSavingSettings(true);
        try {
            await dispatch(updateLetterTypeSmsSettings({
                type: filterType,
                is_active: smsActive,
                recipient_ids: selectedRecipientIds
            })).unwrap();
            toast.success('تنظیمات پیامک با موفقیت ذخیره شد');
            setIsSmsModalOpen(false);
        } catch (err) {
            toast.error(err || 'خطا در ذخیره تنظیمات');
        } finally {
            setSavingSettings(false);
        }
    };

    const toggleRecipient = (empId) => {
        const idStr = String(empId);
        if (selectedRecipientIds.includes(idStr)) {
            setSelectedRecipientIds(selectedRecipientIds.filter(id => id !== idStr));
        } else {
            setSelectedRecipientIds([...selectedRecipientIds, idStr]);
        }
    };

    const formatPersianDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const getMonthName = (dateString) => {
        if (!dateString) return 'نامشخص';
        return new Date(dateString).toLocaleDateString('fa-IR', { month: 'long', year: 'numeric' });
    };

    const getFilterName = (type) => {
        switch(type) {
            case 'INCOMING': return 'مکاتبات وارده';
            case 'OUTGOING': return 'مکاتبات صادره';
            case 'INTERNAL': return 'مکاتبات داخلی';
            case 'DOCUMENT': return 'اسناد';
            case 'DELETED': return 'زباله‌دان (حذف شده‌ها)';
            default: return 'همه مکاتبات';
        }
    };

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'REGISTERED':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black shadow-sm text-white bg-emerald-500 whitespace-nowrap"><FaCheckCircle /> تکمیل شده</span>;
            case 'ISSUED':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black shadow-sm text-white bg-cyan-500 whitespace-nowrap">🏃‍♂️ در دست پیک</span>;
            case 'APPROVED':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black shadow-sm text-white bg-blue-500 whitespace-nowrap">📄 آماده صدور</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black shadow-sm text-white bg-rose-500 whitespace-nowrap">❌ رد شده</span>;
            case 'DELETED':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black shadow-sm text-white bg-gray-600 dark:bg-red-900 border border-red-500 whitespace-nowrap"><FaTrash size={9} /> حذف شده</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black shadow-sm text-white bg-orange-400 whitespace-nowrap">⏳ در انتظار</span>;
        }
    };

    const filteredPersonnelForModal = (allPersonnel || []).filter(p => 
        p.name?.toLowerCase().includes(personnelSearch.toLowerCase()) || 
        (p.position_title && p.position_title.toLowerCase().includes(personnelSearch.toLowerCase()))
    );

    return (
        <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-5">

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold print:hidden">
                <Link to="/" className="text-blue-500 hover:text-blue-700 transition">خانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className="text-gray-500">دبیرخانه</span>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>{getFilterName(filterType)}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${filterType === 'DELETED' ? 'bg-gradient-to-br from-red-600 to-rose-700' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}>
                        {filterType === 'DELETED' ? <FaTrash size={16} /> : <FaInbox size={18} />}
                    </div>
                    <div>
                        <h1 className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {filterType === 'DELETED' ? 'زباله‌دان دبیرخانه' : 'دبیرخانه کل'}
                        </h1>
                        <span className="text-xs sm:text-sm font-bold opacity-60">تعداد موارد (با احتساب فیلتر): {totalCount}</span>
                    </div>
                </div>
                <Link to="/secretariat/create" className="w-full sm:w-auto justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition text-sm font-bold shadow-md shadow-blue-900/20 active:scale-95">
                    <FaPlus size={12} /> ثبت نامه / سند جدید
                </Link>
            </div>

            <div className={`p-3.5 sm:p-5 rounded-2xl space-y-4 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
                    
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 touch-pan-x min-w-0" style={{ scrollbarWidth: 'none' }}>
                        {[
                            { label: 'همه مکاتبات', value: '' },
                            { label: 'وارده', value: 'INCOMING' },
                            { label: 'صادره', value: 'OUTGOING' },
                            { label: 'داخلی', value: 'INTERNAL' },
                            { label: '📁 اسناد', value: 'DOCUMENT' },
                            { label: '🗑️ زباله‌دان', value: 'DELETED', isTrash: true },
                        ].map((tab) => {
                            const isActive = filterType === tab.value;
                            let activeClass = 'bg-blue-600 text-white shadow-md';
                            if (tab.isTrash && isActive) activeClass = 'bg-red-600 text-white shadow-md shadow-red-500/20';

                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => handleFilterChange(setFilterType, tab.value)}
                                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition whitespace-nowrap shrink-0 ${
                                        isActive
                                            ? activeClass
                                            : isDark
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}

                        {isBoardMember && filterType && filterType !== 'DELETED' && (
                            <button
                                type="button"
                                disabled={loadingSettings}
                                onClick={handleOpenSmsSettings}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black transition border border-amber-500/40 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40 whitespace-nowrap shrink-0 active:scale-95"
                                title="تنظیمات ارسال پیامک برای این نوع مکاتبه"
                            >
                                <FaCog className={`text-amber-600 dark:text-amber-400 ${loadingSettings ? 'animate-spin' : ''}`} />
                                <span>تنظیمات پیامک</span>
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3">
                        <SearchablePersonnelSelect personnel={allPersonnel} value={senderFilter} onChange={(val) => handleFilterChange(setSenderFilter, val)} placeholder="فیلتر فرستنده داخلی..." isDark={isDark} />
                        
                        <div className="relative w-full sm:w-72 md:w-80" ref={searchWrapperRef}>
                            <input
                                type="text" 
                                placeholder="جستجو (موضوع، متن، شماره)..."
                                value={searchQuery}
                                onChange={(e) => { handleFilterChange(setSearchQuery, e.target.value); setIsSearchOpen(true); }}
                                onFocus={() => setIsSearchOpen(true)}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
                            />
                            <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
                            
                            {searchQuery && isSearchOpen && (
                                <div className={`absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 sm:w-[480px] max-w-[95vw] max-h-[460px] overflow-y-auto rounded-xl border shadow-2xl z-50 p-3 sm:p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
                                    {loadingList ? (
                                        <div className="p-3 text-center text-sm opacity-50 font-bold">در حال جستجو...</div>
                                    ) : lettersList.length === 0 ? (
                                        <div className="p-3 text-center text-sm opacity-50 font-bold">نتیجه‌ای یافت نشد</div>
                                    ) : (
                                        lettersList.map(letter => {
                                            const escaped = searchQuery.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                            const fuzzyStr = escaped.replace(/[0-9۰-۹]/g, match => {
                                                const num = '0123456789۰۱۲۳۴۵۶۷۸۹'.indexOf(match) % 10;
                                                return `[${num}${String.fromCharCode(1776 + num)}]`;
                                            });
                                            const searchRegex = new RegExp(fuzzyStr, 'gi');
                                            
                                            const checkMatch = (val) => {
                                                if (!val) return false;
                                                searchRegex.lastIndex = 0; 
                                                return searchRegex.test(val);
                                            };

                                            const matches = [];
                                            if (checkMatch(letter.subject)) matches.push({ label: 'موضوع', text: letter.subject });
                                            if (checkMatch(letter.indicator_number)) matches.push({ label: 'شماره سیستمی', text: letter.indicator_number });
                                            if (checkMatch(letter.original_number)) matches.push({ label: 'شماره فیزیکی', text: letter.original_number });
                                            if (checkMatch(letter.contract_number)) matches.push({ label: 'شماره قرارداد', text: letter.contract_number });
                                            if (checkMatch(letter.final_sender_name)) matches.push({ label: 'فرستنده', text: letter.final_sender_name });
                                            if (checkMatch(letter.final_receiver_name)) matches.push({ label: 'گیرنده', text: letter.final_receiver_name });
                                            if (checkMatch(letter.manual_sender_name)) matches.push({ label: 'فرستنده دستی', text: letter.manual_sender_name });
                                            if (checkMatch(letter.manual_receiver_name)) matches.push({ label: 'گیرنده دستی', text: letter.manual_receiver_name });

                                            let bodySnippet = null;
                                            searchRegex.lastIndex = 0;
                                            const bodyMatch = letter.body ? searchRegex.exec(letter.body) : null;
                                            
                                            if (bodyMatch) {
                                                const idx = bodyMatch.index;
                                                const matchLen = bodyMatch[0].length;
                                                const start = Math.max(0, idx - 40);
                                                const end = Math.min(letter.body.length, idx + matchLen + 40);
                                                
                                                const originalMatch = letter.body.substring(idx, idx + matchLen);
                                                const pre = letter.body.substring(start, idx);
                                                const post = letter.body.substring(idx + matchLen, end);
                                                
                                                bodySnippet = (
                                                    <span>
                                                        {start > 0 && '... '}
                                                        {pre}
                                                        <mark className="bg-yellow-300 text-black px-1 mx-1 font-black rounded-sm shadow-sm">
                                                            ---------- {originalMatch} ----------
                                                        </mark>
                                                        {post}
                                                        {end < letter.body.length && ' ...'}
                                                    </span>
                                                );
                                            }

                                            if (matches.length === 0 && !bodySnippet) return null;

                                            return (
                                                <div 
                                                    key={letter.id} 
                                                    onClick={() => {
                                                        setIsSearchOpen(false);
                                                        navigate(`/secretariat/${letter.id}`);
                                                    }}
                                                    className="relative bg-white text-gray-900 p-3.5 mb-3 rounded-lg shadow-md cursor-pointer transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg border border-gray-200"
                                                    style={{ minHeight: '160px', backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #fcfcfc 100%)' }}
                                                >
                                                    <div className="flex justify-between items-start border-b-2 border-gray-300 pb-2 mb-2.5">
                                                        <div className="w-1/4 flex flex-col items-center justify-center opacity-20">
                                                            <FaInbox size={20} />
                                                        </div>
                                                        <div className="w-2/4 text-center font-black text-xs sm:text-sm pt-0.5">بسمه تعالی</div>
                                                        <div className="w-1/4 text-left text-[9px] font-mono font-bold leading-relaxed">
                                                            <div className="whitespace-nowrap flex items-center justify-end gap-1">
                                                                <span className="opacity-70">ش:</span>
                                                                {renderFormattedNumber(letter.indicator_number, "text-[10px]", searchQuery)}
                                                            </div>
                                                            {letter.original_number && (
                                                                <div className="whitespace-nowrap flex items-center justify-end gap-1">
                                                                    <span className="opacity-70">ف:</span>
                                                                    {renderFormattedNumber(letter.original_number, "text-[10px]", searchQuery)}
                                                                </div>
                                                            )}
                                                            <div>ت: {new Date(letter.created_at).toLocaleDateString('fa-IR')}</div>
                                                        </div>
                                                    </div>

                                                    <div className="text-[11px] space-y-1.5 font-bold mb-2">
                                                        {matches.map((m, idx) => (
                                                            <div key={idx} className="flex gap-1 border-b border-gray-100 pb-1 mt-1">
                                                                <span className="opacity-60 min-w-[70px]">{m.label}:</span> 
                                                                <span className="flex-1 leading-tight">
                                                                    {['شماره سیستمی', 'شماره فیزیکی', 'شماره قرارداد'].includes(m.label)
                                                                        ? renderFormattedNumber(m.text, "text-[11px]", searchQuery)
                                                                        : <HighlightedText text={m.text} highlight={searchQuery} />
                                                                    }
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {bodySnippet && (
                                                        <div className="mt-2 text-[10px] leading-loose text-justify text-gray-800 bg-gray-50 p-2 rounded border border-gray-200 border-dashed relative">
                                                            <span className="absolute -top-2.5 right-2 bg-gray-50 px-1 text-[8px] font-bold text-gray-400">متن نامه</span>
                                                            {bodySnippet}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* بخش سال بایگانی و مرتب‌سازی */}
                <div className={`pt-3.5 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between w-full min-w-0">
                        
                        <div className="flex items-center gap-2 min-w-0 w-full md:w-auto">
                            <span className="text-xs font-bold opacity-70 whitespace-nowrap shrink-0">سال بایگانی:</span>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 w-full min-w-0 touch-pan-x" style={{ scrollbarWidth: 'none' }}>
                                <button 
                                    type="button"
                                    onClick={() => handleFilterChange(setSelectedYear, '')} 
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                                        !selectedYear 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : isDark ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    همه سال‌ها
                                </button>
                                {JALALI_YEARS.map(yr => (
                                    <button 
                                        key={yr} 
                                        type="button"
                                        onClick={() => handleFilterChange(setSelectedYear, yr)} 
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                                            selectedYear === yr 
                                                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/30' 
                                                : isDark ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        <span>{yr}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-r md:pr-4 border-gray-200 dark:border-gray-700 shrink-0 self-end md:self-auto">
                            <button 
                                type="button"
                                onClick={() => handleFilterChange(setOrdering, 'desc')} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    ordering === 'desc' 
                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                        : isDark ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <FaSortAmountDown /> جدید به قدیم
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleFilterChange(setOrdering, 'asc')} 
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    ordering === 'asc' 
                                        ? 'bg-emerald-600 text-white shadow-sm' 
                                        : isDark ? 'bg-gray-700/80 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                <FaSortAmountUp /> قدیم به جدید
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {loadingList ? (
                <div className="text-center py-20 animate-pulse font-bold opacity-50">در حال جستجو...</div>
            ) : error ? (
                <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold">{error}</div>
            ) : lettersList?.length === 0 ? (
                <div className={`text-center py-24 rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
                    <FaInbox size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold opacity-70 mb-1">
                        {filterType === 'DELETED' ? 'زباله‌دان خالی است' : 'هیچ مکاتبه‌ای یافت نشد'}
                    </h3>
                    <p className="text-sm opacity-50">با تغییر فیلترها یا کلمات جستجو مجدداً تلاش کنید.</p>
                </div>
            ) : (
                <div className={`rounded-2xl border shadow-sm overflow-hidden ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    
                    {/* نمایش کارتی ریسپانسیو اختصاصی برای موبایل و تبلت‌های کوچک */}
                    <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                        {lettersList.map((letter, index) => {
                            const currentMonth = getMonthName(letter.created_at);
                            const previousMonth = index > 0 ? getMonthName(lettersList[index - 1]?.created_at) : null;
                            const showDivider = currentMonth !== previousMonth;
                            const isDeletedLetter = letter.status === 'DELETED';

                            return (
                                <React.Fragment key={letter.id}>
                                    {showDivider && (
                                        <div className={`px-4 py-2 flex items-center gap-3 ${isDark ? 'bg-gray-900/60' : 'bg-blue-50/70'}`}>
                                            <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${isDark ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                                {currentMonth}
                                            </span>
                                            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                        </div>
                                    )}

                                    <div
                                        onClick={() => navigate(`/secretariat/${letter.id}`)}
                                        className={`p-4 space-y-3 cursor-pointer transition active:scale-[0.99] ${
                                            isDeletedLetter 
                                                ? (isDark ? 'bg-red-950/20' : 'bg-red-50/40') 
                                                : (isDark ? 'hover:bg-gray-750' : 'hover:bg-blue-50/30')
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <DirectionalLogo type={letter.letter_type} status={letter.status} />
                                                <div className="flex flex-col">
                                                    <div className={`${isDeletedLetter ? 'line-through text-red-500' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                        {renderFormattedNumber(letter.indicator_number, "text-sm")}
                                                    </div>
                                                    <span className="text-[10px] opacity-50 font-bold">
                                                        ردیف {(page - 1) * 12 + index + 1}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                {renderStatusBadge(letter.status)}
                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                    letter.letter_type === 'INCOMING' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                    letter.letter_type === 'OUTGOING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                                                    letter.letter_type === 'DOCUMENT' ? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' :
                                                    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                                                }`}>
                                                    {letter.letter_type === 'INCOMING' ? 'وارده' : letter.letter_type === 'OUTGOING' ? 'صادره' : letter.letter_type === 'DOCUMENT' ? 'اسناد' : 'داخلی'}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-start gap-1.5">
                                                <span className={`font-bold text-sm leading-snug ${isDeletedLetter ? 'line-through opacity-70' : ''} ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                                    {letter.subject}
                                                </span>
                                                {letter.attachments?.length > 0 && (
                                                    <FaPaperclip className="text-gray-400 shrink-0 mt-0.5" size={12} />
                                                )}
                                            </div>

                                            {(letter.urgency !== 'NORMAL' || letter.confidentiality !== 'NORMAL') && (
                                                <div className="flex gap-1.5 mt-2">
                                                    {letter.urgency !== 'NORMAL' && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                                                            <FaExclamationCircle size={8} /> {letter.urgency === 'URGENT' ? 'فوری' : 'خیلی فوری'}
                                                        </span>
                                                    )}
                                                    {letter.confidentiality !== 'NORMAL' && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                            <FaUserSecret size={8} /> {letter.confidentiality === 'CONFIDENTIAL' ? 'محرمانه' : 'سری'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] opacity-60 font-bold text-blue-500">فرستنده:</span>
                                                <span className={`text-[11px] font-bold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {letter.final_sender_name || '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] opacity-60 font-bold text-indigo-500">گیرنده:</span>
                                                <span className={`text-[11px] font-bold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {letter.final_receiver_name || '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-1 text-[10px] opacity-70 border-t border-dashed border-gray-100 dark:border-gray-700/60">
                                            <span>ثبت: {formatPersianDate(letter.created_at)}</span>
                                            {letter.original_number && (
                                                <div className="flex items-center gap-1">
                                                    <span>فیزیکی:</span>
                                                    {renderFormattedNumber(letter.original_number, "text-[10px]")}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* نمایش جدولی کامل برای دسکتاپ و صفحات عریض */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-right text-sm">
                            <thead className={`text-[11px] uppercase tracking-wider font-black ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                                <tr>
                                    <th className="px-5 py-4 w-12 text-center">ردیف</th>
                                    <th className="px-5 py-4 w-44">شماره‌ها</th>
                                    <th className="px-5 py-4 w-28">نوع / وضعیت</th>
                                    <th className="px-5 py-4 max-w-md">موضوع و مشخصات</th>
                                    <th className="px-5 py-4 w-32">مبدأ / مقصد</th>
                                    <th className="px-5 py-4 w-48">تاریخ‌های مرتبط</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {lettersList.map((letter, index) => {
                                    const currentMonth = getMonthName(letter.created_at);
                                    const previousMonth = index > 0 ? getMonthName(lettersList[index - 1]?.created_at) : null;
                                    const showDivider = currentMonth !== previousMonth;
                                    const isDeletedLetter = letter.status === 'DELETED';

                                    return (
                                        <React.Fragment key={letter.id}>
                                            {showDivider && (
                                                <tr className={`${isDark ? 'bg-gray-800/80' : 'bg-blue-50/50'}`}>
                                                    <td colSpan="6" className="px-5 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`text-xs font-black px-3 py-1 rounded-full ${isDark ? 'bg-gray-700 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                                                                {currentMonth}
                                                            </span>
                                                            <div className={`flex-1 h-px ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}

                                            <tr 
                                                onClick={() => navigate(`/secretariat/${letter.id}`)}
                                                className={`cursor-pointer group transition-colors duration-200 ${
                                                    isDeletedLetter 
                                                        ? (isDark ? 'bg-red-950/20 hover:bg-red-900/30' : 'bg-red-50/30 hover:bg-red-50/70') 
                                                        : (isDark ? 'hover:bg-gray-700/50 bg-gray-800' : 'hover:bg-blue-50/50 bg-white')
                                                }`}
                                            >
                                                <td className="px-5 py-4 whitespace-nowrap text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2">
                                                        <span className="text-xs font-bold opacity-40">{(page - 1) * 12 + index + 1}</span>
                                                        <DirectionalLogo type={letter.letter_type} status={letter.status} />
                                                    </div>
                                                </td>

                                                {/* ستون شماره‌ها با چینش حرفه‌ای و استایل شیک اسلش‌دار */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] opacity-60 font-bold mb-0.5">سیستمی:</span>
                                                            <div className={`${isDeletedLetter ? 'line-through text-red-500' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                                                {renderFormattedNumber(letter.indicator_number, "text-[13px]")}
                                                            </div>
                                                        </div>

                                                        {letter.original_number && (
                                                            <div className="flex flex-col border-t border-gray-100 dark:border-gray-700 pt-1">
                                                                <span className="text-[9px] opacity-60 font-bold mb-0.5">شماره نامه :</span>
                                                                <div className="text-right">
                                                                    {renderFormattedNumber(letter.original_number, "text-[11px]")}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {letter.destination_indicator && (
                                                            <div className="flex flex-col border-t border-gray-100 dark:border-gray-700 pt-1">
                                                                <span className="text-[9px] opacity-60 font-bold mb-0.5 text-emerald-600">ثبت مقصد:</span>
                                                                <div className="text-right text-emerald-600 dark:text-emerald-400">
                                                                    {renderFormattedNumber(letter.destination_indicator, "text-[11px] text-emerald-600 dark:text-emerald-400")}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-2 items-start">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black tracking-wide ${
                                                            letter.letter_type === 'INCOMING' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-500/20' :
                                                            letter.letter_type === 'OUTGOING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-500/20' :
                                                            letter.letter_type === 'DOCUMENT' ? 'bg-slate-200 text-slate-800 dark:bg-slate-600/30 dark:text-slate-300 border border-slate-500/30' :
                                                            'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-500/20'
                                                        }`}>
                                                            {letter.letter_type === 'INCOMING' ? 'وارده' : letter.letter_type === 'OUTGOING' ? 'صادره' : letter.letter_type === 'DOCUMENT' ? '📁 اسناد' : 'داخلی'}
                                                        </span>
                                                        
                                                        {renderStatusBadge(letter.status)}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 max-w-xs md:max-w-md">
                                                    <div className="flex items-start gap-2 mb-1">
                                                        <span className={`font-bold text-[13px] leading-relaxed ${isDeletedLetter ? 'line-through opacity-70' : ''} ${isDark ? 'text-gray-100' : 'text-gray-900'}`} title={letter.subject}>
                                                            {letter.subject}
                                                        </span>
                                                        {letter.attachments?.length > 0 && (
                                                            <FaPaperclip className="text-gray-400 flex-shrink-0 mt-1" title="دارای پیوست" size={12} />
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1.5 mt-2">
                                                        {letter.urgency !== 'NORMAL' && (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-500/20">
                                                                <FaExclamationCircle size={8} /> 
                                                                {letter.urgency === 'URGENT' ? 'فوری' : 'خیلی فوری'}
                                                            </span>
                                                        )}
                                                        {letter.confidentiality !== 'NORMAL' && (
                                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-500/20">
                                                                <FaUserSecret size={8} /> 
                                                                {letter.confidentiality === 'CONFIDENTIAL' ? 'محرمانه' : 'سری'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-2 max-w-[140px]">
                                                        <div className="flex flex-col border-b border-gray-100 dark:border-gray-700 pb-1.5">
                                                            <span className="text-[9px] opacity-60 font-bold mb-0.5 text-blue-500">از (فرستنده):</span>
                                                            <span className={`text-[11px] font-bold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {letter.final_sender_name}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col pt-0.5">
                                                            <span className="text-[9px] opacity-60 font-bold mb-0.5 text-indigo-500">به (گیرنده):</span>
                                                            <span className={`text-[11px] font-bold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                {letter.final_receiver_name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                            <div className="flex flex-col">
                                                                <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">تاریخ ثبت نگارنده</span>
                                                                <span className={`text-[10px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                    {formatPersianDate(letter.created_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        
                                                        {letter.approved_at && (
                                                            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">تایید مدیریت</span>
                                                                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                        {formatPersianDate(letter.approved_at)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {letter.original_date && (
                                                            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-bold opacity-60 uppercase tracking-widest">تاریخ چاپ روی نامه</span>
                                                                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                        {formatPersianDate(letter.original_date)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {letter.destination_date && (
                                                            <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-1.5">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">ثبت مقصد</span>
                                                                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                        {formatPersianDate(letter.destination_date)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className={`px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="text-xs font-bold opacity-60">
                                صفحه {page} از {totalPages} (مجموع: {totalCount} مورد)
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    disabled={page === 1} 
                                    onClick={() => setPage(page - 1)} 
                                    className="px-3 py-1.5 rounded-lg flex items-center gap-1 bg-white border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-100 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 text-xs font-bold"
                                >
                                    <FaAngleRight /> صفحه قبل
                                </button>
                                <button 
                                    disabled={page === totalPages} 
                                    onClick={() => setPage(page + 1)} 
                                    className="px-3 py-1.5 rounded-lg flex items-center gap-1 bg-white border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-100 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 text-xs font-bold"
                                >
                                    صفحه بعد <FaAngleLeft />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* مودال تنظیمات پیامک */}
            {isSmsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className={`w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl p-4 sm:p-6 space-y-4 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                        <div className="flex justify-between items-center border-b pb-3 border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <FaCog className="text-amber-500 text-lg" />
                                <h3 className="font-black text-sm sm:text-base">تنظیمات پیامک اطلاع‌رسانی ({getFilterName(filterType)})</h3>
                            </div>
                            <button onClick={() => setIsSmsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition">
                                <FaTimes size={16} />
                            </button>
                        </div>

                        <div className="p-3 rounded-xl border flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                            <div className="pr-1">
                                <span className="font-bold text-xs block">ارسال خودکار پیامک فعال باشد؟</span>
                                <span className="text-[10px] opacity-60">در صورت فعال بودن، پس از ثبت مکاتبه، به افراد منتخب زیر پیامک ارسال می‌شود.</span>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={smsActive} 
                                onChange={(e) => setSmsActive(e.target.checked)}
                                className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0" 
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-black opacity-80">انتخاب اعضای دریافت‌کننده پیامک:</label>
                                <span className="text-[10px] font-bold text-blue-500">انتخاب شده: {selectedRecipientIds.length} نفر</span>
                            </div>

                            <input
                                type="text"
                                placeholder="جستجوی پرسنل..."
                                value={personnelSearch}
                                onChange={(e) => setPersonnelSearch(e.target.value)}
                                className={`w-full mb-2 p-2.5 text-xs rounded-lg border focus:ring-1 focus:outline-none transition ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                            />

                            <div className="max-h-52 overflow-y-auto space-y-2 p-2 border rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                {filteredPersonnelForModal.length === 0 ? (
                                    <div className="p-4 text-center text-xs opacity-50 font-bold">پرسنلی یافت نشد</div>
                                ) : (
                                    filteredPersonnelForModal.map((emp) => {
                                        const isSelected = selectedRecipientIds.includes(String(emp.id));
                                        return (
                                            <div 
                                                key={emp.id} 
                                                onClick={() => toggleRecipient(emp.id)}
                                                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition ${
                                                    isSelected 
                                                        ? 'bg-blue-100 border-blue-400 text-blue-900 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-200 font-black' 
                                                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                <div>
                                                    <div className="text-xs">{emp.name}</div>
                                                    <div className="text-[10px] opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-400'}`}>
                                                    {isSelected && <FaCheck size={10} />}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <button 
                                type="button" 
                                onClick={() => setIsSmsModalOpen(false)}
                                className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 text-xs font-bold"
                            >
                                انصراف
                            </button>
                            <button 
                                type="button" 
                                disabled={savingSettings}
                                onClick={handleSaveSmsSettings}
                                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-md disabled:opacity-50"
                            >
                                {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default SecretariatListScreen;