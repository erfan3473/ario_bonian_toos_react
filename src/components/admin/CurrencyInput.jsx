// src/components/admin/CurrencyInput.jsx
import React, { useState, useEffect } from 'react';
import { formatNumberPersian } from '../../utils/numberUtils';

const CurrencyInput = ({ 
  name, 
  value, 
  onChange, 
  label, 
  readOnly = false,
  showPersian = true,
  className = '',
  ...props 
}) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value || value === 0) {
      // فرمت با کاما (انگلیسی)
      const formatted = Number(value).toLocaleString('en-US');
      setDisplayValue(formatted);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value;
    
    // حذف همه چیز به جز اعداد
    const numericValue = input.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      onChange({ target: { name, value: 0, type: 'number' } });
      setDisplayValue('');
      return;
    }

    // تبدیل به عدد واقعی
    const numberValue = parseInt(numericValue, 10);
    
    // ارسال عدد واقعی به parent
    onChange({ target: { name, value: numberValue, type: 'number' } });
    
    // نمایش با فرمت
    setDisplayValue(numberValue.toLocaleString('en-US'));
  };

  const persianDisplay = showPersian && value ? formatNumberPersian(value) : null;

  return (
    <div className={className}>
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      
      <input
        type="text"
        name={name}
        value={displayValue}
        onChange={handleChange}
        readOnly={readOnly}
        className={`w-full border px-2 py-1 text-left font-mono ${
          readOnly ? 'bg-gray-100' : 'bg-white'
        }`}
        {...props}
      />
      
      {persianDisplay && (
        <div className="text-[10px] text-blue-600 mt-1 text-right">
          {persianDisplay} ریال
        </div>
      )}
    </div>
  );
};

export default CurrencyInput;
