import React from 'react';
import { FaUserEdit, FaUserCheck, FaUserClock } from 'react-icons/fa';
import logo from '../assets/ario.png';

// 🚀 کامپوننت لوگوی ثابت جهت‌دار با پشتیبانی از اسناد (DOCUMENT) و وضعیت حذف شده (DELETED)
const StaticDirectionalLogo = ({ type, status }) => {
    const isOutward = type === 'OUTGOING';
    const isInternal = type === 'INTERNAL';
    const isDocument = type === 'DOCUMENT';
    const isDeleted = status === 'DELETED';

    const colorMaps = {
        'INCOMING': { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-600 dark:text-green-400' },
        'OUTGOING': { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400' },
        'DOCUMENT': { bg: 'bg-slate-100 dark:bg-slate-900/40', border: 'border-slate-500', text: 'text-slate-600 dark:text-slate-400' },
        'INTERNAL': { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    };

    const theme = isDeleted 
        ? { bg: 'bg-red-100 dark:bg-red-900/30 grayscale', border: 'border-red-400', text: 'text-red-500 dark:text-red-400' }
        : (colorMaps[type] || colorMaps['INTERNAL']);

    return (
        <div className={`relative w-8 h-8 shrink-0 flex items-center justify-center rounded-lg shadow-sm border ${theme.bg} ${theme.border}`}>
            <img src={logo} alt="لوگو" className="w-5 h-5 object-contain z-10 relative opacity-90" />
            <div className={`absolute inset-0 z-20 flex items-start justify-center ${isInternal ? 'rotate-45' : isOutward ? 'rotate-90' : isDocument ? 'rotate-180' : 'rotate-0'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" className={`drop-shadow-sm ${theme.text} -mt-1.5 ${!isInternal && !isOutward && !isDocument ? 'rotate-180' : 'rotate-0'}`}>
                    {isInternal || isDocument ? (
                        <><path d="M 22 22 A 18 18 0 0 0 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><path d="M 12 12 L 6 6 L 12 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></>
                    ) : (
                        <><path d="M 12 23 Q 22 14, 12 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /><path d="M 6 9 L 12 3 L 18 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-40 12 3)" /></>
                    )}
                </svg>
            </div>
        </div>
    );
};
const LetterInfoBanner = ({ letter, isDark, translateEnum, getStatusStyle }) => {
    const formatDateTimeExact = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleString('fa-IR', { 
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: '2-digit', minute:'2-digit', second:'2-digit' 
        });
    };

    const isDeleted = letter.status === 'DELETED';

    // 🚀 تابع جادویی برای نمایش بی‌نقص شماره‌های ترکیبی
    const renderFormattedNumber = (numStr) => {
        if (!numStr) return null;
        
        // اگر شماره شامل اسلش است
        if (numStr.includes('/')) {
            const parts = numStr.split('/');
            // با تنظیم dir="ltr" در Flexbox:
            // parts[0] (یعنی حرف "ص") در سمت چپ قرار می‌گیرد
            // parts[2] (یعنی شماره "۰۰۲") در سمت راست قرار می‌گیرد
            return (
                <span className="inline-flex items-center gap-[3px] font-mono text-[13px] font-black" dir="ltr">
                    <span>{parts[0]}</span>
                    <span className="text-gray-400 opacity-60">/</span>
                    <span>{parts[1]}</span>
                    <span className="text-gray-400 opacity-60">/</span>
                    <span>{parts[2]}</span>
                </span>
            );
        }
        
        // در غیر این صورت حالت عادی LTR اعمال می‌شود
        return <span dir="ltr">{numStr}</span>;
    };

    return (
        <div className={`p-4 md:p-5 rounded-2xl border print:hidden shadow-sm flex flex-col md:flex-row flex-wrap gap-4 ${
            isDeleted 
                ? (isDark ? 'bg-red-950/20 border-red-800/60' : 'bg-red-50/40 border-red-200') 
                : (isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200')
        }`}>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 w-full">
                
                {/* ۱. شماره سیستمی و ثبت نهایی */}
                <div className={`flex flex-col items-center text-center justify-center p-2 rounded-lg border ${
                    isDeleted 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50' 
                        : 'bg-blue-50 dark:bg-slate-900/50 border-blue-100 dark:border-slate-700/50'
                }`}>
                    <span className={`opacity-60 text-[10px] font-bold mb-1 ${isDeleted ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>شماره سیستمی:</span>
                    
                    <span className={`font-mono text-[11px] font-black ${letter.original_number ? 'mb-1' : ''} ${isDeleted ? 'line-through text-red-700 dark:text-red-400' : 'text-blue-700 dark:text-blue-400'}`}>
                        {renderFormattedNumber(letter.indicator_number)}
                    </span>
                    
                    {/* 🚀 نمایش شماره ثبت نهایی با حل قطعی مشکل چیدمان */}
                    {letter.original_number && (
                        <div className="w-full flex flex-col items-center border-t border-blue-200 dark:border-slate-700 pt-1 mt-1">
                            <span className="opacity-70 text-[10px] font-black text-emerald-700 dark:text-emerald-400 mb-0.5">شماره ثبت اصلی:</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                                {renderFormattedNumber(letter.original_number)}
                            </span>
                        </div>
                    )}
                </div>

                {/* ۲. تاریخ ثبت اولیه */}
                <div className="flex flex-col items-center text-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                    <span className="opacity-60 text-[10px] font-bold mb-1">تاریخ نگاشت اولیه:</span>
                    <span className="font-bold text-sm">{new Date(letter.created_at).toLocaleDateString('fa-IR')}</span>
                </div>

                {/* ۳. نوع نامه / سند */}
                <div className="flex flex-col items-center text-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                    <span className="opacity-60 text-[10px] font-bold mb-1">نوع مکاتبه:</span>
                    <div className="flex items-center gap-2">
                        <StaticDirectionalLogo type={letter.letter_type} status={letter.status} />
                        <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                            {letter.letter_type === 'DOCUMENT' ? 'سند بایگانی' : `نامه ${translateEnum(letter.letter_type)}`}
                        </span>
                    </div>
                </div>

                {/* ۴. وضعیت فعلی */}
                <div className="flex flex-col items-center text-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                    <span className="opacity-60 text-[10px] font-bold mb-1">وضعیت فعلی:</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusStyle(letter.status)}`}>
                        {translateEnum(letter.status)}
                    </span>
                </div>

                {/* ۵. نگارنده */}
                <div className="flex flex-col items-center text-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                    <div className="opacity-60 text-[10px] font-bold mb-1 flex items-center gap-1"><FaUserEdit/> نگارنده:</div>
                    <div className="font-bold text-xs text-blue-600 dark:text-blue-400 truncate w-full">{letter.created_by_name}</div>
                    <div className="opacity-50 text-[10px] font-mono mt-1" dir="ltr">({formatDateTimeExact(letter.created_at)})</div>
                </div>

                {/* ۶. تاییدکننده */}
                <div className="flex flex-col items-center text-center justify-center p-2 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-700/50">
                    <div className="opacity-60 text-[10px] font-bold mb-1 flex items-center gap-1"><FaUserCheck/> تاییدکننده:</div>
                    {letter.approved_at ? (
                        <>
                            <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 truncate w-full">{letter.approved_by_name}</div>
                            <div className="opacity-50 text-[10px] font-mono mt-1" dir="ltr">({formatDateTimeExact(letter.approved_at)})</div>
                        </>
                    ) : <div className="text-xs opacity-40 italic mt-1">در انتظار</div>}
                </div>

                {/* ۷. مسئول خروج */}
                <div className="flex flex-col items-center text-center justify-center p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-100 dark:border-cyan-900/30">
                    <div className="opacity-60 text-cyan-700 dark:text-cyan-500 text-[10px] font-bold mb-1 flex items-center gap-1"><FaUserClock/> مسئول خروج:</div>
                    {letter.delivery_responsible_name ? (
                        <>
                            <div className="font-bold text-xs text-cyan-800 dark:text-cyan-400 truncate w-full">{letter.delivery_responsible_name}</div>
                            {letter.delivery_assigned_at && <div className="opacity-50 text-cyan-700 dark:text-cyan-500 text-[10px] font-mono mt-1" dir="ltr">({formatDateTimeExact(letter.delivery_assigned_at)})</div>}
                        </>
                    ) : <div className="text-xs opacity-40 italic mt-1 text-cyan-800 dark:text-cyan-400">نامشخص</div>}
                </div>

            </div>
        </div>
    );
};

export default LetterInfoBanner;