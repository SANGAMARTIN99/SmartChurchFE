import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaBullhorn, FaSearch, FaThumbtack, FaCalendarAlt,
  FaMapMarkerAlt, FaFilePdf, FaClock, FaTimes, FaFilter,
  FaChevronLeft, FaChevronRight, FaLock, FaEye
} from 'react-icons/fa';
import { GET_ANNOUNCEMENTS } from '../../api/queries';
import { format, parseISO, isAfter } from 'date-fns';
import { Document, Page, pdfjs } from 'react-pdf';
// Essential styles for react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// --- Types ---
type Announcement = {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  targetGroup?: { id: string; name: string } | null;
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
  createdBy?: { id: string; fullName: string } | null;
  createdAt: string;
  expiresAt?: string | null;
  attachmentUrl?: string | null;
};

type QueryData = {
  announcements: Announcement[];
  totalAnnouncements: number;
};

type QueryVars = {
  limit: number;
  offset: number;
  category?: string | null;
  search?: string | null;
};

// --- Secure PDF Viewer ---
const SecurePDFViewer = ({ url, title, onClose }: { url: string; title: string; onClose: () => void }) => {
  const { t } = useTranslation();
  const [numPages, setNumPages] = useState<number | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col h-screen w-screen"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800 text-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-800 rounded-lg"><FaLock className="text-amber-500 text-xs" /></div>
          <div>
            <h3 className="font-bold text-sm leading-none">{title}</h3>
            <span className="text-[10px] text-gray-400">{t('secure_read_mode')}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><FaTimes /></button>
      </div>

      {/* Viewer Frame */}
      <div className="flex-1 w-full h-full relative bg-gray-600 overflow-y-auto flex justify-center py-8" onContextMenu={(e) => e.preventDefault()}>
        <div className="max-w-4xl w-full px-4">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center h-64 text-white gap-4">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-bold text-sm tracking-widest uppercase opacity-70">{t('loading_doc')}</span>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center h-64 text-red-400 gap-2">
                <FaLock className="text-4xl opacity-50 mb-2" />
                <p className="font-bold">{t('doc_load_error_title')}</p>
                <p className="text-sm opacity-70">{t('doc_load_error_msg')}</p>
              </div>
            }
            className="flex flex-col items-center gap-6"
          >
            {Array.from(new Array(numPages || 0), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderTextLayer={false}     // Disable text selection (Security)
                renderAnnotationLayer={false} // Disable external links (Security)
                scale={1.2}
                className="shadow-2xl rounded-sm overflow-hidden"
                width={Math.min(window.innerWidth * 0.9, 800)} // Responsive width
              />
            ))}
          </Document>
        </div>
      </div>
    </motion.div>
  );
};

// --- Page Component ---
const TodayAnnouncements: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [pdfToView, setPdfToView] = useState<{ url: string; title: string } | null>(null);

  // Debounce search slightly in variables to avoid rapid firing
  const filters = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    category: filterCategory === 'all' ? null : filterCategory,
    search: search || null
  };

  const { data, loading, error } = useQuery<QueryData, QueryVars>(GET_ANNOUNCEMENTS, {
    variables: filters,
    fetchPolicy: 'cache-and-network',
  });

  const announcements = data?.announcements || [];
  const totalCount = data?.totalAnnouncements || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const categories = [
    { id: 'all', label: t('all_cat'), color: 'bg-gray-100 text-gray-600' },
    { id: 'urgent', label: t('urgent_cat'), color: 'bg-red-100 text-red-600' },
    { id: 'events', label: t('events_cat'), color: 'bg-green-100 text-green-600' },
    { id: 'services', label: t('services_cat'), color: 'bg-blue-100 text-blue-600' },
    { id: 'community', label: t('community_cat'), color: 'bg-purple-100 text-purple-600' },
    { id: 'general', label: t('general_cat'), color: 'bg-gray-100 text-gray-500' },
  ];

  const getCategoryTheme = (cat: string) => categories.find(c => c.id === cat) || categories[5];

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">

      {/* Secure PDF Viewer Overlay */}
      <AnimatePresence>
        {pdfToView && (
          <SecurePDFViewer
            url={pdfToView.url}
            title={pdfToView.title}
            onClose={() => setPdfToView(null)}
          />
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <div className="bg-white px-6 md:px-12 py-8 border-b border-gray-100 sticky top-0 z-20 shadow-sm/50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#1a3c2b] flex items-center gap-2">
              <FaBullhorn className="text-[#5E936C]" /> {t('Announcements')}
            </h1>
            <p className="text-sm font-bold text-gray-400 mt-1">{t('found_updates', { count: totalCount })}</p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_placeholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full md:w-64 pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5E936C] outline-none font-bold text-gray-600 text-sm"
              />
            </div>

            {/* Category Dropdown/Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setFilterCategory(cat.id); setPage(1); }}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border ${filterCategory === cat.id
                    ? 'bg-[#1a3c2b] text-white border-[#1a3c2b]'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-gray-200 rounded-3xl" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FaFilter className="text-4xl mb-4 opacity-50" />
            <p className="font-bold">{t('no_match_criteria')}</p>
            <button onClick={() => { setSearch(''); setFilterCategory('all'); }} className="mt-4 text-[#5E936C] font-bold hover:underline">{t('clear_filters')}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((ann) => {
              const theme = getCategoryTheme(ann.category);
              const date = parseISO(ann.createdAt);
              const isExpired = ann.expiresAt && !isAfter(parseISO(ann.expiresAt), new Date());
              if (isExpired) return null; // Client-side fallback filter if backend returns expired ones

              return (
                <motion.div
                  key={ann.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${theme.color}`}>
                      {theme.label}
                    </span>
                    <span className="text-xs font-bold text-gray-400">{format(date, 'MMM dd')}</span>
                  </div>

                  {/* Pinned Icon */}
                  {ann.isPinned && <div className="absolute top-0 right-0 p-4"><FaThumbtack className="text-amber-400 rotate-45" /></div>}

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#1a3c2b] mb-3 leading-tight line-clamp-2 md:group-hover:text-[#5E936C] transition-colors">
                      {ann.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">
                      {ann.content}
                    </p>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(ann.eventDate || ann.location) && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                          <FaMapMarkerAlt /> {ann.location || t('events_cat')}
                        </div>
                      )}
                      {ann.attachmentUrl && (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md">
                          <FaFilePdf /> {t('document_label')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-gray-50 flex gap-2">
                    <button
                      onClick={() => setSelectedAnnouncement(ann)}
                      className="flex-1 py-3 bg-gray-50 rounded-xl text-xs font-black uppercase tracking-wider text-gray-600 hover:bg-[#1a3c2b] hover:text-white transition-colors"
                    >
                      {t('read_more')}
                    </button>
                    {ann.attachmentUrl && (
                      <button
                        onClick={() => setPdfToView({ url: ann.attachmentUrl!, title: ann.title })}
                        className="px-4 py-3 bg-red-50 rounded-xl text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                        title={t('view_pdf')}
                      >
                        <FaEye />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center items-center gap-4">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition"
            >
              <FaChevronLeft />
            </button>

            <div className="text-sm font-bold text-gray-400">
              {t('page_of', { current: page, total: totalPages })}
            </div>

            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-100 transition"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="p-8 pb-0 flex items-start justify-between">
                <div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500`}>
                    {getCategoryTheme(selectedAnnouncement.category).label}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-[#1a3c2b] mt-4 mb-2">
                    {selectedAnnouncement.title}
                  </h2>
                </div>
                <button onClick={() => setSelectedAnnouncement(null)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition"><FaTimes /></button>
              </div>

              <div className="overflow-y-auto p-8">
                <div className="prose prose-green max-w-none text-gray-600 font-medium leading-relaxed">
                  {selectedAnnouncement.content}
                </div>

                {selectedAnnouncement.attachmentUrl && (
                  <div className="mt-8">
                    <button
                      onClick={() => { setSelectedAnnouncement(null); setPdfToView({ url: selectedAnnouncement.attachmentUrl!, title: selectedAnnouncement.title }); }}
                      className="w-full py-4 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center gap-3 text-red-600 font-bold hover:bg-red-500 hover:text-white transition-all group"
                    >
                      <FaLock />
                      <span>{t('view_secure_doc')}</span>
                      <FaEye className="opacity-50 group-hover:opacity-100" />
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2">{t('doc_protected')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TodayAnnouncements;

// Revision note [2026-07-18 14:31:10 +0300]: Update button hover states and active indicators

// Revision note [2026-08-01 18:38:26 +0300]: Optimize Apollo Client GraphQL queries

// Activity update [2026-07-16 09:24:17 +0300]: Update button hover states and active indicators
