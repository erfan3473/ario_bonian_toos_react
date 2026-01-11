// // src/components/JalaliDateInput.jsx
// import React, { useState, useEffect } from 'react';
// import moment from 'moment-jalaali';

// const JalaliDateInput = ({ 
//   name, 
//   value, 
//   onChange, 
//   label, 
//   disabled = false, 
//   className = '',
//   placeholder = '1370/05/20'
// }) => {
//   const [jalaliValue, setJalaliValue] = useState('');
//   const [error, setError] = useState('');

//   // تبدیل مقدار میلادی به شمسی برای نمایش
//   useEffect(() => {
//     if (value) {
//       try {
//         const jalali = moment(value, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
//         setJalaliValue(jalali);
//         setError('');
//       } catch (err) {
//         console.error('Invalid date:', err);
//         setJalaliValue('');
//       }
//     } else {
//       setJalaliValue('');
//     }
//   }, [value]);

//   // مدیریت تغییرات input
//   const handleInputChange = (e) => {
//     let input = e.target.value;
    
//     // فقط اعداد و / را قبول کن
//     input = input.replace(/[^\d\/]/g, '');
    
//     setJalaliValue(input);

//     // اگر کاربر فرمت کامل وارد کرد (مثلاً 1370/05/20)
//     if (input.length === 10 && input.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
//       try {
//         const momentDate = moment(input, 'jYYYY/jMM/jDD');
        
//         // بررسی اعتبار تاریخ
//         if (momentDate.isValid()) {
//           const gregorianDate = momentDate.format('YYYY-MM-DD');
//           onChange({
//             target: {
//               name,
//               value: gregorianDate
//             }
//           });
//           setError('');
//         } else {
//           setError('تاریخ نامعتبر است');
//         }
//       } catch (err) {
//         setError('فرمت تاریخ اشتباه است');
//       }
//     } else if (input === '') {
//       onChange({
//         target: {
//           name,
//           value: ''
//         }
//       });
//       setError('');
//     } else if (input.length === 10) {
//       setError('فرمت باید 1370/05/20 باشد');
//     }
//   };

//   // فرمت‌گذاری خودکار (اضافه کردن / به صورت خودکار)
//   const handleKeyUp = (e) => {
//     let input = e.target.value;
    
//     // اگر کاربر در حال پاک کردن است، کاری نکن
//     if (e.key === 'Backspace' || e.key === 'Delete') {
//       return;
//     }

//     // اضافه کردن خودکار /
//     if (input.length === 4 && !input.includes('/')) {
//       setJalaliValue(input + '/');
//     } else if (input.length === 7 && input.split('/').length === 2) {
//       setJalaliValue(input + '/');
//     }
//   };

//   return (
//     <div className={className}>
//       {label && (
//         <label className="block text-xs text-gray-500 mb-1">
//           {label}
//         </label>
//       )}
      
//       <input
//         type="text"
//         value={jalaliValue}
//         onChange={handleInputChange}
//         onKeyUp={handleKeyUp}
//         placeholder={placeholder}
//         disabled={disabled}
//         maxLength={10}
//         className={`w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-sm px-2 py-1 text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
//         style={{ direction: 'ltr', textAlign: 'center' }}
//       />
      
//       {error ? (
//         <p className="text-[10px] text-red-500 mt-1">⚠️ {error}</p>
//       ) : (
//         <p className="text-[10px] text-gray-400 mt-1">
//           📅 فرمت: سال/ماه/روز (مثال: 1370/05/20)
//         </p>
//       )}
      
//       {/* نمایش معادل میلادی */}
//       {jalaliValue && jalaliValue.length === 10 && !error && (
//         <p className="text-[9px] text-green-600 mt-0.5">
//           ✓ معادل میلادی: {value}
//         </p>
//       )}
//     </div>
//   );
// };

// export default JalaliDateInput;
