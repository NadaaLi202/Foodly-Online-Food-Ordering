# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the backend source code
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Start the server
CMD ["node", "index.js"]