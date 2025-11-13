from flask_admin.contrib.sqla import ModelView
from flask_admin.form import ImageUploadField
from flask import current_app
import os

class ProductAdmin(ModelView):
    form_extra_fields = {
        'image': ImageUploadField(
            'Изображение',
            base_path=lambda: os.path.join(current_app.static_folder, 'img/products'),
            url_relative_path='img/products/',
            namegen=lambda obj, file_data: file_data.filename.replace(' ', '_')
        )
    }

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
