import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaSearch, FaTimes, FaCheck, FaGripVertical, FaUserCheck, FaFileAlt, FaUserFriends } from 'react-icons/fa';
import { fetchProjects } from '../../features/projects/projectSlice'; 

const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? parts[0][0] + parts[1][0]
        : parts[0]?.[0] || '?';
};

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
    'bg-red-500', 'bg-indigo-500',
];

export const Avatar = ({ emp, size = 'md' }) => {
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';
    const sz = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 sm:w-9 sm:h-9 text-xs';

    if (emp?.avatar_url) {
        return (
            <img
                src={emp.avatar_url}
                alt={emp.name}
                className={`${sz} rounded-full object-cover flex-shrink-0 border ${isDark ? 'border-slate-600' : 'border-gray-300'}`}
            />
        );
    }
    const color = AVATAR_COLORS[(emp?.user_id || 1) % AVATAR_COLORS.length];
    return (
        <div className={`${sz} ${color} rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm`}>
            {getInitials(emp?.name)}
        </div>
    );
};

export const AssigneeChip = ({ emp, onRemove }) => {
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    return (
        <div className={`flex items-center gap-1 border rounded-lg pl-1.5 pr-1 py-0.5 max-w-[140px] shadow-sm transition-all ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300'
        }`}>
            <Avatar emp={emp} size="sm" />
            <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {emp.name?.split(' ')[0]}
            </span>
            {onRemove && (
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemove(emp.user_id); }}
                    className={`p-0.5 rounded-full transition flex-shrink-0 mr-0.5 ${
                        isDark ? 'text-gray-400 hover:text-red-400 hover:bg-slate-700' : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                    }`}
                >
                    <FaTimes size={9} />
                </button>
            )}
        </div>
    );
};

const AssigneePickerPanel = ({ 
    subordinates = [], 
    loading = false, 
    selectedIds = [], 
    onChange, 
    activeStageName,
    activeStageDescription,
    onClose,
    onConfirm
}) => {
    const dispatch = useDispatch();
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';
    
    const userInfo = useSelector((state) => state.userLogin?.userInfo);
    const currentUserId = userInfo?.id;
    const projectsList = useSelector((state) => state.projects?.list || []);

    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');
    const [onlySelectedFilter, setOnlySelectedFilter] = useState(false);

    const firstSelectedRef = useRef(null);
    const scrollContainerRef = useRef(null);
   
    useEffect(() => {
        if (projectsList.length === 0) {
            dispatch(fetchProjects());
        }
    }, [dispatch, projectsList.length]);

    // 🌟 اسکرول خودکار به محل اولین فرد انتخاب‌شده به‌محض باز شدن پنل
    useEffect(() => {
        const timer = setTimeout(() => {
            if (firstSelectedRef.current) {
                firstSelectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [activeStageName]);

    const uniquePositions = useMemo(() => {
        const positions = subordinates.map(e => e.position_title).filter(Boolean);
        return [...new Set(positions)];
    }, [subordinates]);

    const filtered = useMemo(() => {
        return subordinates.filter(emp => {
            if (onlySelectedFilter && !selectedIds.includes(emp.user_id)) {
                return false;
            }
            const q = search.trim().toLowerCase();
            const matchesSearch = !q || 
                emp.name?.toLowerCase().includes(q) || 
                (emp.position_title || '').toLowerCase().includes(q);
            
            const matchesPosition = !selectedPosition || emp.position_title === selectedPosition;
            const matchesProject = !selectedProject || 
                (emp.active_project && emp.active_project.id === parseInt(selectedProject));

            return matchesSearch && matchesPosition && matchesProject;
        });
    }, [subordinates, search, selectedPosition, selectedProject, onlySelectedFilter, selectedIds]);

    const grouped = useMemo(() => filtered.reduce((acc, emp) => {
        const level = emp.hierarchy_level ?? 99;
        if (!acc[level]) acc[level] = [];
        acc[level].push(emp);
        return acc;
    }, {}), [filtered]);

    const toggle = (userId) => {
        onChange(
            selectedIds.includes(userId)
                ? selectedIds.filter(id => id !== userId)
                : [...selectedIds, userId]
        );
    };

    const handleDragStart = (e, userId) => {
        e.dataTransfer.setData('empId', userId.toString());
    };

    let firstSelectedAssigned = false;

    return (
        <div className={`h-full flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* هدر جمع‌وجور و تک‌خطی بدون فضای هدررفته */}
            <div className={`p-2.5 sm:p-3 border-b shrink-0 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-1.5">
                        <FaUserFriends className="text-purple-500" size={13} />
                        <h3 className={`font-bold text-xs sm:text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>انتخاب پرسنل</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                        {selectedIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setOnlySelectedFilter(v => !v)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                                    onlySelectedFilter
                                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                                        : 'bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/25'
                                }`}
                                title="فیلتر فقط انتخاب‌شده‌ها"
                            >
                                <FaCheck size={8} className="inline ml-1" />
                                {selectedIds.length} نفر انتخاب شده
                            </button>
                        )}
                        {onClose && (
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className={`p-1.5 rounded-lg text-gray-400 hover:text-red-400 transition-colors md:hidden ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                                title="بستن"
                            >
                                <FaTimes size={13} />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* 🌟 نوار فشرده مرحله جاری */}
                {activeStageName && (
                    <div className="bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-[10px] sm:text-[11px] font-medium px-2 py-1 rounded-lg mb-1.5 flex items-center justify-between gap-1">
                        <span className="truncate">
                            تخصیص به: <strong className="font-bold text-purple-400">{activeStageName}</strong>
                        </span>
                        <span className="shrink-0 text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.2 rounded font-bold">
                            مرحله جاری
                        </span>
                    </div>
                )}

                {/* ابزارهای جستجو و فیلترها در یک نگاه */}
                <div className="flex flex-col gap-1.5">
                    <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border w-full transition-all ${
                        isDark ? 'bg-slate-800/90 border-slate-700 focus-within:border-blue-500' : 'bg-gray-50 border-gray-300 focus-within:border-blue-500'
                    }`}>
                        <FaSearch className={`${isDark ? 'text-gray-400' : 'text-gray-500'} shrink-0`} size={11} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجوی نام یا سمت..."
                            className={`bg-transparent text-[11px] font-medium w-full outline-none ${
                                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                            }`}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-200 p-0.5">
                                <FaTimes size={9} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                        <select 
                            value={selectedProject} 
                            onChange={e => setSelectedProject(e.target.value)}
                            className={`w-full rounded-lg px-2 py-1 text-[10px] font-medium border outline-none truncate ${
                                isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'
                            }`}
                        >
                            <option value="">همه پروژه‌ها</option>
                            {projectsList.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedPosition} 
                            onChange={e => setSelectedPosition(e.target.value)}
                            className={`w-full rounded-lg px-2 py-1 text-[10px] font-medium border outline-none truncate ${
                                isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'
                            }`}
                        >
                            <option value="">همه سمت‌ها</option>
                            {uniquePositions.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* لیست اسکرول‌پذیر با نمایش پرسنل انتخاب‌شده در بالاترین بخش */}
            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600"
            >
                {/* 🌟 بخش اول: افراد انتخاب‌شده در بالاترین قسمت قرار دارند */}
                {selectedIds.length > 0 && !onlySelectedFilter && (
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-purple-950/25 border-purple-500/30' : 'bg-purple-50 border-purple-200'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-purple-400 flex items-center gap-1">
                                <FaCheck size={9} /> افراد انتخاب شده برای این مرحله ({selectedIds.length}):
                            </span>
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                className="text-[9px] text-red-400 hover:underline font-bold"
                            >
                                حذف همه
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {selectedIds.map(id => {
                                const emp = subordinates.find(e => e.user_id === id);
                                if (!emp) return null;
                                return (
                                    <AssigneeChip
                                        key={id}
                                        emp={emp}
                                        onRemove={() => toggle(id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className={`flex justify-center items-center h-40 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        در حال بارگیری پرسنل...
                    </div>
                ) : !Object.keys(grouped).length ? (
                    <div className={`flex flex-col justify-center items-center h-40 text-xs font-medium gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span>پرسنلی با این مشخصات یافت نشد</span>
                        {onlySelectedFilter && (
                            <button 
                                onClick={() => setOnlySelectedFilter(false)} 
                                className="text-[11px] text-purple-400 underline font-bold"
                            >
                                نمایش همه پرسنل
                            </button>
                        )}
                    </div>
                ) : (
                    Object.entries(grouped)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([level, emps]) => (
                            <div key={level}>
                                <div className={`inline-block px-2 py-0.5 mb-1 rounded text-[9px] font-bold ${
                                    isDark ? 'bg-slate-800 text-slate-300 border border-slate-700/60' : 'bg-gray-200 text-gray-700'
                                }`}>
                                    سطح سازمانی {level}
                                </div>
                                <div className="flex flex-col gap-1">
                                    {emps.map(emp => {
                                        const selected = selectedIds.includes(emp.user_id);
                                        const isMe = emp.user_id === currentUserId; 
                                        
                                        let itemRef = null;
                                        if (selected && !firstSelectedAssigned) {
                                            itemRef = firstSelectedRef;
                                            firstSelectedAssigned = true;
                                        }

                                        return (
                                            <div
                                                key={emp.user_id}
                                                ref={itemRef}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, emp.user_id)}
                                                onClick={() => toggle(emp.user_id)}
                                                className={`flex items-center gap-2 p-1.5 sm:p-2 w-full rounded-xl cursor-pointer active:scale-[0.99] transition-all border select-none ${
                                                    selected 
                                                        ? isDark ? 'bg-purple-900/40 border-purple-500 shadow-sm' : 'bg-purple-50 border-purple-500 shadow-sm'
                                                        : isDark ? 'border-slate-800/80 hover:bg-slate-800/80 bg-slate-900/40' : 'border-gray-200 hover:bg-gray-50 bg-white'
                                                }`}
                                            >
                                                <FaGripVertical className={`hidden sm:block shrink-0 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} size={10}/>
                                                <div className="relative shrink-0">
                                                    <Avatar emp={emp} size="md" />
                                                    {selected && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-purple-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white">
                                                            <FaCheck size={7} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-[11px] sm:text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{emp.name}</span>
                                                        {isMe && <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[8px] font-bold px-1 py-0.2 rounded border border-green-500/20">شما</span>}
                                                    </div>
                                                    {emp.position_title && (
                                                        <span className={`text-[9px] sm:text-[10px] font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{emp.position_title}</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                )}
            </div>

            {/* دکمه جمع‌وجور تک‌خطی برای تأیید در موبایل */}
            {(onConfirm || onClose) && (
                <div className={`p-2.5 border-t shrink-0 md:hidden ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <button
                        type="button"
                        onClick={onConfirm || onClose}
                        className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                    >
                        <FaCheck size={12} />
                        <span>تأیید و ذخیره ({selectedIds.length} نفر)</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AssigneePickerPanel;