import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { fetchWorkerStatus, clockWorkerAction } from '../features/workers/workerSlice';
import { FaClock, FaPlay, FaStop, FaHistory, FaMoneyBillWave, FaProjectDiagram } from 'react-icons/fa';

const WebAttendanceScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  // خواندن استیت‌ها از ریداکس
  const { data: statusData, loading } = useSelector((state) => state.workers.workerStatus);
  const actionLoading = useSelector((state) => state.workers.clockActionLoading);

  useEffect(() => {
    dispatch(fetchWorkerStatus());
  }, [dispatch]);

  // دریافت لوکیشن از مرورگر
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('مرورگر شما از قابلیت مکان‌یابی پشتیبانی نمی‌کند.'));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            long: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let errorMsg = 'خطا در دریافت مکان.';
          if (error.code === 1) errorMsg = 'لطفاً دسترسی به مکان (Location) را در مرورگر مجاز کنید.';
          if (error.code === 2) errorMsg = 'مکان شما یافت نشد.';
          if (error.code === 3) errorMsg = 'زمان درخواست مکان‌یابی تمام شد.';
          reject(new Error(errorMsg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // هندل کردن اکشن‌ها
  // هندل کردن اکشن‌ها
  const handleClockAction = async (action) => {
    toast.loading('در حال دریافت موقعیت مکانی...', { id: 'location-toast' });
    
    try {
      const location = await getLocation();
      toast.dismiss('location-toast');

      const payload = {
        action: action,
        lat: location.lat,
        long: location.long,
        accuracy: location.accuracy,
      };

      // ارسال اکشن به ریداکس
      const resultAction = await dispatch(clockWorkerAction(payload)).unwrap();
      
      toast.success(
        resultAction.status === 'WORKING' ? 'ورود با موفقیت ثبت شد' : 
        resultAction.status === 'OVERTIME_STARTED' ? 'اضافه کاری شروع شد' : 'خروج با موفقیت ثبت شد'
      );
      
      // آپدیت مجدد اطلاعات صفحه بعد از ثبت موفق
      dispatch(fetchWorkerStatus());
      
    } catch (error) {
      toast.dismiss('location-toast');
      
      // ✅ حل مشکل سفیدی صفحه: 
      // استخراج درست پیامِ متنی از خطای ریداکس یا جاوااسکریپت
      const errorMessage = 
        typeof error === 'string' ? error : 
        error?.message ? error.message : 
        'خطا در ثبت عملیات';
        
      toast.error(errorMessage);
    }
  };

  if (loading && !statusData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!statusData) return null;

  if (!statusData.is_employee || !statusData.is_worker) {
    return (
      <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
        <FaHistory className="mx-auto text-4xl text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">عدم دسترسی</h2>
        <p className="opacity-80">{statusData.detail || 'پروفایل کارمندی/کارگری برای شما ثبت نشده است.'}</p>
      </div>
    );
  }

  const {
    clocked_in,
    overtime_active,
    current_project_name,
    earned_today,
    leave_balance_annual,
    today_shifts = [],
    today_overtimes = [],
    has_active_contract
  } = statusData;

  const isWorking = clocked_in;
  const isOvertime = overtime_active;
  const isIdle = !isWorking && !isOvertime;

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4 space-y-6" dir="rtl">
      
      <div className={`p-6 rounded-2xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <FaClock className="text-blue-500" /> سیستم حضور و غیاب
            </h1>
            <p className={`mt-2 text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <FaProjectDiagram /> پروژه فعال: <span className="font-bold text-blue-500">{current_project_name || 'ندارد'}</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className={`px-4 py-2 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className="text-xs opacity-70 mb-1">درآمد امروز</p>
              <p className="font-bold text-emerald-500 flex items-center gap-1">
                {earned_today ? earned_today.toLocaleString() : 0} <FaMoneyBillWave />
              </p>
            </div>
            {leave_balance_annual !== null && (
              <div className={`px-4 py-2 rounded-lg text-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="text-xs opacity-70 mb-1">مرخصی مانده</p>
                <p className="font-bold text-sky-500">{leave_balance_annual} روز</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-6 border-gray-200 dark:border-gray-700">
          
          <button
            onClick={() => handleClockAction('IN')}
            disabled={!has_active_contract || isWorking || isOvertime || actionLoading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 
              ${isIdle && has_active_contract 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed text-gray-500'}`}
          >
            <FaPlay className="text-3xl mb-2" />
            <span className="font-bold text-lg">شروع شیفت</span>
            {!has_active_contract && <span className="text-xs mt-1 text-red-500">قرارداد فعال ندارید</span>}
          </button>

          <button
            onClick={() => handleClockAction('OUT')}
            disabled={isIdle || actionLoading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 
              ${!isIdle 
                ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed text-gray-500'}`}
          >
            <FaStop className="text-3xl mb-2" />
            <span className="font-bold text-lg">پایان کار (خروج)</span>
          </button>

          <button
            onClick={() => handleClockAction('TO_OVERTIME')}
            disabled={!has_active_contract || isWorking || isOvertime || actionLoading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 
              ${isIdle && has_active_contract
                ? 'border-purple-500 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed text-gray-500'}`}
          >
            <FaHistory className="text-3xl mb-2" />
            <span className="font-bold text-lg">شروع اضافه‌کاری</span>
          </button>

        </div>
      </div>

      <div className={`p-6 rounded-2xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FaHistory className="text-blue-500" /> ترددهای امروز
        </h3>
        
        {today_shifts.length === 0 && today_overtimes.length === 0 ? (
          <p className="text-center py-4 opacity-70">امروز هیچ ترددی برای شما ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className={`text-xs uppercase bg-opacity-50 ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <tr>
                  <th className="px-4 py-3 rounded-tr-lg">نوع</th>
                  <th className="px-4 py-3">پروژه</th>
                  <th className="px-4 py-3">زمان ورود</th>
                  <th className="px-4 py-3">زمان خروج</th>
                  <th className="px-4 py-3 rounded-tl-lg">مدت (ساعت)</th>
                </tr>
              </thead>
              <tbody>
                {today_shifts.map((shift) => (
                  <tr key={`shift-${shift.id}`} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className="px-4 py-3 font-medium text-emerald-500">شیفت عادی</td>
                    <td className="px-4 py-3">{shift.project_name || '-'}</td>
                    <td className="px-4 py-3">{new Date(shift.time_in).toLocaleTimeString('fa-IR')}</td>
                    <td className="px-4 py-3">
                      {shift.time_out ? new Date(shift.time_out).toLocaleTimeString('fa-IR') : <span className="text-yellow-500 animate-pulse">در حال کار...</span>}
                    </td>
                    <td className="px-4 py-3 font-bold">{shift.hours > 0 ? shift.hours : '-'}</td>
                  </tr>
                ))}
                
                {today_overtimes.map((ot) => (
                  <tr key={`ot-${ot.id}`} className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                    <td className="px-4 py-3 font-medium text-purple-500">اضافه کاری</td>
                    <td className="px-4 py-3">{ot.project_name || '-'}</td>
                    <td className="px-4 py-3">{new Date(ot.time_in).toLocaleTimeString('fa-IR')}</td>
                    <td className="px-4 py-3">
                      {ot.time_out ? new Date(ot.time_out).toLocaleTimeString('fa-IR') : <span className="text-yellow-500 animate-pulse">در حال کار...</span>}
                    </td>
                    <td className="px-4 py-3 font-bold">{ot.hours > 0 ? ot.hours : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default WebAttendanceScreen;