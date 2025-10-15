import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_STREETS_AND_GROUPS, GET_OFFERING_CARDS, GET_AVAILABLE_CARD_NUMBERS, GET_CARDS_OVERVIEW, REGISTRATION_WINDOW_STATUS, GET_CARD_APPLICATIONS } from '../../api/queries';
import { CREATE_OFFERING_CARD, ASSIGN_CARD, UPDATE_ASSIGNMENT, RECORD_OFFERING_ENTRY, BULK_GENERATE_CARDS, OPEN_REGISTRATION_WINDOW, CLOSE_REGISTRATION_WINDOW, APPROVE_CARD_APPLICATION, REJECT_CARD_APPLICATION } from '../../api/mutations';

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
  const tabs = ['Create', 'Taken', 'Free', 'Applications', 'Overview'];
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

  const { data: windowData, refetch: refetchWindow } = useQuery(REGISTRATION_WINDOW_STATUS);

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

  const [openWindow, { loading: openingWin }] = useMutation(OPEN_REGISTRATION_WINDOW, {
    onCompleted: () => { refetchWindow && refetchWindow(); },
  });
  const [closeWindow, { loading: closingWin }] = useMutation(CLOSE_REGISTRATION_WINDOW, {
    onCompleted: () => { refetchWindow && refetchWindow(); },
  });

  // Applications
  const { data: appsData, refetch: refetchApps } = useQuery(GET_CARD_APPLICATIONS, { variables: { status: 'NEW' } });
  const applications = appsData?.cardApplications ?? [];
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveAppId, setApproveAppId] = useState<string>('');
  const [approveCardId, setApproveCardId] = useState<string>('');
  const [approveYear, setApproveYear] = useState<number>(new Date().getFullYear());
  const [approveAhadi, setApproveAhadi] = useState<number | ''>('' as any);
  const [approveShukrani, setApproveShukrani] = useState<number | ''>('' as any);
  const [approveMajengo, setApproveMajengo] = useState<number | ''>('' as any);
  const [approveApp] = useMutation(APPROVE_CARD_APPLICATION, {
    onCompleted: () => { setApproveOpen(false); refetchApps && refetchApps(); refetchCards(); refetchAvailable(); refetchOverview && refetchOverview(); },
  });
  // View modal & reject
  const [viewOpen, setViewOpen] = useState(false);
  const [viewApp, setViewApp] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectApp] = useMutation(REJECT_CARD_APPLICATION, {
    onCompleted: () => { setViewOpen(false); setRejectReason(''); refetchApps && refetchApps(); },
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

  // Pagination state
  const [takenPage, setTakenPage] = useState(1);
  const [freePage, setFreePage] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const pageSize = 20;
  const takenCards = useMemo(() => (cards || []).filter((c: any) => c.isTaken), [cards]);
  const takenTotalPages = Math.max(1, Math.ceil(takenCards.length / pageSize));
  const takenPageItems = useMemo(() => takenCards.slice((takenPage - 1) * pageSize, takenPage * pageSize), [takenCards, takenPage]);
  const freeAvailable = available; // keep alias for clarity
  const freeTotalPages = Math.max(1, Math.ceil(freeAvailable.length / pageSize));
  const freePageItems = useMemo(() => freeAvailable.slice((freePage - 1) * pageSize, freePage * pageSize), [freeAvailable, freePage]);
  const applicationsTotalPages = Math.max(1, Math.ceil(applications.length / pageSize));
  const applicationsPageItems = useMemo(() => applications.slice((appPage - 1) * pageSize, appPage * pageSize), [applications, appPage]);

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
        <div className="flex flex-wrap gap-2 items-center">
          <div className="text-sm text-gray-600">
            Window: {windowData?.registrationWindowStatus?.isOpen ? 'OPEN' : 'CLOSED'}
            {windowData?.registrationWindowStatus?.startAt ? ` · ${windowData.registrationWindowStatus.startAt} → ${windowData.registrationWindowStatus.endAt}` : ''}
          </div>
          <button className="border px-3 py-2 rounded" onClick={() => setAssignOpen(true)}>Assign Card</button>
          <button
            className="border px-3 py-2 rounded disabled:opacity-50"
            disabled={openingWin}
            onClick={() => {
              const now = new Date();
              const startAt = new Date(now.getTime()).toISOString().slice(0,19);
              const endAt = new Date(now.getTime() + 7*24*60*60*1000).toISOString().slice(0,19);
              openWindow({ variables: { startAt, endAt } });
            }}
          >{openingWin ? 'Opening…' : 'Open Window (7 days)'}</button>
          <button
            className="border px-3 py-2 rounded disabled:opacity-50"
            disabled={closingWin}
            onClick={() => closeWindow()}
          >{closingWin ? 'Closing…' : 'Close Window'}</button>
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
                  bulkGenerate({ variables: { input: { streetId: Number(createStreetId), startNumber: 1, endNumber: 300 } } });
                }}
                disabled={bulkLoading || !createStreetId}
                className="border px-3 py-2 rounded disabled:opacity-50"
              >
                {bulkLoading ? 'Generating…' : 'Generate 001–300 for selected street'}
              </button>
              <button
                onClick={() => bulkGenerate({ variables: { input: { startNumber: 1, endNumber: 300 } } })}
                disabled={bulkLoading}
                className="border px-3 py-2 rounded disabled:opacity-50"
              >
                {bulkLoading ? 'Generating…' : 'Generate 001–300 for ALL streets'}
              </button>
              <span className="text-sm text-gray-500">Existing cards are skipped automatically.</span>
            </div>
          </Section>

          <></>
        </>
      )}

      {active === 'Applications' && (
        <Section title="Pending Applications">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Applicant</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Street</th>
                  <th className="p-2">Preferred</th>
                  <th className="p-2">Pledges</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicationsPageItems.map((a: any) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-2">{a.fullName}</td>
                    <td className="p-2">{a.phoneNumber}</td>
                    <td className="p-2">{a.street}</td>
                    <td className="p-2">{a.preferredNumber || '-'}</td>
                    <td className="p-2">A: {numberFmt(a.pledgedAhadi)} | S: {numberFmt(a.pledgedShukrani)} | M: {numberFmt(a.pledgedMajengo)}</td>
                    <td className="p-2">{a.createdAt}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          className="border px-2 py-1 rounded"
                          onClick={() => { setViewOpen(true); setViewApp(a); }}
                        >View</button>
                        <button
                          className="border px-2 py-1 rounded"
                          onClick={() => { setApproveOpen(true); setApproveAppId(a.id); setApproveAhadi(a.pledgedAhadi || '' as any); setApproveShukrani(a.pledgedShukrani || '' as any); setApproveMajengo(a.pledgedMajengo || '' as any); }}
                        >Approve</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Applications Pagination */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <button className="border px-2 py-1 rounded disabled:opacity-50" disabled={appPage <= 1} onClick={() => setAppPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span className="text-sm text-gray-600">Page {appPage} of {applicationsTotalPages}</span>
            <button className="border px-2 py-1 rounded disabled:opacity-50" disabled={appPage >= applicationsTotalPages} onClick={() => setAppPage((p) => Math.min(applicationsTotalPages, p + 1))}>Next</button>
          </div>
        </Section>
      )}

      {/* Approve Modal */}
      <Modal open={approveOpen} title="Approve Application" onClose={() => setApproveOpen(false)}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!approveAppId || !approveCardId || !approveYear) return;
            await approveApp({ variables: {
              applicationId: approveAppId,
              cardId: approveCardId,
              year: Number(approveYear),
              pledgedAhadi: approveAhadi ? Number(approveAhadi) : 0,
              pledgedShukrani: approveShukrani ? Number(approveShukrani) : 0,
              pledgedMajengo: approveMajengo ? Number(approveMajengo) : 0,
            } });
          }}
          className="grid md:grid-cols-2 gap-3 items-end"
        >
          <label className="flex flex-col md:col-span-2">
            <span className="text-sm text-gray-600">Select Free Card</span>
            <select className="border rounded px-2 py-1" value={approveCardId} onChange={(e) => setApproveCardId(e.target.value)}>
              <option value="">Choose card…</option>
              {freeCardsForAssign.map((c: any) => (
                <option key={c.id} value={c.id}>{c.code}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Year</span>
            <input type="number" className="border rounded px-2 py-1" value={approveYear as any} onChange={(e) => setApproveYear(Number(e.target.value || new Date().getFullYear()))} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Pledge - Ahadi</span>
            <input type="number" className="border rounded px-2 py-1" value={approveAhadi as any} onChange={(e) => setApproveAhadi(e.target.value ? Number(e.target.value) : ('' as any))} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Pledge - Shukrani</span>
            <input type="number" className="border rounded px-2 py-1" value={approveShukrani as any} onChange={(e) => setApproveShukrani(e.target.value ? Number(e.target.value) : ('' as any))} />
          </label>
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Pledge - Majengo</span>
            <input type="number" className="border rounded px-2 py-1" value={approveMajengo as any} onChange={(e) => setApproveMajengo(e.target.value ? Number(e.target.value) : ('' as any))} />
          </label>
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-[#5E936C] text-white px-3 py-2 rounded">Approve</button>
            <button type="button" className="border px-3 py-2 rounded" onClick={() => setApproveOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal open={viewOpen} title="Application Details" onClose={() => setViewOpen(false)}>
        {viewApp && (
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500">Applicant</div>
                <div className="font-medium">{viewApp.fullName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Phone</div>
                <div>{viewApp.phoneNumber}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Street</div>
                <div>{viewApp.street}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Preferred Number</div>
                <div>{viewApp.preferredNumber || '-'}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Pledges</div>
                <div>A: {numberFmt(viewApp.pledgedAhadi)} · S: {numberFmt(viewApp.pledgedShukrani)} · M: {numberFmt(viewApp.pledgedMajengo)}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Note</div>
                <div className="whitespace-pre-wrap">{viewApp.note || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Submitted</div>
                <div>{viewApp.createdAt}</div>
              </div>
            </div>

            <div className="border-t pt-3 grid md:grid-cols-2 gap-3 items-end">
              <div className="flex gap-2">
                <button
                  className="bg-[#5E936C] text-white px-3 py-2 rounded"
                  onClick={() => {
                    setViewOpen(false);
                    setApproveOpen(true);
                    setApproveAppId(viewApp.id);
                    setApproveAhadi(viewApp.pledgedAhadi || ('' as any));
                    setApproveShukrani(viewApp.pledgedShukrani || ('' as any));
                    setApproveMajengo(viewApp.pledgedMajengo || ('' as any));
                    // try auto-pick preferred card if currently free in cached list
                    const pref = viewApp.preferredNumber;
                    if (pref) {
                      const match = freeCardsForAssign.find((c: any) => c.number === pref && c.street === viewApp.street);
                      if (match) setApproveCardId(match.id || match.code || '');
                    }
                  }}
                >Accept</button>
                <button
                  className="border px-3 py-2 rounded"
                  onClick={async () => {
                    await rejectApp({ variables: { applicationId: viewApp.id, reason: rejectReason || null } });
                  }}
                >Reject</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Reason (optional):</span>
                <input className="border rounded px-2 py-1 w-full" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
              </div>
            </div>
          </div>
        )}
      </Modal>
      {active === 'Taken' && (
        <Section title="Taken Cards">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Code</th>
                  <th className="p-2">Member</th>
                  <th className="p-2">Phone/Year</th>
                  <th className="p-2">Street</th>
                  <th className="p-2">Pledged</th>
                  <th className="p-2">Progress</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {takenPageItems.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2 font-medium">{c.code}</td>
                    <td className="p-2">{c.assignedToName || '-'}</td>
                    <td className="p-2">{c.assignedPhone || '-'}{c.assignedYear ? ` / ${c.assignedYear}` : ''}</td>
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
            {/* Taken Pagination */}
            <div className="flex items-center justify-end gap-2 mt-3">
              <button className="border px-2 py-1 rounded disabled:opacity-50" disabled={takenPage <= 1} onClick={() => setTakenPage((p) => Math.max(1, p - 1))}>Prev</button>
              <span className="text-sm text-gray-600">Page {takenPage} of {takenTotalPages}</span>
              <button className="border px-2 py-1 rounded disabled:opacity-50" disabled={takenPage >= takenTotalPages} onClick={() => setTakenPage((p) => Math.min(takenTotalPages, p + 1))}>Next</button>
            </div>
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
            {freePageItems.map((a: any) => (
              <button
                key={a.code}
                className="border rounded px-3 py-2 hover:bg-green-50"
                onClick={() => {
                  // find matching card in current cards list to get id
                  const match = (cards || []).find((c: any) => !c.isTaken && c.code === a.code);
                  if (match) {
                    setAssignCardId(match.id);
                  } else {
                    setAssignCardId('');
                  }
                  setAssignOpen(true);
                }}
              >
                {a.code}
              </button>
            ))}
            {!freeAvailable.length && <div className="text-gray-500">No free cards found.</div>}
          </div>
          {/* Free Pagination */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <button className="border px-2 py-1 rounded disabled:opacity-50" disabled={freePage <= 1} onClick={() => setFreePage((p) => Math.max(1, p - 1))}>Prev</button>
            <span className="text-sm text-gray-600">Page {freePage} of {freeTotalPages}</span>
            <button className="border px-2 py-1 rounded disabled:opacity-50" disabled={freePage >= freeTotalPages} onClick={() => setFreePage((p) => Math.min(freeTotalPages, p + 1))}>Next</button>
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
