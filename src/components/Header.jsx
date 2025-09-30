// src/components/Header.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../features/users/userSlice";
import { fetchTodayReport } from "../features/dailyReports/dailyReportSlice";
import {
  FaUser,
  FaSignOutAlt,
  FaSignInAlt,
  FaChevronDown,
  FaBars,
  FaLeaf,
} from "react-icons/fa";

const Header = ({ toggleSidebar }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userInfo = useSelector((state) => state.userLogin?.userInfo);
  const projects = useSelector((state) => state.projects?.projects || []);
  const todayReport = useSelector((state) => state.dailyReports?.todayReport);

  const projectId = projects.length > 0 ? projects[0].id : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);

  const logoutHandler = () => {
    dispatch(logout());
    setMenuOpen(false);
    navigate("/auth");
  };

  useEffect(() => {
    if (projectId) {
      dispatch(fetchTodayReport(projectId));
    }
  }, [dispatch, projectId]);

  const managerPath = todayReport?.id
    ? `/reports/${todayReport.id}/manager`
    : "/reports";
  const facilitiesPath = todayReport?.id
    ? `/reports/${todayReport.id}/facilities`
    : "/reports";
  const securityPath = todayReport?.id
    ? `/reports/${todayReport.id}/security`
    : "/reports";

  return (
    <header className="bg-gradient-to-r from-green-800 via-gray-800 to-green-900 shadow-lg sticky top-0 z-40 w-full">
      <div className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center gap-x-4">
          {/* همبرگری فقط برای موبایل */}
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
            className="text-2xl font-bold text-green-300 hover:text-green-200 flex items-center gap-2"
          >
            <FaLeaf className="text-green-400" /> آریو بنیان توس
          </Link>
        </div>

        {/* ناوبری */}
        <nav className="hidden md:flex items-center gap-x-8 text-gray-200">
          <Link
            to="/projects"
            className="hover:text-green-300 transition duration-300"
          >
            پروژه‌ها
          </Link>
          <Link
            to="/dashboard"
            className="hover:text-green-300 transition duration-300"
          >
            مانیتور پروژه
          </Link>
          {userInfo?.isAdmin && (
            
            <>

              <Link
                to="/admin/payroll/employment-types"
                className="hover:text-green-300 transition duration-300"
              >
                مدیریت صورتحساب
              </Link>
              <Link
                to="/admin/users"
                className="hover:text-green-300 transition duration-300"
              >
                مدیریت کاربران
              </Link>
              <Link
                to="/admin/roles"
                className="hover:text-green-300 transition duration-300"
              >
                مدیریت نقش‌ها
              </Link>
            </>
          )}


          {/* منوی کشویی ثبت گزارش */}
          {userInfo && (
            <div className="relative">
              <button
                onClick={() => setReportMenuOpen(!reportMenuOpen)}
                className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition duration-300"
              >
                <span>ثبت گزارش</span>
                <FaChevronDown
                  className={`transition-transform ${
                    reportMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {reportMenuOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-gray-700 rounded-md shadow-xl py-1 z-50">
                  <Link
                    to={managerPath}
                    onClick={() => setReportMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    گزارش پروژه (مدیر)
                  </Link>
                  <Link
                    to={facilitiesPath}
                    onClick={() => setReportMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    گزارش تاسیسات
                  </Link>
                  <Link
                    to={securityPath}
                    onClick={() => setReportMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    گزارش نگهبانی
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* منوی کاربر */}
          {userInfo ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition duration-300"
              >
                <FaUser />
                <span>{userInfo.first_name || userInfo.username}</span>
              </button>
              {menuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-700 rounded-md shadow-xl py-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                    onClick={() => setMenuOpen(false)}
                  >
                    پروفایل
                  </Link>
                  <button
                    onClick={logoutHandler}
                    className="w-full text-right px-4 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <FaSignOutAlt /> <span>خروج</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition duration-300"
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
