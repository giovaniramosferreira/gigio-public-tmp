"""
Filtros para seleção de promoções de qualidade
"""
from typing import List
from loguru import logger

from ..models import Promotion
from ..config import settings


class PromoFilter:
    """Filtra promoções baseado em critérios configuráveis"""
    
    def __init__(
        self,
        min_discount: int = None,
        min_rating: float = None,
        max_price: float = None,
        categories: List[str] = None,
        blacklist_words: List[str] = None,
    ):
        self.min_discount = min_discount or settings.min_discount
        self.min_rating = min_rating or settings.min_rating
        self.max_price = max_price or settings.max_price
        self.categories = categories or settings.categories
        self.blacklist_words = blacklist_words or [
            "replica", "usado", "seminovo", "recondicionado",
            "generico", "paralelo", "importado irregular"
        ]
    
    def filter(self, promotions: List[Promotion]) -> List[Promotion]:
        """
        Filtra lista de promoções
        
        Returns:
            Lista filtrada ordenada por qualidade
        """
        filtered = []
        
        for promo in promotions:
            if self._passes_all_filters(promo):
                filtered.append(promo)
        
        # Ordena por score de qualidade (desconto * rating)
        filtered.sort(key=self._quality_score, reverse=True)
        
        logger.info(
            f"Filtro: {len(filtered)}/{len(promotions)} promoções aprovadas"
        )
        
        return filtered
    
    def _passes_all_filters(self, promo: Promotion) -> bool:
        """Verifica se promoção passa em todos os filtros"""
        checks = [
            self._check_discount(promo),
            self._check_rating(promo),
            self._check_price(promo),
            self._check_blacklist(promo),
        ]
        return all(checks)
    
    def _check_discount(self, promo: Promotion) -> bool:
        """Verifica desconto mínimo"""
        passes = promo.discount_percent >= self.min_discount
        if not passes:
            logger.debug(
                f"Filtro desconto: {promo.title[:30]}... "
                f"({promo.discount_percent}% < {self.min_discount}%)"
            )
        return passes
    
    def _check_rating(self, promo: Promotion) -> bool:
        """Verifica avaliação mínima"""
        # Se não tem rating, aceita (comum em produtos novos)
        if promo.rating == 0:
            return True
        passes = promo.rating >= self.min_rating
        if not passes:
            logger.debug(
                f"Filtro rating: {promo.title[:30]}... "
                f"({promo.rating} < {self.min_rating})"
            )
        return passes
    
    def _check_price(self, promo: Promotion) -> bool:
        """Verifica preço máximo"""
        passes = promo.current_price <= self.max_price
        if not passes:
            logger.debug(
                f"Filtro preço: {promo.title[:30]}... "
                f"(R${promo.current_price:.2f} > R${self.max_price:.2f})"
            )
        return passes
    
    def _check_blacklist(self, promo: Promotion) -> bool:
        """Verifica palavras na blacklist"""
        title_lower = promo.title.lower()
        for word in self.blacklist_words:
            if word.lower() in title_lower:
                logger.debug(
                    f"Filtro blacklist: {promo.title[:30]}... "
                    f"(contém '{word}')"
                )
                return False
        return True
    
    def _quality_score(self, promo: Promotion) -> float:
        """Calcula score de qualidade para ordenação"""
        discount_score = promo.discount_percent / 100
        rating_score = promo.rating / 5 if promo.rating > 0 else 0.5
        
        # Bônus para reviews
        if promo.review_count > 1000:
            review_bonus = 0.2
        elif promo.review_count > 100:
            review_bonus = 0.1
        else:
            review_bonus = 0
        
        return (discount_score * 0.5) + (rating_score * 0.3) + review_bonus
