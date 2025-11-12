from flask_admin.contrib.sqla import ModelView
from flask_admin.form import ImageUploadField
import os

class ProductAdmin(ModelView):
    form_extra_fields = {
        'image': ImageUploadField(
            'Изображение',
            base_path=os.path.join(os.path.dirname(__file__), 'static/img/products'),
            url_relative_path='img/products/',
            namegen=lambda obj, file_data: file_data.filename.replace(' ', '_')
        )
    }

    def on_model_change(self, form, model, is_created):
        if not is_created:
            # Если картинка изменилась — удалить старую
            try:
                old_model = self.session.get(self.model, model.id)
                if old_model and old_model.image and old_model.image != model.image:
                    old_path = os.path.join('static', old_model.image)
                    if os.path.exists(old_path):
                        os.remove(old_path)
            except Exception as e:
                print("Ошибка при удалении старого изображения:", e)


    # При удалении записи — удалить файл
    def on_model_delete(self, model):
        if model.image:
            path = os.path.join('static', model.image)
            if os.path.exists(path):
                os.remove(path)
