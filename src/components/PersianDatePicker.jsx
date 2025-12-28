// src/components/PersianDatePicker.jsx
import React from 'react';
import DatePicker from '@hassanmojab/react-modern-calendar-datepicker';
import moment from 'moment-jalaali';
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css';

moment.loadPersian({ usePersianDigits: false });

const PersianDatePicker = ({ 
  value, 
  onChange, 
  placeholder = 'انتخاب تاریخ',
  className = '',
  required = false,
  minimumDate = null,
  disabled = false,
  label = null
}) => {
  const gregorianToPersian = (gregorianDate) => {
    if (!gregorianDate) return null;
    try {
      const m = moment(gregorianDate, 'YYYY-MM-DD');
      if (!m.isValid()) return null;
      return {
        year: parseInt(m.jYear()),
        month: parseInt(m.jMonth()) + 1,
        day: parseInt(m.jDate())
      };
    } catch (e) {
      return null;
    }
  };

  const persianToGregorian = (persianDate) => {
    if (!persianDate) return '';
    try {
      const { year, month, day } = persianDate;
      const m = moment(`${year}/${month}/${day}`, 'jYYYY/jM/jD');
      return m.isValid() ? m.format('YYYY-MM-DD') : '';
    } catch (e) {
      return '';
    }
  };

  const persianValue = gregorianToPersian(value);
  const persianMinDate = minimumDate ? gregorianToPersian(minimumDate) : null;

  const handleChange = (selectedDate) => {
    onChange(selectedDate ? persianToGregorian(selectedDate) : '');
  };

  return (
    <div className={`${className} mb-6`}>
      {label && (
        <label className="block text-gray-300 mb-2 font-medium">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative z-10">
        <style>{`
          /* تقویم اصلی */
          .persian-dp .Calendar {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
            border: 2px solid #374151 !important;
            border-radius: 16px !important;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6) !important;
            padding: 1rem !important;
          }

          /* هدر */
          .persian-dp .Calendar__header {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%) !important;
            padding: 1rem !important;
            border-radius: 12px !important;
            margin-bottom: 1rem !important;
          }

          /* دکمه‌های ناوبری */
          .persian-dp .Calendar__monthArrow {
            background-color: #4b5563 !important;
            border-radius: 8px !important;
            padding: 0.5rem !important;
            transition: all 0.3s ease !important;
          }

          .persian-dp .Calendar__monthArrow:hover {
            background-color: #3b82f6 !important;
            transform: scale(1.1) !important;
          }

          /* ماه و سال */
          .persian-dp .Calendar__monthYearContainer {
            color: #f3f4f6 !important;
            font-weight: 700 !important;
            font-size: 1.1rem !important;
          }

          /* نام روزها */
          .persian-dp .Calendar__weekDay {
            color: #9ca3af !important;
            font-weight: 700 !important;
          }

          /* روزها */
          .persian-dp .Calendar__day {
            color: #e5e7eb !important;
            border-radius: 10px !important;
            transition: all 0.2s ease !important;
            font-weight: 500 !important;
          }

          .persian-dp .Calendar__day:not(.-blank):not(.-selected):hover {
            background-color: #4b5563 !important;
            transform: scale(1.05) !important;
            cursor: pointer !important;
          }

          .persian-dp .Calendar__day.-selected {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            font-weight: 800 !important;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5) !important;
          }

          .persian-dp .Calendar__day.-today:not(.-selected) {
            border: 2px solid #10b981 !important;
            color: #10b981 !important;
            font-weight: 700 !important;
          }

          .persian-dp .Calendar__day.-weekend:not(.-selected) {
            color: #ef4444 !important;
          }

          .persian-dp .Calendar__day.-disabled {
            color: #4b5563 !important;
            opacity: 0.3 !important;
          }

          /* مدال انتخاب سال */
          .persian-dp .Calendar__yearSelectorWrapper {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
            border: 2px solid #374151 !important;
            border-radius: 16px !important;
            padding: 1.5rem !important;
            max-height: 350px !important;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7) !important;
          }

          .persian-dp .Calendar__yearSelectorText {
            color: #f3f4f6 !important;
            font-weight: 700 !important;
            font-size: 1.1rem !important;
            margin-bottom: 1rem !important;
            text-align: center !important;
            border-bottom: 2px solid #4b5563 !important;
            padding-bottom: 0.75rem !important;
          }

          /* سال‌ها - حالت عادی */
          .persian-dp .Calendar__yearSelectorItem {
            background-color: #374151 !important;
            color: #e5e7eb !important;
            padding: 1rem !important;
            margin: 0.5rem 0 !important;
            border-radius: 12px !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            border: 2px solid transparent !important;
            font-weight: 600 !important;
            text-align: center !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          }

          .persian-dp .Calendar__yearSelectorItem:hover {
            background-color: #4b5563 !important;
            border-color: #60a5fa !important;
            transform: translateX(-4px) scale(1.02) !important;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4) !important;
          }

          .persian-dp .Calendar__yearSelectorItem.-selected {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            font-weight: 800 !important;
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6) !important;
            transform: scale(1.05) !important;
          }

          .persian-dp .Calendar__yearSelectorItem.-currentYear:not(.-selected) {
            border: 2px solid #10b981 !important;
            background-color: rgba(16, 185, 129, 0.15) !important;
            color: #10b981 !important;
          }

          /* اسکرول‌بار */
          .persian-dp .Calendar__yearSelectorWrapper::-webkit-scrollbar {
            width: 10px;
          }
          .persian-dp .Calendar__yearSelectorWrapper::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 10px;
          }
          .persian-dp .Calendar__yearSelectorWrapper::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
            border-radius: 10px;
          }
          .persian-dp .Calendar__yearSelectorWrapper::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          }

          /* مدال ماه */
          .persian-dp .Calendar__monthSelectorWrapper {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%) !important;
            border: 2px solid #374151 !important;
            border-radius: 16px !important;
            padding: 1.5rem !important;
          }

          .persian-dp .Calendar__monthSelectorItemText {
            background-color: #374151 !important;
            color: #e5e7eb !important;
            padding: 1rem !important;
            margin: 0.5rem !important;
            border-radius: 12px !important;
            cursor: pointer !important;
            transition: all 0.3s ease !important;
            font-weight: 600 !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          }

          .persian-dp .Calendar__monthSelectorItemText:hover {
            background-color: #4b5563 !important;
            border-color: #60a5fa !important;
            transform: scale(1.05) !important;
          }

          .persian-dp .Calendar__monthSelectorItem.-selected .Calendar__monthSelectorItemText {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
            color: white !important;
            font-weight: 800 !important;
          }
        `}</style>
        
        <div className="persian-dp">
          <DatePicker
            value={persianValue}
            onChange={handleChange}
            inputPlaceholder={placeholder}
            locale="fa"
            shouldHighlightWeekends
            minimumDate={persianMinDate}
            inputClassName="w-full p-3 bg-gray-700 text-white rounded-lg border-2 border-gray-600 focus:border-blue-500 focus:outline-none transition-all duration-300 font-medium"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default PersianDatePicker;
