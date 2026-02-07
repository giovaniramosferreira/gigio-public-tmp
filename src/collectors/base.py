"""
Classe base para coletores de promoções
"""
from abc import ABC, abstractmethod
from typing import List
from ..models import Promotion


class BaseCollector(ABC):
    """Classe base abstrata para coletores"""
    
    @abstractmethod
    async def collect(self, categories: List[str] = None) -> List[Promotion]:
        """
        Coleta promoções da plataforma
        
        Args:
            categories: Lista de categorias para filtrar
            
        Returns:
            Lista de promoções encontradas
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """
        Verifica se a conexão com a API está funcionando
        
        Returns:
            True se saudável, False caso contrário
        """
        pass
