
# Music-U-Scheduler Installer Update Guide

## 🚀 Latest Updates (August 15, 2025)

### **Major Enhancements to Professional Installer**

The installer script (`install.sh`) has been comprehensively updated to include full-stack deployment with modern web frontend capabilities.

---

## 🆕 **New Features Added**

### **1. Node.js and Yarn Installation**
- **Automatic Node.js Detection**: Detects existing Node.js installations (including NVM-managed versions)
- **Multi-Platform Support**: Supports installation via NodeSource repositories on Ubuntu, CentOS, Fedora
- **Yarn Package Manager**: Automatically installs Yarn for modern package management
- **Path Management**: Handles complex PATH configurations for Node.js environments

### **2. Frontend Environment Setup**
- **Next.js Application Support**: Full setup for React/Next.js frontend
- **Dependency Management**: Automated `yarn install` for frontend dependencies
- **Production Building**: Builds frontend for production deployment
- **Development Fallback**: Graceful fallback to development mode if build fails

### **3. Enhanced Service Architecture**
- **Separate Services**: Individual systemd services for backend and frontend
  - `music-u-scheduler-backend.service`: FastAPI backend on port 8001
  - `music-u-scheduler-frontend.service`: Next.js frontend on port 3000
  - `music-u-scheduler.service`: Main orchestration service
- **Service Dependencies**: Proper service dependency management with PostgreSQL

### **4. Advanced Nginx Configuration**
- **Full-Stack Proxy**: Smart routing between frontend and API
  - Frontend: `https://musicu.local/` → `http://localhost:3000`
  - API: `https://musicu.local/api/` → `http://localhost:8001/`
  - Docs: `https://musicu.local/docs` → `http://localhost:8001/docs`
- **WebSocket Support**: Hot-reload support for development
- **Security Headers**: Enhanced security configuration

### **5. PostgreSQL Integration**
- **Automated Database Setup**: Creates database and user automatically
- **Service Integration**: PostgreSQL as a dependency for application services
- **Configuration Management**: Handles database permissions and setup

### **6. Enhanced Management Tools**
- **Comprehensive Launcher**: New launcher script with extensive options
  - Individual service management (`backend`, `frontend`)
  - Database setup (`setup-db`)
  - Enhanced logging and monitoring
- **Service Monitoring**: Real-time status display for all components
- **Log Management**: Centralized logging access for troubleshooting

---

## 🔧 **Technical Improvements**

### **Installation Process**
```bash
# New installation flow:
1. System dependencies (including PostgreSQL)
2. Node.js and Yarn installation
3. Repository cloning/updating
4. Python environment setup
5. Frontend environment setup
6. PostgreSQL database setup
7. Professional services configuration
8. SSL and security setup
9. Service startup and verification
```

### **Service Management**
```bash
# New commands available:
./launch.sh start        # Start all services
./launch.sh backend start   # Manage backend only
./launch.sh frontend start  # Manage frontend only
./launch.sh setup-db     # Setup database
./launch.sh status       # Comprehensive status check
```

### **Default Credentials**
- **Username**: `admin`
- **Password**: `MusicU2025`
- Automatically created during backend startup

---

## 📋 **Updated URLs and Endpoints**

### **Primary Access**
- **Main Application**: `https://musicu.local`
- **API Documentation**: `https://musicu.local/docs`
- **Backend API**: `https://musicu.local/api/`

### **Direct Service Access** (for debugging)
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8001`

---

## 🛠️ **Installation Requirements**

### **System Requirements**
- Ubuntu 20.04+ (primary support)
- CentOS 7+, Fedora 30+ (basic support)
- 2GB RAM minimum, 4GB recommended
- 5GB disk space minimum

### **Automatic Dependencies**
- Python 3.8+
- Node.js 18+ (automatically installed)
- PostgreSQL 12+
- Nginx with SSL
- Git, curl, openssl

---

## 🔄 **Upgrade Path**

### **For Existing Installations**
1. **Backup Current Installation**
   ```bash
   cp -r ~/Music-U-Scheduler ~/Music-U-Scheduler-backup
   ```

2. **Run Updated Installer**
   ```bash
   curl -fsSL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/install.sh | bash
   ```

3. **Verify Installation**
   ```bash
   ~/Music-U-Scheduler/install.sh --verify
   ```

### **For Fresh Installations**
```bash
curl -fsSL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/install.sh | bash
```

---

## 🔍 **Troubleshooting**

### **Common Issues and Solutions**

#### **Node.js Installation Issues**
```bash
# Manual Node.js installation if automatic fails
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g yarn
```

#### **Frontend Build Issues**
```bash
# Manual frontend setup
cd ~/Music-U-Scheduler/frontend
export PATH="/usr/local/nvm/versions/node/v22.14.0/bin:$PATH"
yarn install
yarn build
```

#### **Service Issues**
```bash
# Check service status
sudo systemctl status music-u-scheduler-backend
sudo systemctl status music-u-scheduler-frontend

# View logs
sudo journalctl -u music-u-scheduler-backend -f
sudo journalctl -u music-u-scheduler-frontend -f
```

#### **Database Issues**
```bash
# Manual database setup
sudo systemctl start postgresql
sudo -u postgres createdb music_u_scheduler
sudo -u postgres psql -c "CREATE USER music_u_user WITH PASSWORD 'music_u_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE music_u_scheduler TO music_u_user;"
```

---

## 📊 **Service Architecture**

```
┌─────────────────┐
│   Nginx Proxy   │ (Port 443/80)
│ musicu.local    │
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │           │
┌───▼───┐   ┌───▼───┐
│Frontend│   │Backend│
│ :3000  │   │ :8001 │
│Next.js │   │FastAPI│
└───────┘   └───┬───┘
                │
        ┌───────▼────────┐
        │  PostgreSQL    │
        │ music_u_scheduler │
        └────────────────┘
```

---

## 🎯 **Benefits of Updated Installer**

1. **One-Command Setup**: Complete full-stack deployment with single command
2. **Production-Ready**: Enterprise-grade configuration out of the box
3. **Modern Stack**: React/Next.js frontend with FastAPI backend
4. **Secure**: HTTPS/SSL, security headers, firewall configuration
5. **Maintainable**: Automated updates, comprehensive logging, service management
6. **Scalable**: Professional architecture ready for production deployment

---

## 📞 **Support**

For issues with the updated installer:

1. **Check logs**: `~/Music-U-Scheduler/launch.sh logs`
2. **Verify installation**: `~/Music-U-Scheduler/install.sh --verify`  
3. **View documentation**: Available in repository
4. **Service management**: Use the enhanced launcher script

---

**Last Updated**: August 15, 2025  
**Installer Version**: Professional 2.0  
**Commit**: 559a3ec
