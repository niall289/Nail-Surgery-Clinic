import { FC } from "react";

interface Option {
  text: string;
  value: string;
}

interface ChatOptionsProps {
  options: Option[];
  onSelect: (option: Option) => void;
  primaryColor?: string;
}

const DEFAULT_OPTIONS_PRIMARY_COLOR = "hsl(186, 100%, 30%)"; // Default teal

const ChatOptions: FC<ChatOptionsProps> = ({ options, onSelect, primaryColor = DEFAULT_OPTIONS_PRIMARY_COLOR }) => {
  // Dynamic style for hover state using primaryColor
  const hoverStyle = {
    '--hover-bg-color': primaryColor,
    '--hover-text-color': 'white', // Assuming primaryColor contrasts well with white
  } as React.CSSProperties;

  return (
    <div className="mb-3 ml-0 md:ml-11 animate-fadeIn"> {/* Adjusted margin for better flow, added animation */}
      <div className="flex flex-wrap gap-2"> {/* Use flex-wrap for responsive button layout */}
        {options.map((option, index) => (
          <button
            key={index}
            className="text-sm bg-white text-gray-700 font-medium py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm
                       transition-all duration-200 ease-in-out transform hover:scale-105
                       focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={hoverStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = primaryColor;
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.borderColor = primaryColor;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = 'rgb(55 65 81)'; // text-gray-700
              e.currentTarget.style.borderColor = 'rgb(209 213 219)'; // border-gray-300
            }}
            onClick={() => onSelect(option)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatOptions;