import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import {
  FaBookOpen, FaPlay, FaPause, FaRegBookmark, FaBookmark, FaShareAlt,
  FaChevronLeft, FaChevronRight, FaPrayingHands, FaTwitter, FaWhatsapp, FaCalendarCheck
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
  const { t } = useTranslation();
  // pagination state for browsing devotionals by day (0 = today/latest)
  const [offset, setOffset] = useState<number>(0);
  const [amenCount, setAmenCount] = useState<number>(0);
  const [amened, setAmened] = useState<boolean>(false);
  const [bookmarked, setBookmarked] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [journal, setJournal] = useState<string>('');

  // Audio
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  // Queries
  const { data, loading, error, refetch } = useQuery(
    GET_DEVOTIONALS,
    { variables: { limit: 1, offset }, fetchPolicy: 'cache-and-network' }
  );

  const relatedQuery = useQuery(
    GET_DEVOTIONALS,
    { variables: { limit: 3, offset: offset + 1 }, fetchPolicy: 'cache-first' }
  );

  const devotional: Devotional | undefined = data?.devotionals?.[0];
  const related: Devotional[] = relatedQuery?.data?.devotionals || [];
  const devotionalId = devotional?.id;

  const { data: interactionData } = useQuery(
    GET_MY_DEVOTIONAL_INTERACTION,
    { variables: { devotionalId: devotionalId as string }, skip: !devotionalId }
  );

  const [toggleBookmarkMut] = useMutation(TOGGLE_BOOKMARK);
  const [toggleAmenMut] = useMutation(TOGGLE_AMEN);
  const [saveJournalMut] = useMutation(SAVE_JOURNAL);

  // Formatting
  const publishedDate = useMemo(() => {
    const d = devotional?.publishedAt ? parseISO(devotional.publishedAt) : new Date();
    return format(d, 'MMMM dd, yyyy');
  }, [devotional?.publishedAt]);

  const contentParagraphs = useMemo(() => {
    return (devotional?.content || '').split(/\n\n+/).filter(Boolean);
  }, [devotional?.content]);

  // Effects
  useEffect(() => {
    setAmenCount(devotional?.amenCount || 0);
    if (interactionData?.myDevotionalInteraction) {
      setBookmarked(!!interactionData.myDevotionalInteraction.bookmarked);
      setAmened(!!interactionData.myDevotionalInteraction.amened);
      setJournal(interactionData.myDevotionalInteraction.journal || '');
    } else {
      // Local fallback
      const saved = localStorage.getItem('sc_prayer_journal');
      if (saved) setJournal(saved);
      // Reset other local states if needed, skipping complex local logic for brevity as we prefer auth
      setAmened(false);
      setBookmarked(false);
    }
  }, [devotional?.id, interactionData]);

  // Actions
  const toggleBookmark = async () => {
    if (!devotionalId) return;
    setBookmarked(prev => !prev);
    try { await toggleBookmarkMut({ variables: { devotionalId } }); } catch { setBookmarked(prev => !prev); }
  };

  const onAmen = async () => {
    if (!devotionalId) return;
    setAmened(prev => !prev);
    setAmenCount(prev => (amened ? Math.max(0, prev - 1) : prev + 1));
    try { await toggleAmenMut({ variables: { devotionalId } }); } catch {
      setAmened(prev => !prev);
      setAmenCount(prev => (amened ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const saveJournal = async () => {
    if (!devotionalId) { localStorage.setItem('sc_prayer_journal', journal); return; }
    try { await saveJournalMut({ variables: { devotionalId, text: journal } }); } catch { localStorage.setItem('sc_prayer_journal', journal); }
  };

  const togglePlay = () => {
    if (!audioEl) return;
    if (audioEl.paused) { audioEl.play(); setIsPlaying(true); }
    else { audioEl.pause(); setIsPlaying(false); }
  };

  const shareTo = (platform: 'twitter' | 'whatsapp') => {
    const text = encodeURIComponent(`${devotional?.title} - ${window.location.href}`);
    const url = platform === 'twitter' ? `https://twitter.com/intent/tweet?text=${text}` : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const onPrev = async () => { if (offset > 0) { setOffset(o => o - 1); } };
  const onNext = async () => { setOffset(o => o + 1); };

  if (loading && !devotional) return <div className="h-screen flex items-center justify-center"><div className="w-12 h-12 border-4 border-[#5E936C] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] overflow-hidden bg-[#F2F5F8] font-sans">

      {/* Scrollable Content Area */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div
            key={devotional?.id || offset}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-full pb-20"
          >

            {/* Hero Section */}
            <div className="relative h-[50vh] min-h-[400px] w-full bg-[#1a3c2b]">
              {devotional?.imageUrl ? (
                <motion.img
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.8 }}
                  src={devotional.imageUrl}
                  className="w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#1a3c2b] to-[#406851] opacity-80" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#F2F5F8] via-transparent to-black/30" />

              <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 max-w-5xl mx-auto">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-[#5E936C] text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">{t('Word of the Day')}</span>
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-[#1a3c2b] mb-4 drop-shadow-sm leading-tight">
                    {devotional?.title}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600 font-medium">
                    <span>{publishedDate}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                    <span>{t('by_author', { author: devotional?.author?.fullName || t('church_ministry') })}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Content Body */}
            <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10">

              {/* Main Card */}
              <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8">

                {/* Scripture Block */}
                {devotional?.scripture && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-l-4 border-[#5E936C] pl-6 mb-10 italic text-xl md:text-2xl text-gray-600 font-serif leading-relaxed"
                  >
                    "{devotional.scripture}"
                  </motion.div>
                )}

                {/* Audio Player */}
                {devotional?.audioUrl && (
                  <div className="bg-[#F7FCF5] rounded-2xl p-4 mb-10 flex items-center gap-4 border border-[#E8FFD7]">
                    <button onClick={togglePlay} className="w-14 h-14 bg-[#1a3c2b] rounded-full flex items-center justify-center text-white hover:scale-105 transition shadow-lg shrink-0">
                      {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-[#5E936C] uppercase tracking-wide mb-1">{t('audio_message')}</p>
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          animate={{ width: isPlaying ? '100%' : '0%' }}
                          transition={{ duration: 180, ease: 'linear' }}
                          className="h-full bg-[#5E936C]"
                        />
                      </div>
                      <audio ref={setAudioEl} src={devotional.audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div className="prose prose-lg prose-green max-w-none text-gray-700 leading-relaxed space-y-6">
                  {contentParagraphs.map((p, i) => (
                    <p key={i} className={i === 0 ? "first-letter:text-5xl first-letter:font-bold first-letter:text-[#1a3c2b] first-letter:mr-3 first-letter:float-left" : ""}>
                      {p}
                    </p>
                  ))}
                </div>

                {/* Video Embed */}
                {devotional?.videoUrl && (
                  <div className="mt-10 rounded-2xl overflow-hidden shadow-lg">
                    <video src={devotional.videoUrl} controls className="w-full bg-black" />
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
                  <div className="flex gap-4">
                    <button onClick={onAmen} className={`flex items-center gap-2 px-5 py-3 rounded-full font-bold transition-all ${amened ? 'bg-[#1a3c2b] text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      <FaPrayingHands /> {t('amen')} <span className="opacity-80 ml-1">{amenCount}</span>
                    </button>
                    <button onClick={toggleBookmark} className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${bookmarked ? 'bg-[#5E936C] text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {bookmarked ? <FaBookmark /> : <FaRegBookmark />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => shareTo('whatsapp')} className="w-12 h-12 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition"><FaWhatsapp size={20} /></button>
                    <button onClick={() => shareTo('twitter')} className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition"><FaTwitter size={20} /></button>
                  </div>
                </div>

              </div>

              {/* Interaction Section: Journal & Related */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Journal */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg p-8">
                  <h3 className="font-bold text-xl text-[#1a3c2b] mb-4">{t('my_prayer_journal')}</h3>
                  <textarea
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder={t('journal_placeholder')}
                    className="w-full p-4 bg-[#F2F5F8] rounded-xl border-none focus:ring-2 focus:ring-[#5E936C] min-h-[150px] resize-none"
                  />
                  <div className="flex justify-end mt-4">
                    <button onClick={saveJournal} className="px-6 py-2 bg-[#1a3c2b] text-white rounded-lg font-bold hover:bg-[#2d5c43] transition">
                      {t('save_entry')}
                    </button>
                  </div>
                </div>

                {/* Related / Nav */}
                <div className="space-y-6">
                  <div className="bg-white rounded-3xl shadow-lg p-6">
                    <h3 className="font-bold text-[#1a3c2b] mb-4">{t('navigation')}</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={onPrev}
                        disabled={offset === 0}
                        className="flex-1 py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                      >
                        <FaChevronLeft /> {t('newer')}
                      </button>
                      <button
                        onClick={onNext}
                        className="flex-1 py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-2 font-bold hover:bg-gray-50 transition"
                      >
                        {t('older')} <FaChevronRight />
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-lg p-6">
                    <h3 className="font-bold text-[#1a3c2b] mb-4">{t('more_devotionals')}</h3>
                    <div className="space-y-4">
                      {related.map(d => (
                        <div key={d.id} className="flex gap-3 items-start group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition">
                          <div className="w-12 h-12 bg-[#E8FFD7] rounded-lg flex items-center justify-center shrink-0">
                            <FaBookOpen className="text-[#5E936C]" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 text-sm line-clamp-1 group-hover:text-[#5E936C] transition">{d.title}</h4>
                            <p className="text-xs text-gray-500">{d.publishedAt ? format(parseISO(d.publishedAt), 'MMM dd') : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default TheWordOfTheDay;

// Revision note [2026-07-18 09:32:50 +0300]: Enhance member contribution table filters
