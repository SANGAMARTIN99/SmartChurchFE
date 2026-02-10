import { useState, useMemo } from 'react';
import {
  FaPrayingHands, FaCalendarAlt, FaMoneyBillWave,
  FaUsers, FaChartLine, FaBookOpen, FaMapMarkerAlt,
  FaChevronRight, FaPlay, FaChurch, FaHeart, FaArrowLeft
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  ME_QUERY,
  GET_RECENT_OFFERINGS,
  GET_UPCOMING_EVENTS,
  GET_OFFERINGS_TREND,
  GET_DEVOTIONALS
} from '../../api/queries';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// --- Types ---
interface GraphQLOffering {
  id: string;
  date: string;
  amount: number;
  type?: string;
  offeringType?: string;
  massType: string;
  attendant?: string;
}

interface Offering extends Omit<GraphQLOffering, 'offeringType'> {
  type: string;
  attendant: string;
}

type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'going' | 'maybe';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  rsvpStatus: RsvpStatus;
}

interface Group {
  id: string;
  name: string;
  role?: string;
}

interface MeData {
  me: {
    fullName: string;
    street?: {
      name: string;
    };
    groups: Group[];
  };
}

// --- Components ---

const LoadingSkeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`}></div>
);

const EmptyState = ({ icon: Icon, title, message }: { icon: any, title: string, message: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-white/50 rounded-2xl border border-dashed border-gray-300 h-full">
    <div className="bg-gray-100 p-4 rounded-full mb-3">
      <Icon className="text-2xl text-gray-400" />
    </div>
    <h4 className="font-semibold text-gray-700">{title}</h4>
    <p className="text-sm mt-1 max-w-xs">{message}</p>
  </div>
);

const MemberDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'offerings' | 'groups' | 'events' | 'prayers'>('overview');
  const [newPrayerRequestOpen, setNewPrayerRequestOpen] = useState(false);

  // --- Queries ---
  const { data: meData, loading: meLoading } = useQuery<{ me: MeData['me'] }>(ME_QUERY);

  const { data: offeringsData, loading: offeringsLoading } = useQuery<{ recentOfferings: GraphQLOffering[] }>(GET_RECENT_OFFERINGS, {
    variables: { limit: 50 }
  });

  const { data: eventsData, loading: eventsLoading } = useQuery<{ upcomingEvents: Omit<Event, 'rsvpStatus'>[] }>(GET_UPCOMING_EVENTS);

  const { data: trendData, loading: trendLoading } = useQuery(GET_OFFERINGS_TREND, {
    variables: { months: 1 }
  });

  const { data: devotionalData, loading: devotionalLoading } = useQuery(GET_DEVOTIONALS, {
    variables: { limit: 1, offset: 0 }
  });

  // --- Data Transformation ---
  const memberFirstName = meData?.me?.fullName?.split(' ')[0] || (meLoading ? '...' : t('member_role'));
  const memberStreet = meData?.me?.street?.name || '';
  const myGroups: Group[] = meData?.me?.groups || [];

  const allRecentOfferings: Offering[] = (offeringsData?.recentOfferings || []).map((o): Offering => ({
    ...o,
    type: (o.offeringType || o.type || 'other').toLowerCase(),
    attendant: o.attendant || 'Unknown',
  }));

  const recentOfferings = allRecentOfferings.slice(0, 5);

  const upcomingEvents: Event[] = (eventsData?.upcomingEvents || []).slice(0, 3).map((e) => ({
    ...e,
    rsvpStatus: 'pending' as const,
  }));

  const totalOfferings = allRecentOfferings.reduce((sum, o) => sum + (o.amount || 0), 0);
  const pledgedAmount = 1000000;
  const offeredAmount = totalOfferings;
  const pledgeProgress = Math.min(100, Math.max(0, (offeredAmount / pledgedAmount) * 100));

  const chartData = useMemo(() => {
    if (allRecentOfferings.length > 0) {
      const grouped = allRecentOfferings.reduce((acc, curr) => {
        try {
          const d = parseISO(curr.date);
          const dateKey = format(d, 'yyyy-MM-dd');
          acc[dateKey] = (acc[dateKey] || 0) + curr.amount;
        } catch (e) { console.warn('Invalid date', curr.date); }
        return acc;
      }, {} as Record<string, number>);

      const points = [];
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 60);

      for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateKey = format(d, 'yyyy-MM-dd');
        const amount = grouped[dateKey] || 0;
        const isSunday = d.getDay() === 0;
        const hasData = amount > 0;

        if (isSunday || hasData) {
          points.push({ label: format(d, 'MMM dd'), date: dateKey, value: amount });
        }
      }
      return points;
    }
    return [];
  }, [trendData, allRecentOfferings]);

  const todayDevotional = devotionalData?.devotionals?.[0];
  const hasDevotional = !devotionalLoading && !!todayDevotional; // Condition for layout swap

  // --- Helper Components ---

  const DevotionalContent = () => (
    <>
      {devotionalLoading ? (
        <LoadingSkeleton className="h-[400px] w-full rounded-3xl" />
      ) : todayDevotional ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-[420px] rounded-3xl overflow-hidden shadow-2xl group cursor-pointer"
          onClick={() => window.location.href = '/member-word-of-the-day'}
        >
          {todayDevotional.imageUrl ? (
            <img src={todayDevotional.imageUrl} alt="Devotional" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a3c2b] to-[#406851]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">{t('Word of the Day')}</span>
              <span className="bg-[#5E936C] text-white px-2 py-1 rounded-full text-xs font-bold">{t('today')}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3 leading-tight text-shadow-sm">{todayDevotional.title}</h2>
            {todayDevotional.scripture && (
              <p className="text-white/90 text-lg italic font-serif border-l-4 border-[#5E936C] pl-4 mb-4 max-w-2xl">"{todayDevotional.scripture}"</p>
            )}
            <div className="flex items-center gap-4 mt-6">
              <button className="bg-white text-[#1a3c2b] px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transition shadow-lg"><FaBookOpen /> {t('read_devotional')}</button>
              {todayDevotional.audioUrl && (
                <button className="bg-white/20 backdrop-blur-md text-white px-4 py-3 rounded-full hover:bg-white/30 transition border border-white/20"><FaPlay className="text-sm" /></button>
              )}
            </div>
          </div>
          <div className="absolute top-6 right-6">
            <FaHeart className="text-white/50 text-3xl hover:text-[#5E936C] transition hover:scale-110" />
          </div>
        </motion.div>
      ) : (
        <EmptyState icon={FaBookOpen} title={t('no_devotional_title')} message={t('no_devotional_msg')} />
      )}
    </>
  );

  const ChartContent = ({ height = "h-[300px]" }: { height?: string }) => (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-50 h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-[#1a3c2b]">{t('financial_overview')}</h3>
          <p className="text-gray-500 text-sm">{t('financial_subtitle')}</p>
        </div>
        <div className="bg-[#E8FFD7] p-3 rounded-full text-[#5E936C]">
          <FaChartLine className="text-xl" />
        </div>
      </div>
      <div className={`${height} w-full flex-1`}>
        {trendLoading && (!chartData || chartData.length === 0) ? (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-2xl border border-dashed">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-[#5E936C] border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-gray-500 font-medium">{t('loading')}</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5E936C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#5E936C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1a3c2b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [formatCurrency(value), '']} labelStyle={{ color: '#ffffff80', marginBottom: '4px' }} />
              <Area type="monotone" dataKey="value" stroke="#5E936C" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon={FaChartLine} title={t('no_data')} message={t('no_offering_data')} />
        )}
      </div>
    </div>
  );

  // --- Render Helpers ---
  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 17) return t('good_afternoon');
    return t('good_evening');
  }, [t]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount);
  const formatDate = (dateString: string) => { try { return format(parseISO(dateString), 'MMM dd'); } catch { return dateString; } };
  const BackButton = () => <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 text-gray-500 hover:text-[#5E936C] transition mb-6 font-medium"><FaArrowLeft /> {t('back_to_dashboard')}</button>;

  return (
    <div className="flex h-[calc(100vh-3rem)] bg-[#F2F5F8] overflow-hidden font-sans">
      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto p-4 md:p-8">

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                {/* --- Header Section --- */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-[#1a3c2b] tracking-tight">{getGreeting}, <span className="text-[#5E936C]">{memberFirstName}</span></h1>
                    <p className="text-gray-500 mt-2 text-lg font-medium">{format(new Date(), 'EEEE, MMMM do, yyyy')}</p>
                  </div>
                  {memberStreet && (
                    <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm text-gray-600 border border-gray-100">
                      <FaMapMarkerAlt className="text-[#5E936C]" />
                      <span className="font-semibold">{memberStreet} {t('street_suffix')}</span>
                    </div>
                  )}
                </div>

                {/* --- Row 1: Hero & Side Panel --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                  {/* DYNAMIC CONTENT Placement: If no devotional, Chart goes here */}
                  <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                    {hasDevotional ? <DevotionalContent /> : <ChartContent height="h-[350px]" />}
                  </div>

                  {/* Side Panel (Consistent) */}
                  <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-50 flex flex-col justify-between h-auto min-h-[180px] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><FaChartLine className="text-9xl text-[#5E936C]" /></div>
                      <div>
                        <h3 className="text-gray-500 font-semibold mb-1">{t('pledge_progress')}</h3>
                        <div className="flex items-end gap-2 mb-2"><span className="text-4xl font-extrabold text-[#1a3c2b]">{pledgeProgress.toFixed(0)}%</span></div>
                        <p className="text-sm text-gray-500 font-medium"><span className="text-[#5E936C] font-bold">{formatCurrency(offeredAmount)}</span> {t('contributed_of')}<br /><span className="text-gray-700">{formatCurrency(pledgedAmount)}</span> {t('goal')}</p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 mt-4 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pledgeProgress}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="h-full bg-gradient-to-r from-[#5E936C] to-[#93DA97] relative">
                          <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                        </motion.div>
                      </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-50 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[#1a3c2b] text-lg flex items-center gap-2"><FaCalendarAlt className="text-[#5E936C]" /> {t('upcoming_title')}</h3>
                        <button onClick={() => setActiveTab('events')} className="text-xs font-bold text-[#5E936C] bg-[#E8FFD7] px-3 py-1 rounded-full hover:bg-[#d4f5c1] transition">{t('view_all_small')}</button>
                      </div>
                      <div className="space-y-4">
                        {eventsLoading ? (
                          <div className="space-y-3"><LoadingSkeleton className="h-16 w-full rounded-2xl" /><LoadingSkeleton className="h-16 w-full rounded-2xl" /></div>
                        ) : upcomingEvents.length > 0 ? (
                          upcomingEvents.map(event => (
                            <div key={event.id} className="flex gap-4 items-start group">
                              <div className="bg-gray-50 rounded-2xl w-14 h-14 flex flex-col items-center justify-center shrink-0 border border-gray-100 group-hover:border-[#5E936C] transition-colors">
                                <span className="text-xs font-bold text-gray-500 uppercase">{format(parseISO(event.date), 'MMM')}</span>
                                <span className="text-xl font-black text-[#1a3c2b]">{format(parseISO(event.date), 'dd')}</span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-gray-800 truncate">{event.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><FaMapMarkerAlt className="text-[#5E936C]/60" /> {event.location || t('church_hall')}</p>
                                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">{event.time}</span>
                              </div>
                            </div>
                          ))
                        ) : (<EmptyState icon={FaCalendarAlt} title={t('no_events_title')} message={t('no_events_msg')} />)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- Row 2: Secondary & Recent Activity --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                  {/* DYNAMIC CONTENT Placement: If no devotional, Empty Devotional State goes here (Bottom), else Chart is here */}
                  <div className="lg:col-span-2">
                    {hasDevotional ? <ChartContent /> : <DevotionalContent />}
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[{ icon: FaPrayingHands, label: t('prayer_label'), color: 'bg-blue-50 text-blue-600', onClick: () => setNewPrayerRequestOpen(true) }, { icon: FaMoneyBillWave, label: t('giving_label'), color: 'bg-green-50 text-green-600', onClick: () => setActiveTab('offerings') }, { icon: FaUsers, label: t('groups_label'), color: 'bg-purple-50 text-purple-600', onClick: () => setActiveTab('groups') }, { icon: FaCalendarAlt, label: t('events_label'), color: 'bg-orange-50 text-orange-600', onClick: () => setActiveTab('events') }].map((action, idx) => (
                        <motion.button key={idx} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={action.onClick} className="bg-white p-4 rounded-2xl shadow-lg border border-gray-50 flex flex-col items-center justify-center gap-2 hover:shadow-xl transition-all">
                          <div className={`p-3 rounded-full ${action.color}`}><action.icon className="text-xl" /></div>
                          <span className="font-semibold text-gray-700 text-sm">{action.label}</span>
                        </motion.button>
                      ))}
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-50 flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-[#1a3c2b]">{t('recent_activity')}</h3>
                        <button onClick={() => setActiveTab('offerings')} className="text-gray-400 hover:text-[#5E936C] transition"><FaChevronRight /></button>
                      </div>
                      <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {offeringsLoading ? (
                          <div className="space-y-3"><LoadingSkeleton className="h-12 w-full rounded-xl" /><LoadingSkeleton className="h-12 w-full rounded-xl" /></div>
                        ) : recentOfferings.length > 0 ? (
                          recentOfferings.map(offering => (
                            <div key={offering.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-default">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#E8FFD7] rounded-lg text-[#5E936C]"><FaChurch /></div>
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">{offering.massType}</p>
                                  <p className="text-xs text-gray-500">{formatDate(offering.date)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#1a3c2b] text-sm">{formatCurrency(offering.amount)}</p>
                                <p className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1 capitalize">{offering.type}</p>
                              </div>
                            </div>
                          ))
                        ) : (<div className="py-8 text-center text-gray-400 text-sm">{t('no_recent_transactions')}</div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'offerings' && (
              <motion.div key="offerings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl shadow-xl p-8 min-h-[500px]">
                <BackButton />
                <h2 className="text-3xl font-bold text-[#1a3c2b] mb-4">{t('my_offerings_history')}</h2>
                <div className="space-y-4 max-w-4xl">
                  {allRecentOfferings.length > 0 ? (
                    allRecentOfferings.map(offering => (
                      <div key={offering.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition cursor-default">
                        <div className="flex items-start gap-4">
                          <div className="hidden md:flex bg-[#E8FFD7] p-3 rounded-xl text-[#5E936C]"><FaMoneyBillWave size={20} /></div>
                          <div>
                            <p className="font-bold text-[#1a3c2b] text-lg">{formatDate(offering.date)}</p>
                            <p className="text-gray-500 text-sm">{offering.massType} • <span className="capitalize">{offering.type}</span></p>
                            {offering.attendant !== 'Unknown' && <p className="text-xs text-gray-400 mt-1">{t('recorded_by')}: {offering.attendant}</p>}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 text-left md:text-right"><p className="text-2xl font-bold text-[#5E936C]">{formatCurrency(offering.amount)}</p></div>
                      </div>
                    ))
                  ) : (<EmptyState icon={FaMoneyBillWave} title={t('no_offerings_title')} message={t('no_offerings_msg')} />)}
                </div>
              </motion.div>
            )}

            {activeTab === 'groups' && (
              <motion.div key="groups" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl shadow-xl p-8 min-h-[500px]">
                <BackButton />
                <h2 className="text-3xl font-bold text-[#1a3c2b] mb-4">{t('my_groups_title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGroups.map((group: any) => (<div key={group.id} className="p-4 border rounded-xl hover:border-[#5E936C] transition cursor-pointer bg-gray-50"><h3 className="font-bold text-lg">{group.name}</h3><p className="text-gray-500">{t('member_role')}</p></div>))}
                  {myGroups.length === 0 && <EmptyState icon={FaUsers} title={t('no_groups_title')} message={t('no_groups_msg')} />}
                </div>
              </motion.div>
            )}

            {activeTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white rounded-3xl shadow-xl p-8 min-h-[500px]">
                <BackButton />
                <h2 className="text-3xl font-bold text-[#1a3c2b] mb-4">{t('all_upcoming_events')}</h2>
                <div className="space-y-4">
                  {eventsData?.upcomingEvents?.map((event: any) => (
                    <div key={event.id} className="flex gap-4 p-4 border rounded-xl hover:shadow-md transition bg-white">
                      <div className="bg-[#E8FFD7] text-[#5E936C] rounded-xl w-16 h-16 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold uppercase">{format(parseISO(event.date), 'MMM')}</span>
                        <span className="text-xl font-bold">{format(parseISO(event.date), 'dd')}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-[#1a3c2b]">{event.title}</h3>
                        <p className="text-gray-600 flex items-center gap-2 mt-1"><FaCalendarAlt size={14} /> {event.time} • {event.location}</p>
                        <p className="text-gray-500 mt-2">{event.description}</p>
                      </div>
                    </div>
                  ))}
                  {(!eventsData?.upcomingEvents || eventsData.upcomingEvents.length === 0) && (<EmptyState icon={FaCalendarAlt} title={t('no_events_title')} message={t('no_events_msg')} />)}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Prayer Request Modal (Preserved) */}
      <AnimatePresence>
        {newPrayerRequestOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#1a3c2b] p-6 text-white text-center"><FaPrayingHands className="text-4xl mx-auto mb-2 opacity-80" /><h3 className="text-2xl font-bold">{t('prayer_request_title')}</h3><p className="text-white/70 text-sm">{t('prayer_request_subtitle')}</p></div>
              <div className="p-8">
                <form onSubmit={(e) => { e.preventDefault(); /* submit logic */ setNewPrayerRequestOpen(false); }}>
                  <div className="mb-6"><label className="block text-gray-700 font-semibold mb-2 ml-1">{t('your_request_label')}</label><textarea name="request" rows={5} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#5E936C] resize-none text-gray-700" placeholder={t('request_placeholder')} required></textarea></div>
                  <div className="flex items-center mb-8 bg-gray-50 p-4 rounded-xl"><input type="checkbox" id="isPublic" name="isPublic" className="h-5 w-5 text-[#5E936C] rounded" /><label htmlFor="isPublic" className="ml-3 block text-gray-700 text-sm font-medium">{t('share_with_team')}</label></div>
                  <div className="flex gap-4"><button type="button" onClick={() => setNewPrayerRequestOpen(false)} className="flex-1 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-semibold transition">{t('cancel')}</button><button type="submit" className="flex-1 bg-[#1a3c2b] text-white py-3 rounded-xl hover:bg-[#2d5c43] font-bold shadow-lg transition">{t('send_request')}</button></div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemberDashboard;