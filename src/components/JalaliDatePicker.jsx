// src/components/JalaliDatePicker.jsx

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import moment from 'moment-jalaali';
import './JalaliDatePicker.css';

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// ✅ یک بار برای همیشه ساخته می‌شود (خارج از کامپوننت = صفر هزینه در render)
const YEARS = (() => {
  const years = [];
  for (let year = 1420; year >= 1300; year--) {
    years.push(year);
  }
  return years;
})();

// ✅ تبدیل روز هفته میلادی به شمسی
const getPersianWeekdayIndex = (m) => {
  const g = m.day();       // 0..6  (Sunday..Saturday)
  return (g + 1) % 7;      // 0..6  (Saturday..Friday)
};

const JalaliDatePicker = ({
  name,
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  modal = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => moment().jMonth());
  const [currentYear, setCurrentYear] = useState(() => moment().jYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value) {
      const m = moment(value, 'YYYY-MM-DD');
      if (m.isValid()) {
        setSelectedDate(m);
        setCurrentMonth(m.jMonth());
        setCurrentYear(m.jYear());
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen || modal) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, modal]);

  // ✅ مهم‌ترین بهینه‌سازی:
  // روزهای ماه + فلگ جمعه فقط وقتی ماه یا سال عوض شود محاسبه می‌شوند،
  // نه در هر render. هر روز فقط یک object سبک { day, isFriday } است.
  const daysGrid = useMemo(() => {
    const grid = [];
    const daysInMonth = moment.jDaysInMonth(currentYear, currentMonth);

    const firstDayMoment = moment(`${currentYear}/${currentMonth + 1}/1`, 'jYYYY/jM/jD');
    const firstDayPersianIndex = getPersianWeekdayIndex(firstDayMoment);

    // خالی‌های ابتدای ماه
    for (let i = 0; i < firstDayPersianIndex; i++) {
      grid.push(null);
    }

    // روزهای واقعی — جمعه بودن همینجا یک بار محاسبه می‌شود
    // (firstDayPersianIndex مرجع است؛ هر +1 روز یعنی +1 در index هفته)
    for (let day = 1; day <= daysInMonth; day++) {
      const weekdayIndex = (firstDayPersianIndex + (day - 1)) % 7;
      grid.push({ day, isFriday: weekdayIndex === 6 });
    }

    return grid;
  }, [currentYear, currentMonth]);

  // ✅ مرجع امروز فقط یک بار در طول عمر کامپوننت
  const todayRef = useMemo(() => {
    const t = moment();
    return { day: t.jDate(), month: t.jMonth(), year: t.jYear() };
  }, []);

  const handleDayClick = useCallback((day) => {
    if (!day) return;
    const newDate = moment(`${currentYear}/${currentMonth + 1}/${day}`, 'jYYYY/jM/jD');
    setSelectedDate(newDate);
    onChange({ target: { name, value: newDate.format('YYYY-MM-DD') } });
    setIsOpen(false);
  }, [currentYear, currentMonth, name, onChange]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const isToday = useCallback((day) => {
    if (!day) return false;
    return day === todayRef.day && currentMonth === todayRef.month && currentYear === todayRef.year;
  }, [currentMonth, currentYear, todayRef]);

  const isSelected = useCallback((day) => {
    if (!day || !selectedDate) return false;
    return day === selectedDate.jDate() && currentMonth === selectedDate.jMonth() && currentYear === selectedDate.jYear();
  }, [currentMonth, currentYear, selectedDate]);

  const handleToday = useCallback(() => {
    const today = moment();
    setSelectedDate(today);
    onChange({ target: { name, value: today.format('YYYY-MM-DD') } });
    setIsOpen(false);
  }, [name, onChange]);

  const handleClear = useCallback(() => {
    setSelectedDate(null);
    onChange({ target: { name, value: '' } });
    setIsOpen(false);
  }, [name, onChange]);

  const displayValue = selectedDate ? selectedDate.format('jYYYY/jMM/jDD') : '';

  const calendarContent = (
    <div className="jalali-datepicker-content">
      {/* Header */}
      <div className="jalali-datepicker-header">
        <button type="button" onClick={handlePrevMonth} className="jalali-datepicker-nav-btn">▶</button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className="jalali-datepicker-select"
          >
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="jalali-datepicker-select"
          >
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleNextMonth} className="jalali-datepicker-nav-btn">◀</button>
      </div>

      {/* Week Days */}
      <div className="jalali-datepicker-weekdays">
        {WEEK_DAYS.map((d, i) => <div key={i} className="jalali-datepicker-weekday">{d}</div>)}
      </div>

      {/* Days Grid */}
      <div className="jalali-datepicker-days">
        {daysGrid.map((cell, i) => {
          const day = cell ? cell.day : null;
          return (
            <div
              key={i}
              onClick={() => handleDayClick(day)}
              className={`
                jalali-datepicker-day
                ${!day ? 'jalali-datepicker-day-empty' : ''}
                ${isToday(day) ? 'jalali-datepicker-day-today' : ''}
                ${isSelected(day) ? 'jalali-datepicker-day-selected' : ''}
                ${cell && cell.isFriday ? 'jalali-datepicker-day-friday' : ''}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="jalali-datepicker-footer">
        <button type="button" onClick={handleToday} className="jalali-datepicker-today-btn">
          امروز
        </button>
        <button type="button" onClick={handleClear} className="jalali-datepicker-clear-btn">
          پاک کردن
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ position: 'relative' }}>
      {label && <label className="block text-xs font-bold text-gray-800 mb-1">{label}</label>}

      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder="انتخاب تاریخ"
          readOnly
          disabled={disabled}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center bg-white text-black cursor-pointer focus:outline-none focus:border-blue-500 transition"
        />
        <span
          style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9ca3af' }}
        >
          📅
        </span>
      </div>

      {/* حالت Popup (زیر اینپوت) */}
      {isOpen && !disabled && !modal && (
        <div className="jalali-datepicker-popup">
          {calendarContent}
        </div>
      )}

      {/* حالت Modal (مرکز صفحه با اورلی) */}
      {isOpen && !disabled && modal && (
        <div className="jalali-datepicker-modal-overlay">
          <div className="jalali-datepicker-modal">
            <div className="jalali-datepicker-modal-header">
              <span className="jalali-datepicker-modal-header-title">انتخاب تاریخ</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="jalali-datepicker-modal-close"
              >
                ×
              </button>
            </div>
            {calendarContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(JalaliDatePicker);
