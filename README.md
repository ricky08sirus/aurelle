# Aurelle Backend

FastAPI backend for user registration and login, using Supabase PostgreSQL for storage and database-backed sessions (no Redis, no Docker required). Product images are stored in Cloudflare R2 and served through a public URL.

## Features

- Registration with name, email, phone number and password
- Login with email and password
- Session cookie (`HttpOnly`, `SameSite=Lax`) with a 7-day lifetime
- Logout that deletes the session on the server
- Password hashing with Argon2, run in a thread pool so it never blocks the event loop
- Session tokens stored as SHA-256 hashes, so a leaked database cannot be used to hijack sessions
- Async database access (SQLAlchemy 2 + asyncpg) with a small connection pool
- Image upload, replace, delete and list endpoints on Cloudflare R2 (login required)
- Uploads are checked by real file contents (JPEG, PNG, WEBP, GIF only) and limited to 5 MB

## Tech stack

| Part | Choice |
|---|---|
| Framework | FastAPI |
| Server | Uvicorn |
| Database | Supabase PostgreSQL (Session pooler) |
| ORM | SQLAlchemy (async) with asyncpg |
| Password hashing | argon2-cffi |
| Settings | pydantic-settings (`.env`) |
| Image storage | Cloudflare R2 (S3-compatible, accessed with boto3) |
| File uploads | python-multipart |

## Project structure

```
backend/
  .env                 # your secrets (not committed)
  .env.example         # safe template (committed)
  requirements.txt
  README.md
  check-db.py          # checks the database connection
  check_env.py         # checks database + R2 upload, public URL and delete
  app/
    __init__.py
    main.py            # app entry point, health check, router registration
    config.py          # reads settings from .env
    db.py              # async engine and session
    models.py          # User and UserSession tables
    schemas.py         # request validation
    security.py        # Argon2 hashing helpers
    sessions.py        # create, look up, delete sessions
    deps.py            # get_current_user dependency
    storage.py         # Cloudflare R2 client, validation, upload and delete helpers
    routers/
      __init__.py
      auth.py          # /auth endpoints
      images.py        # /images endpoints (R2)
```

## Prerequisites

- Python 3.11 or newer
- A free Supabase account and project
- A Cloudflare account with R2 enabled
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
pip install fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" asyncpg argon2-cffi pydantic-settings email-validator boto3 python-multipart python-dotenv
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
3. Copy `.env.example` to `.env` and fill it in (the R2 values are added in the next section):
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

### 5. Set up Cloudflare R2 (image storage)

**Create the bucket**

1. In the Cloudflare dashboard, open **R2 Object Storage** and click **Create bucket**.
2. Name it (this project uses `aurelle-images`) and create it.

**Create an API token**

1. On the **R2 Object Storage** page, open **API Tokens** and click **Create Account API token**.
2. Set the permission to **Object Read & Write** and apply it to the `aurelle-images` bucket only.
3. Copy the **Access Key ID** and **Secret Access Key**. The secret is shown only once.
4. Your **Account ID** is shown on the R2 overview page and in the dashboard URL after `dash.cloudflare.com/`.

**Enable the public URL**

1. Open the bucket, then the **Settings** tab.
2. Under **Public access**, find **R2.dev subdomain** and click **Enable**. Type `allow` to confirm.
3. Copy the **Public R2.dev Bucket URL**. It looks like `https://pub-<long-hash>.r2.dev`.

The `r2.dev` URL is rate-limited and meant for development and testing. For production, connect a custom domain such as `images.yourdomain.com` under **Custom Domains** on the same Settings tab. This also gives you Cloudflare caching.

**Add the values to `.env`**

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET=aurelle-images
R2_PUBLIC_BASE_URL=https://pub-your-hash.r2.dev
```

Use no quotes and no trailing slash on `R2_PUBLIC_BASE_URL`.

**Add the fields to `app/config.py`**

pydantic-settings rejects unknown `.env` keys, so the app will not start unless `Settings` declares the R2 fields:

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    cookie_secure: bool = False  # set true in production (HTTPS)

    # Cloudflare R2
    r2_account_id: str
    r2_access_key_id: str
    r2_secret_access_key: str
    r2_bucket: str
    r2_public_base_url: str

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
```

**Register the router in `app/main.py`**

```python
from app.routers import auth, images

app = FastAPI()
app.include_router(auth.router)
app.include_router(images.router)
```

**Verify the configuration**

`check_env.py` checks the database connection, uploads a test file to R2, fetches it through the public URL, and deletes it:

```powershell
python check_env.py
```

Every line should start with `[ OK ]`.

### 6. Run the server

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
| POST | `/images` | Cookie | Upload an image to R2 |
| PUT | `/images/{key}` | Cookie | Replace an image |
| DELETE | `/images/{key}` | Cookie | Delete an image |
| GET | `/images` | Cookie | List images |

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

### Upload an image

`POST /images?folder=products` with a multipart form field named `file`.

- `folder`: optional, lowercase letters, digits, `_` and `-`, up to 40 characters (default `general`)
- Allowed types: JPEG, PNG, WEBP, GIF (checked by file contents, not just the header)
- Maximum size: 5 MB
- Returns `201`:

```json
{
  "key": "images/products/3f9a...c1.jpg",
  "url": "https://pub-your-hash.r2.dev/images/products/3f9a...c1.jpg",
  "size": 48213,
  "content_type": "image/jpeg"
}
```

- Returns `401` if not logged in, `413` if the file is too large, `415` for an unsupported type, `502` if R2 rejects the request

Store the `key` in your database, not the full URL. If you later move to a custom domain, only `R2_PUBLIC_BASE_URL` changes.

### Replace an image

`PUT /images/{key}` with a multipart form field named `file`.

- The new file is uploaded under a new key, then the old file is deleted. A new key avoids stale copies in browser and Cloudflare caches.
- Returns `200` with `old_key`, `key`, `url`, `size`, `content_type`. Update the key saved in your database with the new `key`.
- Returns `404` if the old key does not exist

### Delete an image

`DELETE /images/{key}` returns `204`, or `404` if the key does not exist.

### List images

`GET /images?folder=products&limit=50` returns `items` (each with `key`, `url`, `size`, `modified`) and `next_cursor`. Pass `next_cursor` back as `cursor` to get the next page.

The `{key}` in the URL is the full key returned by upload, for example `images/products/3f9a...c1.jpg`, so the path reads `/images/images/products/3f9a...c1.jpg`. That is correct.

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

### Testing the image endpoints with curl

Use `curl.exe`, not `curl`, because `curl` is an alias for `Invoke-WebRequest` in PowerShell. Run these from one folder so `cookies.txt` is found.

```powershell
# 1. Log in and save the session cookie (JSON body kept in a file to avoid quoting problems)
Set-Content -Path login.json -Value '{"email":"asha@example.com","password":"Test@12345"}'
curl.exe -i -c cookies.txt -X POST "http://127.0.0.1:8000/auth/login" -H "Content-Type: application/json" -d "@login.json"

# 2. Upload (copy the "key" from the response)
curl.exe -i -b cookies.txt -F "file=@C:\Users\pc\Downloads\image.jpg" "http://127.0.0.1:8000/images?folder=products"

# 3. Check the public URL (expect 200 and content-type: image/jpeg)
curl.exe -I "https://pub-your-hash.r2.dev/images/products/KEY.jpg"

# 4. Replace (expect 200 and a new key; the old URL now returns 404)
curl.exe -i -b cookies.txt -X PUT -F "file=@C:\Users\pc\Downloads\other.jpg" "http://127.0.0.1:8000/images/images/products/KEY.jpg"

# 5. Delete (expect 204; the URL now returns 404)
curl.exe -i -b cookies.txt -X DELETE "http://127.0.0.1:8000/images/images/products/NEW_KEY.jpg"

# 6. List
curl.exe -b cookies.txt "http://127.0.0.1:8000/images?folder=products"
```

Expected results:

| Test | Expected |
|---|---|
| Upload a JPG while logged in | `201` with key and url, and the url opens the image |
| Upload without the cookie | `401` |
| Upload a text file renamed to `.jpg` | `415` |
| Upload a file over 5 MB | `413` |
| Replace | `200`, new key, old url returns `404` |
| Delete | `204`, url returns `404` |
| Delete a key that does not exist | `404` |

## How sessions work

1. On login, the server creates a random token and stores only its SHA-256 hash in the `sessions` table, along with the user id and an expiry time.
2. The raw token is sent to the browser in an `HttpOnly` cookie named `session_id`.
3. On each request, the server hashes the cookie value and looks it up (one indexed query joined with the user).
4. Logout deletes the row, so the session stops working immediately.
5. Expired sessions for a user are removed whenever that user logs in again.

## How image storage works

1. The client sends an image to `POST /images` with the session cookie.
2. The server checks the login, reads the file (at most 5 MB), and verifies the real file type from its first bytes.
3. The file is stored in the R2 bucket under a random key such as `images/products/<32 hex characters>.jpg`, with a long cache header, because keys are never overwritten.
4. The server returns the key and the public URL. The browser loads images directly from Cloudflare, so image traffic does not pass through this server.
5. Editing replaces the file under a new key and deletes the old one. Deleting removes the object from the bucket.

Only keys generated by this server are accepted by the replace and delete endpoints, which prevents path tricks such as `..`.

## Performance notes

- Keep the FastAPI server in the same region as the Supabase project. Every query pays the network distance.
- Argon2 hashing is slow on purpose (about 100 to 300 ms). It runs in a thread pool so other requests are not blocked.
- The connection pool is small (5 plus 5 overflow) to stay within Supabase's connection limits.
- Free Supabase projects pause after a period of inactivity. Use an always-on plan for production so the first login does not wait for the database to wake.
- boto3 is synchronous, so all R2 calls run in a thread pool (`asyncio.to_thread`) and do not block the event loop.

## Security checklist

- Never commit `.env`. It is listed in `.gitignore`.
- Reset the database password and roll the R2 API token if either was ever shared, pasted in chat, printed in logs, or committed.
- Give the R2 token only **Object Read & Write** on the one bucket it needs.
- Set `COOKIE_SECURE=true` when serving over HTTPS.
- Do not put Supabase `anon` or `service_role` keys in a frontend for these tables.
- Never put the R2 secret key in frontend code. Uploads go through this backend.
- Do not log passwords or full request bodies.
- Any logged-in user can currently replace or delete any image. Before going live, add an `images` table with an `owner_id` and check ownership in the replace and delete endpoints.
- If the frontend runs on a different origin, add `CORSMiddleware` and review the cookie `SameSite` setting, since POST, PUT and DELETE use a cookie session.

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
| Startup error `Extra inputs are not permitted` for `r2_...` | The R2 fields are missing from `Settings` in `app/config.py`. Add them (see step 5). |
| `KeyError: 'R2_BUCKET'` (or another R2 name) on startup | The key is missing from `.env`, or the file is not in the `backend` folder. |
| `RuntimeError: Form data requires "python-multipart"` | Run `pip install python-multipart`. |
| `ModuleNotFoundError: boto3` | Run `pip install boto3` inside the activated virtual environment. |
| Upload returns `502` with `SignatureDoesNotMatch` or `InvalidAccessKeyId` | The R2 access key ID or secret is wrong, or the token was rolled. Update `.env` and restart. |
| Upload returns `502` with `AccessDenied` | The token does not have Object Read & Write on this bucket. |
| Upload returns `502` with `NoSuchBucket` | `R2_BUCKET` does not match the bucket name, or `R2_ACCOUNT_ID` is wrong. |
| Upload returns `201` but the image URL gives `403` or `404` | The R2.dev subdomain is not enabled on the bucket, or `R2_PUBLIC_BASE_URL` is wrong or has a trailing slash. |
| Upload returns `415` for a real image | The file is not JPEG, PNG, WEBP or GIF (for example HEIC or AVIF). Convert it first. |
| Upload returns `401` in curl | The cookie was not sent. Use `-b cookies.txt` and run from the folder that contains it. |