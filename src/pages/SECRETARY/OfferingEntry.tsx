import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTrash, FaPlus, FaSave, FaSearch, FaExclamationCircle } from 'react-icons/fa';
import { useTranslation, Trans } from 'react-i18next';
import { GET_STREETS_AND_GROUPS, GET_OFFERING_CARDS } from '../../api/queries';
import { BULK_RECORD_OFFERING_ENTRIES } from '../../api/mutations';
import { toast } from 'react-toastify';

interface EntryItem {
  cardId: string;
  cardCode: string;
  entryType: 'AHADI' | 'SHUKRANI' | 'MAJENGO';
  amount: number;
  date?: string;
}

const numberFmt = (n?: number | null) => (n ?? 0).toLocaleString();

const OfferingEntryPage: React.FC = () => {
  const { t } = useTranslation();
  // --- STATE: INTAKE SETUP ---
  const [recorderName, setRecorderName] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [massType, setMassType] = useState<string>('MAJOR');
  const [majorMassNumber, setMajorMassNumber] = useState<number | ''>('' as any);
  const [streetId, setStreetId] = useState<number | ''>('' as any);
  const [intakeDone, setIntakeDone] = useState(false);

  // --- STATE: ENTRIES ---
  const [unpledgedAmount, setUnpledgedAmount] = useState<number | ''>('' as any);
  const [entries, setEntries] = useState<EntryItem[]>([]);

  // --- STATE: QUICK ADD ---
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [amtAhadi, setAmtAhadi] = useState<string>('');
  const [amtShukrani, setAmtShukrani] = useState<string>('');
  const [amtMajengo, setAmtMajengo] = useState<string>('');

  const [activeField, setActiveField] = useState<'AHADI' | 'SHUKRANI' | 'MAJENGO' | null>(null);

  const ahadiRef = React.useRef<HTMLInputElement>(null);
  const shukraniRef = React.useRef<HTMLInputElement>(null);
  const majengoRef = React.useRef<HTMLInputElement>(null);

  // Focus Ahadi when card selected
  useEffect(() => {
    if (selectedCard) {
      setActiveField('AHADI');
      // small delay to ensure rendering
      setTimeout(() => ahadiRef.current?.focus(), 50);
    }
  }, [selectedCard]);

  const handleQuickAdd = (amount: number) => {
    if (!activeField) return;
    if (activeField === 'AHADI') setAmtAhadi(prev => String((Number(prev) || 0) + amount));
    if (activeField === 'SHUKRANI') setAmtShukrani(prev => String((Number(prev) || 0) + amount));
    if (activeField === 'MAJENGO') setAmtMajengo(prev => String((Number(prev) || 0) + amount));
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      if (field === 'AHADI') shukraniRef.current?.focus();
      else if (field === 'SHUKRANI') majengoRef.current?.focus();
      else if (field === 'MAJENGO' && e.key === 'Enter') handleAddEntry(e as any); // submit on last enter
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (field === 'SHUKRANI') ahadiRef.current?.focus();
      else if (field === 'MAJENGO') shukraniRef.current?.focus();
    }
  };


  // --- QUERIES ---
  const { data: meta } = useQuery(GET_STREETS_AND_GROUPS);
  const streets = meta?.streets ?? [];

  const { data: cardsData, refetch: refetchCards } = useQuery(GET_OFFERING_CARDS, {
    variables: {
      streetId: streetId ? Number(streetId) : null,
      isTaken: true, // Only show taken cards for entry? Usually yes.
      search: search || null
    },
    skip: !streetId,
    fetchPolicy: 'cache-and-network'
  });

  // Debounce search
  useEffect(() => {
    if (!streetId) return;
    const t = setTimeout(() => {
      refetchCards({ streetId: Number(streetId), isTaken: true, search: search || null });
    }, 300);
    return () => clearTimeout(t);
  }, [search, streetId]);

  // --- RESTORE & PERSIST ---
  useEffect(() => {
    const raw = localStorage.getItem('offeringEntry:session');
    if (raw) {
      try {
        const d = JSON.parse(raw);
        setRecorderName(d.recorderName || '');
        setDate(d.date || new Date().toISOString().slice(0, 10));
        setMassType(d.massType || 'MAJOR');
        setMajorMassNumber(d.majorMassNumber ?? '');
        setStreetId(d.streetId ?? '');
        setUnpledgedAmount(d.unpledgedAmount ?? '');
        setEntries(d.entries || []);
        if (d.intakeDone) setIntakeDone(true);
      } catch (e) {
        console.error("Failed to restore session", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('offeringEntry:session', JSON.stringify({
      recorderName, date, massType, majorMassNumber, streetId, unpledgedAmount, entries, intakeDone
    }));
  }, [recorderName, date, massType, majorMassNumber, streetId, unpledgedAmount, entries, intakeDone]);

  // --- ACTIONS ---

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) {
      toast.error(t('select_card_error'));
      return;
    }

    const newItems: EntryItem[] = [];
    if (Number(amtAhadi) > 0) newItems.push({ cardId: selectedCard.id, cardCode: selectedCard.code, entryType: 'AHADI', amount: Number(amtAhadi), date });
    if (Number(amtShukrani) > 0) newItems.push({ cardId: selectedCard.id, cardCode: selectedCard.code, entryType: 'SHUKRANI', amount: Number(amtShukrani), date });
    if (Number(amtMajengo) > 0) newItems.push({ cardId: selectedCard.id, cardCode: selectedCard.code, entryType: 'MAJENGO', amount: Number(amtMajengo), date });

    if (newItems.length === 0) {
      toast.warn(t('enter_amount_error'));
      return;
    }

    setEntries(prev => [...prev, ...newItems]);
    // Reset form
    setAmtAhadi('');
    setAmtShukrani('');
    setAmtMajengo('');
    setSelectedCard(null);
    setSearch(''); // Optional: clear search to be ready for next
    toast.success(t('added_entries_success', { count: newItems.length, code: selectedCard.code }));
  };

  const [submitBatch, { loading: submitting }] = useMutation(BULK_RECORD_OFFERING_ENTRIES, {
    onCompleted: () => {
      toast.success(t('batch_success'));
      // Reset critical parts but keep some context if needed, usually full reset is safer
      setEntries([]);
      setUnpledgedAmount('');
      setIntakeDone(false);
      localStorage.removeItem('offeringEntry:session');
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleSubmit = () => {
    if (!recorderName || !date || !massType) {
      toast.error(t('missing_details_error'));
      return;
    }
    if (massType === 'MAJOR' && !majorMassNumber) {
      toast.error(t('select_service_error'));
      return;
    }

    const payload = {
      meta: {
        streetId: Number(streetId) || 0, // Street ID might be optional for general recording, but schema likely requires it for the batch grouping. 
        // If massType is NOT Major, maybe we ignore street? It depends on backend. We'll send it if we have it, or 0.
        // Actually earlier code forced street selection. We will keep that constraint for now.
        recorderName,
        date,
        massType,
        majorMassNumber: massType === 'MAJOR' ? Number(majorMassNumber) : null,
        unpledgedAmount: unpledgedAmount ? Number(unpledgedAmount) : 0
      },
      entries: entries.map(e => ({
        cardId: e.cardId,
        entryType: e.entryType,
        amount: e.amount,
        date: e.date || date
      }))
    };

    submitBatch({ variables: { input: payload } });
  };

  // --- RENDER HELPERS ---

  const renderIntakeForm = () => (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
      <div className="bg-[#5E936C] p-6">
        <h2 className="text-2xl font-bold text-white">{t('new_offering_batch')}</h2>
        <p className="text-[#E8FFD7]">{t('configure_session')}</p>
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('recorder_name')}</label>
          <input
            value={recorderName}
            onChange={e => setRecorderName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] outline-none"
            placeholder="Full Name "
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('date_label')}</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('mass_type')}</label>
          <select
            value={massType}
            onChange={e => setMassType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] outline-none"
          >
            <option value="MAJOR">{t('major_sunday')}</option>
            <option value="MORNING_GLORY">{t('morning_glory')}</option>
            <option value="EVENING_GLORY">{t('evening_glory')}</option>
            <option value="SELI">{t('seli')}</option>
          </select>
        </div>

        {/* Conditional Fields */}
        <AnimatePresence>
          {massType === 'MAJOR' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('service_number')}</label>
              <select
                value={majorMassNumber}
                onChange={e => setMajorMassNumber(e.target.value ? Number(e.target.value) : ('' as any))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] outline-none"
              >
                <option value="">{t('select_option')}</option>
                <option value="1">{t('first_service')}</option>
                <option value="2">{t('second_service')}</option>
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('target_street')}</label>
          <select
            value={streetId}
            onChange={e => setStreetId(e.target.value ? Number(e.target.value) : ('' as any))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] outline-none"
          >
            <option value="">{t('select_street_placeholder')}</option>
            {streets.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p className="text-xs text-gray-500 mt-1">{t('street_help_text')}</p>
        </div>
      </div>
      <div className="bg-gray-50 p-6 flex justify-end">
        <button
          disabled={!recorderName || !date || !streetId || (massType === 'MAJOR' && !majorMassNumber)}
          onClick={() => setIntakeDone(true)}
          className="bg-[#5E936C] hover:bg-[#4a7a58] text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('start_recording')}
        </button>
      </div>
    </div>
  );

  const calculateTotal = () => entries.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!intakeDone ? renderIntakeForm() : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

          {/* Left Col: Info & Totals */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{t('batch_details')}</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('recorder')}</span>
                  <span className="font-medium text-gray-900">{recorderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('date_label')}</span>
                  <span className="font-medium text-gray-900">{date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('type')}</span>
                  <Badge type="info">{massType}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('entries')}</span>
                  <Badge type="neutral">{entries.length}</Badge>
                </div>
              </div>
              <button onClick={() => setIntakeDone(false)} className="mt-6 w-full py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                {t('edit_details')}
              </button>
            </div>

            {/* Unpledged Amount Card */}
            <div className="bg-white rounded-xl shadow-sm border-l-4 border-yellow-400 p-6">
              <h3 className="font-bold text-gray-900 mb-2">
                {massType === 'MAJOR' ? t('loose_offering') : t('total_collection')}
              </h3>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">TEx</span>
                <input
                  type="number"
                  value={unpledgedAmount}
                  onChange={e => setUnpledgedAmount(e.target.value ? Number(e.target.value) : ('' as any))}
                  className="w-full pl-12 pr-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg font-mono text-xl focus:ring-2 focus:ring-yellow-400 outline-none"
                  placeholder="0.00"
                />
              </div>
              {massType !== 'MAJOR' && (
                <p className="text-xs text-gray-500 mt-2">{t('total_collection_help', { massType })}</p>
              )}
            </div>

            {/* Submit Action */}
            <div className="bg-[#5E936C] rounded-xl shadow-lg p-6 text-white">
              <div className="flex justify-between items-end mb-2">
                <span className="text-[#E8FFD7] font-medium">{t('grand_total')}</span>
                <span className="text-3xl font-bold">{numberFmt(calculateTotal() + (Number(unpledgedAmount) || 0))}</span>
              </div>
              <div className="h-px bg-[#4a7a58] my-4" />
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-3 bg-white text-[#5E936C] font-bold rounded-lg shadow-sm hover:bg-[#E8FFD7] transition-colors disabled:opacity-75"
              >
                {submitting ? t('recording_status') : t('submit_batch')}
              </button>
            </div>
          </div>

          {/* Right Col: Entry Form & List */}
          <div className="lg:col-span-2 space-y-6">
            {massType === 'MAJOR' ? (
              <>
                {/* Entry Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">{t('record_card_offering')}</h3>

                  {/* Card Search */}
                  <div className="relative mb-6">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setSelectedCard(null); }}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder={t('card_search_placeholder')}
                      autoFocus
                    />
                    {/* Dropdown Results */}
                    {search && !selectedCard && (cardsData?.offeringCards?.items?.length || 0) > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-60 overflow-y-auto">
                        {cardsData.offeringCards.items.map((c: any) => (
                          <div
                            key={c.id}
                            onClick={() => { setSelectedCard(c); setSearch(c.code + (c.assignedToName ? ` - ${c.assignedToName}` : '')); }}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                          >
                            <div className="font-bold text-gray-800 flex justify-between">
                              <span>{c.code}</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">{c.street}</span>
                            </div>
                            <div className="text-sm text-gray-600">{c.assignedToName || t('unassigned')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Amounts Grid */}
                  <div className={`transition-opacity ${selectedCard ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>

                    {/* Quick Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                      {[100, 500, 1000, 2000, 5000, 10000].map(amt => (
                        <button
                          key={amt}
                          onClick={() => handleQuickAdd(amt)}
                          className="bg-gray-100 hover:bg-[#E8FFD7] hover:text-[#5E936C] text-gray-700 font-bold py-1 px-3 rounded text-sm transition-colors border border-gray-200"
                        >
                          +{numberFmt(amt)}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('ahadi')}</label>
                        <input
                          ref={ahadiRef}
                          type="number"
                          value={amtAhadi}
                          onFocus={() => setActiveField('AHADI')}
                          onChange={e => setAmtAhadi(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'AHADI')}
                          className={`w-full p-2 border rounded outline-none focus:ring-2 ${activeField === 'AHADI' ? 'ring-2 ring-[#5E936C] border-[#5E936C]' : 'focus:ring-[#5E936C]'}`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('shukrani')}</label>
                        <input
                          ref={shukraniRef}
                          type="number"
                          value={amtShukrani}
                          onFocus={() => setActiveField('SHUKRANI')}
                          onChange={e => setAmtShukrani(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'SHUKRANI')}
                          className={`w-full p-2 border rounded outline-none focus:ring-2 ${activeField === 'SHUKRANI' ? 'ring-2 ring-[#5E936C] border-[#5E936C]' : 'focus:ring-[#5E936C]'}`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t('majengo')}</label>
                        <input
                          ref={majengoRef}
                          type="number"
                          value={amtMajengo}
                          onFocus={() => setActiveField('MAJENGO')}
                          onChange={e => setAmtMajengo(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, 'MAJENGO')}
                          className={`w-full p-2 border rounded outline-none focus:ring-2 ${activeField === 'MAJENGO' ? 'ring-2 ring-[#5E936C] border-[#5E936C]' : 'focus:ring-[#5E936C]'}`}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleAddEntry}
                      disabled={!selectedCard}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50"
                    >
                      <FaPlus /> {t('add_entry')}
                    </button>
                  </div>
                </div>

                {/* Recent Entries List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700">{t('recorded_entries')}</h3>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded-full text-gray-600">{entries.length} {t('items')}</span>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                        <tr>
                          <th className="px-4 py-3">{t('card')}</th>
                          <th className="px-4 py-3">{t('type')}</th>
                          <th className="px-4 py-3 text-right">{t('amount')}</th>
                          <th className="px-4 py-3 text-center">{t('action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entries.slice().reverse().map((e, idx) => ( // Show newest first
                          <tr key={idx} className="group hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{e.cardCode}</td>
                            <td className="px-4 py-3 text-xs">
                              <span className={`px-2 py-1 rounded-full ${e.entryType === 'AHADI' ? 'bg-blue-100 text-blue-800' : e.entryType === 'SHUKRANI' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                                {e.entryType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{numberFmt(e.amount)}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  // to remove, we need original index. reversing makes it tricky. 
                                  // better to filter by exact object ref or use original ID if present
                                  // for now simple filter by index relative to original array
                                  const originalIndex = entries.length - 1 - idx;
                                  setEntries(prev => prev.filter((_, i) => i !== originalIndex));
                                }}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {entries.length === 0 && (
                          <tr><td colSpan={4} className="p-8 text-center text-gray-400 italic">{t('no_entries_yet')}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-blue-50 rounded-xl p-8 border border-blue-100 text-center">
                <FaExclamationCircle className="mx-auto text-blue-400 mb-4" size={48} />
                <h3 className="text-xl font-bold text-blue-800 mb-2">{t('no_cards_needed')}</h3>
                <p className="text-blue-600">
                  <Trans i18nKey="no_cards_needed_desc" values={{ massType }}>
                    For <strong>{massType}</strong>, you do not need to record individual card entries.
                    Simply enter the <strong>Total Collection Amount</strong> in the yellow box on the left.
                  </Trans>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Badge = ({ type, children }: { type: string, children: React.ReactNode }) => {
  const colors: any = {
    info: 'bg-blue-100 text-blue-800',
    neutral: 'bg-gray-100 text-gray-800',
    warning: 'bg-yellow-100 text-yellow-800',
    success: 'bg-[#E8FFD7] text-[#5E936C]'
  };
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[type] || colors.neutral}`}>{children}</span>;
}

export default OfferingEntryPage;

// Revision note [2026-07-15 18:39:32 +0300]: Refactor route guards and auth check hooks

// Revision note [2026-07-30 09:44:19 +0300]: Enhance church leader photo preview component

// Revision note [2026-08-13 14:41:31 +0300]: Refactor offering entry table structure

// Activity update [2026-07-14 09:24:06 +0300]: Refactor route guards and auth check hooks

// Activity update [2026-07-24 09:21:01 +0300]: Update button hover states and active indicators
