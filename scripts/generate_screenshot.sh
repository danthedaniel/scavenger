#!/bin/bash

# Script to generate a mobile screenshot of the app
# Usage: ./generate_screenshot.sh

# Set variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NODE_SCRIPT="$SCRIPT_DIR/generate_screenshot.mjs"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install it first."
    echo "You can install it with: brew install node"
    exit 1
fi

# Check if the app is running
if ! curl -s http://localhost:3000 &> /dev/null; then
    echo "Warning: Your app doesn't seem to be running on http://localhost:3000"
    echo "Please make sure your app is running before continuing."
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if puppeteer is installed locally, if not install it
if ! npm list puppeteer &> /dev/null; then
    echo "Install Puppeteer first"
    exit 1
fi

# Run the screenshot script
echo "Generating screenshot..."
node "$NODE_SCRIPT"
