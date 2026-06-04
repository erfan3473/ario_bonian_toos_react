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
    FaPaperPlane, FaClock, FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaPlayCircle
} from 'react-icons/fa';

const TASK_TYPE_LABELS = {
    PAYROLL_FORM: 'فرم حقوق',
    PURCHASE:     'خرید',
    REPORT:       'گزارش',
};

const STATUS_CONFIG = {
    PENDING:     { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: FaExclamationCircle, label: 'در انتظار' },
    IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: FaPlayCircle, label: 'در جریان' },
    DONE:        { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: FaCheckCircle, label: 'انجام شده' },
    REJECTED:    { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: FaTimesCircle, label: 'رد شده' },
    CANCELLED:   { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: FaTimesCircle, label: 'لغو شده' },
};

// ── کارت یک ماموریت (طراحی مدرن) ──
const TaskCard = ({ task, selected, onClick }) => {
    const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = status.icon;

    return (
        <div
            onClick={onClick}
            className={`p-4 border-b border-gray-800 cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                selected 
                    ? 'bg-[#2a2b2f] border-r-2 border-r-blue-500' 
                    : 'bg-transparent hover:bg-[#232428] border-r-2 border-r-transparent'
            }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="text-gray-100 text-[15px] font-semibold truncate pr-1 group-hover:text-blue-400 transition-colors">
                    {task.title}
                </div>
                <div className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border ${status.bg} ${status.color} ${status.border} shrink-0`}>
                    <StatusIcon size={10} />
                    <span>{status.label}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                    {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <FaClock size={10} />
                    <span>{new Date(task.updated_at).toLocaleDateString('fa-IR')}</span>
                </div>
            </div>

            {task.active_assignees?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {task.active_assignees.map((a) => (
                        <div key={a.step_id} className="flex items-center gap-1.5 text-[11px] bg-[#1e1f20] border border-gray-700 text-gray-300 px-2 py-1 rounded-full">
                            <div className="w-4 h-4 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold text-[8px]">
                                {a.name ? a.name[0] : 'U'}
                            </div>
                            <span>{a.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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

    const [tab, setTab] = useState('inbox'); 
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'

    useEffect(() => {
        dispatch(fetchMyTaskInbox());
        dispatch(fetchSentTasks());
        return () => { dispatch(clearActiveTask()); };
    }, [dispatch]);

    useEffect(() => {
        if (needsInboxRefresh) dispatch(fetchMyTaskInbox());
    }, [needsInboxRefresh, dispatch]);

    const handleSelectTask = (taskId) => {
        if (taskId === selectedTaskId) return;
        dispatch(clearActiveTask());
        setSelectedTaskId(taskId);
        dispatch(fetchTaskDetail(taskId));
        setMobileView('detail'); // انتقال به صفحه جزئیات در موبایل
    };

    const handleBackToList = () => {
        dispatch(clearActiveTask());
        setSelectedTaskId(null);
        setMobileView('list');
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

    const currentList = tab === 'inbox' ? inbox : sentTasks;
    const currentLoading = tab === 'inbox' ? loadingInbox : loadingSent;

    return (
        <div className="h-[calc(100vh-[120px])] md:h-[calc(100vh-100px)] flex bg-[#131314] overflow-hidden md:rounded-2xl md:border border-gray-800 -mx-4 md:mx-0 shadow-2xl">
            
            {/* ── ستون راست: لیست ماموریت‌ها ── */}
            <div className={`w-full lg:w-80 flex-col border-l border-gray-800 bg-[#1e1f20] h-full shrink-0 transition-all ${mobileView === 'list' ? 'flex' : 'hidden lg:flex'}`}>
                
                {/* هدر و دکمه ایجاد */}
                <div className="px-4 py-4 border-b border-gray-800 flex justify-between items-center bg-[#1e1f20]">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <FaInbox className="text-blue-500" size={18} />
                        ماموریت‌ها
                    </h2>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-xl transition shadow-lg shadow-blue-500/20"
                    >
                        <FaPlus size={12} />
                        جدید
                    </button>
                </div>

                {/* تب‌ها */}
                <div className="flex p-2 gap-1 bg-[#131314] border-b border-gray-800">
                    <button
                        onClick={() => setTab('inbox')}
                        className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                            tab === 'inbox' ? 'bg-[#2a2b2f] text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <FaInbox size={12} />
                        صندوق ورودی
                        {inbox.length > 0 && (
                            <span className={`text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none ${tab === 'inbox' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                                {inbox.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setTab('sent')}
                        className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${
                            tab === 'sent' ? 'bg-[#2a2b2f] text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-200'
                        }`}
                    >
                        <FaPaperPlane size={11} />
                        فرستاده‌ها
                    </button>
                </div>

                {/* لیست */}
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {currentLoading ? (
                        <div className="flex justify-center mt-10"><FaSpinner className="animate-spin text-blue-500 text-2xl" /></div>
                    ) : currentList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center mt-20 text-gray-500">
                            {tab === 'inbox'
                                ? <><FaInbox size={40} className="opacity-30 mb-3 text-blue-400" /><p className="text-sm">ماموریت فعالی ندارید</p></>
                                : <><FaPaperPlane size={36} className="opacity-30 mb-3 text-gray-400" /><p className="text-sm">هنوز ماموریتی نفرستادید</p></>
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

            {/* ── ستون چپ: جزئیات ماموریت ── */}
            <div className={`flex-grow flex-col h-full bg-[#131314] relative min-w-0 ${mobileView === 'detail' ? 'flex' : 'hidden lg:flex'}`}>
                {loadingDetail ? (
                     <div className="flex h-full items-center justify-center"><FaSpinner className="animate-spin text-blue-500 text-3xl" /></div>
                ) : activeTask ? (
                    // در این کامپوننت حتما پروپ onBack={handleBackToList} را دریافت و دکمه بازگشت برای موبایل تعبیه کنید
                    <TaskDetailPanel
                        taskData={activeTask}
                        currentUserId={userInfo?.id}
                        onRefresh={handleRefresh}
                        onBack={handleBackToList} 
                    />
                ) : (
                    <div className="hidden lg:flex h-full flex-col items-center justify-center text-gray-500 gap-4">
                        <div className="w-24 h-24 rounded-full bg-[#1e1f20] border border-gray-800 flex items-center justify-center shadow-lg">
                            <FaInbox size={32} className="text-gray-600" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">یک ماموریت را برای مشاهده انتخاب کنید</p>
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
