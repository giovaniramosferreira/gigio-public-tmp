import telebot
from telebot import types
import database
import monitor

# Placeholder for Bot Token - User needs to replace this
BOT_TOKEN = "8281737767:AAH8ahRxXAjqGif1lziVtbC0iQv-KRDQ8Kw"

bot = telebot.TeleBot(BOT_TOKEN)

# User state storage (simple in-memory for now, or we can use DB)
user_states = {}

@bot.message_handler(commands=['start'])
def send_welcome(message):
    chat_id = message.chat.id
    user_states[chat_id] = {'step': 'name'}
    
    markup = types.ReplyKeyboardRemove()
    bot.send_message(chat_id, "Olá! Bem-vindo ao *Smart Shopper Bot*! 🛒\n\nEu vou te ajudar a economizar nas compras de mercado monitorando os preços para você.\n\nPrimeiro, como você gostaria de ser chamado?", parse_mode='Markdown', reply_markup=markup)

@bot.message_handler(func=lambda message: True)
def handle_message(message):
    chat_id = message.chat.id
    if chat_id not in user_states:
        # If user talks without /start, maybe prompt them or ignore
        return

    state = user_states[chat_id]
    step = state.get('step')

    if step == 'name':
        state['name'] = message.text
        state['step'] = 'family_size'
        bot.send_message(chat_id, f"Prazer, {state['name']}! \n\nQual o tamanho da sua família? (Digite apenas o número, ex: 1, 3, 5)")
    
    elif step == 'family_size':
        try:
            size = int(message.text)
            state['family_size'] = size
            state['step'] = 'basket_type'
            
            markup = types.ReplyKeyboardMarkup(one_time_keyboard=True, resize_keyboard=True)
            markup.add('Barata 🟢', 'Intermediária 🟡', 'Premium 🔴')
            
            bot.send_message(chat_id, "Entendido. Agora, com qual tipo de Cesta você se identifica mais?\n\n🟢 *Barata*: Foco total em preço baixo.\n🟡 *Intermediária*: Equilibrio entre macas conhecidas e preço.\n🔴 *Premium*: Marcas top de linha e produtos diferenciados.", parse_mode='Markdown', reply_markup=markup)
        except ValueError:
            bot.send_message(chat_id, "Por favor, digite um número válido.")

    elif step == 'basket_type':
        basket_map = {
            'Barata 🟢': 'cheap',
            'Intermediária 🟡': 'intermediate',
            'Premium 🔴': 'premium'
        }
        
        choice = message.text
        if choice in basket_map:
            state['basket_type'] = basket_map[choice]
            
            # Save user to DB
            conn = database.get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO users (id, name, family_size, basket_type)
                VALUES (?, ?, ?, ?)
            ''', (chat_id, state['name'], state['family_size'], state['basket_type']))
            conn.commit()
            conn.close()
            
            # Start monitoring (or ensure products for this basket exist)
            # initialization logic here...
            
            bot.send_message(chat_id, f"Perfeito! Configuração concluída. ✅\n\nAgora eu vou monitorar os preços da cesta *{state['basket_type'].title()}* para você.\n\nFique tranquilo, eu só vou te avisar quando houver promoções REAIS! 📉", parse_mode='Markdown', reply_markup=types.ReplyKeyboardRemove())
            del user_states[chat_id]
        else:
            bot.send_message(chat_id, "Por favor, escolha uma das opções do menu.")

if __name__ == "__main__":
    print("Bot is running...")
    # Initialize DB if needed
    database.init_db()
    # Start Scheduler
    monitor.start_scheduler(bot)
    
    bot.infinity_polling()
