import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPen, FaSearch, FaFilter, FaFire, FaClock, FaBookmark, FaBars, FaTimes, FaList, FaUserCircle, FaCheckCircle } from 'react-icons/fa';
import { GET_BLOG_POSTS, GET_BLOG_STATS, GET_PENDING_BLOG_POSTS, GET_MY_BLOG_POSTS } from '../../api/blog';
import { ME_QUERY } from '../../api/queries';
import BlogPostCard from './components/BlogPostCard';
import PendingPostCard from './components/PendingPostCard';
import CreatePostModal from './components/CreatePostModal';

// Filter categories
const CATEGORIES = [
    { id: 'ALL', label: 'All Posts' },
    { id: 'TESTIMONIES', label: 'Testimonies' },
    { id: 'TEACHINGS', label: 'Teachings' },
    { id: 'PRAYER_UPDATES', label: 'Prayer Updates' },
    { id: 'COMMUNITY_NEWS', label: 'Community News' },
    { id: 'EVENTS', label: 'Events' },
    { id: 'INSPIRATION', label: 'Inspiration' },
];

const BlogFeed = () => {
    const [activeTab, setActiveTab] = useState<'FEED' | 'MY_POSTS' | 'PENDING'>('FEED');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Data Fetching
    const { data: userData } = useQuery(ME_QUERY);
    const userRole = userData?.me?.role || 'CHURCH_MEMBER';
    const isLeader = ['PASTOR', 'ASSISTANT_PASTOR', 'EVANGELIST'].includes(userRole);

    const { data: postsData, loading: postsLoading, error: postsError, refetch: refetchPosts } = useQuery(GET_BLOG_POSTS, {
        variables: {
            filters: {
                category: activeCategory === 'ALL' ? null : activeCategory,
                search: searchQuery || null
            }
        },
        fetchPolicy: 'network-only',
        skip: activeTab !== 'FEED'
    });

    const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = useQuery(GET_PENDING_BLOG_POSTS, {
        fetchPolicy: 'network-only',
        skip: activeTab !== 'PENDING'
    });

    const { data: myData, loading: myLoading, refetch: refetchMy } = useQuery(GET_MY_BLOG_POSTS, {
        fetchPolicy: 'network-only',
        skip: activeTab !== 'MY_POSTS'
    });

    const { data: statsData, refetch: refetchStats } = useQuery(GET_BLOG_STATS);

    const handleRefetchAll = () => {
        refetchPosts();
        refetchPending();
        refetchMy();
        refetchStats();
    };

    const renderContent = () => {
        if (activeTab === 'FEED') {
            if (postsLoading) return <LoadingSpinner />;
            if (postsError) return <ErrorDisplay />;
            if (!postsData?.blogPosts?.length) return <EmptyState onCreate={() => setIsCreateModalOpen(true)} />;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postsData.blogPosts.map((post: any) => (
                        <BlogPostCard key={post.id} post={post} refetch={handleRefetchAll} />
                    ))}
                </div>
            );
        }

        if (activeTab === 'PENDING') {
            if (pendingLoading) return <LoadingSpinner />;
            if (!pendingData?.pendingBlogPosts?.length) return <div className="text-center py-20 text-gray-500">No pending posts to review.</div>;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingData.pendingBlogPosts.map((post: any) => (
                        <PendingPostCard key={post.id} post={post} refetch={handleRefetchAll} />
                    ))}
                </div>
            );
        }

        if (activeTab === 'MY_POSTS') {
            if (myLoading) return <LoadingSpinner />;
            if (!myData?.myBlogPosts?.length) return <div className="text-center py-20 text-gray-500">You haven't authored any posts yet.</div>;
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myData.myBlogPosts.map((post: any) => (
                        <BlogPostCard key={post.id} post={post} refetch={handleRefetchAll} />
                    ))}
                </div>
            );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
                        Kingdom <span className="text-[#5E936C]">Insights</span>
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">Share testimonies, wisdom, and church updates.</p>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#5E936C] text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:bg-[#4a7a56] transition-all flex items-center gap-2 font-bold"
                >
                    <FaPen />
                    Create New Post
                </motion.button>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('FEED')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'FEED' ? 'border-[#5E936C] text-[#5E936C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <FaList /> Feed
                </button>
                <button
                    onClick={() => setActiveTab('MY_POSTS')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'MY_POSTS' ? 'border-[#5E936C] text-[#5E936C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <FaUserCircle /> My Posts
                </button>
                {isLeader && (
                    <button
                        onClick={() => setActiveTab('PENDING')}
                        className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'PENDING' ? 'border-[#5E936C] text-[#5E936C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FaCheckCircle /> Reviews
                        {statsData?.blogStats?.pendingPostsCount > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{statsData.blogStats.pendingPostsCount}</span>
                        )}
                    </button>
                )}
            </div>

            {/* Stats Cards (Optional but adds professional feel) - Hidden when not on feed to reduce clutter? kept for stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><FaFire size={20} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase">Total Posts</p>
                        <p className="text-xl font-bold text-gray-800">{statsData?.blogStats?.totalPosts || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-[#5E936C] bg-opacity-10 text-[#5E936C] rounded-lg"><FaPen size={20} /></div>
                    <div>
                        <p className="text-gray-500 text-xs font-semibold uppercase">My Posts</p>
                        <p className="text-xl font-bold text-gray-800">{statsData?.blogStats?.myPostsCount || 0}</p>
                    </div>
                </div>
            </div>

            {/* Filters and Search - Only for Feed */}
            {activeTab === 'FEED' && (
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 sticky top-0 z-20">
                    <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto custom-scrollbar">
                        {CATEGORIES.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === category.id
                                        ? 'bg-[#5E936C] text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {category.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64 flex-shrink-0">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5E936C] focus:ring-2 focus:ring-[#5E936C] focus:ring-opacity-20 transition-all outline-none bg-gray-50 focus:bg-white"
                        />
                    </div>
                </div>
            )}

            {/* Content Area */}
            {renderContent()}

            {/* Modals */}
            <CreatePostModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                refetch={handleRefetchAll}
                userRole={userRole}
            />
        </div>
    );
};

// Sub-components for cleaner code
const LoadingSpinner = () => (
    <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E936C]"></div>
    </div>
);

const ErrorDisplay = () => (
    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
        <p className="text-red-500 font-medium">Error loading posts. Please try again later.</p>
    </div>
);

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
            <FaPen size={24} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">No posts found</h3>
        <p className="text-gray-500 mb-6">Be the first to share something inspiring!</p>
        <button
            onClick={onCreate}
            className="text-[#5E936C] font-bold hover:underline"
        >
            Create a post
        </button>
    </div>
);

export default BlogFeed;

// Revision note [2026-07-14 09:43:37 +0300]: Update prayer request card animation triggers

// Revision note [2026-07-28 14:27:23 +0300]: Update button hover states and active indicators

// Revision note [2026-08-11 18:37:12 +0300]: Optimize Apollo Client GraphQL queries

// Activity update [2026-07-13 14:14:28 +0300]: Update prayer request card animation triggers

// Activity update [2026-07-23 16:10:16 +0300]: Refactor login page glassmorphism styling
