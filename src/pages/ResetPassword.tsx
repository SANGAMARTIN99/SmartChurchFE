import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { RESET_PASSWORD } from '../api/mutations';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';

const ResetPassword = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD, {
    onCompleted: () => {
      setMessage({ text: t('reset_success'), type: 'success' });
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    },
    onError: (err) => setMessage({ text: err.message, type: 'error' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setMessage({ text: t('fields_required'), type: 'error' });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ text: t('passwords_not_match'), type: 'error' });
      return;
    }
    if (password.length < 8) {
      setMessage({ text: t('password_too_short'), type: 'error' });
      return;
    }
    resetPassword({ variables: { token, password } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5E936C] to-[#93DA97] flex flex-col">
      <nav><Navbar /></nav>
      <div className="flex-grow flex items-center justify-center p-4 mt-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#5E936C] text-center mb-6">{t('reset_password_title')}</h2>
          <p className="text-gray-600 text-center mb-6">{t('reset_password_desc')}</p>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="password" className="block text-gray-700 font-medium flex items-center">
                <FaLock className="mr-2 text-[#5E936C]" />
                {t('new_password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
              disabled={loading}
              className="w-full bg-[#5E936C] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#4a7a58] transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('resetting')}
                </>
              ) : (
                t('reset_password_title')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-[#5E936C] font-medium hover:underline flex items-center justify-center space-x-2"
            >
              <FaArrowLeft />
              <span>{t('back_to_login')}</span>
            </a>
          </div>
        </div>
      </div>
      <footer><Footer /></footer>
    </div>
  );
};

export default ResetPassword;