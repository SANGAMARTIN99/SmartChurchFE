import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { 
  FaBookOpen, FaPlay, FaPause, FaRegBookmark, FaBookmark, FaShareAlt, 
  FaChevronLeft, FaChevronRight, FaPrayingHands, FaTwitter, FaWhatsapp
} from 'react-icons/fa';
import { 
  GET_DEVOTIONALS,
  GET_MY_DEVOTIONAL_INTERACTION,
  TOGGLE_AMEN,
  TOGGLE_BOOKMARK,
  SAVE_JOURNAL,
} from '../../api/queries';

type Devotional = {
  id: string;
  title: string;
  content: string;
  scripture?: string;
  publishedAt?: string;
  author?: { fullName?: string } | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  amenCount?: number;
};

const TheWordOfTheDay: React.FC = () => {
  // pagination state for browsing devotionals by day
  const [offset, setOffset] = useState<number>(0);
  const [amenCount, setAmenCount] = useState<number>(0);
  const [amened, setAmened] = useState<boolean>(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [journal, setJournal] = useState<string>('');

  // main devotional
  const { data, loading, error, refetch } = useQuery(
    GET_DEVOTIONALS,
    { variables: { limit: 1, offset }, fetchPolicy: 'cache-and-network' }
  );

  // related devotionals (next 6)
  const relatedQuery = useQuery(
    GET_DEVOTIONALS,
    { variables: { limit: 6, offset: offset + 1 }, fetchPolicy: 'cache-first' }
  );

  const devotional: Devotional | undefined = data?.devotionals?.[0];
  const related: Devotional[] = relatedQuery?.data?.devotionals || [];

  const devotionalId = devotional?.id;
  const { data: interactionData, refetch: refetchInteraction } = useQuery(
    GET_MY_DEVOTIONAL_INTERACTION,
    { variables: { devotionalId: devotionalId as string }, skip: !devotionalId }
  );

  const [toggleBookmarkMut] = useMutation(TOGGLE_BOOKMARK);
  const [toggleAmenMut] = useMutation(TOGGLE_AMEN);
  const [saveJournalMut] = useMutation(SAVE_JOURNAL);

  // derive pretty date and safe content
  const publishedDate = useMemo(() => {
    const d = devotional?.publishedAt ? parseISO(devotional.publishedAt) : new Date();
    return format(d, 'EEEE, MMM dd, yyyy');
  }, [devotional?.publishedAt]);

  const contentParagraphs = useMemo(() => {
    return (devotional?.content || '').split(/\n\n+/).filter(Boolean);
  }, [devotional?.content]);

  // initialize from backend interaction when devotional changes
  useEffect(() => {
    // reset counts and states when switching devotional
    setAmenCount(devotional?.amenCount || 0);
    if (interactionData?.myDevotionalInteraction) {
      setBookmarked(!!interactionData.myDevotionalInteraction.bookmarked);
      setAmened(!!interactionData.myDevotionalInteraction.amened);
      const j = interactionData.myDevotionalInteraction.journal || '';
      setJournal(j);
    } else {
      // fallback to local storage if not authenticated or query skipped
      const saved = localStorage.getItem('sc_prayer_journal');
      if (saved) setJournal(saved);
      const savedBookmarks = JSON.parse(localStorage.getItem('sc_bookmarks') || '[]') as string[];
      setBookmarked(devotional ? savedBookmarks.includes(devotional.id) : false);
      const amenSet = JSON.parse(localStorage.getItem('sc_amen') || '{}') as Record<string, { count: number; amened: boolean }>;
      if (devotional && amenSet[devotional.id]) {
        setAmenCount(amenSet[devotional.id].count);
        setAmened(amenSet[devotional.id].amened);
      }
    }
  }, [devotional?.id, interactionData?.myDevotionalInteraction]);

  const toggleBookmark = async () => {
    if (!devotionalId) return;
    // optimistic
    setBookmarked((b) => !b);
    try {
      const res = await toggleBookmarkMut({ variables: { devotionalId } });
      if (res?.data?.toggleBookmark?.bookmarked !== undefined) {
        setBookmarked(!!res.data.toggleBookmark.bookmarked);
      }
    } catch (e) {
      // revert optimistic on error
      setBookmarked((b) => !b);
    }
  };

  const onAmen = async () => {
    if (!devotionalId) return;
    // optimistic
    setAmened((a) => !a);
    setAmenCount((c) => (amened ? Math.max(0, c - 1) : c + 1));
    try {
      const res = await toggleAmenMut({ variables: { devotionalId } });
      if (res?.data?.toggleAmen) {
        setAmened(!!res.data.toggleAmen.amened);
        if (typeof res.data.toggleAmen.amenCount === 'number') {
          setAmenCount(res.data.toggleAmen.amenCount);
        }
      }
    } catch (e) {
      // revert
      setAmened((a) => !a);
      setAmenCount((c) => (amened ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const saveJournal = async () => {
    if (!devotionalId) {
      // fallback store locally when not authenticated
      localStorage.setItem('sc_prayer_journal', journal);
      return;
    }
    try {
      await saveJournalMut({ variables: { devotionalId, text: journal } });
    } catch (e) {
      // fallback cache
      localStorage.setItem('sc_prayer_journal', journal);
    }
  };

  const shareText = useMemo(() => {
    const base = `${devotional?.title || 'Word of the Day'}${devotional?.scripture ? ' - ' + devotional.scripture : ''}`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    return `${base}\n${url}`.trim();
  }, [devotional?.title, devotional?.scripture]);

  const shareTo = (platform: 'twitter' | 'whatsapp') => {
    const text = encodeURIComponent(shareText);
    const url =
      platform === 'twitter'
        ? `https://twitter.com/intent/tweet?text=${text}`
        : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const onPrev = async () => {
    if (offset <= 0) return;
    setOffset((o) => Math.max(0, o - 1));
    await refetch({ limit: 1, offset: Math.max(0, offset - 1) });
  };

  const onNext = async () => {
    setOffset((o) => o + 1);
    await refetch({ limit: 1, offset: offset + 1 });
  };

  // Audio controls via ref to native element
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const togglePlay = () => {
    if (!audioEl) return;
    if (audioEl.paused) {
      audioEl.play();
      setIsPlaying(true);
    } else {
      audioEl.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-[#E8FFD7] to-[#93DA97] overflow-y-auto scrollbar-hide mt-12">
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2f5c3a] tracking-tight flex items-center gap-2">
              <FaBookOpen className="text-[#5E936C]" /> Word of the Day
            </h1>
            <p className="text-gray-600 mt-1">{publishedDate}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrev} disabled={offset === 0} className={`p-2 rounded-lg border text-[#2f5c3a] transition ${offset === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/70 bg-white'}`}>
              <FaChevronLeft />
            </button>
            <button onClick={onNext} className="p-2 rounded-lg border text-[#2f5c3a] hover:bg-white/70 bg-white transition">
              <FaChevronRight />
            </button>
          </div>
        </div>

        {/* Content card */}
        <AnimatePresence mode="wait">
          <motion.section
            key={devotional?.id || `loading-${offset}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Media banner */}
            <div className="relative h-48 md:h-64 bg-[#dff6df]">
              {devotional?.imageUrl ? (
                <img src={devotional.imageUrl} alt={devotional.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#5E936C]">
                  <FaBookOpen className="text-4xl opacity-60" />
                </div>
              )}
              {devotional?.scripture && (
                <div className="absolute bottom-3 left-3 bg-white/90 text-[#2f5c3a] px-3 py-1 rounded-full text-sm font-medium shadow">
                  {devotional.scripture}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Title and meta */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-[#2f5c3a]">{devotional?.title || (loading ? 'Loading...' : 'Devotional')}</h2>
                  <p className="text-sm text-gray-500 mt-1">By {devotional?.author?.fullName || 'Church'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={onAmen} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${amened ? 'bg-[#E8FFD7] text-[#2f5c3a] border-[#93DA97]' : 'hover:bg-gray-50'}`}>
                    <FaPrayingHands /> Amen <span className="text-[#2f5c3a] font-semibold">{amenCount}</span>
                  </button>
                  <button onClick={toggleBookmark} className="px-3 py-2 rounded-lg border hover:bg-gray-50 transition" title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
                    {bookmarked ? <FaBookmark className="text-[#5E936C]" /> : <FaRegBookmark />}
                  </button>
                  <div className="relative group">
                    <button className="px-3 py-2 rounded-lg border hover:bg-gray-50 transition">
                      <FaShareAlt />
                    </button>
                    <div className="absolute right-0 mt-2 hidden group-hover:block bg-white border rounded-lg shadow p-2 z-10">
                      <button onClick={() => shareTo('twitter')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded w-full text-sm"><FaTwitter className="text-sky-500" /> Twitter</button>
                      <button onClick={() => shareTo('whatsapp')} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded w-full text-sm"><FaWhatsapp className="text-green-600" /> WhatsApp</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scripture highlight */}
              {devotional?.scripture && (
                <div className="mt-5 border-l-4 border-[#5E936C] bg-[#F5FFF0] p-4 rounded-r-xl text-[#2f5c3a]">
                  <p className="italic">“{devotional.scripture}”</p>
                </div>
              )}

              {/* Main content */}
              <div className="mt-6 space-y-4 leading-7 text-gray-700">
                {loading && (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                )}
                {!loading && !error && contentParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {error && (
                  <div className="text-red-600">Failed to load devotional. Please try again.</div>
                )}
              </div>

              {/* Audio player */}
              {devotional?.audioUrl && (
                <div className="mt-6 flex items-center gap-3 bg-[#E8FFD7] rounded-xl p-4">
                  <button onClick={togglePlay} className="h-12 w-12 flex items-center justify-center rounded-full bg-white shadow hover:shadow-md transition">
                    {isPlaying ? <FaPause className="text-[#2f5c3a]" /> : <FaPlay className="text-[#2f5c3a]" />}
                  </button>
                  <div className="flex-1">
                    <div className="text-sm text-[#2f5c3a] font-semibold">Listen to this devotional</div>
                    <audio ref={setAudioEl} src={devotional.audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} className="w-full mt-2" controls />
                  </div>
                </div>
              )}

              {/* Video player */}
              {devotional?.videoUrl && (
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="text-sm text-[#2f5c3a] font-semibold mb-2">Watch related video</div>
                  <video
                    src={devotional.videoUrl}
                    className="w-full max-h-[420px] rounded-lg bg-black"
                    controls
                    playsInline
                  />
                </div>
              )}

              {/* Prayer journal */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[#2f5c3a]">Prayer Journal</h3>
                <p className="text-sm text-gray-500">Write your reflections or prayers inspired by today’s word. Saved locally to your device.</p>
                <textarea
                  className="mt-3 w-full min-h-[120px] p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E936C]"
                  placeholder="Dear Lord..."
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-500">{journal.length} characters</span>
                  <button onClick={saveJournal} className="px-4 py-2 rounded-lg bg-[#5E936C] text-white hover:bg-[#4a7a58]">Save</button>
                </div>
              </div>
            </div>
          </motion.section>
        </AnimatePresence>

        {/* Related devotionals */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-[#2f5c3a]">More Devotionals</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedQuery.loading && (
              <>
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow p-4 animate-pulse h-36" />
                ))}
              </>
            )}
            {!relatedQuery.loading && related.map((d) => (
              <motion.div
                key={d.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-xl shadow p-4 border border-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-[#E8FFD7] flex items-center justify-center shrink-0">
                    <FaBookOpen className="text-[#5E936C]" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[#2f5c3a] truncate" title={d.title}>{d.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {d.publishedAt ? format(parseISO(d.publishedAt), 'MMM dd, yyyy') : 'Recent'}
                    </p>
                    {d.scripture && (
                      <span className="inline-block mt-2 text-[11px] bg-[#F5FFF0] text-[#2f5c3a] px-2 py-1 rounded-full">{d.scripture}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TheWordOfTheDay;

