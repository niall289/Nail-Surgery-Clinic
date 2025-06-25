import React from 'react';
import { cn } from '@/lib/utils';

// Define the journey steps for visualization
const journeySteps = [
  { id: 'patient_info', label: 'Personal Info', description: 'Basic contact details' },
  { id: 'symptoms', label: 'Symptoms', description: 'Describe your foot condition' },
  { id: 'photo', label: 'Photos', description: 'Provide images if available' },
  { id: 'analysis', label: 'Analysis', description: 'AI analysis of your condition' },
  { id: 'recommendation', label: 'Recommendations', description: 'Next steps & care plan' },
  { id: 'followup', label: 'Follow-up', description: 'Appointment booking & WhatsApp' }
];

// Map chat flow steps to journey steps for progress tracking
const chatStepToJourneyMap: Record<string, string> = {
  // Personal info steps
  'welcome': 'patient_info',
  'name': 'patient_info',
  'phone': 'patient_info',
  'email': 'patient_info',
  'preferred_clinic': 'patient_info',

  // Photo steps
  'upload_image_prompt': 'photo',
  'image_upload_instructions': 'photo',
  'image_analysis_results': 'photo',

  // Symptoms steps
  'issue_category': 'symptoms',
  'pain_specifics': 'symptoms',
  'skin_specifics': 'symptoms',
  'nail_specifics': 'symptoms',
  'structural_specifics': 'symptoms',
  'other_specifics': 'symptoms',
  'pain_duration': 'symptoms',
  'pain_severity': 'symptoms',
  'additional_info': 'symptoms',

  // Analysis steps
  'symptom_description_prompt': 'analysis',
  'symptom_description': 'analysis',
  'analyzing_symptoms': 'analysis',
  'symptom_analysis_handoff': 'analysis',

  // Recommendation steps
  'previous_treatment': 'recommendation',
  'prepare_transfer': 'recommendation',

  // Follow-up steps
  'confirm': 'followup',
  'calendar_booking': 'followup',
  'booking_confirmation': 'followup',
  'booking_thank_you': 'followup',
  'final_question': 'followup',
  'transfer_whatsapp': 'followup',
  'whatsapp_handoff': 'followup',
  'provide_phone': 'followup',
  'end': 'followup',
  'goodbye': 'followup'
};

interface PatientJourneyTrackerProps {
  currentChatStep: string;
  className?: string;
  primaryColor?: string;
}

const DEFAULT_TRACKER_PRIMARY_COLOR = "hsl(186, 100%, 30%)"; // Default teal

export function PatientJourneyTracker({
  currentChatStep,
  className,
  primaryColor = DEFAULT_TRACKER_PRIMARY_COLOR
}: PatientJourneyTrackerProps) {
  // Determine the current journey step
  const currentJourneyStep = chatStepToJourneyMap[currentChatStep] || 'patient_info';

  // Find the index of the current journey step
  const currentIndex = journeySteps.findIndex(step => step.id === currentJourneyStep);

  return (
    <div className={cn("w-full px-3 py-2 bg-slate-50 rounded-lg shadow-sm", className)}> {/* Adjusted padding and background */}
      {/* <h3 className="text-xs font-medium text-primary mb-1 text-center md:text-left" style={{ color: primaryColor }}>Consultation Progress</h3> */}

      {/* Progress bar - made more minimal */}
      <div className="relative h-1.5 bg-gray-200 rounded-full mb-2 overflow-hidden"> {/* Reduced height and margin */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-in-out"
          style={{
            width: `${Math.max(5, ((currentIndex + 1) / journeySteps.length) * 100)}%`,
            backgroundColor: primaryColor
          }}
        />
      </div>

      {/* Steps visualization */}
      <div className="flex flex-wrap gap-2 justify-between">
        {journeySteps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <div 
              key={step.id}
              className={cn(
                "flex flex-col items-center transition-all",
                isActive ? "scale-110" : "",
                index > currentIndex + 1 ? "opacity-40" : ""
              )}
            >
              {/* Step indicator */}
              <div 
                className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full mb-0.5 text-xs font-medium border-2", // Reduced size
                  isCompleted ? `text-white border-transparent` :
                  isActive ? `text-white border-transparent` :
                  "border-gray-300 text-gray-500 bg-white"
                )}
                style={{
                  backgroundColor: isCompleted || isActive ? primaryColor : 'white',
                  borderColor: isActive ? primaryColor : (isCompleted ? primaryColor : 'rgb(209 213 219)')
                }}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}> {/* Adjusted stroke width */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Step label - only show for current and adjacent steps on mobile */}
              <span
                className={cn(
                  "text-[10px] font-medium text-center", // Reduced font size
                  isActive ? `text-primary` : "text-gray-500",
                  (index < currentIndex - 1 || index > currentIndex + 1) ? "hidden sm:block" : ""
                )}
                style={{ color: isActive ? primaryColor : undefined }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current step description - made more subtle */}
      {currentIndex >= 0 && (
        <div className="mt-1.5 text-center">
          <span className="text-[10px] text-gray-500">
            {journeySteps[currentIndex].label}: {journeySteps[currentIndex].description}
          </span>
        </div>
      )}
    </div>
  );
}