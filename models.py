from flask_sqlalchemy import SQLAlchemy
from flask import url_for
from werkzeug.utils import cached_property
from datetime import datetime
import random
import string

db = SQLAlchemy()


# === Категории ===
class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)

    products = db.relationship('Product', backref='category', lazy=True)

    def __repr__(self):
        return f"{self.name}"


# === Товары ===
class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    brand = db.Column(db.String(200), nullable=False)
    article = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image = db.Column(db.String(300))
    description = db.Column(db.Text)
    characteristics = db.Column(db.String(200), nullable=False)

    is_available = db.Column(db.Boolean, default=True)
    is_favorites = db.Column(db.Boolean, default=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))

    @cached_property
    def image_url(self):
        if self.image:
            return url_for('static', filename=f'img/products/{self.image}')
        return url_for('static', filename='img/no-photo.png')

    def __repr__(self):
        return f"{self.name}"

class Customer(db.Model):
    __tablename__ = 'customers'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Связь с заказами
    orders = db.relationship('Order', backref='customer', lazy=True)

    def __repr__(self):
        return f"{self.name} ({self.phone})"
    def __str__(self):
        return f"{self.name} ({self.phone})"



# === Заказы ===
class Order(db.Model):
    __tablename__ = 'orders'
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    city = db.Column(db.String(100))
    street = db.Column(db.String(100))
    house = db.Column(db.String(20))
    apt = db.Column(db.String(20))
    comment = db.Column(db.Text)
    payment_method = db.Column(db.String(100))
    delivery_method = db.Column(db.String(100))
    total_amount = db.Column(db.Float, default=0)

    # Статус заказа
    status = db.Column(db.String(20), default='Новый', nullable=False)

    # Даты
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    paid_at = db.Column(db.DateTime)
    shipped_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    returned_at = db.Column(db.DateTime)
    # добавить отмену заказа
    # Связь с товарами (через промежуточную таблицу)
    items = db.relationship('OrderItem', backref='order', lazy=True, cascade="all, delete")

    def __repr__(self):
        # Используем связь с Customer
        if self.customer:
            return f"Заказ №{self.order_number} ({self.customer.name})"
        return f"Заказ №{self.order_number}"

    @staticmethod
    def generate_order_number():
        """Генерация уникального номера заказа"""
        return 'ORD-' + ''.join(random.choices(string.digits, k=8))

    #отображение телефона и почты покупателя в форме редактирования заказа
    @property
    def customer_phone(self):
        return self.customer.phone if self.customer else ""

    @property
    def customer_email(self):
        return self.customer.email if self.customer else ""


# === Товары в заказе ===
class OrderItem(db.Model):
    __tablename__ = 'order_items'
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    product_name = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)

    def __repr__(self):
        return f"{self.product_name} x{self.quantity}"
