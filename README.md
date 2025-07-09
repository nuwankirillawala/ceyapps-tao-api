# Tao Backend API

A comprehensive Learning Management System (LMS) API built with **NestJS**, **Prisma**, and **Cloudflare video streaming**.

---

## 🚀 Features

- **Authentication & Authorization**: JWT, role-based (ADMIN, INSTRUCTOR, STUDENT), password reset, user profile
- **Course Management**: CRUD, instructor assignment, demo videos, materials
- **Lesson Management**: CRUD, video integration, course/standalone endpoints
- **Material Management**: CRUD, file URLs
- **Cloudflare Video**: Upload, stream (signed URLs), thumbnails, metadata, demo/lesson videos
- **API Docs**: Interactive Swagger UI, request/response examples

---

## 🛠️ Tech Stack

- **NestJS** (Node.js framework)
- **Prisma** (PostgreSQL ORM)
- **Cloudflare Stream** (video)
- **Swagger** (API docs)
- **Multer** (file upload)
- **class-validator** (validation)

---

## 🚀 Deployment on Render

### **Prerequisites**
- Supabase database (already configured)
- Cloudflare account for video streaming
- GitHub repository

### **Render Setup**

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `tao-backend`
   - **Environment**: `Node`
   - **Build Command**: `yarn install && yarn prisma generate && yarn build`
   - **Start Command**: `node dist/main`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=your_supabase_connection_string
   JWT_SECRET=your_jwt_secret_key
   CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
   CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
   ALLOWED_ORIGINS=your_frontend_url,https://your-app.onrender.com
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Your API will be available at: `https://your-app.onrender.com`

### **Post-Deployment**
- **API Documentation**: `https://your-app.onrender.com/api`
- **Health Check**: `https://your-app.onrender.com/api`

---

## ⚙️ Local Setup

1. **Clone & Install**
   ```bash
   git clone <repo-url>
   cd tao-backend
   yarn install
   ```

2. **Environment Variables**
   Create a `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/tao_db"
   JWT_SECRET="your-secret-key"
   PORT=3000
   CLOUDFLARE_ACCOUNT_ID=your_account_id_here
   CLOUDFLARE_API_TOKEN=your_api_token_here
   ```

3. **Database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma studio # (optional)
   ```

4. **Run**
   ```bash
   yarn start:dev
   # or for production
   yarn start:prod
   ```

---

## 📚 API Documentation

- **Swagger UI**: [http://localhost:3000/api](http://localhost:3000/api)
- **Full Reference**: See `API_DOCUMENTATION.md`
- **Cloudflare Setup**: See `CLOUDFLARE_SETUP.md`

---

## 🎥 Cloudflare Video Integration

- Upload videos: `POST /cloudflare/upload` (form-data: `video`, `metadata`)
- Use returned `uid` as `demoVideoId` (course) or `videoId` (lesson)
- Stream securely with signed URLs: `GET /cloudflare/video/:videoId/stream`
- See `CLOUDFLARE_SETUP.md` for full guide

---

## 🧪 Testing

```bash
yarn test         # unit tests
yarn test:e2e     # end-to-end tests
yarn test:cov     # coverage
```

---

## 📖 Key Endpoints

- **Auth**: `/auth/register`, `/auth/login`
- **User**: `/user/profile`, `/user/logout`, `/user/request-password-reset`
- **Courses**: `/courses` (CRUD), `/courses/:id/lessons`
- **Lessons**: `/lessons/:lessonId` (CRUD)
- **Video**: `/cloudflare/upload`, `/cloudflare/video/:videoId`, `/cloudflare/video/:videoId/stream`

---

## 🔐 Roles

- **ADMIN**: Full access
- **INSTRUCTOR**: Manage courses, lessons, materials, videos
- **STUDENT**: View only

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes & add tests
4. Submit a pull request

---

## 📄 License

MIT

---

**Tao Backend** – A modern LMS with secure video streaming! 🎓🎥
