// src/components/admin/EmployeeInfoSection.jsx
import React from 'react';
import JalaliDatePicker from '../JalaliDatePicker';
import { formatJalaliDate } from '../../utils/dateUtils';

const InfoField = ({ label, value, isNumber = false }) => (
    <div className="mb-2">
        <label className="block text-[10px] text-gray-500 mb-0.5">{label}</label>
        <div className={`text-sm font-medium text-gray-900 border-b border-gray-100 pb-1 ${isNumber ? 'font-mono' : ''}`}>
            {value ? (isNumber ? value : value) : '-'} {isNumber && value ? 'ریال' : ''}
        </div>
    </div>
);

const EDUCATION_OPTIONS = [
  { value: 'ELEMENTARY', label: 'پایان ابتدایی' },
  { value: 'MIDDLE', label: 'پایان راهنمایی (سیکل)' },
  { value: 'DIPLOMA', label: 'دیپلم' },
  { value: 'ASSOCIATE', label: 'فوق‌دیپلم' },
  { value: 'BACHELOR', label: 'لیسانس' },
  { value: 'MASTER', label: 'فوق‌لیسانس' },
  { value: 'PHD', label: 'دکتری' },
  { value: 'OTHER', label: 'سایر' },
];

const MARITAL_OPTIONS = {
    'SINGLE': 'مجرد',
    'MARRIED': 'متأهل',
    'OTHER': 'سایر'
};

const MILITARY_OPTIONS = {
    'DONE': 'پایان خدمت',
    'EXEMPT': 'معاف',
    'SERVING': 'در حال خدمت',
    'NOT_APPLICABLE': 'مشمول نیست'
};

const EmployeeInfoSection = ({ formData, isViewMode, handleInputChange }) => {
  return (
    <section className="border border-gray-300 rounded-sm p-4 relative">
      <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
        الف) مشخصات کارگر
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
        {/* نام */}
        <div className="md:col-span-1">
          <InfoField label="نام" value={formData.first_name} />
        </div>

        {/* نام خانوادگی */}
        <div className="md:col-span-1">
          <InfoField label="نام خانوادگی" value={formData.last_name} />
        </div>

        {/* نام پدر */}
        <div className="md:col-span-1">
          <InfoField label="نام پدر" value={formData.father_name} />
        </div>

        {/* کد ملی */}
        <div className="md:col-span-1">
          <InfoField label="کد ملی" value={formData.code_meli} />
        </div>
        
        {/* 📅 تاریخ تولد با Date Picker گرافیکی */}
        <div className="md:col-span-1">
          {isViewMode ? (
            <div className="mb-2">
              <label className="block text-[10px] text-gray-500 mb-0.5">تاریخ تولد</label>
              <div className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-1">
                {formatJalaliDate(formData.birth_date) || '-'}
              </div>
              {formData.birth_date && (
                <div className="text-[9px] text-gray-400 mt-1">
                  ({formData.birth_date})
                </div>
              )}
            </div>
          ) : (
            <JalaliDatePicker
              name="birth_date"
              value={formData.birth_date}
              onChange={handleInputChange}
              label="تاریخ تولد 📅"
            />
          )}
        </div>
        
        {/* محل تولد */}
        <div className="md:col-span-1">
          {isViewMode ? (
            <InfoField label="محل تولد" value={formData.birth_place} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">محل تولد</label>
              <input
                name="birth_place"
                value={formData.birth_place || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm"
                placeholder="مثال: تهران"
              />
            </div>
          )}
        </div>
        
        {/* محل صدور */}
        <div className="md:col-span-2">
          {isViewMode ? (
            <InfoField label="محل صدور" value={formData.issuance_place} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">محل صدور شناسنامه</label>
              <input
                name="issuance_place"
                value={formData.issuance_place || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm"
                placeholder="مثال: تهران"
              />
            </div>
          )}
        </div>

        {/* وضعیت تاهل */}
        <div className="md:col-span-1">
          {isViewMode ? (
            <InfoField label="وضعیت تاهل" value={MARITAL_OPTIONS[formData.marital_status] || formData.marital_status} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">وضعیت تاهل</label>
              <select
                name="marital_status"
                value={formData.marital_status || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 bg-white text-sm"
              >
                <option value="SINGLE">مجرد</option>
                <option value="MARRIED">متأهل</option>
                <option value="OTHER">سایر</option>
              </select>
            </div>
          )}
        </div>

        {/* تعداد اولاد */}
        <div className="md:col-span-1">
          {isViewMode ? (
            <InfoField label="تعداد اولاد" value={formData.children_count} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">تعداد اولاد</label>
              <input
                name="children_count"
                type="number"
                min="0"
                max="20"
                value={formData.children_count || 0}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-center text-sm"
              />
            </div>
          )}
        </div>

        {/* وضعیت سربازی */}
        <div className="md:col-span-1">
          {isViewMode ? (
            <InfoField label="وضعیت سربازی" value={MILITARY_OPTIONS[formData.military_status] || formData.military_status} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">وضعیت سربازی</label>
              <select
                name="military_status"
                value={formData.military_status || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 bg-white text-sm"
              >
                <option value="DONE">پایان خدمت</option>
                <option value="EXEMPT">معاف</option>
                <option value="SERVING">در حال خدمت</option>
                <option value="NOT_APPLICABLE">مشمول نیست</option>
              </select>
            </div>
          )}
        </div>
        
        {/* مدرک تحصیلی */}
        <div className="md:col-span-1">
          {isViewMode ? (
            <InfoField label="مدرک تحصیلی" value={EDUCATION_OPTIONS.find(o => o.value === formData.education_level)?.label || formData.education_level} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">آخرین مدرک تحصیلی</label>
              <select
                name="education_level"
                value={formData.education_level || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 bg-white text-sm"
              >
                <option value="">-- انتخاب کنید --</option>
                {EDUCATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* رشته تحصیلی */}
        <div className="md:col-span-3">
          {isViewMode ? (
            <InfoField label="رشته تحصیلی" value={formData.education_field} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">رشته تحصیلی</label>
              <input
                name="education_field"
                value={formData.education_field || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm"
                placeholder="مثال: مهندسی عمران"
              />
            </div>
          )}
        </div>

        {/* سوابق کار */}
        <div className="md:col-span-4 mt-4 pt-3 border-t border-dashed border-gray-300">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-xs font-bold text-gray-700">📊 سوابق کار:</span>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="bg-green-50 border border-green-200 px-3 py-1.5 rounded text-gray-700">
                <span className="text-green-700 font-semibold">✓ داخل سازمان:</span>{' '}
                <strong className="text-gray-900">{formData.experience_inside_years || 0}</strong> سال /{' '}
                <strong className="text-gray-900">{formData.experience_inside_months || 0}</strong> ماه
              </span>
              <span className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded text-gray-700">
                <span className="text-blue-700 font-semibold">✓ خارج سازمان:</span>{' '}
                <strong className="text-gray-900">{formData.experience_outside_years || 0}</strong> سال /{' '}
                <strong className="text-gray-900">{formData.experience_outside_months || 0}</strong> ماه
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployeeInfoSection;
