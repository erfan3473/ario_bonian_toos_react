import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaSearch, FaTimes, FaCheck, FaGripVertical } from 'react-icons/fa';
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

    if (emp.avatar_url) {
        return (
            <img
                src={emp.avatar_url}
                alt={emp.name}
                className={`${sz} rounded-full object-cover flex-shrink-0 border-2 ${isDark ? 'border-slate-600' : 'border-gray-300'}`}
            />
        );
    }
    const color = AVATAR_COLORS[emp.user_id % AVATAR_COLORS.length];
    return (
        <div className={`${sz} ${color} rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white`}>
            {getInitials(emp.name)}
        </div>
    );
};

export const AssigneeChip = ({ emp, onRemove }) => {
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    return (
        <div className={`flex items-center gap-1.5 border rounded-sm pl-2 pr-1 py-1 max-w-[140px] ${
            isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-100 border-gray-300'
        }`}>
            <Avatar emp={emp} size="sm" />
            <span className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {emp.name.split(' ')[0]}
            </span>
            {onRemove && (
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemove(emp.user_id); }}
                    className={`transition flex-shrink-0 mr-0.5 ${
                        isDark ? 'text-gray-300 hover:text-red-400' : 'text-gray-600 hover:text-red-500'
                    }`}
                >
                    <FaTimes size={10} />
                </button>
            )}
        </div>
    );
};

const AssigneePickerPanel = ({ subordinates, loading, selectedIds, onChange, activeStageName }) => {
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

    const toggle = (userId) => onChange(
        selectedIds.includes(userId)
            ? selectedIds.filter(id => id !== userId)
            : [...selectedIds, userId]
    );

    const handleDragStart = (e, userId) => {
        e.dataTransfer.setData('empId', userId.toString());
    };

    return (
        <div className={`h-full flex flex-col ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <div className={`px-3 py-3 border-b shrink-0 ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>لیست پرسنل</h3>
                    <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>(انتخاب یا Drag)</span>
                </div>
                
                {activeStageName && (
                    <div className="bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-medium px-2 py-1 rounded-sm mb-2 truncate">
                        انتخاب برای: <span className="font-bold">{activeStageName}</span>
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <div className={`flex items-center gap-2 rounded-sm px-2.5 py-1.5 border w-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                        <FaSearch className={`${isDark ? 'text-gray-400' : 'text-gray-600'} flex-shrink-0`} size={10} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجو نام یا سمت..."
                            className={`bg-transparent text-xs font-medium w-full outline-none ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                        />
                    </div>

                    <div className="flex gap-1.5">
                        <select 
                            value={selectedProject} 
                            onChange={e => setSelectedProject(e.target.value)}
                            className={`flex-1 rounded-sm px-1.5 py-1 text-[10px] font-medium border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                        >
                            <option value="">همه پروژه‌ها</option>
                            {projectsList.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedPosition} 
                            onChange={e => setSelectedPosition(e.target.value)}
                            className={`flex-1 rounded-sm px-1.5 py-1 text-[10px] font-medium border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-900 border-gray-300'}`}
                        >
                            <option value="">همه سمت‌ها</option>
                            {uniquePositions.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                {loading ? (
                    <div className={`flex justify-center items-center h-full text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>در حال بارگیری...</div>
                ) : !Object.keys(grouped).length ? (
                    <div className={`flex justify-center items-center h-full text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>نتیجه‌ای یافت نشد</div>
                ) : (
                    Object.entries(grouped)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([level, emps]) => (
                            <div key={level} className="mb-4">
                                <div className={`inline-block px-2 py-1 mb-2 rounded-sm text-[10px] font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>
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
                                                className={`flex items-center gap-2.5 p-2 pr-2.5 w-full rounded-sm cursor-grab active:cursor-grabbing transition border shadow-sm ${
                                                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-300 hover:bg-gray-100'
                                                } ${
                                                    selected ? (isDark ? 'bg-blue-900/50 border-blue-500' : 'bg-blue-50 border-blue-500') : ''
                                                }`}
                                            >
                                                <FaGripVertical className={`flex-shrink-0 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} size={10}/>
                                                <div className="relative flex-shrink-0">
                                                    <Avatar emp={emp} size="sm" />
                                                    {selected && (
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 border border-white dark:border-slate-800 rounded-sm flex items-center justify-center text-white`}>
                                                            <FaCheck size={6} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{emp.name}</span>
                                                        {isMe && <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-[8px] font-bold px-1.5 rounded-sm border border-green-500/20">شما</span>}
                                                    </div>
                                                    {emp.position_title && (
                                                        <span className={`text-[10px] font-medium truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{emp.position_title}</span>
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
        </div>
    );
};

export default AssigneePickerPanel;
