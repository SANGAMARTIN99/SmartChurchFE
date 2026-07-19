import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { FaUsers, FaSearch, FaDownload, FaFilePdf } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { GET_RECENT_OFFERINGS, GET_STREETS_AND_GROUPS } from '../../api/queries';
import { handleExportDownload } from '../../utils/export';

const MemberContributions: React.FC = () => {
  const { t } = useTranslation();
  // Defaults: current month
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const [search, setSearch] = useState('');
  const [streetFilter, setStreetFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: `${yyyy}-${mm}-01`, end: `${yyyy}-${mm}-${dd}` });

  const { data: streetsData } = useQuery(GET_STREETS_AND_GROUPS);
  const { data, loading, error } = useQuery(GET_RECENT_OFFERINGS, { variables: { limit: 500 } });

  const offerings = (data?.recentOfferings || []).map((o: any) => ({
    id: o.id as string,
    date: o.date as string,
    memberName: o.memberName as string,
    street: o.street as string,
    amount: Number(o.amount) || 0,
    type: String(o.offeringType || '').toLowerCase(),
  }));

  const sDate = new Date(dateRange.start);
  const eDate = new Date(dateRange.end);
  const filtered = offerings.filter((o: any) => {
    const inStreet = streetFilter === 'all' || o.street === streetFilter;
    const inType = typeFilter === 'all' || o.type.includes(typeFilter);
    const inSearch = !search || o.memberName.toLowerCase().includes(search.toLowerCase());
    const d = new Date(o.date);
    return inStreet && inType && inSearch && d >= sDate && d <= eDate;
  });

  const fmt = (n: number) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(n);

  // Aggregate by member for table/metrics
  const rowsMap = new Map<string, { name: string; street: string; total: number; count: number; last: string }>();
  filtered.forEach((o: any) => {
    const k = o.memberName;
    const cur = rowsMap.get(k) || { name: o.memberName, street: o.street, total: 0, count: 0, last: o.date };
    cur.total += o.amount;
    cur.count += 1;
    if (new Date(o.date) > new Date(cur.last)) cur.last = o.date;
    if (!cur.street && o.street) cur.street = o.street;
    rowsMap.set(k, cur);
  });
  const rows = Array.from(rowsMap.values()).sort((a, b) => b.total - a.total);
  const totalContributions = rows.reduce((s, r) => s + r.total, 0);
  const totalTransactions = filtered.length;

  if (loading) return (<div className="min-h-screen bg-[#E8FFD7] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E936C]"></div></div>);
  if (error) return (<div className="min-h-screen bg-[#E8FFD7] flex items-center justify-center text-red-600">{t('load_contributions_failed')}</div>);

  return (
    <div className="flex h-screen bg-[#E8FFD7] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7FCF5] ">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-[#5E936C] p-3 rounded-full mr-4"><FaUsers className="text-2xl text-white" /></div>
              <div>
                <h1 className="text-2xl font-bold text-[#5E936C]">{t('Member Contributions')}</h1>
                <p className="text-gray-600">{t('contributions_subtitle')}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleExportDownload('/api/export/contributions/', 'contributions.csv', {
                  start_date: dateRange.start,
                  end_date: dateRange.end,
                  street: streetFilter,
                  type: typeFilter
                })}
                className="px-4 py-2 rounded-lg bg-[#E8FFD7] text-[#5E936C] flex items-center hover:bg-[#d4f5bc] transition-colors"
              >
                <FaDownload className="mr-2" /> CSV
              </button>
              <button
                onClick={() => handleExportDownload('/api/export/contributions/pdf/', 'contributions_report.pdf', {
                  start_date: dateRange.start,
                  end_date: dateRange.end,
                  street: streetFilter,
                  type: typeFilter
                })}
                className="px-4 py-2 rounded-lg bg-[#5E936C] text-white flex items-center hover:bg-[#4a7a58] transition-colors"
              >
                <FaFilePdf className="mr-2" /> PDF
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2 relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder={t('search_member_placeholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C]"
              />
            </div>
            <div>
              <select
                value={streetFilter}
                onChange={(e) => setStreetFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#5E936C]"
              >
                <option value="all">{t('all_streets')}</option>
                {(streetsData?.streets || []).map((s: any) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#5E936C]"
              >
                <option value="all">{t('all_types')}</option>
                <option value="tithe">{t('tithe')}</option>
                <option value="special">{t('special')}</option>
                <option value="general">{t('general')}</option>
                <option value="pledge">{t('pledge')}</option>
              </select>
            </div>
            <div>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#5E936C]"
              />
            </div>
            <div>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#5E936C]"
              />
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#5E936C]">
              <p className="text-gray-500">{t('total_contributions')}</p>
              <h3 className="text-2xl font-bold text-[#5E936C]">{fmt(totalContributions)}</h3>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#93DA97]">
              <p className="text-gray-500">{t('contributing_members')}</p>
              <h3 className="text-2xl font-bold text-[#5E936C]">{rows.length}</h3>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-[#4A8C5F]">
              <p className="text-gray-500">{t('avg_per_member')}</p>
              <h3 className="text-2xl font-bold text-[#5E936C]">{fmt(rows.length ? totalContributions / rows.length : 0)}</h3>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#5E936C]">{t('members_title')}</h3>
              <span className="text-sm text-gray-500">{totalTransactions} {t('transactions')}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Member')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('street')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Contributions')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('last_date')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('total')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rows.map((r) => (
                    <tr key={r.name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.street || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(r.last).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-right text-[#5E936C]">{fmt(r.total)}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">{t('no_contributions_match')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MemberContributions;

// Revision note [2026-07-21 14:32:38 +0300]: Update dropdown selector options and hints

// Revision note [2026-08-04 18:32:10 +0300]: Refactor route guards and auth check hooks

// Activity update [2026-07-19 10:16:08 +0300]: Update dropdown selector options and hints
