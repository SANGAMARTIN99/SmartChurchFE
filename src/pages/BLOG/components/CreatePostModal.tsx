import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner, FaImage, FaTag, FaUpload } from 'react-icons/fa';
import { useMutation } from '@apollo/client';
import { CREATE_BLOG_POST } from '../../../api/blog';
import { getAccessToken } from '../../../utils/auth';
import { ENDPOINT } from '../../../api/environment';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    refetch: () => void;
    userRole: string;
}

const CATEGORIES = [
    { value: 'TESTIMONIES', label: 'Testimony' },
    { value: 'TEACHINGS', label: 'Teaching' },
    { value: 'PRAYER_UPDATES', label: 'Prayer Update' },
    { value: 'COMMUNITY_NEWS', label: 'Community News' },
    { value: 'EVENTS', label: 'Event' },
    { value: 'INSPIRATION', label: 'Inspiration' },
    { value: 'GENERAL', label: 'General' },
];

const CreatePostModal = ({ isOpen, onClose, refetch, userRole }: CreatePostModalProps) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('GENERAL');
    const [tags, setTags] = useState('');
    // Replace URL input with File handling
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [createPost, { loading: mutationLoading }] = useMutation(CREATE_BLOG_POST);
    const isLoading = isUploading || mutationLoading;

    // Helper to upload file via REST
    const uploadImage = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'blog_images');

        const token = getAccessToken();
        const BASE_URL = ENDPOINT.replace('/graphql/', '');

        try {
            const response = await fetch(`${BASE_URL}/api/upload/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            return data.url; // Returns absolute URL e.g., http://.../media/blog_images/img.jpg
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            let featuredImageUrl = '';

            // Upload image first if selected
            if (selectedFile) {
                featuredImageUrl = await uploadImage(selectedFile);
            }

            await createPost({
                variables: {
                    input: {
                        title,
                        content,
                        category,
                        tags,
                        featuredImage: featuredImageUrl, // Send the URL (backend will parse it)
                        allowComments: true
                    }
                }
            });
            refetch();
            onClose();
            // Reset form
            setTitle('');
            setContent('');
            setCategory('GENERAL');
            setTags('');
            setSelectedFile(null);
            setPreviewUrl('');
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const isLeader = ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST'].includes(userRole);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#5E936C] focus:ring-2 focus:ring-[#5E936C] focus:ring-opacity-20 transition-all outline-none"
                                        placeholder="Give your post a catchy title"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                        <div className="relative">
                                            <select
                                                value={category}
                                                onChange={(e) => setCategory(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#5E936C] focus:ring-2 focus:ring-[#5E936C] focus:ring-opacity-20 transition-all outline-none appearance-none bg-white"
                                            >
                                                {CATEGORIES.map(cat => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <span className="flex items-center gap-2"><FaTag className="text-gray-400" /> Tags</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={tags}
                                            onChange={(e) => setTags(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#5E936C] focus:ring-2 focus:ring-[#5E936C] focus:ring-opacity-20 transition-all outline-none"
                                            placeholder="e.g. faith, sunday service"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <span className="flex items-center gap-2"><FaImage className="text-gray-400" /> Featured Image</span>
                                    </label>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    {!previewUrl ? (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-[#5E936C] hover:text-[#5E936C] hover:bg-green-50 transition-all"
                                        >
                                            <FaUpload size={24} className="mb-2" />
                                            <span className="font-medium">Click to upload image</span>
                                            <span className="text-xs mt-1 text-gray-400">Supports JPG, PNG</span>
                                        </button>
                                    ) : (
                                        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                                            <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="bg-white text-gray-800 px-4 py-2 rounded-lg font-bold mr-2 hover:bg-gray-100"
                                                >
                                                    Change
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFile(null);
                                                        setPreviewUrl('');
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                                    <textarea
                                        required
                                        rows={8}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#5E936C] focus:ring-2 focus:ring-[#5E936C] focus:ring-opacity-20 transition-all outline-none resize-none"
                                        placeholder="Share your thoughts..."
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    {isLeader
                                        ? "This post will be published immediately."
                                        : "This post will be submitted for approval."}
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2.5 rounded-lg bg-[#5E936C] text-white hover:bg-[#4a7a56] transition-colors shadow-lg hover:shadow-xl font-medium flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isLoading && <FaSpinner className="animate-spin" />}
                                        {isLoading ? 'Processing...' : (isLeader ? 'Publish Post' : 'Submit for Review')}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreatePostModal;

// Revision note [2026-07-15 09:32:27 +0300]: Optimize member dashboard metrics display

// Revision note [2026-07-29 14:37:40 +0300]: Update authentication header propagation logic
