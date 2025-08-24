#!/bin/bash

echo "Compiling Clinic System to executable..."

if command -v bun &> /dev/null; then
    echo "Compiling with Bun..."
    bun build server.js --compile --outfile clinic-system
    echo "Executable created: ./clinic-system"
elif command -v deno &> /dev/null; then
    echo "Compiling with Deno..."
    deno compile --allow-all --output clinic-system server.js
    echo "Executable created: ./clinic-system"
else
    echo "Error: Bun or Deno required for compilation. Please install one of them."
    exit 1
fi
