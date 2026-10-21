import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [platform, setPlatform] = useState(null); // 'android' | 'ios' | null
  const [isVisible, setIsVisible] = useState(false);

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  useEffect(() => {
    // ۱. اگر برنامه در حالت اپلیکیشن (Standalone) اجرا شده، بنر نشان داده نشود و وضعیت ذخیره شود
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      localStorage.setItem('pwa_installed', 'true');
      return;
    }

    // ۲. بررسی دائمی در localStorage: اگر قبلاً نصب شده یا کاربر آن را رد کرده، نشان نده
    const isInstalled = localStorage.getItem('pwa_installed') === 'true';
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true';

    if (isInstalled || isDismissed) {
      return;
    }

    // ۳. ثبت رویداد نصب موفق مرورگر (در صورت نصب از منوی خود مرورگر یا بنر)
    const handleAppInstalled = () => {
      localStorage.setItem('pwa_installed', 'true');
      setIsVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // ۴. تشخیص دستگاه‌های iOS (Safari)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = ua.includes('safari') && !ua.includes('crios') && !ua.includes('fxios');

    if (isIosDevice && isSafari) {
      setPlatform('ios');
      setIsVisible(true);
      return () => {
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    // ۵. رویداد قبل از نصب در اندروید و کروم
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform('android');
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // ذخیره دائمی برای اینکه دیگر برای این کاربر باز نشود
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  const handleIosAcknowledged = () => {
    setIsVisible(false);
    // ثبت اضافه شدن به صفحه اصلی در آیفون
    localStorage.setItem('pwa_installed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-auto">
      <div
        dir="rtl"
        className={`w-full max-w-md p-4 rounded-2xl shadow-2xl border transition-all duration-300 ${
          isDark
            ? 'bg-gray-800 text-white border-blue-600'
            : 'bg-white text-gray-900 border-blue-400'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/icon-192.png" alt="App Icon" className="w-12 h-12 rounded-xl object-cover shadow" />
            <div>
              <h4 className="font-bold text-sm sm:text-base">افزودن سامانه به صفحه اصلی</h4>
              <p className="text-xs opacity-80 mt-0.5">برای دسترسی سریع و تجربه تمام‌صفحه بدون مرورگر</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-200 text-sm p-1"
            aria-label="بستن"
          >
            ✕
          </button>
        </div>

        {platform === 'android' && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md transition-colors"
            >
              نصب برنامه
            </button>
            <button
              onClick={handleDismiss}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-medium ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              دیگر نشان نده
            </button>
          </div>
        )}

        {platform === 'ios' && (
          <div className="mt-3 pt-3 border-t border-gray-700/40 text-xs leading-relaxed opacity-90">
            <p className="flex items-center gap-2 mb-1.5">
              <span>۱. در پایین مرورگر روی دکمه</span>
              <span className="inline-flex items-center justify-center bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded font-mono text-[11px]">
                <i className="fa-solid fa-arrow-up-from-bracket ml-1"></i> اشتراک‌گذاری (Share)
              </span>
              <span>بزنید.</span>
            </p>
            <p className="flex items-center gap-2 mb-3">
              <span>۲. سپس گزینه</span>
              <span className="font-semibold text-blue-400">Add to Home Screen</span>
              <span>را انتخاب کنید.</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleIosAcknowledged}
                className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
              >
                اضافه کردم (دیگر نشان نده)
              </button>
              <button
                onClick={handleDismiss}
                className={`py-1.5 px-3 rounded-xl text-xs font-medium ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                بستن
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}