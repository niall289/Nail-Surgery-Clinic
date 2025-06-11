import React, { useEffect, useState } from 'react';
import { Calendar, ExternalLink } from 'react-feather';

interface CalendarEmbedProps {
  onBookingComplete?: () => void;
  primaryColor?: string;
}

export function CalendarEmbed({ onBookingComplete, primaryColor = "hsl(186, 100%, 30%)" }: CalendarEmbedProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleBookingComplete = () => {
    if (onBookingComplete) {
      onBookingComplete();
    }
  };

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

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-blue-700">
            <Calendar className="h-5 w-5" />
            <h3 className="font-medium">Book Your Appointment</h3>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            Click below to open our booking system in a new tab
          </p>
        </div>

        <button
          onClick={() => window.open('https://calendly.com/footcare-clinic', '_blank')}
          className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center space-x-2"
          style={{ backgroundColor: primaryColor }}
        >
          <ExternalLink className="h-4 w-4" />
          <span>Open Booking Calendar</span>
        </button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-yellow-800">
            📅 Please complete your booking in the new tab, then click the button below to continue.
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={handleBookingComplete}
            className="bg-green-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ✅ I've completed my booking
          </button>
        </div>
      </div>
    </div>
  );
}