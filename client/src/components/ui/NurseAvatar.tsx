import React from 'react';

interface NurseAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  avatarUrl?: string;
}

const DEFAULT_AVATAR_SRC = "https://nailsurgeryclinic.engageiobots.com/assets/images/nurse-niamh.png";

const NurseAvatar: React.FC<NurseAvatarProps> = ({ size = 'md', avatarUrl }) => {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-12 w-12' : 'h-16 w-16';
  const imageSrc = avatarUrl || DEFAULT_AVATAR_SRC;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 bg-primary flex items-center justify-center border-2 border-white shadow-md`}>
      <img
        src={imageSrc}
        alt="Nurse Avatar"
        className="w-full h-full object-cover"
        onError={(e) => {
          // Fallback to a simple icon if image fails to load
          e.currentTarget.style.display = 'none';
          e.currentTarget.parentElement!.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="h-3/4 w-3/4 text-white">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          `;
        }}
      />
    </div>
  );
};

export default NurseAvatar;
