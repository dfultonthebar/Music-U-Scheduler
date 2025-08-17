
# 🎵 Music U Scheduler v1.3.00

A comprehensive music lesson scheduling application built with Next.js (frontend) and FastAPI (backend), featuring JWT authentication, admin panels, instructor dashboards, and student management.

## ✨ Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure session management
- **Role-based access control** (Admin, Instructor, Student)
- **Multi-role support** for instructors
- **Secure password hashing** with bcrypt

### 👥 User Management
- **Admin Dashboard** with full system control
- **Instructor Portal** for lesson and student management
- **Student Interface** for booking and viewing lessons
- **User profile management** with customizable settings

### 📅 Scheduling System
- **Interactive calendar** for lesson scheduling
- **Recurring lesson support** with flexible patterns
- **Conflict detection** and resolution
- **Automated notifications** and reminders

### 📊 Analytics & Reporting
- **Revenue tracking** and financial reports
- **Student progress monitoring**
- **Instructor performance analytics**
- **Customizable dashboard widgets**

### ⚙️ Administration
- **System settings** management
- **Email server configuration**
- **Backup and restore** functionality
- **Audit logging** for security compliance

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+
- **Git**

### One-Line Installation

```bash
curl -sSL https://raw.githubusercontent.com/dfultonthebar/Music-U-Scheduler/main/install.sh | bash
```

This installer will:
- ✅ Automatically clone the repository
- ✅ Set up Python virtual environment  
- ✅ Install all backend dependencies
- ✅ Configure Node.js frontend
- ✅ Create database and environment files
- ✅ Generate startup scripts

Or clone and install manually:

```bash
git clone https://github.com/dfultonthebar/Music-U-Scheduler.git
cd Music-U-Scheduler
./install.sh
```

### Starting the Application

After installation, start all services:

```bash
./start-all.sh
```

Or manage services individually:

```bash
./manage-services.sh start    # Start all services
./manage-services.sh stop     # Stop all services  
./manage-services.sh restart  # Restart all services
./manage-services.sh status   # Check service status
```

## 🌐 Access URLs

Once running, access the application at:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:8080  
- **API Documentation**: http://localhost:8080/docs
- **Alternative API Docs**: http://localhost:8080/redoc

## 📁 Project Structure

```
music-u-scheduler/
├── app/                          # Next.js frontend & FastAPI backend
│   ├── api/                      # API routes and controllers
│   ├── app/                      # Next.js app directory
│   ├── components/               # Reusable React components
│   ├── auth/                     # Authentication logic
│   ├── lib/                      # Utility libraries
│   ├── prisma/                   # Database schema and migrations
│   ├── main.py                   # FastAPI application entry point
│   ├── models.py                 # Database models
│   ├── schemas.py                # Pydantic schemas
│   └── package.json              # Node.js dependencies
├── music-u-env/                  # Python virtual environment
├── static/                       # Static assets
├── logs/                         # Application logs
├── install.sh                    # Installation script
├── start-all.sh                  # Combined startup script
├── start-backend.sh              # Backend startup script
├── start-frontend.sh             # Frontend startup script
├── manage-services.sh            # Service management script
├── requirements.txt              # Python dependencies
└── .env                          # Environment configuration
```

## ⚙️ Configuration

### Environment Variables

#### Backend Configuration (`.env`)
```bash
DATABASE_URL=sqlite:///./app.db
ENVIRONMENT=development
LOG_LEVEL=info
```

#### Frontend Configuration (`app/.env`)
```bash
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Database Setup

The application uses SQLite by default for development. The database is automatically initialized during installation.

For production, you can configure PostgreSQL by updating the `DATABASE_URL` in `.env`.

## 🔧 Development

### Running in Development Mode

1. **Backend Development**:
   ```bash
   ./start-backend.sh
   ```
   The API will be available at http://localhost:8080 with auto-reload enabled.

2. **Frontend Development**:
   ```bash  
   ./start-frontend.sh
   ```
   The web app will be available at http://localhost:3000 with hot-reload enabled.

### API Testing

Access the interactive API documentation:
- **Swagger UI**: http://localhost:8080/docs
- **ReDoc**: http://localhost:8080/redoc

### Frontend Features

The Next.js frontend includes:
- **Server-side rendering** for improved SEO
- **Responsive design** with Tailwind CSS
- **Component library** with Radix UI
- **Form validation** with React Hook Form
- **State management** with Zustand

## 📊 Default Users

After installation, you can create admin users through the API or use the registration system.

## 🛠️ Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   ./manage-services.sh stop
   ./manage-services.sh start
   ```

2. **Services won't start**:
   - Check that ports 3000 and 8080 are available
   - Verify Python virtual environment is activated
   - Check logs in the `logs/` directory

3. **Database errors**:
   - Delete `app.db` and restart to recreate database
   - Check SQLite installation and permissions

4. **Frontend build issues**:
   ```bash
   cd app
   rm -rf .next node_modules
   npm install
   npm run build
   ```

5. **Backend import errors**:
   - Ensure you're running from the correct directory
   - Verify Python virtual environment is activated
   - Check that all dependencies are installed

### Getting Help

1. Check the **logs** directory for error details
2. Run `./manage-services.sh status` to verify service status
3. Test API endpoints at http://localhost:8080/docs
4. Verify environment configuration in `.env` files

## 🚀 Deployment

### Production Deployment

For production deployment:

1. **Update environment variables** for production
2. **Configure a proper database** (PostgreSQL recommended)
3. **Set up a reverse proxy** (nginx recommended)
4. **Configure SSL certificates**
5. **Set up process management** (systemd, PM2, etc.)

### Docker Deployment

Docker support coming soon.

## 🔐 Security Considerations

- Change default JWT secrets in production
- Use HTTPS in production environments
- Configure CORS properly for your domain
- Regular security updates for dependencies
- Implement proper backup strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Documentation**: Check this README and API docs
- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions

## 🎯 Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Payment integration
- [ ] Video lesson support
- [ ] Multi-tenancy support
- [ ] Docker containerization
- [ ] Kubernetes deployment guides

---

**Made with ❤️ for music educators and students**
