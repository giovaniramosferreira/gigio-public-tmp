"""
Bot Telegram com suporte a aprovação interativa
"""
import asyncio
import io
from typing import Optional
from telegram import Bot, Update, InlineKeyboardButton, InlineKeyboardMarkup, Message, InputFile
from telegram.constants import ParseMode
from telegram.ext import Application, CallbackQueryHandler, ContextTypes, ApplicationBuilder

from telegram.error import TelegramError, RetryAfter
import redis.asyncio as redis
import json
from loguru import logger

from ..config import settings
from ..models import Promotion
from ..formatters import TelegramFormatter
from ..history import message_history
from ..services import ImageGenerator


class TelegramBot:
    """Gerencia envio e aprovação de promoções"""
    
    def __init__(self):
        self.token = settings.telegram_bot_token
        self.channel_id = settings.telegram_channel_id
        self.admin_id = settings.telegram_admin_id
        self.formatter = TelegramFormatter()
        self.image_generator = ImageGenerator()
        self.application: Optional[Application] = None
        
        if self.token:
            builder = ApplicationBuilder().token(self.token)
            self.application = builder.build()
            self._setup_handlers()
            
        self.redis = None
            
    def _setup_handlers(self):
        """Configura handlers de callback"""
        self.application.add_handler(CallbackQueryHandler(self._handle_approval, pattern="^approve_"))
        self.application.add_handler(CallbackQueryHandler(self._handle_rejection, pattern="^reject_"))

    async def start(self):
        """Inicia o bot e polling"""
        if not self.application:
            return

        await self.application.initialize()
        await self.application.start()
        
        # Conecta Redis
        self.redis = await redis.from_url(settings.redis_url)
        
        # Inicia polling de forma não bloqueante
        await self.application.updater.start_polling()
        logger.info("Bot polling iniciado")

    async def stop(self):
        """Para o bot"""
        if not self.application:
            return
            
        await self.application.updater.stop()
        await self.application.stop()
        await self.application.shutdown()
        
        if self.redis:
            await self.redis.close()
            
        logger.info("Bot desligado")

    async def send_preview(self, promo: Promotion) -> bool:
        """Envia preview para admin aprovar (com card visual se possível)"""
        if not self.admin_id:
            logger.warning("Admin ID não configurado, pulando preview")
            return False
            
        msg_text = self.formatter.format(promo)
        keyboard = [
            [
                InlineKeyboardButton("✅ Aprovar", callback_data="approve_pub"),
                InlineKeyboardButton("❌ Cancelar", callback_data="reject_pub")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        try:
            # Tenta gerar card visual
            card_bytes = await self.image_generator.generate_card(promo)
            
            if card_bytes:
                # Usa o card gerado como imagem
                await self.application.bot.send_photo(
                    chat_id=self.admin_id,
                    photo=InputFile(io.BytesIO(card_bytes), filename="promo_card.png"),
                    caption=msg_text,
                    parse_mode=ParseMode.MARKDOWN_V2,
                    reply_markup=reply_markup
                )
                logger.info("Preview enviado com card visual gerado")
            elif promo.image_url:
                # Fallback: usa imagem original do produto
                await self.application.bot.send_photo(
                    chat_id=self.admin_id,
                    photo=promo.image_url,
                    caption=msg_text,
                    parse_mode=ParseMode.MARKDOWN_V2,
                    reply_markup=reply_markup
                )
            else:
                # Sem imagem
                await self.application.bot.send_message(
                    chat_id=self.admin_id,
                    text=msg_text,
                    parse_mode=ParseMode.MARKDOWN_V2,
                    disable_web_page_preview=False,
                    reply_markup=reply_markup
                )
            return True
        except Exception as e:
            logger.error(f"Erro ao enviar preview: {e}")
            return False

    async def _handle_approval(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Callback: Aprovar e publicar"""
        query = update.callback_query
        await query.answer("Publicando...")
        

        try:
             # Extrai dados da mensagem
            caption = query.message.caption_markdown_v2 or query.message.text
            # Pega URL da imagem se houver (da maior resolução)
            image_url = None
            if query.message.photo:
                image_url = query.message.photo[-1].file_id # Usando file_id por ser interno do Telegram

            # Cria objeto da promoção para fila
            promo_data = {
                "text": caption,
                "image_file_id": image_url,
                "type": "photo" if image_url else "text"
            }
            
            # Enfileira no Redis
            if self.redis:
                await self.redis.rpush("queue:approved", json.dumps(promo_data))
                logger.info("Promoção adicionada à fila de aprovação (queue:approved)")
            
            # Edita mensagem original para confirmar
            new_text = f"{query.message.caption or query.message.text}\n\n🕒 *NA FILA DE ENVIO* (Aguardando timer)"
            
            if query.message.caption:
                await query.edit_message_caption(caption=new_text, parse_mode=ParseMode.MARKDOWN_V2)
            else:
                await query.edit_message_text(text=new_text, parse_mode=ParseMode.MARKDOWN_V2)
                
            message_history.add("Promoção Aprovada (Fila)", "queued")
            
        except Exception as e:
            logger.error(f"Erro na aprovação: {e}")
            await query.answer(f"Erro: {str(e)}", show_alert=True)

    async def _handle_rejection(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Callback: Rejeitar"""
        query = update.callback_query
        await query.answer("Cancelado")
        
        try:
            await query.delete_message()
            message_history.add("Promoção Cancelada", "failed")
        except Exception as e:
            logger.error(f"Erro no cancelamento: {e}")

    # --- Métodos legado/manual mantidos ---

    async def send_manual_message(self, text: str) -> bool:
        if not self.application: return False
        try:
            await self.application.bot.send_message(
                chat_id=self.channel_id,
                text=text,
                disable_web_page_preview=False
            )
            message_history.add(text, "success")
            return True
        except Exception as e:
            logger.error(f"Erro manual: {e}")
            message_history.add(text, "failed", str(e))
            return False

    async def health_check(self) -> bool:
        if not self.application: return False
        try:
            me = await self.application.bot.get_me()
            logger.info(f"Bot conectado: @{me.username}")
            return True
        except Exception as e:
            logger.error(f"Health check falhou: {e}")
            return False

    async def send_and_pin_welcome(self, text: str) -> dict:
        """Envia mensagem de boas-vindas e fixa no canal"""
        if not self.application:
            return {"success": False, "error": "Bot não inicializado"}
        
        try:
            # Envia a mensagem
            msg = await self.application.bot.send_message(
                chat_id=self.channel_id,
                text=text,
                disable_web_page_preview=False
            )
            
            # Fixa a mensagem no canal
            await self.application.bot.pin_chat_message(
                chat_id=self.channel_id,
                message_id=msg.message_id,
                disable_notification=True  # Não notifica os membros sobre a fixação
            )
            
            logger.info(f"Mensagem de boas-vindas enviada e fixada (ID: {msg.message_id})")
            message_history.add("📌 BOAS-VINDAS FIXADO", "success")
            return {"success": True, "message_id": msg.message_id}
            
        except Exception as e:
            logger.error(f"Erro ao enviar/fixar boas-vindas: {e}")
            return {"success": False, "error": str(e)}
