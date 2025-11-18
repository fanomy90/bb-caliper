from flask_admin.contrib.sqla import ModelView
from flask_admin.form import ImageUploadField
from flask import current_app
import os
from models import Product, Order, OrderItem, Customer


# === Админка для продуктов ===
class ProductAdmin(ModelView):
    form_extra_fields = {
        'image': ImageUploadField(
            'Изображение',
            base_path=lambda: os.path.join(current_app.static_folder, 'img/products'),
            url_relative_path='img/products/',
            namegen=lambda obj, file_data: file_data.filename.replace(' ', '_')
        )
    }

    column_list = ['id', 'name', 'brand', 'price', 'is_available', 'category']
    column_searchable_list = ['name', 'brand', 'article']
    column_filters = ['category.name', 'is_available']

    def on_model_change(self, form, model, is_created):
        if not is_created:
            try:
                old_model = self.session.get(self.model, model.id)
                if old_model and old_model.image and old_model.image != model.image:
                    old_path = os.path.join(current_app.static_folder, old_model.image)
                    if os.path.exists(old_path):
                        os.remove(old_path)
            except Exception as e:
                print("Ошибка при удалении старого изображения:", e)

    def on_model_delete(self, model):
        if model.image:
            path = os.path.join(current_app.static_folder, model.image)
            if os.path.exists(path):
                os.remove(path)

class CustomerAdmin(ModelView):
    can_create = True  # ← теперь можно создавать вручную
    can_edit = True
    can_delete = True
    column_list = ['id', 'name', 'phone', 'email', 'created_at']
    column_searchable_list = ['name', 'phone', 'email']
    column_filters = ['created_at']
    # Порядок полей в форме создания/редактирования
    form_columns = ['name', 'phone', 'email', 'created_at', 'orders']


# === Админка для заказов ===
class OrderAdmin(ModelView):
    can_create = True
    can_edit = True
    can_delete = True

    column_list = [
        'order_number', 'customer', 'total_amount',
        'status', 'created_at', 'paid_at', 'shipped_at',
        'completed_at', 'returned_at'
    ]

    column_searchable_list = ['order_number', 'customer.name']
    column_filters = [
        'status', 'created_at', 'paid_at', 'shipped_at', 'completed_at', 'returned_at'
    ]

    form_columns = [
        'order_number', 'customer', 'city', 'street', 'house', 'apt',
        'comment', 'payment_method', 'delivery_method',
        'status', 'total_amount', 'created_at',
        'paid_at', 'shipped_at', 'completed_at', 'returned_at'
    ]

    form_choices = {
        'status': [
            ('Новый', 'Новый'),
            ('Оплачен', 'Оплачен'),
            ('Отправлен', 'Отправлен'),
            ('Выполнен', 'Выполнен'),
            ('Возврат', 'Возврат')
        ]
    }




# === Админка для товаров в заказе (для просмотра) ===
class OrderItemAdmin(ModelView):
    can_create = False
    can_edit = False
    can_delete = False
    column_list = ['order_id', 'product_name', 'price', 'quantity']
