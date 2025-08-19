const fetch = require('node-fetch');
const crypto = require('crypto');
const fs = require('fs');

// Configuration - using your actual values
const config = {
  accountId: '43ef1ae06a833b3b9d8ff2f63490423c',
  bucketName: 'tao-materials-bucket',
  r2AccessKeyId: 'fa40214d333161b940811a7bed7683d6',
  r2SecretAccessKey: '087fa81f010c9bd7db92dd71875770a60b92eb80e990d526e9443d16cf03495b',
  testFilePath: './test-file.txt'
};

// Create a test file if it doesn't exist
if (!fs.existsSync(config.testFilePath)) {
  fs.writeFileSync(config.testFilePath, 'This is a test file for Cloudflare R2 upload testing.');
  console.log(`Created test file: ${config.testFilePath}`);
}

function generateSignature(stringToSign, secretKey, date, region = 'auto', service = 's3') {
  const dateKey = crypto.createHmac('sha256', `AWS4${secretKey}`).update(date).digest();
  const dateRegionKey = crypto.createHmac('sha256', dateKey).update(region).digest();
  const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update(service).digest();
  const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
  
  return crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
}

function createCanonicalRequest(method, uri, queryString, headers, payloadHash) {
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n') + '\n';
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
  
  return [
    method,
    uri,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
}

function createStringToSign(timestamp, date, region, service, canonicalRequestHash) {
  return [
    'AWS4-HMAC-SHA256',
    timestamp,
    `${date}/${region}/${service}/aws4_request`,
    canonicalRequestHash
  ].join('\n');
}

async function testAWS4SignedUpload() {
  console.log('\n🔍 Testing AWS4-HMAC-SHA256 Signed Upload');
  
  try {
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    const uploadUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${objectKey}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const fileBuffer = fs.readFileSync(config.testFilePath);
    const payloadHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = now.toISOString().split('T')[0];
    
    const headers = {
      'Content-Type': 'text/plain',
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': timestamp,
      'Host': `${config.accountId}.r2.cloudflarestorage.com`
    };
    
    const canonicalRequest = createCanonicalRequest(
      'PUT',
      `/${config.bucketName}/${objectKey}`,
      '',
      headers,
      payloadHash
    );
    
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = createStringToSign(timestamp, date, 'auto', 's3', canonicalRequestHash);
    const signature = generateSignature(stringToSign, config.r2SecretAccessKey, date);
    
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${config.r2AccessKeyId}/${date}/auto/s3/aws4_request,SignedHeaders=${Object.keys(headers).sort().map(k => k.toLowerCase()).join(';')},Signature=${signature}`;
    
    console.log('Authorization Header:', authorizationHeader);
    console.log('Canonical Request Hash:', canonicalRequestHash);
    console.log('String to Sign Hash:', crypto.createHash('sha256').update(stringToSign).digest('hex'));
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        ...headers,
        'Authorization': authorizationHeader,
      },
      body: fileBuffer,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ SUCCESS - AWS4 Signed Upload worked!');
      console.log('File uploaded successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - AWS4 Signed Upload error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - AWS4 Signed Upload:', error.message);
    return false;
  }
}

async function testSimpleR2Credentials() {
  console.log('\n🔍 Testing Simple R2 Credentials (Basic Auth)');
  
  try {
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    const uploadUrl = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${objectKey}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const fileBuffer = fs.readFileSync(config.testFilePath);
    
    // Try basic authentication with R2 credentials
    const auth = Buffer.from(`${config.r2AccessKeyId}:${config.r2SecretAccessKey}`).toString('base64');
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'text/plain',
      },
      body: fileBuffer,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('✅ SUCCESS - Simple R2 Credentials worked!');
      console.log('File uploaded successfully');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - Simple R2 Credentials error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - Simple R2 Credentials:', error.message);
    return false;
  }
}

async function testR2APIDirectUpload() {
  console.log('\n🔍 Testing R2 API Direct Upload (Alternative Endpoint)');
  
  try {
    const objectKey = `test-uploads/${Date.now()}-test-file.txt`;
    // Try alternative R2 API endpoint format
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/storage/buckets/${config.bucketName}/objects/${encodeURIComponent(objectKey)}`;
    
    console.log('Upload URL:', uploadUrl);
    
    const fileBuffer = fs.readFileSync(config.testFilePath);
    
    // Try with R2 credentials as Authorization header
    const auth = Buffer.from(`${config.r2AccessKeyId}:${config.r2SecretAccessKey}`).toString('base64');
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SUCCESS - R2 API Direct Upload worked!');
      console.log('Result:', JSON.stringify(result, null, 2));
      return true;
    } else {
      const error = await response.text();
      console.log('❌ FAILED - R2 API Direct Upload error:');
      console.log(error);
      return false;
    }
  } catch (error) {
    console.log('❌ EXCEPTION - R2 API Direct Upload:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhanced Cloudflare R2 Upload Tests');
  console.log('==============================================');
  console.log('Account ID:', config.accountId);
  console.log('Bucket Name:', config.bucketName);
  console.log('Test File:', config.testFilePath);
  console.log('R2 Access Key ID:', config.r2AccessKeyId);
  console.log('R2 Secret Access Key:', config.r2SecretAccessKey ? '***SET***' : 'NOT SET');
  
  const results = [];
  
  // Test different approaches
  results.push(await testAWS4SignedUpload());
  results.push(await testSimpleR2Credentials());
  results.push(await testR2APIDirectUpload());
  
  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  const successCount = results.filter(r => r === true).length;
  const totalCount = results.length;
  console.log(`Success: ${successCount}/${totalCount}`);
  
  if (successCount === 0) {
    console.log('\n❌ All tests failed. Next steps:');
    console.log('1. Fix API token permissions in Cloudflare dashboard');
    console.log('2. Verify R2 bucket exists and is accessible');
    console.log('3. Check if R2 service is enabled on your account');
    console.log('4. Verify R2 credentials are correct');
  } else if (successCount === totalCount) {
    console.log('\n✅ All tests passed! R2 is working correctly.');
  } else {
    console.log('\n⚠️  Some tests passed, some failed. Check the details above.');
  }
}

// Run the tests
runAllTests().catch(console.error);
