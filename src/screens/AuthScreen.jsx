import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../actions/userActions'; // مطمئن شوید که آدرس ایمپورت صحیح است
import { FaSpinner } from 'react-icons/fa';

// کامپوننت نمایش پیام (بدون تغییر)
const Message = ({ variant, children }) => {
  const baseClasses = 'p-4 rounded-md text-center my-2';
  const variantClasses = {
    danger: 'bg-red-200 text-red-800',
    success: 'bg-green-200 text-green-800',
  };
  return <div className={`${baseClasses} ${variantClasses[variant]}`}>{children}</div>;
};

// کامپوننت ورود (بدون تغییر)
const LoginComponent = ({ toggleForm }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, userInfo } = useSelector((state) => state.userLogin);
  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [userInfo, navigate, redirect]);
// in AuthScreen.js -> RegisterComponent

const submitHandler = (e) => {
    e.preventDefault();

    // اضافه کردن این بخش برای جلوگیری از ارسال فرم خالی
    if (username.trim() === '' || password.trim() === '') {
        setMessage('نام کاربری و رمز عبور نمی‌توانند خالی باشند');
        return; // اجرای تابع متوقف می‌شود
    }

    if (password !== confirmPassword) {
        setMessage('رمزهای عبور یکسان نیستند');
    } else {
        setMessage('');
        dispatch(register(username, password)); 
    }
};

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-white mb-6">ورود</h2>
      {error && <Message variant="danger">{error}</Message>}
      <form onSubmit={submitHandler} className="space-y-4">
        <input
          type="text"
          placeholder="نام کاربری"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
        />
        <input
          type="password"
          placeholder="رمز عبور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
        >
          {loading ? <FaSpinner className="animate-spin" /> : 'ورود'}
        </button>
      </form>
      <p className="text-center text-gray-400 mt-6">
        حساب کاربری ندارید؟{' '}
        <button onClick={toggleForm} className="font-bold text-indigo-400 hover:underline">
          ثبت نام کنید
        </button>
      </p>
    </div>
  );
};

// کامپوننت ثبت‌نام (اصلاح شده)
const RegisterComponent = ({ toggleForm }) => {
  // const [name, setName] = useState(''); // <<<< حذف شد
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error } = useSelector((state) => state.userRegister);
  const { userInfo } = useSelector((state) => state.userLogin); // برای لاگین خودکار
  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [userInfo, navigate, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('رمزهای عبور یکسان نیستند');
    } else {
      setMessage('');
      // <<<< 'name' از اینجا حذف شد
      dispatch(register(username, password)); 
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-white mb-6">ثبت نام</h2>
      {message && <Message variant="danger">{message}</Message>}
      {error && <Message variant="danger">{error}</Message>}
      <form onSubmit={submitHandler} className="space-y-4">
        {/* <<<< فیلد ورودی 'نام' به طور کامل حذف شد >>>> */}
        <input
          type="text"
          placeholder="نام کاربری"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-teal-500"
        />
        <input
          type="password"
          placeholder="رمز عبور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-teal-500"
        />
        <input
          type="password"
          placeholder="تکرار رمز عبور"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-teal-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
        >
          {loading ? <FaSpinner className="animate-spin" /> : 'ثبت نام'}
        </button>
      </form>
      <p className="text-center text-gray-400 mt-6">
        قبلا ثبت نام کرده‌اید؟{' '}
        <button onClick={toggleForm} className="font-bold text-teal-400 hover:underline">
          وارد شوید
        </button>
      </p>
    </div>
  );
};

// کامپوننت اصلی صفحه (بدون تغییر)
const AuthScreen = () => {
  const [showLogin, setShowLogin] = useState(true);
  const toggleForm = () => setShowLogin(!showLogin);

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
        {showLogin ? <LoginComponent toggleForm={toggleForm} /> : <RegisterComponent toggleForm={toggleForm} />}
      </div>
    </div>
  );
};

export default AuthScreen;