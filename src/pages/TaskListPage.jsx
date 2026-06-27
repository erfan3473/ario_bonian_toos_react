import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchMyTaskInbox, fetchSentTasks } from '../features/task/taskSlice';
import TaskCreateModal from '../components/Task/TaskCreateModal';
import {
  FaInbox,
  FaPaperPlane,
  FaPlus,
  FaSpinner,
  FaClock,
  FaUser,
  FaChevronLeft,
  FaSearch,
  FaTimes,
} from 'react-icons/fa';

const TASK_TYPE_LABELS = {
  PAYROLL_FORM: 'تکمیل فرم حقوق',
  PURCHASE: 'خرید/تدارکات',
  REPORT: 'گزارش‌دهی',
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  DONE: 'bg-green-500/10 text-green-500 border-green-500/30',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/30',
  CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
};

const STATUS_LABELS = {
  PENDING: 'در انتظار',
  IN_PROGRESS: 'در جریان',
  DONE: 'انجام شده',
  REJECTED: 'رد شده',
  CANCELLED: 'لغو شده',
};

const URGENCY_LABELS = {
  LOW: 'کم',
  MEDIUM: 'متوسط',
  HIGH: 'زیاد',
  CRITICAL: 'بحرانی',
};

const URGENCY_COLORS = {
  LOW: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  MEDIUM: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/30',
};


const TaskListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'inbox';

  const { userInfo } = useSelector((state) => state.userLogin);
  const { inbox, sentTasks, loadingInbox, loadingSent } = useSelector((state) => state.task);
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (userInfo) {
      if (activeTab === 'inbox') dispatch(fetchMyTaskInbox());
      else dispatch(fetchSentTasks());
    }
  }, [dispatch, userInfo, activeTab]);

  const currentList = activeTab === 'inbox' ? inbox : sentTasks;

  const filteredList = currentList.filter((t) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(s) ||
      t.note?.toLowerCase().includes(s) ||
      t.created_by_name?.toLowerCase().includes(s) ||
      (URGENCY_LABELS[t.urgency] || '').toLowerCase().includes(s)
    );
  });

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setSearch('');
  };

  const handleTaskClick = (taskId) => {
    navigate(`/tasks/${taskId}`, { state: { returnTab: activeTab } });
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    dispatch(fetchMyTaskInbox());
    dispatch(fetchSentTasks());
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`} dir="rtl">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* هدر */}
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/30 text-white">
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
        <div className={`flex gap-2 mb-6 p-1.5 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <button
            onClick={() => handleTabChange('inbox')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium text-sm ${
              activeTab === 'inbox'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
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
                : isDark
                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FaPaperPlane size={16} />
            <span>ارسالی</span>
            {sentTasks.length > 0 && (
              <span className={`${isDark ? 'bg-gray-600' : 'bg-gray-300 text-gray-800'} text-xs px-2 py-0.5 rounded-full font-bold`}>
                {sentTasks.length}
              </span>
            )}
          </button>
        </div>

        {/* جستجو */}
        <div className="mb-6">
          <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 transition-colors ${
            isDark ? 'bg-gray-800 border-gray-700 focus-within:border-blue-500' : 'bg-white border-gray-300 focus-within:border-blue-500'
          }`}>
            <FaSearch className={`${isDark ? 'text-gray-500' : 'text-gray-400'} shrink-0`} size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو در عنوان، توضیحات یا سازنده..."
              className={`bg-transparent text-sm flex-1 outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} transition-colors`}
              >
                <FaTimes size={14} />
              </button>
            )}
          </div>
        </div>

        {/* لیست task‌ها */}
        {loadingInbox || loadingSent ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-blue-500 text-4xl" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
              <FaInbox size={32} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {search.trim()
                ? 'نتیجه‌ای یافت نشد'
                : activeTab === 'inbox'
                ? 'ماموریت دریافتی وجود ندارد'
                : 'ماموریت ارسالی وجود ندارد'}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {search.trim() ? 'عبارت دیگری را جستجو کنید' : 'می‌توانید یک ماموریت جدید ایجاد کنید'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className={`border rounded-2xl p-5 cursor-pointer transition-all group ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:shadow-lg hover:shadow-blue-900/10'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-base mb-2 transition-colors leading-tight ${isDark ? 'text-gray-100 group-hover:text-blue-400' : 'text-gray-900 group-hover:text-blue-600'}`}>
                      {task.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${STATUS_COLORS[task.status] || ''}`}>
                        {STATUS_LABELS[task.status] || task.status}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
                        isDark ? 'text-gray-400 bg-gray-900 border-gray-700' : 'text-gray-600 bg-gray-100 border-gray-300'
                      }`}>
                        {TASK_TYPE_LABELS[task.task_type] || task.task_type}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${URGENCY_COLORS[task.urgency] || ''}`}>
                        فوریت: {URGENCY_LABELS[task.urgency] || task.urgency || 'متوسط'}
                      </span>
                    </div>
                  </div>
                  <FaChevronLeft className={`transition-colors shrink-0 mt-1 ${isDark ? 'text-gray-600 group-hover:text-blue-500' : 'text-gray-400 group-hover:text-blue-600'}`} />
                </div>

                {task.note && (
                  <p className={`text-sm mb-3 line-clamp-2 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.note}
                  </p>
                )}

                <div className={`flex flex-wrap items-center gap-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {task.created_by_name && (
                    <div className="flex items-center gap-1.5">
                      <FaUser className={isDark ? 'text-gray-600' : 'text-gray-400'} size={10} />
                      <span>{task.created_by_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <FaClock className={isDark ? 'text-gray-600' : 'text-gray-400'} size={10} />
                    <span>{new Date(task.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                  {task.active_assignees?.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-500">●</span>
                      <span>{task.active_assignees.length} نفر در انتظار اقدام</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <TaskCreateModal onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
      )}
    </div>
  );
};

export default TaskListPage;
