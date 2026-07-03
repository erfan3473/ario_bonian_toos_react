import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTaskDetail, clearActiveTask } from '../features/task/taskSlice';
import TaskDetailPanel from '../components/Task/TaskDetailPanel';
import { FaSpinner, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { markModelNotificationsRead } from '../features/notifications/notificationSlice';

const TaskViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const returnTab = location.state?.returnTab || 'inbox';

  const { userInfo } = useSelector((state) => state.userLogin);
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  // 🔴 بهینه‌سازی اصلی: خواندن مستقیم اطلاعات از استور ریداکس برای جلوگیری از ناهماهنگی استیت‌ها
  const { activeTask, loadingDetail, error } = useSelector((state) => state.task);

  const handleRefresh = () => {
    if (id) {
      dispatch(fetchTaskDetail(id));
    }
  };

  useEffect(() => {
    if (userInfo && id) {
      dispatch(fetchTaskDetail(id));
      
      // سینک کردن خوانده‌شدن نوتیفیکیشن‌های این ماموریت
      dispatch(markModelNotificationsRead({ model: 'task', objectId: id }));
    }

    // پاکسازی داده‌ها هنگام خروج از صفحه برای جلوگیری از فلش زدن اطلاعات قبلی
    return () => {
      dispatch(clearActiveTask());
    };
  }, [id, userInfo, dispatch]);
  
  const handleBack = () => {
    navigate(`/tasks?tab=${returnTab}`);
  };

  if (loadingDetail && !activeTask) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <FaSpinner className="animate-spin text-blue-500 text-5xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} dir="rtl">
        <div className={`border rounded-2xl p-8 max-w-md text-center ${isDark ? 'bg-gray-800 border-red-500/30' : 'bg-white border-red-300'}`}>
          <FaExclamationTriangle className="text-red-500 text-5xl mx-auto mb-4" />
          <h2 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>خطا در بارگیری</h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
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

  if (!activeTask) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} dir="rtl">
        <div className="text-center">
          <h2 className={`font-bold text-xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>ماموریت یافت نشد</h2>
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
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`} dir="rtl">
      <div className="hidden lg:block container mx-auto px-4 py-4 max-w-6xl">
        <button
          onClick={handleBack}
          className={`flex items-center gap-2 transition-colors text-sm ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FaChevronRight size={12} />
          بازگشت به لیست ماموریت‌ها
        </button>
      </div>

      <div className="container mx-auto px-4 pb-6 max-w-6xl">
        <div className={`rounded-2xl overflow-hidden ${
          isDark ? 'bg-gray-800 border border-gray-700 shadow-2xl' : 'bg-white border border-gray-200 shadow-md'
        }`}>
          <TaskDetailPanel
            taskData={activeTask}
            currentUserId={userInfo?.id}
            onRefresh={handleRefresh}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskViewPage;