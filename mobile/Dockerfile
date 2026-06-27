# Stage 1: Build môi trường React Native Web (Expo)
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Cài đặt các thư viện
RUN npm install

# Copy toàn bộ code
COPY . .

# Tiến hành build web
RUN npx expo export -p web

# Stage 2: Deploy sản phẩm lên Nginx container
FROM nginx:alpine

# Copy kết quả build web từ Stage 1 sang thư mục chạy của Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]