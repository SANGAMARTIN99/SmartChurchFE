import React, { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaMapMarkerAlt, FaSignInAlt, FaUserPlus, FaEye, FaEyeSlash, FaUsers } from 'react-icons/fa';
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
  const [registerData, setRegisterData] = useState({
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
      await setAuthToken(accessToken, refreshToken, member); // Ensure token is stored
      console.log('Stored accessToken:', accessToken);

      // Determine dashboard path based on role
      const getDashboardPath = (role?: string) => {
        switch (role) {
          case 'PASTOR':
          case 'ASSISTANT_PASTOR':
            return '/dashboard';
          case 'CHURCH_MEMBER':
            return '/member-dashboard';
          case 'CHURCH_SECRETARY':
            return '/secretary-dashboard';
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

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (option) => parseInt(option.value));
    setRegisterData({ ...registerData, groupIds: selected });
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
  if (loading) return <div className="min-h-screen bg-gradient-to-br from-[#5E936C] to-[#93DA97] flex items-center justify-center">{t('loading')}</div>;
  if (error) return <div className="min-h-screen bg-gradient-to-br from-[#5E936C] to-[#93DA97] flex items-center justify-center">{t('error', { message: error.message })}</div>;

  // Extract streets and groups from query data
  const streets = data?.streets || [];
  const groups = data?.groups || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5E936C] to-[#93DA97] flex flex-col">
      <nav><Navbar /></nav>
      <div className="flex-grow flex items-center justify-center p-4 mt-16">
        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* Left Side - Image (hidden on mobile) */}
          <div className="hidden md:block md:w-1/2 bg-[#E8FFD7] relative">
            <div className="absolute inset-0 bg-[url('/pic2.jpg')] bg-cover bg-center opacity-90"></div>
            <div className="absolute inset-0 bg-[#5E936C]/30 flex items-center justify-center">
              <div className="text-center p-8 text-white">
                <h2 className="text-4xl font-bold mb-4">{t('welcome')}</h2>
                <p className="text-xl">
                  {isLogin ? t('login_welcome') : t('register_welcome')}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full md:w-1/2 p-8 md:p-12">
            {/* Toggle Buttons */}
            <div className="flex mb-8 border-b border-gray-200">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 font-medium text-lg flex items-center justify-center space-x-2 ${isLogin ? 'text-[#5E936C] border-b-2 border-[#5E936C]' : 'text-gray-500'}`}
              >
                <FaSignInAlt />
                <span>{t('login')}</span>
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 font-medium text-lg flex items-center justify-center space-x-2 ${!isLogin ? 'text-[#5E936C] border-b-2 border-[#5E936C]' : 'text-gray-500'}`}
              >
                <FaUserPlus />
                <span>{t('register')}</span>
              </button>
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {message.text}
              </div>
            )}

            {/* Login Form */}
            {isLogin ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-gray-700 font-medium flex items-center">
                    <FaEnvelope className="mr-2 text-[#5E936C]" />
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                    placeholder={t('email_placeholder')}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="block text-gray-700 font-medium flex items-center">
                    <FaLock className="mr-2 text-[#5E936C]" />
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      placeholder={t('password_placeholder')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <a href="/forgot-password" className="text-[#5E936C] hover:underline">{t('forgot_password')}</a>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-[#5E936C] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#4a7a58] transition-colors flex items-center justify-center"
                >
                  {loginLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('logging_in')}
                    </>
                  ) : (
                    <>
                      <FaSignInAlt className="mr-2" />
                      {t('login')}
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="fullName" className="block text-gray-700 font-medium flex items-center">
                    <FaUser className="mr-2 text-[#5E936C]" />
                    {t('full_name')}
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={registerData.fullName}
                    onChange={handleRegisterChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                    placeholder={t('full_name_placeholder')}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className="block text-gray-700 font-medium flex items-center">
                    <FaEnvelope className="mr-2 text-[#5E936C]" />
                    {t('email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                    placeholder={t('email_placeholder')}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="phoneNumber" className="block text-gray-700 font-medium flex items-center">
                    <FaPhone className="mr-2 text-[#5E936C]" />
                    {t('phone_number')}
                  </label>
                  <input
                    type="text"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={registerData.phoneNumber}
                    onChange={handleRegisterChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                    placeholder={t('phone_placeholder')}
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="streetId" className="block text-gray-700 font-medium flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-[#5E936C]" />
                    {t('street')}
                  </label>
                  <select
                    id="streetId"
                    name="streetId"
                    value={registerData.streetId}
                    onChange={handleRegisterChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                    required
                  >
                    <option value="">{t('select_street')}</option>
                    {streets.map((street: any) => (
                      <option key={street.id} value={street.id}>
                        {street.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="password" className="block text-gray-700 font-medium flex items-center">
                    <FaLock className="mr-2 text-[#5E936C]" />
                    {t('password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      placeholder={t('password_placeholder')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="confirmPassword" className="block text-gray-700 font-medium flex items-center">
                    <FaLock className="mr-2 text-[#5E936C]" />
                    {t('confirm_password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={registerData.confirmPassword}
                      onChange={handleRegisterChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      placeholder={t('confirm_password_placeholder')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full bg-[#5E936C] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#4a7a58] transition-colors flex items-center justify-center mt-6"
                >
                  {registerLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('creating_account')}
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="mr-2" />
                      {t('register')}
                    </>
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {isLogin ? t('no_account') : t('have_account')}{' '}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[#5E936C] font-medium hover:underline"
                >
                  {isLogin ? t('register_here') : t('login_here')}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      <footer><Footer /></footer>
    </div>
  );
};

export default AuthPage;