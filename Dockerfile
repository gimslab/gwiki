# Stage 1: Build
FROM node:18 AS build

WORKDIR /app

# Copy frontend and install dependencies
COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend

# Copy backend and install dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend

# Copy source code
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend
RUN npm run build --prefix frontend

# Build backend
RUN npm run build --prefix backend

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy built backend
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package*.json ./backend/

# Copy built frontend
COPY --from=build /app/frontend/dist ./frontend/dist

# Install backend production dependencies
RUN npm install --prefix backend --only=production

EXPOSE 8080

CMD ["node", "backend/dist/index.js"]
