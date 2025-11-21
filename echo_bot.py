from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
from bb_secrets import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        f"Привет! Я эхо-бот. Ваш chat_id: {update.message.chat.id}"
    )

async def echo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.message.chat.id
    text = update.message.text
    await update.message.reply_text(f"Эхо: {text}\nВаш chat_id: {chat_id}")

def main():
    app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, echo))

    print("Бот запущен...")
    app.run_polling()

if __name__ == "__main__":
    main()
