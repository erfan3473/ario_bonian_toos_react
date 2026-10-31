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
  FaComments,
  FaRecycle,
  FaCertificate,
  FaArrowLeft
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
      {/* 🌿 بنر ویژه معرفی سامانه پسماند اکو با مجوز شهرداری (بالای صفحه) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        <div className={`relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-8 border shadow-xl backdrop-blur-md transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 border-emerald-500/40 text-white' 
            : 'bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-emerald-300 text-gray-900 shadow-emerald-100/50'
        }`}>
          {/* هاله نور پس‌زمینه تزئینی */}
          <div className="absolute -top-12 -left-12 w-40 h-40 sm:w-56 sm:h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-40 h-40 sm:w-56 sm:h-56 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 md:gap-6">
            
            {/* محتوای متنی و نشان مجوز */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-right gap-3 sm:gap-4 flex-1">
              {/* آیکون گرد شاخص */}
              <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-2xl sm:text-3xl shadow-lg shadow-emerald-600/30">
                <FaRecycle className="animate-spin-slow" />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-lg sm:text-xl md:text-2xl font-black tracking-tight">
                    سامانه هوشمند مدیریت پسماند <span className="text-emerald-500">اکو</span>
                  </span>
                  {/* نشان رسمی مجوز شهرداری */}
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold border ${
                    isDark 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    <FaCertificate className="text-amber-400 text-xs" />
                    دارای مجوز رسمی شهرداری
                  </span>
                </div>

                <p className={`text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  شرکت آریو بنیان توس با اخذ مجوزهای رسمی از سازمان مدیریت پسماند، سامانه یکپارچه جمع‌آوری و بازیافت را راه‌اندازی نمود. تفکیک هوشمند از مبدا، ناوگان آنلاین و تسویه آنی کیف پول شهروندی.
                </p>
              </div>
            </div>

            {/* دکمه ورود به سامانه اکو */}
            <div className="w-full sm:w-auto flex-shrink-0 flex justify-center">
              <a
                href="https://eco.ariobonyantoos.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-emerald-700/30 transform hover:scale-105 active:scale-95 transition-all duration-300 text-xs sm:text-sm md:text-base"
              >
                <span>ورود به سامانه پسماند اکو</span>
                <FaArrowLeft className="text-xs sm:text-sm" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🎯 بخش Hero با بنر (عکس گرد شده و خوانا) */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-3 sm:px-4 pt-4 pb-8 md:pt-6 md:pb-12">
        <div className={`relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-blue-900'}`}>
          <img 
            src={bannerImage} 
            alt="سیستم اتوماسیون آریو بنیان طوس" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 md:opacity-60"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-slate-900/90 to-transparent' : 'from-slate-900/80 to-transparent'}`}></div>

          <div className="relative z-10 px-4 py-10 sm:py-16 md:py-24 text-center">
            <div className="flex items-center justify-center mb-3 sm:mb-6">
              <FaRocket className="text-yellow-400 text-2xl sm:text-4xl md:text-5xl animate-bounce" />
            </div>
            
            <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black mb-3 md:mb-4 drop-shadow-lg text-white">
              سیستم اتوماسیون <span className="text-yellow-400">۸ پا</span>
            </h1>
            
            <p className="text-xs sm:text-base md:text-xl mb-6 sm:mb-8 max-w-3xl mx-auto px-2 text-gray-200 leading-relaxed">
              مدیریت هوشمند پروژه‌های عمرانی | حضور و غیاب | گزارش‌دهی لحظه‌ای
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto sm:max-w-none">
              {/* دکمه دانلود اپلیکیشن اندروید ۸پا */}
              <a 
                href="https://ariobonyantoos.com/media/downloads/8pa.apk"
                download="8Pa.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full sm:w-auto gap-2.5 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 md:py-3.5 md:px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                <FaAndroid className="text-xl md:text-3xl" />
                <div className="text-right">
                  <div className="text-[9px] md:text-xs text-green-100">دانلود اپلیکیشن سازمانی</div>
                  <div className="text-xs sm:text-sm md:text-lg">Android (85MB)</div>
                </div>
              </a>

              {!userInfo && (
                <Link 
                  to="/auth"
                  className="flex items-center justify-center w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 md:py-4 md:px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm md:text-base"
                >
                  <FaShieldAlt className="text-base md:text-2xl" />
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
      <section className={`py-8 md:py-16 ${isDark ? 'bg-slate-900/50' : 'bg-white/40'}`}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6">
          <h2 className={`text-lg sm:text-2xl md:text-4xl font-bold text-center mb-6 md:mb-12 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ویژگی‌های اپلیکیشن موبایل
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-8">
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
        <section className="py-8 md:py-16">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className={`rounded-2xl p-4 sm:p-6 md:p-8 border-2 transition-colors duration-300 ${
              isDark 
                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
                : 'bg-gradient-to-r from-yellow-100 to-orange-50 border-yellow-300 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-5 sm:mb-8 text-center sm:text-right">
                <FaShieldAlt className={`text-2xl sm:text-3xl md:text-4xl ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                <h2 className={`text-base sm:text-xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  پنل مدیریت سیستم
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-5">
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
      <section className={`py-8 md:py-16 ${isDark ? 'bg-slate-900/50' : 'bg-white/40'}`}>
        <div className="container mx-auto px-3 sm:px-4 md:px-6 max-w-4xl">
          <div className={`rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-md border transition-colors ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white/90 border-gray-200 shadow-sm'
          }`}>
            <h2 className={`text-lg sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
              چگونه شروع کنم؟
            </h2>
            
            <div className="space-y-2.5 sm:space-y-4">
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
    <div className={`backdrop-blur-sm rounded-xl p-4 sm:p-5 border transition-all hover:transform hover:-translate-y-1 ${
      isDark ? 'bg-slate-800/80 border-slate-700 hover:border-slate-500' : 'bg-white/90 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
    }`}>
      <div className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${colors[color]} rounded-xl flex items-center justify-center text-white text-xl md:text-3xl mb-3 md:mb-4 mx-auto shadow-sm`}>
        {icon}
      </div>
      <h3 className={`text-sm sm:text-base md:text-xl font-bold mb-1 sm:mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-[11px] sm:text-xs md:text-sm text-center leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
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
      className={`bg-gradient-to-br ${colors[color]} p-2.5 sm:p-4 md:p-6 rounded-xl text-white shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col items-center sm:items-start text-center sm:text-right`}
    >
      <div className="text-xl sm:text-3xl md:text-4xl mb-1.5 sm:mb-3 opacity-90">{icon}</div>
      <h3 className="text-xs sm:text-sm md:text-lg font-bold mb-0.5 sm:mb-1">{title}</h3>
      <p className="text-[10px] sm:text-xs md:text-sm opacity-80 leading-tight hidden sm:block">{description}</p>
    </Link>
  );
};

const GuideStep = ({ isDark, number, title, description }) => (
  <div className={`flex gap-2.5 sm:gap-3 items-start p-2 sm:p-3 md:p-4 rounded-xl transition-colors ${
    isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
  }`}>
    <div className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-gray-900 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm md:text-base ${
      isDark ? 'bg-yellow-500' : 'bg-yellow-400 shadow-sm'
    }`}>
      {number}
    </div>
    <div>
      <h3 className={`font-bold mb-0.5 text-xs sm:text-sm md:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`text-[10px] sm:text-xs md:text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
    </div>
  </div>
);

export default HomeScreen;