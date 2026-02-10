# Plano de Projeto - Pendências BoxPratico

Documento consolidado com todas as pendências identificadas nos documentos de análise e roadmap técnico.

**Data de criação:** Janeiro/2026
**Última atualização:** 10/02/2026

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Pendências por Prioridade](#2-pendências-por-prioridade)
3. [Sprint 1 - Funcionalidades Core](#3-sprint-1---funcionalidades-core)
4. [Sprint 2 - Pagamentos e Contratos (Asaas)](#4-sprint-2---pagamentos-e-contratos-asaas)
5. [Sprint 3 - Conteúdos Dinâmicos](#5-sprint-3---conteúdos-dinâmicos)
6. [Sprint 4 - Infraestrutura e Escalabilidade](#6-sprint-4---infraestrutura-e-escalabilidade)
7. [Sprint 5 - Inteligência e Automação](#7-sprint-5---inteligência-e-automação)
8. [Sprint 6 - Player e App Android](#8-sprint-6---player-e-app-android)
9. [Dependências entre Sprints](#9-dependências-entre-sprints)
10. [Estimativas e Recursos](#10-estimativas-e-recursos)

---

## 1. Visão Geral

### Status Atual
- **Plano de Melhorias Asaas:** 100% concluído
- **Integração AssinaAgora:** ✅ Concluída (URL: app.assinaagora.com.br)
- **Funcionalidades básicas:** Operacionais
- **Pendências identificadas:** 40+ itens

### Fontes das Pendências
- `ANALISE-YELOO-MELHORIAS.md` - Análise do concorrente Yeloo
- `CONCORRENTES.md` - Comparativo com Pix Mídia, EccosTV, KX Mídia
- `ROADMAP-TECNICO.md` - Roadmap técnico completo

---

## 2. Pendências por Prioridade

### 🔴 Alta Prioridade (Essencial para operação)

| # | Item | Origem | Complexidade | Status |
|---|------|--------|--------------|--------|
| 1 | Agendamento de mídia (horário, dias da semana) | Yeloo | Média | Pendente |
| 2 | Campos adicionais no Terminal | Yeloo | Baixa | Pendente |
| 3 | ~~Integração AssinaAgora~~ | Roadmap | Média | ✅ Concluído |
| 4 | Geração de PDF de contratos | Roadmap | Média | Pendente |
| 5 | Pagamentos Asaas (PIX, Boleto, Cartão) | Roadmap | Alta | Pendente |
| 6 | Trial de 14 dias | Roadmap | Média | Pendente |

### 🟡 Média Prioridade (Diferenciação)

| # | Item | Origem | Complexidade |
|---|------|--------|--------------|
| 7 | Biblioteca de conteúdos | Yeloo | Média |
| 8 | Barra de rodapé/ticker | Yeloo | Baixa |
| 9 | Relatórios avançados (PDF/Excel) | Yeloo | Média |
| 10 | Tipos de mídia especiais | Yeloo | Alta |
| 11 | Áudio MP3 | Concorrentes | Baixa |
| 12 | Login com Google | Roadmap | Média |
| 13 | Alertas de vencimento de contratos | Roadmap | Baixa |

### 🟢 Baixa Prioridade (Nice to have / Longo prazo)

| # | Item | Origem | Complexidade |
|---|------|--------|--------------|
| 14 | Migração PostgreSQL + Prisma | Roadmap | Alta |
| 15 | Chat com IA (Vercel AI SDK) | Roadmap | Média |
| 16 | Conteúdos dinâmicos (Loteria, Horóscopo) | Concorrentes | Média |
| 17 | Gerador de anúncios com IA | Concorrentes | Alta |
| 18 | Integração Instagram | Yeloo | Alta |
| 19 | Google Drive / OneDrive | Roadmap | Média |
| 20 | White-label completo | Roadmap | Alta |
| 21 | Mídia programática | Yeloo | Alta |
| 22 | App Android TV (MVP) | Yeloo/Roadmap | Alta |
| 23 | Modo offline (cache no player) | Concorrentes | Alta |

---

## 3. Sprint 1 - Funcionalidades Core

**Objetivo:** Completar funcionalidades essenciais do painel admin

### 3.1 Agendamento de Mídia

**Descrição:** Permitir que mídias sejam exibidas apenas em horários/dias específicos.

**Arquivos a modificar:**
- `types/index.ts` - Adicionar interface `MediaSchedule`
- `components/admin/LibraryTab.tsx` - Formulário de agendamento
- `app/api/media-items/route.ts` - Salvar agendamento
- `app/[slug]/page.tsx` (player) - Filtrar mídias por horário

**Interface proposta:**
```typescript
interface MediaSchedule {
  enabled: boolean;
  startDate?: string;        // "2026-02-01"
  endDate?: string;          // "2026-02-28"
  startTime?: string;        // "08:00"
  endTime?: string;          // "18:00"
  daysOfWeek?: number[];     // [1,2,3,4,5] = Seg-Sex
  repeatType?: 'once' | 'daily' | 'weekly' | 'monthly';
}
```

**Tarefas:**
- [ ] Criar interface MediaSchedule em types/index.ts
- [ ] Adicionar campos de agendamento no modal de mídia
- [ ] Implementar lógica de filtro no player
- [ ] Criar preview de horários no admin
- [ ] Testes com diferentes cenários

**Estimativa:** 3-4 dias

---

### 3.2 Campos Adicionais no Terminal

**Descrição:** Adicionar campos de localização, horário de funcionamento e métricas ao cadastro de Terminal/Monitor.

**Campos a adicionar:**
```typescript
interface MonitorExtended {
  // Localização completa
  address: string;
  addressNumber: string;
  complement?: string;
  zipCode: string;
  neighborhood: string;

  // Funcionamento
  operatingHoursStart: string;  // "07:00"
  operatingHoursEnd: string;    // "22:00"
  operatingDays: number[];      // [1,2,3,4,5,6] = Seg-Sab

  // Métricas
  averageMonthlyTraffic: number;
  socialClass: 'A' | 'B' | 'C' | 'D' | 'E';

  // Configurações
  updateCycleMinutes: number;   // 10
  soundEnabled: boolean;
  timezone: string;             // "America/Sao_Paulo"

  // Rodapé
  footerEnabled: boolean;
  footerText?: string;
  footerBgColor?: string;
  footerTextColor?: string;
  footerSpeed?: number;
}
```

**Arquivos a modificar:**
- `types/index.ts` - Estender interface Monitor
- `components/admin/MonitorsTab.tsx` - Formulário expandido
- `app/api/monitors/route.ts` - Salvar novos campos

**Tarefas:**
- [ ] Estender tipo Monitor
- [ ] Criar seções no formulário (Localização, Funcionamento, Métricas, Rodapé)
- [ ] Integrar com API de CEP para auto-complete
- [ ] Validações de horário
- [ ] Migrar dados existentes

**Estimativa:** 2-3 dias

---

### 3.3 Biblioteca de Conteúdos

**Descrição:** Mídias pré-cadastradas pelo super admin para todos os tenants usarem.

**Categorias:**
- Biblioteca - Saúde (Dicas, Dengue, Higiene)
- Biblioteca - Finanças (Economia, Investimentos)
- Biblioteca - Entretenimento (Quiz, Curiosidades)
- Biblioteca - Informativos (Clima, Notícias)
- Biblioteca - Datas Comemorativas (Natal, Páscoa, Dia das Mães)

**Arquivos a criar/modificar:**
- `app/api/library/global/route.ts` - API para biblioteca global
- `components/admin/GlobalLibraryTab.tsx` - Gerenciamento (super admin)
- `components/admin/LibraryTab.tsx` - Adicionar aba "Biblioteca BoxPratico"

**Regras:**
- Super Admin pode criar/editar/excluir
- Tenants podem apenas visualizar e usar
- Nome deve começar com "Biblioteca - "
- Mídias são copiadas para o tenant ao usar

**Tarefas:**
- [ ] Criar modelo LibraryItem global
- [ ] API CRUD para biblioteca global
- [ ] Tab no admin para super admin gerenciar
- [ ] Integrar na LibraryTab dos tenants
- [ ] Sistema de categorias
- [ ] Preview antes de copiar

**Estimativa:** 4-5 dias

---

### 3.4 Barra de Rodapé (Ticker)

**Descrição:** Texto rolando na parte inferior da tela do player.

**Configurações por terminal:**
```typescript
interface FooterConfig {
  enabled: boolean;
  text: string;
  bgColor: string;       // "#1e40af"
  textColor: string;     // "#ffffff"
  speed: number;         // 50 (pixels/segundo)
  position: 'top' | 'bottom';
  source: 'text' | 'rss';
  rssUrl?: string;
}
```

**Arquivos a modificar:**
- `app/[slug]/page.tsx` - Componente de rodapé no player
- `components/admin/MonitorsTab.tsx` - Configuração do rodapé
- `components/player/Ticker.tsx` - Novo componente

**Tarefas:**
- [ ] Criar componente Ticker animado
- [ ] Integrar no player
- [ ] Formulário de configuração no admin
- [ ] Suporte a RSS como fonte
- [ ] Testes em diferentes resoluções

**Estimativa:** 2 dias

---

## 4. Sprint 2 - Pagamentos e Contratos (Asaas)

**Objetivo:** Monetização via Asaas e gestão de contratos

### 4.1 Integração AssinaAgora ✅ CONCLUÍDO

**Status:** Implementado e funcionando

**Arquivos implementados:**
- `lib/assinaagora.ts` - Serviço de integração
- `app/api/webhooks/assina-agora/route.ts` - Webhook receiver
- `app/api/contracts/[id]/send-to-signature/route.ts` - Enviar para assinatura
- `app/api/contracts/[id]/signature-status/route.ts` - Verificar status
- `components/admin/ContractsTab.tsx` - Botões de assinatura na UI

**URL da API:** `https://app.assinaagora.com.br/api/integration`

---

### 4.2 Geração de PDF de Contratos

**Descrição:** Gerar PDF do contrato com dados preenchidos.

**Tecnologia:** pdfmake ou Puppeteer

**Modelo do PDF:**
- Cabeçalho (logo, número do contrato, data)
- Partes (contratante e contratado)
- Objeto (descrição dos serviços)
- Condições comerciais (valores, prazos)
- Cláusulas legais
- Espaço para assinaturas

**Arquivos a criar:**
- `lib/pdf-generator.ts` - Gerador de PDF
- `app/api/contracts/[id]/pdf/route.ts` - Endpoint
- `templates/contract-template.ts` - Template do contrato

**Tarefas:**
- [ ] Instalar pdfmake ou puppeteer
- [ ] Criar template de contrato
- [ ] Endpoint de geração
- [ ] Botão de download no ContractsTab
- [ ] Preview antes de download

**Estimativa:** 3-4 dias

---

### 4.3 Pagamentos via Asaas

**Descrição:** Integração com Asaas para cobranças recorrentes e avulsas.

**Métodos:**
- PIX (QR Code + copia-cola) - Principal
- Boleto bancário - Alternativo
- Cartão de crédito - Recorrente

**Nota:** O serviço `lib/asaas.ts` já existe com configuração básica.

**Arquivos a criar/modificar:**
- `lib/asaas.ts` - Expandir client com cobranças e assinaturas
- `app/api/payments/asaas/route.ts` - Criar cobrança
- `app/api/payments/asaas/webhook/route.ts` - Webhook de confirmação
- `components/admin/PaymentModal.tsx` - UI de pagamento com PIX/Boleto

**Fluxo:**
1. Gerar cobrança para invoice via Asaas
2. Exibir QR Code PIX ou link de boleto
3. Webhook Asaas confirma pagamento
4. Atualizar status da invoice e conta no BoxPratico

**Recursos do Asaas:**
- Assinaturas recorrentes (subscription)
- Cobranças avulsas (payment)
- Split de pagamentos (repasse para parceiros)
- Notificação automática por email/SMS
- Dashboard financeiro

**Tarefas:**
- [ ] Expandir lib/asaas.ts com funções de cobrança
- [ ] Criar customer no Asaas ao criar contrato
- [ ] Implementar geração de PIX com QR Code
- [ ] Implementar geração de boleto
- [ ] Implementar cobrança recorrente (subscription)
- [ ] Webhook de confirmação de pagamento
- [ ] Atualizar status automático de invoices
- [ ] Split de pagamentos para parceiros (location owners)
- [ ] Dunning automático (3 tentativas via Asaas)

**Estimativa:** 7-10 dias

---

### 4.4 Sistema de Planos e Trial

**Descrição:** Trial de 14 dias + upgrade para plano pago.

**Planos sugeridos:**
| Plano | Preço | Telas | Storage |
|-------|-------|-------|---------|
| Trial | Grátis (14 dias) | 1 | 500MB |
| Básico | R$ 99/mês | 3 | 2GB |
| Profissional | R$ 199/mês | 10 | 10GB |
| Enterprise | R$ 499/mês | Ilimitado | 50GB |

**Funcionalidades:**
- Contador de dias restantes no trial
- Bloqueio ao expirar (exibe tela de renovação)
- Notificações por email (3 dias, 1 dia, expirou)
- Upgrade direto no admin (cobrança via Asaas)

**Tarefas:**
- [ ] Adicionar campo `trialEndsAt` em Account
- [ ] Middleware de verificação de trial
- [ ] Tela de bloqueio no player
- [ ] Emails de notificação
- [ ] UI de upgrade no admin (integrado com Asaas)
- [ ] Cron job para verificar trials

**Estimativa:** 4-5 dias

---

## 5. Sprint 3 - Conteúdos Dinâmicos

**Objetivo:** Widgets e mídias especiais

### 5.1 Tipos de Mídia Especiais

| Tipo | Descrição | Complexidade |
|------|-----------|--------------|
| Hora Certa | Relógio digital com logo | Baixa |
| Cotação Dólar | Moedas em tempo real | Média |
| Previsão do Tempo | Clima da cidade | Baixa (já tem) |
| Notícias RSS | Feed de notícias | Baixa (já tem) |
| Instagram User | Posts de perfil | Alta |
| YouTube | Vídeos do YT | Média |
| Avisos | Texto animado | Baixa |

**Implementação - Hora Certa:**
```tsx
// components/player/widgets/ClockWidget.tsx
const ClockWidget = ({ logo, format = '24h' }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="clock-widget">
      {logo && <img src={logo} alt="Logo" />}
      <span>{format === '24h' ? time.toLocaleTimeString() : time.toLocaleTimeString('en-US')}</span>
    </div>
  );
};
```

**Tarefas:**
- [ ] Criar componente ClockWidget
- [ ] Criar componente CurrencyWidget (API de cotações)
- [ ] Criar componente AnnouncementWidget
- [ ] Criar componente YouTubeWidget
- [ ] Integrar no player
- [ ] UI para configurar no admin

**Estimativa:** 5-7 dias

---

### 5.2 Conteúdos Dinâmicos Avançados

| Conteúdo | API | Atualização |
|----------|-----|-------------|
| Loteria Caixa | api.caixa.gov.br | Diária |
| Horóscopo | API terceira | Diária |
| Placar Futebol | api-football.com | Tempo real |
| Impostômetro | impostometro.com.br | Tempo real |

**Tarefas:**
- [ ] Pesquisar APIs disponíveis
- [ ] Criar serviço de cache
- [ ] Componentes de visualização
- [ ] Configuração no admin

**Estimativa:** 7-10 dias

---

## 6. Sprint 4 - Infraestrutura e Escalabilidade

**Objetivo:** Preparar para escala

### 6.1 Migração PostgreSQL + Prisma

**Descrição:** Migrar de JSON files para banco de dados relacional.

**Tarefas:**
- [ ] Instalar Docker e PostgreSQL na VPS
- [ ] Instalar Prisma ORM
- [ ] Criar schema com entidades atuais
- [ ] Script de migração de dados
- [ ] Atualizar todas as APIs
- [ ] Testes de regressão

**Estimativa:** 10-15 dias

---

### 6.2 Storage com MinIO

**Descrição:** Storage S3-compatible para mídias.

**Benefícios:**
- Escalável
- CDN-ready
- Backup automático
- Acesso por URL assinada

**Tarefas:**
- [ ] Configurar MinIO na VPS
- [ ] Criar buckets por tenant
- [ ] Migrar uploads
- [ ] URLs assinadas para acesso

**Estimativa:** 3-5 dias

---

### 6.3 Cache com Redis

**Descrição:** Cache para sessões e dados frequentes.

**Uso:**
- Sessões de usuário
- Cache de playlists
- Rate limiting
- Queue de jobs

**Tarefas:**
- [ ] Configurar Redis
- [ ] Migrar sessões
- [ ] Implementar cache de playlists
- [ ] Rate limiting nas APIs

**Estimativa:** 2-3 dias

---

## 7. Sprint 5 - Inteligência e Automação

**Objetivo:** Features de diferenciação

### 7.1 Chat com IA

**Descrição:** Assistente virtual no painel admin.

**Tecnologia:** Vercel AI SDK + OpenAI/Anthropic

**Funcionalidades:**
- Tirar dúvidas sobre a plataforma
- Sugestões de campanhas
- Geração de textos para anúncios
- Análise de relatórios

**Tarefas:**
- [ ] Criar conta OpenAI/Anthropic
- [ ] Instalar Vercel AI SDK
- [ ] Criar endpoint /api/chat
- [ ] Prompt de sistema contextualizado
- [ ] Componente ChatWidget
- [ ] Histórico de conversas

**Estimativa:** 5-7 dias

---

### 7.2 Gerador de Anúncios com IA

**Descrição:** Criar artes automaticamente com IA.

**Tecnologia:** DALL-E ou Stable Diffusion

**Fluxo:**
1. Usuário descreve o anúncio
2. IA gera imagem
3. Usuário edita/aprova
4. Salva na biblioteca

**Tarefas:**
- [ ] Integrar API de geração de imagem
- [ ] UI de prompt
- [ ] Editor de ajustes
- [ ] Templates pré-definidos

**Estimativa:** 7-10 dias

---

### 7.3 Login com Google

**Descrição:** Autenticação via Google OAuth.

**Tecnologia:** NextAuth.js com Google Provider

**Tarefas:**
- [ ] Criar projeto no Google Cloud Console
- [ ] Configurar OAuth credentials
- [ ] Instalar NextAuth.js
- [ ] Criar modelos User, Account, Session
- [ ] UI de login com Google
- [ ] Vincular a tenants existentes

**Estimativa:** 3-5 dias

---

## 8. Sprint 6 - Player e App Android

**Objetivo:** Desenvolver app Android TV para reprodução offline

### 8.1 App Android TV (MVP)

**Descrição:** Aplicativo nativo para TV Box que baixa e reproduz mídias offline.

**Tecnologia recomendada:** React Native + Expo (reutiliza conhecimento React)

**Estrutura do projeto:**
```
boxpratico-player/
├── android/
├── src/
│   ├── api/
│   │   ├── auth.ts
│   │   ├── terminals.ts
│   │   ├── media.ts
│   │   └── sync.ts
│   ├── components/
│   │   ├── MediaPlayer.tsx
│   │   ├── Footer.tsx
│   │   └── LoadingScreen.tsx
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── TerminalSelectScreen.tsx
│   │   ├── DownloadScreen.tsx
│   │   └── PlayerScreen.tsx
│   ├── services/
│   │   ├── storage.ts
│   │   ├── download.ts
│   │   └── playback.ts
│   └── hooks/
│       ├── useAuth.ts
│       ├── useSync.ts
│       └── usePlayer.ts
├── assets/
├── app.json
└── package.json
```

**Fluxo do app:**
1. Splash Screen (logo + versão)
2. Login (identificador + email + senha)
3. Seleção de Terminal
4. Download de Mídias (com progresso)
5. Player (fullscreen, loop infinito)

**APIs necessárias no backend:**
- `POST /api/player/auth` - Login do player
- `GET /api/player/terminals` - Listar terminais
- `GET /api/player/playlist/:terminalId` - Playlist do terminal
- `POST /api/player/ping` - Heartbeat com status
- `GET /api/player/commands/:terminalId` - Comandos pendentes

**Tarefas:**
- [ ] Criar projeto React Native + Expo
- [ ] Implementar telas de autenticação
- [ ] Sistema de download com cache
- [ ] Player de vídeo/imagem
- [ ] Sincronização em background
- [ ] Componente de rodapé/ticker
- [ ] Comandos remotos (reiniciar, atualizar)
- [ ] Build APK para distribuição
- [ ] Testar em TV Box física

**Estimativa:** 15-20 dias

---

### 8.2 Modo Offline (Cache)

**Descrição:** Player funciona mesmo sem internet após download inicial.

**Funcionalidades:**
- Download de todas as mídias no primeiro sync
- Cache local com SQLite/AsyncStorage
- Verificação periódica de atualizações
- Fallback para cache se offline
- Indicador visual de status de conexão

**Tarefas:**
- [ ] Implementar CacheManager
- [ ] SQLite para metadados
- [ ] FileSystem para mídias
- [ ] Lógica de sync incremental
- [ ] UI de status offline

**Estimativa:** 5-7 dias (incluído no app)

---

## 9. Dependências entre Sprints

```
Sprint 1 (Core) ──────────────────────────────────────┐
     │                                                  │
     ├─► Sprint 2 (Pagamentos Asaas)                    │
     │          │                                       │
     │          ▼                                       │
     ├─► Sprint 3 (Widgets)                             │
     │          │                                       │
     │          ▼                                       │
     └─► Sprint 4 (Infra) ◄────────────────────────────┘
                │
                ▼
         Sprint 5 (IA)
                │
                ▼
         Sprint 6 (App Android)
```

**Notas:**
- Sprint 1 pode rodar em paralelo com Sprint 2
- Sprint 3 depende de Sprint 1 (agendamento)
- Sprint 4 pode rodar em paralelo após Sprint 1
- Sprint 5 depende de Sprint 4 (infraestrutura)
- Sprint 6 (App Android) vai por último, quando o backend estiver maduro

---

## 10. Estimativas e Recursos

### Resumo de Estimativas

| Sprint | Descrição | Estimativa |
|--------|-----------|------------|
| Sprint 1 | Funcionalidades Core | 11-14 dias |
| Sprint 2 | Pagamentos Asaas + Contratos | 14-19 dias |
| Sprint 3 | Conteúdos Dinâmicos | 12-17 dias |
| Sprint 4 | Infraestrutura | 15-23 dias |
| Sprint 5 | Inteligência e Automação | 15-22 dias |
| Sprint 6 | Player e App Android | 20-27 dias |
| **TOTAL** | | **87-122 dias** |

### Execução Recomendada (1 desenvolvedor)

**Ordem:** Sprint 1 → 2 → 3 → 4 → 5 → 6

**Timeline: ~5-7 meses**

### Priorização Sugerida (Valor de Negócio)

1. **Imediato (Semana 1-2):**
   - Agendamento de mídia
   - Campos adicionais no terminal
   - Barra de rodapé

2. **Curto Prazo (Mês 1):**
   - Geração de PDF de contratos
   - Pagamentos Asaas (PIX + Boleto)
   - Sistema de trial

3. **Médio Prazo (Mês 2-3):**
   - Biblioteca de conteúdos
   - Widgets (Hora Certa, Cotação)
   - Migração infraestrutura

4. **Longo Prazo (Mês 4+):**
   - Funcionalidades de IA
   - Widgets avançados
   - App Android TV

---

## Apêndice A - Checklist de Tarefas

### Sprint 1
- [ ] 1.1 Agendamento de Mídia
  - [ ] Interface MediaSchedule
  - [ ] Formulário no admin
  - [ ] Lógica no player
  - [ ] Testes
- [ ] 1.2 Campos do Terminal
  - [ ] Estender tipo Monitor
  - [ ] Formulário expandido
  - [ ] API de CEP
  - [ ] Migração dados
- [ ] 1.3 Biblioteca Global
  - [ ] API CRUD
  - [ ] Tab super admin
  - [ ] Integração tenants
- [ ] 1.4 Rodapé/Ticker
  - [ ] Componente animado
  - [ ] Configuração admin
  - [ ] Suporte RSS

### Sprint 2
- [x] 2.1 AssinaAgora ✅
- [ ] 2.2 PDF Contratos
  - [ ] Template
  - [ ] Gerador
  - [ ] Endpoint
- [ ] 2.3 Pagamentos Asaas
  - [ ] PIX com QR Code
  - [ ] Boleto
  - [ ] Cobrança recorrente
  - [ ] Webhook
  - [ ] Split pagamentos
- [ ] 2.4 Trial
  - [ ] Lógica
  - [ ] Bloqueio
  - [ ] Notificações

### Sprint 3
- [ ] 3.1 Widgets básicos
  - [ ] Hora Certa
  - [ ] Cotação
  - [ ] Avisos
- [ ] 3.2 Widgets avançados
  - [ ] Loteria
  - [ ] Horóscopo
  - [ ] Placar

### Sprint 4
- [ ] 4.1 PostgreSQL + Prisma
- [ ] 4.2 MinIO
- [ ] 4.3 Redis

### Sprint 5
- [ ] 5.1 Chat IA
- [ ] 5.2 Gerador de Anúncios
- [ ] 5.3 Login Google

### Sprint 6
- [ ] 6.1 App Android TV
  - [ ] Setup projeto
  - [ ] Telas de auth
  - [ ] Download/cache
  - [ ] Player
  - [ ] Sync background
  - [ ] Build APK
- [ ] 6.2 Modo Offline

---

*Documento mantido em: `docs/PLANO-PROJETO-PENDENCIAS.md`*
