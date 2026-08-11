# Smart Shopper Bot 🛒

A Telegram bot that monitors prices of grocery items on Amazon and notifies you when there are real discounts.

## Features
- **Onboarding**: Customized flow to set up user profile (Family Size, Basket Type).
- **Price Monitoring**: Checks prices automatically (mocked for now).
- **Smart Alerts**: Only notifies when prices are 10% below the 15-day average.
- **Affiliate Links**: Monetization via Amazon Affiliate program.

## Setup
1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
2. Update `bot.py` with your Telegram Bot Token.
3. Run the bot:
   ```
   python bot.py
   ```

## Architecture
- `bot.py`: Main bot logic and user interaction.
- `monitor.py`: Background scheduler for price checks.
- `database.py`: SQLite database management.
- `amazon_api.py`: Mock Amazon API for price fetching.
