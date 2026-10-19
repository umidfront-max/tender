# 1-bosqich: Vite build
FROM node:22-alpine AS build
WORKDIR /app

# Avval faqat lock-fayl — kod o'zgarsa ham npm ci qatlami keshdan olinadi
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# VITE_API_BASE berilmaydi: so'rovlar nisbiy /api ga ketadi va nginx proxy qiladi
RUN npm run build

# 2-bosqich: statik fayllarni nginx beradi
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
