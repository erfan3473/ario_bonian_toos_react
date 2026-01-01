// src/components/admin/ContractorInfoSection.jsx
import React from 'react';

const ContractorInfoSection = ({ isViewMode = true }) => {
  // اطلاعات ثابت پیمانکار
  const contractorInfo = {
    company_name: 'آریو بنیان توس',
    ceo_name: 'کوهزاد صادقی',
    legal_address: 'مشهد فلسطین 14',
    registration_number: '54123'
  };

  const InfoField = ({ label, value }) => (
    <div className="mb-2">
      <label className="block text-[10px] text-gray-500 mb-0.5">{label}</label>
      <div className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-1">
        {value || '-'}
      </div>
    </div>
  );

  return (
    <section className="border border-gray-300 rounded-sm p-4 relative bg-amber-50/30">
      <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
        ب) مشخصات پیمانکار
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <InfoField 
          label="نام شرکت" 
          value={contractorInfo.company_name} 
        />
        
        <InfoField 
          label="نام و نام خانوادگی مدیر عامل" 
          value={contractorInfo.ceo_name} 
        />
        
        <InfoField 
          label="نشانی قانونی" 
          value={contractorInfo.legal_address} 
        />
        
        <InfoField 
          label="شماره ثبت" 
          value={contractorInfo.registration_number} 
        />
      </div>

      {!isViewMode && (
        <div className="mt-3 pt-3 border-t border-amber-200">
          <p className="text-xs text-amber-700">
            ℹ️ اطلاعات پیمانکار ثابت و غیرقابل ویرایش است
          </p>
        </div>
      )}
    </section>
  );
};

export default ContractorInfoSection;
