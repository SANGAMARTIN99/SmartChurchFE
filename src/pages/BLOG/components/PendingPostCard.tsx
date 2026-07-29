import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaUser } from 'react-icons/fa';
import { useMutation } from '@apollo/client';
import { APPROVE_BLOG_POST } from '../../../api/blog';

interface PendingPostCardProps {
    post: any;
    refetch: () => void;
}

const PendingPostCard = ({ post, refetch }: PendingPostCardProps) => {
    const [approvePost] = useMutation(APPROVE_BLOG_POST);

    const handleAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !confirm('Are you sure you want to reject this post?')) return;

        try {
            await approvePost({
                variables: {
                    input: {
                        blogPostId: parseInt(post.id),
                        action
                    }
                }
            });
            refetch();
        } catch (error) {
            console.error(`Error ${action}ing post:`, error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full"
        >
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <FaUser size={12} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">{post.author?.fullName}</p>
                            <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">Pending</span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>

                <div className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    {post.category}
                </div>
            </div>

            <div className="bg-gray-50 p-4 flex gap-3 border-t border-gray-100">
                <button
                    onClick={() => handleAction('approve')}
                    className="flex-1 bg-[#5E936C] text-white py-2 rounded-lg text-sm font-bold hover:bg-[#4a7a56] transition-colors flex items-center justify-center gap-2"
                >
                    <FaCheck /> Approve
                </button>
                <button
                    onClick={() => handleAction('reject')}
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                    <FaTimes /> Reject
                </button>
            </div>
        </motion.div>
    );
};

export default PendingPostCard;

// Revision note [2026-07-15 14:27:18 +0300]: Update pastor dashboard group management UI

// Revision note [2026-07-29 18:37:41 +0300]: Refactor token refresh error handler
