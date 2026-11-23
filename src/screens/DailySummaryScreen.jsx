// src/screens/DailySummaryScreen.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import moment from 'moment-jalaali';

import {
  fetchDailySummary,
  fetchFlexibleSummary,
  approveReport,
  updateHierarchicalReport,
  deleteHierarchicalReport,
  dailyReportWorkflowAction,
  approveBoqEntry,
  createBoqEntry,
  updateBoqEntry,
  deleteBoqEntry,
  submitUnifiedReport,
  fetchBoqCatalog,
} from '../features/reports/reportSlice';
import { fetchProjects } from '../features/projects/projectSlice';
import JalaliDatePicker from '../components/JalaliDatePicker';
import { formatJalaliDateLong } from '../utils/dateUtils';
import {
  RejectReportModal,
  EditReportModal,
  BoqEntryModal,
  UnifiedReportCreateModal,
  MediaLightboxModal,
} from '../components/reports/ReportModals';

import {
  ArrowPathIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  PrinterIcon,
  TableCellsIcon,
  TrashIcon,
  UsersIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

moment.loadPersian({ usePersianDigits: false });

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const formatRial = (val) => toPersianDigits(Number(val || 0).toLocaleString('en-US'));

const formatTime = (iso) => {
  if (!iso) return '---';
  const m = moment(iso);
  return m.isValid() ? toPersianDigits(m.format('HH:mm')) : '---';
};

const formatDateTimeJalali = (iso) => {
  if (!iso) return '---';
  const m = moment(iso);
  return m.isValid() ? toPersianDigits(m.format('jYYYY/jMM/jDD - HH:mm')) : '---';
};

const calcHours = (timeIn, timeOut) => {
  if (!timeIn || !timeOut) return null;
  const diffMin = moment(timeOut).diff(moment(timeIn), 'minutes');
  if (diffMin <= 0) return null;
  return toPersianDigits((diffMin / 60).toFixed(1));
};

const CornerBrackets = ({ accent = 'cyan', isDark = true }) => {
  const accentMap = {
    cyan: isDark ? 'border-sky-400/60' : 'border-sky-600/60',
    amber: isDark ? 'border-amber-400/60' : 'border-amber-600/60',
    emerald: isDark ? 'border-emerald-400/60' : 'border-emerald-600/60',
  };
  const colorClass = accentMap[accent] || accentMap.cyan;

  return (
    <>
      <span aria-hidden="true" className={`print:hidden pointer-events-none absolute top-0 start-0 w-2 h-2 border-t border-s ${colorClass}`} />
      <span aria-hidden="true" className={`print:hidden pointer-events-none absolute top-0 end-0 w-2 h-2 border-t border-e ${colorClass}`} />
      <span aria-hidden="true" className={`print:hidden pointer-events-none absolute bottom-0 start-0 w-2 h-2 border-b border-s ${colorClass}`} />
      <span aria-hidden="true" className={`print:hidden pointer-events-none absolute bottom-0 end-0 w-2 h-2 border-b border-e ${colorClass}`} />
    </>
  );
};

/* ================= پیش‌نمایش مسیر GPS (route_log) ================= */
const RouteLogCard = ({ routeLog, isDark }) => {
  const coords = routeLog?.route_coordinates || [];
  if (!coords.length) return null;

  const first = coords[0];
  const last = coords[coords.length - 1];
  const mapsUrl = `https://www.google.com/maps/dir/${first[0]},${first[1]}/${last[0]},${last[1]}`;

  // ساخت مسیر SVG سبک از روی نقاط lat/lng
  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latSpan = maxLat - minLat || 0.0001;
  const lngSpan = maxLng - minLng || 0.0001;

  const polylinePoints = coords
    .map(([lat, lng]) => {
      const x = 10 + ((lng - minLng) / lngSpan) * 180;
      const y = 50 - ((lat - minLat) / latSpan) * 40;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      className={`mt-3 p-3 rounded-[2px] border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isDark
          ? 'bg-tactical-canvas/80 border-sky-400/25'
          : 'bg-sky-50/50 border-sky-600/25'
      }`}
    >
      <div className="space-y-1 text-xs">
        <div className={`font-bold flex items-center gap-1.5 ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
          <MapPinIcon className="w-4 h-4 shrink-0" />
          <span>مسیر GPS ثبت‌شده کارگر</span>
        </div>
        <div className={`text-[11px] tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          تعداد نقاط ثبت‌شده: <strong>{toPersianDigits(coords.length)}</strong> نقطه • زمان ثبت:{' '}
          <span dir="ltr">{formatDateTimeJalali(routeLog.recorded_at)}</span>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`print:hidden inline-flex items-center gap-1 text-[11px] font-bold hover:underline ${
            isDark ? 'text-sky-400' : 'text-sky-700'
          }`}
        >
          <span>مشاهده مسیر روی نقشه ←</span>
        </a>
      </div>

      <svg
        viewBox="0 0 200 60"
        className={`w-44 h-14 rounded-[2px] border shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'
        }`}
      >
        <polyline fill="none" stroke={isDark ? '#38bdf8' : '#0284c7'} strokeWidth="2" points={polylinePoints} />
      </svg>
    </div>
  );
};

/* ================= گالری مدیا همراه با متن ویس و لایت‌باکس ================= */
const MediaSection = ({ files = [], isDark, onOpenLightbox }) => {
  if (!files.length) return null;

  const images = files.filter((f) => f.preview_type === 'image');
  const others = files.filter((f) => f.preview_type !== 'image');

  return (
    <div className="mt-3 space-y-2.5">
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {images.map((img, idx) => (
            <button
              type="button"
              key={img.id}
              onClick={() => onOpenLightbox(images, idx)}
              className={`group relative overflow-hidden rounded-[2px] border text-right ${
                isDark ? 'border-slate-400/20 bg-tactical-canvas' : 'border-slate-900/15 bg-slate-50'
              }`}
            >
              <img
                src={img.file}
                alt=""
                loading="lazy"
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <span className="print:hidden absolute bottom-1 start-1 px-1.5 py-0.5 rounded-[2px] bg-black/70 text-white text-[9px] font-semibold inline-flex items-center gap-1">
                <PhotoIcon className="w-3 h-3" /> بزرگنمایی
              </span>
            </button>
          ))}
        </div>
      )}

      {others.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {others.map((media) => (
            <div
              key={media.id}
              className={`p-2.5 rounded-[2px] border space-y-2 ${
                isDark ? 'border-slate-400/20 bg-tactical-canvas/80' : 'border-slate-900/15 bg-slate-50'
              }`}
            >
              {media.preview_type === 'video' ? (
                <video src={media.file} controls preload="metadata" className="w-full h-40 object-cover rounded-[2px] bg-black" />
              ) : media.preview_type === 'audio' ? (
                <audio src={media.file} controls preload="none" className="w-full" />
              ) : (
                <a
                  href={media.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                    isDark ? 'text-sky-400 hover:underline' : 'text-sky-700 hover:underline'
                  }`}
                >
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>دانلود فایل پیوست</span>
                </a>
              )}

              {media.transcription && (
                <div
                  className={`p-2 rounded-[2px] border-s-2 text-[11px] leading-6 ${
                    isDark
                      ? 'bg-tactical-surface2 border-s-sky-400 text-slate-300'
                      : 'bg-white border-s-sky-600 text-slate-700'
                  }`}
                >
                  <span className="block text-[10px] font-bold text-sky-400 mb-0.5">متن تبدیل‌شده صوت:</span>
                  {media.transcription}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================= صفحه اصلی گزارش‌های روزانه ================= */
const VIEW_MODE = { LIST: 'LIST', SINGLE: 'SINGLE' };

const DAILY_STATUS_META = {
  DRAFT: { label: 'پیش‌نویس', dark: 'bg-slate-500/15 border-slate-400/35 text-slate-300', light: 'bg-slate-100 border-slate-300 text-slate-700' },
  SUBMITTED: { label: 'ارسال‌شده (منتظر PM)', dark: 'bg-amber-400/15 border-amber-400/45 text-amber-300', light: 'bg-amber-50 border-amber-600/40 text-amber-800' },
  PM_APPROVED: { label: 'تایید مدیر پروژه', dark: 'bg-sky-400/15 border-sky-400/45 text-sky-300', light: 'bg-sky-50 border-sky-600/40 text-sky-800' },
  FINAL_APPROVED: { label: 'تایید نهایی مدیرعامل', dark: 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300', light: 'bg-emerald-50 border-emerald-600/40 text-emerald-800' },
  REJECTED: { label: 'رد شده', dark: 'bg-red-500/15 border-red-500/45 text-red-300', light: 'bg-red-50 border-red-600/40 text-red-700' },
};

const HR_STATUS_META = {
  DRAFT: { label: 'پیش‌نویس', dark: 'bg-slate-500/15 border-slate-400/35 text-slate-300', light: 'bg-slate-100 border-slate-300 text-slate-700' },
  SUBMITTED: { label: 'منتظر تایید', dark: 'bg-amber-400/15 border-amber-400/45 text-amber-300', light: 'bg-amber-50 border-amber-600/40 text-amber-800' },
  APPROVED: { label: 'تایید شده', dark: 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300', light: 'bg-emerald-50 border-emerald-600/40 text-emerald-800' },
  REJECTED: { label: 'رد شده', dark: 'bg-red-500/15 border-red-500/45 text-red-300', light: 'bg-red-50 border-red-600/40 text-red-700' },
  FINAL: { label: 'نهایی', dark: 'bg-sky-400/15 border-sky-400/45 text-sky-300', light: 'bg-sky-50 border-sky-600/40 text-sky-800' },
};

const DailySummaryScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { userInfo } = useSelector((state) => state.userLogin);
  const isAdmin = Boolean(userInfo?.is_admin || userInfo?.is_staff || userInfo?.is_superuser);

  const {
    dailySummary,
    dailySummaryList,
    dailySummaryCount,
    summaryLoading,
    summaryError,
    actionLoading,
    submitLoading,
    boqItems,
  } = useSelector((state) => state.reports);

  const { list: projectsList, loading: projectsLoading } = useSelector((state) => state.projects);

  // استیت‌های فیلتر و ناوبری
  const [viewMode, setViewMode] = useState(VIEW_MODE.LIST);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [onlyWithBoq, setOnlyWithBoq] = useState(false);
  const [singleActiveTab, setSingleActiveTab] = useState('ALL'); // ALL | REPORTS | BOQ | ATTENDANCE

  // استیت‌های مودال‌ها
  const [rejectModalReport, setRejectModalReport] = useState(null);
  const [editModalReport, setEditModalReport] = useState(null);
  const [boqModalState, setBoqModalState] = useState(null); // { mode: 'CREATE'|'EDIT', report, entry }
  const [createUnifiedOpen, setCreateUnifiedOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState(null); // { images, index }
  const [busyId, setBusyId] = useState(null);

  const loadList = useCallback(
    (overrides = {}) => {
      dispatch(
        fetchFlexibleSummary({
          projectId: overrides.projectId !== undefined ? overrides.projectId : selectedProjectId || null,
          dateFrom: overrides.dateFrom !== undefined ? overrides.dateFrom : dateFrom || null,
          dateTo: overrides.dateTo !== undefined ? overrides.dateTo : dateTo || null,
          status: overrides.status !== undefined ? overrides.status : statusFilter,
          hasBoq: overrides.hasBoq !== undefined ? overrides.hasBoq : onlyWithBoq,
          limit: 30,
        })
      );
    },
    [dispatch, selectedProjectId, dateFrom, dateTo, statusFilter, onlyWithBoq]
  );

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchBoqCatalog());
    dispatch(fetchFlexibleSummary({ limit: 30 }));
  }, [dispatch]);

  const reloadCurrentSingle = useCallback(() => {
    if (dailySummary?.project && dailySummary?.report_date) {
      dispatch(fetchDailySummary({ projectId: dailySummary.project, date: dailySummary.report_date }));
    }
  }, [dispatch, dailySummary?.project, dailySummary?.report_date]);

  const handleApplyFilters = () => {
    if (selectedProjectId && dateFrom && dateFrom === dateTo) {
      setViewMode(VIEW_MODE.SINGLE);
      dispatch(fetchDailySummary({ projectId: Number(selectedProjectId), date: dateFrom }));
    } else {
      setViewMode(VIEW_MODE.LIST);
      loadList();
    }
  };

  const handleResetFilters = () => {
    setSelectedProjectId('');
    setDateFrom('');
    setDateTo('');
    setStatusFilter('ALL');
    setOnlyWithBoq(false);
    setViewMode(VIEW_MODE.LIST);
    dispatch(fetchFlexibleSummary({ limit: 30 }));
  };

  const openSingleReport = (projectId, reportDate) => {
    setViewMode(VIEW_MODE.SINGLE);
    setSingleActiveTab('ALL');
    dispatch(fetchDailySummary({ projectId, date: reportDate }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // آمار کلان لیست
  const listStats = useMemo(() => {
    const reports = Array.isArray(dailySummaryList) ? dailySummaryList : [];
    let totalHierarchical = 0;
    let totalBoqEntries = 0;
    let totalBoqCost = 0;
    reports.forEach((s) => {
      totalHierarchical += s.hierarchical_reports?.length || 0;
      totalBoqEntries += s.boq_summary?.entries_count || 0;
      totalBoqCost += Number(s.boq_summary?.total_cost || 0);
    });
    return {
      daysCount: dailySummaryCount || reports.length,
      totalHierarchical,
      totalBoqEntries,
      totalBoqCost,
    };
  }, [dailySummaryList, dailySummaryCount]);

  // گزارش‌های مرتب‌شده نمای تکی + تجمیع ردیف‌های BOQ
  const sortedReports = useMemo(() => {
    if (!dailySummary?.hierarchical_reports?.length) return [];
    return [...dailySummary.hierarchical_reports].sort(
      (a, b) => (a.author_position?.hierarchy_level ?? 99) - (b.author_position?.hierarchy_level ?? 99)
    );
  }, [dailySummary?.hierarchical_reports]);

  const allSingleBoqEntries = useMemo(() => {
    return sortedReports.flatMap((r) =>
      (r.boq_items || []).map((entry) => ({
        ...entry,
        reportId: r.id,
        authorName: r.author_name,
        positionTitle: r.position_title,
      }))
    );
  }, [sortedReports]);

  // هندلرهای اکشن‌های عملیاتی
  const handleApproveHierarchical = async (reportId) => {
    setBusyId(`hr-${reportId}`);
    try {
      await dispatch(approveReport({ reportId, decision: 'APPROVED' })).unwrap();
      toast.success('گزارش با موفقیت تایید شد.');
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در تایید گزارش');
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectHierarchical = async (notes) => {
    if (!rejectModalReport) return;
    try {
      await dispatch(approveReport({ reportId: rejectModalReport.id, decision: 'REJECTED', notes })).unwrap();
      toast.success('گزارش رد شد و علت آن ثبت گردید.');
      setRejectModalReport(null);
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در رد گزارش');
    }
  };

  const handleSaveEditReport = async (payload) => {
    if (!editModalReport) return;
    setBusyId(`edit-${editModalReport.id}`);
    try {
      await dispatch(updateHierarchicalReport({ reportId: editModalReport.id, payload })).unwrap();
      toast.success('تغییرات گزارش ذخیره شد.');
      setEditModalReport(null);
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در ویرایش گزارش');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteHierarchical = async (report) => {
    if (!window.confirm(`آیا از حذف گزارش «${report.author_name}» و ردیف‌های فهرست بهای متصل به آن اطمینان دارید؟`)) return;
    setBusyId(`del-${report.id}`);
    try {
      await dispatch(deleteHierarchicalReport(report.id)).unwrap();
      toast.success('گزارش حذف شد.');
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در حذف گزارش');
    } finally {
      setBusyId(null);
    }
  };

  const handleDailyWorkflow = async (actionName, label) => {
    if (!dailySummary?.id) return;
    setBusyId(`daily-${actionName}`);
    try {
      await dispatch(dailyReportWorkflowAction({ dailyReportId: dailySummary.id, actionName })).unwrap();
      toast.success(`${label} با موفقیت انجام شد.`);
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در تغییر وضعیت گزارش روزانه');
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveBoqEntry = async (entryId) => {
    setBusyId(`boq-approve-${entryId}`);
    try {
      await dispatch(approveBoqEntry(entryId)).unwrap();
      toast.success('ردیف فهرست بها تایید شد.');
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در تایید ردیف فهرست بها');
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitBoqModal = async ({ boq_item, quantity, notes }) => {
    if (!boqModalState) return;
    setBusyId('boq-modal');
    try {
      if (boqModalState.mode === 'CREATE') {
        await dispatch(
          createBoqEntry({
            hierarchicalReportId: boqModalState.report.id,
            boqReportId: boqModalState.report.boq_report_id,
            boq_item,
            quantity,
            notes,
          })
        ).unwrap();
        toast.success('ردیف فهرست بها اضافه شد.');
      } else {
        await dispatch(
          updateBoqEntry({
            entryId: boqModalState.entry.id,
            payload: { quantity, notes },
          })
        ).unwrap();
        toast.success('ردیف فهرست بها ویرایش شد.');
      }
      setBoqModalState(null);
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در ذخیره ردیف فهرست بها');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteBoqEntry = async (entry) => {
    if (!window.confirm(`حذف ردیف فهرست بهای «${entry.boq_item_code} - ${entry.boq_item_title}»؟`)) return;
    setBusyId(`boq-del-${entry.id}`);
    try {
      await dispatch(deleteBoqEntry(entry.id)).unwrap();
      toast.success('ردیف فهرست بها حذف شد.');
      reloadCurrentSingle();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در حذف ردیف');
    } finally {
      setBusyId(null);
    }
  };

  const handleSubmitUnified = async (payload) => {
    try {
      await dispatch(submitUnifiedReport(payload)).unwrap();
      toast.success('گزارش روزانه با موفقیت ثبت شد.');
      setCreateUnifiedOpen(false);
      if (viewMode === VIEW_MODE.SINGLE) {
        reloadCurrentSingle();
      } else {
        loadList();
      }
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در ثبت گزارش');
    }
  };

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-white';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  const isSingleMode = viewMode === VIEW_MODE.SINGLE;
  const isListMode = viewMode === VIEW_MODE.LIST;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 print:bg-white print:text-black ${
        isDark
          ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
          : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
      }`}
      dir="rtl"
    >
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4 print:p-0 print:max-w-none">

        {/* ═══ سرصفحه فرماندهی و نوار ابزار ═══ */}
        <div className={`relative rounded-[2px] border ${surfacePanel} ${borderHairline} print:border-slate-300`}>
          <CornerBrackets accent="cyan" isDark={isDark} />

          <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-[2px] border flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-sky-400/10 border-sky-400/40 text-sky-400'
                    : 'bg-sky-50 border-sky-600/35 text-sky-700'
                }`}
              >
                <ClipboardDocumentListIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-base sm:text-xl font-bold tracking-normal ${textPrimary} print:text-black`}>
                  {isSingleMode && dailySummary?.project_name
                    ? `پرونده گزارش روزانه — ${dailySummary.project_name}`
                    : 'مرکز گزارش‌های روزانه و فهرست بها'}
                </h1>
                <p className={`text-xs mt-0.5 ${textSecondary} print:text-slate-600`}>
                  {isSingleMode && dailySummary?.report_date
                    ? formatJalaliDateLong(dailySummary.report_date)
                    : 'رصد سلسله‌مراتبی عملیات کارگاه، ردیف‌های فهرست بها، رسانه‌ها و تردد پرسنل'}
                </p>
              </div>
            </div>

            <div className="print:hidden flex flex-wrap items-center gap-2">
              {isSingleMode && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode(VIEW_MODE.LIST);
                      loadList();
                    }}
                    className={`h-9 px-3.5 rounded-[2px] border inline-flex items-center gap-1.5 text-xs font-semibold ${
                      isDark
                        ? 'bg-tactical-surface2 border-slate-400/20 text-slate-200 hover:bg-tactical-hover'
                        : 'bg-slate-50 border-slate-900/20 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                    <span>بازگشت به لیست</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className={`h-9 px-3.5 rounded-[2px] border inline-flex items-center gap-1.5 text-xs font-semibold ${
                      isDark
                        ? 'bg-tactical-surface2 border-amber-400/40 text-amber-300 hover:bg-amber-400/15'
                        : 'bg-amber-50 border-amber-600/35 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <PrinterIcon className="w-4 h-4" />
                    <span>چاپ A4</span>
                  </button>
                </>
              )}

              <Link
                to="/admin/boq-management"
                className={`h-9 px-3.5 rounded-[2px] border inline-flex items-center gap-1.5 text-xs font-semibold ${
                  isDark
                    ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-emerald-50 border-emerald-600/35 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <TableCellsIcon className="w-4 h-4" />
                <span>بانک فهرست بها</span>
              </Link>

              <button
                type="button"
                onClick={() => setCreateUnifiedOpen(true)}
                className={`h-9 px-4 rounded-[2px] inline-flex items-center gap-1.5 text-xs font-bold ${
                  isDark ? 'bg-sky-400 hover:bg-sky-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                <PlusIcon className="w-4 h-4" />
                <span>ثبت گزارش / فهرست بها</span>
              </button>
            </div>
          </div>

          {/* ── نوار KPI کلان ── */}
          {isListMode && (
            <div
              className={`print:hidden grid grid-cols-2 lg:grid-cols-4 border-t divide-y sm:divide-y-0 divide-x divide-x-reverse ${borderHairline} ${
                isDark ? 'divide-slate-400/15 bg-tactical-canvas/55' : 'divide-slate-900/10 bg-slate-50/70'
              }`}
            >
              <div className="p-3">
                <div className={`text-[11px] ${textSecondary}`}>روزهای گزارش‌شده</div>
                <div className={`text-lg font-bold tabular-nums mt-0.5 ${textPrimary}`}>
                  {toPersianDigits(listStats.daysCount)} <span className="text-xs font-normal opacity-70">پرونده</span>
                </div>
              </div>
              <div className="p-3">
                <div className={`text-[11px] ${textSecondary}`}>کل گزارش‌های سلسله‌مراتبی</div>
                <div className={`text-lg font-bold tabular-nums mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                  {toPersianDigits(listStats.totalHierarchical)} <span className="text-xs font-normal opacity-70">گزارش</span>
                </div>
              </div>
              <div className="p-3">
                <div className={`text-[11px] ${textSecondary}`}>کل ردیف‌های فهرست بها</div>
                <div className={`text-lg font-bold tabular-nums mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                  {toPersianDigits(listStats.totalBoqEntries)} <span className="text-xs font-normal opacity-70">ردیف</span>
                </div>
              </div>
              <div className="p-3">
                <div className={`text-[11px] ${textSecondary}`}>جمع برآورد فهرست بها (صفحه جاری)</div>
                <div className={`text-lg font-bold tabular-nums mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {isAdmin ? (
                    <>
                      {formatRial(listStats.totalBoqCost)} <span className="text-xs font-normal opacity-70">ریال</span>
                    </>
                  ) : (
                    <span className="text-xs opacity-60">محرمانه (سطح مدیریت)</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ نوار فیلترها (مخفی در چاپ) ═══ */}
        <div className={`print:hidden rounded-[2px] border p-3.5 ${surfacePanel} ${borderHairline}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 items-end">
            <div>
              <label className={`block text-[11px] font-bold mb-1 ${textSecondary}`}>پروژه</label>
              <select
                value={selectedProjectId}
                disabled={projectsLoading}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className={`w-full h-8 px-2.5 text-xs rounded-[2px] border focus:outline-none ${
                  isDark
                    ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
                    : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
                }`}
              >
                <option value="">همه پروژه‌ها</option>
                {projectsList?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <JalaliDatePicker
                name="date_from"
                label="از تاریخ"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value || '')}
                modal
              />
            </div>

            <div>
              <JalaliDatePicker
                name="date_to"
                label="تا تاریخ"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value || '')}
                modal
              />
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${textSecondary}`}>وضعیت پرونده روزانه</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`w-full h-8 px-2.5 text-xs rounded-[2px] border focus:outline-none ${
                  isDark
                    ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 focus:border-sky-400'
                    : 'bg-slate-50 border-slate-900/20 text-slate-900 focus:border-sky-600'
                }`}
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="DRAFT">پیش‌نویس</option>
                <option value="SUBMITTED">ارسال‌شده</option>
                <option value="PM_APPROVED">تایید مدیر پروژه</option>
                <option value="FINAL_APPROVED">تایید نهایی</option>
                <option value="REJECTED">رد شده</option>
              </select>
            </div>

            <label
              className={`h-8 px-2.5 rounded-[2px] border flex items-center gap-2 cursor-pointer text-xs font-semibold select-none ${
                onlyWithBoq
                  ? isDark
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-600/45 text-emerald-800'
                  : isDark
                  ? 'bg-tactical-canvas border-slate-400/20 text-slate-300'
                  : 'bg-slate-50 border-slate-900/15 text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={onlyWithBoq}
                onChange={(e) => setOnlyWithBoq(e.target.checked)}
                className="accent-emerald-500"
              />
              <span>فقط دارای فهرست بها</span>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleApplyFilters}
                disabled={summaryLoading}
                className={`flex-1 h-8 px-3 rounded-[2px] text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                  isDark ? 'bg-sky-400 hover:bg-sky-300 text-slate-950' : 'bg-sky-600 hover:bg-sky-700 text-white'
                }`}
              >
                <FunnelIcon className="w-3.5 h-3.5" />
                <span>اعمال فیلتر</span>
              </button>
              <button
                type="button"
                onClick={handleResetFilters}
                className={`h-8 w-8 rounded-[2px] border inline-flex items-center justify-center ${
                  isDark
                    ? 'border-slate-400/20 bg-tactical-surface2 text-slate-300 hover:text-sky-300'
                    : 'border-slate-900/15 bg-slate-100 text-slate-600 hover:text-sky-700'
                }`}
                title="پاکسازی فیلترها"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {summaryError && (
          <div className="p-3 rounded-[2px] border border-red-500/40 bg-red-500/10 text-red-400 text-xs font-bold">
            {summaryError}
          </div>
        )}

        {/* ═══ وضعیت بارگذاری ═══ */}
        {summaryLoading && (
          <div className={`rounded-[2px] border p-8 text-center ${surfacePanel} ${borderHairline}`}>
            <ArrowPathIcon className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
            <span className={`text-xs font-semibold ${textSecondary}`}>در حال دریافت پرونده‌های گزارش...</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* نمای لیستی (کارت‌های گزارش روزانه با آمار فهرست بها و تردد) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {!summaryLoading && isListMode && (
          <>
            {!dailySummaryList?.length ? (
              <div className={`rounded-[2px] border border-dashed p-12 text-center ${surfacePanel} ${borderHairline}`}>
                <ClipboardDocumentListIcon className="w-10 h-10 mx-auto mb-2 opacity-25" />
                <p className={`text-sm font-bold ${textPrimary}`}>گزارشی مطابق فیلتر انتخاب‌شده یافت نشد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {dailySummaryList.map((summary) => {
                  const stMeta = DAILY_STATUS_META[summary.status] || DAILY_STATUS_META.DRAFT;
                  const boqEntriesCount = summary.boq_summary?.entries_count || 0;
                  const boqCost = Number(summary.boq_summary?.total_cost || 0);
                  const hrCount = summary.hierarchical_reports?.length || 0;
                  const attCount = summary.workers_attendance?.length || 0;

                  return (
                    <div
                      key={summary.id}
                      onClick={() => openSingleReport(summary.project, summary.report_date)}
                      className={`relative rounded-[2px] border border-s-[3px] cursor-pointer transition-all hover:border-sky-400/60 flex flex-col ${surfacePanel} ${borderHairline} ${
                        boqEntriesCount > 0 ? 'border-s-emerald-400' : 'border-s-sky-400'
                      }`}
                    >
                      <div className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 ${borderHairline} ${surfaceHeader}`}>
                        <div className="min-w-0 flex items-center gap-2">
                          <BuildingOffice2Icon className={`w-4 h-4 shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                          <h3 className={`text-xs sm:text-sm font-bold truncate ${textPrimary}`}>
                            {summary.project_name}
                          </h3>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 rounded-[2px] border text-[10px] font-bold ${isDark ? stMeta.dark : stMeta.light}`}>
                          {stMeta.label}
                        </span>
                      </div>

                      <div className="p-3.5 space-y-3 flex-1">
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                          <CalendarDaysIcon className="w-4 h-4 shrink-0" />
                          <span>{formatJalaliDateLong(summary.report_date)}</span>
                        </div>

                        {/* متریک‌های کلیدی کارت */}
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className={`p-2 rounded-[2px] border ${borderHairline} ${isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'}`}>
                            <div className="text-[10px] text-slate-400">گزارش‌ها</div>
                            <div className={`text-sm font-bold tabular-nums ${textPrimary}`}>
                              {toPersianDigits(hrCount)}
                            </div>
                          </div>
                          <div className={`p-2 rounded-[2px] border ${borderHairline} ${isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'}`}>
                            <div className="text-[10px] text-slate-400">ردیف BOQ</div>
                            <div className={`text-sm font-bold tabular-nums ${boqEntriesCount > 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-700') : textSecondary}`}>
                              {toPersianDigits(boqEntriesCount)}
                            </div>
                          </div>
                          <div className={`p-2 rounded-[2px] border ${borderHairline} ${isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'}`}>
                            <div className="text-[10px] text-slate-400">حاضرین</div>
                            <div className={`text-sm font-bold tabular-nums ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              {toPersianDigits(attCount)}
                            </div>
                          </div>
                        </div>

                        {/* نمایش خلاصه ریالی فهرست بها روی کارت */}
                        {boqEntriesCount > 0 ? (
                          <div
                            className={`px-2.5 py-1.5 rounded-[2px] border flex items-center justify-between text-xs ${
                              isDark
                                ? 'bg-emerald-500/10 border-emerald-400/35 text-emerald-300'
                                : 'bg-emerald-50 border-emerald-600/35 text-emerald-800'
                            }`}
                          >
                            <span className="inline-flex items-center gap-1 font-bold text-[11px]">
                              <BanknotesIcon className="w-3.5 h-3.5" />
                              دارای فهرست بها
                            </span>
                            {isAdmin && (
                              <span className="font-bold tabular-nums text-[11px]">
                                {formatRial(boqCost)} ریال
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className={`px-2.5 py-1.5 rounded-[2px] border text-[10.5px] text-center ${borderHairline} ${textSecondary}`}>
                            بدون ردیف فهرست بها
                          </div>
                        )}
                      </div>

                      <div className={`px-3.5 py-2 border-t flex items-center justify-between text-[11px] font-bold ${borderHairline} ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                        <span>مشاهده پرونده کامل روز</span>
                        <span>←</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* نمای تکی (پرونده جامع روزانه: جریان تایید + گزارش‌ها + BOQ + تردد) */}
        {/* ═══════════════════════════════════════════════════════════ */}
        {!summaryLoading && isSingleMode && dailySummary && (
          <div className="space-y-4">

            {/* ── پنل وضعیت و جریان تایید گزارش روزانه + خلاصه فهرست بها ── */}
            <div className={`relative rounded-[2px] border p-4 space-y-4 ${surfacePanel} ${borderHairline} print:border-slate-300`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const st = DAILY_STATUS_META[dailySummary.status] || DAILY_STATUS_META.DRAFT;
                    return (
                      <span className={`px-2.5 py-1 rounded-[2px] border text-xs font-bold ${isDark ? st.dark : st.light}`}>
                        وضعیت پرونده روز: {st.label}
                      </span>
                    );
                  })()}
                  {dailySummary.pm_approved_by_name && (
                    <span className={`text-[11px] ${textSecondary}`}>
                      تایید مدیر پروژه: <strong className={textPrimary}>{dailySummary.pm_approved_by_name}</strong> ({formatDateTimeJalali(dailySummary.pm_approved_at)})
                    </span>
                  )}
                  {dailySummary.ceo_approved_by_name && (
                    <span className={`text-[11px] ${textSecondary}`}>
                      • تایید نهایی: <strong className={textPrimary}>{dailySummary.ceo_approved_by_name}</strong> ({formatDateTimeJalali(dailySummary.ceo_approved_at)})
                    </span>
                  )}
                </div>

                {/* دکمه‌های جریان تایید گزارش روزانه */}
                {dailySummary.id > 0 && (
                  <div className="print:hidden flex flex-wrap items-center gap-2">
                    {dailySummary.status === 'DRAFT' && (
                      <button
                        type="button"
                        disabled={busyId === 'daily-submit'}
                        onClick={() => handleDailyWorkflow('submit', 'ارسال پرونده برای تایید')}
                        className="h-8 px-3 rounded-[2px] bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold disabled:opacity-50"
                      >
                        ارسال برای تایید مدیر پروژه
                      </button>
                    )}
                    {dailySummary.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        disabled={busyId === 'daily-pm_approve'}
                        onClick={() => handleDailyWorkflow('pm_approve', 'تایید مدیر پروژه')}
                        className="h-8 px-3 rounded-[2px] bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold disabled:opacity-50"
                      >
                        تایید مدیر پروژه (PM)
                      </button>
                    )}
                    {dailySummary.status === 'PM_APPROVED' && (
                      <button
                        type="button"
                        disabled={busyId === 'daily-ceo_approve'}
                        onClick={() => handleDailyWorkflow('ceo_approve', 'تایید نهایی مدیرعامل')}
                        className="h-8 px-3 rounded-[2px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold disabled:opacity-50"
                      >
                        تایید نهایی مدیرعامل (CEO)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* کارت‌های آماری روزانه */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className={`p-3 rounded-[2px] border ${borderHairline} ${isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'}`}>
                  <div className={`text-[11px] ${textSecondary}`}>گزارش‌های سلسله‌مراتبی</div>
                  <div className={`text-lg font-bold tabular-nums mt-0.5 ${textPrimary}`}>
                    {toPersianDigits(sortedReports.length)}
                  </div>
                </div>
                <div className={`p-3 rounded-[2px] border ${borderHairline} ${isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'}`}>
                  <div className={`text-[11px] ${textSecondary}`}>ردیف‌های فهرست بها</div>
                  <div className={`text-lg font-bold tabular-nums mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {toPersianDigits(dailySummary.boq_summary?.entries_count || allSingleBoqEntries.length)}
                    <span className={`text-[11px] font-normal mr-1.5 ${textSecondary}`}>
                      ({toPersianDigits(dailySummary.boq_summary?.approved_entries_count || 0)} تاییدشده)
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-[2px] border ${borderHairline} ${isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'}`}>
                  <div className={`text-[11px] ${textSecondary}`}>جمع ریالی فهرست بهای امروز</div>
                  <div className={`text-lg font-bold tabular-nums mt-0.5 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                    {isAdmin ? (
                      <>
                        {formatRial(dailySummary.boq_summary?.total_cost || 0)}{' '}
                        <span className="text-[11px] font-normal">ریال</span>
                      </>
                    ) : (
                      <span className="text-xs opacity-60">سطح مدیریت</span>
                    )}
                  </div>
                </div>
                <div className={`p-3 rounded-[2px] border ${borderHairline} ${isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50'}`}>
                  <div className={`text-[11px] ${textSecondary}`}>تردد ثبت‌شده کارگران</div>
                  <div className={`text-lg font-bold tabular-nums mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                    {toPersianDigits(dailySummary.workers_attendance?.length || 0)}{' '}
                    <span className="text-[11px] font-normal">نفر</span>
                  </div>
                </div>
              </div>

              {/* تب‌بندی بخش‌های پرونده (در چاپ همه بخش‌ها چاپ می‌شوند) */}
              <div className="print:hidden flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { id: 'ALL', label: 'نمای کامل پرونده' },
                  { id: 'REPORTS', label: `گزارش‌های سلسله‌مراتبی (${toPersianDigits(sortedReports.length)})` },
                  { id: 'BOQ', label: `خلاصه فهرست بها (${toPersianDigits(allSingleBoqEntries.length)})` },
                  { id: 'ATTENDANCE', label: `حاضرین کارگاه (${toPersianDigits(dailySummary.workers_attendance?.length || 0)})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSingleActiveTab(tab.id)}
                    className={`h-8 px-3 rounded-[2px] border text-xs font-semibold tabular-nums transition-colors ${
                      singleActiveTab === tab.id
                        ? isDark
                          ? 'bg-sky-400/15 border-sky-400 text-sky-300'
                          : 'bg-sky-600 border-sky-700 text-white'
                        : isDark
                        ? 'bg-tactical-canvas border-slate-400/20 text-slate-300 hover:bg-tactical-hover'
                        : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── بخش ۱: گزارش‌های سلسله‌مراتبی (همراه با ریز BOQ، مشکلات، مدیا و مسیر) ── */}
            {(singleActiveTab === 'ALL' || singleActiveTab === 'REPORTS') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-5 rounded-[1px] ${isDark ? 'bg-sky-400' : 'bg-sky-600'}`} />
                  <h2 className={`text-sm sm:text-base font-bold ${textPrimary} print:text-black`}>
                    گزارش‌های سلسله‌مراتبی پروژه
                  </h2>
                </div>

                {sortedReports.length === 0 ? (
                  <div className={`p-8 text-center rounded-[2px] border text-xs ${surfacePanel} ${borderHairline} ${textSecondary}`}>
                    هیچ گزارش سلسله‌مراتبی برای این تاریخ ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {sortedReports.map((r) => {
                      const hrMeta = HR_STATUS_META[r.status] || HR_STATUS_META.SUBMITTED;
                      const level = r.author_position?.hierarchy_level ?? 0;
                      const indentClass = ['mr-0', 'sm:mr-4', 'sm:mr-8', 'sm:mr-12'][level] || 'mr-0';
                      const rBoqItems = r.boq_items || [];
                      const rBoqTotal = rBoqItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);

                      return (
                        <div
                          key={r.id}
                          className={`rounded-[2px] border border-s-[3px] overflow-hidden print:mr-0 print:break-inside-avoid ${indentClass} ${surfacePanel} ${borderHairline} ${
                            r.status === 'APPROVED'
                              ? 'border-s-emerald-400'
                              : r.status === 'REJECTED'
                              ? 'border-s-red-500'
                              : 'border-s-sky-400'
                          }`}
                        >
                          {/* هدر کارت گزارش */}
                          <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${borderHairline} ${surfaceHeader}`}>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold tabular-nums ${
                                  isDark ? 'bg-tactical-canvas border-slate-400/20 text-sky-300' : 'bg-white border-slate-900/15 text-sky-800'
                                }`}
                              >
                                سطح {toPersianDigits(level)}
                              </span>
                              <span className={`text-xs sm:text-sm font-bold ${textPrimary} print:text-black`}>
                                {r.author_name}
                              </span>
                              <span className={`text-xs ${textSecondary}`}>({r.position_title})</span>
                              <span className={`inline-flex items-center gap-1 text-[11px] font-mono ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                                <ClockIcon className="w-3.5 h-3.5" />
                                {formatTime(r.created_at)}
                              </span>
                              <span className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold ${isDark ? hrMeta.dark : hrMeta.light}`}>
                                {hrMeta.label}
                              </span>
                            </div>

                            {/* اکشن‌های گزارش */}
                            <div className="print:hidden flex flex-wrap items-center gap-1.5">
                              {r.status === 'SUBMITTED' && (
                                <>
                                  <button
                                    type="button"
                                    disabled={actionLoading || busyId === `hr-${r.id}`}
                                    onClick={() => handleApproveHierarchical(r.id)}
                                    className={`h-7 px-2.5 rounded-[2px] border text-[11px] font-bold inline-flex items-center gap-1 ${
                                      isDark
                                        ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/25'
                                        : 'bg-emerald-50 border-emerald-600/40 text-emerald-800 hover:bg-emerald-100'
                                    }`}
                                  >
                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                    <span>تایید</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionLoading}
                                    onClick={() => setRejectModalReport(r)}
                                    className={`h-7 px-2.5 rounded-[2px] border text-[11px] font-bold inline-flex items-center gap-1 ${
                                      isDark
                                        ? 'bg-red-500/15 border-red-400/50 text-red-300 hover:bg-red-500/25'
                                        : 'bg-red-50 border-red-600/40 text-red-700 hover:bg-red-100'
                                    }`}
                                  >
                                    <XCircleIcon className="w-3.5 h-3.5" />
                                    <span>رد</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => setBoqModalState({ mode: 'CREATE', report: r, entry: null })}
                                className={`h-7 px-2.5 rounded-[2px] border text-[11px] font-bold inline-flex items-center gap-1 ${
                                  isDark
                                    ? 'bg-sky-400/10 border-sky-400/40 text-sky-300 hover:bg-sky-400/20'
                                    : 'bg-sky-50 border-sky-600/35 text-sky-800 hover:bg-sky-100'
                                }`}
                              >
                                <PlusIcon className="w-3.5 h-3.5" />
                                <span>ردیف BOQ</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditModalReport(r)}
                                className={`h-7 w-7 rounded-[2px] border inline-flex items-center justify-center ${
                                  isDark
                                    ? 'border-slate-400/20 text-amber-300 hover:bg-amber-400/15'
                                    : 'border-slate-900/15 text-amber-700 hover:bg-amber-50'
                                }`}
                                title="ویرایش گزارش"
                              >
                                <PencilSquareIcon className="w-3.5 h-3.5" />
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  disabled={busyId === `del-${r.id}`}
                                  onClick={() => handleDeleteHierarchical(r)}
                                  className={`h-7 w-7 rounded-[2px] border inline-flex items-center justify-center ${
                                    isDark
                                      ? 'border-slate-400/20 text-red-400 hover:bg-red-500/15'
                                      : 'border-slate-900/15 text-red-600 hover:bg-red-50'
                                  }`}
                                  title="حذف گزارش"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* بدنه کارت گزارش */}
                          <div className="p-4 space-y-3">
                            {/* اطلاعات تایید یا رد */}
                            {(r.approved_by_name || r.rejection_reason) && (
                              <div
                                className={`px-3 py-2 rounded-[2px] border text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1 ${
                                  r.status === 'REJECTED'
                                    ? isDark
                                      ? 'bg-red-500/10 border-red-500/35 text-red-300'
                                      : 'bg-red-50 border-red-600/35 text-red-800'
                                    : isDark
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-emerald-50 border-emerald-600/30 text-emerald-800'
                                }`}
                              >
                                {r.approved_by_name && (
                                  <span>
                                    بررسی توسط: <strong>{r.approved_by_name}</strong> ({formatDateTimeJalali(r.approved_at)})
                                  </span>
                                )}
                                {r.rejection_reason && (
                                  <span>
                                    علت رد: <strong>{r.rejection_reason}</strong>
                                  </span>
                                )}
                              </div>
                            )}

                            {/* شرح عملیات */}
                            {r.work_summary && (
                              <div
                                className={`p-3 rounded-[2px] border text-xs sm:text-sm leading-7 whitespace-pre-wrap break-words ${
                                  isDark
                                    ? 'bg-tactical-canvas/80 border-slate-400/15 text-slate-200'
                                    : 'bg-slate-50 border-slate-900/10 text-slate-800'
                                } print:bg-white print:text-black`}
                              >
                                {r.work_summary}
                              </div>
                            )}

                            {/* مشکلات و موانع (issues) */}
                            {r.issues && (
                              <div
                                className={`p-3 rounded-[2px] border border-s-2 text-xs leading-6 whitespace-pre-wrap ${
                                  isDark
                                    ? 'bg-amber-400/10 border-amber-400/30 border-s-amber-400 text-amber-200'
                                    : 'bg-amber-50 border-amber-600/30 border-s-amber-600 text-amber-900'
                                }`}
                              >
                                <div className="font-bold flex items-center gap-1.5 mb-1">
                                  <ExclamationTriangleIcon className="w-4 h-4 shrink-0" />
                                  <span>مشکلات و موانع گزارش‌شده:</span>
                                </div>
                                {r.issues}
                              </div>
                            )}

                            {/* جدول ریز ردیف‌های فهرست بهای این گزارش */}
                            {rBoqItems.length > 0 && (
                              <div className={`rounded-[2px] border overflow-hidden ${borderHairline}`}>
                                <div
                                  className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${borderHairline} ${
                                    isDark ? 'bg-emerald-500/10 text-emerald-300' : 'bg-emerald-50 text-emerald-900'
                                  }`}
                                >
                                  <span className="font-bold inline-flex items-center gap-1.5">
                                    <BanknotesIcon className="w-4 h-4" />
                                    ردیف‌های فهرست بهای این گزارش ({toPersianDigits(rBoqItems.length)} مورد)
                                  </span>
                                  {isAdmin && (
                                    <span className="font-bold tabular-nums">
                                      جمع: {formatRial(rBoqTotal)} ریال
                                    </span>
                                  )}
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-right text-xs border-collapse">
                                    <thead className={`text-[11px] font-bold border-b ${borderHairline} ${surfaceHeader} ${textSecondary}`}>
                                      <tr>
                                        <th className="px-3 py-2">کد</th>
                                        <th className="px-3 py-2">شرح آیتم</th>
                                        <th className="px-3 py-2 text-center">مقدار</th>
                                        {isAdmin && <th className="px-3 py-2 text-center">بهای واحد</th>}
                                        {isAdmin && <th className="px-3 py-2 text-center">جمع کل (ریال)</th>}
                                        <th className="px-3 py-2">توضیحات</th>
                                        <th className="px-3 py-2 text-center">تاییدیه</th>
                                        <th className="print:hidden px-3 py-2 text-center">عملیات</th>
                                      </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-slate-400/10' : 'divide-slate-200'}`}>
                                      {rBoqItems.map((entry) => (
                                        <tr key={entry.id} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                                          <td className="px-3 py-2 font-mono font-bold text-sky-400 whitespace-nowrap">
                                            {entry.boq_item_code}
                                          </td>
                                          <td className={`px-3 py-2 font-semibold ${textPrimary}`}>
                                            {entry.boq_item_title}
                                          </td>
                                          <td className="px-3 py-2 text-center font-bold tabular-nums whitespace-nowrap">
                                            {toPersianDigits(entry.quantity)} {entry.unit_display}
                                          </td>
                                          {isAdmin && (
                                            <td className="px-3 py-2 text-center tabular-nums whitespace-nowrap">
                                              {formatRial(entry.unit_price_snapshot)}
                                            </td>
                                          )}
                                          {isAdmin && (
                                            <td className={`px-3 py-2 text-center font-bold tabular-nums whitespace-nowrap ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                              {formatRial(entry.total_price)}
                                            </td>
                                          )}
                                          <td className={`px-3 py-2 text-[11px] ${textSecondary}`}>
                                            {entry.notes || '---'}
                                          </td>
                                          <td className="px-3 py-2 text-center whitespace-nowrap">
                                            {entry.approved_by ? (
                                              <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[10px] font-bold ${
                                                  isDark
                                                    ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                                                    : 'bg-emerald-50 border-emerald-600/35 text-emerald-800'
                                                }`}
                                                title={entry.approved_by_name || ''}
                                              >
                                                <CheckBadgeIcon className="w-3.5 h-3.5" />
                                                {entry.approved_by_name || 'تاییدشده'}
                                              </span>
                                            ) : (
                                              <button
                                                type="button"
                                                disabled={busyId === `boq-approve-${entry.id}`}
                                                onClick={() => handleApproveBoqEntry(entry.id)}
                                                className={`print:hidden px-2 py-0.5 rounded-[2px] border text-[10px] font-bold transition-colors ${
                                                  isDark
                                                    ? 'bg-amber-400/15 border-amber-400/45 text-amber-300 hover:bg-amber-400/25'
                                                    : 'bg-amber-50 border-amber-600/40 text-amber-800 hover:bg-amber-100'
                                                }`}
                                              >
                                                تایید ردیف
                                              </button>
                                            )}
                                          </td>
                                          <td className="print:hidden px-3 py-2 text-center whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => setBoqModalState({ mode: 'EDIT', report: r, entry })}
                                                className={`p-1 rounded-[2px] border ${
                                                  isDark
                                                    ? 'border-slate-400/20 text-sky-400 hover:bg-sky-400/15'
                                                    : 'border-slate-900/15 text-sky-700 hover:bg-sky-50'
                                                }`}
                                                title="ویرایش ردیف"
                                              >
                                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                disabled={busyId === `boq-del-${entry.id}`}
                                                onClick={() => handleDeleteBoqEntry(entry)}
                                                className={`p-1 rounded-[2px] border ${
                                                  isDark
                                                    ? 'border-slate-400/20 text-red-400 hover:bg-red-500/15'
                                                    : 'border-slate-900/15 text-red-600 hover:bg-red-50'
                                                }`}
                                                title="حذف ردیف"
                                              >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* مسیر GPS کارگر */}
                            <RouteLogCard routeLog={r.route_log} isDark={isDark} />

                            {/* گالری رسانه‌ها */}
                            <MediaSection
                              files={r.media_files}
                              isDark={isDark}
                              onOpenLightbox={(images, index) => setLightboxState({ images, index })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── بخش ۲: نمای تجمیعی فهرست بهای امروز پروژه (تب BOQ) ── */}
            {singleActiveTab === 'BOQ' && (
              <div className={`rounded-[2px] border overflow-hidden ${surfacePanel} ${borderHairline}`}>
                <div className={`px-4 py-3 border-b flex items-center justify-between ${borderHairline} ${surfaceHeader}`}>
                  <h2 className={`text-sm font-bold flex items-center gap-2 ${textPrimary}`}>
                    <BanknotesIcon className="w-4 h-4 text-emerald-400" />
                    تجمیع کل ردیف‌های فهرست بهای این روز ({toPersianDigits(allSingleBoqEntries.length)} ردیف)
                  </h2>
                  {isAdmin && (
                    <span className={`text-xs font-bold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      جمع کل: {formatRial(dailySummary.boq_summary?.total_cost || 0)} ریال
                    </span>
                  )}
                </div>

                {allSingleBoqEntries.length === 0 ? (
                  <p className={`p-8 text-center text-xs ${textSecondary}`}>
                    هیچ ردیف فهرست بهایی در این تاریخ ثبت نشده است.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead className={`text-[11px] font-bold border-b ${borderHairline} ${surfaceHeader} ${textSecondary}`}>
                        <tr>
                          <th className="px-3.5 py-2.5">ثبت‌کننده</th>
                          <th className="px-3.5 py-2.5">کد</th>
                          <th className="px-3.5 py-2.5">شرح آیتم</th>
                          <th className="px-3.5 py-2.5 text-center">مقدار</th>
                          {isAdmin && <th className="px-3.5 py-2.5 text-center">بهای واحد</th>}
                          {isAdmin && <th className="px-3.5 py-2.5 text-center">جمع (ریال)</th>}
                          <th className="px-3.5 py-2.5 text-center">وضعیت تایید</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-400/10' : 'divide-slate-200'}`}>
                        {allSingleBoqEntries.map((entry) => (
                          <tr key={entry.id} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                            <td className="px-3.5 py-2.5">
                              <div className={`font-bold ${textPrimary}`}>{entry.authorName}</div>
                              <div className={`text-[10px] ${textSecondary}`}>{entry.positionTitle}</div>
                            </td>
                            <td className="px-3.5 py-2.5 font-mono font-bold text-sky-400">{entry.boq_item_code}</td>
                            <td className={`px-3.5 py-2.5 font-semibold ${textPrimary}`}>{entry.boq_item_title}</td>
                            <td className="px-3.5 py-2.5 text-center font-bold tabular-nums">
                              {toPersianDigits(entry.quantity)} {entry.unit_display}
                            </td>
                            {isAdmin && (
                              <td className="px-3.5 py-2.5 text-center tabular-nums">
                                {formatRial(entry.unit_price_snapshot)}
                              </td>
                            )}
                            {isAdmin && (
                              <td className={`px-3.5 py-2.5 text-center font-bold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {formatRial(entry.total_price)}
                              </td>
                            )}
                            <td className="px-3.5 py-2.5 text-center">
                              {entry.approved_by ? (
                                <span className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold ${isDark ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' : 'bg-emerald-50 border-emerald-600/35 text-emerald-800'}`}>
                                  تایید توسط {entry.approved_by_name}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleApproveBoqEntry(entry.id)}
                                  className={`px-2.5 py-0.5 rounded-[2px] border text-[10px] font-bold ${isDark ? 'bg-amber-400/15 border-amber-400/45 text-amber-300' : 'bg-amber-50 border-amber-600/40 text-amber-800'}`}
                                >
                                  تایید ردیف
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── بخش ۳: جدول تردد کارگران پروژه در آن روز ── */}
            {(singleActiveTab === 'ALL' || singleActiveTab === 'ATTENDANCE') && (
              <div className={`rounded-[2px] border overflow-hidden print:break-inside-avoid ${surfacePanel} ${borderHairline}`}>
                <div className={`px-4 py-3 border-b flex items-center justify-between ${borderHairline} ${surfaceHeader}`}>
                  <h2 className={`text-sm font-bold flex items-center gap-2 ${textPrimary} print:text-black`}>
                    <UsersIcon className="w-4 h-4 text-sky-400" />
                    فهرست حضور و تردد کارگران پروژه ({toPersianDigits(dailySummary.workers_attendance?.length || 0)} نفر)
                  </h2>
                </div>

                {!dailySummary.workers_attendance?.length ? (
                  <p className={`p-6 text-center text-xs ${textSecondary}`}>
                    ترددی برای این پروژه در تاریخ انتخاب‌شده ثبت نشده است.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs border-collapse">
                      <thead className={`text-[11px] font-bold border-b ${borderHairline} ${surfaceHeader} ${textSecondary}`}>
                        <tr>
                          <th className="px-3.5 py-2.5 w-12 text-center">ردیف</th>
                          <th className="px-3.5 py-2.5">نام پرسنل</th>
                          <th className="px-3.5 py-2.5">سمت</th>
                          <th className="px-3.5 py-2.5 text-center">ورود</th>
                          <th className="px-3.5 py-2.5 text-center">خروج</th>
                          <th className="px-3.5 py-2.5 text-center">مدت (ساعت)</th>
                          <th className="px-3.5 py-2.5 text-center">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-400/10' : 'divide-slate-200'}`}>
                        {dailySummary.workers_attendance.map((att, idx) => {
                          const hrs = calcHours(att.time_in, att.time_out);
                          return (
                            <tr key={`${att.worker_id}-${idx}`} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                              <td className="px-3.5 py-2 text-center tabular-nums">{toPersianDigits(idx + 1)}</td>
                              <td className={`px-3.5 py-2 font-bold ${textPrimary}`}>{att.worker_name}</td>
                              <td className={`px-3.5 py-2 ${textSecondary}`}>{att.position_title || '---'}</td>
                              <td className="px-3.5 py-2 text-center font-mono tabular-nums">{formatTime(att.time_in)}</td>
                              <td className="px-3.5 py-2 text-center font-mono tabular-nums">
                                {att.time_out ? formatTime(att.time_out) : <span className="text-amber-400 font-sans">در حال کار</span>}
                              </td>
                              <td className="px-3.5 py-2 text-center font-bold tabular-nums">{hrs || '---'}</td>
                              <td className="px-3.5 py-2 text-center">
                                <span className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold ${isDark ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300' : 'bg-emerald-50 border-emerald-600/35 text-emerald-800'}`}>
                                  {att.status === 'PRESENT' ? 'حاضر' : att.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ مودال‌ها ═══ */}
      {rejectModalReport && (
        <RejectReportModal
          report={rejectModalReport}
          isDark={isDark}
          loading={actionLoading}
          onConfirm={handleRejectHierarchical}
          onClose={() => setRejectModalReport(null)}
        />
      )}

      {editModalReport && (
        <EditReportModal
          report={editModalReport}
          isDark={isDark}
          loading={busyId === `edit-${editModalReport.id}`}
          onSave={handleSaveEditReport}
          onClose={() => setEditModalReport(null)}
        />
      )}

      {boqModalState && (
        <BoqEntryModal
          mode={boqModalState.mode}
          entry={boqModalState.entry}
          boqItems={boqItems}
          isDark={isDark}
          canSeeCost={isAdmin}
          loading={busyId === 'boq-modal'}
          onSubmit={handleSubmitBoqModal}
          onClose={() => setBoqModalState(null)}
        />
      )}

      {createUnifiedOpen && (
        <UnifiedReportCreateModal
          projects={projectsList || []}
          boqItems={boqItems || []}
          defaultProjectId={selectedProjectId || dailySummary?.project || ''}
          isDark={isDark}
          loading={submitLoading}
          onSubmit={handleSubmitUnified}
          onClose={() => setCreateUnifiedOpen(false)}
        />
      )}

      {lightboxState && (
        <MediaLightboxModal
          images={lightboxState.images}
          currentIndex={lightboxState.index}
          onChangeIndex={(nextIdx) => setLightboxState((prev) => ({ ...prev, index: nextIdx }))}
          onClose={() => setLightboxState(null)}
        />
      )}
    </div>
  );
};

export default DailySummaryScreen;