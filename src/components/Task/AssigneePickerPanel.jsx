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
    const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';

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
        <div className={`flex items-center gap-1.5 border rounded-full pl-2 pr-1 py-1 max-w-[130px] ${
            isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-100 border-gray-300'
        }`}>
            <Avatar emp={emp} size="sm" />
            <span className={`text-xs truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {emp.name.split(' ')[0]}
            </span>
            {onRemove && (
                <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onRemove(emp.user_id); }}
                    className={`transition flex-shrink-0 mr-0.5 ${
                        isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
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
    
    // دریافت اطلاعات کاربر فعلی برای نمایش برچسب "شما"
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
            <div className={`px-4 py-4 border-b shrink-0 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                <h3 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    لیست پرسنل
                </h3>
                <p className="text-[10px] text-gray-500 mb-3">(بکشید و در مراحل رها کنید یا کلیک کنید)</p>
                
                {activeStageName && (
                    <div className="bg-blue-500/10 border border-blue-500/30 text-blue-500 text-[11px] font-medium px-2 py-1.5 rounded-lg mb-3">
                        انتخاب برای: {activeStageName}
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border w-full ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                        <FaSearch className={`${isDark ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`} size={12} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجو نام یا سمت..."
                            className={`bg-transparent text-sm w-full outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                        />
                    </div>

                    <div className="flex gap-2">
                        <select 
                            value={selectedProject} 
                            onChange={e => setSelectedProject(e.target.value)}
                            className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-700 border-gray-300'}`}
                        >
                            <option value="">همه پروژه‌ها</option>
                            {projectsList.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedPosition} 
                            onChange={e => setSelectedPosition(e.target.value)}
                            className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] border outline-none ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-gray-50 text-gray-700 border-gray-300'}`}
                        >
                            <option value="">همه سمت‌ها</option>
                            {uniquePositions.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
                {loading ? (
                    <div className={`flex justify-center items-center h-full text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>در حال بارگیری...</div>
                ) : !Object.keys(grouped).length ? (
                    <div className={`flex justify-center items-center h-full text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>نتیجه‌ای یافت نشد</div>
                ) : (
                    Object.entries(grouped)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([level, emps]) => (
                            <div key={level} className="mb-5">
                                <div className={`inline-block px-3 py-1 mb-2 rounded-lg text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                                    سطح سازمانی {level}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {emps.map(emp => {
                                        const selected = selectedIds.includes(emp.user_id);
                                        const isMe = emp.user_id === currentUserId; // بررسی کاربر فعلی
                                        
                                        return (
                                            <div
                                                key={emp.user_id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, emp.user_id)}
                                                onClick={() => toggle(emp.user_id)}
                                                className={`flex items-center gap-3 p-2 pr-3 w-full rounded-xl cursor-grab active:cursor-grabbing transition border shadow-sm ${
                                                    isDark ? 'border-slate-700 hover:bg-slate-800' : 'border-gray-200 hover:bg-gray-50'
                                                } ${
                                                    selected ? (isDark ? 'bg-blue-900/30 border-blue-500' : 'bg-blue-50 border-blue-400') : ''
                                                }`}
                                            >
                                                <FaGripVertical className={`flex-shrink-0 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} size={10}/>
                                                <div className="relative flex-shrink-0">
                                                    <Avatar emp={emp} size="sm" />
                                                    {selected && (
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border-2 ${isDark ? 'border-slate-900' : 'border-white'}`}>
                                                            <FaCheck size={7} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-xs font-semibold truncate flex items-center gap-1.5 ${selected ? 'text-blue-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                                                        {emp.name}
                                                        {isMe && (
                                                            <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded text-[9px] border border-blue-500/20">
                                                                شما
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`text-[10px] truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {emp.position_title || 'بدون سمت'}
                                                        {emp.active_project?.name && (
                                                            <span className="mr-1 opacity-80">
                                                                • {emp.active_project.name}
                                                            </span>
                                                        )}
                                                    </div>
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