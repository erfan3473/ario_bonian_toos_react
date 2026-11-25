// src/components/JalaliDatePicker.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment-jalaali';
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

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
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

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
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (event) => {
      if (!modal && containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const handleDayClick = useCallback(
    (day) => {
      if (!day) return;
      const newDate = moment(`${currentYear}/${currentMonth + 1}/${day}`, 'jYYYY/jM/jD');
      setSelectedDate(newDate);
      onChange({ target: { name, value: newDate.format('YYYY-MM-DD') } });
      setIsOpen(false);
    },
    [currentYear, currentMonth, name, onChange]
  );

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

  const isToday = useCallback(
    (day) => {
      if (!day) return false;
      return day === todayRef.day && currentMonth === todayRef.month && currentYear === todayRef.year;
    },
    [currentMonth, currentYear, todayRef]
  );

  const isSelected = useCallback(
    (day) => {
      if (!day || !selectedDate) return false;
      return (
        day === selectedDate.jDate() &&
        currentMonth === selectedDate.jMonth() &&
        currentYear === selectedDate.jYear()
      );
    },
    [currentMonth, currentYear, selectedDate]
  );

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

  const displayValue = selectedDate ? toPersianDigits(selectedDate.format('jYYYY/jMM/jDD')) : '';

  const borderHairline = isDark ? 'border-slate-400/20' : 'border-slate-900/15';

  const selectClass = `border rounded-[2px] px-1.5 py-1 text-xs font-semibold cursor-pointer outline-none transition-colors tracking-normal ${
    isDark
      ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 hover:border-sky-400'
      : 'bg-slate-50 border-slate-900/20 text-slate-900 hover:border-sky-600'
  }`;

  const navBtnClass = `w-7 h-7 rounded-[2px] border flex items-center justify-center transition-colors ${
    isDark
      ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300 hover:border-sky-400 hover:text-sky-300'
      : 'bg-slate-50 border-slate-900/15 text-slate-600 hover:border-sky-600 hover:text-sky-700'
  }`;

  const footerBtnClass = `h-7 px-3.5 text-xs font-semibold rounded-[2px] border transition-colors tracking-normal ${
    isDark
      ? 'bg-tactical-surface2 border-slate-400/20 text-slate-200 hover:border-sky-400 hover:text-sky-300'
      : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:border-sky-600 hover:text-sky-700'
  }`;

  const getDayClass = (day, cell) => {
    if (!day) return 'pointer-events-none';
    let base =
      'aspect-square flex items-center justify-center text-xs tabular-nums rounded-[2px] border cursor-pointer transition-colors font-medium ';

    if (isSelected(day)) {
      base += isDark
        ? 'bg-sky-400 border-sky-400 text-slate-950 font-bold'
        : 'bg-sky-600 border-sky-700 text-white font-bold';
    } else if (isToday(day)) {
      base += isDark
        ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-bold'
        : 'bg-amber-50 border-amber-600 text-amber-800 font-bold';
    } else {
      base += isDark
        ? 'border-transparent hover:bg-tactical-hover hover:border-sky-400/40 '
        : 'border-transparent hover:bg-sky-50 hover:border-sky-600/30 ';
      if (cell.isFriday) {
        base += isDark ? 'text-red-400 ' : 'text-red-600 ';
      } else {
        base += isDark ? 'text-slate-200 ' : 'text-slate-800 ';
      }
    }
    return base;
  };

  const calendarContent = (
    <div dir="rtl">
      {/* هدر تقویم */}
      <div className={`flex justify-between items-center mb-3 pb-2 border-b ${borderHairline}`}>
        <button type="button" onClick={handlePrevMonth} className={navBtnClass} aria-label="ماه قبل">
          <ChevronRightIcon className="w-3.5 h-3.5" />
        </button>
        <div className="flex gap-1.5">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className={selectClass}
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={i} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className={selectClass}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {toPersianDigits(y)}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={handleNextMonth} className={navBtnClass} aria-label="ماه بعد">
          <ChevronLeftIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* روزهای هفته */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={i}
            className={`text-center text-[10px] font-bold py-1 tracking-normal ${
              i === 6
                ? isDark
                  ? 'text-red-400'
                  : 'text-red-600'
                : isDark
                ? 'text-slate-400'
                : 'text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* شبکه روزها */}
      <div className="grid grid-cols-7 gap-1">
        {daysGrid.map((cell, i) => {
          const day = cell ? cell.day : null;
          return (
            <div key={i} onClick={() => handleDayClick(day)} className={getDayClass(day, cell)}>
              {day ? toPersianDigits(day) : null}
            </div>
          );
        })}
      </div>

      {/* فوتر */}
      <div className={`flex justify-center gap-2 mt-3 pt-2.5 border-t ${borderHairline}`}>
        <button type="button" onClick={handleToday} className={footerBtnClass}>
          امروز
        </button>
        <button
          type="button"
          onClick={handleClear}
          className={`h-7 px-3.5 text-xs font-semibold rounded-[2px] border transition-colors tracking-normal ${
            isDark
              ? 'bg-red-500/10 border-red-500/35 text-red-400 hover:bg-red-500/20'
              : 'bg-red-50 border-red-600/35 text-red-700 hover:bg-red-100'
          }`}
        >
          پاک کردن
        </button>
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={`relative ${className}`} dir="rtl">
      {label && (
        <label
          className={`block text-[11px] font-semibold mb-1 tracking-normal ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {label}
        </label>
      )}

      {/* اینپوت اصلی */}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onClick={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          className={`w-full h-9 ps-8 pe-2.5 rounded-[2px] border focus:outline-none text-xs font-semibold tabular-nums cursor-pointer transition-colors tracking-normal ${
            isDark
              ? 'bg-tactical-canvas text-slate-100 border-slate-400/25 hover:border-sky-400/50 focus:border-sky-400'
              : 'bg-slate-50 text-slate-900 border-slate-900/20 hover:border-sky-600/50 focus:border-sky-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <CalendarDaysIcon
          className={`w-4 h-4 absolute start-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
            isDark ? 'text-sky-400' : 'text-sky-700'
          }`}
        />
      </div>

      {/* پاپ‌آپ (بدون مودال) */}
      {isOpen && !disabled && !modal && (
        <div
          className={`absolute top-full start-0 mt-1.5 z-[1000] p-3 rounded-[2px] border shadow-2xl w-64 ${
            isDark
              ? 'bg-tactical-surface1 border-sky-400/40 text-slate-100 shadow-black/70'
              : 'bg-white border-sky-600/40 text-slate-900 shadow-slate-900/15'
          }`}
        >
          {calendarContent}
        </div>
      )}

      {/* حالت مودال */}
      {isOpen && !disabled && modal && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className={`rounded-[2px] shadow-2xl border w-full max-w-[320px] overflow-hidden ${
              isDark
                ? 'bg-tactical-surface1 border-sky-400/45 text-slate-100'
                : 'bg-white border-sky-600/45 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between px-4 py-2.5 border-b ${borderHairline} ${
                isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated'
              }`}
            >
              <span className="text-xs font-bold tracking-normal">انتخاب تاریخ شمسی</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                aria-label="بستن تقویم"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5">{calendarContent}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(JalaliDatePicker);