// src/components/admin/tabs/SchemeContractFormTab.jsx
import React, { useState, useCallback } from 'react';
import { 
  createSchemeContract, updateSchemeContract, recalculateSchemeContract, 
  clearError, setSelectedContract 
} from '../../../features/admin/adminSchemeSlice';
import { formatCurrency } from '../../../utils/formatters';

const SchemeContractFormTab = ({ 
  contract, regularContracts, jobClasses, jobGroups, projects, 
  isNew, loading, dispatch, navigate 
}) => {
  const [formData, setFormData] = useState({});

  // مقداردهی اولیه
  React.useEffect(() => {
    if (!isNew && contract.id) {
      setFormData(contract);
    } else {
      setFormData({});
    }
  }, [contract, isNew]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.match(/^(wage|salary|allowance)/) ? parseInt(value.replace(/,/g, '')) || 0 : value
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    
    try {
      if (!isNew) {
        await dispatch(updateSchemeContract({ id: contract.id, data: formData })).unwrap();
      } else {
        await dispatch(createSchemeContract(formData)).unwrap();
      }
      navigate('/admin/scheme-contracts');
    } catch (error) {
      console.error('خطا:', error);
    }
  };

  const handleRecalculate = () => {
    if (contract.id) {
      dispatch(recalculateSchemeContract(contract.id));
    }
  };

  const calculateTotalBase = () => 
    (formData.job_wage_monthly || 0) + (formData.seniority_wage_monthly || 0) + (formData.base_difference_wage_monthly || 0);

  const calculateTotalBenefits = () => 
    calculateTotalBase() + (formData.housing_allowance || 0) + (formData.food_allowance || 0) +
    (formData.child_allowance || 0) + (formData.marriage_allowance || 0) + 
    (formData.shift_allowance || 0) + (formData.other_allowances || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* مشخصات کارگر */}
      <div className="bg-gradient-to-r from-amber-500/10 p-8 rounded-3xl border-4 border-amber-200/30">
        <h2 className="text-3xl font-bold text-amber-100 mb-8 text-center">الف) مشخصات کارگر</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-200">انتخاب قرارداد</label>
            <select 
              name="contract" 
              value={formData.contract || ''} 
              onChange={handleInputChange}
              className="w-full p-4 bg-white/20 rounded-2xl border-2 border-amber-400 text-white font-bold"
              required
            >
              <option value="">انتخاب قرارداد...</option>
              {regularContracts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.employee_name} - {c.project_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-200">نام</label>
            <input name="employee_name" value={formData.employee_name || ''} readOnly className="w-full p-4 bg-amber-500/30 rounded-2xl border-2 border-amber-400 text-white font-mono" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-200">کد ملی</label>
            <input name="employee_code_meli" value={formData.employee_code_meli || ''} readOnly className="w-full p-4 bg-amber-500/30 rounded-2xl border-2 border-amber-400 text-white font-mono" />
          </div>
        </div>
      </div>

      {/* باقی فرم... (کوتاه شده برای نمایش) */}
      <div className="flex flex-col sm:flex-row gap-4 pt-12">
        <button 
          type="button" 
          onClick={handleRecalculate}
          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-4 px-8 rounded-3xl text-xl font-bold shadow-2xl transition-all"
        >
          🔄 محاسبه خودکار
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 px-8 rounded-3xl text-xl font-bold shadow-2xl transition-all disabled:opacity-50"
        >
          {loading ? 'در حال ذخیره...' : (isNew ? 'ایجاد' : 'بروزرسانی')} قرارداد
        </button>
        <button 
          type="button" 
          onClick={() => navigate('/admin/scheme-contracts')}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-4 px-8 rounded-3xl text-xl font-bold transition-all"
        >
          انصراف
        </button>
      </div>
    </form>
  );
};

export default SchemeContractFormTab;
