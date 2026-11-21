// src/components/Task/TaskModals.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaSpinner, FaTimes, FaSearch, FaCheckCircle } from 'react-icons/fa';
import axiosInstance from '../../api/axiosInstance';
import { forwardStep } from '../../features/task/taskSlice';

const ModalCornerBrackets = ({ accent = 'cyan', isDark = true }) => {
    const accentMap = {
        cyan: isDark ? 'border-sky-400/65' : 'border-sky-600/65',
        amber: isDark ? 'border-amber-400/65' : 'border-amber-600/65',
        red: isDark ? 'border-red-400/65' : 'border-red-600/65',
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
            setError(err?.response?.data?.detail || err?.message || 'خطا در انجام عملیات');
            setLoading(false);
        }
    };

    const accent = confirmClass?.includes('red') ? 'red' : 'cyan';

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div
                className={`relative rounded-[2px] w-full max-w-sm shadow-2xl border overflow-hidden ${
                    isDark
                        ? 'bg-tactical-surface1 border-slate-400/25 text-slate-100'
                        : 'bg-white border-slate-900/20 text-slate-900'
                }`}
            >
                <ModalCornerBrackets accent={accent} isDark={isDark} />

                <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${
                        isDark
                            ? 'bg-tactical-surface2 border-slate-400/15'
                            : 'bg-slate-50 border-slate-900/15'
                    }`}
                >
                    <h3 className="font-bold text-sm">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition-colors border ${
                            isDark
                                ? 'bg-tactical-canvas text-slate-400 hover:text-white border-slate-400/20'
                                : 'bg-white text-slate-500 hover:text-slate-900 border-slate-900/15'
                        }`}
                    >
                        <FaTimes size={11} />
                    </button>
                </div>

                <div className="p-4">
                    <p className={`text-xs mb-3.5 leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {message}
                    </p>

                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="یادداشت یا دلیل (اختیاری)..."
                        rows={3}
                        className={`w-full rounded-[2px] px-3 py-2.5 text-xs border focus:outline-none focus:border-sky-400 resize-none mb-3.5 ${
                            isDark
                                ? 'bg-tactical-canvas text-white border-slate-400/20 placeholder-slate-500'
                                : 'bg-slate-50 text-slate-900 border-slate-900/20 placeholder-slate-400'
                        }`}
                    />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/35 text-red-400 text-xs p-2.5 rounded-[2px] mb-3.5">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 rounded-[2px] py-2.5 text-xs font-semibold transition-colors border ${
                                isDark
                                    ? 'bg-tactical-surface2 hover:bg-tactical-hover text-slate-300 border-slate-400/20'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-900/15'
                            }`}
                        >
                            انصراف
                        </button>
                        <button
                            type="button"
                            onClick={handle}
                            disabled={loading}
                            className={`flex-1 ${confirmClass} text-white rounded-[2px] py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ForwardModal = ({ taskId, userRole = 'ASSIGNEE', onSuccess, onClose }) => {
    const dispatch = useDispatch();
    const { forwarding } = useSelector((s) => s.task);
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(null);
    const [note, setNote] = useState('');
    const [isAssist, setIsAssist] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        axiosInstance
            .get('/tasks/subordinates/')
            .then((r) => setList(r.data))
            .catch(() => setError('خطا در بارگیری لیست پرسنل'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = list.filter(
        (e) =>
            !search.trim() ||
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            (e.position_title || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selected) return;
        setError('');
        const result = await dispatch(
            forwardStep({
                taskId,
                to_user_id: selected.user_id,
                note,
                send_sms: true,
                is_assist: isAssist,
            })
        );
        if (forwardStep.fulfilled.match(result)) {
            onSuccess();
        } else {
            setError(result.payload || 'خطا در ارجاع ماموریت');
        }
    };

    const isApprover = userRole === 'INTERMEDIATE_APPROVER';

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[9999]" dir="rtl">
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
            <div
                className={`relative rounded-[2px] w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] border overflow-hidden ${
                    isDark
                        ? 'bg-tactical-surface1 border-sky-400/40 text-slate-100'
                        : 'bg-white border-slate-900/20 text-slate-900'
                }`}
            >
                <ModalCornerBrackets accent={isAssist ? 'amber' : 'cyan'} isDark={isDark} />

                <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${
                        isDark
                            ? 'border-slate-400/15 bg-tactical-surface2'
                            : 'border-slate-900/15 bg-slate-50'
                    }`}
                >
                    <div>
                        <h3 className="font-bold text-sm">
                            {isAssist ? 'درخواست مشارکت / ارجاع کمکی' : 'ارجاع و انتقال مسئولیت'}
                        </h3>
                        <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            نوع ارجاع و فرد مقصد را انتخاب کنید
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition-colors border ${
                            isDark
                                ? 'bg-tactical-canvas text-slate-400 hover:text-white border-slate-400/20'
                                : 'bg-white text-slate-500 hover:text-slate-900 border-slate-900/15'
                        }`}
                    >
                        <FaTimes size={11} />
                    </button>
                </div>

                {/* انتخاب ۲ مدل ارجاع + جستجوی پرسنل */}
                <div
                    className={`p-3 border-b space-y-2.5 ${
                        isDark
                            ? 'border-slate-400/15 bg-tactical-canvas/60'
                            : 'border-slate-900/10 bg-slate-50/70'
                    }`}
                >
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAssist(false)}
                            className={`p-2 rounded-[2px] border text-right transition-all ${
                                !isAssist
                                    ? isDark
                                        ? 'bg-sky-400/15 border-sky-400 text-sky-300'
                                        : 'bg-sky-50 border-sky-600 text-sky-800'
                                    : isDark
                                    ? 'bg-tactical-surface1 border-slate-400/20 text-slate-400 hover:text-slate-200'
                                    : 'bg-white border-slate-900/15 text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <div className="text-xs font-bold">ارجاع کامل (انتقال)</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-4">
                                {isApprover
                                    ? 'تاییدیه به فرد مقصد منتقل و شما خارج می‌شوید'
                                    : 'مسئولیت از شما خارج و منتقل می‌شود'}
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsAssist(true)}
                            className={`p-2 rounded-[2px] border text-right transition-all ${
                                isAssist
                                    ? isDark
                                        ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                                        : 'bg-amber-50 border-amber-600 text-amber-800'
                                    : isDark
                                    ? 'bg-tactical-surface1 border-slate-400/20 text-slate-400 hover:text-slate-200'
                                    : 'bg-white border-slate-900/15 text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <div className="text-xs font-bold">ارجاع کمکی (مشارکت)</div>
                            <div className="text-[10px] opacity-80 mt-0.5 leading-4">
                                {isApprover
                                    ? 'شما می‌مانید و فرد مقصد برای همفکری اضافه می‌شود'
                                    : 'شما می‌مانید و همکار کمکی اضافه می‌شود'}
                            </div>
                        </button>
                    </div>

                    <div
                        className={`flex items-center gap-2 border rounded-[2px] px-3 py-2 focus-within:border-sky-400 transition-colors ${
                            isDark
                                ? 'bg-tactical-canvas border-slate-400/20'
                                : 'bg-white border-slate-900/20'
                        }`}
                    >
                        <FaSearch className={`${isDark ? 'text-slate-500' : 'text-slate-400'} shrink-0`} size={12} />
                        <input
                            autoFocus
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی نام یا سمت..."
                            className={`bg-transparent text-xs flex-1 outline-none ${
                                isDark
                                    ? 'text-white placeholder-slate-500'
                                    : 'text-slate-900 placeholder-slate-400'
                            }`}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}
                            >
                                <FaTimes size={11} />
                            </button>
                        )}
                    </div>
                </div>

                {/* لیست پرسنل */}
                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                    {loading ? (
                        <div className="flex justify-center py-10 text-sky-400">
                            <FaSpinner className="animate-spin text-2xl" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-slate-500 text-xs py-10">شخصی یافت نشد.</div>
                    ) : (
                        <div className="p-2 space-y-1">
                            {filtered.map((emp) => {
                                const isSelected = selected?.user_id === emp.user_id;
                                return (
                                    <div
                                        key={emp.user_id}
                                        onClick={() => setSelected(emp)}
                                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-[2px] transition-colors border ${
                                            isSelected
                                                ? isDark
                                                    ? 'bg-sky-400/15 border-sky-400/50'
                                                    : 'bg-sky-50 border-sky-600/50'
                                                : isDark
                                                ? 'bg-transparent border-transparent hover:bg-tactical-hover'
                                                : 'bg-transparent border-transparent hover:bg-slate-100'
                                        }`}
                                    >
                                        {emp.avatar_url ? (
                                            <img
                                                src={emp.avatar_url}
                                                alt=""
                                                className={`w-9 h-9 rounded-[2px] object-cover shrink-0 border ${
                                                    isDark ? 'border-slate-400/20' : 'border-slate-900/15'
                                                }`}
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-[2px] bg-sky-500/15 flex items-center justify-center text-xs text-sky-400 font-bold shrink-0 border border-sky-500/30">
                                                {emp.name?.[0]}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={`text-xs font-bold truncate ${
                                                    isSelected
                                                        ? isDark
                                                            ? 'text-sky-300'
                                                            : 'text-sky-700'
                                                        : isDark
                                                        ? 'text-slate-200'
                                                        : 'text-slate-800'
                                                }`}
                                            >
                                                {emp.name}
                                            </div>
                                            {emp.position_title && (
                                                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                                                    {emp.position_title}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <FaCheckCircle
                                                className={isDark ? 'text-sky-400 shrink-0' : 'text-sky-600 shrink-0'}
                                                size={14}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* یادداشت، پیامک و دکمه ثبت */}
                <div
                    className={`p-3 border-t space-y-2.5 shrink-0 ${
                        isDark
                            ? 'border-slate-400/15 bg-tactical-surface2'
                            : 'border-slate-900/15 bg-slate-50'
                    }`}
                >
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="یادداشت ارجاع (اختیاری)..."
                        rows={2}
                        className={`w-full rounded-[2px] px-3 py-2 text-xs border focus:outline-none focus:border-sky-400 resize-none ${
                            isDark
                                ? 'bg-tactical-canvas text-white border-slate-400/20 placeholder-slate-500'
                                : 'bg-white text-slate-900 border-slate-900/20 placeholder-slate-400'
                        }`}
                    />
                    <div
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-[2px] border text-[11px] ${
                            isDark
                                ? 'border-sky-400/25 bg-sky-400/10 text-sky-300'
                                : 'border-sky-600/25 bg-sky-50 text-sky-800'
                        }`}
                    >
                        <FaCheckCircle className="shrink-0" size={11} />
                        <span>پیامک اطلاع‌رسانی ارجاع به‌صورت خودکار برای فرد مقصد ارسال می‌شود.</span>
                    </div>
                    {error && (
                        <div className="text-red-400 text-xs text-center p-2 bg-red-500/10 border border-red-500/30 rounded-[2px]">
                            {error}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!selected || forwarding}
                        className={`w-full rounded-[2px] py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-45 ${
                            isAssist
                                ? isDark
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                                : isDark
                                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                : 'bg-sky-600 hover:bg-sky-700 text-white'
                        }`}
                    >
                        {forwarding ? <FaSpinner className="animate-spin" /> : null}
                        {selected
                            ? isAssist
                                ? `افزودن ${selected.name} به عنوان همکار`
                                : `ارجاع کامل به ${selected.name}`
                            : 'یک شخص را انتخاب کنید'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ReturnModal = ({ title, assignees = [], onConfirm, onClose }) => {
    const mode = useSelector((s) => s.theme?.mode || 'dark');
    const isDark = mode === 'dark';
    const { returning } = useSelector((s) => s.task || {});

    const [selectedIds, setSelectedIds] = useState([]);
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    const toggleSelect = (userId) => {
        setSelectedIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
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
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div
                className={`relative rounded-[2px] w-full max-w-sm shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
                    isDark
                        ? 'bg-tactical-surface1 border-amber-400/40 text-slate-100'
                        : 'bg-white border-slate-900/20 text-slate-900'
                }`}
            >
                <ModalCornerBrackets accent="amber" isDark={isDark} />

                <div
                    className={`flex items-center justify-between px-4 py-3 border-b ${
                        isDark
                            ? 'bg-tactical-surface2 border-slate-400/15'
                            : 'bg-slate-50 border-slate-900/15'
                    }`}
                >
                    <h3 className="font-bold text-sm">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`w-7 h-7 rounded-[2px] flex items-center justify-center transition-colors border ${
                            isDark
                                ? 'bg-tactical-canvas text-slate-400 hover:text-white border-slate-400/20'
                                : 'bg-white text-slate-500 hover:text-slate-900 border-slate-900/15'
                        }`}
                    >
                        <FaTimes size={11} />
                    </button>
                </div>

                <div className="p-4 flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto mb-3.5 space-y-1.5 [&::-webkit-scrollbar]:hidden">
                        <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            مجریانی که کار باید به آن‌ها برگشت داده شود را انتخاب کنید:
                        </p>
                        {assignees.map((a, i) => {
                            const userId = a.user || a.user_id;
                            const isSelected = selectedIds.includes(userId);
                            return (
                                <div
                                    key={userId || i}
                                    onClick={() => toggleSelect(userId)}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-[2px] border cursor-pointer transition-colors ${
                                        isSelected
                                            ? isDark
                                                ? 'border-amber-400 bg-amber-400/15'
                                                : 'border-amber-600 bg-amber-50'
                                            : isDark
                                            ? 'border-slate-400/20 bg-tactical-canvas hover:bg-tactical-hover'
                                            : 'border-slate-900/15 bg-slate-50 hover:bg-slate-100'
                                    }`}
                                >
                                    <div
                                        className={`w-4 h-4 rounded-[2px] flex items-center justify-center border shrink-0 ${
                                            isSelected
                                                ? isDark
                                                    ? 'bg-amber-400 border-amber-400 text-slate-950'
                                                    : 'bg-amber-600 border-amber-600 text-white'
                                                : isDark
                                                ? 'border-slate-500 bg-tactical-surface2'
                                                : 'border-slate-400 bg-white'
                                        }`}
                                    >
                                        {isSelected && <FaCheckCircle size={10} />}
                                    </div>
                                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {a.user_name || `کاربر ${userId}`}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="دلیل برگشت کار (الزامی)..."
                        rows={3}
                        className={`w-full rounded-[2px] px-3 py-2.5 text-xs border focus:outline-none focus:border-amber-400 resize-none mb-3.5 ${
                            isDark
                                ? 'bg-tactical-canvas text-white border-slate-400/20 placeholder-slate-500'
                                : 'bg-slate-50 text-slate-900 border-slate-900/20 placeholder-slate-400'
                        }`}
                    />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/35 text-red-400 text-xs p-2.5 rounded-[2px] mb-3.5">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 mt-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 rounded-[2px] py-2.5 text-xs font-semibold transition-colors border ${
                                isDark
                                    ? 'bg-tactical-surface2 hover:bg-tactical-hover text-slate-300 border-slate-400/20'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-900/15'
                            }`}
                        >
                            انصراف
                        </button>
                        <button
                            type="button"
                            onClick={handle}
                            disabled={returning || !note.trim()}
                            className={`flex-1 rounded-[2px] py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-45 ${
                                isDark
                                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                        >
                            {returning ? <FaSpinner className="animate-spin" /> : 'برگشت کار'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};