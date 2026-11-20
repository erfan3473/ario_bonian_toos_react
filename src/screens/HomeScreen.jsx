import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FaAndroid, FaRecycle } from 'react-icons/fa';
import {
  ArrowLeftIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  DevicePhoneMobileIcon,
  DocumentTextIcon,
  MapPinIcon,
  PresentationChartLineIcon,
  QueueListIcon,
  ShieldCheckIcon,
  SignalIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import bannerImage from '../assets/banner.webp';

const toPersianDigits = (value) =>
  String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const formatPersianClock = (date) => {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return toPersianDigits(`${hh}:${mm}:${ss}`);
};

const HomeScreen = () => {
  const { userInfo } = useSelector((state) => state.userLogin);
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';
  const isAdmin = Boolean(userInfo?.is_admin);

  const [clock, setClock] = useState(() => formatPersianClock(new Date()));
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const timer = setInterval(() => setClock(formatPersianClock(new Date())), 1000);
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const clearanceLabel = isAdmin
    ? 'سطح دسترسی ۴ | مدیریت ارشد'
    : userInfo
      ? 'سطح دسترسی ۲ | کارشناس سامانه'
      : 'سطح دسترسی ۱ | درگاه عمومی';

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-tactical-lightSurface';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const textMeta = isDark ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className={`relative min-h-screen overflow-x-clip transition-colors duration-200 ${
        isDark
          ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
          : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
      }`}
    >
      {/* بافت خطوط اسکن ظریف صرفاً در حالت تاریک */}
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 tactical-scanlines"
        />
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* 📡 نوار وضعیت عملیاتی و ارتباطی سامانه */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className={`relative z-10 border-b ${borderHairline} ${
          isDark ? 'bg-tactical-surface1/95' : 'bg-white/95'
        } backdrop-blur-sm`}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-10 flex items-center justify-between gap-3 text-[11px] tracking-normal">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span
                className={
                  isOnline
                    ? isDark
                      ? 'text-emerald-400'
                      : 'text-emerald-700'
                    : isDark
                      ? 'text-red-400'
                      : 'text-red-600'
                }
              >
                {isOnline ? 'ارتباط سامانه برقرار' : 'قطع ارتباط شبکه'}
              </span>
            </span>
            <span className={`hidden sm:inline ${textMeta}`}>|</span>
            <span className={`hidden sm:inline truncate ${textMeta}`}>
              ستاد مرکزی | استان خراسان رضوی
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-[2px] border text-[11px] font-medium tracking-normal ${
                isAdmin
                  ? isDark
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-amber-600/40 bg-amber-50 text-amber-700'
                  : isDark
                    ? 'border-sky-400/30 bg-sky-400/10 text-sky-400'
                    : 'border-sky-600/30 bg-sky-50 text-sky-700'
              }`}
            >
              {clearanceLabel}
            </span>
            <span
              dir="ltr"
              className={`tabular-nums font-semibold ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {clock}
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-5 sm:space-y-8">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 🌿 بخش ۰۱: بنر ویژه سامانه هوشمند پسماند آریو پاک (مجوز شهرداری) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section aria-label="سامانه هوشمند مدیریت پسماند آریو پاک">
          <div
            className={`group relative border rounded-[2px] transition-colors duration-150 ${
              isDark
                ? 'bg-tactical-surface1 border-emerald-500/35 hover:border-emerald-400/60'
                : 'bg-white border-emerald-600/35 hover:border-emerald-600/60'
            }`}
          >
            <CornerBrackets accent="emerald" isDark={isDark} />

            {/* نوار سرصفحه پنل */}
            <div
              className={`flex items-center justify-between gap-2 px-3.5 py-2 border-b ${
                isDark
                  ? 'bg-emerald-950/35 border-emerald-500/20'
                  : 'bg-emerald-50/80 border-emerald-600/20'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span
                  className={`text-xs font-semibold truncate tracking-normal ${
                    isDark ? 'text-emerald-300' : 'text-emerald-800'
                  }`}
                >
                  پروژه شهری و محیط‌زیستی | دارای مجوز رسمی سازمان مدیریت پسماند
                </span>
              </div>
              <span
                className={`hidden sm:inline text-[11px] font-medium shrink-0 tracking-normal ${
                  isDark ? 'text-emerald-400/85' : 'text-emerald-700'
                }`}
              >
                بخش ۰۱ | سامانه آریو پاک
              </span>
            </div>

            {/* بدنه بنر */}
            <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-start gap-3.5 flex-1">
                <div
                  className={`shrink-0 w-12 h-12 rounded-[2px] border flex items-center justify-center ${
                    isDark
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-emerald-50 border-emerald-600/35 text-emerald-700'
                  }`}
                >
                  <FaRecycle className="text-xl animate-spin-slow" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className={`text-base sm:text-lg md:text-xl font-bold tracking-normal ${textPrimary}`}>
                      سامانه هوشمند مدیریت پسماند{' '}
                      <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                        آریو پاک
                      </span>
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] text-[11px] font-medium border tracking-normal ${
                        isDark
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/35'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-600/30'
                      }`}
                    >
                      <CheckBadgeIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      دارای مجوز رسمی شهرداری
                    </span>
                  </div>

                  <p className={`text-xs sm:text-sm leading-7 max-w-3xl tracking-normal ${textSecondary}`}>
                    شرکت آریو بنیان توس با اخذ مجوزهای رسمی از سازمان مدیریت پسماند، سامانه یکپارچه جمع‌آوری و بازیافت را راه‌اندازی نمود. تفکیک هوشمند از مبدا، ناوگان آنلاین و تسویه آنی کیف پول شهروندی.
                  </p>
                </div>
              </div>

              <div className="w-full lg:w-auto shrink-0">
                <a
                  href="https://pak.ariobonyantoos.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full lg:w-auto inline-flex items-center justify-center gap-2.5 h-10 px-5 rounded-[2px] font-semibold text-xs sm:text-sm tracking-normal transition-all duration-150 ${
                    isDark
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <span>ورود به سامانه پسماند آریو پاک</span>
                  <ArrowLeftIcon className="w-4 h-4 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 🎯 بخش ۰۲: معرفی سیستم اتوماسیون ۸پا (چیدمان مهندسی ۷ به ۵) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section aria-label="معرفی سیستم اتوماسیون ۸پا">
          <div className={`relative border rounded-[2px] ${surfacePanel} ${borderHairline}`}>
            <CornerBrackets accent="cyan" isDark={isDark} />

            {/* نوار سرصفحه بخش اصلی */}
            <div
              className={`flex items-center justify-between px-3.5 py-2 border-b ${borderHairline} ${surfaceHeader}`}
            >
              <div className="flex items-center gap-2">
                <SignalIcon className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`} />
                <span className={`text-xs font-semibold tracking-normal ${textPrimary}`}>
                  مرکز فرماندهی و اتوماسیون پروژه‌های عمرانی و فضای سبز
                </span>
              </div>
              <span className={`hidden sm:inline text-[11px] font-medium tracking-normal ${textMeta}`}>
                بخش ۰۲ | هسته مرکزی ۸پا
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* ستون راست (۷ ستون): معرفی، مشخصات ساختاری و دکمه‌های اصلی */}
              <div
                className={`lg:col-span-7 p-5 sm:p-7 md:p-8 flex flex-col justify-between gap-6 lg:border-e ${borderHairline}`}
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-[2px] border text-[11px] font-medium tracking-normal ${
                        isDark
                          ? 'border-sky-400/35 bg-sky-400/10 text-sky-400'
                          : 'border-sky-600/35 bg-sky-50 text-sky-700'
                      }`}
                    >
                      سامانه سازمانی ۸پا | نسخه رسمی
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-[2px] border text-[11px] font-medium tracking-normal ${
                        isDark
                          ? 'border-slate-400/20 bg-slate-800/60 text-slate-300'
                          : 'border-slate-900/15 bg-slate-100 text-slate-700'
                      }`}
                    >
                      عمرانی • فضای سبز • خدمات شهری
                    </span>
                  </div>

                  <h1
                    className={`text-2xl sm:text-4xl md:text-[42px] font-bold leading-[1.25] tracking-normal ${textPrimary}`}
                  >
                    سیستم اتوماسیون{' '}
                    <span className={isDark ? 'text-amber-400' : 'text-amber-600'}>
                      ۸ پا
                    </span>
                  </h1>

                  <p className={`text-sm sm:text-base leading-8 max-w-2xl tracking-normal ${textSecondary}`}>
                    مدیریت هوشمند پروژه‌های عمرانی | حضور و غیاب | گزارش‌دهی لحظه‌ای
                  </p>

                  {/* نوار شاخص‌های ساختاری کوتاه */}
                  <div
                    className={`grid grid-cols-3 border ${borderHairline} rounded-[2px] divide-x divide-x-reverse ${
                      isDark ? 'divide-slate-400/15 bg-tactical-canvas/60' : 'divide-slate-900/15 bg-slate-50'
                    }`}
                  >
                    <div className="p-2.5 sm:p-3">
                      <div className={`text-[11px] tracking-normal ${textMeta}`}>
                        پایش موقعیت
                      </div>
                      <div className={`text-xs sm:text-sm font-semibold mt-0.5 tracking-normal ${textPrimary}`}>
                        ثبت مکانی برخط
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <div className={`text-[11px] tracking-normal ${textMeta}`}>
                        گزارش‌گیری
                      </div>
                      <div className={`text-xs sm:text-sm font-semibold mt-0.5 tracking-normal ${textPrimary}`}>
                        گزارش میدانی زنده
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3">
                      <div className={`text-[11px] tracking-normal ${textMeta}`}>
                        بستر اجرا
                      </div>
                      <div className={`text-xs sm:text-sm font-semibold mt-0.5 tracking-normal ${textPrimary}`}>
                        وب و اندروید
                      </div>
                    </div>
                  </div>
                </div>

                {/* دکمه‌های عملیاتی اصلی */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <a
                    href="https://ariobonyantoos.com/media/downloads/8pa.apk"
                    download="8Pa.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center justify-center sm:justify-start gap-3 min-h-[44px] px-5 py-2.5 rounded-[2px] font-semibold tracking-normal transition-all duration-150 ${
                      isDark
                        ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <FaAndroid className="text-2xl shrink-0" />
                    <div className="text-start leading-tight">
                      <div className="text-[11px] opacity-85">دانلود اپلیکیشن سازمانی</div>
                      <div className="text-xs sm:text-sm font-bold tabular-nums">
                        نسخه اندروید (۸۵ مگابایت)
                      </div>
                    </div>
                  </a>

                  {!userInfo && (
                    <Link
                      to="/auth"
                      className={`flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-[2px] border font-semibold text-xs sm:text-sm tracking-normal transition-all duration-150 ${
                        isDark
                          ? 'border-sky-400/50 bg-sky-400/10 hover:bg-sky-400/20 text-sky-300'
                          : 'border-sky-600/50 bg-sky-50 hover:bg-sky-100 text-sky-800'
                      }`}
                    >
                      <ShieldCheckIcon className="w-5 h-5 shrink-0" />
                      <span>ورود به پنل سازمان</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* ستون چپ (۵ ستون): قاب تصویر عملیاتی با نوار شناسنامه */}
              <div className="lg:col-span-5 p-3 sm:p-4 flex flex-col justify-center">
                <div
                  className={`relative w-full h-56 sm:h-72 lg:h-full min-h-[240px] border rounded-[2px] overflow-hidden ${
                    isDark ? 'border-sky-400/30 bg-tactical-canvas' : 'border-slate-900/20 bg-slate-900'
                  }`}
                >
                  <img
                    src={bannerImage}
                    alt="سیستم اتوماسیون آریو بنیان توس"
                    className="w-full h-full object-cover opacity-80"
                  />

                  {/* لایه کنتراست تصویر */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#05070A]/90 via-[#05070A]/25 to-[#05070A]/45"
                  />

                  {/* براکت‌های نشانه داخل فریم تصویر */}
                  <CornerBrackets accent="cyan" isDark={true} />

                  {/* نوار شناسنامه بالای تصویر */}
                  <div className="absolute top-2.5 inset-x-3 flex items-center justify-between text-[11px] text-slate-200 tracking-normal">
                    <span className="px-2 py-0.5 bg-[#05070A]/80 border border-sky-400/35 font-medium">
                     ۸پا دستیار عملیاتی | آریو بنیان توس
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#05070A]/80 border border-slate-400/25 text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                     سازمانی /میدانی 
                    </span>
                  </div>

                  {/* نوار شناسنامه پایین تصویر */}
                  <div className="absolute bottom-0 inset-x-0 px-3 py-2.5 bg-[#05070A]/85 border-t border-slate-400/20 flex items-center justify-between gap-2 tracking-normal">
                    <span className="text-xs font-medium text-slate-200 truncate">
                      شرکت عمرانی و خدمات شهری آریو بنیان توس
                    </span>
                    <span className="text-[11px] text-sky-400 font-medium shrink-0">
                      شبکه میدانی ۸پا
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📱 بخش ۰۳: ویژگی‌های اپلیکیشن موبایل */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section aria-label="ویژگی‌های اپلیکیشن موبایل" className="space-y-3">
          <SectionHeader
            code="بخش ۰۳ | امکانات میدانی"
            title="ویژگی‌های اپلیکیشن موبایل"
            isDark={isDark}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <FeatureCard
              isDark={isDark}
              code="قابلیت ۰۱ | ثبت مکانی"
              icon={<MapPinIcon className="w-5 h-5" />}
              title="ثبت حضور با موقعیت‌یاب"
              description="ثبت ورود و خروج خودکار با موقعیت جغرافیایی"
              accent="cyan"
            />
            <FeatureCard
              isDark={isDark}
              code="قابلیت ۰۲ | ثبت گزارش"
              icon={<DocumentTextIcon className="w-5 h-5" />}
              title="گزارش‌دهی سریع"
              description="ارسال گزارش کارکرد روزانه با عکس و توضیحات"
              accent="emerald"
            />
            <FeatureCard
              isDark={isDark}
              code="قابلیت ۰۳ | پیگیری درخواست"
              icon={<CheckCircleIcon className="w-5 h-5" />}
              title="درخواست‌ها"
              description="ثبت درخواست مرخصی، مالی و تجهیزات"
              accent="amber"
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 🎛️ بخش ۰۴: پنل مدیریت سیستم (فقط برای مدیران) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {isAdmin && (
          <section aria-label="پنل مدیریت سیستم">
            <div
              className={`relative border rounded-[2px] ${
                isDark
                  ? 'bg-tactical-surface1 border-amber-500/35'
                  : 'bg-white border-amber-600/35'
              }`}
            >
              <CornerBrackets accent="amber" isDark={isDark} />

              <div
                className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 border-b ${
                  isDark
                    ? 'bg-amber-500/10 border-amber-500/25'
                    : 'bg-amber-50 border-amber-600/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon
                    className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                  />
                  <h2 className={`text-sm sm:text-base font-bold tracking-normal ${textPrimary}`}>
                    پنل مدیریت سیستم
                  </h2>
                </div>
                <span
                  className={`text-[11px] font-medium tracking-normal px-2 py-0.5 rounded-[2px] border ${
                    isDark
                      ? 'border-amber-500/40 bg-tactical-canvas/60 text-amber-400'
                      : 'border-amber-600/35 bg-white text-amber-700'
                  }`}
                >
                  بخش ۰۴ | سطح دسترسی مدیران
                </span>
              </div>

              <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۱"
                  to="/chat"
                  icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
                  title="پیام‌رسان"
                  description="گفت‌وگو و مدیریت ماموریت‌ها"
                  accent="cyan"
                />
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۲"
                  to="/admin/users"
                  icon={<UsersIcon className="w-5 h-5" />}
                  title="کاربران"
                  description="افزودن و ویرایش کارکنان"
                  accent="cyan"
                />
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۳"
                  to="/projects"
                  icon={<BuildingOffice2Icon className="w-5 h-5" />}
                  title="پروژه‌ها"
                  description="پروژه‌ها و محدوده جغرافیایی"
                  accent="amber"
                />
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۴"
                  to="/dashboard"
                  icon={<PresentationChartLineIcon className="w-5 h-5" />}
                  title="مانیتور نیروها"
                  description="وضعیت لحظه‌ای کارکنان"
                  accent="emerald"
                />
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۵"
                  to="/admin/daily-summary"
                  icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
                  title="خلاصه گزارش"
                  description="آمار و ارقام کلی"
                  accent="cyan"
                />
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۶"
                  to="/admin/requests"
                  icon={<CheckCircleIcon className="w-5 h-5" />}
                  title="درخواست‌ها"
                  description="تایید مرخصی، مالی و تجهیزات"
                  accent="amber"
                />
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۷"
                  to="/admin/settings"
                  icon={<Cog6ToothIcon className="w-5 h-5" />}
                  title="تنظیمات"
                  description="مشاغل، نوع مرخصی و ..."
                  accent="slate"
                />
                <AdminModuleCard
                  isDark={isDark}
                  code="واحد ۰۸"
                  to="/tasks"
                  icon={<QueueListIcon className="w-5 h-5" />}
                  title="ماموریت‌ها"
                  description="مدیریت و پیگیری ماموریت‌های اداری"
                  accent="emerald"
                />
              </div>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* 📋 بخش ۰۵: راهنمای سریع شروع به کار */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section aria-label="چگونه شروع کنم؟" className="space-y-3 pb-4">
          <SectionHeader
            code="بخش ۰۵ | دستورالعمل شروع به کار"
            title="چگونه شروع کنم؟"
            isDark={isDark}
          />

          <div className={`relative border rounded-[2px] ${surfacePanel} ${borderHairline}`}>
            <CornerBrackets accent="cyan" isDark={isDark} />

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse ${
                isDark ? 'divide-slate-400/15' : 'divide-slate-900/15'
              }`}
            >
              <GuideStep
                isDark={isDark}
                number="۰۱"
                title="دانلود اپلیکیشن"
                description="فایل نصبی اپلیکیشن را دریافت و روی تلفن همراه خود نصب نمایید"
              />
              <GuideStep
                isDark={isDark}
                number="۰۲"
                title="ورود به سیستم"
                description="با شماره موبایل و رمز عبور دریافتی وارد سامانه شوید"
              />
              <GuideStep
                isDark={isDark}
                number="۰۳"
                title="ثبت حضور"
                description="در محدوده محل کار، دکمه ثبت حضور را انتخاب کنید"
              />
              <GuideStep
                isDark={isDark}
                number="۰۴"
                title="گزارش‌دهی"
                description="در پایان روز کاری، گزارش کارکرد خود را ثبت و ارسال نمایید"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🧩 کامپوننت‌های کمکی سبک اتاق فرمان
// ═══════════════════════════════════════════════════════════

const CornerBrackets = ({ accent = 'cyan', isDark = true }) => {
  const accentMap = {
    cyan: isDark ? 'border-sky-400/60' : 'border-sky-600/60',
    amber: isDark ? 'border-amber-400/60' : 'border-amber-600/60',
    emerald: isDark ? 'border-emerald-400/60' : 'border-emerald-600/60',
  };
  const colorClass = accentMap[accent] || accentMap.cyan;

  return (
    <>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 start-0 w-2 h-2 border-t border-s ${colorClass}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 end-0 w-2 h-2 border-t border-e ${colorClass}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 start-0 w-2 h-2 border-b border-s ${colorClass}`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-0 end-0 w-2 h-2 border-b border-e ${colorClass}`}
      />
    </>
  );
};

const SectionHeader = ({ code, title, isDark }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2.5">
      <span
        className={`w-1.5 h-5 rounded-[1px] ${
          isDark ? 'bg-sky-400' : 'bg-sky-600'
        }`}
      />
      <h2
        className={`text-base sm:text-lg md:text-xl font-bold tracking-normal ${
          isDark ? 'text-slate-100' : 'text-slate-900'
        }`}
      >
        {title}
      </h2>
    </div>
    <span
      className={`text-[11px] sm:text-xs font-medium tracking-normal ${
        isDark ? 'text-slate-400' : 'text-slate-500'
      }`}
    >
      {code}
    </span>
  </div>
);

const FeatureCard = ({ isDark, code, icon, title, description, accent }) => {
  const accentStyles = {
    cyan: isDark
      ? 'text-sky-400 border-sky-400/35 bg-sky-400/10'
      : 'text-sky-700 border-sky-600/30 bg-sky-50',
    emerald: isDark
      ? 'text-emerald-400 border-emerald-400/35 bg-emerald-400/10'
      : 'text-emerald-700 border-emerald-600/30 bg-emerald-50',
    amber: isDark
      ? 'text-amber-400 border-amber-400/35 bg-amber-400/10'
      : 'text-amber-700 border-amber-600/30 bg-amber-50',
  };

  return (
    <article
      className={`group relative border rounded-[2px] transition-colors duration-150 ${
        isDark
          ? 'bg-tactical-surface1 border-slate-400/15 hover:border-sky-400/45 hover:bg-tactical-hover'
          : 'bg-white border-slate-900/15 hover:border-sky-600/50 hover:bg-slate-50'
      }`}
    >
      <CornerBrackets accent={accent} isDark={isDark} />

      <div
        className={`flex items-center justify-between px-3.5 py-2 border-b ${
          isDark
            ? 'border-slate-400/15 bg-tactical-surface2/70'
            : 'border-slate-900/10 bg-tactical-lightElevated/70'
        }`}
      >
        <span
          className={`text-[11px] font-medium tracking-normal ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {code}
        </span>
        <DevicePhoneMobileIcon className="w-3.5 h-3.5 text-slate-500" />
      </div>

      <div className="p-4 sm:p-5 flex items-start gap-3.5">
        <div
          className={`shrink-0 w-10 h-10 rounded-[2px] border flex items-center justify-center ${accentStyles[accent]}`}
        >
          {icon}
        </div>
        <div className="space-y-1">
          <h3
            className={`text-sm sm:text-base font-bold tracking-normal ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-xs sm:text-sm leading-6 tracking-normal ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </article>
  );
};

const AdminModuleCard = ({ isDark, code, to, icon, title, description, accent }) => {
  const dotColors = {
    cyan: 'bg-sky-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    slate: 'bg-slate-400',
  };

  return (
    <Link
      to={to}
      className={`group relative flex flex-col justify-between gap-3 p-3.5 rounded-[2px] border border-s-2 transition-all duration-150 ${
        isDark
          ? 'bg-tactical-canvas/70 border-slate-400/15 border-s-amber-500/50 hover:bg-tactical-hover hover:border-sky-400/40 hover:border-s-sky-400'
          : 'bg-slate-50/80 border-slate-900/15 border-s-amber-600/60 hover:bg-white hover:border-sky-600/40 hover:border-s-sky-600'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={`w-9 h-9 rounded-[2px] border flex items-center justify-center transition-colors duration-150 ${
            isDark
              ? 'bg-tactical-surface2 border-slate-400/15 text-slate-300 group-hover:text-sky-400 group-hover:border-sky-400/40'
              : 'bg-white border-slate-900/15 text-slate-700 group-hover:text-sky-700 group-hover:border-sky-600/40'
          }`}
        >
          {icon}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-normal text-slate-400">
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[accent]}`} />
          {code}
        </span>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`text-sm font-bold tracking-normal ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {title}
          </h3>
          <ArrowLeftIcon
            className={`w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5 ${
              isDark ? 'text-slate-500 group-hover:text-sky-400' : 'text-slate-400 group-hover:text-sky-600'
            }`}
          />
        </div>
        <p
          className={`text-xs mt-1 leading-5 tracking-normal ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {description}
        </p>
      </div>
    </Link>
  );
};

const GuideStep = ({ isDark, number, title, description }) => (
  <div
    className={`p-4 sm:p-5 transition-colors duration-150 ${
      isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <span
        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-[2px] border text-xs font-bold tabular-nums tracking-normal ${
          isDark
            ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
            : 'border-amber-600/40 bg-amber-50 text-amber-700'
        }`}
      >
        گام {number}
      </span>
      <span
        aria-hidden="true"
        className={`h-px flex-1 ms-3 ${
          isDark ? 'bg-slate-400/15' : 'bg-slate-900/15'
        }`}
      />
    </div>

    <h3
      className={`text-sm sm:text-base font-bold mb-1.5 tracking-normal ${
        isDark ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {title}
    </h3>
    <p
      className={`text-xs sm:text-sm leading-6 tracking-normal ${
        isDark ? 'text-slate-400' : 'text-slate-600'
      }`}
    >
      {description}
    </p>
  </div>
);

export default HomeScreen;