import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCartable } from '../../features/secretariat/secretariatSlice';
import { FaEnvelope, FaPlaneDeparture, FaMoneyBillWave, FaTools } from 'react-icons/fa';

const CartableScreen = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const isDark = useSelector((state) => state.theme?.mode === 'dark');
    const { cartableItems, loadingCartable, error } = useSelector((state) => state.secretariat);

    useEffect(() => {
        dispatch(fetchCartable());
    }, [dispatch]);

    const getIcon = (type) => {
        switch(type) {
            case 'LETTER': return <FaEnvelope className="text-blue-500 text-xl" />;
            case 'LEAVE': return <FaPlaneDeparture className="text-orange-500 text-xl" />;
            case 'FINANCIAL': return <FaMoneyBillWave className="text-green-500 text-xl" />;
            case 'EQUIPMENT': return <FaTools className="text-purple-500 text-xl" />;
            default: return <FaEnvelope className="text-gray-500 text-xl" />;
        }
    };

    const getLink = (item) => {
        if (item.type === 'LETTER') return `/secretariat/${item.item_id}`;
        // مسیرهای دیگر را بر اساس ساختار پروژه‌تان تنظیم کنید
        return '#'; 
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                کارتابل ورودی (موارد در انتظار اقدام)
            </h2>

            {loadingCartable ? (
                <div className="text-center py-10">در حال بارگذاری...</div>
            ) : error ? (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
            ) : cartableItems?.length === 0 ? (
                <div className="text-center py-10 opacity-60">کارتابل شما خالی است.</div>
            ) : (
                <div className="space-y-4">
                    {cartableItems.map((item) => (
                        <div 
                            key={`${item.type}-${item.id}`}
                            onClick={() => navigate(getLink(item))}
                            className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${
                                isDark ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-400'
                            }`}
                        >
                            <div className={`p-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                {getIcon(item.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-lg">{item.title}</h3>
                                    <span className="text-xs opacity-70">
                                        {new Date(item.date).toLocaleDateString('fa-IR')}
                                    </span>
                                </div>
                                <div className="text-sm opacity-80 mb-2">از طرف: {item.sender_name}</div>
                                <p className={`text-sm p-2 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default CartableScreen;