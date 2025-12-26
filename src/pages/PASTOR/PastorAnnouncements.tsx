import React, { useState, useEffect } from 'react';
import {
  FaBullhorn, FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaEye,
  FaSearch, FaFilter, FaClock, FaMapMarkerAlt, FaUsers, FaShare,
  FaBell, FaExclamationCircle, FaInfoCircle, FaChevronLeft, FaChevronRight,
  FaCheckCircle, FaTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ANNOUNCEMENTS } from '../../api/queries';
import { CREATE_ANNOUNCEMENT, UPDATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../api/mutations';

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
  bgColor: string;
  borderColor: string;
}

const AnnouncementsPage = () => {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'preview'>('list');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const categories: Category[] = [
    { id: 'events', name: 'Events', color: '#5E936C', bgColor: '#F0F9F1', borderColor: '#E1F2E4', icon: <FaCalendarAlt /> },
    { id: 'services', name: 'Service', color: '#4A90E2', bgColor: '#F0F7FF', borderColor: '#E1EFFF', icon: <FaBell /> },
    { id: 'community', name: 'Community', color: '#F5A623', bgColor: '#FFF9F0', borderColor: '#FFF1E1', icon: <FaUsers /> },
    { id: 'urgent', name: 'Urgent', color: '#E53E3E', bgColor: '#FFF5F5', borderColor: '#FED7D7', icon: <FaExclamationCircle /> },
    { id: 'general', name: 'General', color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#F3F4F6', icon: <FaInfoCircle /> }
  ];

  const { data, loading, error, refetch } = useQuery(GET_ANNOUNCEMENTS, {
    variables: {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      category: selectedCategory === 'all' ? null : selectedCategory,
      search: searchQuery || null
    },
    fetchPolicy: 'network-only',
  });

  const [createAnnouncement, { loading: creating }] = useMutation(CREATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }],
  });
  const [updateAnnouncement, { loading: updating }] = useMutation(UPDATE_ANNOUNCEMENT, {
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }],
  });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, {
    refetchQueries: [{ query: GET_ANNOUNCEMENTS }],
  });

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

  const totalCount = data?.totalAnnouncements || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPinned: false,
    targetGroupId: '',
    eventDate: '',
    eventTime: '',
    location: ''
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

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
    const inputPayload = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      isPinned: formData.isPinned,
      targetGroupId: formData.targetGroupId || null,
      eventDate: formData.eventDate || null,
      eventTime: formData.eventTime || null,
      location: formData.location || null,
    };

    try {
      if (selectedAnnouncement) {
        await updateAnnouncement({
          variables: { input: { id: selectedAnnouncement.id, input: inputPayload } },
        });
      } else {
        await createAnnouncement({
          variables: { input: inputPayload },
        });
      }
      setActiveView('list');
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'general',
      isPinned: false,
      targetGroupId: '',
      eventDate: '',
      eventTime: '',
      location: ''
    });
    setSelectedAnnouncement(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      category: announcement.category,
      isPinned: announcement.isPinned,
      targetGroupId: '', // IDs are harder to prefill without more data
      eventDate: announcement.eventDate || '',
      eventTime: announcement.eventTime || '',
      location: announcement.location || ''
    });
    setActiveView('create');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this announcement permanently?')) {
      try {
        await deleteAnnouncement({ variables: { input: { id } } });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd, yyyy');
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId.toLowerCase()) || categories[4];
  };

  return (
    <div className="min-h-screen bg-[#F7FCF5] pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-black text-[#1A2E1F] flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <FaBullhorn className="text-[#5E936C]" />
              </div>
              Church Announcements
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Keeping the congregation informed and engaged.</p>
          </motion.div>

          <div className="flex gap-4">
            <button
              onClick={() => { resetForm(); setActiveView('create'); }}
              className="bg-[#5E936C] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#1A2E1F] transition-all flex items-center gap-3 shadow-lg shadow-[#5E936C]/20"
            >
              <FaPlus /> New Update
            </button>
          </div>
        </div>

        {activeView === 'list' && (
          <div className="space-y-8">
            {/* Controls */}
            <div className="bg-white rounded-3xl shadow-sm p-4 flex flex-col lg:flex-row gap-4 items-center border border-gray-100">
              <div className="relative flex-1 w-full">
                <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search announcements..."
                  className="w-full pl-14 pr-6 py-4 bg-gray-50 rounded-2xl focus:ring-4 focus:ring-[#E8FFD7] border-none text-gray-700 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === 'all'
                        ? 'bg-white text-[#5E936C] shadow-sm'
                        : 'text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    All
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${selectedCategory === cat.id
                          ? 'bg-white shadow-sm'
                          : 'text-gray-400 hover:text-gray-600'
                        }`}
                      style={{ color: selectedCategory === cat.id ? cat.color : undefined }}
                    >
                      {cat.icon} {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Feed */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#5E936C] border-t-transparent"></div>
              </div>
            ) : announcements.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <FaBullhorn className="text-7xl text-gray-100 mx-auto mb-6" />
                <p className="text-gray-400 text-xl font-medium">No announcements found in this category.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence mode='popLayout'>
                    {announcements.map((ann, idx) => {
                      const cat = getCategoryInfo(ann.category);
                      return (
                        <motion.div
                          key={ann.id}
                          layout
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (idx % 6) * 0.05 }}
                          className={`bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 group relative overflow-hidden flex flex-col transition-all hover:shadow-2xl hover:border-${cat.color}/20`}
                        >
                          {ann.isPinned && (
                            <div className="absolute top-0 right-0 p-4">
                              <div className="bg-amber-100 text-amber-600 p-2 rounded-xl shadow-sm">
                                <FaExclamationCircle className="text-lg" />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-6">
                            <div
                              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm"
                              style={{ backgroundColor: cat.bgColor, color: cat.color, border: `1px solid ${cat.borderColor}` }}
                            >
                              {cat.icon}
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: cat.color }}>
                                {cat.name}
                              </span>
                              <div className="text-xs text-gray-400 font-bold mt-0.5">
                                {formatDate(ann.createdAt)}
                              </div>
                            </div>
                          </div>

                          <h3 className="text-xl font-black text-[#1A2E1F] mb-4 group-hover:text-[#5E936C] transition-colors leading-tight">
                            {ann.title}
                          </h3>

                          <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-1 line-clamp-4">
                            {ann.content}
                          </p>

                          {(ann.eventDate || ann.location) && (
                            <div className="space-y-3 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                              {ann.eventDate && (
                                <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                  <FaCalendarAlt className="text-[#5E936C]" />
                                  {formatDate(ann.eventDate)} {ann.eventTime && `• ${ann.eventTime}`}
                                </div>
                              )}
                              {ann.location && (
                                <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                  <FaMapMarkerAlt className="text-[#5E936C]" />
                                  {ann.location}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">
                                {ann.createdBy.charAt(0)}
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ann.createdBy}</span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(ann)}
                                className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#E8FFD7] hover:text-[#5E936C] transition-all"
                              >
                                <FaEdit className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDelete(ann.id)}
                                className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                              <button
                                onClick={() => { setSelectedAnnouncement(ann); setActiveView('preview'); }}
                                className="p-3 bg-[#5E936C] text-white rounded-xl shadow-lg shadow-[#5E936C]/20 hover:bg-[#1A2E1F] transition-all"
                              >
                                <FaEye className="text-sm" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-16 flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 text-[#5E936C] disabled:opacity-30 hover:bg-[#E8FFD7] transition-all"
                    >
                      <FaChevronLeft />
                    </button>

                    <div className="flex gap-3">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className={`w-14 h-14 rounded-2xl font-black text-sm transition-all ${currentPage === p
                              ? 'bg-[#5E936C] text-white shadow-xl scale-110'
                              : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100 text-[#5E936C] disabled:opacity-30 hover:bg-[#E8FFD7] transition-all"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Create/Edit View */}
        {activeView === 'create' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
              <div className="p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div>
                  <h2 className="text-3xl font-black text-[#1A2E1F]">
                    {selectedAnnouncement ? 'Refine Update' : 'New Announcement'}
                  </h2>
                  <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">
                    {selectedAnnouncement ? 'Updating existing information' : 'Broadcast to the congregation'}
                  </p>
                </div>
                <button onClick={() => { setActiveView('list'); resetForm(); }} className="text-gray-400 p-2 hover:bg-white hover:text-red-500 rounded-xl transition-all"><FaTimes /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="space-y-6">
                  <div className="relative group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5E936C] ml-4 absolute -top-2 bg-white px-2 z-10 transition-all group-focus-within:text-black">Update Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-8 py-5 bg-gray-50 rounded-3xl border-none focus:ring-4 focus:ring-[#E8FFD7] font-bold text-lg text-gray-700 transition-all"
                      placeholder="e.g., Annual Feast of Weeks"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5E936C] ml-4 absolute -top-2 bg-white px-2 z-10">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-8 py-5 bg-gray-50 rounded-3xl border-none focus:ring-4 focus:ring-[#E8FFD7] font-bold text-gray-700 appearance-none"
                      >
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5E936C] ml-4 absolute -top-2 bg-white px-2 z-10">Target Group</label>
                      <select
                        name="targetGroupId"
                        value={formData.targetGroupId}
                        onChange={handleInputChange}
                        className="w-full px-8 py-5 bg-gray-50 rounded-3xl border-none focus:ring-4 focus:ring-[#E8FFD7] font-bold text-gray-700 appearance-none"
                      >
                        <option value="">All Members</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#5E936C] ml-4 absolute -top-2 bg-white px-2 z-10">Broadcase Message</label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-8 py-5 bg-gray-50 rounded-[2rem] border-none focus:ring-4 focus:ring-[#E8FFD7] font-medium text-gray-700 resize-none transition-all"
                      placeholder="Write the full content of your announcement here..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5E936C] ml-4 absolute -top-2 bg-white px-2 z-10">Date</label>
                      <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} className="w-full px-6 py-5 bg-gray-50 rounded-3xl border-none focus:ring-4 focus:ring-[#E8FFD7] font-bold text-gray-700" />
                    </div>
                    <div className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5E936C] ml-4 absolute -top-2 bg-white px-2 z-10">Time</label>
                      <input type="time" name="eventTime" value={formData.eventTime} onChange={handleInputChange} className="w-full px-6 py-5 bg-gray-50 rounded-3xl border-none focus:ring-4 focus:ring-[#E8FFD7] font-bold text-gray-700" />
                    </div>
                    <div className="relative group">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#5E936C] ml-4 absolute -top-2 bg-white px-2 z-10">Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Parish Hall" className="w-full px-6 py-5 bg-gray-50 rounded-3xl border-none focus:ring-4 focus:ring-[#E8FFD7] font-bold text-gray-700" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-[#F7FCF5] p-6 rounded-[2rem] border border-[#E8FFD7]">
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full shadow-inner">
                      <input
                        type="checkbox"
                        name="isPinned"
                        checked={formData.isPinned}
                        onChange={handleInputChange}
                        className="absolute block w-6 h-6 bg-white border-4 border-gray-200 rounded-full appearance-none cursor-pointer checked:right-0 checked:bg-[#5E936C] checked:border-[#5E936C] transition-all"
                      />
                    </div>
                    <div>
                      <span className="block font-black text-[#1A2E1F] text-sm">Pin Announcement</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Always visible at the top of the feed</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-10 border-t border-gray-50">
                  <button type="button" onClick={() => { setActiveView('list'); resetForm(); }} className="flex-1 py-5 bg-gray-100 text-gray-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">Discard</button>
                  <button type="submit" disabled={creating || updating} className="flex-[2] py-5 bg-[#5E936C] text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-[#1A2E1F] transition-all shadow-xl shadow-[#5E936C]/20 flex items-center justify-center gap-3">
                    {creating || updating ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <><FaCheckCircle /> {selectedAnnouncement ? 'Update Content' : 'Publish Broadcast'}</>}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Preview View */}
        {activeView === 'preview' && selectedAnnouncement && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
            <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-gray-100">
              {/* Cover/Action Header */}
              <div className="h-4 p-8 flex justify-end">
                <button onClick={() => setActiveView('list')} className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-400 transition-all"><FaTimes /></button>
              </div>

              <div className="p-16 pt-8 space-y-12">
                <div className="text-center space-y-4">
                  <div className="flex justify-center flex-wrap gap-3">
                    <span className="px-5 py-2 bg-[#E8FFD7] text-[#5E936C] rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-[#d4f5bc]">
                      {getCategoryInfo(selectedAnnouncement.category).name}
                    </span>
                    {selectedAnnouncement.isPinned && (
                      <span className="px-5 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-100">
                        Pinned Update
                      </span>
                    )}
                  </div>
                  <h1 className="text-5xl font-black text-[#1A2E1F] leading-tight max-w-2xl mx-auto">{selectedAnnouncement.title}</h1>
                  <div className="flex items-center justify-center gap-6 text-gray-400 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2"><FaClock className="text-[#5E936C]" /> {format(parseISO(selectedAnnouncement.createdAt), 'MMM dd, yyyy')}</span>
                    <span className="flex items-center gap-2"><FaUserCircle className="text-[#5E936C]" /> {selectedAnnouncement.createdBy}</span>
                  </div>
                </div>

                <div className="p-10 bg-[#F7FCF5] rounded-[3rem] border border-[#E8FFD7] space-y-8">
                  {(selectedAnnouncement.eventDate || selectedAnnouncement.location) && (
                    <div className="grid grid-cols-2 gap-8 border-b border-[#E8FFD7] pb-8">
                      {selectedAnnouncement.eventDate && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-[#5E936C] uppercase tracking-[0.2em]">Scheduled Date</span>
                          <div className="text-xl font-bold text-[#1A2E1F]">{formatDate(selectedAnnouncement.eventDate)} at {selectedAnnouncement.eventTime || 'TBA'}</div>
                        </div>
                      )}
                      {selectedAnnouncement.location && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-[#5E936C] uppercase tracking-[0.2em]">Venue Location</span>
                          <div className="text-xl font-bold text-[#1A2E1F]">{selectedAnnouncement.location}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="prose prose-lg max-w-none">
                    <p className="text-[#1A2E1F]/80 text-xl leading-relaxed font-medium whitespace-pre-line underline-offset-8">
                      {selectedAnnouncement.content}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-12">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-2xl font-black text-[#5E936C] shadow-inner">
                      {selectedAnnouncement.createdBy.charAt(0)}
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Publisher</span>
                      <span className="text-lg font-black text-[#1A2E1F]">{selectedAnnouncement.createdBy}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="px-8 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"><FaShare /> Share</button>
                    <button onClick={() => handleEdit(selectedAnnouncement)} className="px-8 py-4 bg-[#5E936C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A2E1F] transition-all shadow-xl shadow-[#5E936C]/20 flex items-center gap-2"><FaEdit /> Refine Content</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const FaUserCircle = ({ className }: { className?: string }) => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" className={className} height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M248 8C111 8 0 119 0 256s111 248 248 248 248-111 248-248S385 8 248 8zm0 96c48.6 0 88 39.4 88 88s-39.4 88-88 88-88-39.4-88-88 39.4-88 88-88zm0 344c-58.7 0-111.3-26.6-146.5-68.2 18.8-35.4 55.6-59.8 98.5-59.8 2.4 0 4.8.4 7.1 1.1 13 4.2 26.6 6.9 40.9 6.9 14.3 0 28-2.7 40.9-6.9 2.3-.7 4.7-1.1 7.1-1.1 42.9 0 79.7 24.4 98.5 59.8C359.3 421.4 306.7 448 248 448z"></path>
  </svg>
);

export default AnnouncementsPage;