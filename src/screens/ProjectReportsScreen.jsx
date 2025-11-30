// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { fetchProjects } from '../features/workers/workerSlice';
// import { fetchDailyReports, updateReportStatus } from '../features/reports/reportSlice';
// import DatePicker from "react-multi-date-picker";
// import persian from "react-date-object/calendars/persian";
// import persian_fa from "react-date-object/locales/persian_fa";
// import { useNavigate } from 'react-router-dom';
// const ProjectReportsScreen = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
  
//   const [selectedProjectId, setSelectedProjectId] = useState('');
//   const [selectedDate, setSelectedDate] = useState(null);

//   const { list: projects, status: projectStatus } = useSelector(
//     (state) => state.workers.projects
//   );

//   const { loading, reports, error, actionLoading } = useSelector((state) => state.reports);
//   const { userInfo } = useSelector((state) => state.userLogin); // برای چک کردن ادمین بودن

//   // هندلر تغییر وضعیت
//   const handleStatusChange = (reportId, action, reason = '') => {
//       if (window.confirm('آیا از انجام این عملیات اطمینان دارید؟')) {
//           dispatch(updateReportStatus({ reportId, action, reason }));
//       }
//   };
//   useEffect(() => {
//     if (projectStatus === 'idle') {
//       dispatch(fetchProjects());
//     }
//   }, [dispatch, projectStatus]);

//   const handleFetch = () => {
//     let dateString = '';
//     if (selectedDate) {
//         dateString = selectedDate.toDate().toISOString().split('T')[0];
//     }
//     dispatch(fetchDailyReports({ projectId: selectedProjectId, date: dateString }));
//   };

//   const getMediaUrl = (url) => {
//     if (!url) return '';
//     if (url.startsWith('http')) return url;
//     return `http://127.0.0.1:8000${url}`; // تنظیم با آدرس بک‌اند خودت
//   };

//   const toPersianDate = (dateString) => {
//     if (!dateString) return '---';
//     return new Date(dateString).toLocaleDateString('fa-IR', {
//         year: 'numeric', month: 'long', day: 'numeric',
//         timeZone: 'Asia/Tehran'
//     });
//   };

//   const toPersianTime = (dateString) => {
//     if (!dateString) return '';
//     return new Date(dateString).toLocaleTimeString('fa-IR', {
//         hour: '2-digit', minute: '2-digit',
//         timeZone: 'Asia/Tehran'
//     });
//   };

//   return (
//     <div className="container mx-auto px-4 py-6 rtl font-vazir">
//       <h1 className="text-3xl font-bold text-white mb-8 border-b border-gray-700 pb-4">
//         📋 گزارشات روزانه پروژه
//       </h1>

//       {/* بخش فیلترها */}
//       <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row gap-4 items-end border border-gray-700">
        
//         <div className="w-full md:w-1/3">
//           <label className="block text-gray-400 mb-2 text-sm">انتخاب پروژه</label>
//           <select
//             className="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
//             value={selectedProjectId}
//             onChange={(e) => setSelectedProjectId(e.target.value)}
//           >
//             <option value="">-- لطفا پروژه را انتخاب کنید --</option>
//             {projects.map((proj) => (
//               <option key={proj.id} value={proj.id}>
//                 {proj.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="w-full md:w-1/3 flex flex-col">
//           <label className="block text-gray-400 mb-2 text-sm">تاریخ گزارش (اختیاری)</label>
//           <DatePicker
//             value={selectedDate}
//             onChange={setSelectedDate}
//             calendar={persian}
//             locale={persian_fa}
//             calendarPosition="bottom-right"
//             inputClass="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400 transition-all"
//             placeholder="انتخاب تاریخ..."
//           />
//         </div>
        
//         <div className="w-full md:w-1/3">
//             <button 
//                 onClick={handleFetch}
//                 className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold shadow-lg flex items-center justify-center gap-2"
//                 disabled={!selectedProjectId}
//             >
//                 <span>🔄</span> بروزرسانی لیست
//             </button>
//         </div>
//       </div>

//       {loading && <div className="text-center text-blue-400 text-xl py-10 animate-pulse">در حال دریافت گزارشات...</div>}
      
//       {error && <div className="bg-red-900/50 border border-red-700 text-red-200 p-4 rounded-lg mb-4 text-center font-bold">{error}</div>}

//       {!loading && !error && reports.length === 0 && selectedProjectId && (
//         <div className="text-center text-gray-500 py-10 text-xl border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30">
//           هیچ گزارشی برای این پروژه در این تاریخ یافت نشد.
//         </div>
//       )}

//       {!loading && !error && reports.map((report) => (
//         <div key={report.id} className="bg-gray-800 rounded-xl shadow-xl overflow-hidden mb-10 border border-gray-700 transition-all hover:border-gray-600">
          
//           {/* هدر گزارش */}
//           <div className="bg-gray-900 p-4 flex flex-wrap justify-between items-center border-b border-gray-700 gap-2">
//             <div className="flex items-center gap-2">
//               <span className="text-gray-400 text-sm">📅 تاریخ گزارش:</span>
//               <span className="text-xl font-bold text-yellow-400 font-mono">
//                 {toPersianDate(report.report_date)}
//               </span>
//             </div>
//             <div className="text-gray-400 text-sm bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
//               پروژه: <span className="text-white font-bold">{report.project_name || '---'}</span>
//             </div>
//             <div className="text-gray-500 text-xs flex items-center gap-1">
//                 <span>⏰</span> ثبت سیستمی: {toPersianDate(report.created_at)} ساعت {toPersianTime(report.created_at)}
//             </div>

//             {/* نشانگر وضعیت */}
//              <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
//                  report.status === 'PM_APPROVED' || report.status === 'FINAL_APPROVED' 
//                  ? 'bg-green-900 text-green-300 border-green-700' 
//                  : report.status === 'REJECTED'
//                  ? 'bg-red-900 text-red-300 border-red-700'
//                  : 'bg-yellow-900 text-yellow-300 border-yellow-700'
//              }`}>
//                  {report.status_display}
//              </div>
//           </div>

//           <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
//             <ReportSection 
//                 title="👨‍💼 گزارش مدیر پروژه" 
//                 author={report.manager_report?.author_name}
//                 text={report.manager_report?.work_summary}
//                 mediaFiles={report.manager_report?.media_files}
//                 updatedAt={report.manager_report?.timestamp}
//                 color="blue"
//                 getMediaUrl={getMediaUrl}
//                 toPersianTime={toPersianTime}
//             />

//             <ReportSection 
//                 title="🛠 گزارش تاسیسات" 
//                 author={report.facilities_report?.author_name}
//                 text={report.facilities_report?.tasks_completed}
//                 mediaFiles={report.facilities_report?.media_files}
//                 updatedAt={report.facilities_report?.timestamp}
//                 color="orange"
//                 getMediaUrl={getMediaUrl}
//                 toPersianTime={toPersianTime}
//             />

//             <ReportSection 
//                 title="👮‍♂️ گزارش نگهبانی" 
//                 author={report.security_report?.author_name}
//                 text={report.security_report?.general_notes}
//                 mediaFiles={report.security_report?.media_files}
//                 updatedAt={report.security_report?.timestamp}
//                 color="green"
//                 getMediaUrl={getMediaUrl}
//                 toPersianTime={toPersianTime}
//             />
//           </div>
          
//           {/* لاگ‌های نگهبانی */}
//           {report.security_report?.logs && report.security_report.logs.length > 0 && (
//               <div className="px-6 pb-6 border-t border-gray-700 pt-4 bg-gray-800/50">
//                   <h4 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2">
//                     <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//                     ترددها (ثبت شده توسط نگهبان)
//                   </h4>
//                   <div className="overflow-x-auto rounded-lg border border-gray-700">
//                     <table className="w-full text-right text-sm text-gray-300">
//                         <thead className="text-xs text-gray-400 uppercase bg-gray-900">
//                             <tr>
//                                 <th className="px-4 py-3">نوع تردد</th>
//                                 <th className="px-4 py-3">نام شخص / پلاک</th>
//                                 <th className="px-4 py-3">زمان ثبت</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {report.security_report.logs.map(log => (
//                                 <tr key={log.id} className="border-b border-gray-700 last:border-0 hover:bg-gray-700/30 transition">
//                                     <td className="px-4 py-3">
//                                         <span className={`px-2 py-1 rounded text-xs font-bold ${
//                                             log.log_type === 'ENTRY' ? 'bg-green-900 text-green-300 border border-green-700' : 'bg-red-900 text-red-300 border border-red-700'
//                                         }`}>
//                                             {log.log_type === 'ENTRY' ? 'ورود' : 'خروج'}
//                                         </span>
//                                     </td>
//                                     <td className="px-4 py-3 font-medium text-white">
//                                         {log.person_name || log.vehicle_details}
//                                     </td>
//                                     <td className="px-4 py-3 font-mono text-gray-400 text-xs" dir="ltr">
//                                         {toPersianTime(log.log_time)}
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                   </div>
//               </div>
//           )}
//           {/* ========================================= */}
//           {/* ✅ بخش جدید: پنل مدیریت (عملیات تأیید) */}
//           {/* ========================================= */}
//           {userInfo?.isAdmin && (
//               <div className="bg-gray-900/80 p-4 border-t border-gray-700 flex flex-wrap gap-4 items-center justify-end">
                  
//                   {/* دکمه ارسال (اگر پیش‌نویس است) */}
//                   {report.status === 'DRAFT' && (
//                       <button
//                         disabled={actionLoading}
//                         onClick={() => handleStatusChange(report.id, 'SUBMIT')}
//                         className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition shadow-lg"
//                       >
//                         📤 ارسال برای بررسی
//                       </button>
//                   )}

//                   {/* دکمه‌های مدیر پروژه (اگر ارسال شده) */}
//                   {report.status === 'SUBMITTED' && (
//                       <>
//                         <button
//                             disabled={actionLoading}
//                             onClick={() => handleStatusChange(report.id, 'APPROVE_PM')}
//                             className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition shadow-lg flex items-center gap-2"
//                         >
//                             <span>✅</span> تایید مدیر پروژه و محاسبه صورت‌وضعیت
//                         </button>
                        
//                         <button
//                             disabled={actionLoading}
//                             onClick={() => {
//                                 const reason = prompt("دلیل رد گزارش را وارد کنید:");
//                                 if (reason) handleStatusChange(report.id, 'REJECT', reason);
//                             }}
//                             className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition shadow-lg"
//                         >
//                             ❌ رد گزارش
//                         </button>
//                       </>
//                   )}

//                   {/* پیام وضعیت نهایی */}
//                   {(report.status === 'PM_APPROVED' || report.status === 'FINAL_APPROVED') && (
//                       <div className="text-green-400 text-sm font-bold flex items-center gap-2">
//                           <span>💰</span> این گزارش در صورت‌وضعیت ماهانه محاسبه شده است.
//                       </div>
//                   )}

//               </div>
//           )}
//           {/* ✅ دکمه جدید لیست حضور و غیاب */}
//               <button
//                  onClick={() => navigate(`/admin/attendance/${report.project}/${report.report_date}`)}
//                  className="mr-auto text-xs bg-blue-900/40 hover:bg-blue-800 text-blue-300 border border-blue-700 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
//                  title="مشاهده لیست دقیق حضور و غیاب کارگران در این روز"
//               >
//                  <span>👥</span> مشاهده لیست حضور و غیاب
//               </button>
//         </div>
//       ))}
//     </div>
//   );
// };

// // کامپوننت کارت گزارش تکی
// const ReportSection = ({ title, author, text, mediaFiles, color, getMediaUrl, updatedAt, toPersianTime }) => {
//     const colorConfigs = {
//         blue: { border: 'border-blue-500', text: 'text-blue-400', bg: 'bg-blue-900/10' },
//         orange: { border: 'border-orange-500', text: 'text-orange-400', bg: 'bg-orange-900/10' },
//         green: { border: 'border-green-500', text: 'text-green-400', bg: 'bg-green-900/10' },
//     };
//     const theme = colorConfigs[color];

//     if (!text && (!mediaFiles || mediaFiles.length === 0)) {
//         return (
//             <div className="bg-gray-700/20 rounded-xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 opacity-50 min-h-[200px]">
//                 <span className="text-3xl mb-3 opacity-40">📁</span>
//                 <span className="text-gray-500 text-sm font-medium">بدون گزارش {title}</span>
//             </div>
//         );
//     }

//     return (
//         <div className={`rounded-xl p-5 border-t-4 shadow-lg flex flex-col h-full ${theme.bg} ${theme.border}`}>
//             <div className="flex justify-between items-start mb-4">
//                 <h3 className={`font-bold text-lg flex items-center gap-2 ${theme.text}`}>
//                     {title}
//                 </h3>
//                 {updatedAt && (
//                     <span className="text-[10px] text-gray-400 bg-gray-900/80 px-2 py-1 rounded border border-gray-700">
//                         {toPersianTime(updatedAt)}
//                     </span>
//                 )}
//             </div>
            
//             {author && (
//                 <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/30">
//                     <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm border border-gray-600">👤</div>
//                     <div className="flex flex-col">
//                         <span className="text-xs text-gray-400">ثبت کننده:</span>
//                         <span className="text-sm text-white font-medium">{author}</span>
//                     </div>
//                 </div>
//             )}
            
//             <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed bg-gray-800/60 p-3 rounded-lg mb-4 border border-gray-700/50 flex-grow">
//                 {text || <span className="text-gray-500 italic">توضیحات متنی ثبت نشده است.</span>}
//             </div>

//             {/* بخش فایل‌ها و متن تبدیل شده */}
//             {mediaFiles && mediaFiles.length > 0 && (
//                 <div className="mt-auto pt-2">
//                     <h4 className="text-xs text-gray-400 mb-3 flex items-center gap-1 font-bold uppercase tracking-wider">
//                         <span>📎</span> پیوست‌ها ({mediaFiles.length})
//                     </h4>
//                     <div className="space-y-3">
//                         {mediaFiles.map((file) => (
//                             <div key={file.id} className="bg-gray-900/80 rounded-lg border border-gray-700 p-3 hover:border-gray-500 transition-colors group">
//                                 <div className="flex items-center gap-3">
//                                     <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg text-xl shadow-inner">
//                                         {file.file_type === 'IMAGE' && '📷'}
//                                         {file.file_type === 'AUDIO' && '🎤'}
//                                         {file.file_type === 'VIDEO' && '🎥'}
//                                     </div>
//                                     <div className="flex flex-col flex-grow">
//                                         <span className="text-xs text-gray-400 mb-1 font-mono ltr text-right">{new Date(file.uploaded_at).toLocaleTimeString('fa-IR')}</span>
//                                         <a 
//                                             href={getMediaUrl(file.file)} 
//                                             target="_blank" 
//                                             rel="noopener noreferrer" 
//                                             className="text-blue-400 text-sm hover:text-blue-300 font-medium flex items-center gap-1"
//                                         >
//                                             مشاهده / دانلود
//                                             <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
//                                         </a>
//                                     </div>
//                                 </div>

//                                 {/* ✅ نمایش متن استخراج شده (هوش مصنوعی) */}
//                                 {file.transcription && (
//                                     <div className="mt-3 bg-green-900/10 border border-green-500/30 rounded p-2 text-xs relative">
//                                         <div className="text-green-400 font-bold mb-1 flex items-center gap-1 border-b border-green-500/20 pb-1">
//                                             <span>🤖</span> هوش مصنوعی (IoType):
//                                         </div>
//                                         <p className="text-gray-300 leading-relaxed text-justify">
//                                             {file.transcription}
//                                         </p>
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default ProjectReportsScreen;