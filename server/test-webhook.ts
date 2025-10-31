import { testWebhookSubmission } from './supabase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runTest() {
  try {
    console.log('\n🔧 Environment Check:');
    const requiredEnvVars = [
      'PORTAL_WEBHOOK_URL',
      'NAIL_WEBHOOK_SECRET',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      process.exit(1);
    }
    
    console.log('✅ All required environment variables found\n');
    
    await testWebhookSubmission();
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
runTest();