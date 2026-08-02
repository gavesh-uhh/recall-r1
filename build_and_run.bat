@echo off
setlocal

:: Ensure we are in the root directory of the project
cd /d "%~dp0"

echo ======================================
echo  Building and Starting Backend (Java)
echo ======================================
cd backend
:: Build the Spring Boot application
call mvn clean install -DskipTests

:: Start the Spring Boot application in a separate window so it runs concurrently
start "Recall Backend" cmd /c "mvn spring-boot:run"

echo ==========================================
echo  Building and Starting Frontend (Desktop)
echo ==========================================
cd ..\desktop-app
:: Install dependencies
call npm install

:: Start the Electron application
call npm run start

echo ==========================================
echo Frontend closed. 
echo NOTE: Please close the Backend command prompt window manually.
echo ==========================================

endlocal
