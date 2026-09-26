// src/screens/AssetVerifyScreen.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// 👈 اینجا از api اینسپت شده خودت استفاده نکردیم چون توکن نمیخواد، از axios خام استفاده کردیم
const AssetVerifyScreen = () => {
  const { assetCode } = useParams();
  const [assetData, setAssetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        // درخواست به API عمومی
        const { data } = await axios.get(`/api/inventory/assets/verify/${assetCode}/`);
        setAssetData(data);
      } catch (err) {
        setError('کالای مورد نظر در سیستم آریو بنیان توس یافت نشد.');
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [assetCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center border-t-4 border-red-500">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-red-600 mb-2">خطا</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900 p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-blue-500/20">
        
        {/* هدر */}
        <div className="bg-blue-600 p-6 text-center text-white">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
            {/* میتونی لوگوی شرکتت رو اینجا بذاری */}
            <span className="text-blue-600 text-3xl font-black">ABT</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{assetData.company}</h1>
          <p className="text-blue-200 text-sm mt-1 font-medium">سامانه رهگیری اموال و دارایی‌ها</p>
        </div>

        {/* عکس کالا */}
        {assetData.image ? (
          <img src={assetData.image} alt={assetData.item_name} className="w-full h-56 object-cover border-b border-gray-100" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center border-b border-gray-200">
            <span className="text-gray-400 text-5xl">📦</span>
          </div>
        )}

        {/* مشخصات */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">نوع دارایی</p>
            <h2 className="text-2xl font-black text-gray-800">{assetData.item_name}</h2>
            <div className="inline-block mt-3 bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest font-mono">
              {assetData.asset_code}
            </div>
          </div>

          {/* پیام وضعیت */}
          {assetData.is_lost ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-center font-bold text-sm">
              🚨 این کالا در سیستم مفقود اعلام شده است!
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-center font-bold text-sm">
              ✅ اصالت این کالا تایید شد
            </div>
          )}

          {/* آدرس بازگشت (آدرسی که خواستی بنویسیم) */}
          <div className="bg-blue-50 p-4 rounded-xl text-sm leading-relaxed text-blue-900 border border-blue-100 mt-6">
            <p className="font-bold mb-2 flex items-center gap-2">
              <span className="text-lg">📍</span> در صورت پیداشدن:
            </p>
            <p>این اموال متعلق به شرکت آریو بنیان توس می‌باشد. از یابنده تقاضا می‌شود کالا را به آدرس زیر تحویل داده و مژدگانی دریافت نماید:</p>
            <p className="mt-2 font-bold opacity-80">مشهد، [آدرس دقیق دفتر یا انبار مرکزی را اینجا بنویس]</p>
            <p className="mt-2 font-bold opacity-80">تلفن تماس: ۰۵۱-۱۲۳۴۵۶۷۸</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetVerifyScreen;