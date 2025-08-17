
# Music U Scheduler - Manual Setup Guide

## 🚨 Quick Fix for Virtual Environment Issues

If the automated scripts are failing, follow these steps manually:

### Step 1: Install System Dependencies

```bash
sudo apt update
sudo apt install -y python3-full python3-venv nodejs npm git
```

### Step 2: Clean Installation

```bash
cd ~
rm -rf Music-U-Scheduler  # Remove any existing installation
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
```

### Step 3: Create Virtual Environment

```bash
# Remove any existing virtual environment
rm -rf music-u-env

# Create fresh virtual environment
python3 -m venv music-u-env

# Activate it
source music-u-env/bin/activate

# Verify activation
echo "Virtual Environment: $VIRTUAL_ENV"
python --version
which python
```

### Step 4: Install Python Dependencies

```bash
# Make sure you're in the virtual environment
source music-u-env/bin/activate

# Install dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### Step 5: Install Node.js Dependencies

```bash
cd app
npm install
cd ..
```

### Step 6: Setup Database

```bash
# Activate virtual environment again
source music-u-env/bin/activate

# Run migrations
python -m alembic upgrade head

# Create admin user
python init_admin.py
```

### Step 7: Start Services

```bash
# Make scripts executable
chmod +x *.sh

# Start all services
./start-all.sh
```

### Step 8: Access Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8001
- **Admin Login**: admin / MusicU2025

## 🔧 Troubleshooting

### If Virtual Environment Still Fails:

```bash
# Try with python3-full
sudo apt install python3-full python3-dev python3-pip

# Alternative virtual environment creation
python3 -m pip install --user virtualenv
python3 -m virtualenv music-u-env
```

### If Pip Installation Fails:

```bash
# Force install in virtual environment
source music-u-env/bin/activate
pip install --force-reinstall -r requirements.txt
```

### If Node.js Issues:

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clear npm cache
npm cache clean --force
cd app
rm -rf node_modules package-lock.json
npm install
```

## ✅ Verification

After setup, verify everything is working:

```bash
# Check Python environment
source music-u-env/bin/activate
python --version
python -c "import fastapi, uvicorn, sqlalchemy; print('Python dependencies OK')"

# Check Node.js environment
cd app
npm list --depth=0
cd ..

# Test database
python -c "from app.database import engine; print('Database connection OK')"
```

## 🆘 Emergency Script

If all else fails, run the emergency installer:

```bash
cd ~
curl -L https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/emergency-install.sh | bash
```

This script handles the most problematic system configurations.
