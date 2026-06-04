import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }) => {
  // ۱. بررسی می‌کنیم که آیا کاربر لاگین کرده است یا خیر
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  
  // ۲. مسیر فعلی که کاربر قصد ورود به آن را داشته می‌گیریم
  const location = useLocation();

  // ۳. اگر لاگین نکرده بود، او را به صفحه auth می‌فرستیم و مسیر مدنظرش را در redirect ذخیره می‌کنیم
  if (!userInfo) {
    return <Navigate to={`/auth?redirect=${location.pathname}`} replace />;
  }

  // ۴. اگر لاگین کرده بود، اجازه می‌دهیم کامپوننت (صفحه) مورد نظرش رندر شود
  return children;
};

export default ProtectedRoute;
