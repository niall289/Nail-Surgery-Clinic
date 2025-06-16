import React from 'react';

interface NurseAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  avatarUrl?: string;
}

const DEFAULT_AVATAR_SRC = "./assets/images/nurse-niamh.png";

const NurseAvatar: React.FC<NurseAvatarProps> = ({ size = 'md', avatarUrl }) => {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-12 w-12' : 'h-16 w-16';
  const imageSrc = avatarUrl || DEFAULT_AVATAR_SRC;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 bg-white flex items-center justify-center border-2 border-primary shadow-md`}>
      <img
        src={imageSrc}
        alt="Nurse Avatar"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default NurseAvatar;
