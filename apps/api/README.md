# TecTalk API

Backend do TecTalk: aprendizado de vocabulário técnico profissional (Medicina primeiro, PT → EN).

**Stack:** NestJS 11 · TypeScript · PostgreSQL · Prisma 6 · FSRS (`ts-fsrs`) · JWT · Zod

## Rodando

```bash
corepack enable && pnpm install          # na raiz do repositório
cd apps/api
scripts/setup-env.sh "<DATABASE_URL>"    # gera o .env com JWT_SECRET aleatório
pnpm db:generate
pnpm db:init-migration                   # só na primeira vez; gera prisma/migrations/0001_init (commitar)
pnpm prisma migrate deploy
pnpm db:seed
pnpm start:dev
```

Em produção (Railway): `pnpm build` e `pnpm start:prod` (aplica as migrations e sobe a API).
Variáveis obrigatórias: `DATABASE_URL`, `JWT_SECRET` (32+ caracteres).

## Endpoints (prefixo `/v1`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/health` | Verificação de saúde (sem prefixo) |
| POST | `/auth/register` | Cria conta e devolve o token |
| POST | `/auth/login` | Login |
| GET | `/auth/me` | Perfil |
| GET | `/tracks` | Trilhas publicadas |
| GET | `/tracks/:slug` | Unidades, lições e progresso (caminho linear) |
| GET | `/lessons/:id/session` | Exercícios gerados da lição |
| POST | `/lessons/:id/complete` | Envia resultados; calcula XP, ofensiva e agenda revisões |
| GET | `/reviews/:trackSlug/due` | Revisões vencidas (FSRS) |
| POST | `/reviews/:trackSlug/submit` | Envia resultados da revisão |
| GET | `/me/stats` | XP e ofensiva |

Rotas protegidas usam `Authorization: Bearer <token>`.

## Conteúdo

O conteúdo vive em JSON versionado (`prisma/content/*.json`) e entra pelo seed, que é idempotente e
valida a consistência (segmentos de raízes, frases de exemplo, traduções obrigatórias).
Os exercícios **não são escritos à mão**: são gerados a partir dos termos.

Nova trilha ou especialidade: criar outro JSON no mesmo formato e rodar
`pnpm exec tsx prisma/seed.ts prisma/content/<arquivo>.json`.

Fluxo de publicação: `DRAFT` → `IN_REVIEW` → `PUBLISHED`. Só conteúdo `PUBLISHED` aparece no app.

## Áudio (desligado)

A estrutura está pronta: `TermLocale.ipa`, `audioUrl`, `audioStatus`, a interface `AudioProvider`
e o exercício `LISTEN_AND_TYPE`. Para ligar: implementar `AudioProvider` (TTS + storage), registrar em
`AudioModule` e definir `AUDIO_ENABLED=true`.

## Próximos passos

Pacote compartilhado de tipos (`packages/shared`), app Expo (`apps/mobile`) e painel de revisão de conteúdo.
