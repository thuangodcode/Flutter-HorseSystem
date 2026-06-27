# Stage 1: Build môi trường Flutter Web
FROM ghcr.io/cirruslabs/flutter:latest AS build
WORKDIR /app

# Copy toàn bộ code của app Flutter vào container
COPY . .

# Lấy các thư viện và tiến hành build web
RUN flutter pub get
RUN flutter build web --release

# Stage 2: Deploy sản phẩm lên Nginx container
FROM nginx:alpine

# Copy kết quả build web từ Stage 1 sang thư mục chạy của Nginx
COPY --from=build /app/build/web /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]