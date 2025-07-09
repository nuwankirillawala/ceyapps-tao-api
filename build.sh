#!/bin/bash

echo "🚀 Starting Tao Backend build process..."

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
yarn build

echo "✅ Build completed successfully!" 