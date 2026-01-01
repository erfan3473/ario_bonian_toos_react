// src/utils/dateUtils.js
import moment from 'moment-jalaali';

moment.loadPersian({ usePersianDigits: false });

export const gregorianToJalali = (gregorianDate) => {
  if (!gregorianDate) return '';
  try {
    return moment(gregorianDate, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
  } catch {
    return '';
  }
};

export const jalaliToGregorian = (jalaliDate) => {
  if (!jalaliDate) return '';
  try {
    return moment(jalaliDate, 'jYYYY/jMM/jDD').format('YYYY-MM-DD');
  } catch {
    return '';
  }
};

export const formatJalaliDate = (gregorianDate) => {
  if (!gregorianDate) return '-';
  try {
    return moment(gregorianDate, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');
  } catch {
    return '-';
  }
};

// نمایش با نام ماه فارسی
export const formatJalaliDateLong = (gregorianDate) => {
  if (!gregorianDate) return '-';
  try {
    const m = moment(gregorianDate, 'YYYY-MM-DD');
    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    return `${m.jDate()} ${monthNames[m.jMonth()]} ${m.jYear()}`;
  } catch {
    return '-';
  }
};

export const calculateDuration = (startDate, endDate) => {
  if (!startDate) return { days: 0, months: 0, years: 0, text: '-' };
  
  const start = moment(startDate, 'YYYY-MM-DD');
  const end = endDate ? moment(endDate, 'YYYY-MM-DD') : moment();
  
  const diffDays = end.diff(start, 'days');
  const years = Math.floor(diffDays / 365);
  const remainingAfterYears = diffDays % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const days = remainingAfterYears % 30;
  
  let text = '';
  if (years > 0) text += `${years} سال`;
  if (months > 0) text += `${text ? ' و ' : ''}${months} ماه`;
  if (days > 0 || !text) text += `${text ? ' و ' : ''}${days} روز`;
  
  return {
    days: diffDays,
    months: Math.floor(diffDays / 30),
    years,
    text: text || '-'
  };
};
