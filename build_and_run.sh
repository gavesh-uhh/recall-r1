#!/bin/bash

# Ensure we are in the root directory of the project
cd "$(dirname "$0")"

echo "======================================"
echo " Building and Starting Backend (Java) "
echo "======================================"
cd backend
# Build the Spring Boot application
mvn clean install -DskipTests

# Run the Spring Boot application in the background
mvn spring-boot:run &
BACKEND_PID=$!

echo "=========================================="
echo " Building and Starting Frontend (Desktop) "
echo "=========================================="
cd ../desktop-app
# Install dependencies
npm install

# Start the Electron application
npm run start

# When the Electron app is closed, kill the backend process
echo "Frontend closed. Shutting down the backend..."
kill $BACKEND_PID
echo "Done."
