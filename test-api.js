/**
 * Test script for VLM Liturgical Data Proxy API
 * Run with: API_KEY=your-key-here node test-api.js
 */

const API_URL = 'https://vlm-liturgical-data-proxy.vercel.app/api/data/version.json';
const API_KEY = process.env.API_KEY;

async function testAPI() {
  console.log('🧪 Testing VLM Liturgical Data Proxy API\n');
  console.log(`Testing URL: ${API_URL}\n`);
  
  if (!API_KEY) {
    console.error('❌ Error: API_KEY environment variable is required');
    console.error('   Usage: API_KEY=your-key-here node test-api.js\n');
    process.exit(1);
  }
  
  console.log('='.repeat(50));

  try {
    const startTime = Date.now();
    
    console.log('\n📤 Making request with X-Api-Key header...');
    const response = await fetch(API_URL, {
      headers: {
        'X-Api-Key': API_KEY
      }
    });
    const duration = Date.now() - startTime;

    console.log(`\n✅ Response received in ${duration}ms`);
    console.log(`HTTP Status: ${response.status} ${response.statusText}`);
    
    // Log headers
    console.log('\n📋 Response Headers:');
    console.log(`  Cache-Control: ${response.headers.get('cache-control') || 'Not set'}`);
    console.log(`  Content-Type: ${response.headers.get('content-type') || 'Not set'}`);
    
    // Get response body
    const contentType = response.headers.get('content-type') || '';
    let data;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
      console.log('\n📦 Response Body (JSON):');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('\n📦 Response Body (Text):');
      console.log(text.substring(0, 500) + (text.length > 500 ? '...' : ''));
    }

    // Check for errors
    if (!response.ok) {
      console.log(`\n❌ Error: ${response.status} ${response.statusText}`);
      if (data && data.error) {
        console.log(`   Error message: ${data.error}`);
        console.log(`   Details: ${data.details || 'No details'}`);
      }
    } else {
      console.log('\n✅ Request successful!');
    }

  } catch (error) {
    console.error('\n❌ Request failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Tip: Check Vercel logs for detailed [API] prefixed logs');
  console.log('   View logs at: https://vercel.com/dashboard');
}

// Run the test
testAPI();

