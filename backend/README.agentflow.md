# AgentFlow Backend

NestJS + TypeScript backend for AgentFlow.

## Setup

```bash
cd Backend
npm install
copy .env.example .env
docker compose up -d
npm run start:dev
```

The API runs at:

```text
http://localhost:3000/api
```

## Login API

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin123@gmail.com",
  "password": "12345678"
}
```

Successful response:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin123@gmail.com",
    "role": "admin"
  }
}
```

Seeded users:

```text
Admin: admin123@gmail.com / 12345678
Master Admin: madmin@gmail.com / 87654321
```

## PostgreSQL

PostgreSQL connection settings are in `.env`.

For local development, `docker-compose.yml` starts a PostgreSQL database named `agentflow`.

`DB_SYNC=true` is convenient for local development. Set it to `false` before production and use migrations.
