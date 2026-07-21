import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
    fetchWeeklyPlannerRoutines, toggleRoutineItem, moveRoutineItem, 
    optimisticMoveItem, fetchUserTimeBlocks, splitUserTimeBlock, 
    updateTimeBlockBoundary, updateUserTimeBlock , deleteUserTimeBlock
} from '../features/routine/routineSlice';
import { 
    FaCheckCircle, FaRegCircle, FaClock, FaListAlt, FaChevronRight, 
    FaChevronLeft, FaPlus, FaChevronUp, FaChevronDown, FaEdit ,FaTrash
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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

const RoutineListPage = () => {
    const dispatch = useDispatch();
    const { weeklyRoutines = {}, timeBlocks = [], toggleLoadingId, error } = useSelector((state) => state.routine);
    const mode = useSelector((state) => state.theme?.mode || "dark");
    const isDark = mode === "dark";

    const [baseDate, setBaseDate] = useState(new Date());
    const [activeBoundary, setActiveBoundary] = useState(null); 

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

    const themes = useMemo(() => [
        { border: 'border-amber-400', bg: 'bg-amber-50/20 dark:bg-amber-950/20', line: 'border-amber-400/50', dot: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-300' },
        { border: 'border-blue-400', bg: 'bg-blue-50/20 dark:bg-blue-950/20', line: 'border-blue-400/50', dot: 'bg-blue-400', text: 'text-blue-700 dark:text-blue-300' },
        { border: 'border-purple-400', bg: 'bg-purple-50/20 dark:bg-purple-950/20', line: 'border-purple-400/50', dot: 'bg-purple-400', text: 'text-purple-700 dark:text-purple-300' },
        { border: 'border-emerald-400', bg: 'bg-emerald-50/20 dark:bg-emerald-950/20', line: 'border-emerald-400/50', dot: 'bg-emerald-400', text: 'text-emerald-700 dark:text-emerald-300' },
        { border: 'border-rose-400', bg: 'bg-rose-50/20 dark:bg-rose-950/20', line: 'border-rose-400/50', dot: 'bg-rose-400', text: 'text-rose-700 dark:text-rose-300' }
    ], []);

    useEffect(() => { dispatch(fetchUserTimeBlocks()); }, [dispatch]);

    useEffect(() => {
        if (weekDays.length > 0) {
            dispatch(fetchWeeklyPlannerRoutines({ startDate: weekDays[0].apiDate, endDate: weekDays[6].apiDate }));
        }
    }, [dispatch, weekDays]);

    useEffect(() => { if (error) toast.error(error); }, [error]);

    const handleSplitBlock = (blockId) => {
        dispatch(splitUserTimeBlock(blockId)).unwrap().catch(err => toast.error(err || 'خطا در نصف کردن بازه زمانی.'));
    };

    const handleEditTitle = (block) => {
        if (block.id === 'UNASSIGNED') return;
        const newTitle = window.prompt("عنوان جدید این بازه را وارد کنید:", block.rawTitle);
        if (newTitle && newTitle.trim() !== "" && newTitle !== block.rawTitle) {
            dispatch(updateUserTimeBlock({ id: block.originalId, title: newTitle.trim() }))
                .unwrap().catch(err => toast.error(err || "خطا در ویرایش عنوان."));
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
                })).unwrap().catch(err => toast.error(err || "خطا در آپدیت مرز زمان."));
            } else {
                dispatch(updateUserTimeBlock({ id: block.originalId, [field]: newTime }))
                    .unwrap().catch(err => toast.error(err || "خطا در آپدیت زمان."));
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
            toast.error(err || 'خطا در آپدیت زمان');
            dispatch(fetchUserTimeBlocks());
        });
    };

    const handleDeleteBlock = (blockId) => {
        if (window.confirm('آیا از حذف این بازه زمانی اطمینان دارید؟ آیتم‌های داخل آن به "منتظر برنامه‌ریزی" منتقل خواهند شد.')) {
            dispatch(deleteUserTimeBlock(blockId))
                .unwrap()
                .then(() => toast.success('بازه زمانی با موفقیت حذف شد.'))
                .catch(err => toast.error(err || 'خطا در حذف بازه زمانی.'));
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
                toast.error(err || "خطا در جابجایی آیتم.");
                dispatch(fetchWeeklyPlannerRoutines({ startDate: weekDays[0].apiDate, endDate: weekDays[6].apiDate }));
            });
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'CRITICAL': return 'bg-red-500';
            case 'HIGH': return 'bg-orange-500';
            case 'MEDIUM': return 'bg-blue-500';
            default: return 'bg-gray-400';
        }
    };

    const renderDraggableItem = (item, index) => {
        const { parentRoutine } = item;
        const urgency = parentRoutine.template_details?.urgency || 'NORMAL';
        
        return (
            <Draggable key={item.id} draggableId={`item-${item.id}`} index={index}>
                {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                        className={`mb-2 rounded-sm border shadow-sm flex flex-col ${snapshot.isDragging ? 'rotate-1 scale-[1.02] shadow-xl ring-1 ring-indigo-500 z-50' : ''} transition-all duration-200 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${item.is_done ? 'opacity-50 grayscale-[30%]' : ''}`}
                    >
                        <div className="flex relative overflow-hidden rounded-sm">
                            <div className={`w-1 shrink-0 ${getUrgencyColor(urgency)}`} />
                            <div className="p-2 w-full flex flex-col gap-1.5">
                                <div className={`text-[9px] font-bold inline-block px-1.5 py-0.5 rounded-sm w-fit ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                                    از روتین: {parentRoutine.title || parentRoutine.template_details?.title}
                                </div>
                                <div className="flex justify-between items-start gap-1 mt-1">
                                    <div onClick={() => !toggleLoadingId && dispatch(toggleRoutineItem(item.id))} className={`flex items-start gap-2 p-1 rounded-sm cursor-pointer w-full ${item.is_done ? (isDark ? 'bg-gray-900/50' : 'bg-gray-50') : (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50')}`}>
                                        <button disabled={toggleLoadingId === item.id} className="mt-0.5 shrink-0">
                                            {item.is_done ? <FaCheckCircle className="text-green-500 text-xs" /> : <FaRegCircle className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />}
                                        </button>
                                        <span className={`text-[11px] leading-tight font-medium ${item.is_done ? 'text-gray-400 line-through' : (isDark ? 'text-gray-200' : 'text-gray-800')}`}>{item.title}</span>
                                    </div>
                                    {parentRoutine.template_details?.reminder_time && (
                                        <div className="flex items-center gap-1 text-[9px] bg-indigo-50 text-indigo-600 dark:bg-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5 font-medium border border-indigo-100 dark:border-gray-600">
                                            <FaClock className="text-orange-400" />
                                            <span>{parentRoutine.template_details.reminder_time.substring(0, 5)}</span>
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
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 shrink-0 relative">
                <div className="flex w-full md:w-1/3 justify-start">
                    <h1 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}><FaListAlt className="text-indigo-500" /> برنامه‌ریز هفتگی</h1>
                </div>
                <div className="flex w-full md:w-1/3 justify-center">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-sm p-1 shadow-sm border dark:border-gray-700 border-gray-200">
                        <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate() - 7); setBaseDate(d); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"><FaChevronRight size={14} /></button>
                        <button onClick={() => setBaseDate(new Date())} className={`text-xs font-bold px-4 py-1 mx-1 rounded-sm ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} shadow-sm`}>این هفته</button>
                        <button onClick={() => { const d = new Date(baseDate); d.setDate(d.getDate() + 7); setBaseDate(d); }} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"><FaChevronLeft size={14} /></button>
                    </div>
                </div>
                <div className="flex w-full md:w-1/3 justify-end">
                    <Link to="/routines/templates" className={`flex items-center justify-center gap-2 px-4 py-2 rounded-sm font-semibold shadow-sm ${isDark ? 'bg-indigo-700 hover:bg-indigo-600 text-white' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'}`}>
                        <FaListAlt size={12} /> مدیریت الگوها
                    </Link>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex-1 overflow-x-auto no-scrollbar pb-2 select-none">
                    <div className="flex gap-3 min-w-max h-full items-start">
                        {weekDays.map((day) => {
                            const dayRoutines = weeklyRoutines[day.apiDate] || [];
                            
                            const filteredBlocks = timeBlocks.filter(b => b.day_of_week === day.dayIndex);
                            const columnBlocks = [
                                { 
                                    id: 'UNASSIGNED', originalId: null, rawTitle: 'منتظر برنامه‌ریزی', 
                                    startTime: null, endTime: null, 
                                    theme: { border: 'border-gray-400', bg: 'bg-gray-100/60 dark:bg-gray-800/40', line: 'border-gray-400/50', dot: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400' } 
                                },
                                ...filteredBlocks.map((b, i) => ({
                                    id: b.id.toString(), originalId: b.id, rawTitle: b.title,
                                    startTime: b.start_time.substring(0, 5), endTime: b.end_time.substring(0, 5),
                                    theme: themes[i % themes.length]
                                }))
                            ];
                            
                            return (
                                <div key={day.apiDate} className={`w-[300px] flex-shrink-0 flex flex-col h-full rounded-sm border ${day.isToday ? (isDark ? 'border-indigo-500 bg-gray-900' : 'border-indigo-400 bg-indigo-50/20') : (isDark ? 'border-gray-800 bg-gray-900/40' : 'border-gray-200 bg-gray-50')}`}>
                                    <div className={`p-3 text-center border-b ${day.isToday ? 'bg-indigo-600/10' : ''}`}>
                                        <h2 className={`font-bold ${day.isToday ? 'text-indigo-500' : ''}`}>{day.dayName}</h2>
                                        <span className="text-xs opacity-60">{day.dayNum}</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto no-scrollbar p-2 relative">
                                        {columnBlocks.map((block, index) => {
                                            const itemsInBlock = dayRoutines.flatMap(routine => {
                                                return (routine.items || [])
                                                    .filter(item => {
                                                        // ۱. استخراج امنِ آیدی بلاک (اگر از بک‌اند به صورت آبجکت nested آمده باشد)
                                                        const tb = item.time_block;
                                                        const tbId = tb ? (typeof tb === 'object' ? tb.id.toString() : tb.toString()) : 'UNASSIGNED';

                                                        if (block.id === 'UNASSIGNED') {
                                                            // ۲. اگر بلاک زمانیِ این آیتم در لیست بلاک‌های امروز نیست (دیتای نامعتبر یا مال روز دیگر)
                                                            // آن را در ستون "منتظر برنامه‌ریزی" نمایش بده تا گم نشود
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
                                                <div key={boundaryKey} className="relative pl-1 pr-6 flex flex-col">
                                                    
                                                    <div className={`absolute right-2 top-0 bottom-0 w-0.5 border-r-2 border-dashed ${block.theme.line}`} />
                                                    
                                                    {block.startTime && (
                                                        <div className="absolute right-[5px] -top-1 flex items-center gap-1.5 z-40">
                                                            
                                                            {index > 1 && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleShiftBoundary(columnBlocks[index-1], block, -15); }} 
                                                                    className={`absolute right-[-4px] bottom-3.5 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-600 p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 z-50 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-bottom ${isActive ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-50 translate-y-3 pointer-events-none'}`} 
                                                                    title="-۱۵ دقیقه">
                                                                    <FaChevronUp size={9}/>
                                                                </button>
                                                            )}
                                                            
                                                            <div 
                                                                title={index === 1 ? "ویرایش دستی زمان شروع روز" : "تنظیم زمان (کلیک کنید)"}
                                                                className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${block.theme.dot} cursor-pointer hover:scale-125 transition-transform relative z-50`} 
                                                                onClick={() => {
                                                                    if (index > 1) setActiveBoundary(isActive ? null : boundaryKey);
                                                                    else handleManualTimeEdit(block, 'start_time');
                                                                }}
                                                            />
                                                            
                                                            {index > 1 && (
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleShiftBoundary(columnBlocks[index-1], block, 15); }} 
                                                                    className={`absolute right-[-4px] top-3.5 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-600 p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-gray-700 z-50 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-top ${isActive ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-50 -translate-y-3 pointer-events-none'}`} 
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
                                                                className="text-[10px] font-mono font-bold opacity-80 z-40 cursor-pointer hover:text-indigo-500 transition-colors"
                                                            >
                                                                {block.startTime}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {index === 1 && (
                                                        <div className="absolute right-8 top-0 left-2 border-t-2 border-dashed border-gray-300 dark:border-gray-700 flex justify-center mt-0.5 opacity-50 pointer-events-none z-10">
                                                            <span className="text-[8px] bg-white dark:bg-gray-900 px-2 -mt-1.5 text-gray-400">شروع روز</span>
                                                        </div>
                                                    )}

                                                    {block.id !== 'UNASSIGNED' && (
                                                        <button onClick={() => handleSplitBlock(block.originalId)} title="نصف کردن این بازه"
                                                            className={`absolute right-[-4px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-400 text-white shadow-md z-10 transition-transform hover:scale-125 border border-white dark:border-gray-800`}
                                                        >
                                                            <FaPlus size={8} />
                                                        </button>
                                                    )}

                                                    <Droppable droppableId={boundaryKey}>
                                                        {(provided, snapshot) => (
                                                            <div ref={provided.innerRef} {...provided.droppableProps}
                                                                className={`mt-3 mb-1 min-h-[85px] rounded-sm border p-2.5 transition-all duration-200 ${block.theme.bg} ${snapshot.isDraggingOver ? 'bg-indigo-100 dark:bg-indigo-900/40 outline-dashed outline-2 outline-indigo-400 outline-offset-2' : 'border-gray-200 dark:border-gray-700/60'}`}
                                                            >
                                                                <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-black/5 dark:border-white/5">
                                                                    {block.id !== 'UNASSIGNED' ? (
                                                                        <>
                                                                            <span 
                                                                                onClick={() => handleEditTitle(block)}
                                                                                className={`text-[11px] font-extrabold cursor-pointer hover:underline flex items-center gap-1 ${block.theme.text}`}
                                                                                title="برای ویرایش عنوان کلیک کنید"
                                                                            >
                                                                                {block.rawTitle} <FaEdit className="opacity-50" size={10} />
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleDeleteBlock(block.originalId)}
                                                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                                                                title="حذف این بازه زمانی"
                                                                            >
                                                                                <FaTrash size={10} />
                                                                            </button>
                                                                        </>
                                                                    ) : (
                                                                        <span className={`text-[11px] font-extrabold ${block.theme.text}`}>{block.rawTitle}</span>
                                                                    )}
                                                                </div>

                                                                
                                                                {itemsInBlock.map((item, idx) => renderDraggableItem(item, idx))}
                                                                {provided.placeholder}
                                                                {itemsInBlock.length === 0 && !snapshot.isDraggingOver && (
                                                                    <div className="text-center text-[9px] opacity-40 py-2 border border-dashed border-gray-400/50 rounded-sm mt-1">کشیدن آیتم به اینجا</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Droppable>

                                                    {index < columnBlocks.length - 1 && block.id !== 'UNASSIGNED' && columnBlocks[index + 1].id !== 'UNASSIGNED' && (
                                                        <div className="relative flex items-center justify-center h-4 z-20">
                                                            <div className="absolute left-10 right-2 border-b-2 border-dashed border-gray-300/60 dark:border-gray-600/60" />
                                                        </div>
                                                    )}

                                                    {index === columnBlocks.length - 1 && block.endTime && (
                                                        <div className="absolute right-[5px] -bottom-2 flex items-center gap-1.5 z-40">
                                                            <div 
                                                                title="ویرایش دستی پایان روز"
                                                                className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 ${block.theme.dot} cursor-pointer hover:scale-125 transition-transform`} 
                                                                onClick={() => handleManualTimeEdit(block, 'end_time')}
                                                            />
                                                            <span 
                                                                title="برای تنظیم ساعت پایان آخرین بازه کلیک کنید"
                                                                onClick={() => handleManualTimeEdit(block, 'end_time')}
                                                                className="text-[10px] font-mono font-bold opacity-80 cursor-pointer hover:text-indigo-500 transition-colors"
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
        </div>
    );
};

export default RoutineListPage;
