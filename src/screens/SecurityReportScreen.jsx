import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../actions/axios'
import { submitSecurityReport, resetReportForm } from '../features/dailyReports/reportFormsSlice';

const emptyLog = () => ({ log_type: 'ENTRY', person_name: '', vehicle_details: '', reason: '', log_time: '' });

const SecurityReportScreen = () => {
  const { reportId } = useParams();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.reportForms);

  const [generalNotes, setGeneralNotes] = useState('');
  const [logs, setLogs] = useState([emptyLog()]);
  const [files, setFiles] = useState([]);
  const [localSuccess, setLocalSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      setLocalSuccess(true);
      setGeneralNotes('');
      setLogs([emptyLog()]);
      setFiles([]);
      dispatch(resetReportForm());
    }
  }, [success, dispatch]);

  const handleFiles = (e) => setFiles(Array.from(e.target.files));

  const detectFileType = (file) => {
    if (!file || !file.type) return 'IMAGE';
    if (file.type.startsWith('image/')) return 'IMAGE';
    if (file.type.startsWith('video/')) return 'VIDEO';
    if (file.type.startsWith('audio/')) return 'AUDIO';
    return 'IMAGE';
  };

  const handleLogChange = (index, field, value) => {
    const copy = [...logs];
    copy[index][field] = value;
    setLogs(copy);
  };

  const addLog = () => setLogs((s) => [...s, emptyLog()]);
  const removeLog = (i) => setLogs((s) => s.filter((_, idx) => idx !== i));

  const submitHandler = async (e) => {
    e.preventDefault();
    setLocalSuccess(false);

    try {
      // payload اصلی (اگر serializer بک‌اند nested logs را نگرفت، لازم است endpoint جدا برای لاگ‌ها بسازیم)
      const payload = { general_notes: generalNotes, logs };

      const created = await dispatch(
        submitSecurityReport({ reportId, formData: payload })
      ).unwrap();

      // اگر فایل هست، آپلود جداگانه
      if (files.length && created && created.id) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('file_type', detectFileType(file));
          await api.post(`reports/${created.id}/upload/?model=securityreport`, fd);
        }
      }

      setLocalSuccess(true);
    } catch (err) {
      console.error('submit security error:', err);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2>گزارش نگهبانی</h2>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {localSuccess && <div style={{ color: 'green', marginBottom: 8 }}>ثبت با موفقیت انجام شد.</div>}

      <form onSubmit={submitHandler}>
        <div style={{ marginBottom: 12 }}>
          <label>یادداشت‌های کلی</label>
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={5}
            style={{ width: '100%' }}
            placeholder="یادداشت نگهبان..."
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>لاگ‌ها (ورود/خروج) — اختیاری</label>
          {logs.map((log, idx) => (
            <div key={idx} style={{ border: '1px solid #ddd', padding: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={log.log_type} onChange={(e) => handleLogChange(idx, 'log_type', e.target.value)}>
                  <option value="ENTRY">ورود (ENTRY)</option>
                  <option value="EXIT">خروج (EXIT)</option>
                </select>
                <input
                  placeholder="نام شخص"
                  value={log.person_name}
                  onChange={(e) => handleLogChange(idx, 'person_name', e.target.value)}
                />
                <input
                  placeholder="مشخصات وسیله (اختیاری)"
                  value={log.vehicle_details}
                  onChange={(e) => handleLogChange(idx, 'vehicle_details', e.target.value)}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <input
                  placeholder="دلیل / توضیحات"
                  value={log.reason}
                  onChange={(e) => handleLogChange(idx, 'reason', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <input
                  type="datetime-local"
                  value={log.log_time || ''}
                  onChange={(e) => handleLogChange(idx, 'log_time', e.target.value)}
                />
                <button type="button" onClick={() => removeLog(idx)} disabled={logs.length === 1}>
                  حذف لاگ
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={addLog}>
            افزودن لاگ جدید
          </button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>فایل‌ها (اختیاری)</label>
          <input type="file" multiple onChange={handleFiles} />
          {files.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {files.map((f, i) => (
                <div key={i}>{f.name} — {(f.size / 1024).toFixed(1)} KB</div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'در حال ارسال...' : 'ثبت گزارش نگهبانی'}
        </button>
      </form>
    </div>
  );
};

export default SecurityReportScreen;
