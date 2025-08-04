import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { FORGOT_PASSWORD } from '../api/mutations';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const [forgotPassword, { loading }] = useMutation(FORGOT_PASSWORD, {
    onCompleted: () => {
      setMessage({ text: t('reset_link_sent'), type: 'success' });
      setEmail('');
    },
    onError: (err) => setMessage({ text: err.message, type: 'error' }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: t('email_required'), type: 'error' });
      return;
    }
    forgotPassword({ variables: { email } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5E936C] to-[#93DA97] flex flex-col">
      <nav><Navbar /></nav>
      <div className="flex-grow flex items-center justify-center p-4 mt-16">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-[#5E936C] text-center mb-6">{t('forgot_password_title')}</h2>
          <p className="text-gray-600 text-center mb-6">{t('forgot_password_desc')}</p>

          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-gray-700 font-medium flex items-center">
                <FaEnvelope className="mr-2 text-[#5E936C]" />
                {t('email')}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                placeholder={t('email_placeholder')}
                required
              />
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
                  {t('sending')}
                </>
              ) : (
                t('send_reset_link')
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

export default ForgotPassword;