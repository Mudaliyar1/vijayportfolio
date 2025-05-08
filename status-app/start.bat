@echo off
echo Starting FTRAISE AI Status Page...

:: Check if node_modules exists
if not exist node_modules (
  echo Installing dependencies...
  call npm install
)

:: Start the status app
echo Starting server...
node server.js
