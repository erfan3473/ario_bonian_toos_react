// src/components/Header.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
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

  // ✅ اصلاح سلکتور اشتباه:
  const projects = useSelector((state) => state.projectList?.projects) || [];

  // ✅ جلوگیری از رفرنس جدید در هر رندر
  const stableProjects = useMemo(() => projects || [], [projects]);

  const todayReport = useSelector((state) => state.dailyReports?.todayReport);

  const projectId = stableProjects.length > 0 ? stableProjects[0].id : null;

  const [menuOpen, setMenuOpen] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const [payrollMenuOpen, setPayrollMenuOpen] = useState(false);

  const reportRef = useRef();
  const payrollRef = useRef();
  const userMenuRef = useRef();

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

  // 🧩 بستن منوها با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reportRef.current && !reportRef.current.contains(e.target)) {
        setReportMenuOpen(false);
      }
      if (payrollRef.current && !payrollRef.current.contains(e.target)) {
        setPayrollMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-green-800 via-gray-800 to-green-900 shadow-lg sticky top-0 z-40 w-full">
      <div className="flex justify-between items-center py-4 px-6">
        <div className="flex items-center gap-x-4">
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

        <nav className="hidden md:flex items-center gap-x-8 text-gray-200">
          <Link to="/projects" className="hover:text-green-300 transition">
            پروژه‌ها
          </Link>
          <Link to="/dashboard" className="hover:text-green-300 transition">
            مانیتور پروژه
          </Link>

          {userInfo?.isAdmin && (
            <>
              <Link to="/admin/users" className="hover:text-green-300 transition">
                مدیریت کاربران
              </Link>
              <Link to="/admin/roles" className="hover:text-green-300 transition">
                مدیریت نقش‌ها
              </Link>

              <div className="relative" ref={payrollRef}>
                <button
                  onClick={() => setPayrollMenuOpen(!payrollMenuOpen)}
                  className="hover:text-green-300 transition flex items-center gap-1"
                >
                  مدیریت حقوق و دستمزد
                  <FaChevronDown
                    className={`text-xs transition-transform ${
                      payrollMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {payrollMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-gray-700 rounded-md shadow-xl py-1 text-sm text-gray-200 z-50">
                    <Link
                      to="/admin/payroll/payslips"
                      className="block px-4 py-2 hover:bg-gray-600"
                      onClick={() => setPayrollMenuOpen(false)}
                    >
                      فیش‌های حقوقی
                    </Link>
                    <Link
                      to="/admin/payroll/leaves"
                      className="block px-4 py-2 hover:bg-gray-600"
                      onClick={() => setPayrollMenuOpen(false)}
                    >
                      مرخصی‌ها
                    </Link>
                    <Link
                      to="/admin/payroll/components"
                      className="block px-4 py-2 hover:bg-gray-600"
                      onClick={() => setPayrollMenuOpen(false)}
                    >
                      اجزای حقوق
                    </Link>
                    <Link
                      to="/admin/payroll/reports"
                      className="block px-4 py-2 hover:bg-gray-600"
                      onClick={() => setPayrollMenuOpen(false)}
                    >
                      گزارش‌های حقوق و دستمزد
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}

          {userInfo && (
            <div className="relative" ref={reportRef}>
              <button
                onClick={() => setReportMenuOpen(!reportMenuOpen)}
                className="flex items-center space-x-2 bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg transition"
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

          {userInfo ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition"
              >
                <FaUser />
                <span>{userInfo.first_name || userInfo.username}</span>
              </button>
              {menuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-gray-700 rounded-md shadow-xl py-1 z-50">
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
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition"
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
