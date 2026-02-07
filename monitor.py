from apscheduler.schedulers.background import BackgroundScheduler
import time
import database
import amazon_api

def check_prices(bot):
    print("Checking prices...")
    conn = database.get_connection()
    cursor = conn.cursor()
    
    # Get all products
    cursor.execute("SELECT asin, name, basket_type, url FROM products")
    products = cursor.fetchall()
    
    alerts = {} # Key: basket_type, Value: list of good deals
    
    for asin, name, basket_type, url in products:
        current_price = amazon_api.get_price(asin)
        if current_price is None:
            continue
            
        # Save to history
        database.add_check_price(asin, current_price)
        
        # Calculate Average
        history = database.get_product_price_history(asin, days=15)
        if not history:
            continue
            
        avg_price = sum(history) / len(history)
        
        # Logic: Current Price < Average * 0.90 (10% discount)
        if current_price < (avg_price * 0.90):
            discount = ((avg_price - current_price) / avg_price) * 100
            if basket_type not in alerts:
                alerts[basket_type] = []
            
            alerts[basket_type].append({
                'name': name,
                'price': current_price,
                'old_price': avg_price,
                'discount': discount,
                'url': url
            })
            
    conn.close()
    
    # We might want to store these alerts to send them at 09:00, 
    # OR if this function runs AT 09:00, we send them now.
    # For this MVP, let's assume this function runs at the notification time.
    send_notifications(bot, alerts)

def send_notifications(bot, alerts):
    conn = database.get_connection()
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("SELECT id, basket_type FROM users")
    users = cursor.fetchall()
    
    for user_id, basket_type in users:
        deals = alerts.get(basket_type, [])
        if deals:
            msg = "⚡ **Oportunidades do Dia!** ⚡\n\n"
            msg += "Item | Preço | Desconto\n"
            msg += "---|---|---\n"
            total_savings = 0
            
            for deal in deals:
                msg += f"[{deal['name']}]({deal['url']}) | R$ {deal['price']:.2f} | -{deal['discount']:.0f}%\n"
                total_savings += (deal['old_price'] - deal['price'])
            
            msg += f"\n💰 **Economia Potencial: R$ {total_savings:.2f}**\n\n"
            msg += "[Comprar Cesta Completa](https://amazon.com.br/wishlist/generic)" # Placeholder
            
            try:
                bot.send_message(user_id, msg, parse_mode='Markdown')
            except Exception as e:
                print(f"Failed to send to {user_id}: {e}")
        else:
            # Optional: Send "No deals today" to build trust
             pass
             
    conn.close()

def start_scheduler(bot):
    scheduler = BackgroundScheduler()
    # Schedule check_prices to run daily at 09:00
    # For testing, we can make it run every minute or hour
    scheduler.add_job(check_prices, 'interval', minutes=60, args=[bot]) # Running every hour for now for demo
    # In production: scheduler.add_job(check_prices, 'cron', hour=9, args=[bot])
    scheduler.start()
