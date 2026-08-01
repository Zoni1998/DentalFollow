# 🦷 DentalFollow CRM

SaaS de CRM de follow-up odontológico focado em conversão de orçamentos. Ajuda as clínicas a gerenciarem pacientes, agendarem mensagens automáticas pelo WhatsApp e acompanharem métricas de conversão.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + shadcn/ui + Tailwind CSS v4 |
| Animações | Framer Motion |
| Banco de dados | Supabase (PostgreSQL) |
| Mensagens | Evolution API (WhatsApp API Integrada) |
| Agendamento | cron-job.org / Upstash QStash |

## Pré-requisitos

- Node.js 20+
- Conta no Supabase
- Servidor rodando a Evolution API (Ex: Render, VPS)
- (Opcional) Conta Upstash para QStash ou cron-job.org para cron-trigger

## Configuração

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais (Supabase, Evolution API)
```

### Variáveis obrigatórias

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key do Supabase |
| `SUPABASE_SECRET_KEY` | Service role / chaves secretas do supabase |
| `EVOLUTION_API_URL` | URL da instância hospedada da Evolution API |
| `EVOLUTION_API_KEY` | Global API Key da Evolution API |
| `EVOLUTION_INSTANCE_NAME` | Nome da instância do WhatsApp |

## Banco de Dados

O schema consiste em duas tabelas base (dentro do schema evolution ou public dependendo da instalação):

- **patients** — dados pessoais (nome, telefone)
- **followups** — tratamentos, valores, mensagens agendadas, status e métricas de perda

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

### Automação de Agendamentos (Cron)

O envio das mensagens programadas é feito de forma autônoma via Webhook (QStash ou cron-job.org) chamando sua Vercel:

1. Faça deploy da aplicação na Vercel (precisa de URL pública)
2. Configure um Job externo apontando um request `POST` para `https://seu-dominio.com/api/webhooks/qstash`
3. Defina a frequência de execução em `1 minuto`

## Tecnologias

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Evolution API](https://evolution-api.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)