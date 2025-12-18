// src/components/Sidebar.jsx
import React from "react";
import { useSelector } from "react-redux";
import { NavLink, Link } from "react-router-dom";
import ProfileCard from "./ProfileCard";

import {
  FaTimes,
  FaUsers,
  FaBriefcase, // کارتابل
  FaHeadset, // دستیار / پشتیبانی
  FaUser, // پروفایل
} from "react-icons/fa";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { userInfo } = useSelector((state) => state.userLogin);

  if (!userInfo) return null;

  const linkBaseClass =
    "flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 text-sm";
  const activeLinkClass = "bg-blue-700 text-white font-semibold";
  const defaultLinkClass = "hover:bg-blue-600 hover:text-white";

  return (
    <>
      {/* Overlay موبایل */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside
        className={`
          fixed top-0 right-0 h-full w-72
          bg-gradient-to-b from-blue-900 via-gray-800 to-gray-900
          text-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out 
          z-40 ${isOpen ? "translate-x-0" : "translate-x-full"} md:translate-x-0 
          flex flex-col
        `}
        style={{ direction: "rtl" }}
      >
        {/* هدر سایدبار */}
        <div className="flex justify-between items-center p-5 border-b border-blue-700/40 relative">
          <h2 className="text-xl font-bold text-sky-300 flex items-center gap-3 w-full justify-center">
            <FaBriefcase />
            <span>کارتابل اداری</span>
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl text-gray-400 hover:text-white md:hidden absolute left-4 top-5"
          >
            <FaTimes />
          </button>
        </div>

        {/* کارت پروفایل – اطلاعات ساده از userInfo */}
        <ProfileCard user={userInfo} />

        {/* ناوبری اصلی */}
        <nav className="flex-grow p-4 space-y-3 mt-4 overflow-y-auto">
          {/* مانیتور نیروها */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkBaseClass} ${
                isActive ? activeLinkClass : defaultLinkClass
              }`
            }
          >
            <FaUsers size="1.2em" className="text-sky-300" />
            <span>مانیتور نیروها</span>
          </NavLink>

          {/* پروفایل */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `${linkBaseClass} ${
                isActive ? activeLinkClass : defaultLinkClass
              }`
            }
          >
            <FaUser size="1.2em" className="text-sky-300" />
            <span>پروفایل من</span>
          </NavLink>

        </nav>

        {/* فوتر کوچک */}
        <div className="p-4 text-xs text-center text-gray-400 border-t border-blue-700/30">
          <p>© {new Date().getFullYear()} آریو بنیان توس</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
