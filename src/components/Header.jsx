// src/components/Header.jsx

import logo from "../assets/ario.png";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/users/userSlice";
import { 
  FaUser, 
  FaSignOutAlt, 
  FaSignInAlt, 
  FaBars,
  FaUsers,
  FaBuilding,
  FaChartLine,
  FaFileAlt,
  FaClipboardList,
  FaCheckCircle,
  FaCog,
  FaHeadset,
  FaChevronDown,
  FaBriefcase  // ✅ برای نمایش سمت
} from "react-icons/fa";

const Header = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { userInfo } = useSelector((state) => state.userLogin);
  
  // ✅ استفاده از is_admin (که از بک‌اند میاد)
  const isAdmin = userInfo?.is_admin;
  
  // ✅ گرفتن سمت کاربر
  const userPosition = userInfo?.position;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const adminMenuRef = useRef(null);

  // ✅ Debug - برای چک کردن مقادیر
  useEffect(() => {
    console.log('🔐 User Info:', userInfo);
    console.log('👑 Is Admin:', isAdmin);
    console.log('💼 Position:', userPosition);
  }, [userInfo, isAdmin, userPosition]);

  const logoutHandler = () => {
    dispatch(logout());
    setUserMenuOpen(false);
    navigate("/auth");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target)) {
        setAdminMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-blue-800 via-gray-800 to-blue-900 shadow-lg sticky top-0 z-40 w-full">
      <div className="flex justify-between items-center py-4 px-6">
        
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* سمت راست: منوی موبایل + لوگو */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-x-4">
          {userInfo && (
            <button
              onClick={toggleSidebar}
              className="text-white text-2xl md:hidden hover:text-sky-300 transition"
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

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* ناوبری اصلی */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <nav className="hidden md:flex items-center gap-x-6 text-gray-200">
          
          {/* صفحه اصلی (همه) */}
          <Link 
            to="/" 
            className="hover:text-sky-300 transition text-sm font-semibold"
          >
            صفحه اصلی
          </Link>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* منوی ادمین (Dropdown) */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {isAdmin && (
            <div className="relative" ref={adminMenuRef}>
              <button
                onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                className="flex items-center gap-2 bg-yellow-600/20 hover:bg-yellow-600/30 px-4 py-2 rounded-lg transition text-sm font-semibold border border-yellow-600/40"
              >
                <FaCog className="text-yellow-400" />
                <span className="text-yellow-300">پنل مدیریت</span>
                <FaChevronDown className={`text-xs transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {adminMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-2xl py-2 z-50 border border-gray-700">
                  
                  {/* مانیتور نیروها */}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-sky-300 transition"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <FaChartLine className="text-sky-400" />
                    <span>مانیتور نیروها</span>
                  </Link>

                  {/* مدیریت کاربران */}
                  <Link
                    to="/admin/users"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-sky-300 transition"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <FaUsers className="text-green-400" />
                    <span>مدیریت کاربران</span>
                  </Link>

                  {/* مدیریت پروژه‌ها */}
                  <Link
                    to="/projects"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-sky-300 transition"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <FaBuilding className="text-purple-400" />
                    <span>مدیریت پروژه‌ها</span>
                  </Link>

                  <div className="border-t border-gray-700 my-1"></div>

                  {/* مدیریت درخواست‌ها */}
                  <Link
                    to="/admin/requests"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-sky-300 transition"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <FaCheckCircle className="text-pink-400" />
                    <span>مدیریت درخواست‌ها</span>
                  </Link>

                  {/* گزارش روزانه */}
                  <Link
                    to="/admin/approvals"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-sky-300 transition"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <FaFileAlt className="text-orange-400" />
                    <span>گزارش روزانه</span>
                  </Link>

                  {/* خلاصه گزارش */}
                  <Link
                    to="/admin/daily-summary"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-sky-300 transition"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <FaClipboardList className="text-indigo-400" />
                    <span>خلاصه گزارش</span>
                  </Link>

                  <div className="border-t border-gray-700 my-1"></div>

                  {/* تنظیمات */}
                  <Link
                    to="/admin/settings"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 hover:text-sky-300 transition"
                    onClick={() => setAdminMenuOpen(false)}
                  >
                    <FaCog className="text-gray-400" />
                    <span>تنظیمات شغلی</span>
                  </Link>
                </div>
              )}
            </div>
          )}


          {/* ═══════════════════════════════════════════════════════════ */}
          {/* منوی کاربر / دکمه ورود */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {userInfo ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition text-sm"
              >
                <FaUser />
                <div className="text-right">
                  <div className="font-semibold">
                    {userInfo.first_name || userInfo.username || 'کاربر'}
                  </div>
                  {/* ✅ نمایش سمت شغلی */}
                  {userPosition && (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <FaBriefcase className="text-sky-400" />
                      {userPosition}
                    </div>
                  )}
                </div>
                <FaChevronDown className={`text-xs transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 bg-gray-700 rounded-md shadow-xl py-1 z-50">
                  {/* نمایش اطلاعات کاربر */}
                  <div className="px-4 py-3 border-b border-gray-600">
                    <p className="text-sm font-semibold text-white">
                      {userInfo.first_name || userInfo.username}
                    </p>
                    {userPosition && (
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <FaBriefcase className="text-sky-400" />
                        {userPosition}
                      </p>
                    )}
                    {isAdmin && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded-full border border-yellow-600/40">
                        👑 مدیر سیستم
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FaUser className="text-sky-400" />
                    <span>پروفایل من</span>
                  </Link>
                  
                  <div className="border-t border-gray-600 my-1"></div>
                  
                  <button
                    onClick={logoutHandler}
                    className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                  >
                    <FaSignOutAlt />
                    <span>خروج از حساب</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg transition text-sm font-semibold"
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
