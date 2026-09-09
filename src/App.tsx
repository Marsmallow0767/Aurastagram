import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PostProvider, usePosts } from './context/PostContext';
import { ActiveTab, Post, Story, User } from './types';
import { storageService } from './services/storage';

// Components
import { TopHeader } from './components/layout/TopHeader';
import { BottomNav } from './components/layout/BottomNav';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { StoriesBar } from './components/feed/StoriesBar';
import { StoryViewer } from './components/feed/StoryViewer';
import { PostCard } from './components/feed/PostCard';
import { CommentsModal } from './components/feed/CommentsModal';
import { CreatePostModal } from './components/create/CreatePostModal';
import { CreateStoryModal } from './components/create/CreateStoryModal';
import { ExploreGrid } from './components/explore/ExploreGrid';
import { ReelsView } from './components/reels/ReelsView';
import { ProfileView } from './components/profile/ProfileView';
import { EditProfileModal } from './components/profile/EditProfileModal';
import { DirectInbox } from './components/direct/DirectInbox';
import { ChatRoom } from './components/direct/ChatRoom';
import { NotificationsView } from './components/notifications/NotificationsView';
import { Camera, PlusCircle } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, logout, toggleFollow } = useAuth();
  const {
    posts,
    stories,
    reels,
    deletePost,
    toggleLikePost,
    toggleSavePost,
    markStoryViewed,
    refreshData,
  } = usePosts();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [activeCommentPost, setActiveCommentPost] = useState<Post | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  // If not authenticated, render Login / Register
  if (!currentUser) {
    if (authMode === 'login') {
      return <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />;
    } else {
      return <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />;
    }
  }

  // Handle story opening
  const handleOpenStory = (story: Story) => {
    setActiveStory(story);
    markStoryViewed(story.id);
  };

  // Determine user to show in profile tab
  const profileUser = viewedUserId
    ? storageService.getUserById(viewedUserId) || currentUser
    : currentUser;

  const isMyProfile = profileUser.id === currentUser.id;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-start overflow-x-hidden">
      {/* MOBILE CONTAINER WRAPPER */}
      <div className="w-full max-w-md min-h-screen bg-black flex flex-col relative pb-13">
        {/* TOP HEADER (on Home, Notifications, Reels) */}
        {['home', 'reels'].includes(activeTab) && (
          <TopHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            unreadMessagesCount={0}
            unreadNotificationsCount={0}
          />
        )}

        {/* ================= TABS CONTENT ================= */}

        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <main className="flex-1 w-full">
            {/* Stories carousel */}
            <StoriesBar
              currentUser={currentUser}
              stories={stories}
              onOpenStory={handleOpenStory}
              onAddStory={() => setIsCreateStoryOpen(true)}
            />

            {/* Posts feed */}
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center my-10 space-y-4">
                <div className="w-20 h-20 rounded-full border-2 border-[#262626] flex items-center justify-center bg-[#121212]">
                  <Camera className="w-10 h-10 text-[#0095f6]" />
                </div>
                <h2 className="text-lg font-bold">Instagram'a Hoş Geldin!</h2>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Akışınız şu an boş. Arkadaşlarınızın görmesi için ilk fotoğrafınızı paylaşın veya hikaye ekleyin.
                </p>
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-xs px-5 py-2.5 rounded-lg active:scale-95 transition-transform flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  İlk Gönderini Paylaş
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[#262626]">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUser={currentUser}
                    onLike={toggleLikePost}
                    onSave={toggleSavePost}
                    onOpenComments={(p) => setActiveCommentPost(p)}
                    onDeletePost={deletePost}
                    onOpenProfile={(uid) => {
                      setViewedUserId(uid);
                      setActiveTab('profile');
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        )}

        {/* 2. EXPLORE TAB */}
        {activeTab === 'explore' && (
          <ExploreGrid
            posts={posts}
            onOpenPost={(post) => setActiveCommentPost(post)}
            onOpenProfile={(uid) => {
              setViewedUserId(uid);
              setActiveTab('profile');
            }}
          />
        )}

        {/* 3. REELS TAB */}
        {activeTab === 'reels' && (
          <ReelsView reels={reels} currentUser={currentUser} />
        )}

        {/* 4. PROFILE TAB */}
        {activeTab === 'profile' && (
          <ProfileView
            user={profileUser}
            isCurrentUser={isMyProfile}
            posts={posts}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onLogout={logout}
            onOpenPost={(post) => setActiveCommentPost(post)}
            onToggleFollow={(uid) => toggleFollow(uid)}
            isFollowing={currentUser.following.includes(profileUser.id)}
          />
        )}

        {/* 5. DIRECT TAB */}
        {activeTab === 'direct' && (
          activeChatUser ? (
            <ChatRoom
              currentUser={currentUser}
              targetUser={activeChatUser}
              onBack={() => setActiveChatUser(null)}
            />
          ) : (
            <DirectInbox
              currentUser={currentUser}
              onBack={() => setActiveTab('home')}
              onSelectChat={(user) => setActiveChatUser(user)}
            />
          )
        )}

        {/* 6. NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <NotificationsView
            notifications={storageService.getNotifications(currentUser.id)}
            currentUser={currentUser}
            onBack={() => setActiveTab('home')}
            onOpenProfile={(uid) => {
              setViewedUserId(uid);
              setActiveTab('profile');
            }}
          />
        )}

        {/* ================= BOTTOM NAVIGATION ================= */}
        {['home', 'explore', 'reels', 'profile'].includes(activeTab) && (
          <BottomNav
            activeTab={activeTab}
            setActiveTab={(tab) => {
              if (tab === 'profile') setViewedUserId(null); // Return to own profile
              setActiveTab(tab);
            }}
            currentUser={currentUser}
            onOpenCreate={() => setIsCreateOpen(true)}
          />
        )}

        {/* ================= MODALS & OVERLAYS ================= */}

        {/* Create Post Modal */}
        {isCreateOpen && (
          <CreatePostModal
            onClose={() => setIsCreateOpen(false)}
            onPostCreated={() => {
              refreshData();
              setActiveTab('home');
            }}
          />
        )}

        {/* Create Story Modal */}
        {isCreateStoryOpen && (
          <CreateStoryModal
            onClose={() => setIsCreateStoryOpen(false)}
            onStoryCreated={() => {
              refreshData();
              setActiveTab('home');
            }}
          />
        )}

        {/* Story Viewer */}
        {activeStory && (
          <StoryViewer
            stories={stories}
            initialStory={activeStory}
            onClose={() => setActiveStory(null)}
            currentUserId={currentUser.id}
          />
        )}

        {/* Comments Modal */}
        {activeCommentPost && (
          <CommentsModal
            post={activeCommentPost}
            currentUser={currentUser}
            onClose={() => setActiveCommentPost(null)}
          />
        )}

        {/* Edit Profile Modal */}
        {isEditProfileOpen && (
          <EditProfileModal
            user={currentUser}
            onClose={() => setIsEditProfileOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PostProvider>
        <MainApp />
      </PostProvider>
    </AuthProvider>
  );
}
