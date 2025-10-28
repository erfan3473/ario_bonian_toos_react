// src/screens/ReportListScreen.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDailyReports } from '../features/dailyReports/dailyReportSlice';
import { Link, useParams } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ReportListScreen = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { reports, loading, error } = useSelector((state) => state.dailyReports);

  useEffect(() => {
    if (id) dispatch(fetchDailyReports(id));
  }, [dispatch, id]);

  if (loading) return <Loader />;
  if (error) return <Message variant="danger">{error}</Message>;

  return (
    <div>
      <h1>Daily Reports</h1>
      <ul>
        {reports.map((rep) => (
          <li key={rep.id}>
            <Link to={`/reports/${rep.id}`}>{rep.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReportListScreen;
