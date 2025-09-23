import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import AuthPage from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import PastorDashboard from '../pages/PASTOR/dashboard';
import WordOfTheDay from '../pages/PASTOR/WordOfTheDay';
import PrayerRequests from '../pages/PASTOR/PrayerRequests';
import AnnouncementsPage from '../pages/PASTOR/PastorAnnouncements';
import GroupManagement from '../pages/PASTOR/GroupManagement';


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<PastorDashboard />} />
        <Route path="/word-of-the-day" element={<WordOfTheDay />} />
        <Route path="/prayer-requests" element={<PrayerRequests />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/group-management" element={<GroupManagement />} />
        
      </Routes>
    </Router>
  );
};

export default AppRoutes;