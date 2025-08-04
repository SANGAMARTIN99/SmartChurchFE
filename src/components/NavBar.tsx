import { useState, useEffect } from 'react';
import { FaChurch, FaCalendarAlt, FaUsers, FaPhone, FaGlobe } from 'react-icons/fa';
import { GiCrossedChains } from 'react-icons/gi';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { i18n } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = (item: string) => {
    setActiveDropdown(activeDropdown === item ? null : item);
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setActiveDropdown(null); // Close dropdown after selection
    setMobileMenuOpen(false); // Close mobile menu after selection
  };

  const navItems = [
    { name: 'Home', icon: <FaChurch />, href: '#home' },
    { 
      name: 'Services', 
      icon: <FaCalendarAlt />,
      href: '#services',
      dropdown: [
        { name: 'Sunday Masses', href: '#sunday-masses' },
        { name: 'Daily Masses', href: '#daily-masses' },
        { name: 'Weekly Fellowships', href: '#fellowships' }
      ]
    },
    { 
      name: 'Groups', 
      icon: <FaUsers />,
      href: '#groups',
      dropdown: [
        { name: 'Choirs', href: '#choirs' },
        { name: 'Focus Groups', href: '#focus-groups' }
      ]
    },
    { name: 'Ministries', icon: <GiCrossedChains />, href: '#ministries' },
    { name: 'Leaders', icon: <FaUsers />, href: '#leaders' },
    { name: 'Contact', icon: <FaPhone />, href: '#contact' },
    { 
      name: 'Language', 
      icon: <FaGlobe />, 
      href: '#language',
      dropdown: [
        { name: 'English', href: '#', action: () => changeLanguage('en') },
        { name: 'Swahili', href: '#', action: () => changeLanguage('sw') }
      ]
    }
  ];

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#5E936C] shadow-lg py-2' : 'bg-[#5E936C]/90 py-4'}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2"
          >
            <FaChurch className="text-3xl text-[#E8FFD7]" />
            <span className="text-xl font-bold text-[#E8FFD7] hidden md:block">
              KKKT Usharika wa Mkimbizi
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <div key={item.name} className="relative group">
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  href={item.href}
                  className="flex items-center px-3 py-2 text-[#E8FFD7] hover:text-white transition-colors"
                  onMouseEnter={() => item.dropdown && toggleDropdown(item.name)}
                  onMouseLeave={() => item.dropdown && toggleDropdown(null)}
                  onClick={item.dropdown && item.dropdown[0].action ? item.dropdown[0].action : undefined}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  {item.dropdown && (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  )}
                </motion.a>

                {item.dropdown && activeDropdown === item.name && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute left-0 mt-2 w-48 bg-[#93DA97] rounded-md shadow-lg z-50"
                    onMouseEnter={() => toggleDropdown(item.name)}
                    onMouseLeave={() => toggleDropdown(null)}
                  >
                    {item.dropdown.map((subItem) => (
                      <a
                        key={subItem.name}
                        href={subItem.href}
                        onClick={subItem.action ? subItem.action : undefined}
                        className="block px-4 py-2 text-[#2D3748] hover:bg-[#5E936C] hover:text-[#E8FFD7] transition-colors"
                      >
                        {subItem.name}
                      </a>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#E8FFD7] focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-[#5E936C] shadow-lg"
        >
          <div className="px-2 pt-2 pb-4 space-y-1">
            {navItems.map((item) => (
              <div key={item.name}>
                <a
                  href={item.href}
                  className="flex items-center px-3 py-2 text-[#E8FFD7] hover:bg-[#93DA97] hover:text-[#2D3748] rounded-md transition-colors"
                  onClick={(e) => {
                    if (item.dropdown) {
                      e.preventDefault();
                      toggleDropdown(item.name);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                  {item.dropdown && (
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  )}
                </a>
                {item.dropdown && activeDropdown === item.name && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="ml-6 mt-1 space-y-1"
                  >
                    {item.dropdown.map((subItem) => (
                      <a
                        key={subItem.name}
                        href={subItem.href}
                        onClick={(e) => {
                          if (subItem.action) {
                            e.preventDefault();
                            subItem.action();
                          } else {
                            setMobileMenuOpen(false);
                          }
                        }}
                        className="block px-3 py-2 text-[#E8FFD7] hover:bg-[#93DA97] hover:text-[#2D3748] rounded-md transition-colors"
                      >
                        {subItem.name}
                      </a>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;