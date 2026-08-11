"""
Coletor de promoções da Shopee via API de Afiliados
"""
import hashlib
import hmac
import time
from typing import List, Optional
import httpx
from loguru import logger

from .base import BaseCollector
from ..models import Promotion, Platform
from ..config import settings


class ShopeeCollector(BaseCollector):
    """Coleta promoções da Shopee usando API de Afiliados"""
    
    BASE_URL = "https://open-api.affiliate.shopee.com.br"
    
    # Mapeamento de categorias Shopee
    CATEGORY_MAP = {
        "electronics": 11044950,
        "home": 11044951,
        "kitchen": 11044952,
        "fashion": 11044953,
        "beauty": 11044954,
        "toys": 11044955,
        "sports": 11044956,
    }
    
    def __init__(self):
        self.app_id = settings.shopee_app_id
        self.app_secret = settings.shopee_app_secret
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def collect(self, categories: List[str] = None) -> List[Promotion]:
        """Coleta promoções de categorias específicas"""
        if not self._is_configured():
            logger.warning("Shopee API não configurada, pulando...")
            return []
        
        promotions = []
        
        try:
            # Busca ofertas flash (as melhores promoções)
            flash_deals = await self._get_flash_deals()
            promotions.extend(flash_deals)
            
            # Busca por categorias
            search_categories = categories or list(self.CATEGORY_MAP.keys())
            for category in search_categories:
                category_promos = await self._search_category(category)
                promotions.extend(category_promos)
                
        except Exception as e:
            logger.error(f"Erro ao buscar promoções Shopee: {e}")
        
        logger.info(f"Shopee: {len(promotions)} promoções encontradas")
        return promotions
    
    async def health_check(self) -> bool:
        """Verifica conexão com Shopee API"""
        if not self._is_configured():
            return False
        try:
            # Tenta obter ofertas flash como teste
            await self._get_flash_deals(limit=1)
            return True
        except Exception as e:
            logger.error(f"Shopee health check falhou: {e}")
            return False
    
    def _is_configured(self) -> bool:
        """Verifica se credenciais estão configuradas"""
        return all([self.app_id, self.app_secret])
    
    def _generate_signature(self, path: str, timestamp: int) -> str:
        """Gera assinatura HMAC-SHA256 para autenticação"""
        base_string = f"{self.app_id}{timestamp}{path}"
        signature = hmac.new(
            self.app_secret.encode('utf-8'),
            base_string.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return signature
    
    async def _get_flash_deals(self, limit: int = 20) -> List[Promotion]:
        """Busca ofertas flash/relâmpago"""
        path = "/api/v1/flash_sale"
        timestamp = int(time.time())
        signature = self._generate_signature(path, timestamp)
        
        params = {
            "app_id": self.app_id,
            "timestamp": timestamp,
            "signature": signature,
            "limit": limit,
        }
        
        try:
            response = await self.client.get(
                f"{self.BASE_URL}{path}",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            promotions = []
            for item in data.get("data", {}).get("items", []):
                promo = self._parse_item(item)
                if promo:
                    promotions.append(promo)
            
            return promotions
        except Exception as e:
            logger.error(f"Erro ao buscar flash deals Shopee: {e}")
            return []
    
    async def _search_category(
        self, 
        category: str,
        limit: int = 10
    ) -> List[Promotion]:
        """Busca produtos em promoção por categoria"""
        category_id = self.CATEGORY_MAP.get(category)
        if not category_id:
            return []
        
        path = "/api/v1/product_search"
        timestamp = int(time.time())
        signature = self._generate_signature(path, timestamp)
        
        params = {
            "app_id": self.app_id,
            "timestamp": timestamp,
            "signature": signature,
            "category_id": category_id,
            "limit": limit,
            "sort_type": 5,  # Por desconto
        }
        
        try:
            response = await self.client.get(
                f"{self.BASE_URL}{path}",
                params=params
            )
            response.raise_for_status()
            data = response.json()
            
            promotions = []
            for item in data.get("data", {}).get("items", []):
                promo = self._parse_item(item)
                if promo:
                    promotions.append(promo)
            
            return promotions
        except Exception as e:
            logger.error(f"Erro ao buscar categoria Shopee [{category}]: {e}")
            return []
    
    def _parse_item(self, item: dict) -> Optional[Promotion]:
        """Converte item da API para Promotion"""
        try:
            item_id = str(item.get("item_id", ""))
            shop_id = str(item.get("shop_id", ""))
            
            title = item.get("product_name", "")
            image_url = item.get("product_image", "")
            
            # Preços (em centavos, converter para reais)
            original_price = item.get("price_before_discount", 0) / 100000
            current_price = item.get("price", 0) / 100000
            
            # Se não tem desconto, pular
            if original_price <= current_price:
                return None
            
            # Avaliação
            rating = float(item.get("rating_star", 0))
            
            # URL
            base_url = f"https://shopee.com.br/product/{shop_id}/{item_id}"
            affiliate_url = item.get("product_link", base_url)
            
            return Promotion(
                id=f"shopee_{item_id}",
                platform=Platform.SHOPEE,
                url=base_url,
                affiliate_url=affiliate_url,
                title=title,
                image_url=image_url,
                original_price=original_price,
                current_price=current_price,
                rating=rating,
            )
        except Exception as e:
            logger.error(f"Erro ao parsear item Shopee: {e}")
            return None
    
    async def close(self):
        """Fecha o cliente HTTP"""
        await self.client.aclose()
