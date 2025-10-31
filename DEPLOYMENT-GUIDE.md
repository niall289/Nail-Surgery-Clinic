# 🚀 Nail Surgery Clinic - Hetzner Deployment Guide

## Server Information
- **Hetzner Server IP:** 91.99.104.138
- **Domain:** nailsurgeryclinic.engageiobots.com
- **Project:** Nail-Surgery-Clinic
- **Application Port:** 5021
- **Web Server:** Nginx (reverse proxy)

## Prerequisites
- SSH access to Hetzner server 91.99.104.138 (root user)
- Domain nailsurgeryclinic.engageiobots.com pointing to 91.99.104.138
- Git repository access

## Quick Start Commands

### 1. Initial Server Setup
```bash
# On your local machine, upload and run the server setup script
scp scripts/deploy-hetzner.sh root@91.99.104.138:/tmp/
ssh root@91.99.104.138 "chmod +x /tmp/deploy-hetzner.sh && /tmp/deploy-hetzner.sh"
```

### 2. Deploy Application
```bash
# Make the deployment script executable
chmod +x scripts/deploy-app.sh

# Run the deployment
./scripts/deploy-app.sh
```

## Step-by-Step Deployment Process

### Phase 1: Server Setup (Run Once)

1. **Connect to your server:**
   ```bash
   ssh root@91.99.104.138
   ```

2. **Run the server setup script:**
   ```bash
   # Upload the script
   scp scripts/deploy-hetzner.sh root@91.99.104.138:/tmp/
   
   # Execute on server
   ssh root@91.99.104.138 "chmod +x /tmp/deploy-hetzner.sh && /tmp/deploy-hetzner.sh"
   ```

This will install:
- Node.js 18
- PM2 process manager
- Nginx web server
- Certbot for SSL
- UFW firewall
- Application directories
- Systemd service

### Phase 2: Application Deployment

1. **Deploy the application:**
   ```bash
   # Make script executable
   chmod +x scripts/deploy-app.sh
   
   # Run deployment
   ./scripts/deploy-app.sh
   ```

This will:
- Create backup of existing deployment
- Stop current application
- Upload new code
- Install dependencies
- Build the application
- Start the service
- Verify deployment

### Phase 3: Post-Deployment

1. **Test the application:**
   ```bash
   # Health check
   curl https://nailsurgeryclinic.engageiobots.com/api/health
   
   # Test webhook (if debug enabled)
   curl https://nailsurgeryclinic.engageiobots.com/api/debug/test-webhook
   ```

2. **Check service status:**
   ```bash
   ssh root@91.99.104.138 "systemctl status nail-surgery-clinic"
   ```

3. **View logs:**
   ```bash
   ssh root@91.99.104.138 "journalctl -u nail-surgery-clinic -f"
   ```

## Manual Commands (if needed)

### Server Management
```bash
# Connect to server
ssh root@91.99.104.138

# Check application status
systemctl status nail-surgery-clinic

# Start/stop/restart application
systemctl start nail-surgery-clinic
systemctl stop nail-surgery-clinic
systemctl restart nail-surgery-clinic

# View logs
journalctl -u nail-surgery-clinic -f
journalctl -u nail-surgery-clinic --since "1 hour ago"

# Check nginx status
systemctl status nginx
nginx -t  # Test configuration
```

### Application Management
```bash
# Navigate to app directory
cd /var/www/Nail-Surgery-Clinic

# Install dependencies
npm install --production

# Check environment
cat .env

# Manual start (for debugging)
NODE_ENV=production node server/index.js
```

### File Structure on Server
```
/var/www/Nail-Surgery-Clinic/           # Application root
├── server/                             # Server code
├── client/                             # Client code
├── shared/                             # Shared code
├── package.json                        # Dependencies
├── .env                               # Environment variables
└── dist/                              # Built files

/var/backups/Nail-Surgery-Clinic/      # Backups
├── backup_20241021_120000/            # Timestamped backups
└── ...

/etc/nginx/sites-available/Nail-Surgery-Clinic  # Nginx config
/etc/systemd/system/nail-surgery-clinic.service # Service config
```

## Environment Configuration

The production environment file is located at:
`/var/www/Nail-Surgery-Clinic/.env`

Key variables:
```bash
NODE_ENV=production
PORT=5021
PORTAL_WEBHOOK_URL=https://eteaportal.engageiobots.com/api/webhooks/nailsurgery
NAIL_WEBHOOK_SECRET=nailsurgery_secret_2025
# ... other variables
```

## SSL Certificate Setup (Optional but Recommended)

After setting up a domain:

1. **Point domain to server:**
   - DNS A record: `nailsurgeryclinic.engageiobots.com` → `91.99.104.138` (should already be configured)

2. **Update Nginx configuration:**
   ```bash
   ssh root@91.99.104.138
   nano /etc/nginx/sites-available/Nail-Surgery-Clinic
   # Change server_name from IP to your domain
   ```

3. **Get SSL certificate:**
   ```bash
   certbot --nginx -d your-domain.com
   ```

## Monitoring and Maintenance

### Health Checks
```bash
# Application health
curl https://nailsurgeryclinic.engageiobots.com/api/health

# System resources
ssh root@91.99.104.138 "htop"
ssh root@91.99.104.138 "df -h"
ssh root@91.99.104.138 "free -h"
```

### Log Monitoring
```bash
# Application logs
ssh root@91.99.104.138 "tail -f /var/log/syslog | grep nail-surgery"

# Nginx logs
ssh root@91.99.104.138 "tail -f /var/log/nginx/access.log"
ssh root@91.99.104.138 "tail -f /var/log/nginx/error.log"
```

### Backup Management
```bash
# List backups
ssh root@91.99.104.138 "ls -la /var/backups/Nail-Surgery-Clinic/"

# Restore from backup (if needed)
ssh root@91.99.104.138 "
    systemctl stop nail-surgery-clinic
    cp -r /var/backups/Nail-Surgery-Clinic/backup_YYYYMMDD_HHMMSS/* /var/www/Nail-Surgery-Clinic/
    systemctl start nail-surgery-clinic
"
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
journalctl -u nail-surgery-clinic --no-pager -n 50

# Check environment
cd /var/www/Nail-Surgery-Clinic && cat .env

# Check dependencies
cd /var/www/Nail-Surgery-Clinic && npm list

# Test manual start
cd /var/www/Nail-Surgery-Clinic && NODE_ENV=production node server/index.js
```

### Port Already in Use
```bash
# Find process using port 5021
lsof -i :5021
netstat -tulpn | grep :5021

# Kill process if needed
pkill -f "node.*server"
```

### Nginx Issues
```bash
# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Check error logs
tail -f /var/log/nginx/error.log
```

## Security Considerations

- Firewall is configured to allow only ports 22, 80, 443
- Application runs as `www-data` user (non-root)
- Environment files have restricted permissions (600)
- Regular security updates recommended

## Performance Optimization

- Application uses production mode
- Nginx serves static files directly
- Gzip compression enabled
- PM2 can be used for clustering if needed

---

## Quick Reference

**Deploy new version:**
```bash
./scripts/deploy-app.sh
```

**Check status:**
```bash
ssh root@91.99.104.138 "systemctl status nail-surgery-clinic"
```

**View logs:**
```bash
ssh root@91.99.104.138 "journalctl -u nail-surgery-clinic -f"
```

**Restart app:**
```bash
ssh root@91.99.104.138 "systemctl restart nail-surgery-clinic"
```