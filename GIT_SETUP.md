# Git Repository Setup and Cleanup Guide

This guide provides step-by-step commands to clean up your repository and push it to Git with proper exclusions.

## Prerequisites

- Git installed on your system
- Repository initialized (if not, run `git init`)
- Remote repository URL ready (GitHub, GitLab, Bitbucket, etc.)

---

## Step 1: Stop Tracking Unwanted Files

First, remove files that should not be tracked from Git's index (this doesn't delete them from your filesystem):

```bash
# Remove node_modules directories
git rm -r --cached backend/node_modules
git rm -r --cached frontend/node_modules

# Remove .env files (keep .env.example and .env.docker)
git rm --cached backend/.env

# Remove log files
git rm -r --cached backend/logs

# Remove build/dist directories (if they exist)
git rm -r --cached backend/dist
git rm -r --cached backend/build
git rm -r --cached frontend/dist
git rm -r --cached frontend/build

# Remove database files (if any)
git rm --cached *.sqlite
git rm --cached *.sqlite3
git rm --cached *.db

# Remove IDE files
git rm -r --cached .vscode
git rm -r --cached .idea

# Remove OS files
git rm --cached .DS_Store
git rm --cached Thumbs.db
```

**Note**: If any of these files/directories don't exist in your repository, Git will show an error. You can safely ignore those errors and continue with the next commands.

---

## Step 2: Add .gitignore File

The `.gitignore` file has already been created. Now add it to Git:

```bash
git add .gitignore
```

---

## Step 3: Stage All Other Changes

Add all remaining files that should be tracked:

```bash
# Add all files (respecting .gitignore)
git add .

# Verify what will be committed
git status
```

Review the output to ensure only the correct files are staged.

---

## Step 4: Commit Changes

Create a commit with the cleaned-up repository:

```bash
git commit -m "chore: add .gitignore and remove unwanted files from tracking"
```

---

## Step 5: Set Up Remote Repository (if not already done)

If you haven't added a remote repository yet:

```bash
# Add remote repository (replace URL with your actual repository URL)
git remote add origin https://github.com/yourusername/your-repo-name.git

# Verify remote was added
git remote -v
```

If you already have a remote configured, you can skip this step.

---

## Step 6: Push to Remote Repository

Push your changes to the remote repository:

```bash
# Push to main branch (or master, depending on your default branch)
git push -u origin main

# If your default branch is 'master', use:
# git push -u origin master
```

If this is your first push and the branch doesn't exist on the remote:

```bash
# Create and push to main branch
git branch -M main
git push -u origin main
```

---

## Alternative: Complete Cleanup Script

If you want to run all commands at once, here's a complete script:

### For Windows (PowerShell):

```powershell
# Remove unwanted files from tracking
git rm -r --cached backend/node_modules 2>$null
git rm -r --cached frontend/node_modules 2>$null
git rm --cached backend/.env 2>$null
git rm -r --cached backend/logs 2>$null
git rm -r --cached backend/dist 2>$null
git rm -r --cached backend/build 2>$null
git rm -r --cached frontend/dist 2>$null
git rm -r --cached frontend/build 2>$null
git rm -r --cached .vscode 2>$null
git rm -r --cached .idea 2>$null

# Add .gitignore and all other files
git add .gitignore
git add .

# Commit changes
git commit -m "chore: add .gitignore and remove unwanted files from tracking"

# Push to remote (update branch name if needed)
git push -u origin main
```

### For Linux/Mac (Bash):

```bash
#!/bin/bash

# Remove unwanted files from tracking
git rm -r --cached backend/node_modules 2>/dev/null
git rm -r --cached frontend/node_modules 2>/dev/null
git rm --cached backend/.env 2>/dev/null
git rm -r --cached backend/logs 2>/dev/null
git rm -r --cached backend/dist 2>/dev/null
git rm -r --cached backend/build 2>/dev/null
git rm -r --cached frontend/dist 2>/dev/null
git rm -r --cached frontend/build 2>/dev/null
git rm -r --cached .vscode 2>/dev/null
git rm -r --cached .idea 2>/dev/null

# Add .gitignore and all other files
git add .gitignore
git add .

# Commit changes
git commit -m "chore: add .gitignore and remove unwanted files from tracking"

# Push to remote (update branch name if needed)
git push -u origin main
```

---

## Verification

After pushing, verify your repository:

1. Check the remote repository on GitHub/GitLab/Bitbucket
2. Ensure `node_modules/`, `.env`, and `logs/` are not present
3. Verify that `.gitignore` is present
4. Confirm that `.env.example` and `.env.docker` are still tracked

---

## Files Excluded by .gitignore

The following files and directories will be excluded from Git tracking:

### Dependencies
- `node_modules/`
- Package manager debug logs

### Environment Variables
- `.env`
- `.env.local`
- `.env.*.local`
- **Kept**: `.env.example`, `.env.docker`

### Build Outputs
- `dist/`
- `dist-ssr/`
- `build/`

### Logs
- `logs/`
- `*.log`

### IDE Files
- `.vscode/` (except extensions.json)
- `.idea/`
- IntelliJ/WebStorm files

### OS Files
- `.DS_Store` (macOS)
- `Thumbs.db` (Windows)
- Other OS-specific files

### Database Files
- `*.sqlite`
- `*.sqlite3`
- `*.db`

### Test Coverage
- `coverage/`
- `.nyc_output/`

### Temporary Files
- `*.tmp`
- `*.temp`
- `.cache/`

---

## Troubleshooting

### Issue: "fatal: pathspec 'file' did not match any files"

**Solution**: The file doesn't exist in the repository. This is normal - just continue with the next command.

### Issue: "error: the following files have staged content different from both the file and the HEAD"

**Solution**: Run `git reset` and try again, or use `git rm -f --cached <file>` to force removal.

### Issue: Push rejected due to conflicts

**Solution**: Pull the latest changes first:
```bash
git pull origin main --rebase
git push origin main
```

### Issue: Large files causing push to fail

**Solution**: If you have large files that were previously committed, you may need to use Git LFS or rewrite history:
```bash
# Install Git LFS
git lfs install

# Track large files
git lfs track "*.pdf"
git lfs track "*.zip"

# Add .gitattributes
git add .gitattributes
git commit -m "chore: configure Git LFS"
```

---

## Next Steps

After successfully pushing your repository:

1. ✅ Verify all team members have `.env.example` to create their local `.env` files
2. ✅ Document any required environment variables in README.md
3. ✅ Set up CI/CD pipelines if needed
4. ✅ Configure branch protection rules on your remote repository
5. ✅ Add collaborators to the repository

---

## Additional Git Commands

### Check what's being tracked:
```bash
git ls-files
```

### Check what's ignored:
```bash
git status --ignored
```

### Remove all untracked files (be careful!):
```bash
git clean -fd
```

### View commit history:
```bash
git log --oneline
```

---

**Last Updated**: 2025-10-13