#!/bin/bash

echo "🚀 Starting Tao Backend build process..."

# Install dependencies (allow lockfile updates if needed)
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile || yarn install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
yarn build

echo "✅ Build completed successfully!" 