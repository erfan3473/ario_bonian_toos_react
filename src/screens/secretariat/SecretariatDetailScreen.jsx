import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchLetterDetail, forwardLetter, fetchAllPersonnel, uploadAttachment, signLetter, deleteLetter, fetchLetterSmsLogs, refreshLetterSmsStatus, updateLetter, registerDestination, issueLetter } from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { FaHistory, FaArrowRight, FaArrowLeft, FaShare, FaPrint, FaPaperclip, FaDownload, FaCamera, FaPenNib, FaTrash, FaEdit, FaChevronLeft, FaReply, FaLink, FaCheckCircle, FaTimesCircle, FaChevronDown, FaSms, FaSyncAlt, FaPaperPlane, FaUserEdit, FaUserCheck, FaUserClock, FaFont, FaBold, FaUnderline, FaPlus, FaMinus } from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import logo from '../../assets/ario.png';
import axiosInstance from '../../api/axiosInstance'; 
import JalaliDatePicker from '../../components/JalaliDatePicker'; 

import LetterInfoBanner from '../../components/LetterInfoBanner'; 
import QRCode from 'react-qr-code';
// 🚀 کامپوننت درگ و دراپ پیشرفته با نوار ابزار تنظیم استایل
const DraggableElement = ({ id, isEditMode, position, styleData, onDragEnd, onStyleChange, children, className }) => {
    const [localPos, setLocalPos] = useState(position || { x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const startPos = useRef({ x: 0, y: 0 });
    const currentStyle = styleData || {};

    useEffect(() => {
        setLocalPos(position || { x: 0, y: 0 });
    }, [position]);

    const handleMouseDown = (e) => {
        if (!isEditMode) return;
        e.stopPropagation();
        setIsDragging(true);
        startPos.current = {
            x: e.clientX - localPos.x,
            y: e.clientY - localPos.y
        };
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging || !isEditMode) return;
            setLocalPos({
                x: e.clientX - startPos.current.x,
                y: e.clientY - startPos.current.y
            });
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                if (onDragEnd) onDragEnd(id, localPos);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isEditMode, localPos, id, onDragEnd]);

    const handleFormat = (type, e) => {
        e.stopPropagation(); 
        let newStyle = { ...currentStyle };
        if (type === 'increase') newStyle.fontSize = (newStyle.fontSize || 16) + 1;
        if (type === 'decrease') newStyle.fontSize = Math.max(8, (newStyle.fontSize || 16) - 1);
        if (type === 'bold') newStyle.fontWeight = newStyle.fontWeight === 'bold' ? 'normal' : 'bold';
        if (type === 'underline') newStyle.textDecoration = newStyle.textDecoration === 'underline' ? 'none' : 'underline';
        if (onStyleChange) onStyleChange(id, newStyle);
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`transition-none group ${isEditMode ? 'cursor-move outline-dashed outline-2 outline-blue-500 hover:bg-blue-500/5 z-50 relative rounded shadow-sm min-h-[20px] min-w-[20px]' : ''} ${className || ''}`}
            style={{ transform: `translate(${localPos.x}px, ${localPos.y}px)` }}
        >
            {isEditMode && (
                <div className="absolute -top-8 right-0 flex gap-1 bg-gray-800 text-white p-1 rounded shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={(e) => handleFormat('increase', e)} className="p-1 hover:bg-gray-600 rounded text-[10px]" title="بزرگ‌نمایی"><FaPlus/></button>
                    <button type="button" onClick={(e) => handleFormat('decrease', e)} className="p-1 hover:bg-gray-600 rounded text-[10px]" title="کوچک‌نمایی"><FaMinus/></button>
                    <button type="button" onClick={(e) => handleFormat('bold', e)} className={`p-1 hover:bg-gray-600 rounded text-[10px] ${currentStyle.fontWeight === 'bold' ? 'bg-blue-500' : ''}`} title="ضخیم"><FaBold/></button>
                    <button type="button" onClick={(e) => handleFormat('underline', e)} className={`p-1 hover:bg-gray-600 rounded text-[10px] ${currentStyle.textDecoration === 'underline' ? 'bg-blue-500' : ''}`} title="خط‌کشی"><FaUnderline/></button>
                </div>
            )}
            <div style={{ 
                fontSize: currentStyle.fontSize ? `${currentStyle.fontSize}px` : 'inherit',
                fontWeight: currentStyle.fontWeight || 'inherit',
                textDecoration: currentStyle.textDecoration || 'inherit'
            }} className="w-full h-full">
                {children}
            </div>
        </div>
    );
};

const LetterProgressStepper = ({ status, isDark }) => {
    if (status === 'REJECTED') {
        return (
            <div className={`p-4 rounded-xl border mb-6 print:hidden flex items-center justify-center gap-3 ${isDark ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200'}`}>
                <FaTimesCircle className="text-rose-500 text-2xl" />
                <span className="font-bold text-rose-700 dark:text-rose-400">این نامه توسط مدیریت رد شده و بایگانی گردید.</span>
            </div>
        );
    }

    const steps = [
        { key: 'PENDING', label: 'ثبت اولیه', icon: '📝' },
        { key: 'APPROVED', label: 'تایید و امضا', icon: '✅' },
        { key: 'ISSUED', label: 'خروج از شرکت', icon: '🏃‍♂️' },
        { key: 'REGISTERED', label: 'تکمیل و بایگانی', icon: '📂' }
    ];

    const getStepIndex = (s) => steps.findIndex(step => step.key === s);
    const currentIndex = getStepIndex(status);

    return (
        <div className={`p-6 rounded-xl border mb-4 print:hidden ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <h4 className="text-xs font-black opacity-50 mb-6 text-center">وضعیت فعلی پرونده مکاتباتی</h4>
            <div className="flex items-center justify-between relative">
                <div className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                <div 
                    className="absolute top-1/2 right-0 h-1 -translate-y-1/2 z-0 bg-blue-500 transition-all duration-700 ease-out"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;

                    let bgClass = isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-300';
                    let textClass = isDark ? 'text-gray-500' : 'text-gray-400';
                    let iconClass = 'opacity-50 grayscale';

                    if (isCompleted) {
                        bgClass = 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30';
                        textClass = 'text-blue-600 dark:text-blue-400';
                        iconClass = 'opacity-100 grayscale-0 text-white';
                    } else if (isActive) {
                        bgClass = 'bg-white dark:bg-slate-800 border-4 border-blue-500 shadow-xl shadow-blue-500/40 ring-4 ring-blue-500/20';
                        textClass = 'text-blue-600 dark:text-blue-400 font-black';
                        iconClass = 'opacity-100 grayscale-0 scale-110';
                    }

                    return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center text-lg md:text-xl transition-all duration-500 ${bgClass}`}>
                                <span className={iconClass}>{step.icon}</span>
                            </div>
                            <span className={`text-[10px] md:text-xs font-bold transition-all duration-500 ${textClass}`}>{step.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

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
            <input type="text" className={inputClass} placeholder={placeholder} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); if (e.target.value === '') onChange(''); }} onFocus={() => setIsOpen(true)} />
            <FaChevronDown className="absolute left-3 top-3.5 text-gray-400 pointer-events-none text-xs" />
            
            {isOpen && (
                <ul className={`absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-lg border shadow-lg ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                    {filtered.map(emp => (
                        <li key={emp.id} className={`p-2.5 cursor-pointer text-sm border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'}`} onClick={() => { onChange(emp.id.toString()); setSearchTerm(`${emp.name} - ${emp.position_title || 'بدون سمت'}`); setIsOpen(false); }}>
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

    const { activeLetter: letter, loadingDetail, forwarding, allPersonnel, smsLogs, refreshingSms } = useSelector((state) => state.secretariat);

    const [showForward, setShowForward] = useState(false);
    const [forwardData, setForwardData] = useState({ receiver: '', instruction: '' });

    const sigCanvas = useRef({});
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [signing, setSigning] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(380);

    const [isApproving, setIsApproving] = useState(false); 
    const [showIssueModal, setShowIssueModal] = useState(false);
    const [deliveryResponsible, setDeliveryResponsible] = useState('');

    const [destData, setDestData] = useState({ indicator: '', date: '' });
    const [registeringDest, setRegisteringDest] = useState(false);

    const [printMode, setPrintMode] = useState('BLANK');
    const [showPrintMenu, setShowPrintMenu] = useState(false);
    const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
    const [layoutPositions, setLayoutPositions] = useState({});
    const [layoutStyles, setLayoutStyles] = useState({});
    const [printFont, setPrintFont] = useState('Vazirmatn'); 
    const printMenuRef = useRef(null);

    useEffect(() => {
        const savedPos = localStorage.getItem('printLayoutOffsets');
        if (savedPos) {
            try { setLayoutPositions(JSON.parse(savedPos)); } catch(e) {}
        }
        const savedStyles = localStorage.getItem('printLayoutStyles');
        if (savedStyles) {
            try { setLayoutStyles(JSON.parse(savedStyles)); } catch(e) {}
        }
        const savedFont = localStorage.getItem('printLayoutFont');
        if (savedFont) {
            setPrintFont(savedFont);
        }
    }, []);

    const handleUpdatePosition = (elementId, newPos) => {
        const updated = { ...layoutPositions, [elementId]: newPos };
        setLayoutPositions(updated);
        localStorage.setItem('printLayoutOffsets', JSON.stringify(updated));
    };

    const handleUpdateStyle = (elementId, newStyle) => {
        const updated = { ...layoutStyles, [elementId]: newStyle };
        setLayoutStyles(updated);
        localStorage.setItem('printLayoutStyles', JSON.stringify(updated));
    };

    const handleResetLayout = () => {
        setLayoutPositions({});
        setLayoutStyles({});
        setPrintFont('Vazirmatn');
        localStorage.removeItem('printLayoutOffsets');
        localStorage.removeItem('printLayoutStyles');
        localStorage.removeItem('printLayoutFont');
        toast.success('چیدمان، استایل‌ها و فونت به حالت اولیه برگشت.');
    };

    const handleFontChange = (fontName) => {
        setPrintFont(fontName);
        localStorage.setItem('printLayoutFont', fontName);
    };

    useEffect(() => {
        dispatch(fetchLetterDetail(id));
        dispatch(fetchAllPersonnel());
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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (printMenuRef.current && !printMenuRef.current.contains(event.target)) setShowPrintMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const handleIssueSubmit = () => {
        if (!deliveryResponsible) return toast.error('انتخاب مسئول پیگیری الزامی است.');
        setIsApproving(true);
        
        dispatch(issueLetter({ letterId: id, payload: { delivery_responsible: deliveryResponsible } })).unwrap()
            .then(() => {
                toast.success('نامه به حالت "در دست پیک" درآمد و پیامک ارسال شد.');
                setShowIssueModal(false);
                dispatch(fetchLetterDetail(id)); 
                if (isLevelZeroOrAdmin) dispatch(fetchLetterSmsLogs(id));
            })
            .catch(err => toast.error(err || 'خطا در عملیات'))
            .finally(() => setIsApproving(false));
    };

    const handleRefreshSms = (logId) => {
        const loadingToast = toast.loading('در حال استعلام از مخابرات...');
        dispatch(refreshLetterSmsStatus(logId)).unwrap()
            .then(() => toast.success('وضعیت پیامک به‌روز شد', { id: loadingToast }))
            .catch(err => toast.error(err || 'خطا در استعلام', { id: loadingToast }));
    };

    const handleRegisterDestination = (e) => {
        e.preventDefault();
        if (!destData.indicator) return toast.error('شماره ثبت مقصد الزامی است.');
        setRegisteringDest(true);
        const payload = { destination_indicator: destData.indicator, destination_date: destData.date };
        dispatch(registerDestination({ letterId: id, payload })).unwrap()
            .then(() => {
                toast.success('اطلاعات مقصد با موفقیت ثبت و پرونده بایگانی شد.');
                dispatch(fetchLetterDetail(id));
            })
            .catch(err => toast.error(err || 'خطا در ثبت اطلاعات'))
            .finally(() => setRegisteringDest(false));
    };

    const handlePrintAction = (mode) => {
        setIsLayoutEditMode(false); 
        setPrintMode(mode);
        setShowPrintMenu(false);
        setTimeout(() => {
            window.print();
        }, 200);
    };

    if (loadingDetail || !letter) return <div className="text-center py-20 font-bold opacity-70">در حال دریافت پرونده...</div>;

    const translateEnum = (val) => ({
        'INCOMING': 'وارده', 'OUTGOING': 'صادره', 'INTERNAL': 'داخلی',
        'NORMAL': 'عادی', 'URGENT': 'فوری', 'VERY_URGENT': 'خیلی فوری',
        'CONFIDENTIAL': 'محرمانه', 'SECRET': 'سری',
        'PENDING': 'در انتظار تایید', 'APPROVED': 'آماده صدور', 'ISSUED': 'در دست پیک', 'REGISTERED': 'تکمیل شده', 'REJECTED': 'رد شده'
    }[val] || val);

    const getStatusStyle = (status) => {
        switch(status) {
            case 'REGISTERED': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'ISSUED': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
            case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-300';
            default: return 'bg-orange-100 text-orange-700 border-orange-300';
        }
    };

    const isDeliveryPerson = letter.delivery_responsible === userInfo?.employee?.id;

    const isValidReplyStatus = ['APPROVED', 'ISSUED', 'REGISTERED'].includes(letter.status);
    const isCreator = letter.created_by === userInfo?.id || letter.created_by?.id === userInfo?.id;
    const myEmployeeId = userInfo?.employee?.id;
    const isReceiver = 
        (letter.internal_receiver === myEmployeeId || letter.internal_receiver?.id === myEmployeeId) ||
        (letter.internal_cc_receivers && letter.internal_cc_receivers.some(cc => cc === myEmployeeId || cc.id === myEmployeeId));
        
    const canReply = isValidReplyStatus && !isCreator && (isReceiver || isLevelZeroOrAdmin);

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6 print:p-0 print:m-0 print:w-full print:max-w-none relative">
            <style type="text/css">
                {`@media print { 
                    @page { size: A4 portrait; margin: 0; } 
                    body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; } 
                    .print-hidden { display: none !important; } 
                }`}
            </style>

            {showIssueModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-800'}`}>
                        <h3 className="text-lg font-black mb-2 flex items-center gap-2 text-cyan-600">
                            <FaPaperPlane /> تحویل نامه به پیک (خروج از شرکت)
                        </h3>
                        <p className="text-[13px] opacity-80 mb-6 leading-relaxed">
                            نامه فیزیکی چاپ و امضا شده و در حال خروج از شرکت است. لطفاً شخصی که مسئول بردن نامه به سازمان مقصد می‌باشد را مشخص کنید تا سیستماً به ایشان ارجاع داده شده و <b>پیامک استعلام</b> ارسال شود.
                        </p>
                        
                        <div className="mb-8">
                            <label className="block text-sm font-bold mb-2 opacity-80">مسئول تحویل و پیگیری <span className="text-red-500">*</span></label>
                            <SearchablePersonnelSelect personnel={allPersonnel} value={deliveryResponsible} onChange={setDeliveryResponsible} placeholder="جستجو و انتخاب پرسنل..." isDark={isDark} />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <button onClick={() => setShowIssueModal(false)} className="px-5 py-2.5 rounded-lg bg-gray-500 text-white font-bold text-sm transition hover:bg-gray-600">انصراف</button>
                            <button onClick={handleIssueSubmit} disabled={isApproving || !deliveryResponsible} className="px-6 py-2.5 rounded-lg bg-cyan-600 text-white font-bold text-sm transition hover:bg-cyan-700 disabled:opacity-50">
                                {isApproving ? 'در حال پردازش...' : 'تایید خروج و پیامک'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs font-bold print:hidden mb-2 overflow-x-auto whitespace-nowrap h-6">
                <Link to="/secretariat" className="text-blue-500 hover:text-blue-700 transition">دبیرخانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <Link to="/secretariat" state={{ filter: letter.letter_type }} className="text-blue-500 hover:text-blue-700 transition">
                    مکاتبات {translateEnum(letter.letter_type)}
                </Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>نامه {letter.indicator_number}</span>
            </div>

            <LetterProgressStepper status={letter.status} isDark={isDark} />

            <LetterInfoBanner letter={letter} isDark={isDark} translateEnum={translateEnum} getStatusStyle={getStatusStyle} />

            {(isDeliveryPerson || isLevelZeroOrAdmin) && letter.letter_type === 'OUTGOING' && ['ISSUED', 'APPROVED'].includes(letter.status) && (
                <div className={`p-5 md:p-6 rounded-2xl border-2 border-emerald-500 shadow-xl print:hidden ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                    <h3 className="text-emerald-700 dark:text-emerald-400 font-black mb-3 flex items-center gap-2 text-lg">
                        <FaCheckCircle /> {isDeliveryPerson ? 'شما مسئول تحویل این نامه هستید' : 'ثبت اطلاعات مقصد'}
                    </h3>
                    <p className="text-sm opacity-90 mb-5 font-bold text-gray-700 dark:text-gray-300">
                        لطفاً پس از تحویل فیزیکی نامه به «{letter.external_receiver_detail?.name || 'سازمان مقصد'}»، شماره و تاریخ ثبتِ دریافتی از دبیرخانه آن‌ها را در کادرهای زیر وارد کنید تا پرونده نامه در سیستم تکمیل و بایگانی شود.
                    </p>
                    <form onSubmit={handleRegisterDestination} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/3">
                            <label className="block text-xs font-bold mb-2">شماره ثبت در مقصد <span className="text-red-500">*</span></label>
                            <input 
                                type="text" dir="ltr" required 
                                className={`w-full p-2.5 rounded-lg border outline-none text-left font-mono font-bold focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-slate-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} 
                                value={destData.indicator} 
                                onChange={e => setDestData({...destData, indicator: e.target.value})} 
                                placeholder="مثال: 1405/852" 
                            />
                        </div>
                        <div className="w-full md:w-1/3 relative">
                            <label className="block text-xs font-bold mb-2">تاریخ ثبت در مقصد</label>
                            <JalaliDatePicker name="dest_date" value={destData.date} onChange={e => setDestData({...destData, date: e.target.value})} />
                        </div>
                        <div className="w-full md:w-1/3">
                            <button type="submit" disabled={registeringDest} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md flex items-center justify-center gap-2">
                                <FaCheckCircle /> {registeringDest ? 'در حال پردازش...' : 'ثبت مقصد و بایگانی'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className={`p-4 rounded-xl border flex flex-col lg:flex-row gap-4 items-center justify-between print:hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {canReply && (
                        <button onClick={() => navigate('/secretariat/create', { state: { replyTo: { id: letter.id, indicator: letter.indicator_number, subject: letter.subject } } })} className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-2 rounded-lg font-bold transition text-sm shadow-sm">
                            <FaReply /> پاسخ
                        </button>
                    )}
                    
                    {isLevelZeroOrAdmin && letter.letter_type === 'OUTGOING' && letter.status === 'APPROVED' && (
                        <button onClick={() => setShowIssueModal(true)} className="flex items-center gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700 px-4 py-2 rounded-lg font-bold transition text-sm shadow-md">
                            <FaPaperPlane /> تحویل به پیک
                        </button>
                    )}

                    {!letter.drawn_signature && letter.letter_type !== 'INCOMING' && ['APPROVED', 'ISSUED'].includes(letter.status) && (
                        <button onClick={() => setShowSignaturePad(!showSignaturePad)} className="flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-lg font-bold transition text-sm shadow-md"><FaPenNib /> امضا</button>
                    )}
                    
                    <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 ml-2">
                        <div className="relative" ref={printMenuRef}>
                            <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="flex items-center gap-1.5 bg-gray-800 text-white hover:bg-black dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white px-4 py-2 rounded-lg font-bold transition text-sm shadow-md">
                                <FaPrint /> چاپ <FaChevronDown className="text-[10px] ml-1 opacity-70" />
                            </button>
                            {showPrintMenu && (
                                <div className={`absolute top-full mt-2 right-0 w-64 rounded-xl shadow-2xl overflow-hidden z-50 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                    <button onClick={() => handlePrintAction('BLANK')} className={`w-full text-right px-4 py-3 text-sm font-bold border-b transition hover:bg-gray-50 dark:hover:bg-slate-700 ${isDark ? 'border-slate-700 text-gray-200' : 'border-gray-100 text-gray-800'}`}>
                                        📄 چاپ برگه معمولی
                                    </button>
                                    <button onClick={() => handlePrintAction('LETTERHEAD')} className={`w-full text-right px-4 py-3 text-sm font-bold border-b transition hover:bg-gray-50 dark:hover:bg-slate-700 ${isDark ? 'border-slate-700 text-blue-400' : 'border-gray-100 text-blue-600'}`}>
                                        🖨️ چاپ روی سربرگ آرم‌دار
                                    </button>
                                    
                                    <div className={`p-3 border-b ${isDark ? 'border-slate-700 bg-gray-900' : 'border-gray-100 bg-gray-50'}`}>
                                        <label className="block text-[10px] font-bold opacity-60 mb-2 flex items-center gap-1"><FaFont/> فونت رسمی پرینت</label>
                                        <select 
                                            value={printFont} 
                                            onChange={(e) => handleFontChange(e.target.value)}
                                            className={`w-full p-2 rounded text-xs outline-none border ${isDark ? 'bg-slate-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                                            style={{ fontFamily: printFont }}
                                        >
                                            <option value="Vazirmatn" style={{ fontFamily: 'Vazirmatn' }}>وزیرمتن (سیستم)</option>
                                            <option value="'B Zar', Tahoma" style={{ fontFamily: "'B Zar', Tahoma" }}>ب زر (B Zar)</option>
                                            <option value="'B Lotus', Tahoma" style={{ fontFamily: "'B Lotus', Tahoma" }}>ب لوتوس (B Lotus)</option>
                                            <option value="'B Nazanin', Tahoma" style={{ fontFamily: "'B Nazanin', Tahoma" }}>ب نازنین (B Nazanin)</option>
                                            <option value="'B Mitra', Tahoma" style={{ fontFamily: "'B Mitra', Tahoma" }}>ب میترا (B Mitra)</option>
                                            <option value="'IranNastaliq', Tahoma" style={{ fontFamily: "'IranNastaliq', Tahoma" }}>ایران نستعلیق (IranNastaliq)</option>
                                        </select>
                                    </div>

                                    <div className="p-2 bg-gray-50 dark:bg-gray-900">
                                        <button 
                                            onClick={() => { setIsLayoutEditMode(!isLayoutEditMode); setShowPrintMenu(false); }} 
                                            className={`w-full flex items-center justify-center gap-2 text-center px-4 py-2 rounded-lg text-xs font-bold transition ${isLayoutEditMode ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md' : 'bg-white border dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                        >
                                            {isLayoutEditMode ? '✅ پایان چیدمان' : '🛠️ تنظیم چیدمان فیلدها'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {isLayoutEditMode && (
                            <button onClick={handleResetLayout} className="flex items-center gap-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 px-3 py-2 rounded-lg font-bold transition text-xs shadow-sm">
                                🔄 ریست
                            </button>
                        )}
                    </div>

                    <button onClick={() => setShowForward(!showForward)} className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-4 py-2 rounded-lg font-bold transition text-sm shadow-sm"><FaShare /> ارجاع</button>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-slate-700 pt-3 lg:pt-0 lg:pr-4">
                    {isLevelZeroOrAdmin && letter.status === 'PENDING' && (
                        <>
                            <button onClick={() => handleSimpleApproval('APPROVE')} disabled={isApproving} className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2 rounded-lg font-bold transition text-xs shadow-md"><FaCheckCircle /> تایید صدور</button>
                            <button onClick={() => handleSimpleApproval('REJECT')} disabled={isApproving} className="flex items-center gap-1.5 bg-rose-600 text-white hover:bg-rose-700 px-3 py-2 rounded-lg font-bold transition text-xs shadow-md"><FaTimesCircle /> رد نامه</button>
                        </>
                    )}
                    
                    {((letter.status === 'PENDING' && (letter.created_by === userInfo?.id || letter.created_by?.id === userInfo?.id)) || isLevelZeroOrAdmin) && (
                        <>
                            <button onClick={() => navigate(`/secretariat/${id}/edit`)} className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 px-3 py-2 rounded-lg text-xs font-bold transition"><FaEdit /> ویرایش</button>
                            <button onClick={handleDelete} className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg text-xs font-bold transition"><FaTrash /> حذف</button>
                        </>
                    )}
                    <button onClick={() => navigate('/secretariat')} className="flex items-center justify-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition ml-auto lg:ml-0"><FaArrowLeft /> بازگشت</button>
                </div>
            </div>

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
                            <select className={`w-full p-2.5 rounded-lg border outline-none ${isDark ? 'bg-slate-900 text-white border-slate-600' : 'bg-white text-gray-800 border-gray-300'}`} value={forwardData.receiver} onChange={(e) => setForwardData({ ...forwardData, receiver: e.target.value })}>
                                <option value="">انتخاب...</option>
                                {allPersonnel?.map((emp) => (<option key={emp.id} value={emp.id}>{emp.name}</option>))}
                            </select>
                        </div>
                        <div className="flex-[2] w-full">
                            <label className="block text-sm font-bold mb-2">شرح ارجاع</label>
                            <input type="text" className={`w-full p-2.5 rounded-lg border outline-none ${isDark ? 'bg-slate-900 text-white border-slate-600' : 'bg-white border-gray-300 text-gray-800'}`} value={forwardData.instruction} onChange={(e) => setForwardData({ ...forwardData, instruction: e.target.value })} />
                        </div>
                        <button type="submit" disabled={forwarding} className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold active:scale-95">{forwarding ? '...' : 'ارسال'}</button>
                    </form>
                </div>
            )}

            {isLayoutEditMode && (
                <div className="bg-amber-100 border border-amber-400 text-amber-800 p-3 rounded-xl mb-4 text-sm font-bold text-center print:hidden shadow-md animate-pulse">
                    ⚠️ حالت چیدمان فعال است. المان‌ها را جابجا یا ویرایش کنید. پس از اتمام، از منوی چاپ گزینه «✅ پایان چیدمان» را بزنید.
                </div>
            )}

            <div 
                className={`p-6 md:p-10 rounded-none md:rounded-xl border shadow-sm mx-auto overflow-hidden relative 
                ${letter.status === 'REJECTED' || letter.status === 'PENDING' ? 'opacity-50 grayscale print:hidden' : ''} 
                print:block print:p-[1.5cm] print:border-none print:shadow-none bg-white text-gray-900 min-h-[1050px] print:min-h-[270mm] flex flex-col`}
                style={{ maxWidth: '210mm', fontFamily: printFont }}
            >
                
                <div className="flex-1">
                    <div className={`flex justify-between items-start pb-2 relative mt-4 md:mt-0`}>
                        <DraggableElement id="head-logo" isEditMode={isLayoutEditMode} position={layoutPositions['head-logo']} styleData={layoutStyles['head-logo']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className={`flex flex-col items-center justify-center w-1/3 ${printMode === 'LETTERHEAD' ? 'print:invisible' : ''}`}>
                            {letter.letter_type === 'INCOMING' && letter.external_sender_detail?.logo ? (
                                <img src={letter.external_sender_detail.logo} alt="لوگو" className="h-14 md:h-16 object-contain mb-2 print:h-16" />
                            ) : (
                                <img src={logo} alt="لوگو" className="h-14 md:h-16 object-contain mb-2 print:h-16 print:grayscale-0" />
                            )}
                            <span className="font-bold text-[11px] md:text-sm print:text-sm text-center leading-tight">
                                {letter.final_sender_name}
                            </span>
                        </DraggableElement>
                        
                        <DraggableElement id="head-besmella" isEditMode={isLayoutEditMode} position={layoutPositions['head-besmella']} styleData={layoutStyles['head-besmella']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className={`flex flex-col items-center justify-start w-1/3 pt-2 md:pt-4 ${printMode === 'LETTERHEAD' ? 'print:invisible' : ''}`}>
                            <span className="font-bold text-lg md:text-xl print:text-2xl tracking-widest text-black">به نام خدا</span>
                        </DraggableElement>

                        <div className="flex flex-col text-[11px] md:text-sm print:text-sm font-bold w-1/3 items-end space-y-2.5 pt-2 md:pt-4 text-black">
                            {letter.original_number ? (
                                <DraggableElement id="head-number" isEditMode={isLayoutEditMode} position={layoutPositions['head-number']} styleData={layoutStyles['head-number']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-center gap-2">
                                    <span className={`opacity-80 font-normal ${printMode === 'LETTERHEAD' ? 'print:invisible' : ''}`}>شماره : </span>
                                    <bdi className="font-mono font-bold print:text-sm">{letter.original_number}</bdi>
                                </DraggableElement>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-400 print:hidden"><span className="font-normal">شماره :</span><span>پس از تایید</span></div>
                            )}
                            
                            {letter.original_date && (
                                <DraggableElement id="head-date" isEditMode={isLayoutEditMode} position={layoutPositions['head-date']} styleData={layoutStyles['head-date']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-center gap-2">
                                    <span className={`opacity-80 font-normal ${printMode === 'LETTERHEAD' ? 'print:invisible' : ''}`}>تاریخ :</span> 
                                    <span className="print:text-sm">{new Date(letter.original_date).toLocaleDateString('fa-IR')}</span>
                                </DraggableElement>
                            )}
                            
                            <DraggableElement id="head-attachment" isEditMode={isLayoutEditMode} position={layoutPositions['head-attachment']} styleData={layoutStyles['head-attachment']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-center gap-2">
                                <span className={`opacity-80 font-normal ${printMode === 'LETTERHEAD' ? 'print:invisible' : ''}`}>پیوست:</span> 
                                <span className="print:text-sm">{letter.attachment_note || (letter.attachments?.length > 0 ? 'دارد' : 'ندارد')}</span>
                            </DraggableElement>
                        </div>
                    </div>

                    <DraggableElement id="header-divider" isEditMode={isLayoutEditMode} position={layoutPositions['header-divider']} styleData={layoutStyles['header-divider']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className={`w-full mb-6 ${printMode === 'LETTERHEAD' ? 'print:invisible' : ''}`}>
                        <div className="border-b-4 border-gray-400 print:border-black w-full"></div>
                    </DraggableElement>

                    <div className="space-y-3 mb-8 text-sm md:text-base print:text-base leading-relaxed mt-10 text-black">
                        <DraggableElement id="body-receiver" isEditMode={isLayoutEditMode} position={layoutPositions['body-receiver']} styleData={layoutStyles['body-receiver']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline w-full">
                            <span className="w-24 opacity-80 font-normal">گیرنده (به):</span> 
                            <strong className="text-lg">{letter.final_receiver_name}</strong>
                        </DraggableElement>

                        {letter.receiver_persons && (
                            <DraggableElement id="body-receiver-titles" isEditMode={isLayoutEditMode} position={layoutPositions['body-receiver-titles']} styleData={layoutStyles['body-receiver-titles']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-start mt-2 border-r-2 border-gray-400 print:border-black pr-3 ml-2 text-sm w-full">
                                <span className="opacity-80 font-normal ml-2">عناوین:</span> 
                                <p className="whitespace-pre-wrap font-bold leading-relaxed">{letter.receiver_persons}</p>
                            </DraggableElement>
                        )}
                        
                        <DraggableElement id="body-subject" isEditMode={isLayoutEditMode} position={layoutPositions['body-subject']} styleData={layoutStyles['body-subject']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline mt-4 w-full">
                            <span className="w-24 opacity-80 font-normal">موضوع:</span> 
                            <strong className="text-lg border-b-2 border-gray-400 print:border-black pb-1 flex-1">{letter.subject}</strong>
                        </DraggableElement>

                        {letter.reference_number && (
                            <DraggableElement id="body-ref" isEditMode={isLayoutEditMode} position={layoutPositions['body-ref']} styleData={layoutStyles['body-ref']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline mt-4 w-full">
                                <span className="w-24 opacity-80">عطف به:</span> 
                                <strong className="text-base font-mono" dir="ltr">{letter.reference_number}</strong>
                            </DraggableElement>
                        )}

                        {letter.contract_number && (
                            <DraggableElement id="body-contract" isEditMode={isLayoutEditMode} position={layoutPositions['body-contract']} styleData={layoutStyles['body-contract']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline w-full">
                                <span className="w-24 opacity-80">شماره قرارداد:</span> 
                                <strong className="text-base font-mono" dir="ltr">{letter.contract_number}</strong>
                            </DraggableElement>
                        )}
                    </div>

                    {letter.body && (
                        <DraggableElement id="body-content" isEditMode={isLayoutEditMode} position={layoutPositions['body-content']} styleData={layoutStyles['body-content']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="text-justify leading-loose min-h-[350px] mb-12 text-sm md:text-base print:text-base whitespace-pre-wrap font-medium text-black">
                            {letter.body}
                        </DraggableElement>
                    )}

                    <div className="flex justify-between items-start pt-8 pb-10 relative text-black">
                        <DraggableElement id="footer-cc" isEditMode={isLayoutEditMode} position={layoutPositions['footer-cc']} styleData={layoutStyles['footer-cc']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="w-1/3 text-xs print:text-sm opacity-90">
                            {(letter.cc_text || letter.internal_cc_names?.length > 0) && (
                                <div className="border-t border-gray-400 print:border-black pt-2 pr-2 inline-block min-w-[200px]">
                                    <strong className="block mb-2 text-sm">رونوشت:</strong>
                                    {letter.cc_text && <p className="whitespace-pre-wrap mb-1">{letter.cc_text}</p>}
                                    {letter.internal_cc_names?.map((name, i) => <div key={i}>- {name}</div>)}
                                </div>
                            )}
                        </DraggableElement>
                        
                        <DraggableElement id="footer-dest" isEditMode={isLayoutEditMode} position={layoutPositions['footer-dest']} styleData={layoutStyles['footer-dest']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="w-1/3 flex justify-center items-center relative h-32">
                            {letter.letter_type === 'OUTGOING' && letter.destination_indicator && (
                                <div className="absolute transform -rotate-12 border-[3px] border-red-600 text-red-600 px-4 py-2 rounded-xl flex flex-col items-center justify-center opacity-80 print:opacity-100 mix-blend-multiply" style={{ minWidth: '150px' }}>
                                    <span className="text-xs font-black tracking-widest border-b border-red-600 w-full text-center pb-1 mb-1">ثبت در مقصد</span>
                                    <span className="font-mono text-lg font-bold mt-1" dir="ltr">{letter.destination_indicator}</span>
                                    {letter.destination_date && <span className="text-[10px] font-bold mt-1">{new Date(letter.destination_date).toLocaleDateString('fa-IR')}</span>}
                                </div>
                            )}
                        </DraggableElement>

                        <div className="w-1/3 flex flex-col items-center text-center relative">
                            <DraggableElement id="footer-sign-title" isEditMode={isLayoutEditMode} position={layoutPositions['footer-sign-title']} styleData={layoutStyles['footer-sign-title']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="mb-2 text-sm print:text-base w-full font-bold">
                                مهر و امضا
                            </DraggableElement>
                            <DraggableElement id="footer-sign-img" isEditMode={isLayoutEditMode} position={layoutPositions['footer-sign-img']} styleData={layoutStyles['footer-sign-img']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="h-20 flex justify-center items-center w-full">
                                {letter.drawn_signature ? <img src={letter.drawn_signature} alt="امضا" className="h-24 object-contain mix-blend-multiply" /> : <div className="h-20"></div>}
                            </DraggableElement>
                            {letter.manual_sender_name && (
                                <DraggableElement id="footer-sign-name" isEditMode={isLayoutEditMode} position={layoutPositions['footer-sign-name']} styleData={layoutStyles['footer-sign-name']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="mt-2 text-center w-full font-bold text-base print:text-lg whitespace-pre-wrap leading-relaxed">
                                    {letter.manual_sender_name}
                                </DraggableElement>
                            )}
                        </div>
                    </div>
                </div>

                {printMode === 'BLANK' && (
                    <DraggableElement id="company-footer" isEditMode={isLayoutEditMode} position={layoutPositions['company-footer']} styleData={layoutStyles['company-footer']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="mt-auto w-full pt-6">
                        <div className="border-t-4 border-gray-400 print:border-black pt-4 flex flex-row justify-between items-end gap-2 text-gray-800 print:text-black">
                            
                            {/* آدرس (سمت راست) */}
                            <div className="flex flex-col text-right text-[11px] print:text-[12px] font-bold pb-1">
                                <span className="text-sm print:text-base font-black mb-1">شرکت آریو بنیان توس</span>
                                <span>مشهد، بلوار فلسطین، فلسطین ۱۴، پلاک ۱۴</span>
                            </div>
                            
                            {/* ایمیل و سایت (وسط) */}
                            <div className="flex flex-col items-center text-[10px] print:text-[11px] font-mono font-bold pb-1">
                                <span>ariobonyantoos@gmail.com</span>
                                <span>www.ariobonyantoos.com</span>
                            </div>
                            
                            {/* تلفن‌ها (سمت چپ) */}
                            <div className="flex flex-col text-left text-[10px] print:text-[11px] font-mono font-bold pb-1 mr-auto pl-4" dir="ltr">
                                <span>Tel: 051 - 376 17880 | 376 46801</span>
                                <span>Mob: 0910 555 0268 - 0915 255 3010</span>
                            </div>

                            {/* 🚀 بارکد QR شیک با لوگو (گوشه چپ) */}
                            <div className="relative flex items-center justify-center p-1.5 bg-white border-2 border-gray-300 print:border-black rounded-xl">
                                <QRCode
                                    value="https://www.ariobonyantoos.com/"
                                    size={58}
                                    level="H"
                                    fgColor="#000000"
                                    bgColor="#FFFFFF"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-5 h-5 bg-white rounded border border-gray-200 print:border-black flex items-center justify-center p-0.5">
                                        <img src={logo} alt="لوگو" className="w-full h-full object-contain" />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </DraggableElement>
                )}
            </div>

            {(letter.reference_letter_detail || (letter.replies && letter.replies.length > 0)) && (
                <div className={`p-4 mb-6 rounded-xl border-l-4 print:hidden mt-6 ${isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-500'}`}>
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

            {isLevelZeroOrAdmin && letter.letter_type === 'OUTGOING' && smsLogs && smsLogs.length > 0 && (
                <div className={`mt-6 pt-6 border-t border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} print:hidden`}>
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
                                    <button onClick={() => handleRefreshSms(log.id)} disabled={refreshingSms || log.delivery_status === 'DELIVERED'} className="text-[10px] flex items-center gap-1 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-2 py-1.5 rounded transition disabled:opacity-30">
                                        <FaSyncAlt className={refreshingSms ? "animate-spin" : ""} /> استعلام
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {letter.referrals && letter.referrals.length > 0 && (
                <div className={`mt-6 pt-6 border-t border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} print:hidden`}>
                    <h4 className="text-sm font-black mb-4 flex items-center gap-2 opacity-80 text-indigo-600"><FaHistory /> تاریخچه ارجاعات</h4>
                    <div className="space-y-3">
                        {letter.referrals.map((ref) => (
                            <div key={ref.id} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-1.5 border-b border-gray-200 dark:border-gray-700 pb-1.5">
                                    <div className="flex items-center gap-2 text-[11px] font-bold">
                                        <span className="text-blue-600 dark:text-blue-400">{ref.sender_name}</span>
                                        <FaArrowLeft className="text-gray-400 text-[10px]" />
                                        <span className="text-emerald-600 dark:text-emerald-400">{ref.receiver_name}</span>
                                    </div>
                                    <span className="text-[9px] font-medium opacity-60 font-mono" dir="ltr">{new Date(ref.created_at).toLocaleString('fa-IR')}</span>
                                </div>
                                <div className="text-xs leading-relaxed font-bold text-gray-800 dark:text-gray-200">
                                    {ref.instruction ? <span className="whitespace-pre-wrap"><span className="opacity-50 text-[10px] ml-1">شرح:</span> {ref.instruction}</span> : <span className="opacity-40 italic font-normal">فقط ارجاع</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={`p-5 rounded-xl border print:hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
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