
// src/components/admin/EmployeeInfoSection.jsx
import React from 'react';
import PropTypes from 'prop-types';
import JalaliDatePicker from '../JalaliDatePicker';
import { formatJalaliDate } from '../../utils/dateUtils';

// ================= InfoField =================
const InfoField = ({ label, value, isNumber = false }) => {
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div className="mb-2">
      <label className="block text-[10px] text-gray-500 mb-0.5">
        {label}
      </label>
      <div
        className={`text-sm font-medium text-gray-900 border-b border-gray-100 pb-1 ${
          isNumber ? 'font-mono' : ''
        }`}
      >
        {hasValue ? value : '-'}
        {isNumber && hasValue ? ' ریال' : ''}
      </div>
    </div>
  );
};

InfoField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isNumber: PropTypes.bool,
};

// ================= Constants =================
const EDUCATION_OPTIONS = [
  { value: '', label: '-- انتخاب کنید --' },
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
  SINGLE: 'مجرد',
  MARRIED: 'متأهل',
  OTHER: 'سایر',
};

const MILITARY_OPTIONS = {
  DONE: 'پایان خدمت',
  EXEMPT: 'معاف',
  SERVING: 'در حال خدمت',
  NOT_APPLICABLE: 'مشمول نیست',
};

// ================= Main Component =================
const EmployeeInfoSection = ({
  formData,
  isViewMode,
  handleInputChange,
}) => {
  return (
    <section className="border border-gray-300 rounded-sm p-4 relative">
      {/* Title */}
      <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
        الف) مشخصات کارگر
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
        {/* Row 1 */}
        <div>
          <InfoField label="نام" value={formData.first_name} />
        </div>

        <div>
          <InfoField label="نام خانوادگی" value={formData.last_name} />
        </div>

        <div>
          <InfoField label="نام پدر" value={formData.father_name} />
        </div>

        <div>
          <InfoField label="کد ملی" value={formData.code_meli} />
        </div>

        {/* Row 2 */}
        <div>
          {isViewMode ? (
            <div className="mb-2">
              <label className="block text-[10px] text-gray-500 mb-0.5">
                تاریخ تولد
              </label>
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

        <div>
          {isViewMode ? (
            <InfoField label="محل تولد" value={formData.birth_place} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                محل تولد
              </label>
              <input
                type="text"
                name="birth_place"
                value={formData.birth_place || ''}
                onChange={handleInputChange}
                placeholder="مثال: تهران"
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}
        </div>

        <div>
          {isViewMode ? (
            <InfoField label="وضعیت تأهل" value={MARITAL_OPTIONS[formData.marital_status]} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                وضعیت تأهل
              </label>
              <select
                name="marital_status"
                value={formData.marital_status || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">-- انتخاب کنید --</option>
                {Object.entries(MARITAL_OPTIONS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          {isViewMode ? (
            <InfoField label="وضعیت نظام وظیفه" value={MILITARY_OPTIONS[formData.military_status]} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                وضعیت نظام وظیفه
              </label>
              <select
                name="military_status"
                value={formData.military_status || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                <option value="">-- انتخاب کنید --</option>
                {Object.entries(MILITARY_OPTIONS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Row 3 */}
        <div className="md:col-span-2">
          {isViewMode ? (
            <InfoField
              label="مدرک تحصیلی"
              value={
                EDUCATION_OPTIONS.find(
                  (opt) => opt.value === formData.education
                )?.label
              }
            />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                مدرک تحصیلی
              </label>
              <select
                name="education"
                value={formData.education || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              >
                {EDUCATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {isViewMode ? (
            <InfoField label="رشته تحصیلی" value={formData.field_of_study} />
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                رشته تحصیلی
              </label>
              <input
                type="text"
                name="field_of_study"
                value={formData.field_of_study || ''}
                onChange={handleInputChange}
                placeholder="مثال: مهندسی نرم‌افزار"
                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

EmployeeInfoSection.propTypes = {
  formData: PropTypes.object.isRequired,
  isViewMode: PropTypes.bool,
  handleInputChange: PropTypes.func,
};

export default EmployeeInfoSection;