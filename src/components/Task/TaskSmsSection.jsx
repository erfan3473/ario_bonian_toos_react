import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPaperclip, FaSpinner, FaSearch } from 'react-icons/fa';
import { refreshSmsStatus } from '../../features/task/taskSlice';

const TaskSmsSection = ({ smsLogs, onRefresh }) => {
    const dispatch = useDispatch();
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    // استیت‌های لودینگ و خطا برای هر پیامک به صورت مجزا
    const [loadingId, setLoadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState({});

    const handleRefreshStatus = async (smsId) => {
        setLoadingId(smsId);
        setErrorMsg(prev => ({ ...prev, [smsId]: null }));
        
        try {
            await dispatch(refreshSmsStatus(smsId)).unwrap();
            // مهم: صدا زدن onRefresh تا دیتای تسک مجددا از بک‌اند لود شده و نتیجه نمایش داده شود
            if (onRefresh) onRefresh(); 
        } catch (err) {
            setErrorMsg(prev => ({ ...prev, [smsId]: 'خطا در ارتباط با سرور یا سرویس پیامک' }));
        } finally {
            setLoadingId(null);
        }
    };

    if (!smsLogs || smsLogs.length === 0) return null;

    return (
        <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <FaPaperclip size={12} className="text-orange-500" />
                </div>
                وضعیت ارسال پیامک ({smsLogs.length})
            </h3>
            <div className={`rounded-2xl p-4 border space-y-3 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
                {smsLogs.map((sms, index) => {
                    const kindLabel = sms.kind === 'ASSIGN' ? 'ارجاع/ایجاد' : 'یادآوری';
                    const statusLabel =
                        sms.delivery_status === 'SENT' ? 'ارسال شده به سامانه' :
                        sms.delivery_status === 'DELIVERED' ? 'تحویل شد' :
                        sms.delivery_status === 'FAILED' ? 'ناموفق' : 'نامشخص';
                    const statusColor =
                        sms.delivery_status === 'DELIVERED' ? 'text-green-500' :
                        sms.delivery_status === 'FAILED' ? 'text-red-500' :
                        sms.delivery_status === 'SENT' ? 'text-yellow-500' : 'text-gray-500';

                    return (
                        <div key={sms.id} className={`flex items-start gap-3 text-sm p-3 rounded-xl border ${index !== smsLogs.length - 1 ? `mb-3 ${isDark ? 'border-slate-800' : 'border-gray-200'}` : ''} ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
                            <div className={`flex-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{sms.to_user_name || 'کاربر نامشخص'}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-slate-800 border-slate-700 text-gray-400' : 'bg-white border-gray-300 text-gray-600'}`}>{kindLabel}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
                                </div>
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} space-y-1`}>
                                    <div>شماره: {sms.phone}</div>
                                    <div>زمان ارسال: {new Date(sms.created_at).toLocaleString('fa-IR')}</div>
                                    {sms.checked_at && <div>آخرین بررسی: {new Date(sms.checked_at).toLocaleString('fa-IR')}</div>}

                                    {sms.error && (
                                        <div className="text-red-500 text-xs mt-2 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                                            خطا: {sms.error}
                                        </div>
                                    )}
                                    {errorMsg[sms.id] && (
                                        <div className="text-orange-500 text-xs mt-2 p-2 bg-orange-500/10 rounded-lg">
                                            {errorMsg[sms.id]}
                                        </div>
                                    )}
                                    
                                    {(sms.delivery_status !== 'DELIVERED' && sms.delivery_status !== 'FAILED') && (
                                        <button
                                            onClick={() => handleRefreshStatus(sms.id)}
                                            disabled={loadingId === sms.id}
                                            className={`mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${isDark ? 'border-slate-700 bg-slate-800 text-blue-400 hover:bg-slate-700' : 'border-gray-300 bg-white text-blue-600 hover:bg-gray-100'}`}
                                        >
                                            {loadingId === sms.id ? <FaSpinner className="animate-spin" /> : <FaSearch size={10} />}
                                            استعلام وضعیت پیامک
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TaskSmsSection;
