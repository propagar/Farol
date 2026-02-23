# Farol — Neon persistence + Auth + Tasks (MVP)

Este projeto agora usa **Netlify Functions** como camada backend para autenticação e persistência de tarefas no **Postgres (Neon)**.

## Arquitetura (segura)

- O frontend React **não acessa o banco diretamente**.
- Toda leitura/escrita em Postgres passa por `/.netlify/functions/*`.
- Segredos ficam apenas em variáveis de ambiente do Netlify.

## Estrutura adicionada

- `db/migrations/001_init.sql`
- `netlify/functions/migrate.js`
- `netlify/functions/auth-register.js`
- `netlify/functions/auth-login.js`
- `netlify/functions/tasks.js`
- `netlify/functions/_lib/db.js`
- `netlify/functions/_lib/auth.js`
- `netlify.toml`

## Variáveis de ambiente no Netlify

Além da variável já criada pelo Netlify DB:

- `NETLIFY_DATABASE_URL` (já existe)
- `NETLIFY_DATABASE_URL_UNPOOLED` (já existe, opcional para outros usos)

Configure também:

- `JWT_SECRET` (recomendada em produção, string longa e aleatória)
- `MIGRATE_ADMIN_KEY` (obrigatória em produção para rodar migração)

> Nunca commitar valores dessas variáveis no repositório.

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

### Tasks (protegido por Bearer token)

- `GET /.netlify/functions/tasks`
- `POST /.netlify/functions/tasks` body: `{ "title": "..." }`
- `PATCH /.netlify/functions/tasks` body: `{ "id": "...", "done": true|false }`
- `DELETE /.netlify/functions/tasks` body: `{ "id": "..." }`

Header:

```bash
Authorization: Bearer <token>
```


## Como validar se o usuário foi salvo no banco

Depois de concluir o cadastro com mensagem de sucesso, você pode validar de três formas:

1. **Checagem direta no Postgres (mais confiável)**
   ```sql
   SELECT id, email, created_at
   FROM users
   WHERE email = '<seu-email>'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **Pelo endpoint de login (valida leitura + senha)**
   ```bash
   curl -X POST "http://localhost:8888/.netlify/functions/auth-login" \
     -H "Content-Type: application/json" \
     -d '{"email":"<seu-email>","password":"<sua-senha>"}'
   ```
   Se estiver tudo certo, retorna `{ "token": "..." }`.

3. **Pelo endpoint de registro para o mesmo e-mail**
   Tentar registrar novamente o mesmo e-mail deve retornar `Email already registered` (HTTP 409).

## Frontend

- Tela de login/cadastro real conectada às Functions.
- Token JWT salvo em `localStorage`.
- Tarefas carregadas e persistidas no banco por usuário autenticado.
- Sem token, a aplicação redireciona para `/login`.

## Desenvolvimento local (opcional)

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure env vars localmente (`NETLIFY_DATABASE_URL`, `JWT_SECRET`, `MIGRATE_ADMIN_KEY`).
3. Rode a aplicação:
   ```bash
   npm run dev
   ```
4. Para testar Functions localmente, prefira `netlify dev` se estiver usando Netlify CLI.


## Troubleshooting de login

Se aparecer erro relacionado a `JWT_SECRET` no login:

- O backend usa `JWT_SECRET` quando disponível.
- Se `JWT_SECRET` não estiver definido, ele usa automaticamente um segredo estável derivado de `NETLIFY_DATABASE_URL`.
- Em produção, mantenha `JWT_SECRET` configurado explicitamente para melhor controle de segurança.
- Reinicie o processo de desenvolvimento/deploy após configurar a variável.

Exemplo de geração de segredo local:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Checklist de teste manual

- [ ] Chamar migrate com `x-admin-key` e confirmar `applied` no JSON.
- [ ] Registrar novo usuário.
- [ ] Fazer login e receber token.
- [ ] Criar tarefas e atualizar status (`done`) por usuário.
- [ ] Recarregar a página e confirmar persistência do usuário.
- [ ] Confirmar que usuário A não vê tarefas do usuário B.
