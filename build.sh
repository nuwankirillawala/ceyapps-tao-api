#!/bin/bash

# Exit on any error
set -e

echo "🚀 Starting Tao Backend build process..."

# Install dependencies (allow lockfile updates if needed)
echo "📦 Installing dependencies..."
yarn install --frozen-lockfile || yarn install

# Run database migrations
echo "🗄️ Running database migrations..."
echo "📊 Checking migration status..."
yarn prisma migrate status
echo "🚀 Applying pending migrations..."
yarn prisma migrate deploy
echo "✅ Migrations completed successfully!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
yarn prisma generate

# Build the application
echo "🏗️ Building application..."
yarn build

echo "✅ Build completed successfully!" 