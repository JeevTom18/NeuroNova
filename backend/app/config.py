import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./data/pipeline.db")
    AWS_REGION: str = Field(default="us-east-1")
    AWS_ACCESS_KEY_ID: str = Field(default="")
    AWS_SECRET_ACCESS_KEY: str = Field(default="")
    S3_BUCKET_NAME: str = Field(default="")
    API_HOST: str = Field(default="0.0.0.0")
    API_PORT: int = Field(default=8000)
    ENVIRONMENT: str = Field(default="development")
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173")

    # Lowercase property aliases for compatibility with tests
    @property
    def s3_bucket_name(self) -> str:
        return self.S3_BUCKET_NAME

    @s3_bucket_name.setter
    def s3_bucket_name(self, value: str):
        self.S3_BUCKET_NAME = value

    @property
    def aws_region(self) -> str:
        return self.AWS_REGION

    @aws_region.setter
    def aws_region(self, value: str):
        self.AWS_REGION = value

    @property
    def aws_access_key_id(self) -> str:
        return self.AWS_ACCESS_KEY_ID

    @aws_access_key_id.setter
    def aws_access_key_id(self, value: str):
        self.AWS_ACCESS_KEY_ID = value

    @property
    def aws_secret_access_key(self) -> str:
        return self.AWS_SECRET_ACCESS_KEY

    @aws_secret_access_key.setter
    def aws_secret_access_key(self, value: str):
        self.AWS_SECRET_ACCESS_KEY = value

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def has_s3_credentials(self) -> bool:
        return bool(self.S3_BUCKET_NAME and (self.AWS_ACCESS_KEY_ID or os.getenv("AWS_ROLE_ARN")))

settings = Settings()
