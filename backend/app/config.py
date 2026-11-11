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