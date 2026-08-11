# Promo Bot

Sistema automatizado para divulgação de promoções de e-commerce via Telegram.

## Configuração Rápida

### 1. Copie o arquivo de configuração

```bash
cp .env.example .env
```

### 2. Configure suas credenciais no `.env`

**Obrigatório:**
- `TELEGRAM_BOT_TOKEN`: Crie um bot no [@BotFather](https://t.me/botfather)
- `TELEGRAM_CHANNEL_ID`: ID do seu canal (ex: `@seu_canal` ou `-1001234567890`)

**Afiliados (configure ao menos um):**
- Amazon Associates
- Shopee Afiliados
- Mercado Livre Afiliados

### 3. Inicie com Docker

```bash
docker-compose up -d
```

### 4. Veja os logs

```bash
docker-compose logs -f promo-bot
```

## Comandos Úteis

```bash
# Parar
docker-compose down

# Reiniciar
docker-compose restart promo-bot

# Ver status
docker-compose ps
```

## Filtros Padrão

| Configuração | Valor | Descrição |
|--------------|-------|-----------|
| MIN_DISCOUNT | 30% | Desconto mínimo |
| MIN_RATING | 4.0 | Avaliação mínima |
| MAX_PRICE | R$ 500 | Preço máximo |
| POSTS_PER_HOUR | 5 | Posts por hora |

## Estrutura

```
src/
├── collectors/    # Coletores (Amazon, Shopee, ML)
├── filters/       # Filtros de qualidade
├── formatters/    # Formatação de mensagens
├── bot/           # Bot Telegram
├── scheduler/     # Agendamento
└── main.py        # Entrada
```
