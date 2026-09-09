import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Post, Story, Reel, Comment } from '../types';
import { storageService } from '../services/storage';
import { useAuth } from './AuthContext';

interface PostContextType {
  posts: Post[];
  stories: Story[];
  reels: Reel[];
  refreshData: () => void;
  createPost: (imageUrl: string, caption: string, filter?: string, location?: string) => Post;
  deletePost: (postId: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleSavePost: (postId: string) => boolean;
  createStory: (mediaUrl: string, caption?: string) => Story;
  markStoryViewed: (storyId: string) => void;
  addComment: (postId: string, text: string) => Comment;
  getComments: (postId: string) => Comment[];
  toggleLikeComment: (commentId: string) => boolean;
  createReel: (mediaUrl: string, caption: string, audioTitle?: string) => Reel;
  toggleLikeReel: (reelId: string) => void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);

  const refreshData = useCallback(() => {
    setPosts(storageService.getPosts());
    setStories(storageService.getStories());
    setReels(storageService.getReels());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const createPost = (imageUrl: string, caption: string, filter?: string, location?: string): Post => {
    if (!currentUser) throw new Error('Must be logged in to create post');

    const newPost: Post = {
      id: 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      imageUrl,
      caption,
      filter: filter || 'normal',
      location: location || '',
      likes: [],
      commentsCount: 0,
      savedBy: [],
      createdAt: new Date().toISOString(),
    };

    storageService.savePost(newPost);
    refreshData();
    return newPost;
  };

  const deletePost = (postId: string) => {
    storageService.deletePost(postId);
    refreshData();
  };

  const toggleLikePost = (postId: string) => {
    if (!currentUser) return;
    storageService.toggleLikePost(postId, currentUser.id);
    refreshData();
  };

  const toggleSavePost = (postId: string): boolean => {
    if (!currentUser) return false;
    const res = storageService.toggleSavePost(postId, currentUser.id);
    refreshData();
    return res;
  };

  const createStory = (mediaUrl: string, caption?: string): Story => {
    if (!currentUser) throw new Error('Must be logged in to create story');

    const newStory: Story = {
      id: 'story_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      mediaUrl,
      caption: caption || '',
      createdAt: new Date().toISOString(),
      views: [],
    };

    storageService.addStory(newStory);
    refreshData();
    return newStory;
  };

  const markStoryViewed = (storyId: string) => {
    if (!currentUser) return;
    storageService.markStoryViewed(storyId, currentUser.id);
    refreshData();
  };

  const addComment = (postId: string, text: string): Comment => {
    if (!currentUser) throw new Error('Must be logged in to comment');

    const newComment: Comment = {
      id: 'cmt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      postId,
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      text: text.trim(),
      likes: [],
      createdAt: new Date().toISOString(),
    };

    storageService.addComment(newComment);
    refreshData();
    return newComment;
  };

  const getComments = (postId: string): Comment[] => {
    return storageService.getCommentsByPostId(postId);
  };

  const toggleLikeComment = (commentId: string): boolean => {
    if (!currentUser) return false;
    const res = storageService.toggleLikeComment(commentId, currentUser.id);
    refreshData();
    return res;
  };

  const createReel = (mediaUrl: string, caption: string, audioTitle?: string): Reel => {
    if (!currentUser) throw new Error('Must be logged in');

    const newReel: Reel = {
      id: 'reel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userId: currentUser.id,
      username: currentUser.username,
      userAvatar: currentUser.avatar,
      mediaUrl,
      caption,
      audioTitle: audioTitle || 'Orijinal Ses - ' + currentUser.username,
      likes: [],
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date().toISOString(),
    };

    storageService.saveReel(newReel);
    refreshData();
    return newReel;
  };

  const toggleLikeReel = (reelId: string) => {
    if (!currentUser) return;
    storageService.toggleLikeReel(reelId, currentUser.id);
    refreshData();
  };

  return (
    <PostContext.Provider
      value={{
        posts,
        stories,
        reels,
        refreshData,
        createPost,
        deletePost,
        toggleLikePost,
        toggleSavePost,
        createStory,
        markStoryViewed,
        addComment,
        getComments,
        toggleLikeComment,
        createReel,
        toggleLikeReel,
      }}
    >
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};
