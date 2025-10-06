import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_STREETS_AND_GROUPS, GET_OFFERING_CARDS, GET_AVAILABLE_CARD_NUMBERS, GET_CARDS_OVERVIEW } from '../../api/queries';
import { CREATE_OFFERING_CARD, ASSIGN_CARD, UPDATE_ASSIGNMENT, RECORD_OFFERING_ENTRY, BULK_GENERATE_CARDS } from '../../api/mutations';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white shadow rounded p-4 mb-6">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    {children}
  </div>
);

const Modal: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode }> = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded shadow-lg w-full max-w-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-green-700">{title}</h3>
          <button className="text-gray-600" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Tabs: React.FC<{ tabs: string[]; active: string; onChange: (t: string) => void }> = ({ tabs, active, onChange }) => (
  <div className="flex gap-2 border-b mb-4">
    {tabs.map(t => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={`px-3 py-2 -mb-px border-b-2 ${active === t ? 'border-green-600 text-green-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}
      >
        {t}
      </button>
    ))}
  </div>
);

const numberFmt = (n?: number | null) => (n ?? 0).toLocaleString();

const OfferingCardsPage: React.FC = () => {
  const tabs = ['Create', 'Taken', 'Free', 'Overview'];
  const [active, setActive] = useState<string>('Create');
  const [streetFilter, setStreetFilter] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data: meta } = useQuery(GET_STREETS_AND_GROUPS);
  const streets = meta?.streets ?? [];

  const { data: cardsData, refetch: refetchCards } = useQuery(GET_OFFERING_CARDS, {
    variables: { streetId: streetFilter ?? null, isTaken: active === 'Free' ? false : active === 'Taken' ? true : null, search: search || null },
    fetchPolicy: 'cache-and-network',
  });
  const cards = cardsData?.offeringCards ?? [];

  const { data: availableData, refetch: refetchAvailable } = useQuery(GET_AVAILABLE_CARD_NUMBERS, {
    variables: { streetId: streetFilter ?? null },
    skip: active !== 'Free' && active !== 'Create',
  });
  const available = availableData?.availableCardNumbers ?? [];

  const { data: overviewData, refetch: refetchOverview } = useQuery(GET_CARDS_OVERVIEW, {
    variables: { streetId: streetFilter ?? null },
    skip: active !== 'Overview',
  });

  const [createCard, { loading: creating }] = useMutation(CREATE_OFFERING_CARD, {
    onCompleted: () => { refetchCards(); refetchAvailable(); },
  });
  const [bulkGenerate, { loading: bulkLoading }] = useMutation(BULK_GENERATE_CARDS, {
    onCompleted: () => { refetchCards(); refetchAvailable(); refetchOverview && refetchOverview(); },
  });
  const [assignCard, { loading: assigning }] = useMutation(ASSIGN_CARD, {
    onCompleted: () => { refetchCards(); refetchAvailable(); refetchOverview && refetchOverview(); },
  });
  const [updateAssignment] = useMutation(UPDATE_ASSIGNMENT, {
    onCompleted: () => { refetchCards(); refetchOverview && refetchOverview(); },
  });
  const [recordEntry] = useMutation(RECORD_OFFERING_ENTRY, {
    onCompleted: () => { refetchCards(); refetchOverview && refetchOverview(); },
  });

  // Create
  const [createStreetId, setCreateStreetId] = useState<number | ''>('' as any);
  const [createNumber, setCreateNumber] = useState<number | ''>('' as any);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createStreetId || !createNumber) return;
    await createCard({ variables: { input: { streetId: Number(createStreetId), number: Number(createNumber) } } });
    setCreateNumber('' as any);
  };

  // Assign (modal-based)
  const freeCardsForAssign = useMemo(() => (cards || []).filter((c: any) => !c.isTaken), [cards]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignCardId, setAssignCardId] = useState<string>('');
  const [assignName, setAssignName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [assignYear, setAssignYear] = useState<number>(new Date().getFullYear());
  const [pledgeAhadi, setPledgeAhadi] = useState<number>(0);
  const [pledgeShukrani, setPledgeShukrani] = useState<number>(0);
  const [pledgeMajengo, setPledgeMajengo] = useState<number>(0);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignCardId || !assignName || !assignPhone) return;
    await assignCard({ variables: { input: {
      cardId: assignCardId,
      fullName: assignName,
      phoneNumber: assignPhone,
      year: assignYear,
      pledgedAhadi: Number(pledgeAhadi),
      pledgedShukrani: Number(pledgeShukrani),
      pledgedMajengo: Number(pledgeMajengo),
    } } });
    setAssignOpen(false);
    setAssignCardId(''); setAssignName(''); setAssignPhone('');
  };

  const handleUpdateAssignment = async (assignmentId: string, patch: Partial<{ fullName: string; phoneNumber: string; pledgedAhadi: number; pledgedShukrani: number; pledgedMajengo: number; active: boolean }>) => {
    await updateAssignment({ variables: { input: { assignmentId, ...patch } } });
  };

  // Record entry
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryCardId, setEntryCardId] = useState<string>('');
  const [entryType, setEntryType] = useState<string>('AHADI');
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const handleRecordEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryCardId || !entryType || !entryAmount) return;
    await recordEntry({ variables: { input: { cardId: entryCardId, entryType, amount: Number(entryAmount) } } });
    setEntryAmount(0);
    setEntryOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-green-700">Offering Cards</h1>
        <div className="flex gap-2">
          <button className="border px-3 py-2 rounded" onClick={() => setAssignOpen(true)}>Assign Card</button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white border border-green-100 rounded p-3">
          <div className="text-sm text-gray-600">Total Cards</div>
          <div className="text-xl font-bold text-green-700">{overviewData?.cardsOverview?.totalCards ?? cards.length}</div>
        </div>
        <div className="bg-white border border-green-100 rounded p-3">
          <div className="text-sm text-gray-600">Taken</div>
          <div className="text-xl font-bold text-green-700">{(cards || []).filter((c: any) => c.isTaken).length}</div>
        </div>
        <div className="bg-white border border-green-100 rounded p-3">
          <div className="text-sm text-gray-600">Free</div>
          <div className="text-xl font-bold text-green-700">{(cards || []).filter((c: any) => !c.isTaken).length}</div>
        </div>
      </div>

      <Tabs tabs={tabs} active={active} onChange={setActive} />

      <div className="flex items-center gap-3 mb-4">
        <select className="border rounded px-2 py-1" value={streetFilter ?? ''} onChange={e => setStreetFilter(e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">All Streets</option>
          {streets.map((s: any) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {(active === 'Taken' || active === 'Free') && (
          <input className="border rounded px-2 py-1" placeholder="Search code..." value={search} onChange={e => setSearch(e.target.value)} />
        )}
      </div>

      {active === 'Create' && (
        <>
          <Section title="Create Card">
            <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-3 items-end">
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Street</span>
                <select className="border rounded px-2 py-1" value={createStreetId} onChange={e => setCreateStreetId(e.target.value ? Number(e.target.value) : ('' as any))}>
                  <option value="">Select street</option>
                  {streets.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Card Number</span>
                <input type="number" className="border rounded px-2 py-1" value={createNumber} onChange={e => setCreateNumber(e.target.value ? Number(e.target.value) : ('' as any))} placeholder="e.g. 1" />
              </label>
              <button type="submit" disabled={creating} className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50">{creating ? 'Creating...' : 'Create'}</button>
              <div className="text-sm text-gray-500">Prefix is auto-generated from street. Example: BW-001</div>
            </form>
            <div className="mt-4 flex flex-wrap gap-3 items-center">
              <button
                onClick={() => {
                  if (!createStreetId) return;
                  bulkGenerate({ variables: { input: { streetId: Number(createStreetId), startNumber: 1, endNumber: 200 } } });
                }}
                disabled={bulkLoading || !createStreetId}
                className="border px-3 py-2 rounded disabled:opacity-50"
              >
                {bulkLoading ? 'Generating…' : 'Generate 001–200 for selected street'}
              </button>
              <button
                onClick={() => bulkGenerate({ variables: { input: { startNumber: 1, endNumber: 200 } } })}
                disabled={bulkLoading}
                className="border px-3 py-2 rounded disabled:opacity-50"
              >
                {bulkLoading ? 'Generating…' : 'Generate 001–200 for ALL streets'}
              </button>
              <span className="text-sm text-gray-500">Existing cards are skipped automatically.</span>
            </div>
          </Section>

          <></>
        </>
      )}

      {active === 'Taken' && (
        <Section title="Taken Cards">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Code</th>
                  <th className="p-2">Member</th>
                  <th className="p-2">Street</th>
                  <th className="p-2">Pledged</th>
                  <th className="p-2">Progress</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.filter((c: any) => c.isTaken).map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2 font-medium">{c.code}</td>
                    <td className="p-2">{c.assignedToName || '-'}</td>
                    <td className="p-2">{c.street}</td>
                    <td className="p-2">
                      A: {numberFmt(c.pledgedAhadi)} | S: {numberFmt(c.pledgedShukrani)} | M: {numberFmt(c.pledgedMajengo)}
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        <div className="w-56 bg-green-100 h-2 rounded"><div className="bg-green-700 h-2 rounded" style={{ width: `${Math.min(100, Math.round(c.progressAhadi || 0))}%` }} /></div>
                        <div className="w-56 bg-green-100 h-2 rounded"><div className="bg-green-600 h-2 rounded" style={{ width: `${Math.min(100, Math.round(c.progressShukrani || 0))}%` }} /></div>
                        <div className="w-56 bg-green-100 h-2 rounded"><div className="bg-green-500 h-2 rounded" style={{ width: `${Math.min(100, Math.round(c.progressMajengo || 0))}%` }} /></div>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button className="px-2 py-1 border rounded" onClick={() => handleUpdateAssignment(c.assignmentId, { active: false })}>Deactivate</button>
                        <button className="px-2 py-1 border rounded" onClick={() => { setEntryCardId(c.id); setEntryOpen(true); }}>Record Entry</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Modal open={entryOpen} title="Record Offering Entry" onClose={() => setEntryOpen(false)}>
            <form onSubmit={handleRecordEntry} className="grid md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-4 text-sm text-gray-600">Card ID: {entryCardId}</div>
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Type</span>
                <select className="border rounded px-2 py-1" value={entryType} onChange={e => setEntryType(e.target.value)}>
                  <option value="AHADI">Ahadi</option>
                  <option value="SHUKRANI">Shukrani</option>
                  <option value="MAJENGO">Majengo</option>
                </select>
              </label>
              <label className="flex flex-col">
                <span className="text-sm text-gray-600">Amount</span>
                <input type="number" className="border rounded px-2 py-1" value={entryAmount} onChange={e => setEntryAmount(Number(e.target.value))} />
              </label>
              <button className="bg-green-700 text-white px-3 py-2 rounded">Save Entry</button>
              <button type="button" className="border px-3 py-2 rounded" onClick={() => setEntryOpen(false)}>Cancel</button>
            </form>
          </Modal>
        </Section>
      )}

      {active === 'Free' && (
        <Section title="Free Cards">
          <div className="flex flex-wrap gap-2">
            {available.map((a: any) => (
              <div key={a.code} className="border rounded px-3 py-2">{a.code}</div>
            ))}
            {!available.length && <div className="text-gray-500">No free cards found.</div>}
          </div>
        </Section>
      )}

      {active === 'Overview' && overviewData && (
        <Section title="Overview">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Total Cards</div>
              <div className="text-xl font-bold text-green-700">{overviewData.cardsOverview.totalCards}</div>
            </div>
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Taken / Free</div>
              <div className="text-xl font-bold text-green-700">{overviewData.cardsOverview.takenCards} / {overviewData.cardsOverview.freeCards}</div>
            </div>
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Active Cards</div>
              <div className="text-xl font-bold text-green-700">{overviewData.cardsOverview.activelyUsedCards}</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Total Pledged (Ahadi)</div>
              <div className="text-lg font-bold text-green-700">{numberFmt(overviewData.cardsOverview.totalPledgedAhadi)}</div>
            </div>
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Total Pledged (Shukrani)</div>
              <div className="text-lg font-bold text-green-700">{numberFmt(overviewData.cardsOverview.totalPledgedShukrani)}</div>
            </div>
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Total Pledged (Majengo)</div>
              <div className="text-lg font-bold text-green-700">{numberFmt(overviewData.cardsOverview.totalPledgedMajengo)}</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Collected (Ahadi)</div>
              <div className="text-lg font-bold text-green-700">{numberFmt(overviewData.cardsOverview.totalCollectedAhadi)}</div>
            </div>
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Collected (Shukrani)</div>
              <div className="text-lg font-bold text-green-700">{numberFmt(overviewData.cardsOverview.totalCollectedShukrani)}</div>
            </div>
            <div className="bg-white border border-green-100 rounded p-3">
              <div className="text-sm text-gray-600">Collected (Majengo)</div>
              <div className="text-lg font-bold text-green-700">{numberFmt(overviewData.cardsOverview.totalCollectedMajengo)}</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">Least active card: {overviewData.cardsOverview.leastActiveCard || '-'}</div>
        </Section>
      )}

      {/* Assign Modal */}
      <Modal open={assignOpen} title="Assign Card" onClose={() => setAssignOpen(false)}>
        <form onSubmit={handleAssign} className="grid md:grid-cols-6 gap-3 items-end">
          <label className="flex flex-col md:col-span-2">
            <span className="text-sm text-gray-600">Free Card</span>
            <select className="border rounded px-2 py-1" value={assignCardId} onChange={e => setAssignCardId(e.target.value)}>
              <option value="">Select free card</option>
              {freeCardsForAssign.map((c: any) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Full Name</span>
            <input className="border rounded px-2 py-1" value={assignName} onChange={e => setAssignName(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Phone</span>
            <input className="border rounded px-2 py-1" value={assignPhone} onChange={e => setAssignPhone(e.target.value)} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Year</span>
            <input type="number" className="border rounded px-2 py-1" value={assignYear} onChange={e => setAssignYear(Number(e.target.value))} />
          </label>
          <div className="md:col-span-6 grid md:grid-cols-3 gap-3">
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pledge Ahadi</span>
              <input type="number" className="border rounded px-2 py-1" value={pledgeAhadi} onChange={e => setPledgeAhadi(Number(e.target.value))} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pledge Shukrani</span>
              <input type="number" className="border rounded px-2 py-1" value={pledgeShukrani} onChange={e => setPledgeShukrani(Number(e.target.value))} />
            </label>
            <label className="flex flex-col">
              <span className="text-sm text-gray-600">Pledge Majengo</span>
              <input type="number" className="border rounded px-2 py-1" value={pledgeMajengo} onChange={e => setPledgeMajengo(Number(e.target.value))} />
            </label>
          </div>
          <button type="submit" disabled={assigning} className="bg-green-600 text-white px-3 py-2 rounded disabled:opacity-50">{assigning ? 'Assigning...' : 'Assign'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default OfferingCardsPage;
