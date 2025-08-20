#!/bin/zsh

# Restart the Next.js server to apply auth changes

echo "🔄 Restarting Next.js server with new auth configuration..."

# Kill any existing Next.js server
if pgrep -f "next dev" > /dev/null; then
  pkill -f "next dev"
  echo "✅ Killed existing Next.js server process."
fi

# Clear cookies directory in case of stale data
echo "🧹 Clearing browser data (run this manually in Chrome):"
echo "1. Open Chrome DevTools"
echo "2. Go to Application tab"
echo "3. Select 'Clear site data' under Storage"
echo "4. Select 'Clear site data' button"

# Start the Next.js server
echo "🚀 Starting Next.js server with updated auth configuration..."
npm run dev

echo "✅ Server started. Try the authentication flow again."
