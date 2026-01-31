 {/* Period Status Management (Manager Only) */}
      {isManager && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-bold text-gray-700 text-sm">مدیریت وضعیت کل دوره</p>
                <p className="text-xs text-gray-500">تغییر وضعیت کل پرونده حقوقی</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
            {/* 1️⃣ دکمه برگشت (فقط برای مدیر، اگر قفل نیست) */}
            {currentPeriod.status !== 'DRAFT' && !currentPeriod.is_final && (
              <button
                onClick={() => handleChangePeriodStatus('DRAFT')}
                disabled={payrollLoading}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                🔙 برگشت به پیش‌نویس
              </button>
            )}

            {/* 2️⃣ تایید سرپرست → SUPERVISOR_CONFIRMED */}
            {currentPeriod.status === 'DRAFT' && (
              <button
                onClick={() => handleChangePeriodStatus('SUPERVISOR_DONE')}
                disabled={payrollLoading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                👤 تایید سرپرست
              </button>
            )}
            

            {/* 3️⃣ ارسال به بررسی مالی */}
            {currentPeriod.status === 'SUPERVISOR_DONE' && (
              <button
                onClick={() => handleChangePeriodStatus('FINANCE_CHECK')}
                disabled={payrollLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                💰 ارسال به بررسی مالی
              </button>
            )}

            {/* 4️⃣ تایید نهایی و قفل */}
            {currentPeriod.status === 'FINANCE_CHECK' && !currentPeriod.is_final && (
              <button
                onClick={() => handleChangePeriodStatus('FINAL')}
                disabled={payrollLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                ✅ تایید نهایی → آماده پرداخت (قفل)
              </button>
            )}

            {/* 5️⃣ نمایش Badge قفل شده */}
            {currentPeriod.is_final && (
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold text-sm border-2 border-green-300 flex items-center gap-2">
                <span>🔒</span>
                <span>دوره قفل و آماده پرداخت</span>
              </div>
            )}

            {/* 6️⃣ دکمه باز کردن قفل (فقط برای مدیر) */}
            {currentPeriod.is_final && isManager && (
              <button
                onClick={() => {
                  if (window.confirm('⚠️ قفل دوره باز شود؟ (خطرناک!)')) {
                    dispatch(
                      changePeriodStatus({
                        periodId: currentPeriod.id,
                        status: currentPeriod.status, // حفظ status فعلی
                        is_final: false, // فقط قفل را باز کن
                      })
                    ).unwrap()
                      .then(() => showSnackbar('success', 'قفل دوره باز شد'))
                      .catch((e) => showSnackbar('error', e || 'خطا'));
                  }
                }}
                disabled={payrollLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                🔓 باز کردن قفل (مدیر)
              </button>
            )}
          </div>

          </div>
        </div>
      )}