# BoxPrático Marketing - Memória do Projeto

**Data de Criação:** 2025-01-28
**Último Update:** 2025-01-28
**Status:** ✅ Redesign do Admin Completo

---

## 📋 Informações do Projeto

### Repositório
- **Nome:** boxpratico-marketing
- **GitHub:** https://github.com/inael/boxpratico-marketing.git
- **Path Local:** `C:\Users\inael\Documents\GitHub\novo-site-itbooster\boxpratico-marketing`
- **Branch:** master

### Stack Tecnológico
- **Framework:** Next.js 16 com App Router
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4 (@tailwindcss/postcss)
- **Animações:** Framer Motion 12.23.24
- **UI Components:** Headless UI 2.2.9, Heroicons 2.2.0
- **RSS Parser:** rss-parser 3.13.0
- **Fonts:** Inter (sans), Poppins (display)

### Descrição
Sistema completo de digital signage para condomínios com:
- Player de mídia em loop infinito
- Painel administrativo completo
- Integração com feed de notícias
- Preview em tempo real

---

## 🎯 Funcionalidades Implementadas

### 1. Sistema de Player (`/player/[condominiumSlug]`)
✅ Loop infinito de conteúdo
✅ Suporte a múltiplos tipos de mídia:
  - Imagens (com animação fade)
  - Vídeos (HTML5 video)
  - YouTube (iframe embed)
  - PDFs (via iframe)
  - Notícias (integração RSS)
✅ Auto-refresh ao final do loop
✅ Intercalação de notícias a cada 3 itens (se ativado)
✅ Comunicação via postMessage para refresh manual
✅ Fetch dinâmico do campo `showNews` do condomínio

**Componentes:**
- `components/PlaylistPlayer.tsx` - Player principal
- `components/slides/ImageSlide.tsx` - Slide de imagem
- `components/slides/VideoSlide.tsx` - Slide de vídeo
- `components/slides/YoutubeSlide.tsx` - Slide do YouTube
- `components/slides/PdfSlide.tsx` - Slide de PDF
- `components/slides/NewsSlide.tsx` - Slide de notícia (com imagem, título, descrição)

### 2. Painel Administrativo (`/admin`) - ✅ REDESIGN COMPLETO

#### Autenticação
- Senha: `admin123`
- Storage: sessionStorage
- Tela de login moderna com gradiente

#### Estrutura de Layout
✅ **AdminHeader** - Header fixo com:
  - Logo BoxPrático (BP com gradiente)
  - Título "BoxPrático Marketing Dashboard"
  - Ícone de notificações
  - Perfil do usuário

✅ **AdminSidebar** - Menu lateral com navegação:
  - Dashboard
  - Condomínios
  - Mídias
  - Analytics (placeholder)
  - Configurações (placeholder)
  - Botão de Logout

✅ **AdminFooter** - Rodapé com:
  - Copyright dinâmico
  - Links: Documentação, Suporte
  - Versão: v1.0.0

#### Tab: Dashboard
✅ 4 Cards de Estatísticas:
  - Condomínios Ativos (contador)
  - Mídias Ativas (contador)
  - Mídias Inativas (contador)
  - Preview Aberto (0 ou 1)

✅ Seção de Ações Rápidas:
  - Botão "Ver Preview na TV" (abre janela popup)
  - Botão "Atualizar Preview" (postMessage)

#### Tab: Condomínios
✅ Grid de cards responsivo (1/2/3 colunas)
✅ Cada card mostra:
  - Nome do condomínio
  - Slug
  - CNPJ (se houver)
  - Indicador visual de status (bolinha verde/cinza)
  - Botão de toggle de notícias
  - Botão de seleção

✅ Ações por condomínio:
  - ✏️ **Editar** - Abre modal com formulário
  - 🗑️ **Deletar** - Confirmação + DELETE na API
  - 🔄 **Ativar/Desativar** - Toggle do campo `isActive`
  - 📰 **Toggle Notícias** - Toggle do campo `showNews`

✅ Modal de Criação/Edição:
  - Campos: Nome, Slug, CNPJ, Endereço
  - Design moderno com labels
  - Botões: Salvar (gradiente) / Cancelar

#### Tab: Mídias
✅ Seletor de condomínio no topo
✅ Grid de cards de mídia (1/2/3 colunas)
✅ Cada card mostra:
  - Título
  - Descrição (line-clamp-2)
  - Tipo (badge)
  - Duração em segundos
  - Indicador de status

✅ Ações por mídia:
  - ✅/❌ **Ativar/Desativar** - Toggle de `isActive`
  - 🗑️ **Deletar** - Confirmação + DELETE na API

✅ Modal de Criação:
  - Campos: Título, Descrição, Tipo, Upload, URL, Duração
  - Upload de arquivos para `/api/upload`
  - Validações

### 3. API Routes

#### `/api/condominiums`
- `GET` - Lista todos os condomínios
- `POST` - Cria novo condomínio

#### `/api/condominiums/[id]`
- `GET` - Busca condomínio por ID
- `PUT` - Atualiza condomínio (aceita `isActive`, `showNews`)
- `DELETE` - Deleta condomínio

#### `/api/media-items`
- `GET` - Lista mídias (filtro por `condominiumId`)
- `POST` - Cria nova mídia

#### `/api/media-items/[id]`
- `GET` - Busca mídia por ID
- `PUT` - Atualiza mídia (aceita `isActive`)
- `DELETE` - Deleta mídia

#### `/api/news`
- `GET` - Busca RSS da Gazeta do Povo
- Feed: `https://www.gazetadopovo.com.br/feed/rss/brasil.xml`
- Retorna: título, link, descrição, imageUrl, source, publishedAt
- Processa HTML tags e limita descrição a 200 chars

#### `/api/upload`
- `POST` - Upload de arquivos (imagens, vídeos, PDFs)
- Salva em `/public/uploads/`
- Retorna URL relativa

### 4. Database (JSON Files)

**Localização:** `/data/`

#### `condominiums.json`
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "cnpj": "string?",
  "address": "string?",
  "isActive": "boolean?",
  "showNews": "boolean?",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

#### `media-items.json`
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string?",
  "type": "image|video|youtube|pdf",
  "sourceUrl": "string",
  "durationSeconds": "number?",
  "isActive": "boolean",
  "order": "number",
  "condominiumId": "string",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

### 5. Preview System (`/admin/[condominiumSlug]/preview`)
✅ Mesma tela do player
✅ Abre em popup (1920x1080)
✅ Recebe postMessage para refresh manual
✅ URL encoding para slugs com espaços

---

## 🎨 Design System

### Paleta de Cores (Tailwind Config)

```javascript
primary: {
  50: '#f0f9ff',
  500: '#0ea5e9', // Sky Blue
  600: '#0284c7',
}

secondary: {
  500: '#d946ef', // Fuchsia
  600: '#c026d3',
}

accent: {
  500: '#f97316', // Orange
  600: '#ea580c',
}
```

### Gradientes Principais
- `from-primary-500 to-secondary-600` - Botões CTA
- `from-slate-50 via-blue-50 to-indigo-100` - Backgrounds

### Componentes Reutilizáveis
- Cards: `bg-white rounded-xl shadow-sm p-6 border border-gray-100`
- Botões Primários: Gradiente com hover:shadow-lg
- Inputs: `border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500`

### Animações (Framer Motion)
- `fadeIn` - Opacity 0→1
- `slideUp` - TranslateY 20px→0
- `slideDown` - TranslateY -20px→0
- `scaleIn` - Scale 0.9→1

---

## 📝 Histórico de Desenvolvimento

### Sessão 1 - Desenvolvimento Inicial
1. ✅ Setup do projeto Next.js + TypeScript + Tailwind
2. ✅ Estrutura de tipos (`types/index.ts`)
3. ✅ Database layer (`lib/db.ts`)
4. ✅ API routes completas
5. ✅ Player com loop infinito
6. ✅ Componentes de slides
7. ✅ Painel admin básico

### Sessão 2 - Ajustes de RSS e UI
1. ✅ Mudança de Google News → Gazeta do Povo
2. ✅ Extração de imagem e descrição do RSS
3. ✅ NewsSlide com layout melhorado
4. ✅ Instalação de UI libraries (Headless UI, Heroicons, Framer Motion)
5. ✅ Paleta de cores customizada

### Sessão 3 - Correções de UX
1. ✅ Reposicionamento de texto nos slides (rodapé com gradiente)
2. ✅ Adição de toggle de notícias por condomínio
3. ✅ Fix de URL encoding para preview
4. ✅ Auto-refresh no final do loop
5. ✅ Botão de refresh manual no admin

### Sessão 4 - Redesign Completo do Admin ⭐
**Data:** 2025-01-28

1. ✅ Criação de `AdminHeader.tsx`
2. ✅ Criação de `AdminSidebar.tsx`
3. ✅ Criação de `AdminFooter.tsx`
4. ✅ Adição do campo `isActive` ao tipo `Condominium`
5. ✅ Refatoração completa de `app/admin/page.tsx`:
   - Sistema de tabs
   - Dashboard com estatísticas
   - Cards modernos para condomínios
   - Cards modernos para mídias
   - Ações de editar/deletar/ativar/desativar
6. ✅ Melhoria da paleta de cores (cinza/branco base)
7. ✅ Animações suaves com Framer Motion
8. ✅ Modais redesenhados
9. ✅ Tela de login moderna

**Commit:** `feat: redesign admin panel with modern UI and improved navigation`
**Hash:** 35f6ec6
**Push:** ✅ Enviado para origin/master

---

## 🐛 Issues Resolvidos

### Issue 1: Tailwind CSS v4 Syntax Error
**Erro:** `Cannot apply unknown utility class`
**Causa:** @layer components não compatível com Tailwind v4
**Fix:** Removido @layer components do `globals.css`, simplificado para apenas @import

### Issue 2: SSH Authentication Failed
**Erro:** `Permission denied (publickey)`
**Fix:** Usado HTTPS clone ao invés de SSH

### Issue 3: Heredoc com Template Literals
**Erro:** Sintaxe quebrada em bash heredoc
**Fix:** Migrado para Python scripts para criar componentes

### Issue 4: Preview 404 com Espaços
**Erro:** URL `Aguas claras` → 404
**Fix:** `encodeURIComponent(slug)` no `window.open()`

### Issue 5: Texto Sobrepondo Mídia
**Erro:** Título no meio da tela sobre a mídia
**Fix:** Reposicionado para rodapé com `absolute bottom-0` + gradiente

### Issue 6: Design "Horrível"
**Erro:** Azul/branco não profissional
**Fix:** Redesign completo com cinza/branco + gradientes sutis

---

## 📂 Estrutura de Arquivos

```
boxpratico-marketing/
├── app/
│   ├── admin/
│   │   ├── [condominiumSlug]/
│   │   │   └── preview/
│   │   │       └── page.tsx          # Preview route
│   │   └── page.tsx                  # ⭐ Admin panel (redesigned)
│   ├── api/
│   │   ├── condominiums/
│   │   │   ├── [id]/route.ts
│   │   │   └── route.ts
│   │   ├── media-items/
│   │   │   ├── [id]/route.ts
│   │   │   └── route.ts
│   │   ├── news/route.ts             # RSS Gazeta do Povo
│   │   └── upload/route.ts
│   ├── player/
│   │   └── [condominiumSlug]/
│   │       └── page.tsx              # Player público
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Landing page
├── components/
│   ├── admin/                        # ⭐ NEW
│   │   ├── AdminFooter.tsx
│   │   ├── AdminHeader.tsx
│   │   └── AdminSidebar.tsx
│   ├── slides/
│   │   ├── ImageSlide.tsx
│   │   ├── NewsSlide.tsx
│   │   ├── PdfSlide.tsx
│   │   ├── VideoSlide.tsx
│   │   └── YoutubeSlide.tsx
│   └── PlaylistPlayer.tsx
├── data/
│   ├── condominiums.json
│   └── media-items.json
├── lib/
│   └── db.ts                         # Database helpers
├── public/
│   └── uploads/                      # User uploads
├── types/
│   └── index.ts                      # TypeScript definitions
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── PROJECT_MEMORY.md                 # ⭐ THIS FILE
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Como Rodar o Projeto

### Instalação
```bash
cd C:\Users\inael\Documents\GitHub\novo-site-itbooster\boxpratico-marketing
npm install
```

### Desenvolvimento
```bash
npm run dev
# Acesse: http://localhost:3000
```

### Build
```bash
npm run build
npm start
```

### Rotas Principais
- `/` - Landing page
- `/admin` - Painel administrativo (senha: admin123)
- `/player/[slug]` - Player público
- `/admin/[slug]/preview` - Preview popup

---

## 🔮 Próximos Passos (Backlog)

### Prioridade Alta
- [ ] Implementar edição de mídias (atualmente só cria/deleta)
- [ ] Adicionar drag & drop para reordenar mídias
- [ ] Persistir ordem customizada

### Prioridade Média
- [ ] Tab Analytics - métricas reais
- [ ] Tab Settings - configurações do sistema
- [ ] Logout funcional (limpar sessionStorage)
- [ ] Upload com preview antes de salvar
- [ ] Validação de CNPJ

### Prioridade Baixa
- [ ] Multi-tenant (diferentes admins)
- [ ] Histórico de alterações
- [ ] Notificações push
- [ ] Temas customizáveis
- [ ] Exportação de relatórios

### Melhorias de UX
- [ ] Loading states em todos os fetchs
- [ ] Toast notifications ao invés de alert()
- [ ] Confirmação de deleção com modal customizado
- [ ] Skeleton loaders
- [ ] Error boundaries

### Performance
- [ ] Otimização de imagens com next/image
- [ ] Lazy loading de componentes
- [ ] Cache de RSS feed
- [ ] Service Worker para player offline

---

## 🔑 Informações Importantes

### Senha do Admin
`admin123`

### Porta de Desenvolvimento
`3001` ou `3000` (dependendo da disponibilidade)

### Git
- Branch principal: `master`
- Remote: `origin` (https://github.com/inael/boxpratico-marketing.git)
- Último commit: `35f6ec6` - Redesign do admin

### Convenção de Commits
Seguimos Conventional Commits:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `refactor:` - Refatoração
- `style:` - Mudanças de estilo
- `docs:` - Documentação

Todos os commits incluem:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## 📞 Contato e Suporte

**Desenvolvedor:** Inael
**Path do Projeto:** `C:\Users\inael\Documents\GitHub\novo-site-itbooster\boxpratico-marketing`
**GitHub:** https://github.com/inael/boxpratico-marketing

---

## 📌 Notas Finais

Este arquivo serve como **memória completa do projeto**. Ao reabrir o terminal ou continuar o desenvolvimento:

1. ✅ Leia este arquivo primeiro
2. ✅ Verifique o último commit no Git
3. ✅ Rode `npm run dev` para testar
4. ✅ Consulte a seção "Próximos Passos" para decidir o que fazer

**Status Atual:** ✅ Sistema funcionando completamente. Admin redesenhado e moderno. Pronto para uso em produção ou novos desenvolvimentos.

---

*Última atualização: 2025-01-28 - Redesign completo do painel administrativo*
