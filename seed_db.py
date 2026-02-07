import database
import amazon_api

def seed():
    conn = database.get_connection()
    cursor = conn.cursor()
    
    print("Seeding database with initial products...")
    
    for basket_type, products in amazon_api.INITIAL_PRODUCTS.items():
        for prod in products:
            # Check if product exists
            cursor.execute("SELECT asin FROM products WHERE asin = ?", (prod['asin'],))
            if not cursor.fetchone():
                cursor.execute('''
                    INSERT INTO products (asin, name, basket_type, url, last_checked)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ''', (prod['asin'], prod['name'], basket_type, prod['url']))
                print(f"Added {prod['name']} ({basket_type})")
    
    conn.commit()
    conn.close()
    print("Seeding complete.")

if __name__ == "__main__":
    database.init_db()
    seed()
