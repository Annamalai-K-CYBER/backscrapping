@echo off
REM Quick start script for the AI Query server (Windows)

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   🚀 Installation ^& Setup Guide                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install it first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% found
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ npm install failed
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please edit .env and add your API keys:
    echo    - OPENROUTER_API_KEY
    echo    - MONGODB_URI
    echo    - IMAGEKIT credentials
    echo.
)

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║   📋 Next Steps:                                       ║
echo ╠════════════════════════════════════════════════════════╣
echo ║                                                        ║
echo ║  1. Edit .env with your credentials:                  ║
echo ║     notepad .env                                       ║
echo ║                                                        ║
echo ║  2. Start MongoDB (if local):                          ║
echo ║     mongod                                             ║
echo ║                                                        ║
echo ║  3. Start the server:                                  ║
echo ║     npm start                                          ║
echo ║                                                        ║
echo ║  4. In another terminal, run the demo:                ║
echo ║     node example-client.js                            ║
echo ║                                                        ║
echo ║  📚 Read README.md for full documentation              ║
echo ║                                                        ║
echo ╚════════════════════════════════════════════════════════╝
echo.

pause
