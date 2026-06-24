// src/pages/TaskListPage.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMyTaskInbox, fetchSentTasks } from '../features/task/taskSlice';
import TaskCreateModal from '../components/Task/TaskCreateModal';
import {
    FaInbox, FaPaperPlane, FaPlus, FaSpinner, FaCheckCircle,
    FaTimesCircle, FaClock, FaUser, FaChevronLeft, FaSearch, FaTimes
} from 'react-icons/fa';

const TASK_TYPE_LABELS = {
    PAYROLL_FORM: 'تکمیل فرم حقوق',
    PURCHASE: 'خرید/تدارکات',
    REPORT: 'گزارش‌دهی',
};

const STATUS_COLORS = {
    PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    DONE: 'bg-green-500/10 text-green-400 border-green-500/20',
    REJECTED: 'bg-red-500/10 text-red-400 border-red-500/20',
    CANCELLED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

const STATUS_LABELS = {
    PENDING: 'در انتظار',
    IN_PROGRESS: 'در جریان',
    DONE: 'انجام شده',
    REJECTED: 'رد شده',
    CANCELLED: 'لغو شده',
};

const TaskListPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get('tab') || 'inbox';

    const { userInfo } = useSelector((state) => state.userLogin);
    const { inbox, sentTasks, loadingInbox, loadingSent } = useSelector((state) => state.task);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (userInfo) {
            if (activeTab === 'inbox') {
                dispatch(fetchMyTaskInbox());
            } else {
                dispatch(fetchSentTasks());
            }
        }
    }, [dispatch, userInfo, activeTab]);

    const currentList = activeTab === 'inbox' ? inbox : sentTasks;

    const filteredList = currentList.filter((t) => {
        if (!search.trim()) return true;
        const s = search.toLowerCase();
        return (
            t.title?.toLowerCase().includes(s) ||
            t.note?.toLowerCase().includes(s) ||
            t.created_by_name?.toLowerCase().includes(s)
        );
    });

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
        setSearch('');
    };

    const handleTaskClick = (taskId) => {
        navigate(`/tasks/${taskId}`,{
            state : { returnTab : activeTab }
        });
    };

    const handleCreateSuccess = () => {
        setShowCreateModal(false);
        dispatch(fetchMyTaskInbox());
        dispatch(fetchSentTasks());
    };

    return (
        <div className="min-h-screen bg-[#131314] text-white" dir="rtl">
            <div className="container mx-auto px-4 py-6 max-w-6xl">
                
                {/* هدر */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
                            <FaInbox size={18} />
                        </div>
                        ماموریت‌های من
                    </h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/30 font-medium"
                    >
                        <FaPlus size={14} />
                        <span className="hidden sm:inline">ماموریت جدید</span>
                    </button>
                </div>

                {/* تب‌ها */}
                <div className="flex gap-2 mb-6 bg-[#1e1f20] p-1.5 rounded-xl border border-gray-800">
                    <button
                        onClick={() => handleTabChange('inbox')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                            activeTab === 'inbox'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-[#131314]'
                        }`}
                    >
                        <FaInbox size={16} />
                        <span>دریافتی</span>
                        {inbox.length > 0 && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {inbox.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange('sent')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
                            activeTab === 'sent'
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                : 'text-gray-400 hover:text-gray-200 hover:bg-[#131314]'
                        }`}
                    >
                        <FaPaperPlane size={16} />
                        <span>ارسالی</span>
                        {sentTasks.length > 0 && (
                            <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                {sentTasks.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* جستجو */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 bg-[#1e1f20] border border-gray-800 rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                        <FaSearch className="text-gray-500 shrink-0" size={14} />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجو در عنوان، توضیحات یا سازنده..."
                            className="bg-transparent text-white text-sm flex-1 outline-none placeholder-gray-600"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <FaTimes size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* لیست task‌ها */}
                {(loadingInbox || loadingSent) ? (
                    <div className="flex justify-center items-center py-20">
                        <FaSpinner className="animate-spin text-blue-500 text-4xl" />
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FaInbox size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-gray-400 text-lg font-medium mb-2">
                            {search.trim()
                                ? 'نتیجه‌ای یافت نشد'
                                : activeTab === 'inbox'
                                ? 'ماموریت دریافتی وجود ندارد'
                                : 'ماموریت ارسالی وجود ندارد'}
                        </h3>
                        <p className="text-gray-600 text-sm">
                            {search.trim()
                                ? 'عبارت دیگری را جستجو کنید'
                                : 'می‌توانید یک ماموریت جدید ایجاد کنید'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredList.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => handleTaskClick(task.id)}
                                className="bg-[#1e1f20] border border-gray-800 hover:border-gray-700 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-900/10 group"
                            >
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-gray-100 font-bold text-base mb-2 group-hover:text-blue-400 transition-colors leading-tight">
                                            {task.title}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                                                    STATUS_COLORS[task.status] || ''
                                                }`}
                                            >
                                                {STATUS_LABELS[task.status] || task.status}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium bg-[#131314] px-2.5 py-1 rounded-md border border-gray-800">
                                                {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                                            </span>
                                        </div>
                                    </div>
                                    <FaChevronLeft className="text-gray-600 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
                                </div>

                                {task.note && (
                                    <p className="text-gray-400 text-sm mb-3 line-clamp-2 leading-relaxed">
                                        {task.note}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                    {task.created_by_name && (
                                        <div className="flex items-center gap-1.5">
                                            <FaUser className="text-gray-600" size={10} />
                                            <span>{task.created_by_name}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <FaClock className="text-gray-600" size={10} />
                                        <span>
                                            {new Date(task.created_at).toLocaleDateString('fa-IR')}
                                        </span>
                                    </div>
                                    {task.active_assignees?.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-yellow-400">●</span>
                                            <span>
                                                {task.active_assignees.length} نفر در انتظار اقدام
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* مودال ایجاد */}
            {showCreateModal && (
                <TaskCreateModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default TaskListPage;
