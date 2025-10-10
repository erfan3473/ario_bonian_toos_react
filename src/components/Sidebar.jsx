// src/components/Sidebar.jsx
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink } from "react-router-dom";
import ProfileCard from "./ProfileCard";
import {
  FaTimes,
  FaTachometerAlt,
  FaFolder,
  FaLeaf,
  FaBuilding,
  FaUsers, // ← اینو اضافه کردم
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

  // استایل لینک‌ها
  const linkBaseClass =
    "flex items-center gap-3 p-3 rounded-lg transition-colors duration-200";
  const activeLinkClass = "bg-green-700 text-white font-semibold";
  const defaultLinkClass = "hover:bg-green-600 hover:text-white";

  // 🔹 اگه کاربر لاگین نباشه، سایدبار رو اصلاً نشون نده
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
          bg-gradient-to-b from-green-900 via-gray-800 to-gray-900
          text-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out 
          z-40 ${isOpen ? "translate-x-0" : "translate-x-full"} md:translate-x-0 
          flex flex-col`}
        style={{ direction: "rtl" }}
      >
        <div className="flex justify-between items-center p-4 border-b border-green-700/40">
          <h2 className="text-xl font-bold text-green-400 flex items-center gap-2">
            <FaLeaf className="text-green-300" /> منو
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-400 hover:text-white md:hidden"
          >
            <FaTimes />
          </button>
        </div>

        {/* کارت پروفایل */}
        {user && <ProfileCard user={user} />}

        {/* ناوبری */}
        <nav className="flex-grow p-4 space-y-3 mt-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
            }
          >
            <FaBuilding size="1.2em" className="text-green-300" />
            <span>داشبورد</span>
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
            }
          >
            <FaFolder size="1.2em" className="text-green-300" />
            <span>لیست پروژه‌ها</span>
          </NavLink>

          {/* لینک جدید برای ادمین */}
          {userInfo?.isAdmin && (
            <NavLink
              to="/admin/attendance"
              className={({ isActive }) =>
                `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
              }
            >
              <FaUsers size="1.2em" className="text-green-300" /> {/* از FaUsers استفاده کردم */}
              <span>حضور و غیاب</span>
            </NavLink>
          )}
        </nav>

        {/* فوتر کوچک */}
        <div className="p-4 text-xs text-gray-400 border-t border-green-700/30">
          <p>© {new Date().getFullYear()} پیمانکار فضای سبز</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;