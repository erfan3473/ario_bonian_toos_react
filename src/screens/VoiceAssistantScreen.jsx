import React, { useState, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { WaveFile } from "wavefile";

export default function VoiceAssistantScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userText, setUserText] = useState("");
  const [botReply, setBotReply] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 🎤 شروع ضبط
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const wavBlob = await convertWebmToWav(webmBlob);
        setAudioUrl(URL.createObjectURL(wavBlob)); // ✅ اضافه کن
        await handleSendAudio(wavBlob);
        };


      setIsRecording(true);
      setUserText("");
      setBotReply("");
      mediaRecorder.start();
    } catch (error) {
      console.error("🎤 Mic Error:", error);
      alert("به میکروفون دسترسی ندارم!");
    }
  };

  // 🛑 توقف ضبط
  const stopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // 🎧 تبدیل webm به wav (PCM 16bit - 44100Hz)
  // 🎧 تبدیل webm به wav (PCM 16bit - 44100Hz)
    const convertWebmToWav = async (webmBlob) => {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioContext = new AudioContext({ sampleRate: 44100 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);

    // 🔸 تبدیل Float32 به PCM16
    const buffer = new ArrayBuffer(channelData.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < channelData.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, channelData[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    // 🔸 ساخت wav با WaveFile
    const wav = new WaveFile();
    wav.fromScratch(1, 44100, "16", new Int16Array(buffer));
    return new Blob([wav.toBuffer()], { type: "audio/wav" });
    };


  // 📤 ارسال صدا به سرور Django → iotype
  const handleSendAudio = async (audioBlob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", audioBlob, "voice.wav");
      formData.append("type", "file");

      const sttRes = await axiosInstance.post("/voice/transcribe-audio/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const text = sttRes.data?.text || "";
      setUserText(text);
    } catch (error) {
      console.error("❌ STT Error:", error.response?.data || error);
      setBotReply("خطا در ارسال صدا به سرور یا پردازش صوت.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center space-y-6">
      <h1 className="text-2xl font-bold">🎧 دستیار صوتی پروژه</h1>

      <div>
        {isRecording ? (
          <button
            onClick={stopRecording}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-bold text-xl"
          >
            🔴 در حال گوش دادن...
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-full font-bold text-xl"
          >
            🎙 شروع ضبط
          </button>
        )}
      </div>

      {loading && <p className="text-gray-400">در حال پردازش...</p>}

      {userText && (
        <div className="bg-gray-800 p-4 rounded-lg w-2/3 text-right">
          <strong>شما:</strong> {userText}
        </div>
      )}

      {botReply && (
        <div className="bg-indigo-700 p-4 rounded-lg w-2/3 text-right">
          <strong>دستیار:</strong> {botReply}
        </div>
      )}

      {audioUrl && (
        <audio controls src={audioUrl} className="mt-4">
          مرورگر شما از پخش صدا پشتیبانی نمی‌کند.
        </audio>
      )}
    </div>
  );
}
