// src/components/reports/ProjectCoefficientsTab.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../api/axiosInstance';
import {
  CalculatorIcon,
  CheckIcon,
  InformationCircleIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const formatRial = (val) => toPersianDigits(Number(val || 0).toLocaleString('en-US'));

const COEFF_GUIDE = [
  {
    type: 'OVERHEAD',
    title: 'ضریب بالاسری',
    stepLabel: 'مرحله ۱ (ضربی)',
    mode: 'MULTIPLIER',
    defaultVal: '1.3000',
    description:
      'پوشش هزینه‌های عمومی، اداری، بیمه، مالیات پیمانکار و سود. در سال ۱۴۰۴ برای طرح عمرانی (مناقصه) ۱.۳۰، ترک تشریفات ۱.۲۰ و طرح غیرعمرانی ۱.۴۱ است.',
    presets: [
      { label: '۱.۳۰ (عمرانی مناقصه)', value: '1.3000' },
      { label: '۱.۲۰ (عمرانی ترک تشریفات)', value: '1.2000' },
      { label: '۱.۴۱ (غیرعمرانی مناقصه)', value: '1.4100' },
      { label: '۱.۰۰ (بدون بالاسری)', value: '1.0000' },
    ],
  },
  {
    type: 'REGIONAL',
    title: 'ضریب منطقه‌ای',
    stepLabel: 'مرحله ۱ (ضربی)',
    mode: 'MULTIPLIER',
    defaultVal: '1.0000',
    description:
      'بر اساس شهرستان و بخش محل اجرای پروژه (پیوست ۴ فهرست بها) تعیین می‌شود تا تفاوت هزینه حمل و نیرو در مناطق مختلف جبران شود.',
    presets: [
      { label: '۱.۰۰ (مناطق عادی / مشهد)', value: '1.0000' },
      { label: '۱.۰۵', value: '1.0500' },
      { label: '۱.۱۰', value: '1.1000' },
    ],
  },
  {
    type: 'FLOOR',
    title: 'ضریب طبقات',
    stepLabel: 'مرحله ۱ (ضربی)',
    mode: 'MULTIPLIER',
    defaultVal: '1.0000',
    description:
      'بابت صعوبت کار در ارتفاع و طبقات (پیوست ۲ فهرست بها). برای پروژه‌های یک‌طبقه یا محوطه همان ۱.۰۰ (خنثی) است.',
    presets: [
      { label: '۱.۰۰ (بدون ضریب طبقات)', value: '1.0000' },
      { label: '۱.۰۳', value: '1.0300' },
      { label: '۱.۰۵', value: '1.0500' },
    ],
  },
  {
    type: 'EQUIPMENT',
    title: 'تجهیز و برچیدن کارگاه',
    stepLabel: 'مرحله ۲ (جمع با مبلغ)',
    mode: 'ADDITIVE',
    defaultVal: '0.0400',
    description:
      'هزینه استقرار کانکس، انبار، آب و برق موقت و برچیدن کارگاه (سقف رسمی ۴٪ = 0.04 از مبلغ پایه، یا مبلغ مقطوع ریالی). مشمول بالاسری نمی‌شود.',
    presets: [
      { label: '۴٪ (0.04 - سقف رسمی)', value: '0.0400', is_percentage: true },
      { label: '۲٪ (0.02)', value: '0.0200', is_percentage: true },
      { label: '۰٪ (ندارد)', value: '0.0000', is_percentage: true },
    ],
  },
  {
    type: 'TRANSPORTATION',
    title: 'هزینه حمل اضافه',
    stepLabel: 'مرحله ۲ (جمع با مبلغ)',
    mode: 'ADDITIVE',
    defaultVal: '0.0000',
    description:
      'در صورتی که حمل مصالح مازاد بر ۳۰ کیلومتر پیش‌بینی‌شده در فهرست بها باشد، به صورت درصدی (مثلاً 0.02) یا مبلغ ثابت ریالی وارد می‌شود.',
    presets: [
      { label: '۰ (ندارد)', value: '0.0000', is_percentage: true },
      { label: '۲٪ (0.02)', value: '0.0200', is_percentage: true },
    ],
  },
  {
    type: 'BID',
    title: 'ضریب پیشنهادی پیمانکار (پلوس / مینوس)',
    stepLabel: 'مرحله ۳ (ضربی)',
    mode: 'MULTIPLIER',
    defaultVal: '1.0000',
    description:
      'تخفیف (مینوس) یا افزایش (پلوس) پیشنهادی در مناقصه. مثلاً ۵٪ تخفیف می‌شود 0.95، بدون تغییر 1.00 و ۱۰٪ پلوس می‌شود 1.10.',
    presets: [
      { label: '۰.۹۵ (۵٪ تخفیف / مینوس)', value: '0.9500' },
      { label: '۱.۰۰ (نت / برابر برآورد)', value: '1.0000' },
      { label: '۱.۱۰ (۱۰٪ پلوس)', value: '1.1000' },
    ],
  },
  {
    type: 'ADJUSTMENT',
    title: 'ضریب تعدیل',
    stepLabel: 'مرحله ۳ (ضربی)',
    mode: 'MULTIPLIER',
    defaultVal: '1.0000',
    description:
      'شاخص جبران تورم بین فصل مبنای قرارداد و فصل اجرای کار (در قراردادهای مشمول تعدیل). اگر پروژه مشمول تعدیل نیست روی ۱.۰۰ بگذارید.',
    presets: [
      { label: '۱.۰۰ (بدون تعدیل)', value: '1.0000' },
      { label: '۱.۱۵', value: '1.1500' },
    ],
  },
  {
    type: 'TAX',
    title: 'مالیات بر ارزش افزوده',
    stepLabel: 'مرحله ۴ (درصدی نهایی)',
    mode: 'ADDITIVE',
    defaultVal: '0.1000',
    description:
      'درصد مالیات بر ارزش افزوده روی مبلغ نهایی صورت‌وضعیت. برای ۱۰٪ عدد 0.10 وارد کنید.',
    presets: [
      { label: '۱۰٪ (0.10 - نرخ قانونی)', value: '0.1000', is_percentage: true },
      { label: '۰٪ (معاف / بدون مالیات)', value: '0.0000', is_percentage: true },
    ],
  },
];

const ProjectCoefficientsTab = ({ projects = [], isDark }) => {
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects?.[0]?.id ? String(projects[0].id) : ''
  );
  const [loading, setLoading] = useState(false);
  const [savingType, setSavingType] = useState(null);
  const [existingMap, setExistingMap] = useState({}); // { OVERHEAD: { id, value, ... } }
  const [drafts, setDrafts] = useState({}); // { OVERHEAD: { value, is_percentage, is_active } }

  // ماشین‌حساب زنده
  const [sampleBaseAmount, setSampleBaseAmount] = useState('100000000');
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  useEffect(() => {
    if (!selectedProjectId && projects?.length) {
      setSelectedProjectId(String(projects[0].id));
    }
  }, [projects, selectedProjectId]);

  const loadCoefficients = useCallback(async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/reports/contract-coefficients/', {
        params: { project: projectId },
      });
      const list = Array.isArray(data) ? data : data?.results || [];
      const map = {};
      list.forEach((c) => {
        map[c.coefficient_type] = c;
      });
      setExistingMap(map);

      const nextDrafts = {};
      COEFF_GUIDE.forEach((g) => {
        const found = map[g.type];
        nextDrafts[g.type] = {
          value: found ? String(found.value) : g.defaultVal,
          is_percentage: found ? Boolean(found.is_percentage) : true,
          is_active: found ? Boolean(found.is_active) : false,
        };
      });
      setDrafts(nextDrafts);
    } catch {
      toast.error('خطا در دریافت ضرایب پروژه');
    } finally {
      setLoading(false);
    }
  }, []);

  const runCalculation = useCallback(async (projectId, amount) => {
    if (!projectId) return;
    setCalcLoading(true);
    try {
      const { data } = await axiosInstance.get('/reports/contract-coefficients/calculate/', {
        params: { project_id: projectId, base_amount: amount || 0 },
      });
      setCalcResult(data);
    } catch {
      setCalcResult(null);
    } finally {
      setCalcLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadCoefficients(selectedProjectId);
      runCalculation(selectedProjectId, sampleBaseAmount);
    }
  }, [selectedProjectId, loadCoefficients, runCalculation]);

  const updateDraft = (type, patch) => {
    setDrafts((prev) => ({
      ...prev,
      [type]: { ...prev[type], ...patch },
    }));
  };

  const handleSaveOne = async (guide) => {
    if (!selectedProjectId) return toast.error('ابتدا پروژه را انتخاب کنید.');
    const d = drafts[guide.type];
    setSavingType(guide.type);
    try {
      const payload = {
        project: Number(selectedProjectId),
        coefficient_type: guide.type,
        name: guide.title,
        value: Number(d.value || 0),
        is_percentage: d.is_percentage,
        is_active: true,
      };
      const existing = existingMap[guide.type];
      if (existing?.id) {
        await axiosInstance.patch(`/reports/contract-coefficients/${existing.id}/`, {
          ...payload,
          is_active: d.is_active,
        });
      } else {
        await axiosInstance.post('/reports/contract-coefficients/', payload);
      }
      toast.success(`«${guide.title}» ذخیره شد.`);
      await loadCoefficients(selectedProjectId);
      await runCalculation(selectedProjectId, sampleBaseAmount);
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'خطا در ذخیره ضریب');
    } finally {
      setSavingType(null);
    }
  };

  const handleDeleteOne = async (guide) => {
    const existing = existingMap[guide.type];
    if (!existing?.id) return;
    setSavingType(guide.type);
    try {
      await axiosInstance.delete(`/reports/contract-coefficients/${existing.id}/`);
      toast.success(`«${guide.title}» حذف شد.`);
      await loadCoefficients(selectedProjectId);
      await runCalculation(selectedProjectId, sampleBaseAmount);
    } catch {
      toast.error('خطا در حذف ضریب');
    } finally {
      setSavingType(null);
    }
  };

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-white';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputClass = `w-full h-9 px-3 text-xs rounded-[2px] border focus:outline-none ${
    isDark
      ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
      : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
  }`;

  return (
    <div className="space-y-4">
      {/* راهنمای کلی و انتخاب پروژه */}
      <div className={`rounded-[2px] border p-4 space-y-3 ${surfacePanel} ${borderHairline}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <InformationCircleIcon className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs leading-6">
              <div className={`font-bold ${textPrimary}`}>
                ضرایب صورت‌وضعیت فهرست بها چطور کار می‌کنند؟
              </div>
              <p className={textSecondary}>
                ابتدا جمع ردیف‌های فهرست بها در <strong>طبقات × بالاسری × منطقه‌ای</strong> ضرب می‌شود، سپس{' '}
                <strong>تجهیز کارگاه و حمل</strong> به آن اضافه می‌گردد، بعد در{' '}
                <strong>ضریب پیشنهادی (پلوس/مینوس) × تعدیل</strong> ضرب شده و در نهایت{' '}
                <strong>مالیات بر ارزش افزوده</strong> اضافه می‌شود.
              </p>
            </div>
          </div>

          <div className="min-w-[240px]">
            <label className={`block text-[11px] font-bold mb-1 ${textSecondary}`}>انتخاب پروژه</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- انتخاب پروژه --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!selectedProjectId ? (
        <div className={`rounded-[2px] border p-8 text-center text-xs ${surfacePanel} ${borderHairline} ${textSecondary}`}>
          برای مشاهده یا ویرایش ضرایب، یک پروژه انتخاب کنید.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* ستون راست: کارت‌های ضرایب با توضیح و انتخاب سریع */}
          <div className="lg:col-span-8 space-y-3">
            {loading ? (
              <div className={`rounded-[2px] border p-8 text-center text-xs ${surfacePanel} ${borderHairline} ${textSecondary}`}>
                در حال بارگذاری ضرایب پروژه...
              </div>
            ) : (
              COEFF_GUIDE.map((guide) => {
                const existing = existingMap[guide.type];
                const d = drafts[guide.type] || {
                  value: guide.defaultVal,
                  is_percentage: true,
                  is_active: false,
                };
                const isBusy = savingType === guide.type;

                return (
                  <div
                    key={guide.type}
                    className={`rounded-[2px] border p-3.5 space-y-2.5 ${surfacePanel} ${borderHairline} ${
                      existing?.is_active ? 'border-s-[3px] border-s-emerald-400' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs sm:text-sm font-bold ${textPrimary}`}>{guide.title}</span>
                        <span
                          className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold ${
                            isDark
                              ? 'bg-tactical-canvas border-slate-400/20 text-sky-300'
                              : 'bg-sky-50 border-sky-200 text-sky-800'
                          }`}
                        >
                          {guide.stepLabel}
                        </span>
                        {existing ? (
                          <span className="px-2 py-0.5 rounded-[2px] bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            ثبت‌شده
                          </span>
                        ) : (
                          <span className={`text-[10px] ${textSecondary}`}>ثبت نشده (پیش‌فرض خنثی)</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {existing && (
                          <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={d.is_active}
                              onChange={(e) => updateDraft(guide.type, { is_active: e.target.checked })}
                              className="accent-emerald-500"
                            />
                            <span>فعال</span>
                          </label>
                        )}
                        {existing && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteOne(guide)}
                            className="p-1 rounded-[2px] border border-red-500/30 text-red-400 hover:bg-red-500/15"
                            title="حذف ضریب"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className={`text-[11px] leading-5 ${textSecondary}`}>{guide.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <div className="sm:col-span-5">
                        <input
                          type="number"
                          step="0.0001"
                          value={d.value}
                          onChange={(e) => updateDraft(guide.type, { value: e.target.value })}
                          className={`${inputClass} font-mono font-bold tabular-nums`}
                        />
                      </div>

                      {guide.mode === 'ADDITIVE' ? (
                        <div className="sm:col-span-4">
                          <select
                            value={d.is_percentage ? 'PCT' : 'FIXED'}
                            onChange={(e) =>
                              updateDraft(guide.type, { is_percentage: e.target.value === 'PCT' })
                            }
                            className={inputClass}
                          >
                            <option value="PCT">درصدی (مثلاً 0.04 = ۴٪)</option>
                            <option value="FIXED">مبلغ ثابت (ریال)</option>
                          </select>
                        </div>
                      ) : (
                        <div className="sm:col-span-4 text-[11px] text-slate-400 px-1">
                          ضریب مستقیم (مثلاً 1.30)
                        </div>
                      )}

                      <div className="sm:col-span-3">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleSaveOne(guide)}
                          className={`w-full h-9 px-3 rounded-[2px] text-xs font-bold inline-flex items-center justify-center gap-1 disabled:opacity-50 ${
                            isDark
                              ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                              : 'bg-sky-600 hover:bg-sky-700 text-white'
                          }`}
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                          <span>{isBusy ? '...' : existing ? 'بروزرسانی' : 'ثبت ضریب'}</span>
                        </button>
                      </div>
                    </div>

                    {/* دکمه‌های انتخاب سریع */}
                    {guide.presets?.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className={`text-[10px] inline-flex items-center gap-1 ${textSecondary}`}>
                          <SparklesIcon className="w-3 h-3 text-amber-400" />
                          انتخاب سریع:
                        </span>
                        {guide.presets.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() =>
                              updateDraft(guide.type, {
                                value: p.value,
                                ...(p.is_percentage !== undefined ? { is_percentage: p.is_percentage } : {}),
                              })
                            }
                            className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold transition-colors ${
                              isDark
                                ? 'bg-tactical-canvas border-slate-400/20 text-slate-300 hover:border-sky-400 hover:text-sky-300'
                                : 'bg-slate-50 border-slate-300 text-slate-700 hover:border-sky-600 hover:text-sky-700'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* ستون چپ: ماشین‌حساب زنده صورت‌وضعیت */}
          <aside className={`lg:col-span-4 rounded-[2px] border overflow-hidden lg:sticky lg:top-4 ${surfacePanel} ${borderHairline}`}>
            <div className={`p-3.5 border-b flex items-center gap-2 ${borderHairline} ${surfaceHeader}`}>
              <CalculatorIcon className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className={`text-xs sm:text-sm font-bold ${textPrimary}`}>
                  ماشین‌حساب زنده صورت‌وضعیت
                </h3>
                <p className={`text-[10px] ${textSecondary}`}>
                  تست تاثیر ضرایب فعلی پروژه روی مبلغ پایه
                </p>
              </div>
            </div>

            <div className="p-4 space-y-3.5 text-xs">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${textSecondary}`}>
                  مبلغ پایه فهرست بها (ریال)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    value={sampleBaseAmount}
                    onChange={(e) => setSampleBaseAmount(e.target.value)}
                    className={`${inputClass} font-mono font-bold tabular-nums`}
                  />
                  <button
                    type="button"
                    disabled={calcLoading}
                    onClick={() => runCalculation(selectedProjectId, sampleBaseAmount)}
                    className={`h-9 px-3 rounded-[2px] text-xs font-bold shrink-0 ${
                      isDark ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    محاسبه
                  </button>
                </div>
              </div>

              {calcResult && (
                <div className={`rounded-[2px] border divide-y text-xs ${borderHairline} ${isDark ? 'divide-slate-400/10 bg-tactical-canvas/60' : 'divide-slate-200 bg-slate-50'}`}>
                  <div className="p-2.5 flex justify-between">
                    <span className={textSecondary}>۱. مبلغ پایه فهرست بها:</span>
                    <strong className="tabular-nums">{formatRial(calcResult.base_amount)} ریال</strong>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className={textSecondary}>
                      ۲. پس از ضرایب ({toPersianDigits(calcResult.coefficients?.overhead)} × {toPersianDigits(calcResult.coefficients?.regional)} × {toPersianDigits(calcResult.coefficients?.floor)}):
                    </span>
                    <strong className="tabular-nums">{formatRial(calcResult.after_multipliers)} ریال</strong>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className={textSecondary}>۳. تجهیز کارگاه + حمل:</span>
                    <strong className="tabular-nums">
                      + {formatRial((calcResult.equipment_amount || 0) + (calcResult.transport_amount || 0))} ریال
                    </strong>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className={textSecondary}>۴. پس از پلوس/مینوس و تعدیل:</span>
                    <strong className="tabular-nums">{formatRial(calcResult.before_tax)} ریال</strong>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span className={textSecondary}>۵. مالیات بر ارزش افزوده:</span>
                    <strong className="tabular-nums">+ {formatRial(calcResult.tax_amount)} ریال</strong>
                  </div>
                  <div className={`p-3 flex justify-between items-center font-bold ${isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-800'}`}>
                    <span>مبلغ نهایی قابل پرداخت:</span>
                    <span className="text-sm tabular-nums">{formatRial(calcResult.final_amount)} ریال</span>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default ProjectCoefficientsTab;