#!/bin/bash
# Script para instalar docker-compose e configurar servidor RTMP

set -e

echo "🔍 Verificando Docker Compose..."

# Tentar docker compose (versão nova)
if docker compose version &> /dev/null; then
    echo "✅ Docker Compose (plugin) encontrado"
    DOCKER_COMPOSE="docker compose"
# Tentar docker-compose (versão antiga)
elif docker-compose version &> /dev/null; then
    echo "✅ docker-compose encontrado"
    DOCKER_COMPOSE="docker-compose"
else
    echo "📦 Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    DOCKER_COMPOSE="docker-compose"
fi

echo ""
echo "📝 Fazendo backup do docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

echo ""
echo "✏️ Criando novo docker-compose.yml com RTMP..."
cat > docker-compose.yml << 'EOF'
version: "3.7"

services:
  traefik:
    image: "traefik"
    restart: always
    command:
      - "--api=true"
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.web.http.redirections.entryPoint.to=websecure"
      - "--entrypoints.web.http.redirections.entrypoint.scheme=https"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesresolvers.mytlschallenge.acme.email=${SSL_EMAIL}"
      - "--certificatesresolvers.mytlschallenge.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - traefik_data:/letsencrypt
      - /var/run/docker.sock:/var/run/docker.sock:ro

  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "127.0.0.1:5678:5678"
    labels:
      - traefik.enable=true
      - traefik.http.routers.n8n.rule=Host(`${SUBDOMAIN}.${DOMAIN_NAME}`)
      - traefik.http.routers.n8n.tls=true
      - traefik.http.routers.n8n.entrypoints=web,websecure
      - traefik.http.routers.n8n.tls.certresolver=mytlschallenge
      - traefik.http.middlewares.n8n.headers.SSLRedirect=true
      - traefik.http.middlewares.n8n.headers.STSSeconds=315360000
      - traefik.http.middlewares.n8n.headers.browserXSSFilter=true
      - traefik.http.middlewares.n8n.headers.contentTypeNosniff=true
      - traefik.http.middlewares.n8n.headers.forceSTSHeader=true
      - traefik.http.middlewares.n8n.headers.SSLHost=${DOMAIN_NAME}
      - traefik.http.middlewares.n8n.headers.STSIncludeSubdomains=true
      - traefik.http.middlewares.n8n.headers.STSPreload=true
      - traefik.http.routers.n8n.middlewares=n8n@docker
    environment:
      - N8N_HOST=${SUBDOMAIN}.${DOMAIN_NAME}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://${SUBDOMAIN}.${DOMAIN_NAME}/
      - GENERIC_TIMEZONE=${GENERIC_TIMEZONE}
    volumes:
      - n8n_data:/home/node/.n8n
      - /local-files:/files

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

volumes:
  traefik_data:
    external: true
  n8n_data:
    external: true
EOF

echo ""
echo "📝 Criando configuração do Nginx RTMP..."
mkdir -p nginx-rtmp/hls

cat > nginx-rtmp/nginx.conf << 'EOF'
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
            allow publish all;
        }
    }
}

http {
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
    }
}
EOF

echo ""
echo "🔒 Configurando permissões..."
chmod -R 777 nginx-rtmp/hls

echo ""
echo "🚀 Aplicando mudanças..."
$DOCKER_COMPOSE up -d

echo ""
echo "⏳ Aguardando 10 segundos..."
sleep 10

echo ""
echo "🔍 Status dos containers:"
$DOCKER_COMPOSE ps

echo ""
echo "📋 Logs do RTMP:"
docker logs rtmp-server --tail=20

echo ""
echo "🧪 Testando health check..."
curl -s http://localhost:8080/health

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ SERVIDOR RTMP CONFIGURADO!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📹 URLs:"
echo "   RTMP: rtmp://72.61.135.214:1935/live/NOME-DA-CAMERA"
echo "   HLS:  http://72.61.135.214:8080/hls/NOME-DA-CAMERA.m3u8"
echo "   Health: http://72.61.135.214:8080/health"
echo ""
