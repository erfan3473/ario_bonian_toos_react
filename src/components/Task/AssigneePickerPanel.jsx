import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaSearch, FaTimes, FaCheck, FaGripVertical, FaUserCheck } from 'react-icons/fa';
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
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

    if (emp?.avatar_url) {
        return (
            <img
                src={emp.avatar_url}
                alt={emp.name}
                className={`${sz} rounded-full object-cover flex-shrink-0 border-2 ${isDark ? 'border-slate-600' : 'border-gray-300'}`}
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
        <div className={`flex items-center gap-1.5 border rounded-lg pl-2 pr-1 py-1 max-w-[150px] shadow-sm transition-all ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-100 border-gray-300'
        }`}>
            <Avatar emp={emp} size="sm" />
            <span className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {emp.name.split(' ')[0]}
            </span>
            {onRemove && (
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemove(emp.user_id); }}
                    className={`p-1 rounded-full transition flex-shrink-0 mr-0.5 ${
                        isDark ? 'text-gray-400 hover:text-red-400 hover:bg-slate-700' : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                    }`}
                >
                    <FaTimes size={10} />
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
   
    useEffect(() => {
        if (projectsList.length === 0) {
            dispatch(fetchProjects());
        }
    }, [dispatch, projectsList.length]);

    const uniquePositions = useMemo(() => {
        const positions = subordinates.map(e => e.position_title).filter(Boolean);
        return [...new Set(positions)];
    }, [subordinates]);

    const filtered = useMemo(() => {
        return subordinates.filter(emp => {
            const q = search.trim().toLowerCase();
            const matchesSearch = !q || 
                emp.name.toLowerCase().includes(q) || 
                (emp.position_title || '').toLowerCase().includes(q);
            
            const matchesPosition = !selectedPosition || emp.position_title === selectedPosition;
            const matchesProject = !selectedProject || 
                (emp.active_project && emp.active_project.id === parseInt(selectedProject));

            return matchesSearch && matchesPosition && matchesProject;
        });
    }, [subordinates, search, selectedPosition, selectedProject]);

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

    return (
        <div className={`h-full flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            {/* هدر پنل پرسنل */}
            <div className={`p-3.5 border-b shrink-0 ${isDark ? 'border-slate-700/80 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>لیست پرسنل</h3>
                        <span className="hidden sm:inline text-[10px] text-gray-400 font-normal">(انتخاب یا Drag)</span>
                    </div>
                    {selectedIds.length > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
                            <FaUserCheck size={11} />
                            {selectedIds.length} نفر انتخاب شده
                        </span>
                    )}
                </div>
                
                {activeStageName && (
                    <div className="bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-medium px-2.5 py-1.5 rounded-lg mb-2.5 truncate">
                        تخصیص به: <span className="font-bold">{activeStageName}</span>
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border w-full transition-all ${
                        isDark ? 'bg-slate-800/90 border-slate-700 focus-within:border-blue-500' : 'bg-gray-50 border-gray-300 focus-within:border-blue-500'
                    }`}>
                        <FaSearch className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`} size={12} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجو بر اساس نام یا سمت..."
                            className={`bg-transparent text-xs font-medium w-full outline-none ${
                                isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                            }`}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-200 p-0.5">
                                <FaTimes size={10} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <select 
                            value={selectedProject} 
                            onChange={e => setSelectedProject(e.target.value)}
                            className={`w-full rounded-lg px-2 py-1.5 text-[11px] font-medium border outline-none truncate ${
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
                            className={`w-full rounded-lg px-2 py-1.5 text-[11px] font-medium border outline-none truncate ${
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

            {/* لیست اسکرول‌پذیر پرسنل */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-600">
                {loading ? (
                    <div className={`flex justify-center items-center h-40 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        در حال بارگیری لیست پرسنل...
                    </div>
                ) : !Object.keys(grouped).length ? (
                    <div className={`flex justify-center items-center h-40 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        پرسنلی با این مشخصات یافت نشد
                    </div>
                ) : (
                    Object.entries(grouped)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([level, emps]) => (
                            <div key={level}>
                                <div className={`inline-block px-2.5 py-1 mb-2 rounded-md text-[10px] font-bold ${
                                    isDark ? 'bg-slate-800 text-slate-300 border border-slate-700/60' : 'bg-gray-200 text-gray-700'
                                }`}>
                                    سطح سازمانی {level}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    {emps.map(emp => {
                                        const selected = selectedIds.includes(emp.user_id);
                                        const isMe = emp.user_id === currentUserId; 
                                        
                                        return (
                                            <div
                                                key={emp.user_id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, emp.user_id)}
                                                onClick={() => toggle(emp.user_id)}
                                                className={`flex items-center gap-3 p-2.5 w-full rounded-xl cursor-pointer active:scale-[0.99] transition-all border select-none ${
                                                    selected 
                                                        ? isDark ? 'bg-blue-900/40 border-blue-500 shadow-sm' : 'bg-blue-50 border-blue-500 shadow-sm'
                                                        : isDark ? 'border-slate-800 hover:bg-slate-800/80 bg-slate-900/50' : 'border-gray-200 hover:bg-gray-50 bg-white'
                                                }`}
                                            >
                                                <FaGripVertical className={`hidden sm:block flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} size={12}/>
                                                <div className="relative flex-shrink-0">
                                                    <Avatar emp={emp} size="md" />
                                                    {selected && (
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-white">
                                                            <FaCheck size={8} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{emp.name}</span>
                                                        {isMe && <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-green-500/20">شما</span>}
                                                    </div>
                                                    {emp.position_title && (
                                                        <span className={`text-[10px] font-medium truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{emp.position_title}</span>
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

            {/* دکمه اختصاصی چسبان در پایین برای موبایل */}
            {(onConfirm || onClose) && (
                <div className={`p-3 border-t shrink-0 sm:hidden ${isDark ? 'border-slate-800 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <button
                        type="button"
                        onClick={onConfirm || onClose}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <FaCheck size={14} />
                        <span>تایید و بازگشت به فرم {selectedIds.length > 0 ? `(${selectedIds.length} نفر)` : ''}</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AssigneePickerPanel;