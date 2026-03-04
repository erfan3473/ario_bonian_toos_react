// src/screens/ProfileScreen.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  updateUserBasicProfile,
  updateUserFinancialProfile,
  changeUserPassword,
} from '../features/users/userSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

const TABS = [
  { key: 'basic',     label: 'اطلاعات پایه' },
  { key: 'financial', label: 'اطلاعات مالی' },
  { key: 'password',  label: 'تغییر رمز'    },
];

function extractError(err) {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.non_field_errors?.[0] ||
    err?.message ||
    String(err)
  );
}

const ProfileScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [activeTab, setActiveTab] = useState('basic');

  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [imageFile, setImageFile] = useState(null);

  // ✅ state مستقل برای نمایش عکس — جدا از userInfo
  const [previewImage, setPreviewImage] = useState(null);

  const [codeMeli,          setCodeMeli]          = useState('');
  const [shabaNumber,       setShabaNumber]       = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const [oldPassword,  setOldPassword]  = useState('');
  const [newPassword,  setNewPassword]  = useState('');
  const [newPassword2, setNewPassword2] = useState('');

  const [loading,        setLoading]        = useState(false);
  const [message,        setMessage]        = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    if (!userInfo) { navigate('/auth'); return; }

    setFirstName(userInfo.first_name || '');
    setLastName(userInfo.last_name   || '');

    // ✅ مقداردهی اولیه previewImage از userInfo
    setPreviewImage(userInfo.profile?.image || null);

    const emp = userInfo.employee_details || userInfo.employee || {};
    setCodeMeli(emp.code_meli                || '');
    setShabaNumber(emp.shaba_number          || '');
    setBankAccountNumber(emp.bank_account_number || '');
  }, [userInfo, navigate]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMessage(null);
  };

  // وقتی کاربر عکس جدید انتخاب میکنه، preview رو آپدیت کن
  const handleImageChange = (file) => {
    setImageFile(file);
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const submitBasic = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await dispatch(updateUserBasicProfile({
        first_name: firstName,
        last_name:  lastName,
        image:      imageFile || undefined,
      })).unwrap();
      setMessage({ type: 'success', text: 'اطلاعات پایه با موفقیت ذخیره شد.' });
      setImageFile(null);
    } catch (err) {
      setMessage({ type: 'error', text: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  const submitFinancial = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await dispatch(updateUserFinancialProfile({
        code_meli:           codeMeli          || undefined,
        shaba_number:        shabaNumber       || undefined,
        bank_account_number: bankAccountNumber || undefined,
      })).unwrap();
      setMessage({ type: 'success', text: 'اطلاعات مالی با موفقیت ذخیره شد.' });
    } catch (err) {
      setMessage({ type: 'error', text: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== newPassword2) {
      setMessage({ type: 'error', text: 'رمز عبور جدید و تکرار آن یکسان نیستند.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await dispatch(changeUserPassword({
        old_password: oldPassword,
        new_password: newPassword,
      })).unwrap();
      setMessage({ type: 'success', text: 'رمز عبور تغییر کرد. توکن جدید ذخیره شد.' });
      setOldPassword('');
      setNewPassword('');
      setNewPassword2('');
    } catch (err) {
      setMessage({ type: 'error', text: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    setImageModalOpen(false);
    setLoading(true);
    setMessage(null);
    try {
      await dispatch(updateUserBasicProfile({ remove_image: true })).unwrap();
      setImageFile(null);
      // ✅ بلافاصله توی UI هم حذف میشه
      setPreviewImage(null);
      setMessage({ type: 'success', text: 'تصویر پروفایل حذف شد.' });
    } catch (err) {
      setMessage({ type: 'error', text: extractError(err) });
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) return null;

  // ✅ حالا از previewImage استفاده میکنیم نه currentImage
  return (
    <>
      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-lg shadow">
        <h1 className="text-xl font-bold mb-4 text-gray-100 text-center">پروفایل من</h1>

        {/* تصویر پروفایل */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-600 bg-gray-700 flex items-center justify-center cursor-pointer"
              onClick={() => previewImage && setImageModalOpen(true)}
            >
              {previewImage ? (
                <img src={previewImage} alt="پروفایل" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-300">بدون تصویر</span>
              )}
            </div>

            <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 cursor-pointer shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M4 20h4l9.5-9.5a1.5 1.5 0 00-2.121-2.121L6 17.879 4 20z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageChange(e.target.files[0] || null)}
              />
            </label>
          </div>

          <div className="mt-3 text-center">
            <p className="text-sm text-gray-100 font-semibold">
              {`${firstName || ''} ${lastName || ''}`.trim() || 'بدون نام'}
            </p>
            {userInfo.profile?.phone_number && (
              <p className="text-xs text-gray-400 mt-1">{userInfo.profile.phone_number}</p>
            )}
          </div>
        </div>

        {/* تب‌ها */}
        <div className="flex border-b border-gray-700 mb-5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-500 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <Loader />}
        {message && (
          <Message variant={message.type === 'success' ? 'success' : 'danger'}>
            {message.text}
          </Message>
        )}

        {/* ── تب ۱: اطلاعات پایه ── */}
        {activeTab === 'basic' && (
          <form onSubmit={submitBasic} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">نام</label>
              {/* ✅ dir=ltr روی input نه wrapper */}
              <input
                type="text"
                dir="ltr"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white text-left"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="نام"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">نام خانوادگی</label>
              <input
                type="text"
                dir="ltr"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white text-left"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="نام خانوادگی"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white disabled:opacity-50"
            >
              ذخیره اطلاعات پایه
            </button>
          </form>
        )}

        {/* ── تب ۲: اطلاعات مالی ── */}
        {activeTab === 'financial' && (
          <form onSubmit={submitFinancial} className="space-y-4 mt-4">
            <p className="text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-700 rounded p-2">
              ⚠️ این اطلاعات فقط برای کارگران ثبت‌شده در سیستم قابل ویرایش است.
            </p>

            <div>
              <label className="block text-sm text-gray-300 mb-1">کد ملی</label>
              {/* ✅ dir=ltr مستقیم روی input */}
              <input
                type="text"
                dir="ltr"
                inputMode="numeric"
                maxLength={10}
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white tracking-widest text-left"
                value={codeMeli}
                onChange={(e) => setCodeMeli(e.target.value.replace(/\D/g, ''))}
                placeholder="0123456789"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">شماره شبا</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={24}
                  className="flex-1 px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white tracking-widest text-left"
                  value={shabaNumber.replace(/^IR/i, '')}
                  onChange={(e) => setShabaNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="24 رقم بدون IR"
                />
                <span className="text-gray-400 text-sm font-mono">IR</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">IR را وارد نکنید، خودکار اضافه می‌شود.</p>
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">شماره حساب بانکی</label>
              <input
                type="text"
                dir="ltr"
                inputMode="numeric"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white tracking-widest text-left"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="شماره حساب"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-sm font-semibold text-white disabled:opacity-50"
            >
              ذخیره اطلاعات مالی
            </button>
          </form>
        )}

        {/* ── تب ۳: تغییر رمز ── */}
        {activeTab === 'password' && (
          <form onSubmit={submitPassword} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">رمز عبور فعلی</label>
              <input
                type="password"
                dir="ltr"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white text-left"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="رمز عبور فعلی"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">رمز عبور جدید</label>
              <input
                type="password"
                dir="ltr"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white text-left"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="حداقل ۴ کاراکتر"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">تکرار رمز عبور جدید</label>
              <input
                type="password"
                dir="ltr"
                className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white text-left"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                placeholder="تکرار رمز جدید"
                autoComplete="new-password"
              />
            </div>

            <p className="text-xs text-blue-400 bg-blue-900/20 border border-blue-800 rounded p-2">
              ℹ️ بعد از تغییر رمز، توکن جدید صادر می‌شود و نیازی به خروج مجدد نیست.
            </p>

            <button
              type="submit"
              disabled={loading || !oldPassword || !newPassword || !newPassword2}
              className="w-full py-2 rounded bg-red-600 hover:bg-red-700 text-sm font-semibold text-white disabled:opacity-50"
            >
              تغییر رمز عبور
            </button>
          </form>
        )}
      </div>

      {/* Modal تصویر */}
      {imageModalOpen && previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 rounded-lg shadow-lg p-4 w-full max-w-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-100">تصویر پروفایل</h2>
              <button
                className="text-gray-400 hover:text-gray-200 text-xs"
                onClick={() => setImageModalOpen(false)}
              >
                بستن
              </button>
            </div>

            <div className="flex justify-center mb-4">
              <img
                src={previewImage}
                alt="پروفایل بزرگ"
                className="max-h-64 rounded-md border border-gray-700 object-contain"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded bg-red-600 hover:bg-red-700 text-xs font-semibold text-white"
                onClick={handleRemoveImage}
              >
                حذف تصویر
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded bg-gray-700 hover:bg-gray-600 text-xs font-semibold text-gray-100"
                onClick={() => setImageModalOpen(false)}
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileScreen;
