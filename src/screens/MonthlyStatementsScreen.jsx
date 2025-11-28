import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/workers/workerSlice';
import { fetchStatements } from '../features/statements/statementSlice';
import { useNavigate } from 'react-router-dom';

const MonthlyStatementsScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedYear, setSelectedYear] = useState('1403'); // پیش‌فرض سال جاری

  // دریافت پروژه‌ها
  const { list: projects } = useSelector((state) => state.workers.projects);
  // دریافت صورت‌وضعیت‌ها
  const { loading, list: statements, error } = useSelector((state) => state.statements);

  useEffect(() => {
    // گرفتن لیست پروژه‌ها اگر خالی بود
    if (projects.length === 0) {
        dispatch(fetchProjects());
    }
    // فچ کردن اولیه
    dispatch(fetchStatements({ year: selectedYear }));
  }, [dispatch]);

  const handleSearch = () => {
      dispatch(fetchStatements({ projectId: selectedProjectId, year: selectedYear }));
  };

  const getStatusBadge = (status, display) => {
      const colors = {
          'DRAFT': 'bg-gray-700 text-gray-300',
          'GENERATED': 'bg-blue-900 text-blue-300 border-blue-700',
          'SUBMITTED_TO_CITY': 'bg-yellow-900 text-yellow-300 border-yellow-700',
          'APPROVED_BY_CITY': 'bg-green-900 text-green-300 border-green-700',
      };
      return (
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors[status] || 'bg-gray-800'}`}>
              {display}
          </span>
      );
  };

  // تبدیل عدد ماه به نام ماه فارسی
  const getMonthName = (monthNum) => {
      const months = [
          "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
          "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
      ];
      return months[monthNum - 1] || monthNum;
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl font-vazir">
      <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-700 pb-4">
        📊 مدیریت صورت‌وضعیت‌های فنی
      </h1>

      {/* فیلترها */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row gap-4 items-end border border-gray-700">
        <div className="w-full md:w-1/3">
          <label className="block text-gray-400 mb-2 text-sm">پروژه</label>
          <select
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">-- همه پروژه‌ها --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-1/4">
          <label className="block text-gray-400 mb-2 text-sm">سال مالی</label>
          <input 
            type="number"
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/4">
            <button 
                onClick={handleSearch}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2"
            >
                🔍 جستجو
            </button>
        </div>
      </div>

      {/* جدول نمایش داده‌ها */}
      <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          {loading ? (
              <div className="p-10 text-center text-blue-400 animate-pulse">در حال بارگذاری اطلاعات...</div>
          ) : error ? (
              <div className="p-10 text-center text-red-400">{error}</div>
          ) : statements.length === 0 ? (
              <div className="p-10 text-center text-gray-500">هیچ صورت‌وضعیتی یافت نشد.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">پروژه</th>
                    <th className="px-6 py-4">دوره (سال/ماه)</th>
                    <th className="px-6 py-4 text-center">جمع نفرات</th>
                    <th className="px-6 py-4 text-center">مجموع ساعات</th>
                    <th className="px-6 py-4 text-center">وضعیت</th>
                    <th className="px-6 py-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {statements.map((stmt) => (
                    <tr key={stmt.id} className="hover:bg-gray-800/50 transition duration-150">
                     <td className="px-6 py-4 font-bold text-white cursor-pointer hover:text-blue-400" 
    onClick={() => navigate(`/admin/statements/${stmt.id}`)}>
    {stmt.project_name}
</td>
                      <td className="px-6 py-4 text-gray-300">
                          {stmt.year} / <span className="text-yellow-400 font-bold">{getMonthName(stmt.month)}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-300">
                          {stmt.total_workers_count} نفر
                      </td>
                      <td className="px-6 py-4 text-center">
                          <span className="bg-blue-900/30 text-blue-300 px-3 py-1 rounded font-mono font-bold">
                              {parseFloat(stmt.total_labor_hours).toLocaleString()} hrs
                          </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                          {getStatusBadge(stmt.status, stmt.status_display)}
                      </td>
                      <td className="px-6 py-4 text-center">
                          {/* اگر فایل تولید شده باشد دکمه دانلود می‌آید */}
                          {stmt.generated_file ? (
                             <a 
                               href={`http://127.0.0.1:8000${stmt.generated_file}`} 
                               target="_blank"
                               rel="noreferrer"
                               className="text-blue-400 hover:text-blue-300 text-sm font-bold border-b border-blue-400/30 pb-1"
                             >
                                 📥 دانلود فایل
                             </a>
                          ) : (
                              <span className="text-gray-600 text-xs">فایلی نیست</span>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};

export default MonthlyStatementsScreen;