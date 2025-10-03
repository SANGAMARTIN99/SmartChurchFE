import React, { useState } from 'react';
import { 
  FaBullhorn, FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaEye, 
  FaSearch, FaFilter, FaClock, FaMapMarkerAlt, FaUsers, FaShare,
  FaBell, FaExclamationCircle, FaInfoCircle, FaNewspaper
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ANNOUNCEMENTS } from '../../api/queries';
import { CREATE_ANNOUNCEMENT, UPDATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../api/mutations';
import CombinedNav from '../../components/CombinedNav'; // Import your CombinedNav component

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  targetGroup: string | null;
  eventDate: string | null;
  eventTime: string | null;
  location: string | null;
  createdBy: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  icon: React.ReactElement;
}

const AnnouncementsPage = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'preview'>('list');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const categories: Category[] = [
    { id: 'events', name: 'Events', color: '#5E936C', icon: <FaCalendarAlt /> },
    { id: 'services', name: 'Service Changes', color: '#93DA97', icon: <FaBell /> },
    { id: 'community', name: 'Community News', color: '#4A8C5F', icon: <FaUsers /> },
    { id: 'urgent', name: 'Urgent Updates', color: '#E53E3E', icon: <FaExclamationCircle /> },
    { id: 'general', name: 'General', color: '#6B7280', icon: <FaInfoCircle /> }
  ];

  const { data, loading, error, refetch } = useQuery(GET_ANNOUNCEMENTS, {
    fetchPolicy: 'network-only',
  });
  const [createAnnouncement] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }],
  });
  const [updateAnnouncement] = useMutation(UPDATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }],
  });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, {
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }],
  });

  // Normalize API shape (objects) to UI shape (strings) for createdBy/targetGroup
  const announcements: Announcement[] = (data?.announcements || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    category: a.category,
    isPinned: a.isPinned,
    targetGroup: a.targetGroup?.name ?? null,
    eventDate: a.eventDate ?? null,
    eventTime: a.eventTime ?? null,
    location: a.location ?? null,
    createdBy: a.createdBy?.fullName ?? 'Church Office',
    createdAt: a.createdAt,
  }));

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPinned: false,
    targetGroup: '',
    eventDate: '',
    eventTime: '',
    location: ''
  });

  // Filter announcements based on search and category (case-insensitive, robust)
  const normalizedSelectedCategory = (selectedCategory || '').toLowerCase();
  const normalizedSearch = (searchQuery || '').toLowerCase().trim();

  const filteredAnnouncements = announcements.filter((a) => {
    const title = (a.title || '').toLowerCase();
    const content = (a.content || '').toLowerCase();
    const category = (a.category || '').toLowerCase();

    // Search matches title or content
    const matchesSearch = normalizedSearch
      ? title.includes(normalizedSearch) || content.includes(normalizedSearch)
      : true;

    // Category matches exact id (case-insensitive) or 'all'
    const matchesCategory =
      normalizedSelectedCategory === 'all' || category === normalizedSelectedCategory;

    // Pinned filter
    const matchesPinned = showPinnedOnly ? !!a.isPinned : true;

    return matchesSearch && matchesCategory && matchesPinned;
  });

  const pinnedAnnouncements = filteredAnnouncements.filter(a => a.isPinned);
  const regularAnnouncements = filteredAnnouncements.filter(a => !a.isPinned);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Build common input payload
    const inputPayload = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      isPinned: formData.isPinned,
      // NOTE: Provide a real group ID when available; using label will fail. Send null if not an ID.
      targetGroupId: formData.targetGroup && /^\d+$/.test(formData.targetGroup) ? formData.targetGroup : null,
      eventDate: formData.eventDate ? formData.eventDate : null,
      eventTime: formData.eventTime ? formData.eventTime : null,
      location: formData.location ? formData.location : null,
    } as const;

    try {
      if (selectedAnnouncement) {
        // Update existing announcement
        const { data } = await updateAnnouncement({
          variables: { input: { id: selectedAnnouncement.id, input: inputPayload } },
        });
        const resp = data?.updateAnnouncement;
        if (!resp?.success) {
          console.error('UpdateAnnouncement failed:', resp?.message);
          alert(`Failed to update announcement: ${resp?.message || 'Unknown error'}`);
          return;
        }
        alert('Announcement updated successfully!');
      } else {
        // Create new announcement
        const { data } = await createAnnouncement({
          variables: { input: inputPayload },
        });
        const resp = data?.createAnnouncement;
        if (!resp?.success) {
          console.error('CreateAnnouncement failed:', resp?.message);
          alert(`Failed to create announcement: ${resp?.message || 'Unknown error'}`);
          return;
        }
        alert('Announcement created successfully!');
      }

      // Reset form and go back to list
      setFormData({
        title: '',
        content: '',
        category: 'general',
        isPinned: false,
        targetGroup: '',
        eventDate: '',
        eventTime: '',
        location: ''
      });
      setActiveView('list');
      setSelectedAnnouncement(null);
    } catch (err) {
      console.error('GraphQL Error:', err);
      alert('Error saving announcement. Please try again.');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      isPinned: announcement.isPinned,
      targetGroup: announcement.targetGroup || '',
      eventDate: announcement.eventDate || '',
      eventTime: announcement.eventTime || '',
      location: announcement.location || ''
    });
    setActiveView('create');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        const { data } = await deleteAnnouncement({ variables: { input: { id } } });
        const resp = data?.deleteAnnouncement;
        if (!resp?.success) {
          console.error('DeleteAnnouncement failed:', resp?.message);
          alert(`Failed to delete announcement: ${resp?.message || 'Unknown error'}`);
          return;
        }
        alert('Announcement deleted successfully!');
      } catch (err) {
        console.error('Error deleting announcement:', err);
        alert('Error deleting announcement. Please try again.');
      }
    }
  };

  const handlePreview = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setActiveView('preview');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    
    return format(date, 'MMM dd, yyyy');
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-b from-[#E8FFD7] to-[#93DA97] p-4 md:p-6 text-center">Loading...</div>;
  if (error) return <div className="min-h-screen bg-gradient-to-b from-[#E8FFD7] to-[#93DA97] p-4 md:p-6 text-center">Error loading announcements: {error.message}</div>;

  return (
    <div className="flex h-screen bg-[#E8FFD7] overflow-hidden">
      {/* Combined Navigation - Extended with Dashboard Items */}
      

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7FCF5] ">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col md:flex-row items-center justify-between"
            >
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-[#5E936C] p-3 rounded-full mr-4">
                  <FaBullhorn className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#5E936C]">Church Announcements</h1>
                  <p className="text-gray-600">Share important updates with the congregation</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-4 py-2 rounded-lg flex items-center ${activeView === 'list' ? 'bg-[#5E936C] text-white' : 'bg-[#E8FFD7] text-[#5E936C]'}`}
                >
                  <FaNewspaper className="mr-2" />
                  View All
                </button>
                <button
                  onClick={() => {
                    setSelectedAnnouncement(null);
                    setActiveView('create');
                  }}
                  className={`px-4 py-2 rounded-lg flex items-center ${activeView === 'create' ? 'bg-[#5E936C] text-white' : 'bg-[#E8FFD7] text-[#5E936C]'}`}
                >
                  <FaPlus className="mr-2" />
                  New Announcement
                </button>
              </div>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeView === 'list' && (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Search and Filter Section */}
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="relative flex-1">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search announcements..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        >
                          <option value="all">All Categories</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                        
                        <button
                          onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                          className={`px-4 py-2 rounded-lg flex items-center ${showPinnedOnly ? 'bg-[#5E936C] text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                          <FaFilter className="mr-2" />
                          {showPinnedOnly ? 'Showing Pinned Only' : 'Show All'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`px-3 py-1 rounded-full flex items-center text-sm ${selectedCategory === category.id ? 'text-white' : 'text-gray-700'}`}
                          style={{ backgroundColor: selectedCategory === category.id ? category.color : '#E8FFD7' }}
                        >
                          <span className="mr-1">{category.icon}</span>
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Pinned Announcements */}
                  {pinnedAnnouncements.length > 0 && (
                    <div>
                      <h2 className="text-xl font-bold text-[#5E936C] mb-4 flex items-center">
                        <FaExclamationCircle className="mr-2" />
                        Pinned Announcements
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pinnedAnnouncements.map(announcement => {
                          const categoryInfo = getCategoryInfo(announcement.category);
                          return (
                            <motion.div
                              key={announcement.id}
                              whileHover={{ y: -5 }}
                              className="bg-white rounded-2xl shadow-lg overflow-hidden border-l-4"
                              style={{ borderLeftColor: categoryInfo.color }}
                            >
                              <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex items-center">
                                    <div className="p-2 rounded-full mr-3" style={{ backgroundColor: categoryInfo.color + '20' }}>
                                      <span className="text-lg" style={{ color: categoryInfo.color }}>{categoryInfo.icon}</span>
                                    </div>
                                    <span className="font-medium" style={{ color: categoryInfo.color }}>
                                      {categoryInfo.name}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handlePreview(announcement)}
                                      className="p-1 text-gray-400 hover:text-[#5E936C]"
                                      title="Preview"
                                    >
                                      <FaEye />
                                    </button>
                                    <button
                                      onClick={() => handleEdit(announcement)}
                                      className="p-1 text-gray-400 hover:text-[#5E936C]"
                                      title="Edit"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(announcement.id)}
                                      className="p-1 text-gray-400 hover:text-red-500"
                                      title="Delete"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>
                                
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{announcement.title}</h3>
                                <p className="text-gray-600 mb-4 line-clamp-2">{announcement.content}</p>
                                
                                {(announcement.eventDate || announcement.location) && (
                                  <div className="border-t border-gray-100 pt-3 mt-3">
                                    {announcement.eventDate && (
                                      <div className="flex items-center text-sm text-gray-500 mb-1">
                                        <FaCalendarAlt className="mr-2" />
                                        <span>{formatDate(announcement.eventDate)}</span>
                                        {announcement.eventTime && <span className="ml-2">at {announcement.eventTime}</span>}
                                      </div>
                                    )}
                                    {announcement.location && (
                                      <div className="flex items-center text-sm text-gray-500">
                                        <FaMapMarkerAlt className="mr-2" />
                                        <span>{announcement.location}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <div className="flex justify-between items-center mt-4">
                                  <div className="text-sm text-gray-500">
                                    By {announcement.createdBy} • {format(parseISO(announcement.createdAt), 'MMM dd, yyyy')}
                                  </div>
                                  {announcement.targetGroup && (
                                    <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">
                                      {announcement.targetGroup}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Regular Announcements */}
                  <div>
                    <h2 className="text-xl font-bold text-[#5E936C] mb-4">Recent Announcements</h2>
                    
                    {regularAnnouncements.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {regularAnnouncements.map(announcement => {
                          const categoryInfo = getCategoryInfo(announcement.category);
                          return (
                            <motion.div
                              key={announcement.id}
                              whileHover={{ x: 5 }}
                              className="bg-white rounded-xl shadow-md p-5 border-l-4"
                              style={{ borderLeftColor: categoryInfo.color }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    <div className="p-1 rounded-full mr-2" style={{ backgroundColor: categoryInfo.color + '20' }}>
                                      <span className="text-sm" style={{ color: categoryInfo.color }}>{categoryInfo.icon}</span>
                                    </div>
                                    <span className="text-sm font-medium" style={{ color: categoryInfo.color }}>
                                      {categoryInfo.name}
                                    </span>
                                    {announcement.targetGroup && (
                                      <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        {announcement.targetGroup}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{announcement.title}</h3>
                                  <p className="text-gray-600 mb-3">{announcement.content}</p>
                                  
                                  <div className="flex items-center text-sm text-gray-500">
                                    <FaClock className="mr-1" />
                                    <span>{format(parseISO(announcement.createdAt), 'MMM dd, yyyy • h:mm a')}</span>
                                    <span className="mx-2">•</span>
                                    <span>By {announcement.createdBy}</span>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-2 ml-4">
                                  <button
                                    onClick={() => handlePreview(announcement)}
                                    className="p-1 text-gray-400 hover:text-[#5E936C]"
                                    title="Preview"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(announcement)}
                                    className="p-1 text-gray-400 hover:text-[#5E936C]"
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(announcement.id)}
                                    className="p-1 text-gray-400 hover:text-red-500"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <FaBullhorn className="text-4xl text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No announcements found</h3>
                        <p className="text-gray-500 mb-4">Try changing your search or filter criteria</p>
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setShowPinnedOnly(false);
                          }}
                          className="bg-[#5E936C] text-white px-4 py-2 rounded-lg"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
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
                    {selectedAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                  </h2>
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                          placeholder="Enter announcement title"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 mb-2">Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        >
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-gray-700 mb-2">Content</label>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={5}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        placeholder="Write your announcement content here..."
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-gray-700 mb-2">Target Group (Optional)</label>
                        <select
                          name="targetGroup"
                          value={formData.targetGroup}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        >
                          <option value="">All Members</option>
                          <option value="Youth Group">Youth Group</option>
                          <option value="Women's Group">Women's Group</option>
                          <option value="Elders Council">Elders Council</option>
                          <option value="Choir Members">Choir Members</option>
                          <option value="Sunday School">Sunday School</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 mb-2">Location (Optional)</label>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                          placeholder="e.g., Main Sanctuary, Parish Hall"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-gray-700 mb-2">Event Date (Optional)</label>
                        <input
                          type="date"
                          name="eventDate"
                          value={formData.eventDate}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 mb-2">Event Time (Optional)</label>
                        <input
                          type="time"
                          name="eventTime"
                          value={formData.eventTime}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-6">
                      <input
                        type="checkbox"
                        id="isPinned"
                        name="isPinned"
                        checked={formData.isPinned}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-[#5E936C] focus:ring-[#5E936C] border-gray-300 rounded"
                      />
                      <label htmlFor="isPinned" className="ml-2 block text-gray-700">
                        Pin this announcement to the top
                      </label>
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveView('list');
                          setSelectedAnnouncement(null);
                        }}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#5E936C] text-white px-6 py-3 rounded-lg hover:bg-[#4a7a58] flex items-center"
                      >
                        {selectedAnnouncement ? 'Update Announcement' : 'Publish Announcement'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
              
              {activeView === 'preview' && selectedAnnouncement && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[#5E936C]">Announcement Preview</h2>
                    <button
                      onClick={() => setActiveView('list')}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          {(() => {
                            const categoryInfo = getCategoryInfo(selectedAnnouncement.category);
                            return (
                              <>
                                <div className="p-2 rounded-full mr-3" style={{ backgroundColor: categoryInfo.color + '20' }}>
                                  {React.cloneElement(categoryInfo.icon, { className: "text-xl", style: { color: categoryInfo.color } })}
                                </div>
                                <span className="font-medium" style={{ color: categoryInfo.color }}>
                                  {categoryInfo.name}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(parseISO(selectedAnnouncement.createdAt), 'MMM dd, yyyy • h:mm a')}
                        </div>
                      </div>
                      
                      <h1 className="text-3xl font-bold text-gray-800 mb-4">{selectedAnnouncement.title}</h1>
                      
                      {(selectedAnnouncement.eventDate || selectedAnnouncement.location) && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                          {selectedAnnouncement.eventDate && (
                            <div className="flex items-center text-gray-700 mb-2">
                              <FaCalendarAlt className="mr-3 text-[#5E936C]" />
                              <span className="font-medium">{formatDate(selectedAnnouncement.eventDate)}</span>
                              {selectedAnnouncement.eventTime && <span className="ml-2">at {selectedAnnouncement.eventTime}</span>}
                            </div>
                          )}
                          {selectedAnnouncement.location && (
                            <div className="flex items-center text-gray-700">
                              <FaMapMarkerAlt className="mr-3 text-[#5E936C]" />
                              <span className="font-medium">{selectedAnnouncement.location}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="prose max-w-none mb-8">
                        <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                          {selectedAnnouncement.content}
                        </p>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                        <div className="text-gray-600">
                          Published by <span className="font-medium">{selectedAnnouncement.createdBy}</span>
                          {selectedAnnouncement.targetGroup && (
                            <span className="ml-3 px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">
                              For: {selectedAnnouncement.targetGroup}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex space-x-3">
                          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center">
                            <FaShare className="mr-2" />
                            Share
                          </button>
                          <button 
                            onClick={() => handleEdit(selectedAnnouncement)}
                            className="bg-[#5E936C] text-white px-4 py-2 rounded-lg flex items-center"
                          >
                            <FaEdit className="mr-2" />
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AnnouncementsPage;