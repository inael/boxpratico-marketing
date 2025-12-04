# 📹 Servidor RTMP/HLS para BoxPrático

Este diretório contém a configuração e scripts para deployment do servidor RTMP/HLS que serve as câmeras IP do BoxPrático Marketing.

## 🖥️ Servidor

- **IP**: 72.61.135.214
- **RTMP Port**: 1935 (entrada de streams das câmeras)
- **HLS Port**: 8080 (saída para players)
- **Provider**: Hostinger VPS

## 📂 Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `docker-compose.yml` | Configuração Docker do servidor Nginx-RTMP |
| `nginx-rtmp/nginx.conf` | Configuração do Nginx com módulo RTMP |
| `nginx-rtmp/hls/` | Diretório onde os arquivos HLS são gerados (temporário) |
| `install-rtmp.sh` | Script de instalação rápida |
| `install-and-update.sh` | Script com detecção de Docker Compose |
| `fix-rtmp.sh` | Script para troubleshooting |
| `COMANDO-FINAL.txt` | Instruções de deployment manual (passo a passo) |
| `COPIAR-E-COLAR-NA-VPS.txt` | Comando one-liner para instalação |

## 🌐 URLs

### Para configurar nas câmeras IMIX:
```
rtmp://72.61.135.214:1935/live/NOME-DA-CAMERA
```

### Para reproduzir no BoxPrático (HLS):
```
http://72.61.135.214:8080/hls/NOME-DA-CAMERA.m3u8
```

### Monitoramento:
- Health Check: `http://72.61.135.214:8080/health`
- Estatísticas: `http://72.61.135.214:8080/stat`

## 🚀 Como usar

### 1. Configurar a câmera IP
Configure sua câmera IMIX com a URL RTMP:
```
rtmp://72.61.135.214:1935/live/camera1
```

### 2. Cadastrar no BoxPrático Admin
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

## 🔧 Arquitetura

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

## 📋 Deployment na VPS

### Método 1: Script automático
```bash
ssh root@72.61.135.214
# Senha: M@t3m@t1c@10

# Copiar conteúdo de install-rtmp.sh e executar
bash install-rtmp.sh
```

### Método 2: Comando one-liner
Veja instruções completas em `COMANDO-FINAL.txt`

## 🐛 Troubleshooting

### Stream não aparece no player
1. Verifique se a câmera está transmitindo:
   ```bash
   curl http://72.61.135.214:8080/stat
   ```

2. Verifique os logs do container:
   ```bash
   ssh root@72.61.135.214
   docker logs rtmp-server
   ```

3. Teste a URL HLS no VLC Player

### Câmera desconectando
- Verifique configuração de rede da câmera
- Confirme que o firewall da VPS permite porta 1935
- Verifique estabilidade da internet da câmera

## 📊 Monitoramento

### Ver streams ativos
```bash
curl http://72.61.135.214:8080/stat
```

### Ver arquivos HLS gerados
```bash
ssh root@72.61.135.214
ls -lh ~/rtmp-server/nginx-rtmp/hls/
```

### Reiniciar servidor
```bash
ssh root@72.61.135.214
cd ~/rtmp-server  # ou onde estiver o docker-compose.yml
docker-compose restart
```

## 🔐 Credenciais VPS

- **Host**: 72.61.135.214
- **User**: root
- **Password**: M@t3m@t1c@10
- **SSH Key**: (ver arquivo de configuração do projeto)

## 📝 Notas

- Os arquivos `.m3u8` e `.ts` são gerados dinamicamente pelo Nginx
- Não versionar o diretório `nginx-rtmp/hls/` (já está no .gitignore)
- O servidor suporta múltiplas câmeras simultaneamente
- Cada câmera usa aproximadamente 2-5 Mbps de bandwidth

## 🔗 Links úteis

- [Nginx-RTMP Module](https://github.com/arut/nginx-rtmp-module)
- [HLS Specification](https://datatracker.ietf.org/doc/html/rfc8216)
- [Docker Image](https://hub.docker.com/r/tiangolo/nginx-rtmp)
