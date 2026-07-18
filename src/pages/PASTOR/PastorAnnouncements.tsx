import React, { useState, useEffect } from 'react';
import {
  FaBullhorn, FaCalendarAlt, FaPlus, FaEdit, FaTrash, FaEye,
  FaSearch, FaFilter, FaClock, FaMapMarkerAlt, FaUsers, FaShare,
  FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaTimes,
  FaPaperclip, FaFilePdf, FaCloudUploadAlt, FaCalendarTimes, FaCheck,
  FaThumbtack, FaBell, FaCalendarPlus
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useQuery, useMutation } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { GET_ANNOUNCEMENTS } from '../../api/queries';
import { CREATE_ANNOUNCEMENT, UPDATE_ANNOUNCEMENT, DELETE_ANNOUNCEMENT } from '../../api/mutations';
import { getAccessToken } from '../../utils/auth';
import { ENDPOINT } from '../../api/environment';

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
  priority?: boolean; // Mapped from isPinned
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
  const { t } = useTranslation();
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

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    isPinned: false,
    priority: false,
    targetGroupId: '',
    eventDate: '',
    eventTime: '',
    location: '',
    expiresAt: '',
    attachmentUrl: '',
    pdfFile: null as File | null,
    existingPdfUrl: ''
  });

  const categories = [
    { id: 'general', icon: FaBullhorn, label: t('category_general'), color: 'bg-blue-100 text-blue-600' },
    { id: 'events', icon: FaCalendarAlt, label: t('category_events'), color: 'bg-purple-100 text-purple-600' },
    { id: 'service', icon: FaClock, label: t('category_service'), color: 'bg-orange-100 text-orange-600' },
    { id: 'urgent', icon: FaExclamationCircle, label: t('category_urgent'), color: 'bg-red-100 text-red-600' },
    { id: 'community', icon: FaUsers, label: t('category_community'), color: 'bg-green-100 text-green-600' },
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

  // Handlers and Mapped Variables
  const isCreating = activeView === 'create';
  const setIsCreating = (val: boolean) => {
    if (!val) { resetForm(); }
    setActiveView(val ? 'create' : 'list');
  };
  const editingId = selectedAnnouncement?.id;
  const uploading = isUploading;
  const publishing = creating || updating;

  // --- Handlers ---
  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const resetForm = () => {
    setFormData({
      title: '', content: '', category: 'general', isPinned: false,
      priority: false, targetGroupId: '', eventDate: '', eventTime: '', location: '',
      expiresAt: '', attachmentUrl: '', pdfFile: null, existingPdfUrl: ''
    });
    setAttachmentFile(null);
    setSelectedAnnouncement(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAttachmentFile(file);
      setFormData(prev => ({ ...prev, pdfFile: file }));
    }
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
      attachmentUrl: ann.attachmentUrl || '',
      priority: ann.priority || false,
      pdfFile: null,
      existingPdfUrl: ann.attachmentUrl || ''
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
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-extrabold text-[#1A2E1F] flex items-center gap-3">
              <FaBullhorn className="text-[#5E936C]" />
              {t('announcements_title')}
            </h1>
            <p className="text-gray-500 mt-2 font-medium">{t('announcements_subtitle')}</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-[#5E936C] text-white rounded-2xl font-bold shadow-lg shadow-[#5E936C]/20 hover:bg-[#1A2E1F] transition-all flex items-center gap-2"
          >
            <FaPlus /> {t('new_announcement_btn')}
          </motion.button>
        </div>

        {/* Create/Edit Form */}
        <AnimatePresence>
          {(isCreating || editingId) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12 overflow-hidden"
            >
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5E936C] to-[#93DA97]"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  {/* Left Column: Inputs */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <FaEdit className="text-[#5E936C]" /> {t('core_details')}
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('category_label')}</label>
                        <div className="flex flex-wrap gap-2">
                          {['events', 'services', 'community', 'urgent', 'general'].map(cat => (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => setFormData({ ...formData, category: cat })}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${formData.category === cat
                                ? 'bg-[#5E936C] text-white shadow-md'
                                : 'bg-gray-50 text-gray-500 hover:bg-[#E8FFD7] hover:text-[#5E936C]'
                                }`}
                            >
                              {t(`category_${cat}`)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('headline_title')}</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={e => setFormData({ ...formData, title: e.target.value })}
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#5E936C] font-bold text-gray-800 placeholder-gray-300"
                          placeholder={t('enter_title_placeholder')}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('message_content')}</label>
                        <textarea
                          value={formData.content}
                          onChange={e => setFormData({ ...formData, content: e.target.value })}
                          className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-[#5E936C] font-medium text-gray-600 placeholder-gray-300 h-32 resize-none"
                          placeholder={t('content_placeholder')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Meta & Actions */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <FaCalendarPlus className="text-[#5E936C]" /> {t('attachments_metadata')}
                    </h3>

                    <div className="bg-[#F7FCF5] p-6 rounded-[2rem] space-y-4 border border-[#E8FFD7]">
                      {/* File Upload */}
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`p-4 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-3 ${formData.pdfFile || formData.existingPdfUrl
                          ? 'border-[#5E936C] bg-[#E8FFD7]/50 text-[#5E936C]'
                          : 'border-gray-200 bg-white text-gray-400 group-hover:border-[#5E936C] group-hover:text-[#5E936C]'
                          }`}>
                          <FaFilePdf className="text-xl" />
                          <span className="font-bold text-sm">
                            {formData.pdfFile ? formData.pdfFile.name : (formData.existingPdfUrl ? t('pdf_attached_change') : t('attach_pdf_doc'))}
                          </span>
                        </div>
                      </div>

                      {/* Expiry Date */}
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{t('auto_expire_at')}</label>
                        <input
                          type="datetime-local"
                          value={formData.expiresAt}
                          onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                          className="w-full p-3 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#5E936C]"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 pl-1">{t('auto_expire_desc')}</p>
                      </div>

                      {/* Event Details (Optional) */}
                      {formData.category === 'events' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="animate-fade-in space-y-3 pt-2 border-t border-gray-100 overflow-hidden"
                        >
                          <p className="text-[10px] uppercase font-black text-[#5E936C] tracking-widest">{t('event_details_opt')}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input type="date" value={formData.eventDate} onChange={e => setFormData({ ...formData, eventDate: e.target.value })} className="p-2 bg-white rounded-lg text-xs font-bold border border-gray-200" placeholder={t('date_label')} />
                            <input type="time" value={formData.eventTime} onChange={e => setFormData({ ...formData, eventTime: e.target.value })} className="p-2 bg-white rounded-lg text-xs font-bold border border-gray-200" placeholder={t('time_label')} />
                          </div>
                          <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full p-2 bg-white rounded-lg text-xs font-bold border border-gray-200" placeholder={t('location_label')} />
                        </motion.div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.priority}
                          onChange={e => setFormData({ ...formData, priority: e.target.checked })}
                          className="w-5 h-5 rounded text-[#5E936C] focus:ring-[#5E936C]"
                        />
                        <span className="text-sm font-bold text-gray-700">{t('pin_to_top')}</span>
                      </label>

                      <div className="flex gap-3">
                        <button
                          onClick={resetForm}
                          className="px-4 py-2 text-gray-400 font-bold hover:text-gray-600"
                        >
                          {t('cancel_btn')}
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={uploading || publishing}
                          className="px-6 py-2 bg-[#1A2E1F] text-white rounded-xl font-bold hover:bg-[#5E936C] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {uploading ? t('uploading') : (publishing ? t('publishing_btn') : (editingId ? t('save_changes') : t('publish_now_btn')))}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="space-y-6">
          <h2 className="text-xl font-black text-[#1A2E1F] flex items-center gap-2">
            <FaThumbtack className="text-[#5E936C]" /> {t('all_posts')}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400">{t('loading_yours')}</div>
          ) : (
            <div className="grid gap-6">
              {(data?.announcements || []).map((ann: any) => (
                <motion.div
                  key={ann.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 relative group overflow-hidden ${ann.priority ? 'ring-2 ring-[#5E936C]/20' : ''}`}
                >
                  {ann.priority && (
                    <div className="absolute top-0 right-0 bg-[#5E936C] text-white px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest">
                      {t('pin_to_top')}
                    </div>
                  )}

                  <div className="flex justify-between items-start z-10 relative">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${ann.category === 'urgent' ? 'bg-red-100 text-red-500' :
                        ann.category === 'events' ? 'bg-purple-100 text-purple-500' :
                          'bg-[#E8FFD7] text-[#5E936C]'
                        }`}>
                        {ann.category === 'urgent' ? <FaBell /> : ann.category === 'events' ? <FaCalendarAlt /> : <FaBullhorn />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{t(`category_${ann.category}`)}</span>
                          <span className="text-xs font-bold text-gray-300">{new Date(ann.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#1A2E1F]">{ann.title}</h3>
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(ann)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#E8FFD7] hover:text-[#5E936C] transition-colors"><FaEdit /></button>
                      <button onClick={() => handleDelete(ann.id)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"><FaTrash /></button>
                    </div>
                  </div>

                  <p className="mt-4 text-gray-600 leading-relaxed pl-[4.5rem] pr-8 line-clamp-2">
                    {ann.content}
                  </p>

                  {ann.attachmentUrl && (
                    <div className="mt-4 pl-[4.5rem]">
                      <a
                        href={ann.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold hover:bg-[#E8FFD7] hover:text-[#5E936C] transition-colors"
                      >
                        <FaFilePdf /> {t('view_attachment')}
                      </a>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsPage;
// Revision note [2026-07-20 14:40:42 +0300]: Update offering cards registration window view

// Revision note [2026-08-03 18:42:35 +0300]: Enhance blog feed pagination control

// Activity update [2026-07-18 18:20:53 +0300]: Update offering cards registration window view
