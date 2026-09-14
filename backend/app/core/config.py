from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SaaS Vertical"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # DB configuration
    DATABASE_URL: str = "postgresql://sasadmin:saspassword@127.0.0.1:5433/sas_vertical"
    
    # Connection Pool Settings (Punto 3 - Parametrización del Estanque de Conexiones)
    DB_POOL_SIZE: int = 10         # Conexiones persistentes mantenidas en el pool
    DB_MAX_OVERFLOW: int = 20      # Conexiones adicionales permitidas durante picos de tráfico
    DB_POOL_TIMEOUT: int = 30      # Segundos de espera para obtener una conexión antes de lanzar error
    DB_POOL_RECYCLE: int = 1800    # Reciclar conexiones cada 30 minutos (evita sockets muertos)
    DB_POOL_PRE_PING: bool = True  # Valida vida de conexión antes de checkout (evita stale connections)

    # ML configuration
    MODELS_DIR: str = "ml_models"

    # JWT Authentication
    JWT_SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION-use-openssl-rand-hex-32"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Brute-force protection
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_MINUTES: int = 15
    
    # Token Blacklist
    BLACKLIST_CACHE_MAXSIZE: int = 10000

    # Factus API V2 Configuration (Facturación Electrónica DIAN)
    FACTUS_API_URL: str = "https://api-sandbox.factus.com.co"
    FACTUS_CLIENT_ID: str = "a27ef8e6-42a6-4142-b4d0-517cef89549b"
    FACTUS_CLIENT_SECRET: str = "X2VPoqNvKr4RahYgo8oslkMaVpofWVu6CbShEi8n"
    FACTUS_USERNAME: str = "sandboxv2@factus.com.co"
    FACTUS_PASSWORD: str = "sandbox2026%"
    FACTUS_NUMBERING_RANGE_ID: int = 389
    FACTUS_ENVIRONMENT: str = "sandbox"  # "sandbox", "production", or "simulation"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
