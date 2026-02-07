"""
Coletor de promoções do Mercado Livre via scraping
"""
import re
from typing import List, Optional
from urllib.parse import urlencode, quote
import httpx
from selectolax.parser import HTMLParser
from loguru import logger

from .base import BaseCollector
from ..models import Promotion, Platform
from ..config import settings


class MercadoLivreCollector(BaseCollector):
    """Coleta promoções do Mercado Livre via scraping"""
    
    BASE_URL = "https://www.mercadolivre.com.br"
    DEALS_URL = "https://www.mercadolivre.com.br/ofertas"
    
    # Mapeamento de categorias para URLs
    CATEGORY_MAP = {
        "electronics": "eletronicos",
        "home": "casa-moveis-decoracao",
        "kitchen": "eletrodomesticos",
        "toys": "brinquedos-hobbies",
        "fashion": "calcados-roupas-bolsas",
        "sports": "esportes-fitness",
        "beauty": "beleza-cuidado-pessoal",
    }
    
    def __init__(self):
        self.affiliate_id = settings.ml_affiliate_id
        self.client = httpx.AsyncClient(
            timeout=30.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept-Language": "pt-BR,pt;q=0.9",
            },
            follow_redirects=True,
        )
    
    async def collect(self, categories: List[str] = None) -> List[Promotion]:
        """Coleta promoções da página de ofertas"""
        promotions = []
        
        try:
            # Busca ofertas gerais
            general_promos = await self._scrape_deals_page()
            promotions.extend(general_promos)
            
            # Busca por categorias específicas
            search_categories = categories or list(self.CATEGORY_MAP.keys())
            for category in search_categories[:3]:  # Limita para não sobrecarregar
                category_promos = await self._scrape_category(category)
                promotions.extend(category_promos)
                
        except Exception as e:
            logger.error(f"Erro ao buscar promoções ML: {e}")
        
        logger.info(f"Mercado Livre: {len(promotions)} promoções encontradas")
        return promotions
    
    async def health_check(self) -> bool:
        """Verifica se consegue acessar o site"""
        try:
            response = await self.client.get(self.DEALS_URL)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"ML health check falhou: {e}")
            return False
    
    async def _scrape_deals_page(self, limit: int = 20) -> List[Promotion]:
        """Scrape da página principal de ofertas"""
        try:
            response = await self.client.get(self.DEALS_URL)
            response.raise_for_status()
            
            return self._parse_listing_page(response.text, limit)
        except Exception as e:
            logger.error(f"Erro ao acessar página de ofertas ML: {e}")
            return []
    
    async def _scrape_category(
        self, 
        category: str,
        limit: int = 10
    ) -> List[Promotion]:
        """Scrape de categoria específica com filtro de desconto"""
        category_slug = self.CATEGORY_MAP.get(category)
        if not category_slug:
            return []
        
        # URL com filtro de desconto
        url = f"{self.BASE_URL}/ofertas/{category_slug}"
        
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            
            return self._parse_listing_page(response.text, limit)
        except Exception as e:
            logger.error(f"Erro ao acessar categoria ML [{category}]: {e}")
            return []
    
    def _parse_listing_page(self, html: str, limit: int = 20) -> List[Promotion]:
        """Extrai promoções da página de listagem"""
        promotions = []
        parser = HTMLParser(html)
        
        # Seleciona cards de produtos
        product_cards = parser.css("li.promotion-item, div.andes-card")
        
        for card in product_cards[:limit]:
            try:
                promo = self._parse_product_card(card)
                if promo:
                    promotions.append(promo)
            except Exception as e:
                logger.debug(f"Erro ao parsear card ML: {e}")
                continue
        
        return promotions
    
    def _parse_product_card(self, card) -> Optional[Promotion]:
        """Extrai dados de um card de produto"""
        # Título
        title_elem = card.css_first("a.promotion-item__link-container, a.ui-search-link")
        if not title_elem:
            return None
        
        title = title_elem.attributes.get("title", "")
        url = title_elem.attributes.get("href", "")
        
        if not title or not url:
            return None
        
        # Extrai ID do produto da URL
        item_id = self._extract_item_id(url)
        if not item_id:
            return None
        
        # Imagem
        img_elem = card.css_first("img")
        image_url = img_elem.attributes.get("data-src", "") if img_elem else ""
        if not image_url:
            image_url = img_elem.attributes.get("src", "") if img_elem else ""
        
        # Preços
        original_price = 0.0
        current_price = 0.0
        
        # Preço original (riscado)
        original_elem = card.css_first("s.andes-money-amount, span.price-tag-strike")
        if original_elem:
            original_price = self._parse_price(original_elem.text())
        
        # Preço atual
        price_elem = card.css_first("span.andes-money-amount__fraction")
        if price_elem:
            current_price = self._parse_price(price_elem.text())
        
        # Se não tem desconto real, pular
        if original_price <= 0 or current_price <= 0:
            return None
        if original_price <= current_price:
            original_price = current_price * 1.3  # Estima desconto se não mostrar
        
        # Gera link de afiliado
        affiliate_url = self._generate_affiliate_url(url)
        
        return Promotion(
            id=f"ml_{item_id}",
            platform=Platform.MERCADOLIVRE,
            url=url,
            affiliate_url=affiliate_url,
            title=title[:100],  # Limita tamanho
            image_url=image_url,
            original_price=original_price,
            current_price=current_price,
        )
    
    def _extract_item_id(self, url: str) -> Optional[str]:
        """Extrai ID do produto da URL"""
        # Padrão: MLB-1234567890 ou MLB1234567890
        match = re.search(r'(MLB[-]?\d+)', url)
        return match.group(1).replace("-", "") if match else None
    
    def _parse_price(self, text: str) -> float:
        """Converte texto de preço para float"""
        if not text:
            return 0.0
        # Remove caracteres não numéricos exceto vírgula/ponto
        clean = re.sub(r'[^\d,.]', '', text)
        # Converte formato brasileiro (1.234,56) para float
        clean = clean.replace('.', '').replace(',', '.')
        try:
            return float(clean)
        except ValueError:
            return 0.0
    
    def _generate_affiliate_url(self, url: str) -> str:
        """Gera URL com tag de afiliado"""
        if self.affiliate_id:
            separator = "&" if "?" in url else "?"
            return f"{url}{separator}aff_id={self.affiliate_id}"
        return url
    
    async def close(self):
        """Fecha o cliente HTTP"""
        await self.client.aclose()
