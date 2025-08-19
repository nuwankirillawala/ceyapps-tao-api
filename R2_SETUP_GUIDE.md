# 🚀 Cloudflare R2 Setup Guide & Issue Resolution

## ❌ **Current Issues Identified**

### **1. R2 Service Not Enabled**
- **Problem**: Your Cloudflare account doesn't have R2 Object Storage enabled
- **Root Cause**: You're on a "standard" (free) plan
- **Solution**: Upgrade to Pro plan ($20/month) or higher

### **2. API Token Permissions**
- **Problem**: Your token lacks R2 Object Storage permissions
- **Current Token**: `riLqlGfx8ATFDeyPmbDazdCmRbGs3Vnt4aqSP-EN`
- **Required Permissions**: `R2 Object Storage: Edit`

### **3. Environment Variable Issues**
- **Problem**: `CLOUDFLARE_RC_ENDPOINT` format is incorrect
- **Current**: `https://43ef1ae06a833b3b9d8ff2f63490423c.r2.cloudflarestorage.com/tao-materials-bucket`
- **Correct**: Should be separate variables

## 🔧 **Step-by-Step Fixes**

### **Step 1: Enable R2 Service**

1. **Go to Cloudflare Dashboard**: https://dash.cloudflare.com/
2. **Check Current Plan**:
   - Navigate to Account → Billing
   - You're currently on "standard" (free) plan
3. **Upgrade to Pro Plan**:
   - Click "Upgrade Plan"
   - Select "Pro" ($20/month) or "Business" ($200/month)
   - R2 is included in Pro plan and above

### **Step 2: Create R2 Bucket**

1. **Navigate to R2 Object Storage**:
   - In Cloudflare dashboard, click "R2 Object Storage"
2. **Create Bucket**:
   - Click "Create bucket"
   - Name: `tao-materials-bucket`
   - Location: Choose closest to your users
3. **Configure Bucket**:
   - Set public access if needed
   - Configure CORS if required

### **Step 3: Update API Token**

1. **Go to API Tokens**: https://dash.cloudflare.com/profile/api-tokens
2. **Edit Existing Token**:
   - Find token: `riLqlGfx8ATFDeyPmbDazdCmRbGs3Vnt4aqSP-EN`
   - Click "Edit"
3. **Add R2 Permissions**:
   ```
   Account → R2 Object Storage → Edit
   Account → Account Settings → Read
   ```

### **Step 4: Fix Environment Variables**

**Replace your current .env with:**

```bash
# Database Configuration
DATABASE_URL="postgresql://postgres.tkxerdbfidlbpzfgsnbu:ceyapps@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=43ef1ae06a833b3b9d8ff2f63490423c
CLOUDFLARE_API_TOKEN=riLqlGfx8ATFDeyPmbDazdCmRbGs3Vnt4aqSP-EN

# R2 Object Storage Configuration
CLOUDFLARE_R2_BUCKET_NAME=tao-materials-bucket
CLOUDFLARE_R2_ACCESS_KEY_ID=fa40214d333161b940811a7bed7683d6
CLOUDFLARE_R2_SECRET_ACCESS_KEY=087fa81f010c9bd7db92dd71875770a60b92eb80e990d526e9443d16cf03495b

# R2 Endpoints (CORRECTED FORMAT)
CLOUDFLARE_R2_ENDPOINT=https://43ef1ae06a833b3b9d8ff2f63490423c.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_URL=https://43ef1ae06a833b3b9d8ff2f63490423c.r2.cloudflarestorage.com/tao-materials-bucket

# Other Services
STRIPE_SECRET_KEY=test-sc-ky
PORT=3001
```

## 🧪 **Test After Setup**

After completing the setup, run this test:

```bash
node test-cloudflare-r2-fixed.js
```

## 🚨 **Alternative Solutions (If R2 Not Available)**

### **Option 1: AWS S3**
```bash
# Add to .env
AWS_S3_BUCKET_NAME=your-s3-bucket
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=ap-southeast-1
```

### **Option 2: Google Cloud Storage**
```bash
# Add to .env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_CREDENTIALS_FILE=path/to/service-account.json
```

### **Option 3: Azure Blob Storage**
```bash
# Add to .env
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_STORAGE_CONTAINER_NAME=your-container-name
```

## 📊 **Cost Comparison**

| Service | Plan | Monthly Cost | Storage | Bandwidth |
|---------|------|--------------|---------|-----------|
| **Cloudflare R2** | Pro | $20 | 10GB | 1TB |
| **AWS S3** | Pay-as-you-go | ~$5-15 | 1GB | 1GB |
| **Google Cloud** | Pay-as-you-go | ~$5-15 | 1GB | 1GB |

## 🎯 **Recommended Action Plan**

1. **Immediate**: Upgrade to Cloudflare Pro plan ($20/month)
2. **Enable R2**: Create bucket and configure permissions
3. **Update Code**: Use corrected environment variables
4. **Test**: Verify upload functionality works
5. **Monitor**: Check costs and usage

## 🆘 **Need Help?**

If you still face issues after following this guide:
1. Check Cloudflare support documentation
2. Verify your account plan status
3. Ensure R2 service is visible in dashboard
4. Test with a simple file upload first
