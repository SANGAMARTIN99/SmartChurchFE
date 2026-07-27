import React, { useState, useMemo } from 'react';
import {
  FaUsers, FaUserPlus, FaClock, FaSearch, FaEdit, FaTrash,
  FaCalendarAlt, FaMusic, FaPray, FaUserFriends,
  FaChild, FaPlus, FaBell, FaEllipsisV, FaCheckCircle, FaTimesCircle,
  FaChevronRight, FaFilter, FaArrowLeft, FaIdCard, FaChartLine
} from 'react-icons/fa';
import { MdGroupWork, MdOutlineCategory } from 'react-icons/md';
import { BsGraphUp } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { GET_GROUPS, GET_GROUP_DETAILS, GET_ALL_MEMBERS } from '../../api/queries';
import {
  CREATE_GROUP, UPDATE_GROUP, DELETE_GROUP,
  ADD_GROUP_MEMBER, REMOVE_GROUP_MEMBER,
  CREATE_ANNOUNCEMENT, BROADCAST_GROUP_ANNOUNCEMENT
} from '../../api/mutations';
import { useTranslation } from 'react-i18next';

// Types
interface Leader {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  category: string;
  leader: Leader | null;
  meetingDays: string[];
  meetingTime: string;
  location: string;
  memberCount: number;
  createdAt: string;
  isActive: boolean;
}

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  street: { name: string } | string;
}

const PremiumCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
    className={`bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

const GroupsManagement = () => {
  const { t } = useTranslation();
  const [activeView, setActiveView] = useState<'overview' | 'details' | 'create' | 'members' | 'analytics'>('overview');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modals
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Queries & Mutations
  const { data, loading, error, refetch: refetchGroups } = useQuery(GET_GROUPS, { fetchPolicy: 'network-only' });
  const [getGroupDetails, { data: detailsData, loading: detailsLoading, refetch: refetchDetails }] = useLazyQuery(GET_GROUP_DETAILS);
  const { data: allMembersData, loading: membersLoading } = useQuery(GET_ALL_MEMBERS, {
    variables: { search: memberSearchQuery },
    skip: !isAddingMember && activeView !== 'create'
  });

  const [createGroup] = useMutation(CREATE_GROUP, {
    onCompleted: () => {
      refetchGroups();
      setActiveView('overview');
    },
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const [updateGroup] = useMutation(UPDATE_GROUP, {
    onCompleted: () => {
      refetchGroups();
      setActiveView('overview');
    },
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const [deleteGroup] = useMutation(DELETE_GROUP, {
    onCompleted: () => refetchGroups(),
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const [addGroupMember] = useMutation(ADD_GROUP_MEMBER, {
    onCompleted: () => {
      refetchDetails();
      refetchGroups();
      setIsAddingMember(false);
    },
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const [removeGroupMember] = useMutation(REMOVE_GROUP_MEMBER, {
    onCompleted: () => {
      refetchDetails();
      refetchGroups();
    },
    onError: (err) => alert(`Error: ${err.message}`)
  });

  const [broadcastToGroup] = useMutation(BROADCAST_GROUP_ANNOUNCEMENT, {
    onCompleted: () => {
      setIsBroadcasting(false);
      setBroadcastMessage('');
      alert("Broadcast sent successfully to all group members!");
    },
    onError: (err) => alert(`Error: ${err.message}`)
  });

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'other',
    leaderId: '',
    meetingDays: [] as string[],
    meetingTime: '',
    location: '',
    isActive: true
  });

  const categories = useMemo(() => [
    { id: 'all', name: t('all_groups'), icon: <FaUsers />, color: '#5E936C', gradient: 'from-[#5E936C] to-[#4A8C5F]' },
    { id: 'choir', name: t('choirs'), icon: <FaMusic />, color: '#93DA97', gradient: 'from-[#93DA97] to-[#5E936C]' },
    { id: 'focus-group', name: t('focus_groups'), icon: <FaUserFriends />, color: '#4A8C5F', gradient: 'from-[#4A8C5F] to-emerald-700' },
    { id: 'youth', name: t('youth_groups'), icon: <FaChild />, color: '#3A7A4F', gradient: 'from-[#3A7A4F] to-[#5E936C]' },
    { id: 'prayer', name: t('prayer_groups'), icon: <FaPray />, color: '#6B7280', gradient: 'from-gray-500 to-gray-700' }
  ], [t]);

  const groups: Group[] = data?.groups || [];
  const groupMembers = detailsData?.group?.members || [];
  const allMembers = allMembersData?.allMembers || [];

  const filteredGroups = useMemo(() => {
    return groups.filter(group => {
      const name = group.name || '';
      const description = group.description || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || group.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [groups, searchQuery, selectedCategory]);

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      leaderId: formData.leaderId ? parseInt(formData.leaderId) : null,
      meetingDays: formData.meetingDays,
      meetingTime: formData.meetingTime || null,
      location: formData.location,
      isActive: formData.isActive
    };

    if (selectedGroup) {
      updateGroup({ variables: { id: selectedGroup.id, input } });
    } else {
      createGroup({ variables: { input } });
    }
  };

  const handleEditGroup = (group: Group) => {
    setSelectedGroup(group);
    let sanitizedDays: string[] = [];
    if (Array.isArray(group.meetingDays)) {
      sanitizedDays = group.meetingDays;
    } else if (typeof group.meetingDays === 'string') {
      try {
        const p = JSON.parse((group.meetingDays as string).replace(/'/g, '"'));
        sanitizedDays = Array.isArray(p) ? p : [group.meetingDays];
      } catch (e) {
        sanitizedDays = (group.meetingDays as string).split(',').map(d => d.trim()).filter(Boolean);
      }
    }

    setFormData({
      name: group.name,
      description: group.description || '',
      category: group.category?.toLowerCase() || 'other',
      leaderId: group.leader?.id || '',
      meetingDays: sanitizedDays,
      meetingTime: group.meetingTime || '',
      location: group.location || '',
      isActive: group.isActive
    });
    getGroupDetails({ variables: { id: group.id } });
    setActiveView('create');
  };

  const handleViewDetails = (group: Group) => {
    setSelectedGroup(group);
    getGroupDetails({ variables: { id: group.id } });
    setActiveView('details');
  };

  const handleBroadcastingSubmit = () => {
    if (!broadcastMessage.trim()) return;
    broadcastToGroup({
      variables: {
        groupId: selectedGroup?.id,
        title: `Broadcast for ${selectedGroup?.name}`,
        message: broadcastMessage
      }
    });
  };

  const handleAddMemberToGroup = (memberId: string) => {
    if (!selectedGroup) return;
    addGroupMember({ variables: { groupId: selectedGroup.id, memberId } });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedGroup) return;
    if (confirm("Remove this member from the group?")) {
      removeGroupMember({ variables: { groupId: selectedGroup.id, memberId } });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FCF5] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-[#5E936C]/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[#5E936C] rounded-full animate-spin"></div>
        </div>
        <p className="text-[#5E936C] font-medium animate-pulse">Establishing Spiritual Connection...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F7FCF5] flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="bg-red-50 text-red-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl">
            <FaTimesCircle />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Connection Interrupted</h2>
          <p className="text-gray-600 font-medium">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#5E936C] text-white py-4 rounded-2xl font-black hover:bg-[#4a7a58] transition-all shadow-lg"
          >
            Reconnect Repository
          </button>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-[#F7FCF5] text-gray-800 font-sans selection:bg-[#5E936C]/20">
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">

            <AnimatePresence mode="wait">
              {activeView === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-10"
                >
                  {/* Modern Hero Section */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-[#5E936C] to-emerald-800 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="space-y-4 text-center md:text-left">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-medium border border-white/10"
                        >
                          <MdGroupWork className="mr-2" /> {t('ministry_management')}
                        </motion.div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
                          {t('church_groups_title')}
                        </h1>
                        <p className="text-white/80 text-lg md:text-xl max-w-xl font-light">
                          {t('manage_groups_subtitle')} Organize your congregation into vibrant, active communities.
                        </p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                          <button
                            onClick={() => { setSelectedGroup(null); setActiveView('create'); }}
                            className="bg-white text-[#5E936C] px-8 py-4 rounded-2xl flex items-center font-bold shadow-lg hover:bg-emerald-50 transition-all hover:scale-105"
                          >
                            <FaPlus className="mr-2" /> {t('new_group_btn')}
                          </button>
                          <button
                            onClick={() => setActiveView('analytics')}
                            className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl flex items-center font-bold hover:bg-white/20 transition-all"
                          >
                            <FaChartLine className="mr-2" /> View Analytics
                          </button>
                        </div>
                      </div>

                      <div className="hidden lg:grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 w-44">
                            <p className="text-white/60 text-sm">{t('total_groups_label')}</p>
                            <h3 className="text-3xl font-black">{groups.length}</h3>
                          </div>
                          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 w-44">
                            <p className="text-white/60 text-sm">{t('active_members') || 'Active Leaders'}</p>
                            <h3 className="text-3xl font-black">{groups.filter(g => g.leader).length}</h3>
                          </div>
                        </div>
                        <div className="mt-8">
                          <div className="bg-emerald-400/20 backdrop-blur-xl p-6 rounded-3xl border border-white/10 w-44">
                            <p className="text-white/60 text-sm">Engagement</p>
                            <h3 className="text-3xl font-black">88%</h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl"></div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white/50 backdrop-blur-xl sticky top-4 z-40 p-4 rounded-3xl border border-white/30 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <FaSearch className="absolute left-4 top-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={t('search_groups_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-[#5E936C] shadow-inner transition-all hover:bg-white/80"
                      />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 w-full md:w-auto mask-fade-right">
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-6 py-3.5 rounded-2xl flex items-center whitespace-nowrap font-bold transition-all ${selectedCategory === cat.id
                            ? `bg-gradient-to-r ${cat.gradient} text-white shadow-lg scale-105`
                            : 'bg-white text-gray-600 hover:bg-emerald-50'
                            }`}
                        >
                          <span className="mr-2 text-lg">{cat.icon}</span>
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Groups Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                      {filteredGroups.map((group, idx) => {
                        const category = categories.find(c => c.id === group.category) || categories[0];
                        return (
                          <motion.div
                            key={group.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <PremiumCard className="relative group/card h-full flex flex-col">
                              {/* Card Header Decoration */}
                              <div className={`h-2 w-full bg-gradient-to-r ${category.gradient}`}></div>

                              <div className="p-8 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-6">
                                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${category.gradient} text-white shadow-lg`}>
                                    {React.cloneElement(category.icon as React.ReactElement, { size: 24 })}
                                  </div>
                                  <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => { setSelectedGroup(group); setActiveView('analytics'); }}
                                      className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                                    >
                                      <FaChartLine />
                                    </button>
                                    <button
                                      onClick={() => handleEditGroup(group)}
                                      className="p-3 bg-emerald-50 text-[#5E936C] rounded-xl hover:bg-[#5E936C] hover:text-white transition-all shadow-sm"
                                    >
                                      <FaEdit />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); if (confirm(t('delete_confirm'))) deleteGroup({ variables: { id: group.id } }); }}
                                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                  <span className="text-xs font-black uppercase tracking-widest text-[#5E936C]/70">
                                    {category.name}
                                  </span>
                                  <h3 className="text-2xl font-black text-gray-800 line-clamp-1">{group.name}</h3>
                                  <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                                    {group.description || 'No description provided for this group.'}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 p-5 bg-[#F7FCF5] rounded-[2rem] border border-emerald-100/50 mb-8 mt-auto">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400">{t('leader_label')}</p>
                                    <p className="text-sm font-bold text-gray-700 truncate">{group.leader?.name || 'Unassigned'}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400">{t('members_label')}</p>
                                    <div className="flex items-center text-sm font-bold text-[#5E936C]">
                                      <span className="text-xl mr-1 leading-none">{group.memberCount}</span>
                                      <span className="text-[10px] mt-1 uppercase tracking-widest">{t('people_count')}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100/50 px-4 py-2 rounded-full border border-gray-200/50">
                                    <FaClock className="text-[#5E936C]" />
                                    <span className="font-medium whitespace-nowrap">
                                      {Array.isArray(group.meetingDays) && group.meetingDays.length > 0 ? group.meetingDays[0] : 'TBA'} • {group.meetingTime ? `${t('time_muda')} ${group.meetingTime}` : 'TBA'}
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleViewDetails(group); }}
                                    className="h-12 w-12 bg-white border-2 border-[#5E936C]/20 text-[#5E936C] rounded-2xl flex items-center justify-center hover:bg-[#5E936C] hover:text-white transition-all shadow-sm group-hover/card:border-[#5E936C] z-10"
                                  >
                                    <FaChevronRight className="group-hover:translate-x-1 transition-transform" />
                                  </button>
                                </div>
                              </div>
                            </PremiumCard>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeView === 'details' && selectedGroup && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-6xl mx-auto space-y-8"
                >
                  {/* Refined Details Header */}
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 gap-4">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <button
                        onClick={() => setActiveView('overview')}
                        className="p-4 bg-emerald-50 text-[#5E936C] rounded-2xl hover:bg-[#5E936C] hover:text-white transition-all"
                      >
                        <FaArrowLeft />
                      </button>
                      <div>
                        <h2 className="text-2xl font-black text-gray-800">{selectedGroup.name}</h2>
                        <div className="flex items-center text-[#5E936C] text-sm font-bold mt-1">
                          <span className={`w-2 h-2 rounded-full mr-2 ${selectedGroup.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                          {selectedGroup.isActive ? 'Active Ministry' : 'Inactive Ministry'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleEditGroup(selectedGroup)}
                        className="px-6 py-3 bg-[#5E936C] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#4a7a58] transition-all shadow-lg"
                      >
                        <FaEdit /> {t('edit')}
                      </button>
                      <button className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all">
                        <FaEllipsisV />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Core Info */}
                    <div className="lg:col-span-2 space-y-8">
                      <PremiumCard className="p-10">
                        <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
                          <MdOutlineCategory className="text-[#5E936C]" /> {t('group_mission')}
                        </h3>
                        <p className="text-gray-600 text-lg leading-loose font-light">
                          {selectedGroup.description || 'This group has not defined a mission statement yet. Adding a description helps members understand the purpose of this community.'}
                        </p>

                        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-6 bg-[#F7FCF5] rounded-3xl border border-emerald-100">
                            <h4 className="font-black text-[#5E936C] mb-4 flex items-center gap-2">
                              <FaCalendarAlt /> {t('meeting_info_title')}
                            </h4>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Days</span>
                                <span className="font-bold text-gray-800">
                                  {Array.isArray(selectedGroup.meetingDays) ? selectedGroup.meetingDays.join(', ') : 'Not set'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Time</span>
                                <span className="font-bold text-gray-800">{selectedGroup.meetingTime || 'TBA'}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Venue</span>
                                <span className="font-bold text-gray-800">{selectedGroup.location || 'Church Grounds'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-[#F7FCF5] rounded-3xl border border-emerald-100">
                            <h4 className="font-black text-[#5E936C] mb-4 flex items-center gap-2">
                              <FaIdCard /> {t('group_leader_title')}
                            </h4>
                            {selectedGroup.leader ? (
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-[#5E936C] flex items-center justify-center text-white font-black text-xl shadow-lg">
                                  {(selectedGroup.leader?.name || '?').charAt(0)}
                                </div>
                                <div>
                                  <p className="font-black text-gray-800">{selectedGroup.leader.name}</p>
                                  <p className="text-xs text-gray-500">{selectedGroup.leader.email}</p>
                                  <p className="text-xs font-bold text-[#5E936C] mt-1">{selectedGroup.leader.phone}</p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4 bg-yellow-50 rounded-2xl border border-yellow-200 text-yellow-700 text-xs font-bold">
                                No leader assigned yet
                              </div>
                            )}
                          </div>
                        </div>
                      </PremiumCard>

                      {/* Participation Metrics */}
                      <PremiumCard className="p-10">
                        <h3 className="text-xl font-black mb-6 text-gray-800 flex items-center gap-2">
                          <BsGraphUp className="text-[#5E936C]" /> {t('participation_metrics')}
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            { label: 'Group Loyalty', val: selectedGroup.memberCount > 20 ? 'High' : 'Medium', color: 'text-green-500' },
                            { label: 'Stability', val: '92%', color: 'text-[#5E936C]' },
                            { label: 'Active Shares', val: '12', color: 'text-emerald-400' },
                            { label: 'Growth Rating', val: 'A+', color: 'text-blue-500' }
                          ].map((stat, i) => (
                            <div key={i} className="text-center space-y-1">
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
                              <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                            </div>
                          ))}
                        </div>
                      </PremiumCard>
                    </div>

                    {/* Right Column - Members & Actions */}
                    <div className="space-y-8">
                      <PremiumCard className="p-8">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="font-black text-gray-800">{t('members_view_title')}</h4>
                          <button
                            onClick={() => setActiveView('members')}
                            className="text-[#5E936C] text-sm font-bold hover:underline"
                          >
                            {t('view_all')}
                          </button>
                        </div>
                        <div className="space-y-4">
                          {detailsLoading ? (
                            <div className="animate-pulse space-y-4">
                              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-2xl"></div>)}
                            </div>
                          ) : groupMembers.length > 0 ? (
                            groupMembers.slice(0, 5).map((member: Member) => (
                              <div key={member.id} className="flex items-center gap-3 p-3 hover:bg-[#F7FCF5] rounded-2xl transition-all cursor-pointer group/member overflow-hidden">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-[#5E936C] font-bold shrink-0">
                                  {(member.name || '?').charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-gray-800 truncate">{member.name}</p>
                                  <p className="text-[10px] text-gray-500">{typeof member.street === 'object' && member.street !== null ? member.street.name : (member.street || 'No street info')}</p>
                                </div>
                                <div className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-1 rounded-full opacity-0 group-member-hover:opacity-100 transition-opacity">
                                  MEMBER
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-center py-8 text-gray-400 text-sm italic font-medium">No members found in registry.</p>
                          )}
                        </div>
                      </PremiumCard>

                      <div className="bg-gradient-to-br from-[#5E936C] to-emerald-800 rounded-[2rem] p-8 text-white shadow-xl space-y-6">
                        <h4 className="text-xl font-black">{t('group_actions')}</h4>
                        <div className="space-y-3">
                          <button
                            onClick={() => setIsBroadcasting(true)}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center gap-4 px-6 font-bold transition-all shadow-sm"
                          >
                            <FaBell /> {t('send_announcement_action')}
                          </button>
                          <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl flex items-center gap-4 px-6 font-bold transition-all shadow-sm">
                            <FaCalendarAlt /> {t('schedule_event_action')}
                          </button>
                          <button
                            onClick={() => { setIsAddingMember(true); setActiveView('members'); }}
                            className="w-full py-4 bg-white text-[#5E936C] rounded-2xl flex items-center gap-4 px-6 font-bold shadow-lg transition-all hover:scale-105"
                          >
                            <FaUserPlus /> {t('add_members_action')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'members' && selectedGroup && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 gap-4">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setActiveView('details')}
                        className="p-4 bg-emerald-50 text-[#5E936C] rounded-2xl hover:bg-[#5E936C] hover:text-white transition-all shadow-sm"
                      >
                        <FaArrowLeft />
                      </button>
                      <div>
                        <h2 className="text-2xl font-black text-gray-800">{selectedGroup.name} {t('registry')}</h2>
                        <p className="text-gray-500 font-bold">{selectedGroup.memberCount} {t('verified_members')}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAddingMember(!isAddingMember)}
                      className="px-8 py-4 bg-[#5E936C] text-white rounded-2xl font-black flex items-center gap-2 hover:bg-[#4a7a58] transition-all shadow-xl scale-105"
                    >
                      {isAddingMember ? <FaTimesCircle /> : <FaUserPlus />} {isAddingMember ? t('cancel') : t('add_member_btn')}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isAddingMember && (
                      <motion.div
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0 }}
                        className="bg-[#5E936C] p-8 rounded-[2.5rem] shadow-xl text-white origin-top"
                      >
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                          <div className="relative flex-1">
                            <FaSearch className="absolute left-6 top-5.5 text-emerald-900/50" />
                            <input
                              type="text"
                              placeholder="Type name or phone number..."
                              value={memberSearchQuery}
                              onChange={(e) => setMemberSearchQuery(e.target.value)}
                              className="w-full pl-16 pr-8 py-5 bg-white/20 backdrop-blur-md rounded-3xl border-2 border-white/20 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-white transition-all outline-none font-bold shadow-inner"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/30">
                          {membersLoading ? (
                            <p className="col-span-full text-center py-10 font-black animate-pulse">Scanning Congregation Registry...</p>
                          ) : allMembers.length > 0 ? (
                            allMembers.map((member: Member) => (
                              <div key={member.id} className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 transition-all flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-black">
                                  {(member.name || '?').charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-black truncate">{member.name}</p>
                                  <p className="text-xs text-white/60">{member.phone}</p>
                                </div>
                                <button
                                  onClick={() => handleAddMemberToGroup(member.id)}
                                  className="p-3 bg-white text-[#5E936C] rounded-xl hover:scale-110 transition-transform shadow-lg font-black"
                                >
                                  {t('enlist') || 'ADD'}
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="col-span-full text-center py-10 text-white/50 font-bold italic">No members match your search criteria.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <PremiumCard className="p-0 border-0 bg-transparent shadow-none">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white/40">
                      <div className="flex flex-col md:flex-row gap-6 mb-8">
                        <div className="relative flex-1">
                          <FaSearch className="absolute left-5 top-5 text-gray-400" />
                          <input
                            type="text"
                            placeholder={t('search_members_placeholder')}
                            className="w-full pl-14 pr-4 py-4.5 bg-gray-50/50 border-0 rounded-3xl focus:ring-2 focus:ring-[#5E936C] transition-all shadow-inner"
                          />
                        </div>
                        <div className="flex gap-4">
                          <button className="px-6 py-4.5 bg-white border border-gray-200 rounded-3xl flex items-center gap-2 font-bold text-gray-700 shadow-sm hover:bg-gray-50">
                            <FaFilter className="text-[#5E936C]" /> {t('filters') || 'Filter'}
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-3xl border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                          <thead className="bg-[#F7FCF5]">
                            <tr>
                              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">{t('contributor')}</th>
                              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">Contact Details</th>
                              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">{t('home_street')}</th>
                              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">{t('affiliation_date')}</th>
                              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">{t('engagement')}</th>
                              <th className="px-8 py-6 text-xs font-black uppercase tracking-widest text-gray-400">{t('operations')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {detailsLoading ? (
                              [1, 2, 3, 4].map(i => (
                                <tr key={i} className="animate-pulse">
                                  <td colSpan={6} className="px-8 py-6 h-20 bg-gray-50/50"></td>
                                </tr>
                              ))
                            ) : groupMembers.length > 0 ? (
                              groupMembers.map((member: Member) => (
                                <tr key={member.id} className="hover:bg-[#F7FCF5] transition-all group/row">
                                  <td className="px-8 py-6 whitespace-nowrap">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8FFD7] to-[#93DA97] flex items-center justify-center text-[#4A8C5F] font-black text-lg shadow-sm">
                                        {(member.name || '?').charAt(0)}
                                      </div>
                                      <div>
                                        <div className="font-black text-gray-800 text-base">{member.name}</div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-widest font-black">MEM-{member.id.substring(0, 5)}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="text-gray-700 font-bold text-sm">{member.email}</div>
                                    <div className="text-gray-500 text-xs font-medium">{member.phone}</div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <span className="px-4 py-1.5 bg-emerald-50 text-[#5E936C] text-xs font-black rounded-full border border-emerald-100">
                                      {typeof member.street === 'object' && member.street !== null ? member.street.name : (member.street || 'No street info')}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6 text-gray-500 font-bold text-sm">
                                    {member.joinDate ? new Date(member.joinDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                      <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `85%` }}
                                          className="bg-gradient-to-r from-emerald-400 to-green-500 h-full rounded-full"
                                        ></motion.div>
                                      </div>
                                      <span className="font-black text-[#5E936C] text-sm">85%</span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-6">
                                    <div className="flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleRemoveMember(member.id)}
                                        className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-medium italic">
                                  Your registry is empty. Use the "Add Member" button to enlist congregation members.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </PremiumCard>
                </motion.div>
              )}

              {activeView === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                    <button
                      onClick={() => setActiveView('overview')}
                      className="p-4 bg-emerald-50 text-[#5E936C] rounded-2xl hover:bg-[#5E936C] hover:text-white transition-all shadow-sm"
                    >
                      <FaArrowLeft />
                    </button>
                    <h2 className="text-2xl font-black text-gray-800">Ministry Analytics Dashboard</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categories.filter(c => c.id !== 'all').map(cat => {
                      const count = groups.filter(g => g.category === cat.id).length;
                      return (
                        <PremiumCard key={cat.id} className="p-8 text-center space-y-4">
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${cat.gradient} text-white flex items-center justify-center mx-auto text-2xl shadow-lg`}>
                            {cat.icon}
                          </div>
                          <div>
                            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{cat.name}</p>
                            <h3 className="text-3xl font-black text-gray-800">{count}</h3>
                          </div>
                        </PremiumCard>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <PremiumCard className="p-10">
                      <h3 className="text-xl font-black mb-8">Member Distribution</h3>
                      <div className="space-y-6">
                        {categories.filter(c => c.id !== 'all').map(cat => {
                          const totalMembers = groups.reduce((acc, g) => acc + (g.memberCount || 0), 0);
                          const catMembers = groups.filter(g => g.category === cat.id).reduce((acc, g) => acc + (g.memberCount || 0), 0);
                          const percent = totalMembers > 0 ? (catMembers / totalMembers) * 100 : 0;
                          return (
                            <div key={cat.id} className="space-y-2">
                              <div className="flex justify-between items-center text-sm font-black">
                                <span className="text-gray-700">{cat.name}</span>
                                <span className="text-[#5E936C]">{catMembers} members ({percent.toFixed(0)}%)</span>
                              </div>
                              <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 shadow-inner">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${percent}%` }}
                                  className={`h-full bg-gradient-to-r ${cat.gradient} rounded-full`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </PremiumCard>

                    <PremiumCard className="p-10 bg-gradient-to-br from-[#5E936C] to-emerald-800 text-white border-0 shadow-2xl">
                      <h3 className="text-xl font-black mb-8">Participation Insight</h3>
                      <div className="flex flex-col items-center justify-center py-10 space-y-6">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="96" cy="96" r="80" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                            <motion.circle
                              cx="96" cy="96" r="80" stroke="white" strokeWidth="12" fill="none"
                              strokeDasharray="502.6"
                              initial={{ strokeDashoffset: 502.6 }}
                              animate={{ strokeDashoffset: 502.6 * (1 - 0.88) }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-4xl font-black">88%</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Engagement</span>
                          </div>
                        </div>
                        <p className="text-center text-white/80 font-light leading-relaxed">
                          Congregational engagement has increased by <span className="font-black text-white">12.4%</span> since the last spiritual quarter. Keep fostering community growth!
                        </p>
                      </div>
                    </PremiumCard>
                  </div>
                </motion.div>
              )}

              {activeView === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-br from-[#5E936C] to-emerald-800 p-12 text-white">
                      <h2 className="text-4xl font-black mb-4">
                        {selectedGroup ? t('edit_group_title') : t('new_community')}
                      </h2>
                      <p className="text-white/70 text-lg">
                        {selectedGroup ? 'Update the details of your group to keep them in sync with current activities.' : 'Create a new group to foster fellowship and spiritual growth.'}
                      </p>
                    </div>

                    <form onSubmit={handleSaveGroup} className="p-12 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-[#5E936C]">{t('ministry_identity')}</label>
                          <input
                            type="text"
                            className="w-full p-4.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5E936C]/10 focus:border-[#5E936C] transition-all outline-none font-bold text-gray-800"
                            placeholder="e.g., Higher Frequency Choir"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-[#5E936C]">{t('ministry_classification')}</label>
                          <select
                            className="w-full p-4.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5E936C]/10 focus:border-[#5E936C] transition-all outline-none font-bold text-gray-800"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          >
                            <option value="choir">Music Ministry / Choirs</option>
                            <option value="focus-group">Focus & Growth Councils</option>
                            <option value="youth">Youth & Emerging Leaders</option>
                            <option value="prayer">Intercessory Prayer</option>
                            <option value="other">General Community</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-[#5E936C]">{t('vision_purpose')}</label>
                        <textarea
                          rows={3}
                          className="w-full p-4.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5E936C]/10 focus:border-[#5E936C] transition-all outline-none font-bold text-gray-800 leading-relaxed"
                          placeholder="Define the group's objectives and spiritual goals..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-[#5E936C]">{t('appointed_overseer')}</label>
                          <select
                            className="w-full p-4.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5E936C]/10 focus:border-[#5E936C] transition-all outline-none font-bold text-gray-800"
                            value={formData.leaderId}
                            onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                          >
                            <option value="">{t('select_leader')}</option>
                            {allMembers.map((member: any) => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                          {membersLoading && <p className="text-[10px] text-gray-400 animate-pulse">Establishing registry connection...</p>}
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-[#5E936C]">{t('sanctuary_venue')}</label>
                          <input
                            type="text"
                            className="w-full p-4.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5E936C]/10 focus:border-[#5E936C] transition-all outline-none font-bold text-gray-800"
                            placeholder="e.g., Fellowship Wing B"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-[#5E936C]">{t('recurrent_days')}</label>
                          <div className="grid grid-cols-3 gap-3">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                              <label
                                key={day}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${formData.meetingDays.includes(day)
                                  ? 'bg-emerald-50 border-[#5E936C] text-[#5E936C]'
                                  : 'bg-white border-gray-100 grayscale hover:grayscale-0'
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={formData.meetingDays.includes(day)}
                                  onChange={(e) => {
                                    const newDays = e.target.checked
                                      ? [...formData.meetingDays, day]
                                      : formData.meetingDays.filter(d => d !== day);
                                    setFormData({ ...formData, meetingDays: newDays });
                                  }}
                                />
                                <span className="text-[10px] font-black uppercase">{day.substring(0, 3)}</span>
                                {formData.meetingDays.includes(day) && <FaCheckCircle className="mt-1" />}
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-black uppercase tracking-widest text-[#5E936C]">{t('assembly_timestamp')}</label>
                          <input
                            type="time"
                            className="w-full p-4.5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-[#5E936C]/10 focus:border-[#5E936C] transition-all outline-none font-black text-gray-800"
                            value={formData.meetingTime || ''}
                            onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                          />
                          <div className="flex items-center gap-3 pt-6">
                            <input
                              type="checkbox"
                              id="isActive"
                              className="w-6 h-6 rounded-lg border-2 border-gray-200 text-[#5E936C] focus:ring-[#5E936C]"
                              checked={formData.isActive}
                              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            <label htmlFor="isActive" className="text-sm font-bold text-gray-700">{t('active_community_toggle')}</label>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-6 pt-10 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setActiveView('overview')}
                          className="px-8 py-4.5 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          type="submit"
                          className="px-12 py-4.5 bg-[#5E936C] text-white rounded-2xl font-black shadow-xl hover:bg-[#4a7a58] transition-all hover:scale-105 disabled:opacity-50"
                        >
                          {selectedGroup ? t('synchronize_data') : t('establish_ministry')}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Broadcast Modal */}
            <AnimatePresence>
              {isBroadcasting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsBroadcasting(false)}
                    className="absolute inset-0 bg-[#0a200f]/60 backdrop-blur-md"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden"
                  >
                    <div className="bg-gradient-to-br from-[#5E936C] to-emerald-800 p-8 text-white">
                      <div className="flex justify-between items-start">
                        <div className="p-4 bg-white/20 rounded-2xl">
                          <FaBell size={24} />
                        </div>
                        <button onClick={() => setIsBroadcasting(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                          <FaTimesCircle size={24} />
                        </button>
                      </div>
                      <h3 className="text-3xl font-black mt-6">Broadcast Message</h3>
                      <p className="text-white/70 font-medium">Sending to all members of <span className="text-white font-black">{selectedGroup?.name}</span></p>
                    </div>
                    <div className="p-10 space-y-6">
                      <textarea
                        rows={5}
                        placeholder="Type your spiritual encouragement or announcement here..."
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl focus:ring-4 focus:ring-[#5E936C]/10 focus:border-[#5E936C] transition-all outline-none font-bold text-gray-800 leading-relaxed"
                      />
                      <div className="flex gap-4">
                        <button
                          disabled={!broadcastMessage.trim()}
                          onClick={handleBroadcastingSubmit}
                          className="flex-1 py-5 bg-[#5E936C] text-white rounded-[2rem] font-black shadow-xl hover:bg-[#4a7a58] transition-all disabled:opacity-50"
                        >
                          Send Broadcast
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </main>
        </div>
      </div>
    );
  } catch (err: any) {
    console.error("Critical crash in GroupManagement:", err);
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mb-8">
          <FaTimesCircle />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-4">Management Console Error</h1>
        <p className="text-gray-500 max-w-md mb-8">We encountered a critical error while rendering the management interface. This usually happens due to inconsistent data from the server.</p>
        <div className="bg-gray-50 p-6 rounded-2xl text-left font-mono text-xs text-red-600 mb-8 w-full max-w-lg overflow-auto">
          {err.message}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-[#5E936C] text-white rounded-2xl font-black shadow-lg hover:bg-[#4a7a58] transition-all"
        >
          Reload Dashboard
        </button>
      </div>
    );
  }
};

export default GroupsManagement;
// Revision note [2026-07-20 09:22:37 +0300]: Enhance church leader photo preview component

// Revision note [2026-08-03 14:21:32 +0300]: Refactor offering entry table structure

// Activity update [2026-07-17 18:41:04 +0300]: Enhance church leader photo preview component

// Activity update [2026-07-27 21:35:06 +0300]: Update user profile settings modal form
