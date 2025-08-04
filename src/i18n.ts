import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  en: {
    translation: {
      // AuthPage
      welcome: 'Karibu!',
      login_welcome: 'Welcome back to KKKT Usharika wa Mkimbizi',
      register_welcome: 'Join our church community today',
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      remember_me: 'Remember me',
      forgot_password: 'Forgot password?',
      full_name: 'Full Name',
      phone_number: 'Phone Number (Optional)',
      street: 'Street',
      select_street: 'Select your street',
      groups: 'Groups (Optional)',
      confirm_password: 'Confirm Password',
      password_placeholder: 'At least 8 characters',
      confirm_password_placeholder: 'Confirm your password',
      phone_placeholder: '+255123456789',
      email_placeholder: 'your@email.com',
      full_name_placeholder: 'John Doe',
      login_success: 'Login successful! Redirecting...',
      register_success: 'Registration successful! You can now login.',
      passwords_not_match: 'Passwords do not match',
      password_too_short: 'Password must be at least 8 characters',
      street_required: 'Please select your street',
      fields_required: 'Please fill in all fields',
      no_account: "Don't have an account?",
      have_account: 'Already have an account?',
      register_here: 'Register here',
      login_here: 'Login here',

      // ForgotPassword
      forgot_password_title: 'Forgot Password',
      forgot_password_desc: 'Enter your email address to receive a password reset link.',
      send_reset_link: 'Send Reset Link',
      back_to_login: 'Back to Login',
      reset_link_sent: 'Password reset link sent! Check your email.',
      email_required: 'Please enter your email address',
      email_failed: 'Failed to send email. Please try again later.',
      email_not_found: 'No account found with this email address',

      // ResetPassword
      reset_password_title: 'Reset Password',
      reset_password_desc: 'Enter your new password below.',
      new_password: 'New Password',
      reset_success: 'Password reset successful! Redirecting to login...',
      token_invalid: 'Invalid or expired token',
    },
  },
  sw: {
    translation: {
      // AuthPage
      welcome: 'Karibu!',
      login_welcome: 'Karibu tena KKKT Usharika wa Mkimbizi',
      register_welcome: 'Jiunge na jamii yetu ya kanisa leo',
      login: 'Ingia',
      register: 'Jisajili',
      email: 'Barua Pepe',
      password: 'Neno la Siri',
      remember_me: 'Nikumbuke',
      forgot_password: 'Umesahau neno la siri?',
      full_name: 'Jina Kamili',
      phone_number: 'Namba ya Simu (Hiari)',
      street: 'Mtaa',
      select_street: 'Chagua mtaa wako',
      groups: 'Vikundi (Hiari)',
      confirm_password: 'Thibitisha Neno la Siri',
      password_placeholder: 'Angalau herufi 8',
      confirm_password_placeholder: 'Thibitisha neno lako la siri',
      phone_placeholder: '+255123456789',
      email_placeholder: 'barua@yako.com',
      full_name_placeholder: 'John Doe',
      login_success: 'Kuingia kimefanikiwa! Inaelekeza...',
      register_success: 'Usajili umefanikiwa! Sasa unaweza kuingia.',
      passwords_not_match: 'Maneno ya siri hayalingani',
      password_too_short: 'Neno la siri linapaswa kuwa na angalau herufi 8',
      street_required: 'Tafadhali chagua mtaa wako',
      fields_required: 'Tafadhali jaza sehemu zote',
      no_account: 'Huna akaunti?',
      have_account: 'Tayari una akaunti?',
      register_here: 'Jisajili hapa',
      login_here: 'Ingia hapa',

      // ForgotPassword
      forgot_password_title: 'Umesahau Neno la Siri',
      forgot_password_desc: 'Ingiza anwani yako ya barua pepe kupokea kiungo cha kuweka upya neno la siri.',
      send_reset_link: 'Tuma Kiungo cha Kuweka Upya',
      back_to_login: 'Rudi kwenye Kuingia',
      reset_link_sent: 'Kiungo cha kuweka upya neno la siri kimetumwa! Angalia barua pepe yako.',
      email_required: 'Tafadhali ingiza anwani yako ya barua pepe',
      email_failed: 'Imeshindwa kutuma barua pepe. Tafadhali jaribu tena baadaye.',
      email_not_found: 'Hakuna akaunti iliyopatikana na anwani hii ya barua pepe',

      // ResetPassword
      reset_password_title: 'Weka Upya Neno la Siri',
      reset_password_desc: 'Ingiza neno lako jipya la siri hapa chini.',
      new_password: 'Neno la Siri Jipya',
      reset_success: 'Kuweka upya neno la siri kumefanikiwa! Inaelekeza kwenye kuingia...',
      token_invalid: 'Tokeni batili au imepita muda wake',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React handles XSS
    },
  });

export default i18n;