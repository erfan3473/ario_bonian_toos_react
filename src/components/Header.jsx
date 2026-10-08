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
  FaSyncAlt, FaHome, FaEnvelope, FaRobot
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

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false); 
  
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hamburgerBtnRef = useRef(null);
  const adminMenuRef = useRef(null); 

  const getPageName = (path) => {
    if (path.startsWith("/admin/timesheet")) return "مدیریت / لیست حضور";
    if (path.startsWith("/admin/payroll/list")) return "مدیریت / لیست حقوق";
    if (path.startsWith("/admin/users")) return "مدیریت / کاربران";
    if (path.startsWith("/admin/projects")) return "مدیریت / پروژه‌ها";
    if (path.startsWith("/admin/requests")) return "مدیریت / درخواست‌ها";
    if (path.startsWith("/admin/daily-summary")) return "مدیریت / گزارش‌ها";
    if (path.startsWith("/admin/settings")) return "مدیریت / تنظیمات";

    if (path.startsWith("/tasks")) return "ماموریت";
    if (path.startsWith("/routines")) return "برنامه‌ریز";
    if (path.startsWith("/chat")) return "پیام‌رسان";
    if (path.startsWith("/notebooks")) return "بایگانی";
    if (path.startsWith("/dashboard")) return "مانیتور نیروها";
    if (path.startsWith("/projects")) return "پروژه‌ها";
    if (path.startsWith("/attendance")) return "ثبت شیفت";
    if (path.startsWith("/profile")) return "پروفایل من";
    if (path.startsWith("/secretariat")) return "دبیرخانه";
    if (path.startsWith("/ai-assistant")) return "مدیریت / هوش مصنوعی";
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
      
      const clickedInDesktopAdmin = adminMenuRef.current && adminMenuRef.current.contains(e.target);
      const clickedInMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(e.target);

      if (!clickedInDesktopAdmin && !clickedInMobileMenu) {
        setAdminMenuOpen(false);
      }
      
      const clickedInHamburgerBtn = hamburgerBtnRef.current && hamburgerBtnRef.current.contains(e.target);
      if (!clickedInMobileMenu && !clickedInHamburgerBtn) {
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
    setAdminMenuOpen(false); 
  }, [dispatch, userInfo, userProfile, location.pathname]);

  const isActive = (path) => location.pathname === path;
  const startsWith = (path) => location.pathname.startsWith(path);

  const handleBellClick = () => {
    setNotifMenuOpen(!notifMenuOpen);
    setUserMenuOpen(false);
    setAdminMenuOpen(false);
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
    "relative flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 text-[13px] md:text-sm font-semibold rounded-t-lg md:rounded-t-xl border border-b-0 transition-all duration-200 cursor-pointer";

  const tabIdle = isDark
    ? "text-gray-200 border-transparent hover:bg-white/10"
    : "text-white/90 border-transparent hover:bg-white/30";

  const tabActive = isDark
    ? "text-white bg-blue-800 border-blue-700"
    : "text-blue-700 bg-white border-gray-200";
    
  const navLinkClass = (active) => `${tabBase} ${active ? tabActive : tabIdle}`;

  const mobileItemClass = (active, activeColor, hoverColor) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
      active ? `${activeColor} text-white` : `text-gray-200 ${hoverColor}`
    }`;

  const renderNavLinks = (mobile = false) => {
    const adminRoutes = [
      { path: "/chat", name: "پیام‌رسان", icon: FaComments, color: "text-cyan-300", bg: "bg-cyan-600", hover: "hover:bg-cyan-700/50", activeCheck: isActive("/chat") },
      { path: "/ai-assistant", name: "هوش مصنوعی", icon: FaRobot, color: "text-indigo-300", bg: "bg-indigo-600", hover: "hover:bg-indigo-700/50", activeCheck: startsWith("/ai-assistant") },
      { path: "/notebooks", name: "بایگانی", icon: FaClipboardList, color: "text-orange-300", bg: "bg-orange-600", hover: "hover:bg-orange-700/50", activeCheck: isActive("/notebooks") },
      { path: "/admin/timesheet", name: "لیست حضور", icon: FaClipboardList, color: "text-blue-300", bg: "bg-blue-600", hover: "hover:bg-blue-700/50", activeCheck: isActive("/admin/timesheet") },
      { path: "/admin/payroll/list", name: "لیست حقوق", icon: FaClipboardList, color: "text-blue-300", bg: "bg-blue-600", hover: "hover:bg-blue-700/50", activeCheck: isActive("/admin/payroll/list") },
      { path: "/dashboard", name: "مانیتور نیروها", icon: FaChartLine, color: "text-sky-300", bg: "bg-sky-600", hover: "hover:bg-sky-700/50", activeCheck: isActive("/dashboard") },
      { path: "/admin/users", name: "کاربران", icon: FaUsers, color: "text-green-300", bg: "bg-green-600", hover: "hover:bg-green-700/50", activeCheck: startsWith("/admin/users") },
      { path: "/projects", name: "پروژه‌ها", icon: FaBuilding, color: "text-purple-300", bg: "bg-purple-600", hover: "hover:bg-purple-700/50", activeCheck: startsWith("/projects") || location.pathname.includes("/admin/projects") },
      { path: "/admin/requests", name: "درخواست‌ها", icon: FaCheckCircle, color: "text-pink-300", bg: "bg-pink-600", hover: "hover:bg-pink-700/50", activeCheck: isActive("/admin/requests") },
      { path: "/admin/daily-summary", name: "گزارش‌ها", icon: FaClipboardList, color: "text-indigo-300", bg: "bg-indigo-600", hover: "hover:bg-indigo-700/50", activeCheck: isActive("/admin/daily-summary") },
      { path: "/admin/settings", name: "تنظیمات", icon: FaCog, color: "text-gray-300", bg: "bg-gray-600", hover: "hover:bg-gray-700/50", activeCheck: isActive("/admin/settings") },
    ];

    const currentActiveAdminRoute = adminRoutes.find(route => route.activeCheck);
    const isAdminRouteActive = Boolean(currentActiveAdminRoute);
    const adminButtonLabel = currentActiveAdminRoute ? `مدیریت / ${currentActiveAdminRoute.name}` : "مدیریت";

    return (
      <>
        <Link
          to="/"
          className={mobile ? mobileItemClass(isActive("/"), "bg-blue-600", "hover:bg-blue-700/50") : navLinkClass(isActive("/"))}
        >
          <FaHome className="text-blue-300" />
          <span>خانه</span>
        </Link>

        {/* 🚀 لینک دبیرخانه به بیرون منتقل شد تا همه بتوانند ببینند */}
        <Link
          to="/secretariat"
          className={mobile ? mobileItemClass(startsWith("/secretariat"), "bg-amber-600", "hover:bg-amber-700/50") : navLinkClass(startsWith("/secretariat"))}
        >
          <FaEnvelope className="text-amber-300" />
          <span>دبیرخانه</span>
        </Link>

        <Link
          to="/tasks"
          className={mobile ? mobileItemClass(startsWith("/tasks"), "bg-emerald-600", "hover:bg-emerald-700/50") : navLinkClass(startsWith("/tasks"))}
        >
          <FaClipboardList className="text-emerald-300" />
          <span>ماموریت</span>
        </Link>

        <Link
          to="/routines"
          className={mobile ? mobileItemClass(startsWith("/routines"), "bg-teal-600", "hover:bg-teal-700/50") : navLinkClass(startsWith("/routines"))}
        >
          <FaSyncAlt className="text-teal-300" />
          <span>کارتابل</span>
        </Link>

        <Link
          to="/attendance"
          className={mobile ? mobileItemClass(startsWith("/attendance"), "bg-teal-600", "hover:bg-teal-700/50") : navLinkClass(startsWith("/attendance"))}
        >
          <FaSyncAlt className="text-teal-300" />
          <span>ثبت شیفت</span>
        </Link>

        {isAdmin && (
          mobile ? (
            <div className="flex flex-col mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); 
                  setAdminMenuOpen(prev => !prev);
                }}
                className={`${mobileItemClass(isAdminRouteActive, "bg-gray-600", "hover:bg-gray-700/50")} justify-between w-full`}
              >
                <div className="flex items-center gap-2">
                  <FaCog className="text-gray-300" />
                  <span>{adminButtonLabel}</span>
                </div>
                <FaChevronDown className={`text-xs transition-transform ${adminMenuOpen ? "rotate-180" : ""}`} />
              </button>
              
              {adminMenuOpen && (
                <div className="flex flex-col gap-1 mt-1 pr-3 border-r-2 border-gray-600 mr-2">
                  {adminRoutes.map((route, idx) => (
                    <Link
                      key={idx}
                      to={route.path}
                      className={mobileItemClass(route.activeCheck, route.bg, route.hover)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <route.icon className={route.color} />
                      <span>{route.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={adminMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdminMenuOpen(prev => !prev);
                }}
                className={navLinkClass(isAdminRouteActive)}
              >
                <FaCog className="text-gray-300" />
                <span>{adminButtonLabel}</span>
                <FaChevronDown className={`text-[10px] transition-transform ${adminMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {adminMenuOpen && (
                <div className={`absolute right-0 top-full mt-1 w-48 rounded-md shadow-xl py-1 z-50 border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                  {adminRoutes.map((route, idx) => (
                    <Link
                      key={idx}
                      to={route.path}
                      className={`flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors ${
                        route.activeCheck
                          ? (isDark ? "bg-gray-700 text-white" : "bg-blue-50 text-blue-700")
                          : (isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100")
                      }`}
                      onClick={() => setAdminMenuOpen(false)}
                    >
                      <route.icon className={route.color} />
                      <span>{route.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </>
    );
  };

  return (
    <header className="sticky top-0 z-[1002] w-full">
      <div className={`${headerBg} shadow-none transition-colors duration-300`}>
        <div className="container mx-auto px-2 md:px-6">
          <div className="flex justify-between items-center pt-1 pb-0">
            
            <div className="flex items-center gap-2">
              {userInfo && (
                <button
                  ref={hamburgerBtnRef}
                  className="lg:hidden text-white text-lg p-1.5 hover:bg-white/10 rounded-md transition"
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                >
                  {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
              )}
              
              {userInfo && (
                <span className="lg:hidden text-white font-bold text-xs bg-black/20 px-2 py-1 rounded-md whitespace-nowrap">
                  {getPageName(location.pathname)}
                </span>
              )}

              <Link to="/" className="hidden lg:flex items-center gap-2 hover:opacity-90 transition">
                <img src={logo} alt="Ariobonyan Toos" className="h-8 md:h-9 w-auto object-contain" />
              </Link>
            </div>

            {userInfo && (
              <nav className="hidden lg:flex items-end gap-0.5 md:gap-1 self-end mb-0 translate-y-[1px] overflow-visible">
                {renderNavLinks(false)}
              </nav>
            )}

            {userInfo ? (
              <div className="relative flex items-center gap-1.5 md:gap-2">
                <div className="relative" ref={notifMenuRef}>
                  <button
                    onClick={handleBellClick}
                    className={`relative p-1.5 md:p-2 rounded-full transition ${
                      isDark ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-white/20 hover:bg-white/30 text-white"
                    }`}
                  >
                    <FaBell className="text-sm md:text-base" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-transparent">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifMenuOpen && (
                    <div className={`absolute left-0 top-full mt-2 w-[300px] sm:w-80 max-w-[90vw] rounded-md shadow-xl py-1 z-50 border ${
                      isDark ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"
                    }`}>
                      <div className={`px-3 py-2 border-b flex justify-between items-center ${isDark ? "border-gray-600" : "border-gray-200"}`}>
                        <span className={`font-semibold text-xs ${isDark ? "text-white" : "text-gray-800"}`}>
                          اعلانات
                        </span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={() => dispatch(markNotificationsRead([]))}
                            className="text-[10px] text-blue-500 hover:text-blue-400"
                          >
                            خواندن همه
                          </button>
                        )}
                      </div>

                      <div className="max-h-64 overflow-y-auto" dir="rtl">
                        {notifications && notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`p-2 border-b cursor-pointer transition-colors ${
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
                                  <FaCircle className="text-[6px] text-blue-500 mt-1.5 shrink-0" />
                                )}

                                <div className="min-w-0 flex-1">
                                  <h4 className={`text-[13px] font-bold ${isDark ? "text-gray-200" : "text-gray-800"}`}>
                                    {notif.title}
                                  </h4>
                                  {notif.body && (
                                    <p className={`text-[11px] mt-0.5 leading-4 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                      {notif.body}
                                    </p>
                                  )}
                                  {notif.created_at && (
                                    <time className={`block mt-1 text-[9px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                      {formatJalaliDateTime(notif.created_at)}
                                    </time>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={`p-3 text-center text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            اعلان جدیدی ندارید.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
            
                <button
                  onClick={() => dispatch(toggleTheme())}
                  className={`p-1.5 md:p-2 rounded-full transition ${
                    isDark
                      ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
                      : "bg-white/20 hover:bg-white/30 text-white"
                  }`}
                  title={isDark ? "حالت روشن" : "حالت تیره"}
                >
                  {isDark ? <FaSun className="text-sm md:text-base"/> : <FaMoon className="text-sm md:text-base"/>}
                </button>
                
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 md:gap-2 bg-gray-700 hover:bg-gray-600 px-2 md:px-3 py-1.5 rounded-full transition text-[13px]"
                  >
                    <FaUser className="text-gray-300 text-xs md:text-sm" />
                    <div className="text-right max-w-[70px] sm:max-w-none truncate">
                      <div className="font-semibold text-white truncate">
                        {userInfo.first_name || userInfo.username || "کاربر"}
                      </div>
                    </div>
                    <FaChevronDown
                      className={`text-[10px] text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-52 md:w-56 bg-gray-700 rounded-md shadow-xl py-1 z-50">
                      <div className="px-3 py-2 border-b border-gray-600">
                        <p className="text-[13px] font-semibold text-white">
                          {userInfo.first_name || userInfo.username}
                        </p>
                        
                        {currentUser?.employee?.position?.title ? (
                          <p className="text-[11px] text-sky-400 mt-1 flex items-center gap-1 font-medium">
                            <FaBriefcase className="text-sky-400" /> {currentUser.employee.position.title}
                          </p>
                        ) : userPosition ? (
                          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                            <FaBriefcase className="text-sky-400" /> {userPosition}
                          </p>
                        ) : null}

                        <div className="mt-1.5 flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit items-center gap-1 px-1.5 py-0.5 text-[9px] md:text-[10px] rounded-full border ${getRoleStyle(
                              userRole
                            )}`}
                          >
                            <FaIdBadge />
                            <span className="font-bold">نقش: {getRoleLabel(userRole)}</span>
                          </span>
                        </div>
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-300 hover:bg-gray-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaUser className="text-sky-400" /> <span>پروفایل من</span>
                      </Link>
                      <Link
                        to="/tasks"
                        className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-gray-300 hover:bg-gray-600"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FaClipboardList className="text-sky-400" /> <span>ماموریت های من</span>
                      </Link>
                      <div className="border-t border-gray-600 my-1" />
                      <button
                        onClick={logoutHandler}
                        className="w-full text-right px-3 py-1.5 text-[13px] text-red-400 hover:bg-gray-600 flex items-center gap-2"
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
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 px-3 md:px-4 py-1.5 rounded-lg transition text-xs md:text-sm font-semibold"
              >
                <FaSignInAlt />
                <span className="hidden sm:inline">ورود / ثبت‌نام</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {userInfo && mobileMenuOpen && (
        <div ref={mobileMenuRef} className="lg:hidden bg-gray-800 border-t border-gray-700 max-h-[60vh] overflow-y-auto shadow-lg">
          <nav className="flex flex-col p-2 gap-1">
            {renderNavLinks(true)}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;