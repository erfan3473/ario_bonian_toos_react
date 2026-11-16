// src/components/Chat/UserList.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChatUsers, createDirectChat } from '../../features/chat/chatSlice';

const UserList = ({ onBack }) => {
  const dispatch = useDispatch();
  const { users, loadingUsers, onlineUsers } = useSelector((state) => state.chat);
  const { userInfo } = useSelector((state) => state.userLogin);
  const myId = userInfo?.id ?? userInfo?.user?.id;

  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchChatUsers(''));
  }, [dispatch]);

  const handleUserClick = (userId) => {
    dispatch(createDirectChat(userId));
  };

  const filteredUsers = users
    .filter((u) => u.id !== myId)
    .filter((u) => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
      const phone = u.username || '';
      const pos = u.employee?.position?.title || '';
      const q = search.toLowerCase();
      return (
        fullName.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        pos.toLowerCase().includes(q)
      );
    });

  return (
    <div className="h-full flex flex-col relative bg-[#1e1f20]">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-[#1e1f20] shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <i className="fas fa-users text-blue-400"></i>
            شروع چت جدید
          </h3>
          <button
            onClick={onBack}
            className="xl:hidden text-gray-400 hover:text-red-400 transition"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="جستجوی نام، شماره یا سمت..."
            className="w-full bg-[#131314] text-white text-xs rounded-xl pl-4 pr-9 py-2.5 border border-gray-700 focus:border-blue-500 focus:outline-none transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <i className="fas fa-search absolute right-3.5 top-3 text-gray-500 text-xs"></i>
        </div>
      </div>

      {/* List */}
      <div className="flex-grow overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {loadingUsers ? (
          <div className="flex justify-center py-6">
            <i className="fas fa-spinner fa-spin text-blue-500 text-xl"></i>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center text-gray-500 text-xs mt-10">
            کاربری یافت نشد.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isOnline = Boolean(onlineUsers[user.id]);
            return (
              <div
                key={user.id}
                onClick={() => handleUserClick(user.id)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2a2b2f] cursor-pointer transition group"
              >
                <div className="relative shrink-0">
                  {user.profile?.image ? (
                    <img
                      src={user.profile.image}
                      alt={user.username}
                      className="w-11 h-11 rounded-full object-cover border border-gray-700"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                      <span className="text-gray-300 font-bold text-base">
                        {user.first_name?.[0] || user.username?.[0] || 'U'}
                      </span>
                    </div>
                  )}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1e1f20]"></span>
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <p className="text-sm font-semibold text-gray-200 truncate group-hover:text-blue-400 transition">
                    {`${user.first_name || ''} ${user.last_name || ''}`.trim() ||
                      user.username}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    {user.employee ? (
                      <>
                        <i className="fas fa-hard-hat text-orange-400/70"></i>
                        <span className="truncate">
                          {user.employee.position?.title || 'پرسنل فنی'}
                        </span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-user-tie text-purple-400/70"></i>
                        <span>ادمین / ستادی</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UserList;