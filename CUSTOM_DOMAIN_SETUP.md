
# 🎵 Music-U-Scheduler Custom Domain Setup

## ✅ **Setup Complete!**

Your Music-U-Scheduler application is now configured with a professional custom domain setup:

### 🌐 **Access Your Application**

| Service | URL | Description |
|---------|-----|-------------|
| **Main Application** | **https://musicu.local** | 🔒 **Recommended** - Full SSL-secured access |
| Frontend Direct | http://localhost:3000 | Direct Next.js access (bypass proxy) |
| Backend API | http://localhost:8000 | Direct FastAPI access |
| API Documentation | https://musicu.local/docs | SSL-secured API docs |

---

## 🚀 **Quick Start**

### **Option 1: Use the Launcher (Recommended)**
```bash
cd /home/ubuntu/music-u-scheduler-frontend
./start-musicu.sh
```

### **Option 2: Manual Access**
Simply open https://musicu.local in your browser

---

## 🔒 **SSL Certificate Notice**

Since we use a **self-signed SSL certificate** for local development, your browser will show a security warning:

### **How to Proceed:**
1. Visit https://musicu.local
2. Click **"Advanced"** 
3. Click **"Proceed to musicu.local (unsafe)"**
4. ✅ You'll then see the application!

This is **completely safe** for local development.

---

## 👤 **Default Admin Access**

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `MusicU2025` |

---

## 🔧 **Technical Details**

### **Architecture:**
- **Nginx**: Reverse proxy with SSL termination
- **Frontend**: Next.js on port 3000
- **Backend**: FastAPI on port 8000
- **Domain**: musicu.local (local DNS via /etc/hosts)

### **SSL Certificate:**
- **Certificate**: `/etc/ssl/certs/musicu.local.crt`
- **Private Key**: `/etc/ssl/private/musicu.local.key`
- **Valid for**: 365 days from creation

### **Nginx Configuration:**
- **HTTP (port 80)**: Redirects to HTTPS
- **HTTPS (port 443)**: Serves application with SSL
- **API Proxy**: `/api/` → `http://localhost:8000/`
- **Docs Proxy**: `/docs` → `http://localhost:8000/docs`

---

## 🛠️ **Troubleshooting**

### **502 Bad Gateway Error**
If you see this error, one of the services isn't running:

```bash
# Check service status
netstat -tlpn | grep LISTEN

# Should show:
# Port 80 (nginx HTTP)
# Port 443 (nginx HTTPS)  
# Port 3000 (Next.js)
# Port 8000 (FastAPI)
```

**Fix:**
```bash
cd /home/ubuntu/music-u-scheduler-frontend
./start-musicu.sh
```

### **"This site can't be reached" Error**
This means nginx isn't running:

```bash
# Start nginx
sudo nginx

# Check if running
ps aux | grep nginx
```

### **Frontend/Backend Issues**
```bash
# Check both services are running
curl http://localhost:3000  # Should return Next.js page
curl http://localhost:8000  # Should return FastAPI response

# If not running, use the launcher
./start-musicu.sh
```

---

## 📝 **Repository Status**

### **Branch Structure:**
- ✅ **`main`** - Single production branch (all others removed)
- ✅ **Latest code pushed** - All updates committed and pushed to GitHub

### **Recent Updates:**
- ✅ Custom domain with SSL setup
- ✅ Nginx reverse proxy configuration  
- ✅ Branch cleanup (main branch only)
- ✅ Enhanced UI/UX with modern design
- ✅ Complete authentication system
- ✅ Admin and student dashboards

---

## 🎯 **Next Steps**

1. **Access the application**: https://musicu.local
2. **Log in as admin**: admin / MusicU2025  
3. **Explore the features**:
   - User management
   - Lesson scheduling
   - Student dashboard
   - Theme switching (dark/light)
4. **Deploy to production** (when ready)

---

## 💡 **Development Tips**

### **Making Changes:**
All changes are automatically pushed to the main branch. To deploy updates on other machines:

```bash
git pull origin main
./start-musicu.sh
```

### **SSL Certificate Renewal:**
The certificate is valid for 365 days. To renew:

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/musicu.local.key \
  -out /etc/ssl/certs/musicu.local.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=musicu.local"

sudo nginx -s reload
```

---

**🎵 Your Music-U-Scheduler is ready to rock! 🚀**
