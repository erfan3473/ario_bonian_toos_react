// src/screens/admin/AdminPayrollScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Redux Actions
import { fetchAllPeriods, clearCurrentPeriod } from '../../features/payroll/payrollSlice';
import { fetchUserProfile } from '../../features/users/userSlice';

const AdminPayrollScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, type: 'success', message: '' });

  const userDetails = useSelector((state) => state.userDetails);
  const { user: userProfile } = userDetails;

  useEffect(() => {
    dispatch(fetchAllPeriods());
    if (!userProfile || Object.keys(userProfile).length === 0) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, userProfile]);

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 3000);
  };

  // Redirect to list by default
  useEffect(() => {
    navigate('/admin/payroll/list');
  }, []);

  return (
    <>
      {/* Global Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] text-white px-4 py-2 rounded-full shadow-lg text-sm ${
            snackbar.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {snackbar.message}
        </div>
      )}
    </>
  );
};

export default AdminPayrollScreen;
