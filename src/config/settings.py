"""
Configurações centralizadas do Promo Bot
"""
from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Configurações carregadas de variáveis de ambiente"""
    
    # Telegram
    telegram_bot_token: str = Field(..., description="Token do bot Telegram")
    telegram_channel_id: str = Field(..., description="ID do canal ou @username")
    telegram_admin_id: str = Field(default="", description="ID do admin para aprovação")
    
    # Amazon
    amazon_access_key: str = Field(default="", description="Amazon PA API Access Key")
    amazon_secret_key: str = Field(default="", description="Amazon PA API Secret Key")
    amazon_partner_tag: str = Field(default="", description="Amazon Associates Tag")
    amazon_region: str = Field(default="BR", description="Região Amazon")
    
    # Shopee
    shopee_app_id: str = Field(default="", description="Shopee App ID")
    shopee_app_secret: str = Field(default="", description="Shopee App Secret")
    
    # Mercado Livre
    ml_client_id: str = Field(default="", description="ML Client ID")
    ml_client_secret: str = Field(default="", description="ML Client Secret")
    ml_affiliate_id: str = Field(default="", description="ML Affiliate ID")
    
    # Filtros
    min_discount: int = Field(default=30, description="Desconto mínimo em %")
    min_rating: float = Field(default=4.0, description="Avaliação mínima")
    max_price: float = Field(default=500.0, description="Preço máximo em R$")
    categories: List[str] = Field(
        default=["electronics", "home", "kitchen", "toys"],
        description="Categorias permitidas"
    )
    
    # Scheduler
    posts_per_hour: int = Field(default=5, description="Posts por hora")
    peak_hours: List[int] = Field(
        default=[12, 13, 19, 20, 21],
        description="Horários de pico"
    )
    peak_multiplier: int = Field(default=2, description="Multiplicador nos horários de pico")
    queue_interval_minutes: int = Field(default=20, description="Intervalo entre posts da fila de aprovação")
    
    # Redis
    redis_host: str = Field(default="redis", description="Host do Redis")
    redis_port: int = Field(default=6379, description="Porta do Redis")
    
    # Logs
    log_level: str = Field(default="INFO", description="Nível de log")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"
    
    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}"

    @classmethod
    def load(cls):
        """Carrega configurações com override de arquivo JSON se existir"""
        import json
        import os
        from loguru import logger
        
        # 1. Carrega do .env e variáveis de ambiente
        instance = cls()
        
        # 2. Tenta carregar override do JSON (persistência da UI)
        config_path = "/app/data/config.json"
        
        # Em ambiente local sem Docker, tenta caminho relativo
        if not os.path.exists("/app/data"):
            config_path = "data/config.json"
            
        if os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    data = json.load(f)
                
                # Atualiza campos
                updated = False
                for key, value in data.items():
                    if hasattr(instance, key) and value: # Só atualiza se tiver valor
                        setattr(instance, key, value)
                        updated = True
                
                if updated:
                    logger.info(f"Configurações carregadas de {config_path}")
                    
            except Exception as e:
                logger.error(f"Erro ao carregar {config_path}: {e}")
                
        return instance


# Singleton com carregamento dinâmico
settings = Settings.load()
