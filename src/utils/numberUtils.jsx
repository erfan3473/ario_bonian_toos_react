// src/utils/numberUtils.js

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export const toPersianDigits = (num) => {
  if (num === null || num === undefined || num === '') return '';
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
};

/**
 * فرمت عدد با کاما و تبدیل به فارسی
 * مثال: 95000000 => ۹۵,۰۰۰,۰۰۰
 */
export const formatNumberPersian = (num) => {
  if (num === null || num === undefined || num === '' || num === 0) return '۰';
  
  // اول عدد را به string تبدیل و کاما اضافه می‌کنیم
  const formatted = Number(num).toLocaleString('en-US');
  
  // بعد به فارسی تبدیل می‌کنیم
  return toPersianDigits(formatted);
};

/**
 * فرمت کامل با کاما، اعداد فارسی و واحد ریال
 * مثال: 95000000 => ۹۵,۰۰۰,۰۰۰ ریال
 */
export const formatCurrencyPersian = (num) => {
  if (num === null || num === undefined || num === '' || num === 0) return '۰ ریال';
  
  const formattedNumber = formatNumberPersian(num);
  return `${formattedNumber} ریال`;
};

/**
 * فرمت با واحد ریال ریز (کوچک)
 * مثال: 95000000 => ۹۵,۰۰۰,۰۰۰ ریال
 */
export const formatCurrencyPersianSmall = (num) => {
  if (num === null || num === undefined || num === '' || num === 0) {
    return <span>۰ <span className="text-[9px] text-gray-400">ریال</span></span>;
  }
  
  const formattedNumber = formatNumberPersian(num);
  return (
    <span>
      {formattedNumber} <span className="text-[9px] text-gray-400">ریال</span>
    </span>
  );
};
