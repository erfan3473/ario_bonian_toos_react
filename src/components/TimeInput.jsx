// src/components/TimeInput.jsx
import React from 'react';

const clamp = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const pad2 = n => n.toString().padStart(2, '0');

const TimeInput = ({ value, onChange, className = '' }) => {
  // value مثل '14:30' یا خالی
  const [hStr, mStr] = (value || '').split(':');
  const hours = Number.isInteger(parseInt(hStr, 10)) ? clamp(parseInt(hStr, 10), 0, 23) : 0;
  const minutes = Number.isInteger(parseInt(mStr, 10)) ? clamp(parseInt(mStr, 10), 0, 59) : 0;

  const emit = (h, m) => {
    const v = `${pad2(h)}:${pad2(m)}`;
    onChange && onChange(v);
  };

  const handleHourChange = e => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') return onChange('');
    const num = clamp(parseInt(raw, 10), 0, 23);
    emit(num, minutes);
  };

  const handleMinuteChange = e => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') return onChange('');
    const num = clamp(parseInt(raw, 10), 0, 59);
    emit(hours, num);
  };

  const incHour = () => emit((hours + 1) % 24, minutes);
  const decHour = () => emit((hours + 23) % 24, minutes);
  const incMinute = () => emit(hours, (minutes + 5) % 60);   // پله ۵ دقیقه
  const decMinute = () => emit(hours, (minutes + 55) % 60);  // -۵ دقیقه

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {/* ساعت */}
      <div className="flex items-center bg-gray-700/60 rounded-lg border border-gray-600 px-2 py-1">
        <button
          type="button"
          onClick={incHour}
          className="text-xs text-gray-300 px-1 hover:text-white"
        >▲</button>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={pad2(hours)}
          onChange={handleHourChange}
           className="w-12 h-8 bg-transparent text-center text-sm text-white outline-none"
        />
        <button
          type="button"
          onClick={decHour}
          className="text-xs text-gray-300 px-1 hover:text-white"
        >▼</button>
      </div>

      <span className="text-gray-300 text-sm">:</span>

      {/* دقیقه */}
      <div className="flex items-center bg-gray-700/60 rounded-lg border border-gray-600 px-2 py-1">
        <button
          type="button"
          onClick={incMinute}
          className="text-xs text-gray-300 px-1 hover:text-white"
        >▲</button>
        <input
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={pad2(minutes)}
          onChange={handleMinuteChange}
          className="w-12 h-8 bg-transparent text-center text-sm text-white outline-none"
        />
        <button
          type="button"
          onClick={decMinute}
          className="text-xs text-gray-300 px-1 hover:text-white"
        >▼</button>
      </div>
    </div>
  );
};

export default TimeInput;
