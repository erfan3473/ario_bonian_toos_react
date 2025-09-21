import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../actions/axios'
import { submitManagerReport, resetReportForm } from '../features/dailyReports/reportFormsSlice';

const detectFileType = (file) => {
  if (!file || !file.type) return 'IMAGE';
  if (file.type.startsWith('image/')) return 'IMAGE';
  if (file.type.startsWith('video/')) return 'VIDEO';
  if (file.type.startsWith('audio/')) return 'AUDIO';
  return 'IMAGE';
};

const ManagerReportScreen = () => {
  const { reportId } = useParams();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.reportForms);

  const [weather, setWeather] = useState('');
  const [workSummary, setWorkSummary] = useState('');
  const [incidents, setIncidents] = useState('');
  const [files, setFiles] = useState([]);
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      // پاک‌سازی محلی بعد از موفقیت
      setWeather('');
      setWorkSummary('');
      setIncidents('');
      setFiles([]);
      setLocalSuccess(true);
      // ریست گلوبال
      dispatch(resetReportForm());
    }
  }, [success, dispatch]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLocalSuccess(false);

    try {
      // 1) ارسال داده‌های فرم (بدون فایل)
      const created = await dispatch(
        submitManagerReport({
          reportId,
          formData: { weather, work_summary: workSummary, incidents },
        })
      ).unwrap();

      // 2) اگر فایل آپلود شده، جداگانه برای مدل ProjectManagerReport آپلود کن
      if (files.length && created && created.id) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('file_type', detectFileType(file));
          // مدل lowercaseِ content type که تو backend انتظار داری:
          await api.post(`reports/${created.id}/upload/?model=projectmanagerreport`, fd);
        }
      }
      // موفق
      setLocalSuccess(true);
    } catch (err) {
      console.error('submit manager report error:', err);
      // خطاها در slice ذخیره می‌شوند و نمایش داده می‌شود
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2>گزارش مدیر پروژه</h2>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {localSuccess && <div style={{ color: 'green', marginBottom: 8 }}>ثبت با موفقیت انجام شد.</div>}

      <form onSubmit={submitHandler} encType="multipart/form-data">
        <div style={{ marginBottom: 12 }}>
          <label>وضعیت آب و هوا</label>
          <input
            type="text"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            placeholder="مثلاً: آفتابی، بارانی..."
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>خلاصه کارهای انجام شده</label>
          <textarea
            value={workSummary}
            onChange={(e) => setWorkSummary(e.target.value)}
            rows={6}
            style={{ width: '100%' }}
            placeholder="توضیحاتی در مورد پیشرفت کار..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>وقایع و اتفاقات خاص</label>
          <textarea
            value={incidents}
            onChange={(e) => setIncidents(e.target.value)}
            rows={4}
            style={{ width: '100%' }}
            placeholder="حوادث، مشکلات یا یادداشت‌های مهم..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>فایل‌ها (اختیاری)</label>
          <input type="file" multiple onChange={handleFileChange} />
          {files.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {files.map((f, i) => (
                <div key={i}>{f.name} — {(f.size / 1024).toFixed(1)} KB</div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'در حال ارسال...' : 'ثبت گزارش مدیر'}
        </button>
      </form>
    </div>
  );
};

export default ManagerReportScreen;
