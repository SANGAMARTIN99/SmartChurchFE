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
import CombinedNav from '../components/CombinedNav';
import OfferingsOverview from '../pages/PASTOR/OfferingsOverview';
import MemberContributions from '../pages/PASTOR/MemberContributions';
import MemberDashboard from '../pages/MEMBER/member-dashboard';
import TheWordOfTheDay from '../pages/MEMBER/TheWordOfTheDay';
import MyPrayerRequests from '../pages/MEMBER/MyPrayerRequests';
import TodayAnnouncements from '../pages/MEMBER/TodayAnnouncements';


const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* Authenticated section with persistent CombinedNav layout */}
        <Route element={<CombinedNav />}>
          <Route path="/dashboard" element={<PastorDashboard />} />
          <Route path="/word-of-the-day" element={<WordOfTheDay />} />
          <Route path="/prayer-requests" element={<PrayerRequests />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/group-management" element={<GroupManagement />} />
          <Route path="/offerings" element={<OfferingsOverview />} />
          <Route path="/contributions" element={<MemberContributions />} />


          <Route path="/member-dashboard" element={<MemberDashboard />} />
          <Route path="/member-word-of-the-day" element={<TheWordOfTheDay />} />
          <Route path="/member-prayer-requests" element={<MyPrayerRequests />} />
          <Route path="/my-announcements" element={<TodayAnnouncements />} />
        </Route>
        
      </Routes>
    </Router>
  );
};

export default AppRoutes;