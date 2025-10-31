#!/usr/bin/env node

/**
 * Simple script to test the debug webhook endpoint
 * Uses Node 18 native fetch API
 */

const ENDPOINT = 'http://localhost:5021/api/debug/test-webhook';

async function pingDebugEndpoint() {
  try {
    console.log('🔍 Pinging debug webhook endpoint...');
    console.log(`📡 URL: ${ENDPOINT}`);
    console.log('');
    
    const response = await fetch(ENDPOINT, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log('📋 Response Headers:');
    for (const [key, value] of response.headers) {
      console.log(`  ${key}: ${value}`);
    }
    console.log('');
    
    const responseText = await response.text();
    
    try {
      const jsonData = JSON.parse(responseText);
      console.log('✅ JSON Response:');
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (parseError) {
      console.log('❌ Failed to parse JSON response:');
      console.log('Raw response:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Error pinging endpoint:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Hint: Make sure the server is running on port 5021');
      console.log('   Try: npm run dev:server');
    }
  }
}

// Run the ping
pingDebugEndpoint();