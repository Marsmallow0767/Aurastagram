import React from 'react';
import { Plus } from 'lucide-react';
import { Story, User } from '../../types';

interface StoriesBarProps {
  currentUser: User | null;
  stories: Story[];
  onOpenStory: (story: Story) => void;
  onAddStory: () => void;
}

export const StoriesBar: React.FC<StoriesBarProps> = ({
  currentUser,
  stories,
  onOpenStory,
  onAddStory,
}) => {
  // Group stories by user (or unique user avatars)
  const userStoryMap = new Map<string, Story>();
  stories.forEach((s) => {
    if (!userStoryMap.has(s.userId)) {
      userStoryMap.set(s.userId, s);
    }
  });

  const currentUserStory = currentUser ? userStoryMap.get(currentUser.id) : null;
  const otherUserStories = Array.from(userStoryMap.values()).filter(
    (s) => s.userId !== currentUser?.id
  );

  return (
    <div className="w-full bg-black py-3 border-b border-[#262626]">
      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar px-3.5">
        {/* CURRENT USER STORY BUTTON */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="relative cursor-pointer" onClick={currentUserStory ? () => onOpenStory(currentUserStory) : onAddStory}>
            <div
              className={`w-17 h-17 rounded-full p-0.5 flex items-center justify-center ${
                currentUserStory
                  ? currentUserStory.views.includes(currentUser?.id || '')
                    ? 'story-seen'
                    : 'story-gradient'
                  : 'border border-neutral-800'
              }`}
            >
              <div className="w-full h-full rounded-full bg-black p-0.5 overflow-hidden">
                <img
                  src={currentUser?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                  alt="Hikayen"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>

            {!currentUserStory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddStory();
                }}
                className="absolute bottom-0.5 right-0.5 bg-[#0095f6] text-white rounded-full p-1 border-2 border-black hover:scale-110 active:scale-95 transition-transform"
                aria-label="Hikaye Ekle"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
              </button>
            )}
          </div>
          <span className="text-[11px] text-neutral-300 font-normal tracking-tight truncate max-w-16">
            Hikayen
          </span>
        </div>

        {/* OTHER USERS STORIES */}
        {otherUserStories.map((story) => {
          const isSeen = story.views.includes(currentUser?.id || '');
          return (
            <div
              key={story.id}
              onClick={() => onOpenStory(story)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <div
                className={`w-17 h-17 rounded-full p-0.5 flex items-center justify-center ${
                  isSeen ? 'story-seen' : 'story-gradient'
                }`}
              >
                <div className="w-full h-full rounded-full bg-black p-0.5 overflow-hidden">
                  <img
                    src={story.userAvatar}
                    alt={story.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              <span className="text-[11px] text-neutral-300 font-normal tracking-tight truncate max-w-16">
                {story.username}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
