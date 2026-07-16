import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaCheck, FaTimes, FaSearch, FaFilter, FaEdit, FaEye, FaRegCreditCard, FaUserFriends, FaClipboardList, FaBullhorn, FaCalendarAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import {
  GET_STREETS_AND_GROUPS,
  GET_OFFERING_CARDS,
  GET_AVAILABLE_CARD_NUMBERS,
  GET_CARDS_OVERVIEW,
  REGISTRATION_WINDOW_STATUS,
  GET_CARD_APPLICATIONS
} from '../../api/queries';
import {
  CREATE_OFFERING_CARD,
  ASSIGN_CARD,
  UPDATE_ASSIGNMENT,
  RECORD_OFFERING_ENTRY,
  BULK_GENERATE_CARDS,
  OPEN_REGISTRATION_WINDOW,
  CLOSE_REGISTRATION_WINDOW,
  APPROVE_CARD_APPLICATION,
  REJECT_CARD_APPLICATION
} from '../../api/mutations';
import { toast } from 'react-toastify';

// -- Interfaces & Types --

interface CardApplication {
  id: string;
  fullName: string;
  phoneNumber: string;
  street: string;
  preferredNumber?: number;
  pledgedAhadi: number;
  pledgedShukrani: number;
  pledgedMajengo: number;
  note?: string;
  createdAt: string;
}

interface OfferingCard {
  id: string;
  code: string;
  street: string;
  number: number;
  isTaken: boolean;
  assignedToName?: string;
  assignedPhone?: string;
  pledgedAhadi?: number;
  pledgedShukrani?: number;
  pledgedMajengo?: number;
  progressAhadi?: number;
  progressShukrani?: number;
  progressMajengo?: number;
}

// -- Utility Components --

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow`}>
    <div>
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${color}`}>{value}</h3>
    </div>
    <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
      <span className={color}>{icon}</span>
    </div>
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; type?: 'success' | 'warning' | 'danger' | 'neutral' }> = ({ children, type = 'neutral' }) => {
  const styles = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    neutral: 'bg-gray-100 text-gray-800',
  };
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[type]}`}>{children}</span>;
};

// -- Main Component --

const OfferingCardsPage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'cards' | 'create'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [streetFilter, setStreetFilter] = useState<string>('');

  // Modals
  const [approveModal, setApproveModal] = useState<{ isOpen: boolean; app: CardApplication | null }>({ isOpen: false, app: null });
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; app: CardApplication | null }>({ isOpen: false, app: null });
  const [assignModal, setAssignModal] = useState(false);

  // Queries
  const { data: windowData, refetch: refetchWindow } = useQuery(REGISTRATION_WINDOW_STATUS);
  const { data: appData, refetch: refetchApps } = useQuery(GET_CARD_APPLICATIONS, { variables: { status: 'NEW' } });
  const { data: cardsData, refetch: refetchCards } = useQuery(GET_OFFERING_CARDS, {
    variables: {
      streetId: streetFilter ? Number(streetFilter) : null,
      search: searchQuery || null
    },
    fetchPolicy: 'network-only' // Force refresh to ensure data appears
  });
  const { data: metaData } = useQuery(GET_STREETS_AND_GROUPS);

  // Derived Data
  const applications = (appData?.cardApplications?.items || []) as CardApplication[];
  const cards = (cardsData?.offeringCards?.items || []) as OfferingCard[];
  const streets = metaData?.streets || [];
  const windowStatus = windowData?.registrationWindowStatus || { isOpen: false };

  // Mutations
  const [openWindow] = useMutation(OPEN_REGISTRATION_WINDOW, { onCompleted: () => refetchWindow() });
  const [closeWindow] = useMutation(CLOSE_REGISTRATION_WINDOW, { onCompleted: () => refetchWindow() });
  const [approveApp] = useMutation(APPROVE_CARD_APPLICATION, { onCompleted: () => { refetchApps(); refetchCards(); toast.success('Application Approved'); setApproveModal({ isOpen: false, app: null }); } });
  const [rejectApp] = useMutation(REJECT_CARD_APPLICATION, { onCompleted: () => { refetchApps(); toast.info('Application Rejected'); setRejectModal({ isOpen: false, app: null }); } });
  const [createCard, { loading: creating }] = useMutation(CREATE_OFFERING_CARD, { onCompleted: () => { refetchCards(); toast.success('Card Created'); } });
  const [bulkGenerate, { loading: bulkLoading }] = useMutation(BULK_GENERATE_CARDS, { onCompleted: () => { refetchCards(); toast.success('Batch Generated'); } });

  // -- handlers --

  const toggleWindow = () => {
    if (windowStatus.isOpen) {
      if (confirm('Are you sure you want to close the registration window?')) closeWindow();
    } else {
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7); // Default 7 days
      openWindow({ variables: { startAt: now.toISOString(), endAt: end.toISOString() } });
    }
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModal.app) return;
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);

    approveApp({
      variables: {
        applicationId: approveModal.app.id,
        cardId: data.get('cardId'),
        year: new Date().getFullYear(),
        pledgedAhadi: Number(data.get('pledgeAhadi')),
        pledgedShukrani: Number(data.get('pledgeShukrani')),
        pledgedMajengo: Number(data.get('pledgeMajengo')),
      }
    });
  };

  // -- Render Helpers --

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cards"
          value={cards.length}
          icon={<FaRegCreditCard size={20} />}
          color="text-blue-600"
        />
        <StatCard
          title="Assigned Cards"
          value={cards.filter(c => c.isTaken).length}
          icon={<FaCheck size={20} />}
          color="text-[#5E936C]"
        />
        <StatCard
          title="Available Cards"
          value={cards.filter(c => !c.isTaken).length}
          icon={<FaRegCreditCard size={20} />}
          color="text-gray-500"
        />
        <StatCard
          title="Pending Apps"
          value={applications.length}
          icon={<FaClipboardList size={20} />}
          color="text-orange-500"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">Registration Window</h3>
          <button
            onClick={toggleWindow}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${windowStatus.isOpen ? 'bg-[#E8FFD7] text-[#5E936C] hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {windowStatus.isOpen ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
            {windowStatus.isOpen ? 'Active' : 'Closed'}
          </button>
        </div>
        <p className="text-gray-600 text-sm">
          {windowStatus.isOpen
            ? `Registration is currently open. Members can apply for cards until ${new Date(windowStatus.endAt).toLocaleDateString()}.`
            : "Registration is closed. Members cannot submit new applications."}
        </p>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-4 animate-fade-in">
      {applications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          <FaClipboardList size={48} className="mx-auto mb-4 opacity-20" />
          <p>No pending applications found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => (
            <div key={app.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-bold text-lg text-gray-800">{app.fullName}</h4>
                  <Badge type="warning">Pending</Badge>
                </div>
                <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                  <span className="flex items-center gap-1"><FaUserFriends size={12} /> {app.street}</span>
                  <span className="flex items-center gap-1">📞 {app.phoneNumber}</span>
                  <span className="flex items-center gap-1">📅 {new Date(app.createdAt).toLocaleDateString()}</span>
                  {app.preferredNumber && <span className="font-medium text-blue-600">Prefers: #{app.preferredNumber}</span>}
                </div>
                <div className="mt-3 flex gap-6 text-sm">
                  <div><span className="text-gray-500 block text-xs uppercase">Ahadi</span> <span className="font-medium">{app.pledgedAhadi.toLocaleString()}</span></div>
                  <div><span className="text-gray-500 block text-xs uppercase">Shukrani</span> <span className="font-medium">{app.pledgedShukrani.toLocaleString()}</span></div>
                  <div><span className="text-gray-500 block text-xs uppercase">Majengo</span> <span className="font-medium">{app.pledgedMajengo.toLocaleString()}</span></div>
                </div>
                {app.note && <div className="mt-2 text-xs text-gray-500 italic">Note: {app.note}</div>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setApproveModal({ isOpen: true, app })}
                  className="px-4 py-2 bg-[#5E936C] hover:bg-[#4a7a58] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick={() => setRejectModal({ isOpen: true, app })}
                  className="px-4 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCards = () => (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5E936C] focus:border-transparent transition-all"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5E936C] appearance-none bg-white"
            value={streetFilter}
            onChange={e => setStreetFilter(e.target.value)}
          >
            <option value="">All Streets</option>
            {streets.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
              <th className="px-6 py-4">Card Code</th>
              <th className="px-6 py-4">Assigned Member</th>
              <th className="px-6 py-4">Street</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {cards.map(card => (
              <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-gray-700">{card.code}</td>
                <td className="px-6 py-4">
                  {card.assignedToName ? (
                    <div>
                      <div className="font-medium text-gray-900">{card.assignedToName}</div>
                      <div className="text-gray-500 text-xs">{card.assignedPhone}</div>
                    </div>
                  ) : <span className="text-gray-400 italic">Unassigned</span>}
                </td>
                <td className="px-6 py-4 text-gray-600">{card.street}</td>
                <td className="px-6 py-4">
                  {card.isTaken ? <Badge type="success">Active</Badge> : <Badge type="neutral">Free</Badge>}
                </td>
                <td className="px-6 py-4 text-right">
                  {card.isTaken ? (
                    <div className="flex flex-col items-end gap-1">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#5E936C] rounded-full" style={{ width: `${Math.min(100, card.progressAhadi || 0)}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-400">{(card.progressAhadi || 0).toFixed(0)}% Ahadi</span>
                    </div>
                  ) : <span>-</span>}
                </td>
              </tr>
            ))}
            {cards.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No cards found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offering Management</h1>
          <p className="text-gray-500 mt-1">Manage cards, applications, and registration windows.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Action buttons could go here */}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'text-[#5E936C] border-b-2 border-[#5E936C]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'applications' ? 'text-[#5E936C] border-b-2 border-[#5E936C]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Applications
          {applications.length > 0 && <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs font-bold">{applications.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'cards' ? 'text-[#5E936C] border-b-2 border-[#5E936C]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          All Cards
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 px-1 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'create' ? 'text-[#5E936C] border-b-2 border-[#5E936C]' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Create / Batch
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {renderOverview()}
            </motion.div>
          )}
          {activeTab === 'applications' && (
            <motion.div key="applications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {renderApplications()}
            </motion.div>
          )}
          {activeTab === 'cards' && (
            <motion.div key="cards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {renderCards()}
            </motion.div>
          )}
          {activeTab === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid md:grid-cols-2 gap-8">
              {/* Single Create */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-[#E8FFD7] text-[#5E936C] flex items-center justify-center text-sm">1</div> Single Card</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const data = new FormData(form);
                  createCard({ variables: { input: { streetId: Number(data.get('streetId')), number: Number(data.get('number')) } } });
                  form.reset();
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                    <select name="streetId" className="w-full rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-[#5E936C]" required>
                      <option value="">Select a street...</option>
                      {streets.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <input name="number" type="number" className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-[#5E936C]" placeholder="e.g 45" required />
                  </div>
                  <button type="submit" disabled={creating} className="w-full bg-[#5E936C] text-white rounded-lg py-3 font-semibold hover:bg-[#4a7a58] transition-colors">
                    {creating ? 'Creating...' : 'Create Card'}
                  </button>
                </form>
              </div>

              {/* Batch Create */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">N</div> Batch Generate</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const data = new FormData(form);
                  const streetId = data.get('streetId');
                  // if streetid is missing, it will generate for ALL streets (if backend supports) or error. 
                  // Assuming for now user must pick street or all streets option
                  const variables: any = {
                    input: {
                      startNumber: Number(data.get('start')),
                      endNumber: Number(data.get('end'))
                    }
                  };
                  if (streetId) variables.input.streetId = Number(streetId);

                  bulkGenerate({ variables });
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Street (Optional)</label>
                    <select name="streetId" className="w-full rounded-lg border border-gray-300 p-2.5 bg-white focus:ring-2 focus:ring-blue-500">
                      <option value="">All Streets</option>
                      {streets.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Leave empty to generate for all streets at once.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start #</label>
                      <input name="start" type="number" className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500" placeholder="1" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End #</label>
                      <input name="end" type="number" className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-2 focus:ring-blue-500" placeholder="50" required />
                    </div>
                  </div>
                  <button type="submit" disabled={bulkLoading} className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors">
                    {bulkLoading ? 'Generating Batch...' : 'Generate Batch'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">Existing cards in range will be skipped.</p>
                </form>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal: Approve Application */}
      {approveModal.isOpen && approveModal.app && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold">Approve Application</h3>
              <button onClick={() => setApproveModal({ isOpen: false, app: null })}><FaTimes /></button>
            </div>
            <form onSubmit={handleApprove} className="p-6 space-y-4">
              <input type="hidden" name="appId" value={approveModal.app.id} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Card</label>
                <select name="cardId" className="w-full rounded-lg border-gray-300 border p-2 bg-gray-50" required>
                  <option value="">Select a free card...</option>
                  {/* Only showing free cards compatible with street would be ideal, for now showing all free */}
                  {cards.filter(c => !c.isTaken && c.street === approveModal.app!.street).map(c => (
                    <option key={c.id} value={c.id}>{c.code} (Matches Street)</option>
                  ))}
                  <option disabled>--- Other Streets ---</option>
                  {cards.filter(c => !c.isTaken && c.street !== approveModal.app!.street).map(c => (
                    <option key={c.id} value={c.id}>{c.code}</option>
                  ))}
                </select>
                {approveModal.app.preferredNumber && (
                  <p className="text-xs text-blue-600 mt-1">User prefers #{approveModal.app.preferredNumber}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Ahadi</label>
                  <input name="pledgeAhadi" type="number" defaultValue={approveModal.app.pledgedAhadi} className="w-full rounded border border-gray-300 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Shukrani</label>
                  <input name="pledgeShukrani" type="number" defaultValue={approveModal.app.pledgedShukrani} className="w-full rounded border border-gray-300 p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Majengo</label>
                  <input name="pledgeMajengo" type="number" defaultValue={approveModal.app.pledgedMajengo} className="w-full rounded border border-gray-300 p-2 text-sm" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-[#5E936C] text-white py-2.5 rounded-lg font-medium hover:bg-[#4a7a58]">Confirm Approval</button>
                <button type="button" onClick={() => setApproveModal({ isOpen: false, app: null })} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal: Reject Application */}
      {rejectModal.isOpen && rejectModal.app && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-red-600">Reject Application</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Are you sure you want to reject the application for <strong>{rejectModal.app.fullName}</strong>?</p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                rows={3}
                placeholder="Reason for rejection (optional)..."
                id="rejectReason"
              ></textarea>
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => {
                    const reason = (document.getElementById('rejectReason') as HTMLTextAreaElement).value;
                    rejectApp({ variables: { applicationId: rejectModal.app!.id, reason } });
                  }}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700"
                >
                  Reject Application
                </button>
                <button onClick={() => setRejectModal({ isOpen: false, app: null })} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default OfferingCardsPage;

// Revision note [2026-07-16 14:21:19 +0300]: Update word of the day dynamic graphics
