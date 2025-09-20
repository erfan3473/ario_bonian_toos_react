// src/components/Header.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout } from '../actions/userActions';
import { FaUser, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [menuOpen, setMenuOpen] = useState(false);

  const logoutHandler = () => {
    dispatch(logout());
    setMenuOpen(false);
    navigate('/auth'); // بعد از logout بره صفحه login
  };

  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        <Link
          to="/"
          className="text-2xl font-bold text-indigo-400 hover:text-indigo-300 transition duration-300"
        >
          مدیریت کارگران
        </Link>

        <nav className="flex items-center space-x-6 text-gray-300">
          <Link
            to="/"
            className="hover:text-indigo-400 transition duration-300"
          >
            خانه
          </Link>
          <Link
            to="/projects"
            className="hover:text-indigo-400 transition duration-300"
          >
            پروژه ها
          </Link>
           <Link
            to="/dashboard"
            className="hover:text-indigo-400 transition duration-300"
          >
            مانیتور پروژه
          </Link>
          <Link
            to="/projects/:projectId/reports"
            className="hover:text-indigo-400 transition duration-300"
          >
            گزارش کار روزانه
          </Link>
          {userInfo && userInfo.isAdmin && (
            <Link
              to="/admin/users"
              className="hover:text-indigo-400 transition duration-300"
            >
              کاربران
            </Link>
          )}
          {userInfo ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition duration-300"
              >
                <FaUser />
                <span>{userInfo.first_name || userInfo.email}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-xl py-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    پروفایل
                  </Link>
                  <button
                    onClick={logoutHandler}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <FaSignOutAlt />
                    <span>خروج</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition duration-300"
            >
              <FaSignInAlt />
              <span>ورود / ثبت‌نام</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
