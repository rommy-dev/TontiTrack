#!/bin/sh
set -e

# Replace placeholder token in built assets with runtime environment variable
# If VITE_API_URL is empty, we leave the placeholder untouched.
if [ -n "$VITE_API_URL" ]; then
  echo "Patching built assets with VITE_API_URL=$VITE_API_URL"
  # Replace occurrences of the placeholder in HTML/JS/CSS files
  find /usr/share/nginx/html -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" \) -print0 |
    xargs -0 sed -i "s|%%VITE_API_URL%%|$VITE_API_URL|g" || true
else
  echo "VITE_API_URL not set; leaving built assets as-is"
fi

# Start nginx
exec nginx -g 'daemon off;'
