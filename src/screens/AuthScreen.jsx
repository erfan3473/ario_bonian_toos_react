// src/screens/AuthScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  loginWithPhone, 
  requestPasswordResetOtp, 
  verifyPasswordResetOtp,
  resetForgotPasswordState
} from '../features/users/userSlice';

const AuthScreen = () => {
  // استیت‌های مربوط به فرم ورود
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  // استیت‌های مربوط به مود فراموشی رمز عبور
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // گرفتن استیت‌های مربوط به لاگین و فراموشی رمز از ریداکس
  const { 
    loading, 
    error, 
    userInfo, 
    forgotPasswordLoading, 
    forgotPasswordError, 
    forgotPasswordStep 
  } = useSelector((state) => state.userLogin);

  // تغییر مسیر پس از ورود موفق
  useEffect(() => {
    if (userInfo) {
      const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard';
      navigate(redirect);
    }
  }, [userInfo, navigate, location.search]);

  // هندلر ورود عادی
  const submitLoginHandler = (e) => {
    e.preventDefault();
    dispatch(loginWithPhone({ phone_number: phoneNumber, password }));
  };

  // هندلر مرحله 1 فراموشی رمز: ارسال شماره موبایل
  const requestOtpHandler = (e) => {
    e.preventDefault();
    dispatch(requestPasswordResetOtp({ phone_number: phoneNumber }));
  };

  // هندلر مرحله 2 فراموشی رمز: ارسال شماره موبایل، کد تایید و رمز جدید
  const verifyOtpHandler = (e) => {
    e.preventDefault();
    dispatch(verifyPasswordResetOtp({ 
      phone_number: phoneNumber, 
      otp_code: otpCode, 
      new_password: newPassword 
    }));
  };

  // جابجایی بین حالت ورود و فراموشی رمز
  const toggleForgotPasswordMode = () => {
    setIsForgotPassword(!isForgotPassword);
    dispatch(resetForgotPasswordState());
    setOtpCode('');
    setNewPassword('');
    // نگه داشتن phoneNumber برای اینکه کاربر دوباره تایپ نکند
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          {isForgotPassword ? 'بازیابی رمز عبور' : 'ورود به سامانه'}
        </h1>

        {/* ارور لاگین */}
        {!isForgotPassword && error && (
          <div className="mb-3 text-sm text-red-400 bg-red-900/20 border border-red-700 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        {/* ارور فراموشی رمز */}
        {isForgotPassword && forgotPasswordError && (
          <div className="mb-3 text-sm text-red-400 bg-red-900/20 border border-red-700 rounded-md px-3 py-2">
            {forgotPasswordError}
          </div>
        )}

        {/* ════════════ فرم ورود عادی ════════════ */}
        {!isForgotPassword && (
          <form onSubmit={submitLoginHandler} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                شماره موبایل
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="مثلاً 0912xxxxxxx"
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                رمز عبور
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {loading ? 'در حال ورود...' : 'ورود'}
            </button>
            
            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={toggleForgotPasswordMode}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                رمز عبور خود را فراموش کرده‌اید؟
              </button>
            </div>
          </form>
        )}

        {/* ════════ فرم فراموشی رمز (مرحله ۱: دریافت OTP) ════════ */}
        {isForgotPassword && forgotPasswordStep === 1 && (
          <form onSubmit={requestOtpHandler} className="space-y-4">
            <p className="text-sm text-gray-400 mb-2 text-center">
              شماره موبایل خود را وارد کنید تا کد تایید برایتان ارسال شود.
            </p>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                شماره موبایل
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="مثلاً 0912xxxxxxx"
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={forgotPasswordLoading || !phoneNumber}
              className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {forgotPasswordLoading ? 'در حال ارسال کد...' : 'دریافت کد تایید'}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={toggleForgotPasswordMode}
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                بازگشت به صفحه ورود
              </button>
            </div>
          </form>
        )}

                {/* ════════ فرم فراموشی رمز (مرحله ۲: وارد کردن OTP و رمز جدید) ════════ */}
        {isForgotPassword && forgotPasswordStep === 2 && (
          <form onSubmit={verifyOtpHandler} className="space-y-4">
            <p className="text-sm text-green-400 mb-2 text-center bg-green-900/20 border border-green-800 rounded-md px-3 py-2">
              کد تایید به شماره {phoneNumber} ارسال شد.
            </p>
            
            <div>
              <label className="block text-sm text-gray-300 mb-1">
                کد تایید (OTP)
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="کد ۶ رقمی"
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-center tracking-widest font-mono"
                maxLength={6}
                required
                autoComplete="one-time-code" /* 👈 جلوگیری از پر شدن با نام کاربری و پشتیبانی از خواندن خودکار پیامک در موبایل */
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                رمز عبور جدید
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۴ کاراکتر"
                className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={4}
                required
                autoComplete="new-password" /* 👈 به مرورگر می‌فهماند که این یک رمز "جدید" است و رمز قدیمی را اینجا نریزد */
              />
            </div>

            <button
              type="submit"
              disabled={forgotPasswordLoading || !otpCode || !newPassword}
              className="w-full py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
            >
              {forgotPasswordLoading ? 'در حال بررسی...' : 'تغییر رمز و ورود'}
            </button>


            <div className="flex justify-between items-center pt-2 px-1">
              <button 
                type="button" 
                onClick={() => dispatch(resetForgotPasswordState())}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                اصلاح شماره موبایل
              </button>
              <button 
                type="button" 
                onClick={toggleForgotPasswordMode}
                className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
              >
                بازگشت به ورود
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
