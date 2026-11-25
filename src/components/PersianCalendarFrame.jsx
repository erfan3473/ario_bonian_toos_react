// src/components/PersianCalendarFrame.jsx
import React from 'react';
import moment from 'moment-jalaali';
import { useSelector } from 'react-redux';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

moment.loadPersian({ usePersianDigits: false });

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const PersianCalendarFrame = ({ startDate, endDate }) => {
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

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

  const getPersianDayOfWeek = (momentDate) => (momentDate.day() + 1) % 7;

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
  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';

  return (
    <div
      className={`w-64 rounded-[2px] border relative overflow-hidden transition-colors duration-200 shrink-0 ${
        isDark
          ? 'bg-tactical-canvas border-slate-400/20'
          : 'bg-slate-50 border-slate-900/15'
      }`}
    >
      {/* سرصفحه تقویم */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between ${borderHairline} ${
          isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <CalendarDaysIcon
            className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}
          />
          <span
            className={`font-bold text-xs tracking-normal ${
              isDark ? 'text-slate-100' : 'text-slate-900'
            }`}
          >
            {monthNames[currentMonth]} {toPersianDigits(currentYear)}
          </span>
        </div>
        <span
          className={`text-[10px] font-medium tracking-normal ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          بازه انتخابی
        </span>
      </div>

      <div className="p-2.5">
        {/* روزهای هفته */}
        <div className="grid grid-cols-7 mb-1.5">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`text-center text-[10px] font-bold tracking-normal ${
                i === 6
                  ? isDark
                    ? 'text-red-400'
                    : 'text-red-600'
                  : isDark
                  ? 'text-slate-400'
                  : 'text-slate-500'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* روزهای ماه */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((item, i) => {
            if (!item) return <div key={i} />;

            let cellClass = isDark
              ? 'bg-tactical-surface1 text-slate-300 border-slate-400/10'
              : 'bg-white text-slate-700 border-slate-900/10';

            if (item.isInRange) {
              cellClass = isDark
                ? 'bg-sky-400/20 border-sky-400/55 text-sky-200 font-bold'
                : 'bg-sky-600 border-sky-700 text-white font-bold';
            }

            if (item.isToday) {
              cellClass = isDark
                ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
                : 'bg-amber-50 border-amber-600 text-amber-800 font-bold';
            }

            let fridayText = '';
            if (!item.isToday && !item.isInRange && item.isFriday) {
              fridayText = isDark ? 'text-red-400' : 'text-red-600';
            }

            return (
              <div
                key={i}
                className={`h-6 flex items-center justify-center rounded-[2px] border text-[10px] tabular-nums transition-colors ${cellClass} ${fridayText}`}
              >
                {toPersianDigits(item.day)}
              </div>
            );
          })}
        </div>

        {/* راهنما */}
        <div
          className={`flex justify-center gap-4 mt-2.5 pt-2 border-t text-[10px] tracking-normal ${borderHairline}`}
        >
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-[1px] border ${
                isDark
                  ? 'bg-amber-400/25 border-amber-400'
                  : 'bg-amber-50 border-amber-600'
              }`}
            />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>امروز</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-[1px] border ${
                isDark
                  ? 'bg-sky-400/25 border-sky-400'
                  : 'bg-sky-600 border-sky-700'
              }`}
            />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>بازه انتخابی</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersianCalendarFrame;