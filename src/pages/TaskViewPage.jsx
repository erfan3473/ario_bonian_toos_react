// src/pages/TaskViewPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate , useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import TaskDetailPanel from '../components/Task/TaskDetailPanel';
import { FaSpinner, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';

const TaskViewPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const returnTab = location.state?.returnTab || 'inbox';

    const { userInfo } = useSelector((state) => state.userLogin);

    const [taskData, setTaskData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTaskDetail = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axiosInstance.get(`/tasks/${id}/`);
            setTaskData(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'خطا در بارگیری جزئیات ماموریت');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userInfo && id) {
            fetchTaskDetail();
        }
    }, [id, userInfo]);

    const handleBack = () => {
        // ✅ بازگشت به همون تب که بودیم
        navigate(`/tasks?tab=${returnTab}`);
    };
    
    if (loading) {
        return (
            <div className="min-h-screen bg-[#131314] flex items-center justify-center">
                <FaSpinner className="animate-spin text-blue-500 text-5xl" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#131314] flex items-center justify-center p-4" dir="rtl">
                <div className="bg-[#1e1f20] border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
                    <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-white font-bold text-xl mb-2">خطا در بارگیری</h2>
                    <p className="text-gray-400 text-sm mb-6">{error}</p>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-medium"
                    >
                        <FaChevronRight size={12} />
                        بازگشت به لیست
                    </button>
                </div>
            </div>
        );
    }

    if (!taskData) {
        return (
            <div className="min-h-screen bg-[#131314] flex items-center justify-center p-4" dir="rtl">
                <div className="text-center">
                    <h2 className="text-white font-bold text-xl mb-2">ماموریت یافت نشد</h2>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 mx-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors font-medium mt-4"
                    >
                        <FaChevronRight size={12} />
                        بازگشت به لیست
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#131314]" dir="rtl">
            {/* دکمه بازگشت در desktop */}
            <div className="hidden lg:block container mx-auto px-4 py-4 max-w-6xl">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                    <FaChevronRight size={12} />
                    بازگشت به لیست ماموریت‌ها
                </button>
            </div>

            {/* محتوای اصلی */}
            <div className="container mx-auto px-4 pb-6 max-w-6xl">
                <div className="bg-[#1e1f20] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                    <TaskDetailPanel
                        taskData={taskData}
                        currentUserId={userInfo?.user_id}
                        onRefresh={fetchTaskDetail}
                        onBack={handleBack}
                    />
                </div>
            </div>
        </div>
    );
};

export default TaskViewPage;
