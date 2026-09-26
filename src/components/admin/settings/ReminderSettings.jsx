import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReminderSettings, updateReminderSettings } from '../../../features/task/taskSlice';
import { FaSave, FaBell, FaInfoCircle, FaSync } from 'react-icons/fa';

const urgencyLabels = {
  CRITICAL: 'بحرانی (Critical)',
  HIGH: 'بالا (High)',
  MEDIUM: 'متوسط (Medium)',
  LOW: 'پایین (Low)',
};

const urgencyColors = (isDark) => ({
  CRITICAL: isDark ? 'text-red-400 border-red-500/50 bg-red-900/10' : 'text-red-700 border-red-200 bg-red-50',
  HIGH: isDark ? 'text-orange-400 border-orange-500/50 bg-orange-900/10' : 'text-orange-700 border-orange-200 bg-orange-50',
  MEDIUM: isDark ? 'text-blue-400 border-blue-500/50 bg-blue-900/10' : 'text-blue-700 border-blue-200 bg-blue-50',
  LOW: isDark ? 'text-gray-400 border-gray-500/50 bg-gray-900/10' : 'text-gray-600 border-gray-200 bg-gray-50',
});

const ReminderSettings = () => {
  const dispatch = useDispatch();
  
  const { reminderSettings, loadingReminderSettings, updatingReminderSettings, error } = useSelector((state) => state.task);
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";
  
  const [localSettings, setLocalSettings] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');
  
  const colors = urgencyColors(isDark);

  const handleRefresh = () => {
    dispatch(fetchReminderSettings());
    setSaveMessage('');
  };

  useEffect(() => {
    handleRefresh();
  }, [dispatch]);

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
      await dispatch(updateReminderSettings(localSettings)).unwrap();
      setSaveMessage('✅ تنظیمات با موفقیت ذخیره شد.');
      setTimeout(() => setSaveMessage(''), 3000);
      dispatch(fetchReminderSettings());
    } catch (err) {
      console.error("خطا در ذخیره:", err);
    }
  };

  if (loadingReminderSettings && localSettings.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-48 gap-4">
        <div className="animate-spin text-4xl text-blue-500"><FaSync /></div>
        <p className={`font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>در حال دریافت قوانین از دیتابیس...</p>
      </div>
    );
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 ${isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`;

  return (
    <div className="animate-fade-in text-right" dir="rtl">
      
      {/* هدر */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-4 border-b border-dashed border-gray-500/30 gap-4`}>
        <div>
          <h2 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            <FaBell className={isDark ? "text-yellow-400" : "text-yellow-500"} />
            قوانین یادآوری پیامکی ماموریت‌ها
          </h2>
          <p className={`mt-1.5 text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            فاصله زمانی و فعال/غیرفعال بودن ارسال پیامک خودکار را بر اساس اولویت ماموریت تعیین کنید.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleRefresh}
            disabled={loadingReminderSettings || updatingReminderSettings}
            className={`flex items-center justify-center p-3 rounded-xl font-bold transition shadow-sm disabled:opacity-50 ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
            title="بارگذاری مجدد"
          >
            <FaSync className={loadingReminderSettings ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleSave}
            disabled={updatingReminderSettings || loadingReminderSettings}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition disabled:opacity-50 shadow-md min-w-[150px]"
          >
            {updatingReminderSettings ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> در حال ذخیره...</>
            ) : (
              <><FaSave /> ذخیره تغییرات</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className={`mb-6 rounded-xl p-4 border flex items-center gap-2 font-bold ${isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-300 text-red-700'}`}>
          <span>❌</span> {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}

      {saveMessage && (
        <div className={`mb-6 rounded-xl p-4 border flex items-center gap-2 font-bold ${isDark ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-300 text-green-700'}`}>
          {saveMessage}
        </div>
      )}

      {/* فرم‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {localSettings.map((setting, index) => (
          <div
            key={setting.id || setting.urgency}
            className={`p-6 rounded-2xl border transition-all shadow-sm ${colors[setting.urgency] || (isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white')}`}
          >
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-500/20">
              <h3 className="font-black text-lg">
                {setting.urgency_display || urgencyLabels[setting.urgency] || setting.urgency}
              </h3>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={setting.is_active}
                  onChange={(e) => handleInputChange(index, 'is_active', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                <span className="mr-3 text-sm font-bold opacity-80">
                  {setting.is_active ? 'فعال' : 'غیرفعال'}
                </span>
              </label>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold opacity-80 mb-2">
                  شروع یادآوری (چند ساعت قبل از مهلت)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={setting.start_before_hours}
                    onChange={(e) => handleInputChange(index, 'start_before_hours', Number(e.target.value))}
                    className={inputClass}
                    disabled={!setting.is_active}
                  />
                  <span className={`absolute left-4 top-3 text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ساعت</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold opacity-80 mb-2">
                  تکرار یادآوری (هر چند ساعت یکبار)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={setting.interval_hours}
                    onChange={(e) => handleInputChange(index, 'interval_hours', Number(e.target.value))}
                    className={inputClass}
                    disabled={!setting.is_active}
                  />
                  <span className={`absolute left-4 top-3 text-sm font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>ساعت</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`mt-8 rounded-xl p-5 border flex items-start gap-3 shadow-sm ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
        <FaInfoCircle className={`text-xl flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
        <div className="text-sm">
          <p className={`font-black mb-1.5 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>نحوه عملکرد سیستم یادآوری:</p>
          <ul className={`list-disc list-inside space-y-1 font-medium ${isDark ? 'text-blue-100/80' : 'text-blue-900/80'}`}>
            <li>فقط برای ماموریت‌هایی که وضعیت آن‌ها <strong>«در حال انجام» (In Progress)</strong> است پیامک ارسال می‌شود.</li>
            <li>اگر «تکرار یادآوری» برابر ۰ باشد، پیامک فقط <strong>یک‌بار</strong> ارسال می‌گردد.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;