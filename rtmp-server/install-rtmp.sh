#!/bin/bash
# Copie e cole este comando INTEIRO na sua VPS via SSH

# 1. Conecte via SSH:
# ssh root@72.61.135.214
# Senha: M@t3m@t1c@10

# 2. Cole este comando completo:

curl -fsSL https://get.docker.com | sh && \
mkdir -p ~/rtmp-server/nginx-rtmp && \
cd ~/rtmp-server && \
cat > docker-compose.yml << 'COMPOSE_EOF'
version: '3.8'
services:
  nginx-rtmp:
    image: tiangolo/nginx-rtmp
    container_name: rtmp-server
    restart: unless-stopped
    ports:
      - "1935:1935"
      - "8080:80"
    volumes:
      - ./nginx-rtmp/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx-rtmp/hls:/tmp/hls
    networks:
      - streaming
networks:
  streaming:
    driver: bridge
COMPOSE_EOF
cat > nginx-rtmp/nginx.conf << 'NGINX_EOF'
worker_processes auto;
rtmp_auto_push on;
events {}
rtmp {
    server {
        listen 1935;
        application live {
            live on;
            record off;
            hls on;
            hls_path /tmp/hls;
            hls_fragment 3;
            hls_playlist_length 60;
            allow publish all;
            allow play all;
        }
    }
}
http {
    sendfile off;
    tcp_nopush on;
    default_type application/octet-stream;
    server {
        listen 80;
        location / {
            add_header Cache-Control no-cache;
            add_header 'Access-Control-Allow-Origin' '*' always;
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /tmp;
        }
        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
        location /stat {
            rtmp_stat all;
        }
    }
}
NGINX_EOF
mkdir -p nginx-rtmp/hls && \
chmod -R 777 nginx-rtmp/hls && \
docker-compose up -d && \
echo "" && \
echo "✅✅✅ Servidor RTMP instalado com sucesso! ✅✅✅" && \
echo "" && \
echo "Teste agora: curl http://localhost:8080/health" && \
docker ps | grep rtmp-server
