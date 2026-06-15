import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  createEmploymentType, 
  updateEmploymentType,
  deleteEmploymentType
} from '../../../features/admin/dropdownsSlice';

const EmploymentTypesSettings = () => {
  const dispatch = useDispatch();
  
  const { employmentTypes, updateStatus } = useSelector((state) => state.admin.dropdowns);
  
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
    // وقتی عملیات موفق بود فقط فرم رو می‌بندیم
    if (updateStatus?.success) {
      resetForm();
    }
  }, [updateStatus?.success]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      dispatch(updateEmploymentType({ id: editingId, data: formData }));
    } else {
      dispatch(createEmploymentType(formData));
    }
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
    setFormData({
      key: empType.key,
      description: empType.description,
      requires_insurance: empType.requires_insurance || false,
      insurance_percentage: empType.insurance_percentage || 0,
      tax_percentage: empType.tax_percentage || 0,
      payment_type: empType.payment_type || 'daily',
      has_overtime: empType.has_overtime !== undefined ? empType.has_overtime : true,
      has_leave_entitlement: empType.has_leave_entitlement || false,
      has_severance_pay: empType.has_severance_pay || false,
    });
    setEditingId(empType.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('آیا مطمئن هستید؟ این نوع استخدام غیرفعال خواهد شد.')) {
      dispatch(deleteEmploymentType(id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-xl">👔 انواع حقوق</h3>
          <p className="text-gray-400 text-sm mt-1">
            مدیریت انواع استخدام و قراردادهای کاری
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-bold"
        >
          {showForm ? '❌ لغو' : '➕ نوع جدید'}
        </button>
      </div>

      {/* Error Display */}
      {updateStatus?.error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <p className="text-red-400">❌ {updateStatus.error}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-4">
          <h4 className="text-white font-bold text-lg mb-4">
            {editingId ? '✏️ ویرایش نوع استخدام' : '➕ ایجاد نوع استخدام جدید'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-bold">کلید (Key) *</label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="permanent_monthly"
                required
                disabled={!!editingId}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">نام فارسی *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="رسمی - حقوق ماهانه"
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">نوع پرداخت</label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">📅 روزانه</option>
                <option value="monthly">💼 ماهانه</option>
                <option value="hourly">⏱️ ساعتی</option>
                <option value="contract">📝 قراردادی</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2 font-bold">درصد بیمه (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.insurance_percentage}
                onChange={(e) => setFormData({ ...formData, insurance_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-300 mb-2 font-bold">درصد مالیات (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tax_percentage}
                onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
            {[
              { key: 'requires_insurance', label: '🛡️ نیاز به بیمه' },
              { key: 'has_overtime', label: '⏰ اضافه‌کاری' },
              { key: 'has_leave_entitlement', label: '🏖️ حق مرخصی' },
              { key: 'has_severance_pay', label: '💰 حق سنوات' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData[item.key]}
                  onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                  className="w-5 h-5 rounded cursor-pointer"
                />
                <span className="text-gray-300 group-hover:text-white transition">
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={resetForm}
              disabled={updateStatus?.loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition disabled:opacity-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={updateStatus?.loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
            >
              {updateStatus?.loading ? '⏳ در حال ذخیره...' : editingId ? '💾 ذخیره تغییرات' : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-3">
        {!employmentTypes || employmentTypes.length === 0 ? (
          <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-700">
            <div className="text-5xl mb-3">👔</div>
            <p className="text-gray-400">هیچ نوع استخدامی تعریف نشده است</p>
          </div>
        ) : (
          employmentTypes.map((empType) => (
            <div
              key={empType.id}
              className="bg-gray-900 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <h4 className="text-white font-bold text-lg">{empType.description}</h4>
                  <p className="text-gray-400 text-sm font-mono mt-1">{empType.key}</p>
                  
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

                    {empType.has_overtime && (
                      <span className="bg-indigo-900/30 text-indigo-400 px-2 py-1 rounded text-xs border border-indigo-700">
                        ⏰ اضافه‌کاری
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(empType)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(empType.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmploymentTypesSettings;
