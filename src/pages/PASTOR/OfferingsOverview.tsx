import React, { useState } from 'react';
import {
  FaMoneyBillWave, FaChartLine, FaCalendarAlt, FaUsers,
  FaStreetView, FaDownload,
  FaArrowUp, FaArrowDown, FaChurch, FaPrayingHands,
  FaPlus, FaChartBar, FaReceipt
} from 'react-icons/fa';
import { GiCrossedChains, GiMoneyStack } from 'react-icons/gi';
import { BsGraphUp } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import {
  GET_OFFERING_STATS,
  GET_STREETS_AND_GROUPS,
  GET_RECENT_OFFERINGS,
  GET_OFFERINGS_BY_MASS,
  GET_OFFERINGS_BY_TYPE,
  GET_OFFERINGS_BY_STREET,
  GET_OFFERINGS_TREND,
} from '../../api/queries';
import { handleExportDownload } from '../../utils/export';
import type { JSX } from 'react/jsx-runtime';

// Types
interface Offering {
  id: string;
  date: string;
  memberName: string;
  street: string;
  amount: number;
  type: 'tithe' | 'special' | 'general' | 'pledge';
  massType: 'sunday' | 'morning-glory' | 'evening-glory' | 'seli' | 'other';
  attendant: string;
  cardNumber?: string;
}

interface OfferingStats {
  total: number;
  weekly: number;
  monthly: number;
  averagePerMember: number;
  growthRate: number;
  pledgedAmount: number;
  pledgedCollected: number;
}

interface StreetStats {
  name: string;
  total: number;
  memberCount: number;
  average: number;
  trend: 'up' | 'down';
}

interface MassTypeStats {
  type: string;
  amount: number;
  percentage: number;
  color: string;
  icon: JSX.Element;
}

interface OfferingType {
  type: string;
  amount: number;
  percentage: number;
  color: string;
  icon: JSX.Element;
}

const OfferingsOverview = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'overview' | 'details' | 'trends' | 'reports'>('overview');
  const [] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedStreet, setSelectedStreet] = useState<string>('all');
  // Default to current month
  const todayIso = new Date().toISOString().slice(0, 10);
  const monthStartIso = (() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); })();
  const [dateFilter, setDateFilter] = useState({
    start: monthStartIso,
    end: todayIso,
  });

  // Backend data
  const { data: statsData, loading: statsLoading, error: statsError } = useQuery(GET_OFFERING_STATS);
  useQuery(GET_STREETS_AND_GROUPS);
  const { data: recentOfferingsData, loading: recentLoading, error: recentError } = useQuery(
    GET_RECENT_OFFERINGS,
    { variables: { limit: 10 } }
  );
  const { data: massData, loading: massLoading, error: massError } = useQuery(
    GET_OFFERINGS_BY_MASS,
    { variables: { start: dateFilter.start, end: dateFilter.end } }
  );
  const { data: typeData, loading: typeLoading, error: typeError } = useQuery(
    GET_OFFERINGS_BY_TYPE,
    { variables: { start: dateFilter.start, end: dateFilter.end } }
  );

  // Offerings from backend
  const offerings: Offering[] = (recentOfferingsData?.recentOfferings || []).map((o: any) => {
    const normalizeType = (val: string): Offering['type'] => {
      const t = (val || '').toLowerCase();
      if (t.includes('tithe')) return 'tithe';
      if (t.includes('special')) return 'special';
      if (t.includes('pledge')) return 'pledge';
      return 'general';
    };
    const normalizeMass = (val: string): Offering['massType'] => {
      const m = (val || '').toLowerCase();
      if (m.includes('sunday') || m.includes('major')) return 'sunday';
      if (m.includes('morning')) return 'morning-glory';
      if (m.includes('evening')) return 'evening-glory';
      if (m.includes('seli')) return 'seli';
      return 'other';
    };
    return {
      id: o.id,
      date: o.date,
      memberName: o.memberName,
      street: o.street,
      amount: Number(o.amount) || 0,
      type: normalizeType(o.offeringType),
      massType: normalizeMass(o.massType),
      attendant: o.attendant,
    } as Offering;
  });

  const offeringStats: OfferingStats = {
    total: statsData?.offeringStats?.thisMonth ?? 0,
    weekly: statsData?.offeringStats?.thisWeek ?? 0,
    monthly: statsData?.offeringStats?.thisMonth ?? 0,
    averagePerMember: 0,
    growthRate: statsData?.offeringStats ? (statsData.offeringStats.trend === 'up' ? 1 : -1) : 0,
    pledgedAmount: 0,
    pledgedCollected: 0
  };

  // Derive street performance from fetched offerings
  // Backend-provided street performance for selected date range
  const { data: streetAggData, loading: streetAggLoading, error: streetAggError } = useQuery(
    GET_OFFERINGS_BY_STREET,
    { variables: { start: dateFilter.start, end: dateFilter.end } }
  );
  const { data: trendData, loading: trendLoading } = useQuery(GET_OFFERINGS_TREND, { variables: { months: 12 } });
  const streets: StreetStats[] = (streetAggData?.offeringsByStreet || []).map((s: any) => ({
    name: s.name,
    total: Number(s.total) || 0,
    memberCount: Number(s.memberCount) || 0,
    average: Number(s.average) || 0,
    trend: (s.trend || 'up') as 'up' | 'down',
  }));

  if (statsLoading || recentLoading || massLoading || typeLoading || streetAggLoading || trendLoading) {
    return (
      <div className="min-h-screen bg-[#E8FFD7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E936C]"></div>
      </div>
    );
  }

  if (statsError || recentError || massError || typeError || streetAggError) {
    // Log detailed errors for diagnostics
    if (statsError) console.error('OfferingStats error:', statsError);
    if (recentError) console.error('RecentOfferings error:', recentError);
    if (massError) console.error('OfferingsByMass error:', massError);
    if (typeError) console.error('OfferingsByType error:', typeError);
    if (streetAggError) console.error('OfferingsByStreet error:', streetAggError);
    return (
      <div className="min-h-screen bg-[#E8FFD7] flex items-center justify-center text-red-600">
        Failed to load offerings data.
        <pre className="text-xs text-gray-700 bg-white p-2 ml-3 rounded max-w-xl overflow-auto">
          {JSON.stringify({
            stats: statsError?.message,
            recent: recentError?.message,
            mass: massError?.message,
            type: typeError?.message,
            street: streetAggError?.message,
          }, null, 2)}
        </pre>
      </div>
    );
  }

  // Mass type stats from backend
  const massIconMap: Record<string, JSX.Element> = {
    sunday: <FaChurch />,
    'morning-glory': <FaPrayingHands />,
    'evening-glory': <GiCrossedChains />,
    seli: <FaUsers />,
    other: <FaReceipt />,
  };
  const massColorMap: Record<string, string> = {
    sunday: '#5E936C',
    'morning-glory': '#93DA97',
    'evening-glory': '#4A8C5F',
    seli: '#3A7A4F',
    other: '#6B7280',
  };
  const humanizeMass = (t: string) => {
    const x = (t || '').toLowerCase();
    if (x === 'sunday') return t('mass_sunday');
    if (x.includes('morning')) return t('mass_morning');
    if (x.includes('evening')) return t('mass_evening');
    if (x.includes('seli')) return t('mass_seli');
    return t('category_general'); // Fallback or 'Other'
  };
  const massTypeStats: MassTypeStats[] = (massData?.offeringsByMass || []).map((m: any) => {
    const key = (m.type || 'other').toLowerCase();
    return {
      type: humanizeMass(key),
      amount: Number(m.amount) || 0,
      percentage: Number(m.percentage) || 0,
      color: massColorMap[key] || '#6B7280',
      icon: massIconMap[key] || <FaReceipt />,
    } as MassTypeStats;
  });

  // Offering types from backend
  const typeIconMap: Record<string, JSX.Element> = {
    tithe: <GiMoneyStack />,
    special: <FaMoneyBillWave />,
    general: <FaChartBar />,
    pledge: <FaReceipt />,
    ahadi: <FaMoneyBillWave />,
    shukrani: <FaMoneyBillWave />,
    majengo: <FaMoneyBillWave />,
  };
  const typeColorMap: Record<string, string> = {
    tithe: '#5E936C',
    special: '#93DA97',
    general: '#4A8C5F',
    pledge: '#3A7A4F',
    ahadi: '#5E936C',
    shukrani: '#93DA97',
    majengo: '#4A8C5F',
  };
  const humanizeType = (t: string) => {
    const x = (t || '').toLowerCase();
    if (x === 'tithe') return t('offering_tithe');
    if (x === 'special') return t('offering_special');
    if (x === 'pledge') return t('offering_pledge');
    if (x === 'ahadi') return t('offering_ahadi');
    if (x === 'shukrani') return t('offering_shukrani');
    if (x === 'majengo') return t('offering_majengo');
    return t('category_general');
  };
  const offeringTypes = (typeData?.offeringsByType || []).map((t: any) => {
    const raw = (t.type || 'general');
    const key = raw.toLowerCase();
    return {
      type: humanizeType(key),
      amount: Number(t.amount) || 0,
      percentage: Number(t.percentage) || 0,
      color: typeColorMap[key] || '#6B7280',
      icon: typeIconMap[key] || <FaReceipt />,
    };
  });

  // Filter offerings based on selected filters
  const filteredOfferings = offerings.filter(offering => {
    const matchesStreet = selectedStreet === 'all' || offering.street === selectedStreet;
    const offeringDate = new Date(offering.date);
    const startDate = new Date(dateFilter.start);
    const endDate = new Date(dateFilter.end);

    return matchesStreet && offeringDate >= startDate && offeringDate <= endDate;
  });

  // Calculate filtered stats

  // Format currency (Tanzanian Shillings)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Export to PDF/Excel
  const handleExport = (format: 'pdf' | 'excel') => {
    const params = {
      start_date: dateFilter.start,
      end_date: dateFilter.end,
      street: selectedStreet,
    };

    if (format === 'excel') {
      handleExportDownload('/api/export/contributions/', 'offerings_export.csv', params);
    } else {
      handleExportDownload('/api/export/contributions/pdf/', 'offerings_report.pdf', params);
    }
  };

  return (
    <div className="flex h-screen bg-[#E8FFD7] overflow-hidden">


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">


        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4  md:p-6 bg-[#F7FCF5]">
          <AnimatePresence mode="wait">
            {activeView === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Header with Filters */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#5E936C]">{t('offerings_dashboard_title')}</h2>
                      <p className="text-gray-600">{t('offerings_dashboard_subtitle')}</p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      >
                        <option value="week">{t('this_week')}</option>
                        <option value="month">{t('this_month')}</option>
                        <option value="quarter">{t('this_quarter')}</option>
                        <option value="year">{t('this_year')}</option>
                      </select>

                      <select
                        value={selectedStreet}
                        onChange={(e) => setSelectedStreet(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      >
                        <option value="all">{t('all_streets')}</option>
                        {streets.map(street => (
                          <option key={street.name} value={street.name}>{street.name}</option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFilter.start}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        />
                        <span className="self-center text-gray-500">{t('to_label')}</span>
                        <input
                          type="date"
                          value={dateFilter.end}
                          onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                        />
                      </div>

                      <button
                        onClick={() => handleExport('pdf')}
                        className="bg-[#5E936C] text-white px-4 py-2 rounded-lg flex items-center"
                      >
                        <FaDownload className="mr-2" />
                        {t('export_btn')}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">{t('total_offerings')}</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{formatCurrency(offeringStats.total)}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaMoneyBillWave className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <BsGraphUp className="mr-1" />
                      <span>{offeringStats.growthRate}% {t('from_last_month')}</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">{t('this_month')}</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{formatCurrency(offeringStats.monthly)}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaCalendarAlt className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <span>{filteredOfferings.length} {t('transactions_label')}</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">{t('avg_per_member')}</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{formatCurrency(offeringStats.averagePerMember)}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaUsers className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-500">
                      <span>{t('based_on_members', { count: 600 })}</span>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">{t('pledge_progress')}</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{offeringStats.pledgedCollected}%</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <GiMoneyStack className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <span>{formatCurrency(offeringStats.pledgedAmount)} {t('pledged_label')}</span>
                    </div>
                  </motion.div>
                </div>

                {/* Charts and Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mass Type Distribution */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-[#5E936C] mb-4 flex items-center">
                      <FaChurch className="mr-2" />
                      {t('offerings_by_mass_title')}
                    </h3>
                    <div className="space-y-4">
                      {massTypeStats.map((mass) => (
                        <div key={mass.type} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full mr-3" style={{ backgroundColor: mass.color + '20' }}>
                              {React.cloneElement(mass.icon, { style: { color: mass.color } })}
                            </div>
                            <span className="font-medium">{mass.type}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-32 bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full"
                                style={{
                                  width: `${mass.percentage}%`,
                                  backgroundColor: mass.color
                                }}
                              ></div>
                            </div>
                            <span className="font-semibold">{formatCurrency(mass.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Offering Type Distribution */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-[#5E936C] mb-4 flex items-center">
                      <GiMoneyStack className="mr-2" />
                      {t('offerings_by_type_title')}
                    </h3>
                    <div className="space-y-4">
                      {offeringTypes?.map((type: OfferingType) => (
                        <div key={type.type} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="p-2 rounded-full mr-3" style={{ backgroundColor: type.color + '20' }}>
                              {React.cloneElement(type.icon, { style: { color: type.color } })}
                            </div>
                            <span className="font-medium">{type.type}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="w-32 bg-gray-200 rounded-full h-3">
                              <div
                                className="h-3 rounded-full"
                                style={{
                                  width: `${type.percentage}%`,
                                  backgroundColor: type.color
                                }}
                              ></div>
                            </div>
                            <span className="font-semibold">{formatCurrency(type.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Street Performance */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-lg font-semibold text-[#5E936C] mb-4 flex items-center">
                    <FaStreetView className="mr-2" />
                    {t('street_performance_title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {streets.map(street => (
                      <motion.div
                        key={street.name}
                        whileHover={{ scale: 1.05 }}
                        className="bg-gray-50 p-4 rounded-lg text-center"
                      >
                        <h4 className="font-bold text-gray-800 mb-2">{street.name}</h4>
                        <p className="text-xl md:text-2xl font-bold text-[#5E936C] mb-1 break-words leading-tight">{formatCurrency(street.total)}</p>
                        <div className="flex items-center justify-center text-sm">
                          {street.trend === 'up' ? (
                            <FaArrowUp className="text-green-500 mr-1" />
                          ) : (
                            <FaArrowDown className="text-red-500 mr-1" />
                          )}
                          <span className={street.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                            {t('avg_label')}: {formatCurrency(street.average)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{street.memberCount} {t('members_label').toLowerCase()}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[#5E936C]">{t('recent_offerings')}</h3>
                    <button
                      onClick={() => setActiveView('details')}
                      className="text-[#5E936C] hover:text-[#4a7a58] text-sm"
                    >
                      {t('view_all_link')} →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table_date')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table_member')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table_street')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table_type')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table_mass')}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('table_amount')}</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOfferings.slice(0, 5).map(offering => (
                          <tr key={offering.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(offering.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{offering.memberName}</div>
                              {offering.cardNumber && (
                                <div className="text-sm text-gray-500">{t('card_label')}: {offering.cardNumber}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">
                                {offering.street}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${offering.type === 'tithe' ? 'bg-blue-100 text-blue-800' :
                                offering.type === 'special' ? 'bg-green-100 text-green-800' :
                                  offering.type === 'general' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-purple-100 text-purple-800'
                                }`}>
                                {offering.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {offering.massType.replace('-', ' ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#5E936C]">
                              {formatCurrency(offering.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveView('trends')}
                    className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#5E936C] text-left hover:shadow-lg transition-shadow"
                  >
                    <FaChartLine className="text-3xl text-[#5E936C] mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">{t('view_trends_btn')}</h4>
                    <p className="text-gray-600 text-sm">{t('view_trends_desc')}</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveView('reports')}
                    className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#93DA97] text-left hover:shadow-lg transition-shadow"
                  >
                    <FaChartBar className="text-3xl text-[#5E936C] mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">{t('generate_reports_btn')}</h4>
                    <p className="text-gray-600 text-sm">{t('generate_reports_desc')}</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#4A8C5F] text-left hover:shadow-lg transition-shadow"
                  >
                    <FaPlus className="text-3xl text-[#5E936C] mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">{t('record_offering_btn')}</h4>
                    <p className="text-gray-600 text-sm">{t('record_offering_desc')}</p>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Additional views for trends, details, and reports would go here */}
            {activeView === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#5E936C]">{t('all_offerings_title')}</h2>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {t('back_to_overview')}
                  </button>
                </div>
                <p className="text-gray-600 mb-6">{t('all_offerings_desc')}</p>
                {/* Detailed table implementation would go here */}
              </motion.div>
            )}

            {activeView === 'trends' && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#5E936C]">{t('offering_trends_title')}</h2>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {t('back_to_overview')}
                  </button>
                </div>
                <p className="text-gray-600 mb-6">{t('trends_desc')}</p>

                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-[#5E936C] mb-6">{t('monthly_revenue_trend')}</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData?.offeringsTrend || []}>
                          <defs>
                            <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#5E936C" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#5E936C" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                          <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [formatCurrency(value), 'Amount']}
                          />
                          <Area type="monotone" dataKey="value" stroke="#5E936C" fillOpacity={1} fill="url(#colorTrend)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-[#5E936C] mb-6">{t('monthly_volume_comparison')}</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData?.offeringsTrend || []}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                          <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                          <Tooltip
                            cursor={{ fill: '#E8FFD7', opacity: 0.4 }}
                            contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [formatCurrency(value), 'Amount']}
                          />
                          <Bar dataKey="value" fill="#5E936C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeView === 'reports' && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#5E936C]">{t('reports_generator_title')}</h2>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {t('back_to_overview')}
                  </button>
                </div>
                <p className="text-gray-600 mb-6">{t('reports_generator_desc')}</p>
                {/* Report generation interface would go here */}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default OfferingsOverview;
// Revision note [2026-07-20 18:36:45 +0300]: Refactor footer social links and text styling
