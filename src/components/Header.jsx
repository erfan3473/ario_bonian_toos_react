import logo from "../assets/ario.png";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout, fetchUserProfile } from "../features/users/userSlice";
import { toggleTheme } from "../features/theme/themeSlice";
import { markNotificationsRead } from "../features/notifications/notificationSlice";
import { formatJalaliDateTime } from "../utils/dateUtils";

import {
  FaUser, FaSignOutAlt, FaSignInAlt, FaUsers, FaBuilding,
  FaChartLine, FaClipboardList, FaCheckCircle, FaCog,
  FaChevronDown, FaBriefcase, FaIdBadge, FaComments,
  FaBars, FaTimes, FaMoon, FaSun, FaBell, FaCircle, 
  FaSyncAlt, FaHome
} from "react-icons/fa";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useSelector((state) => state.userLogin);
  const { user: userProfile } = useSelector((state) => state.userDetails);
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const { unreadCount, notifications } = useSelector((state) => state.notifications); 

  const isAdmin = userInfo?.is_admin;
  const userPosition = userInfo?.position;

  const currentUser =
    userProfile && Object.keys(userProfile).length > 0 ? userProfile : userInfo;

  const userRole =
    currentUser?.employee?.position?.report_type ||
    currentUser?.employee?.position?.reporttype ||
    "UNKNOWN";

  const isSuperUser = currentUser?.is_superuser || false;

  // 🌟 [اضافه شده]: تعیین نقش‌های مجاز برای چک کردن دسترسی‌های خاص (بدون تغییر UI هدر)
  const allowedRolesForRoutine = ['MANAGING_COUNCIL', 'TECHNICAL_OFFICE', 'PROJECT_MANAGER'];
  const canManageRoutines = isAdmin || allowedRolesForRoutine.includes(userRole);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerBtnRef = useRef(null);

  const getPageName = (path) => {
    if (path.startsWith("/tasks")) return "ماموریت";
    if (path.startsWith("/routines")) return "برنامه ریز";
    if (path.startsWith("/chat")) return "پیام‌رسان";
    if (path.startsWith("/notebooks")) return "بایگانی";
    if (path.startsWith("/admin/timesheet")) return "لیست حضور";
    if (path.startsWith("/admin/payroll/list")) return "لیست حقوق";
    if (path.startsWith("/dashboard")) return "مانیتور نیروها";
    if (path.startsWith("/admin/users")) return "کاربران";
    if (path.startsWith("/projects") || path.startsWith("/admin/projects")) return "پروژه‌ها";
    if (path.startsWith("/admin/requests")) return "درخواست‌ها";
    if (path.startsWith("/admin/daily-summary")) return "گزارش‌ها";
    if (path.startsWith("/admin/settings")) return "تنظیمات";
    if (path.startsWith("/profile")) return "پروفایل من";
    if (path === "/" || path === "") return "خانه";
    return "";
  };

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
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(e.target) &&
        hamburgerBtnRef.current &&
        !hamburgerBtnRef.current.contains(e.target)
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (userInfo && (!userProfile || Object.keys(userProfile).length === 0)) {
      dispatch(fetchUserProfile());
    }
    setMobileMenuOpen(false);
  }, [dispatch, userInfo, userProfile, location.pathname]);

  const isActive = (path) => location.pathname === path;
  const startsWith = (path) => location.pathname.startsWith(path);

  const handleBellClick = () => {
    setNotifMenuOpen(!notifMenuOpen);
    setUserMenuOpen(false);
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read) {
      dispatch(markNotificationsRead([notif.id]));
    }
    setNotifMenuOpen(false);

    const isChat = notif.notif_type === 'CHAT_MESSAGE';
    const isTask = notif.notif_type?.startsWith('TASK_') || notif.type === 'task_inbox';
    
    if (isChat) {
      const chatId = notif.object_id || notif.extra_data?.chat_id;
      if (chatId) navigate(`/chat?active=${chatId}`);
      else navigate('/chat');
    } else if (isTask) {
      const taskId = notif.object_id || notif.extra_data?.task_id;
      if (taskId) navigate(`/tasks/${taskId}`);
      else navigate('/tasks');
    }
  };
    
  const getRoleStyle = (role) => {
    const styles = {
      PROJECT_MANAGER: "bg-purple-600/20 text-purple-400 border-purple-600/40",
      HR_MANAGER: "bg-pink-600/20 text-pink-400 border-pink-600/40",
      TECHNICAL_OFFICE: "bg-indigo-600/20 text-indigo-400 border-indigo-600/40",
      ACCOUNTANT: "bg-green-600/20 text-green-400 border-green-600/40",
      WORKSHOP_SUPERVISOR: "bg-orange-600/20 text-orange-400 border-orange-600/40",
      FOREMAN: "bg-yellow-600/20 text-yellow-400 border-yellow-600/40",
      WORKER: "bg-blue-600/20 text-blue-400 border-blue-600/40",
      UNKNOWN: "bg-gray-600/20 text-gray-400 border-gray-600/40",
    };
    return styles[role] || styles.UNKNOWN;
  };

  const getRoleLabel = (role) => {
    const labels = {
      PROJECT_MANAGER: "👔 مدیر پروژه",
      HR_MANAGER: "🧑‍💼 مدیر منابع انسانی",
      TECHNICAL_OFFICE: "🏛️ دفتر فنی",
      ACCOUNTANT: "💰 حسابدار",
      WORKSHOP_SUPERVISOR: "👷 سرپرست کارگاه",
      FOREMAN: "🔨 سرکارگر",
      WORKER: "⚙️ کارگر",
      FACILITIES_STAFF: "🔧 پرسنل تاسیسات",
      SECURITY_GUARD: "🛡️ نگهبان",
      UNKNOWN: "❓ نامشخص",
    };
    return labels[role] || role;
  };

  const headerBg = isDark
    ? "bg-gradient-to-r from-blue-800 via-gray-800 to-blue-900"
    : "bg-gradient-to-r from-blue-500 via-sky-500 to-blue-600";

  const tabBase =
    "relative flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-t-xl border border-b-0 transition-all duration-200";

  const tabIdle = isDark
    ? "text-gray-200 border-transparent hover:bg-white/10"
    : "text-white/90 border-transparent hover:bg-white/30";

  const tabActive = isDark
    ? "text-white bg-blue-800 border-blue-700"
    : "text-blue-700 bg-white border-gray-200";
    
  const navLinkClass = (active) => `${tabBase} ${active ? tabActive : tabIdle}`;

  const mobileItemClass = (active, activeColor, hoverColor) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${
      active ? `${activeColor} text-white` : `text-gray-200 ${hoverColor}`
    }`;

  const NavLinks = ({ mobile = false }) => (
    <>
      <Link
        to="/"
        className={
          mobile
            ? mobileItemClass(isActive("/"), "bg-blue-600", "hover:bg-blue-700/50")
            : navLinkClass(isActive("/"))
        }
      >
        <FaHome className="text-blue-300" />
        <span>خانه</span>
      </Link>

      <Link
        to="/tasks"
        className={
          mobile
            ? mobileItemClass(startsWith("/tasks"), "bg-emerald-600", "hover:bg-emerald-700/50")
            : navLinkClass(startsWith("/tasks"))
        }
      >
        <FaClipboardList className="text-emerald-300" />
        <span>ماموریت</span>
      </Link>

      <Link
        to="/routines"
        className={
          mobile
            ? mobileItemClass(startsWith("/routines"), "bg-teal-600", "hover:bg-teal-700/50")
            : navLinkClass(startsWith("/routines"))
        }
      >
        <FaSyncAlt className="text-teal-300" />
        <span>برنامه ریز</span>
      </Link>

      {isAdmin && (
        <>
          <Link
            to="/chat"
            className={
              mobile
                ? mobileItemClass(isActive("/chat"), "bg-cyan-600", "hover:bg-cyan-700/50")
                : navLinkClass(isActive("/chat"))
            }
          >
            <FaComments className="text-cyan-300" />
            <span>پیام‌رسان</span>
          </Link>

          <Link
            to="/notebooks"
            className={
              mobile
                ? mobileItemClass(isActive("/notebooks"), "bg-orange-600", "hover:bg-orange-700/50")
                : navLinkClass(isActive("/notebooks"))
            }
          >
            <FaClipboardList className="text-orange-300" />
            <span>بایگانی</span>
          </Link>

          <Link
            to="/admin/timesheet"
            className={
              mobile
                ? mobileItemClass(isActive("/admin/timesheet"), "bg-blue-600", "hover:bg-blue-700/50")
                : navLinkClass(isActive("/admin/timesheet"))
            }
          >
            <FaClipboardList className="text-blue-300" />
            <span>لیست حضور</span>
          </Link>

          <Link
            to="/admin/payroll/list"
            className={
              mobile
                ? mobileItemClass(isActive("/admin/payroll/list"), "bg-blue-600", "hover:bg-blue-700/50")
                : navLinkClass(isActive("/admin/payroll/list"))
            }
          >
            <FaClipboardList className="text-blue-300" />
            <span>لیست حقوق</span>
          </Link>

          <Link
            to="/dashboard"
            className={
              mobile
                ? mobileItemClass(isActive("/dashboard"), "bg-sky-600", "hover:bg-sky-700/50")
                : navLinkClass(isActive("/dashboard"))
            }
          >
            <FaChartLine className="text-sky-300" />
            <span>مانیتور نیروها</span>
          </Link>

          <Link
            to="/admin/users"
            className={
              mobile
                ? mobileItemClass(startsWith("/admin/users"), "bg-green-600", "hover:bg-green-700/50")
                : navLinkClass(startsWith("/admin/users"))
            }
          >
            <FaUsers className="text-green-300" />
            <span>کاربران</span>
          </Link>

          <Link
            to="/projects"
            className={
              mobile
                ? mobileItemClass(
                    startsWith("/projects") || location.pathname.includes("/admin/projects"),
                    "bg-purple-600",
                    "hover:bg-purple-700/50"
                  )
                : navLinkClass(startsWith("/projects") || location.pathname.includes("/admin/projects"))
            }
          >
            <FaBuilding className="text-purple-300" />
            <span>پروژه‌ها</span>
          </Link>

          <Link
            to="/admin/requests"
            className={
              mobile
                ? mobileItemClass(isActive("/admin/requests"), "bg-pink-600", "hover:bg-pink-700/50")
                : navLinkClass(isActive("/admin/requests"))
            }
          >
            <FaCheckCircle className="text-pink-300" />
            <span>درخواست‌ها</span>
          </Link>

          <Link
            to="/admin/daily-summary"
            className={
              mobile
                ? mobileItemClass(isActive("/admin/daily-summary"), "bg-indigo-600", "hover:bg-indigo-700/50")
                : navLinkClass(isActive("/admin/daily-summary"))
            }
          >
            <FaClipboardList className="text-indigo-300" />
            <span>گزارش‌ها</span>
          </Link>

          <Link
            to="/admin/settings"
            className={
              mobile
                ? mobileItemClass(isActive("/admin/settings"), "bg-gray-600", "hover:bg-gray-700/50")
                : navLinkClass(isActive("/admin/settings"))
            }
          >
            <FaCog className="text-gray-300" />
            <span>تنظیمات</span>
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-[1002] w-full">
      <div className={`${headerBg} shadow-none transition-colors duration-300`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-center pt-3 md:pt-4 pb-0">
            
            <div className="flex items-center gap-2">
              {userInfo && (
                <button
                  ref={hamburgerBtnRef}
                  className="lg:hidden text-white text-xl p-2 hover:bg-white/10 rounded-md transition"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
              )}
              
              {userInfo && (
                <span className="lg:hidden text-white font-bold text-sm bg-black/20 px-3 py-1.5 rounded-lg whitespace-nowrap">
                  {getPageName(location.pathname)}
                </span>
              )}

              <Link to="/" className="hidden lg:flex items-center gap-2 hover:opacity-90 transition">
                <img src={logo} alt="Ariobonyan Toos" className="h-12 md:h-16 w-auto object-contain" />
              </Link>
            </div>

            {userInfo && (
              <nav className="hidden lg:flex items-end gap-1 self-end mb-0 translate-y-[1px] overflow-x-auto no-scrollbar">
                <NavLinks />
              </nav>
            )}

            {userInfo ? (
              <div className="relative flex items-center gap-2">
                <div className="relative" ref={notifMenuRef}>
                  <button
                    onClick={handleBellClick}
                    className={`relative p-2 rounded-full transition ${
                      isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-white/20 hover:bg-white/30 text-white"
                    }`}
                  >
                    <FaBell />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-transparent">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifMenuOpen && (
                    <div className={`absolute left-0 md:auto md:right-0 top-full mt-2 w-72 md:w-80 rounded-md shadow-xl py-1 z-50 border ${
                      isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
                    }`}>
                      <div className={`px-4 py-3 border-b flex justify-between items-center ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                        <span className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-800"}`}>
                          اعلانات
                        </span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => dispatch(markNotificationsRead([]))}
                            className="text-[11px] text-blue-500 hover:text-blue-400"
                          >
                            خواندن همه
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto" dir="rtl">
                        {notifications && notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`p-3 border-b cursor-pointer transition-colors ${
                                isDark
                                  ? notif.is_read
                                    ? "border-gray-700 hover:bg-gray-700"
                                    : "bg-gray-700/50 border-gray-700 hover:bg-gray-700"
                                  : notif.is_read
                                    ? "border-gray-100 hover:bg-gray-50"
                                    : "bg-blue-50 border-gray-100 hover:bg-blue-100/50"
                              }`}
                            >
                              <div className="flex gap-2 items-start">
                                {!notif.is_read && (
                                  <FaCircle className="text-[8px] text-blue-500 mt-1.5 shrink-0" />
                                )}

                                <div className="min-w-0 flex-1">
                                  <h4
                                    className={`text-sm font-bold ${
                                      isDark ? "text-gray-200" : "text-gray-800"
                                    }`}
                                  >
                                    {notif.title}
                                  </h4>

                                  {notif.body && (
                                    <p
                                      className={`text-xs mt-1 leading-5 line-clamp-2 ${
                                        isDark ? "text-gray-400" : "text-gray-600"
                                      }`}
                                    >
                                      {notif.body}
                                    </p>
                                  )}

                                  {notif.created_at && (
                                    <time
                                      dateTime={notif.created_at}
                                      title={formatJalaliDateTime(notif.created_at)}
                                      className={`block mt-2 text-[10px] font-medium ${
                                        isDark ? "text-gray-500" : "text-gray-400"
                                      }`}
                                    >
                                      {formatJalaliDateTime(notif.created_at)}
                                    </time>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            className={`p-4 text-center text-sm ${
                              isDark ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            اعلان جدیدی ندارید.
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
            
                <button
                  onClick={() => dispatch(toggleTheme())}
                  className={`p-2 rounded-full transition ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title={isDark ? "حالت روشن" : "حالت تیره"}
                >
                  {isDark ? <FaSun /> : <FaMoon />}
                </button>
                
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 md:px-4 py-2 rounded-full transition text-sm"
                  >
                    <FaUser className="text-gray-300" />
                    <div className="text-right max-w-[80px] sm:max-w-none truncate">
                      <div className="font-semibold text-white truncate">
                        {userInfo.first_name || userInfo.username || "کاربر"}
                      </div>
                    </div>
                    <FaChevronDown
                      className={`text-xs text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-56 md:w-64 bg-gray-700 rounded-md shadow-xl py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-600">
                        <p className="text-sm font-semibold text-white">
                          {userInfo.first_name || userInfo.username}
                        </p>
                        
                        {/* 🌟 اصلاح شده: نمایش عنوان دقیق سمت فیزیکی فرد از روی پروفایل دیتابیس */}
                        {currentUser?.employee?.position?.title ? (
                          <p className="text-xs text-sky-400 mt-1 flex items-center gap-1 font-medium">
                            <FaBriefcase className="text-sky-400" /> {currentUser.employee.position.title}
                          </p>
                        ) : userPosition ? (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                            <FaBriefcase className="text-sky-400" /> {userPosition}
                          </p>
                        ) : null}

                        <div className="mt-2 flex flex-col gap-1">
                          {/* 🌟 نوار نقش سیستم (نوع گزارش سمت) */}
                          <span
                            className={`inline-flex w-fit items-center gap-1 px-2 py-1 text-[10px] md:text-xs rounded-full border ${getRoleStyle(
                              userRole
                            )}`}
                          >
                            <FaIdBadge />
                            <span className="font-bold">نقش: {getRoleLabel(userRole)}</span>
                          </span>
                          {isSuperUser && (
                            <span className="inline-flex w-fit items-center gap-1 px-2 py-1 text-[10px] md:text-xs bg-yellow-600/20 text-yellow-400 rounded-full border border-yellow-600/40">
                              👑 <span className="font-bold">ادمین سیستم</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaUser className="text-sky-400" /> <span>پروفایل من</span>
                      </Link>
                      <Link
                        to="/tasks"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaClipboardList className="text-sky-400" /> <span>ماموریت های من</span>
                      </Link>
                      <div className="border-t border-gray-600 my-1" />
                      <button
                        onClick={logoutHandler}
                        className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center gap-2"
                      >
                        <FaSignOutAlt /> <span>خروج از حساب</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 md:px-5 py-2 rounded-lg transition text-sm font-semibold"
              >
                <FaSignInAlt />
                <span className="hidden sm:inline">ورود / ثبت‌نام</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {userInfo && mobileMenuOpen && (
        <div ref={mobileMenuRef} className="lg:hidden bg-gray-800 border-t border-gray-700 max-h-[70vh] overflow-y-auto shadow-lg">
          <nav className="flex flex-col p-4 gap-2">
            <NavLinks mobile />
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;