@echo off
echo Installing dependencies for FTRAISE AI Status Page...

:: Install node-windows globally
echo Installing node-windows...
call npm install -g node-windows

:: Install local dependencies
echo Installing local dependencies...
call npm install

echo Dependencies installed successfully!
echo.
echo To install the status page as a Windows service, run:
echo   node install-service.js
echo.
echo To start the status page without installing as a service, run:
echo   start.bat
echo.
pause
