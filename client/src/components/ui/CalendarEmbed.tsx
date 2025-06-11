
import React from 'react';

interface CalendarEmbedProps {
  onBookingComplete?: () => void;
  primaryColor?: string;
}

export function CalendarEmbed({ onBookingComplete, primaryColor = "hsl(186, 100%, 30%)" }: CalendarEmbedProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 my-4 shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-3" style={{ color: primaryColor }}>
          📅 Book Your Appointment
        </h3>
        <p className="text-gray-700 mb-4">
          Please select your preferred appointment time below:
        </p>
      </div>

      <div className="w-full mb-6">
        <iframe 
          src="https://footcareclinic-ireland.eu1.cliniko.com/bookings#location"
          className="w-full h-[500px] border border-gray-300 rounded-lg"
          title="FootCare Clinic Booking Calendar"
          loading="lazy"
        />
      </div>

      <div className="text-center space-y-4">
        <button
          onClick={onBookingComplete}
          className="w-full py-4 px-6 text-white font-semibold rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
          style={{ backgroundColor: primaryColor }}
        >
          ✅ Done! I've completed my booking
        </button>
        
        <p className="text-sm text-gray-600">
          Having trouble? Call us at: <strong>089 9678596</strong>
        </p>
      </div>
    </div>
  );
}