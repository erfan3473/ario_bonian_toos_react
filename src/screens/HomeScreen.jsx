// src/screens/HomeScreen.jsx

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
  FaComments // ✅ اضافه شد
} from 'react-icons/fa';

import bannerImage from '../assets/banner.webp';

const HomeScreen = () => {
  const { userInfo } = useSelector((state) => state.userLogin);
  
  // ✅ چک کردن نقش ادمین
  const isAdmin = userInfo?.is_admin;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900">
      
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 🎯 بخش Hero با بنر */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* بنر تصویری */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImage} 
            alt="سیستم اتوماسیون آریو بنیان طوس" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 to-gray-900"></div>
        </div>

        {/* محتوای Hero */}
        <div className="relative z-10 container mx-auto px-6 py-20 text-center">
          <div className="flex items-center justify-center mb-6">
            <FaRocket className="text-yellow-400 text-5xl animate-bounce" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-4 drop-shadow-2xl">
            سیستم اتوماسیون <span className="text-yellow-400">۸ پا</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            مدیریت هوشمند پروژه‌های عمرانی | حضور و غیاب | گزارش‌دهی لحظه‌ای
          </p>

          <div className="flex flex-wrap gap-4 justify-center items-center">
            {/* ✅ دکمه دانلود اپلیکیشن اندروید */}
            <a 
              href="https://ariobonyantoos.com/media/downloads/8pa.apk"
              download="8Pa.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
            >
              <FaAndroid className="text-3xl" />
              <div className="text-right">
                <div className="text-xs">دانلود اپلیکیشن</div>
                <div className="text-lg">Android (85MB)</div>
              </div>
            </a>

            {!userInfo && (
              <Link 
                to="/auth"
                className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <FaShieldAlt className="text-2xl" />
                <span>ورود به پنل مدیریت</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📱 معرفی ویژگی‌های اپلیکیشن */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            ویژگی‌های اپلیکیشن موبایل
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FaMobileAlt />}
              title="ثبت حضور با GPS"
              description="ثبت ورود و خروج خودکار با موقعیت جغرافیایی"
              color="blue"
            />
            <FeatureCard
              icon={<FaFileAlt />}
              title="گزارش‌دهی سریع"
              description="ارسال گزارش کارکرد روزانه با عکس و توضیحات"
              color="green"
            />
            <FeatureCard
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
        <section className="py-16">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl p-8 border-2 border-yellow-500/50">
              <div className="flex items-center gap-4 mb-8">
                <FaShieldAlt className="text-yellow-400 text-4xl" />
                <h2 className="text-3xl font-bold text-white">
                  پنل مدیریت سیستم
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                 {/* ✅ پیام‌رسان (اضافه شد) */}
                 <AdminButton
                  to="/chat"
                  icon={<FaComments />}
                  title="پیام‌رسان"
                  description="گفت‌وگو و مدیریت ماموریت‌ها"
                  color="cyan"
                />

                {/* مدیریت کاربران */}
                <AdminButton
                  to="/admin/users"
                  icon={<FaUsers />}
                  title="مدیریت کاربران"
                  description="افزودن و ویرایش کارکنان"
                  color="blue"
                />

                {/* مدیریت پروژه‌ها */}
                <AdminButton
                  to="/projects"
                  icon={<FaBuilding />}
                  title="مدیریت پروژه‌ها"
                  description="پروژه‌ها و محدوده جغرافیایی"
                  color="purple"
                />

                {/* مانیتور نیروها */}
                <AdminButton
                  to="/dashboard"
                  icon={<FaChartLine />}
                  title="مانیتور نیروها"
                  description="وضعیت لحظه‌ای کارکنان"
                  color="green"
                />

                {/* خلاصه گزارش */}
                <AdminButton
                  to="/admin/daily-summary"
                  icon={<FaClipboardList />}
                  title="خلاصه گزارش"
                  description="آمار و ارقام کلی"
                  color="indigo"
                />

                {/* مدیریت درخواست‌ها */}
                <AdminButton
                  to="/admin/requests"
                  icon={<FaCheckCircle />}
                  title="مدیریت درخواست‌ها"
                  description="تایید مرخصی، مالی و تجهیزات"
                  color="pink"
                />

                {/* تنظیمات */}
                <AdminButton
                  to="/admin/settings"
                  icon={<FaCog />}
                  title="تنظیمات"
                  description="مشاغل، نوع مرخصی و ..."
                  color="gray"
                />
                <AdminButton
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
      <section className="py-16 bg-gray-900/50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="bg-gray-800/50 rounded-2xl p-8 backdrop-blur-sm border border-gray-700">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              چگونه شروع کنم؟
            </h2>
            
            <div className="space-y-4">
              <GuideStep 
                number="1"
                title="دانلود اپلیکیشن"
                description="فایل APK را دانلود و روی گوشی خود نصب کنید"
              />
              <GuideStep 
                number="2"
                title="ورود به سیستم"
                description="با شماره موبایل و رمز عبور دریافتی وارد شوید"
              />
              <GuideStep 
                number="3"
                title="ثبت حضور"
                description="در محل کار، دکمه ثبت حضور را بزنید"
              />
              <GuideStep 
                number="4"
                title="گزارش‌دهی"
                description="در پایان روز، گزارش کارکرد خود را ارسال کنید"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📞 تماس با ما */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            نیاز به راهنمایی دارید؟
          </h2>
          <p className="text-gray-300 mb-6">
            تیم پشتیبانی ما آماده کمک به شماست
          </p>
          <a 
            href="tel:+989157051014"
            className="inline-block bg-white text-blue-900 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-all"
          >
            تماس با پشتیبانی 09157051014
          </a>
        </div>
      </section>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎨 Component های کمکی
// ═══════════════════════════════════════════════════════════

const FeatureCard = ({ icon, title, description, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-700',
    green: 'from-green-500 to-green-700',
    yellow: 'from-yellow-500 to-yellow-700',
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all hover:transform hover:scale-105">
      <div className={`w-16 h-16 bg-gradient-to-br ${colors[color]} rounded-2xl flex items-center justify-center text-white text-3xl mb-4 mx-auto`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 text-center">{title}</h3>
      <p className="text-gray-400 text-center">{description}</p>
    </div>
  );
};

const AdminButton = ({ to, icon, title, description, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800',
    purple: 'from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800',
    green: 'from-green-500 to-green-700 hover:from-green-600 hover:to-green-800',
    orange: 'from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800',
    indigo: 'from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800',
    pink: 'from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800',
    gray: 'from-gray-500 to-gray-700 hover:from-gray-600 hover:to-gray-800',
    cyan: 'from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800', // ✅ cyan اضافه شد
  };

  return (
    <Link
      to={to}
      className={`bg-gradient-to-br ${colors[color]} p-6 rounded-2xl text-white hover:shadow-2xl transform hover:scale-105 transition-all duration-300`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </Link>
  );
};

const GuideStep = ({ number, title, description }) => (
  <div className="flex gap-4 items-start">
    <div className="flex-shrink-0 w-10 h-10 bg-yellow-500 text-gray-900 rounded-full flex items-center justify-center font-bold">
      {number}
    </div>
    <div>
      <h3 className="text-white font-bold mb-1">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  </div>
);

export default HomeScreen;