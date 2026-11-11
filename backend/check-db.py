"""
Checks that your .env works: Supabase Postgres + Cloudflare R2 (upload, public URL, delete).

Install once:
    pip install python-dotenv boto3 sqlalchemy asyncpg

Run from the folder that contains your .env:
    python check_env.py
"""
import asyncio
import os
import sys
import time
import urllib.error
import urllib.request

from dotenv import load_dotenv

load_dotenv()

OK = "[ OK ]"
FAIL = "[FAIL]"
results = []


def report(name, ok, detail=""):
    results.append(ok)
    print(f"{OK if ok else FAIL} {name}" + (f" -> {detail}" if detail else ""))


# 1. Required variables present
REQUIRED = [
    "DATABASE_URL",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "R2_PUBLIC_BASE_URL",
]
missing = [k for k in REQUIRED if not os.getenv(k)]
report("All env variables set", not missing, f"missing: {missing}" if missing else "")
if missing:
    sys.exit(1)

# 2. Database
async def check_db():
    from sqlalchemy import text
    from sqlalchemy.ext.asyncio import create_async_engine

    engine = create_async_engine(os.environ["DATABASE_URL"])
    try:
        async with engine.connect() as conn:
            row = (await conn.execute(text("select version()"))).scalar()
        report("Database connection", True, row.split(",")[0])
    except Exception as e:
        report("Database connection", False, f"{type(e).__name__}: {e}")
    finally:
        await engine.dispose()


asyncio.run(check_db())

# 3. R2
import boto3
from botocore.config import Config

bucket = os.environ["R2_BUCKET"]
public_base = os.environ["R2_PUBLIC_BASE_URL"].rstrip("/")

if public_base.endswith("xxxxxxxx.r2.dev") or "xxxx" in public_base:
    report("R2_PUBLIC_BASE_URL is a real value", False, "still a placeholder")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

key = f"healthcheck/test-{int(time.time())}.txt"
body = b"aurelle r2 healthcheck"

uploaded = False
try:
    s3.put_object(Bucket=bucket, Key=key, Body=body, ContentType="text/plain")
    uploaded = True
    report("R2 upload (credentials + bucket name)", True, key)
except Exception as e:
    report("R2 upload (credentials + bucket name)", False, f"{type(e).__name__}: {e}")

if uploaded:
    url = f"{public_base}/{key}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
        report("Public URL serves the file", data == body, url)
    except urllib.error.HTTPError as e:
        hint = " (r2.dev access not enabled, or wrong URL)" if e.code in (401, 403, 404) else ""
        report("Public URL serves the file", False, f"HTTP {e.code}{hint} {url}")
    except Exception as e:
        report("Public URL serves the file", False, f"{type(e).__name__}: {e}")

    try:
        s3.delete_object(Bucket=bucket, Key=key)
        report("R2 delete test file", True)
    except Exception as e:
        report("R2 delete test file", False, f"{type(e).__name__}: {e}")

print()
print("ALL GOOD" if all(results) else "SOME CHECKS FAILED - see above")
sys.exit(0 if all(results) else 1)