// src/components/JalaliDatePicker.jsx

import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment-jalaali';
import './JalaliDatePicker.css'; // فایل CSS شما

const JalaliDatePicker = ({
  name,
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  modal = false, // اگر true باشد، از کلاس‌های مودال CSS استفاده می‌کند
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment().jMonth());
  const [currentYear, setCurrentYear] = useState(moment().jYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const containerRef = useRef(null);

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ];

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  const generateYears = () => {
    const years = [];
    for (let year = 1420; year >= 1300; year--) {
      years.push(year);
    }
    return years;
  };

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

  // بستن با کلیک خارج (فقط اگر مودال نباشد)
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

  const getDaysInMonth = () => {
    const days = [];
    const daysInMonth = moment.jDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = moment(`${currentYear}/${currentMonth + 1}/1`, 'jYYYY/jM/jD').day();

    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  };

  const handleDayClick = (day) => {
    if (!day) return;
    const newDate = moment(`${currentYear}/${currentMonth + 1}/${day}`, 'jYYYY/jM/jD');
    setSelectedDate(newDate);
    onChange({ target: { name, value: newDate.format('YYYY-MM-DD') } });
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = moment();
    return day === today.jDate() && currentMonth === today.jMonth() && currentYear === today.jYear();
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    return day === selectedDate.jDate() && currentMonth === selectedDate.jMonth() && currentYear === selectedDate.jYear();
  };

  const displayValue = selectedDate ? selectedDate.format('jYYYY/jMM/jDD') : '';

  // محتوای اصلی تقویم (بدون فریم مودال یا پاپ‌آپ)
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
            {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={currentYear} 
            onChange={(e) => setCurrentYear(parseInt(e.target.value))} 
            className="jalali-datepicker-select"
          >
            {generateYears().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleNextMonth} className="jalali-datepicker-nav-btn">◀</button>
      </div>

      {/* Week Days */}
      <div className="jalali-datepicker-weekdays">
        {weekDays.map((d, i) => <div key={i} className="jalali-datepicker-weekday">{d}</div>)}
      </div>

      {/* Days Grid */}
      <div className="jalali-datepicker-days">
        {getDaysInMonth().map((day, i) => (
          <div
            key={i}
            onClick={() => handleDayClick(day)}
            className={`
              jalali-datepicker-day
              ${!day ? 'jalali-datepicker-day-empty' : ''}
              ${isToday(day) ? 'jalali-datepicker-day-today' : ''}
              ${isSelected(day) ? 'jalali-datepicker-day-selected' : ''}
              ${i % 7 === 6 ? 'jalali-datepicker-day-friday' : ''}
            `}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="jalali-datepicker-footer">
        <button 
          type="button" 
          onClick={() => {
            const today = moment();
            setSelectedDate(today);
            onChange({ target: { name, value: today.format('YYYY-MM-DD') } });
            setIsOpen(false);
          }} 
          className="jalali-datepicker-today-btn"
        >
          امروز
        </button>
        <button 
          type="button" 
          onClick={() => {
            setSelectedDate(null);
            onChange({ target: { name, value: '' } });
            setIsOpen(false);
          }} 
          className="jalali-datepicker-clear-btn"
        >
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
          // استایل پایه اینپوت (می‌توانید این را هم به CSS ببرید اگر خواستید)
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

export default JalaliDatePicker;