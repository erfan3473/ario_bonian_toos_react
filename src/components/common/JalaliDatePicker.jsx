// src/components/common/JalaliDatePicker.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import moment from 'moment-jalaali';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';

// Initialize moment-jalaali
moment.loadPersian({ usePersianDigits: false, dialect: 'persian-modern' });

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const WEEK_DAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const YEARS = Array.from({ length: 120 }, (_, i) => moment().jYear() - i);

const getPersianWeekdayIndex = (m) => (m.day() + 1) % 7;

const JalaliDatePicker = ({
  name,
  value, 
  onChange, 
  disabled = false,
  placeholder = 'انتخاب تاریخ',
  className = '', // 👈 اصلاح شد: از inputClassName به className تغییر یافت تا استایل‌های والد اعمال شود
}) => {
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState(() => {
    const initialMoment = value && moment(value, 'YYYY-MM-DD').isValid() ? moment(value, 'YYYY-MM-DD') : moment();
    return { month: initialMoment.jMonth(), year: initialMoment.jYear() };
  });
  const [selectedMoment, setSelectedMoment] = useState(null);
  
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  const [dropdownStyles, setDropdownStyles] = useState({});

  useEffect(() => {
    if (value && moment(value, 'YYYY-MM-DD').isValid()) {
      const m = moment(value, 'YYYY-MM-DD');
      setSelectedMoment(m);
      setCurrentView({ month: m.jMonth(), year: m.jYear() });
    } else {
      setSelectedMoment(null);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (containerRef.current && isOpen) {
        const inputRect = containerRef.current.getBoundingClientRect();
        const dropdownHeight = 280; // 👈 ارتفاع تقریبی آپدیت شد
        let topPosition = inputRect.bottom + 4;

        if (window.innerHeight - inputRect.bottom < dropdownHeight && inputRect.top > dropdownHeight) {
            topPosition = inputRect.top - dropdownHeight - 4;
        }

        setDropdownStyles({
            position: 'fixed',
            top: `${topPosition}px`,
            left: `${Math.max(10, inputRect.right - 220)}px`, // 👈 عرض از 256 به 220 کاهش یافت تا جمع‌وجورتر شود
            width: '220px',
            zIndex: 999999,
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
    }
    return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const daysGrid = useMemo(() => {
    const grid = [];
    const daysInMonth = moment.jDaysInMonth(currentView.year, currentView.month);
    const firstDayMoment = moment(`${currentView.year}/${currentView.month + 1}/1`, 'jYYYY/jM/jD');
    const firstDayPersianIndex = getPersianWeekdayIndex(firstDayMoment);
    for (let i = 0; i < firstDayPersianIndex; i++) grid.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push({ day, isFriday: (firstDayPersianIndex + day - 1) % 7 === 6 });
    }
    return grid;
  }, [currentView.year, currentView.month]);

  const today = useMemo(() => {
    const t = moment();
    return { day: t.jDate(), month: t.jMonth(), year: t.jYear() };
  }, []);

  const handleDayClick = useCallback((day) => {
    if (!day) return;
    const newDate = moment(`${currentView.year}/${currentView.month + 1}/${day}`, 'jYYYY/jM/jD');
    onChange({ target: { name, value: newDate.format('YYYY-MM-DD') } });
    setIsOpen(false);
  }, [currentView.year, currentView.month, name, onChange]);

  const changeMonth = (amount) => {
    setCurrentView(prev => {
      const newMoment = moment().jYear(prev.year).jMonth(prev.month).add(amount, 'jMonth');
      return { year: newMoment.jYear(), month: newMoment.jMonth() };
    });
  };

  const handleToday = useCallback(() => {
    const todayMoment = moment();
    onChange({ target: { name, value: todayMoment.format('YYYY-MM-DD') } });
    setIsOpen(false);
  }, [name, onChange]);

  const displayValue = selectedMoment ? selectedMoment.format('jYYYY/jMM/jDD') : '';

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onClick={() => !disabled && setIsOpen(o => !o)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          className={className || "w-full outline-none bg-transparent cursor-pointer"} // اعمال استایل‌ها
        />
        <FaCalendarAlt className={`absolute left-0 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      </div>

      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <div 
            ref={dropdownRef} 
            style={dropdownStyles}
            dir="rtl"
            // 👈 پدینگ از p-2 به p-1.5 کاهش یافت
            className={`rounded-xl border p-1.5 shadow-2xl ${isDark ? 'bg-slate-800 border-slate-700 text-gray-200' : 'bg-white border-gray-200 text-gray-800'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => changeMonth(-1)} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><FaChevronRight size={10} /></button>
            <div className="flex gap-1">
              <select value={currentView.month} onChange={(e) => setCurrentView(v => ({...v, month: parseInt(e.target.value)}))} className={`text-[10px] px-1 py-0.5 border rounded-md outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <select value={currentView.year} onChange={(e) => setCurrentView(v => ({...v, year: parseInt(e.target.value)}))} className={`text-[10px] px-1 py-0.5 border rounded-md outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => changeMonth(1)} className={`p-1.5 rounded-full ${isDark ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><FaChevronLeft size={10} /></button>
          </div>

          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 mb-1">
            {WEEK_DAYS.map((d) => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-y-0.5">
            {daysGrid.map((cell, i) => {
              const day = cell?.day;
              const isSelected = selectedMoment && day === selectedMoment.jDate() && currentView.month === selectedMoment.jMonth() && currentView.year === selectedMoment.jYear();
              const isToday = day === today.day && currentView.month === today.month && currentView.year === today.year;
              
              return (
                <div key={i} className="flex justify-center items-center p-0.5">
                  {day && (
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      // 👈 دکمه‌ها از w-7 h-7 به w-6 h-6 کوچکتر شدند
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] transition-colors
                        ${cell.isFriday && !isSelected ? 'text-red-400' : ''}
                        ${isToday && !isSelected ? 'border border-blue-500' : ''}
                        ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : (isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100')}
                      `}
                    >{day}</button>
                  )}
                </div>
              );
            })}
          </div>

          <div className={`mt-1.5 pt-1.5 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
            <button type="button" onClick={handleToday} className={`w-full text-center font-medium text-[10px] py-1.5 rounded-md transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>برو به امروز</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default React.memo(JalaliDatePicker);