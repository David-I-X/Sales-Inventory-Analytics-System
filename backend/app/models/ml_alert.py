from sqlmodel import SQLModel, Field, Column
from sqlalchemy import JSON
from typing import Optional, Dict, Any
from datetime import datetime

class MlAlert(SQLModel, table=True):
    """
    Representa una alerta de Machine Learning traducida a lenguaje natural.
    Se almacena en el schema aislado del tenant ({tenant_schema}.ml_alerts).
    """
    __tablename__ = "ml_alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    alert_type: str = Field(index=True) # e.g. 'hot_lead', 'demand_forecast', 'price_suggestion', 'restock'
    message: str # Frase traducida a lenguaje natural para el empresario
    data: Dict[str, Any] = Field(default={}, sa_column=Column(JSON)) # Scores numéricos, IDs, probabilidades
    is_read: bool = Field(default=False, index=True)
    generated_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class MlModelRegistry(SQLModel, table=True):
    """
    Registro y auditoría de modelos entrenados por tenant ({tenant_schema}.ml_model_registry).
    Permite rastrear versiones de modelos .pkl y métricas de desempeño.
    """
    __tablename__ = "ml_model_registry"

    id: Optional[int] = Field(default=None, primary_key=True)
    model_name: str = Field(index=True) # e.g. 'lead_scoring_xgboost', 'demand_forecast_ridge'
    version: str # e.g. 'v1.0.20260810'
    file_path: str # Ruta al archivo .pkl guardado en disco
    metrics: Dict[str, Any] = Field(default={}, sa_column=Column(JSON)) # e.g. {"roc_auc": 0.89, "rmse": 4.12}
    status: str = Field(default="active", index=True) # 'active' | 'archived'
    trained_at: datetime = Field(default_factory=datetime.utcnow)
