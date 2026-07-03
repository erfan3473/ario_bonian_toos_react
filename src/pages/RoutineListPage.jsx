import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyRoutines } from '../features/routine/routineSlice';
import { FaSyncAlt, FaCalendarAlt, FaCheckSquare, FaClock, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const RoutineListPage = () => {
    const dispatch = useDispatch();
    const { routines, loading, error } = useSelector((state) => state.routine);
    const mode = useSelector((state) => state.theme?.mode || "dark");
    const isDark = mode === "dark";

    useEffect(() => {
        dispatch(fetchMyRoutines());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    // تابع کمکی برای ترجمه دوره تکرار
    const getPeriodLabel = (period, scheduleValue) => {
        if (period === 'DAILY') return 'هر روز';
        if (period === 'WEEKLY') return `هفتگی (روزهای: ${scheduleValue || 'نامشخص'})`;
        if (period === 'MONTHLY') return `ماهانه (روزهای: ${scheduleValue || 'نامشخص'})`;
        if (period === 'YEARLY') return 'سالانه';
        return period;
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'URGENT': return 'text-red-500 bg-red-100 border-red-200';
            case 'HIGH': return 'text-orange-500 bg-orange-100 border-orange-200';
            case 'NORMAL': return 'text-blue-500 bg-blue-100 border-blue-200';
            case 'LOW': return 'text-gray-500 bg-gray-100 border-gray-200';
            default: return 'text-gray-500 bg-gray-100 border-gray-200';
        }
    };

    return (
        <div className="animate-fade-in p-2 md:p-4">
            <div className="flex justify-between items-center mb-6">
                <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <FaSyncAlt className="text-blue-500" />
                   گردش کار من
                </h1>
                <button
                    onClick={() => dispatch(fetchMyRoutines())}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold shadow-md"
                >
                    <FaSyncAlt className={loading ? "animate-spin" : ""} />
                    بروزرسانی
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                </div>
            ) : routines.length === 0 ? (
                <div className={`text-center py-12 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <FaCheckSquare className="mx-auto text-4xl mb-3 opacity-50" />
                    <p className="text-lg">هیچ وظیفه ثابتی برای شما یا سمت سازمانی‌تان یافت نشد.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {routines.map((routine) => (
                        <div key={routine.id} className={`rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}>
                            
                            {/* نوار رنگی بالای کارت */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>

                            <div className="flex justify-between items-start mb-4 mt-2">
                                <h3 className="font-bold text-lg leading-tight line-clamp-2">
                                    {routine.title}
                                </h3>
                                <span className={`text-xs px-2 py-1 rounded-md border font-bold shrink-0 ${getUrgencyColor(routine.urgency)}`}>
                                    {routine.urgency === 'URGENT' ? 'فوری' : routine.urgency === 'HIGH' ? 'بالا' : routine.urgency === 'NORMAL' ? 'عادی' : 'پایین'}
                                </span>
                            </div>

                            <p className={`text-sm mb-4 line-clamp-2 min-h-[40px] ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {routine.description || "بدون توضیحات"}
                            </p>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <FaCalendarAlt className="text-blue-500 w-4" />
                                    <span className="font-medium">تکرار:</span>
                                    <span>{getPeriodLabel(routine.period, routine.schedule_value)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <FaClock className="text-orange-500 w-4" />
                                    <span className="font-medium">مهلت انجام:</span>
                                    <span>{routine.deadline_hours} ساعت پس از ایجاد</span>
                                </div>
                            </div>

                            {routine.checklists && routine.checklists.length > 0 && (
                                <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                                    <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                                        <FaCheckSquare className="text-green-500" />
                                        چک‌لیست‌های این روتین ({routine.checklists.length})
                                    </h4>
                                    <ul className="space-y-1">
                                        {routine.checklists.slice(0, 3).map(cl => (
                                            <li key={cl.id} className={`text-xs flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                                {cl.title}
                                            </li>
                                        ))}
                                        {routine.checklists.length > 3 && (
                                            <li className="text-xs text-blue-500 font-bold mt-1">
                                                و {routine.checklists.length - 3} مورد دیگر...
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            <div className={`mt-4 pt-3 border-t text-xs flex justify-between items-center ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
                                <span className="flex items-center gap-1">
                                    <FaExclamationCircle />
                                    ایجاد خودکار توسط سیستم
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoutineListPage;
