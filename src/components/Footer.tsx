import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaPhone, FaMapMarkerAlt, FaClock, FaEnvelope } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <FaFacebook />, name: 'Facebook', url: '#' },
    { icon: <FaTwitter />, name: 'Twitter', url: '#' },
    { icon: <FaInstagram />, name: 'Instagram', url: '#' },
    { icon: <FaYoutube />, name: 'YouTube', url: '#' }
  ];

  const quickLinks = [
    { name: 'Home', url: '#home' },
    { name: 'Services', url: '#services' },
    { name: 'Groups', url: '#groups' },
    { name: 'Ministries', url: '#ministries' },
    { name: 'Leaders', url: '#leaders' },
    { name: 'Contact', url: '#contact' }
  ];

  const contactInfo = [
    { icon: <FaMapMarkerAlt />, text: 'Mkimbizi Street, Iringa Municipal, Tanzania' },
    { icon: <FaPhone />, text: '+255 123 456 789' },
    { icon: <FaEnvelope />, text: 'info@usharikawakimbizi.org' },
    { icon: <FaClock />, text: 'Office Hours: Mon-Fri 8:00 AM - 5:00 PM' }
  ];

  return (
    <footer className="bg-[#5E936C] text-[#E8FFD7] pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Church Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold">KKKT Usharika wa Mkimbizi</h3>
            <p className="text-sm">
              A vibrant Lutheran church community in Iringa, Tanzania, dedicated to worship, fellowship, and service.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  className="text-2xl hover:text-[#93DA97] transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {social.icon}
                  <span className="sr-only">{social.name}</span>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <motion.li 
                  key={link.name}
                  whileHover={{ x: 5 }}
                >
                  <a href={link.url} className="hover:text-[#93DA97] transition-colors">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold">Contact Us</h3>
            <ul className="space-y-3">
              {contactInfo.map((item, index) => (
                <motion.li 
                  key={index}
                  className="flex items-start space-x-3"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <span className="mt-1">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Newsletter */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-xl font-bold">Newsletter</h3>
            <p className="text-sm">
              Subscribe to our newsletter to receive updates on church activities and events.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2 rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#93DA97]"
                required
              />
              <motion.button
                type="submit"
                className="bg-[#93DA97] text-[#2D3748] px-6 py-2 rounded-md font-medium hover:bg-[#E8FFD7] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div 
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="border-t border-[#93DA97]/30 my-6"
        />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            &copy; {currentYear} KKKT Usharika wa Mkimbizi. All rights reserved.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex space-x-4 mt-4 md:mt-0"
          >
            <a href="#" className="hover:text-[#93DA97] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[#93DA97] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[#93DA97] transition-colors">Sitemap</a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;