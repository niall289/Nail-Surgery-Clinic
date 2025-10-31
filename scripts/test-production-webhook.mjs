#!/usr/bin/env node

/**
 * Production Webhook Test Script
 * Tests the live ETEA Portal webhook endpoint with proper format
 */

const WEBHOOK_URL = 'https://eteaportal.engageiobots.com/api/webhooks/nailsurgery';
const WEBHOOK_SECRET = 'nailsurgery_secret_2025';

async function testProductionWebhook() {
  try {
    console.log('🚀 Testing Production Webhook');
    console.log('📡 URL:', WEBHOOK_URL);
    console.log('🔐 Secret:', WEBHOOK_SECRET.slice(0, 8) + '...');
    console.log('');

    // Test data matching portal specification
    const testData = {
      // Required fields
      name: "Test Patient",
      email: "test@nailsurgery.com",
      phone: "+1234567890",
      
      // Core consultation data
      issue_category: "Ingrown Toenail",
      symptom_description: "Test consultation from chatbot - patient experiencing pain and swelling",
      
      // Optional fields (portal will handle defaults if missing)
      preferred_clinic: "Main Office",
      clinic_domain: "nailsurgeryclinic.engageiobots.com",
      clinic_source: "chatbot_widget",
      
      // Additional optional fields
      issue_specifics: "Sharp pain when walking, redness around nail",
      previous_treatment: "Soaking in warm water",
      pain_severity: "8/10",
      pain_duration: "1 week"
    };

    console.log('📋 Test Data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('');

    // Create FormData exactly as specified
    const formData = new FormData();
    formData.append('data', JSON.stringify(testData));

    console.log('🔄 Sending request...');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'X-Webhook-Secret': WEBHOOK_SECRET
        // Content-Type will be set automatically by fetch for FormData
      },
      body: formData
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
      console.log('✅ JSON Response:');
      console.log(JSON.stringify(responseData, null, 2));
      
      // Check for expected success response
      if (responseData.success && responseData.id) {
        console.log('');
        console.log('🎉 SUCCESS! Consultation created with ID:', responseData.id);
        console.log('✅ Portal integration is working correctly');
        console.log('📋 Check the portal dashboard to verify the consultation appears');
      } else {
        console.log('');
        console.log('⚠️ Unexpected response format - check portal logs');
      }
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:');
      console.log('Raw response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Check your internet connection and webhook URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Portal server might be down - check portal health');
    }
  }
}

console.log('🧪 ETEA Portal Webhook Production Test');
console.log('=====================================');
console.log('');

testProductionWebhook();