# PowerShell script to create a clean repository without sensitive history

# Ask for the new repository name
$newRepoName = Read-Host -Prompt "Enter new repository name"

# Create a new directory for the clean repository
New-Item -ItemType Directory -Path "clean-$newRepoName" | Out-Null
Set-Location -Path "clean-$newRepoName"

# Initialize a new git repository
git init

# Copy all files from the current repository (except .git folder)
Write-Host "Copying files..."
Get-ChildItem -Path ".." -Exclude ".git" -Recurse | Copy-Item -Destination "." -Recurse -Force

# Add all files to the new repository
git add .

# Commit the files
git commit -m "Initial commit with clean history"

Write-Host ""
Write-Host "New clean repository created in: clean-$newRepoName"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Create a new repository on GitHub named: $newRepoName"
Write-Host "2. Run the following commands:"
Write-Host "   git remote add origin https://github.com/Mudaliyar1/$newRepoName.git"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "Remember to update your environment variables with new API keys!"

Read-Host -Prompt "Press Enter to exit"
