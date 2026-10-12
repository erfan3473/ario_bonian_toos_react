import React from 'react';
import { useSelector } from 'react-redux';
import QRCode from 'react-qr-code';
import logo from '../assets/ario.png';

const TARGET_URL = 'https://www.ariobonyantoos.com/';

const DomainQRScreen = () => {
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const handlePrint = () => {
    const printArea = document.getElementById('printable-card');
    if (!printArea) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8" />
        <title>چاپ QR Code - آریو بنیان توس</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            font-family: 'Tahoma', 'Vazir', sans-serif;
          }
          .card {
            width: 420px;
            padding: 36px 28px;
            border: 2px solid #1f2937;
            border-radius: 24px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            background: #ffffff;
            box-shadow: none;
          }
          .logo-header {
            height: 70px;
            width: auto;
            object-fit: contain;
            margin-bottom: 12px;
          }
          .title {
            margin: 0;
            font-size: 22px;
            font-weight: 900;
            color: #111827;
          }
          .url {
            direction: ltr;
            margin: 6px 0 16px 0;
            font-size: 13px;
            font-family: monospace;
            font-weight: bold;
            color: #2563eb;
          }
          .qr-wrapper {
            position: relative;
            padding: 16px;
            background: #ffffff;
            border: 2px solid #e5e7eb;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .center-logo-box {
            position: absolute;
            width: 54px;
            height: 54px;
            background: #ffffff;
            border: 2px solid #d1d5db;
            border-radius: 12px;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .center-logo-box img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .desc {
            margin-top: 16px;
            font-size: 12px;
            color: #4b5563;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <img src="${logo}" alt="لوگو" class="logo-header" />
          <h1 class="title">شرکت آریو بنیان توس</h1>
          <div class="url">${TARGET_URL}</div>

          <div class="qr-wrapper">
            ${document.getElementById('qr-svg-holder').innerHTML}
            <div class="center-logo-box">
              <img src="${logo}" alt="لوگو مرکز" />
            </div>
          </div>

          <p class="desc">جهت ورود سریع به سامانه، بارکد را اسکن کنید.</p>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 350);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSVG = async () => {
    const svgElem = document.getElementById('domain-qr-code');
    if (!svgElem) return;

    const clonedSvg = svgElem.cloneNode(true);

    // ۱. استخراج مختصات اصلی داخلی بارکد
    const rawVb = svgElem.getAttribute('viewBox');
    const [minX, minY, vbWidth, vbHeight] = rawVb
      ? rawVb.split(' ').map(Number)
      : [0, 0, 256, 256];

    // ۲. محاسبه حاشیه امن سفید (Quiet Zone) متناسب با اندازه ماتریس بارکد
    const margin = Math.max(2, Math.round(vbWidth * 0.08));
    const totalW = vbWidth + margin * 2;
    const totalH = vbHeight + margin * 2;
    const startX = minX - margin;
    const startY = minY - margin;

    // ۳. تنظیم ویوباکس بر مبنای مختصات ماتریس واقعی (جلوگیری از رفتن بارکد به گوشه)
    clonedSvg.setAttribute('width', '600');
    clonedSvg.setAttribute('height', '600');
    clonedSvg.setAttribute('viewBox', `${startX} ${startY} ${totalW} ${totalH}`);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // ۴. رسم پس‌زمینه سفید یکدست در کل فضای فایل و حاشیه‌ها
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', `${startX}`);
    bgRect.setAttribute('y', `${startY}`);
    bgRect.setAttribute('width', `${totalW}`);
    bgRect.setAttribute('height', `${totalH}`);
    bgRect.setAttribute('fill', '#FFFFFF');
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

    // ۵. تبدیل لوگو به Base64 برای ذخیره مستقل درون فایل SVG
    let logoBase64 = '';
    try {
      const response = await fetch(logo);
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('خطا در تبدیل لوگو:', e);
    }

    // ۶. قرار دادن لوگو دقیقاً در مرکز مختصات ماتریس بارکد
    if (logoBase64) {
      const centerX = minX + vbWidth / 2;
      const centerY = minY + vbHeight / 2;
      const logoBoxSize = vbWidth * 0.23; // اندازه استاندارد و ایمن برای Level H
      const logoOffset = centerX - logoBoxSize / 2;

      // کادر سفید دور لوگو برای تفکیک از پترن‌های مشکی بارکد
      const logoBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      logoBg.setAttribute('x', `${logoOffset}`);
      logoBg.setAttribute('y', `${logoOffset}`);
      logoBg.setAttribute('width', `${logoBoxSize}`);
      logoBg.setAttribute('height', `${logoBoxSize}`);
      logoBg.setAttribute('fill', '#FFFFFF');
      logoBg.setAttribute('rx', `${logoBoxSize * 0.15}`);
      clonedSvg.appendChild(logoBg);

      // قرار دادن تصویر لوگو
      const pad = logoBoxSize * 0.08;
      const imgSize = logoBoxSize - pad * 2;
      const imgElem = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      imgElem.setAttribute('href', logoBase64);
      imgElem.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', logoBase64);
      imgElem.setAttribute('x', `${logoOffset + pad}`);
      imgElem.setAttribute('y', `${logoOffset + pad}`);
      imgElem.setAttribute('width', `${imgSize}`);
      imgElem.setAttribute('height', `${imgSize}`);
      imgElem.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      clonedSvg.appendChild(imgElem);
    }

    // ۷. ساخت لینک دانلود
    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'ariobonyantoos-qr.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      <div
        id="printable-card"
        className={`w-full max-w-md rounded-2xl border p-8 flex flex-col items-center text-center shadow-2xl transition-all ${
          isDark
            ? 'bg-gray-900 border-gray-700 text-gray-100'
            : 'bg-white border-gray-200 text-gray-900'
        }`}
      >
        <div className="flex flex-col items-center mb-3">
          <img
            src={logo}
            alt="لوگو آریو بنیان توس"
            className="h-16 w-auto object-contain mb-2"
          />
          <h1 className="text-xl font-black">شرکت آریو بنیان توس</h1>
          <p
            dir="ltr"
            className={`text-xs mt-1 font-mono font-bold ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}
          >
            {TARGET_URL}
          </p>
        </div>

        <div className="relative p-4 bg-white rounded-2xl border-2 border-gray-200 shadow-inner my-2 flex items-center justify-center">
          <div id="qr-svg-holder">
            <QRCode
              id="domain-qr-code"
              value={TARGET_URL}
              size={210}
              level="H"
              fgColor="#000000"
              bgColor="#FFFFFF"
            />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 bg-white rounded-xl p-1 shadow border-2 border-gray-200 flex items-center justify-center">
              <img
                src={logo}
                alt="مرکز"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        <p className={`text-xs mt-3 font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          جهت ورود سریع به سامانه، دوربین تلفن همراه خود را روی کد قرار دهید.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 w-full justify-center">
          <button
            onClick={handlePrint}
            className="flex-1 min-w-[130px] bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>🖨️</span> چاپ برگه
          </button>
          <button
            onClick={handleDownloadSVG}
            className={`flex-1 min-w-[130px] font-bold py-2.5 px-4 rounded-xl border transition-all flex items-center justify-center gap-2 text-sm ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-800'
            }`}
          >
            <span>💾</span> دانلود SVG
          </button>
        </div>
      </div>
    </div>
  );
};

export default DomainQRScreen;