"""
Formatador de mensagens para Telegram
"""
from ..models import Promotion


class TelegramFormatter:
    """Formata promoções para mensagens atraentes no Telegram"""
    
    # Emojis por faixa de desconto
    DISCOUNT_EMOJIS = {
        80: "🔥🔥🔥",
        60: "🔥🔥",
        40: "🔥",
        20: "💰",
        0: "🏷️",
    }
    
    def format(self, promo: Promotion) -> str:
        """
        Formata promoção em mensagem Telegram
        
        Returns:
            Mensagem formatada com markdown
        """
        discount_emoji = self._get_discount_emoji(promo.discount_percent)
        
        # Helpers de escape
        esc = self._escape_markdown
        
        # Formata valores numéricos e textos dinâmicos
        title = esc(promo.title)
        platform = esc(promo.platform_name.upper())
        
        # Formata moeda (BRL) e depois escapa (pois tem pontuação . ,)
        vals = {
            "orig": esc(f"R$ {promo.original_price:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")),
            "curr": esc(f"R$ {promo.current_price:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")),
            "save": esc(f"R$ {promo.savings:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."))
        }
        
        pct = esc(str(promo.discount_percent))
        
        # Monta a mensagem (TUDO deve ser escapado exceto os marcadores de estilo * ~)
        lines = [
            f"{discount_emoji} *OFERTA {platform}\\!*",
            "",
            f"📦 *{title}*",
            "",
            f"💵 ~{vals['orig']}~",
            f"💰 *{vals['curr']}*",
            f"📉 *{pct}% OFF* \\(\\-{vals['save']}\\)",
        ]
        
        # Adiciona rating se disponível
        if promo.rating > 0:
            stars = "⭐" * int(promo.rating)
            review_text = esc(f"({promo.review_count:,} avaliações)") if promo.review_count else ""
            rating_line = esc(f"{promo.rating:.1f}")
            lines.append(f"{stars} {rating_line} {review_text}")
        
        # Adiciona plataforma
        lines.extend([
            "",
            f"🏪 {promo.platform_emoji} {esc(promo.platform_name)}",
            "",
            f"🛒 [COMPRAR AGORA]({promo.affiliate_url})",  # Link não escapa a URL (parcialmente) nem os []()
        ])
        
        return "\n".join(lines)
    
    def format_compact(self, promo: Promotion) -> str:
        """Formato compacto para listagens"""
        return (
            f"{self._get_discount_emoji(promo.discount_percent)} "
            f"*{promo.discount_percent}% OFF* - "
            f"{self._escape_markdown(promo.title[:50])}... "
            f"*R$ {promo.current_price:,.2f}* "
            f"[🛒]({promo.affiliate_url})"
        )
    
    def _get_discount_emoji(self, discount: int) -> str:
        """Retorna emoji baseado no desconto"""
        for threshold, emoji in self.DISCOUNT_EMOJIS.items():
            if discount >= threshold:
                return emoji
        return "🏷️"
    
    def _escape_markdown(self, text: str) -> str:
        """Escapa caracteres especiais do Markdown"""
        chars_to_escape = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!']
        for char in chars_to_escape:
            text = text.replace(char, f'\\{char}')
        return text
