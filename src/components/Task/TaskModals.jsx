import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaSpinner, FaTimes, FaSearch, FaCheckCircle, FaUser } from 'react-icons/fa';
import axiosInstance from '../../api/axiosInstance';
import { forwardStep } from '../../features/task/taskSlice';

export const ConfirmModal = ({ title, message, confirmLabel, confirmClass, onConfirm, onClose }) => {
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handle = async () => {
        setLoading(true);
        setError('');
        try {
            await onConfirm(note);
        } catch (err) {
            setError(err.response?.data?.detail || 'خطا در انجام عملیات');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative rounded-2xl p-5 w-full max-w-sm shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>

                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="یادداشت یا دلیل (اختیاری)..."
                    rows={3}
                    className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 resize-none mb-4 ${isDark ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'}`}
                />

                {error && <div className="bg-red-500/10 text-red-500 text-xs p-3 rounded-lg mb-4">{error}</div>}

                <div className="flex gap-3">
                    <button onClick={onClose} className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors border ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-gray-300 border-slate-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'}`}>
                        انصراف
                    </button>
                    <button onClick={handle} disabled={loading} className={`flex-1 ${confirmClass} text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}>
                        {loading ? <FaSpinner className="animate-spin" /> : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ForwardModal = ({ taskId, onSuccess, onClose }) => {
    const dispatch = useDispatch();
    const { forwarding } = useSelector(s => s.task);
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [note, setNote] = useState('');
    const [sendSms, setSendSms] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axiosInstance.get('/tasks/subordinates/')
            .then(r => setList(r.data))
            .catch(() => setError('خطا در بارگیری لیست پرسنل'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = list.filter(e =>
        !search.trim() ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.position_title || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selected) return;
        setError('');
        const result = await dispatch(forwardStep({
            taskId,
            to_user_id: selected.user_id,
            note,
            send_sms: sendSms,
        }));
        if (forwardStep.fulfilled.match(result)) {
            onSuccess();
        } else {
            setError(result.payload || 'خطا در ارجاع ماموریت');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh] border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>ارجاع ماموریت</h3>
                    <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${isDark ? 'bg-slate-800 text-gray-400 hover:text-white border-slate-700' : 'bg-gray-100 text-gray-500 hover:text-gray-900 border-gray-300'}`}>
                        <FaTimes size={12} />
                    </button>
                </div>

                <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 focus-within:border-blue-500 transition-colors ${isDark ? 'bg-slate-950 border-slate-700' : 'bg-gray-50 border-gray-300'}`}>
                        <FaSearch className={`${isDark ? 'text-gray-500' : 'text-gray-400'} shrink-0`} size={14} />
                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی نام یا سمت..." className={`bg-transparent text-sm flex-1 outline-none ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`} />
                        {search && <button onClick={() => setSearch('')} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}><FaTimes size={12} /></button>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                    {loading ? (
                        <div className="flex justify-center py-10 text-blue-500"><FaSpinner className="animate-spin text-2xl" /></div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm py-10">شخصی یافت نشد.</div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filtered.map(emp => {
                                const isSelected = selected?.user_id === emp.user_id;
                                return (
                                    <div key={emp.user_id} onClick={() => setSelected(emp)} className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-colors border ${isSelected ? 'bg-blue-500/10 border-blue-500/40' : isDark ? 'bg-transparent border-transparent hover:bg-slate-800/60' : 'bg-transparent border-transparent hover:bg-gray-100'}`}>
                                        {emp.avatar_url ? (
                                            <img src={emp.avatar_url} alt="" className={`w-10 h-10 rounded-full object-cover shrink-0 border ${isDark ? 'border-slate-700' : 'border-gray-300'}`} />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-sm text-blue-500 font-bold shrink-0 border border-blue-500/30">{emp.name?.[0]}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-sm font-medium truncate ${isSelected ? 'text-blue-500' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>{emp.name}</div>
                                            {emp.position_title && <div className="text-xs text-gray-500 truncate mt-0.5">{emp.position_title}</div>}
                                        </div>
                                        {isSelected && <FaCheckCircle className="text-blue-500 shrink-0" size={16} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={`p-4 border-t rounded-b-2xl space-y-3 shrink-0 ${isDark ? 'border-slate-700 bg-slate-900' : 'border-gray-200 bg-white'}`}>
                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="یادداشت ارجاع (اختیاری)..." rows={2} className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-blue-500 resize-none ${isDark ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'}`} />
                    <div onClick={() => setSendSms(v => !v)} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${isDark ? 'border-slate-700 bg-slate-950' : 'border-gray-300 bg-gray-50'}`}>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>ارسال پیامک اطلاع‌رسانی</span>
                        <div className={`relative w-10 h-6 rounded-full transition-colors duration-300 ${sendSms ? 'bg-blue-500' : isDark ? 'bg-slate-600' : 'bg-gray-300'}`}>
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${sendSms ? 'left-1' : 'right-1'}`} />
                        </div>
                    </div>
                    {error && <div className="text-red-500 text-xs text-center p-2 bg-red-500/10 rounded-lg">{error}</div>}
                    <button onClick={handleSubmit} disabled={!selected || forwarding} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 disabled:text-gray-400 text-white rounded-xl py-3.5 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        {forwarding ? <FaSpinner className="animate-spin" /> : null}
                        {selected ? `ارجاع ماموریت به ${selected.name}` : 'یک شخص را انتخاب کنید'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ReturnModal = ({ title, assignees, onConfirm, onClose }) => {
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';
    const { returning } = useSelector((s) => s.task || {}); 

    const [selectedIds, setSelectedIds] = useState([]);
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    const toggleSelect = (userId) => {
        setSelectedIds(prev => 
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handle = async () => {
        if (selectedIds.length === 0) {
            setError('لطفاً حداقل یک مجری را برای برگشت دادن انتخاب کنید.');
            return;
        }
        setError('');
        try {
            await onConfirm(selectedIds, note);
        } catch (err) {
            setError(err?.response?.data?.detail || err?.message || 'خطا در انجام عملیات');
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className={`relative rounded-2xl p-5 w-full max-w-sm shadow-2xl border flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-500/20 text-gray-400 hover:text-gray-200 transition-colors">
                        <FaTimes size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto mb-4 space-y-2 [&::-webkit-scrollbar]:hidden">
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>مجریانی که کار باید به آن‌ها برگشت داده شود را انتخاب کنید:</p>
                    {assignees.map((a, i) => {
                        const userId = a.user || a.user_id;
                        const isSelected = selectedIds.includes(userId);
                        return (
                            <div 
                                key={i}
                                onClick={() => toggleSelect(userId)}
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                                    isSelected 
                                    ? 'border-orange-500 bg-orange-500/10' 
                                    : isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                                    isSelected ? 'bg-orange-500 border-orange-500 text-white' : isDark ? 'border-slate-500 bg-slate-900' : 'border-gray-400 bg-white'
                                }`}>
                                    {isSelected && <FaCheckCircle size={12} />}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {a.user_name || `کاربر ${userId}`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="دلیل برگشت کار (الزامی)..."
                    rows={3}
                    className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:border-orange-500 resize-none mb-4 ${isDark ? 'bg-slate-950 text-white border-slate-700 placeholder-gray-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'}`}
                />

                {error && <div className="bg-red-500/10 text-red-500 text-xs p-3 rounded-lg mb-4">{error}</div>}

                <div className="flex gap-3 mt-auto">
                    <button onClick={onClose} className={`flex-1 rounded-xl py-3 text-sm font-medium transition-colors border ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-gray-300 border-slate-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'}`}>
                        انصراف
                    </button>
                    <button onClick={handle} disabled={returning || !note.trim()} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {returning ? <FaSpinner className="animate-spin" /> : 'برگشت کار'}
                    </button>
                </div>
            </div>
        </div>
    );
};
