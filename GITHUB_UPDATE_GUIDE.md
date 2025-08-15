
# GitHub Update Guide - Music-U-Scheduler

## Issue Encountered
The GitHub Personal Access Token (PAT) in your repository is expired or invalid, preventing automatic pushes to GitHub.

## Current Status
✅ **All changes have been committed locally**, including:
- Complete Next.js frontend with authentication fixes
- Frontend update guide and transfer scripts
- Email validator dependency fix

## Two Ways to Update GitHub

### Option 1: Update Your GitHub Token (Recommended)

#### Step 1: Generate New GitHub Personal Access Token
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Set expiration (recommend: 90 days or longer)
4. Select scopes: `repo` (full repository access)
5. Click "Generate token"
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again)

#### Step 2: Update Repository with New Token
On your local machine, in your Music-U-Scheduler directory:
```bash
# Replace YOUR_NEW_TOKEN with the token you just generated
git remote set-url origin https://YOUR_NEW_TOKEN@github.com/dfultonthebar/Music-U-Scheduler.git

# Verify the remote URL is updated
git remote -v

# Now you can pull the latest changes
git pull origin main

# And push any local changes
git push origin main
```

### Option 2: Apply Updates Manually Using Patch Files

#### Step 1: Download Update Files
From this server, download:
- `latest-updates.patch` (contains all recent commits)
- `musicu-frontend-update.tar.gz` (contains frontend files)
- `FRONTEND_UPDATE_GUIDE.md` (installation guide)

#### Step 2: Apply Updates on Your Local Machine
```bash
# In your Music-U-Scheduler directory

# Apply the patch file
git apply latest-updates.patch

# OR manually extract the frontend archive
tar -xzf musicu-frontend-update.tar.gz
cp -r musicu-frontend-update/frontend/ ./
cp musicu-frontend-update/FRONTEND_UPDATE_GUIDE.md ./

# Commit the changes
git add .
git commit -m "Add Next.js frontend with authentication fixes"

# Push to GitHub (after updating your token)
git push origin main
```

## What Updates Are Included

### 🚀 **Next.js Frontend Application**
- **Location**: `frontend/` directory
- **Features**: 
  - Modern login interface with role-based routing
  - Admin dashboard with user and lesson management
  - Instructor interface with schedule management
  - Responsive design with Tailwind CSS and Shadcn/ui
  - API integration with FastAPI backend

### 🔧 **Authentication Fixes**
- Updated API endpoints to use `http://localhost:8001`
- Fixed backend connection issues
- Default admin credentials: `admin`/`MusicU2025`

### 📚 **Documentation and Guides**
- `FRONTEND_UPDATE_GUIDE.md`: Complete frontend setup instructions
- `GITHUB_UPDATE_GUIDE.md`: This file - token update guide
- `transfer-frontend.sh`: Automated transfer script

### 🐛 **Bug Fixes**
- Added `email-validator` dependency to fix Pydantic validation
- Resolved import errors in the FastAPI backend

## Testing the Frontend Locally

After applying the updates:
1. Navigate to `frontend/` directory
2. Install dependencies: `yarn install`
3. Start development server: `yarn dev`
4. Access at: `http://localhost:3000`
5. Login with: `admin`/`MusicU2025`

## Verification

To verify everything is working:
1. ✅ FastAPI backend runs on `http://localhost:8001`
2. ✅ Next.js frontend runs on `http://localhost:3000`
3. ✅ Login works with default admin credentials
4. ✅ Admin dashboard loads correctly
5. ✅ API endpoints respond properly

## Support

If you encounter issues:
1. Check that both backend and frontend are running
2. Verify the API base URL in frontend configuration
3. Ensure all dependencies are installed
4. Check the browser console for any errors

---
**Generated**: August 15, 2025
**Repository**: https://github.com/dfultonthebar/Music-U-Scheduler
