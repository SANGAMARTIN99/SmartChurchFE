import React, { useState, useEffect, useRef } from 'react';
import { 
  FaMoneyBillWave, FaSearch, FaUser, FaQrcode, FaCamera, 
  FaPlus, FaTrash, FaSave, FaPrint, FaHistory, FaChartLine,
  FaClock, FaCheckCircle, FaExclamationTriangle, FaSync,
  FaExpand, FaCompress, FaKeyboard, FaMouse, FaMagic,
  FaBolt, FaRocket, FaStar, FaCog, FaDatabase
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

// Types
interface Member {
  id: string;
  fullName: string;
  cardNumber: string;
  street: string;
  phone: string;
  pledgedAmount: number;
  profileImage?: string;
}

interface OfferingEntry {
  id: string;
  memberId: string;
  amount: number;
  type: 'tithe' | 'special' | 'general' | 'pledge';
  massType: 'sunday' | 'morning-glory' | 'evening-glory' | 'seli' | 'other';
  date: string;
  time: string;
  attendant: string;
  notes: string;
}

interface QuickAmount {
  label: string;
  amount: number;
  color: string;
}

const OfferingsEntryPage = () => {
  // State management
  const [currentEntry, setCurrentEntry] = useState<Partial<OfferingEntry>>({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: format(new Date(), 'HH:mm'),
    type: 'tithe',
    massType: 'sunday',
    attendant: 'Secretary'
  });
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [quickAmounts, setQuickAmounts] = useState<QuickAmount[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [entryHistory, setEntryHistory] = useState<OfferingEntry[]>([]);
  const [useDarkMode, setUseDarkMode] = useState(false);
  const [efficiencyMode, setEfficiencyMode] = useState(true);

  // Refs
  const amountInputRef = useRef<HTMLInputElement>(null);
  const cardNumberInputRef = useRef<HTMLInputElement>(null);

  // Sample data
  const sampleMembers: Member[] = [
    {
      id: '1',
      fullName: 'John Mwambene',
      cardNumber: 'BN-001',
      street: 'Bondeni',
      phone: '+255 123 456 789',
      pledgedAmount: 50000
    },
    {
      id: '2',
      fullName: 'Sarah Kileo',
      cardNumber: 'PR-015',
      street: 'Paradiso',
      phone: '+255 987 654 321',
      pledgedAmount: 35000
    },
    {
      id: '3',
      fullName: 'Michael Ngowi',
      cardNumber: 'HZ-008',
      street: 'Hazina',
      phone: '+255 789 123 456',
      pledgedAmount: 75000
    },
    {
      id: '4',
      fullName: 'Grace Mbowe',
      cardNumber: 'BW-012',
      street: 'Bwawani',
      phone: '+255 654 321 987',
      pledgedAmount: 25000
    },
    {
      id: '5',
      fullName: 'Elias Mfinanga',
      cardNumber: 'ZH-006',
      street: 'Zahanati',
      phone: '+255 321 789 654',
      pledgedAmount: 45000
    }
  ];

  // Initialize quick amounts based on common offering patterns
  useEffect(() => {
    setQuickAmounts([
      { label: '5,000', amount: 5000, color: 'from-green-400 to-emerald-500' },
      { label: '10,000', amount: 10000, color: 'from-blue-400 to-cyan-500' },
      { label: '20,000', amount: 20000, color: 'from-purple-400 to-pink-500' },
      { label: '50,000', amount: 50000, color: 'from-orange-400 to-red-500' },
      { label: 'Pledge', amount: 0, color: 'from-indigo-400 to-blue-500' }
    ]);

    // Load recent members from localStorage or use sample data
    setRecentMembers(sampleMembers.slice(0, 3));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setCurrentEntry(prev => ({ ...prev, type: 'tithe' }));
            break;
          case '2':
            e.preventDefault();
            setCurrentEntry(prev => ({ ...prev, type: 'special' }));
            break;
          case '3':
            e.preventDefault();
            setCurrentEntry(prev => ({ ...prev, type: 'general' }));
            break;
          case '4':
            e.preventDefault();
            setCurrentEntry(prev => ({ ...prev, type: 'pledge' }));
            break;
          case 's':
            e.preventDefault();
            handleSaveOffering();
            break;
          case 'n':
            e.preventDefault();
            handleNewEntry();
            break;
        }
      }

      // Number keys for quick amounts
      if (!e.ctrlKey && !e.metaKey && e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1;
        if (quickAmounts[index]) {
          handleQuickAmount(quickAmounts[index].amount);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [quickAmounts]);

  // Handlers
  const handleCardNumberChange = (cardNumber: string) => {
    const member = sampleMembers.find(m => m.cardNumber === cardNumber);
    setSelectedMember(member || null);
    
    if (member) {
      // Auto-focus amount input when member is found
      setTimeout(() => amountInputRef.current?.focus(), 100);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setCurrentEntry(prev => ({ ...prev, amount }));
    if (amountInputRef.current) {
      amountInputRef.current.value = amount.toString();
    }
  };

  const handleSaveOffering = async () => {
    if (!selectedMember || !currentEntry.amount) {
      alert('Please select a member and enter amount');
      return;
    }

    setIsProcessing(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const newEntry: OfferingEntry = {
      id: Date.now().toString(),
      memberId: selectedMember.id,
      amount: currentEntry.amount!,
      type: currentEntry.type!,
      massType: currentEntry.massType!,
      date: currentEntry.date!,
      time: currentEntry.time!,
      attendant: currentEntry.attendant!,
      notes: currentEntry.notes || ''
    };

    setEntryHistory(prev => [newEntry, ...prev]);
    
    // Add to recent members if not already there
    if (!recentMembers.some(m => m.id === selectedMember.id)) {
      setRecentMembers(prev => [selectedMember, ...prev.slice(0, 2)]);
    }

    // Reset for next entry
    handleNewEntry();
    setIsProcessing(false);
  };

  const handleNewEntry = () => {
    setSelectedMember(null);
    setCurrentEntry({
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      type: 'tithe',
      massType: 'sunday',
      attendant: 'Secretary'
    });
    if (cardNumberInputRef.current) {
      cardNumberInputRef.current.value = '';
      cardNumberInputRef.current.focus();
    }
    if (amountInputRef.current) {
      amountInputRef.current.value = '';
    }
  };

  const handleScanQR = () => {
    setShowScanner(true);
    // Simulate QR scanning
    setTimeout(() => {
      const randomMember = sampleMembers[Math.floor(Math.random() * sampleMembers.length)];
      setSelectedMember(randomMember);
      if (cardNumberInputRef.current) {
        cardNumberInputRef.current.value = randomMember.cardNumber;
      }
      setShowScanner(false);
      amountInputRef.current?.focus();
    }, 1500);
  };

  // Calculate today's summary
  const todaysSummary = entryHistory.filter(entry => 
    entry.date === format(new Date(), 'yyyy-MM-dd')
  ).reduce((acc, entry) => ({
    count: acc.count + 1,
    total: acc.total + entry.amount
  }), { count: 0, total: 0 });

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      useDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-[#E8FFD7] via-[#93DA97] to-[#5E936C]'
    }`}>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#5E936C] via-[#93DA97] to-[#E8FFD7] bg-clip-text text-transparent mb-4">
            Quick Offerings Entry
          </h1>
          <p className={`text-lg ${useDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Streamlined offering recording with maximum efficiency
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Entry Panel - 3/4 width */}
          <div className="xl:col-span-3 space-y-6">
            {/* Efficiency Stats Bar */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl p-4 ${
                useDarkMode ? 'bg-gray-800/50' : 'bg-white/80'
              } backdrop-blur-sm border ${
                useDarkMode ? 'border-gray-700' : 'border-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${
                    useDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <FaBolt className="text-green-500" />
                  </div>
                  <div>
                    <p className={`text-sm ${useDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Today's Efficiency
                    </p>
                    <p className="text-xl font-bold text-green-500">
                      {todaysSummary.count} entries • {todaysSummary.total.toLocaleString()} TZS
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setEfficiencyMode(!efficiencyMode)}
                    className={`p-2 rounded-lg ${
                      efficiencyMode 
                        ? 'bg-green-500 text-white' 
                        : useDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    <FaRocket />
                  </button>
                  <button
                    onClick={() => setUseDarkMode(!useDarkMode)}
                    className={`p-2 rounded-lg ${
                      useDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {useDarkMode ? <FaExpand /> : <FaCompress />}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Main Entry Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl shadow-2xl ${
                useDarkMode ? 'bg-gray-800' : 'bg-white'
              } border ${
                useDarkMode ? 'border-gray-700' : 'border-gray-200'
              } overflow-hidden`}
            >
              <div className="bg-gradient-to-r from-[#5E936C] to-[#93DA97] p-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <FaMoneyBillWave className="mr-3" />
                  New Offering Entry
                </h2>
                <p className="text-white/80">Fill details below or use quick entry methods</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Member Selection */}
                  <div className="space-y-6">
                    {/* Card Number Input with Scanner */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        useDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Member Card Number
                      </label>
                      <div className="flex space-x-3">
                        <div className="flex-1 relative">
                          <input
                            ref={cardNumberInputRef}
                            type="text"
                            placeholder="Enter card number (e.g., BN-001)"
                            onChange={(e) => handleCardNumberChange(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-[#5E936C] transition-all ${
                              useDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-800'
                            }`}
                          />
                          <FaUser className={`absolute left-3 top-3.5 ${
                            useDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleScanQR}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-3 rounded-xl shadow-lg"
                        >
                          {showScanner ? <FaSync className="animate-spin" /> : <FaQrcode />}
                        </motion.button>
                      </div>
                    </div>

                    {/* Member Info Display */}
                    <AnimatePresence>
                      {selectedMember && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`p-4 rounded-xl border-2 ${
                            useDarkMode 
                              ? 'bg-gray-700/50 border-green-500/30' 
                              : 'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-[#5E936C] to-[#93DA97] rounded-full flex items-center justify-center text-white font-bold">
                              {selectedMember.fullName.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-800">{selectedMember.fullName}</h3>
                              <p className={`text-sm ${
                                useDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {selectedMember.street} • {selectedMember.phone}
                              </p>
                              <p className="text-xs text-green-600 font-medium">
                                Pledge: {selectedMember.pledgedAmount.toLocaleString()} TZS
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Quick Amount Buttons */}
                    <div>
                      <label className={`block text-sm font-medium mb-3 ${
                        useDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Quick Amounts
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {quickAmounts.map((quickAmount, index) => (
                          <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleQuickAmount(quickAmount.amount)}
                            className={`bg-gradient-to-r ${quickAmount.color} text-white py-3 rounded-xl font-semibold shadow-lg relative overflow-hidden group`}
                          >
                            <span className="relative z-10">{quickAmount.label}</span>
                            <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                            <div className="absolute top-1 right-1 text-xs opacity-60">
                              {index + 1}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Amount & Details */}
                  <div className="space-y-6">
                    {/* Amount Input */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        useDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Offering Amount (TZS)
                      </label>
                      <div className="relative">
                        <input
                          ref={amountInputRef}
                          type="number"
                          placeholder="Enter amount"
                          onChange={(e) => setCurrentEntry(prev => ({ 
                            ...prev, 
                            amount: parseFloat(e.target.value) 
                          }))}
                          className={`w-full pl-4 pr-20 py-3 rounded-xl border-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#5E936C] ${
                            useDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                        <span className={`absolute right-4 top-3 text-lg ${
                          useDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          TZS
                        </span>
                      </div>
                    </div>

                    {/* Offering Type Quick Select */}
                    <div>
                      <label className={`block text-sm font-medium mb-3 ${
                        useDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Offering Type
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { type: 'tithe', label: 'Tithe', color: 'from-green-500 to-emerald-500', shortcut: '1' },
                          { type: 'special', label: 'Special', color: 'from-blue-500 to-cyan-500', shortcut: '2' },
                          { type: 'general', label: 'General', color: 'from-purple-500 to-pink-500', shortcut: '3' },
                          { type: 'pledge', label: 'Pledge', color: 'from-orange-500 to-red-500', shortcut: '4' }
                        ].map((offeringType) => (
                          <motion.button
                            key={offeringType.type}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setCurrentEntry(prev => ({ ...prev, type: offeringType.type as any }))}
                            className={`relative overflow-hidden rounded-xl p-3 text-white font-semibold ${
                              currentEntry.type === offeringType.type 
                                ? `bg-gradient-to-r ${offeringType.color} shadow-lg`
                                : useDarkMode 
                                  ? 'bg-gray-700 text-gray-300' 
                                  : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            <span className="relative z-10">{offeringType.label}</span>
                            <div className="absolute top-1 right-1 text-xs opacity-60">
                              Ctrl+{offeringType.shortcut}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Mass Type & Additional Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          useDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Mass Type
                        </label>
                        <select
                          value={currentEntry.massType}
                          onChange={(e) => setCurrentEntry(prev => ({ 
                            ...prev, 
                            massType: e.target.value as any 
                          }))}
                          className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5E936C] ${
                            useDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        >
                          <option value="sunday">Sunday Service</option>
                          <option value="morning-glory">Morning Glory</option>
                          <option value="evening-glory">Evening Glory</option>
                          <option value="seli">SELI Mass</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          useDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Attendant
                        </label>
                        <input
                          type="text"
                          value={currentEntry.attendant}
                          onChange={(e) => setCurrentEntry(prev => ({ ...prev, attendant: e.target.value }))}
                          className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#5E936C] ${
                            useDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-800'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveOffering}
                        disabled={!selectedMember || !currentEntry.amount || isProcessing}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isProcessing ? (
                          <FaSync className="animate-spin" />
                        ) : (
                          <FaSave />
                        )}
                        <span>Save Offering (Ctrl+S)</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleNewEntry}
                        className="px-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-xl font-semibold shadow-lg flex items-center justify-center space-x-2"
                      >
                        <FaPlus />
                        <span>New (Ctrl+N)</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Entries */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl ${
                useDarkMode ? 'bg-gray-800' : 'bg-white'
              } border ${
                useDarkMode ? 'border-gray-700' : 'border-gray-200'
              } shadow-lg overflow-hidden`}
            >
              <div className="bg-gradient-to-r from-[#5E936C] to-[#93DA97] p-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FaHistory className="mr-2" />
                  Today's Entries
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {entryHistory.filter(entry => entry.date === format(new Date(), 'yyyy-MM-dd')).length === 0 ? (
                  <div className={`p-8 text-center ${
                    useDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <FaMoneyBillWave className="text-4xl mx-auto mb-3 opacity-50" />
                    <p>No entries recorded today</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {entryHistory
                      .filter(entry => entry.date === format(new Date(), 'yyyy-MM-dd'))
                      .map((entry, index) => {
                        const member = sampleMembers.find(m => m.id === entry.memberId);
                        return (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-[#5E936C] to-[#93DA97] rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {member?.fullName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{member?.fullName}</p>
                                  <p className="text-sm text-gray-600">
                                    {entry.type} • {entry.massType} • {entry.time}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                  {entry.amount.toLocaleString()} TZS
                                </p>
                                <p className="text-sm text-gray-500">{entry.cardNumber}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Side Panel - 1/4 width */}
          <div className="space-y-6">
            {/* Quick Members */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`rounded-2xl ${
                useDarkMode ? 'bg-gray-800' : 'bg-white'
              } border ${
                useDarkMode ? 'border-gray-700' : 'border-gray-200'
              } shadow-lg overflow-hidden`}
            >
              <div className="bg-gradient-to-r from-[#5E936C] to-[#93DA97] p-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FaStar className="mr-2" />
                  Quick Members
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {recentMembers.map((member, index) => (
                  <motion.button
                    key={member.id}
                    whileHover={{ scale: 1.02, x: 5 }}
                    onClick={() => {
                      setSelectedMember(member);
                      if (cardNumberInputRef.current) {
                        cardNumberInputRef.current.value = member.cardNumber;
                      }
                      amountInputRef.current?.focus();
                    }}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      useDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    } border ${
                      useDarkMode ? 'border-gray-600' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-[#5E936C] to-[#93DA97] rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {member.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {member.fullName}
                        </p>
                        <p className="text-xs text-gray-600 truncate">{member.cardNumber}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Efficiency Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl ${
                useDarkMode ? 'bg-gray-800' : 'bg-white'
              } border ${
                useDarkMode ? 'border-gray-700' : 'border-gray-200'
              } shadow-lg overflow-hidden`}
            >
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FaMagic className="mr-2" />
                  Efficiency Tips
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { icon: FaKeyboard, text: 'Use number keys 1-5 for quick amounts' },
                  { icon: FaMouse, text: 'Click member cards for instant selection' },
                  { icon: FaBolt, text: 'Ctrl+S to save, Ctrl+N for new entry' },
                  { icon: FaQrcode, text: 'Scan QR codes for instant member lookup' }
                ].map((tip, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    className="flex items-center space-x-3 p-2 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <tip.icon className="text-blue-500 flex-shrink-0" />
                    <p className="text-sm text-blue-800">{tip.text}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Session Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl ${
                useDarkMode ? 'bg-gray-800' : 'bg-white'
              } border ${
                useDarkMode ? 'border-gray-700' : 'border-gray-200'
              } shadow-lg overflow-hidden`}
            >
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FaChartLine className="mr-2" />
                  Session Stats
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className={`p-3 rounded-xl ${
                    useDarkMode ? 'bg-gray-700' : 'bg-purple-50'
                  }`}>
                    <p className="text-2xl font-bold text-purple-600">{todaysSummary.count}</p>
                    <p className="text-xs text-gray-600">Entries Today</p>
                  </div>
                  <div className={`p-3 rounded-xl ${
                    useDarkMode ? 'bg-gray-700' : 'bg-green-50'
                  }`}>
                    <p className="text-2xl font-bold text-green-600">
                      {todaysSummary.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">Total TZS</p>
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${
                  useDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                } border ${
                  useDarkMode ? 'border-gray-600' : 'border-blue-200'
                }`}>
                  <p className="text-sm font-semibold text-blue-800 mb-1">Average Time per Entry</p>
                  <p className="text-2xl font-bold text-blue-600">~15s</p>
                  <p className="text-xs text-gray-600">With efficiency mode</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scanner Overlay */}
        <AnimatePresence>
          {showScanner && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-2xl p-8 text-center max-w-sm"
              >
                <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <FaCamera className="text-white text-4xl" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Scanning QR Code</h3>
                <p className="text-gray-600 mb-4">Point camera at member's QR code</p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowScanner(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 rounded-xl">
                    <FaSync className="animate-spin inline mr-2" />
                    Scanning...
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OfferingsEntryPage;