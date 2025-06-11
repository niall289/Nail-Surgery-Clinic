
import React from 'react';

export function CalendarEmbed() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          📅 Book Your Appointment
        </h3>
        <p className="text-blue-700 mb-4">
          Please select your preferred appointment time below:
        </p>
      </div>

      <div className="w-full">
        <iframe 
          src="https://footcareclinic-ireland.eu1.cliniko.com/bookings#location"
          className="w-full h-96 border-0 rounded-lg"
          title="FootCare Clinic Booking Calendar"
          loading="lazy"
        />
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-blue-600">
          Having trouble? Call us at: <strong>089 9678596</strong>
        </p>
      </div>
    </div>
  );
}