import React from 'react';

interface NurseIconProps {
  size?: 'sm' | 'md' | 'lg';
}

const NurseIcon: React.FC<NurseIconProps> = ({ size = 'md' }) => {
  // Determine size class
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-10 w-10' : 'h-12 w-12';

  return (
    <div className={`${sizeClass} rounded-full bg-primary flex items-center justify-center`}>
      <svg 
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-3/4 w-3/4 text-white"
        stroke="currentColor"
      >
        <path
          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
        />
      </svg>
    </div>
  );
};

export default NurseIcon;