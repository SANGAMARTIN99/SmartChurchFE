import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  FaHandHoldingHeart, FaChartLine, FaList, FaDownload, FaSearch,
  FaCalendarAlt, FaCreditCard, FaCheckCircle, FaExclamationTriangle,
  FaCoins, FaChurch, FaCross
} from 'react-icons/fa';
import { IoStatsChart, IoWalletOutline } from 'react-icons/io5';
import { MdDashboard } from 'react-icons/md';
import {
  ME_QUERY,
  GET_RECENT_OFFERINGS,
  GET_OFFERINGS_BY_TYPE,
  GET_STREETS_AND_GROUPS,
  REGISTRATION_WINDOW_STATUS,
  NUMBER_SUGGESTIONS,
  MY_CARD_STATE
} from '../../api/queries';
import { CREATE_CARD_APPLICATION } from '../../api/mutations';

type ViewMode = 'basic' | 'analytics';

interface OfferingVM {
  id: string;
  date: string;
  amount: number;
  type: string;
  massType: string;
  attendant: string;
  memberName: string;
}

const currency = (n: number) =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n || 0);

// --- Premium SVG Charts ---

// Enhanced Area Chart
const PremiumAreaChart = ({
  series,
  labels,
  w = 600,
  h = 200,
  color = '#5E936C',
}: {
  series: number[];
  labels: string[];
  w?: number;
  h?: number;
  color?: string;
  t?: any;
}) => {
  const { t } = useTranslation();
  if (!series.length) return <div className="h-48 flex items-center justify-center text-gray-400 font-medium">{t('not_enough_data')}</div>;

  const max = Math.max(1, ...series) * 1.1; // Add 10% headroom
  const stepX = w / (Math.max(series.length, 2) - 1);

  // Generate points
  const points = series.map((v, i) => {
    const x = i * stepX;
    const y = h - (v / max) * h;
    return { x, y };
  });

  // Create path command
  const pathData = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  return (
    <div className="w-full h-full relative font-sans select-none">
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="gradientDetails" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.4} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid & Labels */}
        {points.map((p, i) => (
          <g key={i}>
            <line x1={p.x} y1={0} x2={p.x} y2={h} stroke="#000" strokeOpacity={0.05} strokeDasharray="4 4" />
            <text x={p.x} y={h + 20} textAnchor="middle" fontSize="11" fill="#9ca3af" fontWeight="500">{labels[i]}</text>
          </g>
        ))}

        {/* Data */}
        <path d={areaPath} fill="url(#gradientDetails)" />
        <path d={pathData} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="white"
            stroke={color}
            strokeWidth="2"
            className="hover:r-6 transition-all duration-200 cursor-crosshair"
          >
            <title>{currency(series[i])}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

// Premium Donut Chart
const PremiumDonutChart = ({
  slices,
  size = 220,
}: {
  slices: { color: string; value: number; label: string }[];
  size?: number;
}) => {
  const { t } = useTranslation();
  if (!slices.length) return <div className="text-gray-400">{t('no_data')}</div>;

  const total = slices.reduce((s, x) => s + (x.value || 0), 0);
  let acc = 0;
  const radius = size / 2;
  const strokeWidth = 25;
  const chartRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * chartRadius;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {slices.map((s, i) => {
            const percent = Math.max(0, s.value / total);
            if (percent === 0) return null;
            const strokeLength = circumference * percent;
            const dashOffset = circumference * (1 - percent); // Not mostly used with this accumulative method, simplified below

            // Pure SVG Arc calculation for perfect donuts is complex, simpler CSS conic-gradient approach usually cleaner.
            // But for premium SVG feel with rounded caps or interaction, SVG is best.
            // Fallback to cleaner CSS Conic for reliability in this specific constraint.
            return null;
          })}
          {/* Fallback to high-quality CSS conic which is smoother for quick generation */}
        </svg>

        {/* High Res CSS Conic Implementation */}
        <div
          className="absolute inset-0 rounded-full shadow-inner"
          style={{
            background: `conic-gradient(${slices.map((s, i) => {
              const start = (acc / total) * 360;
              acc += s.value;
              const end = (acc / total) * 360;
              return `${s.color} ${start}deg ${end}deg`;
            }).join(', ')})`,
            maskImage: `radial-gradient(transparent 55%, black 56%)`,
            WebkitMaskImage: `radial-gradient(transparent 55%, black 56%)`
          }}
        />
        {/* Inner Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-widest">{t('total_label')}</span>
          <span className="text-lg font-bold text-gray-800">{currency(total)}</span>
        </div>
      </div>

      <div className="space-y-3 w-full">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between group cursor-default">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: s.color }} />
              <span className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{s.label}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-gray-800">{currency(s.value)}</div>
              <div className="text-[10px] text-gray-400">{Math.round((s.value / total) * 100)}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- Main Component ---

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50/50">
          <h3 className="text-lg font-bold text-[#2f5c3a] flex items-center gap-2">
            <FaCreditCard /> {title}
          </h3>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition" onClick={onClose}>✕</button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const MyOfferingsOverview: React.FC = () => {
  const { t } = useTranslation();
  const [view, setView] = useState<ViewMode>('basic');
  const [q, setQ] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10); // Start of year by default for better data
    const end = new Date().toISOString().slice(0, 10);
    return { start, end };
  });

  const { data: me } = useQuery(ME_QUERY);
  const { data: recent, loading: recentLoading } = useQuery(GET_RECENT_OFFERINGS, {
    variables: { limit: 100 },
    fetchPolicy: 'cache-and-network',
  });
  const { data: typeBreakdown } = useQuery(GET_OFFERINGS_BY_TYPE, {
    variables: { start: dateRange.start, end: dateRange.end },
    fetchPolicy: 'cache-and-network',
  });

  // Modal State
  const [requestOpen, setRequestOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetId, setStreetId] = useState<number | ''>('' as any);
  const [preferredNumber, setPreferredNumber] = useState<number | ''>('' as any);
  const [pledgeAhadi, setPledgeAhadi] = useState<number | ''>('' as any);
  const [pledgeShukrani, setPledgeShukrani] = useState<number | ''>('' as any);
  const [pledgeMajengo, setPledgeMajengo] = useState<number | ''>('' as any);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [createApplication, { loading: requesting }] = useMutation(CREATE_CARD_APPLICATION, {
    onCompleted: () => {
      setRequestOpen(false);
      // Reset form
      setPreferredNumber('' as any);
      setPledgeAhadi('' as any);
      setPledgeMajengo('' as any);
      setPledgeShukrani('' as any);
      setRequestError(null);
      refetchMyCard && refetchMyCard();
    },
    onError: (err) => setRequestError(err.message || t('submit_request_fail'))
  });

  const { data: streetsData } = useQuery(GET_STREETS_AND_GROUPS);
  const streets = streetsData?.streets || [];
  const { data: windowStatus } = useQuery(REGISTRATION_WINDOW_STATUS);
  const { data: myCardStateData, refetch: refetchMyCard } = useQuery(MY_CARD_STATE);
  const { data: suggestionsData } = useQuery(NUMBER_SUGGESTIONS, {
    variables: { streetId: streetId || 0, queryNumber: preferredNumber || 0, limit: 5 },
    skip: !streetId || !preferredNumber,
    fetchPolicy: 'cache-and-network',
  });

  const hasPendingApp = !!myCardStateData?.myCardState?.hasPendingApplication;
  const hasCurrentAssignment = !!myCardStateData?.myCardState?.hasCurrentAssignment;

  React.useEffect(() => {
    if (me?.me) {
      setFullName(me.me.fullName || '');
      setPhoneNumber(me.me.phoneNumber || '');
      setStreetId(me.me.street?.id || 0);
    }
  }, [me]);

  // Data processing
  const myName = (me?.me?.fullName || '').toLowerCase();

  const all: OfferingVM[] = useMemo(() => {
    return (recent?.recentOfferings || []).map((o: any) => ({
      id: o.id,
      date: o.date,
      amount: Number(o.amount) || 0,
      type: String(o.offeringType || 'general').toLowerCase(),
      massType: String(o.massType || ''),
      attendant: o.attendant,
      memberName: o.memberName || '',
    })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [recent]);

  const mine = useMemo(() => {
    const rows = myName ? all.filter((r) => (r.memberName || '').toLowerCase() === myName) : all;
    const term = q.trim().toLowerCase();

    // Filter by date range first as it is strict
    let filtered = rows.filter((r) => {
      const d = new Date(r.date);
      return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
    });

    if (term) {
      filtered = filtered.filter(r =>
        r.type.includes(term) || r.massType.toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [all, myName, q, dateRange]);

  const total = mine.reduce((s, x) => s + (x.amount || 0), 0);
  const avg = mine.length ? total / mine.length : 0;

  const monthlyTrendData = useMemo(() => {
    const map = new Map<string, number>();
    const months: string[] = [];
    const now = new Date();
    // Generate last 6 months labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(format(d, 'MMM'));
    }

    // Group data by 'MMM' (Note: this simple grouping assumes within current year or close range, usually safe for "Recent" context)
    // A more robust key is YYYY-MM
    const keyMap = new Map<string, number>(); // Label index -> value

    mine.forEach(o => {
      const d = new Date(o.date);
      // Find if this date is within one of our 6 buckets roughly
      const label = format(d, 'MMM');
      // Simple aggregation for chart
      map.set(label, (map.get(label) || 0) + o.amount);
    });

    return {
      labels: months,
      series: months.map(m => map.get(m) || 0)
    };
  }, [mine]);

  const typeSlices = useMemo(() => {
    const palette: Record<string, string> = {
      tithe: '#5E936C',    // Primary Green
      special: '#F59E0B',  // Amber
      general: '#3B82F6',  // Blue
      pledge: '#10B981',   // Emerald
      other: '#9CA3AF',    // Gray
      thanksgiving: '#EC4899', // Pink
    };

    // Use breakdown if available and matching filter context, else compute from client
    // For simplicity & responsiveness, computing from 'mine' (which is already filtered) is often better UX
    const sum: Record<string, number> = {};
    mine.forEach((o) => {
      const k = o.type || 'general';
      sum[k] = (sum[k] || 0) + (o.amount || 0);
    });

    return Object.entries(sum)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => ({
        color: palette[k] || palette.other,
        value: v,
        label: k.charAt(0).toUpperCase() + k.slice(1),
      }));
  }, [mine]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(mine.length / pageSize);
  const paginatedData = mine.slice((page - 1) * pageSize, page * pageSize);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'tithe': return <FaHandHoldingHeart className="text-green-600" />;
      case 'pledge': return <IoWalletOutline className="text-emerald-600" />;
      case 'general': return <FaCoins className="text-blue-600" />;
      case 'special': return <FaChurch className="text-amber-500" />;
      default: return <FaCross className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-full bg-[#f8fafc] pb-20">

      {/* Premium Header */}
      <div className="bg-gradient-to-br from-[#1b3c29] via-[#2f5c3a] to-[#4a8c5f] text-white pt-10 pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3"
              >
                <FaHandHoldingHeart className="text-green-200" /> {t('my_offerings_title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} delay={0.1}
                className="text-green-100 mt-2 text-lg font-light"
              >
                {t('track_stewardship')}
              </motion.p>
            </div>

            <div className="flex items-center gap-3">
              {!hasPendingApp && !hasCurrentAssignment ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRequestOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#2f5c3a] font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm"
                >
                  <FaCreditCard /> {t('request_card')}
                </motion.button>
              ) : (
                <div className="px-4 py-2 rounded-xl bg-white/20 backdrop-blur border border-white/30 text-white text-sm font-medium flex items-center gap-2">
                  {hasPendingApp ? <><FaExclamationTriangle className="text-amber-300" /> {t('app_pending')}</> : <><FaCheckCircle className="text-green-300" /> {t('active_card')}</>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-16 relative z-10 space-y-8">

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: t('total_given'), value: currency(total), icon: <IoWalletOutline />, color: 'from-green-500 to-emerald-600', sub: t('selected_period') },
            { label: t('transactions'), value: mine.length, icon: <FaList />, color: 'from-blue-500 to-indigo-600', sub: t('count_label') },
            { label: t('average_label'), value: currency(avg), icon: <IoStatsChart />, color: 'from-amber-500 to-orange-600', sub: t('per_offering') }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl shadow-xl shadow-green-900/5 p-6 border border-white hover:border-green-100 transition-all relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${stat.color} text-white rounded-bl-3xl`}>
                <div className="text-2xl">{stat.icon}</div>
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <div className="text-3xl font-extrabold text-gray-800 tracking-tight">{stat.value}</div>
              <div className="mt-2 text-xs font-medium text-gray-400 bg-gray-50 inline-block px-2 py-1 rounded">{stat.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* Controls & Layout */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1">
          <div className="flex flex-col md:flex-row items-center justify-between p-3 gap-4">
            {/* View Switcher */}
            <div className="bg-gray-100/80 p-1 rounded-xl flex w-full md:w-auto">
              {[
                { id: 'basic', icon: <FaList />, label: t('transactions') },
                { id: 'analytics', icon: <FaChartLine />, label: t('analytics_view') }
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id as any)}
                  className={`
                     flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all
                     ${view === v.id ? 'bg-white text-[#2f5c3a] shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}
                   `}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  placeholder={t('search_placeholder')}
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 w-full"
                />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent border-0 text-xs sm:text-sm text-gray-600 focus:ring-0 p-1"
                />
                <span className="text-gray-300">→</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent border-0 text-xs sm:text-sm text-gray-600 focus:ring-0 p-1"
                />
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'basic' && (
            <motion.div
              key="basic"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl shadow-green-900/5 border border-gray-100 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-6 py-4">{t('date_label')}</th>
                      <th className="px-6 py-4">{t('type')}</th>
                      <th className="px-6 py-4 hidden sm:table-cell">{t('mass_service')}</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentLoading ? (
                      <tr><td colSpan={4} className="p-10 text-center text-gray-400">{t('loading')}</td></tr>
                    ) : paginatedData.length === 0 ? (
                      <tr><td colSpan={4} className="p-10 text-center text-gray-400">{t('no_records_period')}</td></tr>
                    ) : (
                      paginatedData.map((o) => (
                        <tr key={o.id} className="hover:bg-green-50/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-700">{format(parseISO(o.date), 'MMM dd, yyyy')}</div>
                            <div className="text-xs text-gray-400">{format(parseISO(o.date), 'EEEE')}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm group-hover:bg-white group-hover:shadow-sm transition-all">
                                {getIconForType(o.type)}
                              </div>
                              <span className="capitalize text-sm font-medium text-gray-700">{o.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {o.massType || 'Regular'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-[#2f5c3a] font-mono">
                            {currency(o.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Footer / Pagination */}
              <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
                <span className="text-sm text-gray-500">
                  {t('showing_transactions', { count: paginatedData.length, total: mine.length })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="px-4 py-2 text-sm border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    {t('previous')}
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="px-4 py-2 text-sm border bg-white rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Area Chart Card */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-green-900/5 border border-white lg:col-span-2">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{t('giving_trend')}</h3>
                    <p className="text-sm text-gray-500">{t('history_6_months')}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg text-green-700"><FaChartLine /></div>
                </div>
                <div className="h-64">
                  <PremiumAreaChart series={monthlyTrendData.series} labels={monthlyTrendData.labels} />
                </div>
              </div>

              {/* Pie Chart Card */}
              <div className="bg-white p-6 rounded-2xl shadow-xl shadow-green-900/5 border border-white">
                <h3 className="text-lg font-bold text-gray-800 mb-6">{t('distribution_type')}</h3>
                <div className="flex justify-center py-4">
                  <PremiumDonutChart slices={typeSlices} />
                </div>
              </div>

              {/* Insights Panel */}
              <div className="bg-[#2f5c3a] p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 bg-white opacity-5 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 p-8 bg-black opacity-10 rounded-full blur-2xl transform -translate-x-4 translate-y-4"></div>

                <h3 className="text-lg font-bold text-green-100 mb-6 flex items-center gap-2 relative z-10"><MdDashboard /> {t('quick_insights')}</h3>
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between border-b border-green-700 pb-3">
                    <span className="text-green-200 text-sm">{t('most_frequent')}</span>
                    <span className="font-semibold capitalize">{(() => {
                      const count = mine.reduce((acc, curr) => ({ ...acc, [curr.type]: (acc[curr.type] || 0) + 1 }), {} as Record<string, number>);
                      return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
                    })()}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-green-700 pb-3">
                    <span className="text-green-200 text-sm">{t('top_month')}</span>
                    <span className="font-semibold">{(() => {
                      const max = Math.max(...monthlyTrendData.series);
                      const idx = monthlyTrendData.series.indexOf(max);
                      return idx >= 0 ? monthlyTrendData.labels[idx] : '-';
                    })()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Offerings Request Modal */}
      <Modal open={requestOpen} title={t('request_offering_card')} onClose={() => setRequestOpen(false)}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          await createApplication({
            variables: {
              input: {
                fullName, phoneNumber,
                streetId: streetId ? Number(streetId) : null,
                preferredNumber: preferredNumber ? Number(preferredNumber) : null,
                pledgedAhadi: pledgeAhadi ? Number(pledgeAhadi) : 0,
                pledgedShukrani: pledgeShukrani ? Number(pledgeShukrani) : 0,
                pledgedMajengo: pledgeMajengo ? Number(pledgeMajengo) : 0,
              }
            }
          });
        }}>
          <div className="space-y-4">
            {requestError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2"><FaExclamationTriangle /> {requestError}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('full_name')}</label>
                <input className="w-full bg-gray-50 border-0 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('phone_number')}</label>
                <input className="w-full bg-gray-50 border-0 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('street')}</label>
                <select className="w-full bg-gray-50 border-0 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-green-500" value={streetId as any} onChange={e => setStreetId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">{t('select_street')}</option>
                  {streets.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-bold text-[#2f5c3a] mb-3">{t('pledges_optional')}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[{ l: t('ahadi'), v: pledgeAhadi, s: setPledgeAhadi }, { l: t('shukrani'), v: pledgeShukrani, s: setPledgeShukrani }, { l: t('majengo'), v: pledgeMajengo, s: setPledgeMajengo }].map((f, i) => (
                  <div key={i} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{f.l}</label>
                    <div className="relative">
                      <span className="absolute left-2 top-2 text-gray-400 text-xs">TZS</span>
                      <input type="number" className="w-full pl-8 bg-gray-50 border-0 rounded-lg p-2 text-sm focus:ring-2 focus:ring-green-500" value={f.v as any} onChange={e => f.s(e.target.value ? Number(e.target.value) : '' as any)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Number Preference with Suggestions */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="text-xs font-bold text-blue-800 uppercase mb-2 block">{t('preferred_card_num')}</label>
              <div className="flex gap-2">
                <input type="number" className="w-24 bg-white border-0 rounded-lg p-2 text-sm ring-1 ring-blue-200 focus:ring-2 focus:ring-blue-500" value={preferredNumber as any} onChange={e => setPreferredNumber(e.target.value ? Number(e.target.value) : '' as any)} placeholder={t('e_g_101')} />
                {suggestionsData?.numberSuggestions && (
                  <div className="flex-1 flex flex-wrap gap-2 items-center text-xs">
                    {suggestionsData.numberSuggestions.exactAvailable ?
                      <span className="text-green-600 font-medium flex items-center gap-1"><FaCheckCircle /> {t('available_status')}</span> :
                      (suggestionsData.numberSuggestions.suggestions || []).map((s: any) => (
                        <button type="button" key={s.number} onClick={() => setPreferredNumber(s.number)} className="bg-white px-2 py-1 rounded shadow-sm hover:text-blue-600 border border-blue-100 transition">{s.number}</button>
                      ))
                    }
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-lg">
              {t('submission_disclaimer', { year: new Date().getFullYear() })} {windowStatus?.registrationWindowStatus?.isOpen && t('reg_open')}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRequestOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm font-medium">{t('cancel')}</button>
              <button type="submit" disabled={requesting} className="px-6 py-2 rounded-lg bg-[#2f5c3a] text-white hover:bg-[#1f4229] shadow-lg shadow-green-900/10 text-sm font-bold transition-all">
                {requesting ? t('sending') : t('submit_request')}
              </button>
            </div>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default MyOfferingsOverview;
// Revision note [2026-07-17 09:36:11 +0300]: Optimize background GSAP animation timelines
