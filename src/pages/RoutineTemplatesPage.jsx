import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchSelectorPositions,
    fetchSelectorUsers,
} from '../features/routine/routineSlice';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
    ArrowRightIcon,
    BriefcaseIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ClipboardDocumentCheckIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ExclamationCircleIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    Squares2X2Icon,
    TableCellsIcon,
    TrashIcon,
    UserIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import moment from 'moment-jalaali';

import RoutineTemplateCard from '../components/routine/RoutineTemplateCard';
import JalaliDatePicker from '../components/common/JalaliDatePicker';

const toPersianDigits = (value) =>
    String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const WEEK_DAYS = [
    { value: 0, label: 'شنبه' },
    { value: 1, label: 'یکشنبه' },
    { value: 2, label: 'دوشنبه' },
    { value: 3, label: 'سه‌شنبه' },
    { value: 4, label: 'چهارشنبه' },
    { value: 5, label: 'پنج‌شنبه' },
    { value: 6, label: 'جمعه' },
];

const WEEK_DAY_MAP = Object.fromEntries(WEEK_DAYS.map((d) => [d.value, d.label]));

const TABS = [
    { id: 'ALL', label: 'همه دوره‌ها' },
    { id: 'ONCE', label: 'یک‌باره' },
    { id: 'DAILY', label: 'روزانه' },
    { id: 'WEEKLY', label: 'هفتگی' },
    { id: 'MONTHLY', label: 'ماهانه' },
    { id: 'YEARLY', label: 'سالانه' },
];

const PERIOD_LABELS = {
    ONCE: 'یک‌باره',
    DAILY: 'روزانه',
    WEEKLY: 'هفتگی',
    MONTHLY: 'ماهانه',
    YEARLY: 'سالانه',
};

const DIFFICULTY_LABELS = {
    EASY: 'آسان',
    MEDIUM: 'متوسط',
    HARD: 'سخت',
    EXPERT: 'بسیار سخت',
};

const initialFormData = {
    title: '',
    period: 'DAILY',
    schedule_day_of_month: 1,
    schedule_date: '',
    reminder_time: '09:00',
    difficulty: 'MEDIUM',
    trigger_mode: 'HYBRID',
    target_user: '',
    target_position: '',
    checklists: [{ title: '', order: 1, target_days: [] }],
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
            <span aria-hidden="true" className={`pointer-events-none absolute top-0 start-0 w-2 h-2 border-t border-s ${colorClass}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute top-0 end-0 w-2 h-2 border-t border-e ${colorClass}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 start-0 w-2 h-2 border-b border-s ${colorClass}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 end-0 w-2 h-2 border-b border-e ${colorClass}`} />
        </>
    );
};

const getTemplateScheduleInfo = (tpl) => {
    if (tpl.period === 'MONTHLY' && tpl.schedule_day_of_month) {
        return `روز ${toPersianDigits(tpl.schedule_day_of_month)} ماه`;
    }
    if ((tpl.period === 'YEARLY' || tpl.period === 'ONCE') && tpl.schedule_value) {
        return toPersianDigits(tpl.schedule_value.replace(/-/g, '/'));
    }
    if (tpl.period === 'WEEKLY' && Array.isArray(tpl.schedule_days_of_week) && tpl.schedule_days_of_week.length > 0) {
        return tpl.schedule_days_of_week.map((d) => WEEK_DAY_MAP[d]).filter(Boolean).join('، ');
    }
    return null;
};

const RoutineTemplatesPage = () => {
    const dispatch = useDispatch();
    const {
        templates,
        templateLoading,
        selectorPositions,
        selectorUsers,
        error,
    } = useSelector((state) => state.routine);

    const { userInfo } = useSelector((state) => state.userLogin);
    const { user: userProfile } = useSelector((state) => state.userDetails);
    const currentUser = userProfile && Object.keys(userProfile).length > 0 ? userProfile : userInfo;

    const isAdmin = currentUser?.is_admin || false;
    const userRole = currentUser?.employee?.position?.report_type || 'UNKNOWN';
    const allowedRolesForRoutine = ['MANAGING_COUNCIL', 'TECHNICAL_OFFICE', 'PROJECT_MANAGER'];
    const isManager = isAdmin || allowedRolesForRoutine.includes(userRole);

    const mode = useSelector((state) => state.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [activeTab, setActiveTab] = useState('ALL');
    const [scopeFilter, setScopeFilter] = useState('ALL'); // ALL | POSITIONS | PERSONAL
    const [positionCoverageFilter, setPositionCoverageFilter] = useState('ALL'); // ALL | WITH_CHECKLIST | WITHOUT_CHECKLIST
    const [positionViewMode, setPositionViewMode] = useState('TABLE'); // TABLE | CARDS
    const [expandedPositionId, setExpandedPositionId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [userSearch, setUserSearch] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [positionSearch, setPositionSearch] = useState('');
    const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);

    const userRef = useRef(null);
    const positionRef = useRef(null);

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        dispatch(fetchTemplates());
        if (isManager) {
            dispatch(fetchSelectorPositions());
            dispatch(fetchSelectorUsers());
        }
    }, [dispatch, isManager]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userRef.current && !userRef.current.contains(event.target)) setUserDropdownOpen(false);
            if (positionRef.current && !positionRef.current.contains(event.target)) setPositionDropdownOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setUserDropdownOpen(false);
                setPositionDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const filteredUsers = selectorUsers?.filter(
        (user) =>
            user.display_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.username?.toLowerCase().includes(userSearch.toLowerCase())
    );
    const filteredPositions = selectorPositions?.filter((pos) =>
        pos.title?.toLowerCase().includes(positionSearch.toLowerCase())
    );

    const selectedUserLabel =
        selectorUsers?.find((u) => u.id === parseInt(formData.target_user))?.display_name ||
        'برنامه شخصی (برای خودم)';
    const selectedPositionLabel =
        selectorPositions?.find((p) => p.id === parseInt(formData.target_position))?.title ||
        'انتخاب سمت سازمانی';

    const allTemplatesList = useMemo(() => (Array.isArray(templates) ? templates : []), [templates]);

    const normalizedSearch = searchQuery.trim().toLowerCase();

    const matchesSearch = (tpl) => {
        if (!normalizedSearch) return true;
        if (tpl.title?.toLowerCase().includes(normalizedSearch)) return true;
        if (tpl.target_name?.toLowerCase().includes(normalizedSearch)) return true;
        if (tpl.checklists?.some((c) => c.title?.toLowerCase().includes(normalizedSearch))) return true;
        return false;
    };

    const filteredTemplates = useMemo(() => {
        return allTemplatesList.filter((tpl) => {
            const periodMatch = activeTab === 'ALL' || tpl.period === activeTab;
            return periodMatch && matchesSearch(tpl);
        });
    }, [allTemplatesList, activeTab, normalizedSearch]);

    // ساخت ماتریس کامل سمت‌های سازمانی (ترکیب selectorPositions و الگوهای مبتنی بر target_position)
    const positionDossiers = useMemo(() => {
        const map = new Map();

        if (Array.isArray(selectorPositions)) {
            selectorPositions.forEach((pos) => {
                map.set(String(pos.id), {
                    id: pos.id,
                    title: pos.title,
                    allTemplates: [],
                    visibleTemplates: [],
                });
            });
        }

        allTemplatesList.forEach((tpl) => {
            if (!tpl.target_position) return;
            const key = String(tpl.target_position);
            if (!map.has(key)) {
                const cleanTitle = (tpl.target_name || '').replace(/^سمت:\s*/, '').trim() || 'سمت سازمانی';
                map.set(key, {
                    id: tpl.target_position,
                    title: cleanTitle,
                    allTemplates: [],
                    visibleTemplates: [],
                });
            }
            map.get(key).allTemplates.push(tpl);
        });

        filteredTemplates.forEach((tpl) => {
            if (!tpl.target_position) return;
            const key = String(tpl.target_position);
            if (map.has(key)) {
                map.get(key).visibleTemplates.push(tpl);
            }
        });

        const list = Array.from(map.values()).map((entry) => {
            const totalChecklistCount = entry.allTemplates.reduce(
                (sum, t) => sum + (t.checklists?.length || 0),
                0
            );
            const visibleChecklistCount = entry.visibleTemplates.reduce(
                (sum, t) => sum + (t.checklists?.length || 0),
                0
            );
            const periodCounts = {
                DAILY: 0,
                WEEKLY: 0,
                MONTHLY: 0,
                YEARLY: 0,
                ONCE: 0,
            };
            entry.visibleTemplates.forEach((t) => {
                if (periodCounts[t.period] !== undefined) {
                    periodCounts[t.period] += 1;
                }
            });

            return {
                ...entry,
                hasAnyChecklist: totalChecklistCount > 0,
                totalChecklistCount,
                visibleChecklistCount,
                periodCounts,
            };
        });

        // مرتب‌سازی: ابتدا سمت‌های دارای چک‌لیست (بیشترین وظیفه بالاتر)، سپس سمت‌های فاقد چک‌لیست
        return list.sort((a, b) => {
            if (a.hasAnyChecklist !== b.hasAnyChecklist) return a.hasAnyChecklist ? -1 : 1;
            if (b.totalChecklistCount !== a.totalChecklistCount) return b.totalChecklistCount - a.totalChecklistCount;
            return (a.title || '').localeCompare(b.title || '', 'fa');
        });
    }, [selectorPositions, allTemplatesList, filteredTemplates]);

    const visiblePositionDossiers = useMemo(() => {
        return positionDossiers.filter((pos) => {
            if (positionCoverageFilter === 'WITH_CHECKLIST' && !pos.hasAnyChecklist) return false;
            if (positionCoverageFilter === 'WITHOUT_CHECKLIST' && pos.hasAnyChecklist) return false;

            if (activeTab !== 'ALL' && pos.visibleTemplates.length === 0) {
                if (positionCoverageFilter === 'WITHOUT_CHECKLIST') return !pos.hasAnyChecklist;
                return false;
            }

            if (normalizedSearch) {
                const titleMatch = pos.title?.toLowerCase().includes(normalizedSearch);
                return titleMatch || pos.visibleTemplates.length > 0;
            }
            return true;
        });
    }, [positionDossiers, positionCoverageFilter, activeTab, normalizedSearch]);

    // الگوهای فردی / شخصی (بدون target_position)
    const personalTemplates = useMemo(
        () => filteredTemplates.filter((tpl) => !tpl.target_position),
        [filteredTemplates]
    );

    const summaryStats = useMemo(() => {
        const totalPositions = positionDossiers.length;
        const coveredPositions = positionDossiers.filter((p) => p.hasAnyChecklist).length;
        const uncoveredPositions = totalPositions - coveredPositions;
        const totalPositionChecklists = positionDossiers.reduce((acc, p) => acc + p.totalChecklistCount, 0);
        const personalCount = allTemplatesList.filter((t) => !t.target_position).length;
        return {
            totalPositions,
            coveredPositions,
            uncoveredPositions,
            totalPositionChecklists,
            personalCount,
        };
    }, [positionDossiers, allTemplatesList]);

    const handlePeriodChange = (newPeriod) => {
        let updatedChecklists = [...formData.checklists];
        if (newPeriod === 'WEEKLY') {
            updatedChecklists = updatedChecklists.map((c) => ({
                ...c,
                target_days: c.target_days?.length ? c.target_days : [0],
            }));
        } else {
            updatedChecklists = updatedChecklists.map((c) => ({ ...c, target_days: [] }));
        }
        setFormData({ ...formData, period: newPeriod, checklists: updatedChecklists });
    };

    const handleAddChecklist = () => {
        setFormData({
            ...formData,
            checklists: [
                ...formData.checklists,
                { title: '', order: formData.checklists.length + 1, target_days: [] },
            ],
        });
    };

    const handleAddChecklistToDay = (dayValue) => {
        setFormData({
            ...formData,
            checklists: [
                ...formData.checklists,
                { title: '', order: formData.checklists.length + 1, target_days: [dayValue] },
            ],
        });
    };

    const handleChecklistChange = (index, value) => {
        const newChecklists = [...formData.checklists];
        newChecklists[index].title = value;
        setFormData({ ...formData, checklists: newChecklists });
    };

    const handleRemoveChecklist = (index) => {
        const newChecklists = formData.checklists.filter((_, i) => i !== index);
        setFormData({ ...formData, checklists: newChecklists });
    };

    const handleOpenNewForm = () => {
        setEditingId(null);
        setFormData(initialFormData);
        setShowForm(true);
    };

    const handleOpenFormForPosition = (positionId) => {
        setEditingId(null);
        setFormData({
            ...initialFormData,
            target_position: String(positionId),
            target_user: '',
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
    };

    const handleEditTemplate = (tpl) => {
        setEditingId(tpl.id);

        // گرفتن دیتای شمسی از بک‌اند و تبدیل به میلادی برای کامپوننت تقویم
        let formattedDate = '';
        if (tpl.schedule_value) {
            if (tpl.period === 'YEARLY') {
                const currentJYear = moment().jYear();
                const m = moment(`${currentJYear}-${tpl.schedule_value}`, 'jYYYY-jMM-jDD');
                if (m.isValid()) formattedDate = m.format('YYYY-MM-DD');
            } else if (tpl.period === 'ONCE') {
                const m = moment(tpl.schedule_value, 'jYYYY-jMM-jDD');
                if (m.isValid()) formattedDate = m.format('YYYY-MM-DD');
            }
        }

        setFormData({
            title: tpl.title,
            period: tpl.period,
            schedule_day_of_month: tpl.schedule_day_of_month || 1,
            schedule_date: formattedDate,
            reminder_time: tpl.reminder_time ? tpl.reminder_time.substring(0, 5) : '09:00',
            difficulty: tpl.difficulty || 'MEDIUM',
            trigger_mode: tpl.trigger_mode || 'HYBRID',
            target_user: tpl.target_user ? tpl.target_user.toString() : '',
            target_position: tpl.target_position ? tpl.target_position.toString() : '',
            checklists: tpl.checklists?.length
                ? tpl.checklists.map((c) => ({ ...c, target_days: c.target_days || [] }))
                : [{ title: '', order: 1, target_days: [] }],
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title.trim()) return toast.error('عنوان الگو الزامی است.');

        const cleanChecklists = formData.checklists.filter((c) => c.title.trim() !== '');
        if (cleanChecklists.length === 0) return toast.error('حداقل یک وظیفه وارد کنید.');

        let finalDaysOfWeek = [];
        if (formData.period === 'WEEKLY') {
            const daysSet = new Set();
            cleanChecklists.forEach((c) => {
                if (c.target_days) c.target_days.forEach((d) => daysSet.add(d));
            });
            finalDaysOfWeek = Array.from(daysSet).sort();
            if (finalDaysOfWeek.length === 0)
                return toast.error('حداقل یک وظیفه برای یکی از روزهای هفته تعریف کنید.');
        }

        // تبدیل تاریخ میلادی تقویم به شمسی برای بک‌اند
        let finalScheduleValue = null;
        if ((formData.period === 'YEARLY' || formData.period === 'ONCE') && formData.schedule_date) {
            const m = moment(formData.schedule_date, 'YYYY-MM-DD');
            if (m.isValid()) {
                if (formData.period === 'YEARLY') {
                    finalScheduleValue = m.format('jMM-jDD');
                } else if (formData.period === 'ONCE') {
                    finalScheduleValue = m.format('jYYYY-jMM-jDD');
                }
            }
        }

        if ((formData.period === 'YEARLY' || formData.period === 'ONCE') && !finalScheduleValue) {
            return toast.error('تاریخ اجرا الزامی است.');
        }

        const payload = {
            ...formData,
            schedule_days_of_week: finalDaysOfWeek,
            schedule_day_of_month:
                formData.period === 'MONTHLY' ? parseInt(formData.schedule_day_of_month) : null,
            schedule_value: finalScheduleValue,
            reminder_time: formData.trigger_mode === 'CHECKOUT_BASED' ? null : formData.reminder_time,
            checklists: cleanChecklists,
            target_user: formData.target_user ? parseInt(formData.target_user) : null,
            target_position: formData.target_position ? parseInt(formData.target_position) : null,
        };

        delete payload.schedule_date;

        setIsSubmitting(true);
        try {
            const actionToDispatch = editingId
                ? updateTemplate({ id: editingId, templateData: payload })
                : createTemplate(payload);

            const resultAction = await dispatch(actionToDispatch);

            if (!resultAction.error) {
                toast.success(editingId ? 'تغییرات الگو ذخیره شد.' : 'الگو با موفقیت ایجاد شد!');
                handleCloseForm();
                dispatch(fetchTemplates());
            } else {
                toast.error(resultAction.payload || 'خطا در برقراری ارتباط.');
            }
        } catch (err) {
            toast.error('خطا در ارتباط با سرور.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTemplate = (id) => {
        if (window.confirm('آیا از حذف این الگو اطمینان دارید؟')) {
            dispatch(deleteTemplate(id))
                .unwrap()
                .then(() => toast.success('الگو با موفقیت حذف شد.'))
                .catch((err) => toast.error(err || 'خطا در حذف الگو.'));
        }
    };

    const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
    const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-tactical-lightSurface';
    const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated';
    const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
    const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

    const inputBase = `w-full h-9 px-3 text-xs sm:text-sm rounded-[2px] border focus:outline-none transition-colors tracking-normal ${
        isDark
            ? 'bg-tactical-canvas border-slate-400/20 text-slate-100 placeholder-slate-500 focus:border-sky-400'
            : 'bg-slate-50 border-slate-900/20 text-slate-900 placeholder-slate-400 focus:border-sky-600'
    }`;

    // رندر پرونده چک‌لیست‌های یک سمت (مشترک بین آکاردئون جدول و نمای کارت شرح وظایف)
    const renderPositionTemplatesBody = (pos) => {
        if (pos.visibleTemplates.length === 0) {
            return (
                <div
                    className={`p-5 text-center rounded-[2px] border border-dashed tracking-normal ${
                        isDark
                            ? 'bg-tactical-canvas/60 border-amber-400/30 text-slate-400'
                            : 'bg-amber-50/40 border-amber-600/30 text-slate-600'
                    }`}
                >
                    <p className="text-xs font-semibold">
                        {pos.hasAnyChecklist
                            ? 'در دوره زمانی انتخاب‌شده الگویی برای این سمت ثبت نشده است.'
                            : 'برای این سمت سازمانی هنوز هیچ شرح وظایف و چک‌لیستی تعریف نشده است.'}
                    </p>
                    {isManager && (
                        <button
                            type="button"
                            onClick={() => handleOpenFormForPosition(pos.id)}
                            className={`mt-3 h-8 px-3.5 rounded-[2px] inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                                isDark
                                    ? 'bg-amber-400/15 border border-amber-400/45 text-amber-300 hover:bg-amber-400/25'
                                    : 'bg-amber-50 border border-amber-600/40 text-amber-800 hover:bg-amber-100'
                            }`}
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                            <span>تعریف شرح وظایف برای {pos.title}</span>
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {pos.visibleTemplates.map((tpl) => {
                    const scheduleInfo = getTemplateScheduleInfo(tpl);
                    return (
                        <div
                            key={tpl.id}
                            className={`rounded-[2px] border border-s-2 flex flex-col ${
                                isDark
                                    ? 'bg-tactical-canvas/85 border-slate-400/20 border-s-sky-400/75'
                                    : 'bg-slate-50/70 border-slate-900/15 border-s-sky-600/75'
                            }`}
                        >
                            {/* سرصفحه الگوی داخل پرونده سمت */}
                            <div
                                className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${borderHairline} ${
                                    isDark ? 'bg-tactical-surface2/70' : 'bg-white'
                                }`}
                            >
                                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                                    <span className={`text-xs font-bold tracking-normal ${textPrimary}`}>
                                        {tpl.title}
                                    </span>
                                    <span
                                        className={`px-1.5 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-normal ${
                                            isDark
                                                ? 'bg-sky-400/10 border-sky-400/35 text-sky-300'
                                                : 'bg-sky-50 border-sky-600/30 text-sky-800'
                                        }`}
                                    >
                                        {tpl.period_display || PERIOD_LABELS[tpl.period] || tpl.period}
                                    </span>
                                    <span
                                        className={`px-1.5 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-normal ${
                                            tpl.is_active
                                                ? isDark
                                                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300'
                                                    : 'bg-emerald-50 border-emerald-600/30 text-emerald-800'
                                                : isDark
                                                ? 'bg-red-500/10 border-red-500/35 text-red-300'
                                                : 'bg-red-50 border-red-600/30 text-red-700'
                                        }`}
                                    >
                                        {tpl.is_active ? 'فعال' : 'غیرفعال'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleEditTemplate(tpl)}
                                        className={`p-1 rounded-[2px] border transition-colors ${
                                            isDark
                                                ? 'border-slate-400/20 text-sky-400 hover:bg-sky-400/15'
                                                : 'border-slate-900/15 text-sky-700 hover:bg-sky-50'
                                        }`}
                                        title="ویرایش الگو"
                                        aria-label="ویرایش الگو"
                                    >
                                        <PencilSquareIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTemplate(tpl.id)}
                                        className={`p-1 rounded-[2px] border transition-colors ${
                                            isDark
                                                ? 'border-slate-400/20 text-red-400 hover:bg-red-500/15'
                                                : 'border-slate-900/15 text-red-600 hover:bg-red-50'
                                        }`}
                                        title="حذف الگو"
                                        aria-label="حذف الگو"
                                    >
                                        <TrashIcon className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* نوار متادیتای الگو */}
                            <div
                                className={`px-3 py-1.5 border-b flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] tracking-normal ${borderHairline} ${textSecondary}`}
                            >
                                <span>
                                    سختی:{' '}
                                    <strong className={textPrimary}>
                                        {DIFFICULTY_LABELS[tpl.difficulty] || tpl.difficulty}
                                    </strong>
                                </span>
                                {tpl.trigger_mode_display && (
                                    <span>
                                        نحوه اجرا: <strong className={textPrimary}>{tpl.trigger_mode_display}</strong>
                                    </span>
                                )}
                                {scheduleInfo && (
                                    <span className="tabular-nums">
                                        زمان‌بندی: <strong className={textPrimary}>{scheduleInfo}</strong>
                                    </span>
                                )}
                                {tpl.reminder_time && (
                                    <span className="tabular-nums">
                                        یادآوری:{' '}
                                        <strong className={textPrimary}>
                                            {toPersianDigits(tpl.reminder_time.substring(0, 5))}
                                        </strong>
                                    </span>
                                )}
                            </div>

                            {/* فهرست چک‌لیست‌های این الگو */}
                            <div className="p-3 flex-1">
                                {tpl.checklists && tpl.checklists.length > 0 ? (
                                    <ol className="space-y-1.5">
                                        {tpl.checklists.map((item, idx) => (
                                            <li
                                                key={item.id || idx}
                                                className={`text-xs flex items-start justify-between gap-2 tracking-normal ${textPrimary}`}
                                            >
                                                <span className="flex items-start gap-2 min-w-0">
                                                    <span
                                                        className={`shrink-0 mt-0.5 w-5 h-5 rounded-[2px] border inline-flex items-center justify-center text-[10px] font-bold tabular-nums ${
                                                            isDark
                                                                ? 'bg-tactical-surface2 border-slate-400/20 text-sky-300'
                                                                : 'bg-white border-slate-900/15 text-sky-800'
                                                        }`}
                                                    >
                                                        {toPersianDigits(idx + 1)}
                                                    </span>
                                                    <span className="leading-5">{item.title}</span>
                                                </span>

                                                {tpl.period === 'WEEKLY' && item.target_days?.length > 0 && (
                                                    <span
                                                        className={`shrink-0 px-1.5 py-0.5 rounded-[2px] border text-[10px] ${
                                                            isDark
                                                                ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300'
                                                                : 'bg-white border-slate-900/15 text-slate-700'
                                                        }`}
                                                    >
                                                        {item.target_days
                                                            .map((d) => WEEK_DAY_MAP[d])
                                                            .filter(Boolean)
                                                            .join('، ')}
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className={`text-xs tracking-normal ${textSecondary}`}>
                                        چک‌لیستی ثبت نشده است.
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className={`relative min-h-screen transition-colors duration-200 ${
                isDark
                    ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
                    : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
            }`}
        >
            {isDark && (
                <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 tactical-scanlines" />
            )}

            {/* نوار مسیر صفحه */}
            <div
                className={`relative z-10 border-b ${borderHairline} ${
                    isDark ? 'bg-tactical-surface1/95' : 'bg-white/95'
                } backdrop-blur-sm`}
            >
                <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-10 flex items-center justify-between gap-3 text-[11px] tracking-normal">
                    <nav aria-label="مسیر صفحه" className="flex items-center gap-1.5 min-w-0 font-medium">
                        <Link
                            to="/"
                            className={`transition-colors ${
                                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
                            }`}
                        >
                            پایگاه اصلی
                        </Link>
                        <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
                        <Link
                            to="/routines"
                            className={`transition-colors ${
                                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
                            }`}
                        >
                            کارتابل
                        </Link>
                        <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className={`font-semibold truncate ${textPrimary}`}>
                            شرح وظایف سازمانی و الگوهای گردش کار
                        </span>
                    </nav>

                    <span className={`hidden sm:inline tabular-nums font-medium ${textSecondary}`}>
                        مجموع الگوها: <strong className={textPrimary}>{toPersianDigits(allTemplatesList.length)}</strong>
                    </span>
                </div>
            </div>

            <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-5">
                {/* ═══════════════════════════════════════════════════════════ */}
                {/* سرصفحه اصلی و نوار آمار پوشش مشاغل سازمان */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className={`relative border rounded-[2px] ${surfacePanel} ${borderHairline}`}>
                    <CornerBrackets accent="cyan" isDark={isDark} />

                    <div className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`w-11 h-11 rounded-[2px] border flex items-center justify-center shrink-0 ${
                                    isDark
                                        ? 'bg-sky-400/10 border-sky-400/40 text-sky-400'
                                        : 'bg-sky-50 border-sky-600/35 text-sky-700'
                                }`}
                            >
                                <ClipboardDocumentListIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className={`text-lg sm:text-xl font-bold tracking-normal ${textPrimary}`}>
                                    شرح وظایف سازمانی و الگوهای گردش کار
                                </h1>
                                <p className={`text-xs mt-1 tracking-normal ${textSecondary}`}>
                                    مدیریت ساختاریافته چک‌لیست‌های شغلی بر اساس سمت سازمانی و برنامه‌های فردی پرسنل
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Link
                                to="/routines"
                                className={`flex-1 md:flex-none h-10 px-4 rounded-[2px] border inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-normal transition-colors ${
                                    isDark
                                        ? 'bg-tactical-surface2 border-slate-400/20 text-slate-200 hover:bg-tactical-hover hover:border-sky-400/45'
                                        : 'bg-slate-50 border-slate-900/20 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <ArrowRightIcon className="w-4 h-4 shrink-0" />
                                <span>بازگشت به کارتابل</span>
                            </Link>
                            {!showForm && (
                                <button
                                    type="button"
                                    onClick={handleOpenNewForm}
                                    className={`flex-1 md:flex-none h-10 px-4 rounded-[2px] inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold tracking-normal transition-colors ${
                                        isDark
                                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                                    }`}
                                >
                                    <PlusIcon className="w-4 h-4 shrink-0" />
                                    <span>ثبت الگوی جدید</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* نوار آمار وضعیت پوشش شرح وظایف سمت‌ها */}
                    <div
                        className={`grid grid-cols-2 lg:grid-cols-4 border-t ${borderHairline} divide-y sm:divide-y-0 divide-x divide-x-reverse ${
                            isDark ? 'divide-slate-400/15 bg-tactical-canvas/55' : 'divide-slate-900/15 bg-slate-50/70'
                        }`}
                    >
                        <div className="p-3 sm:p-3.5">
                            <div className={`text-[11px] font-medium tracking-normal ${textSecondary}`}>
                                کل سمت‌های شناسایی‌شده
                            </div>
                            <div className={`text-lg sm:text-xl font-bold tabular-nums mt-0.5 ${textPrimary}`}>
                                {toPersianDigits(summaryStats.totalPositions)}{' '}
                                <span className={`text-xs font-medium ${textSecondary}`}>سمت</span>
                            </div>
                        </div>

                        <div className="p-3 sm:p-3.5">
                            <div className={`text-[11px] font-medium tracking-normal ${textSecondary}`}>
                                سمت‌های دارای چک‌لیست
                            </div>
                            <div
                                className={`text-lg sm:text-xl font-bold tabular-nums mt-0.5 ${
                                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                                }`}
                            >
                                {toPersianDigits(summaryStats.coveredPositions)}{' '}
                                <span className={`text-xs font-medium ${textSecondary}`}>
                                    ({toPersianDigits(summaryStats.totalPositionChecklists)} وظیفه)
                                </span>
                            </div>
                        </div>

                        <div className="p-3 sm:p-3.5">
                            <div className={`text-[11px] font-medium tracking-normal ${textSecondary}`}>
                                سمت‌های فاقد چک‌لیست
                            </div>
                            <div
                                className={`text-lg sm:text-xl font-bold tabular-nums mt-0.5 ${
                                    summaryStats.uncoveredPositions > 0
                                        ? isDark
                                            ? 'text-amber-400'
                                            : 'text-amber-700'
                                        : isDark
                                        ? 'text-slate-400'
                                        : 'text-slate-600'
                                }`}
                            >
                                {toPersianDigits(summaryStats.uncoveredPositions)}{' '}
                                <span className={`text-xs font-medium ${textSecondary}`}>سمت</span>
                            </div>
                        </div>

                        <div className="p-3 sm:p-3.5">
                            <div className={`text-[11px] font-medium tracking-normal ${textSecondary}`}>
                                برنامه‌های فردی / شخصی
                            </div>
                            <div
                                className={`text-lg sm:text-xl font-bold tabular-nums mt-0.5 ${
                                    isDark ? 'text-sky-400' : 'text-sky-700'
                                }`}
                            >
                                {toPersianDigits(summaryStats.personalCount)}{' '}
                                <span className={`text-xs font-medium ${textSecondary}`}>الگو</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* فرم ایجاد / ویرایش الگو */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {showForm && (
                    <div
                        className={`relative rounded-[2px] border overflow-hidden ${surfacePanel} ${
                            editingId
                                ? isDark
                                    ? 'border-amber-400/50'
                                    : 'border-amber-600/50'
                                : isDark
                                ? 'border-sky-400/50'
                                : 'border-sky-600/50'
                        }`}
                    >
                        <CornerBrackets accent={editingId ? 'amber' : 'cyan'} isDark={isDark} />

                        <div
                            className={`px-4 py-3 flex justify-between items-center border-b ${borderHairline} ${
                                editingId
                                    ? isDark
                                        ? 'bg-amber-500/10'
                                        : 'bg-amber-50'
                                    : surfaceHeader
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <CalendarDaysIcon
                                    className={`w-5 h-5 ${
                                        editingId
                                            ? isDark
                                                ? 'text-amber-400'
                                                : 'text-amber-600'
                                            : isDark
                                            ? 'text-sky-400'
                                            : 'text-sky-600'
                                    }`}
                                />
                                <h2 className={`font-bold text-sm sm:text-base tracking-normal ${textPrimary}`}>
                                    {editingId ? 'ویرایش الگوی شرح وظایف' : 'طراحی الگوی شرح وظایف جدید'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                aria-label="بستن فرم"
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} id="routine-form" className="p-4 sm:p-5 space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* پنل اطلاعات پایه و تخصیص هدف */}
                                <div
                                    className={`p-4 rounded-[2px] border space-y-4 ${borderHairline} ${
                                        isDark ? 'bg-tactical-canvas/55' : 'bg-slate-50/70'
                                    }`}
                                >
                                    <h3
                                        className={`text-xs font-bold flex items-center gap-2 pb-2 border-b tracking-normal ${borderHairline} ${textPrimary}`}
                                    >
                                        <ClipboardDocumentListIcon
                                            className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}
                                        />
                                        اطلاعات پایه و تخصیص
                                    </h3>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2 sm:col-span-1 space-y-1">
                                            <label className={`text-xs font-semibold tracking-normal ${textSecondary}`}>
                                                عنوان الگو <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className={inputBase}
                                                placeholder="مثال: بازرسی روزانه کارگاه..."
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 space-y-1">
                                            <label className={`text-xs font-semibold tracking-normal ${textSecondary}`}>
                                                درجه سختی
                                            </label>
                                            <select
                                                value={formData.difficulty}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, difficulty: e.target.value })
                                                }
                                                className={inputBase}
                                            >
                                                <option value="EASY">آسان</option>
                                                <option value="MEDIUM">متوسط</option>
                                                <option value="HARD">سخت</option>
                                                <option value="EXPERT">بسیار سخت</option>
                                            </select>
                                        </div>
                                    </div>

                                    {isManager && (
                                        <div className={`pt-3 border-t ${borderHairline}`}>
                                            <h4
                                                className={`text-xs font-semibold mb-2 flex items-center gap-1.5 tracking-normal ${textSecondary}`}
                                            >
                                                <BriefcaseIcon
                                                    className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                                                />
                                                تخصیص هدف (انتخاب کاربر یا سمت سازمانی)
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {/* انتخاب کاربر */}
                                                <div className="relative" ref={userRef}>
                                                    <div
                                                        onClick={() =>
                                                            !formData.target_position &&
                                                            setUserDropdownOpen(!userDropdownOpen)
                                                        }
                                                        className={`h-9 px-3 rounded-[2px] border flex justify-between items-center text-xs tracking-normal transition-colors ${
                                                            formData.target_position
                                                                ? isDark
                                                                    ? 'bg-tactical-surface2/40 text-slate-500 border-slate-400/10 cursor-not-allowed'
                                                                    : 'bg-slate-100 text-slate-400 border-slate-900/10 cursor-not-allowed'
                                                                : isDark
                                                                ? 'bg-tactical-canvas border-slate-400/20 text-slate-100 hover:border-sky-400/50 cursor-pointer'
                                                                : 'bg-white border-slate-900/20 text-slate-900 hover:border-sky-600/50 cursor-pointer'
                                                        }`}
                                                    >
                                                        <span className="truncate">{selectedUserLabel}</span>
                                                        <ChevronDownIcon
                                                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                                                userDropdownOpen ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </div>
                                                    {userDropdownOpen && (
                                                        <div
                                                            className={`absolute z-30 w-full mt-1 rounded-[2px] shadow-2xl border p-2 ${
                                                                isDark
                                                                    ? 'bg-tactical-surface1 border-slate-400/25 text-slate-100'
                                                                    : 'bg-white border-slate-900/20 text-slate-900'
                                                            }`}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={userSearch}
                                                                onChange={(e) => setUserSearch(e.target.value)}
                                                                placeholder="جستجوی کاربر..."
                                                                className={`w-full h-8 px-2 text-xs rounded-[2px] border mb-2 focus:outline-none ${
                                                                    isDark
                                                                        ? 'bg-tactical-canvas border-slate-400/20 text-slate-100'
                                                                        : 'bg-slate-50 border-slate-900/15 text-slate-900'
                                                                }`}
                                                            />
                                                            <div className="max-h-36 overflow-y-auto text-xs space-y-0.5">
                                                                <div
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, target_user: '' });
                                                                        setUserDropdownOpen(false);
                                                                    }}
                                                                    className={`p-1.5 rounded-[2px] cursor-pointer font-semibold ${
                                                                        isDark
                                                                            ? 'text-slate-400 hover:bg-tactical-hover'
                                                                            : 'text-slate-600 hover:bg-slate-100'
                                                                    }`}
                                                                >
                                                                    برنامه شخصی (برای خودم)
                                                                </div>
                                                                {filteredUsers?.map((user) => (
                                                                    <div
                                                                        key={user.id}
                                                                        onClick={() => {
                                                                            setFormData({
                                                                                ...formData,
                                                                                target_user: user.id.toString(),
                                                                            });
                                                                            setUserDropdownOpen(false);
                                                                        }}
                                                                        className={`p-1.5 rounded-[2px] cursor-pointer ${
                                                                            isDark
                                                                                ? 'hover:bg-tactical-hover'
                                                                                : 'hover:bg-slate-100'
                                                                        }`}
                                                                    >
                                                                        {user.display_name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* انتخاب سمت سازمانی */}
                                                <div className="relative" ref={positionRef}>
                                                    <div
                                                        onClick={() =>
                                                            !formData.target_user &&
                                                            setPositionDropdownOpen(!positionDropdownOpen)
                                                        }
                                                        className={`h-9 px-3 rounded-[2px] border flex justify-between items-center text-xs tracking-normal transition-colors ${
                                                            formData.target_user
                                                                ? isDark
                                                                    ? 'bg-tactical-surface2/40 text-slate-500 border-slate-400/10 cursor-not-allowed'
                                                                    : 'bg-slate-100 text-slate-400 border-slate-900/10 cursor-not-allowed'
                                                                : isDark
                                                                ? 'bg-tactical-canvas border-amber-400/35 text-slate-100 hover:border-amber-400/60 cursor-pointer'
                                                                : 'bg-white border-amber-600/35 text-slate-900 hover:border-amber-600/60 cursor-pointer'
                                                        }`}
                                                    >
                                                        <span className="truncate">{selectedPositionLabel}</span>
                                                        <ChevronDownIcon
                                                            className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                                                                positionDropdownOpen ? 'rotate-180' : ''
                                                            }`}
                                                        />
                                                    </div>
                                                    {positionDropdownOpen && (
                                                        <div
                                                            className={`absolute z-30 w-full mt-1 rounded-[2px] shadow-2xl border p-2 ${
                                                                isDark
                                                                    ? 'bg-tactical-surface1 border-slate-400/25 text-slate-100'
                                                                    : 'bg-white border-slate-900/20 text-slate-900'
                                                            }`}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={positionSearch}
                                                                onChange={(e) => setPositionSearch(e.target.value)}
                                                                placeholder="جستجوی سمت..."
                                                                className={`w-full h-8 px-2 text-xs rounded-[2px] border mb-2 focus:outline-none ${
                                                                    isDark
                                                                        ? 'bg-tactical-canvas border-slate-400/20 text-slate-100'
                                                                        : 'bg-slate-50 border-slate-900/15 text-slate-900'
                                                                }`}
                                                            />
                                                            <div className="max-h-36 overflow-y-auto text-xs space-y-0.5">
                                                                <div
                                                                    onClick={() => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            target_position: '',
                                                                        });
                                                                        setPositionDropdownOpen(false);
                                                                    }}
                                                                    className={`p-1.5 rounded-[2px] cursor-pointer font-semibold ${
                                                                        isDark
                                                                            ? 'text-slate-400 hover:bg-tactical-hover'
                                                                            : 'text-slate-600 hover:bg-slate-100'
                                                                    }`}
                                                                >
                                                                    بدون سمت سازمانی
                                                                </div>
                                                                {filteredPositions?.map((pos) => (
                                                                    <div
                                                                        key={pos.id}
                                                                        onClick={() => {
                                                                            setFormData({
                                                                                ...formData,
                                                                                target_position: pos.id.toString(),
                                                                            });
                                                                            setPositionDropdownOpen(false);
                                                                        }}
                                                                        className={`p-1.5 rounded-[2px] cursor-pointer ${
                                                                            isDark
                                                                                ? 'hover:bg-tactical-hover'
                                                                                : 'hover:bg-slate-100'
                                                                        }`}
                                                                    >
                                                                        {pos.title}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* پنل زمان‌بندی و اجرای روتین */}
                                <div
                                    className={`p-4 rounded-[2px] border space-y-4 ${borderHairline} ${
                                        isDark ? 'bg-tactical-canvas/55' : 'bg-slate-50/70'
                                    }`}
                                >
                                    <h3
                                        className={`text-xs font-bold flex items-center gap-2 pb-2 border-b tracking-normal ${borderHairline} ${textPrimary}`}
                                    >
                                        <ClockIcon
                                            className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}
                                        />
                                        بازه زمانی و نحوه اجرا
                                    </h3>

                                    <div
                                        className={`flex p-1 rounded-[2px] border flex-wrap gap-1 ${borderHairline} ${
                                            isDark ? 'bg-tactical-surface1' : 'bg-white'
                                        }`}
                                    >
                                        {[
                                            { id: 'ONCE', label: 'یک‌باره' },
                                            { id: 'DAILY', label: 'روزانه' },
                                            { id: 'WEEKLY', label: 'هفتگی' },
                                            { id: 'MONTHLY', label: 'ماهانه' },
                                            { id: 'YEARLY', label: 'سالانه' },
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handlePeriodChange(p.id)}
                                                className={`flex-1 min-w-[60px] h-8 text-xs font-semibold rounded-[2px] transition-colors tracking-normal ${
                                                    formData.period === p.id
                                                        ? isDark
                                                            ? 'bg-sky-400 text-slate-950'
                                                            : 'bg-sky-600 text-white'
                                                        : isDark
                                                        ? 'text-slate-400 hover:bg-tactical-hover hover:text-slate-100'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>

                                    {formData.period === 'MONTHLY' && (
                                        <div className="space-y-2">
                                            <label
                                                className={`text-xs font-semibold flex items-center justify-between gap-2 tracking-normal ${textSecondary}`}
                                            >
                                                <span>انتخاب روز اجرا در ماه:</span>
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-[2px] border ${
                                                        isDark
                                                            ? 'bg-sky-400/10 border-sky-400/35 text-sky-300'
                                                            : 'bg-sky-50 border-sky-600/30 text-sky-800'
                                                    }`}
                                                >
                                                    ماه جاری:{' '}
                                                    {new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(
                                                        new Date()
                                                    )}
                                                </span>
                                            </label>
                                            <div className="grid grid-cols-7 gap-1">
                                                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData({ ...formData, schedule_day_of_month: day })
                                                        }
                                                        className={`h-7 text-xs font-semibold tabular-nums rounded-[2px] border transition-colors ${
                                                            formData.schedule_day_of_month === day
                                                                ? isDark
                                                                    ? 'bg-sky-400 border-sky-400 text-slate-950'
                                                                    : 'bg-sky-600 border-sky-600 text-white'
                                                                : isDark
                                                                ? 'bg-tactical-surface1 text-slate-300 hover:bg-tactical-hover border-slate-400/15'
                                                                : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-900/15'
                                                        }`}
                                                    >
                                                        {toPersianDigits(day)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {(formData.period === 'YEARLY' || formData.period === 'ONCE') && (
                                        <div className="space-y-1 relative">
                                            <label className={`text-xs font-semibold tracking-normal ${textSecondary}`}>
                                                {formData.period === 'ONCE'
                                                    ? 'تاریخ دقیق اجرا (مثال: ۱۴۰۵/۰۹/۱۰)'
                                                    : 'تاریخ اجرا در سال'}
                                            </label>
                                            <JalaliDatePicker
                                                name="schedule_date"
                                                value={formData.schedule_date}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, schedule_date: e.target.value })
                                                }
                                                placeholder={
                                                    formData.period === 'ONCE'
                                                        ? 'انتخاب تاریخ دقیق'
                                                        : 'انتخاب روز و ماه'
                                                }
                                                inputClassName={`${inputBase} pl-10`}
                                            />
                                        </div>
                                    )}

                                    <div className={`grid grid-cols-2 gap-3 pt-2 border-t ${borderHairline}`}>
                                        <div className="space-y-1">
                                            <label className={`text-[11px] font-semibold tracking-normal ${textSecondary}`}>
                                                ساعت یادآوری
                                            </label>
                                            <input
                                                type="time"
                                                disabled={formData.trigger_mode === 'CHECKOUT_BASED'}
                                                value={formData.reminder_time}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, reminder_time: e.target.value })
                                                }
                                                className={`${inputBase} dir-ltr ${
                                                    formData.trigger_mode === 'CHECKOUT_BASED' ? 'opacity-45' : ''
                                                }`}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className={`text-[11px] font-semibold tracking-normal ${textSecondary}`}>
                                                نحوه فعال‌سازی
                                            </label>
                                            <select
                                                value={formData.trigger_mode}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, trigger_mode: e.target.value })
                                                }
                                                className={inputBase}
                                            >
                                                <option value="HYBRID">ترکیبی</option>
                                                <option value="CHECKOUT_BASED">هنگام ثبت خروج</option>
                                                <option value="TIME_BASED">بر اساس ساعت</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* بخش چک‌لیست وظایف */}
                            <div
                                className={`p-4 rounded-[2px] border ${borderHairline} ${
                                    isDark ? 'bg-tactical-canvas/55' : 'bg-slate-50/70'
                                }`}
                            >
                                <h3
                                    className={`text-xs font-bold flex items-center gap-2 pb-2.5 mb-3 border-b tracking-normal ${borderHairline} ${textPrimary}`}
                                >
                                    <ClipboardDocumentCheckIcon
                                        className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                                    />
                                    {formData.period === 'WEEKLY'
                                        ? 'جدول چک‌لیست روزهای هفته'
                                        : 'چک‌لیست وظایف این الگو'}
                                </h3>

                                {formData.period === 'WEEKLY' ? (
                                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x w-full">
                                        {WEEK_DAYS.map((day) => {
                                            const itemsInDay = formData.checklists
                                                .map((item, idx) => ({ ...item, originalIndex: idx }))
                                                .filter((c) => c.target_days?.includes(day.value));
                                            return (
                                                <div
                                                    key={day.value}
                                                    className={`min-w-[220px] snap-center rounded-[2px] border flex flex-col ${borderHairline} ${surfacePanel}`}
                                                >
                                                    <div
                                                        className={`px-2.5 py-2 border-b flex justify-between items-center text-xs ${borderHairline} ${surfaceHeader}`}
                                                    >
                                                        <span className={`font-bold tracking-normal ${textPrimary}`}>
                                                            {day.label}
                                                        </span>
                                                        <span
                                                            className={`text-[10px] px-1.5 py-0.5 rounded-[2px] border tabular-nums ${borderHairline} ${textSecondary}`}
                                                        >
                                                            {toPersianDigits(itemsInDay.length)} مورد
                                                        </span>
                                                    </div>
                                                    <div className="p-2 flex-1 space-y-2 min-h-[100px]">
                                                        {itemsInDay.map((item) => (
                                                            <div
                                                                key={item.originalIndex}
                                                                className={`flex items-start gap-1 p-1.5 rounded-[2px] border group ${borderHairline} ${
                                                                    isDark ? 'bg-tactical-canvas' : 'bg-slate-50'
                                                                }`}
                                                            >
                                                                <textarea
                                                                    rows="1"
                                                                    value={item.title}
                                                                    onChange={(e) =>
                                                                        handleChecklistChange(
                                                                            item.originalIndex,
                                                                            e.target.value
                                                                        )
                                                                    }
                                                                    placeholder="شرح وظیفه..."
                                                                    className={`flex-1 w-full text-xs resize-none focus:outline-none bg-transparent tracking-normal ${textPrimary}`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleRemoveChecklist(item.originalIndex)
                                                                    }
                                                                    className="text-red-400 hover:text-red-500 p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                                                                    aria-label="حذف وظیفه"
                                                                >
                                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddChecklistToDay(day.value)}
                                                            className={`w-full h-8 rounded-[2px] border border-dashed inline-flex items-center justify-center gap-1 text-xs font-semibold transition-colors tracking-normal ${
                                                                isDark
                                                                    ? 'border-slate-400/25 text-sky-300 hover:bg-tactical-hover'
                                                                    : 'border-slate-900/20 text-sky-700 hover:bg-sky-50'
                                                            }`}
                                                        >
                                                            <PlusIcon className="w-3.5 h-3.5" />
                                                            <span>افزودن</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-w-2xl">
                                        {formData.checklists.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span
                                                    className={`w-7 h-9 flex items-center justify-center rounded-[2px] border text-xs font-bold tabular-nums shrink-0 ${borderHairline} ${surfaceHeader} ${textSecondary}`}
                                                >
                                                    {toPersianDigits(idx + 1)}
                                                </span>
                                                <input
                                                    type="text"
                                                    value={item.title}
                                                    onChange={(e) => handleChecklistChange(idx, e.target.value)}
                                                    placeholder="شرح وظیفه..."
                                                    className={inputBase}
                                                    required
                                                />
                                                {formData.checklists.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveChecklist(idx)}
                                                        className={`h-9 w-9 inline-flex items-center justify-center rounded-[2px] border shrink-0 transition-colors ${
                                                            isDark
                                                                ? 'border-red-500/30 text-red-400 hover:bg-red-500/15'
                                                                : 'border-red-600/30 text-red-600 hover:bg-red-50'
                                                        }`}
                                                        aria-label="حذف سطر"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={handleAddChecklist}
                                            className={`h-8 inline-flex items-center gap-1.5 text-xs font-semibold px-3 rounded-[2px] border mt-1 tracking-normal transition-colors ${
                                                isDark
                                                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                                                    : 'border-emerald-600/35 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                            }`}
                                        >
                                            <PlusIcon className="w-3.5 h-3.5" />
                                            <span>افزودن سطر جدید</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className={`flex justify-end gap-2 pt-3 border-t ${borderHairline}`}>
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    className={`h-9 px-4 rounded-[2px] border text-xs font-semibold tracking-normal transition-colors ${
                                        isDark
                                            ? 'border-slate-400/20 bg-tactical-surface2 text-slate-300 hover:bg-tactical-hover'
                                            : 'border-slate-900/20 bg-white text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    انصراف
                                </button>
                                <button
                                    form="routine-form"
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`h-9 px-5 inline-flex items-center gap-2 rounded-[2px] font-semibold text-xs sm:text-sm tracking-normal transition-colors disabled:opacity-55 ${
                                        isDark
                                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                                    }`}
                                >
                                    {isSubmitting ? 'در حال ذخیره...' : editingId ? 'ذخیره تغییرات' : 'ثبت الگو'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* نوار فیلترها: تفکیک نوع، دوره‌ها و جستجو */}
                {/* ═══════════════════════════════════════════════════════════ */}
                <div className={`relative border rounded-[2px] p-3.5 space-y-3 ${surfacePanel} ${borderHairline}`}>
                    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
                        {/* فیلتر دوره تکرار */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`h-8 px-3 rounded-[2px] border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 tracking-normal ${
                                        activeTab === tab.id
                                            ? isDark
                                                ? 'bg-sky-400/15 border-sky-400/60 text-sky-300'
                                                : 'bg-sky-600 border-sky-700 text-white'
                                            : isDark
                                            ? 'bg-tactical-surface2/70 border-slate-400/15 text-slate-300 hover:bg-tactical-hover'
                                            : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* جستجو و فیلتر محدوده نمایش */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <div className="flex items-center gap-1">
                                {[
                                    { id: 'ALL', label: 'همه' },
                                    { id: 'POSITIONS', label: 'فقط سمت‌ها' },
                                    { id: 'PERSONAL', label: 'فقط فردی' },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setScopeFilter(item.id)}
                                        className={`h-8 px-2.5 rounded-[2px] border text-[11px] font-semibold transition-colors whitespace-nowrap tracking-normal ${
                                            scopeFilter === item.id
                                                ? isDark
                                                    ? 'bg-amber-400/15 border-amber-400/55 text-amber-300'
                                                    : 'bg-amber-600 border-amber-700 text-white'
                                                : isDark
                                                ? 'bg-tactical-surface2/70 border-slate-400/15 text-slate-400 hover:text-slate-200'
                                                : 'bg-slate-50 border-slate-900/15 text-slate-600 hover:text-slate-900'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full sm:w-64">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="جستجوی سمت، عنوان یا وظیفه..."
                                    className={`w-full h-8 pe-8 ps-3 rounded-[2px] border text-xs focus:outline-none tracking-normal ${
                                        isDark
                                            ? 'bg-tactical-canvas border-slate-400/20 text-slate-100 placeholder-slate-500 focus:border-sky-400'
                                            : 'bg-slate-50 border-slate-900/20 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                                    }`}
                                />
                                <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════ */}
                {/* وضعیت بارگذاری یا محتوای اصلی دو بخش */}
                {/* ═══════════════════════════════════════════════════════════ */}
                {templateLoading ? (
                    <div className={`border rounded-[2px] overflow-hidden ${surfacePanel} ${borderHairline}`}>
                        <div className={`h-0.5 w-full ${isDark ? 'bg-sky-400/20' : 'bg-sky-600/20'} overflow-hidden`}>
                            <div
                                className={`h-full w-1/2 animate-shimmer ${
                                    isDark
                                        ? 'bg-gradient-to-r from-transparent via-sky-400 to-transparent'
                                        : 'bg-gradient-to-r from-transparent via-sky-600 to-transparent'
                                }`}
                                style={{ backgroundSize: '200% 100%' }}
                            />
                        </div>
                        <div className="p-4 space-y-2.5">
                            {[1, 2, 3, 4].map((i) => (
                                <div
                                    key={i}
                                    className={`h-14 rounded-[2px] border animate-pulse ${
                                        isDark
                                            ? 'bg-tactical-surface2/60 border-slate-400/10'
                                            : 'bg-slate-100 border-slate-900/10'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* ═══════════════════════════════════════════════════════ */}
                        {/* بخش ۰۱: جدول سازمانی و کارت‌های شرح وظایف سمت‌ها */}
                        {/* ═══════════════════════════════════════════════════════ */}
                        {scopeFilter !== 'PERSONAL' && (
                            <section aria-label="شرح وظایف سمت‌های سازمانی" className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`w-1.5 h-5 rounded-[1px] ${
                                                isDark ? 'bg-amber-400' : 'bg-amber-600'
                                            }`}
                                        />
                                        <h2 className={`text-base sm:text-lg font-bold tracking-normal ${textPrimary}`}>
                                            جدول و کارت‌های شرح وظایف سمت‌های سازمانی
                                        </h2>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* فیلتر وضعیت پوشش سمت‌ها */}
                                        <div className="flex items-center gap-1">
                                            {[
                                                { id: 'ALL', label: `همه (${toPersianDigits(summaryStats.totalPositions)})` },
                                                {
                                                    id: 'WITH_CHECKLIST',
                                                    label: `دارای چک‌لیست (${toPersianDigits(summaryStats.coveredPositions)})`,
                                                },
                                                {
                                                    id: 'WITHOUT_CHECKLIST',
                                                    label: `فاقد چک‌لیست (${toPersianDigits(summaryStats.uncoveredPositions)})`,
                                                },
                                            ].map((f) => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => setPositionCoverageFilter(f.id)}
                                                    className={`h-7 px-2.5 rounded-[2px] border text-[11px] font-semibold tabular-nums transition-colors tracking-normal ${
                                                        positionCoverageFilter === f.id
                                                            ? isDark
                                                                ? 'bg-emerald-500/15 border-emerald-400/55 text-emerald-300'
                                                                : 'bg-emerald-600 border-emerald-700 text-white'
                                                            : isDark
                                                            ? 'bg-tactical-surface1 border-slate-400/15 text-slate-400 hover:text-slate-200'
                                                            : 'bg-white border-slate-900/15 text-slate-600 hover:text-slate-900'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* سوییچ نمای جدول سازمانی / کارت‌های شرح وظایف */}
                                        <div
                                            className={`inline-flex rounded-[2px] border p-0.5 ${borderHairline} ${surfacePanel}`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setPositionViewMode('TABLE')}
                                                className={`h-7 px-2.5 rounded-[2px] inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-normal transition-colors ${
                                                    positionViewMode === 'TABLE'
                                                        ? isDark
                                                            ? 'bg-sky-400 text-slate-950'
                                                            : 'bg-sky-600 text-white'
                                                        : textSecondary
                                                }`}
                                            >
                                                <TableCellsIcon className="w-3.5 h-3.5" />
                                                <span>جدول سازمانی</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPositionViewMode('CARDS')}
                                                className={`h-7 px-2.5 rounded-[2px] inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-normal transition-colors ${
                                                    positionViewMode === 'CARDS'
                                                        ? isDark
                                                            ? 'bg-sky-400 text-slate-950'
                                                            : 'bg-sky-600 text-white'
                                                        : textSecondary
                                                }`}
                                            >
                                                <Squares2X2Icon className="w-3.5 h-3.5" />
                                                <span>کارت شرح وظایف</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {visiblePositionDossiers.length === 0 ? (
                                    <div
                                        className={`relative text-center py-12 px-4 rounded-[2px] border ${surfacePanel} ${borderHairline}`}
                                    >
                                        <BuildingOffice2Icon className="w-10 h-10 mx-auto mb-2.5 opacity-25" />
                                        <p className={`text-sm font-bold tracking-normal ${textPrimary}`}>
                                            سمت سازمانی مطابق فیلتر انتخاب‌شده یافت نشد.
                                        </p>
                                    </div>
                                ) : positionViewMode === 'TABLE' ? (
                                    /* نمای جدول سازمانی (با باز شدن پرونده کامل شرح وظایف هر سمت) */
                                    <div
                                        className={`relative rounded-[2px] border overflow-hidden ${surfacePanel} ${borderHairline}`}
                                    >
                                        <CornerBrackets accent="amber" isDark={isDark} />

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-right text-xs sm:text-sm border-collapse">
                                                <thead
                                                    className={`text-xs font-bold tracking-normal border-b-2 ${
                                                        isDark
                                                            ? 'bg-tactical-surface2 border-slate-400/25 text-slate-300'
                                                            : 'bg-tactical-lightElevated border-slate-900/20 text-slate-700'
                                                    }`}
                                                >
                                                    <tr>
                                                        <th className="px-3.5 py-3 w-12 text-center">ردیف</th>
                                                        <th className="px-3.5 py-3">عنوان سمت / شغل سازمانی</th>
                                                        <th className="px-3.5 py-3 w-40">وضعیت چک‌لیست</th>
                                                        <th className="px-3.5 py-3 w-56">تفکیک دوره‌ها</th>
                                                        <th className="px-3.5 py-3 w-28 text-center">تعداد وظایف</th>
                                                        <th className="px-3.5 py-3 w-44 text-center">عملیات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {visiblePositionDossiers.map((pos, idx) => {
                                                        const isExpanded = expandedPositionId === pos.id;
                                                        const isEven = idx % 2 === 0;

                                                        const rowBg = isEven
                                                            ? isDark
                                                                ? 'bg-tactical-surface1 hover:bg-tactical-hover border-b-2 border-tactical-canvas'
                                                                : 'bg-white hover:bg-sky-50/45 border-b-2 border-slate-200'
                                                            : isDark
                                                            ? 'bg-tactical-surface2/80 hover:bg-tactical-hover border-b-2 border-tactical-canvas'
                                                            : 'bg-slate-100/75 hover:bg-sky-50/45 border-b-2 border-slate-200';

                                                        return (
                                                            <React.Fragment key={pos.id}>
                                                                <tr
                                                                    onClick={() =>
                                                                        setExpandedPositionId(isExpanded ? null : pos.id)
                                                                    }
                                                                    className={`cursor-pointer transition-colors duration-150 ${rowBg}`}
                                                                >
                                                                    <td
                                                                        className={`px-3.5 py-3 text-center tabular-nums font-bold border-s-[3px] ${
                                                                            pos.hasAnyChecklist
                                                                                ? isDark
                                                                                    ? 'border-s-emerald-400/70 text-slate-300'
                                                                                    : 'border-s-emerald-600/70 text-slate-700'
                                                                                : isDark
                                                                                ? 'border-s-amber-400/70 text-amber-300'
                                                                                : 'border-s-amber-600/70 text-amber-800'
                                                                        }`}
                                                                    >
                                                                        {toPersianDigits(idx + 1)}
                                                                    </td>

                                                                    <td className="px-3.5 py-3">
                                                                        <div className="flex items-center gap-2.5">
                                                                            <div
                                                                                className={`w-8 h-8 rounded-[2px] border flex items-center justify-center shrink-0 ${
                                                                                    pos.hasAnyChecklist
                                                                                        ? isDark
                                                                                            ? 'bg-sky-400/10 border-sky-400/35 text-sky-400'
                                                                                            : 'bg-sky-50 border-sky-600/30 text-sky-700'
                                                                                        : isDark
                                                                                        ? 'bg-amber-400/10 border-amber-400/35 text-amber-400'
                                                                                        : 'bg-amber-50 border-amber-600/30 text-amber-700'
                                                                                }`}
                                                                            >
                                                                                <BriefcaseIcon className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <div
                                                                                    className={`font-bold text-xs sm:text-sm tracking-normal ${textPrimary}`}
                                                                                >
                                                                                    {pos.title}
                                                                                </div>
                                                                                <div
                                                                                    className={`text-[10px] tabular-nums tracking-normal ${textSecondary}`}
                                                                                >
                                                                                    {toPersianDigits(
                                                                                        pos.visibleTemplates.length
                                                                                    )}{' '}
                                                                                    الگوی ثبت‌شده
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-3.5 py-3 whitespace-nowrap">
                                                                        {pos.hasAnyChecklist ? (
                                                                            <span
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[11px] font-semibold tracking-normal ${
                                                                                    isDark
                                                                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                                                                        : 'bg-emerald-50 border-emerald-600/35 text-emerald-800'
                                                                                }`}
                                                                            >
                                                                                <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" />
                                                                                دارای چک‌لیست
                                                                            </span>
                                                                        ) : (
                                                                            <span
                                                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] border text-[11px] font-semibold tracking-normal ${
                                                                                    isDark
                                                                                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                                                                        : 'bg-amber-50 border-amber-600/35 text-amber-800'
                                                                                }`}
                                                                            >
                                                                                <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
                                                                                فاقد چک‌لیست
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    <td className="px-3.5 py-3">
                                                                        {pos.visibleTemplates.length > 0 ? (
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {Object.entries(pos.periodCounts)
                                                                                    .filter(([, count]) => count > 0)
                                                                                    .map(([periodKey, count]) => (
                                                                                        <span
                                                                                            key={periodKey}
                                                                                            className={`px-1.5 py-0.5 rounded-[2px] border text-[10px] font-semibold tabular-nums tracking-normal ${
                                                                                                isDark
                                                                                                    ? 'bg-tactical-canvas border-slate-400/20 text-slate-300'
                                                                                                    : 'bg-white border-slate-900/15 text-slate-700'
                                                                                            }`}
                                                                                        >
                                                                                            {PERIOD_LABELS[periodKey]}:{' '}
                                                                                            {toPersianDigits(count)}
                                                                                        </span>
                                                                                    ))}
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-[11px] text-slate-500">
                                                                                ---
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                                                                        <span
                                                                            className={`inline-flex items-center justify-center min-w-[36px] px-2 py-0.5 rounded-[2px] border text-xs font-bold tabular-nums ${
                                                                                pos.visibleChecklistCount > 0
                                                                                    ? isDark
                                                                                        ? 'bg-sky-400/10 border-sky-400/35 text-sky-300'
                                                                                        : 'bg-sky-50 border-sky-600/30 text-sky-800'
                                                                                    : isDark
                                                                                    ? 'bg-tactical-canvas border-slate-400/15 text-slate-500'
                                                                                    : 'bg-slate-100 border-slate-900/10 text-slate-500'
                                                                            }`}
                                                                        >
                                                                            {toPersianDigits(pos.visibleChecklistCount)}
                                                                        </span>
                                                                    </td>

                                                                    <td
                                                                        className="px-3.5 py-3 whitespace-nowrap"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <div className="flex items-center justify-center gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setExpandedPositionId(
                                                                                        isExpanded ? null : pos.id
                                                                                    )
                                                                                }
                                                                                className={`h-7 px-2.5 rounded-[2px] border text-[11px] font-semibold inline-flex items-center gap-1 tracking-normal transition-colors ${
                                                                                    isExpanded
                                                                                        ? isDark
                                                                                            ? 'bg-sky-400 border-sky-400 text-slate-950'
                                                                                            : 'bg-sky-600 border-sky-600 text-white'
                                                                                        : isDark
                                                                                        ? 'bg-tactical-canvas border-slate-400/20 text-slate-200 hover:border-sky-400/50'
                                                                                        : 'bg-white border-slate-900/20 text-slate-700 hover:border-sky-600/50'
                                                                                }`}
                                                                            >
                                                                                <span>
                                                                                    {isExpanded ? 'بستن' : 'شرح وظایف'}
                                                                                </span>
                                                                                <ChevronDownIcon
                                                                                    className={`w-3 h-3 transition-transform ${
                                                                                        isExpanded ? 'rotate-180' : ''
                                                                                    }`}
                                                                                />
                                                                            </button>

                                                                            {isManager && (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleOpenFormForPosition(pos.id)
                                                                                    }
                                                                                    className={`h-7 w-7 rounded-[2px] border inline-flex items-center justify-center transition-colors ${
                                                                                        isDark
                                                                                            ? 'bg-amber-400/10 border-amber-400/40 text-amber-300 hover:bg-amber-400/20'
                                                                                            : 'bg-amber-50 border-amber-600/35 text-amber-800 hover:bg-amber-100'
                                                                                    }`}
                                                                                    title={`افزودن شرح وظایف برای ${pos.title}`}
                                                                                    aria-label={`افزودن شرح وظایف برای ${pos.title}`}
                                                                                >
                                                                                    <PlusIcon className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {isExpanded && (
                                                                    <tr
                                                                        className={
                                                                            isDark
                                                                                ? 'bg-tactical-canvas/90 border-b-2 border-sky-400/35'
                                                                                : 'bg-slate-50 border-b-2 border-sky-600/30'
                                                                        }
                                                                    >
                                                                        <td colSpan="6" className="p-3.5 sm:p-4">
                                                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <ClipboardDocumentCheckIcon
                                                                                        className={`w-4 h-4 ${
                                                                                            isDark
                                                                                                ? 'text-sky-400'
                                                                                                : 'text-sky-700'
                                                                                        }`}
                                                                                    />
                                                                                    <span
                                                                                        className={`text-xs font-bold tracking-normal ${textPrimary}`}
                                                                                    >
                                                                                        کارت شرح وظایف رسمی سمت: {pos.title}
                                                                                    </span>
                                                                                </div>
                                                                                {isManager && (
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() =>
                                                                                            handleOpenFormForPosition(
                                                                                                pos.id
                                                                                            )
                                                                                        }
                                                                                        className={`h-7 px-2.5 rounded-[2px] border inline-flex items-center gap-1 text-[11px] font-semibold tracking-normal transition-colors ${
                                                                                            isDark
                                                                                                ? 'border-sky-400/40 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20'
                                                                                                : 'border-sky-600/35 bg-sky-50 text-sky-800 hover:bg-sky-100'
                                                                                        }`}
                                                                                    >
                                                                                        <PlusIcon className="w-3.5 h-3.5" />
                                                                                        <span>افزودن الگو به این سمت</span>
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            {renderPositionTemplatesBody(pos)}
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    /* نمای کارت‌های مستقل شرح وظایف هر سمت */
                                    <div className="space-y-3.5">
                                        {visiblePositionDossiers.map((pos, idx) => (
                                            <div
                                                key={pos.id}
                                                className={`relative rounded-[2px] border overflow-hidden ${surfacePanel} ${
                                                    pos.hasAnyChecklist
                                                        ? isDark
                                                            ? 'border-slate-400/20'
                                                            : 'border-slate-900/15'
                                                        : isDark
                                                        ? 'border-amber-400/35'
                                                        : 'border-amber-600/35'
                                                }`}
                                            >
                                                <CornerBrackets
                                                    accent={pos.hasAnyChecklist ? 'cyan' : 'amber'}
                                                    isDark={isDark}
                                                />

                                                {/* سرصفحه کارت سمت */}
                                                <div
                                                    className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${borderHairline} ${
                                                        pos.hasAnyChecklist
                                                            ? surfaceHeader
                                                            : isDark
                                                            ? 'bg-amber-500/10'
                                                            : 'bg-amber-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <span
                                                            className={`px-2 py-0.5 rounded-[2px] border text-[10px] font-bold tabular-nums ${borderHairline} ${textSecondary}`}
                                                        >
                                                            سمت {toPersianDigits(idx + 1)}
                                                        </span>
                                                        <BriefcaseIcon
                                                            className={`w-4 h-4 shrink-0 ${
                                                                pos.hasAnyChecklist
                                                                    ? isDark
                                                                        ? 'text-sky-400'
                                                                        : 'text-sky-700'
                                                                    : isDark
                                                                    ? 'text-amber-400'
                                                                    : 'text-amber-700'
                                                            }`}
                                                        />
                                                        <h3 className={`text-sm sm:text-base font-bold tracking-normal ${textPrimary}`}>
                                                            {pos.title}
                                                        </h3>
                                                        {pos.hasAnyChecklist ? (
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-normal ${
                                                                    isDark
                                                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                                                        : 'bg-emerald-50 border-emerald-600/35 text-emerald-800'
                                                                }`}
                                                            >
                                                                <CheckCircleIcon className="w-3 h-3" />
                                                                {toPersianDigits(pos.visibleChecklistCount)} وظیفه در{' '}
                                                                {toPersianDigits(pos.visibleTemplates.length)} الگو
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[10px] font-semibold tracking-normal ${
                                                                    isDark
                                                                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                                                        : 'bg-amber-50 border-amber-600/35 text-amber-800'
                                                                }`}
                                                            >
                                                                <ExclamationCircleIcon className="w-3 h-3" />
                                                                فاقد چک‌لیست
                                                            </span>
                                                        )}
                                                    </div>

                                                    {isManager && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenFormForPosition(pos.id)}
                                                            className={`h-7 px-2.5 rounded-[2px] border inline-flex items-center gap-1 text-[11px] font-semibold tracking-normal transition-colors ${
                                                                isDark
                                                                    ? 'border-sky-400/40 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20'
                                                                    : 'border-sky-600/35 bg-white text-sky-800 hover:bg-sky-50'
                                                            }`}
                                                        >
                                                            <PlusIcon className="w-3.5 h-3.5" />
                                                            <span>افزودن الگو</span>
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="p-3.5 sm:p-4">{renderPositionTemplatesBody(pos)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ═══════════════════════════════════════════════════════ */}
                        {/* بخش ۰۲: برنامه‌های فردی و شخصی */}
                        {/* ═══════════════════════════════════════════════════════ */}
                        {scopeFilter !== 'POSITIONS' && (
                            <section aria-label="برنامه‌های فردی و شخصی" className="space-y-3 pb-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <span
                                            className={`w-1.5 h-5 rounded-[1px] ${
                                                isDark ? 'bg-sky-400' : 'bg-sky-600'
                                            }`}
                                        />
                                        <h2 className={`text-base sm:text-lg font-bold tracking-normal ${textPrimary}`}>
                                            برنامه‌های فردی و تخصیص‌یافته به اشخاص
                                        </h2>
                                    </div>
                                    <span className={`text-xs font-medium tabular-nums tracking-normal ${textSecondary}`}>
                                        {toPersianDigits(personalTemplates.length)} الگو
                                    </span>
                                </div>

                                {personalTemplates.length === 0 ? (
                                    <div
                                        className={`text-center py-10 px-4 rounded-[2px] border ${surfacePanel} ${borderHairline}`}
                                    >
                                        <UserIcon className="w-9 h-9 mx-auto mb-2 opacity-25" />
                                        <p className={`text-xs sm:text-sm font-semibold tracking-normal ${textSecondary}`}>
                                            هیچ الگوی فردی در این فیلتر یافت نشد.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
                                        {personalTemplates.map((tpl) => (
                                            <RoutineTemplateCard
                                                key={tpl.id}
                                                tpl={tpl}
                                                isDark={isDark}
                                                onEdit={handleEditTemplate}
                                                onDelete={handleDeleteTemplate}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RoutineTemplatesPage;