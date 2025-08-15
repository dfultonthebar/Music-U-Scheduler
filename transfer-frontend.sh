
#!/bin/bash

# Transfer Frontend Update Script
# This script creates a compressed archive of the frontend directory for easy transfer

echo "Creating frontend update archive..."

# Create a temporary directory for the transfer
mkdir -p /tmp/musicu-frontend-update

# Copy the frontend directory
cp -r frontend/ /tmp/musicu-frontend-update/
cp FRONTEND_UPDATE_GUIDE.md /tmp/musicu-frontend-update/
cp frontend-updates.patch /tmp/musicu-frontend-update/

# Create the archive
cd /tmp
tar -czf musicu-frontend-update.tar.gz musicu-frontend-update/

# Move it back to the main directory
mv musicu-frontend-update.tar.gz /home/ubuntu/Music-U-Scheduler/

# Clean up
rm -rf /tmp/musicu-frontend-update

echo "Frontend update archive created: musicu-frontend-update.tar.gz"
echo "Transfer this file to your local machine and extract it in your Music-U-Scheduler directory"
echo ""
echo "To extract on your local machine:"
echo "tar -xzf musicu-frontend-update.tar.gz"
echo ""
echo "Then copy the contents to your repository:"
echo "cp -r musicu-frontend-update/frontend/ ./"
echo "cp musicu-frontend-update/FRONTEND_UPDATE_GUIDE.md ./"
