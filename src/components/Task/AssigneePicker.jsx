// src/components/Task/AssigneePicker.jsx

import React, { useState, useMemo } from 'react';
import { FaSearch, FaTimes, FaCheck, FaUserCircle } from 'react-icons/fa';

// نمایش حرف اول نام برای avatar پیش‌فرض
const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return parts[0][0] + parts[1][0];
    return parts[0]?.[0] || '?';
};

// رنگ‌های متنوع برای avatar بدون عکس
const AVATAR_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
    'bg-red-500', 'bg-indigo-500',
];
const getAvatarColor = (userId) => AVATAR_COLORS[userId % AVATAR_COLORS.length];

// ─── Avatar کوچک ───
const Avatar = ({ emp, size = 'md' }) => {
    const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';
    if (emp.avatar_url) {
        return (
            <img
                src={emp.avatar_url}
                alt={emp.name}
                className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2 border-gray-600`}
            />
        );
    }
    return (
        <div className={`${sizeClass} rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white ${getAvatarColor(emp.user_id)}`}>
            {getInitials(emp.name)}
        </div>
    );
};

// ─── چیپ کوچک کنار دکمه ───
const AssigneeChip = ({ emp, onRemove }) => (
    <div className="flex items-center gap-1.5 bg-gray-700 border border-gray-600 rounded-full pl-2 pr-1 py-1">
        <Avatar emp={emp} size="sm" />
        <span className="text-white text-xs">{emp.name.split(' ')[0]}</span>
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(emp.user_id); }}
            className="text-gray-400 hover:text-red-400 transition mr-0.5"
        >
            <FaTimes size={10} />
        </button>
    </div>
);

// ─── کامپوننت اصلی ───
const AssigneePicker = ({ subordinates, selectedIds, onChange, loading }) => {
    const [open, setOpen]       = useState(false);
    const [search, setSearch]   = useState('');

    const selectedEmps = subordinates.filter(e => selectedIds.includes(e.user_id));

    const filtered = useMemo(() => {
        if (!search.trim()) return subordinates;
        const q = search.trim().toLowerCase();
        return subordinates.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.position_title.toLowerCase().includes(q)
        );
    }, [subordinates, search]);

    // گروه‌بندی بر اساس hierarchy_level
    const grouped = useMemo(() => {
        return filtered.reduce((acc, emp) => {
            const level = emp.hierarchy_level ?? 99;
            if (!acc[level]) acc[level] = [];
            acc[level].push(emp);
            return acc;
        }, {});
    }, [filtered]);

    const toggle = (userId) => {
        onChange(
            selectedIds.includes(userId)
                ? selectedIds.filter(id => id !== userId)
                : [...selectedIds, userId]
        );
    };

    const removeOne = (userId) => onChange(selectedIds.filter(id => id !== userId));

    return (
        <div className="relative">
            <label className="block text-gray-300 text-sm mb-2">
                مسئولان *{' '}
                {selectedIds.length > 0 && (
                    <span className="text-blue-400">({selectedIds.length} نفر)</span>
                )}
            </label>

            {/* ── باکس انتخاب‌شده‌ها + دکمه باز کردن ── */}
            <div
                onClick={() => !loading && setOpen(true)}
                className={`min-h-[44px] w-full bg-gray-700 border rounded-xl px-3 py-2 cursor-pointer transition flex flex-wrap gap-1.5 items-center ${
                    open ? 'border-blue-500' : 'border-gray-600 hover:border-gray-500'
                }`}
            >
                {loading ? (
                    <span className="text-gray-400 text-sm">در حال بارگیری...</span>
                ) : selectedEmps.length === 0 ? (
                    <span className="text-gray-500 text-sm">کلیک کنید تا انتخاب کنید...</span>
                ) : (
                    selectedEmps.map(emp => (
                        <AssigneeChip key={emp.user_id} emp={emp} onRemove={removeOne} />
                    ))
                )}
            </div>

            {/* ── Dropdown Panel ── */}
            {open && (
                <>
                    {/* overlay */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => { setOpen(false); setSearch(''); }}
                    />

                    <div className="absolute z-50 top-full mt-2 w-full bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl overflow-hidden">

                        {/* سرچ */}
                        <div className="p-3 border-b border-gray-700">
                            <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                                <FaSearch className="text-gray-400 flex-shrink-0" size={13} />
                                <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="جستجو بر اساس نام یا سمت..."
                                    className="bg-transparent text-white text-sm flex-1 outline-none placeholder-gray-500"
                                />
                                {search && (
                                    <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white">
                                        <FaTimes size={12} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* لیست */}
                        <div className="max-h-64 overflow-y-auto">
                            {Object.keys(grouped).length === 0 ? (
                                <div className="text-center text-gray-500 text-sm py-6">
                                    نتیجه‌ای یافت نشد
                                </div>
                            ) : (
                                Object.entries(grouped)
                                    .sort(([a], [b]) => Number(a) - Number(b))
                                    .map(([level, emps]) => (
                                        <div key={level}>
                                            {/* عنوان گروه */}
                                            <div className="px-4 py-1.5 text-xs text-gray-500 bg-gray-900/40 sticky top-0">
                                                سطح سازمانی {level}
                                            </div>

                                            {emps.map(emp => {
                                                const selected = selectedIds.includes(emp.user_id);
                                                return (
                                                    <div
                                                        key={emp.user_id}
                                                        onClick={() => toggle(emp.user_id)}
                                                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                                                            selected
                                                                ? 'bg-blue-500/15'
                                                                : 'hover:bg-gray-700/60'
                                                        }`}
                                                    >
                                                        {/* avatar */}
                                                        <div className="relative">
                                                            <Avatar emp={emp} size="md" />
                                                            {selected && (
                                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-800">
                                                                    <FaCheck size={8} className="text-white" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* اطلاعات */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-medium truncate ${selected ? 'text-blue-300' : 'text-white'}`}>
                                                                {emp.name}
                                                            </div>
                                                            {emp.position_title && (
                                                                <div className="text-xs text-gray-400 truncate">
                                                                    {emp.position_title}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* checkbox بصری */}
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                                                            selected
                                                                ? 'bg-blue-500 border-blue-500'
                                                                : 'border-gray-500'
                                                        }`}>
                                                            {selected && <FaCheck size={9} className="text-white" />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))
                            )}
                        </div>

                        {/* فوتر */}
                        {selectedIds.length > 0 && (
                            <div className="p-3 border-t border-gray-700 flex items-center justify-between">
                                <span className="text-xs text-gray-400">
                                    {selectedIds.length} نفر انتخاب شده
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { setOpen(false); setSearch(''); }}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition"
                                >
                                    تأیید
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AssigneePicker;
