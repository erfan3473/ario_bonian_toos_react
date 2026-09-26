// src/components/PersianCalendarFrame.jsx
import React from 'react';
import moment from 'moment-jalaali';
import { useSelector } from 'react-redux';

moment.loadPersian({ usePersianDigits: false });

const PersianCalendarFrame = ({ startDate, endDate }) => {
  const isDark = useSelector((s) => s.theme?.mode === 'dark');

  if (!startDate || !endDate) return null;

  const start = moment(startDate, 'YYYY-MM-DD');
  const end = moment(endDate, 'YYYY-MM-DD');
  const today = moment();

  const currentMonth = start.jMonth();
  const currentYear = start.jYear();

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];
  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const getPersianDayOfWeek = (momentDate) => {
    return (momentDate.day() + 1) % 7; 
  };

  const getDaysInMonth = () => {
    const days = [];
    const daysInMonth = moment.jDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = moment(`${currentYear}/${currentMonth + 1}/1`, 'jYYYY/jM/jD');
    const firstDayPersianWeekday = getPersianDayOfWeek(firstDayOfMonth);

    for (let i = 0; i < firstDayPersianWeekday; i++) days.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment(`${currentYear}/${currentMonth + 1}/${day}`, 'jYYYY/jM/jD');
      days.push({
        day,
        isInRange: currentDate.isBetween(start, end, 'day', '[]'),
        isToday: currentDate.isSame(today, 'day'),
        isFriday: getPersianDayOfWeek(currentDate) === 6,
      });
    }
    return days;
  };

  const days = getDaysInMonth();

  return (
    <div className={`w-64 p-2.5 rounded-xl shadow-sm relative overflow-hidden transition-colors duration-300 flex-shrink-0 ${
      isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'
    }`}>
      {/* هدر تقویم */}
      <div className="text-center mb-2">
        <span className={`font-extrabold text-sm ${isDark ? 'text-gray-100' : 'text-white'}`}>
          {monthNames[currentMonth]} {currentYear}
        </span>
      </div>

      {/* روزهای هفته */}
      <div className="grid grid-cols-7 mb-1.5">
        {weekDays.map((day, i) => (
          <div key={i} className={`text-center text-[10px] font-bold ${isDark ? 'text-gray-400' : 'text-indigo-100'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* روزهای ماه */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((item, i) => {
          if (!item) return <div key={i} />;

          let bgClass = isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-white/20 text-white';
          if (item.isInRange) bgClass = isDark ? 'bg-indigo-600/60 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.5)] text-white' : 'bg-white/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5)] text-white';
          if (item.isToday) bgClass = isDark ? 'bg-yellow-500/20 text-yellow-400 shadow-[inset_0_0_0_2px_#eab308]' : 'bg-yellow-50 text-yellow-700 shadow-[inset_0_0_0_2px_#facc15] font-black';
          
          let textClass = '';
          if (!item.isToday && item.isFriday) textClass = isDark ? 'text-red-400' : 'text-red-200';

          return (
            <div
              key={i}
              className={`w-6 h-6 flex items-center justify-center rounded-md text-[10px] font-semibold transition-all ${bgClass} ${textClass}`}
            >
              {item.day}
            </div>
          );
        })}
      </div>

      {/* راهنما */}
      <div className="flex justify-center gap-4 mt-2.5">
        <div className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-yellow-50 border-2 border-yellow-400'}`}></div>
          <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-indigo-50'}`}>امروز</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-indigo-600/60 border border-indigo-500' : 'bg-white/40 border border-white/60'}`}></div>
          <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-indigo-50'}`}>انتخابی</span>
        </div>
      </div>
    </div>
  );
};

export default PersianCalendarFrame;