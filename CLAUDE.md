# BoxPratico Marketing - Memoria do Projeto

## Visao Geral

Plataforma B2B2C de Digital Signage (Midia OOH) com modelo de negocio multi-tenant.

**Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion

**Hospedagem:** Vercel (producao) + VPS Hostinger (servicos auxiliares)

**Banco de Dados:** JSON local (pasta `data/`) - preparado para migrar para PostgreSQL

## Arquitetura de Negocio

### Tipos de Tenant

1. **NETWORK_OPERATOR** - Operador de Rede de Midia (ex: Midia Box SP)
   - Vende espaco publicitario em telas
   - Tem vendedores (SALES_AGENT) e parceiros de local (LOCATION_OWNER)
   - Menus: Comercial, Financeiro, Operacao, Growth

2. **CORPORATE_CLIENT** - Cliente Corporativo (ex: Hospital)
   - Usa telas para comunicacao interna
   - Gerencia playlists manuais
   - Menus: Operacao apenas

### Atores do Sistema

| Role | Descricao | Comissao |
|------|-----------|----------|
| SALES_AGENT | Vendedor externo | 15% sobre contratos fechados |
| LOCATION_OWNER | Dono do local com tela | 10% revenue share sobre plays |
| ADVERTISER | Anunciante (cliente final) | - |
| AFFILIATE | Indicador de novos clientes | 10% L1 + 5% L2 |

## Sistema de Precificacao (Time-Value)

### Formula Base
```
valorPorPlay = budget / totalPlaysTarget
multiplicadorTempo = slotDurationSec / 15
precoFinal = valorPorPlay * multiplicadorTempo
```

### Exemplos
- Slot 15s (base): 1.0x
- Slot 30s: 2.0x
- Slot 60s: 4.0x

### Tiers de Terminal
- GOLD: 2.0x multiplicador
- SILVER: 1.5x multiplicador
- BRONZE: 1.0x multiplicador

### Desconto por Volume
- 5+ telas: 5% desconto
- 10+ telas: 10% desconto
- 20+ telas: 15% desconto
- 50+ telas: 20% desconto

## Servicos Implementados

### Quote Service (`lib/quote-service.ts`)
- `calculateQuoteWithCommission()` - Calculo completo com comissao do vendedor
- `calculateTimeMultiplier()` - Multiplicador baseado em duracao do slot
- `filterTerminalsByRadius()` - Filtro geografico por raio em km
- `formatQuoteSummary()` - Formata resumo para exibicao

### Settlement Service (`lib/settlement-service.ts`)
- `generateLocationOwnerSettlement()` - Fechamento mensal para parceiros
- `generateSalesAgentSettlement()` - Fechamento de comissoes para vendedores
- `calculatePlayLogsValue()` - Soma valor real dos PlayLogs
- Baseado em PlayLogs com `valuePerPlay` real (Time-Value)

### Email Service (`lib/email-service.ts`)
- **Providers:** Resend (producao) ou SMTP/Mailpit (VPS)
- **Templates disponíveis:**
  - `sendWelcomeEmail()` - Boas-vindas com credenciais
  - `sendPasswordResetEmail()` - Recuperacao de senha
  - `sendContractSignedEmail()` - Notificacao contrato assinado
  - `sendCommissionNotificationEmail()` - Nova comissao para vendedor
  - `sendSettlementEmail()` - Fechamento mensal
  - `sendTestEmail()` - Email de teste
- **Config:** `EMAIL_PROVIDER=resend|smtp`

### Contract Automation (`lib/contract-automation.ts`)
- `onContractSigned()` - Trigger ao assinar contrato
- Cria usuario ADVERTISER automaticamente
- Cria campanha em DRAFT
- Envia notificacoes por tipo de gestao

### Database (`lib/database.ts`)
- Leitura/escrita em arquivos JSON na pasta `data/`
- Funcoes: `getMonitors()`, `getSalesAgentById()`, `getPlayLogs()`, etc.
- Preparado para migracao futura para Prisma/PostgreSQL

## Arquivos de Dados (pasta `data/`)

```
data/
├── accounts.json          # Tenants (contas)
├── users.json             # Usuarios
├── condominiums.json      # Localizacoes
├── monitors.json          # Terminais/Telas
├── location-owners.json   # Parceiros de local
├── sales-agents.json      # Vendedores
├── advertisers.json       # Anunciantes
├── contracts.json         # Contratos
├── campaigns.json         # Campanhas
├── play-logs.json         # Registros de exibicao
└── commission-ledger.json # Comissoes pendentes
```

## Infraestrutura VPS (Hostinger)

```
Servidor: srv1078017.hstgr.cloud
IP: 72.61.135.214
Plano: KVM 4 (16GB RAM)

Servicos Rodando:
┌─────────────────┬─────────────────────────────────┬───────────┐
│ Servico         │ URL/Acesso                      │ Porta     │
├─────────────────┼─────────────────────────────────┼───────────┤
│ n8n             │ https://n8n.toolpad.cloud       │ 5678      │
│ Evolution API   │ https://whatsapp.toolpad.cloud  │ 8080      │
│ NGINX RTMP      │ https://stream.boxpratico.com.br│ 1935/8080 │
│ Mailpit         │ localhost:8025 (UI)             │ SMTP: 25  │
│ Traefik         │ Reverse proxy SSL               │ 80/443    │
│ Redis           │ evolution-redis:6379            │ 6379      │
│ PostgreSQL      │ Database Evolution              │ 5432      │
└─────────────────┴─────────────────────────────────┴───────────┘
```

## Credenciais de Teste (Seed)

```
Hospital (Corporate):
  Email: admin@hospital.com
  Senha: 123456
  Tipo: CORPORATE_CLIENT

Midia Box (Network Operator):
  Email: admin@midiabox.com
  Senha: 123456
  Tipo: NETWORK_OPERATOR

Vendedor:
  Email: vendedor@midiabox.com
  Senha: 123456
  Comissao: 15%
  Pendente: R$ 2.250
```

## Dados de Teste (Seed)

```bash
# Rodar seed
npx tsx scripts/seed-enterprise.ts

# Resetar e rodar seed
rm -rf data && npx tsx scripts/seed-enterprise.ts
```

**Dados criados:**
- 6.096 PlayLogs (dezembro 2024)
  - Coca-Cola: 4.464 plays (R$ 446,40)
  - Nike: 1.632 plays (R$ 163,20)
- Contratos: R$ 10.000 (Coca) + R$ 5.000 (Nike)
- Parceiro Jose (Padaria): 10% revenue share, R$ 14,88 a receber
- Vendedor Paulo: 15% comissao, R$ 2.250 pendente

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev

# Build producao
npm run build

# Seed de dados
npx tsx scripts/seed-enterprise.ts

# Resetar dados
rm -rf data && npx tsx scripts/seed-enterprise.ts

# Testar email (adicionar endpoint temporario)
curl -X POST http://localhost:3000/api/test-email
```

## Variaveis de Ambiente

```env
# Autenticacao
AUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# Email (escolher um)
EMAIL_PROVIDER=resend          # ou 'smtp'
RESEND_API_KEY=re_xxx          # se usar Resend
SMTP_HOST=72.61.135.214        # se usar SMTP
SMTP_PORT=25
EMAIL_FROM=BoxPratico <noreply@boxpratico.com.br>

# Streaming
STREAM_DOMAIN=stream.boxpratico.com.br
RTMP_SERVER=72.61.135.214:1935

# WhatsApp (Evolution)
EVOLUTION_API_URL=https://whatsapp.toolpad.cloud
EVOLUTION_API_KEY=xxx

# Pagamentos (futuro)
ASAAS_API_KEY=xxx
MERCADOPAGO_ACCESS_TOKEN=xxx
```

## APIs Implementadas

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/quotes` | POST | Calcular orcamento com comissao |
| `/api/quotes` | GET | Listar terminais para simulador |
| `/api/auth/*` | - | NextAuth.js |
| `/api/monitors` | GET/POST | CRUD de terminais |
| `/api/contracts` | GET/POST | CRUD de contratos |

## Componentes Principais

```
components/admin/
├── AdminSidebarV2.tsx     # Sidebar com filtros por tenant type
├── AdminHeaderV2.tsx      # Header com notificacoes
├── BenefitsTab.tsx        # Sistema de afiliados (10%/5%)
├── ContractsTab.tsx       # Gerenciamento de contratos
├── CampaignSimulator.tsx  # Simulador de campanhas
├── FinancialTab.tsx       # Gestao de comissoes
└── ...
```

## Fluxo de Negocio

```
1. Vendedor acessa Simulador
   ├── Seleciona terminais (por raio ou lista)
   ├── Define duracao slot (15s/30s/60s)
   ├── Ve preco e comissao em tempo real
   └── Gera proposta/contrato

2. Contrato Assinado (trigger automatico)
   ├── Cria usuario ADVERTISER
   ├── Cria campanha DRAFT
   ├── Notifica time de operacao
   └── Envia email de boas-vindas

3. Campanha Ativa
   ├── PlayLogs registrados com valuePerPlay
   └── Revenue share calculado por terminal

4. Fechamento Mensal
   ├── SettlementService gera fechamentos
   ├── Parceiros recebem % sobre plays
   ├── Vendedores recebem % sobre contratos
   └── Emails de notificacao enviados
```

## Proximos Passos (Roadmap)

1. [ ] Migrar para PostgreSQL (Prisma)
2. [ ] Integracao AssinaAgora (assinatura digital)
3. [ ] Dashboard de metricas em tempo real
4. [ ] App mobile para vendedores
5. [ ] Cloud Storage (Google Drive/OneDrive)
6. [ ] Integracao Asaas para cobrancas
7. [ ] Webhooks para eventos de campanha
8. [ ] Relatorios PDF automaticos
