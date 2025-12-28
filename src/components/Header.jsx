// src/components/Header.jsx
import logo from "../assets/ario.png";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout } from "../features/users/userSlice";
import { 
  FaUser, 
  FaSignOutAlt, 
  FaSignInAlt,
  FaUsers,
  FaBuilding,
  FaChartLine,
  FaClipboardList,
  FaCheckCircle,
  FaCog,
  FaChevronDown,
  FaBriefcase
} from "react-icons/fa";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useSelector((state) => state.userLogin);
  const isAdmin = userInfo?.is_admin;
  const userPosition = userInfo?.position;

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // تابع کمکی برای چک کردن صفحه فعال
  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-gradient-to-r from-blue-800 via-gray-800 to-blue-900 shadow-lg sticky top-0 z-[1002] w-full">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* لوگو */}
          {/* ═══════════════════════════════════════════════════════════ */}
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

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ناوبری اصلی - افقی */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {userInfo && (
            <nav className="hidden lg:flex items-center gap-2">
              
              {/* صفحه اصلی */}
              <Link 
                to="/" 
                className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                  isActive('/') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-200 hover:bg-blue-700/50'
                }`}
              >
                صفحه اصلی
              </Link>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* منوی ادمین - افقی */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {isAdmin && (
                <>
                  {/* مانیتور نیروها */}
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      isActive('/dashboard')
                        ? 'bg-sky-600 text-white'
                        : 'text-gray-200 hover:bg-sky-700/50'
                    }`}
                  >
                    <FaChartLine className="text-sky-300" />
                    <span>مانیتور نیروها</span>
                  </Link>

                  {/* مدیریت کاربران */}
                  <Link
                    to="/admin/users"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      location.pathname.startsWith('/admin/users')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-200 hover:bg-green-700/50'
                    }`}
                  >
                    <FaUsers className="text-green-300" />
                    <span>کاربران</span>
                  </Link>

                  {/* مدیریت پروژه‌ها */}
                  <Link
                    to="/projects"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      location.pathname.startsWith('/projects') || location.pathname.includes('/admin/projects')
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-200 hover:bg-purple-700/50'
                    }`}
                  >
                    <FaBuilding className="text-purple-300" />
                    <span>پروژه‌ها</span>
                  </Link>

                  {/* مدیریت درخواست‌ها */}
                  <Link
                    to="/admin/requests"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      isActive('/admin/requests')
                        ? 'bg-pink-600 text-white'
                        : 'text-gray-200 hover:bg-pink-700/50'
                    }`}
                  >
                    <FaCheckCircle className="text-pink-300" />
                    <span>درخواست‌ها</span>
                  </Link>

                  {/* خلاصه گزارش */}
                  <Link
                    to="/admin/daily-summary"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      isActive('/admin/daily-summary')
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-200 hover:bg-indigo-700/50'
                    }`}
                  >
                    <FaClipboardList className="text-indigo-300" />
                    <span>گزارش‌ها</span>
                  </Link>

                  {/* تنظیمات */}
                  <Link
                    to="/admin/settings"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      isActive('/admin/settings')
                        ? 'bg-gray-600 text-white'
                        : 'text-gray-200 hover:bg-gray-700/50'
                    }`}
                  >
                    <FaCog className="text-gray-300" />
                    <span>تنظیمات</span>
                  </Link>
                </>
              )}
            </nav>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* منوی کاربر */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {userInfo ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition text-sm"
              >
                <FaUser />
                <div className="text-right hidden md:block">
                  <div className="font-semibold">
                    {userInfo.first_name || userInfo.username || 'کاربر'}
                  </div>
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
        </div>
      </div>
    </header>
  );
};

export default Header;
