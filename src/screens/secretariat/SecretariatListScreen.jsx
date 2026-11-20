import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
    fetchLetters,
    fetchAllPersonnel,
    fetchLetterTypeSmsSettings,
    updateLetterTypeSmsSettings,
} from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import {
    BarsArrowDownIcon,
    BarsArrowUpIcon,
    CheckCircleIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClockIcon,
    Cog6ToothIcon,
    DocumentDuplicateIcon,
    DocumentTextIcon,
    ExclamationTriangleIcon,
    FolderIcon,
    InboxIcon,
    MagnifyingGlassIcon,
    PaperClipIcon,
    PlusIcon,
    ShieldExclamationIcon,
    TrashIcon,
    TruckIcon,
    XCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

import logo from '../../assets/ario.png';

const toPersianDigits = (value) =>
    String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const CornerBrackets = ({ accent = 'cyan', isDark = true }) => {
    const accentMap = {
        cyan: isDark ? 'border-sky-400/60' : 'border-sky-600/60',
        amber: isDark ? 'border-amber-400/60' : 'border-amber-600/60',
        emerald: isDark ? 'border-emerald-400/60' : 'border-emerald-600/60',
        danger: isDark ? 'border-red-400/60' : 'border-red-600/60',
    };
    const colorClass = accentMap[accent] || accentMap.cyan;

    return (
        <>
            <span aria-hidden="true" className={`pointer-events-none absolute top-0 start-0 w-2 h-2 border-t border-s ${colorClass}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute top-0 end-0 w-2 h-2 border-t border-e ${colorClass}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 start-0 w-2 h-2 border-b border-s ${colorClass}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 end-0 w-2 h-2 border-b border-e ${colorClass}`} />
        </>
    );
};

// کامپوننت هایلایت هوشمند بدون حساسیت به اعداد فارسی و انگلیسی
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
                    <mark key={i} className="bg-amber-300 text-slate-950 px-1 rounded-[1px] font-bold">
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

const renderFormattedNumber = (numStr, customClass = 'text-[13px]', highlight = null) => {
    if (!numStr) return null;
    const str = String(numStr);
    if (str.includes('/')) {
        const parts = str.split('/');
        return (
            <span className={`inline-flex items-center gap-[3px] font-mono font-bold tabular-nums ${customClass}`} dir="ltr">
                {parts.map((part, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && <span className="opacity-45 font-normal">/</span>}
                        <span>{highlight ? <HighlightedText text={part} highlight={highlight} /> : part}</span>
                    </React.Fragment>
                ))}
            </span>
        );
    }
    return (
        <span dir="ltr" className={`font-mono font-bold tabular-nums ${customClass}`}>
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

    const inputClass = `w-full h-10 ps-3 pe-8 text-xs sm:text-sm rounded-[2px] border focus:outline-none transition-colors duration-150 tracking-normal ${
        isDark
            ? 'bg-tactical-canvas border-slate-400/20 text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30'
            : 'bg-slate-50 border-slate-900/20 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600/25'
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
            <ChevronDownIcon className="w-4 h-4 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

            {isOpen && (
                <ul
                    className={`absolute z-30 w-full mt-1 max-h-60 overflow-y-auto rounded-[2px] border shadow-2xl ${
                        isDark
                            ? 'bg-tactical-surface1 border-slate-400/25 text-slate-100'
                            : 'bg-white border-slate-900/20 text-slate-900'
                    }`}
                >
                    <li
                        className={`px-3 py-2 cursor-pointer text-xs font-semibold tracking-normal border-b ${
                            isDark
                                ? 'border-slate-400/15 text-slate-400 hover:bg-tactical-hover hover:text-slate-100'
                                : 'border-slate-900/10 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                        onClick={() => {
                            onChange('');
                            setSearchTerm('');
                            setIsOpen(false);
                        }}
                    >
                        همه فرستنده‌های داخلی
                    </li>
                    {filtered.map((emp) => (
                        <li
                            key={emp.id}
                            className={`px-3 py-2 cursor-pointer text-xs border-b border-s-2 border-s-transparent transition-colors tracking-normal ${
                                isDark
                                    ? 'border-b-slate-400/10 hover:bg-tactical-hover hover:border-s-sky-400'
                                    : 'border-b-slate-900/10 hover:bg-slate-50 hover:border-s-sky-600'
                            }`}
                            onClick={() => {
                                onChange(emp.id.toString());
                                setSearchTerm(emp.position_title ? `${emp.name} (${emp.position_title})` : emp.name);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-bold">{emp.name}</div>
                            <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                {emp.position_title || 'بدون سمت'}
                            </div>
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="p-3 text-xs text-slate-500 text-center tracking-normal">موردی یافت نشد</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const DirectionalLogo = ({ type, status, isDark }) => {
    const isOutward = type === 'OUTGOING';
    const isInternal = type === 'INTERNAL';
    const isDocument = type === 'DOCUMENT';
    const isDeleted = status === 'DELETED';

    const theme = isDeleted
        ? isDark
            ? { bg: 'bg-red-500/10 grayscale', border: 'border-red-500/45', text: 'text-red-400' }
            : { bg: 'bg-red-50 grayscale', border: 'border-red-500/50', text: 'text-red-600' }
        : type === 'INCOMING'
        ? isDark
            ? { bg: 'bg-emerald-500/10', border: 'border-emerald-500/45', text: 'text-emerald-400' }
            : { bg: 'bg-emerald-50', border: 'border-emerald-600/45', text: 'text-emerald-700' }
        : type === 'OUTGOING'
        ? isDark
            ? { bg: 'bg-amber-500/10', border: 'border-amber-500/45', text: 'text-amber-400' }
            : { bg: 'bg-amber-50', border: 'border-amber-600/45', text: 'text-amber-700' }
        : type === 'DOCUMENT'
        ? isDark
            ? { bg: 'bg-slate-400/10', border: 'border-slate-400/35', text: 'text-slate-300' }
            : { bg: 'bg-slate-100', border: 'border-slate-500/40', text: 'text-slate-700' }
        : isDark
        ? { bg: 'bg-sky-400/10', border: 'border-sky-400/45', text: 'text-sky-400' }
        : { bg: 'bg-sky-50', border: 'border-sky-600/45', text: 'text-sky-700' };

    if (isInternal) {
        return (
            <div className={`relative w-11 h-11 shrink-0 flex items-center justify-center rounded-[2px] border transition-colors duration-200 ${theme.bg} ${theme.border} ${theme.text}`}>
                <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7" fill="none">
                    <path d="M4 14L18 4L32 14V30.5C32 31.33 31.33 32 30.5 32H5.5C4.67 32 4 31.33 4 30.5V14Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" fill="currentColor" fillOpacity="0.12" />
                    <circle cx="18" cy="16.2" r="2.9" fill="currentColor" />
                    <path d="M12.6 27.5C12.6 24.3 14.9 22 18 22C21.1 22 23.4 24.3 23.4 27.5" fill="currentColor" />
                    <circle cx="10.4" cy="18.4" r="2.2" fill="currentColor" fillOpacity="0.85" />
                    <path d="M6.8 27.5C6.8 25.1 8.3 23.4 10.4 23.4C11.3 23.4 12.1 23.7 12.7 24.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                    <circle cx="25.6" cy="18.4" r="2.2" fill="currentColor" fillOpacity="0.85" />
                    <path d="M29.2 27.5C29.2 25.1 27.7 23.4 25.6 23.4C24.7 23.4 23.9 23.7 23.3 24.1" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
                </svg>
            </div>
        );
    }

    if (isDocument) {
        return (
            <div className={`relative w-11 h-11 shrink-0 flex items-center justify-center rounded-[2px] border transition-colors duration-200 ${theme.bg} ${theme.border} ${theme.text}`}>
                <svg viewBox="0 0 36 36" className="w-6 h-6 sm:w-7 sm:h-7" fill="none">
                    <path d="M12 5H23L29 11V27C29 28.1 28.1 29 27 29H12C10.9 29 10 28.1 10 27V7C10 5.9 10.9 5 12 5Z" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <path d="M8 9H19L24 14V30C24 31.1 23.1 32 22 32H8C6.9 32 6 31.1 6 30V11C6 9.9 6.9 9 8 9Z" fill={isDark ? '#0B1017' : '#FFFFFF'} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                    <path d="M18.5 9V14.5H24" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                    <line x1="10" y1="19" x2="20" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="10" y1="23.5" x2="20" y2="23.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <line x1="10" y1="28" x2="16" y2="28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
        );
    }

    return (
        <div className={`relative w-11 h-11 shrink-0 flex items-center justify-center rounded-[2px] border transition-colors duration-200 ${theme.bg} ${theme.border}`}>
            <img src={logo} alt="لوگو" className="w-6 h-6 object-contain z-10 relative opacity-90" />
            <div className={`absolute inset-0 z-20 transition-transform duration-500 ease-in-out ${isOutward ? 'rotate-90' : 'rotate-0'}`}>
                {[0, 90, 180, 270].map((rotation, i) => (
                    <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            className={`transition-all duration-300 ${theme.text} -mt-2 ${!isOutward ? 'rotate-180' : 'rotate-0'}`}
                        >
                            <path d="M 12 23 Q 22 14, 12 3" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
                            <path d="M 6 9 L 12 3 L 18 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-40 12 3)" />
                        </svg>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getEffectiveLetterDate = (letter) => {
    if (!letter) return null;
    if (letter.status !== 'PENDING' && letter.original_date) {
        return letter.original_date;
    }
    if (letter.original_number && letter.original_date) {
        return letter.original_date;
    }
    return letter.created_at;
};

const SecretariatListScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const mode = useSelector((state) => state.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const { userInfo } = useSelector((state) => state.userLogin || {});
    const isBoardMember = Boolean(
        userInfo?.is_admin ||
            userInfo?.employee?.position?.hierarchy_level === 0 ||
            userInfo?.employee?.position?.code === 'MANAGING_COUNCIL'
    );

    const { letters: lettersData, loadingList, error, allPersonnel } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : lettersData?.results || [];
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

    // مقادیر ارسالی به بک‌اند دست‌نخورده می‌مانند؛ نمایش با ارقام فارسی انجام می‌شود
    const JALALI_YEARS = ['1401', '1402', '1403', '1404', '1405', '1406', '1407'];

    const handleFilterChange = (setter, value) => {
        setter(value);
        setPage(1);
    };

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 600);
        return () => {
            clearTimeout(handler);
        };
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
            ordering: ordering,
        };
        if (filterType === 'DELETED') {
            params.status = 'DELETED';
        } else {
            params.type = filterType;
        }
        dispatch(fetchLetters(params));
    }, [dispatch, filterType, debouncedSearch, page, selectedYear, senderFilter, ordering]);

    useEffect(() => {
        setIsSearchOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutsideSearch = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
                setIsSmsModalOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideSearch);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideSearch);
            document.removeEventListener('keydown', handleKeyDown);
        };
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
            await dispatch(
                updateLetterTypeSmsSettings({
                    type: filterType,
                    is_active: smsActive,
                    recipient_ids: selectedRecipientIds,
                })
            ).unwrap();
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
            setSelectedRecipientIds(selectedRecipientIds.filter((id) => id !== idStr));
        } else {
            setSelectedRecipientIds([...selectedRecipientIds, idStr]);
        }
    };

    const formatPersianDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getMonthName = (dateString) => {
        if (!dateString) return 'نامشخص';
        return new Date(dateString).toLocaleDateString('fa-IR', {
            month: 'long',
            year: 'numeric',
        });
    };

    const getFilterName = (type) => {
        switch (type) {
            case 'INCOMING':
                return 'مکاتبات وارده';
            case 'OUTGOING':
                return 'مکاتبات صادره';
            case 'INTERNAL':
                return 'مکاتبات داخلی';
            case 'DOCUMENT':
                return 'اسناد';
            case 'DELETED':
                return 'زباله‌دان (حذف‌شده‌ها)';
            default:
                return 'همه مکاتبات';
        }
    };

    const renderStatusBadge = (status, letterType) => {
        const base =
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold whitespace-nowrap tracking-normal';

        switch (status) {
            case 'REGISTERED':
                return (
                    <span
                        className={`${base} ${
                            isDark
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-600/35'
                        }`}
                    >
                        <CheckCircleIcon className="w-3 h-3 shrink-0" />
                        تکمیل شده
                    </span>
                );
            case 'ISSUED':
                return (
                    <span
                        className={`${base} ${
                            isDark
                                ? 'bg-sky-400/15 text-sky-300 border-sky-400/40'
                                : 'bg-sky-50 text-sky-800 border-sky-600/35'
                        }`}
                    >
                        <TruckIcon className="w-3 h-3 shrink-0" />
                        در دست پیک
                    </span>
                );
            case 'APPROVED':
                return letterType === 'INCOMING' ? (
                    <span
                        className={`${base} ${
                            isDark
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-600/35'
                        }`}
                    >
                        <FolderIcon className="w-3 h-3 shrink-0" />
                        بایگانی شده
                    </span>
                ) : (
                    <span
                        className={`${base} ${
                            isDark
                                ? 'bg-sky-400/15 text-sky-300 border-sky-400/40'
                                : 'bg-sky-50 text-sky-800 border-sky-600/35'
                        }`}
                    >
                        <DocumentTextIcon className="w-3 h-3 shrink-0" />
                        آماده صدور
                    </span>
                );
            case 'REJECTED':
                return (
                    <span
                        className={`${base} ${
                            isDark
                                ? 'bg-red-500/15 text-red-300 border-red-500/40'
                                : 'bg-red-50 text-red-700 border-red-600/35'
                        }`}
                    >
                        <XCircleIcon className="w-3 h-3 shrink-0" />
                        رد شده
                    </span>
                );
            case 'DELETED':
                return (
                    <span
                        className={`${base} ${
                            isDark
                                ? 'bg-red-950/60 text-red-300 border-red-500/50'
                                : 'bg-red-50 text-red-700 border-red-600/45'
                        }`}
                    >
                        <TrashIcon className="w-3 h-3 shrink-0" />
                        حذف شده
                    </span>
                );
            default:
                return (
                    <span
                        className={`${base} ${
                            isDark
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                                : 'bg-amber-50 text-amber-800 border-amber-600/35'
                        }`}
                    >
                        <ClockIcon className="w-3 h-3 shrink-0" />
                        در انتظار
                    </span>
                );
        }
    };

    const renderLetterTypeBadge = (letterType) => {
        const base =
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-normal whitespace-nowrap';

        if (letterType === 'INCOMING') {
            return (
                <span
                    className={`${base} ${
                        isDark
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-600/30'
                    }`}
                >
                    وارده
                </span>
            );
        }
        if (letterType === 'OUTGOING') {
            return (
                <span
                    className={`${base} ${
                        isDark
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-amber-50 text-amber-800 border-amber-600/30'
                    }`}
                >
                    صادره
                </span>
            );
        }
        if (letterType === 'DOCUMENT') {
            return (
                <span
                    className={`${base} ${
                        isDark
                            ? 'bg-slate-400/10 text-slate-300 border-slate-400/30'
                            : 'bg-slate-100 text-slate-700 border-slate-500/30'
                    }`}
                >
                    <DocumentDuplicateIcon className="w-3 h-3 shrink-0" />
                    اسناد
                </span>
            );
        }
        return (
            <span
                className={`${base} ${
                    isDark
                        ? 'bg-sky-400/10 text-sky-300 border-sky-400/30'
                        : 'bg-sky-50 text-sky-800 border-sky-600/30'
                }`}
            >
                داخلی
            </span>
        );
    };

    const filteredPersonnelForModal = (allPersonnel || []).filter(
        (p) =>
            p.name?.toLowerCase().includes(personnelSearch.toLowerCase()) ||
            (p.position_title && p.position_title.toLowerCase().includes(personnelSearch.toLowerCase()))
    );

    const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
    const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-tactical-lightSurface';
    const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated';
    const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

    return (
        <div
            className={`relative min-h-screen transition-colors duration-200 ${
                isDark
                    ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
                    : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
            }`}
        >
            {isDark && (
                <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 tactical-scanlines" />
            )}

            {/* نوار مسیر و وضعیت دبیرخانه (هم‌تراز با هدر) */}
            <div
                className={`relative z-10 border-b ${borderHairline} ${
                    isDark ? 'bg-tactical-surface1/95' : 'bg-white/95'
                } backdrop-blur-sm print:hidden`}
            >
                <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-10 flex items-center justify-between gap-3 text-[11px] tracking-normal">
                    <nav aria-label="مسیر صفحه" className="flex items-center gap-1.5 min-w-0 font-medium">
                        <Link
                            to="/"
                            className={`transition-colors ${
                                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
                            }`}
                        >
                            پایگاه اصلی
                        </Link>
                        <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className={textSecondary}>دبیرخانه کل</span>
                        <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className={`font-semibold truncate ${textPrimary}`}>{getFilterName(filterType)}</span>
                    </nav>

                    <span
                        className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[11px] font-medium tabular-nums shrink-0 ${
                            filterType === 'DELETED'
                                ? isDark
                                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                                    : 'border-red-600/35 bg-red-50 text-red-700'
                                : isDark
                                ? 'border-sky-400/30 bg-sky-400/10 text-sky-300'
                                : 'border-sky-600/30 bg-sky-50 text-sky-700'
                        }`}
                    >
                        مجموع مکاتبات: {toPersianDigits(totalCount)} مورد
                    </span>
                </div>
            </div>

            <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* سرصفحه اصلی واحد دبیرخانه */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div
                    className={`relative border rounded-[2px] ${surfacePanel} ${
                        filterType === 'DELETED'
                            ? isDark
                                ? 'border-red-500/40'
                                : 'border-red-600/35'
                            : borderHairline
                    }`}
                >
                    <CornerBrackets accent={filterType === 'DELETED' ? 'danger' : 'cyan'} isDark={isDark} />

                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`w-11 h-11 rounded-[2px] border flex items-center justify-center shrink-0 ${
                                    filterType === 'DELETED'
                                        ? isDark
                                            ? 'bg-red-500/10 border-red-500/45 text-red-400'
                                            : 'bg-red-50 border-red-600/40 text-red-700'
                                        : isDark
                                        ? 'bg-sky-400/10 border-sky-400/40 text-sky-400'
                                        : 'bg-sky-50 border-sky-600/35 text-sky-700'
                                }`}
                            >
                                {filterType === 'DELETED' ? (
                                    <TrashIcon className="w-5 h-5" />
                                ) : (
                                    <InboxIcon className="w-5 h-5" />
                                )}
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className={`text-lg sm:text-xl font-bold tracking-normal ${textPrimary}`}>
                                        {filterType === 'DELETED' ? 'زباله‌دان دبیرخانه' : 'دبیرخانه کل'}
                                    </h1>
                                    <span
                                        className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-medium tracking-normal ${
                                            isDark
                                                ? 'border-slate-400/20 bg-tactical-surface2 text-slate-400'
                                                : 'border-slate-900/15 bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        ثبت و پیگیری مکاتبات اداری
                                    </span>
                                </div>
                                <p className={`text-xs mt-1 tabular-nums tracking-normal ${textSecondary}`}>
                                    تعداد موارد (با احتساب فیلتر):{' '}
                                    <strong className={textPrimary}>{toPersianDigits(totalCount)}</strong> مورد
                                </p>
                            </div>
                        </div>

                        <Link
                            to="/secretariat/create"
                            className={`w-full sm:w-auto h-10 px-5 rounded-[2px] inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-normal transition-colors duration-150 ${
                                isDark
                                    ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                    : 'bg-sky-600 hover:bg-sky-700 text-white'
                            }`}
                        >
                            <PlusIcon className="w-4 h-4 shrink-0" />
                            <span>ثبت نامه / سند جدید</span>
                        </Link>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* کنسول فیلتر، جستجوی هوشمند و مرتب‌سازی */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className={`relative border rounded-[2px] ${surfacePanel} ${borderHairline}`}>
                    <CornerBrackets accent="cyan" isDark={isDark} />

                    <div
                        className={`flex items-center justify-between px-3.5 py-2 border-b ${borderHairline} ${surfaceHeader} text-[11px] tracking-normal`}
                    >
                        <span className={`font-semibold ${textPrimary}`}>فیلترها و جستجوی پیشرفته مکاتبات</span>
                        <span className={textSecondary}>واحد جستجوی هوشمند</span>
                    </div>

                    <div className="p-3.5 sm:p-4 space-y-3.5">
                        {/* ردیف اول: تب‌های نوع مکاتبه + فیلتر فرستنده + جستجوی زنده */}
                        <div className="flex flex-col xl:flex-row gap-3 justify-between items-stretch xl:items-center">
                            <div
                                className="flex items-center gap-1.5 overflow-x-auto w-full xl:w-auto pb-1.5 xl:pb-0 touch-pan-x min-w-0 no-scrollbar"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                {[
                                    { label: 'همه مکاتبات', value: '' },
                                    { label: 'وارده', value: 'INCOMING' },
                                    { label: 'صادره', value: 'OUTGOING' },
                                    { label: 'داخلی', value: 'INTERNAL' },
                                    { label: 'اسناد', value: 'DOCUMENT', icon: DocumentDuplicateIcon },
                                    { label: 'زباله‌دان', value: 'DELETED', isTrash: true, icon: TrashIcon },
                                ].map((tab) => {
                                    const isActiveTab = filterType === tab.value;
                                    const TabIcon = tab.icon;

                                    let tabStyle = isDark
                                        ? 'bg-tactical-surface2/70 border-slate-400/15 text-slate-300 hover:bg-tactical-hover hover:text-slate-100'
                                        : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100 hover:text-slate-950';

                                    if (isActiveTab) {
                                        if (tab.isTrash) {
                                            tabStyle = isDark
                                                ? 'bg-red-500/20 border-red-400/60 text-red-300'
                                                : 'bg-red-600 border-red-700 text-white';
                                        } else {
                                            tabStyle = isDark
                                                ? 'bg-sky-400/15 border-sky-400/60 text-sky-300'
                                                : 'bg-sky-600 border-sky-700 text-white';
                                        }
                                    }

                                    return (
                                        <button
                                            key={tab.value}
                                            type="button"
                                            onClick={() => handleFilterChange(setFilterType, tab.value)}
                                            className={`h-9 px-3 rounded-[2px] border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors duration-150 whitespace-nowrap shrink-0 tracking-normal ${tabStyle}`}
                                        >
                                            {TabIcon && <TabIcon className="w-3.5 h-3.5 shrink-0" />}
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}

                                {isBoardMember && filterType && filterType !== 'DELETED' && (
                                    <button
                                        type="button"
                                        disabled={loadingSettings}
                                        onClick={handleOpenSmsSettings}
                                        className={`h-9 inline-flex items-center gap-1.5 px-3 rounded-[2px] text-xs font-semibold transition-colors border whitespace-nowrap shrink-0 tracking-normal ${
                                            isDark
                                                ? 'border-amber-400/45 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                                                : 'border-amber-600/40 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                        }`}
                                        title="تنظیمات ارسال پیامک برای این نوع مکاتبه"
                                    >
                                        <Cog6ToothIcon className={`w-4 h-4 shrink-0 ${loadingSettings ? 'animate-spin' : ''}`} />
                                        <span>تنظیمات پیامک</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-2.5">
                                <SearchablePersonnelSelect
                                    personnel={allPersonnel}
                                    value={senderFilter}
                                    onChange={(val) => handleFilterChange(setSenderFilter, val)}
                                    placeholder="فیلتر فرستنده داخلی..."
                                    isDark={isDark}
                                />

                                <div className="relative w-full sm:w-72 md:w-80" ref={searchWrapperRef}>
                                    <input
                                        type="text"
                                        placeholder="جستجو (موضوع، متن، شماره)..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            handleFilterChange(setSearchQuery, e.target.value);
                                            setIsSearchOpen(true);
                                        }}
                                        onFocus={() => setIsSearchOpen(true)}
                                        className={`w-full h-10 pe-9 ps-3 rounded-[2px] border text-xs sm:text-sm font-medium focus:outline-none transition-colors tracking-normal ${
                                            isDark
                                                ? 'bg-tactical-canvas border-slate-400/20 text-slate-100 placeholder-slate-500 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/30'
                                                : 'bg-slate-50 border-slate-900/20 text-slate-900 placeholder-slate-400 focus:border-sky-600 focus:ring-1 focus:ring-sky-600/25'
                                        }`}
                                    />
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                                    {searchQuery && isSearchOpen && (
                                        <div
                                            className={`absolute top-full mt-1.5 start-0 sm:start-auto sm:end-0 w-full sm:w-[480px] max-w-[94vw] max-h-[460px] overflow-y-auto rounded-[2px] border shadow-2xl z-50 p-3 ${
                                                isDark
                                                    ? 'bg-tactical-surface1 border-sky-400/35'
                                                    : 'bg-slate-100 border-slate-900/25'
                                            }`}
                                        >
                                            <div
                                                className={`flex items-center justify-between pb-2 mb-2.5 border-b text-[11px] font-semibold tracking-normal ${
                                                    isDark ? 'border-slate-400/15 text-sky-300' : 'border-slate-900/15 text-sky-800'
                                                }`}
                                            >
                                                <span>نتایج جستجوی زنده</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSearchOpen(false)}
                                                    className="text-slate-400 hover:text-red-400"
                                                    aria-label="بستن نتایج جستجو"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {loadingList ? (
                                                <div className="p-4 text-center text-xs text-slate-400 font-semibold tracking-normal">
                                                    در حال جستجو در بایگانی...
                                                </div>
                                            ) : lettersList.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-slate-400 font-semibold tracking-normal">
                                                    نتیجه‌ای یافت نشد
                                                </div>
                                            ) : (
                                                lettersList.map((letter) => {
                                                    const escaped = searchQuery
                                                        .toString()
                                                        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                                    const fuzzyStr = escaped.replace(/[0-9۰-۹]/g, (match) => {
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
                                                    if (checkMatch(letter.subject))
                                                        matches.push({ label: 'موضوع', text: letter.subject });
                                                    if (checkMatch(letter.indicator_number))
                                                        matches.push({ label: 'شماره سیستمی', text: letter.indicator_number });
                                                    if (checkMatch(letter.original_number))
                                                        matches.push({ label: 'شماره فیزیکی', text: letter.original_number });
                                                    if (checkMatch(letter.contract_number))
                                                        matches.push({ label: 'شماره قرارداد', text: letter.contract_number });
                                                    if (checkMatch(letter.final_sender_name))
                                                        matches.push({ label: 'فرستنده', text: letter.final_sender_name });
                                                    if (checkMatch(letter.final_receiver_name))
                                                        matches.push({ label: 'گیرنده', text: letter.final_receiver_name });
                                                    if (checkMatch(letter.manual_sender_name))
                                                        matches.push({ label: 'فرستنده دستی', text: letter.manual_sender_name });
                                                    if (checkMatch(letter.manual_receiver_name))
                                                        matches.push({ label: 'گیرنده دستی', text: letter.manual_receiver_name });

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
                                                                <mark className="bg-amber-300 text-slate-950 px-1 mx-1 font-bold rounded-[1px]">
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
                                                            className="relative bg-white text-slate-900 p-3.5 mb-2.5 last:mb-0 rounded-[2px] border border-slate-300 hover:border-sky-600 cursor-pointer transition-colors duration-150"
                                                            style={{
                                                                minHeight: '150px',
                                                                backgroundImage: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
                                                            }}
                                                        >
                                                            <div className="flex justify-between items-start border-b border-slate-300 pb-2 mb-2.5">
                                                                <div className="w-1/4 flex flex-col items-center justify-center opacity-25">
                                                                    <InboxIcon className="w-5 h-5" />
                                                                </div>
                                                                <div className="w-2/4 text-center font-bold text-xs sm:text-sm pt-0.5 tracking-normal">
                                                                    بسمه تعالی
                                                                </div>
                                                                <div className="w-1/4 text-left text-[10px] font-bold leading-relaxed">
                                                                    <div className="whitespace-nowrap flex items-center justify-end gap-1">
                                                                        <span className="opacity-70">ش:</span>
                                                                        {renderFormattedNumber(
                                                                            letter.indicator_number,
                                                                            'text-[10px]',
                                                                            searchQuery
                                                                        )}
                                                                    </div>
                                                                    {letter.original_number && (
                                                                        <div className="whitespace-nowrap flex items-center justify-end gap-1">
                                                                            <span className="opacity-70">ف:</span>
                                                                            {renderFormattedNumber(
                                                                                letter.original_number,
                                                                                'text-[10px]',
                                                                                searchQuery
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className="tabular-nums">
                                                                        ت: {new Date(letter.created_at).toLocaleDateString('fa-IR')}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-[11px] space-y-1.5 font-semibold mb-2 tracking-normal">
                                                                {matches.map((m, idx) => (
                                                                    <div key={idx} className="flex gap-1.5 border-b border-slate-100 pb-1">
                                                                        <span className="opacity-65 min-w-[74px] shrink-0">{m.label}:</span>
                                                                        <span className="flex-1 leading-tight">
                                                                            {['شماره سیستمی', 'شماره فیزیکی', 'شماره قرارداد'].includes(m.label)
                                                                                ? renderFormattedNumber(m.text, 'text-[11px]', searchQuery)
                                                                                : <HighlightedText text={m.text} highlight={searchQuery} />}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {bodySnippet && (
                                                                <div className="mt-2.5 text-[10px] leading-6 text-justify text-slate-800 bg-slate-50 p-2 rounded-[2px] border border-slate-200 border-dashed relative tracking-normal">
                                                                    <span className="absolute -top-2.5 right-2 bg-slate-50 px-1 text-[9px] font-bold text-slate-500">
                                                                        متن نامه
                                                                    </span>
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

                        {/* ردیف دوم: سال بایگانی و ترتیب نمایش */}
                        <div className={`pt-3 border-t ${borderHairline}`}>
                            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between w-full min-w-0">
                                <div className="flex items-center gap-2 min-w-0 w-full md:w-auto">
                                    <span className={`text-xs font-semibold whitespace-nowrap shrink-0 tracking-normal ${textSecondary}`}>
                                        سال بایگانی:
                                    </span>
                                    <div
                                        className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 w-full min-w-0 touch-pan-x no-scrollbar"
                                        style={{ scrollbarWidth: 'none' }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => handleFilterChange(setSelectedYear, '')}
                                            className={`h-8 px-3 rounded-[2px] border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tracking-normal ${
                                                !selectedYear
                                                    ? isDark
                                                        ? 'bg-sky-400/15 border-sky-400/60 text-sky-300'
                                                        : 'bg-sky-600 border-sky-700 text-white'
                                                    : isDark
                                                    ? 'bg-tactical-surface2/70 border-slate-400/15 text-slate-300 hover:bg-tactical-hover'
                                                    : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            همه سال‌ها
                                        </button>
                                        {JALALI_YEARS.map((yr) => (
                                            <button
                                                key={yr}
                                                type="button"
                                                onClick={() => handleFilterChange(setSelectedYear, yr)}
                                                className={`h-8 px-3 rounded-[2px] border text-xs font-semibold tabular-nums transition-colors whitespace-nowrap shrink-0 tracking-normal ${
                                                    selectedYear === yr
                                                        ? isDark
                                                            ? 'bg-sky-400/15 border-sky-400/60 text-sky-300'
                                                            : 'bg-sky-600 border-sky-700 text-white'
                                                        : isDark
                                                        ? 'bg-tactical-surface2/70 border-slate-400/15 text-slate-300 hover:bg-tactical-hover'
                                                        : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
                                                }`}
                                            >
                                                {toPersianDigits(yr)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 md:border-s md:ps-3 ${borderHairline} shrink-0 self-end md:self-auto`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange(setOrdering, 'desc')}
                                        className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-[2px] border text-xs font-semibold transition-colors tracking-normal ${
                                            ordering === 'desc'
                                                ? isDark
                                                    ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300'
                                                    : 'bg-emerald-600 border-emerald-700 text-white'
                                                : isDark
                                                ? 'bg-tactical-surface2/70 border-slate-400/15 text-slate-300 hover:bg-tactical-hover'
                                                : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <BarsArrowDownIcon className="w-3.5 h-3.5 shrink-0" />
                                        <span>جدید به قدیم</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleFilterChange(setOrdering, 'asc')}
                                        className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-[2px] border text-xs font-semibold transition-colors tracking-normal ${
                                            ordering === 'asc'
                                                ? isDark
                                                    ? 'bg-emerald-500/15 border-emerald-400/60 text-emerald-300'
                                                    : 'bg-emerald-600 border-emerald-700 text-white'
                                                : isDark
                                                ? 'bg-tactical-surface2/70 border-slate-400/15 text-slate-300 hover:bg-tactical-hover'
                                                : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <BarsArrowUpIcon className="w-3.5 h-3.5 shrink-0" />
                                        <span>قدیم به جدید</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* وضعیت بارگذاری، خطا، خالی یا جدول پرونده‌های مکاتبات */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {loadingList ? (
                    <div className={`relative border rounded-[2px] overflow-hidden ${surfacePanel} ${borderHairline}`}>
                        <div className={`h-0.5 w-full ${isDark ? 'bg-sky-400/20' : 'bg-sky-600/20'} overflow-hidden`}>
                            <div
                                className={`h-full w-1/2 animate-shimmer ${
                                    isDark
                                        ? 'bg-gradient-to-r from-transparent via-sky-400 to-transparent'
                                        : 'bg-gradient-to-r from-transparent via-sky-600 to-transparent'
                                }`}
                                style={{ backgroundSize: '200% 100%' }}
                            />
                        </div>
                        <div className="p-4 space-y-2.5">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div
                                    key={item}
                                    className={`h-14 rounded-[2px] border animate-pulse ${
                                        isDark
                                            ? 'bg-tactical-surface2/60 border-slate-400/10'
                                            : 'bg-slate-100 border-slate-900/10'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div
                        className={`p-4 rounded-[2px] border text-xs sm:text-sm font-semibold flex items-center gap-2.5 tracking-normal ${
                            isDark
                                ? 'bg-red-500/10 border-red-500/45 text-red-300'
                                : 'bg-red-50 border-red-600/35 text-red-700'
                        }`}
                    >
                        <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                        <span>{typeof error === 'string' ? error : error?.detail || 'خطا در دریافت اطلاعات دبیرخانه'}</span>
                    </div>
                ) : lettersList?.length === 0 ? (
                    <div
                        className={`relative text-center py-20 px-4 rounded-[2px] border ${surfacePanel} ${borderHairline}`}
                    >
                        <CornerBrackets accent="cyan" isDark={isDark} />
                        <InboxIcon className="w-12 h-12 mx-auto mb-3 opacity-25" />
                        <h3 className={`text-base font-bold mb-1 tracking-normal ${textPrimary}`}>
                            {filterType === 'DELETED' ? 'زباله‌دان خالی است' : 'هیچ مکاتبه‌ای یافت نشد'}
                        </h3>
                        <p className={`text-xs tracking-normal ${textSecondary}`}>
                            با تغییر فیلترها یا عبارات جستجو مجدداً بررسی نمایید.
                        </p>
                    </div>
                ) : (
                    <div className={`relative rounded-[2px] border overflow-hidden ${surfacePanel} ${borderHairline}`}>
                        <CornerBrackets accent={filterType === 'DELETED' ? 'danger' : 'cyan'} isDark={isDark} />

                        {/* نمای موبایل (کارت‌های مستقل و یکی‌درمیان) */}
                        <div
                            className={`md:hidden p-2.5 space-y-2.5 ${
                                isDark ? 'bg-tactical-canvas/60' : 'bg-slate-200/50'
                            }`}
                        >
                            {lettersList.map((letter, index) => {
                                const currentMonth = getMonthName(getEffectiveLetterDate(letter));
                                const previousMonth =
                                    index > 0 ? getMonthName(getEffectiveLetterDate(lettersList[index - 1])) : null;
                                const showDivider = currentMonth !== previousMonth;
                                const isDeletedLetter = letter.status === 'DELETED';
                                const isEven = index % 2 === 0;

                                const mobileCardBg = isDeletedLetter
                                    ? isDark
                                        ? 'bg-red-950/25 border-red-500/40 border-s-red-500'
                                        : 'bg-red-50/70 border-red-400/50 border-s-red-600'
                                    : isEven
                                    ? isDark
                                        ? 'bg-tactical-surface1 border-slate-400/20 border-s-sky-400/60 hover:bg-tactical-hover'
                                        : 'bg-white border-slate-900/15 border-s-sky-600/65 hover:bg-sky-50/40'
                                    : isDark
                                    ? 'bg-tactical-surface2 border-slate-400/25 border-s-amber-400/60 hover:bg-tactical-hover'
                                    : 'bg-slate-50 border-slate-900/20 border-s-amber-600/65 hover:bg-sky-50/40';

                                return (
                                    <React.Fragment key={letter.id}>
                                        {showDivider && (
                                            <div className="pt-1 pb-0.5 px-1 flex items-center gap-2.5">
                                                <span
                                                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-[2px] border tracking-normal ${
                                                        isDark
                                                            ? 'bg-sky-400/10 border-sky-400/35 text-sky-300'
                                                            : 'bg-white border-sky-600/35 text-sky-800'
                                                    }`}
                                                >
                                                    {currentMonth}
                                                </span>
                                                <div className={`flex-1 h-px ${isDark ? 'bg-slate-400/20' : 'bg-slate-900/20'}`} />
                                            </div>
                                        )}

                                        <div
                                            onClick={() => navigate(`/secretariat/${letter.id}`)}
                                            className={`p-3.5 space-y-3 rounded-[2px] border border-s-[3px] cursor-pointer transition-colors duration-150 ${mobileCardBg}`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <DirectionalLogo
                                                        type={letter.letter_type}
                                                        status={letter.status}
                                                        isDark={isDark}
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <div
                                                            className={`${
                                                                isDeletedLetter
                                                                    ? 'line-through text-red-400'
                                                                    : isDark
                                                                    ? 'text-sky-400'
                                                                    : 'text-sky-700'
                                                            }`}
                                                        >
                                                            {renderFormattedNumber(letter.indicator_number, 'text-xs sm:text-sm')}
                                                        </div>
                                                        <span className={`text-[10px] font-medium tabular-nums tracking-normal ${textSecondary}`}>
                                                            ردیف {toPersianDigits((page - 1) * 12 + index + 1)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    {renderStatusBadge(letter.status, letter.letter_type)}
                                                    {renderLetterTypeBadge(letter.letter_type)}
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex items-start gap-1.5">
                                                    <span
                                                        className={`font-bold text-xs sm:text-sm leading-6 tracking-normal ${
                                                            isDeletedLetter ? 'line-through opacity-70' : ''
                                                        } ${textPrimary}`}
                                                    >
                                                        {letter.subject}
                                                    </span>
                                                    {letter.attachments?.length > 0 && (
                                                        <PaperClipIcon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                                                    )}
                                                </div>

                                                {(letter.urgency !== 'NORMAL' || letter.confidentiality !== 'NORMAL') && (
                                                    <div className="flex gap-1.5 mt-2">
                                                        {letter.urgency !== 'NORMAL' && (
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] border tracking-normal ${
                                                                    isDark
                                                                        ? 'bg-red-500/15 text-red-300 border-red-500/35'
                                                                        : 'bg-red-50 text-red-700 border-red-600/30'
                                                                }`}
                                                            >
                                                                <ExclamationTriangleIcon className="w-3 h-3" />
                                                                {letter.urgency === 'URGENT' ? 'فوری' : 'خیلی فوری'}
                                                            </span>
                                                        )}
                                                        {letter.confidentiality !== 'NORMAL' && (
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] border tracking-normal ${
                                                                    isDark
                                                                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                                                                        : 'bg-amber-50 text-amber-800 border-amber-600/30'
                                                                }`}
                                                            >
                                                                <ShieldExclamationIcon className="w-3 h-3" />
                                                                {letter.confidentiality === 'CONFIDENTIAL' ? 'محرمانه' : 'سری'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${borderHairline} text-xs`}>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-[10px] font-medium tracking-normal ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                                                        فرستنده:
                                                    </span>
                                                    <span className={`text-[11px] font-semibold truncate tracking-normal ${textPrimary}`}>
                                                        {letter.final_sender_name || '-'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-[10px] font-medium tracking-normal ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                                        گیرنده:
                                                    </span>
                                                    <span className={`text-[11px] font-semibold truncate tracking-normal ${textPrimary}`}>
                                                        {letter.final_receiver_name || '-'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* کادر منظم شماره‌ها و تاریخ‌های این نامه در موبایل */}
                                            <div
                                                className={`p-2 rounded-[2px] border space-y-1 text-[10px] tracking-normal ${
                                                    isDark
                                                        ? 'bg-tactical-canvas/75 border-slate-400/15'
                                                        : isEven
                                                        ? 'bg-slate-50 border-slate-900/10'
                                                        : 'bg-white border-slate-900/10'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 ${textSecondary}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                                        ثبت نگارنده
                                                    </span>
                                                    <span className={`font-semibold tabular-nums ${textPrimary}`}>
                                                        {formatPersianDate(letter.created_at)}
                                                    </span>
                                                </div>

                                                {letter.original_date && (
                                                    <div className={`flex items-center justify-between gap-2 pt-1 border-t ${borderHairline}`}>
                                                        <span className={`inline-flex items-center gap-1.5 ${textSecondary}`}>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                                            تاریخ نامه
                                                        </span>
                                                        <span className={`font-semibold tabular-nums ${textPrimary}`}>
                                                            {formatPersianDate(letter.original_date)}
                                                        </span>
                                                    </div>
                                                )}

                                                {letter.original_number && (
                                                    <div className={`flex items-center justify-between gap-2 pt-1 border-t ${borderHairline}`}>
                                                        <span className={textSecondary}>
                                                            {letter.letter_type === 'INCOMING' ? 'شماره نامه:' : 'شماره فیزیکی:'}
                                                        </span>
                                                        {renderFormattedNumber(letter.original_number, 'text-[10px]')}
                                                    </div>
                                                )}

                                                {letter.destination_indicator && (
                                                    <div
                                                        className={`flex items-center justify-between gap-2 pt-1 border-t ${borderHairline} font-semibold ${
                                                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                                                        }`}
                                                    >
                                                        <span>
                                                            {letter.letter_type === 'INCOMING'
                                                                ? 'ثبت دبیرخانه آریو:'
                                                                : 'ثبت مقصد:'}
                                                        </span>
                                                        {renderFormattedNumber(
                                                            letter.destination_indicator,
                                                            `text-[10px] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {/* نمای جدول دسکتاپ (ردیف‌های یکی‌درمیان + کادر مستقل تاریخ هر نامه) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-right text-sm border-collapse">
                                <thead
                                    className={`text-xs font-bold tracking-normal border-b-2 ${
                                        isDark
                                            ? 'bg-tactical-surface2 border-slate-400/25 text-slate-300'
                                            : 'bg-tactical-lightElevated border-slate-900/20 text-slate-700'
                                    }`}
                                >
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center">ردیف</th>
                                        <th className="px-4 py-3 w-48">شماره‌ها</th>
                                        <th className="px-4 py-3 w-32">نوع / وضعیت</th>
                                        <th className="px-4 py-3 max-w-md">موضوع و مشخصات</th>
                                        <th className="px-4 py-3 w-40">مبدأ / مقصد</th>
                                        <th className="px-4 py-3 w-60">تاریخ‌های نامه</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lettersList.map((letter, index) => {
                                        const currentMonth = getMonthName(getEffectiveLetterDate(letter));
                                        const previousMonth =
                                            index > 0 ? getMonthName(getEffectiveLetterDate(lettersList[index - 1])) : null;
                                        const showDivider = currentMonth !== previousMonth;
                                        const isDeletedLetter = letter.status === 'DELETED';
                                        const isEven = index % 2 === 0;

                                        const rowClass = isDeletedLetter
                                            ? isDark
                                                ? 'bg-red-950/25 hover:bg-red-950/40 border-b-2 border-red-500/30'
                                                : 'bg-red-50/50 hover:bg-red-50 border-b-2 border-red-200'
                                            : isEven
                                            ? isDark
                                                ? 'bg-tactical-surface1 hover:bg-tactical-hover border-b-2 border-tactical-canvas'
                                                : 'bg-white hover:bg-sky-50/50 border-b-2 border-slate-200'
                                            : isDark
                                            ? 'bg-tactical-surface2/90 hover:bg-tactical-hover border-b-2 border-tactical-canvas'
                                            : 'bg-slate-100/75 hover:bg-sky-50/50 border-b-2 border-slate-200';

                                        const startStripClass = isDeletedLetter
                                            ? 'border-s-[3px] border-s-red-500/70'
                                            : isEven
                                            ? isDark
                                                ? 'border-s-[3px] border-s-sky-400/40 group-hover:border-s-sky-400'
                                                : 'border-s-[3px] border-s-sky-600/40 group-hover:border-s-sky-600'
                                            : isDark
                                            ? 'border-s-[3px] border-s-amber-400/40 group-hover:border-s-sky-400'
                                            : 'border-s-[3px] border-s-amber-600/45 group-hover:border-s-sky-600';

                                        const dateBoxClass = isDark
                                            ? 'bg-tactical-canvas/80 border-slate-400/20'
                                            : isEven
                                            ? 'bg-slate-50 border-slate-900/15'
                                            : 'bg-white border-slate-900/15';

                                        return (
                                            <React.Fragment key={letter.id}>
                                                {showDivider && (
                                                    <tr
                                                        className={`border-b-2 ${
                                                            isDark
                                                                ? 'bg-tactical-canvas border-sky-400/20'
                                                                : 'bg-slate-200/70 border-sky-600/25'
                                                        }`}
                                                    >
                                                        <td colSpan="6" className="px-4 py-2">
                                                            <div className="flex items-center gap-3">
                                                                <span
                                                                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-[2px] border tracking-normal ${
                                                                        isDark
                                                                            ? 'bg-sky-400/10 border-sky-400/35 text-sky-300'
                                                                            : 'bg-white border-sky-600/35 text-sky-800'
                                                                    }`}
                                                                >
                                                                    {currentMonth}
                                                                </span>
                                                                <div
                                                                    className={`flex-1 h-px ${
                                                                        isDark ? 'bg-slate-400/20' : 'bg-slate-900/20'
                                                                    }`}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                                <tr
                                                    onClick={() => navigate(`/secretariat/${letter.id}`)}
                                                    className={`cursor-pointer group transition-colors duration-150 ${rowClass}`}
                                                >
                                                    <td
                                                        className={`px-4 py-3.5 align-top whitespace-nowrap text-center transition-colors ${startStripClass}`}
                                                    >
                                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                                            <span
                                                                className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-bold tabular-nums ${
                                                                    isDark
                                                                        ? isEven
                                                                            ? 'bg-sky-400/10 text-sky-300'
                                                                            : 'bg-amber-400/10 text-amber-300'
                                                                        : isEven
                                                                        ? 'bg-sky-100/80 text-sky-800'
                                                                        : 'bg-amber-100/80 text-amber-800'
                                                                }`}
                                                            >
                                                                {toPersianDigits((page - 1) * 12 + index + 1)}
                                                            </span>
                                                            <DirectionalLogo
                                                                type={letter.letter_type}
                                                                status={letter.status}
                                                                isDark={isDark}
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                                                        <div className="flex flex-col gap-2">
                                                            <div className="flex flex-col">
                                                                <span className={`text-[10px] font-medium mb-0.5 tracking-normal ${textSecondary}`}>
                                                                    سیستمی:
                                                                </span>
                                                                <div
                                                                    className={`${
                                                                        isDeletedLetter
                                                                            ? 'line-through text-red-400'
                                                                            : isDark
                                                                            ? 'text-sky-400'
                                                                            : 'text-sky-700'
                                                                    }`}
                                                                >
                                                                    {renderFormattedNumber(letter.indicator_number, 'text-[13px]')}
                                                                </div>
                                                            </div>

                                                            {letter.original_number && (
                                                                <div className={`flex flex-col border-t ${borderHairline} pt-1.5`}>
                                                                    <span className={`text-[10px] font-medium mb-0.5 tracking-normal ${textSecondary}`}>
                                                                        شماره نامه:
                                                                    </span>
                                                                    <div className={`text-right ${textPrimary}`}>
                                                                        {renderFormattedNumber(letter.original_number, 'text-[11px]')}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {letter.destination_indicator && (
                                                                <div className={`flex flex-col border-t ${borderHairline} pt-1.5`}>
                                                                    <span
                                                                        className={`text-[10px] font-medium mb-0.5 tracking-normal ${
                                                                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                                                                        }`}
                                                                    >
                                                                        {letter.letter_type === 'INCOMING'
                                                                            ? 'ثبت در دبیرخانه آریو بنیان توس:'
                                                                            : 'ثبت مقصد:'}
                                                                    </span>
                                                                    <div
                                                                        className={`text-right ${
                                                                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                                                                        }`}
                                                                    >
                                                                        {renderFormattedNumber(
                                                                            letter.destination_indicator,
                                                                            `text-[11px] ${
                                                                                isDark ? 'text-emerald-400' : 'text-emerald-700'
                                                                            }`
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                                                        <div className="flex flex-col gap-1.5 items-start">
                                                            {renderLetterTypeBadge(letter.letter_type)}
                                                            {renderStatusBadge(letter.status, letter.letter_type)}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 align-top max-w-xs md:max-w-md">
                                                        <div className="flex items-start gap-2 mb-1">
                                                            <span
                                                                className={`font-bold text-[13px] leading-6 tracking-normal ${
                                                                    isDeletedLetter ? 'line-through opacity-70' : ''
                                                                } ${textPrimary}`}
                                                                title={letter.subject}
                                                            >
                                                                {letter.subject}
                                                            </span>
                                                            {letter.attachments?.length > 0 && (
                                                                <PaperClipIcon
                                                                    className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1"
                                                                    title="دارای پیوست"
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex gap-1.5 mt-2">
                                                            {letter.urgency !== 'NORMAL' && (
                                                                <span
                                                                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] border tracking-normal ${
                                                                        isDark
                                                                            ? 'bg-red-500/15 text-red-300 border-red-500/35'
                                                                            : 'bg-red-50 text-red-700 border-red-600/30'
                                                                    }`}
                                                                >
                                                                    <ExclamationTriangleIcon className="w-3 h-3" />
                                                                    {letter.urgency === 'URGENT' ? 'فوری' : 'خیلی فوری'}
                                                                </span>
                                                            )}
                                                            {letter.confidentiality !== 'NORMAL' && (
                                                                <span
                                                                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] border tracking-normal ${
                                                                        isDark
                                                                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                                                                            : 'bg-amber-50 text-amber-800 border-amber-600/30'
                                                                    }`}
                                                                >
                                                                    <ShieldExclamationIcon className="w-3 h-3" />
                                                                    {letter.confidentiality === 'CONFIDENTIAL' ? 'محرمانه' : 'سری'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="px-4 py-3.5 align-top">
                                                        <div className="flex flex-col gap-2 max-w-[165px]">
                                                            <div className={`flex flex-col border-b ${borderHairline} pb-1.5`}>
                                                                <span
                                                                    className={`text-[10px] font-medium mb-0.5 tracking-normal ${
                                                                        isDark ? 'text-sky-400' : 'text-sky-700'
                                                                    }`}
                                                                >
                                                                    از (فرستنده):
                                                                </span>
                                                                <span className={`text-xs font-semibold truncate tracking-normal ${textPrimary}`}>
                                                                    {letter.final_sender_name}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col pt-0.5">
                                                                <span
                                                                    className={`text-[10px] font-medium mb-0.5 tracking-normal ${
                                                                        isDark ? 'text-amber-400' : 'text-amber-700'
                                                                    }`}
                                                                >
                                                                    به (گیرنده):
                                                                </span>
                                                                <span className={`text-xs font-semibold truncate tracking-normal ${textPrimary}`}>
                                                                    {letter.final_receiver_name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* کادر مستقل و تک‌خطی تاریخ‌های همین نامه */}
                                                    <td className="px-4 py-3 align-top whitespace-nowrap">
                                                        <div
                                                            className={`rounded-[2px] border px-2.5 py-1.5 divide-y ${dateBoxClass} ${
                                                                isDark ? 'divide-slate-400/10' : 'divide-slate-900/10'
                                                            }`}
                                                        >
                                                            <div
                                                                className="flex items-center justify-between gap-3 py-1"
                                                                title="تاریخ ثبت نگارنده"
                                                            >
                                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium tracking-normal ${textSecondary}`}>
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                                                                    ثبت نگارنده
                                                                </span>
                                                                <span className={`text-[11px] font-semibold tabular-nums ${textPrimary}`}>
                                                                    {formatPersianDate(letter.created_at)}
                                                                </span>
                                                            </div>

                                                            {letter.original_date && (
                                                                <div
                                                                    className="flex items-center justify-between gap-3 py-1"
                                                                    title="تاریخ چاپ روی نامه"
                                                                >
                                                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium tracking-normal ${textSecondary}`}>
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                                                        تاریخ نامه
                                                                    </span>
                                                                    <span className={`text-[11px] font-semibold tabular-nums ${textPrimary}`}>
                                                                        {formatPersianDate(letter.original_date)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {letter.approved_at && (
                                                                <div
                                                                    className="flex items-center justify-between gap-3 py-1"
                                                                    title="تاریخ تایید مدیریت"
                                                                >
                                                                    <span
                                                                        className={`inline-flex items-center gap-1.5 text-[10px] font-medium tracking-normal ${
                                                                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                                                                        }`}
                                                                    >
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                                        تایید مدیریت
                                                                    </span>
                                                                    <span className={`text-[11px] font-semibold tabular-nums ${textPrimary}`}>
                                                                        {formatPersianDate(letter.approved_at)}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {letter.destination_date && (
                                                                <div
                                                                    className="flex items-center justify-between gap-3 py-1"
                                                                    title={
                                                                        letter.letter_type === 'INCOMING'
                                                                            ? 'تاریخ ثبت در دبیرخانه آریو بنیان توس'
                                                                            : 'تاریخ ثبت مقصد'
                                                                    }
                                                                >
                                                                    <span
                                                                        className={`inline-flex items-center gap-1.5 text-[10px] font-medium tracking-normal ${
                                                                            isDark ? 'text-amber-400' : 'text-amber-700'
                                                                        }`}
                                                                    >
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                                                        {letter.letter_type === 'INCOMING'
                                                                            ? 'ثبت دبیرخانه'
                                                                            : 'ثبت مقصد'}
                                                                    </span>
                                                                    <span className={`text-[11px] font-semibold tabular-nums ${textPrimary}`}>
                                                                        {formatPersianDate(letter.destination_date)}
                                                                    </span>
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

                        {/* صفحه‌بندی */}
                        {totalPages > 1 && (
                            <div
                                className={`px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t ${borderHairline} ${surfaceHeader}`}
                            >
                                <div className={`text-xs font-medium tabular-nums tracking-normal ${textSecondary}`}>
                                    صفحه <strong className={textPrimary}>{toPersianDigits(page)}</strong> از{' '}
                                    <strong className={textPrimary}>{toPersianDigits(totalPages)}</strong> (مجموع:{' '}
                                    {toPersianDigits(totalCount)} مورد)
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={page === 1}
                                        onClick={() => setPage(page - 1)}
                                        className={`h-8 px-3 rounded-[2px] border inline-flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-35 tracking-normal ${
                                            isDark
                                                ? 'bg-tactical-surface1 border-slate-400/20 text-slate-200 hover:border-sky-400/50 hover:bg-tactical-hover'
                                                : 'bg-white border-slate-900/20 text-slate-700 hover:border-sky-600/50 hover:bg-slate-50'
                                        }`}
                                    >
                                        <ChevronRightIcon className="w-3.5 h-3.5" />
                                        <span>صفحه قبل</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={page === totalPages}
                                        onClick={() => setPage(page + 1)}
                                        className={`h-8 px-3 rounded-[2px] border inline-flex items-center gap-1 text-xs font-semibold transition-colors disabled:opacity-35 tracking-normal ${
                                            isDark
                                                ? 'bg-tactical-surface1 border-slate-400/20 text-slate-200 hover:border-sky-400/50 hover:bg-tactical-hover'
                                                : 'bg-white border-slate-900/20 text-slate-700 hover:border-sky-600/50 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span>صفحه بعد</span>
                                        <ChevronLeftIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* پنجره تنظیمات پیامک اطلاع‌رسانی */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {isSmsModalOpen && (
                    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
                        <div
                            className={`relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2px] border shadow-2xl overflow-hidden ${
                                isDark
                                    ? 'bg-tactical-surface1 border-amber-400/40 text-slate-100'
                                    : 'bg-white border-amber-600/40 text-slate-900'
                            }`}
                        >
                            <CornerBrackets accent="amber" isDark={isDark} />

                            <div
                                className={`flex justify-between items-center px-4 py-3 border-b ${
                                    isDark
                                        ? 'bg-tactical-surface2 border-slate-400/15'
                                        : 'bg-amber-50 border-amber-600/20'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Cog6ToothIcon
                                        className={`w-5 h-5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                                    />
                                    <h3 className="font-bold text-xs sm:text-sm tracking-normal">
                                        تنظیمات پیامک اطلاع‌رسانی ({getFilterName(filterType)})
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsSmsModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                    aria-label="بستن پنجره"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                                <div
                                    className={`p-3 rounded-[2px] border flex items-center justify-between gap-3 ${
                                        isDark
                                            ? 'bg-sky-400/10 border-sky-400/30'
                                            : 'bg-sky-50 border-sky-600/25'
                                    }`}
                                >
                                    <div className="tracking-normal">
                                        <span className="font-bold text-xs block">ارسال خودکار پیامک فعال باشد؟</span>
                                        <span className={`text-[11px] block mt-0.5 ${textSecondary}`}>
                                            در صورت فعال بودن، پس از ثبت مکاتبه، به افراد منتخب زیر پیامک ارسال می‌شود.
                                        </span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={smsActive}
                                        onChange={(e) => setSmsActive(e.target.checked)}
                                        className="w-5 h-5 accent-sky-500 rounded-[2px] cursor-pointer shrink-0"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2 tracking-normal">
                                        <label className="text-xs font-bold">انتخاب اعضای دریافت‌کننده پیامک:</label>
                                        <span
                                            className={`text-[11px] font-semibold tabular-nums ${
                                                isDark ? 'text-sky-400' : 'text-sky-700'
                                            }`}
                                        >
                                            انتخاب‌شده: {toPersianDigits(selectedRecipientIds.length)} نفر
                                        </span>
                                    </div>

                                    <input
                                        type="text"
                                        placeholder="جستجوی پرسنل..."
                                        value={personnelSearch}
                                        onChange={(e) => setPersonnelSearch(e.target.value)}
                                        className={`w-full h-9 mb-2.5 px-3 text-xs rounded-[2px] border focus:outline-none transition-colors tracking-normal ${
                                            isDark
                                                ? 'bg-tactical-canvas border-slate-400/20 text-slate-100 placeholder-slate-500 focus:border-sky-400'
                                                : 'bg-slate-50 border-slate-900/20 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                                        }`}
                                    />

                                    <div
                                        className={`max-h-52 overflow-y-auto space-y-1.5 p-2 border rounded-[2px] ${
                                            isDark
                                                ? 'border-slate-400/15 bg-tactical-canvas/70'
                                                : 'border-slate-900/15 bg-slate-50'
                                        }`}
                                    >
                                        {filteredPersonnelForModal.length === 0 ? (
                                            <div className="p-4 text-center text-xs text-slate-500 font-semibold tracking-normal">
                                                پرسنلی یافت نشد
                                            </div>
                                        ) : (
                                            filteredPersonnelForModal.map((emp) => {
                                                const isSelected = selectedRecipientIds.includes(String(emp.id));
                                                return (
                                                    <div
                                                        key={emp.id}
                                                        onClick={() => toggleRecipient(emp.id)}
                                                        className={`flex items-center justify-between p-2.5 rounded-[2px] border border-s-2 cursor-pointer transition-colors tracking-normal ${
                                                            isSelected
                                                                ? isDark
                                                                    ? 'bg-sky-400/15 border-sky-400/40 border-s-sky-400 text-sky-200 font-bold'
                                                                    : 'bg-sky-50 border-sky-600/40 border-s-sky-600 text-sky-900 font-bold'
                                                                : isDark
                                                                ? 'bg-tactical-surface1 border-slate-400/15 border-s-transparent text-slate-300 hover:bg-tactical-hover'
                                                                : 'bg-white border-slate-900/10 border-s-transparent text-slate-700 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="text-xs">{emp.name}</div>
                                                            <div className={`text-[10px] mt-0.5 ${textSecondary}`}>
                                                                {emp.position_title || 'بدون سمت'}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`w-5 h-5 rounded-[2px] flex items-center justify-center border ${
                                                                isSelected
                                                                    ? isDark
                                                                        ? 'bg-sky-400 border-sky-400 text-slate-950'
                                                                        : 'bg-sky-600 border-sky-600 text-white'
                                                                    : 'border-slate-500'
                                                            }`}
                                                        >
                                                            {isSelected && <CheckIcon className="w-3.5 h-3.5" />}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div
                                className={`flex justify-end gap-2.5 px-4 py-3 border-t ${borderHairline} ${surfaceHeader}`}
                            >
                                <button
                                    type="button"
                                    onClick={() => setIsSmsModalOpen(false)}
                                    className={`h-9 px-4 rounded-[2px] border text-xs font-semibold tracking-normal transition-colors ${
                                        isDark
                                            ? 'border-slate-400/25 bg-tactical-surface1 text-slate-300 hover:bg-tactical-hover'
                                            : 'border-slate-900/20 bg-white text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    disabled={savingSettings}
                                    onClick={handleSaveSmsSettings}
                                    className={`h-9 px-5 rounded-[2px] text-xs font-semibold tracking-normal transition-colors disabled:opacity-50 ${
                                        isDark
                                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                                    }`}
                                >
                                    {savingSettings ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecretariatListScreen;