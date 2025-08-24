FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY deno.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create database directory
RUN mkdir -p data

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "server.js"]
