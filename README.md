# Farol — Neon persistence + Auth + Tasks (MVP)

Este projeto usa **Netlify Functions** como camada backend para autenticação e persistência de tarefas no **Postgres (Neon)**.

## Arquitetura (segura)

- O frontend React **não acessa o banco diretamente**.
- Toda leitura/escrita em Postgres passa por `/.netlify/functions/*`.
- Segredos ficam apenas em variáveis de ambiente do Netlify.

## Estrutura adicionada

- `db/migrations/001_init.sql`
- `netlify/functions/migrate.js`
- `netlify/functions/auth-register.js`
- `netlify/functions/auth-login.js`
- `netlify/functions/auth-google.js`
- `netlify/functions/tasks.js`
- `netlify/functions/_lib/db.js`
- `netlify/functions/_lib/auth.js`
- `netlify.toml`

## Variáveis de ambiente no Netlify

Além da variável já criada pelo Netlify DB:

- `NETLIFY_DATABASE_URL` (já existe)
- `NETLIFY_DATABASE_URL_UNPOOLED` (já existe, opcional para outros usos)

Configure também:

- `JWT_SECRET` (backend, obrigatória, string longa e aleatória)
- `MIGRATE_ADMIN_KEY` (backend, obrigatória em produção para rodar migração)
- `GOOGLE_CLIENT_ID` (backend, obrigatório para login Google)
- `VITE_GOOGLE_CLIENT_ID` (frontend, obrigatório para exibir botão Google)

> Nunca commitar valores dessas variáveis no repositório.

### Onde configurar no Netlify

1. Acesse **Site configuration → Environment variables** no painel do site.
2. Cadastre/atualize as variáveis acima.
3. Faça **redeploy** (Deploys → Trigger deploy) após qualquer mudança de env var.

## Migrations (idempotentes e versionadas)

As migrations ficam em `db/migrations` e são aplicadas em ordem por nome de arquivo.

A função `migrate`:
- cria `schema_migrations` se necessário;
- aplica apenas arquivos ainda não aplicados;
- registra cada migration aplicada.

### Rodar migração (uma vez por ambiente)

Endpoint:

```bash
POST https://<seu-site>.netlify.app/.netlify/functions/migrate
```

Header obrigatório em produção:

```bash
x-admin-key: <MIGRATE_ADMIN_KEY>
```

Exemplo com curl:

```bash
curl -X POST "https://<seu-site>.netlify.app/.netlify/functions/migrate" \
  -H "x-admin-key: <MIGRATE_ADMIN_KEY>"
```

> Em `NODE_ENV !== production`, a função permite execução sem `x-admin-key` para facilitar desenvolvimento local.

## Endpoints disponíveis

### Auth

- `POST /.netlify/functions/auth-register`
  - body: `{ "email": "...", "password": "..." }`
- `POST /.netlify/functions/auth-login`
  - body: `{ "email": "...", "password": "..." }`
  - retorno: `{ "token": "<JWT>" }`
- `POST /.netlify/functions/auth-google`
  - body: `{ "id_token": "..." }`
  - valida `aud` do token com `GOOGLE_CLIENT_ID`
  - cria usuário (se necessário) e retorna `{ "token": "<JWT>" }`

### Tasks (protegido por Bearer token)

- `GET /.netlify/functions/tasks`
- `POST /.netlify/functions/tasks` body: `{ "title": "..." }`
- `PATCH /.netlify/functions/tasks` body: `{ "id": "...", "done": true|false }`
- `DELETE /.netlify/functions/tasks` body: `{ "id": "..." }`

Header:

```bash
Authorization: Bearer <token>
```

## Frontend

- Tela de login/cadastro conectada às Functions.
- Cadastro faz login automático em caso de sucesso.
- Login com Google usa Google Identity Services quando `VITE_GOOGLE_CLIENT_ID` está configurado.
- Token JWT salvo em `localStorage` com a chave `authToken`.
- Token enviado no header `Authorization: Bearer <token>` nas chamadas autenticadas.
- Logout remove `authToken` do `localStorage`.

## Desenvolvimento local (opcional)

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure env vars localmente (`NETLIFY_DATABASE_URL`, `JWT_SECRET`, `MIGRATE_ADMIN_KEY`, `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`).
3. Rode a aplicação:
   ```bash
   npm run dev
   ```
4. Para testar Functions localmente, prefira `netlify dev` se estiver usando Netlify CLI.

## Checklist de teste manual

- [ ] Chamar migrate com `x-admin-key` e confirmar `applied` no JSON.
- [ ] Registrar novo usuário com e-mail/senha.
- [ ] Confirmar login automático após cadastro.
- [ ] Fazer logout e login com as mesmas credenciais.
- [ ] Com `VITE_GOOGLE_CLIENT_ID` ausente, confirmar aviso de configuração no login.
- [ ] Com `VITE_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_ID` configurados, fazer login Google e receber token.
- [ ] Recarregar a página e confirmar persistência do usuário.
- [ ] Confirmar que usuário A não vê tarefas do usuário B.
