#!/bin/bash

echo "Starting Clinic System..."

# Check if executable exists
if [ -f "./clinic-system" ]; then
    echo "Running clinic system executable..."
    ./clinic-system
elif [ -f "./clinic-system.exe" ]; then
    echo "Running clinic system executable..."
    ./clinic-system.exe
else
    echo "Executable not found. Building first..."
    ./scripts/build-executable.sh
    
    if [ -f "./clinic-system" ]; then
        ./clinic-system
    else
        echo "❌ Build failed. Please check the build logs."
        exit 1
    fi
fi
