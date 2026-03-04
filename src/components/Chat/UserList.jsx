// src/components/Chat/UserList.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChatUsers, createDirectChat } from '../../features/chat/chatSlice';
import { FaUserCircle, FaSearch, FaHardHat, FaUserTie } from 'react-icons/fa';

const UserList = () => {
  const dispatch = useDispatch();
  const { users, loadingUsers } = useSelector((state) => state.chat);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchChatUsers('')); // همه کاربران
  }, [dispatch]);

  const handleUserClick = (userId) => {
    dispatch(createDirectChat(userId));
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    const phone = u.username || '';
    return fullName.includes(search) || phone.includes(search);
  });

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 h-full flex flex-col shadow-lg">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <FaUserCircle className="text-blue-400" />
          شروع چت جدید
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو..."
            className="w-full bg-gray-900 text-white text-sm rounded-lg pr-8 pl-2 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FaSearch className="absolute right-2.5 top-2.5 text-gray-500 text-xs" />
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {loadingUsers ? (
          <p className="text-center text-gray-500 py-4 text-sm">در حال بارگیری...</p>
        ) : filteredUsers.map((user) => (
          <div
            key={user.id}
            onClick={() => handleUserClick(user.id)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-700/50 cursor-pointer transition group"
          >
            <div className="relative">
              {user.profile?.image ? (
                <img
                  src={user.profile.image}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover border border-gray-600"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-400 font-bold text-sm">
                    {(user.first_name?.[0] || 'U')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400 transition">
                {user.first_name} {user.last_name}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {user.employee ? (
                  <>
                    <FaHardHat className="text-orange-400/70" />
                    <span>{user.employee.position?.title || 'پرسنل'}</span>
                  </>
                ) : (
                   <>
                    <FaUserTie className="text-purple-400/70" />
                    <span>ادمین/ستادی</span>
                   </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserList;