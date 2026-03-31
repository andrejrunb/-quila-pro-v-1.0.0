import os
from app import create_app
from models import db, User

ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "andrejrunb@yahoo.com.br")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "André Ricardo")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Galo2020!")  # troque depois

app = create_app()

with app.app_context():
    db.create_all()

    user = User.query.filter_by(username=ADMIN_USERNAME).first()
    if user is None:
        user = User(
            username=ADMIN_USERNAME,
            email=ADMIN_EMAIL,
            name=ADMIN_NAME,
            role="admin",
            is_active=True,
        )
        user.set_password(ADMIN_PASSWORD)
        db.session.add(user)
        db.session.commit()
        print(f"Admin criado: {ADMIN_USERNAME} / {ADMIN_EMAIL}")
    else:
        user.email = ADMIN_EMAIL
        user.name = ADMIN_NAME
        user.role = "admin"
        user.is_active = True
        user.set_password(ADMIN_PASSWORD)
        db.session.commit()
        print(f"Admin atualizado: {ADMIN_USERNAME} / {ADMIN_EMAIL}")

print("OK")