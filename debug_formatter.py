from src.formatters.telegram_formatter import TelegramFormatter
from src.models import Promotion, Platform

def test():
    f = TelegramFormatter()
    
    # Simulate the product causing error
    # We found title "Cadeira para Auto 0-36 Kg Isofix Litet All Stages Preta - BB605" in logs
    # But let's add some tricky chars
    
    promo = Promotion(
        id="test",
        platform=Platform.AMAZON,
        url="http://amazon.com",
        affiliate_url="http://amzn.to/test",
        title="Produto Teste! Com Exclamação. E Ponto (Parenteses) - Traco",
        image_url="http://img.com",
        original_price=100.0,
        current_price=80.0,
        rating=4.5,
        review_count=100
    )
    
    result = f.format(promo)
    print("--- RAW RESULT ---")
    print(result)
    print("--- END ---")
    
    # Check if '!' is escaped
    if "!" in result and "\\!" not in result:
        print("FAIL: ! not escaped")
    else:
        print("CHECK: ! looks escaped or absent")

if __name__ == "__main__":
    test()
