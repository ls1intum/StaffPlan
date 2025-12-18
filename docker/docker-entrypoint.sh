#!/bin/sh
set -e

# Replace placeholders in JavaScript files with environment variables
# This allows runtime configuration of the Angular app

if [ -n "$KEYCLOAK_URL" ]; then
  echo "Configuring Keycloak URL: $KEYCLOAK_URL"
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__KEYCLOAK_URL__|$KEYCLOAK_URL|g" {} \;
fi

# Execute the main command (nginx)
exec "$@"
