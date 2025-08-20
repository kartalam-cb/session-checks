#!/bin/zsh

# Script to test the authentication debugging improvements

echo "🔍 Starting Auth Debugging Tests..."

# Restart the Next.js server
echo "\n📡 Restarting Next.js server..."
if pgrep -f "next dev" > /dev/null; then
  pkill -f "next dev"
  echo "Killed existing Next.js server process."
fi

# Start the Next.js server in the background
echo "Starting Next.js server..."
npm run dev &

# Wait for server to start
echo "Waiting for server to start (10 seconds)..."
sleep 10

# Open the browser to test the authentication
echo "\n🌐 Opening browser to test authentication..."
open "http://localhost:3000/?debug=true"

echo "\n📋 Testing plan:"
echo "1. Use the enhanced OAuthDebugger to check auth cookies"
echo "2. Try using the PKCE debugging options"
echo "3. Attempt authentication with different security settings"
echo "4. Check API sessions with the new API Session tab"
echo "5. If authentication fails, check the improved error page at /auth/error"

echo "\n⚠️ Remember to check the developer console for detailed logs"

echo "\n✅ Setup complete - follow the testing plan in your browser"
