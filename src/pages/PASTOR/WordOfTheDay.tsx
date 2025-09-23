import React, { useState } from 'react';
import { FaBook, FaCalendarAlt, FaUpload, FaShare, FaEye, FaEdit, FaTrash, FaMoneyBillWave, FaUserFriends, FaUsers, FaPlus, FaHistory, FaBell, FaEnvelope, FaPrayingHands, FaChartLine } from 'react-icons/fa';
import { GiCrossedChains } from 'react-icons/gi';
import { MdOutlineDashboard, MdOutlineNotificationsActive } from 'react-icons/md';
import { BsGraphUp, BsPeopleFill, BsThreeDotsVertical } from 'react-icons/bs';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@apollo/client';
import {  CREATE_DEVOTIONAL, UPDATE_DEVOTIONAL, DELETE_DEVOTIONAL } from '../../api/mutations';
import { GET_DEVOTIONALS } from '../../api/queries';
import { format } from 'date-fns';
import CombinedNav from '../../components/CombinedNav'; // Import your CombinedNav component

// Types
interface Devotional {
  id: string;
  title: string;
  content: string;
  scripture: string;
  publishedAt: string;
  author: {
    fullName: string;
  };
}

const WordOfTheDay = () => {
  const [activeView, setActiveView] = useState<'create' | 'preview' | 'list'>('create');
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    scripture: '',
    content: '',
    publishDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // GraphQL Queries
  const { data, loading, error } = useQuery(GET_DEVOTIONALS, {
    variables: { limit: 10, offset: 0 }
  });

// GraphQL Mutations
const [createDevotional] = useMutation(CREATE_DEVOTIONAL, {
  refetchQueries: [{ query: GET_DEVOTIONALS, variables: { limit: 10, offset: 0 } }],
});

const [updateDevotional] = useMutation(UPDATE_DEVOTIONAL, {
  refetchQueries: [{ query: GET_DEVOTIONALS, variables: { limit: 10, offset: 0 } }],
});

const [deleteDevotional] = useMutation(DELETE_DEVOTIONAL, {
  refetchQueries: [{ query: GET_DEVOTIONALS, variables: { limit: 10, offset: 0 } }],
});

  const devotionals: Devotional[] = data?.devotionals || [];

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (selectedDevotional) {
        // Update existing devotional
        await updateDevotional({
          variables: {
            id: selectedDevotional.id,
            input: {
              title: formData.title,
              scripture: formData.scripture,
              content: formData.content,
              publishedAt: formData.publishDate
            }
          }
        });
      } else {
        // Create new devotional
        await createDevotional({
          variables: {
            input: {
              title: formData.title,
              scripture: formData.scripture,
              content: formData.content,
              publishedAt: formData.publishDate
            }
          }
        });
      }
      
      // Reset form
      setFormData({
        title: '',
        scripture: '',
        content: '',
        publishDate: format(new Date(), 'yyyy-MM-dd'),
      });
      setImageFile(null);
      setImagePreview(null);
      setSelectedDevotional(null);
      
      // Show success message
      alert(selectedDevotional ? 'Devotional updated successfully!' : 'Devotional created successfully!');
    } catch (err) {
      console.error('Error saving devotional:', err);
      alert('Error saving devotional. Please try again.');
    }
  };

  const handleEdit = (devotional: Devotional) => {
    setSelectedDevotional(devotional);
    setFormData({
      title: devotional.title,
      scripture: devotional.scripture,
      content: devotional.content,
      publishDate: format(new Date(devotional.publishedAt), 'yyyy-MM-dd'),
    });
    setActiveView('create');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this devotional?')) {
      try {
        await deleteDevotional({ variables: { id } });
        alert('Devotional deleted successfully!');
      } catch (err) {
        console.error('Error deleting devotional:', err);
        alert('Error deleting devotional. Please try again.');
      }
    }
  };

  const handlePreview = (devotional: Devotional) => {
    setSelectedDevotional(devotional);
    setActiveView('preview');
  };

  const handleNewDevotional = () => {
    setSelectedDevotional(null);
    setFormData({
      title: '',
      scripture: '',
      content: '',
      publishDate: format(new Date(), 'yyyy-MM-dd'),
    });
    setImageFile(null);
    setImagePreview(null);
    setActiveView('create');
  };

  return (
    <div className="flex h-screen bg-[#E8FFD7] overflow-hidden">
      {/* Combined Navigation - Extended with Dashboard Items */}
      <CombinedNav 
        sidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        dashboardItems={[
          {
            title: 'Dashboard',
            icon: <MdOutlineDashboard />,
            onClick: () => window.location.href = '/dashboard',
            active: false
          },
          {
            title: 'Word of the Day',
            icon: <FaBook />,
            onClick: () => {},
            active: true
          },
          {
            title: 'Members',
            icon: <FaUsers />,
            onClick: () => window.location.href = '/members',
            active: false
          },
          {
            title: 'Offerings',
            icon: <FaMoneyBillWave />,
            onClick: () => window.location.href = '/offerings',
            active: false
          },
          {
            title: 'Events',
            icon: <FaCalendarAlt />,
            onClick: () => window.location.href = '/events',
            active: false
          },
          {
            title: 'Prayer Requests',
            icon: <FaPrayingHands />,
            onClick: () => window.location.href = '/prayers',
            active: false
          },
          {
            title: 'Ministries',
            icon: <GiCrossedChains />,
            onClick: () => window.location.href = '/ministries',
            active: false
          },
          {
            title: 'Reports',
            icon: <FaChartLine />,
            onClick: () => window.location.href = '/reports',
            active: false
          }
        ]}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#F7FCF5] mt-16">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex flex-col md:flex-row items-center justify-between"
            >
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-[#5E936C] p-3 rounded-full mr-4">
                  <FaBook className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#5E936C]">Word of the Day</h1>
                  <p className="text-gray-600">Share daily inspiration with your congregation</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveView('create')}
                  className={`px-4 py-2 rounded-lg flex items-center ${activeView === 'create' ? 'bg-[#5E936C] text-white' : 'bg-[#E8FFD7] text-[#5E936C]'}`}
                >
                  <FaPlus className="mr-2" />
                  New Devotional
                </button>
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-4 py-2 rounded-lg flex items-center ${activeView === 'list' ? 'bg-[#5E936C] text-white' : 'bg-[#E8FFD7] text-[#5E936C]'}`}
                >
                  <FaHistory className="mr-2" />
                  History
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                  {activeView === 'create' && (
                    <motion.div
                      key="create"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-2xl shadow-lg p-6"
                    >
                      <h2 className="text-xl font-bold text-[#5E936C] mb-4">
                        {selectedDevotional ? 'Edit Devotional' : 'Create New Devotional'}
                      </h2>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Title</label>
                          <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                            placeholder="Enter devotional title"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Scripture Reference</label>
                          <input
                            type="text"
                            name="scripture"
                            value={formData.scripture}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                            placeholder="e.g., John 3:16"
                            required
                          />
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Publish Date</label>
                          <div className="relative">
                            <input
                              type="date"
                              name="publishDate"
                              value={formData.publishDate}
                              onChange={handleInputChange}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                              required
                            />
                            <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label className="block text-gray-700 mb-2">Featured Image (Optional)</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            {imagePreview ? (
                              <div className="mb-4">
                                <img 
                                  src={imagePreview} 
                                  alt="Preview" 
                                  className="max-h-48 mx-auto rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImageFile(null);
                                    setImagePreview(null);
                                  }}
                                  className="mt-2 text-red-500 text-sm"
                                >
                                  Remove Image
                                </button>
                              </div>
                            ) : (
                              <>
                                <FaUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500 mb-2">Drag & drop an image here or click to browse</p>
                              </>
                            )}
                            <label className="bg-[#5E936C] text-white px-4 py-2 rounded-lg cursor-pointer">
                              Browse Files
                              <input
                                type="file"
                                onChange={handleImageChange}
                                className="hidden"
                                accept="image/*"
                              />
                            </label>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <label className="block text-gray-700 mb-2">Devotional Content</label>
                          <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleInputChange}
                            rows={10}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5E936C] focus:border-transparent"
                            placeholder="Write your devotional content here..."
                            required
                          />
                        </div>
                        
                        <div className="flex justify-end space-x-4">
                          <button
                            type="button"
                            onClick={() => setActiveView('list')}
                            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-[#5E936C] text-white px-6 py-3 rounded-lg hover:bg-[#4a7a58] flex items-center"
                          >
                            {selectedDevotional ? 'Update Devotional' : 'Publish Devotional'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                  
                  {activeView === 'preview' && selectedDevotional && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="relative h-48 bg-gradient-to-r from-[#5E936C] to-[#93DA97]">
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <h2 className="text-3xl font-bold text-white text-center px-4">
                            {selectedDevotional.title}
                          </h2>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <p className="text-[#5E936C] font-semibold">
                              {format(new Date(selectedDevotional.publishedAt), 'MMMM dd, yyyy')}
                            </p>
                            <p className="text-gray-600">By {selectedDevotional.author.fullName}</p>
                          </div>
                          <div className="bg-[#E8FFD7] text-[#5E936C] px-3 py-1 rounded-full">
                            {selectedDevotional.scripture}
                          </div>
                        </div>
                        
                        <div className="prose max-w-none mb-8">
                          <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                            {selectedDevotional.content}
                          </p>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-6 flex justify-between items-center">
                          <div className="text-gray-500">
                            Word of the Day • KKKT Usharika wa Mkimbizi
                          </div>
                          <div className="flex space-x-2">
                            <button className="bg-[#5E936C] text-white px-4 py-2 rounded-lg flex items-center">
                              <FaShare className="mr-2" />
                              Share
                            </button>
                            <button 
                              onClick={() => handleEdit(selectedDevotional)}
                              className="bg-[#E8FFD7] text-[#5E936C] px-4 py-2 rounded-lg flex items-center"
                            >
                              <FaEdit className="mr-2" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {activeView === 'list' && (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-[#5E936C]">Devotional History</h2>
                        <p className="text-gray-600">View and manage past devotionals</p>
                      </div>
                      
                      {loading ? (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E936C] mx-auto"></div>
                          <p className="mt-4 text-gray-600">Loading devotionals...</p>
                        </div>
                      ) : error ? (
                        <div className="p-6 text-center">
                          <p className="text-red-500">Error loading devotionals: {error.message}</p>
                        </div>
                      ) : devotionals.length === 0 ? (
                        <div className="p-6 text-center">
                          <FaBook className="text-4xl text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No devotionals found. Create your first one!</p>
                          <button
                            onClick={handleNewDevotional}
                            className="mt-4 bg-[#5E936C] text-white px-4 py-2 rounded-lg"
                          >
                            Create Devotional
                          </button>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {devotionals.map((devotional) => (
                            <div key={devotional.id} className="p-6 hover:bg-gray-50">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg text-[#5E936C]">
                                    {devotional.title}
                                  </h3>
                                  <p className="text-gray-600 mb-2">
                                    {format(new Date(devotional.publishedAt), 'MMMM dd, yyyy')} • {devotional.scripture}
                                  </p>
                                  <p className="text-gray-700 line-clamp-2">
                                    {devotional.content.substring(0, 150)}...
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handlePreview(devotional)}
                                    className="p-2 text-gray-500 hover:text-[#5E936C]"
                                    title="Preview"
                                  >
                                    <FaEye />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(devotional)}
                                    className="p-2 text-gray-500 hover:text-[#5E936C]"
                                    title="Edit"
                                  >
                                    <FaEdit />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(devotional.id)}
                                    className="p-2 text-gray-500 hover:text-red-500"
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Sidebar */}
              <div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg p-6 mb-6"
                >
                  <h3 className="text-lg font-bold text-[#5E936C] mb-4">Today's Devotional</h3>
                  
                  {devotionals.length > 0 && (
                    <div className="bg-[#E8FFD7] rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-[#5E936C]">{devotionals[0].title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(devotionals[0].publishedAt), 'MMMM dd, yyyy')}
                      </p>
                      <p className="text-sm mt-2 line-clamp-3">
                        {devotionals[0].content.substring(0, 100)}...
                      </p>
                      <button
                        onClick={() => handlePreview(devotionals[0])}
                        className="mt-3 text-[#5E936C] text-sm font-medium"
                      >
                        Read Full Devotional →
                      </button>
                    </div>
                  )}
                  
                  <div className="bg-gray-100 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Quick Stats</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-[#5E936C]">{devotionals.length}</p>
                        <p className="text-xs text-gray-600">Total Devotionals</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg text-center">
                        <p className="text-2xl font-bold text-[#5E936C]">
                          {devotionals.filter(d => new Date(d.publishedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                        </p>
                        <p className="text-xs text-gray-600">Last 30 Days</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg p-6"
                >
                  <h3 className="text-lg font-bold text-[#5E936C] mb-4">Tips for Writing</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="bg-[#E8FFD7] text-[#5E936C] p-1 rounded-full mr-3 mt-1">
                        <div className="h-2 w-2 rounded-full bg-[#5E936C]"></div>
                      </div>
                      <span className="text-gray-700">Keep it concise (200-400 words)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#E8FFD7] text-[#5E936C] p-1 rounded-full mr-3 mt-1">
                        <div className="h-2 w-2 rounded-full bg-[#5E936C]"></div>
                      </div>
                      <span className="text-gray-700">Include a clear scripture reference</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#E8FFD7] text-[#5E936C] p-1 rounded-full mr-3 mt-1">
                        <div className="h-2 w-2 rounded-full bg-[#5E936C]"></div>
                      </div>
                      <span className="text-gray-700">Add a practical application</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-[#E8FFD7] text-[#5E936C] p-1 rounded-full mr-3 mt-1">
                        <div className="h-2 w-2 rounded-full bg-[#5E936C]"></div>
                      </div>
                      <span className="text-gray-700">End with a prayer or reflection question</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WordOfTheDay;