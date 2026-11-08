# Aurelle Backend

FastAPI backend for user registration and login, using Supabase PostgreSQL for storage and database-backed sessions (no Redis, no Docker required).

## Features

- Registration with name, email, phone number and password
- Login with email and password
- Session cookie (`HttpOnly`, `SameSite=Lax`) with a 7-day lifetime
- Logout that deletes the session on the server
- Password hashing with Argon2, run in a thread pool so it never blocks the event loop
- Session tokens stored as SHA-256 hashes, so a leaked database cannot be used to hijack sessions
- Async database access (SQLAlchemy 2 + asyncpg) with a small connection pool

## Tech stack

| Part | Choice |
|---|---|
| Framework | FastAPI |
| Server | Uvicorn |
| Database | Supabase PostgreSQL (Session pooler) |
| ORM | SQLAlchemy (async) with asyncpg |
| Password hashing | argon2-cffi |
| Settings | pydantic-settings (`.env`) |

## Project structure

```
backend/
  .env                 # your secrets (not committed)
  .env.example         # safe template (committed)
  requirements.txt
  README.md
  app/
    __init__.py
    main.py            # app entry point, health check
    config.py          # reads settings from .env
    db.py              # async engine and session
    models.py          # User and UserSession tables
    schemas.py         # request validation
    security.py        # Argon2 hashing helpers
    sessions.py        # create, look up, delete sessions
    deps.py            # get_current_user dependency
    routers/
      __init__.py
      auth.py          # /auth endpoints
```

## Prerequisites

- Python 3.11 or newer
- A free Supabase account and project
- Git (optional, for version control)

## Setup

The commands below are for Windows PowerShell. On macOS or Linux, activate the environment with `source myvenv/bin/activate` instead.

### 1. Create and activate a virtual environment

From the `backend` folder:

```powershell
python -m venv myvenv
myvenv\Scripts\Activate.ps1
```

If PowerShell blocks the activation script, run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### 2. Install dependencies

```powershell
pip install -r requirements.txt
```

If you are starting from scratch, install the packages directly and then save them:

```powershell
pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" asyncpg argon2-cffi pydantic-settings email-validator
pip freeze > requirements.txt
```

### 3. Create the database tables

In the Supabase dashboard, open **SQL Editor** and run:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table sessions (
  id text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index sessions_user_id_idx on sessions (user_id);
create index sessions_expires_at_idx on sessions (expires_at);

alter table users enable row level security;
alter table sessions enable row level security;
```

Row level security is enabled so that Supabase's public API cannot read these tables. The backend connects directly to Postgres, so it is not affected.

### 4. Configure the database connection

1. In Supabase, click **Connect**, open the **Direct** tab, and choose **Session pooler** as the method (type: URI). Do not use the plain direct connection, which is IPv6-only.
2. Copy the connection string. It looks like:
   ```
   postgresql://postgres.YOURPROJECTREF:[YOUR-PASSWORD]@aws-0-REGION.pooler.supabase.com:5432/postgres
   ```
3. Copy `.env.example` to `.env` and fill it in:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres.YOURPROJECTREF:YOURPASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
   COOKIE_SECURE=false
   ```

Rules for the connection string:

- It must start with `postgresql+asyncpg://` (add `+asyncpg`).
- Replace `[YOUR-PASSWORD]` with the real password and remove the square brackets.
- Keep it on one line, with no spaces or quotes.
- **Use a password with only letters and numbers.** Special characters break the URL. If you must keep one, URL-encode it (`@` becomes `%40`, `#` becomes `%23`, `/` becomes `%2F`, `:` becomes `%3A`).

Check that the host was read correctly (it must print only the pooler host, with nothing in front of `aws-0`):

```powershell
python -c "from app.config import settings; from sqlalchemy.engine import make_url; print(make_url(settings.database_url).host)"
```

Set `COOKIE_SECURE=true` in production (HTTPS). Keep it `false` for local `http://` development, otherwise the browser will not store the cookie.

### 5. Run the server

From the `backend` folder:

```powershell
uvicorn app.main:app --reload
```

Open:

- API docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health/db (should return `{"db": "ok"}`)

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Hello world |
| GET | `/health/db` | No | Checks the database connection |
| POST | `/auth/register` | No | Create an account |
| POST | `/auth/login` | No | Log in and set the session cookie |
| GET | `/auth/me` | Cookie | Return the current user |
| POST | `/auth/logout` | Cookie | Delete the session and clear the cookie |

### Register

`POST /auth/register`

```json
{
  "name": "Asha Rao",
  "email": "asha@example.com",
  "phone": "+919876543210",
  "password": "Test@12345"
}
```

- `name`: 2 to 100 characters
- `phone`: must start with `+` and the country code, 10 to 15 digits in total
- `password`: 8 to 128 characters
- Returns `201` with `id`, `name`, `email`
- Returns `409` if the email or phone is already registered
- Returns `422` if validation fails

### Login

`POST /auth/login`

```json
{
  "email": "asha@example.com",
  "password": "Test@12345"
}
```

- Returns `200` with `id`, `name`, `email`, and sets the `session_id` cookie
- Returns `401` with `Invalid email or password` for any wrong credentials (the response does not reveal whether the email exists)

### Current user

`GET /auth/me` returns `id`, `name`, `email`, `phone`. Returns `401` if there is no cookie or the session has expired.

### Logout

`POST /auth/logout` deletes the session row and clears the cookie.

## Testing in PowerShell

Run these in a second terminal while the server is running. Steps 2 to 4 must be in the same window, because the cookie is kept in `$s`.

```powershell
# 1. Register
$reg = @{ name="Asha Rao"; email="asha@example.com"; phone="+919876543210"; password="Test@12345" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/auth/register -ContentType "application/json" -Body $reg

# 2. Login (saves the cookie in $s)
$login = @{ email="asha@example.com"; password="Test@12345" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/auth/login -ContentType "application/json" -Body $login -SessionVariable s

# 3. Current user
Invoke-RestMethod -Uri http://127.0.0.1:8000/auth/me -WebSession $s

# 4. Logout, then confirm access is refused (expect a 401 error)
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8000/auth/logout -WebSession $s
Invoke-RestMethod -Uri http://127.0.0.1:8000/auth/me -WebSession $s
```

Expected results:

| Test | Expected |
|---|---|
| Register | `201` with id, name, email |
| Register the same email or phone again | `409` |
| Register with `phone` missing the `+` country code | `422` |
| Login with a wrong password | `401` |
| `/auth/me` after logout | `401` |

You can also test everything interactively at http://127.0.0.1:8000/docs.

## How sessions work

1. On login, the server creates a random token and stores only its SHA-256 hash in the `sessions` table, along with the user id and an expiry time.
2. The raw token is sent to the browser in an `HttpOnly` cookie named `session_id`.
3. On each request, the server hashes the cookie value and looks it up (one indexed query joined with the user).
4. Logout deletes the row, so the session stops working immediately.
5. Expired sessions for a user are removed whenever that user logs in again.

## Performance notes

- Keep the FastAPI server in the same region as the Supabase project. Every query pays the network distance.
- Argon2 hashing is slow on purpose (about 100 to 300 ms). It runs in a thread pool so other requests are not blocked.
- The connection pool is small (5 plus 5 overflow) to stay within Supabase's connection limits.
- Free Supabase projects pause after a period of inactivity. Use an always-on plan for production so the first login does not wait for the database to wake.

## Security checklist

- Never commit `.env`. It is listed in `.gitignore`.
- Reset the database password if it was ever shared, pasted in chat, or committed.
- Set `COOKIE_SECURE=true` when serving over HTTPS.
- Do not put Supabase `anon` or `service_role` keys in a frontend for these tables.
- Do not log passwords or full request bodies.

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| `getaddrinfo failed` / host name not found | The password contains `@` or another special character, or you used the IPv6-only direct connection. Use the Session pooler string and a letters-and-numbers password. |
| Host prints with extra text before `aws-0` | Same cause: a special character in the password. Reset it or URL-encode it. |
| `.env` changes are ignored | Restart uvicorn fully. Also check that `DATABASE_URL` is not set in your terminal or Windows environment variables (`Remove-Item Env:DATABASE_URL`). |
| `password authentication failed` | Wrong password, or the username is missing the `postgres.PROJECTREF` format. |
| `relation "users" does not exist` | The SQL in step 3 was not run. |
| `ModuleNotFoundError: app` | Run `uvicorn` from the `backend` folder, and check `app/__init__.py` exists. |
| `/auth/me` returns 401 right after login | Make sure `COOKIE_SECURE=false` locally, and that you are reusing the same session (`-WebSession $s`). |
| PowerShell `curl` flags fail | In PowerShell `curl` is an alias. Use `Invoke-RestMethod` or `curl.exe`. |

