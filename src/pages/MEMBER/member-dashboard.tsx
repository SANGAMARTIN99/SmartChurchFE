import React, { useState } from 'react';
import { 
  FaPrayingHands, FaCalendarAlt, FaMoneyBillWave, 
  FaUsers, FaChartLine, FaClock, FaArrowUp
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useQuery } from '@apollo/client';
import { ME_QUERY, GET_RECENT_OFFERINGS, GET_UPCOMING_EVENTS } from '../../api/queries';

// Using backend GraphQL types via simple view models

const MemberDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'offerings' | 'groups' | 'events' | 'prayers'>('overview');
  // Removed unused sidebar/notifications/messages/profile edit states
  const [newPrayerRequestOpen, setNewPrayerRequestOpen] = useState(false);

  // Live data
  const { data: meData, loading: meLoading, error: meError } = useQuery(ME_QUERY);
  const { data: offeringsData } = useQuery(GET_RECENT_OFFERINGS, { variables: { limit: 10 } });
  const { data: eventsData } = useQuery(GET_UPCOMING_EVENTS);

  // Removed sample data (profile, offerings, groups, events, prayer requests)

  // Map live data to view models
  const memberFirstName = meData?.me?.fullName?.split(' ')[0] || (meLoading ? 'Loading' : (meError ? 'Error' : 'Member'));
  const memberStreet = meData?.me?.street?.name || '';
  const myGroups = meData?.me?.groups || [];
  const recentOfferings = (offeringsData?.recentOfferings || []).slice(0, 5).map((o: any) => ({
    id: o.id,
    date: o.date,
    amount: o.amount,
    type: (o.offeringType || '').toLowerCase(),
    massType: o.massType,
    attendant: o.attendant,
  }));
  const upcomingEvents = (eventsData?.upcomingEvents || []).slice(0, 3).map((e: any) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    location: e.location,
    description: e.description,
    rsvpStatus: 'pending' as const,
  }));

  // Stats calculations from live data
  const totalOfferings = recentOfferings.reduce((sum: number, o: any) => sum + (o.amount || 0), 0);
  const averageOffering = recentOfferings.length > 0 ? totalOfferings / recentOfferings.length : 0;
  const pledgeProgress = 0; // No pledge data yet in schema

  // Format currency (Tanzanian Shillings)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  };

  // Removed unused sidebar toggler and RSVP handler

  // Handle prayer request submission
  const handlePrayerRequestSubmit = (request: string, isPublic: boolean) => {
    console.log('New prayer request:', { request, isPublic });
    setNewPrayerRequestOpen(false);
    // Here you would typically submit the prayer request via API
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-gradient-to-br from-[#E8FFD7] to-[#93DA97] overflow-hidden ">
      {/* Sidebar Navigation */}
      

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide p-4 md:p-6">
          {meError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
              Failed to load your profile. Please re-login. Details: {meError.message}
            </div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Welcome Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#5E936C]">
                        Welcome back, {memberFirstName}!
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Here's your overview of church activities and contributions
                      </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                      {memberStreet && (
                        <span className="bg-[#E8FFD7] text-[#5E936C] px-3 py-1 rounded-full text-sm font-medium">
                          {memberStreet} Street
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Total Offerings</p>
                        <h3 className="text-2xl font-bold text-[#5E936C]">{formatCurrency(totalOfferings)}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaMoneyBillWave className="text-xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-green-500">
                      <FaArrowUp className="mr-1" />
                      <span>Consistent giver</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Pledge Progress</p>
                        <h3 className="text-2xl font-bold text-[#5E936C]">{pledgeProgress.toFixed(1)}%</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaChartLine className="text-xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#5E936C] h-2 rounded-full" 
                          style={{ width: `${Math.min(pledgeProgress, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">My Groups</p>
                        <h3 className="text-2xl font-bold text-[#5E936C]">{myGroups.length}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaUsers className="text-xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">Joined groups</div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Upcoming Events</p>
                        <h3 className="text-2xl font-bold text-[#5E936C]">{upcomingEvents.length}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaCalendarAlt className="text-xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">Next 3 upcoming</div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Offerings */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#5E936C]">Recent Offerings</h3>
                      <button 
                        onClick={() => setActiveTab('offerings')}
                        className="text-[#5E936C] hover:text-[#4a7a58] text-sm"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {recentOfferings.map(offering => (
                        <div key={offering.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-800">{formatDate(offering.date)}</p>
                              <p className="text-sm text-gray-600">{offering.massType}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-[#5E936C]">{formatCurrency(offering.amount)}</p>
                              <p className="text-sm text-gray-500 capitalize">{offering.type}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upcoming Events */}
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-[#5E936C]">Upcoming Events</h3>
                      <button 
                        onClick={() => setActiveTab('events')}
                        className="text-[#5E936C] hover:text-[#4a7a58] text-sm"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {upcomingEvents.map(event => (
                        <div key={event.id} className="p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{event.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {formatDate(event.date)} at {event.time}
                              </p>
                              <p className="text-sm text-gray-500">{event.location}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              event.rsvpStatus === 'going' ? 'bg-green-100 text-green-800' :
                              event.rsvpStatus === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {event.rsvpStatus === 'going' ? 'Confirmed' :
                               event.rsvpStatus === 'maybe' ? 'Maybe' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* My Groups */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[#5E936C]">My Groups</h3>
                    <button 
                      onClick={() => setActiveTab('groups')}
                      className="text-[#5E936C] hover:text-[#4a7a58] text-sm"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {myGroups.map((group: any) => (
                      <motion.div
                        key={group.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <h4 className="font-semibold text-gray-800">{group.name}</h4>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-[#5E936C] mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                    >
                      <FaPrayingHands className="text-2xl mb-2" />
                      <span>Daily Devotional</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('events')}
                      className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                    >
                      <FaCalendarAlt className="text-2xl mb-2" />
                      <span>View Events</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setNewPrayerRequestOpen(true)}
                      className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                    >
                      <FaPrayingHands className="text-2xl mb-2" />
                      <span>Prayer Request</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('offerings')}
                      className="bg-[#E8FFD7] hover:bg-[#d4f5c1] text-[#5E936C] p-4 rounded-lg flex flex-col items-center transition-all"
                    >
                      <FaMoneyBillWave className="text-2xl mb-2" />
                      <span>My Offerings</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Other tabs would follow similar structure */}
            {activeTab === 'offerings' && (
              <motion.div
                key="offerings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-[#5E936C] mb-6">My Offerings</h2>
                <p className="text-gray-600">Detailed view of your offering history and patterns.</p>
                {/* Offering details implementation would go here */}
              </motion.div>
            )}

            {activeTab === 'groups' && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-[#5E936C] mb-6">My Groups</h2>
                <p className="text-gray-600">Manage your group memberships and activities.</p>
                {/* Groups details implementation would go here */}
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div
                key="events"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Church Events</h2>
                <p className="text-gray-600">View and RSVP to upcoming church events.</p>
                {/* Events details implementation would go here */}
              </motion.div>
            )}

            {activeTab === 'prayers' && (
              <motion.div
                key="prayers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-2xl font-bold text-[#5E936C] mb-6">Prayer Requests</h2>
                <p className="text-gray-600">Submit and track your prayer requests.</p>
                {/* Prayer requests implementation would go here */}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Prayer Request Modal */}
      <AnimatePresence>
        {newPrayerRequestOpen && (
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
                <h3 className="text-xl font-bold text-[#5E936C] mb-4">Submit Prayer Request</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  handlePrayerRequestSubmit(
                    formData.get('request') as string,
                    formData.get('isPublic') === 'on'
                  );
                }}>
                  <div className="mb-4">
                    <label className="block text-gray-700 mb-2">Your Prayer Request</label>
                    <textarea 
                      name="request"
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      placeholder="Share your prayer request here..."
                      required
                    ></textarea>
                  </div>
                  <div className="flex items-center mb-6">
                    <input
                      type="checkbox"
                      id="isPublic"
                      name="isPublic"
                      className="h-4 w-4 text-[#5E936C] focus:ring-[#5E936C] border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-gray-700">
                      Share with church prayer team
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setNewPrayerRequestOpen(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="bg-[#5E936C] text-white px-4 py-2 rounded-lg hover:bg-[#4a7a58]"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar Overlay removed to prevent scroll blocking */}
    </div>
  );
};

export default MemberDashboard;