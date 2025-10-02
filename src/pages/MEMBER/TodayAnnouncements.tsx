import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBullhorn, FaSearch, FaThumbtack, FaFilter, FaCalendarAlt, FaMapMarkerAlt, FaUserTie, FaTag, FaFilePdf, FaRedo } from 'react-icons/fa';
import { GET_ANNOUNCEMENTS } from '../../api/queries';

type Announcement = {
  id: string;
  title: string;
  content: string;
  category: 'events' | 'services' | 'community' | 'urgent' | 'general';
  isPinned: boolean;
  targetGroup?: { id: string; name: string } | null;
  eventDate?: string | null;
  eventTime?: string | null;
  location?: string | null;
  createdBy?: { id: string; fullName: string } | null;
  createdAt: string;
};

const categoryLabels: Record<Announcement['category'], string> = {
  events: 'Events',
  services: 'Service Changes',
  community: 'Community',
  urgent: 'Urgent',
  general: 'General',
};

const categoryColors: Record<Announcement['category'], string> = {
  events: 'bg-blue-100 text-blue-700',
  services: 'bg-amber-100 text-amber-700',
  community: 'bg-purple-100 text-purple-700',
  urgent: 'bg-red-100 text-red-700',
  general: 'bg-gray-100 text-gray-700',
};

const extractPdfLinks = (text: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s)]+\.pdf)/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
};

const TodayAnnouncements: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'pdfs'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Announcement['category'] | 'all'>('all');
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<{ announcements: Announcement[] }>(GET_ANNOUNCEMENTS, {
    fetchPolicy: 'cache-and-network',
  });

  const announcements = data?.announcements ?? [];

  const pdfItems = useMemo(() => {
    const items: { id: string; title: string; url: string; createdAt: string }[] = [];
    for (const a of announcements) {
      const links = extractPdfLinks(`${a.title} ${a.content}`);
      for (const url of links) {
        items.push({ id: `${a.id}-${url}`, title: a.title, url, createdAt: a.createdAt });
      }
    }
    return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [announcements]);

  const categoriesCount = useMemo(() => {
    const counts: Record<string, number> = {};
    announcements.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return counts;
  }, [announcements]);

  const filtered = useMemo(() => {
    let list = announcements.slice();
    if (activeTab === 'pinned') list = list.filter((a) => a.isPinned);
    if (categoryFilter !== 'all') list = list.filter((a) => a.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q) || a.createdBy?.fullName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => (a.isPinned === b.isPinned ? (a.createdAt < b.createdAt ? 1 : -1) : a.isPinned ? -1 : 1));
  }, [announcements, search, categoryFilter, activeTab]);

  const AnnouncementCard: React.FC<{ a: Announcement }> = ({ a }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white rounded-2xl shadow hover:shadow-xl transition overflow-hidden border border-gray-100"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs mb-2">
              {a.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8FFD7] text-[#2f5c3a]">
                  <FaThumbtack className="text-[#5E936C]" /> Pinned
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${categoryColors[a.category]}`}>
                <FaTag /> {categoryLabels[a.category]}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#2f5c3a] truncate" title={a.title}>{a.title}</h3>
            <p className="mt-2 text-gray-700 line-clamp-3 whitespace-pre-line">{a.content}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {a.eventDate && (
                <span className="inline-flex items-center gap-1"><FaCalendarAlt />{a.eventDate}{a.eventTime ? ` • ${a.eventTime}` : ''}</span>
              )}
              {a.location && (
                <span className="inline-flex items-center gap-1"><FaMapMarkerAlt />{a.location}</span>
              )}
              {a.createdBy && (
                <span className="inline-flex items-center gap-1"><FaUserTie />{a.createdBy.fullName}</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {extractPdfLinks(`${a.title} ${a.content}`).map((url) => (
            <button
              key={url}
              onClick={() => {
                setActiveTab('pdfs');
                setSelectedPdf(url);
              }}
              className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 hover:bg-red-100"
              title="Open PDF"
            >
              <FaFilePdf /> View PDF
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-full bg-gradient-to-br from-[#E8FFD7] to-[#93DA97]">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#2f5c3a] tracking-tight flex items-center gap-2">
              <FaBullhorn className="text-[#5E936C]" /> Today Announcements
            </h1>
            <p className="text-gray-600 mt-1">All updates from pastors, leaders, and group heads in one place.</p>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <button onClick={() => setActiveTab('all')} className={`px-3 py-2 rounded-lg border transition ${activeTab==='all'?'bg-white':'bg-white hover:bg-white/70'}`}>All</button>
            <button onClick={() => setActiveTab('pinned')} className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 ${activeTab==='pinned'?'bg-white':'bg-white hover:bg-white/70'}`}><FaThumbtack/>Pinned</button>
            <button onClick={() => setActiveTab('pdfs')} className={`px-3 py-2 rounded-lg border transition flex items-center gap-2 ${activeTab==='pdfs'?'bg-white':'bg-white hover:bg-white/70'}`}><FaFilePdf/>PDFs</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-5 mb-4">
              <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
                  <FaSearch className="text-gray-500" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search announcements, content, authors..."
                    className="bg-transparent outline-none w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600 flex items-center gap-2"><FaFilter/>Filter</div>
                  <div className="flex gap-2 flex-wrap">
                    {(['all','events','services','community','urgent','general'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategoryFilter(c as any)}
                        className={`px-3 py-1.5 rounded-full text-sm border ${categoryFilter===c? 'bg-[#E8FFD7] text-[#2f5c3a] border-[#5E936C]':'bg-white hover:bg-gray-50'}`}
                      >
                        {c==='all' ? 'All' : categoryLabels[c as Announcement['category']]}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setSearch(''); setCategoryFilter('all'); refetch(); }} className="ml-1 px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 flex items-center gap-2" title="Reset">
                    <FaRedo/> Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {loading && <div className="text-gray-600">Loading announcements...</div>}
              {error && <div className="text-red-600">Failed to load announcements. Please try again.</div>}
              {!loading && !error && filtered.length === 0 && (
                <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-600">No announcements found.</div>
              )}
              <AnimatePresence>
                {!loading && !error && filtered.map((a) => (
                  <AnnouncementCard key={a.id} a={a} />
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#2f5c3a] mb-3">Overview</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#E8FFD7] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#2f5c3a]">{announcements.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="bg-white border rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[#2f5c3a]">{announcements.filter(a=>a.isPinned).length}</div>
                  <div className="text-xs text-gray-600">Pinned</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(Object.keys(categoriesCount) as Array<keyof typeof categoriesCount>).map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                    <span className="truncate">{categoryLabels[k as Announcement['category']] ?? (k as string)}</span>
                    <span className="font-semibold text-[#2f5c3a]">{categoriesCount[k]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-0 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2f5c3a] flex items-center gap-2"><FaFilePdf className="text-red-600"/> Sunday Mass PDFs</h2>
                <div className="text-sm text-gray-600">{pdfItems.length} file{pdfItems.length!==1?'s':''}</div>
              </div>
              <div className="max-h-64 overflow-auto divide-y">
                {pdfItems.length === 0 ? (
                  <div className="p-6 text-gray-600">No PDF links detected in announcements. If mass PDFs are shared as links, they will appear here.</div>
                ) : (
                  pdfItems.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setActiveTab('pdfs'); setSelectedPdf(p.url); }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selectedPdf === p.url ? 'bg-[#E8FFD7]' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate">
                          <div className="font-medium text-gray-800 truncate">{p.title}</div>
                          <div className="text-xs text-gray-500 truncate" title={p.url}>{p.url}</div>
                        </div>
                        <FaFilePdf className="text-red-600 flex-shrink-0"/>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {selectedPdf && (
                <div className="border-t border-gray-100">
                  <div className="p-3 bg-gray-50 text-sm text-gray-700 flex items-center justify-between select-none">
                    <span className="truncate">Viewing: {selectedPdf}</span>
                    <span className="text-gray-400">Toolbar disabled</span>
                  </div>
                  <div className="relative h-[480px] bg-gray-100 select-none" onContextMenu={(e)=>e.preventDefault()}>
                    {/* Hide viewer UI via params; allow scrolling to read the PDF */}
                    <iframe
                      src={`${selectedPdf}#toolbar=0&navpanes=0&scrollbar=0`}
                      title="PDF Viewer"
                      className="w-full h-full"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TodayAnnouncements;
