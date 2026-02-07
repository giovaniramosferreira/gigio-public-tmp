"""
Serviço de Scraping para Amazon (HTML Parsing)
"""
from curl_cffi.requests import AsyncSession
from selectolax.parser import HTMLParser
from typing import Optional
from loguru import logger
from ..models import Promotion, Platform
from ..config import settings
import re

class AmazonScraper:
    """Coleta dados de produtos Amazon via HTML (com bypass de TLS)"""
    
    def __init__(self):
        self.partner_tag = settings.amazon_partner_tag or "promogigio-20"

    async def scrape(self, url: str) -> Optional[Promotion]:
        """Extrai dados de uma URL da Amazon"""
        try:
            logger.info(f"Scraping Amazon URL: {url}")
            
            # Usa curl_cffi para simular Chrome recente e evitar CAPTCHA
            # Adiciona headers extras para parecer navegação real
            headers = {
                "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
                "Referer": "https://www.google.com/",
                "Cache-Control": "max-age=0",
            }
            
            async with AsyncSession(impersonate="chrome124", headers=headers) as session:
                response = await session.get(url, allow_redirects=True, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Erro HTTP {response.status_code} ao acessar {url}")
                return None
                
            if "captcha" in response.text.lower():
                logger.warning("Amazon CAPTCHA detectado :(")
                # Tenta uma segunda vez sem impersonate específico como fallback? 
                # Não, geralmente impersonate é melhor.
                return None

            html = HTMLParser(response.text)
            
            # Usa URL final após redirects para extrair ASIN
            final_url = str(response.url)
            
            # Extração de dados
            # Extração de dados
            title = self._get_title(html)
            original_price, current_price = self._get_prices(html)
            image_url = self._get_image(html)
            
            if not title:
                logger.warning("Não foi possível extrair o título do produto")
                logger.warning(f"URL Final: {final_url}")
                logger.warning(f"HTML Snippet: {response.text[:1000]}")
                return None
                
            # Gera URL de afiliado usando URL final
            asin = self._extract_asin(final_url)
            affiliate_url = self._build_affiliate_url(final_url, asin)
            
            return Promotion(
                id=f"amazon_{asin}" if asin else f"amazon_{hash(final_url)}",
                platform=Platform.AMAZON,
                url=final_url,
                affiliate_url=affiliate_url,
                title=title,
                image_url=image_url,
                original_price=original_price,
                current_price=current_price,
                rating=0.0,
                review_count=0
            )
            
        except Exception as e:
            logger.error(f"Falha no scraper Amazon: {e}")
            return None

    def _get_title(self, html: HTMLParser) -> str:
        # Tenta múltiplos seletores
        selectors = ["#productTitle", "#title", "h1"]
        for sel in selectors:
            node = html.css_first(sel)
            if node:
                return node.text(strip=True)
        return ""
        
    def _get_prices(self, html: HTMLParser) -> tuple[float, float]:
        """Retorna (preco_original, preco_atual)"""
        current_price = 0.0
        original_price = 0.0
        
        # 1. Preço Atual (O que a pessoa paga)
        # Tenta pegar preço da BuyBox ou preço em destaque
        current_selectors = [
            ".priceToPay .a-offscreen",
            "#corePrice_desktop .a-price.priceToPay .a-offscreen",
            "#priceblock_ourprice", 
            "#priceblock_dealprice",
            ".a-price .a-offscreen" # Genérico (cuidado, pode pegar o original se for o primeiro)
        ]
        
        for sel in current_selectors:
            node = html.css_first(sel)
            if node:
                val = self._parse_price(node.text(strip=True))
                if val > 0:
                    current_price = val
                    break
                    
        # 2. Preço Original (De: R$ xxx) - Geralmente riscado
        original_selectors = [
            ".basisPrice .a-offscreen",
            ".a-text-price .a-offscreen", # O padrão novo da Amazon para "De:"
            "#listPrice",
            "span[data-a-strike='true'] .a-offscreen"
        ]
        
        for sel in original_selectors:
            # Busca todos pois as vezes tem vários (ex: de cartão vs boleto)
            # Geralmente o "De" aparece primeiro na hierarquia visual do discount block
            nodes = html.css(sel)
            for node in nodes:
                val = self._parse_price(node.text(strip=True))
                if val > current_price: # O original deve ser maior que o atual
                    original_price = val
                    break
            if original_price > 0:
                break
                
        # Fallback: Se não achou original, assume igual ao atual
        if original_price == 0:
            original_price = current_price
            
        return original_price, current_price

    def _parse_price(self, text: str) -> float:
        try:
            # Limpa R$ e espaços
            text = text.replace("R$", "").strip()
            # Formato brasileiro: 1.234,56 -> 1234.56
            if "," in text:
                text = text.replace(".", "").replace(",", ".")
            else:
                 # Formato americano fallback: 1,234.56 -> 1234.56
                text = text.replace(",", "")
            
            # Remove qualquer char não numérico exceto ponto
            clean_text = re.sub(r"[^\d\.]", "", text)
            if clean_text:
                return float(clean_text)
        except ValueError:
            pass
        return 0.0

    def _get_image(self, html: HTMLParser) -> Optional[str]:
        # Tenta pegar imagem principal de alta resolução
        img_node = html.css_first("#landingImage")
        if img_node and "src" in img_node.attributes:
            return img_node.attributes["src"]
            
        # Fallback
        img_node = html.css_first("#imgBlkFront")
        if img_node:
            return img_node.attributes.get("src")
            
        return None

    def _extract_asin(self, url: str) -> Optional[str]:
        match = re.search(r"/dp/([A-Z0-9]{10})", url)
        if match: return match.group(1)
        match = re.search(r"/gp/product/([A-Z0-9]{10})", url)
        if match: return match.group(1)
        return None
        
    def _build_affiliate_url(self, url: str, asin: Optional[str]) -> str:
        if asin:
             return f"https://www.amazon.com.br/dp/{asin}?tag={self.partner_tag}"
        if "?" in url:
            return f"{url}&tag={self.partner_tag}"
        else:
            return f"{url}?tag={self.partner_tag}"

    async def close(self):
        pass # curl_cffi session is context managed in scrape()
