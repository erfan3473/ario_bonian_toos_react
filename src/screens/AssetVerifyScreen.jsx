// src/screens/AssetVerifyScreen.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const AssetVerifyScreen = () => {
  const { assetCode } = useParams();
  const [assetData, setAssetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const { data } = await axios.get(`/api/inventory/assets/verify/${assetCode}/`);
        setAssetData(data);
      } catch (err) {
        setError('کالای مورد نظر در سامانه اموال شرکت آریو بنیان توس یافت نشد.');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-900 p-4" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full text-center border-t-4 border-red-500">
          <span className="text-5xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-bold text-red-600 mb-2">کد اموال نامعتبر</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-blue-500/20">
        {/* هدر */}
        <div className="bg-blue-600 p-6 text-center text-white">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <span className="text-blue-600 text-2xl font-black">ABT</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">{assetData.company}</h1>
          <p className="text-blue-100 text-xs mt-1 font-medium">سامانه رسمی رهگیری اموال و دارایی‌ها</p>
        </div>

        {/* عکس کالا */}
        {assetData.image ? (
          <img
            src={assetData.image}
            alt={assetData.item_name}
            className="w-full h-52 object-cover border-b border-gray-100"
          />
        ) : (
          <div className="w-full h-36 bg-gray-100 flex items-center justify-center border-b border-gray-200">
            <span className="text-gray-400 text-5xl">📦</span>
          </div>
        )}

        {/* مشخصات */}
        <div className="p-6">
          <div className="text-center mb-5">
            <p className="text-xs text-gray-400 font-bold mb-1">عنوان دارایی</p>
            <h2 className="text-2xl font-black text-gray-800">{assetData.item_name}</h2>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="bg-gray-100 text-gray-800 px-3.5 py-1 rounded-full text-sm font-bold tracking-wider font-mono">
                {assetData.asset_code}
              </span>
              {assetData.serial_number && (
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-mono">
                  S/N: {assetData.serial_number}
                </span>
              )}
            </div>
          </div>

          {/* پیام وضعیت */}
          {assetData.is_lost ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-center font-bold text-sm">
              🚨 هشدار: این کالا در سامانه مفقود اعلام شده است!
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-center font-bold text-sm">
              ✅ اصالت این دارایی در سامانه تایید شد ({assetData.status_display})
            </div>
          )}

          {/* راهنمای تحویل */}
          <div className="bg-blue-50/80 p-4 rounded-xl text-xs leading-relaxed text-blue-950 border border-blue-100 mt-4">
            <p className="font-bold mb-1.5 flex items-center gap-1.5 text-sm">
              <span>📍</span> مالکیت سازمانی:
            </p>
            <p>
              این تجهیز متعلق به <strong>شرکت آریو بنیان توس</strong> است. در صورت پیدا شدن خارج از محیط کارگاه، لطفاً مراتب را به واحد انبار و تدارکات دفتر مرکزی شرکت در مشهد اطلاع دهید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetVerifyScreen;
