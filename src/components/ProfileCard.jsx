import React from 'react';
import Avatar from 'react-avatar';
import { FaCalendarAlt } from 'react-icons/fa';

const API_BASE = 'http://127.0.0.1:8000';

// تابع کمکی برای ساخت URL کامل تصویر
const getProfileImage = (user) => {
  if (!user?.profile?.image) return null;
  const img = user.profile.image;
  if (img.startsWith('http')) return img;
  return `${API_BASE}${img.startsWith('/') ? '' : '/'}${img}`;
};

// تابع کمکی برای فرمت کردن تاریخ به شمسی
const formatJoinDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
  }).format(new Date(dateString));
};

const ProfileCard = ({ user }) => {
  if (!user) return null;

  const fullName =
    `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

  const imageUrl = getProfileImage(user);
  const joinDate = formatJoinDate(user.date_joined);

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col items-center text-center w-full">
      
      {/* ✅ راه حل نهایی: یک قاب ساده و تمیز با یک بردر */}
      <div className="mb-5 rounded-full border-4 border-cyan-500 p-1 bg-gray-800">
        <Avatar
          src={imageUrl || undefined}
          name={fullName}
          size="112" // سایز بزرگ و مناسب
          round={true}
          // هیچ کلاسی اینجا به آواتار نمی‌دهیم تا بردر اضافه ایجاد نکند
        />
      </div>

      {/* بخش اطلاعات کاربر با فضاسازی بهتر */}
      <div className="flex flex-col items-center gap-y-2">
        <h3 className="text-2xl font-bold text-white">{fullName}</h3>
        <p className="text-md text-gray-400">@{user.username}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
        
        {/* تگِ سِمَت با استایل بهتر */}
        <span className="mt-2 bg-gray-700 text-cyan-300 text-xs font-medium px-4 py-1.5 rounded-full border border-gray-600">
          {user.position || 'کاربر'}
        </span>
        
        {/* تاریخ عضویت */}
        {joinDate && (
          <div className="flex items-center gap-x-2 text-gray-400 mt-4 text-xs">
            <FaCalendarAlt />
            <span>عضویت در {joinDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;