import { gql } from '@apollo/client';

export const GET_BLOG_POSTS = gql`
  query GetBlogPosts($filters: BlogPostFilterInput, $limit: Int, $offset: Int) {
    blogPosts(filters: $filters, limit: $limit, offset: $offset) {
      id
      title
      slug
      excerpt
      featuredImage
      category
      tags
      author {
        id
        fullName
        role
      }
      status
      viewsCount
      likesCount
      commentsCount
      savesCount
      isLikedByUser
      isSavedByUser
      publishedAt
      createdAt
      isFeatured
      isPinned
    }
  }
`;

export const GET_BLOG_POST = gql`
  query GetBlogPost($id: Int, $slug: String) {
    blogPost(id: $id, slug: $slug) {
      id
      title
      slug
      content
      excerpt
      featuredImage
      category
      tags
      author {
        id
        fullName
        role
      }
      status
      viewsCount
      likesCount
      commentsCount
      savesCount
      isLikedByUser
      isSavedByUser
      publishedAt
      createdAt
      allowComments
      isFeatured
      isPinned
      comments {
        id
        content
        createdAt
        member {
          id
          fullName
          role
        }
        repliesCount
        replies {
          id
          content
          createdAt
          member {
            id
            fullName
            role
          }
        }
      }
    }
  }
`;

export const GET_MY_BLOG_POSTS = gql`
  query GetMyBlogPosts {
    myBlogPosts {
      id
      title
      slug
      excerpt
      featuredImage
      category
      tags
      author {
        id
        fullName
        role
      }
      status
      viewsCount
      likesCount
      commentsCount
      savesCount
      isLikedByUser
      isSavedByUser
      publishedAt
      createdAt
      isFeatured
      isPinned
    }
  }
`;

export const GET_PENDING_BLOG_POSTS = gql`
  query GetPendingBlogPosts {
    pendingBlogPosts {
      id
      title
      excerpt
      author {
        id
        fullName
      }
      category
      createdAt
    }
  }
`;

export const GET_SAVED_BLOG_POSTS = gql`
  query GetSavedBlogPosts {
    savedBlogPosts {
      id
      title
      excerpt
      featuredImage
      author {
        id
        fullName
      }
      createdAt
    }
  }
`;

export const GET_BLOG_STATS = gql`
  query GetBlogStats {
    blogStats {
      totalPosts
      myPostsCount
      pendingPostsCount
    }
  }
`;

export const CREATE_BLOG_POST = gql`
  mutation CreateBlogPost($input: BlogPostInput!) {
    createBlogPost(input: $input) {
      success
      message
      blogPost {
        id
        title
        slug
        status
      }
    }
  }
`;

export const UPDATE_BLOG_POST = gql`
  mutation UpdateBlogPost($id: Int!, $input: BlogPostInput!) {
    updateBlogPost(id: $id, input: $input) {
      success
      message
      blogPost {
        id
        slug
      }
    }
  }
`;

export const DELETE_BLOG_POST = gql`
  mutation DeleteBlogPost($id: Int!) {
    deleteBlogPost(id: $id) {
      success
      message
    }
  }
`;

export const APPROVE_BLOG_POST = gql`
  mutation ApproveBlogPost($input: ApprovalActionInput!) {
    approveBlogPost(input: $input) {
      success
      message
      blogPost {
        id
        status
      }
    }
  }
`;

export const CREATE_BLOG_COMMENT = gql`
  mutation CreateBlogComment($input: BlogCommentInput!) {
    createBlogComment(input: $input) {
      success
      message
      comment {
        id
        content
        createdAt
        member {
          id
          fullName
        }
      }
    }
  }
`;

export const DELETE_BLOG_COMMENT = gql`
  mutation DeleteBlogComment($id: Int!) {
    deleteBlogComment(id: $id) {
      success
      message
    }
  }
`;

export const TOGGLE_BLOG_LIKE = gql`
  mutation ToggleBlogLike($blogPostId: Int!) {
    toggleBlogLike(blogPostId: $blogPostId) {
      success
      message
      isLiked
      likesCount
    }
  }
`;

export const TOGGLE_BLOG_SAVE = gql`
  mutation ToggleBlogSave($blogPostId: Int!) {
    toggleBlogSave(blogPostId: $blogPostId) {
      success
      message
      isSaved
    }
  }
`;

// Revision note [2026-07-23 18:18:13 +0300]: Improve dark mode CSS variable consistency

// Revision note [2026-08-07 09:22:34 +0300]: Enhance member contribution table filters

// Activity update [2026-07-20 15:33:16 +0300]: Refactor component state and UI layout
