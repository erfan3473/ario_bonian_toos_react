import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchLetterDetail, forwardLetter, fetchAllPersonnel, uploadAttachment, signLetter, deleteLetter } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaArrowRight, FaShare, FaPrint, FaPaperclip, FaDownload, FaCamera, FaPenNib, FaTrash, FaEdit, FaChevronLeft, FaReply, FaLink } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import logo from '../../assets/ario.png';

const SecretariatDetailScreen = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { userInfo } = useSelector((state) => state.userLogin);
    
    const isAdmin = userInfo?.is_admin;

    const { activeLetter: letter, loadingDetail, forwarding, allPersonnel } = useSelector((state) => state.secretariat);

    const [showForward, setShowForward] = useState(false);
    const [forwardData, setForwardData] = useState({ receiver: '', instruction: '' });

    const sigCanvas = useRef({});
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [signing, setSigning] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(380);

    useEffect(() => {
        dispatch(fetchLetterDetail(id));
        dispatch(fetchAllPersonnel());
    }, [dispatch, id]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 450) {
                setCanvasWidth(window.innerWidth - 64);
            } else {
                setCanvasWidth(380);
            }
        };

        if (showSignaturePad) {
            handleResize();
        }

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
            })
            .catch((err) => toast.error(err || 'خطا در ارجاع'));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleScanUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadToast = toast.loading('در حال آپلود سند و ضمیمه کردن به نامه...');
        dispatch(uploadAttachment({ letterId: id, file })).unwrap()
            .then(() => toast.success('سند با موفقیت اسکن و ضمیمه شد', { id: uploadToast }))
            .catch(() => toast.error('خطا در آپلود سند', { id: uploadToast }));
    };

    const handleSaveSignature = async () => {
        if (sigCanvas.current.isEmpty()) return toast.error("لطفا امضا را رسم کنید");
        
        const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
        setSigning(true);
        
        const signPromise = dispatch(signLetter({ letterId: id, signature: signatureBase64 })).unwrap();
        
        toast.promise(signPromise, {
            loading: 'در حال ارسال و ثبت امضا...',
            success: 'امضا با موفقیت روی نامه ثبت شد!',
            error: 'خطا در برقراری ارتباط با سرور و ثبت امضا'
        });

        signPromise
            .then(() => setShowSignaturePad(false))
            .catch((err) => console.error("Signature Error: ", err))
            .finally(() => setSigning(false));
    };

    const handleDelete = () => {
        if (window.confirm('آیا از حذف این نامه اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) {
            dispatch(deleteLetter(id)).unwrap()
                .then(() => {
                    toast.success('نامه با موفقیت حذف شد');
                    navigate('/secretariat'); 
                })
                .catch(err => toast.error(err || 'خطا در حذف نامه'));
        }
    };

    // 🚀 تابع انتقال به فرم ثبت نامه برای پاسخ دادن
    const handleReplyLetter = () => {
        navigate('/secretariat/create', { 
            state: { 
                replyTo: { 
                    id: letter.id, 
                    indicator: letter.indicator_number, 
                    subject: letter.subject 
                } 
            } 
        });
    };

    if (loadingDetail || !letter) return <div className="text-center py-20 font-bold opacity-70">در حال دریافت پرونده...</div>;

    const boxClass = `p-5 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`;

    const translateEnum = (val) => {
        const dict = {
            'INCOMING': 'وارده', 'OUTGOING': 'صادره', 'INTERNAL': 'داخلی',
            'NORMAL': 'عادی', 'URGENT': 'فوری', 'VERY_URGENT': 'خیلی فوری',
            'CONFIDENTIAL': 'محرمانه', 'SECRET': 'سری'
        };
        return dict[val] || val;
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 print:p-0 print:m-0 print:w-full print:max-w-none">
            <style type="text/css">
                {`@media print { @page { size: A4 portrait; margin: 1.5cm; } body { background: white !important; color: black !important; } .print-hidden { display: none !important; } }`}
            </style>

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold print:hidden mb-4 overflow-x-auto overflow-y-hidden whitespace-nowrap no-scrollbar h-6">
                <Link to="/secretariat" className="text-blue-500 hover:text-blue-700 transition">دبیرخانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <Link to="/secretariat" state={{ filter: letter.letter_type }} className="text-blue-500 hover:text-blue-700 transition">
                    مکاتبات {translateEnum(letter.letter_type)}
                </Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>نامه {letter.indicator_number}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div className="flex gap-2 items-center">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-bold opacity-70 hover:opacity-100 transition px-2">
                        <FaArrowRight /> بازگشت
                    </button>
                    
                    {isAdmin && (
                        <>
                            <button onClick={() => navigate(`/secretariat/${id}/edit`)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold border transition ${isDark ? 'border-blue-600 text-blue-400 hover:bg-blue-900/30' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>
                                <FaEdit /> ویرایش
                            </button>
                            <button onClick={handleDelete} className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-bold border transition ${isDark ? 'border-red-600 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
                                <FaTrash /> حذف
                            </button>
                        </>
                    )}
                </div>

                <div className="flex gap-3 flex-wrap">
                    <button onClick={handleReplyLetter} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition">
                        <FaReply /> پاسخ به نامه
                    </button>

                    {!letter.drawn_signature && letter.letter_type !== 'INCOMING' && (
                        <button onClick={() => setShowSignaturePad(!showSignaturePad)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition">
                            <FaPenNib /> امضای نامه
                        </button>
                    )}
                    <button onClick={handlePrint} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition border ${isDark ? 'border-gray-600 hover:bg-gray-700 text-white' : 'border-gray-300 hover:bg-gray-100 text-gray-800'}`}>
                        <FaPrint /> چاپ نامه
                    </button>
                    <button onClick={() => setShowForward(!showForward)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition">
                        <FaShare /> ارجاع نامه
                    </button>
                </div>
            </div>

            {showSignaturePad && (
                <div className={`p-4 rounded-xl border-2 border-green-500 print:hidden flex flex-col items-center ${isDark ? 'bg-slate-800' : 'bg-green-50'}`}>
                    <h4 className="font-bold mb-3 text-green-700">امضای دیجیتال خود را رسم کنید</h4>
                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-400 overflow-hidden w-full max-w-sm flex justify-center">
                        <SignatureCanvas ref={sigCanvas} penColor="darkblue" canvasProps={{ width: canvasWidth, height: 200, className: 'sigCanvas cursor-crosshair touch-none bg-white' }} />
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={() => sigCanvas.current.clear()} disabled={signing} className="px-5 py-2 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded-lg text-sm font-bold text-gray-800 transition">پاک کردن</button>
                        <button onClick={handleSaveSignature} disabled={signing} className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-bold transition flex items-center justify-center min-w-[140px]">
                            {signing ? 'در حال پردازش...' : 'تایید و ثبت امضا'}
                        </button>
                    </div>
                </div>
            )}

            {showForward && (
                <div className={`p-4 rounded-xl border-l-4 border-indigo-500 print:hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-indigo-50 border-gray-200'}`}>
                    <form onSubmit={handleForward} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-bold mb-2 opacity-80">گیرنده ارجاع</label>
                            <select className={`w-full p-2 rounded-lg border font-bold outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`} value={forwardData.receiver} onChange={(e) => setForwardData({ ...forwardData, receiver: e.target.value })}>
                                <option value="">انتخاب پرسنل...</option>
                                {allPersonnel?.map((emp) => (<option key={emp.id} value={emp.id}>{emp.name} - {emp.position_title || 'بدون سمت'}</option>))}
                            </select>
                        </div>
                        <div className="flex-[2] w-full">
                            <label className="block text-sm font-bold mb-2 opacity-80">شرح دستور (پاراف)</label>
                            <input type="text" className={`w-full p-2 rounded-lg border outline-none ${isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`} value={forwardData.instruction} onChange={(e) => setForwardData({ ...forwardData, instruction: e.target.value })} />
                        </div>
                        <button type="submit" disabled={forwarding} className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold h-[42px] transition active:scale-95">
                            {forwarding ? '...' : 'ارسال ارجاع'}
                        </button>
                    </form>
                </div>
            )}

            <div className={`${boxClass} print:block print:p-4 print:border-none print:shadow-none print:bg-white print:text-black overflow-hidden relative`}>
                
                <div className="flex justify-between items-start border-b-4 border-gray-300 print:border-black pb-4 mb-6 relative">
                    <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 opacity-20 print:opacity-40 -z-10 pr-24">
                        <div className="w-2 h-16 bg-blue-600 skew-x-[-20deg]"></div>
                        <div className="w-1 h-16 bg-blue-400 skew-x-[-20deg]"></div>
                        <div className="w-4 h-16 bg-gray-400 skew-x-[-20deg]"></div>
                    </div>

                    <div className="flex flex-col items-center justify-center w-1/3">
                        {letter.letter_type === 'INCOMING' && letter.external_sender_detail?.logo ? (
                            <img src={letter.external_sender_detail.logo} alt="لوگو" className="h-14 md:h-16 object-contain mb-2 print:h-16" />
                        ) : (
                            <img src={logo} alt="لوگو" className="h-14 md:h-16 object-contain mb-2 print:h-16 print:grayscale-0" />
                        )}
                        {/* 🚀 نام فرستنده دقیقاً زیر لوگو قرار گرفت */}
                        <span className="font-bold text-[11px] md:text-sm print:text-sm text-center leading-tight">
                            {letter.final_sender_name}
                        </span>
                    </div>
                    <div className="flex flex-col items-center justify-start w-1/3 pt-2 md:pt-4">
                        <span className="font-bold text-lg md:text-xl print:text-2xl tracking-widest text-gray-800 dark:text-gray-100 print:text-black">بسمه تعالی</span>
                    </div>

                    <div className="flex flex-col text-[11px] md:text-sm print:text-sm font-bold w-1/3 items-end space-y-1.5 pt-2 md:pt-4">
                        <div className="flex items-center gap-2"><span className="opacity-70 print:opacity-100 font-normal">شماره سیستمی:</span> <span className="font-mono text-blue-600 dark:text-blue-400 print:text-black">{letter.indicator_number}</span></div>
                        {letter.original_number && (
                            <div className="flex items-center gap-2">
                                <span className="opacity-70 print:opacity-100 font-normal">شماره نامه فیزیکی:</span>
                                <bdi className="font-mono font-bold text-gray-800 dark:text-gray-200 print:text-black">{letter.original_number}</bdi>
                            </div>
                        )}
                        <div className="flex items-center gap-2"><span className="opacity-70 print:opacity-100 font-normal">تاریخ ثبت:</span> <span>{new Date(letter.created_at).toLocaleDateString('fa-IR')}</span></div>
                        {letter.original_date && <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 print:text-black"><span className="opacity-70 print:opacity-100 font-normal">تاریخ مبدأ:</span> <span>{new Date(letter.original_date).toLocaleDateString('fa-IR')}</span></div>}
                        <div className="flex items-center gap-2"><span className="opacity-70 print:opacity-100 font-normal">پیوست:</span> <span>{letter.attachment_note || (letter.attachments?.length > 0 ? 'دارد' : 'ندارد')}</span></div>
                    </div>
                </div>

                <div className="flex gap-2 items-center mb-6 print:hidden">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${letter.letter_type === 'INCOMING' ? 'bg-green-100 text-green-700' : letter.letter_type === 'OUTGOING' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>نامه {translateEnum(letter.letter_type)}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${letter.urgency !== 'NORMAL' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{translateEnum(letter.urgency)}</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${letter.confidentiality !== 'NORMAL' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{translateEnum(letter.confidentiality)}</span>
                </div>

                {(letter.reference_letter_detail || (letter.replies && letter.replies.length > 0)) && (
                    <div className={`p-4 mb-6 rounded-xl border-l-4 print:hidden ${isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-500'}`}>
                        {letter.reference_letter_detail && (
                            <div className="flex items-center gap-2 mb-2">
                                <FaArrowRight className="text-blue-500 text-xs" />
                                <span className="text-sm font-bold opacity-80">این نامه پاسخی است به:</span>
                                <Link to={`/secretariat/${letter.reference_letter_detail.id}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline transition">
                                    نامه {letter.reference_letter_detail.indicator_number} ({letter.reference_letter_detail.subject})
                                </Link>
                            </div>
                        )}
                        {letter.replies && letter.replies.length > 0 && (
                            <div className="flex items-start gap-2 mt-2">
                                <FaLink className="text-blue-500 text-xs mt-1" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold opacity-80 mb-1">پاسخ‌های ثبت‌شده برای این نامه:</span>
                                    {letter.replies.map(reply => (
                                        <Link key={reply.id} to={`/secretariat/${reply.id}`} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 hover:underline transition before:content-['•'] before:mr-1 before:ml-2">
                                            نامه {reply.indicator_number} ({reply.subject})
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
                        {/* 🚀 فراخوانی نام نهایی محاسبه شده در بک‌اند */}
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
                        <strong className="text-lg">
                            {letter.external_sender_detail?.name || letter.internal_sender_name || '-'}
                        </strong>
                    </div>

                    <div className="flex items-baseline mt-4">
                        <span className="w-24 opacity-80 print:opacity-100 font-normal">موضوع:</span> 
                        <strong className="text-lg border-b-2 border-gray-400 print:border-black pb-1 flex-1">{letter.subject}</strong>
                    </div>
                    {letter.reference_number && <div className="flex items-baseline mt-4"><span className="w-24 opacity-80 print:opacity-100 font-normal">عطف به:</span> <strong className="text-base font-mono" dir="ltr">{letter.reference_number}</strong></div>}
                    {letter.contract_number && <div className="flex items-baseline"><span className="w-24 opacity-80 print:opacity-100 font-normal">شماره قرارداد:</span> <strong className="text-base font-mono" dir="ltr">{letter.contract_number}</strong></div>}
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
                                /* 🚀 اعمال کلاس whitespace-pre-wrap برای پشتیبانی از چند خطی شدن عنوان دستی در محل امضا */
                                <span className="font-bold text-base print:text-lg whitespace-pre-wrap print:text-black leading-relaxed">
                                    {letter.manual_sender_name}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`${boxClass} print:hidden`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold flex items-center gap-2 opacity-80"><FaPaperclip /> اسناد پیوست شده ({letter.attachments?.length || 0})</h3>
                    <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg cursor-pointer transition text-xs font-bold shadow-md">
                        <FaCamera /> اسکن و آپلود سند
                        <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={handleScanUpload} />
                    </label>
                </div>
                {letter.attachments?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {letter.attachments.map(file => (
                            <a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-between p-3 rounded-lg border transition ${isDark ? 'bg-slate-900 border-slate-700 hover:border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-blue-400'}`}>
                                <span className="text-sm truncate font-bold" dir="ltr">{file.name}</span><FaDownload className="text-blue-500 flex-shrink-0 ml-2" />
                            </a>
                        ))}
                    </div>
                ) : <div className="text-center py-4 text-sm opacity-60">هیچ سندی پیوست نشده است.</div>}
            </div>

            {letter.has_physical_copy && letter.physical_archive_location && (
                <div className={`p-4 rounded-xl text-sm font-bold print:hidden ${isDark ? 'bg-blue-900/20 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
                    📍 محل نگهداری نسخه فیزیکی: {letter.physical_archive_location}
                </div>
            )}
        </div>
    );
};
export default SecretariatDetailScreen;