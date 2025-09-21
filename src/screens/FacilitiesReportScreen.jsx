import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import api from '../actions/axios';
import { submitFacilitiesReport, resetReportForm } from '../features/dailyReports/reportFormsSlice';
import styles from '../css/FacilitiesReport.module.css'; // Import CSS module

// SVG Icons as React Components for cleaner JSX
const CameraIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="13" r="4"></circle>
  </svg>
);

const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>
);

const AudioIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
    <line x1="12" y1="19" x2="12" y2="23"></line>
    <line x1="8" y1="23" x2="16" y2="23"></line>
  </svg>
);


const FacilitiesReportScreen = () => {
  const { reportId } = useParams();
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state) => state.reportForms);

  const [tasksCompleted, setTasksCompleted] = useState('');
  const [issuesFound, setIssuesFound] = useState('');
  const [files, setFiles] = useState([]);
  const [localSuccess, setLocalSuccess] = useState(false);

  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (success) {
      setLocalSuccess(true);
      setTasksCompleted('');
      setIssuesFound('');
      setFiles([]);
      dispatch(resetReportForm());
    }
  }, [success, dispatch]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  // Function to trigger the hidden file input
  const handleIconClick = () => {
    fileInputRef.current.click();
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
      const created = await dispatch(
        submitFacilitiesReport({
          reportId,
          formData: { tasks_completed: tasksCompleted, issues_found: issuesFound },
        })
      ).unwrap();

      if (files.length && created && created.id) {
        for (const file of files) {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('file_type', detectFileType(file));
          await api.post(`reports/${created.id}/upload/?model=facilitiesreport`, fd);
        }
      }

      setLocalSuccess(true);
    } catch (err) {
      console.error('submit facilities error:', err);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>گزارش تاسیسات</h2>

      {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
      {localSuccess && <div className={`${styles.message} ${styles.success}`}>ثبت با موفقیت انجام شد.</div>}

      <form onSubmit={submitHandler} encType="multipart/form-data" className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="tasksCompleted" className={styles.label}>شرح کارهای انجام شده</label>
          <textarea
            id="tasksCompleted"
            value={tasksCompleted}
            onChange={(e) => setTasksCompleted(e.target.value)}
            rows={6}
            className={styles.textarea}
            placeholder="مثلاً: تعمیر پمپ، تعویض فیلتر..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="issuesFound" className={styles.label}>مشکلات مشاهده شده</label>
          <textarea
            id="issuesFound"
            value={issuesFound}
            onChange={(e) => setIssuesFound(e.target.value)}
            rows={4}
            className={styles.textarea}
            placeholder="مثلاً: نشت آب در اتاقک شماره ۳..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>افزودن فایل (عکس، فیلم، صدا)</label>
          {/* Hidden file input */}
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*"
          />
          {/* Icon buttons to trigger file input */}
          <div className={styles.iconButtonsContainer}>
            <button type="button" className={styles.iconButton} onClick={handleIconClick} title="افزودن عکس">
              <CameraIcon />
              <span>عکس</span>
            </button>
            <button type="button" className={styles.iconButton} onClick={handleIconClick} title="افزودن فیلم">
              <VideoIcon />
              <span>فیلم</span>
            </button>
            <button type="button" className={styles.iconButton} onClick={handleIconClick} title="افزودن صدا">
              <AudioIcon />
              <span>صدا</span>
            </button>
          </div>

          {files.length > 0 && (
            <div className={styles.fileList}>
              {files.map((f, i) => (
                <div key={i} className={styles.fileListItem}>
                  <span>{f.name}</span>
                  <span>({(f.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'در حال ارسال...' : 'ثبت گزارش تاسیسات'}
        </button>
      </form>
    </div>
  );
};

export default FacilitiesReportScreen;