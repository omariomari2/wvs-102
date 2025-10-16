// Simple API test script
// Run with: node test-api.js

const API_BASE = 'http://localhost:8787'; // Update with your worker URL

async function testAPI() {
  console.log('🧪 Testing AI Security Scanner API...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test scan initiation
    console.log('\n2. Testing scan initiation...');
    const scanResponse = await fetch(`${API_BASE}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://httpbin.org' })
    });
    const scanData = await scanResponse.json();
    console.log('✅ Scan initiated:', scanData);

    if (scanData.scanId) {
      // Wait a bit for scan to complete
      console.log('\n3. Waiting for scan to complete...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Test scan status
      console.log('4. Testing scan status...');
      const statusResponse = await fetch(`${API_BASE}/api/scan/status/status`);
      const statusData = await statusResponse.json();
      console.log('✅ Scan status:', statusData.scanResult ? 'Completed' : 'In progress');

      if (statusData.scanResult) {
        // Test chat
        console.log('\n5. Testing chat functionality...');
        const chatResponse = await fetch(`${API_BASE}/api/chat/${scanData.scanId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'What are the main security issues found?' })
        });
        const chatData = await chatResponse.json();
        console.log('✅ Chat response:', chatData.message.substring(0, 100) + '...');
      }
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the worker is running with: npm run dev');
  }
}

testAPI();
