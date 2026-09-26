// src/screens/admin/OrganizationalPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchUserDetail, updateEmployee, resetUpdateStatus } from '../../../features/admin/usersSlice';
import { fetchPositions, fetchSkillLevels } from '../../../features/admin/dropdownsSlice';

import JalaliDatePicker from '../../../components/JalaliDatePicker';
import { formatJalaliDate } from '../../../utils/dateUtils';
import { FaUserTie, FaArrowRight, FaIdCard, FaHome, FaGraduationCap, FaBuilding, FaSave, FaCheck, FaTimes } from 'react-icons/fa';

const OrganizationalPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedUser, loading, updateStatus = {} } = useSelector((state) => state.admin.users || {});
  const userLoading = typeof loading === 'object' ? loading?.userDetail : loading;

  const { positions = [], skillLevels = [] } = useSelector((state) => state.admin.dropdowns || {});
  const { loading: updateLoading, success, error } = updateStatus;

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const employee = selectedUser?.employee_details;

  const [formData, setFormData] = useState({
    code_meli: '',
    father_name: '',
    birth_date: '',
    insurance_code: '',
    marital_status: '',
    children_count: 0,
    military_status: '',
    education_level: '',
    education_field: '',
    experience_inside_years: 0,
    experience_inside_months: 0,
    experience_outside_years: 0,
    experience_outside_months: 0,
    is_veteran: false,
    position_id: '',
    skill_level_id: '',
  });

  const sortedSkillLevels = useMemo(() => {
    return [...(skillLevels || [])].sort((a, b) => a.level_number - b.level_number);
  }, [skillLevels]);

  useEffect(() => {
    if (!selectedUser || selectedUser.id !== parseInt(userId)) {
      dispatch(fetchUserDetail(userId));
    }
    if (!positions || positions.length === 0) dispatch(fetchPositions());
    if (!skillLevels || skillLevels.length === 0) dispatch(fetchSkillLevels());
    
    dispatch(resetUpdateStatus());
  }, [dispatch, userId, selectedUser, positions, skillLevels]);

  useEffect(() => {
    if (employee) {
      setFormData({
        code_meli: employee.code_meli || '',
        father_name: employee.father_name || '',
        birth_date: employee.birth_date || '',
        insurance_code: employee.insurance_code || '',
        marital_status: employee.marital_status || '',
        children_count: employee.children_count || 0,
        military_status: employee.military_status || '',
        education_level: employee.education_level || '',
        education_field: employee.education_field || '',
        experience_inside_years: employee.experience_inside_years || 0,
        experience_inside_months: employee.experience_inside_months || 0,
        experience_outside_years: employee.experience_outside_years || 0,
        experience_outside_months: employee.experience_outside_months || 0,
        is_veteran: employee.is_veteran || false,
        position_id: employee.position?.id || '',
        skill_level_id: employee.skill_level?.id || '',
      });
    }
  }, [employee]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employee?.id) {
      alert('⚠️ خطا: پروفایل کارمندی یافت نشد.');
      return;
    }

    const payload = {
      ...formData,
      skill_level_id: formData.skill_level_id ? Number(formData.skill_level_id) : null,
      position_id: formData.position_id ? Number(formData.position_id) : null,
      children_count: Number(formData.children_count),
      experience_inside_years: Number(formData.experience_inside_years),
      experience_inside_months: Number(formData.experience_inside_months),
      experience_outside_years: Number(formData.experience_outside_years),
      experience_outside_months: Number(formData.experience_outside_months),
      birth_date: formData.birth_date || null,
    };

    dispatch(updateEmployee({ employeeId: employee.id, data: payload }));
  };

  if (userLoading) {
    return (
      <div className={`min-h-[60vh] flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>در حال دریافت اطلاعات سازمانی...</div>
        </div>
      </div>
    );
  }

  const inputClass = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
  }`;
  
  const selectClass = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-colors ${
    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
  }`;
  
  const labelClass = `block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-[80vh] p-4 md:p-8 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto w-full">
        
        {/* 📍 مسیرنما */}
        <nav className={`flex text-xs sm:text-sm mb-6 p-4 rounded-xl border shadow-sm transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'
        }`}>
          <ol className="flex items-center space-x-2 space-x-reverse min-w-0 overflow-hidden">
            <li className="whitespace-nowrap">
              <Link to="/admin/users" className={`font-bold transition-colors ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>
                👥 لیست کاربران
              </Link>
            </li>
            <li className="shrink-0"><span className="mx-1 sm:mx-2 opacity-50">/</span></li>
            <li className="truncate">
              <Link to={`/admin/users/${userId}`} className={`font-bold transition-colors truncate block ${isDark ? 'hover:text-white' : 'hover:text-blue-600'}`}>
                داشبورد {selectedUser?.first_name} {selectedUser?.last_name}
              </Link>
            </li>
            <li className="shrink-0"><span className="mx-1 sm:mx-2 opacity-50">/</span></li>
            <li className="text-blue-500 font-black whitespace-nowrap">ویرایش سازمانی</li>
          </ol>
        </nav>

        {/* محتوای اصلی */}
        <div className={`p-6 md:p-8 rounded-2xl border-2 shadow-2xl transition-all duration-300 ${
          isDark ? 'bg-gray-800/80 border-blue-700' : 'bg-white border-blue-600'
        }`}>
          
          {/* هدر */}
          <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className={`text-2xl md:text-3xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <span className="text-blue-500 text-3xl"><FaUserTie /></span> فرم اطلاعات سازمانی و پرسنلی
            </h2>
            <button
              type="button"
              onClick={() => navigate(`/admin/users/${userId}`)}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
              }`}
            >
              <FaArrowRight /> بازگشت
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* پیام‌های استاتوس */}
            {success && (
              <div className={`rounded-xl p-4 border font-bold flex items-center gap-2 ${
                isDark ? 'bg-green-900/20 border-green-700 text-green-400' : 'bg-green-50 border-green-300 text-green-700'
              }`}>
                <span><FaCheck className="text-xl"/></span> اطلاعات با موفقیت ذخیره شد.
              </div>
            )}
            
            {error && (
              <div className={`rounded-xl p-4 border font-bold flex items-center gap-2 ${
                isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-300 text-red-700'
              }`}>
                <span><FaTimes className="text-xl"/></span> {error}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* === ستون 1 === */}
              <div className="space-y-6">
                
                {/* 1. هویت پایه */}
                <div className={`p-5 sm:p-6 rounded-xl border transition-colors ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-black mb-6 text-sm flex items-center gap-2 pb-3 border-b ${
                    isDark ? 'text-blue-400 border-gray-700' : 'text-blue-600 border-gray-200'
                  }`}>
                    <FaIdCard className="text-lg" /> هویت پایه
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>کدملی <span className="text-red-500">*</span></label>
                      <input type="text" name="code_meli" value={formData.code_meli} onChange={handleChange} required maxLength={10} className={`${inputClass} font-mono tracking-widest text-left`} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelClass}>نام پدر</label>
                      <input type="text" name="father_name" value={formData.father_name} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>کد بیمه <span className="text-red-500">*</span></label>
                      <input type="text" name="insurance_code" value={formData.insurance_code} onChange={handleChange} required className={`${inputClass} font-mono tracking-widest text-left`} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelClass}>تاریخ تولد</label>
                      <div className={`w-full px-3 py-3 rounded-xl border transition-colors flex items-center ${
                        isDark ? 'bg-gray-700 border-gray-600 focus-within:border-blue-500' : 'bg-gray-50 border-gray-300 focus-within:border-blue-500'
                      }`}>
                        <JalaliDatePicker name="birth_date" value={formData.birth_date} onChange={handleChange} label="" />
                      </div>
                      {formData.birth_date && <p className={`text-xs mt-1.5 font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>انتخاب شده: {formatJalaliDate(formData.birth_date)}</p>}
                    </div>
                  </div>
                </div>

                {/* 2. خانواده و نظام وظیفه */}
                <div className={`p-5 sm:p-6 rounded-xl border transition-colors ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-black mb-6 text-sm flex items-center gap-2 pb-3 border-b ${
                    isDark ? 'text-emerald-400 border-gray-700' : 'text-emerald-600 border-gray-200'
                  }`}>
                    <FaHome className="text-lg" /> خانواده و نظام وظیفه
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={labelClass}>وضعیت تأهل</label>
                      <div className="relative">
                        <select name="marital_status" value={formData.marital_status} onChange={handleChange} className={selectClass}>
                          <option value="">-- انتخاب --</option>
                          <option value="SINGLE">مجرد</option>
                          <option value="MARRIED">متأهل</option>
                          <option value="OTHER">سایر</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>تعداد فرزند</label>
                      <input type="number" min="0" name="children_count" value={formData.children_count} onChange={handleChange} className={`${inputClass} font-mono`} dir="ltr" />
                    </div>
                    <div>
                      <label className={labelClass}>وضعیت سربازی</label>
                      <div className="relative">
                        <select name="military_status" value={formData.military_status} onChange={handleChange} className={selectClass}>
                          <option value="">-- انتخاب --</option>
                          <option value="DONE">پایان خدمت</option>
                          <option value="EXEMPT">معاف</option>
                          <option value="SERVING">در حال خدمت</option>
                          <option value="NOT_APPLICABLE">مشمول نیست</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                      </div>
                    </div>
                    <div className="flex items-end pb-1 md:pb-0">
                      <label className="flex items-center gap-3 cursor-pointer group mt-2 md:mt-0">
                        <input
                          type="checkbox"
                          name="is_veteran"
                          checked={formData.is_veteran}
                          onChange={handleChange}
                          className={`w-6 h-6 rounded cursor-pointer transition-colors focus:ring-2 text-emerald-500 focus:ring-emerald-500 bg-white ${
                            isDark ? 'border-gray-500' : 'border-gray-300'
                          }`}
                          style={isDark ? { borderColor: '#6B7280', backgroundColor: '#374151' } : {}}
                        />
                        <span className={`font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>وضعیت ایثارگری دارد</span>
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* === ستون 2 === */}
              <div className="space-y-6">
                
                {/* 3. تحصیلات و سوابق کاری */}
                <div className={`p-5 sm:p-6 rounded-xl border transition-colors ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-black mb-6 text-sm flex items-center gap-2 pb-3 border-b ${
                    isDark ? 'text-purple-400 border-gray-700' : 'text-purple-600 border-gray-200'
                  }`}>
                    <FaGraduationCap className="text-lg" /> تحصیلات و سوابق
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className={labelClass}>مدرک تحصیلی</label>
                      <div className="relative">
                        <select name="education_level" value={formData.education_level} onChange={handleChange} className={selectClass}>
                          <option value="">-- انتخاب --</option>
                          <option value="ELEMENTARY">پایان ابتدایی</option>
                          <option value="MIDDLE">پایان راهنمایی</option>
                          <option value="DIPLOMA">دیپلم</option>
                          <option value="ASSOCIATE">فوق‌دیپلم</option>
                          <option value="BACHELOR">لیسانس</option>
                          <option value="MASTER">فوق‌لیسانس</option>
                          <option value="PHD">دکتری</option>
                          <option value="OTHER">سایر</option>
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>رشته تحصیلی</label>
                      <input type="text" name="education_field" value={formData.education_field} onChange={handleChange} className={inputClass} />
                    </div>
                  </div>
                  
                  <div className="mb-5">
                    <label className={labelClass}>سابقه کار داخل سازمان (طرح تطبیق)</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`flex rounded-xl overflow-hidden border focus-within:ring-2 focus-within:ring-blue-500 transition-colors ${
                        isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <input type="number" min="0" name="experience_inside_years" value={formData.experience_inside_years} onChange={handleChange} className={`w-full bg-transparent px-4 py-3 outline-none text-center font-mono ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr" />
                        <span className={`flex items-center px-4 text-xs font-bold border-r ${
                          isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>سال</span>
                      </div>
                      <div className={`flex rounded-xl overflow-hidden border focus-within:ring-2 focus-within:ring-blue-500 transition-colors ${
                        isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <input type="number" min="0" max="11" name="experience_inside_months" value={formData.experience_inside_months} onChange={handleChange} className={`w-full bg-transparent px-4 py-3 outline-none text-center font-mono ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr" />
                        <span className={`flex items-center px-4 text-xs font-bold border-r ${
                          isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>ماه</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>سابقه کار خارج سازمان</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className={`flex rounded-xl overflow-hidden border focus-within:ring-2 focus-within:ring-blue-500 transition-colors ${
                        isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <input type="number" min="0" name="experience_outside_years" value={formData.experience_outside_years} onChange={handleChange} className={`w-full bg-transparent px-4 py-3 outline-none text-center font-mono ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr" />
                        <span className={`flex items-center px-4 text-xs font-bold border-r ${
                          isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>سال</span>
                      </div>
                      <div className={`flex rounded-xl overflow-hidden border focus-within:ring-2 focus-within:ring-blue-500 transition-colors ${
                        isDark ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        <input type="number" min="0" max="11" name="experience_outside_months" value={formData.experience_outside_months} onChange={handleChange} className={`w-full bg-transparent px-4 py-3 outline-none text-center font-mono ${isDark ? 'text-white' : 'text-gray-900'}`} dir="ltr" />
                        <span className={`flex items-center px-4 text-xs font-bold border-r ${
                          isDark ? 'bg-gray-700 text-gray-400 border-gray-600' : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}>ماه</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. جایگاه سازمانی */}
                <div className={`p-5 sm:p-6 rounded-xl border transition-colors ${
                  isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-black mb-6 text-sm flex items-center gap-2 pb-3 border-b ${
                    isDark ? 'text-orange-400 border-gray-700' : 'text-orange-600 border-gray-200'
                  }`}>
                    <FaBuilding className="text-lg" /> جایگاه سازمانی
                  </h4>
                  
                  <div className="space-y-5">
                    <div>
                      <label className={labelClass}>سمت سازمانی <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select name="position_id" value={formData.position_id} onChange={handleChange} required className={selectClass}>
                          <option value="">-- انتخاب کنید --</option>
                          {positions?.map((pos) => (
                            <option key={pos.id} value={pos.id}>{pos.title} (کد: {pos.code})</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                      </div>
                    </div>
                    
                    <div>
                      <label className={labelClass}>سطح مهارت (رتبه‌بندی)</label>
                      <div className="relative">
                        <select name="skill_level_id" value={formData.skill_level_id} onChange={handleChange} className={selectClass}>
                          <option value="">-- انتخاب (اختیاری) --</option>
                          {sortedSkillLevels?.map((skill) => (
                            <option key={skill.id} value={skill.id}>{skill.title} (ضریب: {skill.wage_multiplier}x)</option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none text-gray-500">▼</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* دکمه ذخیره */}
            <div className={`flex justify-end pt-6 border-t border-dashed mt-8 ${
              isDark ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <button
                type="submit"
                disabled={updateLoading || !employee?.id}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {updateLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>در حال پردازش...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="text-lg" />
                    <span>ذخیره تمامی اطلاعات</span>
                  </>
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