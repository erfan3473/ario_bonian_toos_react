// src/components/routine/RoutineTemplateCard.jsx

import React from 'react';
import { FaCalendarAlt, FaUserTie, FaTasks } from 'react-icons/fa';

const RoutineTemplateCard = ({ tpl, isDark }) => {
    return (
        <div className={`p-4 rounded-xl border flex flex-col h-full shadow-sm transition-shadow hover:shadow-md ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`font-bold text-base md:text-lg mb-3 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {tpl.title}
            </h3>
            
            <div className="space-y-2 text-xs md:text-sm mb-3">
                <p className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FaCalendarAlt className="text-indigo-400" /> 
                    تکرار: <span className="font-bold">{tpl.period_display || tpl.period}</span>
                </p>
                <p className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FaUserTie className="text-sky-400" /> 
                    هدف: <span className="font-bold">{tpl.target_name || '--'}</span>
                </p>
            </div>
            
            {/* لیست چک‌لیست‌ها (فقط نمایش) */}
            <div className={`flex-1 pt-3 mt-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <h4 className={`text-xs font-semibold mb-2 flex items-center gap-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    <FaTasks className="text-emerald-500" /> وظایف (چک‌لیست):
                </h4>
                {tpl.checklists && tpl.checklists.length > 0 ? (
                    <ul className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                        {tpl.checklists.map((item, idx) => (
                            <li key={item.id || idx} className={`text-[11px] flex items-start gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className="shrink-0 mt-[4px] text-[7px] text-indigo-400">■</span>
                                <span className="leading-relaxed">{item.title}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={`text-xs italic opacity-60 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>بدون وظیفه</p>
                )}
            </div>
            
            <div className={`pt-3 mt-3 border-t text-[11px] font-medium flex justify-between items-center ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                <span>تعداد آیتم‌ها: {tpl.checklists?.length || 0}</span>
                <span className={`px-2 py-0.5 rounded-full ${tpl.is_active ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {tpl.is_active ? 'فعال' : 'غیرفعال'}
                </span>
            </div>
        </div>
    );
};

export default RoutineTemplateCard;
