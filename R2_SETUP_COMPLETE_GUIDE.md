# 🚀 Complete Cloudflare R2 Setup Guide

## 🔍 **Current Status (Based on Test Results)**
- ✅ Account Access: Working
- ❌ R2 Service: Not Available ("No route for that URI")
- ❌ Account Type: Still shows "standard" (needs verification)
- ❌ S3-Compatible: Date format fixed in code

## 🎯 **Step 1: Verify Your Plan Upgrade**

### Check Your Current Plan
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click on your account name (top right)
3. Go to **Billing** → **Plans & Usage**
4. **Verify you see "Pro" or higher plan** (not "standard")

### If Still on Standard Plan
- Contact Cloudflare support to confirm your upgrade
- Ensure the upgrade includes **R2 Object Storage**
- Wait 24-48 hours for changes to propagate

## 🎯 **Step 2: Enable R2 Service**

### Navigate to R2
1. In your Cloudflare dashboard, go to **R2** in the left sidebar
2. If you don't see R2, click **"Get started with R2"**

### Enable R2
1. Click **"Enable R2"** button
2. Accept the terms of service
3. Wait for activation (usually 5-10 minutes)

## 🎯 **Step 3: Create Your Bucket**

### Create Bucket
1. In R2 dashboard, click **"Create bucket"**
2. **Bucket name**: `tao-materials-bucket`
3. **Location**: Choose closest to your users (e.g., "Asia Pacific")
4. Click **"Create bucket"**

### Configure Bucket
1. Click on your bucket name
2. Go to **Settings** tab
3. **Public bucket**: Enable if you want public access
4. **CORS**: Configure if needed for web uploads

## 🎯 **Step 4: Create R2 API Tokens**

### Create API Token
1. Go to **My Profile** → **API Tokens**
2. Click **"Create Token"**
3. **Use template**: "Custom token"
4. **Permissions**:
   - **Account**: `Cloudflare R2:Edit`
   - **Zone**: `Zone:Read` (if needed)
5. **Account resources**: Select your account
6. Click **"Continue to summary"** → **"Create Token"**

### Create R2 Credentials
1. In R2 dashboard, go to **Manage R2 API tokens**
2. Click **"Create API token"**
3. **Token name**: `tao-r2-token`
4. **Permissions**: `Object Read & Write`
5. **Bucket**: Select `tao-materials-bucket`
6. Click **"Create API token"**
7. **Save the Access Key ID and Secret Access Key**

## 🎯 **Step 5: Update Your Environment Variables**

### Update `.env` File
```bash
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=43ef1ae06a833b3b9d8ff2f63490423c
CLOUDFLARE_API_TOKEN=YOUR_NEW_API_TOKEN_WITH_R2_PERMISSIONS

# R2 Configuration
CLOUDFLARE_R2_BUCKET_NAME=tao-materials-bucket
CLOUDFLARE_R2_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_ENDPOINT=https://43ef1ae06a833b3b9d8ff2f63490423c.r2.cloudflarestorage.com
```

### Important Notes
- **Remove** `CLOUDFLARE_R2_BUCKET_URL` (not needed)
- **Restart** your application after updating `.env`
- **Verify** all variables are set correctly

## 🎯 **Step 6: Test R2 Service**

### Run Test Script
```bash
node test-r2-comprehensive.js
```

### Expected Results
- ✅ R2 Service Status: Available
- ✅ Bucket Access: Successful
- ✅ S3-Compatible Upload: Working
- ✅ R2 API Upload: Working

## 🎯 **Step 7: Test Your Application**

### Test File Upload
```bash
curl -X POST "http://localhost:3001/cloudflare/upload/file" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test-file.txt"
```

### Expected Response
```json
{
  "id": "uploads/1234567890-test-file.txt",
  "url": "https://43ef1ae06a833b3b9d8ff2f63490423c.r2.cloudflarestorage.com/tao-materials-bucket/uploads/1234567890-test-file.txt",
  "filename": "test-file.txt",
  "size": 123,
  "uploaded": "2025-08-19T06:17:35.000Z",
  "metadata": {}
}
```

## 🚨 **Troubleshooting**

### "No route for that URI" Error
- **Cause**: R2 service not enabled or plan doesn't include R2
- **Solution**: Verify plan upgrade and R2 service activation

### "InvalidArgument: Credential signed date" Error
- **Cause**: Date format mismatch in AWS4 signing
- **Solution**: ✅ Fixed in latest code update

### "R2 configuration is incomplete" Error
- **Cause**: Missing environment variables
- **Solution**: Check all R2 variables in `.env`

### "403 Forbidden" Error
- **Cause**: Insufficient API token permissions
- **Solution**: Ensure token has `Cloudflare R2:Edit` permission

## 📞 **Need Help?**

### Cloudflare Support
- **Documentation**: [R2 Getting Started](https://developers.cloudflare.com/r2/get-started/)
- **Community**: [Cloudflare Community](https://community.cloudflare.com/)
- **Support**: [Contact Support](https://support.cloudflare.com/)

### Common Issues
1. **Plan upgrade not reflected**: Wait 24-48 hours
2. **R2 not visible**: Ensure plan includes R2 storage
3. **Bucket creation fails**: Check bucket name uniqueness
4. **API token issues**: Verify permissions and scope

## 🎉 **Success Checklist**

- [ ] Account upgraded to Pro or higher
- [ ] R2 service enabled in dashboard
- [ ] Bucket `tao-materials-bucket` created
- [ ] API token with R2 permissions created
- [ ] R2 credentials (Access Key + Secret) generated
- [ ] Environment variables updated and verified
- [ ] Application restarted
- [ ] Test script runs successfully
- [ ] File upload works in application

---

**Last Updated**: August 19, 2025  
**Status**: Code fixes applied, awaiting R2 service activation
