// /* In: src/screens/VoiceAssistantScreen.js */
// import React, { useState, useRef } from "react";
// import axiosInstance from "../api/axiosInstance"; // Make sure this path is correct
// import { WaveFile } from "wavefile";

// export default function VoiceAssistantScreen() {
//   const [isRecording, setIsRecording] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [userText, setUserText] = useState("");
//   const [botReply, setBotReply] = useState("");
//   const [audioUrl, setAudioUrl] = useState(null);
//   const [extractedData, setExtractedData] = useState(null);
//   const [saveError, setSaveError] = useState(null);

//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   // 🎤 Start Recording
//   const startRecording = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const options = { mimeType: 'audio/webm' }; // Specify mimeType if needed
//       const mediaRecorder = new MediaRecorder(stream, options);
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (event) => {
//         if (event.data.size > 0) {
//           audioChunksRef.current.push(event.data);
//         }
//       };

//       mediaRecorder.onstop = async () => {
//         if (audioChunksRef.current.length === 0) {
//             console.warn("No audio chunks recorded.");
//             setLoading(false); // Stop loading indicator if no audio
//             return;
//         }
//         const webmBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
//         try {
//             const wavBlob = await convertWebmToWav(webmBlob);
//             await handleSubmitMedia(wavBlob, "voice.wav");
//         } catch(conversionError) {
//             console.error("Error converting audio:", conversionError);
//             setBotReply("خطا در تبدیل فرمت صدا.");
//             setLoading(false);
//         } finally {
//              // Clean up stream tracks
//              stream.getTracks().forEach(track => track.stop());
//         }
//       };

//       // Reset states
//       setIsRecording(true);
//       setUserText("");
//       setBotReply("");
//       setAudioUrl(null);
//       setExtractedData(null);
//       setSaveError(null);

//       mediaRecorder.start(); // Start recording

//     } catch (error) {
//       console.error("🎤 Mic Error:", error);
//       // More specific error for user
//       if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
//          alert("دسترسی به میکروفون رد شد. لطفاً اجازه دسترسی بدهید.");
//       } else {
//          alert("خطا در دسترسی به میکروفون!");
//       }
//       setIsRecording(false); // Ensure recording state is reset
//     }
//   };

//   // 🛑 Stop Recording
//   const stopRecording = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//       mediaRecorderRef.current.stop();
//       // Note: onstop handler will be called automatically
//     }
//     setIsRecording(false); // Update state immediately
//   };

//   // 🎧 Convert webm to wav
//   const convertWebmToWav = async (webmBlob) => {
//       // Use a temporary AudioContext
//       const tempAudioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
//       const arrayBuffer = await webmBlob.arrayBuffer();

//       // Ensure AudioContext is closed after use to free resources
//       let audioBuffer;
//       try {
//            audioBuffer = await tempAudioContext.decodeAudioData(arrayBuffer);
//       } finally {
//           if (tempAudioContext.state !== 'closed') {
//                await tempAudioContext.close();
//           }
//       }

//       // Assuming mono audio is sufficient
//       const channelData = audioBuffer.getChannelData(0);
//       const buffer = new ArrayBuffer(channelData.length * 2); // 16-bit PCM
//       const view = new DataView(buffer);
//       let offset = 0;
//       for (let i = 0; i < channelData.length; i++, offset += 2) {
//         const s = Math.max(-1, Math.min(1, channelData[i])); // Clamp to [-1, 1]
//         view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // Little-endian
//       }

//       const wav = new WaveFile();
//       wav.fromScratch(1, 16000, "16", new Int16Array(buffer));
//       return new Blob([wav.toBuffer()], { type: "audio/wav" });
//   };


//   // ⭐️ Handle uploaded file
//   const handleFileChange = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       // Basic validation (optional)
//       if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
//           alert('لطفاً فقط فایل صوتی یا ویدیویی انتخاب کنید.');
//           event.target.value = null; // Reset file input
//           return;
//       }
//       handleSubmitMedia(file, file.name);
//       event.target.value = null; // Reset file input after selection
//     }
//   };

//   // 📤 Submit media (recorded audio or uploaded file) to the server
//   const handleSubmitMedia = async (mediaFile, fileName) => {
//     setLoading(true);
//     setUserText("");
//     setBotReply("");
//     setAudioUrl(null);
//     setExtractedData(null);
//     setSaveError(null);

//     // Create audio URL only for actual audio blobs/files for playback
//     if (mediaFile instanceof Blob && mediaFile.type.startsWith("audio/")) {
//        setAudioUrl(URL.createObjectURL(mediaFile));
//     }

//     const formData = new FormData();
//     formData.append("file", mediaFile, fileName);

//     try {
//       // Call the updated backend view
//       const res = await axiosInstance.post("/voice/auto-process-media/", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//         // Optional: Add timeout
//         // timeout: 60000, // 60 seconds
//       });

//       // Process the response (even if saving failed)
//       const text = res.data?.text_transcribed || "(متنی استخراج نشد)";
//       const reply = res.data?.rasa_response || "(پاسخ متنی از Rasa دریافت نشد)";
//       const analysis = res.data?.extracted_data;
//       const errorMsg = res.data?.save_error;

//       setUserText(text);
//       setBotReply(reply); // Show Rasa's text response initially
//       setExtractedData(analysis);
//       setSaveError(errorMsg);

//       // Update bot reply based on save status
//       if (res.data?.data_saved) {
//         setBotReply(`✅ ${reply}\n (گزارش با ID: ${res.data.report_id} ثبت شد.)`);
//       } else if (errorMsg) {
//         setBotReply(`⚠️ ${reply}\n (گزارش ثبت نشد!)`);
//         // saveError state will display the detailed error separately
//       } else {
//          setBotReply(`💬 ${reply}`); // Just show Rasa's reply if no save attempt or error
//       }

//     } catch (error) {
//       // Handle network errors or server errors (5xx, 4xx other than what backend returns)
//       console.error("❌ Process Error:", error.response?.data || error.message);
//       let errorMsg = "خطا در ارتباط با سرور یا پردازش فایل.";
//       let transcribed = null;

//       if (error.response?.data) {
//           // Try to get specific error from backend response
//           errorMsg = error.response.data.error || error.response.data.detail || errorMsg;
//           transcribed = error.response.data.text_transcribed;
//       } else if (error.request) {
//           errorMsg = "پاسخی از سرور دریافت نشد. لطفاً از اتصال اینترنت خود مطمئن شوید.";
//       } else {
//           errorMsg = error.message; // Other errors (e.g., setup)
//       }

//       if (transcribed) setUserText(`متن: ${transcribed}`);
//       setBotReply(`⛔️ خطا: ${errorMsg}`);
//       setSaveError(null);
//       setExtractedData(null);

//     } finally {
//       setLoading(false);
//       // Clean up revoke blob URL if created
//       // if (audioUrl) { URL.revokeObjectURL(audioUrl); } // Be careful if you do this here, audio player might stop working
//     }
//   };

//   // --- JSX Rendering ---
//   return (
//     <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 space-y-4 font-sans" style={{ direction: 'rtl' }}>
//       <h1 className="text-2xl font-bold mb-4">🎧 دستیار صوتی پروژه</h1>

//       {/* Recording Button */}
//       <div className="flex items-center space-x-4">
//         {isRecording ? (
//           <button onClick={stopRecording} disabled={loading} className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 px-6 py-3 rounded-full font-bold text-xl transition-colors">
//             🔴 توقف ضبط
//           </button>
//         ) : (
//           <button onClick={startRecording} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 px-6 py-3 rounded-full font-bold text-xl transition-colors">
//             🎙 ضبط صدا
//           </button>
//         )}
//       </div>

//       <p className="text-gray-400">یا</p>

//       {/* Upload Button */}
//       <div className="flex flex-col items-center">
//         <label htmlFor="file-upload" className={`px-6 py-3 rounded-full font-bold text-xl cursor-pointer transition-colors ${loading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
//           📤 آپلود ویدیو / عکس
//         </label>
//         <input
//           id="file-upload"
//           type="file"
//           accept="video/*,audio/*,image/*" // Added image/* just in case
//           onChange={handleFileChange}
//           disabled={loading}
//           className="hidden" // Hidden, styled through label
//         />
//         <span className="text-xs text-gray-500 mt-2">(فایل ویدیویی/صوتی گزارش خود را انتخاب کنید)</span>
//       </div>

//       {/* Loading Indicator */}
//       {loading && <p className="text-lg text-cyan-400 animate-pulse mt-4">در حال پردازش...</p>}

//       {/* Results Section */}
//       <div className="w-full max-w-2xl space-y-3 mt-4">
//         {/* Transcribed Text */}
//         {userText && (
//           <div className="bg-gray-800 p-3 rounded-lg w-full text-right shadow">
//             <strong className="text-sky-300">متن استخراج شده:</strong>
//             <p className="whitespace-pre-wrap mt-1">{userText}</p>
//           </div>
//         )}

//         {/* Bot Reply */}
//         {botReply && (
//           <div className={`p-3 rounded-lg w-full text-right shadow ${botReply.startsWith('⛔️') ? 'bg-red-900 border border-red-700' : 'bg-indigo-900 border border-indigo-700'}`}>
//             <strong className={botReply.startsWith('⛔️') ? 'text-red-300' : 'text-indigo-300'}>پاسخ دستیار:</strong>
//             <p className="whitespace-pre-wrap mt-1">{botReply}</p>
//           </div>
//         )}

//         {/* Extracted Data (JSON) */}
//         {extractedData && (
//           <div className="bg-gray-700 p-3 rounded-lg w-full text-right text-xs shadow">
//             <strong className="text-gray-300">تحلیل Rasa (JSON):</strong>
//             {/* Using pre for formatting, setting text direction to LTR for JSON */}
//             <pre className="whitespace-pre-wrap text-left bg-gray-800 p-2 rounded mt-1 overflow-x-auto" style={{ direction: 'ltr' }}>
//               {JSON.stringify(extracted_data, null, 2)}
//             </pre>
//           </div>
//         )}

//         {/* Save Error */}
//         {saveError && (
//           <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 p-3 rounded-lg w-full text-right shadow">
//             <strong>خطای ثبت در سیستم:</strong>
//             <p className="whitespace-pre-wrap mt-1">{saveError}</p>
//           </div>
//         )}
//       </div>

//       {/* Audio Player */}
//       {audioUrl && (
//         <audio controls src={audioUrl} className="mt-4 w-full max-w-2xl rounded shadow">
//           مرورگر شما از پخش صدا پشتیبانی نمی‌کند.
//         </audio>
//       )}
//     </div>
//   );
// }