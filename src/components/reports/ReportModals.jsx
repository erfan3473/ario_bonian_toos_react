// src/components/reports/ReportModals.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PaperClipIcon,
  MagnifyingGlassIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

const toEnglishDigits = (value) =>
  String(value ?? '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

const formatRial = (val) => {
  const num = Number(val || 0);
  const formatted = toPersianDigits(Math.abs(num).toLocaleString('en-US'));
  return num < 0 ? `${formatted}-` : formatted;
};

/* ─── انتخابگر جستجوپذیر سمت سرور برای آیتم‌های فهرست بها ─── */
const BoqItemSearchPicker = ({
  selectedItem,
  onSelect,
  isDark,
  placeholder = 'جستجوی کد (مثلاً 080105) یا شرح آیتم...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = { page_size: 30 };
        const cleaned = toEnglishDigits(query.trim());
        if (cleaned) params.search = cleaned;
        const { data } = await axiosInstance.get('/reports/boq-items/', { params });
        const list = Array.isArray(data) ? data : data?.results || [];
        if (active) {
          setResults(list.filter((it) => it.is_active !== false));
        }
      } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, open]);

  if (selectedItem) {
    return (
      <div
        className={`h-9 px-2.5 rounded-[2px] border flex items-center justify-between gap-2 text-xs ${
          isDark
            ? 'bg-sky-400/10 border-sky-400/40 text-sky-200'
            : 'bg-sky-50 border-sky-600/35 text-sky-900'
        }`}
      >
        <div className="truncate">
          <span className="font-mono font-bold text-sky-400 ml-1.5">[{selectedItem.code}]</span>
          <span className="font-semibold">{selectedItem.title}</span>
          <span className="opacity-75 mr-1">({selectedItem.unit_display})</span>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery('');
            setOpen(true);
          }}
          className="shrink-0 p-0.5 text-slate-400 hover:text-red-400"
          title="تغییر آیتم"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className={`w-full h-9 pe-8 ps-3 text-xs rounded-[2px] border focus:outline-none ${
            isDark
              ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
              : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
          }`}
        />
        <MagnifyingGlassIcon className="w-4 h-4 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>

      {open && (
        <div
          className={`absolute z-30 mt-1 w-full max-h-52 overflow-y-auto rounded-[2px] border shadow-xl divide-y ${
            isDark
              ? 'bg-tactical-surface1 border-slate-400/30 divide-slate-400/10'
              : 'bg-white border-slate-300 divide-slate-200'
          }`}
        >
          {loading ? (
            <div className="p-3 text-center text-[11px] text-slate-400">در حال جستجو...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-[11px] text-slate-500">آیتمی یافت نشد.</div>
          ) : (
            results.map((it) => (
              <div
                key={it.id}
                onClick={() => {
                  onSelect(it);
                  setOpen(false);
                }}
                className={`p-2 text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                  isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <span className="font-mono font-bold text-sky-400 ml-1.5">{it.code}</span>
                  <span className="font-semibold">{it.title}</span>
                </div>
                <span className="shrink-0 text-[10px] opacity-75">{it.unit_display}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const ModalShell = ({ title, subtitle, isDark, onClose, maxWidth = 'max-w-xl', accent = 'cyan', children }) => {
  const accentBorder =
    accent === 'red'
      ? isDark ? 'border-red-400/50' : 'border-red-600/45'
      : accent === 'amber'
      ? isDark ? 'border-amber-400/50' : 'border-amber-600/45'
      : isDark ? 'border-sky-400/50' : 'border-sky-600/45';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm" dir="rtl">
      <div
        className={`relative w-full ${maxWidth} max-h-[92vh] flex flex-col rounded-[2px] border shadow-2xl overflow-hidden ${accentBorder} ${
          isDark ? 'bg-tactical-surface1 text-slate-100' : 'bg-white text-slate-900'
        }`}
      >
        <div
          className={`px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0 ${
            isDark ? 'bg-tactical-surface2 border-slate-400/15' : 'bg-slate-50 border-slate-900/15'
          }`}
        >
          <div>
            <h3 className="text-sm font-bold">{title}</h3>
            {subtitle && (
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            aria-label="بستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
};

/* ─── ۱. مودال رد گزارش ─── */
export const RejectReportModal = ({ report, isDark, loading, onConfirm, onClose }) => {
  const [notes, setNotes] = useState('');

  return (
    <ModalShell
      title="رد گزارش سلسله‌مراتبی"
      subtitle={`${report.author_name} — ${report.position_title}`}
      isDark={isDark}
      onClose={onClose}
      maxWidth="max-w-md"
      accent="red"
    >
      <div className="space-y-3">
        <label className={`block text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          دلیل رد گزارش <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="علت رد یا اصلاحات مورد نیاز را بنویسید..."
          className={`w-full p-2.5 text-xs rounded-[2px] border focus:outline-none ${
            isDark
              ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-red-400'
              : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-red-600'
          }`}
        />
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`h-8 px-3.5 rounded-[2px] border text-xs font-semibold ${
              isDark
                ? 'border-slate-400/25 bg-tactical-surface2 text-slate-300'
                : 'border-slate-900/15 bg-slate-100 text-slate-700'
            }`}
          >
            انصراف
          </button>
          <button
            type="button"
            disabled={loading || !notes.trim()}
            onClick={() => onConfirm(notes.trim())}
            className="h-8 px-4 rounded-[2px] bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-45"
          >
            {loading ? 'در حال ثبت...' : 'تایید و رد گزارش'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

/* ─── ۲. مودال ویرایش گزارش سلسله‌مراتبی ─── */
export const EditReportModal = ({ report, isDark, loading, onSave, onClose }) => {
  const [workSummary, setWorkSummary] = useState(report.work_summary || '');
  const [issues, setIssues] = useState(report.issues || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ work_summary: workSummary, issues });
  };

  return (
    <ModalShell
      title="ویرایش متن گزارش"
      subtitle={`${report.author_name} (${report.position_title})`}
      isDark={isDark}
      onClose={onClose}
      maxWidth="max-w-lg"
      accent="amber"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            شرح عملیات و کارهای انجام‌شده
          </label>
          <textarea
            rows={5}
            value={workSummary}
            onChange={(e) => setWorkSummary(e.target.value)}
            className={`w-full p-2.5 text-xs leading-6 rounded-[2px] border focus:outline-none ${
              isDark
                ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
                : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
            }`}
          />
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            مشکلات، موانع و کسری‌ها
          </label>
          <textarea
            rows={3}
            value={issues}
            onChange={(e) => setIssues(e.target.value)}
            placeholder="موانع اجرایی یا نیازمندی‌های کارگاه..."
            className={`w-full p-2.5 text-xs leading-6 rounded-[2px] border focus:outline-none ${
              isDark
                ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-amber-400'
                : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-amber-600'
            }`}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`h-8 px-3.5 rounded-[2px] border text-xs font-semibold ${
              isDark
                ? 'border-slate-400/25 bg-tactical-surface2 text-slate-300'
                : 'border-slate-900/15 bg-slate-100 text-slate-700'
            }`}
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`h-8 px-4 rounded-[2px] text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50 ${
              isDark ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            <CheckIcon className="w-3.5 h-3.5" />
            <span>{loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ─── ۳. مودال افزودن یا ویرایش ردیف فهرست بها روی گزارش (سرچ سمت سرور) ─── */
export const BoqEntryModal = ({
  mode = 'CREATE', // CREATE | EDIT
  entry = null,
  boqItems = [],
  isDark,
  canSeeCost = true,
  loading,
  onSubmit,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [serverItems, setServerItems] = useState(boqItems || []);
  const [searching, setSearching] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState(entry ? String(entry.boq_item_id) : '');
  const [selectedItemObj, setSelectedItemObj] = useState(null);
  const [quantity, setQuantity] = useState(entry ? String(entry.quantity) : '');
  const [notes, setNotes] = useState(entry?.notes || '');

  // جستجوی سمت سرور با debounce ۳۰۰ میلی‌ثانیه‌ای
  useEffect(() => {
    if (mode !== 'CREATE') return;
    let active = true;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = { page_size: 50 };
        const cleaned = toEnglishDigits(search.trim());
        if (cleaned) params.search = cleaned;
        const { data } = await axiosInstance.get('/reports/boq-items/', { params });
        const list = Array.isArray(data) ? data : data?.results || [];
        if (active) {
          setServerItems(list.filter((it) => it.is_active !== false));
        }
      } catch {
        if (active) setServerItems([]);
      } finally {
        if (active) setSearching(false);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search, mode]);

  const estimatedTotal = useMemo(() => {
    const qtyNum = parseFloat(quantity);
    if (!qtyNum || qtyNum <= 0) return 0;
    const unitPrice = entry?.unit_price_snapshot ?? Number(selectedItemObj?.unit_price || 0);
    return qtyNum * unitPrice;
  }, [quantity, selectedItemObj, entry]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (mode === 'CREATE' && !selectedItemId) return;
    if (!quantity || Number(quantity) <= 0) return;
    onSubmit({
      boq_item: Number(selectedItemId),
      quantity: Number(quantity),
      notes: notes.trim(),
    });
  };

  return (
    <ModalShell
      title={mode === 'CREATE' ? 'افزودن ردیف فهرست بها به گزارش' : 'ویرایش ردیف فهرست بها'}
      subtitle={mode === 'EDIT' ? `${entry?.boq_item_code} — ${entry?.boq_item_title}` : 'جستجو و انتخاب از کل بانک فهرست بها'}
      isDark={isDark}
      onClose={onClose}
      maxWidth="max-w-lg"
      accent="cyan"
    >
      <form onSubmit={handleFormSubmit} className="space-y-3.5">
        {mode === 'CREATE' && (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی کد ۶ رقمی (مثلاً 080105) یا شرح آیتم..."
                className={`w-full h-9 pe-8 ps-3 text-xs rounded-[2px] border focus:outline-none ${
                  isDark
                    ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
                    : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
                }`}
              />
              <MagnifyingGlassIcon className="w-4 h-4 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            {selectedItemObj && (
              <div
                className={`px-2.5 py-1.5 rounded-[2px] border text-[11px] flex items-center justify-between gap-2 ${
                  isDark
                    ? 'bg-sky-400/15 border-sky-400/45 text-sky-200'
                    : 'bg-sky-50 border-sky-600/35 text-sky-900'
                }`}
              >
                <span className="truncate">
                  انتخاب‌شده: <strong className="font-mono">{selectedItemObj.code}</strong> — {selectedItemObj.title}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedItemId('');
                    setSelectedItemObj(null);
                  }}
                  className="shrink-0 text-red-400 hover:underline"
                >
                  حذف
                </button>
              </div>
            )}

            <div
              className={`max-h-48 overflow-y-auto rounded-[2px] border divide-y ${
                isDark
                  ? 'bg-tactical-canvas border-slate-400/20 divide-slate-400/10'
                  : 'bg-slate-50 border-slate-900/15 divide-slate-200'
              }`}
            >
              {searching ? (
                <div className="p-3 text-center text-xs text-slate-400">در حال جستجو در بانک فهرست بها...</div>
              ) : serverItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">آیتمی یافت نشد.</div>
              ) : (
                serverItems.map((it) => {
                  const active = String(it.id) === String(selectedItemId);
                  return (
                    <div
                      key={it.id}
                      onClick={() => {
                        setSelectedItemId(String(it.id));
                        setSelectedItemObj(it);
                      }}
                      className={`p-2 text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                        active
                          ? isDark
                            ? 'bg-sky-400/20 text-sky-200'
                            : 'bg-sky-100 text-sky-900'
                          : isDark
                          ? 'hover:bg-tactical-hover'
                          : 'hover:bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="font-mono font-bold text-sky-400 ml-1.5">{it.code}</span>
                        <span className="font-semibold">{it.title}</span>
                      </div>
                      <span className="shrink-0 text-[10px] tabular-nums opacity-80">
                        {it.unit_display}
                        {canSeeCost && ` • ${formatRial(it.unit_price)} ریال`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              مقدار ({selectedItemObj?.unit_display || entry?.unit_display || 'واحد'}) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={`w-full h-9 px-3 text-xs font-bold tabular-nums rounded-[2px] border focus:outline-none ${
                isDark
                  ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
                  : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
              }`}
            />
          </div>

          {canSeeCost && (
            <div
              className={`p-2 rounded-[2px] border flex flex-col justify-center ${
                isDark ? 'bg-tactical-canvas/70 border-slate-400/20' : 'bg-slate-50 border-slate-900/15'
              }`}
            >
              <span className="text-[10px] text-slate-400">برآورد جمع کل این ردیف</span>
              <span className={`text-sm font-bold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {formatRial(estimatedTotal)} ریال
              </span>
            </div>
          )}
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            توضیحات / محل اجرا (اختیاری)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثلاً: بلوک B، محور ۳..."
            className={`w-full h-9 px-3 text-xs rounded-[2px] border focus:outline-none ${
              isDark
                ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
                : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
            }`}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`h-8 px-3.5 rounded-[2px] border text-xs font-semibold ${
              isDark
                ? 'border-slate-400/25 bg-tactical-surface2 text-slate-300'
                : 'border-slate-900/15 bg-slate-100 text-slate-700'
            }`}
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading || (mode === 'CREATE' && !selectedItemId) || !quantity}
            className={`h-8 px-4 rounded-[2px] text-xs font-bold disabled:opacity-45 ${
              isDark ? 'bg-sky-400 hover:bg-sky-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {loading ? 'در حال ثبت...' : mode === 'CREATE' ? 'افزودن ردیف' : 'ذخیره تغییرات'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ─── ۴. مودال ثبت گزارش یکپارچه جدید (متن + فایل + فهرست بها با سرچ سمت سرور) ─── */
export const UnifiedReportCreateModal = ({
  projects = [],
  defaultProjectId = '',
  isDark,
  loading,
  onSubmit,
  onClose,
}) => {
  const [projectId, setProjectId] = useState(defaultProjectId ? String(defaultProjectId) : '');
  const [workSummary, setWorkSummary] = useState('');
  const [files, setFiles] = useState([]);
  const [boqRows, setBoqRows] = useState([]);

  const addBoqRow = () => {
    setBoqRows((prev) => [...prev, { boq_item_id: '', selectedItem: null, quantity: '', notes: '' }]);
  };

  const updateBoqRow = (idx, patch) => {
    setBoqRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeBoqRow = (idx) => {
    setBoqRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!projectId) return;
    const validBoq = boqRows
      .filter((r) => r.boq_item_id && Number(r.quantity) > 0)
      .map((r) => ({
        boq_item_id: r.boq_item_id,
        quantity: r.quantity,
        notes: r.notes,
      }));
    onSubmit({
      projectId: Number(projectId),
      workSummary,
      files,
      boqEntries: validBoq,
    });
  };

  const inputClass = `w-full h-9 px-3 text-xs rounded-[2px] border focus:outline-none ${
    isDark
      ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
      : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
  }`;

  return (
    <ModalShell
      title="ثبت گزارش روزانه و فهرست بها"
      subtitle="ثبت یکپارچه شرح عملیات، پیوست‌های رسانه‌ای و ردیف‌های فهرست بها برای امروز"
      isDark={isDark}
      onClose={onClose}
      maxWidth="max-w-2xl"
      accent="cyan"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            پروژه <span className="text-red-500">*</span>
          </label>
          <select required value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputClass}>
            <option value="">-- انتخاب پروژه --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            شرح کارهای انجام‌شده امروز
          </label>
          <textarea
            rows={4}
            value={workSummary}
            onChange={(e) => setWorkSummary(e.target.value)}
            placeholder="جزئیات عملیات انجام‌شده در کارگاه..."
            className={`w-full p-2.5 text-xs leading-6 rounded-[2px] border focus:outline-none ${
              isDark
                ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
                : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
            }`}
          />
        </div>

        {/* فایل‌های پیوست */}
        <div>
          <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            فایل‌های رسانه‌ای (تصویر، ویدیو، صدا)
          </label>
          <label
            className={`flex items-center justify-center gap-2 p-3 rounded-[2px] border border-dashed cursor-pointer text-xs font-semibold transition-colors ${
              isDark
                ? 'border-slate-400/30 bg-tactical-canvas/60 text-sky-300 hover:border-sky-400'
                : 'border-slate-900/20 bg-slate-50 text-sky-700 hover:border-sky-600'
            }`}
          >
            <PaperClipIcon className="w-4 h-4" />
            <span>انتخاب فایل‌ها ({toPersianDigits(files.length)} فایل انتخاب‌شده)</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </label>
        </div>

        {/* ردیف‌های فهرست بها */}
        <div
          className={`p-3 rounded-[2px] border space-y-2.5 ${
            isDark ? 'bg-tactical-canvas/60 border-slate-400/20' : 'bg-slate-50 border-slate-900/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">ردیف‌های فهرست بها (اختیاری)</span>
            <button
              type="button"
              onClick={addBoqRow}
              className={`h-7 px-2.5 rounded-[2px] border text-[11px] font-bold inline-flex items-center gap-1 ${
                isDark
                  ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-emerald-50 border-emerald-600/40 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>افزودن آیتم BOQ</span>
            </button>
          </div>

          {boqRows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-12 sm:col-span-6">
                <BoqItemSearchPicker
                  selectedItem={row.selectedItem}
                  isDark={isDark}
                  onSelect={(item) =>
                    updateBoqRow(idx, {
                      selectedItem: item,
                      boq_item_id: item ? String(item.id) : '',
                    })
                  }
                />
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="مقدار"
                value={row.quantity}
                onChange={(e) => updateBoqRow(idx, { quantity: e.target.value })}
                className={`col-span-5 sm:col-span-2 ${inputClass} tabular-nums`}
              />
              <input
                type="text"
                placeholder="توضیح"
                value={row.notes}
                onChange={(e) => updateBoqRow(idx, { notes: e.target.value })}
                className={`col-span-5 sm:col-span-3 ${inputClass}`}
              />
              <button
                type="button"
                onClick={() => removeBoqRow(idx)}
                className="col-span-2 sm:col-span-1 h-9 inline-flex items-center justify-center rounded-[2px] border border-red-500/35 text-red-400 hover:bg-red-500/15"
                aria-label="حذف ردیف"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`h-9 px-4 rounded-[2px] border text-xs font-semibold ${
              isDark
                ? 'border-slate-400/25 bg-tactical-surface2 text-slate-300'
                : 'border-slate-900/15 bg-slate-100 text-slate-700'
            }`}
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading || !projectId}
            className={`h-9 px-5 rounded-[2px] text-xs font-bold disabled:opacity-45 ${
              isDark ? 'bg-sky-400 hover:bg-sky-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            {loading ? 'در حال ارسال...' : 'ثبت نهایی گزارش'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

/* ─── ۵. لایت‌باکس تمام‌صفحه برای تصاویر ─── */
export const MediaLightboxModal = ({ images = [], currentIndex = 0, onChangeIndex, onClose }) => {
  if (!images.length) return null;
  const active = images[currentIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white mb-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-bold tabular-nums">
          تصویر {toPersianDigits(currentIndex + 1)} از {toPersianDigits(images.length)}
        </span>
        <div className="flex items-center gap-2">
          <a
            href={active.file}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 rounded-[2px] bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>دانلود</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-[2px] bg-white/10 hover:bg-red-500/80 inline-flex items-center justify-center"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="relative w-full max-w-5xl flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onChangeIndex((currentIndex - 1 + images.length) % images.length)}
            className="absolute right-2 z-10 p-2 rounded-[2px] bg-black/60 hover:bg-sky-500/80 text-white"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}

        <img
          src={active.file}
          alt=""
          className="max-h-[78vh] max-w-full object-contain rounded-[2px] border border-white/15"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => onChangeIndex((currentIndex + 1) % images.length)}
            className="absolute left-2 z-10 p-2 rounded-[2px] bg-black/60 hover:bg-sky-500/80 text-white"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};