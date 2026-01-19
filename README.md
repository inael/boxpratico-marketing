# BoxPrático Mídia Indoor

Sistema completo de **Sinalização Digital** (Digital Signage) para gestão e exibição de conteúdo em telas indoor. Solução ideal para academias, escolas, shoppings, hotéis, clínicas, varejo e condomínios.

## O que é Mídia Indoor?

Mídia Indoor é uma sinalização digital posicionada dentro de ambientes fechados com objetivo de **informar, entreter e engajar** o público. É considerada mais eficaz e menos invasiva que mídias tradicionais, atingindo 33% mais consumidores.

## Principais Funcionalidades

### Gestão Remota
- Administre e gerencie remotamente todas as suas telas de qualquer lugar
- Painel administrativo intuitivo e responsivo (desktop e mobile)
- Controle total de múltiplos locais e telas simultaneamente

### Grade de Programação
- Monte sua programação com sistema intuitivo
- Em menos de 1 minuto sua linha de conteúdo está pronta
- Campanhas com data de início e fim programáveis
- Segmentação de mídia por horário

### Status do Player
- Monitoramento em tempo real do status de todas as telas
- Indicadores visuais de online/offline
- Atualização automática a cada 10 segundos
- Notificações via WhatsApp sobre status dos monitores

### Conteúdo Dinâmico

| Recurso | Descrição |
|---------|-----------|
| **Notícias RSS** | Integração com portais de notícias, templates personalizáveis |
| **Previsão do Tempo** | Atualização automática com dados de localização |
| **Imagens** | Upload de banners e artes promocionais |
| **Vídeos** | Suporte a vídeos locais com controle de tempo |
| **YouTube** | Integração direta com vídeos do YouTube |
| **Câmeras RTMP/HLS** | Transmissão ao vivo de câmeras de segurança |

## Aplicações por Segmento

### Academias
O público permanece de 30 min a 2 horas sem interagir no celular. Ideal para:
- Campanhas de vida saudável
- Promoções de planos
- Comunicados internos
- Entretenimento durante treinos

### Escolas e Universidades
Estratégia de comunicação interna que engaja estudantes:
- Avisos institucionais
- Agenda de eventos
- Campanhas educacionais
- Projetos de laboratórios de comunicação

### Shoppings
Grande potencial de impacto com público em momento de compra:
- Painéis informativos e publicitários
- Promoções de lojas
- Wayfinding e orientações
- Anúncios segmentados

### Hotéis, Pousadas e Resorts
Circulação diária de turistas e hóspedes:
- Informações sobre o hotel
- Programação de lazer
- Promoções de serviços
- Dicas turísticas locais

### Varejo (PDV)
Estímulo de compra no ponto de venda:
- Promoções em tempo real
- Reforço de marca
- Lançamentos de produtos
- Vídeos institucionais

### Clínicas e Consultórios
Ambiente de espera qualificado:
- Campanhas de saúde
- Serviços oferecidos
- Dicas de bem-estar
- Entretenimento na espera

### Condomínios
Comunicação eficiente com moradores:
- Avisos e comunicados
- Regras e orientações
- Eventos do condomínio
- Monitoramento de segurança

## Recursos Técnicos

### Tipos de Mídia Suportados
- **Imagens**: JPG, PNG, GIF, WebP
- **Vídeos**: MP4, WebM
- **YouTube**: URLs diretas ou embeds
- **Câmeras**: RTMP, HLS (m3u8)
- **RSS**: Feeds de notícias configuráveis

### Integrações
- **WhatsApp (Evolution API)**: Notificações automáticas
- **OpenWeatherMap**: Previsão do tempo em tempo real
- **RSS Feeds**: Portais de notícias personalizáveis
- **Câmeras IP**: Suporte RTMP/HLS para transmissão

### Infraestrutura
- **Frontend**: Next.js 16 com React 19
- **Storage**: Vercel Blob (mídias) + Upstash Redis (dados)
- **Streaming**: nginx-rtmp para câmeras ao vivo
- **Deploy**: Vercel (app) + Docker/VPS (streaming)

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    PAINEL ADMINISTRATIVO                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Locais   │ │ Telas    │ │ Campanhas│ │ Mídias           │ │
│  │ (Clientes│ │ (Players)│ │ (Playlists│ │ (Img/Vid/RSS/Cam)│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         API REST                             │
│  /api/condominiums  /api/monitors  /api/campaigns  /api/media│
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │   Player 1   │ │   Player 2   │ │   Player N   │
      │   (TV/Tela)  │ │   (TV/Tela)  │ │   (TV/Tela)  │
      └──────────────┘ └──────────────┘ └──────────────┘
```

## Nomenclatura do Sistema

| Termo Atual | Conceito Mídia Indoor | Descrição |
|-------------|----------------------|-----------|
| Condomínio | **Local/Cliente** | Estabelecimento onde as telas estão instaladas |
| Monitor | **Player/Tela** | Dispositivo de exibição (TV, monitor, totem) |
| Campanha | **Playlist** | Conjunto de mídias com programação |
| Mídia | **Conteúdo** | Imagem, vídeo, câmera, RSS, YouTube |

## Modelo de Negócio - Mídia Indoor Híbrida

O sistema permite operar uma **rede de mídia indoor híbrida**, onde você instala telas em estabelecimentos parceiros e vende espaço publicitário para anunciantes.

### Os 3 Papéis do Negócio

| Papel | Descrição | O que ganha |
|-------|-----------|-------------|
| **Operador (Você)** | Gerencia a rede de telas | Receita dos anunciantes - comissão do local |
| **Local/Estabelecimento** | Cede espaço para a tela | Comissão sobre vendas (configurável) |
| **Anunciante** | Paga para exibir propaganda | Exposição de marca, vendas |

### Modelos de Precificação

#### Por Rede (Cidades < 250k hab)
- Anunciante paga valor único para aparecer em **todas as telas**
- Ideal para cidades pequenas/interior
- Exemplo: R$ 200/mês para 9 telas

#### Por Ponto (Cidades > 250k hab)
- Anunciante escolhe e paga **por tela individual**
- Permite segmentação geográfica
- Exemplo: R$ 50/mês por tela

### Sistema de Comissão

Cada local pode receber uma comissão percentual sobre os anunciantes:
- Configurável por estabelecimento (0% a 100%)
- Modelo híbrido: alguns locais recebem, outros não
- Observações específicas por acordo

### Funcionalidades de Monetização

- **Cadastro de Anunciantes**: Nome, segmento, contato, CNPJ
- **Vínculo Mídia x Anunciante**: Cada mídia pode pertencer a um anunciante
- **Comissão por Local**: Percentual configurável por estabelecimento
- **White Label**: Para agências e revendedores

### Relatórios de Exposição

O sistema calcula automaticamente a exposição de cada mídia e anunciante:

| Período | Cálculo |
|---------|---------|
| **Por Dia** | (3600 ÷ tempo do ciclo) × 12h × nº monitores |
| **Por Semana** | Exibições/dia × 7 |
| **Por Mês** | Exibições/dia × 30 |
| **Por Ano** | Exibições/dia × 365 |

**Visões disponíveis:**
- **Por Anunciante**: Total de exposições de todas as mídias do cliente
- **Por Mídia**: Detalhamento de cada conteúdo individual
- **Por Local**: Quantidade de exibições em cada estabelecimento

Esses dados são essenciais para:
- Argumentar valor na venda para anunciantes
- Calcular retorno sobre investimento (ROI)
- Justificar preços e comissões

## Instalação

### Requisitos
- Node.js 18+
- Conta Vercel (deploy)
- Upstash Redis (banco de dados)
- Vercel Blob (armazenamento de mídias)

### Variáveis de Ambiente

```env
# Autenticação
AUTH_SECRET=sua_chave_secreta
AUTH_URL=https://seu-dominio.com

# Storage
upstash_boxpratico_marketing_KV_REST_API_URL=https://xxx.upstash.io
upstash_boxpratico_marketing_KV_REST_API_TOKEN=seu_token
BLOB_BOXPRATICO_MARKETING_READ_WRITE_TOKEN=vercel_blob_token

# Opcional - WhatsApp
EVOLUTION_API_URL=https://whatsapp.seudominio.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=boxpratico

# Opcional - Clima
OPENWEATHER_API_KEY=sua_api_key

# Opcional - Streaming
STREAM_DOMAIN=stream.seudominio.com
RTMP_SERVER=ip:1935
```

### Comandos

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Deploy Vercel
vercel --prod
```

## Estrutura do Projeto

```
boxpratico-marketing/
├── app/                          # Páginas e rotas Next.js
│   ├── admin/                    # Painel administrativo
│   ├── api/                      # APIs REST
│   │   ├── condominiums/         # CRUD de locais
│   │   ├── monitors/             # CRUD de telas/players
│   │   ├── campaigns/            # CRUD de campanhas
│   │   ├── media-items/          # CRUD de mídias
│   │   ├── advertisers/          # CRUD de anunciantes
│   │   ├── news/                 # API de notícias RSS
│   │   ├── weather/              # API de previsão do tempo
│   │   ├── whatsapp/             # Integração WhatsApp
│   │   └── upload/               # Upload de arquivos
│   ├── login/                    # Página de login
│   ├── monitor/                  # Player público
│   │   └── [monitorSlug]/        # Player por tela
│   └── preview/                  # Preview de campanhas
├── components/                   # Componentes React
│   ├── admin/                    # Componentes do painel
│   │   ├── AdminSidebar.tsx      # Menu lateral
│   │   ├── AdminHeader.tsx       # Cabeçalho
│   │   ├── MonitorsTab.tsx       # Aba de telas
│   │   ├── CampaignsTab.tsx      # Aba de campanhas
│   │   ├── AdvertisersTab.tsx    # Aba de anunciantes
│   │   ├── ReportsTab.tsx        # Aba de relatórios
│   │   └── SettingsTab.tsx       # Configurações
│   ├── slides/                   # Componentes de slides
│   │   ├── ImageSlide.tsx        # Slide de imagem
│   │   ├── VideoSlide.tsx        # Slide de vídeo
│   │   ├── YoutubeSlide.tsx      # Slide do YouTube
│   │   ├── RtmpSlide.tsx         # Slide de câmera
│   │   └── NewsSlide.tsx         # Slide de notícia
│   └── PlaylistPlayer.tsx        # Player de playlist
├── lib/                          # Utilitários e helpers
│   ├── db.ts                     # Sistema de banco de dados
│   ├── auth.ts                   # Autenticação
│   └── blob.ts                   # Upload de arquivos
├── types/                        # Definições TypeScript
├── public/                       # Arquivos públicos
├── docker-compose.yml            # Config Docker (streaming)
└── rtmp-server/                  # Servidor RTMP
```

## Diferenciais

- **Interface intuitiva** - Não precisa ser expert em design
- **Gestão centralizada** - Múltiplos locais em um só painel
- **Notificações em tempo real** - WhatsApp integrado
- **Responsivo** - Acesse de qualquer dispositivo
- **Conteúdo dinâmico** - Notícias e clima atualizados automaticamente
- **Câmeras ao vivo** - Integração com sistemas de segurança
- **Relatórios** - Acompanhe visualizações e métricas

## Status de Funcionalidades

### Implementado
- [x] Envio de vídeos (MP4, WebM)
- [x] Envio de imagens (JPG, PNG, GIF, WebP)
- [x] Vídeos do YouTube
- [x] Câmeras ao vivo (RTMP/HLS)
- [x] Previsão do tempo (OpenWeatherMap)
- [x] Notícias via RSS
- [x] Notificações WhatsApp
- [x] Monitoramento de telas online/offline
- [x] Campanhas com data início/fim
- [x] Painel responsivo (desktop e mobile)
- [x] Cadastro de anunciantes
- [x] Comissão por local (configurável)
- [x] Relatórios de exposição (dia/semana/mês/ano)

### Em Desenvolvimento
- [ ] Suporte a áudio (MP3) como mídia de fundo
- [ ] Telas verticais e horizontais (orientação)
- [ ] Funcionamento offline (cache local)
- [ ] Agendamento por data/hora específica

### Roadmap

#### Fase 1 - Player Web (Atual)
- [ ] Estabilizar player no navegador web
- [ ] Testar todos os tipos de mídia (imagem, vídeo, YouTube, câmera)
- [ ] Validar relatórios de exposição

#### Fase 2 - App Android TV
- [ ] **App Android TV nativo** - Abre automaticamente ao ligar a TV
- [ ] **Modo offline completo** - Baixa mídias quando online, reproduz offline
- [ ] **Auto-start no boot** - Inicia sozinho após queda de energia
- [ ] **Sincronização inteligente** - Atualiza conteúdo em segundo plano

#### Fase 3 - Monetização
- [ ] **Controle financeiro** - Registrar pagamentos dos anunciantes
- [ ] **Contratos/Propostas** - Gerar PDF de proposta comercial
- [ ] **Relatório para anunciante** - Comprovante de exibição em PDF
- [ ] **Faturamento** - Emitir boletos/Pix integrado

#### Fase 4 - Multi-tenancy e Acessos
- [ ] **Multi-tenancy** - Local acessa só os dados dele
- [ ] **Níveis de usuário** - Admin, Operador, Local, Anunciante
- [ ] **Portal do Anunciante** - Ver suas campanhas e relatórios
- [ ] **Portal do Local** - Ver comissões e relatórios

#### Fase 5 - Conteúdo Dinâmico
- [ ] **Horóscopo diário** - Integração automática
- [ ] **Resultados da Loteria** - Mega-Sena, Quina, etc.
- [ ] **Clima em tempo real** - Por localização da tela
- [ ] **Notícias RSS** - Já implementado, melhorar templates

#### Fase 6 - Recursos Avançados
- [ ] **Menu boards** - Templates para restaurantes/lanchonetes
- [ ] **Vídeo walls** - Múltiplas telas sincronizadas
- [ ] **Business Intelligence** - Dashboards com métricas
- [ ] **Orientação de tela** - Vertical e horizontal

#### Fase 7 - White Label
- [ ] **Configuração de cores** - Tema personalizável
- [ ] **Logo customizado** - Marca do operador
- [ ] **Domínio próprio** - URL personalizada
- [ ] **Remoção de marca** - 100% white label

## Estrutura de Dados

### Local (Condominium)

```typescript
{
  id: string
  name: string
  slug: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  photoUrl?: string
  whatsappPhone?: string
  isActive?: boolean
  showNews?: boolean
  // Configuração de precificação (para anunciantes)
  pricing?: {
    model: 'network' | 'per_point'
    networkPrice?: number
    pricePerPoint?: number
    cityPopulation?: number
    notes?: string
  }
  // Configuração de comissão (para o local)
  commission?: {
    percentage: number
    notes?: string
  }
  createdAt: string
  updatedAt: string
}
```

### Tela/Player (Monitor)

```typescript
{
  id: string
  name: string
  slug: string
  location?: string
  condominiumId: string
  isActive: boolean
  isOnline: boolean
  lastHeartbeat?: string
  createdAt: string
  updatedAt: string
}
```

### Campanha (Campaign)

```typescript
{
  id: string
  name: string
  condominiumId: string
  monitorId?: string
  startDate?: string
  endDate?: string
  isActive: boolean
  showNews: boolean
  newsEveryNMedia: number
  newsDurationSeconds: number
  createdAt: string
  updatedAt: string
}
```

### Mídia (MediaItem)

```typescript
{
  id: string
  title: string
  description?: string
  type: 'image' | 'video' | 'youtube' | 'rtmp'
  sourceUrl: string
  thumbnailUrl?: string
  durationSeconds?: number
  playFullVideo?: boolean
  startTimeSeconds?: number
  endTimeSeconds?: number
  isActive: boolean
  order: number
  condominiumId: string
  campaignId?: string
  advertiserId?: string  // Anunciante dono desta mídia
  createdAt: string
  updatedAt: string
}
```

### Anunciante (Advertiser)

```typescript
{
  id: string
  name: string
  slug: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  cnpj?: string
  logoUrl?: string
  segment?: string  // Ex: 'Mercado/Varejo', 'Saúde/Farmácia'
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

## Suporte

Para problemas ou dúvidas, abra uma issue no GitHub ou entre em contato através do painel administrativo.

---

**BoxPrático Mídia Indoor** - Transforme suas telas em uma poderosa ferramenta de comunicação e monetização.
