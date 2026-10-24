import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchUserDetail } from '../features/admin/usersSlice';

const maritalDict = { SINGLE: 'مجرد', MARRIED: 'متأهل', OTHER: 'سایر' };
const militaryDict = { DONE: 'پایان خدمت', EXEMPT: 'معاف', SERVING: 'در حال خدمت', NOT_APPLICABLE: 'مشمول نیست' };
const eduDict = {
  ELEMENTARY: 'ابتدایی',
  MIDDLE: 'راهنمایی',
  DIPLOMA: 'دیپلم',
  ASSOCIATE: 'فوق‌دیپلم',
  BACHELOR: 'لیسانس',
  MASTER: 'فوق‌لیسانس',
  PHD: 'دکتری',
  OTHER: 'سایر',
};

const WorkerDetailModal = ({ worker, isOpen, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { selectedUser, loading = {} } = useSelector((state) => state.admin?.users || {});
  const userLoading = typeof loading === 'object' ? loading?.userDetail : loading;

  const userId = worker?.user_id;

  useEffect(() => {
    if (isOpen && userId) {
      dispatch(fetchUserDetail(userId));
    }
  }, [isOpen, userId, dispatch]);

  if (!isOpen) return null;

  const emp = selectedUser?.employee_details || {};

  const joinedDate = selectedUser?.date_joined
    ? new Date(selectedUser.date_joined).toLocaleDateString('fa-IR')
    : 'نامشخص';

  const birthDate = emp.birth_date
    ? new Date(emp.birth_date).toLocaleDateString('fa-IR')
    : 'ثبت نشده';

  const phoneNumber =
    selectedUser?.phone_number ||
    selectedUser?.profile?.phone_number ||
    (selectedUser?.username && selectedUser.username.startsWith('09') ? selectedUser.username : null) ||
    'ثبت نشده';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* هدر دیالوگ */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-100 bg-gray-50'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg border-2 shadow-inner"
              style={{
                backgroundColor: worker?.position_color_hex || '#3B82F6',
                borderColor: worker?.position_color_hex || '#3B82F6',
              }}
            >
              {worker?.profile_image ? (
                <img
                  src={worker.profile_image}
                  alt={worker.full_name}
                  className="w-full h-full object-cover rounded-[10px]"
                />
              ) : (
                (worker?.full_name?.charAt(0) || '؟').toUpperCase()
              )}
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-black truncate max-w-[240px] sm:max-w-md">
                {worker?.full_name || 'کاربر بدون نام'}
              </h2>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="font-medium" style={{ color: worker?.position_color_hex || '#3B82F6' }}>
                  {worker?.position || 'نیروی ساده'}
                </span>
                <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>|</span>
                <span className="font-mono opacity-70">کد پرسنلی: #{userId || 'ندارد'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg leading-none transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'
            }`}
          >
            ✕
          </button>
        </div>

        {/* محتوای اطلاعات پرسنلی */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {!userId ? (
            <div className={`p-6 text-center rounded-xl border border-dashed ${
              isDark ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' : 'border-amber-400 bg-amber-50 text-amber-800'
            }`}>
              ⚠️ برای این رکورد شناسه کاربری (user_id) متصل نشده است.
            </div>
          ) : userLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-400">در حال فراخوانی پرونده پرسنلی...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {/* ستون تاریخ ورود */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">تاریخ ورود به سامانه</span>
                <span className="font-mono font-bold text-sm">{joinedDate}</span>
              </div>

              {/* ستون کد ملی */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">کد ملی</span>
                <span className="font-mono font-bold text-sm tracking-wider">{emp.code_meli || 'ثبت نشده'}</span>
              </div>

              {/* ستون شماره تماس */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">شماره تماس</span>
                <span className="font-mono font-bold text-sm text-blue-500" dir="ltr">{phoneNumber}</span>
              </div>

              {/* ستون وضعیت تأهل */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">وضعیت تأهل</span>
                <span className="font-bold text-sm">
                  {emp.marital_status ? maritalDict[emp.marital_status] : 'ثبت نشده'}
                  {emp.children_count > 0 && (
                    <span className="text-[10px] text-blue-400 mr-1 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      ({emp.children_count} فرزند)
                    </span>
                  )}
                </span>
              </div>

              {/* ستون تاریخ تولد */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">تاریخ تولد</span>
                <span className="font-mono font-bold text-sm">{birthDate}</span>
              </div>

              {/* ستون تحصیلات */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">تحصیلات</span>
                <div className="font-bold text-sm truncate">
                  {emp.education_level ? eduDict[emp.education_level] : 'ثبت نشده'}
                  {emp.education_field && (
                    <span className="text-xs opacity-75 mr-1 font-normal">({emp.education_field})</span>
                  )}
                </div>
              </div>

              {/* ستون وضعیت سربازی */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">وضعیت سربازی</span>
                <span className="font-bold text-sm">
                  {emp.military_status ? militaryDict[emp.military_status] : 'ثبت نشده'}
                </span>
              </div>

              {/* ستون سوابق داخل سازمان */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">سوابق داخل سازمان</span>
                <span className="font-bold text-sm">
                  {emp.experience_inside_years || 0} سال و {emp.experience_inside_months || 0} ماه
                </span>
              </div>

              {/* ستون وضعیت ایثارگری */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-gray-950/60 border-gray-800' : 'bg-gray-50 border-gray-200'}`}>
                <span className="block text-[11px] font-bold text-gray-400 mb-1">وضعیت ایثارگری</span>
                <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                  emp.is_veteran
                    ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                    : 'text-gray-400 bg-gray-800'
                }`}>
                  {emp.is_veteran ? 'دارد' : 'ندارد'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* فوتر دکمه‌ها */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 ${
          isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-100 bg-gray-50'
        }`}>
          {userId && (
            <button
              onClick={() => {
                onClose();
                navigate(`/admin/users/${userId}`);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>📂</span>
              <span>مشاهده پرونده کامل کاربر</span>
            </button>
          )}

          <button
            onClick={onClose}
            className={`mr-auto px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerDetailModal;