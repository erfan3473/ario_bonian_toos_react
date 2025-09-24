import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink } from 'react-router-dom';
import ProfileCard from './ProfileCard';
import { FaTimes, FaTachometerAlt, FaFolder } from 'react-icons/fa';
import { getUserDetails } from '../features/users/userSlice'; // مسیر فرضی برای slice

const Sidebar = ({ isOpen, setIsOpen }) => {
  const dispatch = useDispatch();

  const { userInfo } = useSelector((state) => state.userLogin);
  const { user } = useSelector((state) => state.userDetails);

  useEffect(() => {
    if (userInfo && !user?.username) {
      dispatch(getUserDetails('profile'));
    }
  }, [dispatch, userInfo, user]);

  const linkBaseClass = "flex items-center space-x-3 space-x-reverse p-3 rounded-lg transition-colors duration-200";
  const activeLinkClass = "bg-cyan-600 text-white font-semibold";
  const defaultLinkClass = "hover:bg-gray-700 hover:text-white";

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden transition-opacity ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside
        className={`fixed top-0 right-0 h-full w-72 bg-gray-800 text-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } md:translate-x-0 flex flex-col`}
        style={{ direction: 'rtl' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-white">منو</h2>
          <button onClick={() => setIsOpen(false)} className="text-2xl text-gray-400 hover:text-white md:hidden">
            <FaTimes />
          </button>
        </div>

        {/* کارت پروفایل با استایل جدید */}
        {user && <ProfileCard user={user} />}

        {/* ناوبری با فضاسازی بهتر */}
        <nav className="flex-grow p-4 space-y-3 mt-4">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
            }
          >
            <FaTachometerAlt size="1.2em" />
            <span>داشبورد</span>
          </NavLink>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `${linkBaseClass} ${isActive ? activeLinkClass : defaultLinkClass}`
            }
          >
            <FaFolder size="1.2em" />
            <span>لیست پروژه‌ها</span>
          </NavLink>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;