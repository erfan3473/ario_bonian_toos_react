import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchStatementDetails } from '../features/statements/statementSlice';

const StatementDetailScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { data: statement, loading, error } = useSelector(
    (state) => state.statements.currentStatement
  );

  useEffect(() => {
    dispatch(fetchStatementDetails(id));
  }, [dispatch, id]);

  const formatCurrency = (amount) => Number(amount).toLocaleString('fa-IR');
  const getMonthName = (m) => ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"][m - 1] || m;

  if (loading) return <div className="text-center text-blue-400 py-20 animate-pulse">در حال دریافت اطلاعات...</div>;
  if (error) return <div className="text-center text-red-400 py-20">{error}</div>;
  if (!statement) return null;

  // جمع کل درآمد این صورت‌وضعیت
  const totalAmount = statement.workers_summary?.reduce((acc, w) => acc + w.total_earned, 0) || 0;

  return (
    <div className="container mx-auto px-4 py-6 rtl font-vazir">
      <button onClick={() => navigate(-1)} className="mb-4 text-gray-400 hover:text-white flex items-center gap-1 text-sm">➡️ بازگشت</button>

      {/* هدر */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">صورت‌وضعیت {statement.project_name}</h1>
          <p className="text-gray-400">
            دوره: <span className="text-yellow-400 font-bold">{statement.year} / {getMonthName(statement.month)}</span>
            <span className="mx-2">|</span>
            وضعیت: <span className="text-blue-300 bg-blue-900/30 px-2 rounded text-sm">{statement.status_display}</span>
          </p>
        </div>
        <div className="text-left">
           <div className="text-sm text-gray-400">مبلغ قابل پرداخت (تخمین):</div>
           <div className="text-3xl font-mono font-bold text-green-400">{formatCurrency(totalAmount)} <span className="text-sm">تومان</span></div>
        </div>
      </div>

      {/* لیست کارگران */}
      <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-white">👷 ریز کارکرد پرسنل</h3>
            <span className="text-xs text-gray-400">تعداد: {statement.total_workers_count} نفر</span>
        </div>
        <table className="w-full text-right text-sm">
            <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                <tr>
                    <th className="px-6 py-3">نام / سمت</th>
                    <th className="px-6 py-3">اطلاعات بانکی</th> {/* ✅ ستون جدید */}
                    <th className="px-6 py-3 text-center">روز کارکرد</th>
                    <th className="px-6 py-3 text-center">ساعت کل</th>
                    <th className="px-6 py-3 text-center text-yellow-500">درآمد (تومان)</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 text-gray-300">
                {statement.workers_summary?.map((worker) => (
                    <tr key={worker.worker_id} className="hover:bg-gray-800/50">
                        {/* نام و سمت */}
                        <td className="px-6 py-4">
                            <div className="font-bold text-white">{worker.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{worker.position}</div>
                        </td>

                        {/* ✅ اطلاعات بانکی */}
                        <td className="px-6 py-4 text-xs">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 w-8">ملی:</span>
                                    <span className="text-gray-300 font-mono">{worker.code_meli || '---'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 w-8">شبا:</span>
                                    <span className="text-gray-300 font-mono select-all">
                                        {worker.shaba_number ? `IR${worker.shaba_number}` : '---'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-500 w-8">حساب:</span>
                                    <span className="text-gray-300 font-mono select-all">{worker.bank_account_number || '---'}</span>
                                </div>
                            </div>
                        </td>

                        <td className="px-6 py-4 text-center">{worker.days_worked}</td>
                        <td className="px-6 py-4 text-center font-mono">{worker.total_hours.toFixed(1)}</td>
                        <td className="px-6 py-4 text-center font-mono text-yellow-400 font-bold">
                            {formatCurrency(worker.total_earned)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatementDetailScreen;