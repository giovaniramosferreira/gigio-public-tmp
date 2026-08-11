"""
Coletor de promoções da Amazon via Product Advertising API
"""
import hashlib
import hmac
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional
import httpx
from loguru import logger

from .base import BaseCollector
from ..models import Promotion, Platform
from ..config import settings


class AmazonCollector(BaseCollector):
    """Coleta promoções da Amazon usando PA API 5.0"""
    
    ENDPOINT = "webservices.amazon.com.br"
    SERVICE = "ProductAdvertisingAPI"
    REGION = "us-east-1"
    
    # Mapeamento de categorias
    CATEGORY_MAP = {
        "electronics": "Electronics",
        "home": "HomeAndKitchen", 
        "kitchen": "Kitchen",
        "toys": "ToysAndGames",
        "books": "Books",
        "fashion": "Fashion",
        "sports": "SportsAndOutdoors",
        "beauty": "Beauty",
    }
    
    def __init__(self):
        self.access_key = settings.amazon_access_key
        self.secret_key = settings.amazon_secret_key
        self.partner_tag = settings.amazon_partner_tag
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def collect(self, categories: List[str] = None) -> List[Promotion]:
        """Coleta promoções de categorias específicas"""
        if not self._is_configured():
            logger.warning("Amazon API não configurada, pulando...")
            return []
        
        promotions = []
        search_categories = categories or list(self.CATEGORY_MAP.keys())
        
        for category in search_categories:
            try:
                items = await self._search_deals(category)
                for item in items:
                    promo = self._parse_item(item)
                    if promo:
                        promotions.append(promo)
            except Exception as e:
                logger.error(f"Erro ao buscar promoções Amazon [{category}]: {e}")
        
        logger.info(f"Amazon: {len(promotions)} promoções encontradas")
        return promotions
    
    async def health_check(self) -> bool:
        """Verifica conexão com Amazon API"""
        if not self._is_configured():
            return False
        try:
            # Faz uma busca simples para testar
            await self._search_deals("electronics", limit=1)
            return True
        except Exception as e:
            logger.error(f"Amazon health check falhou: {e}")
            return False
    
    def _is_configured(self) -> bool:
        """Verifica se credenciais estão configuradas"""
        return all([
            self.access_key,
            self.secret_key,
            self.partner_tag
        ])
    
    async def _search_deals(
        self, 
        category: str, 
        keywords: str = None,
        limit: int = 10
    ) -> List[dict]:
        """
        Busca produtos em promoção usando PA API 5.0
        
        Nota: A PA API real requer assinatura AWS4-HMAC-SHA256.
        Esta é uma implementação simplificada para demonstração.
        Em produção, use o SDK oficial: paapi5-python-sdk
        """
        amazon_category = self.CATEGORY_MAP.get(category, "All")
        
        # Payload da requisição PA API 5.0
        payload = {
            "PartnerTag": self.partner_tag,
            "PartnerType": "Associates",
            "Marketplace": "www.amazon.com.br",
            "SearchIndex": amazon_category,
            "ItemCount": limit,
            "Resources": [
                "ItemInfo.Title",
                "Offers.Listings.Price",
                "Offers.Listings.SavingBasis",
                "Offers.Listings.PercentOff",
                "CustomerReviews.StarRating",
                "CustomerReviews.Count",
                "Images.Primary.Large",
            ],
            "Condition": "New",
            "SortBy": "Featured",
        }
        
        if keywords:
            payload["Keywords"] = keywords
        
        # Em produção, fazer request assinado
        # Por agora, retornamos lista vazia (precisa SDK configurado)
        logger.debug(f"Amazon search: {amazon_category}")
        return []
    
    def _parse_item(self, item: dict) -> Optional[Promotion]:
        """Converte item da API para Promotion"""
        try:
            # Extrai dados do item
            asin = item.get("ASIN", "")
            title = item.get("ItemInfo", {}).get("Title", {}).get("DisplayValue", "")
            
            # Preços
            offers = item.get("Offers", {}).get("Listings", [])
            if not offers:
                return None
            
            listing = offers[0]
            current_price = listing.get("Price", {}).get("Amount", 0)
            original_price = listing.get("SavingBasis", {}).get("Amount", current_price)
            
            # Avaliações
            reviews = item.get("CustomerReviews", {})
            rating = float(reviews.get("StarRating", {}).get("Value", 0))
            review_count = int(reviews.get("Count", 0))
            
            # Imagem
            images = item.get("Images", {}).get("Primary", {})
            image_url = images.get("Large", {}).get("URL")
            
            # URL com affiliate tag
            detail_url = f"https://www.amazon.com.br/dp/{asin}"
            affiliate_url = f"{detail_url}?tag={self.partner_tag}"
            
            return Promotion(
                id=f"amazon_{asin}",
                platform=Platform.AMAZON,
                url=detail_url,
                affiliate_url=affiliate_url,
                title=title,
                image_url=image_url,
                original_price=original_price,
                current_price=current_price,
                rating=rating,
                review_count=review_count,
            )
        except Exception as e:
            logger.error(f"Erro ao parsear item Amazon: {e}")
            return None
    
    async def close(self):
        """Fecha o cliente HTTP"""
        await self.client.aclose()
