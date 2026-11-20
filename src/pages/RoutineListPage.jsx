import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchWeeklyPlannerRoutines,
    toggleRoutineItem,
    moveRoutineItem,
    optimisticMoveItem,
    fetchUserTimeBlocks,
    splitUserTimeBlock,
    updateTimeBlockBoundary,
    updateUserTimeBlock,
    deleteUserTimeBlock,
    fetchDifficultySettings,
    quickAddRoutine,
} from '../features/routine/routineSlice';
import {
    ArrowPathIcon,
    ArrowsPointingInIcon,
    ArrowsPointingOutIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ClockIcon,
    Cog6ToothIcon,
    PencilSquareIcon,
    PlusIcon,
    QueueListIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MonthlyRadar from '../components/routine/MonthlyRadar';

// ---------------------------------------------------------
// توابع کمکی
// ---------------------------------------------------------
const toPersianDigits = (value) =>
    String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const getErrorMsg = (err, defaultMsg = 'خطایی رخ داد') => {
    if (!err) return defaultMsg;
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    return defaultMsg;
};

const timeToMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const minsToTime = (m) => {
    const h = Math.floor(m / 60) % 24;
    const mins = m % 60;
    return `${String(h).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const DIFFICULTY_LABELS = {
    EASY: 'آسان',
    MEDIUM: 'متوسط',
    HARD: 'سخت',
    EXPERT: 'بسیار سخت',
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

// ---------------------------------------------------------
// کامپوننت اصلی بورد هفتگی (کارتابل)
// ---------------------------------------------------------
const RoutineListPage = () => {
    const dispatch = useDispatch();
    const {
        weeklyRoutines = {},
        timeBlocks = [],
        difficultySettings = [],
        toggleLoadingId,
        error,
    } = useSelector((state) => state.routine);
    const mode = useSelector((state) => state.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const [baseDate, setBaseDate] = useState(() => {
        const savedDate = localStorage.getItem('routineBaseDate');
        if (savedDate) {
            const parsed = new Date(savedDate);
            if (!isNaN(parsed.getTime())) return parsed;
        }
        return new Date();
    });

    useEffect(() => {
        localStorage.setItem('routineBaseDate', baseDate.toISOString());
    }, [baseDate]);

    const jalaliYear = useMemo(
        () => new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(baseDate),
        [baseDate]
    );
    const jalaliMonthName = useMemo(
        () => new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(baseDate),
        [baseDate]
    );

    const topScrollRef = useRef(null);
    const bottomScrollRef = useRef(null);
    const [scrollWidth, setScrollWidth] = useState(0);

    // کنترل اسکرول هدر
    const isDraggingRef = useRef(false);
    const scrollMapRef = useRef(new WeakMap());

    const handleColumnScroll = (e) => {
        if (isDraggingRef.current) return;

        const target = e.currentTarget;
        const currentScroll = target.scrollTop;
        const lastScroll = scrollMapRef.current.get(target) || 0;

        const header = document.querySelector('header');
        if (!header) return;

        if (!header.style.transition) {
            header.style.transition = 'margin-top 0.3s ease-in-out';
        }

        if (currentScroll > lastScroll && currentScroll > 30) {
            header.style.marginTop = `-${header.offsetHeight}px`;
        } else if (currentScroll < lastScroll) {
            header.style.marginTop = '0px';
        }

        scrollMapRef.current.set(target, currentScroll);
    };

    useEffect(() => {
        return () => {
            const header = document.querySelector('header');
            if (header) {
                header.style.marginTop = '0px';
            }
        };
    }, []);

    const [activeBoundary, setActiveBoundary] = useState(null);
    const [zoomedDay, setZoomedDay] = useState(null);

    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickAddState, setQuickAddState] = useState({
        isOpen: false,
        date: null,
        timeBlockId: null,
        title: '',
        reminder_time: '',
        difficulty: 'MEDIUM',
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState([]);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsSettingsOpen(false);
                setActiveBoundary(null);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const weekDays = useMemo(() => {
        const date = new Date(baseDate);
        const dayOfWeek = date.getDay();
        const offsetToSat = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
        const sat = new Date(date);
        sat.setDate(date.getDate() - offsetToSat);

        const week = [];
        const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

        for (let i = 0; i < 7; i++) {
            const d = new Date(sat);
            d.setDate(sat.getDate() + i);
            const apiDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                .toISOString()
                .split('T')[0];

            week.push({
                dateObj: d,
                apiDate: apiDate,
                dayName: dayNames[i],
                isToday: d.toDateString() === new Date().toDateString(),
                dayNum: new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' }).format(d),
                dayIndex: i,
            });
        }
        return week;
    }, [baseDate]);

    const monthDays = useMemo(() => {
        if (!weekDays || weekDays.length === 0) return [];
        const sat = new Date(weekDays[0].dateObj);

        const startOfGrid = new Date(sat);
        startOfGrid.setDate(sat.getDate() - 14);

        const days = [];
        for (let i = 0; i < 35; i++) {
            const d = new Date(startOfGrid);
            d.setDate(startOfGrid.getDate() + i);
            const apiDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                .toISOString()
                .split('T')[0];
            days.push({
                dateObj: d,
                apiDate: apiDate,
                isToday: d.toDateString() === new Date().toDateString(),
                dayNum: new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(d),
                monthName: new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(d),
                isCurrentWeek: i >= 14 && i < 21,
            });
        }
        return days;
    }, [weekDays]);

    // پالت تاکتیکی متمایز برای تفکیک بازه‌های زمانی متوالی در هر ستون
    const themes = useMemo(
        () => [
            {
                border: isDark ? 'border-amber-400/30' : 'border-amber-600/35',
                bg: isDark ? 'bg-[#12100B]' : 'bg-amber-50/75',
                line: isDark ? 'border-amber-400/55' : 'border-amber-600/60',
                dot: 'bg-amber-500',
                text: isDark ? 'text-amber-300' : 'text-amber-900',
            },
            {
                border: isDark ? 'border-sky-400/30' : 'border-sky-600/35',
                bg: isDark ? 'bg-[#0A131C]' : 'bg-sky-50/75',
                line: isDark ? 'border-sky-400/55' : 'border-sky-600/60',
                dot: 'bg-sky-400',
                text: isDark ? 'text-sky-300' : 'text-sky-900',
            },
            {
                border: isDark ? 'border-emerald-400/30' : 'border-emerald-600/35',
                bg: isDark ? 'bg-[#0A1512]' : 'bg-emerald-50/75',
                line: isDark ? 'border-emerald-400/55' : 'border-emerald-600/60',
                dot: 'bg-emerald-500',
                text: isDark ? 'text-emerald-300' : 'text-emerald-900',
            },
            {
                border: isDark ? 'border-indigo-400/30' : 'border-indigo-600/35',
                bg: isDark ? 'bg-[#0E111E]' : 'bg-indigo-50/75',
                line: isDark ? 'border-indigo-400/55' : 'border-indigo-600/60',
                dot: 'bg-indigo-400',
                text: isDark ? 'text-indigo-300' : 'text-indigo-900',
            },
            {
                border: isDark ? 'border-rose-400/30' : 'border-rose-600/35',
                bg: isDark ? 'bg-[#170D11]' : 'bg-rose-50/75',
                line: isDark ? 'border-rose-400/55' : 'border-rose-600/60',
                dot: 'bg-rose-500',
                text: isDark ? 'text-rose-300' : 'text-rose-900',
            },
        ],
        [isDark]
    );

    useEffect(() => {
        dispatch(fetchUserTimeBlocks());
        dispatch(fetchDifficultySettings());
    }, [dispatch]);

    useEffect(() => {
        if (monthDays.length > 0) {
            dispatch(
                fetchWeeklyPlannerRoutines({
                    startDate: monthDays[0].apiDate,
                    endDate: monthDays[monthDays.length - 1].apiDate,
                })
            );
        }
    }, [dispatch, monthDays]);

    useEffect(() => {
        if (error) toast.error(getErrorMsg(error));
    }, [error]);

    useEffect(() => {
        const updateWidth = () => {
            if (bottomScrollRef.current) {
                setScrollWidth(bottomScrollRef.current.scrollWidth);
            }
        };
        updateWidth();
        const timeoutId = setTimeout(updateWidth, 150);
        return () => clearTimeout(timeoutId);
    }, [weekDays, zoomedDay, timeBlocks]);

    const handleTopScroll = (e) => {
        if (bottomScrollRef.current) bottomScrollRef.current.scrollLeft = e.target.scrollLeft;
    };
    const handleBottomScroll = (e) => {
        if (topScrollRef.current) topScrollRef.current.scrollLeft = e.target.scrollLeft;
    };

    const handleQuickSubmit = async (e) => {
        e.preventDefault();
        if (!quickAddState.title.trim()) return;

        setIsQuickAdding(true);
        try {
            await dispatch(
                quickAddRoutine({
                    title: quickAddState.title,
                    date: quickAddState.date,
                    time_block: quickAddState.timeBlockId === 'UNASSIGNED' ? null : quickAddState.timeBlockId,
                    reminder_time: quickAddState.reminder_time || null,
                    difficulty: quickAddState.difficulty,
                })
            ).unwrap();

            toast.success('آیتم جدید اضافه شد');
            setQuickAddState({
                isOpen: false,
                date: null,
                timeBlockId: null,
                title: '',
                reminder_time: '',
                difficulty: 'MEDIUM',
            });
            dispatch(
                fetchWeeklyPlannerRoutines({
                    startDate: monthDays[0].apiDate,
                    endDate: monthDays[monthDays.length - 1].apiDate,
                })
            );
        } catch (err) {
            toast.error(getErrorMsg(err, 'خطا در افزودن سریع روتین'));
        } finally {
            setIsQuickAdding(false);
        }
    };

    const openSettingsModal = () => {
        setSettingsForm(difficultySettings.map((s) => ({ ...s })));
        setIsSettingsOpen(true);
    };

    const handleSettingsChange = (index, value) => {
        const newForm = [...settingsForm];
        newForm[index].estimated_minutes = parseInt(value) || 0;
        setSettingsForm(newForm);
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            toast.success('تنظیمات زمانی با موفقیت به‌روزرسانی شد.');
            setIsSettingsOpen(false);
        } catch (err) {
            toast.error(getErrorMsg(err, 'خطا در ذخیره تنظیمات.'));
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSplitBlock = (blockId) => {
        dispatch(splitUserTimeBlock(blockId))
            .unwrap()
            .catch((err) => toast.error(getErrorMsg(err, 'خطا در نصف کردن بازه زمانی.')));
    };

    const handleEditTitle = (block) => {
        if (block.id === 'UNASSIGNED') return;
        const newTitle = window.prompt('عنوان جدید این بازه را وارد کنید:', block.rawTitle);
        if (newTitle && newTitle.trim() !== '' && newTitle !== block.rawTitle) {
            dispatch(updateUserTimeBlock({ id: block.originalId, title: newTitle.trim() }))
                .unwrap()
                .catch((err) => toast.error(getErrorMsg(err, 'خطا در ویرایش عنوان.')));
        }
    };

    const handleManualTimeEdit = (block, field, isBoundary = false, upperBlock = null) => {
        const currentVal = field === 'start_time' ? block.startTime : block.endTime;
        const promptText = isBoundary
            ? 'ساعت جدید مرز را وارد کنید (مثال: 10:15):'
            : `ساعت ${
                  field === 'start_time' ? 'شروع اولین بازه' : 'پایان آخرین بازه (ته زمان)'
              } را تنظیم کنید (مثال: 08:30):`;

        const newTime = window.prompt(promptText, currentVal);
        if (newTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) {
            if (isBoundary && upperBlock) {
                dispatch(
                    updateTimeBlockBoundary({
                        upperBlockId: upperBlock.originalId,
                        lowerBlockId: block.originalId,
                        newTime,
                    })
                )
                    .unwrap()
                    .catch((err) => toast.error(getErrorMsg(err, 'خطا در آپدیت مرز زمان.')));
            } else {
                dispatch(updateUserTimeBlock({ id: block.originalId, [field]: newTime }))
                    .unwrap()
                    .catch((err) => toast.error(getErrorMsg(err, 'خطا در آپدیت زمان.')));
            }
        } else if (newTime) {
            toast.error('فرمت زمان وارد شده نامعتبر است.');
        }
    };

    const handleShiftBoundary = (upperBlock, lowerBlock, minutesDelta) => {
        let upperStartMins = timeToMins(upperBlock.startTime);
        let currentMins = timeToMins(lowerBlock.startTime);
        let lowerEndMins = timeToMins(lowerBlock.endTime);

        if (currentMins <= upperStartMins && upperStartMins > 12 * 60) currentMins += 24 * 60;
        if (lowerEndMins <= currentMins) lowerEndMins += 24 * 60;

        let newMins = currentMins + minutesDelta;

        const minAllowed = upperStartMins + 5;
        const maxAllowed = lowerEndMins - 5;

        if (newMins < minAllowed) newMins = minAllowed;
        if (newMins > maxAllowed) newMins = maxAllowed;

        if (newMins === currentMins) {
            toast.error('بازه زمانی به حداقل خود رسیده و فشرده‌تر نمی‌شود.');
            return;
        }

        const normalizedMins = (newMins + 24 * 60) % (24 * 60);
        const newTime = minsToTime(normalizedMins);

        dispatch(
            updateTimeBlockBoundary({
                upperBlockId: upperBlock.originalId,
                lowerBlockId: lowerBlock.originalId,
                newTime,
            })
        )
            .unwrap()
            .catch((err) => {
                toast.error(getErrorMsg(err, 'خطا در آپدیت زمان'));
                dispatch(fetchUserTimeBlocks());
            });
    };

    const handleDeleteBlock = (blockId) => {
        if (
            window.confirm(
                'آیا از حذف این بازه زمانی اطمینان دارید؟ آیتم‌های داخل آن به "منتظر برنامه‌ریزی" منتقل خواهند شد.'
            )
        ) {
            dispatch(deleteUserTimeBlock(blockId))
                .unwrap()
                .then(() => toast.success('بازه زمانی با موفقیت حذف شد.'))
                .catch((err) => toast.error(getErrorMsg(err, 'خطا در حذف بازه زمانی.')));
        }
    };

    const onDragStart = () => {
        isDraggingRef.current = true;
    };

    const onDragEnd = (result) => {
        isDraggingRef.current = false;

        const header = document.querySelector('header');
        if (header) header.style.marginTop = '0px';

        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const [srcDate, srcBlock] = source.droppableId.split('::');
        const [destDate, destBlock] = destination.droppableId.split('::');
        const itemId = parseInt(draggableId.replace('item-', ''));
        const timeBlockValue = destBlock === 'UNASSIGNED' ? null : parseInt(destBlock);

        dispatch(optimisticMoveItem({ itemId, sourceDate: srcDate, destDate, destBlock: timeBlockValue }));
        dispatch(moveRoutineItem({ itemId, date: destDate, time_block: timeBlockValue }))
            .unwrap()
            .catch((err) => {
                toast.error(getErrorMsg(err, 'خطا در جابجایی آیتم.'));
                dispatch(
                    fetchWeeklyPlannerRoutines({
                        startDate: monthDays[0].apiDate,
                        endDate: monthDays[monthDays.length - 1].apiDate,
                    })
                );
            });
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'EXPERT':
                return 'bg-red-500';
            case 'HARD':
                return 'bg-amber-500';
            case 'MEDIUM':
                return 'bg-sky-500';
            case 'EASY':
                return 'bg-emerald-500';
            default:
                return 'bg-slate-500';
        }
    };

    const getUrgencyBorder = (urgency) => {
        switch (urgency) {
            case 'EXPERT':
                return isDark ? 'border-s-red-500/80' : 'border-s-red-600/80';
            case 'HARD':
                return isDark ? 'border-s-amber-400/80' : 'border-s-amber-600/80';
            case 'MEDIUM':
                return isDark ? 'border-s-sky-400/80' : 'border-s-sky-600/80';
            case 'EASY':
                return isDark ? 'border-s-emerald-400/80' : 'border-s-emerald-600/80';
            default:
                return isDark ? 'border-s-slate-500/60' : 'border-s-slate-400';
        }
    };

    // ---------------------------------------------------------
    // کارت دراگ و دراپ (فشرده و تاکتیکی)
    // ---------------------------------------------------------
    const renderDraggableItem = (item, index, isZoomed = false) => {
        const { parentRoutine } = item;
        const difficulty =
            parentRoutine.template_details?.difficulty ||
            parentRoutine.template_details?.urgency ||
            'MEDIUM';

        const diffSetting = difficultySettings.find((s) => s.difficulty === difficulty);
        const estimatedMinutes = diffSetting ? diffSetting.estimated_minutes : 0;

        let completedTimeStr = null;
        if (item.is_done && item.completed_at) {
            const dateObj = new Date(item.completed_at);
            completedTimeStr = dateObj.toLocaleDateString('fa-IR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        }

        return (
            <Draggable key={item.id} draggableId={`item-${item.id}`} index={index}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`mb-[3px] rounded-[2px] border border-s-2 flex flex-col transition-all duration-150 ${getUrgencyBorder(
                            difficulty
                        )} ${
                            snapshot.isDragging
                                ? isDark
                                    ? 'scale-[1.02] shadow-2xl border-sky-400 ring-1 ring-sky-400/50 z-[100]'
                                    : 'scale-[1.02] shadow-2xl border-sky-600 ring-1 ring-sky-600/40 z-[100]'
                                : isDark
                                ? 'border-slate-400/20 hover:border-sky-400/45'
                                : 'border-slate-900/15 hover:border-sky-600/50'
                        } ${isDark ? 'bg-tactical-surface1' : 'bg-white'} ${item.is_done ? 'opacity-60' : ''}`}
                    >
                        <div className="flex relative overflow-hidden rounded-[2px] min-h-full">
                            <div className="w-full flex flex-col">
                                {/* نوار بالایی کارت: عنوان قالب و زمان یادآوری */}
                                <div className="flex justify-between items-start leading-none">
                                    <div
                                        className={`font-semibold inline-block px-1.5 py-[2.5px] w-fit truncate max-w-[72%] tracking-normal border-b border-e ${
                                            isZoomed ? 'text-[10px]' : 'text-[9px]'
                                        } ${
                                            isDark
                                                ? 'bg-tactical-surface2 border-slate-400/15 text-sky-300'
                                                : 'bg-slate-100 border-slate-900/10 text-sky-800'
                                        }`}
                                        title={parentRoutine.title || parentRoutine.template_details?.title}
                                    >
                                        {parentRoutine.title || parentRoutine.template_details?.title}
                                    </div>

                                    {parentRoutine.template_details?.reminder_time && (
                                        <div
                                            className={`font-semibold flex items-center gap-0.5 px-1.5 py-[2px] shrink-0 border-b border-s ${
                                                isZoomed ? 'text-[10px]' : 'text-[8.5px]'
                                            } ${
                                                isDark
                                                    ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                                                    : 'bg-amber-50 text-amber-800 border-amber-600/30'
                                            }`}
                                        >
                                            <ClockIcon className={isZoomed ? 'w-2.5 h-2.5' : 'w-2 h-2'} />
                                            <span dir="ltr" className="tabular-nums">
                                                {toPersianDigits(
                                                    parentRoutine.template_details.reminder_time.substring(0, 5)
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* متن وظیفه و دکمه تیک */}
                                <div
                                    onClick={() => !toggleLoadingId && dispatch(toggleRoutineItem(item.id))}
                                    className={`flex items-start px-1.5 py-1 cursor-pointer w-full group transition-colors ${
                                        isZoomed ? 'gap-2' : 'gap-1.5'
                                    } ${
                                        item.is_done
                                            ? ''
                                            : isDark
                                            ? 'hover:bg-tactical-hover'
                                            : 'hover:bg-sky-50/50'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        disabled={toggleLoadingId === item.id}
                                        className="mt-[2px] shrink-0 transition-transform group-hover:scale-105"
                                        aria-label="تغییر وضعیت انجام"
                                    >
                                        {toggleLoadingId === item.id ? (
                                            <ArrowPathIcon
                                                className={`animate-spin ${
                                                    isDark ? 'text-sky-400' : 'text-sky-600'
                                                } ${isZoomed ? 'w-3.5 h-3.5' : 'w-3 h-3'}`}
                                            />
                                        ) : item.is_done ? (
                                            <CheckCircleIcon
                                                className={`${
                                                    isDark ? 'text-emerald-400' : 'text-emerald-600'
                                                } ${isZoomed ? 'w-3.5 h-3.5' : 'w-3 h-3'}`}
                                            />
                                        ) : (
                                            <span
                                                className={`block rounded-[2px] border ${
                                                    isZoomed ? 'w-3.5 h-3.5' : 'w-3 h-3'
                                                } ${
                                                    isDark
                                                        ? 'border-slate-400/50 group-hover:border-sky-400'
                                                        : 'border-slate-500 group-hover:border-sky-600'
                                                }`}
                                            />
                                        )}
                                    </button>
                                    <span
                                        className={`leading-snug font-semibold tracking-normal ${
                                            isZoomed ? 'text-[12px] md:text-[13px]' : 'text-[11px] md:text-[11.5px]'
                                        } ${
                                            item.is_done
                                                ? 'text-slate-500 line-through'
                                                : isDark
                                                ? 'text-slate-100'
                                                : 'text-slate-900'
                                        }`}
                                    >
                                        {item.title}
                                    </span>
                                </div>

                                {/* نوار پایینی کارت: وضعیت انجام و زمان تخمینی */}
                                <div
                                    className={`flex justify-between items-center border-t mt-auto ${
                                        isDark
                                            ? 'border-slate-400/15 bg-tactical-canvas/40'
                                            : 'border-slate-900/10 bg-slate-50/70'
                                    }`}
                                >
                                    <div className="flex-1 px-1.5 py-0.5 flex items-center min-w-0">
                                        {item.is_done && completedTimeStr ? (
                                            <div
                                                className={`flex items-center gap-1 font-semibold min-w-0 w-full ${
                                                    isDark ? 'text-emerald-400' : 'text-emerald-700'
                                                }`}
                                            >
                                                <CalendarDaysIcon
                                                    className={`${isZoomed ? 'w-2.5 h-2.5' : 'w-2 h-2'} shrink-0`}
                                                />
                                                <span
                                                    className={`truncate whitespace-nowrap tabular-nums tracking-normal ${
                                                        isZoomed ? 'text-[9.5px]' : 'text-[8.5px]'
                                                    }`}
                                                    title={completedTimeStr}
                                                >
                                                    {completedTimeStr}
                                                </span>
                                            </div>
                                        ) : (
                                            <span
                                                className={`font-medium tracking-normal ${
                                                    isZoomed ? 'text-[9.5px]' : 'text-[8.5px]'
                                                } text-slate-500`}
                                            >
                                                در انتظار
                                            </span>
                                        )}
                                    </div>

                                    {estimatedMinutes > 0 && (
                                        <div
                                            className={`flex items-center gap-1 px-1.5 py-0.5 border-s shrink-0 tabular-nums tracking-normal ${
                                                isDark
                                                    ? 'border-slate-400/15 text-slate-300'
                                                    : 'border-slate-900/10 text-slate-700'
                                            }`}
                                            title="زمان تخمینی"
                                        >
                                            <ClockIcon className={isZoomed ? 'w-2.5 h-2.5' : 'w-2 h-2'} />
                                            <span
                                                className={`font-semibold ${
                                                    isZoomed ? 'text-[9.5px]' : 'text-[8.5px]'
                                                }`}
                                            >
                                                <span className={isDark ? 'text-sky-400' : 'text-sky-700'}>
                                                    {toPersianDigits(estimatedMinutes)}
                                                </span>{' '}
                                                دقیقه
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Draggable>
        );
    };

    const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
    const isCurrentWeekDisplayed = weekDays.some((day) => day.isToday);

    return (
        <div
            className={`relative p-1.5 md:p-2 max-w-[100vw] overflow-hidden flex flex-col h-[100vh] transition-colors duration-200 ${
                isDark
                    ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
                    : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
            }`}
        >
            {/* نوار بالا: عنوان کارتابل، رادار ماهانه و ابزارها */}
            <div
                className={`relative flex flex-col md:flex-row justify-between items-center px-2.5 py-1.5 mb-1 gap-2 shrink-0 rounded-[2px] border ${borderHairline} ${
                    isDark ? 'bg-tactical-surface1/95' : 'bg-white/95'
                }`}
            >
                <CornerBrackets accent="cyan" isDark={isDark} />

                <div className="flex shrink-0 items-center justify-center md:justify-start gap-2.5">
                    <div
                        className={`w-8 h-8 rounded-[2px] border flex items-center justify-center shrink-0 ${
                            isDark
                                ? 'bg-sky-400/10 border-sky-400/35 text-sky-400'
                                : 'bg-sky-50 border-sky-600/35 text-sky-700'
                        }`}
                    >
                        <QueueListIcon className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-2">
                        <h1
                            className={`text-sm md:text-base font-bold tracking-normal ${
                                isDark ? 'text-slate-100' : 'text-slate-900'
                            }`}
                        >
                            کارتابل برنامه‌ریزی هفتگی
                        </h1>
                        <span
                            className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-[2px] border text-[11px] font-medium tabular-nums tracking-normal ${
                                isDark
                                    ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300'
                                    : 'bg-slate-100 border-slate-900/15 text-slate-700'
                            }`}
                        >
                            {jalaliMonthName} {jalaliYear}
                        </span>
                    </div>
                </div>

                {/* رادار ماهانه (بدون حبس z-index، بازشو روی اسکرول‌بار و ستون‌ها) */}
                <div className="flex-1 w-full max-w-md mx-auto relative">
                    <MonthlyRadar
                        monthDays={monthDays}
                        weeklyRoutines={weeklyRoutines}
                        setBaseDate={setBaseDate}
                        isDark={isDark}
                        jalaliMonthName={jalaliMonthName}
                        jalaliYear={jalaliYear}
                    />
                </div>

                <div className="flex shrink-0 justify-center md:justify-end items-center gap-1.5">
                    <button
                        type="button"
                        onClick={openSettingsModal}
                        className={`h-8 w-8 inline-flex items-center justify-center rounded-[2px] border transition-colors duration-150 ${
                            isDark
                                ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300 hover:text-amber-300 hover:border-amber-400/45 hover:bg-tactical-hover'
                                : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:text-amber-700 hover:border-amber-600/45 hover:bg-amber-50'
                        }`}
                        title="تنظیمات زمان‌بندی درجات سختی"
                        aria-label="تنظیمات زمان‌بندی درجات سختی"
                    >
                        <Cog6ToothIcon className="w-4 h-4" />
                    </button>
                    <Link
                        to="/routines/templates"
                        className={`h-8 inline-flex items-center justify-center gap-1.5 px-3 rounded-[2px] font-semibold text-xs tracking-normal transition-colors duration-150 ${
                            isDark
                                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                    >
                        <QueueListIcon className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden md:inline">شرح وظایف</span>
                    </Link>
                </div>
            </div>

            {/* اسکرول‌بار افقی بالایی (z-[30] تا همیشه زیر پنل بازشونده رادار بماند) */}
            <div
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className={`relative z-[30] w-full overflow-x-scroll overflow-y-hidden mt-1.5 mb-1.5 rounded-[2px] shrink-0 border ${
                    isDark
                        ? 'bg-tactical-surface1 border-slate-400/20 custom-scrollbar-dark'
                        : 'bg-slate-200/80 border-slate-900/20 custom-scrollbar'
                }`}
                style={{ height: '14px' }}
                title="اسکرول روزهای هفته"
            >
                <div style={{ width: scrollWidth, height: '1px' }} />
            </div>

            {/* مودال تنظیمات زمان‌بندی درجات سختی */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[1050] flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm">
                    <div
                        className={`relative w-full max-w-md rounded-[2px] shadow-2xl border overflow-hidden ${
                            isDark
                                ? 'bg-tactical-surface1 border-amber-400/40 text-slate-100'
                                : 'bg-white border-amber-600/40 text-slate-900'
                        }`}
                    >
                        <CornerBrackets accent="amber" isDark={isDark} />

                        <div
                            className={`flex justify-between items-center px-4 py-3 border-b ${
                                isDark
                                    ? 'bg-tactical-surface2 border-slate-400/15'
                                    : 'bg-amber-50 border-amber-600/20'
                            }`}
                        >
                            <h2 className="text-xs sm:text-sm font-bold flex items-center gap-2 tracking-normal">
                                <ClockIcon
                                    className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}
                                />
                                تخصیص زمان به درجات سختی
                            </h2>
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                                aria-label="بستن پنجره"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-4 space-y-3">
                            <p
                                className={`text-xs leading-6 tracking-normal ${
                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                }`}
                            >
                                مدت زمان تخمینی هر وظیفه را بر اساس درجه سختی آن (به دقیقه) تعیین نمایید.
                            </p>
                            <div className="space-y-2">
                                {settingsForm.map((setting, index) => (
                                    <div
                                        key={setting.id}
                                        className={`flex items-center justify-between p-2.5 rounded-[2px] border ${
                                            isDark
                                                ? 'bg-tactical-canvas border-slate-400/15'
                                                : 'bg-slate-50 border-slate-900/15'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`w-2 h-2 rounded-full ${getUrgencyColor(
                                                    setting.difficulty
                                                )}`}
                                            />
                                            <span className="text-xs font-bold tracking-normal">
                                                {DIFFICULTY_LABELS[setting.difficulty] || setting.difficulty}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <input
                                                type="number"
                                                min="1"
                                                value={setting.estimated_minutes}
                                                onChange={(e) => handleSettingsChange(index, e.target.value)}
                                                className={`w-20 h-8 px-2 text-center text-xs font-bold tabular-nums rounded-[2px] border focus:outline-none ${
                                                    isDark
                                                        ? 'bg-tactical-surface2 border-slate-400/25 text-slate-100 focus:border-sky-400'
                                                        : 'bg-white border-slate-900/20 text-slate-900 focus:border-sky-600'
                                                }`}
                                            />
                                            <span
                                                className={`text-[11px] font-medium tracking-normal ${
                                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                                }`}
                                            >
                                                دقیقه
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div
                            className={`flex justify-end gap-2 px-4 py-3 border-t ${borderHairline} ${
                                isDark ? 'bg-tactical-surface2' : 'bg-slate-50'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => setIsSettingsOpen(false)}
                                disabled={isSavingSettings}
                                className={`h-8 px-3.5 rounded-[2px] border text-xs font-semibold tracking-normal transition-colors ${
                                    isDark
                                        ? 'border-slate-400/25 bg-tactical-surface1 text-slate-300 hover:bg-tactical-hover'
                                        : 'border-slate-900/20 bg-white text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveSettings}
                                disabled={isSavingSettings}
                                className={`h-8 px-4 rounded-[2px] text-xs font-semibold tracking-normal inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
                                    isDark
                                        ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                                }`}
                            >
                                {isSavingSettings && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
                                <span>ذخیره تنظیمات</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* بورد ستون‌های روزهای هفته (Drag and Drop) */}
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <div
                    ref={bottomScrollRef}
                    onScroll={handleBottomScroll}
                    className="flex-1 overflow-x-auto no-scrollbar pb-1 select-none relative flex flex-col"
                >
                    <div className="flex gap-2 min-w-max h-full items-stretch px-0.5 flex-1">
                        {weekDays.map((day) => {
                            const dayRoutines = weeklyRoutines[day.apiDate] || [];

                            const filteredBlocks = timeBlocks.filter((b) => b.day_of_week === day.dayIndex);
                            const columnBlocks = [
                                {
                                    id: 'UNASSIGNED',
                                    originalId: null,
                                    rawTitle: 'منتظر برنامه‌ریزی',
                                    startTime: null,
                                    endTime: null,
                                    theme: {
                                        border: isDark ? 'border-slate-400/20' : 'border-slate-900/15',
                                        bg: isDark ? 'bg-tactical-canvas/85' : 'bg-slate-100/80',
                                        line: isDark ? 'border-slate-500/45' : 'border-slate-400/60',
                                        dot: 'bg-slate-400',
                                        text: isDark ? 'text-slate-300' : 'text-slate-700',
                                    },
                                },
                                ...filteredBlocks.map((b, i) => ({
                                    id: b.id.toString(),
                                    originalId: b.id,
                                    rawTitle: b.title,
                                    startTime: b.start_time.substring(0, 5),
                                    endTime: b.end_time.substring(0, 5),
                                    theme: themes[i % themes.length],
                                })),
                            ];

                            const isZoomed = zoomedDay === day.apiDate;
                            const isAnyZoomed = zoomedDay !== null;

                            let colClass =
                                'flex-shrink-0 flex flex-col h-full rounded-[2px] border transition-all duration-300 ease-out origin-top relative overflow-hidden ';
                            if (isZoomed) {
                                colClass += `w-[400px] md:w-[460px] shadow-2xl z-20 ring-1 ${
                                    isDark
                                        ? 'bg-tactical-surface1 border-sky-400 ring-sky-400/40'
                                        : 'bg-white border-sky-600 ring-sky-600/30'
                                }`;
                            } else if (isAnyZoomed) {
                                colClass += `w-[240px] opacity-40 scale-[0.98] z-0 saturate-50 pointer-events-auto ${
                                    day.isToday
                                        ? isDark
                                            ? 'border-amber-400/45 bg-tactical-surface1'
                                            : 'border-amber-600/45 bg-amber-50/40'
                                        : isDark
                                        ? 'border-slate-400/15 bg-tactical-surface1'
                                        : 'border-slate-900/15 bg-white'
                                }`;
                            } else {
                                colClass += `w-[280px] z-10 ${
                                    day.isToday
                                        ? isDark
                                            ? 'border-amber-400/55 bg-tactical-surface1'
                                            : 'border-amber-600/55 bg-white'
                                        : isDark
                                        ? 'border-slate-400/15 bg-tactical-surface1'
                                        : 'border-slate-900/15 bg-white'
                                }`;
                            }

                            return (
                                <div key={day.apiDate} className={colClass}>
                                    {isZoomed && <CornerBrackets accent="cyan" isDark={isDark} />}
                                    {day.isToday && !isZoomed && <CornerBrackets accent="amber" isDark={isDark} />}

                                    {/* سرصفحه ستون روز */}
                                    <div
                                        className={`relative z-20 px-2 py-1.5 flex items-center justify-between border-b transition-colors ${
                                            isZoomed
                                                ? isDark
                                                    ? 'bg-sky-400/15 border-sky-400/35'
                                                    : 'bg-sky-50 border-sky-600/30'
                                                : day.isToday
                                                ? isDark
                                                    ? 'bg-amber-400/10 border-amber-400/30'
                                                    : 'bg-amber-50 border-amber-600/25'
                                                : isDark
                                                ? 'bg-tactical-surface2 border-slate-400/15'
                                                : 'bg-tactical-lightElevated border-slate-900/15'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {day.isToday && (
                                                <span
                                                    className={`px-1.5 py-0.5 rounded-[2px] text-[9px] font-bold tracking-normal shrink-0 ${
                                                        isDark
                                                            ? 'bg-amber-400 text-slate-950'
                                                            : 'bg-amber-600 text-white'
                                                    }`}
                                                >
                                                    امروز
                                                </span>
                                            )}
                                            <h2
                                                className={`font-bold tracking-normal truncate ${
                                                    isZoomed ? 'text-base' : 'text-xs sm:text-sm'
                                                } ${
                                                    isZoomed
                                                        ? isDark
                                                            ? 'text-sky-300'
                                                            : 'text-sky-800'
                                                        : day.isToday
                                                        ? isDark
                                                            ? 'text-amber-300'
                                                            : 'text-amber-800'
                                                        : isDark
                                                        ? 'text-slate-100'
                                                        : 'text-slate-900'
                                                }`}
                                            >
                                                {day.dayName}
                                            </h2>
                                            <span className="text-[10px] text-slate-500">|</span>
                                            <span
                                                className={`text-[11px] font-medium tabular-nums tracking-normal ${
                                                    isDark ? 'text-slate-400' : 'text-slate-600'
                                                }`}
                                            >
                                                {day.dayNum}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setZoomedDay(isZoomed ? null : day.apiDate)}
                                            className={`w-6 h-6 shrink-0 flex justify-center items-center rounded-[2px] border transition-colors ${
                                                isZoomed
                                                    ? isDark
                                                        ? 'bg-sky-400 border-sky-400 text-slate-950'
                                                        : 'bg-sky-600 border-sky-600 text-white'
                                                    : isDark
                                                    ? 'bg-tactical-canvas border-slate-400/20 text-slate-300 hover:border-sky-400/50 hover:text-sky-300'
                                                    : 'bg-white border-slate-900/15 text-slate-600 hover:border-sky-600/50 hover:text-sky-700'
                                            }`}
                                            title={isZoomed ? 'خروج از حالت بزرگنمایی' : 'بزرگنمایی روی این روز'}
                                            aria-label={isZoomed ? 'خروج از حالت بزرگنمایی' : 'بزرگنمایی روی این روز'}
                                        >
                                            {isZoomed ? (
                                                <ArrowsPointingInIcon className="w-3.5 h-3.5" />
                                            ) : (
                                                <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* بدنه اسکرول‌شونده بازه‌های زمانی ستون */}
                                    <div
                                        className="flex-1 overflow-y-auto no-scrollbar py-1.5 px-1 relative"
                                        onScroll={handleColumnScroll}
                                    >
                                        {columnBlocks.map((block, index) => {
                                            const itemsInBlock = dayRoutines.flatMap((routine) => {
                                                return (routine.items || [])
                                                    .filter((item) => {
                                                        const tb = item.time_block;
                                                        const tbId = tb
                                                            ? typeof tb === 'object'
                                                                ? tb.id.toString()
                                                                : tb.toString()
                                                            : 'UNASSIGNED';

                                                        if (block.id === 'UNASSIGNED') {
                                                            const isValidForThisDay = filteredBlocks.some(
                                                                (b) => b.id.toString() === tbId
                                                            );
                                                            return tbId === 'UNASSIGNED' || !isValidForThisDay;
                                                        } else {
                                                            return tbId === block.id;
                                                        }
                                                    })
                                                    .map((item) => ({ ...item, parentRoutine: routine }));
                                            });

                                            const boundaryKey = `${day.apiDate}::${block.id}`;
                                            const isActive = activeBoundary === boundaryKey;
                                            const isThisFormOpen =
                                                quickAddState.isOpen &&
                                                quickAddState.date === day.apiDate &&
                                                quickAddState.timeBlockId === block.id;

                                            return (
                                                <div key={boundaryKey} className="relative pl-0.5 pr-2.5 flex flex-col">
                                                    {/* خط عمودی تایم‌لاین */}
                                                    <div
                                                        className={`absolute right-0.5 bottom-0 w-[1.5px] border-r border-dashed ${
                                                            block.theme.line
                                                        } ${index === 0 ? '-top-3' : 'top-0'}`}
                                                    />

                                                    {/* نشانگر ساعت شروع و کنترل مرز */}
                                                    {block.startTime && (
                                                        <div className="absolute right-[2px] left-2 -top-[5px] flex items-center z-40">
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {index > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleShiftBoundary(
                                                                                columnBlocks[index - 1],
                                                                                block,
                                                                                -15
                                                                            );
                                                                        }}
                                                                        className={`absolute right-[-4px] bottom-3 rounded-[2px] border p-[1px] z-50 transition-all duration-150 origin-bottom ${
                                                                            isDark
                                                                                ? 'bg-tactical-surface2 border-sky-400/50 text-sky-300 hover:bg-tactical-hover'
                                                                                : 'bg-white border-sky-600/50 text-sky-700 hover:bg-sky-50'
                                                                        } ${
                                                                            isActive
                                                                                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                                                                : 'opacity-0 scale-50 translate-y-2 pointer-events-none'
                                                                        }`}
                                                                        title="۱۵ دقیقه عقب‌تر"
                                                                    >
                                                                        <ChevronUpIcon className="w-2.5 h-2.5" />
                                                                    </button>
                                                                )}

                                                                <div
                                                                    className={`w-2 h-2 rounded-[1px] ring-1 ${
                                                                        isDark ? 'ring-tactical-canvas' : 'ring-white'
                                                                    } ${block.theme.dot} cursor-pointer hover:scale-125 transition-transform relative z-50`}
                                                                    onClick={() => {
                                                                        if (index > 1)
                                                                            setActiveBoundary(isActive ? null : boundaryKey);
                                                                        else handleManualTimeEdit(block, 'start_time');
                                                                    }}
                                                                    title={
                                                                        index > 1
                                                                            ? 'تنظیم مرز بازه (۱۵± دقیقه)'
                                                                            : 'ویرایش ساعت شروع'
                                                                    }
                                                                />

                                                                {index > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleShiftBoundary(
                                                                                columnBlocks[index - 1],
                                                                                block,
                                                                                15
                                                                            );
                                                                        }}
                                                                        className={`absolute right-[-4px] top-3 rounded-[2px] border p-[1px] z-50 transition-all duration-150 origin-top ${
                                                                            isDark
                                                                                ? 'bg-tactical-surface2 border-sky-400/50 text-sky-300 hover:bg-tactical-hover'
                                                                                : 'bg-white border-sky-600/50 text-sky-700 hover:bg-sky-50'
                                                                        } ${
                                                                            isActive
                                                                                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                                                                : 'opacity-0 scale-50 -translate-y-2 pointer-events-none'
                                                                        }`}
                                                                        title="۱۵ دقیقه جلوتر"
                                                                    >
                                                                        <ChevronDownIcon className="w-2.5 h-2.5" />
                                                                    </button>
                                                                )}

                                                                <span
                                                                    dir="ltr"
                                                                    onClick={() => {
                                                                        if (index > 1)
                                                                            handleManualTimeEdit(
                                                                                block,
                                                                                'start_time',
                                                                                true,
                                                                                columnBlocks[index - 1]
                                                                            );
                                                                        else handleManualTimeEdit(block, 'start_time');
                                                                    }}
                                                                    className={`text-[9.5px] font-bold tabular-nums z-40 cursor-pointer transition-colors ${
                                                                        isDark
                                                                            ? 'text-slate-300 hover:text-sky-400'
                                                                            : 'text-slate-700 hover:text-sky-700'
                                                                    }`}
                                                                >
                                                                    {toPersianDigits(block.startTime)}
                                                                </span>
                                                            </div>
                                                            {index > 1 && (
                                                                <div
                                                                    className={`flex-1 mr-1 border-t border-dashed ${
                                                                        isDark ? 'border-slate-400/25' : 'border-slate-900/20'
                                                                    }`}
                                                                />
                                                            )}
                                                        </div>
                                                    )}

                                                    {index === 1 && (
                                                        <>
                                                            <div
                                                                className={`absolute right-[50px] top-0 left-2 border-t border-dashed mt-0.5 pointer-events-none z-10 ${
                                                                    isDark ? 'border-slate-400/25' : 'border-slate-900/20'
                                                                }`}
                                                            />
                                                            <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-20">
                                                                <span
                                                                    className={`text-[8.5px] font-semibold px-2 py-[1px] -mt-[7px] rounded-[2px] border tracking-normal ${
                                                                        isDark
                                                                            ? 'bg-tactical-surface2 border-slate-400/20 text-slate-400'
                                                                            : 'bg-white border-slate-900/15 text-slate-500'
                                                                    }`}
                                                                >
                                                                    شروع روز
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* دکمه نصف کردن بازه */}
                                                    {block.id !== 'UNASSIGNED' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSplitBlock(block.originalId)}
                                                            title="نصف کردن این بازه"
                                                            aria-label="نصف کردن این بازه"
                                                            className={`absolute right-[-3px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 flex items-center justify-center rounded-[2px] z-10 transition-transform hover:scale-110 border ${
                                                                isDark
                                                                    ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 border-tactical-canvas'
                                                                    : 'bg-sky-600 hover:bg-sky-700 text-white border-white'
                                                            }`}
                                                        >
                                                            <PlusIcon className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}

                                                    {/* ناحیه رهاسازی آیتم‌ها (Droppable) */}
                                                    <Droppable droppableId={boundaryKey}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className={`mt-2 mb-0.5 min-h-[40px] rounded-[2px] border py-1 px-1 transition-colors duration-150 ${
                                                                    snapshot.isDraggingOver
                                                                        ? isDark
                                                                            ? 'bg-sky-400/15 border-sky-400 outline-dashed outline-1 outline-offset-1 outline-sky-400/70'
                                                                            : 'bg-sky-100/80 border-sky-600 outline-dashed outline-1 outline-offset-1 outline-sky-600/70'
                                                                        : `${block.theme.bg} ${block.theme.border}`
                                                                }`}
                                                            >
                                                                <div
                                                                    className={`flex justify-between items-center mb-1 pb-1 border-b ${
                                                                        isDark ? 'border-slate-400/15' : 'border-slate-900/10'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center min-w-0">
                                                                        {block.id !== 'UNASSIGNED' ? (
                                                                            <span
                                                                                onClick={() => handleEditTitle(block)}
                                                                                className={`text-[11px] font-bold cursor-pointer hover:underline flex items-center gap-1 tracking-normal truncate ${block.theme.text}`}
                                                                                title="ویرایش عنوان بازه"
                                                                            >
                                                                                <span className="truncate">{block.rawTitle}</span>
                                                                                <PencilSquareIcon className="w-3 h-3 opacity-65 shrink-0" />
                                                                            </span>
                                                                        ) : (
                                                                            <span
                                                                                className={`text-[11px] font-bold tracking-normal ${block.theme.text}`}
                                                                            >
                                                                                {block.rawTitle}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-1 shrink-0">
                                                                        {block.id === 'UNASSIGNED' && !isThisFormOpen && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    setQuickAddState({
                                                                                        isOpen: true,
                                                                                        date: day.apiDate,
                                                                                        timeBlockId: block.id,
                                                                                        title: '',
                                                                                        reminder_time: '',
                                                                                        difficulty: 'MEDIUM',
                                                                                    })
                                                                                }
                                                                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] text-[9.5px] font-semibold border tracking-normal transition-colors ${
                                                                                    isDark
                                                                                        ? 'bg-tactical-surface2 text-sky-300 hover:bg-tactical-hover border-sky-400/35'
                                                                                        : 'bg-white text-sky-700 hover:bg-sky-50 border-sky-600/35'
                                                                                }`}
                                                                            >
                                                                                <PlusIcon className="w-2.5 h-2.5" />
                                                                                <span>افزودن</span>
                                                                            </button>
                                                                        )}

                                                                        {block.id !== 'UNASSIGNED' && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteBlock(block.originalId)}
                                                                                className={`p-0.5 transition-colors ${
                                                                                    isDark
                                                                                        ? 'text-slate-500 hover:text-red-400'
                                                                                        : 'text-slate-400 hover:text-red-600'
                                                                                }`}
                                                                                title="حذف بازه زمانی"
                                                                                aria-label="حذف بازه زمانی"
                                                                            >
                                                                                <TrashIcon className="w-3 h-3" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {itemsInBlock.map((item, idx) =>
                                                                    renderDraggableItem(item, idx, isZoomed)
                                                                )}
                                                                {provided.placeholder}

                                                                {/* فرم افزودن سریع روتین */}
                                                                {isThisFormOpen && (
                                                                    <form
                                                                        onSubmit={handleQuickSubmit}
                                                                        className={`mt-1 p-1.5 rounded-[2px] border ${
                                                                            isDark
                                                                                ? 'bg-tactical-surface1 border-sky-400/50'
                                                                                : 'bg-white border-sky-600/50'
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            autoFocus
                                                                            type="text"
                                                                            placeholder="عنوان وظیفه..."
                                                                            value={quickAddState.title}
                                                                            onChange={(e) =>
                                                                                setQuickAddState({
                                                                                    ...quickAddState,
                                                                                    title: e.target.value,
                                                                                })
                                                                            }
                                                                            className={`w-full text-[11px] px-2 py-1 mb-1.5 rounded-[2px] border focus:outline-none tracking-normal ${
                                                                                isDark
                                                                                    ? 'bg-tactical-canvas border-slate-400/25 text-slate-100 placeholder-slate-500 focus:border-sky-400'
                                                                                    : 'bg-slate-50 border-slate-900/20 text-slate-900 placeholder-slate-400 focus:border-sky-600'
                                                                            }`}
                                                                        />
                                                                        <div className="grid grid-cols-3 items-center gap-1">
                                                                            <div className="flex items-center gap-1">
                                                                                <ClockIcon className="w-3 h-3 text-slate-500 shrink-0" />
                                                                                <input
                                                                                    type="time"
                                                                                    title="زمان یادآوری"
                                                                                    value={quickAddState.reminder_time}
                                                                                    onChange={(e) =>
                                                                                        setQuickAddState({
                                                                                            ...quickAddState,
                                                                                            reminder_time: e.target.value,
                                                                                        })
                                                                                    }
                                                                                    className={`w-full text-[9.5px] p-0.5 rounded-[2px] border dir-ltr ${
                                                                                        isDark
                                                                                            ? 'bg-tactical-canvas border-slate-400/25 text-slate-100'
                                                                                            : 'bg-slate-50 border-slate-900/20 text-slate-900'
                                                                                    }`}
                                                                                />
                                                                            </div>
                                                                            <select
                                                                                value={quickAddState.difficulty}
                                                                                onChange={(e) =>
                                                                                    setQuickAddState({
                                                                                        ...quickAddState,
                                                                                        difficulty: e.target.value,
                                                                                    })
                                                                                }
                                                                                className={`w-full text-[9.5px] p-0.5 rounded-[2px] border focus:outline-none tracking-normal ${
                                                                                    isDark
                                                                                        ? 'bg-tactical-canvas border-slate-400/25 text-slate-100'
                                                                                        : 'bg-slate-50 border-slate-900/20 text-slate-900'
                                                                                }`}
                                                                                title="درجه سختی (محاسبه زمان تخمینی)"
                                                                            >
                                                                                <option value="EASY">آسان</option>
                                                                                <option value="MEDIUM">متوسط</option>
                                                                                <option value="HARD">سخت</option>
                                                                                <option value="EXPERT">بسیار سخت</option>
                                                                            </select>
                                                                            <div className="flex justify-end gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        setQuickAddState({
                                                                                            isOpen: false,
                                                                                            date: null,
                                                                                            timeBlockId: null,
                                                                                            title: '',
                                                                                            reminder_time: '',
                                                                                            difficulty: 'MEDIUM',
                                                                                        })
                                                                                    }
                                                                                    className={`p-1 rounded-[2px] border transition-colors ${
                                                                                        isDark
                                                                                            ? 'border-slate-400/20 text-slate-400 hover:text-red-400 bg-tactical-surface2'
                                                                                            : 'border-slate-900/15 text-slate-500 hover:text-red-600 bg-slate-100'
                                                                                    }`}
                                                                                    aria-label="انصراف"
                                                                                >
                                                                                    <XMarkIcon className="w-3 h-3" />
                                                                                </button>
                                                                                <button
                                                                                    type="submit"
                                                                                    disabled={isQuickAdding}
                                                                                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-[2px] transition-colors disabled:opacity-50 tracking-normal ${
                                                                                        isDark
                                                                                            ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                                                                            : 'bg-sky-600 hover:bg-sky-700 text-white'
                                                                                    }`}
                                                                                >
                                                                                    {isQuickAdding ? '...' : 'ثبت'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </form>
                                                                )}

                                                                {itemsInBlock.length === 0 && !snapshot.isDraggingOver && (
                                                                    <div
                                                                        className={`text-center text-[9.5px] py-1.5 border border-dashed rounded-[2px] mt-0.5 font-medium tracking-normal ${
                                                                            isDark
                                                                                ? 'border-slate-400/20 bg-tactical-canvas/40 text-slate-500'
                                                                                : 'border-slate-900/15 bg-white/60 text-slate-400'
                                                                        }`}
                                                                    >
                                                                        کشیدن آیتم به اینجا
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Droppable>

                                                    {/* نشانگر ساعت پایان آخرین بازه */}
                                                    {index === columnBlocks.length - 1 && block.endTime && (
                                                        <div className="absolute right-[3px] -bottom-1.5 flex items-center gap-1 z-40">
                                                            <div
                                                                className={`w-2 h-2 rounded-[1px] ring-1 ${
                                                                    isDark ? 'ring-tactical-canvas' : 'ring-white'
                                                                } ${block.theme.dot} cursor-pointer hover:scale-125 transition-transform`}
                                                                onClick={() => handleManualTimeEdit(block, 'end_time')}
                                                                title="ویرایش ساعت پایان"
                                                            />
                                                            <span
                                                                dir="ltr"
                                                                onClick={() => handleManualTimeEdit(block, 'end_time')}
                                                                className={`text-[9.5px] font-bold tabular-nums cursor-pointer transition-colors ${
                                                                    isDark
                                                                        ? 'text-slate-300 hover:text-sky-400'
                                                                        : 'text-slate-700 hover:text-sky-700'
                                                                }`}
                                                            >
                                                                {toPersianDigits(block.endTime)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </DragDropContext>

            {/* نوار ناوبری هفتگی پایین */}
            <div className="flex w-full justify-center mb-1 mt-1 shrink-0">
                <div
                    className={`flex items-center rounded-[2px] p-0.5 border ${borderHairline} ${
                        isDark ? 'bg-tactical-surface1' : 'bg-white'
                    }`}
                >
                    <button
                        type="button"
                        onClick={() => {
                            const d = new Date(baseDate);
                            d.setDate(d.getDate() - 7);
                            setBaseDate(d);
                        }}
                        className={`h-7 w-8 inline-flex items-center justify-center rounded-[2px] transition-colors ${
                            isDark
                                ? 'hover:bg-tactical-hover text-slate-300 hover:text-sky-300'
                                : 'hover:bg-slate-100 text-slate-700 hover:text-sky-700'
                        }`}
                        title="هفته قبل"
                        aria-label="هفته قبل"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setBaseDate(new Date())}
                        disabled={isCurrentWeekDisplayed}
                        className={`h-7 text-xs font-semibold px-4 mx-1 rounded-[2px] tracking-normal transition-colors duration-150 ${
                            isCurrentWeekDisplayed
                                ? isDark
                                    ? 'bg-tactical-surface2 text-slate-400 border border-slate-400/15'
                                    : 'bg-slate-100 text-slate-500 border border-slate-900/10'
                                : isDark
                                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                    >
                        {isCurrentWeekDisplayed ? 'این هفته' : 'برگشت به این هفته'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const d = new Date(baseDate);
                            d.setDate(d.getDate() + 7);
                            setBaseDate(d);
                        }}
                        className={`h-7 w-8 inline-flex items-center justify-center rounded-[2px] transition-colors ${
                            isDark
                                ? 'hover:bg-tactical-hover text-slate-300 hover:text-sky-300'
                                : 'hover:bg-slate-100 text-slate-700 hover:text-sky-700'
                        }`}
                        title="هفته بعد"
                        aria-label="هفته بعد"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoutineListPage;