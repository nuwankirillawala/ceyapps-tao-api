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

## 📚 Documentation

All documentation has been organized into the `docs/` folder:

- **📖 [Documentation Overview](docs/README.md)** - Complete documentation index
- **🚀 [Supabase Deployment Guide](docs/SUPABASE_DEPLOYMENT_GUIDE.md)** - Production deployment guide
- **🔧 [Quick Fix Summary](docs/QUICK_FIX_SUMMARY.md)** - Common issues and solutions
- **📋 [Feature Documentation](docs/)** - Individual feature guides

---

## 🚀 Quick Start

### 1. **Clone & Install**
```bash
git clone <repo-url>
cd tao-backend
yarn install
```

### 2. **Environment Setup**
Copy `production.env.example` to `.env` and update with your values:
```bash
cp production.env.example .env
# Edit .env with your actual credentials
```

### 3. **Database Setup**
```bash
yarn prisma generate
yarn prisma migrate dev
```

### 4. **Run Application**
```bash
yarn start:dev
```

---

## 📖 API Documentation

- **Swagger UI**: [http://localhost:3000/api](http://localhost:3000/api)
- **Full Documentation**: See [docs/](docs/) folder

---

## 🧪 Testing

```bash
yarn test         # unit tests
yarn test:e2e     # end-to-end tests
yarn test:cov     # coverage
```

**Note**: Test files are organized in the `test-files/` folder and excluded from version control for security.

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
