// src/components/admin/tabs/ContractsTab.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createContract, updateContract } from '../../../features/admin/adminSlice';
import { fetchProjects } from '../../../features/projects/projectSlice';

const ContractsTab = ({ user }) => {
  const dispatch = useDispatch();
  const { employmentTypes } = useSelector((state) => state.admin);
  const { list: projects } = useSelector((state) => state.projects);
  const { loading } = useSelector((state) => state.admin.updateStatus);
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ✅ دریافت قراردادهای این کاربر
  const contracts = user?.employee_details?.contracts || [];

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const [formData, setFormData] = useState({
    project_id: '',
    employment_type_id: '',
    start_date: '',
    end_date: '',
    daily_wage: 0,
    monthly_salary: 0,
    is_active: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      employee: user.employee_details?.id,
      project: formData.project_id,         // ✅ اصلاح
      employment_type: formData.employment_type_id, // ✅ اصلاح
      start_date: formData.start_date,
      end_date: formData.end_date,
      daily_wage: formData.daily_wage,
      monthly_salary: formData.monthly_salary,
      is_active: formData.is_active,
    };

    if (editingId) {
      dispatch(updateContract({ contractId: editingId, contractData: payload }));
    } else {
      dispatch(createContract(payload));
    }

    // Reset
    setFormData({
      project_id: '',
      employment_type_id: '',
      start_date: '',
      end_date: '',
      daily_wage: 0,
      monthly_salary: 0,
      is_active: true,
    });
    setShowNewForm(false);
    setEditingId(null);
  };

  const handleEdit = (contract) => {
    setFormData({
      project_id: contract.project?.id || '',           // ✅ اصلاح
      employment_type_id: contract.employment_type?.id || '', // ✅ اصلاح
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      daily_wage: contract.daily_wage || 0,
      monthly_salary: contract.monthly_salary || 0,
      is_active: contract.is_active ?? true,
    });
    setEditingId(contract.id);
    setShowNewForm(true);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* دکمه افزودن قرارداد جدید */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-xl">📝 قراردادهای کاری</h3>
        <button
          onClick={() => {
            setShowNewForm(!showNewForm);
            setEditingId(null);
            setFormData({
              project_id: '',
              employment_type_id: '',
              start_date: '',
              end_date: '',
              daily_wage: 0,
              monthly_salary: 0,
              is_active: true,
            });
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
        >
          {showNewForm ? '❌ لغو' : '➕ قرارداد جدید'}
        </button>
      </div>

      {/* فرم افزودن/ویرایش */}
      {showNewForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
          <h4 className="text-white font-bold mb-4">
            {editingId ? '✏️ ویرایش قرارداد' : '➕ قرارداد جدید'}
          </h4>

          {/* پروژه */}
          <div>
            <label className="block text-gray-300 mb-2 font-bold">پروژه</label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- انتخاب پروژه --</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* نوع استخدام */}
          <div>
            <label className="block text-gray-300 mb-2 font-bold">نوع استخدام</label>
            <select
              name="employment_type_id"
              value={formData.employment_type_id}
              onChange={handleChange}
              required
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- انتخاب نوع --</option>
              {employmentTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* تاریخ شروع و پایان */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-bold">تاریخ شروع</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-bold">تاریخ پایان</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* دستمزد */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2 font-bold">دستمزد روزانه (تومان)</label>
              <input
                type="number"
                name="daily_wage"
                value={formData.daily_wage}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 font-bold">حقوق ماهانه (تومان)</label>
              <input
                type="number"
                name="monthly_salary"
                value={formData.monthly_salary}
                onChange={handleChange}
                min="0"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* فعال */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-2 focus:ring-green-500"
            />
            <span className="text-gray-300">✅ قرارداد فعال</span>
          </label>

          {/* دکمه‌ها */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false);
                setEditingId(null);
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition"
            >
              {loading ? '⏳ در حال ذخیره...' : editingId ? '✏️ آپدیت' : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* لیست قراردادها */}
      <div className="space-y-4">
        {contracts.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
            <div className="text-6xl mb-3">📋</div>
            <p className="text-gray-400">هنوز قراردادی ثبت نشده است</p>
          </div>
        ) : (
          contracts.map((contract) => (
            <div
              key={contract.id}
              className={`bg-gray-800 rounded-xl p-6 border-2 transition ${
                contract.is_active ? 'border-green-600' : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-white font-bold text-lg">
                    {contract.project?.name || 'نامشخص'}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {contract.employment_type?.description || 'نامشخص'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {contract.is_active && (
                    <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-700">
                      ✅ فعال
                    </span>
                  )}
                  <button
                    onClick={() => handleEdit(contract)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition"
                  >
                    ✏️
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">تاریخ شروع:</span>
                  <span className="text-white mr-2">{contract.start_date || '---'}</span>
                </div>
                <div>
                  <span className="text-gray-400">تاریخ پایان:</span>
                  <span className="text-white mr-2">{contract.end_date || '---'}</span>
                </div>
                {contract.daily_wage > 0 && (
                  <div>
                    <span className="text-gray-400">دستمزد روزانه:</span>
                    <span className="text-green-400 font-bold mr-2">
                      {Number(contract.daily_wage).toLocaleString('fa-IR')} ت
                    </span>
                  </div>
                )}
                {contract.monthly_salary > 0 && (
                  <div>
                    <span className="text-gray-400">حقوق ماهانه:</span>
                    <span className="text-green-400 font-bold mr-2">
                      {Number(contract.monthly_salary).toLocaleString('fa-IR')} ت
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContractsTab;
