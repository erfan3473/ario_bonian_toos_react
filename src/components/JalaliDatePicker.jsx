// src/components/JalaliDatePicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import moment from 'moment-jalaali';
import './JalaliDatePicker.css';

const JalaliDatePicker = ({ 
  name, 
  value, 
  onChange, 
  label, 
  disabled = false, 
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(moment().jMonth());
  const [currentYear, setCurrentYear] = useState(moment().jYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const containerRef = useRef(null);

  const monthNames = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];

  const weekDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

  // تولید لیست سال‌ها (از 1300 تا 1420)
  const generateYears = () => {
    const years = [];
    for (let year = 1420; year >= 1300; year--) {
      years.push(year);
    }
    return years;
  };

  // تبدیل value میلادی به شمسی
  useEffect(() => {
    if (value) {
      const m = moment(value, 'YYYY-MM-DD');
      setSelectedDate(m);
      setCurrentMonth(m.jMonth());
      setCurrentYear(m.jYear());
    }
  }, [value]);

  // بستن با کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ساخت روزهای ماه
  const getDaysInMonth = () => {
    const days = [];
    const daysInMonth = moment.jDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = moment(`${currentYear}/${currentMonth + 1}/1`, 'jYYYY/jM/jD').day();

    // خانه‌های خالی قبل از اول ماه
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // روزهای ماه
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDayClick = (day) => {
    if (!day) return;

    const newDate = moment(`${currentYear}/${currentMonth + 1}/${day}`, 'jYYYY/jM/jD');
    setSelectedDate(newDate);
    
    onChange({
      target: {
        name,
        value: newDate.format('YYYY-MM-DD')
      }
    });
    
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

  const handleMonthChange = (e) => {
    setCurrentMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setCurrentYear(parseInt(e.target.value));
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = moment();
    return (
      day === today.jDate() &&
      currentMonth === today.jMonth() &&
      currentYear === today.jYear()
    );
  };

  const isSelected = (day) => {
    if (!day || !selectedDate) return false;
    return (
      day === selectedDate.jDate() &&
      currentMonth === selectedDate.jMonth() &&
      currentYear === selectedDate.jYear()
    );
  };

  const displayValue = selectedDate 
    ? selectedDate.format('jYYYY/jMM/jDD')
    : '';

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-xs text-gray-500 mb-1">
          {label}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder="انتخاب تاریخ"
          readOnly
          disabled={disabled}
          className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed pr-10"
          style={{ direction: 'ltr', textAlign: 'center' }}
        />
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          📅
        </span>
      </div>

      {/* Calendar Popup */}
      {isOpen && !disabled && (
        <div className="jalali-datepicker-popup">
          {/* Header با Dropdown */}
          <div className="jalali-datepicker-header">
            <button 
              type="button"
              onClick={handleNextMonth} 
              className="jalali-datepicker-nav-btn"
              title="ماه بعد"
            >
              ◀
            </button>
            
            <div className="flex gap-2 items-center">
              {/* Dropdown ماه */}
              <select
                value={currentMonth}
                onChange={handleMonthChange}
                className="jalali-datepicker-select"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>

              {/* Dropdown سال */}
              <select
                value={currentYear}
                onChange={handleYearChange}
                className="jalali-datepicker-select"
              >
                {generateYears().map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="button"
              onClick={handlePrevMonth} 
              className="jalali-datepicker-nav-btn"
              title="ماه قبل"
            >
              ▶
            </button>
          </div>

          {/* Week Days */}
          <div className="jalali-datepicker-weekdays">
            {weekDays.map((day, idx) => (
              <div key={idx} className="jalali-datepicker-weekday">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="jalali-datepicker-days">
            {getDaysInMonth().map((day, idx) => (
              <div
                key={idx}
                onClick={() => handleDayClick(day)}
                className={`
                  jalali-datepicker-day
                  ${!day ? 'jalali-datepicker-day-empty' : ''}
                  ${isToday(day) ? 'jalali-datepicker-day-today' : ''}
                  ${isSelected(day) ? 'jalali-datepicker-day-selected' : ''}
                  ${idx % 7 === 6 ? 'jalali-datepicker-day-friday' : ''}
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
                setCurrentMonth(today.jMonth());
                setCurrentYear(today.jYear());
                onChange({
                  target: {
                    name,
                    value: today.format('YYYY-MM-DD')
                  }
                });
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
                onChange({
                  target: {
                    name,
                    value: ''
                  }
                });
                setIsOpen(false);
              }}
              className="jalali-datepicker-clear-btn"
            >
              پاک کردن
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JalaliDatePicker;
