// src/pages/admin/user-details/SystemInfoPage.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import { updateUser } from '../../../features/admin/users/usersSlice';

const SystemInfoPage = () => {
  const dispatch = useDispatch();
  // دریافت کاربر از Outlet (پدر)
  const { user } = useOutletContext(); 
  
  const { updateStatus } = useSelector((state) => state.admin.users);
  const { loading, success, error } = updateStatus;

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    is_admin: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.profile?.phone_number || '',
        is_admin: user.is_superuser || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number,
      is_admin: formData.is_admin,
    };
    dispatch(updateUser({ userId: user.id, data: payload }));
  };

  if (!user) return <div className="text-center text-gray-500 py-10">کاربر یافت نشد</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* بقیه کد فرم شما بدون هیچ تغییری در اینجا قرار می‌گیرد */}
      {/* ... */}
    </form>
  );
};

export default SystemInfoPage;
