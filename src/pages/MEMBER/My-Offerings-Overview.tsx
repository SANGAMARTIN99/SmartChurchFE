import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { format, parseISO } from 'date-fns';
import {
  ME_QUERY,
  GET_RECENT_OFFERINGS,
  GET_OFFERINGS_BY_TYPE,
} from '../../api/queries';
import { CREATE_CARD_APPLICATION } from '../../api/mutations';
import { GET_STREETS_AND_GROUPS, REGISTRATION_WINDOW_STATUS, NUMBER_SUGGESTIONS, MY_CARD_STATE } from '../../api/queries';

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

// Simple Modal used for card request
const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded shadow-lg w-full max-w-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-[#5E936C]">{title}</h3>
          <button className="text-gray-600" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
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

  // Card request modal state and mutation
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
      setPreferredNumber('' as any);
      setPledgeAhadi('' as any);
      setPledgeShukrani('' as any);
      setPledgeMajengo('' as any);
      setRequestError(null);
      // update gating state
      refetchMyCard && refetchMyCard();
    },
    onError: (err) => {
      setRequestError(err.message || 'Failed to submit request');
    }
  });

  const { data: streetsData } = useQuery(GET_STREETS_AND_GROUPS);
  const streets = streetsData?.streets || [];

  const { data: windowStatus } = useQuery(REGISTRATION_WINDOW_STATUS);
  const { data: myCardStateData, refetch: refetchMyCard } = useQuery(MY_CARD_STATE);
  const hasPendingApp = !!myCardStateData?.myCardState?.hasPendingApplication;
  const hasCurrentAssignment = !!myCardStateData?.myCardState?.hasCurrentAssignment;

  const { data: suggestionsData } = useQuery(NUMBER_SUGGESTIONS, {
    variables: { streetId: streetId || 0, queryNumber: preferredNumber || 0, limit: 5 },
    skip: !streetId || !preferredNumber,
    fetchPolicy: 'cache-and-network',
  });

  React.useEffect(() => {
    if (me?.me) {
      setFullName(me.me.fullName || '');
      setPhoneNumber(me.me.phoneNumber || '');
      setStreetId(me.me.street?.id || 0);
    }
  }, [me]);

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
            {!hasPendingApp && !hasCurrentAssignment ? (
              <button
                onClick={() => setRequestOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#5E936C] text-white"
              >
                Request Offering Card
              </button>
            ) : (
              <div className="px-4 py-2 rounded-lg bg-gray-200 text-gray-600 cursor-not-allowed" title={hasCurrentAssignment ? 'You already have a current-year card' : 'You already have a pending application'}>
                {hasCurrentAssignment ? 'Card Active' : 'Application Pending'}
              </div>
            )}
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
                  {typeSlices.map((s: any, i: number) => (
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
        {/* Request Card Modal */}
        <Modal open={requestOpen} title="Request Offering Card" onClose={() => setRequestOpen(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setRequestError(null);
              await createApplication({
                variables: {
                  input: {
                    fullName,
                    phoneNumber,
                    streetId: streetId ? Number(streetId) : null,
                    preferredNumber: preferredNumber ? Number(preferredNumber) : null,
                    pledgedAhadi: pledgeAhadi ? Number(pledgeAhadi) : 0,
                    pledgedShukrani: pledgeShukrani ? Number(pledgeShukrani) : 0,
                    pledgedMajengo: pledgeMajengo ? Number(pledgeMajengo) : 0,
                  },
                },
              });
            }}
            className="grid md:grid-cols-2 gap-3 items-end"
          >
            {requestError && (
              <div className="md:col-span-2 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{requestError}</div>
            )}
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Full Name</span>
              <input className="border rounded px-2 py-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Phone Number</span>
              <input className="border rounded px-2 py-1" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Street</span>
              <select className="border rounded px-2 py-1" value={streetId as any} onChange={(e) => setStreetId(e.target.value ? Number(e.target.value) : ('' as any))}>
                <option value="">Select street</option>
                {streets.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Preferred Card Number (optional)</span>
              <input type="number" className="border rounded px-2 py-1" value={preferredNumber as any} onChange={(e) => setPreferredNumber(e.target.value ? Number(e.target.value) : ('' as any))} />
            </label>

            {/* Pledges */}
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pledge - Ahadi</span>
              <input type="number" className="border rounded px-2 py-1" value={pledgeAhadi as any} onChange={(e) => setPledgeAhadi(e.target.value ? Number(e.target.value) : ('' as any))} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pledge - Shukrani</span>
              <input type="number" className="border rounded px-2 py-1" value={pledgeShukrani as any} onChange={(e) => setPledgeShukrani(e.target.value ? Number(e.target.value) : ('' as any))} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pledge - Majengo</span>
              <input type="number" className="border rounded px-2 py-1" value={pledgeMajengo as any} onChange={(e) => setPledgeMajengo(e.target.value ? Number(e.target.value) : ('' as any))} />
            </label>

            {/* Suggestions */}
            {streetId && preferredNumber && (
              <div className="md:col-span-2 text-sm">
                {suggestionsData?.numberSuggestions?.exactAvailable ? (
                  <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700">Exact number {preferredNumber} is available ({suggestionsData.numberSuggestions.exactCode}).</div>
                ) : (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                    <div className="mb-2">Number {preferredNumber} is taken or unavailable. Suggested free numbers:</div>
                    <div className="flex flex-wrap gap-2">
                      {(suggestionsData?.numberSuggestions?.suggestions || []).map((s: any) => (
                        <button type="button" key={s.code} className="px-2 py-1 border rounded hover:bg-green-50" onClick={() => setPreferredNumber(s.number)}>
                          {s.code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="md:col-span-2 text-xs text-gray-600 space-y-1">
              <p>• Once approved and assigned, your offering card remains fixed for one full calendar year.</p>
              <p>• Card request windows are opened by the secretary. If the window is closed, your request will be queued for manual review and approval.</p>
              {windowStatus?.registrationWindowStatus && (
                <p>
                  Registration window is {windowStatus.registrationWindowStatus.isOpen ? 'OPEN' : 'CLOSED'}{windowStatus.registrationWindowStatus.startAt ? ` · ${windowStatus.registrationWindowStatus.startAt} → ${windowStatus.registrationWindowStatus.endAt}` : ''}
                </p>
              )}
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button disabled={requesting} className="bg-[#5E936C] text-white px-3 py-2 rounded disabled:opacity-50">{requesting ? 'Submitting…' : 'Submit Request'}</button>
              <button type="button" className="border px-3 py-2 rounded" onClick={() => setRequestOpen(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default MyOfferingsOverview;