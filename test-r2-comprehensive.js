const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');

const config = {
  accountId: '43ef1ae06a833b3b9d8ff2f63490423c',
  bucketName: 'tao-materials-bucket',
  r2AccessKeyId: 'fa40214d333161b940811a7bed7683d6',
  r2SecretAccessKey: '087fa81f010c9bd7db92dd71875770a60b92eb80e990d526e9443d16cf03495b',
  apiToken: 'riLqlGfx8ATFDeyPmbDazdCmRbGs3Vnt4aqSP-EN',
  testFilePath: './test-file.txt'
};

// Create test file if it doesn't exist
if (!fs.existsSync(config.testFilePath)) {
  fs.writeFileSync(config.testFilePath, 'This is a test file for R2 upload testing. Created at: ' + new Date().toISOString());
  console.log('Created test file:', config.testFilePath);
}

console.log('🔍 Cloudflare R2 Comprehensive Test Suite');
console.log('==========================================');
console.log('Account ID:', config.accountId);
console.log('Bucket:', config.bucketName);
console.log('R2 Access Key ID:', config.r2AccessKeyId ? '***SET***' : 'NOT SET');
console.log('R2 Secret Key:', config.r2SecretAccessKey ? '***SET***' : 'NOT SET');
console.log('API Token:', config.apiToken ? '***SET***' : 'NOT SET');
console.log('');

// Test 1: Check R2 Service Status via API
async function testR2ServiceStatus() {
  console.log('📡 Test 1: Checking R2 Service Status...');
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ R2 Service Available:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ R2 Service Error:', errorText);
    }
  } catch (error) {
    console.log('❌ R2 Service Test Failed:', error.message);
  }
  console.log('');
}

// Test 2: Check Bucket Access via R2 API
async function testBucketAccess() {
  console.log('🪣 Test 2: Checking Bucket Access via R2 API...');
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucketName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Bucket Access Successful:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Bucket Access Failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Bucket Access Test Failed:', error.message);
  }
  console.log('');
}

// Test 3: Test S3-Compatible Upload with Proper AWS4 Signing
async function testS3CompatibleUpload() {
  console.log('☁️ Test 3: Testing S3-Compatible Upload with AWS4 Signing...');
  
  try {
    const fileBuffer = fs.readFileSync(config.testFilePath);
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
    const uploadUrl = `${endpoint}/${config.bucketName}/${objectKey}`;
    
    console.log('Upload URL:', uploadUrl);
    
    // Generate AWS4 signature
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = amzDate.substring(0, 8); // Extract YYYYMMDD from amzDate (no hyphens)
    
    // Calculate payload hash
    const payloadHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Create canonical request
    const canonicalHeaders = [
      'content-type:text/plain',
      `host:${config.accountId}.r2.cloudflarestorage.com`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`
    ].sort().join('\n') + '\n';
    
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
    
    const canonicalRequest = [
      'PUT',
      `/${config.bucketName}/${objectKey}`,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');
    
    console.log('Canonical Request:');
    console.log(canonicalRequest);
    console.log('');
    
    // Create string to sign
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      `${date}/auto/s3/aws4_request`,
      canonicalRequestHash
    ].join('\n');
    
    console.log('String to Sign:');
    console.log(stringToSign);
    console.log('');
    
    // Generate signature
    const dateKey = crypto.createHmac('sha256', `AWS4${config.r2SecretAccessKey}`).update(date).digest();
    const dateRegionKey = crypto.createHmac('sha256', dateKey).update('auto').digest();
    const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update('s3').digest();
    const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    console.log('Generated Signature:', signature);
    console.log('');
    
    // Create authorization header
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${config.r2AccessKeyId}/${date}/auto/s3/aws4_request,SignedHeaders=${signedHeaders},Signature=${signature}`;
    
    console.log('Authorization Header:', authorizationHeader);
    console.log('');
    
    // Perform upload
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Host': `${config.accountId}.r2.cloudflarestorage.com`,
        'Authorization': authorizationHeader
      },
      body: fileBuffer,
    });
    
    console.log('Upload Response Status:', response.status);
    console.log('Upload Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ S3-Compatible Upload Successful!');
      console.log('File URL:', uploadUrl);
    } else {
      const errorText = await response.text();
      console.log('❌ S3-Compatible Upload Failed:', errorText);
    }
  } catch (error) {
    console.log('❌ S3-Compatible Upload Test Failed:', error.message);
  }
  console.log('');
}

// Test 4: Test R2 API Direct Upload
async function testR2APIDirectUpload() {
  console.log('🚀 Test 4: Testing R2 API Direct Upload...');
  
  try {
    const fileBuffer = fs.readFileSync(config.testFilePath);
    const objectKey = `test-uploads/${Date.now()}-test-file-r2api.txt`;
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucketName}/objects/${encodeURIComponent(objectKey)}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), 'test-file.txt');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
      },
      body: formData,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ R2 API Upload Successful:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ R2 API Upload Failed:', errorText);
    }
  } catch (error) {
    console.log('❌ R2 API Upload Test Failed:', error.message);
    }
  console.log('');
}

// Test 5: Test Bucket Listing
async function testBucketListing() {
  console.log('📋 Test 5: Testing Bucket Listing...');
  
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/r2/buckets/${config.bucketName}/objects`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Bucket Listing Successful:', result);
    } else {
      const errorText = await response.text();
      console.log('❌ Bucket Listing Failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Bucket Listing Test Failed:', error.message);
  }
  console.log('');
}

// Test 6: Test Account Services
async function testAccountServices() {
  console.log('🏢 Test 6: Testing Account Services...');
  
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Account Access Successful');
      console.log('Account Name:', result.result?.name);
      console.log('Account Type:', result.result?.type);
      console.log('Account Settings:', result.result?.settings);
    } else {
      const errorText = await response.text();
      console.log('❌ Account Access Failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Account Services Test Failed:', error.message);
  }
  console.log('');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive R2 Tests...\n');
  
  await testR2ServiceStatus();
  await testBucketAccess();
  await testS3CompatibleUpload();
  await testR2APIDirectUpload();
  await testBucketListing();
  await testAccountServices();
  
  console.log('🏁 All tests completed!');
  console.log('\n📝 Next Steps:');
  console.log('1. Check the output above for any error messages');
  console.log('2. If R2 service is not available, ensure R2 is enabled in your Cloudflare dashboard');
  console.log('3. Verify your API token has the correct permissions for R2');
  console.log('4. Check that your bucket exists and is properly configured');
}

// Run tests
runAllTests().catch(console.error);
