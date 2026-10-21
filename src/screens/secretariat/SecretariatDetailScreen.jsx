import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    fetchLetterDetail, forwardLetter, fetchAllPersonnel, 
    uploadAttachment, signLetter, deleteLetter, 
    fetchLetterSmsLogs, refreshLetterSmsStatus, updateLetter, 
    registerDestination, issueLetter 
} from '../../features/secretariat/secretariatSlice';
import toast from 'react-hot-toast';
import { 
    FaEye, FaEyeSlash, FaHistory, FaArrowRight, FaArrowLeft, FaShare, 
    FaPrint, FaPaperclip, FaDownload, FaCamera, FaPenNib, FaTrash, 
    FaTrashRestore, FaEdit, FaChevronLeft, FaReply, FaLink, FaCheckCircle, 
    FaTimesCircle, FaChevronDown, FaSms, FaSyncAlt, FaPaperPlane, 
    FaFont, FaBold, FaUnderline, FaPlus, FaMinus, FaMapMarkerAlt, 
    FaPhoneAlt, FaMobileAlt, FaGlobe, FaEnvelope, FaExternalLinkAlt,
    FaFilePdf, FaFileImage, FaUndo
} from 'react-icons/fa';
import SignatureCanvas from 'react-signature-canvas';
import logo from '../../assets/ario.png';
import sarbargImg from '../../assets/sarbarg.png'; // تصویر سربرگ فیزیکی A4
import axiosInstance from '../../api/axiosInstance'; 
import JalaliDatePicker from '../../components/JalaliDatePicker'; 
import LetterInfoBanner from '../../components/LetterInfoBanner'; 
import QRCode from 'react-qr-code';

// نشان مهر سازمان بیرونی برای نامه‌های وارده فاقد لوگو
const SharinganIncomingLogo = () => (
    <div className="h-14 w-14 md:h-16 md:w-16 print:h-16 print:w-16 flex items-center justify-center rounded-full p-0.5">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            <circle cx="50" cy="50" r="46" fill="#dc2626" stroke="#111827" strokeWidth="4" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="#111827" strokeWidth="1.8" strokeDasharray="4 2" opacity="0.7" />
            <circle cx="50" cy="50" r="11" fill="#111827" />
            <circle cx="50" cy="50" r="4" fill="#dc2626" opacity="0.6" />
            {[0, 120, 240].map((deg) => (
                <g key={deg} transform={`rotate(${deg} 50 50)`}>
                    <circle cx="50" cy="22" r="6.5" fill="#111827" />
                    <path d="M 50 15.5 C 60 15.5, 65 25, 55 31 C 59 25, 55 20, 50 22 Z" fill="#111827" />
                </g>
            ))}
        </svg>
    </div>
);

// المان درگ‌شدنی مهندسی‌شده بدون تغییر اندازه کادر یا پرش
const DraggableElement = ({ id, isEditMode, position, styleData, onDragEnd, onStyleChange, children, className, label }) => {
    const [localPos, setLocalPos] = useState(position || { x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const startPos = useRef({ x: 0, y: 0 });
    const posRef = useRef(position || { x: 0, y: 0 });
    const currentStyle = styleData || {};

    useEffect(() => {
        const p = position || { x: 0, y: 0 };
        posRef.current = p;
        setLocalPos(p);
    }, [position]);

    const handleMouseDown = (e) => {
        if (!isEditMode) return;
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) return;
        e.stopPropagation();
        setIsDragging(true);
        startPos.current = {
            x: e.clientX - posRef.current.x,
            y: e.clientY - posRef.current.y
        };
    };

    useEffect(() => {
        if (!isEditMode) return;

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const newPos = {
                x: Math.round(e.clientX - startPos.current.x),
                y: Math.round(e.clientY - startPos.current.y)
            };
            posRef.current = newPos;
            setLocalPos(newPos);
        };

        const handleMouseUp = () => {
            if (isDragging) {
                setIsDragging(false);
                if (onDragEnd) onDragEnd(id, posRef.current);
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
    }, [isDragging, isEditMode, id, onDragEnd]);

    const handleContextMenu = (e) => {
        if (!isEditMode) return;
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(prev => !prev);
    };

    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showMenu]);

    const handleFormat = (type, e) => {
        e.stopPropagation(); 
        let newStyle = { ...currentStyle };
        if (type === 'increase') {
            newStyle.fontSize = (newStyle.fontSize || 16) + 1;
            newStyle.scale = Math.round(((newStyle.scale || 1) + 0.1) * 100) / 100;
        }
        if (type === 'decrease') {
            newStyle.fontSize = Math.max(8, (newStyle.fontSize || 16) - 1);
            newStyle.scale = Math.max(0.3, Math.round(((newStyle.scale || 1) - 0.1) * 100) / 100);
        }
        if (type === 'bold') newStyle.fontWeight = newStyle.fontWeight === 'bold' ? 'normal' : 'bold';
        if (type === 'underline') newStyle.textDecoration = newStyle.textDecoration === 'underline' ? 'none' : 'underline';
        if (type === 'visibility') newStyle.hidden = !newStyle.hidden;
        if (onStyleChange) onStyleChange(id, newStyle);
    };

    if (currentStyle.hidden && !isEditMode) return null;

    return (
        <div
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            className={`relative group ${
                isEditMode 
                    ? 'cursor-move outline outline-1 outline-dashed outline-blue-400 select-none hover:outline-blue-600' 
                    : ''
            } ${isDragging ? 'outline-2 outline-amber-500 z-50' : ''} ${
                currentStyle.hidden ? 'opacity-20 grayscale blur-[1px]' : ''
            } ${className || ''}`}
            style={{ 
                transform: `translate3d(${localPos.x}px, ${localPos.y}px, 0)`
            }}
        >
            {isEditMode && (
                <span className="absolute -top-3.5 right-0 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none z-30 opacity-80 group-hover:opacity-100 whitespace-nowrap">
                    {label || id}
                </span>
            )}

            {isEditMode && showMenu && (
                <div className="absolute -top-10 right-0 flex gap-1 bg-gray-900 text-white p-1.5 rounded-lg shadow-2xl z-[100] border border-gray-700 animate-fadeIn">
                    <button type="button" onClick={(e) => handleFormat('increase', e)} className="p-1.5 hover:bg-gray-700 rounded text-xs transition" title="بزرگ‌نمایی"><FaPlus/></button>
                    <button type="button" onClick={(e) => handleFormat('decrease', e)} className="p-1.5 hover:bg-gray-700 rounded text-xs transition" title="کوچک‌نمایی"><FaMinus/></button>
                    <button type="button" onClick={(e) => handleFormat('bold', e)} className={`p-1.5 hover:bg-gray-700 rounded text-xs transition ${currentStyle.fontWeight === 'bold' ? 'bg-blue-600' : ''}`} title="ضخیم"><FaBold/></button>
                    <button type="button" onClick={(e) => handleFormat('underline', e)} className={`p-1.5 hover:bg-gray-700 rounded text-xs transition ${currentStyle.textDecoration === 'underline' ? 'bg-blue-600' : ''}`} title="خط‌کشی"><FaUnderline/></button>
                    <button type="button" onClick={(e) => handleFormat('visibility', e)} className={`p-1.5 hover:bg-gray-700 rounded text-xs transition ${currentStyle.hidden ? 'text-red-400' : 'text-emerald-400'}`} title={currentStyle.hidden ? 'بازگردانی به چاپ' : 'حذف از چاپ'}>
                        {currentStyle.hidden ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>
            )}

            <div style={{ 
                fontSize: currentStyle.fontSize ? `${currentStyle.fontSize}px` : undefined,
                fontWeight: currentStyle.fontWeight || undefined,
                textDecoration: currentStyle.textDecoration || undefined
            }} className="w-full h-full draggable-content">
                {children}
            </div>
        </div>
    );
};

const LetterProgressStepper = ({ status, letterType, isDark }) => {
    if (status === 'DELETED') {
        return (
            <div className={`p-4 rounded-xl border mb-6 print:hidden flex items-center justify-center gap-3 ${isDark ? 'bg-red-950/40 border-red-800' : 'bg-red-50 border-red-300'}`}>
                <FaTrash className="text-red-500 text-xl" />
                <span className="font-bold text-red-700 dark:text-red-400">این نامه در زباله‌دان قرار دارد (حذف شده).</span>
            </div>
        );
    }

    if (status === 'REJECTED') {
        return (
            <div className={`p-4 rounded-xl border mb-6 print:hidden flex items-center justify-center gap-3 ${isDark ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200'}`}>
                <FaTimesCircle className="text-rose-500 text-2xl" />
                <span className="font-bold text-rose-700 dark:text-rose-400">این نامه توسط مدیریت رد شده و بایگانی گردید.</span>
            </div>
        );
    }

    const steps = letterType === 'OUTGOING' ? [
        { key: 'PENDING', label: 'ثبت اولیه', icon: <FaEdit /> },
        { key: 'APPROVED', label: 'تایید و امضا', icon: <FaPenNib /> },
        { key: 'ISSUED', label: 'خروج از شرکت', icon: <FaPaperPlane /> },
        { key: 'REGISTERED', label: 'بایگانی', icon: <FaCheckCircle /> }
    ] : [
        { key: 'PENDING', label: 'ثبت اولیه', icon: <FaEdit /> },
        { key: 'APPROVED', label: 'تایید و بایگانی', icon: <FaCheckCircle /> }
    ];

    let currentIndex = steps.findIndex(step => step.key === status);
    if (currentIndex === -1) {
        if (['ISSUED', 'REGISTERED'].includes(status)) currentIndex = steps.length - 1;
        else currentIndex = 0;
    }

    const isLastStep = currentIndex === steps.length - 1;
    const progressOffset = isLastStep ? 0 : 0.45; 
    const progressPercentage = Math.min(100, ((Math.max(0, currentIndex) + progressOffset) / (steps.length - 1)) * 100);

    return (
        <div className={`p-8 rounded-2xl border mb-6 print:hidden shadow-sm overflow-hidden ${isDark ? 'bg-slate-900/40 border-slate-700/60' : 'bg-white border-gray-100'}`}>
            <h4 className={`text-[11px] font-black mb-10 text-center opacity-60 tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>مسیر گردش مکاتبات</h4>
            
            <div className="flex items-center justify-between relative max-w-3xl mx-auto px-4 md:px-8">
                <div className={`absolute top-1/2 right-5 left-5 md:right-6 md:left-6 h-1.5 -translate-y-1/2 rounded-full z-0 ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                    <div 
                        className="absolute top-0 right-0 h-full rounded-full z-0 bg-blue-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>

                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isActive = index === currentIndex;

                    let bgClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200';
                    let textClass = isDark ? 'text-gray-500' : 'text-gray-400';
                    let iconWrapperClass = isDark ? 'text-gray-600' : 'text-gray-300';

                    if (isCompleted) {
                        bgClass = 'bg-blue-500 border-blue-500 shadow-sm';
                        textClass = 'text-blue-600 dark:text-blue-400 font-bold';
                        iconWrapperClass = 'text-white';
                    } else if (isActive) {
                        bgClass = 'bg-white dark:bg-slate-800 border-4 border-blue-500';
                        textClass = 'text-blue-600 dark:text-blue-400 font-black';
                        iconWrapperClass = 'text-blue-600 dark:text-blue-400';
                    }

                    return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl transition-all duration-700 ${isActive ? 'scale-110' : ''} ${bgClass}`}>
                                <span className={iconWrapperClass}>{step.icon}</span>
                            </div>
                            <span className={`absolute -bottom-7 text-[10px] md:text-xs whitespace-nowrap transition-all duration-500 ${textClass}`}>
                                {step.label}
                            </span>
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
    const renderFormattedNumber = (numStr) => {
        if (!numStr) return null;
        const str = String(numStr);
        if (str.includes('/')) {
            const parts = str.split('/');
            return (
                <span 
                    className="inline-flex items-center font-mono font-black tracking-tighter" 
                    dir="ltr" 
                    style={{ fontSize: 'inherit', letterSpacing: '-0.04em' }}
                >
                    {parts.map((part, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <span className="text-gray-400 opacity-60 font-normal mx-[1px]">
                                    /
                                </span>
                            )}
                            <span>{part}</span>
                        </React.Fragment>
                    ))}
                </span>
            );
        }
        return (
            <span 
                dir="ltr" 
                className="font-mono font-black tracking-tighter" 
                style={{ fontSize: 'inherit', letterSpacing: '-0.04em' }}
            >
                {numStr}
            </span>
        );
    };

    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { userInfo } = useSelector((state) => state.userLogin);
    const { activeLetter: letter, loadingDetail, forwarding, allPersonnel, smsLogs, refreshingSms } = useSelector((state) => state.secretariat);

    const isLevelZeroOrAdmin = userInfo?.is_admin || (userInfo?.employee?.position?.hierarchy_level === 0) || letter?.can_approve;
    const isBoardMember = Boolean(
        userInfo?.is_admin || 
        userInfo?.employee?.position?.hierarchy_level === 0 || 
        userInfo?.employee?.position?.code === 'MANAGING_COUNCIL' ||
        letter?.can_approve
    );
    const hasSecretariatPerm = isLevelZeroOrAdmin || (userInfo?.employee?.position?.can_archive_letters === true) || letter?.can_manage_secretariat;

    const [showForward, setShowForward] = useState(false);
    const [forwardData, setForwardData] = useState({ receiver: '', instruction: '' });

    const sigCanvas = useRef({});
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [signatureTab, setSignatureTab] = useState('default');
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadPreview, setUploadPreview] = useState('');
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
    const [showLetterheadBg, setShowLetterheadBg] = useState(true);
    const [layoutPositions, setLayoutPositions] = useState({});
    const [layoutStyles, setLayoutStyles] = useState({});
    const [history, setHistory] = useState([]);
    const [printFont, setPrintFont] = useState('Vazirmatn'); 
    const printMenuRef = useRef(null);

    const [editingRefId, setEditingRefId] = useState(null);
    const [editRefText, setEditRefText] = useState("");

    const visualAttachments = (letter?.attachments || []).filter(att => {
        const url = (att.url || att.file || att.name || '').toLowerCase();
        return /\.(jpe?g|png|webp|gif|bmp|svg|pdf)(\?.*)?$/i.test(url);
    });

    useEffect(() => {
        const posKey = `printLayoutOffsets_${printMode}`;
        const styleKey = `printLayoutStyles_${printMode}`;

        const savedPos = localStorage.getItem(posKey) || (printMode === 'BLANK' ? localStorage.getItem('printLayoutOffsets') : null);
        if (savedPos) {
            try { setLayoutPositions(JSON.parse(savedPos)); } catch (e) { setLayoutPositions({}); }
        } else {
            setLayoutPositions({});
        }

        const savedStyles = localStorage.getItem(styleKey) || (printMode === 'BLANK' ? localStorage.getItem('printLayoutStyles') : null);
        if (savedStyles) {
            try { setLayoutStyles(JSON.parse(savedStyles)); } catch (e) { setLayoutStyles({}); }
        } else {
            setLayoutStyles({});
        }

        const savedFont = localStorage.getItem('printLayoutFont');
        if (savedFont) {
            setPrintFont(savedFont);
        }
    }, [printMode]);

    const recordHistory = () => {
        setHistory(prev => [...prev.slice(-19), { positions: layoutPositions, styles: layoutStyles }]);
    };

    const handleUpdatePosition = (elementId, newPos) => {
        recordHistory();
        const updated = { ...layoutPositions, [elementId]: newPos };
        setLayoutPositions(updated);
        localStorage.setItem(`printLayoutOffsets_${printMode}`, JSON.stringify(updated));
    };

    const handleUpdateStyle = (elementId, newStyle) => {
        recordHistory();
        const updated = { ...layoutStyles, [elementId]: newStyle };
        setLayoutStyles(updated);
        localStorage.setItem(`printLayoutStyles_${printMode}`, JSON.stringify(updated));
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isLayoutEditMode) return;
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (history.length > 0) {
                    const lastState = history[history.length - 1];
                    setHistory(prev => prev.slice(0, prev.length - 1));
                    setLayoutPositions(lastState.positions);
                    setLayoutStyles(lastState.styles);
                    localStorage.setItem(`printLayoutOffsets_${printMode}`, JSON.stringify(lastState.positions));
                    localStorage.setItem(`printLayoutStyles_${printMode}`, JSON.stringify(lastState.styles));
                    toast.success('تغییرات بازگردانی شد (Undo)', { id: 'undo-toast', duration: 1500 });
                } else {
                    toast('تغییر قبلی برای بازگردانی وجود ندارد', { id: 'undo-empty', duration: 1000 });
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLayoutEditMode, history, printMode]);

    const handleResetLayout = () => {
        setLayoutPositions({});
        setLayoutStyles({});
        setHistory([]);
        localStorage.removeItem(`printLayoutOffsets_${printMode}`);
        localStorage.removeItem(`printLayoutStyles_${printMode}`);
        if (printMode === 'BLANK') {
            localStorage.removeItem('printLayoutOffsets');
            localStorage.removeItem('printLayoutStyles');
        }
        toast.success(`چیدمان حالت «${printMode === 'BLANK' ? 'برگه معمولی' : 'سربرگ آرم‌دار'}» به حالت اولیه برگشت.`);
    };

    const handleFontChange = (fontName) => {
        setPrintFont(fontName);
        localStorage.setItem('printLayoutFont', fontName);
    };

    useEffect(() => {
        dispatch(fetchLetterDetail(id));
        dispatch(fetchAllPersonnel());
        if (isBoardMember) {
            dispatch(fetchLetterSmsLogs(id));
        }
    }, [dispatch, id, isBoardMember]);

    useEffect(() => {
        const handleResize = () => setCanvasWidth(window.innerWidth < 450 ? window.innerWidth - 64 : 380);
        if (showSignatureModal && signatureTab === 'draw') handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showSignatureModal, signatureTab]);

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

    const handleEditReferralSubmit = async (refId) => {
        try {
            await axiosInstance.put(`/secretariat/referrals/${refId}/update/`, { instruction: editRefText });
            toast.success('متن ارجاع با موفقیت ویرایش شد.');
            setEditingRefId(null);
            dispatch(fetchLetterDetail(id));
        } catch (err) {
            toast.error(err.response?.data?.detail || 'خطا در ویرایش ارجاع');
        }
    };

    const handleScanUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadToast = toast.loading('در حال آپلود سند...');
        dispatch(uploadAttachment({ letterId: id, file })).unwrap()
            .then(() => toast.success('سند با موفقیت اسکن و ضمیمه شد', { id: uploadToast }))
            .catch(() => toast.error('خطا در آپلود سند', { id: uploadToast }));
    };

    const handleSignDefault = async () => {
        setSigning(true);
        try {
            await axiosInstance.post(`/secretariat/${id}/sign/`, { use_default: true });
            toast.success('امضای رسمی مدیرعامل با موفقیت درج شد.');
            setShowSignatureModal(false);
            dispatch(fetchLetterDetail(id));
        } catch (err) {
            toast.error(err.response?.data?.detail || 'خطا در ثبت امضای پیش‌فرض');
        } finally {
            setSigning(false);
        }
    };

    const handleUploadSignatureSubmit = async () => {
        if (!uploadFile) return toast.error('لطفاً ابتدا فایل امضا را انتخاب کنید.');
        setSigning(true);
        try {
            const formData = new FormData();
            formData.append('signature_file', uploadFile);
            await axiosInstance.post(`/secretariat/${id}/sign/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('فایل امضا با موفقیت روی نامه درج شد.');
            setShowSignatureModal(false);
            setUploadFile(null);
            setUploadPreview('');
            dispatch(fetchLetterDetail(id));
        } catch (err) {
            toast.error(err.response?.data?.detail || 'خطا در آپلود فایل امضا');
        } finally {
            setSigning(false);
        }
    };

    const handleSaveDrawnSignature = async () => {
        if (!sigCanvas.current || sigCanvas.current.isEmpty()) return toast.error("لطفاً ابتدا امضا را رسم کنید.");
        const signatureBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');
        setSigning(true);
        try {
            await axiosInstance.post(`/secretariat/${id}/sign/`, { signature: signatureBase64 });
            toast.success('امضای رسم‌شده با موفقیت ثبت شد.');
            setShowSignatureModal(false);
            dispatch(fetchLetterDetail(id));
        } catch (err) {
            toast.error(err.response?.data?.detail || 'خطا در ثبت امضا');
        } finally {
            setSigning(false);
        }
    };

    const handleDelete = () => {
        if (window.confirm('آیا از انتقال این نامه به زباله‌دان اطمینان دارید؟')) {
            dispatch(deleteLetter(id)).unwrap()
                .then(() => { 
                    toast.success('نامه به زباله‌دان منتقل شد'); 
                    navigate('/secretariat', { state: { filter: 'DELETED' } }); 
                })
                .catch(err => toast.error(err || 'خطا در حذف نامه'));
        }
    };

    const handleRestore = () => {
        if (window.confirm('آیا می‌خواهید این نامه را از زباله‌دان بازیابی کنید؟')) {
            dispatch(updateLetter({ id, payload: { status: 'PENDING' } })).unwrap()
                .then(() => {
                    toast.success('نامه با موفقیت بازیابی شد و به وضعیت در انتظار تایید برگشت.');
                    dispatch(fetchLetterDetail(id));
                })
                .catch(err => toast.error(err || 'خطا در بازیابی نامه'));
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
                if (isBoardMember) dispatch(fetchLetterSmsLogs(id));
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
        }, 300);
    };

    if (loadingDetail || !letter) return <div className="text-center py-20 font-bold opacity-70">در حال دریافت پرونده...</div>;

    const translateEnum = (val) => ({
        'INCOMING': 'وارده', 'OUTGOING': 'صادره', 'INTERNAL': 'داخلی', 'DOCUMENT': 'اسناد',
        'NORMAL': 'عادی', 'URGENT': 'فوری', 'VERY_URGENT': 'خیلی فوری',
        'CONFIDENTIAL': 'محرمانه', 'SECRET': 'سری',
        'PENDING': 'در انتظار تایید', 'APPROVED': 'آماده صدور', 'ISSUED': 'در دست پیک',
        'REGISTERED': 'تکمیل شده', 'REJECTED': 'رد شده', 'DELETED': 'حذف شده (زباله‌دان)'
    }[val] || val);

    const getStatusStyle = (status) => {
        switch(status) {
            case 'REGISTERED': return 'bg-emerald-100 text-emerald-700 border-emerald-300';
            case 'ISSUED': return 'bg-cyan-100 text-cyan-700 border-cyan-300';
            case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'REJECTED': return 'bg-rose-100 text-rose-700 border-rose-300';
            case 'DELETED': return 'bg-red-100 text-red-800 border-red-400';
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

    const currentLetterUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/secretariat/${letter.id}` 
        : `http://localhost:5173/secretariat/${letter.id}`;

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6 print:p-0 print:m-0 print:w-full print:max-w-none relative">
            <style type="text/css">
                {`
                    .draggable-content strong, .draggable-content b {
                        font-weight: inherit !important;
                    }
                    /* 🚀 اجبار عناصر داخلی به تبعیت از سایز جدید با کلیک راست */
                    .draggable-content[style*="font-size"] * {
                        font-size: inherit !important;
                    }
                    @media print { 
                        @page { 
                            size: A4 portrait; 
                            margin: 0 !important; 
                        }
                        html, body { 
                            margin: 0 !important; 
                            padding: 0 !important; 
                            width: 210mm !important;
                            height: 297mm !important;
                            background: white !important; 
                            color: black !important; 
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            overflow: hidden !important;
                        } 
                        body * {
                            visibility: hidden !important;
                        }
                        #letter-a4-sheet, #letter-a4-sheet * {
                            visibility: visible !important;
                        }
                        #letter-a4-sheet {
                            position: fixed !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 210mm !important;
                            height: 297mm !important;
                            max-height: 297mm !important;
                            margin: 0 !important;
                            padding: 12mm 15mm 12mm 15mm !important;
                            box-sizing: border-box !important;
                            border: none !important;
                            box-shadow: none !important;
                            overflow: hidden !important;
                            background-image: none !important;
                            background-color: transparent !important;
                            page-break-after: avoid !important;
                            page-break-before: avoid !important;
                            break-inside: avoid !important;
                        }
                    }
                `}
            </style>

            {/* مودال پیگیری تحویل و پیک */}
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

            {/* مودال انتخاب روش درج امضا */}
            {showSignatureModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                    <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border ${isDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-800 border-gray-100'}`}>
                        <div className="flex items-center justify-between border-b px-6 py-4 border-gray-200 dark:border-slate-700">
                            <h3 className="font-black text-base flex items-center gap-2">
                                <FaPenNib className="text-emerald-500" /> انتخاب روش درج امضای نامه
                            </h3>
                            <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
                        </div>

                        <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/30 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setSignatureTab('default')}
                                className={`flex-1 py-3 transition ${signatureTab === 'default' ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ⭐ امضای رسمی مدیرعامل
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignatureTab('upload')}
                                className={`flex-1 py-3 transition ${signatureTab === 'upload' ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                📁 آپلود فایل امضا (PNG/SVG)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSignatureTab('draw')}
                                className={`flex-1 py-3 transition ${signatureTab === 'draw' ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                ✏️ رسم دستی با قلم
                            </button>
                        </div>

                        <div className="p-6">
                            {signatureTab === 'default' && (
                                <div className="text-center space-y-4 py-2">
                                    <div className="p-4 rounded-xl border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20">
                                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                                            امضای رسمی و تاییدشده مدیرعامل شرکت
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                            این امضا به صورت مستقیم و بدون افت کیفیت از فایل ذخیره شده در سرور خوانده شده و با زمینه شفاف روی نامه می‌نشیند.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSignDefault}
                                        disabled={signing}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                                    >
                                        <FaPenNib /> {signing ? 'در حال ثبت...' : 'درج فوری امضای مدیرعامل روی نامه'}
                                    </button>
                                </div>
                            )}

                            {signatureTab === 'upload' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                        لطفاً فایل امضای شفاف بدون پس‌زمینه (Transparent PNG یا SVG) را انتخاب کنید:
                                    </p>
                                    <input
                                        type="file"
                                        accept=".png, .svg"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setUploadFile(file);
                                            const reader = new FileReader();
                                            reader.onloadend = () => setUploadPreview(reader.result);
                                            reader.readAsDataURL(file);
                                        }}
                                        className="block w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                    />

                                    {uploadPreview && (
                                        <div 
                                            style={{
                                                backgroundImage: `linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)`,
                                                backgroundSize: '16px 16px',
                                                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                                                backgroundColor: '#f9fafb'
                                            }}
                                            className="h-32 w-full rounded-xl border border-dashed border-gray-300 flex items-center justify-center p-2"
                                        >
                                            <img src={uploadPreview} alt="پیش‌نمایش امضا" className="max-h-full max-w-full object-contain" />
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleUploadSignatureSubmit}
                                        disabled={signing || !uploadFile}
                                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm"
                                    >
                                        {signing ? 'در حال ارسال...' : 'آپلود و اعمال امضا روی نامه'}
                                    </button>
                                </div>
                            )}

                            {signatureTab === 'draw' && (
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 overflow-hidden w-full flex justify-center">
                                        <SignatureCanvas 
                                            ref={sigCanvas} 
                                            penColor="darkblue" 
                                            canvasProps={{ width: canvasWidth, height: 180, className: 'sigCanvas cursor-crosshair touch-none bg-white' }} 
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <button 
                                            type="button" 
                                            onClick={() => sigCanvas.current?.clear()} 
                                            className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition"
                                        >
                                            پاک کردن
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={handleSaveDrawnSignature} 
                                            disabled={signing} 
                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
                                        >
                                            {signing ? 'در حال ثبت...' : 'ثبت امضای دستی'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end bg-gray-50 dark:bg-slate-900/50 px-6 py-3 border-t border-gray-200 dark:border-slate-700">
                            <button
                                type="button"
                                onClick={() => setShowSignatureModal(false)}
                                className="px-4 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Breadcrumb */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold print:hidden mb-2 overflow-x-auto whitespace-nowrap h-6">
                <Link to="/secretariat" className="text-blue-500 hover:text-blue-700 transition">دبیرخانه</Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <Link to="/secretariat" state={{ filter: letter.status === 'DELETED' ? 'DELETED' : letter.letter_type }} className="text-blue-500 hover:text-blue-700 transition">
                    {letter.status === 'DELETED' ? 'زباله‌دان' : `مکاتبات ${translateEnum(letter.letter_type)}`}
                </Link>
                <FaChevronLeft className="text-[10px] text-gray-400" />
                <span className={isDark ? "text-gray-300" : "text-gray-700"}>نامه {letter.indicator_number}</span>
            </div>

            <div className="print:hidden">
                <LetterProgressStepper status={letter.status} letterType={letter.letter_type} isDark={isDark} />
            </div>

            <div className="print:hidden">
                <LetterInfoBanner letter={letter} isDark={isDark} translateEnum={translateEnum} getStatusStyle={getStatusStyle} />
            </div>

            {/* فرم ثبت اطلاعات مقصد */}
            {(isDeliveryPerson || hasSecretariatPerm) && letter.letter_type === 'OUTGOING' && ['ISSUED', 'APPROVED'].includes(letter.status) && (
                <div className={`p-5 md:p-6 rounded-2xl border-2 border-emerald-500 shadow-xl print:hidden ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
                    <h3 className="text-emerald-700 dark:text-emerald-400 font-black mb-3 flex items-center gap-2 text-lg">
                        <FaCheckCircle /> {isDeliveryPerson ? 'شما مسئول تحویل این نامه هستید' : 'ثبت اطلاعات مقصد'}
                    </h3>
                    <p className="text-sm opacity-90 mb-5 font-bold text-gray-700 dark:text-gray-300">
                        لطفاً پس از تحویل فیزیکی نامه به «{letter.external_receiver_detail?.name || 'سازمان مقصد'}»، شماره و تاریخ ثبتِ دریافتی از دبیرخانه آن‌ها را در کادرهای زیر وارد کنید تا پرونده نامه در سیستم تکمیل و بایگانی شود.
                    </p>
                    <form onSubmit={handleRegisterDestination} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/3">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold">
                                    شماره ثبت در مقصد <span className="text-red-500">*</span>
                                </label>
                                {destData.indicator && (
                                    <div className="bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-sm">
                                        {renderFormattedNumber(destData.indicator)}
                                    </div>
                                )}
                            </div>
                            <input 
                                type="text" 
                                dir="ltr" 
                                required 
                                className={`w-full p-2.5 rounded-lg border outline-none text-center font-mono font-black text-sm tracking-widest focus:ring-2 focus:ring-emerald-500 transition ${
                                    isDark ? 'bg-slate-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                                }`} 
                                value={destData.indicator} 
                                onChange={e => setDestData({...destData, indicator: e.target.value})} 
                                placeholder="ص/۱۴۰۵/۰۰۶ مثال:" 
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

            {/* نوار ابزار اقدامات نامه */}
            <div className={`p-4 rounded-xl border flex flex-col lg:flex-row gap-4 items-center justify-between print:hidden ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    {canReply && (
                        <button onClick={() => navigate('/secretariat/create', { state: { replyTo: { id: letter.id, indicator: letter.indicator_number, subject: letter.subject } } })} className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-4 py-2 rounded-lg font-bold transition text-sm shadow-sm">
                            <FaReply /> پاسخ
                        </button>
                    )}
                    
                    {hasSecretariatPerm && letter.letter_type === 'OUTGOING' && letter.status === 'APPROVED' && (
                        <button onClick={() => setShowIssueModal(true)} className="flex items-center gap-1.5 bg-cyan-600 text-white hover:bg-cyan-700 px-4 py-2 rounded-lg font-bold transition text-sm shadow-md">
                            <FaPaperPlane /> تحویل به پیک
                        </button>
                    )}

                    {hasSecretariatPerm && letter.letter_type !== 'INCOMING' && ['APPROVED', 'ISSUED'].includes(letter.status) && (
                        <button 
                            onClick={() => setShowSignatureModal(true)} 
                            className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg font-bold transition text-sm shadow-md"
                        >
                            <FaPenNib /> {(letter.drawn_signature || letter.signature) ? 'تغییر امضا' : 'درج امضا'}
                        </button>
                    )}
                    
                    {letter.status !== 'DELETED' && (
                        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 ml-2">
                            <div className="relative" ref={printMenuRef}>
                                <button onClick={() => setShowPrintMenu(!showPrintMenu)} className="flex items-center gap-1.5 bg-gray-800 text-white hover:bg-black dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white px-4 py-2 rounded-lg font-bold transition text-sm shadow-md">
                                    <FaPrint /> چاپ ({printMode === 'BLANK' ? 'معمولی' : 'سربرگ'}) <FaChevronDown className="text-[10px] ml-1 opacity-70" />
                                </button>
                                {showPrintMenu && (
                                    <div className={`absolute top-full mt-2 right-0 w-72 rounded-xl shadow-2xl overflow-hidden z-50 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                        <div className={`p-2 border-b text-[11px] font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                                            انتخاب قالب پیش‌نمایش و چیدمان:
                                        </div>
                                        <div className="grid grid-cols-2 gap-1 p-2 border-b dark:border-slate-700">
                                            <button 
                                                type="button" 
                                                onClick={() => setPrintMode('BLANK')} 
                                                className={`py-2 px-2 rounded-lg text-xs font-bold transition ${printMode === 'BLANK' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
                                            >
                                                📄 برگه معمولی
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => setPrintMode('LETTERHEAD')} 
                                                className={`py-2 px-2 rounded-lg text-xs font-bold transition ${printMode === 'LETTERHEAD' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
                                            >
                                                🖨️ سربرگ آرم‌دار
                                            </button>
                                        </div>

                                        <button onClick={() => handlePrintAction('BLANK')} className={`w-full text-right px-4 py-3 text-sm font-bold border-b transition hover:bg-gray-50 dark:hover:bg-slate-700 ${isDark ? 'border-slate-700 text-gray-200' : 'border-gray-100 text-gray-800'}`}>
                                            🚀 چاپ فوری برگه معمولی
                                        </button>
                                        <button onClick={() => handlePrintAction('LETTERHEAD')} className={`w-full text-right px-4 py-3 text-sm font-bold border-b transition hover:bg-gray-50 dark:hover:bg-slate-700 ${isDark ? 'border-slate-700 text-blue-400' : 'border-gray-100 text-blue-600'}`}>
                                            🚀 چاپ فوری روی سربرگ آرم‌دار
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
                                                {isLayoutEditMode ? '✅ پایان چیدمان' : `🛠️ تنظیم چیدمان (${printMode === 'BLANK' ? 'برگه معمولی' : 'سربرگ'})`}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {isLayoutEditMode && (
                                <button onClick={handleResetLayout} className="flex items-center gap-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 px-3 py-2 rounded-lg font-bold transition text-xs shadow-sm">
                                    🔄 ریست ({printMode === 'BLANK' ? 'معمولی' : 'سربرگ'})
                                </button>
                            )}
                        </div>
                    )}

                    {letter.status !== 'DELETED' && (
                        <button onClick={() => setShowForward(!showForward)} className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-4 py-2 rounded-lg font-bold transition text-sm shadow-sm"><FaShare /> ارجاع</button>
                    )}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto lg:justify-end border-t lg:border-t-0 lg:border-r border-gray-200 dark:border-slate-700 pt-3 lg:pt-0 lg:pr-4">
                    {isLevelZeroOrAdmin && letter.status === 'PENDING' && (
                        <>
                            <button onClick={() => handleSimpleApproval('APPROVE')} disabled={isApproving} className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2 rounded-lg font-bold transition text-xs shadow-md">
                                <FaCheckCircle /> {letter.letter_type === 'INCOMING' ? 'تایید و بایگانی' : 'تایید صدور'}
                            </button>
                            <button onClick={() => handleSimpleApproval('REJECT')} disabled={isApproving} className="flex items-center gap-1.5 bg-rose-600 text-white hover:bg-rose-700 px-3 py-2 rounded-lg font-bold transition text-xs shadow-md"><FaTimesCircle /> رد نامه</button>
                        </>
                    )}
                    
                    {letter.status === 'DELETED' && hasSecretariatPerm && (
                        <button onClick={handleRestore} className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold transition shadow-md">
                            <FaTrashRestore /> بازیابی از زباله‌دان
                        </button>
                    )}

                    {((letter.status === 'PENDING' && isCreator) || hasSecretariatPerm) && (
                        <>
                            <button onClick={() => navigate(`/secretariat/${id}/edit`)} className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/40 px-3 py-2 rounded-lg text-xs font-bold transition"><FaEdit /> ویرایش</button>
                            {letter.status !== 'DELETED' && (
                                <button onClick={handleDelete} className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg text-xs font-bold transition"><FaTrash /> حذف</button>
                            )}
                        </>
                    )}
                    <button onClick={() => navigate('/secretariat')} className="flex items-center justify-center gap-1.5 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition ml-auto lg:ml-0"><FaArrowLeft /> بازگشت</button>
                </div>
            </div>

            {/* فرم ارجاع نامه */}
            {showForward && (
                <div className={`p-4 rounded-xl border-l-4 border-indigo-500 print:hidden ${isDark ? 'bg-slate-800' : 'bg-indigo-50'}`}>
                    <form onSubmit={handleForward} className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="w-full md:w-1/3">
                                <label className="block text-sm font-bold mb-2">گیرنده ارجاع</label>
                                <SearchablePersonnelSelect 
                                    personnel={allPersonnel} 
                                    value={forwardData.receiver} 
                                    onChange={(val) => setForwardData({ ...forwardData, receiver: val })} 
                                    placeholder="جستجو و انتخاب پرسنل..." 
                                    isDark={isDark} 
                                />
                            </div>
                            <div className="w-full md:w-2/3">
                                <label className="block text-sm font-bold mb-2">شرح ارجاع</label>
                                <textarea 
                                    className={`w-full p-2.5 rounded-lg border outline-none ${isDark ? 'bg-slate-900 text-white border-slate-600' : 'bg-white border-gray-300 text-gray-800'}`} 
                                    value={forwardData.instruction} 
                                    onChange={(e) => setForwardData({ ...forwardData, instruction: e.target.value })}
                                    rows="2"
                                    placeholder="متن پاراف یا دستور خود را بنویسید..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={forwarding} className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold active:scale-95">
                                {forwarding ? 'در حال ارسال...' : 'ارسال ارجاع'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 🚀 نوار ابزار پیشرفته تنظیم چیدمان همراه با دو اسلایدر عرض متن و فاصله عمودی */}
            {isLayoutEditMode && (
                <div className="bg-amber-100 border-2 border-amber-400 text-amber-900 p-4 rounded-xl mb-4 text-xs font-bold flex flex-col md:flex-row items-center justify-between gap-4 print:hidden shadow-md">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-black text-sm">🛠️ تنظیمات چیدمان:</span>
                        
                        <div className="inline-flex bg-white rounded-lg p-1 border border-amber-300 shadow-inner">
                            <button
                                type="button"
                                onClick={() => setPrintMode('BLANK')}
                                className={`px-2.5 py-1 rounded text-xs font-black transition ${printMode === 'BLANK' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                📄 برگه معمولی
                            </button>
                            <button
                                type="button"
                                onClick={() => setPrintMode('LETTERHEAD')}
                                className={`px-2.5 py-1 rounded text-xs font-black transition ${printMode === 'LETTERHEAD' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                🖨️ سربرگ آرم‌دار
                            </button>
                        </div>

                        {/* اسلایدر عرض بدنه متن (شکست خطوط و تعداد سطرها) */}
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 shadow-sm">
                            <span className="whitespace-nowrap">عرض کادر متن:</span>
                            <input 
                                type="range" 
                                min="60" 
                                max="100" 
                                step="1"
                                value={layoutStyles['body-content']?.widthPercent || 100}
                                onChange={(e) => handleUpdateStyle('body-content', {
                                    ...layoutStyles['body-content'],
                                    widthPercent: Number(e.target.value)
                                })}
                                className="w-20 accent-blue-600 cursor-pointer"
                                title="کم کردن عرض باعث شکسته شدن متن و افزایش تعداد سطرها می‌شود"
                            />
                            <span className="font-mono text-[11px] text-blue-700 w-8">{layoutStyles['body-content']?.widthPercent || 100}%</span>
                        </div>


                        {printMode === 'LETTERHEAD' && (
                            <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-amber-300 select-none shadow-sm">
                                <input 
                                    type="checkbox" 
                                    checked={showLetterheadBg} 
                                    onChange={(e) => setShowLetterheadBg(e.target.checked)} 
                                    className="rounded text-blue-600"
                                />
                                <span>پیش‌نمایش تصویر سربرگ</span>
                            </label>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsLayoutEditMode(false)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-xs font-black shadow transition shrink-0"
                    >
                        ✅ پایان چیدمان
                    </button>
                </div>
            )}

            {/* 🌟 برگه رسمی دقیق A4 */}
            <div className="w-full overflow-x-auto flex justify-center py-4 print:p-0 print:m-0 print:overflow-visible">
                <div 
                    id="letter-a4-sheet"
                    className={`relative bg-white text-gray-900 flex flex-col justify-between shadow-2xl border print:shadow-none print:border-none
                    ${['REJECTED', 'PENDING', 'DELETED'].includes(letter.status) ? 'opacity-50 grayscale print:hidden' : ''}`}
                    style={{ 
                        width: '210mm', 
                        height: '297mm',
                        maxHeight: '297mm',
                        padding: '12mm 15mm 12mm 15mm',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        fontFamily: printFont,
                        backgroundImage: (printMode === 'LETTERHEAD' && showLetterheadBg) ? `url(${sarbargImg})` : 'none',
                        backgroundSize: '210mm 297mm',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'top center'
                    }}
                >
                    <div className="flex-1 flex flex-col overflow-hidden">
                        
                        {/* هدر نامه */}
                        <div className="flex justify-between items-start pb-2 relative mt-1 shrink-0">
                            <div className={`flex flex-col items-center justify-start pt-1 w-1/3 ${printMode === 'LETTERHEAD' ? 'opacity-20 print:invisible' : ''}`}>
                                <DraggableElement id="head-logo-img" label="لوگو" isEditMode={isLayoutEditMode} position={layoutPositions['head-logo-img']} styleData={layoutStyles['head-logo-img']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="mb-2 flex justify-center">
                                    {letter.letter_type === 'INCOMING' ? (
                                        letter.external_sender_detail?.logo ? (
                                            <img src={letter.external_sender_detail.logo} alt="لوگو" className="h-14 md:h-16 object-contain print:h-16" />
                                        ) : (
                                            <SharinganIncomingLogo />
                                        )
                                    ) : (
                                        <img src={logo} alt="لوگو" className="h-14 md:h-16 object-contain print:h-16 print:grayscale-0" />
                                    )}
                                </DraggableElement>
                                
                                <DraggableElement id="head-logo-name" label="نام سازمان" isEditMode={isLayoutEditMode} position={layoutPositions['head-logo-name']} styleData={layoutStyles['head-logo-name']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="font-bold text-[11px] md:text-sm print:text-sm text-center leading-tight">
                                    <div className="w-full text-center">
                                        <span>{letter.final_sender_name}</span>
                                    </div>
                                </DraggableElement>
                            </div>
                            
                            <DraggableElement id="head-besmella" label="به نام خدا" isEditMode={isLayoutEditMode} position={layoutPositions['head-besmella']} styleData={layoutStyles['head-besmella']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className={`w-1/3 pt-2 md:pt-4 ${printMode === 'LETTERHEAD' ? 'opacity-20 print:invisible' : ''}`}>
                                <div className="w-full flex justify-center items-center text-center">
                                    <span className="font-bold text-lg md:text-xl print:text-2xl tracking-widest text-black text-center">به نام خدا</span>
                                </div>
                            </DraggableElement>

                            {/* شماره، تاریخ، پیوست و بارکد QR */}
                            <div className="flex items-start justify-end gap-3 w-1/3 pt-1 text-black">
                                <div className="flex flex-col text-[11px] md:text-sm print:text-sm font-bold items-end space-y-2">
                                    {letter.original_number ? (
                                        <DraggableElement id="head-number" label="شماره نامه" isEditMode={isLayoutEditMode} position={layoutPositions['head-number']} styleData={layoutStyles['head-number']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-center gap-2">
                                            {printMode !== 'LETTERHEAD' && <span className="opacity-80 font-normal">شماره : </span>}
                                            {renderFormattedNumber(letter.original_number)}
                                        </DraggableElement>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-400 print:hidden">
                                            {printMode !== 'LETTERHEAD' && <span className="font-normal">شماره : </span>}
                                            <span>پس از تایید</span>
                                        </div>
                                    )}
                                    
                                    {letter.original_date && (
                                        <DraggableElement id="head-date" label="تاریخ نامه" isEditMode={isLayoutEditMode} position={layoutPositions['head-date']} styleData={layoutStyles['head-date']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-center gap-2">
                                            {printMode !== 'LETTERHEAD' && <span className="opacity-80 font-normal">تاریخ : </span>}
                                            <span className="print:text-sm">{new Date(letter.original_date).toLocaleDateString('fa-IR')}</span>
                                        </DraggableElement>
                                    )}
                                    
                                    <DraggableElement id="head-attachment" label="پیوست" isEditMode={isLayoutEditMode} position={layoutPositions['head-attachment']} styleData={layoutStyles['head-attachment']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-center gap-2">
                                        {printMode !== 'LETTERHEAD' && <span className="opacity-80 font-normal">پیوست: </span>}
                                        <span className="print:text-sm">{letter.attachment_note || (letter.attachments?.length > 0 ? 'دارد' : 'ندارد')}</span>
                                    </DraggableElement>
                                </div>

                                <DraggableElement id="head-letter-qr" label="بارکد QR" isEditMode={isLayoutEditMode} position={layoutPositions['head-letter-qr']} styleData={layoutStyles['head-letter-qr']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="shrink-0 relative">
                                {/* دکمه‌های شناور تنظیم سریع اندازه در حالت ادیت */}
                                {isLayoutEditMode && (
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/90 text-white px-2 py-0.5 rounded-full text-[10px] font-mono shadow-xl z-40 select-none whitespace-nowrap print:hidden">
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const curScale = layoutStyles['head-letter-qr']?.scale || 1;
                                                handleUpdateStyle('head-letter-qr', { 
                                                    ...layoutStyles['head-letter-qr'], 
                                                    scale: Math.max(0.5, Math.round((curScale - 0.1) * 10) / 10) 
                                                });
                                            }}
                                            className="p-1 hover:text-amber-400 font-bold"
                                            title="کوچک‌تر"
                                        >
                                            <FaMinus size={8} />
                                        </button>
                                        <span className="text-[10px] text-amber-300 px-1 font-bold">
                                            {Math.round((layoutStyles['head-letter-qr']?.scale || 1) * 100)}%
                                        </span>
                                        <button 
                                            type="button" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const curScale = layoutStyles['head-letter-qr']?.scale || 1;
                                                handleUpdateStyle('head-letter-qr', { 
                                                    ...layoutStyles['head-letter-qr'], 
                                                    scale: Math.min(2.2, Math.round((curScale + 0.1) * 10) / 10) 
                                                });
                                            }}
                                            className="p-1 hover:text-amber-400 font-bold"
                                            title="بزرگ‌تر"
                                        >
                                            <FaPlus size={8} />
                                        </button>
                                    </div>
                                )}

                                <div className="p-1 bg-white border border-gray-300 print:border-black rounded-md flex flex-col items-center justify-center shadow-sm" title={currentLetterUrl}>
                                    <QRCode
                                        value={currentLetterUrl}
                                        size={Math.round(50 * (layoutStyles['head-letter-qr']?.scale || 1))}
                                        level="M"
                                        fgColor="#000000"
                                        bgColor="#FFFFFF"
                                    />
                                </div>
                            </DraggableElement>
                            </div>
                        </div>

                        {/* خط جداکننده زیر هدر */}
                        <DraggableElement id="header-divider" label="خط جداکننده هدر" isEditMode={isLayoutEditMode} position={layoutPositions['header-divider']} styleData={layoutStyles['header-divider']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className={`w-full mb-4 shrink-0 ${printMode === 'LETTERHEAD' ? 'opacity-20 print:invisible' : ''}`}>
                            <div className="border-b-4 border-gray-400 print:border-black w-full"></div>
                        </DraggableElement>

                        {/* مشخصات مخاطب و موضوع */}
                        <div className="space-y-2 mb-4 text-sm md:text-base print:text-base leading-relaxed text-black shrink-0">
                            {letter.final_receiver_name && letter.final_receiver_name !== "-" && (
                                <DraggableElement id="body-receiver" label="مخاطب/گیرنده" isEditMode={isLayoutEditMode} position={layoutPositions['body-receiver']} styleData={layoutStyles['body-receiver']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline w-full">
                                    <strong className="text-lg">{letter.final_receiver_name}</strong>
                                </DraggableElement>
                            )}

                            {letter.receiver_persons && (
                                <DraggableElement id="body-receiver-titles" label="عناوین گیرنده" isEditMode={isLayoutEditMode} position={layoutPositions['body-receiver-titles']} styleData={layoutStyles['body-receiver-titles']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-start mt-1 text-sm w-full">
                                    <p className="whitespace-pre-wrap font-bold leading-relaxed">{letter.receiver_persons}</p>
                                </DraggableElement>
                            )}
                            
                            <DraggableElement id="body-subject" label="موضوع نامه" isEditMode={isLayoutEditMode} position={layoutPositions['body-subject']} styleData={layoutStyles['body-subject']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline mt-2 w-full">
                                <span className="w-24 opacity-80 font-normal shrink-0">موضوع: </span> 
                                <strong className="text-lg flex-1">{letter.subject}</strong>
                            </DraggableElement>

                            {(letter.reference_letter_detail || letter.reference_number) && (
                                <DraggableElement id="body-ref" label="عطف به" isEditMode={isLayoutEditMode} position={layoutPositions['body-ref']} styleData={layoutStyles['body-ref']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline mt-2 w-full">
                                    <span className="w-24 opacity-80 shrink-0">عطف به:</span> 
                                    <div className="flex flex-wrap items-center gap-2 flex-1">
                                        {letter.reference_letter_detail && (
                                            <Link 
                                                to={`/secretariat/${letter.reference_letter_detail.id}`} 
                                                onClick={(e) => isLayoutEditMode && e.preventDefault()}
                                                className="font-bold text-blue-700 print:text-black hover:underline"
                                            >
                                                نامه {letter.reference_letter_detail.indicator_number} ({letter.reference_letter_detail.subject})
                                            </Link>
                                        )}
                                        {letter.reference_letter_detail && letter.reference_number && <span className="opacity-50">|</span>}
                                        {letter.reference_number && (
                                            <strong className="text-base font-mono" dir="ltr">{letter.reference_number}</strong>
                                        )}
                                    </div>
                                </DraggableElement>
                            )}

                            {letter.contract_number && (
                                <DraggableElement id="body-contract" label="شماره قرارداد" isEditMode={isLayoutEditMode} position={layoutPositions['body-contract']} styleData={layoutStyles['body-contract']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="flex items-baseline w-full">
                                    <span className="w-24 opacity-80 shrink-0">شماره قرارداد:</span> 
                                    <strong className="text-base font-mono" dir="ltr">{letter.contract_number}</strong>
                                </DraggableElement>
                            )}
                        </div>

                        {/* متن اصلی نامه با قابلیت تنظیم عرض پاراگراف و کنترل خطوط */}
                        {letter.body && (
                            <DraggableElement 
                                id="body-content" 
                                label="متن اصلی نامه" 
                                isEditMode={isLayoutEditMode} 
                                position={layoutPositions['body-content']} 
                                styleData={layoutStyles['body-content']} 
                                onStyleChange={handleUpdateStyle} 
                                onDragEnd={handleUpdatePosition} 
                                className="text-justify leading-loose flex-1 text-sm md:text-base print:text-base whitespace-pre-wrap font-medium text-black overflow-hidden"
                            >
                                <div 
                                    style={{ 
                                        width: `${layoutStyles['body-content']?.widthPercent || 100}%`,
                                        margin: '0 auto',
                                        transition: 'width 0.15s ease-out'
                                    }}
                                >
                                    {letter.body}
                                </div>
                            </DraggableElement>
                        )}

                        

                        {/* ردیف پایینی شامل رونوشت، مهر مقصد و المان‌های کاملاً تفکیک‌شده امضا */}
                        <div className="flex justify-between items-end pb-2 relative text-black avoid-break mt-auto shrink-0">
                            
                            {/* رونوشت */}
                            <DraggableElement id="footer-cc" label="رونوشت" isEditMode={isLayoutEditMode} position={layoutPositions['footer-cc']} styleData={layoutStyles['footer-cc']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="w-1/3 text-xs print:text-sm opacity-90">
                                {(letter.cc_text || letter.internal_cc_names?.length > 0) && (
                                    <div className="border-t border-gray-400 print:border-black pt-2 pr-2 inline-block min-w-[180px]">
                                        <strong className="block mb-1 text-sm">رونوشت:</strong>
                                        {letter.cc_text && <p className="whitespace-pre-wrap mb-1">{letter.cc_text}</p>}
                                        {letter.internal_cc_names?.map((name, i) => <div key={i}>- {name}</div>)}
                                    </div>
                                )}
                            </DraggableElement>
                            
                            {/* مهر ثبت مقصد */}
                            <DraggableElement id="footer-dest" label="مهر ثبت مقصد" isEditMode={isLayoutEditMode} position={layoutPositions['footer-dest']} styleData={layoutStyles['footer-dest']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="w-1/3 flex justify-center items-center relative h-28">
                                {((letter.letter_type === 'OUTGOING' || letter.letter_type === 'INCOMING') && letter.destination_indicator) && (
                                    <div className="absolute transform -rotate-12 border-4 border-double border-red-600 text-red-600 px-4 py-2 rounded-lg flex flex-col items-center justify-center opacity-80 print:opacity-100 mix-blend-multiply" style={{ minWidth: '150px' }}>
                                        <span className="text-xs font-black tracking-widest text-center mb-1">
                                            {letter.letter_type === 'INCOMING' ? 'ثبت در دبیرخانه' : 'ثبت در مقصد'}
                                        </span>
                                        <div className="w-full border-b-[2px] border-dashed border-red-600 my-1 opacity-70"></div>
                                        <span className="font-mono text-lg font-bold mt-0.5" dir="ltr">
                                            {renderFormattedNumber(letter.destination_indicator)}
                                        </span>
                                        {letter.destination_date && <span className="text-[10px] font-bold mt-0.5">{new Date(letter.destination_date).toLocaleDateString('fa-IR')}</span>}
                                    </div>
                                )}
                            </DraggableElement>

                            {/* 🚀 ستون امضا با اجزای کاملاً تفکیک‌شده و درگ مستقل */}
                            <div className="w-1/3 flex flex-col items-center text-center relative">
                                
                                {/* ۱. عنوان مهر و امضا (مستقل) */}
                                <DraggableElement 
                                    id="footer-sign-title" 
                                    label="عنوان امضا" 
                                    isEditMode={isLayoutEditMode} 
                                    position={layoutPositions['footer-sign-title']} 
                                    styleData={layoutStyles['footer-sign-title']} 
                                    onStyleChange={handleUpdateStyle} 
                                    onDragEnd={handleUpdatePosition} 
                                    className="mb-1 text-sm font-bold w-full text-center"
                                >
                                    مهر و امضا
                                </DraggableElement>

                                {/* ۲. تصویر امضا با تولبار مقیاس در ادیت (مستقل) */}
                                <DraggableElement 
                                    id="footer-sign-img" 
                                    label="تصویر امضا" 
                                    isEditMode={isLayoutEditMode} 
                                    position={layoutPositions['footer-sign-img']} 
                                    styleData={layoutStyles['footer-sign-img']} 
                                    onStyleChange={handleUpdateStyle} 
                                    onDragEnd={handleUpdatePosition} 
                                    className="flex flex-col justify-center items-center w-full min-h-[85px] my-1 relative"
                                >
                                    {isLayoutEditMode && (
                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-gray-900/90 text-white px-2 py-0.5 rounded-full text-[10px] font-mono shadow-xl z-40 select-none whitespace-nowrap print:hidden">
                                            <button 
                                                type="button" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const curScale = layoutStyles['footer-sign-img']?.scale || 1;
                                                    handleUpdateStyle('footer-sign-img', { 
                                                        ...layoutStyles['footer-sign-img'], 
                                                        scale: Math.max(0.4, Math.round((curScale - 0.1) * 10) / 10) 
                                                    });
                                                }}
                                                className="p-1 hover:text-amber-400 font-bold"
                                                title="کوچک‌تر"
                                            >
                                                <FaMinus size={8} />
                                            </button>
                                            <span className="text-[10px] text-amber-300 px-1 font-bold">
                                                {Math.round((layoutStyles['footer-sign-img']?.scale || 1) * 100)}%
                                            </span>
                                            <button 
                                                type="button" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const curScale = layoutStyles['footer-sign-img']?.scale || 1;
                                                    handleUpdateStyle('footer-sign-img', { 
                                                        ...layoutStyles['footer-sign-img'], 
                                                        scale: Math.min(2.0, Math.round((curScale + 0.1) * 10) / 10) 
                                                    });
                                                }}
                                                className="p-1 hover:text-amber-400 font-bold"
                                                title="بزرگ‌تر"
                                            >
                                                <FaPlus size={8} />
                                            </button>
                                        </div>
                                    )}

                                    {(letter.drawn_signature || letter.signature || letter.signature_image || letter.signature_url) ? (
                                        <img 
                                            src={letter.drawn_signature || letter.signature || letter.signature_image || letter.signature_url} 
                                            alt="امضا" 
                                            style={{ 
                                                height: `${Math.round(90 * (layoutStyles['footer-sign-img']?.scale || 1))}px`,
                                                maxHeight: '150px',
                                                width: 'auto',
                                                maxWidth: '100%',
                                                objectFit: 'contain'
                                            }}
                                            className="mix-blend-multiply select-none pointer-events-none drop-shadow-sm" 
                                        />
                                    ) : (
                                        <div className="h-16 w-full flex items-center justify-center border border-dashed border-gray-200 rounded text-gray-300 text-xs print:border-none">
                                            محل امضا
                                        </div>
                                    )}
                                </DraggableElement>

                                {/* ۳. نام و سمت امضاکننده (مستقل) */}
                                <DraggableElement 
                                    id="footer-sign-name" 
                                    label="نام امضاکننده" 
                                    isEditMode={isLayoutEditMode} 
                                    position={layoutPositions['footer-sign-name']} 
                                    styleData={layoutStyles['footer-sign-name']} 
                                    onStyleChange={handleUpdateStyle} 
                                    onDragEnd={handleUpdatePosition} 
                                    className="mt-1 text-center w-full font-bold text-sm whitespace-pre-wrap leading-relaxed"
                                >
                                    {letter.manual_sender_name || letter.final_sender_name || 'مدیرعامل'}
                                </DraggableElement>
                            </div>
                        </div>
                    </div>

                    {/* پاورقی شرکت (تنها در برگه معمولی چاپ می‌شود و در سربرگ آرم‌دار مخفی است) */}
                    {printMode === 'BLANK' && letter.letter_type !== 'INCOMING' && (
                        <DraggableElement id="company-footer" label="پاورقی شرکت" isEditMode={isLayoutEditMode} position={layoutPositions['company-footer']} styleData={layoutStyles['company-footer']} onStyleChange={handleUpdateStyle} onDragEnd={handleUpdatePosition} className="w-full pt-2 avoid-break mt-auto shrink-0">
                            <div className="border-t-[3px] border-gray-400 print:border-black pt-2 flex justify-between items-end gap-4 text-gray-800 print:text-black">
                                <div className="relative flex items-center justify-center p-1 bg-white border-2 border-gray-300 print:border-black rounded-lg">
                                    <QRCode
                                        value="https://www.ariobonyantoos.com/"
                                        size={68}
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

                                <div className="flex flex-col text-right text-[10px] print:text-[11px] font-bold space-y-1">
                                    <div className="flex items-center justify-end gap-2">
                                        <span>مشهد، هاشمیه ۵۱، پلاک ۱۳۶</span>
                                        <div className="w-4 h-4 flex items-center justify-center border border-cyan-500 rounded text-cyan-500"><FaMapMarkerAlt size={9} /></div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="font-mono" dir="ltr">051 - 376 17880 | 376 46801</span>
                                        <div className="w-4 h-4 flex items-center justify-center border border-cyan-500 rounded text-cyan-500"><FaPhoneAlt size={9} /></div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="font-mono" dir="ltr">0910 555 0268 - 0915 255 3010</span>
                                        <div className="w-4 h-4 flex items-center justify-center border border-cyan-500 rounded text-cyan-500"><FaMobileAlt size={9} /></div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="font-mono">ariobonyantoos@gmail.com</span>
                                        <div className="w-4 h-4 flex items-center justify-center border border-cyan-500 rounded text-cyan-500"><FaEnvelope size={9} /></div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="font-mono">www.ariobonyantoos.com</span>
                                        <div className="w-4 h-4 flex items-center justify-center border border-cyan-500 rounded text-cyan-500"><FaGlobe size={9} /></div>
                                    </div>
                                </div>
                            </div>
                        </DraggableElement>
                    )}
                </div>
            </div>

            {/* بخش عطف و پاسخ‌ها */}
            {(letter.reference_letter_detail || (letter.replies && letter.replies.length > 0)) && (
                <div className={`p-4 mb-6 rounded-xl border-l-4 print:hidden mt-6 ${isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-500'}`}>
                    {letter.reference_letter_detail && (
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <FaArrowRight className="text-blue-500 text-xs" />
                            <span className="text-sm font-bold opacity-80">پاسخی است به (عطف سیستمی):</span>
                            <Link to={`/secretariat/${letter.reference_letter_detail.id}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                نامه {letter.reference_letter_detail.indicator_number} — {letter.reference_letter_detail.subject}
                            </Link>
                        </div>
                    )}
                    {letter.replies && letter.replies.length > 0 && (
                        <div className="flex items-start gap-2 mt-2">
                            <FaLink className="text-blue-500 text-xs mt-1" />
                            <div className="flex flex-col space-y-1">
                                <span className="text-sm font-bold opacity-80 mb-1">پاسخ‌های ثبت‌شده برای این نامه:</span>
                                {letter.replies.map(reply => (
                                    <Link key={reply.id} to={`/secretariat/${reply.id}`} className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline before:content-['•'] before:ml-2">
                                        نامه {reply.indicator_number} — {reply.subject}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* بخش لاگ پیامک‌ها */}
            {isBoardMember && smsLogs && smsLogs.length > 0 && (
                <div className={`mt-6 pt-6 border-t border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} print:hidden`}>
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-black flex items-center gap-2 opacity-80 text-indigo-500">
                            <FaSms /> وضعیت پیامک‌های ارسالی (اطلاع‌رسانی و پیگیری)
                        </h4>
                        <button 
                            type="button" 
                            onClick={() => dispatch(fetchLetterSmsLogs(id))}
                            className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-bold transition active:scale-95"
                            title="به‌روزرسانی لیست پیامک‌ها"
                        >
                            <FaSyncAlt size={11} /> به‌روزرسانی لیست
                        </button>
                    </div>

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
                                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{log.to_user} ({log.phone})</span>
                                        <div className="flex items-center gap-2 text-[10px] font-medium opacity-60 mt-0.5">
                                            <span>ارسال: {new Date(log.created_at).toLocaleString('fa-IR')}</span>
                                            {log.checked_at && (
                                                <span>• آخرین استعلام: {new Date(log.checked_at).toLocaleTimeString('fa-IR')}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                                        log.delivery_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 
                                        log.delivery_status === 'FAILED' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' : 
                                        'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800'
                                    }`}>
                                        {log.delivery_status === 'DELIVERED' ? '✅ تحویل شده به گوشی' : 
                                         log.delivery_status === 'FAILED' ? `❌ ${log.error || 'ارسال ناموفق'}` : 
                                         '⏳ در انتظار مخابرات'}
                                    </span>
                                    <button 
                                        onClick={() => handleRefreshSms(log.id)} 
                                        disabled={refreshingSms || log.delivery_status === 'DELIVERED'} 
                                        className="text-[10px] flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 px-2.5 py-1.5 rounded-lg transition disabled:opacity-40 font-bold active:scale-95"
                                        title={log.delivery_status === 'DELIVERED' ? 'تحویل شده است' : 'استعلام وضعیت از مخابرات'}
                                    >
                                        <FaSyncAlt className={refreshingSms ? "animate-spin" : ""} size={10} /> استعلام
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* بخش ارجاعات */}
            {letter.referrals && letter.referrals.length > 0 && (
                <div className={`mt-6 pt-6 border-t border-dashed ${isDark ? 'border-gray-600' : 'border-gray-300'} print:hidden`}>
                    <h4 className="text-sm font-black mb-4 flex items-center gap-2 opacity-80 text-indigo-600"><FaHistory /> تاریخچه ارجاعات</h4>
                    <div className="space-y-3">
                        {letter.referrals.map((ref) => {
                            const isMyReferral = ref.sender === userInfo?.id || isLevelZeroOrAdmin;
                            return (
                                <div key={ref.id} className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex justify-between items-center mb-1.5 border-b border-gray-200 dark:border-gray-700 pb-1.5">
                                        <div className="flex items-center gap-2 text-[11px] font-bold">
                                            <span className="text-blue-600 dark:text-blue-400">{ref.sender_name}</span>
                                            <FaArrowLeft className="text-gray-400 text-[10px]" />
                                            <span className="text-emerald-600 dark:text-emerald-400">{ref.receiver_name}</span>
                                        </div>
                                        <span className="text-[9px] font-medium opacity-60 font-mono" dir="ltr">{new Date(ref.created_at).toLocaleString('fa-IR')}</span>
                                    </div>
                                    
                                    {editingRefId === ref.id ? (
                                        <div className="mt-2 flex flex-col gap-2">
                                            <textarea 
                                                className={`w-full p-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-slate-800 text-white border-slate-600' : 'bg-white text-gray-800 border-gray-300'}`} 
                                                value={editRefText} 
                                                onChange={(e) => setEditRefText(e.target.value)}
                                                rows="2"
                                            />
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => setEditingRefId(null)} className="text-xs px-4 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded font-bold transition">انصراف</button>
                                                <button onClick={() => handleEditReferralSubmit(ref.id)} className="text-xs px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition">ذخیره</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs leading-relaxed font-bold text-gray-800 dark:text-gray-200 mt-1 flex justify-between items-start gap-2 group">
                                            <div>
                                                {ref.instruction ? <span className="whitespace-pre-wrap"><span className="opacity-50 text-[10px] ml-1">شرح:</span> {ref.instruction}</span> : <span className="opacity-40 italic font-normal">فقط ارجاع</span>}
                                            </div>
                                            {isMyReferral && (
                                                <button onClick={() => { setEditingRefId(ref.id); setEditRefText(ref.instruction || ''); }} className="text-blue-500 hover:text-blue-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity" title="ویرایش متن ارجاع">
                                                    <FaEdit size={13} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* بخش پیوست‌ها */}
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