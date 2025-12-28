// src/screens/admin/SchemeContractScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSchemeContracts,
  getJobClasses,
  getJobGroups,
  createSchemeContract,
  updateSchemeContract,
  recalculateSchemeContract,
  clearError,
  setSelectedContract
} from '../../../features/admin/adminSchemeSlice';
import { getContracts } from '../../../features/admin/adminSlice'; // موجود

const SchemeContractScreen = () => {
  const dispatch = useDispatch();
  const [tab, setTab] = useState('list');
  const [formData, setFormData] = useState({});
  const [editMode, setEditMode] = useState(false);

  const {
    contracts,
    jobClasses,
    jobGroups,
    loading,
    error,
    selectedContract
  } = useSelector(state => state.adminScheme);

  const { contracts: regularContracts } = useSelector(state => state.admin);

  // Load data
  useEffect(() => {
    dispatch(getJobClasses());
    dispatch(getJobGroups({ year: 1404 }));
    dispatch(getSchemeContracts());
    dispatch(getContracts());
  }, [dispatch]);

  useEffect(() => {
    if (selectedContract) {
      setFormData(selectedContract);
      setEditMode(true);
      setTab('form');
    }
  }, [selectedContract]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('wage') || name.includes('allowance') 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    
    if (editMode) {
      await dispatch(updateSchemeContract({ 
        id: formData.id, 
        data: formData 
      }));
    } else {
      await dispatch(createSchemeContract(formData));
    }
    
    setFormData({});
    setEditMode(false);
    setTab('list');
    dispatch(getSchemeContracts());
  };

  const handleRecalculate = (id) => {
    dispatch(recalculateSchemeContract(id));
  };

  const handleEdit = (contract) => {
    dispatch(setSelectedContract(contract));
  };

  if (loading && tab === 'list') return <div className="text-center py-10">در حال بارگذاری...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-xl">
        <h1 className="text-2xl font-bold text-white">
          🧾 قرارداد کار منطبق با طرح طبقه‌بندی مشاغل
          <span className="block text-blue-100 text-sm mt-1">
            ویژه شرکت‌های خدماتی، پیمانکاری و تعاونی‌های خدماتی
          </span>
        </h1>
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => setTab('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tab === 'list'
                ? 'bg-white text-blue-800 shadow-lg'
                : 'bg-blue-500/30 hover:bg-blue-500/50'
            }`}
          >
            لیست قراردادها
          </button>
          <button
            onClick={() => {
              setFormData({});
              setEditMode(false);
              setTab('form');
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              tab === 'form'
                ? 'bg-white text-blue-800 shadow-lg'
                : 'bg-green-500/30 hover:bg-green-500/50'
            }`}
          >
            + قرارداد جدید
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error.detail || error}
        </div>
      )}

      {/* List Tab */}
      {tab === 'list' && (
        <div className="grid gap-6">
          {/* Filters */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select className="p-3 bg-white/20 rounded-xl border border-white/30 focus:border-blue-400 focus:outline-none text-white placeholder-gray-300">
                <option>همه کارگران</option>
              </select>
              <select className="p-3 bg-white/20 rounded-xl border border-white/30 focus:border-blue-400 focus:outline-none text-white placeholder-gray-300">
                <option>همه پروژه‌ها</option>
              </select>
              <input
                type="date"
                className="p-3 bg-white/20 rounded-xl border border-white/30 focus:border-blue-400 focus:outline-none text-white placeholder-gray-300"
              />
            </div>
          </div>

          {/* Contracts Table */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600/80 to-blue-800/80">
                  <tr>
                    <th className="p-4 text-right text-white font-semibold">کارگر</th>
                    <th className="p-4 text-right text-white font-semibold">پروژه</th>
                    <th className="p-4 text-right text-white font-semibold">شغل</th>
                    <th className="p-4 text-right text-white font-semibold">مزد ماهانه</th>
                    <th className="p-4 text-right text-white font-semibold">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                      <td className="p-4 font-medium">{contract.employee_name}</td>
                      <td className="p-4">{contract.project_name}</td>
                      <td className="p-4">
                        <div>{contract.job_class_title}</div>
                        <div className="text-sm text-gray-300">گروه {contract.job_group_number}</div>
                      </td>
                      <td className="p-4 font-bold text-green-400">
                        {contract.total_monthly_wage_benefits?.toLocaleString()} ریال
                      </td>
                      <td className="p-4 space-x-2 space-x-reverse">
                        <button
                          onClick={() => handleEdit(contract)}
                          className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-all"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => handleRecalculate(contract.id)}
                          className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-all"
                        >
                          محاسبه خودکار
                        </button>
                        <button className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-all">
                          پرینت
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Form Tab */}
      {tab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Basic Info */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-8 rounded-3xl border-2 border-dashed border-emerald-300/50">
            <h2 className="text-xl font-bold mb-6 text-emerald-100">الف) مشخصات کارگر</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">نام خانوادگی</label>
                <input
                  name="employee_name"
                  value={formData.employee_name || ''}
                  readOnly
                  className="w-full p-3 bg-white/20 rounded-xl border border-white/30 focus:border-emerald-400 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">کد ملی</label>
                <input
                  name="employee_code_meli"
                  value={formData.employee_code_meli || ''}
                  readOnly
                  className="w-full p-3 bg-white/20 rounded-xl border border-white/30 text-white"
                />
              </div>
              {/* باقی فیلدهای مشخصات کارگر */}
            </div>
          </div>

          {/* Step 2: شغل و گروه */}
          <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 p-8 rounded-3xl border-2 border-dashed border-purple-300/50">
            <h2 className="text-xl font-bold mb-6 text-purple-100">ج) مشخصات شغل</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">کد شغل</label>
                <select
                  name="job_class"
                  value={formData.job_class || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/20 rounded-xl border border-white/30 focus:border-purple-400 text-white"
                  required
                >
                  <option value="">انتخاب شغل</option>
                  {jobClasses.map(job => (
                    <option key={job.id} value={job.id}>{job.code} - {job.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">گروه شغلی</label>
                <select
                  name="job_group"
                  value={formData.job_group || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/20 rounded-xl border border-white/30 focus:border-purple-400 text-white"
                  required
                >
                  <option value="">انتخاب گروه</option>
                  {jobGroups.map(group => (
                    <option key={group.id} value={group.id}>
                      سال {group.year} - گروه {group.group_number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: مزد مبنا */}
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 p-8 rounded-3xl border-2 border-dashed border-orange-300/50">
            <h2 className="text-xl font-bold mb-6 text-orange-100">ب) مزد مبنا (ماهانه ۳۰ روز)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">مزد گروه (شغل)</label>
                <input
                  name="job_wage_monthly"
                  type="number"
                  value={formData.job_wage_monthly || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/20 rounded-xl border border-white/30 focus:border-orange-400 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">مزد سنوات (پایه)</label>
                <input
                  name="seniority_wage_monthly"
                  type="number"
                  value={formData.seniority_wage_monthly || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/20 rounded-xl border border-white/30 focus:border-orange-400 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">تفاوت مزد مبنا</label>
                <input
                  name="base_difference_wage_monthly"
                  type="number"
                  value={formData.base_difference_wage_monthly || ''}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-white/20 rounded-xl border border-white/30 focus:border-orange-400 text-white"
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <label className="block text-sm font-medium mb-2 text-gray-200">جمع مزد مبنا</label>
                <input
                  name="base_wage_total_monthly"
                  type="number"
                  value={formData.base_wage_total_monthly || ''}
                  readOnly
                  className="w-full p-3 bg-green-500/30 text-green-100 font-bold rounded-xl border-2 border-green-400"
                />
              </div>
            </div>
          </div>

          {/* Step 4: مزایا */}
          <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 p-8 rounded-3xl border-2 border-dashed border-teal-300/50">
            <h2 className="text-xl font-bold mb-6 text-teal-100">مزایای ماهانه (بند ۲۲)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { name: 'housing_allowance', label: 'کمک هزینه مسکن' },
                { name: 'food_allowance', label: 'کمک هزینه اقلام مصرفی' },
                { name: 'child_allowance', label: 'حق اولاد' },
                { name: 'marriage_allowance', label: 'حق تأهل' },
                { name: 'shift_allowance', label: 'نوبت کاری' },
                { name: 'other_allowances', label: 'سایر مزایا' }
              ].map(({ name, label }) => (
                <div key={name}>
                  <label className="block text-xs font-medium mb-1 text-gray-200">{label}</label>
                  <input
                    name={name}
                    type="number"
                    value={formData[name] || ''}
                    onChange={handleInputChange}
                    className="w-full p-2 text-sm bg-white/10 rounded-lg border border-white/20 focus:border-teal-400 text-white"
                  />
                </div>
              ))}
              <div className="col-span-full md:col-span-1">
                <label className="block text-sm font-medium mb-2 text-gray-200">جمع کل مزایا</label>
                <input
                  name="total_monthly_wage_benefits"
                  type="number"
                  value={formData.total_monthly_wage_benefits || ''}
                  readOnly
                  className="w-full p-3 bg-teal-500/30 text-teal-100 font-bold rounded-xl border-2 border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 space-x-reverse pt-8 border-t border-white/20">
            <button
              type="button"
              onClick={() => handleRecalculate(formData.id)}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 shadow-xl transition-all"
            >
              محاسبه خودکار ✅
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-indigo-800 shadow-xl transition-all"
            >
              {editMode ? 'بروزرسانی' : 'ایجاد'} قرارداد
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('list');
                dispatch(setSelectedContract(null));
                setFormData({});
              }}
              className="px-8 py-3 bg-gray-600 text-white font-medium rounded-2xl hover:bg-gray-700 transition-all"
            >
              انصراف
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SchemeContractScreen;
