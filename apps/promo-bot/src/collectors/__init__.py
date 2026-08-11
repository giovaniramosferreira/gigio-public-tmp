"""Collectors module"""
from .base import BaseCollector
from .amazon import AmazonCollector
from .shopee import ShopeeCollector
from .mercadolivre import MercadoLivreCollector

__all__ = [
    "BaseCollector",
    "AmazonCollector", 
    "ShopeeCollector",
    "MercadoLivreCollector",
]
