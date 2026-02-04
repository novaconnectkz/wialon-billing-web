FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json
COPY package*.json ./
RUN npm install

# Копируем исходники
COPY . .

# Собираем
RUN npm run build

# Финальный образ с nginx
FROM nginx:alpine

# Копируем сборку
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфиг nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
