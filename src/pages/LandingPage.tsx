import { useState, useEffect } from 'react';
import { FaChurch, FaCalendarAlt, FaUsers, FaPray, FaArrowRight } from 'react-icons/fa';
import { GiCrossedChains } from 'react-icons/gi';
import { motion } from 'framer-motion';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';

// Sample images - replace with actual church images
const churchImages = [
  { src: '/pic1.jpg', alt: 'Church exterior', caption: 'Our beautiful church building' },
  { src: '/pic2.jpg', alt: 'Sunday service', caption: 'Vibrant Sunday worship' },
  { src: '/pic3.jpg', alt: 'Choir performance', caption: 'Our talented choir performing' },
  { src: '/pic4.jpg', alt: 'Community event', caption: 'Church community gathering' },
  { src: '/pic5.jpg', alt: 'Youth group', caption: 'Active youth ministry' },
];

const choirData = [
  { 
    name: 'Kwaya Ya Vijana', 
    description: 'The youth choir brings energy and contemporary worship styles to our services, engaging young members in musical ministry.',
    image: '/pic6.jpg'
  },
  { 
    name: 'Kwaya Ya Familia na Malezi', 
    description: 'This family-focused choir combines voices from all generations, celebrating family unity through music.',
    image: '/pic7.jpg'
  },
  { 
    name: 'Kwaya Ya Imani', 
    description: 'Known for their powerful renditions of traditional hymns, the Imani choir strengthens our faith through song.',
    image: '/pic2.jpg'
  },
  { 
    name: 'Kwaya Ya Mwimbieni', 
    description: 'Specializing in praise and worship songs, this choir leads the congregation in joyful celebration.',
    image: '/pic8.jpg'
  },
  { 
    name: 'Kwaya Ya Watoto', 
    description: 'Our children\'s choir nurtures young talents and teaches them to worship God through music.',
    image: '/pic1.jpg'
  },
];

const focusGroups = [
  {
    name: 'Baraza la Wazee',
    description: 'The council of elders provides wisdom, guidance, and leadership to our church community.',
    image: '/pic2.jpg'
  },
  {
    name: 'Familia na Malezi',
    description: 'This group supports families in child-rearing, marriage counseling, and building strong Christian homes.',
    image: '/pic2.jpg'
  }
];

const leaders = [
  { name: 'Rev. John Mwambene', role: 'Senior Pastor', image: '/pic2.jpg' },
  { name: 'Rev. Sarah Kileo', role: 'Associate Pastor', image: '/pic2.jpg' },
  { name: 'Deacon Michael Ngowi', role: 'Head Deacon', image: '/pic2.jpg' },
  { name: 'Elder Grace Mbowe', role: 'Women\'s Ministry Leader', image: '/pic2.jpg' },
];

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-advance slideshow
  useEffect(() => {
    let interval: ReturnType<typeof setTimeout>;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % churchImages.length);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, churchImages.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  return (
    <div className="font-sans bg-[#E8FFD7] text-[#2D3748]">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Slideshow */}
        <div className="absolute inset-0 z-0">
          {churchImages.map((img, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: index === currentSlide ? 1 : 0,
                scale: index === currentSlide ? 1 : 1.05
              }}
              transition={{ duration: 1 }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${img.src})` }}
            />
          ))}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 text-center px-4 text-[#E8FFD7]"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Welcome to KKKT Usharika wa Mkimbizi
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            A vibrant Lutheran community in Iringa, Tanzania, dedicated to worship, fellowship, and service.
          </p>
          <motion.a
            href="#services"
            className="inline-block bg-[#5E936C] hover:bg-[#93DA97] text-white px-8 py-3 rounded-full font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore Our Services
          </motion.a>
        </motion.div>

        {/* Slideshow Indicators */}
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center space-x-2">
          {churchImages.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-[#E8FFD7] w-6' : 'bg-[#E8FFD7]/50'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-[#93DA97] text-[#2D3748]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">About Our Church</h2>
            <div className="w-24 h-1 bg-[#5E936C] mx-auto mb-6"></div>
            <p className="max-w-4xl mx-auto text-lg">
              KKKT Usharika wa Mkimbizi is a thriving Lutheran church located in Iringa Municipal District, Tanzania. 
              With a congregation of approximately 600 members, we are committed to spreading the Gospel, fostering 
              Christian fellowship, and serving our community with love and compassion.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <FaChurch className="text-4xl" />, 
                title: "Our Mission", 
                content: "To make disciples of all nations, baptizing them in the name of the Father, the Son, and the Holy Spirit." 
              },
              { 
                icon: <GiCrossedChains className="text-4xl" />, 
                title: "Our Vision", 
                content: "A transformed community living in obedience to God's Word and manifesting His love to the world." 
              },
              { 
                icon: <FaUsers className="text-4xl" />, 
                title: "Our Values", 
                content: "Faith, Love, Unity, Service, and Integrity guide everything we do as a church family." 
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#E8FFD7] p-8 rounded-lg shadow-lg text-center"
                whileHover={{ y: -10 }}
              >
                <div className="text-[#5E936C] mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p>{item.content}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-[#E8FFD7]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#5E936C]">Our Services & Masses</h2>
            <div className="w-24 h-1 bg-[#93DA97] mx-auto mb-6"></div>
            <p className="max-w-4xl mx-auto text-lg">
              Join us for worship, fellowship, and spiritual growth through our various services and activities.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sunday Masses */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#5E936C]"
            >
              <div className="flex items-center mb-4">
                <FaChurch className="text-2xl text-[#5E936C] mr-3" />
                <h3 className="text-xl font-bold">Sunday Masses</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>First Mass</span>
                  <span className="font-medium">07:00 - 09:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Second Mass</span>
                  <span className="font-medium">09:30 - 12:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Sunday School</span>
                  <span className="font-medium">During Masses</span>
                </li>
                <li className="flex justify-between">
                  <span>Fellowship</span>
                  <span className="font-medium">14:00 - 16:00</span>
                </li>
              </ul>
            </motion.div>

            {/* Daily Masses */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#93DA97]"
            >
              <div className="flex items-center mb-4">
                <FaCalendarAlt className="text-2xl text-[#93DA97] mr-3" />
                <h3 className="text-xl font-bold">Daily Masses</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>Morning Glory</span>
                  <span className="font-medium">05:00 - 06:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Evening Glory</span>
                  <span className="font-medium">17:00 - 18:00</span>
                </li>
              </ul>
            </motion.div>

            {/* Weekly Fellowships */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#5E936C]"
            >
              <div className="flex items-center mb-4">
                <FaPray className="text-2xl text-[#5E936C] mr-3" />
                <h3 className="text-xl font-bold">Weekly Fellowships</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>Bible Study</span>
                  <span className="font-medium">Thu 16:00 - 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Prayer Meeting</span>
                  <span className="font-medium">Tue 16:00 - 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>Familia na Malezi</span>
                  <span className="font-medium">Wed 16:00 - 18:00</span>
                </li>
                <li className="flex justify-between">
                  <span>SELI Masses</span>
                  <span className="font-medium">Sat (Various)</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Choirs Section */}
      <section id="choirs" className="py-20 bg-[#93DA97]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Choirs</h2>
            <div className="w-24 h-1 bg-[#5E936C] mx-auto mb-6"></div>
            <p className="max-w-4xl mx-auto text-lg">
              Our choirs bring vibrant worship and musical excellence to our church services and community events.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {choirData.map((choir, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-[#E8FFD7] rounded-lg overflow-hidden shadow-lg"
                whileHover={{ scale: 1.02 }}
              >
                <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${choir.image})` }}></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#5E936C]">{choir.name}</h3>
                  <p className="mb-4">{choir.description}</p>
                  <a href="#" className="text-[#5E936C] font-medium flex items-center">
                    Learn more <FaArrowRight className="ml-2" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Focus Groups Section */}
      <section id="focus-groups" className="py-20 bg-[#E8FFD7]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#5E936C]">Focus Groups</h2>
            <div className="w-24 h-1 bg-[#93DA97] mx-auto mb-6"></div>
            <p className="max-w-4xl mx-auto text-lg">
              Our focus groups provide specialized ministries to meet the diverse needs of our congregation.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {focusGroups.map((group, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-lg overflow-hidden shadow-lg flex flex-col md:flex-row"
              >
                <div className="md:w-1/3 h-48 md:h-auto bg-cover bg-center" style={{ backgroundImage: `url(${group.image})` }}></div>
                <div className="md:w-2/3 p-6">
                  <h3 className="text-xl font-bold mb-2 text-[#5E936C]">{group.name}</h3>
                  <p className="mb-4">{group.description}</p>
                  <a href="#" className="text-[#5E936C] font-medium flex items-center">
                    Join this group <FaArrowRight className="ml-2" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leaders Section */}
      <section id="leaders" className="py-20 bg-[#93DA97]">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Leaders</h2>
            <div className="w-24 h-1 bg-[#5E936C] mx-auto mb-6"></div>
            <p className="max-w-4xl mx-auto text-lg">
              Meet the dedicated leaders who shepherd our church community with wisdom and love.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {leaders.map((leader, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
                whileHover={{ y: -10 }}
              >
                <div className="w-40 h-40 mx-auto mb-4 rounded-full overflow-hidden border-4 border-[#5E936C]">
                  <img src={leader.image} alt={leader.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl font-bold">{leader.name}</h3>
                <p className="text-[#5E936C] font-medium">{leader.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-[#5E936C] text-[#E8FFD7]">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Us This Sunday</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              Experience the love of Christ in our vibrant worship services and welcoming community.
            </p>
            <motion.a
              href="#contact"
              className="inline-block bg-[#E8FFD7] text-[#5E936C] px-8 py-3 rounded-full font-medium hover:bg-white transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Directions
            </motion.a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;