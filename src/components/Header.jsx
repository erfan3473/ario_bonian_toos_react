import logo from "../assets/ario.png";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/users/userSlice";

import { FaUser, FaSignOutAlt, FaSignInAlt, FaBars, FaBuilding } from "react-icons/fa";

const Header = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);

  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const logoutHandler = () => {
    dispatch(logout());
    setMenuOpen(false);
    navigate("/auth");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-blue-800 via-gray-800 to-blue-900 shadow-lg sticky top-0 z-40 w-full">
      <div className="flex justify-between items-center py-4 px-6">
        {/* 🔹 سمت راست: منوی موبایل + لوگو */}
        <div className="flex items-center gap-x-4">
          {userInfo && (
            <button
              onClick={toggleSidebar}
              className="text-white text-2xl md:hidden"
            >
              <FaBars />
            </button>
          )}

          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-90 transition"
          >
            <img
              src={logo}
              alt="Ariobonyan Toos"
              className="h-16 w-auto object-contain"
            />
          </Link>
        </div>

        {/* 🔹 ناوبری اصلی */}
        <nav className="hidden md:flex items-center gap-x-8 text-gray-200">
          <Link to="/" className="hover:text-sky-300 transition text-sm">
            صفحه اصلی
          </Link>

          <Link
            to="/dashboard"
            className="hover:text-sky-300 transition text-sm"
          >
            مانیتور نیروها
          </Link>

          <Link
            to="/admin/reports"
            className="hover:text-sky-300 transition text-sm"
          >
             گزارش روزانه
          </Link>
          <Link
            to="/admin/statements"
            className="hover:text-sky-300 transition text-sm"
          >
             صورت وضعیت ماهانه 
          </Link>

          {/* ✅ لینک جدید: مدیریت پروژه‌ها */}
          <Link
            to="/projects"
            className="hover:text-sky-300 transition text-sm flex items-center gap-1"
          >
             مدیریت پروژه‌ها
          </Link>

          <Link
            to="/assistant"
            className="hover:text-sky-300 transition text-sm"
          >
            دستیار صوتی
          </Link>

          {/* 👤 منوی کاربر / دکمه ورود */}
          {userInfo ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition text-sm"
              >
                <FaUser />
                <span>{userInfo.first_name || userInfo.username}</span>
              </button>

              {menuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-700 rounded-md shadow-xl py-1 z-50">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    پروفایل
                  </Link>
                  <button
                    onClick={logoutHandler}
                    className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
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
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition text-sm"
            >
              <FaSignInAlt /> <span>ورود / ثبت‌نام</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;