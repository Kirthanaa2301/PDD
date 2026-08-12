const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting AsthmaSense API Automated Test Suite...\n');

  // Test 1: Root endpoint
  try {
    const res = await fetch(`${BASE_URL}/`);
    const data = await res.json();
    console.log('✅ [1/4] Root Endpoint Status:', res.status, data);
  } catch (err) {
    console.error('❌ [1/4] Root Endpoint Failed:', err.message);
  }

  // Test 2: Health Check endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/breathing/health`);
    const data = await res.json();
    console.log('✅ [2/4] Health Check Status:', res.status, data);
  } catch (err) {
    console.error('❌ [2/4] Health Check Failed:', err.message);
  }

  // Test 3: Grok AI Chat endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What are 3 quick tips to manage asthma symptoms during cold weather?',
      }),
    });
    const data = await res.json();
    console.log('✅ [3/4] Grok Chat Endpoint Status:', res.status);
    console.log('   Reply Preview:', (data.reply || '').slice(0, 120) + '...');
    console.log('   Model Used:', data.model);
    console.log('   Saved to DB:', data.savedToDb);
  } catch (err) {
    console.error('❌ [3/4] Grok Chat Endpoint Failed:', err.message);
  }

  // Test 4: Chat History endpoint
  try {
    const res = await fetch(`${BASE_URL}/api/chat/history?sessionId=default`);
    const data = await res.json();
    console.log('✅ [4/4] Chat History Status:', res.status, `Fetched ${Array.isArray(data) ? data.length : 0} items`);
  } catch (err) {
    console.error('❌ [4/4] Chat History Failed:', err.message);
  }

  console.log('\n✨ API Test Suite Complete!');
}

runTests();
