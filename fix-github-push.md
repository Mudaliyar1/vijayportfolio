# Fixing GitHub Push Protection Issues

GitHub has detected a Hugging Face API token in your commit history. Here are two ways to resolve this issue:

## Option 1: Allow the Secret (Quickest but Less Secure)

Follow the URL provided by GitHub to allow the secret:
https://github.com/Mudaliyar1/vijayportfolio/security/secret-scanning/unblock-secret/2vJ1jkyfQhtC0r1ItnRUfNjnkvS

This will tell GitHub that you acknowledge the secret and want to push anyway.

## Option 2: Create a New Repository (Most Secure)

If you want to completely remove the token from your history:

1. Create a new repository on GitHub
2. Push only your current code (not the history) to the new repository:

```bash
# Create a new directory for the clean repository
mkdir clean-portfolio
cd clean-portfolio

# Initialize a new git repository
git init

# Copy all files from your current repository (except .git folder)
cp -r ../vijayportfolio/* .
cp ../vijayportfolio/.env.example .
cp ../vijayportfolio/.gitignore .

# Add all files to the new repository
git add .

# Commit the files
git commit -m "Initial commit with clean history"

# Add your GitHub repository as remote
git remote add origin https://github.com/Mudaliyar1/new-portfolio-name.git

# Push to the new repository
git push -u origin main
```

This creates a completely new repository without any history of the API token.

## Option 3: Use BFG Repo-Cleaner (Advanced)

If you want to keep your repository history but remove the token:

1. Install BFG Repo-Cleaner: https://rtyley.github.io/bfg-repo-cleaner/
2. Run the following commands:

```bash
# Clone a fresh copy of your repository (mirror)
git clone --mirror https://github.com/Mudaliyar1/vijayportfolio.git

# Run BFG to replace the token
bfg --replace-text tokens.txt vijayportfolio.git

# Where tokens.txt contains:
# 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=REMOVED_TOKEN

# Clean up and push
cd vijayportfolio.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push
```

## Important Note

Remember to revoke the exposed Hugging Face token and create a new one, as the old one should be considered compromised.
