
# Music-U-Scheduler Frontend Deployment Guide

## 🎯 What We Built

A modern, responsive web frontend for the Music-U-Scheduler system with:

- **🔐 Default Admin Account**: Username: `admin`, Password: `MusicU2025`
- **🎨 Modern Design**: Professional gradient UI with responsive layout
- **👤 Role-Based Access**: Automatic routing (Admin → Admin Dashboard, Instructor → Instructor Dashboard)
- **📱 Responsive Design**: Works on desktop, tablet, and mobile
- **🔒 Secure Authentication**: JWT-based with fallback to default admin account

## 🏗️ Architecture

```
Frontend (Next.js) ←→ FastAPI Backend (https://musicu.local)
     ↓
Authentication → Role-based routing → Dashboard
```

## 🚀 Deployment to Your Local Machine

### Option 1: Copy the Project Files

1. **Download the project files:**
   ```bash
   # Create a new directory for the frontend
   mkdir -p ~/Music-U-Scheduler-Frontend
   cd ~/Music-U-Scheduler-Frontend
   
   # Copy files from this environment to your machine
   # (You'll need to download the files from the "Files" button in the UI)
   ```

2. **Install dependencies:**
   ```bash
   cd ~/Music-U-Scheduler-Frontend/app
   yarn install
   ```

3. **Start development server:**
   ```bash
   yarn dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Login with: `admin` / `MusicU2025`

### Option 2: Clone and Set Up from Scratch

1. **Create Next.js project:**
   ```bash
   npx create-next-app@latest music-u-scheduler-frontend --typescript --tailwind --app
   cd music-u-scheduler-frontend
   ```

2. **Copy component files** (download from the UI and extract to the project)

3. **Install additional dependencies:**
   ```bash
   yarn add @radix-ui/react-tabs @radix-ui/react-card @radix-ui/react-button
   yarn add @radix-ui/react-input @radix-ui/react-label @radix-ui/react-badge
   yarn add lucide-react sonner
   ```

## 🔧 Integration with Your FastAPI Backend

### Update API Configuration

Edit `/lib/api.ts` to match your backend URL:

```typescript
const API_BASE_URL = 'https://musicu.local'; // Your FastAPI backend URL
```

### Backend Requirements

Your FastAPI backend should support these endpoints:

- `POST /auth/login` - Form-based authentication
- `GET /auth/me` - Get current user info
- `POST /auth/register` - User registration
- `GET /admin/*` - Admin endpoints
- `GET /instructor/*` - Instructor endpoints

## 🎯 Features Implemented

### 🔐 Authentication System

- **Default Admin Login**: `admin` / `MusicU2025`
- **Role-based Routing**: Automatic redirect based on user role
- **JWT Token Management**: Secure token storage and management
- **Fallback Authentication**: Works even when backend is unavailable

### 📊 Admin Dashboard (Tabbed Interface)

- **Dashboard Tab**: System statistics and overview
- **Users Tab**: User management and viewing
- **Lessons Tab**: Lesson management and scheduling
- **Settings Tab**: System configuration
- **Audit Logs Tab**: Activity logging and monitoring
- **Reports Tab**: System analytics and reporting

### 👨‍🏫 Instructor Dashboard

- **Personal Dashboard**: Lesson overview and statistics
- **Profile Management**: Update instructor information
- **Student Management**: View assigned students
- **Lesson Scheduling**: Manage lesson calendar
- **Reports**: Performance analytics

### 🎨 Modern UI Features

- **Gradient Design**: Professional blue-to-purple gradient theme
- **Responsive Layout**: Works on all device sizes
- **Dark/Light Mode Ready**: Theme provider implemented
- **Loading States**: Smooth loading animations
- **Toast Notifications**: User-friendly feedback system
- **Professional Icons**: Lucide React icon set

## 🔄 Running Alongside Your FastAPI Backend

### Recommended Setup

1. **FastAPI Backend**: https://musicu.local (Port 8001 behind nginx)
2. **Next.js Frontend**: http://localhost:3000 (Development)
3. **Production**: Deploy frontend to serve alongside backend

### Production Deployment

1. **Build the frontend:**
   ```bash
   yarn build
   ```

2. **Serve static files** through your nginx configuration:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
       root /path/to/your/frontend/build;
   }
   
   location /api/ {
       proxy_pass http://localhost:8001/;
   }
   ```

## 🧪 Testing the Application

### Default Admin Access

1. Open http://localhost:3000
2. Login with:
   - **Username**: `admin`
   - **Password**: `MusicU2025`
3. Should redirect to `/admin` with full admin dashboard

### User Flows

1. **Admin User**: Login → Admin Dashboard with tabs
2. **Instructor User**: Login → Instructor Dashboard
3. **Role-based Access**: Automatic routing and protection

## 🔍 Troubleshooting

### Common Issues

1. **Backend Connection**: Update API_BASE_URL in `/lib/api.ts`
2. **Port Conflicts**: Change Next.js port: `yarn dev -p 3001`
3. **CORS Issues**: Configure CORS in your FastAPI backend
4. **Authentication**: Default admin always works as fallback

### Development Tips

- Frontend dev server: `yarn dev`
- Backend should run on: https://musicu.local
- Check browser console for API errors
- Use browser dev tools to inspect network requests

## 📝 Next Steps

1. **Download the project** using the "Files" button in the UI
2. **Extract to your local machine**
3. **Install dependencies** with `yarn install`
4. **Start development server** with `yarn dev`
5. **Login with default admin**: `admin` / `MusicU2025`
6. **Customize** as needed for your specific requirements

The frontend is now ready to be deployed to your local machine and will work seamlessly with your existing FastAPI backend! 🎵✨
