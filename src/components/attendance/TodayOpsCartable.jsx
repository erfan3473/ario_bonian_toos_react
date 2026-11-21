// src/components/attendance/TodayOpsCartable.jsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import moment from 'moment-jalaali';
import axiosInstance from '../../api/axiosInstance';
import { toggleRoutineItem } from '../../features/routine/routineSlice';
import { startTaskStep, returnTaskStep, uploadTaskFile } from '../../features/task/taskSlice';
import { ConfirmModal, ForwardModal, ReturnModal } from '../Task/TaskModals';
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PlayIcon,
  QueueListIcon,
  ShieldCheckIcon,
  ArrowUturnRightIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const URGENCY_META = {
  CRITICAL: { label: 'بحرانی', badgeDark: 'bg-red-500/15 border-red-500/45 text-red-300', badgeLight: 'bg-red-50 border-red-600/40 text-red-700', bar: 'border-s-red-500' },
  HIGH: { label: 'زیاد', badgeDark: 'bg-amber-400/15 border-amber-400/45 text-amber-300', badgeLight: 'bg-amber-50 border-amber-600/40 text-amber-800', bar: 'border-s-amber-500' },
  MEDIUM: { label: 'متوسط', badgeDark: 'bg-sky-400/15 border-sky-400/40 text-sky-300', badgeLight: 'bg-sky-50 border-sky-600/35 text-sky-800', bar: 'border-s-sky-500' },
  LOW: { label: 'کم', badgeDark: 'bg-slate-400/10 border-slate-400/30 text-slate-300', badgeLight: 'bg-slate-100 border-slate-400 text-slate-700', bar: 'border-s-slate-400' },
};

const DIFFICULTY_BORDER = {
  EXPERT: 'border-s-red-500',
  HARD: 'border-s-amber-400',
  MEDIUM: 'border-s-sky-400',
  EASY: 'border-s-emerald-400',
};

const DEADLINE_BUCKET_META = {
  OVERDUE: { label: 'عقب‌افتاده', dark: 'bg-red-500/20 border-red-500/50 text-red-300', light: 'bg-red-50 border-red-600/45 text-red-700' },
  TODAY: { label: 'مهلت امروز', dark: 'bg-amber-400/20 border-amber-400/50 text-amber-300', light: 'bg-amber-50 border-amber-600/45 text-amber-800' },
  TOMORROW: { label: 'مهلت فردا', dark: 'bg-sky-400/15 border-sky-400/40 text-sky-300', light: 'bg-sky-50 border-sky-600/35 text-sky-800' },
  LATER: { label: 'آینده', dark: 'bg-slate-500/15 border-slate-400/30 text-slate-300', light: 'bg-slate-100 border-slate-300 text-slate-700' },
  NONE: null,
};

const ROLE_LABELS = {
  ASSIGNEE: 'مجری',
  INTERMEDIATE_APPROVER: 'تاییدکننده میانی',
  BOTH: 'مجری و تاییدکننده',
};

const CornerBrackets = ({ accent = 'cyan', isDark = true }) => {
  const accentMap = {
    cyan: isDark ? 'border-sky-400/65' : 'border-sky-600/65',
    amber: isDark ? 'border-amber-400/65' : 'border-amber-600/65',
    emerald: isDark ? 'border-emerald-400/65' : 'border-emerald-600/65',
  };
  const colorClass = accentMap[accent] || accentMap.cyan;

  return (
    <>
      <span aria-hidden="true" className={`pointer-events-none absolute top-0 start-0 w-2 h-2 border-t border-s ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute top-0 end-0 w-2 h-2 border-t border-e ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 start-0 w-2 h-2 border-b border-s ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 end-0 w-2 h-2 border-b border-e ${colorClass}`} />
    </>
  );
};

const TodayOpsCartable = ({ isDark = true }) => {
  const dispatch = useDispatch();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL | TASKS | ROUTINES

  // استیت‌های اکشن‌های آنی
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [busyRoutineItemId, setBusyRoutineItemId] = useState(null);
  const [uploadingTaskId, setUploadingTaskId] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // { type: 'approve'|'reject'|'forward'|'return', task }

  const quickFileInputRef = useRef(null);
  const uploadTargetTaskRef = useRef(null);

  const fetchCartable = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await axiosInstance.get('/routines/attendance-cartable/');
      setData(res.data);
    } catch (err) {
      if (!silent) {
        toast.error(err?.response?.data?.detail || 'خطا در بارگذاری کارتابل عملیات امروز');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCartable(false);
  }, [fetchCartable]);

  // گروه‌بندی آیتم‌های وظایف امروز بر اساس بازه زمانی (تایم‌بلاک) و قرار دادن ناتمام‌ها بالاتر
  const groupedRoutines = useMemo(() => {
    if (!data?.routines?.length) return [];

    const tbMap = new Map();
    (data.time_blocks || []).forEach((tb) => {
      tbMap.set(String(tb.id), {
        id: String(tb.id),
        title: tb.title,
        timeRange: `${tb.start_time.substring(0, 5)} تا ${tb.end_time.substring(0, 5)}`,
        order: tb.start_time,
        items: [],
      });
    });

    const unassignedBucket = {
      id: 'UNASSIGNED',
      title: 'بدون بازه زمانی مشخص',
      timeRange: null,
      order: '99:99',
      items: [],
    };

    data.routines.forEach((routine) => {
      const details = routine.template_details || {};
      (routine.items || []).forEach((item) => {
        const enriched = {
          ...item,
          routineTitle: details.title || 'وظایف روزانه',
          difficulty: details.difficulty || 'MEDIUM',
          reminderTime: details.reminder_time || null,
          estimatedMinutes: routine.estimated_minutes || 0,
        };
        const tbKey = item.time_block ? String(item.time_block) : 'UNASSIGNED';
        if (tbMap.has(tbKey)) {
          tbMap.get(tbKey).items.push(enriched);
        } else {
          unassignedBucket.items.push(enriched);
        }
      });
    });

    const groups = [...Array.from(tbMap.values()), unassignedBucket]
      .filter((g) => g.items.length > 0)
      .map((g) => ({
        ...g,
        items: [...g.items].sort((a, b) => Number(a.is_done) - Number(b.is_done) || a.order - b.order),
      }));

    return groups;
  }, [data]);

  // اکشن تیک زدن وظایف
  const handleToggleRoutineItem = async (itemId) => {
    if (busyRoutineItemId) return;
    setBusyRoutineItemId(itemId);
    try {
      await dispatch(toggleRoutineItem(itemId)).unwrap();
      await fetchCartable(true);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در به‌روزرسانی آیتم وظایف');
    } finally {
      setBusyRoutineItemId(null);
    }
  };

  // اکشن شروع / مشاهده و دریافت ماموریت
  const handleStartTask = async (task) => {
    setBusyTaskId(task.id);
    try {
      const res = await dispatch(startTaskStep(task.id)).unwrap();
      toast.success(res?.detail || 'دریافت و شروع ماموریت ثبت شد.');
      await fetchCartable(true);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در ثبت شروع ماموریت');
    } finally {
      setBusyTaskId(null);
    }
  };

  // اکشن تایید / رد / برگشت
  const handleApproveTask = async (note) => {
    if (!activeModal?.task) return;
    await axiosInstance.post(`/tasks/${activeModal.task.id}/approve/`, { note });
    toast.success('تایید مرحله با موفقیت ثبت شد.');
    setActiveModal(null);
    await fetchCartable(true);
  };

  const handleRejectTask = async (note) => {
    if (!activeModal?.task) return;
    await axiosInstance.post(`/tasks/${activeModal.task.id}/reject/`, { note });
    toast.success('عدم تایید / رد ماموریت ثبت شد.');
    setActiveModal(null);
    await fetchCartable(true);
  };

  const handleReturnTask = async (targetIds, note) => {
    if (!activeModal?.task) return;
    await dispatch(returnTaskStep({ taskId: activeModal.task.id, target_user_ids: targetIds, note })).unwrap();
    toast.success('ماموریت جهت اصلاح به مجریان برگشت داده شد.');
    setActiveModal(null);
    await fetchCartable(true);
  };

  // آپلود سریع فایل برای مراحل require_file
  const triggerQuickUpload = (taskId) => {
    uploadTargetTaskRef.current = taskId;
    quickFileInputRef.current?.click();
  };

  const handleQuickFileChange = async (e) => {
    const file = e.target.files?.[0];
    const targetTaskId = uploadTargetTaskRef.current;
    e.target.value = '';
    if (!file || !targetTaskId) return;

    setUploadingTaskId(targetTaskId);
    try {
      await dispatch(uploadTaskFile({ taskId: targetTaskId, file })).unwrap();
      toast.success(`فایل «${file.name}» به پرونده ماموریت پیوست شد.`);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'خطا در آپلود فایل پیوست');
    } finally {
      setUploadingTaskId(null);
      uploadTargetTaskRef.current = null;
    }
  };

  if (loading) {
    return (
      <div
        className={`relative rounded-[2px] border p-4 ${
          isDark
            ? 'bg-tactical-surface1 border-slate-400/20'
            : 'bg-white border-slate-900/15'
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ArrowPathIcon className="w-4 h-4 animate-spin text-sky-400" />
          <span>در حال همگام‌سازی پرونده ماموریت‌ها و چک‌لیست امروز...</span>
        </div>
      </div>
    );
  }

  // اگر کاربر امروز نه ماموریتی داشت و نه آیتم وظایفی، کل بخش را رندر نکن
  if (!data?.summary?.has_any) {
    return null;
  }

  const { summary, tasks = [] } = data;
  const routineProgress =
    summary.routine_total_items > 0
      ? Math.round((summary.routine_done_items / summary.routine_total_items) * 100)
      : 0;

  const hasTasks = tasks.length > 0;
  const hasRoutines = summary.routine_total_items > 0;

  const showTasksPane = hasTasks && (activeFilter === 'ALL' || activeFilter === 'TASKS');
  const showRoutinesPane = hasRoutines && (activeFilter === 'ALL' || activeFilter === 'ROUTINES');
  const twoColumnLayout = showTasksPane && showRoutinesPane;

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-white';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <section
      aria-label="میز عملیات و دستورکار امروز"
      className={`relative rounded-[2px] border overflow-hidden ${surfacePanel} ${
        summary.tasks_action_required > 0
          ? isDark
            ? 'border-sky-400/45'
            : 'border-sky-600/45'
          : borderHairline
      }`}
    >
      <CornerBrackets accent={summary.tasks_action_required > 0 ? 'cyan' : 'emerald'} isDark={isDark} />

      <input
        ref={quickFileInputRef}
        type="file"
        className="hidden"
        onChange={handleQuickFileChange}
      />

      {/* ── سرصفحه تاکتیکی Command Brief ── */}
      <div
        className={`px-3.5 py-2.5 sm:px-4 sm:py-3 border-b flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${borderHairline} ${surfaceHeader}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-[2px] border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-sky-400/10 border-sky-400/40 text-sky-400'
                : 'bg-sky-50 border-sky-600/35 text-sky-700'
            }`}
          >
            <ShieldCheckIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-xs sm:text-sm font-bold tracking-normal ${textPrimary}`}>
               شرحی کوتاه از امروز
              </h2>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border text-[10px] font-semibold tabular-nums ${
                  isDark
                    ? 'bg-tactical-canvas border-slate-400/20 text-sky-300'
                    : 'bg-white border-slate-900/15 text-sky-800'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {toPersianDigits(data.date_jalali)}
              </span>
            </div>
            <p className={`text-[10.5px] mt-0.5 tracking-normal ${textSecondary}`}>
              ماموریت‌های در نوبت اقدام یا پیش‌رو (امروز و فردا) و چک‌لیست وظایف‌های امروز
            </p>
          </div>
        </div>

        {/* شمارنده‌های خلاصه + فیلتر سریع + بروزرسانی */}
        <div className="flex flex-wrap items-center gap-1.5">
          {hasTasks && hasRoutines && (
            <div className={`inline-flex rounded-[2px] border p-0.5 ${borderHairline} ${isDark ? 'bg-tactical-canvas' : 'bg-white'}`}>
              {[
                { id: 'ALL', label: 'نمای یکپارچه' },
                { id: 'TASKS', label: `ماموریت‌ها (${toPersianDigits(summary.tasks_total)})` },
                { id: 'ROUTINES', label: `وظایف‌ها (${toPersianDigits(summary.routine_remaining_items)})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`h-6 px-2 rounded-[2px] text-[10.5px] font-semibold tabular-nums transition-colors ${
                    activeFilter === tab.id
                      ? isDark
                        ? 'bg-sky-400 text-slate-950'
                        : 'bg-sky-600 text-white'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchCartable(true)}
            disabled={refreshing}
            className={`h-7 px-2 rounded-[2px] border inline-flex items-center gap-1 text-[10.5px] font-semibold transition-colors ${
              isDark
                ? 'bg-tactical-canvas border-slate-400/20 text-slate-300 hover:border-sky-400/50 hover:text-sky-300'
                : 'bg-white border-slate-900/15 text-slate-700 hover:border-sky-600/50 hover:text-sky-700'
            }`}
            title="بروزرسانی کارتابل"
          >
            <ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
            <span className="hidden sm:inline">بروزرسانی</span>
          </button>
        </div>
      </div>

      {/* ── نوار وضعیت KPI فشرده ── */}
      <div
        className={`grid grid-cols-3 border-b divide-x divide-x-reverse text-center ${borderHairline} ${
          isDark ? 'divide-slate-400/15 bg-tactical-canvas/60' : 'divide-slate-900/10 bg-slate-50/70'
        }`}
      >
        <div className="py-2 px-2">
          <div className={`text-[10px] font-medium ${textSecondary}`}>نیازمند اقدام شما</div>
          <div
            className={`text-sm sm:text-base font-bold tabular-nums mt-0.5 ${
              summary.tasks_action_required > 0
                ? isDark
                  ? 'text-amber-400'
                  : 'text-amber-700'
                : textSecondary
            }`}
          >
            {toPersianDigits(summary.tasks_action_required)}{' '}
            <span className="text-[10px] font-normal">پرونده</span>
          </div>
        </div>
        <div className="py-2 px-2">
          <div className={`text-[10px] font-medium ${textSecondary}`}>در مسیر (امروز/فردا)</div>
          <div className={`text-sm sm:text-base font-bold tabular-nums mt-0.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
            {toPersianDigits(summary.tasks_upcoming)}{' '}
            <span className="text-[10px] font-normal">پرونده</span>
          </div>
        </div>
        <div className="py-2 px-2">
          <div className={`text-[10px] font-medium ${textSecondary}`}>پیشرفت وظایف امروز</div>
          <div className={`text-sm sm:text-base font-bold tabular-nums mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {toPersianDigits(summary.routine_done_items)}/{toPersianDigits(summary.routine_total_items)}{' '}
            <span className="text-[10px] font-normal">({toPersianDigits(routineProgress)}٪)</span>
          </div>
        </div>
      </div>

      {/* ── بدنه دو ستونه (ماموریت‌ها | وظایف‌های امروز) ── */}
      <div className={`grid grid-cols-1 ${twoColumnLayout ? 'lg:grid-cols-12' : ''} divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse ${isDark ? 'divide-slate-400/15' : 'divide-slate-900/15'}`}>

        {/* ═══ ستون ۱: پرونده‌های ماموریت ═══ */}
        {showTasksPane && (
          <div className={`${twoColumnLayout ? 'lg:col-span-7' : ''} p-3 sm:p-4 space-y-2.5`}>
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-slate-500/25">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-4 rounded-[1px] ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`} />
                <h3 className={`text-xs sm:text-sm font-bold ${textPrimary}`}>
                  پرونده‌های ماموریت ({toPersianDigits(tasks.length)})
                </h3>
              </div>
              <Link
                to="/tasks"
                className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                  isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
                }`}
              >
                <span>کارتابل کامل ماموریت‌ها</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pe-0.5">
              {tasks.map((task) => {
                const urgency = URGENCY_META[task.urgency] || URGENCY_META.MEDIUM;
                const dlMeta = DEADLINE_BUCKET_META[task.deadline_bucket];
                const isActionRequired = task.action_status === 'ACTION_REQUIRED';
                const isBusy = busyTaskId === task.id;
                const isUploading = uploadingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`rounded-[2px] border border-s-[3px] transition-colors ${urgency.bar} ${
                      isActionRequired
                        ? isDark
                          ? 'bg-tactical-canvas/90 border-slate-400/25 hover:border-sky-400/45'
                          : 'bg-white border-slate-900/15 hover:border-sky-600/45'
                        : isDark
                        ? 'bg-tactical-canvas/55 border-slate-400/15 opacity-90'
                        : 'bg-slate-50/80 border-slate-900/15 opacity-95'
                    }`}
                  >
                    {/* ردیف بالای کارت: شماره پرونده، وضعیت نوبت، فوریت، مهلت و لینک مستقیم */}
                    <div
                      className={`px-2.5 py-1.5 border-b flex flex-wrap items-center justify-between gap-1.5 ${borderHairline} ${
                        isDark ? 'bg-tactical-surface2/60' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded-[2px] border text-[10px] font-bold tabular-nums ${
                            isDark
                              ? 'bg-tactical-canvas border-slate-400/20 text-slate-300'
                              : 'bg-white border-slate-900/15 text-slate-700'
                          }`}
                        >
                          #{toPersianDigits(task.id)}
                        </span>

                        {isActionRequired ? (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border text-[10px] font-bold ${
                              isDark
                                ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300'
                                : 'bg-emerald-50 border-emerald-600/40 text-emerald-800'
                            }`}
                          >
                            <BoltIcon className="w-3 h-3" />
                            نوبت اقدام شما ({ROLE_LABELS[task.user_role] || task.user_role})
                          </span>
                        ) : task.action_status === 'WAITING_ASSIGNEES' ? (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border text-[10px] font-bold ${
                              isDark
                                ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                                : 'bg-amber-50 border-amber-600/35 text-amber-800'
                            }`}
                          >
                            <ClockIcon className="w-3 h-3" />
                            در انتظار اتمام مجریان (تاییدکننده)
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border text-[10px] font-bold ${
                              isDark
                                ? 'bg-sky-400/10 border-sky-400/35 text-sky-300'
                                : 'bg-sky-50 border-sky-600/30 text-sky-800'
                            }`}
                          >
                            <ClockIcon className="w-3 h-3" />
                            مرحله پیش‌رو ({ROLE_LABELS[task.user_role] || task.user_role})
                          </span>
                        )}

                        <span className={`px-1.5 py-0.5 rounded-[2px] border text-[10px] font-semibold ${isDark ? urgency.badgeDark : urgency.badgeLight}`}>
                          فوریت: {urgency.label}
                        </span>

                        {dlMeta && (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border text-[10px] font-bold ${isDark ? dlMeta.dark : dlMeta.light}`}>
                            {task.deadline_bucket === 'OVERDUE' && <ExclamationTriangleIcon className="w-3 h-3" />}
                            {dlMeta.label}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/tasks/${task.id}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[10.5px] font-bold transition-colors ${
                          isDark
                            ? 'bg-sky-400/10 border-sky-400/35 text-sky-300 hover:bg-sky-400/20'
                            : 'bg-sky-50 border-sky-600/30 text-sky-800 hover:bg-sky-100'
                        }`}
                      >
                        <span>پرونده</span>
                        <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* بدنه کارت ماموریت */}
                    <div className="p-2.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/tasks/${task.id}`}
                          className={`text-xs sm:text-sm font-bold leading-snug hover:underline ${textPrimary}`}
                        >
                          {task.title}
                        </Link>
                        {task.has_acknowledged && (
                          <span
                            className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] border text-[9.5px] font-bold ${
                              isDark
                                ? 'bg-sky-400/15 border-sky-400/40 text-sky-300'
                                : 'bg-sky-50 border-sky-600/35 text-sky-800'
                            }`}
                          >
                            <CheckCircleIcon className="w-3 h-3" />
                            دریافت / در حال انجام
                          </span>
                        )}
                      </div>

                      {/* متادیتای مرحله، آمر و ددلاین دقیق */}
                      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] ${textSecondary}`}>
                        <span>
                          مرحله {toPersianDigits(task.stage.step_index)} از {toPersianDigits(task.total_stages)}:{' '}
                          <strong className={textPrimary}>{task.stage.stage_name}</strong>
                        </span>
                        <span>
                          آمر: <strong className={textPrimary}>{task.created_by_name}</strong>
                        </span>
                        {task.project_name && (
                          <span>
                            پروژه: <strong className={textPrimary}>{task.project_name}</strong>
                          </span>
                        )}
                        {task.deadline && (
                          <span className={`tabular-nums font-semibold ${task.is_expired ? 'text-red-400' : (isDark ? 'text-amber-300' : 'text-amber-700')}`}>
                            مهلت:{' '}
                            <span dir="ltr">
                              {toPersianDigits(moment(task.deadline).format('jYYYY/jMM/jDD HH:mm'))}
                            </span>
                          </span>
                        )}
                      </div>

                      {task.stage.description && (
                        <p className={`text-[11px] leading-5 px-2 py-1 rounded-[2px] border-s-2 ${
                          isDark
                            ? 'bg-tactical-surface2/50 border-s-slate-500 text-slate-300'
                            : 'bg-slate-50 border-s-slate-400 text-slate-700'
                        }`}>
                          {task.stage.description}
                        </p>
                      )}

                      {task.stage.require_file && isActionRequired && (
                        <div
                          className={`flex items-center justify-between gap-2 px-2 py-1 rounded-[2px] border text-[10.5px] ${
                            isDark
                              ? 'bg-amber-400/10 border-amber-400/35 text-amber-300'
                              : 'bg-amber-50 border-amber-600/35 text-amber-800'
                          }`}
                        >
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <PaperClipIcon className="w-3.5 h-3.5 shrink-0" />
                            این مرحله نیازمند پیوست فایل است
                          </span>
                          <button
                            type="button"
                            onClick={() => triggerQuickUpload(task.id)}
                            disabled={isUploading}
                            className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold transition-colors ${
                              isDark
                                ? 'bg-amber-400/20 border-amber-400/50 text-amber-200 hover:bg-amber-400/30'
                                : 'bg-white border-amber-600/40 text-amber-900 hover:bg-amber-100'
                            }`}
                          >
                            {isUploading ? 'در حال آپلود...' : 'پیوست سریع فایل'}
                          </button>
                        </div>
                      )}

                      {/* نوار دکمه‌های عملیاتی */}
                      {(task.can_start || task.can_approve || task.can_forward || task.can_return || task.can_reject) && (
                        <div className={`pt-2 border-t flex flex-wrap items-center gap-1.5 ${borderHairline}`}>
                          {task.can_start && (
                            <button
                              type="button"
                              onClick={() => handleStartTask(task)}
                              disabled={isBusy}
                              className={`h-7 px-2.5 rounded-[2px] border inline-flex items-center gap-1 text-[11px] font-bold transition-colors disabled:opacity-50 ${
                                isDark
                                  ? 'bg-sky-400 hover:bg-sky-300 border-sky-400 text-slate-950'
                                  : 'bg-sky-600 hover:bg-sky-700 border-sky-600 text-white'
                              }`}
                            >
                              {isBusy ? (
                                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <PlayIcon className="w-3.5 h-3.5" />
                              )}
                              <span>{task.user_role === 'INTERMEDIATE_APPROVER' ? 'دیدم و دریافت شد' : 'شروع (دیده و دریافت شد)'}</span>
                            </button>
                          )}

                          {task.can_approve && (
                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'approve', task })}
                              className={`h-7 px-2.5 rounded-[2px] border inline-flex items-center gap-1 text-[11px] font-bold transition-colors ${
                                isDark
                                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-400/50 text-emerald-300'
                                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-600/45 text-emerald-800'
                              }`}
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              <span>تایید</span>
                            </button>
                          )}

                          {task.can_forward && (
                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'forward', task })}
                              className={`h-7 px-2.5 rounded-[2px] border inline-flex items-center gap-1 text-[11px] font-bold transition-colors ${
                                isDark
                                  ? 'bg-sky-400/15 hover:bg-sky-400/25 border-sky-400/45 text-sky-300'
                                  : 'bg-sky-50 hover:bg-sky-100 border-sky-600/40 text-sky-800'
                              }`}
                            >
                              <PaperAirplaneIcon className="w-3.5 h-3.5 -rotate-180" />
                              <span>ارجاع / کمکی</span>
                            </button>
                          )}

                          {task.can_return && (
                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'return', task })}
                              className={`h-7 px-2.5 rounded-[2px] border inline-flex items-center gap-1 text-[11px] font-bold transition-colors ${
                                isDark
                                  ? 'bg-amber-400/15 hover:bg-amber-400/25 border-amber-400/45 text-amber-300'
                                  : 'bg-amber-50 hover:bg-amber-100 border-amber-600/40 text-amber-800'
                              }`}
                            >
                              <ArrowUturnRightIcon className="w-3.5 h-3.5" />
                              <span>برگشت اصلاح</span>
                            </button>
                          )}

                          {task.can_reject && (
                            <button
                              type="button"
                              onClick={() => setActiveModal({ type: 'reject', task })}
                              className={`h-7 px-2.5 rounded-[2px] border inline-flex items-center gap-1 text-[11px] font-bold transition-colors ${
                                isDark
                                  ? 'bg-red-500/15 hover:bg-red-500/25 border-red-400/45 text-red-300'
                                  : 'bg-red-50 hover:bg-red-100 border-red-600/40 text-red-700'
                              }`}
                            >
                              <XCircleIcon className="w-3.5 h-3.5" />
                              <span>رد</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ ستون ۲: چک‌لیست وظایف‌های امروز ═══ */}
        {showRoutinesPane && (
          <div className={`${twoColumnLayout ? 'lg:col-span-5' : ''} p-3 sm:p-4 space-y-3`}>
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-dashed border-slate-500/25">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-4 rounded-[1px] ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
                <h3 className={`text-xs sm:text-sm font-bold ${textPrimary}`}>
                  چک‌لیست وظایف امروز
                </h3>
              </div>
              <Link
                to="/routines"
                className={`inline-flex items-center gap-1 text-[11px] font-semibold transition-colors ${
                  isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
                }`}
              >
                <span>بورد هفتگی</span>
                <QueueListIcon className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* نوار پیشرفت وظایف‌های امروز */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10.5px] tabular-nums">
                <span className={textSecondary}>
                  باقی‌مانده: <strong className={textPrimary}>{toPersianDigits(summary.routine_remaining_items)}</strong> مورد
                </span>
                <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {toPersianDigits(routineProgress)}٪ تکمیل
                </span>
              </div>
              <div className={`h-1.5 w-full rounded-[1px] overflow-hidden ${isDark ? 'bg-tactical-canvas' : 'bg-slate-200'}`}>
                <div
                  className={`h-full transition-all duration-300 ${isDark ? 'bg-emerald-400' : 'bg-emerald-600'}`}
                  style={{ width: `${routineProgress}%` }}
                />
              </div>
            </div>

            {/* گروه‌بندی آیتم‌ها بر اساس بازه زمانی */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pe-0.5">
              {groupedRoutines.map((group) => (
                <div
                  key={group.id}
                  className={`rounded-[2px] border overflow-hidden ${borderHairline} ${
                    isDark ? 'bg-tactical-canvas/70' : 'bg-slate-50/70'
                  }`}
                >
                  <div
                    className={`px-2.5 py-1.5 border-b flex items-center justify-between text-[10.5px] ${borderHairline} ${surfaceHeader}`}
                  >
                    <span className={`font-bold flex items-center gap-1.5 ${textPrimary}`}>
                      <ClipboardDocumentCheckIcon className={`w-3.5 h-3.5 ${isDark ? 'text-sky-400' : 'text-sky-700'}`} />
                      {group.title}
                    </span>
                    {group.timeRange && (
                      <span dir="ltr" className={`tabular-nums font-semibold ${textSecondary}`}>
                        {toPersianDigits(group.timeRange)}
                      </span>
                    )}
                  </div>

                  <div className="p-1.5 space-y-1">
                    {group.items.map((item) => {
                      const isToggling = busyRoutineItemId === item.id;
                      const diffBorder = DIFFICULTY_BORDER[item.difficulty] || 'border-s-sky-400';

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleRoutineItem(item.id)}
                          className={`group flex items-start gap-2 p-2 rounded-[2px] border border-s-2 cursor-pointer transition-colors ${diffBorder} ${
                            item.is_done
                              ? isDark
                                ? 'bg-tactical-surface1/40 border-slate-400/10 opacity-60'
                                : 'bg-white/60 border-slate-900/10 opacity-65'
                              : isDark
                              ? 'bg-tactical-surface1 border-slate-400/20 hover:border-sky-400/45 hover:bg-tactical-hover'
                              : 'bg-white border-slate-900/15 hover:border-sky-600/45 hover:bg-sky-50/40'
                          }`}
                        >
                          <button
                            type="button"
                            disabled={isToggling}
                            className="mt-0.5 shrink-0"
                            aria-label="تغییر وضعیت انجام"
                          >
                            {isToggling ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin text-sky-400" />
                            ) : item.is_done ? (
                              <CheckCircleIcon className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            ) : (
                              <span
                                className={`block w-4 h-4 rounded-[2px] border transition-colors ${
                                  isDark
                                    ? 'border-slate-400/50 group-hover:border-sky-400'
                                    : 'border-slate-500 group-hover:border-sky-600'
                                }`}
                              />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-xs font-semibold leading-snug ${
                                item.is_done ? 'line-through text-slate-500' : textPrimary
                              }`}
                            >
                              {item.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-1 text-[10px] text-slate-500">
                              <span className={`truncate max-w-[160px] ${isDark ? 'text-sky-300/80' : 'text-sky-800/80'}`}>
                                {item.routineTitle}
                              </span>
                              {item.reminderTime && (
                                <span className="inline-flex items-center gap-0.5 tabular-nums text-amber-400">
                                  <ClockIcon className="w-3 h-3" />
                                  {toPersianDigits(item.reminderTime)}
                                </span>
                              )}
                              {item.estimatedMinutes > 0 && (
                                <span className="tabular-nums">
                                  {toPersianDigits(item.estimatedMinutes)} دقیقه
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── مودال‌های اکشن ماموریت ── */}
      {activeModal?.type === 'approve' && (
        <ConfirmModal
          title="تایید و خاتمه مرحله"
          message={
            activeModal.task.stage.require_file
              ? `آیا از پیوست فایل‌های الزامی برای «${activeModal.task.title}» اطمینان دارید؟ با تایید، این مرحله ثبت نهایی می‌شود.`
              : `تایید مرحله «${activeModal.task.stage.stage_name}» از ماموریت «${activeModal.task.title}»`
          }
          confirmLabel="تایید و ثبت"
          confirmClass="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={handleApproveTask}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal?.type === 'reject' && (
        <ConfirmModal
          title="رد کردن ماموریت"
          message={`آیا از رد کردن مرحله «${activeModal.task.stage.stage_name}» از ماموریت «${activeModal.task.title}» اطمینان دارید؟`}
          confirmLabel="تایید و رد ماموریت"
          confirmClass="bg-red-600 hover:bg-red-700"
          onConfirm={handleRejectTask}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal?.type === 'forward' && (
        <ForwardModal
          taskId={activeModal.task.id}
          userRole={activeModal.task.user_role}
          onSuccess={() => {
            toast.success('ارجاع با موفقیت انجام شد.');
            setActiveModal(null);
            fetchCartable(true);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal?.type === 'return' && (
        <ReturnModal
          title="برگشت دادن جهت اصلاح"
          assignees={activeModal.task.stage.assignees || []}
          onConfirm={handleReturnTask}
          onClose={() => setActiveModal(null)}
        />
      )}
    </section>
  );
};

export default TodayOpsCartable;