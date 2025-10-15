import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_STREETS_AND_GROUPS, GET_OFFERING_CARDS } from '../../api/queries';
import { BULK_RECORD_OFFERING_ENTRIES } from '../../api/mutations';

// Types
type EntryItem = { cardId: string; cardCode: string; entryType: 'AHADI'|'SHUKRANI'|'MAJENGO'; amount: number; date?: string };

// Utils
const numberFmt = (n?: number|null) => (n ?? 0).toLocaleString();
const batchKey = (date: string, massType: string, streetId: number, major?: number) => `offeringBatch:${date}:${massType}:${streetId}:${major||0}`;

const OfferingEntryPage: React.FC = () => {
  // Intake state
  const [recorderName, setRecorderName] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [massType, setMassType] = useState<string>('MAJOR');
  const [majorMassNumber, setMajorMassNumber] = useState<number|''>('' as any);
  const [streetId, setStreetId] = useState<number|''>('' as any);
  const [intakeDone, setIntakeDone] = useState(false);

  // Meta
  const { data: meta } = useQuery(GET_STREETS_AND_GROUPS);
  const streets = meta?.streets ?? [];

  // Restore intake
  useEffect(() => {
    const raw = localStorage.getItem('offeringEntry:lastIntake');
    if (!raw) return;
    try {
      const v = JSON.parse(raw);
      setRecorderName(v.recorderName || '');
      setDate(v.date || new Date().toISOString().slice(0,10));
      setMassType(v.massType || 'MAJOR');
      setMajorMassNumber(v.majorMassNumber ?? ('' as any));
      setStreetId(v.streetId ?? ('' as any));
    } catch {}
  }, []);

  // Persist intake
  useEffect(() => {
    localStorage.setItem('offeringEntry:lastIntake', JSON.stringify({ recorderName, date, massType, majorMassNumber, streetId }));
  }, [recorderName, date, massType, majorMassNumber, streetId]);

  // Batch storage
  const storageKey = useMemo(() => (!date||!massType||!streetId)?'':batchKey(date, massType, Number(streetId), massType==='MAJOR'?Number(majorMassNumber||0):0), [date, massType, streetId, majorMassNumber]);
  const [entries, setEntries] = useState<EntryItem[]>([]);
  useEffect(() => {
    if (!storageKey) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) { setEntries([]); return; }
    try { const v = JSON.parse(raw); setEntries(v.entries || []); } catch { setEntries([]); }
  }, [storageKey]);
  const saveBatch = (next: EntryItem[]) => {
    if (!storageKey || !streetId) return;
    localStorage.setItem(storageKey, JSON.stringify({ meta:{ recorderName, date, massType, streetId:Number(streetId), majorMassNumber: massType==='MAJOR'?(majorMassNumber?Number(majorMassNumber):undefined):undefined }, entries: next }));
  };

  // Search scoped by street (debounced)
  const [search, setSearch] = useState('');
  const { data: cardsData, refetch } = useQuery(GET_OFFERING_CARDS, { variables: { streetId: streetId?Number(streetId):null, isTaken: null, search: search || null }, skip: !streetId, fetchPolicy: 'cache-and-network' });
  useEffect(() => {
    if (!streetId) return;
    const t = setTimeout(() => {
      refetch({ streetId: Number(streetId), isTaken: null, search: search || null });
    }, 250);
    return () => clearTimeout(t);
  }, [search, streetId, refetch]);
  const cards = cardsData?.offeringCards ?? [];

  // Quick add (three amounts at once)
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedCardCode, setSelectedCardCode] = useState('');
  const [amtAhadi, setAmtAhadi] = useState<number | ''>('' as any);
  const [amtShukrani, setAmtShukrani] = useState<number | ''>('' as any);
  const [amtMajengo, setAmtMajengo] = useState<number | ''>('' as any);
  const selectCard = (c:any) => { setSelectedCardId(c.id); setSelectedCardCode(c.code); };
  const addEntry = () => {
    if (!selectedCardId) return;
    const toAdd: EntryItem[] = [];
    const a = amtAhadi ? Number(amtAhadi) : 0;
    const s = amtShukrani ? Number(amtShukrani) : 0;
    const m = amtMajengo ? Number(amtMajengo) : 0;
    if (a > 0) toAdd.push({ cardId: selectedCardId, cardCode: selectedCardCode, entryType: 'AHADI', amount: a, date });
    if (s > 0) toAdd.push({ cardId: selectedCardId, cardCode: selectedCardCode, entryType: 'SHUKRANI', amount: s, date });
    if (m > 0) toAdd.push({ cardId: selectedCardId, cardCode: selectedCardCode, entryType: 'MAJENGO', amount: m, date });
    if (!toAdd.length) return;
    const next = [...entries, ...toAdd];
    setEntries(next); saveBatch(next);
    setAmtAhadi('' as any); setAmtShukrani('' as any); setAmtMajengo('' as any);
  };
  const removeEntry = (i:number) => { const next = entries.filter((_,idx)=>idx!==i); setEntries(next); saveBatch(next); };

  // Totals
  const totals = useMemo(() => { let a=0,s=0,m=0; for (const e of entries){ if(e.entryType==='AHADI') a+=e.amount; else if(e.entryType==='SHUKRANI') s+=e.amount; else m+=e.amount; } return { a,s,m,count:entries.length, unique:new Set(entries.map(e=>e.cardId)).size }; }, [entries]);

  // Submit bulk
  const [bulkSave, { loading: submitting }] = useMutation(BULK_RECORD_OFFERING_ENTRIES, { onCompleted:()=>{ if (storageKey) localStorage.removeItem(storageKey); setEntries([]); alert('Saved successfully'); } });
  const handleSubmit = async () => {
    if (!streetId || !recorderName || !date || !massType) return;
    if (massType==='MAJOR' && !majorMassNumber) return;
    if (!entries.length) return;
    await bulkSave({ variables:{ input:{ meta:{ streetId:Number(streetId), recorderName, date, massType, majorMassNumber: massType==='MAJOR'?Number(majorMassNumber):null }, entries: entries.map(e=>({ cardId:e.cardId, entryType:e.entryType, amount:e.amount, date:e.date })) } } });
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-green-700 mb-4">Offering Entry</h1>

      {!intakeDone && (
        <div className="bg-white shadow rounded p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Intake</h2>
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <label className="flex flex-col"><span className="text-sm text-gray-600">Recorder Name</span><input className="border rounded px-2 py-1" value={recorderName} onChange={e=>setRecorderName(e.target.value)} placeholder="e.g. Jane Doe" /></label>
            <label className="flex flex-col"><span className="text-sm text-gray-600">Date</span><input type="date" className="border rounded px-2 py-1" value={date} onChange={e=>setDate(e.target.value)} /></label>
            <label className="flex flex-col"><span className="text-sm text-gray-600">Mass Type</span><select className="border rounded px-2 py-1" value={massType} onChange={e=>setMassType(e.target.value)}><option value="MAJOR">Major</option><option value="MORNING_GLORY">Morning Glory</option><option value="EVENING_GLORY">Evening Glory</option><option value="SELI">SELI</option></select></label>
            {massType==='MAJOR' && (<label className="flex flex-col"><span className="text-sm text-gray-600">Major Mass</span><select className="border rounded px-2 py-1" value={majorMassNumber as any} onChange={e=>setMajorMassNumber(e.target.value?Number(e.target.value):('' as any))}><option value="">Select…</option><option value={1}>First</option><option value={2}>Second</option></select></label>)}
            <label className="flex flex-col md:col-span-2"><span className="text-sm text-gray-600">Street</span><select className="border rounded px-2 py-1" value={streetId as any} onChange={e=>setStreetId(e.target.value?Number(e.target.value):('' as any))}><option value="">Select street</option>{streets.map((s:any)=>(<option key={s.id} value={s.id}>{s.name}</option>))}</select></label>
            <div className="md:col-span-4"><button className="bg-green-700 text-white px-3 py-2 rounded disabled:opacity-50" disabled={!recorderName||!date||!massType||!streetId||(massType==='MAJOR'&&!majorMassNumber)} onClick={()=>setIntakeDone(true)}>Start Entry</button></div>
          </div>
        </div>
      )}

      {intakeDone && (
        <>
          <div className="bg-white shadow rounded p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-gray-700"><div><b>Recorder:</b> {recorderName}</div><div><b>Date:</b> {date}</div><div><b>Mass:</b> {massType}{massType==='MAJOR'&&majorMassNumber?` #${majorMassNumber}`:''}</div></div>
              <div className="text-sm text-gray-700"><div><b>Street:</b> {streets.find((s:any)=>s.id===streetId)?.name||'-'}</div><div><b>Entries:</b> {totals.count} | Cards {totals.unique} · A {numberFmt(totals.a)} · S {numberFmt(totals.s)} · M {numberFmt(totals.m)}</div></div>
              <div className="flex gap-2"><button className="border px-3 py-2 rounded" onClick={()=>setIntakeDone(false)}>Edit Intake</button><button className="bg-green-700 text-white px-3 py-2 rounded disabled:opacity-50" disabled={submitting||!entries.length} onClick={handleSubmit}>{submitting?'Submitting…':'Submit All'}</button></div>
            </div>
          </div>

          <div className="bg-white shadow rounded p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Search Card / Name / Phone</h2>
            <div className="flex items-center gap-3 mb-3"><input className="border rounded px-2 py-1 w-full" placeholder="Type code (e.g. 1 ⇒ this street only), name, or phone" value={search} onChange={e=>setSearch(e.target.value)} /><span className="text-xs text-gray-500">Auto-search</span></div>
            <div className="flex flex-wrap gap-2">{cards.map((c:any)=>(<button key={c.id} className={`border rounded px-3 py-2 ${selectedCardId===c.id?'bg-green-50':''}`} onClick={()=>selectCard(c)}>{c.code}{c.assignedToName?` · ${c.assignedToName}`:''}{c.assignedPhone?` · ${c.assignedPhone}`:''}</button>))}{!cards.length&&<div className="text-gray-500">No cards found.</div>}</div>
          </div>

          <div className="bg-white shadow rounded p-4 mb-6">
            <h2 className="text-lg font-semibold mb-3">Add Entries (All Types)</h2>
            <div className="mb-2 text-sm text-gray-700">About to add for <b>{selectedCardCode || '-'}</b> on <b>{date}</b></div>
            <form className="grid md:grid-cols-12 gap-3 items-end" onSubmit={(e)=>{e.preventDefault(); addEntry();}}>
              <div className="md:col-span-4">
                <label className="flex flex-col"><span className="text-sm text-gray-600">Ahadi</span><input type="number" className="border rounded px-2 py-1" value={amtAhadi as any} onChange={e=>setAmtAhadi(e.target.value?Number(e.target.value):('' as any))} /></label>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {[50,100,200,500,1000].map(v=> (<button key={`a-${v}`} type="button" className="border px-2 py-1 rounded" onClick={()=>setAmtAhadi(v)}>{v.toLocaleString()}</button>))}
                  <button type="button" className="border px-2 py-1 rounded" onClick={()=>setAmtAhadi('' as any)}>Clear</button>
                </div>
              </div>
              <div className="md:col-span-4">
                <label className="flex flex-col"><span className="text-sm text-gray-600">Shukrani</span><input type="number" className="border rounded px-2 py-1" value={amtShukrani as any} onChange={e=>setAmtShukrani(e.target.value?Number(e.target.value):('' as any))} /></label>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {[50,100,200,500,1000].map(v=> (<button key={`s-${v}`} type="button" className="border px-2 py-1 rounded" onClick={()=>setAmtShukrani(v)}>{v.toLocaleString()}</button>))}
                  <button type="button" className="border px-2 py-1 rounded" onClick={()=>setAmtShukrani('' as any)}>Clear</button>
                </div>
              </div>
              <div className="md:col-span-4">
                <label className="flex flex-col"><span className="text-sm text-gray-600">Majengo</span><input type="number" className="border rounded px-2 py-1" value={amtMajengo as any} onChange={e=>setAmtMajengo(e.target.value?Number(e.target.value):('' as any))} /></label>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  {[50,100,200,500,1000].map(v=> (<button key={`m-${v}`} type="button" className="border px-2 py-1 rounded" onClick={()=>setAmtMajengo(v)}>{v.toLocaleString()}</button>))}
                  <button type="button" className="border px-2 py-1 rounded" onClick={()=>setAmtMajengo('' as any)}>Clear</button>
                </div>
              </div>
              <div className="md:col-span-12">
                <button className="bg-green-700 text-white px-3 py-2 rounded" type="submit">Add</button>
              </div>
            </form>
          </div>

          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-semibold mb-3">Review</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="text-left text-gray-600"><th className="p-2">Card</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Date</th><th className="p-2">Actions</th></tr></thead>
                <tbody>
                  {entries.map((e,idx)=> (
                    <tr key={idx} className="border-t"><td className="p-2">{e.cardCode}</td><td className="p-2">{e.entryType}</td><td className="p-2">{numberFmt(e.amount)}</td><td className="p-2">{e.date||date}</td><td className="p-2"><button className="border px-2 py-1 rounded" onClick={()=>removeEntry(idx)}>Remove</button></td></tr>
                  ))}
                  {!entries.length && (<tr><td className="p-2 text-gray-500" colSpan={5}>No entries added yet.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OfferingEntryPage;
