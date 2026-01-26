# BoxPratico Marketing - Memoria do Projeto

## Visao Geral

Plataforma B2B2C de Digital Signage (Midia OOH) com modelo de negocio multi-tenant.

**Stack:** Next.js 14, TypeScript, Tailwind CSS, Framer Motion

**Hospedagem:** Vercel (producao) + VPS Hostinger (servicos auxiliares)

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

## Servicos Implementados

### Quote Service (`lib/quote-service.ts`)
- `calculateQuoteWithCommission()` - Calculo completo com comissao do vendedor
- `calculateTimeMultiplier()` - Multiplicador baseado em duracao do slot
- `filterTerminalsByRadius()` - Filtro geografico por raio em km

### Settlement Service (`lib/settlement-service.ts`)
- `generateLocationOwnerSettlement()` - Fechamento mensal para parceiros
- `generateSalesAgentSettlement()` - Fechamento de comissoes para vendedores
- Baseado em PlayLogs com `valuePerPlay` real

### Email Service (`lib/email-service.ts`)
- **Providers:** Resend (producao) ou SMTP/Mailpit (VPS)
- **Templates:** Boas-vindas, recuperacao senha, contrato assinado, comissao, fechamento mensal
- **Config:** `EMAIL_PROVIDER=resend|smtp`

### Contract Automation (`lib/contract-automation.ts`)
- `onContractSigned()` - Trigger ao assinar contrato
- Cria usuario ADVERTISER automaticamente
- Cria campanha em DRAFT

## Infraestrutura VPS (Hostinger)

```
Servidor: srv1078017.hstgr.cloud
IP: 72.61.135.214

Servicos:
- n8n: https://n8n.toolpad.cloud (porta 5678)
- Evolution API: https://whatsapp.toolpad.cloud (porta 8080)
- NGINX RTMP: https://stream.boxpratico.com.br (RTMP 1935)
- Mailpit: localhost:8025 (SMTP porta 25)
- Traefik: Reverse proxy com SSL
- Redis: Cache para Evolution
- PostgreSQL: Database para Evolution
```

## Credenciais de Teste (Seed)

```
Hospital (Corporate):
  Email: admin@hospital.com
  Senha: 123456

Midia Box (Network Operator):
  Email: admin@midiabox.com
  Senha: 123456

Vendedor:
  Email: vendedor@midiabox.com
  Senha: 123456
  Comissao: 15%
```

## Dados de Teste (Seed)

```bash
npx tsx scripts/seed-enterprise.ts
```

Cria:
- 6.096 PlayLogs (Coca-Cola + Nike)
- Contratos: R$ 10.000 + R$ 5.000
- Parceiro Jose (10% revenue share)
- Vendedor Paulo (15% comissao, R$ 2.250 pendente)

## Comandos Uteis

```bash
# Desenvolvimento
npm run dev

# Seed de dados
npx tsx scripts/seed-enterprise.ts

# Resetar dados
rm -rf data && npx tsx scripts/seed-enterprise.ts
```

## Variaveis de Ambiente Importantes

```env
# Email
EMAIL_PROVIDER=resend|smtp
RESEND_API_KEY=re_xxx
SMTP_HOST=72.61.135.214
SMTP_PORT=25

# Streaming
STREAM_DOMAIN=stream.boxpratico.com.br
RTMP_SERVER=72.61.135.214:1935

# WhatsApp
EVOLUTION_API_URL=https://whatsapp.toolpad.cloud
```

## Proximos Passos (Roadmap)

1. [ ] Migrar para PostgreSQL (Prisma)
2. [ ] Integracao AssinaAgora (assinatura digital)
3. [ ] Dashboard de metricas em tempo real
4. [ ] App mobile para vendedores
5. [ ] Cloud Storage (Google Drive/OneDrive)
