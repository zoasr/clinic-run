#!/bin/bash

echo "Starting Clinic System in development mode..."

# Check if required tools are installed
if ! command -v bun &> /dev/null && ! command -v node &> /dev/null; then
    echo "❌ Neither Bun nor Node.js found. Please install one of them."
    exit 1
fi

# Initialize database if it doesn't exist
if [ ! -f "clinic.db" ]; then
    echo "Initializing database..."
    if command -v bun &> /dev/null; then
        bun run lib/db/migrate.ts
    else
        node lib/db/migrate.js
    fi
fi

# Start development servers concurrently
echo "Starting frontend (Vite) and backend (Hono) servers..."
npm run dev
