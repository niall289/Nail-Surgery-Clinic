import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle } from 'react-feather';

interface CalendarEmbedProps {
  onBookingComplete?: () => void;
}

export function CalendarEmbed({ onBookingComplete }: CalendarEmbedProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBookingComplete = () => {
    setIsLoading(true);
    // Simulate booking process
    setTimeout(() => {
      setIsLoading(false);
      if (onBookingComplete) {
        onBookingComplete();
      }
    }, 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-xl font-semibold text-teal-700">
          <Calendar className="w-6 h-6" />
          Book Your Appointment
        </div>
        <p className="text-gray-700">Please select your preferred appointment time below:</p>
      </div>

      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        <iframe
          src="https://calendar.google.com/calendar/appointments/schedules/AcZssZ2FER-4uOdAl1_eR5EvCDPtYJw0A59zkJn4I2hFnJYPJrBU_7Mri6JJEBBjdQWg3Q2eo2hbgLDb?gv=true"
          style={{ border: 0 }}
          width="100%"
          height="600"
          frameBorder="0"
          scrolling="no"
          title="Book Appointment Calendar"
        />

        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Processing booking...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4 border-t border-gray-200">
        <button
          onClick={handleBookingComplete}
          disabled={isLoading}
          className="px-8 py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
        >
          <CheckCircle className="w-5 h-5" />
          {isLoading ? 'Processing...' : '✅ I\'ve completed my booking'}
        </button>
      </div>
    </div>
  );
}