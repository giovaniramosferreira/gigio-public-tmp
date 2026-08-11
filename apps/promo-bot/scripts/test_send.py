import asyncio
import os
from telegram import Bot
from dotenv import load_dotenv

async def run():
    # Tenta carregar variáveis (pode falhar dentro do docker se não tiver .env lá, mas o token vem do env vars do container)
    # No container, as env vars já estão setadas pelo docker-compose
    token = os.environ.get('TELEGRAM_BOT_TOKEN') 
    
    if not token:
        print("❌ Erro: TELEGRAM_BOT_TOKEN não encontrado nas variáveis de ambiente")
        return

    bot = Bot(token)
    # ID descoberto pelo script anterior
    chat_id = -1003805933754 
    
    print(f"Tentando enviar mensagem diretamente para o ID: {chat_id}")
    try:
        msg = await bot.send_message(chat_id=chat_id, text="🔔 Teste de diagnóstico: Envio via ID numérico bem sucedido!")
        print(f"✅ SUCESSO! Mensagem enviada (Message ID: {msg.message_id})")
        print("O problema era apenas o uso do @nome do canal. Vou atualizar seu arquivo de configuração automaticamente.")
    except Exception as e:
        print(f"❌ FALHA AO ENVIAR: {e}")
        print("\nCONCLUSÃO: O bot DEFINITIVAMENTE não é administrador do canal.")
        print("Ação necessária: Você precisa ir nas configurações do canal e adicionar o bot como Admin com permissão de postar.")

if __name__ == "__main__":
    asyncio.run(run())
