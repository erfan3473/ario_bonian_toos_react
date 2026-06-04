// src/components/PersianCalendarFrame.jsx
import React from 'react';
import moment from 'moment-jalaali';
import './PersianCalendarFrame.css';

moment.loadPersian({ usePersianDigits: false });

const PersianCalendarFrame = ({ startDate, endDate }) => {
  if (!startDate || !endDate) return null;

  const start = moment(startDate, 'YYYY-MM-DD');
  const end = moment(endDate, 'YYYY-MM-DD');
  const today = moment();

  // محاسبه ماه و سال شروع
  const currentMonth = start.jMonth();
  const currentYear = start.jYear();

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // تبدیل روز هفته میلادی به شمسی
  // moment.day(): یکشنبه=0, دوشنبه=1, ..., شنبه=6
  // تقویم فارسی: شنبه=0, یکشنبه=1, ..., جمعه=6
  const getPersianDayOfWeek = (momentDate) => {
    const gregorianDay = momentDate.day(); // 0=یکشنبه, 6=شنبه
    return (gregorianDay + 1) % 7; // شنبه=0, یکشنبه=1, ..., جمعه=6
  };

  // تولید روزهای ماه
  const getDaysInMonth = () => {
    const days = [];
    const daysInMonth = moment.jDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = moment(`${currentYear}/${currentMonth + 1}/1`, 'jYYYY/jM/jD');
    const firstDayPersianWeekday = getPersianDayOfWeek(firstDayOfMonth);

    // روزهای خالی ابتدای ماه
    for (let i = 0; i < firstDayPersianWeekday; i++) {
      days.push(null);
    }

    // روزهای واقعی ماه
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = moment(`${currentYear}/${currentMonth + 1}/${day}`, 'jYYYY/jM/jD');
      const isInRange = currentDate.isBetween(start, end, 'day', '[]');
      const isToday = currentDate.isSame(today, 'day');
      const persianWeekday = getPersianDayOfWeek(currentDate);
      const isFriday = persianWeekday === 6; // جمعه = 6

      days.push({
        day,
        isInRange,
        isToday,
        isFriday,
      });
    }

    return days;
  };

  const days = getDaysInMonth();

  return (
    <div className="persian-calendar-frame">
      {/* هدر تقویم */}
      <div className="calendar-header">
        <div className="calendar-title">
          {monthNames[currentMonth]} {currentYear}
        </div>
      </div>

      {/* نام روزهای هفته */}
      <div className="calendar-weekdays">
        {weekDays.map((day, i) => (
          <div key={i} className="calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      {/* شبکه روزها */}
      <div className="calendar-days">
        {days.map((item, i) => {
          if (!item) {
            return <div key={i} className="calendar-day-empty" />;
          }

          return (
            <div
              key={i}
              className={`
                calendar-day
                ${item.isInRange ? 'calendar-day-in-range' : ''}
                ${item.isToday ? 'calendar-day-today' : ''}
                ${item.isFriday ? 'calendar-day-friday' : ''}
              `}
            >
              {item.day}
            </div>
          );
        })}
      </div>

      {/* راهنما */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-box legend-today"></span>
          <span className="legend-text">امروز</span>
        </div>
        <div className="legend-item">
          <span className="legend-box legend-range"></span>
          <span className="legend-text">بازه انتخابی</span>
        </div>
      </div>
    </div>
  );
};

export default PersianCalendarFrame;
