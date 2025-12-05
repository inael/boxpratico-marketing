# Servidor RTMP/HLS para BoxPrático

Este diretório contém a configuração Docker para o servidor de streaming RTMP/HLS que serve as câmeras IP do BoxPrático Marketing.

## Servidor de Produção

- **IP**: 72.61.135.214 (VPS Hostinger)
- **RTMP Port**: 1935 (entrada de streams das câmeras)
- **HLS Port**: 8080 (saída para players)

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Configuração Docker do servidor Nginx-RTMP |
| `nginx-rtmp/nginx.conf` | Configuração do Nginx com módulo RTMP |

## URLs

### Para configurar nas câmeras IP (IMIX):
```
rtmp://72.61.135.214:1935/live/NOME-DA-CAMERA
```

### Para reproduzir no BoxPrático (HLS):
```
http://72.61.135.214:8080/hls/NOME-DA-CAMERA.m3u8
```

### Monitoramento:
- Health Check: http://72.61.135.214:8080/health
- Estatísticas: http://72.61.135.214:8080/stat

## Arquitetura

```
┌─────────────┐         RTMP (1935)          ┌──────────────────┐
│  Câmera IP  │ ────────────────────────────> │  Nginx-RTMP      │
│    IMIX     │     rtmp://IP:1935/live/key   │  (VPS Docker)    │
└─────────────┘                               └──────────────────┘
                                                        │
                                                        │ Transcodifica
                                                        │ para HLS
                                                        ▼
                                              ┌──────────────────┐
                                              │  Arquivos HLS    │
                                              │  .m3u8 + .ts     │
                                              └──────────────────┘
                                                        │
                                                        │ HLS (8080)
                                                        ▼
┌─────────────┐         HTTP (8080)          ┌──────────────────┐
│  BoxPrático │ <─────────────────────────── │  Nginx HTTP      │
│   Player    │  http://IP:8080/hls/key.m3u8 │  Serve HLS       │
└─────────────┘                               └──────────────────┘
```

## Deploy na VPS

### 1. Conectar via SSH
```bash
ssh root@72.61.135.214
# Senha: M@t3m@t1c@10
```

### 2. Instalar (se ainda não instalado)
```bash
mkdir -p ~/rtmp-server/nginx-rtmp
cd ~/rtmp-server

# Copiar docker-compose.yml e nginx.conf deste diretório para a VPS

docker compose up -d
```

### 3. Verificar status
```bash
docker compose ps
docker logs rtmp-server
curl http://localhost:8080/health
```

## Como usar no BoxPrático

### 1. Configurar a câmera IP
Configure sua câmera IMIX com a URL RTMP:
```
rtmp://72.61.135.214:1935/live/camera1
```

### 2. Cadastrar no Admin
1. Acesse `/admin`
2. Vá em "Mídias" → "Nova Mídia"
3. Selecione tipo "Câmera RTMP"
4. Digite o nome da câmera: `camera1`
5. O sistema gerará automaticamente a URL HLS

### 3. Verificar stream
Teste no VLC Player abrindo:
```
http://72.61.135.214:8080/hls/camera1.m3u8
```

## Troubleshooting

### Stream não aparece no player
1. Verifique se a câmera está transmitindo:
   ```bash
   curl http://72.61.135.214:8080/stat
   ```

2. Verifique os logs do container:
   ```bash
   docker logs rtmp-server
   ```

### Reiniciar servidor
```bash
ssh root@72.61.135.214
docker compose restart
```

## Notas

- O servidor suporta múltiplas câmeras simultâneas
- Cada câmera usa aproximadamente 2-5 Mbps de bandwidth
- Os arquivos HLS (.m3u8, .ts) são temporários e gerados dinamicamente
