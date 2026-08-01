import React, { useState } from 'react';
import { FaCalendarAlt, FaChevronUp, FaChevronDown, FaTimes, FaCheckCircle, FaRegCircle } from 'react-icons/fa';

const MonthlyRadar = ({ monthDays, weeklyRoutines, setBaseDate, isDark, jalaliMonthName }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState(null);

    const getDotColor = (urgency, isDone) => {
        const base = urgency === 'EXPERT' ? 'bg-red-500' :
                     urgency === 'HARD' ? 'bg-orange-500' :
                     urgency === 'MEDIUM' ? 'bg-blue-500' : 'bg-emerald-500';
        return isDone ? `${base} opacity-40` : `${base} shadow-sm ring-1 ring-black/20 dark:ring-white/10`;
    };

    const getDifficultyLabel = (urgency) => {
        const labels = { 'EASY': 'آسان', 'MEDIUM': 'متوسط', 'HARD': 'سخت', 'EXPERT': 'بسیار سخت' };
        return labels[urgency] || 'نامشخص';
    };

    return (
        <>
            {/* بدنه تقویم با گوشه‌های تیزتر و سایه قوی‌تر در لایت مود */}
            <div className={`mb-5 shrink-0 rounded-sm border shadow-md transition-all duration-300 relative overflow-hidden ${isDark ? 'bg-gray-900 border-gray-600' : 'bg-amber-50/40 border-gray-400'}`}>
                
                {/* فنر / منگنه تقویم */}
                <div className={`h-3 w-full flex justify-evenly items-center px-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-300 border-gray-400'}`}>
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className={`w-1.5 h-4 rounded-full shadow-inner ${isDark ? 'bg-gray-900' : 'bg-gray-500'}`}></div>
                    ))}
                </div>

                {/* هدر ماه‌شمار */}
                <div 
                    className={`flex items-center justify-center p-3 cursor-pointer select-none relative group border-b ${isDark ? 'border-gray-700 hover:bg-gray-800/50' : 'border-gray-300 hover:bg-white/60'}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        <FaCalendarAlt className={`text-xl group-hover:scale-110 transition-transform ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                        <span className={`text-lg md:text-xl font-black tracking-wide ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                            {jalaliMonthName}
                        </span>
                    </div>
                    <button className={`absolute left-3 p-1.5 rounded-sm transition-colors ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm'}`}>
                        {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                    </button>
                </div>

                {/* گرید تقویم */}
                {isExpanded && (
                    <div className={`p-2 pt-1 animate-fade-in ${isDark ? 'bg-gray-900/50' : 'bg-white'}`}>
                        <div className="grid grid-cols-7 gap-1 text-center mb-1 mt-1">
                            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((dayName, idx) => (
                                <div key={idx} className={`text-[11px] font-black ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{dayName}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {monthDays.map((day) => {
                                const dayRoutines = weeklyRoutines[day.apiDate] || [];
                                const allItems = dayRoutines.flatMap(r => 
                                    (r.items || []).map(item => ({
                                        ...item,
                                        difficulty: r.template_details?.difficulty || 'MEDIUM'
                                    }))
                                );

                                return (
                                    <div 
                                        key={day.apiDate} 
                                        onClick={(e) => { e.stopPropagation(); setBaseDate(day.dateObj); }}
                                        className={`relative min-h-[50px] p-1 flex flex-col items-center rounded-sm border cursor-pointer transition-colors duration-200 
                                        ${day.isCurrentWeek ? (isDark ? 'border-indigo-500/50 bg-indigo-900/40' : 'border-indigo-400 bg-indigo-50 shadow-sm') : (isDark ? 'border-gray-700 bg-gray-800/40 hover:bg-gray-700' : 'border-gray-300 bg-gray-50 hover:bg-gray-100')}
                                        ${day.isToday ? 'ring-2 ring-amber-500 shadow-md' : ''}`}
                                    >
                                        <div className="w-full flex justify-between items-start">
                                            <span className={`text-[9px] truncate ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{day.monthName}</span>
                                            <span className={`text-xs font-black ${day.isToday ? 'text-amber-600 dark:text-amber-500' : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                                                {day.dayNum}
                                            </span>
                                        </div>
                                        
                                        <div className="w-full flex flex-wrap justify-center gap-[3px] mt-1 px-[1px]">
                                            {allItems.slice(0, 8).map((item) => (
                                                <div 
                                                    key={item.id} 
                                                    onClick={(e) => { e.stopPropagation(); setSelectedRoutine(item); }}
                                                    title="مشاهده جزئیات"
                                                    className={`w-2 h-2 rounded-full cursor-pointer hover:scale-150 transition-transform ${getDotColor(item.difficulty, item.is_done)}`} 
                                                />
                                            ))}
                                            {allItems.length > 8 && (
                                                <div className="w-2 h-2 flex items-center justify-center">
                                                    <span className={`text-[7px] font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>+</span>
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

            {/* دیالوگ نمایش جزئیات روتین */}
            {selectedRoutine && (
                <div 
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4" 
                    onClick={() => setSelectedRoutine(null)}
                >
                    <div 
                        className={`w-full max-w-sm p-5 rounded-md shadow-2xl border border-t-4 ${isDark ? 'bg-gray-800 border-gray-600 border-t-indigo-500' : 'bg-white border-gray-300 border-t-indigo-600'}`} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-start mb-4 border-b pb-3 dark:border-gray-700 border-gray-200">
                            <h3 className={`font-black text-lg ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>جزئیات وظیفه</h3>
                            <button onClick={() => setSelectedRoutine(null)} className={`p-1 rounded-sm transition-colors ${isDark ? 'bg-gray-700 text-gray-400 hover:text-red-400' : 'bg-gray-100 text-gray-600 hover:text-red-500 hover:bg-gray-200'}`}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className={`text-xs font-bold block mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>عنوان:</span>
                                <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedRoutine.title}</p>
                            </div>
                            <div className="flex justify-between items-center bg-black/5 dark:bg-black/20 p-2 rounded-sm">
                                <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>وضعیت:</span>
                                <div className="flex items-center gap-1 font-bold">
                                    {selectedRoutine.is_done ? (
                                        <><FaCheckCircle className="text-green-500"/> <span className="text-green-600 dark:text-green-400">انجام شده</span></>
                                    ) : (
                                        <><FaRegCircle className="text-amber-500"/> <span className="text-amber-600 dark:text-amber-400">در انتظار</span></>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center border-t pt-3 dark:border-gray-700 border-gray-200">
                                <span className={`text-xs font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>درجه سختی:</span>
                                <span className={`text-xs font-black px-2 py-1 rounded-sm ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
                                    {getDifficultyLabel(selectedRoutine.difficulty)}
                                </span>
                            </div>
                        </div>
                        <div className="mt-6">
                            <button onClick={() => setSelectedRoutine(null)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-sm shadow-md transition-colors">
                                متوجه شدم
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MonthlyRadar;