import React, { useState, useEffect } from 'react';
import { 
  FaMoneyBillWave, FaChartLine, FaCalendarAlt, FaUsers, 
  FaStreetView, FaDownload, FaFilter, FaSearch, 
  FaArrowUp, FaArrowDown, FaChurch, FaPrayingHands,
  FaBell, FaEnvelope, FaEye, FaEdit, FaUserFriends, FaTrash,
  FaPlus, FaHistory, FaChartBar, FaReceipt
} from 'react-icons/fa';
import { GiCrossedChains, GiMoneyStack } from 'react-icons/gi';
import { MdOutlineDashboard, MdTrendingUp, MdTrendingDown } from 'react-icons/md';
import { BsGraphUp, BsPeopleFill, BsThreeDotsVertical } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@apollo/client';
import { 
  GET_OFFERING_STATS, 
  GET_STREETS_AND_GROUPS,
  GET_RECENT_OFFERINGS,
  GET_OFFERINGS_BY_MASS,
  GET_OFFERINGS_BY_TYPE,
  GET_OFFERINGS_BY_STREET,
} from '../../api/queries';

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

const OfferingsOverview = () => {
  const [activeView, setActiveView] = useState<'overview' | 'details' | 'trends' | 'reports'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedStreet, setSelectedStreet] = useState<string>('all');
  // Default to current month
  const todayIso = new Date().toISOString().slice(0,10);
  const monthStartIso = (() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0,10); })();
  const [dateFilter, setDateFilter] = useState({
    start: monthStartIso,
    end: todayIso,
  });

  // Backend data
  const { data: statsData, loading: statsLoading, error: statsError } = useQuery(GET_OFFERING_STATS);
  const { data: streetsGroupsData } = useQuery(GET_STREETS_AND_GROUPS);
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
  const streets: StreetStats[] = (streetAggData?.offeringsByStreet || []).map((s: any) => ({
    name: s.name,
    total: Number(s.total) || 0,
    memberCount: Number(s.memberCount) || 0,
    average: Number(s.average) || 0,
    trend: (s.trend || 'up') as 'up'|'down',
  }));

  if (statsLoading || recentLoading || massLoading || typeLoading || streetAggLoading) {
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
    if (x === 'sunday') return 'Sunday Mass';
    if (x.includes('morning')) return 'Morning Glory';
    if (x.includes('evening')) return 'Evening Glory';
    if (x.includes('seli')) return 'SELI Mass';
    return 'Other';
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
    if (x === 'tithe') return 'Tithe';
    if (x === 'special') return 'Special Offering';
    if (x === 'pledge') return 'Pledge Payment';
    if (x === 'ahadi') return 'Ahadi';
    if (x === 'shukrani') return 'Shukrani';
    if (x === 'majengo') return 'Majengo';
    return 'General Contribution';
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

  // TODO: Replace with backend-provided monthly trend when available
  const monthlyTrend: { month: string; amount: number }[] = [];

  // Filter offerings based on selected filters
  const filteredOfferings = offerings.filter(offering => {
    const matchesStreet = selectedStreet === 'all' || offering.street === selectedStreet;
    const offeringDate = new Date(offering.date);
    const startDate = new Date(dateFilter.start);
    const endDate = new Date(dateFilter.end);
    
    return matchesStreet && offeringDate >= startDate && offeringDate <= endDate;
  });

  // Calculate filtered stats
  const filteredStats = {
    total: filteredOfferings.reduce((sum, offering) => sum + offering.amount, 0),
    count: filteredOfferings.length,
    average: filteredOfferings.length > 0 ? 
      filteredOfferings.reduce((sum, offering) => sum + offering.amount, 0) / filteredOfferings.length : 0
  };

  // Format currency (Tanzanian Shillings)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-TZ').format(num);
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Export to PDF/Excel
  const handleExport = (format: 'pdf' | 'excel') => {
    console.log(`Exporting to ${format}`);
    alert(`Exporting offerings data to ${format.toUpperCase()}`);
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
                      <h2 className="text-2xl font-bold text-[#5E936C]">Offerings Dashboard</h2>
                      <p className="text-gray-600">Comprehensive overview of church offerings and financial health</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      >
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                      </select>
                      
                      <select
                        value={selectedStreet}
                        onChange={(e) => setSelectedStreet(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                      >
                        <option value="all">All Streets</option>
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
                        <span className="self-center text-gray-500">to</span>
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
                        Export
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
                        <p className="text-gray-500">Total Offerings</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{formatCurrency(offeringStats.total)}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaMoneyBillWave className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <BsGraphUp className="mr-1" />
                      <span>{offeringStats.growthRate}% from last month</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">This Month</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{formatCurrency(offeringStats.monthly)}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaCalendarAlt className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <span>{filteredOfferings.length} transactions</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Avg per Member</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{formatCurrency(offeringStats.averagePerMember)}</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <FaUsers className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-blue-500">
                      <span>Based on 600 members</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-500">Pledge Progress</p>
                        <h3 className="text-2xl md:text-3xl font-bold text-[#5E936C] break-words leading-tight">{offeringStats.pledgedCollected}%</h3>
                      </div>
                      <div className="bg-[#E8FFD7] p-3 rounded-full">
                        <GiMoneyStack className="text-2xl text-[#5E936C]" />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-500">
                      <span>{formatCurrency(offeringStats.pledgedAmount)} pledged</span>
                    </div>
                  </motion.div>
                </div>

                {/* Charts and Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Mass Type Distribution */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-semibold text-[#5E936C] mb-4 flex items-center">
                      <FaChurch className="mr-2" />
                      Offerings by Mass Type
                    </h3>
                    <div className="space-y-4">
                      {massTypeStats.map((mass, index) => (
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
                      Offerings by Type
                    </h3>
                    <div className="space-y-4">
                      {offeringTypes.map((type, index) => (
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
                    Street-wise Performance
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
                            Avg: {formatCurrency(street.average)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{street.memberCount} members</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[#5E936C]">Recent Offerings</h3>
                    <button
                      onClick={() => setActiveView('details')}
                      className="text-[#5E936C] hover:text-[#4a7a58] text-sm"
                    >
                      View All →
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Street</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mass</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
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
                                <div className="text-sm text-gray-500">Card: {offering.cardNumber}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 bg-[#E8FFD7] text-[#5E936C] text-xs rounded-full">
                                {offering.street}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                                offering.type === 'tithe' ? 'bg-blue-100 text-blue-800' :
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
                    <h4 className="font-semibold text-gray-800 mb-2">View Trends</h4>
                    <p className="text-gray-600 text-sm">Analyze offering patterns over time</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveView('reports')}
                    className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#93DA97] text-left hover:shadow-lg transition-shadow"
                  >
                    <FaChartBar className="text-3xl text-[#5E936C] mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">Generate Reports</h4>
                    <p className="text-gray-600 text-sm">Create detailed offering reports</p>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#4A8C5F] text-left hover:shadow-lg transition-shadow"
                  >
                    <FaPlus className="text-3xl text-[#5E936C] mb-3" />
                    <h4 className="font-semibold text-gray-800 mb-2">Record Offering</h4>
                    <p className="text-gray-600 text-sm">Add new offering entry</p>
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
                  <h2 className="text-2xl font-bold text-[#5E936C]">All Offerings</h2>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Back to Overview
                  </button>
                </div>
                <p className="text-gray-600 mb-6">Detailed view of all offering transactions with advanced filtering options.</p>
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
                  <h2 className="text-2xl font-bold text-[#5E936C]">Offering Trends</h2>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Back to Overview
                  </button>
                </div>
                <p className="text-gray-600 mb-6">Visual analysis of offering patterns and growth trends over time.</p>
                {/* Trends visualization would go here */}
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
                  <h2 className="text-2xl font-bold text-[#5E936C]">Reports Generator</h2>
                  <button
                    onClick={() => setActiveView('overview')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Back to Overview
                  </button>
                </div>
                <p className="text-gray-600 mb-6">Generate detailed reports for specific time periods and categories.</p>
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