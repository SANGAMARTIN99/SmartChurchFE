import { motion } from 'framer-motion';
import { FaHeart, FaComment, FaBookmark, FaRegHeart, FaRegBookmark, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@apollo/client';
import { TOGGLE_BLOG_LIKE, TOGGLE_BLOG_SAVE } from '../../../api/blog';

interface BlogPostCardProps {
    post: any;
    refetch?: () => void;
}

const BlogPostCard = ({ post, refetch }: BlogPostCardProps) => {
    const navigate = useNavigate();
    const [toggleLike] = useMutation(TOGGLE_BLOG_LIKE);
    const [toggleSave] = useMutation(TOGGLE_BLOG_SAVE);

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await toggleLike({ variables: { blogPostId: parseInt(post.id) } });
            if (refetch) refetch();
        } catch (error) {
            console.error('Error liking post:', error);
        }
    };

    const handleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await toggleSave({ variables: { blogPostId: parseInt(post.id) } });
            if (refetch) refetch();
        } catch (error) {
            console.error('Error saving post:', error);
        }
    };

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(post.publishedAt || post.createdAt));

    // Category colors
    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            'TESTIMONIES': 'bg-blue-100 text-blue-800',
            'TEACHINGS': 'bg-purple-100 text-purple-800',
            'PRAYER_UPDATES': 'bg-amber-100 text-amber-800',
            'COMMUNITY_NEWS': 'bg-green-100 text-green-800',
            'EVENTS': 'bg-red-100 text-red-800',
            'INSPIRATION': 'bg-pink-100 text-pink-800',
            'GENERAL': 'bg-gray-100 text-gray-800',
        };
        return colors[category] || colors['GENERAL'];
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer h-full flex flex-col hover:shadow-2xl transition-shadow duration-300 border border-gray-100"
            onClick={() => navigate(`/blog/${post.slug || post.id}`)}
        >
            {post.featuredImage && (
                <div className="h-48 overflow-hidden relative">
                    <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    {post.isFeatured && (
                        <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-md">
                            Featured
                        </span>
                    )}
                </div>
            )}

            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getCategoryColor(post.category)}`}>
                        {post.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-400 text-xs">{formattedDate}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 hover:text-[#5E936C] transition-colors">
                    {post.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-[#5E936C] flex items-center justify-center text-white font-bold text-xs">
                            {post.author?.fullName?.charAt(0) || 'A'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-700">{post.author?.fullName || 'Anonymous'}</span>
                            <span className="text-[10px] text-gray-400">{post.author?.role?.replace('CHURCH_', '').replace('_', ' ') || 'Member'}</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 text-gray-500 text-sm">
                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={handleLike}
                            className={`flex items-center space-x-1 ${post.isLikedByUser ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                            {post.isLikedByUser ? <FaHeart /> : <FaRegHeart />}
                            <span>{post.likesCount}</span>
                        </motion.button>

                        <div className="flex items-center space-x-1 hover:text-blue-500">
                            <FaComment />
                            <span>{post.commentsCount}</span>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={handleSave}
                            className={`flex items-center space-x-1 ${post.isSavedByUser ? 'text-[#5E936C]' : 'hover:text-[#5E936C]'}`}
                        >
                            {post.isSavedByUser ? <FaBookmark /> : <FaRegBookmark />}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default BlogPostCard;

// Revision note [2026-07-14 18:41:49 +0300]: Enhance blog feed pagination control

// Revision note [2026-07-29 09:35:21 +0300]: Improve responsive grid breakpoint spacing

// Revision note [2026-08-12 14:10:19 +0300]: Refactor navigation bar responsive styling

// Activity update [2026-07-13 17:17:51 +0300]: Enhance blog feed pagination control

// Activity update [2026-07-23 16:55:38 +0300]: Update broadcast announcement modal layout

// Activity update [2026-08-03 13:49:08 +0300]: Enhance church leader photo preview component

// Activity update [2026-08-12 17:21:05 +0300]: Update user profile settings modal form
