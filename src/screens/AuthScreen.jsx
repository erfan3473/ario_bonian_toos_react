import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, register } from '../actions/userActions';
import { FaSpinner } from 'react-icons/fa';

// A generic message component
const Message = ({ variant, children }) => {
  const baseClasses = 'p-4 rounded-md text-center my-2';
  const variantClasses = {
    danger: 'bg-red-200 text-red-800',
    success: 'bg-green-200 text-green-800',
  };
  return <div className={`${baseClasses} ${variantClasses[variant]}`}>{children}</div>;
};

// --- Login Component ---
const LoginComponent = ({ toggleForm }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const userLogin = useSelector((state) => state.userLogin);
  const { loading, error, userInfo } = userLogin;

  const redirect = location.search ? location.search.split('=')[1] : '/';

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, userInfo, redirect]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(login(email, password));
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-white mb-6">ورود</h2>
      {error && <Message variant="danger">{error}</Message>}
      <form onSubmit={submitHandler}>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email">
            ایمیل
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
            id="email"
            type="email"
            placeholder="ایمیل خود را وارد کنید"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password">
            رمز عبور
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
            id="password"
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 flex items-center justify-center disabled:opacity-50"
          type="submit"
          disabled={loading}
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

// --- Register Component ---
const RegisterComponent = ({ toggleForm }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
  
    const userRegister = useSelector((state) => state.userRegister);
    const { loading, error } = userRegister;

    const userLogin = useSelector((state) => state.userLogin);
    const { userInfo } = userLogin;

    const redirect = location.search ? location.search.split('=')[1] : '/';
  
    useEffect(() => {
      if (userInfo) {
        navigate(redirect);
      }
    }, [navigate, userInfo, redirect]);
  
    const submitHandler = (e) => {
      e.preventDefault();
      if (password !== confirmPassword) {
        setMessage('رمزهای عبور یکسان نیستند');
      } else {
        setMessage('');
        dispatch(register(name, email, password));
      }
    };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-center text-white mb-6">ثبت نام</h2>
      {message && <Message variant="danger">{message}</Message>}
      {error && <Message variant="danger">{error}</Message>}
      <form onSubmit={submitHandler}>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="name">
            نام
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
            id="name"
            type="text"
            placeholder="نام خود را وارد کنید"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="email-register">
            ایمیل
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
            id="email-register"
            type="email"
            placeholder="ایمیل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="password-register">
            رمز عبور
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
            id="password-register"
            type="password"
            placeholder="رمز عبور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="confirmPassword">
            تکرار رمز عبور
          </label>
          <input
            className="w-full px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:border-indigo-500"
            id="confirmPassword"
            type="password"
            placeholder="تکرار رمز عبور"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 flex items-center justify-center disabled:opacity-50"
          type="submit"
          disabled={loading}
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

// --- Main Auth Screen ---
const AuthScreen = () => {
  const [showLogin, setShowLogin] = useState(true);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  return (
    <div className="flex items-center justify-center w-full">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-8 space-y-8">
        {showLogin ? (
          <LoginComponent toggleForm={toggleForm} />
        ) : (
          <RegisterComponent toggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
