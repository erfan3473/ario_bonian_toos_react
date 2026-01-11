// src/screens/admin/AdminPayrollScreen.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment-jalaali';

import JalaliDatePicker from '../../components/JalaliDatePicker';
import { formatJalaliDateLong } from '../../utils/dateUtils';
import {
  fetchPeriodPayroll,
  generatePeriodPayroll,
  setPayrollRange,
  updateLocalPayrollItem,
  createManualPayrollItem,
  updatePayrollItem,
  deletePayrollItem,
} from '../../features/payroll/payrollSlice';

moment.loadPersian({ usePersianDigits: false });

const AdminPayrollScreen = () => {
  const dispatch = useDispatch();
  const { period, items, loading, error, start, end } = useSelector(
    (state) => state.payroll
  );

  const todayGregorian = new Date().toISOString().split('T')[0];
  const todayJalali = formatJalaliDateLong(todayGregorian);

  // انتخاب بازه
  const [startDate, setStartDate] = useState(null); // YYYY-MM-DD
  const [endDate, setEndDate] = useState(null);

  // فرم ردیف جدید
  const [newRow, setNewRow] = useState({
    full_name: '',
    national_id: '',
    bank_account_number: '',
    relation_type: 'EMPLOYEE',
    description: '',
    monthly_amount: 0,
  });

  // ردیف در حال ویرایش
  const [editingId, setEditingId] = useState(null);
  const [rowBackup, setRowBackup] = useState(null);

  // snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    type: 'success', // success | error | info
    message: '',
  });

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, 3000);
  };

  const handleStartChange = (e) => {
    const gDate = e.target.value; // YYYY-MM-DD
    setStartDate(gDate || null);
  };

  const handleEndChange = (e) => {
    const gDate = e.target.value;
    setEndDate(gDate || null);
  };

  const handleFetch = async () => {
    if (!startDate || !endDate) return;
    try {
      await dispatch(
        fetchPeriodPayroll({ start: startDate, end: endDate })
      ).unwrap();
      dispatch(setPayrollRange({ start: startDate, end: endDate }));
      showSnackbar('success', 'لیست حقوق برای این بازه بروزرسانی شد.');
      setEditingId(null);
      setRowBackup(null);
    } catch (e) {
      showSnackbar('error', e || 'خطا در دریافت لیست حقوق');
    }
  };

  const handleGenerate = async () => {
    if (!startDate || !endDate) return;
    try {
      await dispatch(
        generatePeriodPayroll({ start: startDate, end: endDate })
      ).unwrap();
      dispatch(setPayrollRange({ start: startDate, end: endDate }));
      showSnackbar('success', 'ردیف‌های حقوق از حضور برای این بازه تولید/به‌روزرسانی شد.');
      setEditingId(null);
      setRowBackup(null);
    } catch (e) {
      showSnackbar('error', e || 'خطا در تولید لیست از حضور');
    }
  };

  // ویرایش لوکال مبلغ
  const handleAmountChange = (id, value) => {
    const parsed = value === '' ? 0 : Number(value.replace(/,/g, '')) || 0;
    dispatch(updateLocalPayrollItem({ id, changes: { monthly_amount: parsed } }));
  };

  const handleTextChange = (id, field, value) => {
    dispatch(updateLocalPayrollItem({ id, changes: { [field]: value } }));
  };

  const handleNewRowChange = (field, value) => {
    setNewRow((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewRowAmountChange = (value) => {
    const parsed = value === '' ? 0 : Number(value.replace(/,/g, '')) || 0;
    setNewRow((prev) => ({ ...prev, monthly_amount: parsed }));
  };

  const handleAddNewRow = async () => {
    if (!period) return;
    if (!newRow.full_name.trim()) return;

    try {
      await dispatch(
        createManualPayrollItem({
          periodId: period.id,
          payload: {
            full_name: newRow.full_name.trim(),
            national_id: newRow.national_id || '',
            bank_account_number: newRow.bank_account_number || '',
            relation_type: newRow.relation_type,
            description: newRow.description || '',
            monthly_amount: newRow.monthly_amount || 0,
          },
        })
      ).unwrap();

      showSnackbar('success', 'ردیف جدید با موفقیت اضافه شد.');

      setNewRow({
        full_name: '',
        national_id: '',
        bank_account_number: '',
        relation_type: 'EMPLOYEE',
        description: '',
        monthly_amount: 0,
      });
    } catch (e) {
      showSnackbar('error', e || 'خطا در ایجاد ردیف جدید');
    }
  };

  // شروع ویرایش ردیف
  const startEditRow = (row) => {
    setEditingId(row.id);
    setRowBackup({ ...row });
  };

  // لغو ویرایش ردیف
  const cancelEditRow = () => {
    if (rowBackup) {
      dispatch(
        updateLocalPayrollItem({
          id: rowBackup.id,
          changes: rowBackup,
        })
      );
    }
    setEditingId(null);
    setRowBackup(null);
  };

  // ذخیره ردیف
  const saveRow = async (row) => {
    try {
      await dispatch(
        updatePayrollItem({
          itemId: row.id,
          payload: {
            full_name: row.full_name,
            national_id: row.national_id,
            bank_account_number: row.bank_account_number,
            relation_type: row.relation_type,
            description: row.description,
            monthly_amount: row.monthly_amount,
          },
        })
      ).unwrap();
      showSnackbar('success', 'ردیف با موفقیت ذخیره شد.');
      setEditingId(null);
      setRowBackup(null);
    } catch (e) {
      showSnackbar('error', e || 'خطا در ذخیره ردیف');
    }
  };

  // حذف ردیف
  const handleDeleteRow = async (rowId) => {
    if (!window.confirm('آیا از حذف این ردیف مطمئن هستید؟')) return;
    try {
      await dispatch(deletePayrollItem(rowId)).unwrap();
      showSnackbar('success', 'ردیف با موفقیت حذف شد.');
      if (editingId === rowId) {
        setEditingId(null);
        setRowBackup(null);
      }
    } catch (e) {
      showSnackbar('error', e || 'خطا در حذف ردیف');
    }
  };

  // متن وضعیت فرم (فعلاً ساده)
  const currentStageText = period
    ? 'مرحله فعلی: پیش‌نویس سرپرست (در حال تکمیل)'
    : 'دوره‌ای انتخاب نشده است';

  const currentPeriodText = period
    ? `دوره حقوق: از ${formatJalaliDateLong(period.start_date)} تا ${formatJalaliDateLong(
        period.end_date
      )}`
    : '—';

  // رنگ snackbar
  const snackbarColors =
    snackbar.type === 'success'
      ? 'bg-green-600 text-white'
      : snackbar.type === 'error'
      ? 'bg-red-600 text-white'
      : 'bg-gray-800 text-white';

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white relative">
      {/* Snackbar */}
      {snackbar.open && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div
            className={`${snackbarColors} px-4 py-2 rounded-full shadow-lg text-xs md:text-sm`}
          >
            {snackbar.message}
          </div>
        </div>
      )}

      {/* کارت وضعیت بالا */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-1">
          <span className="text-xs text-gray-500">امروز</span>
          <span className="text-lg font-semibold text-gray-800">
            {todayJalali}
          </span>
          <span className="text-xs text-gray-500">
            (فقط برای اطلاع، روی انتخاب بازه تأثیر ندارد)
          </span>
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-1">
          <span className="text-xs text-gray-500">دوره انتخاب‌شده</span>
          <span className="text-lg font-semibold text-gray-800">
            {currentPeriodText}
          </span>
          {period && (
            <span className="text-xs text-gray-500">
              (میلادی: از {period.start_date} تا {period.end_date})
            </span>
          )}
        </div>
        <div className="border border-gray-200 rounded-xl p-4 bg-blue-50 flex flex-col gap-1">
          <span className="text-xs text-blue-600">وضعیت فرم حقوق</span>
          <span className="text-sm font-semibold text-blue-800">
            {currentStageText}
          </span>
          <span className="text-xs text-blue-600">
            این فرم برای تکمیل «بابت» و «مبلغ این ماه» توسط سرپرست کارگاه است.
          </span>
        </div>
      </div>

      {/* عنوان اصلی */}
      <div className="mb-4 flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          💰 فرم حقوق دوره‌ای (سرپرست کارگاه)
        </h1>
      </div>

      {/* فیلتر و اکشن‌ها */}
      <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="min-w-[220px]">
            <JalaliDatePicker
              name="start"
              label="تاریخ شروع دوره حقوق"
              value={startDate}
              onChange={handleStartChange}
              modal
            />
          </div>
          <div className="min-w-[220px]">
            <JalaliDatePicker
              name="end"
              label="تاریخ پایان دوره حقوق"
              value={endDate}
              onChange={handleEndChange}
              modal
            />
          </div>

          <div className="flex items-end gap-3">
            <button
              onClick={handleFetch}
              disabled={!startDate || !endDate || loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              فقط دریافت لیست
            </button>
            <button
              onClick={handleGenerate}
              disabled={!startDate || !endDate || loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              تولید/به‌روزرسانی از حضور
            </button>
          </div>
        </div>
      </div>

      {/* خطای عمومی از slice */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mb-4 text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="text-center py-8 text-sm text-blue-600">
          در حال پردازش لیست حقوق...
        </div>
      )}

      {/* فرم افزودن ردیف جدید */}
      {period && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            افزودن ردیف جدید (مثلاً تأمین‌کننده یا پیمانکار)
          </p>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <input
              type="text"
              placeholder="نام و نام خانوادگی"
              value={newRow.full_name}
              onChange={(e) => handleNewRowChange('full_name', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
            />
            <input
              type="text"
              placeholder="کد ملی"
              value={newRow.national_id}
              onChange={(e) =>
                handleNewRowChange('national_id', e.target.value)
              }
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
            />
            <input
              type="text"
              placeholder="شماره حساب / شبا"
              value={newRow.bank_account_number}
              onChange={(e) =>
                handleNewRowChange('bank_account_number', e.target.value)
              }
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
            />
            <select
              value={newRow.relation_type}
              onChange={(e) =>
                handleNewRowChange('relation_type', e.target.value)
              }
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
            >
              <option value="EMPLOYEE">کارمند/کارگر</option>
              <option value="CONTRACTOR">پیمانکار</option>
              <option value="SUPPLIER">تأمین‌کننده/فروشنده</option>
            </select>
            <input
              type="text"
              placeholder="بابت"
              value={newRow.description}
              onChange={(e) =>
                handleNewRowChange('description', e.target.value)
              }
              className="border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800"
            />
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="مبلغ این ماه"
                value={newRow.monthly_amount || 0}
                onChange={(e) => handleNewRowAmountChange(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white text-gray-800 text-left"
              />
              <button
                type="button"
                onClick={handleAddNewRow}
                disabled={!newRow.full_name.trim() || loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
              >
                افزودن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* جدول فرم سرپرست */}
      {!loading && period && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm border border-gray-200 rounded-lg overflow-hidden bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-2 py-2 text-center">نام و نام خانوادگی</th>
                <th className="px-2 py-2 text-center">کد ملی</th>
                <th className="px-2 py-2 text-center">شماره حساب</th>
                <th className="px-2 py-2 text-center">نوع رابطه</th>
                <th className="px-2 py-2 text-center">بابت</th>
                <th className="px-2 py-2 text-center">مبلغ این ماه</th>
                <th className="px-2 py-2 text-center">اقدام‌ها</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-gray-400"
                  >
                    هنوز ردیفی برای این دوره ثبت نشده است.
                  </td>
                </tr>
              ) : (
                items.map((row, idx) => {
                  const isAlt = idx % 2 === 0;
                  const isEditing = editingId === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={isAlt ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.full_name || ''}
                          onChange={(e) =>
                            handleTextChange(row.id, 'full_name', e.target.value)
                          }
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.national_id || ''}
                          onChange={(e) =>
                            handleTextChange(
                              row.id,
                              'national_id',
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.bank_account_number || ''}
                          onChange={(e) =>
                            handleTextChange(
                              row.id,
                              'bank_account_number',
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-2 py-1 text-center text-gray-600">
                        {row.relation_type === 'EMPLOYEE'
                          ? 'کارمند/کارگر'
                          : row.relation_type === 'CONTRACTOR'
                          ? 'پیمانکار'
                          : row.relation_type === 'SUPPLIER'
                          ? 'تأمین‌کننده'
                          : row.relation_type}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.description || ''}
                          onChange={(e) =>
                            handleTextChange(
                              row.id,
                              'description',
                              e.target.value
                            )
                          }
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.monthly_amount || 0}
                          onChange={(e) =>
                            handleAmountChange(row.id, e.target.value)
                          }
                          disabled={!isEditing}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-left bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        {!isEditing ? (
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => startEditRow(row)}
                              className="text-blue-600 text-xs px-2 py-1 border border-blue-200 rounded hover:bg-blue-50"
                            >
                              ✏️ ویرایش
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="text-red-600 text-xs px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                            >
                              🗑 حذف
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => saveRow(row)}
                              className="text-green-700 text-xs px-2 py-1 border border-green-200 rounded hover:bg-green-50"
                            >
                              💾 ذخیره
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditRow}
                              className="text-gray-600 text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50"
                            >
                              ❌ لغو
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !period && (
        <div className="text-center text-gray-500 py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 mt-6">
          <div className="text-5xl mb-3">💳</div>
          <p className="text-base">
            ابتدا تاریخ شروع و پایان دوره را انتخاب کنید و روی
            «فقط دریافت لیست» یا «تولید از حضور» بزنید.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminPayrollScreen;
