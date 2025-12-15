// src/components/admin/tabs/ContractsTab.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createContract,
  updateContract,
  deleteContract,
  fetchEmploymentTypes,
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';
import { fetchProjects } from '../../../features/projects/projectSlice';

const ContractsTab = ({ user }) => {
  const dispatch = useDispatch();
  
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
    contract_type: 'EMPLOYMENT', // پیش‌فرض: رسمی
    start_date: '',
    end_date: '',
    daily_wage: '',
    monthly_salary: '',
    contract_value: '',
    retention_percent: '10',
    insurance_deposit_percent: '5',
    tax_withholding_percent: '3',
    payment_terms: '',
    insurance_clearance_received: false,
    insurance_clearance_date: '',
    is_active: true,
  });

  // ✅ فقط 2 نوع قرارداد
  const contractTypes = [
    { 
      value: 'EMPLOYMENT', 
      label: '🏛️ استخدامی رسمی', 
      color: 'blue',
      description: 'با بیمه و مزایای کامل',
      hasInsurance: true
    },
    { 
      value: 'SUBCONTRACT', 
      label: '🔨 پیمانکاری/غیررسمی', 
      color: 'purple',
      description: 'بدون بیمه',
      hasInsurance: false
    },
  ];

  // ✅ یافتن نوع قرارداد انتخاب شده
  const selectedContractType = contractTypes.find(ct => ct.value === formData.contract_type);

  // ✅ همه EmploymentTypes نمایش داده میشن (فیلتر نداریم)
  const selectedEmploymentType = employmentTypes?.find(
    (et) => et.id === Number(formData.employment_type_id)
  );

  // ✅ نمایش فیلدها بر اساس payment_type
  const showDailyWage = selectedEmploymentType?.payment_type === 'daily' || selectedEmploymentType?.payment_type === 'hourly';
  const showMonthlySalary = selectedEmploymentType?.payment_type === 'monthly';
  const showContractValue = selectedEmploymentType?.payment_type === 'contract';

  useEffect(() => {
    dispatch(fetchEmploymentTypes());
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

    if (!formData.project_id || !formData.employment_type_id || !formData.start_date) {
      alert('❌ پر کردن فیلدهای ضروری الزامی است');
      return;
    }

    // ✅ Validation بیمه (فقط برای EMPLOYMENT)
    if (formData.contract_type === 'EMPLOYMENT' && formData.insurance_clearance_received && !formData.insurance_clearance_date) {
      alert('❌ تاریخ مفاصا حساب بیمه الزامی است');
      return;
    }

    // ✅ Validation دستمزد
    if (showDailyWage && !formData.daily_wage) {
      alert('❌ دستمزد روزانه الزامی است');
      return;
    }
    if (showMonthlySalary && !formData.monthly_salary) {
      alert('❌ حقوق ماهانه الزامی است');
      return;
    }
    if (showContractValue && !formData.contract_value) {
      alert('❌ مبلغ قرارداد الزامی است');
      return;
    }

    const payload = {
      employee: employee.id,
      project: Number(formData.project_id),
      employment_type: Number(formData.employment_type_id),
      contract_type: formData.contract_type,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      daily_wage: formData.daily_wage ? Number(formData.daily_wage) : 0,
      monthly_salary: formData.monthly_salary ? Number(formData.monthly_salary) : 0,
      contract_value: formData.contract_value ? Number(formData.contract_value) : 0,
      retention_percent: formData.retention_percent ? Number(formData.retention_percent) : 10,
      insurance_deposit_percent: formData.insurance_deposit_percent ? Number(formData.insurance_deposit_percent) : 5,
      tax_withholding_percent: formData.tax_withholding_percent ? Number(formData.tax_withholding_percent) : 3,
      payment_terms: formData.payment_terms || '',
      insurance_clearance_received: formData.insurance_clearance_received,
      insurance_clearance_date: formData.insurance_clearance_received ? formData.insurance_clearance_date : null,
      is_active: formData.is_active,
    };

    if (editingId) {
      dispatch(updateContract({ contractId: editingId, data: payload }));
    } else {
      dispatch(createContract(payload));
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: '',
      employment_type_id: '',
      contract_type: 'EMPLOYMENT',
      start_date: '',
      end_date: '',
      daily_wage: '',
      monthly_salary: '',
      contract_value: '',
      retention_percent: '10',
      insurance_deposit_percent: '5',
      tax_withholding_percent: '3',
      payment_terms: '',
      insurance_clearance_received: false,
      insurance_clearance_date: '',
      is_active: true,
    });
    setShowNewForm(false);
    setEditingId(null);
  };

  const handleEdit = (contract) => {
    setFormData({
      project_id: contract.project_id || '',
      employment_type_id: contract.employment_type_id || '',
      contract_type: contract.contract_type || 'EMPLOYMENT',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      daily_wage: contract.daily_wage || '',
      monthly_salary: contract.monthly_salary || '',
      contract_value: contract.contract_value || '',
      retention_percent: contract.retention_percent || '10',
      insurance_deposit_percent: contract.insurance_deposit_percent || '5',
      tax_withholding_percent: contract.tax_withholding_percent || '3',
      payment_terms: contract.payment_terms || '',
      insurance_clearance_received: contract.insurance_clearance_received || false,
      insurance_clearance_date: contract.insurance_clearance_date || '',
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
    return months > 0 ? `${months} ماه ${remainingDays > 0 ? `و ${remainingDays} روز` : ''}` : `${days} روز`;
  };

  const getContractTypeColor = (type) => {
    const found = contractTypes.find(t => t.value === type);
    return found?.color || 'gray';
  };

  if (!user) {
    return <div className="text-center text-gray-500 py-10">لطفاً یک کاربر انتخاب کنید</div>;
  }

  if (!employee) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-yellow-400 text-xl mb-2">این کاربر پروفایل کارمندی ندارد</p>
        <p className="text-gray-400">ابتدا باید اطلاعات سازمانی را تکمیل کنید</p>
      </div>
    );
  }

  if (!projects || !employmentTypes) {
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

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* Form */}
      {showNewForm && (
        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 border border-gray-700 space-y-6">
          
          {/* ═══════════════════════════════════════════ */}
          {/* بخش 1: نوع قرارداد (رسمی/غیررسمی) */}
          {/* ═══════════════════════════════════════════ */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-white font-bold text-lg mb-4">🎯 نوع قرارداد</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contractTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contract_type: type.value }))}
                  className={`p-6 rounded-xl font-bold border-2 transition-all text-right ${
                    formData.contract_type === type.value
                      ? `bg-${type.color}-600 border-${type.color}-400 text-white scale-105 shadow-xl`
                      : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-750'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.label}</div>
                  <div className="text-sm opacity-90">{type.description}</div>
                  <div className="mt-3 pt-3 border-t border-current/20 text-xs">
                    {type.hasInsurance ? '✅ شامل بیمه و مزایا' : '❌ بدون بیمه'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* بخش 2: اطلاعات پایه */}
          {/* ═══════════════════════════════════════════ */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-white font-bold text-lg mb-4">📌 اطلاعات پایه</h4>
            
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
                  {employmentTypes && employmentTypes.length > 0 ? (
                    employmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.description}
                        {type.payment_type === 'daily' && ' (روزمزد)'}
                        {type.payment_type === 'monthly' && ' (ماهانه)'}
                        {type.payment_type === 'contract' && ' (پیمانکاری)'}
                        {type.payment_type === 'hourly' && ' (ساعتی)'}
                      </option>
                    ))
                  ) : (
                    <option disabled>در حال بارگذاری...</option>
                  )}
                </select>
                
                {/* راهنما */}
                {selectedEmploymentType && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-600">
                    <p className="text-xs text-gray-400">
                      📊 نوع پرداخت: <span className="text-blue-400 font-bold">
                        {selectedEmploymentType.payment_type === 'daily' ? 'روزمزد' :
                         selectedEmploymentType.payment_type === 'monthly' ? 'ماهانه' :
                         selectedEmploymentType.payment_type === 'contract' ? 'پیمانکاری' : 'ساعتی'}
                      </span>
                    </p>
                    {selectedEmploymentType.requires_insurance && (
                      <p className="text-xs text-green-400 mt-1">✓ این نوع استخدام دارای بیمه است</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* بخش 3: تاریخ‌ها */}
          {/* ═══════════════════════════════════════════ */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-white font-bold text-lg mb-4">📅 بازه زمانی</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-gray-300 mb-2 font-bold">تاریخ پایان</label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-gray-500 text-xs mt-1">خالی بگذارید اگر تعیین نشده</p>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* بخش 4: دستمزد (بر اساس payment_type) */}
          {/* ═══════════════════════════════════════════ */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-white font-bold text-lg mb-4">💰 اطلاعات مالی</h4>
            
            {!selectedEmploymentType ? (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 text-center">
                <p className="text-yellow-400">ابتدا نوع استخدام را انتخاب کنید</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* دستمزد روزانه */}
                {showDailyWage && (
                  <div>
                    <label className="block text-gray-300 mb-2 font-bold">
                      دستمزد روزانه (تومان) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="daily_wage"
                      value={formData.daily_wage}
                      onChange={handleChange}
                      required
                      min="0"
                      step="10000"
                      placeholder="1,000,000"
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono text-xl"
                    />
                  </div>
                )}

                {/* حقوق ماهانه */}
                {showMonthlySalary && (
                  <div>
                    <label className="block text-gray-300 mb-2 font-bold">
                      حقوق ماهانه (تومان) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="monthly_salary"
                      value={formData.monthly_salary}
                      onChange={handleChange}
                      required
                      min="0"
                      step="100000"
                      placeholder="50,000,000"
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xl"
                    />
                  </div>
                )}

                {/* مبلغ قرارداد */}
                {showContractValue && (
                  <div>
                    <label className="block text-gray-300 mb-2 font-bold">
                      مبلغ قرارداد (تومان) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="contract_value"
                      value={formData.contract_value}
                      onChange={handleChange}
                      required
                      min="0"
                      step="1000000"
                      placeholder="500,000,000"
                      className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-xl"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* بخش 5: پیمانکاری (فقط برای contract) */}
          {/* ═══════════════════════════════════════════ */}
          {showContractValue && (
            <div className="border-b border-gray-700 pb-6 bg-purple-900/10 p-4 rounded-lg">
              <h4 className="text-white font-bold text-lg mb-4">🔨 جزئیات پیمانکاری</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2 font-bold">حسن انجام کار (%)</label>
                  <input
                    type="number"
                    name="retention_percent"
                    value={formData.retention_percent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold">سپرده بیمه (%)</label>
                  <input
                    type="number"
                    name="insurance_deposit_percent"
                    value={formData.insurance_deposit_percent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold">کسر مالیات (%)</label>
                  <input
                    type="number"
                    name="tax_withholding_percent"
                    value={formData.tax_withholding_percent}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-gray-300 mb-2 font-bold">شرایط پرداخت</label>
                  <textarea
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    rows="3"
                    placeholder="مثال: پرداخت 70% پیش، 30% پس از تحویل"
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* بخش 6: بیمه (فقط برای EMPLOYMENT) */}
          {/* ═══════════════════════════════════════════ */}
          {formData.contract_type === 'EMPLOYMENT' && (
            <div className="border-b border-gray-700 pb-6">
              <h4 className="text-white font-bold text-lg mb-4">🏥 مفاصا حساب بیمه</h4>
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer bg-gray-800 p-4 rounded-lg hover:bg-gray-750 transition">
                  <input
                    type="checkbox"
                    name="insurance_clearance_received"
                    checked={formData.insurance_clearance_received}
                    onChange={handleChange}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <span className="text-white font-bold text-lg">✅ مفاصا حساب بیمه دریافت شده</span>
                    <p className="text-gray-400 text-sm">تسویه حساب نهایی بیمه تامین اجتماعی</p>
                  </div>
                </label>
              </div>
              {formData.insurance_clearance_received && (
                <div className="bg-gray-800/50 p-4 rounded-lg border-2 border-green-700">
                  <label className="block text-gray-300 mb-2 font-bold">
                    تاریخ مفاصا حساب <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="insurance_clearance_date"
                    value={formData.insurance_clearance_date}
                    onChange={handleChange}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* وضعیت فعال */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-5 h-5 rounded"
              />
              <span className="text-gray-300 font-bold">✅ قرارداد فعال است</span>
            </label>
          </div>

          {/* دکمه‌ها */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition font-bold"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              {loading ? '⏳ در حال ذخیره...' : editingId ? '💾 ذخیره تغییرات' : '➕ ایجاد قرارداد'}
            </button>
          </div>
        </form>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* لیست قراردادها */}
      {/* ═══════════════════════════════════════════ */}
      {contracts.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-gray-400 text-xl">هنوز قراردادی ثبت نشده</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map((contract) => {
            const typeColor = getContractTypeColor(contract.contract_type);
            const typeLabel = contractTypes.find(t => t.value === contract.contract_type)?.label || contract.contract_type;
            
            return (
              <div
                key={contract.id}
                className={`bg-gray-800 rounded-xl p-6 border-2 transition-all ${
                  contract.is_active
                    ? 'border-green-700 hover:border-green-600 hover:shadow-lg'
                    : 'border-gray-700 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-white font-bold text-lg">
                        📍 {contract.project_name || 'نامشخص'}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${typeColor}-900/30 text-${typeColor}-400 border border-${typeColor}-700`}>
                        {typeLabel}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {contract.employment_type_description || 'نوع استخدام نامشخص'}
                    </p>
                  </div>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {contract.daily_wage > 0 && (
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">دستمزد روزانه</div>
                      <div className="text-green-400 font-bold text-xl font-mono">
                        {Number(contract.daily_wage).toLocaleString('fa-IR')}
                        <span className="text-sm mr-2">تومان</span>
                      </div>
                    </div>
                  )}
                  {contract.monthly_salary > 0 && (
                    <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">حقوق ماهانه</div>
                      <div className="text-blue-400 font-bold text-xl font-mono">
                        {Number(contract.monthly_salary).toLocaleString('fa-IR')}
                        <span className="text-sm mr-2">تومان</span>
                      </div>
                    </div>
                  )}
                  {contract.contract_value > 0 && (
                    <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-4">
                      <div className="text-gray-400 text-sm mb-1">مبلغ قرارداد</div>
                      <div className="text-purple-400 font-bold text-xl font-mono">
                        {Number(contract.contract_value).toLocaleString('fa-IR')}
                        <span className="text-sm mr-2">تومان</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* پیمانکاری */}
                {contract.contract_value > 0 && (
                  <div className="bg-purple-900/10 border border-purple-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-400 font-bold">🔨 جزئیات پیمانکاری</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400">حسن انجام کار:</span>
                        <span className="text-white font-bold mr-2">{contract.retention_percent}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">سپرده بیمه:</span>
                        <span className="text-white font-bold mr-2">{contract.insurance_deposit_percent}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">کسر مالیات:</span>
                        <span className="text-white font-bold mr-2">{contract.tax_withholding_percent}%</span>
                      </div>
                    </div>
                    {contract.payment_terms && (
                      <div className="mt-3 pt-3 border-t border-purple-700/30">
                        <div className="text-gray-400 text-xs mb-1">شرایط پرداخت:</div>
                        <div className="text-white text-sm">{contract.payment_terms}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* بیمه */}
                {contract.insurance_clearance_received && (
                  <div className="bg-green-900/10 border border-green-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-400 font-bold">🏥 مفاصا حساب بیمه دریافت شده</span>
                    </div>
                    {contract.insurance_clearance_date && (
                      <div className="text-sm">
                        <span className="text-gray-400">تاریخ:</span>
                        <span className="text-white font-mono mr-2">
                          {new Date(contract.insurance_clearance_date).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContractsTab;
