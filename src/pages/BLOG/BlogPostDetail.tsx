import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaShare, FaCalendar, FaUser, FaReply } from 'react-icons/fa';
import { GET_BLOG_POST, CREATE_BLOG_COMMENT, TOGGLE_BLOG_LIKE, TOGGLE_BLOG_SAVE } from '../../api/blog';
import { ME_QUERY } from '../../api/queries';

const BlogPostDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [commentContent, setCommentContent] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<number | null>(null);

    // Determine if id param is numeric ID or Slug
    const isNumericParam = /^\d+$/.test(id || '');
    const queryVariables = isNumericParam
        ? { id: parseInt(id!) }
        : { slug: id };

    const { data, loading, error, refetch } = useQuery(GET_BLOG_POST, {
        variables: queryVariables,
    });

    const { data: userData } = useQuery(ME_QUERY);
    const [createComment] = useMutation(CREATE_BLOG_COMMENT);
    const [toggleLike] = useMutation(TOGGLE_BLOG_LIKE);
    const [toggleSave] = useMutation(TOGGLE_BLOG_SAVE);

    const post = data?.blogPost;
    const comments = post?.comments || [];

    const handleLike = async () => {
        if (!post) return;
        try {
            await toggleLike({ variables: { blogPostId: parseInt(post.id) } });
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        if (!post) return;
        try {
            await toggleSave({ variables: { blogPostId: parseInt(post.id) } });
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent, parentId?: number) => {
        e.preventDefault();
        const content = parentId ? replyContent : commentContent;
        if (!content.trim() || !post) return;

        try {
            await createComment({
                variables: {
                    input: {
                        blogPostId: parseInt(post.id),
                        content,
                        parentCommentId: parentId
                    }
                }
            });
            setCommentContent('');
            setReplyContent('');
            setReplyingTo(null);
            refetch();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5E936C]"></div>
        </div>
    );

    if (error || !post) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <p className="text-xl text-gray-500 mb-4">Post not found</p>
            <button onClick={() => navigate('/blog')} className="text-[#5E936C] font-bold">Go Back</button>
        </div>
    );

    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(post.publishedAt || post.createdAt));

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[500px]">
                {post.featuredImage ? (
                    <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-[#5E936C] to-[#4a7a56] pattern-grid-lg"></div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>

                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-5xl mx-auto w-full">
                    <button
                        onClick={() => navigate('/blog')}
                        className="absolute top-8 left-6 md:left-12 text-white flex items-center gap-2 hover:underline"
                    >
                        <FaArrowLeft /> Back to Blog
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="inline-block px-3 py-1 bg-white bg-opacity-20 backdrop-blur-md rounded-full text-white text-xs font-bold mb-4 border border-white border-opacity-30">
                            {post.category?.replace(/_/g, ' ')}
                        </span>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-white text-sm font-medium">
                            <div className="flex items-center gap-2">
                                {/* <div className="w-10 h-10 rounded-full bg-white text-[#5E936C] flex items-center justify-center font-bold text-lg">
                  {post.author?.fullName?.charAt(0)}
                </div> */}
                                <div className="w-8 h-8 rounded-full bg-[#5E936C] border-2 border-white flex items-center justify-center text-white font-bold text-xs">
                                    {post.author?.fullName?.charAt(0) || 'A'}
                                </div>
                                <span>{post.author?.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-200">
                                <FaCalendar />
                                <span>{formattedDate}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
                    {/* Action Bar */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-8 mb-8">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleLike}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${post.isLikedByUser ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {post.isLikedByUser ? <FaHeart /> : <FaRegHeart />}
                                <span className="font-bold">{post.likesCount}</span>
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSave}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${post.isSavedByUser ? 'bg-green-50 text-[#5E936C]' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                            >
                                {post.isSavedByUser ? <FaBookmark /> : <FaRegBookmark />}
                                <span className="font-bold">{post.savesCount > 0 ? post.savesCount : 'Save'}</span>
                            </motion.button>
                        </div>

                        <button className="text-gray-400 hover:text-gray-600">
                            <FaShare size={20} />
                        </button>
                    </div>

                    {/* Post Content */}
                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
                        {post.content.split('\n').map((paragraph: string, idx: number) => (
                            paragraph.trim() && <p key={idx} className="mb-4">{paragraph}</p>
                        ))}
                    </div>

                    {post.tags && (
                        <div className="mt-10 pt-6 border-t border-gray-100 flex gap-2 flex-wrap">
                            {post.tags.split(',').map((tag: string) => (
                                <span key={tag} className="text-gray-500 text-sm font-medium px-3 py-1 bg-gray-50 rounded-lg"># {tag.trim()}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Comments Section */}
                {post.allowComments && (
                    <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
                        <h3 className="text-2xl font-bold text-gray-800 mb-8">Comments ({comments.length})</h3>

                        <div className="mb-10 flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-gray-500">
                                <FaUser />
                            </div>
                            <form onSubmit={handleCommentSubmit} className="flex-1">
                                <textarea
                                    value={commentContent}
                                    onChange={(e) => setCommentContent(e.target.value)}
                                    placeholder="Share your thoughts..."
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:border-[#5E936C] focus:ring-2 focus:ring-[#5E936C] focus:ring-opacity-20 transition-all outline-none resize-none bg-gray-50 focus:bg-white min-h-[100px]"
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="submit"
                                        disabled={!commentContent.trim()}
                                        className="bg-[#5E936C] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#4a7a56] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Post Comment
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-8">
                            {comments.map((comment: any) => (
                                <div key={comment.id} className="group">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                                            {comment.member?.fullName?.charAt(0)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-gray-50 p-4 rounded-xl rounded-tl-none">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="font-bold text-gray-900">{comment.member?.fullName}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(comment.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700">{comment.content}</p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 ml-2">
                                                <button
                                                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                                    className="font-medium hover:text-[#5E936C] flex items-center gap-1"
                                                >
                                                    <FaReply /> Reply
                                                </button>
                                            </div>

                                            {/* Reply Input */}
                                            {replyingTo === comment.id && (
                                                <motion.form
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onSubmit={(e) => handleCommentSubmit(e, parseInt(comment.id))}
                                                    className="mt-4 flex gap-3"
                                                >
                                                    <input
                                                        type="text"
                                                        value={replyContent}
                                                        onChange={(e) => setReplyContent(e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#5E936C]"
                                                        autoFocus
                                                    />
                                                    <button
                                                        type="submit"
                                                        className="bg-[#5E936C] text-white px-4 py-2 rounded-lg text-sm font-bold"
                                                    >
                                                        Reply
                                                    </button>
                                                </motion.form>
                                            )}

                                            {/* Nested Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="mt-4 space-y-4 pl-4 border-l-2 border-gray-100">
                                                    {comment.replies.map((reply: any) => (
                                                        <div key={reply.id} className="flex gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0 text-xs">
                                                                {reply.member?.fullName?.charAt(0)}
                                                            </div>
                                                            <div className="flex-1 bg-gray-50 p-3 rounded-lg rounded-tl-none">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-bold text-sm text-gray-900">{reply.member?.fullName}</span>
                                                                    <span className="text-[10px] text-gray-400">
                                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <p className="text-gray-700 text-sm">{reply.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogPostDetail;

// Revision note [2026-07-14 14:43:31 +0300]: Refactor offering entry table structure

// Revision note [2026-07-28 18:41:46 +0300]: Refactor card application status badges

// Revision note [2026-08-12 09:22:29 +0300]: Enhance form input validation and feedback
