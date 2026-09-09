export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  bio?: string;
  website?: string;
  followers: string[]; // user IDs
  following: string[]; // user IDs
  verified?: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  filter?: string;
  location?: string;
  likes: string[]; // user IDs who liked
  commentsCount: number;
  savedBy?: string[]; // user IDs who saved
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  text: string;
  likes: string[];
  createdAt: string;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  mediaUrl: string;
  caption?: string;
  createdAt: string;
  views: string[]; // user IDs
}

export interface Reel {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  mediaUrl: string;
  caption: string;
  audioTitle: string;
  likes: string[];
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderAvatar: string;
  text: string;
  mediaUrl?: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'follow';
  fromUserId: string;
  fromUsername: string;
  fromUserAvatar: string;
  postId?: string;
  postImage?: string;
  createdAt: string;
  isRead: boolean;
}

export type ActiveTab = 'home' | 'explore' | 'create' | 'reels' | 'profile' | 'direct' | 'notifications';
