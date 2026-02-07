import sqlite3
import datetime

DB_NAME = "smart_shopper.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            family_size INTEGER,
            basket_type TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Products Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            asin TEXT PRIMARY KEY,
            name TEXT,
            basket_type TEXT,
            url TEXT,
            last_checked TIMESTAMP
        )
    ''')
    
    # Price History Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_asin TEXT,
            price REAL,
            checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(product_asin) REFERENCES products(asin)
        )
    ''')
    
    # Baskets (Mapping user preference to products - technically implicit via basket_type, 
    # but we might want custom baskets later. For now, we rely on basket_type in users and products)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")

def add_check_price(asin, price):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO price_history (product_asin, price) VALUES (?, ?)', (asin, price))
    cursor.execute('UPDATE products SET last_checked = CURRENT_TIMESTAMP WHERE asin = ?', (asin,))
    conn.commit()
    conn.close()

def get_product_price_history(asin, days=15):
    conn = get_connection()
    cursor = conn.cursor()
    # accurate replacement for "-15 days" in sqlite
    date_threshold = (datetime.datetime.now() - datetime.timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
    
    cursor.execute('''
        SELECT price FROM price_history 
        WHERE product_asin = ? AND checked_at >= ?
    ''', (asin, date_threshold))
    
    prices = [row[0] for row in cursor.fetchall()]
    conn.close()
    return prices

if __name__ == "__main__":
    init_db()
