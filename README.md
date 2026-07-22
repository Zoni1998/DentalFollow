# 🦷 AppDrPedro — DentalFollow CRM

CRM de follow-up odontológico focado em conversão de orçamentos. Ajuda o Dr. Pedro a gerenciar pacientes, agendar mensagens de WhatsApp automáticas e acompanhar métricas de conversão.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui + Tailwind CSS v4 |
| Animações | Framer Motion |
| Banco de dados | Supabase (PostgreSQL) |
| Mensagens | Z-API (WhatsApp API) |
| Agendamento | Upstash QStash |

## Pré-requisitos

- Node.js 20+
- Conta no Supabase
- (Opcional) Conta na Z-API para envio de WhatsApp real
- (Opcional) Conta Upstash para QStash

## Configuração

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais (Supabase, Z-API, QStash)
```

### Variáveis obrigatórias

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server-only) |

### Variáveis opcionais

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `ZAPI_INSTANCE_ID` | ID da instância Z-API | Mock mode |
| `ZAPI_TOKEN` | Token da Z-API | Mock mode |
| `QSTASH_CURRENT_SIGNING_KEY` | Chave de assinatura QStash | Sem verificação |

## Banco de Dados

O schema consiste em duas tabelas:

- **patients** — dados pessoais (nome, telefone)
- **followups** — tratamentos, valores, mensagens agendadas, status e métricas de perda

Execute as migrations na ordem para criar o schema:

```bash
# Via Supabase CLI
supabase db push

# Ou manualmente via SQL editor no dashboard do Supabase
# Arquivos em supabase/migrations/
```

### Status de Follow-up

| Status | Significado |
|--------|-------------|
| Pendente | Aguardando envio agendado |
| Enviado | Mensagem WhatsApp enviada |
| Fechado | Paciente converteu/cliente fechado |
| Perdido | Paciente não converteu |

## Rodando Localmente

```bash
npm run dev
# Acesse http://localhost:3000
```

## Deploy

O projeto é otimizado para deploy na **Vercel** (Next.js nativo).

```bash
npm run build
npm start
```

### Integração com QStash

1. Faça deploy da aplicação (precisa de URL pública)
2. Configure o QStash para chamar `POST https://seu-dominio.com/api/webhooks/qstash`
3. Defina a frequência desejada (ex: a cada 1 minuto)

## Estrutura do Projeto

```
src/
├── app/
│   ├── api/               # API Routes (server-side)
│   │   ├── patients/       # CRUD de pacientes/followups
│   │   ├── followups/      # Listagem e busca por ID
│   │   ├── dashboard/      # Dados agregados pro dashboard
│   │   ├── whatsapp/       # Envio + QR code Z-API
│   │   └── webhooks/qstash/ # Processamento de mensagens agendadas
│   ├── configuracoes/      # Conexão WhatsApp
│   ├── conversao/          # Métricas de conversão
│   ├── followup/           # Cadastro, lista e ficha do paciente
│   ├── hoje/               # Follow-ups do dia
│   └── orcamentos/          # Pipeline de orçamentos
├── components/              # Componentes UI (shadcn + motion)
├── lib/                     # Utilitários (formatação, Supabase, Z-API)
└── supabase/
    └── migrations/          # Migrations do banco de dados
```

## Tecnologias

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Z-API](https://z-api.io)
- [Upstash QStash](https://upstash.com/qstash)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)