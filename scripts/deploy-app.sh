#!/bin/bash

# 🚀 Application Deployment Script for Nail Surgery Clinic
# This script deploys the application code to the Hetzner server

set -e

# Configuration
SERVER_IP="91.99.104.138"
PROJECT_NAME="Nail-Surgery-Clinic"
APP_DIR="/var/www/${PROJECT_NAME}"
BACKUP_DIR="/var/backups/${PROJECT_NAME}"
SERVICE_NAME="nail-surgery-clinic"
LOCAL_DIR="."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if we can connect to server
check_connection() {
    print_status "Checking connection to server $SERVER_IP..."
    
    if ! ssh -o ConnectTimeout=10 root@$SERVER_IP "echo 'Connection OK'" >/dev/null 2>&1; then
        print_error "Cannot connect to server $SERVER_IP"
        print_error "Please ensure:"
        print_error "1. Server is running"
        print_error "2. SSH key is set up"
        print_error "3. Port 22 is open"
        exit 1
    fi
    
    print_success "Connected to server"
}

# Create backup of existing deployment
create_backup() {
    print_status "Creating backup of existing deployment..."
    
    ssh root@$SERVER_IP "
        if [ -d '$APP_DIR' ]; then
            BACKUP_NAME=\$(date +%Y%m%d_%H%M%S)
            mkdir -p $BACKUP_DIR
            cp -r $APP_DIR $BACKUP_DIR/backup_\$BACKUP_NAME
            echo 'Backup created: $BACKUP_DIR/backup_'\$BACKUP_NAME
        else
            echo 'No existing deployment to backup'
        fi
    "
    
    print_success "Backup completed"
}

# Stop the application
stop_application() {
    print_status "Stopping application..."
    
    ssh root@$SERVER_IP "
        systemctl stop $SERVICE_NAME 2>/dev/null || echo 'Service not running'
        pkill -f 'node.*server' || echo 'No node processes found'
    "
    
    print_success "Application stopped"
}

# Upload application files
upload_files() {
    print_status "Uploading application files..."
    
    # Create exclude patterns for rsync
    cat > /tmp/rsync-exclude << 'EOF'
node_modules/
.git/
.env
.env.*
dist/
build/
*.log
.DS_Store
Thumbs.db
*.tmp
*.temp
coverage/
.nyc_output/
.cache/
.vscode/
.idea/
*.swp
*.swo
*~
EOF

    # Upload files using rsync
    rsync -avz --delete \
        --exclude-from=/tmp/rsync-exclude \
        --progress \
        $LOCAL_DIR/ root@$SERVER_IP:$APP_DIR/
    
    # Clean up
    rm /tmp/rsync-exclude
    
    print_success "Files uploaded"
}

# Install dependencies and build
install_and_build() {
    print_status "Installing dependencies and building application..."
    
    ssh root@$SERVER_IP "
        cd $APP_DIR
        
        # Set Node.js environment
        export NODE_ENV=production
        
        # Install dependencies
        echo 'Installing npm dependencies...'
        npm install --production --silent
        
        # Build TypeScript if needed
        if [ -f 'tsconfig.json' ]; then
            echo 'Building TypeScript...'
            npx tsc --build
        fi
        
        # Set proper ownership
        chown -R www-data:www-data $APP_DIR
        chmod -R 755 $APP_DIR
        
        echo 'Dependencies installed and built'
    "
    
    print_success "Installation and build completed"
}

# Set up production environment
setup_environment() {
    print_status "Setting up production environment..."
    
    ssh root@$SERVER_IP "
        cd $APP_DIR
        
        # Copy production environment file
        if [ -f '.env.production' ]; then
            cp .env.production .env
            chmod 600 .env
            chown www-data:www-data .env
            echo 'Production environment configured'
        else
            echo 'Warning: .env.production not found'
        fi
    "
    
    print_success "Environment configured"
}

# Start the application
start_application() {
    print_status "Starting application..."
    
    ssh root@$SERVER_IP "
        systemctl start $SERVICE_NAME
        systemctl enable $SERVICE_NAME
        
        # Wait a moment for startup
        sleep 5
        
        # Check if service is running
        if systemctl is-active --quiet $SERVICE_NAME; then
            echo 'Application started successfully'
        else
            echo 'Error: Application failed to start'
            journalctl -u $SERVICE_NAME --no-pager -n 20
            exit 1
        fi
    "
    
    print_success "Application started"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Test health endpoint  
    if curl -f https://nailsurgeryclinic.engageiobots.com/api/health >/dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_warning "Health check failed - application may still be starting"
    fi
    
    # Test webhook endpoint
    if curl -f https://nailsurgeryclinic.engageiobots.com/api/debug/test-webhook >/dev/null 2>&1; then
        print_success "Debug endpoint accessible"
    else
        print_warning "Debug endpoint not accessible (may be disabled in production)"
    fi
    
    print_success "Deployment verification completed"
}

# Show deployment status
show_status() {
    echo ""
    echo "🎉 DEPLOYMENT COMPLETED!"
    echo "======================="
    echo "Server: https://nailsurgeryclinic.engageiobots.com"
    echo "Application: Nail Surgery Clinic"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Test the application: https://nailsurgeryclinic.engageiobots.com"
    echo "2. Set up domain and SSL certificate"
    echo "3. Configure monitoring and backups"
    echo "4. Test webhook integration"
    echo ""
    echo "📊 Useful Commands:"
    echo "Check status:    ssh root@$SERVER_IP 'systemctl status $SERVICE_NAME'"
    echo "View logs:       ssh root@$SERVER_IP 'journalctl -u $SERVICE_NAME -f'"
    echo "Restart app:     ssh root@$SERVER_IP 'systemctl restart $SERVICE_NAME'"
    echo ""
}

# Main deployment function
main() {
    echo "🚀 NAIL SURGERY CLINIC - APPLICATION DEPLOYMENT"
    echo "==============================================="
    echo "Target Server: $SERVER_IP"
    echo ""
    
    check_connection
    create_backup
    stop_application
    upload_files
    install_and_build
    setup_environment
    start_application
    verify_deployment
    show_status
}

# Run main function
main "$@"