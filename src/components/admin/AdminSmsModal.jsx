// src/components/Admin/AdminSmsModal.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { FaTimes, FaPaperPlane, FaSpinner } from 'react-icons/fa';

// ⚠️ تغییر: اکشن sendAdminFreeSms باید از adminSlice ایمپورت شود
import { sendAdminFreeSms } from '../../features/admin/adminSlice'; 

const AdminSmsModal = ({ isOpen, onClose, targetPhone, targetName }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const dispatch = useDispatch();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const resultAction = await dispatch(sendAdminFreeSms({ 
        phone_number: targetPhone, 
        text 
    }));

    if (sendAdminFreeSms.fulfilled.match(resultAction)) {
      setSuccess(true);
      setText('');
      // بستن مودال بعد از ۲ ثانیه
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } else {
      setError(resultAction.payload || 'خطا در ارسال پیامک');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/50">
          <h3 className="text-white font-bold text-lg">ارسال پیامک آزاد (ادمین)</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-gray-300 mb-4">
            ارسال پیامک به: <span className="font-bold text-blue-400">{targetName} ({targetPhone})</span>
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg text-sm text-green-400">
              پیامک با موفقیت ارسال شد.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">متن پیامک:</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows="4"
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="متن دلخواه خود را اینجا بنویسید..."
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-left">
                {text.length} کاراکتر
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700 transition-colors"
                disabled={loading}
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                ارسال پیامک
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSmsModal;
