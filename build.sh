#!/bin/bash
# Build script for Render deployment

echo "Installing root dependencies..."
npm install

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Installing frontend dependencies and building..."
cd frontend
npm install
npm run build
cd ..

echo "Build completed successfully!"
