from sqlmodel import create_engine, SQLModel, Session
from sqlalchemy import event, text
from app.core.config import settings

# Punto 3: Parametrización del Estanque de Conexiones
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=settings.DB_POOL_RECYCLE,
    pool_pre_ping=settings.DB_POOL_PRE_PING,
)

# Punto 1: Prevención de Race Conditions y Contaminación del Connection Pool
@event.listens_for(engine, "checkin")
def reset_search_path_on_checkin(dbapi_connection, connection_record):
    """
    Hook de Seguridad de SQLAlchemy Engine:
    Cada vez que una conexión de base de datos finaliza su uso y regresa al pool (checkin),
    se ejecuta de forma garantizada rollback + `RESET search_path` + commit.
    Esto restablece el estado de la conexión a limpio y previene que la siguiente
    petición HTTP asíncrona reciba una conexión contaminada con el schema de otro tenant.
    """
    if dbapi_connection is not None:
        try:
            # 1. Rollback de cualquier transacción pendiente en la conexión DBAPI
            dbapi_connection.rollback()
            # 2. Resetear el search_path al estado por defecto (public)
            cursor = dbapi_connection.cursor()
            cursor.execute("RESET search_path;")
            cursor.close()
            dbapi_connection.commit()
        except Exception:
            pass

def get_session():
    """
    Generador de sesión por petición HTTP.
    - `expire_on_commit=False` evita consultas SELECT extra tras commit.
    - El bloque `finally` asegura que el search_path se limpie en caso de excepciones.
    """
    with Session(engine, expire_on_commit=False) as session:
        try:
            yield session
        finally:
            try:
                session.execute(text("RESET search_path"))
            except Exception:
                pass
