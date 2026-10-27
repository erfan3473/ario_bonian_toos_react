import React, { useState, useEffect, useRef, useId } from 'react';
import { FaMicrophone, FaStop, FaSpinner, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const getSttWebSocketUrl = () => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'wss://www.ariobonyantoos.com/ws/stt/';
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/stt/`;
};

const VoiceInputButton = ({ 
  value = '', 
  onChange, 
  size = 'sm', 
  className = '' 
}) => {
  const buttonId = useId();
  const [status, setStatus] = useState('idle'); // 'idle' | 'connecting' | 'listening' | 'error'

  const isActiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const committedTextRef = useRef('');
  
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  // قطع فوری، پاکسازی کامل رم و بستن تِرَک‌های سخت‌افزاری میکروفون
  const forceStopAll = () => {
    isActiveRef.current = false;

    // ۱. قطع گره پردازش صوت Web Audio
    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
    }

    // ۲. بستن کانتکست صوتی
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    // ۳. آزادسازی سخت‌افزار میکروفون (برداشتن آیکون بالای گوشی)
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      } catch (_) {}
      mediaStreamRef.current = null;
    }

    // ۴. بستن کانکشن وب‌سوکت
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ eof: 1 }));
        }
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }

    if (isMountedRef.current) {
      setStatus('idle');
    }
  };

  // مدیریت خروج ناگهانی، بسته شدن مودال یا قفل شدن صفحه گوشی
  useEffect(() => {
    isMountedRef.current = true;

    const handleOtherMic = (e) => {
      if (e.detail !== buttonId && isActiveRef.current) {
        forceStopAll();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isActiveRef.current) {
        forceStopAll();
      }
    };

    window.addEventListener('custom-voice-mic-start', handleOtherMic);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', forceStopAll);

    return () => {
      // اجرای حتمی Dispose هنگام بسته شدن مودال
      isMountedRef.current = false;
      window.removeEventListener('custom-voice-mic-start', handleOtherMic);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', forceStopAll);
      forceStopAll();
    };
  }, [buttonId]);

  const showPermissionGuide = () => {
    setStatus('error');
    setTimeout(() => {
      if (isMountedRef.current && status === 'error') setStatus('idle');
    }, 3000);

    toast(
      () => (
        <div className="text-right text-xs leading-relaxed" dir="rtl">
          <div className="font-bold flex items-center gap-1.5 text-amber-500 mb-1">
            <FaExclamationCircle size={14} />
            دسترسی میکروفون مسدود است
          </div>
          <p className="text-gray-700 dark:text-gray-200">
            روی آیکون <b>قفل (🔒) یا تنظیمات</b> کنار آدرس سایت بزنید و گزینه <b>Microphone</b> را روی <b>Allow</b> قرار دهید.
          </p>
        </div>
      ),
      { duration: 6000 }
    );
  };

  const floatTo16BitPCM = (input) => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return output.buffer;
  };

  const toggleListening = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (status === 'listening' || status === 'connecting') {
      forceStopAll();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('مرورگر شما از دسترسی میکروفون پشتیبانی نمی‌کند.');
      return;
    }

    window.dispatchEvent(new CustomEvent('custom-voice-mic-start', { detail: buttonId }));

    try {
      setStatus('connecting');
      isActiveRef.current = true;
      committedTextRef.current = value ? value.trim() : '';

      const stream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      // محافظ در صورتی که وسط درخواست مجوز، کاربر مودال را بسته باشد
      if (!isActiveRef.current || !isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      audioContextRef.current = audioContext;

      const ws = new WebSocket(getSttWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isActiveRef.current || !isMountedRef.current) {
          forceStopAll();
          return;
        }

        ws.send(JSON.stringify({ config: { sample_rate: audioContext.sampleRate } }));

        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        gainNode.gain.value = isMobile ? 1.5 : 3.5;

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (!isActiveRef.current || ws.readyState !== WebSocket.OPEN) return;
          const inputData = event.inputBuffer.getChannelData(0);
          const pcmBuffer = floatTo16BitPCM(inputData);
          ws.send(pcmBuffer);
        };

        source.connect(gainNode);
        gainNode.connect(processor);
        processor.connect(audioContext.destination);

        setStatus('listening');
      };

      ws.onmessage = (event) => {
        if (!isActiveRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.text) {
            const finalPart = data.text.trim();
            if (finalPart) {
              committedTextRef.current = [committedTextRef.current, finalPart]
                .filter(Boolean)
                .join(' ');
              onChange?.(committedTextRef.current);
            }
          } else if (data.partial) {
            const partialPart = data.partial.trim();
            if (partialPart) {
              const base = committedTextRef.current;
              onChange?.(base ? `${base} ${partialPart}` : partialPart);
            }
          }
        } catch (err) {
          console.error('STT parse error:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('STT WebSocket error:', err);
        toast.error('خطا در اتصال به موتور تبدیل صوت.');
        forceStopAll();
      };

      ws.onclose = () => {
        if (isActiveRef.current) {
          forceStopAll();
        }
      };
    } catch (err) {
      console.error('Microphone access error:', err);
      forceStopAll();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showPermissionGuide();
      } else {
        toast.error('امکان دسترسی به میکروفون وجود ندارد.');
      }
    }
  };

  const szClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${szClasses}`}>
      {/* امواج نوری فعال در زمان ضبط صدا */}
      {status === 'listening' && (
        <>
          <span className="absolute inset-0 rounded-xl bg-rose-500/30 animate-ping pointer-events-none" />
          <span className="absolute -inset-1 rounded-2xl border-2 border-rose-500/50 animate-pulse pointer-events-none" />
        </>
      )}

      {/* دکمه با کادر و حاشیه مشخص برای جلب توجه و ارتقای دیداری */}
      <button
        type="button"
        onClick={toggleListening}
        className={`relative z-10 w-full h-full rounded-xl flex items-center justify-center transition-all duration-200 select-none shadow-sm ${
          status === 'listening'
            ? 'bg-rose-600 hover:bg-rose-700 text-white border-2 border-rose-400 shadow-lg shadow-rose-600/40 scale-105'
            : status === 'connecting'
            ? 'bg-amber-500/15 text-amber-500 border-2 border-amber-500/40 animate-pulse'
            : status === 'error'
            ? 'bg-rose-500/10 text-rose-500 border-2 border-rose-500/50 animate-bounce'
            : 'bg-white/80 dark:bg-slate-800/80 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-gray-500 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 border border-gray-300 dark:border-slate-600 hover:border-purple-400 dark:hover:border-purple-500 active:scale-95'
        } ${className}`}
        title={
          status === 'listening'
            ? 'در حال ضبط صدا... برای توقف کلیک کنید'
            : status === 'connecting'
            ? 'در حال برقراری ارتباط...'
            : status === 'error'
            ? 'دسترسی مسدود است'
            : 'تبدیل صدا به متن'
        }
      >
        {status === 'listening' ? (
          <div className="flex items-center justify-center gap-1">
            <FaStop size={size === 'sm' ? 9 : 11} />
            <div className="flex items-end gap-0.5 h-3">
              <span className="w-0.5 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-2" />
              <span className="w-0.5 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_0.2s_infinite] h-3" />
              <span className="w-0.5 bg-white rounded-full animate-[bounce_0.8s_ease-in-out_0.4s_infinite] h-1.5" />
            </div>
          </div>
        ) : status === 'connecting' ? (
          <FaSpinner className="animate-spin" size={size === 'sm' ? 12 : 14} />
        ) : status === 'error' ? (
          <FaExclamationCircle size={size === 'sm' ? 13 : 15} />
        ) : (
          <FaMicrophone size={size === 'sm' ? 13 : 15} />
        )}
      </button>
    </div>
  );
};

export default VoiceInputButton;