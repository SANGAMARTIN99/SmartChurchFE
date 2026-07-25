import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaUsers, FaUserShield, FaChartLine, FaPlus, FaCheck, FaTimes,
    FaInfoCircle, FaHandHoldingHeart, FaHistory, FaUserPlus, FaEnvelopeOpenText,
    FaArrowLeft, FaEllipsisV, FaSearch, FaUserMinus, FaBullhorn, FaPercentage,
    FaDollarSign, FaSync
} from 'react-icons/fa';
import { GET_MY_GROUPS } from '../../api/queries';
import {
    APPLY_TO_GROUP,
    REVIEW_GROUP_APPLICATION,
    ADD_GROUP_FINANCIAL_RECORD,
    REMOVE_GROUP_MEMBER,
    BROADCAST_GROUP_ANNOUNCEMENT
} from '../../api/mutations';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

// --- Types ---

interface Member {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    profilePhoto?: string;
}

interface Application {
    id: string;
    member: Member;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    note: string;
    createdAt: string;
}

interface FinancialRecord {
    id: string;
    amount: number;
    transactionType: 'INCOME' | 'EXPENSE';
    description: string;
    date: string;
}

interface Group {
    id: string;
    name: string;
    description: string;
    category: string;
    leader?: {
        id: string;
        fullName: string;
    };
    memberCount: number;
    members?: Member[];
    totalIncome?: number;
    totalExpense?: number;
    balance?: number;
    financialRecords?: FinancialRecord[];
    applications?: Application[];
    myApplication?: {
        id: string;
        status: string;
    };
}

const MyGroups = () => {
    const { t } = useTranslation();
    const [activeView, setActiveView] = useState<'joined' | 'explore' | 'manage'>('joined');
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [appModalOpen, setAppModalOpen] = useState(false);
    const [financeModalOpen, setFinanceModalOpen] = useState(false);
    const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [appNote, setAppNote] = useState('');
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [broadcastData, setBroadcastData] = useState({ title: '', message: '' });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [subTab, setSubTab] = useState<'members' | 'applications' | 'finances'>('members');

    const { data, loading, error, refetch, networkStatus } = useQuery(GET_MY_GROUPS, {
        fetchPolicy: 'cache-and-network',
        pollInterval: 30000,
        notifyOnNetworkStatusChange: true
    });

    const [applyToGroup] = useMutation(APPLY_TO_GROUP);
    const [reviewApplication] = useMutation(REVIEW_GROUP_APPLICATION);
    const [addFinance] = useMutation(ADD_GROUP_FINANCIAL_RECORD);
    const [removeMember] = useMutation(REMOVE_GROUP_MEMBER);
    const [broadcastAnnouncement] = useMutation(BROADCAST_GROUP_ANNOUNCEMENT);

    const myJoinedGroups: Group[] = useMemo(() => data?.me?.groups || [], [data]);
    const myLedGroups: Group[] = useMemo(() => data?.me?.ledGroups || [], [data]);
    const allGroups: Group[] = useMemo(() => data?.groups || [], [data]);

    // Sync selectedGroup when data updates to keep UI fresh
    useEffect(() => {
        if (selectedGroup) {
            const allItems = [...myJoinedGroups, ...myLedGroups, ...allGroups];
            const updated = allItems.find(g => g.id === selectedGroup.id);

            if (updated) {
                // Use a stable JSON comparison to prevent feedback loops
                const oldStr = JSON.stringify(selectedGroup);
                const newStr = JSON.stringify(updated);
                if (oldStr !== newStr) {
                    setSelectedGroup(updated);
                }
            }
        }
    }, [data, myJoinedGroups, myLedGroups, allGroups]); // Removed selectedGroup from deps

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refetch();
            toast.info(t('groups_data_refreshed') || 'Data updated');
        } catch (err) {
            toast.error('Failed to sync data');
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleApply = async (groupId: string) => {
        try {
            const { data: res } = await applyToGroup({ variables: { groupId, note: appNote } });
            if (res.applyToGroup.success) {
                toast.success(t('groups_application_submitted'));
                setAppModalOpen(false);
                setAppNote('');
                refetch();
            } else {
                toast.error(res.applyToGroup.message);
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleReview = async (applicationId: string, status: 'APPROVED' | 'REJECTED') => {
        try {
            await reviewApplication({ variables: { applicationId, status } });
            toast.success(t(`groups_application_${status.toLowerCase()}`));
            refetch();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleAddFinance = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            if (!selectedGroup) return;
            await addFinance({
                variables: {
                    groupId: selectedGroup.id,
                    amount: parseFloat(formData.get('amount') as string),
                    transactionType: formData.get('type'),
                    description: formData.get('description'),
                    date: formData.get('date') || new Date().toISOString().split('T')[0]
                }
            });
            toast.success(t('groups_record_added'));
            setFinanceModalOpen(false);
            refetch();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;
        try {
            await broadcastAnnouncement({
                variables: {
                    groupId: selectedGroup.id,
                    title: broadcastData.title || `Announcement from ${selectedGroup.name}`,
                    message: broadcastData.message
                }
            });
            toast.success(t('groups_broadcast_success'));
            setBroadcastModalOpen(false);
            setBroadcastData({ title: '', message: '' });
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!selectedGroup) return;
        if (!window.confirm(t('groups_confirm_remove_member'))) return;
        try {
            await removeMember({ variables: { groupId: selectedGroup.id, memberId } });
            toast.success(t('groups_member_removed'));
            refetch();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(amount);

    const formatDateSafe = (dateStr: string) => {
        try {
            if (!dateStr) return 'No Date';
            return format(new Date(dateStr), 'MMM dd, yyyy');
        } catch (err) {
            return 'Invalid Date';
        }
    };

    // --- Render Components ---

    const GroupCard = ({ group, isJoined, isLeader }: { group: Group, isJoined?: boolean, isLeader?: boolean }) => (
        <motion.div
            layout
            whileHover={{ y: -5 }}
            className="bg-white/70 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/20 flex flex-col justify-between group h-full transition-all hover:bg-white/90"
        >
            <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-gradient-to-br from-[#1a3c2b] to-[#5E936C] p-3 rounded-2xl text-white shadow-lg">
                        <FaUsers className="text-xl" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-gray-100 text-gray-500 rounded-full uppercase tracking-wider">
                        {group.category || 'Other'}
                    </span>
                </div>
                <h3 className="text-xl font-bold text-[#1a3c2b] mb-2">{group.name || 'Unnamed Group'}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4">{group.description || 'No description'}</p>

                <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><FaUsers className="text-[#5E936C]/70" /> {group.memberCount || 0} {t('groups_members_label')}</span>
                    {group.leader && <span className="flex items-center gap-1"><FaUserShield className="text-[#5E936C]/70" /> {group.leader.fullName}</span>}
                </div>
            </div>

            <div className="mt-6 flex gap-2">
                {isLeader ? (
                    <button
                        onClick={() => { setSelectedGroup(group); setActiveView('manage'); }}
                        className="flex-1 bg-[#1a3c2b] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#2d5c43] transition shadow-md"
                    >
                        <FaUserShield /> {t('groups_manage')}
                    </button>
                ) : isJoined ? (
                    <button
                        onClick={() => setSelectedGroup(group)}
                        className="flex-1 bg-white border-2 border-[#1a3c2b] text-[#1a3c2b] py-2.5 rounded-2xl font-bold hover:bg-[#f0f9f4] transition"
                    >
                        {t('groups_view_details')}
                    </button>
                ) : (
                    <button
                        disabled={!!group.myApplication && group.myApplication.status === 'PENDING'}
                        onClick={() => { setSelectedGroup(group); setAppModalOpen(true); }}
                        className={`flex-1 ${group.myApplication?.status === 'PENDING' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#5E936C] text-white hover:bg-[#4a7a58] shadow-md'} py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition`}
                    >
                        {group.myApplication?.status === 'PENDING' ? t('groups_application_pending') : <><FaPlus /> {t('groups_apply_to_join')}</>}
                    </button>
                )}
            </div>
        </motion.div>
    );

    const renderManagementView = () => {
        if (!selectedGroup) return <div className="p-20 text-center text-gray-400">Loading group details...</div>;

        try {
            const filteredMembers = (selectedGroup.members || []).filter(m => {
                if (!m) return false;
                const search = (memberSearchTerm || '').toLowerCase();
                return (m.fullName || '').toLowerCase().includes(search) ||
                    (m.phoneNumber || '').includes(search) ||
                    (m.email || '').toLowerCase().includes(search);
            });

            return (
                <motion.div key="management-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => { setSelectedGroup(null); setActiveView('joined'); setShowAnalytics(false); }} className="flex items-center gap-2 text-gray-500 hover:text-[#1a3c2b] transition font-medium">
                            <FaArrowLeft /> {t('groups_back_to_groups')}
                        </button>

                        <button
                            onClick={handleManualRefresh}
                            className={`flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm font-bold text-[#1a3c2b] hover:bg-gray-50 transition-all ${isRefreshing ? 'opacity-70' : ''}`}
                        >
                            <FaSync className={`${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Syncing...' : 'Sync Data'}
                        </button>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40">
                        <div className="bg-gradient-to-r from-[#1a3c2b] to-[#406851] p-8 md:p-10 text-white relative">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10">{selectedGroup.category || 'Category'}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowAnalytics(!showAnalytics)}
                                            className={`p-3 rounded-xl backdrop-blur-md border border-white/20 transition-all ${showAnalytics ? 'bg-white text-[#1a3c2b]' : 'bg-white/10 hover:bg-white/20'}`}
                                            title="View Analytics"
                                        >
                                            <FaChartLine />
                                        </button>
                                        <button
                                            onClick={() => setBroadcastModalOpen(true)}
                                            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md border border-white/20 transition-all"
                                            title="Broadcast Announcement"
                                        >
                                            <FaBullhorn />
                                        </button>
                                    </div>
                                </div>
                                <h2 className="text-4xl font-black mb-3">{selectedGroup.name || 'Group Details'}</h2>
                                <p className="text-white/80 max-w-2xl text-lg">{selectedGroup.description || 'No description available'}</p>

                                <div className="flex flex-wrap gap-8 mt-8">
                                    <div className="flex flex-col">
                                        <span className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">{t('groups_group_members')}</span>
                                        <span className="text-3xl font-black">{selectedGroup.memberCount || 0}</span>
                                    </div>
                                    <div className="flex flex-col pl-8 border-l border-white/20">
                                        <span className="text-white/60 text-sm font-bold uppercase tracking-wider mb-1">{t('groups_balance')}</span>
                                        <span className="text-3xl font-black">{formatCurrency(selectedGroup.balance || 0)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                                <FaUsers className="text-[12rem]" />
                            </div>
                        </div>

                        <AnimatePresence>
                            {showAnalytics && (
                                <motion.div
                                    key="analytics-panel"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-[#1a3c2b]/5 border-b border-gray-100 overflow-hidden"
                                >
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FaPercentage /></div>
                                                <h4 className="font-bold text-gray-700">Financial Growth</h4>
                                            </div>
                                            <p className="text-3xl font-black text-gray-800">+12.4%</p>
                                            <p className="text-xs text-gray-400 mt-1">vs Previous Month</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg"><FaUserPlus /></div>
                                                <h4 className="font-bold text-gray-700">New Members</h4>
                                            </div>
                                            <p className="text-3xl font-black text-gray-800">5</p>
                                            <p className="text-xs text-gray-400 mt-1">Joined this month</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><FaDollarSign /></div>
                                                <h4 className="font-bold text-gray-700">Average Gift</h4>
                                            </div>
                                            <p className="text-3xl font-black text-gray-800">{formatCurrency((selectedGroup.totalIncome || 0) / (selectedGroup.memberCount || 1))}</p>
                                            <p className="text-xs text-gray-400 mt-1">Per Member</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex border-b border-gray-100 p-2 gap-2 bg-gray-50/50">
                            {[
                                { id: 'members', label: t('groups_group_members') },
                                { id: 'applications', label: t('groups_join_requests') },
                                { id: 'finances', label: t('groups_financial_history') }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSubTab(tab.id as any)}
                                    className={`px-8 py-4 rounded-2xl font-bold transition-all ${subTab === tab.id ? 'bg-white text-[#1a3c2b] shadow-lg scale-105' : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'}`}
                                >
                                    {tab.label}
                                    {tab.id === 'applications' && selectedGroup.applications?.some(a => a?.status === 'PENDING') && (
                                        <span className="ml-2 w-2 h-2 bg-red-500 rounded-full inline-block" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="p-8">
                            <AnimatePresence mode="wait">
                                {subTab === 'members' && (
                                    <motion.div key="members-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-gray-800">{t('groups_group_members')}</h3>
                                            <div className="relative w-64">
                                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder={t('groups_search_members_placeholder')}
                                                    value={memberSearchTerm}
                                                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-xl border-none text-sm focus:ring-2 focus:ring-[#5E936C]"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredMembers.map(m => (
                                                <div key={m?.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 group">
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner bg-gray-50 border border-gray-100">
                                                        {m?.profilePhoto ? <img src={m.profilePhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#1a3c2b] bg-[#E8FFD7]"><FaUsers size={24} /></div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-800 truncate">{m?.fullName || 'Unknown Member'}</h4>
                                                        <p className="text-xs text-gray-500 truncate">{m?.phoneNumber || 'No phone'}</p>
                                                    </div>
                                                    <button onClick={() => m?.id && handleRemoveMember(m.id)} className="opacity-0 group-hover:opacity-100 p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"><FaUserMinus /></button>
                                                </div>
                                            ))}
                                            {filteredMembers.length === 0 && (
                                                <div className="col-span-full py-12 text-center text-gray-400 font-medium">
                                                    No members found matching your search.
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {subTab === 'applications' && (
                                    <motion.div key="apps-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <h3 className="text-xl font-bold text-gray-800 mb-4">{t('groups_join_requests')}</h3>
                                        {selectedGroup.applications?.filter(a => a?.status === 'PENDING').length === 0 ? (
                                            <div className="py-20 text-center text-gray-400 bg-gray-50/50 rounded-[2rem] border border-dashed flex flex-col items-center">
                                                <FaEnvelopeOpenText className="text-5xl mb-4 opacity-50" />
                                                <p className="font-medium">{t('groups_no_pending_applications')}</p>
                                            </div>
                                        ) : (
                                            selectedGroup.applications?.filter(a => a?.status === 'PENDING').map(app => (
                                                <div key={app?.id} className="bg-white p-6 rounded-3xl shadow-md border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner">
                                                            {app?.member?.profilePhoto ? (
                                                                <img src={app.member.profilePhoto} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[#1a3c2b] bg-[#E8FFD7] font-black">
                                                                    {(app?.member?.fullName || '?')[0]}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-gray-800 text-lg">{app?.member?.fullName || 'Unknown Member'}</h4>
                                                            <p className="text-[#5E936C] text-sm font-bold mb-1">{formatDateSafe(app?.createdAt)}</p>
                                                            {app?.note && <p className="text-gray-500 text-sm bg-gray-50 p-3 rounded-2xl italic">"{app.note}"</p>}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button onClick={() => app?.id && handleReview(app.id, 'REJECTED')} className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition border border-gray-100 flex items-center gap-2"><FaTimes /> {t('groups_reject')}</button>
                                                        <button onClick={() => app?.id && handleReview(app.id, 'APPROVED')} className="px-6 py-3 bg-[#1a3c2b] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2"><FaCheck /> {t('groups_approve')}</button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </motion.div>
                                )}

                                {subTab === 'finances' && (
                                    <motion.div key="finances-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-[#E8FFD7] p-8 rounded-[2rem] shadow-sm border border-[#93da97]/30">
                                                <span className="text-[#1a3c2b]/50 font-bold text-xs uppercase tracking-widest">{t('groups_income')}</span>
                                                <p className="text-3xl font-black text-[#1a3c2b] mt-1">{formatCurrency(selectedGroup.totalIncome || 0)}</p>
                                            </div>
                                            <div className="bg-red-50 p-8 rounded-[2rem] shadow-sm border border-red-100">
                                                <span className="text-red-900/40 font-bold text-xs uppercase tracking-widest">{t('groups_expenses')}</span>
                                                <p className="text-3xl font-black text-red-900 mt-1">{formatCurrency(selectedGroup.totalExpense || 0)}</p>
                                            </div>
                                            <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 flex items-center justify-center">
                                                <button onClick={() => setFinanceModalOpen(true)} className="w-full h-full bg-[#1a3c2b] text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-[#2d5c43] transition shadow-lg">
                                                    <FaPlus /> {t('groups_add_record')}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><FaHistory /> {t('groups_financial_history')}</h3>
                                            <div className="space-y-3">
                                                {selectedGroup.financialRecords?.length === 0 ? (
                                                    <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-[2rem] border border-dashed">
                                                        <FaChartLine className="text-5xl mb-4 opacity-50" />
                                                        <p className="font-medium">{t('groups_no_financial_records')}</p>
                                                    </div>
                                                ) : (
                                                    selectedGroup.financialRecords?.map(record => (
                                                        <div key={record?.id} className="bg-white p-5 rounded-2xl border border-gray-50 flex items-center justify-between group hover:shadow-md transition">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`p-3 rounded-xl ${record?.transactionType === 'INCOME' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                                    <FaChartLine />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-gray-800">{record?.description || 'No description'}</p>
                                                                    <p className="text-xs text-gray-400 uppercase font-black tracking-widest mt-1">{record?.date || ''}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`text-lg font-black ${record?.transactionType === 'INCOME' ? 'text-green-600' : 'text-red-500'}`}>
                                                                {record?.transactionType === 'INCOME' ? '+' : '-'} {formatCurrency(record?.amount || 0)}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            );
        } catch (err: any) {
            console.error('Crash in Management View logic:', err);
            return (
                <div className="p-20 text-center bg-white rounded-[3rem] shadow-xl border border-red-100">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                        <FaTimes />
                    </div>
                    <h2 className="text-2xl font-black text-[#1a3c2b] mb-2">Internal View Error</h2>
                    <p className="text-gray-500 mb-8 max-w-md mx-auto">An unexpected error occurred while rendering the group management console. Detailed error information is shown below for technical assistance.</p>
                    <div className="p-4 bg-gray-50 rounded-2xl text-left text-xs font-mono text-red-600 mb-8 overflow-auto max-h-32">
                        {err.message}
                    </div>
                    <button onClick={() => setSelectedGroup(null)} className="bg-[#1a3c2b] text-white px-10 py-4 rounded-2xl font-bold shadow-lg transition hover:bg-[#2d5c43]">
                        Return to Dashboard
                    </button>
                </div>
            );
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-[#F2F5F8] flex items-center justify-center p-8">
                <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center space-y-6 overflow-hidden">
                    <div className="bg-red-50 text-red-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-5xl">
                        <FaTimes />
                    </div>
                    <h2 className="text-3xl font-black text-[#1a3c2b]">{t('error_loading_groups') || 'Failed to Load Groups'}</h2>
                    <p className="text-gray-500 font-medium">{error.message}</p>
                    <button onClick={() => window.location.reload()} className="w-full bg-[#1a3c2b] text-white py-5 rounded-2xl font-black hover:bg-[#2d5c43] transition-all shadow-xl">
                        {t('retry') || 'Retry Refresh'}
                    </button>
                </div>
            </div>
        );
    }

    if (loading && networkStatus === 1) return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="h-12 w-1/3 bg-gray-200 animate-pulse rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-[2.5rem]"></div>)}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F2F5F8] p-4 md:p-8 lg:p-12 font-sans overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    {!selectedGroup || activeView !== 'manage' ? (
                        <motion.div key="list-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            {/* --- Header --- */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div>
                                    <h1 className="text-5xl font-black text-[#1a3c2b] tracking-tight mb-2">
                                        {t('groups_church_groups')}
                                    </h1>
                                    <div className="flex items-center gap-4">
                                        <p className="text-gray-500 text-lg font-medium">{t('groups_subtitle')}</p>
                                        <button
                                            onClick={handleManualRefresh}
                                            className={`p-2 bg-white rounded-lg shadow-sm border border-gray-100 text-[#1a3c2b] hover:bg-gray-50 transition-all ${isRefreshing ? 'opacity-50' : ''}`}
                                            title="Sync Data"
                                        >
                                            <FaSync className={`${isRefreshing ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex bg-white/50 backdrop-blur-md p-2 rounded-[2rem] shadow-xl border border-white/20">
                                    {[
                                        { id: 'joined', icon: FaUsers, label: t('groups_my_groups') },
                                        { id: 'explore', icon: FaSearch, label: t('groups_explore') },
                                        { id: 'manage', icon: FaUserShield, label: t('groups_management') }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setActiveView(tab.id as any); setSelectedGroup(null); }}
                                            className={`px-6 py-4 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${activeView === tab.id ? 'bg-[#1a3c2b] text-white shadow-2xl scale-105' : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'}`}
                                        >
                                            <tab.icon /> {tab.label}
                                            {tab.id === 'manage' && myLedGroups.length > 0 && <span className="w-2 h-2 bg-[#5E936C] rounded-full animate-ping" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* --- Main Grid --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {activeView === 'joined' && (
                                    myJoinedGroups.length > 0 ? (
                                        myJoinedGroups.map(g => <GroupCard key={g.id} group={g} isJoined />)
                                    ) : (
                                        <div className="col-span-full py-24 text-center bg-white/50 rounded-[3rem] border border-dashed border-gray-300">
                                            <FaUsers className="text-6xl text-gray-300 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold text-gray-500 mb-2">{t('groups_no_groups_yet')}</h3>
                                            <p className="text-gray-400 mb-8">{t('groups_no_groups_msg')}</p>
                                            <button onClick={() => setActiveView('explore')} className="bg-[#1a3c2b] text-white px-8 py-4 rounded-2xl font-bold hover:translate-y-[-2px] transition shadow-lg">{t('groups_explore_all')}</button>
                                        </div>
                                    )
                                )}

                                {activeView === 'explore' && allGroups.map(g => <GroupCard key={g.id} group={g} isJoined={myJoinedGroups.some(jg => jg.id === g.id)} />)}

                                {activeView === 'manage' && (
                                    myLedGroups.length > 0 ? (
                                        myLedGroups.map(g => <GroupCard key={g.id} group={g} isLeader />)
                                    ) : (
                                        <div className="col-span-full py-24 text-center bg-white/50 rounded-[3rem] border border-dashed border-gray-300">
                                            <FaUserShield className="text-6xl text-gray-300 mx-auto mb-6" />
                                            <h3 className="text-2xl font-bold text-gray-500 mb-2">{t('groups_no_leadership_roles')}</h3>
                                            <p className="text-gray-400">{t('groups_leadership_msg')}</p>
                                        </div>
                                    )
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        renderManagementView()
                    )}
                </AnimatePresence>
            </div>

            {/* --- Modals --- */}
            {appModalOpen && selectedGroup && (
                <AnimatePresence>
                    <motion.div key="modal-app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                            <div className="bg-[#1a3c2b] p-8 text-white relative">
                                <div className="relative z-10">
                                    <FaUserPlus className="text-4xl mb-4 opacity-70" />
                                    <h3 className="text-3xl font-black mb-1">{t('groups_apply_to')} {selectedGroup.name}</h3>
                                    <p className="text-white/60 font-medium">{t('groups_join_group_subtitle')}</p>
                                </div>
                                <button onClick={() => setAppModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><FaTimes size={24} /></button>
                            </div>
                            <div className="p-10">
                                <div className="mb-6">
                                    <label className="block text-[#1a3c2b] text-sm font-black uppercase tracking-widest mb-3 ml-1">{t('groups_application_note')}</label>
                                    <textarea
                                        rows={4}
                                        value={appNote}
                                        onChange={(e) => setAppNote(e.target.value)}
                                        className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-[#5E936C] focus:bg-white rounded-3xl transition-all resize-none shadow-inner"
                                        placeholder={t('groups_tell_us_why_placeholder')}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setAppModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition">{t('groups_cancel')}</button>
                                    <button onClick={() => handleApply(selectedGroup.id)} className="flex-1 bg-[#1a3c2b] text-white py-4 rounded-2xl font-black shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                                        <FaCheck /> {t('groups_submit_application')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            {financeModalOpen && selectedGroup && (
                <AnimatePresence>
                    <motion.div key="modal-finance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="bg-[#1a3c2b] p-8 text-white relative">
                                <FaPlus className="text-4xl mb-4 opacity-70" />
                                <h3 className="text-3xl font-black mb-1">{t('groups_add_financial_record')}</h3>
                                <p className="text-white/60 font-medium">{selectedGroup.name}</p>
                                <button onClick={() => setFinanceModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><FaTimes size={24} /></button>
                            </div>
                            <form onSubmit={handleAddFinance} className="p-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[#1a3c2b] text-sm font-black uppercase tracking-widest mb-2 ml-1">{t('groups_record_type')}</label>
                                        <select name="type" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#5E936C] rounded-2xl font-bold text-gray-700" required>
                                            <option value="INCOME">{t('groups_income')}</option>
                                            <option value="EXPENSE">{t('groups_expenses')}</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[#1a3c2b] text-sm font-black uppercase tracking-widest mb-2 ml-1">{t('groups_amount')}</label>
                                            <input name="amount" type="number" step="0.01" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#5E936C] rounded-2xl font-black text-lg" required />
                                        </div>
                                        <div>
                                            <label className="block text-[#1a3c2b] text-sm font-black uppercase tracking-widest mb-2 ml-1">{t('groups_date')}</label>
                                            <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#5E936C] rounded-2xl" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[#1a3c2b] text-sm font-black uppercase tracking-widest mb-2 ml-1">{t('groups_description')}</label>
                                        <input name="description" className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#5E936C] rounded-2xl" placeholder={t('groups_finance_description_placeholder')} required />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-10">
                                    <button type="button" onClick={() => setFinanceModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition">{t('groups_cancel')}</button>
                                    <button type="submit" className="flex-1 bg-[#1a3c2b] text-white py-4 rounded-2xl font-black shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                                        <FaCheck /> {t('groups_save_record')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            {broadcastModalOpen && selectedGroup && (
                <AnimatePresence>
                    <motion.div key="modal-broadcast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                            <div className="bg-[#1a3c2b] p-8 text-white relative">
                                <div className="relative z-10">
                                    <FaBullhorn className="text-4xl mb-4 opacity-70" />
                                    <h3 className="text-3xl font-black mb-1">{t('groups_broadcast_title')}</h3>
                                    <p className="text-white/60 font-medium">{t('groups_broadcast_subtitle')}</p>
                                </div>
                                <button onClick={() => setBroadcastModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><FaTimes size={24} /></button>
                            </div>
                            <form onSubmit={handleBroadcast} className="p-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[#1a3c2b] text-sm font-black uppercase tracking-widest mb-3 ml-1">{t('groups_headline_title') || 'Headline'}</label>
                                        <input
                                            type="text"
                                            value={broadcastData.title}
                                            onChange={(e) => setBroadcastData({ ...broadcastData, title: e.target.value })}
                                            className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-[#5E936C] rounded-2xl font-bold"
                                            placeholder={t('groups_headline_placeholder')}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#1a3c2b] text-sm font-black uppercase tracking-widest mb-3 ml-1">{t('groups_message_content') || 'Message'}</label>
                                        <textarea
                                            rows={5}
                                            value={broadcastData.message}
                                            onChange={(e) => setBroadcastData({ ...broadcastData, message: e.target.value })}
                                            className="w-full p-5 bg-gray-50 border-2 border-transparent focus:border-[#5E936C] focus:bg-white rounded-3xl transition-all resize-none shadow-inner font-medium"
                                            placeholder={t('groups_message_placeholder')}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-10">
                                    <button type="button" onClick={() => setBroadcastModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition">{t('groups_cancel')}</button>
                                    <button type="submit" className="flex-1 bg-[#1a3c2b] text-white py-4 rounded-2xl font-black shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                                        <FaCheck /> {t('groups_send_broadcast')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            )}

            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
};

export default MyGroups;

// Revision note [2026-07-17 14:28:37 +0300]: Update broadcast announcement modal layout

// Revision note [2026-07-31 18:38:18 +0300]: Refactor pending post review modal flow

// Activity update [2026-07-15 16:18:53 +0300]: Update broadcast announcement modal layout

// Activity update [2026-07-25 17:36:30 +0300]: Enhance church leader photo preview component
