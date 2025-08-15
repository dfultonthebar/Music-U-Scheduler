
# Frontend Update Guide

## Overview
This guide explains how to manually update your local Music-U-Scheduler repository with the new Next.js frontend and authentication fixes.

## Changes Made
1. **Added Next.js Frontend**: A complete modern web interface located in the `frontend/` directory
2. **Fixed Authentication**: Updated API connections to use `http://localhost:8001` instead of `https://musicu.local`
3. **Default Admin Account**: Username: `admin`, Password: `MusicU2025`
4. **Role-based Routing**: Automatic redirection based on user roles (admin, instructor, student)

## Manual Update Process

### Option 1: Direct Copy (Recommended)
1. On your local machine, navigate to your Music-U-Scheduler repository
2. Copy the entire `frontend/` directory from this server to your local repository
3. Copy the `FRONTEND_UPDATE_GUIDE.md` file to your local repository

### Option 2: Using Git Patch
1. Download the `frontend-updates.patch` file from this server
2. In your local repository, run: `git apply frontend-updates.patch`

### Option 3: Manual Repository Clone
Since the GitHub token appears to be expired, you may need to:
1. Generate a new GitHub Personal Access Token
2. Update the remote URL: `git remote set-url origin https://YOUR_NEW_TOKEN@github.com/dfultonthebar/Music-U-Scheduler.git`
3. Push the changes: `git push origin main`

## Setting Up the Frontend Locally

### Prerequisites
- Node.js 18+ and npm/yarn installed
- Your FastAPI backend running on `http://localhost:8001`

### Installation Steps
1. Navigate to the frontend directory: `cd frontend/`
2. Install dependencies: `yarn install` (or `npm install`)
3. Start development server: `yarn dev` (or `npm run dev`)
4. Access the application at: `http://localhost:3000`

### Default Login Credentials
- **Username**: `admin`
- **Password**: `MusicU2025`

## Key Features
- **Admin Dashboard**: Complete user and lesson management
- **Instructor Interface**: Schedule management and student tracking  
- **Modern UI**: Built with Next.js, Tailwind CSS, and Shadcn/ui
- **Role-based Access**: Automatic routing based on user permissions
- **API Integration**: Connects to your FastAPI backend seamlessly

## Troubleshooting
1. **Backend Connection Issues**: Ensure your FastAPI server is running on `http://localhost:8001`
2. **Authentication Problems**: Check that the default admin account is properly configured in your backend
3. **Build Issues**: Run `yarn install` to ensure all dependencies are properly installed

## Next Steps
1. Test the frontend with the default admin credentials
2. Configure additional users through the admin interface
3. Customize the interface as needed for your specific requirements

---
For support or questions about this update, refer to the commit message or contact the development team.
