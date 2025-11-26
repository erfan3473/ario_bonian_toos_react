import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../features/workers/workerSlice';
import { fetchDailyReports } from '../features/reports/reportSlice';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

const ProjectReportsScreen = () => {
  const dispatch = useDispatch();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedDate, setSelectedDate] = useState(null); // آبجکت تاریخ

  const { list: projects, status: projectStatus } = useSelector(
    (state) => state.workers.projects
  );

  const { loading, reports, error } = useSelector((state) => state.reports);

  useEffect(() => {
    if (projectStatus === 'idle') {
      dispatch(fetchProjects());
    }
  }, [dispatch, projectStatus]);

  // تبدیل تاریخ انتخاب شده به فرمت میلادی برای ارسال به بک‌اند (YYYY-MM-DD)
  // اما بک‌اند اگر تاریخ شمسی می‌گیرد، باید سمت سرور هندل شود.
  // فرض بر این است که API تاریخ میلادی (YYYY-MM-DD) می‌خواهد.
  const handleFetch = () => {
    let dateString = '';
    if (selectedDate) {
        // تبدیل تاریخ انتخاب شده شمسی به میلادی برای ارسال به API
        dateString = selectedDate.toDate().toISOString().split('T')[0];
    }
    dispatch(fetchDailyReports({ projectId: selectedProjectId, date: dateString }));
  };

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:8000${url}`;
  };

const toPersianDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'Asia/Tehran' // ✅ اجبار به تایم زون ایران
    });
  };

  // تابع کمکی برای نمایش ساعت دقیق
  const toPersianTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('fa-IR', {
        hour: '2-digit', minute: '2-digit',
        timeZone: 'Asia/Tehran' // ✅ اجبار به تایم زون ایران
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl font-vazir"> {/* فونت وزیر یا هر فونت فارسی */}
      <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-700 pb-4">
        📋 گزارشات روزانه پروژه
      </h1>

      {/* فیلترها */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row gap-4 items-end">
        
        {/* انتخاب پروژه */}
        <div className="w-full md:w-1/3">
          <label className="block text-gray-400 mb-2 text-sm">انتخاب پروژه</label>
          <select
            className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">-- لطفا پروژه را انتخاب کنید --</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* انتخاب تاریخ (شمسی) */}
        <div className="w-full md:w-1/3 flex flex-col">
          <label className="block text-gray-400 mb-2 text-sm">تاریخ گزارش (اختیاری)</label>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            calendar={persian}
            locale={persian_fa}
            calendarPosition="bottom-right"
            inputClass="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
            placeholder="انتخاب تاریخ..."
          />
        </div>
        
        <div className="w-full md:w-1/3">
            <button 
                onClick={handleFetch}
                className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold shadow-md"
                disabled={!selectedProjectId}
            >
                بروزرسانی لیست
            </button>
        </div>
      </div>

      {loading && <div className="text-center text-blue-400 text-xl py-10 animate-pulse">در حال دریافت گزارشات...</div>}
      {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded mb-4 text-center">{error}</div>}

      {!loading && !error && reports.length === 0 && selectedProjectId && (
        <div className="text-center text-gray-500 py-10 text-xl border-2 border-dashed border-gray-700 rounded-xl">
          هیچ گزارشی برای این پروژه در این تاریخ یافت نشد.
        </div>
      )}

      {!loading && !error && reports.map((report) => (
        <div key={report.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden mb-10 border border-gray-700">
          
          {/* هدر گزارش */}
          <div className="bg-gray-900 p-4 flex flex-wrap justify-between items-center border-b border-gray-700 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">تاریخ گزارش:</span>
              <span className="text-xl font-bold text-yellow-400 font-mono">
                {toPersianDate(report.report_date)}
              </span>
            </div>
            <div className="text-gray-400 text-sm">
              پروژه: <span className="text-white font-bold">{report.project_name || '---'}</span>
            </div>
            <div className="text-gray-500 text-xs">
                ثبت سیستمی: {toPersianDate(report.created_at)} ساعت {toPersianTime(report.created_at)}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <ReportSection 
                title="👨‍💼 گزارش مدیر پروژه" 
                author={report.manager_report?.author_name}
                text={report.manager_report?.work_summary}
                mediaFiles={report.manager_report?.media_files}
                updatedAt={report.manager_report?.timestamp}
                color="blue"
                getMediaUrl={getMediaUrl}
                toPersianTime={toPersianTime}
            />

            <ReportSection 
                title="🛠 گزارش تاسیسات" 
                author={report.facilities_report?.author_name}
                text={report.facilities_report?.tasks_completed}
                mediaFiles={report.facilities_report?.media_files}
                updatedAt={report.facilities_report?.timestamp}
                color="orange"
                getMediaUrl={getMediaUrl}
                toPersianTime={toPersianTime}
            />

            <ReportSection 
                title="👮‍♂️ گزارش نگهبانی" 
                author={report.security_report?.author_name}
                text={report.security_report?.general_notes}
                mediaFiles={report.security_report?.media_files}
                updatedAt={report.security_report?.timestamp}
                color="green"
                getMediaUrl={getMediaUrl}
                toPersianTime={toPersianTime}
            />
          </div>
          
          {/* لاگ‌های نگهبانی */}
          {report.security_report?.logs && report.security_report.logs.length > 0 && (
              <div className="px-6 pb-6 border-t border-gray-700 pt-4 bg-gray-800/50">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ترددها (ثبت شده توسط نگهبان)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm text-gray-300">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-2 rounded-r-lg">نوع</th>
                                <th className="px-4 py-2">نام شخص / پلاک</th>
                                <th className="px-4 py-2 rounded-l-lg">زمان</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.security_report.logs.map(log => (
                                <tr key={log.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition">
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            log.log_type === 'ENTRY' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                                        }`}>
                                            {log.log_type === 'ENTRY' ? 'ورود' : 'خروج'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 font-medium text-white">
                                        {log.person_name || log.vehicle_details}
                                    </td>
                                    <td className="px-4 py-2 font-mono text-gray-400" dir="ltr">
                                        {toPersianTime(log.log_time)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}

        </div>
      ))}
    </div>
  );
};

const ReportSection = ({ title, author, text, mediaFiles, color, getMediaUrl, updatedAt, toPersianTime }) => {
    const colorClasses = {
        blue: 'border-blue-500 text-blue-400 bg-blue-900/10',
        orange: 'border-orange-500 text-orange-400 bg-orange-900/10',
        green: 'border-green-500 text-green-400 bg-green-900/10',
    };

    if (!text && (!mediaFiles || mediaFiles.length === 0)) {
        return (
            <div className="bg-gray-700/20 rounded-lg p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 opacity-50">
                <span className="text-2xl mb-2 opacity-50">📁</span>
                <span className="text-gray-500 text-sm">بدون گزارش {title}</span>
            </div>
        );
    }

    return (
        <div className={`rounded-xl p-5 border-t-4 shadow-lg ${colorClasses[color]}`}>
            <div className="flex justify-between items-start mb-3">
                <h3 className={`font-bold text-lg flex items-center gap-2 ${colorClasses[color].split(' ')[1]}`}>
                    {title}
                </h3>
                {updatedAt && (
                    <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                        ثبت: {toPersianTime(updatedAt)}
                    </span>
                )}
            </div>
            
            {author && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700/50">
                    <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs">👤</div>
                    <div className="text-xs text-gray-300">{author}</div>
                </div>
            )}
            
            <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed bg-gray-800/80 p-3 rounded-lg mb-4 min-h-[60px] border border-gray-700/50">
                {text || "توضیحات متنی ثبت نشده است."}
            </p>

            {mediaFiles && mediaFiles.length > 0 && (
                <div>
                    <h4 className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                        <span>📎</span> پیوست‌ها ({mediaFiles.length})
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {mediaFiles.map((file) => (
                            <div key={file.id} className="relative group rounded-lg overflow-hidden border border-gray-700">
                                {file.file_type === 'IMAGE' ? (
                                    <a href={getMediaUrl(file.file)} target="_blank" rel="noopener noreferrer">
                                        <img 
                                            src={getMediaUrl(file.file)} 
                                            alt="attachment" 
                                            className="w-full h-24 object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs">نمایش</span>
                                        </div>
                                    </a>
                                ) : (
                                    <a 
                                        href={getMediaUrl(file.file)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full h-24 flex flex-col items-center justify-center bg-gray-800 hover:bg-gray-700 transition"
                                    >
                                        <span className="text-2xl mb-1">🎵</span>
                                        <span className="text-[10px] text-gray-400">صدا/ویدیو</span>
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectReportsScreen;