import React, { useState } from 'react';
import { FaChurch, FaUsers, FaCalendarAlt, FaChartLine, FaBell, FaEnvelope, FaPrayingHands, FaMoneyBillWave, FaUserFriends } from 'react-icons/fa';
import { GiCrossedChains } from 'react-icons/gi';
import { MdOutlineDashboard } from 'react-icons/md';
import { BsGraphUp, BsPeopleFill } from 'react-icons/bs';
import { motion } from 'framer-motion';
import CombinedNav from '../../components/CombinedNav'; 

// Sample data - replace with real data from your API
const recentMembers = [
  { id: 1, name: 'John Mwambene', street: 'Bondeni', date: '2023-10-15' },
  { id: 2, name: 'Sarah Kileo', street: 'Paradiso', date: '2023-10-14' },
  { id: 3, name: 'Michael Ngowi', street: 'Hazina', date: '2023-10-12' },
  { id: 4, name: 'Grace Mbowe', street: 'Bwawani', date: '2023-10-10' },
];

const upcomingEvents = [
  { id: 1, title: 'Sunday Service', date: '2023-10-22', time: '07:00 AM' },
  { id: 2, title: 'Bible Study', date: '2023-10-19', time: '04:00 PM' },
  { id: 3, title: 'Youth Fellowship', date: '2023-10-21', time: '02:00 PM' },
];

const offeringStats = {
  thisWeek: 1250000,
  lastWeek: 980000,
  thisMonth: 4500000,
  lastMonth: 4100000,
  trend: 'up' // or 'down'
};

const prayerRequests = [
  { id: 1, member: 'Anna Juma', request: 'Pray for healing from malaria', date: '2023-10-14' },
  { id: 2, member: 'Elias Mfinanga', request: 'Job interview next week', date: '2023-10-13' },
];

const PastorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Format currency (Tanzanian Shillings)
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Calculate percentage change
  const calculateChange = (current, previous) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="flex h-screen bg-[#E8FFD7] overflow-hidden">
      {/* Combined Navigation - Extended with Dashboard Items */}
      <CombinedNav 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        dashboardItems={[
          {
            title: 'Dashboard',
            icon: <MdOutlineDashboard />,
            onClick: () => setActiveTab('overview'),
            active: activeTab === 'overview'
          },
          {
            title: 'Members',
            icon: <FaUsers />,
            onClick: () => setActiveTab('members'),
            active: activeTab === 'members'
          },
          {
            title: 'Offerings',
            icon: <FaMoneyBillWave />,
            onClick: () => setActiveTab('offerings'),
            active: activeTab === 'offerings'
          },
          {
            title: 'Events',
            icon: <FaCalendarAlt />,
            onClick: () => setActiveTab('events'),
            active: activeTab === 'events'
          },
          {
            title: 'Prayer Requests',
            icon: <FaPrayingHands />,
            onClick: () => setActiveTab('prayers'),
            active: activeTab === 'prayers'
          },
          {
            title: 'Ministries',
            icon: <GiCrossedChains />,
            onClick: () => setActiveTab('ministries'),
            active: activeTab === 'ministries'
          },
          {
            title: 'Reports',
            icon: <FaChartLine />,
            onClick: () => setActiveTab('reports'),
            active: activeTab === 'reports'
          }
        ]}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden  mt-14">

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7FCF5]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-[#5E936C]">Church Overview</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Total Members</p>
                      <h3 className="text-3xl font-bold text-[#5E936C]">624</h3>
                    </div>
                    <div className="bg-[#E8FFD7] p-3 rounded-full">
                      <FaUsers className="text-2xl text-[#5E936C]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-green-500">
                    <BsGraphUp className="mr-1" />
                    <span>12 new this month</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">This Week's Offerings</p>
                      <h3 className="text-3xl font-bold text-[#5E936C]">{formatCurrency(offeringStats.thisWeek)}</h3>
                    </div>
                    <div className="bg-[#E8FFD7] p-3 rounded-full">
                      <FaMoneyBillWave className="text-2xl text-[#5E936C]" />
                    </div>
                  </div>
                  <div className={`mt-4 flex items-center text-sm ${offeringStats.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {offeringStats.trend === 'up' ? (
                      <>
                        <BsGraphUp className="mr-1" />
                        <span>{calculateChange(offeringStats.thisWeek, offeringStats.lastWeek)}% from last week</span>
                      </>
                    ) : (
                      <>
                        <BsGraphUp className="mr-1 transform rotate-180" />
                        <span>{calculateChange(offeringStats.thisWeek, offeringStats.lastWeek)}% from last week</span>
                      </>
                    )}
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Active Groups</p>
                      <h3 className="text-3xl font-bold text-[#5E936C]">8</h3>
                    </div>
                    <div className="bg-[#E8FFD7] p-3 rounded-full">
                      <GiCrossedChains className="text-2xl text-[#5E936C]" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">Youth</span>
                      <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">Women</span>
                      <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">Elders</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Prayer Requests</p>
                      <h3 className="text-3xl font-bold text-[#5E936C]">5</h3>
                    </div>
                    <div className="bg-[#E8FFD7] p-3 rounded-full">
                      <FaPrayingHands className="text-2xl text-[#5E936C]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-blue-500">
                    <span>2 new today</span>
                  </div>
                </motion.div>
              </div>
              
              {/* Recent Activity Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Members */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-[#5E936C] text-white px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Recent Members</h3>
                    <a href="#" className="text-sm hover:underline">View All</a>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {recentMembers.map((member) => (
                      <div key={member.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="bg-[#E8FFD7] text-[#5E936C] h-10 w-10 rounded-full flex items-center justify-center font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium text-gray-900">{member.name}</h4>
                            <p className="text-sm text-gray-500">{member.street} • Joined {member.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-[#5E936C] text-white px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">Upcoming Events</h3>
                    <a href="#" className="text-sm hover:underline">View All</a>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="bg-[#E8FFD7] text-[#5E936C] h-10 w-10 rounded-full flex items-center justify-center">
                            <FaCalendarAlt />
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-medium text-[#5E936C] mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center"
                  >
                    <FaCalendarAlt className="text-2xl mb-2" />
                    <span>Add Sermon</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center"
                  >
                    <FaCalendarAlt className="text-2xl mb-2" />
                    <span>Create Event</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center"
                  >
                    <FaUsers className="text-2xl mb-2" />
                    <span>Add Member</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center"
                  >
                    <FaChartLine className="text-2xl mb-2" />
                    <span>Generate Report</span>
                  </motion.button>
                </div>
              </div>
            </div>
          )}
          
          {/* Members Tab */}
          {activeTab === 'members' && (
            <div>
              <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Members Management</h2>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p>Members content goes here...</p>
              </div>
            </div>
          )}
          
          {/* Offerings Tab */}
          {activeTab === 'offerings' && (
            <div>
              <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Offerings Management</h2>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p>Offerings content goes here...</p>
              </div>
            </div>
          )}
          
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div>
              <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Events Calendar</h2>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p>Events content goes here...</p>
              </div>
            </div>
          )}
          
          {/* Prayer Requests Tab */}
          {activeTab === 'prayers' && (
            <div>
              <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Prayer Requests</h2>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-[#5E936C] text-white px-6 py-4">
                  <h3 className="text-lg font-medium">Recent Prayer Requests</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {prayerRequests.map((request) => (
                    <div key={request.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-start">
                        <div className="bg-[#E8FFD7] text-[#5E936C] h-10 w-10 rounded-full flex items-center justify-center mt-1">
                          <FaPrayingHands />
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <h4 className="font-medium text-gray-900">{request.member}</h4>
                            <span className="text-sm text-gray-500">{request.date}</span>
                          </div>
                          <p className="mt-1 text-gray-600">{request.request}</p>
                          <div className="mt-3 flex space-x-3">
                            <button className="text-sm text-[#5E936C] hover:underline">Mark as Prayed</button>
                            <button className="text-sm text-[#5E936C] hover:underline">Follow Up</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Ministries Tab */}
          {activeTab === 'ministries' && (
            <div>
              <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Ministries</h2>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p>Ministries content goes here...</p>
              </div>
            </div>
          )}
          
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Reports & Analytics</h2>
              <div className="bg-white rounded-xl shadow-md p-6">
                <p>Reports content goes here...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PastorDashboard;