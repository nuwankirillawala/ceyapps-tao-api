#!/bin/bash

# Render Deployment Script for Tao Backend
# This script runs during the build process on Render

echo "🚀 Starting Tao Backend deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations (only in production)
if [ "$NODE_ENV" = "production" ]; then
    echo "🗄️ Running database migrations..."
    npx prisma migrate deploy
fi

# Build the application
echo "🏗️ Building application..."
yarn build

echo "✅ Deployment script completed successfully!" 