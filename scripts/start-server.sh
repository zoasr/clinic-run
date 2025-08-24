#!/bin/bash

echo "Starting Clinic System Server..."

# Check if Node.js is available
if command -v node &> /dev/null; then
    echo "Using Node.js"
    node server.js
elif command -v bun &> /dev/null; then
    echo "Using Bun"
    bun run server.js
elif command -v deno &> /dev/null; then
    echo "Using Deno"
    deno run --allow-all server.js
else
    echo "Error: No JavaScript runtime found. Please install Node.js, Bun, or Deno."
    exit 1
fi
