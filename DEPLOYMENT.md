# 🚀 Render Deployment Guide

## ✅ **Fixed Issues**

### **1. Lockfile Update**
- ✅ Updated `yarn.lock` with new dependencies (express, webpack)
- ✅ Modified Dockerfile to handle lockfile updates gracefully
- ✅ Updated build script to be more flexible

### **2. Prisma Schema**
- ✅ Fixed Dockerfile to properly copy `prisma/` directory
- ✅ Removed problematic `postinstall` script
- ✅ Added explicit Prisma generation in build process

### **3. Peer Dependencies**
- ✅ Added `express@^4.18.2` to dependencies
- ✅ Added `webpack@^5.89.0` to devDependencies

## 🔧 **Deployment Steps**

### **1. Push Changes to GitHub**
```bash
git add .
git commit -m "Fix Render deployment - update lockfile and dependencies"
git push origin main
```

### **2. Render Dashboard Setup**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `tao-backend`
   - **Environment**: `Node`
   - **Build Command**: `chmod +x build.sh && ./build.sh`
   - **Start Command**: `node dist/main`

### **3. Environment Variables**
Set these in Render dashboard:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=your_supabase_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
ALLOWED_ORIGINS=your_frontend_url,https://your-app.onrender.com
```

## 🐛 **Troubleshooting**

### **If Build Still Fails:**

1. **Check Render Logs**
   - Go to your service in Render dashboard
   - Click on "Logs" tab
   - Look for specific error messages

2. **Common Issues:**
   - **Lockfile issues**: The build script now handles this automatically
   - **Prisma schema not found**: Fixed in Dockerfile
   - **Peer dependency warnings**: Resolved with new dependencies

3. **Manual Build Test:**
   ```bash
   # Test locally
   yarn install
   yarn prisma generate
   yarn build
   ```

### **Environment Variable Issues:**
- Make sure `DATABASE_URL` is from Supabase (not local)
- Ensure `JWT_SECRET` is a strong, random string
- Verify Cloudflare credentials are correct

## 📊 **Health Checks**

After deployment, test these endpoints:
- **Health Check**: `https://your-app.onrender.com/api`
- **API Docs**: `https://your-app.onrender.com/api`
- **Root**: `https://your-app.onrender.com/`

## 🔄 **Auto-Deploy**

- Render will automatically deploy when you push to `main` branch
- Monitor the deployment in the Render dashboard
- Check logs for any issues

## 📞 **Support**

If you encounter issues:
1. Check Render logs first
2. Verify environment variables
3. Test endpoints after deployment
4. Ensure Supabase connection is working

---

**🎉 Your Tao Backend should now deploy successfully on Render!** 