# Music-U-Scheduler Installation Guide

This guide provides comprehensive instructions for installing Music-U-Scheduler on your system.

## Quick Installation

### Method 1: One-Line Remote Installation (Recommended)

For the fastest installation, run this single command:

```bash
curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash
```

This will automatically:
- Download and run the installer
- Install all dependencies
- Set up the application
- Create desktop shortcuts
- Handle existing installations gracefully

### Method 2: Clone and Install

If you prefer to see what you're installing:

```bash
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
bash install.sh
```

### Method 3: Download Installer Only

```bash
wget https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh
chmod +x musched_installer.sh
./musched_installer.sh
```

## System Requirements

### Supported Operating Systems
- **Linux**: Ubuntu, Debian, CentOS, RHEL, Fedora, Arch Linux, and derivatives
- **macOS**: macOS 10.14 (Mojave) or later
- **Windows**: Windows 10/11 with WSL (Windows Subsystem for Linux)

### Required Dependencies
The installer will automatically install these if missing:
- Python 3.7 or later
- pip (Python package manager)
- git
- curl
- Virtual environment support (python3-venv)

### Hardware Requirements
- **RAM**: Minimum 512MB, Recommended 1GB+
- **Storage**: 100MB free space
- **Display**: Any resolution (GUI scales automatically)

## Installation Details

### What the Installer Does

1. **System Check**: Verifies your system meets requirements
2. **Dependency Installation**: Installs Python, git, and other required packages
3. **Repository Management**: 
   - Fresh installation: Clones the repository
   - Existing installation: Updates to latest version
   - Handles corrupted installations by recloning
4. **Python Environment**: Creates isolated virtual environment
5. **Package Installation**: Installs all Python dependencies
6. **Desktop Integration**: Creates application shortcuts and menu entries
7. **Launcher Creation**: Creates easy-to-use launch scripts

### Installation Locations

- **Application**: `~/Music-U-Scheduler/`
- **Desktop Entry**: `~/.local/share/applications/music-u-scheduler.desktop`
- **Icon**: `~/.local/share/icons/music-u-scheduler.png`
- **Data**: `~/Music-U-Scheduler/data/`

## Running the Application

After installation, you can run Music-U-Scheduler in several ways:

### Method 1: Application Menu
Look for "Music-U-Scheduler" in your applications menu or desktop environment.

### Method 2: Launcher Script
```bash
~/Music-U-Scheduler/launch.sh
```

### Method 3: Manual Activation
```bash
cd ~/Music-U-Scheduler
source venv/bin/activate
python main.py
```

### Method 4: Direct Python Execution
```bash
~/Music-U-Scheduler/venv/bin/python ~/Music-U-Scheduler/main.py
```

## Updating

To update to the latest version, simply run the installer again:

```bash
curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash
```

The installer will:
- Preserve your data and settings
- Update the application code
- Install any new dependencies
- Maintain your desktop shortcuts

## Troubleshooting

### Common Issues and Solutions

#### 1. Permission Denied Errors

**Problem**: `Permission denied` when running installer

**Solution**:
```bash
chmod +x install.sh
# or
chmod +x musched_installer.sh
```

#### 2. Python Not Found

**Problem**: `python3: command not found`

**Solutions**:

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

**CentOS/RHEL/Fedora**:
```bash
# CentOS/RHEL
sudo yum install python3 python3-pip
# Fedora
sudo dnf install python3 python3-pip
```

**macOS**:
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python3
```

#### 3. Git Not Found

**Problem**: `git: command not found`

**Solutions**:

**Ubuntu/Debian**:
```bash
sudo apt install git
```

**CentOS/RHEL**:
```bash
sudo yum install git
```

**Fedora**:
```bash
sudo dnf install git
```

**macOS**:
```bash
brew install git
```

#### 4. Virtual Environment Issues

**Problem**: Virtual environment creation fails

**Solution**:
```bash
# Ubuntu/Debian
sudo apt install python3-venv

# If still failing, try:
python3 -m pip install --user virtualenv
```

#### 5. Network/Download Issues

**Problem**: Cannot download installer or repository

**Solutions**:
1. Check internet connection
2. Try using wget instead of curl:
   ```bash
   wget -O- https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash
   ```
3. Download manually and run locally:
   ```bash
   wget https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh
   chmod +x musched_installer.sh
   ./musched_installer.sh
   ```

#### 6. Application Won't Start

**Problem**: Application fails to launch

**Diagnostic Steps**:
1. Check if virtual environment is working:
   ```bash
   cd ~/Music-U-Scheduler
   source venv/bin/activate
   python --version
   ```

2. Check for missing dependencies:
   ```bash
   cd ~/Music-U-Scheduler
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Run with verbose output:
   ```bash
   cd ~/Music-U-Scheduler
   source venv/bin/activate
   python main.py --verbose
   ```

#### 7. Desktop Integration Issues

**Problem**: Application doesn't appear in menu

**Solutions**:
1. Update desktop database:
   ```bash
   update-desktop-database ~/.local/share/applications
   ```

2. Manually refresh your desktop environment:
   - **GNOME**: Press Alt+F2, type `r`, press Enter
   - **KDE**: Right-click desktop → Refresh Desktop
   - **XFCE**: Log out and log back in

#### 8. Existing Installation Issues

**Problem**: Installer fails with existing installation

**Solution**: Remove existing installation and reinstall:
```bash
rm -rf ~/Music-U-Scheduler
curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash
```

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**: The installer provides detailed output about what went wrong
2. **GitHub Issues**: Report bugs at https://github.com/dfultonthebar/Music-U-Scheduler/issues
3. **System Information**: When reporting issues, include:
   - Operating system and version
   - Python version (`python3 --version`)
   - Error messages (full output)
   - Steps to reproduce the problem

## Advanced Installation Options

### Custom Installation Directory

To install to a custom directory, modify the installer:

```bash
# Download the installer
wget https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/install.sh

# Edit the INSTALL_DIR variable
sed -i 's|INSTALL_DIR="$HOME/$APP_NAME"|INSTALL_DIR="/your/custom/path"|' install.sh

# Run the modified installer
bash install.sh
```

### Development Installation

For development purposes:

```bash
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -e .  # Editable installation
```

### Offline Installation

1. Download the repository as a ZIP file from GitHub
2. Extract to desired location
3. Run the installer:
   ```bash
   cd Music-U-Scheduler
   bash install.sh
   ```

## Uninstallation

To completely remove Music-U-Scheduler:

```bash
# Remove application directory
rm -rf ~/Music-U-Scheduler

# Remove desktop integration
rm -f ~/.local/share/applications/music-u-scheduler.desktop
rm -f ~/.local/share/icons/music-u-scheduler.png

# Update desktop database
update-desktop-database ~/.local/share/applications 2>/dev/null || true
```

## Security Notes

- The installer requires sudo access only for installing system packages
- The application itself runs with user privileges
- All data is stored in your home directory
- No network access is required after installation (except for updates)

## Performance Tips

- **SSD Storage**: Install on SSD for faster startup times
- **RAM**: More RAM allows for smoother operation with large music libraries
- **Python Version**: Python 3.8+ provides better performance

---

**Happy Music Practicing! 🎵**

For more information, visit: https://github.com/dfultonthebar/Music-U-Scheduler