// FootCare Clinic Configuration

export const CLINIC_CONFIG = {
  name: 'The FootCare Clinic',
  source: 'footcare',
  chatbotSource: 'footcare',
  domain: 'footcareclinic.engageiobots.com',
  imagePrefix: 'foot_image',
  webhookPath: 'footcare'
};

export const ENDPOINT_CONFIG = {
  apiPrefix: '/api/v1',
  webhookPath: '/webhook',
  partialPath: '/webhook/partial'
};

export const DB_CONFIG = {
  consultationsTable: 'footcare_consultations',
  storageTable: 'footcare_files'
};

// Required Environment Variables
export const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'PORTAL_WEBHOOK_URL', // Optional, defaults to https://eteaportal.engageiobots.com/api/webhooks/footcare
  'WEBHOOK_SECRET',
  'PORT' // Optional, defaults to 3000
];