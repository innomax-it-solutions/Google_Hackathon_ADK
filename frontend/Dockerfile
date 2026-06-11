# --- build stage: compile the Vite app ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# `vite build` runs in production mode and reads .env.production, baking
# VITE_API_URL (the Cloud Run backend) into the static bundle.
RUN npm run build

# --- serve stage: static files via nginx ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Cloud Run sends traffic to $PORT (8080); nginx.conf listens there.
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
