#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Start the status app
echo "Starting FTRAISE AI Status Page on port ${STATUS_PORT:-3001}..."
node server.js
