from flask_sqlalchemy import SQLAlchemy
from flask import url_for
from werkzeug.utils import cached_property

db = SQLAlchemy()

class Category(db.Model):
    __tablename__ = 'categories'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)

    products = db.relationship('Product', backref='category', lazy=True)

    def __repr__(self):
        return f"{self.name}"  # ✅ возвращаем строку


class Product(db.Model):
    __tablename__ = 'products'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    brand = db.Column(db.String(200), nullable=False)
    article = db.Column(db.String(200), nullable=False)
    price = db.Column(db.Float, nullable=False)
    image = db.Column(db.String(300)) # путь вида 'products/filename.jpg'
    description = db.Column(db.Text)
    characteristics = db.Column(db.String(200), nullable=False)
    
    is_available = db.Column(db.Boolean, default=True)
    is_favorites = db.Column(db.Boolean, default=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    #гибкий путь до картинок
    @cached_property
    def image_url(self):
        if self.image:
            return url_for('static', filename=f'img/products/{self.image}')
        return url_for('static', filename='img/no-photo.png')

    def __repr__(self):
        return f"{self.name}"  # ✅ строка, не tuple
