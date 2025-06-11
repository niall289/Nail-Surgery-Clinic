import React from 'react';

interface NurseAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  avatarUrl?: string; // Added avatarUrl prop
}

const DEFAULT_AVATAR_SRC = "/assets/images/nurse-fiona.png";

/**
 * Fiona nurse avatar component
 * Uses an image of an Irish nurse with red hair and teal scrubs, or a custom URL.
 */
const NurseAvatar: React.FC<NurseAvatarProps> = ({ size = 'md', avatarUrl }) => {
  // Determine size class
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-12 w-12' : 'h-16 w-16';
  const imageSrc = avatarUrl || DEFAULT_AVATAR_SRC;

  return (
    <div className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 bg-white flex items-center justify-center border-2 border-primary shadow-md`}>
      <img
        src={imageSrc}
        alt="Chatbot Avatar" // More generic alt text
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default NurseAvatar;