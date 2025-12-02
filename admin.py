from flask_admin.contrib.sqla import ModelView
from flask_admin.form import ImageUploadField
from flask import current_app
import os
from models import Product, Order, OrderItem, Customer
from wtforms import StringField

# формат времени для админки
def fmt(view, context, model, name):
    value = getattr(model, name)
    return value.strftime("%Y-%m-%d %H:%M:%S") if value else ""


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
    column_auto_select_related = True #автоподключение связей моделей
    can_create = True
    can_edit = True
    can_delete = True

    column_list = [
        'order_number', 'customer', 'customer.phone', 'customer.email', 'total_amount',
        'status', 'created_at', 'paid_at', 'shipped_at', 'completed_at', 'returned_at'
        # добавить отмену заказа
    ]

    column_searchable_list = ['order_number', 'customer.name', 'customer.phone', 'customer.email']
    column_filters = [
        'status', Customer.phone, Customer.email, 'created_at', 'paid_at', 'shipped_at', 'completed_at', 'returned_at'
        # добавить отмену заказа
    ]

    # НЕ включаем customer_phone и customer_email в form_columns!
    form_columns = [
        'order_number', 'customer', 'customer_phone', 'customer_email',
        'city', 'street', 'house', 'apt',
        'comment', 'payment_method', 'delivery_method',
        'status', 'total_amount', 'created_at',
        'paid_at', 'shipped_at', 'completed_at', 'returned_at'
    ]

    form_extra_fields = {
        'customer_phone': StringField('Телефон покупателя', render_kw={'readonly': True}),
        'customer_email': StringField('Email покупателя', render_kw={'readonly': True}),
    }

    def on_form_prefill(self, form, id):
        order = self.get_one(id)
        if order.customer:
            form.customer_phone.data = order.customer.phone
            form.customer_email.data = order.customer.email

    form_choices = {
        'status': [
            ('Новый', 'Новый'),
            ('Оплачен', 'Оплачен'),
            ('Отправлен', 'Отправлен'),
            ('Выполнен', 'Выполнен'),
            ('Возврат', 'Возврат')
            # добавить отмену заказа
        ]
    }
    column_labels = {
        'order_number': 'Номер заказа',
        'customer': 'Покупатель',
        'total_amount': 'Сумма в ₽',
        'status': 'Статус заказа',
        'created_at': 'Создан',
        'paid_at': 'Оплачен',
        'shipped_at': 'Отправлен',
        'completed_at': 'Завершён',
        'returned_at': 'Возврат',
        # добавить отмену заказа

        # связанные поля (через relationship)
        'customer.phone': 'Телефон покупателя',
        'customer.email': 'Email покупателя',
        'customer.name': 'Имя покупателя'
    }
    #формат времени
    column_formatters = {
        #'customer': lambda v, c, m, p: f"{m.customer.name} | {m.customer.phone} | {m.customer.email}",
        'created_at': fmt,
        'paid_at': fmt,
        'shipped_at': fmt,
        'completed_at': fmt,
        'returned_at': fmt,
    }




# === Админка для товаров в заказе (для просмотра) ===
class OrderItemAdmin(ModelView):
    can_create = False
    can_edit = False
    can_delete = False
    column_list = ['order_id', 'product_name', 'price', 'quantity']
