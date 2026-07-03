// src/components/admin/settings/ReminderSettings.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReminderSettings, updateReminderSettings } from '../../../features/task/taskSlice';
import { FaSave, FaBell, FaInfoCircle, FaSync } from 'react-icons/fa';

// ✅ تغییر نام کلیدها از priority به urgency دقیقاً مطابق با دیتابیس شما
const urgencyLabels = {
  CRITICAL: 'بحرانی (Critical)',
  HIGH: 'بالا (High)',
  MEDIUM: 'متوسط (Medium)',
  LOW: 'پایین (Low)',
};

const urgencyColors = {
  CRITICAL: 'text-red-400 border-red-500/50 bg-red-900/10',
  HIGH: 'text-orange-400 border-orange-500/50 bg-orange-900/10',
  MEDIUM: 'text-blue-400 border-blue-500/50 bg-blue-900/10',
  LOW: 'text-gray-400 border-gray-500/50 bg-gray-900/10',
};

const ReminderSettings = () => {
  const dispatch = useDispatch();
  
  // ✅ استخراج دقیق استیت‌ها از Redux
  const { 
    reminderSettings, 
    loadingReminderSettings, 
    updatingReminderSettings, 
    error 
  } = useSelector((state) => state.task);
  
  const [localSettings, setLocalSettings] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');

  // تابع دریافت مجدد اطلاعات (رفرش)
  const handleRefresh = () => {
    dispatch(fetchReminderSettings());
    setSaveMessage('');
  };

  useEffect(() => {
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  // سینک کردن دیتای بک‌اند با فرم لوکال
  useEffect(() => {
    if (reminderSettings && reminderSettings.length > 0) {
      setLocalSettings(reminderSettings);
    }
  }, [reminderSettings]);

  const handleInputChange = (index, field, value) => {
    const updated = [...localSettings];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSettings(updated);
  };

  const handleSave = async () => {
    setSaveMessage('');
    try {
      // استفاده از unwrap برای گرفتن نتیجه پرامیس از Thunk
      await dispatch(updateReminderSettings(localSettings)).unwrap();
      setSaveMessage('✅ تنظیمات با موفقیت ذخیره شد.');
      // بعد از ۳ ثانیه پیام موفقیت پاک شود
      setTimeout(() => setSaveMessage(''), 3000);
      // رفرش مجدد برای اطمینان از سینک بودن با دیتابیس
      dispatch(fetchReminderSettings());
    } catch (err) {
      console.error("خطا در ذخیره:", err);
    }
  };

  if (loadingReminderSettings && localSettings.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-48 gap-4">
        <div className="animate-spin text-4xl text-blue-500"><FaSync /></div>
        <p className="text-gray-400">در حال دریافت قوانین از دیتابیس...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in text-right" dir="rtl">
      
      {/* هدر و دکمه‌ها */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-700 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaBell className="text-yellow-400" />
            قوانین یادآوری پیامکی ماموریت‌ها
          </h2>
          <p className="text-gray-400 mt-1 text-sm">
            فاصله زمانی و فعال/غیرفعال بودن ارسال پیامک خودکار را بر اساس اولویت ماموریت تعیین کنید.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={loadingReminderSettings || updatingReminderSettings}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg font-bold transition disabled:opacity-50"
            title="بارگذاری مجدد"
          >
            <FaSync className={loadingReminderSettings ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleSave}
            disabled={updatingReminderSettings || loadingReminderSettings}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold transition disabled:opacity-50 min-w-[140px] justify-center"
          >
            {updatingReminderSettings ? (
              <><FaSync className="animate-spin" /> در حال ذخیره...</>
            ) : (
              <><FaSave /> ذخیره تغییرات</>
            )}
          </button>
        </div>
      </div>

      {/* نمایش پیام‌ها (ارور یا موفقیت) */}
      {error && (
        <div className="mb-6 bg-red-900/30 border border-red-500 rounded-lg p-4 text-red-200">
          <p className="font-bold flex items-center gap-2">
            <span>❌</span> خطا در برقراری ارتباط:
          </p>
          <p className="mt-1 text-sm">
            {typeof error === 'string' ? error : JSON.stringify(error)}
          </p>
        </div>
      )}

      {saveMessage && (
        <div className="mb-6 bg-green-900/30 border border-green-500 rounded-lg p-4 text-green-200 font-bold transition-all">
          {saveMessage}
        </div>
      )}

      {/* فرم‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {localSettings.map((setting, index) => (
          <div
            key={setting.id || setting.urgency}
            className={`p-5 rounded-xl border transition-all ${urgencyColors[setting.urgency] || 'border-gray-700 bg-gray-800'}`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">
                {setting.urgency_display || urgencyLabels[setting.urgency] || setting.urgency}
              </h3>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={setting.is_active}
                  onChange={(e) => handleInputChange(index, 'is_active', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span className="mr-3 text-sm font-medium text-gray-200">
                  {setting.is_active ? 'فعال' : 'غیرفعال'}
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  شروع یادآوری (چند ساعت قبل از مهلت)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={setting.start_before_hours}
                    onChange={(e) => handleInputChange(index, 'start_before_hours', Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                    disabled={!setting.is_active}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">ساعت</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  تکرار یادآوری (هر چند ساعت یکبار)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={setting.interval_hours}
                    onChange={(e) => handleInputChange(index, 'interval_hours', Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg p-2.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                    disabled={!setting.is_active}
                  />
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">ساعت</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <FaInfoCircle className="text-blue-400 text-xl flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-bold mb-1">نحوه عملکرد سیستم یادآوری:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-300">
            <li>فقط برای ماموریت‌هایی که وضعیت آن‌ها <strong>«در حال انجام» (In Progress)</strong> است پیامک ارسال می‌شود.</li>
            <li>اگر «تکرار یادآوری» برابر ۰ باشد، پیامک فقط <strong>یک‌بار</strong> ارسال می‌گردد.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;
