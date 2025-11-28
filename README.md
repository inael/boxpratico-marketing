# BoxPrático Marketing

Sistema de marketing digital para condomínios com player de mídia em loop infinito.

## Funcionalidades

- CRUD completo de condomínios
- CRUD completo de mídias (imagens, vídeos, PDFs, YouTube)
- Player de playlist em tela cheia com loop infinito
- Integração com Google News RSS
- Painel administrativo com autenticação
- Upload de arquivos (imagens, vídeos, PDFs)
- Preview em tempo real
- Sistema de ordenação e ativação/desativação de mídias

## Tecnologias Utilizadas

- **Next.js 16** - Framework React para produção
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **RSS Parser** - Parsing de feeds RSS
- **Sistema de arquivos JSON** - Banco de dados simples

## Como Rodar Localmente

### 1. Clone o repositório

```bash
git clone https://github.com/inael/boxpratico-marketing.git
cd boxpratico-marketing
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` e configure:

```env
ADMIN_PASSWORD=sua_senha_segura_aqui
```

### 4. Execute o servidor de desenvolvimento

```bash
npm run dev
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000)

## Como Usar

### Acessar o Painel Admin

1. Acesse [http://localhost:3000/admin](http://localhost:3000/admin)
2. Digite a senha configurada em `.env.local` (padrão: `admin123`)

### Cadastrar Condomínios

1. No painel admin, clique em "Novo Condomínio"
2. Preencha os dados:
   - **Nome**: Nome do condomínio
   - **Slug**: Identificador único na URL (ex: `meu-condominio`)
   - **CNPJ**: Opcional
   - **Endereço**: Opcional
3. Clique em "Salvar"

### Cadastrar Mídias

1. Selecione um condomínio no seletor do topo
2. Clique em "Nova Mídia"
3. Preencha os dados:
   - **Título**: Título da mídia
   - **Descrição**: Opcional
   - **Tipo**: Selecione entre:
     - **Imagem**: Para imagens (JPG, PNG, etc)
     - **Vídeo**: Para vídeos (MP4, WEBM, etc)
     - **YouTube**: Para vídeos do YouTube
     - **PDF**: Para documentos PDF
   - **Upload de arquivo**: Faça upload do arquivo (para imagens, vídeos e PDFs)
   - **URL**: Ou informe a URL (para YouTube ou arquivos externos)
   - **Duração**: Tempo em segundos que a mídia ficará na tela (padrão: 10s)
4. Clique em "Criar"

### Visualizar no Player

Existem duas formas de visualizar as mídias:

#### 1. Preview (dentro do admin)

No painel admin, com um condomínio selecionado, clique em "Ver como ficará na TV" para abrir o preview em uma nova aba.

#### 2. Player Público

Acesse a URL: `http://localhost:3000/player/[slug-do-condominio]`

Exemplo: `http://localhost:3000/player/meu-condominio`

### Gerenciar Mídias

- **Ativar/Desativar**: Clique em "Ativar" ou "Desativar" para controlar quais mídias aparecem no player
- **Excluir**: Clique em "Excluir" para remover uma mídia
- **Editar Condomínio**: Clique em "Editar" ao lado do condomínio

## Estrutura do Projeto

```
boxpratico-marketing/
├── app/                          # Páginas e rotas Next.js
│   ├── admin/                    # Painel administrativo
│   │   ├── [condominiumSlug]/
│   │   │   └── preview/         # Preview do player
│   │   └── page.tsx             # Página principal do admin
│   ├── api/                     # APIs REST
│   │   ├── condominiums/        # CRUD de condomínios
│   │   ├── media-items/         # CRUD de mídias
│   │   ├── news/                # API de notícias RSS
│   │   └── upload/              # API de upload de arquivos
│   ├── player/                  # Player público
│   │   └── [condominiumSlug]/  # Player por condomínio
│   ├── globals.css              # Estilos globais
│   ├── layout.tsx               # Layout raiz
│   └── page.tsx                 # Página inicial
├── components/                   # Componentes React
│   ├── slides/                  # Componentes de slides
│   │   ├── ImageSlide.tsx       # Slide de imagem
│   │   ├── VideoSlide.tsx       # Slide de vídeo
│   │   ├── YoutubeSlide.tsx     # Slide do YouTube
│   │   ├── PdfSlide.tsx         # Slide de PDF
│   │   └── NewsSlide.tsx        # Slide de notícia
│   └── PlaylistPlayer.tsx       # Player de playlist
├── lib/                         # Utilitários e helpers
│   ├── db.ts                    # Sistema de banco de dados
│   └── auth.ts                  # Helper de autenticação
├── types/                       # Definições TypeScript
│   └── index.ts                 # Tipos das entidades
├── data/                        # Dados em JSON (criado automaticamente)
│   ├── condominiums.json        # Dados dos condomínios
│   └── media-items.json         # Dados das mídias
├── public/                      # Arquivos públicos
│   └── uploads/                 # Uploads de arquivos
├── .env.example                 # Exemplo de variáveis de ambiente
├── .env.local                   # Variáveis de ambiente (não commitado)
├── next.config.ts               # Configuração do Next.js
├── tailwind.config.ts           # Configuração do Tailwind
├── tsconfig.json                # Configuração do TypeScript
├── package.json                 # Dependências do projeto
└── README.md                    # Este arquivo
```

## Deploy na Vercel

### 1. Crie uma conta na Vercel

Acesse [vercel.com](https://vercel.com) e crie uma conta (pode usar sua conta do GitHub).

### 2. Importe o projeto

1. No dashboard da Vercel, clique em "New Project"
2. Selecione o repositório `inael/boxpratico-marketing`
3. A Vercel detectará automaticamente que é um projeto Next.js

### 3. Configure as variáveis de ambiente

Na seção "Environment Variables", adicione:

```
ADMIN_PASSWORD=sua_senha_segura_aqui
```

### 4. Deploy

1. Clique em "Deploy"
2. Aguarde o build e deploy serem concluídos
3. Sua aplicação estará disponível em uma URL como: `https://boxpratico-marketing.vercel.app`

### Observações sobre o Deploy

- Os dados são armazenados em arquivos JSON na pasta `data/`
- No Vercel, como o sistema de arquivos é efêmero, os dados serão perdidos após cada deploy
- Para produção, recomenda-se:
  - Migrar para um banco de dados real (PostgreSQL, MongoDB, etc)
  - Usar um serviço de armazenamento para uploads (S3, Cloudinary, etc)

## Fluxo de Trabalho Completo

1. **Criar Condomínio** → Admin cria um novo condomínio com slug único
2. **Adicionar Mídias** → Admin adiciona imagens, vídeos, PDFs ou links do YouTube
3. **Ordenar e Ativar** → Admin organiza a ordem e ativa/desativa mídias
4. **Preview** → Admin visualiza como ficará na TV
5. **Publicar** → Compartilha o link do player com o condomínio
6. **Exibição** → TV/tela do condomínio acessa o player e exibe em loop

## Recursos Adicionais

### Intercalação de Notícias

O sistema intercala automaticamente notícias do Google News RSS a cada 3 mídias exibidas.

### Duração Personalizada

Cada mídia pode ter uma duração customizada (em segundos). Vídeos terminam automaticamente quando acabam.

### Tipos de Mídia Suportados

- **Imagem**: JPG, PNG, GIF, WebP
- **Vídeo**: MP4, WebM, OGG
- **PDF**: Arquivos PDF (exibidos em iframe)
- **YouTube**: Vídeos do YouTube (embed automático)

## Desenvolvimento

### Comandos Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Cria build de produção
npm run start    # Inicia servidor de produção
npm run lint     # Executa o linter
```

### Estrutura de Dados

#### Condominium

```typescript
{
  id: string
  name: string
  slug: string
  cnpj?: string
  address?: string
  createdAt: string
  updatedAt: string
}
```

#### MediaItem

```typescript
{
  id: string
  title: string
  description?: string
  type: 'image' | 'video' | 'youtube' | 'pdf' | 'news'
  sourceUrl: string
  durationSeconds?: number
  isActive: boolean
  order: number
  condominiumId: string
  createdAt: string
  updatedAt: string
}
```

## Suporte

Para problemas ou dúvidas, abra uma issue no GitHub: [https://github.com/inael/boxpratico-marketing/issues](https://github.com/inael/boxpratico-marketing/issues)

## Licença

ISC
