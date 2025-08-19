const fetch = require('node-fetch');

// Configuration
const config = {
  accountId: '43ef1ae06a833b3b9d8ff2f63490423c',
  apiToken: 'riLqlGfx8ATFDeyPmbDazdCmRbGs3Vnt4aqSP-EN'
};

async function testR2ServiceStatus() {
  console.log('🔍 Testing R2 Service Status');
  console.log('============================');
  console.log('Account ID:', config.accountId);
  
  try {
    // Test 1: Check if R2 service is available
    console.log('\n1️⃣ Testing R2 Service Availability...');
    const r2TestUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage`;
    
    const response = await fetch(r2TestUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response Status:', response.status);
    
    if (response.status === 404) {
      console.log('❌ R2 Service NOT AVAILABLE - 404 Not Found');
      console.log('💡 This means R2 Object Storage is not enabled on your account');
    } else if (response.status === 403) {
      console.log('❌ R2 Service NOT ACCESSIBLE - 403 Forbidden');
      console.log('💡 This means R2 exists but your API token lacks permissions');
    } else if (response.status === 200) {
      console.log('✅ R2 Service AVAILABLE - 200 OK');
      const result = await response.json();
      console.log('R2 Info:', JSON.stringify(result, null, 2));
    } else {
      console.log('⚠️  Unexpected response:', response.status);
      const error = await response.text();
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message);
  }
  
  try {
    // Test 2: Check account plan and services
    console.log('\n2️⃣ Testing Account Services...');
    const accountUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}`;
    
    const accountResponse = await fetch(accountUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Account Response Status:', accountResponse.status);
    
    if (accountResponse.ok) {
      const accountResult = await accountResponse.json();
      console.log('✅ Account access successful');
      console.log('Account Name:', accountResult.result?.name);
      console.log('Account Plan:', accountResult.result?.type);
      console.log('Account Settings:', accountResult.result?.settings);
    } else {
      const error = await accountResponse.text();
      console.log('❌ Account access failed:', error);
    }
    
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message);
  }
  
  try {
    // Test 3: Check if R2 bucket exists (using S3-compatible endpoint)
    console.log('\n3️⃣ Testing R2 Bucket Access...');
    const bucketUrl = `https://43ef1ae06a833b3b9d8ff2f63490423c.r2.cloudflarestorage.com/tao-materials-bucket`;
    
    const bucketResponse = await fetch(bucketUrl, {
      method: 'HEAD',
      headers: {
        'Host': '43ef1ae06a833b3b9d8ff2f63490423c.r2.cloudflarestorage.com'
      }
    });
    
    console.log('Bucket Response Status:', bucketResponse.status);
    
    if (bucketResponse.status === 200) {
      console.log('✅ Bucket exists and is accessible');
    } else if (bucketResponse.status === 404) {
      console.log('❌ Bucket does not exist');
    } else if (bucketResponse.status === 403) {
      console.log('❌ Bucket exists but access denied');
    } else {
      console.log('⚠️  Unexpected bucket response:', bucketResponse.status);
    }
    
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message);
  }
  
  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log('If R2 service is not available, you need to:');
  console.log('1. Upgrade to a paid Cloudflare plan');
  console.log('2. Enable R2 Object Storage add-on');
  console.log('3. Or use alternative storage solutions');
}

// Run the test
testR2ServiceStatus().catch(console.error);
