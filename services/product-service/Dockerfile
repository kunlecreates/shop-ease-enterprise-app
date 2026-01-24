FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN rm -f tsconfig.tsbuildinfo && npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
# Copy production dependencies from the deps stage so runtime has node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
RUN addgroup -S app && adduser -S app -G app
USER app
# Application listens on port 3000 in the Kubernetes Deployment
EXPOSE 3000
CMD ["node","dist/main.js"]