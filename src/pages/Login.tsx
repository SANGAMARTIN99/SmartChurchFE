import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSignInAlt, FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { LOGIN_USER, REGISTER_USER } from '../api/mutations';
import { GET_STREETS_AND_GROUPS } from '../api/queries';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';
import { setAuthToken } from '../utils/auth';

const AuthPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  interface RegisterData {
    fullName: string;
    email: string;
    phoneNumber: string;
    streetId: string;
    password: string;
    confirmPassword: string;
    groupIds: number[];
  }

  const [registerData, setRegisterData] = useState<RegisterData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    streetId: '',
    password: '',
    confirmPassword: '',
    groupIds: [],
  });

  // Fetch streets and groups
  const { data, loading, error } = useQuery(GET_STREETS_AND_GROUPS);

  // GraphQL Mutations
  const [loginUser, { loading: loginLoading }] = useMutation(LOGIN_USER, {
    onCompleted: async (data) => {
      const { accessToken, refreshToken, member } = data.loginUser;
      await setAuthToken(accessToken, refreshToken, member);
      console.log('Stored accessToken:', accessToken);

      const getDashboardPath = (role?: string) => {
        switch (role) {
          case 'PASTOR':
          case 'ASSISTANT_PASTOR':
            return '/pastor-dashboard';
          case 'CHURCH_MEMBER':
            return '/member-dashboard';
          case 'CHURCH_SECRETARY':
            return '/secretaryDashboard';
          case 'EVANGELIST':
            return '/evangelist-dashboard';
          default:
            return '/dashboard';
        }
      };

      const target = getDashboardPath(member?.role);
      showMessage(t('login_success'), 'success');
      setTimeout(() => {
        navigate(target);
      }, 1200);
    },
    onError: (err) => showMessage(err.message, 'error'),
  });

  const [registerUser, { loading: registerLoading }] = useMutation(REGISTER_USER, {
    onCompleted: () => {
      showMessage(t('register_success'), 'success');
      setIsLogin(true);
      setRegisterData({
        fullName: '',
        email: '',
        phoneNumber: '',
        streetId: '',
        password: '',
        confirmPassword: '',
        groupIds: [],
      });
    },
    onError: (err) => showMessage(err.message, 'error'),
  });

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterData({ ...registerData, [name]: value });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      showMessage(t('fields_required'), 'error');
      return;
    }
    loginUser({ variables: { input: { email: loginData.email, password: loginData.password } } });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      showMessage(t('passwords_not_match'), 'error');
      return;
    }
    if (registerData.password.length < 8) {
      showMessage(t('password_too_short'), 'error');
      return;
    }
    if (!registerData.streetId) {
      showMessage(t('street_required'), 'error');
      return;
    }

    registerUser({
      variables: {
        fullName: registerData.fullName,
        email: registerData.email,
        phoneNumber: registerData.phoneNumber,
        streetId: parseInt(registerData.streetId),
        password: registerData.password,
      },
    });
  };

  // Handle loading and error states
  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
      <div className="flex flex-col items-center">
        <svg className="animate-spin h-10 w-10 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-green-800 font-medium">{t('loading')}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">!</div>
        <p className="text-gray-800 font-medium mb-2">{t('error')}</p>
        <p className="text-gray-500 text-sm">{error.message}</p>
      </div>
    </div>
  );

  const streets = data?.streets || [];

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden bg-gray-50">
      {/* Navbar - Let it handle its own positioning */}
      <Navbar />

      {/* Background Elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Mobile Background Image with Overlay */}
        <div className="absolute inset-0 bg-[url('/pic2.jpg')] bg-cover bg-center md:hidden">
          <div className="absolute inset-0 bg-green-900/40 backdrop-blur-[2px]"></div>
        </div>

        {/* Desktop Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0fdf4] via-[#dcfce7] to-[#f0fdf4] hidden md:block"></div>

        {/* Decorative Animated Blobs (Desktop) */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#5E936C]/20 rounded-full blur-[120px] hidden md:block animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#93DA97]/20 rounded-full blur-[120px] hidden md:block animate-pulse delay-1000"></div>
      </div>

      {/* Main Content - Add top padding for fixed navbar */}
      <div className="flex-grow flex items-center justify-center p-4 py-8 pt-24 md:pt-32 relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl bg-white/90 md:bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/60 ring-1 ring-black/5"
        >
          {/* Left Side - Image/Brand (Desktop only) */}
          <div className="hidden md:block md:w-5/12 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('/pic2.jpg')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a4731]/90 via-[#1a4731]/40 to-transparent flex flex-col justify-end p-10 text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <div className="w-12 h-1 bg-green-400 mb-6 rounded-full"></div>
                <h2 className="text-4xl font-bold mb-4 drop-shadow-sm">{t('welcome')}</h2>
                <p className="text-lg text-green-50 font-light leading-relaxed opacity-90">
                  {isLogin ? t('login_welcome') : t('register_welcome')}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-7/12 p-6 sm:p-8 md:p-12 bg-white/60 md:bg-transparent">
            {/* Mobile Welcome Header */}
            <div className="md:hidden text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('welcome')}</h2>
              <p className="text-gray-700 font-medium">{isLogin ? t('login_welcome') : t('register_welcome')}</p>
            </div>

            {/* Toggle Buttons */}
            <div className="flex p-1.5 bg-gray-200/50 rounded-2xl mb-8 relative max-w-sm mx-auto md:mx-0 border border-gray-200/50">
              <motion.div
                className="absolute bg-white shadow-md rounded-xl top-1.5 bottom-1.5"
                initial={false}
                animate={{
                  left: isLogin ? '6px' : '50%',
                  right: isLogin ? '50%' : '6px',
                  width: 'calc(50% - 12px)'
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 relative z-10 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${isLogin ? 'text-[#5E936C]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FaSignInAlt className="text-lg" />
                <span>{t('login')}</span>
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 relative z-10 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2 ${!isLogin ? 'text-[#5E936C]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FaUserPlus className="text-lg" />
                <span>{t('register')}</span>
              </button>
            </div>

            {/* Message Display */}
            <AnimatePresence mode="wait">
              {message.text && (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`mb-6 p-4 rounded-xl flex items-center text-sm font-medium border ${message.type === 'error'
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-green-50 text-green-600 border-green-100'
                    }`}
                >
                  <span className="mr-2 text-lg">{message.type === 'error' ? '⚠️' : '✅'}</span>
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms Container */}
            <div className="min-h-[400px]">
              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.form
                    key="login-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onSubmit={handleLoginSubmit}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('email')}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaEnvelope className="text-gray-400 group-focus-within:text-[#5E936C] transition-colors" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          value={loginData.email}
                          onChange={handleLoginChange}
                          className="block w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none placeholder-gray-400 text-gray-800"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('password')}</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaLock className="text-gray-400 group-focus-within:text-[#5E936C] transition-colors" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={loginData.password}
                          onChange={handleLoginChange}
                          className="block w-full pl-11 pr-12 py-3.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none placeholder-gray-400 text-gray-800"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <a href="/forgot-password" className="text-sm font-medium text-[#5E936C] hover:text-[#4a7a58] transition-colors hover:underline">
                        {t('forgot_password')}
                      </a>
                    </div>

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-gradient-to-r from-[#5E936C] to-[#4a7a58] text-white py-3.5 px-4 rounded-xl font-bold shadow-lg shadow-[#5E936C]/30 hover:shadow-[#5E936C]/50 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loginLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{t('logging_in')}...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base">{t('login')}</span>
                          <FaSignInAlt className="ml-2 text-sm" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="register-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    onSubmit={handleRegisterSubmit}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('full_name')}</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaUser className="text-gray-400 group-focus-within:text-[#5E936C]" />
                          </div>
                          <input
                            type="text"
                            name="fullName"
                            value={registerData.fullName}
                            onChange={handleRegisterChange}
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('email')}</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaEnvelope className="text-gray-400 group-focus-within:text-[#5E936C]" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('phone_number')}</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaPhone className="text-gray-400 group-focus-within:text-[#5E936C]" />
                          </div>
                          <input
                            type="text"
                            name="phoneNumber"
                            value={registerData.phoneNumber}
                            onChange={handleRegisterChange}
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('street')}</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaMapMarkerAlt className="text-gray-400 group-focus-within:text-[#5E936C]" />
                          </div>
                          <select
                            name="streetId"
                            value={registerData.streetId}
                            onChange={handleRegisterChange}
                            className="block w-full pl-11 pr-8 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none appearance-none"
                            required
                          >
                            <option value="">{t('select_street')}</option>
                            {streets.map((street: any) => (
                              <option key={street.id} value={street.id}>
                                {street.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('password')}</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaLock className="text-gray-400 group-focus-within:text-[#5E936C]" />
                          </div>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none"
                            placeholder="Min 8 chars"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1 block">{t('confirm_password')}</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaLock className="text-gray-400 group-focus-within:text-[#5E936C]" />
                          </div>
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmPassword"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C]/20 focus:border-[#5E936C] transition-all outline-none"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={registerLoading}
                      className="w-full bg-gradient-to-r from-[#5E936C] to-[#4a7a58] text-white py-3.5 px-4 rounded-xl font-bold shadow-lg shadow-[#5E936C]/30 hover:shadow-[#5E936C]/50 hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center justify-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {registerLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>{t('creating_account')}...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-base">{t('register')}</span>
                          <FaUserPlus className="ml-2 text-lg" />
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="relative z-50">
        <Footer />
      </div>
    </div>
  );
};

export default AuthPage;
// Revision note [2026-07-19 14:44:13 +0300]: Update authentication header propagation logic

// Revision note [2026-08-02 18:16:41 +0300]: Improve dark mode CSS variable consistency

// Activity update [2026-07-17 17:40:10 +0300]: Update authentication header propagation logic
