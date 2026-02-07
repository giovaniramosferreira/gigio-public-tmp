"""
Agendador de coleta e publicação de promoções
"""
import asyncio
from datetime import datetime
from typing import List
import redis.asyncio as redis
import json
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

from ..config import settings
from ..models import Promotion
from ..collectors import AmazonCollector, ShopeeCollector, MercadoLivreCollector
from ..filters import PromoFilter
from ..bot import TelegramBot


class JobScheduler:
    """Gerencia agendamento de coleta e publicação"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.redis: redis.Redis = None
        self.promo_queue: List[Promotion] = []
        
        # Componentes
        self.collectors = [
            AmazonCollector(),
            ShopeeCollector(),
            MercadoLivreCollector(),
        ]
        self.filter = PromoFilter()
        self.bot = TelegramBot()
        
        # Configurações
        self.posts_per_hour = settings.posts_per_hour
        self.peak_hours = settings.peak_hours
        self.peak_multiplier = settings.peak_multiplier
    
    async def start(self):
        """Inicia o scheduler"""
        # Conecta ao Redis
        self.redis = await redis.from_url(settings.redis_url)
        logger.info(f"Conectado ao Redis: {settings.redis_url}")
        
        # Job de coleta (a cada 30 minutos)
        self.scheduler.add_job(
            self._collect_job,
            trigger=IntervalTrigger(minutes=30),
            id="collect_promotions",
            name="Coleta de Promoções",
            replace_existing=True,
        )
        
        # Job de publicação (calcula intervalo baseado em posts/hora)
        interval_minutes = 60 // self.posts_per_hour
        self.scheduler.add_job(
            self._publish_job,
            trigger=IntervalTrigger(minutes=interval_minutes),
            id="publish_promotion",
            name="Publicação de Promoção",
            replace_existing=True,
        )
        
        # Job da Fila de Aprovados (Queue Runner)
        self.scheduler.add_job(
            self._process_approved_queue,
            trigger=IntervalTrigger(minutes=settings.queue_interval_minutes),
            id="process_queue",
            name="Fila de Envios Aprovados",
            replace_existing=True,
        )
        
        # Inicia scheduler
        self.scheduler.start()
        logger.info(
            f"Scheduler iniciado: coleta a cada 30min, "
            f"publicação auto a cada {interval_minutes}min, "
            f"fila aprovados a cada {settings.queue_interval_minutes}min"
        )
        
        # Coleta inicial
        await self._collect_job()
    
    async def stop(self):
        """Para o scheduler"""
        self.scheduler.shutdown()
        
        # Fecha conexões
        for collector in self.collectors:
            await collector.close()
        
        if self.redis:
            await self.redis.close()
        
        logger.info("Scheduler parado")
    
    async def _collect_job(self):
        """Job de coleta de promoções"""
        logger.info("Iniciando coleta de promoções...")
        
        all_promotions = []
        
        for collector in self.collectors:
            try:
                promos = await collector.collect(settings.categories)
                all_promotions.extend(promos)
            except Exception as e:
                logger.error(f"Erro no coletor {collector.__class__.__name__}: {e}")
        
        # Filtra promoções
        filtered = self.filter.filter(all_promotions)
        
        # Remove duplicatas já postadas
        new_promos = await self._remove_already_posted(filtered)
        
        # Adiciona à fila
        self.promo_queue.extend(new_promos)
        
        logger.info(
            f"Coleta concluída: {len(new_promos)} novas promoções "
            f"(fila: {len(self.promo_queue)})"
        )
    
    async def _publish_job(self):
        """Job de publicação de promoção"""
        if not self.promo_queue:
            logger.debug("Fila vazia, nada a publicar")
            return
        
        # Verifica horário de pico
        current_hour = datetime.now().hour
        is_peak = current_hour in self.peak_hours
        
        # Publica mais em horários de pico
        posts_to_send = self.peak_multiplier if is_peak else 1
        
        for _ in range(min(posts_to_send, len(self.promo_queue))):
            promo = self.promo_queue.pop(0)
            
            # Marca como postada
            await self._mark_as_posted(promo)
            
            # Envia para Telegram
            success = await self.bot.send_promotion(promo)
            
            if success:
                logger.info(f"Publicado: {promo.title[:40]}...")
            else:
                # Se falhar, coloca de volta na fila
                self.promo_queue.append(promo)
            
            # Delay entre posts para evitar flood
            await asyncio.sleep(2)
    
    async def _remove_already_posted(
        self, 
        promotions: List[Promotion]
    ) -> List[Promotion]:
        """Remove promoções já postadas nas últimas 24h"""
        new_promos = []
        
        for promo in promotions:
            key = f"posted:{promo.id}"
            exists = await self.redis.exists(key)
            
            if not exists:
                new_promos.append(promo)
        
        return new_promos
    
    async def _mark_as_posted(self, promo: Promotion):
        """Marca promoção como postada (expira em 24h)"""
        key = f"posted:{promo.id}"
        await self.redis.setex(key, 86400, "1")  # 24 horas

    async def _process_approved_queue(self):
        """Processa fila de promoções aprovadas manualmente"""
        queue_key = "queue:approved"
        
        # Pega o próximo da fila
        item_json = await self.redis.lpop(queue_key)
        
        if not item_json:
            logger.debug("Fila de aprovados vazia.")
            return

        try:
            data = json.loads(item_json)
            logger.info("Processando item da fila de aprovados...")
            
            if data["type"] == "photo":
                await self.bot.application.bot.send_photo(
                    chat_id=settings.telegram_channel_id,
                    photo=data["image_file_id"],
                    caption=data["text"],
                    parse_mode="MarkdownV2"
                )
            else:
                await self.bot.application.bot.send_message(
                    chat_id=settings.telegram_channel_id,
                    text=data["text"],
                    parse_mode="MarkdownV2"
                )
            
            logger.info("✅ Item da fila publicado com sucesso!")
            
            # --- Alerta de Fila Baixa ---
            remaining = await self.redis.llen(queue_key)
            # Calcula quantos itens representam 3 horas de publicação
            minutes_threshold = 180 # 3 horas
            items_threshold = max(1, minutes_threshold // settings.queue_interval_minutes)
            
            if 0 < remaining <= items_threshold and settings.telegram_admin_id:
                hours_left = (remaining * settings.queue_interval_minutes) / 60
                
                # Envia alerta apenas se não tiver enviado recentemente (opcional, aqui manda sempre pra garantir)
                alert_msg = (
                    f"⚠️ *ATENÇÃO: FILA ACABANDO!*\n\n"
                    f"Restam apenas *{remaining} posts* na fila "
                    f"(aprox. {hours_left:.1f} horas).\n\n"
                    f"Abasteça agora para não ficar sem conteúdo!"
                )
                try:
                    await self.bot.application.bot.send_message(
                        chat_id=settings.telegram_admin_id,
                        text=alert_msg,
                        parse_mode="Markdown"
                    )
                    logger.warning(f"Alerta de fila baixa enviado ao admin (Restam {remaining})")
                except Exception as ex:
                    logger.error(f"Erro ao enviar alerta admin: {ex}")
            
        except Exception as e:
            logger.error(f"Erro ao processar item da fila: {e}")
            # Se falhar, talvez queira devolver pra fila ou salvar numa fila de erro
            # Por enquanto, loga e segue a vida
    
    def get_status(self) -> dict:
        """Retorna status do scheduler"""
        return {
            "running": self.scheduler.running,
            "queue_size": len(self.promo_queue),
            "next_collect": str(self.scheduler.get_job("collect_promotions").next_run_time),
            "next_publish": str(self.scheduler.get_job("publish_promotion").next_run_time),
        }
