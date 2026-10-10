import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchLetterDetail, updateLetter, fetchAllPersonnel, fetchOrganizations, fetchLetters } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaChevronLeft, FaChevronDown } from 'react-icons/fa';
import JalaliDatePicker from '../../components/JalaliDatePicker'; 

import logo from '../../assets/ario.png';

const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel?.find(p => String(p.id) === String(value));
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

// 🚀 لوگوی متحرک اختصاصی برای صفحه ادیت هم آورده شد
const DirectionalLogo = ({ type, colorName }) => {
    const isOutward = type === 'OUTGOING';
    const isInternal = type === 'INTERNAL';

    const colorMaps = {
        green: { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500', text: 'text-green-600 dark:text-green-400' },
        orange: { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-500', text: 'text-orange-600 dark:text-orange-400' },
        purple: { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400' },
    };
    const theme = colorMaps[colorName] || colorMaps.purple;

    return (
        <div className={`relative w-20 h-20 shrink-0 flex items-center justify-center rounded-2xl shadow-lg border-2 transition-all duration-500 ${theme.bg} ${theme.border}`}>
            <img src={logo} alt="لوگو" className="w-12 h-12 object-contain z-10 relative" />
            <div className={`absolute inset-0 z-20 transition-transform duration-700 ease-in-out ${isInternal ? 'rotate-45' : isOutward ? 'rotate-90' : 'rotate-0'}`}>
                {[0, 90, 180, 270].map((rotation, i) => (
                    <div key={i} className="absolute inset-0 flex items-start justify-center" style={{ transform: `rotate(${rotation}deg)` }}>
                        <svg 
                            width="32" height="32" viewBox="0 0 24 24" 
                            className={`transition-all duration-500 drop-shadow-md ${theme.text} -mt-4 ${!isInternal && !isOutward ? 'rotate-180' : 'rotate-0'}`}
                        >
                            {isInternal ? (
                                <>
                                    <path d="M 22 22 A 18 18 0 0 0 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M 12 12 L 6 6 L 12 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                </>
                            ) : (
                                <>
                                    <path d="M 12 23 Q 22 14, 12 3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    <path d="M 6 9 L 12 3 L 18 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="rotate(-40 12 3)" />
                                </>
                            )}
                        </svg>
                    </div>
                ))}
            </div>
        </div>
    );
};

const SecretariatEditScreen = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { userInfo } = useSelector((state) => state.userLogin);
    
    const isLevelZeroOrAdmin = userInfo?.is_admin || (userInfo?.employee?.position?.hierarchy_level === 0);
    
    const { activeLetter, allPersonnel, organizations, letters: lettersData } = useSelector((state) => state.secretariat);
    const lettersList = Array.isArray(lettersData) ? lettersData : (lettersData?.results || []);

    const [updating, setUpdating] = useState(false);
    
    const [formData, setFormData] = useState({
        subject: '',
        letter_type: 'INTERNAL',
        status: 'PENDING', 
        original_number: '',
        original_date: '',
        destination_indicator: '', 
        destination_date: '', 
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
        if (activeLetter && String(activeLetter.id) === String(id)) {
            setFormData({
                subject: activeLetter.subject || '',
                letter_type: activeLetter.letter_type || 'INTERNAL',
                status: activeLetter.status || 'PENDING',
                original_number: activeLetter.original_number || '',
                original_date: activeLetter.original_date || '',
                destination_indicator: activeLetter.destination_indicator || '',
                destination_date: activeLetter.destination_date || '',
                
                internal_sender: activeLetter.internal_sender ? String(activeLetter.internal_sender) : '',
                external_sender: activeLetter.external_sender_detail?.name || '',
                internal_receiver: activeLetter.internal_receiver ? String(activeLetter.internal_receiver) : '',
                external_receiver: activeLetter.external_receiver_detail?.name || '',
                
                receiver_persons: activeLetter.receiver_persons || '', 
                manual_sender_name: activeLetter.manual_sender_name || '', 
                manual_receiver_name: activeLetter.manual_receiver_name || '', 
                urgency: activeLetter.urgency || 'NORMAL',
                confidentiality: activeLetter.confidentiality || 'NORMAL',
                has_physical_copy: activeLetter.has_physical_copy ?? true,
                physical_archive_location: activeLetter.physical_archive_location || '',
                attachment_note: activeLetter.attachment_note || '',
                contract_number: activeLetter.contract_number || '',
                reference_number: activeLetter.reference_number || '',
                reference_letter: activeLetter.reference_letter_detail?.id ? String(activeLetter.reference_letter_detail.id) : '',
                cc_text: activeLetter.cc_text || '',
                internal_cc_receivers: activeLetter.internal_cc_receivers ? activeLetter.internal_cc_receivers.map(String) : [], 
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
            external_receiver: '',
            // 🚀 ریست کردن فیلدهای مقصد هنگام تغییر نوع نامه
            destination_indicator: newType !== 'OUTGOING' ? '' : formData.destination_indicator,
            destination_date: newType !== 'OUTGOING' ? '' : formData.destination_date
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

    if (!activeLetter || String(activeLetter.id) !== String(id)) {
        return <div className="text-center py-20 font-bold opacity-60">در حال خواندن اطلاعات پرونده...</div>;
    }

    const typeConfigs = {
        'INCOMING': { color: 'green', text: 'وارده' },
        'OUTGOING': { color: 'orange', text: 'صادره' },
        'INTERNAL': { color: 'purple', text: 'داخلی' }
    };
    const currentTypeConfig = typeConfigs[formData.letter_type] || typeConfigs['INTERNAL'];

    return (
        <div className="max-w-5xl mx-auto p-4 relative">
            
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold mb-4">
                <Link to="/secretariat" className="text-blue-500 hover:text-blue-700 transition">دبیرخانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <Link to={`/secretariat/${id}`} className="text-blue-500 hover:text-blue-700 transition">نامه {activeLetter.indicator_number}</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>ویرایش اطلاعات</span>
            </div>

            {/* 🚀 هدر اختصاصی و لوگوی متحرک */}
            <div className="flex flex-col items-center justify-center relative mb-8 mt-2">
                <DirectionalLogo type={formData.letter_type} colorName={currentTypeConfig.color} />
                <h2 className={`text-2xl mt-4 font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    ویرایش مکاتبه (اندیکاتور: {activeLetter.indicator_number})
                </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className={`h-1.5 w-full rounded-t-xl transition-all duration-500 bg-gradient-to-r from-${currentTypeConfig.color}-400 to-${currentTypeConfig.color}-600`} />

                <div className={`p-4 rounded-b-xl border border-t-0 shadow-sm ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
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
                        
                        {isLevelZeroOrAdmin && (
                            <div>
                                <label className="block mb-1 text-xs font-bold opacity-80 text-rose-600">وضعیت نامه</label>
                                <select className={inputClass} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="PENDING">در انتظار تایید</option>
                                    <option value="APPROVED">تایید شده</option>
                                    <option value="REJECTED">رد شده</option>
                                </select>
                            </div>
                        )}
                        
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
                    
                    {/* فیلدهای اختصاصی مدیران */}
                    {isLevelZeroOrAdmin && (
                        <div className={`col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-5 mt-5 p-4 rounded-lg border ${formData.letter_type === 'OUTGOING' ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                            <div>
                                <label className="block mb-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">شماره چاپی آریو بنیان توس</label>
                                <input type="text" dir="rtl" className={`${inputClass} text-right font-mono border-emerald-300 dark:border-emerald-700`} value={formData.original_number} onChange={(e) => setFormData({ ...formData, original_number: e.target.value })} />
                            </div>
                            <div className="relative">
                                <JalaliDatePicker name="original_date" label="تاریخ نامه چاپ شده" value={formData.original_date} onChange={(e) => setFormData({ ...formData, original_date: e.target.value })} />
                            </div>
                            
                            {/* 🚀 فیلدهای مقصد فقط در نامه‌های صادره نمایش داده می‌شوند */}
                            {formData.letter_type === 'OUTGOING' && (
                                <>
                                    <div>
                                        <label className="block mb-1 text-xs font-bold text-indigo-700 dark:text-indigo-400">شماره ثبت در مقصد</label>
                                        <input type="text" dir="rtl" className={`${inputClass} text-right font-mono border-indigo-300 dark:border-indigo-700`} value={formData.destination_indicator} onChange={(e) => setFormData({ ...formData, destination_indicator: e.target.value })} />
                                    </div>
                                    <div className="relative">
                                        <JalaliDatePicker name="destination_date" label="تاریخ تحویل تایید از مقصد" value={formData.destination_date} onChange={(e) => setFormData({ ...formData, destination_date: e.target.value })} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className={`p-4 rounded-xl border shadow-sm transition-all duration-500 ${
                    formData.letter_type === 'INCOMING' ? (isDark ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50/50 border-green-200') :
                    formData.letter_type === 'OUTGOING' ? (isDark ? 'bg-orange-900/10 border-orange-800/50' : 'bg-orange-50/50 border-orange-200') :
                    (isDark ? 'bg-purple-900/10 border-purple-800/50' : 'bg-purple-50/50 border-purple-200')
                }`}>
                    <datalist id="org-list">{organizations?.map(org => (<option key={org.id} value={org.name} />))}</datalist>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                        <div className={`space-y-3 p-4 rounded-lg transition-all duration-300 ${formData.letter_type === 'INCOMING' ? 'bg-white dark:bg-gray-800 shadow-md ring-2 ring-green-400' : 'bg-gray-500/5'}`}>
                            <span className={`text-sm font-bold opacity-80 block mb-2 ${formData.letter_type === 'INCOMING' ? 'text-green-600' : 'text-blue-600'}`}>اطلاعات مبدأ (فرستنده)</span>
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
                        <div className={`space-y-3 p-4 rounded-lg transition-all duration-300 ${formData.letter_type === 'OUTGOING' ? 'bg-white dark:bg-gray-800 shadow-md ring-2 ring-orange-400' : 'bg-gray-500/5'}`}>
                            <span className={`text-sm font-bold opacity-80 block mb-2 ${formData.letter_type === 'OUTGOING' ? 'text-orange-600' : 'text-indigo-600'}`}>اطلاعات مقصد (گیرنده)</span>
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
                            <input type="text" dir="rtl" className={`${inputClass} text-right font-mono`} value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">شماره قرارداد</label>
                            <input type="text" dir="rtl" className={`${inputClass} text-right font-mono`} value={formData.contract_number} onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })} />
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