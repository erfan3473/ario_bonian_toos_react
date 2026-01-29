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
  FaBriefcase,
  FaIdBadge // ✅ NEW: For role badge
} from "react-icons/fa";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useSelector((state) => state.userLogin);
  const { user: userProfile } = useSelector((state) => state.userDetails); // ✅ NEW
  
  const isAdmin = userInfo?.is_admin;
  const userPosition = userInfo?.position;
  
  // ✅ NEW: Get report_type from employee position
  const currentUser = (userProfile && Object.keys(userProfile).length > 0) ? userProfile : userInfo;
  const userRole = currentUser?.employee?.position?.report_type || 'UNKNOWN';
  const isSuperUser = currentUser?.is_superuser || false;

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

  const isActive = (path) => location.pathname === path;

  // ✅ NEW: Role color mapping
  const getRoleStyle = (role) => {
    const styles = {
      'PROJECT_MANAGER': 'bg-purple-600/20 text-purple-400 border-purple-600/40',
      'HR_MANAGER': 'bg-pink-600/20 text-pink-400 border-pink-600/40',
      'TECHNICAL_OFFICE': 'bg-indigo-600/20 text-indigo-400 border-indigo-600/40',
      'ACCOUNTANT': 'bg-green-600/20 text-green-400 border-green-600/40',
      'WORKSHOP_SUPERVISOR': 'bg-orange-600/20 text-orange-400 border-orange-600/40',
      'FOREMAN': 'bg-yellow-600/20 text-yellow-400 border-yellow-600/40',
      'WORKER': 'bg-blue-600/20 text-blue-400 border-blue-600/40',
      'UNKNOWN': 'bg-gray-600/20 text-gray-400 border-gray-600/40',
    };
    return styles[role] || styles['UNKNOWN'];
  };

  const getRoleLabel = (role) => {
    const labels = {
      'PROJECT_MANAGER': '👔 مدیر پروژه',
      'HR_MANAGER': '🧑‍💼 مدیر منابع انسانی',
      'TECHNICAL_OFFICE': '🏛️ دفتر فنی',
      'ACCOUNTANT': '💰 حسابدار',
      'WORKSHOP_SUPERVISOR': '👷 سرپرست کارگاه',
      'FOREMAN': '🔨 سرکارگر',
      'WORKER': '⚙️ کارگر',
      'FACILITIES_STAFF': '🔧 پرسنل تاسیسات',
      'SECURITY_GUARD': '🛡️ نگهبان',
      'UNKNOWN': '❓ نامشخص',
    };
    return labels[role] || role;
  };

  return (
    <header className="bg-gradient-to-r from-blue-800 via-gray-800 to-blue-900 shadow-lg sticky top-0 z-[1002] w-full">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          
          {/* لوگو */}
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

          {/* ناوبری اصلی */}
          {userInfo && (
            <nav className="hidden lg:flex items-center gap-2">
              
              <Link 
                to="/admin/timesheet" 
                className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                  isActive('/admin/timesheet') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-200 hover:bg-blue-700/50'
                }`}
              >
               لیست حضور
              </Link>
              
              <Link 
                to="/admin/payroll" 
                className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                  isActive('/admin/payroll') 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-200 hover:bg-blue-700/50'
                }`}
              >
               لیست حقوق
              </Link>

              {isAdmin && (
                <>
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

                  <Link
                    to="/admin/scheme-managements"
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      location.pathname.startsWith('/admin/scheme-managements')
                        ? 'bg-green-600 text-white'
                        : 'text-gray-200 hover:bg-green-700/50'
                    }`}
                  >
                    <FaUsers className="text-green-300" />
                    <span>گروه شغلی</span>
                  </Link>

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

          {/* منوی کاربر */}
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
                <div className="absolute left-0 mt-2 w-64 bg-gray-700 rounded-md shadow-xl py-1 z-50">
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
                    
                    {/* ✅ NEW: Role badge */}
                    <div className="mt-2 flex flex-col gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getRoleStyle(userRole)}`}>
                        <FaIdBadge />
                        <span className="font-bold">نقش: {getRoleLabel(userRole)}</span>
                      </span>
                      
                      {isSuperUser && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-600/20 text-yellow-400 rounded-full border border-yellow-600/40">
                          👑 <span className="font-bold">ادمین سیستم</span>
                        </span>
                      )}
                      
                      {isAdmin && !isSuperUser && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-600/20 text-red-400 rounded-full border border-red-600/40">
                          🔑 <span className="font-bold">مدیر</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FaUser className="text-sky-400" />
                    <span>پروفایل من</span>
                  </Link>

                  <Link
                    to="/tasks"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <FaUser className="text-sky-400" />
                    <span>ماموریت های من</span>
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
