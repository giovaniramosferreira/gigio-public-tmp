"""
Modelos de dados para promoções
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum


class Platform(Enum):
    """Plataformas suportadas"""
    AMAZON = "amazon"
    SHOPEE = "shopee"
    MERCADOLIVRE = "mercadolivre"
    OTHER = "other"


@dataclass
class Promotion:
    """Representa uma promoção encontrada"""
    
    # Identificação
    id: str
    platform: Platform
    url: str
    affiliate_url: str
    
    # Produto
    title: str
    image_url: Optional[str] = None
    category: str = ""
    
    # Preços
    original_price: float = 0.0
    current_price: float = 0.0
    
    # Métricas
    rating: float = 0.0
    review_count: int = 0
    
    # Metadata
    created_at: datetime = field(default_factory=datetime.now)
    expires_at: Optional[datetime] = None
    
    @property
    def discount_percent(self) -> int:
        """Calcula o percentual de desconto"""
        if self.original_price <= 0:
            return 0
        discount = ((self.original_price - self.current_price) / self.original_price) * 100
        return int(discount)
    
    @property
    def savings(self) -> float:
        """Valor economizado"""
        return self.original_price - self.current_price
    
    @property
    def platform_emoji(self) -> str:
        """Emoji da plataforma"""
        emojis = {
            Platform.AMAZON: "📦",
            Platform.SHOPEE: "🛍️",
            Platform.MERCADOLIVRE: "🤝"
        }
        return emojis.get(self.platform, "🛒")
    
    @property
    def platform_name(self) -> str:
        """Nome legível da plataforma"""
        names = {
            Platform.AMAZON: "Amazon",
            Platform.SHOPEE: "Shopee",
            Platform.MERCADOLIVRE: "Mercado Livre"
        }
        return names.get(self.platform, "Loja")
    
    def to_dict(self) -> dict:
        """Converte para dicionário"""
        return {
            "id": self.id,
            "platform": self.platform.value,
            "url": self.url,
            "affiliate_url": self.affiliate_url,
            "title": self.title,
            "image_url": self.image_url,
            "category": self.category,
            "original_price": self.original_price,
            "current_price": self.current_price,
            "discount_percent": self.discount_percent,
            "rating": self.rating,
            "review_count": self.review_count,
            "created_at": self.created_at.isoformat(),
        }
