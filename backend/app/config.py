from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    cookie_secure: bool = False  # set true in production (HTTPS)

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()