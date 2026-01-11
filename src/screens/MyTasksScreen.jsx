// src/screens/MyTasksScreen.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { fetchMyTasks } from '../features/tasks/taskSlice';

const getTaskTypeLabel = (type) => {
  switch (type) {
    case 'PAYROLL_FORM':
      return 'تکمیل فرم حقوق';
    case 'PURCHASE':
      return 'خرید / تدارکات';
    case 'REPORT':
      return 'گزارش‌دهی';
    default:
      return type || 'نامشخص';
  }
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'PENDING':
      return 'در انتظار انجام';
    case 'IN_PROGRESS':
      return 'در حال انجام';
    case 'DONE':
      return 'انجام شده';
    default:
      return status || 'نامشخص';
  }
};

const MyTasksScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list, loading, error } = useSelector((state) => state.tasks);

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const handleOpenTask = (task) => {
    if (task.task_type === 'PAYROLL_FORM' && task.year && task.month) {
      const year = task.year;
      const month = task.month.toString().padStart(2, '0');
      navigate(`/admin/payroll?year=${year}&month=${month}`);
    } else {
      alert('برای این نوع ماموریت هنوز صفحه‌ای تعریف نشده است.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white">
      <div className="mb-6 border-b border-gray-200 pb-4 flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          📋 کارتابل ماموریت‌ها
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          لیست ماموریت‌هایی که برای شما ارجاع شده است.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mb-4 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-sm text-blue-600">
          در حال دریافت ماموریت‌ها...
        </div>
      )}

      {!loading && list.length === 0 && (
        <div className="text-center text-gray-500 py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 mt-6">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-base">
            در حال حاضر ماموریت فعالی برای شما ثبت نشده است.
          </p>
        </div>
      )}

      {!loading && list.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm border border-gray-200 rounded-lg overflow-hidden bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-2 py-2 text-center">عنوان</th>
                <th className="px-2 py-2 text-center">نوع ماموریت</th>
                <th className="px-2 py-2 text-center">وضعیت</th>
                <th className="px-2 py-2 text-center">دوره حقوق</th>
                <th className="px-2 py-2 text-center">توضیح</th>
                <th className="px-2 py-2 text-center">اقدام</th>
              </tr>
            </thead>
            <tbody>
              {list.map((task, idx) => {
                const isAlt = idx % 2 === 0;
                const hasPayrollPeriod =
                  task.task_type === 'PAYROLL_FORM' && task.year && task.month;

                return (
                  <tr
                    key={task.id}
                    className={isAlt ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-2 py-2 text-right text-gray-800">
                      {task.title}
                    </td>
                    <td className="px-2 py-2 text-center text-gray-700">
                      {getTaskTypeLabel(task.task_type)}
                    </td>
                    <td className="px-2 py-2 text-center text-gray-700">
                      {getStatusLabel(task.status)}
                    </td>
                    <td className="px-2 py-2 text-center text-gray-700">
                      {hasPayrollPeriod
                        ? `${task.year}/${task.month
                            .toString()
                            .padStart(2, '0')}`
                        : '-'}
                    </td>
                    <td className="px-2 py-2 text-right text-gray-600">
                      {task.note || '-'}
                    </td>
                    <td className="px-2 py-2 text-center">
                      {hasPayrollPeriod ? (
                        <button
                          type="button"
                          onClick={() => handleOpenTask(task)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold"
                        >
                          ورود به فرم
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          فعلاً عمل خاصی ندارد
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyTasksScreen;
