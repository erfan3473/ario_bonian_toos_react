// src/components/routine/MonthlyRadar.jsx
import React, { useState } from 'react';
import { FaCalendarAlt, FaChevronDown, FaTimes, FaCheckCircle, FaRegCircle, FaSyncAlt, FaListAlt } from 'react-icons/fa';

const PERIOD_COLORS = {
    'DAILY': 'bg-sky-500',
    'WEEKLY': 'bg-emerald-500',
    'MONTHLY': 'bg-purple-500',
    'YEARLY': 'bg-amber-500',
};

const PERIOD_LABELS = {
    'DAILY': 'روزانه',
    'WEEKLY': 'هفتگی',
    'MONTHLY': 'ماهانه',
    'YEARLY': 'سالانه',
};

const MonthlyRadar = ({ monthDays, weeklyRoutines, setBaseDate, isDark, jalaliMonthName, jalaliYear }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState(null);

    const getDotColor = (period, isDone) => {
        const base = PERIOD_COLORS[period] || 'bg-gray-500';
        return isDone ? `${base} opacity-30` : `${base} shadow-sm ring-1 ring-black/10 dark:ring-white/10`;
    };

    return (
        <>
            {/* یه mt-3 به کل کانتینر دادیم که فنرها جا داشته باشن بزنن بیرون */}
            <div className={`mt-3 mb-2 shrink-0 rounded-sm border shadow-sm transition-all duration-300 relative ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-orange-50 border-gray-300'}`}>
                
                {/* 🌟 افکت سیم‌پیچ (فنر واقعی) */}
                <div className="absolute top-0 left-0 right-0 flex justify-evenly -mt-2 z-20 pointer-events-none px-3">
                    {[...Array(14)].map((_, i) => (
                        <div key={i} className={`w-2 h-4 rounded-full shadow-[0_2px_2px_rgba(0,0,0,0.4)] border-b-2 ${isDark ? 'bg-gradient-to-b from-gray-500 via-gray-400 to-gray-700 border-gray-900' : 'bg-gradient-to-b from-gray-300 via-gray-100 to-gray-400 border-gray-500'}`}></div>
                    ))}
                </div>

                {/* هدر رادار */}
                <div 
                    className={`flex items-center justify-between py-2 px-3 cursor-pointer select-none relative group border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-300 hover:bg-white/60'}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt className={`text-xl group-hover:scale-110 transition-transform ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <span className={`text-lg md:text-xl font-black tracking-wide ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                            {jalaliMonthName} <span className="opacity-60 font-bold ml-1 text-sm">{jalaliYear}</span>
                        </span>
                    </div>

                    {/* دکمه باز و بسته شدن (ضربدر) */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        className={`p-1.5 rounded-sm transition-all shadow-sm border ${isDark ? 'bg-gray-900 border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                        title={isExpanded ? 'بستن تقویم' : 'باز کردن تقویم'}
                    >
                        {isExpanded ? <FaTimes size={12} className="text-red-500" /> : <FaChevronDown size={12} />}
                    </button>
                </div>

                {/* گرید تقویم با ارتفاع کاهش یافته */}
                {isExpanded && (
                    <div className={`p-2 pt-1 animate-fade-in ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                        <div className={`flex flex-wrap justify-center gap-3 py-1.5 mb-1.5 border-b border-dashed ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
                            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${PERIOD_COLORS[key]}`}></div>
                                    <span className={`text-[9px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</span>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-1.5 mt-1">
                            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayName, idx) => (
                                <div key={idx} className={`text-[11px] md:text-xs font-black ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dayName}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {monthDays.map((day) => {
                                const dayRoutines = weeklyRoutines[day.apiDate] || [];
                                const allItems = dayRoutines.flatMap(r => 
                                    (r.items || []).map(item => ({
                                        ...item,
                                        period: r.template_details?.period || 'DAILY',
                                        parentTitle: r.title || r.template_details?.title
                                    }))
                                );

                                // ارتفاع رو از 55 به 42 کاهش دادیم
                                // ارتفاع رو چون قابلیت باز و بسته شدن داریم، بزرگتر کردیم (52px)
                                let dayClass = 'relative min-h-[52px] p-1 flex flex-col items-center rounded-sm border cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md ';
                                if (day.isCurrentWeek) {
                                    dayClass += isDark ? 'border-indigo-500/50 bg-indigo-900/40' : 'border-indigo-400 bg-indigo-50 shadow-sm';
                                } else {
                                    dayClass += isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50';
                                }
                                if (day.isToday) {
                                    dayClass += ' ring-1 ring-amber-500 bg-amber-500/10';
                                }

                                return (
                                    <div key={day.apiDate} onClick={(e) => { e.stopPropagation(); setBaseDate(day.dateObj); }} className={dayClass}>
                                        <div className="w-full flex justify-between items-start px-1">
                                            <span className={`text-[9px] truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{day.monthName}</span>
                                            <span className={`text-xs md:text-sm font-black ${day.isToday ? 'text-amber-600 dark:text-amber-500' : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                                                {day.dayNum}
                                            </span>
                                        </div>
                                        
                                        <div className="w-full flex flex-wrap justify-center gap-1 mt-1">
                                            {allItems.slice(0, 6).map((item) => (
                                                <div key={item.id} onClick={(e) => { e.stopPropagation(); setSelectedRoutine(item); }} title={item.title} className="p-0.5 cursor-pointer group z-10">
                                                    {/* سایز نقطه‌ها رو برای کلیک و تاچ راحت‌تر درشت‌تر کردیم */}
                                                    <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full group-hover:scale-[1.5] transition-transform ${getDotColor(item.period, item.is_done)}`} />
                                                </div>
                                            ))}
                                            {allItems.length > 6 && (
                                                <div className="w-2.5 h-2.5 md:w-3 md:h-3 flex items-center justify-center mt-0.5">
                                                    <span className={`text-[10px] font-black ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>+</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* دیالوگ نمایش جزئیات (بدون افکت ماتِ سنگین) */}
            {selectedRoutine && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 animate-fade-in p-4" onClick={() => setSelectedRoutine(null)}>
                    <div className={`w-full max-w-sm p-5 rounded-md shadow-2xl border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4 border-b pb-2 dark:border-gray-700 border-gray-200">
                            <h3 className={`font-black text-lg flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>
                                <FaListAlt /> جزئیات وظیفه
                            </h3>
                            <button onClick={() => setSelectedRoutine(null)} className={`p-1.5 rounded-sm transition-colors ${isDark ? 'bg-gray-700 text-gray-400 hover:text-red-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:text-red-500 hover:bg-gray-200'}`}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <span className={`text-xs font-bold block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>عنوان روتین مادر:</span>
                                <p className={`font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedRoutine.parentTitle}</p>
                            </div>
                            <div className={`p-2 rounded-sm border-r-4 ${isDark ? 'bg-gray-900 border-indigo-500' : 'bg-indigo-50 border-indigo-500'}`}>
                                <span className={`text-xs font-bold block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>وظیفه (آیتم):</span>
                                <p className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRoutine.title}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className={`flex flex-col gap-1 p-2 rounded-sm ${isDark ? 'bg-gray-900' : 'bg-gray-50 border border-gray-200'}`}>
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>وضعیت</span>
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        {selectedRoutine.is_done ? (
                                            <><FaCheckCircle className="text-green-500"/> <span className="text-green-600 dark:text-green-400">انجام شده</span></>
                                        ) : (
                                            <><FaRegCircle className="text-amber-500"/> <span className="text-amber-600 dark:text-amber-400">در انتظار</span></>
                                        )}
                                    </div>
                                </div>
                                <div className={`flex flex-col gap-1 p-2 rounded-sm ${isDark ? 'bg-gray-900' : 'bg-gray-50 border border-gray-200'}`}>
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>دوره تکرار</span>
                                    <div className="flex items-center gap-1.5 font-bold text-xs">
                                        <FaSyncAlt className={PERIOD_COLORS[selectedRoutine.period]?.replace('bg-', 'text-')} />
                                        <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>
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