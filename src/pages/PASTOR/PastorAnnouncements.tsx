import React, { useState, useEffect } from 'react';
import {
  FaBullhorn, FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaEye,
  FaSearch, FaFilter, FaClock, FaMapMarkerAlt, FaUsers, FaShare,
  FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaTimes,
  FaPaperclip, FaFilePdf, FaCloudUploadAlt, FaCalendarTimes, FaCheck
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ANNOUNCEMENTS } from '../../api/queries';
import { CREATE_ANNOUNCEMENT, UPDATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../api/mutations';
import { getAccessToken } from '../../utils/auth';

// --- Toast Component ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 ${type === 'success' ? 'bg-[#1a3c2b]/95 text-white' : 'bg-red-500/95 text-white'
        }`}
    >
      <div className={`p-2 rounded-full ${type === 'success' ? 'bg-[#5E936C]' : 'bg-white/20'}`}>
        {type === 'success' ? <FaCheck className="text-sm" /> : <FaTimes className="text-sm" />}
      </div>
      <div>
        <h4 className="font-bold text-sm tracking-wide">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-xs opacity-90 font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

// --- Types ---
interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  targetGroup: { id: string, name: string } | null;
  eventDate: string | null;
  eventTime: string | null;
  location: string | null;
  expiresAt: string | null;
  attachmentUrl: string | null;
  createdBy: { id: string, fullName: string } | null;
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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // File Upload State
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories: Category[] = [
    { id: 'events', name: 'Events', color: '#5E936C', bgColor: '#F0F9F1', borderColor: '#E1F2E4', icon: <FaCalendarAlt /> },
    { id: 'services', name: 'Service', color: '#4A90E2', bgColor: '#F0F7FF', borderColor: '#E1EFFF', icon: <FaInfoCircle /> },
    { id: 'community', name: 'Community', color: '#F5A623', bgColor: '#FFF9F0', borderColor: '#FFF1E1', icon: <FaUsers /> },
    { id: 'urgent', name: 'Urgent', color: '#E53E3E', bgColor: '#FFF5F5', borderColor: '#FED7D7', icon: <FaExclamationCircle /> },
    { id: 'general', name: 'General', color: '#6B7280', bgColor: '#F9FAFB', borderColor: '#F3F4F6', icon: <FaBullhorn /> }
  ];

  const { data, loading } = useQuery(GET_ANNOUNCEMENTS, {
    variables: {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      category: selectedCategory === 'all' ? null : selectedCategory,
      search: searchQuery || null
    },
    fetchPolicy: 'cache-and-network',
  });

  const [createAnnouncement, { loading: creating }] = useMutation(CREATE_ANNOUNCEMENT, { refetchQueries: [{ query: GET_ANNOUNCEMENTS }] });
  const [updateAnnouncement, { loading: updating }] = useMutation(UPDATE_ANNOUNCEMENT, { refetchQueries: [{ query: GET_ANNOUNCEMENTS }] });
  const [deleteAnnouncement] = useMutation(DELETE_ANNOUNCEMENT, { refetchQueries: [{ query: GET_ANNOUNCEMENTS }] });

  const announcements: Announcement[] = data?.announcements || [];
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
    location: '',
    expiresAt: '', // Date + Time string
    attachmentUrl: ''
  });

  // --- Handlers ---
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const resetForm = () => {
    setFormData({
      title: '', content: '', category: 'general', isPinned: false,
      targetGroupId: '', eventDate: '', eventTime: '', location: '',
      expiresAt: '', attachmentUrl: ''
    });
    setAttachmentFile(null);
    setSelectedAnnouncement(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // @ts-ignore
    const checked = type === 'checkbox' ? e.target.checked : undefined;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'announcements/docs');
    const token = getAccessToken();
    const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

    setIsUploading(true);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/upload/`, {
        method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: form
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      return data.url;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let uploadedUrl = formData.attachmentUrl;
      if (attachmentFile) {
        uploadedUrl = await uploadFile(attachmentFile);
      }

      // Convert expiresAt (datetime-local string) to ISO or suitable format
      // Note: Backend expects DateTime. datetime-local format is "YYYY-MM-DDTHH:mm" which is close to ISO8601
      let formattedExpiresAt = formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null;

      const inputPayload = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        isPinned: formData.isPinned,
        targetGroupId: formData.targetGroupId || null,
        eventDate: formData.eventDate || null,
        eventTime: formData.eventTime || null,
        location: formData.location || null,
        expiresAt: formattedExpiresAt,
        attachmentUrl: uploadedUrl || null
      };

      if (selectedAnnouncement) {
        // Relay Mutation for Update usually takes input: { id: ..., input: { ...fields } }
        await updateAnnouncement({ variables: { input: { id: selectedAnnouncement.id, input: inputPayload } } });
        showToast('Announcement updated successfully', 'success');
      } else {
        // Relay Mutation for Create (ClientIDMutation) takes input: { input: { ...fields } }
        await createAnnouncement({ variables: { input: { input: inputPayload } } });
        showToast('Announcement published successfully', 'success');
      }
      setActiveView('list');
      resetForm();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit', 'error');
    }
  };

  const handleEdit = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setFormData({
      title: ann.title,
      content: ann.content,
      category: ann.category,
      isPinned: ann.isPinned,
      targetGroupId: ann.targetGroup?.id || '',
      eventDate: ann.eventDate || '',
      eventTime: ann.eventTime || '',
      location: ann.location || '',
      expiresAt: ann.expiresAt ? format(parseISO(ann.expiresAt), "yyyy-MM-dd'T'HH:mm") : '', // Format for datetime-local
      attachmentUrl: ann.attachmentUrl || ''
    });
    setActiveView('create');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await deleteAnnouncement({ variables: { input: { id } } });
        showToast('Deleted successfully', 'success');
      } catch (err) { showToast('Failed to delete', 'error'); }
    }
  };

  const getCategoryInfo = (id: string) => categories.find(c => c.id === id) || categories[4];

  // --- Render ---

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-800">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-[#1a3c2b] flex items-center gap-3">
              Announcement Board
            </h1>
            <p className="text-gray-500 font-medium mt-2">Manage church communications and events</p>
          </div>
          <button
            onClick={() => { resetForm(); setActiveView(activeView === 'create' ? 'list' : 'create'); }}
            className={`px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl flex items-center gap-3 ${activeView === 'create' ? 'bg-gray-200 text-gray-600' : 'bg-[#1a3c2b] text-white hover:bg-[#2d5c43] shadow-green-900/20'}`}
          >
            {activeView === 'create' ? <><FaTimes /> Cancel</> : <><FaPlus /> New Announcement</>}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeView === 'create' ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#1a3c2b] mb-6 flex items-center gap-2"><div className="w-1.5 h-5 bg-[#5E936C] rounded-full" /> Core Details</h3>

                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Category</label>
                        <div className="flex flex-wrap gap-2">
                          {categories.map(cat => (
                            <button type="button" key={cat.id} onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${formData.category === cat.id ? `bg-[${cat.bgColor}] border-[${cat.borderColor}] ring-2 ring-offset-1` : 'bg-gray-50 border-gray-100 text-gray-400'}`} style={{ backgroundColor: formData.category === cat.id ? cat.bgColor : undefined, color: formData.category === cat.id ? cat.color : undefined, borderColor: formData.category === cat.id ? cat.borderColor : undefined }}>
                              {cat.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Headline Title</label>
                        <input name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. Sunday Service Time Change" className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#5E936C] outline-none text-lg font-bold text-[#1a3c2b]" required />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Message Content</label>
                        <textarea name="content" value={formData.content} onChange={handleInputChange} rows={6} placeholder="Write your announcement details here..." className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#5E936C] outline-none font-medium text-gray-600 resize-none" required />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#1a3c2b] mb-6 flex items-center gap-2"><div className="w-1.5 h-5 bg-[#5E936C] rounded-full" /> Attachments & Metadata</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* PDF Upload */}
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 border-dashed">
                        <label className="flex flex-col items-center justify-center cursor-pointer h-full">
                          <FaFilePdf className={`text-4xl mb-3 ${attachmentFile || formData.attachmentUrl ? 'text-red-500' : 'text-gray-300'}`} />
                          <span className="text-sm font-bold text-gray-600">{attachmentFile ? attachmentFile.name : formData.attachmentUrl ? 'PDF Attached (Click to Change)' : 'Attach PDF Document'}</span>
                          <input type="file" accept=".pdf" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setAttachmentFile(e.target.files[0]); }} />
                        </label>
                      </div>

                      {/* Expiration */}
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Auto-Expire At</label>
                        <div className="relative">
                          <FaCalendarTimes className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="datetime-local" name="expiresAt" value={formData.expiresAt} onChange={handleInputChange} className="w-full pl-10 pr-4 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#5E936C] font-bold text-gray-700" />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 ml-1">Announcement effectively disappears after this time.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Event Details & Push */}
                <div className="space-y-6">
                  <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#1a3c2b] mb-6 flex items-center gap-2"><div className="w-1.5 h-5 bg-[#5E936C] rounded-full" /> Event Details (Optional)</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Date</label>
                        <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} className="w-full px-5 py-3 bg-gray-50 rounded-xl font-bold text-gray-700" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Time</label>
                        <input type="time" name="eventTime" value={formData.eventTime} onChange={handleInputChange} className="w-full px-5 py-3 bg-gray-50 rounded-xl font-bold text-gray-700" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Location</label>
                        <div className="relative">
                          <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="e.g. Main Hall" className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl font-bold text-gray-700" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#E8FFD7] rounded-[2rem] p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <input type="checkbox" name="isPinned" checked={formData.isPinned} onChange={handleInputChange} className="w-5 h-5 text-[#5E936C] rounded focus:ring-[#5E936C]" />
                      <label className="font-bold text-[#1a3c2b]">Pin to Top</label>
                    </div>
                    <button type="submit" disabled={isUploading || creating || updating} className="w-full py-4 bg-[#1a3c2b] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-[#2d5c43] shadow-lg shadow-green-900/10 flex items-center justify-center gap-2">
                      {isUploading ? 'Uploading...' : creating || updating ? 'Publishing...' : <><FaCheckCircle /> {selectedAnnouncement ? 'Save Changes' : 'Publish Now'}</>}
                    </button>
                  </div>
                </div>

              </form>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Filters */}
              <div className="flex overflow-x-auto pb-4 gap-2 scrollbar-hide">
                <button onClick={() => setSelectedCategory('all')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-[#1a3c2b] text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>All Posts</button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} style={{ color: selectedCategory === cat.id ? 'white' : cat.color, backgroundColor: selectedCategory === cat.id ? cat.color : 'white' }} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all shadow-sm`}>
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((ann, idx) => {
                  const cat = getCategoryInfo(ann.category);
                  return (
                    <div key={ann.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative group hover:shadow-xl transition-all h-full flex flex-col">
                      {ann.isPinned && <div className="absolute top-6 right-6 text-amber-500 bg-amber-50 p-2 rounded-lg text-lg"><FaPaperclip /></div>}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.bgColor, color: cat.color }}>{cat.icon}</div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{cat.name}</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#1a3c2b] mb-3 leading-tight">{ann.title}</h3>
                      <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">{ann.content}</p>

                      {(ann.attachmentUrl) && (
                        <div className="mb-6">
                          <a href={ann.attachmentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition">
                            <FaFilePdf /> View Attachment
                          </a>
                        </div>
                      )}

                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-400">{format(parseISO(ann.createdAt), 'MMM dd')}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(ann)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-[#5E936C] hover:text-white"><FaEdit /></button>
                          <button onClick={() => handleDelete(ann.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white"><FaTrash /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnnouncementsPage;