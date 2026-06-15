import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchUserDetail, updateEmployee, resetUpdateStatus } from '../../features/admin/usersSlice';
import { fetchPositions, fetchSkillLevels } from '../../features/admin/dropdownsSlice';


import JalaliDatePicker from '../../components/JalaliDatePicker';
import { formatJalaliDate } from '../../utils/dateUtils';

const OrganizationalPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // استیت‌های ریداکس
  // استیت‌های ریداکس (از اسلایس‌های مجزا)
  const { selectedUser, loading, updateStatus = {} } = useSelector((state) => state.admin.users || {});
  // خواندن دقیق وضعیت لودینگِ جزئیات کاربر
  const userLoading = typeof loading === 'object' ? loading?.userDetail : loading;

  const { positions = [], skillLevels = [] } = useSelector((state) => state.admin.dropdowns || {});
  
  const { loading: updateLoading, success, error } = updateStatus;

  // اطلاعات کارمند
  const employee = selectedUser?.employee_details;

  // استیت فرم
  const [formData, setFormData] = useState({
    code_meli: '',
    father_name: '',
    birth_date: '',
    position_id: '',
    skill_level_id: '',
    insurance_code: '',
    shaba_number: '',
    bank_account_number: '',
  });

  // مرتب‌سازی سطوح مهارت
  const sortedSkillLevels = useMemo(() => {
    return [...(skillLevels || [])].sort((a, b) => a.level_number - b.level_number);
  }, [skillLevels]);

  // ۱. دریافت اطلاعات اولیه هنگام ورود به صفحه
  useEffect(() => {
    // اگر کاربر وجود نداشت یا آیدی آن با URL فرق داشت، کاربر را بگیر
    if (!selectedUser || selectedUser.id !== parseInt(userId)) {
      dispatch(fetchUserDetail(userId));
    }
    // دریافت لیست سمت‌ها و مهارت‌ها
    if (!positions || positions.length === 0) dispatch(fetchPositions());
    if (!skillLevels || skillLevels.length === 0) dispatch(fetchSkillLevels());
    
    // ریست کردن وضعیت آپدیت
    dispatch(resetUpdateStatus());
  }, [dispatch, userId, selectedUser, positions, skillLevels]);

  // ۲. مقداردهی فرم وقتی اطلاعات کارمند لود شد
  useEffect(() => {
    if (employee) {
      setFormData({
        code_meli: employee.code_meli || '',
        father_name: employee.father_name || '',
        birth_date: employee.birth_date || '',
        position_id: employee.position?.id || '',
        skill_level_id: employee.skill_level?.id || '',
        insurance_code: employee.insurance_code || '',
        shaba_number: employee.shaba_number || '',
        bank_account_number: employee.bank_account_number || '',
      });
    }
  }, [employee]);

  // هندل کردن تغییرات فرم
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ارسال فرم
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employee?.id) {
      alert('⚠️ خطا: پروفایل کارمندی یافت نشد.');
      return;
    }

    const payload = {
      ...formData,
      skill_level_id: formData.skill_level_id ? Number(formData.skill_level_id) : null,
      position_id: Number(formData.position_id),
      birth_date: formData.birth_date || null,
    };

    dispatch(updateEmployee({ employeeId: employee.id, data: payload }));
  };

  // صفحه لودینگ اولیه
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
        <div className="text-center animate-pulse">
          <div className="animate-spin text-6xl mb-8 text-blue-500">⏳</div>
          <h2 className="text-3xl font-bold text-white mb-4">در حال دریافت اطلاعات سازمانی...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-5xl mx-auto w-full">
        
        {/* هدر ناوبری (Breadcrumb) */}
        <div className="mb-8 bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4">
          <div className="text-gray-400 font-bold flex flex-wrap items-center gap-2">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate('/admin/users')}>کاربران</span>
            <span>/</span>
            <span className="cursor-pointer hover:text-white" onClick={() => navigate(`/admin/users/${userId}`)}>
              {selectedUser?.first_name} {selectedUser?.last_name}
            </span>
            <span>/</span>
            <span className="text-blue-400">اطلاعات سازمانی</span>
          </div>
          
          <button
            onClick={() => navigate(`/admin/users/${userId}`)}
            className="flex items-center gap-2 px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all border border-gray-600"
          >
            ← بازگشت به پروفایل
          </button>
        </div>

        {/* بدنه فرم (دقیقا همان کدهای تب سازمانی) */}
        <div className="bg-gray-900/70 border-2 border-gray-700 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* هدر و وضعیت */}
            <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
              <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                👔 اطلاعات شغلی و پرسنلی
              </h3>
              {employee?.position?.color_hex && (
                <span 
                  className="px-4 py-2 rounded-full text-sm font-bold bg-gray-800 border border-gray-600 flex items-center gap-2 shadow-lg"
                  style={{ color: employee.position.color_hex }}
                >
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: employee.position.color_hex }}></span>
                  {employee.position.title}
                </span>
              )}
            </div>

            {/* پیغام‌های موفقیت و خطا */}
            {success && (
              <div className="bg-green-900/30 border border-green-600 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                <span className="text-2xl">✅</span>
                <p className="text-green-400 font-bold">اطلاعات سازمانی با موفقیت ذخیره شد.</p>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-600 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">❌</span>
                <p className="text-red-400 font-bold">{error}</p>
              </div>
            )}

            {/* بخش 1: اطلاعات هویتی */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-gray-500 transition-colors">
              <h4 className="text-blue-400 font-bold mb-4 text-sm">📌 مشخصات فردی</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">کدملی <span className="text-red-500">*</span></label>
                  <input type="text" name="code_meli" value={formData.code_meli} onChange={handleChange} required maxLength={10} pattern="[0-9]{10}" className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tracking-widest text-center" placeholder="0000000000" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">نام پدر</label>
                  <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">تاریخ تولد</label>
                  <JalaliDatePicker name="birth_date" value={formData.birth_date} onChange={handleChange} label="" />
                  {formData.birth_date && <p className="text-[10px] text-gray-400 mt-1">{formatJalaliDate(formData.birth_date)}</p>}
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">کد بیمه <span className="text-red-500">*</span></label>
                  <input type="text" name="insurance_code" value={formData.insurance_code} onChange={handleChange} required className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tracking-widest text-center" />
                </div>
              </div>
            </div>

            {/* بخش 2: جایگاه سازمانی */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-gray-500 transition-colors">
              <h4 className="text-blue-400 font-bold mb-4 text-sm">🏢 جایگاه سازمانی</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">سمت سازمانی <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select name="position_id" value={formData.position_id} onChange={handleChange} required className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none">
                      <option value="">-- انتخاب کنید --</option>
                      {positions?.map((pos) => (
                        <option key={pos.id} value={pos.id}>{pos.title} (کد: {pos.code})</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-400">▼</div>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">سطح مهارت</label>
                  <div className="relative">
                    <select name="skill_level_id" value={formData.skill_level_id} onChange={handleChange} className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none">
                      <option value="">-- انتخاب کنید (اختیاری) --</option>
                      {sortedSkillLevels?.map((skill) => (
                        <option key={skill.id} value={skill.id}>{skill.title} (ضریب حقوق: {skill.wage_multiplier}x)</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-400">▼</div>
                  </div>
                </div>
              </div>
            </div>

            {/* بخش 3: اطلاعات بانکی */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-gray-500 transition-colors">
              <h4 className="text-green-400 font-bold mb-4 text-sm">💳 اطلاعات بانکی</h4>
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">شماره شبا (بدون IR) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 font-bold">IR</span>
                    <input type="text" name="shaba_number" value={formData.shaba_number.replace(/^IR/i, '')} onChange={(e) => {
                        let val = e.target.value.toUpperCase();
                        if (!val.startsWith('IR')) val = 'IR' + val.replace(/[^0-9]/g, '');
                        setFormData((prev) => ({ ...prev, shaba_number: val }));
                      }} required maxLength={26} className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono tracking-widest" placeholder="000000000000000000000000" />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">شماره کارت / حساب</label>
                  <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono tracking-widest" placeholder="6037-****-****-****" />
                </div>
              </div>
            </div>

            {/* دکمه ذخیره */}
            <div className="flex justify-end pt-4 border-t border-gray-700 mt-8">
              <button
                type="submit"
                disabled={updateLoading || !employee?.id}
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-900/50 transform hover:-translate-y-1"
              >
                {updateLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-xl">⏳</span>
                    در حال ذخیره...
                  </span>
                ) : (
                  '💾 ذخیره تغییرات'
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationalPage;
