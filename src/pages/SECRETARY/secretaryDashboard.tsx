import React, { useState, useEffect } from 'react';
import { 
  FaUserPlus, FaCalendarCheck, FaMoneyBillWave, FaBell, 
  FaEnvelope, FaSearch, FaBolt, FaFilter, FaDownload, FaChartLine,
  FaUsers, FaChurch, FaPrayingHands, FaFileAlt, FaCog,
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSync,
  FaPaperPlane, FaDatabase, FaShieldAlt, FaUserFriends,
  FaArrowUp, FaArrowDown, FaEye, FaEdit, FaTrash,
  FaPlus, FaHistory, FaChartBar, FaReceipt, FaQrcode
} from 'react-icons/fa';
import { GiCrossedChains } from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, isThisWeek, differenceInDays } from 'date-fns';
import { useQuery } from '@apollo/client';
import { GET_SECRETARY_DASHBOARD } from '../../api/queries';

// Types
interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate: string;
  assignedTo: string;
  category: 'membership' | 'finance' | 'events' | 'communication' | 'administration';
}

interface MemberRequest {
  id: string;
  memberName: string;
  requestType: 'card-issue' | 'profile-update' | 'group-join' | 'prayer-request' | 'other';
  status: 'new' | 'processing' | 'completed';
  submittedDate: string;
  urgency: 'normal' | 'urgent';
  details: string;
}

interface QuickStat {
  title: string;
  value: number;
  change: number;
  icon?: JSX.Element;
  color?: string;
  trend: 'up' | 'down';
}

interface SecretaryDashboardData {
  secretaryTasks: Task[];
  memberRequests: MemberRequest[];
  secretaryQuickStats: { title: string; value: number; change: number; trend: 'up' | 'down' }[];
  secretaryActivity: { action: string; user: string; time: string; type: 'success' | 'warning' | 'info' }[];
}

const SecretaryDashboard = () => {
  const [activeView, setActiveView] = useState<'overview' | 'tasks' | 'requests' | 'reports'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');

  const { data, loading, error, refetch } = useQuery<SecretaryDashboardData>(GET_SECRETARY_DASHBOARD, {
    variables: { taskTimeFilter: timeFilter },
    fetchPolicy: 'network-only',
  });

  // Data from API
  const tasks: Task[] = data?.secretaryTasks || [];

  const memberRequests: MemberRequest[] = data?.memberRequests || [];

  const quickStats: QuickStat[] = (data?.secretaryQuickStats || []).map((s) => ({
    title: s.title,
    value: s.value,
    change: s.change,
    trend: s.trend,
  }));

  // Filter tasks based on current view
  const filteredTasks = tasks.filter(task => {
    if (!task.dueDate) return true;
    if (timeFilter === 'today') {
      return isToday(parseISO(task.dueDate));
    } else if (timeFilter === 'week') {
      return isThisWeek(parseISO(task.dueDate));
    }
    return true;
  });

  const pendingTasks = filteredTasks.filter(task => task.status !== 'completed');
  const urgentTasks = filteredTasks.filter(task => task.priority === 'urgent');
  const newRequests = memberRequests.filter(req => req.status === 'new');

  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    completionRate: tasks.length ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8FFD7] via-white to-[#E8FFD7]">
      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white/70 backdrop-blur-md border border-[#CFECC2] rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-[#2D3748]">Secretary Workspace</h2>
                <p className="text-gray-600 mt-1">Monitor requests, manage tasks, and generate reports.</p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center gap-2">
                <button onClick={() => setQuickActionsOpen(true)} className="inline-flex items-center gap-2 bg-[#5E936C] text-white px-4 py-2 rounded-lg hover:bg-[#4A7557]">
                  <FaPlus /> New Action
                </button>
                <button onClick={() => refetch()} className="inline-flex items-center gap-2 bg-white text-[#2D3748] px-4 py-2 rounded-lg border hover:bg-[#F7FFF0]">
                  <FaSync /> Refresh
                </button>
              </div>
            </div>
            {/* Tabs */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'tasks', label: 'Tasks' },
                { key: 'requests', label: 'Requests' },
                { key: 'reports', label: 'Reports' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveView(tab.key as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    activeView === (tab.key as any)
                      ? 'bg-[#5E936C] text-white border-[#5E936C]'
                      : 'bg-white text-[#2D3748] border-[#CFECC2] hover:bg-[#F7FFF0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              {/* Time filter chips */}
              <div className="ml-auto flex items-center gap-2">
                {(['today','week','month'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(tf)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      timeFilter === tf ? 'bg-[#5E936C] text-white border-[#5E936C]' : 'bg-white text-[#2D3748] border-[#CFECC2]'
                    }`}
                  >{tf.toUpperCase()}</button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Loading / Empty States for Stats */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 shadow animate-pulse" />
              ))}
            </div>
          ) : quickStats.length === 0 ? (
            <div className="mb-8 p-6 bg-white rounded-2xl border text-center text-gray-500">No stats yet.</div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {quickStats.map((stat) => (
                <motion.div
                  key={stat.title}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-[#5E936C] text-white`}>
                      <FaChartBar className="text-2xl" />
                    </div>
                    <div className={`flex items-center space-x-1 text-sm font-semibold ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                      <span>{Math.abs(stat.change)}%</span>
                    </div>
                  </div>
                  <h3 className="text-gray-600 text-sm font-medium mb-2">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-[#5E936C]`}
                      style={{ width: `${Math.min(stat.value * 10, 100)}%` }}
                    ></div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Views */}
          {activeView === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Tasks & Activities */}
            <div className="lg:col-span-2 space-y-8">
              {/* Urgent Tasks */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="bg-[#5E936C] p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <FaExclamationTriangle className="mr-3" />
                      Urgent Tasks
                    </h3>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                      {urgentTasks.length} items
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {(loading ? [] : urgentTasks).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-[#E8FFD7] border border-[#CFECC2] rounded-xl"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-3 h-3 bg-[#5E936C] rounded-full animate-pulse"></div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#5E936C]">
                            Due {task.dueDate ? format(parseISO(task.dueDate), 'MMM dd') : 'N/A'}
                          </p>
                          <button className="text-[#5E936C] hover:text-[#4A7557] text-sm font-medium">
                            Take Action
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {(!loading && urgentTasks.length === 0) && (
                      <div className="text-center text-gray-500">No urgent tasks.</div>
                    )}
                    {loading && (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Recent Member Requests */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
              >
                <div className="bg-[#5E936C] p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center">
                      <FaUserPlus className="mr-3" />
                      Member Requests
                    </h3>
                    <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                      {newRequests.length} new
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {(loading ? [] : memberRequests.slice(0, 4)).map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-[#5E936C] transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            request.status === 'new' ? 'bg-[#E8FFD7] text-[#5E936C]' :
                            request.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {request.requestType === 'card-issue' && <FaReceipt />}
                            {request.requestType === 'profile-update' && <FaUserFriends />}
                            {request.requestType === 'group-join' && <FaUsers />}
                            {request.requestType === 'prayer-request' && <FaPrayingHands />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{request.memberName}</h4>
                            <p className="text-sm text-gray-600 capitalize">
                              {request.requestType.replace('-', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(request.submittedDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            request.urgency === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {request.urgency}
                          </span>
                          <button className="block mt-2 text-[#5E936C] hover:text-[#4A7557] text-sm font-medium">
                            Review
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {(!loading && memberRequests.length === 0) && (
                      <div className="text-center text-gray-500">No member requests.</div>
                    )}
                    {loading && (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Quick Actions & Analytics */}
            <div className="space-y-8">
              {/* Quick Actions Panel */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <h3 className="text-lg font-bold text-[#2D3748] mb-4 flex items-center">
                  <FaBolt className="mr-2 text-[#5E936C]" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: FaUserPlus, label: 'Add Member', color: 'bg-[#5E936C]' },
                    { icon: FaMoneyBillWave, label: 'Record Offering', color: 'bg-[#4A7557]' },
                    { icon: FaCalendarCheck, label: 'Schedule Event', color: 'bg-[#5E936C]' },
                    { icon: FaFileAlt, label: 'Generate Report', color: 'bg-[#4A7557]' },
                    { icon: FaPaperPlane, label: 'Send Announcement', color: 'bg-[#5E936C]' },
                    { icon: FaQrcode, label: 'Print Cards', color: 'bg-[#4A7557]' }
                  ].map((action, index) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`${action.color} text-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center space-y-2`}
                    >
                      <action.icon className="text-xl" />
                      <span className="text-sm font-medium text-center">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Task Progress */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <h3 className="text-lg font-bold text-[#2D3748] mb-4 flex items-center">
                  <FaChartLine className="mr-2 text-[#5E936C]" />
                  Task Progress
                </h3>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg className="w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="60"
                          stroke="#5E936C"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray="377"
                          strokeDashoffset={377 - (377 * taskStats.completionRate) / 100}
                          transform="rotate(-90 64 64)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-800">{taskStats.completionRate}%</span>
                      </div>
                    </div>
                    <p className="text-gray-600 mt-2">Overall Completion</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-[#5E936C]">{taskStats.total}</p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#5E936C]">{taskStats.completed}</p>
                      <p className="text-sm text-gray-600">Done</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{taskStats.overdue}</p>
                      <p className="text-sm text-gray-600">Overdue</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Upcoming Deadlines */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <h3 className="text-lg font-bold text-[#2D3748] mb-4 flex items-center">
                  <FaClock className="mr-2 text-[#5E936C]" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-3">
                  {tasks
                    .filter(task => task.status !== 'completed')
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 3)
                    .map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-gray-800 text-sm">{task.title}</h4>
                          <p className="text-xs text-gray-600">
                            Due {task.dueDate ? format(parseISO(task.dueDate), 'MMM dd') : 'N/A'}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {task.priority}
                        </span>
                      </motion.div>
                    ))}
                  {(!loading && tasks.filter(t => t.status !== 'completed').length === 0) && (
                    <div className="text-center text-gray-500">No upcoming deadlines.</div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
          )}

          {activeView === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative max-w-sm w-full">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search tasks..." className="pl-9 pr-3 py-2 w-full bg-white border border-[#CFECC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E936C]" />
                </div>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="divide-y">
                  {(loading ? [] : tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))).map((t)=> (
                    <div key={t.id} className="p-4 flex items-center justify-between hover:bg-[#F7FFF0]">
                      <div>
                        <div className="font-semibold text-[#2D3748]">{t.title}</div>
                        <div className="text-sm text-gray-600">{t.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{t.priority}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{t.status}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{t.dueDate ? format(parseISO(t.dueDate),'MMM dd') : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                  {loading && Array.from({length:5}).map((_,i)=>(<div key={i} className="p-4 h-14 bg-gray-50 animate-pulse" />))}
                  {(!loading && tasks.length===0) && (<div className="p-6 text-center text-gray-500">No tasks found.</div>)}
                </div>
              </div>
            </div>
          )}

          {activeView === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative max-w-sm w-full">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Search requests..." className="pl-9 pr-3 py-2 w-full bg-white border border-[#CFECC2] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5E936C]" />
                </div>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="divide-y">
                  {(loading ? [] : memberRequests.filter(r => (r.memberName + ' ' + r.requestType + ' ' + r.details).toLowerCase().includes(searchQuery.toLowerCase()))).map((r)=> (
                    <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[#F7FFF0]">
                      <div>
                        <div className="font-semibold text-[#2D3748]">{r.memberName}</div>
                        <div className="text-sm text-gray-600 capitalize">{r.requestType.replace('-', ' ')} • {r.details}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{r.status}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{format(parseISO(r.submittedDate),'MMM dd, yyyy')}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${r.urgency==='urgent'?'bg-red-100 text-red-800':'bg-gray-100 text-gray-700'}`}>{r.urgency}</span>
                      </div>
                    </div>
                  ))}
                  {loading && Array.from({length:5}).map((_,i)=>(<div key={i} className="p-4 h-14 bg-gray-50 animate-pulse" />))}
                  {(!loading && memberRequests.length===0) && (<div className="p-6 text-center text-gray-500">No requests found.</div>)}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity Timeline */}
          {activeView === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <h3 className="text-lg font-bold text-[#2D3748] mb-6 flex items-center">
              <FaHistory className="mr-2 text-[#5E936C]" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {(data?.secretaryActivity || []).map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'success' ? 'bg-green-500' :
                    activity.type === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-600">by {activity.user}</p>
                  </div>
                  <span className="text-sm text-gray-500">{activity.time}</span>
                </motion.div>
              ))}
              {!loading && (!data?.secretaryActivity || data.secretaryActivity.length === 0) && (
                <div className="text-center text-gray-500">No recent activity.</div>
              )}
            </div>
          </motion.div>
          )}
        </div>
      </div>

      {/* Floating Quick Actions Menu */}
      <AnimatePresence>
        {quickActionsOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80">
              <h4 className="font-bold text-[#2D3748] mb-4">Quick Actions</h4>
              <div className="space-y-2">
                {[
                  { icon: FaUserPlus, label: 'New Member', action: () => console.log('Add member') },
                  { icon: FaMoneyBillWave, label: 'Quick Offering', action: () => console.log('Record offering') },
                  { icon: FaPaperPlane, label: 'Send Message', action: () => console.log('Send message') },
                  { icon: FaFileAlt, label: 'Quick Report', action: () => console.log('Generate report') },
                  { icon: FaSync, label: 'Sync Data', action: () => console.log('Sync data') }
                ].map((item, index) => (
                  <motion.button
                    key={item.label}
                    whileHover={{ x: 5 }}
                    onClick={item.action}
                    className="w-full text-left p-3 hover:bg-[#E8FFD7] rounded-lg transition-colors flex items-center space-x-3"
                  >
                    <item.icon className="text-[#5E936C]" />
                    <span className="text-[#2D3748]">{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#CFECC2] rounded-full blur-3xl opacity-40"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#CFECC2] rounded-full blur-3xl opacity-40"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#E8FFD7] rounded-full blur-3xl opacity-30"></div>
      </div>
    </div>
  );
};

export default SecretaryDashboard;