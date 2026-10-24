import React, { useState, useEffect, useRef, useId } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FaMicrophone, FaStop, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const VoiceInputButton = ({ 
  value = '', 
  onChange, 
  size = 'sm', 
  className = '' 
}) => {
  const buttonId = useId();
  const [isActive, setIsActive] = useState(false);

  // استفاده از Ref برای جلوگیری از اجرای تایمرها پس از بسته شدن مدال
  const isActiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const committedTextRef = useRef('');
  const lastTranscriptRef = useRef('');
  const desktopStreamRef = useRef(null);
  const restartTimerRef = useRef(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  // قطع فوری و سخت‌افزاری میکروفون (حذف آنی نوتیفیکیشن بالای گوشی)
  const forceKillMicrophone = () => {
    isActiveRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      SpeechRecognition.abortListening();
    } catch (_) {}
    stopDesktopBoost();
    resetTranscript();
    lastTranscriptRef.current = '';
    if (isMountedRef.current) {
      setIsActive(false);
    }
  };

  // ۱. پاکسازی قطعی هنگام بسته شدن مدال، خروج از صفحه یا خاموش شدن صفحه گوشی
  useEffect(() => {
    isMountedRef.current = true;

    const handleVisibilityOrHide = () => {
      if (document.hidden && isActiveRef.current) {
        forceKillMicrophone();
      }
    };

    const handleOtherMicStart = (e) => {
      if (e.detail !== buttonId && isActiveRef.current) {
        isActiveRef.current = false;
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        setIsActive(false);
      }
    };

    window.addEventListener('active-voice-input-changed', handleOtherMicStart);
    document.addEventListener('visibilitychange', handleVisibilityOrHide);
    window.addEventListener('pagehide', forceKillMicrophone);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('active-voice-input-changed', handleOtherMicStart);
      document.removeEventListener('visibilitychange', handleVisibilityOrHide);
      window.removeEventListener('pagehide', forceKillMicrophone);

      // اگر این دکمه در زمان بسته شدن مدال روشن بوده، میکروفون گوشی را فوراً آزاد کن
      if (isActiveRef.current) {
        forceKillMicrophone();
      }
    };
  }, [buttonId]);

  // ۲. نوشتن متن در فیلد مربوطه بدون پاک شدن جملات قبلی
  useEffect(() => {
    if (!isActive || !isActiveRef.current) return;

    const cleanTranscript = transcript.trim();
    if (cleanTranscript) {
      lastTranscriptRef.current = cleanTranscript;
      const base = committedTextRef.current;
      const separator = base ? ' ' : '';
      onChange?.(`${base}${separator}${cleanTranscript}`);
    }
  }, [transcript, isActive]);

  // ۳. مدیریت مکث کردن کاربر و حفظ متن قبلی
  useEffect(() => {
    if (isActive && isActiveRef.current && !listening) {
      if (lastTranscriptRef.current) {
        committedTextRef.current = [committedTextRef.current, lastTranscriptRef.current]
          .filter(Boolean)
          .join(' ');
        lastTranscriptRef.current = '';
        resetTranscript();
      }

      restartTimerRef.current = setTimeout(() => {
        if (isActiveRef.current && isMountedRef.current) {
          try {
            SpeechRecognition.startListening({
              continuous: true,
              interimResults: true,
              language: 'fa-IR',
            });
          } catch (_) {
            forceKillMicrophone();
          }
        }
      }, 200);

      return () => {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      };
    }
  }, [listening, isActive, resetTranscript]);

  // ۴. تقویت صدا فقط در دسکتاپ/لپ‌تاپ
  const startDesktopBoost = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile || !navigator.mediaDevices?.getUserMedia) return;

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          googAutoGainControl: true,
          googAutoGainControl2: true,
          googHighpassFilter: true,
        },
      })
      .then((stream) => {
        if (isActiveRef.current && isMountedRef.current) {
          desktopStreamRef.current = stream;
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      })
      .catch(() => {});
  };

  const stopDesktopBoost = () => {
    if (desktopStreamRef.current) {
      desktopStreamRef.current.getTracks().forEach((track) => track.stop());
      desktopStreamRef.current = null;
    }
  };

  const showPermissionGuide = () => {
    toast(
      () => (
        <div className="text-right text-xs leading-relaxed" dir="rtl">
          <div className="font-bold flex items-center gap-1.5 text-amber-500 mb-1">
            <FaExclamationCircle size={14} />
            دسترسی میکروفون مسدود است
          </div>
          <p className="text-gray-700 dark:text-gray-200">
            روی آیکون <b>قفل (🔒) یا تنظیمات</b> کنار آدرس سایت در بالای مرورگر بزنید و گزینه{' '}
            <b>Microphone</b> را روی <b>Allow (مجاز)</b> قرار دهید.
          </p>
        </div>
      ),
      { duration: 6000 }
    );
  };

  const toggleListening = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isActive || isActiveRef.current) {
      forceKillMicrophone();
      return;
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isHuawei = /Huawei|HarmonyOS|HMSCore|HONOR/i.test(ua);

    // بررسی محدودیت ذاتی iOS در عدم پشتیبانی از زبان فارسی در مرورگر
    if (isIOS) {
      toast(
        () => (
          <div className="text-right text-xs leading-relaxed" dir="rtl">
            <div className="font-bold text-blue-500 mb-1">راهنمای تایپ صوتی در آیفون (iOS)</div>
            <p className="text-gray-700 dark:text-gray-200">
              سیستم‌عامل آیفون از تایپ صوتی فارسی در مرورگر پشتیبانی نمی‌کند. لطفاً روی کادر متن بزنید و از <b>دکمه میکروفون روی کیبورد گوشی (Gboard)</b> استفاده کنید.
            </p>
          </div>
        ),
        { duration: 6000 }
      );
      return;
    }

    if (!browserSupportsSpeechRecognition) {
      toast.error('مرورگر شما از تبدیل صدا به متن پشتیبانی نمی‌کند. لطفاً از مرورگر Chrome استفاده کنید.');
      return;
    }

    if (isMicrophoneAvailable === false) {
      showPermissionGuide();
      return;
    }

    if (navigator.permissions?.query) {
      try {
        const status = await navigator.permissions.query({ name: 'microphone' });
        if (status.state === 'denied') {
          showPermissionGuide();
          return;
        }
      } catch (_) {}
    }

    // خاموش کردن سایر میکروفون‌های باز در فرم
    window.dispatchEvent(new CustomEvent('active-voice-input-changed', { detail: buttonId }));

    committedTextRef.current = value ? value.trim() : '';
    lastTranscriptRef.current = '';
    resetTranscript();

    isActiveRef.current = true;
    setIsActive(true);
    startDesktopBoost();

    try {
      await SpeechRecognition.startListening({
        continuous: true,
        interimResults: true,
        language: 'fa-IR',
      });

      // در گوشی‌های هوآوی اگر سرویس صوتی گوگل نصب/فعال نباشد، به کاربر اطلاع بده
      if (isHuawei) {
        setTimeout(() => {
          if (isActiveRef.current && !listening) {
            forceKillMicrophone();
            toast.error(
              'در گوشی هوآوی سرویس صوتی گوگل غیرفعال است. از میکروفون روی کیبورد گوشی استفاده کنید یا برنامه Google را فعال نمایید.',
              { duration: 6000 }
            );
          }
        }, 2500);
      }
    } catch (err) {
      forceKillMicrophone();
    }
  };

  const szClasses = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs';

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`relative shrink-0 rounded-lg flex items-center justify-center transition-all select-none ${szClasses} ${
        isActive
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 ring-4 ring-red-500/20 animate-pulse'
          : 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10'
      } ${className}`}
      title={isActive ? 'در حال نوشتن... برای توقف کلیک کنید' : 'تبدیل صدا به متن'}
    >
      {isActive ? (
        <span className="flex items-center justify-center">
          <FaStop size={size === 'sm' ? 10 : 12} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 animate-ping" />
        </span>
      ) : (
        <FaMicrophone size={size === 'sm' ? 12 : 14} />
      )}
    </button>
  );
};

export default VoiceInputButton;