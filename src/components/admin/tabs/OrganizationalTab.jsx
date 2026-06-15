// // src/components/admin/tabs/OrganizationalTab.jsx
// // ⚠️ فایل کامل و اصلاح شده - با تاریخ تولد به جای سن

// import React, { useState, useEffect, useMemo } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { 
//   updateEmployee, 
//   fetchPositions, 
//   fetchSkillLevels,
//   resetUpdateStatus 
// } from '../../../features/admin/adminSlice';
// import JalaliDatePicker from '../../JalaliDatePicker';
// import { formatJalaliDate } from '../../../utils/dateUtils';

// const OrganizationalTab = ({ user }) => {
//   const dispatch = useDispatch();
  
//   // دسترسی به استیت‌ها
//   const { loading, success, error } = useSelector((state) => state.admin.updateStatus);
//   const { positions, skillLevels } = useSelector((state) => state.admin);

//   // ✅ دسترسی صحیح به اطلاعات کارمند (طبق سریالایزر جدید)
//   const employee = user?.employee_details;

//   // ✅ مرتب‌سازی سطوح مهارت
//   const sortedSkillLevels = useMemo(() => {
//     return [...skillLevels].sort((a, b) => a.level_number - b.level_number);
//   }, [skillLevels]);

//   const [formData, setFormData] = useState({
//     code_meli: '',
//     father_name: '',
//     birth_date: '', // ✅ تغییر از age به birth_date
//     position_id: '',
//     skill_level_id: '',
//     insurance_code: '',
//     shaba_number: '',
//     bank_account_number: '',
//   });

//   // ✅ لود کردن داده‌های اولیه (دراپ‌داون‌ها) اگر خالی باشند
//   useEffect(() => {
//     if (!positions || positions.length === 0) {
//       dispatch(fetchPositions());
//     }
//     if (!skillLevels || skillLevels.length === 0) {
//       dispatch(fetchSkillLevels());
//     }
//   }, [dispatch, positions, skillLevels]);

//   // ✅ ریست کردن وضعیت آپدیت هنگام ورود به تب
//   useEffect(() => {
//     dispatch(resetUpdateStatus());
//   }, [dispatch]);

//   // ✅ مقداردهی فرم با اطلاعات موجود
//   useEffect(() => {
//     if (employee) {
//       setFormData({
//         code_meli: employee.code_meli || '',
//         father_name: employee.father_name || '',
//         birth_date: employee.birth_date || '', // ✅ تغییر از age به birth_date
//         // هندل کردن آبجکت‌های تو در تو برای position و skill_level
//         position_id: employee.position?.id || '',
//         skill_level_id: employee.skill_level?.id || '',
//         insurance_code: employee.insurance_code || '',
//         shaba_number: employee.shaba_number || '',
//         bank_account_number: employee.bank_account_number || '',
//       });
//     }
//   }, [employee]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
    
//     if (!employee?.id) {
//       alert('⚠️ خطا: پروفایل کارمندی یافت نشد. لطفاً صفحه را رفرش کنید.');
//       return;
//     }

//     // تمیزکاری داده‌ها قبل از ارسال
//     const payload = {
//       ...formData,
//       // تبدیل رشته خالی به null برای فیلدهای اختیاری
//       skill_level_id: formData.skill_level_id ? Number(formData.skill_level_id) : null,
//       position_id: Number(formData.position_id),
//       birth_date: formData.birth_date || null, // ✅ ارسال تاریخ تولد
//     };

//     dispatch(updateEmployee({ employeeId: employee.id, data: payload }));
//   };

//   if (!user) return <div className="text-center p-10 text-gray-500">کاربر یافت نشد</div>;

//   return (
//     <div className="animate-fadeIn">
//       <form onSubmit={handleSubmit} className="space-y-6">
        
//         {/* هدر و وضعیت */}
//         <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
//           <h3 className="text-xl font-bold text-white flex items-center gap-2">
//             👔 اطلاعات شغلی و پرسنلی
//           </h3>
//           {employee?.position?.color_hex && (
//             <span 
//               className="px-3 py-1 rounded-full text-xs font-bold bg-gray-800 border border-gray-600 flex items-center gap-2"
//               style={{ color: employee.position.color_hex }}
//             >
//               <span className="w-3 h-3 rounded-full" style={{ backgroundColor: employee.position.color_hex }}></span>
//               {employee.position.title}
//             </span>
//           )}
//         </div>

//         {/* Success/Error Messages */}
//         {success && (
//           <div className="bg-green-900/30 border border-green-600 rounded-xl p-4 flex items-center gap-3 animate-pulse">
//             <span className="text-2xl">✅</span>
//             <p className="text-green-400 font-bold">اطلاعات با موفقیت ذخیره شد.</p>
//           </div>
//         )}

//         {error && (
//           <div className="bg-red-900/30 border border-red-600 rounded-xl p-4 flex items-center gap-3">
//             <span className="text-2xl">❌</span>
//             <p className="text-red-400 font-bold">{error}</p>
//           </div>
//         )}

//         {/* بخش 1: اطلاعات هویتی */}
//         <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
//           <h4 className="text-blue-400 font-bold mb-4 text-sm">📌 مشخصات فردnnnی</h4>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
//             {/* کدملی */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">
//                 کدملی <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="code_meli"
//                 value={formData.code_meli}
//                 onChange={handleChange}
//                 required
//                 maxLength={10}
//                 pattern="[0-9]{10}"
//                 className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 
//                 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tracking-widest text-center"
//                 placeholder="0000000000"
//               />
//             </div>

//             {/* نام پدر */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">نام پدر</label>
//               <input
//                 type="text"
//                 name="father_name"
//                 value={formData.father_name}
//                 onChange={handleChange}
//                 className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 
//                 focus:ring-2 focus:ring-blue-500 focus:outline-none"
//               />
//             </div>

//             {/* تاریخ تولد (جایگزین سن) */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">تاریخ تولد</label>

          
//               <JalaliDatePicker
//                 name="birth_date"
//                 value={formData.birth_date}
//                 onChange={handleChange}
//                 label=""
//               />



//               {formData.birth_date && (
//                 <p className="text-[10px] text-gray-400 mt-1">
//                   {formatJalaliDate(formData.birth_date)}
//                 </p>
//               )}
//             </div>

//             {/* کد بیمه */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">
//                 کد بیمه <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="text"
//                 name="insurance_code"
//                 value={formData.insurance_code}
//                 onChange={handleChange}
//                 required
//                 className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 
//                 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono tracking-widest text-center"
//               />
//             </div>

//           </div>
//         </div>

//         {/* بخش 2: جایگاه سازمانی */}
//         <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
//           <h4 className="text-blue-400 font-bold mb-4 text-sm">🏢 جایگاه سازمانی</h4>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
//             {/* سمت سازمانی */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">
//                 سمت سازمانی <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <select
//                   name="position_id"
//                   value={formData.position_id}
//                   onChange={handleChange}
//                   required
//                   className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 
//                   focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
//                 >
//                   <option value="">-- انتخاب کنید --</option>
//                   {positions.map((pos) => (
//                     <option key={pos.id} value={pos.id}>
//                       {pos.title} (کد: {pos.code})
//                     </option>
//                   ))}
//                 </select>
//                 <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-400">
//                   ▼
//                 </div>
//               </div>
//             </div>

//             {/* سطح مهارت */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">سطح مهارت</label>
//               <div className="relative">
//                 <select
//                   name="skill_level_id"
//                   value={formData.skill_level_id}
//                   onChange={handleChange}
//                   className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 
//                   focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none"
//                 >
//                   <option value="">-- انتخاب کنید (اختیاری) --</option>
//                   {sortedSkillLevels.map((skill) => (
//                     <option key={skill.id} value={skill.id}>
//                       {skill.title} (ضریب حقوق: {skill.wage_multiplier}x)
//                     </option>
//                   ))}
//                 </select>
//                 <div className="absolute inset-y-0 left-0 flex items-center px-3 pointer-events-none text-gray-400">
//                   ▼
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>

//         {/* بخش 3: اطلاعات بانکی */}
//         <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
//           <h4 className="text-green-400 font-bold mb-4 text-sm">💳 اطلاعات بانکی</h4>
//           <div className="space-y-4">
            
//             {/* شماره شبا */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">
//                 شماره شبا (بدون IR) <span className="text-red-500">*</span>
//               </label>

//               <div className="relative">
//                 <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400 font-bold">
//                   IR
//                 </span>

//                 <input
//                   type="text"
//                   name="shaba_number"
//                   value={formData.shaba_number.replace(/^IR/i, '')}
//                   onChange={(e) => {
//                     let val = e.target.value.toUpperCase();
//                     if (!val.startsWith('IR'))
//                       val = 'IR' + val.replace(/[^0-9]/g, '');
//                     setFormData((prev) => ({ ...prev, shaba_number: val }));
//                   }}
//                   required
//                   maxLength={26}
//                   className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 rounded-lg border border-gray-600 
//                   focus:ring-2 focus:ring-green-500 focus:outline-none font-mono tracking-widest"
//                   placeholder="000000000000000000000000"
//                 />
//               </div>

//               <p className="text-gray-500 text-xs mt-1 text-left" dir="ltr">
//                 {formData.shaba_number} :پیش‌نمایش
//               </p>
//             </div>

//             {/* شماره حساب / کارت */}
//             <div>
//               <label className="block text-gray-300 mb-2 font-bold text-sm">
//                 شماره کارت / حساب
//               </label>
//               <input
//                 type="text"
//                 name="bank_account_number"
//                 value={formData.bank_account_number}
//                 onChange={handleChange}
//                 className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 
//                 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono tracking-widest"
//                 placeholder="6037-****-****-****"
//               />
//             </div>

//           </div>
//         </div>

//         {/* دکمه ذخیره */}
//         <div className="flex justify-end pt-4 border-t border-gray-700 mt-8">
//           <button
//             type="submit"
//             disabled={loading || !employee?.id}
//             className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed 
//             text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-900/30 
//             transform hover:-translate-y-1"
//           >
//             {loading ? (
//               <span className="flex items-center gap-2">
//                 <span className="animate-spin text-xl">⏳</span>
//                 در حال ذخیره...
//               </span>
//             ) : (
//               '💾 ذخیره تغییرات'
//             )}
//           </button>
//         </div>

//       </form>
//     </div>
//   );
// };

// export default OrganizationalTab;
