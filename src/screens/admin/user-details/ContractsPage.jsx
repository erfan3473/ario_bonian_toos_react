import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';

// ایمپورت اکشن‌ها
import { fetchUserDetail } from '../../../features/admin/usersSlice';
import { fetchEmploymentTypes } from '../../../features/admin/dropdownsSlice';
import {
  createContract,
  updateContract,
  deleteContract,
  resetContractUpdateStatus
} from '../../../features/admin/contractsSlice';
import { fetchProjects } from '../../../features/projects/projectSlice';
import { getSchemeContracts } from '../../../features/admin/adminSchemeSlice'; // 🔴 اضافه شد
import JalaliDatePicker from '../../../components/JalaliDatePicker';

const ContractsPage = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // استیت‌های ریداکس
  const { selectedUser: user, loading: usersLoading } = useSelector((state) => state.admin.users);
  const employmentTypes = useSelector((state) => state.admin.dropdowns?.employmentTypes || []);
  const updateStatus = useSelector((state) => state.admin.contracts?.updateStatus || {});
  const projects = useSelector((state) => state.projects?.list || []);
  const { contracts: schemeContracts } = useSelector((state) => state.adminScheme || { contracts: [] }); // 🔴 اضافه شد

  const userLoading = usersLoading?.userDetail;
  
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const employee = user?.employee_details;
  const contractsList = employee?.contracts || [];

  // فرم پیش‌فرض
  const initialFormState = {
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
  };

  const [formData, setFormData] = useState(initialFormState);

  // لودینگ اولیه اطلاعات
  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    setIsInitializing(true);
    
    const fetchAllData = async () => {
      try {
        await Promise.all([
          dispatch(fetchUserDetail(userId)),
          dispatch(fetchProjects()),
          dispatch(fetchEmploymentTypes())
        ]);
      } catch (error) {
        console.error("خطا در دریافت اطلاعات:", error);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };
    fetchAllData();
    return () => { isMounted = false; };
  }, [dispatch, userId]);

  // 🔴 بارگذاری قراردادهای طرح برای لیست قراردادهای فعلی کاربر
  useEffect(() => {
    if (contractsList.length > 0) {
      contractsList.forEach(contract => {
        dispatch(getSchemeContracts({ contractId: contract.id }));
      });
    }
  }, [dispatch, contractsList.length]);

  // ریست فرم بعد از موفقیت
  useEffect(() => {
    if (updateStatus.success) {
      resetForm();
      dispatch(resetContractUpdateStatus());
    }
  }, [updateStatus.success, dispatch]);

  // محاسبات نوع استخدام انتخاب شده
  const selectedEmploymentType = employmentTypes.find(
    (et) => et.id === Number(formData.employment_type_id)
  );

  const showDailyWage = selectedEmploymentType?.payment_type === 'daily' || selectedEmploymentType?.payment_type === 'hourly';
  const showMonthlySalary = selectedEmploymentType?.payment_type === 'monthly';
  const showContractValue = selectedEmploymentType?.payment_type === 'contract';
  const canHaveScheme = formData.contract_type === 'EMPLOYMENT' && selectedEmploymentType?.payment_type === 'monthly';

  // هندلرهای تغییرات
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setShowNewForm(false);
    setEditingId(null);
    setDeleteConfirm(null);
  };

  // ارسال فرم
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!employee?.id) {
      alert('❌ این کاربر پروفایل کارمندی ندارد! ابتدا مشخصات سازمانی را تکمیل کنید.');
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

    if (showDailyWage && !formData.daily_wage) return alert('❌ دستمزد روزانه الزامی است');
    if (showMonthlySalary && !formData.monthly_salary) return alert('❌ حقوق ماهانه الزامی است');
    if (showContractValue && !formData.contract_value) return alert('❌ مبلغ قرارداد الزامی است');

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

  // 🔴 اصلاح شد: ست کردن مقادیر با چک کردن فیلدهای مستقیم مثل project_id
  const startEdit = (contract) => {
    setEditingId(contract.id);
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

  // هندلر رفتن به صفحه طرح طبقه‌بندی
  const handleGoToScheme = (contract) => {
    navigate(`/admin/scheme-contracts?employee=${employee.user_id || employee.id}&contract=${contract.id}`);
  };

  // محاسبه مدت زمان قرارداد
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

  if (isInitializing || userLoading) {
    return <div className="p-8 flex justify-center items-center h-screen text-gray-500 font-bold text-lg">در حال بارگذاری اطلاعات...</div>;
  }
  
  if (!user) {
    return <div className="p-8 flex justify-center items-center h-screen text-red-500 font-bold text-lg">کاربر یافت نشد.</div>;
  }

  const inputClassName = "w-full p-2.5 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none";

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header & Breadcrumbs */}
      <div className="mb-6">
        <nav className="text-sm font-medium text-gray-500 mb-4 flex gap-2 items-center">
          <Link to="/admin/users" className="hover:text-blue-600 transition-colors">👥 لیست کاربران</Link>
          <span>/</span>
          <Link to={`/admin/users/${userId}`} className="hover:text-blue-600 transition-colors">
            داشبورد {user.first_name} {user.last_name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">قراردادها</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            📑 مدیریت قراردادهای: <span className="text-blue-600">{user.first_name} {user.last_name}</span>
          </h1>
          <div className="flex gap-2">
            {!showNewForm && (
              <button
                onClick={() => setShowNewForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium flex items-center gap-2"
              >
                ➕ ثبت قرارداد جدید
              </button>
            )}
            <button
              onClick={() => navigate(`/admin/users/${userId}`)}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← بازگشت به داشبورد
            </button>
          </div>
        </div>
      </div>

      {!employee && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6">
          ⚠️ برای این کاربر هنوز <b>اطلاعات پرسنلی (Employee Profile)</b> ثبت نشده است. ابتدا اطلاعات پرسنلی را تکمیل کنید.
        </div>
      )}

      {/* فرم ثبت/ویرایش قرارداد */}
      {showNewForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 space-y-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              {editingId ? '✏️ ویرایش قرارداد' : '➕ ثبت قرارداد جدید'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">نوع قرارداد (سیستمی)</label>
              <select name="contract_type" value={formData.contract_type} onChange={handleChange} className={inputClassName}>
                <option value="EMPLOYMENT">🏛️ استخدامی رسمی (مشمول بیمه)</option>
                <option value="SUBCONTRACT">🔨 پیمانکاری/غیررسمی (بدون بیمه)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">پروژه <span className="text-red-500">*</span></label>
              <select name="project_id" value={formData.project_id} onChange={handleChange} className={inputClassName} required>
                <option value="">انتخاب پروژه...</option>
                {projects.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">قالب استخدامی <span className="text-red-500">*</span></label>
              <select name="employment_type_id" value={formData.employment_type_id} onChange={handleChange} className={inputClassName} required>
                <option value="">انتخاب قالب...</option>
                {employmentTypes.map(et => (
                  <option key={et.id} value={et.id}>
                    {et.description} ({et.payment_type === 'daily' ? 'روزمزد' : et.payment_type === 'monthly' ? 'ماهانه' : et.payment_type === 'contract' ? 'پیمانکاری' : 'ساعتی'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">تاریخ شروع <span className="text-red-500">*</span></label>
              <JalaliDatePicker name="start_date" value={formData.start_date} onChange={(d) => handleDateChange('start_date', d)} />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">تاریخ پایان (اختیاری)</label>
              <JalaliDatePicker name="end_date" value={formData.end_date} onChange={(d) => handleDateChange('end_date', d)} />
            </div>

            {showDailyWage && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">دستمزد روزانه (تومان) <span className="text-red-500">*</span></label>
                <input type="number" name="daily_wage" value={formData.daily_wage} onChange={handleChange} required className={inputClassName} />
              </div>
            )}

            {showMonthlySalary && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">حقوق پایه ماهانه (تومان) <span className="text-red-500">*</span></label>
                <input type="number" name="monthly_salary" value={formData.monthly_salary} onChange={handleChange} required className={inputClassName} />
              </div>
            )}

            {showContractValue && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">مبلغ کل قرارداد (تومان) <span className="text-red-500">*</span></label>
                <input type="number" name="contract_value" value={formData.contract_value} onChange={handleChange} required className={inputClassName} />
              </div>
            )}

            {canHaveScheme && (
               <div className="lg:col-span-3 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-sm">
                 💡 <b>طرح طبقه‌بندی:</b> بعد از ذخیره، می‌توانید این قرارداد را به طرح طبقه‌بندی متصل کنید.
               </div>
            )}

            <div className="flex items-center lg:col-span-3 mt-4">
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="form-checkbox h-5 w-5 text-blue-600 rounded" />
                <span className="mr-3 text-gray-800 font-bold">این قرارداد فعال است</span>
              </label>
            </div>
          </div>

          {/* تنظیمات پیمانکاری */}
          {showContractValue && (
            <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-4">⚙️ تنظیمات پیمانکاری</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">حسن انجام کار (%)</label>
                  <input type="number" name="retention_percent" value={formData.retention_percent} onChange={handleChange} className={inputClassName} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">سپرده بیمه (%)</label>
                  <input type="number" name="insurance_deposit_percent" value={formData.insurance_deposit_percent} onChange={handleChange} className={inputClassName} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">مالیات (%)</label>
                  <input type="number" name="tax_withholding_percent" value={formData.tax_withholding_percent} onChange={handleChange} className={inputClassName} />
                </div>
              </div>
              <div className="mt-4">
                  <label className="block text-sm text-gray-700 mb-1">شرایط پرداخت</label>
                  <textarea name="payment_terms" value={formData.payment_terms} onChange={handleChange} rows="2" className={inputClassName} />
              </div>
            </div>
          )}

          {/* مفاصا حساب */}
          {formData.contract_type === 'EMPLOYMENT' && (
            <div className="mt-6 pt-4 border-t border-gray-200">
               <h4 className="font-bold text-gray-700 mb-4">🛡️ وضعیت مفاصا حساب بیمه</h4>
               <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                 <label className="flex items-center cursor-pointer">
                   <input type="checkbox" name="insurance_clearance_received" checked={formData.insurance_clearance_received} onChange={handleChange} className="form-checkbox h-5 w-5 text-green-600 rounded" />
                   <span className="mr-2 text-gray-700">مفاصا حساب دریافت شده است</span>
                 </label>
                 {formData.insurance_clearance_received && (
                   <div className="flex-1 w-full">
                     <JalaliDatePicker name="insurance_clearance_date" value={formData.insurance_clearance_date} onChange={(d) => handleDateChange('insurance_clearance_date', d)} label="تاریخ دریافت مفاصا حساب" />
                   </div>
                 )}
               </div>
            </div>
          )}

          <div className="pt-6 border-t flex justify-end gap-3">
            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">انصراف</button>
            <button type="submit" disabled={updateStatus.loading} className={`px-6 py-2 rounded-lg font-bold text-white transition ${updateStatus.loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {updateStatus.loading ? 'در حال پردازش...' : editingId ? 'ذخیره تغییرات' : 'ثبت قرارداد'}
            </button>
          </div>
        </form>
      )}

      {/* لیست قراردادها */}
      <div className="space-y-4">
        {contractsList.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm text-center text-gray-500">
             هیچ قراردادی برای این کاربر ثبت نشده است.
          </div>
        ) : (
          contractsList.map((contract) => {
            // 🔴 بررسی وجود طرح طبقه‌بندی
            const hasScheme = schemeContracts?.some(sc => sc.contract === contract.id);
            const canAddScheme = contract.contract_type === 'EMPLOYMENT' && contract.monthly_salary > 0;

            return (
              <div key={contract.id} className={`bg-white rounded-xl shadow-sm border p-5 ${contract.is_active ? 'border-green-200 border-r-4 border-r-green-500' : 'border-gray-200 border-r-4 border-r-gray-400 opacity-75'}`}>
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 🔴 استفاده از فیلدهای مستقیم برگردانده شده از بک‌اند */}
                      <h4 className="text-lg font-bold text-gray-800">{contract.project_name || 'بدون پروژه'}</h4>
                      
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${contract.contract_type === 'EMPLOYMENT' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {contract.contract_type === 'EMPLOYMENT' ? '🏛️ رسمی' : '🔨 پیمانکاری'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${contract.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {contract.is_active ? '🟢 فعال' : '⚫ غیرفعال'}
                      </span>
                      {hasScheme && (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                          ✓ دارای طرح طبقه‌بندی
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">قالب استخدامی</span>
                        {/* 🔴 اصلاح نام فیلد */}
                        <span className="font-semibold text-gray-800">{contract.employment_type_description || 'نامشخص'}</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-400 mb-1">مدت همکاری</span>
                        <span className="font-semibold text-gray-800">{calculateDuration(contract.start_date, contract.end_date)}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="block text-xs text-gray-400 mb-1">وضعیت مالی</span>
                        {contract.daily_wage > 0 && <span className="font-bold text-green-600 block">{Number(contract.daily_wage).toLocaleString()} تومان روزانه</span>}
                        {contract.monthly_salary > 0 && <span className="font-bold text-blue-600 block">{Number(contract.monthly_salary).toLocaleString()} تومان ماهانه</span>}
                        {contract.contract_value > 0 && <span className="font-bold text-purple-600 block">{Number(contract.contract_value).toLocaleString()} تومان مبلغ کل</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
                    {/* 🔴 دکمه‌های مربوط به طرح طبقه‌بندی */}
                    {canAddScheme && (
                      <button 
                        onClick={() => handleGoToScheme(contract)}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition ${hasScheme ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'}`}
                      >
                        {hasScheme ? '📋 مشاهده طرح' : '➕ ثبت طرح'}
                      </button>
                    )}
                    
                    <button onClick={() => startEdit(contract)} className="bg-white text-gray-600 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm font-medium transition">
                      ✏️ ویرایش
                    </button>
                    
                    {deleteConfirm === contract.id ? (
                      <div className="flex gap-1 items-center bg-red-50 p-1 rounded-lg border border-red-200">
                        <span className="text-xs text-red-600 px-2 font-bold">مطمئنید؟</span>
                        <button onClick={() => handleDelete(contract.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600">بله</button>
                        <button onClick={() => setDeleteConfirm(null)} className="bg-gray-300 text-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-400">خیر</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(contract.id)} className="bg-white text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-sm font-medium transition">
                        🗑️ حذف
                      </button>
                    )}
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

export default ContractsPage;
