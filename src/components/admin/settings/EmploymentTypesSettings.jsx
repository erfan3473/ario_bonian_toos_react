// src/components/admin/settings/EmploymentTypesSettings.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchEmploymentTypes, 
  createEmploymentType, 
  updateEmploymentType 
} from '../../../features/admin/adminSlice';

const EmploymentTypesSettings = () => {
  const dispatch = useDispatch();
  const { employmentTypes, loading } = useSelector((state) => state.admin);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    key: '',
    description: '',
    requires_insurance: false,
    insurance_percentage: 0,
    tax_percentage: 0,
    payment_type: 'daily',
    has_overtime: true,
    has_leave_entitlement: false,
    has_severance_pay: false,
  });

  useEffect(() => {
    dispatch(fetchEmploymentTypes());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      dispatch(updateEmploymentType({ id: editingId, data: formData }));
    } else {
      dispatch(createEmploymentType(formData));
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      key: '',
      description: '',
      requires_insurance: false,
      insurance_percentage: 0,
      tax_percentage: 0,
      payment_type: 'daily',
      has_overtime: true,
      has_leave_entitlement: false,
      has_severance_pay: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (empType) => {
    setFormData(empType);
    setEditingId(empType.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-xl">👔 انواع استخدام</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showForm ? '❌ لغو' : '➕ نوع جدید'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">کلید (Key)</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="permanent_monthly"
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">نام فارسی</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="رسمی - حقوق ماهانه"
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600"
              />
            </div>

            {/* Payment Type */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">نوع پرداخت</label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600"
              >
                <option value="daily">📅 روزانه</option>
                <option value="monthly">💼 ماهانه</option>
                <option value="hourly">⏱️ ساعتی</option>
                <option value="contract">📝 قراردادی</option>
              </select>
            </div>

            {/* Insurance */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">درصد بیمه (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.insurance_percentage}
                onChange={(e) => setFormData({ ...formData, insurance_percentage: parseFloat(e.target.value) })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600"
              />
            </div>

            {/* Tax */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">درصد مالیات (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.tax_percentage}
                onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
            {[
              { key: 'requires_insurance', label: '🛡️ نیاز به بیمه' },
              { key: 'has_overtime', label: '⏰ اضافه‌کاری' },
              { key: 'has_leave_entitlement', label: '🏖️ حق مرخصی' },
              { key: 'has_severance_pay', label: '💰 حق سنوات' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData[item.key]}
                  onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-300">{item.label}</span>
              </label>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold"
            >
              {editingId ? '💾 ذخیره' : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {employmentTypes.map((empType) => (
          <div
            key={empType.id}
            className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-grow">
                <h4 className="text-white font-bold text-lg">{empType.description}</h4>
                <p className="text-gray-400 text-sm font-mono">{empType.key}</p>
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded text-xs border border-blue-700">
                    {empType.payment_type === 'daily' && '📅 روزانه'}
                    {empType.payment_type === 'monthly' && '💼 ماهانه'}
                    {empType.payment_type === 'hourly' && '⏱️ ساعتی'}
                    {empType.payment_type === 'contract' && '📝 قراردادی'}
                  </span>
                  
                  {empType.requires_insurance && (
                    <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs border border-green-700">
                      🛡️ بیمه {empType.insurance_percentage}%
                    </span>
                  )}
                  
                  {empType.tax_percentage > 0 && (
                    <span className="bg-orange-900/30 text-orange-400 px-2 py-1 rounded text-xs border border-orange-700">
                      💸 مالیات {empType.tax_percentage}%
                    </span>
                  )}
                  
                  {empType.has_leave_entitlement && (
                    <span className="bg-purple-900/30 text-purple-400 px-2 py-1 rounded text-xs border border-purple-700">
                      🏖️ مرخصی
                    </span>
                  )}
                  
                  {empType.has_severance_pay && (
                    <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs border border-yellow-700">
                      💰 سنوات
                    </span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleEdit(empType)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm"
              >
                ✏️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmploymentTypesSettings;
