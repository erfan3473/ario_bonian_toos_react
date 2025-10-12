// src/screens/HomeScreen.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

// کامپوننت‌های آیکون (بدون تغییر)
const IconScale = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 21h16.5M16.5 3.75h.008v.008h-.008V3.75z" />
  </svg>
);
const IconTech = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 12l4.179 2.25M21.75 12l-4.179-2.25v4.5l4.179-2.25z" />
  </svg>
);
const IconQuality = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconTrust = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-blue-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m9.75 9.75h-4.5a2.25 2.25 0 00-2.25 2.25v2.25a2.25 2.25 0 002.25 2.25h4.5a2.25 2.25 0 002.25-2.25V16.5a2.25 2.25 0 00-2.25-2.25z" />
  </svg>
);


// بخش‌های مختلف صفحه اصلی

const HeroSection = () => (
  <section className="h-screen w-full flex flex-col justify-center items-center relative text-white text-center bg-gray-900 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-black opacity-80 z-10"></div>
    <div className="absolute inset-0 z-0">
        <div className="w-full h-full border-2 border-dashed border-gray-700 flex justify-center items-center">
            {/* ✅ اصلاح ۱: رنگ متن Placeholder به خاکستری روشن تغییر کرد */}
            <p className="text-gray-500 text-lg">[ Placeholder for Rive Animation ]</p>
        </div>
    </div>
    
    <div className="z-20 p-4">
      {/* ✅ اصلاح ۲: کل تگ h1 به رنگ سفید درمی‌آید و فقط span داخلی آبی می‌ماند */}
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4 text-white">
        آریوبنیان توس: <span className="text-blue-500">مجری مگاپروژه‌های زیرساختی</span>
      </h1>
      <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8">
        تلفیق دانش مهندسی، تکنولوژی روز و تعهد برای ساختن فردای ایران
      </p>
      <a
        href="#featured-projects"
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
      >
        مشاهده پروژه‌های شاخص
      </a>
    </div>
  </section>
);

const ValuePropositionSection = () => (
    <section id="why-us" className="bg-gray-900 py-20 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold text-white mb-2">چرا آریوبنیان توس؟</h2>
        <p className="text-gray-400 mb-12">مزیت‌های رقابتی ما در اجرای پروژه‌های کلان</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <IconScale />
            <h3 className="text-xl font-bold text-white mt-6 mb-2">توان اجرایی در مقیاس کلان</h3>
            <p className="text-gray-400">مدیریت و اجرای پروژه‌های چندوجهی و عظیم در سطح ملی.</p>
          </div>
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <IconTech />
            <h3 className="text-xl font-bold text-white mt-6 mb-2">تکنولوژی و نوآوری</h3>
            <p className="text-gray-400">استفاده از پهپادهای نقشه‌برداری، BIM و اتوماسیون در پروژه‌ها.</p>
          </div>
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <IconQuality />
            <h3 className="text-xl font-bold text-white mt-6 mb-2">تضمین زمان و کیفیت</h3>
            <p className="text-gray-400">تعهد به زمان‌بندی دقیق و بالاترین استانداردهای کیفی.</p>
          </div>
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
            <IconTrust />
            <h3 className="text-xl font-bold text-white mt-6 mb-2">شریک استراتژیک قابل اعتماد</h3>
            <p className="text-gray-400">سوابق درخشان در همکاری با شهرداری‌ها و ارگان‌های دولتی.</p>
          </div>
        </div>
      </div>
    </section>
);

const FeaturedProjectSection = () => (
  <section id="featured-projects" className="py-20 bg-black px-4">
    <div className="container mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white">پروژه شاخص: آبیاری مکانیزه کوه‌های خلج</h2>
        <p className="text-gray-400 mt-2">بزرگترین پروژه آبیاری فضای سبز ایران، نمادی از توانمندی ما</p>
      </div>
      {/* ✅ اصلاح ۳: گوشه‌ها گردتر شد (rounded-xl) */}
      <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden md:flex">
        <div className="md:w-1/2 bg-gray-800 min-h-[300px] flex items-center justify-center">
            <p className="text-gray-500">Image of Khalaj Project</p>
        </div>
        <div className="p-8 md:w-1/2 flex flex-col justify-center">
          <h3 className="text-2xl font-bold text-white mb-4">مشخصات کلیدی پروژه</h3>
          <div className="space-y-4">
            <div className="flex items-center"><span className="text-blue-400 font-bold text-lg w-32">کارفرما:</span><span className="text-gray-300">شهرداری مشهد</span></div>
            <div className="flex items-center"><span className="text-blue-400 font-bold text-lg w-32">مساحت:</span><span className="text-gray-300">+۵۰۰ هکتار</span></div>
            <div className="flex items-center"><span className="text-blue-400 font-bold text-lg w-32">لوله‌گذاری:</span><span className="text-gray-300">+۱۵۰ کیلومتر</span></div>
          </div>
          <p className="text-gray-400 mt-6 mb-6">این پروژه ملی با چالش‌های فنی و اجرایی منحصر به فردی همراه بود که با موفقیت توسط تیم متخصص آریوبنیان توس به سرانجام رسید.</p>
          <Link to="/projects" className="text-center bg-transparent border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white font-semibold py-2 px-6 rounded-md transition-colors">مشاهده تمام پروژه‌ها</Link>
        </div>
      </div>
    </div>
  </section>
);

// ✅ اصلاح ۴: پیاده‌سازی شمارشگر انیمیشنی
const AnimatedStat = ({ end, suffix, text }) => {
  const { ref, inView } = useInView({
    triggerOnce: true, // فقط یک بار انیمیشن را اجرا کن
    threshold: 0.5, // وقتی ۵۰٪ آیتم دیده شد
  });

  return (
    <div ref={ref} className="text-center">
      <h3 className="text-4xl font-extrabold text-blue-500">
        {inView ? <CountUp end={end} duration={2.5} /> : '0'}
        {suffix && <span>{suffix}</span>}
      </h3>
      <p className="text-gray-400 mt-2">{text}</p>
    </div>
  );
};

const StatsSection = () => (
    <section className="bg-gray-800 py-16">
        <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <AnimatedStat end={20} suffix="+" text="پروژه موفق دولتی" />
                <AnimatedStat end={500} suffix="+" text="کیلومتر راهسازی و لوله‌گذاری" />
                <AnimatedStat end={1.5} decimals={1} suffix="M+" text="متر مکعب عملیات خاکی" />
                <AnimatedStat end={100} suffix="%" text="رضایت کارفرمایان" />
            </div>
        </div>
    </section>
);


const ClientLogosSection = () => (
    <section className="py-16 bg-gray-900">
        <div className="container mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-8">افتخار همکاری با</h2>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
                <p className="text-gray-500 text-xl font-semibold filter grayscale hover:grayscale-0 transition-all">شهرداری مشهد</p>
                <p className="text-gray-500 text-xl font-semibold filter grayscale hover:grayscale-0 transition-all">استانداری خراسان رضوی</p>
                <p className="text-gray-500 text-xl font-semibold filter grayscale hover:grayscale-0 transition-all">وزارت نیرو</p>
                <p className="text-gray-500 text-xl font-semibold filter grayscale hover:grayscale-0 transition-all">اداره کل راه و شهرسازی</p>
            </div>
        </div>
    </section>
);

const FinalCTASection = () => (
    <section className="bg-black text-white py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                پروژه بعدی خود را به یک <span className="text-blue-500">موفقیت ملی</span> تبدیل کنید.
            </h2>
            <p className="text-gray-400 text-lg mb-8">
                تیم کارشناسان ارشد ما آماده ارائه مشاوره و بررسی نیازمندی‌های پروژه‌های بزرگ شماست. همین امروز با ما تماس بگیرید.
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/contact" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                    تماس با واحد توسعه کسب‌وکار
                </Link>
                <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    دریافت کاتالوگ شرکت
                </button>
            </div>
        </div>
    </section>
);


const HomeScreen = () => {
  return (
    <div className="bg-gray-900">
      <HeroSection />
      <ValuePropositionSection />
      <FeaturedProjectSection />
      <StatsSection />
      <ClientLogosSection />
      <FinalCTASection />
      {/* Footer را می‌توانید در اینجا اضافه کنید */}
    </div>
  );
};

export default HomeScreen;