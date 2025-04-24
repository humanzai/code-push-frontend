FROM node:18.18.2-alpine3.18

# Install nginx, bash, and jq
RUN apk add nginx bash jq

# Set working directory
WORKDIR /

# Copy frontend build and config files
COPY ./dist /dist
COPY ./config.example.js /dist/config.example.js
COPY ./env.sh /dist/env.sh

# Set permissions and copy .env if present
RUN chmod +x /dist/env.sh
RUN if [ -f .env ]; then cp .env /dist/.env; fi

# Create base nginx config and include mime types
RUN mkdir -p /etc/nginx && echo "events { } \
http { \
    include /etc/nginx/mime.types; \
    include /etc/nginx/conf.d/*.conf; \
    default_type application/octet-stream; \
}" > /etc/nginx/nginx.conf

# Configure nginx server with corrected /api reverse proxy
RUN mkdir -p /etc/nginx/conf.d && echo "server { \
    listen 80; \
    server_name localhost; \
    root /dist; \
    index index.html; \
    location / { \
        try_files \$uri /index.html; \
    } \
    location /assets/ { \
        root /dist; \
        expires max; \
        access_log off; \
    } \
    
    location /config.js { \
        root /dist; \
    } \

    location ~* \.(js|mjs|css|html|json|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|otf)$ { \
        try_files \$uri =404; \
    } \
    location /api/ { \
        proxy_pass \$BACKEND_URL/; \
        proxy_ssl_verify off; \
        log_subrequest on; \
    } \
} \
access_log /dev/stdout; \
error_log /dev/stderr info;" > /etc/nginx/conf.d/default.conf

# Expose the default port
EXPOSE 80

# Run env script, extract BACKEND_URL, log it, and launch nginx
ENTRYPOINT ["/bin/bash", "-c", "cd dist && ./env.sh && \
  BACKEND_URL=$(awk -F'\"' '/BACKEND_URL/ {print $4}' /dist/config.js) && \
  echo \"Extracted BACKEND_URL: $BACKEND_URL\" && \
  # Replace variable in nginx config
  sed -i \"s|\\$BACKEND_URL|$BACKEND_URL|g\" /etc/nginx/conf.d/default.conf && \
  # Print the final proxy configuration for debugging
  # Test backend connection
  echo \"Testing connection to backend at $BACKEND_URL\" && \
  wget -q --spider --timeout=3 $BACKEND_URL || echo \"Warning: Backend seems unreachable\" && \
  # Start nginx in debug mode for more verbose output
  nginx -g 'daemon off; error_log /dev/stderr debug;'"]