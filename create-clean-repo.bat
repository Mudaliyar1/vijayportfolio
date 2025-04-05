@echo off
echo Creating a clean repository without sensitive history...

REM Ask for the new repository name
set /p new_repo_name=Enter new repository name: 

REM Create a new directory for the clean repository
mkdir clean-%new_repo_name%
cd clean-%new_repo_name%

REM Initialize a new git repository
git init

REM Copy all files from the current repository (except .git folder)
echo Copying files...
xcopy /E /Y /I /EXCLUDE:.git ..\* .

REM Add all files to the new repository
git add .

REM Commit the files
git commit -m "Initial commit with clean history"

echo.
echo New clean repository created in: clean-%new_repo_name%
echo.
echo Next steps:
echo 1. Create a new repository on GitHub named: %new_repo_name%
echo 2. Run the following commands:
echo    git remote add origin https://github.com/Mudaliyar1/%new_repo_name%.git
echo    git push -u origin main
echo.
echo Remember to update your environment variables with new API keys!

pause
