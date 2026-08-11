import asyncio
import os
from telegram import Bot
from dotenv import load_dotenv

async def debug():
    # Carrega .env se não estiver no env
    load_dotenv()
    
    token = os.getenv('TELEGRAM_BOT_TOKEN')
    channel = os.getenv('TELEGRAM_CHANNEL_ID')
    
    print(f"Token: {token[:10]}...")
    print(f"Channel: {channel}")
    
    bot = Bot(token)
    
    try:
        me = await bot.get_me()
        print(f"✅ Bot conectado: @{me.username} (ID: {me.id})")
    except Exception as e:
        print(f"❌ Erro ao conectar bot: {e}")
        return

    try:
        chat = await bot.get_chat(channel)
        print(f"✅ Canal encontrado: {chat.title} (ID: {chat.id})")
        print(f"   Tipo: {chat.type}")
        
        # Tenta verificar membro
        try:
            member = await bot.get_chat_member(chat.id, me.id)
            print(f"   Status do Bot no canal: {member.status}")
        except Exception as e:
            print(f"   ⚠️ Não consegui verificar status de membro: {e}")
            
    except Exception as e:
        print(f"❌ Erro ao acessar canal: {e}")
        print("   -> Verifique se o @username está correto e se o bot é admin.")

if __name__ == "__main__":
    asyncio.run(debug())
