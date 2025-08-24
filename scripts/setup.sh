#!/bin/bash

echo "Setting up Clinic System..."

# Install dependencies
echo "Installing dependencies..."
if command -v bun &> /dev/null; then
    bun install
elif command -v npm &> /dev/null; then
    npm install
else
    echo "❌ No package manager found. Please install npm or bun."
    exit 1
fi

# Generate database schema
echo "Setting up database..."
if command -v bun &> /dev/null; then
    bun run drizzle-kit generate
    bun run drizzle-kit migrate
else
    npx drizzle-kit generate
    npx drizzle-kit migrate
fi

# Create necessary directories
mkdir -p dist
mkdir -p uploads
mkdir -p logs

# Set permissions
chmod +x scripts/*.sh

echo "✅ Setup complete! Run 'npm run dev' to start development."
