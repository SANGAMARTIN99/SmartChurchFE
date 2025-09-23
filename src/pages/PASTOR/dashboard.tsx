import React, { useState, useEffect } from 'react';
import { 
  FaChurch, FaUsers, FaCalendarAlt, FaChartLine, FaBook, FaBell, FaEnvelope, 
  FaPrayingHands, FaMoneyBillWave, FaUserFriends, 
  FaPlus, FaSearch, FaFilter, FaDownload, FaEye, FaEdit, FaTrash
} from 'react-icons/fa';
import { GiCrossedChains } from 'react-icons/gi';
import { MdOutlineDashboard, MdOutlineNotificationsActive } from 'react-icons/md';
import { BsGraphUp, BsPeopleFill, BsThreeDotsVertical } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@apollo/client';
import CombinedNav from '../../components/CombinedNav';
import { 
  GET_DASHBOARD_STATS,
  GET_RECENT_MEMBERS,
  GET_UPCOMING_EVENTS,
  GET_PRAYER_REQUESTS,
  GET_OFFERING_STATS 
} from '../../api/queries';
import {
  CREATE_PRAYER_REQUEST,
  UPDATE_PRAYER_REQUEST_STATUS,
  CREATE_EVENT,
  DELETE_EVENT
} from '../../api/mutations';

// Types
interface DashboardStats {
  totalMembers: number;
  activeGroups: number;
  prayerRequests: number;
  totalOfferings: number;
  weeklyOfferings: number;
  monthlyOfferings: number;
  newMembersThisMonth: number;
  newPrayerRequestsToday: number;
}

interface Member {
  id: string;
  fullName: string;
  street: string;
  joinedDate: string;
  profileImage?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

interface PrayerRequest {
  id: string;
  member: string;
  request: string;
  date: string;
  status: string;
}

interface OfferingStats {
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
  lastMonth: number;
  trend: string;
}

const PastorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showPrayerModal, setShowPrayerModal] = useState(false);
  const [selectedPrayerRequest, setSelectedPrayerRequest] = useState<PrayerRequest | null>(null);

  // GraphQL Queries
  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS);
  const { data: membersData, loading: membersLoading } = useQuery(GET_RECENT_MEMBERS);
  const { data: eventsData, loading: eventsLoading } = useQuery(GET_UPCOMING_EVENTS);
  const { data: prayersData, loading: prayersLoading } = useQuery(GET_PRAYER_REQUESTS);
  const { data: offeringsData, loading: offeringsLoading } = useQuery(GET_OFFERING_STATS);

  // GraphQL Mutations
  const [createPrayerRequest] = useMutation(CREATE_PRAYER_REQUEST, {
    refetchQueries: [{ query: GET_PRAYER_REQUESTS }],
  });
  
  const [updatePrayerRequestStatus] = useMutation(UPDATE_PRAYER_REQUEST_STATUS, {
    refetchQueries: [{ query: GET_PRAYER_REQUESTS }],
  });
  
  const [createEvent] = useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_UPCOMING_EVENTS }],
  });
  
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_UPCOMING_EVENTS }],
  });

  // Process data from queries
  const dashboardStats: DashboardStats = statsData?.dashboardStats || {
    totalMembers: 0,
    activeGroups: 0,
    prayerRequests: 0,
    totalOfferings: 0,
    weeklyOfferings: 0,
    monthlyOfferings: 0,
    newMembersThisMonth: 0,
    newPrayerRequestsToday: 0
  };

  const recentMembers: Member[] = membersData?.recentMembers || [];
  const upcomingEvents: Event[] = eventsData?.upcomingEvents || [];
  const prayerRequests: PrayerRequest[] = prayersData?.prayerRequests || [];
  const offeringStats: OfferingStats = offeringsData?.offeringStats || {
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    trend: 'up'
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Format currency (Tanzanian Shillings)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Calculate percentage change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Handle prayer request status update
  const handlePrayerStatusUpdate = (id: string, status: string) => {
    updatePrayerRequestStatus({
      variables: { id, status }
    });
  };

  // Handle event creation
  const handleEventCreate = (eventData: any) => {
    createEvent({
      variables: eventData
    });
    setShowEventModal(false);
  };

  // Handle event deletion
  const handleEventDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      deleteEvent({
        variables: { id }
      });
    }
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
      <div className="flex-1 flex flex-col overflow-hidden mt-16">
        

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7FCF5]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[#5E936C]">Church Overview</h2>
                <div className="flex space-x-2">
                  <button className="bg-[#5E936C] text-white px-4 py-2 rounded-lg flex items-center">
                    <FaDownload className="mr-2" />
                    Export Report
                  </button>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#5E936C] opacity-10 rounded-full -m-4"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Total Members</p>
                      <h3 className="text-3xl font-bold text-[#5E936C]">{dashboardStats.totalMembers}</h3>
                    </div>
                    <div className="bg-[#E8FFD7] p-3 rounded-full">
                      <FaUsers className="text-2xl text-[#5E936C]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-green-500">
                    <BsGraphUp className="mr-1" />
                    <span>{dashboardStats.newMembersThisMonth} new this month</span>
                  </div>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#93DA97] opacity-10 rounded-full -m-4"></div>
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
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#5E936C] opacity-10 rounded-full -m-4"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Active Groups</p>
                      <h3 className="text-3xl font-bold text-[#5E936C]">{dashboardStats.activeGroups}</h3>
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
                  className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#93DA97] opacity-10 rounded-full -m-4"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500">Prayer Requests</p>
                      <h3 className="text-3xl font-bold text-[#5E936C]">{dashboardStats.prayerRequests}</h3>
                    </div>
                    <div className="bg-[#E8FFD7] p-3 rounded-full">
                      <FaPrayingHands className="text-2xl text-[#5E936C]" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-blue-500">
                    <span>{dashboardStats.newPrayerRequestsToday} new today</span>
                  </div>
                </motion.div>
              </div>
              
              {/* Charts and Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-medium text-[#5E936C] mb-4">Offerings Trend</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Offerings chart will be displayed here</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-medium text-[#5E936C] mb-4">Membership Growth</h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Membership growth chart will be displayed here</p>
                  </div>
                </div>
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
                            {member.fullName.charAt(0)}
                          </div>
                          <div className="ml-4">
                            <h4 className="font-medium text-gray-900">{member.fullName}</h4>
                            <p className="text-sm text-gray-500">{member.street} • Joined {member.joinedDate}</p>
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
                    <button 
                      onClick={() => setShowEventModal(true)}
                      className="text-sm bg-white text-[#5E936C] px-3 py-1 rounded-md hover:bg-gray-100"
                    >
                      <FaPlus className="inline mr-1" /> Add Event
                    </button>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-[#E8FFD7] text-[#5E936C] h-10 w-10 rounded-full flex items-center justify-center">
                              <FaCalendarAlt />
                            </div>
                            <div className="ml-4">
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                            </div>
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <BsThreeDotsVertical />
                          </button>
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
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                  >
                    <FaBook className="text-2xl mb-2" />
                    <span>Add Sermon</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEventModal(true)}
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                  >
                    <FaCalendarAlt className="text-2xl mb-2" />
                    <span>Create Event</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                  >
                    <FaUsers className="text-2xl mb-2" />
                    <span>Add Member</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                  >
                    <FaChartLine className="text-2xl mb-2" />
                    <span>Generate Report</span>
                  </motion.button>
                </div>
              </div>
            </div>
          )}
          
          {/* Other tabs would follow the same pattern with real data from backend */}
          
        </main>
      </div>

      {/* Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#5E936C] mb-4">Create New Event</h3>
                <form>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Event Title</label>
                    <input type="text" className="w-full p-2 border rounded-lg" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Date & Time</label>
                    <div className="flex space-x-2">
                      <input type="date" className="flex-1 p-2 border rounded-lg" />
                      <input type="time" className="flex-1 p-2 border rounded-lg" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Description</label>
                    <textarea className="w-full p-2 border rounded-lg" rows={3}></textarea>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setShowEventModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-[#5E936C] text-white px-4 py-2 rounded-lg hover:bg-[#4a7a58]"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PastorDashboard;