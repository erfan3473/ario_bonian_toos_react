import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPaperclip, FaSpinner, FaSearch, FaBell, FaEnvelope } from 'react-icons/fa';
import { refreshSmsStatus } from '../../features/task/taskSlice';

const TaskSmsSection = ({ 
    assignLogs = [], 
    reminderLogs = [], 
    taskUrgency, // <--- فوریت تسک (مثل 'HIGH', 'CRITICAL')
    reminderSettings = [], // <--- تنظیمات یادآوری برای نمایش فواصل
    onRefresh 
}) => {
    const dispatch = useDispatch();
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const [loadingId, setLoadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState({});

    const handleRefreshStatus = async (smsId) => {
        // ... (همان کدهای قبلی شما برای handleRefreshStatus) ...
        setLoadingId(smsId);
        setErrorMsg(prev => ({ ...prev, [smsId]: null }));
        try {
            await dispatch(refreshSmsStatus(smsId)).unwrap();
            if (onRefresh) onRefresh(); 
        } catch (err) {
            setErrorMsg(prev => ({ ...prev, [smsId]: 'خطا در ارتباط با سرور یا سرویس پیامک' }));
        } finally {
            setLoadingId(null);
        }
    };

    // پیدا کردن تنظیمات مربوط به فوریت این ماموریت برای نمایش متن راهنما
    const currentSetting = reminderSettings?.find(s => s.urgency === taskUrgency);

    const renderSmsList = (logs, title, Icon, iconColor) => {
        // اگر خالی بود null برنگردان، بلکه آن را مدیریت می‌کنیم
        return (
            <div className={`rounded-2xl p-4 border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                {logs.length > 0 ? (
                    logs.map((sms, index) => {
                        const statusLabel =
                            sms.delivery_status === 'SENT' ? 'ارسال شده به سامانه' :
                            sms.delivery_status === 'DELIVERED' ? 'تحویل شد' :
                            sms.delivery_status === 'FAILED' ? 'ناموفق' : 'نامشخص';
                            
                        const statusColor =
                            sms.delivery_status === 'DELIVERED' ? 'text-green-500' :
                            sms.delivery_status === 'FAILED' ? 'text-red-500' :
                            sms.delivery_status === 'SENT' ? 'text-yellow-500' : 'text-gray-500';

                        return (
                            <div key={sms.id} className={`flex items-start gap-3 text-sm p-3 rounded-xl border ${index !== logs.length - 1 ? `mb-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}` : ''} ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
                                <div className={`flex-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{sms.to_user_name || 'کاربر نامشخص'}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} space-y-1`}>
                                        <div>شماره: {sms.phone}</div>
                                        <div>زمان ارسال: {new Date(sms.created_at).toLocaleString('fa-IR')}</div>
                                        
                                        {(sms.delivery_status !== 'DELIVERED' && sms.delivery_status !== 'FAILED') && (
                                            <button
                                                onClick={() => handleRefreshStatus(sms.id)}
                                                disabled={loadingId === sms.id}
                                                className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${isDark ? 'border-slate-700 bg-slate-800 text-blue-400 hover:bg-slate-700' : 'border-gray-300 bg-white text-blue-600 hover:bg-gray-100'}`}
                                            >
                                                {loadingId === sms.id ? <FaSpinner className="animate-spin" /> : <FaSearch size={10} />}
                                                استعلام وضعیت
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center p-3 text-xs text-gray-500">
                        پیامکی در این بخش ثبت نشده است.
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* پیامک‌های ایجاد و ارجاع */}
            <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 mb-3 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <FaEnvelope size={12} className="text-blue-500" />
                    </div>
                    پیامک‌های ایجاد و ارجاع ({assignLogs.length})
                </h3>
                {renderSmsList(assignLogs, 'پیامک‌های ایجاد و ارجاع', FaEnvelope, 'text-blue-500')}
            </div>
            
            {/* پیامک‌های یادآوری */}
            <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <FaBell size={12} className="text-orange-500" />
                    </div>
                    پیامک‌های یادآوری سیستمی ({reminderLogs.length})
                </h3>

                {/* نمایش منطق یادآوری */}
                {currentSetting ? (
                    <p className={`text-xs mb-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        * شروع یادآوری {currentSetting.start_before_hours} ساعت قبل از سررسید، 
                        تکرار هر {currentSetting.interval_hours} ساعت.
                    </p>
                ) : (
                    <p className="text-xs mb-3 text-gray-500">
                        * یادآوری بر اساس اولویت ماموریت ارسال می‌شود.
                    </p>
                )}

                {renderSmsList(reminderLogs, 'پیامک‌های یادآوری سیستمی', FaBell, 'text-orange-500')}
            </div>
        </div>
    );
};

export default TaskSmsSection;
