import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import { format, parseISO } from 'date-fns';
import {
  ME_QUERY,
  GET_RECENT_OFFERINGS,
  GET_OFFERINGS_BY_TYPE,
} from '../../api/queries';

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
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS' }).format(n || 0);

// Minimal SVG line chart
const LineChart = ({
  series,
  w = 520,
  h = 160,
  color = '#5E936C',
}: {
  series: number[];
  w?: number;
  h?: number;
  color?: string;
}) => {
  if (!series.length) return <div className="text-sm text-gray-500">No data</div>;
  const max = Math.max(1, ...series);
  const stepX = series.length > 1 ? w / (series.length - 1) : w;
  const pts = series
    .map((v, i) => `${i * stepX},${h - (v / max) * (h - 8) - 4}`)
    .join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline fill="none" stroke={color} strokeWidth="2" points={pts} />
    </svg>
  );
};

// Minimal pie via CSS conic-gradient
const Pie = ({
  slices,
  size = 180,
}: {
  slices: { color: string; value: number }[];
  size?: number;
}) => {
  const total = Math.max(1, slices.reduce((s, x) => s + (x.value || 0), 0));
  let acc = 0;
  const stops = slices
    .map((s) => {
      const start = (acc / total) * 360;
      acc += s.value || 0;
      const end = (acc / total) * 360;
      return `${s.color} ${start}deg ${end}deg`;
    })
    .join(', ');
  return (
    <div
      className="rounded-full mx-auto"
      style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
    />
  );
};

const MyOfferingsOverview: React.FC = () => {
  const [view, setView] = useState<ViewMode>('basic');
  const [q, setQ] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    return { start, end };
  });

  const { data: me } = useQuery(ME_QUERY);
  const { data: recent, loading } = useQuery(GET_RECENT_OFFERINGS, {
    variables: { limit: 100 },
    fetchPolicy: 'cache-and-network',
  });
  const { data: typeBreakdown } = useQuery(GET_OFFERINGS_BY_TYPE, {
    variables: { start: dateRange.start, end: dateRange.end },
    fetchPolicy: 'cache-and-network',
  });

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
    }));
  }, [recent]);

  const mine: OfferingVM[] = useMemo(() => {
    const rows = myName ? all.filter((r) => (r.memberName || '').toLowerCase() === myName) : all;
    const term = q.trim().toLowerCase();
    const byTerm = term
      ? rows.filter(
          (r) =>
            r.type.includes(term) ||
            r.massType.toLowerCase().includes(term) ||
            format(parseISO(r.date), 'MMM dd, yyyy').toLowerCase().includes(term)
        )
      : rows;
    const byDate = byTerm.filter((r) => {
      const d = new Date(r.date);
      return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
    });
    return byDate;
  }, [all, myName, q, dateRange]);

  const total = mine.reduce((s, x) => s + (x.amount || 0), 0);
  const avg = mine.length ? total / mine.length : 0;

  // Monthly trend (last 6 months from mine)
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    mine.forEach((o) => {
      const key = format(parseISO(o.date), 'yyyy-MM');
      map.set(key, (map.get(key) || 0) + (o.amount || 0));
    });
    // Create last 6 month keys in ascending order
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(format(d, 'yyyy-MM'));
    }
    return months.map((k) => map.get(k) || 0);
  }, [mine]);

  // Type breakdown slices (from API if present, else from mine)
  const typeSlices = useMemo(() => {
    const palette: Record<string, string> = {
      tithe: '#5E936C',
      special: '#93DA97',
      general: '#4A8C5F',
      pledge: '#3A7A4F',
      other: '#6B7280',
    };
    if (typeBreakdown?.offeringsByType?.length) {
      return typeBreakdown.offeringsByType.map((t: any) => ({
        color: palette[(t.type || 'general').toLowerCase()] || '#6B7280',
        value: Number(t.amount) || 0,
        label: t.type,
      }));
    }
    // fallback from client data
    const sum: Record<string, number> = {};
    mine.forEach((o) => {
      const k = o.type || 'general';
      sum[k] = (sum[k] || 0) + (o.amount || 0);
    });
    return Object.entries(sum).map(([k, v]) => ({
      color: palette[k] || '#6B7280',
      value: v,
      label: k,
    }));
  }, [typeBreakdown, mine]);

  const exportCsv = () => {
    const header = ['Date', 'Amount', 'Type', 'Mass', 'Attendant'];
    const rows = mine.map((o) => [
      format(parseISO(o.date), 'yyyy-MM-dd'),
      String(o.amount),
      o.type,
      o.massType,
      o.attendant || '',
    ]);
    const csv =
      [header, ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-offerings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 bg-[#F7FCF5] min-h-[calc(100vh-3rem)]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#5E936C]">My Offerings</h1>
            <p className="text-gray-600">Your contributions and insights</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('basic')}
              className={`px-4 py-2 rounded-lg ${
                view === 'basic' ? 'bg-[#5E936C] text-white' : 'bg-[#E8FFD7] text-[#5E936C]'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`px-4 py-2 rounded-lg ${
                view === 'analytics' ? 'bg-[#5E936C] text-white' : 'bg-[#E8FFD7] text-[#5E936C]'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {view === 'basic' && (
          <div className="mt-6 space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-[#5E936C]">
                <p className="text-gray-500">Total Given</p>
                <div className="text-2xl font-bold text-[#5E936C]">{currency(total)}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-[#93DA97]">
                <p className="text-gray-500">Transactions</p>
                <div className="text-2xl font-bold text-[#5E936C]">{mine.length}</div>
              </div>
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-[#5E936C]">
                <p className="text-gray-500">Average</p>
                <div className="text-2xl font-bold text-[#5E936C]">{currency(avg)}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-xl shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search type or mass"
                  className="px-3 py-2 border rounded-lg w-64"
                />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <button onClick={exportCsv} className="px-4 py-2 rounded-lg bg-[#5E936C] text-white">
                Export CSV
              </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow p-4">
              <h2 className="font-semibold text-[#5E936C] mb-3">Recent Offerings</h2>
              {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : mine.length ? (
                <div className="divide-y">
                  {mine.slice(0, 12).map((o) => (
                    <div key={o.id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">
                          {format(parseISO(o.date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {o.type} • {o.massType}
                        </div>
                      </div>
                      <div className="font-semibold text-[#5E936C]">{currency(o.amount)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">No offerings found.</div>
              )}
            </div>
          </div>
        )}

        {view === 'analytics' && (
          <div className="mt-6 space-y-6">
            {/* Trend */}
            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-[#5E936C]">Monthly Trend (last 6)</h2>
              </div>
              <LineChart series={monthlyTrend} />
              <div className="mt-2 text-sm text-gray-500">
                Values aggregated from your recent transactions.
              </div>
            </div>

            {/* Type breakdown */}
            <div className="bg-white rounded-xl shadow p-5">
              <h2 className="font-semibold text-[#5E936C] mb-4">Offering Types</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Pie slices={typeSlices} />
                <div className="space-y-2">
                  {typeSlices.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span
                          className="inline-block w-3 h-3 rounded mr-3"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="capitalize text-gray-700">{s.label || 'Type'}</span>
                      </div>
                      <span className="font-semibold text-[#5E936C]">{currency(s.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Small insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-500">Best Month</p>
                <div className="text-lg font-bold text-[#5E936C]">
                  {(() => {
                    if (!monthlyTrend.length) return '—';
                    const max = Math.max(...monthlyTrend);
                    const idx = monthlyTrend.indexOf(max);
                    const base = new Date();
                    const monthDate = new Date(base.getFullYear(), base.getMonth() - (5 - idx), 1);
                    return `${format(monthDate, 'MMM yyyy')} · ${currency(max)}`;
                  })()}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-500">Most Frequent Type</p>
                <div className="text-lg font-bold text-[#5E936C]">
                  {(() => {
                    const count: Record<string, number> = {};
                    mine.forEach((o) => (count[o.type] = (count[o.type] || 0) + 1));
                    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
                    return top ? top[0] : '—';
                  })()}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-gray-500">Common Mass</p>
                <div className="text-lg font-bold text-[#5E936C]">
                  {(() => {
                    const count: Record<string, number> = {};
                    mine.forEach((o) => (count[o.massType] = (count[o.massType] || 0) + 1));
                    const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
                    return top ? top[0] : '—';
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOfferingsOverview;