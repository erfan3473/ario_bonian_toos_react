// src/components/Sidebar.jsx (نسخه بازطراحی شده و حرفه‌ای)
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, Link } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import {
  FaTimes,
  FaFolder,
  FaBuilding,
  FaUsers,
  FaBriefcase, // آیکون جدید: کارتابل
  FaPaperPlane, // آیکون جدید: مرخصی
  FaClipboardCheck, // آیکون جدید: وظایف
  FaHeadset, // آیکون جدید: چت و پشتیبانی
} from "react-icons/fa";
import { getUserDetailsThunk } from "../features/users/userSlice";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.userLogin);
  const { user } = useSelector((state) => state.userDetails);

  useEffect(() => {
    if (userInfo && !user?.username) {
      dispatch(getUserDetailsThunk("profile"));
    }
  }, [dispatch, userInfo, user]);

  // استایل لینک‌ها با تم آبی
  const linkBaseClass =
    "flex items-center gap-3 p-3 rounded-lg transition-colors duration-200";
  const activeLinkClass = "bg-blue-700 text-white font-semibold";
  const defaultLinkClass = "hover:bg-blue-600 hover:text-white";

  if (!userInfo) return null;

  return (
    <>
      {/* Overlay برای موبایل */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside
        className={`fixed top-0 right-0 h-full w-72 
          bg-gradient-to-b from-blue-900 via-gray-800 to-gray-900
          text-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out 
          z-40 ${isOpen ? "translate-x-0" : "translate-x-full"} md:translate-x-0 
          flex flex-col`} // <- flex-col برای چیدمان عمودی
        style={{ direction: "rtl" }}
      >
        {/* 🔖 عنوان جدید در وسط */}
        <div className="flex justify-between items-center p-5 border-b border-blue-700/40">
           <h2 className="text-xl font-bold text-sky-300 flex items-center gap-3 w-full justify-center">
            <FaBriefcase />
            <span>کارتابل اداری</span>
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-400 hover:text-white md:hidden absolute left-4 top-5" // دکمه بستن در موبایل
          >
            <FaTimes />
          </button>
        </div>

        {/* کارت پروفایل */}
        {user && <ProfileCard user={user} />}

        {/* بخش اصلی ناوبری که رشد می‌کند */}
        <nav className="flex-grow p-4 space-y-3 mt-4 overflow-y-auto">
          
          
          {userInfo?.isAdmin && (
            <NavLink
              to="/admin/attendance"
              className={({ isActive }) =>
                `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
              }
            >
              <FaUsers size="1.2em" className="text-sky-300" />
              <span>حضور و غیاب</span>
            </NavLink>
          )}

          {/* ✨ لینک‌های جدید */}
          <NavLink
            to="/leave-requests" // مسیر را بعدا تنظیم کنید
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
            }
          >
            <FaPaperPlane size="1.2em" className="text-sky-300" />
            <span>درخواست مرخصی</span>
          </NavLink>

          <NavLink
            to="/daily-tasks" // مسیر را بعدا تنظیم کنید
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
            }
          >
            <FaClipboardCheck size="1.2em" className="text-sky-300" />
            <span>وظایف روزانه</span>
          </NavLink>
        </nav>

        {/* 📞 بخش چت با ادمین (در پایین) */}
        <div className="p-4 mt-auto">
          <Link
            to="/admin-chat" // مسیر صفحه چت
            className="group flex items-center gap-4 w-full p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-all duration-300"
          >
            <div className="bg-blue-600 p-3 rounded-full group-hover:scale-110 transition-transform">
              <FaHeadset size="1.3em" className="text-white"/>
            </div>
            <span className="font-semibold text-sky-300">چت با ادمین شرکت</span>
          </Link>
        </div>

        {/* فوتر کوچک */}
        <div className="p-4 text-xs text-center text-gray-400 border-t border-blue-700/30">
          <p>© {new Date().getFullYear()}   آریو بنیان توس</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;