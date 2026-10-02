import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { fetchLetters, fetchAllPersonnel } from '../../features/secretariat/secretariatSlice';
import { FaPlus, FaSearch, FaPaperclip, FaExclamationCircle, FaUserSecret, FaInbox, FaChevronLeft, FaChevronDown, FaAngleRight, FaAngleLeft } from 'react-icons/fa';

// 🚀 کامپوننت انتخاب فرستنده با قابلیت تایپ و جستجو
const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel?.find(p => p.id === parseInt(value));
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

    const inputClass = `w-full py-2.5 px-4 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`;

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
                <ul className={`absolute z-20 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-xl ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <li 
                        className={`p-2.5 cursor-pointer text-sm font-bold opacity-70 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        onClick={() => { onChange(''); setIsOpen(false); }}
                    >
                        -- همه فرستنده‌ها --
                    </li>
                    {filtered.map(emp => (
                        <li 
                            key={emp.id}
                            className={`p-2.5 cursor-pointer text-sm border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
                            onClick={() => {
                                onChange(emp.id.toString());
                                setSearchTerm(`${emp.name} - ${emp.position_title || 'بدون سمت'}`);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-xs opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="p-3 text-sm opacity-50 text-center">موردی یافت نشد</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const SecretariatListScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); 
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    
    // استخراج دیتای صفحه بندی شده از ریداکس
    const { letters: lettersData, loadingList, error, allPersonnel } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : (lettersData?.results || []);
    // 🚀 نمایش تعداد کل دقیق (count) برگشتی از بک‌اند
    const totalCount = lettersData?.count || lettersList.length || 0;
    const totalPages = Math.ceil(totalCount / 12) || 1;

    // استیت‌های فیلتر و صفحه‌بندی
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState(location.state?.filter || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [senderFilter, setSenderFilter] = useState('');

    // 🚀 استیت‌های شمارش نامه‌ها برای نمایش کنار هر سال و ماه
    const [yearCounts, setYearCounts] = useState({});
    const [monthCounts, setMonthCounts] = useState({});

    const JALALI_YEARS = ['1401', '1402', '1403', '1404', '1405', '1406'];
    const JALALI_MONTHS = [
        { val: '1', name: 'فروردین' }, { val: '2', name: 'اردیبهشت' }, { val: '3', name: 'خرداد' },
        { val: '4', name: 'تیر' }, { val: '5', name: 'مرداد' }, { val: '6', name: 'شهریور' },
        { val: '7', name: 'مهر' }, { val: '8', name: 'آبان' }, { val: '9', name: 'آذر' },
        { val: '10', name: 'دی' }, { val: '11', name: 'بهمن' }, { val: '12', name: 'اسفند' }
    ];

    // با هر تغییر فیلتر، صفحه برمی‌گردد به 1
    const handleFilterChange = (setter, value) => {
        setter(value);
        setPage(1);
    };

    useEffect(() => {
        dispatch(fetchAllPersonnel());
    }, [dispatch]);

    useEffect(() => {
        // 🚀 ارسال null در صورت خالی بودن سال برای جلوگیری از خطا در بک‌اند
        dispatch(fetchLetters({ 
            type: filterType, 
            search: searchQuery, 
            page: page,
            jalali_year: selectedYear || null,
            jalali_month: selectedMonth || null,
            sender: senderFilter
        }));
    }, [dispatch, filterType, searchQuery, page, selectedYear, selectedMonth, senderFilter]);

    // محاسبه‌ی دستی و لحظه‌ای تعداد برای فیلترها از روی lettersList فعلی
    useEffect(() => {
        if (!lettersList || lettersList.length === 0) {
            setYearCounts({});
            setMonthCounts({});
            return;
        }
        
        const yCounts = {};
        const mCounts = {};

        lettersList.forEach(letter => {
            if (letter.original_date) {
                try {
                    const date = new Date(letter.original_date);
                    const pc = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'numeric' }).formatToParts(date);
                    const y = pc.find(p => p.type === 'year')?.value;
                    const m = pc.find(p => p.type === 'month')?.value;

                    // تبدیل اعداد فارسی به انگلیسی
                    const toEng = (s) => s?.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
                    
                    const engY = toEng(y);
                    const engM = toEng(m);

                    if (engY) yCounts[engY] = (yCounts[engY] || 0) + 1;
                    if (engM) mCounts[engM] = (mCounts[engM] || 0) + 1;
                } catch (e) {}
            }
        });
        setYearCounts(yCounts);
        setMonthCounts(mCounts);
    }, [lettersList]);

    const formatPersianDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('fa-IR', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getFilterName = (type) => {
        switch(type) {
            case 'INCOMING': return 'مکاتبات وارده';
            case 'OUTGOING': return 'مکاتبات صادره';
            case 'INTERNAL': return 'مکاتبات داخلی';
            default: return 'همه مکاتبات';
        }
    };

    return (
        <div className="p-4 max-w-7xl mx-auto space-y-6">

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold print:hidden mb-4">
                <Link to="/" className="text-blue-500 hover:text-blue-700 transition">خانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className="text-gray-500">دبیرخانه</span>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>{getFilterName(filterType)}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <FaInbox size={18} />
                    </div>
                    <div>
                        <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            دفتر اندیکاتور
                        </h1>
                        <span className="text-sm font-bold opacity-60">تعداد نامه‌ها (با احتساب فیلتر): {totalCount}</span>
                    </div>
                </div>
                <Link
                    to="/secretariat/create"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition text-sm font-bold shadow-md shadow-blue-900/20 active:scale-95"
                >
                    <FaPlus size={12} /> ثبت نامه جدید
                </Link>
            </div>

            {/* 🚀 کنترل پنل فیلترها */}
            <div className={`p-4 rounded-2xl space-y-4 border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                
                {/* ردیف اول: تب‌های نوع نامه و سرچ و فرستنده */}
                <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                    <div className="flex gap-2 overflow-x-auto w-full xl:w-auto pb-1 md:pb-0 scrollbar-hide">
                        {[
                            { label: 'همه مکاتبات', value: '' },
                            { label: 'وارده', value: 'INCOMING' },
                            { label: 'صادره', value: 'OUTGOING' },
                            { label: 'داخلی', value: 'INTERNAL' },
                        ].map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleFilterChange(setFilterType, tab.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                                    filterType === tab.value
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : isDark
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row w-full xl:w-auto gap-3">
                        <SearchablePersonnelSelect 
                            personnel={allPersonnel} 
                            value={senderFilter} 
                            onChange={(val) => handleFilterChange(setSenderFilter, val)} 
                            placeholder="فیلتر فرستنده داخلی..." 
                            isDark={isDark} 
                        />
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="جستجو (موضوع یا شماره)..."
                                value={searchQuery}
                                onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
                                className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                                    isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                                }`}
                            />
                            <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* ردیف دوم: فیلتر سال و ماه */}
                <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold opacity-70 whitespace-nowrap">سال بایگانی:</span>
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                <button 
                                    onClick={() => { handleFilterChange(setSelectedYear, ''); handleFilterChange(setSelectedMonth, ''); }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${!selectedYear ? 'bg-indigo-600 text-white' : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')}`}
                                >
                                    همه سال‌ها
                                </button>
                                {JALALI_YEARS.map(yr => (
                                    <button 
                                        key={yr} onClick={() => handleFilterChange(setSelectedYear, yr)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${selectedYear === yr ? 'bg-indigo-600 text-white shadow-md' : (isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
                                    >
                                        <span>{yr}</span>
                                        {yearCounts[yr] > 0 && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selectedYear === yr ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'}`}>
                                                {yearCounts[yr]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedYear && (
                            <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 scrollbar-hide border-l pl-4 border-gray-200 dark:border-gray-700">
                                <button 
                                    onClick={() => handleFilterChange(setSelectedMonth, '')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${!selectedMonth ? 'bg-emerald-600 text-white' : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600')}`}
                                >
                                    کل ماه‌ها
                                </button>
                                {JALALI_MONTHS.map(m => (
                                    <button 
                                        key={m.val} onClick={() => handleFilterChange(setSelectedMonth, m.val)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${selectedMonth === m.val ? 'bg-emerald-600 text-white shadow-md' : (isDark ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}`}
                                    >
                                        <span>{m.name}</span>
                                        {monthCounts[m.val] > 0 && (
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selectedMonth === m.val ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500 dark:bg-gray-800'}`}>
                                                {monthCounts[m.val]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {loadingList ? (
                <div className="text-center py-20 animate-pulse font-bold opacity-50">در حال همگام‌سازی دفتر اندیکاتور...</div>
            ) : error ? (
                <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold">{error}</div>
            ) : lettersList?.length === 0 ? (
                <div className={`text-center py-24 rounded-2xl border ${isDark ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50/50'}`}>
                    <FaInbox size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold opacity-70 mb-1">هیچ مکاتبه‌ای یافت نشد</h3>
                    <p className="text-sm opacity-50">با تغییر فیلترها یا کلمات جستجو مجدداً تلاش کنید.</p>
                </div>
            ) : (
                <div className={`overflow-x-auto rounded-2xl border shadow-sm ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    <table className="w-full text-right text-sm">
                        <thead className={`text-[11px] uppercase tracking-wider font-black ${isDark ? 'bg-gray-900/50 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                            <tr>
                                <th className="px-5 py-4 w-32">شماره نامه</th>
                                <th className="px-5 py-4 w-24">نوع</th>
                                <th className="px-5 py-4 max-w-md">موضوع و مشخصات</th>
                                <th className="px-5 py-4 w-40">فرستنده</th>
                                <th className="px-5 py-4 w-40">گیرنده</th>
                                <th className="px-5 py-4 w-32">تاریخ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {lettersList.map((letter) => (
                                <tr 
                                    key={letter.id} 
                                    onClick={() => navigate(`/secretariat/${letter.id}`)}
                                    className={`cursor-pointer group transition-colors duration-200 ${isDark ? 'hover:bg-gray-700/50 bg-gray-800' : 'hover:bg-blue-50/50 bg-white'}`}
                                >
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`font-mono font-bold text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-700'} group-hover:text-blue-500 transition-colors`} title="شماره تولید شده توسط سیستم">
                                                {letter.indicator_number}
                                            </span>
                                            {/* 🚀 تصحیح Bidi و جلوگیری از برهم‌ریختگی شماره فیزیکی */}
                                            {letter.original_number && (
                                                <bdi className="text-[11px] opacity-70 font-mono font-bold text-right" dir="ltr" style={{ unicodeBidi: 'plaintext' }} title="شماره ثبت فیزیکی / مبدأ">
                                                    {letter.original_number}
                                                </bdi>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black tracking-wide ${
                                            letter.letter_type === 'INCOMING' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-500/20' :
                                            letter.letter_type === 'OUTGOING' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-500/20' :
                                            'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-500/20'
                                        }`}>
                                            {letter.letter_type === 'INCOMING' ? 'وارده' : letter.letter_type === 'OUTGOING' ? 'صادره' : 'داخلی'}
                                        </span>
                                    </td>

                                    <td className="px-5 py-4 max-w-xs md:max-w-md">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`} title={letter.subject}>
                                                {letter.subject}
                                            </span>
                                            {letter.attachments?.length > 0 && (
                                                <FaPaperclip className="text-gray-400 flex-shrink-0" title="دارای پیوست" size={12} />
                                            )}
                                        </div>
                                        <div className="flex gap-1.5 mt-1.5">
                                            {letter.urgency !== 'NORMAL' && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                    <FaExclamationCircle size={8} /> 
                                                    {letter.urgency === 'URGENT' ? 'فوری' : 'خیلی فوری'}
                                                </span>
                                            )}
                                            {letter.confidentiality !== 'NORMAL' && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                    <FaUserSecret size={8} /> 
                                                    {letter.confidentiality === 'CONFIDENTIAL' ? 'محرمانه' : 'سری'}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex flex-col truncate max-w-[140px]">
                                            <span className={`text-[13px] font-bold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {letter.final_sender_name}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex flex-col truncate max-w-[140px]">
                                            <span className={`text-[13px] font-bold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {letter.final_receiver_name}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`} title="تاریخ ثبت سیستم">
                                                {formatPersianDate(letter.created_at)}
                                            </span>
                                            {letter.original_date && (
                                                <span className="text-[10px] opacity-60" title="تاریخ مبدأ">
                                                    {formatPersianDate(letter.original_date)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 🚀 سیستم صفحه‌‌بندی پایینی */}
                    {totalPages > 1 && (
                        <div className={`px-5 py-4 flex items-center justify-between border-t ${isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
                            <div className="text-xs font-bold opacity-60">
                                صفحه {page} از {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-100 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <FaAngleRight />
                                </button>
                                <button 
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 disabled:opacity-30 hover:bg-gray-100 transition dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    <FaAngleLeft />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
export default SecretariatListScreen;