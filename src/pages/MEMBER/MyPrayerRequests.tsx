import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPrayingHands, FaUsers, FaUserTie, FaUserFriends, FaShareAlt,
  FaPlus, FaLock, FaUnlock, FaHistory, FaExclamationCircle, FaCheckCircle, FaPaperPlane
} from 'react-icons/fa';
import { ME_QUERY, GET_PRAYER_REQUESTS } from '../../api/queries';
import { CREATE_PRAYER_REQUEST, MEMBER_MARK_PRAYER_ANSWERED } from '../../api/mutations';

type PrayerItem = {
  id: string;
  member: string;
  request: string;
  date: string;
  status: string;
  replies?: { responder: string; message: string; date: string }[];
};

type RecipientKey = 'PASTOR' | 'ASSISTANT_PASTOR' | 'EVANGELIST' | 'PRAYER_TEAM' | 'MEMBER';
type RecipientOption = { key: RecipientKey; label: string; icon: React.ReactNode; description: string };

const recipientOptions: RecipientOption[] = [
  { key: 'PASTOR', label: 'Pastor', icon: <FaUserTie />, description: 'Send directly to the Pastor' },
  { key: 'ASSISTANT_PASTOR', label: 'Assistant Pastor', icon: <FaUserTie />, description: 'Send to the Assistant Pastor' },
  { key: 'EVANGELIST', label: 'Evangelist', icon: <FaUserFriends />, description: 'Reach out to the Evangelist team' },
  { key: 'PRAYER_TEAM', label: 'Prayer Team', icon: <FaUsers />, description: 'Share with the dedicated prayer team' },
  { key: 'MEMBER', label: 'Specific Member', icon: <FaUsers />, description: 'Connect with a specific member' },
];

const MyPrayerRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compose' | 'mine' | 'community'>('compose');
  const [text, setText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [recipient, setRecipient] = useState<RecipientKey>('PASTOR');
  const [specificMember, setSpecificMember] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const meQuery = useQuery(ME_QUERY);
  const { data: prayersData, loading: prayersLoading, error: prayersError, refetch } = useQuery(GET_PRAYER_REQUESTS, { fetchPolicy: 'cache-and-network' });

  const [createPrayer] = useMutation(CREATE_PRAYER_REQUEST, {
    refetchQueries: [{ query: GET_PRAYER_REQUESTS }],
  });
  const [markAnswered] = useMutation(MEMBER_MARK_PRAYER_ANSWERED, {
    refetchQueries: [{ query: GET_PRAYER_REQUESTS }],
  });

  const me = meQuery.data?.me;
  const myName: string | undefined = me?.fullName;
  const myIdRaw: string | undefined = me?.id;
  const myId = useMemo(() => {
    if (!myIdRaw) return undefined;
    const n = parseInt(myIdRaw as string, 10);
    return Number.isNaN(n) ? undefined : n;
  }, [myIdRaw]);

  const prayers: PrayerItem[] = prayersData?.prayerRequests || [];
  const myPrayers = useMemo(() => (myName ? prayers.filter((p) => p.member === myName) : []), [prayers, myName]);
  const communityPrayers = useMemo(() => (myName ? prayers.filter((p) => p.member !== myName) : prayers), [prayers, myName]);

  const resetForm = () => {
    setText('');
    setIsPublic(false);
    setRecipient('PASTOR');
    setSpecificMember('');
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!myId) {
      setSubmitError('You must be signed in to send a prayer request.');
      return;
    }
    if (!text.trim()) {
      setSubmitError('Please write your prayer first.');
      return;
    }

    const composed = `[To: ${recipient}${recipient === 'MEMBER' && specificMember ? ` (${specificMember})` : ''}]\n${text}`;

    setSubmitting(true);
    try {
      await createPrayer({
        variables: {
          input: {
            request: composed,
            isPublic: isPublic,
            memberId: myId,
          },
        },
      });
      setSubmitSuccess('Prayer sent successfully.');
      resetForm();
      setActiveTab('mine');
    } catch (err: any) {
      const msg = err?.message || 'Failed to send prayer.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
      refetch();
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  const PrayerList: React.FC<{ items: PrayerItem[]; emptyLabel: string }> = ({ items, emptyLabel }) => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {items.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-16 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
          <FaPrayingHands className="mx-auto text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">{emptyLabel}</p>
        </motion.div>
      ) : (
        items.map((p) => (
          <motion.div
            key={p.id}
            variants={itemVariants}
            className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover:border-green-100"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                    <FaUserTie className="text-[10px]" />
                    {p.member}
                  </span>
                  <span className="text-xs text-gray-400 font-medium tracking-wide">• {p.date}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'ANSWERED' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {p.status}
                  </span>
                </div>

                <p className="text-gray-700 leading-relaxed whitespace-pre-line break-words text-sm md:text-base">
                  {p.request}
                </p>

                {p.replies && p.replies.length > 0 && (
                  <div className="mt-5 space-y-3">
                    {p.replies.map((r, idx) => (
                      <div key={idx} className="relative pl-4 sm:pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-green-200">
                        <div className="bg-green-50/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-green-800">{r.responder}</span>
                            <span className="text-[10px] text-gray-400">{r.date}</span>
                          </div>
                          <p className="text-sm text-gray-600">{r.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 flex flex-col items-end gap-2">
                <span className="text-[10px] font-mono text-gray-300">#{p.id}</span>
                {myName && p.member === myName && p.status !== 'ANSWERED' && (
                  <button
                    onClick={async () => {
                      try {
                        await markAnswered({ variables: { input: { id: parseInt(p.id, 10) } } });
                      } catch { }
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                    title="Mark as Answered"
                  >
                    <FaCheckCircle />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );

  return (
    <div className="min-h-full bg-[#f8fafc] pb-12">
      {/* Premium Header Background */}
      <div className="bg-gradient-to-br from-[#1a472a] via-[#2f5c3a] to-[#5E936C] h-48 sm:h-64 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] to-transparent opacity-20"></div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#f8fafc] to-transparent"></div>

        <main className="relative max-w-6xl mx-auto px-4 h-full flex flex-col justify-center pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight drop-shadow-sm flex items-center gap-3">
              <FaPrayingHands className="text-green-200 opacity-90" />
              Prayer Requests
            </h1>
            <p className="text-green-100 text-lg mt-2 max-w-2xl font-light">
              Share your burdens, celebrate your victories, and join in prayer with your community.
            </p>
          </motion.div>
        </main>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-12 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { id: 'compose', label: 'Compose New', icon: <FaPlus /> },
                { id: 'mine', label: 'My Prayers', icon: <FaHistory /> },
                { id: 'community', label: 'Community', icon: <FaShareAlt /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    relative px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'bg-white text-green-800 shadow-md ring-1 ring-black/5'
                      : 'bg-white/60 text-gray-600 hover:bg-white hover:text-green-700 hover:shadow-sm'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-4 right-4 h-0.5 bg-green-600 rounded-full"
                    />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'compose' && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl shadow-xl shadow-green-900/5 overflow-hidden border border-white"
                >
                  {/* Form Header */}
                  <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50/50 to-transparent">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-sm"><FaPaperPlane /></span>
                      New Prayer Request
                    </h2>
                  </div>

                  <form onSubmit={onSubmit} className="p-6 md:p-8">
                    {/* Visibility Toggle */}
                    <div className="flex justify-end mb-6">
                      <div className="bg-gray-100 p-1 rounded-lg inline-flex relative">
                        <div className={`absolute inset-y-1 rounded-md bg-white shadow-sm transition-all duration-200 ${isPublic ? 'left-1/2 w-[calc(50%-4px)]' : 'left-1 w-[calc(50%-4px)]'}`}></div>
                        <button
                          type="button"
                          onClick={() => setIsPublic(false)}
                          className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${!isPublic ? 'text-gray-800' : 'text-gray-500'}`}
                        >
                          <span className="flex items-center gap-1.5"><FaLock size={10} /> Private</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsPublic(true)}
                          className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${isPublic ? 'text-green-700' : 'text-gray-500'}`}
                        >
                          <span className="flex items-center gap-1.5"><FaUnlock size={10} /> Public</span>
                        </button>
                      </div>
                    </div>

                    {/* Recipient Grid */}
                    <div className="mb-8">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Send To</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {recipientOptions.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setRecipient(opt.key)}
                            className={`
                               relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 group
                               ${recipient === opt.key
                                ? 'border-green-500 bg-green-50/50 text-green-900 shadow-sm ring-1 ring-green-500/20'
                                : 'border-gray-200 bg-white hover:border-green-200 hover:shadow-md'
                              }
                             `}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${recipient === opt.key ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-500'
                              }`}>
                              {opt.icon}
                            </div>
                            <div>
                              <div className="font-semibold text-sm">{opt.label}</div>
                              <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{opt.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {recipient === 'MEMBER' && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                          <input
                            type="text"
                            value={specificMember}
                            onChange={(e) => setSpecificMember(e.target.value)}
                            className="w-full p-4 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all text-sm placeholder:text-gray-400"
                            placeholder="Enter the specific member's name..."
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="mb-6">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Prayer</label>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={6}
                        className="w-full p-4 text-gray-700 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:bg-white transition-all resize-none placeholder:text-gray-400"
                        placeholder="Pour out your heart here..."
                      />
                    </div>

                    {/* Feedback Messages */}
                    <AnimatePresence>
                      {submitError && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-3">
                          <FaExclamationCircle /> {submitError}
                        </motion.div>
                      )}
                      {submitSuccess && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-4 p-4 rounded-xl bg-green-50 text-green-700 text-sm flex items-center gap-3">
                          <FaCheckCircle /> {submitSuccess}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`
                           px-8 py-3 rounded-xl font-semibold text-white shadow-lg shadow-green-600/20 transition-all duration-300
                           ${submitting
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-[#2f5c3a] to-[#4a7a58] hover:translate-y-[-2px] hover:shadow-green-600/30'
                          }
                         `}
                      >
                        {submitting ? 'Sending...' : 'Send Prayer'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'mine' && (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-1">
                  {prayersLoading ? (
                    <div className="p-12 text-center text-gray-400">Loading your prayers...</div>
                  ) : prayersError ? (
                    <div className="p-12 text-center text-red-400">Unable to load prayers.</div>
                  ) : (
                    <PrayerList items={myPrayers} emptyLabel="You haven't shared any prayers yet." />
                  )}
                </div>
              )}

              {activeTab === 'community' && (
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-1">
                  {prayersLoading ? (
                    <div className="p-12 text-center text-gray-400">Loading community prayers...</div>
                  ) : prayersError ? (
                    <div className="p-12 text-center text-red-400">Unable to load community prayers.</div>
                  ) : (
                    <PrayerList items={communityPrayers} emptyLabel="No community prayers to show." />
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 shrink-0 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-xl shadow-green-900/5 p-6 border border-white"
            >
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Tips for Sharing</h2>
              <ul className="space-y-4">
                {[
                  { text: 'Keep it clear and concise.', color: 'bg-blue-100 text-blue-600' },
                  { text: 'Use "Private" for sensitive matters.', color: 'bg-amber-100 text-amber-600' },
                  { text: 'Be specific so we can pray effectively.', color: 'bg-green-100 text-green-600' }
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${tip.color}`}>{i + 1}</span>
                    <span className="leading-snug">{tip.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#2f5c3a] to-[#1a3d26] rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
            >
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '16px 16px' }}></div>

              <h2 className="text-sm font-bold text-green-200 uppercase tracking-widest mb-4 relative z-10">Prayer Stats</h2>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                  <div className="text-3xl font-bold">{myPrayers.length}</div>
                  <div className="text-[10px] text-green-200 uppercase tracking-wider mt-1">My Prayers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center border border-white/10">
                  <div className="text-3xl font-bold">{prayers.length}</div>
                  <div className="text-[10px] text-green-200 uppercase tracking-wider mt-1">Total Active</div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MyPrayerRequests;
