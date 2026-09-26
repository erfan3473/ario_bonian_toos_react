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
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";
  
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

  const inputClass = `w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'}`;
  const labelClass = `block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-dashed border-gray-500/30">
        <div>
          <h3 className={`font-black text-xl flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>👔 انواع حقوق و استخدام</h3>
          <p className={`text-sm mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>مدیریت انواع استخدام و قراردادهای کاری</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-5 py-2.5 rounded-xl font-bold transition shadow-sm ${
            showForm 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {showForm ? '❌ لغو' : '➕ نوع جدید'}
        </button>
      </div>

      {updateStatus?.error && (
        <div className={`rounded-xl p-4 border font-bold flex items-center gap-2 ${isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-300 text-red-700'}`}>
          <span>❌</span> {updateStatus.error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className={`rounded-2xl p-6 border shadow-sm space-y-6 transition-colors ${isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h4 className={`font-black text-lg pb-3 border-b ${isDark ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'}`}>
            {editingId ? '✏️ ویرایش نوع استخدام' : '➕ ایجاد نوع استخدام جدید'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>کلید یکتا (Key) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder="permanent_monthly"
                required
                disabled={!!editingId}
                className={`${inputClass} disabled:opacity-50 font-mono text-left`}
                dir="ltr"
              />
            </div>

            <div>
              <label className={labelClass}>نام فارسی <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="رسمی - حقوق ماهانه"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>نوع پرداخت</label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className={inputClass}
              >
                <option value="daily">📅 روزانه</option>
                <option value="monthly">💼 ماهانه</option>
                <option value="hourly">⏱️ ساعتی</option>
                <option value="contract">📝 قراردادی</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>درصد بیمه (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.insurance_percentage}
                onChange={(e) => setFormData({ ...formData, insurance_percentage: parseFloat(e.target.value) || 0 })}
                className={`${inputClass} font-mono`}
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>درصد مالیات (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.tax_percentage}
                onChange={(e) => setFormData({ ...formData, tax_percentage: parseFloat(e.target.value) || 0 })}
                className={`${inputClass} font-mono`}
                dir="ltr"
              />
            </div>
          </div>

          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {[
              { key: 'requires_insurance', label: '🛡️ نیاز به بیمه' },
              { key: 'has_overtime', label: '⏰ اضافه‌کاری' },
              { key: 'has_leave_entitlement', label: '🏖️ حق مرخصی' },
              { key: 'has_severance_pay', label: '💰 حق سنوات' },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData[item.key]}
                  onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                  className={`w-5 h-5 rounded cursor-pointer transition-colors focus:ring-blue-500 text-blue-600 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}
                />
                <span className={`font-bold text-sm transition-colors ${isDark ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <div className={`flex justify-end gap-3 pt-5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              type="button"
              onClick={resetForm}
              disabled={updateStatus?.loading}
              className={`px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50 ${
                isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={updateStatus?.loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl font-bold transition disabled:opacity-50 shadow-md flex items-center justify-center min-w-[140px]"
            >
              {updateStatus?.loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : editingId ? '💾 ذخیره تغییرات' : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-4">
        {!employmentTypes || employmentTypes.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center border-2 border-dashed ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
            <div className="text-5xl mb-4 opacity-50">👔</div>
            <p className={`font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>هیچ نوع استخدامی تعریف نشده است</p>
          </div>
        ) : (
          employmentTypes.map((empType) => (
            <div
              key={empType.id}
              className={`rounded-2xl p-5 border transition-all hover:shadow-md ${
                isDark ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="flex-grow min-w-0">
                  <h4 className={`font-black text-lg truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{empType.description}</h4>
                  <p className={`text-xs font-mono mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{empType.key}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-700/50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {empType.payment_type === 'daily' && '📅 روزانه'}
                      {empType.payment_type === 'monthly' && '💼 ماهانه'}
                      {empType.payment_type === 'hourly' && '⏱️ ساعتی'}
                      {empType.payment_type === 'contract' && '📝 قراردادی'}
                    </span>
                    
                    {empType.requires_insurance && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDark ? 'bg-green-900/30 text-green-400 border-green-700/50' : 'bg-green-50 text-green-700 border-green-200'}`}>
                        🛡️ بیمه {empType.insurance_percentage}%
                      </span>
                    )}
                    
                    {empType.tax_percentage > 0 && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDark ? 'bg-orange-900/30 text-orange-400 border-orange-700/50' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                        💸 مالیات {empType.tax_percentage}%
                      </span>
                    )}
                    
                    {empType.has_leave_entitlement && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDark ? 'bg-purple-900/30 text-purple-400 border-purple-700/50' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                        🏖️ مرخصی
                      </span>
                    )}
                    
                    {empType.has_severance_pay && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        💰 سنوات
                      </span>
                    )}

                    {empType.has_overtime && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${isDark ? 'bg-indigo-900/30 text-indigo-400 border-indigo-700/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        ⏰ اضافه‌کاری
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleEdit(empType)}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm ${
                      isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    ✏️ ویرایش
                  </button>
                  <button
                    onClick={() => handleDelete(empType.id)}
                    className="flex-1 sm:flex-none bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm"
                  >
                    🗑️ حذف
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