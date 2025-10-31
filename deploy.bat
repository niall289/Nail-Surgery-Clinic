@echo off
REM Windows batch file to deploy Nail Surgery Clinic to Hetzner

echo 🚀 NAIL SURGERY CLINIC - HETZNER DEPLOYMENT
echo ============================================
echo Server: 91.99.104.138
echo.

REM Check if scripts exist
if not exist "scripts\deploy-hetzner.sh" (
    echo ❌ Error: deploy-hetzner.sh not found
    echo Please ensure you're running this from the project root directory
    pause
    exit /b 1
)

if not exist "scripts\deploy-app.sh" (
    echo ❌ Error: deploy-app.sh not found
    echo Please ensure you're running this from the project root directory
    pause
    exit /b 1
)

echo 📋 Deployment Steps:
echo 1. Server setup (if first time)
echo 2. Application deployment
echo.

set /p FIRST_TIME="Is this the first deployment to this server? (y/N): "

if /i "%FIRST_TIME%"=="y" (
    echo.
    echo 🔧 Step 1: Setting up server infrastructure...
    echo Uploading server setup script...
    
    scp scripts/deploy-hetzner.sh root@91.99.104.138:/tmp/
    if errorlevel 1 (
        echo ❌ Failed to upload server setup script
        pause
        exit /b 1
    )
    
    echo Running server setup (this may take several minutes)...
    ssh root@91.99.104.138 "chmod +x /tmp/deploy-hetzner.sh && /tmp/deploy-hetzner.sh"
    if errorlevel 1 (
        echo ❌ Server setup failed
        pause
        exit /b 1
    )
    
    echo ✅ Server setup completed
    echo.
)

echo 🚀 Step 2: Deploying application...
echo Converting scripts to Unix format...
wsl dos2unix scripts/deploy-app.sh 2>nul || echo Note: dos2unix not available, continuing...

echo Deploying application code...
bash scripts/deploy-app.sh
if errorlevel 1 (
    echo ❌ Application deployment failed
    pause
    exit /b 1
)

echo.
echo 🎉 DEPLOYMENT COMPLETED!
echo ======================
echo.
echo 📊 Your application is now available at:
echo 🌐 https://nailsurgeryclinic.engageiobots.com
echo.
echo 📋 Next steps:
echo 1. Test the application in your browser
echo 2. Set up domain name and SSL certificate
echo 3. Test webhook integration
echo.
echo 🔧 Useful commands:
echo Check status: ssh root@91.99.104.138 "systemctl status nail-surgery-clinic"
echo View logs:    ssh root@91.99.104.138 "journalctl -u nail-surgery-clinic -f"
echo Restart:      ssh root@91.99.104.138 "systemctl restart nail-surgery-clinic"
echo.

pause