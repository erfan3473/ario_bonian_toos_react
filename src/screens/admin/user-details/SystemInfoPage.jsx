// src/screens/admin/user-details/SystemInfoPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { updateUser, fetchUserDetail } from '../../../features/admin/usersSlice';
import { FaUserShield, FaSave, FaArrowRight, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const SystemInfoPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // انتخاب دقیق از Redux برای جلوگیری از رندرهای اضافی
  const user = useSelector((state) => state.admin.users.selectedUser);
  const loading = useSelector((state) => state.admin.users.loading);
  const updateStatus = useSelector((state) => state.admin.users.updateStatus);
  
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const userLoading = typeof loading === 'object' ? loading?.userDetail : loading;
  const isUpdating = updateStatus?.loading || false;
  const updateSuccess = updateStatus?.success || false;
  const updateError = updateStatus?.error || null;

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    is_admin: false,
  });

  // استیتی برای جلوگیری از بازنویسی فرم هنگام تایپ کردن کاربر
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // ریست کردن وضعیت مقداردهی در صورت تغییر کاربر (تغییر URL)
  useEffect(() => {
    setIsFormInitialized(false);
  }, [userId]);

  // فچ کردن اطلاعات کاربر در صورت نیاز
  useEffect(() => {
    if (!user || user.id !== parseInt(userId)) {
      dispatch(fetchUserDetail(userId));
    }
  }, [dispatch, userId, user]);

  // مقداردهی اولیه فرم فقط برای یک بار (حل مشکل پریدن تیک و تکست‌ها)
  useEffect(() => {
    if (user && user.id === parseInt(userId) && !isFormInitialized) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.profile?.phone_number || '',
        is_admin: user.is_superuser || false,
      });
      setIsFormInitialized(true);
    }
  }, [user, userId, isFormInitialized]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number,
      is_admin: formData.is_admin,
    };
    dispatch(updateUser({ userId: user.id, data: payload }));
  };

  if (userLoading) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>در حال لود اطلاعات سیستمی...</div>
        </div>
      </div>
    );
  }

  if (!user) return <div className={`text-center py-10 font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>کاربر یافت نشد</div>;

  return (
    <div className={`min-h-[80vh] p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto w-full">
        
        {/* 📍 مسیرنما (Breadcrumbs) */}
        <nav className={`flex text-xs sm:text-sm mb-6 p-4 rounded-xl border shadow-sm transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
        }`}>
          <ol className="flex items-center space-x-2 space-x-reverse min-w-0 overflow-hidden">
            <li className="whitespace-nowrap">
              <Link to="/admin/users" className={`font-bold transition-colors ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>
                👥 لیست کاربران
              </Link>
            </li>
            <li className="shrink-0"><span className="mx-1 sm:mx-2 opacity-50">/</span></li>
            <li className="truncate">
              <Link to={`/admin/users/${userId}`} className={`font-bold transition-colors truncate block ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>
                داشبورد {user.first_name} {user.last_name}
              </Link>
            </li>
            <li className="shrink-0"><span className="mx-1 sm:mx-2 opacity-50">/</span></li>
            <li className="text-blue-500 font-black whitespace-nowrap">اطلاعات سیستمی</li>
          </ol>
        </nav>

        {/* محتوای اصلی فرم با بردر سازمانی */}
        <div className={`p-6 md:p-8 rounded-2xl border-2 shadow-2xl transition-all duration-300 ${
          isDark ? 'bg-gray-800/80 border-blue-700' : 'bg-white border-blue-600'
        }`}>
          
          {/* هدر */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <span className="text-blue-500 text-3xl"><FaUserShield /></span> اطلاعات سیستمی
            </h2>
            <button
              type="button"
              onClick={() => navigate(`/admin/users/${userId}`)}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <FaArrowRight /> بازگشت
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* پیام‌های خطا و موفقیت */}
            {updateSuccess && (
              <div className={`rounded-xl p-4 border font-bold flex items-center gap-2 ${
                isDark ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-300 text-green-700'
              }`}>
                <span>✅</span> اطلاعات با موفقیت ذخیره شد.
              </div>
            )}

            {updateError && (
              <div className={`rounded-xl p-4 border font-bold flex items-center gap-2 ${
                isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                <span>❌</span> {updateError}
              </div>
            )}

            {/* نام کاربری و ایمیل */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  نام کاربری <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  ایمیل
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* نام و نام‌خانوادگی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  نام
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  نام‌خانوادگی
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* شماره موبایل */}
            <div>
              <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                شماره موبایل <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                maxLength={11}
                pattern="09[0-9]{9}"
                placeholder="09123456789"
                className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono ${
                  isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                }`}
              />
              <p className={`text-xs mt-2 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>فرمت صحیح: 09xxxxxxxxx</p>
            </div>

            {/* سطح دسترسی - فقط ادمین */}
            <div className={`rounded-xl p-6 border transition-colors ${
              isDark ? 'bg-gradient-to-br from-purple-900/30 to-purple-800/10 border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-white border-purple-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl drop-shadow-md">👑</span>
                <div>
                  <h3 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>سطح دسترسی مدیریتی</h3>
                  <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    دسترسی به پنل مدیریت کاربران و تنظیمات سیستم
                  </p>
                </div>
              </div>

              <label className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer rounded-xl p-4 transition-colors border ${
                isDark ? 'bg-gray-800/80 hover:bg-gray-700/80 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm'
              }`}>
                <input
                  type="checkbox"
                  name="is_admin"
                  checked={formData.is_admin}
                  onChange={handleChange}
                  className="w-6 h-6 rounded cursor-pointer transition-colors focus:ring-2 text-purple-600 focus:ring-purple-500 border-gray-300 bg-white"
                  style={isDark ? { borderColor: '#4B5563', backgroundColor: '#374151' } : {}}
                />
                <div>
                  <span className={`font-black text-lg flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <FaUserShield className={isDark ? 'text-purple-400' : 'text-purple-600'} /> دسترسی مدیر سیستم
                  </span>
                  <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    امکان مدیریت کاربران، تخصیص سمت، مشاهده گزارش‌ها و دسترسی کامل به همه بخش‌های ادمین
                  </p>
                </div>
              </label>

              {formData.is_admin && (
                <div className={`mt-4 rounded-xl p-4 border flex items-start gap-3 animate-fade-in ${
                  isDark ? 'bg-yellow-900/20 border-yellow-700/50 text-yellow-400' : 'bg-yellow-50 border-yellow-300 text-yellow-700'
                }`}>
                  <FaExclamationTriangle className="text-xl shrink-0 mt-0.5" />
                  <span className="font-bold text-sm leading-relaxed">
                    این کاربر هم‌اکنون به تمام بخش‌های مدیریتی سیستم دسترسی کامل دارد. لطفاً در اعطای این دسترسی دقت فرمایید.
                  </span>
                </div>
              )}
            </div>

            {/* نکته مهم */}
            <div className={`rounded-xl p-4 border flex items-start gap-3 ${
              isDark ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'
            }`}>
              <FaInfoCircle className={`text-xl shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                <strong className="font-black">نکته:</strong> همه افراد ثبت شده در سیستم، به صورت پیش‌فرض نقش "کارمند/کارگر" دارند. 
                تنها با فعال کردن تیک "دسترسی مدیر سیستم" قادر به ورود به پنل ادمین خواهند بود.
              </p>
            </div>

            {/* دکمه ذخیره */}
            <div className="flex justify-end gap-3 pt-6 border-t border-dashed mt-8 border-gray-500/30">
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="text-lg" />
                    <span>ذخیره تغییرات سیستمی</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default SystemInfoPage;