// src/components/admin/FormattedInfoField.jsx
import React from 'react';
import { formatNumberPersian } from '../../utils/numberUtils';

const FormattedInfoField = ({ label, value, isNumber = false, isCurrency = false }) => {
  const renderValue = () => {
    if (!value && value !== 0) return '-';
    
    if (isNumber || isCurrency) {
      const formatted = formatNumberPersian(value);
      return (
        <>
          {formatted} {isCurrency && <span className="text-[9px] text-gray-400">ریال</span>}
        </>
      );
    }
    
    return value;
  };

  return (
    <div className="mb-2">
      <label className="block text-[10px] text-gray-500 mb-0.5">{label}</label>
      <div className={`text-sm font-medium text-gray-900 border-b border-gray-100 pb-1 ${isNumber || isCurrency ? 'font-mono' : ''}`}>
        {renderValue()}
      </div>
    </div>
  );
};

export default FormattedInfoField;
