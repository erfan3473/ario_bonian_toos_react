// src/components/routine/MonthlyRadar.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowPathIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ClockIcon,
    QueueListIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

const PERIOD_COLORS = {
    DAILY: 'bg-sky-400',
    WEEKLY: 'bg-emerald-500',
    MONTHLY: 'bg-purple-500',
    YEARLY: 'bg-amber-500',
};

const PERIOD_TEXT_COLORS = {
    DAILY: 'text-sky-400',
    WEEKLY: 'text-emerald-400',
    MONTHLY: 'text-purple-400',
    YEARLY: 'text-amber-400',
};

const PERIOD_LABELS = {
    DAILY: 'روزانه',
    WEEKLY: 'هفتگی',
    MONTHLY: 'ماهانه',
    YEARLY: 'سالانه',
};

const MonthlyRadar = ({
    monthDays = [],
    weeklyRoutines = {},
    setBaseDate,
    isDark,
    jalaliMonthName,
    jalaliYear,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (selectedRoutine) return;
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsExpanded(false);
            }
        };
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (selectedRoutine) {
                    setSelectedRoutine(null);
                } else {
                    setIsExpanded(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedRoutine]);

    const getDotColor = (period, isDone) => {
        const base = PERIOD_COLORS[period] || 'bg-slate-500';
        return isDone
            ? `${base} opacity-30`
            : `${base} ring-1 ring-black/15 dark:ring-white/15`;
    };

    const borderHairline = isDark ? 'border-slate-400/20' : 'border-slate-900/15';

    return (
        <>
            <div ref={wrapperRef} className="relative w-full z-[250]">
                {/* دکمه اصلی باز و بسته کردن تقویم ماهانه */}
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsExpanded((prev) => !prev)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setIsExpanded((prev) => !prev);
                        }
                    }}
                    className={`h-9 px-3 rounded-[2px] border flex items-center justify-between gap-2 cursor-pointer select-none transition-colors duration-150 ${
                        isExpanded
                            ? isDark
                                ? 'bg-tactical-surface2 border-sky-400/60 text-sky-300'
                                : 'bg-sky-50 border-sky-600/60 text-sky-900'
                            : isDark
                            ? 'bg-tactical-canvas border-slate-400/20 hover:border-sky-400/45 text-slate-100'
                            : 'bg-slate-50 border-slate-900/15 hover:border-sky-600/45 text-slate-900'
                    }`}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <CalendarDaysIcon
                            className={`w-4 h-4 shrink-0 ${
                                isDark ? 'text-sky-400' : 'text-sky-700'
                            }`}
                        />
                        <span className="text-xs sm:text-sm font-bold tracking-normal truncate">
                            تقویم و پایش ماهانه:{' '}
                            <span className={isDark ? 'text-sky-300' : 'text-sky-700'}>
                                {jalaliMonthName}
                            </span>{' '}
                            {jalaliYear && (
                                <span
                                    className={`text-xs font-medium tabular-nums ${
                                        isDark ? 'text-slate-400' : 'text-slate-500'
                                    }`}
                                >
                                    {jalaliYear}
                                </span>
                            )}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsExpanded((prev) => !prev);
                        }}
                        className={`w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-[2px] border transition-colors ${
                            isExpanded
                                ? isDark
                                    ? 'bg-red-500/15 border-red-400/40 text-red-400 hover:bg-red-500/25'
                                    : 'bg-red-50 border-red-600/35 text-red-600 hover:bg-red-100'
                                : isDark
                                ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300 hover:border-sky-400/45'
                                : 'bg-white border-slate-900/15 text-slate-700 hover:border-sky-600/45'
                        }`}
                        title={isExpanded ? 'بستن تقویم' : 'باز کردن تقویم'}
                        aria-label={isExpanded ? 'بستن تقویم' : 'باز کردن تقویم'}
                    >
                        {isExpanded ? (
                            <XMarkIcon className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronDownIcon className="w-3.5 h-3.5" />
                        )}
                    </button>
                </div>

                {/* پنل بازشونده تقویم (شناور روی اسکرول‌بار و ستون‌ها) */}
                {isExpanded && (
                    <div
                        className={`absolute top-full mt-1.5 inset-x-0 rounded-[2px] border shadow-2xl overflow-hidden z-[260] ${
                            isDark
                                ? 'bg-tactical-surface1 border-sky-400/45 shadow-black/75'
                                : 'bg-white border-sky-600/45 shadow-slate-900/20'
                        }`}
                    >
                        {/* راهنمای رنگ دوره‌های تکرار */}
                        <div
                            className={`flex flex-wrap items-center justify-center gap-3 px-3 py-2 border-b ${borderHairline} ${
                                isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated'
                            }`}
                        >
                            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${PERIOD_COLORS[key]}`} />
                                    <span
                                        className={`text-[10px] font-semibold tracking-normal ${
                                            isDark ? 'text-slate-300' : 'text-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="p-2">
                            {/* سرستون روزهای هفته */}
                            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                                {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayName, idx) => (
                                    <div
                                        key={idx}
                                        className={`text-[11px] font-bold py-0.5 tracking-normal ${
                                            isDark ? 'text-slate-400' : 'text-slate-600'
                                        }`}
                                    >
                                        {dayName}
                                    </div>
                                ))}
                            </div>

                            {/* گرید ۳۵ روزه */}
                            <div className="grid grid-cols-7 gap-1">
                                {monthDays.map((day) => {
                                    const dayRoutines = weeklyRoutines[day.apiDate] || [];
                                    const allItems = dayRoutines.flatMap((r) =>
                                        (r.items || []).map((item) => ({
                                            ...item,
                                            period: r.template_details?.period || 'DAILY',
                                            parentTitle: r.title || r.template_details?.title,
                                        }))
                                    );

                                    let dayClass =
                                        'relative min-h-[50px] p-1 flex flex-col items-center rounded-[2px] border cursor-pointer transition-colors duration-150 ';
                                    if (day.isCurrentWeek) {
                                        dayClass += isDark
                                            ? 'border-sky-400/50 bg-sky-400/10 hover:bg-sky-400/20'
                                            : 'border-sky-600/50 bg-sky-50 hover:bg-sky-100/70';
                                    } else {
                                        dayClass += isDark
                                            ? 'border-slate-400/15 bg-tactical-canvas/70 hover:bg-tactical-hover'
                                            : 'border-slate-900/10 bg-slate-50 hover:bg-slate-100';
                                    }
                                    if (day.isToday) {
                                        dayClass += isDark
                                            ? ' ring-1 ring-amber-400 border-amber-400/70'
                                            : ' ring-1 ring-amber-600 border-amber-600/70';
                                    }

                                    return (
                                        <div
                                            key={day.apiDate}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setBaseDate(day.dateObj);
                                            }}
                                            className={dayClass}
                                        >
                                            <div className="w-full flex justify-between items-start px-0.5">
                                                <span
                                                    className={`text-[9px] truncate tracking-normal ${
                                                        isDark ? 'text-slate-500' : 'text-slate-500'
                                                    }`}
                                                >
                                                    {day.monthName}
                                                </span>
                                                <span
                                                    className={`text-xs font-bold tabular-nums ${
                                                        day.isToday
                                                            ? isDark
                                                                ? 'text-amber-400'
                                                                : 'text-amber-700'
                                                            : isDark
                                                            ? 'text-slate-200'
                                                            : 'text-slate-800'
                                                    }`}
                                                >
                                                    {day.dayNum}
                                                </span>
                                            </div>

                                            <div className="w-full flex flex-wrap justify-center gap-0.5 mt-1">
                                                {allItems.slice(0, 6).map((item) => (
                                                    <div
                                                        key={item.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedRoutine(item);
                                                        }}
                                                        title={item.title}
                                                        className="p-0.5 cursor-pointer group"
                                                    >
                                                        <div
                                                            className={`w-2.5 h-2.5 rounded-full group-hover:scale-125 transition-transform ${getDotColor(
                                                                item.period,
                                                                item.is_done
                                                            )}`}
                                                        />
                                                    </div>
                                                ))}
                                                {allItems.length > 6 && (
                                                    <div className="w-2.5 h-2.5 flex items-center justify-center">
                                                        <span
                                                            className={`text-[10px] font-bold ${
                                                                isDark ? 'text-slate-400' : 'text-slate-600'
                                                            }`}
                                                        >
                                                            +
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* پنجره نمایش جزئیات وظیفه (بالاتر از هدر با z-[1050]) */}
            {selectedRoutine && (
                <div
                    className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    onClick={() => setSelectedRoutine(null)}
                >
                    <div
                        className={`relative w-full max-w-sm rounded-[2px] shadow-2xl border overflow-hidden ${
                            isDark
                                ? 'bg-tactical-surface1 border-sky-400/45 text-slate-100'
                                : 'bg-white border-sky-600/45 text-slate-900'
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className={`flex justify-between items-center px-4 py-3 border-b ${borderHairline} ${
                                isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated'
                            }`}
                        >
                            <h3 className="font-bold text-sm flex items-center gap-2 tracking-normal">
                                <QueueListIcon
                                    className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}
                                />
                                جزئیات وظیفه
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedRoutine(null)}
                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                aria-label="بستن جزئیات"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3.5 text-sm tracking-normal">
                            <div>
                                <span
                                    className={`text-[11px] font-medium block mb-1 ${
                                        isDark ? 'text-slate-400' : 'text-slate-500'
                                    }`}
                                >
                                    عنوان روتین مادر:
                                </span>
                                <p className="font-semibold text-xs sm:text-sm">
                                    {selectedRoutine.parentTitle}
                                </p>
                            </div>

                            <div
                                className={`p-2.5 rounded-[2px] border border-s-[3px] ${
                                    isDark
                                        ? 'bg-tactical-canvas border-slate-400/15 border-s-sky-400'
                                        : 'bg-sky-50/60 border-slate-900/10 border-s-sky-600'
                                }`}
                            >
                                <span
                                    className={`text-[11px] font-medium block mb-1 ${
                                        isDark ? 'text-slate-400' : 'text-slate-500'
                                    }`}
                                >
                                    وظیفه (آیتم):
                                </span>
                                <p className="font-bold text-sm">{selectedRoutine.title}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div
                                    className={`flex flex-col gap-1 p-2.5 rounded-[2px] border ${
                                        isDark
                                            ? 'bg-tactical-canvas border-slate-400/15'
                                            : 'bg-slate-50 border-slate-900/10'
                                    }`}
                                >
                                    <span
                                        className={`text-[10px] font-medium ${
                                            isDark ? 'text-slate-400' : 'text-slate-500'
                                        }`}
                                    >
                                        وضعیت
                                    </span>
                                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                                        {selectedRoutine.is_done ? (
                                            <>
                                                <CheckCircleIcon
                                                    className={`w-4 h-4 ${
                                                        isDark ? 'text-emerald-400' : 'text-emerald-600'
                                                    }`}
                                                />
                                                <span
                                                    className={
                                                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                                                    }
                                                >
                                                    انجام شده
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <ClockIcon
                                                    className={`w-4 h-4 ${
                                                        isDark ? 'text-amber-400' : 'text-amber-600'
                                                    }`}
                                                />
                                                <span
                                                    className={
                                                        isDark ? 'text-amber-400' : 'text-amber-700'
                                                    }
                                                >
                                                    در انتظار
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className={`flex flex-col gap-1 p-2.5 rounded-[2px] border ${
                                        isDark
                                            ? 'bg-tactical-canvas border-slate-400/15'
                                            : 'bg-slate-50 border-slate-900/10'
                                    }`}
                                >
                                    <span
                                        className={`text-[10px] font-medium ${
                                            isDark ? 'text-slate-400' : 'text-slate-500'
                                        }`}
                                    >
                                        دوره تکرار
                                    </span>
                                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                                        <ArrowPathIcon
                                            className={`w-4 h-4 ${
                                                PERIOD_TEXT_COLORS[selectedRoutine.period] ||
                                                'text-slate-400'
                                            }`}
                                        />
                                        <span>
                                            {PERIOD_LABELS[selectedRoutine.period] || 'نامشخص'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MonthlyRadar;