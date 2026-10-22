import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaSpinner, FaSearch, FaBell, FaEnvelope } from 'react-icons/fa';
import { refreshSmsStatus } from '../../features/task/taskSlice';

const TaskSmsSection = ({ 
    assignLogs = [], 
    reminderLogs = [], 
    taskUrgency, 
    reminderSettings = [], 
    onRefresh 
}) => {
    const dispatch = useDispatch();
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const [loadingId, setLoadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState({});

    const handleRefreshStatus = async (smsId) => {
        console.log("🟡 دکمه استعلام فشرده شد. شناسه پیامک (logId):", smsId);
        setLoadingId(smsId);
        setErrorMsg(prev => ({ ...prev, [smsId]: null }));
        
        try {
            const result = await dispatch(refreshSmsStatus(smsId)).unwrap();
            console.log("✅ پاسخ موفق استعلام پیامک:", result);
            if (onRefresh) onRefresh(); 
        } catch (err) {
            console.error("❌ خطا در استعلام وضعیت پیامک:", err);
            const msg = typeof err === 'string' ? err : (err?.message || 'خطا در ارتباط با سرور یا سرویس پیامک');
            setErrorMsg(prev => ({ ...prev, [smsId]: msg }));
        } finally {
            setLoadingId(null);
        }
    };

    const renderSmsList = (logs, title) => {
        return (
            <div className={`rounded-2xl p-4 border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                {logs && logs.length > 0 ? (
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
                            <div 
                                key={sms.id || index} 
                                className={`flex items-start gap-3 text-sm p-3 rounded-xl border ${
                                    index !== logs.length - 1 ? `mb-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}` : ''
                                } ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}
                            >
                                <div className={`flex-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{sms.to_user_name || 'کاربر نامشخص'}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
                                    </div>
                                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} space-y-1`}>
                                        <div>شماره: {sms.phone}</div>
                                        <div>شناسه ارسال (recId): {sms.rec_id || 'ندارد'}</div>
                                        <div>زمان ارسال: {sms.created_at ? new Date(sms.created_at).toLocaleString('fa-IR') : 'نامشخص'}</div>
                                        
                                        {sms.error && (
                                            <div className="text-red-400 text-xs mt-1">
                                                متن خطا: {sms.error}
                                            </div>
                                        )}

                                        {errorMsg[sms.id] && (
                                            <div className="text-red-500 font-bold mt-1 text-xs">
                                                ⚠️ {errorMsg[sms.id]}
                                            </div>
                                        )}

                                        {(sms.delivery_status !== 'DELIVERED' && sms.delivery_status !== 'FAILED') && (
                                            <button
                                                type="button"
                                                onClick={() => handleRefreshStatus(sms.id)}
                                                disabled={loadingId === sms.id}
                                                className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 cursor-pointer ${
                                                    isDark 
                                                        ? 'border-slate-700 bg-slate-800 text-blue-400 hover:bg-slate-700' 
                                                        : 'border-gray-300 bg-white text-blue-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {loadingId === sms.id ? <FaSpinner className="animate-spin" size={10} /> : <FaSearch size={10} />}
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
            <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 mb-3 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <FaEnvelope size={12} className="text-blue-500" />
                    </div>
                    پیامک‌های ایجاد و ارجاع ({assignLogs?.length || 0})
                </h3>
                {renderSmsList(assignLogs, 'پیامک‌های ایجاد و ارجاع')}
            </div>
            
            <div>
                <h3 className={`text-sm font-bold flex items-center gap-2 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <FaBell size={12} className="text-orange-500" />
                    </div>
                    پیامک‌های یادآوری سیستمی ({reminderLogs?.length || 0})
                </h3>

                {renderSmsList(reminderLogs, 'پیامک‌های یادآوری سیستمی')}
            </div>
        </div>
    );
};

export default TaskSmsSection;