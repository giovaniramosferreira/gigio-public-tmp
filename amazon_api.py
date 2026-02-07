import random

# Mock database of initial products to seed the DB if needed
INITIAL_PRODUCTS = {
    'cheap': [
        {'asin': 'B00001', 'name': 'Arroz Tipo 1 (5kg)', 'url': 'https://amazon...'},
        {'asin': 'B00002', 'name': 'Feijão Carioca (1kg)', 'url': 'https://amazon...'},
        {'asin': 'B00003', 'name': 'Café Melitta (500g)', 'url': 'https://amazon...'},
    ],
    'intermediate': [
        {'asin': 'B00004', 'name': 'Arroz Tio João (5kg)', 'url': 'https://amazon...'},
        {'asin': 'B00005', 'name': 'Azeite Gallo (500ml)', 'url': 'https://amazon...'},
        {'asin': 'B00006', 'name': 'Café Pilão (500g)', 'url': 'https://amazon...'},
    ],
    'premium': [
        {'asin': 'B00007', 'name': 'Arroz Basmati (1kg)', 'url': 'https://amazon...'},
        {'asin': 'B00008', 'name': 'Azeite Trufado', 'url': 'https://amazon...'},
        {'asin': 'B00009', 'name': 'Café L\'Or Grãos (500g)', 'url': 'https://amazon...'},
    ]
}

def get_price(asin):
    # Mock price generator
    # Returns a random price between 10.00 and 100.00
    # Occasionally returns a "good deal" price (low)
    base_price = 50.00
    variation = random.uniform(-0.15, 0.15) # +/- 15%
    final_price = base_price * (1 + variation)
    return round(final_price, 2)
