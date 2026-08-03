import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchWeeklyPlannerRoutines, toggleRoutineItem, moveRoutineItem, 
    optimisticMoveItem, fetchUserTimeBlocks, splitUserTimeBlock, 
    updateTimeBlockBoundary, updateUserTimeBlock, deleteUserTimeBlock,
    fetchDifficultySettings, updateDifficultySettings, quickAddRoutine
} from '../features/routine/routineSlice';
import { 
    FaCheckCircle, FaRegCircle, FaClock, FaListAlt, FaChevronRight, 
    FaChevronLeft, FaPlus, FaChevronUp, FaChevronDown, FaEdit, FaTrash, FaCog, FaTimes, FaSave,
    FaHourglassHalf, FaCalendarCheck ,FaSpinner, FaExpand, FaCompress
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MonthlyRadar from '../components/routine/MonthlyRadar'; // 👈 ایمپورت کامپوننت جدید

// ---------------------------------------------------------
// توابع کمکی
// ---------------------------------------------------------
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
    'EASY': 'آسان', 'MEDIUM': 'متوسط', 'HARD': 'سخت', 'EXPERT': 'بسیار سخت'
};

// ---------------------------------------------------------
// کامپوننت اصلی بورد هفتگی
// ---------------------------------------------------------
const RoutineListPage = () => {
    const dispatch = useDispatch();
    const { weeklyRoutines = {}, timeBlocks = [], difficultySettings = [], toggleLoadingId, error } = useSelector((state) => state.routine);
    const mode = useSelector((state) => state.theme?.mode || "dark");
    const isDark = mode === "dark";

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

    const jalaliYear = useMemo(() => new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(baseDate), [baseDate]);
    const jalaliMonthName = useMemo(() => new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(baseDate), [baseDate]);

    const topScrollRef = useRef(null);
    const bottomScrollRef = useRef(null);
    const [scrollWidth, setScrollWidth] = useState(0);

    const [activeBoundary, setActiveBoundary] = useState(null); 
    const [zoomedDay, setZoomedDay] = useState(null); 
    
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickAddState, setQuickAddState] = useState({ isOpen: false, date: null, timeBlockId: null, title: '', reminder_time: '' });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState([]);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

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
            const apiDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            
            week.push({
                dateObj: d, apiDate: apiDate, dayName: dayNames[i],
                isToday: d.toDateString() === new Date().toDateString(),
                dayNum: new Intl.DateTimeFormat('fa-IR', { day: 'numeric', month: 'short' }).format(d),
                dayIndex: i
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
            const apiDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            days.push({
                dateObj: d,
                apiDate: apiDate,
                isToday: d.toDateString() === new Date().toDateString(),
                dayNum: new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(d),
                monthName: new Intl.DateTimeFormat('fa-IR', { month: 'short' }).format(d),
                isCurrentWeek: i >= 14 && i < 21 
            });
        }
        return days;
    }, [weekDays]);

    const themes = useMemo(() => [
        { border: 'border-amber-500', bg: isDark ? 'bg-[#242942]' : 'bg-amber-50', line: 'border-amber-500/80', dot: 'bg-amber-500', text: isDark ? 'text-amber-100' : 'text-amber-900' },
        { border: 'border-blue-500', bg: isDark ? 'bg-[#2d2945]' : 'bg-blue-50', line: 'border-blue-500/80', dot: 'bg-blue-500', text: isDark ? 'text-blue-100' : 'text-blue-900' },
        { border: 'border-purple-500', bg: isDark ? 'bg-[#21132b]' : 'bg-purple-50', line: 'border-purple-500/80', dot: 'bg-purple-500', text: isDark ? 'text-purple-100' : 'text-purple-900' },
        { border: 'border-emerald-500', bg: isDark ? 'bg-[#1a2b2b]' : 'bg-emerald-50', line: 'border-emerald-500/80', dot: 'bg-emerald-500', text: isDark ? 'text-emerald-100' : 'text-emerald-900' },
        { border: 'border-rose-500', bg: isDark ? 'bg-[#2b161c]' : 'bg-rose-50', line: 'border-rose-500/80', dot: 'bg-rose-500', text: isDark ? 'text-rose-100' : 'text-rose-900' }
    ], [isDark]);
    useEffect(() => { 
        dispatch(fetchUserTimeBlocks()); 
        dispatch(fetchDifficultySettings());
    }, [dispatch]);

    useEffect(() => {
        if (monthDays.length > 0) {
            dispatch(fetchWeeklyPlannerRoutines({ 
                startDate: monthDays[0].apiDate, 
                endDate: monthDays[monthDays.length - 1].apiDate 
            }));
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
            await dispatch(quickAddRoutine({
                title: quickAddState.title,
                date: quickAddState.date,
                time_block: quickAddState.timeBlockId === 'UNASSIGNED' ? null : quickAddState.timeBlockId,
                reminder_time: quickAddState.reminder_time || null
            })).unwrap();
            
            toast.success("آیتم جدید اضافه شد");
            setQuickAddState({ isOpen: false, date: null, timeBlockId: null, title: '', reminder_time: '' });
            dispatch(fetchWeeklyPlannerRoutines({ startDate: monthDays[0].apiDate, endDate: monthDays[monthDays.length - 1].apiDate }));
        } catch (err) {
            toast.error(getErrorMsg(err, "خطا در افزودن سریع روتین"));
        } finally {
            setIsQuickAdding(false);
        }
    };

    const openSettingsModal = () => {
        setSettingsForm(difficultySettings.map(s => ({...s})));
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
            await dispatch(updateDifficultySettings(settingsForm)).unwrap();
            toast.success("تنظیمات زمانی با موفقیت به‌روزرسانی شد.");
            setIsSettingsOpen(false);
        } catch (err) {
            toast.error(getErrorMsg(err, "خطا در ذخیره تنظیمات."));
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleSplitBlock = (blockId) => {
        dispatch(splitUserTimeBlock(blockId)).unwrap().catch(err => toast.error(getErrorMsg(err, 'خطا در نصف کردن بازه زمانی.')));
    };

    const handleEditTitle = (block) => {
        if (block.id === 'UNASSIGNED') return;
        const newTitle = window.prompt("عنوان جدید این بازه را وارد کنید:", block.rawTitle);
        if (newTitle && newTitle.trim() !== "" && newTitle !== block.rawTitle) {
            dispatch(updateUserTimeBlock({ id: block.originalId, title: newTitle.trim() }))
                .unwrap().catch(err => toast.error(getErrorMsg(err, "خطا در ویرایش عنوان.")));
        }
    };

    const handleManualTimeEdit = (block, field, isBoundary = false, upperBlock = null) => {
        const currentVal = field === 'start_time' ? block.startTime : block.endTime;
        const promptText = isBoundary 
            ? "ساعت جدید مرز را وارد کنید (مثال: 10:15):"
            : `ساعت ${field === 'start_time' ? 'شروع اولین بازه' : 'پایان آخرین بازه (ته زمان)'} را تنظیم کنید (مثال: 08:30):`;
            
        const newTime = window.prompt(promptText, currentVal);
        if (newTime && /^([01]\d|2[0-3]):([0-5]\d)$/.test(newTime)) {
            if (isBoundary && upperBlock) {
                dispatch(updateTimeBlockBoundary({
                    upperBlockId: upperBlock.originalId,
                    lowerBlockId: block.originalId,
                    newTime
                })).unwrap().catch(err => toast.error(getErrorMsg(err, "خطا در آپدیت مرز زمان.")));
            } else {
                dispatch(updateUserTimeBlock({ id: block.originalId, [field]: newTime }))
                    .unwrap().catch(err => toast.error(getErrorMsg(err, "خطا در آپدیت زمان.")));
            }
        } else if (newTime) {
            toast.error("فرمت زمان وارد شده نامعتبر است.");
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
        
        dispatch(updateTimeBlockBoundary({
            upperBlockId: upperBlock.originalId,
            lowerBlockId: lowerBlock.originalId,
            newTime
        })).unwrap().catch(err => {
            toast.error(getErrorMsg(err, 'خطا در آپدیت زمان'));
            dispatch(fetchUserTimeBlocks());
        });
    };

    const handleDeleteBlock = (blockId) => {
        if (window.confirm('آیا از حذف این بازه زمانی اطمینان دارید؟ آیتم‌های داخل آن به "منتظر برنامه‌ریزی" منتقل خواهند شد.')) {
            dispatch(deleteUserTimeBlock(blockId))
                .unwrap()
                .then(() => toast.success('بازه زمانی با موفقیت حذف شد.'))
                .catch(err => toast.error(getErrorMsg(err, 'خطا در حذف بازه زمانی.')));
        }
    };

    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const [srcDate, srcBlock] = source.droppableId.split('::');
        const [destDate, destBlock] = destination.droppableId.split('::');
        const itemId = parseInt(draggableId.replace('item-', ''));
        const timeBlockValue = destBlock === 'UNASSIGNED' ? null : parseInt(destBlock);

        dispatch(optimisticMoveItem({ itemId, sourceDate: srcDate, destDate, destBlock: timeBlockValue }));
        dispatch(moveRoutineItem({ itemId, date: destDate, time_block: timeBlockValue }))
            .unwrap().catch((err) => {
                toast.error(getErrorMsg(err, "خطا در جابجایی آیتم."));
                dispatch(fetchWeeklyPlannerRoutines({ startDate: monthDays[0].apiDate, endDate: monthDays[monthDays.length - 1].apiDate }));
            });
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'EXPERT': return 'bg-red-600';
            case 'HARD': return 'bg-orange-600';
            case 'MEDIUM': return 'bg-blue-600';
            case 'EASY': return 'bg-green-600';
            default: return 'bg-gray-500';
        }
    };

    const renderDraggableItem = (item, index, isZoomed = false) => {
        const { parentRoutine } = item;
        const difficulty = parentRoutine.template_details?.difficulty || parentRoutine.template_details?.urgency || 'MEDIUM';
        
        const diffSetting = difficultySettings.find(s => s.difficulty === difficulty);
        const estimatedMinutes = diffSetting ? diffSetting.estimated_minutes : 0;

        let completedTimeStr = null;
        if (item.is_done && item.completed_at) {
            const dateObj = new Date(item.completed_at);
            completedTimeStr = dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        }

        return (
            <Draggable key={item.id} draggableId={`item-${item.id}`} index={index}>
                {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                        className={`mb-2 rounded-sm border flex flex-col transition-all duration-200 ${snapshot.isDragging ? 'rotate-1 scale-[1.02] shadow-2xl ring-1 ring-indigo-500 z-[100]' : 'shadow-sm hover:shadow-md'} ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} ${item.is_done ? 'opacity-70' : ''}`}
                    >
                        <div className="flex relative overflow-hidden rounded-sm">
                            <div className={`shrink-0 transition-all ${isZoomed ? 'w-1.5' : 'w-1'} ${getUrgencyColor(difficulty)}`} />
                            
                            <div className={`w-full flex flex-col transition-all ${isZoomed ? 'p-3 gap-2' : 'p-2 gap-1.5'}`}>
                                
                                <div className="flex justify-between items-start gap-1">
                                    <div className={`font-bold inline-block px-1.5 py-0.5 rounded-sm w-fit truncate max-w-[75%] transition-all ${isZoomed ? 'text-[11px]' : 'text-[10px]'} ${isDark ? 'bg-indigo-900 text-indigo-100' : 'bg-indigo-100 text-indigo-900'}`} title={parentRoutine.title || parentRoutine.template_details?.title}>
                                        {parentRoutine.title || parentRoutine.template_details?.title}
                                    </div>
                                    
                                    {parentRoutine.template_details?.reminder_time && (
                                        <div className={`font-bold flex items-center gap-1 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded-sm shrink-0 border border-amber-200 dark:border-amber-800 transition-all ${isZoomed ? 'text-[11px]' : 'text-[10px]'}`}>
                                            <FaClock size={isZoomed ? 11 : 10} />
                                            <span className="mt-0.5 flex items-center gap-1"><span> یاداوری</span>
                                                <span className="font-mono">{parentRoutine.template_details.reminder_time.substring(0, 5)}</span>
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div 
                                    onClick={() => !toggleLoadingId && dispatch(toggleRoutineItem(item.id))} 
                                    className={`flex items-start px-1 py-0.5 -mx-1 rounded-sm cursor-pointer w-full group transition-colors ${isZoomed ? 'gap-2.5' : 'gap-2'} ${item.is_done ? '' : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                                >
                                    <button disabled={toggleLoadingId === item.id} className="mt-[2px] shrink-0 transition-transform group-hover:scale-110">
                                        {toggleLoadingId === item.id ? (
                                            <FaSpinner className={`text-indigo-600 dark:text-indigo-400 animate-spin ${isZoomed ? 'text-[16px]' : 'text-[14px]'}`} />
                                        ) : item.is_done ? (
                                            <FaCheckCircle className={`text-green-600 dark:text-green-500 ${isZoomed ? 'text-[16px]' : 'text-[14px]'}`} />
                                        ) : (
                                            <FaRegCircle className={`${isZoomed ? 'text-[16px]' : 'text-[14px]'} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                        )}
                                    </button>
                                    <span className={`leading-tight font-bold tracking-tight transition-all ${isZoomed ? 'text-[15px] md:text-[16px]' : 'text-[13px] md:text-[14px]'} ${item.is_done ? 'text-gray-500 line-through' : (isDark ? 'text-white' : 'text-gray-900')}`}>
                                        {item.title}
                                    </span>
                                </div>

                                <div className={`flex justify-between items-center border-t transition-all ${isZoomed ? 'mt-1 pt-2' : 'mt-0.5 pt-1.5'} ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <div className="flex-1">
                                        {item.is_done && completedTimeStr ? (
                                            <div className="flex items-center gap-1 text-green-700 dark:text-green-600 w-fit font-bold">
                                                <FaCalendarCheck size={isZoomed ? 11 : 10} />
                                                <span className={`transition-all ${isZoomed ? 'text-[11px]' : 'text-[10px]'}`}>
                                                    انجام: <span className="font-mono ml-0.5 font-bold">{completedTimeStr}</span>
                                                </span>
                                            </div>
                                        ) : (
                                            <span className={`font-bold transition-all ${isZoomed ? 'text-[11px]' : 'text-[10px]'} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                در انتظار اقدام
                                            </span>
                                        )}
                                    </div>

                                    {estimatedMinutes > 0 && (
                                        <div 
                                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm shadow-sm border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-800'}`}
                                            title="زمان تخمینی"
                                        >
                                            <FaHourglassHalf size={isZoomed ? 10 : 9} />
                                            <span className={`font-bold flex items-baseline gap-0.5 transition-all ${isZoomed ? 'text-[11px]' : 'text-[10px]'}`}>
                                                <span className="font-mono text-indigo-700 dark:text-indigo-600 font-extrabold">{estimatedMinutes}</span> 
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

    return (
        <div className="animate-fade-in p-2 md:p-4 max-w-[100vw] overflow-hidden flex flex-col h-[90vh]">
            
           

            {/* تیتر، رادار ماهانه و دکمه‌ها */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-2 gap-4 shrink-0 relative z-20">
                
                {/* ۱. سمت راست: تیتر */}
                <div className="flex shrink-0 justify-center md:justify-start">
                    <h1 className={`text-xl font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        <FaListAlt className="text-indigo-600 dark:text-indigo-500" /> کارتابل
                    </h1>
                </div>
                
                {/* ۲. وسط: رادار ماهانه */}
                {/* به این کانتینر ارتفاع ثابت میدیم که ساختار هدر حفظ بشه */}
                <div className="flex-1 w-full max-w-sm mx-auto relative h-[45px] z-[100]">
                    {/* این کانتینر شناور باعث میشه رادار روی بقیه عناصر باز بشه */}
                    <div className="absolute top-[-10px] left-0 right-0">
                        <MonthlyRadar 
                            monthDays={monthDays} 
                            weeklyRoutines={weeklyRoutines} 
                            setBaseDate={setBaseDate} 
                            isDark={isDark}
                            jalaliMonthName={jalaliMonthName} 
                        />
                    </div>
                </div>
                {/* ۳. سمت چپ: دکمه‌ها */}
                <div className="flex shrink-0 justify-center md:justify-end items-center gap-2">
                    <button 
                        onClick={openSettingsModal} 
                        className={`p-2 rounded-sm shadow-sm transition-colors border ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-600' : 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'}`}
                        title="تنظیمات زمان‌بندی درجات سختی"
                    >
                        <FaCog size={16} />
                    </button>
                    <Link to="/routines/templates" className={`flex items-center justify-center gap-2 px-3 md:px-4 py-1 rounded-sm font-extrabold shadow-md ${isDark ? 'bg-indigo-700 hover:bg-indigo-600 text-white border border-indigo-600' : 'bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700'}`}>
                        <FaListAlt size={12} /> <span className="hidden md:inline">مدیریت الگوها</span>
                    </Link>
                </div>
            </div>
            

            {/* 🌟 4. اسکرول‌بار بالایی */}
            <div 
                ref={topScrollRef}
                onScroll={handleTopScroll}
                className={`w-full overflow-x-scroll overflow-y-hidden mb-2 rounded-sm shrink-0 border shadow-inner ${isDark ? 'bg-gray-800 border-gray-700 custom-scrollbar-dark' : 'bg-gray-100 border-gray-300 custom-scrollbar'}`}
                style={{ height: '12px' }}
                title="اسکرول روزهای هفته"
            >
                <div style={{ width: scrollWidth, height: '1px' }}></div>
            </div>

            {/* مودال تنظیمات سختی */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 animate-fade-in">
                    <div className={`w-full max-w-md p-5 rounded-sm shadow-2xl border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-300 dark:border-gray-700">
                            <h2 className={`text-lg font-extrabold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <FaClock className="text-indigo-600 dark:text-indigo-500" /> تخصیص زمان به درجات سختی
                            </h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors p-1">
                                <FaTimes size={16} />
                            </button>
                        </div>
                        <div className="space-y-4 mb-6">
                            <p className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                مدت زمان تخمینی هر وظیفه را بر اساس درجه سختی آن (به دقیقه) تعیین کنید.
                            </p>
                            {settingsForm.map((setting, index) => (
                                <div key={setting.id} className={`flex items-center justify-between p-3 rounded-sm border shadow-sm ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${getUrgencyColor(setting.difficulty)}`} />
                                        <span className={`text-sm font-extrabold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                            {DIFFICULTY_LABELS[setting.difficulty] || setting.difficulty}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="number" 
                                            min="1" 
                                            value={setting.estimated_minutes} 
                                            onChange={(e) => handleSettingsChange(index, e.target.value)}
                                            className={`w-20 p-1.5 text-center text-sm font-bold rounded-sm border focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-400 text-gray-900 shadow-inner'}`}
                                        />
                                        <span className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>دقیقه</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsSettingsOpen(false)} disabled={isSavingSettings} className={`px-4 py-2 rounded-sm text-sm font-bold shadow-sm ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
                                انصراف
                            </button>
                            <button onClick={handleSaveSettings} disabled={isSavingSettings} className="px-5 py-2 rounded-sm text-sm font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md transition-colors disabled:opacity-70">
                                {isSavingSettings ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin" /> : <FaSave />}
                                ذخیره تغییرات
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🌟 5. بورد کارت‌های روزهای هفته (Drag and Drop) */}
            <DragDropContext onDragEnd={onDragEnd}>
                <div 
                    ref={bottomScrollRef}
                    onScroll={handleBottomScroll}
                    className="flex-1 overflow-x-auto no-scrollbar pb-2 select-none relative flex flex-col"
                >
                    {/* 👇 اینجا items-stretch اعمال شد */}
                    <div className="flex gap-3 min-w-max h-full items-stretch px-1 flex-1">
                        {weekDays.map((day) => {
                            const dayRoutines = weeklyRoutines[day.apiDate] || [];
                            
                            const filteredBlocks = timeBlocks.filter(b => b.day_of_week === day.dayIndex);
                            const columnBlocks = [
                                { 
                                    id: 'UNASSIGNED', originalId: null, rawTitle: 'منتظر برنامه‌ریزی', 
                                    startTime: null, endTime: null, 
                                    theme: { border: 'border-gray-400', bg: isDark ? 'bg-gray-900' : 'bg-gray-100', line: 'border-gray-500', dot: 'bg-gray-500', text: isDark ? 'text-gray-200' : 'text-gray-900' } 
                                },
                                ...filteredBlocks.map((b, i) => ({
                                    id: b.id.toString(), originalId: b.id, rawTitle: b.title,
                                    startTime: b.start_time.substring(0, 5), endTime: b.end_time.substring(0, 5),
                                    theme: themes[i % themes.length]
                                }))
                            ];
                            const isZoomed = zoomedDay === day.apiDate;
                            const isAnyZoomed = zoomedDay !== null;

                            // 👇 اینجا شفافیت‌ها از کارت‌ها برداشته شد
                            let colClass = `flex-shrink-0 flex flex-col h-full rounded-sm border transition-all duration-500 ease-out origin-top relative overflow-hidden shadow-sm `;
                            if (isZoomed) {
                                colClass += `w-[420px] md:w-[480px] shadow-2xl z-20 scale-[1.02] ring-2 ring-indigo-500 ${isDark ? 'bg-gray-800 border-indigo-500' : 'bg-white border-indigo-500'}`;
                            } else if (isAnyZoomed) {
                                colClass += `w-[260px] opacity-40 scale-[0.97] z-0 saturate-50 pointer-events-auto ${day.isToday ? (isDark ? 'border-indigo-600 bg-gray-900' : 'border-indigo-400 bg-indigo-50') : (isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-50')}`;
                            } else {
                                colClass += `w-[320px] z-10 ${day.isToday ? (isDark ? 'border-indigo-500 bg-gray-900' : 'border-amber-400 bg-amber-50') : (isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white')}`;
                            }

                            return (
                                <div key={day.apiDate} className={colClass}>
                                    
                                    {/* 🌟 روبان "امروز" */}
                                    {day.isToday && (
                                        <div className="absolute -top-1 -right-1 z-10 overflow-hidden w-16 h-16 pointer-events-none">
                                            <div className={`absolute top-3 -right-4 w-16 text-[9px] font-extrabold text-center text-white rotate-45 shadow-md ${isDark ? 'bg-amber-600' : 'bg-amber-500'}`}>
                                                امروز
                                            </div>
                                        </div>
                                    )}

                                    {/* 👇 اینجا هدر کارت‌ها هم تمام‌رنگ و بدون شفافیت شد */}
                                    <div className={`p-2 flex items-center justify-between border-b ${isDark ? 'border-gray-600' : 'border-gray-200'} transition-colors ${day.isToday ? (isDark ? 'bg-indigo-900' : 'bg-amber-100') : (isDark ? 'bg-gray-800' : 'bg-gray-50')} ${isZoomed ? 'bg-indigo-800 dark:bg-indigo-900' : ''}`}>
                                        <div className="w-8" />
                                        <div className="flex items-center gap-2">
                                            <h2 className={`font-extrabold transition-all ${isZoomed ? 'text-xl text-indigo-700 dark:text-indigo-300' : 'text-lg'} ${day.isToday && !isZoomed ? (isDark ? 'text-indigo-400' : 'text-amber-600') : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>
                                                {day.dayName}
                                            </h2> 
                                            <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
                                            <span className={`text-sm font-bold opacity-80 ${day.isToday ? (isDark ? 'text-indigo-500' : 'text-amber-700') : (isDark ? 'text-gray-400' : 'text-gray-600')}`}>
                                                {day.dayNum}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => setZoomedDay(isZoomed ? null : day.apiDate)}
                                            className={`w-8 h-8 flex justify-center items-center rounded-sm transition-all shadow-sm ${isZoomed ? 'bg-indigo-200 text-indigo-800 dark:bg-indigo-700 dark:text-indigo-100' : (isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300')}`}
                                            title={isZoomed ? "خروج از حالت زوم" : "بزرگنمایی و تمرکز روی این روز"}
                                        >
                                            {isZoomed ? <FaCompress size={14} /> : <FaExpand size={14} />}
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 relative">
                                        {columnBlocks.map((block, index) => {
                                            const itemsInBlock = dayRoutines.flatMap(routine => {
                                                return (routine.items || [])
                                                    .filter(item => {
                                                        const tb = item.time_block;
                                                        const tbId = tb ? (typeof tb === 'object' ? tb.id.toString() : tb.toString()) : 'UNASSIGNED';

                                                        if (block.id === 'UNASSIGNED') {
                                                            const isValidForThisDay = filteredBlocks.some(b => b.id.toString() === tbId);
                                                            return tbId === 'UNASSIGNED' || !isValidForThisDay;
                                                        } else {
                                                            return tbId === block.id;
                                                        }
                                                    })
                                                    .map(item => ({ ...item, parentRoutine: routine }));
                                            });

                                            const boundaryKey = `${day.apiDate}::${block.id}`;
                                            const isActive = activeBoundary === boundaryKey;

                                            return (
                                                <div key={boundaryKey} className="relative pl-1 pr-3 flex flex-col">
                                                    
                                                    <div className={`absolute right-0 top-0 bottom-0 w-0.5 border-r-2 border-dashed ${block.theme.line}`} />
                                                    
                                                    {block.startTime && (
                                                        <div className="absolute right-[2px] -top-1 flex items-center gap-1.5 z-40">
                                                            
                                                            {index > 1 && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleShiftBoundary(columnBlocks[index-1], block, -15); }} 
                                                                    className={`absolute right-[-4px] bottom-3.5 bg-white dark:bg-gray-800 rounded-sm shadow-md border border-gray-300 dark:border-gray-500 p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-600 z-50 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom ${isActive ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-50 translate-y-3 pointer-events-none'}`} 
                                                                    title="-۱۵ دقیقه">
                                                                    <FaChevronUp size={9}/>
                                                                </button>
                                                            )}
                                                            
                                                            <div 
                                                                title={index === 1 ? "ویرایش دستی زمان شروع روز" : "تنظیم زمان (کلیک کنید)"}
                                                                className={`w-2.5 h-2.5 rounded-sm ring-2 ring-white dark:ring-gray-900 ${block.theme.dot} cursor-pointer hover:scale-125 transition-transform relative z-50`} 
                                                                onClick={() => {
                                                                    if (index > 1) setActiveBoundary(isActive ? null : boundaryKey);
                                                                    else handleManualTimeEdit(block, 'start_time');
                                                                }}
                                                            />
                                                            
                                                            {index > 1 && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleShiftBoundary(columnBlocks[index-1], block, 15); }} 
                                                                    className={`absolute right-[-4px] top-3.5 bg-white dark:bg-gray-800 rounded-sm shadow-md border border-gray-300 dark:border-gray-500 p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-gray-600 z-50 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top ${isActive ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-50 -translate-y-3 pointer-events-none'}`} 
                                                                    title="+۱۵ دقیقه">
                                                                    <FaChevronDown size={9}/>
                                                                </button>
                                                            )}

                                                            <span 
                                                                title="برای ویرایش دقیق دستی کلیک کنید"
                                                                onClick={() => {
                                                                    if (index > 1) handleManualTimeEdit(block, 'start_time', true, columnBlocks[index-1]);
                                                                    else handleManualTimeEdit(block, 'start_time');
                                                                }}
                                                                className={`text-[11px] font-mono font-extrabold z-40 cursor-pointer hover:text-indigo-600 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                                                            >
                                                                {block.startTime}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {index === 1 && (
                                                        // فاصله رو از right-8 به right-[65px] تغییر دادیم تا فضای کافی برای ساعت خالی بمونه
                                                        <div className="absolute right-[65px] top-0 left-2 border-t-2 border-dashed border-gray-400 dark:border-gray-600 flex justify-center mt-0.5 pointer-events-none z-10">
                                                            {/* بک‌گراند متن رو هم به جای bg-gray-900 به bg-gray-800 تغییر دادم که با تم جدید یکی بشه */}
                                                            <span className={`text-[10px] font-bold px-2 -mt-[11px] shadow-sm rounded-sm ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'}`}>شروع روز</span>
                                                        </div>
                                                    )}

                                                    {block.id !== 'UNASSIGNED' && (
                                                        <button onClick={() => handleSplitBlock(block.originalId)} title="نصف کردن این بازه"
                                                            className={`absolute right-[-4px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] flex items-center justify-center rounded-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-md z-10 transition-transform hover:scale-125 border border-white dark:border-gray-700`}
                                                        >
                                                            <FaPlus size={8} />
                                                        </button>
                                                    )}

                                                    {/* 👇 اینجا هاله شفافِ فضاهای درگ هم حذف شد */}
                                                    <Droppable droppableId={boundaryKey}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.droppableProps}
                                                                className={`mt-4 mb-2 min-h-[95px] rounded-sm border shadow-sm p-1.5 transition-all duration-200 ${snapshot.isDraggingOver ? (isDark ? 'bg-indigo-900/80 border-indigo-500 outline-dashed outline-2 outline-offset-2 outline-indigo-500' : 'bg-indigo-100 border-indigo-400 outline-dashed outline-2 outline-offset-2 outline-indigo-400') : (`${block.theme.bg} ${isDark ? 'border-gray-700' : 'border-gray-300'}`)}`}
                                                            >
                                                                <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/10 dark:border-white/10">
                                                                    {block.id !== 'UNASSIGNED' ? (
                                                                        <>
                                                                            <span 
                                                                                onClick={() => handleEditTitle(block)}
                                                                                className={`text-sm font-extrabold cursor-pointer hover:underline flex items-center gap-1 ${block.theme.text}`}
                                                                                title="برای ویرایش عنوان کلیک کنید"
                                                                            >
                                                                                {block.rawTitle} <FaEdit className="opacity-70" size={14} />
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleDeleteBlock(block.originalId)}
                                                                                className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors p-1"
                                                                                title="حذف این بازه زمانی"
                                                                            >
                                                                                <FaTrash size={14} />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <span className={`text-sm font-extrabold ${block.theme.text}`}>{block.rawTitle}</span>
                                                                    )}
                                                                </div>

                                                                {itemsInBlock.map((item, idx) => renderDraggableItem(item, idx, isZoomed))}
                                                                {provided.placeholder}
                                                                
                                                                {/* دکمه افزودن سریع */}
                                                                {!quickAddState.isOpen && (
                                                                    <button 
                                                                        onClick={() => setQuickAddState({ isOpen: true, date: day.apiDate, timeBlockId: block.id, title: '', reminder_time: '' })}
                                                                        className={`w-full mt-2 py-1.5 rounded-sm border border-dashed flex items-center justify-center gap-1 text-[11px] font-bold transition-colors opacity-60 hover:opacity-100${isDark ? 'border-gray-600 bg-gray-800/50 text-gray-400 hover:bg-gray-700 hover:text-white' : 'border-gray-400 bg-white/50 text-gray-700 hover:bg-white hover:shadow-sm'}`}
                                                                    >
                                                                        <FaPlus size={10} /> افزودن سریع
                                                                    </button>
                                                                )}

                                                                {/* فرم مینیاتوری افزودن سریع */}
                                                                {quickAddState.isOpen && quickAddState.date === day.apiDate && quickAddState.timeBlockId === block.id && (
                                                                    <form onSubmit={handleQuickSubmit} className={`mt-2 p-2 rounded-sm shadow-md border ${isDark ? 'bg-gray-900 border-indigo-500/50' : 'bg-white border-indigo-400'}`}>
                                                                        <input 
                                                                            autoFocus
                                                                            type="text" 
                                                                            placeholder="عنوان روتین..." 
                                                                            value={quickAddState.title}
                                                                            onChange={(e) => setQuickAddState({...quickAddState, title: e.target.value})}
                                                                            className={`w-full text-xs p-1.5 mb-2 rounded-sm border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-inner'}`}
                                                                        />
                                                                        <div className="flex justify-between items-center gap-2">
                                                                            <div className="flex items-center flex-1 gap-1">
                                                                                <FaClock className="text-gray-500 shrink-0" size={10} />
                                                                                <input 
                                                                                    type="time" 
                                                                                    title="ساعت یادآوری (اختیاری)"
                                                                                    value={quickAddState.reminder_time}
                                                                                    onChange={(e) => setQuickAddState({...quickAddState, reminder_time: e.target.value})}
                                                                                    className={`w-full text-[10px] p-1 rounded-sm border dir-ltr ${isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900 shadow-inner'}`}
                                                                           ></input> </div>
                                                                            <div className="flex gap-1 shrink-0">
                                                                                <button type="button" onClick={() => setQuickAddState({ isOpen: false, date: null, timeBlockId: null, title: '', reminder_time: '' })} className={`p-1.5 rounded-sm shadow-sm ${isDark ? 'text-gray-400 hover:text-red-400 bg-gray-700' : 'text-gray-600 hover:text-red-600 bg-gray-200 hover:bg-gray-300'}`}>
                                                                                    <FaTimes size={10} />
                                                                                </button>
                                                                                <button type="submit" disabled={isQuickAdding} className="px-2 py-1 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm shadow-sm disabled:opacity-50 transition-colors">
                                                                                    {isQuickAdding ? '...' : 'ثبت'}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </form>
                                                                )}
                                                                {itemsInBlock.length === 0 && !snapshot.isDraggingOver && (
                                                                    <div className={`text-center text-[11px] py-3 border border-dashed rounded-sm mt-1 font-bold ${isDark ? 'border-gray-600 bg-gray-800/30 text-gray-400' : 'border-gray-300 bg-gray-50 text-gray-400'}`}>
                                                                        کشیدن آیتم به اینجا
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Droppable>

                                                    {index < columnBlocks.length - 1 && block.id !== 'UNASSIGNED' && columnBlocks[index + 1].id !== 'UNASSIGNED' && (
                                                        <div className="relative flex items-center justify-center h-4 z-20">
                                                            <div className="absolute left-10 right-2 border-b-2 border-dashed border-gray-400 dark:border-gray-600" />
                                                        </div>
                                                    )}

                                                    {index === columnBlocks.length - 1 && block.endTime && (
                                                        <div className="absolute right-[5px] -bottom-2 flex items-center gap-1.5 z-40">
                                                            <div 
                                                                title="ویرایش دستی پایان روز"
                                                                className={`w-2.5 h-2.5 rounded-sm ring-2 ring-white dark:ring-gray-900 ${block.theme.dot} cursor-pointer hover:scale-125 transition-transform`} 
                                                                onClick={() => handleManualTimeEdit(block, 'end_time')}
                                                            />
                                                            <span 
                                                                title="برای تنظیم ساعت پایان آخرین بازه کلیک کنید"
                                                                onClick={() => handleManualTimeEdit(block, 'end_time')}
                                                                className={`text-[11px] font-mono font-extrabold cursor-pointer hover:text-indigo-600 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-800'}`}
                                                            >
                                                                {block.endTime}
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
            {/* 🌟 3. کنترلر هفته */}
            <div className="flex w-full justify-center mb-1 mt-3 shrink-0">
                <div className={`flex items-center rounded-sm p-1 shadow-sm border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                    <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); }} className={`p-2 rounded-sm transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}><FaChevronRight size={14} /></button>
                    <button onClick={() => setBaseDate(new Date())} className={`text-sm font-extrabold px-6 py-1.5 mx-1 rounded-sm shadow-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'}`}>این هفته</button>
                    <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); }} className={`p-2 rounded-sm transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}><FaChevronLeft size={14} /></button>
                </div>
            </div>
        </div>
    );
};

export default RoutineListPage;