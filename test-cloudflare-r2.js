const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

// Configuration - using your actual values
const config = {
  accountId: '43ef1ae06a833b3b9d8ff2f63490423c',
  apiToken: 'riLqlGfx8ATFDeyPmbDazdCmRbGs3Vnt4aqSP-EN',
  bucketName: 'tao-materials-bucket',
  r2AccessKeyId: 'fa40214d333161b940811a7bed7683d6',
  r2SecretAccessKey: '087fa81f010c9bd7db92dd71875770a60b92eb80e990d526e9443d16cf03495b',
  testFilePath: './test-file.txt' // Create a small test file
};

// Create a test file if it doesn't exist
if (!fs.existsSync(config.testFilePath)) {
  fs.writeFileSync(config.testFilePath, 'This is a test file for Cloudflare R2 upload testing.');
  console.log(`Created test file: ${config.testFilePath}`);
}

async function testMethod1_CloudflareR2API() {
  console.log('\n🔍 Testing Method 1: Cloudflare R2 API with API Token');
  
  try {
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/buckets/${config.bucketName}/objects/${encodeURIComponent(objectKey)}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(config.testFilePath));
    formData.append('metadata', JSON.stringify({ test: true, method: 'r2-api' }));
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS - R2 API worked!');
      console.log('Result:', JSON.stringify(result, null, 2));
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - R2 API error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - R2 API:', error.message);
    return false;
  }
}

async function testMethod2_S3CompatibleAPI() {
  console.log('\n🔍 Testing Method 2: S3-Compatible API with API Token');
  
  try {
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    const uploadUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${objectKey}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const fileBuffer = fs.readFileSync(config.testFilePath);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = now.toISOString().split('T')[0];
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'text/plain',
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'x-amz-date': amzDate,
        'Date': date,
      },
      body: fileBuffer,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ SUCCESS - S3-Compatible API worked!');
      console.log('File uploaded successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - S3-Compatible API error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - S3-Compatible API:', error.message);
    return false;
  }
}

async function testMethod3_CloudflareR2APIDirect() {
  console.log('\n🔍 Testing Method 3: Cloudflare R2 API Direct (without object key)');
  
  try {
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/buckets/${config.bucketName}/objects`;
    
    console.log('Upload URL:', uploadUrl);
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(config.testFilePath));
    formData.append('metadata', JSON.stringify({ test: true, method: 'r2-api-direct' }));
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS - R2 API Direct worked!');
      console.log('Result:', JSON.stringify(result, null, 2));
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - R2 API Direct error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - R2 API Direct:', error.message);
    return false;
  }
}

async function testMethod4_CloudflareR2APIGet() {
  console.log('\n🔍 Testing Method 4: Test R2 API Access (GET request)');
  
  try {
    const testUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/buckets/${config.bucketName}/objects`;
    
    console.log('Test URL:', testUrl);
    
    const response = await fetch(testUrl, {
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
      console.log('✅ SUCCESS - R2 API access confirmed!');
      console.log('Result:', JSON.stringify(result, null, 2));
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - R2 API access error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - R2 API access:', error.message);
    return false;
  }
}

async function testMethod5_CloudflareAccountAccess() {
  console.log('\n🔍 Testing Method 5: Test Cloudflare Account Access');
  
  try {
    const testUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}`;
    
    console.log('Test URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS - Account access confirmed!');
      console.log('Account Name:', result.result?.name);
      console.log('Account Settings:', result.result?.settings);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - Account access error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - Account access:', error.message);
    return false;
  }
}

async function testMethod6_R2CredentialsAPI() {
  console.log('\n🔍 Testing Method 6: R2 Credentials API (NEW!)');
  
  try {
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    const uploadUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${objectKey}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const fileBuffer = fs.readFileSync(config.testFilePath);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = now.toISOString().split('T')[0];
    
    // Use R2 credentials instead of API token
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `AWS4-HMAC-SHA256 Credential=${config.r2AccessKeyId}/${date}/auto/s3/aws4_request`,
        'Content-Type': 'text/plain',
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'x-amz-date': amzDate,
        'Date': date,
      },
      body: fileBuffer,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ SUCCESS - R2 Credentials API worked!');
      console.log('File uploaded successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - R2 Credentials API error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - R2 Credentials API:', error.message);
    return false;
  }
}

async function testMethod7_R2CredentialsAPISimple() {
  console.log('\n🔍 Testing Method 7: R2 Credentials API Simple (NEW!)');
  
  try {
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    const uploadUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${objectKey}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const fileBuffer = fs.readFileSync(config.testFilePath);
    
    // Simple approach with just basic headers
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`, // Try API token with S3 endpoint
        'Content-Type': 'text/plain',
      },
      body: fileBuffer,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ SUCCESS - R2 Simple API worked!');
      console.log('File uploaded successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - R2 Simple API error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - R2 Simple API:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Cloudflare R2 Upload Tests');
  console.log('=====================================');
  console.log('Account ID:', config.accountId);
  console.log('Bucket Name:', config.bucketName);
  console.log('Test File:', config.testFilePath);
  console.log('R2 Access Key ID:', config.r2AccessKeyId);
  console.log('API Token:', config.apiToken ? '***SET***' : 'NOT SET');
  
  const results = [];
  
  // Test account access first
  results.push(await testMethod5_CloudflareAccountAccess());
  
  // Test R2 API access
  results.push(await testMethod4_CloudflareR2APIGet());
  
  // Test upload methods
  results.push(await testMethod1_CloudflareR2API());
  results.push(await testMethod2_S3CompatibleAPI());
  results.push(await testMethod3_CloudflareR2APIDirect());
  results.push(await testMethod6_R2CredentialsAPI());
  results.push(await testMethod7_R2CredentialsAPISimple());
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  const successCount = results.filter(r => r === true).length;
  const totalCount = results.length;
  console.log(`Success: ${successCount}/${totalCount}`);
  
  if (successCount === 0) {
    console.log('\n❌ All tests failed. Possible issues:');
    console.log('1. API token permissions (need R2 Object Storage: Edit)');
    console.log('2. Bucket doesn\'t exist');
    console.log('3. Account ID is incorrect');
    console.log('4. R2 service not enabled on account');
    console.log('5. R2 credentials are incorrect');
  } else if (successCount === totalCount) {
    console.log('\n✅ All tests passed! R2 is working correctly.');
  } else {
    console.log('\n⚠️  Some tests passed, some failed. Check the details above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
