// src/screens/MyTasksScreen.jsx — کامل نهایی

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchMyTaskInbox, fetchSentTasks,
    fetchTaskDetail, clearActiveTask,
} from '../features/task/taskSlice';
import TaskCreateModal from '../components/Task/TaskCreateModal';
import TaskDetailPanel from '../components/Task/TaskDetailPanel';
import {
    FaPlus, FaInbox, FaSpinner,
    FaPaperPlane, FaClock,
} from 'react-icons/fa';

const TASK_TYPE_LABELS = {
    PAYROLL_FORM: 'فرم حقوق',
    PURCHASE:     'خرید',
    REPORT:       'گزارش',
};

const STATUS_BADGE = {
    PENDING:     'bg-yellow-500/20 text-yellow-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
    DONE:        'bg-green-500/20 text-green-400',
    REJECTED:    'bg-red-500/20 text-red-400',
    CANCELLED:   'bg-gray-500/20 text-gray-400',
};

const STATUS_LABEL = {
    PENDING:     'در انتظار',
    IN_PROGRESS: 'در جریان',
    DONE:        'انجام شده',
    REJECTED:    'رد شده',
    CANCELLED:   'لغو شده',
};

// ── کارت یک ماموریت ──
const TaskCard = ({ task, selected, onClick }) => (
    <div
        onClick={onClick}
        className={`p-4 border-b border-gray-700/60 cursor-pointer transition hover:bg-gray-700/40 ${
            selected ? 'bg-gray-700/60 border-r-2 border-r-blue-500' : ''
        }`}
    >
        <div className="text-white text-sm font-medium mb-1 truncate">
            {task.title}
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-xs text-gray-500">
                {TASK_TYPE_LABELS[task.task_type] || task.task_type}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[task.status] || ''}`}>
                {STATUS_LABEL[task.status] || task.status}
            </span>
        </div>

        {task.active_assignees?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
                {task.active_assignees.map((a) => (
                    <span
                        key={a.step_id}
                        className="text-xs bg-gray-600/60 text-gray-300 px-2 py-0.5 rounded-full"
                    >
                        {a.name}
                    </span>
                ))}
            </div>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-600">
            <FaClock size={10} />
            <span>{new Date(task.updated_at).toLocaleDateString('fa-IR')}</span>
        </div>
    </div>
);

// ── صفحه اصلی ──
const MyTasksScreen = () => {
    const dispatch = useDispatch();
    const {
        inbox, loadingInbox,
        sentTasks, loadingSent,
        activeTask, loadingDetail,
        needsInboxRefresh,
    } = useSelector((s) => s.task);
    const { userInfo } = useSelector((s) => s.userLogin);

    const [tab,            setTab]            = useState('inbox'); // 'inbox' | 'sent'
    const [showCreate,     setShowCreate]     = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);

    useEffect(() => {
        dispatch(fetchMyTaskInbox());
        dispatch(fetchSentTasks());
        return () => { dispatch(clearActiveTask()); };
    }, [dispatch]);

    // وقتی WS رویداد ASSIGNED میزنه
    useEffect(() => {
        if (needsInboxRefresh) dispatch(fetchMyTaskInbox());
    }, [needsInboxRefresh, dispatch]);

    const handleSelectTask = (taskId) => {
        if (taskId === selectedTaskId) return;
        dispatch(clearActiveTask());
        setSelectedTaskId(taskId);
        dispatch(fetchTaskDetail(taskId));
    };

    const handleCreateSuccess = () => {
        setShowCreate(false);
        dispatch(fetchMyTaskInbox());
        dispatch(fetchSentTasks());
    };

    const handleRefresh = () => {
        dispatch(fetchTaskDetail(selectedTaskId));
        dispatch(fetchMyTaskInbox());
        dispatch(fetchSentTasks());
    };

    const currentList    = tab === 'inbox' ? inbox     : sentTasks;
    const currentLoading = tab === 'inbox' ? loadingInbox : loadingSent;

    return (
        <div className="h-[calc(100vh-120px)] flex gap-4 overflow-hidden">

            {/* ── ستون راست: لیست ── */}
            <div className="w-80 flex-shrink-0 flex flex-col bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">

                {/* تب‌ها */}
                <div className="border-b border-gray-700">
                    <div className="flex items-center justify-between px-3 pt-3 pb-0 gap-2">
                        <div className="flex gap-0.5">
                            <button
                                onClick={() => setTab('inbox')}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition border-b-2 whitespace-nowrap ${
                                    tab === 'inbox'
                                        ? 'text-blue-400 border-blue-500'
                                        : 'text-gray-400 border-transparent hover:text-gray-300'
                                }`}
                            >
                                <FaInbox size={12} />
                                صندوق ورودی
                                {inbox.length > 0 && (
                                    <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                        {inbox.length}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setTab('sent')}
                                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition border-b-2 whitespace-nowrap ${
                                    tab === 'sent'
                                        ? 'text-blue-400 border-blue-500'
                                        : 'text-gray-400 border-transparent hover:text-gray-300'
                                }`}
                            >
                                <FaPaperPlane size={11} />
                                فرستاده‌ها
                                {sentTasks.length > 0 && (
                                    <span className="bg-gray-600 text-gray-300 text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">
                                        {sentTasks.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2.5 py-1.5 rounded-lg transition mb-1 flex-shrink-0"
                        >
                            <FaPlus size={10} />
                            جدید
                        </button>
                    </div>
                </div>

                {/* لیست */}
                <div className="flex-1 overflow-y-auto">
                    {currentLoading ? (
                        <div className="flex items-center justify-center h-24 text-gray-500 text-sm gap-2">
                            <FaSpinner className="animate-spin" /> بارگیری...
                        </div>
                    ) : currentList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-24 text-gray-600 text-sm gap-2">
                            {tab === 'inbox'
                                ? <><FaInbox size={24} className="opacity-30" />ماموریت فعالی ندارید</>
                                : <><FaPaperPlane size={20} className="opacity-30" />هنوز ماموریتی نفرستادید</>
                            }
                        </div>
                    ) : (
                        currentList.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                selected={selectedTaskId === task.id}
                                onClick={() => handleSelectTask(task.id)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ── ستون چپ: جزئیات ── */}
            <div className="flex-1 bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
                {loadingDetail ? (
                    <div className="flex items-center justify-center h-full text-gray-500 gap-2">
                        <FaSpinner className="animate-spin" /> بارگیری جزئیات...
                    </div>
                ) : activeTask ? (
                    <TaskDetailPanel
                        taskData={activeTask}
                        currentUserId={userInfo?.id}
                        onRefresh={handleRefresh}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-2">
                        <FaInbox size={40} className="opacity-20" />
                        <p className="text-sm">یک ماموریت انتخاب کنید</p>
                    </div>
                )}
            </div>

            {showCreate && (
                <TaskCreateModal
                    onClose={() => setShowCreate(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default MyTasksScreen;
