#!/bin/bash

echo "Building Clinic System Executable..."

# Build frontend with Vite first
echo "Building frontend with Vite..."
npm run build

# Ensure dist directory exists
mkdir -p dist

# Copy database and lib files
cp -r lib dist/
cp package.json dist/
cp tsconfig.json dist/
cp drizzle.config.ts dist/

# Build with Bun (recommended for Hono)
if command -v bun &> /dev/null; then
    echo "Building with Bun..."
    bun build server.ts --compile --minify --sourcemap --outfile clinic-system
    echo "✅ Bun executable created: clinic-system"
    
    # Cross-platform builds
    echo "Building cross-platform executables..."
    bun build server.ts --compile --target=bun-windows-x64 --outfile clinic-system-windows.exe
    bun build server.ts --compile --target=bun-linux-x64 --outfile clinic-system-linux
    bun build server.ts --compile --target=bun-darwin-x64 --outfile clinic-system-macos
    echo "✅ Cross-platform executables created"
    
elif command -v deno &> /dev/null; then
    echo "Building with Deno..."
    deno compile --allow-all --output clinic-system server.ts
    echo "✅ Deno executable created: clinic-system"
    
    # Cross-platform builds
    echo "Building cross-platform executables..."
    deno compile --allow-all --target x86_64-pc-windows-msvc --output clinic-system-windows.exe server.ts
    deno compile --allow-all --target x86_64-unknown-linux-gnu --output clinic-system-linux server.ts
    deno compile --allow-all --target x86_64-apple-darwin --output clinic-system-macos server.ts
    echo "✅ Cross-platform executables created"
    
else
    echo "❌ Neither Bun nor Deno found. Please install one of them:"
    echo "Bun: https://bun.sh/docs/installation"
    echo "Deno: https://deno.land/manual/getting_started/installation"
    exit 1
fi

echo "🎉 Build complete! Run './clinic-system' to start the clinic system."
