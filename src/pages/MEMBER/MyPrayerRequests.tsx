import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPrayingHands, FaUsers, FaUserTie, FaUserFriends, FaShareAlt, FaPlus, FaLock, FaUnlock, FaHistory, FaExclamationCircle } from 'react-icons/fa';
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
type RecipientOption = { key: RecipientKey; label: string; icon: React.ReactNode };

const recipientOptions: RecipientOption[] = [
  { key: 'PASTOR', label: 'Pastor', icon: <FaUserTie /> },
  { key: 'ASSISTANT_PASTOR', label: 'Assistant Pastor', icon: <FaUserTie /> },
  { key: 'EVANGELIST', label: 'Evangelist', icon: <FaUserFriends /> },
  { key: 'PRAYER_TEAM', label: 'Prayer Team', icon: <FaUsers /> },
  { key: 'MEMBER', label: 'Specific Member', icon: <FaUsers /> },
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

    // Temporary: recipient selection is UI-only. Preserve intent at top of message.
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

  const PrayerList: React.FC<{ items: PrayerItem[]; emptyLabel: string }> = ({ items, emptyLabel }) => (
    <div className="divide-y divide-gray-100">
      {items.length === 0 ? (
        <div className="text-center py-10 text-gray-500">{emptyLabel}</div>
      ) : (
        items.map((p) => (
          <div key={p.id} className="py-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaPrayingHands className="text-[#5E936C]" />
                  <span className="font-medium text-[#2f5c3a]">{p.member}</span>
                  <span>• {p.status}</span>
                  <span>• {p.date}</span>
                </div>
                <p className="mt-2 text-gray-700 whitespace-pre-line break-words">{p.request}</p>
                {p.replies && p.replies.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-[#E8FFD7]">
                    <div className="text-xs text-gray-500 mb-1">Replies</div>
                    <div className="space-y-2">
                      {p.replies.map((r, idx) => (
                        <div key={idx} className="bg-gray-50 rounded p-2">
                          <div className="text-xs text-gray-600">
                            <span className="font-medium text-[#2f5c3a]">{r.responder}</span> • {r.date}
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-line break-words">{r.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs text-gray-400 uppercase tracking-wide">#{p.id}</div>
                {myName && p.member === myName && p.status !== 'ANSWERED' && (
                  <button
                    onClick={async () => {
                      try {
                        await markAnswered({ variables: { input: { id: parseInt(p.id, 10) } } });
                      } catch {}
                    }}
                    className="mt-2 px-3 py-1 rounded bg-[#5E936C] text-white text-xs hover:bg-[#4a7a58] w-full"
                  >
                    Mark as Answered
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-[#E8FFD7] to-[#93DA97] overflow-x-hidden">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2f5c3a] tracking-tight flex items-center gap-2">
              <FaPrayingHands className="text-[#5E936C]" /> My Prayer Requests
            </h1>
            <p className="text-gray-600 mt-1">Share your prayer needs and view your history.</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 w-full sm:w-auto ${activeTab === 'compose' ? 'bg-white' : 'hover:bg-white/70 bg-white'}`}
            >
              <FaPlus /> Compose
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 w-full sm:w-auto ${activeTab === 'mine' ? 'bg-white' : 'hover:bg-white/70 bg-white'}`}
            >
              <FaHistory /> My Prayers
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 w-full sm:w-auto ${activeTab === 'community' ? 'bg-white' : 'hover:bg-white/70 bg-white'}`}
            >
              <FaShareAlt /> Community
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {activeTab === 'compose' && (
                <motion.section
                  key="compose"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <form onSubmit={onSubmit} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-[#2f5c3a] flex items-center gap-2">
                        <FaPlus /> New Prayer
                      </h2>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-gray-600">Visibility</span>
                        <button
                          type="button"
                          onClick={() => setIsPublic((v) => !v)}
                          className={`px-3 py-1 rounded-full text-white flex items-center gap-2 ${isPublic ? 'bg-[#5E936C]' : 'bg-gray-400'}`}
                          title={isPublic ? 'Public to community' : 'Private to recipients'}
                        >
                          {isPublic ? <FaUnlock /> : <FaLock />}
                          {isPublic ? 'Public' : 'Private'}
                        </button>
                      </div>
                    </div>

                    {/* Recipient selection (UI only for now) */}
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Send To</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {recipientOptions.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setRecipient(opt.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition ${recipient === opt.key ? 'border-[#5E936C] bg-[#E8FFD7] text-[#2f5c3a]' : 'hover:bg-gray-50'}`}
                          >
                            <span className="text-[#5E936C]">{opt.icon}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {recipient === 'MEMBER' && (
                        <input
                          type="text"
                          value={specificMember}
                          onChange={(e) => setSpecificMember(e.target.value)}
                          className="mt-3 w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E936C]"
                          placeholder="Enter member name (UI only for now)"
                        />
                      )}
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700 mb-2">Your Prayer</label>
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={8}
                        className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E936C]"
                        placeholder="Write your prayer here..."
                      />
                    </div>

                    {submitError && (
                      <div className="mb-3 flex items-center gap-2 text-red-600 text-sm">
                        <FaExclamationCircle /> <span>{submitError}</span>
                      </div>
                    )}
                    {submitSuccess && (
                      <div className="mb-3 text-[#2f5c3a] text-sm">{submitSuccess}</div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`px-5 py-3 rounded-lg text-white bg-[#5E936C] hover:bg-[#4a7a58] transition ${submitting ? 'opacity-70 cursor-wait' : ''}`}
                      >
                        {submitting ? 'Sending...' : 'Send Prayer'}
                      </button>
                    </div>
                  </form>
                </motion.section>
              )}

              {activeTab === 'mine' && (
                <motion.section
                  key="mine"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#2f5c3a]">My Prayers</h2>
                    <p className="text-gray-600 text-sm">A history of what you have shared.</p>
                  </div>
                  <div className="p-6">
                    {prayersLoading && <div className="text-gray-500">Loading...</div>}
                    {prayersError && <div className="text-red-600">Failed to load prayers. Please try again.</div>}
                    {!prayersLoading && !prayersError && (
                      <PrayerList items={myPrayers} emptyLabel="No prayers yet. Share your first prayer." />
                    )}
                  </div>
                </motion.section>
              )}

              {activeTab === 'community' && (
                <motion.section
                  key="community"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#2f5c3a]">Community Prayers</h2>
                    <p className="text-gray-600 text-sm">Prayers from other members.</p>
                  </div>
                  <div className="p-6">
                    {prayersLoading && <div className="text-gray-500">Loading...</div>}
                    {prayersError && <div className="text-red-600">Failed to load prayers. Please try again.</div>}
                    {!prayersLoading && !prayersError && (
                      <PrayerList items={communityPrayers} emptyLabel="No community prayers available right now." />
                    )}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#2f5c3a] mb-3">Tips for Sharing</h2>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>• Keep your message clear and concise.</li>
                <li>• Toggle Public/Private depending on sensitivity.</li>
                <li>• Add context that helps the prayer team pray specifically.</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#2f5c3a] mb-3">Stats</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#E8FFD7] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#2f5c3a]">{myPrayers.length}</div>
                  <div className="text-xs text-gray-600">My Prayers</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#2f5c3a]">{prayers.length}</div>
                  <div className="text-xs text-gray-600">Total Shown</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyPrayerRequests;
