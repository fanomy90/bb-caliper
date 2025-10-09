from flask import Flask, render_template, abort, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from config import Config
from models import db, Product, Category
import logging


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Формат логов
    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s [in %(pathname)s:%(lineno)d]"
    )

    # 1️⃣ — Лог в файл
    file_handler = logging.FileHandler("app.log", encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)

    # 2️⃣ — Лог в консоль
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)

    # Добавляем оба обработчика
    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)

    app.logger.info("🚀 Приложение запущено")

    db.init_app(app)

    @app.route('/')
    def index():
        # можно показать новинки или популярные категории
        categories = Category.query.all()
        products = Product.query.filter_by(is_available=True).limit(6).all()
        return render_template('index.html', categories=categories, products=products)

    @app.route('/catalog')
    def catalog():
        # все товары
        products = Product.query.filter_by(is_available=True).all()
        return render_template('catalog.html', products=products)

    @app.route('/category/<slug>')
    def category_page(slug):
        cat = Category.query.filter_by(slug=slug).first()
        if not cat:
            abort(404)
        products = Product.query.filter_by(category=cat, is_available=True).all()
        return render_template('category.html', category=cat, products=products)

    @app.route('/product/<slug>')
    def product_page(slug):
        prod = Product.query.filter_by(slug=slug, is_available=True).first()
        if not prod:
            abort(404)
        # Можно показывать похожие товары и т.д.
        return render_template('product.html', product=prod)

    @app.route('/about')
    def about():
        return render_template('about.html')

    @app.route('/delivery')
    def delivery():
        return render_template('delivery.html')

    @app.route('/guarantee')
    def guarantee():
        return render_template('guarantee.html')

    @app.route('/reviews')
    def reviews():
        return render_template('reviews.html')

    @app.route('/contact')
    def contact():
        return render_template('contact.html')
    
    @app.route("/send", methods=["POST"])
    def send_message():
        name = request.form.get("name")
        phone = request.form.get("phone")
        message = request.form.get("message")
        print(f"[Заявка] {name} ({phone}): {message}")  # пока просто логируем
        # Можно добавить отправку письма или в Telegram
        return jsonify({"status": "ok"})

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True)
