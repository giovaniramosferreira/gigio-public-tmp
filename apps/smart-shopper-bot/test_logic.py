import database
import monitor
import amazon_api
import time

# Mock bot for testing
class MockBot:
    def send_message(self, chat_id, text, parse_mode=None):
        print(f"--- MOCK ALERT SENT TO {chat_id} ---")
        print(text)
        print("-----------------------------------")

def test_monitoring_logic():
    print("Testing Monitoring Logic...")
    conn = database.get_connection()
    cursor = conn.cursor()
    
    # Pick a product, e.g., 'B00001' (Arroz Tipo 1)
    asin = 'B00001'
    
    # Insert high price history (e.g., 100.00)
    # We need to manually insert older records because add_check_price uses CURRENT_TIMESTAMP
    print("Inserting high price history...")
    for i in range(10):
        try:
            database.add_check_price(asin, 100.00) 
        except Exception:
             # Manually insert if add_check_price is too simple
             cursor.execute("INSERT INTO price_history (product_asin, price, checked_at) VALUES (?, ?, datetime('now', '-1 day'))", (asin, 100.00))
    
    conn.commit()
    conn.close()
    
    # Now patch amazon_api.get_price to return a low price (e.g., 50.00)
    original_get_price = amazon_api.get_price
    amazon_api.get_price = lambda x: 50.00 if x == asin else 100.00
    
    # Create a dummy user to receive the alert
    conn = database.get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO users (id, name, family_size, basket_type) VALUES (12345, 'TestUser', 3, 'cheap')")
    conn.commit()
    conn.close()

    print("Running check_prices...")
    mock_bot = MockBot()
    monitor.check_prices(mock_bot)
    
    # Restore
    amazon_api.get_price = original_get_price
    print("Test Complete.")

if __name__ == "__main__":
    test_monitoring_logic()
