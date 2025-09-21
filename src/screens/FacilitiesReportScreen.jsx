import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../actions/axios'
import { submitFacilitiesReport, resetReportForm } from '../features/dailyReports/reportFormsSlice';

const FacilitiesReportScreen = () => {
  const { reportId } = useParams();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.reportForms);

  const [tasksCompleted, setTasksCompleted] = useState('');
  const [issuesFound, setIssuesFound] = useState('');
  const [files, setFiles] = useState([]);
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      setLocalSuccess(true);
      // پاک‌کردن فرم محلی بعد از موفقیت
      setTasksCompleted('');
      setIssuesFound('');
      setFiles([]);
      // ریست کردن وضعیت گلوبال
      dispatch(resetReportForm());
    }
  }, [success, dispatch]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const detectFileType = (file) => {
    if (!file || !file.type) return 'IMAGE';
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'IMAGE';
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setLocalSuccess(false);

    try {
      // 1) ایجاد گزارش تاسیسات (بدون فایل)
      const created = await dispatch(
        submitFacilitiesReport({
          reportId,
          formData: { tasks_completed: tasksCompleted, issues_found: issuesFound },
        })
      ).unwrap();

      // 2) اگر فایل بود، برای هر فایل یک درخواست آپلود جدا ارسال کن
      if (files.length && created && created.id) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('file_type', detectFileType(file));
          // endpoint آپلود (همان چیزی که در بک‌اند تعریف کردی)
          await api.post(`reports/${created.id}/upload/?model=facilitiesreport`, fd);
        }
      }

      setLocalSuccess(true);
      // dispatch(resetReportForm()) handled in useEffect after slice success
    } catch (err) {
      // خطا در slice ذخیره می‌شود؛ اینجا هم لاگ می‌کنیم
      console.error('submit facilities error:', err);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2>گزارش تاسیسات</h2>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {localSuccess && <div style={{ color: 'green', marginBottom: 8 }}>ثبت با موفقیت انجام شد.</div>}

      <form onSubmit={submitHandler} encType="multipart/form-data">
        <div style={{ marginBottom: 12 }}>
          <label>شرح کارهای انجام شده</label>
          <textarea
            value={tasksCompleted}
            onChange={(e) => setTasksCompleted(e.target.value)}
            rows={6}
            style={{ width: '100%' }}
            placeholder="مثلاً: تعمیر پمپ، تعویض فیلتر..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>مشکلات مشاهده شده</label>
          <textarea
            value={issuesFound}
            onChange={(e) => setIssuesFound(e.target.value)}
            rows={4}
            style={{ width: '100%' }}
            placeholder="مثلاً: نشت آب در اتاقک شماره ۳..."
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
          {loading ? 'در حال ارسال...' : 'ثبت گزارش تاسیسات'}
        </button>
      </form>
    </div>
  );
};

export default FacilitiesReportScreen;
