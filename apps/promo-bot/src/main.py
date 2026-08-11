"""
Promo Bot - Sistema Automatizado de Divulgação de Promoções
"""
import asyncio
import signal
import sys
from loguru import logger

from .config import settings
from .scheduler import JobScheduler


# Configura logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.log_level,
)
logger.add(
    "/app/logs/promo-bot.log",
    rotation="1 day",
    retention="7 days",
    level="DEBUG",
)


async def main():
    """Ponto de entrada principal"""
    logger.info("=" * 50)
    logger.info("🚀 Promo Bot iniciando...")
    logger.info("=" * 50)
    
    scheduler = JobScheduler()
    
    # Handler para shutdown graceful
    def shutdown_handler(sig, frame):
        logger.info("Recebido sinal de shutdown...")
        asyncio.create_task(scheduler.stop())
        sys.exit(0)
    
    signal.signal(signal.SIGINT, shutdown_handler)
    signal.signal(signal.SIGTERM, shutdown_handler)
    
    try:
        # Inicia o scheduler
        await scheduler.start()
        
        # Mantém rodando
        while True:
            await asyncio.sleep(60)
            status = scheduler.get_status()
            logger.debug(f"Status: fila={status['queue_size']}")
            
    except Exception as e:
        logger.error(f"Erro fatal: {e}")
        await scheduler.stop()
        raise


if __name__ == "__main__":
    asyncio.run(main())
