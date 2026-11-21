// src/components/Header.jsx
import logo from "../assets/ario.png";
import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { logout, fetchUserProfile } from "../features/users/userSlice";
import { toggleTheme } from "../features/theme/themeSlice";
import { markNotificationsRead } from "../features/notifications/notificationSlice";
import { setActiveChat, fetchMyChats } from "../features/chat/chatSlice";
import { formatJalaliDateTime } from "../utils/dateUtils";

import {
  ArchiveBoxIcon,
  ArrowLeftOnRectangleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  CpuChipIcon,
  CurrencyDollarIcon,
  DocumentChartBarIcon,
  EnvelopeIcon,
  HomeIcon,
  IdentificationIcon,
  MoonIcon,
  PresentationChartLineIcon,
  QueueListIcon,
  SunIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const toPersianDigits = (value) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]);

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useSelector((state) => state.userLogin);
  const { user: userProfile } = useSelector((state) => state.userDetails);
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const { unreadCount, notifications } = useSelector(
    (state) => state.notifications
  );

  const isAdmin = userInfo?.is_admin;
  const userPosition = userInfo?.position;

  const currentUser =
    userProfile && Object.keys(userProfile).length > 0 ? userProfile : userInfo;

  const hasSecretariatAccess = Boolean(
    isAdmin || currentUser?.employee?.position
  );

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
    if (path.startsWith("/routines")) return "کارتابل";
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

      const clickedInDesktopAdmin =
        adminMenuRef.current && adminMenuRef.current.contains(e.target);
      const clickedInMobileMenu =
        mobileMenuRef.current && mobileMenuRef.current.contains(e.target);

      if (!clickedInDesktopAdmin && !clickedInMobileMenu) {
        setAdminMenuOpen(false);
      }

      const clickedInHamburgerBtn =
        hamburgerBtnRef.current && hamburgerBtnRef.current.contains(e.target);
      if (!clickedInMobileMenu && !clickedInHamburgerBtn) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setUserMenuOpen(false);
        setNotifMenuOpen(false);
        setAdminMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
    setNotifMenuOpen((prev) => !prev);
    setUserMenuOpen(false);
    setAdminMenuOpen(false);
  };

  const handleNotifClick = (notif) => {
    if (!notif.is_read && notif.id) {
      dispatch(markNotificationsRead([notif.id]));
    }
    setNotifMenuOpen(false);

    const isChat =
      notif.notif_type === "CHAT_MESSAGE" || notif.model === "chat";
    const isTask =
      notif.notif_type?.startsWith("TASK_") ||
      notif.type === "task_inbox" ||
      notif.model === "task";
    const isRoutine =
      (notif.notif_type === "SYSTEM_MESSAGE" &&
        (notif.extra_data?.event === "TIME_BASED_ROUTINE_REMINDER" ||
          notif.extra_data?.event === "INCOMPLETE_ROUTINE_CHECKOUT_WARNING")) ||
      notif.model === "routineinstance";

    if (isChat) {
      const rawChatId =
        notif.object_id ?? notif.extra_data?.chat_id ?? notif.chat_id;
      const chatId = rawChatId ? Number(rawChatId) : null;

      if (chatId && !Number.isNaN(chatId)) {
        dispatch(setActiveChat(chatId));
        dispatch(fetchMyChats());
        navigate(`/chat?active=${chatId}`);
      } else {
        navigate("/chat");
      }
    } else if (isTask) {
      const taskId =
        notif.object_id ?? notif.extra_data?.task_id ?? notif.task_id;
      if (taskId) {
        navigate(`/tasks/${taskId}`);
      } else {
        navigate("/tasks");
      }
    } else if (isRoutine) {
      navigate("/routines");
    }
  };

  const getRoleStyle = (role) => {
    const styles = {
      PROJECT_MANAGER: isDark
        ? "bg-sky-400/10 text-sky-300 border-sky-400/35"
        : "bg-sky-50 text-sky-700 border-sky-600/35",
      HR_MANAGER: isDark
        ? "bg-amber-400/10 text-amber-300 border-amber-400/35"
        : "bg-amber-50 text-amber-700 border-amber-600/35",
      TECHNICAL_OFFICE: isDark
        ? "bg-sky-400/10 text-sky-300 border-sky-400/35"
        : "bg-sky-50 text-sky-700 border-sky-600/35",
      ACCOUNTANT: isDark
        ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/35"
        : "bg-emerald-50 text-emerald-700 border-emerald-600/35",
      WORKSHOP_SUPERVISOR: isDark
        ? "bg-amber-400/10 text-amber-300 border-amber-400/35"
        : "bg-amber-50 text-amber-700 border-amber-600/35",
      FOREMAN: isDark
        ? "bg-amber-400/10 text-amber-300 border-amber-400/35"
        : "bg-amber-50 text-amber-700 border-amber-600/35",
      WORKER: isDark
        ? "bg-slate-400/10 text-slate-300 border-slate-400/30"
        : "bg-slate-100 text-slate-700 border-slate-400/40",
      UNKNOWN: isDark
        ? "bg-slate-400/10 text-slate-400 border-slate-400/25"
        : "bg-slate-100 text-slate-600 border-slate-400/35",
    };
    return styles[role] || styles.UNKNOWN;
  };

  const getRoleLabel = (role) => {
    const labels = {
      PROJECT_MANAGER: "مدیر پروژه",
      HR_MANAGER: "مدیر منابع انسانی",
      TECHNICAL_OFFICE: "دفتر فنی",
      ACCOUNTANT: "حسابدار",
      WORKSHOP_SUPERVISOR: "سرپرست کارگاه",
      FOREMAN: "سرکارگر",
      WORKER: "پرسنل اجرایی",
      FACILITIES_STAFF: "پرسنل تاسیسات",
      SECURITY_GUARD: "انتظامات و نگهبانی",
      UNKNOWN: "نامشخص",
    };
    return labels[role] || role;
  };

  const borderHairline = isDark ? "border-slate-400/15" : "border-slate-900/15";
  const dropdownPanel = isDark
    ? "bg-tactical-surface1 border-slate-400/25 shadow-2xl shadow-black/60"
    : "bg-white border-slate-900/20 shadow-xl shadow-slate-900/10";

  const navItemClass = (active, isAdminTab = false) => {
    const base =
      "relative h-14 inline-flex items-center gap-1.5 px-2.5 xl:px-3 text-xs xl:text-[13px] font-semibold tracking-normal border-b-2 transition-colors duration-150 cursor-pointer whitespace-nowrap";

    if (active) {
      if (isAdminTab) {
        return `${base} ${
          isDark
            ? "border-amber-400 bg-amber-400/10 text-amber-300"
            : "border-amber-600 bg-amber-50 text-amber-800"
        }`;
      }
      return `${base} ${
        isDark
          ? "border-sky-400 bg-sky-400/10 text-sky-300"
          : "border-sky-600 bg-sky-50 text-sky-800"
      }`;
    }

    return `${base} border-transparent ${
      isDark
        ? "text-slate-300 hover:text-slate-100 hover:bg-tactical-hover"
        : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
    }`;
  };

  const mobileItemClass = (active, isAdminTab = false) => {
    const base =
      "flex items-center gap-2.5 px-3 min-h-[42px] rounded-[2px] border border-s-2 text-xs sm:text-sm font-semibold tracking-normal transition-colors duration-150";

    if (active) {
      if (isAdminTab) {
        return `${base} ${
          isDark
            ? "bg-amber-400/10 border-amber-400/35 border-s-amber-400 text-amber-300"
            : "bg-amber-50 border-amber-600/35 border-s-amber-600 text-amber-800"
        }`;
      }
      return `${base} ${
        isDark
          ? "bg-sky-400/10 border-sky-400/35 border-s-sky-400 text-sky-300"
          : "bg-sky-50 border-sky-600/35 border-s-sky-600 text-sky-800"
      }`;
    }

    return `${base} ${
      isDark
        ? "bg-tactical-surface2/40 border-slate-400/10 border-s-transparent text-slate-300 hover:bg-tactical-hover hover:border-s-slate-400/50"
        : "bg-slate-50 border-slate-900/10 border-s-transparent text-slate-700 hover:bg-slate-100 hover:border-s-slate-400"
    }`;
  };

  const iconButtonClass = `relative h-9 w-9 inline-flex items-center justify-center rounded-[2px] border transition-colors duration-150 ${
    isDark
      ? "bg-tactical-surface2 border-slate-400/20 text-slate-300 hover:text-sky-300 hover:border-sky-400/45 hover:bg-tactical-hover"
      : "bg-slate-50 border-slate-900/15 text-slate-700 hover:text-sky-700 hover:border-sky-600/45 hover:bg-sky-50"
  }`;

  const renderNavLinks = (mobile = false) => {
    const adminRoutes = [
      {
        code: "۰۱",
        path: "/chat",
        name: "پیام‌رسان",
        icon: ChatBubbleLeftRightIcon,
        activeCheck: isActive("/chat"),
      },
      {
        code: "۰۲",
        path: "/ai-assistant",
        name: "هوش مصنوعی",
        icon: CpuChipIcon,
        activeCheck: startsWith("/ai-assistant"),
      },
      {
        code: "۰۳",
        path: "/notebooks",
        name: "بایگانی",
        icon: ArchiveBoxIcon,
        activeCheck: isActive("/notebooks"),
      },
      {
        code: "۰۴",
        path: "/admin/timesheet",
        name: "لیست حضور",
        icon: ClipboardDocumentCheckIcon,
        activeCheck: isActive("/admin/timesheet"),
      },
      {
        code: "۰۵",
        path: "/admin/payroll/list",
        name: "لیست حقوق",
        icon: CurrencyDollarIcon,
        activeCheck: isActive("/admin/payroll/list"),
      },
      {
        code: "۰۶",
        path: "/dashboard",
        name: "مانیتور نیروها",
        icon: PresentationChartLineIcon,
        activeCheck: isActive("/dashboard"),
      },
      {
        code: "۰۷",
        path: "/admin/users",
        name: "کاربران",
        icon: UsersIcon,
        activeCheck: startsWith("/admin/users"),
      },
      {
        code: "۰۸",
        path: "/projects",
        name: "پروژه‌ها",
        icon: BuildingOffice2Icon,
        activeCheck:
          startsWith("/projects") ||
          location.pathname.includes("/admin/projects"),
      },
      {
        code: "۰۹",
        path: "/admin/requests",
        name: "درخواست‌ها",
        icon: CheckCircleIcon,
        activeCheck: isActive("/admin/requests"),
      },
      {
        code: "۱۰",
        path: "/admin/daily-summary",
        name: "گزارش‌ها",
        icon: DocumentChartBarIcon,
        activeCheck: isActive("/admin/daily-summary"),
      },
      {
        code: "۱۱",
        path: "/admin/settings",
        name: "تنظیمات",
        icon: Cog6ToothIcon,
        activeCheck: isActive("/admin/settings"),
      },
    ];

    const currentActiveAdminRoute = adminRoutes.find(
      (route) => route.activeCheck
    );
    const isAdminRouteActive = Boolean(currentActiveAdminRoute);
    const adminButtonLabel = currentActiveAdminRoute
      ? `مدیریت / ${currentActiveAdminRoute.name}`
      : "مدیریت";

    const primaryLinks = [
      {
        to: "/",
        label: "خانه",
        icon: HomeIcon,
        active: isActive("/"),
        show: true,
      },
      {
        to: "/secretariat",
        label: "دبیرخانه",
        icon: EnvelopeIcon,
        active: startsWith("/secretariat"),
        show: hasSecretariatAccess,
      },
      {
        to: "/tasks",
        label: "ماموریت",
        icon: ClipboardDocumentListIcon,
        active: startsWith("/tasks"),
        show: true,
      },
      {
        to: "/routines",
        label: "کارتابل",
        icon: QueueListIcon,
        active: startsWith("/routines"),
        show: true,
      },
      {
        to: "/attendance",
        label: "ثبت شیفت",
        icon: ClockIcon,
        active: startsWith("/attendance"),
        show: true,
      },
    ];

    return (
      <>
        {primaryLinks
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  mobile
                    ? mobileItemClass(item.active)
                    : navItemClass(item.active)
                }
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    item.active
                      ? isDark
                        ? "text-sky-400"
                        : "text-sky-700"
                      : isDark
                      ? "text-slate-400"
                      : "text-slate-500"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

        {isAdmin &&
          (mobile ? (
            <div className="flex flex-col pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdminMenuOpen((prev) => !prev);
                }}
                className={`${mobileItemClass(
                  isAdminRouteActive,
                  true
                )} justify-between w-full`}
              >
                <div className="flex items-center gap-2.5">
                  <Cog6ToothIcon
                    className={`w-4 h-4 shrink-0 ${
                      isDark ? "text-amber-400" : "text-amber-600"
                    }`}
                  />
                  <span>{adminButtonLabel}</span>
                </div>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform duration-150 ${
                    adminMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {adminMenuOpen && (
                <div
                  className={`flex flex-col gap-1 mt-1.5 ps-3 ms-2 border-s ${
                    isDark ? "border-amber-400/35" : "border-amber-600/35"
                  }`}
                >
                  {adminRoutes.map((route) => {
                    const Icon = route.icon;
                    return (
                      <Link
                        key={route.path}
                        to={route.path}
                        className={`${mobileItemClass(
                          route.activeCheck,
                          true
                        )} justify-between`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="w-4 h-4 shrink-0 opacity-85" />
                          <span>{route.name}</span>
                        </span>
                        <span className="text-[10px] opacity-60 tabular-nums">
                          {route.code}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="relative" ref={adminMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdminMenuOpen((prev) => !prev);
                  setUserMenuOpen(false);
                  setNotifMenuOpen(false);
                }}
                className={navItemClass(isAdminRouteActive, true)}
              >
                <Cog6ToothIcon
                  className={`w-4 h-4 shrink-0 ${
                    isAdminRouteActive
                      ? isDark
                        ? "text-amber-400"
                        : "text-amber-700"
                      : isDark
                      ? "text-amber-400/80"
                      : "text-amber-600"
                  }`}
                />
                <span>{adminButtonLabel}</span>
                <ChevronDownIcon
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    adminMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {adminMenuOpen && (
                <div
                  className={`absolute start-0 top-full mt-px w-56 rounded-[2px] border z-50 ${dropdownPanel}`}
                >
                  <div
                    className={`px-3 py-2 border-b flex items-center justify-between text-[11px] font-semibold tracking-normal ${
                      isDark
                        ? "bg-tactical-surface2 border-slate-400/15 text-amber-400"
                        : "bg-amber-50 border-slate-900/10 text-amber-800"
                    }`}
                  >
                    <span>واحدهای مدیریتی</span>
                    <span className="tabular-nums opacity-80">۱۱ بخش</span>
                  </div>
                  <div className="py-1 max-h-[70vh] overflow-y-auto">
                    {adminRoutes.map((route) => {
                      const Icon = route.icon;
                      return (
                        <Link
                          key={route.path}
                          to={route.path}
                          className={`flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium tracking-normal border-s-2 transition-colors duration-150 ${
                            route.activeCheck
                              ? isDark
                                ? "bg-amber-400/10 border-s-amber-400 text-amber-300"
                                : "bg-amber-50 border-s-amber-600 text-amber-800"
                              : isDark
                              ? "border-s-transparent text-slate-300 hover:bg-tactical-hover hover:border-s-sky-400 hover:text-slate-100"
                              : "border-s-transparent text-slate-700 hover:bg-slate-50 hover:border-s-sky-600 hover:text-slate-950"
                          }`}
                          onClick={() => setAdminMenuOpen(false)}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0 opacity-85" />
                            <span>{route.name}</span>
                          </span>
                          <span className="text-[10px] opacity-55 tabular-nums">
                            {route.code}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
      </>
    );
  };

  return (
    <header
      className={`sticky top-0 z-[1002] w-full print:hidden border-b transition-colors duration-200 ${
        isDark
          ? "bg-tactical-surface1/95 border-slate-400/20 text-slate-100"
          : "bg-white/95 border-slate-900/15 text-slate-900"
      } backdrop-blur-md`}
    >
      {/* نوار تاکیدی ظریف ۱ پیکسلی در بالاترین لبه کنسول */}
      <div
        aria-hidden="true"
        className={`h-[2px] w-full ${
          isDark
            ? "bg-gradient-to-l from-sky-400/80 via-sky-400/20 to-amber-400/60"
            : "bg-gradient-to-l from-sky-600 via-sky-600/25 to-amber-600/70"
        }`}
      />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-5">
        <div className="h-14 flex items-center justify-between gap-2 sm:gap-4">
          {/* بخش راست: منوی موبایل، لوگو و عنوان سازمانی */}
          <div className="flex items-center gap-2.5 min-w-0">
            {userInfo && (
              <button
                ref={hamburgerBtnRef}
                type="button"
                aria-label="باز و بسته کردن منو"
                className={`lg:hidden ${iconButtonClass}`}
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <Bars3Icon className="w-5 h-5" />
                )}
              </button>
            )}

            <Link
              to="/"
              className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
            >
              <div
                className={`h-9 w-9 p-1 rounded-[2px] border flex items-center justify-center ${
                  isDark
                    ? "bg-tactical-surface2 border-sky-400/30"
                    : "bg-slate-50 border-slate-900/15"
                }`}
              >
                <img
                  src={logo}
                  alt="آریو بنیان توس"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="hidden sm:flex flex-col leading-tight">
                <span className="text-xs xl:text-sm font-bold tracking-normal">
                  آریو بنیان توس
                </span>
                <span
                  className={`text-[10px] font-medium tracking-normal ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  سامانه یکپارچه ۸پا
                </span>
              </div>
            </Link>

            {userInfo && getPageName(location.pathname) && (
              <span
                className={`lg:hidden px-2 py-1 rounded-[2px] border text-[11px] font-semibold truncate tracking-normal ${
                  isDark
                    ? "bg-tactical-surface2 border-slate-400/20 text-sky-300"
                    : "bg-slate-100 border-slate-900/15 text-sky-800"
                }`}
              >
                {getPageName(location.pathname)}
              </span>
            )}
          </div>

          {/* بخش میانی: نوار ناوبری اصلی دسکتاپ */}
          {userInfo && (
            <nav
              aria-label="ناوبری اصلی"
              className="hidden lg:flex items-center gap-0.5 self-stretch"
            >
              {renderNavLinks(false)}
            </nav>
          )}

          {/* بخش چپ: ابزارها، اعلان‌ها، تغییر تم و حساب کاربری */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* دکمه تغییر تم (در دسترس هم برای کاربران واردشده و هم مهمان) */}
            <button
              type="button"
              onClick={() => dispatch(toggleTheme())}
              className={iconButtonClass}
              title={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
              aria-label={isDark ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
            >
              {isDark ? (
                <SunIcon className="w-4 h-4 text-amber-400" />
              ) : (
                <MoonIcon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {userInfo ? (
              <>
                {/* منوی اعلانات */}
                <div className="relative" ref={notifMenuRef}>
                  <button
                    type="button"
                    onClick={handleBellClick}
                    className={iconButtonClass}
                    title="اعلانات سامانه"
                    aria-label="اعلانات سامانه"
                  >
                    <BellIcon className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -end-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-[2px] bg-red-500 text-[10px] font-bold text-white tabular-nums">
                        {unreadCount > 99
                          ? "+۹۹"
                          : toPersianDigits(unreadCount)}
                      </span>
                    )}
                  </button>

                  {notifMenuOpen && (
                    <div
                      className={`absolute end-0 top-full mt-2 w-[310px] sm:w-80 max-w-[92vw] rounded-[2px] border z-50 ${dropdownPanel}`}
                    >
                      <div
                        className={`px-3 py-2 border-b flex justify-between items-center ${
                          isDark
                            ? "bg-tactical-surface2 border-slate-400/15"
                            : "bg-slate-50 border-slate-900/10"
                        }`}
                      >
                        <span className="font-bold text-xs tracking-normal">
                          مرکز اعلانات
                        </span>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={() => dispatch(markNotificationsRead([]))}
                            className={`text-[11px] font-medium tracking-normal transition-colors ${
                              isDark
                                ? "text-sky-400 hover:text-sky-300"
                                : "text-sky-700 hover:text-sky-800"
                            }`}
                          >
                            علامت‌گذاری همه به‌عنوان خوانده‌شده
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto" dir="rtl">
                        {notifications && notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`p-2.5 border-b border-s-2 cursor-pointer transition-colors duration-150 ${
                                isDark
                                  ? notif.is_read
                                    ? "border-b-slate-400/10 border-s-transparent hover:bg-tactical-hover"
                                    : "bg-sky-400/10 border-b-slate-400/10 border-s-sky-400 hover:bg-tactical-hover"
                                  : notif.is_read
                                  ? "border-b-slate-900/10 border-s-transparent hover:bg-slate-50"
                                  : "bg-sky-50 border-b-slate-900/10 border-s-sky-600 hover:bg-sky-100/60"
                              }`}
                            >
                              <div className="min-w-0">
                                <h4
                                  className={`text-xs font-bold tracking-normal ${
                                    isDark ? "text-slate-100" : "text-slate-900"
                                  }`}
                                >
                                  {notif.title}
                                </h4>
                                {notif.body && (
                                  <p
                                    className={`text-[11px] mt-1 leading-5 line-clamp-2 tracking-normal ${
                                      isDark
                                        ? "text-slate-400"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {notif.body}
                                  </p>
                                )}
                                {notif.created_at && (
                                  <time
                                    className={`block mt-1.5 text-[10px] font-medium tabular-nums ${
                                      isDark
                                        ? "text-slate-500"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {formatJalaliDateTime(notif.created_at)}
                                  </time>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            className={`p-5 text-center text-xs tracking-normal ${
                              isDark ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            اعلان جدیدی ثبت نشده است.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* منوی حساب کاربری */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen((prev) => !prev);
                      setNotifMenuOpen(false);
                      setAdminMenuOpen(false);
                    }}
                    className={`h-9 inline-flex items-center gap-2 px-2.5 sm:px-3 rounded-[2px] border text-xs font-semibold tracking-normal transition-colors duration-150 ${
                      isDark
                        ? "bg-tactical-surface2 border-slate-400/20 text-slate-100 hover:border-sky-400/45 hover:bg-tactical-hover"
                        : "bg-slate-50 border-slate-900/15 text-slate-900 hover:border-sky-600/45 hover:bg-sky-50"
                    }`}
                  >
                    <UserIcon
                      className={`w-4 h-4 shrink-0 ${
                        isDark ? "text-sky-400" : "text-sky-700"
                      }`}
                    />
                    <span className="max-w-[76px] sm:max-w-[130px] truncate">
                      {userInfo.first_name || userInfo.username || "کاربر"}
                    </span>
                    <ChevronDownIcon
                      className={`w-3.5 h-3.5 transition-transform duration-150 ${
                        userMenuOpen ? "rotate-180" : ""
                      } ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      className={`absolute end-0 top-full mt-2 w-60 rounded-[2px] border z-50 ${dropdownPanel}`}
                    >
                      <div
                        className={`px-3.5 py-3 border-b ${
                          isDark
                            ? "bg-tactical-surface2 border-slate-400/15"
                            : "bg-slate-50 border-slate-900/10"
                        }`}
                      >
                        <p className="text-xs font-bold tracking-normal">
                          {userInfo.first_name || userInfo.username}
                        </p>

                        {currentUser?.employee?.position?.title ? (
                          <p
                            className={`text-[11px] mt-1.5 flex items-center gap-1.5 font-medium tracking-normal ${
                              isDark ? "text-sky-400" : "text-sky-700"
                            }`}
                          >
                            <BriefcaseIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{currentUser.employee.position.title}</span>
                          </p>
                        ) : userPosition ? (
                          <p
                            className={`text-[11px] mt-1.5 flex items-center gap-1.5 tracking-normal ${
                              isDark ? "text-slate-400" : "text-slate-600"
                            }`}
                          >
                            <BriefcaseIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>{userPosition}</span>
                          </p>
                        ) : null}

                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-[2px] border tracking-normal ${getRoleStyle(
                              userRole
                            )}`}
                          >
                            <IdentificationIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>نقش: {getRoleLabel(userRole)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/profile"
                          className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium tracking-normal transition-colors ${
                            isDark
                              ? "text-slate-300 hover:bg-tactical-hover hover:text-slate-100"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon
                            className={`w-4 h-4 shrink-0 ${
                              isDark ? "text-sky-400" : "text-sky-700"
                            }`}
                          />
                          <span>پروفایل من</span>
                        </Link>
                        <Link
                          to="/tasks"
                          className={`flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium tracking-normal transition-colors ${
                            isDark
                              ? "text-slate-300 hover:bg-tactical-hover hover:text-slate-100"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                          }`}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ClipboardDocumentListIcon
                            className={`w-4 h-4 shrink-0 ${
                              isDark ? "text-sky-400" : "text-sky-700"
                            }`}
                          />
                          <span>ماموریت‌های من</span>
                        </Link>
                      </div>

                      <div
                        className={`border-t p-1 ${
                          isDark ? "border-slate-400/15" : "border-slate-900/10"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={logoutHandler}
                          className={`w-full text-start px-2.5 py-2 rounded-[2px] text-xs font-semibold tracking-normal flex items-center gap-2.5 transition-colors ${
                            isDark
                              ? "text-red-400 hover:bg-red-500/10"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <ArrowRightOnRectangleIcon className="w-4 h-4 shrink-0" />
                          <span>خروج از حساب کاربری</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth"
                className={`h-9 inline-flex items-center gap-2 px-3.5 sm:px-4 rounded-[2px] text-xs sm:text-[13px] font-semibold tracking-normal transition-colors duration-150 ${
                  isDark
                    ? "bg-sky-400 hover:bg-sky-300 text-slate-950"
                    : "bg-sky-600 hover:bg-sky-700 text-white"
                }`}
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4 shrink-0" />
                <span>ورود به سامانه</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* منوی کشویی موبایل */}
      {userInfo && mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className={`lg:hidden border-t max-h-[70vh] overflow-y-auto ${
            isDark
              ? "bg-tactical-surface1 border-slate-400/20"
              : "bg-white border-slate-900/15"
          }`}
        >
          <nav
            aria-label="ناوبری موبایل"
            className="max-w-[1440px] mx-auto flex flex-col p-3 gap-1.5"
          >
            {renderNavLinks(true)}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;