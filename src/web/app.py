"""
Interface Web FastAPI para o Promo Bot
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from loguru import logger

from ..scheduler import JobScheduler
from ..bot import TelegramBot
from ..history import message_history
from ..services import AmazonScraper
from ..models import Promotion, Platform

# Instâncias globais
scheduler = JobScheduler()
bot = TelegramBot()
scraper = AmazonScraper()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação"""
    logger.info("Iniciando Promo Bot Web API...")
    
    # Inicia componentes
    await bot.start()
    await scheduler.start()
    
    yield
    
    logger.info("Desligando Promo Bot...")
    await scheduler.stop()
    await bot.stop()
    await scraper.close()

app = FastAPI(
    title="Promo Bot API",
    lifespan=lifespan
)

class ManualMessage(BaseModel):
    text: str

class LinkRequest(BaseModel):
    url: str

app.mount("/static", StaticFiles(directory="src/web/static"), name="static")

@app.get("/")
async def read_index():
    return FileResponse("src/web/static/index.html")

@app.post("/send-manual")
async def send_manual(msg: ManualMessage):
    """Envia mensagem manual para o Telegram"""
    if not msg.text:
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    
    success = await bot.send_manual_message(msg.text)
    if not success:
        raise HTTPException(status_code=500, detail="Falha ao enviar")
    return {"status": "sent"}

@app.post("/process-link")
async def process_link(req: LinkRequest):
    """Processa link da Amazon e envia para aprovação"""
    if "amazon" not in req.url and "amzn.to" not in req.url:
        raise HTTPException(status_code=400, detail="Apenas links da Amazon são suportados por enquanto")
        
    # 1. Scrape
    promo = await scraper.scrape(req.url)
    if not promo:
        raise HTTPException(status_code=400, detail="Falha ao coletar dados do produto")
        
    # 2. Envia para aprovação (Admin)
    success = await bot.send_preview(promo)
    
    if not success:
        raise HTTPException(status_code=500, detail="Falha ao enviar preview (verifique se ADMIN_ID está configurado)")
        
    return {
        "status": "preview_sent",
        "title": promo.title,
        "price": promo.current_price
    }

@app.get("/status")
async def status():
    return scheduler.get_status()

@app.get("/history")
async def get_history(limit: int = 50):
    records = message_history.get_recent(limit)
    return {"messages": [
        {"id": r.id, "text": r.text, "sent_at": r.sent_at.isoformat(), "status": r.status, "error": r.error_message}
        for r in records
    ]}

@app.get("/stats")
async def get_stats():
    return message_history.get_stats()


# ========== Queue Management ==========

@app.get("/queue/list")
async def list_queue():
    """Lista itens na fila de aprovados aguardando envio"""
    import json
    
    if not bot.redis:
        raise HTTPException(status_code=500, detail="Redis não conectado")
    
    # Busca todos os itens da fila sem remover
    items_raw = await bot.redis.lrange("queue:approved", 0, -1)
    
    queue_items = []
    for i, item_bytes in enumerate(items_raw):
        try:
            data = json.loads(item_bytes)
            # Extrai só um preview do texto (primeiras 100 chars)
            preview = data.get("text", "")[:100].replace("\n", " ") + "..."
            queue_items.append({
                "position": i + 1,
                "type": data.get("type", "text"),
                "preview": preview
            })
        except:
            continue
    
    return {
        "queue_size": len(queue_items),
        "items": queue_items
    }


@app.post("/queue/send-now")
async def send_queue_now():
    """Força envio imediato do próximo item da fila"""
    import json
    from telegram.constants import ParseMode
    
    if not bot.redis:
        raise HTTPException(status_code=500, detail="Redis não conectado")
    
    # Pop do próximo item
    item_json = await bot.redis.lpop("queue:approved")
    
    if not item_json:
        raise HTTPException(status_code=404, detail="Fila vazia!")
    
    try:
        data = json.loads(item_json)
        
        if data["type"] == "photo":
            await bot.application.bot.send_photo(
                chat_id=bot.channel_id,
                photo=data["image_file_id"],
                caption=data["text"],
                parse_mode=ParseMode.MARKDOWN_V2
            )
        else:
            await bot.application.bot.send_message(
                chat_id=bot.channel_id,
                text=data["text"],
                parse_mode=ParseMode.MARKDOWN_V2
            )
        
        logger.info("Item da fila enviado imediatamente via /queue/send-now")
        return {"status": "sent", "remaining": await bot.redis.llen("queue:approved")}
        
    except Exception as e:
        logger.error(f"Erro ao enviar item da fila: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ========== Welcome Message ==========

class WelcomeRequest(BaseModel):
    text: str

@app.post("/send-welcome")
async def send_welcome(req: WelcomeRequest):
    """Envia e fixa mensagem de boas-vindas no canal"""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    
    result = await bot.send_and_pin_welcome(req.text)
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Erro desconhecido"))
    
    return {"status": "pinned", "message_id": result["message_id"]}


# ========== Settings Management ==========

class SettingsUpdate(BaseModel):
    # Telegram
    telegram_bot_token: str | None = None
    telegram_channel_id: str | None = None
    telegram_admin_id: str | None = None
    # Amazon
    amazon_partner_tag: str | None = None

@app.get("/settings")
async def get_settings():
    """Retorna configurações atuais (mascaradas)"""
    from ..config import settings
    
    def mask(s: str) -> str:
        if not s or len(s) < 8: return "********"
        return f"{s[:4]}...{s[-4:]}"
    
    return {
        "telegram_bot_token": mask(settings.telegram_bot_token),
        "telegram_channel_id": settings.telegram_channel_id, # ID geralmente não é secreto
        "telegram_admin_id": settings.telegram_admin_id,
        "amazon_partner_tag": settings.amazon_partner_tag,
        "has_custom_config": True # Indica se já existe config persistida (simplificação)
    }

@app.post("/settings")
async def update_settings(new_settings: SettingsUpdate):
    """Salva configurações e reinicia aplicação"""
    import json
    import os
    import sys
    import threading
    import time
    from ..config import settings as current_settings

    # 1. Carrega configs existentes do disco se houver
    config_path = "/app/data/config.json"
    if not os.path.exists("/app/data"):
        config_path = "data/config.json" # Fallback local
        
    data = {}
    if os.path.exists(config_path):
        try:
            with open(config_path, "r") as f:
                data = json.load(f)
        except:
            pass
            
    # 2. Atualiza com novos valores (apenas os fornecidos)
    changed = False
    
    if new_settings.telegram_bot_token:
        data["telegram_bot_token"] = new_settings.telegram_bot_token
        changed = True
        
    if new_settings.telegram_channel_id:
        data["telegram_channel_id"] = new_settings.telegram_channel_id
        changed = True
        
    if new_settings.telegram_admin_id:
        data["telegram_admin_id"] = new_settings.telegram_admin_id
        changed = True
        
    if new_settings.amazon_partner_tag:
        data["amazon_partner_tag"] = new_settings.amazon_partner_tag
        changed = True

    if not changed:
        return {"status": "no_change", "message": "Nenhuma alteração detectada"}

    # 3. Salva no disco
    try:
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        with open(config_path, "w") as f:
            json.dump(data, f, indent=4)
    except Exception as e:
        logger.error(f"Erro ao salvar config: {e}")
        raise HTTPException(status_code=500, detail="Erro ao salvar configurações")
        
    # 4. Agenda restart (em thread separada para dar tempo de responder)
    def restart_process():
        time.sleep(2)
        logger.warning("REINICIANDO SERVIÇO PARA APLICAR CONFIGURAÇÕES...")
        os._exit(1) # Força exit, Docker restart policy cuida do resto
        
    threading.Thread(target=restart_process).start()
    
    return {
        "status": "saved", 
        "message": "Configurações salvas! O robô será reiniciado em instantes."
    }
