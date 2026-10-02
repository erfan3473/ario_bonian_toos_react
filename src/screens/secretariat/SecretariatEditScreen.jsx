import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchLetterDetail, updateLetter, fetchAllPersonnel, fetchOrganizations, fetchLetters } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaChevronLeft, FaChevronDown } from 'react-icons/fa';
import JalaliDatePicker from '../../components/JalaliDatePicker'; 

// 🚀 کامپوننت اختصاصی جستجوی پرسنل (تایپ و سرچ)
const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel?.find(p => p.id === parseInt(value));
            if (selected) setSearchTerm(`${selected.name} - ${selected.position_title || 'بدون سمت'}`);
        } else {
            setSearchTerm('');
        }
    }, [value, personnel]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 🚀 جلوگیری از ارور filter با اضافه کردن علامت ?
    const filtered = personnel?.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.position_title && p.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    const inputClass = `w-full p-2.5 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'}`;

    return (
        <div className="relative" ref={wrapperRef}>
            <input
                type="text"
                className={inputClass}
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsOpen(true);
                    if (e.target.value === '') onChange('');
                }}
                onFocus={() => setIsOpen(true)}
            />
            <FaChevronDown className="absolute left-3 top-3.5 text-gray-400 pointer-events-none text-xs" />
            
            {isOpen && (
                <ul className={`absolute z-10 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    <li 
                        className={`p-2.5 cursor-pointer text-sm font-bold opacity-70 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        onClick={() => { onChange(''); setIsOpen(false); }}
                    >
                        -- نامشخص / ثبت دستی در پایین --
                    </li>
                    {filtered.map(emp => (
                        <li 
                            key={emp.id}
                            className={`p-2.5 cursor-pointer text-sm border-t ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
                            onClick={() => {
                                onChange(emp.id.toString());
                                setSearchTerm(`${emp.name} - ${emp.position_title || 'بدون سمت'}`);
                                setIsOpen(false);
                            }}
                        >
                            <div className="font-bold">{emp.name}</div>
                            <div className="text-xs opacity-60 mt-0.5">{emp.position_title || 'بدون سمت'}</div>
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="p-3 text-sm opacity-50 text-center">موردی یافت نشد</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const SecretariatEditScreen = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    
    // 🚀 استخراج امن دیتا برای جلوگیری از کرش کردن مپ و فیلتر
    const { activeLetter, allPersonnel, organizations, letters: lettersData } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : (lettersData?.results || []);

    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        letter_type: 'INTERNAL',
        original_number: '',
        original_date: '',
        internal_sender: '',
        external_sender: '',
        internal_receiver: '',
        external_receiver: '',
        receiver_persons: '', 
        manual_sender_name: '',
        manual_receiver_name: '', 
        urgency: 'NORMAL',
        confidentiality: 'NORMAL',
        has_physical_copy: true,
        physical_archive_location: '',
        attachment_note: '',
        contract_number: '',
        reference_number: '',
        reference_letter: '',
        cc_text: '',
        internal_cc_receivers: [], 
        body: '',
    });

    useEffect(() => {
        dispatch(fetchAllPersonnel());
        dispatch(fetchOrganizations()); 
        dispatch(fetchLetterDetail(id));
        if (!lettersList || lettersList.length === 0) {
            dispatch(fetchLetters({}));
        }
    }, [dispatch, id]);

    useEffect(() => {
        if (activeLetter && activeLetter.id === parseInt(id)) {
            setFormData({
                subject: activeLetter.subject || '',
                letter_type: activeLetter.letter_type || 'INTERNAL',
                original_number: activeLetter.original_number || '',
                original_date: activeLetter.original_date || '',
                internal_sender: activeLetter.internal_sender || '',
                external_sender: activeLetter.external_sender_detail?.name || '',
                internal_receiver: activeLetter.internal_receiver || '',
                external_receiver: activeLetter.external_receiver_detail?.name || '',
                receiver_persons: activeLetter.receiver_persons || '', 
                manual_sender_name: activeLetter.manual_sender_name || '', 
                manual_receiver_name: activeLetter.manual_receiver_name || '', 
                urgency: activeLetter.urgency || 'NORMAL',
                confidentiality: activeLetter.confidentiality || 'NORMAL',
                has_physical_copy: activeLetter.has_physical_copy,
                physical_archive_location: activeLetter.physical_archive_location || '',
                attachment_note: activeLetter.attachment_note || '',
                contract_number: activeLetter.contract_number || '',
                reference_number: activeLetter.reference_number || '',
                reference_letter: activeLetter.reference_letter_detail?.id || '',
                cc_text: activeLetter.cc_text || '',
                internal_cc_receivers: activeLetter.internal_cc_receivers || [], 
                body: activeLetter.body || '',
            });
        }
    }, [activeLetter, id]);

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setFormData({ 
            ...formData, 
            letter_type: newType,
            internal_sender: '', 
            external_sender: '', 
            internal_receiver: '', 
            external_receiver: ''
        });
    };

    const handleMultiSelectChange = (e) => {
        const values = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({ ...formData, internal_cc_receivers: values });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.subject) return toast.error('موضوع الزامی است');

        const fd = new FormData();
        Object.keys(formData).forEach(key => {
            if (Array.isArray(formData[key])) {
                formData[key].forEach(val => fd.append(key, val));
            } else if (formData[key] !== null && formData[key] !== undefined) {
                fd.append(key, formData[key]);
            }
        });

        setUpdating(true);
        dispatch(updateLetter({ id, payload: fd })).unwrap()
            .then(() => {
                toast.success('تغییرات نامه ذخیره شد');
                navigate(`/secretariat/${id}`);
            })
            .catch(err => toast.error(err || 'خطا در ویرایش'))
            .finally(() => setUpdating(false));
    };

    const inputClass = `w-full p-2.5 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'}`;

    if (!activeLetter) return <div className="text-center py-10 font-bold opacity-60">در حال دریافت اطلاعات پرونده...</div>;

    return (
        <div className="max-w-5xl mx-auto p-4">
            
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold mb-4">
                <Link to="/secretariat" className="text-blue-500 hover:text-blue-700 transition">دبیرخانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <Link to={`/secretariat/${id}`} className="text-blue-500 hover:text-blue-700 transition">نامه {activeLetter.indicator_number}</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>ویرایش اطلاعات</span>
            </div>

            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                ویرایش مکاتبه (اندیکاتور: {activeLetter.indicator_number})
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <h3 className="font-bold mb-4 border-b pb-2 opacity-80">اطلاعات ثبتی</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">نوع نامه</label>
                            <select className={inputClass} value={formData.letter_type} onChange={handleTypeChange}>
                                <option value="INTERNAL">داخلی (بین واحدها)</option>
                                <option value="INCOMING">وارده (از خارج سازمان)</option>
                                <option value="OUTGOING">صادره (به خارج سازمان)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">شماره نامه فیزیکی / مبدأ</label>
                            <input 
                                type="text" 
                                dir="rtl" 
                                className={`${inputClass} text-right font-mono`} 
                                value={formData.original_number} 
                                onChange={(e) => setFormData({ ...formData, original_number: e.target.value })} 
                            />
                        </div>
                        <div className="relative">
                            <JalaliDatePicker name="original_date" label="تاریخ نامه فیزیکی / مبدأ" value={formData.original_date} onChange={(e) => setFormData({ ...formData, original_date: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block mb-1 text-xs font-bold opacity-80">فوریت</label>
                                <select className={inputClass} value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
                                    <option value="NORMAL">عادی</option>
                                    <option value="URGENT">فوری</option>
                                    <option value="VERY_URGENT">خیلی فوری</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 text-xs font-bold opacity-80">محرمانگی</label>
                                <select className={inputClass} value={formData.confidentiality} onChange={(e) => setFormData({ ...formData, confidentiality: e.target.value })}>
                                    <option value="NORMAL">عادی</option>
                                    <option value="CONFIDENTIAL">محرمانه</option>
                                    <option value="SECRET">سری</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <datalist id="org-list">{organizations?.map(org => (<option key={org.id} value={org.name} />))}</datalist>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                        <div className="space-y-3 p-4 rounded-lg bg-gray-500/5">
                            <span className="text-sm font-bold block mb-2 text-blue-600">فرستنده</span>
                            {formData.letter_type === 'INCOMING' ? (
                                <input type="text" list="org-list" className={inputClass} value={formData.external_sender} onChange={(e) => setFormData({ ...formData, external_sender: e.target.value })} />
                            ) : (
                                <SearchablePersonnelSelect 
                                    personnel={allPersonnel} 
                                    value={formData.internal_sender} 
                                    onChange={(val) => setFormData({ ...formData, internal_sender: val })} 
                                    placeholder="جستجو و انتخاب فرستنده..." 
                                    isDark={isDark} 
                                />
                            )}
                        </div>
                        <div className="space-y-3 p-4 rounded-lg bg-gray-500/5">
                            <span className="text-sm font-bold block mb-2 text-indigo-600">گیرنده</span>
                            {formData.letter_type === 'OUTGOING' ? (
                                <input type="text" list="org-list" className={inputClass} value={formData.external_receiver} onChange={(e) => setFormData({ ...formData, external_receiver: e.target.value })} />
                            ) : (
                                <SearchablePersonnelSelect 
                                    personnel={allPersonnel} 
                                    value={formData.internal_receiver} 
                                    onChange={(val) => setFormData({ ...formData, internal_receiver: val })} 
                                    placeholder="جستجو و انتخاب گیرنده..." 
                                    isDark={isDark} 
                                />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">عنوان دستی گیرنده (چاپ در بالای نامه - اختیاری)</label>
                            <textarea rows="2" className={inputClass} value={formData.manual_receiver_name} onChange={(e) => setFormData({ ...formData, manual_receiver_name: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">عنوان دستی فرستنده (چاپ در محل امضا - اختیاری)</label>
                            <textarea rows="2" className={inputClass} value={formData.manual_sender_name} onChange={(e) => setFormData({ ...formData, manual_sender_name: e.target.value })}></textarea>
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="block mb-1 text-xs font-bold opacity-80">عناوین اشخاص گیرنده (متنی - چاپ در زیر گیرنده اصلی)</label>
                        <textarea rows="2" className={inputClass} value={formData.receiver_persons} onChange={(e) => setFormData({ ...formData, receiver_persons: e.target.value })}></textarea>
                    </div>

                    {/* 🚀 فیلد سیستمی ارتباط بین نامه‌ها با استفاده از آرایه صحیح */}
                    <div className={`mb-5 p-4 rounded-lg border shadow-sm ${isDark ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                        <label className="block mb-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            🔗 ارتباط سیستمی (این نامه پاسخی است به کدام نامه؟)
                        </label>
                        <select className={inputClass} value={formData.reference_letter} onChange={(e) => setFormData({ ...formData, reference_letter: e.target.value })}>
                            <option value="">-- مستقل (بدون ارتباط سیستمی) --</option>
                            {lettersList?.filter(l => l.id !== parseInt(id)).map(l => (
                                <option key={l.id} value={l.id}>نامه {l.indicator_number} ({l.subject})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                        <div className="md:col-span-3">
                            <label className="block mb-1 text-xs font-bold opacity-80">موضوع نامه <span className="text-red-500">*</span></label>
                            <input type="text" className={inputClass} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">عطف به (شماره نامه مرتبط - تایپی)</label>
                            <input 
                                type="text" 
                                dir="rtl" 
                                className={`${inputClass} text-right font-mono`} 
                                value={formData.reference_number} 
                                onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} 
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">شماره قرارداد</label>
                            <input 
                                type="text" 
                                dir="rtl" 
                                className={`${inputClass} text-right font-mono`} 
                                value={formData.contract_number} 
                                onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })} 
                            />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">پیوست (متن)</label>
                            <input type="text" className={inputClass} value={formData.attachment_note} onChange={(e) => setFormData({ ...formData, attachment_note: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <div className="mb-4">
                        <label className="block mb-1 text-xs font-bold opacity-80">متن یا چکیده نامه</label>
                        <textarea rows="4" className={inputClass} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-lg bg-gray-500/5">
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">رونوشت کاغذی</label>
                            <textarea rows="3" className={inputClass} value={formData.cc_text} onChange={(e) => setFormData({ ...formData, cc_text: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">ارسال رونوشت سیستمی</label>
                            <select multiple className={`${inputClass} h-[84px]`} value={formData.internal_cc_receivers} onChange={handleMultiSelectChange}>
                                {allPersonnel?.map(emp => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3 rounded bg-gray-500/5">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                            <input type="checkbox" className="w-4 h-4 rounded" checked={formData.has_physical_copy} onChange={(e) => setFormData({ ...formData, has_physical_copy: e.target.checked })} />
                            نامه دارای نسخه فیزیکی (کاغذی) است
                        </label>
                        {formData.has_physical_copy && (
                            <input type="text" placeholder="محل بایگانی زونکن" className={inputClass} value={formData.physical_archive_location} onChange={(e) => setFormData({ ...formData, physical_archive_location: e.target.value })} />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-6">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg bg-gray-500 text-white font-bold text-sm">انصراف</button>
                    <button type="submit" disabled={updating} className="px-8 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm">
                        {updating ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default SecretariatEditScreen;