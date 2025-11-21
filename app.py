from flask import Flask, render_template, abort, request, jsonify, Blueprint
from flask_sqlalchemy import SQLAlchemy
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from flask_admin.form import ImageUploadField
from datetime import datetime, timedelta, timezone
from config import Config
from models import db, Product, Category
import logging
import os
import json
from models import db, Product, Category, Order, OrderItem, Customer
from admin import ProductAdmin, CustomerAdmin, OrderAdmin, OrderItemAdmin
import requests
from datetime import datetime, timedelta
from bb_secrets import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

# блок работы с телеграм ботом

def send_telegram_order(order):
    customer = order.customer

    text = f"""
🆕 *Новый заказ!*

📦 *Номер:* {order.order_number}
👤 *Имя:* {customer.name}
📞 *Телефон:* {customer.phone}
📧 *Email:* {customer.email}

🏙 *Город:* {order.city}
📬 *Адрес:* {order.street} {order.house}, кв {order.apt}

💳 *Оплата:* {order.payment_method}
🚚 *Доставка:* {order.delivery_method}

💰 *Сумма:* {order.total_amount} ₽

🛒 *Товары:*
"""

    for item in order.items:
        text += f"- {item.product_name} × {item.quantity} = {item.price * item.quantity} ₽\n"

    requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
        json={
            "chat_id": TELEGRAM_CHAT_ID,
            "text": text,
            "parse_mode": "Markdown"
        }
    )

#блок обработки маршрутов сайта
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # логирование в файл
    logging.basicConfig(
        filename="app.log",
        level=logging.INFO,
        format="%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
    )
    logger = logging.getLogger(__name__)
    logger.info("🚀 Приложение запущено")

    db.init_app(app)

    admin = Admin(app, name="Автозапчасти Admin", template_mode='bootstrap4')
    admin.add_view(ModelView(Category, db.session))
    # admin.add_view(ModelView(Product, db.session))
    admin.add_view(ProductAdmin(Product, db.session))
    admin.add_view(CustomerAdmin(Customer, db.session))
    admin.add_view(OrderAdmin(Order, db.session))
    #admin.add_view(OrderItemAdmin(OrderItem, db.session))

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
    # обработка избранного
    @app.route('/favorites')
    def favorites_page():
        return render_template("favorites.html")
    @app.route("/favorites/cards")
    def favorites_cards():
        ids = request.args.get("ids", "")
        if not ids:
            return "<p>Товары не найдены.</p>"
        try:
            id_list = [int(i) for i in ids.split(",") if i.isdigit()]
        except ValueError:
            return "<p>Неверный формат ID.</p>"
        products = Product.query.filter(Product.id.in_(id_list), Product.is_available==True).all()
        if not products:
            return "<p>Товары не найдены.</p>"
        return render_template("_product_cards.html", products=products)

    # Обработка корзины
    @app.route('/carts')
    def carts_page():
        return render_template("carts.html")
    @app.route("/carts/cards")
    def carts_cards():
        ids = request.args.get("ids", "")
        if not ids:
            return "<p>Товары не найдены.</p>"
        try:
            id_list = [int(i) for i in ids.split(",") if i.isdigit()]
        except ValueError:
            return "<p>Неверный формат ID.</p>"
        products = Product.query.filter(Product.id.in_(id_list), Product.is_available==True).all()
        if not products:
            return "<p>Товары не найдены.</p>"
        return render_template("_product_cards.html", products=products)
    
    @app.route('/api/product/<int:product_id>')
    def api_product(product_id):
        product = Product.query.get(product_id)
        if not product:
            return jsonify({"status": "error", "message": "Товар не найден"}), 404
        return jsonify({
            "status": "ok",
            "product": {
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "price": product.price,
                "image_url": product.image_url
            }
        })
    
    api = Blueprint("api", __name__)

    @app.route("/api/create-order", methods=["POST"])
    def create_order():
        data = request.json
        if not data:
            return jsonify({"error": "Нет данных"}), 400
    
        # --- Данные покупателя ---
        name = data.get("name")
        email = data.get("email")
        phone = data.get("phone")
    
        # --- Адрес и доставка ---
        city = data.get("city")
        street = data.get("street")
        house = data.get("house")
        apt = data.get("apt")
        comment = data.get("comment")
        payment_method = data.get("payment")
        delivery_method = data.get("delivery")
    
        # --- Корзина ---
        items = data.get("items", [])
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except Exception:
                return jsonify({"error": "Некорректные данные корзины"}), 400
    
        if not items:
            return jsonify({"error": "Корзина пуста"}), 400
    
        # --- Проверка дублей по телефону или email за всё время ---
        duplicate = Order.query.join(Customer).filter(
            (Customer.phone == phone) | (Customer.email == email)
        ).first()
    
        if duplicate:
            return jsonify({"duplicate": True, "order_number": duplicate.order_number}), 409
    
        # --- Поиск или создание покупателя ---
        customer = Customer.query.filter(
            (Customer.phone == phone) | (Customer.email == email)
        ).first()
        if not customer:
            customer = Customer(name=name, email=email, phone=phone)
            db.session.add(customer)
            db.session.flush()  # чтобы получить id
    
        # --- Создание заказа ---
        order_number = Order.generate_order_number()
        order = Order(
            order_number=order_number,
            customer_id=customer.id,
            city=city,
            street=street,
            house=house,
            apt=apt,
            comment=comment,
            payment_method=payment_method,
            delivery_method=delivery_method,
            total_amount=0  # посчитаем ниже
        )
        db.session.add(order)
        db.session.flush()
    
        total_sum = 0
    
        # --- Добавление товаров в заказ ---
        for item in items:
            # item должен быть словарём вида {id: int, quantity: int}
            try:
                product_id = int(item.get("id"))
                quantity = int(item.get("quantity", 1))
            except (TypeError, ValueError):
                continue
            
            product = Product.query.get(product_id)
            if not product:
                continue
            
            total_sum += product.price * quantity
    
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                price=product.price,
                quantity=quantity
            )
            db.session.add(order_item)
    
        # --- Сумма заказа ---
        order.total_amount = total_sum
        db.session.commit()
    
        # --- Отправка уведомления в Telegram ---
        send_telegram_order(order)
    
        return jsonify({"success": True, "order_number": order.order_number})



    @app.route("/thanks")
    def thanks():
        order_number = request.args.get("order")
        return render_template("thanks.html", order_number=order_number)

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    app.run(debug=True)
