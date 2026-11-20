// src/components/routine/RoutineTemplateCard.jsx
import React from 'react';
import {
    BriefcaseIcon,
    CalendarDaysIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    PencilSquareIcon,
    TrashIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

const toPersianDigits = (value) =>
    String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const WEEK_DAY_MAP = {
    0: 'شنبه',
    1: 'یکشنبه',
    2: 'دوشنبه',
    3: 'سه‌شنبه',
    4: 'چهارشنبه',
    5: 'پنج‌شنبه',
    6: 'جمعه',
};

const DIFFICULTY_META = {
    EASY: { label: 'آسان', dark: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35', light: 'bg-emerald-50 text-emerald-800 border-emerald-600/30' },
    MEDIUM: { label: 'متوسط', dark: 'bg-sky-400/15 text-sky-300 border-sky-400/35', light: 'bg-sky-50 text-sky-800 border-sky-600/30' },
    HARD: { label: 'سخت', dark: 'bg-amber-500/15 text-amber-300 border-amber-500/35', light: 'bg-amber-50 text-amber-800 border-amber-600/30' },
    EXPERT: { label: 'بسیار سخت', dark: 'bg-red-500/15 text-red-300 border-red-500/35', light: 'bg-red-50 text-red-700 border-red-600/30' },
};

const getScheduleSummary = (tpl) => {
    if (tpl.period === 'MONTHLY' && tpl.schedule_day_of_month) {
        return `روز ${toPersianDigits(tpl.schedule_day_of_month)} هر ماه`;
    }
    if ((tpl.period === 'YEARLY' || tpl.period === 'ONCE') && tpl.schedule_value) {
        return toPersianDigits(tpl.schedule_value.replace(/-/g, '/'));
    }
    if (tpl.period === 'WEEKLY' && Array.isArray(tpl.schedule_days_of_week) && tpl.schedule_days_of_week.length > 0) {
        return tpl.schedule_days_of_week.map((d) => WEEK_DAY_MAP[d]).filter(Boolean).join('، ');
    }
    return null;
};

const RoutineTemplateCard = ({ tpl, isDark, onEdit, onDelete }) => {
    const isPositionTarget = Boolean(tpl.target_position);
    const diffMeta = DIFFICULTY_META[tpl.difficulty] || DIFFICULTY_META.MEDIUM;
    const scheduleSummary = getScheduleSummary(tpl);
    const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';

    return (
        <article
            className={`group relative rounded-[2px] border border-s-[3px] flex flex-col h-full transition-colors duration-150 ${
                isDark
                    ? `bg-tactical-surface1 border-slate-400/20 ${
                          isPositionTarget ? 'border-s-amber-400/75' : 'border-s-sky-400/75'
                      } hover:border-sky-400/50`
                    : `bg-white border-slate-900/15 ${
                          isPositionTarget ? 'border-s-amber-600/75' : 'border-s-sky-600/75'
                      } hover:border-sky-600/55`
            }`}
        >
            {/* نوار سرصفحه کارت */}
            <div
                className={`px-3.5 py-2 border-b flex items-center justify-between gap-2 ${borderHairline} ${
                    isDark ? 'bg-tactical-surface2/80' : 'bg-tactical-lightElevated/80'
                }`}
            >
                <div className="flex items-center gap-1.5 min-w-0">
                    <span
                        className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-normal shrink-0 ${
                            isDark
                                ? 'bg-sky-400/10 border-sky-400/35 text-sky-300'
                                : 'bg-sky-50 border-sky-600/30 text-sky-800'
                        }`}
                    >
                        {tpl.period_display || tpl.period}
                    </span>
                    <span
                        className={`px-1.5 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-normal shrink-0 ${
                            isDark ? diffMeta.dark : diffMeta.light
                        }`}
                    >
                        {diffMeta.label}
                    </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="button"
                        onClick={() => onEdit(tpl)}
                        className={`p-1.5 rounded-[2px] border transition-colors ${
                            isDark
                                ? 'border-slate-400/20 bg-tactical-canvas text-sky-400 hover:border-sky-400/50 hover:bg-sky-400/10'
                                : 'border-slate-900/15 bg-white text-sky-700 hover:border-sky-600/50 hover:bg-sky-50'
                        }`}
                        title="ویرایش الگو"
                        aria-label="ویرایش الگو"
                    >
                        <PencilSquareIcon className="w-3.5 h-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onDelete(tpl.id)}
                        className={`p-1.5 rounded-[2px] border transition-colors ${
                            isDark
                                ? 'border-slate-400/20 bg-tactical-canvas text-red-400 hover:border-red-400/50 hover:bg-red-500/10'
                                : 'border-slate-900/15 bg-white text-red-600 hover:border-red-600/50 hover:bg-red-50'
                        }`}
                        title="حذف الگو"
                        aria-label="حذف الگو"
                    >
                        <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* بدنه کارت */}
            <div className="p-3.5 flex-1 flex flex-col">
                <h3
                    className={`font-bold text-sm sm:text-[15px] leading-6 mb-2.5 line-clamp-2 tracking-normal ${
                        isDark ? 'text-slate-100' : 'text-slate-900'
                    }`}
                    title={tpl.title}
                >
                    {tpl.title}
                </h3>

                {/* متادیتای ساختاریافته */}
                <div
                    className={`p-2 rounded-[2px] border mb-3 space-y-1.5 text-[11px] tracking-normal ${
                        isDark
                            ? 'bg-tactical-canvas/70 border-slate-400/15 text-slate-300'
                            : 'bg-slate-50 border-slate-900/10 text-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-slate-400 shrink-0">
                            {isPositionTarget ? (
                                <BriefcaseIcon className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                                <UserIcon className="w-3.5 h-3.5 text-sky-400" />
                            )}
                            تخصیص:
                        </span>
                        <span className="font-semibold truncate">{tpl.target_name || 'برنامه شخصی'}</span>
                    </div>

                    {scheduleSummary && (
                        <div className={`flex items-center justify-between gap-2 pt-1 border-t ${borderHairline}`}>
                            <span className="inline-flex items-center gap-1.5 text-slate-400 shrink-0">
                                <CalendarDaysIcon className="w-3.5 h-3.5 text-sky-400" />
                                زمان‌بندی:
                            </span>
                            <span className="font-semibold truncate tabular-nums">{scheduleSummary}</span>
                        </div>
                    )}

                    {tpl.reminder_time && (
                        <div className={`flex items-center justify-between gap-2 pt-1 border-t ${borderHairline}`}>
                            <span className="inline-flex items-center gap-1.5 text-slate-400 shrink-0">
                                <ClockIcon className="w-3.5 h-3.5 text-amber-400" />
                                یادآوری:
                            </span>
                            <span className="font-semibold tabular-nums">
                                ساعت {toPersianDigits(tpl.reminder_time.substring(0, 5))}
                            </span>
                        </div>
                    )}
                </div>

                {/* لیست چک‌لیست‌ها */}
                <div className="flex-1">
                    <h4
                        className={`text-[11px] font-semibold mb-2 flex items-center gap-1.5 tracking-normal ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}
                    >
                        <ClipboardDocumentCheckIcon
                            className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
                        />
                        وظایف (چک‌لیست):
                    </h4>
                    {tpl.checklists && tpl.checklists.length > 0 ? (
                        <ul className="space-y-1.5 max-h-36 overflow-y-auto pe-1">
                            {tpl.checklists.map((item, idx) => (
                                <li
                                    key={item.id || idx}
                                    className={`text-xs flex items-start justify-between gap-2 tracking-normal ${
                                        isDark ? 'text-slate-300' : 'text-slate-700'
                                    }`}
                                >
                                    <span className="flex items-start gap-1.5 min-w-0">
                                        <span
                                            className={`shrink-0 mt-[5px] w-1.5 h-1.5 rounded-[1px] ${
                                                isDark ? 'bg-sky-400' : 'bg-sky-600'
                                            }`}
                                        />
                                        <span className="leading-5">{item.title}</span>
                                    </span>
                                    {tpl.period === 'WEEKLY' && item.target_days?.length > 0 && (
                                        <span
                                            className={`shrink-0 text-[9.5px] px-1.5 py-0.5 rounded-[2px] border ${
                                                isDark
                                                    ? 'bg-tactical-surface2 border-slate-400/20 text-slate-400'
                                                    : 'bg-slate-100 border-slate-900/15 text-slate-600'
                                            }`}
                                        >
                                            {item.target_days.map((d) => WEEK_DAY_MAP[d]).filter(Boolean).join('، ')}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs opacity-60 tracking-normal text-slate-500">بدون وظیفه ثبت‌شده</p>
                    )}
                </div>
            </div>

            {/* نوار پایینی کارت */}
            <div
                className={`px-3.5 py-2 border-t text-[11px] font-medium flex justify-between items-center tracking-normal ${borderHairline} ${
                    isDark ? 'bg-tactical-surface2/50 text-slate-400' : 'bg-slate-50 text-slate-600'
                }`}
            >
                <span className="tabular-nums">
                    تعداد آیتم‌ها: <strong className={isDark ? 'text-slate-200' : 'text-slate-900'}>{toPersianDigits(tpl.checklists?.length || 0)}</strong>
                </span>
                <span
                    className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold ${
                        tpl.is_active
                            ? isDark
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-600/30'
                            : isDark
                            ? 'bg-red-500/15 text-red-300 border-red-500/35'
                            : 'bg-red-50 text-red-700 border-red-600/30'
                    }`}
                >
                    {tpl.is_active ? 'فعال' : 'غیرفعال'}
                </span>
            </div>
        </article>
    );
};

export default RoutineTemplateCard;