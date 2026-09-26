import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment-jalaali';

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const YEARS = (() => {
  const years = [];
  for (let year = 1420; year >= 1300; year--) years.push(year);
  return years;
})();

const getPersianWeekdayIndex = (m) => {
  const g = m.day(); 
  return (g + 1) % 7; 
};

const JalaliDatePicker = ({
  name,
  value,
  onChange,
  label,
  disabled = false,
  className = '',
  modal = false,
  placeholder = 'انتخاب تاریخ',
}) => {
  const isDark = useSelector((s) => s.theme?.mode === 'dark');

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, modal]);

  const daysGrid = useMemo(() => {
    const grid = [];
    const daysInMonth = moment.jDaysInMonth(currentYear, currentMonth);

    const firstDayMoment = moment(`${currentYear}/${currentMonth + 1}/1`, 'jYYYY/jM/jD');
    const firstDayPersianIndex = getPersianWeekdayIndex(firstDayMoment);

    for (let i = 0; i < firstDayPersianIndex; i++) grid.push(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const weekdayIndex = (firstDayPersianIndex + (day - 1)) % 7;
      grid.push({ day, isFriday: weekdayIndex === 6 });
    }

    return grid;
  }, [currentYear, currentMonth]);

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

  // استایل‌های پویا با Tailwind بر اساس تم سیستم
  const selectClass = `border rounded-md px-1.5 py-1 text-xs font-semibold cursor-pointer outline-none transition-colors ${
    isDark ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-500' : 'bg-gray-50 border-gray-200 text-gray-800 hover:border-blue-500'
  }`;

  const navBtnClass = `w-7 h-7 rounded-full flex items-center justify-center text-[10px] transition-colors ${
    isDark ? 'bg-gray-700 text-gray-400 hover:bg-blue-600 hover:text-white' : 'bg-gray-100 text-gray-600 hover:bg-blue-600 hover:text-white'
  }`;

  const footerBtnClass = `px-4 py-1 text-xs font-semibold rounded-full border transition-colors ${
    isDark ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-blue-600 hover:border-blue-600 hover:text-white' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-blue-600 hover:border-blue-600 hover:text-white'
  }`;

  const getDayClass = (day, cell) => {
    if (!day) return "pointer-events-none";
    let base = "aspect-square flex items-center justify-center text-xs rounded-lg cursor-pointer transition-colors font-medium ";
    
    if (isSelected(day)) {
      base += "bg-blue-600 text-white font-bold shadow-md";
    } else if (isToday(day)) {
      base += isDark 
        ? "bg-yellow-900/40 text-yellow-400 ring-1 ring-yellow-600 font-bold " 
        : "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400 font-bold ";
    } else {
      base += isDark ? "hover:bg-gray-700 hover:text-blue-300 " : "hover:bg-blue-50 hover:text-blue-600 ";
      if (cell.isFriday) {
        base += isDark ? "text-red-400 " : "text-red-600 ";
      } else {
        base += isDark ? "text-gray-300 " : "text-gray-800 ";
      }
    }
    return base;
  };

  const calendarContent = (
    <div dir="rtl">
      {/* هدر تقویم */}
      <div className={`flex justify-between items-center mb-3 pb-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={handlePrevMonth} className={navBtnClass}>▶</button>
        <div className="flex gap-1.5">
          <select value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))} className={selectClass}>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))} className={selectClass}>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button type="button" onClick={handleNextMonth} className={navBtnClass}>◀</button>
      </div>

      {/* روزهای هفته */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_DAYS.map((d, i) => (
          <div key={i} className={`text-center text-[10px] font-bold py-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{d}</div>
        ))}
      </div>

      {/* شبکه روزها */}
      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((cell, i) => {
          const day = cell ? cell.day : null;
          return (
            <div key={i} onClick={() => handleDayClick(day)} className={getDayClass(day, cell)}>
              {day}
            </div>
          );
        })}
      </div>

      {/* فوتر */}
      <div className={`flex justify-center gap-2 mt-3 pt-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <button type="button" onClick={handleToday} className={footerBtnClass}>امروز</button>
        <button type="button" onClick={handleClear} className={`${footerBtnClass} !text-red-500 hover:!bg-red-500 hover:!text-white hover:!border-red-500`}>پاک کردن</button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`} dir="rtl">
    {label && <label className={`block text-[11px] font-bold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</label>}

      {/* اینپوت اصلی */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          className={`w-full pl-2 pr-8 py-0 leading-normal rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold h-[32px] cursor-pointer transition-colors ${
            isDark 
              ? 'bg-gray-800 text-gray-200 border-gray-600' 
              : 'bg-white text-gray-800 border-gray-300'
          } ${disabled ? (isDark ? 'opacity-50 cursor-not-allowed bg-gray-900' : 'opacity-60 cursor-not-allowed bg-gray-100') : ''}`}
        />
        <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          📅
        </span>
      </div>

      {/* پاپ‌آپ (بدون مودال) */}
      {isOpen && !disabled && !modal && (
        <div className={`absolute top-full right-0 mt-1.5 z-[1000] p-3 rounded-xl border shadow-xl w-64 ${
          isDark ? 'bg-gray-800 border-gray-700 text-gray-200 shadow-black/50' : 'bg-white border-gray-200 text-gray-800'
        }`}>
          {calendarContent}
        </div>
      )}

      {/* حالت مودال (برای صفحه گوشی یا انتخاب کارفرما) */}
      {isOpen && !disabled && modal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`p-4 rounded-2xl shadow-2xl border w-full max-w-[320px] ${
            isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'
          }`}>
            <div className={`flex items-center justify-between mb-3 pb-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <span className="text-xs font-bold">انتخاب تاریخ</span>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)} 
                className={`text-lg leading-none transition-colors ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'}`}
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