import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { createLetter, clearCreateSuccess, fetchAllPersonnel, fetchOrganizations, fetchLetters } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaMagic, FaTrashAlt } from 'react-icons/fa';
import JalaliDatePicker from '../../components/JalaliDatePicker'; 

const DRAFT_KEY = 'secretariat_create_draft';

const SecretariatCreateScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); 
    const replyData = location.state?.replyTo; 

    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { creating, createSuccess, error, allPersonnel, organizations, letters } = useSelector((state) => state.secretariat);

    const [attachments, setAttachments] = useState(null);
    const [formData, setFormData] = useState({
        subject: '',
        letter_type: 'INTERNAL',
        indicator_number: '',
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
        reference_letter: '', // 🚀 فیلد سیستمی عطف
        cc_text: '',
        internal_cc_receivers: [], 
    });

    const generateIndicator = (type) => {
        const prefix = type === 'INTERNAL' ? 'INT' : type === 'INCOMING' ? 'INC' : 'OUT';
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        const datePart = new Date().toLocaleDateString('fa-IR').replace(/\//g, '');
        return `${prefix}-${datePart}-${randomCode}`;
    };

    useEffect(() => {
        dispatch(fetchAllPersonnel());
        dispatch(fetchOrganizations()); 
        if (!letters || letters.length === 0) dispatch(fetchLetters({}));
        
        if (replyData) {
            setFormData(prev => ({
                ...prev,
                letter_type: 'OUTGOING',
                indicator_number: generateIndicator('OUTGOING'),
                subject: `پاسخ به: ${replyData.subject}`,
                reference_number: replyData.indicator,
                reference_letter: replyData.id, // 🚀 متصل کردن خودکار آیدی نامه پدر
            }));
            toast('فرم در حالت پاسخ به نامه تنظیم شد', { icon: '📝' });
        } else {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    const newIndicator = generateIndicator(parsedDraft.letter_type || 'INTERNAL');
                    setFormData({
                        ...parsedDraft,
                        indicator_number: newIndicator
                    });
                    toast('فرم ناتمام قبلی بازیابی شد', { icon: '♻️', duration: 4000 });
                } catch (err) {
                    setFormData(prev => ({ ...prev, indicator_number: generateIndicator('INTERNAL') }));
                }
            } else {
                setFormData(prev => ({ ...prev, indicator_number: generateIndicator('INTERNAL') }));
            }
        }
    }, [dispatch, replyData]);

    useEffect(() => {
        if (formData.indicator_number && !replyData) { 
            localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        }
    }, [formData, replyData]);

    useEffect(() => {
        if (createSuccess) {
            localStorage.removeItem(DRAFT_KEY);
            toast.success('مکاتبه با موفقیت ثبت و ضمیمه شد');
            dispatch(clearCreateSuccess());
            navigate('/secretariat');
        }
    }, [createSuccess, dispatch, navigate]);

    const handleClearDraft = () => {
        if (window.confirm('آیا از پاک کردن کامل فرم مطمئن هستید؟ تمام اطلاعات تایپ شده حذف خواهند شد.')) {
            localStorage.removeItem(DRAFT_KEY);
            navigate('/secretariat/create', { replace: true, state: {} }); 
            window.location.reload(); 
        }
    };

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
        setFormData(prev => ({ ...prev, indicator_number: generateIndicator(newType) }));
    };

    const handleMultiSelectChange = (e) => {
        const values = Array.from(e.target.selectedOptions, option => option.value);
        setFormData({ ...formData, internal_cc_receivers: values });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.subject || !formData.indicator_number) {
            return toast.error('موضوع و شماره اندیکاتور الزامی است');
        }

        const fd = new FormData();

        Object.keys(formData).forEach(key => {
            if (Array.isArray(formData[key])) {
                formData[key].forEach(val => fd.append(key, val));
            } else if (formData[key] !== null && formData[key] !== '' && formData[key] !== undefined) {
                fd.append(key, formData[key]);
            }
        });

        if (attachments && attachments.length > 0) {
            for (let i = 0; i < attachments.length; i++) {
                fd.append('attachments', attachments[i]);
            }
        }

        dispatch(createLetter(fd));
    };

    const inputClass = `w-full p-2.5 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${
        isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900 focus:ring-blue-400'
    }`;

    return (
        <div className="max-w-5xl mx-auto p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {replyData ? 'ثبت پاسخ نامه' : 'ثبت مکاتبه جدید'}
                </h2>
                <button 
                    type="button" 
                    onClick={handleClearDraft}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-bold transition-colors"
                >
                    <FaTrashAlt /> پاک کردن فرم
                </button>
            </div>
            
            {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-lg text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">

                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <h3 className="font-bold mb-4 border-b pb-2 opacity-80">اطلاعات ثبتی و شماره‌گذاری</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">نوع نامه</label>
                            <select className={inputClass} value={formData.letter_type} onChange={handleTypeChange}>
                                <option value="INTERNAL">داخلی (بین واحدها)</option>
                                <option value="INCOMING">وارده (دریافتی)</option>
                                <option value="OUTGOING">صادره (به خارج سازمان)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80 flex justify-between">
                                شماره اندیکاتور (سیستمی)
                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, indicator_number: generateIndicator(formData.letter_type) }))} className="text-blue-500 hover:text-blue-600 flex items-center gap-1">
                                    <FaMagic /> بازتولید
                                </button>
                            </label>
                            <input type="text" dir="ltr" className={`${inputClass} font-mono font-bold text-left bg-opacity-50 pointer-events-none`} value={formData.indicator_number} readOnly />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">تاریخ ثبت سیستم</label>
                            <input type="text" className={`${inputClass} bg-opacity-50 pointer-events-none text-center`} value={new Date().toLocaleDateString('fa-IR')} readOnly />
                        </div>

                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">شماره نامه فیزیکی / مبدأ</label>
                            <input 
                                type="text" 
                                dir="rtl"
                                placeholder="مثال: ۱۲۳/۴۵۶/د" 
                                className={`${inputClass} text-right font-mono`} 
                                value={formData.original_number} 
                                onChange={(e) => setFormData({ ...formData, original_number: e.target.value })} 
                            />
                        </div>
                        <div className="relative">
                            <JalaliDatePicker name="original_date" label="تاریخ نامه فیزیکی / مبدأ" value={formData.original_date} onChange={(e) => setFormData({ ...formData, original_date: e.target.value })} placeholder="انتخاب تاریخ روی کاغذ" />
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
                    <h3 className="font-bold mb-4 border-b pb-2 opacity-80">ارتباطات و موضوع</h3>

                    <datalist id="org-list">
                        {organizations?.map(org => (<option key={org.id} value={org.name} />))}
                    </datalist>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                        <div className="space-y-3 p-4 rounded-lg bg-gray-500/5 border border-gray-500/10">
                            <span className="text-sm font-bold opacity-80 block mb-2 text-blue-600">اطلاعات مبدأ (فرستنده)</span>
                            {formData.letter_type === 'INCOMING' ? (
                                <input 
                                    type="text" 
                                    list="org-list"
                                    placeholder="نام سازمان یا شخص را تایپ/انتخاب کنید..." 
                                    className={inputClass} 
                                    value={formData.external_sender} 
                                    onChange={(e) => setFormData({ ...formData, external_sender: e.target.value })} 
                                />
                            ) : (
                                <select className={inputClass} value={formData.internal_sender} onChange={(e) => setFormData({ ...formData, internal_sender: e.target.value })}>
                                    <option value="">نامشخص / ثبت دستی در پایین</option>
                                    {allPersonnel?.map(emp => (
                                        <option key={`sender-${emp.id}`} value={emp.id}>
                                            {emp.name} - {emp.position_title || 'بدون سمت'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="space-y-3 p-4 rounded-lg bg-gray-500/5 border border-gray-500/10">
                            <span className="text-sm font-bold opacity-80 block mb-2 text-indigo-600">اطلاعات مقصد (گیرنده)</span>
                            {formData.letter_type === 'OUTGOING' ? (
                                <input 
                                    type="text" 
                                    list="org-list"
                                    placeholder="نام سازمان یا شخص را تایپ/انتخاب کنید..." 
                                    className={inputClass} 
                                    value={formData.external_receiver} 
                                    onChange={(e) => setFormData({ ...formData, external_receiver: e.target.value })} 
                                />
                            ) : (
                                <select className={inputClass} value={formData.internal_receiver} onChange={(e) => setFormData({ ...formData, internal_receiver: e.target.value })}>
                                    <option value="">نامشخص / ثبت دستی در پایین</option>
                                    {allPersonnel?.map(emp => (
                                        <option key={`receiver-${emp.id}`} value={emp.id}>
                                            {emp.name} - {emp.position_title || 'بدون سمت'}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">عنوان دستی گیرنده (چاپ در بالای نامه - اختیاری)</label>
                            <textarea rows="2" placeholder="مثال: شرکت فلان..." className={inputClass} value={formData.manual_receiver_name} onChange={(e) => setFormData({ ...formData, manual_receiver_name: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">عنوان دستی فرستنده (چاپ در محل امضا - اختیاری)</label>
                            <textarea rows="2" placeholder="مثال: مدیرعامل شرکت آریو بنیان توس" className={inputClass} value={formData.manual_sender_name} onChange={(e) => setFormData({ ...formData, manual_sender_name: e.target.value })}></textarea>
                        </div>
                    </div>

                    <div className="mb-5">
                        <label className="block mb-1 text-xs font-bold opacity-80">عناوین اشخاص گیرنده (متنی - چاپ در زیر گیرنده اصلی)</label>
                        <textarea rows="2" placeholder="مثال: مدیرعامل محترم شرکت..." className={inputClass} value={formData.receiver_persons} onChange={(e) => setFormData({ ...formData, receiver_persons: e.target.value })}></textarea>
                    </div>

                    {/* 🚀 فیلد سیستمی ارتباط بین نامه‌ها برای صفحه ثبت */}
                    <div className={`mb-5 p-4 rounded-lg border ${isDark ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                        <label className="block mb-2 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            ارتباط سیستمی (این نامه پاسخی است به کدام نامه؟)
                        </label>
                        <select className={inputClass} value={formData.reference_letter} onChange={(e) => setFormData({ ...formData, reference_letter: e.target.value })}>
                            <option value="">-- بدون ارتباط سیستمی --</option>
                            {letters?.map(l => (
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
                            <input type="text" dir="rtl" placeholder="مثال: ۱۴۰۳/۲۵۸/م" className={`${inputClass} text-right font-mono`} value={formData.reference_number} onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">شماره قرارداد</label>
                            <input type="text" dir="rtl" placeholder="مثال: ۱۲۴۵/ق" className={`${inputClass} text-right font-mono`} value={formData.contract_number} onChange={(e) => setFormData({ ...formData, contract_number: e.target.value })} />
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">پیوست (متن روی سربرگ)</label>
                            <input type="text" placeholder="مثال: دارد / ۳ برگ" className={inputClass} value={formData.attachment_note} onChange={(e) => setFormData({ ...formData, attachment_note: e.target.value })} />
                        </div>
                    </div>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
                    <div className="mb-4">
                        <label className="block mb-1 text-xs font-bold opacity-80">متن یا چکیده نامه</label>
                        <textarea rows="4" className={inputClass} value={formData.body} onChange={(e) => setFormData({ ...formData, body: e.target.value })}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-lg bg-gray-500/5 border border-gray-500/10">
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">رونوشت کاغذی (تایپ متن زیر نامه)</label>
                            <textarea rows="3" placeholder="مثال: رونوشت به واحد مالی جهت اطلاع" className={inputClass} value={formData.cc_text} onChange={(e) => setFormData({ ...formData, cc_text: e.target.value })}></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 text-xs font-bold opacity-80">ارسال رونوشت سیستمی (نگه داشتن Ctrl برای چند انتخاب)</label>
                            <select multiple className={`${inputClass} h-[84px]`} value={formData.internal_cc_receivers} onChange={handleMultiSelectChange}>
                                {allPersonnel?.map(emp => (
                                    <option key={`cc-${emp.id}`} value={emp.id}>
                                        {emp.name} - {emp.position_title || 'بدون سمت'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-5 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                        <label className="block mb-2 text-sm font-bold opacity-80">آپلود اسکن نامه و ضمائم</label>
                        <input type="file" multiple onChange={(e) => setAttachments(e.target.files)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition cursor-pointer" />
                    </div>        

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center p-3 rounded bg-gray-500/5">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold opacity-80">
                            <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={formData.has_physical_copy} onChange={(e) => setFormData({ ...formData, has_physical_copy: e.target.checked })} />
                            نامه دارای نسخه فیزیکی (کاغذی) است
                        </label>
                        {formData.has_physical_copy && (
                            <input type="text" placeholder="محل بایگانی زونکن (مثلا: زونکن قراردادهای الف)" className={inputClass} value={formData.physical_archive_location} onChange={(e) => setFormData({ ...formData, physical_archive_location: e.target.value })} />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pb-6">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg bg-gray-500 text-white hover:bg-gray-600 font-bold text-sm">انصراف</button>
                    <button type="submit" disabled={creating} className="px-8 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-bold text-sm shadow-lg transition-transform active:scale-95">
                        {creating ? 'در حال ثبت...' : 'ثبت قطعی در دبیرخانه'}
                    </button>
                </div>
            </form>
        </div>
    );
};
export default SecretariatCreateScreen;