import { User, Post, Comment, Story, Reel, Message, NotificationItem } from '../types';

const STORAGE_KEYS = {
  USERS: 'aurastagram_users',
  CURRENT_USER: 'aurastagram_current_user',
  POSTS: 'aurastagram_posts',
  COMMENTS: 'aurastagram_comments',
  STORIES: 'aurastagram_stories',
  REELS: 'aurastagram_reels',
  MESSAGES: 'aurastagram_messages',
  NOTIFICATIONS: 'aurastagram_notifications',
  USER_PASSWORDS: 'aurastagram_user_passwords',
};

// Default avatar generator with clean initials or gradient
export function getDefaultAvatar(username: string): string {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=121212,262626,1a1a1a&textColor=ffffff`;
}

// STORAGE HELPERS
function getJson<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return defaultValue;
  }
}

function setJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to storage`, e);
  }
}

// USER AUTH & DATABASE
export const storageService = {
  // USERS
  getUsers(): User[] {
    return getJson<User[]>(STORAGE_KEYS.USERS, []);
  },

  getUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find(u => u.id === id);
  },

  getUserByUsername(username: string): User | undefined {
    const users = this.getUsers();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  saveUser(user: User, password?: string): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }
    setJson(STORAGE_KEYS.USERS, users);

    if (password) {
      const passwords = getJson<Record<string, string>>(STORAGE_KEYS.USER_PASSWORDS, {});
      passwords[user.id] = password;
      setJson(STORAGE_KEYS.USER_PASSWORDS, passwords);
    }

    // Update current user if matching
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
      setJson(STORAGE_KEYS.CURRENT_USER, user);
    }
  },

  verifyPassword(userId: string, passwordAttempt: string): boolean {
    const passwords = getJson<Record<string, string>>(STORAGE_KEYS.USER_PASSWORDS, {});
    return passwords[userId] === passwordAttempt;
  },

  getCurrentUser(): User | null {
    return getJson<User | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: User | null): void {
    setJson(STORAGE_KEYS.CURRENT_USER, user);
  },

  // POSTS
  getPosts(): Post[] {
    return getJson<Post[]>(STORAGE_KEYS.POSTS, []);
  },

  getPostById(id: string): Post | undefined {
    return this.getPosts().find(p => p.id === id);
  },

  savePost(post: Post): void {
    const posts = this.getPosts();
    const index = posts.findIndex(p => p.id === post.id);
    if (index >= 0) {
      posts[index] = post;
    } else {
      posts.unshift(post); // newest first
    }
    setJson(STORAGE_KEYS.POSTS, posts);
  },

  deletePost(postId: string): void {
    const posts = this.getPosts().filter(p => p.id !== postId);
    setJson(STORAGE_KEYS.POSTS, posts);

    // Delete comments for this post
    const comments = this.getComments().filter(c => c.postId !== postId);
    setJson(STORAGE_KEYS.COMMENTS, comments);
  },

  toggleLikePost(postId: string, userId: string): { liked: boolean; count: number } {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return { liked: false, count: 0 };

    const liked = post.likes.includes(userId);
    if (liked) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
    }
    setJson(STORAGE_KEYS.POSTS, posts);
    return { liked: !liked, count: post.likes.length };
  },

  toggleSavePost(postId: string, userId: string): boolean {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return false;

    if (!post.savedBy) post.savedBy = [];
    const isSaved = post.savedBy.includes(userId);
    if (isSaved) {
      post.savedBy = post.savedBy.filter(id => id !== userId);
    } else {
      post.savedBy.push(userId);
    }
    setJson(STORAGE_KEYS.POSTS, posts);
    return !isSaved;
  },

  // COMMENTS
  getComments(): Comment[] {
    return getJson<Comment[]>(STORAGE_KEYS.COMMENTS, []);
  },

  getCommentsByPostId(postId: string): Comment[] {
    return this.getComments()
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  addComment(comment: Comment): void {
    const comments = this.getComments();
    comments.push(comment);
    setJson(STORAGE_KEYS.COMMENTS, comments);

    // Update post comments count
    const posts = this.getPosts();
    const post = posts.find(p => p.id === comment.postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      setJson(STORAGE_KEYS.POSTS, posts);
    }
  },

  toggleLikeComment(commentId: string, userId: string): boolean {
    const comments = this.getComments();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return false;

    const liked = comment.likes.includes(userId);
    if (liked) {
      comment.likes = comment.likes.filter(id => id !== userId);
    } else {
      comment.likes.push(userId);
    }
    setJson(STORAGE_KEYS.COMMENTS, comments);
    return !liked;
  },

  // STORIES
  getStories(): Story[] {
    // Keep stories newer than 24 hours
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const stories = getJson<Story[]>(STORAGE_KEYS.STORIES, []).filter(s => {
      return (now - new Date(s.createdAt).getTime()) < twentyFourHours;
    });
    setJson(STORAGE_KEYS.STORIES, stories);
    return stories;
  },

  addStory(story: Story): void {
    const stories = this.getStories();
    stories.unshift(story);
    setJson(STORAGE_KEYS.STORIES, stories);
  },

  markStoryViewed(storyId: string, userId: string): void {
    const stories = this.getStories();
    const story = stories.find(s => s.id === storyId);
    if (story && !story.views.includes(userId)) {
      story.views.push(userId);
      setJson(STORAGE_KEYS.STORIES, stories);
    }
  },

  // REELS
  getReels(): Reel[] {
    return getJson<Reel[]>(STORAGE_KEYS.REELS, []);
  },

  saveReel(reel: Reel): void {
    const reels = this.getReels();
    reels.unshift(reel);
    setJson(STORAGE_KEYS.REELS, reels);
  },

  toggleLikeReel(reelId: string, userId: string): boolean {
    const reels = this.getReels();
    const reel = reels.find(r => r.id === reelId);
    if (!reel) return false;
    const liked = reel.likes.includes(userId);
    if (liked) {
      reel.likes = reel.likes.filter(id => id !== userId);
    } else {
      reel.likes.push(userId);
    }
    setJson(STORAGE_KEYS.REELS, reels);
    return !liked;
  },

  // MESSAGES
  getMessages(conversationId?: string): Message[] {
    const all = getJson<Message[]>(STORAGE_KEYS.MESSAGES, []);
    if (!conversationId) return all;
    return all.filter(m => m.conversationId === conversationId);
  },

  sendMessage(message: Message): void {
    const all = getJson<Message[]>(STORAGE_KEYS.MESSAGES, []);
    all.push(message);
    setJson(STORAGE_KEYS.MESSAGES, all);
  },

  // FOLLOW / UNFOLLOW
  toggleFollow(currentUserId: string, targetUserId: string): boolean {
    if (currentUserId === targetUserId) return false;
    const users = this.getUsers();
    const currentUser = users.find(u => u.id === currentUserId);
    const targetUser = users.find(u => u.id === targetUserId);

    if (!currentUser || !targetUser) return false;

    const isFollowing = currentUser.following.includes(targetUserId);
    if (isFollowing) {
      currentUser.following = currentUser.following.filter(id => id !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
    } else {
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }

    setJson(STORAGE_KEYS.USERS, users);
    setJson(STORAGE_KEYS.CURRENT_USER, currentUser);
    return !isFollowing;
  },

  // NOTIFICATIONS
  getNotifications(userId: string): NotificationItem[] {
    const all = getJson<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return all.filter(n => n.fromUserId !== userId);
  },

  addNotification(notification: NotificationItem): void {
    const all = getJson<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    all.unshift(notification);
    setJson(STORAGE_KEYS.NOTIFICATIONS, all);
  },
};
