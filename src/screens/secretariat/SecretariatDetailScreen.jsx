import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchLetterDetail, forwardLetter, fetchAllPersonnel, uploadAttachment, signLetter, deleteLetter, fetchLetterSmsLogs, refreshLetterSmsStatus } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaArrowRight, FaArrowLeft, FaShare, FaPrint, FaPaperclip, FaDownload, FaCamera, FaPenNib, FaTrash, FaEdit, FaChevronLeft, FaReply, FaLink, FaCheckCircle, FaTimesCircle, FaUserTie, FaHistory, FaChevronDown, FaSms, FaSyncAlt } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import logo from '../../assets/ario.png';
import axiosInstance from '../../api/axiosInstance'; 

const SearchablePersonnelSelect = ({ personnel, value, onChange, placeholder, isDark }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            const selected = personnel.find(p => String(p.id) === String(value));
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

    const filtered = personnel.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.position_title && p.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const inputClass = `w-full p-2.5 text-sm rounded-lg border focus:ring-2 focus:outline-none transition ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`;

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
                <ul className={`absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    {filtered.map(emp => (
                        <li 
                            key={emp.id}
                            className={`p-2.5 cursor-pointer text-sm border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`}
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
                    {filtered.length === 0 && <li className="p-3 text-sm opacity-50 text-center">موردی یافت نشد</li>}
                </ul>
            )}
        </div>
    );
};


const SecretariatDetailScreen = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { userInfo } = useSelector((state) => state.userLogin);
    const isLevelZeroOrAdmin = userInfo?.is_admin || (userInfo?.employee?.position?.hierarchy_level === 0);

    // 🚀 اضافه شدن متغیرهای مربوط به پیامک
    const { activeLetter: letter, loadingDetail, forwarding, allPersonnel, smsLogs, refreshingSms } = useSelector((state) => state.secretariat);

    const [showForward, setShowForward] = useState(false);
    const [forwardData, setForwardData] = useState({ receiver: '', instruction: '' });

    const sigCanvas = useRef({});
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [signing, setSigning] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(380);

    const [isApproving, setIsApproving] = useState(false); 
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [deliveryResponsible, setDeliveryResponsible] = useState('');

    useEffect(() => {
        dispatch(fetchLetterDetail(id));
        dispatch(fetchAllPersonnel());
        // 🚀 لود کردن لاگ‌های پیامک اگر کاربر ادمین است
        if (isLevelZeroOrAdmin) {
            dispatch(fetchLetterSmsLogs(id));
        }
    }, [dispatch, id, isLevelZeroOrAdmin]);

    useEffect(() => {
        const handleResize = () => setCanvasWidth(window.innerWidth < 450 ? window.innerWidth - 64 : 380);
        if (showSignaturePad) handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showSignaturePad]);

    const handleForward = (e) => {
        e.preventDefault();
        if (!forwardData.receiver) return toast.error('گیرنده ارجاع را انتخاب کنید');

        dispatch(forwardLetter({ letterId: id, payload: forwardData })).unwrap()
            .then(() => {
                toast.success('ارجاع با موفقیت انجام شد');
                setShowForward(false);
                setForwardData({ receiver: '', instruction: '' });
                dispatch(fetchLetterDetail(id)); 
            })
            .catch((err) => toast.error(err || 'خطا در ارجاع'));
    };

    const handleScanUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadToast = toast.loading('در حال آپلود سند...');
        dispatch(uploadAttachment({ letterId: id, file })).unwrap()
            .then(() => toast.success('سند با موفقیت اسکن و ضمیمه شد', { id: uploadToast }))
            .catch(() => toast.error('خطا در آپلود سند', { id: uploadToast }));
    };

    const handleSaveSignature = async () => {
        if (sigCanvas.current.isEmpty()) return toast.error("لطفا امضا را رسم کنید");
        const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
        setSigning(true);
        const signPromise = dispatch(signLetter({ letterId: id, signature: signatureBase64 })).unwrap();
        toast.promise(signPromise, { loading: 'ارسال امضا...', success: 'امضا ثبت شد!', error: 'خطا' });
        signPromise.then(() => setShowSignaturePad(false)).finally(() => setSigning(false));
    };

    const handleDelete = () => {
        if (window.confirm('آیا از حذف این نامه اطمینان دارید؟')) {
            dispatch(deleteLetter(id)).unwrap()
                .then(() => { toast.success('نامه حذف شد'); navigate('/secretariat'); })
                .catch(err => toast.error(err || 'خطا در حذف نامه'));
        }
    };

    const handleApprovalClick = (action) => {
        if (action === 'APPROVE' && letter.letter_type === 'OUTGOING') {
            setShowApprovalModal(true);
        } else {
            handleSimpleApproval(action);
        }
    };

    const handleSimpleApproval = async (action) => {
        if (!window.confirm(`آیا از ${action === 'APPROVE' ? 'تایید' : 'رد'} این نامه اطمینان دارید؟`)) return;
        setIsApproving(true);
        try {
            await axiosInstance.post(`/secretariat/${id}/approve/`, { action });
            toast.success(action === 'APPROVE' ? 'نامه تایید شد.' : 'نامه رد شد.');
            dispatch(fetchLetterDetail(id)); 
        } catch (err) {
            toast.error(err.response?.data?.detail || 'خطا در عملیات');
        } finally {
            setIsApproving(false);
        }
    };

    const submitApproveWithDelivery = async () => {
        if (!deliveryResponsible) return toast.error('انتخاب مسئول پیگیری الزامی است.');
        setIsApproving(true);
        try {
            await axiosInstance.post(`/secretariat/${id}/approve/`, { 
                action: 'APPROVE', 
                delivery_responsible: deliveryResponsible 
            });
            toast.success('نامه تایید و ارجاع داده شد و پیامک استعلام ارسال گردید.');
            setShowApprovalModal(false);
            dispatch(fetchLetterDetail(id)); 
            if (isLevelZeroOrAdmin) dispatch(fetchLetterSmsLogs(id)); // 🚀 رفرش لاگ‌ها
        } catch (err) {
            toast.error(err.response?.data?.detail || 'خطا در عملیات');
        } finally {
            setIsApproving(false);
        }
    };

    // 🚀 تابع رفرش وضعیت پیامک
    const handleRefreshSms = (logId) => {
        const loadingToast = toast.loading('در حال استعلام از مخابرات...');
        dispatch(refreshLetterSmsStatus(logId)).unwrap()
            .then(() => toast.success('وضعیت پیامک به‌روز شد', { id: loadingToast }))
            .catch(err => toast.error(err || 'خطا در استعلام', { id: loadingToast }));
    };

    if (loadingDetail || !letter) return <div className="text-center py-20 font-bold opacity-70">در حال دریافت پرونده...</div>;

    const boxClass = `p-5 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;
    const translateEnum = (val) => ({
        'INCOMING': 'وارده', 'OUTGOING': 'صادره', 'INTERNAL': 'داخلی',
        'NORMAL': 'عادی', 'URGENT': 'فوری', 'VERY_URGENT': 'خیلی فوری',
        'CONFIDENTIAL': 'محرمانه', 'SECRET': 'سری',
        'PENDING': 'در انتظار', 'APPROVED': 'تایید شده', 'REJECTED': 'رد شده'
    }[val] || val);

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 print:p-0 print:m-0 print:w-full print:max-w-none relative">
            <style type="text/css">
                {`@media print { @page { size: A4 portrait; margin: 1.5cm; } body { background: white !important; color: black !important; } .print-hidden { display: none !important; } }`}
            </style>

            {showApprovalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'}`}>
                        <h3 className="text-lg font-black mb-2 flex items-center gap-2 text-blue-500">
                            <FaCheckCircle /> تایید صدور و تخصیص مسئول
                        </h3>
                        <p className="text-[13px] opacity-80 mb-6 leading-relaxed">
                            این نامه از نوع <b>صادره</b> است. لطفاً شخصی که مسئول فیزیکیِ بردنِ نامه به سازمان مقصد می‌باشد را مشخص کنید تا سیستماً به ایشان ارجاع داده شده و <b>پیامک</b> ارسال شود.
                        </p>
                        
                        <div className="mb-8">
                            <label className="block text-sm font-bold mb-2 opacity-80">مسئول تحویل و پیگیری <span className="text-red-500">*</span></label>
                            <SearchablePersonnelSelect 
                                personnel={allPersonnel} 
                                value={deliveryResponsible} 
                                onChange={setDeliveryResponsible} 
                                placeholder="جستجو و انتخاب پرسنل..." 
                                isDark={isDark} 
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <button onClick={() => setShowApprovalModal(false)} className="px-5 py-2.5 rounded-lg bg-gray-500 text-white font-bold text-sm transition hover:bg-gray-600">انصراف</button>
                            <button 
                                onClick={submitApproveWithDelivery} 
                                disabled={isApproving || !deliveryResponsible}
                                className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white font-bold text-sm transition hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {isApproving ? 'در حال ثبت...' : 'تایید نهایی'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold print:hidden mb-4 overflow-x-auto whitespace-nowrap h-6">
                <Link to="/secretariat" className="text-blue-500 hover:text-blue-700">دبیرخانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className="text-blue-500">مکاتبات {translateEnum(letter.letter_type)}</span>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>نامه {letter.indicator_number}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="flex gap-2 items-center">
                    <button onClick={() => navigate('/secretariat')} className="flex items-center gap-2 font-bold opacity-70 hover:opacity-100 transition px-2">
                        <FaArrowRight /> بازگشت
                    </button>
                    {((letter.status === 'PENDING' && letter.created_by?.id === userInfo?.id) || isLevelZeroOrAdmin) && (
                        <>
                            <button onClick={() => navigate(`/secretariat/${id}/edit`)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold border transition ${isDark ? 'border-blue-600 text-blue-400 hover:bg-blue-900/30' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}><FaEdit /> ویرایش</button>
                            <button onClick={handleDelete} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold border transition ${isDark ? 'border-red-600 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'}`}><FaTrash /> حذف</button>
                        </>
                    )}
                </div>

                <div className="flex gap-3 flex-wrap">
                    <button onClick={() => navigate('/secretariat/create', { state: { replyTo: { id: letter.id, indicator: letter.indicator_number, subject: letter.subject } } })} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-700"><FaReply /> پاسخ</button>
                    {isLevelZeroOrAdmin && letter.status === 'PENDING' && (
                        <>
                            <button onClick={() => handleApprovalClick('APPROVE')} disabled={isApproving} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-700"><FaCheckCircle /> تایید صدور</button>
                            <button onClick={() => handleApprovalClick('REJECT')} disabled={isApproving} className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-rose-700"><FaTimesCircle /> رد نامه</button>
                        </>
                    )}
                    {!letter.drawn_signature && letter.letter_type !== 'INCOMING' && letter.status === 'APPROVED' && (
                        <button onClick={() => setShowSignaturePad(!showSignaturePad)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-green-700"><FaPenNib /> امضا</button>
                    )}
                    <button onClick={() => window.print()} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition border ${isDark ? 'border-gray-600 text-white hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}><FaPrint /> چاپ</button>
                    <button onClick={() => setShowForward(!showForward)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-indigo-700"><FaShare /> ارجاع</button>
                </div>
            </div>

            {letter.status === 'PENDING' && <div className="p-4 rounded-xl border-l-4 text-orange-800 border-orange-500 font-bold text-sm bg-orange-100">⚠️ این نامه پیش‌نویس است و هنوز به تایید مدیریت نرسیده است.</div>}
            {letter.status === 'REJECTED' && <div className="p-4 rounded-xl border-l-4 text-red-800 border-red-500 font-bold text-sm bg-red-100">❌ این نامه توسط مدیریت رد شده است.</div>}

            {showSignaturePad && (
                <div className={`p-4 rounded-xl border-2 border-green-500 print:hidden flex flex-col items-center ${isDark ? 'bg-slate-800' : 'bg-green-50'}`}>
                    <h4 className="font-bold mb-3 text-green-700">امضای دیجیتال خود را رسم کنید</h4>
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-400 overflow-hidden w-full max-w-sm flex justify-center">
                        <SignatureCanvas ref={sigCanvas} penColor="darkblue" canvasProps={{ width: canvasWidth, height: 200, className: 'sigCanvas cursor-crosshair touch-none bg-white' }} />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => sigCanvas.current.clear()} disabled={signing} className="px-5 py-2 bg-gray-300 hover:bg-gray-400 rounded-lg text-sm font-bold text-gray-800">پاک کردن</button>
                        <button onClick={handleSaveSignature} disabled={signing} className="px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-bold">{signing ? 'پردازش...' : 'تایید امضا'}</button>
                    </div>
                </div>
            )}

            {showForward && (
                <div className={`p-4 rounded-xl border-l-4 border-indigo-500 print:hidden ${isDark ? 'bg-slate-800' : 'bg-indigo-50'}`}>
                    <form onSubmit={handleForward} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold mb-2">گیرنده ارجاع</label>
                            <select className={`w-full p-2 rounded-lg border outline-none ${isDark ? 'bg-slate-900 text-white border-slate-600' : 'bg-white text-gray-800 border-gray-300'}`} value={forwardData.receiver} onChange={(e) => setForwardData({ ...forwardData, receiver: e.target.value })}>
                                <option value="">انتخاب...</option>
                                {allPersonnel?.map((emp) => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                            </select>
                        </div>
                        <div className="flex-[2] w-full">
                            <label className="block text-sm font-bold mb-2">شرح ارجاع</label>
                            <input type="text" className={`w-full p-2 rounded-lg border outline-none ${isDark ? 'bg-slate-900 text-white border-slate-600' : 'bg-white border-gray-300 text-gray-800'}`} value={forwardData.instruction} onChange={(e) => setForwardData({ ...forwardData, instruction: e.target.value })} />
                        </div>
                        <button type="submit" disabled={forwarding} className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold h-[42px] active:scale-95">{forwarding ? '...' : 'ارسال'}</button>
                    </form>
                </div>
            )}

            <div className={`${boxClass} ${letter.status !== 'APPROVED' ? 'opacity-50 grayscale print:hidden' : ''} print:block print:p-4 print:border-none print:shadow-none print:bg-white print:text-black overflow-hidden relative`}>
                <div className="flex justify-between items-start border-b-4 border-gray-300 print:border-black pb-4 mb-6 relative">
                    <div className="flex flex-col items-center justify-center w-1/3">
                        {letter.letter_type === 'INCOMING' && letter.external_sender_detail?.logo ? (
                            <img src={letter.external_sender_detail.logo} alt="لوگو" className="h-14 md:h-16 object-contain mb-2 print:h-16" />
                        ) : (
                            <img src={logo} alt="لوگو" className="h-14 md:h-16 object-contain mb-2 print:h-16" />
                        )}
                        <span className="font-bold text-[11px] md:text-sm print:text-sm text-center">{letter.final_sender_name}</span>
                    </div>
                    <div className="flex flex-col items-center justify-start w-1/3 pt-2 md:pt-4">
                        <span className="font-bold text-lg md:text-xl print:text-2xl tracking-widest">بسمه تعالی</span>
                    </div>

                    <div className="flex flex-col text-[11px] md:text-sm print:text-sm font-bold w-1/3 items-end space-y-1.5 pt-2 md:pt-4">
                        <div className="flex items-center gap-2"><span className="opacity-70 print:opacity-100 font-normal">شماره سیستمی:</span> <span className="font-mono text-blue-600">{letter.indicator_number}</span></div>
                        
                        {letter.original_number ? (
                            <div className="flex items-center gap-2"><span className="opacity-70 print:opacity-100 font-normal">شماره فیزیکی:</span> <bdi className="font-mono font-bold" dir="ltr">{letter.original_number}</bdi></div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-500 print:hidden"><span className="opacity-70 font-normal">شماره فیزیکی:</span> <span>پس از تایید</span></div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <span className="opacity-70 print:opacity-100 font-normal">تاریخ ثبت:</span> 
                            <span>{new Date(letter.created_at).toLocaleDateString('fa-IR')}</span>
                        </div>
                        
                        {letter.original_date && <div className="flex items-center gap-2 text-blue-700 print:text-black"><span className="opacity-70 print:opacity-100 font-normal">تاریخ مبدأ:</span> <span>{new Date(letter.original_date).toLocaleDateString('fa-IR')}</span></div>}
                        <div className="flex items-center gap-2"><span className="opacity-70 print:opacity-100 font-normal">پیوست:</span> <span>{letter.attachment_note || (letter.attachments?.length > 0 ? 'دارد' : 'ندارد')}</span></div>
                        
                        <div className="border-t border-dashed border-gray-300 pt-1 mt-1 w-full flex flex-col items-end space-y-1">
                            {letter.created_by_name && (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="opacity-70 font-normal text-[10px]">ثبت کننده:</span> <span className="text-[10px]">{letter.created_by_name}</span>
                                </div>
                            )}
                            {letter.status === 'APPROVED' && letter.approved_by_name && (
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <span className="opacity-70 font-normal text-[10px]">تاییدکننده:</span> <span className="text-[10px]">{letter.approved_by_name}</span>
                                </div>
                            )}
                            {letter.delivery_responsible_name && (
                                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 print:text-black mt-1">
                                    <span className="opacity-70 font-normal text-[10px]">مسئول پیگیری:</span> <span className="text-[10px] font-bold bg-indigo-50 dark:bg-indigo-900/30 px-1 py-0.5 rounded">{letter.delivery_responsible_name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 items-center mb-6 print:hidden">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${letter.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : letter.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>{translateEnum(letter.status)}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${letter.letter_type === 'INCOMING' ? 'bg-green-100 text-green-700' : letter.letter_type === 'OUTGOING' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>نامه {translateEnum(letter.letter_type)}</span>
                </div>

                {(letter.reference_letter_detail || (letter.replies && letter.replies.length > 0)) && (
                    <div className={`p-4 mb-6 rounded-xl border-l-4 print:hidden ${isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-500'}`}>
                        {letter.reference_letter_detail && (
                            <div className="flex items-center gap-2 mb-2">
                                <FaArrowRight className="text-blue-500 text-xs" />
                                <span className="text-sm font-bold opacity-80">پاسخی است به:</span>
                                <Link to={`/secretariat/${letter.reference_letter_detail.id}`} className="text-sm font-bold text-blue-600 hover:underline">
                                    نامه {letter.reference_letter_detail.indicator_number}
                                </Link>
                            </div>
                        )}
                        {letter.replies && letter.replies.length > 0 && (
                            <div className="flex items-start gap-2 mt-2">
                                <FaLink className="text-blue-500 text-xs mt-1" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold opacity-80 mb-1">پاسخ‌های این نامه:</span>
                                    {letter.replies.map(reply => (
                                        <Link key={reply.id} to={`/secretariat/${reply.id}`} className="text-sm font-bold text-emerald-600 hover:underline before:content-['•'] before:ml-2">
                                            نامه {reply.indicator_number}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3 mb-8 text-sm md:text-base print:text-base leading-relaxed">
                    <div className="flex items-baseline">
                        <span className="w-24 opacity-80 print:opacity-100 font-normal">گیرنده (به):</span> 
                        <strong className="text-lg">{letter.final_receiver_name}</strong>
                    </div>

                    {letter.receiver_persons && (
                        <div className="flex items-start mt-2 border-r-2 border-gray-400 print:border-black pr-3 ml-2 text-sm">
                            <span className="opacity-70 print:opacity-100 font-normal ml-2">عناوین:</span> 
                            <p className="whitespace-pre-wrap font-bold leading-relaxed">{letter.receiver_persons}</p>
                        </div>
                    )}
                    
                    <div className="flex items-baseline mt-4">
                        <span className="w-24 opacity-80 print:opacity-100 font-normal">فرستنده (از):</span> 
                        <strong className="text-lg">{letter.external_sender_detail?.name || letter.internal_sender_name || '-'}</strong>
                    </div>

                    <div className="flex items-baseline mt-4">
                        <span className="w-24 opacity-80 print:opacity-100 font-normal">موضوع:</span> 
                        <strong className="text-lg border-b-2 border-gray-400 print:border-black pb-1 flex-1">{letter.subject}</strong>
                    </div>
                    {letter.reference_number && <div className="flex items-baseline mt-4"><span className="w-24 opacity-80">عطف به:</span> <strong className="text-base font-mono" dir="ltr">{letter.reference_number}</strong></div>}
                    {letter.contract_number && <div className="flex items-baseline"><span className="w-24 opacity-80">شماره قرارداد:</span> <strong className="text-base font-mono" dir="ltr">{letter.contract_number}</strong></div>}
                    
                    {letter.letter_type === 'OUTGOING' && (letter.destination_indicator || letter.destination_date) && (
                        <div className="flex gap-6 mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg dark:bg-indigo-900/30 dark:border-indigo-800">
                            {letter.destination_indicator && <div className="flex items-baseline"><span className="w-auto ml-2 opacity-80 text-indigo-700 dark:text-indigo-400">شماره ثبت مقصد:</span> <strong className="font-mono text-indigo-800 dark:text-indigo-300" dir="ltr">{letter.destination_indicator}</strong></div>}
                            {letter.destination_date && <div className="flex items-baseline"><span className="w-auto ml-2 opacity-80 text-indigo-700 dark:text-indigo-400">تاریخ دریافت:</span> <strong className="text-indigo-800 dark:text-indigo-300">{new Date(letter.destination_date).toLocaleDateString('fa-IR')}</strong></div>}
                        </div>
                    )}
                </div>

                {letter.body && (
                    <div className={`text-justify leading-loose min-h-[300px] mb-12 text-sm md:text-base print:text-base whitespace-pre-wrap font-medium p-6 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-700 text-slate-200' : 'bg-gray-50 border-gray-200 text-gray-800'} print:border-none print:bg-transparent print:p-0`}>
                        {letter.body}
                    </div>
                )}

                <div className="flex justify-between items-start pt-8">
                    <div className="w-1/2 text-xs print:text-sm opacity-80 print:opacity-100">
                        {(letter.cc_text || letter.internal_cc_names?.length > 0) && (
                            <div className="border-t border-gray-400 print:border-black pt-2 pr-2 mt-4 inline-block min-w-[200px]">
                                <strong className="block mb-2 text-sm">رونوشت:</strong>
                                {letter.cc_text && <p className="whitespace-pre-wrap mb-1">{letter.cc_text}</p>}
                                {letter.internal_cc_names?.map((name, i) => <div key={i}>- {name}</div>)}
                            </div>
                        )}
                    </div>
                    <div className="w-1/2 flex flex-col items-center text-center relative">
                        <strong className="mb-2 text-sm print:text-base">مهر و امضا</strong>
                        <div className="h-20 flex justify-center items-center">
                            {letter.drawn_signature ? <img src={letter.drawn_signature} alt="امضا" className="h-20 object-contain mix-blend-multiply" /> : <div className="h-20"></div>}
                        </div>
                        <div className="flex flex-col items-center mt-2 text-center">
                            {letter.manual_sender_name && (
                                <span className="font-bold text-base print:text-lg whitespace-pre-wrap print:text-black leading-relaxed">{letter.manual_sender_name}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🚀 لاگ پیامک‌های ارجاع (فقط برای مدیران در نامه‌های صادره) */}
                {isLevelZeroOrAdmin && letter.letter_type === 'OUTGOING' && smsLogs && smsLogs.length > 0 && (
                    <div className={`mt-10 pt-6 border-t border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} print:hidden`}>
                        <h4 className="text-sm font-black mb-4 flex items-center gap-2 opacity-80 text-indigo-500">
                            <FaSms /> وضعیت پیامک‌های ارجاعی
                        </h4>
                        <div className="space-y-2">
                            {smsLogs.map((log) => (
                                <div key={log.id} className={`p-3 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                            log.delivery_status === 'DELIVERED' ? 'bg-emerald-500' : 
                                            log.delivery_status === 'FAILED' ? 'bg-red-500' : 'bg-orange-500'
                                        }`}>
                                            <FaSms size={14} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">گیرنده: {log.to_user} ({log.phone})</span>
                                            <span className="text-[10px] font-medium opacity-60 mt-0.5">
                                                {new Date(log.created_at).toLocaleString('fa-IR')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[11px] font-bold px-2 py-1 rounded border ${
                                            log.delivery_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                                            log.delivery_status === 'FAILED' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                                        }`}>
                                            {log.delivery_status === 'DELIVERED' ? '✅ تحویل شده به گوشی' :
                                             log.delivery_status === 'FAILED' ? `❌ ${log.error || 'ارسال ناموفق'}` :
                                             '⏳ در انتظار مخابرات'}
                                        </span>
                                        
                                        {/* دکمه استعلام فقط اگر تحویل نشده باشد فعال است */}
                                        <button 
                                            onClick={() => handleRefreshSms(log.id)}
                                            disabled={refreshingSms || log.delivery_status === 'DELIVERED'}
                                            className="text-[10px] flex items-center gap-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-2 py-1.5 rounded transition disabled:opacity-30"
                                        >
                                            <FaSyncAlt className={refreshingSms ? "animate-spin" : ""} /> استعلام
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {letter.referrals && letter.referrals.length > 0 && (
                    <div className={`mt-10 pt-6 border-t border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} print:border-gray-400`}>
                        <h4 className="text-sm font-black mb-4 flex items-center gap-2 opacity-80 text-indigo-600 print:text-black"><FaHistory /> تاریخچه ارجاعات</h4>
                        <div className="space-y-3">
                            {letter.referrals.map((ref) => (
                                <div key={ref.id} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'} print:border-gray-300 print:bg-transparent`}>
                                    <div className="flex justify-between items-center mb-1.5 border-b border-gray-200 dark:border-gray-700 print:border-gray-300 pb-1.5">
                                        <div className="flex items-center gap-2 text-[11px] font-bold">
                                            <span className="text-blue-600 dark:text-blue-400 print:text-black">{ref.sender_name}</span>
                                            <FaArrowLeft className="text-gray-400 text-[10px]" />
                                            <span className="text-emerald-600 dark:text-emerald-400 print:text-black">{ref.receiver_name}</span>
                                        </div>
                                        <span className="text-[9px] font-medium opacity-60 font-mono" dir="ltr">{new Date(ref.created_at).toLocaleString('fa-IR')}</span>
                                    </div>
                                    <div className="text-xs leading-relaxed font-bold text-gray-800 dark:text-gray-200 print:text-black">
                                        {ref.instruction ? <span className="whitespace-pre-wrap"><span className="opacity-50 text-[10px] ml-1">شرح:</span> {ref.instruction}</span> : <span className="opacity-40 italic font-normal">فقط ارجاع</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className={`${boxClass} print:hidden`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2 opacity-80"><FaPaperclip /> پیوست‌ها ({letter.attachments?.length || 0})</h3>
                    <label className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-lg cursor-pointer transition text-xs font-bold shadow-md hover:bg-emerald-700">
                        <FaCamera /> اسکن
                        <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={handleScanUpload} />
                    </label>
                </div>
                {letter.attachments?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {letter.attachments.map(file => (
                            <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 rounded-lg border transition ${isDark ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}>
                                <span className="text-sm truncate font-bold" dir="ltr">{file.name}</span><FaDownload className="text-blue-500 ml-2" />
                            </a>
                        ))}
                    </div>
                ) : <div className="text-center py-4 text-sm opacity-60">هیچ سندی پیوست نشده است.</div>}
            </div>
        </div>
    );
};
export default SecretariatDetailScreen;