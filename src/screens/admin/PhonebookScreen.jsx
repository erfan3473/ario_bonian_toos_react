// src/screens/admin/PhonebookScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '../../features/admin/usersSlice';
import { FaSearch, FaSms, FaPhone, FaUserTie, FaSpinner } from 'react-icons/fa';
import AdminSmsModal from '../../components/admin/AdminSmsModal';

const PhonebookScreen = () => {
  const dispatch = useDispatch();
  
  // استخراج داده‌ها از استیت
  const { users, loading } = useSelector((state) => state.admin);
  
  // استیت‌های محلی برای جستجو و مودال
  const [searchTerm, setSearchTerm] = useState('');
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // لود کردن کاربران هنگام ورود به صفحه
  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // فیلتر کردن کاربران بر اساس جستجو (نام، نام خانوادگی، شماره موبایل، نام کاربری)
  const filteredUsers = users?.filter((user) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    const phone = user.profile?.phone_number || '';
    const username = user.username || '';
    const searchLower = searchTerm.toLowerCase();

    return (
      fullName.toLowerCase().includes(searchLower) ||
      phone.includes(searchLower) ||
      username.toLowerCase().includes(searchLower)
    );
  }) || [];

  // باز کردن مودال برای یک کاربر خاص
  const handleOpenSmsModal = (user) => {
    setSelectedUser(user);
    setIsSmsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto mt-6">
      
      {/* Header و جستجو */}
      <div className="bg-gray-800 rounded-2xl p-5 mb-6 shadow-lg border border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
              <FaPhone size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">دفترچه تلفن</h1>
              <p className="text-gray-400 text-sm mt-1">ارسال پیامک و دسترسی سریع به شماره کارگران و کارمندان</p>
            </div>
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="جستجو (نام، شماره، نام کاربری)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-2.5 px-4 pr-10 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <FaSearch className="absolute right-3.5 top-3.5 text-gray-500" />
          </div>
        </div>
      </div>

      {/* لیست مخاطبین */}
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden min-h-[400px]">
        {loading.users ? (
          <div className="flex justify-center items-center h-64 text-gray-400 gap-3">
            <FaSpinner className="animate-spin text-xl" />
            <span>در حال دریافت لیست مخاطبین...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-64 text-gray-500">
            <FaPhone size={40} className="mb-3 opacity-20" />
            <p>هیچ کاربری یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right whitespace-nowrap">
              <thead className="bg-gray-900/50 text-gray-400 text-sm border-b border-gray-700">
                <tr>
                  <th className="p-4 font-medium">نام و نام خانوادگی</th>
                  <th className="p-4 font-medium">سمت / نقش</th>
                  <th className="p-4 font-medium">شماره موبایل</th>
                  <th className="p-4 font-medium text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50 text-gray-200">
                {filteredUsers.map((user) => {
                  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
                  const phone = user.profile?.phone_number || 'ندارد';
                  const positionTitle = user.employee?.position?.title || (user.is_admin ? 'مدیر سیستم' : 'تعریف نشده');
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-700/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.profile?.image ? (
                            <img src={user.profile.image} alt={fullName} className="w-10 h-10 rounded-full object-cover border border-gray-600" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 border border-gray-600">
                              <FaUserTie />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{fullName}</p>
                            <p className="text-xs text-gray-500">{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-300">
                        {positionTitle}
                      </td>
                      <td className="p-4 font-mono text-gray-300 tracking-wider">
                        {phone}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenSmsModal(user)}
                          disabled={!user.profile?.phone_number}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            user.profile?.phone_number 
                              ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30' 
                              : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                          }`}
                          title={!user.profile?.phone_number ? "شماره موبایل ثبت نشده است" : "ارسال پیامک"}
                        >
                          <FaSms />
                          ارسال پیام
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* کامپوننت مودال ارسال پیامک که در پیام قبلی ساختیم */}
      {selectedUser && (
        <AdminSmsModal 
          isOpen={isSmsModalOpen} 
          onClose={() => setIsSmsModalOpen(false)}
          targetPhone={selectedUser.profile?.phone_number}
          targetName={`${selectedUser.first_name || ''} ${selectedUser.last_name || ''}`.trim() || selectedUser.username}
        />
      )}
    </div>
  );
};

export default PhonebookScreen;
