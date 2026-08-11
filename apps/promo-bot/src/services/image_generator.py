"""
Gerador de Cards Visuais para Promoções
Usa Pillow para criar imagens profissionais com:
- Foto do produto
- Preço original (riscado)
- Preço promocional (destaque)
- Template com as cores do canal
"""
import io
import httpx
from PIL import Image, ImageDraw, ImageFont
from typing import Optional, Tuple
from loguru import logger

from ..models import Promotion


class ImageGenerator:
    """Gera cards visuais de promoção"""
    
    # Cores do tema (RGB)
    BG_GRADIENT_TOP = (26, 26, 46)      # #1a1a2e
    BG_GRADIENT_BOTTOM = (30, 42, 71)   # #1e2a47
    ACCENT_COLOR = (233, 69, 96)        # #e94560
    OLD_PRICE_COLOR = (150, 150, 150)   # Cinza
    NEW_PRICE_COLOR = (46, 204, 113)    # Verde
    TEXT_COLOR = (255, 255, 255)        # Branco
    BADGE_BG = (233, 69, 96)            # Vermelho do tema
    
    # Dimensões do card
    CARD_WIDTH = 800
    CARD_HEIGHT = 800
    PRODUCT_AREA_SIZE = 450
    
    async def generate_card(self, promo: Promotion) -> Optional[bytes]:
        """Aplica marca d'água na imagem do produto (sem card/gradiente)"""
        try:
            if not promo.image_url:
                return None

            # 1. Baixa imagem original
            img = await self._download_image(promo.image_url)
            if not img:
                return None
            
            # Converte para RGBA para permitir transparência
            if img.mode != 'RGBA':
                img = img.convert('RGBA')

            # 2. Configura Marca D'água
            text = "PROMOGIGIO"
            width, height = img.size
            
            # Calcula tamanho da fonte proporcional à imagem (5% da altura)
            font_size = int(height * 0.05)
            font_size = max(20, min(font_size, 80)) # Limites min/max
            
            font = self._load_font(font_size)
            
            # Cria layer de sobreposição para marca d'água
            overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            
            # Calcula posição (Canto inferior direito com margem)
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            margin_x = int(width * 0.05)
            margin_y = int(height * 0.05)
            
            x = width - text_width - margin_x
            y = height - text_height - margin_y
            
            # Adiciona sombra/outline preto para garantir leitura em fundos claros
            shadow_offset = max(1, font_size // 15)
            draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=(0, 0, 0, 160))
            
            # Adiciona texto branco
            draw.text((x, y), text, font=font, fill=(255, 255, 255, 230))
            
            # 3. Compõe a imagem final
            watermarked = Image.alpha_composite(img, overlay)
            
            # Converte volta para RGB para salvar como JPEG/PNG otimizado
            final_img = watermarked.convert('RGB')
            
            # 4. Exporta bytes
            buffer = io.BytesIO()
            final_img.save(buffer, format='PNG', quality=95)
            buffer.seek(0)
            
            logger.info(f"Marca d'água aplicada para: {promo.title[:30]}...")
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"Erro ao gerar imagem com marca d'água: {e}")
            return None

    def _load_font(self, size: int) -> ImageFont.FreeTypeFont:
        """Carrega fonte, com fallback para default"""
        font_paths = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/segoeui.ttf",
        ]
        
        for path in font_paths:
            try:
                return ImageFont.truetype(path, size)
            except (OSError, IOError):
                continue
        return ImageFont.load_default()
    
    async def _download_image(self, url: str) -> Optional[Image.Image]:
        """Baixa imagem da URL"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10)
                if response.status_code == 200:
                    return Image.open(io.BytesIO(response.content))
        except Exception as e:
            logger.warning(f"Falha ao baixar imagem: {e}")
        return None
