// src/components/Task/AssigneePickerPanel.jsx

import React, { useState, useMemo } from 'react';
import { FaSearch, FaTimes, FaCheck } from 'react-icons/fa';

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
    const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';
    if (emp.avatar_url) {
        return (
            <img
                src={emp.avatar_url}
                alt={emp.name}
                className={`${sz} rounded-full object-cover flex-shrink-0 border-2 border-gray-600`}
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

export const AssigneeChip = ({ emp, onRemove }) => (
    <div className="flex items-center gap-1.5 bg-gray-700 border border-gray-600 rounded-full pl-2 pr-1 py-1 max-w-[130px]">
        <Avatar emp={emp} size="sm" />
        <span className="text-white text-xs truncate">{emp.name.split(' ')[0]}</span>
        <button
            type="button"
            onClick={e => { e.stopPropagation(); onRemove(emp.user_id); }}
            className="text-gray-400 hover:text-red-400 transition flex-shrink-0 mr-0.5"
        >
            <FaTimes size={10} />
        </button>
    </div>
);

const AssigneePickerPanel = ({ subordinates, loading, selectedIds, onChange, onClose }) => {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search.trim()) return subordinates;
        const q = search.trim().toLowerCase();
        return subordinates.filter(e =>
            e.name.toLowerCase().includes(q) ||
            (e.position_title || '').toLowerCase().includes(q)
        );
    }, [subordinates, search]);

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

    return (
        <div className="h-full flex flex-col" style={{ background: 'rgba(15,23,42,0.85)' }}>

            {/* هدر */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700">
                <div>
                    <h3 className="text-white font-semibold text-sm">انتخاب مسئولان</h3>
                    {selectedIds.length > 0 && (
                        <p className="text-blue-400 text-xs mt-0.5">{selectedIds.length} نفر انتخاب شده</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition p-1 rounded-lg hover:bg-gray-700"
                >
                    <FaTimes size={15} />
                </button>
            </div>

            {/* سرچ */}
            <div className="px-3 py-3 border-b border-gray-700">
                <div className="flex items-center gap-2 bg-gray-700/70 rounded-xl px-3 py-2.5">
                    <FaSearch className="text-gray-400 flex-shrink-0" size={12} />
                    <input
                        autoFocus
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="جستجو نام یا سمت..."
                        className="bg-transparent text-white text-sm flex-1 outline-none placeholder-gray-500"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="text-gray-400 hover:text-white">
                            <FaTimes size={11} />
                        </button>
                    )}
                </div>
            </div>

            {/* لیست */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-32 text-gray-400 text-sm">
                        در حال بارگیری...
                    </div>
                ) : !Object.keys(grouped).length ? (
                    <div className="flex justify-center items-center h-32 text-gray-500 text-sm">
                        نتیجه‌ای یافت نشد
                    </div>
                ) : (
                    Object.entries(grouped)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([level, emps]) => (
                            <div key={level}>
                                <div className="px-4 py-1.5 text-xs text-gray-500 sticky top-0 backdrop-blur-sm"
                                    style={{ background: 'rgba(15,23,42,0.9)' }}>
                                    سطح سازمانی {level}
                                </div>
                                {emps.map(emp => {
                                    const selected = selectedIds.includes(emp.user_id);
                                    return (
                                        <div
                                            key={emp.user_id}
                                            onClick={() => toggle(emp.user_id)}
                                            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition border-b border-gray-700/30 ${
                                                selected ? 'bg-blue-500/10' : 'hover:bg-gray-700/40'
                                            }`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <Avatar emp={emp} size="md" />
                                                {selected && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center border-2 border-gray-900">
                                                        <FaCheck size={8} className="text-white" />
                                                    </div>
                                                )}
                                            </div>

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

                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                                                selected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
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
            <div className="p-4 border-t border-gray-700">
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-semibold transition"
                >
                    {selectedIds.length > 0 ? `تأیید — ${selectedIds.length} نفر` : 'بستن'}
                </button>
            </div>
        </div>
    );
};

export default AssigneePickerPanel;
