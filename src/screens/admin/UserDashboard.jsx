// src/screens/admin/UserDashboard.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDetail } from "../../features/admin/usersSlice";
import { FaUser, FaBuilding, FaFileContract, FaMoneyBillWave, FaUmbrellaBeach, FaMapMarkerAlt, FaSitemap, FaArrowRight } from 'react-icons/fa';

// دیکشنری‌های ترجمه مقادیر دیتابیس به فارسی
const maritalDict = { SINGLE: 'مجرد', MARRIED: 'متأهل', OTHER: 'سایر' };
const militaryDict = { DONE: 'پایان خدمت', EXEMPT: 'معاف', SERVING: 'در حال خدمت', NOT_APPLICABLE: 'مشمول نیست' };
const eduDict = { ELEMENTARY: 'ابتدایی', MIDDLE: 'راهنمایی', DIPLOMA: 'دیپلم', ASSOCIATE: 'فوق‌دیپلم', BACHELOR: 'لیسانس', MASTER: 'فوق‌لیسانس', PHD: 'دکتری', OTHER: 'سایر' };

const UserDashboard = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedUser, loading = {} } = useSelector((state) => state.admin.users || {});
  const userLoading = typeof loading === 'object' ? loading?.userDetail : loading;

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  useEffect(() => {
    dispatch(fetchUserDetail(userId));
  }, [userId, dispatch]);

  if (userLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>در حال بارگذاری اطلاعات کاربر...</div>
        </div>
      </div>
    );
  }

  const emp = selectedUser?.employee_details || {};
  
  // تبدیل تاریخ ثبت‌نام به شمسی
  const joinedDate = selectedUser?.date_joined 
    ? new Date(selectedUser.date_joined).toLocaleDateString('fa-IR') 
    : 'نامشخص';

  const birthDate = emp.birth_date 
    ? new Date(emp.birth_date).toLocaleDateString('fa-IR') 
    : 'ثبت نشده';

  const buttons = [
    { 
      path: `/admin/users/${userId}/personal`, 
      label: 'اطلاعات سیستمی', 
      icon: <FaUser />, 
      gradientDark: 'from-blue-700 to-blue-900 border-blue-600',
      gradientLight: 'from-blue-500 to-blue-600 border-blue-400' 
    },
    { 
      path: `/admin/users/${userId}/organizational`, 
      label: 'صفحه سازمانی', 
      icon: <FaBuilding />, 
      gradientDark: 'from-emerald-700 to-emerald-900 border-emerald-600',
      gradientLight: 'from-emerald-500 to-emerald-600 border-emerald-400' 
    },
    { 
      path: `/admin/users/${userId}/contracts`, 
      label: 'قراردادها', 
      icon: <FaFileContract />, 
      gradientDark: 'from-purple-700 to-purple-900 border-purple-600',
      gradientLight: 'from-purple-500 to-purple-600 border-purple-400' 
    },
    { 
      path: `/admin/users/${userId}/financial`, 
      label: 'اطلاعات مالی', 
      icon: <FaMoneyBillWave />, 
      gradientDark: 'from-amber-600 to-amber-800 border-amber-500',
      gradientLight: 'from-amber-400 to-amber-500 border-amber-300' 
    },
    { 
      path: `/admin/users/${userId}/leave`, 
      label: 'مدیریت مرخصی', 
      icon: <FaUmbrellaBeach />, 
      gradientDark: 'from-rose-700 to-rose-900 border-rose-600',
      gradientLight: 'from-rose-500 to-rose-600 border-rose-400' 
    },
    { 
      path: `/admin/users/${userId}/location-history`, 
      label: 'تاریخچه موقعیت', 
      icon: <FaMapMarkerAlt />, 
      gradientDark: 'from-cyan-700 to-cyan-900 border-cyan-600',
      gradientLight: 'from-cyan-500 to-cyan-600 border-cyan-400' 
    },
    { 
      path: `/admin/scheme-contracts?employee=${userId}`, 
      label: 'طرح طبقه‌بندی', 
      icon: <FaSitemap />, 
      gradientDark: 'from-indigo-700 to-indigo-900 border-indigo-600',
      gradientLight: 'from-indigo-500 to-indigo-600 border-indigo-400' 
    },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`container mx-auto max-w-7xl p-4 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
        isDark ? 'border-blue-700 bg-gray-800/50 shadow-2xl' : 'border-blue-600 bg-white shadow-lg'
      }`}>
        
        {/* هدر */}
        <div className={`flex flex-col md:flex-row justify-between items-center p-6 rounded-2xl border shadow-sm mb-8 transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-center gap-5 mb-5 md:mb-0 text-center sm:text-right min-w-0 w-full md:w-auto">
            {/* آواتار */}
            <div className={`w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 shadow-md ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
            }`}>
              {selectedUser?.profile?.image ? (
                <img src={selectedUser.profile.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className={`text-3xl font-black ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(selectedUser?.first_name?.[0] || selectedUser?.username?.[0] || '?').toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className={`text-2xl md:text-3xl font-black truncate break-words mb-1.5 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {selectedUser?.first_name} {selectedUser?.last_name}
              </h1>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 text-sm">
                <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>کد پرسنلی:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>{emp.id || '---'}</span>
                <span className={`mx-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>|</span>
                <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>سمت:</span>
                <span className="font-bold text-emerald-500 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">{emp.position?.title || 'نامشخص'}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate('/admin/users')}
            className={`shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-md ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            <FaArrowRight /> بازگشت به لیست
          </button>
        </div>

        {/* خلاصه اطلاعات پرسنلی */}
        <div className={`p-6 rounded-2xl border shadow-sm mb-10 relative overflow-hidden transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          {/* نوار رنگی کناری */}
          <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
          
          <h2 className={`text-xl font-black mb-6 flex items-center gap-2 pb-3 border-b ${isDark ? 'text-white border-gray-700' : 'text-gray-800 border-gray-100'}`}>
            <span className="text-blue-500 text-2xl">📋</span> خلاصه وضعیت پرسنلی
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            {/* ستون 1 */}
            <div className="space-y-5">
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تاریخ ورود به سامانه</span>
                <span className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>{joinedDate}</span>
              </div>
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>کد ملی</span>
                <span className={`font-mono font-black text-base break-all ${isDark ? 'text-white' : 'text-gray-800'}`}>{emp.code_meli || '---'}</span>
              </div>
            </div>
            
            {/* ستون 2 */}
            <div className="space-y-5">
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>وضعیت تأهل</span>
                <div className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {emp.marital_status ? maritalDict[emp.marital_status] : 'ثبت نشده'}
                  {emp.children_count > 0 && <span className="text-blue-500 text-xs font-bold mr-1 bg-blue-500/10 px-1.5 py-0.5 rounded">({emp.children_count} فرزند)</span>}
                </div>
              </div>
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تاریخ تولد</span>
                <span className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>{birthDate}</span>
              </div>
            </div>

            {/* ستون 3 */}
            <div className="space-y-5">
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تحصیلات</span>
                <div className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {emp.education_level ? eduDict[emp.education_level] : 'ثبت نشده'}
                  {emp.education_field && <div className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>({emp.education_field})</div>}
                </div>
              </div>
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>وضعیت سربازی</span>
                <span className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>{emp.military_status ? militaryDict[emp.military_status] : 'ثبت نشده'}</span>
              </div>
            </div>

            {/* ستون 4 */}
            <div className="space-y-5">
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>سوابق داخل سازمان</span>
                <span className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {emp.experience_inside_years || 0} سال و {emp.experience_inside_months || 0} ماه
                </span>
              </div>
              <div>
                <span className={`block font-bold mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>وضعیت ایثارگری</span>
                <span className={`font-black text-base px-2 py-0.5 rounded-md ${
                  emp.is_veteran ? 'text-emerald-600 bg-emerald-100 border border-emerald-200' : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {emp.is_veteran ? 'دارد' : 'ندارد'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* دکمه‌های دسترسی سریع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {buttons.map((btn, index) => (
            <button
              key={index}
              onClick={() => navigate(btn.path)}
              className={`group flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br hover:-translate-y-1 hover:shadow-xl transition-all duration-300 rounded-2xl shadow-md border-b-4 ${
                isDark ? btn.gradientDark : btn.gradientLight
              }`}
            >
              <div className="text-4xl md:text-5xl drop-shadow-md text-white/90 group-hover:scale-110 group-hover:text-white transition-transform duration-300">
                {btn.icon}
              </div>
              <span className="text-lg font-black text-white tracking-tight text-center line-clamp-1">{btn.label}</span>
            </button>
          ))}
        </div>
        
      </div>
    </div>
  );
};

export default UserDashboard;