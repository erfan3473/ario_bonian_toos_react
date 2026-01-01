// src/components/admin/tabs/ContractsTab.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  createContract,
  updateContract,
  deleteContract,
  fetchEmploymentTypes,
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';
import { fetchProjects } from '../../../features/projects/projectSlice';
import { getSchemeContracts } from '../../../features/admin/adminSchemeSlice';
import FinancialSummaryCard from '../FinancialSummaryCard';
import JalaliDatePicker from '../../JalaliDatePicker'; // 🆕

const ContractsTab = ({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { employmentTypes } = useSelector((state) => state.admin);
  const projects = useSelector((state) => state.projects.list);
  const { loading, success, error } = useSelector((state) => state.admin.updateStatus);
  const { contracts: schemeContracts } = useSelector((state) => state.adminScheme);

  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const employee = user?.employee_details; 
  const contracts = employee?.contracts || [];

  const [formData, setFormData] = useState({
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

  const selectedEmploymentType = employmentTypes?.find(
    (et) => et.id === Number(formData.employment_type_id)
  );

  const showDailyWage = selectedEmploymentType?.payment_type === 'daily' || selectedEmploymentType?.payment_type === 'hourly';
  const showMonthlySalary = selectedEmploymentType?.payment_type === 'monthly';
  const showContractValue = selectedEmploymentType?.payment_type === 'contract';

  // 🆕 چک کردن امکان ثبت قرارداد طرح
  const canHaveScheme = formData.contract_type === 'EMPLOYMENT' && selectedEmploymentType?.payment_type === 'monthly';

  useEffect(() => {
    dispatch(fetchEmploymentTypes());
    dispatch(fetchProjects());
    
    // بارگذاری قراردادهای طرح
    if (contracts.length > 0) {
      contracts.forEach(contract => {
        dispatch(getSchemeContracts({ contractId: contract.id }));
      });
    }
  }, [dispatch, contracts.length]);

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
      alert('❌ این کاربر پروفایل کارمندی ندارد! ابتدا تب "سازمانی" را تکمیل کنید.');
      return;
    }

    if (!formData.project_id || !formData.employment_type_id || !formData.start_date) {
      alert('❌ پر کردن فیلدهای پروژه، نوع استخدام و تاریخ شروع الزامی است');
      return;
    }

    if (formData.contract_type === 'EMPLOYMENT' && formData.insurance_clearance_received && !formData.insurance_clearance_date) {
      alert('❌ تاریخ مفاصا حساب بیمه الزامی است');
      return;
    }

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
      project_id: contract.project_id || contract.project || '',
      employment_type_id: contract.employment_type_id || contract.employment_type || '',
      contract_type: contract.contract_type || 'EMPLOYMENT',
      start_date: contract.start_date || '',
      end_date: contract.end_date || '',
      daily_wage: contract.daily_wage ? parseInt(contract.daily_wage) : '',
      monthly_salary: contract.monthly_salary ? parseInt(contract.monthly_salary) : '',
      contract_value: contract.contract_value ? parseInt(contract.contract_value) : '',
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
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    
    if (months === 0) return `${remainingDays} روز`;
    return `${months} ماه${remainingDays > 0 ? ` و ${remainingDays} روز` : ''}`;
  };

  const getContractTypeColor = (type) => {
    const found = contractTypes.find(t => t.value === type);
    return found?.color || 'gray';
  };

  // 🆕 هندلر رفتن به صفحه طرح طبقه‌بندی
  const handleGoToScheme = (contract) => {
    navigate(`/admin/scheme-contract?employee=${employee.user_id}&contract=${contract.id}`);
  };

  if (!user) {
    return <div className="text-center text-gray-500 py-10">لطفاً یک کاربر انتخاب کنید</div>;
  }

  if (!employee) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-yellow-400 text-xl mb-2">این کاربر هنوز به عنوان پرسنل ثبت نشده است</p>
        <p className="text-gray-400">برای ثبت قرارداد، ابتدا باید اطلاعات تب "سازمانی" را تکمیل و ذخیره کنید.</p>
      </div>
    );
  }

  if (!projects || !employmentTypes) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin text-4xl mb-4">⏳</div>
        <p className="text-gray-400">در حال دریافت اطلاعات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-xl">📝 مدیریت قراردادها</h3>
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
          {showNewForm ? '❌ انصراف' : '➕ ثبت قرارداد جدید'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* 🆕 کارت خلاصه مالی */}
      <FinancialSummaryCard 
        contracts={contracts} 
        schemeContracts={schemeContracts || []} 
      />

      {/* Form */}
      {showNewForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 space-y-6 shadow-xl backdrop-blur-sm">
          
          {/* 1. نوع قرارداد */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">1️⃣</span> نوع قرارداد
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contractTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, contract_type: type.value }))}
                  className={`p-4 rounded-xl font-bold border-2 transition-all text-right relative overflow-hidden ${
                    formData.contract_type === type.value
                      ? `bg-${type.color}-900/50 border-${type.color}-400 text-white ring-2 ring-${type.color}-500/30`
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {formData.contract_type === type.value && (
                    <div className={`absolute top-0 left-0 w-full h-1 bg-${type.color}-500`}></div>
                  )}
                  <div className="text-xl mb-1">{type.label}</div>
                  <div className="text-sm opacity-80 font-normal">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. مشخصات شغلی */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">2️⃣</span> مشخصات شغلی
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2 font-bold text-sm">
                  پروژه محل خدمت <span className="text-red-500">*</span>
                </label>
                <select
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">انتخاب پروژه...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-bold text-sm">
                  قالب استخدامی <span className="text-red-500">*</span>
                </label>
                <select
                  name="employment_type_id"
                  value={formData.employment_type_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                >
                  <option value="">انتخاب نوع استخدام...</option>
                  {employmentTypes && employmentTypes.length > 0 ? (
                    employmentTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.description} ({type.payment_type === 'daily' ? 'روزمزد' : 
                         type.payment_type === 'monthly' ? 'ماهانه' : 
                         type.payment_type === 'contract' ? 'پیمانکاری' : 'ساعتی'})
                      </option>
                    ))
                  ) : (
                    <option disabled>در حال بارگذاری...</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 3. بازه زمانی - 🆕 با JalaliDatePicker */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-blue-400 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">3️⃣</span> بازه زمانی
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <JalaliDatePicker
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                label="تاریخ شروع همکاری"
                required
              />
              
              <JalaliDatePicker
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                label="تاریخ پایان (اختیاری)"
              />
            </div>
          </div>

          {/* 4. حقوق و دستمزد */}
          <div className="border-b border-gray-700 pb-6">
            <h4 className="text-green-400 font-bold text-lg mb-4 flex items-center gap-2">
              <span className="text-2xl">4️⃣</span> حقوق و دستمزد
            </h4>
            
            {!selectedEmploymentType ? (
              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4 flex items-center gap-3">
                <span className="text-2xl">👈</span>
                <p className="text-yellow-400">لطفاً ابتدا <b>نوع استخدام</b> را در بخش مشخصات شغلی انتخاب کنید.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                  {showDailyWage && (
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-gray-300 mb-2 font-bold text-sm">
                        دستمزد روزانه (تومان) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="daily_wage"
                        value={formData.daily_wage}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono text-xl tracking-wider text-left"
                        placeholder="مثلا: 2500000"
                      />
                    </div>
                  )}

                  {showMonthlySalary && (
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-gray-300 mb-2 font-bold text-sm">
                        حقوق ثابت ماهانه (تومان) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="monthly_salary"
                        value={formData.monthly_salary}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-green-500 focus:outline-none font-mono text-xl tracking-wider text-left"
                        placeholder="مثلا: 15000000"
                      />
                    </div>
                  )}

                  {showContractValue && (
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-gray-300 mb-2 font-bold text-sm">
                        مبلغ کل قرارداد (تومان) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="contract_value"
                        value={formData.contract_value}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono text-xl tracking-wider text-left"
                      />
                    </div>
                  )}
                </div>

                {/* 🆕 نوتیف برای قرارداد طرح */}
                {canHaveScheme && (
                  <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div>
                      <p className="text-blue-400 font-bold mb-1">قابلیت ثبت قرارداد طرح طبقه‌بندی</p>
                      <p className="text-gray-400 text-sm">
                        بعد از ذخیره این قرارداد، می‌توانید آن را به قرارداد طرح طبقه‌بندی (با مزایای کامل) ارتقا دهید.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. تنظیمات پیمانکاری */}
          {showContractValue && (
            <div className="border-b border-gray-700 pb-6 bg-purple-900/10 p-6 rounded-xl border border-purple-500/20">
              <h4 className="text-purple-400 font-bold text-lg mb-4">تنظیمات پیمانکاری</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">حسن انجام کار (%)</label>
                  <input
                    type="number"
                    name="retention_percent"
                    value={formData.retention_percent}
                    onChange={handleChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">سپرده بیمه (%)</label>
                  <input
                    type="number"
                    name="insurance_deposit_percent"
                    value={formData.insurance_deposit_percent}
                    onChange={handleChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2 font-bold text-sm">کسر مالیات (%)</label>
                  <input
                    type="number"
                    name="tax_withholding_percent"
                    value={formData.tax_withholding_percent}
                    onChange={handleChange}
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none text-center"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-gray-300 mb-2 font-bold text-sm">شرایط پرداخت</label>
                  <textarea
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    rows="2"
                    className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 6. وضعیت بیمه */}
          {formData.contract_type === 'EMPLOYMENT' && (
            <div className="border-b border-gray-700 pb-6">
              <h4 className="text-gray-300 font-bold text-lg mb-4">وضعیت بیمه</h4>
              <div className="flex flex-col gap-4">
                <label className="flex items-center gap-3 cursor-pointer bg-gray-900/50 p-4 rounded-lg border border-gray-600 hover:bg-gray-700 transition">
                  <input
                    type="checkbox"
                    name="insurance_clearance_received"
                    checked={formData.insurance_clearance_received}
                    onChange={handleChange}
                    className="w-6 h-6 rounded border-gray-500 text-green-500 focus:ring-green-500"
                  />
                  <div>
                    <span className="text-white font-bold block">مفاصا حساب بیمه دریافت شده است</span>
                    <span className="text-gray-400 text-sm">تیک بزنید اگر تسویه حساب نهایی بیمه انجام شده است</span>
                  </div>
                </label>
                
                {formData.insurance_clearance_received && (
                  <div className="mr-8 animate-fadeIn">
                    <JalaliDatePicker
                      name="insurance_clearance_date"
                      value={formData.insurance_clearance_date}
                      onChange={handleChange}
                      label="تاریخ تسویه حساب"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. وضعیت فعال */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-white font-bold cursor-pointer select-none">
              این قرارداد فعال است
            </label>
          </div>

          {/* دکمه‌های فرم */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-xl font-bold text-gray-300 hover:bg-gray-700 transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
            >
              {loading ? '⏳ در حال پردازش...' : editingId ? '💾 ذخیره تغییرات' : '✅ ایجاد قرارداد'}
            </button>
          </div>
        </form>
      )}

      {/* لیست قراردادها */}
      <div className="space-y-4">
        {contracts.length === 0 ? (
          <div className="bg-gray-800/50 rounded-xl p-12 text-center border-2 border-dashed border-gray-700">
            <div className="text-6xl mb-6 opacity-50">📂</div>
            <p className="text-gray-400 text-xl font-bold">هنوز قراردادی ثبت نشده است</p>
            <p className="text-gray-500 mt-2">برای شروع، روی دکمه "ثبت قرارداد جدید" کلیک کنید</p>
          </div>
        ) : (
          contracts.map((contract) => {
            const typeColor = getContractTypeColor(contract.contract_type);
            const typeLabel = contractTypes.find(t => t.value === contract.contract_type)?.label || contract.contract_type;
            const hasScheme = schemeContracts?.some(sc => sc.contract === contract.id);
            const canAddScheme = contract.contract_type === 'EMPLOYMENT' && contract.monthly_salary > 0;
            
            return (
              <div
                key={contract.id}
                className={`bg-gray-800 rounded-xl p-6 border-l-4 transition-all hover:bg-gray-750 ${
                  contract.is_active
                    ? 'border-l-green-500 border-y border-r border-gray-700'
                    : 'border-l-gray-500 border-y border-r border-gray-700 opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h4 className="text-white font-bold text-xl">
                        {contract.project_name || 'پروژه نامشخص'}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold bg-${typeColor}-900/30 text-${typeColor}-400 border border-${typeColor}-700/50`}>
                        {typeLabel}
                      </span>
                      {contract.is_active ? (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-green-900/30 text-green-400 border border-green-700/50">فعال</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-gray-700 text-gray-400">غیرفعال</span>
                      )}
                      {hasScheme && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-blue-900/30 text-blue-400 border border-blue-700/50">
                          ✓ طرح طبقه‌بندی
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                      {contract.employment_type_description || 'نوع استخدام نامشخص'}
                    </p>
                  </div>

                  <div className="flex gap-2 self-start flex-wrap">
                    {/* 🆕 دکمه قرارداد طرح */}
                    {canAddScheme && (
                      <button
                        onClick={() => handleGoToScheme(contract)}
                        className={`px-3 py-2 rounded-lg font-bold text-sm transition ${
                          hasScheme
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50 hover:bg-blue-900/50'
                            : 'bg-green-900/30 text-green-400 border border-green-700/50 hover:bg-green-900/50'
                        }`}
                        title={hasScheme ? 'مشاهده قرارداد طرح' : 'ثبت قرارداد طرح'}
                      >
                        {hasScheme ? '📋 مشاهده طرح' : '➕ ثبت طرح'}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEdit(contract)}
                      className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition"
                      title="ویرایش"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(contract.id)}
                      className={`p-2 rounded-lg transition ${
                        deleteConfirm === contract.id
                          ? 'bg-red-600 text-white'
                          : 'text-red-400 hover:bg-red-900/30'
                      }`}
                      title="حذف"
                    >
                      {deleteConfirm === contract.id ? 'تایید؟' : '🗑️'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-900/50 rounded-lg p-4">
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">شروع همکاری</span>
                    <span className="text-white font-mono text-sm">
                      {new Date(contract.start_date).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">پایان همکاری</span>
                    <span className="text-white font-mono text-sm">
                      {contract.end_date ? new Date(contract.end_date).toLocaleDateString('fa-IR') : 'نامحدود'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">مدت</span>
                    <span className="text-white font-bold text-sm">
                      {calculateDuration(contract.start_date, contract.end_date)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 mb-1">وضعیت مالی</span>
                    {contract.daily_wage > 0 && <span className="text-green-400 font-mono font-bold text-sm block">{Number(contract.daily_wage).toLocaleString('fa-IR')} روزانه</span>}
                    {contract.monthly_salary > 0 && <span className="text-blue-400 font-mono font-bold text-sm block">{Number(contract.monthly_salary).toLocaleString('fa-IR')} ماهانه</span>}
                    {contract.contract_value > 0 && <span className="text-purple-400 font-mono font-bold text-sm block">{Number(contract.contract_value).toLocaleString('fa-IR')} کل</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ContractsTab;
