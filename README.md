# Music-U-Scheduler

A comprehensive music practice scheduler and progress tracker designed to help musicians organize their practice sessions, track progress, and achieve their musical goals.

## Features

### Core Features
- **Practice Session Scheduling**: Plan and organize your practice sessions
- **Progress Tracking**: Monitor your improvement over time
- **Goal Setting**: Set and track musical goals
- **Practice History**: Detailed history of all practice sessions
- **Multiple Instruments**: Support for various instruments
- **Customizable Practice Plans**: Create personalized practice routines

### Professional Features (New!)
- **Web Interface**: Access via HTTPS at `https://musicu.local`
- **Secure SSL/TLS**: Self-signed certificate for secure connections
- **Nginx Reverse Proxy**: High-performance web server with security headers
- **System Service**: Runs as a proper system service with automatic startup
- **Automatic Updates**: Daily update checks with safe rollback capability
- **Firewall Integration**: Automatic firewall configuration
- **Professional Management**: Command-line tools for service management

## Installation

### Quick Professional Install (Recommended)
```bash
curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash
```

This installs Music-U-Scheduler with professional features including:
- Custom domain (`musicu.local`) with HTTPS
- Nginx reverse proxy with security headers
- Systemd service for automatic startup
- Daily automatic updates
- Firewall configuration
- Professional management tools

### Basic Install (Desktop Only)
```bash
curl -sL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/musched_installer.sh | bash -s -- --basic
```

### Manual Install
```bash
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
chmod +x install.sh
./install.sh
```

## Usage

### Professional Web Interface
After professional installation, access the application at:
**https://musicu.local**

*Note: You'll see a security warning due to the self-signed certificate. This is normal for local development.*

### Service Management
```bash
# Using the control script
~/Music-U-Scheduler/launch.sh start    # Start service
~/Music-U-Scheduler/launch.sh stop     # Stop service
~/Music-U-Scheduler/launch.sh restart  # Restart service
~/Music-U-Scheduler/launch.sh status   # Show status
~/Music-U-Scheduler/launch.sh logs     # View logs
~/Music-U-Scheduler/launch.sh update   # Check for updates
~/Music-U-Scheduler/launch.sh open     # Open web interface
```

### Desktop Application (Basic Install)
```bash
~/Music-U-Scheduler/launch.sh
```

## Professional Setup Features

### 🌐 Web Access
- **Custom Domain**: `musicu.local` with automatic hosts file configuration
- **HTTPS/SSL**: Self-signed certificate for secure connections
- **Modern Web Interface**: Responsive design for desktop and mobile

### 🛡️ Security
- **Nginx Reverse Proxy**: Professional-grade web server
- **Security Headers**: HSTS, CSP, XSS protection, and more
- **Firewall Integration**: Automatic UFW/firewalld configuration
- **SSL/TLS**: Strong encryption with modern protocols

### ⚙️ System Integration
- **Systemd Service**: Proper system service with automatic startup
- **Resource Management**: Configured limits and security restrictions
- **Process Monitoring**: Automatic restart on failure
- **Health Checks**: Built-in health monitoring

### 🔄 Maintenance
- **Automatic Updates**: Daily update checks with systemd timer
- **Safe Updates**: Automatic backup before updates
- **Rollback Capability**: Easy rollback to previous version
- **Update Logging**: Comprehensive update and error logging

## Requirements

### System Requirements
- **OS**: Linux (Ubuntu, Debian, CentOS, Fedora, etc.)
- **Python**: 3.7 or higher
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Storage**: 1GB free space
- **Network**: Internet connection for installation and updates

### Professional Setup Requirements
- **Sudo Access**: Required for system configuration
- **Systemd**: For service management
- **Nginx**: Installed automatically
- **OpenSSL**: For SSL certificate generation

## Configuration

### File Locations (Professional Setup)
- **Application**: `~/Music-U-Scheduler/`
- **Web Interface**: `https://musicu.local`
- **Nginx Config**: `/etc/nginx/sites-available/musicu.local`
- **SSL Certificates**: `/etc/ssl/musicu/`
- **Service Files**: `/etc/systemd/system/music-u-scheduler*`
- **Logs**: `/var/log/music-u-scheduler-update.log`

### Customization
See [Professional Setup Documentation](docs/PROFESSIONAL_SETUP.md) for detailed configuration options.

## Development

### Local Development
```bash
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.main
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Professional Setup Issues
```bash
# Check service status
sudo systemctl status music-u-scheduler

# View service logs
sudo journalctl -u music-u-scheduler -f

# Check nginx status
sudo systemctl status nginx

# Test nginx configuration
sudo nginx -t

# Manual update
~/Music-U-Scheduler/scripts/update.sh --force
```

### Common Issues
- **Service won't start**: Check logs with `sudo journalctl -u music-u-scheduler`
- **SSL warnings**: Normal for self-signed certificates
- **Port conflicts**: Ensure port 8000 is available
- **Permission issues**: Ensure proper file permissions

### Getting Help
1. Check the [Professional Setup Documentation](docs/PROFESSIONAL_SETUP.md)
2. Review service logs: `sudo journalctl -u music-u-scheduler`
3. Check GitHub issues for known problems
4. Create a new issue with detailed information

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### Version 2.0.0 (Professional Release)
- **NEW**: Professional web interface with HTTPS
- **NEW**: Nginx reverse proxy with security headers
- **NEW**: Systemd service integration
- **NEW**: Automatic update system
- **NEW**: Firewall configuration
- **NEW**: Professional management tools
- **IMPROVED**: Enhanced installer with professional features
- **IMPROVED**: Better error handling and logging
- **IMPROVED**: Security hardening

### Version 1.0.0 (Initial Release)
- Basic desktop application
- Practice session scheduling
- Progress tracking
- Goal setting
- Practice history

## Acknowledgments

- Built with Python and modern web technologies
- Uses Nginx for high-performance web serving
- Systemd integration for reliable service management
- SSL/TLS security for safe web access

---

**🎵 Happy practicing with Music-U-Scheduler Professional!**

For detailed professional setup information, see [Professional Setup Documentation](docs/PROFESSIONAL_SETUP.md).