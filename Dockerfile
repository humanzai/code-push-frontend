# Use Node.js for building the app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy local repository files into the container
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build the project
RUN yarn build

# Use Nginx for serving the app
FROM nginx:alpine

# Copy built app to Nginx's default HTML directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the server port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]