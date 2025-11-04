# Use Node.js 20
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json .npmrc ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
# Railway automatically passes all environment variables during build
# VITE_* variables are needed at build time for Vite to inline them
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build

# Expose port (Railway sets PORT env var)
EXPOSE ${PORT:-5000}

# Start the application
CMD ["npm", "run", "start"]

