// src/components/admin/tabs/ContractsTab.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createContract,
  updateContract,
  deleteContract,
  fetchEmploymentTypes,  // ✅ تغییر: به جای fetchDropdowns
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';
import { fetchProjects } from '../../../features/projects/projectSlice';

const ContractsTab = ({ user }) => {
  const dispatch = useDispatch();
  
  // ✅ Redux State
  const { employmentTypes } = useSelector((state) => state.admin);
  const projects = useSelector((state) => state.projects.list);
  const { loading, success, error } = useSelector((state) => state.admin.updateStatus);

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const employee = user?.employee_details;
  const contracts = employee?.contracts || [];

  const [formData, setFormData] = useState({
    project_id: '',
    employment_type_id: '',
    start_date: '',
    end_date: '',
    daily_wage: '',
    monthly_salary: '',
    is_active: true,
  });

  // ✅ بارگذاری داده‌ها - تغییر اینجا
  useEffect(() => {
    dispatch(fetchEmploymentTypes()); // ✅ به جای fetchDropdowns
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      resetForm();
      dispatch(resetUpdateStatus());
    }
  }, [success, dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!employee?.id) {
      alert('❌ این کاربر پروفایل کارمندی ندارد!');
      return;
    }

    // Validation
    if (!formData.project_id) {
      alert('❌ انتخاب پروژه الزامی است');
      return;
    }
    if (!formData.employment_type_id) {
      alert('❌ انتخاب نوع استخدام الزامی است');
      return;
    }
    if (!formData.start_date) {
      alert('❌ تاریخ شروع الزامی است');
      return;
    }

    // Payload
    const payload = {
      employee: employee.id,
      project: Number(formData.project_id),
      employment_type: Number(formData.employment_type_id),
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      daily_wage: formData.daily_wage ? Number(formData.daily_wage) : 0,
      monthly_salary: formData.monthly_salary ? Number(formData.monthly_salary) : 0,
      is_active: formData.is_active,
      contract_type: 'EMPLOYMENT',
    };

    if (editingId) {
      // ✅ تغییر نام parameter
      dispatch(updateContract({ contractId: editingId, data: payload }));
    } else {
      dispatch(createContract(payload));
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      employment_type_id: '',
      start_date: '',
      end_date: '',
      daily_wage: '',
      monthly_salary: '',
      is_active: true,
    });
    setShowNewForm(false);
    setEditingId(null);
  };

  const handleEdit = (contract) => {
    setFormData({
      project_id: contract.project_id || '',
      employment_type_id: contract.employment_type_id || '',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      daily_wage: contract.daily_wage || '',
      monthly_salary: contract.monthly_salary || '',
      is_active: contract.is_active ?? true,
    });
    setEditingId(contract.id);
    setShowNewForm(true);
  };

  const handleDelete = (contractId) => {
    if (deleteConfirm === contractId) {
      dispatch(deleteContract(contractId));
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(contractId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;

    if (months > 0) {
      return `${months} ماه ${remainingDays > 0 ? `و ${remainingDays} روز` : ''}`;
    }
    return `${days} روز`;
  };

  // ✅ بررسی user
  if (!user) {
    return (
      <div className="text-center text-gray-500 py-10">
        لطفاً یک کاربر انتخاب کنید
      </div>
    );
  }

  // ✅ بررسی employee
  if (!employee) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-yellow-400 text-xl mb-2">این کاربر پروفایل کارمندی ندارد</p>
        <p className="text-gray-400">
          ابتدا باید اطلاعات سازمانی را تکمیل کنید
        </p>
      </div>
    );
  }

  // ✅ بررسی بارگذاری داده‌ها
  const isLoadingData = !projects || !employmentTypes;
  
  if (isLoadingData) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">در حال بارگذاری داده‌ها...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-xl">📝 قراردادها</h3>
        <button
          onClick={() => {
            if (showNewForm) {
              resetForm();
            } else {
              setShowNewForm(true);
            }
          }}
          className={`px-4 py-2 rounded-lg font-bold transition ${
            showNewForm
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {showNewForm ? '❌ انصراف' : '➕ قرارداد جدید'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Form */}
      {showNewForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* پروژه */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                پروژه <span className="text-red-500">*</span>
              </label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- انتخاب کنید --</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* نوع استخدام */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                نوع استخدام <span className="text-red-500">*</span>
              </label>
              <select
                name="employment_type_id"
                value={formData.employment_type_id}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- انتخاب کنید --</option>
                {employmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* تاریخ شروع */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                تاریخ شروع <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* تاریخ پایان */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                تاریخ پایان
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-gray-500 text-xs mt-1">
                خالی بگذارید اگر تعیین نشده
              </p>
            </div>

            {/* دستمزد روزانه */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                دستمزد روزانه (تومان)
              </label>
              <input
                type="number"
                name="daily_wage"
                value={formData.daily_wage}
                onChange={handleChange}
                min="0"
                step="10000"
                placeholder="1,000,000"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            {/* حقوق ماهانه */}
            <div>
              <label className="block text-gray-300 mb-2 font-bold">
                حقوق ماهانه (تومان)
              </label>
              <input
                type="number"
                name="monthly_salary"
                value={formData.monthly_salary}
                onChange={handleChange}
                min="0"
                step="100000"
                placeholder="50,000,000"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* وضعیت فعال */}
          <div className="pt-4 border-t border-gray-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-300">✅ قرارداد فعال است</span>
            </label>
          </div>

          {/* دکمه‌ها */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-bold transition"
            >
              {loading ? '⏳ در حال ذخیره...' : editingId ? '💾 ذخیره' : '➕ ایجاد'}
            </button>
          </div>
        </form>
      )}

      {/* لیست قراردادها */}
      {contracts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-400 text-xl">هنوز قراردادی ثبت نشده</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className={`bg-gray-800 rounded-xl p-6 border transition-all ${
                contract.is_active
                  ? 'border-green-700 hover:border-green-600'
                  : 'border-gray-700 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-grow">
                  <h4 className="text-white font-bold text-lg mb-1">
                    📍 {contract.project_name || 'نامشخص'}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {contract.employment_type_description || 'نوع استخدام نامشخص'}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    contract.is_active
                      ? 'bg-green-900/30 text-green-400 border border-green-700'
                      : 'bg-gray-700 text-gray-400 border border-gray-600'
                  }`}
                >
                  {contract.is_active ? '✅ فعال' : '❌ غیرفعال'}
                </span>
              </div>

              {/* تاریخ‌ها */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">تاریخ شروع</div>
                  <div className="text-white font-mono">
                    {new Date(contract.start_date).toLocaleDateString('fa-IR')}
                  </div>
                </div>

                {contract.end_date && (
                  <div className="bg-gray-900/50 rounded-lg p-3">
                    <div className="text-gray-400 text-xs mb-1">تاریخ پایان</div>
                    <div className="text-white font-mono">
                      {new Date(contract.end_date).toLocaleDateString('fa-IR')}
                    </div>
                  </div>
                )}

                <div className="bg-gray-900/50 rounded-lg p-3">
                  <div className="text-gray-400 text-xs mb-1">مدت همکاری</div>
                  <div className="text-white font-bold">
                    {calculateDuration(contract.start_date, contract.end_date)}
                  </div>
                </div>
              </div>

              {/* دستمزد */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {contract.daily_wage > 0 && (
                  <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">دستمزد روزانه</div>
                    <div className="text-green-400 font-bold text-2xl font-mono">
                      {Number(contract.daily_wage).toLocaleString('fa-IR')}
                      <span className="text-sm mr-2">تومان</span>
                    </div>
                  </div>
                )}

                {contract.monthly_salary > 0 && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">حقوق ماهانه</div>
                    <div className="text-blue-400 font-bold text-2xl font-mono">
                      {Number(contract.monthly_salary).toLocaleString('fa-IR')}
                      <span className="text-sm mr-2">تومان</span>
                    </div>
                  </div>
                )}
              </div>

              {/* دکمه‌ها */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
                <button
                  onClick={() => handleEdit(contract)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  ✏️ ویرایش
                </button>
                <button
                  onClick={() => handleDelete(contract.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${
                    deleteConfirm === contract.id
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  {deleteConfirm === contract.id ? '⚠️ تأیید حذف' : '🗑️ حذف'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContractsTab;
