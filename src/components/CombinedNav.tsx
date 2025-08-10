import { useState, type ComponentType } from 'react';
import { FaChurch, FaUser, FaBell, FaGlobe, FaSignOutAlt, FaBars, FaTimes, FaTachometerAlt, FaBook, FaPray, FaBullhorn, FaDonate, FaUsers, FaFileAlt, FaCalendarAlt, FaChartBar, FaFileExport, FaRss } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { clearAuthTokens } from '../utils/auth';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
      fullName
    }
  }
`;

const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

interface SidebarItem {
  name: string;
  icon: ComponentType;
  href: string;
  roles: string[];
}

const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', icon: FaTachometerAlt, href: '/dashboard', roles: ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST', 'CHURCH_SECRETARY', 'CHURCH_MEMBER'] },
  { name: 'Word of the Day', icon: FaBook, href: '/word-of-the-day', roles: ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST', 'CHURCH_MEMBER'] },
  { name: 'Prayer Requests', icon: FaPray, href: '/prayer-requests', roles: ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST', 'CHURCH_MEMBER'] },
  { name: 'Announcements', icon: FaBullhorn, href: '/announcements', roles: ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST', 'CHURCH_SECRETARY', 'CHURCH_MEMBER'] },
  { name: 'Offerings Overview', icon: FaDonate, href: '/offerings', roles: ['PASTOR', 'ASSISTANT_PASTOR'] },
  { name: 'Group Management', icon: FaUsers, href: '/groups', roles: ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST', 'CHURCH_SECRETARY', 'CHURCH_MEMBER'] },
  { name: 'Member Contributions', icon: FaFileAlt, href: '/contributions', roles: ['PASTOR'] },
  { name: 'Blog', icon: FaRss, href: '/blog', roles: ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST', 'CHURCH_MEMBER'] },
  { name: 'Service Schedule', icon: FaCalendarAlt, href: '/services', roles: ['PASTOR', 'ASSISTANT_PASTOR', 'CHURCH_SECRETARY'] },
  { name: 'Notifications Center', icon: FaBell, href: '/notifications', roles: ['PASTOR'] },
  { name: 'Analytics Dashboard', icon: FaChartBar, href: '/analytics', roles: ['PASTOR'] },
  { name: 'Offering Card Management', icon: FaFileAlt, href: '/offering-cards', roles: ['CHURCH_SECRETARY'] },
  { name: 'Offerings Entry', icon: FaDonate, href: '/offerings-entry', roles: ['CHURCH_SECRETARY'] },
  { name: 'Member Records', icon: FaUser, href: '/member-records', roles: ['CHURCH_SECRETARY'] },
  { name: 'Export Reports', icon: FaFileExport, href: '/reports', roles: ['CHURCH_SECRETARY'] },
  { name: 'Member Directory', icon: FaUsers, href: '/directory', roles: ['ASSISTANT_PASTOR', 'CHURCH_SECRETARY'] },
  { name: 'Community Events Calendar', icon: FaCalendarAlt, href: '/events', roles: ['EVANGELIST'] },
  { name: 'My Offerings', icon: FaDonate, href: '/my-offerings', roles: ['CHURCH_MEMBER'] },
  { name: 'My Profile', icon: FaUser, href: '/profile', roles: ['CHURCH_MEMBER'] },
  { name: 'My Groups', icon: FaUsers, href: '/my-groups', roles: ['CHURCH_MEMBER'] },
  { name: 'RSVP to Events', icon: FaCalendarAlt, href: '/rsvp', roles: ['CHURCH_MEMBER'] },
  { name: 'Notifications Settings', icon: FaBell, href: '/notifications-settings', roles: ['CHURCH_MEMBER'] },
];

const CombinedNav = () => {
  const { t, i18n } = useTranslation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const { data, loading, error } = useQuery(ME_QUERY, {
    fetchPolicy: 'network-only', // Ensure fresh data
  });
  const [logout] = useMutation(LOGOUT_MUTATION);
  const navigate = useNavigate();

  // Debug: Log GraphQL errors
  if (error) {
    console.error('ME_QUERY Error:', error);
    // Don't redirect here; let errorLink handle it
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">{t('auth_error')}</div>;
  }

  const handleLogout = async () => {
    try {
      await logout();
      clearAuthTokens();
      navigate('/login');
      setProfileOpen(false);
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguageOpen(false);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">{t('loading')}</div>;
  }

  if (!data?.me) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">{t('auth_error')}</div>;
  }

  const userRole = data.me.role;
  const allowedItems = sidebarItems.filter(item => item.roles.includes(userRole));
  const notifications = []; 

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 bg-[#5E936C] text-[#E8FFD7] shadow-lg z-50"
      >
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo and Mobile Sidebar Toggle */}
          <div className="flex items-center space-x-2">
            <button
              className="md:hidden text-2xl"
              onClick= {toggleSidebar}
            >
              {isSidebarOpen ? <FaTimes /> : <FaBars />}
            </button>
            <Link to="/dashboard" className="flex items-center space-x-2">
              <FaChurch className="text-2xl" />
              <span className="text-lg font-bold hidden md:block">KKKT Usharika wa Mkimbizi</span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4 ">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex items-center"
              >
                <FaBell className="text-xl" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-64 bg-[#93DA97] rounded-md shadow-lg z-50"
                >
                  <div className="p-2 text-[#2D3748]">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-2">{t('No notifications')}</p>
                    ) : (
                      notifications.map((notif, index) => (
                        <p key={index} className="px-4 py-2 hover:bg-[#5E936C] hover:text-[#E8FFD7]">
                          {notif.message}
                        </p>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setLanguageOpen(!languageOpen)}
                className="flex items-center space-x-1"
              >
                <FaGlobe className="text-xl" />
                <span className="hidden md:inline">{i18n.language.toUpperCase()}</span>
              </button>
              {languageOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-32 bg-[#93DA97] rounded-md shadow-lg z-50"
                >
                  <button
                    onClick={() => changeLanguage('en')}
                    className="block w-full text-left px-4 py-2 text-[#2D3748] hover:bg-[#5E936C] hover:text-[#E8FFD7]"
                  >
                    English
                  </button>
                  <button
                    onClick={() => changeLanguage('sw')}
                    className="block w-full text-left px-4 py-2 text-[#2D3748] hover:bg-[#5E936C] hover:text-[#E8FFD7]"
                  >
                    Swahili
                  </button>
                </motion.div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2"
              >
                <FaUser className="text-xl" />
                <span className="hidden md:inline">{data.me.fullName}</span>
              </button>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-[#93DA97] rounded-md shadow-lg z-50"
                >
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-[#2D3748] hover:bg-[#5E936C] hover:text-[#E8FFD7]"
                    onClick={() => setProfileOpen(false)}
                  >
                    {t('My Profile')}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-[#2D3748] hover:bg-[#5E936C] hover:text-[#E8FFD7]"
                  >
                    <FaSignOutAlt className="inline mr-2" />
                    {t('Logout')}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Sidebar */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ duration: 0.3 }}
        className={`fixed md:static top-16 md:top-0 left-0 h-[calc(100vh-64px)] md:h-full bg-[#5E936C] text-[#E8FFD7] w-64 z-40 transform md:transform-none md:flex flex-col ${isSidebarOpen ? 'block' : 'hidden md:block'}`}
      >
        <div className="p-4 text-xl font-bold flex items-center space-x-2 md:hidden">
          <span>KKKT Usharika</span>
        </div>
        <nav className="flex-1 overflow-y-auto">
          {allowedItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className="flex items-center px-4 py-3 hover:bg-[#93DA97] hover:text-[#2D3748] transition-colors"
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="mr-3">
                  <Icon />
                </span>
                {t(item.name)}
              </Link>
            );
          })}
        </nav>
      </motion.div>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <main className="md:ml-64 mt-16 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default CombinedNav;