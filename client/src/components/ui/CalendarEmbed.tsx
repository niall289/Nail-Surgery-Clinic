
import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';

interface CalendarEmbedProps {
  onBookingComplete?: () => void;
  primaryColor?: string;
}

export function CalendarEmbed({ onBookingComplete, primaryColor = "hsl(186, 100%, 30%)" }: CalendarEmbedProps) {
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
        <div className="flex items-center justify-center gap-2 text-xl font-semibold" style={{ color: primaryColor }}>
          <Calendar className="w-6 h-6" />
          Book Your Appointment
        </div>
        <p className="text-gray-700">Please select your preferred appointment time below:</p>
      </div>

      <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
        <iframe
          src="https://footcareclinic.cliniko.com/bookings"
          style={{ border: 0 }}
          width="100%"
          height="600"
          frameBorder="0"
          scrolling="yes"
          title="FootCare Clinic - Book Appointment"
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
          className="px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: isLoading ? '#9ca3af' : primaryColor,
            ':hover': { backgroundColor: isLoading ? '#9ca3af' : primaryColor }
          }}
        >
          <CheckCircle className="w-4 h-4" />
          {isLoading ? 'Processing...' : 'I\'ve completed my booking'}
        </button>
      </div>
    </div>
  );
}
