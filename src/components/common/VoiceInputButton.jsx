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
  const [status, setStatus] = useState('idle'); // 'idle' | 'connecting' | 'listening'

  const isActiveRef = useRef(false);
  const isMountedRef = useRef(true);
  const committedTextRef = useRef('');
  
  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);

  // قطع فوری سخت‌افزاری میکروفون (حذف آنی آیکون میکروفون بالای صفحه در موبایل)
  const forceStopAll = () => {
    isActiveRef.current = false;

    if (processorRef.current) {
      try {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
      } catch (_) {}
      processorRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (_) {}
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

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
      isMountedRef.current = false;
      window.removeEventListener('custom-voice-mic-start', handleOtherMic);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', forceStopAll);
      forceStopAll();
    };
  }, [buttonId]);

  const showPermissionGuide = () => {
    toast(
      () => (
        <div className="text-right text-xs leading-relaxed" dir="rtl">
          <div className="font-bold flex items-center gap-1.5 text-amber-500 mb-1">
            <FaExclamationCircle size={14} />
            دسترسی میکروفون مسدود است
          </div>
          <p className="text-gray-700 dark:text-gray-200">
            روی آیکون <b>قفل (🔒) یا تنظیمات</b> کنار آدرس سایت در مرورگر بزنید و گزینه{' '}
            <b>Microphone</b> را روی <b>Allow (مجاز)</b> قرار دهید.
          </p>
        </div>
      ),
      { duration: 6000 }
    );
  };

  // تبدیل داده‌های Float صوتی به فرمت استاندارد 16-bit PCM برای پردازش توسط موتور Kaldi
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

    if (status !== 'idle' || isActiveRef.current) {
      forceStopAll();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error('مرورگر شما از دسترسی به میکروفون پشتیبانی نمی‌کند.');
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

        // ارسال نرخ نمونه‌برداری دقیق میکروفون به سرور Vosk
        ws.send(JSON.stringify({ config: { sample_rate: audioContext.sampleRate } }));

        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        gainNode.gain.value = isMobile ? 1.5 : 3.5; // تقویت ۳.۵ برابری برای جلوگیری از داد زدن در لپ‌تاپ

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
          
          // زمانی که کاربر مکث می‌کند، جمله نهایی در data.text قرار می‌گیرد
          if (data.text) {
            const finalPart = data.text.trim();
            if (finalPart) {
              committedTextRef.current = [committedTextRef.current, finalPart]
                .filter(Boolean)
                .join(' ');
              onChange?.(committedTextRef.current);
            }
          } 
          // در حین صحبت مداوم، پیش‌نمایش کلمات در data.partial قرار دارد
          else if (data.partial) {
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
        toast.error('خطا در برقراری ارتباط با سرور پردازش گفتار.');
        forceStopAll();
      };

      ws.onclose = () => {
        if (isActiveRef.current) {
          forceStopAll();
        }
      };
    } catch (err) {
      console.error('Microphone error:', err);
      forceStopAll();
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showPermissionGuide();
      } else {
        toast.error('خطا در دسترسی به میکروفون.');
      }
    }
  };

  const szClasses = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-8 h-8 text-xs';

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`relative shrink-0 rounded-lg flex items-center justify-center transition-all select-none ${szClasses} ${
        status === 'listening'
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 ring-4 ring-red-500/20 animate-pulse'
          : status === 'connecting'
          ? 'bg-amber-500 text-white'
          : 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10'
      } ${className}`}
      title={
        status === 'listening'
          ? 'در حال نوشتن... برای توقف کلیک کنید'
          : status === 'connecting'
          ? 'در حال اتصال به سرور صوتی...'
          : 'تبدیل صدا به متن'
      }
    >
      {status === 'listening' ? (
        <span className="flex items-center justify-center">
          <FaStop size={size === 'sm' ? 10 : 12} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 animate-ping" />
        </span>
      ) : status === 'connecting' ? (
        <FaSpinner className="animate-spin" size={size === 'sm' ? 11 : 13} />
      ) : (
        <FaMicrophone size={size === 'sm' ? 12 : 14} />
      )}
    </button>
  );
};

export default VoiceInputButton;