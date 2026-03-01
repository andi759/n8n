#!/bin/bash
set -e

echo "Deploying Room Booking..."

cd /var/www/roombooking

GIT_TERMINAL_PROMPT=0 git pull

cd frontend && npm install && npm run build
chmod -R 755 /var/www/roombooking/frontend/build

cd /var/www/roombooking/backend && npm install

pm2 restart booking-api

echo "Deploy complete!"
