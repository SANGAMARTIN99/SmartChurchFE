import React, { useState } from 'react';
import { 
  FaUsers, FaUserPlus,FaClock, FaMapMarkerAlt, FaSearch,  FaEdit, FaTrash, 
  FaEye, FaCalendarAlt, FaMusic, FaPray, FaUserFriends, 
   FaChild, FaPlus, FaBell,
} from 'react-icons/fa';
import { MdGroupWork } from 'react-icons/md';
import { BsGraphUp} from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { GET_STREETS_AND_GROUPS } from '../../api/queries';

// Types
interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  leader: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  meetingDays: string[];
  meetingTime: string;
  location: string;
  memberCount: number;
  createdAt: string;
  isActive: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  street: string;
  attendance: number;
  lastAttended: string;
}

const GroupsManagement = () => {
  const [activeView, setActiveView] = useState<'overview' | 'details' | 'create' | 'members'>('overview');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data, loading, error } = useQuery(GET_STREETS_AND_GROUPS, { fetchPolicy: 'network-only' });

  // Sample data - replace with real data from your API
  let groups: Group[] = [
    {
      id: '1',
      name: 'Kwaya Ya Vijana',
      description: 'Youth choir for all young members aged 15-30. Focus on contemporary worship music and spiritual growth through music ministry.',
      category: 'choir',
      leader: {
        id: '101',
        name: 'John Mwambene',
        email: 'john@church.org',
        phone: '+255 123 456 789'
      },
      meetingDays: ['Tuesday', 'Friday'],
      meetingTime: '17:00',
      location: 'Church Main Hall',
      memberCount: 35,
      createdAt: '2023-01-15',
      isActive: true
    },
    {
      id: '2',
      name: 'Kwaya Ya Familia na Malezi',
      description: 'Family-focused choir that combines voices from all generations, celebrating family unity through music and worship.',
      category: 'choir',
      leader: {
        id: '102',
        name: 'Sarah Kileo',
        email: 'sarah@church.org',
        phone: '+255 987 654 321'
      },
      meetingDays: ['Wednesday'],
      meetingTime: '16:00',
      location: 'Parish Hall',
      memberCount: 28,
      createdAt: '2023-02-20',
      isActive: true
    },
    {
      id: '3',
      name: 'Baraza la Wazee',
      description: 'Council of elders providing wisdom, guidance, and leadership to our church community.',
      category: 'focus-group',
      leader: {
        id: '103',
        name: 'Michael Ngowi',
        email: 'michael@church.org',
        phone: '+255 789 123 456'
      },
      meetingDays: ['Monday'],
      meetingTime: '14:00',
      location: 'Elders Room',
      memberCount: 12,
      createdAt: '2022-11-10',
      isActive: true
    },
    {
      id: '4',
      name: 'Familia na Malezi',
      description: 'This group supports families in child-rearing, marriage counseling, and building strong Christian homes.',
      category: 'focus-group',
      leader: {
        id: '104',
        name: 'Grace Mbowe',
        email: 'grace@church.org',
        phone: '+255 654 321 987'
      },
      meetingDays: ['Thursday'],
      meetingTime: '15:00',
      location: 'Family Center',
      memberCount: 22,
      createdAt: '2023-03-05',
      isActive: true
    },
    {
      id: '5',
      name: 'Kwaya Ya Watoto',
      description: 'Children\'s choir that nurtures young talents and teaches them to worship God through music.',
      category: 'choir',
      leader: {
        id: '105',
        name: 'Anna Juma',
        email: 'anna@church.org',
        phone: '+255 321 789 654'
      },
      meetingDays: ['Saturday'],
      meetingTime: '10:00',
      location: 'Sunday School Hall',
      memberCount: 18,
      createdAt: '2023-04-12',
      isActive: true
    }
  ];

  const categories = [
    { id: 'all', name: 'All Groups', icon: <FaUsers />, color: '#5E936C' },
    { id: 'choir', name: 'Choirs', icon: <FaMusic />, color: '#93DA97' },
    { id: 'focus-group', name: 'Focus Groups', icon: <FaUserFriends />, color: '#4A8C5F' },
    { id: 'youth', name: 'Youth Groups', icon: <FaChild />, color: '#3A7A4F' },
    { id: 'prayer', name: 'Prayer Groups', icon: <FaPray />, color: '#6B7280' }
  ];

  const members: Member[] = [
    {
      id: '201',
      name: 'Elias Mfinanga',
      email: 'elias@example.com',
      phone: '+255 765 432 109',
      joinDate: '2023-05-10',
      street: 'Bondeni',
      attendance: 85,
      lastAttended: '2023-10-20'
    },
    {
      id: '202',
      name: 'Rehema Juma',
      email: 'rehema@example.com',
      phone: '+255 712 345 678',
      joinDate: '2023-06-15',
      street: 'Paradiso',
      attendance: 92,
      lastAttended: '2023-10-22'
    },
    {
      id: '203',
      name: 'Baraka Ally',
      email: 'baraka@example.com',
      phone: '+255 789 012 345',
      joinDate: '2023-04-22',
      street: 'Hazina',
      attendance: 78,
      lastAttended: '2023-10-18'
    }
  ];

  // Override with backend data if available
  if (data?.groups) {
    groups = (data.groups as any[]).map((g: any) => ({
      id: g.id,
      name: g.name ?? '',
      description: '',
      category: 'all',
      leader: { id: '', name: '', email: '', phone: '' },
      meetingDays: [],
      meetingTime: '',
      location: '',
      memberCount: 0,
      createdAt: new Date().toISOString(),
      isActive: true,
    }));
  }

  // Loading and error states
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8FFD7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E936C]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#E8FFD7] flex items-center justify-center text-red-600">
        Failed to load groups.
      </div>
    );
  }

  // Filter groups based on search and category
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || group.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group);
    setActiveView('details');
  };

  const handleViewMembers = (group: Group) => {
    setSelectedGroup(group);
    setActiveView('members');
  };

  const handleCreateGroup = () => {
    setSelectedGroup(null);
    setActiveView('create');
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    setActiveView('create');
  };

  const handleDeleteGroup = (id: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      // Delete logic would go here
      console.log('Delete group:', id);
      alert('Group deleted successfully!');
    }
  };

  // // Toggle sidebar on mobile
  // const toggleSidebar = () => {
  //   setSidebarOpen(!sidebarOpen);
  // };

  return (
    <div className="flex h-screen bg-[#E8FFD7] overflow-hidden">
      {/* Combined Navigation - Extended with Dashboard Items */}
      

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7FCF5]">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#5E936C]">Church Groups</h2>
                    <p className="text-gray-600">Manage all church groups and their activities</p>
                  </div>
                  <button
                    onClick={handleCreateGroup}
                    className="bg-[#5E936C] text-white px-4 py-2 rounded-lg flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    New Group
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Total Groups</p>
                        <h3 className="text-3xl font-bold text-[#5E936C]">{groups.length}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <MdGroupWork className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <BsGraphUp className="mr-1" />
                      <span>2 new this month</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Total Members</p>
                        <h3 className="text-3xl font-bold text-[#5E936C]">
                          {groups.reduce((total, group) => total + group.memberCount, 0)}
                        </h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaUsers className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <BsGraphUp className="mr-1" />
                      <span>15 new this month</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Active Choirs</p>
                        <h3 className="text-3xl font-bold text-[#5E936C]">
                          {groups.filter(g => g.category === 'choir').length}
                        </h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaMusic className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex space-x-2">
                        <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">Youth</span>
                        <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">Children</span>
                        <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">Family</span>
                      </div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Focus Groups</p>
                        <h3 className="text-3xl font-bold text-[#5E936C]">
                          {groups.filter(g => g.category === 'focus-group').length}
                        </h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaUserFriends className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-500">
                      <span>Elders, Family, Prayer</span>
                    </div>
                  </motion.div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search groups..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-3 py-2 rounded-lg flex items-center ${selectedCategory === category.id ? 'text-white' : 'text-gray-700'}`}
                          style={{ backgroundColor: selectedCategory === category.id ? category.color : '#E8FFD7' }}
                        >
                          <span className="mr-2">{category.icon}</span>
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Groups List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredGroups.map(group => {
                    const category = categories.find(c => c.id === group.category) || categories[0];
                    return (
                      <motion.div
                        key={group.id}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-xl shadow-md overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center">
                              <div className="p-2 rounded-full mr-3" style={{ backgroundColor: category.color + '20' }}>
                                {React.cloneElement(category.icon, { style: { color: category.color } })}
                              </div>
                              <span className="font-medium" style={{ color: category.color }}>
                                {category.name}
                              </span>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewDetails(group)}
                                className="p-1 text-gray-400 hover:text-[#5E936C]"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleEditGroup(group)}
                                className="p-1 text-gray-400 hover:text-[#5E936C]"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="p-1 text-gray-400 hover:text-red-500"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-gray-800 mb-2">{group.name}</h3>
                          <p className="text-gray-600 mb-4">{group.description}</p>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500">Leader</p>
                              <p className="font-medium">{group.leader.name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Members</p>
                              <p className="font-medium">{group.memberCount} people</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500">Meeting Schedule</p>
                              <p className="font-medium">
                                {group.meetingDays.join(', ')} at {group.meetingTime}
                              </p>
                            </div>
                            <button
                              onClick={() => handleViewMembers(group)}
                              className="bg-[#E8FFD7] text-[#5E936C] px-3 py-1 rounded-lg text-sm hover:bg-[#d4f5c1]"
                            >
                              View Members
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeView === 'details' && selectedGroup && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-[#5E936C]">Group Details</h2>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Back to Groups
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-2/3">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedGroup.name}</h3>
                        <p className="text-gray-600">{selectedGroup.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-700 mb-3">Meeting Information</h4>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-[#5E936C] mr-3" />
                              <span>{selectedGroup.meetingDays.join(', ')}</span>
                            </div>
                            <div className="flex items-center">
                              <FaClock className="text-[#5E936C] mr-3" />
                              <span>{selectedGroup.meetingTime}</span>
                            </div>
                            <div className="flex items-center">
                              <FaMapMarkerAlt className="text-[#5E936C] mr-3" />
                              <span>{selectedGroup.location}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-700 mb-3">Group Leader</h4>
                          <div className="space-y-2">
                            <p className="font-medium">{selectedGroup.leader.name}</p>
                            <p className="text-gray-600">{selectedGroup.leader.email}</p>
                            <p className="text-gray-600">{selectedGroup.leader.phone}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <h4 className="font-semibold text-gray-700 mb-3">Group Statistics</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Total Members</p>
                            <p className="text-2xl font-bold text-[#5E936C]">{selectedGroup.memberCount}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Active Since</p>
                            <p className="text-lg font-medium">{new Date(selectedGroup.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Average Attendance</p>
                            <p className="text-lg font-medium">85%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">New Members (30 days)</p>
                            <p className="text-lg font-medium">5</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="lg:w-1/3">
                      <div className="bg-[#E8FFD7] p-4 rounded-lg mb-6">
                        <h4 className="font-semibold text-[#5E936C] mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          <button className="w-full bg-white text-[#5E936C] px-4 py-2 rounded-lg text-left flex items-center">
                            <FaUserPlus className="mr-2" />
                            Add Members
                          </button>
                          <button className="w-full bg-white text-[#5E936C] px-4 py-2 rounded-lg text-left flex items-center">
                            <FaBell className="mr-2" />
                            Send Announcement
                          </button>
                          <button className="w-full bg-white text-[#5E936C] px-4 py-2 rounded-lg text-left flex items-center">
                            <FaCalendarAlt className="mr-2" />
                            Schedule Event
                          </button>
                          <button 
                            onClick={() => handleViewMembers(selectedGroup)}
                            className="w-full bg-[#5E936C] text-white px-4 py-2 rounded-lg text-left flex items-center"
                          >
                            <FaUsers className="mr-2" />
                            View All Members
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-3">Recent Activity</h4>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className="bg-green-100 p-2 rounded-full mr-3 mt-1">
                              <FaUserPlus className="text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">2 new members joined</p>
                              <p className="text-sm text-gray-500">Yesterday at 4:30 PM</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                              <FaBell className="text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Announcement sent</p>
                              <p className="text-sm text-gray-500">2 days ago</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                              <FaCalendarAlt className="text-purple-600" />
                            </div>
                            <div>
                              <p className="font-medium">Practice cancelled</p>
                              <p className="text-sm text-gray-500">Last Friday</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'members' && selectedGroup && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[#5E936C]">{selectedGroup.name} - Members</h2>
                    <p className="text-gray-600">{selectedGroup.memberCount} members</p>
                  </div>
                  <button
                    onClick={() => setActiveView('details')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Back to Group
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search members..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent">
                        <option>All Streets</option>
                        <option>Bondeni</option>
                        <option>Paradiso</option>
                        <option>Hazina</option>
                        <option>Bwawani</option>
                        <option>Zahanati</option>
                      </select>
                      <button className="bg-[#5E936C] text-white px-4 py-2 rounded-lg flex items-center">
                        <FaUserPlus className="mr-2" />
                        Add Member
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Street</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {members.map(member => (
                          <tr key={member.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-[#E8FFD7] flex items-center justify-center text-[#5E936C] font-bold mr-3">
                                  {member.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{member.name}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900">{member.email}</div>
                              <div className="text-gray-500">{member.phone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">
                                {member.street}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                              {new Date(member.joinDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${member.attendance}%` }}
                                  ></div>
                                </div>
                                <span>{member.attendance}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button className="text-[#5E936C] hover:text-[#4a7a58] mr-3">
                                <FaEdit />
                              </button>
                              <button className="text-red-500 hover:text-red-700">
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h2 className="text-xl font-bold text-[#5E936C] mb-6">
                  {selectedGroup ? 'Edit Group' : 'Create New Group'}
                </h2>
                
                <form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-2">Group Name</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        placeholder="e.g., Kwaya Ya Vijana"
                        defaultValue={selectedGroup?.name || ''}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Category</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent">
                        <option value="choir">Choir</option>
                        <option value="focus-group">Focus Group</option>
                        <option value="youth">Youth Group</option>
                        <option value="prayer">Prayer Group</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-gray-700 mb-2">Description</label>
                    <textarea
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      placeholder="Describe the purpose and activities of this group..."
                      defaultValue={selectedGroup?.description || ''}
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-2">Group Leader</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent">
                        <option value="">Select a leader</option>
                        <option value="101" selected={selectedGroup?.leader.id === '101'}>John Mwambene</option>
                        <option value="102" selected={selectedGroup?.leader.id === '102'}>Sarah Kileo</option>
                        <option value="103" selected={selectedGroup?.leader.id === '103'}>Michael Ngowi</option>
                        <option value="104" selected={selectedGroup?.leader.id === '104'}>Grace Mbowe</option>
                        <option value="105" selected={selectedGroup?.leader.id === '105'}>Anna Juma</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Meeting Location</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        placeholder="e.g., Main Hall, Room 101"
                        defaultValue={selectedGroup?.location || ''}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-gray-700 mb-2">Meeting Days</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                          <label key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-[#5E936C] focus:ring-[#5E936C] border-gray-300 rounded"
                              defaultChecked={selectedGroup?.meetingDays.includes(day) || false}
                            />
                            <span className="ml-2 text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 mb-2">Meeting Time</label>
                      <input
                        type="time"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        defaultValue={selectedGroup?.meetingTime || ''}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      className="h-4 w-4 text-[#5E936C] focus:ring-[#5E936C] border-gray-300 rounded"
                      defaultChecked={selectedGroup?.isActive ?? true}
                    />
                    <label htmlFor="isActive" className="ml-2 block text-gray-700">
                      This group is currently active
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setActiveView('overview')}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-[#5E936C] text-white px-6 py-3 rounded-lg hover:bg-[#4a7a58]"
                    >
                      {selectedGroup ? 'Update Group' : 'Create Group'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default GroupsManagement;