// src/screens/admin/SchemeContractScreen.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getSchemeContracts, getJobClasses, getJobGroups,
  createSchemeContract, updateSchemeContract, recalculateSchemeContract,
  clearError
} from '../../features/admin/adminSchemeSlice';
import { fetchContracts, fetchUserDetail, updateContract } from '../../features/admin/adminSlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import EmployeeInfoSection from '../../components/admin/EmployeeInfoSection';
import ContractorInfoSection from '../../components/admin/ContractorInfoSection';
import FormattedInfoField from '../../components/admin/FormattedInfoField';
import JalaliDatePicker from '../../components/JalaliDatePicker';
import { formatJalaliDate, calculateDuration } from '../../utils/dateUtils';
import { formatNumberPersian } from '../../utils/numberUtils';

// 💰 نرخ‌های ثابت سال 1404
const RATES_1404 = {
  CHILD_ALLOWANCE: 10390968,      // حق اولاد (هر فرزند)
  HOUSING_ALLOWANCE: 9000000,     // حق مسکن ماهانه
  FOOD_ALLOWANCE: 22000000,       // بن خواروبار ماهانه
  MARRIAGE_ALLOWANCE: 5000000,    // حق تأهل (متأهلین)
};

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black bg-opacity-40 z-[999] flex items-center justify-center backdrop-blur-sm">
    <div className="bg-white p-6 rounded-lg shadow-2xl flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
      <p className="text-gray-800 font-semibold text-sm">لطفاً صبر کنید...</p>
    </div>
  </div>
);

const SchemeContractScreen = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const employeeId = searchParams.get('employee');
  const contractId = searchParams.get('contract');

  const { contracts, jobClasses, jobGroups, loading: schemeLoading, error } = useSelector(
    (state) => state.adminScheme
  );
  const { selectedUser, contracts: adminContracts, loading: adminLoading } = useSelector((state) => state.admin);
  const { list: projects } = useSelector((state) => state.projects);

  const [isViewMode, setIsViewMode] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [formData, setFormData] = useState({
    contract: contractId || null,
    job_class: '', job_group: '', scheme_year: 1404,
    service_unit_name: '', service_address: '',
    
    job_wage_monthly: 0, seniority_wage_monthly: 0, base_difference_wage_monthly: 0, base_wage_total_monthly: 0,
    housing_allowance: 0, food_allowance: 0, child_allowance: 0, marriage_allowance: 0,
    shift_allowance: 0, other_allowances: 0, total_monthly_wage_benefits: 0,
    
    clause_24_text: 'انجام کلیه وظایف محوله طبق دستور مافوق و رعایت آیین‌نامه‌های انضباطی کارگاه.',
    
    marital_status: 'SINGLE', children_count: 0, military_status: 'NOT_APPLICABLE',
    education_level: '', education_field: '',
    
    birth_date: '', birth_place: '', issuance_place: '',

    first_name: '', last_name: '', father_name: '', code_meli: '',
    experience_inside_years: 0, experience_inside_months: 0,
    experience_outside_years: 0, experience_outside_months: 0,
    
    contract_start_date: '',
    contract_end_date: '',
  });

  const baseContract = adminContracts?.find(c => c.id == contractId);
  
  const contractDuration = calculateDuration(
    formData.contract_start_date || baseContract?.start_date, 
    formData.contract_end_date || baseContract?.end_date
  );

  useEffect(() => {
    const loadData = async () => {
        try {
            await Promise.all([
                dispatch(getJobClasses()).unwrap(),
                dispatch(getJobGroups({ year: 1404 })).unwrap(),
                dispatch(fetchContracts()).unwrap(),
                dispatch(fetchProjects()).unwrap(),
                contractId ? dispatch(getSchemeContracts({ contractId })).unwrap() : Promise.resolve(),
                employeeId ? dispatch(fetchUserDetail(employeeId)).unwrap() : Promise.resolve()
            ]);
            setDataLoaded(true);
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };
    loadData();
  }, [dispatch, employeeId, contractId]);

  useEffect(() => {
    if (!dataLoaded) return;

    const userProfile = selectedUser?.employee_details || {};
    const existingScheme = contracts.find(c => c.contract == contractId || c.id == contractId);

    const getValue = (schemeKey, profileKey, defaultValue) => {
        if (existingScheme && existingScheme[schemeKey] !== undefined && existingScheme[schemeKey] !== null && existingScheme[schemeKey] !== '') {
            return existingScheme[schemeKey];
        }
        if (userProfile && userProfile[profileKey] !== undefined && userProfile[profileKey] !== null) {
            return userProfile[profileKey];
        }
        return defaultValue;
    };

    if (existingScheme) {
        setIsViewMode(true);
        setFormData(prev => ({
            ...prev,
            ...existingScheme,
            
            first_name: selectedUser?.first_name || '',
            last_name: selectedUser?.last_name || '',
            father_name: userProfile.father_name || '',
            code_meli: userProfile.code_meli || '',
            
            marital_status: getValue('employee_marital_status', 'marital_status', 'SINGLE'),
            children_count: getValue('employee_children_count', 'children_count', 0),
            military_status: getValue('employee_military_status', 'military_status', 'NOT_APPLICABLE'),
            
            education_level: getValue('employee_education', 'education_level', ''),
            education_field: getValue('employee_field', 'education_field', ''),
            
            birth_date: getValue('employee_birth_date', 'birth_date', ''),
            birth_place: getValue('employee_birth_place', 'birth_place', ''),
            issuance_place: getValue('employee_issuance_place', 'issuance_place', ''),

            experience_inside_years: getValue('exp_in_years', 'experience_inside_years', 0),
            experience_inside_months: getValue('exp_in_months', 'experience_inside_months', 0),
            experience_outside_years: getValue('exp_out_years', 'experience_outside_years', 0),
            experience_outside_months: getValue('exp_out_months', 'experience_outside_months', 0),
            
            contract_start_date: baseContract?.start_date || '',
            contract_end_date: baseContract?.end_date || '',
        }));
    } else if (selectedUser) {
        setIsViewMode(false);
        setFormData(prev => ({
            ...prev,
            contract: contractId,
            first_name: selectedUser.first_name || '',
            last_name: selectedUser.last_name || '',
            father_name: userProfile.father_name || '',
            code_meli: userProfile.code_meli || '',
            
            marital_status: userProfile.marital_status || 'SINGLE',
            children_count: userProfile.children_count || 0,
            military_status: userProfile.military_status || 'NOT_APPLICABLE',
            education_level: userProfile.education_level || '',
            education_field: userProfile.education_field || '',
            
            birth_date: userProfile.birth_date || '',
            birth_place: userProfile.birth_place || '',
            issuance_place: userProfile.issuance_place || '',

            experience_inside_years: userProfile.experience_inside_years || 0,
            experience_inside_months: userProfile.experience_inside_months || 0,
            experience_outside_years: userProfile.experience_outside_years || 0,
            experience_outside_months: userProfile.experience_outside_months || 0,
            
            contract_start_date: baseContract?.start_date || '',
            contract_end_date: baseContract?.end_date || '',
            
            housing_allowance: RATES_1404.HOUSING_ALLOWANCE,
            food_allowance: RATES_1404.FOOD_ALLOWANCE,
        }));
    }
  }, [contracts, selectedUser, contractId, dataLoaded, baseContract]);

  const handleJobClassChange = (e) => {
      const jobId = e.target.value;
      const job = jobClasses.find(j => j.id == jobId);
      let newGroup = formData.job_group;
      let newWage = formData.job_wage_monthly;
      if (job && job.default_group_number) {
          const targetGroup = jobGroups.find(g => g.group_number == job.default_group_number);
          if (targetGroup) {
              newGroup = targetGroup.id;
              newWage = Number(targetGroup.base_monthly_wage);
          }
      }
      setFormData(prev => ({ ...prev, job_class: jobId, job_group: newGroup, job_wage_monthly: newWage }));
  };

  const handleJobGroupChange = (e) => {
      const groupId = e.target.value;
      const group = jobGroups.find(g => g.id == groupId);
      if (group) {
          setFormData(prev => ({ ...prev, job_group: groupId, job_wage_monthly: Number(group.base_monthly_wage) }));
      } else {
          setFormData(prev => ({ ...prev, job_group: groupId }));
      }
  };

  const handleProjectSelect = (e) => {
      const selectedProjectId = e.target.value;
      const project = projects.find(p => p.id == selectedProjectId);
      if (project) {
          setFormData(prev => ({ ...prev, service_unit_name: project.name, service_address: project.location_text || '-' }));
      }
  };

  useEffect(() => {
      if(isViewMode) return;
      const count = Number(formData.children_count) || 0;
      const allowance = RATES_1404.CHILD_ALLOWANCE * count;
      setFormData(prev => ({ ...prev, child_allowance: allowance }));
  }, [formData.children_count, isViewMode]);

  useEffect(() => {
      if(isViewMode) return;
      const isMarried = formData.marital_status === 'MARRIED';
      const allowance = isMarried ? RATES_1404.MARRIAGE_ALLOWANCE : 0;
      setFormData(prev => ({ ...prev, marriage_allowance: allowance }));
  }, [formData.marital_status, isViewMode]);

  useEffect(() => {
      if(isViewMode) return;
      
      setFormData(prev => {
          const updates = {};
          
          if (!prev.housing_allowance || prev.housing_allowance === 0) {
              updates.housing_allowance = RATES_1404.HOUSING_ALLOWANCE;
          }
          
          if (!prev.food_allowance || prev.food_allowance === 0) {
              updates.food_allowance = RATES_1404.FOOD_ALLOWANCE;
          }
          
          if (Object.keys(updates).length > 0) {
              return { ...prev, ...updates };
          }
          
          return prev;
      });
  }, [isViewMode, formData.housing_allowance, formData.food_allowance]);

  useEffect(() => {
    if(isViewMode) return;
    const jobWage = Number(formData.job_wage_monthly) || 0;
    const seniority = Number(formData.seniority_wage_monthly) || 0;
    const difference = Number(formData.base_difference_wage_monthly) || 0;
    const baseTotal = jobWage + seniority + difference;

    const housing = Number(formData.housing_allowance) || 0;
    const food = Number(formData.food_allowance) || 0;
    const child = Number(formData.child_allowance) || 0;
    const marriage = Number(formData.marriage_allowance) || 0;
    const shift = Number(formData.shift_allowance) || 0;
    const other = Number(formData.other_allowances) || 0;
    const grandTotal = baseTotal + housing + food + child + marriage + shift + other;

    if (baseTotal !== formData.base_wage_total_monthly || grandTotal !== formData.total_monthly_wage_benefits) {
        setFormData(prev => ({ ...prev, base_wage_total_monthly: baseTotal, total_monthly_wage_benefits: grandTotal }));
    }
  }, [
    formData.job_wage_monthly, formData.seniority_wage_monthly, formData.base_difference_wage_monthly,
    formData.housing_allowance, formData.food_allowance, formData.child_allowance,
    formData.marriage_allowance, formData.shift_allowance, formData.other_allowances,
    isViewMode
  ]);

  const handleInputChange = useCallback((e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contractId) return alert("خطا: شناسه قرارداد یافت نشد.");

    setLoadingForm(true);
    dispatch(clearError());

    try {
      const contractDatesChanged = 
        formData.contract_start_date !== baseContract?.start_date ||
        formData.contract_end_date !== baseContract?.end_date;

      if (contractDatesChanged) {
        await dispatch(updateContract({
          contractId: Number(contractId),
          data: {
            start_date: formData.contract_start_date,
            end_date: formData.contract_end_date || null,
          }
        })).unwrap();
      }

      const payload = {
          ...formData,
          contract: Number(contractId),
          job_class: Number(formData.job_class),
          job_group: Number(formData.job_group),
          scheme_year: Number(formData.scheme_year) || 1404,
          
          marital_status: formData.marital_status,
          children_count: Number(formData.children_count),
          military_status: formData.military_status,
          education_level: formData.education_level,
          education_field: formData.education_field,
          
          birth_date: formData.birth_date || null,
          birth_place: formData.birth_place,
          issuance_place: formData.issuance_place,
          
          service_address: formData.service_address || '-',
          service_unit_name: formData.service_unit_name || '-',
          
          clause_24_text: formData.clause_24_text,
      };

      const fieldsToRemove = [
          'first_name', 'last_name', 'father_name', 'code_meli', 
          'experience_inside_years', 'experience_inside_months', 
          'experience_outside_years', 'experience_outside_months',
          'employee_name', 'employee_code_meli', 'employee_marital_status',
          'employee_children_count', 'employee_military_status',
          'employee_education', 'employee_field',
          'employee_birth_date', 'employee_birth_place', 'employee_issuance_place',
          'exp_in_years', 'exp_in_months', 'exp_out_years', 'exp_out_months',
          'job_class_title', 'job_class_code', 'job_group_number',
          'contract_start_date', 'contract_end_date',
      ];
      fieldsToRemove.forEach(f => delete payload[f]);

      const existingScheme = contracts.find((c) => c.contract == contractId);
      const schemeId = formData.id || (existingScheme ? existingScheme.id : null);

      if (schemeId) {
        await dispatch(updateSchemeContract({ id: schemeId, data: payload })).unwrap();
      } else {
        await dispatch(createSchemeContract(payload)).unwrap();
      }

      alert('✅ قرارداد با موفقیت ذخیره شد' + (contractDatesChanged ? ' (تاریخ‌ها به‌روز شد)' : ''));
      
      if (employeeId) await dispatch(fetchUserDetail(employeeId));
      if (contractId) {
        await dispatch(getSchemeContracts({ contractId }));
        await dispatch(fetchContracts());
      }
      
      setIsViewMode(true);
    } catch (err) {
      console.error('Save Error:', err);
      alert('❌ خطا در ذخیره‌سازی: ' + (err?.detail || JSON.stringify(err)));
    } finally {
      setLoadingForm(false);
    }
  };

  const handleRecalculate = async () => {
    if (!formData.id) return alert("⚠️ ابتدا قرارداد را ذخیره کنید تا محاسبه خودکار فعال شود.");
    
    try {
      await dispatch(recalculateSchemeContract(formData.id)).unwrap();
      alert('✅ محاسبات به‌روز شد');
      if (contractId) await dispatch(getSchemeContracts({ contractId }));
    } catch (error) {
      alert('❌ خطا در محاسبه: ' + (error?.detail || 'خطای ناشناخته'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 relative">
      {(loadingForm || schemeLoading || adminLoading?.userDetail || !dataLoaded) && <LoadingOverlay />}

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white border border-gray-300 shadow-sm rounded-sm px-8 py-6">
          
          <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-gray-900">قرارداد طرح طبقه‌بندی مشاغل</h1>
              <p className="text-xs text-gray-600">فرم شماره ۳۳۲۵-۱۲/۸۰-۷۷</p>
            </div>
            <div className="flex gap-2">
                {isViewMode ? (
                    <>
                        <button onClick={() => setIsViewMode(false)} className="bg-blue-600 text-white px-4 py-2 rounded-sm text-sm hover:bg-blue-700 shadow-sm">
                            ✏️ ویرایش قرارداد
                        </button>
                        <button onClick={() => navigate('/admin/users')} className="border border-gray-400 text-gray-700 px-4 py-2 rounded-sm text-sm hover:bg-gray-50">
                            بازگشت
                        </button>
                    </>
                ) : (
                    <button onClick={() => { setIsViewMode(true); }} className="text-red-600 border border-red-200 bg-red-50 px-4 py-2 rounded-sm text-sm hover:bg-red-100">
                        انصراف
                    </button>
                )}
            </div>
          </div>

          {error && <div className="border border-red-400 text-red-700 bg-red-50 text-sm px-4 py-3 mb-6 rounded-sm">{typeof error === 'object' ? JSON.stringify(error) : error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6 text-sm text-gray-800">
            
            <EmployeeInfoSection 
              formData={formData} 
              isViewMode={isViewMode} 
              handleInputChange={handleInputChange} 
            />

            {/* 🆕 بخش ب) مشخصات پیمانکار */}
            <ContractorInfoSection isViewMode={isViewMode} />

            <section className="border border-gray-300 rounded-sm p-4 relative">
              <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
                ج) مشخصات شغل
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <div>
                  {isViewMode ? (
                      <FormattedInfoField label="عنوان شغل" value={jobClasses.find(j => j.id == formData.job_class)?.title || formData.job_class_title || '-'} />
                  ) : (
                      <>
                        <label className="block text-xs text-gray-500 mb-1">عنوان شغل طرح</label>
                        <select name="job_class" value={formData.job_class || ''} onChange={handleJobClassChange} required className="w-full border border-gray-300 rounded-sm px-2 py-1 bg-white">
                            <option value="">انتخاب شغل...</option>
                            {jobClasses.map((job) => <option key={job.id} value={job.id}>{job.code} - {job.title}</option>)}
                        </select>
                      </>
                  )}
                </div>

                <div>
                  {isViewMode ? (
                      <FormattedInfoField label="کد شغل" value={jobClasses.find(j => j.id == formData.job_class)?.code || formData.job_class_code || '-'} />
                  ) : (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">کد شغل</label>
                        <div className="w-full border border-gray-200 bg-gray-50 rounded-sm px-2 py-1 text-gray-600">
                          {jobClasses.find(j => j.id == formData.job_class)?.code || '-'}
                        </div>
                      </div>
                  )}
                </div>
                
                <div>
                  {isViewMode ? (
                      <FormattedInfoField label="گروه شغلی" value={`گروه ${jobGroups.find(g => g.id == formData.job_group)?.group_number || formData.job_group_number || '-'}`} />
                  ) : (
                      <>
                        <label className="block text-xs text-gray-500 mb-1">گروه شغلی</label>
                        <select name="job_group" value={formData.job_group || ''} onChange={handleJobGroupChange} required className="w-full border border-gray-300 rounded-sm px-2 py-1 bg-white">
                            <option value="">انتخاب گروه...</option>
                            {jobGroups.map((group) => <option key={group.id} value={group.id}>سال {group.year} - گروه {group.group_number}</option>)}
                        </select>
                      </>
                  )}
                </div>
              </div>
            </section>

            <section className="border border-gray-300 rounded-sm p-4 relative">
              <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
                د) محل پیمان
              </div>

              {!isViewMode && (
                <div className="mb-3 border-b border-dashed pb-2">
                  <label className="block text-xs text-blue-700 mb-1 font-bold">
                    انتخاب سریع پروژه (پر کردن خودکار):
                  </label>
                  <select onChange={handleProjectSelect} className="w-full border border-blue-200 bg-blue-50 rounded-sm px-2 py-1 text-sm">
                      <option value="">-- انتخاب پروژه --</option>
                      {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  {isViewMode ? (
                      <FormattedInfoField label="محل خدمت (نام واحد)" value={formData.service_unit_name} />
                  ) : (
                      <>
                          <label className="block text-xs text-gray-500 mb-1">محل خدمت (واحد)</label>
                          <input name="service_unit_name" value={formData.service_unit_name || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm px-2 py-1" />
                      </>
                  )}
                </div>
                
                <div>
                  {isViewMode ? (
                      <FormattedInfoField label="آدرس محل خدمت" value={formData.service_address} />
                  ) : (
                      <>
                          <label className="block text-xs text-gray-500 mb-1">آدرس کامل</label>
                          <textarea name="service_address" rows={2} value={formData.service_address || ''} onChange={handleInputChange} className="w-full border border-gray-300 rounded-sm px-2 py-1" />
                      </>
                  )}
                </div>
              </div>
            </section>

            <section className="border border-gray-300 rounded-sm p-4 relative bg-blue-50/30">
              <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
                ه) مدت قرارداد
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                <div>
                  {isViewMode ? (
                    <>
                      <label className="block text-[10px] text-gray-500 mb-0.5">تاریخ شروع (شمسی)</label>
                      <div className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-1">
                        {formatJalaliDate(baseContract?.start_date) || '-'}
                      </div>
                      <div className="text-[9px] text-gray-400 mt-1">
                        {baseContract?.start_date}
                      </div>
                    </>
                  ) : (
                    <JalaliDatePicker
                      name="contract_start_date"
                      value={formData.contract_start_date}
                      onChange={handleInputChange}
                      label="تاریخ شروع 📅"
                    />
                  )}
                </div>
                
                <div>
                  {isViewMode ? (
                    <>
                      <label className="block text-[10px] text-gray-500 mb-0.5">تاریخ پایان (شمسی)</label>
                      <div className="text-sm font-medium text-gray-900 border-b border-gray-100 pb-1">
                        {baseContract?.end_date ? formatJalaliDate(baseContract.end_date) : 'نامحدود'}
                      </div>
                      {baseContract?.end_date && (
                        <div className="text-[9px] text-gray-400 mt-1">
                          {baseContract.end_date}
                        </div>
                      )}
                    </>
                  ) : (
                    <JalaliDatePicker
                      name="contract_end_date"
                      value={formData.contract_end_date}
                      onChange={handleInputChange}
                      label="تاریخ پایان 📅"
                    />
                  )}
                </div>
                
                <div className="md:col-span-2 bg-green-50 p-3 rounded border border-green-200">
                  <label className="block text-[10px] text-green-700 mb-1 font-bold">مدت کلی قرارداد</label>
                  <div className="text-lg font-bold text-green-800">
                    {contractDuration.text}
                  </div>
                  <div className="text-[10px] text-green-600 mt-1">
                    (مجموع: {contractDuration.days.toLocaleString()} روز)
                  </div>
                </div>
              </div>
              
              {!isViewMode && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-700">
                    ℹ️ تغییر تاریخ‌ها روی قرارداد اصلی نیز اعمال می‌شود
                  </p>
                </div>
              )}
            </section>

            <section className="border border-gray-300 rounded-sm p-4 relative">
              <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
                و) شرح قرارداد و شرح وظایف کلی کارگر
              </div>

              <div className="mt-2">
                {isViewMode ? (
                  <div className="text-sm leading-6 text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                    {formData.clause_24_text || '-'}
                  </div>
                ) : (
                  <>
                    <label className="block text-xs text-gray-500 mb-1">شرح وظایف و تعهدات</label>
                    <textarea
                      name="clause_24_text"
                      rows={4}
                      value={formData.clause_24_text || ''}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-sm px-3 py-2 text-sm leading-6"
                      placeholder="انجام کلیه وظایف محوله طبق دستور مافوق و رعایت آیین‌نامه‌های انضباطی کارگاه..."
                    />
                  </>
                )}
              </div>
            </section>

            <section className="border border-gray-300 rounded-sm p-4 relative bg-gray-50/50">
               <div className="absolute -top-3 right-4 bg-white px-2 text-xs font-bold text-gray-700">
                 ز) حقوق مبنا و مزایا (ریال)
               </div>
               
               {isViewMode ? (
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                       <FormattedInfoField label="مزد شغل" value={formData.job_wage_monthly} isCurrency />
                       <FormattedInfoField label="پایه سنوات" value={formData.seniority_wage_monthly} isCurrency />
                       <FormattedInfoField label="تفاوت تطبیق" value={formData.base_difference_wage_monthly} isCurrency />
                       <div className="bg-gray-200 p-2 rounded">
                         <FormattedInfoField label="جمع مزد مبنا" value={formData.base_wage_total_monthly} isCurrency />
                       </div>
                       
                       <div className="col-span-2 md:grid-cols-4 grid grid-cols-2 md:grid-cols-3 gap-4 border-t pt-4 mt-2">
                           <FormattedInfoField label="حق مسکن" value={formData.housing_allowance} isCurrency />
                           <FormattedInfoField label="بن خواروبار" value={formData.food_allowance} isCurrency />
                           <FormattedInfoField label="حق اولاد" value={formData.child_allowance} isCurrency />
                           <FormattedInfoField label="حق تاهل" value={formData.marriage_allowance} isCurrency />
                           <FormattedInfoField label="نوبت کاری" value={formData.shift_allowance} isCurrency />
                           <FormattedInfoField label="سایر" value={formData.other_allowances} isCurrency />
                       </div>
                       
                       <div className="col-span-2 md:col-span-4 text-left mt-4 border-t border-gray-400 pt-3">
                           <span className="text-gray-600 text-xs ml-2">جمع کل ناخالص:</span>
                           <span className="text-xl font-bold font-mono text-gray-900">
                             {formatNumberPersian(formData.total_monthly_wage_benefits)} <span className="text-sm text-gray-500">ریال</span>
                           </span>
                       </div>
                   </div>
               ) : (
                   <>
                       <div className="mb-4">
                           <h3 className="text-xs font-bold text-gray-800 mb-2 border-b pb-1">۱. اقلام مزد مبنا</h3>
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                               <div><label className="block text-xs text-gray-500">مزد شغل</label><input type="number" name="job_wage_monthly" value={formData.job_wage_monthly || 0} onChange={handleInputChange} className="w-full border px-2 py-1 ltr" /></div>
                               <div><label className="block text-xs text-gray-500">پایه سنوات</label><input type="number" name="seniority_wage_monthly" value={formData.seniority_wage_monthly || 0} onChange={handleInputChange} className="w-full border px-2 py-1 ltr" /></div>
                               <div><label className="block text-xs text-gray-500">تفاوت تطبیق</label><input type="number" name="base_difference_wage_monthly" value={formData.base_difference_wage_monthly || 0} onChange={handleInputChange} className="w-full border px-2 py-1 ltr" /></div>
                               <div><label className="block text-xs text-gray-800 font-bold">جمع مزد مبنا</label><input value={formData.base_wage_total_monthly || 0} readOnly className="w-full border bg-gray-100 px-2 py-1 ltr font-bold" /></div>
                           </div>
                       </div>
                       <div>
                           <h3 className="text-xs font-bold text-gray-800 mb-2 border-b pb-1">۲. مزایای ماهانه (نرخ‌های 1404)</h3>
                           <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-6 gap-3">
                               <div className="bg-purple-50/50 p-1 rounded border border-purple-100">
                                   <label className="block text-[10px] text-purple-700 font-bold">مسکن (خودکار)</label>
                                   <input type="number" name="housing_allowance" value={formData.housing_allowance || 0} onChange={handleInputChange} className="w-full bg-transparent border-none outline-none text-purple-800 font-bold px-1 ltr" />
                               </div>
                               <div className="bg-purple-50/50 p-1 rounded border border-purple-100">
                                   <label className="block text-[10px] text-purple-700 font-bold">خواروبار (خودکار)</label>
                                   <input type="number" name="food_allowance" value={formData.food_allowance || 0} onChange={handleInputChange} className="w-full bg-transparent border-none outline-none text-purple-800 font-bold px-1 ltr" />
                               </div>
                               <div className="bg-blue-50/50 p-1 rounded border border-blue-100">
                                   <label className="block text-[10px] text-blue-700 font-bold">حق اولاد (خودکار)</label>
                                   <input type="number" name="child_allowance" value={formData.child_allowance || 0} readOnly className="w-full bg-transparent border-none outline-none text-blue-800 font-bold px-1 ltr" />
                               </div>
                               <div className="bg-green-50/50 p-1 rounded border border-green-100">
                                   <label className="block text-[10px] text-green-700 font-bold">تأهل (خودکار)</label>
                                   <input type="number" name="marriage_allowance" value={formData.marriage_allowance || 0} readOnly className="w-full bg-transparent border-none outline-none text-green-800 font-bold px-1 ltr" />
                               </div>
                               <div><label className="block text-[10px]">نوبت‌کاری</label><input type="number" name="shift_allowance" value={formData.shift_allowance || 0} onChange={handleInputChange} className="w-full border px-2 py-1 ltr" /></div>
                               <div><label className="block text-[10px]">سایر</label><input type="number" name="other_allowances" value={formData.other_allowances || 0} onChange={handleInputChange} className="w-full border px-2 py-1 ltr" /></div>
                           </div>
                       </div>
                       <div className="mt-4 pt-4 border-t flex justify-end gap-4">
                         <span className="font-bold">جمع کل:</span>
                         <span className="font-mono text-lg font-bold">{formData.total_monthly_wage_benefits.toLocaleString()} ریال</span>
                       </div>
                   </>
               )}
            </section>

            {!isViewMode && (
                <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-gray-100 p-4 -mx-4 shadow-inner">
                  <button 
                    type="button" 
                    onClick={handleRecalculate} 
                    disabled={!formData.id} 
                    className="flex-1 border border-blue-600 text-blue-700 bg-blue-50 px-4 py-2 rounded-sm text-sm hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!formData.id ? 'ابتدا قرارداد را ذخیره کنید' : 'محاسبه مجدد بر اساس JobGroup'}
                  >
                    🔄 محاسبه خودکار (از جدول طرح)
                  </button>
                  <button 
                    type="submit" 
                    disabled={loadingForm || schemeLoading} 
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-sm text-sm hover:bg-gray-900 disabled:opacity-50"
                  >
                    💾 ذخیره نهایی قرارداد
                  </button>
                </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default SchemeContractScreen;
