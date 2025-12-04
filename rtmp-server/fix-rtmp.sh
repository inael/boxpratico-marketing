#!/bin/bash
# Execute estes comandos na VPS para diagnosticar e corrigir

echo "🔍 Verificando status dos containers..."
docker ps -a

echo ""
echo "🔍 Verificando se o container rtmp-server existe..."
docker ps -a | grep rtmp

echo ""
echo "🛑 Parando e removendo containers antigos..."
cd ~/rtmp-server 2>/dev/null || true
docker-compose down 2>/dev/null || true
docker rm -f rtmp-server 2>/dev/null || true

echo ""
echo "🗑️ Limpando arquivos antigos..."
rm -rf ~/rtmp-server
mkdir -p ~/rtmp-server/nginx-rtmp

echo ""
echo "📝 Criando arquivos de configuração..."
cd ~/rtmp-server

cat > docker-compose.yml << 'EOF'
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
EOF

cat > nginx-rtmp/nginx.conf << 'EOF'
worker_processes auto;
rtmp_auto_push on;
events {}

rtmp {
    server {
        listen 1935;
        listen [::]:1935 ipv6only=on;

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
    directio 512;
    default_type application/octet-stream;

    server {
        listen 80;

        location / {
            add_header Cache-Control no-cache;
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Expose-Headers' 'Content-Length';

            types {
                application/dash+xml mpd;
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }

            root /tmp;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        location /stat {
            rtmp_stat all;
        }
    }
}
EOF

echo ""
echo "🔒 Configurando permissões..."
mkdir -p nginx-rtmp/hls
chmod -R 777 nginx-rtmp/hls

echo ""
echo "📦 Baixando imagem Docker..."
docker pull tiangolo/nginx-rtmp

echo ""
echo "🚀 Iniciando container..."
docker-compose up -d

echo ""
echo "⏳ Aguardando 5 segundos..."
sleep 5

echo ""
echo "🔍 Verificando status..."
docker ps | grep rtmp-server

echo ""
echo "📋 Logs do container:"
docker logs rtmp-server

echo ""
echo "🧪 Testando health check..."
curl -v http://localhost:8080/health

echo ""
echo "✅ Se você viu 'healthy' acima, o servidor está funcionando!"
echo ""
echo "📹 URLs:"
echo "   RTMP: rtmp://72.61.135.214:1935/live/NOME-DA-CAMERA"
echo "   HLS:  http://72.61.135.214:8080/hls/NOME-DA-CAMERA.m3u8"
echo "   Health: http://72.61.135.214:8080/health"
EOF

chmod +x fix-rtmp.sh
