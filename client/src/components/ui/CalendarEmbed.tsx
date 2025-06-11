
import React, { useEffect, useState } from 'react';
import { Calendar, CheckCircle, Phone, Mail } from 'lucide-react';

interface CalendarEmbedProps {
  onBookingComplete?: () => void;
  primaryColor?: string;
}

export function CalendarEmbed({ onBookingComplete, primaryColor = "hsl(186, 100%, 30%)" }: CalendarEmbedProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [iframeError, setIframeError] = useState(false);

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

  const handleIframeError = () => {
    console.log("Iframe failed to load, showing fallback");
    setIframeError(true);
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
        {!iframeError ? (
          <>
            <iframe
              src="https://footcareclinic.cliniko.com/bookings"
              style={{ border: 0, width: '100%', height: '600px' }}
              frameBorder="0"
              scrolling="yes"
              title="FootCare Clinic - Book Appointment"
              onError={handleIframeError}
              onLoad={() => {
                // Check if iframe content loaded properly
                setTimeout(() => {
                  try {
                    const iframe = document.querySelector('iframe[title="FootCare Clinic - Book Appointment"]') as HTMLIFrameElement;
                    if (iframe && iframe.contentDocument && iframe.contentDocument.body.innerText.includes('not currently available')) {
                      setIframeError(true);
                    }
                  } catch (e) {
                    // Cross-origin restriction, assume it's working
                  }
                }, 2000);
              }}
            />
          </>
        ) : (
          <div className="p-8 text-center space-y-4">
            <Calendar className="w-16 h-16 mx-auto text-gray-400" />
            <h3 className="text-xl font-semibold text-gray-800">Book Your Appointment</h3>
            <p className="text-gray-600">
              Please contact us directly to schedule your appointment using one of the methods below:
            </p>
            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-center gap-2 text-lg">
                <Phone className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="font-semibold">089 9678596</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-lg">
                <Mail className="w-5 h-5" style={{ color: primaryColor }} />
                <span className="font-semibold">info@footcareclinic.ie</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Our team will be happy to help you schedule an appointment that works best for you.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: primaryColor }}></div>
              <p className="text-sm text-gray-600">Processing booking...</p>
            </div>
          </div>
        )}
        
        {!iframeError && (
          <div className="p-4 bg-gray-50 border-t">
            <p className="text-sm text-gray-600 text-center">
              Having trouble with online booking? 
              <br />
              Call us directly at <strong>089 9678596</strong> or email <strong>info@footcareclinic.ie</strong>
            </p>
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
          }}
        >
          <CheckCircle className="w-4 h-4" />
          {isLoading ? 'Processing...' : 'I\'ve completed my booking'}
        </button>
      </div>
    </div>
  );
}
