// src/components/admin/FinancialSummaryCard.jsx
import React from 'react';
import { calculateTotalMonthlyIncome, formatCurrency } from '../../utils/contractCalculations';
import { formatNumberPersian } from '../../utils/numberUtils';

const FinancialSummaryCard = ({ contracts, schemeContracts }) => {
  const { total, breakdown } = calculateTotalMonthlyIncome(contracts, schemeContracts);

  if (breakdown.length === 0) {
    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-6 text-center">
        <div className="text-4xl mb-2 opacity-50">💰</div>
        <p className="text-gray-500">هیچ قرارداد فعالی وجود ندارد</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-2 border-green-700/50 rounded-2xl p-6 shadow-2xl">
      {/* هدر */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-green-700/30">
        <h3 className="text-green-400 font-bold text-xl flex items-center gap-2">
          <span className="text-2xl">💵</span>
          خلاصه مالی ماهانه
        </h3>
        <span className="text-xs text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
          {breakdown.length} قرارداد فعال
        </span>
      </div>

      {/* لیست قراردادها */}
      <div className="space-y-3 mb-6">
        {breakdown.map((item, index) => (
          <div 
            key={item.contractId} 
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50 hover:border-green-500/30 transition-all"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-medium">{item.label}</span>
                  {item.hasScheme && (
                    <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-700/50">
                      ✓ طرح طبقه‌بندی
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {item.type === 'EMPLOYMENT' ? '🏛️ استخدامی' : '🔨 پیمانکاری'}
                </p>
              </div>
              <div className="text-left">
                <div className="font-mono text-green-400 font-bold">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-xs text-gray-500">ریال/ماه</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* جمع کل */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-green-100 text-sm mb-1">💰 جمع کل درآمد ماهانه</p>
            <p className="text-white/80 text-xs">
              {formatNumberPersian(total)} ریال
            </p>
          </div>
          <div className="text-left">
            <div className="font-mono text-3xl font-bold text-white">
              {formatCurrency(total)}
            </div>
            <div className="text-sm text-green-100">ریال / ماه</div>
          </div>
        </div>
      </div>

      {/* نکات */}
      <div className="mt-4 pt-4 border-t border-green-700/30">
        <p className="text-xs text-gray-400 flex items-start gap-2">
          <span>ℹ️</span>
          <span>
            این مبلغ شامل جمع تمام قراردادهای فعال است. 
            {breakdown.some(b => b.hasScheme) && ' قراردادهای دارای طرح طبقه‌بندی شامل مزایا (مسکن، خواروبار، اولاد و...) می‌باشند.'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default FinancialSummaryCard;
