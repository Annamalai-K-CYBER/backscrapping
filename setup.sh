#!/usr/bin/env bash
# Quick start script for the AI Query server

echo "╔════════════════════════════════════════════════════════╗"
echo "║   🚀 Installation & Setup Guide                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install it first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API keys:"
    echo "   - OPENROUTER_API_KEY"
    echo "   - MONGODB_URI"
    echo "   - IMAGEKIT credentials"
    echo ""
fi

echo "╔════════════════════════════════════════════════════════╗"
echo "║   📋 Next Steps:                                       ║"
echo "╠════════════════════════════════════════════════════════╣"
echo "║                                                        ║"
echo "║  1. Edit .env with your credentials:                  ║"
echo "║     nano .env                                          ║"
echo "║                                                        ║"
echo "║  2. Start MongoDB (if local):                          ║"
echo "║     mongod                                             ║"
echo "║                                                        ║"
echo "║  3. Start the server:                                  ║"
echo "║     npm start                                          ║"
echo "║                                                        ║"
echo "║  4. In another terminal, run the demo:                ║"
echo "║     node example-client.js                            ║"
echo "║                                                        ║"
echo "║  📚 Read README.md for full documentation              ║"
echo "║                                                        ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
