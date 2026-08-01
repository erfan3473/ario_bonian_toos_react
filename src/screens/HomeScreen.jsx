import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  FaAndroid, 
  FaUsers, 
  FaChartLine, 
  FaClipboardList,
  FaCog,
  FaBuilding,
  FaFileAlt,
  FaCheckCircle,
  FaMobileAlt,
  FaRocket,
  FaShieldAlt,
  FaComments
} from 'react-icons/fa';

import bannerImage from '../assets/banner.webp';

const HomeScreen = () => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';
  
  const isAdmin = userInfo?.is_admin;

  return (
    <div className={`min-h-screen transition-colors duration-300 bg-gradient-to-br ${isDark ? 'from-slate-900 via-slate-800 to-blue-900' : 'from-gray-50 via-gray-100 to-blue-50'}`}>
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🎯 بخش Hero با بنر (عکس گرد شده و خوانا) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 pt-6 pb-8 md:pt-10 md:pb-12">
        {/* کانتینر اصلی بنر با گوشه‌های گرد */}
        <div className={`relative rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-blue-900'}`}>
          {/* عکس بنر */}
          <img 
            src={bannerImage} 
            alt="سیستم اتوماسیون آریو بنیان طوس" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 md:opacity-60"
          />
          {/* لایه گرادیانت برای خوانایی بهتر متن روی عکس */}
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-slate-900/90 to-transparent' : 'from-slate-900/80 to-transparent'}`}></div>

          {/* محتوای Hero */}
          <div className="relative z-10 px-4 py-12 md:py-24 text-center">
            <div className="flex items-center justify-center mb-4 md:mb-6">
              <FaRocket className="text-yellow-400 text-3xl md:text-5xl animate-bounce" />
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-3 md:mb-4 drop-shadow-lg text-white">
              سیستم اتوماسیون <span className="text-yellow-400">۸ پا</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-xl mb-8 max-w-3xl mx-auto px-2 text-gray-200">
              مدیریت هوشمند پروژه‌های عمرانی | حضور و غیاب | گزارش‌دهی لحظه‌ای
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto sm:max-w-none">
              {/* ✅ دکمه دانلود اپلیکیشن اندروید - بهینه‌شده برای موبایل */}
              <a 
                href="https://ariobonyantoos.com/media/downloads/8pa.apk"
                download="8Pa.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 md:py-4 md:px-8 rounded-sm shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <FaAndroid className="text-xl md:text-3xl" />
                <div className="text-right">
                  <div className="text-[9px] md:text-xs">دانلود اپلیکیشن</div>
                  <div className="text-sm md:text-lg">Android (85MB)</div>
                </div>
              </a>

              {!userInfo && (
                <Link 
                  to="/auth"
                  className="flex items-center justify-center w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 md:py-4 md:px-8 rounded-sm shadow-lg transform hover:scale-105 transition-all duration-300 text-sm md:text-base"
                >
                  <FaShieldAlt className="text-lg md:text-2xl" />
                  <span>ورود به پنل سازمان</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📱 معرفی ویژگی‌های اپلیکیشن */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className={`py-10 md:py-16 ${isDark ? 'bg-slate-900/50' : 'bg-white/40'}`}>
        <div className="container mx-auto px-4 md:px-6">
          <h2 className={`text-xl sm:text-2xl md:text-4xl font-bold text-center mb-6 md:mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ویژگی‌های اپلیکیشن موبایل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            <FeatureCard
              isDark={isDark}
              icon={<FaMobileAlt />}
              title="ثبت حضور با GPS"
              description="ثبت ورود و خروج خودکار با موقعیت جغرافیایی"
              color="blue"
            />
            <FeatureCard
              isDark={isDark}
              icon={<FaFileAlt />}
              title="گزارش‌دهی سریع"
              description="ارسال گزارش کارکرد روزانه با عکس و توضیحات"
              color="green"
            />
            <FeatureCard
              isDark={isDark}
              icon={<FaCheckCircle />}
              title="درخواست‌ها"
              description="ثبت درخواست مرخصی، مالی و تجهیزات"
              color="yellow"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🎛️ پنل مدیریت (فقط برای ادمین‌ها) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isAdmin && (
        <section className="py-10 md:py-16">
          <div className="container mx-auto px-2 sm:px-4 md:px-6">
            <div className={`rounded-sm p-4 sm:p-6 md:p-8 border-2 transition-colors duration-300 ${isDark ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gradient-to-r from-yellow-100 to-orange-50 border-yellow-300 shadow-sm'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-6 md:mb-8 text-center sm:text-right">
                <FaShieldAlt className={`text-2xl sm:text-3xl md:text-4xl ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <h2 className={`text-lg sm:text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  پنل مدیریت سیستم
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
                 <AdminButton
                  isDark={isDark}
                  to="/chat"
                  icon={<FaComments />}
                  title="پیام‌رسان"
                  description="گفت‌وگو و مدیریت ماموریت‌ها"
                  color="cyan"
                />
                <AdminButton
                  isDark={isDark}
                  to="/admin/users"
                  icon={<FaUsers />}
                  title="کاربران"
                  description="افزودن و ویرایش کارکنان"
                  color="blue"
                />
                <AdminButton
                  isDark={isDark}
                  to="/projects"
                  icon={<FaBuilding />}
                  title="پروژه‌ها"
                  description="پروژه‌ها و محدوده جغرافیایی"
                  color="purple"
                />
                <AdminButton
                  isDark={isDark}
                  to="/dashboard"
                  icon={<FaChartLine />}
                  title="مانیتور نیروها"
                  description="وضعیت لحظه‌ای کارکنان"
                  color="green"
                />
                <AdminButton
                  isDark={isDark}
                  to="/admin/daily-summary"
                  icon={<FaClipboardList />}
                  title="خلاصه گزارش"
                  description="آمار و ارقام کلی"
                  color="indigo"
                />
                <AdminButton
                  isDark={isDark}
                  to="/admin/requests"
                  icon={<FaCheckCircle />}
                  title="درخواست‌ها"
                  description="تایید مرخصی، مالی و تجهیزات"
                  color="pink"
                />
                <AdminButton
                  isDark={isDark}
                  to="/admin/settings"
                  icon={<FaCog />}
                  title="تنظیمات"
                  description="مشاغل، نوع مرخصی و ..."
                  color="gray"
                />
                <AdminButton
                  isDark={isDark}
                  to="/tasks"
                  icon={<FaClipboardList />}
                  title="ماموریت‌ها"
                  description="مدیریت و پیگیری ماموریت‌های اداری"
                  color="orange"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 💬 راهنمای سریع */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className={`py-10 md:py-16 ${isDark ? 'bg-slate-900/50' : 'bg-white/40'}`}>
        <div className="container mx-auto px-4 md:px-6 max-w-4xl">
          <div className={`rounded-sm p-5 md:p-8 backdrop-blur-sm border transition-colors ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-gray-200 shadow-sm'}`}>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-5 md:mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              چگونه شروع کنم؟
            </h2>
            
            <div className="space-y-3 md:space-y-5">
              <GuideStep 
                isDark={isDark}
                number="1"
                title="دانلود اپلیکیشن"
                description="فایل APK را دانلود و روی گوشی خود نصب کنید"
              />
              <GuideStep 
                isDark={isDark}
                number="2"
                title="ورود به سیستم"
                description="با شماره موبایل و رمز عبور دریافتی وارد شوید"
              />
              <GuideStep 
                isDark={isDark}
                number="3"
                title="ثبت حضور"
                description="در محل کار، دکمه ثبت حضور را بزنید"
              />
              <GuideStep 
                isDark={isDark}
                number="4"
                title="گزارش‌دهی"
                description="در پایان روز، گزارش کارکرد خود را ارسال کنید"
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎨 Component های کمکی
// ═══════════════════════════════════════════════════════════

const FeatureCard = ({ isDark, icon, title, description, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-400 to-yellow-600',
  };

  return (
    <div className={`backdrop-blur-sm rounded-sm p-5 border transition-all hover:transform hover:-translate-y-1 ${isDark ? 'bg-slate-800/80 border-slate-700 hover:border-slate-500' : 'bg-white/90 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'}`}>
      <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${colors[color]} rounded-sm flex items-center justify-center text-white text-xl md:text-3xl mb-3 md:mb-4 mx-auto shadow-sm`}>
        {icon}
      </div>
      <h3 className={`text-base md:text-xl font-bold mb-1.5 md:mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`text-xs md:text-base text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
    </div>
  );
};

const AdminButton = ({ isDark, to, icon, title, description, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800',
    purple: 'from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800',
    green: 'from-green-500 to-green-700 hover:from-green-600 hover:to-green-800',
    orange: 'from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800',
    indigo: 'from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800',
    pink: 'from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800',
    gray: 'from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800',
    cyan: 'from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800',
  };

  return (
    <Link
      to={to}
      className={`bg-gradient-to-br ${colors[color]} p-3 sm:p-4 md:p-6 rounded-sm text-white shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-right`}
    >
      <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 opacity-90">{icon}</div>
      <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1">{title}</h3>
      <p className="text-[10px] sm:text-xs md:text-sm opacity-80 leading-tight hidden sm:block">{description}</p>
    </Link>
  );
};

const GuideStep = ({ isDark, number, title, description }) => (
  <div className={`flex gap-3 items-start p-2.5 md:p-4 rounded-sm transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
    <div className={`flex-shrink-0 w-7 h-7 md:w-10 md:h-10 text-gray-900 rounded-sm flex items-center justify-center font-bold text-xs md:text-base ${isDark ? 'bg-yellow-500' : 'bg-yellow-400 shadow-sm'}`}>
      {number}
    </div>
    <div>
      <h3 className={`font-bold mb-0.5 md:mb-1 text-sm md:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`text-[11px] md:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
    </div>
  </div>
);

export default HomeScreen;
