import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { fetchLetters } from '../../features/secretariat/secretariatSlice';
import { FaPlus, FaSearch, FaPaperclip, FaExclamationCircle, FaUserSecret, FaInbox, FaChevronLeft } from 'react-icons/fa';

const SecretariatListScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); 
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { letters, loadingList, error } = useSelector((state) => state.secretariat);

    const [filterType, setFilterType] = useState(location.state?.filter || '');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        dispatch(fetchLetters({ type: filterType, search: searchQuery }));
    }, [dispatch, filterType, searchQuery]);

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
                    <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        دفتر اندیکاتور
                    </h1>
                </div>
                <Link
                    to="/secretariat/create"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition text-sm font-bold shadow-md shadow-blue-900/20 active:scale-95"
                >
                    <FaPlus size={12} /> ثبت نامه جدید
                </Link>
            </div>

            <div className={`p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
                    {[
                        { label: 'همه مکاتبات', value: '' },
                        { label: 'وارده', value: 'INCOMING' },
                        { label: 'صادره', value: 'OUTGOING' },
                        { label: 'داخلی', value: 'INTERNAL' },
                    ].map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => setFilterType(tab.value)}
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

                <div className="relative w-full md:w-80 mr-auto">
                    <input
                        type="text"
                        placeholder="جستجو در موضوع، شماره یا فرستنده..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                            isDark ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                    />
                    <FaSearch className="absolute left-3.5 top-3.5 text-gray-400" />
                </div>
            </div>

            {loadingList ? (
                <div className="text-center py-20 animate-pulse font-bold opacity-50">در حال همگام‌سازی دفتر اندیکاتور...</div>
            ) : error ? (
                <div className="bg-red-100 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-bold">{error}</div>
            ) : letters?.length === 0 ? (
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
                            {letters.map((letter) => (
                                <tr 
                                    key={letter.id} 
                                    onClick={() => navigate(`/secretariat/${letter.id}`)}
                                    className={`cursor-pointer group transition-colors duration-200 ${isDark ? 'hover:bg-gray-700/50 bg-gray-800' : 'hover:bg-blue-50/50 bg-white'}`}
                                >
                                    <td className="px-5 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`font-mono font-bold text-[13px] ${isDark ? 'text-gray-300' : 'text-gray-700'} group-hover:text-blue-500 transition-colors`} title="شماره سیستمی">
                                                {letter.indicator_number}
                                            </span>
                                            {/* 🚀 تصحیح Bidi: تغییر به راست‌چین برای حفظ ترتیب */}
                                            {letter.original_number && (
                                                <span className="text-[10.5px] opacity-60 font-mono text-right" dir="rtl" title="شماره فیزیکی / مبدأ">
                                                    {letter.original_number}
                                                </span>
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
                                                {letter.internal_sender_name || letter.external_sender_detail?.name || '-'}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-5 py-4">
                                        <div className="flex flex-col truncate max-w-[140px]">
                                            <span className={`text-[13px] font-bold truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {letter.internal_receiver_name || letter.external_receiver_detail?.name || '-'}
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
                </div>
            )}
        </div>
    );
};
export default SecretariatListScreen;