import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../actions/axios';
import { submitSecurityReport, resetReportForm } from '../features/dailyReports/reportFormsSlice';
import styles from '../css/SecurityReport.module.css'; // Import dedicated CSS module

// SVG Icons
const CameraIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg> );
const VideoIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> );
const AudioIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> );

const emptyLog = () => ({ log_type: 'ENTRY', person_name: '', vehicle_details: '', reason: '', log_time: '' });

const SecurityReportScreen = () => {
  const { reportId } = useParams();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.reportForms);

  const [generalNotes, setGeneralNotes] = useState('');
  const [logs, setLogs] = useState([emptyLog()]);
  const [files, setFiles] = useState([]);
  const [localSuccess, setLocalSuccess] = useState(false);

  const fileInputRef = useRef(null);

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
  const handleIconClick = () => fileInputRef.current.click();

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
      const payload = { general_notes: generalNotes, logs };
      const created = await dispatch(submitSecurityReport({ reportId, formData: payload })).unwrap();

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
    <div className={styles.container}>
      <h2 className={styles.title}>گزارش نگهبانی</h2>

      {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
      {localSuccess && <div className={`${styles.message} ${styles.success}`}>ثبت با موفقیت انجام شد.</div>}

      <form onSubmit={submitHandler} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="generalNotes" className={styles.label}>یادداشت‌های کلی</label>
          <textarea
            id="generalNotes"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={5}
            className={styles.textarea}
            placeholder="یادداشت نگهبان..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>لاگ‌ها (ورود/خروج)</label>
          {logs.map((log, idx) => (
            <div key={idx} className={styles.logEntry}>
              <div className={styles.logHeader}>
                <select className={styles.select} value={log.log_type} onChange={(e) => handleLogChange(idx, 'log_type', e.target.value)}>
                  <option value="ENTRY">ورود</option>
                  <option value="EXIT">خروج</option>
                </select>
                <input
                  className={styles.input}
                  placeholder="نام شخص"
                  value={log.person_name}
                  onChange={(e) => handleLogChange(idx, 'person_name', e.target.value)}
                />
                <input
                  className={styles.input}
                  placeholder="مشخصات وسیله (اختیاری)"
                  value={log.vehicle_details}
                  onChange={(e) => handleLogChange(idx, 'vehicle_details', e.target.value)}
                />
              </div>
              <div className={styles.logBody}>
                <input
                  className={styles.input}
                  placeholder="دلیل / توضیحات"
                  value={log.reason}
                  onChange={(e) => handleLogChange(idx, 'reason', e.target.value)}
                />
              </div>
              <div className={styles.logFooter}>
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={log.log_time || ''}
                  onChange={(e) => handleLogChange(idx, 'log_time', e.target.value)}
                />
                <button type="button" onClick={() => removeLog(idx)} disabled={logs.length === 1} className={styles.removeLogButton}>
                  حذف
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addLog} className={styles.addLogButton}>
            افزودن لاگ جدید
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>افزودن فایل (اختیاری)</label>
          <input
            type="file" multiple onChange={handleFiles} ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*,audio/*"
          />
          <div className={styles.iconButtonsContainer}>
            <button type="button" className={styles.iconButton} onClick={handleIconClick} title="افزودن عکس"><CameraIcon /><span>عکس</span></button>
            <button type="button" className={styles.iconButton} onClick={handleIconClick} title="افزودن فیلم"><VideoIcon /><span>فیلم</span></button>
            <button type="button" className={styles.iconButton} onClick={handleIconClick} title="افزودن صدا"><AudioIcon /><span>صدا</span></button>
          </div>
          {files.length > 0 && (
            <div className={styles.fileList}>
              {files.map((f, i) => (
                <div key={i} className={styles.fileListItem}>
                  <span>{f.name}</span><span>({(f.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'در حال ارسال...' : 'ثبت گزارش نگهبانی'}
        </button>
      </form>
    </div>
  );
};

export default SecurityReportScreen;