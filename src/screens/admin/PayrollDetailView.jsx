// src/screens/admin/PayrollDetailView.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment-jalaali';
import PeriodStatusManager from '../../components/admin/PeriodStatusManager';

import { useNavigate, useSearchParams } from 'react-router-dom';
// Utils
import { formatJalaliDateLong } from '../../utils/dateUtils';

// Redux Actions
import {
  fetchAllPeriods,
  fetchPeriodPayroll,
  generatePeriodPayroll,
  createManualPayrollItem,
  updatePayrollItem,
  deletePayrollItem,
  updateLocalPayrollItem,
  clearCurrentPeriod,
  changeItemStage,
  changePeriodStatus,
} from '../../features/payroll/payrollSlice';

moment.loadPersian({ usePersianDigits: false });


const PayrollDetailView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // ✅ خواندن URL params

  // Redux State
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const userDetails = useSelector((state) => state.userDetails);
  const { user: userProfile } = userDetails;
  const { currentPeriod, items, loading: payrollLoading } = useSelector(
    (state) => state.payroll
  );


  // Local State
  const [newRow, setNewRow] = useState({
    full_name: '',
    national_id: '',
    shaba_number: '',
    card_number: '',
    relation_type: 'EMPLOYEE',
    description: '',
    monthly_amount: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [rowBackup, setRowBackup] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, type: 'success', message: '' });

  // Permissions
  const currentUser = (userProfile && Object.keys(userProfile).length > 0) ? userProfile : userInfo;
  const userRole =
    currentUser?.employee?.position?.report_type ||
    currentUser?.employee?.position?.reporttype ||
    'UNKNOWN';

  const isSuperUser = currentUser?.is_superuser || false;
  const MANAGER_ROLES = ['TECHNICAL_OFFICE', 'PROJECT_MANAGER', 'HR_MANAGER'];
  const SUPERVISOR_ROLES = ['WORKSHOP_SUPERVISOR'];
  const ACCOUNTANT_ROLES = ['ACCOUNTANT'];

  const canManageRows =
    ['WORKSHOP_SUPERVISOR', 'ACCOUNTANT'].includes(userRole) ||
    MANAGER_ROLES.includes(userRole) ||
    isSuperUser;
  const canEditFinance = ['ACCOUNTANT'].includes(userRole) || isSuperUser;
  const isPeriodFinal = Boolean(currentPeriod?.is_final);

  const isManager = MANAGER_ROLES.includes(userRole) || isSuperUser;
  const isSupervisor = SUPERVISOR_ROLES.includes(userRole) || isSuperUser;
  const isAccountant = ACCOUNTANT_ROLES.includes(userRole) || isSuperUser;

  // Stage Colors & Labels
  
  // ✅ صحیح - برای PayrollItem
  const STAGE_COLORS = {
    DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
    SUPERVISOR_CONFIRMED: 'bg-yellow-100 text-yellow-800 border-yellow-200',  // ✅
    FINANCE_CHECK: 'bg-blue-100 text-blue-800 border-blue-200',
    FINAL: 'bg-green-100 text-green-800 border-green-200',
  };

  const STAGE_LABELS = {
    DRAFT: 'پیش‌نویس',
    SUPERVISOR_CONFIRMED: 'تایید سرپرست',  // ✅
    FINANCE_CHECK: 'بررسی مالی',
    FINAL: 'نهایی',
  };


  // Handlers
  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 3000);
  };

  const handleBackToList = () => {
    dispatch(clearCurrentPeriod());
    dispatch(fetchAllPeriods());
    navigate('/admin/payroll/list');
  };

  const handleGenerate = async () => {
    if (!currentPeriod) return;
    try {
      await dispatch(
        generatePeriodPayroll({
          start: currentPeriod.start_date,
          end: currentPeriod.end_date,
        })
      ).unwrap();
      showSnackbar('success', 'لیست بروزرسانی شد');
      setSelectedRows([]);
    } catch (e) {
      showSnackbar('error', e || 'خطا در بروزرسانی');
    }
  };

  const handleAddNewRow = async () => {
    if (!currentPeriod || !newRow.full_name.trim()) return;

    let bankInfo = '';
    if (newRow.shaba_number) bankInfo += `IR${newRow.shaba_number}`;
    if (newRow.card_number) {
      bankInfo += ` | کارت: ${newRow.card_number}`;
    }

    try {
      await dispatch(
        createManualPayrollItem({
          periodId: currentPeriod.id,
          payload: {
            ...newRow,
            full_name: newRow.full_name.trim(),
            national_id: newRow.national_id.trim(),
            bank_account_number: bankInfo.trim(),
          },
        })
      ).unwrap();

      showSnackbar('success', 'ردیف اضافه شد');

      await dispatch(
        fetchPeriodPayroll({
          start: currentPeriod.start_date,
          end: currentPeriod.end_date,
        })
      ).unwrap();

      setNewRow({
        full_name: '',
        national_id: '',
        shaba_number: '',
        card_number: '',
        relation_type: 'EMPLOYEE',
        description: '',
        monthly_amount: 0,
      });
    } catch (e) {
      showSnackbar('error', e || 'خطا در افزودن');
    }
  };

  const handleDeleteRow = async (id) => {
    if (!canManageRows) return;

    if (currentPeriod?.is_final) {
      showSnackbar('error', 'دوره نهایی شده و حذف ردیف ممنوع است');
      return;
    }

    const targetRow = items.find((x) => x.id === id);
    if (targetRow?.stage === 'FINAL' && !isManager) {
      showSnackbar('error', 'ردیف نهایی شده؛ فقط مدیران می‌توانند حذف کنند');
      return;
    }

    if (!window.confirm('حذف شود؟')) return;

    try {
      await dispatch(deletePayrollItem(id)).unwrap();
      showSnackbar('success', 'حذف شد');
      setSelectedRows((prev) => prev.filter((rowId) => rowId !== id));
    } catch (e) {
      showSnackbar('error', e || 'خطا در حذف');
    }
  };

  const handleBatchApprove = async () => {
    if (!currentPeriod || selectedRows.length === 0) return;
    if (!window.confirm(`${selectedRows.length} ردیف به مرحله FINAL تغییر یابد؟`)) return;

    try {
      const result = await dispatch(
        changeItemStage({
          itemIds: selectedRows,
          stage: 'FINAL',
        })
      ).unwrap();

      await dispatch(
        fetchPeriodPayroll({
          start: currentPeriod.start_date,
          end: currentPeriod.end_date,
        })
      ).unwrap();

      showSnackbar('success', `${result.updated_count} ردیف تایید نهایی شد`);
      setSelectedRows([]);
    } catch (e) {
      showSnackbar('error', e || 'خطا در تایید');
    }
  };

  const handleSingleStageChange = async (itemId, targetStage) => {
    const stageNames = {
      SUPERVISOR_CONFIRMED: 'تایید سرپرست',  // ✅ برای item
      FINANCE_CHECK: 'بررسی مالی',
      FINAL: 'نهایی',
    };


    if (!window.confirm(`به ${stageNames[targetStage]} تغییر یابد؟`)) return;

    try {
      await dispatch(
        changeItemStage({
          itemIds: [itemId],
          stage: targetStage,
        })
      ).unwrap();

      await dispatch(
        fetchPeriodPayroll({
          start: currentPeriod.start_date,
          end: currentPeriod.end_date,
        })
      ).unwrap();

      showSnackbar('success', `ردیف به ${stageNames[targetStage]} تغییر یافت`);
    } catch (e) {
      showSnackbar('error', e || 'خطا در تغییر');
    }
  };

  const handleChangePeriodStatus = async (targetStatus, unlockOnly = false) => {
    if (!currentPeriod || !isManager) return;

    const statusNames = {
      DRAFT: 'پیش‌نویس',
      SUPERVISOR_DONE: 'تکمیل سرپرست',
      FINANCE_CHECK: 'بررسی مالی',
      FINAL: 'آماده پرداخت',
    };

    const confirmMsg = unlockOnly 
      ? '⚠️ قفل دوره باز شود؟ (خطرناک!)'
      : targetStatus === 'FINAL'
      ? `⚠️ دوره به حالت ${statusNames[targetStatus]} قفل شود؟ (غیرقابل برگشت)`
      : `دوره به ${statusNames[targetStatus]} تغییر یابد؟`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await dispatch(
        changePeriodStatus({
          periodId: currentPeriod.id,
          status: unlockOnly ? currentPeriod.status : targetStatus,
          is_final: unlockOnly ? false : (targetStatus === 'FINAL'),
        })
      ).unwrap();

      await dispatch(
        fetchPeriodPayroll({
          start: currentPeriod.start_date,
          end: currentPeriod.end_date,
        })
      ).unwrap();

      showSnackbar('success', `دوره ${unlockOnly ? 'باز شد' : `به ${statusNames[targetStatus]} تغییر یافت`}`);
    } catch (e) {
      showSnackbar('error', e || 'خطا در تغییر وضعیت');
    }
  };


  const startEditRow = (row) => {
    if (row.stage === 'FINAL' && !isSuperUser) {
      showSnackbar('error', 'ردیف نهایی شده و قابل ویرایش نیست');
      return;
    }
    if (currentPeriod?.is_final && !isSuperUser) {
      showSnackbar('error', 'دوره قفل شده است');
      return;
    }
    setEditingId(row.id);
    setRowBackup({ ...row });
  };

  const cancelEditRow = () => {
    if (rowBackup) {
      dispatch(updateLocalPayrollItem({ id: rowBackup.id, changes: rowBackup }));
    }
    setEditingId(null);
    setRowBackup(null);
  };

  const saveRow = async (row) => {
    try {
      const res = await dispatch(
        updatePayrollItem({
          itemId: row.id,
          payload: {
            monthly_amount: row.monthly_amount,
            opening_balance: row.opening_balance,
            full_name: row.full_name,
            national_id: row.national_id,
            bank_account_number: row.bank_account_number,
            relation_type: row.relation_type,
            description: row.description,
          },
        })
      ).unwrap();

      const sentMonthly = Number(row.monthly_amount) || 0;
      const sentOpening = Number(row.opening_balance) || 0;

      if (
        (res.monthly_amount ?? sentMonthly) !== sentMonthly ||
        (res.opening_balance ?? sentOpening) !== sentOpening
      ) {
        showSnackbar('error', 'بک‌اند مقدار را تغییر نداد (مجوز/رول را چک کن).');
        return;
      }

      showSnackbar('success', 'ذخیره شد');
      setEditingId(null);
      setRowBackup(null);
    } catch (e) {
      showSnackbar('error', e || 'خطا در ذخیره');
    }
  };

  const handleLocalChange = (id, field, value) => {
    if (field === 'monthly_amount' || field === 'opening_balance') {
      if (value === '-' || value === '') {
        dispatch(updateLocalPayrollItem({ id, changes: { [field]: value } }));
        return;
      }
      const parsed = Number(String(value).replace(/,/g, ''));
      if (!isNaN(parsed)) {
        dispatch(updateLocalPayrollItem({ id, changes: { [field]: parsed } }));
      }
    } else {
      dispatch(updateLocalPayrollItem({ id, changes: { [field]: value } }));
    }
  };

  useEffect(() => {
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    if (startDate && endDate) {
      // ✅ همیشه fetch کن اگر params هست
      // اگر currentPeriod با همین تاریخ‌ها موجود نیست، یا رفرش شده
      if (!currentPeriod || 
          currentPeriod.start_date !== startDate || 
          currentPeriod.end_date !== endDate) {
        dispatch(fetchPeriodPayroll({ start: startDate, end: endDate }));
      }
    }
  }, [searchParams]); // ✅ فقط وابسته به تغییر URL


  const renderBankInfo = (text) => {
    if (!text) return <span className="text-gray-300">-</span>;

    let shaba = text;
    let card = null;

    if (text.includes('|')) {
      const parts = text.split('|');
      shaba = parts[0].trim();
      card = parts[1].trim();
    } else if (text.includes('(کارت:')) {
      const parts = text.split('(کارت:');
      shaba = parts[0].trim();
      card = 'کارت: ' + parts[1].replace(')', '').trim();
    }

    return (
      <div className="flex flex-col gap-1 items-center justify-center">
        <span className="font-mono text-[11px] text-gray-700 tracking-wider select-all">
          {shaba}
        </span>
        {card && (
          <span className="font-mono text-[10px] bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 select-all">
            {card}
          </span>
        )}
      </div>
    );
  };
  

  if (!currentPeriod) {
    return (
      <div className="container mx-auto px-4 py-8 rtl min-h-screen bg-white">
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">دوره‌ای انتخاب نشده است</p>
          <button
            onClick={() => navigate('/admin/payroll/list')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
          >
            بازگشت به لیست
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white text-black">
      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] text-white px-4 py-2 rounded-full shadow-lg text-sm ${
            snackbar.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {snackbar.message}
        </div>
      )}

      {/* Header — ساده شده (فقط نقش) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b border-gray-300 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">نقش شما:</span>
          <span className={`px-2 py-1 rounded text-xs font-bold border ${
            userRole === 'PROJECT_MANAGER' || userRole === 'HR_MANAGER' || userRole === 'TECHNICAL_OFFICE'
              ? 'bg-purple-100 text-purple-800 border-purple-200'
              : userRole === 'ACCOUNTANT'
              ? 'bg-green-100 text-green-800 border-green-200'
              : userRole === 'WORKSHOP_SUPERVISOR'
              ? 'bg-orange-100 text-orange-800 border-orange-200'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}>
            {userRole}
          </span>
          {isSuperUser && (
            <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
              👑 SUPER_ADMIN
            </span>
          )}
        </div>
        
        <button
          onClick={handleBackToList}
          className="text-black font-bold hover:text-blue-700 border-b border-transparent hover:border-blue-700 transition text-sm"
        >
          بازگشت به لیست ➔
        </button>
      </div>


      {/* ✅ PeriodStatusManager */}
      <PeriodStatusManager
        currentPeriod={currentPeriod}
        isManager={isManager}
        payrollLoading={payrollLoading}
        onStatusChange={handleChangePeriodStatus}
        showSnackbar={showSnackbar}
      />


     

      {/* Action Bar */}
      <div className="bg-blue-50 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center mb-6 border border-blue-200 gap-4">
        <div className="text-sm text-blue-900 font-medium">
          <span className="font-black">نکته مهم:</span> دکمه بروزرسانی، ساعات کاری را از
          دستگاه بازخوانی می‌کند.{' '}
          <span className="text-red-600 font-bold">ردیف‌های دستی حذف نمی‌شوند.</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={payrollLoading || !canManageRows}
          className={`px-4 py-2 rounded-lg shadow text-sm font-bold transition w-full md:w-auto ${
            !canManageRows
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-700 hover:bg-blue-800 text-white'
          }`}
        >
          {payrollLoading ? 'در حال پردازش...' : '🔄 بروزرسانی از سیستم حضور و غیاب'}
        </button>
      </div>

      {/* Batch Action Bar */}
      {isManager && selectedRows.length > 0 && currentPeriod && !currentPeriod.is_final && (
        <div className="bg-green-50 border-2 border-green-300 p-4 rounded-xl mb-6 shadow-md">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <span className="text-sm font-bold text-green-900">
              ✅ {selectedRows.length} ردیف انتخاب شده
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBatchApprove}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md transition"
                disabled={payrollLoading}
              >
                تایید نهایی انتخابی‌ها
              </button>
              <button
                onClick={() => setSelectedRows([])}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-sm"
              >
                لغو انتخاب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Form */}
        {canManageRows && !currentPeriod.is_final && (
        <div className="bg-gray-100 p-5 rounded-xl border border-gray-300 mb-6 shadow-inner">
          <p className="text-black font-bold mb-3 flex items-center gap-2">
            <span className="bg-green-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">+</span>
            افزودن دستی (پاداش / پیمانکار / خرید):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <input
              placeholder="نام و نام خانوادگی *"
              value={newRow.full_name}
              onChange={(e) => setNewRow({ ...newRow, full_name: e.target.value })}
              className="md:col-span-2 border border-gray-400 p-2 rounded text-sm text-black placeholder-gray-500 font-medium focus:border-blue-600 outline-none"
            />

            <input
              placeholder="کد ملی"
              value={newRow.national_id}
              onChange={(e) => setNewRow({ ...newRow, national_id: e.target.value })}
              className="md:col-span-2 border border-gray-400 p-2 rounded text-sm text-center text-black placeholder-gray-500 font-medium focus:border-blue-600 outline-none"
            />

            {/* ✅ Dropdown نوع رابطه (جدید) */}
            <select
              value={newRow.relation_type}
              onChange={(e) => setNewRow({ ...newRow, relation_type: e.target.value })}
              className="md:col-span-2 border border-gray-400 p-2 rounded text-sm text-black font-medium focus:border-blue-600 outline-none bg-white"
            >
              <option value="EMPLOYEE">👷 کارمند / کارگر</option>
              <option value="CONTRACTOR">📄 پیمانکار</option>
              <option value="SUPPLIER">🏪 تامین‌کننده</option>
              <option value="RETURN">↩️ برگشتی</option>
            </select>

            <div className="md:col-span-2 relative">
              <input
                placeholder="شماره شبا (بدون IR)"
                value={newRow.shaba_number}
                onChange={(e) => setNewRow({ ...newRow, shaba_number: e.target.value })}
                className="w-full border border-gray-400 p-2 pl-8 rounded text-sm text-center text-black placeholder-gray-500 font-medium focus:border-blue-600 outline-none"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">IR</span>
            </div>

            <input
              placeholder="شماره کارت"
              value={newRow.card_number}
              onChange={(e) => setNewRow({ ...newRow, card_number: e.target.value })}
              className="md:col-span-2 border border-gray-400 p-2 rounded text-sm text-center text-black placeholder-gray-500 font-medium focus:border-blue-600 outline-none"
            />

            <input
              placeholder="بابت / توضیحات"
              value={newRow.description}
              onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
              className="md:col-span-2 border border-gray-400 p-2 rounded text-sm text-black placeholder-gray-500 font-medium focus:border-blue-600 outline-none"
            />

            <input
              placeholder="مبلغ (تومان)"
              value={newRow.monthly_amount}
              onChange={(e) => setNewRow({ ...newRow, monthly_amount: e.target.value })}
              className="md:col-span-12 border border-gray-400 p-2 rounded text-sm text-left ltr text-black placeholder-gray-500 font-bold focus:border-blue-600 outline-none"
            />

            <button
              onClick={handleAddNewRow}
              className="md:col-span-12 w-full mt-2 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg text-sm font-bold shadow transition"
            >
              افزودن به لیست
            </button>
          </div>
        </div>
      )}


      {/* Table */}
      <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm bg-white pb-20">
        <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-200 text-black border-b border-gray-300 text-xs md:text-sm font-black">
                {isManager && !currentPeriod.is_final && (
                  <th className="px-2 py-3 text-center w-10">
                    {selectedRows.length > 0 && (
                      <span className="text-xs font-bold text-blue-700">
                        {selectedRows.length}
                      </span>
                    )}
                  </th>
                )}
                <th className="px-4 py-3 text-right w-12">#</th>
                <th className="px-3 py-3 text-center w-24">مرحله</th>
                <th className="px-3 py-3 text-center w-32">نوع رابطه</th> {/* ← جدید */}
                <th className="px-4 py-3 text-right">نام شخص</th>
                <th className="px-4 py-3 text-center">کد ملی</th>
                <th className="px-4 py-3 text-right">بابت</th>
                <th className="px-4 py-3 text-center w-48">حساب / کارت</th>
                <th className="px-4 py-3 text-left">مبلغ ماهانه</th>
                <th className="px-4 py-3 text-left text-blue-800" title="منفی = بدهی، مثبت = طلب">
                  مانده پیشین <span className="text-[10px] bg-blue-200 px-1 rounded text-black font-normal">(+/-)</span>
                </th>
                <th className="px-4 py-3 text-left text-green-800">قابل پرداخت</th>
                <th className="px-4 py-3 text-center">عملیات</th>
              </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {items.map((row, index) => {
              const isEditing = editingId === row.id;
              const liveFinal = isEditing
                ? (Number(row.monthly_amount) || 0) + (Number(row.opening_balance) || 0)
                : row.final_amount;

              const disabledStyle = 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200';
              const activeStyle = 'bg-white text-black border-blue-400';

              const isRowFinal = row.stage === 'FINAL';
              const canEditRow =
                (canManageRows || canEditFinance) && !isRowFinal && !isPeriodFinal;

              return (
                <tr key={row.id} className="hover:bg-gray-50 transition">
                  {/* Checkbox */}
                  {isManager && !currentPeriod.is_final && (
                    <td className="px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows([...selectedRows, row.id]);
                          } else {
                            setSelectedRows(selectedRows.filter((id) => id !== row.id));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                  )}

                  {/* Row Number + Source Badge */}
                  <td className="px-4 py-2 text-center text-gray-500 align-middle">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="font-bold">{index + 1}</span>
                      {row.source === 'MANUAL' ? (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-bold whitespace-nowrap">
                          ✍️ دستی
                        </span>
                      ) : (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-bold whitespace-nowrap">
                          🤖 سیستمی
                        </span>
                      )}
                    </div>
                  </td>

                 {/* Stage Badge */}
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                      STAGE_COLORS[row.stage] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {STAGE_LABELS[row.stage] || row.stage}
                    </span>
                  </td>

                  {/* ✅ Relation Type Badge (جدید) */}
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                      row.relation_type === 'EMPLOYEE' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : row.relation_type === 'CONTRACTOR'
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : row.relation_type === 'SUPPLIER'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {row.relation_type === 'EMPLOYEE' ? '👷 کارمند' :
                      row.relation_type === 'CONTRACTOR' ? '📄 پیمانکار' :
                      row.relation_type === 'SUPPLIER' ? '🏪 تامین‌کننده' :
                      row.relation_type === 'RETURN' ? '↩️ برگشتی' :
                      row.relation_type}
                    </span>
                  </td>


                  {/* Full Name */}
                  <td className="px-4 py-2">
                    {isEditing ? (
                      <input
                        disabled={!canEditRow}
                        className={`border rounded w-full p-1 font-medium ${
                          !canEditRow ? disabledStyle : activeStyle
                        }`}
                        value={row.full_name}
                        onChange={(e) =>
                          handleLocalChange(row.id, 'full_name', e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-black font-bold block">{row.full_name}</span>
                    )}
                  </td>

                  {/* National ID */}
                  <td className="px-4 py-2 text-center">
                    {isEditing ? (
                      <input
                        disabled={!canEditRow}
                        className={`border rounded w-full p-1 text-xs text-center ${
                          !canEditRow ? disabledStyle : activeStyle
                        }`}
                        placeholder="کد ملی"
                        value={row.national_id}
                        onChange={(e) =>
                          handleLocalChange(row.id, 'national_id', e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-gray-600 font-mono text-xs">
                        {row.national_id || '-'}
                      </span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-2 max-w-xs truncate" title={row.description}>
                    {isEditing ? (
                      <input
                        disabled={!canEditRow}
                        className={`border rounded w-full p-1 ${
                          !canEditRow ? disabledStyle : activeStyle
                        }`}
                        value={row.description}
                        onChange={(e) =>
                          handleLocalChange(row.id, 'description', e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-black">{row.description}</span>
                    )}
                  </td>

                  {/* Bank Info */}
                  <td className="px-4 py-2 text-center align-middle">
                    {isEditing ? (
                      <textarea
                        rows={2}
                        disabled={!canEditRow}
                        className={`border rounded w-full p-1 text-center text-xs font-mono resize-none ${
                          !canEditRow ? disabledStyle : activeStyle
                        }`}
                        value={row.bank_account_number}
                        onChange={(e) =>
                          handleLocalChange(row.id, 'bank_account_number', e.target.value)
                        }
                      />
                    ) : (
                      renderBankInfo(row.bank_account_number)
                    )}
                  </td>

                  {/* Monthly Amount */}
                  <td className="px-4 py-2 text-left">
                    {isEditing ? (
                      <input
                        disabled={!canEditRow}
                        className={`border rounded w-24 p-1 text-left ltr font-bold ${
                          !canEditRow ? disabledStyle : activeStyle
                        }`}
                        value={row.monthly_amount}
                        onChange={(e) =>
                          handleLocalChange(row.id, 'monthly_amount', e.target.value)
                        }
                      />
                    ) : (
                      <span className="text-black font-bold">
                        {Number(row.monthly_amount).toLocaleString()}
                      </span>
                    )}
                  </td>

                  {/* Opening Balance */}
                  <td className="px-4 py-2 text-left">
                    {isEditing ? (
                      <input
                        disabled={!canEditFinance || isRowFinal || isPeriodFinal}
                        className={`border rounded w-24 p-1 text-left ltr font-bold ${
                          !canEditFinance || isRowFinal || isPeriodFinal
                            ? disabledStyle
                            : row.opening_balance < 0
                            ? 'text-red-700 bg-red-50 border-red-300'
                            : 'text-blue-800 bg-blue-50 border-blue-300'
                        }`}
                        value={row.opening_balance}
                        placeholder="0"
                        onChange={(e) =>
                          handleLocalChange(row.id, 'opening_balance', e.target.value)
                        }
                      />
                    ) : (
                      <span
                        dir="ltr"
                        className={`font-bold font-mono ${
                          row.opening_balance < 0 ? 'text-red-600' : 'text-blue-700'
                        }`}
                      >
                        {Number(row.opening_balance).toLocaleString()}
                      </span>
                    )}
                  </td>

                  {/* Final Amount */}
                  <td className="px-4 py-2 text-left bg-green-50/50 font-black text-green-800 font-mono text-base">
                    {Number(liveFinal).toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2 text-center">
                    {isEditing ? (
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => saveRow(row)}
                          className="text-green-700 bg-green-100 hover:bg-green-200 p-1.5 rounded font-bold text-xs shadow-sm"
                          title="ذخیره"
                        >
                          💾
                        </button>
                        <button
                          onClick={cancelEditRow}
                          className="text-red-700 bg-red-100 hover:bg-red-200 p-1.5 rounded font-bold text-xs shadow-sm"
                          title="لغو"
                        >
                          ❌
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-1">
                        {/* Manager Final Approve */}
                        {isManager &&
                          row.stage === 'FINANCE_CHECK' &&
                          !currentPeriod.is_final && (
                            <button
                              onClick={() => handleSingleStageChange(row.id, 'FINAL')}
                              className="text-green-700 bg-green-100 hover:bg-green-200 p-1.5 rounded font-bold text-xs shadow-sm"
                              title="تایید نهایی"
                            >
                              ✅
                            </button>
                          )}

                        {/* Supervisor Confirm */}
                        {/* برای ITEM */}
                        {isSupervisor && row.stage === 'DRAFT' && !currentPeriod.is_final && (
                          <button onClick={() => handleSingleStageChange(row.id, 'SUPERVISOR_CONFIRMED')}>
                            👤
                          </button>
                        )}

                        {isAccountant && row.stage === 'SUPERVISOR_CONFIRMED' && !currentPeriod.is_final && (
                          <button onClick={() => handleSingleStageChange(row.id, 'FINANCE_CHECK')}>
                            💰
                          </button>
                        )}


                        {/* Accountant Finance Check */}
                        {isAccountant &&
                          row.stage === 'SUPERVISOR_CONFIRMED' &&
                          !currentPeriod.is_final && (
                            <button
                              onClick={() => handleSingleStageChange(row.id, 'FINANCE_CHECK')}
                              className="text-blue-700 bg-blue-100 hover:bg-blue-200 p-1.5 rounded font-bold text-xs shadow-sm"
                              title="بررسی مالی"
                            >
                              💰
                            </button>
                          )}

                        {/* Edit Button */}
                        {(canManageRows || canEditFinance) &&
                          !isRowFinal &&
                          !isPeriodFinal && (
                            <button
                              onClick={() => startEditRow(row)}
                              className="text-blue-700 hover:text-blue-900 font-bold text-sm"
                              title="ویرایش"
                            >
                              ✏️
                            </button>
                          )}

                        {/* Delete Button */}
                        {canManageRows &&
                          (!isPeriodFinal || isManager) &&
                          (row.stage !== 'FINAL' || isManager) && (
                            <button
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-red-600 hover:text-red-800 font-bold text-sm"
                              title="حذف"
                            >
                              🗑
                            </button>
                          )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollDetailView;
