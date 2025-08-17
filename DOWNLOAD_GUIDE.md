
# Music U Scheduler - Download & Update Guide

## Quick Download (New Users)

### Method 1: Direct Download Script
```bash
# Download and run the installer in one command
curl -L https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/download-update.sh | bash
```

### Method 2: Manual Download
```bash
# Clone the repository
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler

# Run the installer
chmod +x download-update.sh
./download-update.sh
```

## Update Existing Installation

If you already have Music U Scheduler installed:

```bash
# Navigate to your installation directory
cd ~/Music-U-Scheduler

# Download and run the updater
curl -L https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/download-update.sh -o download-update.sh
chmod +x download-update.sh
./download-update.sh
```

## What the Download Script Does

The download script automatically:

1. **Checks System Requirements**
   - Verifies Git is installed
   - Checks for existing installations

2. **Downloads Latest Version**
   - Clones from GitHub repository
   - Updates existing installations safely

3. **Creates Backups**
   - Backs up existing data before updates
   - Preserves your configuration and database

4. **Updates Dependencies**
   - Updates Python packages
   - Updates Node.js dependencies
   - Runs database migrations

5. **Configures Application**
   - Sets up admin user
   - Configures permissions
   - Prepares services

## Manual Installation (Alternative)

If you prefer to install manually:

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Steps
```bash
# 1. Clone repository
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler

# 2. Set up Python environment
python3 -m venv music-u-env
source music-u-env/bin/activate

# 3. Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Set up Node.js dependencies
cd app
yarn install  # or npm install
cd ..

# 5. Run database setup
alembic upgrade head
python init_admin.py

# 6. Start services
./start-all.sh
```

## Version Information

- **Current Version**: 1.3.02
- **Release Date**: August 17, 2025
- **GitHub Repository**: https://github.com/dfultonthebar/Music-U-Scheduler

## What's New in Version 1.3.02

### ✅ Authentication Integration
- Complete authentication system between frontend and backend
- Fixed JWT token handling
- Resolved 401 Unauthorized errors

### ✅ User Management
- Add/delete students and instructors
- Role-based access control
- Admin dashboard improvements

### ✅ Version Management
- Automatic version detection
- GitHub integration for updates
- Improved update process

### ✅ Bug Fixes
- Fixed bcrypt compatibility issues
- Resolved frontend-backend communication
- Improved error handling

## Getting Help

### Common Issues

**Problem**: Permission denied when running scripts
```bash
# Solution: Make scripts executable
chmod +x *.sh
chmod +x scripts/*.sh
```

**Problem**: Python virtual environment issues
```bash
# Solution: Recreate virtual environment
rm -rf music-u-env
python3 -m venv music-u-env
source music-u-env/bin/activate
pip install -r requirements.txt
```

**Problem**: Node.js dependency issues
```bash
# Solution: Clean and reinstall
cd app
rm -rf node_modules yarn.lock package-lock.json
yarn install  # or npm install
```

### Support

- **Documentation**: Check the docs/ directory
- **Issues**: Create an issue on GitHub
- **Logs**: Check the logs/ directory for error details

## Access Information

After successful installation:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **Admin Login**: admin / MusicU2025

## File Structure

```
Music-U-Scheduler/
├── app/                    # Next.js frontend
├── alembic/               # Database migrations
├── scripts/               # Utility scripts
├── logs/                  # Application logs
├── docs/                  # Documentation
├── requirements.txt       # Python dependencies
├── download-update.sh     # Download/update script
├── start-all.sh          # Start services
└── README.md             # Main documentation
```

---

**Need help?** Check the TROUBLESHOOTING.md file or create an issue on GitHub.
