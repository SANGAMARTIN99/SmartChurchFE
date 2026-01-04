import React, { useState, useEffect } from 'react';
import {
  FaBook, FaUpload, FaEdit, FaTrash, FaPenFancy, FaImage, FaVideo,
  FaMicrophone, FaStop, FaTimes, FaCheck, FaSpinner, FaSearch, FaFilter
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@apollo/client';
import { CREATE_DEVOTIONAL, UPDATE_DEVOTIONAL, DELETE_DEVOTIONAL } from '../../api/mutations';
import { GET_DEVOTIONALS } from '../../api/queries';
import { format, parseISO } from 'date-fns';
import { getAccessToken } from '../../utils/auth';

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md border border-white/20 ${type === 'success' ? 'bg-[#1a3c2b]/90 text-white' : 'bg-red-500/90 text-white'
        }`}
    >
      <div className={`p-2 rounded-full ${type === 'success' ? 'bg-[#5E936C]' : 'bg-white/20'}`}>
        {type === 'success' ? <FaCheck className="text-sm" /> : <FaTimes className="text-sm" />}
      </div>
      <div>
        <h4 className="font-bold text-sm tracking-wide">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-xs opacity-90 font-medium">{message}</p>
      </div>
    </motion.div>
  );
};

// --- Types ---

interface Devotional {
  id: string;
  title: string;
  content: string;
  scripture: string;
  publishedAt: string;
  author: { fullName: string };
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

// --- Main Page ---

const WordOfTheDay = () => {
  // Navigation & State
  const [activeView, setActiveView] = useState<'create' | 'library'>('create');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Data State
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Media & Form
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    scripture: '',
    content: '',
    publishDate: format(new Date(), 'yyyy-MM-dd'),
  });

  // Queries
  const { data, loading } = useQuery(GET_DEVOTIONALS, {
    variables: { limit: 50, offset: 0 },
    fetchPolicy: 'cache-and-network'
  });

  // Mutations
  const [createDevotional] = useMutation(CREATE_DEVOTIONAL, {
    refetchQueries: [{ query: GET_DEVOTIONALS, variables: { limit: 50, offset: 0 } }],
  });
  const [updateDevotional] = useMutation(UPDATE_DEVOTIONAL, {
    refetchQueries: [{ query: GET_DEVOTIONALS, variables: { limit: 50, offset: 0 } }],
  });
  const [deleteDevotional] = useMutation(DELETE_DEVOTIONAL, {
    refetchQueries: [{ query: GET_DEVOTIONALS, variables: { limit: 50, offset: 0 } }],
  });

  const devotionals: Devotional[] = data?.devotionals || [];
  const filteredDevotionals = devotionals.filter(d =>
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.scripture.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Handlers ---

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const resetForm = () => {
    setFormData({ title: '', scripture: '', content: '', publishDate: format(new Date(), 'yyyy-MM-dd') });
    setImageFile(null); setVideoFile(null); setAudioFile(null);
    setImagePreview(null); setAudioPreview(null);
    setSelectedDevotional(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], `rec-${Date.now()}.webm`, { type: 'audio/webm' });
        setAudioFile(file);
        setAudioPreview(URL.createObjectURL(blob));
      };
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch { showToast('Microphone access denied', 'error'); }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setIsRecording(false);
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('folder', folder);
    const token = getAccessToken();
    const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${API_BASE.replace(/\/$/, '')}/api/upload/`, {
      method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: form
    });
    if (!res.ok) throw new Error('Upload failed');
    return (await res.json()).url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let [img, vid, aud] = [undefined, undefined, undefined];
      if (imageFile) img = await uploadFile(imageFile, 'devotionals/images');
      if (videoFile) vid = await uploadFile(videoFile, 'devotionals/videos');
      if (audioFile) aud = await uploadFile(audioFile, 'devotionals/audios');

      const input = {
        title: formData.title, scripture: formData.scripture, content: formData.content,
        publishedAt: formData.publishDate, imageUrl: img, audioUrl: aud, videoUrl: vid
      };

      if (selectedDevotional) {
        await updateDevotional({ variables: { id: selectedDevotional.id, input } });
        showToast('Devotional updated successfully', 'success');
      } else {
        await createDevotional({ variables: { input } });
        showToast('Devotional published successfully', 'success');
      }
      resetForm();
      setActiveView('library');
    } catch (err: any) {
      showToast(err.message || 'Failed to save devotional', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-gray-800 overflow-hidden">
      <AnimatePresence>{toast && <Toast {...toast} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navigation Bar */}
        <header className="bg-white border-b border-gray-100 flex items-center justify-between px-8 py-5 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#1a3c2b] to-[#5E936C] p-2.5 rounded-xl shadow-lg shadow-green-900/20">
              <FaBook className="text-white text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1a3c2b] tracking-tight">Pastoral Desk</h1>
              <p className="text-xs text-gray-500 font-medium">Word of the Day Manager</p>
            </div>
          </div>
          <div className="flex bg-gray-100/80 p-1.5 rounded-xl">
            {['create', 'library'].map((view) => (
              <button
                key={view}
                onClick={() => { if (view === 'create') resetForm(); setActiveView(view as any); }}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeView === view
                    ? 'bg-white text-[#1a3c2b] shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {view === 'create' ? 'Studio' : 'Library'}
              </button>
            ))}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <AnimatePresence mode="wait">

            {/* --- CREATE VIEW --- */}
            {activeView === 'create' && (
              <motion.form
                key="create"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                onSubmit={handleSubmit}
                className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8"
              >
                {/* Editor Canvas (Left Large) */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col relative group hover:shadow-md transition-shadow duration-500">
                    {/* Top Toolbar */}
                    <div className="border-b border-gray-100 p-4 bg-gray-50/50 flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      <span className="ml-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Editor Canvas</span>
                    </div>

                    {/* Inputs */}
                    <div className="p-8 flex-1 flex flex-col gap-6">
                      <input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="text-4xl font-black text-[#1a3c2b] placeholder-gray-300 outline-none bg-transparent w-full"
                        placeholder="Enter Title Here..."
                        autoFocus
                        required
                      />
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaPenFancy className="text-sm" />
                        <input
                          name="scripture"
                          value={formData.scripture}
                          onChange={handleInputChange}
                          className="text-lg font-serif italic text-gray-600 placeholder-gray-300 outline-none bg-transparent w-full border-b border-dashed border-transparent focus:border-gray-200 transition"
                          placeholder="Add Scripture Reference (e.g. John 3:16)..."
                        />
                      </div>
                      <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        className="flex-1 w-full resize-none outline-none text-lg text-gray-700 leading-relaxed placeholder-gray-200"
                        placeholder="Start writing your daily inspiration..."
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Sidebar (Right Small) */}
                <div className="xl:col-span-4 flex flex-col gap-6">
                  {/* Publish Card */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-[#1a3c2b] mb-4 flex items-center gap-2"><div className="w-1.5 h-4 bg-[#5E936C] rounded-full"></div> Publishing</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Publish Date</label>
                        <input
                          type="date"
                          name="publishDate"
                          value={formData.publishDate}
                          onChange={handleInputChange}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-medium outline-none focus:border-[#5E936C] transition"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl bg-[#1a3c2b] text-white font-bold text-lg hover:bg-[#2d5c43] active:scale-95 transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {isSubmitting ? <FaSpinner className="animate-spin" /> : <><FaCheck /> {selectedDevotional ? 'Save Changes' : 'Publish Now'}</>}
                      </button>
                    </div>
                  </div>

                  {/* Media Card */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <h3 className="font-bold text-[#1a3c2b] mb-4 flex items-center gap-2"><div className="w-1.5 h-4 bg-[#5E936C] rounded-full"></div> Media Assets</h3>

                    <div className="space-y-4">
                      {/* Image */}
                      <div className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-200 hover:border-[#5E936C] transition bg-gray-50 h-40">
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"><FaTimes size={12} /></button>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center h-full cursor-pointer text-gray-400 hover:text-[#5E936C] transition">
                            <FaImage className="text-3xl mb-2" />
                            <span className="text-xs font-bold">Upload Cover</span>
                            <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                          </label>
                        )}
                      </div>

                      {/* Audio */}
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Audio Message</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                          >
                            {isRecording ? 'Stop' : <><FaMicrophone /> Record</>}
                          </button>
                          <label className="px-4 py-3 bg-gray-200 text-gray-600 rounded-lg cursor-pointer hover:bg-gray-300 transition flex items-center">
                            <FaUpload />
                            <input type="file" onChange={(e) => { if (e.target.files?.[0]) { setAudioFile(e.target.files[0]); setAudioPreview(URL.createObjectURL(e.target.files[0])); } }} className="hidden" accept="audio/*" />
                          </label>
                        </div>
                        {audioPreview && <audio src={audioPreview} controls className="w-full mt-3 h-8" />}
                      </div>

                      {/* Video */}
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm"><FaVideo className="text-[#5E936C]" /></div>
                          <span className="text-sm font-medium text-gray-600 truncate max-w-[150px]">{videoFile ? videoFile.name : 'No video selected'}</span>
                        </div>
                        <label className="text-xs font-bold text-[#5E936C] cursor-pointer hover:underline">
                          Choose
                          <input type="file" onChange={(e) => { if (e.target.files?.[0]) setVideoFile(e.target.files[0]); }} className="hidden" accept="video/*" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.form>
            )}

            {/* --- LIBRARY VIEW --- */}
            {activeView === 'library' && (
              <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto pb-20">

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex-1 relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search devotionals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#5E936C] transition"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-gray-500 font-medium">
                    <FaFilter />
                    <span>{filteredDevotionals.length} Items</span>
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {loading ? [...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 h-96 rounded-3xl animate-pulse" />) :
                    filteredDevotionals.map((d) => (
                      <div key={d.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative flex flex-col h-[400px]">
                        {/* Image */}
                        <div className="h-48 relative overflow-hidden bg-gray-100">
                          {d.imageUrl ? (
                            <img src={d.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-[#E8FFD7] to-white"><FaBook className="text-4xl text-[#5E936C]/30" /></div>
                          )}
                          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
                            {d.publishedAt ? format(parseISO(d.publishedAt), 'MMM dd') : 'Draft'}
                          </div>
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                            <button onClick={() => { setSelectedDevotional(d); setFormData({ title: d.title, scripture: d.scripture, content: d.content, publishDate: d.publishedAt }); setImagePreview(d.imageUrl || null); setActiveView('create'); }} className="bg-white text-[#1a3c2b] p-3 rounded-full hover:scale-110 transition shadow-lg"><FaEdit /></button>
                            <button onClick={() => { if (confirm('Delete?')) deleteDevotional({ variables: { id: d.id } }); }} className="bg-white text-red-500 p-3 rounded-full hover:scale-110 transition shadow-lg"><FaTrash /></button>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 flex-1 flex flex-col">
                          <h3 className="font-bold text-xl text-[#1a3c2b] mb-2 leading-tight line-clamp-2" title={d.title}>{d.title}</h3>
                          <p className="text-xs font-bold text-[#5E936C] mb-3 font-serif italic">{d.scripture}</p>
                          <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">{d.content}</p>

                          <div className="pt-4 border-t border-gray-50 flex justify-between items-center text-xs text-gray-400">
                            <span>Author: {d.author?.fullName || 'Me'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default WordOfTheDay;