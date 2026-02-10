import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaPray, FaSearch, FaChevronRight, FaChevronLeft,
  FaCheckCircle, FaClock, FaCommentDots, FaUserCircle,
  FaTimes, FaPaperPlane, FaQuoteLeft
} from 'react-icons/fa';
import { GET_PRAYER_REQUESTS } from '../../api/queries';
import { CREATE_PRAYER_REPLY, MARK_PRAYER_AS_PRAYED } from '../../api/mutations';

// Types aligned with backend PastorQuery.prayer_requests
interface PrayerRequestItem {
  id: string;
  member: string; // full name
  request: string;
  date: string; // YYYY-MM-DD
  status: string; // PENDING/PRAYED/ANSWERED
  replies?: { responder: string; message: string; date: string }[];
}

interface PrayerRequestsData {
  prayerRequests: PrayerRequestItem[];
  totalPrayerRequests: number;
}

const PrayerRequests = () => {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequestItem | null>(null);
  const [replyText, setReplyText] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data, loading, error, refetch } = useQuery<PrayerRequestsData>(GET_PRAYER_REQUESTS, {
    variables: {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      status: statusFilter || null,
      search: searchTerm || null
    },
    fetchPolicy: 'network-only',
  });

  const [markPrayed] = useMutation(MARK_PRAYER_AS_PRAYED, {
    refetchQueries: [{ query: GET_PRAYER_REQUESTS }],
  });
  const [createReply, { loading: replying }] = useMutation(CREATE_PRAYER_REPLY, {
    refetchQueries: [{ query: GET_PRAYER_REQUESTS }],
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // Handle marking as prayed when opening a pending request
  useEffect(() => {
    (async () => {
      if (selectedRequest && selectedRequest.status === 'PENDING') {
        try {
          await markPrayed({ variables: { input: { id: parseInt(selectedRequest.id, 10) } } });
          await refetch();
        } catch { }
      }
    })();
  }, [selectedRequest]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const requests = data?.prayerRequests || [];
  const totalCount = data?.totalPrayerRequests || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'PRAYED': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ANSWERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7FCF5] flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <FaTimes className="text-5xl text-red-400 mx-auto mb-4" />
          <p className="text-gray-800 font-medium">{t('error_loading_prayer_requests')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FCF5] pt-20 pb-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl font-extrabold text-[#1A2E1F] flex items-center gap-3">
              <FaPray className="text-[#5E936C]" />
              {t('prayer_requests_title')}
            </h1>
            <p className="text-gray-500 mt-2 font-medium">{t('interceding_message', { count: totalCount })}</p>
          </motion.div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-3xl shadow-sm p-4 mb-8 flex flex-col md:flex-row gap-4 items-center border border-gray-100">
          <div className="relative flex-1 w-full">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder_prayer')}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-2xl focus:ring-2 focus:ring-[#5E936C] border-none text-gray-700 placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 whitespace-nowrap">
              {['', 'PENDING', 'PRAYED', 'ANSWERED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${statusFilter === f
                    ? 'bg-[#5E936C] text-white shadow-md'
                    : 'text-gray-500 hover:text-[#5E936C]'
                    }`}
                >
                  {f === '' ? t('filter_all') : t(f.toLowerCase())}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feed Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#5E936C] border-t-transparent"></div>
            <p className="mt-4 text-gray-500 animate-pulse font-medium">{t('seeking_heavens')}</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <FaPray className="text-6xl text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 text-lg font-medium">{t('no_requests_found')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode='popLayout'>
                {requests.map((pr) => (
                  <motion.div
                    key={pr.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedRequest(pr)}
                    className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-xl hover:border-[#E8FFD7] transition-all relative overflow-hidden group"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E8FFD7] opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#E8FFD7] text-[#5E936C] rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm">
                          {pr.member.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#1A2E1F] line-clamp-1">{pr.member}</h3>
                          <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                            <FaClock className="mr-1" />
                            {formatDate(pr.date)}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase border ${getStatusStyle(pr.status)} shadow-sm`}>
                        {pr.status}
                      </div>
                    </div>

                    <div className="relative mb-6">
                      <FaQuoteLeft className="absolute -left-2 -top-2 text-[#E8FFD7] text-2xl opacity-50" />
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 pl-4 italic">
                        {pr.request}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 relative z-10">
                      <div className="flex items-center gap-1 text-gray-400 text-xs font-semibold">
                        <FaCommentDots className="text-[#5E936C]" />
                        {pr.replies?.length || 0} {t('replies_label')}
                      </div>
                      <button className="flex items-center gap-1 text-[#5E936C] text-xs font-bold hover:gap-2 transition-all">
                        {t('respond_label')} <FaChevronRight className="text-[10px]" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-[#5E936C] disabled:opacity-30 hover:bg-[#E8FFD7] transition-all"
                >
                  <FaChevronLeft />
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-12 h-12 rounded-2xl font-bold transition-all ${currentPage === p
                        ? 'bg-[#5E936C] text-white shadow-lg scale-110'
                        : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-[#5E936C] disabled:opacity-30 hover:bg-[#E8FFD7] transition-all"
                >
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modern Modal Overlay */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRequest(null)}
              className="absolute inset-0 bg-[#1A2E1F]/60 backdrop-blur-sm"
            />

            <motion.div
              layoutId={selectedRequest.id}
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-8 pb-4 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#E8FFD7] text-[#5E936C] rounded-3xl flex items-center justify-center font-bold text-2xl shadow-inner">
                    {selectedRequest.member.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#1A2E1F]">{selectedRequest.member}</h2>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase border ${getStatusStyle(selectedRequest.status)}`}>
                        {selectedRequest.status}
                      </span>
                      <span className="text-xs text-gray-400 font-bold">{formatDate(selectedRequest.date)}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-[#FFE5E5] hover:text-red-400 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <div className="bg-[#F7FCF5] p-6 rounded-[2rem] border border-[#E8FFD7] relative">
                  <FaQuoteLeft className="absolute -left-3 -top-3 text-[#5E936C] text-3xl opacity-20" />
                  <p className="text-gray-700 text-lg leading-relaxed font-serif italic pl-4">
                    "{selectedRequest.request}"
                  </p>
                </div>

                {/* Replies Thread */}
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FaCommentDots className="text-[#5E936C]" />
                    {t('pastoral_responses_title')}
                  </h3>

                  <div className="space-y-4">
                    {selectedRequest.replies && selectedRequest.replies.length > 0 ? (
                      selectedRequest.replies.map((reply, i) => (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={i}
                          className="flex gap-3"
                        >
                          <div className="flex-shrink-0">
                            <FaUserCircle className="text-[#5E936C] text-3xl mt-1 opacity-50" />
                          </div>
                          <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100 flex-1">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-black text-[#5E936C] uppercase tracking-wider">{reply.responder}</span>
                              <span className="text-[9px] text-gray-400 font-bold">{reply.date}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed font-medium">{reply.message}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm font-medium">{t('no_responses')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer - Sticky Reply Box */}
              <div className="p-6 bg-white border-t border-gray-50">
                <div className="flex flex-col gap-3">
                  <div className="relative group">
                    <textarea
                      placeholder={t('type_encouragement_placeholder')}
                      className="w-full h-32 p-5 bg-gray-50 rounded-[2rem] focus:ring-4 focus:ring-[#E8FFD7] border-none text-gray-700 placeholder-gray-400 resize-none font-medium transition-all"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <FaPaperPlane className={`absolute right-6 bottom-6 text-[#5E936C] transition-opacity duration-300 ${replyText ? 'opacity-100' : 'opacity-20'}`} />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        if (!selectedRequest) return;
                        try {
                          await markPrayed({ variables: { input: { id: parseInt(selectedRequest.id, 10) } } });
                          await refetch();
                        } catch { }
                      }}
                      className="flex-1 py-4 bg-[#E8FFD7] text-[#5E936C] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#d4f5bc] transition-all flex items-center justify-center gap-2 border border-[#d4f5bc]"
                    >
                      <FaCheckCircle /> {t('mark_prayed_btn')}
                    </button>
                    <button
                      disabled={!replyText.trim() || replying}
                      onClick={async () => {
                        if (!selectedRequest) return;
                        try {
                          await createReply({
                            variables: {
                              input: {
                                prayerId: parseInt(selectedRequest.id, 10),
                                message: replyText.trim()
                              }
                            }
                          });
                          setReplyText('');
                          await refetch();
                        } catch { }
                      }}
                      className="flex-[2] py-4 bg-[#5E936C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A2E1F] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[#5E936C]/20"
                    >
                      {replying ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : t('direct_reply_btn')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrayerRequests;